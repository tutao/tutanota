import { DateTime, Interval } from "luxon"

export function isReferenceDateWithinTutaBirthdayCampaign(referenceDate: Date) {
	const startIso = "2025-03-26T10:00:00+01:00"
	const endIso = "2025-04-06T00:00:00+02:00"

	const interval = Interval.fromDateTimes(DateTime.fromISO(startIso), DateTime.fromISO(endIso))

	return interval.contains(DateTime.fromJSDate(referenceDate))
}
