import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { getHtmlSanitizer, HtmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { convertTextToHtml } from "../../misc/Formatter.js"
import { getContactSupportText, getTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { Thunk } from "@tutao/tutanota-utils"
import { Card } from "../../gui/base/Card.js"
import { theme } from "../../gui/theme.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { getSupportUsageTestStage } from "../SupportUsageTestUtils.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { locator } from "../../api/main/CommonLocator.js"

type Props = {
	data: SupportDialogState
	dialog: Dialog
	goToContactSupportPage: Thunk
	goToSolutionWasHelpfulPage: Thunk
}

export class SupportTopicPage implements Component<Props> {
	private readonly htmlSanitizer: HtmlSanitizer = getHtmlSanitizer()

	view({ attrs: { data, goToContactSupportPage, goToSolutionWasHelpfulPage } }: Vnode<Props>): Children {
		const topic = data.selectedTopic()
		if (topic == null) {
			return
		}

		const languageTag = lang.languageTag
		const solution = languageTag.includes("de") ? topic.solutionHtmlDE : topic.solutionHtmlEN
		const sanitisedSolution = this.htmlSanitizer.sanitizeHTML(convertTextToHtml(solution), {
			blockExternalContent: true,
			allowRelativeLinks: true,
		}).html
		const issue = getTopicIssue(topic, languageTag)

		const buttonText = getContactSupportText(topic, languageTag)

		return m(
			".flex.flex-column.pt-16.pb-16",
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
						classes: ["scroll", "mb-16"],
					},
					m(".h4.m-0.pb-16", issue),
					m.trust(sanitisedSolution),
					buttonText &&
						!locator.logins.getUserController().isFreeAccount() &&
						m(
							".flex.center-horizontally.mt-16",
							m(Button, {
								label: lang.makeTranslation("", buttonText),
								type: ButtonType.Primary,
								click: () => goToContactSupportPage(),
							}),
						),
				),
			],
			m(WasThisHelpful, { goToContactSupportPage, goToSolutionWasHelpfulPage, topicName: topic.issueEN }),
		)
	}
}

interface WasThisHelpfulAttrs {
	goToContactSupportPage: VoidFunction
	goToSolutionWasHelpfulPage: VoidFunction
	topicName: string
}

class WasThisHelpful implements Component<WasThisHelpfulAttrs> {
	view({ attrs: { goToContactSupportPage, goToSolutionWasHelpfulPage, topicName } }: Vnode<WasThisHelpfulAttrs>): Children {
		return m(
			".flex.flex-column.gap-8",
			m("small.uppercase.b.text-ellipsis", { style: { color: theme.on_surface_variant } }, lang.get("wasThisHelpful_msg")),
			m(Card, { shouldDivide: true }, [
				m(SectionButton, {
					text: "yes_label",
					onclick: () => {
						const solutionStage = getSupportUsageTestStage(2)
						solutionStage.setMetric({ name: "Result", value: topicName.replaceAll(" ", "") + "_helpful" })
						void solutionStage.complete()

						goToSolutionWasHelpfulPage()
					},
					rightIcon: { icon: Icons.Checkmark, title: "yes_label" },
				}),
				m(SectionButton, {
					text: "no_label",
					onclick: () => {
						const solutionStage = getSupportUsageTestStage(2)
						solutionStage.setMetric({ name: "Result", value: topicName.replaceAll(" ", "") + "_notHelpful" })
						void solutionStage.complete()

						goToContactSupportPage()
					},
				}),
			]),
		)
	}
}
