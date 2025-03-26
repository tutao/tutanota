import m, { Children, Component, Vnode } from "mithril"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { getCategoryIntroduction, getCategoryName, getTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { NoSolutionSectionButton } from "../NoSolutionSectionButton.js"
import { Card } from "../../gui/base/Card.js"

type Props = {
	data: SupportDialogState
	goToContactSupport: Thunk
	goToTopicDetailPage: Thunk
}

export class SupportCategoryPage implements Component<Props> {
	view({
		attrs: {
			data: { selectedCategory, selectedTopic },
			goToTopicDetailPage,
			goToContactSupport,
		},
	}: Vnode<Props>): Children {
		const languageTag = lang.languageTag
		const currentlySelectedCategory = selectedCategory()

		return m(".pt.pb.flex.col.gap-vpad", [
			m(Card, [
				m(
					"",
					m(".h4.mb-0", getCategoryName(currentlySelectedCategory!, languageTag)),
					m("p.mt-xs.mb-s", getCategoryIntroduction(currentlySelectedCategory!, languageTag)),
				),
			]),
			m(Card, { shouldDivide: true }, [
				currentlySelectedCategory!.topics.map((topic) =>
					m(SectionButton, {
						text: { text: getTopicIssue(topic, languageTag), testId: "" },
						onclick: () => {
							selectedTopic(topic)
							goToTopicDetailPage()
						},
					}),
				),
				m(NoSolutionSectionButton, {
					onClick: () => goToContactSupport(),
				}),
			]),
		])
	}
}
