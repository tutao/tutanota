// @flow
import m from "mithril"
import {Mode, assertMainOrNode} from "../api/Env"
import {lang} from "./LanguageViewModel"

assertMainOrNode()

class WindowFacade {
	_windowSizeListeners: windowSizeListener[];
	resizeTimeout: ?number;

	constructor() {
		this._windowSizeListeners = []
		this.resizeTimeout = null
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
		if (enable) {
			window.addEventListener("beforeunload", this._checkWindowClose)
		} else {
			window.removeEventListener("beforeunload", this._checkWindowClose)
		}
	}

	_checkWindowClose(e: any) { // BeforeUnloadEvent
		let m = lang.get("closeWindowConfirmation_msg")
		e.returnValue = m
		return m
	}


	addOnlineListener(listener: Function) {
		window.addEventListener("online", listener)
	}

	addOfflineListener(listener: Function) {
		window.addEventListener("offline", listener)
	}
}

export const windowFacade: WindowFacade = new WindowFacade()