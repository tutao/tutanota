import m from "mithril"
import Mithril, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { htmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { convertTextToHtml } from "../../misc/Formatter.js"
import { getLocalisedTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { OutlineButton } from "../../gui/base/buttons/OutlineButton.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { Card } from "../../gui/base/Card.js"

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
			".pt.pb",
			{
				style: {
					"overflow-x": "auto",
				},
				class: "height-100p",
			},
			[
				m(
					// @ts-ignore
					Card,
					{
						rootElementType: "div",
						style: { padding: "1em", height: "80%" },
						classes: ["scroll"],
					},
					m(".h4.m-0.pb", issue),
					m.trust(sanitisedSolution),
				),
			],
			m(WasThisHelpful, { data, goToContactSupportPage, dialog }),
		)
	}
}

class WasThisHelpful implements Component<Props> {
	view({ attrs: { dialog, goToContactSupportPage } }: Vnode<Props>): Mithril.Children | void | null {
		return m(".flex-center.center-vertically.gap-hpad.b", m("", "Was this helpful?"), [
			m(OutlineButton, {
				label: "yes_label",
				onclick: () => {
					dialog.close()
				},
			}),
			m(OutlineButton, {
				label: "no_label",
				onclick: goToContactSupportPage,
			}),
		])
	}
}
