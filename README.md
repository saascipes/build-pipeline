# SaasGlue Single Page Web App Automated Build Pipeline

## Prerequisites
1. AWS account
    - EC2 ssh access and a running EC2 instance
    - ECR repo
2. SaasGlue login - click [here](https://console.saasglue.com) to create a login

## Install
1. Install the SaasGlue Agent on an EC2 instance in the environment where you will host the application and run the automated build
    - Download the linux Agent with one of these methods
        - Download from the [SaasGlue web console](https://console.saasglue.com)
            - Click the "Download Agent" link on the menu bar
            - Follow the instructions to unzip the Agent download and make it executable
            - Copy the Agent to your EC2 instance
        - **OR**
        - Run the python download script located in the project root directory with your Agent access key id and secret
            ```
                python download_sg_agent.py [access key id] [access jey secret] linux
            ```
    - Run the Agent
        ```
        ./sg-agent-launcher
        ```
    - Create sg.cfg configuration file (see above example)
        - Add Agent access keys
        - Add tag "terraform": "true", e.g.
        ```
        "tags": {
            "terraform": "true"
        }
        ```

2. Add your SaasGlue Agent access keys to "deploy/docker/sg-agent/sg.cfg" e.g.
    ```
    {
        "SG_ACCESS_KEY_ID": "xxxxxxxxxxxxxxxxxxxx",
        "SG_ACCESS_KEY_SECRET": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "tags": {
            "demo": "build-pipeline-1"
        }
    }
    ```
    Replace the x's with your SaasGlue Agent access key id and secret. If you don't already have an Agent access key log in to the [SaasGlue web console](https://console.saasglue.com), click your login name in the upper right hand corner and click "Access Keys" from the pop-up menu.

3. Import the SaasGlue Jobs

## TODO
1. ECR credentials hardcoded in ecr-auth.sh - is it even used? i don't think so - i'm removing it for now
2. Instructions for setting up ECR
3. Local dev environment? specific version of node and other components?

