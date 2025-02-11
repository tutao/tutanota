pipeline {
	environment {
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		APK_SIGN_STORE = '/opt/android-keystore/android.jks'
		PATH = "${env.NODE_PATH}:${env.PATH}:/home/jenkins/emsdk/upstream/bin/:/home/jenkins/emsdk/:/home/jenkins/emsdk/upstream/emscripten"
		ANDROID_SDK_ROOT = "/opt/android-sdk-linux"
		ANDROID_HOME = "/opt/android-sdk-linux"
		STAGING_FILE_PATH = "build/app-android/tutanota-app-tutao-releaseTest-${VERSION}.apk"
		PROD_FILE_PATH = "build/app-android/tutanota-app-tutao-release-${VERSION}.apk"
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
                script{
                    if(!params.STAGING && !params.PROD) {
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
					when { expression { return params.STAGING } }
					environment {
						APK_SIGN_ALIAS = "test.tutao.de"
					}
					steps {
						echo "Building STAGING ${VERSION}"
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
						stash includes: "${STAGING_FILE_PATH}", name: 'apk-staging'
					} // steps
				} // stage staging
				stage('Production') {
					when { expression { return params.PROD } }
					environment {
						APK_SIGN_ALIAS = "tutao.de"
					}
					steps {
						echo "Building PROD ${VERSION}"
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
						stash includes: "${PROD_FILE_PATH}", name: 'apk-production'
					}
				} // stage production
			} // stages
		} // stage build

		stage('Upload to Nexus') {
			when { expression { return params.UPLOAD } }
			parallel {
				stage('Staging') {
					when { expression { return params.STAGING } }
					steps {
						unstash 'apk-staging'
						uploadToNexus("android-test", STAGING_FILE_PATH)
					}
				} // stage staging
				stage('Production') {
					when { expression { return params.PROD } }
					steps {
						unstash 'apk-production'
						uploadToNexus("android", PROD_FILE_PATH)
					}
				} // stage production
			} // stages
		} // stage upload to nexus
	} // stages
} // pipeline

def uploadToNexus(String artifactId, String filePath) {
	script {
		def util = load "ci/jenkins-lib/util.groovy"

		util.publishToNexus(
				groupId: "app",
				artifactId: "${artifactId}",
				version: "${VERSION}",
				assetFilePath: "${WORKSPACE}/${filePath}",
				fileExtension: 'apk'
		)
	}
}