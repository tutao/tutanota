import m, { Children, ClassComponent, Vnode } from "mithril"
import { TextField } from "./TextField.js"
import { createDropdown } from "./Dropdown.js"
import type { AllIcons } from "./Icon"
import type { lazy } from "@tutao/tutanota-utils"
import { lazyStringValue, noOp } from "@tutao/tutanota-utils"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { BootIcons } from "./icons/BootIcons"
import { ClickHandler, getOperatingClasses } from "./GuiUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { IconButton } from "./IconButton.js"
import { ButtonSize } from "./ButtonSize.js"

assertMainOrNode()
export type SelectorItem<T> = {
	name: string
	value: T
	selectable?: boolean
	icon?: AllIcons
	indentationLevel?: number
}
export type SelectorItemList<T> = ReadonlyArray<SelectorItem<T>>

export interface DropDownSelectorAttrs<T> {
	label: TranslationKey | lazy<string>
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
	icon?: AllIcons
	disabled?: boolean
	class?: string
	style?: Record<string, any> // Temporary, do not use
	doShowBorder?: boolean | null
}

export class DropDownSelector<T> implements ClassComponent<DropDownSelectorAttrs<T>> {
	view(vnode: Vnode<DropDownSelectorAttrs<T>>): Children {
		const a = vnode.attrs
		return m(TextField, {
			label: a.label,
			value: this.valueToText(a, a.selectedValue) || "",
			helpLabel: a.helpLabel,
			isReadOnly: true,
			onclick: a.disabled ? noOp : this.createDropdown(a),
			class: "click " + (a.class == null ? "mt" : a.class) + " " + getOperatingClasses(a.disabled),
			style: a.style,
			injectionsRight: () =>
				a.disabled
					? null
					: // This whole thing with the button is not ideal. We shouldn't have a proper button with its own state layer, we should have the whole
					  // selector be interactive. Just putting an icon here doesn't work either because the selector disappears from tabindex even if you set it
					  // explicitly (at least in FF).
					  // Ideally we should also set correct role ("option") and highlight only parts of what is not text field (without help text in the bottom.
					  // We could hack some of this in here, but we should probably redo it from scratch with the right HTML structure.
					  m(
							".flex.items-center.justify-center",
							{
								style: {
									width: "30px",
									height: "30px",
								},
							},
							m(IconButton, {
								icon: a.icon ? a.icon : BootIcons.Expand,
								title: "show_action",
								click: a.disabled ? noOp : this.createDropdown(a),
								size: ButtonSize.Compact,
							}),
					  ),
			doShowBorder: a.doShowBorder,
		})
	}

	createDropdown(a: DropDownSelectorAttrs<T>): ClickHandler {
		return createDropdown({
			lazyButtons: () => {
				return a.items
					.filter((item) => item.selectable !== false)
					.map((item) => {
						return {
							label: () => item.name,
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

	valueToText(a: DropDownSelectorAttrs<T>, value: T | null): string | null {
		if (a.selectedValueDisplay) {
			return a.selectedValueDisplay
		}

		const selectedItem = a.items.find((item) => item.value === a.selectedValue)
		if (selectedItem) {
			return selectedItem.name
		} else {
			console.log(`Dropdown ${lazyStringValue(a.label)} couldn't find element for value: ${String(JSON.stringify(value))}`)
			return null
		}
	}
}
