import m, { Children, Vnode, VnodeDOM } from "mithril"
import stream from "mithril/stream"
import { assertMainOrNode, isApp, isIOSApp } from "../../../common/api/common/Env.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { TopLevelView } from "../../../TopLevelView.js"
import { Header } from "../../../common/gui/Header.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView.js"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn.js"
import { SettingsFolder } from "../../../common/settings/SettingsFolder.js"
import { LazyLoaded } from "@tutao/tutanota-utils"
import { FeatureType, GroupType, LegacyPlans } from "../../../common/api/common/TutanotaConstants.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { LoginSettingsViewer } from "../../../common/settings/login/LoginSettingsViewer.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { AppearanceSettingsViewer } from "../../../common/settings/AppearanceSettingsViewer.js"
import { FolderColumnView } from "../../../common/gui/FolderColumnView.js"
import { SidebarSection } from "../../../common/gui/SidebarSection.js"
import { SettingsFolderRow } from "../../../common/settings/SettingsFolderRow.js"
import { size } from "../../../common/gui/size.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { BackgroundColumnLayout } from "../../../common/gui/BackgroundColumnLayout.js"
import { theme } from "../../../common/gui/theme.js"
import { styles } from "../../../common/gui/styles.js"
import { MobileHeader } from "../../../common/gui/MobileHeader.js"
import { getAvailableDomains } from "../../../common/settings/mailaddress/MailAddressesUtils.js"
import { UserListView } from "../../../common/settings/UserListView.js"
import { showUserImportDialog, UserViewer } from "../../../common/settings/UserViewer.js"
import { exportUserCsv } from "../../../common/settings/UserDataExporter.js"
import { GroupListView } from "../../../mail-app/settings/groups/GroupListView.js"
import { WhitelabelSettingsViewer } from "../../../common/settings/whitelabel/WhitelabelSettingsViewer.js"
import { SubscriptionViewer } from "../../../common/subscription/SubscriptionViewer.js"
import { PaymentViewer } from "../../../common/subscription/PaymentViewer.js"
import { ReferralSettingsViewer } from "../../../common/settings/ReferralSettingsViewer.js"
import { GroupDetailsView } from "../../../common/settings/groups/GroupDetailsView.js"
import { TemplateDetailsViewer } from "../../../mail-app/settings/TemplateDetailsViewer.js"
import { KnowledgeBaseSettingsDetailsViewer } from "../../../mail-app/settings/KnowledgeBaseListView.js"
import { NavButtonAttrs, NavButtonColor } from "../../../common/gui/base/NavButton.js"
import { CustomerInfoTypeRef, CustomerTypeRef, User } from "../../../common/api/entities/sys/TypeRefs.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { AboutDialog } from "../../../common/settings/AboutDialog.js"
import { SettingsViewAttrs, UpdatableSettingsDetailsViewer, UpdatableSettingsViewer } from "../../../common/settings/Interfaces.js"
import { NotificationSettingsViewer } from "./NotificationSettingsViewer.js"
import { GlobalSettingsViewer } from "./GlobalSettingsViewer.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { CalendarBottomNav } from "../../gui/CalendarBottomNav.js"

assertMainOrNode()

export class SettingsView extends BaseTopLevelView implements TopLevelView<SettingsViewAttrs> {
	viewSlider: ViewSlider
	private readonly _settingsFoldersColumn: ViewColumn
	private readonly _settingsColumn: ViewColumn
	private readonly _settingsDetailsColumn: ViewColumn
	private readonly _userFolders: SettingsFolder<unknown>[]
	private readonly _adminFolders: SettingsFolder<unknown>[]
	private readonly logins: LoginController
	private _selectedFolder: SettingsFolder<unknown>
	private _currentViewer: UpdatableSettingsViewer | null = null
	private showBusinessSettings: stream<boolean> = stream(false)
	private readonly _targetFolder: string
	private readonly _targetRoute: string
	detailsViewer: UpdatableSettingsDetailsViewer | null = null // the component for the details column. can be set by settings views

	_customDomains: LazyLoaded<string[]>

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

		this._adminFolders = []

		this._selectedFolder = this._userFolders[0]

		this._settingsFoldersColumn = new ViewColumn(
			{
				view: () => {
					return m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
						button: null,
						content: m(".flex.flex-grow.col", [
							m(
								SidebarSection,
								{
									name: "userSettings_label",
								},
								this._renderSidebarSectionChildren(this._userFolders),
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
							m(this.getCurrentViewer()),
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
						() => new SubscriptionViewer(currentPlanType, isIOSApp() ? locator.mobilePaymentsFacade : null, locator.appStorePaymentPicker),
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
				bottomNav: m(CalendarBottomNav),
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

	private getCurrentViewer(): UpdatableSettingsViewer {
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
				this.getCurrentViewer()

				m.redraw()
			}
		}
	}

	_allSettingsFolders(): ReadonlyArray<SettingsFolder<unknown>> {
		return [...this._userFolders, ...this._adminFolders]
	}

	_setUrl(url: string) {
		m.route.set(url + location.hash)
	}

	_isGlobalAdmin(user: User): boolean {
		return user.memberships.some((m) => m.groupType === GroupType.Admin)
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
				if (!this._isGlobalAdmin(user) && this._currentViewer && this._adminFolders.some((f) => f.isActive())) {
					this._setUrl(this._userFolders[0].url)
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
}
