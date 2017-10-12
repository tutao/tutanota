// @flow
import m from "mithril"
import {Mode, assertMainOrNode} from "../api/Env"
import {lang} from "./LanguageViewModel"
import {worker} from "../api/main/WorkerClient"

assertMainOrNode()

class WindowFacade {
	_windowSizeListeners: windowSizeListener[];
	resizeTimeout: ?number;
	windowCloseConfirmation: boolean;

	constructor() {
		this._windowSizeListeners = []
		this.resizeTimeout = null
		this.windowCloseConfirmation = false
		this.init()
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


	openLink(href: string): window {
		if (env.mode == Mode.App) {
			return window.open(href, "_system");
		} else {
			return window.open(href, "_blank");
		}
	}

	init() {
		window.onresize = (event) => {
			// see https://developer.mozilla.org/en-US/docs/Web/Events/resize
			// TODO (android >= 4.4) switch to requestAnimationFrame
			if (!this.resizeTimeout) {
				this.resizeTimeout = setTimeout(() => {
					this.resizeTimeout = null
					this._resize()
					// The actualResizeHandler will execute at a rate of 15fps
				}, 66)
			}
		}
		window.addEventListener("beforeunload", e => this._checkWindowClose(e))
		window.addEventListener("unload", e => this._close())
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

	_checkWindowClose(e: any) { // BeforeUnloadEvent
		if (this.windowCloseConfirmation) {
			let m = lang.get("closeWindowConfirmation_msg")
			e.returnValue = m
			return m
		}
	}

	_close() {
		worker.logout(true) // TODO investigate sendBeacon API as soon as it is widely supported (https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)
	}


	addOnlineListener(listener: Function) {
		window.addEventListener("online", listener)
	}

	addOfflineListener(listener: Function) {
		window.addEventListener("offline", listener)
	}
}

export const windowFacade: WindowFacade = new WindowFacade()