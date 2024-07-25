pipeline {
    environment {
    	// on m1 macs, this is a symlink that must be updated. see wiki.
//         VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
        VERSION = '235.240718.1'
        TMPDIR='/tmp'
    }
    options {
		preserveStashes()
	}

	parameters {
		booleanParam(
			name: 'RELEASE',
			defaultValue: false,
			description: "Prepare a release version (doesn't publish to production, this is done manually)"
		)
		persistentText(
			name: "releaseNotes",
			defaultValue: "",
			description: "release notes for this build"
		 )
	}

	agent {
		label 'linux'
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
		stage('Docker self check') {
		agent {
			dockerfile {
				filename 'Desktop.dockerfile'
				label 'master'
				dir 'ci'
				additionalBuildArgs "--format docker"
				args '--network host'
			} // docker
		} // agent
			steps {
				sh 'pwd'
				sh 'whoami'
				sh 'node -v'
				sh 'df -h'
				sh 'rustc --version'
				sh 'cargo --version'
			}
		}
		stage('Build dependencies') {
			parallel {
				stage('Build webapp') {
					agent {
						dockerfile {
							filename 'Desktop.dockerfile'
							label 'master'
							dir 'ci'
							additionalBuildArgs "--format docker"
							args '--network host'
						} // docker
					} // agent
					steps {
						sh 'npm ci'
						sh 'npm run build-packages'
						sh 'node webapp.js release'

						// excluding web-specific and mobile specific parts which we don't need in desktop
						stash includes: 'build/**', excludes: '**/braintree.html, **/index.html, **/app.html, **/desktop.html, **/index-index.js, **/index-app.js, **/index-desktop.js, **/sw.js', name: 'web_base'
					}
				}
			}
		}

		stage('Build desktop clients') {
			parallel {
				stage('Linux') {
					agent {
						dockerfile {
							filename 'Desktop.dockerfile'
							label 'master'
							dir 'ci'
							additionalBuildArgs "--format docker"
							args '--network host'
						} // docker
					}
					steps {
						initBuildArea()

						sh 'node desktop --existing --platform linux'

						dir('artifacts') {
							stash includes: 'desktop-test/*', name:'linux_installer_test'
							stash includes: 'desktop/*', name:'linux_installer'
						}
					}
				}
			}
		}

		stage('Preparation for build deb and publish') {
			when { expression { params.RELEASE } }
			agent {
				label 'linux'
			}
			steps {
				sh 'ls -lah /opt'
			}
		}
		stage('Build deb and publish') {
			when { expression { params.RELEASE } }
			agent {
					dockerfile {
					filename 'Desktop.dockerfile'
					label 'master'
					dir 'ci'
					additionalBuildArgs "--format docker"
					args '--network host -v /opt/repository:/opt/repository:rw,z'
				} // docker
		    }
			steps {
				sh 'npm ci'
				sh 'npm run build-packages'
				sh 'rm -rf ./build/*'

				dir('build') {
					unstash 'linux_installer'
// 					unstash 'mac_installer'
// 					unstash 'win_installer'
					unstash 'linux_installer_test'
// 					unstash 'mac_installer_test'
// 					unstash 'win_installer_test'
				}

// 				withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
// 					sh '''export HSM_USER_PIN=${PW}; node buildSrc/signDesktopClients.js'''
// 				}

				sh 'node buildSrc/publish.js desktop'

				script { // create release draft
					def desktopLinux = "build/desktop/tutanota-desktop-linux.AppImage"
// 					def desktopWin = "build/desktop/tutanota-desktop-win.exe"
// 					def desktopMac = "build/desktop/tutanota-desktop-mac.dmg"

					writeFile file: "notes.txt", text: params.releaseNotes
					catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to create github release page for desktop') {
						withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
							sh """node buildSrc/createReleaseDraft.js --name '${VERSION} (Desktop)' \
																   --tag 'tutanota-desktop-release-${VERSION}' \
																   --uploadFile '${WORKSPACE}/${desktopLinux}' \
																   --notes notes.txt"""
						} // withCredentials
					} // catchError
					sh "rm notes.txt"
				} // script release draft

				script { // upload to nexus
					def util = load "ci/jenkins-lib/util.groovy"

					util.publishToNexus(
							groupId: "app",
							artifactId: "desktop-linux-test",
							version: "${VERSION}",
							assetFilePath: "${WORKSPACE}/build/desktop-test/tutanota-desktop-test-linux.AppImage",
							fileExtension: 'AppImage'
					)
// 					util.publishToNexus(
// 							groupId: "app",
// 							artifactId: "desktop-win-test",
// 							version: "${VERSION}",
// 							assetFilePath: "${WORKSPACE}/build/desktop-test/tutanota-desktop-test-win.exe",
// 							fileExtension: 'exe'
// 					)
// 					util.publishToNexus(
// 							groupId: "app",
// 							artifactId: "desktop-mac-test",
// 							version: "${VERSION}",
// 							assetFilePath: "${WORKSPACE}/build/desktop-test/tutanota-desktop-test-mac.dmg",
// 							fileExtension: 'dmg'
// 					)
					util.publishToNexus(
							groupId: "app",
							artifactId: "desktop-linux",
							version: "${VERSION}",
							assetFilePath: "${WORKSPACE}/build/desktop/tutanota-desktop-linux.AppImage",
							fileExtension: 'AppImage'
					)
// 					util.publishToNexus(
// 							groupId: "app",
// 							artifactId: "desktop-win",
// 							version: "${VERSION}",
// 							assetFilePath: "${WORKSPACE}/build/desktop/tutanota-desktop-win.exe",
// 							fileExtension: 'exe'
// 					)
// 					util.publishToNexus(
// 							groupId: "app",
// 							artifactId: "desktop-mac",
// 							version: "${VERSION}",
// 							assetFilePath: "${WORKSPACE}/build/desktop/tutanota-desktop-mac.dmg",
// 							fileExtension: 'dmg'
// 					)
				} // script upload to nexus

			} // steps
		} // stage build deb & publish
	} // stages
} // pipeline

void initBuildArea() {
	sh 'node -v'
	sh 'npm -v'
    sh 'npm ci'
    sh 'npm run build-packages'
    sh 'rm -rf ./build/*'
    sh 'rm -rf ./native-cache/*'
    unstash 'web_base'
}
