import { app, dialog, NativeImage, Rectangle, screen } from "electron"
import type { UserInfo } from "./ApplicationWindow"
import { ApplicationWindow } from "./ApplicationWindow"
import type { DesktopConfig } from "./config/DesktopConfig"
import { DesktopTray } from "./tray/DesktopTray"
import type { DesktopNotifier } from "./notifications/DesktopNotifier"
import { DesktopContextMenu } from "./DesktopContextMenu"
import { log } from "./DesktopLog"
import type { LocalShortcutManager } from "./electron-localshortcut/LocalShortcut"
import { DesktopConfigEncKey, DesktopConfigKey } from "./config/ConfigKeys"
import { isRectContainedInRect } from "./DesktopUtils"
import { DesktopThemeFacade } from "./DesktopThemeFacade"
import { ElectronExports } from "./ElectronExportTypes"
import { RemoteBridge } from "./ipc/RemoteBridge.js"
import { ASSET_PROTOCOL } from "./net/ProtocolProxy.js"

import { SseInfo } from "./sse/SseInfo.js"
import { debounce, LazyLoaded } from "@tutao/tutanota-utils"
import { lang } from "../misc/LanguageViewModel"

const TAG = "[DesktopWindowManager]"

/**
 * this must be called before electron.app.ready event to be useful
 */
export function setupAssetProtocol(electron: ElectronExports) {
	electron.protocol.registerSchemesAsPrivileged([
		{
			scheme: ASSET_PROTOCOL,
			privileges: { standard: true, supportFetchAPI: true, secure: true },
		},
	])
}

export type WindowBounds = {
	rect: Rectangle
	fullscreen: boolean
	scale: number
}
const windows: ApplicationWindow[] = []

export class WindowManager {
	private readonly _conf: DesktopConfig
	private readonly _tray: DesktopTray
	private readonly _notifier: DesktopNotifier
	private _contextMenu!: DesktopContextMenu
	private readonly _electron: ElectronExports
	private themeFacade!: DesktopThemeFacade
	private readonly _newWindowFactory: (noAutoLogin?: boolean) => Promise<ApplicationWindow>
	private _currentBounds: WindowBounds
	private remoteBridge!: RemoteBridge

	/**
	 *
	 * @param conf
	 * @param tray
	 * @param notifier
	 * @param electron
	 * @param localShortcut
	 * @param icon
	 * @param preloadOverride the path to a replacement of the default preload script
	 */
	constructor(
		conf: DesktopConfig,
		tray: DesktopTray,
		notifier: DesktopNotifier,
		electron: ElectronExports,
		localShortcut: LocalShortcutManager,
		private readonly icon: LazyLoaded<NativeImage>,
		private readonly preloadOverride?: string,
	) {
		this._conf = conf

		if (process.platform !== "darwin") {
			conf.getVar(DesktopConfigKey.spellcheck).then((l) => this._setSpellcheckLang(l))
			conf.on(DesktopConfigKey.spellcheck, (l) => this._setSpellcheckLang(l))
		}

		this._tray = tray
		this._notifier = notifier
		this._electron = electron

		this._newWindowFactory = (noAutoLogin) => this._newWindow(electron, localShortcut, noAutoLogin ?? null)
		// this is the old default for window placement & scale
		// should never be used because the config now contains
		// a new default value.
		this._currentBounds = {
			scale: 1,
			fullscreen: false,
			rect: {
				height: 600,
				width: 800,
				x: 200,
				y: 200,
			},
		}
	}

	/**
	 * Late initialization to break the dependency cycle.
	 */
	lateInit(contextMenu: DesktopContextMenu, themeFacade: DesktopThemeFacade, remoteBridge: RemoteBridge) {
		this.themeFacade = themeFacade
		this._contextMenu = contextMenu
		this.remoteBridge = remoteBridge
	}

	async newWindow(showWhenReady: boolean, noAutoLogin?: boolean): Promise<ApplicationWindow> {
		await this.loadStartingBounds()
		const w: ApplicationWindow = await this._newWindowFactory(noAutoLogin)
		windows.unshift(w)

		w.on("close", async (e) => {
			w.setUserId(null)
			if (w._browserWindow.webContents.getURL().includes("/signup")) {
				e.preventDefault()
				const { response } = await dialog.showMessageBox(w._browserWindow, {
					type: "question",
					message: lang.getTranslationText("closeWindowConfirmation_msg"),
					buttons: [lang.getTranslationText("yes_label"), lang.getTranslationText("no_label")],
				})

				if (response === 0) w._browserWindow.destroy()
			}
		})
			.on("closed", () => {
				w.setUserId(null)
				windows.splice(windows.indexOf(w), 1)
				this._tray.update(this._notifier)
			})
			.on("focus", () => {
				windows.splice(windows.indexOf(w), 1)
				windows.push(w)

				this._tray.clearBadge()

				const userId = w.getUserId()
				if (userId) {
					this._notifier.clearUserNotifications(userId)
				}
			})
			.on("page-title-updated", (ev) => {
				this._tray.update(this._notifier)
			})
			.once("ready-to-show", async () => {
				this._tray.update(this._notifier)

				w.setBounds(this._currentBounds)
				// "move" fires before "ready-to-show" and would overwrite bounds with default.
				w.on("move", () => {
					// `move` event also fires on `resize` on windows and linux, but not on mac (so we also handle `resize`)
					this.saveWindowBounds(w)
				}).on("resize", () => {
					this.saveWindowBounds(w)
				})

				if (showWhenReady) w.show()
			})
			.webContents.on("did-start-navigation", () => {
				this._tray.clearBadge()
			})
			.on("zoom-changed", (ev: Event, direction: "in" | "out") => {
				let scale = (this._currentBounds.scale * 100 + (direction === "out" ? -5 : 5)) / 100
				this.changeZoom(scale)
				this.saveWindowBounds(w)
			})
			.on("did-navigate", () => {
				// electron likes to override the zoom factor when the URL changes.
				for (const w of windows) {
					w.setZoomFactor(this._currentBounds.scale)
				}
			})

		w.setContextMenuHandler((params) => this._contextMenu.open(params))

		this._registerUserListener(w.id)

		return w
	}

	_registerUserListener(windowId: number) {
		const sseValueListener = (value: SseInfo | null) => {
			if (value && value.userIds.length === 0) {
				this.invalidateAlarms(windowId).catch((e) => {
					log.debug(TAG, "Could not invalidate alarms for window ", windowId, e)

					this._conf.removeListener(DesktopConfigEncKey.sseInfo, sseValueListener)
				})
			}
		}

		this._conf.on(DesktopConfigEncKey.sseInfo, sseValueListener)

		// call with value initially
		this._conf.getVar(DesktopConfigEncKey.sseInfo).then(sseValueListener, (e) => log.error(TAG, "Failed to get sseInfo", e))
	}

	/**
	 * invalidates the alarms for a specific window or all windows if no windowId is given.
	 * @param windowId {number | undefined}
	 * @returns {Promise<void>}
	 */
	async invalidateAlarms(windowId?: number): Promise<void> {
		if (windowId != null) {
			log.debug(TAG, "invalidating alarms for window", windowId)
			await this.get(windowId)?.commonNativeFacade.invalidateAlarms()
		} else {
			log.debug(TAG, "invalidating alarms for all windows")
			await Promise.all(
				this.getAll().map((w) => this.invalidateAlarms(w.id).catch((e) => log.debug(TAG, "couldn't invalidate alarms for window", w.id, e))),
			)
		}
	}

	hide() {
		if (process.platform === "darwin") {
			app.hide() // hide all windows & give active app status to previous app
		} else {
			for (const w of windows) {
				w.hide()
			}
		}
	}

	minimize() {
		for (const w of windows) {
			w.minimize()
		}
	}

	changeZoom(scale: number) {
		if (scale > 3) {
			scale = 3
		} else if (scale < 0.5) scale = 0.5

		this._currentBounds.scale = scale
		for (const w of windows) {
			w.setZoomFactor(scale)
		}
	}

	get(id: number): ApplicationWindow | null {
		const w = windows.find((w) => w.id === id)
		return w ? w : null
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

	async openMailBox(info: UserInfo, path?: string | null): Promise<void> {
		return (await this.findWindowWithUserId(info.userId)).openMailBox(info, path)
	}

	async openCalendar(info: UserInfo): Promise<void> {
		return (await this.findWindowWithUserId(info.userId)).openCalendar(info)
	}

	async findWindowWithUserId(userId: string): Promise<ApplicationWindow> {
		return windows.find((w) => w.getUserId() === userId) ?? windows.find((w) => w.getUserId() === null) ?? this.newWindow(true, true)
	}

	/**
	 * Save the WindowManager's current window bounds and scale to config.
	 */
	saveCurrentBounds(): void {
		this._conf.setVar(DesktopConfigKey.lastBounds, this._currentBounds)
	}

	/**
	 * Set window size & location in the WindowManager and save them and the manager's window scale to config.
	 * The WindowManagers scale will be retained even if the window bounds have a different scale.
	 */
	saveWindowBounds = debounce(100, (w: ApplicationWindow) => {
		const bounds = w.getBounds()
		const displayRect = screen.getDisplayMatching(bounds.rect).bounds

		if (!isRectContainedInRect(displayRect, bounds.rect)) return
		this._currentBounds.fullscreen = bounds.fullscreen
		this._currentBounds.rect = bounds.rect

		this.saveCurrentBounds()
	})

	_setSpellcheckLang(l: string): void {
		this._electron.session.defaultSession.setSpellCheckerLanguages(l === "" ? [] : [l])
	}

	/**
	 * load lastBounds from config.
	 * if there are none or they don't match a screen, save default bounds to config
	 */
	async loadStartingBounds(): Promise<void> {
		const loadedBounds: WindowBounds = await this._conf.getVar(DesktopConfigKey.lastBounds)
		const lastBounds = loadedBounds || this._currentBounds
		const displayRect = screen.getDisplayMatching(lastBounds.rect).bounds
		// we may have loaded bounds that are not in bounds of the screen
		// if ie the resolution changed, more/less screens, ...
		if (isRectContainedInRect(displayRect, lastBounds.rect)) {
			this._currentBounds = Object.assign(this._currentBounds, lastBounds)
		}
		this.saveCurrentBounds()
	}

	private async _newWindow(electron: ElectronExports, localShortcut: LocalShortcutManager, noAutoLogin: boolean | null): Promise<ApplicationWindow> {
		const absoluteWebAssetsPath = this._electron.app.getAppPath()
		const icon = await this.icon.getAsync()

		// custom builds get the dicts from us as well
		return new ApplicationWindow(
			this,
			absoluteWebAssetsPath,
			icon,
			electron,
			localShortcut,
			this.themeFacade,
			this.remoteBridge,
			noAutoLogin,
			this.preloadOverride,
		)
	}
}
