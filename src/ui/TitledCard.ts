import { AllIcons, Icon, IconSize } from "./base/Icon"
import m, { Children, Component, Vnode } from "mithril"
import { Card } from "./base/Card"
import { rem, size } from "./size"

export type TitledCardAttrs = {
	classes?: string[]
	icon?: AllIcons
	iconOptions?: { color: string; class?: string }
	customIcon?: Children
	title: string
	subTitle: Children
	style?: Record<string, any>
	contentStyle?: Record<string, any>
}

export class TitledCard implements Component<TitledCardAttrs> {
	view({ attrs, children }: Vnode<TitledCardAttrs>): Children {
		return m(Card, { classes: attrs.classes, style: attrs.style }, [
			m(
				"",
				{
					style: {
						paddingTop: "8px",
						paddingBottom: "8px",
						...attrs.contentStyle,
					},
				},
				m(
					".center.pb-8.pt-12",
					attrs.icon
						? m(Icon, {
								icon: attrs.icon,
								size: IconSize.PX64,
								class: attrs.iconOptions?.class,
								style: {
									fill: attrs.iconOptions?.color,
								},
							})
						: attrs.customIcon
							? attrs.customIcon
							: null,
				),
				m(
					".center.mb-16",
					{
						style: {
							fontSize: rem(size.core_20_em),
						},
					},
					attrs.title,
				),
				m(".center.smaller.text-preline", attrs.subTitle),
			),
			children,
		])
	}
}
