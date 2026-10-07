pipeline {
	environment {
		PATH = "${env.NODE_PATH}:${env.PATH}"
	}

	parameters {
        booleanParam(
                name: 'dryRun',
				defaultValue: true,
                description: "set to true to build and push but don't publish or merge"
        )
        string(
                name: 'branch',
                defaultValue: "*/nightly-webapp",
                description: "the branch to build from"
        )
	}

	agent {
		label 'master'
	}
    stages {
        stage("update-translations-bump-version") {
            steps {
                script {
                    def jobResult = build job: 'update-translations-bump-version', parameters: [
                        string(name: "TARGET_TUTANOTA_REPO", value: "git@github.com:tutao/private-issues.git"),
                        booleanParam(name: "OPEN_PULL_REQUEST", value: false)
                    ]
                    env.nightlyBranch = jobResult.getBuildVariables().nightlyBranch
                }
            }
        } // run update-translations-bump-version
        stage("Build Web") {
            steps {
                build job: 'tutanota-3-webapp', parameters: [
                    booleanParam(name: "UPLOAD", value: !params.dryRun),
                    string(name: "branch", value: env.nightlyBranch)
                ]
            } // steps
        } // stage build
        stage("Publish Web") {
            when {
                expression { !params.dryRun }
            }
            steps {
                build job: 'tutanota-3-webapp-publish', parameters: [
                        booleanParam(name: 'DEB', value: true),
                        booleanParam(name: 'PUBLISH_NPM_MODULES', value: false),
                        booleanParam(name: 'GITHUB_RELEASE', value: false),
                        string(name: "branch", value: env.nightlyBranch)
                ]
            } // steps
        } // stage publish web
        stage("fetch nightly branch") {
            steps {
                sh "git fetch"
                sh "git switch ${env.nightlyBranch}"
                sh "git switch master"
            }
        } // checkout nightly branch
        stage("merge & push web master") {
            when {
                expression { !params.dryRun }
            }
            steps {
                sh "git merge --ff-only ${env.nightlyBranch}"
                sh "git push origin master"
            } // steps
        } // stage merge
        stage("cleanup") {
            steps {
                sh "git branch -D ${env.nightlyBranch}"
                sh "git push origin --delete ${env.nightlyBranch}"
            }
        }
	} // stages
} // pipeline