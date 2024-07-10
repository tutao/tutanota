import m, { Children, Component, Vnode } from "mithril"
import { NavButton } from "../../common/gui/base/NavButton.js"
import { size } from "../../common/gui/size"
import { CALENDAR_PREFIX, CONTACTS_PREFIX, MAIL_PREFIX, SEARCH_PREFIX } from "../../common/misc/RouteChange"
import { FeatureType } from "../../common/api/common/TutanotaConstants"
import { BootIcons } from "../../common/gui/base/icons/BootIcons"
import { locator } from "../../common/api/main/CommonLocator.js"

type Attrs = void
const fontSize = size.font_size_small

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
		return m("nav.bottom-nav.flex.items-center.z1", [
			m(NavButton, {
				label: "emails_label",
				icon: () => BootIcons.Mail,
				href: MAIL_PREFIX,
				vertical: true,
				fontSize,
			}),
			locator.logins.isInternalUserLoggedIn()
				? m(NavButton, {
						label: "search_label",
						icon: () => BootIcons.Search,
						href: () => getHrefForSearch(),
						isSelectedPrefix: SEARCH_PREFIX,
						vertical: true,
						fontSize,
				  })
				: null,
			locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableContacts)
				? m(NavButton, {
						label: "contacts_label",
						icon: () => BootIcons.Contacts,
						href: () => CONTACTS_PREFIX,
						isSelectedPrefix: CONTACTS_PREFIX,
						vertical: true,
						fontSize,
				  })
				: null,
			locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableCalendar)
				? m(NavButton, {
						label: "calendar_label",
						icon: () => BootIcons.Calendar,
						href: CALENDAR_PREFIX,
						vertical: true,
						fontSize,
				  })
				: null,
		])
	}
}
