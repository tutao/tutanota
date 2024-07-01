import type { Country } from "../../api/common/CountryList"
import { Countries } from "../../api/common/CountryList"
import type { InfoLink, TranslationKey } from "../../misc/LanguageViewModel"
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

export type dropHandler = (dragData: string) => void
// not all browsers have the actual button as e.currentTarget, but all of them send it as a second argument (see https://github.com/tutao/tutanota/issues/1110)
export type ClickHandler = (event: MouseEvent, dom: HTMLElement) => void

// lazy because of global dependencies
const dropdownCountries = lazyMemoized(() => Countries.map((c) => ({ value: c, name: c.n })))

export function renderCountryDropdown(params: {
	selectedCountry: Country | null
	onSelectionChanged: (country: Country) => void
	helpLabel?: lazy<string>
	label?: TranslationKey | lazy<string>
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
export function getConfirmation(message: TranslationKey | lazy<string>, confirmMessage: TranslationKey = "ok_action"): Confirmation {
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
