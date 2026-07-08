import { availableIANATimeZones, windowsToIANATimeZones } from "./TimeZoneData"
import { DateTimeFormatterWrapper } from "./DateTimeFormatterWrapper"
import { DateTime } from "luxon"
import { buildGmtOffset, getTimeZoneName } from "../../calendar-app/calendar/gui/DateTimeTextFormatterUtils"

export type IANATimeZoneStrings = {
	timeZone: string
	name: string
	offsetLongName: string
	gmtOffset: string
}

export class TimeZoneProvider {
	private readonly availableIANATimeZoneSet = new Set(availableIANATimeZones)

	constructor(private readonly dateTimeFormatterWrapper: DateTimeFormatterWrapper) {}

	resolveTimeZoneForImport(timeZone: string) {
		if (this.availableIANATimeZoneSet.has(timeZone)) {
			return timeZone
		}

		const timeZoneFromWindowsMap = windowsToIANATimeZones[timeZone]
		if (timeZoneFromWindowsMap) {
			return timeZoneFromWindowsMap
		}

		return this.dateTimeFormatterWrapper.resolveTimezone(timeZone)
	}

	getTimeZonesStrings(dateTime: DateTime): Array<IANATimeZoneStrings> {
		return availableIANATimeZones.map((timeZone) => {
			return this.createTimeZoneStrings(timeZone, dateTime)
		})
	}

	createTimeZoneStrings(timeZone: string, dateTime: DateTime): IANATimeZoneStrings {
		const dateTimeInTimeZone = dateTime.setZone(timeZone)
		if (!dateTimeInTimeZone.isValid) {
			throw new Error(`Unexpected invalid time zone = '${timeZone}'`)
		}
		return {
			timeZone: timeZone,
			name: getTimeZoneName(timeZone),
			offsetLongName: dateTimeInTimeZone.offsetNameLong ?? "",
			gmtOffset: buildGmtOffset(dateTimeInTimeZone),
		}
	}
}

export const timeZoneProvider = new TimeZoneProvider(new DateTimeFormatterWrapper())
