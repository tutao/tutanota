import { WeekStart } from "@tutao/app-env"
import { UserSettingsGroupRoot } from "@tutao/entities/tutanota"
import { getWeekStart } from "../../base/utils_todo_move_elsewhere/CalendarUtils"

/** Start of the week offset relative to Sunday (forward). */
export function getStartOfTheWeekOffset(weekStart: WeekStart): number {
	switch (weekStart) {
		case WeekStart.SUNDAY:
			return 0

		case WeekStart.SATURDAY:
			return 6

		case WeekStart.MONDAY:
		default:
			return 1
	}
}

/** {@see getStartOfTheWeekOffset} */
export function getStartOfTheWeekOffsetForUser(userSettingsGroupRoot: UserSettingsGroupRoot): number {
	return getStartOfTheWeekOffset(getWeekStart(userSettingsGroupRoot))
}
