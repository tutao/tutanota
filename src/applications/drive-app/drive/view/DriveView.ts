import { TopLevelAttrs, TopLevelView } from "../../../../ui/base/TopLevelView"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { AppHeaderAttrs, Header } from "../../../../ui/Header"
import m, { Children, Vnode } from "mithril"
import { DriveOperationType, DriveViewModel, OperationUpdate } from "./DriveViewModel"
import { BaseTopLevelView } from "../../../../ui/BaseTopLevelView"
import { ViewSlider } from "../../../../ui/nav/ViewSlider"
import { ColumnType, ViewColumn } from "../../../../ui/base/ViewColumn"
import { FolderColumnView } from "../../../common/gui/FolderColumnView"
import { layout_size } from "../../../../ui/size"
import { DriveFolderView, DriveFolderViewAttrs } from "./DriveFolderView"
import { BackgroundColumnLayout } from "../../../../ui/BackgroundColumnLayout"
import { theme } from "../../../../ui/theme"
import { attachDropdown, createDropdown, Dropdown } from "../../../../ui/base/Dropdown"
import { DriveTransferStack, DriveTransferStackAttrs } from "./DriveTransferStack"
import { DriveSidebar } from "./Sidebar"
import { listSelectionKeyboardShortcuts } from "../../../../ui/base/ListUtils"
import { ListState, MultiselectMode } from "../../../../ui/base/List"
import { keyManager, Shortcut } from "../../../../ui/utils/KeyManager"
import { AppType, CancelledError, isAndroidApp, Keys, OperationStatus, UpgradePromptType } from "@tutao/app-env"
import { formatStorageSize } from "../../../../ui/utils/Formatter"
import { DriveProgressBar } from "./DriveProgressBar"
import { modal } from "../../../../ui/base/Modal"
import { driveFolderName, isMobileDriveLayout, newItemActions, showNewFolderDialog, showRenameDialog } from "./DriveGuiUtils"
import { getDetachedDropdownBounds } from "../../../../ui/base/GuiUtils"
import { Dialog } from "../../../../ui/base/Dialog"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { styles } from "../../../../ui/styles"
import { MobileHeader } from "../../../../ui/MobileHeader"
import { EnterMultiselectIconButton } from "../../../../ui/EnterMultiselectIconButton"
import { FolderFolderItem, FolderItem, FolderItemId, folderItemToId } from "./DriveUtils"
import { DriveFolderType } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { showSnackBar } from "../../../../ui/base/SnackBar"
import Stream from "mithril/stream"
import { assertNotNull, isNotEmpty, isNotNull } from "@tutao/utils"
import { handleUncaughtError } from "../../../common/misc/ErrorHandler"
import { MoveItems } from "./DriveMoveItemDialog"
import { showUpgradeWizardOrSwitchSubscriptionDialog } from "../../../common/misc/SubscriptionDialogs"
import { MAIL_PREFIX } from "../../../../ui/utils/RouteChange"
import { Icons } from "../../../../ui/base/icons/Icons"
import { MultiselectMobileHeader } from "../../../../ui/MultiselectMobileHeader"
import { MobileActionAttrs, MobileActionBar } from "../../../../ui/MobileActionBar"
import { DriveSelectedItemsActions } from "./DriveFolderNav"
import { IconButton } from "../../../../ui/base/IconButton"
import { MessageBanner } from "../../../../ui/base/MessageBanner"
import { FabMenu, FabMenuAttrs } from "../../../../ui/FabMenu"
import { DriveFilePicker } from "./DriveFilePicker"
import { NewPaidPlans } from "../../../../entities/sys/Utils"
import { DriveFolder } from "@tutao/entities/drive"
import { windowFacade } from "../../../common/misc/WindowFacade"
import { DriveMobileSortButton } from "./DriveMobileSortButton"
import { renderHeaderButtons } from "../../../calendar-app/gui/HeaderButtons"

export interface DriveViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	driveViewModel: DriveViewModel
	showMoveItemDialog: (items: FolderItem[], moveItems: MoveItems) => unknown
	bottomNav?: () => Children
	lazySearchBar: () => Children
	filePicker: DriveFilePicker
}

export class DriveView extends BaseTopLevelView implements TopLevelView<DriveViewAttrs> {
	private readonly viewSlider: ViewSlider
	private readonly driveNavColumn: ViewColumn
	private readonly currentFolderColumn: ViewColumn

	protected onNewUrl(args: Record<string, any>, requestedPath: string): void {
		if (!this.driveViewModel.isDriveEnabledForCustomer()) {
			Dialog.message("driveNotEnabled_msg").then(() => {
				windowFacade.reload({})
			})
			return
		}

		this.driveViewModel.waitForInit().then(() => {
			// /drive/folderId/listElementId
			const { folderListId, folderElementId } = args as { folderListId: string; folderElementId: string }

			if (folderListId && folderElementId) {
				this.driveViewModel.displayFolder([folderListId, folderElementId]).then(() => m.redraw())
			} else {
				// /drive
				// No folder given, load the drive root
				this.driveViewModel.navigateToRootFolder()
			}
		})
	}

	private driveViewModel: DriveViewModel
	private filePicker: DriveFilePicker
	private shortcuts: Shortcut[]
	private operationUpdatesSubscription: Stream<unknown> | null = null

	oncreate() {
		keyManager.registerShortcuts(this.shortcuts)
		this.operationUpdatesSubscription = this.driveViewModel.operationUpdates.map((maybeOperationUpdate: OperationUpdate | null) => {
			if (isNotNull(maybeOperationUpdate)) {
				const { type, count, status, error } = maybeOperationUpdate

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
				this.driveViewModel.operationUpdates(null)
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
		this.filePicker = vnode.attrs.filePicker
		this.init()
		const onTrash = (itemIds: FolderItemId[]) => {
			this.driveViewModel.moveToTrash(itemIds)
		}
		const onMove = (items: FolderItemId[], destinationId: IdTuple) => {
			this.driveViewModel.moveItems(items, destinationId)
		}
		this.driveNavColumn = this.createDriveNavColumn(vnode.attrs.drawerAttrs, onTrash, onMove) // this is where we see the left bar
		this.currentFolderColumn = this.createCurrentFolderColumn(vnode.attrs.header, vnode.attrs.showMoveItemDialog) // this where we see the files of the selected folder being listed
		this.viewSlider = new ViewSlider([this.driveNavColumn, this.currentFolderColumn], windowFacade)

		this.shortcuts = [
			...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.driveViewModel),
			{
				key: Keys.ESC,
				enabled: () => true,
				help: "clearFileSelection_action",
				ctrlOrCmd: false,
				exec: () => {
					this.driveViewModel.selectNone()
				},
			},
			{
				key: Keys.F2,
				enabled: () => true,
				help: "renameItem_action",
				ctrlOrCmd: false,
				exec: () => {
					const selectedItem = this.driveViewModel.getSelectedItem()
					if (selectedItem) {
						this.onRename(selectedItem)
					}
				},
			},
			{
				key: Keys.A,
				enabled: () => true,
				help: "selectAllFiles_action",
				ctrlOrCmd: true,
				exec: () => {
					this.driveViewModel.selectAll()
				},
			},
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
								onUploadFiles: (event, dom) => this.onPickFilesForUpload(dom.getBoundingClientRect()),
								onUploadFolders: (event, dom) => this.onPickFoldersForUpload(dom.getBoundingClientRect()),
								onCreateFolder: () => this.onCreateFolder(),
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

					vnode.attrs.showMoveItemDialog(Array.from(selectedItems), (items: readonly FolderItemId[], destination: DriveFolder) =>
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
		return m(
			"#drive.main-view",
			{
				class: isAndroidApp() && styles.isAppNotUsingBottomNav() && !this.driveViewModel.listState().inMultiselect ? "mb-safe-inset" : undefined,
			},
			[
				m(this.viewSlider, {
					header: m(Header, {
						firstColWidth: this.driveNavColumn.width,
						rightView: null,
						...attrs.header,
						buttons: renderHeaderButtons(),
					}),
					bottomNav:
						styles.isUsingBottomNavigation() && isNotNull(attrs.bottomNav)
							? this.driveViewModel.listState().inMultiselect && this.driveViewModel.listState().selectedItems.size > 0
								? this.renderMobileActionBar(attrs.showMoveItemDialog)
								: attrs.bottomNav()
							: null,
				}),
			],
		)
	}

	private renderMobileActionBar(showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]): Children {
		const { onCopy, onCut, onDelete, onRestore, onTrash, onMove, onDownload } = this.selectedItemsActions(
			this.driveViewModel.listState(),
			showMoveItemDialog,
		)
		const actionsAttrs: MobileActionAttrs[] = []
		if (onDownload) {
			actionsAttrs.push({
				title: "download_action",
				action: onDownload,
				icon: Icons.DownloadFilled,
			})
		}
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
											createDropdown({
												lazyButtons: () =>
													newItemActions({
														onUploadFiles: () => this.onPickFilesForUpload(dom.getBoundingClientRect()),
														onUploadFolders: () => this.onPickFoldersForUpload(dom.getBoundingClientRect()),
														onCreateFolder: () => this.onCreateFolder(),
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

	private createCurrentFolderColumn(headerAttrs: AppHeaderAttrs, showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]) {
		return new ViewColumn(
			{
				view: () => {
					const listState = this.driveViewModel.listState()

					return m(BackgroundColumnLayout, {
						backgroundColor: theme.surface_container,
						floatingActionButton: () => {
							return !this.driveViewModel.listState().inMultiselect ? this.renderFab() : null
						},
						desktopToolbar: () => [],
						columnLayout: [
							this.renderFolderView(listState, showMoveItemDialog),
							m(DriveTransferStack, {
								driveTransfers: this.driveViewModel.transfers(),
								cancelTransfer: (transferId) => this.driveViewModel.cancelTransfer(transferId),
								cancelAllTransfers: async () => {
									const { currentTransfers } = this.driveViewModel.transfers()
									const activeTransfers = currentTransfers.filter((transfer) => transfer.state === "active" || transfer.state === "waiting")
									if (isNotEmpty(activeTransfers)) {
										const ok =
											activeTransfers.length === 1
												? true
												: await Dialog.confirm(
														lang.getTranslation("confirmCancelTransfers_msg", { "{count}": activeTransfers.length }),
														"confirmCancelTransfers_action",
													)
										if (ok) {
											for (const { id } of currentTransfers) {
												this.driveViewModel.cancelTransfer(id)
											}
											this.driveViewModel.flushTransfers()
										}
									} else {
										this.driveViewModel.flushTransfers()
									}
								},
							} satisfies DriveTransferStackAttrs),
						],
						mobileHeader: () => this.renderMobileHeader(headerAttrs, showMoveItemDialog),
					})
				},
			},
			ColumnType.Background,
			{
				minWidth: layout_size.second_col_min_width + layout_size.third_col_min_width,
				maxWidth: layout_size.second_col_max_width + layout_size.third_col_max_width,
			},
		)
	}

	private renderFab(): Children {
		if (!isMobileDriveLayout() || APP_TYPE !== AppType.Drive) {
			return null
		}
		return m(FabMenu, {
			title: lang.getTranslation("newDriveItem_action"),
			actions: newItemActions({
				onUploadFiles: (event, dom) => this.onPickFilesForUpload(dom.getBoundingClientRect()),
				onUploadFolders: (event, dom) => this.onPickFoldersForUpload(dom.getBoundingClientRect()),
				onCreateFolder: () => this.onCreateFolder(),
			}),
		} satisfies FabMenuAttrs)
	}

	private renderMobileHeader(headerAttrs: AppHeaderAttrs, showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]): Children {
		const listState = this.driveViewModel.listState()
		const actions = this.selectedItemsActions(listState, showMoveItemDialog)
		const { onPaste } = actions

		if (listState.inMultiselect) {
			return m(MultiselectMobileHeader, {
				message: lang.getTranslation("itemsSelected_label", { "{number}": listState.selectedItems.size }),
				selected: listState.selectedItems.size === listState.items.length,
				selectAll: () => this.driveViewModel.toggleSelectAll(),
				selectNone: () => this.driveViewModel.selectNone(),
			})
		} else {
			const useBackButton = isNotEmpty(this.driveViewModel.parents)
			return m(MobileHeader, {
				...headerAttrs,
				title: this.driveViewModel.currentFolder ? driveFolderName(this.driveViewModel.currentFolder.folder) : undefined,
				columnType: "first",
				actions: [
					m(DriveMobileSortButton, {
						currentSort: this.driveViewModel.getCurrentColumnSortOrder(),
						onSort: (property) => this.driveViewModel.sort(property),
					}),
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
					APP_TYPE === AppType.Drive
						? null
						: m(
								IconButton,
								attachDropdown({
									mainButtonAttrs: { icon: Icons.Plus, title: "newDriveItem_action" },
									childAttrs: () =>
										newItemActions({
											onUploadFiles: (event, dom) => this.onPickFilesForUpload(dom.getBoundingClientRect()),
											onUploadFolders: (event, dom) => this.onPickFoldersForUpload(dom.getBoundingClientRect()),
											onCreateFolder: () => this.onCreateFolder(),
										}),
								}),
							),
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
			onDropFiles: async (files, folderTransferItems) => {
				this.driveViewModel.filesDropped(files, folderTransferItems)
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
					this.driveViewModel.toggleSelectAll()
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
			onUploadFiles: (_event, dom) => this.onPickFilesForUpload(dom.getBoundingClientRect()),
			onCreateFolder: () =>
				showNewFolderDialog(
					async (folderName) => this.driveViewModel.createNewFolder(folderName),
					() => m.redraw(),
				),
			onUploadFolders: (_event, dom) => this.onPickFoldersForUpload(dom.getBoundingClientRect()),
			fileActions: {
				onOpenItem: (item) => {
					if (item.type === "folder") {
						this.driveViewModel.navigateToFolder(item.folder._id)
					} else {
						this.driveViewModel.openFile(item.file)
					}
				},
				onDownload: (item: FolderItem) => {
					if (item.type === "file") {
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
			onPaste: this.driveViewModel.currentFolder?.type !== DriveFolderType.Trash && this.driveViewModel.clipboard ? () => this.onPaste() : undefined,
		} satisfies DriveFolderViewAttrs)
	}

	private selectedItemsActions(listState: ListState<FolderItem>, showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]): DriveSelectedItemsActions {
		const isListingTrash = this.driveViewModel.currentFolder?.type === DriveFolderType.Trash
		const selectedItems = Array.from(listState.selectedItems)
		const hasSelectedItems = isNotEmpty(selectedItems)

		return {
			onTrash: isListingTrash || listState.selectedItems.size === 0 ? null : () => this.driveViewModel.moveToTrash(selectedItems.map(folderItemToId)),
			onDelete:
				isListingTrash && hasSelectedItems
					? async () => {
							this.deleteItems()
						}
					: null,
			onRestore: isListingTrash && hasSelectedItems ? () => this.driveViewModel.restoreFromTrash(selectedItems) : null,
			onCut: !isListingTrash && hasSelectedItems ? () => this.driveViewModel.cut(selectedItems) : null,
			onCopy: !isListingTrash && hasSelectedItems ? () => this.driveViewModel.copy(selectedItems) : null,
			onPaste: !isListingTrash && this.driveViewModel.clipboard ? () => this.onPaste() : null,
			onMove:
				!isListingTrash && hasSelectedItems
					? () => showMoveItemDialog(selectedItems, (items, destinationFolder) => this.driveViewModel.moveItems(items, destinationFolder._id))
					: null,
			onDownload:
				!isListingTrash && hasSelectedItems && this.driveViewModel.isDownloadPermitted(selectedItems)
					? () => {
							for (const item of selectedItems) {
								this.driveViewModel.downloadFile(item.file)
							}
						}
					: null,
		}
	}

	private onRename(item: FolderItem) {
		showRenameDialog(item, (newName) => this.driveViewModel.rename(item, newName))
	}

	async onPickFilesForUpload(boundingRect: DOMRect): Promise<void> {
		const files = await this.filePicker.pickFiles(boundingRect)
		await this.driveViewModel.uploadFiles(files)
	}

	private async onPickFoldersForUpload(boundingRect: DOMRect): Promise<void> {
		try {
			const folders = await this.filePicker.pickFolders(boundingRect)
			await this.driveViewModel.uploadFiles([], folders)
		} catch (e) {
			if (!(e instanceof CancelledError)) {
				throw e
			}
		}
	}

	async onCreateFolder(): Promise<void> {
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
