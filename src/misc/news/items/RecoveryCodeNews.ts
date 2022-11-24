import {NewsListItem} from "../NewsListItem.js"
import m, {Children} from "mithril"
import {NewsId} from "../../../api/entities/tutanota/TypeRefs.js"
import {lang} from "../../LanguageViewModel.js"
import {Button, ButtonAttrs, ButtonType} from "../../../gui/base/Button.js"
import {NewsModel} from "../NewsModel.js"
import {RecoverCodeField} from "../../../settings/RecoverCodeDialog.js"
import {locator} from "../../../api/main/MainLocator.js"
import {Dialog, DialogType} from "../../../gui/base/Dialog.js"
import {AccessBlockedError, NotAuthenticatedError} from "../../../api/common/error/RestError.js"
import {assertNotNull, noOp, ofClass} from "@tutao/tutanota-utils"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import {capitalize} from "../../../../packages/licc/lib/common.js"
import {copyToClipboard} from "../../ClipboardUtils.js"
import {UserController} from "../../../api/main/UserController.js"

/**
 * News item that informs admin users about their recovery code.
 */
export class RecoveryCodeNews implements NewsListItem {
	constructor(
		private readonly newsModel: NewsModel,
		private readonly userController: UserController,
		private readonly recoveryCode: Stream<string | null> = stream(null),
	) {
	}

	isShown(): boolean {
		return this.userController.isGlobalAdmin()
	}

	render(newsId: NewsId): Children {
		const buttonAttrs: Array<ButtonAttrs> = []

		if (this.recoveryCode()) {
			buttonAttrs.push({
				label: "copy_action",
				type: ButtonType.Secondary,
				click: () => copyToClipboard(assertNotNull(this.recoveryCode())),
			}, {
				label: "print_action",
				type: ButtonType.Secondary,
				click: () => window.print(),
			})
		} else {
			buttonAttrs.push({
				label: "done_action",
				type: ButtonType.Secondary,
				click: () => Dialog.showActionDialog({
					type: DialogType.EditSmall,
					okAction: dialog => {
						dialog.close()
						this.newsModel.acknowledgeNews(newsId.newsItemId)
							.then(m.redraw)
					},
					title: lang.get("recoveryCode_label"),
					allowCancel: true,
					child: () => {
						return m("p", lang.get("recoveryCodeConfirmation_msg"))
					}
				}),
			})
		}

		buttonAttrs.push({
			label: this.recoveryCode() ? "paymentDataValidation_action" : "recoveryCodeDisplay_action",
			click: () => {
				if (!this.recoveryCode()) {
					getRecoverCodeDialogAfterPasswordVerification(this.userController, true, this.recoveryCode)
					m.redraw()
					return
				}

				this.newsModel.acknowledgeNews(newsId.newsItemId)
					.then(m.redraw)
			},
			type: ButtonType.Primary,
		})

		return m(".full-width", [
			m(".h4", lang.get("recoveryCode_label").split(" ").map(capitalize).join(" ")),
			m("", lang.get("recoveryCode_msg")),
			this.recoveryCode()
				? m(RecoverCodeField, {
					showMessage: false,
					recoverCode: this.recoveryCode() as string,
					showButtons: false,
				})
				: null,
			m(
				".flex-end.flex-no-grow-no-shrink-auto.flex-wrap",
				buttonAttrs.map(a => m(Button, a)),
			),
		])

	}

}


function getRecoverCodeDialogAfterPasswordVerification(userController: UserController, showMessage: boolean = true, recoveryCode: Stream<string | null>) {
	const userManagementFacade = locator.userManagementFacade
	const dialog = Dialog.showRequestPasswordDialog({
		action: (pw) => {
			const hasRecoveryCode = !!userController.user.auth?.recoverCode

			return (hasRecoveryCode ? userManagementFacade.getRecoverCode(pw) : userManagementFacade.createRecoveryCode(pw))
				.then(recoverCode => {
					dialog.close()
					recoveryCode(recoverCode)
					return ""
				})
				.catch(ofClass(NotAuthenticatedError, () => lang.get("invalidPassword_msg")))
				.catch(ofClass(AccessBlockedError, () => lang.get("tooManyAttempts_msg")))
		},
		cancel: {
			textId: "cancel_action",
			action: noOp,
		}
	})
}