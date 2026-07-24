import m from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { AccessBlockedError, AccessDeactivatedError, NotAuthenticatedError, TooManyRequestsError } from "@tutao/rest-client/error"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { isMailAddress } from "../../../../platform-kit/utils/FormatUtils.js"
import { Autocomplete, LegacyTextField, LegacyTextFieldType } from "../../../../ui/base/LegacyTextField.js"
import { InfoLink, lang } from "../../../../ui/utils/LanguageViewModel.js"
import { PasswordForm, PasswordModel } from "../../settings/PasswordForm.js"
import { Icons } from "../../../../ui/base/icons/Icons"
import { Dialog, DialogType } from "../../../../ui/base/Dialog"
import { ClientDetector } from "../../../../platform-kit/app-env/boot/ClientDetector.js"
import { assertMainOrNode, CancelledError } from "@tutao/app-env"
import { locator } from "../../api/main/CommonLocator"
import { windowFacade } from "../../misc/WindowFacade.js"
import { createDropdown, DropdownButtonAttrs } from "../../../../ui/base/Dropdown.js"
import { IconButton, IconButtonAttrs } from "../../../../ui/base/IconButton.js"
import { ButtonSize } from "../../../../ui/base/ButtonSize.js"
import { PasswordField } from "../../misc/passwords/PasswordField.js"
import { RecoverCodeInput } from "../../settings/login/RecoverCodeDialog.js"
import { MoreInfoLink } from "../../misc/news/MoreInfoLink"

assertMainOrNode()
export type ResetAction = "password" | "secondFactor"

export function show(mailAddress?: string | null, resetAction?: ResetAction): Dialog {
	const selectedAction: Stream<ResetAction | null> = stream(resetAction ?? null)
	const passwordModel = new PasswordModel(locator.usageTestController, locator.logins, { checkOldPassword: false, enforceStrength: true })
	const passwordValueStream = stream("")
	const emailAddressStream = stream(mailAddress || "")
	const resetPasswordAction: DropdownButtonAttrs = {
		label: "recoverSetNewPassword_action",
		click: () => selectedAction("password"),
	}
	const resetSecondFactorAction: DropdownButtonAttrs = {
		label: "recoverResetFactors_action",
		click: () => selectedAction("secondFactor"),
	}
	const resetActionClickHandler = createDropdown({
		lazyButtons: () => [resetPasswordAction, resetSecondFactorAction],
		width: 300,
	})
	const resetActionButtonAttrs: IconButtonAttrs = {
		title: "action_label",
		click: resetActionClickHandler,
		icon: Icons.PenFilled,
		size: ButtonSize.Compact,
	}
	const selectedValueLabelStream = selectedAction.map((v) => {
		if (v === "password") {
			return lang.get("recoverSetNewPassword_action")
		} else if (v === "secondFactor") {
			return lang.get("recoverResetFactors_action")
		} else {
			return lang.get("choose_label")
		}
	})
	const recoverCodeInput = new RecoverCodeInput()
	const recoverDialog = Dialog.showActionDialog({
		title: "recover_label",
		type: DialogType.EditSmall,
		child: {
			view: () => {
				return [
					m(LegacyTextField, {
						label: "mailAddress_label",
						value: emailAddressStream(),
						autocompleteAs: Autocomplete.email,
						type: LegacyTextFieldType.Email,
						oninput: emailAddressStream,
					}),
					m(recoverCodeInput, {
						onQrPayload: (payload) => {
							if (payload.mailAddress) {
								emailAddressStream(payload.mailAddress)
							}
						},
					}),
					m(LegacyTextField, {
						label: "action_label",
						value: selectedValueLabelStream(),
						oninput: selectedValueLabelStream,
						injectionsRight: () => m(IconButton, resetActionButtonAttrs),
						isReadOnly: true,
					}),
					selectedAction() == null
						? null
						: selectedAction() === "password"
							? m(PasswordForm, { model: passwordModel })
							: m(PasswordField, {
									value: passwordValueStream(),
									autocompleteAs: Autocomplete.currentPassword,
									oninput: passwordValueStream,
								}),
				]
			},
		},
		okAction: async () => {
			const cleanMailAddress = emailAddressStream().trim().toLowerCase()
			const cleanRecoverCodeValue = recoverCodeInput.getValue().replace(/\s/g, "").toLowerCase()

			if (!isMailAddress(cleanMailAddress, true)) {
				Dialog.message("mailAddressInvalid_msg")
			} else if (cleanRecoverCodeValue === "") {
				Dialog.message("recoveryCodeEmpty_msg")
			} else if (selectedAction() === "password") {
				const errorMessageId = passwordModel.getErrorMessageId()

				if (errorMessageId) {
					Dialog.message(errorMessageId)
				} else {
					showProgressDialog(
						"pleaseWait_msg",
						locator.loginFacade.recoverLogin(
							cleanMailAddress,
							cleanRecoverCodeValue,
							passwordModel.getNewPassword(),
							ClientDetector.get().getIdentifier(),
						),
					)
						.then(async () => {
							recoverDialog.close()
							await deleteCredentialsByMailAddress(cleanMailAddress)
							windowFacade.reload({})
						})
						.catch((e) => handleError(e))
						.finally(() => locator.secondFactorHandler.closeWaitingForSecondFactorDialog())
				}
			} else if (selectedAction() === "secondFactor") {
				const passwordValue = passwordValueStream()
				showProgressDialog("pleaseWait_msg", locator.loginFacade.resetSecondFactors(cleanMailAddress, passwordValue, cleanRecoverCodeValue))
					.then(async () => {
						recoverDialog.close()
						await deleteCredentialsByMailAddress(cleanMailAddress)
						windowFacade.reload({})
					})
					.catch((e) => handleError(e))
			}
		},
		cancelAction: () =>
			m.route.set("/login", {
				noAutoLogin: true,
			}),
	})
	return recoverDialog
}

async function deleteCredentialsByMailAddress(cleanMailAddress: string) {
	const allCredentials = await locator.credentialsProvider.getInternalCredentialsInfos()
	const credentials = allCredentials.find((c) => c.login === cleanMailAddress)

	if (credentials) {
		await locator.credentialsProvider.deleteByUserId(credentials.userId)
	}
}

function handleError(e: Error) {
	if (e instanceof NotAuthenticatedError) {
		Dialog.message("loginFailed_msg")
	} else if (e instanceof AccessBlockedError || e instanceof AccessDeactivatedError) {
		Dialog.message("loginFailedOften_msg")
	} else if (e instanceof CancelledError) {
		// Thrown when second factor dialog is cancelled
		m.redraw()
	} else if (e instanceof TooManyRequestsError) {
		Dialog.message("tooManyAttempts_msg")
	} else if (e.message.toLowerCase().includes("illegal key length")) {
		// this error message comes from getAndVerifyAesKeyLength
		Dialog.message("incorrectRecoveryCodeFormat_msg", () => m(MoreInfoLink, { link: InfoLink.RecoveryCodeFormat }))
	} else {
		throw e
	}
}
