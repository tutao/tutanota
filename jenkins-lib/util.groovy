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

/**
 * Check if the given git tag exists, error out if it does
 */
def checkGitTag(String tag) {
	// Check if the given tag already exists, if it does then error out
	sh "if git rev-parse ${TAG} >/dev/null 2>&1; then\n"+
			"echo 'can't make release build, git tag ${TAG} already exists'"
			"return 1\n" +
		"else\n" +
			"return 0\n" +
		"fi"
}
// required in order to be able to use "load" to include this script in a jenkins pipleline
return this