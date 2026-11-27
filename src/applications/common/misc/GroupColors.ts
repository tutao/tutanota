import { isValidSolidColorCode } from "../../../ui/base/Color"
import { TutanotaConstants } from "@tutao/app-env"
import { UserSettingsGroupRoot } from "@tutao/entities/tutanota"
import { memoized } from "../../../ui/utils/memoized"

export const getGroupColors = memoized((userId: Id, userSettingsGroupRoot: UserSettingsGroupRoot) => {
	const calendarColors: Map<string, string> = userSettingsGroupRoot.groupSettings.reduce((acc, { group, color }) => {
		if (!isValidSolidColorCode("#" + color)) {
			color = TutanotaConstants.DEFAULT_CALENDAR_COLOR
		}
		acc.set(group, color)
		return acc
	}, new Map())

	const birthdayCalendarId = `${userId}#${TutanotaConstants.BIRTHDAY_CALENDAR_BASE_ID}`
	const color = userSettingsGroupRoot.birthdayCalendarColor ?? TutanotaConstants.DEFAULT_BIRTHDAY_CALENDAR_COLOR
	calendarColors.set(birthdayCalendarId, color)

	return calendarColors
})
