pipeline {
    environment {
         PATH="${env.NODE_PATH}:${env.PATH}:/home/jenkins/emsdk/upstream/bin/:/home/jenkins/emsdk/:/home/jenkins/emsdk/upstream/emscripten"
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
		persistentText(
			name: "releaseNotes",
			defaultValue: "",
			description: "release notes for this build"
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
				// excluding web-specific and mobile specific parts which we don't need in desktop
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

        stage('Publish') {
        	environment {
         		VERSION = sh(returnStdout: true, script: "node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
         	}
            when {
            	expression { return params.RELEASE }
            }
            agent {
                label 'linux'
            }
            steps {
            	sh 'echo Publishing version $VERSION'
            	sh 'npm ci'
				sh 'rm -rf ./build/*'

				unstash 'webapp_built'
				sh 'node buildSrc/publish.js webapp'
				writeFile file: "notes.txt", text: params.releaseNotes

				catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to create github release for webapp') {
					withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
						sh '''node buildSrc/createReleaseDraft.js --name ${VERSION} --tag tutanota-release-${VERSION} --notes notes.txt'''
					}
				}
            }
        }

        stage('Publish npm modules') {
			when {
				expression { return params.RELEASE }
			}
			agent {
				label 'linux'
			}
			steps {
				catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
					sh "npm ci && npm run build-packages"
					// .npmrc expects $NPM_TOKEN
					withCredentials([string(credentialsId: 'npm-token',variable: 'NPM_TOKEN')]) {
						sh "npm --workspaces publish --access public"
					}
				}
			}
        }
    }
}
