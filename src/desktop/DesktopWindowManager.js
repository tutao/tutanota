// @flow

import type {Rectangle} from "electron"
import {app, screen} from "electron"
import type {UserInfo} from "./ApplicationWindow"
import {ApplicationWindow} from "./ApplicationWindow"
import {ipc} from "./IPC"
import {conf} from "./DesktopConfigHandler"
import {tray} from "./DesktopTray"
import {notifier} from "./DesktopNotifier.js"
import {LOGIN_TITLE} from "../api/Env"

export type WindowBounds = {|
	rect: Rectangle,
	fullscreen: boolean,
|}

const windows: ApplicationWindow[] = []
let forceQuit = false
app.once('before-quit', () => {
	forceQuit = true
})

class WindowManager {

	newWindow(showWhenReady: boolean): ApplicationWindow {
		const w = new ApplicationWindow()
		windows.push(w)

		w.on('close', ev => {
			if (conf.getDesktopConfig('runAsTrayApp') && w.getUserInfo() != null && !forceQuit) {
				ev.preventDefault()
				w.hide()
			}
			saveBounds(w)
		}).on('closed', ev => {
			windows.splice(windows.indexOf(w), 1)
			tray.update()
		}).on('focus', ev => {
			windows.splice(windows.indexOf(w), 1)
			windows.push(w)
			notifier.resolveGroupedNotification(w.getUserId())
		}).on('page-title-updated', ev => {
			if (w.getTitle() === LOGIN_TITLE) {
				w.setUserInfo(null)
			}
			tray.update()
		}).once('ready-to-show', () => {
			w.setZoomFactor(1.0)
			tray.update()
			if (showWhenReady) {
				w.show()
			}
		})

		const startingBounds: ?WindowBounds = getStartingBounds()
		if (startingBounds) {
			w.setBounds(startingBounds)
		} else {
			w.center()
		}

		return w
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
			|| this.newWindow(true)
		ipc.initialized(w.id).then(() => {
			ipc.sendRequest(w.id, 'openMailbox', [info.userId, info.mailAddress, null])
			w.show()
		})
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
			p = ipc.initialized(w.id)
			       .then(() => {
				       ipc.sendRequest(w.id, 'openMailbox', [userInfo.userId, userInfo.mailAddress, lastPath])
			       })
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
}

function saveBounds(w: ApplicationWindow): void {
	const lastBounds = w.getBounds()
	console.log("saving bounds:", lastBounds)
	if (isContainedIn(screen.getDisplayMatching(lastBounds.rect).bounds, lastBounds.rect)) {
		conf.setDesktopConfig('lastBounds', lastBounds)
	}
}

function getStartingBounds(): ?WindowBounds {
	const lastBounds: WindowBounds = conf.getDesktopConfig("lastBounds")
	if (!lastBounds || !isContainedIn(screen.getDisplayMatching(lastBounds.rect).bounds, lastBounds.rect)) {
		return null
	} else {
		return lastBounds
	}
}

function isContainedIn(closestRect: Rectangle, lastBounds: Rectangle): boolean {
	return lastBounds.x >= closestRect.x - 10
		&& lastBounds.y >= closestRect.y - 10
		&& lastBounds.width + lastBounds.x <= closestRect.width + 10
		&& lastBounds.height + lastBounds.y <= closestRect.height + 10
}

export const wm = new WindowManager()
