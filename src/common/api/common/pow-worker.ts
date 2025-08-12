import { PowChallengeParameters, solvePowChallenge } from "../../subscription/ProofOfWorkCaptchaUtils.js"

export type PowSolution = {
	solution: bigint
	timeToSolve: number
}

self.onmessage = (message) => {
	const challenge: PowChallengeParameters = message.data
	const solution = solvePowChallenge(challenge)
	self.postMessage({ solution })
}

const calibrationChallenge: PowChallengeParameters = {
	base: 8679808020275100642257012898168209290903965661786802957041244140778752007485809687892028363661106831572228339267213786389810204285321690921412959370637867n,
	difficulty: 50000,
	modulus:
		93959433477240599969637424568962411408160297417706037785172639012978865376514394530889698156338282389069901599310212391588188436549922055017651108363465721236609979182773608083197981676544607227448147859475334308571253540800790282122888280849842167321761788600204867046075508656637454476473496223546448915117n,
}

const start = performance.now()
const calibrationChallengeSolution = solvePowChallenge(calibrationChallenge)
const end = performance.now()
self.postMessage({ isReady: true, timeToSolveCalibrationChallenge: end - start })
