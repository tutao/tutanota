// this pipeline might fail if the checked out branch gets
// commits between the stages.
// deciding on a commit to check out at the start might be
// more robust

pipeline {
   environment {
     UPDATE_REPO_SH = '''
         #!/bin/sh
		 if [ ! -d tutanota ]; then
			 git clone https://github.com/tutao/tutanota.git;
		 fi;
		 cd tutanota;
		 git checkout electron-client;
		 git pull origin electron-client;
		 npm prune;
		 npm install;
		 cd ..
     '''
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
                sh ''' echo "${UPDATE_REPO_SH}" > update_repo.sh '''
                sh 'chmod u+x update_repo.sh'
                sh 'sh update_repo.sh'
                sh 'rm update_repo.sh'
                dir('tutanota') {
					sh 'node dist -h prod'
					stash includes: 'build/dist/**', excludes:'**/index.html, **/app.html, **/desktop.html, **/index.js, **/app.js, **/desktop.js', name: 'web_base'
					stash includes: '**/index.html, **/index.js, **/app.html, **/app.js', name: 'web_add'
					stash includes: '**/desktop.html, **/desktop.js', name: 'web_desktop'
                }
            }
        }

        stage('Build Desktop clients'){
            parallel {

                stage('desktop-win') {
                    agent {
                        label 'win'
                    }
                    steps {
                    	bat(script:'echo %UPDATE_REPO_CMD% > update_repo.cmd')
						bat(script:'update_repo.cmd')
						bat(script:'del update_repo.cmd')
						dir('tutanota'){
							unstash 'web_base'
							unstash 'web_desktop'
							sh 'node dist -h prod -P -D w'
							dir('build/dist/desktop') {
								stash includes: 'tutanota-desktop-*, *.yml', name:'win_installer'
							}
						}
                	}
                }

                stage('desktop-mac') {
                    agent {
                        label 'mac'
                    }
                    steps {
                        sh ''' echo "${UPDATE_REPO_SH}" > update_repo.sh '''
                        sh 'chmod u+x update_repo.sh'
                        sh 'sh update_repo.sh'
                        sh 'rm update_repo.sh'
                    	dir('tutanota') {
							unstash 'web_base'
							unstash 'web_desktop'
                    		sh 'node dist -h prod -P -D m'
                    		dir('build/dist/desktop') {
	                        	stash includes: 'tutanota-desktop-*, *.yml', name:'mac_installer'
	                        }
                    	}
                    }
                }

                stage('desktop-linux'){
                    agent {
                        label 'linux'
                    }
                    steps {
                        sh ''' echo "${UPDATE_REPO_SH}" > update_repo.sh '''
                        sh 'chmod u+x update_repo.sh'
                        sh 'sh update_repo.sh'
                        sh 'rm update_repo.sh'
                    	dir('tutanota') {
							unstash 'web_base'
							unstash 'web_desktop'
                    		sh 'node dist -h prod -P -D l'
							dir('build/dist/desktop') {
								stash includes: 'tutanota-desktop-*, *.yml', name:'linux_installer'
							}
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
                sh ''' echo "${UPDATE_REPO_SH}" > update_repo.sh '''
                sh 'chmod u+x update_repo.sh'
                sh 'sh update_repo.sh'
                sh 'rm update_repo.sh'
            	dir('tutanota'){
            	    sh 'rm -rf ./build/dist/'
					unstash 'web_base'
					unstash 'web_add'
            		dir('build/dist/desktop'){
						unstash 'linux_installer'
						unstash 'mac_installer'
						unstash 'win_installer'
					}
					sh 'node dist -Pd'
					archiveArtifacts artifacts: 'build/*.deb', onlyIfSuccessful: true
            	}
            }
        }
    }
}