#!/bin/bash

# Script to set up Railway PostgreSQL database
# Make sure you have Railway CLI installed: npm i -g @railway/cli

echo "🚀 Setting up Railway PostgreSQL database..."

# Run the schema
railway run psql < src/config/schema.sql

echo "✅ Database schema setup complete!"

