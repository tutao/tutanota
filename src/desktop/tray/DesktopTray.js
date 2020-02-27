// @flow
import type {NativeImage} from 'electron'
import {app, Menu, MenuItem, nativeImage, Tray} from 'electron'
import type {DesktopConfigHandler} from '../DesktopConfigHandler.js'
import type {WindowManager} from "../DesktopWindowManager.js"
import type {DesktopNotifier} from "../DesktopNotifier.js"
import {lang} from "../../misc/LanguageViewModel"

let icon: NativeImage
const platformTray: PlatformTray = process.platform === 'darwin'
	? require('./PlatformDock')
	: require('./PlatformTray')

export type PlatformTray = {
	setBadge: ()=>void,
	clearBadge: ()=>void,
	getTray: (WindowManager, NativeImage) => ?Tray,
	getPlatformMenuItems: ()=>Array<MenuItem>,
	attachMenuToTray: (Menu, ?Tray) => void,
	iconPath: string => string,
	needsWindowListInMenu: ()=>boolean
}


export class DesktopTray {
	_conf: DesktopConfigHandler;
	_wm: WindowManager;
	_notifier: DesktopNotifier;

	_tray: ?Tray;

	constructor(config: DesktopConfigHandler, notifier: DesktopNotifier) {
		this._conf = config
		this._notifier = notifier
		this.getIcon()
		app.on('will-quit', (e: Event) => {
			if (this._tray) {
				this._tray.destroy()
				this._tray = null
			}
		}).on('ready', () => {
			if (!this._wm) console.warn("Tray: No WM set before 'ready'!")
			this._tray = platformTray.getTray(this._wm, this.getIcon())
		})
	}

	update(): void {
		if (!this._conf.getDesktopConfig("runAsTrayApp")) return
		const m = new Menu()
		m.append(new MenuItem({
			label: lang.get("openNewWindow_action"), click: () => {
				this._wm.newWindow(true)
			}
		}))
		if (platformTray.needsWindowListInMenu() && this._wm.getAll().length > 0) {
			m.append(new MenuItem({type: 'separator'}))
			this._wm.getAll().forEach(w => {
				let label = w.getTitle()
				if (this._notifier.hasNotificationsForWindow(w)) {
					label = "• " + label
				} else {
					label = label + "  "
				}
				m.append(new MenuItem({
					label: label,
					click: () => w.show()
				}))
			})
		}
		platformTray.getPlatformMenuItems().forEach(mi => m.append(mi))
		platformTray.attachMenuToTray(m, this._tray)
	}

	setBadge() {
		platformTray.setBadge()
	}

	clearBadge() {
		platformTray.clearBadge()
	}

	getIcon(): NativeImage {
		return DesktopTray.getIcon(this._conf.get('iconName'))
	}

	static getIcon(iconName: string): NativeImage {
		return icon || (icon = nativeImage.createFromPath(platformTray.iconPath(iconName)))
	}

	setWindowManager(wm: WindowManager) {
		this._wm = wm
	}
}
