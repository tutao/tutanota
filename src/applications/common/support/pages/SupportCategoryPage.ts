import m, { Children, Component, Vnode } from "mithril"
import { SectionButton } from "../../../../ui/base/buttons/SectionButton.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { getCategoryIntroduction, getCategoryName, getTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { Thunk } from "@tutao/utils"
import { NoSolutionSectionButton } from "../NoSolutionSectionButton.js"
import { getSupportUsageTestStage } from "../SupportUsageTestUtils.js"
import { TitleSection } from "../../../../ui/TitleSection"
import { AllIcons } from "../../../../ui/base/Icon"
import { isFreeSignupOnly } from "../../misc/LoginUtils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { windowFacade } from "../../misc/WindowFacade"

type Props = {
	data: SupportDialogState
	goToContactSupport: Thunk
	goToTopicDetailPage: Thunk
}

export class SupportCategoryPage implements Component<Props> {
	view({
		attrs: {
			data: { selectedCategory, selectedTopic, canHaveEmailSupport },
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
				isFreeSignupOnly() && !canHaveEmailSupport
					? m(SectionButton, {
							text: { text: "Tuta FAQ", testId: "" },
							leftIcon: { icon: Icons.TutaFavicon, title: "supportMenu_label" },
							rightIcon: { icon: Icons.OpenOutline, title: "open_action" },
							onclick: () => {
								windowFacade.openLink("https://tuta.com/support")
							},
						})
					: m(NoSolutionSectionButton, {
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
