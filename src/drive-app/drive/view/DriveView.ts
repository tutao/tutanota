import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { AppHeaderAttrs, Header } from "../../../common/gui/Header"
import m, { Children, Vnode } from "mithril"
import { DriveViewModel } from "./DriveViewModel"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView"
import { DataFile } from "../../../common/api/common/DataFile"
import { FileReference } from "../../../common/api/common/utils/FileUtils"
import { locator } from "../../../common/api/main/CommonLocator"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn"
import { FolderColumnView } from "../../../common/gui/FolderColumnView"
import { size } from "../../../common/gui/size"
import { DriveFacade } from "../../../common/api/worker/facades/DriveFacade"
import { DriveFolderView } from "./DriveFolderView"
import { lang } from "../../../common/misc/LanguageViewModel"
import { BackgroundColumnLayout } from "../../../common/gui/BackgroundColumnLayout"
import { theme } from "../../../common/gui/theme"
import { SidebarSection } from "../../../common/gui/SidebarSection"
import { showFileChooserForAttachments } from "../../../mail-app/mail/editor/MailEditorViewModel"
import { Dialog } from "../../../common/gui/base/Dialog"
import { SettingsFolderRow } from "../../../common/settings/SettingsFolderRow"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { NavButtonColor } from "../../../common/gui/base/NavButton"
import { createDropdown } from "../../../common/gui/base/Dropdown"

export interface DriveViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	driveViewModel: DriveViewModel
	bottomNav?: () => Children
	lazySearchBar: () => Children
}

export class DriveView extends BaseTopLevelView implements TopLevelView<DriveViewAttrs> {
	private readonly viewSlider: ViewSlider
	private readonly driveNavColumn: ViewColumn
	private readonly currentFolderColumn: ViewColumn

	private readonly driveFacade: DriveFacade

	protected onNewUrl(args: Record<string, any>, requestedPath: string): void {
		console.log("onNewUrl fired with args", args, "requestedPath:", requestedPath)
		const { folderListId, folderElementId } = args as { folderListId: string; folderElementId: string }

		if (folderListId && folderElementId) {
			this.driveViewModel.loadFolderContentsByIdTuple([folderListId, folderElementId]).then(() => m.redraw())
		} else {
			// No folder given, load the drive root
			this.driveViewModel.navigateToRootFolder()
		}
	}

	protected files: (DataFile | FileReference)[] = []

	private driveViewModel: DriveViewModel

	constructor(vnode: Vnode<DriveViewAttrs>) {
		super()
		this.driveNavColumn = this.createDriveNavColumn(vnode.attrs.drawerAttrs) // this is where we see the left bar
		this.currentFolderColumn = this.createCurrentFolderColumn() // this where we see the files of the selected folder being listed
		this.viewSlider = new ViewSlider([this.driveNavColumn, this.currentFolderColumn])

		this.driveFacade = locator.driveFacade
		this.driveViewModel = vnode.attrs.driveViewModel

		// this.driveViewModel.loadDriveRoot().then(() => m.redraw())
	}

	view({ attrs }: Vnode<DriveViewAttrs>): Children {
		return m("#drive.main-view", {}, [
			m(this.viewSlider, {
				header: m(Header, {
					firstColWidth: this.driveNavColumn.width,
					rightView: [],
					...attrs.header,
				}),
				bottomNav: null,
			}),
		])
	}

	private createDriveNavColumn(drawerAttrs: DrawerMenuAttrs) {
		return new ViewColumn(
			{
				view: () => {
					return [
						m(FolderColumnView, {
							drawer: drawerAttrs,
							button: {
								label: "newFile_action",
								click: (ev, dom) => {
									//
									createDropdown({
										lazyButtons: () => [
											{
												click: (event, dom) => {
													this.onNewFile_Click(dom)
												},
												label: lang.makeTranslation("UploadFile", () => "Upload file"),
											},
											{
												click: (event, dom) => {
													this.onNewFolder_Click(dom)
												},
												label: lang.makeTranslation("CreateFolder", () => "Create folder"),
											},
										],
									})(ev, ev.target as HTMLElement)
								},
							},
							content: [
								// m(LoginButton, {
								// 	label: lang.makeTranslation("newFolder_action", () => "New folder"),
								// 	onclick: (event, dom) => ,
								// }),
								this.renderSidebarFolders(),
							],
							ariaLabel: "folderTitle_label",
						}),
					]
				},
			},
			ColumnType.Background,
			{
				minWidth: size.first_col_min_width,
				maxWidth: size.first_col_max_width,
				headerCenter: "folderTitle_label",
			},
		)
	}

	private createCurrentFolderColumn() {
		return new ViewColumn(
			{
				view: () => {
					return m(
						BackgroundColumnLayout,
						{
							backgroundColor: theme.navigation_bg,
							desktopToolbar: () => [],
							columnLayout: m(DriveFolderView, {
								driveViewModel: this.driveViewModel,
							}),
							mobileHeader: () => [],
						},
						//m(DriveNav),
					)
				},
			},
			ColumnType.Background,
			{
				minWidth: size.second_col_min_width,
				maxWidth: size.second_col_max_width,
			},
		)
	}

	private renderSidebarFolders() {
		return m(
			SidebarSection,
			{
				name: lang.makeTranslation("driveFolders_title", () => "user@tutanota.de"), // TODO: use real user account address
			},
			[
				m(SettingsFolderRow, {
					mainButtonAttrs: {
						label: lang.makeTranslation("asdf", () => "Home"), // TODO
						icon: () => Icons.Desktop,
						href: "/drive",
						colors: NavButtonColor.Nav,
						click: () => {},
						persistentBackground: true,
					},
				}),
				m(SettingsFolderRow, {
					mainButtonAttrs: {
						label: lang.makeTranslation("asdf2", () => "Favourites"), // TODO
						icon: () => Icons.Gift,
						href: "/drive", // TODO
						colors: NavButtonColor.Nav,
						click: () => {},
						persistentBackground: false,
					},
				}),
			],
		)
	}

	async onNewFile_Click(dom: HTMLElement): Promise<void> {
		showFileChooserForAttachments(dom.getBoundingClientRect()).then((files) => {
			if (files) {
				this.driveViewModel.uploadFiles([...files]).then(() => m.redraw())
			}
		})
	}

	async onNewFolder_Click(dom: HTMLElement): Promise<void> {
		Dialog.showProcessTextInputDialog(
			{
				title: lang.makeTranslation("newFolder_title", () => "New folder"),
				label: lang.makeTranslation("newFolder_label", () => "Folder name"),
				defaultValue: "Untitled folder",
			},
			async (newName) => {
				const folderName = newName
				if (folderName === "") {
					return
				}

				console.log("User called the folder: ", folderName)
				this.driveViewModel.createNewFolder(folderName).then(() => m.redraw())
			},
		)
	}
}
