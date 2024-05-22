import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import stream from "mithril/stream"
import { assertMainOrNode, isApp, isDesktop, isIOSApp } from "../api/common/Env"
import { ColumnType, ViewColumn } from "../gui/base/ViewColumn"
import { ViewSlider } from "../gui/nav/ViewSlider.js"
import { SettingsFolder } from "./SettingsFolder"
import { lang } from "../misc/LanguageViewModel"
import { AppHeaderAttrs, Header } from "../gui/Header.js"
import { LoginSettingsViewer } from "./login/LoginSettingsViewer.js"
import { GlobalSettingsViewer } from "./GlobalSettingsViewer"
import { DesktopSettingsViewer } from "./DesktopSettingsViewer"
import { MailSettingsViewer } from "./MailSettingsViewer"
import { UserListView } from "./UserListView"
import type { ReceivedGroupInvitation, User } from "../api/entities/sys/TypeRefs.js"
import { CustomerInfoTypeRef, CustomerTypeRef } from "../api/entities/sys/TypeRefs.js"
import { GroupListView } from "./groups/GroupListView.js"
import { WhitelabelSettingsViewer } from "./whitelabel/WhitelabelSettingsViewer"
import { Icons } from "../gui/base/icons/Icons"
import { theme } from "../gui/theme"
import { FeatureType, GroupType, LegacyPlans } from "../api/common/TutanotaConstants"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { locator } from "../api/main/MainLocator"
import { SubscriptionViewer } from "../subscription/SubscriptionViewer"
import { PaymentViewer } from "../subscription/PaymentViewer"
import { showUserImportDialog, UserViewer } from "./UserViewer"
import { LazyLoaded, partition, promiseMap } from "@tutao/tutanota-utils"
import { AppearanceSettingsViewer } from "./AppearanceSettingsViewer"
import type { NavButtonAttrs } from "../gui/base/NavButton.js"
import { NavButtonColor } from "../gui/base/NavButton.js"
import { SETTINGS_PREFIX } from "../misc/RouteChange"
import { size } from "../gui/size"
import { FolderColumnView } from "../gui/FolderColumnView.js"
import { getEtId } from "../api/common/utils/EntityUtils"
import { KnowledgeBaseListView, KnowledgeBaseSettingsDetailsViewer } from "./KnowledgeBaseListView"
import type { TemplateGroupInstance } from "../templates/model/TemplateGroupModel"
import { showGroupSharingDialog } from "../sharing/view/GroupSharingDialog"
import { createMoreActionButtonAttrs, getConfirmation } from "../gui/base/GuiUtils"
import { SidebarSection } from "../gui/SidebarSection"
import { ReceivedGroupInvitationsModel } from "../sharing/model/ReceivedGroupInvitationsModel"
import { getDefaultGroupName, getSharedGroupName, isSharedGroupOwner } from "../sharing/GroupUtils"
import { DummyTemplateListView } from "./DummyTemplateListView"
import { SettingsFolderRow } from "./SettingsFolderRow"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { createGroupSettings, createUserAreaGroupDeleteData } from "../api/entities/tutanota/TypeRefs.js"
import { GroupInvitationFolderRow } from "../sharing/view/GroupInvitationFolderRow"
import { TemplateGroupService } from "../api/entities/tutanota/Services"
import { exportUserCsv } from "./UserDataExporter.js"
import { IconButton } from "../gui/base/IconButton.js"
import { BottomNav } from "../gui/nav/BottomNav.js"
import { getAvailableDomains } from "./mailaddress/MailAddressesUtils.js"
import { DrawerMenuAttrs } from "../gui/nav/DrawerMenu.js"
import { BaseTopLevelView } from "../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../TopLevelView.js"
import { ReferralSettingsViewer } from "./ReferralSettingsViewer.js"
import { LoginController } from "../api/main/LoginController.js"
import { BackgroundColumnLayout } from "../gui/BackgroundColumnLayout.js"
import { styles } from "../gui/styles.js"
import { MobileHeader } from "../gui/MobileHeader.js"
import { GroupDetailsView } from "./groups/GroupDetailsView.js"
import { TemplateDetailsViewer } from "./TemplateDetailsViewer.js"
import { isCustomizationEnabledForCustomer } from "../api/common/utils/CustomerUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"
import { Dialog } from "../gui/base/Dialog.js"
import { AboutDialog } from "./AboutDialog.js"
import { loadTemplateGroupInstances } from "../templates/model/TemplatePopupModel.js"
import { TemplateListView } from "./TemplateListView.js"
import { TextField } from "../gui/base/TextField.js"
import { ContactsSettingsViewer } from "./ContactsSettingsViewer.js"
import { NotificationSettingsViewer } from "./NotificationSettingsViewer.js"

assertMainOrNode()

/** UI component shown in the second column of settings. */
export interface UpdatableSettingsViewer extends Component {
	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<unknown>
}

/** UI component shown in the third column of settings. Not actually a Mithril component. */
export interface UpdatableSettingsDetailsViewer {
	renderView(): Children

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<unknown>
}

export interface SettingsViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	logins: LoginController
}

export class SettingsView extends BaseTopLevelView implements TopLevelView<SettingsViewAttrs> {
	viewSlider: ViewSlider
	private readonly _settingsFoldersColumn: ViewColumn
	private readonly _settingsColumn: ViewColumn
	private readonly _settingsDetailsColumn: ViewColumn
	private readonly _userFolders: SettingsFolder<unknown>[]
	private readonly _adminFolders: SettingsFolder<unknown>[]
	private readonly logins: LoginController
	private _templateFolders: SettingsFolder<TemplateGroupInstance>[]
	private readonly _dummyTemplateFolder: SettingsFolder<unknown>
	private _knowledgeBaseFolders: SettingsFolder<unknown>[]
	private _selectedFolder: SettingsFolder<unknown>
	private _currentViewer: UpdatableSettingsViewer | null = null
	private showBusinessSettings: stream<boolean> = stream(false)
	private readonly _targetFolder: string
	private readonly _targetRoute: string
	detailsViewer: UpdatableSettingsDetailsViewer | null = null // the component for the details column. can be set by settings views

	_customDomains: LazyLoaded<string[]>
	_templateInvitations: ReceivedGroupInvitationsModel<GroupType.Template>

	constructor(vnode: Vnode<SettingsViewAttrs>) {
		super()
		this.logins = vnode.attrs.logins
		this._userFolders = [
			new SettingsFolder(
				"login_label",
				() => BootIcons.Contacts,
				"login",
				() => new LoginSettingsViewer(locator.credentialsProvider, isApp() ? locator.systemFacade : null),
				undefined,
			),
			new SettingsFolder(
				"email_label",
				() => BootIcons.Mail,
				"mail",
				() => new MailSettingsViewer(),
				undefined,
			),
			new SettingsFolder(
				"contacts_label",
				() => BootIcons.Contacts,
				"contacts",
				() => new ContactsSettingsViewer(),
				undefined,
			),
			new SettingsFolder(
				"appearanceSettings_label",
				() => Icons.Palette,
				"appearance",
				() => new AppearanceSettingsViewer(),
				undefined,
			),
			new SettingsFolder(
				"notificationSettings_action",
				() => Icons.Bell,
				"notifications",
				() => new NotificationSettingsViewer(),
				undefined,
			),
		]

		if (isDesktop()) {
			this._userFolders.push(
				new SettingsFolder(
					"desktop_label",
					() => Icons.Desktop,
					"desktop",
					() => {
						const desktopSettingsViewer = new DesktopSettingsViewer()
						locator.initialized.then(() => {
							locator.native.setAppUpdateListener(() => desktopSettingsViewer.onAppUpdateAvailable())
						})
						return desktopSettingsViewer
					},
					undefined,
				),
			)
		}

		this._adminFolders = []
		this._templateFolders = []

		this._makeTemplateFolders().then((folders) => {
			this._templateFolders = folders
			m.redraw()
		})

		this._dummyTemplateFolder = new SettingsFolder<void>(
			() => getDefaultGroupName(GroupType.Template),
			() => Icons.ListAlt,
			{
				folder: "templates",
				id: "init",
			},
			() => {
				return {
					view: () => {
						return m(DummyTemplateListView)
					},
					entityEventsReceived: () => Promise.resolve(),
				}
			},
			undefined,
		)
		this._knowledgeBaseFolders = []

		this._makeKnowledgeBaseFolders().then((folders) => {
			this._knowledgeBaseFolders = folders
			m.redraw()
		})

		this._selectedFolder = this._userFolders[0]
		this._templateInvitations = new ReceivedGroupInvitationsModel(GroupType.Template, locator.eventController, locator.entityClient, this.logins)

		this._templateInvitations.invitations.map(() => m.redraw())

		this._templateInvitations.init()

		this._settingsFoldersColumn = new ViewColumn(
			{
				onbeforeremove: () => {
					this._templateInvitations.dispose()
				},
				view: () => {
					const [ownTemplates, sharedTemplates] = partition(this._templateFolders, (folder) =>
						isSharedGroupOwner(folder.data.group, this.logins.getUserController().user),
					)

					const templateInvitations = this._templateInvitations.invitations()

					return m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
						button: null,
						content: m(".flex.flex-grow.col", [
							m(
								SidebarSection,
								{
									name: "userSettings_label",
								},
								[
									this._renderSidebarSectionChildren(this._userFolders),
									ownTemplates.length > 0
										? ownTemplates.map((folder) => this._renderTemplateFolderRow(folder))
										: m(SettingsFolderRow, {
												mainButtonAttrs: this._createSettingsFolderNavButton(this._dummyTemplateFolder),
										  }),
									sharedTemplates.map((folder) => this._renderTemplateFolderRow(folder)),
								],
							),
							this.logins.isUserLoggedIn() && this.logins.getUserController().isGlobalOrLocalAdmin()
								? m(
										SidebarSection,
										{
											name: "adminSettings_label",
										},
										this._renderSidebarSectionChildren(this._adminFolders),
								  )
								: null,
							templateInvitations.length > 0
								? m(
										SidebarSection,
										{
											name: "templateGroupInvitations_label",
										},
										templateInvitations.map((invitation) => this._renderTemplateInvitationFolderRow(invitation)),
								  )
								: null,
							this._knowledgeBaseFolders.length > 0
								? m(
										SidebarSection,
										{
											name: "knowledgebase_label",
										},
										this._renderSidebarSectionChildren(this._knowledgeBaseFolders),
								  )
								: null,
							locator.domainConfigProvider().getCurrentDomainConfig().firstPartyDomain ? this._aboutThisSoftwareLink() : null,
						]),
						ariaLabel: "settings_label",
					})
				},
			},
			ColumnType.Foreground,
			{
				minWidth: size.first_col_min_width,
				maxWidth: size.first_col_max_width,
				headerCenter: () => lang.get("settings_label"),
			},
		)
		this._settingsColumn = new ViewColumn(
			{
				// the CSS improves the situation on devices with notches (no control elements
				// are concealed), but there's still room for improvement for scrollbars
				view: () =>
					m(BackgroundColumnLayout, {
						backgroundColor: theme.navigation_bg,
						columnLayout: m(
							".mlr-safe-inset.fill-absolute.content-bg",
							{
								class: styles.isUsingBottomNavigation() ? "" : "border-radius-top-left-big",
							},
							m(this._getCurrentViewer()),
						),
						mobileHeader: () =>
							m(MobileHeader, {
								...vnode.attrs.header,
								backAction: () => this.viewSlider.focusPreviousColumn(),
								columnType: "first",
								title: lang.getMaybeLazy(this._selectedFolder.name),
								actions: [],
								primaryAction: () => null,
							}),
						desktopToolbar: () => null,
					}),
			},
			ColumnType.Background,
			{
				minWidth: 400,
				maxWidth: 600,
				headerCenter: () => lang.getMaybeLazy(this._selectedFolder.name),
			},
		)
		this._settingsDetailsColumn = new ViewColumn(
			{
				view: () =>
					m(BackgroundColumnLayout, {
						backgroundColor: theme.navigation_bg,
						columnLayout: m(".mlr-safe-inset.fill-absolute.content-bg", this.detailsViewer ? this.detailsViewer.renderView() : m("")),
						mobileHeader: () =>
							m(MobileHeader, {
								...vnode.attrs.header,
								backAction: () => this.viewSlider.focusPreviousColumn(),
								columnType: "other",
								title: lang.getMaybeLazy(this._selectedFolder.name),
								actions: [],
								primaryAction: () => null,
							}),
						desktopToolbar: () => null,
					}),
			},
			ColumnType.Background,
			{
				minWidth: 500,
				maxWidth: 2400,
				headerCenter: () => lang.get("settings_label"),
			},
		)
		this.viewSlider = new ViewSlider([this._settingsFoldersColumn, this._settingsColumn, this._settingsDetailsColumn])

		this._customDomains = new LazyLoaded(async () => {
			const domainInfos = await getAvailableDomains(this.logins, true)
			return domainInfos.map((info) => info.domain)
		})

		this._customDomains.getAsync().then(() => m.redraw())

		this._targetFolder = m.route.param("folder")
		this._targetRoute = m.route.get()
	}

	private async populateAdminFolders() {
		await this.updateShowBusinessSettings()
		const currentPlanType = await this.logins.getUserController().getPlanType()
		const isLegacyPlan = LegacyPlans.includes(currentPlanType)

		if (await this.logins.getUserController().canHaveUsers()) {
			this._adminFolders.push(
				new SettingsFolder(
					"adminUserList_action",
					() => BootIcons.Contacts,
					"users",
					() =>
						new UserListView(
							(viewer) => this.replaceDetailsViewer(viewer),
							() => this.focusSettingsDetailsColumn(),
							() => !isApp() && this._customDomains.isLoaded() && this._customDomains.getLoaded().length > 0,
							() => showUserImportDialog(this._customDomains.getLoaded()),
							() => exportUserCsv(locator.entityClient, this.logins, locator.fileController, locator.counterFacade),
						),
					undefined,
				),
			)
			if (!this.logins.isEnabled(FeatureType.WhitelabelChild)) {
				this._adminFolders.push(
					new SettingsFolder(
						"sharedMailboxes_label",
						() => Icons.People,
						"groups",
						() =>
							new GroupListView(
								(viewer) => this.replaceDetailsViewer(viewer),
								() => this.focusSettingsDetailsColumn(),
							),
						undefined,
					),
				)
			}
		}

		if (this.logins.getUserController().isGlobalAdmin()) {
			this._adminFolders.push(
				new SettingsFolder(
					"globalSettings_label",
					() => BootIcons.Settings,
					"global",
					() => new GlobalSettingsViewer(),
					undefined,
				),
			)

			if (!this.logins.isEnabled(FeatureType.WhitelabelChild) && !isIOSApp()) {
				this._adminFolders.push(
					new SettingsFolder(
						"whitelabel_label",
						() => Icons.Wand,
						"whitelabel",
						() => new WhitelabelSettingsViewer(locator.entityClient, this.logins),
						undefined,
					),
				)
			}
		}

		if (!this.logins.isEnabled(FeatureType.WhitelabelChild)) {
			if (this.logins.getUserController().isGlobalAdmin()) {
				this._adminFolders.push(
					new SettingsFolder<void>(
						"adminSubscription_action",
						() => BootIcons.Premium,
						"subscription",
						() => new SubscriptionViewer(currentPlanType),
						undefined,
					).setIsVisibleHandler(() => !isIOSApp() || !this.logins.getUserController().isFreeAccount()),
				)

				this._adminFolders.push(
					new SettingsFolder<void>(
						"adminPayment_action",
						() => Icons.CreditCard,
						"invoice",
						() => new PaymentViewer(),
						undefined,
					),
				)

				this._adminFolders.push(
					new SettingsFolder(
						"referralSettings_label",
						() => BootIcons.Share,
						"referral",
						() => new ReferralSettingsViewer(),
						undefined,
					).setIsVisibleHandler(() => !this.showBusinessSettings()),
				)
			}
		}
		m.redraw()
	}

	private replaceDetailsViewer(viewer: UserViewer | GroupDetailsView | TemplateDetailsViewer | KnowledgeBaseSettingsDetailsViewer | null) {
		return (this.detailsViewer = viewer)
	}

	oncreate(vnode: Vnode<SettingsViewAttrs>) {
		locator.eventController.addEntityListener(this.entityListener)
		this.populateAdminFolders().then(() => {
			// We have to wait for the folders to be initialized before setting the URL,
			// otherwise we won't find the requested folder and will just pick the default folder
			const stillAtDefaultUrl = m.route.get() === this._userFolders[0].url
			if (stillAtDefaultUrl) {
				this.onNewUrl({ folder: this._targetFolder }, this._targetRoute)
			}
		})
	}

	onremove(vnode: VnodeDOM<SettingsViewAttrs>) {
		locator.eventController.removeEntityListener(this.entityListener)
	}

	private entityListener = (updates: EntityUpdateData[], eventOwnerGroupId: Id) => {
		return this.entityEventsReceived(updates, eventOwnerGroupId)
	}

	view({ attrs }: Vnode<SettingsViewAttrs>): Children {
		return m(
			"#settings.main-view",
			m(this.viewSlider, {
				header: m(Header, {
					...attrs.header,
				}),
				bottomNav: m(BottomNav),
			}),
		)
	}

	_createSettingsFolderNavButton(folder: SettingsFolder<unknown>): NavButtonAttrs {
		return {
			label: folder.name,
			icon: folder.icon,
			href: folder.url,
			colors: NavButtonColor.Nav,
			click: () => this.viewSlider.focus(this._settingsColumn),
			persistentBackground: true,
		}
	}

	_renderTemplateFolderRow(folder: SettingsFolder<TemplateGroupInstance>): Children {
		const instance = folder.data
		const isGroupOwner = isSharedGroupOwner(instance.group, getEtId(this.logins.getUserController().user))
		return m(SettingsFolderRow, {
			mainButtonAttrs: this._createSettingsFolderNavButton(folder),
			extraButton: m(
				IconButton,
				createMoreActionButtonAttrs(() => [
					isGroupOwner
						? {
								label: "delete_action",
								click: () => this._deleteTemplateGroup(folder.data),
								icon: Icons.Trash,
						  }
						: {
								label: "leaveGroup_action",
								click: () => this._leaveTemplateGroup(folder.data),
								icon: Icons.Trash,
						  },
					{
						label: "sharing_label",
						click: () => showGroupSharingDialog(folder.data.groupInfo, true),
						icon: Icons.ContactImport,
					},
					{
						label: "rename_action",
						click: () => showRenameTemplateListDialog(folder.data),
						icon: Icons.Edit,
					},
				]),
			),
		})
	}

	private _leaveTemplateGroup(templateInfo: TemplateGroupInstance) {
		return getConfirmation(() =>
			lang.get("confirmLeaveSharedGroup_msg", {
				"{groupName}": getSharedGroupName(templateInfo.groupInfo, this.logins.getUserController(), false),
			}),
		).confirmed(() => locator.groupManagementFacade.removeUserFromGroup(getEtId(this.logins.getUserController().user), templateInfo.groupInfo.group))
	}

	private _deleteTemplateGroup(templateInfo: TemplateGroupInstance) {
		return getConfirmation("confirmDeleteTemplateGroup_msg").confirmed(() =>
			showProgressDialog(
				"pleaseWait_msg",
				locator.serviceExecutor.delete(
					TemplateGroupService,
					createUserAreaGroupDeleteData({
						group: templateInfo.groupInfo.group,
					}),
				),
			),
		)
	}

	_renderTemplateInvitationFolderRow(invitation: ReceivedGroupInvitation): Children {
		return m(GroupInvitationFolderRow, {
			invitation: invitation,
			icon: BootIcons.Mail,
		})
	}

	_renderSidebarSectionChildren(folders: SettingsFolder<unknown>[]): Children {
		return m(
			"",
			folders
				.filter((folder) => folder.isVisible())
				.map((folder) => {
					const buttonAttrs = this._createSettingsFolderNavButton(folder)

					return m(SettingsFolderRow, {
						mainButtonAttrs: buttonAttrs,
					})
				}),
		)
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
	onNewUrl(args: Record<string, any>, requestedPath: string) {
		if (!args.folder) {
			this._setUrl(this._userFolders[0].url)
		} else if (args.folder || !m.route.get().startsWith("/settings")) {
			// ensure that current viewer will be reinitialized
			const folder = this._allSettingsFolders().find((folder) => folder.url === requestedPath)

			if (!folder) {
				this._setUrl(this._userFolders[0].url)
			} else if (this._selectedFolder.path === folder.path) {
				// folder path has not changed
				this._selectedFolder = folder // instance of SettingsFolder might have been changed in membership update, so replace this instance

				m.redraw()
			} else {
				// folder path has changed
				// to avoid misleading information, set the url to the folder's url, so the browser url
				// is changed to correctly represents the displayed content
				this._setUrl(folder.url)
				this._selectedFolder = folder
				this._currentViewer = null
				this.detailsViewer = null

				// make sure the currentViewer is available
				this._getCurrentViewer()

				m.redraw()
			}
		}
	}

	_getUserOwnedTemplateSettingsFolder(): SettingsFolder<unknown> {
		return this._templateFolders.find((folder) => isSharedGroupOwner(folder.data.group, this.logins.getUserController().user)) || this._dummyTemplateFolder
	}

	_allSettingsFolders(): ReadonlyArray<SettingsFolder<unknown>> {
		const hasOwnTemplates = this._templateFolders.some((folder) => isSharedGroupOwner(folder.data.group, this.logins.getUserController().user))

		return [
			...this._userFolders,
			...this._adminFolders,
			...(!hasOwnTemplates ? [this._dummyTemplateFolder] : []),
			...this._templateFolders,
			...this._knowledgeBaseFolders,
		]
	}

	_setUrl(url: string) {
		m.route.set(url + location.hash)
	}

	_isGlobalOrLocalAdmin(user: User): boolean {
		return user.memberships.some((m) => m.groupType === GroupType.Admin || m.groupType === GroupType.LocalAdmin)
	}

	focusSettingsDetailsColumn() {
		this.viewSlider.focus(this._settingsDetailsColumn)
	}

	private async updateShowBusinessSettings() {
		this.showBusinessSettings((await this.logins.getUserController().loadCustomer()).businessUse === true)
	}

	async entityEventsReceived<T>(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(CustomerTypeRef, update)) {
				await this.updateShowBusinessSettings()
			} else if (this.logins.getUserController().isUpdateForLoggedInUserInstance(update, eventOwnerGroupId)) {
				const user = this.logins.getUserController().user

				// the user admin status might have changed
				if (!this._isGlobalOrLocalAdmin(user) && this._currentViewer && this._adminFolders.some((f) => f.isActive())) {
					this._setUrl(this._userFolders[0].url)
				}

				// template group memberships may have changed
				if (this._templateFolders.length !== this.logins.getUserController().getTemplateMemberships().length) {
					const [templates, knowledgeBases] = await Promise.all([this._makeTemplateFolders(), this._makeKnowledgeBaseFolders()])
					this._templateFolders = templates
					this._knowledgeBaseFolders = knowledgeBases
					const currentRoute = m.route.get()

					if (currentRoute.startsWith(SETTINGS_PREFIX)) {
						const folder = m.route.param("folder")
						if (folder === "templates") {
							const templateListId = m.route.param("id")
							// We might have lost the membership on the template list
							const haveOpenedFolder = templates.some((t) => t.id === templateListId)

							// When user first creates a template group from the dummy list, we need to switch them to
							// the viewer for their newly created list.
							if (this._dummyTemplateFolder.url || !haveOpenedFolder) {
								this._setUrl(this._getUserOwnedTemplateSettingsFolder().url)
							}
						}
					}
				}
				m.redraw()
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update)) {
				this._customDomains.reset()
				this._adminFolders.length = 0
				// When switching a plan we hide/show certain admin settings.
				await this.populateAdminFolders()

				await this._customDomains.getAsync()
				m.redraw()
			}
		}

		await this._currentViewer?.entityEventsReceived(updates)

		await this.detailsViewer?.entityEventsReceived(updates)
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	_aboutThisSoftwareLink(): Children {
		const label = lang.get("about_label")
		const versionLabel = `Tutanota v${env.versionNumber}`
		return m(".pb.pt-l.flex-no-shrink.flex.col.justify-end", [
			m(
				"button.text-center.small.no-text-decoration",
				{
					style: {
						backgroundColor: "transparent",
					},
					href: "#",
					"aria-label": label,
					"aria-description": versionLabel,
					"aria-haspopup": "dialog",
					onclick: () => {
						this.viewSlider.focusNextColumn()
						setTimeout(() => {
							const dialog = Dialog.showActionDialog({
								title: () => lang.get("about_label"),
								child: () =>
									m(AboutDialog, {
										onShowSetupWizard: () => {
											dialog.close()
											locator.showSetupWizard()
										},
									}),
								allowOkWithReturn: true,
								okAction: (dialog: Dialog) => dialog.close(),
								allowCancel: false,
							})
						}, 200)
					},
				},
				[
					m("", versionLabel),
					m(
						".b",
						{
							style: {
								color: theme.navigation_button_selected,
							},
						},
						label,
					),
				],
			),
		])
	}

	async _makeTemplateFolders(): Promise<Array<SettingsFolder<TemplateGroupInstance>>> {
		const userController = this.logins.getUserController()
		const templateMemberships = userController.getTemplateMemberships()
		return promiseMap(
			await loadTemplateGroupInstances(templateMemberships, locator.entityClient),
			(groupInstance) =>
				new SettingsFolder(
					() => getSharedGroupName(groupInstance.groupInfo, userController, true),
					() => Icons.ListAlt,
					{
						folder: "templates",
						id: getEtId(groupInstance.group),
					},
					() =>
						new TemplateListView(
							groupInstance,
							locator.entityClient,
							this.logins,
							(viewer) => this.replaceDetailsViewer(viewer),
							() => this.focusSettingsDetailsColumn(),
						),
					groupInstance,
				),
		)
	}

	async _makeKnowledgeBaseFolders(): Promise<Array<SettingsFolder<void>>> {
		const userController = this.logins.getUserController()
		const customer = await userController.loadCustomer()

		if (isCustomizationEnabledForCustomer(customer, FeatureType.KnowledgeBase)) {
			const templateMemberships = (this.logins.getUserController() && this.logins.getUserController().getTemplateMemberships()) || []
			return promiseMap(
				await loadTemplateGroupInstances(templateMemberships, locator.entityClient),
				(groupInstance) =>
					new SettingsFolder(
						() => getSharedGroupName(groupInstance.groupInfo, userController, true),
						() => Icons.Book,
						{
							folder: "knowledgebase",
							id: getEtId(groupInstance.group),
						},
						() =>
							new KnowledgeBaseListView(
								locator.entityClient,
								this.logins,
								groupInstance.groupRoot,
								groupInstance.group,
								(viewer) => this.replaceDetailsViewer(viewer),
								() => this.focusSettingsDetailsColumn(),
							),
						undefined,
					),
			)
		} else {
			return []
		}
	}
}

function showRenameTemplateListDialog(instance: TemplateGroupInstance) {
	const logins = locator.logins
	const name = stream(getSharedGroupName(instance.groupInfo, logins.getUserController(), true))
	Dialog.showActionDialog({
		title: () => lang.get("renameTemplateList_label"),
		allowOkWithReturn: true,
		child: {
			view: () =>
				m(TextField, {
					value: name(),
					oninput: name,
					label: "templateGroupName_label",
				}),
		},
		okAction: (dialog: Dialog) => {
			dialog.close()
			const { userSettingsGroupRoot } = logins.getUserController()
			const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === instance.groupInfo.group)
			const newName = name()

			if (existingGroupSettings) {
				existingGroupSettings.name = newName
			} else {
				const newSettings = createGroupSettings({
					group: getEtId(instance.group),
					color: "",
					name: newName,
				})
				logins.getUserController().userSettingsGroupRoot.groupSettings.push(newSettings)
			}

			locator.entityClient.update(userSettingsGroupRoot).then(() => {
				if (isSharedGroupOwner(instance.group, logins.getUserController().user)) {
					instance.groupInfo.name = newName
					locator.entityClient.update(instance.groupInfo)
				}
			})
		},
	})
}
