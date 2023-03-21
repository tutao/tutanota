import type { ImageHandler } from "../model/MailUtils"
import { getMailAddressDisplayText, loadMailDetails } from "../model/MailUtils"
import { ALLOWED_IMAGE_FORMATS, Keys, MailReportType, MAX_BASE64_IMAGE_SIZE } from "../../api/common/TutanotaConstants"
import { neverNull, ofClass, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { InfoLink, lang } from "../../misc/LanguageViewModel"
import { Dialog } from "../../gui/base/Dialog"
import { DataFile } from "../../api/common/DataFile"
import { showFileChooser } from "../../file/FileController.js"
import m from "mithril"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { progressIcon } from "../../gui/base/Icon.js"
import { checkApprovalStatus } from "../../misc/LoginUtils.js"
import { locator } from "../../api/main/MainLocator.js"
import { UserError } from "../../api/main/UserError.js"
import { showUserError } from "../../misc/ErrorHandlerImpl.js"
import { ContentBlockingStatus, MailViewerViewModel } from "./MailViewerViewModel.js"
import { DropdownButtonAttrs } from "../../gui/base/Dropdown.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { client } from "../../misc/ClientDetector.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { LockedError } from "../../api/common/error/RestError.js"
import { ifAllowedTutanotaLinks } from "../../gui/base/GuiUtils.js"
import { styles } from "../../gui/styles.js"

export function insertInlineImageB64ClickHandler(ev: Event, handler: ImageHandler) {
	showFileChooser(true, ALLOWED_IMAGE_FORMATS).then((files) => {
		const tooBig: DataFile[] = []

		for (let file of files) {
			if (file.size > MAX_BASE64_IMAGE_SIZE) {
				tooBig.push(file)
			} else {
				const b64 = uint8ArrayToBase64(file.data)
				const dataUrlString = `data:${file.mimeType};base64,${b64}`
				handler.insertImage(dataUrlString, {
					style: "max-width: 100%",
				})
			}
		}

		if (tooBig.length > 0) {
			Dialog.message(() =>
				lang.get("tooBigInlineImages_msg", {
					"{size}": MAX_BASE64_IMAGE_SIZE / 1024,
				}),
			)
		}
	})
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
			middle: () => lang.get("mailHeaders_title"),
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

export async function editDraft(viewModel: MailViewerViewModel): Promise<void> {
	const sendAllowed = await checkApprovalStatus(locator.logins, false)
	if (sendAllowed) {
		// check if to be opened draft has already been minimized, iff that is the case, re-open it
		const minimizedEditor = locator.minimizedMailModel.getEditorForDraft(viewModel.mail)

		if (minimizedEditor) {
			locator.minimizedMailModel.reopenMinimizedEditor(minimizedEditor)
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
					viewModel.getAttachments(),
					await loadMailDetails(locator.entityClient, viewModel.mail),
					viewModel.isBlockingExternalImages(),
					viewModel.getLoadedInlineImages(),
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

/** Make options for "assign" buttons (for cases for mails with restricted participants). */
export async function makeAssignMailsButtons(viewModel: MailViewerViewModel): Promise<DropdownButtonAttrs[]> {
	const assignmentGroupInfos = await viewModel.getAssignmentGroupInfos()

	return assignmentGroupInfos.map((userOrMailGroupInfo) => {
		return {
			label: () => getMailAddressDisplayText(userOrMailGroupInfo.name, neverNull(userOrMailGroupInfo.mailAddress), true),
			icon: BootIcons.Contacts,
			click: () => viewModel.assignMail(userOrMailGroupInfo),
		}
	})
}

export function mailViewerMoreActions(viewModel: MailViewerViewModel): Array<DropdownButtonAttrs> {
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

	if (!client.isMobileDevice() && typeof window.print === "function" && viewModel.canPrint()) {
		moreButtons.push({
			label: "print_action",
			click: () => window.print(),
			icon: Icons.Print,
		})
	}

	if (viewModel.isListUnsubscribe()) {
		moreButtons.push({
			label: "unsubscribe_action",
			click: () => unsubscribe(viewModel),
			icon: Icons.Cancel,
		})
	}

	if (viewModel.canShowHeaders()) {
		moreButtons.push({
			label: "showHeaders_action",
			click: () => showHeaderDialog(viewModel.getHeaders()),
			icon: Icons.ListUnordered,
		})
	}

	if (viewModel.canReport()) {
		moreButtons.push({
			label: "reportEmail_action",
			click: () => reportMail(viewModel),
			icon: Icons.Warning,
		})
	}

	if (viewModel.canPersistBlockingStatus() && viewModel.isShowingExternalContent()) {
		moreButtons.push({
			label: "disallowExternalContent_action",
			click: () => viewModel.setContentBlockingStatus(ContentBlockingStatus.Block),
			icon: Icons.Picture,
		})
	}

	if (viewModel.canPersistBlockingStatus() && viewModel.isBlockingExternalImages()) {
		moreButtons.push({
			label: "showImages_action",
			click: () => viewModel.setContentBlockingStatus(ContentBlockingStatus.Show),
			icon: Icons.Picture,
		})
	}

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
		title: lang.get("reportEmail_action"),
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
					ifAllowedTutanotaLinks(locator.logins, InfoLink.Phishing, (link) =>
						m(
							"a.mt-s",
							{
								href: link,
								target: "_blank",
							},
							lang.get("whatIsPhishing_msg"),
						),
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

export function mailViewerMargin() {
	return styles.isSingleColumnLayout() ? "mlr" : "mlr-l"
}

export function mailViewerPadding() {
	return styles.isSingleColumnLayout() ? "plr" : "plr-l"
}
