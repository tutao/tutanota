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
import { BackgroundColumnLayout } from "../../../common/gui/BackgroundColumnLayout"
import { theme } from "../../../common/gui/theme"
import { createDropdown, Dropdown } from "../../../common/gui/base/Dropdown"
import { DriveUploadStack } from "./DriveUploadStack"
import { renderSidebarFolders } from "./Sidebar"
import { listSelectionKeyboardShortcuts } from "../../../common/gui/base/ListUtils"
import { MultiselectMode } from "../../../common/gui/base/List"
import { keyManager, Shortcut } from "../../../common/misc/KeyManager"
import { Keys } from "../../../common/api/common/TutanotaConstants"
import { formatStorageSize } from "../../../common/misc/Formatter"
import { DriveProgressBar } from "./DriveProgressBar"
import { getMoveMailBounds } from "../../../mail-app/mail/view/MailGuiUtils"
import { modal } from "../../../common/gui/base/Modal"
import { newItemActions, showNewFileDialog, showNewFolderDialog } from "./DriveGuiUtils"

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
		if (!this.driveViewModel.isDriveEnabledForCustomer()) {
			m.route.set("/mail")
			return
		}

		// /drive/folderId/listElementId
		const { folderListId, folderElementId } = args as { folderListId: string; folderElementId: string }

		if (folderListId && folderElementId) {
			this.driveViewModel.displayFolder([folderListId, folderElementId]).then(() => m.redraw())
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
		this.driveViewModel.init()

		this.shortcuts = [
			...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.driveViewModel),
			{
				key: Keys.C,
				enabled: () => true,
				help: "copy_action",
				ctrlOrCmd: true,
				exec: () => {
					this.driveViewModel.copySelectedItems()
				},
			},
			{
				key: Keys.X,
				enabled: () => true,
				help: "cut_action",
				ctrlOrCmd: true,
				exec: () => {
					this.driveViewModel.cutSelectedItems()
				},
			},
			{
				key: Keys.V,
				enabled: () => true,
				help: "paste_action",
				ctrlOrCmd: true,
				exec: () => {
					this.driveViewModel.paste()
				},
			},
			{
				key: Keys.DELETE,
				enabled: () => true,
				help: "trash_action",
				exec: () => {
					this.driveViewModel.trashSelectedItems()
				},
			},
			{
				key: Keys.BACKSPACE,
				enabled: () => true,
				help: "trash_action",
				exec: () => {
					this.driveViewModel.trashSelectedItems()
				},
			},
			{
				key: Keys.RETURN,
				enabled: () => true,
				help: "open_action",
				exec: () => {
					this.driveViewModel.openActiveItem()
				},
			},
			{
				key: Keys.N,
				enabled: () => true,
				help: "newDriveItem_action",
				exec: () => {
					const dropdown = new Dropdown(
						() =>
							newItemActions({
								onNewFile: () => this.onNewFile(),
								onNewFolder: () => this.onNewFolder(),
							}),
						300,
					)
					dropdown.setOrigin(getMoveMailBounds())
					modal.displayUnique(dropdown, false)
				},
			},
		]
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
								label: "newDriveItem_action",
								click: (ev, dom) => {
									//
									createDropdown({
										lazyButtons: () => newItemActions({ onNewFile: () => this.onNewFile(), onNewFolder: () => this.onNewFolder() }),
									})(ev, ev.target as HTMLElement)
								},
							},
							content: [
								renderSidebarFolders(
									{ rootFolderId: this.driveViewModel.roots.root, trashFolderId: this.driveViewModel.roots.trash },
									this.driveViewModel.userMailAddress,
								),
								m(".flex-grow"),
								this.renderStorage(),
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

	private renderStorage(): Children {
		let storage = this.driveViewModel.getUsedStorage()
		if (storage == null) {
			return null
		}

		const usedStorage = formatStorageSize(storage.usedBytes)
		const totalStorage = formatStorageSize(storage.totalBytes)
		const usedPercentage = Math.max(2, (storage.usedBytes / storage.totalBytes) * 100)

		return m(".mlr-8.mt-8.mb-8.flex.col", [m(DriveProgressBar, { percentage: usedPercentage }), m(".small.mt-4", [usedStorage, " / ", totalStorage])])
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
									onUploadClick: this.onNewFile,
									driveViewModel: this.driveViewModel,
									onTrash:
										this.driveViewModel.currentFolder?.type === DriveFolderType.Trash || listState.selectedItems.size === 0
											? null
											: () => this.driveViewModel.moveToTrash(Array.from(listState.selectedItems)),
									onDelete:
										this.driveViewModel.currentFolder?.type === DriveFolderType.Trash && listState.selectedItems.size > 0
											? () => this.driveViewModel.deleteFromTrash(Array.from(listState.selectedItems))
											: null,
									onRestore:
										this.driveViewModel.currentFolder?.type === DriveFolderType.Trash && listState.selectedItems.size > 0
											? () => this.driveViewModel.restoreFromTrash(Array.from(listState.selectedItems))
											: null,
									onCut: listState.selectedItems.size > 0 ? () => this.driveViewModel.cut(Array.from(listState.selectedItems)) : null,
									onCopy: listState.selectedItems.size > 0 ? () => this.driveViewModel.copy(Array.from(listState.selectedItems)) : null,
									onPaste: this.driveViewModel.clipboard ? () => this.driveViewModel.paste() : null,
									onDropFiles: (files) => {
										this.driveViewModel.uploadFiles(files)
									},
									currentFolder: this.driveViewModel.currentFolder?.folder ?? null,
									parents: this.driveViewModel.parents,
									selection:
										listState.inMultiselect || listState.selectedItems.size > 0
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
										onSingleSelection: (item) => {
											this.driveViewModel.onSingleSelection(item)
										},
										onSingleInclusiveSelection: (item) => {
											this.driveViewModel.onSingleInclusiveSelection(item)
										},
										onSingleExclusiveSelection: (item) => {
											this.driveViewModel.onSingleExclusiveSelection(item)
										},
										onRangeSelectionTowards: (item) => {
											this.driveViewModel.onRangeSelectionTowards(item)
										},
									},
									loadParents: () => this.driveViewModel.getMoreParents(),
									onNewFile: () => this.onNewFile(),
									onNewFolder: () =>
										showNewFolderDialog(
											async (folderName) => this.driveViewModel.createNewFolder(folderName),
											() => m.redraw(),
										),
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

	async onNewFile(): Promise<void> {
		await showNewFileDialog((files: File[]) => this.driveViewModel.uploadFiles(files))
	}

	async onNewFolder(): Promise<void> {
		await showNewFolderDialog(
			async (folderName) => this.driveViewModel.createNewFolder(folderName),
			() => m.redraw(),
		)
	}
}
