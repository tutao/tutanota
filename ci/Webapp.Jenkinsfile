pipeline {
    environment {
        PATH="${env.NODE_PATH}:${env.PATH}:/home/jenkins/emsdk/upstream/bin/:/home/jenkins/emsdk/:/home/jenkins/emsdk/upstream/emscripten"
    }
	options {
		preserveStashes()
	}
	parameters {
        booleanParam(
			name: 'UPLOAD',
			defaultValue: false,
			description: "Upload release version to Nexus"
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

			    script {
                    if (params.UPLOAD) {
                        // excluding web-specific and mobile specific parts which we don't need in desktop
                        stash includes: 'build/**', excludes: '**/app.html, **/desktop.html, **/index-app.js, **/index-desktop.js', name: 'webapp_built'
                    }
			    }

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
        } // stage build

        stage('Upload to Nexus') {
            when {
            	expression { return params.UPLOAD }
            }
        	environment {
         		VERSION = sh(returnStdout: true, script: "node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
         	}
            agent {
                label 'linux'
            }
            steps {
            	sh 'echo Uploading version $VERSION'
				sh 'rm -rf ./build/*'
				unstash 'webapp_built'
                sh 'tar -cvzf webapp_built.tar.gz ./build'

                script {
                    def util = load "ci/jenkins-lib/util.groovy"

                    util.publishToNexus(
                            groupId: "app",
                            artifactId: "webapp",
                            version: "${VERSION}",
                            assetFilePath: "${WORKSPACE}/webapp_built.tar.gz",
                            fileExtension: "tar.gz"
                    )
                }
            } // steps
        } // stage upload to nexus
    } // stages
} // pipeline
