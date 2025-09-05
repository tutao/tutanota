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
import { LazyLoaded, lazyStringValue } from "@tutao/tutanota-utils"
import { FeatureType, GroupType } from "../../../common/api/common/TutanotaConstants.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { LoginSettingsViewer } from "../../../common/settings/login/LoginSettingsViewer.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { AppearanceSettingsViewer } from "../../../common/settings/AppearanceSettingsViewer.js"
import { component_size, layout_size, px, size } from "../../../common/gui/size.js"
import { lang, MaybeTranslation } from "../../../common/misc/LanguageViewModel.js"
import { BackgroundColumnLayout } from "../../../common/gui/BackgroundColumnLayout.js"
import { theme } from "../../../common/gui/theme.js"
import { styles } from "../../../common/gui/styles.js"
import { MobileHeader } from "../../../common/gui/MobileHeader.js"
import { getAvailableDomains } from "../../../common/settings/mailaddress/MailAddressesUtils.js"
import { WhitelabelSettingsViewer } from "../../../common/settings/whitelabel/WhitelabelSettingsViewer.js"
import { SubscriptionViewer } from "../../../common/subscription/SubscriptionViewer.js"
import { PaymentViewer } from "../../../common/subscription/PaymentViewer.js"
import { ReferralSettingsViewer } from "../../../common/settings/ReferralSettingsViewer.js"
import { NavButtonAttrs, NavButtonColor } from "../../../common/gui/base/NavButton.js"
import { CustomerInfoTypeRef, CustomerTypeRef, User } from "../../../common/api/entities/sys/TypeRefs.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { AboutDialog } from "../../../common/settings/AboutDialog.js"
import { CalendarSettingsViewAttrs, UpdatableSettingsDetailsViewer, UpdatableSettingsViewer } from "../../../common/settings/Interfaces.js"
import { NotificationSettingsViewer } from "./NotificationSettingsViewer.js"
import { GlobalSettingsViewer } from "./GlobalSettingsViewer.js"
import { calendarLocator } from "../../calendarLocator.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { CALENDAR_PREFIX, SETTINGS_PREFIX } from "../../../common/misc/RouteChange.js"
import { SettingsNavButton, SettingsNavButtonAttrs } from "../../gui/SettingsNavButton.js"
import { getSafeAreaInsetBottom } from "../../../common/gui/HtmlUtils.js"
import { BaseButton } from "../../../common/gui/base/buttons/BaseButton.js"
import { Icon, IconSize } from "../../../common/gui/base/Icon.js"
import { showSupportDialog } from "../../../common/support/SupportDialog.js"
import { getSupportUsageTestStage } from "../../../common/support/SupportUsageTestUtils.js"
import { shouldHideBusinessPlans } from "../../../common/subscription/utils/SubscriptionUtils"

assertMainOrNode()

export class CalendarSettingsView extends BaseTopLevelView implements TopLevelView<CalendarSettingsViewAttrs> {
	viewSlider: ViewSlider
	private readonly settingsCategoriesColumn: ViewColumn
	private readonly userFolders: SettingsFolder<unknown>[]
	private readonly adminFolders: SettingsFolder<unknown>[]
	private readonly subscriptionFolders: SettingsFolder<unknown>[]
	private readonly logins: LoginController
	private selectedFolder: SettingsFolder<unknown>
	private currentViewer: UpdatableSettingsViewer | null = null
	private showBusinessSettings: stream<boolean> = stream(false)
	private readonly targetFolder: string
	private readonly targetRoute: string

	private settingsColumn: ViewColumn
	detailsViewer: UpdatableSettingsDetailsViewer | null = null // the component for the details column. can be set by settings views

	customDomains: LazyLoaded<string[]>

	constructor(vnode: Vnode<CalendarSettingsViewAttrs>) {
		super()
		this.logins = vnode.attrs.logins
		this.userFolders = [
			new SettingsFolder(
				() => "login_label",
				() => BootIcons.User,
				"login",
				() => new LoginSettingsViewer(calendarLocator.credentialsProvider, isApp() ? calendarLocator.systemFacade : null),
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
		]

		this.adminFolders = []
		this.subscriptionFolders = []

		this.selectedFolder = this.userFolders[0]

		this.settingsCategoriesColumn = this.renderSettingsCategoriesColumn(vnode)
		this.settingsColumn = this.renderSettingsColumn(vnode)
		this.viewSlider = new ViewSlider([this.settingsCategoriesColumn, this.settingsColumn], false)

		this.customDomains = new LazyLoaded(async () => {
			const domainInfos = await getAvailableDomains(this.logins, true)
			return domainInfos.map((info) => info.domain)
		})

		this.customDomains.getAsync().then(() => m.redraw())

		this.targetFolder = m.route.param("folder")
		this.targetRoute = m.route.get()
	}

	private isTabletView() {
		return (styles.isSingleColumnLayout() && this.viewSlider && this.viewSlider.allColumnsVisible()) || !styles.isSingleColumnLayout()
	}

	private renderSettingsCategoriesColumn(vnode: Vnode<CalendarSettingsViewAttrs>) {
		return new ViewColumn(
			{
				view: () => {
					return m(BackgroundColumnLayout, {
						backgroundColor: theme.surface_container,
						columnLayout: m(".flex.flex-grow.col.fill-absolute.scroll", [
							this.renderSettingsNavigation(this.userFolders, "userSettings_label"),
							this.renderLoggedInNavigationLinks(),
							this.bottomSection(),
						]),
						mobileHeader: () =>
							m(MobileHeader, {
								...vnode.attrs.header,
								backAction: () => m.route.set(CALENDAR_PREFIX),
								columnType: "first",
								title: "settings_label",
								actions: [],
								useBackButton: true,
								primaryAction: () => null,
							}),
						desktopToolbar: () => null,
					})
				},
			},
			ColumnType.Background,
			{
				minWidth: layout_size.first_col_min_width,
				maxWidth: layout_size.first_col_max_width,
				headerCenter: "settings_label",
			},
		)
	}

	private renderSettingsColumn(vnode: Vnode<CalendarSettingsViewAttrs>) {
		return new ViewColumn(
			{
				// the CSS improves the situation on devices with notches (no control elements
				// are concealed), but there's still room for improvement for scrollbars
				view: () =>
					m(BackgroundColumnLayout, {
						backgroundColor: theme.surface_container,
						classes: this.isTabletView() ? "pr-16 pl-8" : "",
						columnLayout: m(
							".mlr-safe-inset.fill-absolute.content-bg.border-radius-top-left-8.border-radius-top-right-8",
							{
								class: this.isTabletView() ? "border-radius-top-left-12" : "",
								style: this.isTabletView()
									? {
											"margin-top": px(component_size.navbar_height_mobile + size.spacing_8),
										}
									: {},
							},
							m(this._getCurrentViewer()!),
						),
						mobileHeader: () =>
							!this.isTabletView()
								? m(MobileHeader, {
										...vnode.attrs.header,
										backAction: () => {
											this._setUrl(SETTINGS_PREFIX)
											this.viewSlider.focusPreviousColumn()
										},
										columnType: "first",
										title: this.selectedFolder.name(),
										actions: [],
										useBackButton: true,
										primaryAction: () => null,
									})
								: null,
						desktopToolbar: () => null,
					}),
			},
			ColumnType.Background,
			{
				minWidth: layout_size.third_col_min_width,
				maxWidth: layout_size.third_col_max_width,
				headerCenter: this.selectedFolder.name,
			},
		)
	}

	private bottomSection() {
		const isFirstPartyDomain = locator.domainConfigProvider().getCurrentDomainConfig().firstPartyDomain
		const safeArea = isIOSApp() ? getSafeAreaInsetBottom() : 0

		return m(
			".pb-16.pt-32.flex-no-shrink.flex.col.justify-end.items-center.gap-16",
			{
				style: {
					paddingBottom: safeArea > 0 ? px(safeArea) : px(size.spacing_16),
				},
			},
			[
				// Support button
				m(BaseButton, {
					class: "flash flex justify-center center-vertically pt-8 pb-8 plr-12 border-radius",
					style: {
						marginInline: "auto",
						border: `1px solid ${theme.outline}`,
						color: theme.on_surface_variant,
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
			],
		)
	}

	private renderLoggedInNavigationLinks() {
		if (!this.logins.isUserLoggedIn()) {
			return m.fragment({}, [])
		}

		return m.fragment({}, [
			this.renderSettingsNavigation(this.adminFolders, "adminSettings_label"),
			this.renderSettingsNavigation(this.subscriptionFolders, "subscriptionSettings_label"),
		])
	}

	private async populateSubscriptionFolders() {
		if (this.logins.isEnabled(FeatureType.WhitelabelChild) || !this.logins.getUserController().isGlobalAdmin()) {
			return
		}

		const currentPlanType = await this.logins.getUserController().getPlanType()

		this.subscriptionFolders.push(
			new SettingsFolder<void>(
				() => "adminSubscription_action",
				() => BootIcons.Premium,
				"subscription",
				() => new SubscriptionViewer(currentPlanType, isIOSApp() ? locator.mobilePaymentsFacade : null),
				undefined,
			),
		)

		this.subscriptionFolders.push(
			new SettingsFolder<void>(
				() => "adminPayment_action",
				() => Icons.CreditCard,
				"invoice",
				() => new PaymentViewer(),
				undefined,
			),
		)

		this.subscriptionFolders.push(
			new SettingsFolder(
				() => "referralSettings_label",
				() => BootIcons.Share,
				"referral",
				() => new ReferralSettingsViewer(),
				undefined,
			).setIsVisibleHandler(() => !this.showBusinessSettings()),
		)

		m.redraw()
	}

	private async populateAdminFolders() {
		await this.updateShowBusinessSettings()

		if (!this.logins.getUserController().isGlobalAdmin()) {
			return
		}

		this.adminFolders.push(
			new SettingsFolder(
				() => "globalSettings_label",
				() => BootIcons.Settings,
				"global",
				() => new GlobalSettingsViewer(),
				undefined,
			),
		)

		if (!this.logins.isEnabled(FeatureType.WhitelabelChild) && !shouldHideBusinessPlans()) {
			this.adminFolders.push(
				new SettingsFolder(
					() => "whitelabel_label",
					() => Icons.Wand,
					"whitelabel",
					() =>
						new WhitelabelSettingsViewer(
							calendarLocator.entityClient,
							this.logins,
							calendarLocator.themeController,
							calendarLocator.whitelabelThemeGenerator,
						),
					undefined,
				),
			)
		}
		m.redraw()
	}

	oncreate(vnode: Vnode<CalendarSettingsViewAttrs>) {
		calendarLocator.eventController.addEntityListener(this.entityListener)
		Promise.all([this.populateAdminFolders(), this.populateSubscriptionFolders()]).then(() => {
			// We have to wait for the folders to be initialized before setting the URL,
			// otherwise we won't find the requested folder and will just pick the default folder
			const stillAtDefaultUrl =
				m.route.get() === this.userFolders[0].url || (m.route.get() === this.targetRoute && this.selectedFolder.url !== this.targetRoute)
			if (stillAtDefaultUrl) {
				this.onNewUrl({ folder: this.targetFolder }, this.targetRoute)
			}
		})
	}

	onremove(vnode: VnodeDOM<CalendarSettingsViewAttrs>) {
		calendarLocator.eventController.removeEntityListener(this.entityListener)
	}

	private entityListener = (updates: EntityUpdateData[], eventOwnerGroupId: Id) => {
		return this.entityEventsReceived(updates, eventOwnerGroupId)
	}

	view({ attrs }: Vnode<CalendarSettingsViewAttrs>): Children {
		return m(
			"#settings.main-view",
			m(this.viewSlider, {
				header: m(Header, {
					...attrs.header,
				}),
			}),
		)
	}

	_createSettingsFolderNavButton(folder: SettingsFolder<unknown>): NavButtonAttrs {
		return {
			label: folder.name(),
			icon: folder.icon,
			href: folder.url,
			colors: NavButtonColor.Nav,
			click: () => this.viewSlider.focus(this.settingsColumn),
			persistentBackground: true,
		}
	}

	renderSettingsNavigation(folders: SettingsFolder<unknown>[], title: MaybeTranslation): Children {
		if (folders.length === 0) {
			return null
		}

		return m(
			".flex.col.pl-16.pt-8.pb-8",
			{
				class: styles.isSingleColumnLayout() ? "pr-16" : "pr-8",
			},
			[
				m("small.uppercase.pb-8.b.text-ellipsis", { style: { color: theme.on_surface_variant } }, lang.getTranslationText(title)),
				m(
					".flex.col.border-radius-8.list-bg",
					folders
						.filter((folder) => folder.isVisible())
						.map((folder) => {
							const buttonAttrs = this._createSettingsFolderNavButton(folder)

							return m(SettingsNavButton, {
								label: buttonAttrs.label,
								click: buttonAttrs.click ?? (() => null),
								icon: buttonAttrs.icon,
								href: lazyStringValue(buttonAttrs.href),
								class: "settings-item",
							} satisfies SettingsNavButtonAttrs)
						}),
				),
			],
		)
	}

	_getCurrentViewer(): UpdatableSettingsViewer | null {
		if (!this.currentViewer) {
			this.detailsViewer = null
			this.currentViewer = this.selectedFolder.viewerCreator()
		}

		return this.currentViewer
	}

	/**
	 * Notifies the current view about changes of the url within its scope.
	 */
	onNewUrl(args: Record<string, any>, requestedPath: string) {
		if (args.folder || !m.route.get().startsWith(SETTINGS_PREFIX)) {
			// ensure that current viewer will be reinitialized
			const folder = this._allSettingsFolders().find((folder) => folder.url === requestedPath)

			if (folder && this.selectedFolder.path === folder.path) {
				// folder path has not changed
				this.selectedFolder = folder // instance of SettingsFolder might have been changed in membership update, so replace this instance

				m.redraw()
			} else if (folder) {
				// folder path has changed
				// to avoid misleading information, set the url to the folder's url, so the browser url
				// is changed to correctly represents the displayed content
				this._setUrl(folder.url)
				this.selectedFolder = folder
				this.currentViewer = null
				this.detailsViewer = null

				// make sure the currentViewer is available
				this._getCurrentViewer()
				this.viewSlider.focus(this.settingsColumn)

				m.redraw()
			} else {
				this.viewSlider.focus(this.settingsCategoriesColumn)
			}
		}
	}

	_allSettingsFolders(): ReadonlyArray<SettingsFolder<unknown>> {
		return [...this.userFolders, ...this.adminFolders, ...this.subscriptionFolders]
	}

	_setUrl(url: string) {
		m.route.set(url + location.hash)
	}

	_isGlobalAdmin(user: User): boolean {
		return user.memberships.some((m) => m.groupType === GroupType.Admin)
	}

	private async updateShowBusinessSettings() {
		this.showBusinessSettings((await this.logins.getUserController().loadCustomer()).businessUse)
	}

	async entityEventsReceived<T>(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(CustomerTypeRef, update)) {
				await this.updateShowBusinessSettings()
			} else if (this.logins.getUserController().isUpdateForLoggedInUserInstance(update, eventOwnerGroupId)) {
				const user = this.logins.getUserController().user

				// the user admin status might have changed
				if (
					!this._isGlobalAdmin(user) &&
					this.currentViewer &&
					(this.adminFolders.some((f) => f.isActive()) || this.subscriptionFolders.some((f) => f.isActive()))
				) {
					this._setUrl(this.userFolders[0].url)
				}
				m.redraw()
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update)) {
				this.customDomains.reset()
				this.adminFolders.length = 0
				this.subscriptionFolders.length = 0
				// When switching a plan we hide/show certain admin settings.
				await Promise.all([this.populateAdminFolders(), this.populateSubscriptionFolders(), this.customDomains.getAsync()])
				m.redraw()
			}
		}

		await this.currentViewer?.entityEventsReceived(updates)

		await this.detailsViewer?.entityEventsReceived(updates)
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	_aboutThisSoftwareLink(): Children {
		const label = lang.get("about_label")
		const versionLabel = `Tuta v${env.versionNumber}`
		return m("", [
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
						setTimeout(() => {
							const dialog = Dialog.showActionDialog({
								title: "about_label",
								child: () =>
									m(AboutDialog, {
										onShowSetupWizard: () => {
											dialog.close()
											calendarLocator.showSetupWizard()
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
			),
		])
	}

	handleBackButton() {
		if (m.route.get().endsWith(SETTINGS_PREFIX)) {
			m.route.set(CALENDAR_PREFIX)
		} else {
			m.route.set(SETTINGS_PREFIX)
			this.viewSlider.focus(this.settingsCategoriesColumn)
		}

		return true
	}
}
