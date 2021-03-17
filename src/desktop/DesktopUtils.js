// @flow
import path from 'path'
import {exec, spawn} from 'child_process'
import {promisify} from 'util'
import {closeSync, openSync, promises as fs, readFileSync, unlinkSync, writeFileSync} from "fs"
import {app} from 'electron'
import {defer} from '../api/common/utils/Utils.js'
import {noOp} from "../api/common/utils/Utils"
import {log} from "./DesktopLog"
import {uint8ArrayToHex} from "../api/common/utils/Encoding"
import {cryptoFns} from "./CryptoFns"


import {delay} from "../api/common/utils/PromiseUtils"

export class DesktopUtils {
	checkIsMailtoHandler(): Promise<boolean> {
		return Promise.resolve(app.isDefaultProtocolClient("mailto"))
	}

	/**
	 * open and close a file to make sure it exists
	 * @param path: the file to touch
	 */
	touch(path: string): void {
		closeSync(openSync(path, 'a'))
	}

	registerAsMailtoHandler(tryToElevate: boolean): Promise<void> {
		log.debug("trying to register...")
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

	unregisterAsMailtoHandler(tryToElevate: boolean): Promise<void> {
		log.debug("trying to unregister...")
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

	/**
	 * reads the lockfile and then writes the own version into the lockfile
	 * @returns {Promise<boolean>} whether the lock was overridden by another version
	 */
	singleInstanceLockOverridden(): Promise<boolean> {
		const lockfilePath = getLockFilePath()
		return fs.readFile(lockfilePath, 'utf8')
		         .then(version => {
			         return fs.writeFile(lockfilePath, app.getVersion(), 'utf8')
			                  .then(() => version !== app.getVersion())
		         })
		         .catch(() => false)
	}

	/**
	 * checks that there's only one instance running while
	 * allowing different versions to steal the single instance lock
	 * from each other.
	 *
	 * should the lock file be unwritable/unreadable, behaves as if all
	 * running instances have the same version, effectively restoring the
	 * default single instance lock behaviour.
	 *
	 * @returns {Promise<boolean>} whether the app was successful in getting the lock
	 */
	makeSingleInstance(): Promise<boolean> {
		const lockfilePath = getLockFilePath()
		// first, put down a file in temp that contains our version.
		// will overwrite if it already exists.
		// errors are ignored and we fall back to a version agnostic single instance lock.
		return fs.writeFile(lockfilePath, app.getVersion(), 'utf8').catch(noOp)
		         .then(() => {
			         // try to get the lock, if there's already an instance running,
			         // give the other instance time to see if it wants to release the lock.
			         // if it changes the version back, it was a different version and
			         // will terminate itself.
			         return app.requestSingleInstanceLock()
				         ? Promise.resolve(true)
				         : delay(1500)
					         .then(() => this.singleInstanceLockOverridden())
					         .then(canStay => {
						         if (canStay) {
							         app.requestSingleInstanceLock()
						         } else {
							         app.quit()
						         }
						         return canStay
					         })
		         })
	}

	/**
	 * calls the callback if the ready event was already fired,
	 * registers it as an event listener otherwise
	 * @param callback listener to call
	 */
	callWhenReady(callback: ()=>void): void {
		if (app.isReady()) {
			callback()
		} else {
			app.once('ready', callback)
		}


	}
}

const singleton: DesktopUtils = new DesktopUtils()
export default singleton

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

function getLockFilePath() {
	// don't get temp dir path from DesktopDownloadManager because the path returned from there may be deleted at some point,
	// we want to put the lockfile in root tmp so it persists
	return path.join(app.getPath('temp'), 'tutanota_desktop_lockfile')
}

/**
 * Writes contents with a random file name into the directory of the executable
 * @param contents
 * @returns {*} path  to the written file
 * @private
 */
function _writeToDisk(contents: string): string {
	const filename = randomHexString(12)
	const filePath = path.join(path.dirname(process.execPath), filename)
	writeFileSync(filePath, contents, {encoding: 'utf-8', mode: 0o400})
	return filePath
}

export function randomHexString(byteLength: number): string {
	return uint8ArrayToHex(cryptoFns.randomBytes(byteLength))
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
	const file = _writeToDisk(script)
	spawn('reg.exe', ['import', file], {
		stdio: ['ignore', 'inherit', 'inherit'],
		detached: false
	}).on('exit', (code, signal) => {
		unlinkSync(file)
		if (code === 0) {
			deferred.resolve()
		} else {
			deferred.reject(new Error("couldn't execute registry script"))
		}
	})
	return deferred.promise
}


async function _registerOnWin() {
	const tmpRegScript = (await import('./reg-templater.js')).registerKeys(process.execPath)
	return _executeRegistryScript(tmpRegScript)
		.then(() => {
			app.setAsDefaultProtocolClient('mailto')
		})
}

async function _unregisterOnWin() {
	app.removeAsDefaultProtocolClient('mailto')
	const tmpRegScript = (await import('./reg-templater.js')).unregisterKeys()
	return _executeRegistryScript(tmpRegScript)
}

export function readJSONSync(absolutePath: string): {[string]: mixed} {
	return JSON.parse(readFileSync(absolutePath, {encoding: "utf8"}))
}

export const EML_DRAG_ICON_B64 = "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"
export const MSG_DRAG_ICON_B64 = "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"