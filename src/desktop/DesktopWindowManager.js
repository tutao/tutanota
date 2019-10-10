// @flow

import type {NativeImage, Rectangle} from "electron"
import {app, screen} from "electron"
import path from 'path'
import type {UserInfo} from "./ApplicationWindow"
import {ApplicationWindow} from "./ApplicationWindow"
import type {DesktopConfigHandler} from "./DesktopConfigHandler"
import {DesktopTray} from "./DesktopTray"
import type {DesktopNotifier} from "./DesktopNotifier.js"
import {LOGIN_TITLE} from "../api/Env"
import {DesktopDownloadManager} from "./DesktopDownloadManager"
import type {IPC} from "./IPC"

export type WindowBounds = {|
	rect: Rectangle,
	fullscreen: boolean,
|}

const windows: ApplicationWindow[] = []
let forceQuit = false
app.once('before-quit', () => {
	forceQuit = true
})

export class WindowManager {
	_conf: DesktopConfigHandler
	_tray: DesktopTray
	_notifier: DesktopNotifier
	ipc: IPC
	dl: DesktopDownloadManager

	constructor(conf: DesktopConfigHandler, tray: DesktopTray, notifier: DesktopNotifier) {
		this._conf = conf
		this._tray = tray
		this._notifier = notifier
		this.dl = new DesktopDownloadManager(conf)
	}

	setIPC(ipc: IPC) {
		this.ipc = ipc
	}

	newWindow(showWhenReady: boolean, noAutoLogin?: boolean): ApplicationWindow {
		const w = new ApplicationWindow(
			this,
			path.join(app.getAppPath(), this._conf.get("preloadjs")),
			path.join(app.getAppPath(), this._conf.get("desktophtml")),
			noAutoLogin
		)
		windows.unshift(w)
		w.on('close', ev => {
			// we don't want to actually close windows where someone is logged in, just hide them
			if (this._conf.getDesktopConfig('runAsTrayApp') && w.getUserInfo() != null && !forceQuit) {
				ev.preventDefault()
				w.hide()
			}
			this.saveBounds(w)
		}).on('closed', ev => {
			windows.splice(windows.indexOf(w), 1)
			this._tray.update()
		}).on('focus', ev => {
			windows.splice(windows.indexOf(w), 1)
			windows.push(w)
			this._notifier.resolveGroupedNotification(w.getUserId())
		}).on('page-title-updated', ev => {
			if (w.getTitle() === LOGIN_TITLE) {
				w.setUserInfo(null)
			}
			this._tray.update()
		}).once('ready-to-show', () => {
			w.setZoomFactor(1.0)
			this._tray.update()
			if (showWhenReady) {
				w.show()
			}
		})

		const startingBounds: ?WindowBounds = this.getStartingBounds()
		if (startingBounds) {
			w.setBounds(startingBounds)
		} else {
			w.center()
		}

		return w
	}

	hide() {
		if (process.platform === 'darwin') {
			app.hide() // hide all windows & give active app status to previous app
		} else {
			windows.forEach(w => w.hide())
		}
	}

	getIcon(): NativeImage {
		return DesktopTray.getIcon(this._conf.get('iconName'))
	}

	get(id: number): ?ApplicationWindow {
		const w = windows.find(w => w.id === id)
		return w
			? w
			: null
	}

	getAll(): ApplicationWindow[] {
		return windows
	}

	getLastFocused(show: boolean): ApplicationWindow {
		let w = windows[windows.length - 1]
		if (!w) {
			w = this.newWindow(show)
		} else if (show) {
			w.show()
		}
		return w
	}

	openMailBox(info: UserInfo) {
		let w = windows.find(w => w.getUserId() === info.userId)
			|| windows.find(w => w.getUserInfo() === null)
			|| this.newWindow(true, true)
		w.openMailBox(info, null)
	}

	openCalendar(info: UserInfo) {
		let w = windows.find(w => w.getUserId() === info.userId)
			|| windows.find(w => w.getUserInfo() === null)
			|| this.newWindow(true, true)
		w.openCalendar(info)
	}

	recreateWindow(w: ApplicationWindow): void {
		console.log("browserWindow crashed, trying to reopen at", w.getPath())
		const lastPath = w.getPath()
		const userInfo = w.getUserInfo()
		const isMinimized = w.isMinimized()
		const isFocused = w.isFocused()
		const isHidden = w.isHidden()
		const bounds = w.getBounds()
		w._browserWindow.destroy() // drastic, but still fires the closed event

		w = this.newWindow(false)
		w.setBounds(bounds)
		let p = Promise.resolve()
		if (userInfo) {
			p = w.openMailBox(userInfo, lastPath)
		}
		p.then(() => {
			if (isFocused) {
				w.show()
			} else if (!isHidden) {
				if (isMinimized) {
					w.minimize()
				}
				w.showInactive()
			}
		})
	}


	saveBounds(w: ApplicationWindow): void {
		const lastBounds = w.getBounds()
		if (this.isRectContainedInRect(screen.getDisplayMatching(lastBounds.rect).bounds, lastBounds.rect)) {
			console.log("saving bounds:", lastBounds)
			this._conf.setDesktopConfig('lastBounds', lastBounds)
		}
	}

	getStartingBounds(): ?WindowBounds {
		const lastBounds: WindowBounds = this._conf.getDesktopConfig("lastBounds")
		if (!lastBounds || !this.isRectContainedInRect(screen.getDisplayMatching(lastBounds.rect).bounds, lastBounds.rect)) {
			return null
		} else {
			return lastBounds
		}
	}

	isRectContainedInRect(closestRect: Rectangle, lastBounds: Rectangle): boolean {
		return lastBounds.x >= closestRect.x - 10
			&& lastBounds.y >= closestRect.y - 10
			&& lastBounds.width + lastBounds.x <= closestRect.width + 10
			&& lastBounds.height + lastBounds.y <= closestRect.height + 10
	}
}
