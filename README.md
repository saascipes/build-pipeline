# SaasGlue Single Page Web App Automated Build Pipeline

## Prerequisites
1. AWS account
    - EC2 ssh access and a running EC2 instance
    - ECR repo
2. GitHub account
3. SaasGlue account - click [here](https://console.saasglue.com) to create an account
4. Installed software components
    - node version 10
    - npm current version
    - typescript

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
5. Create AWS ECR repositories for docker images
    - Create an ECR Registry in your AWS account
    - Create the following ECR Repositories:
        - sg_demo_buildpipeline_agent_1
        - sg_demo_buildpipeline_api
        - sg_demo_buildpipeline_client
        - sg_demo_stock_quote_publisher
6. Add your SaasGlue Agent access keys to "deploy/docker/sg-agent/sg.cfg" e.g.
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
7. Build the application
    - From the project root folder run
    ```
    $ npm i
    ```
    - From the clientv1 folder run
    ```
    $ npm run build
    ```
8. Build and deploy docker images
    ```
    $ ./build_agent_docker_image_aws.sh
    $ ./build_api_docker_image_aws.sh
    $ ./build_stock_quote_publisher_image_aws.sh
    ```
9. Import the SaasGlue Jobs (work in progress)
10. Create Runtime Variables (instructions to come)
11. Run the SaasGlue job to deploy the production application
    - Log in to the SaasGlue web [console](https://console.saasglue.com)
    - Click "Designer" in the menu bar
    - Select "Init Build Pipeline Demo"
    - Click the "Run" tab
    - Click "Run Job"

## TODO
- SaasGlue expoprt/import functionality
- Instructions for modifying/deploying the code to kick off the automated build process
- Instructions for running the job to tear down the build environment
- How to run the application locally