import { ProgrammingError } from "@tutao/app-env"
import { DateProvider } from "@tutao/utils"

export class NoZoneDateProvider implements DateProvider {
	now(): number {
		return Date.now()
	}

	timeZone(): string {
		throw new ProgrammingError("timeZone is not available in worker")
	}
}
