import { MobileSettingsViewAttrs, SettingsViewSection, UpdatableSettingsDetailsViewer, UpdatableSettingsViewer } from "./Interfaces"
import { LoginController } from "../api/main/LoginController"
import { SettingsFolder } from "./SettingsFolder"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import type { DomainConfigProvider } from "../api/common/DomainConfigProvider"
import { SettingsList } from "./SettingsList"
import { isNotEmpty } from "@tutao/utils"
import { isAndroidApp } from "@tutao/app-env"
import { SettingsSupportButton } from "./SettingsSupportButton"
import { SettingsAboutLInk } from "./SettingsAboutLInk"
import { ViewSlider } from "../../../ui/nav/ViewSlider"
import { SETTINGS_PREFIX } from "../../../ui/utils/RouteChange"
import { BaseTopLevelView } from "../../../ui/BaseTopLevelView"
import { TopLevelView } from "../../../ui/base/TopLevelView"
import { ColumnType, ViewColumn } from "../../../ui/base/ViewColumn"
import { styles } from "../../../ui/styles"
import { AppHeaderAttrs, Header } from "../../../ui/Header"
import { BackgroundColumnLayout } from "../../../ui/BackgroundColumnLayout"
import { theme } from "../../../ui/theme"
import { MobileHeader } from "../../../ui/MobileHeader"
import { component_size, layout_size, px, size } from "../../../ui/size"
import {
	EntityEventsListener,
	EntityUpdateData,
	isUpdateForTypeRef,
	OnEntityUpdateReceivedPriority,
} from "../../../platform-kits/instance-pipeline/utils/EntityUpdateUtils"
import { NavButtonAttrs, NavButtonColor } from "../../../ui/base/NavButton"
import { CustomerTypeRef } from "@tutao/entities/sys"
import { windowFacade } from "../misc/WindowFacade"

export class MobileSettingsView extends BaseTopLevelView implements TopLevelView<MobileSettingsViewAttrs> {
	viewSlider: ViewSlider
	private readonly settingsCategoriesColumn: ViewColumn
	private readonly settingsColumn: ViewColumn

	/** the component for the details column. can be set by settings views */
	private detailsViewer: UpdatableSettingsDetailsViewer | null = null
	private readonly logins: LoginController
	private selectedFolder: SettingsFolder<unknown>
	private currentViewer: UpdatableSettingsViewer | null = null
	private readonly targetFolder: string
	private readonly targetRoute: string
	private settingSections: readonly SettingsViewSection[]
	private backUrl: string

	constructor({ attrs: { header, logins, domainConfigProvider, settingSections, backUrl } }: Vnode<MobileSettingsViewAttrs>) {
		super()
		this.logins = logins
		this.settingSections = settingSections
		this.selectedFolder = settingSections[0].settings[0]

		this.settingsCategoriesColumn = this.makeSettingsCategoriesColumn(header, domainConfigProvider, settingSections)
		this.settingsColumn = this.makeSettingsColumn(header)
		this.viewSlider = new ViewSlider([this.settingsCategoriesColumn, this.settingsColumn], windowFacade, false)

		this.targetFolder = m.route.param("folder")
		this.targetRoute = m.route.get()
		this.backUrl = backUrl
	}

	private isTabletView(): boolean {
		return (styles.isSingleColumnLayout() && this.viewSlider && this.viewSlider.allColumnsVisible()) || !styles.isSingleColumnLayout()
	}

	private makeSettingsCategoriesColumn(
		header: AppHeaderAttrs,
		domainConfigProvider: DomainConfigProvider,
		settings: readonly SettingsViewSection[],
	): ViewColumn {
		return new ViewColumn(
			{
				view: () => {
					return m(BackgroundColumnLayout, {
						backgroundColor: theme.surface_container,
						columnLayout: m(".flex.flex-grow.col.fill-absolute.scroll", [
							m(SettingsList, {
								sections: settings
									.map((section) => {
										return {
											name: section.name,
											items: section.settings.filter((f) => f.isVisible()).map((f) => this.createSettingsFolderNavButton(f)),
										}
									})
									.filter((section) => isNotEmpty(section.items)),
							}),
							this.bottomSection(domainConfigProvider),
						]),
						mobileHeader: () =>
							m(MobileHeader, {
								...header,
								backAction: () => m.route.set(this.backUrl),
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

	private makeSettingsColumn(header: AppHeaderAttrs): ViewColumn {
		return new ViewColumn(
			{
				// the CSS improves the situation on devices with notches (no control elements
				// are concealed), but there's still room for improvement for scrollbars
				view: () =>
					m(BackgroundColumnLayout, {
						backgroundColor: theme.surface_container,
						classes: (this.isTabletView() ? "pr-16 pl-8 " : "") + (isAndroidApp() ? "bottom-safe-inset overflow-y-hidden" : ""),
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
							m(this.getCurrentViewer()),
						),
						mobileHeader: () =>
							!this.isTabletView()
								? m(MobileHeader, {
										...header,
										backAction: () => {
											this.setUrl(SETTINGS_PREFIX)
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

	private bottomSection(domainConfigProvider: DomainConfigProvider): Children {
		return m(".pb-16.pt-32.flex-no-shrink.flex.col.justify-end.items-center.gap-16.pb-safe-inset", [
			m(SettingsSupportButton, { logins: this.logins }),
			domainConfigProvider.getCurrentDomainConfig().firstPartyDomain ? m(SettingsAboutLInk) : null,
		])
	}

	oncreate({ attrs: { eventController } }: Vnode<MobileSettingsViewAttrs>) {
		eventController.addEntityListener(this.entityListener)

		this.onNewUrl({ folder: this.targetFolder }, this.targetRoute)
	}

	onremove({ attrs: { eventController } }: VnodeDOM<MobileSettingsViewAttrs>) {
		eventController.removeEntityListener(this.entityListener)
	}

	private entityListener: EntityEventsListener = {
		onEntityUpdatesReceived: (updates: EntityUpdateData[], eventOwnerGroupId: Id) => {
			return this.entityEventsReceived(updates, eventOwnerGroupId)
		},
		priority: OnEntityUpdateReceivedPriority.NORMAL,
	}

	view({ attrs: { settingSections, header, backUrl } }: Vnode<MobileSettingsViewAttrs>): Children {
		this.settingSections = settingSections
		this.backUrl = backUrl
		return m(
			"#settings.main-view",
			m(this.viewSlider, {
				header: m(Header, {
					...header,
					isInternalUserLoggedIn: this.logins.isInternalUserLoggedIn(),
					isFeatureEnabled: (f) => this.logins.isEnabled(f),
				}),
			}),
		)
	}

	private createSettingsFolderNavButton(folder: SettingsFolder<unknown>): NavButtonAttrs {
		return {
			label: folder.name(),
			icon: folder.icon,
			href: folder.url,
			colors: NavButtonColor.Nav,
			click: () => this.viewSlider.focus(this.settingsColumn),
			persistentBackground: true,
		}
	}

	private getCurrentViewer(): UpdatableSettingsViewer {
		if (!this.currentViewer) {
			this.detailsViewer = null
			this.currentViewer = this.selectedFolder.viewerCreator()
		}

		return this.currentViewer
	}

	/**
	 * Notifies the current view about changes of the url within its scope.
	 */
	onNewUrl(args: Record<string, any>, _requestedPath: string) {
		if (args.folder || !m.route.get().startsWith(SETTINGS_PREFIX)) {
			// ensure that current viewer will be reinitialized
			const folder = this.settingSections.flatMap((section) => section.settings).find((folder) => folder.matches(args.folder, args.id))

			if (folder && this.selectedFolder.isSameFolder(folder)) {
				// folder path has not changed
				this.selectedFolder = folder // instance of SettingsFolder might have been changed in membership update, so replace this instance

				m.redraw()
			} else if (folder) {
				// folder path has changed
				// to avoid misleading information, set the url to the folder's url, so the browser url
				// is changed to correctly represents the displayed content
				this.setUrl(folder.url)
				this.selectedFolder = folder
				this.currentViewer = null
				this.detailsViewer = null

				// make sure the currentViewer is available
				this.getCurrentViewer()
				this.viewSlider.focus(this.settingsColumn)

				m.redraw()
			} else {
				this.viewSlider.focus(this.settingsCategoriesColumn)
			}
		}
	}

	private setUrl(url: string) {
		m.route.set(url + location.hash)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, _eventOwnerGroupId: Id): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(CustomerTypeRef, update)) {
				m.redraw()
			}
		}
		if (!this.selectedFolder.isVisible()) {
			this.setUrl(this.settingSections[0].settings[0].url)
		}

		await this.currentViewer?.entityEventsReceived(updates)
		await this.detailsViewer?.entityEventsReceived(updates)
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	handleBackButton(): boolean {
		if (m.route.get().endsWith(SETTINGS_PREFIX)) {
			m.route.set(this.backUrl)
		} else {
			m.route.set(SETTINGS_PREFIX)
			this.viewSlider.focus(this.settingsCategoriesColumn)
		}

		return true
	}
}
