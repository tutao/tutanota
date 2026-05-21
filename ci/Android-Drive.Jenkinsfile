pipeline {
	environment {
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		APK_SIGN_STORE = '/opt/android-keystore/android.jks'
		PATH = "${env.NODE_PATH}:${env.PATH}:/home/jenkins/emsdk/upstream/bin/:/home/jenkins/emsdk/:/home/jenkins/emsdk/upstream/emscripten"
		ANDROID_SDK_ROOT = "/opt/android-sdk"
		ANDROID_HOME = "/opt/android-sdk"
		STAGING_APK_FILE_PATH = "artifacts/app-android/drive-tutao-releaseTest-${VERSION}.apk"
		STAGING_AAB_FILE_PATH = "artifacts/app-android/drive-tutao-releaseTest-${VERSION}.aab"
		PROD_APK_FILE_PATH = "artifacts/app-android/drive-tutao-release-${VERSION}.apk"
		PROD_AAB_FILE_PATH = "artifacts/app-android/drive-tutao-release-${VERSION}.aab"
	}

	agent {
		label 'linux'
	}

	tools {
		jdk 'jdk-21.0.2'
	}

	parameters {
		booleanParam(
				name: 'UPLOAD',
				defaultValue: false,
				description: "Upload staging/prod to Nexus"
		)
		booleanParam(
				name: 'STAGING',
				defaultValue: true
		)
		booleanParam(
				name: 'PROD',
				defaultValue: true
		)
		string(
				name: 'branch',
				defaultValue: "*/master",
				description: "the branch to build the release from."
		)
	}

	stages {
		stage("Checking params") {
			steps {
				script {
					if (!params.STAGING && !params.PROD) {
						currentBuild.result = 'ABORTED'
						error('No artifacts were selected.')
					}
				}
				echo "Params OKAY"
			}
		} // stage checking params
		stage('Check Github') {
			steps {
				script {
					def util = load "ci/jenkins-lib/util.groovy"
					util.checkGithub()
				}
			}
		}
		stage('Build') {
			stages {
				stage('Staging') {
					environment {
						APK_SIGN_ALIAS = "test.tutao.de"
					}
					steps {
						echo "Building STAGING ${VERSION}"
						initSubmodules()
						sh 'npm ci'
						withCredentials([
								string(credentialsId: 'apk-sign-store-pass', variable: "APK_SIGN_STORE_PASS"),
								string(credentialsId: 'apk-sign-key-pass', variable: "APK_SIGN_KEY_PASS")
						]) {
							sh 'node android.js -b releaseTest test -a drive'
						}
						stash includes: STAGING_AAB_FILE_PATH, name: 'aab-staging'
						stash includes: STAGING_APK_FILE_PATH, name: 'apk-staging'
					}
				} // stage testing
				stage('Production') {
					when {
						expression { return params.PROD }
					}
					environment {
						APK_SIGN_ALIAS = "tutao.de"
					}
					steps {
						echo "Building PROD ${VERSION}"
						initSubmodules()
						sh 'npm ci'
						withCredentials([
								string(credentialsId: 'apk-sign-store-pass', variable: "APK_SIGN_STORE_PASS"),
								string(credentialsId: 'apk-sign-key-pass', variable: "APK_SIGN_KEY_PASS")
						]) {
							sh 'node android.js -b release prod -a drive'
						}
						stash includes: PROD_AAB_FILE_PATH, name: 'aab-production'
						stash includes: PROD_APK_FILE_PATH, name: 'apk-production'
					}
				} // stage production
			}
		}

		stage('Upload to Nexus') {
			when { expression { return params.UPLOAD } }
			parallel {
				stage('Staging') {
					when { expression { return params.STAGING } }
					steps {
						unstash 'aab-staging'
						publishToNexus(
								groupId: "app",
								artifactId: "drive-android-test",
								version: VERSION,
								assetFilePath: STAGING_AAB_FILE_PATH,
								fileExtension: 'aab'
						)

						unstash 'apk-staging'
						publishToNexus(
								groupId: "app",
								artifactId: "drive-android-test-apk",
								version: VERSION,
								assetFilePath: STAGING_APK_FILE_PATH,
								fileExtension: 'apk'
						)
					}
				} // stage staging
				stage('Production') {
					when { expression { return params.PROD } }
					steps {
						unstash 'aab-production'
						publishToNexus(
								groupId: "app",
								artifactId: "drive-android",
								version: VERSION,
								assetFilePath: PROD_AAB_FILE_PATH,
								fileExtension: 'aab'
						)

						unstash 'apk-production'
						publishToNexus(
								groupId: "app",
								artifactId: "drive-android-apk",
								version: VERSION,
								assetFilePath: PROD_APK_FILE_PATH,
								fileExtension: 'apk'
						)
					}
				} // stage production
			} // stages
		} // stage upload to nexus
	} // stages
}

// define helper to call from declarative pipeline without a `script` block
def publishToNexus(Map params) {
	script {
		def util = load "ci/jenkins-lib/util.groovy"
		util.publishToNexus(params)
	}
}

def initSubmodules() {
	sh 'git submodule init && git submodule sync --recursive && git submodule update'
}