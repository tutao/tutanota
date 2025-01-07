import { emitWizardEvent, WizardEventType, WizardPageAttrs } from "../../gui/base/WizardDialog.js"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { lang } from "../../misc/LanguageViewModel.js"
import {
	getLocalisedCategoryIntroduction,
	getLocalisedCategoryName,
	getLocalisedTopicIssue,
	handleReturnTo,
	NoSolutionSectionButton,
	shouldShowPage,
	SupportDialogAttrs,
} from "../SupportDialog.js"

export class SupportCategoryPage implements Component<SupportCategoryPageAttrs> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<SupportCategoryPageAttrs>) {
		this.dom = vnode.dom as HTMLElement
		handleReturnTo(vnode.attrs.data.shouldDisplayContact, vnode)
	}

	view(vnode: Vnode<SupportCategoryPageAttrs>): Children {
		const {
			data: { shouldDisplayContact, selectedCategory, selectedTopic },
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
								emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE)
							},
						}),
					),
				),
				m(NoSolutionSectionButton, {
					pageAttrs: vnode.attrs,
					shouldDisplayContact: shouldDisplayContact,
				}),
			]),
		])
	}
}

export class SupportCategoryPageAttrs implements WizardPageAttrs<SupportDialogAttrs> {
	readonly hideAllPagingButtons = true

	constructor(readonly data: SupportDialogAttrs) {}

	headerTitle(): string {
		return `Support`
	}

	/**
	 * Goes back to the landing page.
	 */
	onClickBack() {
		this.data.selectedCategory?.(null)
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
