import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { htmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { convertTextToHtml } from "../../misc/Formatter.js"
import { getContactSupportText, getTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { Card } from "../../gui/base/Card.js"
import { theme } from "../../gui/theme.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { locator } from "../../api/main/CommonLocator.js"

type Props = {
	data: SupportDialogState
	dialog: Dialog
	goToContactSupportPage: Thunk
	goToSolutionWasHelpfulPage: Thunk
}

export class SupportTopicPage implements Component<Props> {
	view({ attrs: { data, goToContactSupportPage, goToSolutionWasHelpfulPage } }: Vnode<Props>): Children {
		const topic = data.selectedTopic()
		if (topic == null) {
			return
		}

		const languageTag = lang.languageTag
		const solution = languageTag.includes("de") ? topic.solutionHtmlDE : topic.solutionHtmlEN
		const sanitisedSolution = htmlSanitizer.sanitizeHTML(convertTextToHtml(solution), {
			blockExternalContent: true,
		}).html
		const issue = getTopicIssue(topic, languageTag)

		const buttonText = getContactSupportText(topic, languageTag)

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
						classes: ["scroll", "mb"],
					},
					m(".h4.m-0.pb", issue),
					m.trust(sanitisedSolution),
					buttonText &&
						!locator.logins.getUserController().isFreeAccount() &&
						m(
							".flex.center-horizontally.mt",
							m(Button, {
								label: lang.makeTranslation("", buttonText),
								type: ButtonType.Primary,
								click: () => goToContactSupportPage(),
							}),
						),
				),
			],
			m(WasThisHelpful, { goToContactSupportPage, goToSolutionWasHelpfulPage }),
		)
	}
}

interface WasThisHelpfulAttrs {
	goToContactSupportPage: VoidFunction
	goToSolutionWasHelpfulPage: VoidFunction
}

class WasThisHelpful implements Component<WasThisHelpfulAttrs> {
	view({ attrs: { goToContactSupportPage, goToSolutionWasHelpfulPage } }: Vnode<WasThisHelpfulAttrs>): Children {
		return m(
			".flex.flex-column.gap-vpad-s",
			m("small.uppercase.b.text-ellipsis", { style: { color: theme.navigation_button } }, lang.get("wasThisHelpful_msg")),
			m(Card, { shouldDivide: true }, [
				m(SectionButton, {
					text: "yes_label",
					onclick: goToSolutionWasHelpfulPage,
					rightIcon: { icon: Icons.Checkmark, title: "yes_label" },
				}),
				m(SectionButton, {
					text: "no_label",
					onclick: goToContactSupportPage,
				}),
			]),
		)
	}
}
