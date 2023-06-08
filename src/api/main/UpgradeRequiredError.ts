import { TutanotaError } from "../common/error/TutanotaError"
import type { TranslationKeyType } from "../../misc/TranslationKey"
import { assertMainOrNode } from "../common/Env"
import { AvailablePlanType } from "../common/TutanotaConstants.js"

assertMainOrNode()

/**
 * Thrown when the user is trying to go over their plan limits.
 */
export class UpgradeRequiredError extends TutanotaError {
	constructor(readonly message: TranslationKeyType, readonly plans: Array<AvailablePlanType>) {
		super("UpgradeRequiredError", message)
	}
}
