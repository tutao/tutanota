/**
 * Utility to download/update the dictionaries used for translations within the app.
 */
import path from "path"
import glob from "glob"
import {exitOnFail, getDefaultDistDirectory, getElectronVersion} from "./buildUtils.js"
import {program} from "commander"
import {spawnSync} from "child_process"
import {fileURLToPath} from "url"
import fs from "fs-extra"

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	program
		.usage('[options]')
		.description('Utility to update the app dictionaries')
		.option('--out-dir <outDir>', "Base dir of client build")
		.option('--local', 'Build dictionaries for local/debug version of a desktop client')
		.option('--publish', 'Build and publish .deb package for dictionaries.')
		.action(async options => {
			const outDir = typeof options.outDir !== 'undefined' ? options.outDir : getDefaultDistDirectory()
			const local = typeof options.local !== 'undefined' ? options.local : false
			const publishDictionaries = typeof options.publish !== 'undefined' ? options.publish : false

			await getDictionaries(outDir, local)
				.then(async v => {
					console.log("Dictionaries updated successfully")
					if (publishDictionaries) {
						await publishDebPackage()
					}
					process.exit()
				})
				.catch(e => {
						console.log("Fetching dictionaries failed: ", e)
						process.exit(1)
					}
				)
		})
		.parse(process.argv)

}

/**
 *
 * @param outDir
 * @param local If true, dictionaries will also be built for debug desktop clients. If false, they will be only built for the production app.
 * @returns {Promise<*>}
 */
async function getDictionaries(outDir, local) {
	const electronVersion = getElectronVersion()
	const baseTarget = path.join((outDir), '..')

	const targets = local
		? glob.sync(path.join(baseTarget, 'desktop*'))
		: [baseTarget]
	const targetPaths = targets.map(d => path.join(d, "dictionaries"))
	return fetchDictionaries(electronVersion, targetPaths)
}

async function publishDebPackage() {
	const commonArgs = `-f -s dir -t deb --deb-user tutadb --deb-group tutadb`
	const target = `/opt/tutanota`
	const electronVersion = getElectronVersion()
	const deb = `tutanota-desktop-dicts_${electronVersion}_amd64.deb`

	console.log("create " + debs.dict)
	exitOnFail(spawnSync("/usr/local/bin/fpm", `${commonArgs} -n tutanota-desktop-dicts -v ${electronVersion} dictionaries/=${target}-desktop/dictionaries`.split(" "), {
		cwd: __dirname + "/build",
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	// copy spell checker dictionaries.
	console.log("copying dictionaries")
	exitOnFail(spawnSync("/bin/cp", `-f build/${deb} /opt/repository/tutanota/`.split(" "), {
		cwd: __dirname,
		stdio: [process.stdin, process.stdout, process.stderr]
	}))
	exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/tutanota/${deb}`.split(" "), {
		stdio: [process.stdin, process.stdout, process.stderr]
	}))
}


/**
 * get the electron spell check dictionaries from the github release page.
 * @param electronVersion {string} which dictionaries to fetch
 * @param targets {Array<string>} the target folders for the dictionaries
 * @returns {Promise<*>}
 */
export async function fetchDictionaries(electronVersion, targets) {
	console.log("downloading dictionaries into:\n", targets.join("\n"))
	const url = `https://github.com/electron/electron/releases/download/v${electronVersion}/hunspell_dictionaries.zip`
	const jszip = await import('jszip')
	return Promise.all([
		fetch(url).then(jszip.default.loadAsync),
		...targets.map(t => fs.mkdirp(t).then(() => t))
	]).then(([zipArchive]) => {
		// async extract each file in the archive
		const zipFilePromises = Object.keys(zipArchive.files).map(name => {
			// write each of them into each of the target locations
			return zipArchive.file(name).async('nodebuffer').then(contents => {
				return Promise.all(targets.map(target => fs.writeFile(path.join(target, name.toLowerCase()), contents)))
			})
		})
		return Promise.all(zipFilePromises)
	})
}

async function fetch(url) {
	const https = await import('https')
	return new Promise((resolve, reject) => {
		const data = []

		// using setTimeout because .on('timeout', handler) is
		// a connection timeout, once the connection stands it
		// can take as long as it wants.
		const to = setTimeout(() => {
			request.abort()
			reject(`download of ${url} timed out`)
		}, 60000)

		const request = https.get(url, response => {
			if (response.statusCode === 302) {
				fetch(response.headers.location).then((...args) => {
					clearTimeout(to)
					resolve(...args)
				}).catch((...args) => {
					clearTimeout(to)
					reject(...args)
				})
			} else if (response.statusCode === 200) {
				response.on('data', c => data.push(c)).on('end', () => {
					clearTimeout(to)
					resolve(Buffer.concat(data))
				})
			} else {
				clearTimeout(to)
				reject("Couldn't fetch: " + url + ", got " + response.statusCode)
			}
		}).on('error', err => {
			clearTimeout(to)
			reject(err.message)
		})
	})
}
