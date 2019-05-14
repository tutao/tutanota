// @flow
import * as url from 'url'
import path from 'path'
import {exec, spawn} from 'child_process'
import {promisify} from 'util'
import fs from "fs-extra"
import crypto from 'crypto'
import {app} from 'electron'
import {defer} from '../api/common/utils/Utils.js'

export default class DesktopUtils {

	/**
	 * @param pathToConvert absolute Path to a file
	 * @returns {string} file:// URL that can be extended with query parameters and loaded with BrowserWindow.loadURL()
	 */
	static pathToFileURL(pathToConvert: string): string {
		pathToConvert = pathToConvert
			.trim()
			.split(path.sep)
			.map((fragment) => encodeURIComponent(fragment))
			.join("/")
		const extraSlashForWindows = process.platform === "win32" && pathToConvert !== ''
			? "/"
			: ""
		let urlFromPath = url.format({
			pathname: extraSlashForWindows + pathToConvert.trim(),
			protocol: 'file:'
		})

		return urlFromPath.trim()
	}

	/**
	 * find the first filename not already contained in directory
	 * ATTENTION: doesn't take concurrent access into account
	 * there are tests for this function.
	 * @returns {string} the basename appended with '-<first non-clashing positive number>.<ext>
	 */
	static nonClobberingFilename(files: Array<string>, fileName: string): string {
		const clashingFile = files.find(f => f === fileName)
		if (typeof clashingFile !== "string") { // all is well
			return fileName
		} else { // there are clashing file names
			const ext = path.extname(fileName)
			const basename = path.basename(fileName, ext)
			const clashNumbers = files
				.filter(f => f.startsWith(`${basename}-`))
				.map(f => f.slice(0, f.length - ext.length))
				.map(f => f.slice(basename.length + 1, f.length))
				.map(f => !f.startsWith('0') ? parseInt(f, 10) : 0)
				.filter(n => !isNaN(n) && n > 0)
			const clashNumbersSet = new Set(clashNumbers)
			clashNumbersSet.add(0)

			// if a number is bigger than its index, there is room somewhere before that number
			const firstGap = [...clashNumbersSet]
				.sort((a, b) => a - b)
				.find((n, i, a) => a[i + 1] > i + 1) + 1

			return !isNaN(firstGap)
				? `${basename}-${firstGap}${ext}`
				: `${basename}-${clashNumbersSet.size}${ext}`
		}
	}

	static checkIsMailtoHandler(): Promise<boolean> {
		return Promise.resolve(app.isDefaultProtocolClient("mailto"))
	}

	static registerAsMailtoHandler(tryToElevate: boolean): Promise<void> {
		console.log("trying to register...")
		switch (process.platform) {
			case "win32":
				return checkForAdminStatus()
					.then((isAdmin) => {
						if (!isAdmin && tryToElevate) {
							return _elevateWin(process.execPath, ["-r"])
						} else if (isAdmin) {
							return _registerOnWin()
						}
					})
			case "darwin":
				return app.setAsDefaultProtocolClient("mailto")
					? Promise.resolve()
					: Promise.reject()
			case "linux":
				return app.setAsDefaultProtocolClient("mailto")
					? Promise.resolve()
					: Promise.reject()
			default:
				return Promise.reject(new Error("Invalid process.platform"))
		}
	}

	static unregisterAsMailtoHandler(tryToElevate: boolean): Promise<void> {
		console.log("trying to unregister...")
		switch (process.platform) {
			case "win32":
				return checkForAdminStatus()
					.then((isAdmin) => {
						if (!isAdmin && tryToElevate) {
							return _elevateWin(process.execPath, ["-u"])
						} else if (isAdmin) {
							return _unregisterOnWin()
						}
					})
			case "darwin":
				return app.removeAsDefaultProtocolClient("mailto")
					? Promise.resolve()
					: Promise.reject()
			case "linux":
				return app.removeAsDefaultProtocolClient("mailto")
					? Promise.resolve()
					: Promise.reject()
			default:
				return Promise.reject(new Error(`invalid platform: ${process.platform}`))
		}
	}
}

/**
 * Checks if the user has admin privileges
 * @returns {Promise<boolean>} true if user has admin privileges
 */
function checkForAdminStatus(): Promise<boolean> {
	if (process.platform === 'win32') {
		return promisify(exec)('NET SESSION')
			.then(() => true)
			.catch(() => false)
	} else {
		return Promise.reject(new Error(`No NET SESSION on ${process.platform}`))
	}
}

/**
 * Writes contents to the file filename into the directory of the executable
 * @param filename
 * @param contents
 * @returns {*} path  to the written file
 * @private
 */
function _writeToDisk(filename: string, contents: string): string {
	console.log("Wrote file to ", filename)
	const filePath = path.join(path.dirname(process.execPath), filename)
	fs.writeFileSync(filePath, contents, {encoding: 'utf-8', mode: 0o400})
	return filePath
}

/**
 * uses the bundled elevate.exe to show a UAC dialog to the user and execute command with elevated permissions
 * @param command
 * @param args
 * @returns {Promise<T>}
 * @private
 */
function _elevateWin(command: string, args: Array<string>) {
	const deferred = defer()
	const elevateExe = path.join((process: any).resourcesPath, "elevate.exe")
	let elevateArgs = ["-wait", command].concat(args)
	spawn(elevateExe, elevateArgs, {
		stdio: ['ignore', 'inherit', 'inherit'],
		detached: false
	}).on('exit', (code, signal) => {
		if (code === 0) {
			deferred.resolve()
		} else {
			deferred.reject(new Error("couldn't elevate permissions"))
		}
	})
	return deferred.promise
}

/**
 * this will silently fail if we're not admin.
 * @param script: path to registry script
 * @private
 */
function _executeRegistryScript(script: string): Promise<void> {
	const deferred = defer()
	const file = _writeToDisk(crypto.randomBytes(12).toString('hex'), script)
	spawn('reg.exe', ['import', file], {
		stdio: ['ignore', 'inherit', 'inherit'],
		detached: false
	}).on('exit', (code, signal) => {
		fs.unlinkSync(file)
		if (code === 0) {
			deferred.resolve()
		} else {
			deferred.reject(new Error("couldn't execute registry script"))
		}
	})
	return deferred.promise
}


function _registerOnWin(): Promise<void> {
	const tmpRegScript = require('./reg-templater.js').registerKeys(process.execPath)
	return _executeRegistryScript(tmpRegScript)
		.then(() => {
			app.setAsDefaultProtocolClient('mailto')
		})
}

function _unregisterOnWin(): Promise<void> {
	app.removeAsDefaultProtocolClient('mailto')
	const tmpRegScript = require('./reg-templater.js').unregisterKeys()
	return _executeRegistryScript(tmpRegScript)
}
