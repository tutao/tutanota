pipeline {
    environment {
        VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node buildSrc/getTutanotaAppVersion.js")
		// on m1 macs, this is a symlink that must be updated. see wiki.
		NODE_MAC_PATH = '/usr/local/opt/node@20/bin/'
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
			when {
				expression { params.STAGING }
			}
			stages {
				stage('Build') {
					environment {
						PATH = "${env.NODE_MAC_PATH}:${env.PATH}"
					}
					agent {
						label 'mac-m1'
					}

					steps {
						initBuildArea()

						withCredentials([
									usernamePassword(credentialsId: 'APP_NOTARIZE_CREDS', usernameVariable: 'APPLEIDVAR', passwordVariable: 'APPLEIDPASSVAR'),
									string(credentialsId: 'fastlane-keychain-password', variable: 'FASTLANE_KEYCHAIN_PASSWORD'),
									string(credentialsId: 'team-id', variable: 'APPLETEAMIDVAR'),
						]) {
							sh 'security unlock-keychain -p $FASTLANE_KEYCHAIN_PASSWORD'
							script {
								sh '''
								export APPLEID=${APPLEIDVAR};
								export APPLEIDPASS=${APPLEIDPASSVAR};
								export APPLETEAMID=${APPLETEAMIDVAR};
								node desktop --architecture universal --platform mac test'''
							}
						}

						dir('artifacts') {
							stash includes: 'desktop-test/*', name: 'installer_staging'
						}
					} // steps
				} // stage Build

				stage('Sign') {
					agent {
						label 'linux'
					}
					environment {
						PATH = "${env.NODE_PATH}:${env.PATH}"
					}
					when {
						expression { params.PUSH_ARTIFACTS }
					}
					steps {
						dir('build') {
							unstash 'installer_staging'
						}

						withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
							sh '''export HSM_USER_PIN=${PW}; node buildSrc/signDesktopClients.js'''
						}
						dir('build') {
							stash includes: 'desktop-test/latest-mac.yml', name: 'signature_staging'
						}
					} // steps
				} // stage Sign

				stage('Push to Nexus') {
					when {
						expression { params.PUSH_ARTIFACTS }
					}
					environment {
						PATH = "${env.NODE_PATH}:${env.PATH}"
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
								artifactId: "desktop-mac-test",
								version: "${VERSION}",
								assets: [
									[
										path: "${WORKSPACE}/build/desktop-test/tutanota-desktop-test-mac.zip",
										fileExtension: 'zip'
									],
									[
										path: "${WORKSPACE}/build/desktop-test/tutanota-desktop-test-mac.dmg",
										fileExtension: 'dmg'
									],
									[
										path: "${WORKSPACE}/build/desktop-test/latest-mac.yml",
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
			when {
				expression { params.PROD }
			}
			stages {
				stage('Build') {
					agent {
						label 'mac-m1'
					}
					environment {
							PATH = "${env.NODE_MAC_PATH}:${env.PATH}"
					}
					steps {
						initBuildArea()

							withCredentials([
										usernamePassword(credentialsId: 'APP_NOTARIZE_CREDS', usernameVariable: 'APPLEIDVAR', passwordVariable: 'APPLEIDPASSVAR'),
										string(credentialsId: 'fastlane-keychain-password', variable: 'FASTLANE_KEYCHAIN_PASSWORD'),
										string(credentialsId: 'team-id', variable: 'APPLETEAMIDVAR'),
							]) {
								sh 'security unlock-keychain -p $FASTLANE_KEYCHAIN_PASSWORD'
								script {
									sh '''
									export APPLEID=${APPLEIDVAR};
									export APPLEIDPASS=${APPLEIDPASSVAR};
									export APPLETEAMID=${APPLETEAMIDVAR};
									node desktop --architecture universal --platform mac prod'''
								}
							}

						dir('artifacts') {
							stash includes: 'desktop/*', name: 'installer_prod'
						}
					} // steps
				} // stage Build

				stage('Sign') {
					agent {
						label 'linux'
					}
					environment {
						PATH = "${env.NODE_PATH}:${env.PATH}"
					}
					when {
						expression { params.PUSH_ARTIFACTS }
					}
					steps {
						dir('build') {
							unstash 'installer_prod'
						}

						withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
							sh '''export HSM_USER_PIN=${PW}; node buildSrc/signDesktopClients.js'''
						}
						dir('build') {
							stash includes: 'desktop/latest-mac.yml', name: 'signature_prod'
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
					environment {
						PATH = "${env.NODE_PATH}:${env.PATH}"
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
								artifactId: "desktop-mac",
								version: "${VERSION}",
								assets: [
									[
										path: "${WORKSPACE}/build/desktop/tutanota-desktop-mac.zip",
										fileExtension: 'zip'
									],
									[
										path: "${WORKSPACE}/build/desktop/tutanota-desktop-mac.dmg",
										fileExtension: 'dmg'
									],
									[
										path: "${WORKSPACE}/build/desktop/latest-mac.yml",
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
