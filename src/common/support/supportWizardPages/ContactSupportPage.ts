import { emitWizardEvent, WizardEventType, WizardPageAttrs } from "../../gui/base/WizardDialog.js"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { HtmlEditor } from "../../gui/editor/HtmlEditor.js"
import { LoginButton } from "../../gui/base/buttons/LoginButton.js"
import { Checkbox } from "../../gui/base/Checkbox.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { getLocalisedCategoryName, getLocalisedTopicIssue, SupportDialogAttrs } from "../SupportDialog.js"
import { clientInfoString, getLogAttachments } from "../../misc/ErrorReporter.js"
import { styles } from "../../gui/styles.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { DataFile } from "../../api/common/DataFile.js"
import { locator } from "../../api/main/CommonLocator.js"
import { Keys, MailMethod, PlanTypeToName } from "../../api/common/TutanotaConstants.js"
import { htmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { convertTextToHtml } from "../../misc/Formatter.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { Attachment, SendMailModel } from "../../mailFunctionality/SendMailModel.js"
import { AttachmentBubble, AttachmentType } from "../../gui/AttachmentBubble.js"
import { showFileChooser } from "../../file/FileController.js"
import { ExternalLink } from "../../gui/base/ExternalLink.js"
import { showUpgradeDialog } from "../../gui/nav/NavFunctions.js"
import { getElevatedBackground } from "../../gui/theme.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { SupportRequestSentDialog } from "../SupportRequestSentDialog.js"

export class ContactSupportPage implements Component<ContactSupportPageAttrs> {
	private readonly htmlEditor: HtmlEditor = new HtmlEditor().setMinHeight(200).enableToolbar().setEnabled(true)
	private logs: DataFile[] = []
	private shouldIncludeLogs: boolean = true
	private readonly userAttachments: DataFile[] = []
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<ContactSupportPageAttrs>) {
		this.dom = vnode.dom as HTMLElement
	}

	oninit() {
		this.collectLogs().then((logs) => {
			this.logs = logs
			m.redraw()
		})
	}

	view(vnode: Vnode<ContactSupportPageAttrs>): Children {
		if (vnode.attrs.data.canHaveEmailSupport) {
			return m(
				".flex.flex-column.plr-l",
				{
					style: {
						// "min-height": styles.isDesktopLayout() ? "850px" : "",
						// "min-width": styles.isDesktopLayout() ? "450px" : "360px",
					},
				},
				m(
					"p",
					{
						style: {
							height: styles.isDesktopLayout() ? "45px" : "77.5px",
						},
					},
					"Please clarify what problem you faced. You can attach screenshots to help us understand your situation.",
				),
				m(
					"",
					{
						style: {
							"background-color": getElevatedBackground(),
							padding: "0.5em 1em 1em 1em",
						},
					},
					m(this.htmlEditor),
				),
				m(
					".flex.flex-space-between.align-self-end.items-center.gap-hpad.mt-m",
					m(
						".flex",
						{ style: { "flex-wrap": "wrap", gap: "0.5em" } },
						this.userAttachments.map((attachment, index) =>
							m(AttachmentBubble, {
								attachment: attachment,
								download: () => locator.fileController.saveDataFile(attachment),
								open: null,
								remove: () => this.userAttachments.splice(index, 1),
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
									this.userAttachments.push(...chosenFiles)
									m.redraw()
								})
							},
						}),
					),
				),
				// TODO: Add a tooltip around this checkbox with the text "Send technical logs to help us solve your issue."
				m(
					".center",
					m(Checkbox, {
						label: () => lang.get("sendLogs_action"),
						class: "mb",
						checked: this.shouldIncludeLogs,
						onChecked: (checked) => (this.shouldIncludeLogs = checked),
					}),
				),
				this.renderSubmitButton(vnode.attrs.data),
			)
		} else {
			return m("", [
				m(
					"p",
					"Sorry, your free plan does not support direct email support. But you can get more help from Tuta's Community at Reddit or at Tuta's official FAQ page.",
				),
				m(".flex-center", { style: { gap: "1em" } }, [
					m(ExternalLink, {
						text: "Reddit",
						href: "https://reddit.com/r/tutanota",
						isCompanySite: false,
					}),
					m(ExternalLink, { text: "Tuta FAQ", href: "https://tuta.com/support", isCompanySite: true }),
				]),
				m(
					".mt",
					m(LoginButton, {
						label: () => "Upgrade to a paid plan with email support",
						onclick: () => {
							showUpgradeDialog()
						},
					}),
				),
			])
		}
	}

	private renderSubmitButton(data: SupportDialogAttrs) {
		return m(
			".align-self-center",
			{
				style: {
					width: "200px",
				},
			},
			m(LoginButton, {
				label: () => "Send support request",
				onclick: () => {
					const message = this.htmlEditor.getValue()
					const mailBody = this.shouldIncludeLogs ? `${message}${clientInfoString(new Date(), true).message}` : message
					const attachments = this.shouldIncludeLogs ? [...this.userAttachments, ...this.logs] : this.userAttachments
					this.send(mailBody, attachments, data).then(() => emitWizardEvent(this.dom, WizardEventType.CLOSE_DIALOG))
				},
			}),
		)
	}

	/**
	 * Sends an email to the support address
	 * @param rawBody The unsanitised HTML string to be sanitised then used as the emails body
	 * @param attachments The files to be added as attachments to the email
	 * @param data The dialog data required to get the selected category and topic if present.
	 */
	private async send(rawBody: string, attachments: Attachment[], data: SupportDialogAttrs) {
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

		const sendMailModel = await this.createSendMailModel()
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

		const dialog: Dialog = Dialog.editMediumDialog(
			{
				left: [{ click: () => dialog.close(), label: "close_alt", title: "close_alt", type: ButtonType.Secondary }],
			},
			SupportRequestSentDialog,
			{ closeDialog: () => dialog.close() },
		)
			.addShortcut({
				key: Keys.ESC,
				exec: () => dialog.close(),
				help: "close_alt",
			})
			.show()
	}

	// Generates a SendMailModel from the User Mailbox
	private async createSendMailModel(): Promise<SendMailModel> {
		const mailboxDetails = await locator.mailboxModel.getUserMailboxDetails()
		const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		return await locator.sendMailModel(mailboxDetails, mailboxProperties)
	}

	private async collectLogs(): Promise<DataFile[]> {
		return await getLogAttachments(new Date())
	}
}

export class ContactSupportPageAttrs implements WizardPageAttrs<SupportDialogAttrs> {
	readonly data: SupportDialogAttrs
	readonly hideAllPagingButtons: boolean
	readonly hidePagingButtonForPage: boolean
	readonly preventGoBack: boolean

	constructor(data: SupportDialogAttrs) {
		this.data = data
		this.hideAllPagingButtons = true
		this.hidePagingButtonForPage = true
		this.preventGoBack = false
	}

	headerTitle(): string {
		if (this.data.canHaveEmailSupport) {
			return "Contact support"
		} else {
			return "Support"
		}
	}

	isEnabled(): boolean {
		return true
	}

	isSkipAvailable(): boolean {
		return true
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		return Promise.resolve(true)
	}
}
