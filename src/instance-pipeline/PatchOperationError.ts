import { TutanotaError } from "@tutao/app-env"

export class PatchOperationError extends TutanotaError {
	constructor(m: string) {
		super("PatchOperationError", m)
	}
}
