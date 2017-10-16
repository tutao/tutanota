// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {ColumnType, ViewColumn} from "../gui/base/ViewColumn"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {NavButton} from "../gui/base/NavButton"
import {ViewSlider} from "../gui/base/ViewSlider"
import {SettingsFolder} from "./SettingsFolder"
import {lang} from "../misc/LanguageViewModel"
import {header} from "../gui/base/Header"
import {LoginSettingsViewer} from "./LoginSettingsViewer"
import {GlobalSettingsViewer} from "./GlobalSettingsViewer"
import {EmptyViewer} from "./EmptyViewer"
import {worker} from "../api/main/WorkerClient"
import {MailSettingsViewer} from "./MailSettingsViewer"
import {UserListView} from "./UserListView"
import {UserTypeRef} from "../api/entities/sys/User"
import {isSameTypeRef, isSameId} from "../api/common/EntityFunctions"
import {load} from "../api/main/Entity"
import {ButtonType, Button, ButtonColors} from "../gui/base/Button"
import {logins} from "../api/main/LoginController"
import {GroupListView} from "./GroupListView"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {ContactFormListView} from "./ContactFormListView"
import {BrandingSettingsViewer} from "./BrandingSettingsViewer"
import {Icons} from "../gui/base/icons/Icons"
import {theme} from "../gui/theme"
import type {OperationTypeEnum} from "../api/common/TutanotaConstants"
import {BootIcons} from "../gui/base/icons/BootIcons"

assertMainOrNode()

export class SettingsView {

	view: Function;
	viewSlider: ViewSlider;
	_settingsFoldersColumn: ViewColumn;
	_settingsColumn: ViewColumn;
	_settingsDetailsColumn: ViewColumn;
	_userFolders: SettingsFolder[];
	_adminFolders: SettingsFolder[];
	_selectedFolder: SettingsFolder;
	_currentViewer: ?UpdatableComponent;
	detailsViewer: ?UpdatableComponent; // the component for the details column. can be set by settings views

	constructor() {
		this._userFolders = [
			new SettingsFolder("login_label", () => BootIcons.Contacts, "login", () => new LoginSettingsViewer()),
			new SettingsFolder("email_label", () => BootIcons.Mail, "mail", () => new MailSettingsViewer()),
		]
		this._adminFolders = []


		this._adminFolders.push(new SettingsFolder("adminUserList_action", () => Icons.People, "users", () => new UserListView(this)))
		if (!logins.isProdDisabled()) {
			this._adminFolders.push(new SettingsFolder("groups_label", () => Icons.People, "groups", () => new GroupListView(this)))
		}
		this._adminFolders.push(new SettingsFolder("globalSettings_label", () => BootIcons.Settings, "global", () => new GlobalSettingsViewer()))
		if (!logins.isProdDisabled()) {
			this._adminFolders.push(new SettingsFolder("brandingSettings_label", () => Icons.Wand, "branding", () => new BrandingSettingsViewer()))
			this._adminFolders.push(new SettingsFolder("contactForms_label", () => Icons.Chat, "contactforms", () => new ContactFormListView(this)))
		}
		this._adminFolders.push(new SettingsFolder("upgradePremium_label", () => BootIcons.Premium, "premium", () => new EmptyViewer()))

		this._selectedFolder = this._userFolders[0]

		let userFolderExpander = this._createFolderExpander("userSettings_label", this._userFolders)
		let adminFolderExpander = this._createFolderExpander("adminSettings_label", this._adminFolders)

		this._settingsFoldersColumn = new ViewColumn({
			view: () => m(".folder-column.scroll.overflow-x-hidden", [
				m(".plr-l", m(userFolderExpander)),
				m(userFolderExpander.panel),
				logins.getUserController().isAdmin() ? m(".plr-l", m(adminFolderExpander)) : null,
				logins.getUserController().isAdmin() ? m(adminFolderExpander.panel) : null
			])
		}, ColumnType.Foreground, 200, 280, () => lang.get("settings_label"))

		this._settingsColumn = new ViewColumn({
			view: () => m(this._getCurrentViewer())
		}, ColumnType.Background, 400, 600, () => lang.get(this._selectedFolder.nameTextId))

		this._settingsDetailsColumn = new ViewColumn({
			view: () => (this.detailsViewer) ? m(this.detailsViewer) : m("")
		}, ColumnType.Background, 600, 2400, () => lang.get("settings_label"))

		this.viewSlider = new ViewSlider([this._settingsFoldersColumn, this._settingsColumn, this._settingsDetailsColumn], "SettingsView")

		let newAction = new Button('add_action', () => {
			if (logins.getUserController().isFreeAccount()) {
				showNotAvailableForFreeDialog()
			} else {
				(this._currentViewer:any).addButtonClicked()
			}
		}, () => Icons.Add)
			.setType(ButtonType.Floating)

		this.view = (): Vnode<any> => {
			return m("#settings.main-view", [
				m(this.viewSlider),
				(this._currentViewer && this._currentViewer.addButtonClicked) ? m(newAction) : null
			])
		}
		worker.getEntityEventController().addListener((typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum) => this.entityEventReceived(typeRef, listId, elementId, operation))
	}

	_createFolderExpander(textId: string, folders: SettingsFolder[]): ExpanderButton {
		let buttons = folders.map(folder => {
			let button = new NavButton(folder.nameTextId, folder.icon, () => folder.url, folder.url)
				.setColors(ButtonColors.Nav)
			button.setClickHandler(event => {
				this.viewSlider.focus(this._settingsColumn)
			})
			return button
		})
		let expander = new ExpanderButton(textId, new ExpanderPanel({
			view: () => m(".folders", buttons.map(fb => m(".folder-row.flex-start.plr-l" + (fb.isSelected() ? ".row-selected" : ""), [
				m(fb)
			])))
		}), false, {}, theme.navigation_button)
		expander.toggle()
		return expander
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
		} else if (args.folder && this._selectedFolder.path != args.folder) {
			let folder = this._userFolders.find(f => f.path == args.folder)
			if (!folder && logins.getUserController().isAdmin()) {
				folder = this._adminFolders.find(f => f.path == args.folder)
			}
			if (!folder) {
				this._setUrl(this._userFolders[0].url)
			} else {
				this._selectedFolder = folder
				this._currentViewer = null
				this.detailsViewer = null
				header.settingsUrl = folder.url
				m.redraw()
			}
		}
	}

	_setUrl(url: string) {
		header.settingsUrl = url
		m.route.set(url + location.hash)
	}

	_isAdmin(user: User): boolean {
		return user.memberships.find(m => m.admin) != null
	}

	focusSettingsDetailsColumn() {
		this.viewSlider.focus(this._settingsDetailsColumn)
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, UserTypeRef) && isSameId(elementId, logins.getUserController().user._id)) {
			load(UserTypeRef, elementId).then(user => {
				// the user admin status might have changed
				if (!this._isAdmin(user) && this._currentViewer && this._adminFolders.find(f => f.isActive())) {
					this._setUrl(this._userFolders[0].url)
				}
				m.redraw()
			})
		}
		if (this._currentViewer) {
			this._currentViewer.entityEventReceived(typeRef, listId, elementId, operation)
		}
		if (this.detailsViewer) {
			this.detailsViewer.entityEventReceived(typeRef, listId, elementId, operation)
		}
	}
}