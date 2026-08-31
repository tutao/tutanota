import { TSwUncheckedSendable, TutanotaError } from "@tutao/lang-api"

@TSwUncheckedSendable({ reasoning: "TutanotaError is TSUncheckedSendable and CancelledError does not introduce any new fields" })
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
