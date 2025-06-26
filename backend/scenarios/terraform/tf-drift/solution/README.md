# Terraform State Drift Solution

## Problem Analysis

The Terraform state has drifted from the actual AWS resources due to manual changes:

1. **Security Group SSH Rule**: Changed from 0.0.0.0/0 to specific IP
2. **EC2 Instance Tags**: Department tag added manually
3. **S3 Bucket Versioning**: Manually enabled in AWS Console

## Solution Steps

### 1. Identify the Drift
```bash
cd ~/terraform
terraform plan
```

You'll see Terraform wants to:
- Remove the Department tag from EC2 instance
- Change SSH rule back to 0.0.0.0/0
- Disable S3 bucket versioning

### 2. Refresh State (Partial Solution)
```bash
# This updates the state to match reality
terraform refresh

# Check what changed
terraform state list
terraform state show aws_instance.web
terraform state show aws_security_group.web
```

### 3. Update Terraform Code to Match Reality

#### Fix Security Group
Edit `main.tf` and update the SSH ingress rule:
```hcl
ingress {
  description = "SSH from office"
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["203.0.113.0/24"]  # Match the manually set IP range
}
```

#### Fix EC2 Tags
Add the Department tag to the EC2 instance:
```hcl
tags = {
  Name        = "devops-dojo-web-server"
  Environment = "training"
  Department  = "Engineering"  # Add this line
}
```

#### Fix S3 Versioning
Update the versioning configuration:
```hcl
resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  versioning_configuration {
    status = "Enabled"  # Change from Disabled to Enabled
  }
}
```

### 4. Verify No Drift
```bash
# Plan should show no changes
terraform plan

# If clean, you've successfully resolved the drift!
```

### 5. Best Practices to Prevent Drift

1. **Use Terraform for ALL changes** - Never modify resources manually
2. **Implement drift detection** - Run `terraform plan` regularly in CI
3. **Use resource locks** - Prevent manual changes with IAM policies
4. **Document emergency procedures** - When manual changes are necessary
5. **Regular state backups** - Enable state file versioning

## Alternative Approach: Import Resources

If you have resources created outside Terraform:
```bash
# Import existing resource into state
terraform import aws_instance.new_server i-1234567890abcdef0

# Then add the resource definition to match
```

## Key Learnings

1. State drift is inevitable in shared environments
2. Regular `terraform plan` helps detect drift early
3. Always update code to match desired state
4. Use `terraform refresh` carefully - it can mask problems
5. Consider using tools like Terragrunt or Atlantis for better workflows