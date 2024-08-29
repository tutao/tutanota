pipeline {
	// This pipeline will re-create certificates and provisioning profiles as necessary for iOS app to be built.
	// It uses fastlane's match which stores certificates and provisioning profiles in the git repo in the encrypted
	// form.
	//
	// If a certificate is expired and you wish to run this job, make sure to do few things prior to that:
	// 1. Delete outdated certificates and related provisioning profiles from the git repo (see `MATCH_GIT_URL`) (required)
	// 2. Delete outdated certificates and related provisioning profiles from developer.apple.com (recommended)

	environment {
		LC_ALL = "en_US.UTF-8"
		LANG = "en_US.UTF-8"
	}
	agent {
		label 'mac'
	}

	parameters {
		booleanParam(
			name: 'prod',
			defaultValue: false,
			description: "Renew prod/release certificates"
		)
		booleanParam(
			name: 'staging',
			defaultValue: false,
			description: "Renew staging/test certificates"
		)
	}

	stages {
		stage("Renew prod certs") {
			agent {
				label 'mac'
			}
			when {
				expression { params.prod }
			}
			environment {
				LC_ALL = "en_US.UTF-8"
				LANG = "en_US.UTF-8"
				MATCH_GIT_URL = "git@gitlab:/tuta/apple-certificates.git"
			}
			steps {
				// Prepare the fastlane Appfile which defines the required ids for the ios app build.
				script {
					def app_identifier = 'de.tutao.calendar'
					def appfile = './app-ios/fastlane/Appfile'

					sh "echo \"app_identifier('${app_identifier}')\" > ${appfile}"

					withCredentials([string(credentialsId: 'apple-id', variable: 'apple_id')]) {
						sh "echo \"apple_id('${apple_id}')\" >> ${appfile}"
					}
					withCredentials([string(credentialsId: 'itc-team-id', variable: 'itc_team_id')]) {
						sh "echo \"itc_team_id('${itc_team_id}')\" >> ${appfile}"
					}
					withCredentials([string(credentialsId: 'team-id', variable: 'team_id')]) {
						sh "echo \"team_id('${team_id}')\" >> ${appfile}"
					}
				}

				sh "pwd"
				sh "echo $PATH"

				withCredentials([
						file(credentialsId: 'appstore-api-key-json', variable: "API_KEY_JSON_FILE_PATH"),
						string(credentialsId: 'match-password', variable: 'MATCH_PASSWORD'),
						string(credentialsId: 'team-id', variable: 'FASTLANE_TEAM_ID'),
 						sshUserPrivateKey(credentialsId: 'jenkins', keyFileVariable: 'MATCH_GIT_PRIVATE_KEY'),
						string(credentialsId: 'fastlane-keychain-password', variable: 'FASTLANE_KEYCHAIN_PASSWORD')
				]) {
					dir('app-ios') {
						sh "security unlock-keychain -p ${FASTLANE_KEYCHAIN_PASSWORD}"

						// Set git ssh command to avoid ssh prompting to confirm an unknown host
						// (since we don't have console access we can't confirm and it gets stuck)
						//
						// Be careful with fastlane! It likes to pull in random env variables and override parameters
						// that we explicitly specify. Some of the env variables we use explicitly in app-ios/Fastfile,
						// some are used implicitly by fastlane.
						sh "GIT_SSH_COMMAND=\"ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no\" fastlane renew_calendar_adhoc_cert_prod"
						sh "GIT_SSH_COMMAND=\"ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no\" fastlane renew_calendar_appstore_cert_prod"
					}
				}
			}
		}

		stage("Renew staging certs") {
			agent {
				label 'mac'
			}
			when {
				expression { params.staging }
			}
			environment {
				LC_ALL = "en_US.UTF-8"
				LANG = "en_US.UTF-8"
				MATCH_GIT_URL = "git@gitlab:/tuta/apple-certificates.git"
			}
			steps {
				// Prepare the fastlane Appfile which defines the required ids for the ios app build.
				script {
					def app_identifier = 'de.tutao.calendar.test'
					def appfile = './app-ios/fastlane/Appfile'

					sh "echo \"app_identifier('${app_identifier}')\" > ${appfile}"

					withCredentials([string(credentialsId: 'apple-id', variable: 'apple_id')]) {
						sh "echo \"apple_id('${apple_id}')\" >> ${appfile}"
					}
					withCredentials([string(credentialsId: 'itc-team-id', variable: 'itc_team_id')]) {
						sh "echo \"itc_team_id('${itc_team_id}')\" >> ${appfile}"
					}
					withCredentials([string(credentialsId: 'team-id', variable: 'team_id')]) {
						sh "echo \"team_id('${team_id}')\" >> ${appfile}"
					}
				}

				sh "pwd"
				sh "echo $PATH"

				withCredentials([
						file(credentialsId: 'appstore-api-key-json', variable: "API_KEY_JSON_FILE_PATH"),
						string(credentialsId: 'match-password', variable: 'MATCH_PASSWORD'),
						string(credentialsId: 'team-id', variable: 'FASTLANE_TEAM_ID'),
 						sshUserPrivateKey(credentialsId: 'jenkins', keyFileVariable: 'MATCH_GIT_PRIVATE_KEY'),
						string(credentialsId: 'fastlane-keychain-password', variable: 'FASTLANE_KEYCHAIN_PASSWORD')
				]) {
					dir('app-ios') {
						sh "security unlock-keychain -p ${FASTLANE_KEYCHAIN_PASSWORD}"

						// Set git ssh command to avoid ssh prompting to confirm an unknown host
						// (since we don't have console access we can't confirm and it gets stuck)
						//
						// Be careful with fastlane! It likes to pull in random env variables and override parameters
						// that we explicitly specify. Some of the env variables we use explicitly in app-ios/Fastfile,
						// some are used implicitly by fastlane.
						sh "GIT_SSH_COMMAND=\"ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no\" fastlane renew_calendar_adhoc_cert_staging"
						sh "GIT_SSH_COMMAND=\"ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no\" fastlane renew_calendar_appstore_cert_staging"
					}
				}
			}
		}
	}
}