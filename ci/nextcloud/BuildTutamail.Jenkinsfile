pipeline {

    agent {
        label 'master'
    }

    environment {
        PATH="${env.NODE_PATH}:${env.PATH}"
    }

    parameters {
        string(
                name: 'tutaWasmVersion',
                defaultValue: "latest",
                description: "the version of tuta-wasm docker image to use for building the app. (See TutaWasmDockerImage.Jenkinsfile)"
        )
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build webapp') {
            agent {
                docker {
                    image "tuta-wasm:${params.tutaWasmVersion}"
                    reuseNode true
                    args "--network host -v /run:/run:rw,z -v /opt/repository:/opt/repository:rw,z"

                } // docker
            } // agent
            steps {
                sh 'npm -v'
                sh 'node -v'
                sh 'npm ci'
                sh 'node webapp.js release'

                // excluding web-specific and mobile specific parts which we don't need in desktop
                stash includes: 'build/**, src/crypto-primitives/**', excludes: '**/desktop.html', name: 'web_base'
            }
        } // stage build webapp

        stage('Build Nextcloud App') {
            steps {
                unstash 'web_base'
                sh '''
                    #!/usr/bin/env bash
                    set -eu pipefail
                    rsync build/ integrations/nextcloud/tutamail/js/ -Parvh --delete
                    tar -czf tutamail.tar.gz -C integrations/nextcloud/ tutamail
                '''
            }
        }

        stage('Sign and publish') {
            environment {
                VERSION = sh(
                    returnStdout: true,
                    script: '''sed -n 's/.*<version>\\([^<]*\\)<\\/version>.*/\\1/p' integrations/nextcloud/tutamail/appinfo/info.xml'''
                ).trim()
            }
            steps {
                script {

                    signature = sh(
                        returnStdout: true,
                        script: 'openssl dgst -sha512 -sign /opt/nextcloud-keystore/tutamail.key src/integrations/nextcloud/tutamail.tar.gz | openssl base64'
                    )

                    env.RELEASE_TAG = "tutamail-nextcloud-release-${env.VERSION}"
                    env.DOWNLOAD_URL = "https://github.com/tutao/tutanota/releases/download/${env.RELEASE_TAG}/tutamail.tar.gz"
                    writeFile file: "notes.txt", text: "TutaMail App for Nextcloud"

                    withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
                    sh """node buildSrc/createReleaseDraft.js --name "[Nextcloud] TutaMail v${env.VERSION}" \
                                           --tag '${env.RELEASE_TAG}' \
                                           --uploadFile 'tutamail.tar.gz' \
                                           --notes notes.txt
                                           """
                    } // createReleaseDraft


                    def downloadURL = "https://github.com/tutao/tutanota/releases/download/${env.RELEASE_TAG}/tutamail.tar.gz"
                    withCredentials({string(credentialsId: 'NEXTCLOUD_APP_STORE_AUTH_TOKEN', variable: "NC_TOKEN")}) {
                    sh """
                    curl -X POST https://apps.nextcloud.com/api/v1/apps/releases \
                                 -H "Authorization: Token ${NC_TOKEN}" \
                                 -H "Content-Type: application/json" \
                                 -d '{"download":"${downloadURL}", "signature": "${signature}", "nightly": false }'
                    """
                    } // publish nextcloud release
                } // script
            } // steps
        } // Stage Sign and Publish
    } // stages

    post {
        success {
            echo 'Build, sign, and upload completed successfully.'
        }
        failure {
            echo 'Pipeline failed — check the stage view above for where.'
        }
        always {
            cleanWs()
        }
    }
}