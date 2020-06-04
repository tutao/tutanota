import path from "path"
import Promise from "bluebird"
import fs from "fs-extra"

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
