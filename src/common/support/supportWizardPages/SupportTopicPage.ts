import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { htmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { convertTextToHtml } from "../../misc/Formatter.js"
import { getLocalisedTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { OutlineButton } from "../../gui/base/buttons/OutlineButton.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { Thunk } from "@tutao/tutanota-utils"

type Props = {
	data: SupportDialogState
	dialog: Dialog
	goToContactSupportPage: Thunk
}

export class SupportTopicPage implements Component<Props> {
	view({ attrs: { dialog, data, goToContactSupportPage } }: Vnode<Props>): Children {
		const topic = data.selectedTopic()
		if (topic == null) {
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
				m(OutlineButton, {
					label: () => "Yes",
					onclick: () => {
						dialog.close()
					},
				}),
				m(OutlineButton, {
					label: () => "No, I need help",
					onclick: goToContactSupportPage,
				}),
			]),
		)
	}
}
