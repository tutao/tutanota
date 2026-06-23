import { AllIcons, Icon, IconSize } from "./base/Icon"
import m, { Children, Component, Vnode } from "mithril"
import { Card } from "./base/Card"

export type TitleSectionAttrs = {
	icon?: AllIcons
	iconOptions?: { color: string; class?: string }
	customIcon?: Children
	title: string
	subTitle: Children
	style?: Record<string, any>
}

export class TitleSection implements Component<TitleSectionAttrs> {
	view({ attrs }: Vnode<TitleSectionAttrs>): Children {
		return m(
			Card,
			{},
			m(
				"",
				{
					style: {
						paddingTop: "8px",
						paddingBottom: "8px",
						...attrs.style,
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
							fontSize: "20px",
						},
					},
					attrs.title,
				),
				m(".center.smaller.text-preline", attrs.subTitle),
			),
		)
	}
}
