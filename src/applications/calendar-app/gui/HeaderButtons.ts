import m from "mithril"
import { isSelectedPrefix, NavButton, NavButtonColor } from "../../../ui/base/NavButton"
import { Icons } from "../../../ui/base/icons/Icons"
import { CALENDAR_PREFIX, CONTACTLIST_PREFIX, CONTACTS_PREFIX, DRIVE_PREFIX, MAIL_PREFIX } from "../../../ui/utils/RouteChange"
import { locator } from "../../common/api/main/CommonLocator"
import { FeatureType } from "@tutao/app-env"
import { isDriveEnabled } from "../../common/misc/DriveUtils"

export function renderHeaderButtons() {
	// We assign click listeners to buttons to move focus correctly if the view is already open
	return [
		m(NavButton, {
			label: "emails_label",
			icon: () => Icons.MailFilled,
			href: MAIL_PREFIX,
			isSelectedPrefix: MAIL_PREFIX,
			colors: NavButtonColor.Header,
		}),
		// not available for external mailboxes
		locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableContacts)
			? m(NavButton, {
					label: "contacts_label",
					icon: () => Icons.PeopleFilled,
					href: CONTACTS_PREFIX,
					isSelectedPrefix: isSelectedPrefix(CONTACTS_PREFIX) || isSelectedPrefix(CONTACTLIST_PREFIX),
					colors: NavButtonColor.Header,
				})
			: null,
		// not available for external mailboxes
		locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableCalendar)
			? m(NavButton, {
					label: "calendar_label",
					icon: () => Icons.CalendarFilled,
					href: CALENDAR_PREFIX,
					colors: NavButtonColor.Header,
					click: () => m.route.get().startsWith(CALENDAR_PREFIX),
				})
			: null,
		isDriveEnabled(locator.logins)
			? m(NavButton, {
					label: "driveView_action",
					icon: () => Icons.DriveFilled,
					href: DRIVE_PREFIX,
					colors: NavButtonColor.Header,
					click: () => m.route.get().startsWith(DRIVE_PREFIX),
				})
			: null,
	]
}
