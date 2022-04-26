import {Octokit} from "@octokit/rest"
import options from "commander"
import {fileURLToPath} from "url"
import path from "path"
import fs from "fs"

const wasRunFromCli = fileURLToPath(import.meta.url).startsWith(process.argv[1])

if (wasRunFromCli) {
	options
		.requiredOption('--releaseName <releaseName>', "Name of the release")
		.requiredOption('--milestone <milestone>', "Milestone to reference")
		.requiredOption('--tag <tag>', "The commit tag to reference")
		.option('--platform <platform>', 'Which platform to build', /android|ios|desktop|all/, "all")
		.option('--uploadFile <filePath>', "Path to a file to upload")
		.option('--apkChecksum <checksum>', "Checksum for the APK")
		.option('--toFile <toFile>', "If provided, the release notes will be written to the given file path. Implies `--dryRun`")
		.option('--dryRun', "Don't make any changes to github")
		.option('--format <format>', "Format to generate notes in", "github")
		.action(async (options) => {
			await createReleaseNotes(options)
		})
		.parseAsync(process.argv)
}

async function createReleaseNotes(
	{
		releaseName,
		milestone,
		tag,
		platform,
		uploadFile,
		apkChecksum,
		toFile,
		dryRun,
		format
	}
) {

	const releaseToken = process.env.GITHUB_TOKEN

	if (!releaseToken) {
		throw new Error("No GITHUB_TOKEN set!")
	}

	const octokit = new Octokit({
		auth: releaseToken,
		userAgent: 'tuta-github-release-v0.0.1'
	})

	let releaseNotes

	const githubMilestone = await getMilestone(octokit, milestone)
	const issues = await getIssuesForMilestone(octokit, githubMilestone)
	const {bugs, other} = sortIssues(filterIssues(issues, platform))

	if (format === "ios") {
		releaseNotes = renderIosReleaseNotes(bugs, other)
	} else {
		releaseNotes = renderGithubReleaseNotes({
			milestoneUrl: githubMilestone.html_url,
			bugIssues: bugs,
			otherIssues: other,
			apkChecksum: apkChecksum
		})
	}

	console.log("Release notes:")
	console.log(releaseNotes)

	if (!dryRun && !toFile) {
		const draftResponse = await createReleaseDraft(octokit, releaseName, tag, releaseNotes)

		const {upload_url, id} = draftResponse.data

		if (uploadFile) {
			console.log(`Uploading asset "${uploadFile}"`)
			await uploadAsset(octokit, upload_url, id, uploadFile)
		}
	}

	if (toFile) {
		await fs.promises.writeFile(toFile, "utf-8")
	}
}

async function getMilestone(octokit, milestoneName) {
	const {data} = await octokit.issues.listMilestones({
		owner: "tutao",
		repo: "tutanota",
		direction: "desc",
		state: "all"
	})

	const milestone = data.find(m => m.title === milestoneName)

	if (milestone) {
		return milestone
	} else {
		const titles = data.map(m => m.title)
		throw new Error(`No milestone named ${milestoneName} found. Milestones: ${titles.join(", ")}`)
	}
}

async function getIssuesForMilestone(octokit, milestone) {
	const response = await octokit.issues.listForRepo({
		owner: "tutao",
		repo: "tutanota",
		milestone: milestone.number,
		state: "all"
	})
	return response.data
}

/**
 * Filter the issues for the given platform.
 * If an issue has no label, then it will be included
 * If an issue has a label for a different platform, it won't be included,
 * _unless_ it also has the label for the specified paltform
 */
function filterIssues(issues, platform) {

	const allPlatforms = ["android", "ios", "desktop"]

	if (platform === "all") {
		return issues
	} else if (allPlatforms.includes(platform)) {
		const otherPlatforms = allPlatforms.filter(p => p !== platform)
		return issues.filter(issue =>
			issue.labels.some(label => label.name === platform) ||
			!issue.labels.some(label => otherPlatforms.includes(label.name))
		)
	} else {
		throw new Error(`Invalid value "${platform}" for "platform"`)
	}
}

/**
 *  Sort issues into bug issues and other issues
 */
function sortIssues(issues) {
	const bugs = []
	const other = []
	for (const issue of issues) {
		const isBug = issue.labels.find(l => l.name === "bug")
		if (isBug) {
			bugs.push(issue)
		} else {
			other.push(issue)
		}
	}
	return {bugs, other}
}

function renderGithubReleaseNotes({milestoneUrl, bugIssues, otherIssues, apkChecksum}) {

	const whatsNewListRendered = otherIssues.map(issue => {
		return ` - ${issue.title} #${issue.number}`
	}).join("\n")

	const bugsListRendered = bugIssues.map(issue => {
		return ` - ${issue.title} #${issue.number}`
	}).join("\n")

	const milestoneUrlObject = new URL(milestoneUrl)
	milestoneUrlObject.searchParams.append("closed", "1")

	const apkSection = apkChecksum ? `# APK Checksum\nSHA256: ${apkChecksum}` : ""

	return `
# What's new
${whatsNewListRendered}

# Bugfixes
${bugsListRendered}

# Milestone
${milestoneUrlObject.toString()}

${apkSection}
`.trim()
}

function renderIosReleaseNotes(bugs, rest) {
	return `
what's new:
${rest.map(issue => issue.title).join("\n")}

bugfixes:
${bugs.map(issue => issue.title).join("\n")}`.trim()
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