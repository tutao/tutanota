pipeline {
	environment {
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
	}

	agent {
		label 'linux'
	}

	parameters {
		booleanParam(
				name: 'UPLOAD',
			defaultValue: false,
				description: "Upload staging/prod to Nexus"
		)
		booleanParam(
			name: 'PROD',
			defaultValue: true
		)
		booleanParam(
			name: 'STAGING',
			defaultValue: true
		)
        string(
            name: 'branch',
            defaultValue: "*/master",
            description: "the branch to build the release from"
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
		stage("Build") {
			environment {
				PATH="${env.NODE_MAC_PATH}:${env.PATH}:${env.HOME}/emsdk:${env.HOME}/emsdk/upstream/emscripten:${env.HOME}/emsdk/upstream/bin"
				MATCH_GIT_URL = "git@gitlab:/tuta/apple-certificates.git"
				LC_ALL = "en_US.UTF-8"
				LANG = "en_US.UTF-8"
			}
			agent {
				label 'mac'
			}
			stages {
				stage('Staging') {
					when {
						expression { params.STAGING }
					}
					environment {
						EM_CACHE = "${env.HOME}/emcache"
					}
					steps {
						lock('ios-build-m1') {
							script {
								def util = load "ci/jenkins-lib/util.groovy"

								buildWebapp("test")
								generateXCodeProjects()

								util.runFastlane("de.tutao.calendar.test", "build_calendar_adhoc_staging")
								if (params.UPLOAD) {
									util.runFastlane("de.tutao.calendar.test", "build_calendar_appstore_staging")
								}
								stash includes: "app-ios/releases/calendar-${VERSION}-adhoc-test.ipa", name: 'ipa-testing'
							}
						}
					}
				}
				stage('Production') {
					when {
						expression { params.PROD }
					}
					steps {
						lock('ios-build-m1') {
							script {
								def util = load "ci/jenkins-lib/util.groovy"

								buildWebapp("prod")
								generateXCodeProjects()
								util.runFastlane("de.tutao.calendar", "build_calendar_adhoc_prod")

								if (params.UPLOAD) {
									util.runFastlane("de.tutao.calendar", "build_calendar_appstore_prod")
									stash includes: "app-ios/releases/calendar-${VERSION}.ipa", name: 'ipa-production'
									stash includes: "app-ios/releases/calendar-${VERSION}.app.dSYM.zip", name: 'dsym-production'
								} else {
									stash includes: "app-ios/releases/calendar-${VERSION}-adhoc.ipa", name: 'ipa-production'
								}
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
				expression { params.UPLOAD }
			}
			agent {
				label 'linux'
			}
			steps {
				script {
					if (params.STAGING) {
						unstash 'ipa-testing'
						catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'There was an error when uploading to Nexus') {
							publishToNexus("calendar-ios-test", "calendar-${VERSION}-adhoc-test.ipa", "ipa")
						}
					}

					if (params.PROD) {
						unstash 'ipa-production'
						unstash 'dsym-production'
						catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'There was an error when uploading to Nexus') {
							if (params.UPLOAD) {
								publishToNexus("calendar-ios", "calendar-${VERSION}.ipa", "ipa")
                                publishToNexus("calendar-ios", "calendar-${VERSION}.app.dSYM.zip", "app.dSYM.zip")
							} else {
								publishToNexus("calendar-ios", "calendar-${VERSION}-adhoc.ipa", "ipa")
							}
						}
					}
				}
			}
		}
	}
}

void ensureWebappDirectories() {
	script {
		sh "pwd"
		sh "echo $PATH"
    	sh "mkdir -p build"
    	sh "mkdir -p build-calendar-app"
	}
}

void buildWebapp(String stage) {
	script {
		sh "pwd"
		sh "echo $PATH"
    	sh "npm ci"
    	sh "node --max-old-space-size=8192 webapp ${stage} --app calendar"
    	sh "node buildSrc/prepareMobileBuild.js --app calendar"
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
    ensureWebappDirectories()
    generateXCodeProject("app-ios", "mail-project")
	generateXCodeProject("app-ios", "calendar-project")
	generateXCodeProject("tuta-sdk/ios", "project")
}

void publishToNexus(String artifactId, String ipaFileName, String extension) {
	def util = load "ci/jenkins-lib/util.groovy"
	util.publishToNexus(groupId: "app",
			artifactId: "${artifactId}",
			version: "${VERSION}",
			assetFilePath: "${WORKSPACE}/app-ios/releases/${ipaFileName}",
			fileExtension: extension
	)
}