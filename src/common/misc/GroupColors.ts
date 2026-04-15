import { memoized } from "@tutao/utils"
import { tutanotaTypeRefs } from "@tutao/typerefs"
import { isValidSolidColorCode } from "../gui/base/Color"
import { BIRTHDAY_CALENDAR_BASE_ID, DEFAULT_BIRTHDAY_CALENDAR_COLOR, DEFAULT_CALENDAR_COLOR } from "@tutao/app-env"

export const getGroupColors = memoized((userId: Id, userSettingsGroupRoot: tutanotaTypeRefs.UserSettingsGroupRoot) => {
	const calendarColors: Map<string, string> = userSettingsGroupRoot.groupSettings.reduce((acc, { group, color }) => {
		if (!isValidSolidColorCode("#" + color)) {
			color = DEFAULT_CALENDAR_COLOR
		}
		acc.set(group, color)
		return acc
	}, new Map())

	const birthdayCalendarId = `${userId}#${BIRTHDAY_CALENDAR_BASE_ID}`
	const color = userSettingsGroupRoot.birthdayCalendarColor ?? DEFAULT_BIRTHDAY_CALENDAR_COLOR
	calendarColors.set(birthdayCalendarId, color)

	return calendarColors
})
