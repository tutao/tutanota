import { assertMainOrNode, AvailablePlanType, TutanotaError } from "@tutao/app-env"
import type { TranslationKeyType } from "../../misc/TranslationKey"

assertMainOrNode()

/**
 * Thrown when the user is trying to go over their plan limits.
 */
export class UpgradeRequiredError extends TutanotaError {
	/**
	 * @param message TranslationKey of a message for the user.
	 * @param plans Array of AvailablePlanTypes the user can upgrade to in order to be able to do what they are trying to do.
	 */
	constructor(
		readonly message: TranslationKeyType,
		readonly plans: Array<AvailablePlanType>,
	) {
		super("UpgradeRequiredError", message)
	}
}
