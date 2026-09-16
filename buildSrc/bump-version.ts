import fs from "node:fs"
import { $ } from "zx"
import { calculateClientVersions } from "./versionUtils"
import { Command, Option } from "commander"

const platformChoices = ["all", "webdesktop", "android", "ios"] as const
type BumpVersionOptions = {
	platform: (typeof platformChoices)[number]
}
export const bumpVersionCmd = new Command("bump-version")
	.description("Bump version")
	.addOption(new Option("-p, --platform <platform>", "version for which platform to bump").choices(platformChoices).default("all"))
	.action(run)

async function run({ platform }: BumpVersionOptions) {
	console.log(`bumping version for ${platform ?? "all"}`)
	const { currentVersion, currentVersionString, newVersionString } = await calculateClientVersions()
	await bumpVersionInCargoWorkspace(newVersionString)

	if (platform === "all" || platform === "webdesktop") {
		await $`npm version --no-git-tag-version ${newVersionString}`

		// Need to clean and re-install to make sure that all packages
		// are installed with the correct version. otherwise, npm list
		// from the tutanota-3 postinstall script will complain about
		// invalid installed versions after npm i.
		await fs.promises.rm("./node_modules", { recursive: true })
		await $`npm i`
	}

	if (platform === "all" || platform === "ios") {
		await bumpIosVersion(newVersionString)
	}

	if (platform === "all" || platform === "android") {
		await bumpAndroidVersion("app-android/app/build.gradle.kts")
		await bumpAndroidVersion("app-android/calendar/build.gradle.kts")
		await bumpAndroidVersion("app-android/drive/build.gradle.kts")

		await bumpAndroidVersionName(currentVersion, newVersionString, "app-android/app/build.gradle.kts")
		await bumpAndroidVersionName(currentVersion, newVersionString, "app-android/calendar/build.gradle.kts")
		await bumpAndroidVersionName(currentVersion, newVersionString, "app-android/drive/build.gradle.kts")
	}

	console.log(`Bumped version ${currentVersionString} -> ${newVersionString}`)
}

async function bumpVersionInCargoWorkspace(newVersionString: string) {
	const workspaceFilePath = "Cargo.toml"
	const versionRegex = /\[workspace\.package]\nversion = ".*"/
	const contents = await fs.promises.readFile(workspaceFilePath, "utf8")
	let found = 0
	const newContents = contents.replace(versionRegex, (_, __, ___, ____) => {
		found += 1
		return `[workspace.package]\nversion = "${newVersionString}"`
	})

	if (found !== 1) {
		console.warn(`${workspaceFilePath} had an unexpected format and couldn't be updated. Is it corrupted?`)
	} else {
		console.log(`rust: Updated ${workspaceFilePath} package.version to ${newVersionString}`)
		await fs.promises.writeFile(workspaceFilePath, newContents)
		// regenerate the lockfile
		await $`cargo update tuta-sdk tutao_node-mimimi && cargo check --all`
	}
}

async function bumpIosVersion(newVersionString: string) {
	const plists = [
		"app-ios/calendar/Info.plist",
		"app-ios/tutanota/Info.plist",
		"app-ios/drive/Info.plist",
		"app-ios/TutanotaNotificationExtension/Info.plist",
		"app-ios/tutanotaTests/Info.plist",
	]

	for (const plist of plists) {
		await replaceCfBundleVersion(plist, newVersionString)
	}
}

async function replaceCfBundleVersion(filePath: string, newVersionString: string) {
	const infoPlistContents = await fs.promises.readFile(filePath, "utf8")
	let found = 0
	const newInfoPlistContents = infoPlistContents.replaceAll(
		/<key>CFBundle(Short)?Version(String)?<\/key>\s+<string>(\d+\.\d+\.\d+)<\/string>/g,
		(match, _, __, version) => {
			found += 1
			return match.replace(version, newVersionString)
		},
	)

	if (found !== 2) {
		console.warn(`${filePath} had an unexpected format and couldn't be updated. Is it corrupted?`)
	} else {
		console.log(`iOS: Updated ${filePath} to ${newVersionString}`)
		await fs.promises.writeFile(filePath, newInfoPlistContents)
	}
}

async function bumpAndroidVersion(buildGradlePath: string) {
	const buildGradleString = await fs.promises.readFile(buildGradlePath, "utf8")

	const kotlinRegex = /versionCode = (\d+)/
	const groovyRegex = /versionCode (\d+)/

	const versionRegex = new RegExp(buildGradlePath.endsWith("kts") ? kotlinRegex : groovyRegex)
	const oldVersionCodeMatch = buildGradleString.match(versionRegex)
	if (oldVersionCodeMatch == null) {
		throw new Error(`Android: Could not find versionCode in ${buildGradlePath}! Is it corrupted?`)
	}

	const oldVersionCodeString = oldVersionCodeMatch[1]
	const oldVersionCode = parseInt(oldVersionCodeString, 10)
	if (Number.isNaN(oldVersionCode)) {
		throw new Error(`Android: Detected version code as ${oldVersionCodeMatch[1]} but it is not a number! Is it corrupted`)
	}

	const newVersionCode = oldVersionCode + 1
	const newVersionCodeString = String(newVersionCode)

	const versionCodeToWrite = `versionCode ${buildGradlePath.endsWith("kts") ? "= " : ""}${newVersionCodeString}`
	const newBuildGradleString = buildGradleString.replace(new RegExp(versionRegex), versionCodeToWrite)
	console.log(`Bumped Android versionCode: ${oldVersionCodeString} -> ${newVersionCodeString} (${buildGradlePath})`)
	await fs.promises.writeFile(buildGradlePath, newBuildGradleString)
}

async function bumpAndroidVersionName(currentVersion: Array<number>, newVersionString: string, buildGradlePath: string) {
	const buildGradleString = await fs.promises.readFile(buildGradlePath, "utf8")
	const newBuildGradleString = buildGradleString.replace(new RegExp(currentVersion.join("\\.")), newVersionString)
	console.log(`Bumped Android versionName: ${currentVersion.join("\\.")} -> ${newVersionString} (${buildGradlePath})`)
	await fs.promises.writeFile(buildGradlePath, newBuildGradleString)
}
