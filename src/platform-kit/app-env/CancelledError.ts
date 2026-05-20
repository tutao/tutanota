import { TutanotaError } from "./TutanotaError"

export class CancelledError extends TutanotaError {
	/**
	 * A cancelled error is thrown when a async action is aborted
	 * @param message An information about the exception.
	 * @param reason A cancellation reason.
	 */
	constructor(
		message: string,
		readonly reason: string = "unknown",
	) {
		super("CancelledError", message)
	}
}
