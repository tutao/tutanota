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
