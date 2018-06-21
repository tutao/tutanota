// @flow
import m from "mithril"
import {assertMainOrNode} from "../../api/Env"
import {ButtonType} from "./Button"
import stream from "mithril/stream/stream.js"
import {TextFieldN} from "./TextFieldN"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, createDropDown} from "./ButtonN"
import {Icons} from "./icons/Icons"

assertMainOrNode()

export type DropDownSelectorAttrs<T> = {
	label: string|lazy<string>,
	items: {name: string, value: T}[],
	selectedValue: stream<?T>,
	/**
	 * The handler is invoked with the new selected value. The displayed selected value is not changed automatically,
	 * but the handler is responsible for updating this DropDownSelector. The value is updated immediately, if no selectionChangedHandler is provided
	 */
		selectionChangedHandler?: handler<T>,
	helpLabel?: lazy<string>,
	dropdownWidth?: number,
	icon?: SVG,
}

class _DropDownSelector<T> {
	view(vnode: Vnode<DropDownSelectorAttrs<T>>) {
		const a = vnode.attrs
		return m(TextFieldN, {
			label: a.label,
			value: () => this.valueToText(a, a.selectedValue()),
			helpLabel: a.helpLabel,
			disabled: true,
			injectionsRight: () => m(ButtonN, {
				label: a.label,
				icon: () => a.icon ? a.icon : Icons.Edit,
				click: this.createDropdown(a)
			})
		})
	}

	createDropdown(a: DropDownSelectorAttrs<T>): ButtonAttrs {
		return createDropDown(() => {
			return a.items.map(item => {
				return {
					label: () => item.name,
					click: () => {
						if (a.selectionChangedHandler) {
							a.selectionChangedHandler(item.value)
						} else {
							a.selectedValue(item.value)
							m.redraw()
						}
					},
					type: ButtonType.Dropdown,
					isSelected: () => a.selectedValue() === item.value
				}
			})
		}, a.dropdownWidth)
	}

	valueToText(a: DropDownSelectorAttrs<T>, value: T): ?string {
		if (value != null) {
			let selectedItem = a.items.find(item => item.value == a.selectedValue())
			if (selectedItem) {
				return selectedItem.name
			} else {
				console.log(`Dropdown ${a.label instanceof Function ? a.label() : a.label} couldn't find element for value: ${JSON.stringify(value)}`)
			}
		}
		return null
	}

}

export const DropDownSelectorN: Class<MComponent<DropDownSelectorAttrs<any>>> = _DropDownSelector