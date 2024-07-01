/**
 * This file contains utilities used to generate the version number for the client.
 */
import fs from "node:fs"

/**
 * Calculates the current ond new client version.
 */
export async function calculateClientVersions() {
	const currentVersionString = await readCurrentVersion()
	const currentVersion = parseCurrentVersion(currentVersionString)
	const newVersion = makeNewVersion(currentVersion)
	const newVersionString = newVersion.join(".")

	return { currentVersion, currentVersionString, newVersion, newVersionString }
}

/**
 * Reads the current version from the package.json file.
 * @returns Promise<any>
 */
async function readCurrentVersion() {
	return JSON.parse(await fs.promises.readFile("./package.json", { encoding: "utf8" })).version
}

/**
 * @param currentVersionString {string}
 * @return {number[]}
 */
function parseCurrentVersion(currentVersionString) {
	return currentVersionString.split(".").map((n) => parseInt(n, 10))
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
 * Read versions of all models from generated ModelInfos.
 * @returns {number[]}
 */
function readModelVersions() {
	const appNames = fs.readdirSync("./src/common/api/entities/")
	return appNames.map((appName) => {
		const modelInfoString = fs.readFileSync(`./src/common/api/entities/${appName}/ModelInfo.ts`, { encoding: "utf8" })
		const versionPrefix = "version:"
		const versionNumberStart = modelInfoString.indexOf(versionPrefix) + versionPrefix.length
		const version = modelInfoString.substring(versionNumberStart, modelInfoString.indexOf(",", versionNumberStart))
		console.log(` > ${appName} version ${version}`)
		return parseInt(version, 10)
	})
}
