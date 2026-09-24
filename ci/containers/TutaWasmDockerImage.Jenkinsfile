pipeline {

	agent {
		label 'master'
	}

    environment {
        WASM_TOOLS_FILE_PATH = "tuta-wasm-tools.deb"
        TUTA_WASM_VERSION = "0.0.4"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('download tuta wasm tools') {
            steps {
                script {
                    def util = load "ci/jenkins-lib/util.groovy"
                    util.downloadFromNexus(groupId: "lib",
                            artifactId: "tuta-wasm-tools",
                            version: env.TUTA_WASM_VERSION,
                            fileExtension: 'deb',
                            outFile: "${env.WORKSPACE}/ci/containers/${env.WASM_TOOLS_FILE_PATH}")
                }
            }
        } // stage download tuta wasm tools

        stage('Build Docker Image') {
            environment {
                VERSION_TAG = "${env.TUTA_WASM_VERSION}"
            }
            steps {
                sh 'docker build --squash -t tuta-wasm:$VERSION_TAG -t tuta-wasm:latest -f ci/containers/linux-build.dockerfile ci/containers'
            }
        } // Build Docker Image
    }
}