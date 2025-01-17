import m, { Children, Component, Vnode } from "mithril"
import { getLocalisedCategoryName, getLocalisedTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { clientInfoString, getLogAttachments } from "../../misc/ErrorReporter.js"
import { DataFile } from "../../api/common/DataFile.js"
import { Thunk } from "@tutao/tutanota-utils"
import { AttachmentBubble, AttachmentType } from "../../gui/AttachmentBubble.js"
import { locator } from "../../api/main/CommonLocator.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { showFileChooser } from "../../file/FileController.js"
import { Checkbox } from "../../gui/base/Checkbox.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { Card } from "../../gui/base/Card.js"
import { LoginButton } from "../../gui/base/buttons/LoginButton.js"
import { htmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { MailMethod, PlanTypeToName } from "../../api/common/TutanotaConstants.js"
import { Attachment, SendMailModel } from "../../mailFunctionality/SendMailModel.js"
import { convertTextToHtml } from "../../misc/Formatter.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"

export type Props = {
	data: SupportDialogState
	goToSuccessPage: Thunk
}

export class ContactSupportPage implements Component<Props> {
	oninit({ attrs: { data } }: Vnode<Props>) {
		this.collectLogs().then((logs) => {
			data.logs(logs)
			m.redraw()
		})
	}

	view({ attrs: { data, goToSuccessPage } }: Vnode<Props>): Children {
		return m(
			".flex.flex-column",
			{
				style: {
					gap: "1em",
					// "min-height": styles.isDesktopLayout() ? "850px" : "",
					// "min-width": styles.isDesktopLayout() ? "450px" : "360px",
				},
			},
			m(
				Card,
				{ rootElementType: "div", classes: ["mt"], style: { padding: "1em" } },
				m(
					"",
					m("p.h4.m-0", "Tell us more"),
					m("p.m-0.mt-s", "Please clarify what problem you faced. You can attach screenshots to help us understand your situation."),
				),
			),
			m(
				Card,
				{
					classes: ["child-text-editor", "rel"],
					style: {
						padding: "0",
					},
				},
				[data.htmlEditor.isEmpty() && !data.htmlEditor.isActive() ? m("span.text-editor-placeholder", "What went wrong?") : null, m(data.htmlEditor)],
			),
			// m(
			// 	".border-radius-m.mt",
			// 	{
			// 		style: {
			// 			"background-color": getElevatedBackground(),
			// 			padding: "0.5em 1em 1em 1em",
			// 		},
			// 	},
			// 	m(htmlEditor),
			// ),
			m(
				".flex.flex-space-between.align-self-end.items-center.gap-hpad.mt-m",
				m(
					".flex",
					{ style: { "flex-wrap": "wrap", gap: "0.5em" } },
					data.userAttachments().map((attachment, index) =>
						m(AttachmentBubble, {
							attachment: attachment,
							download: () => locator.fileController.saveDataFile(attachment),
							open: null,
							remove: () => {
								const tmp = data.userAttachments()
								tmp.splice(index, 1)
								data.userAttachments(tmp)
							},
							fileImport: null,
							type: AttachmentType.GENERIC,
						}),
					),
				),
				m(
					"",
					{
						style: {
							"align-self": "flex-start",
						},
					},
					m(Button, {
						type: ButtonType.Secondary,
						label: () => "Attach files",
						click: () => {
							showFileChooser(true).then((chosenFiles) => {
								const tmp = data.userAttachments()
								tmp.push(...chosenFiles)
								data.userAttachments(tmp)
								m.redraw()
							})
						},
					}),
				),
			),
			// TODO: Add a tooltip around this checkbox with the text "Send technical logs to help us solve your issue."
			m(
				".center.mt",
				m(Checkbox, {
					label: () => lang.get("sendLogs_action"),
					class: "mb",
					checked: data.shouldIncludeLogs(),
					onChecked: (checked) => data.shouldIncludeLogs(checked),
				}),
			),
			m(
				".align-self-center.full-width",
				m(LoginButton, {
					label: () => "Send",
					onclick: async () => {
						const message = data.htmlEditor.getValue()
						const mailBody = data.shouldIncludeLogs() ? `${message}${clientInfoString(new Date(), true).message}` : message
						const attachments = data.shouldIncludeLogs() ? [...data.userAttachments(), ...data.logs()] : data.userAttachments()

						await send(mailBody, attachments, data)

						goToSuccessPage()
					},
				}),
			),
		)
	}

	private async collectLogs(): Promise<DataFile[]> {
		return await getLogAttachments(new Date())
	}
}

/**
 * Sends an email to the support address
 * @param rawBody The unsanitised HTML string to be sanitised then used as the emails body
 * @param attachments The files to be added as attachments to the email
 * @param data The dialog data required to get the selected category and topic if present.
 */
async function send(rawBody: string, attachments: Attachment[], data: SupportDialogState) {
	const sanitisedBody = htmlSanitizer.sanitizeHTML(convertTextToHtml(rawBody), {
		blockExternalContent: true,
	}).html

	const planType = await locator.logins.getUserController().getPlanType()

	/**
	 * Gets the subject of the support request considering the users current plan and the path they took to get to the contact form.
	 * Appends the category and topic if present.
	 *
	 * **Example output: `Support Request - Unlimited - Account: I cannot login.`**
	 */
	function getSubject() {
		const MAX_ISSUE_LENGTH = 60
		let subject = `Support Request (${PlanTypeToName[planType]})`

		const selectedCategory = data.selectedCategory()
		const selectedTopic = data.selectedTopic()

		if (selectedCategory != null && selectedTopic != null) {
			const localizedTopic = getLocalisedTopicIssue(selectedTopic, lang.languageTag)
			const issue = localizedTopic.length > MAX_ISSUE_LENGTH ? localizedTopic.substring(0, MAX_ISSUE_LENGTH) + "..." : localizedTopic
			subject += ` - ${getLocalisedCategoryName(selectedCategory, lang.languageTag)}: ${issue}`
		}

		if (selectedCategory != null && selectedTopic == null) {
			subject += ` - ${getLocalisedCategoryName(selectedCategory, lang.languageTag)}`
		}

		return subject
	}

	const sendMailModel = await createSendMailModel()
	const model = await sendMailModel.initWithTemplate(
		{
			to: [
				{
					name: null,
					// address: "premium@tutao.de",
					address: "arm-free@tutanota.de",
				},
			],
		},
		getSubject(),
		sanitisedBody,
		attachments,
		false,
	)
	await model.send(MailMethod.NONE, () => Promise.resolve(true), showProgressDialog)
}

async function createSendMailModel(): Promise<SendMailModel> {
	const mailboxDetails = await locator.mailboxModel.getUserMailboxDetails()
	const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
	return await locator.sendMailModel(mailboxDetails, mailboxProperties)
}
