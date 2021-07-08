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
import {ButtonColors} from "../gui/base/ButtonN"
import {logins} from "../api/main/LoginController"
import {GroupListView} from "./GroupListView"
import {ContactFormListView} from "./ContactFormListView"
import {WhitelabelSettingsViewer} from "./whitelabel/WhitelabelSettingsViewer"
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
import type {NavButtonAttrs} from "../gui/base/NavButtonN"
import {Dialog} from "../gui/base/Dialog"
import {AboutDialog} from "./AboutDialog"
import {navButtonRoutes, SETTINGS_PREFIX} from "../misc/RouteChange"
import {size} from "../gui/size"
import {FolderColumnView} from "../gui/base/FolderColumnView"
import {getEtId, isSameId} from "../api/common/utils/EntityUtils";
import {TemplateListView} from "./TemplateListView"
import {KnowledgeBaseListView} from "./KnowledgeBaseListView"
import {promiseMap} from "../api/common/utils/PromiseUtils"
import {loadTemplateGroupInstances} from "../templates/model/TemplatePopupModel"
import type {TemplateGroupInstance} from "../templates/model/TemplateGroupModel"
import {showGroupSharingDialog} from "../sharing/view/GroupSharingDialog"
import {getConfirmation, moreButton} from "../gui/base/GuiUtils"
import {flat, partition} from "../api/common/utils/ArrayUtils"
import {SidebarSection} from "../gui/SidebarSection"
import {ReceivedGroupInvitationsModel} from "../sharing/model/ReceivedGroupInvitationsModel"
import {getDefaultGroupName, getSharedGroupName, isSharedGroupOwner} from "../sharing/GroupUtils"
import {worker} from "../api/main/WorkerClient"
import {DummyTemplateListView} from "./DummyTemplateListView"
import {SettingsFolderRow} from "./SettingsFolderRow"
import {isCustomizationEnabledForCustomer} from "../api/common/utils/Utils"
import type {ReceivedGroupInvitation} from "../api/entities/sys/ReceivedGroupInvitation"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {serviceRequestVoid} from "../api/main/Entity"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {TextFieldN} from "../gui/base/TextFieldN"
import {createGroupSettings} from "../api/entities/tutanota/GroupSettings"
import {createUserAreaGroupDeleteData} from "../api/entities/tutanota/UserAreaGroupDeleteData"
import {GroupInvitationFolderRow} from "../sharing/view/GroupInvitationFolderRow"

assertMainOrNode()


export class SettingsView implements CurrentView {

	view: Function;
	viewSlider: ViewSlider;
	_settingsFoldersColumn: ViewColumn;
	_settingsColumn: ViewColumn;
	_settingsDetailsColumn: ViewColumn;
	_userFolders: SettingsFolder<void>[];
	_adminFolders: SettingsFolder<void>[];
	_templateFolders: SettingsFolder<TemplateGroupInstance>[];
	_dummyTemplateFolder: SettingsFolder<void>;
	_knowledgeBaseFolders: SettingsFolder<void>[];
	_selectedFolder: SettingsFolder<*>;
	_currentViewer: ?UpdatableSettingsViewer;
	detailsViewer: ?UpdatableSettingsViewer; // the component for the details column. can be set by settings views
	_customDomains: LazyLoaded<string[]>;

	_templateInvitations: ReceivedGroupInvitationsModel

	constructor() {
		this._userFolders = [
			new SettingsFolder("login_label", () => BootIcons.Contacts, "login", () => new LoginSettingsViewer()),
			new SettingsFolder("email_label", () => BootIcons.Mail, "mail", () => new MailSettingsViewer()),
			new SettingsFolder("appearanceSettings_label", () => Icons.Palette, "appearance", () => new AppearanceSettingsViewer()),
		]

		if (isDesktop()) {
			this._userFolders.push(new SettingsFolder("desktop_label", () => Icons.Desktop, "desktop", () => {

				const desktopSettingsViewer = new DesktopSettingsViewer()
				import("../native/common/NativeWrapper").then(({nativeApp}) => {
					nativeApp.setAppUpdateListener(() => desktopSettingsViewer.onAppUpdateAvailable())
				})
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

		this._templateFolders = []
		this._makeTemplateFolders()
		    .then(folders => {
			    this._templateFolders = folders

			    m.redraw()
		    })

		this._dummyTemplateFolder = new SettingsFolder<void>(
			() => getDefaultGroupName(GroupType.Template),
			() => Icons.ListAlt,
			{folder: "templates", id: "init"},
			() => {
				return {
					view: () => {
						return m(DummyTemplateListView)
					},
					entityEventsReceived: () => Promise.resolve()
				}
			})

		this._knowledgeBaseFolders = []
		this._makeKnowledgeBaseFolders().then(folders => {
			this._knowledgeBaseFolders = folders
			m.redraw()
		})

		this._selectedFolder = this._userFolders[0]

		this._templateInvitations = new ReceivedGroupInvitationsModel(GroupType.Template, locator.eventController, locator.entityClient, logins)
		this._templateInvitations.invitations.map(() => m.redraw())
		this._templateInvitations.init()


		this._settingsFoldersColumn = new ViewColumn({
			onbeforeremove: () => {
				this._templateInvitations.dispose()
			},
			view: () => {
				const [ownTemplates, sharedTemplates] = partition(this._templateFolders,
					folder => isSharedGroupOwner(folder.data.group, logins.getUserController().user))
				const templateInvitations = this._templateInvitations.invitations()
				return m(FolderColumnView, {
					button: null,
					content: m(".flex.flex-grow.col", [
						m(SidebarSection, {
							name: "userSettings_label",
						}, [
							this._renderSidebarSectionChildren(this._userFolders),
							ownTemplates.length > 0
								? ownTemplates.map(folder => this._renderTemplateFolderRow(folder))
								: m(SettingsFolderRow, {mainButtonAttrs: this._createSettingsFolderNavButton(this._dummyTemplateFolder)}),
							sharedTemplates.map(folder => this._renderTemplateFolderRow(folder))
						]),
						logins.isUserLoggedIn() && logins.getUserController().isGlobalOrLocalAdmin()
							? m(SidebarSection, {
								name: "adminSettings_label",
							}, this._renderSidebarSectionChildren(this._adminFolders))
							: null,
						templateInvitations.length > 0
							? m(SidebarSection, {name: "templateGroupInvitations_label"},
							templateInvitations.map(invitation => this._renderTemplateInvitationFolderRow(invitation)))
							: null,
						this._knowledgeBaseFolders.length > 0
							? m(SidebarSection, {
								name: "knowledgebase_label",
							}, this._renderSidebarSectionChildren(this._knowledgeBaseFolders))
							: null,
						isTutanotaDomain() ? this._aboutThisSoftwareLink() : null,
					]),
					ariaLabel: "settings_label"
				})
			}
		}, ColumnType.Foreground, size.first_col_min_width, size.first_col_max_width, () => lang.get("settings_label"))

		this._settingsColumn = new ViewColumn({
			view: () => m(this._getCurrentViewer())
		}, ColumnType.Background, 400, 600, () => lang.getMaybeLazy(this._selectedFolder.name))

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

	_createSettingsFolderNavButton(folder: SettingsFolder<*>): NavButtonAttrs {
		return {
			label: folder.name,
			icon: folder.icon,
			href: folder.url,
			colors: ButtonColors.Nav,
			click: () => this.viewSlider.focus(this._settingsColumn),
			isVisible: () => folder.isVisible()
		}
	}

	_renderTemplateFolderRow(folder: SettingsFolder<TemplateGroupInstance>): Children {
		const instance = folder.data
		const isGroupOwner = isSharedGroupOwner(instance.group, getEtId(logins.getUserController().user))
		return m(SettingsFolderRow, {
			mainButtonAttrs: this._createSettingsFolderNavButton(folder),
			extraButtonAttrs: moreButton(() => [
				isGroupOwner
					? {
						label: "delete_action",
						click: () =>
							getConfirmation("confirmDeleteTemplateGroup_msg")
								.confirmed(() => showProgressDialog("pleaseWait_msg",
									serviceRequestVoid(TutanotaService.TemplateGroupService,
										HttpMethod.DELETE,
										createUserAreaGroupDeleteData({group: folder.data.groupInfo.group})))),
						icon: () => Icons.Trash
					}
					: {
						label: "leaveGroup_action",
						click: () =>
							getConfirmation("confirmLeaveTemplateGroup_msg")
								.confirmed(() => worker.removeUserFromGroup(getEtId(logins.getUserController().user), folder.data.groupInfo.group)),
						icon: () => Icons.Trash
					},
				{
					label: "sharing_label",
					click: () => showGroupSharingDialog(folder.data.groupInfo, true),
					icon: () => Icons.ContactImport
				},
				{
					label: "rename_action",
					click: () => showRenameTemplateListDialog(folder.data),
					icon: () => Icons.Edit
				}
			]),
		})
	}

	_renderTemplateInvitationFolderRow(invitation: ReceivedGroupInvitation): Children {
		return m(GroupInvitationFolderRow, {
			invitation: invitation,
			icon: BootIcons.Mail
		})
	}

	_renderSidebarSectionChildren(folders: SettingsFolder<void>[]): Children {

		return m("",
			folders
				.filter(folder => folder.isVisible())
				.map(folder => {
						const canImportUsers = !isApp()
							&& this._customDomains.isLoaded()
							&& this._customDomains.getLoaded().length > 0

						const buttonAttrs = this._createSettingsFolderNavButton(folder)
						return m(SettingsFolderRow, {
							mainButtonAttrs: buttonAttrs,
							extraButtonAttrs: canImportUsers && folder.path === "users"
								? {
									label: 'importUsers_action',
									click: () => showUserImportDialog(this._customDomains.getLoaded()),
									icon: () => Icons.ContactImport,
									color: ButtonColors.Nav
								}
								: null
						})
					}
				))
	}

	_getCurrentViewer(): MComponent<void> {
		if (!this._currentViewer) {
			this.detailsViewer = null
			this._currentViewer = this._selectedFolder.viewerCreator()
		}
		return this._currentViewer
	}

	/**
	 * Notifies the current view about changes of the url within its scope.
	 */
	updateUrl(args: Object, requestedPath: string) {
		if (!args.folder) {
			this._setUrl(this._userFolders[0].url)
		} else if (args.folder || !m.route.get().startsWith("/settings")) { // ensure that current viewer will be reinitialized

			const folder = this._allSettingsFolders().find(folder => folder.url === requestedPath)

			if (!folder) {
				this._setUrl(this._userFolders[0].url)
			} else if (this._selectedFolder.path === folder.path) {// folder path has not changed
				this._selectedFolder = folder // instance of SettingsFolder might have been changed in membership update, so replace this instance
				m.redraw()
			} else { // folder path has changed
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

	_getUserOwnedTemplateSettingsFolder(): SettingsFolder<*> {
		return this._templateFolders.find(folder => isSharedGroupOwner(folder.data.group, logins.getUserController().user))
			|| this._dummyTemplateFolder
	}

	_allSettingsFolders(): $ReadOnlyArray<SettingsFolder<*>> {
		const hasOwnTemplates = this._templateFolders.some(folder => isSharedGroupOwner(folder.data.group, logins.getUserController().user))
		return flat([
			this._userFolders,
			this._adminFolders,
			!hasOwnTemplates
				? [this._dummyTemplateFolder]
				: [],
			this._templateFolders,
			this._knowledgeBaseFolders
		])
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
		return promiseMap(updates, update => {
			if (isUpdateForTypeRef(UserTypeRef, update) && isSameId(update.instanceId, logins.getUserController().user._id)) {
				const user = logins.getUserController().user
				// the user admin status might have changed
				if (!this._isGlobalOrLocalAdmin(user) && this._currentViewer
					&& this._adminFolders.find(f => f.isActive())) {
					this._setUrl(this._userFolders[0].url)
				}
				// template group memberships may have changed
				if (this._templateFolders.length !== logins.getUserController().getTemplateMemberships().length) {
					return Promise.all([this._makeTemplateFolders(), this._makeKnowledgeBaseFolders()])
					              .then(([templates, knowledgeBases]) => {
						              this._templateFolders = templates
						              this._knowledgeBaseFolders = knowledgeBases

						              const currentRoute = m.route.get()
						              if (currentRoute.startsWith(SETTINGS_PREFIX)) {

							              // When user first creates a template group from the dummy list, we need to switch them to
							              // the viewer for their newly created list.
							              const targetRoute = currentRoute === this._dummyTemplateFolder.url
								              ? this._getUserOwnedTemplateSettingsFolder().url
								              : currentRoute
							              this._setUrl(targetRoute)

						              }
					              })
				}
				m.redraw()
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

	getViewSlider(): ? IViewSlider {
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

	_makeTemplateFolders(): Promise<Array<SettingsFolder<TemplateGroupInstance>>> {
		const templateMemberships = logins.getUserController() && logins.getUserController().getTemplateMemberships() || []
		return promiseMap(loadTemplateGroupInstances(templateMemberships, locator.entityClient),
			groupInstance =>
				new SettingsFolder(() => getSharedGroupName(groupInstance.groupInfo, true),
					() => Icons.ListAlt,
					{folder: "templates", id: getEtId(groupInstance.group)},
					() => new TemplateListView(this, groupInstance, locator.entityClient, logins),
					groupInstance))
	}


	_makeKnowledgeBaseFolders(): Promise<Array<SettingsFolder<void>>> {
		return logins.getUserController().loadCustomer()
		             .then(customer => {
			             if (isCustomizationEnabledForCustomer(customer, FeatureType.KnowledgeBase)) {
				             const templateMemberships = logins.getUserController() && logins.getUserController().getTemplateMemberships()
					             || []
				             return promiseMap(loadTemplateGroupInstances(templateMemberships, locator.entityClient),
					             groupInstance =>
						             new SettingsFolder(() => getSharedGroupName(groupInstance.groupInfo, true),
							             () => Icons.Book,
							             {folder: "knowledgebase", id: getEtId(groupInstance.group)},
							             () => new KnowledgeBaseListView(this, locator.entityClient, logins, groupInstance.groupRoot, groupInstance.group)))
			             } else {
				             return []
			             }
		             })
	}
}

function showRenameTemplateListDialog(instance: TemplateGroupInstance) {
	const name = stream(getSharedGroupName(instance.groupInfo, true))
	Dialog.showActionDialog({
		title: () => lang.get("renameTemplateList_label"),
		allowOkWithReturn: true,
		child: {
			view: () =>
				m(TextFieldN, {
					value: name,
					label: "templateGroupName_label"
				}),
		},
		okAction: (dialog) => {
			dialog.close()
			const {userSettingsGroupRoot} = logins.getUserController()
			const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === instance.groupInfo.group)
			const newName = name()

			if (existingGroupSettings) {
				existingGroupSettings.name = newName
			} else {
				const newSettings = createGroupSettings({
					group: getEtId(instance.group),
					color: "",
					name: newName
				})
				logins.getUserController().userSettingsGroupRoot.groupSettings.push(newSettings)
			}
			locator.entityClient.update(userSettingsGroupRoot)
			       .then(() => {
				       if (isSharedGroupOwner(instance.group, logins.getUserController().user)) {
					       instance.groupInfo.name = newName
					       locator.entityClient.update(instance.groupInfo)
				       }
			       })
		}
	})
}