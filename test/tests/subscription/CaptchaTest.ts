import o from "@tutao/otest"
import { solvePowChallengeInWorker } from "../../../src/common/subscription/Captcha.js"
import { createTimelockCaptchaGetOut, TimelockCaptchaGetOut } from "../../../src/common/api/entities/sys/TypeRefs.js"

o.spec("SolvePowChallenge", () => {
	o(
		"solve valid challenge",
		browser(async () => {
			const captchaGetOut: TimelockCaptchaGetOut = createTimelockCaptchaGetOut({ base: "2", difficulty: "2", modulus: "2" })
			const solution = await solvePowChallengeInWorker(captchaGetOut)
			o(solution).equals(0n)
		}),
	)

	o(
		"solve invalid challenge with modulo 0",
		browser(async () => {
			const captchaGetOut: TimelockCaptchaGetOut = createTimelockCaptchaGetOut({ base: "2", difficulty: "2", modulus: "0" })
			await o(() => solvePowChallengeInWorker(captchaGetOut)).asyncThrows("Uncaught RangeError: Division by zero")
		}),
	)
})
