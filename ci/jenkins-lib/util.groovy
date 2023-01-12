def publishToNexus(Map params) {
	withCredentials([usernamePassword(credentialsId: 'nexus-publish', usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')]) {
		sh  "curl --silent --show-error --fail " +
			"-u '${NEXUS_USERNAME}':'${NEXUS_PASSWORD}' " +
			// IP points to http://next.tutao.de/nexus, but we can't use the hostname due to reverse proxy configuration
			"-X POST 'http://[fd:aa::70]:8081/nexus/service/rest/v1/components?repository=releases' " +
			"-F maven2.groupId=${params.groupId} " +
			"-F maven2.artifactId=${params.artifactId} " +
			"-F maven2.version=${params.version} " +
			"-F maven2.generate-pom=true " +
			"-F maven2.asset1=@${params.assetFilePath} " +
			"-F maven2.asset1.extension=${params.fileExtension}"
	}
}

def downloadFromNexus(Map params) {
	withCredentials([usernamePassword(credentialsId: 'nexus-publish', usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')]) {
		sh "mkdir -p \$(dirname ${params.outFile})"
		sh  "curl -o ${params.outFile} --silent --show-error --fail " +
			"-u '${NEXUS_USERNAME}':'${NEXUS_PASSWORD}' " +
			// IP points to http://next.tutao.de/nexus, but we can't use the hostname due to reverse proxy configuration
			"'http://[fd:aa::70]:8081/nexus/repository/releases/${params.groupId}/${params.artifactId}/${params.version}/${params.artifactId}-${params.version}.${params.fileExtension}' "
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

// required in order to be able to use "load" to include this script in a jenkins pipleline
return this