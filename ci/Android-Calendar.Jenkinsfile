pipeline {
	environment {
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		APK_SIGN_STORE = '/opt/android-keystore/android.jks'
		PATH = "${env.NODE_PATH}:${env.PATH}:/home/jenkins/emsdk/upstream/bin/:/home/jenkins/emsdk/:/home/jenkins/emsdk/upstream/emscripten"
		ANDROID_SDK_ROOT = "/opt/android-sdk"
		ANDROID_HOME = "/opt/android-sdk"
		// FIXME
		STAGING_APK_FILE_PATH = "build-calendar-app/app-android/calendar-tutao-releaseTest-${VERSION}.apk"
		STAGING_AAB_FILE_PATH = "build-calendar-app/app-android/calendar-tutao-releaseTest-${VERSION}.aab"
		PROD_APK_FILE_PATH = "build/app-android/tutanota-app-tutao-release-${VERSION}.apk"
		PROD_AAB_FILE_PATH = ""
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
		stage('Run Tests') {
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
					steps {
						echo "Building STAGING ${VERSION}"
						sh 'npm ci'
						withCredentials([
								string(credentialsId: 'apk-sign-store-pass', variable: "APK_SIGN_STORE_PASS"),
								string(credentialsId: 'apk-sign-key-pass', variable: "APK_SIGN_KEY_PASS")
						]) {
							sh 'node android.js -b releaseTest test -a calendar'
						}
						stash includes: "build-calendar-app/app-android/calendar-tutao-releaseTest-${VERSION}.aab", name: 'aab-testing'
						stash includes: "build-calendar-app/app-android/calendar-tutao-releaseTest-${VERSION}.apk", name: 'apk-testing'
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
						sh 'npm ci'
						withCredentials([
								string(credentialsId: 'apk-sign-store-pass', variable: "APK_SIGN_STORE_PASS"),
								string(credentialsId: 'apk-sign-key-pass', variable: "APK_SIGN_KEY_PASS")
						]) {
							sh 'node android.js -b release prod -a calendar'
						}
						stash includes: "build-calendar-app/app-android/calendar-tutao-release-${VERSION}.aab", name: 'aab-production'
						stash includes: "build-calendar-app/app-android/calendar-tutao-release-${VERSION}.apk", name: 'apk-production'
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
							unstash 'aab-testing'

							util.publishToNexus(
									groupId: "app",
									artifactId: "calendar-android-test",
									version: "${VERSION}",
									assetFilePath: "${WORKSPACE}/build-calendar-app/app-android/calendar-tutao-releaseTest-${VERSION}.aab",
									fileExtension: 'aab'
							)
							unstash 'apk-testing'

							util.publishToNexus(
									groupId: "app",
									artifactId: "calendar-android-test-apk",
									version: "${VERSION}",
									assetFilePath: "${WORKSPACE}/build-calendar-app/app-android/calendar-tutao-releaseTest-${VERSION}.apk",
									fileExtension: 'apk'
							)
						}
					}
				} // stage testing
				stage('Production') {
					steps {
						sh 'npm ci'
						unstash 'aab-production'
						unstash 'apk-production'

						script {
							def filePath = "build-calendar-app/app-android/calendar-tutao-release-${VERSION}"
							def util = load "ci/jenkins-lib/util.groovy"

							util.publishToNexus(
									groupId: "app",
									artifactId: "calendar-android",
									version: "${VERSION}",
									assetFilePath: "${WORKSPACE}/${filePath}.aab",
									fileExtension: 'aab'
							)

							util.publishToNexus(
									groupId: "app",
									artifactId: "calendar-android-apk",
									version: "${VERSION}",
									assetFilePath: "${WORKSPACE}/${filePath}.apk",
									fileExtension: 'apk'
							)
						}
					}
				} // stage production
			}
		}
	}
}
