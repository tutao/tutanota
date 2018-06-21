// @flow
import m from "mithril"
import {NavBar} from "./NavBar"
import {NavButton, NavButtonColors} from "./NavButton"
import {styles} from "../styles"
import {neverNull, asyncImport} from "../../api/common/utils/Utils"
import {keyManager, Keys} from "../../misc/KeyManager"
import {lang} from "../../misc/LanguageViewModel"
import {logins} from "../../api/main/LoginController"
import {theme} from "../theme"
import {FeatureType} from "../../api/common/TutanotaConstants"
import {px} from "../size"
import type {MailEditor} from "../../mail/MailEditor"
import {Mode, assertMainOrNodeBoot} from "../../api/Env"
import {BootIcons} from "./icons/BootIcons"

export const LogoutUrl = '/login?noAutoLogin=true'

assertMainOrNodeBoot()

class Header {
	buttonBar: NavBar;
	view: Function;
	contactsUrl: string;
	mailsUrl: string;
	settingsUrl: string;
	searchUrl: string;
	_currentView: ?Component;  // decoupled from ViewSlider implementation to reduce size of bootstrap bundle
	oncreate: Function;
	onbeforeremove: Function;
	_shortcuts: Shortcut[];
	mailNavButton: NavButton;

	constructor() {
		this.contactsUrl = '/contact'
		this.mailsUrl = '/mail'
		this.settingsUrl = '/settings'
		this.searchUrl = '/search'
		this._currentView = null
		let premiumUrl = '/settings/premium'

		/*
		 TODO search for mobiles
		 let searchViewButton = new NavButton("search_label", () => Icons.Search, () => m.route.get(), this.searchUrl)
		 .setIsVisibleHandler(() => logins.isInternalUserLoggedIn() && styles.isDesktopLayout())
		 .setClickHandler(() => console.log("show search input field"))
		 */


		this.mailNavButton = new NavButton('emails_label', () => BootIcons.Mail, () => this.mailsUrl, this.mailsUrl)
			.setIsVisibleHandler(() => logins.isInternalUserLoggedIn())
		this.buttonBar = new NavBar()
		//.addButton(searchViewButton, 0, true, false)
			.addButton(this.mailNavButton, 0, false)
			.addButton(new NavButton('contacts_label', () => BootIcons.Contacts, () => this.contactsUrl, this.contactsUrl)
				.setIsVisibleHandler(() => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableContacts)))
			.addButton(new NavButton('upgradePremium_label', () => BootIcons.Premium, () => m.route.get(), premiumUrl)
				.setIsVisibleHandler(() => logins.isGlobalAdminUserLoggedIn() && logins.getUserController().isFreeAccount())
				.setClickHandler(() => this._showUpgradeDialog()), 0, true)
			.addButton(new NavButton('invite_alt', () => BootIcons.Share, () => m.route.get())
				.setIsVisibleHandler(() => logins.isGlobalAdminUserLoggedIn())
				.setClickHandler(() => this._invite()), 0, true)
			.addButton(new NavButton('community_label', () => BootIcons.Heart, 'https://tutanota.com/community')
				.setIsVisibleHandler(() => logins.isGlobalAdminUserLoggedIn()), 0, true)
			.addButton(new NavButton('settings_label', () => BootIcons.Settings, () => this.settingsUrl, this.settingsUrl)
				.setIsVisibleHandler(() => logins.isInternalUserLoggedIn()))
			.addButton(new NavButton('supportMenu_label', () => BootIcons.Help, () => m.route.get())
				.setIsVisibleHandler(() => logins.isGlobalAdminUserLoggedIn() && logins.getUserController().isPremiumAccount())
				.setClickHandler(() => this._writeSupportMail()), 0, true)
			.addButton(new NavButton('logout_label', () => BootIcons.Logout, LogoutUrl)
				.setIsVisibleHandler(() => logins.isUserLoggedIn()), 0, true)


		this._setupShortcuts()

		this.view = (): VirtualElement => {
			return m(".header-nav.overflow-hidden", [
				m(".header-left.pl-l.ml-negative-s.flex-start.items-center.overflow-hidden", {
					style: styles.isDesktopLayout() ? null : {'margin-left': px(-15)}  // manual margin to align the hamburger icon on mobile devices
				}, this._getLeftElements()),
				styles.isDesktopLayout() ? null : m(".flex-center.header-middle.items-center.text-ellipsis.b", this._getColumnTitle()),
				m(".header-right.pr-l.mr-negative-m.flex-end.items-center", {
					style: styles.isDesktopLayout() ? null : {'margin-right': px(-18)} // manual margin to align the hamburger icon on mobile devices
				}, m(this.buttonBar))
			])
		}
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

	_invite() {
		this._createMailEditor().then(editor => {
			let username = logins.getUserController().userGroupInfo.name;
			let body = lang.get("invitationMailBody_msg", {
				'{registrationLink}': "https://app.tutanota.com/#register",
				'{username}': username,
				'{githubLink}': "https://github.com/tutao/tutanota"
			})
			editor.initWithTemplate(null, null, lang.get("invitationMailSubject_msg"), body, false).then(() => {
				editor.show()
			})
		})
	}

	_showUpgradeDialog() {
		asyncImport(typeof module != "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}src/subscription/UpgradeSubscriptionWizard.js`).then(upgradeWizard => {
				return upgradeWizard.show()
			}
		)
	}

	_writeSupportMail() {
		this._createMailEditor().then(editor => {
			let signature = "<br><br>--"
			signature += "<br>Client: " + (env.mode == Mode.App ? (env.platformId != null ? env.platformId : "") + " app" : "Browser")
			signature += "<br>Tutanota version: " + env.versionNumber
			signature += "<br>User agent:<br>" + navigator.userAgent
			editor.initWithTemplate(null, "premium@tutao.de", "", signature, true).then(() => {
				editor.show()
			})
		})
	}

	_createMailEditor(): Promise<MailEditor> {
		return Promise.join(
			asyncImport(typeof module != "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}src/mail/MailEditor.js`),
			asyncImport(typeof module != "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}src/mail/MailModel.js`),
			(mailEditorModule, mailModelModule) => {
				return new mailEditorModule.MailEditor(mailModelModule.mailModel.getUserMailboxDetails())
			}
		)
	}

	_getColumnTitle() {
		const viewSlider = this._getViewSlider()
		if (viewSlider) {
			return viewSlider.focusedColumn.getTitle()
		} else if (m.route.get().startsWith('/login')) {
			return lang.get("login_label")
		} else if (m.route.get().startsWith('/signup')) {
			return lang.get("registrationHeadline_msg")
		} else {
			return ""
		}
	}


	_getLeftElements() {
		const viewSlider = this._getViewSlider()
		if (viewSlider && viewSlider.isFocusPreviousPossible()) {
			let navButtonBack = new NavButton(() => neverNull(viewSlider.getPreviousColumn()).getTitle(), () => BootIcons.Back, () => m.route.get())
				.setColors(NavButtonColors.Header)
				.setClickHandler(() => viewSlider.focusPreviousColumn())
				.setHideLabel(true)
			return [m(navButtonBack)]
		} else {
			if (styles.isDesktopLayout()) {
				return [m(".logo.logo-height.pl-button", m.trust(theme.logo))]
			} else {
				return []
			}
		}
	}

	updateCurrentView(currentView: Component) {
		this._currentView = currentView
	}

	_getViewSlider(): ?IViewSlider {
		if (this._currentView) {
			return (this._currentView:any).viewSlider
		} else {
			return null
		}
	}
}

export const header: Header = new Header()
