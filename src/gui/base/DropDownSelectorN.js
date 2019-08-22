// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {assertMainOrNode} from "../../api/Env"
import {TextFieldN} from "./TextFieldN"
import {ButtonColors, ButtonN, ButtonType} from "./ButtonN"
import {createDropdown} from "./DropdownN.js"
import type {AllIconsEnum} from "./Icon"
import {lazyStringValue} from "../../api/common/utils/StringUtils"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {BootIcons} from "./icons/BootIcons"
import {noOp} from "../../api/common/utils/Utils"

assertMainOrNode()

export type SelectorItem<T> = {name: string, value: T, selectable?: boolean, icon?: AllIconsEnum}
export type SelectorItemList<T> = $ReadOnlyArray<SelectorItem<T>>

export type DropDownSelectorAttrs<T> = {
	label: TranslationKey | lazy<string>,
	items: SelectorItemList<T>,
	selectedValue: Stream<?T>,
	/**
	 * The handler is invoked with the new selected value. The displayed selected value is not changed automatically,
	 * but the handler is responsible for updating this DropDownSelector. The value is updated immediately, if no selectionChangedHandler is provided
	 */
	selectionChangedHandler?: handler<T>,
	helpLabel?: lazy<Children>,
	dropdownWidth?: number,
	icon?: AllIconsEnum,
	disabled?: boolean,
	class?: string,
}

export class DropDownSelectorN<T> implements MComponent<DropDownSelectorAttrs<T>> {

	view(vnode: Vnode<DropDownSelectorAttrs<T>>): Children {
		const a = vnode.attrs
		return m(TextFieldN, {
			label: a.label,
			value: stream(this.valueToText(a, a.selectedValue()) || ""),
			helpLabel: a.helpLabel,
			disabled: true,
			onclick: a.disabled ? noOp : this.createDropdown(a),
			class: "click " + (a.class == null ? "pt" : a.class),
			injectionsRight: () => a.disabled
				? null
				: m(ButtonN, {
					label: a.label,
					icon: () => a.icon ? a.icon : BootIcons.Expand,
					click: noOp,
					colors: ButtonColors.DrawerNav
				})
		})
	}

	createDropdown(a: DropDownSelectorAttrs<T>): clickHandler {
		return createDropdown(() => {
			return a.items
			        .filter((item) => item.selectable !== false)
			        .map(item => {
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

	valueToText(a: DropDownSelectorAttrs<T>, value: ?T): ?string {
		let selectedItem = a.items.find(item => item.value === a.selectedValue())
		if (selectedItem) {
			return selectedItem.name
		} else {
			console.log(`Dropdown ${lazyStringValue(a.label)} couldn't find element for value: ${String(JSON.stringify(value))}`)
			return null
		}
	}

}

