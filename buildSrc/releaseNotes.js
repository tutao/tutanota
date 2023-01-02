import { Octokit } from "@octokit/rest"
import { Option, program } from "commander"
import { fileURLToPath } from "url"
import path from "path"
import fs from "fs"
import crypto from "crypto"

const wasRunFromCli = fileURLToPath(import.meta.url).startsWith(process.argv[1])

function hashFileSha256(filePath) {
	const input = fs.readFileSync(filePath)
	return crypto.createHash("sha256").update(input).digest("hex")
}

if (wasRunFromCli) {
	program
		.requiredOption("--releaseName <releaseName>", "Name of the release")
		.requiredOption("--milestone <milestone>", "Milestone to reference")
		.requiredOption("--tag <tag>", "The commit tag to reference")
		.addOption(
			new Option("--platform <platform>", "label filter for the issues to include in the notes")
				.choices(["android", "ios", "desktop", "web"])
				.default("web"),
		)
		.addOption(
			new Option("--uploadFile <filePath>", "path to a file to upload. can be passed multiple times.")
				.argParser((cur, prev) => (prev ? prev.concat(cur) : [cur]))
				.default([]),
		)
		.option("--toFile <toFile>", "If provided, the release notes will be written to the given file path. Implies `--dryRun`")
		.option("--dryRun", "Don't make any changes to github")
		.option("--format <format>", "Format to generate notes in", "github")
		.action(async (options) => {
			await createReleaseNotes(options)
		})
		.parseAsync(process.argv)
}

async function createReleaseNotes({ releaseName, milestone, tag, platform, uploadFile, toFile, dryRun, format }) {
	const releaseToken = process.env.GITHUB_TOKEN

	if (!releaseToken) {
		throw new Error("No GITHUB_TOKEN set!")
	}

	const octokit = new Octokit({
		auth: releaseToken,
		userAgent: "tuta-github-release-v0.0.1",
	})

	let releaseNotes

	const githubMilestone = await getMilestone(octokit, milestone)
	const issues = await getIssuesForMilestone(octokit, githubMilestone)
	const { bugs, other } = sortIssues(filterIssues(issues, platform))

	if (format === "ios") {
		releaseNotes = renderIosReleaseNotes(bugs, other)
	} else {
		releaseNotes = renderGithubReleaseNotes({
			milestoneUrl: githubMilestone.html_url,
			bugIssues: bugs,
			otherIssues: other,
			files: uploadFile,
		})
	}

	console.log("Release notes:")
	console.log(releaseNotes)

	if (!dryRun && !toFile) {
		const draftResponse = await createReleaseDraft(octokit, releaseName, tag, releaseNotes)

		const { upload_url, id } = draftResponse.data
		for (const filePath of uploadFile) {
			console.log(`Uploading asset "${filePath}"`)
			await uploadAsset(octokit, upload_url, id, filePath)
		}
	}

	if (toFile) {
		console.log(`writing release notes to ${toFile}`)
		await fs.promises.writeFile(toFile, releaseNotes, "utf-8")
	}
}

async function getMilestone(octokit, milestoneName) {
	const { data } = await octokit.issues.listMilestones({
		owner: "tutao",
		repo: "tutanota",
		direction: "desc",
		state: "all",
	})

	const milestone = data.find((m) => m.title === milestoneName)

	if (milestone) {
		return milestone
	} else {
		const titles = data.map((m) => m.title)
		throw new Error(`No milestone named ${milestoneName} found. Milestones: ${titles.join(", ")}`)
	}
}

async function getIssuesForMilestone(octokit, milestone) {
	const response = await octokit.issues.listForRepo({
		owner: "tutao",
		repo: "tutanota",
		milestone: milestone.number,
		state: "all",
	})
	return response.data
}

/**
 * Filter the issues for the given platform.
 * If an issue has no platform label, then it will be included
 * If an issue has a label for a different platform, it won't be included,
 * _unless_ it also has the label for the specified platform.
 */
function filterIssues(issues, platform) {
	const allPlatforms = new Set(["android", "ios", "desktop"])
	// issues that have any of these labels will not be included in any release notes
	const excludedLabels = new Set(["dev bug", "usage test"])
	issues = issues.filter((issue) => !issue.labels.some((label) => excludedLabels.has(label.name)))

	if (platform === "web") {
		// for the web app, we only want to include issues that don't have a platform label
		return issues.filter((i) => areDisjoint(labelSet(i), allPlatforms))
	} else if (allPlatforms.has(platform)) {
		const otherPlatforms = new Set(allPlatforms)
		otherPlatforms.delete(platform)
		return issues.filter((issue) => issue.labels.some((label) => label.name === platform) || !issue.labels.some((label) => otherPlatforms.has(label.name)))
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
		const isBug = issue.labels.find((l) => l.name === "bug" || l.name === "dev bug")
		if (isBug) {
			bugs.push(issue)
		} else {
			other.push(issue)
		}
	}
	return { bugs, other }
}

function renderGithubReleaseNotes({ milestoneUrl, bugIssues, otherIssues, files }) {
	const whatsNewListRendered = otherIssues.length > 0 ? "# What's new\n" + otherIssues.map((issue) => ` - ${issue.title} #${issue.number}`).join("\n") : ""

	const bugsListRendered = bugIssues.length > 0 ? "# Bugfixes\n" + bugIssues.map((issue) => ` - ${issue.title} #${issue.number}`).join("\n") : ""

	const milestoneUrlObject = new URL(milestoneUrl)
	milestoneUrlObject.searchParams.append("closed", "1")

	let assetSection = ""
	if (files.length > 0) {
		assetSection += "# Asset Checksums (SHA256)\n"
		for (const f of files) {
			const hash = hashFileSha256(f)
			const filename = path.basename(f)
			console.log(`hash of ${filename}: `, hash)
			assetSection += `**${filename}:**\n${hash}\n\n`
		}
	}

	return `
${whatsNewListRendered}

${bugsListRendered}

# Milestone
${milestoneUrlObject.toString()}

${assetSection}
`.trim()
}

function renderIosReleaseNotes(bugs, rest) {
	const whatsNewSection = rest.length > 0 ? "what's new:\n" + rest.map((issue) => issue.title).join("\n") : ""

	const bugfixSection = bugs.length > 0 ? "bugfixes:\n" + bugs.map((issue) => "fixed " + issue.title).join("\n") : ""

	return `${whatsNewSection}\n${bugfixSection}`.trim()
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
		upload_url: uploadUrl,
	})

	if (response.status < 200 || response.status > 299) {
		console.error(`Asset upload failed "${assetPath}. Response:"`, response)
	}
}

/**
 * test whether two js sets have no elements in common
 */
function areDisjoint(setA, setB) {
	return [...setA].filter((el) => setB.has(el)).length === 0
}

function labelSet(issue) {
	return new Set(issue.labels.map((l) => l.name))
}
