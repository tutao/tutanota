import { TutanotaError } from "@tutao/appEnv"

/**
 * An error related to mobile payments.
 */
export class MobilePaymentError extends TutanotaError {
	constructor(message: string) {
		super("MobilePaymentError", message)
	}
}
