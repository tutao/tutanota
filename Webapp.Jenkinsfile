pipeline {
    environment {
         PATH="/opt/node-v16.3.0-linux-x64/bin:${env.PATH}"
    }
	options {
		preserveStashes()
	}
	parameters {
        booleanParam(
			name: 'RELEASE',
			defaultValue: false,
			description: "Prepare a release version (doesn't publish to production, this is done manually). Also publishes NPM modules"
		)
    }
    agent {
        label 'master'
    }
    stages {
        stage('Build') {
            agent {
                label 'linux'
            }
            steps {
            	sh 'npm ci'
            	sh 'npm run build-packages'
				sh 'node webapp.js release'
				// excluding web-specific and mobile specific parts which we don't need in desktop
				stash includes: 'build/dist/**', excludes: '**/app.html, **/desktop.html, **/index-app.js, **/index-desktop.js', name: 'webapp_built'

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

        stage('Publish') {
            when {
            	expression { params.RELEASE }
            }
            agent {
                label 'linux'
            }
            steps {
            	sh 'npm ci'
				sh 'rm -rf ./build/*'

				unstash 'webapp_built'
				sh 'node buildSrc/publish.js webapp'
            }
        }

        stage('Publish npm modules') {
			when {
				expression { params.RELEASE }
			}
			agent {
				label 'linux'
			}
			steps {
				catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
					sh "npm ci && npm run build-packages"
					// .npmrc expects $NPM_TOKEN
					withCredentials([string(credentialsId: 'npm-token',variable: 'NPM_TOKEN')]) {
						sh "npm --workspaces publish"
					}
				}
			}
        }
    }
}
