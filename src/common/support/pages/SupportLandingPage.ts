import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { getCategoryName, SupportDialogState } from "../SupportDialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { px } from "../../gui/size.js"
import { AllIcons, progressIcon } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { theme } from "../../gui/theme.js"
import { TitleSection } from "../../gui/TitleSection"

type Props = {
	data: SupportDialogState
	toCategoryDetail: Thunk
}

export class SupportLandingPage implements Component<Props> {
	view({
		attrs: {
			data: { categories, selectedCategory },
			toCategoryDetail,
		},
	}: Vnode<Props>): Children {
		const defaultHeight = 666
		return m(
			".pt-16.pb-16",
			{
				style: {
					height: px(defaultHeight),
					// height: px(styles.bodyHeight > defaultHeight ? defaultHeight : styles.bodyHeight),
				},
			},
			categories.length === 0
				? m(
						".flex-center.items-center.full-height",
						m("div", m(".flex-center", progressIcon()), m("p.m-0.mt-8", lang.getTranslationText("loading_msg"))),
					)
				: m("", [
						m(TitleSection, {
							icon: Icons.SpeechBubbleOutline,
							title: lang.get("supportStartPage_title"),
							subTitle: lang.get("supportStartPage_msg"),
						}),
						m(
							".pb-16.pt-16.flex.col.gap-16.fit-height.box-content",
							categories.map((category) =>
								m(SectionButton, {
									leftIcon: { icon: category.icon as AllIcons, title: "close_alt", fill: theme.primary },
									text: { text: getCategoryName(category, lang.languageTag), testId: "" },
									onclick: () => {
										selectedCategory(category)
										toCategoryDetail()
									},
								}),
							),
						),
					]),
		)
	}
}
