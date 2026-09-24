pipeline {
    agent any

    environment {
        BUILD_DIR = 'build'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh '''
                    set -euo pipefail
                    # Replace with your actual build commands
                    npm ci
                    node webapp.js
                    rsync build/ integrations/nextcloud/tutamail/js/ -Parvh --delete
                    cd integrations/nextcloud/
                    tar -czfv tutamail.tar.gz tutamail
                '''
            }
        }

//         stage('Sign') {
//             steps {
//                 // "signing-key" = a Secret file credential (.pfx, .p12, GPG key, etc.)
//                 // "signing-key-password" = a Secret text credential
//                 // Create both under Manage Jenkins > Credentials first.
//                 withCredentials([
//                     file(credentialsId: 'signing-key', variable: 'SIGNING_KEY'),
//                     string(credentialsId: 'signing-key-password', variable: 'SIGNING_PASSWORD')
//                 ]) {
//                     sh '''
//                         set -euo pipefail
//                         # Example: GPG detached signature.
//                         # Swap for codesign / signtool / jarsigner / apksigner as needed.
//                         gpg --batch --yes --passphrase "$SIGNING_PASSWORD" \
//                             --import "$SIGNING_KEY"
//                         gpg --batch --yes --passphrase "$SIGNING_PASSWORD" \
//                             --output "${BUILD_DIR}/artifact.sig" \
//                             --detach-sign "${BUILD_DIR}/artifact"
//                     '''
//                 }
//             }
//         }

        stage('Upload to Nexus') {
            steps {
                script {
                    def util = load "ci/jenkins-lib/util.groovy"

                    util.publishToNexus(
                            groupId: "app",
                            artifactId: "tutamail-nextcloud",
                            version: "${VERSION}",
                            assetFilePath: "${WORKSPACE}/integrations/nextcloud/tutamail.tar.gz",
                            fileExtension: "tar.gz"
                    )
                }
            }
        }
    }

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