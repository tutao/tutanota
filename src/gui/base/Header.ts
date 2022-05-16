import m, {Children, Component} from "mithril"
import {NavBar} from "./NavBar"
import {NavButtonColor, NavButtonN} from "./NavButtonN"
import {styles} from "../styles"
import {neverNull} from "@tutao/tutanota-utils"
import type {Shortcut} from "../../misc/KeyManager"
import {keyManager} from "../../misc/KeyManager"
import {lang} from "../../misc/LanguageViewModel"
import {logins} from "../../api/main/LoginController"
import {theme} from "../theme"
import {FeatureType, Keys} from "../../api/common/TutanotaConstants"
import {px, size as sizes} from "../size"
import {BootIcons} from "./icons/BootIcons"
import type {SearchBar} from "../../search/SearchBar"
import type {IMainLocator} from "../../api/main/MainLocator"
import {locator} from "../../api/main/MainLocator"
import {client} from "../../misc/ClientDetector"
import {CALENDAR_PREFIX, CONTACTS_PREFIX, MAIL_PREFIX, navButtonRoutes, SEARCH_PREFIX} from "../../misc/RouteChange"
import {AriaLandmarks, landmarkAttrs} from "../AriaUtils"
import type {ViewSlider} from "./ViewSlider"
import {assertMainOrNode} from "../../api/common/Env"
import {OfflineIndicatorDesktop, OfflineIndicatorMobile} from "./OfflineIndicator"
import {OfflineIndicatorViewModel} from "./OfflineIndicatorViewModel.js"
import {ProgressBar} from "./ProgressBar"

const LogoutPath = "/login?noAutoLogin=true"
export const LogoutUrl: string = location.hash.startsWith("#mail") ? "/ext?noAutoLogin=true" + location.hash : LogoutPath
assertMainOrNode()

export interface CurrentView extends Component {
	updateUrl(args: Record<string, any>, requestedPath: string): void

	readonly headerView?: () => Children
	readonly headerRightView?: () => Children
	readonly getViewSlider?: () => ViewSlider | null

	/** @return true if view handled press itself */
	readonly handleBackButton?: () => boolean

	/** @return true if "back/up" icon should be shown, false if menu icon */
	readonly overrideBackIcon?: () => boolean
}

class Header implements Component {
	searchBar: SearchBar | null = null

	private currentView: CurrentView | null = null // decoupled from ViewSlider implementation to reduce size of bootstrap bundle
	private readonly shortcuts: Shortcut[]
	private readonly offlineIndicatorModel = new OfflineIndicatorViewModel(
		locator.cacheStorage,
		locator.loginListener,
		locator.worker,
		logins,
		() => m.redraw()
	)

	constructor() {
		this.shortcuts = this.setupShortcuts()

		const worker = locator.worker
		this.offlineIndicatorModel.setWsStateStream(worker.wsConnection())
		worker.initialized.then(() => {
			import("../../search/SearchBar.js").then(({SearchBar}) => {
				this.searchBar = new SearchBar()
			})
			this.offlineIndicatorModel.setProgressUpdateStream(locator.progressTracker.onProgressUpdate)
		})
		// we may be able to remove this when we stop creating the Header with new
		this.view = this.view.bind(this)
		this.onremove = this.onremove.bind(this)
		this.oncreate = this.oncreate.bind(this)
	}

	view(): Children {
		// Do not return undefined if headerView is not present
		const injectedView = this.currentView?.headerView?.()
		return m(
			".header-nav.overflow-hidden.flex.items-end.flex-center",
			[
				m(ProgressBar, {progress: this.offlineIndicatorModel.getProgress()}),
				injectedView
					? m(".flex-grow", injectedView)
					: [
						this.renderLeftContent(),
						this.renderCenterContent(),
						this.renderRightContent()
					],
				styles.isUsingBottomNavigation() && logins.isAtLeastPartiallyLoggedIn() && !this.mobileSearchBarVisible()
					? m(OfflineIndicatorMobile, this.offlineIndicatorModel.getCurrentAttrs())
					: null
			],
		)
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
	private renderHeaderAction(): Children {
		return m(".header-right.pr-s.flex-end.items-center", this.currentView?.headerRightView?.())
	}

	/**
	 * render the search and navigation bar in three-column layouts. if there is a navigation, also render an offline indicator.
	 * @private
	 */
	private renderFullNavigation(): Children {
		return m(".header-right.pr-l.mr-negative-m.flex-end.items-center", logins.isAtLeastPartiallyLoggedIn()
			? [this.renderDesktopSearchBar(), m(OfflineIndicatorDesktop, this.offlineIndicatorModel.getCurrentAttrs()), m(".nav-bar-spacer"), m(NavBar, this.renderButtons())]
			: [this.renderDesktopSearchBar(), m(NavBar, this.renderButtons())]
		)
	}

	private renderDesktopSearchBar(): Children {
		return this.searchBar && this.desktopSearchBarVisible()
			? m(this.searchBar, {
				spacer: true,
				placeholder: this.searchPlaceholder(),
			})
			: null
	}

	private focusMain() {
		const viewSlider = this.currentView && this.currentView.getViewSlider && this.currentView.getViewSlider()

		viewSlider && viewSlider.getMainColumn().focus()
	}

	private renderButtons(): Children {
		// We assign click listeners to buttons to move focus correctly if the view is already open
		return logins.isInternalUserLoggedIn() && isNotSignup()
			? [
				m(NavButtonN, {
					label: "emails_label",
					icon: () => BootIcons.Mail,
					href: navButtonRoutes.mailUrl,
					isSelectedPrefix: MAIL_PREFIX,
					colors: NavButtonColor.Header,
					click: () => m.route.get() === navButtonRoutes.mailUrl && this.focusMain(),
				}),
				!logins.isEnabled(FeatureType.DisableContacts)
					? m(NavButtonN, {
						label: "contacts_label",
						icon: () => BootIcons.Contacts,
						href: navButtonRoutes.contactsUrl,
						isSelectedPrefix: CONTACTS_PREFIX,
						colors: NavButtonColor.Header,
						click: () => m.route.get() === navButtonRoutes.contactsUrl && this.focusMain(),
					})
					: null,
				!logins.isEnabled(FeatureType.DisableCalendar) && client.calendarSupported()
					? m(NavButtonN, {
						label: "calendar_label",
						icon: () => BootIcons.Calendar,
						href: CALENDAR_PREFIX,
						colors: NavButtonColor.Header,
						click: () => m.route.get().startsWith(CALENDAR_PREFIX) && this.focusMain(),
					})
					: null,
			]
			: null
	}

	private mobileSearchBarVisible(): boolean {
		let route = m.route.get()
		let locator: IMainLocator | null = window.tutao.locator
		return (
			this.searchBar != null &&
			locator != null &&
			!locator.search.indexState().initializing &&
			styles.isUsingBottomNavigation() &&
			logins.isInternalUserLoggedIn() &&
			route.startsWith(SEARCH_PREFIX)
		)
	}

	private setupShortcuts(): Shortcut[] {
		return [
			{
				key: Keys.M,
				enabled: () => logins.isUserLoggedIn(),
				exec: key => m.route.set(navButtonRoutes.mailUrl),
				help: "mailView_action",
			},
			{
				key: Keys.C,
				enabled: () => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableContacts),
				exec: key => m.route.set(navButtonRoutes.contactsUrl),
				help: "contactView_action",
			},
			{
				key: Keys.O,
				enabled: () => logins.isInternalUserLoggedIn(),
				exec: key => m.route.set(navButtonRoutes.calendarUrl),
				help: "calendarView_action",
			},
			{
				key: Keys.S,
				enabled: () => logins.isInternalUserLoggedIn(),
				exec: key => m.route.set(navButtonRoutes.settingsUrl),
				help: "settingsView_action",
			},
			{
				key: Keys.L,
				shift: true,
				ctrl: true,
				enabled: () => logins.isUserLoggedIn(),
				exec: key => m.route.set(LogoutUrl),
				help: "logout_label",
			},
		]
	}

	private renderCenterContent(): Children {
		if (!styles.isUsingBottomNavigation()) return null

		const viewSlider = this.getViewSlider()

		const header = (title: string, left?: Children, right?: Children) => {
			return m(".flex-center.header-middle.text-ellipsis.b", [left || null, m(".mt-s", title), right || null])
		}

		if (this.mobileSearchBarVisible()) {
			return this.renderMobileSearchBar()
		} else if (viewSlider) {
			const firstVisibleBgColumn = viewSlider.getBackgroundColumns().find(c => c.visible)

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

	private renderRightContent(): Children {
		return styles.isUsingBottomNavigation() ? this.renderHeaderAction() : this.renderFullNavigation()
	}

	private renderMobileSearchBar(): Children {
		let placeholder
		const route = m.route.get()

		if (route.startsWith("/search/mail")) {
			placeholder = lang.get("searchEmails_placeholder")
		} else if (route.startsWith("/search/contact")) {
			placeholder = lang.get("searchContacts_placeholder")
		} else {
			placeholder = null
		}

		return m(neverNull(this.searchBar), {
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

	private renderLeftContent(): Children {
		// manual margin to align the hamburger icon on mobile devices
		const style = styles.isUsingBottomNavigation()
			? {"margin-left": px(-15)}
			: null
		const viewSlider = this.getViewSlider()

		let content: Children = null
		if (viewSlider && viewSlider.isFocusPreviousPossible()) {
			content = m(NavButtonN, {
				label: () => {
					const prevColumn = viewSlider.getPreviousColumn()
					return prevColumn ? prevColumn.getTitle() : ""
				},
				icon: () =>
					(
						this.currentView && this.currentView.overrideBackIcon
							? this.currentView.overrideBackIcon()
							: !viewSlider.getBackgroundColumns()[0].visible
					)
						? BootIcons.Back
						: BootIcons.MoreVertical,
				colors: NavButtonColor.Header,
				href: () => m.route.get(),
				click: () => {
					if (!this.currentView || !this.currentView.handleBackButton || !this.currentView.handleBackButton()) {
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

	updateCurrentView(currentView: CurrentView) {
		this.currentView = currentView
	}

	getViewSlider(): ViewSlider | null {
		if (this.currentView && this.currentView.getViewSlider) {
			return this.currentView.getViewSlider()
		} else {
			return null
		}
	}

	private searchPlaceholder(): string | null {
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

	private desktopSearchBarVisible(): boolean {
		let route = m.route.get()
		let locator: IMainLocator | null = window.tutao.locator
		return (
			this.searchBar != null &&
			locator != null &&
			!locator.search.indexState().initializing &&
			styles.isDesktopLayout() &&
			logins.isInternalUserLoggedIn() &&
			(route.startsWith(SEARCH_PREFIX) ||
				route.startsWith(MAIL_PREFIX) ||
				route.startsWith(CONTACTS_PREFIX) ||
				route.startsWith("/settings/users") ||
				route.startsWith("/settings/groups") ||
				route.startsWith("/settings/whitelabelaccounts"))
		)
	}
}

function isNotSignup(): boolean {
	return !m.route.get().startsWith("/signup") && !m.route.get().startsWith("/giftcard")
}

export const header: Header = new Header()