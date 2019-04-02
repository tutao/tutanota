// @flow
import type {NativeImage} from 'electron'
import {app, Menu, MenuItem, nativeImage, Tray} from 'electron'
import path from 'path'
import {lang} from './DesktopLocalizationProvider.js'
import type {DesktopConfigHandler} from './DesktopConfigHandler.js'
import type {WindowManager} from "./DesktopWindowManager.js"
import type {DesktopNotifier} from "./DesktopNotifier.js"

let icon: NativeImage

export class DesktopTray {
	_conf: DesktopConfigHandler;
	_wm: WindowManager;
	_notifier: DesktopNotifier;

	_tray: Tray;

	constructor(config: DesktopConfigHandler, notifier: DesktopNotifier) {
		this._conf = config
		this._notifier = notifier
	}

	/**
	 * linux env: DESKTOP_SESSION XDG_SESSION_DESKTOP XDG_CURRENT_DESKTOP to detect WM
	 */
	update(): void {
		if (!this._conf.getDesktopConfig('runAsTrayApp')) {
			return
		}
		lang.initialized.promise.then(() => {
			if (process.platform === 'darwin') { // we use the dock on MacOs
				app.dock.setMenu(this._getMenu())
				if (!app.dock.isVisible()) {
					app.dock.show()
				}
			} else {
				if (!this._tray) {
					this._tray = new Tray(DesktopTray.getIcon())
					this._tray.on('click', ev => {
						this._wm.getLastFocused(true)
					})
				}
				this._tray.setContextMenu(this._getMenu())
			}
		})
	}

	static getIcon(): NativeImage {
		if (icon) {
			return icon
		} else if (process.platform === 'darwin') {
			icon = nativeImage.createFromPath(path.join((process: any).resourcesPath, 'icons/logo-solo-red.png.icns'))
		} else if (process.platform === 'win32') {
			icon = nativeImage.createFromPath(path.join((process: any).resourcesPath, 'icons/logo-solo-red.png.ico'))
		} else {
			icon = nativeImage.createFromPath(path.join((process: any).resourcesPath, 'icons/logo-solo-red.png'))
		}
		return icon
	}

	_getMenu(): Menu {
		const m = new Menu()
		m.append(new MenuItem({label: lang.get("openNewWindow_action"), click: () => {this._wm.newWindow(true)}}))
		if (this._wm.getAll().length > 0) {
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
		if (process.platform !== 'darwin') {
			m.append(new MenuItem({type: 'separator'}))
			m.append(new MenuItem({label: lang.get("quit_action"), accelerator: "CmdOrCtrl+Q", click: app.quit}))
		}
		return m
	}

	setWindowManager(wm: WindowManager) {
		this._wm = wm
	}
}
