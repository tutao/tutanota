// @flow
import m from "mithril"
import {assertMainOrNodeBoot, isAndroidApp, isApp, Mode} from "../api/Env"
import {lang} from "./LanguageViewModel"
import type {WorkerClient} from "../api/main/WorkerClient"
import {asyncImport} from "../api/common/utils/Utils"
import {reloadNative} from "../native/SystemApp"
import {CloseEventBusOption} from "../api/common/TutanotaConstants"
import {nativeApp} from "../native/NativeWrapper";

assertMainOrNodeBoot()

export type KeyboardSizeListener = (keyboardSize: number) => mixed;

class WindowFacade {
	_windowSizeListeners: windowSizeListener[];
	resizeTimeout: ?AnimationFrameID;
	windowCloseConfirmation: boolean;
	_windowCloseListeners: Set<() => void>;
	_worker: WorkerClient;
	// following two properties are for the iOS
	_keyboardSize = 0;
	_keyboardSizeListeners: KeyboardSizeListener[] = [];

	constructor() {
		this._windowSizeListeners = []
		this.resizeTimeout = null
		this.windowCloseConfirmation = false
		this._windowCloseListeners = new Set()
		this.init()
		asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
			`${env.rootPathPrefix}src/api/main/WorkerClient.js`)
			.then(module => {
				// load async to reduce size of boot bundle
				this._worker = module.worker
				return nativeApp.initialized()
			}).then(() => this.addPageInBackgroundListener())
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

	addWindowCloseListener(listener: () => void): Function {
		this._windowCloseListeners.add(listener)
		return () => this._windowCloseListeners.delete(listener)
	}

	notifyCloseListeners() {
		this._windowCloseListeners.forEach(f => f())
	}

	addKeyboardSizeListener(listener: KeyboardSizeListener) {
		this._keyboardSizeListeners.push(listener);
		listener(this._keyboardSize);
	}

	removeKeyboardSizeListener(listener: KeyboardSizeListener) {
		const index = this._keyboardSizeListeners.indexOf(listener)
		if (index > -1) {
			this._keyboardSizeListeners.splice(index, 1)
		}
	}

	openLink(href: string): window {
		if (env.mode === Mode.App) {
			return window.open(href, "_system");
		} else {
			return window.open(href, "_blank");
		}
	}

	init() {
		window.onresize = () => {
			// see https://developer.mozilla.org/en-US/docs/Web/Events/resize
			if (!this.resizeTimeout) {
				this.resizeTimeout = requestAnimationFrame(() => {
					this.resizeTimeout = null
					this._resize()
					// The actualResizeHandler will execute at a rate of 15fps
				})
			}
		}
		if (window.addEventListener && !isApp()) {
			window.addEventListener("beforeunload", e => this._beforeUnload(e))
			window.addEventListener("unload", e => this._onUnload())
		}
	}

	_resize() {
		//console.log("resize")
		try {
			for (let listener of this._windowSizeListeners) {
				listener(window.innerWidth, window.innerHeight)
			}
		} finally {
			m.redraw()
		}
	}

	checkWindowClosing(enable: boolean) {
		this.windowCloseConfirmation = enable
	}

	_beforeUnload(e: any) { // BeforeUnloadEvent
		this.notifyCloseListeners()
		if (this.windowCloseConfirmation) {
			let m = lang.get("closeWindowConfirmation_msg")
			e.returnValue = m
			return m
		} else {
			this._worker.logout(true)
		}
	}

	_onUnload() {
		if (this.windowCloseConfirmation) {
			this._worker.logout(true) // TODO investigate sendBeacon API as soon as it is widely supported (https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)
		}
	}


	addOnlineListener(listener: Function) {
		window.addEventListener("online", listener)
	}

	addOfflineListener(listener: Function) {
		window.addEventListener("offline", listener)
	}

	/**
	 * Runs a setInterval and if more time than expected has passed we assume we resumed after suspend.
	 */
	addResumeAfterSuspendListener(listener: Function) {
		let CHECK_INTERVAL_SECONDS = 10
		let lastCheckTime = new Date().getTime()
		setInterval(() => {
			let newTime = new Date().getTime()
			// if more than 10 seconds more have passed we assume we resumed from suspend
			if ((newTime - lastCheckTime - CHECK_INTERVAL_SECONDS * 1000) > 10 * 1000) {
				listener()
			}
			lastCheckTime = newTime
		}, CHECK_INTERVAL_SECONDS * 1000)
	}

	reload(args: {[string]: any}) {
		if (isApp()) {
			if (!args.hasOwnProperty("noAutoLogin")) {
				args.noAutoLogin = true
			}
			let newQueryString = m.buildQueryString(args)
			reloadNative(newQueryString.length > 0 ? "?" + newQueryString : "")
		} else {
			window.location.reload();
		}
	}

	addPageInBackgroundListener() {
		if (isApp()) {
			document.addEventListener("visibilitychange", () => {
				console.log("Visibility change, hidden: ", document.hidden)
				if (document.hidden) {
					if (isAndroidApp()) {
						setTimeout(() => {
							// if we're still in background after timeout, pause WebSocket
							if (document.hidden) {
								this._worker.closeEventBus(CloseEventBusOption.Pause)
							}
						}, 30 * 1000)
					}
				} else {
					// On iOS devices the WebSocket close event fires when the app comes back to foreground
					// so we try to reconnect with a delay to receive _close event first. Otherwise
					// we may try to reconnect while we think that we're still connected
					// (e.g. first reconnect and then receive close).
					// We used to handle it in the EventBus and reconnect immediately but isIosApp()
					// check does not work in the worker currently.
					// Doing this for all apps just to be sure.
					setTimeout(() => this._worker.tryReconnectEventBus(false, true), 100)
				}
			})
		}
	}

	onKeyboardSizeChanged(size: number) {
		this._keyboardSize = size;
		for (let listener of this._keyboardSizeListeners) {
			listener(size);
		}
		if (size > 0) {
			// reset position fixed for the body to allow scrolling in dialogs on iOS
			// https://github.com/scottjehl/Device-Bugs/issues/14
			const body = (document.body: any)
			body.style.position = 'unset'
			setTimeout(() => {
				body.style.position = 'fixed'
			}, 200)
		}
	}
}

export const windowFacade: WindowFacade = new WindowFacade()
