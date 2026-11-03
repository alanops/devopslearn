#!/bin/bash

# Stop on failure so the "SCENARIO READY" marker is only printed on success
set -e

echo "Setting up Keycloak CrashLoopBackOff scenario..."

# Create a kind cluster if not exists
if ! kind get clusters | grep -q devops-dojo; then
    echo "Creating kind cluster..."
    cat <<EOF | kind create cluster --name devops-dojo --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
EOF
fi

# kind runs on the host's Docker, so its API server is only reachable from here
# over the kind network. This also covers a cluster left by an earlier session.
docker network connect kind "$(hostname)"
kind export kubeconfig --name devops-dojo --internal

# Set kubectl context
kubectl config use-context kind-devops-dojo

# Apply the broken manifests
echo "Deploying broken Keycloak configuration..."
kubectl apply -f /home/devops/manifests/keycloak-broken.yaml

# Wait a bit for the pod to start crashing
sleep 10

echo ""
echo "=== SCENARIO READY ==="
echo "Keycloak is failing to start. Your mission:"
echo "1. Investigate why the Keycloak pod is in CrashLoopBackOff"
echo "2. Fix all configuration issues"
echo "3. Ensure Keycloak starts successfully"
echo ""
echo "Useful commands:"
echo "- kubectl get pods -n keycloak"
echo "- kubectl describe pod -n keycloak"
echo "- kubectl logs -n keycloak <pod-name>"
echo ""