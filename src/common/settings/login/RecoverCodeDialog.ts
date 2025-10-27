import { InfoLink, lang, TranslationKey } from "../../misc/LanguageViewModel.js"
import { Dialog, DialogType } from "../../gui/base/Dialog.js"
import { assertNotNull, Hex, newPromise, noOp, ofClass } from "@tutao/tutanota-utils"
import m, { Child, Children, Vnode } from "mithril"
import { assertMainOrNode, isApp } from "../../api/common/Env.js"
import { copyToClipboard } from "../../misc/ClipboardUtils.js"
import { AccessBlockedError, NotAuthenticatedError } from "../../api/common/error/RestError.js"
import { locator } from "../../api/main/CommonLocator.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { User } from "../../api/entities/sys/TypeRefs.js"
import { getEtId, isSameId } from "../../api/common/utils/EntityUtils.js"
import { GroupType } from "../../api/common/TutanotaConstants.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { MoreInfoLink } from "../../misc/news/MoreInfoLink.js"
import { showRequestPasswordDialog } from "../../misc/passwords/PasswordRequestDialog.js"
import { MonospaceTextDisplay } from "../../gui/base/MonospaceTextDisplay"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"

type Action = "get" | "create"
assertMainOrNode()

export function showRecoverCodeDialogAfterPasswordVerificationAndInfoDialog(user: User) {
	// We only show the recovery code if it is for the current user and it is a global admin
	if (!isSameId(getEtId(locator.logins.getUserController().user), getEtId(user)) || !user.memberships.some((gm) => gm.groupType === GroupType.Admin)) {
		return
	}

	const isRecoverCodeAvailable = user.auth && user.auth.recoverCode != null
	Dialog.showActionDialog({
		title: "recoveryCode_label",
		type: DialogType.EditMedium,
		child: () => m(".pt", lang.get("recoveryCode_msg")),
		allowOkWithReturn: true,
		okAction: (dialog: Dialog) => {
			dialog.close()
			showRecoverCodeDialogAfterPasswordVerification(isRecoverCodeAvailable ? "get" : "create", false)
		},
		okActionTextId: isRecoverCodeAvailable ? "show_action" : "setUp_action",
	})
}

export function showRecoverCodeDialogAfterPasswordVerification(action: Action, showMessage: boolean = true) {
	const recoverCodeFacade = locator.recoverCodeFacade
	const dialog = showRequestPasswordDialog({
		action: (pw) => {
			return (action === "get" ? recoverCodeFacade.getRecoverCodeHex(pw) : recoverCodeFacade.createRecoveryCode(pw))
				.then((recoverCode) => {
					dialog.close()
					showRecoverCodeDialog(recoverCode, showMessage)
					return ""
				})
				.catch(ofClass(NotAuthenticatedError, () => lang.get("invalidPassword_msg")))
				.catch(ofClass(AccessBlockedError, () => lang.get("tooManyAttempts_msg")))
		},
		cancel: {
			textId: "cancel_action",
			action: noOp,
		},
	})
}

export function showRecoverCodeDialog(recoverCode: Hex, showMessage: boolean): Promise<void> {
	return newPromise((resolve) => {
		Dialog.showActionDialog({
			title: "recoveryCode_label",
			child: {
				view: () => {
					return m(RecoverCodeField, {
						showMessage,
						recoverCode,
					})
				},
			},
			allowCancel: false,
			allowOkWithReturn: true,
			okAction: (dialog: Dialog) => {
				dialog.close()
				resolve()
			},
			type: DialogType.EditMedium,
		})
	})
}

export type RecoverCodeFieldAttrs = {
	showMessage: boolean
	recoverCode: Hex
	showButtons?: boolean
	image?: {
		src: string
		alt: TranslationKey
	}
}

export class RecoverCodeField {
	view(vnode: Vnode<RecoverCodeFieldAttrs>): Children {
		let { recoverCode, showButtons, showMessage, image } = vnode.attrs
		showButtons = showButtons ?? true

		const splitRecoverCode = assertNotNull(recoverCode.match(/.{4}/g)).join(" ")
		return [
			showMessage
				? image
					? m(".flex-space-around.flex-wrap", [
							m(".flex-grow-shrink-half.plr-l.flex-center.align-self-center", this.renderRecoveryText()),
							m(
								".flex-grow-shrink-half.plr-l.flex-center.align-self-center",
								m("img.pt.bg-white.pt.pb", {
									src: image.src,
									alt: lang.getTranslationText(image.alt),
									style: {
										width: "200px",
									},
								}),
							),
						])
					: this.renderRecoveryText()
				: m("", lang.get("emptyString_msg")),
			m(MonospaceTextDisplay, { text: splitRecoverCode }),
			showButtons
				? m(".flex.flex-end.mt-m", [
						m(IconButton, {
							title: "copy_action",
							icon: Icons.Clipboard,
							click: () => copyToClipboard(splitRecoverCode),
						}),
						isApp() || typeof window.print !== "function"
							? null
							: m(IconButton, {
									title: "print_action",
									icon: Icons.Download,
									click: () => this.saveRecoveryCodeAsPdf(splitRecoverCode),
								}),
					])
				: null,
		]
	}

	private saveRecoveryCodeAsPdf(recoveryCode: string) {
		showProgressDialog(
			"pleaseWait_msg",
			locator.customerFacade.generatePdfRecoveryDocument(recoveryCode).then((pdfInvoice) => locator.fileController.saveDataFile(pdfInvoice)),
		)
	}

	private renderRecoveryText(): Child {
		const link = InfoLink.RecoverCode
		return m(".pt.pb", [lang.get("recoveryCode_msg"), m("", [m(MoreInfoLink, { link, isSmall: true })])])
	}
}
