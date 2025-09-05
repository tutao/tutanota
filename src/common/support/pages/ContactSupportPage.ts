import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { getCategoryName, getTopicIssue, SupportDialogState } from "../SupportDialog.js"
import { clientInfoString, getLogAttachments } from "../../misc/ErrorReporter.js"
import { DataFile } from "../../api/common/DataFile.js"
import { Thunk } from "@tutao/tutanota-utils"
import { locator } from "../../api/main/CommonLocator.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { Card } from "../../gui/base/Card.js"
import { LoginButton } from "../../gui/base/buttons/LoginButton.js"
import { getHtmlSanitizer, HtmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { MailMethod, PlanTypeToName } from "../../api/common/TutanotaConstants.js"
import type { SendMailModel } from "../../mailFunctionality/SendMailModel.js"
import { convertTextToHtml } from "../../misc/Formatter.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { Switch } from "../../gui/base/Switch.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { Icon, IconSize } from "../../gui/base/Icon.js"
import { BaseButton } from "../../gui/base/buttons/BaseButton.js"
import { ButtonColor, getColors } from "../../gui/base/Button.js"
import { px, size } from "../../gui/size.js"
import type { HtmlEditor } from "../../gui/editor/HtmlEditor.js"
import { chooseAndAttachFile } from "../../../mail-app/mail/editor/MailEditorViewModel.js"
import { getSupportUsageTestStage } from "../SupportUsageTestUtils.js"

type Props = {
	data: SupportDialogState
	onSuccess: Thunk
	isRating?: boolean
}

export class ContactSupportPage implements Component<Props> {
	private sendMailModel: SendMailModel | undefined
	private readonly htmlSanitizer: HtmlSanitizer = getHtmlSanitizer()

	private htmlEditor: HtmlEditor | null = null

	oninit({ attrs: { data } }: Vnode<Props>) {
		this.collectLogs().then((logs) => {
			data.logs(logs)
			m.redraw()
		})

		const selectedTopic = data.selectedTopic()
		const selectedCategory = data.selectedCategory()

		if (selectedCategory) {
			const result = (selectedTopic?.issueEN ?? `${selectedCategory.nameEN}_other`).replaceAll(" ", "")

			const formStage = getSupportUsageTestStage(3)
			formStage.setMetric({ name: "Result", value: result })
			void formStage.complete()
		}
	}

	async oncreate({ attrs: { data } }: Vnode<Props>): Promise<void> {
		const { HtmlEditor } = await import("../../gui/editor/HtmlEditor")
		this.htmlEditor = new HtmlEditor().setMinHeight(250).setEnabled(true)

		// "Technical Issues" -> Other -> use contactTemplate from category - "Technical Issues"
		// "Technical Issues" -> "I cannot log in" -> use contactTemplate from topic - "I cannot log in"

		if (data.contactTemplate().trim() !== "") {
			this.htmlEditor.setValue(data.contactTemplate())
		}

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
		m.redraw()
	}

	onupdate({ attrs: { data } }: VnodeDOM<Props>): void {
		const supportRequestHtml = this.htmlEditor?.getValue() ?? ""

		data.supportRequestHtml = supportRequestHtml
		// If we would call `this.htmlEditor.isEmpty()` here, it would always return false because the value from inside is not updated yet, only on blur.
		data.isSupportRequestEmpty = supportRequestHtml.trim() === "" || new RegExp(/^<div( dir=["'][A-z]*["'])?><br><\/div>$/).test(supportRequestHtml)
	}

	/**
	 * Gets the subject of the support request considering the users current plan and the path they took to get to the contact form.
	 * Appends the category and topic if present.
	 *
	 * **Example output: `Support Request - Unlimited - Account: I cannot login.`**
	 */
	private async getSubject(data: SupportDialogState, isRating: boolean = false) {
		const MAX_ISSUE_LENGTH = 60
		let subject = `Support Request (${PlanTypeToName[await locator.logins.getUserController().getPlanType()]})`

		const selectedCategory = data.selectedCategory()
		const selectedTopic = data.selectedTopic()

		if (selectedCategory != null && selectedTopic != null) {
			const localizedTopic = getTopicIssue(selectedTopic, lang.languageTag)
			const issue = localizedTopic.length > MAX_ISSUE_LENGTH ? localizedTopic.substring(0, MAX_ISSUE_LENGTH) + "..." : localizedTopic
			subject += ` - ${getCategoryName(selectedCategory, lang.languageTag)}: ${issue}`
		}

		if (selectedCategory != null && selectedTopic == null) {
			subject += ` - ${getCategoryName(selectedCategory, lang.languageTag)}`
		}

		if (isRating) {
			subject += ` - Rating`
		}

		return subject
	}

	view({ attrs: { data, onSuccess, isRating } }: Vnode<Props>): Children {
		return m(
			".flex.flex-column.pt-16.height-100p.gap-16",
			m(Card, m("", m("p.h4.m-0", lang.get("supportForm_title")), m("p.m-0.mt-8", data.helpText()))),
			m(
				Card,
				{
					classes: ["child-text-editor", "rel", "height-100p"],
					style: {
						padding: "0",
					},
				},
				this.htmlEditor?.isEmpty() && !this.htmlEditor?.isActive() && m("span.text-editor-placeholder", lang.get("supportForm_whatWentWrong_msg")),
				this.htmlEditor != null && m(this.htmlEditor),
			),

			m(
				".flex.flex-column.gap-16.pb-16",
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
							isDisabled: this.sendMailModel == null,
							onclick: async (_, dom) => {
								await chooseAndAttachFile(this.sendMailModel!, dom.getBoundingClientRect())
								m.redraw()
							},
						}),
						(this.sendMailModel?.getAttachments() ?? []).map((attachment) =>
							m(
								".flex.center-vertically.flex-space-between.pb-8.pt-8",
								{ style: { paddingInline: px(size.spacing_8) } },
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
											paddingInline: px((size.icon_24 - size.icon_16) / 2),
										},
										title: lang.get("remove_action"),
									}),
								),
							),
						),
					],
				),
				m(
					Card,
					m(".flex.gap-8.items-center", [
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
						disabled: this.sendMailModel == null,
						onclick: async () => {
							if (!this.sendMailModel) {
								return
							}

							if (data.isSupportRequestEmpty) {
								this.htmlEditor?.editor.domElement?.focus()
								return
							}

							const customerId = (await locator.logins.getUserController().loadCustomerInfo()).customer
							let mailBody = data.shouldIncludeLogs()
								? `${data.supportRequestHtml}${clientInfoString(new Date(), true).message}`
								: data.supportRequestHtml
							mailBody += `<br>Customer ID: ${customerId}`
							const sanitisedBody = this.htmlSanitizer.sanitizeHTML(convertTextToHtml(mailBody), {
								blockExternalContent: true,
							}).html

							this.sendMailModel.setBody(sanitisedBody)
							this.sendMailModel.setSubject(await this.getSubject(data, isRating))

							if (data.shouldIncludeLogs()) {
								this.sendMailModel.attachFiles(data.logs())
							}

							await this.sendMailModel.send(MailMethod.NONE, () => Promise.resolve(true), showProgressDialog)

							onSuccess()
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
