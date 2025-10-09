import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { AppHeaderAttrs, Header } from "../../../common/gui/Header"
import m, { Children, Vnode } from "mithril"
import { DriveViewModel, VirtualFolder } from "./DriveViewModel"
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
import { showFileChooserForAttachments } from "../../../mail-app/mail/editor/MailEditorViewModel"
import { Dialog } from "../../../common/gui/base/Dialog"
import { createDropdown } from "../../../common/gui/base/Dropdown"
import { renderSidebarFolders } from "./Sidebar"

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

		if (args.virtualFolder === "favourites") {
			this.driveViewModel.loadVirtualFolder(VirtualFolder.Favourites).then(() => m.redraw())
			return
		} else if (args.virtualFolder === "trash") {
			this.driveViewModel.loadVirtualFolder(VirtualFolder.Trash).then(() => m.redraw())
			return
		}

		// /drive/folderId/listElementId
		const { folderListId, folderElementId } = args as { folderListId: string; folderElementId: string }

		if (folderListId && folderElementId) {
			this.driveViewModel.loadFolderContentsByIdTuple([folderListId, folderElementId]).then(() => m.redraw())
		} else {
			// /drive
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
								disabled: this.driveViewModel.currentFolder.isVirtual,
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
								renderSidebarFolders(this.driveViewModel.currentFolder.virtualFolder),
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
								files: this.driveViewModel.currentFolder.files,
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

	async onNewFile_Click(dom: HTMLElement): Promise<void> {
		showFileChooserForAttachments(dom.getBoundingClientRect()).then((files) => {
			if (files) {
				this.driveViewModel.uploadFiles([...files]).then(() => {
					console.log("uploaded completed; redrawing...")
					m.redraw()
				})
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
