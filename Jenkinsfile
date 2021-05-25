pipeline {
    environment {
         NODE_PATH="/opt/node-v14.15.4-linux-x64/bin"
         NODE_MAC_PATH="/usr/local/bin/"
    }
	options {
		preserveStashes()
	}

	parameters {
        booleanParam(name: 'RELEASE', defaultValue: false, description: '')
    }

    agent {
        label 'master'
    }

    stages {
        stage('Build Webapp') {
        	environment {
        		PATH="${env.NODE_PATH}:${env.PATH}"
        	}
            agent {
                label 'linux'
            }
            steps {
            	sh 'npm ci'
				sh 'node dist release'
				// excluding web-specific and mobile specific parts which we don't need in desktop
				stash includes: 'build/dist/**', excludes: '**/braintree.html, **/index.html, **/app.html, **/desktop.html, **/index-index.js, **/index-app.js, **/index-desktop.js, **/dist/sw.js', name: 'web_base'
				// adding web-specific parts to another bundle
				stash includes: '**/braintree.html, **/dist/index.html, **/dist/index-index.js, **/dist/sw.js', name: 'web_add'
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


        stage('Build deb and publish') {
            when {
            	expression { params.RELEASE }
            }
            agent {
                label 'linux'
            }
			environment {
				PATH="${env.NODE_PATH}:${env.PATH}"
			}
            steps {
            	sh 'npm ci'
				sh 'rm -rf ./build/*'
				unstash 'web_base'
				unstash 'web_add'
				withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]){
					sh '''
					export HSM_USER_PIN=${PW};
					node dist -edp release '''
				}
            }
        }
    }
}
