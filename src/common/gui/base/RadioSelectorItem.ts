import type { MaybeTranslation } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../theme"
import { lazy } from "@tutao/tutanota-utils"
import { component_size, px, size } from "../size"
import { ExpanderPanel } from "./Expander"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants"
import { isKeyPressed } from "../../misc/KeyManager"
import { styles } from "../styles"

export type RadioSelectorOption<T> = {
	readonly name: MaybeTranslation
	readonly value: T
	readonly renderChild?: lazy<Children>
}
export interface RadioSelectorItemAttrs<T> {
	groupName: MaybeTranslation
	isSelected: boolean
	option: RadioSelectorOption<T>
	optionClass?: string
	onOptionSelected: (arg0: T) => unknown
}

export class RadioSelectorItem<T> implements Component<RadioSelectorItemAttrs<T>> {
	view({ attrs: { groupName, isSelected, option, optionClass, onOptionSelected } }: Vnode<RadioSelectorItemAttrs<T>>) {
		const valueString = String(option.value)

		// IDs used to link the label and description for accessibility
		const optionId = name + valueString

		const attrClasses = optionClass != null ? " " + optionClass : ""
		const cursor = !isSelected ? "pointer" : "initial"

		// The wrapper is needed because <input> is self-closing and will not take the label as a child
		return m(
			".border.plr-24",
			{
				// Make the option the same size as a button if a description is not given
				class: "button-min-width button-min-height" + attrClasses,
				style: {
					"border-radius": px(size.radius_12),
					"padding-block": px(12),
					"border-color": isSelected ? theme.primary : theme.outline_variant,
					"border-width": px(component_size.checkbox_border_size),
					cursor,
				},
				onclick: () => {
					if (!isSelected) onOptionSelected(option.value)
				},
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
						if (!isSelected) onOptionSelected(option.value)
					}
				},
				role: "button",
				tabindex: TabIndex.Default,
				...(option.renderChild && { "aria-expanded": String(isSelected) }),
			},
			m(
				".flex.items-center.gap-12",
				{
					style: {
						color: isSelected ? theme.primary : theme.on_surface_variant,
						"font-weight": isSelected ? "bold" : undefined,
						height: "fit-content",
					},
				},
				[
					m("input[type=radio].m-0.big-radio", {
						name: groupName,
						checked: isSelected,
						value: valueString,
						id: optionId,
						style: { cursor },
					}),
					m("label.left.pt-4.pb-4", { for: optionId, style: { cursor } }, lang.getTranslationText(option.name)),
				],
			),
			option.renderChild &&
				m(ExpanderPanel, { expanded: isSelected }, m(`${styles.isMobileLayout() ? ".pt-16.pb-16" : ".plr-16.pt-32.pb-32"}`, option.renderChild?.())),
		)
	}
}
