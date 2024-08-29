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
			description: "Upload staging/prod to Nexus and send staging version to testflight. " +
				"The production version must be sent to appstore using the publish job"
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
							def util = load "ci/jenkins-lib/util.groovy"

							buildWebapp("test")
							generateXCodeProjects()

							util.runFastlane("de.tutao.calendar.test", "calendar_adhoc_staging")
							if (params.RELEASE) {
								util.runFastlane("de.tutao.calendar.test", "calendar_testflight_staging")
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
							def util = load "ci/jenkins-lib/util.groovy"

							buildWebapp("prod")
							generateXCodeProjects()
							util.runFastlane("de.tutao.calendar", "calendar_adhoc_prod")

							if (params.RELEASE) {
								util.runFastlane("de.tutao.calendar", "build_calendar_prod")
								stash includes: "app-ios/releases/calendar-${VERSION}.ipa", name: 'ipa-production'
							} else {
								stash includes: "app-ios/releases/calendar-${VERSION}-adhoc.ipa", name: 'ipa-production'
							}
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
							if (params.RELEASE) {
								publishToNexus("calendar-ios", "calendar-${VERSION}.ipa")
							} else {
								publishToNexus("calendar-ios", "calendar-${VERSION}-adhoc.ipa")
							}
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

void buildWebapp(String stage) {
	script {
		sh "pwd"
		sh "echo $PATH"
    	sh "npm ci"
    	sh 'npm run build-packages'
    	sh "node --max-old-space-size=8192 webapp ${stage} --app calendar"
    	sh "node buildSrc/prepareMobileBuild.js dist calendar"
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

void publishToNexus(String artifactId, String ipaFileName) {
	def util = load "ci/jenkins-lib/util.groovy"
	util.publishToNexus(groupId: "app",
			artifactId: "${artifactId}",
			version: "${VERSION}",
			assetFilePath: "${WORKSPACE}/app-ios/releases/${ipaFileName}",
			fileExtension: "ipa"
	)
}