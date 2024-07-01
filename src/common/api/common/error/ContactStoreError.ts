import { TutanotaError } from "@tutao/tutanota-error"

/**
 * Errors related to the native contact store/phone book.
 */
export class ContactStoreError extends TutanotaError {
	constructor(message: string) {
		super("ContactStoreError", message)
	}
}
