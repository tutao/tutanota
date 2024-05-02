pipeline {
    environment {
         PATH="${env.NODE_PATH}:${env.PATH}"
    }
	options {
		preserveStashes()
	}
	parameters {
        booleanParam(
			name: 'PUSH_DEB',
			defaultValue: false,
			description: "Upload the result artifact"
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
        stage('Build') {
            agent {
                label 'linux'
            }
            steps {
            	sh 'npm ci'
            	sh 'npm run build-packages'
				sh 'node webapp.js release'
				// excluding desktop-specific and mobile specific parts which we don't need in web
				stash includes: 'build/**', excludes: '**/app.html, **/desktop.html, **/index-app.js, **/index-desktop.js', name: 'webapp_built'

				// Bundle size stats
				publishHTML target: [
					allowMissing: false,
					alwaysLinkToLastBuild: false,
					keepAll: true,
					reportDir: 'build',
					reportFiles: 'stats.html',
					reportName: 'bundle stats'
				]
				// Bundle dependencies graph
				sh 'dot -Tsvg build/bundles.dot > build/bundles.svg'
				sh """echo '<!doctype html><html><body><img src="./bundles.svg" /></body></html>' > build/bundles.html"""
				publishHTML target: [
					allowMissing: false,
					alwaysLinkToLastBuild: false,
					keepAll: true,
					reportDir: 'build',
					reportFiles: 'bundles.html',
					reportName: 'bundle dependencies'
				]
            }
        }

        stage('Build deb & upload to nexus') {
        	environment {
         		VERSION = sh(returnStdout: true, script: "node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
         	}
            when {
            	expression { params.PUSH_DEB }
            }
            agent {
                label 'linux'
            }
            steps {
            	sh 'echo Publishing version $VERSION'
            	sh 'npm ci'
				sh 'rm -rf ./build/*'

				unstash 'webapp_built'
				sh 'node buildSrc/buildDeb.js webapp'

				script {
					def util = load "ci/jenkins-lib/util.groovy"

					util.publishToNexus(
							groupId: "app",
							artifactId: "webapp",
							version: "${VERSION}",
							assetFilePath: "${WORKSPACE}/tutanota_${VERSION}_amd64.deb",
							fileExtension: 'deb'
					)
				}

				stash name: 'deb', includes: "${WORKSPACE}/tutanota_${VERSION}_amd64.deb"
            }
        }

		stage('Push deb') {
			environment {
				VERSION = sh(returnStdout: true, script: "node buildSrc/getTutanotaAppVersion.js")
			}
			when {
				expression { params.PUSH_DEB }
			}
			agent {
				label 'linux'
			}
			steps {
				unstash 'deb'

				sh 'echo Copying version $VERSION'

				sh "cp ${WORKSPACE}/tutanota_${VERSION}_amd64.deb /opt/repository/tutanota"
			}
		}
    }
}
