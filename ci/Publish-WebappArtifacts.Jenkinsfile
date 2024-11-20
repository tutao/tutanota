pipeline {
    environment {
        PATH="${env.NODE_PATH}:${env.PATH}"
        VERSION=sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
    }
	options {
		preserveStashes()
	}
	parameters {
	    booleanParam(
	        name: 'DEB',
	        defaultValue: true,
	        description: "Build deb package"
	    )
	    booleanParam(
	        name: 'PUBLISH_NPM_MODULES',
	        defaultValue: false,
	        description: "Publish npm modules"
	    )
        booleanParam(
            name: 'GITHUB_RELEASE',
            defaultValue: false,
            description: "Publish release notes draft"
        )
		persistentText(
			name: 'releaseNotes',
			defaultValue: '',
			description: "Release notes for this build"
		)
	}
    agent {
        label 'linux'
    }
    stages {
        stage("Checking params") {
            steps {
                script{
                    if(!params.DEB && !params.PUBLISH_NPM_MODULES && !params.GITHUB_RELEASE) {
                        currentBuild.result = 'ABORTED'
                        error('No tasks were selected.')
                    }
                }
                echo "Params OKAY"
            }
        } // stage checking params
    	stage('Check Github') {
			steps {
				script {
					def util = load "ci/jenkins-lib/util.groovy"
					util.checkGithub()
				}
			}
    	}
        stage('Build deb') {
            when { expression { return params.DEB } }
            steps {
                script {
                    def filePath = "webapp_built.tar.gz"
                    def util = load "ci/jenkins-lib/util.groovy"


                    util.downloadFromNexus(
                            groupId: "app",
                            artifactId: "webapp",
                            version: "${VERSION}",
                            outFile: "${WORKSPACE}/${filePath}",
                            fileExtension: "tar.gz"
                    )
                    if (!fileExists(filePath)) {
                        currentBuild.result = 'ABORTED'
                        error("Unable to find file ${filePath}")
                    }

					sh "tar -xvzf ${filePath}"
                }

				sh 'npm ci'
				sh 'node buildSrc/publish.js webapp'
            } // steps
        } // stage build deb

        stage('Publish release notes') {
            when { expression { return params.GITHUB_RELEASE } }
            steps {
            	sh 'npm ci'

				writeFile file: "notes.txt", text: params.releaseNotes
                withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
                    sh '''node buildSrc/createReleaseDraft.js --name ${VERSION} --tag tutanota-release-${VERSION} --notes notes.txt'''
                }
            }
        } // stage publish release notes

        stage('Publish npm modules') {
			when { expression { return params.PUBLISH_NPM_MODULES } }
			steps {
                sh 'npm ci'
                sh 'npm run build-packages'
                // .npmrc expects $NPM_TOKEN
                withCredentials([string(credentialsId: 'npm-token',variable: 'NPM_TOKEN')]) {
                    sh "npm --workspaces publish --access public"
                }
			} // steps
        } // stage publish npm modules
    } // stages
} // pipeline
