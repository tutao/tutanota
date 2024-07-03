import type { NativeImage } from "electron"
import { app, Menu, MenuItem, nativeImage, Tray } from "electron"
import type { DesktopConfig } from "../config/DesktopConfig"
import type { WindowManager } from "../DesktopWindowManager"
import type { DesktopNotifier } from "../DesktopNotifier"
import { lang } from "../../misc/LanguageViewModel"
import { MacTray } from "./MacTray"
import { NonMacTray } from "./NonMacTray"
import { BuildConfigKey, DesktopConfigKey } from "../config/ConfigKeys"
import { log } from "../DesktopLog.js"

export interface PlatformTray {
	setBadge(): void

	clearBadge(): void

	getTray(arg0: WindowManager, arg1: NativeImage): Tray | null

	getPlatformMenuItems(): Array<MenuItem>

	attachMenuToTray(arg0: Menu, arg1: Tray | null): void

	getAppIconPathFromName(arg0: string): string

	needsWindowListInMenu(): boolean
}

const platformTray: PlatformTray = process.platform === "darwin" ? new MacTray() : new NonMacTray()

export class DesktopTray {
	private readonly _conf: DesktopConfig
	private _wm!: WindowManager
	private _tray: Tray | null = null
	private _icon: NativeImage | null = null

	constructor(config: DesktopConfig) {
		this._conf = config
		this.getAppIcon()
		app.on("will-quit", this.destroy)
			.whenReady()
			.then(async () => {
				// Need this wrapper so that `create()` will be called
				await this.create()
			})
	}

	async create() {
		if (!this._wm) log.warn("Tray: No WM set before 'ready'!")
		const runAsTrayApp = await this._conf.getVar(DesktopConfigKey.runAsTrayApp)
		console.log("Create tray:" + runAsTrayApp)
		if (runAsTrayApp) {
			this._tray = platformTray.getTray(this._wm, await this.getAppIcon())
		}
	}

	destroy() {
		if (this._tray) {
			this._tray.destroy()
			console.log("Tray destroyed")
			this._tray = null
		}
	}

	async update(notifier: DesktopNotifier): Promise<void> {
		const runAsTrayApp = await this._conf.getVar(DesktopConfigKey.runAsTrayApp)
		if (!runAsTrayApp) return
		const m = new Menu()
		m.append(
			new MenuItem({
				label: lang.get("openNewWindow_action"),
				click: () => {
					this._wm.newWindow(true)
				},
			}),
		)

		if (platformTray.needsWindowListInMenu() && this._wm.getAll().length > 0) {
			m.append(
				new MenuItem({
					type: "separator",
				}),
			)

			for (const w of this._wm.getAll()) {
				let label = w.getTitle()

				if (notifier.hasNotificationsForWindow(w)) {
					label = "• " + label
				} else {
					label = label + "  "
				}

				m.append(
					new MenuItem({
						label: label,
						click: () => w.show(),
					}),
				)
			}
		}

		for (const mi of platformTray.getPlatformMenuItems()) {
			m.append(mi)
		}
		platformTray.attachMenuToTray(m, this._tray)
	}

	setBadge() {
		platformTray.setBadge()
	}

	clearBadge() {
		platformTray.clearBadge()
	}

	async getAppIcon(): Promise<NativeImage> {
		if (!this._icon) {
			const iconName = await this._conf.getConst(BuildConfigKey.iconName)
			const iconPath = platformTray.getAppIconPathFromName(iconName)
			this._icon = nativeImage.createFromPath(iconPath)
		}

		return this._icon
	}

	setWindowManager(wm: WindowManager) {
		this._wm = wm
	}
}
