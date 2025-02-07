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
		stage("Build") {
			environment {
				MATCH_GIT_URL = "git@gitlab:/tuta/apple-certificates.git"
				LC_ALL = "en_US.UTF-8"
				LANG = "en_US.UTF-8"
			}
			stages {
				stage('Staging') {
					when { expression { return params.STAGING } }
					environment {
						PATH="${env.NODE_MAC_PATH}:${env.PATH}:${env.HOME}/emsdk:${env.HOME}/emsdk/upstream/emscripten:${env.HOME}/emsdk/upstream/bin"
						EM_CACHE="${env.HOME}/emcache"
					}
					agent {
						label 'mac-intel'
					}
					steps {
						lock("ios-build-intel") {
							script {
								def util = load "ci/jenkins-lib/util.groovy"
								buildWebapp("test")
								generateXCodeProjects()
								util.runFastlane("de.tutao.tutanota.test", "adhoc_staging")
								if (params.UPLOAD) {
									util.runFastlane("de.tutao.tutanota.test", "build_mail_staging")
									stash includes: "app-ios/releases/tutanota-${VERSION}-test.ipa", name: 'ipa-staging'
								}
								stash includes: "app-ios/releases/tutanota-${VERSION}-adhoc-test.ipa", name: 'ipa-adhoc-staging'
							}
						}
					}
				} // stage staging
				stage('Production') {
					when { expression { return params.PROD } }
					environment {
						PATH="${env.NODE_MAC_PATH}:${env.PATH}:${env.HOME}/emsdk:${env.HOME}/emsdk/upstream/emscripten:${env.HOME}/emsdk/upstream/bin"
						EM_CACHE="${env.HOME}/emcache"
					}
					agent {
						label 'mac-intel'
					}
					steps {
						lock("ios-build-intel") {
							script {
								def util = load "ci/jenkins-lib/util.groovy"
								buildWebapp("prod")
								generateXCodeProjects()
								util.runFastlane("de.tutao.tutanota", "adhoc_prod")
								if (params.UPLOAD) {
									util.runFastlane("de.tutao.tutanota", "build_mail_prod")
									stash includes: "app-ios/releases/tutanota-${VERSION}.ipa", name: 'ipa-production'
								}
								stash includes: "app-ios/releases/tutanota-${VERSION}-adhoc.ipa", name: 'ipa-adhoc-production'
							}
						}
					} // steps
				} // stage production
			} // stages
		} // stage build

		stage('Upload to Nexus') {
			when { expression { return params.UPLOAD } }
			environment {
				PATH = "${env.NODE_PATH}:${env.PATH}"
			}
			parallel {
				stage("Staging") {
					when { expression { return params.STAGING } }
					agent {
						label 'linux'
					}
					steps {
						unstash 'ipa-adhoc-staging'
						unstash 'ipa-staging'

                        uploadToNexus("ios-test", "tutanota-${VERSION}-adhoc-test.ipa", "adhoc.ipa")
                        uploadToNexus("ios-test", "tutanota-${VERSION}-test.ipa", "ipa")
					}
				}
				stage("Production") {
					when { expression { return params.PROD } }
					agent {
						label 'linux'
					}
					steps {
						unstash 'ipa-adhoc-production'
						unstash 'ipa-production'

                        uploadToNexus("ios", "tutanota-${VERSION}-adhoc.ipa", "adhoc.ipa")
                        uploadToNexus("ios", "tutanota-${VERSION}.ipa", "ipa")
					}
				}
			} // parallel
		} // stage upload to nexus
	} // stages
} // pipeline

def ensureWebappDirectories() {
	script {
		sh "pwd"
		sh "echo $PATH"
        sh "mkdir -p build-calendar-app"
    	sh "mkdir -p build"
	}
}

def buildWebapp(String stage) {
	script {
		sh "pwd"
		sh "echo $PATH"
    	sh "npm ci"
    	sh "node buildSrc/checkOfflineDbMigratons.js"
    	sh 'npm run build-packages'
    	sh "node --max-old-space-size=8192 webapp ${stage}"
    	sh "node buildSrc/prepareMobileBuild.js dist"
	}
}

// Runs xcodegen on `projectPath`, a directory containing a `project.yml`
def generateXCodeProject(String projectPath, String spec) {
	// xcodegen ignores its --project and --project-roots flags
	// so we need to change the directory manually
	script {
		sh "(cd ${projectPath}; xcodegen generate --spec ${spec}.yml)"
	}
}

// Runs xcodegen on all of our project specs
def generateXCodeProjects() {
	ensureWebappDirectories()
	generateXCodeProject("app-ios", "mail-project")
	// We don't technically need the calendar project but some Xcode tools are slightly upset if they don't find all
	// projects referenced from a workspace.
	sh 'mkdir -p build-calendar-app'
	generateXCodeProject("app-ios", "calendar-project")
	generateXCodeProject("tuta-sdk/ios", "project")
}

def uploadToNexus(String artifactId, String assetFileName, String fileExtension) {
	def util = load "ci/jenkins-lib/util.groovy"
	util.publishToNexus(
			groupId: "app",
			artifactId: "${artifactId}",
			version: "${VERSION}",
			assetFilePath: "${WORKSPACE}/app-ios/releases/${assetFileName}",
			fileExtension: "${fileExtension}"
	)
}