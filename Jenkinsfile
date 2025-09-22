pipeline {
    agent any

    environment {
        IMAGE_NAME = "gimmeursocks/konecta-cicd-project"
        // use the short commit hash from the GitHub webhook as the tag
        IMAGE_TAG  = "${GIT_COMMIT[0..6]}"
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
                sh 'docker compose build'
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

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-creds',
                                                 usernameVariable: 'DOCKER_USER',
                                                 passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                      echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                      docker push "${IMAGE_NAME}:${IMAGE_TAG}"
                    '''
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                sh 'docker compose up -d'
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
