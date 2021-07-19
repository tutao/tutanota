//@flow
import type {Country} from "../../api/common/CountryList"
import {Countries} from "../../api/common/CountryList"
import {DropDownSelector} from "./DropDownSelector"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonColors, ButtonType} from "./ButtonN"
import {Icons} from "./icons/Icons"
import type {DropdownChildAttrs} from "./DropdownN"
import {attachDropdown} from "./DropdownN"
import type {MaybeLazy} from "../../api/common/utils/Utils"
import {assertNotNull, mapLazily, noOp} from "../../api/common/utils/Utils"
import {promiseMap} from "../../api/common/utils/PromiseUtils"
import {Dialog} from "./Dialog"

// TODO Use DropDownSelectorN
export function createCountryDropdown(selectedCountry: Stream<?Country>, helpLabel?: lazy<string>, label: TranslationKey | lazy<string> = "invoiceCountry_label"): DropDownSelector<?Country> {
	const countries = Countries.map(c => ({value: c, name: c.n}))
	countries.push({value: null, name: lang.get("choose_label")});

	const countryInput = new DropDownSelector(
		label,
		helpLabel,
		countries,
		selectedCountry,
		250).setSelectionChangedHandler(value => {
		selectedCountry(value)
	})
	return countryInput
}

export function moreButton(lazyChildren: MaybeLazy<$Promisable<$ReadOnlyArray<?DropdownChildAttrs>>>, width?: number): ButtonAttrs {
	return attachDropdown({
			label: "more_label",
			colors: ButtonColors.Nav,
			click: noOp,
			icon: () => Icons.More
		}, mapLazily(lazyChildren, children => promiseMap(children,
		child => typeof child === "string" || child === null
			? child
			// If type hasn't been bound on the child it get's set to Dropdown, otherwise we use what is already there
			: Object.assign({}, {type: ButtonType.Dropdown}, child))
		),
		() => true,
		width)
}


type Confirmation = {
	confirmed: (() => mixed) => Confirmation;
	cancelled: (() => mixed) => Confirmation;
	result: Promise<boolean>;
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
		result: confirmationPromise
	}

	return confirmation
}

/**
 * Get either the coord of a mouseevent or the coord of the first touch of a touch event
 * @param event
 * @returns {{x: number, y: number}}
 */
export function getCoordsOfMouseOrTouchEvent(event: MouseEvent | TouchEvent): {x: number, y: number} {
	return event instanceof MouseEvent
		? {
			x: event.clientX,
			y: event.clientY
		}
		: {
			// Why would touches be empty?
			x: assertNotNull(event.touches.item(0)).clientX,
			y: assertNotNull(event.touches.item(0)).clientY
		}
}

export function makeListSelectionChangedScrollHandler(scrollDom: HTMLElement, entryHeight: number, getSelectedEntryIndex: lazy<number>): () => void {
	return function () {
		const selectedIndex = getSelectedEntryIndex()

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
}