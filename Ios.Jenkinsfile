pipeline {
    environment {
    	NODE_PATH="/opt/node-v16.3.0-linux-x64/bin"
    	NODE_MAC_PATH="/usr/local/opt/node@16/bin/"
    	VERSION = sh(returnStdout: true, script: "${NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
    }

    agent {
    	label 'linux'
    }

	parameters {
		booleanParam(name: 'PROD', defaultValue: false, description: 'Build for production')
		booleanParam(
			name: 'PUBLISH', defaultValue: false,
			description: "Publish the app to Nexus and Apple Store (when not in production mode, " +
						 "it will publish to Nexus only)"
		)
	}

	stages {
	    stage("Run tests") {
	        agent {
	        	label 'mac'
	        }
	        environment {
	        	LC_ALL="en_US.UTF-8"
            	LANG="en_US.UTF-8"
	        }
	        steps {
	        	script {
	        		dir('app-ios') {
	        			sh 'fastlane test'
	        		}
	        	}
	        }
	    }
		stage("Build IOS app") {
			environment {
				PATH="${env.NODE_MAC_PATH}:${env.PATH}"
				MATCH_GIT_URL="git@gitlab:/tuta/apple-certificates.git"
				LC_ALL="en_US.UTF-8"
                LANG="en_US.UTF-8"
			}
		    agent {
            	label 'mac'
            }
			steps {
				script {
					createAppfile()

					def stage = params.PROD ? 'prod' : 'test'
					def lane = params.PROD ? 'adhoc' : 'adhoctest'
					def ipaFileName = params.PROD ? "tutanota-${VERSION}-adhoc.ipa" : "tutanota-${VERSION}-test.ipa"
					sh "echo $PATH"
					sh "npm ci"
					sh 'npm run build-packages'
					sh "node --max-old-space-size=8192 dist ${stage}"
					sh "node buildSrc/prepareMobileBuild.js dist"

					withCredentials([
						file(credentialsId: 'appstore-api-key-json', variable: "API_KEY_JSON_FILE_PATH"),
						string(credentialsId: 'match-password', variable: 'MATCH_PASSWORD'),
						string(credentialsId: 'team-id', variable: 'FASTLANE_TEAM_ID'),
						sshUserPrivateKey(credentialsId: 'jenkins', keyFileVariable: 'MATCH_GIT_PRIVATE_KEY'),
						string(credentialsId: 'fastlane-keychain-password', variable: 'FASTLANE_KEYCHAIN_PASSWORD')
					 ]) {
						dir('app-ios') {
							sh "security unlock-keychain -p ${FASTLANE_KEYCHAIN_PASSWORD}"

							// Set git ssh command to avoid ssh prompting to confirm an unknown host
							// (since we don't have console access we can't confirm and it gets stuck)
							sh "GIT_SSH_COMMAND=\"ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no\" fastlane ${lane}"
							if (params.PROD && params.PUBLISH) {
								sh "GIT_SSH_COMMAND=\"ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no\" fastlane release submit:true"
							}
						}
					}

					stash includes: "app-ios/releases/${ipaFileName}", name: 'ipa'

					if (params.PUBLISH && params.PROD) {
						def tag = "tutanota-ios-release-${VERSION}"
 						sh "git tag ${tag}"
 						sh "git push --tags"
					}
				}
			}
		}

		stage('Upload to Nexus') {
			environment {
				PATH="${env.NODE_PATH}:${env.PATH}"
			}
			when {
				expression { params.PUBLISH }
			}
			agent {
				label 'linux'
			}
			steps {
				script {
					def util = load "jenkins-lib/util.groovy"
					def ipaFileName = params.PROD ? "tutanota-${VERSION}-adhoc.ipa" : "tutanota-${VERSION}-test.ipa"
					def artifactId = params.PROD ? "ios" : "ios-test"

					unstash 'ipa'

					util.publishToNexus(groupId: "app",
							artifactId: "${artifactId}",
							version: "${VERSION}",
							assetFilePath: "${WORKSPACE}/app-ios/releases/${ipaFileName}",
							fileExtension: "ipa"
					)
				}
			}
		}

		stage('Create github release') {
			environment {
				PATH="${env.NODE_PATH}:${env.PATH}"
			}
			when {
				expression { params.PROD }
				expression { params.PUBLISH }
			}
			agent {
				label 'linux'
			}
			steps {
				script {
					catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
						def tag = "tutanota-ios-release-${VERSION}"
						// need to run npm ci to install dependencies of createGithubReleasePage.js
						sh "npm ci"
						withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
							sh """node buildSrc/createGithubReleasePage.js --name '${VERSION} (IOS)' \
																		   --milestone '${VERSION}' \
																		   --tag '${tag}' \
																		   --platform ios """
						}
					}
				}
			}
		}
	}
}

/**
 * Prepares the fastlane Appfile which defines the required ids for the ios application build.
 */
def createAppfile() {
	script {
		def app_identifier = 'de.tutao.tutanota'
		def appfile = './app-ios/fastlane/Appfile'

		sh "echo \"app_identifier('${app_identifier}')\" > ${appfile}"

		withCredentials([string(credentialsId: 'apple-id', variable: 'apple_id')]) {
			sh "echo \"apple_id('${apple_id}')\" >> ${appfile}"
		}
		withCredentials([string(credentialsId: 'itc-team-id', variable: 'itc_team_id')]) {
			sh "echo \"itc_team_id('${itc_team_id}')\" >> ${appfile}"
		}
		withCredentials([string(credentialsId: 'team-id', variable: 'team_id')]) {
			sh "echo \"team_id('${team_id}')\" >> ${appfile}"
		}
	}
}