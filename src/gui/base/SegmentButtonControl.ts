import m, { Children, Component, Vnode } from "mithril"
import { AllIcons, Icon } from "./Icon.js"
import { TranslationText } from "../../misc/LanguageViewModel.js"
import { ButtonColor, getColors } from "./Button.js"
import { px } from "../size.js"

export type SegmentButtonControlItem<T> = {
	icon: AllIcons
	label: TranslationText
	value: T
}
export type SegmentButtonControlAttrs<T> = {
	selectedValue: T
	onValueSelected: (_: T) => unknown
	items: SegmentButtonControlItem<T>[]
	maxItemWidth?: number
}

export class SegmentButtonControl<T> implements Component<SegmentButtonControlAttrs<T>> {
	view(vnode: Vnode<SegmentButtonControlAttrs<T>>): Children {
		return [
			m(
				".segmentControl.flex.center-horizontally",
				{
					role: "tablist",
				},
				vnode.attrs.items.map((item) =>
					m(
						"button.segmentControlItem.flex.center-horizontally.center-vertically.text-ellipsis.small.border.state-bg.pt-xs.pb-xs",
						{
							class: item.value === vnode.attrs.selectedValue ? "active-segment" : "",
							title: item.label,
							role: "tab",
							"aria-selected": String(item.value === vnode.attrs.selectedValue),
							onclick: () => this._onSelected(item, vnode.attrs),
							style: {
								maxWidth: vnode.attrs.maxItemWidth ? px(vnode.attrs.maxItemWidth) : null,
							},
						},
						m(Icon, {
							icon: item.icon,
							container: "div",
							class: "center-h",
							large: true,
							style: {
								fill: getColors(ButtonColor.Content).button,
							},
						}),
					),
				),
			),
		]
	}

	_onSelected(item: SegmentButtonControlItem<T>, attrs: SegmentButtonControlAttrs<T>) {
		if (item.value !== attrs.selectedValue) {
			attrs.onValueSelected(item.value)
		}
	}
}
