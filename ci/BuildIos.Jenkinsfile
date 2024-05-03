pipeline {
	environment {
		NODE_MAC_PATH = "/usr/local/opt/node@20/bin/"
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node buildSrc/getTutanotaAppVersion.js")
	}

	agent {
		label 'linux'
	}

	parameters {
        booleanParam(
            name: 'STAGING',
            defaultValue: true,
            description: "Build a version for test system"
        )
		booleanParam(
			name: 'PROD',
			defaultValue: true,
			description: "Build a version for production system"
		)
		booleanParam(
			name: 'PUSH_ARTIFACTS',
			defaultValue: false,
			description: "Push result artifacts to Nexus"
		)
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
		stage("Run tests") {
			agent {
				label 'mac-intel'
			}
			environment {
				LC_ALL = "en_US.UTF-8"
				LANG = "en_US.UTF-8"
			}
			steps {
				script {
					dir('app-ios') {
						sh 'fastlane test'
					}
				}
			}
		}

		stage("Staging") {
			when {
				expression { params.STAGING }
			}
			stages {
				stage("Build") {
					environment {
						PATH = "${env.NODE_MAC_PATH}:${env.PATH}"
						MATCH_GIT_URL = "git@gitlab:/tuta/apple-certificates.git"
						LC_ALL = "en_US.UTF-8"
						LANG = "en_US.UTF-8"
					}
					agent {
						label 'mac-intel'
					}
					steps {
						script {
							buildWebapp("test")
							runFastlane("de.tutao.tutanota.test", "build_adhoc_staging")
							runFastlane("de.tutao.tutanota.test", "build_testflight_staging")
							stash includes: "app-ios/releases/tutanota-${VERSION}-adhoc-test.ipa", name: 'ipa-adhoc-staging'
							stash includes: "app-ios/releases/tutanota-${VERSION}-test.ipa", name: 'ipa-testflight-staging'
						}
					} // steps
				} // stage Build

				stage('Upload to Nexus') {
					environment {
						PATH = "${env.NODE_PATH}:${env.PATH}"
					}
					when {
						expression { params.PUSH_ARTIFACTS }
					}
					agent {
						label 'linux'
					}
					steps {
						unstash 'ipa-adhoc-staging'
						unstash 'ipa-testflight-staging'
						script {
							def util = load "ci/jenkins-lib/util.groovy"
                        	util.publishToNexusMultiple(groupId: "app",
                        			artifactId: "ios-test",
                        			version: "${VERSION}",
                        			assets: [
										[path: "${WORKSPACE}/app-ios/releases/tutanota-${VERSION}-adhoc-test.ipa", fileExtension: "ipa"],
										[path: "${WORKSPACE}/app-ios/releases/tutanota-${VERSION}-test.ipa", fileExtension: "ipa"]
                        			]
                        	)
						}
					}
				}
			} // stages
		} // stage Staging

		stage("Prod") {
			when {
				expression { params.PROD }
			}
			stages {
				stage("Build") {
					environment {
						PATH = "${env.NODE_MAC_PATH}:${env.PATH}"
						MATCH_GIT_URL = "git@gitlab:/tuta/apple-certificates.git"
						LC_ALL = "en_US.UTF-8"
						LANG = "en_US.UTF-8"
					}
					agent {
						label 'mac-intel'
					}
					steps {
						script {
							buildWebapp("prod")
							runFastlane("de.tutao.tutanota", "build_adhoc_prod")
							runFastlane("de.tutao.tutanota", "build_appstore_prod")
							stash includes: "app-ios/releases/tutanota-${VERSION}-adhoc.ipa", name: 'ipa-adhoc-prod'
							stash includes: "app-ios/releases/tutanota-${VERSION}.ipa", name: 'ipa-appstore-prod'
						}
					} // steps
				} // stage Build

				stage('Upload to Nexus') {
					environment {
						PATH = "${env.NODE_PATH}:${env.PATH}"
					}
					when {
						expression { params.PUSH_ARTIFACTS }
					}
					agent {
						label 'linux'
					}
					steps {
						unstash 'ipa-adhoc-prod'
						unstash 'ipa-appstore-prod'
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							util.publishToNexusMultiple(groupId: "app",
									artifactId: "ios",
									version: "${VERSION}",
									assets: [
										[path: "${WORKSPACE}/app-ios/releases/tutanota-${VERSION}-adhoc.ipa", fileExtension: "ipa"],
										[path: "${WORKSPACE}/app-ios/releases/tutanota-${VERSION}.ipa", fileExtension: "ipa"]
									]
							)
						}
					}
				}
			} // stages
		} // stage Prod
	}
}

void buildWebapp(String stage) {
	script {
		sh "pwd"
		sh "echo $PATH"
    	sh "npm ci"
    	sh 'npm run build-packages'
    	sh "node --max-old-space-size=8192 webapp ${stage}"
    	sh "node buildSrc/prepareMobileBuild.js dist"
	}
}

void writeReleaseNotesForAppStore() {
	script {
		catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to create github release notes for ios') {
			// need to run npm ci to install dependencies of releaseNotes.js
			sh "npm ci"
			writeFile file: "notes.txt", text: params.releaseNotes
			withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
				sh """node buildSrc/createReleaseDraft.js --name '${VERSION} (iOS)' \
																   --tag 'tutanota-ios-release-${VERSION}'\
																   --notes notes.txt \
																   --toFile ${RELEASE_NOTES_PATH}"""
			}
			sh "rm notes.txt"
		}
	}

	sh "echo Created release notes for fastlane ${RELEASE_NOTES_PATH}"
}

void runFastlane(String app_identifier, String lane) {
	// Prepare the fastlane Appfile which defines the required ids for the ios app build.
	script {
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

	withCredentials([
			file(credentialsId: 'appstore-api-key-json', variable: "API_KEY_JSON_FILE_PATH"),
			string(credentialsId: 'match-password', variable: 'MATCH_PASSWORD'),
			string(credentialsId: 'team-id', variable: 'FASTLANE_TEAM_ID'),
			sshUserPrivateKey(credentialsId: 'jenkins', keyFileVariable: 'MATCH_GIT_PRIVATE_KEY'),
			string(credentialsId: 'fastlane-keychain-password', variable: 'FASTLANE_KEYCHAIN_PASSWORD')
	]) {
		dir('app-ios') {
			sh "security unlock-keychain -p ${FASTLANE_KEYCHAIN_PASSWORD}"

			script {
				// Set git ssh command to avoid ssh prompting to confirm an unknown host
				// (since we don't have console access we can't confirm and it gets stuck)
				sh "GIT_SSH_COMMAND=\"ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no\" fastlane ${lane}"
			}
		}
	}
}