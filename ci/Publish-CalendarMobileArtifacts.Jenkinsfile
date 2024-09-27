import groovy.transform.Field
@Field def releaseNotes

pipeline {
	environment {
		PATH="${env.NODE_PATH}:${env.PATH}"
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		IOS_RELEASE_NOTES_PATH = "app-ios/fastlane/metadata/default/release_notes.txt"
	}

    parameters {
        booleanParam(
            name: 'googlePlayStore',
            defaultValue: true,
            description: "Uploads android artifacts (aab) to Google PlayStore as a Draft on the public track."
        )
        booleanParam(
            name: 'appleAppStore',
            defaultValue: false,
            description: "Uploads iOS artifacts to Apple App Store as a Draft on the public track."
        )
		string(
			name: 'appVersion',
			defaultValue: "",
			description: 'Which version should be published.'
		)
		booleanParam(
			name: "generateReleaseNotes",
			defaultValue: true,
			description: "Generate Release notes for this build."
		 )
    }

    agent {
		label 'linux'
	}

    stages {
    	stage("Checking params") {
			steps {
				script{
					if(!params.googlePlayStore && !params.appleAppStore) {
						currentBuild.result = 'ABORTED'
						error('No artifacts were selected.')
					}
				}
				echo "Params OKAY"
			}
    	}
		stage("Prepare Release Notes") {
			environment {
				VERSION = "${params.appVersion.trim() ?: env.VERSION}"
			}
			when {
				expression {
					params.generateReleaseNotes && (params.googlePlayStore || params.appleAppStore)
				}
			}
			steps {
				sh "npm ci"
				script { // create release notes
					def android = params.googlePlayStore ? pregenerateReleaseNotes("android", env.VERSION) : null
					def ios = params.appleAppStore ? pregenerateReleaseNotes("ios", env.VERSION) : null

					// Assigns the dict returned by reviewReleaseNotes with the notes for each platform to the global var releaseNotes
					releaseNotes = reviewReleaseNotes(android, ios, env.VERSION)

					if (params.appleAppStore) {
						env.IOS_RELEASE_NOTES = releaseNotes.ios
						echo releaseNotes.ios
					}

					if (params.googlePlayStore) {
						env.ANDROID_RELEASE_NOTES = releaseNotes.android
						echo releaseNotes.android
					}
				}
			} // steps
		} // stage Prepare Release Notes
		stage('Tag and publish release page') {
			parallel {
				stage("Github Android Release Notes") {
					environment {
						VERSION = "${params.appVersion.trim() ?: env.VERSION}"
						FILE_PATH = "build-calendar-app/app-android/calendar-tutao-release-${env.VERSION}.aab"
					}
					when {
						expression {
							params.googlePlayStore && releaseNotes.android.trim()
						}
					}
					steps {
						script {
							writeReleaseNotes("android", "Android", "${env.VERSION}", "${env.WORKSPACE}/${env.FILE_PATH}")
						} // script
					} // steps
				}// Stage Github Android Release Notes
				stage("Github iOS Release Notes") {
					environment {
						VERSION = "${params.appVersion.trim() ?: env.VERSION}"
					}
					when {
						expression {
							params.appleAppStore && releaseNotes.ios.trim()
						}
					}
					steps {
						script {
							writeReleaseNotes("ios", "iOS", "${env.VERSION}", "")
						} // script
					} // steps
				}// Stage Github iOS Release Notes
			} // parallel release notes
		} // stage Tag and publish release page
		stage("Publishing Artifacts to Stores") {
			parallel {
				stage("Android App") {
					environment {
						VERSION = "${params.appVersion.trim() ?: env.VERSION}"
						FILE_PATH = "build-calendar-app/app-android/calendar-tutao-release-${VERSION}.aab"
						GITHUB_RELEASE_PAGE = "https://github.com/tutao/tutanota/releases/tag/tuta-calendar-android-release-${VERSION}"
					}
					when {
						expression {
							params.googlePlayStore
						}
					}
					steps {
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							util.downloadFromNexus(	groupId: "app",
													artifactId: "calendar-android",
													version: "${env.VERSION}",
													outFile: "${env.WORKSPACE}/${env.FILE_PATH}",
													fileExtension: 'aab')
							if (!fileExists("${env.FILE_PATH}")) {
								currentBuild.result = 'ABORTED'
								error("Unable to find file ${env.FILE_PATH}")
							}
							echo "File ${env.FILE_PATH} found!"

							catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to upload android test app to Play Store') {
								androidApkUpload(
									googleCredentialsId: 'android-app-publisher-credentials',
									apkFilesPattern: "${env.FILE_PATH}",
									trackName: 'production',
									// Don't publish the app to users directly
									// It will require manual intervention at play.google.com/console
									rolloutPercentage: '0%',
									recentChangeList: [
										[
											language: "en-US",
											text    : "see: ${env.GITHUB_RELEASE_PAGE}"
										]
									]
								)
							}
						} // script
					} // steps
				} // stage Android App
				stage("iOS App") {
					environment {
						VERSION = "${params.appVersion.trim() ?: env.VERSION}"
						FILE_PATH = "app-ios/releases/calendar-tutao-${VERSION}.ipa"
						GITHUB_RELEASE_PAGE = "https://github.com/tutao/tutanota/releases/tag/tuta-calendar-ios-release-${VERSION}"
					}
					stages {
						stage("Download artifact") {
							when {
								expression {
									params.appleAppStore || params.appleTestflight
								}
							}
							steps {
								script {
									def util = load "ci/jenkins-lib/util.groovy"
									util.downloadFromNexus(groupId: "app",
														   artifactId: "calendar-ios",
														   version: "${env.VERSION}",
														   outFile: "${env.WORKSPACE}/${env.FILE_PATH}",
														   fileExtension: "ipa")

									if (!fileExists("${env.FILE_PATH}")) {
										currentBuild.result = 'ABORTED'
										error("Unable to find file ${env.FILE_PATH}")
									}
									echo "File ${env.FILE_PATH} found!"
									stash includes: "${env.FILE_PATH}", name: 'ipa'
								}
							}
					 	}
						stage("Publish to AppStore") {
							when {
								expression {
									params.appleAppStore
								}
							}
							agent {
								label 'mac-intel'
							}

							steps {
								script {
									def util = load "ci/jenkins-lib/util.groovy"
									dir("${env.WORKSPACE}") {
										unstash 'ipa'
									}
									util.runFastlane("de.tutao.calendar", "publish_calendar_prod file:${env.WORKSPACE}/${env.FILE_PATH}")
								}
							}
						}
					}
				} // stage iOS App
			} // parallel apps
		} // stage Publishing Artifacts
    } // stages
} // pipeline


/**
platform must be one of the strings "ios", "android"
*/
def pregenerateReleaseNotes(platform, version) {
        return sh(returnStdout: true, script: """node buildSrc/releaseNotes.js --platform ${platform} --milestone ${version} """)
}

/**
 all parameters are nullable strings.
*/
def reviewReleaseNotes(android, ios, version) {
	// only display input fields for the clients we're actually building.
    def parameters = [
         android ? text(defaultValue: android, description: "Android release notes built from Github Milestone", name: "android") : null,
         ios ? text(defaultValue: ios, description: 'Ios release notes built from Github Milestone', name: 'ios') : null,
         // If the dummy field is removed, when there is only an option a string will be returned instead(we dont want that)
         booleanParam(defaultValue: true, description: "dummy param so we always get a dict back", name: "dummy"),
     ].findAll { it != null }
    // Get the input
    // https://www.jenkins.io/doc/pipeline/steps/pipeline-input-step/
    return input(id: 'releaseNotesInput', message: 'Release Notes', parameters: parameters)
}

/**
platform must be one of the strings "ios", "android"
filePath can be null
*/
def writeReleaseNotes(String platform, String displayName, String version, String filePath) {
	script {
		catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: "Failed to create github release page for ${platform}") {
			sh "npm ci"
			writeFile file: "notes.txt", text: platform == "ios" ? releaseNotes.ios : releaseNotes.android
			withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
				def releaseDraftCommand = """node buildSrc/createReleaseDraft.js --name '${version} (${displayName})' \
																					  --tag 'tuta-calendar-${platform}-release-${version}' \
																					  --notes notes.txt"""
				// We don't upload iOS artifacts to GitHub
				if (filePath != "" && platform == "android") {
					releaseDraftCommand = "${releaseDraftCommand} --uploadFile ${filePath}"
				} else if (platform == "ios") {
					releaseDraftCommand = "${releaseDraftCommand} --toFile ${IOS_RELEASE_NOTES_PATH}"
				}

				sh releaseDraftCommand
			}

			sh "rm notes.txt"
		}
	}

	sh "echo Created release notes for ${platform}"
}
