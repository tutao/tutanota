import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { getLocalisedCategoryName, SupportDialogState } from "../SupportDialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { NoSolutionSectionButton } from "../NoSolutionSectionButton.js"
import { px } from "../../gui/size.js"
import { Card } from "../../gui/base/Card.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { theme } from "../../gui/theme.js"

type Props = {
	data: SupportDialogState
	toCategoryDetail: Thunk
	goToContactSupport: Thunk
}

export class SupportLandingPage implements Component<Props> {
	view({
		attrs: {
			data: { supportData, selectedCategory },
			goToContactSupport,
			toCategoryDetail,
		},
	}: Vnode<Props>): Children {
		const defaultHeight = 666
		return m(
			".pt.pb",
			{
				style: {
					height: px(defaultHeight),
					// height: px(styles.bodyHeight > defaultHeight ? defaultHeight : styles.bodyHeight),
				},
			},
			m(
				Card,
				{
					classes: [],
				},
				m(
					"",
					{
						style: {
							padding: "0.5em",
						},
					},
					m(
						".center",
						m(Icon, {
							icon: Icons.People,
							size: IconSize.XXL,
						}),
					),
					m(".center.h4", "Find your answers here"),
					m(".center", "We are here to help you with your issues."),
				),
			),
			m(
				".pb.pt.flex.col.gap-vpad.fit-height.box-content",
				supportData.categories.map((category) =>
					m(SectionButton, {
						leftIcon: { icon: Icons.People, title: "close_alt", fill: theme.content_accent },
						text: getLocalisedCategoryName(category, lang.languageTag),
						onclick: () => {
							selectedCategory(category)
							toCategoryDetail()
						},
					}),
				),
			),
			m(NoSolutionSectionButton, {
				onClick: goToContactSupport,
			}),
		)
	}
}