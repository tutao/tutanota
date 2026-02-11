import m, { Children, Vnode, VnodeDOM } from "mithril"
import { assertMainOrNode } from "../api/common/Env"
import { ColumnType, ViewColumn } from "../gui/base/ViewColumn"
import { ViewSlider } from "../gui/nav/ViewSlider.js"
import { SettingsFolder } from "../settings/SettingsFolder.js"
import { AppHeaderAttrs, Header } from "../gui/Header.js"
import { theme } from "../gui/theme"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { locator } from "../api/main/CommonLocator"
import type { NavButtonAttrs } from "../gui/base/NavButton.js"
import { NavButtonColor } from "../gui/base/NavButton.js"
import { layout_size } from "../gui/size"
import { FolderColumnView } from "../gui/FolderColumnView.js"
import { SidebarSection } from "../gui/SidebarSection"
import { SettingsFolderRow } from "../settings/SettingsFolderRow.js"
import { BottomNav } from "../../mail-app/gui/BottomNav.js"
import { BaseTopLevelView } from "../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { LoginController } from "../api/main/LoginController.js"
import { BackgroundColumnLayout } from "../gui/BackgroundColumnLayout.js"
import { styles } from "../gui/styles.js"
import { MobileHeader } from "../gui/MobileHeader.js"
import { EntityEventsListener, EntityUpdateData, OnEntityUpdateReceivedPriority } from "../api/common/utils/EntityUpdateUtils.js"
import { SettingsViewAttrs, UpdatableSettingsDetailsViewer, UpdatableSettingsViewer } from "../settings/Interfaces.js"
import { DrawerMenuAttrs } from "../gui/nav/DrawerMenu"
import { ManagedCustomerListView } from "./ManagedCustomersListView"

assertMainOrNode()

export interface PartnerViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	logins: LoginController
}

/**
 * Clone of the settings view, this one is used to have all solution partner related settings.
 */
export class PartnerView extends BaseTopLevelView implements TopLevelView<PartnerViewAttrs> {
	protected onNewUrl(): void {
		m.route.set("/partner")
	}
	viewSlider: ViewSlider
	private readonly _settingsFoldersColumn: ViewColumn
	private readonly _settingsColumn: ViewColumn
	private readonly _settingsDetailsColumn: ViewColumn
	private readonly _partnerFolders: SettingsFolder<unknown>[]
	private _selectedFolder: SettingsFolder<unknown>
	private _currentViewer: UpdatableSettingsViewer | null = null
	/**
	 * The URL which we want to navigate to once everything is loaded.
	 * Reset on selecting another settings folder.
	 */
	detailsViewer: UpdatableSettingsDetailsViewer | null = null // the component for the details column. can be set by settings views
	constructor(vnode: Vnode<SettingsViewAttrs>) {
		super()
		this._partnerFolders = [
			new SettingsFolder(
				() => "adminManagedCustomerList_action",
				() => BootIcons.User,
				"customers",
				() =>
					new ManagedCustomerListView(
						(viewer) => this.replaceDetailsViewer(viewer),
						() => this.focusSettingsDetailsColumn(),
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
	}

	private replaceDetailsViewer(viewer: UpdatableSettingsDetailsViewer | null): UpdatableSettingsDetailsViewer | null {
		return (this.detailsViewer = viewer)
	}

	oncreate(vnode: Vnode<SettingsViewAttrs>) {
		locator.eventController.addEntityListener(this.entityListener)
	}

	onremove(vnode: VnodeDOM<SettingsViewAttrs>) {
		locator.eventController.removeEntityListener(this.entityListener)
	}

	private entityListener: EntityEventsListener = {
		onEntityUpdatesReceived: (updates: EntityUpdateData[]) => {
			return this.entityEventsReceived(updates)
		},
		priority: OnEntityUpdateReceivedPriority.NORMAL,
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

	focusSettingsDetailsColumn() {
		void this.viewSlider.focus(this._settingsDetailsColumn)
	}

	async entityEventsReceived<T>(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		await this._currentViewer?.entityEventsReceived(updates)

		await this.detailsViewer?.entityEventsReceived(updates)
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}
}
