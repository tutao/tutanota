import { WeekStart } from "@tutao/app-env"
import { downcast } from "@tutao/utils"
import { CalendarAttendeeStatus, CalendarEventAttendee, UserSettingsGroupRoot } from "@tutao/entities/tutanota"

export function getWeekStart(userSettings: UserSettingsGroupRoot): WeekStart {
	return downcast(userSettings.startOfTheWeek)
}
export function getAttendeeStatus(attendee: CalendarEventAttendee): CalendarAttendeeStatus {
	return downcast(attendee.status)
}
