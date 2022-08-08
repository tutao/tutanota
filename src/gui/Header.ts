import m, {Children, Component, Vnode} from "mithril"
import {ProgressBar} from "./base/ProgressBar.js"
import {styles} from "./styles.js"
import {logins} from "../api/main/LoginController.js"
import {OfflineIndicatorDesktop, OfflineIndicatorMobile} from "./base/OfflineIndicator.js"
import {px, size as sizes} from "./size.js"
import {NavButton, NavButtonColor} from "./base/NavButton.js"
import {BootIcons} from "./base/icons/BootIcons.js"
import {AriaLandmarks, landmarkAttrs} from "./AriaUtils.js"
import {theme} from "./theme.js"
import {lang} from "../misc/LanguageViewModel.js"
import {ViewSlider} from "./nav/ViewSlider.js"
import {NavBar} from "./base/NavBar.js"
import {CALENDAR_PREFIX, CONTACTS_PREFIX, MAIL_PREFIX, navButtonRoutes, SEARCH_PREFIX} from "../misc/RouteChange.js"
import {SearchBar} from "../search/SearchBar.js"
import {FeatureType, Keys} from "../api/common/TutanotaConstants.js"
import type {IMainLocator} from "../api/main/MainLocator.js"
import {keyManager, Shortcut} from "../misc/KeyManager.js"
import {locator} from "../api/main/MainLocator.js"

const LogoutPath = "/login?noAutoLogin=true"
export const LogoutUrl: string = window.location.hash.startsWith("#mail") ? "/ext?noAutoLogin=true" + location.hash : LogoutPath

export class Header implements Component<void> {
	view(vnode: Vnode<void>): Children {
		return m(".header-nav.overflow-hidden.flex.items-end.flex-center",
			m(ProgressBar, {progress: window.tutao.locator?.offlineIndicatorModel.getProgress() ?? 0}),
			vnode.children
		)
	}
}

export interface DefaultHeaderAttrs {
	viewSlider?: ViewSlider | null
	mobileContentRight?: (() => Children) | null
	overrideBackIcon?: boolean
	handleBackButton?: () => boolean
}

export class DefaultHeader implements Component<DefaultHeaderAttrs> {

	private readonly shortcuts: Array<Shortcut> = [
		{
			key: Keys.M,
			enabled: () => logins.isUserLoggedIn(),
			exec: () => m.route.set(navButtonRoutes.mailUrl),
			help: "mailView_action",
		},
		{
			key: Keys.C,
			enabled: () => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableContacts),
			exec: () => m.route.set(navButtonRoutes.contactsUrl),
			help: "contactView_action",
		},
		{
			key: Keys.O,
			enabled: () => logins.isInternalUserLoggedIn(),
			exec: () => m.route.set(navButtonRoutes.calendarUrl),
			help: "calendarView_action",
		},
		{
			key: Keys.S,
			enabled: () => logins.isInternalUserLoggedIn(),
			exec: () => m.route.set(navButtonRoutes.settingsUrl),
			help: "settingsView_action",
		},
		{
			key: Keys.L,
			shift: true,
			ctrl: true,
			enabled: () => logins.isUserLoggedIn(),
			exec: () => m.route.set(LogoutUrl),
			help: "logout_label",
		},
	]

	oninit() {
		import("../api/main/MainLocator.js").then(async mod => {
			await mod.locator.initialized
			const worker = mod.locator.worker
			await worker.initialized
			// this is a bit silly but we can't access m in MainLocator.ts and we have to do this somewhere
			mod.locator.offlineIndicatorModel.setCallback(() => m.redraw())
		})
	}

	oncreate(): void {
		keyManager.registerShortcuts(this.shortcuts)
	}

	onremove(): void {
		keyManager.unregisterShortcuts(this.shortcuts)
	}

	view({attrs}: Vnode<DefaultHeaderAttrs>): Children {
		return m(Header, [
			this.renderLeftContent(attrs),
			this.renderCenterContent(attrs),
			styles.isUsingBottomNavigation()
				? m(".header-right.pr-s.flex-end.items-center", attrs.mobileContentRight?.())
				: this.renderFullNavigation(attrs),
			styles.isUsingBottomNavigation() && logins.isAtLeastPartiallyLoggedIn() && !this.isMobileSearchBarVisible()
				? m(OfflineIndicatorMobile, window.tutao.locator!.offlineIndicatorModel.getCurrentAttrs())
				: null
		])
	}
	private renderLeftContent(attrs: DefaultHeaderAttrs): Children {
		// manual margin to align the hamburger icon on mobile devices
		const style = styles.isUsingBottomNavigation()
			? {"margin-left": px(-15)}
			: null
		const viewSlider = attrs.viewSlider

		let content: Children = null
		if (viewSlider && viewSlider.isFocusPreviousPossible()) {
			content = m(NavButton, {
				label: () => {
					const prevColumn = viewSlider.getPreviousColumn()
					return prevColumn ? prevColumn.getTitle() : ""
				},
				icon: () => attrs.overrideBackIcon ?? !viewSlider.getBackgroundColumns()[0].visible
					? BootIcons.Back
					: BootIcons.MoreVertical,
				colors: NavButtonColor.Header,
				href: () => m.route.get(),
				click: () => {
					if (!attrs.handleBackButton?.()) {
						viewSlider.focusPreviousColumn()
					}
				},
				hideLabel: true,
			})
		} else if (!styles.isUsingBottomNavigation() && (!viewSlider || viewSlider.isUsingOverlayColumns())) {
			content = m(
				".logo.logo-height.pl" + landmarkAttrs(AriaLandmarks.Banner, "Tutanota logo"),
				{
					style: {
						"margin-left": px(sizes.drawer_menu_width),
					},
				},
				m.trust(theme.logo),
			) // the custom logo is already sanitized in theme.js
		}

		return m(".header-left.pl-l.ml-negative-s.flex-start.items-center.overflow-hidden", {style}, content)
	}

	private renderCenterContent(attrs: DefaultHeaderAttrs): Children {
		if (!styles.isUsingBottomNavigation()) return null

		const header = (title: string, left?: Children, right?: Children) => {
			return m(".flex-center.header-middle.text-ellipsis.b", [left || null, m(".mt-s", title), right || null])
		}

		if (this.isMobileSearchBarVisible()) {
			return this.renderMobileSearchBar()
		} else if (attrs.viewSlider) {
			const firstVisibleBgColumn = attrs.viewSlider.getBackgroundColumns().find(c => c.visible)

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
		} else {
			return null
		}
	}

	/**
	 * render the search and navigation bar in three-column layouts. if there is a navigation, also render an offline indicator.
	 * @private
	 */
	private renderFullNavigation(attrs: DefaultHeaderAttrs): Children {
		return m(".header-right.pr-l.mr-negative-m.flex-end.items-center",
			this.renderDesktopSearchBar(attrs),
			logins.isAtLeastPartiallyLoggedIn()
				? [
					m(OfflineIndicatorDesktop, window.tutao.locator!.offlineIndicatorModel.getCurrentAttrs()),
					m(".nav-bar-spacer"),
				]
				: null,
			this.renderNavBar(attrs)
		)
	}

	private renderDesktopSearchBar(attrs: DefaultHeaderAttrs): Children {
		return locator.searchBar && this.isDesktopSearchBarVisible()
			? m(locator.searchBar, {
				spacer: true,
				placeholder: this.getSearchPlaceholderText(),
			})
			: null
	}

	private renderNavBar(attrs: DefaultHeaderAttrs): Children {

		// We assign click listeners to buttons to move focus correctly if the view is already open
		const focus = () => attrs.viewSlider?.getMainColumn().focus()

		return m(NavBar,
			logins.isInternalUserLoggedIn() && isNotSignup()
				? [
					m(NavButton, {
						label: "emails_label",
						icon: () => BootIcons.Mail,
						href: navButtonRoutes.mailUrl,
						isSelectedPrefix: MAIL_PREFIX,
						colors: NavButtonColor.Header,
						click: () => m.route.get() === navButtonRoutes.mailUrl && focus(),
					}),
					!logins.isEnabled(FeatureType.DisableContacts)
						? m(NavButton, {
							label: "contacts_label",
							icon: () => BootIcons.Contacts,
							href: navButtonRoutes.contactsUrl,
							isSelectedPrefix: CONTACTS_PREFIX,
							colors: NavButtonColor.Header,
							click: () => m.route.get() === navButtonRoutes.contactsUrl && focus(),
						})
						: null,
					!logins.isEnabled(FeatureType.DisableCalendar)
						? m(NavButton, {
							label: "calendar_label",
							icon: () => BootIcons.Calendar,
							href: CALENDAR_PREFIX,
							colors: NavButtonColor.Header,
							click: () => m.route.get().startsWith(CALENDAR_PREFIX) && focus(),
						})
						: null,
				]
				: null
		)
	}

	private getSearchPlaceholderText(): string | null {
		const route = m.route.get()

		if (route.startsWith(MAIL_PREFIX) || route.startsWith("/search/mail")) {
			return lang.get("searchEmails_placeholder")
		} else if (route.startsWith(CONTACTS_PREFIX) || route.startsWith("/search/contact")) {
			return lang.get("searchContacts_placeholder")
		} else if (route.startsWith("/settings/users")) {
			return lang.get("searchUsers_placeholder")
		} else if (route.startsWith("/settings/groups")) {
			return lang.get("searchGroups_placeholder")
		} else {
			return null
		}
	}

	private renderMobileSearchBar(): Children {
		const route = m.route.get()

		const placeholder = route.startsWith("/search/mail")
			? lang.get("searchEmails_placeholder")
			: route.startsWith("/search/contact")
				? lang.get("searchContacts_placeholder")
				: null

		return m(locator.searchBar!, {
			alwaysExpanded: true,
			classes: ".flex-center",
			placeholder,
			style: {
				height: "100%",
				"margin-left": px(sizes.navbar_edge_width_mobile),
				"margin-right": px(sizes.navbar_edge_width_mobile),
			},
		})
	}


	private isDesktopSearchBarVisible(): boolean {
		const route = m.route.get()
		const locator: IMainLocator | null = window.tutao.locator
		return locator?.searchBar != null
			&& !locator.search.indexState().initializing
			&& styles.isDesktopLayout()
			&& logins.isInternalUserLoggedIn()
			&& (
				route.startsWith(SEARCH_PREFIX)
				|| route.startsWith(MAIL_PREFIX)
				|| route.startsWith(CONTACTS_PREFIX)
				|| route.startsWith("/settings/users")
				|| route.startsWith("/settings/groups")
				|| route.startsWith("/settings/whitelabelaccounts")
			)
	}


	private isMobileSearchBarVisible(): boolean {
		const locator = window.tutao.locator
		return  locator?.searchBar != null
			&& !locator.search.indexState().initializing
			&& styles.isUsingBottomNavigation()
			&& logins.isInternalUserLoggedIn()
			&& m.route.get().startsWith(SEARCH_PREFIX)

	}
}

function isNotSignup(): boolean {
	return !m.route.get().startsWith("/signup") && !m.route.get().startsWith("/giftcard")
}
