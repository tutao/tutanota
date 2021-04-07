import {Octokit} from "@octokit/rest"
import {createTokenAuth} from "@octokit/auth-token";

run().catch(e => {
	console.error(e)
	process.exit(1)
})

async function run() {
	const releaseToken = process.env.GITHUB_TOKEN
	if (!releaseToken) {
		throw new Error("No GITHUB_TOKEN set!")
	}

	const auth = createTokenAuth(releaseToken)
	const authentication = await auth()
	const octokit = new Octokit({
		authentication,
		userAgent: 'tuta-github-release-v0.0.1'
	})
	await octokit.repos.createRelease({
		owner: "tutao",
		repo: "tutanota",
		draft: true,
		name: "test-draft",
		tag_name: process.argv[2],
	})
}

