pipeline {
	environment {
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node buildSrc/getTutanotaAppVersion.js")
		NODE_MAC_PATH = "/usr/local/opt/node@20/bin/"
		GITHUB_RELEASE_PAGE = "https://github.com/tutao/tutanota/releases/tag/tutanota-android-release-${VERSION}"
	}

	agent {
		label 'linux'
	}

	parameters {
		choice(name: 'TARGET', choices: ['staging', 'prod'], description: 'Which artifacts to deploy. Prod also publishes release notes.')
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

		stage('Staging') {
			when {
				expression { params.TARGET == 'staging' }
			}
			agent {
				label 'mac-m1'
			}

			stages {
				stage('Download ipa') {
					agent {
						label 'linux'
					}
					steps {
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							util.downloadFromNexus(groupId: "app",
												   artifactId: "ios-test",
												   version: VERSION,
												   outFile: "tutanota-${VERSION}-test.ipa",
												   fileExtension: 'ipa')
						   stash includes: "tutanota-${VERSION}-test.ipa", name: "ipa-testflight-staging"
						}
					} // steps
				} // stage Download ipa

				stage('Testflight') {
					environment {
						PATH = "${env.NODE_MAC_PATH}:${env.PATH}"
						LC_ALL = "en_US.UTF-8"
						LANG = "en_US.UTF-8"
					}
					steps {
						sh 'rm -rf build'
						unstash "ipa-testflight-staging"

						script {
							def util = load "ci/jenkins-lib/util.groovy"
							echo '$PATH'
							echo "$PATH"
						    util.runFastlane("de.tutao.tutanota.test", "upload_testflight_staging")
						} // steps
					}
				} // stage Testflight
			} // stages
		} // stage Staging

		stage('Prod') {
			when {
				expression { params.TARGET == 'prod' }
			}
			agent {
				label 'mac-m1'
			}

			stages {
				stage('Download ipa') {
					agent {
						label 'linux'
					}
					steps {
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							util.downloadFromNexus(groupId: "app",
												   artifactId: "ios",
												   version: VERSION,
												   outFile: "tutanota-${VERSION}.ipa",
												   fileExtension: 'ipa')
						   stash includes: "tutanota-${VERSION}.ipa", name: 'ipa-appstore-prod'
						}
					}
				} // stage Download ipa

				stage('Appstore') {
					environment {
						PATH = "${env.NODE_MAC_PATH}:${env.PATH}"
						LC_ALL = "en_US.UTF-8"
						LANG = "en_US.UTF-8"
					}
					steps {
						sh 'rm -rf build'
						unstash 'ipa-appstore-prod'

						script {
							def util = load "ci/jenkins-lib/util.groovy"
							util.downloadFromNexus(groupId: "app",
												   artifactId: "ios",
												   version: VERSION,
												   outFile: "tutanota-${VERSION}.ipa",
												   fileExtension: 'ipa')

						   	writeReleaseNotesForAppStore()
						 	util.runFastlane("de.tutao.tutanota", "upload_appstore_prod")
						} // steps
					}
				} // stage AppStore

				stage('Github release') {
					environment {
						PATH = "${env.NODE_PATH}:${env.PATH}"
					}
					agent {
						label 'linux'
					}
					steps {
						script {
							catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to create github release page for ios') {
								def tag = "tutanota-ios-release-${VERSION}"
								// need to run npm ci to install dependencies of releaseNotes.js
								sh "npm ci"

								writeFile file: "notes.txt", text: params.releaseNotes
								withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
									sh """node buildSrc/createReleaseDraft.js --name '${VERSION} (iOS)' \
																				   --tag 'tutanota-ios-release-${VERSION}' \
																				   --notes notes.txt"""
								} // withCredentials
								sh "rm notes.txt"
							} // catchError
						}
					}
				}
			} // stages
		} // stage Prod
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
