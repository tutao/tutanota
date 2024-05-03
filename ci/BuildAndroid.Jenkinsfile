pipeline {
	environment {
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node buildSrc/getTutanotaAppVersion.js")
		APK_SIGN_STORE = '/opt/android-keystore/android.jks'
		PATH = "${env.NODE_PATH}:${env.PATH}"
		ANDROID_SDK_ROOT = "/opt/android-sdk-linux"
		ANDROID_HOME = "/opt/android-sdk-linux"
	}

	agent {
		label 'linux'
	}

	tools {
		jdk 'jdk-21.0.2'
	}

	parameters {
        booleanParam(
            name: 'STAGING',
            defaultValue: true,
            description: "Build a version for test system"
        )
		booleanParam(
			name: 'PROD',
			defaultValue: true,
			description: "Build a version for production system"
		)
		booleanParam(
			name: 'PUSH_ARTIFACTS',
			defaultValue: false,
			description: "Push result artifacts to Nexus"
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

		stage('Staging') {
			when {
				expression { params.STAGING }
			}
			agent {
				label 'linux'
			}

			stages {
				stage('Build') {
					environment {
						APK_SIGN_ALIAS = "test.tutao.de"
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
						stash includes: "build/app-android/tutanota-tutao-releaseTest-${VERSION}.apk", name: 'apk-testing'
					}
				} // stage Build

				stage('Push to Nexus') {
					when {
						expression { params.PUSH_ARTIFACTS }
					}
					steps {
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							unstash 'apk-testing'

							util.publishToNexus(
									groupId: "app",
									artifactId: "android-test",
									version: "${VERSION}",
									assetFilePath: "${WORKSPACE}/build/app-android/tutanota-tutao-releaseTest-${VERSION}.apk",
									fileExtension: 'apk'
							)
						}
					}
				} // stage Push to Nexus
			} // stages

		} // stage Staging

		stage('Prod') {
			when {
				expression { params.PROD }
			}
			agent {
				label 'linux'
			}

			stages {
				stage('Build') {
					environment {
						APK_SIGN_ALIAS = "tutao.de"
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
							sh 'node android.js -b release prod'
						}

						stash includes: "build/app-android/tutanota-tutao-release-${VERSION}.apk", name: 'apk-production'
					}
				} // stage Build

				stage('Push to Nexus') {
					when {
						expression { params.PUSH_ARTIFACTS }
					}
					steps {
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							unstash 'apk-production'

							util.publishToNexus(
									groupId: "app",
									artifactId: "android",
									version: "${VERSION}",
									assetFilePath: "${WORKSPACE}/${filePath}",
									fileExtension: 'apk'
							)
						}
					}
				} // stage Push to Nexus
			} // stages
		} // stage Prod


		stage('Build') {
			stages {

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
				} // stage production
			}
		}
	}
}
