import { locator } from "../api/main/CommonLocator.js"
import { RegistrationCaptchaService, TimelockCaptchaService } from "../api/entities/sys/Services.js"
import {
	createRegistrationCaptchaServiceData,
	createRegistrationCaptchaServiceGetData,
	createTimelockCaptchaGetIn,
	TimelockCaptchaGetOut,
} from "../api/entities/sys/TypeRefs.js"
import { deviceConfig } from "../misc/DeviceConfig.js"
import { AccessDeactivatedError, AccessExpiredError, InvalidDataError } from "../api/common/error/RestError.js"
import { Dialog, DialogType } from "../gui/base/Dialog.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar.js"
import { ButtonType } from "../gui/base/Button.js"
import { lang } from "../misc/LanguageViewModel.js"
import m, { Children } from "mithril"
import { TextField } from "../gui/base/TextField.js"
import { defer, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { theme } from "../gui/theme"
import { getColorLuminance, isMonochrome } from "../gui/base/Color"

import { newPromise } from "@tutao/tutanota-utils/dist/Utils"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { PowChallengeParameters } from "./ProofOfWorkCaptchaUtils.js"

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

function trackPromiseResolved<T>(promise: Promise<T>) {
	const resolved = { state: false }
	promise.then(() => {
		resolved.state = true
	})

	return resolved
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
	powChallengeSolution: Promise<bigint>,
	// isPowChallengeSolved: boolean,
): Promise<string | null> {
	// We don't want to show the progressDialog if pow challenge is already solved.
	// To do that, we have to check if the pow challenge promise is already settled.
	// JS does not natively support this.
	// Instead, we call a wrapper function that returns a status object for us to check.
	// By default, the .then() call, will be put at the end of the microtask queue, so we need to ensure that the place where we check for the promise state
	// is called afterward. We do that, by wrapping it in an empty promise, therefore also pushing it to the end of the microtask queue.
	const resolved = trackPromiseResolved(powChallengeSolution)
	return Promise.resolve().then(async () => {
		let solution: bigint | undefined
		if (resolved.state) {
			solution = await powChallengeSolution
		} else {
			solution = await showProgressDialog("captchaChecking_msg", powChallengeSolution)
		}

		let captchaReturn
		try {
			captchaReturn = await locator.serviceExecutor.get(
				RegistrationCaptchaService,
				createRegistrationCaptchaServiceGetData({
					campaignToken: campaignToken,
					mailAddress,
					signupToken: deviceConfig.getSignupToken(),
					businessUseSelected: isBusinessUse,
					paidSubscriptionSelected: isPaidSubscription,
					timelockChallengeSolution: solution.toString(),
				}),
			)
		} catch (e) {
			if (e instanceof AccessExpiredError) {
				const powChallengeSolution = runPowChallenge(deviceConfig.getSignupToken())

				return runCaptchaFlow(mailAddress, isBusinessUse, isPaidSubscription, campaignToken, powChallengeSolution)
			} else {
				throw e
			}
		}

		try {
			if (captchaReturn.challenge) {
				try {
					return await showCaptchaDialog(captchaReturn.challenge, captchaReturn.token)
				} catch (e) {
					if (e instanceof InvalidDataError) {
						await Dialog.message("createAccountInvalidCaptcha_msg")
						return runCaptchaFlow(mailAddress, isBusinessUse, isPaidSubscription, campaignToken, powChallengeSolution)
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
	})
}

export function solvePowChallengeInWorker(serviceReturn: TimelockCaptchaGetOut) {
	const challenge: PowChallengeParameters = {
		base: BigInt(serviceReturn.base),
		difficulty: Number(serviceReturn.difficulty),
		modulus: BigInt(serviceReturn.modulus),
	}

	const { prefixWithoutFile } = window.tutao.appState
	const worker = new Worker(prefixWithoutFile + "/pow-worker.js", { type: "module" })
	const { promise, resolve, reject } = defer<bigint>()

	worker.onmessage = (msg) => {
		if (msg.data === "ready") {
			worker.postMessage(challenge)
		} else {
			resolve(msg.data)
		}
	}

	worker.onerror = (err: ErrorEvent) => {
		reject(new Error(err.message))
	}

	return promise
}

export async function runPowChallenge(signupToken: string): Promise<bigint> {
	const data = createTimelockCaptchaGetIn({ signupToken })
	const ret = await locator.serviceExecutor.get(TimelockCaptchaService, data)
	return solvePowChallengeInWorker(ret)
}

function showCaptchaDialog(challenge: Uint8Array, token: string): Promise<string | null> {
	return newPromise<string | null>((resolve, reject) => {
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
			middle: "captchaDisplay_label",
		}
		const imageData = `data:image/png;base64,${uint8ArrayToBase64(challenge)}`

		dialog = new Dialog(DialogType.EditSmall, {
			view: (): Children => {
				// The captcha is black-on-white, which will not look correct on anything where the background is not
				// white. We can use CSS filters to fix this.
				let captchaFilter = {}
				if (theme.elevated_bg != null && isMonochrome(theme.elevated_bg)) {
					captchaFilter = {
						filter: `invert(${1.0 - getColorLuminance(theme.elevated_bg)}`,
					}
				}
				return [
					m(DialogHeaderBar, actionBarAttrs),
					m(".plr-l.pb", [
						m("img.pt-ml.center-h.block", {
							src: imageData,
							alt: lang.get("captchaDisplay_label"),
							style: captchaFilter,
						}),
						m(TextField, {
							label: lang.makeTranslation("captcha_input", lang.get("captchaInput_label") + " (hh:mm)"),
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
