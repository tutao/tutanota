import { Keys, MailState, SYSTEM_GROUP_MAIL_ADDRESS } from "../../../common/api/common/TutanotaConstants"
import { $Promisable, assertNotNull, groupByAndMap, isEmpty, neverNull, promiseMap } from "@tutao/tutanota-utils"
import { InfoLink, lang, TranslationKey } from "../../../common/misc/LanguageViewModel"
import { Dialog, DialogType } from "../../../common/gui/base/Dialog"
import m from "mithril"
import { Button, ButtonType } from "../../../common/gui/base/Button.js"
import { progressIcon } from "../../../common/gui/base/Icon.js"
import { checkApprovalStatus } from "../../../common/misc/LoginUtils.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl.js"
import { ContentBlockingStatus, MailViewerViewModel, UnsubscribeAction, UnsubscribeType } from "./MailViewerViewModel.js"
import { DropdownButtonAttrs } from "../../../common/gui/base/Dropdown.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { client } from "../../../common/misc/ClientDetector.js"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog.js"
import { LockedError, NotFoundError } from "../../../common/api/common/error/RestError.js"
import { ifAllowedTutaLinks } from "../../../common/gui/base/GuiUtils.js"
import { ExternalLink } from "../../../common/gui/base/ExternalLink.js"
import { SourceCodeViewer } from "./SourceCodeViewer.js"
import { getMailAddressDisplayText, hasValidEncryptionAuthForTeamOrSystemMail } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { mailLocator } from "../../mailLocator.js"
import { ConversationEntry, ConversationEntryTypeRef, Mail, MailDetails, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { getDisplayedSender } from "../../../common/api/common/CommonMailUtils.js"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"

import { ListFilter } from "../../../common/misc/ListModel.js"
import { isApp, isBrowser, isDesktop } from "../../../common/api/common/Env.js"
import { isDraft } from "../model/MailChecks.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../../common/gui/base/DialogHeaderBar"
import { exportMails } from "../export/Exporter"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { ExpanderButton, ExpanderPanel } from "../../../common/gui/base/Expander"
import { ColumnWidth, Table } from "../../../common/gui/base/Table"
import { elementIdPart, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import { OperationHandle } from "../../../common/api/main/OperationProgressTracker"
import { ContentWithOptionsDialog } from "../../../common/gui/dialogs/ContentWithOptionsDialog"
import { Card } from "../../../common/gui/base/Card"
import { isDarkTheme, theme } from "../../../common/gui/theme"
import { LocalAutosavedDraftData } from "../../../common/api/worker/facades/lazy/AutosaveFacade"

export type MailViewerMoreActions = {
	disallowExternalContentAction?: () => void
	showImagesAction?: () => void
	unsubscribeAction?: () => void
	printAction?: () => void
	reportSpamAction?: () => void
	reportPhishingAction?: () => void
}

export async function showHeaderDialog(headersPromise: Promise<string | null>) {
	let state: { state: "loading" } | { state: "loaded"; headers: string | null } = { state: "loading" }

	headersPromise.then((headers) => {
		state = { state: "loaded", headers }
		m.redraw()
	})

	let mailHeadersDialog: Dialog
	const closeHeadersAction = () => {
		mailHeadersDialog?.close()
	}

	mailHeadersDialog = Dialog.largeDialog(
		{
			right: [
				{
					label: "ok_action",
					click: closeHeadersAction,
					type: ButtonType.Secondary,
				},
			],
			middle: "mailHeaders_title",
		},
		{
			view: () =>
				m(
					".white-space-pre.pt-16.pb-16.selectable",
					state.state === "loading" ? m(".center", progressIcon()) : (state.headers ?? m(".center", lang.get("noEntries_msg"))),
				),
		},
	)
		.addShortcut({
			key: Keys.ESC,
			exec: closeHeadersAction,
			help: "close_alt",
		})
		.setCloseHandler(closeHeadersAction)
		.show()
}

export async function loadMailDetails(mailFacade: MailFacade, mail: Mail): Promise<MailDetails> {
	if (isDraft(mail)) {
		const detailsDraftId = assertNotNull(mail.mailDetailsDraft)
		return mailFacade.loadMailDetailsDraft(mail)
	} else {
		const mailDetailsId = neverNull(mail.mailDetails)
		return mailFacade.loadMailDetailsBlob(mail)
	}
}

export async function createEditDraftDialog(viewModel: MailViewerViewModel, localDraftData?: LocalAutosavedDraftData): Promise<Dialog | null> {
	const sendAllowed = await checkApprovalStatus(locator.logins, false)
	if (sendAllowed) {
		// check if to be opened draft has already been minimized, iff that is the case, re-open it
		const minimizedEditor = mailLocator.minimizedMailModel.getEditorForDraft(viewModel.mail)

		if (minimizedEditor) {
			mailLocator.minimizedMailModel.reopenMinimizedEditor(minimizedEditor)
			return minimizedEditor.dialog
		} else {
			try {
				const [mailboxDetails, { newMailEditorFromDraft }] = await Promise.all([
					viewModel.mailModel.getMailboxDetailsForMail(viewModel.mail),
					import("../editor/MailEditor"),
				])
				if (mailboxDetails == null) {
					return null
				}

				let conversationEntry: ConversationEntry
				try {
					conversationEntry = await locator.entityClient.load(ConversationEntryTypeRef, viewModel.mail.conversationEntry)
				} catch (e) {
					if (e instanceof NotFoundError) {
						// draft was likely deleted
						return null
					} else {
						throw e
					}
				}

				const editorDialog = await newMailEditorFromDraft(
					viewModel.mail,
					await loadMailDetails(locator.mailFacade, viewModel.mail),
					conversationEntry,
					viewModel.getAttachments(),
					viewModel.getLoadedInlineImages(),
					viewModel.isBlockingExternalImages(),
					localDraftData,
					mailboxDetails,
				)
				return editorDialog
			} catch (e) {
				if (e instanceof UserError) {
					await showUserError(e)
					return null
				} else {
					throw e
				}
			}
		}
	} else {
		return null
	}
}

export async function editDraft(viewModel: MailViewerViewModel): Promise<void> {
	createEditDraftDialog(viewModel).then((dialog) => dialog?.show())
}

export async function showSourceDialog(rawHtml: string) {
	return Dialog.viewerDialog("emailSourceCode_title", SourceCodeViewer, { rawHtml })
}

export function startExport(actionableMails: () => Promise<readonly IdTuple[]>) {
	const operation = locator.operationProgressTracker.startNewOperation()
	const ac = new AbortController()
	const headerBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "cancel_action",
				click: () => ac.abort(),
				type: ButtonType.Secondary,
			},
		],
		middle: "emptyString_msg",
	}

	// We are doing a little backflip here to start showing progress while we still determine the number of
	// mails to export.
	const numberOfMailsStream = stream<number>()
	numberOfMailsStream.map(m.redraw)
	showProgressDialog(
		() => {
			const numberOfMails = numberOfMailsStream()
			if (isNaN(numberOfMails)) {
				return lang.getTranslation("mailExportProgress_msg", {
					"{current}": 0,
					"{total}": "?",
				})
			} else {
				return lang.getTranslation("mailExportProgress_msg", {
					"{current}": Math.round((operation.progress() / 100) * numberOfMails).toFixed(0),
					"{total}": numberOfMails,
				})
			}
		},
		doExport(actionableMails, numberOfMailsStream, operation, ac),
		operation.progress,
		headerBarAttrs,
	)
}

async function doExport(
	actionableMails: () => $Promisable<readonly IdTuple[]>,
	numberOfMailsStream: Stream<number>,
	operation: OperationHandle,
	ac: AbortController,
) {
	const mailIdsToLoad = await actionableMails()
	numberOfMailsStream(mailIdsToLoad.length)
	const mailIdsPerList = groupByAndMap(mailIdsToLoad, listIdPart, elementIdPart)
	const mails = (
		await promiseMap(mailIdsPerList, ([listId, elementIds]) => locator.entityClient.loadMultiple(MailTypeRef, listId, elementIds), { concurrency: 2 })
	).flat()
	return exportMails(mails, locator.mailFacade, locator.entityClient, locator.fileController, locator.cryptoFacade, operation.id, ac.signal)
		.then((result) => handleExportEmailsResult(result.failed))
		.finally(operation.done)
}

function handleExportEmailsResult(mailList: Mail[]) {
	if (mailList && mailList.length > 0) {
		const lines = mailList.map((mail) => ({
			cells: [mail.sender.address, mail.subject],
			actionButtonAttrs: null,
		}))

		const expanded = stream<boolean>(false)
		const dialog = Dialog.createActionDialog({
			title: "failedToExport_title",
			child: () =>
				m("", [
					m(".pt-12", lang.get("failedToExport_msg")),
					m(".flex-start.items-center", [
						m(ExpanderButton, {
							label: lang.makeTranslation(
								"hide_show",
								`${lang.get(expanded() ? "hide_action" : "show_action")} ${lang.get("failedToExport_label", { "{0}": mailList.length })}`,
							),
							expanded: expanded(),
							onExpandedChange: expanded,
						}),
					]),
					m(
						ExpanderPanel,
						{
							expanded: expanded(),
						},
						m(Table, {
							columnHeading: ["email_label", "subject_label"],
							columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
							showActionButtonColumn: false,
							lines,
						}),
					),
				]),
			okAction: () => dialog.close(),
			allowCancel: false,
			okActionTextId: "ok_action",
			type: DialogType.EditMedium,
		})

		dialog.show()
	}
}

export function multipleMailViewerMoreActions(exportAction: (() => void) | null, moreActions: MailViewerMoreActions | null): Array<DropdownButtonAttrs> {
	const moreButtons: Array<DropdownButtonAttrs> = []

	if (exportAction) {
		moreButtons.push({
			label: "export_action",
			click: exportAction,
			icon: Icons.Export,
		})
	}

	if (moreActions != null) {
		moreButtons.push(...mailViewerMoreActions(moreActions))
	}

	return moreButtons
}

export function singleMailViewerMoreActions(viewModel: MailViewerViewModel, moreActions: MailViewerMoreActions): Array<DropdownButtonAttrs> {
	const moreButtons: Array<DropdownButtonAttrs> = []
	if (viewModel.isUnread()) {
		moreButtons.push({
			label: "markRead_action",
			click: () => viewModel.setUnread(false),
			icon: Icons.Eye,
		})
	} else {
		moreButtons.push({
			label: "markUnread_action",
			click: () => viewModel.setUnread(true),
			icon: Icons.NoEye,
		})
	}

	if (!client.isMobileDevice() && viewModel.canExport()) {
		moreButtons.push({
			label: "export_action",
			click: () => showProgressDialog("pleaseWait_msg", viewModel.exportMail()),
			icon: Icons.Export,
		})
	}

	if (viewModel.canShowHeaders()) {
		moreButtons.push({
			label: "showHeaders_action",
			click: () => showHeaderDialog(viewModel.getHeaders()),
			icon: Icons.ListUnordered,
		})
	}

	addToggleLightModeButtonAttrs(viewModel, moreButtons)

	moreButtons.push(...mailViewerMoreActions(moreActions))

	// adding more optional buttons? put them above the report action so the new button
	// is not sometimes where the report action usually sits.

	return moreButtons
}

export function addToggleLightModeButtonAttrs(viewModel: MailViewerViewModel, toArray: DropdownButtonAttrs[]) {
	if (isDarkTheme()) {
		const willForceLightMode = !viewModel.getForceLightMode()
		toArray.push({
			label: willForceLightMode ? "viewInLightMode_action" : "viewInDarkMode_action",
			click: () => viewModel.setForceLightMode(willForceLightMode),
			icon: willForceLightMode ? Icons.Bulb : Icons.BulbOutline,
		})
	}
}

export function getMailViewerMoreActions({
	viewModel,
	reportSpam,
	print,
	reportPhishing,
}: {
	viewModel: MailViewerViewModel
	print: (() => unknown) | null
	reportSpam: (() => unknown) | null
	reportPhishing: (() => unknown) | null
}): MailViewerMoreActions {
	const actions: MailViewerMoreActions = {}

	if (viewModel.canPersistBlockingStatus() && viewModel.isShowingExternalContent()) {
		actions.disallowExternalContentAction = () => viewModel.setContentBlockingStatus(ContentBlockingStatus.Block)
	}

	if (viewModel.canPersistBlockingStatus() && viewModel.isBlockingExternalImages()) {
		actions.showImagesAction = () => viewModel.setContentBlockingStatus(ContentBlockingStatus.Show)
	}

	if (viewModel.isListUnsubscribe()) {
		actions.unsubscribeAction = () => unsubscribe(viewModel)
	}

	if (print && viewModel.canPrint()) {
		actions.printAction = print
	}

	if (reportSpam) {
		actions.reportSpamAction = reportSpam
	}

	if (reportPhishing) {
		actions.reportPhishingAction = reportPhishing
	}

	return actions
}

function mailViewerMoreActions({
	disallowExternalContentAction,
	showImagesAction,
	unsubscribeAction,
	printAction,
	reportSpamAction,
	reportPhishingAction,
}: MailViewerMoreActions): Array<DropdownButtonAttrs> {
	const moreButtons: Array<DropdownButtonAttrs> = []

	if (disallowExternalContentAction != null) {
		moreButtons.push({
			label: "disallowExternalContent_action",
			click: disallowExternalContentAction,
			icon: Icons.Picture,
		})
	}

	if (showImagesAction != null) {
		moreButtons.push({
			label: "showImages_action",
			click: showImagesAction,
			icon: Icons.Picture,
		})
	}

	if (unsubscribeAction != null) {
		moreButtons.push({
			label: "unsubscribe_action",
			click: unsubscribeAction,
			icon: Icons.Cancel,
		})
	}

	if (printAction != null) {
		moreButtons.push({
			label: "print_action",
			click: printAction,
			icon: Icons.Print,
		})
	}

	if (reportSpamAction != null) {
		moreButtons.push({
			label: "spam_move_action",
			click: reportSpamAction,
			icon: Icons.Spam,
		})
	}

	if (reportPhishingAction != null) {
		moreButtons.push({
			label: "reportPhishing_action",
			click: reportPhishingAction,
			icon: Icons.Warning,
		})
	}
	// adding more optional buttons? put them above the report action so the new button
	// is not sometimes where the report action usually sits.

	return moreButtons
}

export async function unsubscribe(viewModel: MailViewerViewModel): Promise<void> {
	const unsubscribeOrder = await viewModel.determineUnsubscribeOrder()
	await showUnsubscribeDialog(unsubscribeOrder, viewModel, false)
}

async function showUnsubscribeDialog(nextUnsubscribeActions: Array<UnsubscribeAction>, viewModel: MailViewerViewModel, secondAttempt: boolean): Promise<void> {
	let nextUnsubscribeAction = nextUnsubscribeActions.shift()
	if (nextUnsubscribeAction == null) {
		return Dialog.showUnsubscribeFinishedDialog(false)
	}

	const dialogAttrs = getUnsubscribeDialogAttrForUnsubscribeType(nextUnsubscribeAction.type)

	const dialogHeaderBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				type: ButtonType.Secondary,
				label: "cancel_action",
				click: () => {
					dialog.close()
				},
			},
		],
		middle: secondAttempt ? "unsubscribeSecondAttempt_label" : dialogAttrs.heading,
	}

	const dialogContent = [
		m(Card, m("", m("p.h4.m-0", lang.get(dialogAttrs.subHeading)), m("p.mt-8", lang.get(dialogAttrs.text)))),
		m(
			Card,
			m(
				"p.m-0.mt-8",
				nextUnsubscribeAction.type !== UnsubscribeType.HTTP_POST_UNSUBSCRIBE
					? nextUnsubscribeAction.requestUrl
					: isBrowser()
						? lang.get("unsubscribeHttpPostInfoWeb_msg")
						: lang.get("unsubscribeHttpPostInfoApp_msg"),
			),
		),
	]

	const dialog = new Dialog(DialogType.EditMedium, {
		view: () =>
			m(
				".flex.col.border-radius",
				{
					style: {
						height: "100%",
						"background-color": theme.surface_container,
					},
				},
				[
					dialogHeaderBarAttrs.noHeader ? null : m(DialogHeaderBar, dialogHeaderBarAttrs),
					m(
						".scroll.hide-outline.plr-24.flex-grow",
						{ style: { "overflow-x": "hidden" } },
						m(
							ContentWithOptionsDialog,
							{
								mainActionText: dialogAttrs.button,
								mainActionClick: async () => {
									if (nextUnsubscribeAction.type === UnsubscribeType.MAILTO_UNSUBSCRIBE) {
										const { newMailtoUrlMailEditor } = await import("../editor/MailEditor")
										const newMailDialog = await newMailtoUrlMailEditor(
											nextUnsubscribeAction.requestUrl!,
											false,
											assertNotNull(await viewModel.getMailboxDetails()),
										)
										if (newMailDialog != null) {
											dialog.close()
											newMailDialog.show()
										}
									} else if (nextUnsubscribeAction.type === UnsubscribeType.HTTP_GET_UNSUBSCRIBE) {
										if (isApp()) {
											mailLocator.systemFacade.openLink(nextUnsubscribeAction.requestUrl)
										} else {
											open(nextUnsubscribeAction.requestUrl)
										}
										dialog.close()
									} else {
										showProgressDialog("unsubscribing_msg", viewModel.unsubscribePost(nextUnsubscribeAction))
											.then((isSuccess) => {
												if (isSuccess || (!isSuccess && isEmpty(nextUnsubscribeActions))) {
													return Dialog.showUnsubscribeFinishedDialog(isSuccess)
												} else {
													return showUnsubscribeDialog(nextUnsubscribeActions, viewModel, true)
												}
											})
											.catch((e) => {
												if (e instanceof LockedError) {
													return Dialog.message("operationStillActive_msg")
												} else {
													if (isEmpty(nextUnsubscribeActions)) {
														return Dialog.showUnsubscribeFinishedDialog(false)
													}
													return showUnsubscribeDialog(nextUnsubscribeActions, viewModel, true)
												}
											})
										dialog.close()
									}
								},
								subActionText: null,
								subActionClick: () => {},
							},
							dialogContent,
						),
					),
				],
			),
	})

	dialog.show()
}

export function showReportPhishingMailDialog(onReport: () => unknown) {
	const dialog = Dialog.showActionDialog({
		title: "reportEmail_action",
		child: () =>
			m(
				".flex.col.mt-12",
				{
					// So that space below buttons doesn't look huge
					style: {
						marginBottom: "-10px",
					},
				},
				[
					m("div", lang.get("phishingReport_msg")),
					ifAllowedTutaLinks(locator.logins, InfoLink.Phishing, (link) =>
						m(ExternalLink, {
							href: link,
							text: lang.get("whatIsPhishing_msg"),
							isCompanySite: true,
							class: "mt-8",
						}),
					),
					m(".flex-wrap.flex-end", [
						m(Button, {
							label: "reportPhishing_action",
							click: () => {
								onReport()
								dialog.close()
							},
							type: ButtonType.Secondary,
						}),
					]),
				],
			),
		okAction: null,
	})
}

export function isNoReplyTeamAddress(address: string): boolean {
	return address === "no-reply@tutao.de" || address === "no-reply@tutanota.de"
}

/**
 * Is this a system notification?
 */
export function isSystemNotification(mail: Mail): boolean {
	const { confidential, sender, state } = mail
	return (
		state === MailState.RECEIVED &&
		confidential &&
		hasValidEncryptionAuthForTeamOrSystemMail(mail) &&
		(sender.address === SYSTEM_GROUP_MAIL_ADDRESS ||
			// New emails will have sender set to system and will only have replyTo set to no-reply
			// but we should keep displaying old emails correctly.
			isNoReplyTeamAddress(sender.address))
	)
}

export function getRecipientHeading(mail: Mail, preferNameOnly: boolean) {
	let recipientCount = parseInt(mail.recipientCount)
	if (recipientCount > 0) {
		let recipient = neverNull(mail.firstRecipient)
		return getMailAddressDisplayText(recipient.name, recipient.address, preferNameOnly) + (recipientCount > 1 ? ", ..." : "")
	} else {
		return ""
	}
}

type UnsubscribeDialogAttrs = {
	heading: TranslationKey
	subHeading: TranslationKey
	text: TranslationKey
	button: TranslationKey
}

function getUnsubscribeDialogAttrForUnsubscribeType(unsubscribeType: UnsubscribeType): UnsubscribeDialogAttrs {
	switch (unsubscribeType) {
		case UnsubscribeType.HTTP_POST_UNSUBSCRIBE:
			return {
				heading: "unsubscribe_action",
				subHeading: "unsubscribeAutomatically_label",
				text: "unsubscribeHttpPost_msg",
				button: "unsubscribe_action",
			}
		case UnsubscribeType.HTTP_GET_UNSUBSCRIBE:
			return {
				heading: "unsubscribeManually_label",
				subHeading: "unsubscribeViaLink_label",
				text: "unsubscribeHttpGet_msg",
				button: "unsubscribeHttpGet_action",
			}
		case UnsubscribeType.MAILTO_UNSUBSCRIBE:
			return {
				heading: "unsubscribeManually_label",
				subHeading: "unsubscribeViaMail_label",
				text: "unsubscribeMail_msg",
				button: "unsubscribeMail_action",
			}
	}
}

export function getSenderOrRecipientHeading(mail: Mail, preferNameOnly: boolean): string {
	if (isSystemNotification(mail)) {
		return ""
	} else if (mail.state === MailState.RECEIVED) {
		const sender = getDisplayedSender(mail)
		return getMailAddressDisplayText(sender.name, sender.address, preferNameOnly)
	} else {
		return getRecipientHeading(mail, preferNameOnly)
	}
}

export enum MailFilterType {
	Unread,
	Read,
	WithAttachments,
}

export function getMailFilterForType(filter: MailFilterType): ListFilter<Mail> {
	switch (filter) {
		case MailFilterType.Read:
			return (mail) => !mail.unread
		case MailFilterType.Unread:
			return (mail) => mail.unread
		case MailFilterType.WithAttachments:
			return (mail) => mail.attachments.length > 0
	}
}

export function canDoDragAndDropExport(): boolean {
	return isDesktop()
}
