/**
 * Utility to download/update the dictionaries used for translations within the app.
 */
import path from "node:path"
import { exitOnFail, getDefaultDistDirectory } from "./buildUtils.js"
import { spawnSync } from "node:child_process"
import fs from "fs-extra"
import "zx/globals"
import { getElectronVersion } from "./getInstalledModuleVersion.js"
import { Command } from "commander"
import * as JSZip from "jszip"

type FetchDictionariesOptions = {
	outDir: string
	publish: boolean
}
export const fetchDictionariesCmd = new Command("fetch-dictionaries")
	.usage("[options]")
	.description("Utility to update the app dictionaries")
	.option("--out-dir <outDir>", "Base dir of client build")
	.option("--publish", "Build and publish .deb package for dictionaries.")
	.action(run)
	.parse(process.argv)

async function run(options: FetchDictionariesOptions) {
	const outDir = typeof options.outDir !== "undefined" ? options.outDir : getDefaultDistDirectory()
	const publishDictionaries = typeof options.publish !== "undefined" ? options.publish : false

	await getDictionaries(outDir)
		.then(async () => {
			console.log("Dictionaries updated successfully")
			if (publishDictionaries) {
				await publishDebPackage()
			}
			process.exit()
		})
		.catch((e) => {
			console.log("Fetching dictionaries failed: ", e)
			process.exit(1)
		})
}

/**
 *
 * @param outDir
 * @returns {Promise<*>}
 */
async function getDictionaries(outDir: string) {
	const electronVersion = await getElectronVersion()
	const targetPath = path.join(outDir, "dictionaries")
	return fetchDictionaries(electronVersion, targetPath)
}

async function publishDebPackage() {
	const commonArgs = `-f -s dir -t deb --deb-user tutadb --deb-group tutadb`
	const target = `/opt/tutanota`
	const electronVersion = await getElectronVersion()
	const deb = `tutanota-desktop-dicts_${electronVersion}_amd64.deb`

	console.log("create", deb)
	exitOnFail(
		spawnSync(
			"/usr/local/bin/fpm",
			`${commonArgs} -n tutanota-desktop-dicts -v ${electronVersion} dictionaries/=${target}-desktop/dictionaries`.split(" "),
			{
				cwd: "build",
				stdio: [process.stdin, process.stdout, process.stderr],
			},
		),
	)

	// copy spell checker dictionaries.
	console.log("copying dictionaries")
	exitOnFail(
		spawnSync("/bin/cp", `-f build/${deb} /opt/repository/tutanota/`.split(" "), {
			stdio: [process.stdin, process.stdout, process.stderr],
		}),
	)
	exitOnFail(
		spawnSync("/bin/chmod", `o+r /opt/repository/tutanota/${deb}`.split(" "), {
			stdio: [process.stdin, process.stdout, process.stderr],
		}),
	)
}

/**
 * get the electron spell check dictionaries from the github release page.
 * @param electronVersion {string} which dictionaries to fetch
 * @param target the target folder for the dictionaries
 * @returns {Promise<*>}
 */
export async function fetchDictionaries(electronVersion: string, target: string) {
	console.log("downloading dictionaries into:", target)
	const url = `https://github.com/electron/electron/releases/download/v${electronVersion}/hunspell_dictionaries.zip`
	const jszip = await import("jszip")
	await fs.promises.mkdir(target, { recursive: true })
	const zipArchive: JSZip = await fetch(url).then(jszip.default.loadAsync as any)
	for (const name of Object.keys(zipArchive.files)) {
		const contents = await zipArchive.files[name].async("nodebuffer")
		await fs.promises.writeFile(path.join(target, name.toLowerCase()), contents)
	}
}

async function fetch(url: string) {
	const https = await import("node:https")
	return new Promise((resolve, reject) => {
		const data = new Array<Uint8Array>()

		// using setTimeout because .on('timeout', handler) is
		// a connection timeout, once the connection stands it
		// can take as long as it wants.
		const to = setTimeout(() => {
			request.abort()
			reject(`download of ${url} timed out`)
		}, 60000)

		const request = https
			.get(url, (response) => {
				if (response.statusCode === 302) {
					fetch(response.headers.location!)
						.then((...args) => {
							clearTimeout(to)
							resolve(...args)
						})
						.catch((...args) => {
							clearTimeout(to)
							reject(...args)
						})
				} else if (response.statusCode === 200) {
					response
						.on("data", (c) => data.push(c))
						.on("end", () => {
							clearTimeout(to)
							resolve(Buffer.concat(data))
						})
				} else {
					clearTimeout(to)
					reject("Couldn't fetch: " + url + ", got " + response.statusCode)
				}
			})
			.on("error", (err) => {
				clearTimeout(to)
				reject(err.message)
			})
	})
}
