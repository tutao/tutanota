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
import {BuildConfigKey, DesktopConfigEncKey, DesktopConfigKey} from "./config/ConfigKeys"
import type {SseInfo} from "./sse/DesktopSseClient"
import {isRectContainedInRect} from "./DesktopUtils"
import {downcast} from "@tutao/tutanota-utils"
import {ThemeManager} from "./ThemeManager"

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
	_contextMenu: DesktopContextMenu
	+_electron: $Exports<"electron">
	+_themeManager: ThemeManager;
	ipc: IPC
	+dl: DesktopDownloadManager
	+_newWindowFactory: (noAutoLogin?: boolean) => Promise<ApplicationWindow>
	+_dragIcons: {[MailExportMode]: NativeImage}
	_currentBounds: WindowBounds

	constructor(conf: DesktopConfig, tray: DesktopTray, notifier: DesktopNotifier, electron: $Exports<"electron">,
	            localShortcut: LocalShortcutManager, dl: DesktopDownloadManager, themeManager: ThemeManager) {
		this._conf = conf

		if (process.platform !== "darwin") {
			conf.getVar(DesktopConfigKey.spellcheck).then(l => this._setSpellcheckLang(l))
			conf.on(DesktopConfigKey.spellcheck, l => this._setSpellcheckLang(l))
		}

		this._tray = tray
		this._notifier = notifier
		this.dl = dl
		this._electron = electron
		this._themeManager = themeManager

		this._newWindowFactory = (noAutoLogin) => this._newWindow(electron, localShortcut, noAutoLogin)
		this._dragIcons = {
			"eml": this._tray.getIconByName("eml.png"),
			"msg": this._tray.getIconByName("msg.png"),
		}
		// this is the global default for window placement & scale
		this._currentBounds = {
			scale: 1,
			fullscreen: false,
			rect: {height: 600, width: 800, x: 200, y: 200}
		}
	}

	/**
	 * Late initialization to break the dependency cycle.
	 */
	setIPC(ipc: IPC) {
		this.ipc = ipc
		this._contextMenu = new DesktopContextMenu(this._electron, ipc)
	}

	async newWindow(showWhenReady: boolean, noAutoLogin?: boolean): Promise<ApplicationWindow> {
		await this.loadStartingBounds()
		const w: ApplicationWindow = await this._newWindowFactory(noAutoLogin)
		windows.unshift(w)
		w.on('close', ev => {
			this.saveBounds(w.getBounds())
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
		}).on('zoom-changed', (ev: Event, direction: "in" | "out") => {
			let scale = ((this._currentBounds.scale * 100) + (direction === "out" ? -5 : 5)) / 100
			if (scale > 3) {
				scale = 3
			} else if (scale < 0.5) {
				scale = 0.5
			}
			this._currentBounds.scale = scale
			windows.forEach(w => w.setZoomFactor(scale))
			const w = this.getEventSender(downcast(ev))
			if (!w) return
			this.saveBounds(w.getBounds())
		}).on('did-navigate', () => {
			// electron likes to override the zoom factor when the URL changes.
			windows.forEach(w => w.setZoomFactor(this._currentBounds.scale))
		}).once('ready-to-show', async () => {
			this._tray.update(this._notifier)
			w.setBounds(this._currentBounds)
			if (showWhenReady) w.show()
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
		this._conf.on(DesktopConfigEncKey.sseInfo, sseValueListener)
		// call with value initially
		this._conf.getVar(DesktopConfigEncKey.sseInfo)
		    .then(sseValueListener, (e) => log.error("Failed to get sseInfo", e))
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

	/**
	 * Set window size & location in the WindowManager and save them and the manager's window scale to config.
	 * The WindowManagers scale will be retained even if passed bounds has a different scale.
	 * @param bounds {WindowBounds} the bounds containing the size & location to save
	 */
	saveBounds(bounds: WindowBounds): void {
		const displayRect = screen.getDisplayMatching(bounds.rect).bounds
		if (!isRectContainedInRect(displayRect, bounds.rect)) return
		this._currentBounds.fullscreen = bounds.fullscreen
		this._currentBounds.rect = bounds.rect
		this._conf.setVar('lastBounds', this._currentBounds)
	}

	_setSpellcheckLang(l: string): void {
		this._electron.session.defaultSession.setSpellCheckerLanguages(l === "" ? [] : [l])
	}

	/**
	 * load lastBounds from config.
	 * if there are none or they don't match a screen, save default bounds to config
	 */
	async loadStartingBounds(): Promise<void> {
		const loadedBounds: WindowBounds = await this._conf.getVar("lastBounds")
		if (!loadedBounds) this.saveBounds(this._currentBounds)
		const lastBounds = loadedBounds || this._currentBounds
		const displayRect = screen.getDisplayMatching(lastBounds.rect).bounds
		// we may have loaded bounds that are not in bounds of the screen
		// if ie the resolution changed, more/less screens, ...
		const result = isRectContainedInRect(displayRect, lastBounds.rect)
			? Object.assign(this._currentBounds, lastBounds)
			: this._currentBounds
		this.saveBounds(result)
	}

	async _newWindow(electron: $Exports<"electron">, localShortcut: LocalShortcutManager, noAutoLogin: ?boolean): Promise<ApplicationWindow> {
		const desktopHtml = await this._conf.getConst(BuildConfigKey.desktophtml)
		const updateUrl = await this._conf.getConst(BuildConfigKey.updateUrl)
		const dictUrl = updateUrl && updateUrl !== ""
			? updateUrl
			: "https://mail.tutanota.com/desktop/" // custom builds get the dicts from us as well

		const icon = await this.getIcon()

		return new ApplicationWindow(
			this,
			desktopHtml,
			icon,
			electron,
			localShortcut,
			this._themeManager,
			dictUrl,
			noAutoLogin,
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
