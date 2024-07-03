import path from "node:path"
import { spawn } from "node:child_process"
import type { Rectangle } from "electron"
import { app, NativeImage } from "electron"
import { defer, delay } from "@tutao/tutanota-utils"
import { log } from "./DesktopLog"
import { swapFilename } from "./PathUtils"
import { makeRegisterKeysScript, makeUnregisterKeysScript, RegistryRoot } from "./reg-templater"
import { ProgrammingError } from "../api/common/error/ProgrammingError"
import { getResourcePath } from "./resources.js"
import { TempFs } from "./files/TempFs.js"
import { ElectronExports } from "./ElectronExportTypes.js"
import { WindowManager } from "./DesktopWindowManager.js"

export class DesktopUtils {
	private mailtoArg: string | null

	constructor(argv: Array<string>, private readonly tfs: TempFs, private readonly electron: ElectronExports) {
		this.mailtoArg = findMailToUrlInArgv(process.argv)
	}

	/**
	 * make sure we are allowed to take single-instance lock and clear up remaining tmp data
	 * from previous runs if so.
	 *
	 * @returns true if there is no other instance or we managed to steal the lock
	 */
	async cleanupOldInstance(): Promise<boolean> {
		if (!(await this.makeSingleInstance())) return false
		// doesn't clear tmp if:
		// * we're a second instance, the main instance may be using the tmp (we returned by now)
		// * there's a mailto link in the cli args, attachments may be located in the tmp
		if (this.mailtoArg == null) this.tfs.clear()
		return true
	}

	checkIsMailtoHandler(): boolean {
		return this.electron.app.isDefaultProtocolClient("mailto")
	}

	async registerAsMailtoHandler(): Promise<void> {
		log.debug("trying to register mailto...")

		switch (process.platform) {
			case "win32":
				await this.doRegisterMailtoOnWin32WithCurrentUser()
				break
			case "darwin":
				const didRegister = this.electron.app.setAsDefaultProtocolClient("mailto")
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
				const didUnregister = this.electron.app.removeAsDefaultProtocolClient("mailto")
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
	async makeSingleInstance(): Promise<boolean> {
		const isOnlyInstance = await this.tfs.acquireSingleInstanceLock()
		if (isOnlyInstance) {
			return true
		}
		// the other instance will decide if it's going to terminate and override
		// the lock again in this time.
		await delay(1500)
		const otherInstanceWillTerminate = await this.tfs.singleInstanceLockOverridden()
		if (otherInstanceWillTerminate) {
			this.electron.app.requestSingleInstanceLock()
		} else {
			this.electron.app.quit()
		}

		return otherInstanceWillTerminate
	}

	/**
	 * after we receive notification about another app instance being started, we need to decide
	 * whether to quit or continue and if we do the latter, handle that instance's cli args and/or
	 * create a new window.
	 */
	async handleSecondInstance(wm: WindowManager, args: Array<string>): Promise<void> {
		const otherInstanceMailToArg = findMailToUrlInArgv(args)
		if (await this.tfs.singleInstanceLockOverridden()) {
			app.quit()
		} else {
			if (wm.getAll().length === 0) {
				await wm.newWindow(true)
			} else {
				for (const w of wm.getAll()) w.show()
			}

			await this.handleMailto(wm, otherInstanceMailToArg)
		}
	}

	/**
	 * this will silently fail if we're not admin.
	 * @param script: source of the registry script
	 * @private
	 */
	private async executeRegistryScript(script: string): Promise<void> {
		const deferred = defer<void>()

		const file = await this.tfs.writeToDisk(script, "reg", {
			encoding: "utf-8",
			// read only by owner, because the most we're doing with this is
			// passing it to reg.exe and then delete it
			mode: 0o400,
		})

		spawn("reg.exe", ["import", file], {
			stdio: ["ignore", "inherit", "inherit"],
			detached: false,
		}).on("exit", (code, _signal) => {
			this.tfs.clearTmpSub("reg")

			if (code === 0) {
				deferred.resolve(undefined)
			} else {
				deferred.reject(new Error("couldn't execute registry script"))
			}
		})
		return deferred.promise
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
		const logPath = path.join(appData, "Roaming", this.electron.app.getName(), "logs")
		const tmpPath = path.join(this.tfs.getTutanotaTempPath(), "attach")
		const tmpRegScript = makeRegisterKeysScript(RegistryRoot.CURRENT_USER, { execPath, dllPath, logPath, tmpPath })
		await this.executeRegistryScript(tmpRegScript)
		this.electron.app.setAsDefaultProtocolClient("mailto")
		await this._openDefaultAppsSettings()
	}

	async doUnregisterMailtoOnWin32WithCurrentUser(): Promise<void> {
		if (process.platform !== "win32") {
			throw new ProgrammingError("Not win32")
		}
		this.electron.app.removeAsDefaultProtocolClient("mailto")
		const tmpRegScript = makeUnregisterKeysScript(RegistryRoot.CURRENT_USER)
		await this.executeRegistryScript(tmpRegScript)
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

	getIconByName(iconName: string): NativeImage {
		const iconPath = getResourcePath(`icons/${iconName}`)
		return this.electron.nativeImage.createFromPath(iconPath)
	}

	async handleMailto(wm: WindowManager, mailToArg = this.mailtoArg) {
		if (mailToArg) {
			const w = await wm.getLastFocused(true)
			return w.commonNativeFacade.createMailEditor(/* filesUris */ [], /* text */ "", /* addresses */ [], /* subject */ "", /* mailtoURL */ mailToArg)
		}
	}
}

export function isRectContainedInRect(closestRect: Rectangle, lastBounds: Rectangle): boolean {
	return (
		lastBounds.x >= closestRect.x - 10 &&
		lastBounds.y >= closestRect.y - 10 &&
		lastBounds.width + lastBounds.x <= closestRect.width + 10 &&
		lastBounds.height + lastBounds.y <= closestRect.height + 10
	)
}

function findMailToUrlInArgv(argv: string[]): string | null {
	return argv.find((arg) => arg.startsWith("mailto")) ?? null
}
