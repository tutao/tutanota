import { DateTime, Interval } from "luxon"

export function isReferenceDateWithinCyberMondayCampaign(referenceDate: Date) {
	const startIso = "2024-11-15T10:00:00+01:00"
	const endIso = "2024-12-04T10:00:00+01:00"

	const cyberMonday2024Interval = Interval.fromDateTimes(DateTime.fromISO(startIso), DateTime.fromISO(endIso))

	return cyberMonday2024Interval.contains(DateTime.fromJSDate(referenceDate))
}
