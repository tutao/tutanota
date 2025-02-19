import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { getLocalisedCategoryName, SupportDialogState } from "../SupportDialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { NoSolutionSectionButton } from "../NoSolutionSectionButton.js"
import { px } from "../../gui/size.js"
import { Card } from "../../gui/base/Card.js"
import { AllIcons, Icon, IconSize, progressIcon } from "../../gui/base/Icon.js"
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
			data: { categories, selectedCategory },
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
			categories.length === 0
				? m(
						".flex-center.items-center.full-height",
						m("div", m(".flex-center", progressIcon()), m("p.m-0.mt-s", lang.getTranslationText("loading_msg"))),
				  )
				: m("", [
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
										icon: Icons.SpeechBubbleOutline,
										size: IconSize.XXL,
									}),
								),
								m(".center.h4", lang.get("supportStartPage_title")),
								m(".center", lang.get("supportStartPage_msg")),
							),
						),
						m(
							".pb.pt.flex.col.gap-vpad.fit-height.box-content",
							categories.map((category) =>
								m(SectionButton, {
									leftIcon: { icon: category.icon as AllIcons, title: "close_alt", fill: theme.content_accent },
									text: { text: getLocalisedCategoryName(category, lang.languageTag), testId: "" },
									onclick: () => {
										selectedCategory(category)
										toCategoryDetail()
									},
								}),
							),
							m(NoSolutionSectionButton, {
								onClick: goToContactSupport,
							}),
						),
				  ]),
		)
	}
}
