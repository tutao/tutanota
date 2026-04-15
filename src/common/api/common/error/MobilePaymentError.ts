import { TutanotaError } from "@tutao/app-env"

/**
 * An error related to mobile payments.
 */
export class MobilePaymentError extends TutanotaError {
	constructor(message: string) {
		super("MobilePaymentError", message)
	}
}
