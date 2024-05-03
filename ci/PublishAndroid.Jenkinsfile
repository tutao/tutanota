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
		} // stage Staging

		stage('Production') {
			when {
				expression { params.TARGET == 'prod' }
			}
			agent {
				label 'linux'
			}

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
		} // stage Staging
	}
}
