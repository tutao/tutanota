import { locator } from "../../api/main/CommonLocator.js"
import { RegistrationCaptchaService, TimelockCaptchaService } from "../../api/entities/sys/Services.js"
import { createRegistrationCaptchaServiceGetData, createTimelockCaptchaGetIn, TimelockCaptchaGetOut } from "../../api/entities/sys/TypeRefs.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import { AccessDeactivatedError, AccessExpiredError, InvalidDataError } from "../../api/common/error/RestError.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { defer } from "@tutao/tutanota-utils"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { PowChallengeParameters } from "../ProofOfWorkCaptchaUtils.js"
import { showCaptchaDialog } from "./CaptchaDialog.js"
import { lang } from "../../misc/LanguageViewModel.js"

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
					language: lang.languageTag,
				}),
			)
		} catch (e) {
			if (e instanceof AccessExpiredError) {
				const powChallengeSolution = runPowChallenge(deviceConfig.getSignupToken())
				return runCaptchaFlow(mailAddress, isBusinessUse, isPaidSubscription, campaignToken, powChallengeSolution)
			}
			if (e instanceof AccessDeactivatedError) {
				await Dialog.message("createAccountAccessDeactivated_msg")
				return null
			} else {
				throw e
			}
		}

		// the server should only send both or none, but this makes TS happy
		if (captchaReturn.audioChallenge && captchaReturn.visualChallenge) {
			try {
				return await showCaptchaDialog(captchaReturn.audioChallenge, captchaReturn.visualChallenge, captchaReturn.token)
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
