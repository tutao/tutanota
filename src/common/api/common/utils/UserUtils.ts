import { TimeFormat } from "@tutao/app-env"
import { sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"
import { AccountType, GroupType } from "@tutao/app-env"

/**
 * Checks if the current user is an admin of the customer.
 * @return True if the user is an admin
 */
export function isGlobalAdmin(user: sysTypeRefs.User): boolean {
	if (isInternalUser(user)) {
		return user.memberships.some((m) => m.groupType === GroupType.Admin)
	} else {
		return false
	}
}

/**
 * Provides the information if an internal user is logged in.
 * @return True if an internal user is logged in, false if no user or an external user is logged in.
 */
export function isInternalUser(user: sysTypeRefs.User): boolean {
	return user.accountType !== AccountType.EXTERNAL
}

export function getTimeFormatForUser(userSettingsGroupRoot: tutanotaTypeRefs.UserSettingsGroupRoot): TimeFormat {
	// it's saved as a string, but is a const enum.
	return userSettingsGroupRoot.timeFormat as TimeFormat
}
