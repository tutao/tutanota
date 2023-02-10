import { NewsListItem } from "../NewsListItem.js"
import m, { Children } from "mithril"
import { NewsId } from "../../../api/entities/tutanota/TypeRefs.js"
import { lang } from "../../LanguageViewModel.js"
import { Button, ButtonType } from "../../../gui/base/Button.js"
import { NewsModel } from "../NewsModel.js"
import type { RecoverCodeField } from "../../../settings/login/RecoverCodeDialog.js"
import { Dialog, DialogType } from "../../../gui/base/Dialog.js"
import { AccessBlockedError, NotAuthenticatedError } from "../../../api/common/error/RestError.js"
import { LazyLoaded, noOp, ofClass } from "@tutao/tutanota-utils"
import { copyToClipboard } from "../../ClipboardUtils.js"
import { UsageTestModel } from "../../UsageTestModel.js"
import { UsageTestController } from "@tutao/tutanota-usagetests"
import { UserController } from "../../../api/main/UserController.js"
import { progressIcon } from "../../../gui/base/Icon.js"
import { UserManagementFacade } from "../../../api/worker/facades/lazy/UserManagementFacade.js"
import { isApp } from "../../../api/common/Env.js"

/** Actions that may be sent in stage 2 of the recoveryCodeDialog usage test. */
type RecoveryCodeNewsAction = "copy" | "print" | "select" | "dismiss" | "close"

/**
 * News item that informs admin users about their recovery code.
 */
export class RecoveryCodeNews implements NewsListItem {
	/** Tracks actions that have been sent to the server as pings. */
	private readonly sentActions = new Set<string>()
	private recoveryCode: string | null = null
	private readonly recoverCodeField = new LazyLoaded(async () => {
		const { RecoverCodeField } = await import("../../../settings/login/RecoverCodeDialog.js")
		m.redraw()
		return RecoverCodeField
	})

	constructor(
		private readonly newsModel: NewsModel,
		private readonly userController: UserController,
		private readonly usageTestModel: UsageTestModel,
		private readonly usageTestController: UsageTestController,
		private readonly userManagementFacade: UserManagementFacade,
	) {}

	isShown(): boolean {
		return this.userController.isGlobalAdmin()
	}

	/**
	 * Sends the passed action to the server as a ping.
	 * Ensures that the same action is never sent twice.
	 */
	private sendAction(action: RecoveryCodeNewsAction) {
		if (!this.sentActions.has(action)) {
			const stage = this.usageTestController.getTest("recoveryCodeDialog").getStage(2)
			stage?.setMetric({
				name: "action",
				value: action,
			})
			stage?.complete()
			this.sentActions.add(action)
		}
	}

	render(newsId: NewsId): Children {
		const recoveryCode = this.recoveryCode
		// toggle the load if it's not started yet
		this.recoverCodeField.getAsync()

		// Will (always) be null on the first call of render() since getAsync() was just called for the first time.
		// When the redraw is triggered in the load function, it will be populated and rendered correctly.
		const RecoverCodeField = this.recoverCodeField.getSync()

		return m(
			".full-width",
			{
				onmouseup: () => {
					let selection = window.getSelection()?.toString()

					if (!recoveryCode || !selection || selection.length === 0) {
						return
					}

					selection = selection.replace(/\s/g, "") // remove whitespace

					if (selection.includes(recoveryCode)) {
						this.sendAction("select")
					}
				},
			},
			[
				m(
					".h4",
					{
						style: {
							"text-transform": "capitalize",
						},
					},
					lang.get("recoveryCode_label"),
				),
				m("", lang.get("recoveryCode_msg")),
				recoveryCode
					? RecoverCodeField
						? m(RecoverCodeField, {
								showMessage: false,
								recoverCode: recoveryCode as string,
								showButtons: false,
						  })
						: m(".flex.justify-center", progressIcon())
					: null,
				m(".flex-end.flex-no-grow-no-shrink-auto.flex-wrap", [
					recoveryCode
						? [this.renderCopyButton(recoveryCode), this.renderPrintButton(), this.confirmButton(newsId)]
						: [this.renderDoneButton(newsId), this.renderDisplayButton()],
				]),
			],
		)
	}

	private renderDoneButton(newsId: NewsId) {
		return m(Button, {
			label: "done_action",
			type: ButtonType.Secondary,
			click: () =>
				Dialog.showActionDialog({
					type: DialogType.EditSmall,
					okAction: async (dialog) => {
						const test = this.usageTestController.getTest("recoveryCodeDialog")
						await test.getStage(0).complete()
						await test.getStage(1).complete()
						this.sendAction("dismiss")

						dialog.close()
						this.newsModel.acknowledgeNews(newsId.newsItemId).then(m.redraw)
					},
					title: lang.get("recoveryCode_label"),
					allowCancel: true,
					child: () => m("p", lang.get("recoveryCodeConfirmation_msg")),
				}),
		})
	}

	private renderPrintButton(): Children {
		if (isApp() || typeof window.print !== "function") {
			return null
		}

		return m(Button, {
			label: "print_action",
			type: ButtonType.Secondary,
			click: () => {
				this.sendAction("print")

				window.print()
			},
		})
	}

	private renderCopyButton(recoveryCode: string): Children {
		return m(Button, {
			label: "copy_action",
			type: ButtonType.Secondary,
			click: () => {
				this.sendAction("copy")

				copyToClipboard(recoveryCode)
			},
		})
	}

	private renderDisplayButton(): Children {
		return m(Button, {
			label: "recoveryCodeDisplay_action",
			click: async () => {
				const test = this.usageTestController.getTest("recoveryCodeDialog")
				await test.getStage(0).complete()
				await test.getStage(1).complete()
				this.getRecoverCodeDialogAfterPasswordVerification(this.userController)
			},
			type: ButtonType.Primary,
		})
	}

	private confirmButton(newsId: NewsId): Children {
		return m(Button, {
			label: "paymentDataValidation_action",
			click: async () => {
				await this.newsModel.acknowledgeNews(newsId.newsItemId)
				m.redraw()
			},
			type: ButtonType.Primary,
		})
	}

	private getRecoverCodeDialogAfterPasswordVerification(userController: UserController) {
		const dialog = Dialog.showRequestPasswordDialog({
			action: (pw) => {
				const hasRecoveryCode = !!userController.user.auth?.recoverCode

				return (hasRecoveryCode ? this.userManagementFacade.getRecoverCode(pw) : this.userManagementFacade.createRecoveryCode(pw))
					.then((recoverCode) => {
						dialog.close()
						this.recoveryCode = recoverCode
						return ""
					})
					.catch(ofClass(NotAuthenticatedError, () => lang.get("invalidPassword_msg")))
					.catch(ofClass(AccessBlockedError, () => lang.get("tooManyAttempts_msg")))
					.finally(m.redraw)
			},
			cancel: {
				textId: "cancel_action",
				action: noOp,
			},
		})
	}
}
