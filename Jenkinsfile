pipeline {
    environment {
         NODE_PATH="/opt/node-v14.15.4-linux-x64/bin"
         NODE_MAC_PATH="/usr/local/bin/"
    }
	options {
		preserveStashes()
	}

	parameters {
        booleanParam(name: 'RELEASE', defaultValue: false, description: '')
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
            }
        }

        stage('Build Desktop clients'){
			when {
				expression { params.RELEASE }
			}
            parallel {
                stage('desktop-win') {
					environment {
        		        PATH="${env.NODE_PATH}:${env.PATH}"
					}
                    agent {
                        label 'win'
                    }
                    steps {
            			sh 'npm ci'
						sh 'rm -rf ./build/*'
						unstash 'web_base'
						withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
						    sh '''
						    export JENKINS=TRUE;
						    export HSM_USER_PIN=${PW};
						    export WIN_CSC_FILE="/opt/etc/codesign.crt";
						    node dist -ew '''
						}
						dir('build') {
							stash includes: 'desktop-test/*', name:'win_installer_test'
							stash includes: 'desktop/*', name:'win_installer'
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
					   	withCredentials([usernamePassword(credentialsId: 'APP_NOTARIZE_CREDS', usernameVariable: 'APPLEIDVAR', passwordVariable: 'APPLEIDPASSVAR')]) {
							sh '''
								export JENKINS=TRUE;
								export APPLEID=${APPLEIDVAR};
								export APPLEIDPASS=${APPLEIDPASSVAR};
								node dist -em '''
						}
						dir('build') {
							stash includes: 'desktop-test/*', name:'mac_installer_test'
                            stash includes: 'desktop/*', name:'mac_installer'
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
						sh 'node dist -el'
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
					sh '''
					export HSM_USER_PIN=${PW};
					node dist -edp release '''
				}
            }
        }
    }
}
