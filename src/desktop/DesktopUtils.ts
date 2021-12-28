import path from "path"
import {exec, spawn} from "child_process"
import {promisify} from "util"
import type {Rectangle} from "electron"
import {app} from "electron"
import {defer, delay, noOp, uint8ArrayToHex} from "@tutao/tutanota-utils"
import {log} from "./DesktopLog"
import {DesktopCryptoFacade} from "./DesktopCryptoFacade"
import {fileExists, swapFilename} from "./PathUtils"
import url from "url"
import {registerKeys, unregisterKeys} from "./reg-templater"
import type {ElectronExports, FsExports} from "./ElectronExportTypes";
import {DataFile} from "../api/common/DataFile";
export class DesktopUtils {
    readonly _fs: FsExports
    readonly _electron: ElectronExports
    readonly _desktopCrypto: DesktopCryptoFacade
    readonly _topLevelDownloadDir: string = "tutanota"

    constructor(fs: FsExports, electron: ElectronExports, desktopCrypto: DesktopCryptoFacade) {
        this._fs = fs
        this._electron = electron
        this._desktopCrypto = desktopCrypto
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
        this._fs.closeSync(this._fs.openSync(path, "a"))
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
            const data = await this._fs.promises.readFile(uriOrPath)
            const name = path.basename(uriOrPath)
            return {
                _type: "DataFile",
                data,
                name,
                mimeType: "application/octet-stream",
                size: data.length,
                id: null,
            }
        } catch (e) {
            return null
        }
    }

    registerAsMailtoHandler(tryToElevate: boolean): Promise<void> {
        log.debug("trying to register...")

        switch (process.platform) {
            case "win32":
                return checkForAdminStatus().then(isAdmin => {
                    if (!isAdmin && tryToElevate) {
                        // We require admin rights in windows, so we will recursively run the tutanota client with admin privileges
                        // and then call this method again at startup of the elevated app
                        _elevateWin(process.execPath, ["-r"])
						return
                    } else if (isAdmin) {
                        return this._registerOnWin()
                    }
                })

            case "darwin":
                return app.setAsDefaultProtocolClient("mailto") ? Promise.resolve() : Promise.reject()

            case "linux":
                return app.setAsDefaultProtocolClient("mailto") ? Promise.resolve() : Promise.reject()

            default:
                return Promise.reject(new Error("Invalid process.platform"))
        }
    }

    unregisterAsMailtoHandler(tryToElevate: boolean): Promise<void> {
        log.debug("trying to unregister...")

        switch (process.platform) {
            case "win32":
                return checkForAdminStatus().then(isAdmin => {
                    if (!isAdmin && tryToElevate) {
                        _elevateWin(process.execPath, ["-u"])
						return
					} else if (isAdmin) {
                        return this._unregisterOnWin()
                    }
                })

            case "darwin":
                return app.removeAsDefaultProtocolClient("mailto") ? Promise.resolve() : Promise.reject()

            case "linux":
                return app.removeAsDefaultProtocolClient("mailto") ? Promise.resolve() : Promise.reject()

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
        return this._fs.promises
            .readFile(lockfilePath, "utf8")
            .then(version => {
                return this._fs.promises.writeFile(lockfilePath, app.getVersion(), "utf8").then(() => version !== app.getVersion())
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
        return this._fs.promises
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
     * calls the callback if the ready event was already fired,
     * registers it as an event listener otherwise
     * @param callback listener to call
     */
    callWhenReady(callback: () => unknown): void {
        if (app.isReady()) {
            callback()
        } else {
            app.once("ready", callback)
        }
    }

    /**
     * this will silently fail if we're not admin.
     * @param script: source of the registry script
     * @private
     */
    _executeRegistryScript(script: string): Promise<void> {
        const deferred = defer<void>()

        const file = this._writeToDisk(script)

        spawn("reg.exe", ["import", file], {
            stdio: ["ignore", "inherit", "inherit"],
            detached: false,
        }).on("exit", (code, signal) => {
            this._fs.unlinkSync(file)

            if (code === 0) {
                deferred.resolve(undefined)
            } else {
                deferred.reject(new Error("couldn't execute registry script"))
            }
        })
        return deferred.promise
    }

    /**
     * Writes contents with a random file name into the directory of the executable
     * @param contents
     * @returns {string} path  to the written file
     * @private
     */
    _writeToDisk(contents: string): string {
        const filename = uint8ArrayToHex(this._desktopCrypto.randomBytes(12))
        const filePath = swapFilename(process.execPath, filename)

        this._fs.writeFileSync(filePath, contents, {
            encoding: "utf-8",
            mode: 0o400,
        })

        return filePath
    }

    readJSONSync(absolutePath: string): Record<string, unknown> {
        return JSON.parse(
            this._fs.readFileSync(absolutePath, {
                encoding: "utf8",
            }),
        )
    }

    async _registerOnWin(): Promise<void> {
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
        const tmpPath = path.join(appData, "Local", "Temp", this._topLevelDownloadDir, "attach")
        const isLocal = await this.checkIsPerUserInstall()
        const tmpRegScript = registerKeys(
            {
                execPath,
                dllPath,
                logPath,
                tmpPath,
            },
            isLocal,
        )
        await this._executeRegistryScript(tmpRegScript)
        app.setAsDefaultProtocolClient("mailto")
        await this._openDefaultAppsSettings()
    }

    async _unregisterOnWin(): Promise<void> {
        app.removeAsDefaultProtocolClient("mailto")
        const isLocal = await this.checkIsPerUserInstall()
        const tmpRegScript = unregisterKeys(isLocal)
        await this._executeRegistryScript(tmpRegScript)
        await this._openDefaultAppsSettings()
    }

    async _openDefaultAppsSettings(): Promise<void> {
        try {
            await this._electron.shell.openExternal("ms-settings:defaultapps")
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
        return path.join(this._electron.app.getPath("temp"), this._topLevelDownloadDir, ...subdirs)
    }
}

/**
 * Checks if the user has admin privileges
 * @returns {Promise<boolean>} true if user has admin privileges
 */
function checkForAdminStatus(): Promise<boolean> {
    if (process.platform === "win32") {
        return promisify(exec)("NET SESSION")
            .then(() => true)
            .catch(() => false)
    } else {
        return Promise.reject(new Error(`No NET SESSION on ${process.platform}`))
    }
}

function getLockFilePath() {
    // don't get temp dir path from DesktopDownloadManager because the path returned from there may be deleted at some point,
    // we want to put the lockfile in root tmp so it persists
    return path.join(app.getPath("temp"), "tutanota_desktop_lockfile")
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
    const elevateExe = path.join((process as any).resourcesPath, "elevate.exe")
    let elevateArgs = ["-wait", command].concat(args)
    spawn(elevateExe, elevateArgs, {
        stdio: ["ignore", "inherit", "inherit"],
        detached: false,
    }).on("exit", (code, signal) => {
        if (code === 0) {
            deferred.resolve(undefined)
        } else {
            deferred.reject(new Error("couldn't elevate permissions"))
        }
    })
    return deferred.promise
}

export function isRectContainedInRect(closestRect: Rectangle, lastBounds: Rectangle): boolean {
    return (
        lastBounds.x >= closestRect.x - 10 &&
        lastBounds.y >= closestRect.y - 10 &&
        lastBounds.width + lastBounds.x <= closestRect.width + 10 &&
        lastBounds.height + lastBounds.y <= closestRect.height + 10
    )
}