import { AllIcons, Icon, IconSize } from "./base/Icon"
import m, { Children, Component, Vnode } from "mithril"
import { Card } from "./base/Card"

export type SettingsTitleSectionAttrsType = {
	icon?: AllIcons
	iconOptions?: { color: string }
	title: string
	subTitle: string
}

export class TitleSection implements Component<SettingsTitleSectionAttrsType> {
	view({ attrs }: Vnode<SettingsTitleSectionAttrsType>): Children {
		return m(
			Card,
			{},
			m(
				"",
				{
					style: {
						paddingTop: "8px",
						paddingBottom: "8px",
					},
				},
				m(
					".center",
					attrs.icon
						? m(Icon, {
								icon: attrs.icon,
								size: IconSize.XXL,
								style: {
									fill: attrs.iconOptions?.color,
								},
						  })
						: null,
				),
				m(
					".center.mb",
					{
						style: {
							fontSize: "20px",
						},
					},
					attrs.title,
				),
				m(".center.smaller", attrs.subTitle),
			),
		)
	}
}
