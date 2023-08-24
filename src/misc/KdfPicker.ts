import { KdfType } from "../api/common/TutanotaConstants.js"
import { UsageTest, UsageTestController } from "@tutao/tutanota-usagetests"

/**
 * This is a utility class to control the rollout of the new KDF function leveraging the usage tests.
 *
 * This enables the server to control the percentage of users (participating in the usage tests), that should start using the new KDF.
 * It also allows the sys ops to immediately stop the rollout in case there any issues.
 */
export class KdfPicker {
	private kdfRolloutTest: UsageTest

	constructor(private readonly usageTestController: UsageTestController) {
		this.kdfRolloutTest = this.usageTestController.getTest("crypto.kdf")
	}

	/**
	 * Determine the KDF type to use, in case it is overridden via `Const`
	 */
	async pickKdfType(currentKdfType: KdfType = KdfType.Bcrypt): Promise<KdfType> {
		if (currentKdfType === KdfType.Argon2id) {
			// we want to avoid downgrading the KDF
			return currentKdfType
		}
		await this.kdfRolloutTest.getStage(0).complete()

		return this.kdfRolloutTest.getVariant({
			[0]: () => KdfType.Bcrypt,
			[1]: () => KdfType.Argon2id,
		})
	}
}
