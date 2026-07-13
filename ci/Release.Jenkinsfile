// would have preferred to do all client builds and the release note input completely in parallel,
// but that would require nested parallel blocks which is not supported in declarative pipelines.
def releaseNotes

pipeline {
	environment {
		PATH = "${env.NODE_PATH}:${env.PATH}"
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
	}

	parameters {
		choice(
				name: 'target',
				choices: ['dryRun', 'buildAndPublishToStaging', 'publishToStaging', 'publishToProd'],
				description: "dryRun: build no-op (only the prod version is built for mobile)<br>" +
						"buildAndPublishToStaging: builds staging and prod, uploads both to Nexus, and publishes to staging<br>" +
						"publishToStaging: downloads from Nexus and publishes to staging<br>" +
						"publishToProd: downloads from Nexus, publishes to prod, and generates release notes"
		)
		persistentString(
				name: 'milestone',
				defaultValue: '',
				description: 'Which github milestone to reference for generating release notes. leave empty to use version number'
		)
		booleanParam(
				name: "dictionaries",
				defaultValue: false,
				description: "download, update and package the current desktop dictionaries"
		)
		booleanParam(
				name: 'web',
				defaultValue: true,
				description: "Build the web app and packages (required to build the other clients if the version changed)"
		)
		booleanParam(
				name: 'ios_mail',
				defaultValue: true,
				description: "Build Mail iOS app"
		)
		booleanParam(
				name: 'android_mail',
				defaultValue: true,
				description: "Build Mail Android app"
		)
		booleanParam(
				name: 'ios_calendar',
				defaultValue: true,
				description: "Build Calendar iOS app"
		)
		booleanParam(
				name: 'android_calendar',
				defaultValue: true,
				description: "Build Calendar Android app"
		)
		booleanParam(
				name: 'ios_drive',
				defaultValue: true,
				description: "Build Drive iOS app"
		)
		booleanParam(
				name: 'android_drive',
				defaultValue: true,
				description: "Build Drive Android app"
		)
		booleanParam(
				name: 'desktop',
				defaultValue: true,
				description: "Build the desktop app"
		)
		string(
				name: 'branch',
				defaultValue: "*/master",
				description: "the branch to build the release from, will be propagated to the sub-jobs."
		)
		persistentString(
				name: "notify to",
				defaultValue: "",
				description: "the mail addresses of the people that are responsible for updating the release notes on app store and play store (marketing)"
		)
	}

	agent {
		label 'master'
	}

	stages {
		stage("Prepare Release Notes") {
			agent { label 'master' }
			// Release Notes are only generating when publishing to Prod
			when {
				expression {
					params.target == "publishToProd" &&
							(params.web || params.desktop || params.android_mail || params.ios_mail || params.android_calendar || params.ios_calendar || params.android_drive || params.ios_drive)
				}
			}
			steps {
				sh "npm ci"
				script { // create release notes
					releaseNotes = [
							web             : params.web ? pregenerateReleaseNotes("web") : null,
							desktop         : params.desktop ? pregenerateReleaseNotes("desktop") : null,
							android_mail    : params.android_mail ? pregenerateReleaseNotes("android") : null,
							ios_mail        : params.ios_mail ? pregenerateReleaseNotes("ios") : null,
							android_calendar: params.android_calendar ? pregenerateReleaseNotes("android") : null,
							ios_calendar    : params.ios_calendar ? pregenerateReleaseNotes("ios") : null,
							android_drive   : params.android_drive ? pregenerateReleaseNotes("android") : null,
							ios_drive       : params.ios_drive ? pregenerateReleaseNotes("ios") : null,
					]
					echo("${releaseNotes}")
				} // script
			} // steps
		} // stage prepare release notes
		stage("Clients") {
			// Web/Desktop and Mobile are ran sequentially because we ran into resource allocation issues
			stages {
				stage("Web and Desktop") {
					parallel {
						stage("Web App & Packages") {
							when {
								beforeAgent true
								expression { params.web }
							}
							agent { label 'master' }
							stages {
								stage("Build Web") {
									when { expression { shouldBuild() } }
									steps {
										build job: 'tutanota-3-webapp', parameters: [
												booleanParam(name: "UPLOAD", value: params.target.equals("buildAndPublishToStaging")),
												string(name: "branch", value: params.branch)
										]
									} // steps
								} // stage build
								stage("Publish Web") {
									when {
										expression { params.target != "dryRun" }
									}
									steps {
										build job: 'tutanota-3-webapp-publish', parameters: params.target.equals("publishToProd") ? [
												booleanParam(name: 'DEB', value: true),
												booleanParam(name: 'PUBLISH_NPM_MODULES', value: false),
												booleanParam(name: 'GITHUB_RELEASE', value: true),
												text(name: "releaseNotes", value: releaseNotes.web),
												string(name: "branch", value: params.branch)
										] : [
												booleanParam(name: 'DEB', value: true),
												booleanParam(name: 'PUBLISH_NPM_MODULES', value: params.target.equals("buildAndPublishToStaging")),
												booleanParam(name: 'GITHUB_RELEASE', value: false),
												string(name: "branch", value: params.branch)
										]
									} // steps
								} // stage publish
							} // stages
						} // stage web app & packages

						stage("Desktop Dicts") {
							when { expression { params.dictionaries } }
							steps {
								script {
									build job: 'tutanota-3-desktop-dictionaries', parameters: [
											booleanParam(name: "RELEASE", value: !params.target.equals("dryRun")),
											string(name: "branch", value: params.branch)
									]
								} // script
							} // steps
						} // stage desktop dicts

						stage("Desktop Client") {
							when {
								expression { params.desktop }
							}
							stages {
								stage("Build Desktop") {
									when {
										expression { shouldBuild() }
									}
									steps {
										script {
											build job: 'tutanota-3-desktop', parameters: [
													booleanParam(name: "UPLOAD", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "WINDOWS", value: true),
													booleanParam(name: "MAC", value: true),
													booleanParam(name: "LINUX", value: true),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage build
								stage("Publish Desktop") {
									when {
										expression { params.target != "dryRun" }
									}
									steps {
										script {
											build job: 'tutanota-3-desktop-publish', parameters: params.target.equals("publishToProd") ? [
													booleanParam(name: "DEB", value: true),
													booleanParam(name: "GITHUB_RELEASE", value: true),
													text(name: "releaseNotes", value: releaseNotes.desktop),
													string(name: "branch", value: params.branch)
											] : [
													booleanParam(name: "DEB", value: true),
													booleanParam(name: "GITHUB_RELEASE", value: false),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage publish
							} // stages
						} // stage desktop client
					} // parallel
				} // stage web and desktop

				stage("Mail Mobile") {
					parallel {
						stage("iOS Client") {
							when {
								expression { params.ios_mail }
							}
							stages {
								stage("Build iOS") {
									when {
										expression { shouldBuild() }
									}
									steps {
										script {
											build job: 'tutanota-3-ios', parameters: [
													booleanParam(name: "UPLOAD", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "STAGING", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "PROD", value: true),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage build
								stage("Publish iOS") {
									when {
										expression { params.target != "dryRun" }
									}
									steps {
										script {
											build job: 'tutanota-3-ios-publish', parameters: params.target.equals("publishToProd") ? [
													booleanParam(name: "STAGING", value: false),
													booleanParam(name: "PROD", value: true),
													booleanParam(name: "GITHUB_RELEASE", value: true),
													text(name: "releaseNotes", value: releaseNotes.ios_mail),
													string(name: "branch", value: params.branch)
											] : [
													booleanParam(name: "STAGING", value: true),
													booleanParam(name: "PROD", value: false),
													booleanParam(name: "GITHUB_RELEASE", value: false),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage publish
							} // stages
						} // stage ios client

						stage("Android Client") {
							when { expression { params.android_mail } }
							stages {
								stage("Build Android") {
									when {
										expression { shouldBuild() }
									}
									steps {
										script {
											build job: 'tutanota-3-android', parameters: [
													booleanParam(name: "UPLOAD", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "STAGING", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "PROD", value: true),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage build
								stage("Publish Android") {
									when { expression { params.target != "dryRun" } }
									steps {
										script {
											build job: 'tutanota-3-android-publish', parameters: params.target.equals("publishToProd") ? [
													booleanParam(name: "STAGING", value: false),
													booleanParam(name: "PROD", value: true),
													booleanParam(name: "GITHUB_RELEASE", value: true),
													text(name: "releaseNotes", value: releaseNotes.android_mail),
													string(name: "branch", value: params.branch)
											] : [
													booleanParam(name: "STAGING", value: true),
													booleanParam(name: "PROD", value: false),
													booleanParam(name: "GITHUB_RELEASE", value: false),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage publish
							} // stages
						} // stage android client
					} // parallel
				} // stage Mail Mobile
				stage("Calendar Mobile") {
					parallel {
						stage("Calendar iOS") {
							when { expression { params.ios_calendar } }
							stages {
								stage("Build Calendar iOS") {
									when { expression { shouldBuild() } }
									steps {
										script {
											build job: 'tuta-calendar-ios', parameters: [
													booleanParam(name: "UPLOAD", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "STAGING", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "PROD", value: true),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage build
								stage("Publish Calendar iOS") {
									when { expression { params.target != "dryRun" } }
									steps {
										script {
											build job: 'tuta-calendar-ios-publish', parameters: params.target.equals("publishToProd") ? [
													booleanParam(name: "STAGING", value: false),
													booleanParam(name: "PROD", value: true),
													booleanParam(name: "GITHUB_RELEASE", value: true),
													text(name: "releaseNotes", value: releaseNotes.ios_calendar),
													string(name: "branch", value: params.branch)
											] : [
													booleanParam(name: "STAGING", value: true),
													booleanParam(name: "PROD", value: false),
													booleanParam(name: "GITHUB_RELEASE", value: false),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage publish
							} // stages
						} // stage ios client

						stage("Calendar Android") {
							when { expression { params.android_calendar } }
							stages {
								stage("Build Calendar Android") {
									when { expression { shouldBuild() } }
									steps {
										script {
											build job: 'tuta-calendar-android', parameters: [
													booleanParam(name: "UPLOAD", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "STAGING", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "PROD", value: true),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage build
								stage("Publish Calendar Android") {
									when { expression { params.target != "dryRun" } }
									steps {
										script {
											build job: 'tuta-calendar-android-publish', parameters: params.target.equals("publishToProd") ? [
													booleanParam(name: "STAGING", value: false),
													booleanParam(name: "PROD", value: true),
													booleanParam(name: "GITHUB_RELEASE", value: true),
													text(name: "releaseNotes", value: releaseNotes.android_calendar),
													string(name: "branch", value: params.branch)
											] : [
													booleanParam(name: "STAGING", value: true),
													booleanParam(name: "PROD", value: false),
													booleanParam(name: "GITHUB_RELEASE", value: false),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage publish
							} // stages
						} // stage android client
					} // parallel
				} // stage Calendar Mobile
				stage("Drive Mobile") {
					parallel {
						stage("Drive iOS") {
							when { expression { params.ios_drive } }
							stages {
								stage("Build Drive iOS") {
									when { expression { shouldBuild() } }
									steps {
										script {
											build job: 'tuta-drive-ios', parameters: [
													booleanParam(name: "UPLOAD", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "STAGING", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "PROD", value: true),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage build
								stage("Publish Drive iOS") {
									when { expression { params.target != "dryRun" } }
									steps {
										script {
											build job: 'tuta-drive-ios-publish', parameters: params.target.equals("publishToProd") ? [
													booleanParam(name: "STAGING", value: false),
													booleanParam(name: "PROD", value: true),
													booleanParam(name: "GITHUB_RELEASE", value: true),
													text(name: "releaseNotes", value: releaseNotes.ios_drive),
													string(name: "branch", value: params.branch)
											] : [
													booleanParam(name: "STAGING", value: true),
													booleanParam(name: "PROD", value: false),
													booleanParam(name: "GITHUB_RELEASE", value: false),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage publish
							} // stages
						} // stage ios client

						stage("Drive Android") {
							when { expression { params.android_drive } }
							stages {
								stage("Build Drive Android") {
									when { expression { shouldBuild() } }
									steps {
										script {
											build job: 'tuta-drive-android', parameters: [
													booleanParam(name: "UPLOAD", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "STAGING", value: params.target.equals("buildAndPublishToStaging")),
													booleanParam(name: "PROD", value: true),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage build
								stage("Publish Drive Android") {
									when { expression { params.target != "dryRun" } }
									steps {
										script {
											build job: 'tuta-drive-android-publish', parameters: params.target == "publishToProd" ? [
													booleanParam(name: "STAGING", value: false),
													booleanParam(name: "PROD", value: true),
													booleanParam(name: "GITHUB_RELEASE", value: true),
													text(name: "releaseNotes", value: releaseNotes.android_drive),
													string(name: "branch", value: params.branch)
											] : [
													booleanParam(name: "STAGING", value: true),
													booleanParam(name: "PROD", value: false),
													booleanParam(name: "GITHUB_RELEASE", value: false),
													string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage publish
							} // stages
						} // stage android client
					} // parallel
				} // stage Drive Mobile
			} // stages
		} // stage other clients
		stage('notify about release') {
			when { expression { params.target == "publishToProd" } }
			steps {
				script {
					def starterId = currentBuild.getBuildCauses('hudson.model.Cause$UserIdCause')['userId'][0]
					def starterMailAddress = "${starterId}@tutao.de"
					bodyText = '''\
                    Hello everyone,

                    there's new release drafts for the MAIL app on github:

                    https://github.com/tutao/tutanota/releases

                    This is your opportunity to review them and see if any of this is relevant for the mobile app
                    release notes on the draft releases in the app stores (there may be multiple).

                    If you need help understanding what's in the release, the release master is in CC and will be happy
                    to help you out.

                    If you don't think there's a need to change the app store release notes, please still notify the
                    release master so they know it's fine to continue.

                    LG
                    '''.stripIndent()
					mail body: bodyText, charset: 'UTF-8', mimeType: 'text/plain', subject: "📣 new mail release, time to review release notes!", to: params.notify_to, cc: starterMailAddress;
				}
			}
		} // stage notify about release
	} // stages
} // pipeline


/**
 platform must be one of the strings ios, android, desktop, web
 */
def pregenerateReleaseNotes(platform) {
	def milestone = params.milestone.trim().equals("") ? VERSION : params.milestone
	return sh(returnStdout: true, script: """node buildSrc/releaseNotes.js --platform ${platform} --milestone ${milestone} """)
}

def shouldBuild() {
	return params.target == "dryRun" || params.target == "buildAndPublishToStaging"
}