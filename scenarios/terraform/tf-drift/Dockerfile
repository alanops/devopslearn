FROM devopslearn/scenario-base:latest

USER root

# Copy scenario files
COPY --chown=devops:devops setup.sh /home/devops/
COPY --chown=devops:devops terraform/ /home/devops/terraform/
COPY --chown=devops:devops solution/ /home/devops/.solution/
COPY --chown=devops:devops aws-mock/ /home/devops/.aws-mock/

USER devops

# Set up AWS credentials (mock)
RUN mkdir -p ~/.aws && \
    echo "[default]" > ~/.aws/credentials && \
    echo "aws_access_key_id = AKIAIOSFODNN7EXAMPLE" >> ~/.aws/credentials && \
    echo "aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" >> ~/.aws/credentials && \
    echo "[default]" > ~/.aws/config && \
    echo "region = us-east-1" >> ~/.aws/config

# Make scripts executable
RUN chmod +x /home/devops/setup.sh /home/devops/.aws-mock/*.sh

# Initialize the broken scenario
RUN /home/devops/setup.sh

CMD ["/bin/bash"]