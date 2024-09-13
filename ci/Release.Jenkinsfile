// would have preferred to do all client builds and the release note input completely in parallel,
// but that would require nested parallel blocks which is not supported in declarative pipelines.
def releaseNotes

pipeline {
	environment {
		PATH="${env.NODE_PATH}:${env.PATH}"
		VERSION = sh(returnStdout: true, script: "${env.NODE_PATH}/node -p -e \"require('./package.json').version\" | tr -d \"\n\"")
	}

    parameters {
        booleanParam(
            name: 'dryRun',
            defaultValue: true,
            description: "builds the clients and generates release notes if requested, but doesn't modify github or upload any artifacts."
        )
        booleanParam(
            name: 'generateReleaseNotes',
            defaultValue: false,
            description: "check if the release notes should be updated in the downstream jobs, uncheck if last runs release notes should be reused."
        )
		persistentString(
			name: 'milestone',
			defaultValue: '',
			description: 'Which github milestone to reference for generating release notes. leave empty to use version number.'
		)
		booleanParam(
			name: "dictionaries",
			defaultValue: false,
			description: "download, update and package the current desktop dictionaries"
		)
        booleanParam(
            name: 'web',
            defaultValue: true,
            description: "Build the web app and packages (required to build the other clients if the version changed)."
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
    }

    agent {
        label 'master'
    }

    stages {
		stage("Prepare Release Notes") {
			agent { label 'master' }
			when { expression { return params.generateReleaseNotes && (params.web || params.android || params.ios || params.desktop) } }
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
				} // script release notes
			} // steps
		} // stage prepare release notes
		stage("web app & packages") {
			when { expression { return params.web } }
			agent { label 'master'}
			steps {
				build job: 'tutanota-3-webapp', parameters: params.generateReleaseNotes ? [
					booleanParam(name: 'RELEASE', value: !params.dryRun),
					text(name: "releaseNotes", value: releaseNotes.web),
				] : [ booleanParam(name: "RELEASE", value: !params.dryRun) ]
			} // steps
		} // stage web app & packages
		stage("other clients") {
			parallel {
				stage("Desktop Dicts") {
					when { expression { return params.dictionaries } }
					steps {
						script {
							build job: 'tutanota-3-desktop-dictionaries', parameters: [booleanParam(name: "RELEASE", value: !params.dryRun)]
						} // script
					}
				}
				stage("Desktop Client") {
					when { expression { return params.desktop } }
					steps {
						script {
							build job: 'tutanota-3-desktop', parameters: params.generateReleaseNotes ? [
								booleanParam(name: "RELEASE", value: !params.dryRun),
								text(name: "releaseNotes", value: releaseNotes.desktop),
							] : [
								booleanParam(name: "RELEASE", value: !params.dryRun),
							]
						} // script
					} // steps
				} // stage desktop client
				stage("iOS Client") {
					when { expression { return params.ios } }
					steps {
						script {
							build job: 'tutanota-3-ios', parameters: params.generateReleaseNotes ? [
								booleanParam(name: "RELEASE", value: !params.dryRun),
								text(name: "releaseNotes", value: releaseNotes.ios),
								booleanParam(name: "STAGING", value: true),
								booleanParam(name: "PROD", value: true),
							] : [
								booleanParam(name: "RELEASE", value: !params.dryRun),
								booleanParam(name: "STAGING", value: true),
								booleanParam(name: "PROD", value: true),
							]
						} // script
					} // steps
				} // stage desktop client
				stage("Android Client") {
					when { expression { return params.android } }
					steps {
						script {
							build job: 'tutanota-3-android', parameters: params.generateReleaseNotes	? [
								booleanParam(name: "RELEASE", value: !params.dryRun),
								text(name: "releaseNotes", value: releaseNotes.android),
							] : [
								booleanParam(name: "RELEASE", value: !params.dryRun),
							]
						} // script
					} // steps
				} // stage desktop client
			} // parallel clients
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