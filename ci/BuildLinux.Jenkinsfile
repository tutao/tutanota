pipeline {
    environment {
        VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node buildSrc/getTutanotaAppVersion.js")
    }
    options {
        preserveStashes()
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

    agent {
        label 'master'
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

		stage('Staging') {
			environment {
				PATH = "${env.NODE_PATH}:${env.PATH}"
			}
			when {
				expression { params.STAGING }
			}
			stages {
				stage('Build') {
					agent {
						label 'linux'
					}

					steps {
						initBuildArea()

						sh 'node desktop --platform linux test'

						dir('artifacts') {
							stash includes: 'desktop-test/*', name: 'installer_staging'
						}
					} // steps
				} // stage Build

				stage('Sign') {
					agent {
						label 'linux'
					}
					when {
						expression { params.PUSH_ARTIFACTS }
					}
					steps {
						initBuildArea()

						dir('build') {
							unstash 'installer_staging'
						}

						withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
							sh '''export HSM_USER_PIN=${PW}; node buildSrc/signDesktopClients.js'''
						}
						dir('build') {
							stash includes: 'desktop-test/latest-linux.yml', name: 'signature_staging'
						}
					} // steps
				} // stage Sign

				stage('Push to Nexus') {
					when {
						expression { params.PUSH_ARTIFACTS }
					}
					agent {
						label 'linux'
					}
					steps {
						dir('build') {
							unstash 'installer_staging'
							unstash 'signature_staging'
						}
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							util.publishToNexusMultiple(
								groupId: "app",
								artifactId: "desktop-linux-test",
								version: "${VERSION}",
								assets: [
									[
										path: "${WORKSPACE}/build/desktop-test/tutanota-desktop-test-linux.AppImage",
										fileExtension: 'AppImage'
									],
									[
										path: "${WORKSPACE}/build/desktop-test/latest-linux.yml",
										fileExtension: 'yml'
									],
								]
							)
						}
					} // steps
				} // stage Push to Nexus

			} // stages
		} // stage Staging

		stage('Production') {
			environment {
				PATH = "${env.NODE_PATH}:${env.PATH}"
			}
			when {
				expression { params.PROD }
			}
			stages {
				stage('Build') {
					agent {
						label 'linux'
					}

					steps {
						initBuildArea()

						sh 'node desktop --platform linux prod'

						dir('artifacts') {
							stash includes: 'desktop/*', name: 'installer_prod'
						}
					} // steps
				} // stage Build

				stage('Sign') {
					agent {
						label 'linux'
					}
					when {
						expression { params.PUSH_ARTIFACTS }
					}
					steps {
						initBuildArea()

						dir('build') {
							unstash 'installer_prod'
						}

						withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
							sh '''export HSM_USER_PIN=${PW}; node buildSrc/signDesktopClients.js'''
						}
						dir('build') {
							stash includes: 'desktop/latest-linux.yml', name: 'signature_prod'
						}
					} // steps
				} // stage Sign

				stage('Push to Nexus') {
					when {
						expression { params.PUSH_ARTIFACTS }
					}
					agent {
						label 'linux'
					}
					steps {
						dir('build') {
							unstash 'installer_prod'
							unstash 'signature_prod'
						}
						script {
							def util = load "ci/jenkins-lib/util.groovy"
							util.publishToNexusMultiple(
								groupId: "app",
								artifactId: "desktop-linux",
								version: "${VERSION}",
								assets: [
									[
										path: "${WORKSPACE}/build/desktop/tutanota-desktop-linux.AppImage",
										fileExtension: 'AppImage'
									],
									[
										path: "${WORKSPACE}/build/desktop/latest-linux.yml",
										fileExtension: 'yml'
									],
								]
							)
						}
					} // steps
				} // stage Push to Nexus
			} // stages
		} // stage Prod
    } // stages
} // pipeline

void initBuildArea() {
    sh 'npm ci'
    sh 'npm run build-packages'
    sh 'rm -rf ./build/*'
    sh 'rm -rf ./native-cache/*'
}
