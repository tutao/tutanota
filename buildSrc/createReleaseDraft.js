import { Octokit } from "@octokit/rest"
import { Option, program } from "commander"
import { fileURLToPath } from "node:url"
import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto"

const wasRunFromCli = fileURLToPath(import.meta.url).startsWith(process.argv[1])

function hashFileSha256(filePath) {
	const input = fs.readFileSync(filePath)
	return crypto.createHash("sha256").update(input).digest("hex")
}

if (wasRunFromCli) {
	program
		.requiredOption("--name <name>", "Name of the release")
		.requiredOption("--tag <tag>", "The commit tag to reference")
		.requiredOption("--notes <notes>", "path to the file containing the release notes to use")
		.option("--toFile <toFile>", "If provided, the release notes will be written to the given file path.")
		.addOption(
			new Option("--uploadFile <filePath>", "path to a file to upload. can be passed multiple times.")
				.argParser((cur, prev) => (prev ? prev.concat(cur) : [cur]))
				.default([]),
		)
		.option("--dryRun", "Don't make any changes to github")
		.action((options) => run(options))
		.parseAsync(process.argv)
}

async function run({ name, tag, notes, uploadFile, dryRun, toFile }) {
	notes = renderCompleteNotes({ notes: await fs.promises.readFile(notes, { encoding: "utf8" }), files: uploadFile })

	if (toFile) {
		console.log(`writing release notes to ${toFile}`)
		await fs.promises.writeFile(toFile, notes, "utf-8")
	} else if (dryRun) {
		console.log(`dry run, so not creating draft with release notes\n\n${notes}\nand name ${name}, tag ${tag} \n ${uploadFile}`)
	} else {
		const releaseToken = process.env.GITHUB_TOKEN

		if (!releaseToken) {
			throw new Error("No GITHUB_TOKEN set!")
		}

		const octokit = new Octokit({
			auth: releaseToken,
			userAgent: "tuta-github-release-v0.0.1",
		})

		const draftResponse = await createReleaseDraft(octokit, name, tag, notes)

		const { upload_url, id } = draftResponse.data
		for (const filePath of uploadFile) {
			console.log(`Uploading asset "${filePath}"`)
			await uploadAsset(octokit, upload_url, id, filePath)
		}
	}
}

/**
 * we get the release notes without any asset checksums, which are added here.
 */
function renderCompleteNotes({ notes, files }) {
	return files.length === 0 ? notes : `${notes}\n\n${renderAssetSection(files)}`.trim()
}

function renderAssetSection(files) {
	let assetSection = ""
	if (files.length > 0) {
		assetSection += "# Asset Checksums (SHA256)\n"
		for (const f of files) {
			const hash = hashFileSha256(f)
			const filename = path.basename(f)
			assetSection += `**${filename}:**\n${hash}\n\n`
		}
	}
	return assetSection
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
