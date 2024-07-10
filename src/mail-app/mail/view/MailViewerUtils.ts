import { ALLOWED_IMAGE_FORMATS, Keys, MailReportType, MAX_BASE64_IMAGE_SIZE } from "../../../common/api/common/TutanotaConstants"
import { ofClass, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { InfoLink, lang } from "../../../common/misc/LanguageViewModel"
import { Dialog } from "../../../common/gui/base/Dialog"
import { DataFile } from "../../../common/api/common/DataFile"
import { showFileChooser } from "../../../common/file/FileController.js"
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
import { ImageHandler, loadMailDetails } from "../../../common/mailFunctionality/CommonMailUtils.js"
import { mailLocator } from "../../mailLocator.js"

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
					viewModel.getAttachments(),
					await loadMailDetails(locator.mailFacade, locator.entityClient, viewModel.mail),
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

export async function showSourceDialog(rawHtml: string) {
	return Dialog.viewerDialog("emailSourceCode_title", SourceCodeViewer, { rawHtml })
}

export function mailViewerMoreActions(viewModel: MailViewerViewModel, showReadButton: boolean = true): Array<DropdownButtonAttrs> {
	const moreButtons: Array<DropdownButtonAttrs> = []
	if (showReadButton) {
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

	if (viewModel.isListUnsubscribe()) {
		moreButtons.push({
			label: "unsubscribe_action",
			click: () => unsubscribe(viewModel),
			icon: Icons.Cancel,
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
