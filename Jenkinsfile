pipeline {
	environment {
		PATH="${env.PATH}:/opt/node-v10.11.0-linux-x64/bin/"
	}

	parameters {
        booleanParam(name: 'RELEASE', defaultValue: false, description: '')
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
               		when {
                    	expression { params.RELEASE }
                    }
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
						dir('build') {
							stash includes: 'desktop*/tutanota-desktop-*, desktop*/*.yml', name:'win_installer'
						}
                	}
                }

                stage('desktop-mac') {
                	when {
                    	expression { params.RELEASE }
                    }
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
						dir('build') {
							stash includes: 'desktop*/tutanota-desktop-*, desktop*/*.yml', name:'mac_installer'
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
						sh 'node dist -pl ' + (params.RELEASE ? "" : "prod")
						dir('build') {
							stash includes: 'desktop*/tutanota-desktop-*, desktop*/*.yml', name:'linux_installer'
						}
                    }
                }
            }
        }

        stage('Build deb') {
            when {
                    	expression { params.RELEASE }
            }
            agent {
                label 'linux'
            }
            steps {
            	sh 'npm prune'
            	sh 'npm install'
				sh 'rm -rf ./build/*'
				unstash 'web_base'
				unstash 'web_add'
				unstash 'bundles'
				dir('build'){
					unstash 'linux_installer'
					unstash 'mac_installer'
					unstash 'win_installer'
				}
				sh 'node dist -pr'
            }
        }

        stage('Copy Snapshot'){
			agent {
				label 'master'
			}
            when {
                expression {!params.RELEASE}
            }
            steps {
            	sh 'rm /opt/desktop-snapshot/*'
            	dir('/opt') {
					unstash 'linux_installer'
            	}
				sh '''
					target=`ls /opt/desktop-snapshot/tutanota-desktop*`;
					ln -s ${target} /opt/desktop-snapshot/tutanota-desktop-snapshot-linux.AppImage
				'''
            }
        }
    }
}