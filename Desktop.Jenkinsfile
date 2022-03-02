pipeline {
    environment {
         NODE_PATH="/opt/node-v16.3.0-linux-x64/bin"
         NODE_MAC_PATH="/usr/local/opt/node@16/bin/"
    	 VERSION = sh(returnStdout: true, script: "${NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
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
        booleanParam(
        	name: 'UPDATE_DICTIONARIES',
        	defaultValue: false,
        	description: 'pull the spellcheck dictionaries from github when producing .debs'
        )
    }

    agent {
        label 'master'
    }

    stages {
        stage('Build Webapp') {
        	environment {
        		PATH="${env.NODE_PATH}:${env.PATH}"
        	}
            agent {
                label 'linux'
            }
            steps {
            	sh 'npm ci'
            	sh 'npm run build-packages'
				sh 'node webapp.js release'

				// excluding web-specific and mobile specific parts which we don't need in desktop
				stash includes: 'build/dist/**', excludes: '**/braintree.html, **/index.html, **/app.html, **/desktop.html, **/index-index.js, **/index-app.js, **/index-desktop.js, **/dist/sw.js', name: 'web_base'
            }
        }

        stage('Build Desktop clients'){
            parallel {
                stage('desktop-win') {
					stages {
						stage('compile-keytar-win') {
							agent {
								label 'win-full'
							}
							steps {
								bat 'npm ci'
								bat 'node buildSrc\\compileKeytar.js'
								stash includes: 'node_modules/keytar/build/Release/keytar.node', name: 'keytar_win'
							}
						}
						stage('compile-desktop-win') {
							environment {
								PATH="${env.NODE_PATH}:${env.PATH}"
                        	}
							agent {
								label 'win'
							}
							steps {
								initBuildArea()
								unstash 'keytar_win'

								withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
									sh '''
									export JENKINS=TRUE;
									export HSM_USER_PIN=${PW};
									export WIN_CSC_FILE="/opt/etc/codesign.crt";
									node desktop --existing --win '''
								}
								dir('build') {
									stash includes: 'desktop-test/*', name:'win_installer_test'
									stash includes: 'desktop/*', name:'win_installer'
								}
							}
						}
					}
                }

                stage('desktop-mac') {
                	environment {
                		PATH="${env.NODE_MAC_PATH}:${env.PATH}"
                	}
                    agent {
                        label 'mac'
                    }
                    steps {

						initBuildArea()

					   	withCredentials(
					   		[
					   			usernamePassword(credentialsId: 'APP_NOTARIZE_CREDS', usernameVariable: 'APPLEIDVAR', passwordVariable: 'APPLEIDPASSVAR'),
								string(credentialsId: 'fastlane-keychain-password', variable: 'FASTLANE_KEYCHAIN_PASSWORD'),
								string(credentialsId: 'team-id', variable: 'APPLETEAMIDVAR'),
					   		]
						)
						{
							sh 'security unlock-keychain -p $FASTLANE_KEYCHAIN_PASSWORD'
							script {
								def stage = params.RELEASE ? 'release' : 'prod'
								sh '''
									export JENKINS=TRUE;
									export APPLEID=${APPLEIDVAR};
									export APPLEIDPASS=${APPLEIDPASSVAR};
									export APPLETEAMID=${APPLETEAMIDVAR};
									node desktop --existing --mac ''' + "${stage}"
								dir('build') {
									if (params.RELEASE) {
										stash includes: 'desktop-test/*', name:'mac_installer_test'
									}
									stash includes: 'desktop/*', name:'mac_installer'
								}
							}
						}
					}
                }

                stage('desktop-linux') {
                    agent {
                        label 'linux'
                    }
					environment {
						PATH="${env.NODE_PATH}:${env.PATH}"
					}
                    steps {
						initBuildArea()

						sh 'node desktop --existing --linux'

						dir('build') {
							stash includes: 'desktop-test/*', name:'linux_installer_test'
							stash includes: 'desktop/*', name:'linux_installer'
						}
                    }
                }
            }
        }

        stage('Build deb and publish') {
            when {
            	expression { params.RELEASE }
            }
            agent {
                label 'linux'
            }
			environment {
				PATH="${env.NODE_PATH}:${env.PATH}"
			}
            steps {
            	sh 'npm ci'
				sh 'rm -rf ./build/*'

				dir('build') {
					unstash 'linux_installer'
					unstash 'mac_installer'
					unstash 'win_installer'
					unstash 'linux_installer_test'
                    unstash 'mac_installer_test'
                    unstash 'win_installer_test'
				}
				script {
					if (params.UPDATE_DICTIONARIES) {
						sh 'node buildSrc/fetchDictionaries.js --publish'
					}
				}

				withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]){
					sh '''export HSM_USER_PIN=${PW};
					node buildSrc/signDesktopClients.js'''
				}

				sh 'node buildSrc/publish.js desktop'

				catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to create github release page') {
					withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
						sh """node buildSrc/createGithubReleasePage.js --name '${VERSION} (Desktop)' \
																	   --milestone '${VERSION}' \
																	   --tag 'tutanota-desktop-release-${VERSION}' \
																	   --platform desktop"""
					}
				}
            }
        }
    }
}

def initBuildArea() {
	sh 'npm ci'
	sh 'npm run build-packages'
	sh 'rm -rf ./build/*'
	sh 'rm -rf ./native-cache/*'
	unstash 'web_base'
}
