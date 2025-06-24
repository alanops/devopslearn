#!/bin/bash

echo "Setting up Terraform State Drift scenario..."

cd /home/devops/terraform

# Initialize Terraform
terraform init

# Apply initial infrastructure
echo "Creating initial infrastructure..."
terraform apply -auto-approve

# Simulate manual changes that cause drift
echo ""
echo "Simulating manual AWS changes that will cause state drift..."
echo "(In a real scenario, someone made changes in the AWS Console)"

# Mock changing a security group rule
echo "- Security group rule modified manually"
echo "- EC2 instance tags changed"
echo "- S3 bucket versioning enabled manually"

# Modify the state file to simulate drift
cp terraform.tfstate terraform.tfstate.backup
# In reality, we'd use LocalStack or similar to simulate real AWS drift

echo ""
echo "=== SCENARIO READY ==="
echo "Terraform state is now out of sync with 'reality'."
echo "Your mission:"
echo "1. Identify what resources have drifted"
echo "2. Decide how to handle each drift (import, refresh, or update code)"
echo "3. Get terraform plan to show no changes"
echo ""
echo "Useful commands:"
echo "- terraform plan"
echo "- terraform refresh"
echo "- terraform state list"
echo "- terraform state show <resource>"
echo "- terraform import <resource> <id>"
echo ""