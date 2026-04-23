import m, { Children, ClassComponent, Vnode } from "mithril"
import { createDropdown } from "./Dropdown.js"
import type { AllIcons } from "./Icon"
import { type lazy, noOp } from "@tutao/utils"
import { lang, MaybeTranslation } from "../../misc/LanguageViewModel"
import { ClickHandler, getOperatingClasses } from "./GuiUtils"
import { assertMainOrNode } from "@tutao/app-env"
import { IconButton } from "./IconButton"
import { ButtonSize } from "./ButtonSize"
import { TextField, TextFieldAttrs } from "./TextField"
import { Icons } from "./icons/Icons"

assertMainOrNode()
export type SelectorItem<T> = {
	name: string
	value: T
	selectable?: boolean
	icon?: AllIcons
	indentationLevel?: number
}
export type SelectorItemList<T> = ReadonlyArray<SelectorItem<T>>

export interface DropDownSelectorNewAttrs<T> {
	label: MaybeTranslation
	items: SelectorItemList<T>
	selectedValue: T | null
	/** Override what is displayed for the selected value in the text field (but not in the dropdown) */
	selectedValueDisplay?: string
	/**
	 * The handler is invoked with the new selected value. The displayed selected value is not changed automatically,
	 * but the handler is responsible for updating this DropDownSelector. The value is updated immediately, if no selectionChangedHandler is provided
	 */
	selectionChangedHandler?: ((newValue: T) => unknown) | null
	helpLabel?: lazy<Children>
	dropdownWidth?: number
	icon?: TextFieldAttrs["leadingIcon"]
	disabled?: boolean
	class?: string
	style?: Record<string, any> // Temporary, do not use
	doShowBorder?: boolean | null
}

// a dropdown selector for many options
export class DropDownSelectorNew<T> implements ClassComponent<DropDownSelectorNewAttrs<T>> {
	view(vnode: Vnode<DropDownSelectorNewAttrs<T>>): Children {
		const a = vnode.attrs
		const text = this.valueToText(a, a.selectedValue) || ""
		const labelText = lang.getTranslationText(a.label)

		return m(TextField, {
			label: a.label,
			value: text,
			helpLabel: a.helpLabel,
			isReadOnly: true,
			onclick: a.disabled ? noOp : this.createDropdown(a),
			class: "click " + a.class + " " + getOperatingClasses(a.disabled),
			style: a.style,
			leadingIcon: a.icon,
			injectionsRight: () =>
				a.disabled
					? null
					: m(
							".flex.items-center.justify-center",
							{ style: { width: "30px", height: "30px" } },
							m(IconButton, {
								icon: Icons.ArrowDown,
								title: "show_action",
								click: a.disabled ? noOp : this.createDropdown(a),
								size: ButtonSize.Compact,
							}),
						),
			doShowBorder: a.doShowBorder,
		})
	}

	createDropdown(a: DropDownSelectorNewAttrs<T>): ClickHandler {
		return createDropdown({
			lazyButtons: () => {
				return a.items
					.filter((item) => item.selectable !== false)
					.map((item) => {
						return {
							label: lang.makeTranslation(item.name, item.name),
							click: () => {
								a.selectionChangedHandler?.(item.value)
								m.redraw()
							},
							selected: a.selectedValue === item.value,
						}
					})
			},
			width: a.dropdownWidth,
		})
	}

	valueToText(a: DropDownSelectorNewAttrs<T>, value: T | null): string | null {
		if (a.selectedValueDisplay) {
			return a.selectedValueDisplay
		}

		const selectedItem = a.items.find((item) => item.value === a.selectedValue)
		if (selectedItem) {
			return selectedItem.name
		} else {
			console.log(`Dropdown ${lang.getTranslationText(a.label)} couldn't find element for value: ${String(JSON.stringify(value))}`)
			return null
		}
	}
}
