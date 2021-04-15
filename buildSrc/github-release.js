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

	const milestones = await getMilestones(octokit)

	const versionMilestone = milestones.find(m => m.title.includes(version))
	if (versionMilestone) {
		console.log(`Found milestone ${versionMilestone.number} ${versionMilestone.title}`)
	} else {
		const titles = milestones.map(m => m.title)
		throw new Error(`No milestone for version ${version} found. Milestones: ${titles.join(", ")}`)
	}

	const issues = await getIssuesForMilestone(octokit, versionMilestone)
	const {bugs, rest} = sortIssues(issues)
	const {whatsNewListRendered, bugsListRendered} = renderIssues(rest, bugs)
	const body = renderReleaseBody(versionMilestone.html_url, whatsNewListRendered, bugsListRendered)
	console.log(body)
	await createReleaseDraft(octokit, version, tag, body)
}

async function getMilestones(octokit) {
	return (await octokit.issues.listMilestones({
			owner: "tutao",
			repo: "tutanota",
			direction: "desc",
			state: "all"
		})
	).data
}

async function getIssuesForMilestone(octokit, milestone) {
	return (await octokit.issues.listForRepo({
			owner: "tutao",
			repo: "tutanota",
			milestone: milestone.number,
			state: "all"
		})
	).data
}

function sortIssues(issues) {
	const bugs = []
	const rest = []
	for (const issue of issues) {
		const isBug = issue.labels.find(l => l.name === "bug")
		if (isBug) {
			bugs.push(issue)
		} else {
			rest.push(issue)
		}
	}
	return {bugs, rest}
}

function renderIssues(rest, bugs) {
	const whatsNewListRendered = rest.map(i => {
		return ` - ${i.title} #${i.number}`
	}).join("\n")
	const bugsListRendered = bugs.map(i => {
		return ` - ${i.title} #${i.number}`
	}).join("\n")
	return {whatsNewListRendered, bugsListRendered}
}

function renderReleaseBody(milestoneUrl, whatsNewListRendered, bugsListRendered) {
	const milestoneUrlObject = new URL(milestoneUrl)
	milestoneUrlObject.searchParams.append("closed", "1")
	return `
# What's new
${whatsNewListRendered}

# Bugfixes
${bugsListRendered}

# Milestone
${milestoneUrlObject.toString()}

# TAR Checksum
TBA

# APK Checksum
TBA`
}

async function createReleaseDraft(octokit, version, tag, body) {
	return octokit.repos.createRelease({
		owner: "tutao",
		repo: "tutanota",
		draft: true,
		name: version,
		tag_name: tag,
		body,
	})
}