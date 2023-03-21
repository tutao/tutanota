import m, { Children, Component, Vnode } from "mithril"
import { NavButton } from "../base/NavButton.js"
import { size } from "../size"
import { CALENDAR_PREFIX, CONTACTS_PREFIX, navButtonRoutes, SEARCH_PREFIX } from "../../misc/RouteChange"
import { FeatureType } from "../../api/common/TutanotaConstants"
import { BootIcons } from "../base/icons/BootIcons"
import { locator } from "../../api/main/MainLocator.js"

type Attrs = void
const fontSize = size.font_size_small

export class BottomNav implements Component<Attrs> {
	view(vnode: Vnode<Attrs>): Children {
		// Using bottom-nav class too to match it inside media queries like @print, otherwise it's not matched
		return m("bottom-nav.bottom-nav.flex.items-center.z1", [
			m(NavButton, {
				label: "emails_label",
				icon: () => BootIcons.Mail,
				href: navButtonRoutes.mailUrl,
				vertical: true,
				fontSize,
			}),
			locator.logins.isInternalUserLoggedIn()
				? m(NavButton, {
						label: "search_label",
						icon: () => BootIcons.Search,
						href: m.route.get().startsWith(SEARCH_PREFIX)
							? m.route.get()
							: m.route.get().startsWith(CONTACTS_PREFIX)
							? "/search/contact"
							: "/search/mail",
						isSelectedPrefix: SEARCH_PREFIX,
						vertical: true,
						fontSize,
				  })
				: null,
			locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableContacts)
				? m(NavButton, {
						label: "contacts_label",
						icon: () => BootIcons.Contacts,
						href: () => navButtonRoutes.contactsUrl,
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
