import m, { Children, Component, Vnode } from "mithril"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { getLocalisedCategoryIntroduction, getLocalisedCategoryName, getLocalisedTopicIssue, SupportDialogState } from "../SupportDialog.js"
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
		return m(".pt.pb", [
			m(Card, { shouldDivide: true }, [
				m("section.pt-s.pb-s.plr-l", [
					m(".h4.mb-0", getLocalisedCategoryName(selectedCategory()!, languageTag)),
					m("p.mt-xs", getLocalisedCategoryIntroduction(currentlySelectedCategory!, languageTag)),
				]),
				currentlySelectedCategory!.topics.map((topic) =>
					m(SectionButton, {
						text: getLocalisedTopicIssue(topic, languageTag),
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
