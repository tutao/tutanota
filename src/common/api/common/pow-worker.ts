import { PowChallengeParameters, solvePowChallenge } from "../../subscription/ProofOfWorkCaptchaUtils.js"

export type PowSolution = {
	solution: bigint
	timeToSolve: number
}

self.onmessage = (message) => {
	const start = performance.now()
	const challenge: PowChallengeParameters = message.data
	const solution = solvePowChallenge(challenge)
	const end = performance.now()
	self.postMessage({ solution, timeToSolve: end - start })
}

self.postMessage("ready")
