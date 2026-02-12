import m, { Children, Vnode, VnodeDOM } from "mithril"
import stream from "mithril/stream"
import { assertMainOrNode, isIOSApp } from "../api/common/Env"
import { ColumnType, ViewColumn } from "../gui/base/ViewColumn"
import { ViewSlider } from "../gui/nav/ViewSlider.js"
import { SettingsFolder } from "../settings/SettingsFolder.js"
import { lang } from "../misc/LanguageViewModel"
import { AppHeaderAttrs, Header } from "../gui/Header.js"
import { GlobalSettingsViewer } from "../../mail-app/settings/GlobalSettingsViewer"
import { UserListView } from "../settings/UserListView.js"
import { CustomerInfoTypeRef, CustomerTypeRef, User } from "../api/entities/sys/TypeRefs.js"
import { GroupListView } from "../../mail-app/settings/groups/GroupListView.js"
import { WhitelabelSettingsViewer } from "../settings/whitelabel/WhitelabelSettingsViewer"
import { Icons } from "../gui/base/icons/Icons"
import { theme } from "../gui/theme"
import { FeatureType, GroupType } from "../api/common/TutanotaConstants"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { locator } from "../api/main/CommonLocator"
import { SubscriptionViewer } from "../subscription/SubscriptionViewer"
import { PaymentViewer } from "../subscription/PaymentViewer"
import type { NavButtonAttrs } from "../gui/base/NavButton.js"
import { NavButtonColor } from "../gui/base/NavButton.js"
import { layout_size } from "../gui/size"
import { FolderColumnView } from "../gui/FolderColumnView.js"
import { SidebarSection } from "../gui/SidebarSection"
import { SettingsFolderRow } from "../settings/SettingsFolderRow.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { exportUserCsv, loadUserExportData } from "../settings/UserDataExporter.js"
import { BottomNav } from "../../mail-app/gui/BottomNav.js"
import { BaseTopLevelView } from "../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { ReferralSettingsViewer } from "../settings/ReferralSettingsViewer.js"
import { LoginController } from "../api/main/LoginController.js"
import { BackgroundColumnLayout } from "../gui/BackgroundColumnLayout.js"
import { styles } from "../gui/styles.js"
import { MobileHeader } from "../gui/MobileHeader.js"
import { isCustomizationEnabledForCustomer } from "../api/common/utils/CustomerUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"
import { Dialog } from "../gui/base/Dialog.js"
import { AboutDialog } from "../settings/AboutDialog.js"
import { SettingsViewAttrs, UpdatableSettingsDetailsViewer, UpdatableSettingsViewer } from "../settings/Interfaces.js"
import { AffiliateSettingsViewer } from "../settings/AffiliateSettingsViewer.js"
import { AffiliateKpisViewer } from "../settings/AffiliateKpisViewer.js"
import { BaseButton } from "../gui/base/buttons/BaseButton"
import { showSupportDialog } from "../support/SupportDialog"
import { Icon, IconSize } from "../gui/base/Icon"
import { getSupportUsageTestStage } from "../support/SupportUsageTestUtils.js"
import { shouldHideBusinessPlans } from "../subscription/utils/SubscriptionUtils"
import { ButtonType } from "../gui/base/Button"
import { CancelledError } from "../api/common/error/CancelledError"
import { DrawerMenuAttrs } from "../gui/nav/DrawerMenu"
import { ManagedCustomerListView } from "./ManagedCustomersListView"

assertMainOrNode()

export interface PartnerViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	logins: LoginController
}

export class PartnerView extends BaseTopLevelView implements TopLevelView<PartnerViewAttrs> {
	viewSlider: ViewSlider
	private readonly _settingsFoldersColumn: ViewColumn
	private readonly _settingsColumn: ViewColumn
	private readonly _settingsDetailsColumn: ViewColumn
	private readonly _partnerFolders: SettingsFolder<unknown>[]
	private readonly logins: LoginController
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
	constructor(vnode: Vnode<SettingsViewAttrs>) {
		super()
		this.logins = vnode.attrs.logins
		this._partnerFolders = [
			new SettingsFolder(
				() => "adminUserList_action",
				() => BootIcons.User,
				"users",
				() =>
					new UserListView(
						(viewer) => this.replaceDetailsViewer(viewer),
						() => this.focusSettingsDetailsColumn(),
						() => false,
						() => {},
						() => this.doExportUsers(),
					),
				undefined,
				"partner",
			),
		]

		this._selectedFolder = this._partnerFolders[0]

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
									name: "partnerSettings_label",
								},
								[this._renderSidebarSectionChildren(this._partnerFolders)],
							),
							this._bottomSection(),
						]),
						ariaLabel: "settings_label",
					})
				},
			},
			ColumnType.Foreground,
			{
				minWidth: layout_size.first_col_min_width,
				maxWidth: layout_size.first_col_max_width,
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
								class: styles.isUsingBottomNavigation() ? "" : "border-radius-top-left-12",
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
		this.navTarget = {
			folder: m.route.param("folder"),
			route: m.route.get(),
		}
	}

	private async populateAdminFolders() {
		await this.updateShowBusinessSettings()
		await this.updateShowAffiliateSettings()
		const currentPlanType = await this.logins.getUserController().getPlanType()

		const adminFolders: SettingsFolder<unknown>[] = []

		if (await this.logins.getUserController().canHaveUsers()) {
			adminFolders.push(
				new SettingsFolder(
					() => "adminUserList_action",
					() => BootIcons.User,
					"users",
					() =>
						new ManagedCustomerListView(
							(viewer) => this.replaceDetailsViewer(viewer),
							() => this.focusSettingsDetailsColumn(),
							() => false,
							() => {},
							() => this.doExportUsers(),
						),
					undefined,
				),
			)
			if (!this.logins.isEnabled(FeatureType.WhitelabelChild)) {
				adminFolders.push(
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
			adminFolders.push(
				new SettingsFolder(
					() => "globalSettings_label",
					() => BootIcons.Settings,
					"global",
					() => new GlobalSettingsViewer(),
					undefined,
				),
			)

			if (!this.logins.isEnabled(FeatureType.WhitelabelChild) && !shouldHideBusinessPlans()) {
				adminFolders.push(
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
				adminFolders.push(
					new SettingsFolder<void>(
						() => "adminSubscription_action",
						() => BootIcons.Premium,
						"subscription",
						() => new SubscriptionViewer(currentPlanType, isIOSApp() ? locator.mobilePaymentsFacade : null),
						undefined,
					),
				)

				adminFolders.push(
					new SettingsFolder<void>(
						() => "adminPayment_action",
						() => Icons.CreditCard,
						"invoice",
						() => new PaymentViewer(),
						undefined,
					),
				)

				adminFolders.push(
					new SettingsFolder(
						() => "referralSettings_label",
						() => BootIcons.Share,
						"referral",
						() => new ReferralSettingsViewer(),
						undefined,
					).setIsVisibleHandler(() => !this.showBusinessSettings()),
				)

				adminFolders.push(
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
			// We have to wait for the mailSets to be initialized before setting the URL,
			// otherwise we won't find the requested folder and will just pick the default folder
			const routeWithoutHash = m.route.get().split("#", 2)[0]
			const stillAtDefaultUrl = routeWithoutHash === this._partnerFolders[0].url
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
				// mailSets are loaded
				this.navTarget = null
				this.viewSlider.focus(this._settingsColumn)
			},
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
			this._setUrl(this._partnerFolders[0].url)
		} else if (args.folder || !m.route.get().startsWith("/partner")) {
			// ensure that current viewer will be reinitialized
			const folder = this._allSettingsFolders().find((folder) => folder.matches(args.folder, args.id))

			if (!folder) {
				this._setUrl(this._partnerFolders[0].url)
			} else if (this._selectedFolder.isSameFolder(folder)) {
				// folder path has not changed
				this._selectedFolder = folder // instance of SettingsFolder might have been changed in membership update, so replace this instance

				m.redraw()
				this.scrollSectionIntoView(requestedPath)
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
				this.scrollSectionIntoView(requestedPath)
			}
		}
	}

	/** If the URL specifies `#section=mysection` try to find the mentioned view and highlight it*/
	private scrollSectionIntoView(requestedPath: string) {
		const hashParams = requestedPath.split("#", 2)[1]
		const section = hashParams ? m.parseQueryString(hashParams).section : null
		if (typeof section === "string") {
			// we don't know when the render will happen so we just delay it slightly
			setTimeout(() => {
				console.log(`scrolling ${section} into view`)
				const sectionElement = document.getElementById(section)
				if (sectionElement) {
					sectionElement?.scrollIntoView({ behavior: "smooth", block: "start" })
					// do a quick flash of the target element
					sectionElement.animate(
						[
							{ background: "orange", easing: "ease-in-out " },
							{ background: "initial", easing: "ease-out" },
							{ background: "orange", easing: "ease-out" },
							{ background: "initial", easing: "ease-out" },
						],
						900,
					)
				} else {
					console.warn(`Could not find view for section "${section}"`)
				}
			}, 250)
		}
	}

	_allSettingsFolders(): ReadonlyArray<SettingsFolder<unknown>> {
		return [...this._partnerFolders]
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
				m.redraw()
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update)) {
				// When switching a plan we hide/show certain admin settings.
				await this.populateAdminFolders()
				m.redraw()
			}
		}

		await this._currentViewer?.entityEventsReceived(updates)

		await this.detailsViewer?.entityEventsReceived(updates)
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	_bottomSection(): Children {
		const isFirstPartyDomain = locator.domainConfigProvider().getCurrentDomainConfig().firstPartyDomain

		return m(".pb-16.pt-32.flex-no-shrink.flex.col.justify-end.gap-16", [
			// Support button
			m(BaseButton, {
				class: "flash flex justify-center center-vertically pt-8 pb-8 plr-12 border-radius",
				style: {
					marginInline: "auto",
					border: `1px solid ${theme.on_surface_variant}`,
					color: theme.on_surface,
				},
				label: "supportMenu_label",
				text: m(".pl-4", lang.getTranslation("supportMenu_label").text),
				icon: m(Icon, {
					icon: Icons.SpeechBubbleFill,
					size: IconSize.PX24,
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
