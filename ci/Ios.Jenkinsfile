pipeline {
	environment {
		NODE_MAC_PATH = "/usr/local/opt/node@20/bin/"
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		RELEASE_NOTES_PATH = "app-ios/fastlane/metadata/default/release_notes.txt"
	}

	agent {
		label 'linux'
	}

	parameters {
		booleanParam(
			name: 'RELEASE',
			defaultValue: false,
			description: "Build testing and production version, and upload them to nexus/testflight/appstore. " +
				"The production version will need to be released manually from appstoreconnect.apple.com."
		)
		booleanParam(
			name: 'PROD',
			defaultValue: true
		)
		booleanParam(
			name: 'STAGING',
			defaultValue: true
		)
		persistentText(
			name: "releaseNotes",
			defaultValue: "",
			description: "release notes for this build"
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

		stage("Build and upload to Apple") {
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
							buildWebapp("test")
							generateXCodeProjects()
							runFastlane("de.tutao.tutanota.test", "adhoc_staging")
							if (params.RELEASE) {
								runFastlane("de.tutao.tutanota.test", "testflight_staging")
							}
							stash includes: "app-ios/releases/tutanota-${VERSION}-adhoc-test.ipa", name: 'ipa-testing'
						}
					}
				}
				stage('Production') {
					when {
						expression { params.PROD }
					}
					steps {
						script {
							buildWebapp("prod")
							generateXCodeProjects()
							runFastlane("de.tutao.tutanota", "adhoc_prod")
							if (params.RELEASE) {
								writeReleaseNotesForAppStore()
								runFastlane("de.tutao.tutanota", "appstore_prod submit:true")
							}
							stash includes: "app-ios/releases/tutanota-${VERSION}-adhoc.ipa", name: 'ipa-production'
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
							publishToNexus("ios-test", "tutanota-${VERSION}-adhoc-test.ipa")
						}
					}

					if (params.PROD) {
						unstash 'ipa-production'
						catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'There was an error when uploading to Nexus') {
							publishToNexus("ios", "tutanota-${VERSION}-adhoc.ipa")
						}
					}
				}
			}
		}

		stage('Tag and create github release page') {
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

					catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to create github release page for ios') {
						def tag = "tutanota-ios-release-${VERSION}"
						// need to run npm ci to install dependencies of releaseNotes.js
						sh "npm ci"

						writeFile file: "notes.txt", text: params.releaseNotes
						withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
							sh """node buildSrc/createReleaseDraft.js --name '${VERSION} (iOS)' \
																		   --tag 'tutanota-ios-release-${VERSION}' \
																		   --notes notes.txt"""
						} // withCredentials
						sh "rm notes.txt"
					} // catchError
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
	}
}

void buildWebapp(String stage) {
	script {
		sh "pwd"
		sh "echo $PATH"
    	sh "npm ci"
    	sh 'npm run build-packages'
    	sh "node --max-old-space-size=8192 webapp ${stage}"
    	sh "node buildSrc/prepareMobileBuild.js dist"
	}
}

// Runs xcodegen on `projectPath`, a directory containing a `project.yml`
void generateXCodeProject(String projectPath) {
	// xcodegen ignores its --project and --project-roots flags
	// so we need to change the directory manually
	script {
		sh "(cd ${projectPath}; xcodegen generate)"
	}
}

// Runs xcodegen on all of our project specs
void generateXCodeProjects() {
	generateXCodeProject("app-ios")
	generateXCodeProject("tuta-sdk/ios")
}


void writeReleaseNotesForAppStore() {
	script {
		catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to create github release notes for ios') {
			// need to run npm ci to install dependencies of releaseNotes.js
			sh "npm ci"
			writeFile file: "notes.txt", text: params.releaseNotes
			withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
				sh """node buildSrc/createReleaseDraft.js --name '${VERSION} (iOS)' \
																   --tag 'tutanota-ios-release-${VERSION}'\
																   --notes notes.txt \
																   --toFile ${RELEASE_NOTES_PATH}"""
			}
			sh "rm notes.txt"
		}
	}

	sh "echo Created release notes for fastlane ${RELEASE_NOTES_PATH}"
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