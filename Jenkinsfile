pipeline {
    environment {
         NODE_PATH="/opt/node-v16.3.0-linux-x64/bin"
         NODE_MAC_PATH="/usr/local/opt/node@16/bin/"
    }
	options {
		preserveStashes()
	}

	parameters {
        booleanParam(
			name: 'RELEASE',
			defaultValue: false,
			description: "Prepare a release version (doesn't publish to production, this is done manually). Also publishes NPM modules"
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
				sh 'node dist release'
				// excluding web-specific and mobile specific parts which we don't need in desktop
				stash includes: 'build/dist/**', excludes: '**/braintree.html, **/index.html, **/app.html, **/desktop.html, **/index-index.js, **/index-app.js, **/index-desktop.js, **/dist/sw.js', name: 'web_base'
				// adding web-specific parts to another bundle
				stash includes: '**/braintree.html, **/dist/index.html, **/dist/index-index.js, **/dist/sw.js', name: 'web_add'
				// Bundle size stats
				publishHTML target: [
					allowMissing: false,
					alwaysLinkToLastBuild: false,
					keepAll: true,
					reportDir: 'build',
					reportFiles: 'stats.html',
					reportName: 'bundle stats'
				]
				// Bundle dependencies graph
				sh 'dot -Tsvg build/bundles.dot > build/bundles.svg'
				sh """echo '<!doctype html><html><body><img src="./bundles.svg" /></body></html>' > build/bundles.html"""
				publishHTML target: [
					allowMissing: false,
					alwaysLinkToLastBuild: false,
					keepAll: true,
					reportDir: 'build',
					reportFiles: 'bundles.html',
					reportName: 'bundle dependencies'
				]
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
								sh 'npm ci'
								unstash 'keytar_win'
								unstash 'web_base'
								withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
									sh '''
									export JENKINS=TRUE;
									export HSM_USER_PIN=${PW};
									export WIN_CSC_FILE="/opt/etc/codesign.crt";
									node dist --existing --win '''
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
						sh 'npm ci'
						sh 'rm -rf ./build/*'
						unstash 'web_base'
					   	withCredentials(
					   		[
					   			usernamePassword(credentialsId: 'APP_NOTARIZE_CREDS', usernameVariable: 'APPLEIDVAR', passwordVariable: 'APPLEIDPASSVAR'),
								string(credentialsId: 'fastlane-keychain-password', variable: 'FASTLANE_KEYCHAIN_PASSWORD'),
								string(credentialsId: 'team-id', variable: 'APPLETEAMIDVAR'),
					   		]
						)
						{
							sh "security unlock-keychain -p ${FASTLANE_KEYCHAIN_PASSWORD}"
							script {
								def stage = params.RELEASE ? 'release' : 'prod'
								sh '''
									export JENKINS=TRUE;
									export APPLEID=${APPLEIDVAR};
									export APPLEIDPASS=${APPLEIDPASSVAR};
									export APPLETEAMID=${APPLETEAMIDVAR};
									node dist --existing --mac ''' + "${stage}"
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
						sh 'npm ci'
						sh 'rm -rf ./build/*'
						unstash 'web_base'
						sh 'node dist --existing --linux'
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
				unstash 'web_base'
				unstash 'web_add'
				dir('build') {
					unstash 'linux_installer'
					unstash 'mac_installer'
					unstash 'win_installer'
					unstash 'linux_installer_test'
                    unstash 'mac_installer_test'
                    unstash 'win_installer_test'
				}
				withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]){
					sh '''export HSM_USER_PIN=${PW};
					node dist --existing --deb --publish ''' + (params.UPDATE_DICTIONARIES ? "--get-dicts " : "") + "release"
				}
            }
        }

        stage('Publish modules') {
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
				withCredentials([string(credentialsId: 'npm-token',variable: 'NPM_TOKEN')]) {
					sh "echo -e '\n//registry.npmjs.org/:_authToken=${NPM_TOKEN}' >> .npmrc"
				}
				sh "npm --workspaces publish"
				sh "rm .npmrc"
			}
        }
    }
}
