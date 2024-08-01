import m, { Children, ClassComponent, Vnode } from "mithril"
import { NavBar } from "./base/NavBar.js"
import { isSelectedPrefix, NavButton, NavButtonColor } from "./base/NavButton.js"
import { FeatureType } from "../api/common/TutanotaConstants.js"
import { BootIcons } from "./base/icons/BootIcons.js"
import { CALENDAR_PREFIX, CONTACTLIST_PREFIX, CONTACTS_PREFIX, MAIL_PREFIX } from "../misc/RouteChange.js"
import { assertMainOrNode } from "../api/common/Env.js"
import { OfflineIndicator } from "./base/OfflineIndicator.js"
import { OfflineIndicatorViewModel } from "./base/OfflineIndicatorViewModel.js"
import { NewsModel } from "../misc/news/NewsModel.js"
import { locator } from "../api/main/CommonLocator.js"
import { ProgressBar } from "./base/ProgressBar.js"
import { DesktopBaseHeader } from "./base/DesktopBaseHeader.js"

assertMainOrNode()

/** Attrs that are used by different header components in the app.  */
export interface AppHeaderAttrs {
	newsModel: NewsModel
	offlineIndicatorModel: OfflineIndicatorViewModel
}

export interface HeaderAttrs extends AppHeaderAttrs {
	rightView?: Children
	handleBackPress?: () => boolean
	/** search bar, only rendered when NOT using bottom navigation */
	searchBar?: () => Children
	/** content in the center of the search bar, where title and offline status normally are */
	centerContent?: () => Children
}

export class Header implements ClassComponent<HeaderAttrs> {
	view({ attrs }: Vnode<HeaderAttrs>): Children {
		return m(DesktopBaseHeader, [m(ProgressBar, { progress: attrs.offlineIndicatorModel.getProgress() }), this.renderNavigation(attrs)])
	}

	/**
	 * render the search and navigation bar in three-column layouts. if there is a navigation, also render an offline indicator.
	 * @private
	 */
	private renderNavigation(attrs: HeaderAttrs): Children {
		return m(".flex-grow.flex.justify-end.items-center", [
			attrs.searchBar ? attrs.searchBar() : null,
			m(OfflineIndicator, attrs.offlineIndicatorModel.getCurrentAttrs()),
			m(".nav-bar-spacer"),
			m(NavBar, this.renderButtons()),
		])
	}

	private renderButtons(): Children {
		// We assign click listeners to buttons to move focus correctly if the view is already open
		return [
			m(NavButton, {
				label: "emails_label",
				icon: () => BootIcons.Mail,
				href: MAIL_PREFIX,
				isSelectedPrefix: MAIL_PREFIX,
				colors: NavButtonColor.Header,
			}),
			// not available for external mailboxes
			locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableContacts)
				? m(NavButton, {
						label: "contacts_label",
						icon: () => BootIcons.Contacts,
						href: CONTACTS_PREFIX,
						isSelectedPrefix: isSelectedPrefix(CONTACTS_PREFIX) || isSelectedPrefix(CONTACTLIST_PREFIX),
						colors: NavButtonColor.Header,
				  })
				: null,
			// not available for external mailboxes
			locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableCalendar)
				? m(NavButton, {
						label: "calendar_label",
						icon: () => BootIcons.Calendar,
						href: CALENDAR_PREFIX,
						colors: NavButtonColor.Header,
						click: () => m.route.get().startsWith(CALENDAR_PREFIX),
				  })
				: null,
		]
	}
}
