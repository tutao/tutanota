// @flow
import m from "mithril"
import {NavBar} from "./NavBar"
import {NavButton} from "./NavButton"
import stream from "mithril/stream/stream.js"
import {styles} from "../styles"
import {neverNull, asyncImport} from "../../api/common/utils/Utils"
import {Button, ButtonType, ButtonColors} from "./Button"
import {keyManager, Keys} from "../../misc/KeyManager"
import {lang} from "../../misc/LanguageViewModel"
import {logins} from "../../api/main/LoginController"
import {theme} from "../theme"
import {Icons} from "./icons/Icons"
import {FeatureType} from "../../api/common/TutanotaConstants"

const LogoutUrl = '/login?noAutoLogin=true'

class Header {
	buttonBar: NavBar;
	defaultButtonBar: NavBar;
	view: Function;
	contactsUrl: stream<string>;
	mailsUrl: stream<string>;
	settingsUrl: stream<string>;
	_viewSlider: ?IViewSlider;  // decoupled from ViewSlider implementation to reduce size of bootstrap bundle
	oncreate: Function;
	onbeforeremove: Function;
	_shortcuts: Shortcut[];

	constructor() {
		this.contactsUrl = '/contact'
		this.mailsUrl = '/mail'
		this.settingsUrl = '/settings'
		this._viewSlider = null
		let premiumUrl = '/settings/premium'

		this.defaultButtonBar = new NavBar()
			.addButton(new NavButton('emails_label', () => Icons.Mail, () => this.mailsUrl, this.mailsUrl)
				.setIsVisibleHandler(() => logins.isInternalUserLoggedIn()))
			.addButton(new NavButton('contacts_label', () => Icons.Contacts, () => this.contactsUrl, this.contactsUrl)
				.setIsVisibleHandler(() => logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.DisableContacts)))
			.addButton(new NavButton('upgradePremium_label', () => Icons.Premium, () => premiumUrl, premiumUrl)
				.setIsVisibleHandler(() => logins.isAdminUserLoggedIn() && logins.getUserController().isFreeAccount()))
			.addButton(new NavButton('invite_alt', () => Icons.Share, () => m.route.get())
				.setIsVisibleHandler(() => logins.isAdminUserLoggedIn())
				.setClickHandler(() => this._invite()))
			.addButton(new NavButton('community_label', () => Icons.Heart, 'https://tutanota.com/community')
				.setIsVisibleHandler(() => logins.isAdminUserLoggedIn()))
			.addButton(new NavButton('settings_label', () => Icons.Settings, () => this.settingsUrl, this.settingsUrl)
				.setIsVisibleHandler(() => logins.isInternalUserLoggedIn()))
			.addButton(new NavButton('logout_label', () => Icons.Logout, LogoutUrl)
				.setIsVisibleHandler(() => logins.isUserLoggedIn()))

		this.buttonBar = this.defaultButtonBar

		this._setupShortcuts()

		this.view = (): VirtualElement => {
			return m(".header-nav", [
				m(".header-left.pl-l.ml-negative-s.flex-start.items-center.overflow-hidden", this._getLeftElements()),
				styles.isDesktopLayout() ? null : m(".header-middle.flex-center.items-center.text-ellipsis", {style: {color: theme.header_button}}, this._getColumnTitle()),
				m(".header-right.pr-l.mr-negative-m.flex-end.items-center", m(this.buttonBar))
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

	_invite = function () {
		Promise.join(asyncImport(typeof module != "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}src/mail/MailEditor.js`),
			asyncImport(typeof module != "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}src/mail/MailBoxController.js`), (mailEditorModule, mailBoxControllerModule) => {
				new mailBoxControllerModule.MailBoxController(logins.getUserController().getUserMailGroupMembership()).loadMailBox().then(mc => {
					let editor = new mailEditorModule.MailEditor(mc)
					let username = logins.getUserController().userGroupInfo.name;
					let body = lang.get("invitationMailBody_msg", {
						'{registrationLink}': "https://app.tutanota.com/#register",
						'{username}': username,
						'{githubLink}': "https://github.com/tutao/tutanota"
					})
					editor.initWithTemplate(lang.get("invitationMailSubject_msg"), body, false).then(() => {
						editor.show()
					})

				})
			})
	}

	_getColumnTitle() {
		if (this._viewSlider) {
			return this._viewSlider.focusedColumn.getTitle()
		} else {
			return ""
		}
	}

	_getLeftElements(): VirtualElement[] {
		if (this._viewSlider && this._viewSlider.isFocusPreviousPossible()) {
			let viewSlider = neverNull(this._viewSlider)
			if (styles.isDesktopLayout()) {
				let navButtonBack = new NavButton(() => neverNull(viewSlider.getPreviousColumn()).getTitle(), () => Icons.Back, () => m.route.get(), "header-button-bg")
					.setColors(ButtonColors.Header)
				navButtonBack.setClickHandler(() => viewSlider.focusPreviousColumn())
				return [m(navButtonBack)]
			} else {
				let actionButtonBack = new Button(() => neverNull(viewSlider.getPreviousColumn()).getTitle(), () => viewSlider.focusPreviousColumn(), () => Icons.Back)
					.setColors(ButtonColors.Header)
				actionButtonBack.setType(ButtonType.Action)
				return [m(actionButtonBack)]
			}
		} else {
			if (styles.isDesktopLayout()) {
				return [m(".logo.logo-height.pl-button", m.trust(theme.logo))]
			} else {
				return []
			}
		}
	}

	updateCurrentView(currentView: Component) {
		if (currentView.viewSlider) {
			this._viewSlider = (currentView:any).viewSlider
		} else {
			this._viewSlider = null
		}
		if (currentView.buttonBar) {
			this.buttonBar = (currentView:any).buttonBar
		} else {
			this.buttonBar = this.defaultButtonBar
		}
	}
}

export const header: Header = new Header()
