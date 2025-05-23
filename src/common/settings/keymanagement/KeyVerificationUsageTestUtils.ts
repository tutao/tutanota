import { Stage, UsageTest } from "@tutao/tutanota-usagetests"
import { IdentityKeyVerificationMethod } from "../../api/common/TutanotaConstants"
import { ProgrammingError } from "../../api/common/error/ProgrammingError"

export type TestTracks = {
	[IdentityKeyVerificationMethod.text]: UsageTest
	[IdentityKeyVerificationMethod.qr]: UsageTest
}

export enum KeyVerificationScanCompleteMetric {
	Success = "Success",
	Failure = "Failure",
}

/**
 * This is a thin abstraction over the different usage tests related to key verification.
 * It is sufficient if the consumer uses the public methods exported by this class; no usage test object needs to be directly interacted with.
 */
export class KeyVerificationUsageTestUtils {
	private tracks: TestTracks

	private readonly regretTest: UsageTest

	constructor(private readonly textUsageTest: UsageTest, private readonly qrUsageTest: UsageTest, regretTest: UsageTest) {
		this.configureTests(textUsageTest, qrUsageTest, regretTest)

		this.regretTest = regretTest
		this.tracks = {
			[IdentityKeyVerificationMethod.text]: textUsageTest,
			[IdentityKeyVerificationMethod.qr]: qrUsageTest,
		}
	}

	private configureTests(...tests: UsageTest[]) {
		for (const test of tests) {
			test.allowEarlyRestarts = true
			test.recordTime = true
		}
	}

	private track(method: IdentityKeyVerificationMethod): UsageTest {
		return this.tracks[method]
	}

	async start(method: IdentityKeyVerificationMethod) {
		const stageNumber = 0
		const stage: Stage = this.track(method).getStage(stageNumber)

		await stage.complete()
	}

	async verified(method: IdentityKeyVerificationMethod) {
		let stageNumber: number

		if (method === IdentityKeyVerificationMethod.text) {
			stageNumber = 1
		} else if (method === IdentityKeyVerificationMethod.qr) {
			stageNumber = 2
		} else {
			throw new ProgrammingError("verified() is only implemented for Text/QR")
		}

		const stage: Stage = this.track(method).getStage(stageNumber)

		await stage.complete()
	}

	// only for QR
	async scan_complete(method: IdentityKeyVerificationMethod, status: KeyVerificationScanCompleteMetric) {
		if (method !== IdentityKeyVerificationMethod.qr) {
			throw new ProgrammingError("scan_complete() is only implemented for QR tests")
		}

		const stageNumber = 1
		const stage: Stage = this.track(method).getStage(stageNumber)

		stage.setMetric({ name: "status", value: status })
		await stage.complete()
	}

	async regret() {
		const stageNumber = 0
		const test: UsageTest = this.regretTest

		await test.getStage(stageNumber).complete()
	}
}
