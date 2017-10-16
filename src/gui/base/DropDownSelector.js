// @flow
import m from "mithril"
import {createDropDownButton, Button, ButtonType} from "./Button"
import {TextField} from "./TextField"
import stream from "mithril/stream/stream.js"
import {assertMainOrNode} from "../../api/Env"
import {Icons} from "./icons/Icons"

assertMainOrNode()

export class DropDownSelector<T> {
	view: Function;
	selectedValue: stream<?T>;
	_changeHandler: handler<T>;
	_field: TextField;
	_items: {name: string, value: T}[];

	constructor(labelIdOrLabelTextFunction: string|lazy<string>, helpLabel: ?lazy<string>, items: {name: string, value: T}[], selectedValue: stream<?T>|?T, dropdownWidth: ?number) {
		this.selectedValue = selectedValue instanceof Function ? selectedValue : stream(selectedValue)
		this._items = items
		this._field = new TextField(labelIdOrLabelTextFunction, helpLabel)
			.setDisabled()
		this._field.value = this.selectedValue.map(value => {
			if (value != null) {
				let selectedItem = items.find(item => item.value == this.selectedValue())
				if (selectedItem) {
					return selectedItem.name
				} else {
					console.log(`Dropdown ${this._field.label instanceof Function ? this._field.label() : this._field.label} couldn't find element for value: ${value}`)
				}
			}
			return null
		})
		let itemChooser = createDropDownButton(labelIdOrLabelTextFunction, () => Icons.Edit, () => {
				return items.map(item => new Button(() => item.name, () => {
					if (this.selectedValue() != item.value) {
						if (this._changeHandler) {
							this._changeHandler(item.value)
						} else {
							this.selectedValue(item.value)
							m.redraw()
						}
					}
				}).setType(ButtonType.Dropdown).setSelected(() => this.selectedValue() === item.value))
			},
			(dropdownWidth) ? dropdownWidth : undefined)
		this._field._injectionsRight = () => [m(itemChooser)]

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