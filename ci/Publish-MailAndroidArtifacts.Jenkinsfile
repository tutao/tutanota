pipeline {
    parameters {
		string(
			name: 'appVersion',
			defaultValue: "",
			description: 'Which version should be published'
		)
		booleanParam(
			name: 'STAGING',
			defaultValue: true,
            description: "Uploads staging artifact (apk) to Google PlayStore"
		)
		booleanParam(
			name: 'PROD',
			defaultValue: false,
            description: "Uploads production artifact (apk) to Google PlayStore as a Draft on the public track"
		)
		booleanParam(
	        name: 'GITHUB_RELEASE',
	        defaultValue: false,
	        description: "Uploads android artifact (apk) to GitHub and publish release notes"
		)
		persistentText(
			name: 'releaseNotes',
			defaultValue: "",
			description: 'Android release notes'
		)
    }

	environment {
		PATH = "${env.NODE_PATH}:${env.PATH}"
		PACKAGE_VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		VERSION = "${params.appVersion.trim() ?: PACKAGE_VERSION}"
		GITHUB_RELEASE_PAGE = "https://github.com/tutao/tutanota/releases/tag/tutanota-android-release-${VERSION}"
		PROD_FILE_PATH = "build/app-android/tutanota-app-tutao-release-${VERSION}.apk"
	}

    agent {
		label 'linux'
	}

    stages {
    	stage("Checking params") {
			steps {
				script{
					if(!params.STAGING && !params.PROD && !params.GITHUB_RELEASE) {
						currentBuild.result = 'ABORTED'
						error('No tasks were selected.')
					}
				}
				echo "Params OKAY"
			}
    	}
		stage("Google Play Store") {
			stages {
				stage("Staging") {
					when { expression { return params.STAGING } }
					steps {
						script {
							def filePath = "build/app-android/tutanota-app-tutao-releaseTest-${VERSION}.apk"

							downloadAndroidApp("android-test", filePath)

							// This doesn't publish to the main app on play store,
							// instead it gets published to the hidden "tutanota-test" app
							// this happens because the AppId is set to de.tutao.tutanota.test by the android build
							// and play store knows which app to publish just based on the id
							androidApkUpload(
									googleCredentialsId: 'android-app-publisher-credentials',
									apkFilesPattern: filePath,
									trackName: 'internal',
									rolloutPercentage: '100%',
									recentChangeList: [
											[
													language: "en-US",
													text    : "see: ${GITHUB_RELEASE_PAGE}"
											]
									]
							) // androidApkUpload
						} // script
					} // steps
				} // stage Testing
				stage("Production") {
					when { expression { return params.PROD } }
					steps {
						script {
							downloadAndroidApp("android", PROD_FILE_PATH)

							androidApkUpload(
									googleCredentialsId: 'android-app-publisher-credentials',
									apkFilesPattern: "${PROD_FILE_PATH}",
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
						} // script
					} // steps
				} // stage Production
			} // stages
		} // stage Google Play Store
		stage("Github release notes") {
			when { expression { return params.PROD && params.GITHUB_RELEASE } }
			steps {
				script {
					downloadAndroidApp("android", PROD_FILE_PATH)

					sh 'npm ci'

					writeFile file: "notes.txt", text: params.releaseNotes
					withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
						sh """node buildSrc/createReleaseDraft.js --name '${VERSION} (Android)' \
															   --tag 'tutanota-android-release-${VERSION}' \
															   --uploadFile '${WORKSPACE}/${PROD_FILE_PATH}' \
															   --notes notes.txt"""
					} // withCredentials
					sh "rm notes.txt"
				} // script
			} // steps
		} // stage github release notes
    } // stages
} // pipeline

def downloadAndroidApp(String artifactId, String filePath) {
    def util = load "ci/jenkins-lib/util.groovy"

    util.downloadFromNexus(
    	groupId: "app",
		artifactId: artifactId,
		version: "${VERSION}",
		outFile: "${WORKSPACE}/${filePath}",
		fileExtension: 'apk'
	)

    if (!fileExists("${filePath}")) {
        currentBuild.result = 'ABORTED'
        error("Unable to find file ${filePath}")
    }
    echo "File ${filePath} found!"
}