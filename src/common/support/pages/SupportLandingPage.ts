import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../../ui/utils/LanguageViewModel.js"
import { SectionButton, SectionButtonAttrs } from "../../../ui/base/buttons/SectionButton.js"
import { getCategoryName, SupportDialogState } from "../SupportDialog.js"
import { Thunk } from "@tutao/utils"
import { AllIcons, progressIcon } from "../../../ui/base/Icon.js"
import { Icons } from "../../../ui/base/icons/Icons.js"
import { theme } from "../../../ui/theme.js"
import { TitleSection } from "../../../ui/TitleSection"
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
		const visibleCategorySections: Array<SectionButtonAttrs> = categories.map((category) => ({
			leftIcon: { icon: category.icon as AllIcons, title: "close_alt", fill: theme.primary },
			text: { text: getCategoryName(category, lang.languageTag), testId: "" },
			onclick: () => {
				selectedCategory(category)
				toCategoryDetail()
			},
		}))
		visibleCategorySections.push({
			leftIcon: { icon: Icons.QuestionmarkFilled, title: "emptyString_msg", fill: theme.primary },
			text: { text: "tuta.com/support", testId: "" },
			rightIcon: { icon: Icons.OpenOutline, title: "open_action" },
			onclick: () => {
				countFaqLinkTrigger()
				windowFacade.openLink("https://tuta.com/support")
			},
		})

		return m(
			".pt-16.pb-16",
			categories.length === 0
				? m(
						".flex-center.items-center.full-height",
						m("div", m(".flex-center", progressIcon()), m("p.m-0.mt-8", lang.getTranslationText("loading_msg"))),
					)
				: m("", [
						m(TitleSection, {
							icon: Icons.ChatbubbleOutline,
							title: lang.get("supportStartPage_title"),
							subTitle: lang.get("supportStartPage_msg"),
						}),
						m(
							".pb-8.pt-8.flex.col.gap-8.fit-height.box-content",
							visibleCategorySections.map((catAttrs) => m(SectionButton, catAttrs)),
						),
					]),
		)
	}
}
