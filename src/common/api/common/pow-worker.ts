import { PowChallengeParameters, solvePowChallenge } from "../../subscription/ProofOfWorkCaptchaUtils.js"

// setInterval(() => console.log("hello worker"), 1500)

self.onmessage = (message) => {
	const challenge: PowChallengeParameters = message.data
	const solution = solvePowChallenge(challenge)
	self.postMessage(solution)
}

self.postMessage("ready")
