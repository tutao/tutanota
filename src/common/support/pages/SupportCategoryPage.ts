import m, { Children, Component, Vnode } from "mithril"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { getCategoryIntroduction, getCategoryName, getTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { NoSolutionSectionButton } from "../NoSolutionSectionButton.js"
import { getSupportUsageTestStage } from "../SupportUsageTestUtils.js"
import { TitleSection } from "../../gui/TitleSection"
import { AllIcons } from "../../gui/base/Icon"

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

		return m(".pt-16.pb-16.flex.col", [
			m(TitleSection, {
				icon: currentlySelectedCategory?.icon as AllIcons,
				title: getCategoryName(currentlySelectedCategory!, languageTag),
				subTitle: getCategoryIntroduction(currentlySelectedCategory!, languageTag),
			}),
			m(".pb-8.pt-8.flex.col.gap-8.fit-height.box-content", [
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
					onClick: () => {
						if (currentlySelectedCategory) {
							const topicStage = getSupportUsageTestStage(1)
							topicStage.setMetric({ name: "Topic", value: `${currentlySelectedCategory.nameEN.replaceAll(" ", "")}_other` })
							void topicStage.complete()
						}
						goToContactSupport()
					},
				}),
			]),
		])
	}
}
