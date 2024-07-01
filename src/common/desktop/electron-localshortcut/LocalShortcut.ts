// @ts-nocheck
import { app, BrowserWindow } from "electron"
import isAccelerator from "./IsAccelerator"
import equals from "./KeyboardEventsAreEqual"
import { toKeyEvent } from "./KeyboardeventFromElectronAccelerator"

const DEBUG = false
const debug: (..._: any[]) => void = DEBUG ? console.log.bind(console) : () => {}

export class LocalShortcutManager {
	enableAll(win: BrowserWindow): void {
		enableAll(win)
	}

	disableAll(win: BrowserWindow): void {
		disableAll(win)
	}

	register(win: BrowserWindow, accelerator: Accelerator, callback: () => boolean | void): void {
		register(win, accelerator, callback)
	}

	unregisterAll(win: BrowserWindow): void {
		unregisterAll(win)
	}
}

// A placeholder to register shortcuts
// on any window of the app.
export const ANY_WINDOW: symbol = Symbol("any-window")

type Shortcut = {
	eventStamp: unknown
	callback: () => void
	enabled: boolean
}

// I give up on typing this, this is a mess

type ShortcutsList = any //Array<Shortcut> & {removeListener?: () => void}
const windowsWithShortcuts: WeakMap<any, any> = new WeakMap()

const title = (win: BrowserWindow | typeof ANY_WINDOW | null) => {
	if (win instanceof BrowserWindow) {
		try {
			return win.getTitle()
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			return "A destroyed window"
		}
	}

	return "An falsy value"
}

function _checkAccelerator(accelerator: string) {
	if (!isAccelerator(accelerator)) {
		const w: any = {}
		Error.captureStackTrace(w)
		const stack = w.stack ? w.stack.split("\n").slice(4).join("\n") : w.message
		const msg = `
WARNING: ${JSON.stringify(accelerator)} is not a valid accelerator.
${stack}
`
		console.error(msg)
	}
}

/**
 * Disable all of the shortcuts registered on the BrowserWindow instance.
 * Registered shortcuts no more works on the `window` instance, but the module
 * keep a reference on them. You can reactivate them later by calling `enableAll`
 * method on the same window instance.
 * @param  {BrowserWindow} win BrowserWindow instance
 */
export function disableAll(win: BrowserWindow) {
	debug(`Disabling all shortcuts on window ${title(win)}`)
	const wc = win.webContents
	const shortcutsOfWindow = windowsWithShortcuts.get(wc)
	if (!shortcutsOfWindow) return

	for (const shortcut of shortcutsOfWindow) {
		shortcut.enabled = false
	}
}

/**
 * Enable all of the shortcuts registered on the BrowserWindow instance that
 * you had previously disabled calling `disableAll` method.
 * @param  {BrowserWindow} win BrowserWindow instance
 */
export function enableAll(win: BrowserWindow) {
	debug(`Enabling all shortcuts on window ${title(win)}`)
	const wc = win.webContents
	const shortcutsOfWindow = windowsWithShortcuts.get(wc)
	if (!shortcutsOfWindow) return

	for (const shortcut of shortcutsOfWindow) {
		shortcut.enabled = true
	}
}

/**
 * Unregisters all of the shortcuts registered on any focused BrowserWindow
 * instance. This method does not unregister any shortcut you registered on
 * a particular window instance.
 * @param  {BrowserWindow} win BrowserWindow instance
 */
export function unregisterAll(win: BrowserWindow) {
	debug(`Unregistering all shortcuts on window ${title(win)}`)
	const wc = win.webContents
	const shortcutsOfWindow = windowsWithShortcuts.get(wc)
	if (shortcutsOfWindow && shortcutsOfWindow.removeListener) {
		// Remove listener from window
		shortcutsOfWindow.removeListener()
		windowsWithShortcuts.delete(wc)
	}
}

function _normalizeEvent(input: Input) {
	const normalizedEvent: { code: string; key: string; ctrlKey?: boolean } = {
		code: input.code,
		key: input.key,
	}

	for (let prop of ["alt", "shift", "meta"]) {
		if (typeof input[prop] !== "undefined") {
			normalizedEvent[`${prop}Key`] = input[prop]
		}
	}

	if (typeof input.control !== "undefined") {
		normalizedEvent.ctrlKey = input.control
	}

	return normalizedEvent
}

function _findShortcut(event, shortcutsOfWindow) {
	let i = 0
	for (const shortcut of shortcutsOfWindow) {
		if (equals(shortcut.eventStamp, event)) {
			return i
		}

		i++
	}

	return -1
}

interface Input {
	/**
	 * Either `keyUp` or `keyDown`.
	 */
	type: string
	/**
	 * Equivalent to KeyboardEvent.key.
	 */
	key: string
	/**
	 * Equivalent to KeyboardEvent.code.
	 */
	code: string
	/**
	 * Equivalent to KeyboardEvent.repeat.
	 */
	isAutoRepeat: boolean
	/**
	 * Equivalent to KeyboardEvent.isComposing.
	 */
	isComposing: boolean
	/**
	 * Equivalent to KeyboardEvent.shiftKey.
	 */
	shift: boolean
	/**
	 * Equivalent to KeyboardEvent.controlKey.
	 */
	control: boolean
	/**
	 * Equivalent to KeyboardEvent.altKey.
	 */
	alt: boolean
	/**
	 * Equivalent to KeyboardEvent.metaKey.
	 */
	meta: boolean
}

const _onBeforeInput =
	(shortcutsOfWindow) =>
	(e, input: Input): void => {
		if (input.type === "keyUp") {
			return
		}

		const event = _normalizeEvent(input)

		debug(`before-input-event: ${String(input)} is translated to: ${String(event)}`)
		for (const { eventStamp, callback } of shortcutsOfWindow) {
			if (equals(eventStamp, event)) {
				debug(`eventStamp: ${String(eventStamp)} match`)
				callback()

				return
			}

			debug(`eventStamp: ${String(eventStamp)} no match`)
		}
	}

type Accelerator = string | Array<string>

/**
 * Registers the shortcut `accelerator`on the BrowserWindow instance.
 * @param  {BrowserWindow} win - BrowserWindow instance to register.
 * This argument could be omitted, in this case the function register
 * the shortcut on all app windows.
 * @param  {String|Array<String>} accelerator - the shortcut to register
 * @param  {Function} callback    This function is called when the shortcut is pressed
 * and the window is focused and not minimized.
 */
export function register(win: BrowserWindow, accelerator: Accelerator, callback: () => boolean | void) {
	let wc = win.webContents

	if (Array.isArray(accelerator)) {
		for (const acceleratorValue of accelerator) {
			if (typeof acceleratorValue === "string") {
				register(win, acceleratorValue, callback)
			}
		}
		return
	}
	const acceleratorString: string = accelerator

	debug(`Registering callback for ${acceleratorString} on window ${title(win)}`)
	_checkAccelerator(acceleratorString)

	debug(`${acceleratorString} seems to be a valid shortcut sequence`)

	let shortcutsOfWindow: ShortcutsList = windowsWithShortcuts.get(wc)
	if (shortcutsOfWindow == null) {
		debug("This is the first shortcut of the window")
		shortcutsOfWindow = []
		windowsWithShortcuts.set(wc, shortcutsOfWindow)

		if ((wc as any) === ANY_WINDOW) {
			const keyHandler = _onBeforeInput(shortcutsOfWindow)
			const enableAppShortcuts = (e, win) => {
				const wc = win.webContents
				wc.on("before-input-event", keyHandler)
				wc.once("closed", () => {
					wc.removeListener("before-input-event", keyHandler)
				})
			}

			// Enable shortcut on current windows
			const windows = BrowserWindow.getAllWindows()

			for (const win of windows) {
				enableAppShortcuts(null, win)
			}

			// Enable shortcut on future windows
			app.on("browser-window-created", enableAppShortcuts)

			shortcutsOfWindow.removeListener = () => {
				const windows = BrowserWindow.getAllWindows()
				for (const win of windows) {
					win.webContents.removeListener("before-input-event", keyHandler)
				}
				app.removeListener("browser-window-created", enableAppShortcuts)
			}
		} else {
			const keyHandler = _onBeforeInput(shortcutsOfWindow)
			wc.on("before-input-event", keyHandler)

			// Save a reference to allow remove of listener from elsewhere
			shortcutsOfWindow.removeListener = () => {
				wc.removeListener("before-input-event", keyHandler)
			}
			// @ts-ignore
			wc.once("closed", shortcutsOfWindow.removeListener)
		}
	}

	debug("Adding shortcut to window set.")

	const eventStamp = toKeyEvent(accelerator)

	shortcutsOfWindow.push({
		eventStamp,
		callback,
		enabled: true,
	})

	debug("Shortcut registered.")
}

/**
 * Unregisters the shortcut of `accelerator` registered on the BrowserWindow instance.
 * @param  {BrowserWindow} win - BrowserWindow instance to unregister.
 * This argument could be omitted, in this case the function unregister the shortcut
 * on all app windows. If you registered the shortcut on a particular window instance, it will do nothing.
 * @param  {String|Array<String>} accelerator - the shortcut to unregister
 */
export function unregister(win: BrowserWindow | typeof ANY_WINDOW, accelerator: Accelerator) {
	if (win instanceof BrowserWindow && win.isDestroyed()) {
		return
	}
	let wc = win instanceof BrowserWindow ? win.webContents : ANY_WINDOW

	if (Array.isArray(accelerator)) {
		for (const nestedAccelerator of accelerator) {
			if (typeof nestedAccelerator === "string") {
				unregister(win, nestedAccelerator)
			}
		}
		return
	}

	debug(`Unregistering callback for ${accelerator} on window ${title(win)}`)

	_checkAccelerator(accelerator)

	debug(`${accelerator} seems a valid shortcut sequence.`)

	if (!windowsWithShortcuts.has(wc)) {
		debug("Early return because window has never had shortcuts registered.")
		return
	}

	const shortcutsOfWindow: any = windowsWithShortcuts.get(wc)

	const eventStamp = toKeyEvent(accelerator)
	const shortcutIdx = _findShortcut(eventStamp, shortcutsOfWindow)
	if (shortcutIdx === -1) {
		return
	}

	shortcutsOfWindow.splice(shortcutIdx, 1)

	// If the window has no more shortcuts,
	// we remove it early from the WeakMap
	// and unregistering the event listener
	if (shortcutsOfWindow.length === 0) {
		// Remove listener from window
		shortcutsOfWindow.removeListener()

		// Remove window from shortcuts catalog
		windowsWithShortcuts.delete(wc)
	}
}

/**
 * Returns `true` or `false` depending on whether the shortcut `accelerator`
 * is registered on `window`.
 * @param  {BrowserWindow} win - BrowserWindow instance to check. This argument
 * could be omitted, in this case the function returns whether the shortcut
 * `accelerator` is registered on all app windows. If you registered the
 * shortcut on a particular window instance, it return false.
 * @param  {String} accelerator - the shortcut to check
 * @return {Boolean} - if the shortcut `accelerator` is registered on `window`.
 */
export function isRegistered(win: BrowserWindow, accelerator: string): boolean {
	_checkAccelerator(accelerator)
	const wc = win.webContents
	const shortcutsOfWindow: any = windowsWithShortcuts.get(wc)
	const eventStamp = toKeyEvent(accelerator)

	return _findShortcut(eventStamp, shortcutsOfWindow) !== -1
}
