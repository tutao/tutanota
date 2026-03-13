import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { SectionButton, SectionButtonAttrs } from "../../gui/base/buttons/SectionButton.js"
import { getCategoryName, SupportDialogState } from "../SupportDialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { px } from "../../gui/size.js"
import { AllIcons, progressIcon } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { theme } from "../../gui/theme.js"
import { TitleSection } from "../../gui/TitleSection"
import { windowFacade } from "../../misc/WindowFacade"

type Props = {
	data: SupportDialogState
	toCategoryDetail: Thunk
	countFaqLinkTrigger: Thunk
}

export class SupportLandingPage implements Component<Props> {
	view({
		attrs: {
			data: { categories, selectedCategory },
			toCategoryDetail,
			countFaqLinkTrigger,
		},
	}: Vnode<Props>): Children {
		const defaultHeight = 666
		const visibleCategorySections: Array<SectionButtonAttrs> = categories.map((category) => ({
			leftIcon: { icon: category.icon as AllIcons, title: "close_alt", fill: theme.primary },
			text: { text: getCategoryName(category, lang.languageTag), testId: "" },
			onclick: () => {
				selectedCategory(category)
				toCategoryDetail()
			},
		}))
		visibleCategorySections.push({
			leftIcon: { icon: Icons.QuestionMark, title: "emptyString_msg", fill: theme.primary },
			text: { text: "tuta.com/support", testId: "" },
			rightIcon: { icon: Icons.Open, title: "open_action" },
			onclick: () => {
				countFaqLinkTrigger()
				windowFacade.openLink("https://tuta.com/support")
			},
		})

		return m(
			".pt-16.pb-16",
			{
				style: {
					height: px(defaultHeight),
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
							visibleCategorySections.map((catAttrs) => m(SectionButton, catAttrs)),
						),
					]),
		)
	}
}
