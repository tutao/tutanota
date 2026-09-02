import { TsString, TSwUncheckedSendable, TutanotaError } from "@tutao/lang-api"

@TSwUncheckedSendable({ reasoning: "TutanotaError is TSUncheckedSendable and InvalidModelError does not introduce any new fields" })
export class InvalidModelError extends TutanotaError {
	constructor(message: TsString) {
		super("InvalidModelError", message)
	}
}
