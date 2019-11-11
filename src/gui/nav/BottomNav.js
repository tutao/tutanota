//@flow

import m from "mithril"
import {NavButtonN} from "../base/NavButtonN"
import {BootIcons} from "../base/icons/BootIcons"

type Attrs = {width: number}

export class BottomNav implements MComponent<Attrs> {
	view(vnode: Vnode<Attrs>): Children {
		return m("bottom-nav.flex.items-center.bottom-nav.z1", [
			m(NavButtonN, {
					label: 'emails_label',
					icon: () => BootIcons.Mail,
					href: () => "/mail",
					vertical: true,
				}
			),
			m(NavButtonN, {
					label: "search_label",
					icon: () => BootIcons.Search,
					href: "/search/mail",
					isSelectedPrefix: "/search",
					vertical: true,
				}
			),
			m(NavButtonN, {
					label: "contacts_label",
					icon: () => BootIcons.Contacts,
					href: "/contact",
					isSelectedPrefix: "/contact",
					vertical: true,
				}
			),
			m(NavButtonN, {
				label: 'calendar_label',
				icon: () => BootIcons.Calendar,
				href: () => "/calendar",
				vertical: true,
			}),
		])
	}
}