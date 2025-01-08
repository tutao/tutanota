import { emitWizardEvent, WizardEventType, WizardPageAttrs } from "../../gui/base/WizardDialog.js"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { htmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { convertTextToHtml } from "../../misc/Formatter.js"
import { getLocalisedTopicIssue, handleReturnTo, shouldShowPage, SupportDialogAttrs } from "../SupportDialog.js"
import { OutlineButton2 } from "../../gui/base/buttons/OutlineButton2.js"

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
			m("section", [m("p.b.text-center.h5", issue), m.trust(sanitisedSolution)]),
			m("hr"),
			m("section.flex-center.center-vertically.gap-hpad", m("", "Was this helpful?"), [
				m(OutlineButton2, {
					label: () => "Yes",
					onclick: () => emitWizardEvent(this.dom, WizardEventType.CLOSE_DIALOG),
				}),
				m(OutlineButton2, {
					label: () => "No, I need help",
					onclick: () => {
						shouldDisplayContact({ value: true, returnTo: vnode.attrs })
						emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE)
					},
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
		return "Support"
	}

	getBackButtonText(): string {
		return "Back"
	}

	/**
	 * Goes back to the list of topics in the current category.
	 */
	onClickBack() {
		this.data.selectedTopic?.(null)
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
