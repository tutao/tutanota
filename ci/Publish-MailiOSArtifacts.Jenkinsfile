pipeline {
    parameters {
		string(
			name: 'appVersion',
			defaultValue: "",
			description: 'Which version should be published'
		)
		booleanParam(
			name: 'STAGING',
			defaultValue: true
		)
		booleanParam(
			name: 'PROD',
			defaultValue: false
		)
		booleanParam(
	        name: 'APP_STORE_NOTES',
	        defaultValue: false,
	        description: "Publish iOS release notes to the Apple App Store"
		)
		booleanParam(
	        name: 'GITHUB_RELEASE',
	        defaultValue: false,
	        description: "Publish iOS release notes to Github"
		)
		persistentText(
			name: 'releaseNotes',
			defaultValue: "",
			description: "iOS release notes"
		)
    }

	environment {
		PATH="${env.NODE_PATH}:${env.PATH}"
		PACKAGE_VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		VERSION = "${params.appVersion.trim() ?: PACKAGE_VERSION}"
		GITHUB_RELEASE_PAGE = "https://github.com/tutao/tutanota/releases/tag/tutanota-ios-release-${VERSION}"
		FILE_PATH_STAGING = "build/app-ios/releases/tutanota-${VERSION}-test.ipa"
		FILE_PATH_PROD = "build/app-ios/releases/tutanota-${VERSION}.ipa"
	}

    agent {
		label 'linux'
	}

    stages {
    	stage("Checking params") {
			steps {
				script{
					if(!params.STAGING && !params.PROD && !params.GITHUB_RELEASE) {
						currentBuild.result = 'ABORTED'
						error('No tasks were selected.')
					}
				}
				echo "Params OKAY"
			}
    	}
		stage("Download artifacts") {
			parallel {
				stage("Staging") {
					when { expression { return params.STAGING } }
					steps {
						downloadIOSApp("ios-test", FILE_PATH_STAGING)
						stash includes: FILE_PATH_STAGING, name: 'ipa-staging'
					}
				}
				stage("Production") {
					when { expression { return params.PROD } }
					steps {
						downloadIOSApp("ios", FILE_PATH_PROD)
						stash includes: FILE_PATH_PROD, name: 'ipa-prod'
					}
				}
			} // parallel
		} // stage download artifacts
		stage("Apple App Store") {
			when { expression { return params.STAGING || params.PROD } }
			environment {
				MAC_NODE_PATH = "/usr/local/opt/node@20/bin/"
				PATH="/opt/homebrew/bin:${MAC_NODE_PATH}:${env.PATH}"
				MATCH_GIT_URL = "git@gitlab:/tuta/apple-certificates.git"
				LC_ALL = "en_US.UTF-8"
				LANG = "en_US.UTF-8"
			}
			agent {
				label 'mac'
			}
			stages {
				stage("Staging") {
					when { expression { return params.STAGING } }
					steps {
						unstash "ipa-staging"

						script {
							def util = load "ci/jenkins-lib/util.groovy"
							util.runFastlane("de.tutao.tutanota.test", "publish_mail_staging file:${WORKSPACE}/${FILE_PATH_STAGING}")
						}
					} // steps
				} // stage staging
				stage("Production") {
					when { expression { return params.PROD } }
					environment {
						RELEASE_NOTES_PATH = "app-ios/fastlane/metadata/default/release_notes.txt"
					}
					steps {
						unstash "ipa-prod"

						script {
							if (params.APP_STORE_NOTES) {
								// need to run npm ci to install dependencies of releaseNotes.js
								sh "npm ci"

								writeFile file: "notes.txt", text: params.releaseNotes
								sh """node buildSrc/createReleaseDraft.js --name '${VERSION} (iOS)' \
																				   --tag 'tutanota-ios-release-${VERSION}'\
																				   --notes notes.txt \
																				   --toFile ${RELEASE_NOTES_PATH}"""
								sh "rm notes.txt"
								sh "echo Created release notes for fastlane ${RELEASE_NOTES_PATH}"
							}

							def util = load "ci/jenkins-lib/util.groovy"
							util.runFastlane("de.tutao.tutanota", "publish_mail_prod file:${WORKSPACE}/${FILE_PATH_PROD}")
						}
					} // steps
				} // stage production
			} // stages
		} // stage apple app store
		stage("GitHub release notes") {
			when { expression { return params.GITHUB_RELEASE } }
			steps {
				script {
					sh 'npm ci'

					writeFile file: "notes.txt", text: params.releaseNotes
					withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
						sh """node buildSrc/createReleaseDraft.js --name '${VERSION} (iOS)' \
																--tag 'tutanota-ios-release-${VERSION}' \
																--notes notes.txt"""
					} // withCredentials
					sh "rm notes.txt"
				} // script
			} // steps
		} // stage GitHub release notes
    } // stages
} // pipeline

def downloadIOSApp(String artifactId, String filePath) {
	def util = load "ci/jenkins-lib/util.groovy"

	util.downloadFromNexus(
		groupId: "app",
		artifactId: "${artifactId}",
		version: "${VERSION}",
		outFile: "${WORKSPACE}/${filePath}",
		fileExtension: "ipa"
	)

    if (!fileExists("${filePath}")) {
        currentBuild.result = 'ABORTED'
        error("Unable to find file ${filePath}")
    }
    echo "File ${filePath} found!"
}