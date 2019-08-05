// @flow
import m from "mithril"
import {NavBar} from "./NavBar"
import {NavButton, NavButtonColors} from "./NavButton"
import {styles} from "../styles"
import {asyncImport, neverNull} from "../../api/common/utils/Utils"
import {keyManager, Keys} from "../../misc/KeyManager"
import {lang} from "../../misc/LanguageViewModel"
import {logins} from "../../api/main/LoginController"
import {theme} from "../theme"
import {FeatureType} from "../../api/common/TutanotaConstants"
import {px, size as sizes} from "../size"
import {assertMainOrNodeBoot, isDesktop, isIOSApp} from "../../api/Env"
import {BootIcons} from "./icons/BootIcons"
import type {SearchBar} from "../../search/SearchBar"
import type {MainLocatorType} from "../../api/main/MainLocator"
import type {WorkerClient} from "../../api/main/WorkerClient";
import type {SubscriptionTypeEnum} from "../../subscription/SubscriptionUtils"
import {client} from "../../misc/ClientDetector"


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
	contactsUrl: string;
	mailsUrl: string;
	settingsUrl: string;
	_currentView: ?CurrentView;  // decoupled from ViewSlider implementation to reduce size of bootstrap bundle
	oncreate: Function;
	onbeforeremove: Function;
	_shortcuts: Shortcut[];
	mailNavButton: NavButton;
	searchBar: ?SearchBar
	_wsState: WsConnectionState = "terminated"

	constructor() {
		this.contactsUrl = '/contact'
		this.mailsUrl = '/mail'
		this.settingsUrl = '/settings'
		this._currentView = null
		let premiumUrl = '/settings/premium'

		const isNotSignup = () => {
			return !m.route.get().startsWith("/signup")
		}

		let searchViewButton = new NavButton("search_label", () => BootIcons.Search, "/search", "/search") // the href is just a dummy value here
			.setIsVisibleHandler(() => isNotSignup() && logins.isInternalUserLoggedIn() && !styles.isDesktopLayout())
			.setClickHandler(() => {
				const route = m.route.get()
				let url
				if (route.startsWith(this.contactsUrl) || route.startsWith("/search/contact")) {
					url = "/search/contact"
				} else {
					url = "/search/mail"
				}
				m.route.set(url)
			})

		this.mailNavButton = new NavButton('emails_label', () => BootIcons.Mail, () => this.mailsUrl, this.mailsUrl)
			.setIsVisibleHandler(() => isNotSignup() && logins.isInternalUserLoggedIn())

		this.buttonBar = new NavBar()
			.addButton(searchViewButton)
			.addButton(this.mailNavButton, 0, false)
			.addButton(new NavButton('contacts_label', () => BootIcons.Contacts, () => this.contactsUrl, this.contactsUrl)
				.setIsVisibleHandler(() => isNotSignup() && logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableContacts)))
			.addButton(new NavButton("calendar_label", () => BootIcons.Calendar, "/calendar", "/calendar")
				.setIsVisibleHandler(() => isNotSignup() && logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableCalendar)
					&& client.calendarSupported()))
			.addButton(new NavButton('upgradePremium_label', () => BootIcons.Premium, () => m.route.get(), premiumUrl)
				.setIsVisibleHandler(() => isNotSignup() && logins.isGlobalAdminUserLoggedIn() && !isIOSApp() && logins.getUserController().isFreeAccount())
				.setClickHandler(() => this._showUpgradeDialog()), 0, false)
			.addButton(new NavButton('invite_alt', () => BootIcons.Share, () => m.route.get())
				.setIsVisibleHandler(() => isNotSignup() && logins.isGlobalAdminUserLoggedIn())
				.setClickHandler(() => this._writeInviteMail()), 0, true)
			.addButton(new NavButton('community_label', () => BootIcons.Heart, 'https://tutanota.com/community')
				.setIsVisibleHandler(() => isNotSignup() && logins.isGlobalAdminUserLoggedIn()), 0, true)
			.addButton(new NavButton('settings_label', () => BootIcons.Settings, () => this.settingsUrl, this.settingsUrl)
				.setIsVisibleHandler(() => isNotSignup() && logins.isInternalUserLoggedIn()), 0, false)
			.addButton(new NavButton('supportMenu_label', () => BootIcons.Help, () => m.route.get())
				.setIsVisibleHandler(() => isNotSignup() && logins.isGlobalAdminUserLoggedIn() && logins.getUserController().isPremiumAccount())
				.setClickHandler(() => this._writeSupportMail()), 0, true)
			.addButton(new NavButton('logout_label', () => BootIcons.Logout, LogoutUrl)
				.setIsVisibleHandler(() => isNotSignup() && logins.isUserLoggedIn()), 0, true)


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
				m(".header-right.pr-l.mr-negative-m.flex-end.items-center", {
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
				exec: key => m.route.set(this.mailsUrl),
				help: "mailView_action"
			},
			{
				key: Keys.C,
				enabled: () => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableContacts),
				exec: key => m.route.set(this.contactsUrl),
				help: "contactView_action"
			},
			{
				key: Keys.S,
				enabled: () => logins.isInternalUserLoggedIn(),
				exec: key => m.route.set(this.settingsUrl),
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

	_showUpgradeDialog() {
		asyncImport(typeof module !== "undefined" ?
			module.id : __moduleName, `${env.rootPathPrefix}src/subscription/UpgradeSubscriptionWizard.js`)
			.then(upgradeWizard => {
					// To not import constant
					let subscriptionType: SubscriptionTypeEnum = 'Free'
					return upgradeWizard.showUpgradeWizard(subscriptionType)
				}
			)
	}

	_writeSupportMail() {
		asyncImport(typeof module !== "undefined" ?
			module.id : __moduleName, `${env.rootPathPrefix}src/mail/MailEditor.js`)
			.then(mailEditorModule => mailEditorModule.MailEditor.writeSupportMail())
	}

	_writeInviteMail() {
		asyncImport(typeof module !== "undefined" ?
			module.id : __moduleName, `${env.rootPathPrefix}src/mail/MailEditor.js`)
			.then(mailEditorModule => mailEditorModule.MailEditor.writeInviteMail())
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

	_getLeftElements() {
		const viewSlider = this._getViewSlider()
		if (viewSlider && viewSlider.isFocusPreviousPossible()) {
			let navButtonBack = new NavButton(() => neverNull(viewSlider.getPreviousColumn()).getTitle(),
				() => BootIcons.Back,
				() => m.route.get())
				.setColors(NavButtonColors.Header)
				.setClickHandler(() => {
					if (!this._currentView || !this._currentView.handleBackButton || !this._currentView.handleBackButton()) {
						viewSlider.focusPreviousColumn()
					}
				})
				.setHideLabel(this._currentView && this._currentView.backButtonLabelShown ? !this._currentView.backButtonLabelShown() : true)
			return [m(navButtonBack)]
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
