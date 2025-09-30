import { memoized } from "@tutao/tutanota-utils"
import { UserSettingsGroupRoot } from "../api/entities/tutanota/TypeRefs"
import { isValidSolidColorCode } from "../gui/base/Color"
import { defaultCalendarColor } from "../api/common/TutanotaConstants"

export const getGroupColors = memoized((userSettingsGroupRoot: UserSettingsGroupRoot) => {
	return userSettingsGroupRoot.groupSettings.reduce((acc, { group, color }) => {
		if (!isValidSolidColorCode("#" + color)) {
			color = defaultCalendarColor
		}
		acc.set(group, color)
		return acc
	}, new Map())
})
