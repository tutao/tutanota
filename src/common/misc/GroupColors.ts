import { memoized } from "@tutao/tutanota-utils"
import { UserSettingsGroupRoot } from "../api/entities/tutanota/TypeRefs"
import { isValidColorCode } from "../gui/base/Color"
import { BIRTHDAY_CALENDAR_BASE_ID, DEFAULT_BIRTHDAY_CALENDAR_COLOR, defaultCalendarColor } from "../api/common/TutanotaConstants"

export const getGroupColors = memoized((userId: Id, userSettingsGroupRoot: UserSettingsGroupRoot) => {
	const calendarColors: Map<string, string> = userSettingsGroupRoot.groupSettings.reduce((acc, { group, color }) => {
		if (!isValidColorCode("#" + color)) {
			color = defaultCalendarColor
		}
		acc.set(group, color)
		return acc
	}, new Map())

	const birthdayCalendarId = `${userId}#${BIRTHDAY_CALENDAR_BASE_ID}`
	const color = userSettingsGroupRoot.birthdayCalendarColor ?? DEFAULT_BIRTHDAY_CALENDAR_COLOR
	calendarColors.set(birthdayCalendarId, color)

	return calendarColors
})
