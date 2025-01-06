import { emitWizardEvent, WizardEventType, WizardPageAttrs } from "../../gui/base/WizardDialog.js"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { htmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { convertTextToHtml } from "../../misc/Formatter.js"
import { getLocalisedCategoryName, getLocalisedTopicIssue, handleReturnTo, shouldShowPage, SupportDialogAttrs } from "../SupportDialog.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { Dialog } from "../../gui/base/Dialog.js"

export class SupportTopicPage implements Component<SupportTopicPageAttrs> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<SupportTopicPageAttrs>) {
		this.dom = vnode.dom as HTMLElement
		handleReturnTo(vnode.attrs.data.shouldDisplayContact, vnode)
	}

	view(vnode: Vnode<SupportTopicPageAttrs>): Children {
		const { shouldDisplayContact, selectedTopic, canHaveEmailSupport } = vnode.attrs.data

		const topic = selectedTopic()
		if (topic == null) {
			emitWizardEvent(this.dom, WizardEventType.SHOW_PREVIOUS_PAGE)
			return
		}

		const languageTag = lang.languageTag
		const solution = languageTag.includes("de") ? topic.solutionHtmlDE : topic.solutionHtmlEN
		const sanitisedSolution = htmlSanitizer.sanitizeHTML(convertTextToHtml(solution), {
			blockExternalContent: true,
		}).html
		const issue = getLocalisedTopicIssue(topic, languageTag)
		return m(
			"",
			m("section", [m("h1.pb-m", issue), m.trust(sanitisedSolution)]),
			m("hr"),
			m("section.flex-center.center-vertically", m("", "Was this helpful?"), [
				m(Button, {
					type: ButtonType.Secondary,
					click: () => {
						emitWizardEvent(this.dom, WizardEventType.CLOSE_DIALOG)
					},
					label: () => "Yes",
				}),
				m(Button, {
					type: ButtonType.Secondary,
					click: () => {
						if (canHaveEmailSupport) {
							shouldDisplayContact({ value: true, returnTo: vnode.attrs })
							emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE)
						} else {
							void Dialog.reminder("We offer support", "Select a paid plan, please in order to have extensive support.")
						}
					},
					label: () => "No, I need help",
				}),
			]),
		)
	}
}

export class SupportTopicPageAttrs implements WizardPageAttrs<SupportDialogAttrs> {
	readonly data: SupportDialogAttrs

	constructor(data: SupportDialogAttrs) {
		this.data = data
	}

	readonly hideAllPagingButtons = true

	headerTitle(): string {
		const selectedTopic = this.data.selectedTopic()
		const issue = selectedTopic == null ? "topic" : getLocalisedTopicIssue(selectedTopic, lang.languageTag)
		return `Support: ${issue}`
	}

	getBackButtonText(): string {
		const selectedCategory = this.data.selectedCategory()
		return selectedCategory == null ? lang.get("back_action") : `Back to ${getLocalisedCategoryName(selectedCategory, lang.languageTag)}`
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
