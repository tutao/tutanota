export class DateTimeFormatterWrapper {
	resolveTimeZone(timeZone: string): string | null {
		try {
			return Intl.DateTimeFormat("en-US", { timeZone }).resolvedOptions().timeZone
		} catch (e) {
			if (e instanceof RangeError) {
				return null
			} else {
				throw e
			}
		}
	}
}
