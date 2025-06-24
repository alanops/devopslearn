# Keycloak CrashLoopBackOff Solution

## Problem Analysis

The Keycloak pod is failing to start due to several configuration issues:

1. **Missing Secrets**: The deployment references secrets that don't exist
   - `keycloak-db-secret` for database password
   - `keycloak-admin-secret` for admin password

2. **Missing ConfigMap Key**: The `DB_ADDR` key is missing from the ConfigMap

3. **No Database**: Keycloak is configured to use PostgreSQL but no database is deployed

4. **Insufficient Resources**: Memory and CPU limits are too low for Keycloak

## Solution Steps

### 1. Check Pod Status
```bash
kubectl get pods -n keycloak
kubectl describe pod -n keycloak keycloak-0
kubectl logs -n keycloak keycloak-0
```

### 2. Create Missing Secrets
```bash
# Create database password secret
kubectl create secret generic keycloak-db-secret \
  --from-literal=password=keycloakpass \
  -n keycloak

# Create admin password secret  
kubectl create secret generic keycloak-admin-secret \
  --from-literal=password=adminpass \
  -n keycloak
```

### 3. Fix ConfigMap
```bash
# Edit the ConfigMap to add DB_ADDR
kubectl edit configmap keycloak-config -n keycloak

# Add this line under data:
# DB_ADDR: postgres-service.keycloak.svc.cluster.local
```

### 4. Deploy PostgreSQL Database
```bash
# Apply the complete fixed configuration
kubectl apply -f /home/devops/.solution/keycloak-fixed.yaml
```

### 5. Increase Resource Limits
The fixed configuration includes:
- Memory: 1Gi limit, 512Mi request
- CPU: 1000m limit, 500m request

### 6. Verify Success
```bash
# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=keycloak -n keycloak --timeout=300s
kubectl wait --for=condition=ready pod -l app=postgres -n keycloak --timeout=300s

# Check pod status
kubectl get pods -n keycloak

# Test Keycloak health endpoint
kubectl port-forward -n keycloak svc/keycloak 8080:8080 &
curl http://localhost:8080/health/ready
```

## Key Learnings

1. Always verify that referenced ConfigMaps and Secrets exist
2. Check resource requirements for applications
3. Ensure dependent services (like databases) are deployed
4. Use proper health checks and startup delays
5. Monitor logs during troubleshooting