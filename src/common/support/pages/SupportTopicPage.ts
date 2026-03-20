import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { getHtmlSanitizer, HtmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { convertTextToHtml } from "../../misc/Formatter.js"
import { getContactSupportText, getTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { makeSingleUse, noOp, Thunk } from "@tutao/tutanota-utils"
import { Card } from "../../gui/base/Card.js"
import { theme } from "../../gui/theme.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { getSupportUsageTestStage } from "../SupportUsageTestUtils.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { locator } from "../../api/main/CommonLocator.js"
import { LoginButton } from "../../gui/base/buttons/LoginButton"
import { ApprovalStatus, getCustomerApprovalStatus } from "../../api/common/TutanotaConstants"
import { isSupportVisibilityEnabled, SupportVisibilityMask } from "../SupportVisibilityMask"
import { SupportTopic } from "../../api/entities/tutanota/TypeRefs"
import { fastTrackAction } from "../../misc/ApprovalNeededMessageDialog"

type Props = {
	data: SupportDialogState
	dialog: Dialog
	goToContactSupportPage: Thunk
	goToSolutionWasHelpfulPage: Thunk
	closeDialog: Thunk
}

function isSettingsLink(href: string): boolean {
	return href.startsWith("/settings/") ?? false
}

export class SupportTopicPage implements Component<Props> {
	private readonly htmlSanitizer: HtmlSanitizer = getHtmlSanitizer()
	private closeDialog: Thunk = noOp
	private clickListener = (event: Event) => {
		const href = (event.target as Element | null)?.closest("a")?.getAttribute("href") ?? null
		if (href && isSettingsLink(href)) {
			const newRoute = href.substring(href.indexOf("/settings/"))
			m.route.set(newRoute)
			this.closeDialog()
			event.preventDefault()
		}
	}

	oncreate(vnode: VnodeDOM<Props>) {
		this.closeDialog = vnode.attrs.closeDialog
		vnode.dom.addEventListener("click", this.clickListener)
	}

	onremove(vnode: VnodeDOM<Props>) {
		vnode.dom.removeEventListener("click", this.clickListener)
	}

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
		const customer = locator.logins.getUserController().getCustomer()
		const approvalStatus =
			customer == null // this is the case for external mailbox users, they don't load the customer
				? ApprovalStatus.REGISTRATION_APPROVED
				: getCustomerApprovalStatus(customer)
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
			this.renderFastTrackButtonIfNeeded(topic, approvalStatus),
		)
	}

	renderFastTrackButtonIfNeeded(topic: SupportTopic, approvalStatus: ApprovalStatus): Children {
		if (approvalStatus !== ApprovalStatus.DELAYED) {
			return null
		} else {
			return isSupportVisibilityEnabled(Number(topic.visibility), SupportVisibilityMask.ShowFasttrackButton)
				? m(
						".mt-16",
						m(LoginButton, {
							label: "fastTrackButtonApproval_action",
							onclick: makeSingleUse(() => fastTrackAction()),
						}),
					)
				: null
		}
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
			m("small.uppercase.b.text-ellipsis", { style: { color: theme.on_surface } }, lang.get("wasThisHelpful_msg")),
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
