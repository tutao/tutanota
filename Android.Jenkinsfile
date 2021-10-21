pipeline {
	environment {
		NODE_PATH="/opt/node-v16.3.0-linux-x64/bin"
		VERSION = sh(returnStdout: true, script: "${NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		APK_SIGN_STORE = '/opt/android-keystore/android.jks'
		PATH="${env.NODE_PATH}:${env.PATH}"
		ANDROID_SDK_ROOT="/opt/android-sdk-linux"
		ANDROID_HOME="/opt/android-sdk-linux"
		GITHUB_RELEASE_PAGE="https://github.com/tutao/tutanota/releases/tag/tutanota-android-release-${VERSION}"
	}

	agent {
		label 'linux'
	}

	parameters {
		booleanParam(name: 'PROD', defaultValue: false, description: 'Build for production')
		booleanParam(
			name: 'PUBLISH', defaultValue: false,
			description: "Publish the app to Nexus and Google Play (when not in production mode, " +
					     "it will publish to the internal testing track of the tutanota-test app on Play)"
		 )
	}

	stages {
		stage('Run Android tests') {
			steps {
				dir("${WORKSPACE}/app-android/") {
					sh "./gradlew test"
				}
			}
		}

		stage('Build android app: production') {
			environment {
				APK_SIGN_ALIAS = "tutao.de"
			}
			when {
				expression { params.PROD }
			}
			steps {
				echo "Building ${VERSION}"
				sh 'npm ci'
				withCredentials([
					string(credentialsId: 'apk-sign-store-pass', variable: "APK_SIGN_STORE_PASS"),
					string(credentialsId: 'apk-sign-key-pass', variable: "APK_SIGN_KEY_PASS")
				]) {
					sh 'node android.js -b release prod'
				}
				stash includes: "build/app-android/tutanota-tutao-release-${VERSION}.apk", name: 'apk'
			}
		}

		stage('Build android app: staging') {
			environment {
				APK_SIGN_ALIAS = "test.tutao.de"
			}
			when {
				not { expression { params.PROD } }
			}
			agent {
				label 'linux'
			}
			steps {
				sh 'npm ci'
				withCredentials([
					string(credentialsId: 'apk-sign-store-pass', variable: "APK_SIGN_STORE_PASS"),
					string(credentialsId: 'apk-sign-key-pass', variable: "APK_SIGN_KEY_PASS")
				]) {
					sh 'node android.js -b releaseTest test'
				}
				stash includes: "build/app-android/tutanota-tutao-releaseTest-${VERSION}.apk", name: 'apk'
			}
		}

		stage('Publish android app: production') {
			when {
				expression { params.PROD }
				expression { params.PUBLISH }
			}
			steps {
				sh 'npm ci'

				unstash 'apk'

				script {
					def filePath = "build/app-android/tutanota-tutao-release-${VERSION}.apk"
					def tag = "tutanota-android-release-${VERSION}"
					def util = load "jenkins-lib/util.groovy"

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
						rolloutPercentage: '100%',
						recentChangeList: [
							[
								language: "en-US",
								text: "see: ${GITHUB_RELEASE_PAGE}"
							]
						]
					)


					sh "git tag ${tag}"
					sh "git push --tags"

					def checksum = sh(returnStdout: true, script: "sha256sum ${WORKSPACE}/${filePath}")

					withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
						sh """node buildSrc/createGithubReleasePage.js --name '${VERSION} (Android)' \
																	   --milestone '${VERSION}' \
																	   --tag '${tag}' \
																	   --uploadFile '${WORKSPACE}/${filePath}' \
																	   --platform android \
							 										   --apkChecksum ${checksum}"""
					}
				}
			}
		}

		stage('Publish android app: staging') {
			when {
				not { expression { params.PROD } }
				expression { params.PUBLISH }
			}
			steps {
				script {
					def util = load "jenkins-lib/util.groovy"

					unstash 'apk'

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
								text: "see: ${GITHUB_RELEASE_PAGE}"
							]
						]
					)
				}
			}
		}
	}
}
