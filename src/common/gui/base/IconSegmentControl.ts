import m, { Children, Component, Vnode } from "mithril"
import { AllIcons, Icon, IconSize } from "./Icon.js"
import { lang, MaybeTranslation } from "../../misc/LanguageViewModel.js"
import { px } from "../size.js"
import { theme } from "../theme.js"

export interface IconSegmentControlItem<T> {
	icon: AllIcons
	label: MaybeTranslation
	value: T
}

export interface IconSegmentControlAttrs<T> {
	selectedValue: T
	onValueSelected: (_: T) => unknown
	items: IconSegmentControlItem<T>[]
	maxItemWidth?: number
}

/**
 * Selector for a few options with one option selected.
 */
export class IconSegmentControl<T> implements Component<IconSegmentControlAttrs<T>> {
	view(vnode: Vnode<IconSegmentControlAttrs<T>>): Children {
		return [
			m(
				".icon-segment-control.flex.items-center",
				{
					role: "tablist",
				},
				vnode.attrs.items.map((item) => {
					const title = lang.getTranslationText(item.label)
					return m(
						"button.icon-segment-control-item.flex.center-horizontally.center-vertically.text-ellipsis.small.state-bg.pt-4.pb-4",
						{
							active: item.value === vnode.attrs.selectedValue ? "true" : undefined,
							title,
							role: "tab",
							"aria-label": title,
							"aria-selected": String(item.value === vnode.attrs.selectedValue),
							onclick: () => this.onSelected(item, vnode.attrs),
							style: {
								maxWidth: vnode.attrs.maxItemWidth ? px(vnode.attrs.maxItemWidth) : null,
								// need to specify explicitly because setting "background" e.g. on hover resets it
								// we need it because stateBgHover background has transparency and when it overlaps the border it looks wrong.
								backgroundClip: "padding-box",
							},
						},
						m(Icon, {
							icon: item.icon,
							container: "div",
							class: "center-h",
							size: IconSize.PX24,
							style: {
								fill: item.value === vnode.attrs.selectedValue ? theme.on_secondary_container : theme.on_surface_variant,
							},
						}),
					)
				}),
			),
		]
	}

	private onSelected(item: IconSegmentControlItem<T>, attrs: IconSegmentControlAttrs<T>) {
		if (item.value !== attrs.selectedValue) {
			attrs.onValueSelected(item.value)
		}
	}
}
