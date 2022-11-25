import {NewsListItem} from "../NewsListItem.js"
import m, {Children} from "mithril"
import {NewsId} from "../../../api/entities/tutanota/TypeRefs.js"
import {lang} from "../../LanguageViewModel.js"
import {Button, ButtonAttrs, ButtonType} from "../../../gui/base/Button.js"
import {NewsModel} from "../NewsModel.js"
import type {RecoverCodeField} from "../../../settings/RecoverCodeDialog.js"
import {locator} from "../../../api/main/MainLocator.js"
import {Dialog, DialogType} from "../../../gui/base/Dialog.js"
import {AccessBlockedError, NotAuthenticatedError} from "../../../api/common/error/RestError.js"
import {assertNotNull, noOp, ofClass} from "@tutao/tutanota-utils"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import {copyToClipboard} from "../../ClipboardUtils.js"
import {UsageTestModel} from "../../UsageTestModel.js"
import {UsageTest, UsageTestController} from "@tutao/tutanota-usagetests"
import {UserController} from "../../../api/main/UserController.js"
import {progressIcon} from "../../../gui/base/Icon.js"

/** Actions that may be sent in stage 2 of the recoveryCodeDialog usage test. */
type RecoveryCodeNewsAction = "copy" | "print" | "select" | "dismiss" | "close"

/**
 * News item that informs admin users about their recovery code.
 */
export class RecoveryCodeNews implements NewsListItem {
	private readonly recoveryCodeDialogUsageTest?: UsageTest
	// Dynamically imported
	private RecoverCodeField: Class<RecoverCodeField> | null = null

	constructor(
		private readonly newsModel: NewsModel,
		private readonly userController: UserController,
		private readonly usageTestModel: UsageTestModel,
		private readonly usageTestController: UsageTestController,
		private readonly recoveryCode: Stream<string | null> = stream(null),
		/** Tracks actions that have been sent to the server as pings. */
		private readonly sentActions = new Set<string>()
	) {
		this.recoveryCodeDialogUsageTest = usageTestController.getTest("recoveryCodeDialog")
	}

	isShown(): boolean {
		return this.userController.isGlobalAdmin()
	}

	/**
	 * Sends the passed action to the server as a ping.
	 * Ensures that the same action is never sent twice.
	 */
	private sendAction(action: RecoveryCodeNewsAction) {
		if (!this.sentActions.has(action)) {
			const stage = this.recoveryCodeDialogUsageTest?.getStage(2)
			stage?.setMetric({
				name: "action",
				value: action,
			})
			stage?.complete()
			this.sentActions.add(action)
		}
	}

	render(newsId: NewsId): Children {
		const buttonAttrs: Array<ButtonAttrs> = []

		if (this.recoveryCode()) {
			buttonAttrs.push({
				label: "copy_action",
				type: ButtonType.Secondary,
				click: () => {
					this.sendAction("copy")

					copyToClipboard(assertNotNull(this.recoveryCode()))
				},
			}, {
				label: "print_action",
				type: ButtonType.Secondary,
				click: () => {
					this.sendAction("print")

					window.print()
				},
			})
		} else {
			buttonAttrs.push({
				label: "done_action",
				type: ButtonType.Secondary,
				click: () => Dialog.showActionDialog({
					type: DialogType.EditSmall,
					okAction: async dialog => {
						await this.recoveryCodeDialogUsageTest?.getStage(0).complete()
						await this.recoveryCodeDialogUsageTest?.getStage(1).complete()
						this.sendAction("dismiss")

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
			click: async () => {
				if (!this.recoveryCode()) {
					await this.recoveryCodeDialogUsageTest?.getStage(0).complete()
					await this.recoveryCodeDialogUsageTest?.getStage(1).complete()
					getRecoverCodeDialogAfterPasswordVerification(this.userController, true, this.recoveryCode)
					m.redraw()
					return
				}

				await this.newsModel.acknowledgeNews(newsId.newsItemId)
				m.redraw()
			},
			type: ButtonType.Primary,
		})

		return m(".full-width", {
			oninit: () => {
				import("../../../settings/RecoverCodeDialog.js").then(({RecoverCodeField}) => {
					this.RecoverCodeField = RecoverCodeField
					m.redraw()
				})
			},
			onmouseup: () => {
				let selection = window.getSelection()?.toString()

				if (!this.recoveryCode() || !selection || selection.length === 0) {
					return
				}

				const recoveryCode = assertNotNull(this.recoveryCode())
				selection = selection.replace(/\s/g, '') // remove whitespace

				if (selection.includes(recoveryCode)) {
					this.sendAction("select")
				}
			}
		}, [
			m(".h4", {
				style: {
					"text-transform": "capitalize",
				}
			}, lang.get("recoveryCode_label")),
			m("", lang.get("recoveryCode_msg")),
			this.recoveryCode()
				? this.RecoverCodeField
					? m(this.RecoverCodeField, {
						showMessage: false,
						recoverCode: this.recoveryCode() as string,
						showButtons: false,
					})
					: m(".flex.justify-center", progressIcon())
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