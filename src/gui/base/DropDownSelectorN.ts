import m, {Children, ClassComponent, Vnode} from "mithril"
import {TextFieldN} from "./TextFieldN"
import {ButtonColor, ButtonN, ButtonType} from "./ButtonN"
import {createDropdown} from "./DropdownN"
import type {AllIcons} from "./Icon"
import type {lazy} from "@tutao/tutanota-utils"
import {lazyStringValue, noOp} from "@tutao/tutanota-utils"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {BootIcons} from "./icons/BootIcons"
import type {clickHandler} from "./GuiUtils"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()
export type SelectorItem<T> = {
	name: string
	value: T
	selectable?: boolean
	icon?: AllIcons
}
export type SelectorItemList<T> = ReadonlyArray<SelectorItem<T>>

export interface DropDownSelectorAttrs<T> {
	label: TranslationKey | lazy<string>
	items: SelectorItemList<T>
	selectedValue: T | null

	/**
	 * The handler is invoked with the new selected value. The displayed selected value is not changed automatically,
	 * but the handler is responsible for updating this DropDownSelector. The value is updated immediately, if no selectionChangedHandler is provided
	 */
	selectionChangedHandler?: ((newValue: T) => unknown) | null
	helpLabel?: lazy<Children>
	dropdownWidth?: number
	icon?: AllIcons
	disabled?: boolean
	class?: string
	doShowBorder?: boolean | null
}

export class DropDownSelectorN<T> implements ClassComponent<DropDownSelectorAttrs<T>> {
	view(vnode: Vnode<DropDownSelectorAttrs<T>>): Children {
		const a = vnode.attrs
		return m(TextFieldN, {
			label: a.label,
			value: this.valueToText(a, a.selectedValue) || "",
			helpLabel: a.helpLabel,
			disabled: true,
			onclick: a.disabled ? noOp : this.createDropdown(a),
			class: "click " + (a.class == null ? "pt" : a.class),
			injectionsRight: () =>
				a.disabled
					? null
					: m(ButtonN, {
						label: a.label,
						icon: () => (a.icon ? a.icon : BootIcons.Expand),
						click: noOp,
						colors: ButtonColor.DrawerNav,
					}),
			doShowBorder: a.doShowBorder,
		})
	}

	createDropdown(a: DropDownSelectorAttrs<T>): clickHandler {
		return createDropdown({
			lazyButtons: () => {
				return a.items
						.filter(item => item.selectable !== false)
						.map(item => {
							return {
								label: () => item.name,
								click: () => {
									a.selectionChangedHandler?.(item.value)
									m.redraw()
								},
								type: ButtonType.Dropdown,
								isSelected: () => a.selectedValue === item.value,
							}
						})
			}, width: a.dropdownWidth
		})
	}

	valueToText(a: DropDownSelectorAttrs<T>, value: T | null): string | null {
		let selectedItem = a.items.find(item => item.value === a.selectedValue)

		if (selectedItem) {
			return selectedItem.name
		} else {
			console.log(`Dropdown ${lazyStringValue(a.label)} couldn't find element for value: ${String(JSON.stringify(value))}`)
			return null
		}
	}
}