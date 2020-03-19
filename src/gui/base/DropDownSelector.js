// @flow
import m from "mithril"
import {Button, createDropDownButton} from "./Button"
import {TextField} from "./TextField"
import {assertMainOrNode} from "../../api/Env"
import {Icons} from "./icons/Icons"
import {lazyStringValue} from "../../api/common/utils/StringUtils"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {ButtonN, ButtonType} from "./ButtonN"
import {createDropdown} from "./DropdownN"

assertMainOrNode()

export class DropDownSelector<T> {
	view: Function;
	selectedValue: Stream<T>;
	_changeHandler: handler<T>;
	_field: TextField;
	_items: {name: string, value: T}[];

	constructor(labelIdOrLabelTextFunction: TranslationKey | lazy<string>, helpLabel: ?lazy<string>,
	            items: {name: string, value: T}[], selectedValue: Stream<T>,
	            dropdownWidth: ?number) {
		this.selectedValue = selectedValue
		this._items = items
		this._field = new TextField(labelIdOrLabelTextFunction, helpLabel)
			.setDisabled()
		this._field.value = this.selectedValue.map(value => {
			let selectedItem = items.find(item => item.value === this.selectedValue())
			if (selectedItem) {
				return selectedItem.name
			} else {
				console.log(`Dropdown ${lazyStringValue(this._field.label)} couldn't find element for value: ${String(value)}`)
				return ''
			}
		})

		this._field._injectionsRight = () => m(ButtonN, {
			label: labelIdOrLabelTextFunction,
			icon: () => Icons.Edit,
			endAligned: true,
			click: createDropdown(
				() => items.map(item => ({
					label: () => item.name,
					click: () => {
						if (this._changeHandler) {
							this._changeHandler(item.value)
						} else {
							this.selectedValue(item.value)
							m.redraw()
						}
					},
					type: ButtonType.Dropdown,
					isSelected: () => this.selectedValue() === item.value,
				})),
				dropdownWidth || undefined)
		})

		this.view = () => {
			return m(this._field)
		}
	}

	/**
	 * The handler is invoked with the new selected value. The displayed selected value is not changed automatically,
	 * but the handler is responsible for updating this DropDownSelector.
	 */
	setSelectionChangedHandler(handler: handler<T>): DropDownSelector<T> {
		this._changeHandler = handler
		return this
	}
}