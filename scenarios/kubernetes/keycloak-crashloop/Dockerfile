FROM devopslearn/scenario-base:latest

USER root

# Install kind for local Kubernetes
RUN curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64 \
    && chmod +x ./kind \
    && mv ./kind /usr/local/bin/kind

# Copy scenario files
COPY --chown=devops:devops setup.sh /home/devops/
COPY --chown=devops:devops manifests/ /home/devops/manifests/
COPY --chown=devops:devops solution/ /home/devops/.solution/

USER root

# Copy entrypoint script
COPY --chown=devops:devops entrypoint.sh /home/devops/

# Make scripts executable
RUN chmod +x /home/devops/setup.sh /home/devops/entrypoint.sh

USER devops

# Use entrypoint to run setup at container start time
ENTRYPOINT ["/home/devops/entrypoint.sh"]