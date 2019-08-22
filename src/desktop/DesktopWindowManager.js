// @flow

import type {NativeImage, Rectangle} from "electron"
import {app, screen} from "electron"
import type {UserInfo} from "./ApplicationWindow"
import {ApplicationWindow} from "./ApplicationWindow"
import type {DesktopConfig} from "./config/DesktopConfig"
import {DesktopTray} from "./tray/DesktopTray"
import type {DesktopNotifier} from "./DesktopNotifier.js"
import {LOGIN_TITLE} from "../api/Env"
import type {DesktopDownloadManager} from "./DesktopDownloadManager"
import type {IPC} from "./IPC"
import {DesktopContextMenu} from "./DesktopContextMenu"

export type WindowBounds = {|
	rect: Rectangle,
	fullscreen: boolean,
	scale: number,
|}

const windows: ApplicationWindow[] = []

export class WindowManager {
	_conf: DesktopConfig
	_tray: DesktopTray
	_notifier: DesktopNotifier
	_contextMenu: DesktopContextMenu
	ipc: IPC
	dl: DesktopDownloadManager

	constructor(conf: DesktopConfig, tray: DesktopTray, notifier: DesktopNotifier, dl: DesktopDownloadManager) {
		this._conf = conf
		this._tray = tray
		this._notifier = notifier
		this.dl = dl
		this._contextMenu = new DesktopContextMenu()
	}

	setIPC(ipc: IPC) {
		this.ipc = ipc
	}

	newWindow(showWhenReady: boolean, noAutoLogin?: boolean): ApplicationWindow {
		const w = new ApplicationWindow(
			this,
			this._conf,
			noAutoLogin
		)
		windows.unshift(w)
		w.on('close', ev => {
			this.saveBounds(w)
		}).on('closed', ev => {
			windows.splice(windows.indexOf(w), 1)
			this._tray.update()
		}).on('focus', ev => {
			windows.splice(windows.indexOf(w), 1)
			windows.push(w)
			this._tray.clearBadge()
			this._notifier.resolveGroupedNotification(w.getUserId())
		}).on('did-start-navigation', () => {
			this._tray.clearBadge()
		}).on('page-title-updated', ev => {
			if (w.getTitle() === LOGIN_TITLE) {
				w.setUserInfo(null)
			}
			this._tray.update()
		}).once('ready-to-show', () => {
			this._tray.update()
			const startingBounds: ?WindowBounds = this.getStartingBounds()
			if (startingBounds) {
				w.setBounds(startingBounds)
			} else {
				w.center()
			}
			if (showWhenReady) {
				w.show()
			}
		})

		w.setContextMenuHandler((params) => this._contextMenu.open(params))

		return w
	}

	hide() {
		if (process.platform === 'darwin') {
			app.hide() // hide all windows & give active app status to previous app
		} else {
			windows.forEach(w => w.hide())
		}
	}

	minimize() {
		windows.forEach(w => w.minimize())
	}

	getIcon(): NativeImage {
		return DesktopTray.getIcon(this._conf.getConst('iconName'))
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

	openMailBox(info: UserInfo): Promise<void> {
		return this.findWindowWithUserId(info.userId).openMailBox(info, null)
	}

	openCalendar(info: UserInfo): Promise<void> {
		return this.findWindowWithUserId(info.userId).openCalendar(info)
	}

	findWindowWithUserId(userId: string): ApplicationWindow {
		return windows.find(w => w.getUserId() === userId)
			|| windows.find(w => w.getUserInfo() === null)
			|| this.newWindow(true, true)
	}

	saveBounds(w: ApplicationWindow): void {
		const lastBounds = w.getBounds()
		if (this.isRectContainedInRect(screen.getDisplayMatching(lastBounds.rect).bounds, lastBounds.rect)) {
			console.log("saving bounds:", lastBounds)
			this._conf.setVar('lastBounds', lastBounds)
		}
	}

	getStartingBounds(): ?WindowBounds {
		const lastBounds: WindowBounds = this._conf.getVar("lastBounds")
		if (!lastBounds || !this.isRectContainedInRect(screen.getDisplayMatching(lastBounds.rect).bounds, lastBounds.rect)) {
			return null
		} else {
			return Object.assign({scale: 1, fullscreen: false, rect: {height: 600, width: 800, x: 200, y: 200}}, lastBounds)
		}
	}

	isRectContainedInRect(closestRect: Rectangle, lastBounds: Rectangle): boolean {
		return lastBounds.x >= closestRect.x - 10
			&& lastBounds.y >= closestRect.y - 10
			&& lastBounds.width + lastBounds.x <= closestRect.width + 10
			&& lastBounds.height + lastBounds.y <= closestRect.height + 10
	}
}
