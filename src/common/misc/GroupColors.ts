import { memoized } from "@tutao/tutanota-utils"
import { UserSettingsGroupRoot } from "../api/entities/tutanota/TypeRefs"
import { isValidColorCode } from "../gui/base/Color"
import { defaultCalendarColor } from "../api/common/TutanotaConstants"

export const getGroupColors = memoized((userSettingsGroupRoot: UserSettingsGroupRoot) => {
	return userSettingsGroupRoot.groupSettings.reduce((acc, { group, color }) => {
		if (!isValidColorCode("#" + color)) {
			color = defaultCalendarColor
		}
		acc.set(group, color)
		return acc
	}, new Map())
})
