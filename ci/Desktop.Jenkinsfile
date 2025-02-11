pipeline {
    environment {
    	// on m1 macs, this is a symlink that must be updated. see wiki.
        VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
        TMPDIR='/tmp'
    }
    options {
		preserveStashes()
	}

	parameters {
		booleanParam(
			name: 'UPLOAD',
			defaultValue: false,
			description: "Upload built clients to Nexus"
		)
        booleanParam(
			name: 'WINDOWS',
			defaultValue: true,
			description: "Build Windows client"
		)
        booleanParam(
			name: 'MAC',
			defaultValue: true,
			description: "Build Mac client"
		)
        booleanParam(
			name: 'LINUX',
			defaultValue: true,
			description: "Build Linux client"
		)
        string(
            name: 'branch',
            defaultValue: "*/master",
            description: "the branch to build the release from"
        )
	}

	agent {
		label 'master'
	}

    stages {
        stage("Checking params") {
            steps {
                script{
                    if(!params.WINDOWS && !params.MAC && !params.LINUX) {
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
		} // stage check github
		stage('Build webapp') {
			agent {
				dockerfile {
					filename 'linux-build.dockerfile'
					label 'master'
					dir 'ci/containers'
							additionalBuildArgs "--format docker --squash"
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
		} // stage build webapp
		stage('Build desktop clients') {
			parallel {
				stage('Windows') {
				    when { expression { return params.WINDOWS } }
				    stages {
						stage('Native modules') {
					environment {
						CMAKE = "C:\\Program Files\\Cmake\\bin\\cmake.exe"
					}
							agent {
								label 'win-native'
							}
							steps {
								bat "npm ci"
								// building packages builds node-mimimi
								bat "npm run build-packages"

								bat "node buildSrc\\getNodeGypLibrary.js better-sqlite3 --copy-target better_sqlite3 --force-rebuild --root-dir ${WORKSPACE}"
								// napi-rs rollup plugin expects .node for the package to be next to the entry point
								// so we stash and unstash it as-is
								stash includes: 'native-cache/**/*,packages/node-mimimi/dist/*.node', name: 'native_modules'
							}
						}
				    	stage("Client") {
							environment {
								PATH = "${env.NODE_PATH}:${env.PATH}"
							}
							agent {
								label 'win-cross-compile'
							}
							steps {
								initBuildArea()

								// nativeLibraryProvider.js placed the built native modules in the correct location (native-cache)
								// so they will be picked up by our rollup plugin.
								//
								unstash 'native_modules'

								// add DEBUG for electron-builder because it tends to not let us know about things failing
								withCredentials([string(credentialsId: 'YUBI_28989236_PIN', variable: 'PW')]) {
									sh '''
									export YUBI_PIN=${PW};
									DEBUG=electron-builder node desktop --existing --platform win '''
								}

								dir('artifacts') {
									stash includes: 'desktop-test/*', name:'win_installer_test'
									stash includes: 'desktop/*', name:'win_installer'
								}
							} // steps
				    	} // stage client
				    } // stages
                } // stage windows

                stage('Mac') {
				    when { expression { return params.MAC } }
					environment {
						PATH = "${env.NODE_MAC_PATH}:${env.RUST_MAC_PATH}:${env.PATH}"
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
								def stage = params.UPLOAD ? 'release' : 'prod'
								sh '''
								export APPLEID=${APPLEIDVAR};
								export APPLEIDPASS=${APPLEIDPASSVAR};
								export APPLETEAMID=${APPLETEAMIDVAR};
								node desktop --existing --architecture universal --platform mac ''' + "${stage}"
								dir('artifacts') {
									if (params.UPLOAD) {
										stash includes: 'desktop-test/*', name:'mac_installer_test'
									}
									stash includes: 'desktop/*', name:'mac_installer'
								}
							}
						} // withCredentials
					} // steps
				} // stage mac

				stage('Linux') {
				    when { expression { return params.LINUX } }
					agent {
						dockerfile {
							filename 'linux-build.dockerfile'
							label 'master'
							dir 'ci/containers'
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
					} // steps
				} // stage linux
			} // stages
		} // stage build desktop clients

		stage('Preparation for sign clients and upload to Nexus') {
			agent {
				label 'master'
			}
			steps {
				script {
					def devicePath =  sh(script: 'lsusb | grep Nitro | sed -nr \'s|Bus (.*) Device ([^:]*):.*|/dev/bus/usb/\\1/\\2|p\'', returnStdout: true).trim()
					env.DEVICE_PATH = devicePath
				}
			}
		}
		stage('Sign clients and upload to Nexus') {
			when { expression { return params.UPLOAD } }
			agent {
				dockerfile {
					filename 'linux-build.dockerfile'
					label 'master'
					dir 'ci/containers'
					additionalBuildArgs '--format docker'
					args "--network host -v /run:/run:rw,z -v /opt/repository:/opt/repository:rw,z --device=${env.DEVICE_PATH}"
				} // docker
		    }
		    environment {
                PATH = "${env.NODE_PATH}:${env.PATH}"
            }
		    stages {
                stage('Preparation for sign and upload') {
                    steps {
                        sh 'npm ci'
                        sh 'npm run build-packages'
                    }
                }
                stage('Sign and upload') {
                    parallel {
                        stage('Windows') {
                            when { expression { return params.WINDOWS } }
                            steps {
                                dir('build') {
                                    unstash 'win_installer'
                                    unstash 'win_installer_test'
                                }

                                withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
                                    sh '''export HSM_USER_PIN=${PW}; node buildSrc/signDesktopClients.js'''
                                }

								uploadWindowsArtifacts()
                            }
                        } // stage windows
                        stage('Mac') {
                            when { expression { return params.MAC } }
                            steps {
                                 dir('build') {
                                     unstash 'mac_installer'
                                     unstash 'mac_installer_test'
                                 }

                                withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
                                    sh '''export HSM_USER_PIN=${PW}; node buildSrc/signDesktopClients.js'''
                                }

								uploadMacArtifacts()
                            }
                        } // stage mac
                        stage('Linux') {
                            when { expression { return params.LINUX } }
                            steps {
                                dir('build') {
                                    unstash 'linux_installer'
                                    unstash 'linux_installer_test'
                                }

                                withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
                                    sh '''export HSM_USER_PIN=${PW}; node buildSrc/signDesktopClients.js'''
                                }

								uploadLinuxArtifacts()
                            }
                        } // stage linux
                    } // parallel
                } // stage sign and upload
            } // stages
		} // stage sign clients and upload to Nexus
	} // stages
} // pipeline

def uploadWindowsArtifacts() {
    script {
   		def artifactsMap = load "ci/jenkins-lib/desktop-artifacts-map.groovy"
   		def windowsFiles = artifactsMap.filesPathAndExt().windows

        uploadArtifacts("desktop-win-test", windowsFiles.staging)
        uploadArtifacts("desktop-win", windowsFiles.prod)
    }
}

def uploadMacArtifacts() {
    script {
   		def artifactsMap = load "ci/jenkins-lib/desktop-artifacts-map.groovy"
   		def macFiles = artifactsMap.filesPathAndExt().mac

        uploadArtifacts("desktop-mac-test", macFiles.staging)
        uploadArtifacts("desktop-mac", macFiles.prod)
    }
}

def uploadLinuxArtifacts() {
    script {
   		def artifactsMap = load "ci/jenkins-lib/desktop-artifacts-map.groovy"
   		def linuxFiles = artifactsMap.filesPathAndExt().linux

        uploadArtifacts("desktop-linux-test", linuxFiles.staging)
        uploadArtifacts("desktop-linux", linuxFiles.prod)
	}
}

def uploadArtifacts(artifactId, filesPathAndExt) {
	def util = load "ci/jenkins-lib/util.groovy"

	for (String[] file in filesPathAndExt) {
		if (!fileExists(file[0])) {
			currentBuild.result = 'ABORTED'
			error("Unable to find file ${file[0]}")
		}

        util.publishToNexus(
                groupId: "app",
                artifactId: artifactId,
                version: "${VERSION}",
                assetFilePath: "${WORKSPACE}/${file[0]}",
                fileExtension: file[1]
        )
	}
}

def initBuildArea() {
	sh 'node -v'
	sh 'npm -v'
    sh 'npm ci'
    sh 'npm run build-packages'
    sh 'rm -rf ./build/*'
    sh 'rm -rf ./native-cache/*'
    unstash 'web_base'
}
