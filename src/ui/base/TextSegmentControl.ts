import m, { Children, Component, Vnode } from "mithril"
import { lang, TranslationKey } from "../utils/LanguageViewModel.js"
import { Icon, IconSize } from "./Icon.js"
import { theme } from "../theme.js"
import { Icons } from "./icons/Icons"

export interface TextSegmentControlItem<T> {
	icon: Icons
	label: TranslationKey
	value: T
}

export interface TextSegmentControlAttrs<T> {
	selectedValue: T
	onValueSelected: (_: T) => unknown
	items: TextSegmentControlItem<T>[]
}

export class TextSegmentControl<T> implements Component<TextSegmentControlAttrs<T>> {
	view(vnode: Vnode<TextSegmentControlAttrs<T>>): Children {
		const { items, selectedValue } = vnode.attrs
		return m(
			".flex.center-horizontally.mt-8",
			m(
				".icon-segment-control.flex.items-center",
				{ role: "tablist" },
				items.map((item) => {
					const title = lang.getTranslationText(item.label)
					const selected = item.value === selectedValue
					const color = selected ? theme.on_secondary_container : theme.on_surface_variant
					return m(
						"button.icon-segment-control-item.text-segment-control-item.flex.center-horizontally.center-vertically.text-ellipsis.small.state-bg.pt-4.pb-4",
						{
							active: selected ? "true" : undefined,
							title,
							role: "tab",
							"aria-selected": String(selected),
							onclick: () => {
								if (!selected) {
									vnode.attrs.onValueSelected(item.value)
								}
							},
							style: {
								color,
								backgroundClip: "padding-box",
							},
						},
						[m(Icon, { icon: item.icon, size: IconSize.PX20, style: { fill: color } }), m("span.ml-4", title)],
					)
				}),
			),
		)
	}
}
