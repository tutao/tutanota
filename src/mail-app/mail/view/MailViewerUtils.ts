import { Keys, MailReportType, MailState, ReplyType, SYSTEM_GROUP_MAIL_ADDRESS } from "../../../common/api/common/TutanotaConstants"
import { $Promisable, assertNotNull, groupByAndMap, neverNull, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { InfoLink, lang } from "../../../common/misc/LanguageViewModel"
import { Dialog, DialogType } from "../../../common/gui/base/Dialog"
import m from "mithril"
import { Button, ButtonType } from "../../../common/gui/base/Button.js"
import { progressIcon } from "../../../common/gui/base/Icon.js"
import { checkApprovalStatus } from "../../../common/misc/LoginUtils.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl.js"
import { ContentBlockingStatus, MailViewerViewModel } from "./MailViewerViewModel.js"
import { DropdownButtonAttrs } from "../../../common/gui/base/Dropdown.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { client } from "../../../common/misc/ClientDetector.js"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog.js"
import { LockedError } from "../../../common/api/common/error/RestError.js"
import { ifAllowedTutaLinks } from "../../../common/gui/base/GuiUtils.js"
import { ExternalLink } from "../../../common/gui/base/ExternalLink.js"
import { SourceCodeViewer } from "./SourceCodeViewer.js"
import { getMailAddressDisplayText, hasValidEncryptionAuthForTeamOrSystemMail } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { mailLocator } from "../../mailLocator.js"
import { Mail, MailDetails, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { getDisplayedSender } from "../../../common/api/common/CommonMailUtils.js"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"

import { ListFilter } from "../../../common/misc/ListModel.js"
import { isDesktop } from "../../../common/api/common/Env.js"
import { isDraft } from "../model/MailChecks.js"
import { DialogHeaderBarAttrs } from "../../../common/gui/base/DialogHeaderBar"
import { exportMails } from "../export/Exporter"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { ExpanderButton, ExpanderPanel } from "../../../common/gui/base/Expander"
import { ColumnWidth, Table } from "../../../common/gui/base/Table"
import { elementIdPart, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import { OperationHandle } from "../../../common/api/main/OperationProgressTracker"

export type MailViewerMoreActions = {
	disallowExternalContentAction?: () => void
	showImagesAction?: () => void
	unsubscribeAction?: () => void
	printAction?: () => void
	reportMailAction?: () => void
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
					".white-space-pre.pt.pb.selectable",
					state.state === "loading" ? m(".center", progressIcon()) : state.headers ?? m(".center", lang.get("noEntries_msg")),
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

export async function editDraft(viewModel: MailViewerViewModel): Promise<void> {
	const sendAllowed = await checkApprovalStatus(locator.logins, false)
	if (sendAllowed) {
		// check if to be opened draft has already been minimized, iff that is the case, re-open it
		const minimizedEditor = mailLocator.minimizedMailModel.getEditorForDraft(viewModel.mail)

		if (minimizedEditor) {
			mailLocator.minimizedMailModel.reopenMinimizedEditor(minimizedEditor)
		} else {
			try {
				const [mailboxDetails, { newMailEditorFromDraft }] = await Promise.all([
					viewModel.mailModel.getMailboxDetailsForMail(viewModel.mail),
					import("../editor/MailEditor"),
				])
				if (mailboxDetails == null) {
					return
				}
				const editorDialog = await newMailEditorFromDraft(
					viewModel.mail,
					await loadMailDetails(locator.mailFacade, viewModel.mail),
					viewModel.getAttachments(),
					viewModel.getLoadedInlineImages(),
					viewModel.isBlockingExternalImages(),
					mailboxDetails,
				)
				editorDialog.show()
			} catch (e) {
				if (e instanceof UserError) {
					await showUserError(e)
				} else {
					throw e
				}
			}
		}
	}
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
		true,
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
					m(".pt-m", lang.get("failedToExport_msg")),
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

export function singleMailViewerMoreActions(viewModel: MailViewerViewModel): Array<DropdownButtonAttrs> {
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

	moreButtons.push(...mailViewerMoreActions(getMailViewerMoreActions(viewModel)))

	// adding more optional buttons? put them above the report action so the new button
	// is not sometimes where the report action usually sits.

	return moreButtons
}

export function getMailViewerMoreActions(viewModel: MailViewerViewModel): MailViewerMoreActions {
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

	if (!client.isMobileDevice() && typeof window.print === "function" && viewModel.canPrint()) {
		actions.printAction = () => window.print()
	}

	if (viewModel.canReport()) {
		actions.reportMailAction = () => reportMail(viewModel)
	}

	return actions
}

function mailViewerMoreActions({
	disallowExternalContentAction,
	showImagesAction,
	unsubscribeAction,
	printAction,
	reportMailAction,
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

	if (reportMailAction != null) {
		moreButtons.push({
			label: "reportEmail_action",
			click: reportMailAction,
			icon: Icons.Warning,
		})
	}

	// adding more optional buttons? put them above the report action so the new button
	// is not sometimes where the report action usually sits.

	return moreButtons
}

function unsubscribe(viewModel: MailViewerViewModel): Promise<void> {
	return showProgressDialog("pleaseWait_msg", viewModel.unsubscribe())
		.then((success) => {
			if (success) {
				return Dialog.message("unsubscribeSuccessful_msg")
			}
		})
		.catch((e) => {
			if (e instanceof LockedError) {
				return Dialog.message("operationStillActive_msg")
			} else {
				return Dialog.message("unsubscribeFailed_msg")
			}
		})
}

function reportMail(viewModel: MailViewerViewModel) {
	const sendReport = (reportType: MailReportType) => {
		viewModel
			.reportMail(reportType)
			.catch(ofClass(LockedError, () => Dialog.message("operationStillActive_msg")))
			.finally(m.redraw)
	}

	const dialog = Dialog.showActionDialog({
		title: "reportEmail_action",
		child: () =>
			m(
				".flex.col.mt-m",
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
							class: "mt-s",
						}),
					),
					m(".flex-wrap.flex-end", [
						m(Button, {
							label: "reportPhishing_action",
							click: () => {
								sendReport(MailReportType.PHISHING)
								dialog.close()
							},
							type: ButtonType.Secondary,
						}),
						m(Button, {
							label: "reportSpam_action",
							click: () => {
								sendReport(MailReportType.SPAM)
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

export function getMailFilterForType(filter: MailFilterType | null): ListFilter<Mail> | null {
	switch (filter) {
		case MailFilterType.Read:
			return (mail) => !mail.unread
		case MailFilterType.Unread:
			return (mail) => mail.unread
		case MailFilterType.WithAttachments:
			return (mail) => mail.attachments.length > 0
		case null:
			return null
	}
}

/**
 * @returns {boolean} true if the given mail was already replied to. Otherwise false.
 * Note that it also returns true if the mail was replied to AND forwarded.
 */
export function isRepliedTo(mail: Mail): boolean {
	return mail.replyType === ReplyType.REPLY || mail.replyType === ReplyType.REPLY_FORWARD
}

export function canDoDragAndDropExport(): boolean {
	return isDesktop()
}
