pipeline {
    environment {
        NODE_PATH = "/opt/node-v10.11.0-linux-x64/bin"
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
        		PATH="${env.PATH}:${env.NODE_PATH}"
        	}
            agent {
                label 'linux'
            }
            steps {
            	sh 'npm ci'
				sh 'node dist release'
				stash includes: 'build/dist/**', excludes:'**/index.html, **/app.html, **/desktop.html, **/index.js, **/app.js, **/desktop.js', name: 'web_base'
				stash includes: '**/dist/index.html, **/dist/index.js, **/dist/app.html, **/dist/app.js', name: 'web_add'
				stash includes: 'build/bundles.json', name: 'bundles'
            }
        }

        stage('Build Desktop clients'){
            parallel {

                stage('desktop-win') {
					environment {
        		        PATH="${env.PATH}:${env.NODE_PATH}"
					}
                    agent {
                        label 'win'
                    }
                    steps {
            			sh 'npm ci'
						sh 'rm -rf ./build/*'
						unstash 'web_base'
						unstash 'bundles'
						withCredentials([string(credentialsId: 'WIN_CSC_KEY_PASSWORD', variable: 'PW')]){
						    sh '''
						    export JENKINS=TRUE;
						    export WIN_CSC_KEY_PASSWORD=${PW};
						    export WIN_CSC_LINK="/opt/etc/comodo-codesign.p12";
						    node dist -ew '''
						}
						dir('build') {
							stash includes: 'desktop-test/*', name:'win_installer_test'
							stash includes: 'desktop/*', name:'win_installer'
						}
                	}
                }

                stage('desktop-mac') {
                    agent {
                        label 'mac'
                    }
                    steps {
						sh 'npm ci'
						sh 'rm -rf ./build/*'
						unstash 'web_base'
						unstash 'bundles'
						withCredentials([string(credentialsId: 'WIN_CSC_KEY_PASSWORD', variable: 'PW')]){
							sh '''
							export JENKINS=TRUE;
							export MAC_CSC_KEY_PASSWORD=${PW};
							export MAC_CSC_LINK="/opt/etc/comodo-codesign.p12";
							node dist -em '''
						}
						dir('build') {
							stash includes: 'desktop-test/*', name:'mac_installer_test'
                            stash includes: 'desktop/*', name:'mac_installer'
						}
                    }
                }

                stage('desktop-linux'){
                    agent {
                        label 'linux'
                    }
					environment {
						PATH="${env.PATH}:${env.NODE_PATH}"
					}
                    steps {
						sh 'npm ci'
						sh 'rm -rf ./build/*'
						unstash 'web_base'
						unstash 'bundles'
						withCredentials([string(credentialsId: 'WIN_CSC_KEY_PASSWORD', variable: 'PW')]){
							sh '''
							export JENKINS=TRUE;
							export LINUX_CSC_KEY_PASSWORD=${PW};
							export LINUX_CSC_LINK="/opt/etc/comodo-codesign.p12";
							node dist -el '''
						}
						dir('build') {
							stash includes: 'desktop-test/*', name:'linux_installer_test'
							stash includes: 'desktop/*', name:'linux_installer'
						}
                    }
                }
            }
        }

		stage('Copy Snapshot'){
			agent {
				label 'master'
			}
			when {
				expression { !params.RELEASE }
			}
			steps {
				sh 'rm -f /opt/desktop-snapshot/*'
				dir('/opt/desktop-snapshot/') {
					unstash 'linux_installer_test'
					unstash 'win_installer_test'
					unstash 'mac_installer_test'
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
				PATH="${env.PATH}:${env.NODE_PATH}"
			}
            steps {
            	sh 'npm ci'
				sh 'rm -rf ./build/*'
				unstash 'web_base'
				unstash 'web_add'
				unstash 'bundles'
				dir('build'){
					unstash 'linux_installer'
					unstash 'mac_installer'
					unstash 'win_installer'
					unstash 'linux_installer_test'
                    unstash 'mac_installer_test'
                    unstash 'win_installer_test'
				}
				sh 'node dist -edp release'
            }
        }
    }
}