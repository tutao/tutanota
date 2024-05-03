def publishToNexus(Map params) {
	withCredentials([usernamePassword(credentialsId: 'nexus-publish', usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')]) {
		sh  "curl --silent --show-error --fail " +
			"-u '${NEXUS_USERNAME}':'${NEXUS_PASSWORD}' " +
			"-X POST '${env.NEXUS_URL}/service/rest/v1/components?repository=releases' " +
			"-F maven2.groupId=${params.groupId} " +
			"-F maven2.artifactId=${params.artifactId} " +
			"-F maven2.version=${params.version} " +
			"-F maven2.generate-pom=true " +
			"-F maven2.asset1=@${params.assetFilePath} " +
			"-F maven2.asset1.extension=${params.fileExtension}"
	}
}

def publishToNexusMultiple(Map params) {
	def assetParams = []
	for (int i = 0; i < params.assets.size(); i++) {
		def asset = params.assets[i]
		assetParams.add("-F maven2.asset${i + 1}=@${asset.path}")
		assetParams.add("-F maven2.asset${i + 1}.extension=${asset.fileExtension}")
		if (asset.classifier) {
			assetParams.add("-F maven2.asset${i + 1}.classifier=${asset.classifier}")
		}
	}
	withCredentials([usernamePassword(credentialsId: 'nexus-publish', usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')]) {
		sh  "curl --silent --show-error --fail " +
			"-u '${NEXUS_USERNAME}':'${NEXUS_PASSWORD}' " +
			"-X POST '${env.NEXUS_URL}/service/rest/v1/components?repository=releases' " +
			"-F maven2.groupId=${params.groupId} " +
			"-F maven2.artifactId=${params.artifactId} " +
			"-F maven2.version=${params.version} " +
			"-F maven2.generate-pom=true " +
			assetParams.join(" ")
	}
}

def downloadFromNexus(Map params) {
	withCredentials([usernamePassword(credentialsId: 'nexus-publish', usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')]) {
		sh "mkdir -p \$(dirname ${params.outFile})"
		sh  "curl -o ${params.outFile} --silent --show-error --fail " +
			"-u '${NEXUS_USERNAME}':'${NEXUS_PASSWORD}' " +
			"'${env.NEXUS_URL}/repository/releases/${params.groupId}/${params.artifactId}/${params.version}/${params.artifactId}-${params.version}.${params.fileExtension}' "
	}
}

def checkGithub() {
	// this fails if the public repository master's tip is not in our master.
	// we may have more commits, though.
	sh '''
		# commit hash of the public repositories master
		gh=$(git ls-remote git@github.com:tutao/tutanota.git refs/heads/master | awk '{print $1}')
		# exit with 0 if $gh is an ancestor of the current HEAD, 1 otherwise.
		git merge-base --is-ancestor $gh HEAD
	'''
}

void runFastlane(String app_identifier, String lane) {
	// Prepare the fastlane Appfile which defines the required ids for the ios app build.
	script {
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

	withCredentials([
			file(credentialsId: 'appstore-api-key-json', variable: "API_KEY_JSON_FILE_PATH"),
			string(credentialsId: 'match-password', variable: 'MATCH_PASSWORD'),
			string(credentialsId: 'team-id', variable: 'FASTLANE_TEAM_ID'),
			sshUserPrivateKey(credentialsId: 'jenkins', keyFileVariable: 'MATCH_GIT_PRIVATE_KEY'),
			string(credentialsId: 'fastlane-keychain-password', variable: 'FASTLANE_KEYCHAIN_PASSWORD')
	]) {
		dir('app-ios') {
			sh "security unlock-keychain -p ${FASTLANE_KEYCHAIN_PASSWORD}"

			script {
				// Set git ssh command to avoid ssh prompting to confirm an unknown host
				// (since we don't have console access we can't confirm and it gets stuck)
				sh "GIT_SSH_COMMAND=\"ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no\" fastlane ${lane}"
			}
		}
	}
}

// required in order to be able to use "load" to include this script in a jenkins pipleline
return this