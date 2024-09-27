import m, { Children, Component, Vnode } from "mithril"
import { AllIcons, Icon, IconSize } from "./Icon.js"
import { lang, TranslationText } from "../../misc/LanguageViewModel.js"
import { ButtonColor, getColors } from "./Button.js"
import { px } from "../size.js"

export interface IconSegmentControlItem<T> {
	icon: AllIcons
	label: TranslationText
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
					const title = lang.getMaybeLazy(item.label)
					return m(
						"button.icon-segment-control-item.flex.center-horizontally.center-vertically.text-ellipsis.small.state-bg.pt-xs.pb-xs",
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
							size: IconSize.Medium,
							style: {
								fill: getColors(ButtonColor.Content).button,
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
