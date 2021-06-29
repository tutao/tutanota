import {Octokit} from "@octokit/rest"
import options from "commander"
import {fileURLToPath} from "url"
import path from "path"
import fs from "fs"

const wasRunFromCli = fileURLToPath(import.meta.url).startsWith(process.argv[1])

if (wasRunFromCli) {
	options
		.requiredOption('--name <name>', "Name of the release")
		.requiredOption('--milestone <milestone>', "Milestone to reference")
		.requiredOption('--tag <tag>', "The commit tag to reference")
		.option('--platform <platform>', 'Which platform to build', /android|ios|all/, "all")
		.option('--uploadFile <filePath>', "Path to a file to upload")
		.option('--apkChecksum <checksum>', "Checksum for the APK")
		.parse(process.argv)

	const {name, milestone, tag, platform, uploadFile, apkChecksum} = options

	const releaseToken = process.env.GITHUB_TOKEN

	if (!releaseToken) {
		throw new Error("No GITHUB_TOKEN set!")
	}

	const octokit = new Octokit({
		auth: releaseToken,
		userAgent: 'tuta-github-release-v0.0.1'
	})

	const releaseNotes = await generateReleaseNotes(octokit, milestone, platform, apkChecksum)
		.catch(e => {
			console.error(e)
			process.exit(1)
		})

	const draftResponse = await createReleaseDraft(octokit, name, tag, releaseNotes)

	const {upload_url, id} = draftResponse.data

	if (uploadFile) {
		console.log(`Uploading asset "${uploadFile}"`)
		await uploadAsset(octokit, upload_url, id, uploadFile)
	}
}

export async function generateReleaseNotes(octokit, milestoneName, platform = "all", apkChecksum = null) {
	const milestone = await getMilestone(octokit, milestoneName)
	const issues = await getIssuesForMilestone(octokit, milestone)
	const {bugs, rest} = sortIssues(filterIssues(issues, platform))
	const {whatsNewListRendered, bugsListRendered} = renderIssues(rest, bugs)
	return renderReleaseBody(milestone.html_url, whatsNewListRendered, bugsListRendered, apkChecksum)
}

async function getMilestone(octokit, milestoneName) {
	const milestones = await getMilestones(octokit)

	const milestone = milestones.find(m => m.title === milestoneName)

	if (milestone) {
		return milestone
	} else {
		const titles = milestones.map(m => m.title)
		throw new Error(`No milestone named ${milestoneName} found. Milestones: ${titles.join(", ")}`)
	}
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

async function getIssuesForMilestone(octokit, milestone, platform) {
	const response = await octokit.issues.listForRepo({
		owner: "tutao",
		repo: "tutanota",
		milestone: milestone.number,
		state: "all"
	})
	return response.data
}

function filterIssues(issues, platform) {
	if (platform === "all") {
		return issues
	} else if (platform === "android") {
		return issues.filter(issue =>
			issue.labels.some(label => label.name === "android") ||
			!issue.labels.some(label => label.name === "desktop" || label.name === "ios"))
	} else if (platform === "ios") {
		return issues.filter(issue =>
			issue.labels.some(label => label.name === "ios") ||
			!issue.labels.some(label => label.name === "desktop" || label.name === "android"))
	} else {
		throw new Error(`Invalid value "${platform}" for "platform"`)
	}
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

function renderReleaseBody(milestoneUrl, whatsNewListRendered, bugsListRendered, apkChecksum) {
	const milestoneUrlObject = new URL(milestoneUrl)
	milestoneUrlObject.searchParams.append("closed", "1")
	return `# What's new
${whatsNewListRendered}

# Bugfixes
${bugsListRendered}

# Milestone
${milestoneUrlObject.toString()}

` + (apkChecksum ? `# APK Checksum\nSHA256: ${apkChecksum}` : "")
}

async function createReleaseDraft(octokit, name, tag, body) {
	return octokit.repos.createRelease({
		owner: "tutao",
		repo: "tutanota",
		draft: true,
		name,
		tag_name: tag,
		body,
	})
}

async function uploadAsset(octokit, uploadUrl, releaseId, assetPath) {
	const response = octokit.rest.repos.uploadReleaseAsset({
		owner: "tutao",
		repo: "tutanota",
		release_id: releaseId,
		data: await fs.promises.readFile(assetPath),
		name: path.basename(assetPath),
		upload_url: uploadUrl
	});

	if (response.status < 200 || response.status > 299) {
		console.error(`Asset upload failed "${assetPath}. Response:"`, response)
	}
}