import m, { Children, Component, Vnode } from "mithril"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { getLocalisedCategoryIntroduction, getLocalisedCategoryName, getLocalisedTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { NoSolutionSectionButton } from "../NoSolutionSectionButton.js"

type Props = {
	data: SupportDialogState
	goToContactSupport: Thunk
	goToTopicDetailPage: Thunk
}

export class SupportCategoryPage implements Component<Props> {
	view(vnode: Vnode<Props>): Children {
		const {
			data: { selectedCategory, selectedTopic },
			goToTopicDetailPage,
			goToContactSupport,
		} = vnode.attrs
		const languageTag = lang.languageTag
		const currentlySelectedCategory = selectedCategory()
		return m("", [
			m("section", [m("p.b.h5.mb-0", getLocalisedCategoryName(selectedCategory()!, languageTag))]),
			m("p.mt-xs", getLocalisedCategoryIntroduction(currentlySelectedCategory!, languageTag)),
			m("section", [
				m(
					".pb.pt.flex.col.gap-vpad.fit-height.box-content",
					currentlySelectedCategory!.topics.map((topic) =>
						m(SectionButton, {
							text: getLocalisedTopicIssue(topic, languageTag),
							onclick: () => {
								selectedTopic(topic)
								goToTopicDetailPage()
							},
						}),
					),
				),
				m(NoSolutionSectionButton, {
					onClick: () => goToContactSupport(),
				}),
			]),
		])
	}
}
