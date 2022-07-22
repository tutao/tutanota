import {ProgrammingError} from "../error/ProgrammingError.js"
import {DateProvider} from "../DateProvider.js"

export class WorkerDateProvider implements DateProvider {
	now(): number {
		return Date.now()
	}

	timeZone(): string {
		throw new ProgrammingError("timeZone is not available in worker")
	}
}