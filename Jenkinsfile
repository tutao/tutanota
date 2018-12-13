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
						    export JENKINS=TRUE;
						    export WIN_CSC_KEY_PASSWORD=${PW};
						    export WIN_CSC_LINK="/opt/etc/comodo-codesign.p12";
						    node dist -pw ''' + (params.RELEASE ? "" : "prod")
						}
						dir('build') {
							stash includes: 'desktop*/*', name:'win_installer'
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
						withCredentials([string(credentialsId: 'WIN_CSC_KEY_PASSWORD', variable: 'PW')]){
							sh '''
							export JENKINS=TRUE;
							export MAC_CSC_KEY_PASSWORD=${PW};
							export MAC_CSC_LINK="/opt/etc/comodo-codesign.p12";
							node dist -pm ''' + (params.RELEASE ? "" : "prod")
						}
						dir('build') {
							stash includes: 'desktop*/*', name:'mac_installer'
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
						withCredentials([string(credentialsId: 'WIN_CSC_KEY_PASSWORD', variable: 'PW')]){
							sh '''
							export JENKINS=TRUE;
							export LINUX_CSC_KEY_PASSWORD=${PW};
							export LINUX_CSC_LINK="/opt/etc/comodo-codesign.p12";
							node dist -pl ''' + (params.RELEASE ? "" : "prod")
						}
						dir('build') {
							stash includes: 'desktop*/*', name:'linux_installer'
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
            	sh 'rm -f /opt/desktop-snapshot/*'
            	dir('/opt') {
					unstash 'linux_installer'
					unstash 'win_installer'
					unstash 'mac_installer'
            	}
				sh '''
					targetAppImage=`ls /opt/desktop-snapshot/tutanota-desktop*.AppImage`;
					targetAppImageSig=`ls /opt/desktop-snapshot/tutanota-desktop*linux-sig.bin`;
					ln -s "${targetAppImage}" /opt/desktop-snapshot/tutanota-desktop-snapshot-linux.AppImage;
					ln -s "${targetAppImageSig}" /opt/desktop-snapshot/tutanota-desktop-snapshot-linux-sig.bin;

					targetExe=`ls /opt/desktop-snapshot/tutanota-desktop*.exe`;
					targetExeSig=`ls /opt/desktop-snapshot/tutanota-desktop*win-sig.bin`;
					ln -s "${targetExe}" /opt/desktop-snapshot/tutanota-desktop-snapshot-win.exe;
					ln -s "${targetExeSig}" /opt/desktop-snapshot/tutanota-desktop-snapshot-win-sig.bin;

					targetZip=`ls /opt/desktop-snapshot/tutanota-desktop*.zip`;
					targetZipSig=`ls /opt/desktop-snapshot/tutanota-desktop*mac-sig.bin`;
					ln -s "${targetZip}" /opt/desktop-snapshot/tutanota-desktop-snapshot-mac.zip;
					ln -s "${targetZipSig}" /opt/desktop-snapshot/tutanota-desktop-snapshot-mac-sig.bin;
				'''
            }
        }
    }
}