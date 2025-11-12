import type { Country } from "../../api/common/CountryList"
import { Countries } from "../../api/common/CountryList"
import type { InfoLink, MaybeTranslation, TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { ButtonColor } from "./Button.js"
import { Icons } from "./icons/Icons"
import type { DropdownChildAttrs } from "./Dropdown.js"
import { createAsyncDropdown } from "./Dropdown.js"
import type { $Promisable, lazy, MaybeLazy } from "@tutao/tutanota-utils"
import { assertNotNull, lazyMemoized, resolveMaybeLazy } from "@tutao/tutanota-utils"
import { Dialog } from "./Dialog"
import { ProgrammingError } from "../../api/common/error/ProgrammingError"
import m, { Children } from "mithril"
import { DropDownSelector } from "./DropDownSelector.js"
import { IconButtonAttrs } from "./IconButton.js"
import { LoginController } from "../../api/main/LoginController.js"
import { client } from "../../misc/ClientDetector.js"
import type { Contact } from "../../api/entities/tutanota/TypeRefs.js"
import { isColorLight } from "./Color.js"

export const enum DropType {
	ExternalFile = "ExternalFile",
	Mail = "Mail",
}

export type MailDropData = {
	dropType: DropType.Mail
	mailId: string
}
export type FileDropData = {
	dropType: DropType.ExternalFile
	files: Array<File>
}

export type DropData = FileDropData | MailDropData

export type DropHandler = (dropData: DropData) => void
// not all browsers have the actual button as e.currentTarget, but all of them send it as a second argument (see https://github.com/tutao/tutanota/issues/1110)
export type ClickHandler = (event: MouseEvent, dom: HTMLElement) => void
export type KeyboardHandler = (event: KeyboardEvent, dom: HTMLElement) => void

// lazy because of global dependencies
const dropdownCountries = lazyMemoized(() => Countries.map((c) => ({ value: c, name: c.n })))

export function renderCountryDropdown(params: {
	selectedCountry: Country | null
	onSelectionChanged: (country: Country) => void
	helpLabel?: lazy<string>
	label?: MaybeTranslation
}): Children {
	return m(DropDownSelector, {
		label: params.label ?? "invoiceCountry_label",
		helpLabel: params.helpLabel,
		items: [
			...dropdownCountries(),
			{
				value: null,
				name: lang.get("choose_label"),
			},
		],
		selectedValue: params.selectedCountry,
		selectionChangedHandler: params.onSelectionChanged,
	})
}

export function createMoreActionButtonAttrs(
	lazyChildren: MaybeLazy<$Promisable<ReadonlyArray<DropdownChildAttrs | null>>>,
	dropdownWidth?: number,
): IconButtonAttrs {
	return {
		title: "more_label",
		colors: ButtonColor.Nav,
		icon: Icons.More,
		click: createAsyncDropdown({
			width: dropdownWidth,
			lazyButtons: async () => resolveMaybeLazy(lazyChildren),
		}),
	}
}

type Confirmation = {
	confirmed: (_: () => unknown) => Confirmation
	cancelled: (_: () => unknown) => Confirmation
	result: Promise<boolean>
}

/**
 * Wrapper around Dialog.confirm
 *
 * call getConfirmation(...).confirmed(() => doStuff()) or getConfirmation(...).cancelled(() => doStuff())
 * to handle confirmation or termination
 * @param message
 * @param confirmMessage
 * @returns {Confirmation}
 */
export function getConfirmation(message: MaybeTranslation, confirmMessage: TranslationKey = "ok_action"): Confirmation {
	const confirmationPromise = Dialog.confirm(message, confirmMessage)
	const confirmation: Confirmation = {
		confirmed(action) {
			confirmationPromise.then((ok) => {
				if (ok) {
					action()
				}
			})
			return confirmation
		},

		cancelled(action) {
			confirmationPromise.then((ok) => {
				if (!ok) {
					action()
				}
			})
			return confirmation
		},

		result: confirmationPromise,
	}
	return confirmation
}

/**
 * Get either the coord of a mouseevent or the coord of the first touch of a touch event
 * @param event
 * @returns {{x: number, y: number}}
 */
export function getCoordsOfMouseOrTouchEvent(event: MouseEvent | TouchEvent): {
	x: number
	y: number
} {
	return event instanceof MouseEvent
		? {
				x: event.clientX,
				y: event.clientY,
			}
		: {
				// Why would touches be empty?
				x: assertNotNull(event.touches.item(0)).clientX,
				y: assertNotNull(event.touches.item(0)).clientY,
			}
}

export function makeListSelectionChangedScrollHandler(scrollDom: HTMLElement, entryHeight: number, getSelectedEntryIndex: lazy<number>): () => void {
	return function () {
		scrollListDom(scrollDom, entryHeight, getSelectedEntryIndex())
	}
}

export function scrollListDom(scrollDom: HTMLElement, entryHeight: number, selectedIndex: number) {
	const scrollWindowHeight = scrollDom.getBoundingClientRect().height
	const scrollOffset = scrollDom.scrollTop
	// Actual position in the list
	const selectedTop = entryHeight * selectedIndex
	const selectedBottom = selectedTop + entryHeight
	// Relative to the top of the scroll window
	const selectedRelativeTop = selectedTop - scrollOffset
	const selectedRelativeBottom = selectedBottom - scrollOffset

	// clamp the selected item to stay between the top and bottom of the scroll window
	if (selectedRelativeTop < 0) {
		scrollDom.scrollTop = selectedTop
	} else if (selectedRelativeBottom > scrollWindowHeight) {
		scrollDom.scrollTop = selectedBottom - scrollWindowHeight
	}
}

/**
 * Executes the passed function if the user is allowed to see `tuta.com` links.
 * @param logins LoginController to ask about login information
 * @param linkId
 * @param render receives the resolved link
 * @returns {Children|null}
 */
export function ifAllowedTutaLinks(logins: LoginController, linkId: InfoLink, render: (linkId: InfoLink) => Children): Children | null {
	// this is currently in gui-base, preventing us from accessing logins ourselves.
	// may be subject to change
	if (canSeeTutaLinks(logins)) {
		return render(linkId)
	}
	return null
}

/**
 * Check if the user is allowed to see `tutanota.com` links or other major references to Tutanota.
 *
 * If the user is on whitelabel and they are not global admin, information like this should not be shown.
 * @param logins LoginController to ask about login information
 * @returns true if the user should see tutanota links or false if they should not
 */
export function canSeeTutaLinks(logins: LoginController): boolean {
	return !logins.isWhitelabel() || logins.getUserController().isGlobalAdmin()
}

export type MousePosAndBounds = {
	x: number
	y: number
	targetWidth: number
	targetHeight: number
}

/**
 * Get the mouse's x and y coordinates relative to the target, and the width and height of the target.
 * The currentTarget must be a HTMLElement or this throws an error
 * @param mouseEvent
 */
export function getPosAndBoundsFromMouseEvent({ currentTarget, x, y }: MouseEvent): MousePosAndBounds {
	if (currentTarget instanceof HTMLElement) {
		const { height, width, left, top } = currentTarget.getBoundingClientRect()
		return {
			targetHeight: height,
			targetWidth: width,
			x: x - left,
			y: y - top,
		}
	} else {
		throw new ProgrammingError("Target is not a HTMLElement")
	}
}

/** render two children either next to each other (on desktop devices) or above each other (mobile) */
export function renderTwoColumnsIfFits(left: Children, right: Children): Children {
	if (client.isMobileDevice()) {
		return m(".flex.col", [m(".flex", left), m(".flex", right)])
	} else {
		return m(".flex", [m(".flex.flex-half.pr-s", left), m(".flex.flex-half.pl-s", right)])
	}
}

/** Encode a SVG element into a CSS readable string */
export function encodeSVG(svg: string): string {
	return (
		"data:image/svg+xml;utf8," +
		svg
			// the svg data string must contain ' instead of " to avoid display errors in Edge (probably not relevant anymore but better be safe)
			.replace(/"/g, "'")
			// '#' character is reserved in URL and FF won't display SVG otherwise
			.replace(/#/g, "%23")
			/// fold consecutive whitespace into a single one (useful for tests)
			.replace(/\s+/g, " ")
	)
}

// Returns the disabled style CSS classes seperated by spaces if `isDisabled` is true. A value of `null` or `undefined` is treated as `false`.
export function getOperatingClasses(isDisabled: boolean | null | undefined, cursorClass?: string): string {
	const cursorClassOrDefault = cursorClass ? cursorClass : ""
	return isDisabled ? "disabled click-disabled" : cursorClassOrDefault
}

/* Returns whether the change in a scroll position should be animated */
export function getIfLargeScroll(oldPosition: number | null, newPosition: number | null): boolean {
	if (oldPosition === null || newPosition === null) return false
	const difference = Math.abs(oldPosition - newPosition)
	return difference > 10
}

export function getContactTitle(contact: Contact) {
	const title = contact.title ? `${contact.title} ` : ""
	const middleName = contact.middleName != null ? ` ${contact.middleName} ` : " "
	const fullName = `${contact.firstName}${middleName}${contact.lastName} `
	const suffix = contact.nameSuffix ?? ""
	return (title + fullName + suffix).trim()
}

export function colorForBg(color: string): string {
	return isColorLight(color) ? "black" : "white"
}

/**
 * Converts touch events into equivalent mouse events for unified event handling.
 *
 * This utility enables components designed for mouse interactions to work seamlessly
 * with touch input by translating TouchEvent objects into MouseEvent objects with
 * equivalent properties and behavior.
 *
 * **Filtering Behavior:**
 * - Only processes single-touch interactions (multi-touch gestures are ignored)
 * - Returns `undefined` for multi-touch scenarios or invalid states
 *
 * **Event Mapping:**
 * - `touchstart` → `mousedown`
 * - `touchmove` → `mousemove`
 * - `touchend` → `mouseup`
 * - `touchcancel` → `mouseleave`
 *
 * **Coordinate Preservation:**
 * - Copies touch coordinates (clientX/Y, screenX/Y) to mouse event
 * - Preserves modifier keys (Alt, Ctrl, Shift, Meta)
 * - Maintains event bubbling and cancelability
 *
 * @param event - The touch event to transform
 * @returns A synthetic MouseEvent with equivalent properties, or `undefined` if:
 *          - Multiple touches are detected
 *          - `touchend` still has active touches
 *          - Event type is not recognized
 *
 * @example
 * // Basic usage in a touch handler
 * element.addEventListener('touchstart', (e) => {
 *   const mouseEvent = transformTouchEvent(e)
 *   if (mouseEvent) {
 *     // Handle as mouse event
 *     handleMouseDown(mouseEvent)
 *   }
 * })
 *
 * @example
 * // Unified drag handling for mouse and touch
 * const handleDragStart = (e: MouseEvent) => {
 *   console.log('Drag started at:', e.clientX, e.clientY)
 * }
 *
 * element.addEventListener('mousedown', handleDragStart)
 * element.addEventListener('touchstart', (e) => {
 *   const mouseEvent = transformTouchEvent(e)
 *   if (mouseEvent) {
 *     handleDragStart(mouseEvent)
 *   }
 * })
 *
 * @example
 * // Re-dispatching transformed events
 * element.addEventListener('touchmove', (e) => {
 *   e.preventDefault() // Prevent default touch scrolling
 *   const mouseEvent = transformTouchEvent(e)
 *   if (mouseEvent) {
 *     e.target?.dispatchEvent(mouseEvent)
 *   }
 * })
 *
 * @example
 * // Handling multi-touch rejection
 * element.addEventListener('touchstart', (e) => {
 *   const mouseEvent = transformTouchEvent(e)
 *   if (!mouseEvent) {
 *     console.log('Multi-touch or invalid state - ignoring')
 *     return
 *   }
 *   // Process single touch as mouse event
 * })
 *
 * @example
 * // Integration with calendar drag functionality
 * onmousemove: (mouseEvent: MouseEvent) => {
 *   const pos = getPosAndBoundsFromMouseEvent(mouseEvent)
 *   updateDragPosition(pos)
 * },
 * ontouchmove: (touchEvent: TouchEvent) => {
 *   touchEvent.preventDefault()
 *   const mouseEvent = transformTouchEvent(touchEvent)
 *   if (mouseEvent) {
 *     // Reuse mouse handler logic
 *     touchEvent.target?.dispatchEvent(mouseEvent)
 *   }
 * }
 */
export function transformTouchEvent(event: TouchEvent): MouseEvent | undefined {
	if (event.touches.length > 1 || (event.type === "touchend" && event.touches.length > 0)) {
		return
	}

	let type: "mousedown" | "mousemove" | "mouseup" | "mouseleave"
	let touch: Touch

	switch (event.type) {
		case "touchstart":
			type = "mousedown"
			touch = event.touches[0]
			break
		case "touchmove":
			type = "mousemove"
			touch = event.touches[0]
			break
		case "touchend":
			type = "mouseup"
			touch = event.changedTouches[0]
			break
		case "touchcancel":
			type = "mouseleave"
			touch = event.changedTouches[0]
			break
		default:
			return undefined
	}

	return new MouseEvent(type, {
		bubbles: true,
		cancelable: true,
		view: (event.target as HTMLElement).ownerDocument.defaultView,
		clientX: touch.clientX,
		clientY: touch.clientY,
		detail: 0,
		screenX: touch.screenX,
		screenY: touch.screenY,
		altKey: event.altKey,
		ctrlKey: event.ctrlKey,
		shiftKey: event.shiftKey,
		metaKey: event.metaKey,
		button: 0,
		relatedTarget: null,
	})
}
