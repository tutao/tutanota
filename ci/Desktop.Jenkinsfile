pipeline {
	environment {
		// on m1 macs, this is a symlink that must be updated. see wiki.
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
		TMPDIR = '/tmp'
		WASM_TOOLS_FILE_PATH = "tuta-wasm-tools.deb"
	}
	options {
		preserveStashes()
	}

	parameters {
		booleanParam(
				name: 'UPLOAD',
				defaultValue: false,
				description: "Upload built clients to Nexus"
		)
		booleanParam(
				name: 'WINDOWS',
				defaultValue: true,
				description: "Build Windows client"
		)
		booleanParam(
				name: 'MAC',
				defaultValue: true,
				description: "Build Mac client"
		)
		booleanParam(
				name: 'LINUX',
				defaultValue: true,
				description: "Build Linux client"
		)
		string(
				name: 'branch',
				defaultValue: "*/master",
				description: "the branch to build the release from"
		)
		string(
				name: 'wasmToolsVersion',
				defaultValue: "0.0.4",
				description: "the version of tuta-wasm-tools to use for building the app (see Nexus)"
		)
	}

	agent {
		label 'master'
	}

	stages {
		stage('Preparation for sign clients and upload to Nexus') {
			agent {
				label 'master'
			}
			steps {
				script {
					def devicePath = sh(script: 'lsusb | grep Nitro | sed -nr \'s|Bus (.*) Device ([^:]*):.*|/dev/bus/usb/\\1/\\2|p\'', returnStdout: true).trim()
					env.DEVICE_PATH = devicePath
				}
			}
		}
		stage('Sign clients and upload to Nexus') {
			when { expression { return params.UPLOAD } }

			environment {
				PATH = "${env.NODE_PATH}:${env.PATH}"
			}
			stages {
				stage('Preparation for sign and upload') {
					steps {
						sh 'npm ci'
					}
				}
				stage('Sign and upload') {
					parallel {
						stage('Windows') {
							when { expression { return params.WINDOWS } }
							steps {
								dir('build') {
									unstash 'win_installer'
									unstash 'win_installer_test'
								}

								withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
									sh '''export HSM_USER_PIN=${PW}; node buildSrc/signDesktopClients.js'''
								}

								uploadWindowsArtifacts()
							}
						} // stage windows
						stage('Mac') {
							when { expression { return params.MAC } }
							steps {
								dir('build') {
									unstash 'mac_installer'
									unstash 'mac_installer_test'
								}

								withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
									sh '''export HSM_USER_PIN=${PW}; node buildSrc/signDesktopClients.js'''
								}

								uploadMacArtifacts()
							}
						} // stage mac
						stage('Linux') {
							when { expression { return params.LINUX } }
							steps {
								dir('build') {
									unstash 'linux_installer'
									unstash 'linux_installer_test'
								}

								withCredentials([string(credentialsId: 'HSM_USER_PIN', variable: 'PW')]) {
									sh '''export HSM_USER_PIN=${PW}; node buildSrc/signDesktopClients.js'''
								}

								uploadLinuxArtifacts()
							}
						} // stage linux
					} // parallel
				} // stage sign and upload
			} // stages
		} // stage sign clients and upload to Nexus
	} // stages
} // pipeline

def uploadWindowsArtifacts() {
	script {
		def artifactsMap = load "ci/jenkins-lib/desktop-artifacts-map.groovy"
		def windowsFiles = artifactsMap.filesPathAndExt().windows

		uploadArtifacts("desktop-win-test", windowsFiles.staging)
		uploadArtifacts("desktop-win", windowsFiles.prod)
	}
}

def uploadMacArtifacts() {
	script {
		def artifactsMap = load "ci/jenkins-lib/desktop-artifacts-map.groovy"
		def macFiles = artifactsMap.filesPathAndExt().mac

		uploadArtifacts("desktop-mac-test", macFiles.staging)
		uploadArtifacts("desktop-mac", macFiles.prod)
	}
}

def uploadLinuxArtifacts() {
	script {
		def artifactsMap = load "ci/jenkins-lib/desktop-artifacts-map.groovy"
		def linuxFiles = artifactsMap.filesPathAndExt().linux

		uploadArtifacts("desktop-linux-test", linuxFiles.staging)
		uploadArtifacts("desktop-linux", linuxFiles.prod)
	}
}

def uploadArtifacts(artifactId, filesPathAndExt) {
	def util = load "ci/jenkins-lib/util.groovy"

	for (String[] file in filesPathAndExt) {
		if (!fileExists(file[0])) {
			currentBuild.result = 'ABORTED'
			error("Unable to find file ${file[0]}")
		}

		util.publishToNexus(
				groupId: "app",
				artifactId: artifactId,
				version: "${VERSION}",
				assetFilePath: "${WORKSPACE}/${file[0]}",
				fileExtension: file[1]
		)
	}
}

def initBuildArea() {
	sh 'printenv PATH'
	sh 'which node'
	sh 'echo $PATH'
	sh 'echo $NODE_MAC_PATH'
	sh 'node -v'
	sh 'npm -v'
	sh 'npm ci'
	sh 'cd src/app-kit/mimimi && node make --release && cd -'
	sh 'cd src/platform-kit/crypto && node make ../../../build && cd -'
	sh 'rm -rf ./build/*'
	sh 'rm -rf ./native-cache/*'
	unstash 'web_base'
}
