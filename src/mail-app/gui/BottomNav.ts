import m, { Children, Component, Vnode } from "mithril"
import { NavButton } from "../../common/gui/base/NavButton.js"
import { font_size } from "../../common/gui/size"
import { CALENDAR_PREFIX, CONTACTS_PREFIX, DRIVE_PREFIX, MAIL_PREFIX, SEARCH_PREFIX } from "../../common/misc/RouteChange"
import { FeatureType } from "@tutao/app-env"
import { locator } from "../../common/api/main/CommonLocator.js"
import { isDriveEnabled } from "../../common/api/common/drive/DriveUtils"
import { Icons } from "../../common/gui/base/icons/Icons"

type Attrs = void
const fontSize = font_size.small

function getHrefForSearch(): string {
	const route = m.route.get()
	if (route.startsWith(SEARCH_PREFIX)) {
		return route
	} else if (route.startsWith(CONTACTS_PREFIX)) {
		return "/search/contact"
	} else if (route.startsWith(CALENDAR_PREFIX)) {
		return "/search/calendar"
	} else {
		return "/search/mail"
	}
}

export class BottomNav implements Component<Attrs> {
	view(vnode: Vnode<Attrs>): Children {
		// Using bottom-nav class too to match it inside media queries like @print, otherwise it's not matched
		return m("nav.bottom-nav.flex.items-center.z1.gap-4.plr-4", [
			m(NavButton, {
				label: "emails_label",
				icon: () => Icons.MailFilled,
				href: MAIL_PREFIX,
				vertical: true,
				fontSize,
			}),
			locator.logins.isInternalUserLoggedIn()
				? m(NavButton, {
						label: "search_label",
						icon: () => Icons.Search,
						href: () => getHrefForSearch(),
						isSelectedPrefix: SEARCH_PREFIX,
						vertical: true,
						fontSize,
					})
				: null,
			locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableContacts)
				? m(NavButton, {
						label: "contacts_label",
						icon: () => Icons.PeopleFilled,
						href: () => CONTACTS_PREFIX,
						isSelectedPrefix: CONTACTS_PREFIX,
						vertical: true,
						fontSize,
					})
				: null,
			locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableCalendar)
				? m(NavButton, {
						label: "calendar_label",
						icon: () => Icons.CalendarFilled,
						href: CALENDAR_PREFIX,
						vertical: true,
						fontSize,
					})
				: null,
			isDriveEnabled(locator.logins)
				? m(NavButton, {
						label: "driveView_action",
						icon: () => Icons.DriveFilled,
						href: DRIVE_PREFIX,
						vertical: true,
						fontSize,
					})
				: null,
		])
	}
}
