import { emitWizardEvent, WizardEventType, WizardPageAttrs } from "../../gui/base/WizardDialog.js"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { createSupportTopic, SupportCategory, SupportTopic } from "../../api/entities/sys/TypeRefs.js"
import {
	getLocalisedCategoryName,
	getLocalisedTopicIssue,
	handleReturnTo,
	NoSolutionSectionButton,
	shouldShowPage,
	SupportDialogAttrs,
} from "../SupportDialog.js"
import { isSameId } from "../../api/common/utils/EntityUtils.js"

export class SupportCategoryPage implements Component<SupportCategoryPageAttrs> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<SupportCategoryPageAttrs>) {
		this.dom = vnode.dom as HTMLElement
		handleReturnTo(vnode.attrs.data.shouldDisplayContact, vnode)
	}

	view(vnode: Vnode<SupportCategoryPageAttrs>): Children {
		const {
			topics,
			data: { canHaveEmailSupport, shouldDisplayContact, selectedCategory },
		} = vnode.attrs
		const languageTag = lang.languageTag
		const currentlySelectedCategory = selectedCategory()
		const selectedTopics =
			currentlySelectedCategory == null ? topics : SupportCategoryPage.filterTopicsBySelectedCategory(topics, currentlySelectedCategory)
		return m("section", [
			m(
				".pb.pt.flex.col.gap-vpad.fit-height.box-content",
				selectedTopics.map((topic) =>
					m(SectionButton, {
						text: getLocalisedTopicIssue(topic, languageTag),
						onclick: () => {
							vnode.attrs.data.selectedTopic(topic)
							emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE)
						},
					}),
				),
			),
			canHaveEmailSupport // TODO: Display dialog warning about free account on click instead of not rendering the button
				? m(NoSolutionSectionButton, {
						pageAttrs: vnode.attrs,
						shouldDisplayContact: shouldDisplayContact,
				  })
				: null,
		])
	}

	private static filterTopicsBySelectedCategory(topics: SupportTopic[], selectedCategory: SupportCategory): SupportTopic[] {
		return topics.filter((topic) => {
			return isSameId(topic.category, selectedCategory._id)
		})
	}
}

export class SupportCategoryPageAttrs implements WizardPageAttrs<SupportDialogAttrs> {
	readonly hideAllPagingButtons = true
	readonly topics: SupportTopic[] = [
		createSupportTopic({
			issueEN: "I forgot my recovery code",
			issueDE: "Ich habe mein recovery code vergessen",
			solutionHtmlEN: "<b>Then you can cry.</b>",
			solutionHtmlDE: "<b>Dann können Sie schreien.</b>",
			category: ["c", "account"],
			sortId: "0",
			lastUpdated: new Date(),
		}),
		createSupportTopic({
			issueEN: "How can I upgrade my plan?",
			issueDE: "Wie kann ich meinen Tarif aufwerten?",
			solutionHtmlEN: "<p>Via that trophy icon in the sidebar.</p>",
			solutionHtmlDE: "<p>Über das Trophäensymbol in der Seitenleiste.</p>",
			category: ["c", "account"],
			sortId: "1",
			lastUpdated: new Date(),
		}),
	]

	constructor(readonly data: SupportDialogAttrs) {}

	headerTitle(): string {
		const selectedCategory = this.data.selectedCategory()
		const categoryName = selectedCategory == null ? "category" : getLocalisedCategoryName(selectedCategory, lang.languageTag)
		return `Support: ${categoryName}`
	}

	isEnabled(): boolean {
		return shouldShowPage(this.data.shouldDisplayContact(), this)
	}

	isSkipAvailable(): boolean {
		return false
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		return Promise.resolve(true)
	}
}
