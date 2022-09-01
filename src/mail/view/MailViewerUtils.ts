import type {ImageHandler} from "../model/MailUtils"
import {ALLOWED_IMAGE_FORMATS, Keys, MAX_BASE64_IMAGE_SIZE} from "../../api/common/TutanotaConstants"
import {neverNull, ofClass, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {lang} from "../../misc/LanguageViewModel"
import {Dialog} from "../../gui/base/Dialog"
import {DataFile} from "../../api/common/DataFile"
import {showFileChooser} from "../../file/FileController.js"
import m from "mithril"
import {ButtonType} from "../../gui/base/Button.js"
import {progressIcon} from "../../gui/base/Icon.js"
import {checkApprovalStatus} from "../../misc/LoginUtils.js"
import {logins} from "../../api/main/LoginController.js"
import {locator} from "../../api/main/MainLocator.js"
import {UserError} from "../../api/main/UserError.js"
import {showUserError} from "../../misc/ErrorHandlerImpl.js"
import {MailViewerViewModel} from "./MailViewerViewModel.js"
import {DropdownButtonAttrs} from "../../gui/base/Dropdown.js"
import {getDisplayText} from "../model/MailUtils"
import {BootIcons} from "../../gui/base/icons/BootIcons.js"

export function insertInlineImageB64ClickHandler(ev: Event, handler: ImageHandler) {
	showFileChooser(true, ALLOWED_IMAGE_FORMATS).then(files => {
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
	let state: {state: "loading"} | {state: "loaded", headers: string | null} = {state: "loading"}

	headersPromise
		.then((headers) => {
			state = {state: "loaded", headers}
			m.redraw()
		})

	let mailHeadersDialog: Dialog
	const closeHeadersAction = () => {
		mailHeadersDialog?.close()
	}

	mailHeadersDialog = Dialog
		.largeDialog({
			right: [
				{
					label: "ok_action",
					click: closeHeadersAction,
					type: ButtonType.Secondary,
				},
			],
			middle: () => lang.get("mailHeaders_title"),
		}, {
			view: () => m(".white-space-pre.pt.pb.selectable",
				state.state === "loading"
					? m(".center", progressIcon())
					: state.headers ?? m(".center", lang.get("noEntries_msg")),
			),
		})
		.addShortcut({
			key: Keys.ESC,
			exec: closeHeadersAction,
			help: "close_alt",
		})
		.setCloseHandler(closeHeadersAction)
		.show()
}

export async function editDraft(viewModel: MailViewerViewModel): Promise<void> {
	return checkApprovalStatus(logins, false).then(sendAllowed => {
		if (sendAllowed) {
			// check if to be opened draft has already been minimized, iff that is the case, re-open it
			const minimizedEditor = locator.minimizedMailModel.getEditorForDraft(viewModel.mail)

			if (minimizedEditor) {
				locator.minimizedMailModel.reopenMinimizedEditor(minimizedEditor)
			} else {
				return Promise.all([viewModel.mailModel.getMailboxDetailsForMail(viewModel.mail), import("../editor/MailEditor")])
							  .then(([mailboxDetails, {newMailEditorFromDraft}]) => {
								  return newMailEditorFromDraft(
									  viewModel.mail,
									  viewModel.getAttachments(),
									  viewModel.getMailBody(),
									  viewModel.isBlockingExternalImages(),
									  viewModel.getLoadedInlineImages(),
									  mailboxDetails,
								  )
							  })
							  .then(editorDialog => {
								  editorDialog.show()
							  })
							  .catch(ofClass(UserError, showUserError))
			}
		}
	})
}

/** Make options for "assign" buttons (for cases for mails with restricted participants). */
export async function makeAssignMailsButtons(viewModel: MailViewerViewModel): Promise<DropdownButtonAttrs[]> {
	const assignmentGroupInfos = await viewModel.getAssignmentGroupInfos()

	return assignmentGroupInfos.map(userOrMailGroupInfo => {
		return {
			label: () => getDisplayText(userOrMailGroupInfo.name, neverNull(userOrMailGroupInfo.mailAddress), true),
			icon: BootIcons.Contacts,
			click: () => viewModel.assignMail(userOrMailGroupInfo),
		}
	})
}