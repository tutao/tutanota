pipeline {
	environment {
		NODE_PATH = "/opt/node-v16.3.0-linux-x64/bin"
		VERSION = sh(returnStdout: true, script: "${NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		APK_SIGN_STORE = '/opt/android-keystore/android.jks'
		PATH = "${env.NODE_PATH}:${env.PATH}"
		ANDROID_SDK_ROOT = "/opt/android-sdk-linux"
		ANDROID_HOME = "/opt/android-sdk-linux"
		GITHUB_RELEASE_PAGE = "https://github.com/tutao/tutanota/releases/tag/tutanota-android-release-${VERSION}"
	}

	agent {
		label 'linux'
	}

	parameters {
		booleanParam(
				name: 'RELEASE', defaultValue: false,
				description: "Build a test and release version of the app. " +
						"Uploads both to Nexus and creates a new release on google play, " +
						"which must be manually published from play.google.com/console"
		)
		string(
				name: 'MILESTONE',
				defaultValue: '',
				description: 'Which github milestone to reference for generating release notes. Defaults to the version number'
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
		stage('Test') {
			steps {
				dir("${WORKSPACE}/app-android/") {
					sh "./gradlew test"
				}
			}
		}

		stage('Build') {
			stages {
				stage('Staging') {
					environment {
						APK_SIGN_ALIAS = "test.tutao.de"
					}
					agent {
						label 'linux'
					}
					steps {
						sh 'npm ci'
						sh 'npm run build-packages'
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							util.downloadFromNexus(	groupId: "lib",
													artifactId: "android-database-sqlcipher",
													version: "4.5.0",
													outFile: "${WORKSPACE}/app-android/libs/android-database-sqlcipher-4.5.0.aar",
													fileExtension: 'aar')
						}
						withCredentials([
								string(credentialsId: 'apk-sign-store-pass', variable: "APK_SIGN_STORE_PASS"),
								string(credentialsId: 'apk-sign-key-pass', variable: "APK_SIGN_KEY_PASS")
						]) {
							sh 'node android.js -b releaseTest test'
						}
						stash includes: "build/app-android/tutanota-tutao-releaseTest-${VERSION}.apk", name: 'apk-staging'
					}
				}
				stage('Production') {
					when {
						expression { params.RELEASE }
					}
					environment {
						APK_SIGN_ALIAS = "tutao.de"
					}
					steps {
						echo "Building ${VERSION}"
						sh 'npm ci'
						sh 'npm run build-packages'
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							util.downloadFromNexus(	groupId: "lib",
													artifactId: "android-database-sqlcipher",
													version: "4.5.0",
													outFile: "${WORKSPACE}/app-android/libs/android-database-sqlcipher-4.5.0.aar",
													fileExtension: 'aar')
						}
						withCredentials([
								string(credentialsId: 'apk-sign-store-pass', variable: "APK_SIGN_STORE_PASS"),
								string(credentialsId: 'apk-sign-key-pass', variable: "APK_SIGN_KEY_PASS")
						]) {
							sh 'node android.js -b release prod'
						}
						stash includes: "build/app-android/tutanota-tutao-release-${VERSION}.apk", name: 'apk-production'
					}
				}
			}
		}

		stage('Publish') {
			when {
				expression { params.RELEASE }
			}
			stages {
				stage('Staging') {
					steps {
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							unstash 'apk-staging'

							util.publishToNexus(
									groupId: "app",
									artifactId: "android-test",
									version: "${VERSION}",
									assetFilePath: "${WORKSPACE}/build/app-android/tutanota-tutao-releaseTest-${VERSION}.apk",
									fileExtension: 'apk'
							)

							// This doesn't publish to the main app on play store,
							// instead it get's published to the hidden "tutanota-test" app
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
							)
						}
					}
				}
				stage('Production') {
					steps {
						sh 'npm ci'
						unstash 'apk-production'

						script {
							def filePath = "build/app-android/tutanota-tutao-release-${VERSION}.apk"
							def util = load "ci/jenkins-lib/util.groovy"

							util.publishToNexus(
									groupId: "app",
									artifactId: "android",
									version: "${VERSION}",
									assetFilePath: "${WORKSPACE}/${filePath}",
									fileExtension: 'apk'
							)

							androidApkUpload(
									googleCredentialsId: 'android-app-publisher-credentials',
									apkFilesPattern: "${filePath}",
									trackName: 'production',
									// Don't publish the app to users directly
									// It will require manual intervention at play.google.com/console
									rolloutPercentage: '0%',
									recentChangeList: [
											[
													language: "en-US",
													text    : "see: ${GITHUB_RELEASE_PAGE}"
											]
									]
							)
						}
					}
				}
			}
		}
		stage('Tag and publish release page') {
			when {
				expression { params.RELEASE }
			}
			steps {
				// Needed to upload it
				unstash 'apk-production'

				script {
					def filePath = "build/app-android/tutanota-tutao-release-${VERSION}.apk"
					def milestone = params.MILESTONE.trim().equals("") ? VERSION : params.MILESTONE
					catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to create github release page') {
						withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
							sh """node buildSrc/releaseNotes.js --releaseName '${VERSION} (Android)' \
																   --milestone '${milestone}' \
																   --tag '${tag}' \
																   --uploadFile '${WORKSPACE}/${filePath}' \
																   --platform android"""
						}
					}
				}
			}
		}
	}
}
