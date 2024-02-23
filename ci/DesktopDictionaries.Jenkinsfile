pipeline {
    environment {
    	// on m1 macs, this is a symlink that must be updated. see wiki.
        NODE_MAC_PATH = '/usr/local/opt/node@20/bin/'
        VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
    }
    options {
        preserveStashes()
    }

    parameters {
        booleanParam(
            name: 'RELEASE',
            defaultValue: false,
            description: "Prepare a release version (doesn't publish to production, this is done manually)"
        )
    }

    agent {
        label 'master'
    }

    stages {
		stage('Check Github') {
			steps {
				script {
					def util = load "ci/jenkins-lib/util.groovy"
					util.checkGithub()
				}
			}
		}

		stage('Build deb and publish') {
			agent { label 'linux' }
			environment { PATH = "${env.NODE_PATH}:${env.PATH}" }
			steps {
				sh 'npm ci'
				sh 'npm run build-packages'
				sh 'rm -rf ./dictionaries/'
				sh 'rm -rf ./build/'

				script {
					if (params.RELEASE) {
						sh 'node buildSrc/fetchDictionaries.js --publish'
					} else {
						sh 'node buildSrc/fetchDictionaries.js'
					}
				}

			} // steps
		} // stage build deb & publish
    } // stages
} // pipeline
