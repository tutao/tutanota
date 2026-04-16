import { TutanotaError } from "@tutao/error"

/**
 * An error related to mobile payments.
 */
export class MobilePaymentError extends TutanotaError {
	constructor(message: string) {
		super("MobilePaymentError", message)
	}
}
