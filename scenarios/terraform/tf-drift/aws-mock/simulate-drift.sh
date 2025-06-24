#!/bin/bash

# This script simulates manual AWS changes that cause Terraform drift
# In a real scenario, these would be actual AWS API calls

echo "Simulating manual AWS changes..."

# 1. Change security group SSH rule from 0.0.0.0/0 to specific IP
echo "✓ Security group SSH rule modified: 0.0.0.0/0 → 203.0.113.0/24"

# 2. Add Department tag to EC2 instance
echo "✓ EC2 instance tag added: Department=Engineering"

# 3. Enable S3 bucket versioning
echo "✓ S3 bucket versioning enabled"

# Create a mock state file showing the drift
cat > /home/devops/terraform/.drift-state <<EOF
DRIFT_SUMMARY:
- aws_security_group.web: SSH ingress rule modified
- aws_instance.web: Tag 'Department' added with value 'Engineering'
- aws_s3_bucket_versioning.logs: Status changed from 'Disabled' to 'Enabled'
EOF

echo ""
echo "Manual changes complete. Terraform state is now out of sync."