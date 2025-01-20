import m from "mithril"
import Mithril, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { htmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { convertTextToHtml } from "../../misc/Formatter.js"
import { getLocalisedTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { Card } from "../../gui/base/Card.js"
import { theme } from "../../gui/theme.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { dialog } from "electron"

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
			".flex.flex-column.pt.pb",
			{
				style: {
					"overflow-x": "auto",
				},
				class: "height-100p",
			},
			[
				m(
					Card,
					{
						rootElementType: "div",
						style: { padding: "1em" },
						classes: ["scroll", "mb"],
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
		return m(
			".flex.flex-column.gap-vpad-s",
			m("small.uppercase.b.text-ellipsis", { style: { color: theme.navigation_button } }, "Was this helpful?"),
			m(Card, { shouldDivide: true }, [
				m(SectionButton, {
					text: "Yes",
					onclick: () => {
						dialog.close()
					},
					rightIcon: { icon: Icons.Checkmark, title: "yes_label" },
				}),
				m(SectionButton, {
					text: "No",
					onclick: goToContactSupportPage,
				}),
			]),
		)
	}
}
