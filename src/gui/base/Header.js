// @flow
import m from "mithril"
import {NavBar} from "./NavBar"
import type {NavButtonAttrs} from "./NavButtonN"
import {NavButtonColors, NavButtonN} from "./NavButtonN"
import {styles} from "../styles"
import {asyncImport, neverNull} from "../../api/common/utils/Utils"
import {keyManager, Keys} from "../../misc/KeyManager"
import {lang} from "../../misc/LanguageViewModel"
import {logins} from "../../api/main/LoginController"
import {theme} from "../theme"
import {FeatureType} from "../../api/common/TutanotaConstants"
import {px, size as sizes} from "../size"
import {assertMainOrNodeBoot, isDesktop} from "../../api/Env"
import {BootIcons} from "./icons/BootIcons"
import type {SearchBar} from "../../search/SearchBar"
import type {MainLocatorType} from "../../api/main/MainLocator"
import type {WorkerClient} from "../../api/main/WorkerClient";
import {client} from "../../misc/ClientDetector"
import {routes} from "../../misc/RouteChange"

const LogoutPath = '/login?noAutoLogin=true'
export const LogoutUrl = location.hash.startsWith("#mail")
	? "/ext?noAutoLogin=true" + location.hash
	: isDesktop()
		? '?r=' + encodeURIComponent(LogoutPath)
		: LogoutPath

assertMainOrNodeBoot()

export interface CurrentView extends Component {
	+headerView?: () => Children;
	+getViewSlider?: () => ?IViewSlider;
	/** @return true if view handled press itself */
	+handleBackButton?: () => boolean;
	+backButtonLabelShown?: () => boolean;
}

class Header {
	buttonBar: NavBar;
	view: Function;
	_currentView: ?CurrentView;  // decoupled from ViewSlider implementation to reduce size of bootstrap bundle
	oncreate: Function;
	onbeforeremove: Function;
	_shortcuts: Shortcut[];
	mailNavButton: NavButtonAttrs;
	searchBar: ?SearchBar
	_wsState: WsConnectionState = "terminated"

	constructor() {
		this._currentView = null
		let premiumUrl = '/settings/premium'

		const isNotSignup = () => {
			return !m.route.get().startsWith("/signup")
		}

		const searchViewButton: NavButtonAttrs = {
			label: "search_label",
			icon: () => BootIcons.Search,
			href: "/search",
			isSelectedPrefix: "/search",
			isVisible: () => isNotSignup() && logins.isInternalUserLoggedIn() && !styles.isDesktopLayout(),
			click: () => {
				const route = m.route.get()
				let url
				if (route.startsWith(routes.contactsUrl) || route.startsWith("/search/contact")) {
					url = "/search/contact"
				} else {
					url = "/search/mail"
				}
				m.route.set(url)
			}
		}

		this.mailNavButton = {
			label: 'emails_label',
			icon: () => BootIcons.Mail,
			href: () => routes.mailsUrl,
			isSelectedPrefix: routes.mailsUrl,
			isVisible: () => isNotSignup() && logins.isInternalUserLoggedIn()
		}

		this.buttonBar = new NavBar()
			.addButton(searchViewButton)
			.addButton(this.mailNavButton, 0, false)
			.addButton({
				label: 'contacts_label',
				icon: () => BootIcons.Contacts,
				href: () => routes.contactsUrl,
				isSelectedPrefix: routes.contactsUrl,
				isVisible: () => isNotSignup() && logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableContacts),
			})
			.addButton({
				label: "calendar_label",
				icon: () => BootIcons.Calendar,
				href: "/calendar",
				isVisible: () => isNotSignup() && logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableCalendar)
					&& client.calendarSupported()
			})

		this._setupShortcuts()

		this.view = (): VirtualElement => {
			// Do not return undefined if headerView is not present
			const injectedView = this._currentView && this._currentView.headerView ?
				this._currentView.headerView() : null
			return m(".header-nav.overflow-hidden", [this._connectionIndicator()].concat(injectedView || [
				m(".header-left.pl-l.ml-negative-s.flex-start.items-center.overflow-hidden", {
					style: styles.isDesktopLayout() ? null : {'margin-left': px(-15)}  // manual margin to align the hamburger icon on mobile devices
				}, this._getLeftElements()),
				styles.isDesktopLayout() ? null : this._getCenterContent(),
				styles.isUsingBottomNavigation()
					? null
					: m(".header-right.pr-l.mr-negative-m.flex-end.items-center", {
						style: styles.isDesktopLayout() ? null : {'margin-right': px(-18)} // manual margin to align the hamburger icon on mobile devices
					}, m(this.buttonBar))
			]))
		}

		asyncImport(typeof module !== "undefined" ?
			module.id : __moduleName, `${env.rootPathPrefix}src/search/SearchBar.js`)
			.then((searchBarModule) => {
				this.searchBar = new searchBarModule.SearchBar()
			})

		asyncImport(typeof module !== "undefined" ?
			module.id : __moduleName, `${env.rootPathPrefix}src/api/main/WorkerClient.js`)
			.then(workerClientModule => {
				(workerClientModule.worker: WorkerClient).wsConnection().map(state => {
					this._wsState = state
					m.redraw()
				})
			})
	}

	_searchBarVisible(): boolean {
		let route = m.route.get()
		let locator: ?MainLocatorType = window.tutao.locator
		return this.searchBar != null
			&& locator != null
			&& !locator.search.indexState().initializing
			&& !styles.isDesktopLayout()
			&& logins.isInternalUserLoggedIn()
			&& (route.startsWith("/search"))
	}

	_setupShortcuts() {
		this._shortcuts = [
			{
				key: Keys.M,
				enabled: () => logins.isUserLoggedIn(),
				exec: key => m.route.set(routes.mailsUrl),
				help: "mailView_action"
			},
			{
				key: Keys.C,
				enabled: () => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableContacts),
				exec: key => m.route.set(routes.contactsUrl),
				help: "contactView_action"
			},
			{
				key: Keys.S,
				enabled: () => logins.isInternalUserLoggedIn(),
				exec: key => m.route.set(routes.settingsUrl),
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
		this.onbeforeremove = () => keyManager.unregisterShortcuts(this._shortcuts)
	}


	_getCenterContent(): Vnode<mixed> | null {
		const viewSlider = this._getViewSlider()
		const header = (title: string) => m(".flex-center.header-middle.items-center.text-ellipsis.b", title)
		if (this._searchBarVisible()) {
			return this._searchBar()
		} else if (viewSlider) {
			return header(viewSlider.focusedColumn.getTitle())
		} else if (m.route.get().startsWith('/login')) {
			return header(lang.get("login_label"))
		} else if (m.route.get().startsWith('/signup')) {
			return header(lang.get("registrationHeadline_msg"))
		} else {
			return null
		}
	}

	_searchBar(): Vnode<any> {
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
				label: () => neverNull(viewSlider.getPreviousColumn()).getTitle(),
				icon: () => viewSlider.getBackgroundColumns()[0].visible
					? BootIcons.MoreVertical
					: BootIcons.Back,
				colors: NavButtonColors.Header,
				href: () => m.route.get(),
				click: () => {
					if (!this._currentView || !this._currentView.handleBackButton || !this._currentView.handleBackButton()) {
						viewSlider.focusPreviousColumn()
					}
				},
				hideLabel: this._currentView && this._currentView.backButtonLabelShown ? !this._currentView.backButtonLabelShown() : true,
			})
		} else {
			if (styles.isDesktopLayout()) {
				return [m(".logo.logo-height.pl-button", m.trust(theme.logo))] // the custom logo is already sanitized in theme.js
			} else {
				return []
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
			return m(".indefinite-progress")
		}
	}
}

export const header: Header = new Header()
