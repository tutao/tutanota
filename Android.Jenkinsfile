pipeline {
	environment {
		NODE_PATH="/opt/node-v16.3.0-linux-x64/bin"
		VERSION = sh(returnStdout: true, script: "${NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		APK_SIGN_STORE = '/opt/android-keystore/android.jks'
		APK_SIGN_STORE_PASS = credentials('apk-sign-store-pass')
		PATH="${env.NODE_PATH}:${env.PATH}"
		ANDROID_SDK_ROOT="/opt/android-sdk-linux"
		ANDROID_HOME="/opt/android-sdk-linux"
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
					sh "JAVA_HOME=/opt/jdk1.8.0_112 ./gradlew test"
				}
			}
		}

		stage('Build android app: production') {
			environment {
				APK_SIGN_ALIAS = "tutao.de"
				APK_SIGN_KEY_PASS = credentials('apk-sign-key-pass')
			}
			when {
				expression { params.PROD }
			}
			steps {
				echo "Building ${VERSION}"
				sh 'npm ci'
				sh 'node android.js -b release prod'
				stash includes: "build/app-android/tutanota-${VERSION}-release.apk", name: 'apk'
			}
		}

		stage('Build android app: staging') {
			environment {
				APK_SIGN_ALIAS = "test.tutao.de"
				APK_SIGN_KEY_PASS = credentials('apk-sign-key-pass')
			}
			when {
				not { expression { params.PROD } }
			}
			agent {
				label 'linux'
			}
			steps {
				sh 'npm ci'
				sh 'node android.js -b releaseTest test'
				stash includes: "build/app-android/tutanota-${VERSION}-releaseTest.apk", name: 'apk'
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
					def filePath = "build/app-android/tutanota-${VERSION}-release.apk"
					def tag = "tutanota-android-release-${VERSION}"

					publishToNexus(groupId: "app",
								   artifactId: "android",
								   version: "${VERSION}",
								   assetFilePath: "${WORKSPACE}/${filePath}")

					androidApkUpload(googleCredentialsId: 'android-app-publisher-credentials',
									 apkFilesPattern: "${filePath}",
									 trackName: 'production',
									 rolloutPercentage: '100%')

					sh "git tag ${tag}"
					sh "git push --tags"

					withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
						def checksum = sh(returnStdout: true, script: "sha256sum ${WORKSPACE}/${filePath}")
						def releaseNotes = sh(
							"""node buildSrc/createGithubReleasePage.js --name '${VERSION} (Android)' \
																	 --milestone '${VERSION}' \
																	 --tag '${tag}' \
																	 --uploadFile '${WORKSPACE}/${filePath}' \
																	 --platform android \
																	 --apkChecksum ${checksum}"""
						)
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
				unstash 'apk'

				publishToNexus(groupId: "app",
						artifactId: "android-test",
						version: "${VERSION}",
						assetFilePath: "${WORKSPACE}/build/app-android/tutanota-${VERSION}-releaseTest.apk")

				// This doesn't publish to the main app on play store,
				// instead it get's published to the hidden "tutanota-test" app
				// this happens because the AppId is set to de.tutao.tutanota.test by the android build
				// and play store knows which app to publish just based on the id
				androidApkUpload(googleCredentialsId: 'android-app-publisher-credentials',
						apkFilesPattern: "build/app-android/tutanota-${VERSION}-releaseTest.apk",
						trackName: 'internal',
						rolloutPercentage: '100%')
			}
		}
	}
}

def publishToNexus(Map params) {
	withCredentials([usernamePassword(credentialsId: 'nexus-publish', usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')]) {
		sh  "curl --silent --show-error --fail " +
			"-u '${NEXUS_USERNAME}':'${NEXUS_PASSWORD}' " +
			"-X POST 'http://[fd:aa::70]:8081/nexus/service/rest/v1/components?repository=releases' " +
			"-F maven2.groupId=${params.groupId} " +
			"-F maven2.artifactId=${params.artifactId} " +
			"-F maven2.version=${params.version} " +
			"-F maven2.generate-pom=true " +
			"-F maven2.asset1=@${params.assetFilePath} " +
			"-F maven2.asset1.extension=apk "
	}
}
