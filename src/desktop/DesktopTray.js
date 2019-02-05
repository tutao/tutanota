// @flow
import type {NativeImage} from 'electron'
import {app, Menu, MenuItem, nativeImage, Tray} from 'electron'
import path from 'path'
import {lang} from './DesktopLocalizationProvider.js'
import {conf} from './DesktopConfigHandler.js'
import {ApplicationWindow} from "./ApplicationWindow.js"

class DesktopTray {
	_tray: Tray;
	_icon: NativeImage;

	/**
	 * linux env: DESKTOP_SESSION XDG_SESSION_DESKTOP XDG_CURRENT_DESKTOP to detect WM
	 */
	update(): void {
		if (!conf.getDesktopConfig('runAsTrayApp')) {
			return
		}
		lang.initialized.promise.then(() => {
			if (process.platform === 'darwin') { // we use the dock on MacOs
				app.dock.setMenu(this._getMenu())
				app.dock.show()
			} else {
				if (!this._tray) {
					this._tray = new Tray(this.getIcon())
					this._tray.on('click', ev => {
						ApplicationWindow.getLastFocused(true)
					})
				}
				this._tray.setContextMenu(this._getMenu())
			}
		})
	}

	getIcon(): NativeImage {
		if (this._icon) {
			return this._icon
		} else if (process.platform === 'darwin') {
			this._icon = nativeImage.createFromPath(path.join((process: any).resourcesPath, `icons/${conf.get('iconName')}.png.icns`))
		} else if (process.platform === 'win32') {
			this._icon = nativeImage.createFromPath(path.join((process: any).resourcesPath, `icons/${conf.get('iconName')}.png.ico`))
		} else {
			this._icon = nativeImage.createFromPath(path.join((process: any).resourcesPath, `icons/${conf.get('iconName')}.png`))
		}
		return this._icon
	}

	_getMenu(): Menu {
		const m = new Menu()
		m.append(new MenuItem({label: lang.get("openNewWindow_action"), click: () => {new ApplicationWindow(true)}}))
		if (ApplicationWindow.getAll().length > 0) {
			m.append(new MenuItem({type: 'separator'}))
			ApplicationWindow.getAll().forEach(w => {
				m.append(new MenuItem({label: w.getTitle(), click: () => w.show()}))
			})
		}
		if (process.platform !== 'darwin') {
			m.append(new MenuItem({type: 'separator'}))
			m.append(new MenuItem({label: lang.get("quit_action"), accelerator: "CmdOrCtrl+Q", click: app.quit}))
		}
		return m
	}
}

export const tray = new DesktopTray()