import path from "node:path"
import { lang } from "../../misc/LanguageViewModel"
import type { WindowManager } from "../DesktopWindowManager"
import { log } from "../DesktopLog"
import type { DesktopIntegrator } from "./DesktopIntegrator"
import { ChildProcessExports, ElectronExports, FsExports } from "../ElectronExportTypes"
import { ExecFileException } from "node:child_process"

export class DesktopIntegratorLinux implements DesktopIntegrator {
	_electron: ElectronExports
	_fs: FsExports
	_childProcess: ChildProcessExports
	DATA_HOME: string
	CONFIG_HOME: string
	executablePath: string
	packagePath: string
	autoLaunchPath: string
	desktopFilePath: string
	iconTargetDir64: string
	iconTargetDir512: string
	iconTargetPath64: string
	iconTargetPath512: string
	iconSourcePath64: string
	iconSourcePath512: string
	nointegrationpath: string

	constructor(electron: ElectronExports, fs: FsExports, childProcess: ChildProcessExports) {
		this._electron = electron
		this._fs = fs
		this._childProcess = childProcess
		const { app } = electron
		this.DATA_HOME = process.env.XDG_DATA_HOME || path.join(app.getPath("home"), ".local/share")
		this.CONFIG_HOME = process.env.XDG_CONFIG_HOME || path.join(app.getPath("home"), ".config")
		this.executablePath = process.execPath
		this.packagePath = process.env.APPIMAGE ? process.env.APPIMAGE : process.execPath
		this.autoLaunchPath = path.join(this.CONFIG_HOME, `autostart/${app.name}.desktop`)
		this.desktopFilePath = path.join(this.DATA_HOME, `applications/${app.name}.desktop`)
		this.iconTargetDir64 = path.join(this.DATA_HOME, `icons/hicolor/64x64/apps/`)
		this.iconTargetDir512 = path.join(this.DATA_HOME, `icons/hicolor/512x512/apps/`)
		this.iconTargetPath64 = path.join(this.iconTargetDir64, `${app.name}.png`)
		this.iconTargetPath512 = path.join(this.iconTargetDir512, `${app.name}.png`)
		this.iconSourcePath64 = path.join(path.dirname(this.executablePath), `resources/icons/logo-solo-red-small.png`)
		this.iconSourcePath512 = path.join(path.dirname(this.executablePath), `resources/icons/logo-solo-red.png`)
		this.nointegrationpath = path.join(this.CONFIG_HOME, "tuta_integration/no_integration")
	}

	isAutoLaunchEnabled(): Promise<boolean> {
		return this.checkFileIsThere(this.autoLaunchPath)
	}

	isIntegrated(): Promise<boolean> {
		return this.checkFileIsThere(this.desktopFilePath)
	}

	checkFileIsThere(pathToCheck: string): Promise<boolean> {
		return this._fs.promises
			.access(pathToCheck, this._fs.constants.F_OK | this._fs.constants.W_OK | this._fs.constants.R_OK)
			.then(() => true)
			.catch(() => false)
	}

	enableAutoLaunch(): Promise<void> {
		return this.isAutoLaunchEnabled().then((enabled) => {
			if (enabled) return
			const autoLaunchDesktopEntry = `[Desktop Entry]
	Type=Application
	Version=${this._electron.app.getVersion()}
	Name=${this._electron.app.name}
	Comment=${this._electron.app.name} startup script
	Exec=${this.packagePath} -a
	StartupNotify=false
	Terminal=false`

			this._fs.mkdirSync(path.dirname(this.autoLaunchPath), {
				recursive: true,
			})

			this._fs.writeFileSync(this.autoLaunchPath, autoLaunchDesktopEntry, {
				encoding: "utf-8",
			})
		})
	}

	disableAutoLaunch(): Promise<void> {
		return this.isAutoLaunchEnabled()
			.then((enabled) => (enabled ? this._fs.promises.unlink(this.autoLaunchPath) : Promise.resolve()))
			.catch((e) => {
				// don't throw if file not found
				if (e.code !== "ENOENT") throw e
			})
	}

	async runIntegration(wm: WindowManager): Promise<void> {
		if (this.executablePath.includes("node_modules/electron/dist/electron")) return
		const integrated = await this.isIntegrated()

		if (integrated) {
			log.debug(`desktop file exists, checking version...`)
			const desktopEntryVersion = this.getDesktopEntryVersion()

			if (desktopEntryVersion !== this._electron.app.getVersion()) {
				log.debug("version mismatch, reintegrating...")
				return this.integrate()
			}
		} else {
			log.debug(`${this.desktopFilePath} does not exist, checking for permission to ask for permission...`)
			const isThere = await this.checkFileIsThere(this.nointegrationpath)

			if (isThere) {
				const forbiddenPaths = this._fs
					.readFileSync(this.nointegrationpath, {
						encoding: "utf8",
						flag: "r",
					})
					.trim()
					.split("\n")

				if (!forbiddenPaths.includes(this.packagePath)) {
					return this.askPermission()
				}
			} else {
				return this.askPermission()
			}
		}
	}

	/**
	 * returns the version number from the desktop file
	 * @returns {*}
	 */
	getDesktopEntryVersion(): string {
		const versionLine =
			this._fs
				.readFileSync(this.desktopFilePath, "utf8")
				.split("\n")
				.find((s) => s.includes("X-Tutanota-Version")) || "=0.0.0"
		return versionLine.split("=")[1]
	}

	integrate(): Promise<void> {
		const prefix = this._electron.app.name.includes("test") ? "test " : ""
		return this.copyIcons()
			.then(() => this.createDesktopEntry(prefix))
			.then(() => {
				if (process.env["XDG_CURRENT_DESKTOP"] !== "GNOME") return

				try {
					this._childProcess.execFile(
						"update-desktop-database",
						[path.join(this._electron.app.getPath("home"), ".local/share/applications")],
						logExecFile,
					)
				} catch (e) {}
			})
	}

	unintegrate(): Promise<void> {
		return Promise.all([this._fs.promises.unlink(this.iconTargetPath64), this._fs.promises.unlink(this.iconTargetPath512)])
			.catch((e) => {
				if (!e.message.startsWith("ENOENT")) {
					throw e
				}
			})
			.then(() => this._fs.promises.unlink(this.desktopFilePath))
			.catch((e) => {
				if (!e.message.startsWith("ENOENT")) {
					throw e
				}
			})
	}

	createDesktopEntry(prefix: string): Promise<void> {
		const desktopEntry = `[Desktop Entry]
Name=${prefix}Tuta Mail
Comment=The desktop client for Tuta Mail, the secure e-mail service.
GenericName=Mail Client
Keywords=Email;E-mail
Exec="${this.packagePath}" %U
Terminal=false
Type=Application
Icon=${this._electron.app.name}
StartupWMClass=${this._electron.app.name}
MimeType=x-scheme-handler/mailto;
Categories=Network;
X-Tutanota-Version=${this._electron.app.getVersion()}
TryExec=${this.packagePath}`
		return this._fs.promises
			.mkdir(path.dirname(this.desktopFilePath), {
				recursive: true,
			})
			.then(() =>
				this._fs.promises.writeFile(this.desktopFilePath, desktopEntry, {
					encoding: "utf-8",
				}),
			)
	}

	copyIcons(): Promise<void> {
		return Promise.all([
			this._fs.promises.mkdir(this.iconTargetDir64, {
				recursive: true,
			}),
			this._fs.promises.mkdir(this.iconTargetDir512, {
				recursive: true,
			}),
		])
			.then(() => {
				return Promise.all([
					this._fs.promises.copyFile(this.iconSourcePath64, this.iconTargetPath64),
					this._fs.promises.copyFile(this.iconSourcePath512, this.iconTargetPath512),
				])
			})
			.then(() => {
				try {
					// refresh icon cache (update last modified timestamp)
					this._childProcess.execFile("touch", [path.join(this._electron.app.getPath("home"), ".local/share/icons/hicolor")], logExecFile)
				} catch (e) {
					// it's ok if this fails for some reason, the icons will appear after a reboot at the latest
				}
			})
	}

	/**
	 * asks the user for permission to integrate.
	 * also gives the option to opt-out indefinitely, which
	 * records the current path to the appImage in
	 * ~/.config/tuta_integration/no_integration
	 */
	async askPermission(): Promise<void> {
		const { response, checkboxChecked } = await this._electron.dialog.showMessageBox({
			title: lang.get("desktopIntegration_label"),
			buttons: [lang.get("no_label"), lang.get("yes_label")],
			defaultId: 1,
			message: lang.get("desktopIntegration_msg"),
			checkboxLabel: lang.get("doNotAskAgain_label"),
			checkboxChecked: false,
			type: "question",
		})

		if (checkboxChecked) {
			log.debug("updating no_integration blacklist...")
			await this._fs.promises.mkdir(path.dirname(this.nointegrationpath), {
				recursive: true,
			})
			await this._fs.promises.writeFile(this.nointegrationpath, this.packagePath + "\n", {
				encoding: "utf-8",
				flag: "a",
			})
		}

		if (response === 1) {
			// clicked yes
			await this.integrate()
		}
	}
}

function logExecFile(err: ExecFileException | null, stdout: string, stderr: string) {
	if (stdout && stdout !== "") log.debug("stdout:", stdout)
	if (err) log.error(err)
	if (stderr && stderr !== "") log.error("stderr:", stderr)
}
