import type { QRCode } from "jsqr"
import { InfoLink, lang, TranslationKey } from "../../misc/LanguageViewModel.js"
import { Dialog, DialogType } from "../../gui/base/Dialog.js"
import { assertNotNull, Hex, newPromise, noOp, ofClass } from "@tutao/tutanota-utils"
import m, { Child, Children, Component, Vnode } from "mithril"
import { assertMainOrNode, isApp } from "../../api/common/Env.js"
import { copyToClipboard } from "../../misc/ClipboardUtils.js"
import { AccessBlockedError, NotAuthenticatedError } from "../../api/common/error/RestError.js"
import { locator } from "../../api/main/CommonLocator.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { User } from "../../api/entities/sys/TypeRefs.js"
import { getEtId, isSameId } from "../../api/common/utils/EntityUtils.js"
import { GroupType } from "../../api/common/TutanotaConstants.js"
import { LoginButton } from "../../gui/base/buttons/LoginButton.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { QrCodeScanner, QrCodeScannerErrorType } from "../../gui/QrCodeScanner.js"
import { HtmlEditor, HtmlEditorMode } from "../../gui/editor/HtmlEditor.js"
import { MoreInfoLink } from "../../misc/news/MoreInfoLink.js"
import { showRequestPasswordDialog } from "../../misc/passwords/PasswordRequestDialog.js"
import { MonospaceTextDisplay } from "../../gui/base/MonospaceTextDisplay"
import { getCleanedMailAddress } from "../../misc/parsing/MailAddressParser"
import { BootIcons } from "../../gui/base/icons/BootIcons"

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
		child: () => m(".pt-16", lang.get("recoveryCode_msg")),
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
							m(".flex-grow-shrink-half.plr-24.flex-center.align-self-center", this.renderRecoveryText()),
							m(
								".flex-grow-shrink-half.plr-24.flex-center.align-self-center",
								m("img.pt-16.bg-white.pt-16.pb-16", {
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
				? m(".flex.flex-end.mt-12", [
						m(IconButton, {
							title: "copy_action",
							icon: Icons.Clipboard,
							click: () => copyToClipboard(splitRecoverCode),
						}),
						isApp() || typeof window.print !== "function"
							? null
							: m(IconButton, {
									title: "print_action",
									icon: Icons.Print,
									click: () => window.print(),
								}),
					])
				: null,
		]
	}

	private renderRecoveryText(): Child {
		const link = InfoLink.RecoverCode
		return m(".pt-16.pb-16", [lang.get("recoveryCode_msg"), m("", [m(MoreInfoLink, { link, isSmall: true })])])
	}
}

export type RecoverCodeQrPayload = {
	mailAddress?: string
	recoveryCode: string
}

export type RecoverCodeInputAttrs = {
	onQrPayload?: (payload: RecoverCodeQrPayload) => void
}

function parseRecoverCodeQrPayload(data: string): RecoverCodeQrPayload {
	const trimmed = data.trim()

	try {
		const payload = JSON.parse(trimmed) as { mailAddress?: unknown; recoveryCode?: unknown }
		if (payload && typeof payload === "object") {
			const recoveryCode = typeof payload.recoveryCode === "string" ? payload.recoveryCode.trim() : ""
			const cleanedMailAddress = typeof payload.mailAddress === "string" ? (getCleanedMailAddress(payload.mailAddress) ?? undefined) : undefined

			if (recoveryCode) {
				return { recoveryCode, mailAddress: cleanedMailAddress }
			}

			if (cleanedMailAddress) {
				return { recoveryCode: trimmed, mailAddress: cleanedMailAddress }
			}
		}
	} catch {}

	return { recoveryCode: trimmed }
}

export class RecoverCodeInput implements Component<RecoverCodeInputAttrs> {
	private readonly editor: HtmlEditor
	private isScanning = false

	constructor() {
		this.editor = new HtmlEditor("recoveryCode_label")
		this.editor.setMode(HtmlEditorMode.HTML)
		this.editor.setHtmlMonospace(true)
		this.editor.setMinHeight(80)
		this.editor.showBorders()
	}

	view(vnode: Vnode<RecoverCodeInputAttrs>): Children {
		return [
			this.isScanning
				? m(QrCodeScanner, {
						onScan: (code) => this.handleScan(code, vnode.attrs),
						onError: (error) => this.handleScanError(error),
					})
				: m(this.editor),
			m(
				".mt-8",
				m(LoginButton, {
					label: this.isScanning ? "cancel_action" : "keyManagement.qrCode_label",
					icon: this.isScanning ? Icons.Close : BootIcons.QRCodeOutline,
					onclick: () => {
						this.isScanning = !this.isScanning
					},
				}),
			),
		]
	}

	getValue(): string {
		return this.editor.getValue()
	}

	setValue(value: string) {
		this.editor.setValue(value)
	}

	private async handleScan(code: QRCode, attrs: RecoverCodeInputAttrs) {
		const payload = parseRecoverCodeQrPayload(code.data)
		this.editor.setValue(payload.recoveryCode)
		attrs.onQrPayload?.(payload)
		this.isScanning = false
		m.redraw()
	}

	private handleScanError(errorType: QrCodeScannerErrorType) {
		switch (errorType) {
			case "camera_permission_denied":
				Dialog.message("keyManagement.cameraPermissionNeeded_msg")
				break
			case "camera_not_found":
				Dialog.message("keyManagement.cameraNotFound_msg")
				break
			case "video_source_error":
				Dialog.message("keyManagement.videoSourceError_msg")
				break
			default:
				Dialog.message("unknownError_msg")
		}
		this.isScanning = false
		m.redraw()
	}
}
