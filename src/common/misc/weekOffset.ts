import { getWeekStart, WeekStart } from "../api/common/TutanotaConstants"
import { tutanotaTypeRefs } from "@tutao/typeRefs"

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
export function getStartOfTheWeekOffsetForUser(userSettingsGroupRoot: tutanotaTypeRefs.UserSettingsGroupRoot): number {
	return getStartOfTheWeekOffset(getWeekStart(userSettingsGroupRoot))
}
