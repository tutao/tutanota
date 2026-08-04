import { TutanotaError } from "./TutanotaError.js"

export class ProgrammingError extends TutanotaError {
	constructor(m: string | null = null) {
		super("ProgrammingError", m ?? "Unknown programming error")
	}
}
