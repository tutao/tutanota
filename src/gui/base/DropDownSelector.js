// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Button} from "./Button"
import {assertMainOrNode} from "../../api/common/Env"
import {Icons} from "./icons/Icons"
import {lazyStringValue} from "../../api/common/utils/StringUtils"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {ButtonType} from "./ButtonN"
import {createDropDownButton} from "./Dropdown";
import {TextFieldN} from "./TextFieldN"

assertMainOrNode()

export class DropDownSelector<T> {
	view: Function;
	selectedValue: Stream<T>;
	_changeHandler: handler<T>;
	_items: {name: string, value: T}[];
	_selectedValueDisplayValue: string

	constructor(labelIdOrLabelTextFunction: TranslationKey | lazy<string>, helpLabel: ?lazy<string>,
	            items: {name: string, value: T}[], selectedValue: Stream<T>,
	            dropdownWidth: ?number) {
		this.selectedValue = selectedValue
		this._items = items

		this.view = () => {
			const itemChooser = createDropDownButton(labelIdOrLabelTextFunction, () => Icons.Edit, () => {
				return items.map(item => new Button(() => item.name, () => {
					if (this.selectedValue() !== item.value) {
						if (this._changeHandler) {
							this._changeHandler(item.value)
						} else {
							this.selectedValue(item.value)
							m.redraw()
						}
					}
				}).setType(ButtonType.Dropdown).setSelected(() => this.selectedValue() === item.value))
			}, (dropdownWidth) ? dropdownWidth : undefined)

			this._selectedValueDisplayValue = this.selectedValue.map(value => {
				const selectedItem = items.find(item => item.value === this.selectedValue())
				if (selectedItem) {
					return selectedItem.name
				} else {
					console.log(`Dropdown ${lazyStringValue(textFieldAttrs.label)} couldn't find element for value: ${String(value)}`)
					return ''
				}
			})()
			const textFieldAttrs = {
				label: labelIdOrLabelTextFunction,
				helpLabel: helpLabel,
				disabled: true,
				value: stream(this._selectedValueDisplayValue),
				injectionsRight: () => [m(itemChooser)],
			}
			return m(TextFieldN, textFieldAttrs)
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
