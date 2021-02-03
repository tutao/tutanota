// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {assertMainOrNode, isApp, isDesktop, isIOSApp, isTutanotaDomain} from "../api/common/Env"
import {ColumnType, ViewColumn} from "../gui/base/ViewColumn"
import {ViewSlider} from "../gui/base/ViewSlider"
import {SettingsFolder} from "./SettingsFolder"
import {lang} from "../misc/LanguageViewModel"
import type {CurrentView} from "../gui/base/Header"
import {LoginSettingsViewer} from "./LoginSettingsViewer"
import {GlobalSettingsViewer} from "./GlobalSettingsViewer"
import {DesktopSettingsViewer} from "./DesktopSettingsViewer"
import {MailSettingsViewer} from "./MailSettingsViewer"
import {UserListView} from "./UserListView"
import type {User} from "../api/entities/sys/User"
import {UserTypeRef} from "../api/entities/sys/User"
import {load} from "../api/main/Entity"
import {Button} from "../gui/base/Button"
import {ButtonColors} from "../gui/base/ButtonN"
import {logins} from "../api/main/LoginController"
import {GroupListView} from "./GroupListView"
import {ContactFormListView} from "./ContactFormListView"
import {WhitelabelSettingsViewer} from "./WhitelabelSettingsViewer"
import {Icons} from "../gui/base/icons/Icons"
import {theme} from "../gui/theme"
import {FeatureType, GroupType} from "../api/common/TutanotaConstants"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {locator} from "../api/main/MainLocator"
import {WhitelabelChildrenListView} from "./WhitelabelChildrenListView"
import {SubscriptionViewer} from "../subscription/SubscriptionViewer"
import {PaymentViewer} from "../subscription/PaymentViewer"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {showUserImportDialog} from "./UserViewer"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {getAvailableDomains} from "./AddUserDialog"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {AppearanceSettingsViewer} from "./AppearanceSettingsViewer"
import {isNavButtonSelected, NavButtonN} from "../gui/base/NavButtonN"
import {Dialog} from "../gui/base/Dialog"
import {AboutDialog} from "./AboutDialog"
import {navButtonRoutes} from "../misc/RouteChange"
import {size} from "../gui/size"
import {FolderColumnView} from "../gui/base/FolderColumnView"
import {nativeApp} from "../native/common/NativeWrapper"
import {FolderExpander} from "../gui/base/FolderExpander"
import {isSameId} from "../api/common/utils/EntityUtils";

assertMainOrNode()

export class SettingsView implements CurrentView {

	view: Function;
	viewSlider: ViewSlider;
	_settingsFoldersColumn: ViewColumn;
	_settingsColumn: ViewColumn;
	_settingsDetailsColumn: ViewColumn;
	_userFolders: SettingsFolder[];
	_adminFolders: SettingsFolder[];
	_selectedFolder: SettingsFolder;
	_currentViewer: ?UpdatableSettingsViewer;
	detailsViewer: ?UpdatableSettingsViewer; // the component for the details column. can be set by settings views
	_customDomains: LazyLoaded<string[]>;

	constructor() {
		this._userFolders = [
			new SettingsFolder("login_label", () => BootIcons.Contacts, "login", () => new LoginSettingsViewer()),
			new SettingsFolder("email_label", () => BootIcons.Mail, "mail", () => new MailSettingsViewer()),
			new SettingsFolder("appearanceSettings_label", () => Icons.Palette, "appearance", () => new AppearanceSettingsViewer()),
		]

		if (isDesktop()) {
			this._userFolders.push(new SettingsFolder("desktop_label", () => Icons.Desktop, "desktop", () => {
				const desktopSettingsViewer = new DesktopSettingsViewer()
				nativeApp.setAppUpdateListener(() => desktopSettingsViewer.onAppUpdateAvailable())
				return desktopSettingsViewer
			}))
		}

		this._adminFolders = []

		this._adminFolders.push(new SettingsFolder("adminUserList_action", () => BootIcons.Contacts, "users", () => new UserListView(this)))
		if (!logins.isEnabled(FeatureType.WhitelabelChild)) {
			this._adminFolders.push(new SettingsFolder("groups_label", () => Icons.People, "groups", () => new GroupListView(this)))
		}
		if (logins.getUserController().isGlobalAdmin()) {
			this._adminFolders.push(new SettingsFolder("globalSettings_label", () => BootIcons.Settings, "global", () => new GlobalSettingsViewer()))
			if (!logins.isEnabled(FeatureType.WhitelabelChild) && !isIOSApp()) {
				this._adminFolders.push(new SettingsFolder("whitelabel_label", () => Icons.Wand, "whitelabel", () => new WhitelabelSettingsViewer()))
				if (logins.isEnabled(FeatureType.WhitelabelParent)) {
					this._adminFolders.push(new SettingsFolder("whitelabelAccounts_label", () => Icons.People, "whitelabelaccounts", () => new WhitelabelChildrenListView(this)))
				}
			}
		}
		if (!logins.isEnabled(FeatureType.WhitelabelChild)) {
			this._adminFolders.push(new SettingsFolder("contactForms_label", () => Icons.Chat, "contactforms", () => new ContactFormListView(this)))
			if (logins.getUserController().isGlobalAdmin()) {
				this._adminFolders.push(new SettingsFolder("adminSubscription_action", () => BootIcons.Premium, "subscription", () => new SubscriptionViewer())
					.setIsVisibleHandler(() => !isIOSApp() || !logins.getUserController().isFreeAccount()))
				this._adminFolders.push(new SettingsFolder("adminPayment_action", () => Icons.Cash, "invoice", () => new PaymentViewer())
					.setIsVisibleHandler(() => !logins.getUserController().isFreeAccount()))
			}
		}

		this._selectedFolder = this._userFolders[0]

		const userFolderExpanded = stream(true)
		const adminFolderExpanded = stream(true)

		this._settingsFoldersColumn = new ViewColumn({
			view: () => m(FolderColumnView, {
				button: null,
				content: m(".flex.flex-grow.col", [
					m(FolderExpander, {
						label: "userSettings_label",
						expanded: userFolderExpanded
					}, this._createFolderExpanderChildren(this._userFolders)),
					logins.isUserLoggedIn() && logins.getUserController().isGlobalOrLocalAdmin()
						? [
							m(FolderExpander, {
								label: "adminSettings_label",
								expanded: adminFolderExpanded
							}, this._createFolderExpanderChildren(this._adminFolders)),
						]
						: null,
					isTutanotaDomain() ? this._aboutThisSoftwareLink() : null,
				]),
				ariaLabel: "settings_label"
			})
		}, ColumnType.Foreground, size.first_col_min_width, size.first_col_max_width, () => lang.get("settings_label"))

		this._settingsColumn = new ViewColumn({
			view: () => m(this._getCurrentViewer())
		}, ColumnType.Background, 400, 600, () => lang.get(this._selectedFolder.nameTextId))

		this._settingsDetailsColumn = new ViewColumn({
			view: () => (this.detailsViewer) ? m(this.detailsViewer) : m("")
		}, ColumnType.Background, 600, 2400, () => lang.get("settings_label"))

		this.viewSlider = new ViewSlider([
			this._settingsFoldersColumn, this._settingsColumn, this._settingsDetailsColumn
		], "SettingsView")


		this.view = (): Vnode<any> => {
			return m("#settings.main-view", m(this.viewSlider))
		}
		locator.eventController.addEntityListener((updates) => {
			return this.entityEventsReceived(updates)
		})

		this._customDomains = new LazyLoaded(() => {
			return getAvailableDomains(true)
		})
		this._customDomains.getAsync().then(() => m.redraw())
	}

	_createFolderExpanderChildren(folders: SettingsFolder[]): Children {
		let importUsersButton = new Button('importUsers_action',
			() => showUserImportDialog(this._customDomains.getLoaded()),
			() => Icons.ContactImport
		).setColors(ButtonColors.Nav)
		const buttons = folders.map(folder => {
			return {
				label: folder.nameTextId,
				icon: folder.icon,
				href: folder.url,
				colors: ButtonColors.Nav,
				click: () => this.viewSlider.focus(this._settingsColumn),
				isVisible: () => folder.isVisible()
			}
		})

		return (".folders", buttons.map(fb => fb.isVisible()
			? m(".folder-row.flex-start.plr-l" + (isNavButtonSelected(fb) ? ".row-selected" : ""), [
				m(NavButtonN, fb),
				!isApp() && isNavButtonSelected(fb) && this._selectedFolder && m.route.get().startsWith('/settings/users')
				&& this._customDomains.isLoaded()
				&& this._customDomains.getLoaded().length > 0
					? m(importUsersButton)
					: null
			])
			: null))

	}

	_getCurrentViewer(): Component {
		if (!this._currentViewer) {
			this.detailsViewer = null
			this._currentViewer = this._selectedFolder.viewerCreator()
		}
		return this._currentViewer
	}

	/**
	 * Notifies the current view about changes of the url within its scope.
	 */
	updateUrl(args: Object) {
		if (!args.folder) {
			this._setUrl(this._userFolders[0].url)
		} else if (args.folder && this._selectedFolder.path !== args.folder
			|| !m.route.get().startsWith("/settings")) { // ensure that current viewer will be reinitialized
			let folder = this._userFolders.find(f => f.path === args.folder)
			if (!folder && logins.getUserController().isGlobalOrLocalAdmin()) {
				folder = this._adminFolders.find(f => f.path === args.folder)
			}
			if (!folder) {
				this._setUrl(this._userFolders[0].url)
			} else {
				this._selectedFolder = folder
				this._currentViewer = null
				this.detailsViewer = null
				// make sure the currentViewer is available. if we do not call this._getCurrentViewer(), the floating + button is not always visible
				this._getCurrentViewer()
				navButtonRoutes.settingsUrl = folder.url
				m.redraw()
			}
		}
	}

	_setUrl(url: string) {
		navButtonRoutes.settingsUrl = url
		m.route.set(url + location.hash)
	}

	_isGlobalOrLocalAdmin(user: User): boolean {
		return user.memberships.find(m => m.groupType === GroupType.Admin || m.groupType === GroupType.LocalAdmin)
			!= null
	}

	focusSettingsDetailsColumn() {
		this.viewSlider.focus(this._settingsDetailsColumn)
	}

	entityEventsReceived<T>(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		return Promise.each(updates, update => {
			if (isUpdateForTypeRef(UserTypeRef, update) && isSameId(update.instanceId, logins.getUserController().user._id)) {
				return load(UserTypeRef, update.instanceId).then(user => {
					// the user admin status might have changed
					if (!this._isGlobalOrLocalAdmin(user) && this._currentViewer
						&& this._adminFolders.find(f => f.isActive())) {
						this._setUrl(this._userFolders[0].url)
					}
					m.redraw()
				})
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update)) {
				this._customDomains.reset()
				return this._customDomains.getAsync().then(() => m.redraw())
			}
		}).then(() => {
			if (this._currentViewer) {
				return this._currentViewer.entityEventsReceived(updates)
			}
		}).then(() => {
			if (this.detailsViewer) {
				return this.detailsViewer.entityEventsReceived(updates)
			}
		})
	}

	getViewSlider(): ?IViewSlider {
		return this.viewSlider
	}

	_aboutThisSoftwareLink(): Vnode<any> {
		return m(".pb.pt-l.flex-no-shrink.flex.col.justify-end", [
			m("button.text-center.small.no-text-decoration", {
					style: {
						backgroundColor: "transparent",
					},
					href: '#',
					onclick: () => {
						this.viewSlider.focusNextColumn()
						setTimeout(() => {
							Dialog.showActionDialog({
								title: () => lang.get("about_label"),
								child: () => m(AboutDialog),
								allowOkWithReturn: true,
								okAction: (dialog) => dialog.close(),
								allowCancel: false,
							})
						}, 200)
					}
				}, [
					m("", `Tutanota v${env.versionNumber}`),
					m(".b", {
						style: {color: theme.navigation_button_selected}
					}, lang.get("about_label"))
				]
			)
		])
	}
}

