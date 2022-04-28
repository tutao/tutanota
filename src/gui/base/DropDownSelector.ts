import m, {Component} from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {Button} from "./Button"
import {Icons} from "./icons/Icons"
import type {lazy} from "@tutao/tutanota-utils"
import {lazyStringValue} from "@tutao/tutanota-utils"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {ButtonType} from "./ButtonN"
import {createDropDownButton} from "./Dropdown"
import {TextFieldN} from "./TextFieldN"
import {assertMainOrNode} from "../../api/common/Env"

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
			const itemChooser = createDropDownButton(
				labelIdOrLabelTextFunction,
				() => Icons.Edit,
				() => {
					return items.map(item =>
						new Button(
							() => item.name,
							() => {
								if (this.selectedValue() !== item.value) {
									if (this._changeHandler) {
										this._changeHandler(item.value)
									} else {
										this.selectedValue(item.value)
										m.redraw()
									}
								}
							},
						)
							.setType(ButtonType.Dropdown)
							.setSelected(() => this.selectedValue() === item.value),
					)
				},
				dropdownWidth ? dropdownWidth : undefined,
			)
			this._selectedValueDisplayValue = this.selectedValue.map(value => {
				const selectedItem = items.find(item => item.value === this.selectedValue())

				if (selectedItem) {
					return selectedItem.name
				} else {
					console.log(`Dropdown ${lazyStringValue({
						label: labelIdOrLabelTextFunction,
						helpLabel: helpLabel,
						disabled: true,
						value: this._selectedValueDisplayValue,
						injectionsRight: () => [m(itemChooser)],
					}.label)} couldn't find element for value: ${String(value)}`)
					return ""
				}
			})()
			return m(TextFieldN, {
				label: labelIdOrLabelTextFunction,
				helpLabel: helpLabel,
				disabled: true,
				value: this._selectedValueDisplayValue,
				injectionsRight: () => [m(itemChooser)],
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