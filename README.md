# SaasGlue Single Page Web App Automated Build Pipeline

## Prerequisites
1. AWS account
2. GitHub account
3. SaasGlue account - click [here](https://console.saasglue.com) to create an account
4. Installed software components (on your dev machine)
    - node version 10
    - npm current version
    - typescript
    - Docker for Desktop
    - git command line tools

## Pre-workshop Setup
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
2. AWS setup
    - Create AWS account if you don't already have one (console.aws.amazon.com -> Sign Up)
    - Create an IAM policy named "ec2-admin-passrole" (see end for json to use to create this policy) - https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_managed-policies.html#step1-create-policy
    - Create an IAM policy named "eks-admin" (see end for json to use to create the policy) - https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_managed-policies.html#step1-create-policy
    - Create an IAM user (pick whatever name you want) - https://docs.aws.amazon.com/rekognition/latest/dg/setting-up.html
        - Assign permissions to the user
            - Attach the ec2-admin policy you created previously
            - Attach "AmazonEC2FullAccess" AWS managed policy
            - Attach "AmazonS3FullAccess" AWS managed policy
        - Create an access key
            - Click the user name from the IAM -> Users screen
            - Click the "Security credentials" tab
            - Click "Create access key" (if you already have the max allowed access keys for your account it will be disabled - you can use an existing one of delete one and create a new one)
            - Record the access key id and secret - you'll need it later on
    - Create an IAM role named "eks-admin" and attach the eks-admin policy you created previously
        - Open https://console.aws.amazon.com/iam/ in your browser
        - Select "Roles" from the left side menu
        - Click "Create role"
        - Click any of the common use cases, e.g. "EC2" and then click "Next: Permissions"
        - In the search box next to "Filter policies" type "eks-admin" and click the check box next to "eks-admin" in the list
        - Click "Next: Tags"
        - Click "Next: Review"
        - Click "Create role"
    - Create an ec2 access key pair https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html - follow instructions under "Option 1" - you'll need the name of this key pair later on
3. SaasGlue setup
    - Create SaasGlue account
        - Click [here](https://console.saasglue.com) to create an account
        - Configure Team Vars
            - Click "Vars" in the menu bar
            - Enter the following team variable key/value pairs - enter the key in the left box labeled "key" and the value in the right box labeled "value" and then click the "Add Runtime Variable" button
                - AWS_REGION = us-east-2
                - AWS_ACCESS_KEY_ID = [the access key id you created in step 2]
                - AWS_SECRET_ACCESS_KEY = [the associated secret access key you created in step 2]
        - Find your team id
            - Click your login name in the upper right hand corner and click "Settings"
            - Copy your team id - you'll need it later on
    - Create SaasGlue access keys
        - Create agent download access key
            - Log in to the SaasGlue web [console](https://console.saasglue.com)
            - Click your login name in the upper right hand corner and click "Access Keys"
            - Click the "User Access Keys" tab
            - Click "Create User Access Key"
            - Enter a description, e.g. "Agent download"
            - Click "Select None"
            - Click the checkbox next to "AGENT_STUB_DOWNLOAD"
            - Click "Create Access Key"
            - Copy the access key secret
            - Click the "I have copied the secret" button
            - Copy the access key id from the grid
            - You'll need the key id/secret further on in the process
        - Create agent access key
            - Log in to the SaasGlue web [console](https://console.saasglue.com)
            - Click your login name in the upper right hand corner and click "Access Keys"
            - Click the "Agent Access Keys" tab
            - Click "Create Agent Access Key"
            - Enter a description, e.g. "default"
            - Click "Create Access Key"
            - Copy the access key secret
            - Click the "I have copied the secret" button
            - Copy the access key id from the grid
            - You'll need the key id/secret further on in the process
    - Import the SaasGlue Jobs
        - Log in to the SaasGlue web [console](https://console.saasglue.com)
        - Click "Designer" in the menu bar
        - Click "Import Jobs"
        - Click "Choose File"
        - Select the "sg_jobs.sgj" file in the spa-build-pipeline root folder and click "Open"
    - Configure "SPA Build Pipeline Init AWS" SaasGlue job
        - Log in to the SaasGlue web [console](https://console.saasglue.com)
        - Click "Designer" in the menu bar
        - Click the name "SPA Build Pipeline Init AWS"
        - Set up runtime variables - these are key value pairs associated with the job
            - Click the "Runtime Variables" tab 
            - Enter the following key/value pairs - if there is an existing runtime variable with the given key, click "unmask" and enter the new value in the input box and hit "enter" - otherwise enter the key/value pair in the input boxes at the bottom of the grid and then click "Add Runtime Variable"
        
                workingdir = /home/ec2-user 
                tags = {"terraform":"true"} 
                sgTeamId = [your team id - from previous step]
                sgLoginUrl = https://console.saasglue.com/login/apiLogin
                sgApiUrl = https://console.saasglue.com
                agentDownloadAccessKeySecret = [your agent download access key secret] 
                agentDownloadAccessKeyId = [your agent download access key id] 
                agentAccessKeySecret = [your agent access key secret] 
                agentAccessKeyId = [your agent access key id] 
                VpcId = [your aws default vpc id]
                SubnetId = [your aws subnet in the default vpc corresponding to us-east-2]
                SecurityGroupIds = [[your aws default security group id]], e.g. ['sg-0xxxxxxxxxxxxxxxx']
                NumInstances = 1 
                KeyName = [aws ec2 key pair]
                InstanceType = t3.small
                IAMRole = [the name of the iam user you created in step 2] 
                ImageId = ami-0b59bfac6be064b78
4. Run the "SPA Build Pipeline Init AWS" SaasGlue job - this job will create an ec2 instance to run the SaasGlue agent and create the ECR repositories for the application Docker images
    - Log in to the SaasGlue web [console](https://console.saasglue.com)
    - Click "Designer" in the menu bar
    - Click the name "SPA Build Pipeline Init AWS"
    - Click the "Run" tab
    - Click the "Run Job" button
    - Click the "running job" link
    - Verify the job completes successfully - if any task in the job fails, click on the task name and then the stdout/stderr links to see what error(s) occurred - Note: the "Configure EC2 Instance" task will have status "Published" and then "WaitingForAgent" with Failure = "NoAgentAvailable" until the ec2 inistance created by the prior task is up and running - generally about 1 minute but it could take longer depending on AWS - if the task doesn't start after the EC2 instance is initialized, click "Interrupt" and then "Restart" on the monitor page for the running job
    - Click the link under "Runtime Vars" for the "Create EC2 Instance" task - scroll to the "ec2_instance_id" - this is the instance id of the newly created ec2 instance - record it for later on - you can stop this ec2 instance through the AWS console - it will be started automatically when you run the SaasGlue job ("Init Build Pipeline Demo job") to deploy the application
    - Click the link under "Runtime Vars" for the "Create ECR Repositories" task - scroll to the "repo_uri" - this is the ECR repo uri - copy this for use later on
    - Click "Agents" in the menu bar
    - Verify the Agent on the new ec2 instance is connected and sending a heartbeat - you can match the Agent to the ec2 instance in AWS with the displayed ip address
5. Make configuration changes to spa-build-pipeline code
    - Modify "config/production.json"
        - Set the "rmqBrowserPushRoute" value to something unique, e.g. "sbp-bp-[your name]-[your birth year]-[your birth day]"
        - Set the "rmqStockQuotePublisherQueue" value to something unique, e.g. "stock-quote-publisher-[your name]-[your birth year]-[your birth day]"
    - Set the same values in "config/default.json" and "config/test.json"
    - Modify "clientv1/.env.production"
        - Set the "VUE_APP_RABBITMQ_QUEUE" value to the same value you used for "rmqBrowserPushRoute" in the prior step
    - Set the same value in "clientv1/.env.development"
    - Modify "clientv1/src/utils/StompHandler.ts"
        - Add the value you entered for "rmqBrowserPushRoute" to this line after "${this.exchangeName}/"
            ```
            this.client.subscribe(`/exchange/${this.exchangeName}/bp`, this.onMessage.bind(this), subscribeHeaders);
            ```
            ->
            ```
            this.client.subscribe(`/exchange/${this.exchangeName}/sbp-bp-[your name]-[your birth year]-[your birth day]`, this.onMessage.bind(this), subscribeHeaders);
            ```
    - Commit your changes and push to git
        ```
        $ git commit -m "update config"
        $ git push
        ```

## Install
1. Create and install SaasGlue API access credentials in GitHub
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
2. Build the application
    - From the project root folder run
    ```
    $ npm i
    ```
    - From the clientv1 folder run
    ```
    $ npm run build
    ```
3. Authenticate your local Docker client to your ECR registry
    - Log in to the AWS [console](https://us-east-2.console.aws.amazon.com)
    - Enter "ECR" in the "Search for services..." search box at the top of the console and select "Elastic Container Registry"
    - Select any one of the repositories (there should be 4) by clicking the radio button next to the repository name
    - Click the "View push commands" button
    - Follow the instructions in step 1, "Retrieve an authentication token..." - run the command from a terminal window
4. Build and deploy docker images (replace [aws ecr repo uri] with your ecr uri)
    ```
    $ ./build_agent_docker_image_aws.sh v0.1 [aws ecr repo uri]
    $ ./build_api_docker_image_aws.sh v0.1 [aws ecr repo uri]
    $ ./build_stock_quote_publisher_image_aws.sh v0.1 [aws ecr repo uri]
    ```
5. Set SaasGlue jobs Runtime Variables
    - These are key value pairs associated with each job 
    - To enter runtime variables for a job, click the job name in the "Designer" view and then click the "Runtime Variables" tab - if there is an existing runtime variable with the given key, click "unmask" and enter the new value in the edit box and hit "enter" - otherwise enter the key/value pair in the edit boxes at the bottom of the grid and then click "Add Runtime Variable"
        - Init Build Pipeline Demo job
            GIT_URL = [the url of your github repo containing the spa_build_pipeline code - e.g. "github.com/my-repo-name"]
            GIT_USERNAME = [your github username]
            GIT_PASSWORD = [the password to your github repo - this could be a personal access token]
            GIT_REPO_NAME = spa_build_pipeline
            instances = [the id of the ec2 instance you set up previously to run the SaasGlue Agent which will create the production/build environments, e.g. i-035d9ea161fab5073]
        - Build Stock Quotes Publisher job
            GIT_REPO_NAME = spa_build_pipeline
            ECR_REPO_URI = [aws ecr repo uri]
            docker_tag = v0.2
        - Remove Build Pipeline Demo job
            GIT_URL = [the url of your github repo containing the spa_build_pipeline code - e.g. "github.com/my-repo-name"]
            GIT_USERNAME = [your github username]
            GIT_PASSWORD = [the password to your github repo - this could be a personal access token]
            GIT_REPO_NAME = spa_build_pipeline
            instances = [the id of the ec2 instance you set up previously to run the SaasGlue Agent which will create the production/build environments, e.g. i-035d9ea161fab5073]
            docker_tag = v0.2
6. Run the SaasGlue job to deploy the production application
    - Log in to the SaasGlue web [console](https://console.saasglue.com)
    - Click "Designer" in the menu bar
    - Select "Init Build Pipeline Demo"
    - Click the "Run" tab
    - Click "Run Job"
    - When the job completes, open the stock quote publisher web application you just deployed
        - Open the AWS console in a browser and login
        - Click the "Services" drop down and enter "EC2" in the search edit box - then click "EC2"
        - Click on "Load Balancers" in the menu on the left side
        - Copy the load balancer DNS name corresponding to the stock quote publisher web application
        - Paste the URL into a new browser window
        - When the page loads, enter a ticker, e.g. "IBM" in the ticker input box and then click the "Subscribe" button - you should see regular quote updates in the browser
7. Test the build/deploy process
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
8. Tear down the stock quote publisher application environment
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


## IAM policies
- ec2-admin-passrole
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": "iam:PassRole",
            "Resource": "arn:aws:iam::948032566234:role/ec2-admin"
        }
    ]
}
```
- eks-admin
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "autoscaling:AttachInstances",
                "autoscaling:CreateAutoScalingGroup",
                "autoscaling:CreateLaunchConfiguration",
                "autoscaling:CreateOrUpdateTags",
                "autoscaling:DeleteAutoScalingGroup",
                "autoscaling:DeleteLaunchConfiguration",
                "autoscaling:DeleteTags",
                "autoscaling:Describe*",
                "autoscaling:DetachInstances",
                "autoscaling:SetDesiredCapacity",
                "autoscaling:UpdateAutoScalingGroup",
                "autoscaling:SuspendProcesses",
                "ec2:AllocateAddress",
                "ec2:AssignPrivateIpAddresses",
                "ec2:Associate*",
                "ec2:AttachInternetGateway",
                "ec2:AttachNetworkInterface",
                "ec2:AuthorizeSecurityGroupEgress",
                "ec2:AuthorizeSecurityGroupIngress",
                "ec2:CreateDefaultSubnet",
                "ec2:CreateDhcpOptions",
                "ec2:CreateEgressOnlyInternetGateway",
                "ec2:CreateInternetGateway",
                "ec2:CreateNatGateway",
                "ec2:CreateNetworkInterface",
                "ec2:CreateRoute",
                "ec2:CreateRouteTable",
                "ec2:CreateSecurityGroup",
                "ec2:CreateSubnet",
                "ec2:CreateTags",
                "ec2:CreateVolume",
                "ec2:CreateVpc",
                "ec2:CreateVpcEndpoint",
                "ec2:DeleteDhcpOptions",
                "ec2:DeleteEgressOnlyInternetGateway",
                "ec2:DeleteInternetGateway",
                "ec2:DeleteNatGateway",
                "ec2:DeleteNetworkInterface",
                "ec2:DeleteRoute",
                "ec2:DeleteRouteTable",
                "ec2:DeleteSecurityGroup",
                "ec2:DeleteSubnet",
                "ec2:DeleteTags",
                "ec2:DeleteVolume",
                "ec2:DeleteVpc",
                "ec2:DeleteVpnGateway",
                "ec2:Describe*",
                "ec2:DetachInternetGateway",
                "ec2:DetachNetworkInterface",
                "ec2:DetachVolume",
                "ec2:Disassociate*",
                "ec2:ModifySubnetAttribute",
                "ec2:ModifyVpcAttribute",
                "ec2:ModifyVpcEndpoint",
                "ec2:ReleaseAddress",
                "ec2:RevokeSecurityGroupEgress",
                "ec2:RevokeSecurityGroupIngress",
                "ec2:UpdateSecurityGroupRuleDescriptionsEgress",
                "ec2:UpdateSecurityGroupRuleDescriptionsIngress",
                "ec2:CreateLaunchTemplate",
                "ec2:CreateLaunchTemplateVersion",
                "ec2:DeleteLaunchTemplate",
                "ec2:DeleteLaunchTemplateVersions",
                "ec2:DescribeLaunchTemplates",
                "ec2:DescribeLaunchTemplateVersions",
                "ec2:GetLaunchTemplateData",
                "ec2:ModifyLaunchTemplate",
                "ec2:RunInstances",
                "eks:CreateCluster",
                "eks:DeleteCluster",
                "eks:DescribeCluster",
                "eks:ListClusters",
                "eks:UpdateClusterConfig",
                "eks:UpdateClusterVersion",
                "eks:DescribeUpdate",
                "eks:TagResource",
                "eks:UntagResource",
                "eks:ListTagsForResource",
                "eks:CreateFargateProfile",
                "eks:DeleteFargateProfile",
                "eks:DescribeFargateProfile",
                "eks:ListFargateProfiles",
                "eks:CreateNodegroup",
                "eks:DeleteNodegroup",
                "eks:DescribeNodegroup",
                "eks:ListNodegroups",
                "eks:UpdateNodegroupConfig",
                "eks:UpdateNodegroupVersion",
                "iam:AddRoleToInstanceProfile",
                "iam:AttachRolePolicy",
                "iam:CreateInstanceProfile",
                "iam:CreateOpenIDConnectProvider",
                "iam:CreateServiceLinkedRole",
                "iam:CreatePolicy",
                "iam:CreatePolicyVersion",
                "iam:CreateRole",
                "iam:DeleteInstanceProfile",
                "iam:DeleteOpenIDConnectProvider",
                "iam:DeletePolicy",
                "iam:DeletePolicyVersion",
                "iam:DeleteRole",
                "iam:DeleteRolePolicy",
                "iam:DeleteServiceLinkedRole",
                "iam:DetachRolePolicy",
                "iam:GetInstanceProfile",
                "iam:GetOpenIDConnectProvider",
                "iam:GetPolicy",
                "iam:GetPolicyVersion",
                "iam:GetRole",
                "iam:GetRolePolicy",
                "iam:List*",
                "iam:PassRole",
                "iam:PutRolePolicy",
                "iam:RemoveRoleFromInstanceProfile",
                "iam:TagInstanceProfile",
                "iam:TagPolicy",
                "iam:TagRole",
                "iam:UntagRole",
                "iam:UpdateAssumeRolePolicy",
                "logs:CreateLogGroup",
                "logs:DescribeLogGroups",
                "logs:DeleteLogGroup",
                "logs:ListTagsLogGroup",
                "logs:PutRetentionPolicy",
                "kms:CreateAlias",
                "kms:CreateGrant",
                "kms:CreateKey",
                "kms:DeleteAlias",
                "kms:DescribeKey",
                "kms:GetKeyPolicy",
                "kms:GetKeyRotationStatus",
                "kms:ListAliases",
                "kms:ListResourceTags",
                "kms:ScheduleKeyDeletion"
            ],
            "Resource": "*"
        }
    ]
}```