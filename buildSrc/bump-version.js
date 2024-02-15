#!/usr/bin/env node
// @ts-check

import { Option, program } from "commander"
import fs from "node:fs"
import path from "node:path"
import { $ } from "zx"

await program
	.addOption(new Option("-p, --platform <platform>", "version for which platform to bump").choices(["all", "webdesktop", "android", "ios"]).default("all"))
	.action(run)
	.parseAsync(process.argv)

/**
 * @typedef {"major" | "minor" | "patch"} Which
 * @typedef {{name: string, directory: string}} Workspace
 */

/**
 * @param which {Which}
 * @param platform {undefined | "webdesktop" | "android" | "ios"}
 * @return {Promise<void>}
 */
async function run({ platform }) {
	console.log(`bumping version for ${platform ?? "all"}`)
	const currentVersionString = await readCurrentVersion()
	const currentVersion = parseCurrentVersion(currentVersionString)
	const newVersion = makeNewVersion(currentVersion)
	const newVersionString = newVersion.join(".")

	if (platform === "all" || platform === "webdesktop") {
		await bumpWorkspaces(newVersionString)
		await $`npm version --no-git-tag-version ${newVersionString}`

		// Need to clean and re-install to make sure that all packages
		// are installed with the correct version. otherwise, npm list
		// from the tutanota-3 postinstall script will complain about
		// invalid installed versions after npm i.
		await fs.promises.unlink("./package-lock.json")
		await fs.promises.rm("./node_modules", { recursive: true })
		await $`npm i`
	}

	if (platform === "all" || platform === "ios") {
		await bumpIosVersion(newVersionString)
	}

	if (platform === "all" || platform === "android") {
		await bumpAndroidVersion(currentVersion, newVersionString)
	}

	console.log(`Bumped version ${currentVersionString} -> ${newVersionString}`)
}

async function readCurrentVersion() {
	return JSON.parse(await fs.promises.readFile("./package.json", { encoding: "utf8" })).version
}

/**
 * Read versions of all models from generated ModelInfos.
 * @returns {number[]}
 */
function readModelVersions() {
	const appNames = fs.readdirSync("./src/api/entities/")
	return appNames.map((appName) => {
		const modelInfoString = fs.readFileSync(`./src/api/entities/${appName}/ModelInfo.ts`, { encoding: "utf8" })
		const versionPrefix = "version:"
		const versionNumberStart = modelInfoString.indexOf(versionPrefix) + versionPrefix.length
		const version = modelInfoString.substring(versionNumberStart, modelInfoString.indexOf(",", versionNumberStart))
		console.log(` > ${appName} version ${version}`)
		return parseInt(version, 10)
	})
}

/**
 * @param currentVersionString {string}
 * @return {number[]}
 */
function parseCurrentVersion(currentVersionString) {
	return currentVersionString.split(".").map((n) => parseInt(n, 10))
}

/**
 * @param newVersionString {string}
 */
async function bumpIosVersion(newVersionString) {
	const infoPlistName = "app-ios/tutanota/Info.plist"
	const infoPlistContents = await fs.promises.readFile(infoPlistName, "utf8")

	let found = 0
	const newInfoPlistContents = infoPlistContents.replaceAll(
		/<key>CFBundle(Short)?Version(String)?<\/key>\s+<string>(\d+\.\d+\.\d+)<\/string>/g,
		(match, _, __, version) => {
			found += 1
			return match.replace(version, newVersionString)
		},
	)

	if (found !== 2) {
		console.warn("app-ios/tutanota/Info.plist had an unexpected format and couldn't be updated. Is it corrupted?")
	} else {
		console.log(`iOS: Updated app-ios/tutanota/Info.plist to ${newVersionString}`)
		await fs.promises.writeFile(infoPlistName, newInfoPlistContents)
	}
}

/**
 * @param currentVersion {number[]}
 * @param newVersionString {string}
 * @return {Promise<void>}
 */
async function bumpAndroidVersion(currentVersion, newVersionString) {
	const buildGradlePath = "app-android/app/build.gradle"
	const buildGradleString = await fs.promises.readFile(buildGradlePath, "utf8")
	const oldVersionCodeMatch = buildGradleString.match(/versionCode (\d+)/)
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
	const newBuildGradleString = buildGradleString
		.replace(new RegExp(currentVersion.join("\\.")), newVersionString)
		.replace(new RegExp(/versionCode (\d+)/), `versionCode ${newVersionCodeString}`)
	console.log(`Bumped Android versionCode: ${oldVersionCodeString} -> ${newVersionCodeString}`)
	await fs.promises.writeFile(buildGradlePath, newBuildGradleString)
}

/**
 * Creates a new client version number.
 * * Major is the sum of all current model versions.
 * * Minor is the current date
 * * Patch is always increased by one in case Major or Minor have not been changed
 * @param currentVersion {number[]}
 * @return {number[]}
 */
function makeNewVersion(currentVersion) {
	const modelVersions = readModelVersions()
	const majorVersion = modelVersions.reduce((sum, current) => sum + current, 0)

	const now = new Date()
	const year = now.getFullYear().toString().substring(2, 4)
	const month = now.getMonth() + 1
	const formattedMonth = month >= 10 ? month : `0${month}`
	const formattedDay = now.getDate() >= 10 ? now.getDate() : `0${now.getDate()}`
	const minorVersion = parseInt(`${year}${formattedMonth}${formattedDay}`, 10)

	const current = currentVersion.slice()
	let patchVersion = 0
	if (current[0] === majorVersion && current[1] === minorVersion) {
		patchVersion = current[2] + 1
	}
	return [majorVersion, minorVersion, patchVersion]
}

/**
 * @return {string[]}
 */
function getWorkspaceDirs() {
	const packagesDir = path.resolve("./packages")
	const relativePaths = fs.readdirSync(packagesDir)
	return relativePaths.map((relativePath) => path.join(packagesDir, relativePath))
}

/**
 * @return {Promise<Workspace[]>}
 */
async function getWorkspaces() {
	const workspaces = []
	const workspaceDirs = getWorkspaceDirs()
	for (let workspaceDir of workspaceDirs) {
		const packageJson = await readPackageJsonFromDir(workspaceDir)
		workspaces.push({
			name: packageJson.name,
			directory: workspaceDir,
		})
	}
	return workspaces
}

/**
 * @param version {string}
 * @return {Promise<void>}
 */
async function bumpWorkspaces(version) {
	// if we don't first bump versions of packages and _then_
	// update the inter-package dependencies we will get an error
	// in the middle of the process because npm can't resolve something
	const workspaces = await getWorkspaces()
	for (const workspace of workspaces) {
		await bumpWorkspaceVersion(version, workspace)
		// npm list finds invalid dependencies if we don't do this.
		await fs.promises.rm(path.join(workspace.directory, "node_modules"), { recursive: true })
	}

	for (const workspace of workspaces) {
		const dependency = workspace.name
		await updateDependencyForWorkspaces(version, dependency, workspaces)
	}
}

/**
 * @param version {string}
 * @param workspace {Workspace}
 * @return {Promise<void>}
 */
async function bumpWorkspaceVersion(version, workspace) {
	await $`npm version --no-git-tag-version --workspace=${workspace.name} ${version}`
}

/**
 * @param directory {string}
 * @return {Promise<any>}
 */
async function readPackageJsonFromDir(directory) {
	const packageJsonPath = path.join(directory, "package.json")
	const packageJsonContents = await fs.promises.readFile(packageJsonPath, { encoding: "utf8" })
	return JSON.parse(packageJsonContents)
}

/**
 * @param version {string}
 * @param dependency {string}
 * @param workspaces {Workspace[]}
 * @return {Promise<void>}
 */
async function updateDependencyForWorkspaces(version, dependency, workspaces) {
	await updateDependency({ version, dependency, directory: "." })
	for (const workspace of workspaces) {
		const directory = workspace.directory
		await updateDependency({ version, dependency, directory })
	}
}

/**
 * @param version {string}
 * @param dependency {string}
 * @param directory {string}
 * @return {Promise<void>}
 */
async function updateDependency({ version, dependency, directory }) {
	const packageJson = await readPackageJsonFromDir(directory)

	if (packageJson.dependencies && dependency in packageJson.dependencies) {
		packageJson.dependencies[dependency] = version
	}

	if (packageJson.devDependencies && dependency in packageJson.devDependencies) {
		packageJson.devDependencies[dependency] = version
	}

	await fs.promises.writeFile(path.join(directory, "package.json"), JSON.stringify(packageJson, null, "\t"), { encoding: "utf8" })
}
