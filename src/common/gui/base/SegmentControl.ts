import m, { Children, Component, Vnode } from "mithril"
import { px } from "../size"
import { theme } from "../theme.js"
import { goEuropeanBlue } from "../builtinThemes.js"

export type SegmentControlItem<T> = {
	name: string
	value: T
}
export type SegmentControlAttrs<T> = {
	selectedValue: T
	onValueSelected: (_: T) => unknown
	items: SegmentControlItem<T>[]
	itemMaxWidth?: number
	shouldApplyCampaignColor?: boolean
	class?: string
}

export class SegmentControl<T> implements Component<SegmentControlAttrs<T>> {
	view(vnode: Vnode<SegmentControlAttrs<T>>): Children {
		const { shouldApplyCampaignColor, selectedValue, items, itemMaxWidth } = vnode.attrs

		const campaignColor = theme.themeId === "light" || theme.themeId === "light_secondary" ? goEuropeanBlue : "#fff"

		return [
			m(
				".segmentControl.flex.center-horizontally.button-height",
				{
					role: "tablist",
					class: vnode.attrs.class,
				},
				items.map((item) =>
					m(
						`button.segmentControlItem.flex.center-horizontally.center-vertically.text-ellipsis.small${
							item.value === selectedValue ? ".segmentControl-border-active.content-accent-fg" : ".segmentControl-border"
						}`,
						{
							style: {
								flex: "0 1 " + (typeof itemMaxWidth !== "undefined" ? px(itemMaxWidth) : px(120)),
								...(shouldApplyCampaignColor &&
									item.value === selectedValue && {
										border: `2px solid ${campaignColor}`,
										color: campaignColor,
									}),
							},
							title: item.name,
							role: "tab",
							"aria-selected": String(item.value === selectedValue),
							onclick: () => this._onSelected(item, vnode.attrs),
						},
						item.name,
					),
				),
			),
		]
	}

	_onSelected(item: SegmentControlItem<T>, attrs: SegmentControlAttrs<T>) {
		if (item.value !== attrs.selectedValue) {
			attrs.onValueSelected(item.value)
		}
	}
}
