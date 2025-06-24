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

USER devops

# Make scripts executable
RUN chmod +x /home/devops/setup.sh

# Initialize the broken scenario
RUN /home/devops/setup.sh

CMD ["/bin/bash"]