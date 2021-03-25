// @flow

import type {NativeImage, Rectangle, WebContentsEvent} from "electron"
import {app, BrowserWindow, screen} from "electron"
import type {UserInfo} from "./ApplicationWindow"
import {ApplicationWindow} from "./ApplicationWindow"
import type {DesktopConfig} from "./config/DesktopConfig"
import {DesktopTray} from "./tray/DesktopTray"
import type {DesktopNotifier} from "./DesktopNotifier.js"
import {LOGIN_TITLE} from "../api/common/Env"
import type {DesktopDownloadManager} from "./DesktopDownloadManager"
import type {IPC} from "./IPC"
import {DesktopContextMenu} from "./DesktopContextMenu"
import {log} from "./DesktopLog"
import type {LocalShortcutManager} from "./electron-localshortcut/LocalShortcut"
import {getExportDirectoryPath} from "./DesktopFileExport"
import path from "path"
import {fileExists} from "./PathUtils"
import type {MailExportMode} from "../mail/export/Exporter"
import {BuildConfigKey, DesktopConfigEncKey} from "./config/ConfigKeys"
import type {SseInfo} from "./sse/DesktopSseClient"

export type WindowBounds = {|
	rect: Rectangle,
	fullscreen: boolean,
	scale: number,
|}

const windows: ApplicationWindow[] = []

export class WindowManager {
	+_conf: DesktopConfig
	+_tray: DesktopTray
	+_notifier: DesktopNotifier
	+_contextMenu: DesktopContextMenu
	ipc: IPC
	+dl: DesktopDownloadManager
	+_newWindowFactory: (noAutoLogin?: boolean) => Promise<ApplicationWindow>
	+_dragIcons: {[MailExportMode]: NativeImage}

	constructor(conf: DesktopConfig, tray: DesktopTray, notifier: DesktopNotifier, electron: $Exports<"electron">,
	            localShortcut: LocalShortcutManager, dl: DesktopDownloadManager) {
		this._conf = conf
		this._tray = tray
		this._notifier = notifier
		this.dl = dl
		this._contextMenu = new DesktopContextMenu(electron)
		this._newWindowFactory = (noAutoLogin) => this._newWindow(electron, localShortcut, noAutoLogin)
		this._dragIcons = {
			"eml": this._tray.getIconByName("eml.png"),
			"msg": this._tray.getIconByName("msg.png"),
		}
	}

	/**
	 * Late initialization to break the dependency cycle.
	 */
	setIPC(ipc: IPC) {
		this.ipc = ipc
	}

	async newWindow(showWhenReady: boolean, noAutoLogin?: boolean): Promise<ApplicationWindow> {
		const w: ApplicationWindow = await this._newWindowFactory(noAutoLogin)
		windows.unshift(w)
		w.on('close', ev => {
			this.saveBounds(w)
		}).on('closed', ev => {
			windows.splice(windows.indexOf(w), 1)
			this._tray.update(this._notifier)
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
			this._tray.update(this._notifier)
		}).once('ready-to-show', async () => {
			this._tray.update(this._notifier)
			const startingBounds: ?WindowBounds = await this.getStartingBounds()
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
		this._registerUserListener(w.id)

		return w
	}

	_registerUserListener(windowId: number) {
		const sseValueListener = (value: ?SseInfo) => {
			if (value && value.userIds.length === 0) {
				log.debug("invalidating alarms for window", windowId)
				this.ipc.sendRequest(windowId, "invalidateAlarms", [])
				    .catch((e) => {
					    log.debug("Could not invalidate alarms for window ", windowId, e)
					    this._conf.removeListener(DesktopConfigEncKey.sseInfo, sseValueListener)
				    })
			}
		}
		this._conf.on(DesktopConfigEncKey.sseInfo, sseValueListener, true)
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

	async getIcon(): Promise<NativeImage> {
		return this._tray.getIconByName(await this._conf.getConst('iconName'))
	}

	get(id: number): ?ApplicationWindow {
		const w = windows.find(w => w.id === id)
		return w
			? w
			: null
	}

	/**
	 * https://www.electronjs.org/docs/api/browser-window#browserwindowfromwebcontentswebcontents
	 * @returns {?ApplicationWindow|null}
	 */
	getEventSender(ev: WebContentsEvent): ?ApplicationWindow {
		const browserWindow = BrowserWindow.fromWebContents(ev.sender)
		if (browserWindow == null) return null
		return this.get(browserWindow.id)
	}

	getAll(): ApplicationWindow[] {
		return windows
	}

	async getLastFocused(show: boolean): Promise<ApplicationWindow> {
		let w = windows[windows.length - 1]
		if (!w) {
			w = await this.newWindow(show)
		} else if (show) {
			w.show()
		}
		return w
	}

	async openMailBox(info: UserInfo): Promise<void> {
		return (await this.findWindowWithUserId(info.userId)).openMailBox(info, null)
	}

	async openCalendar(info: UserInfo): Promise<void> {
		return (await this.findWindowWithUserId(info.userId)).openCalendar(info)
	}

	async findWindowWithUserId(userId: string): Promise<ApplicationWindow> {
		return windows.find(w => w.getUserId() === userId)
			|| windows.find(w => w.getUserInfo() === null)
			|| this.newWindow(true, true)
	}

	saveBounds(w: ApplicationWindow): void {
		const lastBounds = w.getBounds()
		if (this.isRectContainedInRect(screen.getDisplayMatching(lastBounds.rect).bounds, lastBounds.rect)) {
			log.debug("saving bounds:", lastBounds)
			this._conf.setVar('lastBounds', lastBounds)
		}
	}

	async getStartingBounds(): Promise<?WindowBounds> {
		const lastBounds: WindowBounds = await this._conf.getVar("lastBounds")
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

	async _newWindow(electron: $Exports<"electron">, localShortcut: LocalShortcutManager, noAutoLogin: ?boolean): Promise<ApplicationWindow> {
		const desktopHtml = await this._conf.getConst(BuildConfigKey.desktophtml)
		const icon = await this.getIcon()
		return new ApplicationWindow(
			this,
			desktopHtml,
			icon,
			electron,
			localShortcut,
			noAutoLogin
		)
	}

	async startNativeDrag(filenames: Array<string>, windowId: number) {
		const exportDir = await getExportDirectoryPath(this.dl)
		const files = filenames.map(fileName => path.join(exportDir, fileName)).filter(fileExists)
		const window = this.get(windowId)
		if (window) {
			const exportMode = await this._conf.getVar("mailExportMode")
			const icon = this._dragIcons[exportMode]
			window._browserWindow.webContents.startDrag({files, icon})
		}
	}
}
