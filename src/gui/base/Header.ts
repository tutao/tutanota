import m, {Children, Component, Vnode} from "mithril"
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
import {client} from "../../misc/ClientDetector"
import {CALENDAR_PREFIX, CONTACTS_PREFIX, MAIL_PREFIX, navButtonRoutes, SEARCH_PREFIX} from "../../misc/RouteChange"
import {AriaLandmarks, landmarkAttrs} from "../AriaUtils"
import type {ProgressTracker} from "../../api/main/ProgressTracker"
import type {ViewSlider} from "./ViewSlider"
import {assertMainOrNode} from "../../api/common/Env"
import {WsConnectionState} from "../../api/main/WorkerClient";

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

const PROGRESS_HIDDEN = -1
const PROGRESS_DONE = 1

class Header implements Component {
	searchBar: SearchBar | null = null
	oncreate: Component["oncreate"]
	onremove: Component["onremove"]

	private currentView: CurrentView | null = null // decoupled from ViewSlider implementation to reduce size of bootstrap bundle
	private readonly shortcuts: Shortcut[]
	private wsState = WsConnectionState.terminated
	private loadingProgress: number = PROGRESS_HIDDEN

	constructor() {
		this.shortcuts = this.setupShortcuts()
		this.oncreate = () => keyManager.registerShortcuts(this.shortcuts)
		this.onremove = () => keyManager.unregisterShortcuts(this.shortcuts)

		// load worker and search bar one after another because search bar uses worker.
		import("../../api/main/MainLocator").then(async ({locator}) => {
			await locator.initialized
			const worker = locator.worker
			worker.wsConnection().map(state => {
				this.wsState = state
				m.redraw()
			})
			await worker.initialized
			import("../../search/SearchBar.js").then(({SearchBar}) => {
				this.searchBar = new SearchBar()
			})
			const progressTracker: ProgressTracker = locator.progressTracker

			if (progressTracker.totalWork() !== 0) {
				this.loadingProgress = progressTracker.completedAmount()
			}

			progressTracker.onProgressUpdate.map(amount => {
				if (this.loadingProgress !== amount) {
					this.loadingProgress = amount
					m.redraw()

					if (this.loadingProgress >= PROGRESS_DONE) {
						// progress is done but we still want to finish the complete animation and then dismiss the progress bar.
						setTimeout(() => {
							this.loadingProgress = PROGRESS_HIDDEN
							m.redraw()
						}, 500)
					}
				}
			})
		})
	}

	view(): Children {
		// Do not return undefined if headerView is not present
		const injectedView = this.currentView && this.currentView.headerView
			? this.currentView.headerView()
			: null
		// manual margin to align the hamburger icon on mobile devices
		const style = styles.isUsingBottomNavigation()
			? {"margin-left": px(-15)}
			: null
		return m(
			".header-nav.overflow-hidden.flex.items-end.flex-center",
			[
				m(".abs.full-width", this.renderConnectionIndicator() || this.renderEntityEventProgress()),
				injectedView
					? m(".flex-grow", injectedView)
					: [
						m(".header-left.pl-l.ml-negative-s.flex-start.items-center.overflow-hidden", {style}, this.renderLeftElements()),
						styles.isUsingBottomNavigation() ? this.renderCenterContent() : null,
						styles.isUsingBottomNavigation() ? this.renderNewItemButton() : this.renderHeaderWidgets(),
					],
			],
		)
	}

	/**
	 * render the new mail/contact/event icon in the top right of the one- and two-column layouts
	 * @private
	 */
	private renderNewItemButton(): Children {
		return m(
			".header-right.pr-s.flex-end.items-center",
			this.currentView && this.currentView.headerRightView
				? this.currentView.headerRightView()
				: null
		)
	}

	/**
	 * render the search and navigation bar in three-column layouts
	 * @private
	 */
	private renderHeaderWidgets(): Children {
		return m(".header-right.pr-l.mr-negative-m.flex-end.items-center", [
			this.renderDesktopSearchBar(),
			m(NavBar, this.renderButtons()),
		])
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
		const viewSlider = this.getViewSlider()

		const header = (title: string, left?: Children, right?: Children) => {
			return m(".flex-center.header-middle.items-center.text-ellipsis.b", [left || null, title, right || null])
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

	private renderMobileSearchBar(): Vnode<any> {
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

	private renderLeftElements(): Children {
		const viewSlider = this.getViewSlider()

		if (viewSlider && viewSlider.isFocusPreviousPossible()) {
			return m(NavButtonN, {
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
		} else {
			if (!styles.isUsingBottomNavigation() && (!viewSlider || viewSlider.isUsingOverlayColumns())) {
				return m(
					".logo.logo-height.pl" + landmarkAttrs(AriaLandmarks.Banner, "Tutanota logo"),
					{
						style: {
							"margin-left": px(sizes.drawer_menu_width),
						},
					},
					m.trust(theme.logo),
				) // the custom logo is already sanitized in theme.js
			} else {
				return null
			}
		}
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

	private renderConnectionIndicator(): Children {
		if (this.wsState === WsConnectionState.connected || this.wsState === WsConnectionState.terminated) {
			return null
		} else {
			// Use key so that mithril does not reuse dom element and transition works correctly
			return m(".indefinite-progress", {
				key: "connection-indicator",
			})
		}
	}

	private renderEntityEventProgress(): Children {
		if (this.loadingProgress !== PROGRESS_HIDDEN) {
			// Use key so that mithril does not reuse dom element and transition works correctly
			return m(".accent-bg", {
				key: "loading-indicator",
				style: {
					transition: "width 500ms",
					width: this.loadingProgress * 100 + "%",
					height: "3px",
				},
			})
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