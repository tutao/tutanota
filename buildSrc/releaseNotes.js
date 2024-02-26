import { Octokit } from "@octokit/rest"
import { Option, program } from "commander"
import { fileURLToPath } from "node:url"
import fs from "node:fs"
import crypto from "node:crypto"

const wasRunFromCli = fileURLToPath(import.meta.url).startsWith(process.argv[1])

if (wasRunFromCli) {
	program
		.requiredOption("--milestone <milestone>", "Milestone name or milestone number to reference")
		.addOption(
			new Option("--platform <platform>", "label filter for the issues to include in the notes")
				.choices(["android", "ios", "desktop", "web"])
				.default("web"),
		)
		.action(async (options) => {
			await renderReleaseNotes(options)
		})
		.parseAsync(process.argv)
}

async function renderReleaseNotes({ milestone, platform }) {
	const octokit = new Octokit({
		userAgent: "tuta-github-release-v0.0.1",
	})

	const githubMilestone = await getMilestone(octokit, milestone)
	const issues = await getIssuesForMilestone(octokit, githubMilestone)
	const { bugs, other } = sortIssues(filterIssues(issues, platform))
	const releaseNotes =
		platform === "ios"
			? renderIosReleaseNotes(bugs, other)
			: renderGithubReleaseNotes({
					milestoneUrl: githubMilestone.html_url,
					bugIssues: bugs,
					otherIssues: other,
			  })

	console.log(releaseNotes)
}

async function getMilestone(octokit, milestoneNameOrNumber) {
	const { data } = await octokit.issues.listMilestones({
		owner: "tutao",
		repo: "tutanota",
		direction: "desc",
		state: "all",
	})

	const milestone = data.find((m) => m.title === milestoneNameOrNumber || String(m.number) === milestoneNameOrNumber)

	if (milestone) {
		return milestone
	} else {
		const titles = data.map((m) => `${m.title} (${m.number})`)
		throw new Error(`No milestone ${milestoneNameOrNumber} found. Milestones:
	${titles.join(",\n\t")}`)
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
	const excludedLabels = new Set(["dev bug", "topic:usage test", "no-release-notes"])
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

function renderGithubReleaseNotes({ milestoneUrl, bugIssues, otherIssues }) {
	const whatsNewListRendered = otherIssues.length > 0 ? "# What's new\n" + otherIssues.map((issue) => ` - ${issue.title} #${issue.number}`).join("\n") : ""

	const bugsListRendered = bugIssues.length > 0 ? "# Bugfixes\n" + bugIssues.map((issue) => ` - ${issue.title} #${issue.number}`).join("\n") : ""

	const milestoneUrlObject = new URL(milestoneUrl)
	milestoneUrlObject.searchParams.append("closed", "1")
	return `
${whatsNewListRendered}

${bugsListRendered}

# Milestone
${milestoneUrlObject.toString()}
`.trim()
}

function renderIosReleaseNotes(bugs, rest) {
	const whatsNewSection = rest.length > 0 ? "what's new:\n" + rest.map((issue) => issue.title).join("\n") : ""

	const bugfixSection = bugs.length > 0 ? "\nbugfixes:\n" + bugs.map((issue) => "fixed " + issue.title).join("\n") : ""

	return `${whatsNewSection}\n${bugfixSection}`.trim()
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

function hashFileSha256(filePath) {
	const input = fs.readFileSync(filePath)
	return crypto.createHash("sha256").update(input).digest("hex")
}
