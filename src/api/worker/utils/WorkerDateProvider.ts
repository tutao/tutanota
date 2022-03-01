import {ProgrammingError} from "../../common/error/ProgrammingError.js"
import {DateProvider} from "../../common/DateProvider.js"

export class WorkerDateProvider implements DateProvider {
	now(): number {
		return Date.now()
	}

	timeZone(): string {
		throw new ProgrammingError("timeZone is not available in worker")
	}
}