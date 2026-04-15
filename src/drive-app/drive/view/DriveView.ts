import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { AppHeaderAttrs, Header, HeaderAttrs } from "../../../common/gui/Header"
import m, { Children, Vnode } from "mithril"
import { DriveOperationType, DriveViewModel } from "./DriveViewModel"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView"
import { DataFile } from "../../../common/api/common/DataFile"
import { FileReference, getFileBaseNameAndExtensions } from "../../../common/api/common/utils/FileUtils"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn"
import { FolderColumnView } from "../../../common/gui/FolderColumnView"
import { layout_size } from "../../../common/gui/size"
import { DriveFolderView, DriveFolderViewAttrs } from "./DriveFolderView"
import { BackgroundColumnLayout } from "../../../common/gui/BackgroundColumnLayout"
import { theme } from "../../../common/gui/theme"
import { createDropdown, Dropdown } from "../../../common/gui/base/Dropdown"
import { DriveTransferStack } from "./DriveTransferStack"
import { DriveSidebar } from "./Sidebar"
import { listSelectionKeyboardShortcuts } from "../../../common/gui/base/ListUtils"
import { ListState, MultiselectMode } from "../../../common/gui/base/List"
import { keyManager, Shortcut } from "../../../common/misc/KeyManager"
import { Keys, NewPaidPlans, OperationStatus, UpgradePromptType } from "@tutao/app-env"
import { formatStorageSize } from "../../../common/misc/Formatter"
import { DriveProgressBar } from "./DriveProgressBar"
import { modal } from "../../../common/gui/base/Modal"
import { driveFolderName, isMobileDriveLayout, newItemActions, showNewFileDialog, showNewFolderDialog } from "./DriveGuiUtils"
import { getDetachedDropdownBounds } from "../../../common/gui/base/GuiUtils"
import { Dialog } from "../../../common/gui/base/Dialog"
import { lang, TranslationKey } from "../../../common/misc/LanguageViewModel"
import { styles } from "../../../common/gui/styles"
import { BottomNav } from "../../../mail-app/gui/BottomNav"
import { MobileHeader } from "../../../common/gui/MobileHeader"
import { EnterMultiselectIconButton } from "../../../common/gui/EnterMultiselectIconButton"
import { FolderFolderItem, FolderItem, FolderItemId, folderItemToId } from "./DriveUtils"
import { DriveFolderType } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { showSnackBar } from "../../../common/gui/base/SnackBar"
import Stream from "mithril/stream"
import { assertNotNull, isNotEmpty } from "@tutao/utils"
import { handleUncaughtError } from "../../../common/misc/ErrorHandler"
import { MoveItems } from "./DriveMoveItemDialog"
import { driveTypeRefs } from "@tutao/typerefs"
import { showUpgradeWizardOrSwitchSubscriptionDialog } from "../../../common/misc/SubscriptionDialogs"
import { MAIL_PREFIX } from "../../../common/misc/RouteChange"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { MultiselectMobileHeader } from "../../../common/gui/MultiselectMobileHeader"
import { MobileActionAttrs, MobileActionBar } from "../../../common/gui/MobileActionBar"
import { DriveSelectedItemsActions } from "./DriveFolderNav"
import { IconButton } from "../../../common/gui/base/IconButton"
import { MessageBanner } from "../../../common/gui/base/MessageBanner"
import { FabMenu, FabMenuAttrs } from "../../../common/gui/FabMenu"

export interface DriveViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	driveViewModel: DriveViewModel
	showMoveItemDialog: (items: FolderItem[], moveItems: MoveItems) => unknown
	bottomNav?: () => Children
	lazySearchBar: () => Children
}

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
	private operationUpdatesSubscription: Stream<unknown> | null = null

	oncreate() {
		keyManager.registerShortcuts(this.shortcuts)
		this.operationUpdatesSubscription = this.driveViewModel.operationUpdates.map(({ type, count, status, error }) => {
			switch (status) {
				case OperationStatus.SUCCESS: {
					let message: TranslationKey
					switch (type) {
						case DriveOperationType.Copy:
							message = "copyItemsSuccess_msg"
							break
						case DriveOperationType.Delete:
							message = "deleteItemsSuccess_msg"
							break
						case DriveOperationType.Move:
							message = "moveItemsSuccess_msg"
							break
						case DriveOperationType.Trash:
							message = "trashItemsSuccess_msg"
							break
						case DriveOperationType.Restore:
							message = "restoreItemsSuccess_msg"
					}
					showSnackBar({
						message: lang.getTranslation(message, {
							"{count}": String(count),
						}),
					})
					break
				}
				case OperationStatus.FAILURE: {
					handleUncaughtError(assertNotNull(error))
					break
				}
			}
		})
	}

	onremove() {
		keyManager.unregisterShortcuts(this.shortcuts)
		this.operationUpdatesSubscription?.end(true)
		this.operationUpdatesSubscription = null
	}

	constructor(vnode: Vnode<DriveViewAttrs>) {
		console.log("running constructor for DriveView")
		super()

		this.driveViewModel = vnode.attrs.driveViewModel
		this.init()
		const onTrash = (itemIds: FolderItemId[]) => {
			this.driveViewModel.moveToTrash(itemIds)
		}
		const onMove = (items: FolderItemId[], destinationId: IdTuple) => {
			this.driveViewModel.moveItems(items, destinationId)
		}
		this.driveNavColumn = this.createDriveNavColumn(vnode.attrs.drawerAttrs, onTrash, onMove) // this is where we see the left bar
		this.currentFolderColumn = this.createCurrentFolderColumn(vnode.attrs.header, vnode.attrs.showMoveItemDialog) // this where we see the files of the selected folder being listed
		this.viewSlider = new ViewSlider([this.driveNavColumn, this.currentFolderColumn])

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
					this.onPaste()
				},
			},
			{
				key: Keys.DELETE,
				enabled: () => true,
				help: "trash_action",
				exec: () => {
					this.onDeleteDwim()
				},
			},
			{
				key: Keys.BACKSPACE,
				enabled: () => true,
				help: "trash_action",
				exec: () => {
					this.onDeleteDwim()
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
					dropdown.setOrigin(getDetachedDropdownBounds())
					modal.displayUnique(dropdown, false)
				},
			},
			{
				key: Keys.V,
				enabled: () => true,
				help: "move_action",
				exec: () => {
					const selectedItems = this.driveViewModel.listState().selectedItems

					vnode.attrs.showMoveItemDialog(Array.from(selectedItems), (items: readonly FolderItemId[], destination: driveTypeRefs.DriveFolder) =>
						this.driveViewModel.moveItems(items, destination._id),
					)
				},
			},
		]
	}

	private async init() {
		await this.driveViewModel.init()
		if (!(await this.driveViewModel.currentPlanSupportsDrive())) {
			// wait for the upgrade dialog
			await showUpgradeWizardOrSwitchSubscriptionDialog(UpgradePromptType.DRIVE, this.driveViewModel.loginController.getUserController(), NewPaidPlans)
			// it could be that we are doing the check too soon but generally it should work
			if (!(await this.driveViewModel.currentPlanSupportsDrive())) {
				// if the upgrade didn't happen still bounce back to mail
				m.route.set(MAIL_PREFIX)
			} else {
				// otherwise re-initialize
				await this.driveViewModel.init()
				this.driveViewModel.navigateToRootFolder()
			}
		}
	}

	private async onPaste() {
		await this.driveViewModel.paste()
	}

	view({ attrs }: Vnode<DriveViewAttrs>): Children {
		return m("#drive.main-view", {}, [
			m(this.viewSlider, {
				header: m(Header, {
					firstColWidth: this.driveNavColumn.width,
					rightView: null,
					...attrs.header,
				}),
				bottomNav: styles.isUsingBottomNavigation()
					? this.driveViewModel.listState().inMultiselect
						? this.renderMobileActionBar(attrs.showMoveItemDialog)
						: m(BottomNav)
					: null,
			}),
		])
	}

	private renderMobileActionBar(showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]): Children {
		const { onCopy, onCut, onDelete, onRestore, onTrash, onMove } = this.selectedItemsActions(this.driveViewModel.listState(), showMoveItemDialog)
		const actionsAttrs: MobileActionAttrs[] = []
		if (onRestore) {
			actionsAttrs.push({
				title: "restoreFromTrash_action",
				action: onRestore,
				icon: Icons.ArrowBackFilled,
			})
		}
		if (onDelete) {
			actionsAttrs.push({
				title: "delete_action",
				action: onDelete,
				icon: Icons.TrashCrossFilled,
			})
		}
		if (onCopy) {
			actionsAttrs.push({
				title: "copy_action",
				action: onCopy,
				icon: Icons.CopyFilled,
			})
		}
		if (onCut) {
			actionsAttrs.push({
				title: "cut_action",
				action: onCut,
				icon: Icons.ScissorsFilled,
			})
		}
		if (onMove) {
			actionsAttrs.push({
				title: "move_action",
				action: onMove,
				icon: Icons.Move,
			})
		}
		if (onTrash) {
			actionsAttrs.push({
				title: "trash_action",
				action: onTrash,
				icon: Icons.TrashFilled,
			})
		}
		return m(MobileActionBar, {
			actions: actionsAttrs,
		})
	}

	private createDriveNavColumn(
		drawerAttrs: DrawerMenuAttrs,
		onTrash: (items: FolderItemId[]) => unknown,
		onMove: (items: FolderItemId[], destination: IdTuple) => unknown,
	) {
		return new ViewColumn(
			{
				view: () => {
					return [
						m(FolderColumnView, {
							drawer: drawerAttrs,
							button: isMobileDriveLayout()
								? null
								: {
										label: "newDriveItem_action",
										click: (ev, dom) => {
											//
											createDropdown({
												lazyButtons: () =>
													newItemActions({
														onNewFile: () => this.onNewFile(),
														onNewFolder: () => this.onNewFolder(),
													}),
											})(ev, ev.target as HTMLElement)
										},
									},
							content: [
								this.driveViewModel.roots
									? m(DriveSidebar, {
											rootFolders: { rootFolderId: this.driveViewModel.roots.root, trashFolderId: this.driveViewModel.roots.trash },
											userEmailAddress: this.driveViewModel.userMailAddress,
											onTrash,
											onMove,
											isDropAllowed: this.driveViewModel.currentFolder?.folder.type !== DriveFolderType.Trash,
											onFolderClick: () => {
												this.viewSlider.focus(this.currentFolderColumn)
											},
										})
									: null,
								m(".flex-grow"),
								m(
									".mlr-8",
									m(MessageBanner, {
										translation: lang.getTranslation("driveBetaWarning_msg"),
										type: "warning",
									}),
								),
								this.renderStorage(),
							],
							ariaLabel: "folderTitle_label",
						}),
					]
				},
			},
			ColumnType.Foreground,
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

	private createCurrentFolderColumn(headerAttrs: HeaderAttrs, showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]) {
		return new ViewColumn(
			{
				view: () => {
					const listState = this.driveViewModel.listState()

					return m(BackgroundColumnLayout, {
						backgroundColor: theme.surface_container,
						floatingActionButton: () => {
							return this.renderFab()
						},
						desktopToolbar: () => [],
						columnLayout: [
							this.renderFolderView(listState, showMoveItemDialog),
							m(DriveTransferStack, {
								transfers: this.driveViewModel.transfers(),
								cancelTransfer: (transferId) => this.driveViewModel.cancelTransfer(transferId),
							}),
						],
						mobileHeader: () => this.renderMobileHeader(headerAttrs, showMoveItemDialog),
					})
				},
			},
			ColumnType.Background,
			{
				minWidth: layout_size.second_col_min_width,
				maxWidth: layout_size.second_col_max_width,
			},
		)
	}

	private renderFab(): Children {
		if (!isMobileDriveLayout()) {
			return null
		}
		return m(FabMenu, {
			title: lang.getTranslation("newDriveItem_action"),
			actions: newItemActions({
				onNewFile: () => this.onNewFile(),
				onNewFolder: () => this.onNewFolder(),
			}),
		} satisfies FabMenuAttrs)
	}

	private renderMobileHeader(headerAttrs: HeaderAttrs, showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]): Children {
		const listState = this.driveViewModel.listState()
		const actions = this.selectedItemsActions(listState, showMoveItemDialog)
		const { onPaste } = actions

		if (listState.inMultiselect) {
			return m(MultiselectMobileHeader, {
				message: lang.getTranslation("itemsSelected_label", { "{number}": listState.selectedItems.size }),
				selected: listState.selectedItems.size === listState.items.length,
				selectAll: () => this.driveViewModel.selectAll(),
				selectNone: () => this.driveViewModel.selectNone(),
			})
		} else {
			const useBackButton = isNotEmpty(this.driveViewModel.parents)
			return m(MobileHeader, {
				...headerAttrs,
				title: this.driveViewModel.currentFolder ? driveFolderName(this.driveViewModel.currentFolder.folder) : undefined,
				columnType: "first",
				actions: [
					onPaste
						? m(IconButton, {
								title: "paste_action",
								icon: Icons.ClipboardFilled,
								click: () => onPaste(),
							})
						: null,
					m(EnterMultiselectIconButton, {
						clickAction: () => this.driveViewModel.enterMultiselect(),
					}),
				],
				primaryAction: () => null,
				backAction: () => (useBackButton ? this.driveViewModel.goToParentFolder() : this.viewSlider.focusPreviousColumn()),
				useBackButton,
			})
		}
	}

	private renderFolderView(listState: ListState<FolderItem>, showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]): Children {
		return m(DriveFolderView, {
			selectedItemsActions: this.selectedItemsActions(listState, showMoveItemDialog),
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
				onSelectNone: () => {
					this.driveViewModel.selectNone()
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
			fileActions: {
				onOpenItem: (item) => {
					if (item.type === "folder") {
						this.driveViewModel.navigateToFolder(item.folder._id)
					} else {
						this.driveViewModel.downloadFile(item.file)
					}
				},
				onCopy: (item) => {
					this.driveViewModel.copy([item])
				},
				onCut: (item) => {
					this.driveViewModel.cut([item])
				},
				onTrash: (item) => {
					this.driveViewModel.moveToTrash([folderItemToId(item)])
				},
				onRestore: (item) => {
					this.driveViewModel.restoreFromTrash([item])
				},
				onDelete: async (item) => {
					this.deleteItems(item)
				},
				onRename: (item) => this.onRename(item),
				onStartMove: (item) => {
					showMoveItemDialog([item], (items, destinationFolder) => this.driveViewModel.moveItems(items, destinationFolder._id))
				},
			},
			onMove: (items: FolderItemId[], into: FolderFolderItem) => {
				this.driveViewModel.moveItems(items, into.folder._id)
			},
			sortOrder: this.driveViewModel.getCurrentColumnSortOrder(),
			onSortColumn: (column) => this.driveViewModel.sort(column),
			clipboard: this.driveViewModel.clipboard,
		} satisfies DriveFolderViewAttrs)
	}

	private selectedItemsActions(listState: ListState<FolderItem>, showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]): DriveSelectedItemsActions {
		const isListingTrash = this.driveViewModel.currentFolder?.type === DriveFolderType.Trash
		return {
			onTrash:
				isListingTrash || listState.selectedItems.size === 0
					? null
					: () => this.driveViewModel.moveToTrash(Array.from(listState.selectedItems).map(folderItemToId)),
			onDelete:
				isListingTrash && listState.selectedItems.size > 0
					? async () => {
							this.deleteItems()
						}
					: null,
			onRestore:
				isListingTrash && listState.selectedItems.size > 0 ? () => this.driveViewModel.restoreFromTrash(Array.from(listState.selectedItems)) : null,
			onCut: !isListingTrash && listState.selectedItems.size > 0 ? () => this.driveViewModel.cut(Array.from(listState.selectedItems)) : null,
			onCopy: !isListingTrash && listState.selectedItems.size > 0 ? () => this.driveViewModel.copy(Array.from(listState.selectedItems)) : null,
			onPaste: !isListingTrash && this.driveViewModel.clipboard ? () => this.onPaste() : null,
			onMove:
				!isListingTrash && listState.selectedItems.size > 0
					? () =>
							showMoveItemDialog(Array.from(listState.selectedItems), (items, destinationFolder) =>
								this.driveViewModel.moveItems(items, destinationFolder._id),
							)
					: null,
		}
	}

	private onRename(item: FolderItem) {
		const originalName = item.type === "file" ? item.file.name : item.folder.name

		// Determine how much of the original filename to pre-select,
		// for easier renaming of files with extensions.
		let selectionEnd = originalName.length
		const [basename] = getFileBaseNameAndExtensions(originalName)
		if (basename) {
			selectionEnd = basename.length
		}

		Dialog.showProcessTextInputDialog(
			{
				title: "renameItem_action",
				label: "enterNewName_label",
				defaultValue: originalName,
				selectionRange: [0, selectionEnd],
			},
			async (newName: string) => {
				this.driveViewModel.rename(item, newName)
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

	/**
	 * Does-what-I-mean for deleting files; if the user is in the trash it will ask them to
	 * delete the files forever. Otherwise it will just trash them. This is used for hotkeys such as DELETE.
	 */
	onDeleteDwim() {
		if (this.driveViewModel.currentFolder?.type === DriveFolderType.Trash) {
			this.deleteItems()
		} else {
			this.driveViewModel.trashSelectedItems()
		}
	}

	/**
	 * If passed an item, it will delete this specific item from trash.
	 * If called without arguments, it will delete all currently selected items from trash.
	 */
	async deleteItems(item?: FolderItem) {
		const items = item ? [item] : Array.from(this.driveViewModel.listState().selectedItems)

		const ok = await Dialog.confirm(
			lang.getTranslation("confirmDeleteFilesPermanently_msg", { "{count}": items.length }),
			"confirmDeleteFilesPermanently_action",
		)
		if (ok) this.driveViewModel.deleteFromTrash(items)
	}
}
