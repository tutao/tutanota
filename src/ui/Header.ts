import m, { Children, ClassComponent, Vnode } from "mithril"
import { NavBar } from "./base/NavBar.js"
import { isSelectedPrefix, NavButton, NavButtonColor } from "./base/NavButton.js"
import { assertMainOrNode, FeatureType } from "../platform-kits/app-env"
import { CALENDAR_PREFIX, CONTACTLIST_PREFIX, CONTACTS_PREFIX, DRIVE_PREFIX, MAIL_PREFIX } from "./utils/RouteChange.js"
import { OfflineIndicator } from "./base/OfflineIndicator.js"
import { ProgressBar } from "./base/ProgressBar.js"
import { DesktopBaseHeader } from "./base/DesktopBaseHeader.js"
import { layout_size } from "./size"
import { Icons } from "./base/icons/Icons"
import { IOfflineIndicatorViewModel } from "./IOfflineIndicatorViewModel"
import { lazy } from "../platform-kits/utils"

assertMainOrNode()

/** Attrs that are used by different header components in the app.  */
export interface AppHeaderAttrs {
	newsItemsCount: lazy<number>
	offlineIndicatorModel: IOfflineIndicatorViewModel
}

export interface HeaderAttrs extends AppHeaderAttrs {
	rightView?: Children
	handleBackPress?: () => boolean
	/** search bar, only rendered when NOT using bottom navigation */
	searchBar?: () => Children
	/** content in the center of the search bar, where title and offline status normally are */
	centerContent?: () => Children
	/** adjusts the width of the logo display area, mostly so that the search bar is in the right place*/
	firstColWidth?: number
	isInternalUserLoggedIn: boolean
	isFeatureEnabled: (feature: FeatureType) => boolean
}

export class Header implements ClassComponent<HeaderAttrs> {
	view({ attrs }: Vnode<HeaderAttrs>): Children {
		return m(DesktopBaseHeader, { firstColWidth: attrs.firstColWidth ?? layout_size.first_col_max_width }, [
			m(ProgressBar, { progress: attrs.offlineIndicatorModel.getProgress() }),
			this.renderNavigation(attrs),
		])
	}

	/**
	 * render the search and navigation bar in three-column layouts. if there is a navigation, also render an offline indicator.
	 * @private
	 */
	private renderNavigation(attrs: HeaderAttrs): Children {
		return [
			attrs.searchBar ? m(".ml-4.flex-grow", attrs.searchBar()) : null,
			m(".flex-grow.flex.justify-end.items-center.pr-8", [
				m(OfflineIndicator, attrs.offlineIndicatorModel.getCurrentAttrs()),
				m(".nav-bar-spacer"),
				m(NavBar, this.renderButtons(attrs)),
			]),
		]
	}

	private renderButtons(attrs: HeaderAttrs): Children {
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
			attrs.isInternalUserLoggedIn && !attrs.isFeatureEnabled(FeatureType.DisableContacts)
				? m(NavButton, {
						label: "contacts_label",
						icon: () => Icons.PeopleFilled,
						href: CONTACTS_PREFIX,
						isSelectedPrefix: isSelectedPrefix(CONTACTS_PREFIX) || isSelectedPrefix(CONTACTLIST_PREFIX),
						colors: NavButtonColor.Header,
					})
				: null,
			// not available for external mailboxes
			attrs.isInternalUserLoggedIn && !attrs.isFeatureEnabled(FeatureType.DisableCalendar)
				? m(NavButton, {
						label: "calendar_label",
						icon: () => Icons.CalendarFilled,
						href: CALENDAR_PREFIX,
						colors: NavButtonColor.Header,
						click: () => m.route.get().startsWith(CALENDAR_PREFIX),
					})
				: null,
			attrs.isFeatureEnabled(FeatureType.DriveInternalBeta)
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
}
