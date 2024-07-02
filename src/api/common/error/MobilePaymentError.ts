import { TutanotaError } from "@tutao/tutanota-error"

/**
 * An error related to mobile payments.
 */
export class MobilePaymentError extends TutanotaError {
	constructor(message: string) {
		super("MobilePaymentError", message)
	}
}
