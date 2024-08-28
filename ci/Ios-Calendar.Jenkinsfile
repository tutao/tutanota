pipeline {
	environment {
		NODE_MAC_PATH = "/usr/local/opt/node@20/bin/"
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
	}

	agent {
		label 'linux'
	}

	parameters {
		booleanParam(
			name: 'RELEASE',
			defaultValue: false,
			description: "Build testing and production version, and upload them to nexus/testflight. " +
				"The production version will need to be sent to appstore using the publish job"
		)
		booleanParam(
			name: 'PROD',
			defaultValue: true
		)
		booleanParam(
			name: 'STAGING',
			defaultValue: true
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
		stage("Run tests") {
			agent {
				label 'mac-intel'
			}
			environment {
				LC_ALL = "en_US.UTF-8"
				LANG = "en_US.UTF-8"
			}
			steps {
				script {
					stubClientDirectory()
					generateXCodeProjects()
					dir('app-ios') {
						sh 'fastlane test'
					}
				}
			}
		}

		stage("Build and upload to Testflight") {
			environment {
				PATH="${env.NODE_MAC_PATH}:${env.PATH}:${env.HOME}/emsdk:${env.HOME}/emsdk/upstream/emscripten:${env.HOME}/emsdk/upstream/bin"
				MATCH_GIT_URL = "git@gitlab:/tuta/apple-certificates.git"
				LC_ALL = "en_US.UTF-8"
				LANG = "en_US.UTF-8"
			}
			agent {
				label 'mac-intel'
			}
			stages {
				stage('Staging') {
					when {
						expression { params.STAGING }
					}
					steps {
						script {
							buildWebapp("test", "calendar")
							generateXCodeProjects()
							runFastlane("de.tutao.calendar.test", "calendar_adhoc_staging")
							if (params.RELEASE) {
								runFastlane("de.tutao.calendar.test", "calendar_testflight_staging")
							}
							stash includes: "app-ios/releases/calendar-${VERSION}-adhoc-test.ipa", name: 'ipa-testing'
						}
					}
				}
				stage('Production') {
					when {
						expression { params.PROD }
					}
					steps {
						script {
							buildWebapp("prod", "calendar")
							generateXCodeProjects()
							runFastlane("de.tutao.calendar", "calendar_adhoc_prod")

							if (params.RELEASE) {
								util.runFastlane("de.tutao.calendar", "calendar_appstore_prod submit:false")
							}

							stash includes: "app-ios/releases/calendar-${VERSION}-adhoc.ipa", name: 'ipa-production'
							stash includes: "app-ios/releases/calendar-${VERSION}-appstore.ipa", name: 'ipa-production'
						}
					}
				}
			}
		}

		stage('Upload to Nexus') {
			environment {
				PATH = "${env.NODE_PATH}:${env.PATH}"
			}
			when {
				expression { params.RELEASE }
			}
			agent {
				label 'linux'
			}
			steps {
				script {
					if (params.STAGING) {
						unstash 'ipa-testing'
						catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'There was an error when uploading to Nexus') {
							publishToNexus("calendar-ios-test", "calendar-${VERSION}-adhoc-test.ipa")
						}
					}

					if (params.PROD) {
						unstash 'ipa-production'
						catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'There was an error when uploading to Nexus') {
							publishToNexus("calendar-ios", "calendar-${VERSION}-adhoc.ipa")
						}
					}
				}
			}
		}
	}
}

void stubClientDirectory() {
	script {
		sh "pwd"
		sh "echo $PATH"
    	sh "mkdir build"
    	sh "mkdir build-calendar-app"
	}
}

void buildWebapp(String stage, String app) {
	script {
		sh "pwd"
		sh "echo $PATH"
    	sh "npm ci"
    	sh 'npm run build-packages'
    	sh "node --max-old-space-size=8192 webapp ${stage} --app ${app}"
    	sh "node buildSrc/prepareMobileBuild.js dist ${app}"
	}
}

// Runs xcodegen on `projectPath`, a directory containing a `project.yml`
void generateXCodeProject(String projectPath, String spec) {
	// xcodegen ignores its --project and --project-roots flags
	// so we need to change the directory manually
	script {
		sh "(cd ${projectPath}; xcodegen generate --spec ${spec}.yml)"
	}
}

// Runs xcodegen on all of our project specs
void generateXCodeProjects() {
    generateXCodeProject("app-ios", "mail-project")
	generateXCodeProject("app-ios", "calendar-project")
	generateXCodeProject("tuta-sdk/ios", "project")
}

void runFastlane(String app_identifier, String  lane) {
	// Prepare the fastlane Appfile which defines the required ids for the ios app build.
	script {
		def appfile = './app-ios/fastlane/Appfile'

		sh "echo \"app_identifier('${app_identifier}')\" > ${appfile}"

		withCredentials([string(credentialsId: 'apple-id', variable: 'apple_id')]) {
			sh "echo \"apple_id('${apple_id}')\" >> ${appfile}"
		}
		withCredentials([string(credentialsId: 'itc-team-id', variable: 'itc_team_id')]) {
			sh "echo \"itc_team_id('${itc_team_id}')\" >> ${appfile}"
		}
		withCredentials([string(credentialsId: 'team-id', variable: 'team_id')]) {
			sh "echo \"team_id('${team_id}')\" >> ${appfile}"
		}
	}

	withCredentials([
			file(credentialsId: 'appstore-api-key-json', variable: "API_KEY_JSON_FILE_PATH"),
			string(credentialsId: 'match-password', variable: 'MATCH_PASSWORD'),
			string(credentialsId: 'team-id', variable: 'FASTLANE_TEAM_ID'),
			sshUserPrivateKey(credentialsId: 'jenkins', keyFileVariable: 'MATCH_GIT_PRIVATE_KEY'),
			string(credentialsId: 'fastlane-keychain-password', variable: 'FASTLANE_KEYCHAIN_PASSWORD')
	]) {
		dir('app-ios') {
			sh "security unlock-keychain -p ${FASTLANE_KEYCHAIN_PASSWORD}"

			script {
				// Set git ssh command to avoid ssh prompting to confirm an unknown host
				// (since we don't have console access we can't confirm and it gets stuck)
				sh "GIT_SSH_COMMAND=\"ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no\" fastlane ${lane}"
			}
		}
	}
}

void publishToNexus(String artifactId, String ipaFileName) {
	def util = load "ci/jenkins-lib/util.groovy"
	util.publishToNexus(groupId: "app",
			artifactId: "${artifactId}",
			version: "${VERSION}",
			assetFilePath: "${WORKSPACE}/app-ios/releases/${ipaFileName}",
			fileExtension: "ipa"
	)
}