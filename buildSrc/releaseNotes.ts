import { Octokit } from "@octokit/rest"
import { Command, Option } from "commander"
import { BuildPlatform } from "./DevBuild"

export const releaseNotesCmd = new Command("prepare-release-notes")
	.requiredOption("--milestone <milestone>", "Milestone name or milestone number to reference")
	.addOption(
		new Option("--platform <platform>", "label filter for the issues to include in the notes").choices(["android", "ios", "desktop", "web"]).default("web"),
	)
	.action(async (options) => {
		await renderReleaseNotes(options)
	})

type ReleaseNotesOpts = {
	milestone: string
	platform: BuildPlatform
}

type GhMilestone = Awaited<ReturnType<Octokit["issues"]["getMilestone"]>>["data"]
type GhIssues = Awaited<ReturnType<Octokit["issues"]["listForRepo"]>>["data"]

async function renderReleaseNotes(options: ReleaseNotesOpts) {
	const octokit = new Octokit({
		userAgent: "tuta-github-release-v0.0.1",
	})

	const githubMilestone: GhMilestone = await getMilestone(octokit, options.milestone)
	const issues = await getIssuesForMilestone(octokit, githubMilestone)
	const { bugs, other } = sortIssues(filterIssues(issues, options.platform))
	const releaseNotes =
		options.platform === "ios"
			? renderIosReleaseNotes(bugs, other)
			: renderGithubReleaseNotes({
					milestoneUrl: githubMilestone.html_url,
					bugIssues: bugs,
					otherIssues: other,
				})

	console.log(releaseNotes)
}

async function getMilestone(octokit: Octokit, milestoneNameOrNumber: string) {
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

async function getIssuesForMilestone(octokit: Octokit, milestone: GhMilestone) {
	const response = await octokit.issues.listForRepo({
		owner: "tutao",
		repo: "tutanota",
		milestone: milestone.number.toString(),
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
function filterIssues(issues: GhIssues, platform: BuildPlatform) {
	const allPlatforms = new Set(["android", "ios", "desktop"])
	// issues that have any of these labels will not be included in any release notes
	const excludedLabels = new Set(["dev bug", "topic:usage test", "no-release-notes"])
	issues = issues.filter((issue) => !issue.labels.some((label) => typeof label === "object" && excludedLabels.has(label.name!)))

	if (platform === "web") {
		// for the web app, we only want to include issues that don't have a platform label
		return issues.filter((i) => areDisjoint(labelSet(i), allPlatforms))
	} else if (allPlatforms.has(platform)) {
		const otherPlatforms = new Set(allPlatforms)
		otherPlatforms.delete(platform)
		return issues.filter(
			(issue) =>
				issue.labels.some((label) => typeof label === "object" && label.name === platform) ||
				!issue.labels.some((label) => typeof label === "object" && otherPlatforms.has(label.name!)),
		)
	} else {
		throw new Error(`Invalid value "${platform}" for "platform"`)
	}
}

/**
 *  Sort issues into bug issues and other issues
 */
function sortIssues(issues: GhIssues): { bugs: GhIssues; other: GhIssues } {
	const bugs = []
	const other = []
	for (const issue of issues) {
		const isBug = issue.labels.find((l) => typeof l === "object" && (l.name === "bug" || l.name === "dev bug"))
		if (isBug) {
			bugs.push(issue)
		} else {
			other.push(issue)
		}
	}
	return { bugs, other }
}

type RenderGithubReleaseNotesOpts = { milestoneUrl: string; bugIssues: GhIssues; otherIssues: GhIssues }
function renderGithubReleaseNotes({ milestoneUrl, bugIssues, otherIssues }: RenderGithubReleaseNotesOpts) {
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

function renderIosReleaseNotes(bugs: GhIssues, rest: GhIssues) {
	const whatsNewSection = rest.length > 0 ? "what's new:\n" + rest.map((issue) => issue.title).join("\n") : ""

	const bugfixSection = bugs.length > 0 ? "\nbugfixes:\n" + bugs.map((issue) => "fixed " + issue.title).join("\n") : ""

	return `${whatsNewSection}\n${bugfixSection}`.trim()
}

/**
 * test whether two js sets have no elements in common
 */
function areDisjoint<Item>(setA: Set<Item>, setB: Set<Item>) {
	return [...setA].filter((el) => setB.has(el)).length === 0
}

function labelSet(issue: GhIssues[number]) {
	return new Set(
		issue.labels.map((l) => {
			if (typeof l === "string") throw new Error("expected to be an object")
			return l.name
		}),
	)
}
