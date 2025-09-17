export type PowChallengeParameters = {
	base: bigint
	difficulty: number
	modulus: bigint
}
export function solvePowChallenge({ base, difficulty, modulus }: PowChallengeParameters): bigint {
	let e = base
	for (let i = 0; i < difficulty; i++) {
		e = e ** 2n % modulus
	}
	// this is the value we should return to the challenger
	return e
}
