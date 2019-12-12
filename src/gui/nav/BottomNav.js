//@flow

import m from "mithril"
import {NavButtonN} from "../base/NavButtonN"
import {BootIcons} from "../base/icons/BootIcons"
import {size} from "../size"
import {CALENDAR_PREFIX, CONTACTS_PREFIX, navButtonRoutes, SEARCH_PREFIX} from "../../misc/RouteChange"
import {logins} from "../../api/main/LoginController"
import {FeatureType} from "../../api/common/TutanotaConstants"

type Attrs = {width: number}

const fontSize = size.font_size_small

export class BottomNav implements MComponent<Attrs> {
	view(vnode: Vnode<Attrs>): Children {
		return m("bottom-nav.flex.items-center.z1", [
			m(NavButtonN, {
					label: 'emails_label',
					icon: () => BootIcons.Mail,
					href: navButtonRoutes.mailUrl,
					vertical: true,
					fontSize
				}
			),
			logins.isInternalUserLoggedIn()
				? m(NavButtonN, {
					label: "search_label",
					icon: () => BootIcons.Search,
					href: m.route.get().startsWith(SEARCH_PREFIX)
						? m.route.get()
						: m.route.get().startsWith(CONTACTS_PREFIX)
							? "/search/contact"
							: "/search/mail",
					isSelectedPrefix: SEARCH_PREFIX,
					vertical: true,
					fontSize
				}
				)
				: null,
			logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableContacts)
				? m(NavButtonN, {
					label: "contacts_label",
					icon: () => BootIcons.Contacts,
					href: () => navButtonRoutes.contactsUrl,
					isSelectedPrefix: CONTACTS_PREFIX,
					vertical: true,
					fontSize
				}
				)
				: null,
			logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableCalendar)
				? m(NavButtonN, {
					label: 'calendar_label',
					icon: () => BootIcons.Calendar,
					href: CALENDAR_PREFIX,
					vertical: true,
					fontSize
				})
				: null,
		])
	}
}