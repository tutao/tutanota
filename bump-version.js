#!/usr/bin/env node

const options = require('commander')
const {spawnSync} = require("child_process")
const fs = require("fs")

options
	.usage('<minor|patch>', "major.minor.patch, default is patch")
	.arguments('<which>')
	.parse(process.argv)

const which = options.args[0] || "patch"
if (!["minor", "patch"].includes(which)) {
	options.outputHelp()
	process.exit(1)
}

const currentVersionString = require("./package.json").version
const currentVersion = currentVersionString.split(".").map((n) => parseInt(n, 10))
const newVersion = currentVersion.slice()
if (which === "patch") {
	newVersion[2]++
} else {
	newVersion[1]++
	newVersion[2] = 0
}
const newVersionString = newVersion.join(".")

spawnSync("npm", ["version", "--no-git-tag-version", which])

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

function pad(num, size) {
	let s = num + "";
	while (s.length < size)
		s = "0" + s;
	return s;
}

function versionToBuildNumber(version) {
	return `${version[0]}${pad(version[1], 2)}${pad(version[2], 2)}0`
}