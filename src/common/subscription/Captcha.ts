import { locator } from "../api/main/CommonLocator.js"
import { RegistrationCaptchaService } from "../api/entities/sys/Services.js"
import { createRegistrationCaptchaServiceData, createRegistrationCaptchaServiceGetData } from "../api/entities/sys/TypeRefs.js"
import { deviceConfig } from "../misc/DeviceConfig.js"
import { AccessDeactivatedError, AccessExpiredError, InvalidDataError } from "../api/common/error/RestError.js"
import { Dialog, DialogType } from "../gui/base/Dialog.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar.js"
import { ButtonType } from "../gui/base/Button.js"
import { lang } from "../misc/LanguageViewModel.js"
import m, { Children } from "mithril"
import { TextField } from "../gui/base/TextField.js"
import { uint8ArrayToBase64 } from "@tutao/tutanota-utils"

/**
 * Accepts multiple formats for a time of day and always returns 12h-format with leading zeros.
 * @param captchaInput
 * @returns {string} HH:MM if parsed, null otherwise
 */
export function parseCaptchaInput(captchaInput: string): string | null {
	if (captchaInput.match(/^[0-2]?[0-9]:[0-5]?[0-9]$/)) {
		let [h, m] = captchaInput
			.trim()
			.split(":")
			.map((t) => Number(t))

		// regex correctly matches 0-59 minutes, but matches hours 0-29, so we need to make sure hours is 0-24
		if (h > 24) {
			return null
		}

		return [h % 12, m].map((a) => String(a).padStart(2, "0")).join(":")
	} else {
		return null
	}
}

/**
 * @returns the auth token for the signup if the captcha was solved or no captcha was necessary, null otherwise
 *
 * TODO:
 *  * Refactor token usage
 */
export async function runCaptchaFlow(
	mailAddress: string,
	isBusinessUse: boolean,
	isPaidSubscription: boolean,
	campaignToken: string | null,
): Promise<string | null> {
	try {
		const captchaReturn = await locator.serviceExecutor.get(
			RegistrationCaptchaService,
			createRegistrationCaptchaServiceGetData({
				token: campaignToken,
				mailAddress,
				signupToken: deviceConfig.getSignupToken(),
				businessUseSelected: isBusinessUse,
				paidSubscriptionSelected: isPaidSubscription,
			}),
		)
		if (captchaReturn.challenge) {
			try {
				return await showCaptchaDialog(captchaReturn.challenge, captchaReturn.token)
			} catch (e) {
				if (e instanceof InvalidDataError) {
					await Dialog.message("createAccountInvalidCaptcha_msg")
					return runCaptchaFlow(mailAddress, isBusinessUse, isPaidSubscription, campaignToken)
				} else if (e instanceof AccessExpiredError) {
					await Dialog.message("createAccountAccessDeactivated_msg")
					return null
				} else {
					throw e
				}
			}
		} else {
			return captchaReturn.token
		}
	} catch (e) {
		if (e instanceof AccessDeactivatedError) {
			await Dialog.message("createAccountAccessDeactivated_msg")
			return null
		} else {
			throw e
		}
	}
}

function showCaptchaDialog(challenge: Uint8Array, token: string): Promise<string | null> {
	return new Promise<string | null>((resolve, reject) => {
		let dialog: Dialog
		let captchaInput = ""

		const cancelAction = () => {
			dialog.close()
			resolve(null)
		}

		const okAction = () => {
			let parsedInput = parseCaptchaInput(captchaInput)

			// User entered an incorrectly formatted time
			if (parsedInput == null) {
				Dialog.message("captchaEnter_msg")
				return
			}

			// The user entered a correctly formatted time, but not one that our captcha will ever give out (i.e. not *0 or *5)
			const minuteOnesPlace = parsedInput[parsedInput.length - 1]
			if (minuteOnesPlace !== "0" && minuteOnesPlace !== "5") {
				Dialog.message("createAccountInvalidCaptcha_msg")
				return
			}

			dialog.close()
			locator.serviceExecutor
				.post(RegistrationCaptchaService, createRegistrationCaptchaServiceData({ token, response: parsedInput }))
				.then(() => {
					resolve(token)
				})
				.catch((e) => {
					reject(e)
				})
		}

		let actionBarAttrs: DialogHeaderBarAttrs = {
			left: [
				{
					label: "cancel_action",
					click: cancelAction,
					type: ButtonType.Secondary,
				},
			],
			right: [
				{
					label: "ok_action",
					click: okAction,
					type: ButtonType.Primary,
				},
			],
			middle: () => lang.get("captchaDisplay_label"),
		}
		const imageData = `data:image/png;base64,${uint8ArrayToBase64(challenge)}`

		dialog = new Dialog(DialogType.EditSmall, {
			view: (): Children => {
				return [
					m(DialogHeaderBar, actionBarAttrs),
					m(".plr-l.pb", [
						m("img.mt-l", {
							src: imageData,
							alt: lang.get("captchaDisplay_label"),
						}),
						m(TextField, {
							label: () => lang.get("captchaInput_label") + " (hh:mm)",
							helpLabel: () => lang.get("captchaInfo_msg"),
							value: captchaInput,
							oninput: (value) => (captchaInput = value),
						}),
					]),
				]
			},
		})
			.setCloseHandler(cancelAction)
			.show()
	})
}
