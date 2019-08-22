// @flow
import m from "mithril"
import {NavBar} from "./NavBar"
import {NavButtonColors, NavButtonN} from "./NavButtonN"
import {styles} from "../styles"
import {asyncImport, neverNull} from "../../api/common/utils/Utils"
import type {Shortcut} from "../../misc/KeyManager"
import {keyManager} from "../../misc/KeyManager"
import {lang} from "../../misc/LanguageViewModel"
import {logins} from "../../api/main/LoginController"
import {theme} from "../theme"
import {FeatureType, Keys} from "../../api/common/TutanotaConstants"
import {px, size as sizes} from "../size"
import {assertMainOrNodeBoot, isDesktop} from "../../api/Env"
import {BootIcons} from "./icons/BootIcons"
import type {SearchBar} from "../../search/SearchBar"
import type {MainLocatorType} from "../../api/main/MainLocator"
import type {WorkerClient} from "../../api/main/WorkerClient";
import {client} from "../../misc/ClientDetector"
import {CALENDAR_PREFIX, CONTACTS_PREFIX, MAIL_PREFIX, navButtonRoutes, SEARCH_PREFIX} from "../../misc/RouteChange"
import {AriaLandmarks, landmarkAttrs} from "../../api/common/utils/AriaUtils"

const LogoutPath = '/login?noAutoLogin=true'
export const LogoutUrl: string = location.hash.startsWith("#mail")
	? "/ext?noAutoLogin=true" + location.hash
	: isDesktop()
		? '?r=' + encodeURIComponent(LogoutPath)
		: LogoutPath

assertMainOrNodeBoot()

export interface CurrentView extends Component {
	+headerView?: () => Children;
	+headerRightView?: () => Children;
	+getViewSlider?: () => ?IViewSlider;
	/** @return true if view handled press itself */
	+handleBackButton?: () => boolean;
	/** @return true if "back/up" icon should be shown, false if menu icon */
	+overrideBackIcon?: () => boolean;
}

class Header {
	view: Function;
	_currentView: ?CurrentView;  // decoupled from ViewSlider implementation to reduce size of bootstrap bundle
	oncreate: Function;
	onremove: Function;
	_shortcuts: Shortcut[];
	searchBar: ?SearchBar
	_wsState: WsConnectionState = "terminated"
	_updateEntityEventProgress: number = -1

	constructor() {
		this._currentView = null
		this._setupShortcuts()

		this.view = (): VirtualElement => {
			// Do not return undefined if headerView is not present
			const injectedView = this._currentView && this._currentView.headerView ?
				this._currentView.headerView() : null
			return m(".header-nav.overflow-hidden.flex.items-end.flex-center", [
				m(".abs.full-width",
					this._connectionIndicator() || this._entityEventProgress())
			].concat(injectedView
				? m(".flex-grow", injectedView)
				: [
					m(".header-left.pl-l.ml-negative-s.flex-start.items-center.overflow-hidden", {
						style: styles.isUsingBottomNavigation() ? {'margin-left': px(-15)} : null  // manual margin to align the hamburger icon on mobile devices
					}, this._getLeftElements()),
					(styles.isUsingBottomNavigation() ? this._getCenterContent() : null),
					styles.isUsingBottomNavigation()
						? m(".header-right.pr-s.flex-end.items-center",
						this._currentView && this._currentView.headerRightView ? this._currentView.headerRightView() : null)
						: m(".header-right.pr-l.mr-negative-m.flex-end.items-center", [
							this._renderDesktopSearchBar(),
							m(NavBar, this._renderButtons(isNotSignup()))
						])
				]))
		}


		// load worker and search bar one after another because search bar uses worker.
		asyncImport(typeof module !== "undefined" ?
			module.id : __moduleName, `${env.rootPathPrefix}src/api/main/WorkerClient.js`)
			.then(workerClientModule => {
				const worker = (workerClientModule.worker: WorkerClient)
				worker.wsConnection().map(state => {
					this._wsState = state
					m.redraw()
				})
				worker.updateEntityEventProgress().map(state => {
					if (this._updateEntityEventProgress !== state) {
						this._updateEntityEventProgress = state
						m.redraw()
						if (this._updateEntityEventProgress === 100) {
							setTimeout(() => {
								this._updateEntityEventProgress = -1
								m.redraw()
							}, 500)
						}
					}
				})
				worker.initialized.then(() => {
					asyncImport(typeof module !== "undefined" ?
						module.id : __moduleName, `${env.rootPathPrefix}src/search/SearchBar.js`)
						.then((searchBarModule) => {
							this.searchBar = new searchBarModule.SearchBar()
						})
				})
			})
	}

	_renderDesktopSearchBar(): Children {
		return this.searchBar && this._desktopSearchBarVisible()
			? m(this.searchBar, {
				spacer: true,
				placeholder: this._searchPlaceholder(),
			})
			: null
	}

	_focusMain() {
		const viewSlider = this._currentView && this._currentView.getViewSlider && this._currentView.getViewSlider()
		viewSlider && viewSlider.getMainColumn().focus()
	}

	_renderButtons(isNotSignup: boolean): Children {
		// We assign click listeners to buttons to move focus correctly if the view is already open
		return [
			isNotSignup && logins.isInternalUserLoggedIn()
				? m(NavButtonN, {
					label: 'emails_label',
					icon: () => BootIcons.Mail,
					href: navButtonRoutes.mailUrl,
					isSelectedPrefix: MAIL_PREFIX,
					colors: NavButtonColors.Header,
					click: () => m.route.get() === navButtonRoutes.mailUrl && this._focusMain()
				})
				: null,
			isNotSignup && logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableContacts)
				? m(NavButtonN, {
					label: 'contacts_label',
					icon: () => BootIcons.Contacts,
					href: navButtonRoutes.contactsUrl,
					isSelectedPrefix: CONTACTS_PREFIX,
					colors: NavButtonColors.Header,
					click: () => m.route.get() === navButtonRoutes.contactsUrl && this._focusMain()
				})
				: null,
			isNotSignup && logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableCalendar) && client.calendarSupported()
				? m(NavButtonN, {
					label: "calendar_label",
					icon: () => BootIcons.Calendar,
					href: CALENDAR_PREFIX,
					colors: NavButtonColors.Header,
					click: () => m.route.get().startsWith(CALENDAR_PREFIX) && this._focusMain()
				})
				: null
		]
	}

	_mobileSearchBarVisible(): boolean {
		let route = m.route.get()
		let locator: ?MainLocatorType = window.tutao.locator
		return this.searchBar != null
			&& locator != null
			&& !locator.search.indexState().initializing
			&& styles.isUsingBottomNavigation()
			&& logins.isInternalUserLoggedIn()
			&& (route.startsWith(SEARCH_PREFIX))
	}

	_setupShortcuts() {
		this._shortcuts = [
			{
				key: Keys.M,
				enabled: () => logins.isUserLoggedIn(),
				exec: key => m.route.set(navButtonRoutes.mailUrl),
				help: "mailView_action"
			},
			{
				key: Keys.C,
				enabled: () => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableContacts),
				exec: key => m.route.set(navButtonRoutes.contactsUrl),
				help: "contactView_action"
			},
			{
				key: Keys.O,
				enabled: () => logins.isInternalUserLoggedIn(),
				exec: key => m.route.set(navButtonRoutes.calendarUrl),
				help: "calendarView_action"
			},
			{
				key: Keys.S,
				enabled: () => logins.isInternalUserLoggedIn(),
				exec: key => m.route.set(navButtonRoutes.settingsUrl),
				help: "settingsView_action"
			},
			{
				key: Keys.L,
				shift: true,
				ctrl: true,
				enabled: () => logins.isUserLoggedIn(),
				exec: key => m.route.set(LogoutUrl),
				help: "logout_label"
			},
		]

		this.oncreate = () => keyManager.registerShortcuts(this._shortcuts)
		this.onremove = () => keyManager.unregisterShortcuts(this._shortcuts)
	}


	_getCenterContent(): Children {
		const viewSlider = this._getViewSlider()
		const header = (title: string) => m(".flex-center.header-middle.items-center.text-ellipsis.b", title)
		if (this._mobileSearchBarVisible()) {
			return this._renderMobileSearchBar()
		} else if (viewSlider) {
			const fistVisibleBgColumn = viewSlider.getBackgroundColumns().find(c => c.visible)
			const title = fistVisibleBgColumn ? fistVisibleBgColumn.getTitle() : ""
			return header(title)
		} else if (m.route.get().startsWith('/login')) {
			return header(lang.get("login_label"))
		} else if (m.route.get().startsWith('/signup')) {
			return header(lang.get("registrationHeadline_msg"))
		} else {
			return null
		}
	}

	_renderMobileSearchBar(): Vnode<any> {
		let placeholder;
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
				"margin-right": px(sizes.navbar_edge_width_mobile)
			}
		})
	}

	_getLeftElements(): Children {
		const viewSlider = this._getViewSlider()
		if (viewSlider && viewSlider.isFocusPreviousPossible()) {
			return m(NavButtonN, {
				label: () => {
					const prevColumn = viewSlider.getPreviousColumn()
					return prevColumn ? prevColumn.getTitle() : ""
				},
				icon: () => (this._currentView
				&& this._currentView.overrideBackIcon ? this._currentView.overrideBackIcon() : !viewSlider.getBackgroundColumns()[0].visible)
					? BootIcons.Back
					: BootIcons.MoreVertical,
				colors: NavButtonColors.Header,
				href: () => m.route.get(),
				click: () => {
					if (!this._currentView || !this._currentView.handleBackButton || !this._currentView.handleBackButton()) {
						viewSlider.focusPreviousColumn()
					}
				},
				hideLabel: true,
			})
		} else {
			if (!styles.isUsingBottomNavigation() && (!viewSlider || viewSlider.isUsingOverlayColumns())) {
				return m(".logo.logo-height.pl" + landmarkAttrs(AriaLandmarks.Banner, "Tutanota logo"), {
					style: {
						"margin-left": px(sizes.drawer_menu_width)
					},
				}, m.trust(theme.logo)) // the custom logo is already sanitized in theme.js
			} else {
				return null
			}
		}
	}

	updateCurrentView(currentView: CurrentView) {
		this._currentView = currentView
	}

	_getViewSlider(): ?IViewSlider {
		if (this._currentView && this._currentView.getViewSlider) {
			return this._currentView.getViewSlider()
		} else {
			return null
		}
	}

	_connectionIndicator(): Children {
		if (this._wsState === "connected" || this._wsState === "terminated") {
			return null
		} else {
			// Use key so that mithril does not reuse dom element and transition works correctly
			return m(".indefinite-progress", {key: "connection-indicator"})
		}
	}

	_entityEventProgress(): Children {
		if (this._updateEntityEventProgress !== -1) {
			// Use key so that mithril does not reuse dom element and transition works correctly
			return m(".accent-bg", {
				key: "loading-indicator",
				style: {
					transition: 'width 500ms',
					width: this._updateEntityEventProgress + '%',
					height: '3px',
				},
			})
		} else {
			return null
		}
	}

	_searchPlaceholder(): ?string {
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

	_desktopSearchBarVisible(): boolean {
		let route = m.route.get()
		let locator: ?MainLocatorType = window.tutao.locator
		return this.searchBar != null && locator != null && !locator.search.indexState().initializing
			&& styles.isDesktopLayout()
			&& logins.isInternalUserLoggedIn()
			&& (route.startsWith(SEARCH_PREFIX)
				|| route.startsWith(MAIL_PREFIX)
				|| route.startsWith(CONTACTS_PREFIX)
				|| route.startsWith("/settings/users")
				|| route.startsWith("/settings/groups")
				|| route.startsWith("/settings/whitelabelaccounts"))
	}
}

function isNotSignup(): boolean {
	return !m.route.get().startsWith("/signup")
}

export const header: Header = new Header()
