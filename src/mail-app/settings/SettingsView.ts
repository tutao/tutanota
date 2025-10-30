import m, { Children, Vnode, VnodeDOM } from "mithril"
import stream from "mithril/stream"
import { assertMainOrNode, isApp, isDesktop, isIOSApp } from "../../common/api/common/Env"
import { ColumnType, ViewColumn } from "../../common/gui/base/ViewColumn"
import { ViewSlider } from "../../common/gui/nav/ViewSlider.js"
import { SettingsFolder } from "../../common/settings/SettingsFolder.js"
import { lang } from "../../common/misc/LanguageViewModel"
import { Header } from "../../common/gui/Header.js"
import { LoginSettingsViewer } from "../../common/settings/login/LoginSettingsViewer.js"
import { GlobalSettingsViewer } from "./GlobalSettingsViewer"
import { DesktopSettingsViewer } from "./DesktopSettingsViewer"
import { MailSettingsViewer } from "./MailSettingsViewer"
import { UserListView } from "../../common/settings/UserListView.js"
import { CustomerInfoTypeRef, CustomerTypeRef, GroupInfoTypeRef, ReceivedGroupInvitation, User } from "../../common/api/entities/sys/TypeRefs.js"
import { GroupListView } from "./groups/GroupListView.js"
import { WhitelabelSettingsViewer } from "../../common/settings/whitelabel/WhitelabelSettingsViewer"
import { Icons } from "../../common/gui/base/icons/Icons"
import { theme } from "../../common/gui/theme"
import { FeatureType, GroupType } from "../../common/api/common/TutanotaConstants"
import { BootIcons } from "../../common/gui/base/icons/BootIcons"
import { locator } from "../../common/api/main/CommonLocator"
import { SubscriptionViewer } from "../../common/subscription/SubscriptionViewer"
import { PaymentViewer } from "../../common/subscription/PaymentViewer"
import { showUserImportDialog } from "../../common/settings/UserViewer.js"
import { clone, LazyLoaded, partition, promiseMap } from "@tutao/tutanota-utils"
import { AppearanceSettingsViewer } from "../../common/settings/AppearanceSettingsViewer.js"
import type { NavButtonAttrs } from "../../common/gui/base/NavButton.js"
import { NavButtonColor } from "../../common/gui/base/NavButton.js"
import { SETTINGS_PREFIX } from "../../common/misc/RouteChange"
import { size } from "../../common/gui/size"
import { FolderColumnView } from "../../common/gui/FolderColumnView.js"
import { getEtId } from "../../common/api/common/utils/EntityUtils"
import { KnowledgeBaseListView } from "./KnowledgeBaseListView"
import type { TemplateGroupInstance } from "../templates/model/TemplateGroupModel"
import { showGroupSharingDialog } from "../../common/sharing/view/GroupSharingDialog"
import { createMoreActionButtonAttrs, getConfirmation } from "../../common/gui/base/GuiUtils"
import { SidebarSection } from "../../common/gui/SidebarSection"
import { ReceivedGroupInvitationsModel } from "../../common/sharing/model/ReceivedGroupInvitationsModel"
import { getNullableSharedGroupName, getSharedGroupName, isSharedGroupOwner } from "../../common/sharing/GroupUtils"
import { DummyTemplateListView } from "./DummyTemplateListView"
import { SettingsFolderRow } from "../../common/settings/SettingsFolderRow.js"
import { showProgressDialog } from "../../common/gui/dialogs/ProgressDialog"
import { createUserAreaGroupDeleteData, UserSettingsGroupRootTypeRef } from "../../common/api/entities/tutanota/TypeRefs.js"
import { GroupInvitationFolderRow } from "../../common/sharing/view/GroupInvitationFolderRow"
import { TemplateGroupService } from "../../common/api/entities/tutanota/Services"
import { exportUserCsv, loadUserExportData } from "../../common/settings/UserDataExporter.js"
import { IconButton } from "../../common/gui/base/IconButton.js"
import { BottomNav } from "../gui/BottomNav.js"
import { getAvailableDomains } from "../../common/settings/mailaddress/MailAddressesUtils.js"
import { BaseTopLevelView } from "../../common/gui/BaseTopLevelView.js"
import { TopLevelView } from "../../TopLevelView.js"
import { ReferralSettingsViewer } from "../../common/settings/ReferralSettingsViewer.js"
import { LoginController } from "../../common/api/main/LoginController.js"
import { BackgroundColumnLayout } from "../../common/gui/BackgroundColumnLayout.js"
import { styles } from "../../common/gui/styles.js"
import { MobileHeader } from "../../common/gui/MobileHeader.js"
import { isCustomizationEnabledForCustomer } from "../../common/api/common/utils/CustomerUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../common/api/common/utils/EntityUpdateUtils.js"
import { Dialog } from "../../common/gui/base/Dialog.js"
import { AboutDialog } from "../../common/settings/AboutDialog.js"
import { loadTemplateGroupInstances } from "../templates/model/TemplatePopupModel.js"
import { TemplateListView } from "./TemplateListView.js"
import { ContactsSettingsViewer } from "./ContactsSettingsViewer.js"
import { NotificationSettingsViewer } from "./NotificationSettingsViewer.js"
import { SettingsViewAttrs, UpdatableSettingsDetailsViewer, UpdatableSettingsViewer } from "../../common/settings/Interfaces.js"
import { AffiliateSettingsViewer } from "../../common/settings/AffiliateSettingsViewer.js"
import { AffiliateKpisViewer } from "../../common/settings/AffiliateKpisViewer.js"
import { DesktopMailImportSettingsViewer } from "./DesktopMailImportSettingsViewer.js"
import { KeyManagementSettingsViewer } from "../../common/settings/keymanagement/KeyManagementSettingsViewer.js"
import { mailLocator } from "../mailLocator"
import { WebMailImportSettingsViewer } from "./WebMailImportSettingsViewer.js"
import { BaseButton } from "../../common/gui/base/buttons/BaseButton"
import { showSupportDialog } from "../../common/support/SupportDialog"
import { Icon, IconSize } from "../../common/gui/base/Icon"
import { MailExportViewer } from "./MailExportViewer"
import { getSupportUsageTestStage } from "../../common/support/SupportUsageTestUtils.js"
import { shouldHideBusinessPlans } from "../../common/subscription/utils/SubscriptionUtils"
import { ButtonType } from "../../common/gui/base/Button"
import { CancelledError } from "../../common/api/common/error/CancelledError"
import { GroupNameData } from "../../common/sharing/model/GroupSettingsModel"
import { GroupSettingNameInputFields } from "../../common/sharing/view/GroupSettingNameInputFields"

assertMainOrNode()

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
	private showAffiliateSettings: boolean = false
	/**
	 * The URL which we want to navigate to once everything is loaded.
	 * Reset on selecting another settings folder.
	 */
	private navTarget: { folder: string; route: string } | null
	detailsViewer: UpdatableSettingsDetailsViewer | null = null // the component for the details column. can be set by settings views

	_customDomains: LazyLoaded<string[]>
	_templateInvitations: ReceivedGroupInvitationsModel<GroupType.Template>

	constructor(vnode: Vnode<SettingsViewAttrs>) {
		super()
		this.logins = vnode.attrs.logins
		this._userFolders = [
			new SettingsFolder(
				() => "login_label",
				() => BootIcons.User,
				"login",
				() => new LoginSettingsViewer(locator.credentialsProvider, isApp() ? locator.systemFacade : null),
				undefined,
			),
			new SettingsFolder(
				() => "email_label",
				() => BootIcons.Mail,
				"mail",
				() => new MailSettingsViewer(),
				undefined,
			),
			new SettingsFolder(
				() => "contacts_label",
				() => BootIcons.Contacts,
				"contacts",
				() => new ContactsSettingsViewer(),
				undefined,
			),
			new SettingsFolder(
				() => "appearanceSettings_label",
				() => Icons.Palette,
				"appearance",
				() => new AppearanceSettingsViewer(),
				undefined,
			),
			new SettingsFolder(
				() => "notificationSettings_action",
				() => Icons.Bell,
				"notifications",
				() => new NotificationSettingsViewer(),
				undefined,
			),
			new SettingsFolder(
				() => "keyManagement_label",
				() => Icons.KeySolid,
				"keymanagement",
				() => {
					const settingsViewer = new KeyManagementSettingsViewer(
						locator.keyVerificationFacade,
						() => locator.desktopSystemFacade,
						() => locator.systemFacade, // not available in browser
						locator.logins.getUserController(),
						locator.usageTestController,
						locator.publicIdentityKeyProvider,
						locator.themeController,
						locator.identityKeyCreator,
					)
					settingsViewer.init()
					return settingsViewer
				},
				undefined,
			),
		]

		if (isDesktop()) {
			this._userFolders.push(
				new SettingsFolder(
					() => "desktop_label",
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

		mailLocator.mailboxModel.getMailboxDetails().then((mailboxes) => {
			this._userFolders.push(
				new SettingsFolder(
					() => "mailImportSettings_label",
					() => Icons.Import,
					"mailImport",
					() => {
						if (isDesktop()) {
							return new DesktopMailImportSettingsViewer(() => mailLocator.getMailImporter())
						} else {
							return new WebMailImportSettingsViewer()
						}
					},
					undefined,
				),
			)
		})

		this._userFolders.push(
			new SettingsFolder(
				() => "mailExportSettings_label",
				() => Icons.Export,
				"mailExport",
				() => new MailExportViewer(),
				undefined,
			),
		)

		this._adminFolders = []
		this._templateFolders = []

		this._makeTemplateFolders().then((folders) => {
			this._templateFolders = folders
			m.redraw()
		})

		this._dummyTemplateFolder = new SettingsFolder<void>(
			() => "templateGroupDefaultName_label",
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
							this.logins.isUserLoggedIn() && this.logins.getUserController().isGlobalAdmin()
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
							this._bottomSection(),
						]),
						ariaLabel: "settings_label",
					})
				},
			},
			ColumnType.Foreground,
			{
				minWidth: size.first_col_min_width,
				maxWidth: size.first_col_max_width,
				headerCenter: "settings_label",
			},
		)
		this._settingsColumn = new ViewColumn(
			{
				// the CSS improves the situation on devices with notches (no control elements
				// are concealed), but there's still room for improvement for scrollbars
				view: () =>
					m(BackgroundColumnLayout, {
						backgroundColor: theme.surface_container,
						columnLayout: m(
							".mlr-safe-inset.fill-absolute.content-bg",
							{
								class: styles.isUsingBottomNavigation() ? "" : "border-radius-top-left-big",
							},
							m(this._getCurrentViewer()!),
						),
						mobileHeader: () =>
							m(MobileHeader, {
								...vnode.attrs.header,
								backAction: () => this.viewSlider.focusPreviousColumn(),
								columnType: "first",
								title: this._selectedFolder.name(),
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
				headerCenter: this._selectedFolder.name,
			},
		)
		this._settingsDetailsColumn = new ViewColumn(
			{
				view: () =>
					m(BackgroundColumnLayout, {
						backgroundColor: theme.surface_container,
						columnLayout: m(
							`.mlr-safe-inset.fill-absolute${this.detailsViewer ? ".content-bg" : ""}`,
							this.detailsViewer ? this.detailsViewer.renderView() : m(""),
						),
						mobileHeader: () =>
							m(MobileHeader, {
								...vnode.attrs.header,
								backAction: () => this.viewSlider.focusPreviousColumn(),
								columnType: "other",
								title: this._selectedFolder.name(),
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
				headerCenter: "settings_label",
			},
		)
		this.viewSlider = new ViewSlider([this._settingsFoldersColumn, this._settingsColumn, this._settingsDetailsColumn])

		this._customDomains = new LazyLoaded(async () => {
			const domainInfos = await getAvailableDomains(this.logins, true)
			return domainInfos.map((info) => info.domain)
		})

		this._customDomains.getAsync().then(() => m.redraw())

		this.navTarget = {
			folder: m.route.param("folder"),
			route: m.route.get(),
		}
	}

	private async populateAdminFolders() {
		await this.updateShowBusinessSettings()
		await this.updateShowAffiliateSettings()
		const currentPlanType = await this.logins.getUserController().getPlanType()

		if (await this.logins.getUserController().canHaveUsers()) {
			this._adminFolders.push(
				new SettingsFolder(
					() => "adminUserList_action",
					() => BootIcons.User,
					"users",
					() =>
						new UserListView(
							(viewer) => this.replaceDetailsViewer(viewer),
							() => this.focusSettingsDetailsColumn(),
							() => !isApp() && this._customDomains.isLoaded() && this._customDomains.getLoaded().length > 0,
							() => showUserImportDialog(this._customDomains.getLoaded()),
							() => this.doExportUsers(),
						),
					undefined,
				),
			)
			if (!this.logins.isEnabled(FeatureType.WhitelabelChild)) {
				this._adminFolders.push(
					new SettingsFolder(
						() => "sharedMailboxes_label",
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
					() => "globalSettings_label",
					() => BootIcons.Settings,
					"global",
					() => new GlobalSettingsViewer(),
					undefined,
				),
			)

			if (!this.logins.isEnabled(FeatureType.WhitelabelChild) && !shouldHideBusinessPlans()) {
				this._adminFolders.push(
					new SettingsFolder(
						() => "whitelabel_label",
						() => Icons.Wand,
						"whitelabel",
						() => new WhitelabelSettingsViewer(locator.entityClient, this.logins, locator.themeController, locator.whitelabelThemeGenerator),
						undefined,
					),
				)
			}
		}

		if (!this.logins.isEnabled(FeatureType.WhitelabelChild)) {
			if (this.logins.getUserController().isGlobalAdmin()) {
				this._adminFolders.push(
					new SettingsFolder<void>(
						() => "adminSubscription_action",
						() => BootIcons.Premium,
						"subscription",
						() => new SubscriptionViewer(currentPlanType, isIOSApp() ? locator.mobilePaymentsFacade : null),
						undefined,
					),
				)

				this._adminFolders.push(
					new SettingsFolder<void>(
						() => "adminPayment_action",
						() => Icons.CreditCard,
						"invoice",
						() => new PaymentViewer(),
						undefined,
					),
				)

				this._adminFolders.push(
					new SettingsFolder(
						() => "referralSettings_label",
						() => BootIcons.Share,
						"referral",
						() => new ReferralSettingsViewer(),
						undefined,
					).setIsVisibleHandler(() => !this.showBusinessSettings()),
				)

				this._adminFolders.push(
					new SettingsFolder(
						() => "affiliateSettings_label",
						() => BootIcons.Share,
						"affiliate",
						() =>
							new AffiliateSettingsViewer(
								() => this.viewSlider.focusedColumn === this._settingsDetailsColumn,
								() => {
									if (this.viewSlider.focusedColumn !== this._settingsDetailsColumn) {
										this.replaceDetailsViewer(new AffiliateKpisViewer())
										this.focusSettingsDetailsColumn()
									} else {
										this.replaceDetailsViewer(null)
										this.viewSlider.focus(this._settingsColumn)
									}
								},
							),
						undefined,
					).setIsVisibleHandler(() => this.showAffiliateSettings),
				)
			}
		}
		m.redraw()
	}

	private replaceDetailsViewer(viewer: UpdatableSettingsDetailsViewer | null): UpdatableSettingsDetailsViewer | null {
		return (this.detailsViewer = viewer)
	}

	oncreate(vnode: Vnode<SettingsViewAttrs>) {
		locator.eventController.addEntityListener(this.entityListener)
		this.populateAdminFolders().then(() => {
			// We have to wait for the folders to be initialized before setting the URL,
			// otherwise we won't find the requested folder and will just pick the default folder
			const stillAtDefaultUrl = m.route.get() === this._userFolders[0].url
			if (stillAtDefaultUrl && this.navTarget) {
				this.onNewUrl({ folder: this.navTarget.folder }, this.navTarget.route)
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
			label: folder.name(),
			icon: folder.icon,
			href: folder.url,
			colors: NavButtonColor.Nav,
			click: () => {
				// clear nav target if we navigate away before admin
				// folders are loaded
				this.navTarget = null
				this.viewSlider.focus(this._settingsColumn)
			},
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
		return getConfirmation(
			lang.getTranslation("confirmLeaveSharedGroup_msg", {
				"{groupName}": getSharedGroupName(templateInfo.groupInfo, this.logins.getUserController().userSettingsGroupRoot, false),
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

	_getCurrentViewer(): UpdatableSettingsViewer | null {
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

	_isGlobalAdmin(user: User): boolean {
		return user.memberships.some((m) => m.groupType === GroupType.Admin)
	}

	focusSettingsDetailsColumn() {
		void this.viewSlider.focus(this._settingsDetailsColumn)
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
				if (!this._isGlobalAdmin(user) && this._currentViewer && this._adminFolders.some((f) => f.isActive())) {
					this._setUrl(this._userFolders[0].url)
				}

				// template group memberships may have changed
				if (this._templateFolders.length !== this.logins.getUserController().getTemplateMemberships().length) {
					const templates = await this.reloadTemplateData()
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
			} else if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update) || isUpdateForTypeRef(GroupInfoTypeRef, update)) {
				await this.reloadTemplateData()
				m.redraw()
			}
		}

		await this._currentViewer?.entityEventsReceived(updates)

		await this.detailsViewer?.entityEventsReceived(updates)
	}

	private async reloadTemplateData(): Promise<SettingsFolder<TemplateGroupInstance>[]> {
		const [templates, knowledgeBases] = await Promise.all([this._makeTemplateFolders(), this._makeKnowledgeBaseFolders()])
		this._templateFolders = templates
		this._knowledgeBaseFolders = knowledgeBases
		return templates
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	_bottomSection(): Children {
		const isFirstPartyDomain = locator.domainConfigProvider().getCurrentDomainConfig().firstPartyDomain

		return m(".pb.pt-l.flex-no-shrink.flex.col.justify-end.gap-vpad", [
			// Support button
			m(BaseButton, {
				class: "flash flex justify-center center-vertically pt-s pb-s plr border-radius",
				style: {
					marginInline: "auto",
					border: `1px solid ${theme.on_surface_variant}`,
					color: theme.on_surface,
				},
				label: "supportMenu_label",
				text: m(".pl-s", lang.getTranslation("supportMenu_label").text),
				icon: m(Icon, {
					icon: Icons.SpeechBubbleFill,
					size: IconSize.Medium,
					class: "center-h",
					container: "div",
					style: { fill: theme.on_surface_variant },
				}),
				onclick: () => {
					const triggerStage = getSupportUsageTestStage(0)
					triggerStage.setMetric({ name: "Trigger", value: "Settings" })
					void triggerStage.complete()

					void showSupportDialog(locator.logins)
				},
			}),
			// About button
			isFirstPartyDomain ? this._aboutThisSoftwareLink() : null,
		])
	}

	_aboutThisSoftwareLink(): Children {
		const label = lang.get("about_label")
		const versionLabel = `Tuta v${env.versionNumber}`
		return m(
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
							title: "about_label",
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
							color: theme.primary,
						},
					},
					label,
				),
			],
		)
	}

	async _makeTemplateFolders(): Promise<Array<SettingsFolder<TemplateGroupInstance>>> {
		const userController = this.logins.getUserController()
		const templateMemberships = userController.getTemplateMemberships()
		return promiseMap(await loadTemplateGroupInstances(templateMemberships, locator.entityClient), (groupInstance) => {
			const sharedGroupName = getNullableSharedGroupName(groupInstance.groupInfo, userController.userSettingsGroupRoot, true)
			return new SettingsFolder(
				() => (sharedGroupName ? lang.makeTranslation("templateGroupDefaultName_label", sharedGroupName) : "templateGroupDefaultName_label"),
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
			)
		})
	}

	async _makeKnowledgeBaseFolders(): Promise<Array<SettingsFolder<void>>> {
		const userController = this.logins.getUserController()
		const customer = await userController.loadCustomer()

		if (isCustomizationEnabledForCustomer(customer, FeatureType.KnowledgeBase)) {
			const templateMemberships = (this.logins.getUserController() && this.logins.getUserController().getTemplateMemberships()) || []
			return promiseMap(await loadTemplateGroupInstances(templateMemberships, locator.entityClient), (groupInstance) => {
				const sharedGroupName = getNullableSharedGroupName(groupInstance.groupInfo, userController.userSettingsGroupRoot, true)
				return new SettingsFolder(
					() => (sharedGroupName ? lang.makeTranslation("templateGroupDefaultName_label", sharedGroupName) : "templateGroupDefaultName_label"),
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
				)
			})
		} else {
			return []
		}
	}

	private async updateShowAffiliateSettings() {
		const customer = await this.logins.getUserController().loadCustomer()
		this.showAffiliateSettings = isCustomizationEnabledForCustomer(customer, FeatureType.AffiliatePartner)
	}

	private async doExportUsers() {
		try {
			const progress = stream(0)
			let progressText = lang.getTranslation("pleaseWait_msg")
			const abortController = new AbortController()

			const data = await showProgressDialog(
				() => progressText,
				loadUserExportData(
					locator.entityClient,
					this.logins,
					locator.counterFacade,
					(complete: number, total: number) => {
						progressText = lang.getTranslation("userExportProgress_msg", {
							"{current}": complete,
							"{total}": total,
						})
						progress((complete / total) * 100)
					},
					abortController.signal,
				),
				progress,
				{
					middle: "exportUsers_action",
					left: [
						{
							label: "cancel_action",
							type: ButtonType.Primary,
							click: () => abortController.abort(),
						},
					],
				},
			)
			await exportUserCsv(data, locator.fileController)
		} catch (e) {
			if (e instanceof CancelledError) {
				return
			}
			throw e
		}
	}
}

async function showRenameTemplateListDialog(instance: TemplateGroupInstance) {
	const groupSettingsModel = await locator.groupSettingsModel()
	const groupNameData = await groupSettingsModel.getGroupNameData(instance.groupInfo)
	const newData = clone<GroupNameData>(groupNameData)
	Dialog.showActionDialog({
		title: "renameTemplateList_label",
		allowOkWithReturn: true,
		child: {
			view: () => {
				return m(GroupSettingNameInputFields, { groupNameData: newData })
			},
		},
		okAction: (dialog: Dialog) => {
			dialog.close()
			groupSettingsModel.updateGroupNameData(instance.groupInfo, newData)
		},
	})
}
