import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { AppHeaderAttrs, Header } from "../../../common/gui/Header"
import m, { Children, Vnode } from "mithril"
import { DriveFolderType, DriveViewModel, FolderItem } from "./DriveViewModel"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView"
import { DataFile } from "../../../common/api/common/DataFile"
import { FileReference } from "../../../common/api/common/utils/FileUtils"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn"
import { FolderColumnView } from "../../../common/gui/FolderColumnView"
import { layout_size } from "../../../common/gui/size"
import { DriveFolderView, DriveFolderViewAttrs } from "./DriveFolderView"
import { lang } from "../../../common/misc/LanguageViewModel"
import { BackgroundColumnLayout } from "../../../common/gui/BackgroundColumnLayout"
import { theme } from "../../../common/gui/theme"
import { Dialog } from "../../../common/gui/base/Dialog"
import { createDropdown } from "../../../common/gui/base/Dropdown"
import { DriveUploadStack } from "./DriveUploadStack"
import { ChunkedUploadInfo } from "../../../common/api/common/drive/DriveTypes"
import { showStandardsFileChooser } from "../../../common/file/FileController"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"
import { renderSidebarFolders } from "./Sidebar"
import { listSelectionKeyboardShortcuts } from "../../../common/gui/base/ListUtils"
import { MultiselectMode } from "../../../common/gui/base/List"
import { keyManager, Shortcut } from "../../../common/misc/KeyManager"

export interface DriveViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	driveViewModel: DriveViewModel
	bottomNav?: () => Children
	lazySearchBar: () => Children
}

export type SelectableFolderItem = FolderItem & { selected: boolean }

export class DriveView extends BaseTopLevelView implements TopLevelView<DriveViewAttrs> {
	private readonly viewSlider: ViewSlider
	private readonly driveNavColumn: ViewColumn
	private readonly currentFolderColumn: ViewColumn

	protected onNewUrl(args: Record<string, any>, requestedPath: string): void {
		console.log("onNewUrl fired with args", args, "requestedPath:", requestedPath)

		if (args.virtualFolder === "trash") {
			this.driveViewModel.loadSpecialFolder(DriveFolderType.Trash).then(() => m.redraw())
			return
		} else if (args.virtualFolder) {
			throw new ProgrammingError("No implementation for special folder: " + args.virtualFolder)
		}

		// /drive/folderId/listElementId
		const { folderListId, folderElementId } = args as { folderListId: string; folderElementId: string }

		if (folderListId && folderElementId) {
			this.driveViewModel.loadFolder([folderListId, folderElementId]).then(() => m.redraw())
		} else {
			// /drive
			// No folder given, load the drive root
			this.driveViewModel.navigateToRootFolder()
		}
	}

	protected files: (DataFile | FileReference)[] = []

	private driveViewModel: DriveViewModel
	private shortcuts: Shortcut[]

	oncreate() {
		keyManager.registerShortcuts(this.shortcuts)
	}

	onremove() {
		keyManager.unregisterShortcuts(this.shortcuts)
	}

	constructor(vnode: Vnode<DriveViewAttrs>) {
		console.log("running constructor for DriveView")
		super()
		this.driveNavColumn = this.createDriveNavColumn(vnode.attrs.drawerAttrs) // this is where we see the left bar
		this.currentFolderColumn = this.createCurrentFolderColumn() // this where we see the files of the selected folder being listed
		this.viewSlider = new ViewSlider([this.driveNavColumn, this.currentFolderColumn])

		this.driveViewModel = vnode.attrs.driveViewModel

		this.driveViewModel.uploadProgressListener.addListener(async (info: ChunkedUploadInfo) => {
			this.driveViewModel.driveUploadStackModel.onChunkUploaded(info.fileId, info.uploadedBytes)
			m.redraw()
			return Promise.resolve()
		})

		this.shortcuts = listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.driveViewModel)
	}

	view({ attrs }: Vnode<DriveViewAttrs>): Children {
		// if (attrs.driveViewModel.currentFolder == null) {
		// 	return m("", "Drive is loading...")
		// }
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
								label: "newDriveItem_action",
								click: (ev, dom) => {
									//
									createDropdown({
										lazyButtons: () => [
											{
												click: (event, dom) => {
													this.onNewFile_Click(dom)
												},
												// FIXME
												label: lang.makeTranslation("UploadFile", () => "Upload file"),
											},
											{
												click: (event, dom) => {
													this.onNewFolder_Click(dom)
												},
												// FIXME
												label: lang.makeTranslation("CreateFolder", () => "Create folder"),
											},
										],
									})(ev, ev.target as HTMLElement)
								},
							},
							content: [
								renderSidebarFolders(
									{ rootFolderId: this.driveViewModel.roots.root, trashFolderId: this.driveViewModel.roots.trash },
									this.driveViewModel.userMailAddress,
								),
							],
							ariaLabel: "folderTitle_label",
						}),
					]
				},
			},
			ColumnType.Background,
			{
				minWidth: layout_size.first_col_min_width,
				maxWidth: layout_size.first_col_max_width,
				headerCenter: "folderTitle_label",
			},
		)
	}

	private createCurrentFolderColumn() {
		return new ViewColumn(
			{
				view: () => {
					const listState = this.driveViewModel.listState()
					return m(
						BackgroundColumnLayout,
						{
							backgroundColor: theme.surface_container,
							desktopToolbar: () => [],
							columnLayout: [
								m(DriveFolderView, {
									onUploadClick: this.onNewFile_Click,
									driveViewModel: this.driveViewModel,
									onCut: listState.selectedItems.size > 0 ? () => this.driveViewModel.cut(Array.from(listState.selectedItems)) : null,
									onCopy: listState.selectedItems.size > 0 ? () => this.driveViewModel.copy(Array.from(listState.selectedItems)) : null,
									onPaste: this.driveViewModel.clipboard ? () => this.driveViewModel.paste() : null,
									currentFolder: this.driveViewModel.currentFolder?.folder ?? null,
									parents: this.driveViewModel.parents,
									selection: listState.inMultiselect
										? {
												type: "multiselect",
												selectedAll: this.driveViewModel.areAllSelected(),
												selectedItemCount: listState.selectedItems.size,
											}
										: { type: "none" },
									listState: listState,
									selectionEvents: {
										onSelectAll: () => {
											this.driveViewModel.selectAll()
										},
										onSelectNext: () => {},
										onSelectPrevious: () => {},
										onSingleInclusiveSelection: (item) => {
											this.driveViewModel.onSingleInclusiveSelection(item)
										},
										onSingleExclusiveSelection: () => {},
									},
								} satisfies DriveFolderViewAttrs),
								m(DriveUploadStack, { model: this.driveViewModel.driveUploadStackModel }),
							],
							mobileHeader: () => [],
						},
						//m(DriveNav),
					)
				},
			},
			ColumnType.Background,
			{
				minWidth: layout_size.second_col_min_width,
				maxWidth: layout_size.second_col_max_width,
			},
		)
	}

	async onNewFile_Click(dom: HTMLElement): Promise<void> {
		const files = await showStandardsFileChooser(true)

		if (files) {
			this.driveViewModel.uploadFiles(files)
		}
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
