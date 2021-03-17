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
