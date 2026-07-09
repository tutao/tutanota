import { type KeyboardSizeListener, WindowSizeListener } from "./utils/WindowUtils"

export interface IWindowFacade {
	/**
	 * Add a window resize listener with a listenerId
	 * @param listener Provides the new width and height of the window if the values change.
	 */
	addResizeListener(listener: WindowSizeListener): void

	removeResizeListener(resizeListener: WindowSizeListener): void

	removeHistoryEventListener(listener: (e: Event) => boolean): void

	/**
	 * add a function to call when onpopstate event occurs
	 * @param listener: return true if this popstate may go ahead
	 * @returns {Function}
	 */
	addHistoryEventListener(listener: (e: Event) => boolean): () => void

	addWindowCloseListener(listener: () => unknown): (...args: Array<any>) => any

	addKeyboardSizeListener(listener: KeyboardSizeListener): void

	closeWindow(): void
}
