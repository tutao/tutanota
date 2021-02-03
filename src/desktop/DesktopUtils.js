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

import {legalizeFilenames} from "./PathUtils"
import {AttachmentType, Email, MessageEditorFormat} from "oxmsg"
import {delay} from "../api/common/utils/PromiseUtils"
import type {MailBundle} from "../mail/export/Bundler";

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

	/**
	 * Writes files to a new dir in tmp
	 * @param files Array of named content to write to tmp
	 * @returns {string} path to the directory in which the files were written
	 * */
	// TODO The files are no longer being deleted, as we need them to persist in order for the user to be able to presented them
	// in their file explorer of choice. Do we need to set up some hook to delete it all later? or should we just count on the OS
	// to do it's thing
	async writeFilesToTmp(files: Array<{name: string, content: Uint8Array}>): Promise<string> {
		const dirPath = path.join(app.getPath('temp'), 'tutanota', randomHexString(12))
		const legalNames = legalizeFilenames(files.map(f => f.name))
		const legalFiles = files.map(f => ({
			content: f.content,
			name: legalNames[f.name].shift()
		}))
		await fs.mkdir(dirPath, {recursive: true})
		for (let file of legalFiles) {
			await fs.writeFile(path.join(dirPath, file.name), file.content)
		}
		return dirPath
	}

	async makeMsgFile(bundle: MailBundle): Promise<{name: string, content: Uint8Array}> {
		const subject = `[Tutanota] ${bundle.subject}`
		const email = new Email(bundle.isDraft, bundle.isRead)
			.subject(subject)
			.bodyHtml(bundle.body)
			.bodyFormat(MessageEditorFormat.EDITOR_FORMAT_HTML)
			.sender(bundle.sender.address, bundle.sender.name)
			.tos(bundle.to)
			.ccs(bundle.cc)
			.bccs(bundle.bcc)
			.replyTos(bundle.replyTo)
			.sentOn(new Date(bundle.sentOn))
			.receivedOn(new Date(bundle.receivedOn))
			.headers(bundle.headers || "")

		for (let attachment of bundle.attachments) {
			// When the MailBundle gets passed over via the IPC it loses some of it's type information. the Uint8Arrays stored in the
			// attachment DataFiles cease to be Uint8Arrays and just because regular arrays, thus we have to remake them here.
			// Oxmsg currently doesn't accept regular arrays for binary data, only Uint8Arrays, strings and booleans
			// we could change the Oxmsg behaviour, it's kind of nice for it to be strict though.
			email.attach(new Uint8Array(attachment.data), attachment.name, attachment.cid || "", AttachmentType.ATTACH_BY_VALUE)
		}

		return {name: `${subject}_export.msg`, content: email.msg()}
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

function randomHexString(byteLength: number): string {
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

