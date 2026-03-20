import groovy.transform.Field
@Field def releaseNotes

pipeline {
	environment {
		PATH="${env.NODE_PATH}:${env.PATH}"
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
	}

    parameters {
        booleanParam(
            name: 'googlePlayStore',
            defaultValue: false,
            description: "Uploads android artifacts (aab) to Google PlayStore as a Draft on the public track."
        )
        booleanParam(
            name: 'appleAppStore',
            defaultValue: false,
            description: "Uploads iOS artifacts to Apple App Store as a Draft on the public track."
        )
        booleanParam(
        	name: 'github',
        	defaultValue: false,
        	description: "Uploads android artifact (apk) to GitHub and publish release notes."
        )
		string(
			name: 'appVersion',
			defaultValue: "",
			description: 'Which version should be published. Leave empty if you want to release the latest build and take the version number from package.json.'
		)
        booleanParam(
            name: "generateReleaseNotes",
            defaultValue: true,
            description: "Generate Release notes for this build."
        )
        string(
            name: 'branch',
            defaultValue: "*/master",
            description: "the branch to build the release from"
        )
        persistentString(
            name: "notify to",
            defaultValue:  "",
            description: "the mail addresses of the people that are responsible for updating the release notes on app store and play store (marketing)"
        )
    }

    agent {
		label 'linux'
	}

    stages {
    	stage("Checking params") {
			steps {
				script{
					if(!params.googlePlayStore && !params.appleAppStore && !params.github) {
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
					params.generateReleaseNotes && (params.googlePlayStore || params.appleAppStore || params.github)
				}
			}
			steps {
				sh "npm ci"
				script { // create release notes
					releaseNotes = [
					    android: params.googlePlayStore || params.github ? pregenerateReleaseNotes("android", env.VERSION) : null,
					    ios: params.appleAppStore || params.github ? pregenerateReleaseNotes("ios", env.VERSION) : null
					]

					if (params.appleAppStore || params.github) {
						env.IOS_RELEASE_NOTES = releaseNotes.ios
						echo releaseNotes.ios
					}

					if (params.googlePlayStore || params.github) {
						env.ANDROID_RELEASE_NOTES = releaseNotes.android
						echo releaseNotes.android
					}
				}
			} // steps
		} // stage Prepare Release Notes
		stage("GitHub Release") {
			stages {
				stage("GitHub Android Tag") {
					environment {
						VERSION = "${params.appVersion.trim() ?: env.VERSION}"
						FILE_PATH = "build-calendar-app/app-android/calendar-tutao-release-${VERSION}.apk"
						GITHUB_RELEASE_PAGE = "https://github.com/tutao/tutanota/releases/tag/tuta-calendar-android-release-${VERSION}"
					}
					when {
						expression {
							params.github && releaseNotes.android.trim()
						}
					}
					steps {
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							util.downloadFromNexus(	groupId: "app",
													artifactId: "calendar-android-apk",
													version: "${env.VERSION}",
													outFile: "${env.WORKSPACE}/${env.FILE_PATH}",
													fileExtension: 'apk')

							if (!fileExists("${env.FILE_PATH}")) {
								currentBuild.result = 'ABORTED'
								error("Unable to find file ${env.FILE_PATH}")
							}
							echo "File ${env.FILE_PATH} found!"

							catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to upload android app to GitHub') {
								writeReleaseNotes("android", "Android", "${env.VERSION}", "${env.WORKSPACE}/${env.FILE_PATH}")
							}
						} // script
					} // steps
				} // stage Android App
				stage("GitHub iOS Tag") {
					environment {
						VERSION = "${params.appVersion.trim() ?: env.VERSION}"
						GITHUB_RELEASE_PAGE = "https://github.com/tutao/tutanota/releases/tag/tuta-calendar-ios-release-${VERSION}"
					}
					when {
						expression {
							params.github && releaseNotes.ios
						}
					}
					steps {
						script {
							catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to upload iOS app to GitHub') {
								writeReleaseNotes("ios", "iOS", "${env.VERSION}", "")
							}
						} // script
					} // steps
				} // stage iOS App
			}
		}
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
									rolloutPercentage: '0%'
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
						PATH="/opt/homebrew/bin:${env.NODE_PATH}:${env.PATH}"
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
								label 'mac-m1'
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
        stage('notify about release') {
            when { expression { return params.target.equals("publishToProd") } }
            steps {
                script {
                    def starterId = currentBuild.getBuildCauses('hudson.model.Cause$UserIdCause')['userId'][0]
                    def starterMailAddress = "${starterId}@tutao.de"
                    bodyText = '''\
                    Hello everyone,

                    there's new release drafts for the CALENDAR app on github:

                    https://github.com/tutao/tutanota/releases

                    This is your opportunity to review them and see if any of this is relevant for the mobile app
                    release notes on the draft releases in the app stores (there may be multiple).

                    If you need help understanding what's in the release, the release master is in CC and will be happy
                    to help you out.

                    If you don't think there's a need to change the app store release notes, please still notify the
                    release master so they know it's fine to continue.

                    LG
                    '''.stripIndent()
                    mail body: bodyText, charset: 'UTF-8', mimeType: 'text/plain', subject: "📣 new calendar release, time to review release notes!", to: params.notify_to, cc: starterMailAddress;
                }
            }
        } // stage notify about release
    } // stages
} // pipeline


/**
platform must be one of the strings "ios", "android"
*/
def pregenerateReleaseNotes(platform, version) {
        return sh(returnStdout: true, script: """node buildSrc/releaseNotes.js --platform ${platform} --milestone ${version} """)
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
				def releaseDraftCommand = """node buildSrc/createReleaseDraft.js --name '[Calendar] ${version} (${displayName})' \
																					  --tag 'tuta-calendar-${platform}-release-${version}' \
																					  --notes notes.txt"""
				// We don't upload iOS artifacts to GitHub
				if (filePath != "" && platform == "android") {
					releaseDraftCommand = "${releaseDraftCommand} --uploadFile ${filePath}"
				}

				sh releaseDraftCommand
			}

			sh "rm notes.txt"
		}
	}

	sh "echo Created release notes for ${platform}"
}
