import path from "path"
import {spawn} from "child_process"
import type {Rectangle} from "electron"
import {app} from "electron"
import {defer, delay, noOp, uint8ArrayToHex} from "@tutao/tutanota-utils"
import {log} from "./DesktopLog"
import {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import {fileExists, swapFilename} from "./PathUtils"
import url from "url"
import {makeRegisterKeysScript, makeUnregisterKeysScript, RegistryRoot} from "./reg-templater"
import type {ElectronExports, FsExports} from "./ElectronExportTypes";
import {DataFile} from "../api/common/DataFile";
import {ProgrammingError} from "../api/common/error/ProgrammingError"

export class DesktopUtils {
	private readonly topLevelDownloadDir: string = "tutanota"

	constructor(
		private readonly fs: FsExports,
		private readonly electron: ElectronExports,
		private readonly desktopCrypto: DesktopCryptoFacade
	) {
	}

	checkIsMailtoHandler(): Promise<boolean> {
		return Promise.resolve(app.isDefaultProtocolClient("mailto"))
	}

	checkIsPerUserInstall(): Promise<boolean> {
		const markerPath = swapFilename(process.execPath, "per_user")
		return fileExists(markerPath)
	}

	/**
	 * open and close a file to make sure it exists
	 * @param path: the file to touch
	 */
	touch(path: string): void {
		this.fs.closeSync(this.fs.openSync(path, "a"))
	}

	/**
	 * try to read a file into a DataFile. return null if it fails.
	 * @param uriOrPath a file path or a file URI to read the data from
	 * @returns {Promise<null|DataFile>}
	 */
	async readDataFile(uriOrPath: string): Promise<DataFile | null> {
		try {
			uriOrPath = url.fileURLToPath(uriOrPath)
		} catch (e) {
			// the thing already was a path, or at least not an URI
		}

		try {
			const data = await this.fs.promises.readFile(uriOrPath)
			const name = path.basename(uriOrPath)
			return {
				_type: "DataFile",
				data,
				name,
				mimeType: "application/octet-stream",
				size: data.length,
				id: undefined,
			}
		} catch (e) {
			return null
		}
	}

	async registerAsMailtoHandler(): Promise<void> {
		log.debug("trying to register mailto...")

		switch (process.platform) {
			case "win32":
				await this.doRegisterMailtoOnWin32WithCurrentUser()
				break
			case "darwin":
				const didRegister = app.setAsDefaultProtocolClient("mailto")
				if (!didRegister) {
					throw new Error("Could not register as mailto handler")
				}
				break
			case "linux":
				throw new Error("Registering protocols on Linux does not work")
			default:
				throw new Error(`Invalid process.platform: ${process.platform}`)
		}
	}

	async unregisterAsMailtoHandler(): Promise<void> {
		log.debug("trying to unregister mailto...")
		switch (process.platform) {
			case "win32":
				await this.doUnregisterMailtoOnWin32WithCurrentUser()
				break
			case "darwin":
				const didUnregister = app.removeAsDefaultProtocolClient("mailto")
				if (!didUnregister) {
					throw new Error("Could not unregister as mailto handler")
				}
				break
			case "linux":
				throw new Error("Registering protocols on Linux does not work")
			default:
				throw new Error(`Invalid process.platform: ${process.platform}`)
		}
	}

	/**
	 * reads the lockfile and then writes the own version into the lockfile
	 * @returns {Promise<boolean>} whether the lock was overridden by another version
	 */
	singleInstanceLockOverridden(): Promise<boolean> {
		const lockfilePath = getLockFilePath()
		return this.fs.promises
				   .readFile(lockfilePath, "utf8")
				   .then(version => {
					   return this.fs.promises.writeFile(lockfilePath, app.getVersion(), "utf8").then(() => version !== app.getVersion())
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
		return this.fs.promises
				   .writeFile(lockfilePath, app.getVersion(), "utf8")
				   .catch(noOp)
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
	 * this will silently fail if we're not admin.
	 * @param script: source of the registry script
	 * @private
	 */
	private async _executeRegistryScript(script: string): Promise<void> {
		const deferred = defer<void>()

		const file = await this._writeToDisk(script)

		spawn("reg.exe", ["import", file], {
			stdio: ["ignore", "inherit", "inherit"],
			detached: false,
		}).on("exit", (code, signal) => {
			this.fs.unlinkSync(file)

			if (code === 0) {
				deferred.resolve(undefined)
			} else {
				deferred.reject(new Error("couldn't execute registry script"))
			}
		})
		return deferred.promise
	}

	/**
	 * Writes contents with a random file name into the tmp directory
	 * @param contents
	 * @returns path to the written file
	 */
	private async _writeToDisk(contents: string): Promise<string> {
		const filename = uint8ArrayToHex(this.desktopCrypto.randomBytes(12))
		const tmpPath = this.getTutanotaTempPath("reg")
		await this.fs.promises.mkdir(tmpPath, {recursive: true})
		const filePath = path.join(tmpPath, filename)

		await this.fs.promises.writeFile(filePath, contents, {
			encoding: "utf-8",
			mode: 0o400,
		})

		return filePath
	}

	async doRegisterMailtoOnWin32WithCurrentUser(): Promise<void> {
		if (process.platform !== "win32") {
			throw new ProgrammingError("Not win32")
		}
		// any app that wants to use tutanota over MAPI needs to know which dll to load.
		// additionally, the DLL needs to know
		// * which tutanota executable to start (per-user/per-machine/snapshot/test/release)
		// * where to log (this depends on the current user -> %USERPROFILE%)
		// * where to put tmp files (also user-dependent)
		// all these must be set in the registry
		const execPath = process.execPath
		const dllPath = swapFilename(execPath, "mapirs.dll")
		// we may be a per-machine installation that's used by multiple users, so the dll will replace %USERPROFILE%
		// with the value of the USERPROFILE env var.
		const appData = path.join("%USERPROFILE%", "AppData")
		const logPath = path.join(appData, "Roaming", app.getName(), "logs")
		const tmpPath = path.join(appData, "Local", "Temp", this.topLevelDownloadDir, "attach")
		const tmpRegScript = makeRegisterKeysScript(RegistryRoot.CURRENT_USER, {execPath, dllPath, logPath, tmpPath})
		await this._executeRegistryScript(tmpRegScript)
		app.setAsDefaultProtocolClient("mailto")
		await this._openDefaultAppsSettings()
	}

	async doUnregisterMailtoOnWin32WithCurrentUser(): Promise<void> {
		if (process.platform !== "win32") {
			throw new ProgrammingError("Not win32")
		}
		app.removeAsDefaultProtocolClient('mailto')
		const tmpRegScript = makeUnregisterKeysScript(RegistryRoot.CURRENT_USER)
		await this._executeRegistryScript(tmpRegScript)
		await this._openDefaultAppsSettings()
	}

	private async _openDefaultAppsSettings(): Promise<void> {
		try {
			await this.electron.shell.openExternal("ms-settings:defaultapps")
		} catch (e) {
			// ignoring, this is just a convenience for the user
			console.error("failed to open default apps settings page:", e.message)
		}
	}

	/**
	 * Get a path to a directory under tutanota's temporary directory. Will not create if it doesn't exist
	 * @param subdirs
	 * @returns {string}
	 */
	getTutanotaTempPath(...subdirs: string[]): string {
		return path.join(this.electron.app.getPath("temp"), this.topLevelDownloadDir, ...subdirs)
	}
}

function getLockFilePath() {
	// don't get temp dir path from DesktopDownloadManager because the path returned from there may be deleted at some point,
	// we want to put the lockfile in root tmp so it persists
	return path.join(app.getPath("temp"), "tutanota_desktop_lockfile")
}

export function isRectContainedInRect(closestRect: Rectangle, lastBounds: Rectangle): boolean {
	return (
		lastBounds.x >= closestRect.x - 10 &&
		lastBounds.y >= closestRect.y - 10 &&
		lastBounds.width + lastBounds.x <= closestRect.width + 10 &&
		lastBounds.height + lastBounds.y <= closestRect.height + 10
	)
}