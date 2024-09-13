pipeline {
	environment {
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		APK_SIGN_STORE = '/opt/android-keystore/android.jks'
		PATH = "${env.NODE_PATH}:${env.PATH}:/home/jenkins/emsdk/upstream/bin/:/home/jenkins/emsdk/:/home/jenkins/emsdk/upstream/emscripten"
		ANDROID_SDK_ROOT = "/opt/android-sdk-linux"
		ANDROID_HOME = "/opt/android-sdk-linux"
		GITHUB_RELEASE_PAGE = "https://github.com/tutao/tutanota/releases/tag/tutanota-android-release-${VERSION}"
	}

	agent {
		label 'linux'
	}

	tools {
		jdk 'jdk-21.0.2'
	}

	parameters {
		booleanParam(
			name: 'RELEASE', defaultValue: false,
			description: "Build a test and release version of the app. " +
					"Uploads both to Nexus and creates a new release on google play, " +
					"which must be manually published from play.google.com/console"
		)
		persistentText(
			name: "releaseNotes",
			defaultValue: "",
			description: "release notes for this build"
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
		stage('Run Tests') {
			steps {
				dir("${WORKSPACE}/app-android/") {
					sh "./gradlew test"
				}
			}
		}
		stage('Build') {
			stages {
				stage('Testing') {
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
						stash includes: "build/app-android/tutanota-app-tutao-releaseTest-${VERSION}.apk", name: 'apk-testing'
					}
				} // stage testing
				stage('Production') {
					when {
						expression { return params.RELEASE }
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
						stash includes: "build/app-android/tutanota-app-tutao-release-${VERSION}.apk", name: 'apk-production'
					}
				} // stage production
			}
		}

		stage('Publish') {
			when {
				expression { return params.RELEASE }
			}
			stages {
				stage('Testing') {
					steps {
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							unstash 'apk-testing'

							util.publishToNexus(
									groupId: "app",
									artifactId: "android-test",
									version: "${VERSION}",
									assetFilePath: "${WORKSPACE}/build/app-android/tutanota-app-tutao-releaseTest-${VERSION}.apk",
									fileExtension: 'apk'
							)

							catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to upload android test app to Play Store') {
								// This doesn't publish to the main app on play store,
								// instead it gets published to the hidden "tutanota-test" app
								// this happens because the AppId is set to de.tutao.tutanota.test by the android build
								// and play store knows which app to publish just based on the id
								androidApkUpload(
										googleCredentialsId: 'android-app-publisher-credentials',
										apkFilesPattern: "build/app-android/tutanota-app-tutao-releaseTest-${VERSION}.apk",
										trackName: 'internal',
										rolloutPercentage: '100%',
										recentChangeList: [
												[
														language: "en-US",
														text    : "see: ${GITHUB_RELEASE_PAGE}"
												]
										]
								) // androidApkUpload
							} // catchError

						}
					}
				} // stage testing
				stage('Production') {
					steps {
						sh 'npm ci'
						unstash 'apk-production'

						script {
							def filePath = "build/app-android/tutanota-app-tutao-release-${VERSION}.apk"
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
				} // stage production
			}
		}
		stage('Tag and publish release page') {
			when {
				expression { return params.RELEASE }
			}
			steps {
				// Needed to upload it
				unstash 'apk-production'

				script {
					def filePath = "build/app-android/tutanota-app-tutao-release-${VERSION}.apk"

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
		}
	}
}
