import { TutanotaError } from "./TutanotaError.js"

export class ProgrammingError extends TutanotaError {
	constructor(m?: string) {
		super("ProgrammingError", m ?? "Unknown programming error")
	}
}
