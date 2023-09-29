// TODO reconcile with CryptoError in tutanota-3
//    currently will get deserialized to the CryptoError from tutanota-3
export class CryptoError extends Error {
	constructor(message: string, error?: Error) {
		super(error ? message + "> " + (error.stack ? error.stack : error.message) : message)
		// This is needed to correctly deserialize the error.
		this.name = "CryptoError"
	}
}
