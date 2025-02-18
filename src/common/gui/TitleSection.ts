import { AllIcons, Icon, IconSize } from "./base/Icon"
import m, { Children, Component, Vnode } from "mithril"
import { Card } from "./base/Card"

export type SettingsTitleSectionAttrsType = {
	icon: AllIcons
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
					m(Icon, {
						icon: attrs.icon,
						size: IconSize.XXL,
					}),
				),
				m(".center.h4", attrs.title),
				m(".center", attrs.subTitle),
			),
		)
	}
}
