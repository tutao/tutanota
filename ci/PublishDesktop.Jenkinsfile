pipeline {
    environment {
        VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node buildSrc/getTutanotaAppVersion.js")
    }

    options {
        preserveStashes()
    }

    parameters {
    	choice(name: 'TARGET', choices: ['staging', 'prod'], description: 'Which artifacts to deploy. Prod also publishes release notes.')
    }

    agent {
        label 'master'
    }

    stages {
		stage('Check Github') {
			steps {
				script {
					def util = load "ci/jenkins-lib/util.groovy"
					util.checkGithub()
				}
			}
		}

		stage('Build deb and publish') {
			agent { label 'linux' }
			environment { PATH = "${env.NODE_PATH}:${env.PATH}" }
			steps {
				sh 'npm ci'
				sh 'rm -rf ./build/*'

				script {
					def util = load "ci/jenkins-lib/util.groovy"
					if (params.TARGET == 'staging') {
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-linux-test",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop-test/tutanota-desktop-test-linux.AppImage",
											   fileExtension: 'AppImage')
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-linux-test",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop-test/latest-linux.yml",
											   fileExtension: 'yml')
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-win-test",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop-test/tutanota-desktop-test-windows.exe",
											   fileExtension: 'exe')
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-win-test",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop-test/latest.yml",
											   fileExtension: 'yml')
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-mac-test",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop-test/tutanota-desktop-test-mac.zip",
											   fileExtension: 'zip')
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-mac-test",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop-test/tutanota-desktop-test-mac.dmg",
											   fileExtension: 'dmg')
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-mac-test",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop-test/latest-mac.yml",
											   fileExtension: 'yml')
					} else {
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-linux",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop/tutanota-desktop-linux.AppImage",
											   fileExtension: 'AppImage')
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-linux",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop/latest-linux.yml",
											   fileExtension: 'yml')
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-win",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop/tutanota-desktop-windows.exe",
											   fileExtension: 'exe')
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-win",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop/latest.yml",
											   fileExtension: 'yml')
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-mac",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop/tutanota-desktop-mac.zip",
											   fileExtension: 'zip')
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-mac",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop/tutanota-desktop-mac.dmg",
											   fileExtension: 'dmg')
						util.downloadFromNexus(groupId: "app",
											   artifactId: "desktop-mac",
											   version: VERSION,
											   outFile: "${WORKSPACE}/build/desktop/latest-mac.yml",
											   fileExtension: 'yml')
					} // if else
				} // script

				sh 'node buildSrc/buildDeb.js desktop'

				script {
					if (params.TARGET == 'prod') {
						sh "cp tutanota_desktop_${VERSION}_amd64.deb /opt/repository/tutanota-desktop"
						sh "cp -f ./build/desktop/tutanota-desktop-linux.AppImage /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage"
						sh "chmod o+r /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage"
					} else {
						sh "cp tutanota_desktop_test_${VERSION}_amd64.deb /opt/repository/tutanota-desktop-test"
					}
				}

				script {
					if (params.TARGET == 'prod') {
						createGithubRelease()
					}
				}
			} // steps
		} // stage build deb & publish
    } // stages
} // pipeline

void createGithubRelease() {
	def desktopLinux = "build/desktop/tutanota-desktop-linux.AppImage"
	def desktopWin = "build/desktop/tutanota-desktop-win.exe"
	def desktopMac = "build/desktop/tutanota-desktop-mac.dmg"

	writeFile file: "notes.txt", text: params.releaseNotes
	catchError(stageResult: 'UNSTABLE', buildResult: 'SUCCESS', message: 'Failed to create github release page for desktop') {
		withCredentials([string(credentialsId: 'github-access-token', variable: 'GITHUB_TOKEN')]) {
			sh """node buildSrc/createReleaseDraft.js --name '${VERSION} (Desktop)' \
												   --tag 'tutanota-desktop-release-${VERSION}' \
												   --uploadFile '${WORKSPACE}/${desktopLinux}' \
												   --uploadFile '${WORKSPACE}/${desktopWin}' \
												   --uploadFile '${WORKSPACE}/${desktopMac}' \
												   --notes notes.txt"""
		} // withCredentials
	} // catchError
	sh "rm notes.txt"
}
