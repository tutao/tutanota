#!/usr/bin/env node

import options from "commander"

import {spawnSync} from "child_process"
import fs from "fs"
import path from "path"

options
	.usage('<minor|patch>', "major.minor.patch, default is patch")
	.arguments('<which>')
	.parse(process.argv)

const which = options.args[0] || "patch"
if (!["minor", "patch"].includes(which)) {
	options.outputHelp()
	process.exit(1)
}

run()

async function run() {
	const currentVersionString = JSON.parse(await fs.promises.readFile("./package.json", {encoding: "utf8"})).version
	const currentVersion = currentVersionString.split(".").map((n) => parseInt(n, 10))
	const newVersion = currentVersion.slice()
	if (which === "patch") {
		newVersion[2]++
	} else {
		newVersion[1]++
		newVersion[2] = 0
	}
	const newVersionString = newVersion.join(".")

	await bumpWorkspaces({version: newVersionString})
	spawnSync("npm", ["version", "--no-git-tag-version", newVersionString])

	// Need to run npm i to update package-lock.json
	spawnSync("npm", ["i"], { stdio: "inherit"})

	const infoPlistName = "app-ios/tutanota/Info.plist"
	const infoPlistContents = fs.readFileSync(infoPlistName, "utf8")
	const newInfoPlistContents = infoPlistContents.replace(new RegExp(currentVersion.join("\\."), "g"), newVersionString)
	fs.writeFileSync(infoPlistName, newInfoPlistContents)

	const buildGradleName = "app-android/app/build.gradle"
	const newAndroidVersion = versionToBuildNumber(newVersion)
	const buildGradleString = fs.readFileSync(buildGradleName, "utf8")
	                            .replace(new RegExp(currentVersion.join("\\.")), newVersionString)
	                            .replace(new RegExp(versionToBuildNumber(currentVersion)), newAndroidVersion)
	fs.writeFileSync(buildGradleName, buildGradleString)

	console.log(`Bumped version to ${newVersionString} ${newAndroidVersion} (was ${currentVersionString})`)
}

function pad(num, size) {
	let s = num + "";
	while (s.length < size)
		s = "0" + s;
	return s;
}

function versionToBuildNumber(version) {
	return `${version[0]}${pad(version[1], 2)}${pad(version[2], 2)}0`
}

function getWorkspaceDirs() {
	const packagesDir = path.resolve("./packages")
	const relativePaths = fs.readdirSync(packagesDir)
	return relativePaths.map(relativePath => path.join(packagesDir, relativePath))
}

async function getWorkspaces() {
	const workspaces = []
	const workspaceDirs = getWorkspaceDirs();
	for (let workspaceDir of workspaceDirs) {
		const packageJson = await readPackageJsonFromDir({directory: workspaceDir})
		workspaces.push({
			name: packageJson.name,
			directory: workspaceDir,
		})
	}
	return workspaces
}

async function bumpWorkspaces({version}) {
	const workspaces = await getWorkspaces()
	for (let workspace of workspaces) {
		const dependency = workspace.name
		await bumpWorkspaceVersion({version, workspace})
		await updateDependencyForWorkspaces({version, dependency, workspaces})
	}
}

async function bumpWorkspaceVersion({version, workspace}) {
	spawnSync("npm", ["version", "--no-git-tag-version", `--workspace=${workspace.name}`, version])
}

async function readPackageJsonFromDir({directory}) {
	const packageJsonPath = path.join(directory, "package.json")
	const packageJsonContents = await fs.promises.readFile(packageJsonPath, {encoding: "utf8"})
	return JSON.parse(packageJsonContents)
}

async function updateDependencyForWorkspaces({version, dependency, workspaces}) {
	await updateDependency({version, dependency, directory: "."})
	for (let workspace of workspaces) {
		const directory = workspace.directory
		await updateDependency({directory, dependency, version})
	}
}

async function updateDependency({version, dependency, directory}) {
	const packageJson = await readPackageJsonFromDir({directory})

	if (packageJson.dependencies && dependency in packageJson.dependencies) {
		packageJson.dependencies[dependency] = version
	}

	if (packageJson.devDependencies && dependency in packageJson.devDependencies) {
		packageJson.devDependencies[dependency] = version
	}

	await fs.promises.writeFile(path.join(directory, "package.json"), JSON.stringify(packageJson, null, "\t"), {encoding: "utf8"})
}
