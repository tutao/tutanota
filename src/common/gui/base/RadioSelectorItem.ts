import type { MaybeTranslation } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../theme"
import { lazy } from "@tutao/tutanota-utils"
import { px, size } from "../size"

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

		// The wrapper is needed because <input> is self-closing and will not take the label as a child
		return m(
			".border.pl-l.pr.pt.pb",
			{
				style: {
					"border-radius": px(size.border_radius_large),
				},
			},
			m(
				".flex.items-center",
				{
					// Make the option the same size as a button if a description is not given
					class: "button-min-width button-min-height" + attrClasses,
					style: {
						color: isSelected ? theme.primary : theme.on_surface_variant,
						"font-weight": isSelected ? "bold" : undefined,
						borderWidth: "2px",
						height: "fit-content",
						"padding-bottom": isSelected ? px(size.vpad) : 0,
					},
					onclick: () => {
						onOptionSelected(option.value)
					},
				},
				[
					renderKnob(valueString, optionId, groupName, isSelected),
					m("label.left.pt-xs.pb-xs", { for: optionId }, lang.getTranslationText(option.name)),
				],
			),
			isSelected && option.renderChild?.(),
		)
	}
}

function renderKnob(value: string, id: string, groupName: MaybeTranslation, isSelected: boolean): Children {
	return m(
		".rel.m-0.mr",
		{
			style: {
				width: "20px",
				height: "20px",
				appearance: "none",
			},
		},
		[
			m("input", {
				type: "radio",
				style: {
					margin: "0px",
					width: "20px",
					height: "20px",
					appearance: "none",
				},
				/* The `name` attribute defines the group the radio button belongs to. Not the name/label of the radio button itself.
				 * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio#defining_a_radio_group
				 */
				name: lang.getTranslationText(groupName),
				value,
				id,
				// Handle changes in value from the attributes
				checked: isSelected ? true : null,
			}),
			m("div", {
				style: {
					"border-color": isSelected ? theme.primary : theme.outline_variant,
					"border-style": "solid",
					"border-width": px(size.checkbox_border_size),
					"border-radius": "50%",
					position: "absolute",
					top: "0px",
					left: "0px",
					height: "20px",
					width: "20px",
				},
			}),
			m("div", {
				style: {
					display: isSelected ? "initial" : "none",
					"background-color": theme.primary,
					"border-radius": "50%",
					position: "absolute",
					top: "4px",
					left: "4px",
					height: "12px",
					width: "12px",
				},
			}),
		],
	)
}
