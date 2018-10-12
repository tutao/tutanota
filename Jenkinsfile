pipeline {
	environment {
		PATH="${env.PATH}:/opt/node-v10.11.0-linux-x64/bin/"
	}

    agent {
        label 'master'
    }

    stages {
        stage('Build Webapp') {
            agent {
                label 'linux'
            }
            steps {
            	sh 'npm prune'
            	sh 'npm install'
				sh 'node dist'
				stash includes: 'build/dist/**', excludes:'**/index.html, **/app.html, **/desktop.html, **/index.js, **/app.js, **/desktop.js', name: 'web_base'
				stash includes: '**/dist/index.html, **/dist/index.js, **/dist/app.html, **/dist/app.js', name: 'web_add'
				stash includes: 'build/bundles.json', name: 'bundles'
            }
        }

        stage('Build Desktop clients'){
            parallel {

                stage('desktop-win') {
                    agent {
                        label 'win'
                    }
                    steps {
						sh 'npm prune'
						sh 'npm install'
						sh 'rm -rf ./build/*'
						unstash 'web_base'
						unstash 'bundles'
						withCredentials([string(credentialsId: 'WIN_CSC_KEY_PASSWORD', variable: 'PW')]){
						    sh '''
						    export WIN_CSC_KEY_PASSWORD=${PW};
						    export WIN_CSC_LINK="/opt/etc/comodo-codesign.p12";
						    node dist -pw
						    '''
						}
						dir('build/desktop') {
							stash includes: 'tutanota-desktop-*, *.yml', name:'win_installer'
						}
						dir('build/desktop-test') {
							stash includes: 'tutanota-desktop-*, *.yml', name:'win_installer_test'
						}
                	}
                }

                stage('desktop-mac') {
                    agent {
                        label 'mac'
                    }
                    steps {
						sh 'npm prune'
						sh 'npm install'
						sh 'rm -rf ./build/*'
						unstash 'web_base'
						unstash 'bundles'
						sh 'node dist -pm'
						dir('build/desktop') {
							stash includes: 'tutanota-desktop-*, *.yml', name:'mac_installer'
						}
						dir('build/desktop-test') {
							stash includes: 'tutanota-desktop-*, *.yml', name:'mac_installer_test'
						}
                    }
                }

                stage('desktop-linux'){
                    agent {
                        label 'linux'
                    }
                    steps {
						sh 'npm prune'
						sh 'npm install'
						sh 'rm -rf ./build/*'
						unstash 'web_base'
						unstash 'bundles'
						sh 'node dist -pl'
						dir('build/desktop') {
							stash includes: 'tutanota-desktop-*, *.yml', name:'linux_installer'
						}
						dir('build/desktop-test') {
							stash includes: 'tutanota-desktop-*, *.yml', name:'linux_installer_test'
						}
                    }
                }
            }
        }

        stage('Build deb') {
            agent {
                label 'linux'
            }
            steps {
            	sh 'npm prune'
            	sh 'npm install'
				sh 'rm -rf ./build/*'
				unstash 'web_base'
				unstash 'web_add'
				dir('build/desktop'){
					unstash 'linux_installer'
					unstash 'mac_installer'
					unstash 'win_installer'
				}
				dir('build/desktop-test'){
					unstash 'linux_installer_test'
					unstash 'mac_installer_test'
					unstash 'win_installer_test'
				}
				sh 'node dist -pd'
            }
        }
    }
}