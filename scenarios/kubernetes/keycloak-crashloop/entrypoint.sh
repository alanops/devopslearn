#!/bin/bash

# Run the setup script to initialize the scenario
if ! /home/devops/setup.sh; then
    echo ""
    echo "Scenario setup failed - see the errors above."
    echo ""
fi

# Keep the container running with bash
exec /bin/bash
