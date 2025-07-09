import { PowChallengeParameters, solvePowChallenge } from "../../subscription/ProofOfWorkCaptchaUtils.js"

self.onmessage = (message) => {
	const challenge: PowChallengeParameters = message.data
	const solution = solvePowChallenge(challenge)
	self.postMessage(solution)
}

self.postMessage("ready")
