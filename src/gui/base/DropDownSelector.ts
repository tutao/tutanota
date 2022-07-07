import m, {Component} from "mithril"
import Stream from "mithril/stream"
import {Icons} from "./icons/Icons"
import type {lazy} from "@tutao/tutanota-utils"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {ButtonN, ButtonType} from "./ButtonN"
import {TextFieldN} from "./TextFieldN"
import {assertMainOrNode} from "../../api/common/Env"
import {attachDropdown} from "./DropdownN.js"

assertMainOrNode()

export class DropDownSelector<T> implements Component {
	view: Component["view"]
	readonly selectedValue: Stream<T>
	private _changeHandler: ((value: T) => unknown) | null = null
	private _items: {name: string, value: T}[]
	private _selectedValueDisplayValue!: string

	constructor(
		labelIdOrLabelTextFunction: TranslationKey | lazy<string>,
		helpLabel: lazy<string> | null,
		items: {name: string, value: T}[],
		selectedValue: Stream<T>,
		dropdownWidth?: number,
	) {
		this.selectedValue = selectedValue
		this._items = items

		this.view = () => {
			this._selectedValueDisplayValue = this.selectedValue.map(value => {
				const selectedItem = items.find(item => item.value === this.selectedValue())

				if (selectedItem) {
					return selectedItem.name
				} else {
					console.log(`Dropdown ${labelIdOrLabelTextFunction} couldn't find element for value: ${String(value)}`)
					return ""
				}
			})()

			return m(TextFieldN, {
				label: labelIdOrLabelTextFunction,
				helpLabel: helpLabel,
				disabled: true,
				value: this._selectedValueDisplayValue,
				injectionsRight: () => [m(ButtonN, attachDropdown({
					mainButtonAttrs: {
						label: labelIdOrLabelTextFunction,
						icon: () => Icons.Edit,
					},
					childAttrs: () => items.map(item => ({
						label: () => item.name,
						click: () => {
							if (this.selectedValue() !== item.value) {
								if (this._changeHandler) {
									this._changeHandler(item.value)
								} else {
									this.selectedValue(item.value)
									m.redraw()
								}
							}
						},
						type: ButtonType.Dropdown,
						isSelected: () => this.selectedValue() === item.value
					})),
					width: dropdownWidth
				}))],
			})
		}
	}

	/**
	 * The handler is invoked with the new selected value. The displayed selected value is not changed automatically,
	 * but the handler is responsible for updating this DropDownSelector.
	 */
	setSelectionChangedHandler(handler: (arg0: T) => unknown): DropDownSelector<T> {
		this._changeHandler = handler
		return this
	}
}