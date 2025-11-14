pipeline {
    environment {
    	// on m1 macs, this is a symlink that must be updated. see wiki.
        VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
        TMPDIR ='/tmp'
        WASM_TOOLS_FILE_PATH="tuta-wasm-tools.deb"
    }

	parameters {
	    booleanParam(
	        name: 'DEB',
	        defaultValue: true,
	        description: "build deb package"
	    )
        booleanParam(
            name: 'GITHUB_RELEASE',
            defaultValue: false,
            description: "publish release notes draft"
        )
		persistentText(
			name: 'releaseNotes',
			defaultValue: '',
			description: "release notes for this build"
		)
        string(
            name: 'branch',
            defaultValue: "*/master",
            description: "the branch to build the release from."
        )
	}

	agent {
        label 'master'
	}

    stages {
    	stage("Checking params") {
			steps {
				script{
					if(!params.DEB && !params.GITHUB_RELEASE) {
						currentBuild.result = 'ABORTED'
						error('No tasks were selected.')
					}
				}
				echo "Params OKAY"
			}
    	}
        stage('Check Github') {
            steps {
                script {
                    def util = load "ci/jenkins-lib/util.groovy"
                    util.checkGithub()
                }
            }
        }
        stage('Setup') {
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
		stage('download tuta wasm tools') {
			steps {
				script {
					def util = load "ci/jenkins-lib/util.groovy"
					util.downloadFromNexus(groupId: "lib",
										   artifactId: "tuta-wasm-tools",
										   version: params.wasmToolsVersion,
										   fileExtension: 'deb',
										   outFile: "${env.WORKSPACE}/ci/containers/${env.WASM_TOOLS_FILE_PATH}")
				}
			}
		} // stage download tuta wasm tools
		stage ('Build and publish') {
            agent {
                dockerfile {
                    filename 'linux-build.dockerfile'
                    label 'master'
                    dir 'ci/containers'
                    additionalBuildArgs '--format docker'
                    args "--network host -v /run:/run:rw,z -v /opt/repository:/opt/repository:rw,z --device=${env.DEVICE_PATH}"
					reuseNode true
                } // docker
            } // agent
	        stages {
                stage('Build deb') {
                    when { expression { return params.DEB } }
                    steps {
						downloadWindowArtifacts()
						downloadMacArtifacts()
						downloadLinuxArtifacts()

                        sh 'node -v'
                        sh 'npm -v'
                        sh 'npm ci'

                        sh 'node buildSrc/publish.js desktop'
                    } // steps
                } // stage build deb
                stage('Publish release notes draft') {
                    when { expression { return params.GITHUB_RELEASE } }
                    steps {
                        script {
                            def desktopLinux = "build/desktop/tutanota-desktop-linux.AppImage"
                            def desktopWin = "build/desktop/tutanota-desktop-win.exe"
                            def desktopMac = "build/desktop/tutanota-desktop-mac.dmg"

                            def util = load "ci/jenkins-lib/util.groovy"

                            util.downloadFromNexus(	groupId: "app",
                                                    artifactId: "desktop-win",
                                                    version: "${VERSION}",
                                                    outFile: "${WORKSPACE}/${desktopWin}",
                                                    fileExtension: 'exe')
                            if (!fileExists("${desktopWin}")) {
                                currentBuild.result = 'ABORTED'
                                error("Unable to find file ${desktopWin}")
                            }

                            util.downloadFromNexus(	groupId: "app",
                                                    artifactId: "desktop-mac",
                                                    version: "${VERSION}",
                                                    outFile: "${WORKSPACE}/${desktopMac}",
                                                    fileExtension: 'dmg')
                            if (!fileExists("${desktopMac}")) {
                                currentBuild.result = 'ABORTED'
                                error("Unable to find file ${desktopMac}")
                            }

                            util.downloadFromNexus(	groupId: "app",
                                                    artifactId: "desktop-linux",
                                                    version: "${VERSION}",
                                                    outFile: "${WORKSPACE}/${desktopLinux}",
                                                    fileExtension: 'AppImage')
                            if (!fileExists("${desktopLinux}")) {
                                currentBuild.result = 'ABORTED'
                                error("Unable to find file ${desktopLinux}")
                            }

                            sh 'npm ci'

                            writeFile file: "notes.txt", text: params.releaseNotes
							withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
								sh """node buildSrc/createReleaseDraft.js --name '${VERSION} (Desktop)' \
																	   --tag 'tutanota-desktop-release-${VERSION}' \
																	   --uploadFile '${WORKSPACE}/${desktopLinux}' \
																	   --uploadFile '${WORKSPACE}/${desktopWin}' \
																	   --uploadFile '${WORKSPACE}/${desktopMac}' \
																	   --notes notes.txt"""
							} // withCredentials
                            sh "rm notes.txt"
                        } // script release draft
                    } // steps
                } // stage publish release notes draft
	        } // stages
		} // stage build and publish
	} // stages
} // pipeline

def downloadWindowArtifacts() {
    script {
   		def artifactsMap = load "ci/jenkins-lib/desktop-artifacts-map.groovy"
   		def windowsFiles = artifactsMap.filesPathAndExt().windows

        downloadArtifacts("desktop-win-test", windowsFiles.staging)
        downloadArtifacts("desktop-win", windowsFiles.prod)
    }
}

def downloadMacArtifacts() {
    script {
   		def artifactsMap = load "ci/jenkins-lib/desktop-artifacts-map.groovy"
   		def macFiles = artifactsMap.filesPathAndExt().mac

        downloadArtifacts("desktop-mac-test", macFiles.staging)
        downloadArtifacts("desktop-mac", macFiles.prod)
    }
}

def downloadLinuxArtifacts() {
    script {
   		def artifactsMap = load "ci/jenkins-lib/desktop-artifacts-map.groovy"
   		def linuxFiles = artifactsMap.filesPathAndExt().linux

        downloadArtifacts("desktop-linux-test", linuxFiles.staging)
        downloadArtifacts("desktop-linux", linuxFiles.prod)
    }
}

def downloadArtifacts(artifactId, filesPathAndExt) {
    def util = load "ci/jenkins-lib/util.groovy"

    for (String[] file in filesPathAndExt) {
        util.downloadFromNexus(
                groupId: "app",
                artifactId: artifactId,
                version: "${VERSION}",
                outFile: "${WORKSPACE}/${file[0]}",
                fileExtension: file[1]
        )

        if (!fileExists(file[0])) {
			currentBuild.result = 'ABORTED'
            error("Unable to find file ${file[0]}")
        }
    }
}