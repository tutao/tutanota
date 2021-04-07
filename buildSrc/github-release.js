import {Octokit} from "@octokit/rest"
import dotenv from "dotenv"

dotenv.config()

run().catch(e => {
	console.error(e)
	process.exit(1)
})

async function run() {
	const version = process.argv[2]
	if (!version) {
		throw new Error("version is not specified")
	}
	const tag = `tutanota-release-${version}`

	const releaseToken = process.env.GITHUB_TOKEN
	if (!releaseToken) {
		throw new Error("No GITHUB_TOKEN set!")
	}
	const octokit = new Octokit({
		auth: releaseToken,
		userAgent: 'tuta-github-release-v0.0.1'
	})

	const body = `
	# What's new
	
	# Bugfixes
	
	`

	await octokit.repos.createRelease({
		owner: "tutao",
		repo: "tutanota",
		draft: true,
		name: "test-draft",
		tag_name: tag,
	})
}

