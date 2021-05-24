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
9. Import the SaasGlue Jobs
    - Log in to the SaasGlue web [console](https://console.saasglue.com)
    - Click "Designer" in the menu bar
    - Click "Import Jobs"
    - Click "Choose File"
    - Select the "sg_jobs.sgj" file in the root folder and click "Open"
    - Set up runtime variables
            - Init Build Pipeline Demo job
                - Select the "Init Build Pipeline Demo" job in the Designer view
                - Click the "Runtime Variables" tab
                - Enter the following runtime variable key/value pairs - enter the key in the left box labeled "key" and the value int he right box labeled "value" and then click the "Add Runtime Variable" button
                    - GIT_URL = [the url of your github repo containing the spa_build_pipeline code - e.g. "github.com/my-repo-name"]
                    - GIT_USERNAME = [your github username]
                    - GIT_PASSWORD = [the password to your github repo - this could be a personal access token]
                    - GIT_REPO_NAME = spa_build_pipeline
                    - instances - [the id of the ec2 instance you set up previously to run the SaasGlue Agent which will create the production/build environments, e.g. "i-035d9ea161fab5073"]
            - Build Stock Quotes Publisher job
                - Select the "Build Stock Quotes Publisher" job in the Designer view
                - Click the "Runtime Variables" tab
                - Enter the following runtime variable key/value pairs
                    - docker_tag = v0.2
            - Remove Build Pipeline Demo job
                - Select the "Remove Build Pipeline Demo" job in the Designer view
                - Click the "Runtime Variables" tab
                - Create all of the runtime variables you created for the previous two jobs with the same values - alternatively you could create all of the runtime variables in the "Vars" tab in the menu bar instead of creating the runtimne variables in the individual job definitions.
10. Run the SaasGlue job to deploy the production application
    - Log in to the SaasGlue web [console](https://console.saasglue.com)
    - Click "Designer" in the menu bar
    - Select "Init Build Pipeline Demo"
    - Click the "Run" tab
    - Click "Run Job"
    - When the job completes, open the stock quote publisher web application you just deployed
        - Open the AWS console in a browser and login
        - Click the "Services" drop down and enter "EC2" in the search edit box - then click "EC2"
        - Click on "Load Balancers" in the menu on the left side
        - Copy the load balancer URl corresponding to the stock quote publisher web application
        - Paste the URL into a new browser window
        - When the page loads, enter a ticker, e.g. "IBM" in the ticker input box and then click the "Subscribe" button - you should see regular quote updates in the browser
11. Test the build/deploy process
    - Modify the "server/src/workers/StockQuotePublisher.py" code on your local machine
        - Comment line 258
        - Uncomment lines 260 to 262
        - Open a terminal window and change directories to the root folder of your local spa-build-pipeline code
        - Enter 'git commit -a -m "added wpx"' (without the single quotes)
        - Enter 'git push' (again, no single quotes)
    - Open the SaasGlue web [console](https://console.saasglue.com)
    - Click on "Monitor" from the menu bar
    - You should see a new instance of the "Build Stock Quotes Publisher" job within 5 or 10 seconds after "git push" finishes successfully
    - Click on the "Monitor" link to the left of the "Build Stock Quotes Publisher" job with status "Running"
    - You should see 3 tasks - you can click on the task name to see details related to the running task
    - When all 3 tasks have completed, go back to your stock quote publisher web application and you should see the new weighted price (wpx) field delivered with new quotes
12. Tear down the stock quote publisher application environment
    - Open the SaasGlue web [console](https://console.saasglue.com)
    - Click "Monitor" in the menu bar
    - Click on the "Monitor" link to the left of the most recent "Build Stock Quotes Publisher" job with status "Completed"
    - Click on the "Run build" link
    - Click the "demo_id" link under "Runtime Vars" and copy the value
    - Click "Designer" in the menu bar
    - Select "Remove Build Pipeline Demo"
    - Click the "Run" tab
    - Click "Add Script Vars (@sgg)"
    - Click the "demo_id" link
    - Paste the value you previously copied from the "Run Build" runtime vars task
    - Click "Add Runtime Variable"
    - Click "Run Job"
    - Click the link to the running job
    - Verify that all job tasks complete successfully
    - Check your AWS account to make sure all resources have been cleaned up
## TODO
- How to run the application locally