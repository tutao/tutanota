import m, { Children, ClassComponent, Vnode } from "mithril"
import { NavBar } from "./base/NavBar.js"
import { assertMainOrNode } from "../platform-kit/app-env"
import { OfflineIndicator } from "./base/OfflineIndicator.js"
import { ProgressBar } from "./base/ProgressBar.js"
import { DesktopBaseHeader } from "./base/DesktopBaseHeader.js"
import { layout_size } from "./size"
import { IOfflineIndicatorViewModel } from "./IOfflineIndicatorViewModel"
import { lazy } from "../platform-kit/utils"

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
	buttons: Children
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
				m(NavBar, attrs.buttons),
			]),
		]
	}
}
