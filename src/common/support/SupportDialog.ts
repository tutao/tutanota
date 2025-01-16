import m from "mithril"
import { assertMainOrNode } from "../api/common/Env"
import { LoginController } from "../api/main/LoginController.js"
import Stream from "mithril/stream"
import { SupportCategory, SupportData, SupportDataTypeRef, SupportTopic } from "../api/entities/tutanota/TypeRefs.js"
import { MultiPageDialog } from "../gui/dialogs/MultiPageDialog.js"
import { SupportLandingPage } from "./pages/SupportLandingPage.js"
import { locator } from "../api/main/CommonLocator.js"
import { SupportCategoryPage } from "./pages/SupportCategoryPage.js"
import { SupportTopicPage } from "./pages/SupportTopicPage.js"
import { ContactSupportPage } from "./pages/ContactSupportPage.js"
import { SupportRequestSentDialog } from "./pages/SupportRequestSentDialog.js"
import { ButtonType } from "../gui/base/Button.js"
import { clientInfoString } from "../misc/ErrorReporter.js"
import { Attachment, SendMailModel } from "../mailFunctionality/SendMailModel.js"
import { htmlSanitizer } from "../misc/HtmlSanitizer.js"
import { convertTextToHtml } from "../misc/Formatter.js"
import { Keys, MailMethod, PlanTypeToName } from "../api/common/TutanotaConstants.js"
import { lang } from "../misc/LanguageViewModel.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { HtmlEditor } from "../gui/editor/HtmlEditor.js"
import { DataFile } from "../api/common/DataFile.js"
import { EmailSupportUnavailableView } from "./pages/EmailSupportUnavailableView.js"
import { Dialog } from "../gui/base/Dialog.js"

export interface SupportDialogState {
	canHaveEmailSupport: boolean
	selectedCategory: Stream<SupportCategory | null>
	selectedTopic: Stream<SupportTopic | null>
	supportData: SupportData
	htmlEditor: HtmlEditor
	shouldIncludeLogs: Stream<boolean>
	userAttachments: Stream<DataFile[]>
	logs: Stream<DataFile[]>
}

assertMainOrNode()

enum SupportPages {
	CATEGORIES,
	CATEGORY_DETAIL,
	TOPIC_DETAIL,
	CONTACT_SUPPORT,
	SUPPORT_REQUEST_SENT,
	EMAIL_SUPPORT_BEHIND_PAYWALL,
}

// Generates a SendMailModel from the User Mailbox
export async function showSupportDialog(logins: LoginController) {
	const data: SupportDialogState = {
		canHaveEmailSupport: logins.isInternalUserLoggedIn() && logins.getUserController().isPaidAccount(),
		selectedCategory: Stream<SupportCategory | null>(null),
		selectedTopic: Stream<SupportTopic | null>(null),
		supportData: await locator.entityClient.load(SupportDataTypeRef, "--------1---"),
		htmlEditor: new HtmlEditor().setMinHeight(200).enableToolbar().setEnabled(true),
		shouldIncludeLogs: Stream(true),
		userAttachments: Stream([]),
		logs: Stream([]),
	}

	const multiPageDialog: Dialog = new MultiPageDialog<SupportPages>(SupportPages.CATEGORIES)
		.buildDialog(
			(currentPage, dialog, navigateToPage, _) => {
				switch (currentPage) {
					case SupportPages.CATEGORY_DETAIL:
						return m(SupportCategoryPage, {
							data,
							goToContactSupport: () => {
								if (data.canHaveEmailSupport) {
									navigateToPage(SupportPages.CONTACT_SUPPORT)
								} else {
									navigateToPage(SupportPages.EMAIL_SUPPORT_BEHIND_PAYWALL)
								}
							},
							goToTopicDetailPage: () => navigateToPage(SupportPages.TOPIC_DETAIL),
						})
					case SupportPages.TOPIC_DETAIL:
						return m(SupportTopicPage, {
							data,
							dialog,
							goToContactSupportPage: () => {
								if (data.canHaveEmailSupport) {
									navigateToPage(SupportPages.CONTACT_SUPPORT)
								} else {
									navigateToPage(SupportPages.EMAIL_SUPPORT_BEHIND_PAYWALL)
								}
							},
						})
					case SupportPages.CONTACT_SUPPORT:
						return m(ContactSupportPage, { data, goToSuccessPage: () => navigateToPage(SupportPages.SUPPORT_REQUEST_SENT) })
					case SupportPages.SUPPORT_REQUEST_SENT:
						return m(SupportRequestSentDialog, {
							closeDialog: () => dialog.close(),
						})
					case SupportPages.CATEGORIES:
						return m(SupportLandingPage, {
							data,
							toCategoryDetail: () => navigateToPage(SupportPages.CATEGORY_DETAIL),
							goToContactSupport: () => {
								if (data.canHaveEmailSupport) {
									navigateToPage(SupportPages.CONTACT_SUPPORT)
								} else {
									navigateToPage(SupportPages.EMAIL_SUPPORT_BEHIND_PAYWALL)
								}
							},
						})
					case SupportPages.EMAIL_SUPPORT_BEHIND_PAYWALL:
						return m(EmailSupportUnavailableView)
				}
			},
			{
				getPageTitle: (currentPage) => {
					switch (currentPage) {
						case SupportPages.SUPPORT_REQUEST_SENT:
							return "We received your request!"
						case SupportPages.CONTACT_SUPPORT:
						case SupportPages.CATEGORY_DETAIL:
						case SupportPages.EMAIL_SUPPORT_BEHIND_PAYWALL:
						case SupportPages.CATEGORIES:
						case SupportPages.TOPIC_DETAIL:
							return "Support"
					}
				},
				getLeftAction: (currentPage, dialog, navigateToPage, goBack) => {
					switch (currentPage) {
						case SupportPages.CATEGORIES:
							return { type: ButtonType.Secondary, click: () => dialog.close(), label: "close_alt", title: "close_alt" }
						case SupportPages.TOPIC_DETAIL:
						case SupportPages.CATEGORY_DETAIL:
						case SupportPages.EMAIL_SUPPORT_BEHIND_PAYWALL:
							return { type: ButtonType.Secondary, click: () => goBack(), label: () => "Back", title: () => "Back" }
						case SupportPages.CONTACT_SUPPORT:
							return {
								type: ButtonType.Secondary,
								click: async () => {
									if (data.htmlEditor.getTrimmedValue().length > 10) {
										const confirmed = await Dialog.confirm(() => "Are you sure you want to go back? Your request will be lost.")
										if (confirmed) {
											goBack()
										}
									} else {
										goBack()
									}
								},
								label: () => "Back",
								title: () => "Back",
							}
						case SupportPages.SUPPORT_REQUEST_SENT:
							return { type: ButtonType.Secondary, click: () => dialog.close(), label: "close_alt", title: "close_alt" }
					}
				},
				getRightAction: (currentPage, dialog, navigateToPage, __) => {
					switch (currentPage) {
						case SupportPages.EMAIL_SUPPORT_BEHIND_PAYWALL:
							return {
								type: ButtonType.Secondary,
								label: "close_alt",
								title: "close_alt",
								click: () => {
									dialog.close()
								},
							}
						case SupportPages.CONTACT_SUPPORT:
							return {
								type: ButtonType.Primary,
								label: () => "Send",
								title: () => "Send",
								click: async () => {
									const message = data.htmlEditor.getValue()
									const mailBody = data.shouldIncludeLogs() ? `${message}${clientInfoString(new Date(), true).message}` : message
									const attachments = data.shouldIncludeLogs() ? [...data.userAttachments(), ...data.logs()] : data.userAttachments()

									await send(mailBody, attachments, data)

									navigateToPage(SupportPages.SUPPORT_REQUEST_SENT)
								},
							}
					}
				},
			},
		)
		.addShortcut({
			help: "close_alt",
			key: Keys.ESC,
			exec: () => multiPageDialog.close(),
		})
		.show()
}

export function getLocalisedCategoryName(category: SupportCategory, languageTag: string): string {
	return languageTag.includes("de") ? category.nameDE : category.nameEN
}

export function getLocalisedCategoryIntroduction(category: SupportCategory, languageTag: string): string {
	return languageTag.includes("de") ? category.introductionDE : category.introductionEN
}

export function getLocalisedTopicIssue(topic: SupportTopic, languageTag: string): string {
	return languageTag.includes("de") ? topic.issueDE : topic.issueEN
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
