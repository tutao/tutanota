import { TutanotaError } from "@tutao/tutanota-error"
import type { TranslationKeyType } from "../../misc/TranslationKey"
import { assertMainOrNode } from "../common/Env"
import { AvailablePlanType } from "../common/TutanotaConstants.js"

assertMainOrNode()

/**
 * Thrown when the user is trying to go over their plan limits.
 */
export class UpgradeRequiredError extends TutanotaError {
	/**
	 * @param message TranslationKey of a message for the user.
	 * @param plans Array of AvailablePlanTypes the user can upgrade to in order to be able to do what they are trying to do.
	 */
	constructor(readonly message: TranslationKeyType, readonly plans: Array<AvailablePlanType>) {
		super("UpgradeRequiredError", message)
	}
}
