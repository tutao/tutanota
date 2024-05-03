pipeline {
	environment {
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node buildSrc/getTutanotaAppVersion.js")
		PATH = "${env.NODE_PATH}:${env.PATH}"
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
		stage('Run Tests') {
			steps {
				dir("${WORKSPACE}/app-android/") {
					sh "./gradlew test"
				}
			}
		}

		stage('Staging') {
			when {
				expression { params.TARGET == 'staging' }
			}
			agent {
				label 'linux'
			}

			stages {
				stage('Play Store') {
					sh 'rm -rf build'

					script {
						def util = load "ci/jenkins-lib/util.groovy"
						util.downloadFromNexus(groupId: "app",
											   artifactId: "android-test",
											   version: VERSION,
											   outFile: "build/app-android/tutanota-tutao-releaseTest-${VERSION}.apk",
											   fileExtension: 'apk')

						// This doesn't publish to the main app on play store,
						// instead it gets published to the hidden "tutanota-test" app
						// this happens because the AppId is set to de.tutao.tutanota.test by the android build
						// and play store knows which app to publish just based on the id
						androidApkUpload(
								googleCredentialsId: 'android-app-publisher-credentials',
								apkFilesPattern: "build/app-android/tutanota-tutao-releaseTest-${VERSION}.apk",
								trackName: 'internal',
								rolloutPercentage: '100%',
								recentChangeList: [
										[
												language: "en-US",
												text    : "see: ${GITHUB_RELEASE_PAGE}"
										]
								]
						) // androidApkUpload
					}
				} // stage Play Store
			} // stages
		} // stage Staging

		stage('Production') {
			when {
				expression { params.TARGET == 'prod' }
			}
			agent {
				label 'linux'
			}

			stages {
				stage('Play Store') {
					sh 'rm -rf build'

					script {
						def util = load "ci/jenkins-lib/util.groovy"
						util.downloadFromNexus(groupId: "app",
											   artifactId: "android",
											   version: VERSION,
											   outFile: "build/app-android/tutanota-tutao-release-${VERSION}.apk",
											   fileExtension: 'apk')

						// This doesn't publish to the main app on play store,
						// instead it gets published to the hidden "tutanota-test" app
						// this happens because the AppId is set to de.tutao.tutanota.test by the android build
						// and play store knows which app to publish just based on the id
						androidApkUpload(
								googleCredentialsId: 'android-app-publisher-credentials',
								apkFilesPattern: "build/app-android/tutanota-tutao-release-${VERSION}.apk",
								trackName: 'production',
								rolloutPercentage: '7%',
								recentChangeList: [
										[
												language: "en-US",
												text    : "see: ${GITHUB_RELEASE_PAGE}"
										]
								]
						) // androidApkUpload
					}
				} // stage Play Store

				stage('Github release') {
					steps {
						// Needed to upload it
						unstash 'apk-production'

						script {
							def filePath = "build/app-android/tutanota-tutao-release-${VERSION}.apk"

							writeFile file: "notes.txt", text: params.releaseNotes
							catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to create github release page for android') {
								withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
									sh """node buildSrc/createReleaseDraft.js --name '${VERSION} (Android)' \
																		   --tag 'tutanota-android-release-${VERSION}' \
																		   --uploadFile '${WORKSPACE}/${filePath}' \
																		   --notes notes.txt"""
								} // withCredentials
							} // catchError
							sh "rm notes.txt"
						} // script
					}
				} // stage Github release
			} // stages
		} // stage Staging
	}
}
