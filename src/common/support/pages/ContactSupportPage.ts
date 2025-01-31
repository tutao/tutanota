import m, { Children, Component, Vnode } from "mithril"
import { getLocalisedCategoryName, getLocalisedTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { clientInfoString, getLogAttachments } from "../../misc/ErrorReporter.js"
import { DataFile } from "../../api/common/DataFile.js"
import { Thunk } from "@tutao/tutanota-utils"
import { locator } from "../../api/main/CommonLocator.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { Card } from "../../gui/base/Card.js"
import { LoginButton } from "../../gui/base/buttons/LoginButton.js"
import { htmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { MailMethod, PlanTypeToName } from "../../api/common/TutanotaConstants.js"
import { SendMailModel } from "../../mailFunctionality/SendMailModel.js"
import { convertTextToHtml } from "../../misc/Formatter.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { Switch } from "../../gui/base/Switch.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { BaseButton } from "../../gui/base/buttons/BaseButton.js"
import { ButtonColor, getColors } from "../../gui/base/Button.js"
import { px, size } from "../../gui/size.js"
import { chooseAndAttachFile } from "../../../mail-app/mail/editor/MailEditorViewModel.js"

export type Props = {
	data: SupportDialogState
	goToSuccessPage: Thunk
}

export class ContactSupportPage implements Component<Props> {
	private sendMailModel: SendMailModel | undefined

	oninit({ attrs: { data } }: Vnode<Props>) {
		this.collectLogs().then((logs) => {
			data.logs(logs)
			m.redraw()
		})
	}

	async oncreate(): Promise<void> {
		this.sendMailModel = await createSendMailModel()
		await this.sendMailModel.initWithTemplate(
			{
				to: [
					{
						name: null,
						address: "helpdesk@tutao.de",
					},
				],
			},
			"",
			"",
			[],
			false,
		)
	}

	/**
	 * Gets the subject of the support request considering the users current plan and the path they took to get to the contact form.
	 * Appends the category and topic if present.
	 *
	 * **Example output: `Support Request - Unlimited - Account: I cannot login.`**
	 */
	private async getSubject(data: SupportDialogState) {
		const MAX_ISSUE_LENGTH = 60
		let subject = `Support Request (${PlanTypeToName[await locator.logins.getUserController().getPlanType()]})`

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

	view({ attrs: { data, goToSuccessPage } }: Vnode<Props>): Children {
		return m(
			".flex.flex-column.pt.height-100p.gap-vpad",
			m(Card, m("", m("p.h4.m-0", lang.get("supportForm_title")), m("p.m-0.mt-s", lang.get("supportForm_msg")))),
			m(
				Card,
				{
					classes: ["child-text-editor", "rel", "height-100p"],
					style: {
						padding: "0",
					},
				},
				m(data.htmlEditor),
			),

			m(
				".flex.flex-column.gap-vpad.pb",
				{
					style: {
						marginTop: "auto",
					},
				},
				m(
					Card,
					{
						shouldDivide: true,
					},
					[
						m(SectionButton, {
							text: "attachFiles_action",
							rightIcon: { icon: Icons.Attachment, title: "attachFiles_action" },
							onclick: async (_, dom) => {
								await chooseAndAttachFile(this.sendMailModel!, dom.getBoundingClientRect())
								m.redraw()
							},
						}),
						(this.sendMailModel?.getAttachments() ?? []).map((attachment) =>
							m(
								".flex.center-vertically.flex-space-between.pb-s.pt-s",
								{ style: { paddingInline: px(size.vpad_small) } },
								m("span.smaller", attachment.name),
								m(
									BaseButton,
									{
										label: "remove_action",
										onclick: () => {
											this.sendMailModel?.removeAttachment(attachment)
											m.redraw()
										},
										class: "flex justify-between flash",
									},
									m(Icon, {
										icon: Icons.Trash,
										style: {
											fill: getColors(ButtonColor.Content).button,
											paddingInline: px((size.icon_size_large - size.icon_size_medium) / 2),
										},
										title: lang.get("remove_action"),
										size: IconSize.Normal,
									}),
								),
							),
						),
					],
				),
				m(
					Card,
					m(".flex.gap-vpad-s.items-center", [
						m(
							Switch,
							{
								checked: data.shouldIncludeLogs(),
								onclick: (checked) => data.shouldIncludeLogs(checked),
								ariaLabel: lang.get("sendLogs_action"),
								variant: "expanded",
							},
							lang.get("sendLogs_action"),
						),
					]),
				),
				m(
					".align-self-center.full-width",
					m(LoginButton, {
						label: "send_action",
						onclick: async () => {
							if (!this.sendMailModel) {
								return
							}

							const message = data.htmlEditor.getValue()
							const mailBody = data.shouldIncludeLogs() ? `${message}${clientInfoString(new Date(), true).message}` : message

							const sanitisedBody = htmlSanitizer.sanitizeHTML(convertTextToHtml(mailBody), {
								blockExternalContent: true,
							}).html

							this.sendMailModel.setBody(sanitisedBody)
							this.sendMailModel.setSubject(await this.getSubject(data))

							if (data.shouldIncludeLogs()) {
								this.sendMailModel.attachFiles(data.logs())
							}

							await this.sendMailModel.send(MailMethod.NONE, () => Promise.resolve(true), showProgressDialog)

							goToSuccessPage()
						},
					}),
				),
			),
		)
	}

	private async collectLogs(): Promise<DataFile[]> {
		return await getLogAttachments(new Date())
	}
}

async function createSendMailModel(): Promise<SendMailModel> {
	const mailboxDetails = await locator.mailboxModel.getUserMailboxDetails()
	const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
	return await locator.sendMailModel(mailboxDetails, mailboxProperties)
}
