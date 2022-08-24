import m, {Params} from "mithril"
import {assertMainOrNodeBoot, isApp, isElectronClient, isIOSApp, Mode} from "../api/common/Env"
import {lang} from "./LanguageViewModel"
import type {WorkerClient} from "../api/main/WorkerClient"
import {client} from "./ClientDetector"
import {logins} from "../api/main/LoginController"
import type {Indexer} from "../api/worker/search/Indexer"

assertMainOrNodeBoot()
export type KeyboardSizeListener = (keyboardSize: number) => unknown
export type windowSizeListener = (width: number, height: number) => unknown

export class WindowFacade {
	private _windowSizeListeners: windowSizeListener[]
	resizeTimeout: (AnimationFrameID | null) | (TimeoutID | null)
	windowCloseConfirmation: boolean
	private _windowCloseListeners: Set<(e: Event) => unknown>
	private _historyStateEventListeners: Array<(e: Event) => boolean> = []
	private _worker: WorkerClient | null = null
	private _indexerFacade: Indexer | null = null
	// following two properties are for the iOS
	private _keyboardSize: number = 0
	private _keyboardSizeListeners: KeyboardSizeListener[] = []
	private _ignoreNextPopstate: boolean = false

	constructor() {
		this._windowSizeListeners = []
		this.resizeTimeout = null
		this.windowCloseConfirmation = false
		this._windowCloseListeners = new Set()
		// load async to reduce size of boot bundle
		import("../api/main/MainLocator").then(async ({locator}) => {
			// We need to wait til the locator has finished initializing before we read from it
			// because it is happening concurrently
			await locator.initialized
			this._worker = locator.worker
			this._indexerFacade = locator.indexerFacade

			if (env.mode === Mode.App || env.mode === Mode.Desktop || env.mode === Mode.Admin) {
				this.addPageInBackgroundListener()
			}
		})
	}

	/**
	 * Add a window resize listener with a listenerId
	 * @param listener Provides the new width and height of the window if the values change.
	 */
	addResizeListener(listener: windowSizeListener) {
		this._windowSizeListeners.push(listener)
	}

	removeResizeListener(listener: windowSizeListener) {
		let index = this._windowSizeListeners.indexOf(listener)

		if (index > -1) {
			this._windowSizeListeners.splice(index, 1)
		}
	}

	addWindowCloseListener(listener: () => unknown): (...args: Array<any>) => any {
		this._windowCloseListeners.add(listener)

		this._checkWindowClosing(this._windowCloseListeners.size > 0)

		return () => {
			this._windowCloseListeners.delete(listener)

			this._checkWindowClosing(this._windowCloseListeners.size > 0)
		}
	}

	_notifyCloseListeners(e: Event) {
		this._windowCloseListeners.forEach(f => f(e))
	}

	addKeyboardSizeListener(listener: KeyboardSizeListener) {
		this._keyboardSizeListeners.push(listener)

		listener(this._keyboardSize)
	}

	removeKeyboardSizeListener(listener: KeyboardSizeListener) {
		const index = this._keyboardSizeListeners.indexOf(listener)

		if (index > -1) {
			this._keyboardSizeListeners.splice(index, 1)
		}
	}

	openLink(href: string) {
		if (env.mode === Mode.App) {
			window.open(href, "_system")
		} else {
			window.open(href, "_blank")
		}
	}

	init() {
		const onresize = () => {
			// see https://developer.mozilla.org/en-US/docs/Web/Events/resize
			if (!this.resizeTimeout) {
				const cb = () => {
					this.resizeTimeout = null

					this._resize() // The actualResizeHandler will execute at a rate of 15fps
				}

				// On mobile devices there's usaually no resize but when changing orientation it's to early to
				// measure the size in requestAnimationFrame (it's usually incorrect size at this point)
				this.resizeTimeout = client.isMobileDevice() ? setTimeout(cb, 66) : requestAnimationFrame(cb)
			}
		}
		window.onresize = onresize
		// specifially for iOS: rotation through the unsupported orientation (e.g, 90 degrees 3 times) will not trigger the resize and we wouldn't resize
		// some things so we react to both, it is throttled anyway
		window.onorientationchange = onresize

		if (window.addEventListener && !isApp()) {
			window.addEventListener("beforeunload", e => this._beforeUnload(e))
			window.addEventListener("popstate", e => this._popState(e))
			window.addEventListener("unload", e => this._onUnload())
		}

		// needed to help the MacOs desktop client to distinguish between Cmd+Arrow to navigate the history
		// and Cmd+Arrow to navigate a text editor
		if (env.mode === Mode.Desktop && client.isMacOS && window.addEventListener) {
			window.addEventListener("keydown", e => {
				if (!e.metaKey || e.key === "Meta") return

				const target = e.target as HTMLElement | null
				// prevent history nav if the active element is an input / squire editor
				if (target?.tagName === "INPUT" || target?.contentEditable === "true") {
					e.stopPropagation()
				} else if (e.key === "ArrowLeft") {
					window.history.back()
				} else if (e.key === "ArrowRight") {
					window.history.forward()
				}
			})
		}
	}

	_resize() {
		try {
			for (let listener of this._windowSizeListeners) {
				listener(window.innerWidth, window.innerHeight)
			}
		} finally {
			m.redraw()
		}
	}

	_checkWindowClosing(enable: boolean) {
		this.windowCloseConfirmation = enable
	}

	_beforeUnload(e: any): string | null {
		// BeforeUnloadEvent
		console.log("windowfacade._beforeUnload")

		this._notifyCloseListeners(e)

		if (this.windowCloseConfirmation) {
			let m = lang.get("closeWindowConfirmation_msg")
			e.returnValue = m
			return m
		} else {
			logins.logout(true)
			return null
		}
	}

	/**
	 * add a function to call when onpopstate event occurs
	 * @param listener: return true if this popstate may go ahead
	 * @returns {Function}
	 */
	addHistoryEventListener(listener: (e: Event) => boolean): () => void {
		this._historyStateEventListeners.push(listener)

		return () => {
			const index = this._historyStateEventListeners.indexOf(listener)

			if (index !== -1) {
				this._historyStateEventListeners.splice(index, 1)
			}
		}
	}

	/**
	 * calls the last history event listener that was added
	 * and reverts the state change if it returns false
	 * TODO: this also fires for forward-events and when the user jumps around in the history
	 * TODO: by long-clicking the back/forward buttons.
	 * TODO: solving this requires extensive bookkeeping because the events are indistinguishable by default
	 * @param e: popstate DOM event
	 * @private
	 */
	_popState(e: Event) {
		const len = this._historyStateEventListeners.length
		if (len === 0) return

		if (this._ignoreNextPopstate) {
			this._ignoreNextPopstate = false
			return
		}

		if (!this._historyStateEventListeners[len - 1](e)) {
			this._ignoreNextPopstate = true
			history.go(1)
		}
	}

	_onUnload() {
		if (this.windowCloseConfirmation) {
			logins.logout(true)
		}
	}

	addOnlineListener(listener: () => void) {
		window.addEventListener("online", listener)
	}

	addOfflineListener(listener: () => void) {
		window.addEventListener("offline", listener)
	}

	async reload(args: Params) {
		if (isApp() || isElectronClient()) {
			if (!args.hasOwnProperty("noAutoLogin")) {
				args.noAutoLogin = true
			}

			const {locator} = await import("../api/main/MainLocator")

			const stringifiedArgs: Record<string, string> = {}
			for (const [k, v] of Object.entries(args)) {
				if (v != null) {
					stringifiedArgs[k] = String(v)
				}
			}
			await locator.commonSystemFacade.reload(stringifiedArgs)
		} else {
			window.location.reload()
		}
	}

	addPageInBackgroundListener() {
		// For Android it's handled manually from native because visibilitychange listener is not called after the
		// app was inactive for some time.
		// See NativeWrapperCommands.js
		if (isIOSApp()) {
			document.addEventListener("visibilitychange", () => {
				console.log("Visibility change, hidden: ", document.hidden)

				this._indexerFacade?.onVisibilityChanged(!document.hidden)

				if (!document.hidden) {
					// On iOS devices the WebSocket close event fires when the app comes back to foreground
					// so we try to reconnect with a delay to receive _close event first. Otherwise
					// we may try to reconnect while we think that we're still connected
					// (e.g. first reconnect and then receive close).
					// We used to handle it in the EventBus and reconnect immediately but isIosApp()
					// check does not work in the worker currently.
					// Doing this for all apps just to be sure.
					setTimeout(() => this._worker?.tryReconnectEventBus(false, true), 100)
				}
			})
		}
	}

	onKeyboardSizeChanged(size: number) {
		this._keyboardSize = size

		for (let listener of this._keyboardSizeListeners) {
			listener(size)
		}

		if (size > 0) {
			// reset position fixed for the body to allow scrolling in dialogs on iOS
			// https://github.com/scottjehl/Device-Bugs/issues/14
			const body = document.body as any
			body.style.position = "unset"
			setTimeout(() => {
				body.style.position = "fixed"
			}, 200)
		}
	}
}

export const windowFacade: WindowFacade = new WindowFacade()