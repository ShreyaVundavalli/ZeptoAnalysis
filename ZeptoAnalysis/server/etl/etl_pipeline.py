#!/usr/bin/env python3
"""
ETL Pipeline for Zepto E-commerce Inventory Data
Processes CSV data and loads it into PostgreSQL database
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os
import sys
from typing import Dict, List, Any
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ZeptoETLPipeline:
    """ETL Pipeline for processing Zepto inventory data"""
    
    def __init__(self):
        """Initialize the ETL pipeline with database connection"""
        self.db_config = {
            'host': os.getenv('PGHOST', 'localhost'),
            'port': int(os.getenv('PGPORT', 5432)),
            'database': os.getenv('PGDATABASE', 'zepto_project'),
            'user': os.getenv('PGUSER', 'postgres'),
            'password': os.getenv('PGPASSWORD', '0431')
        }
        self.connection = None
        
    def connect_to_database(self) -> bool:
        """Establish connection to PostgreSQL database"""
        try:
            self.connection = psycopg2.connect(**self.db_config)
            logger.info("Successfully connected to PostgreSQL database")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            return False
    
    def extract_data(self, csv_file_path: str) -> pd.DataFrame:
        """Extract data from CSV file"""
        try:
            logger.info(f"Extracting data from {csv_file_path}")
            df = pd.read_csv(csv_file_path)
            logger.info(f"Extracted {len(df)} rows from CSV")
            return df
        except Exception as e:
            logger.error(f"Failed to extract data: {e}")
            raise
    
    def transform_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform and clean the data"""
        logger.info("Starting data transformation")
        
        # Create a copy to avoid modifying original
        transformed_df = df.copy()
        
        # Clean column names - convert to snake_case
        column_mapping = {
            'Category': 'category',
            'name': 'name',
            'mrp': 'mrp',
            'discountPercent': 'discount_percent',
            'availableQuantity': 'available_quantity',
            'discountedSellingPrice': 'discounted_selling_price',
            'weightInGms': 'weight_in_gms',
            'outOfStock': 'out_of_stock',
            'quantity': 'quantity'
        }
        
        transformed_df = transformed_df.rename(columns=column_mapping)
        
        # Data type conversions and validation
        try:
            # Ensure numeric columns are properly typed
            numeric_columns = ['mrp', 'discount_percent', 'available_quantity', 
                             'discounted_selling_price', 'weight_in_gms', 'quantity']
            
            for col in numeric_columns:
                transformed_df[col] = pd.to_numeric(transformed_df[col], errors='coerce')
            
            # Handle boolean column
            transformed_df['out_of_stock'] = transformed_df['out_of_stock'].map({
                'TRUE': True, 'FALSE': False, True: True, False: False
            })
            
            # Clean text fields
            text_columns = ['category', 'name']
            for col in text_columns:
                transformed_df[col] = transformed_df[col].astype(str).str.strip()
            
            # Data validation and cleaning
            # Remove rows with missing essential data
            essential_columns = ['category', 'name', 'mrp', 'discounted_selling_price']
            transformed_df = transformed_df.dropna(subset=essential_columns)
            
            # Ensure prices are positive
            transformed_df = transformed_df[
                (transformed_df['mrp'] > 0) & 
                (transformed_df['discounted_selling_price'] > 0)
            ]
            
            # Ensure discount percent is between 0 and 100
            transformed_df = transformed_df[
                (transformed_df['discount_percent'] >= 0) & 
                (transformed_df['discount_percent'] <= 100)
            ]
            
            # Fill missing values with defaults
            transformed_df['available_quantity'] = transformed_df['available_quantity'].fillna(0)
            transformed_df['weight_in_gms'] = transformed_df['weight_in_gms'].fillna(0)
            transformed_df['quantity'] = transformed_df['quantity'].fillna(1)
            transformed_df['out_of_stock'] = transformed_df['out_of_stock'].fillna(False)
            
            logger.info(f"Transformation complete. {len(transformed_df)} rows ready for loading")
            return transformed_df
            
        except Exception as e:
            logger.error(f"Data transformation failed: {e}")
            raise
    
    def create_table_if_not_exists(self):
        """Create the zepto table if it doesn't exist"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS zepto (
            id SERIAL PRIMARY KEY,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            mrp INTEGER NOT NULL,
            discount_percent INTEGER NOT NULL,
            available_quantity INTEGER NOT NULL,
            discounted_selling_price INTEGER NOT NULL,
            weight_in_gms INTEGER NOT NULL,
            out_of_stock BOOLEAN NOT NULL DEFAULT FALSE,
            quantity INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_zepto_category ON zepto(category);
        CREATE INDEX IF NOT EXISTS idx_zepto_out_of_stock ON zepto(out_of_stock);
        CREATE INDEX IF NOT EXISTS idx_zepto_discount_percent ON zepto(discount_percent);
        """
        
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(create_table_sql)
                self.connection.commit()
                logger.info("Table 'zepto' created successfully")
        except Exception as e:
            logger.error(f"Failed to create table: {e}")
            raise
    
    def load_data(self, df: pd.DataFrame, batch_size: int = 1000) -> bool:
        """Load transformed data into PostgreSQL database"""
        try:
            logger.info(f"Loading {len(df)} rows into database")
            
            # Create table if it doesn't exist
            self.create_table_if_not_exists()
            
            # Clear existing data (optional - comment out if you want to append)
            with self.connection.cursor() as cursor:
                cursor.execute("TRUNCATE TABLE zepto RESTART IDENTITY;")
                logger.info("Cleared existing data from zepto table")
            
            # Prepare data for insertion
            columns = ['category', 'name', 'mrp', 'discount_percent', 'available_quantity',
                      'discounted_selling_price', 'weight_in_gms', 'out_of_stock', 'quantity']
            
            # Convert DataFrame to list of tuples
            data_tuples = [tuple(row) for row in df[columns].values]
            
            # Insert data in batches
            insert_sql = """
            INSERT INTO zepto (category, name, mrp, discount_percent, available_quantity,
                             discounted_selling_price, weight_in_gms, out_of_stock, quantity)
            VALUES %s
            """
            
            with self.connection.cursor() as cursor:
                for i in range(0, len(data_tuples), batch_size):
                    batch = data_tuples[i:i + batch_size]
                    execute_values(cursor, insert_sql, batch, page_size=batch_size)
                    logger.info(f"Loaded batch {i//batch_size + 1}: {len(batch)} rows")
                
                self.connection.commit()
                logger.info(f"Successfully loaded {len(data_tuples)} rows into database")
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            if self.connection:
                self.connection.rollback()
            raise
    
    def validate_loaded_data(self) -> Dict[str, Any]:
        """Validate the loaded data and return summary statistics"""
        try:
            with self.connection.cursor() as cursor:
                # Get basic statistics
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_products,
                        COUNT(DISTINCT category) as total_categories,
                        AVG(discount_percent) as avg_discount,
                        SUM(CASE WHEN out_of_stock = FALSE THEN 1 ELSE 0 END) as in_stock_products,
                        SUM(CASE WHEN out_of_stock = TRUE THEN 1 ELSE 0 END) as out_of_stock_products,
                        SUM(discounted_selling_price) as total_revenue
                    FROM zepto
                """)
                
                result = cursor.fetchone()
                
                validation_results = {
                    'total_products': result[0],
                    'total_categories': result[1],
                    'avg_discount': round(result[2], 2) if result[2] else 0,
                    'in_stock_products': result[3],
                    'out_of_stock_products': result[4],
                    'total_revenue': result[5],
                    'validation_timestamp': datetime.now().isoformat()
                }
                
                logger.info("Data validation completed successfully")
                return validation_results
                
        except Exception as e:
            logger.error(f"Data validation failed: {e}")
            raise
    
    def run_etl(self, csv_file_path: str) -> Dict[str, Any]:
        """Run the complete ETL pipeline"""
        try:
            logger.info("Starting ETL pipeline")
            start_time = datetime.now()
            
            # Connect to database
            if not self.connect_to_database():
                raise Exception("Failed to connect to database")
            
            # Extract
            raw_data = self.extract_data(csv_file_path)
            
            # Transform
            transformed_data = self.transform_data(raw_data)
            
            # Load
            self.load_data(transformed_data)
            
            # Validate
            validation_results = self.validate_loaded_data()
            
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            
            logger.info(f"ETL pipeline completed successfully in {execution_time:.2f} seconds")
            
            return {
                'status': 'success',
                'execution_time_seconds': execution_time,
                'rows_processed': len(transformed_data),
                'validation_results': validation_results
            }
            
        except Exception as e:
            logger.error(f"ETL pipeline failed: {e}")
            return {
                'status': 'failed',
                'error': str(e)
            }
        finally:
            if self.connection:
                self.connection.close()
                logger.info("Database connection closed")

def main():
    """Main function to run the ETL pipeline"""
    if len(sys.argv) != 2:
        print("Usage: python etl_pipeline.py <csv_file_path>")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    
    if not os.path.exists(csv_file_path):
        print(f"Error: CSV file not found: {csv_file_path}")
        sys.exit(1)
    
    # Initialize and run ETL pipeline
    etl = ZeptoETLPipeline()
    results = etl.run_etl(csv_file_path)
    
    if results['status'] == 'success':
        print("\n" + "="*50)
        print("ETL PIPELINE COMPLETED SUCCESSFULLY")
        print("="*50)
        print(f"Execution Time: {results['execution_time_seconds']:.2f} seconds")
        print(f"Rows Processed: {results['rows_processed']}")
        print("\nValidation Results:")
        for key, value in results['validation_results'].items():
            if key != 'validation_timestamp':
                print(f"  {key}: {value}")
        print("="*50)
    else:
        print(f"\nETL Pipeline Failed: {results['error']}")
        sys.exit(1)

if __name__ == "__main__":
    main()
