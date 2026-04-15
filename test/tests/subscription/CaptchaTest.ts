import o from "@tutao/otest"
import { solvePowChallengeInWorker } from "../../../src/common/subscription/captcha/Captcha.js"
import { sysTypeRefs } from "@tutao/typerefs"

o.spec("SolvePowChallenge", () => {
	o(
		"solve valid challenge",
		browser(async () => {
			const captchaGetOut: sysTypeRefs.TimelockCaptchaGetOut = sysTypeRefs.createTimelockCaptchaGetOut({
				base: "2",
				difficulty: "2",
				modulus: "2",
			})
			const solution = await solvePowChallengeInWorker(captchaGetOut)
			o(solution.solution).equals(0n)
		}),
	)
})
