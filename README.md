# SaasGlue Single Page Web App Automated Build Pipeline

## Prerequisites
1. AWS account
    - EC2 ssh access and a running EC2 instance
    - ECR repo
2. GitHub account
3. SaasGlue account - click [here](https://console.saasglue.com) to create an account

## Install
1. Copy the spa-build-pipeline repo to your GitHub account
    - Clone the spa-build-pipeline repo to your local machine
        ```
        $ git clone --depth 1 https://github.com/saascipes/spa-build-pipeline.git
        ```
    - Change directories into the spa-build-pipeline folder
        ```
        $ cd spa-build-pipeline
        ```
    - Push the repo to your GitHub account
        ```
        $ git push --mirror https://[your github username]:[your password or access key]@github.com/[your github username]/spa-build-pipeline.git
        ```
2. Make configuration changes to spa-build-pipeline code
    - Modify "config/production.json"
        - set the "rmqBrowserPushRoute" value to something unique, e.g. "sbp-bp-[your name]-[your birth year]"
        - set the "rmqStockQuotePublisherQueue" value to something unique, e.g. "stock-quote-publisher-[your name]-[your birth year]"
    - Set the same values in "config/default.json" and "config/test.json"
    - Modify "clientv1/src/utils/StompHandler.ts"
        - Add the value you entered for "rmqBrowserPushRoute" to this line after "${this.exchangeName}/"
            ```
            this.client.subscribe(`/exchange/${this.exchangeName}/`, this.onMessage.bind(this), subscribeHeaders);
            ```
            ->
            ```
            this.client.subscribe(`/exchange/${this.exchangeName}/sbp-bp-[your name]-[your birth year]`, this.onMessage.bind(this), subscribeHeaders);
            ```
    - Modify "build_agent_docker_image_aws.sh" - replace "[aws ecr repo url]" with your aws ecr repo url
        - Repeat for the following files:
            - "build_api_docker_image_aws.sh"
            - "build_stock_quote_publisher_image_aws.sh"
            - "deploy/terraform/deploy-prod/kubernetes.tf"
            - "deploy/terraform/deploy-test/kubernetes.tf"
    - Commit your changes and push to git
        ```
        $ git commit -m "update config"
        $ git push
        ```
3. Create and install SaasGlue API access credentials in GitHub
    - Log in to the [SaasGlue web console](https://console.saasglue.com)
    - Click your login name in the upper right hand corner and click "Access Keys"
    - Click the "User Access Keys" tab
    - Click "Create User Access Key"
    - Enter a description, e.g. "GitHub access"
    - Click "Select None"
    - Click the checkbox next to "JOB_CREATE"
    - Click "Create Access Key"
    - Copy the access key secret
    - Click the "I have copied the secret" button
    - Copy the access key id
    - Create a GitHub secret named "SG_ACCESS_KEY_ID" in your spa-build-pipeline repo with the SaasGlue access key id
    - Create a GitHub secret named "SG_ACCESS_SECRET" in your spa-build-pipeline repo with the SaasGlue access key secret
4. Install the SaasGlue Agent on an EC2 instance in the AWS environment where you will host the application and run the automated build
    - Download the linux Agent with one of these methods
        - Download from the [SaasGlue web console](https://console.saasglue.com)
            - Click the "Download Agent" link on the menu bar
            - Follow the instructions to unzip the Agent download and make it executable
            - Copy the Agent to your EC2 instance
        - **OR**
        - Run the python download script located in the project root directory with your Agent access key id and secret
            ```
            $ python download_sg_agent.py [access key id] [access jey secret] linux
            ```
    - Run the Agent
        ```
        $ ./sg-agent-launcher
        ```
    - Create sg.cfg configuration file (see above example)
        - Add Agent access keys
        - Add tag "terraform": "true", e.g.
        ```
        "tags": {
            "terraform": "true"
        }
        ```
5. Add your SaasGlue Agent access keys to "deploy/docker/sg-agent/sg.cfg" e.g.
    ```
    {
        "SG_ACCESS_KEY_ID": "xxxxxxxxxxxxxxxxxxxx",
        "SG_ACCESS_KEY_SECRET": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "tags": {
            "demo": "build-pipeline-1"
        }
    }
    ```
    - Replace the x's with your SaasGlue Agent access key id and secret
    - If you don't already have an Agent access key follow these steps to generate one:
        - Click your login name in the upper right hand corner and click "Access Keys"
        - Click "Create Agent Access Key"
        - Enter a description, e.g. "Build pipeline agent"
        - Click "Create Access Key"
        - Copy the access key secret
        - Click the "I have copied the secret" button
        - Copy the access key id
6. Import the SaasGlue Jobs

## TODO
1. ECR credentials hardcoded in ecr-auth.sh - is it even used? i don't think so - i'm removing it for now
2. Instructions for setting up ECR
3. Local dev environment? specific version of node and other components?
4. They will need instructions for setting up their own version of this git repo and for creating the github action

