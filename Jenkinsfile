pipeline {
	environment {
		PATH='$PATH:/opt/node-v10.11.0-linux-x64/bin/'
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
				sh 'node dist prod'
				stash includes: 'build/dist/**', excludes:'**/index.html, **/app.html, **/desktop.html, **/index.js, **/app.js, **/desktop.js', name: 'web_base'
				stash includes: '**/index.html, **/index.js, **/app.html, **/app.js', name: 'web_add'
				stash includes: '**/desktop.html, **/desktop.js', name: 'web_desktop'
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
						sh 'rm -rf ./app-desktop/dist/'
						sh 'rm -rf ./build/dist/'
						unstash 'web_base'
						unstash 'web_desktop'
						sh 'node dist -pw prod'
						dir('build/dist/desktop') {
							stash includes: 'tutanota-desktop-*, *.yml', name:'win_installer'
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
						sh 'rm -rf ./app-desktop/dist/'
						sh 'rm -rf ./build/dist/'
						unstash 'web_base'
						unstash 'web_desktop'
						sh 'node dist -pm prod'
						dir('build/dist/desktop') {
							stash includes: 'tutanota-desktop-*, *.yml', name:'mac_installer'
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
						sh 'rm -rf ./app-desktop/dist/'
						sh 'rm -rf ./build/dist/'
						unstash 'web_base'
						unstash 'web_desktop'
						sh 'node dist -pl prod'
						dir('build/dist/desktop') {
							stash includes: 'tutanota-desktop-*, *.yml', name:'linux_installer'
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
				sh 'rm -rf ./build/dist/'
				unstash 'web_base'
				unstash 'web_add'
				dir('build/dist/desktop'){
					unstash 'linux_installer'
					unstash 'mac_installer'
					unstash 'win_installer'
				}
				sh 'node dist -pd'
				archiveArtifacts artifacts: 'build/*.deb', onlyIfSuccessful: true
            }
        }
    }
}