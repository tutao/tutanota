// would have preferred to do all client builds and the release note input completely in parallel,
// but that would require nested parallel blocks which is not supported in declarative pipelines.
def releaseNotes

pipeline {
	environment {
		PATH="${env.NODE_PATH}:${env.PATH}"
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
	}

    parameters {
    	choice(
    		name: 'target',
    		choices: ['dryRun', 'buildAndPublishToStaging', 'publishToStaging', 'publishToProd'],
    		description: "dryRun: build no-op (only the prod version is built for mobile)<br>" +
				"buildAndPublishToStaging: builds staging and prod, uploads both to Nexus, and publishes to staging<br>" +
				"publishToStaging: downloads from Nexus and publishes to staging<br>" +
				"publishToProd: downloads from Nexus, publishes to prod, and generates release notes"
    	)
		persistentString(
			name: 'milestone',
			defaultValue: '',
			description: 'Which github milestone to reference for generating release notes. leave empty to use version number'
		)
		booleanParam(
			name: "dictionaries",
			defaultValue: false,
			description: "download, update and package the current desktop dictionaries"
		)
        booleanParam(
            name: 'web',
            defaultValue: true,
            description: "Build the web app and packages (required to build the other clients if the version changed)"
        )
        booleanParam(
            name: 'ios',
            defaultValue: true,
            description: "Build the ios app"
        )
        booleanParam(
            name: 'android',
            defaultValue: true,
            description: "Build the android app"
        )
        booleanParam(
            name: 'desktop',
            defaultValue: true,
            description: "Build the desktop app"
        )
        string(
            name: 'branch',
            defaultValue: "*/master",
            description: "the branch to build the release from, will be propagated to the sub-jobs."
        )
    }

    agent {
        label 'master'
    }

    stages {
		stage("Prepare Release Notes") {
			agent { label 'master' }
			// Release Notes are only generating when publishing to Prod
			when { expression { return params.target.equals("publishToProd") && (params.web || params.android || params.ios || params.desktop) } }
			steps {
				sh "npm ci"
				script { // create release notes
					def version = sh(returnStdout: true, script: "${NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
					def web = params.web ? pregenerateReleaseNotes("web") : null
					def android = params.android ? pregenerateReleaseNotes("android") : null
					def ios = params.ios ? pregenerateReleaseNotes("ios") : null
					def desktop = params.desktop ? pregenerateReleaseNotes("desktop") : null

					releaseNotes = reviewReleaseNotes(web, android, desktop, ios, version)
					echo("${releaseNotes}")
				} // script
			} // steps
		} // stage prepare release notes
		stage("Clients") {
			environment {
				BUILD = "${params.target.equals("dryRun") || params.target.equals("buildAndPublishToStaging")}"
			}
			// Web/Desktop and Mobile are ran sequentially because we ran into resource allocation issues
			stages {
				stage("Web and Desktop") {
					parallel {
						stage("Web App & Packages") {
							when { expression { return params.web } }
							agent { label 'master'}
							stages {
								stage("Build Web") {
									when { expression { return BUILD.toBoolean() } }
									steps {
										build job: 'tutanota-3-webapp', parameters: [
											booleanParam(name: "UPLOAD", value: params.target.equals("buildAndPublishToStaging")),
											string(name: "branch", value: params.branch)
										]
									} // steps
								} // stage build
								stage("Publish Web") {
									when { expression { return !params.target.equals("dryRun") } }
									steps {
										build job: 'tutanota-3-webapp-publish', parameters: params.target.equals("publishToProd") ? [
											booleanParam(name: 'DEB', value: true),
											booleanParam(name: 'PUBLISH_NPM_MODULES', value: false),
											booleanParam(name: 'GITHUB_RELEASE', value: true),
											text(name: "releaseNotes", value: releaseNotes.web),
											string(name: "branch", value: params.branch)
										] : [
											booleanParam(name: 'DEB', value: true),
											booleanParam(name: 'PUBLISH_NPM_MODULES', value: params.target.equals("buildAndPublishToStaging")),
											booleanParam(name: 'GITHUB_RELEASE', value: false),
											string(name: "branch", value: params.branch)
										]
									} // steps
								} // stage publish
							} // stages
						} // stage web app & packages

						stage("Desktop Dicts") {
							when { expression { return params.dictionaries } }
							steps {
								script {
									build job: 'tutanota-3-desktop-dictionaries', parameters: [
										booleanParam(name: "RELEASE", value: !params.target.equals("dryRun")),
										string(name: "branch", value: params.branch)
									]
								} // script
							} // steps
						} // stage desktop dicts

						stage("Desktop Client") {
							when { expression { return params.desktop } }
							stages {
								stage("Build Desktop") {
									when { expression { return BUILD.toBoolean() } }
									steps {
										script {
											build job: 'tutanota-3-desktop', parameters: [
												booleanParam(name: "UPLOAD", value: params.target.equals("buildAndPublishToStaging")),
												booleanParam(name: "WINDOWS", value: true),
												booleanParam(name: "MAC", value: true),
												booleanParam(name: "LINUX", value: true),
											    string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage build
								stage("Publish Desktop") {
									when { expression { return !params.target.equals("dryRun") } }
									steps {
										script {
											build job: 'tutanota-3-desktop-publish', parameters: params.target.equals("publishToProd") ? [
												booleanParam(name: "DEB", value: true),
												booleanParam(name: "GITHUB_RELEASE", value: true),
												text(name: "releaseNotes", value: releaseNotes.desktop),
											    string(name: "branch", value: params.branch)
											] : [
												booleanParam(name: "DEB", value: true),
												booleanParam(name: "GITHUB_RELEASE", value: false),
												string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage publish
							} // stages
						} // stage desktop client
					} // parallel
				} // stage web and desktop

				stage("Mobile") {
					parallel {
						stage("iOS Client") {
							when { expression { return params.ios } }
							stages {
								stage("Build iOS") {
									when { expression { return BUILD.toBoolean() } }
									steps {
										script {
											build job: 'tutanota-3-ios', parameters: [
												booleanParam(name: "UPLOAD", value: params.target.equals("buildAndPublishToStaging")),
												booleanParam(name: "STAGING", value: params.target.equals("buildAndPublishToStaging")),
												booleanParam(name: "PROD", value: true),
											    string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage build
								stage("Publish iOS") {
									when { expression { return !params.target.equals("dryRun") } }
									steps {
										script {
											 build job: 'tutanota-3-ios-publish', parameters: params.target.equals("publishToProd") ? [
												 booleanParam(name: "STAGING", value: false),
												 booleanParam(name: "PROD", value: true),
												 booleanParam(name: "APP_STORE_NOTES", value: true),
												 booleanParam(name: "GITHUB_RELEASE", value: true),
												 text(name: "releaseNotes", value: releaseNotes.ios),
											     string(name: "branch", value: params.branch)
											 ] : [
												 booleanParam(name: "STAGING", value: true),
												 booleanParam(name: "PROD", value: false),
												 booleanParam(name: "APP_STORE_NOTES", value: false),
												 booleanParam(name: "GITHUB_RELEASE", value: false),
    											 string(name: "branch", value: params.branch)
											 ]
										} // script
									} // steps
								} // stage publish
							} // stages
						} // stage ios client

						stage("Android Client") {
							when { expression { return params.android } }
							stages {
								stage("Build Android") {
									when { expression { return BUILD.toBoolean() } }
									steps {
										script {
											build job: 'tutanota-3-android', parameters: [
												booleanParam(name: "UPLOAD", value: params.target.equals("buildAndPublishToStaging")),
												booleanParam(name: "STAGING", value: params.target.equals("buildAndPublishToStaging")),
												booleanParam(name: "PROD", value: true),
											    string(name: "branch", value: params.branch)
											]
										} // script
									} // steps
								} // stage build
								stage("Publish Android") {
									when { expression { return !params.target.equals("dryRun") } }
									steps {
										script {
											 build job: 'tutanota-3-android-publish', parameters: params.target.equals("publishToProd") ? [
												 booleanParam(name: "STAGING", value: false),
												 booleanParam(name: "PROD", value: true),
												 booleanParam(name: "GITHUB_RELEASE", value: true),
												 text(name: "releaseNotes", value: releaseNotes.android),
											     string(name: "branch", value: params.branch)
											 ] : [
												 booleanParam(name: "STAGING", value: true),
												 booleanParam(name: "PROD", value: false),
												 booleanParam(name: "GITHUB_RELEASE", value: false),
											     string(name: "branch", value: params.branch)
											 ]
										} // script
									} // steps
								} // stage publish
							} // stages
						} // stage android client
					} // parallel
				} // stage mobile
			} // stages
		} // stage other clients
    } // stages
} // pipeline


/**
platform must be one of the strings ios, android, desktop, web
*/
def pregenerateReleaseNotes(platform) {
		def milestone = params.milestone.trim().equals("") ? VERSION : params.milestone
        return sh(returnStdout: true, script: """node buildSrc/releaseNotes.js --platform ${platform} --milestone ${milestone} """)
}

/**
 all parameters are nullable strings.
*/
def reviewReleaseNotes(web, android, desktop, ios, version) {
	// only display input fields for the clients we're actually building.
    def parameters = [
         web ? text(defaultValue: web, description: "Web App:", name: "web") : null,
         android ? text(defaultValue: android, description: "Android App:", name: "android") : null,
         desktop ? text(defaultValue: desktop, description: 'Desktop Client:', name: 'desktop') : null,
         ios ? text(defaultValue: ios, description: 'Ios App:', name: 'ios') : null,
         booleanParam(defaultValue: true, description: "dummy param so we always get a dict back", name: "dummy"),
     ].findAll { it != null }
    // Get the input
    // https://www.jenkins.io/doc/pipeline/steps/pipeline-input-step/
    return input(id: 'releaseNotesInput', message: 'Release Notes', parameters: parameters)
}