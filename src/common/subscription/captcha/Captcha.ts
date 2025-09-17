import { locator } from "../../api/main/CommonLocator.js"
import { RegistrationCaptchaService, TimelockCaptchaService } from "../../api/entities/sys/Services.js"
import {
	createClientPerformanceInfo,
	createRegistrationCaptchaServiceGetData,
	createTimelockCaptchaGetIn,
	TimelockCaptchaGetOut,
} from "../../api/entities/sys/TypeRefs.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import { AccessDeactivatedError, AccessExpiredError, InvalidDataError } from "../../api/common/error/RestError.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { defer } from "@tutao/tutanota-utils"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { PowChallengeParameters } from "../utils/ProofOfWorkCaptchaUtils.js"
import { showCaptchaDialog } from "./CaptchaDialog.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { PowSolution } from "../../api/common/pow-worker"
import { client } from "../../misc/ClientDetector.js"

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
export async function runCaptchaFlow({
	mailAddress,
	isBusinessUse,
	isPaidSubscription,
	campaignToken,
	powChallengeSolution,
}: {
	mailAddress: string
	isBusinessUse: boolean
	isPaidSubscription: boolean
	campaignToken: string | null
	powChallengeSolution: Promise<PowSolution>
}): Promise<string | null> {
	// We don't want to show the progressDialog if pow challenge is already solved.
	// To do that, we have to check if the pow challenge promise is already settled.
	// JS does not natively support this.
	// Instead, we call a wrapper function that returns a status object for us to check.
	// By default, the .then() call, will be put at the end of the microtask queue, so we need to ensure that the place where we check for the promise state
	// is called afterward. We do that, by wrapping it in an empty promise, therefore also pushing it to the end of the microtask queue.
	const resolved = trackPromiseResolved(powChallengeSolution)
	return Promise.resolve().then(async () => {
		let solution: bigint | undefined
		let timeToSolvePoW: number | undefined
		if (resolved.state) {
			const challengeSolution = await powChallengeSolution
			solution = challengeSolution.solution
			timeToSolvePoW = challengeSolution.timeToSolve
		} else {
			const challengeSolution = await showProgressDialog("captchaChecking_msg", powChallengeSolution)
			solution = challengeSolution.solution
			timeToSolvePoW = challengeSolution.timeToSolve
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
					isAutomatedBrowser: client.isAutomatedBrowser,
				}),
			)
		} catch (e) {
			if (e instanceof AccessExpiredError) {
				const powChallengeSolution = runPowChallenge(deviceConfig.getSignupToken())
				return runCaptchaFlow({
					mailAddress,
					isBusinessUse,
					isPaidSubscription,
					campaignToken,
					powChallengeSolution,
				})
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
					return runCaptchaFlow({
						mailAddress,
						isBusinessUse,
						isPaidSubscription,
						campaignToken,
						powChallengeSolution,
					})
				} else if (e instanceof AccessExpiredError) {
					await Dialog.message("requestTimeout_msg")
					return runCaptchaFlow({
						mailAddress,
						isBusinessUse,
						isPaidSubscription,
						campaignToken,
						powChallengeSolution,
					})
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
	const { promise, resolve, reject } = defer<PowSolution>()

	worker.onmessage = (msg) => {
		if (msg.data.isReady) {
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

export async function runPowChallenge(signupToken: string): Promise<PowSolution> {
	const powWorker = await loadPowWorker()

	const data = createTimelockCaptchaGetIn({
		signupToken,
		deviceInfo: createClientPerformanceInfo({ isAutomatedBrowser: client.isAutomatedBrowser }),
		timeToSolveCalibrationChallenge: powWorker.timeToSolveCalibrationChallenge.toString(),
	})
	const ret = await locator.serviceExecutor.get(TimelockCaptchaService, data)
	return await powWorker.solveChallenge({
		base: BigInt(ret.base),
		difficulty: Number(ret.difficulty),
		modulus: BigInt(ret.modulus),
	})
}

export async function loadPowWorker(): Promise<PowWorker> {
	const { prefixWithoutFile } = window.tutao.appState
	const worker = new Worker(prefixWithoutFile + "/pow-worker.js", { type: "module" })
	const { promise, resolve, reject } = defer<PowWorker>()

	worker.onmessage = (msg) => {
		if (msg.data.isReady) {
			resolve(new PowWorker(worker, msg.data.timeToSolveCalibrationChallenge))
		} else {
			console.warn("got a challenge solution before calibration listener was replaced.")
			// ignore, this is a solution response that should be handled somewhere else.
		}
	}

	worker.onerror = (err: ErrorEvent) => {
		reject(new Error(err.message))
	}

	return promise
}

export class PowWorker {
	constructor(
		private readonly worker: Worker,
		public readonly timeToSolveCalibrationChallenge: number,
	) {}

	solveChallenge(challenge: PowChallengeParameters): Promise<PowSolution> {
		const { promise, resolve, reject } = defer<PowSolution>()
		this.worker.onerror = (err: ErrorEvent) => {
			reject(new Error(err.message))
		}
		this.worker.onmessage = (msg) => {
			resolve(msg.data)
		}
		this.worker.postMessage(challenge)
		return promise
	}
}
