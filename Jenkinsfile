pipeline {
    agent any
    environment {
        IMAGE_NAME = 'gimmeursocks/konecta-cicd-project'
        // use the short commit hash from the GitHub webhook as the tag
        IMAGE_TAG = "${env.GIT_COMMIT.take(7)}"
        APP_PORT = '3000'
        AWS_DEFAULT_REGION = 'eu-central-1'
        AWS_ACCOUNT_ID = '328986589640'
        ECR_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com"
    }
    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Lint') {
            steps {
                sh 'npx eslint . --max-warnings 0'
            }
        }
        stage('Prettier Check') {
            steps {
                sh 'npx prettier --check .'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .'
            }
        }
        stage('Security Scan with Trivy') {
            steps {
                sh '''
                trivy image \
                  --exit-code 1 \
                  --quiet \
                  --skip-version-check \
                  --ignore-unfixed \
                  --severity HIGH,CRITICAL \
                  --format json "${IMAGE_NAME}:${IMAGE_TAG}" |
                  jq '.Results[] | select(.Vulnerabilities | length > 0)'
              '''
            }
        }
        stage('Setup ECR Infrastructure') {
            steps {
                withCredentials([[ $class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'terraform-creds']]){                                    
                    sh '''
                      cd terraform
                      terraform init
                      terraform apply -var="aws_account_id=${AWS_ACCOUNT_ID}" -target=module.ecr_repo -auto-approve
                    '''
                }
            }
        }
        stage('Authenticate to ECR') {
            steps {
                withCredentials([[ $class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-creds']]){
                    sh '''
                      aws ecr get-login-password --region ${AWS_DEFAULT_REGION} \
                        | docker login --username AWS --password-stdin ${ECR_URI}
                    '''
                }
            }
        }
        stage('Push to ECR') {
            steps {
                sh '''
                  cd terraform
                  ECR_URL=$(terraform output -raw ecr_repository_url)
                  docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_URL}:${IMAGE_TAG}
                  docker push ${ECR_URL}:${IMAGE_TAG}
                '''
            }
        }
        stage('Deploy Infrastructure') {
            steps {
                withCredentials([[ $class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'terraform-creds']]){                    
                    sh '''
                      cd terraform
                      terraform apply -var="aws_account_id=${AWS_ACCOUNT_ID}" -var="image_tag=${IMAGE_TAG}" -auto-approve
                    '''
                }
            }
        }
        stage('Test API Gateway Endpoint') {
            steps {
                script {
                    def apiUrl = sh(script: 'cd terraform && terraform output -raw api_endpoint', returnStdout: true).trim()
                    echo "API Gateway URL: ${apiUrl}"
                    // Wait for a few seconds to ensure the deployment is complete
                    sleep 10
                    def response = sh(script: "curl -s -o /dev/null -w '%{http_code}' ${apiUrl}", returnStdout: true).trim()
                    if (response == '200') {
                        echo 'API Gateway is reachable and returned status code 200.'
                    } else {
                        error "API Gateway test failed with status code ${response}."
                    }
                }
            }
        }
    }
    post {
        always {
            echo 'CI process completed.'
        }
        failure {
            echo 'CI process failed!'
        }
    }
}
