#!/usr/bin/env python3
"""
Data Processor module for Zepto ETL Pipeline
Contains utility functions for data processing and validation
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any
import logging

logger = logging.getLogger(__name__)

class DataProcessor:
    """Utility class for data processing operations"""
    
    @staticmethod
    def clean_currency_values(df: pd.DataFrame, currency_columns: List[str]) -> pd.DataFrame:
        """Clean currency values by removing currency symbols and converting to paise"""
        cleaned_df = df.copy()
        
        for col in currency_columns:
            if col in cleaned_df.columns:
                # Remove currency symbols and convert to numeric
                cleaned_df[col] = cleaned_df[col].astype(str).str.replace('₹', '').str.replace(',', '')
                cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors='coerce')
                
                # Convert to paise (multiply by 100) if values seem to be in rupees
                if cleaned_df[col].mean() > 100:  # Assuming values > 100 are in paise already
                    continue
                else:
                    cleaned_df[col] = cleaned_df[col] * 100
                    
        return cleaned_df
    
    @staticmethod
    def validate_business_rules(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """Validate business rules and return cleaned data with validation messages"""
        validation_messages = []
        valid_df = df.copy()
        
        # Rule 1: MRP should be greater than discounted selling price
        invalid_pricing = valid_df['mrp'] < valid_df['discounted_selling_price']
        if invalid_pricing.any():
            count = invalid_pricing.sum()
            validation_messages.append(f"Removed {count} products with MRP < Selling Price")
            valid_df = valid_df[~invalid_pricing]
        
        # Rule 2: Discount percentage should match calculated discount
        valid_df['calculated_discount'] = ((valid_df['mrp'] - valid_df['discounted_selling_price']) / valid_df['mrp']) * 100
        discount_mismatch = abs(valid_df['discount_percent'] - valid_df['calculated_discount']) > 1  # 1% tolerance
        
        if discount_mismatch.any():
            count = discount_mismatch.sum()
            validation_messages.append(f"Fixed {count} products with incorrect discount percentages")
            # Use calculated discount as the correct value
            valid_df.loc[discount_mismatch, 'discount_percent'] = valid_df.loc[discount_mismatch, 'calculated_discount'].round().astype(int)
        
        # Remove the temporary column
        valid_df = valid_df.drop('calculated_discount', axis=1)
        
        # Rule 3: Out of stock products should have 0 available quantity
        invalid_stock = (valid_df['out_of_stock'] == True) & (valid_df['available_quantity'] > 0)
        if invalid_stock.any():
            count = invalid_stock.sum()
            validation_messages.append(f"Fixed {count} out-of-stock products with non-zero availability")
            valid_df.loc[invalid_stock, 'available_quantity'] = 0
        
        # Rule 4: Products with 0 available quantity should be marked as out of stock
        zero_quantity = (valid_df['available_quantity'] == 0) & (valid_df['out_of_stock'] == False)
        if zero_quantity.any():
            count = zero_quantity.sum()
            validation_messages.append(f"Marked {count} zero-quantity products as out of stock")
            valid_df.loc[zero_quantity, 'out_of_stock'] = True
        
        return valid_df, validation_messages
    
    @staticmethod
    def detect_outliers(df: pd.DataFrame, column: str, method: str = 'iqr') -> pd.Series:
        """Detect outliers in a numeric column using specified method"""
        if method == 'iqr':
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            return (df[column] < lower_bound) | (df[column] > upper_bound)
        
        elif method == 'zscore':
            z_scores = np.abs((df[column] - df[column].mean()) / df[column].std())
            return z_scores > 3
        
        else:
            raise ValueError("Method must be 'iqr' or 'zscore'")
    
    @staticmethod
    def generate_data_quality_report(df: pd.DataFrame) -> Dict[str, Any]:
        """Generate a comprehensive data quality report"""
        report = {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'missing_values': {},
            'data_types': {},
            'unique_counts': {},
            'outliers': {},
            'category_distribution': {},
            'price_statistics': {}
        }
        
        # Missing values analysis
        for col in df.columns:
            missing_count = df[col].isnull().sum()
            missing_percentage = (missing_count / len(df)) * 100
            report['missing_values'][col] = {
                'count': int(missing_count),
                'percentage': round(missing_percentage, 2)
            }
        
        # Data types
        report['data_types'] = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        # Unique value counts
        report['unique_counts'] = {col: int(df[col].nunique()) for col in df.columns}
        
        # Outlier detection for numeric columns
        numeric_columns = ['mrp', 'discounted_selling_price', 'discount_percent', 'weight_in_gms']
        for col in numeric_columns:
            if col in df.columns:
                outliers = DataProcessor.detect_outliers(df, col)
                report['outliers'][col] = {
                    'count': int(outliers.sum()),
                    'percentage': round((outliers.sum() / len(df)) * 100, 2)
                }
        
        # Category distribution
        if 'category' in df.columns:
            category_counts = df['category'].value_counts()
            report['category_distribution'] = {
                cat: int(count) for cat, count in category_counts.items()
            }
        
        # Price statistics
        if 'mrp' in df.columns and 'discounted_selling_price' in df.columns:
            report['price_statistics'] = {
                'avg_mrp': round(df['mrp'].mean(), 2),
                'avg_selling_price': round(df['discounted_selling_price'].mean(), 2),
                'avg_discount': round(df['discount_percent'].mean(), 2),
                'max_discount': int(df['discount_percent'].max()),
                'min_discount': int(df['discount_percent'].min())
            }
        
        return report
    
    @staticmethod
    def standardize_category_names(df: pd.DataFrame) -> pd.DataFrame:
        """Standardize category names by removing extra spaces and fixing common issues"""
        cleaned_df = df.copy()
        
        if 'category' in cleaned_df.columns:
            # Remove leading/trailing spaces and normalize
            cleaned_df['category'] = cleaned_df['category'].str.strip()
            
            # Fix common naming inconsistencies
            category_mapping = {
                'Fruits & Vegetables': 'Fruits & Vegetables',
                'Fruits and Vegetables': 'Fruits & Vegetables',
                'Fruits&Vegetables': 'Fruits & Vegetables',
                'Cooking Essentials': 'Cooking Essentials',
                'CookingEssentials': 'Cooking Essentials',
                'Cooking essentials': 'Cooking Essentials'
            }
            
            cleaned_df['category'] = cleaned_df['category'].replace(category_mapping)
            
        return cleaned_df
    
    @staticmethod
    def enrich_data(df: pd.DataFrame) -> pd.DataFrame:
        """Enrich data with additional calculated fields"""
        enriched_df = df.copy()
        
        # Calculate savings amount
        enriched_df['savings_amount'] = enriched_df['mrp'] - enriched_df['discounted_selling_price']
        
        # Calculate price per gram for weight-based comparison
        enriched_df['price_per_gram'] = enriched_df['discounted_selling_price'] / enriched_df['weight_in_gms']
        enriched_df['price_per_gram'] = enriched_df['price_per_gram'].replace([np.inf, -np.inf], 0)
        
        # Create weight categories
        enriched_df['weight_category'] = pd.cut(
            enriched_df['weight_in_gms'], 
            bins=[0, 100, 500, 1000, 5000, float('inf')],
            labels=['Very Light (<100g)', 'Light (100-500g)', 'Medium (500g-1kg)', 'Heavy (1-5kg)', 'Very Heavy (>5kg)']
        )
        
        # Create price categories
        enriched_df['price_category'] = pd.cut(
            enriched_df['discounted_selling_price'], 
            bins=[0, 1000, 5000, 10000, 50000, float('inf')],
            labels=['Budget (<₹10)', 'Affordable (₹10-50)', 'Mid-range (₹50-100)', 'Premium (₹100-500)', 'Luxury (>₹500)']
        )
        
        # Create discount categories
        enriched_df['discount_category'] = pd.cut(
            enriched_df['discount_percent'],
            bins=[0, 5, 15, 25, 50, 100],
            labels=['Minimal (0-5%)', 'Low (5-15%)', 'Medium (15-25%)', 'High (25-50%)', 'Very High (50%+)']
        )
        
        return enriched_df
