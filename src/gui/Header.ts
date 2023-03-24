import m, { Children, ClassComponent, Vnode } from "mithril"
import { NavBar } from "./base/NavBar.js"
import { NavButton, NavButtonColor } from "./base/NavButton.js"
import { styles } from "./styles.js"
import type { Shortcut } from "../misc/KeyManager.js"
import { keyManager } from "../misc/KeyManager.js"
import { lang } from "../misc/LanguageViewModel.js"
import { theme } from "./theme.js"
import { FeatureType, Keys } from "../api/common/TutanotaConstants.js"
import { px, size as sizes } from "./size.js"
import { BootIcons } from "./base/icons/BootIcons.js"
import { CALENDAR_PREFIX, CONTACTS_PREFIX, MAIL_PREFIX, navButtonRoutes } from "../misc/RouteChange.js"
import { AriaLandmarks, landmarkAttrs } from "./AriaUtils.js"
import type { ViewSlider } from "./nav/ViewSlider.js"
import { assertMainOrNode } from "../api/common/Env.js"
import { OfflineIndicatorDesktop, OfflineIndicatorMobile } from "./base/OfflineIndicator.js"
import { OfflineIndicatorViewModel } from "./base/OfflineIndicatorViewModel.js"
import { ProgressBar } from "./base/ProgressBar.js"
import { CounterBadge } from "./base/CounterBadge.js"
import { SessionType } from "../api/common/SessionType.js"
import { NewsModel } from "../misc/news/NewsModel.js"
import { LoginController } from "../api/main/LoginController.js"
import { locator } from "../api/main/MainLocator.js"

const LogoutPath = "/login?noAutoLogin=true"
export const LogoutUrl: string = window.location.hash.startsWith("#mail") ? "/ext?noAutoLogin=true" + location.hash : LogoutPath
assertMainOrNode()

export interface BaseHeaderAttrs {
	newsModel: NewsModel
	offlineIndicatorModel: OfflineIndicatorViewModel
}

export interface HeaderAttrs extends BaseHeaderAttrs {
	viewSlider: ViewSlider | null
	headerView?: Children
	rightView?: Children
	handleBackPress?: () => boolean
	overrideBackIcon?: "back" | "menu"
	/** search bar, only rendered when NOT using bottom navigation */
	searchBar?: () => Children
	/** content in the center of the search bar, where title and offline status normally are */
	centerContent?: () => Children
}

export class Header implements ClassComponent<HeaderAttrs> {
	private shortcuts: Shortcut[] = this.setupShortcuts()

	view({ attrs }: Vnode<HeaderAttrs>): Children {
		// Do not return undefined if headerView is not present
		const injectedView = attrs.headerView
		return m(".header-nav.overflow-hidden.flex.items-end.flex-center", [
			isNotTemporary(locator.logins) ? m(ProgressBar, { progress: attrs.offlineIndicatorModel.getProgress() }) : null,
			injectedView
				? // Make sure this wrapper takes up the full height like the things inside it expect
				  m(".flex-grow.height-100p", injectedView)
				: [this.renderLeftContent(attrs), this.renderCenterContent(attrs), this.renderRightContent(attrs)],
			styles.isUsingBottomNavigation() &&
			locator.logins.isAtLeastPartiallyLoggedIn() &&
			!attrs.centerContent &&
			!injectedView &&
			isNotTemporary(locator.logins)
				? m(OfflineIndicatorMobile, attrs.offlineIndicatorModel.getCurrentAttrs())
				: null,
		])
	}

	oncreate(): void {
		keyManager.registerShortcuts(this.shortcuts)
	}

	onremove(): void {
		keyManager.unregisterShortcuts(this.shortcuts)
	}

	/**
	 * render the new mail/contact/event button in the top right of the one- and two-column layouts.
	 * @private
	 */
	private renderHeaderAction(attrs: HeaderAttrs): Children {
		return m(".header-right.pr-s.flex-end.items-center", attrs.rightView)
	}

	/**
	 * render the search and navigation bar in three-column layouts. if there is a navigation, also render an offline indicator.
	 * @private
	 */
	private renderFullNavigation(attrs: HeaderAttrs): Children {
		return m(
			".header-right.pr-l.mr-negative-m.flex-end.items-center",
			locator.logins.isAtLeastPartiallyLoggedIn()
				? [
						this.renderDesktopSearchBar(attrs),
						m(OfflineIndicatorDesktop, attrs.offlineIndicatorModel.getCurrentAttrs()),
						m(".nav-bar-spacer"),
						m(NavBar, this.renderButtons(attrs)),
				  ]
				: [this.renderDesktopSearchBar(attrs), m(NavBar, this.renderButtons(attrs))],
		)
	}

	private renderDesktopSearchBar(attrs: HeaderAttrs): Children {
		const searchBar = attrs.searchBar?.()
		return searchBar ? [searchBar, m(".nav-bar-spacer")] : null
	}

	private focusMain(attrs: HeaderAttrs) {
		attrs.viewSlider?.getMainColumn().focus()
	}

	private renderButtons(attrs: HeaderAttrs): Children {
		// We assign click listeners to buttons to move focus correctly if the view is already open
		return locator.logins.isInternalUserLoggedIn()
			? [
					m(NavButton, {
						label: "emails_label",
						icon: () => BootIcons.Mail,
						href: navButtonRoutes.mailUrl,
						isSelectedPrefix: MAIL_PREFIX,
						colors: NavButtonColor.Header,
						click: () => m.route.get() === navButtonRoutes.mailUrl && this.focusMain(attrs),
					}),
					!locator.logins.isEnabled(FeatureType.DisableContacts)
						? m(NavButton, {
								label: "contacts_label",
								icon: () => BootIcons.Contacts,
								href: navButtonRoutes.contactsUrl,
								isSelectedPrefix: CONTACTS_PREFIX,
								colors: NavButtonColor.Header,
								click: () => m.route.get() === navButtonRoutes.contactsUrl && this.focusMain(attrs),
						  })
						: null,
					!locator.logins.isEnabled(FeatureType.DisableCalendar)
						? m(NavButton, {
								label: "calendar_label",
								icon: () => BootIcons.Calendar,
								href: CALENDAR_PREFIX,
								colors: NavButtonColor.Header,
								click: () => m.route.get().startsWith(CALENDAR_PREFIX) && this.focusMain(attrs),
						  })
						: null,
			  ]
			: null
	}

	private setupShortcuts(): Shortcut[] {
		return [
			{
				key: Keys.M,
				enabled: () => locator.logins.isUserLoggedIn(),
				exec: (key) => m.route.set(navButtonRoutes.mailUrl),
				help: "mailView_action",
			},
			{
				key: Keys.C,
				enabled: () => locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableContacts),
				exec: (key) => m.route.set(navButtonRoutes.contactsUrl),
				help: "contactView_action",
			},
			{
				key: Keys.O,
				enabled: () => locator.logins.isInternalUserLoggedIn(),
				exec: (key) => m.route.set(navButtonRoutes.calendarUrl),
				help: "calendarView_action",
			},
			{
				key: Keys.S,
				enabled: () => locator.logins.isInternalUserLoggedIn(),
				exec: (key) => m.route.set(navButtonRoutes.settingsUrl),
				help: "settingsView_action",
			},
			{
				key: Keys.L,
				shift: true,
				ctrl: true,
				enabled: () => locator.logins.isUserLoggedIn(),
				exec: (key) => m.route.set(LogoutUrl),
				help: "logout_label",
			},
		]
	}

	private renderCenterContent(attrs: HeaderAttrs): Children {
		if (!styles.isUsingBottomNavigation()) return null

		const header = (title: string, left?: Children, right?: Children) => {
			return m(".flex-center.header-middle.b", [left || null, m(".mt-s.text-ellipsis", title), right || null])
		}

		if (attrs.centerContent) {
			return attrs.centerContent()
		} else if (attrs.viewSlider) {
			const firstVisibleBgColumn = attrs.viewSlider.getBackgroundColumns().find((c) => c.visible)

			if (firstVisibleBgColumn) {
				const title = firstVisibleBgColumn.getTitle()
				const buttonLeft = firstVisibleBgColumn.getTitleButtonLeft()
				const buttonRight = firstVisibleBgColumn.getTitleButtonRight()
				return header(title, buttonLeft, buttonRight)
			} else {
				return header("")
			}
		} else if (m.route.get().startsWith("/login")) {
			return header(lang.get("login_label"))
		} else if (m.route.get().startsWith("/signup")) {
			return header(lang.get("registrationHeadline_msg"))
		} else if (m.route.get().startsWith("/termination")) {
			return header(lang.get("termination_title"))
		} else {
			return null
		}
	}

	private renderRightContent(attrs: HeaderAttrs): Children {
		return isNotTemporary(locator.logins) ? (styles.isUsingBottomNavigation() ? this.renderHeaderAction(attrs) : this.renderFullNavigation(attrs)) : null
	}

	private renderLeftContent(attrs: HeaderAttrs): Children {
		const showBackButton = this.isBackButtonVisible(attrs)
		const showNewsIndicator = !showBackButton && styles.isUsingBottomNavigation()
		const liveNewsCount = attrs.newsModel.liveNewsIds.length
		const { viewSlider } = attrs

		const style = {
			"margin-left": styles.isUsingBottomNavigation() ? px(-15) : null, // manual margin to align the hamburger icon on mobile devices
			overflow: showNewsIndicator ? "visible" : "hidden", // Unsure whether we actually need overflow: visible here
		}

		let content: Children = null
		if (viewSlider && viewSlider.isFocusPreviousPossible()) {
			content = m("", [
				m(NavButton, {
					label: () => {
						const prevColumn = viewSlider.getPreviousColumn()
						return prevColumn ? prevColumn.getTitle() : ""
					},
					icon: () => (this.isBackButtonVisible(attrs) ? BootIcons.Back : BootIcons.MoreVertical),
					colors: NavButtonColor.Header,
					href: () => m.route.get(),
					click: () => {
						if (!attrs.handleBackPress?.()) {
							viewSlider.focusPreviousColumn()
						}
					},
					hideLabel: true,
				}),
				showNewsIndicator
					? m(CounterBadge, {
							count: liveNewsCount,
							position: {
								top: px(4),
								right: px(-3),
							},
							color: "white",
							background: theme.list_accent_fg,
					  })
					: null,
			])
		} else if (!styles.isUsingBottomNavigation() && (!viewSlider || viewSlider.isUsingOverlayColumns())) {
			content = m(
				".logo.logo-height",
				{
					...landmarkAttrs(AriaLandmarks.Banner, "Tutanota logo"),
					style: {
						"margin-left": px(sizes.drawer_menu_width),
					},
				},
				m.trust(theme.logo),
			) // the custom logo is already sanitized in theme.js
		}

		return m(".header-left.pl-l.ml-negative-s.flex-start.items-center", { style }, content)
	}

	/**
	 * Returns true iff the menu icon should be replaced by the back button.
	 * Calls overrideBackIcon().
	 */
	private isBackButtonVisible(attrs: HeaderAttrs): boolean {
		if (!attrs.viewSlider) {
			return false
		}

		return attrs.overrideBackIcon ? attrs.overrideBackIcon === "back" : !attrs.viewSlider.getBackgroundColumns()[0].visible
	}
}

/**
 * Useful to decide whether to display several elements.
 * @return true if the user is logged in with a non-temporary session, false otherwise
 */
function isNotTemporary(logins: LoginController): boolean {
	return logins.isUserLoggedIn() && logins.getUserController().sessionType !== SessionType.Temporary
}
