import type {Country} from "../../api/common/CountryList"
import {Countries} from "../../api/common/CountryList"
import {DropDownSelector} from "./DropDownSelector"
import type {InfoLink, TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonColor, ButtonType} from "./ButtonN"
import {Icons} from "./icons/Icons"
import type {DropdownChildAttrs} from "./DropdownN"
import {attachDropdown} from "./DropdownN"
import type {$Promisable, lazy, MaybeLazy} from "@tutao/tutanota-utils"
import {assertNotNull, mapLazily, noOp} from "@tutao/tutanota-utils"
import {Dialog} from "./Dialog"
import {logins} from "../../api/main/LoginController"
import type {AllIcons} from "./Icon"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"
import {Children} from "mithril";
import Stream from "mithril/stream";

export type dropHandler = (dragData: string) => void
// not all browsers have the actual button as e.currentTarget, but all of them send it as a second argument (see https://github.com/tutao/tutanota/issues/1110)
export type clickHandler = (event: MouseEvent, dom: HTMLElement) => void

// TODO Use DropDownSelectorN
export function createCountryDropdown(
	selectedCountry: Stream<Country | null>,
	helpLabel?: lazy<string>,
	label: TranslationKey | lazy<string> = "invoiceCountry_label",
): DropDownSelector<Country | null> {
	const countries: Array<{name: string, value: Country | null}> = [
		...Countries.map(c => ({
			value: c,
			name: c.n,
		})),
		{
			value: null,
			name: lang.get("choose_label"),
		}
	]
	return new DropDownSelector(label, helpLabel ?? null, countries, selectedCountry, 250)
		.setSelectionChangedHandler(value => {
			selectedCountry(value)
		})
}

export function createMoreSecondaryButtonAttrs(
	lazyChildren: MaybeLazy<$Promisable<ReadonlyArray<DropdownChildAttrs | null>>>,
	dropdownWidth?: number,
): ButtonAttrs {
	return moreButtonAttrsImpl(null, ButtonType.Secondary, lazyChildren, dropdownWidth)
}

export function createMoreActionButtonAttrs(
	lazyChildren: MaybeLazy<$Promisable<ReadonlyArray<DropdownChildAttrs | null>>>,
	dropdownWidth?: number,
): ButtonAttrs {
	return moreButtonAttrsImpl(() => Icons.More, ButtonType.Action, lazyChildren, dropdownWidth)
}

function moreButtonAttrsImpl(
	icon: lazy<AllIcons> | null,
	type: ButtonType,
	lazyChildren: MaybeLazy<$Promisable<ReadonlyArray<DropdownChildAttrs | null>>>,
	dropdownWidth?: number,
): ButtonAttrs {
	const button = {
		label: "more_label",
		colors: ButtonColor.Nav,
		click: noOp,
		icon,
		type,
	} as const
	const buttons = mapLazily(lazyChildren, async children => {
		const resolvedChildren: ReadonlyArray<DropdownChildAttrs | null> = await children
		return resolvedChildren.map(child => {
			// If type hasn't been bound on the child it get's set to Dropdown, otherwise we use what is already there
			if (child == null || typeof child == "string" || "type" in child) {
				return child
			} else {
				return Object.assign(
					{
						type: ButtonType.Dropdown,
					},
					child,
				)
			}
		})
	})
	return attachDropdown({mainButtonAttrs: button, childAttrs: buttons, showDropdown: () => true, width: dropdownWidth})
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
 * to handle confirmation or cancellation
 * @param message
 * @param confirmMessage
 * @returns {Confirmation}
 */
export function getConfirmation(message: TranslationKey | lazy<string>, confirmMessage: TranslationKey = "ok_action"): Confirmation {
	const confirmationPromise = Dialog.confirm(message, confirmMessage)
	const confirmation: Confirmation = {
		confirmed(action) {
			confirmationPromise.then(ok => {
				if (ok) {
					action()
				}
			})
			return confirmation
		},

		cancelled(action) {
			confirmationPromise.then(ok => {
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
export function getCoordsOfMouseOrTouchEvent(
	event: MouseEvent | TouchEvent,
): {
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
 * Executes the passed function if the user is allowed to see `tutanota.com` links.
 * @param render receives the resolved link
 * @returns {Children|null}
 */
export function ifAllowedTutanotaLinks(linkId: InfoLink, render: (arg0: string) => Children): Children | null {
	if (logins.getUserController().isGlobalAdmin() || !logins.isWhitelabel()) {
		return render(linkId)
	}

	return null
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
export function getPosAndBoundsFromMouseEvent({currentTarget, x, y}: MouseEvent): MousePosAndBounds {
	if (currentTarget instanceof HTMLElement) {
		const {height, width, left, top} = currentTarget.getBoundingClientRect()
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