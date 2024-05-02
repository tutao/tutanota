pipeline {
    environment {
         PATH="${env.NODE_PATH}:${env.PATH}"
    }
	options {
		preserveStashes()
	}
	parameters {
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
        stage('Push deb') {
        	environment {
         		VERSION = sh(returnStdout: true, script: "node buildSrc/getTutanotaAppVersion.js")
         	}
            agent {
                label 'linux'
            }
            steps {
            	sh 'echo Publishing version $VERSION'

				script {
					def util = load "ci/jenkins-lib/util.groovy"
					util.downloadFromNexus(	groupId: "app",
											artifactId: "webapp",
											version: VERSION,
											outFile: "${WORKSPACE}/tutanota_${VERSION}_amd64.deb",
											fileExtension: 'deb')
				}
				sh "cp ${WORKSPACE}/tutanota_${VERSION}_amd64.deb /opt/repository/tutanota"
            }
        }

        stage('Github release') {
        	environment {
				VERSION = sh(returnStdout: true, script: "node buildSrc/getTutanotaAppVersion.js")
			}
			agent {
				label 'linux'
			}
			steps {
				writeFile file: "notes.txt", text: params.releaseNotes

				withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
					sh '''node buildSrc/createReleaseDraft.js --name ${VERSION} --tag tutanota-release-${VERSION} --notes notes.txt'''
				}
			}
        }

        stage('Publish npm modules') {
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
