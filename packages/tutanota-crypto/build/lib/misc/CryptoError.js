import { TutanotaError } from "@tutao/tutanota-error";
export class CryptoError extends TutanotaError {
    constructor(message, error) {
        super("CryptoError", error ? message + "> " + (error.stack ? error.stack : error.message) : message);
    }
}
