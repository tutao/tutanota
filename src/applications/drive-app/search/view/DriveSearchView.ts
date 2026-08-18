import { AppHeaderAttrs, Header } from "../../../../ui/Header"
import { TopLevelAttrs, TopLevelView } from "../../../../ui/base/TopLevelView"
import { BaseTopLevelView } from "../../../../ui/BaseTopLevelView"
import { ColumnType, ViewColumn } from "../../../../ui/base/ViewColumn"
import { DriveSearchViewModel, DriveSizeFilter } from "./DriveSearchViewModel"
import m, { Children, Vnode } from "mithril"
import { FolderColumnView } from "../../../common/gui/FolderColumnView"
import { SidebarSection } from "../../../../ui/SidebarSection"
import { layout_size } from "../../../../ui/size"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { FilterChip } from "../../../../ui/base/FilterChip"
import { createDropdown } from "../../../../ui/base/Dropdown"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { Icons } from "../../../../ui/base/icons/Icons"
import { formatDate } from "../../../../ui/utils/Formatter"
import { isEmpty, isNotEmpty, isNotNull, isSameDayOfDate, lazyMemoized } from "@tutao/utils"
import { ViewSlider } from "../../../../ui/nav/ViewSlider"
import { windowFacade } from "../../../common/misc/WindowFacade"
import { renderHeaderButtons } from "../../../calendar-app/gui/HeaderButtons"
import { CancelledError, ProgrammingError } from "@tutao/app-env"
import { showDateRangeSelectionDialog } from "../../../calendar-app/calendar/gui/pickers/DatePickerDialog"
import { BackgroundColumnLayout } from "../../../../ui/BackgroundColumnLayout"
import { theme } from "../../../../ui/theme"
import { DriveTransferStack, DriveTransferStackAttrs } from "../../drive/view/DriveTransferStack"
import { Dialog } from "../../../../ui/base/Dialog"
import { FolderItem, FolderItemId, OperationUpdate, SortColumn } from "../../drive/view/DriveUtils"
import { MoveItems } from "../../drive/view/DriveMoveItemDialog"
import { ListLoadingState, ListState, MultiselectMode } from "../../../../ui/base/List"
import { IconButton } from "../../../../ui/base/IconButton"
import { EnterMultiselectIconButton } from "../../../../ui/EnterMultiselectIconButton"
import { DriveViewAttrs } from "../../drive/view/DriveView"
import { DriveSelectedItemsActions } from "../../drive/view/DriveFolderNav"
import { DriveFolderContent } from "../../drive/view/DriveFolderContent"
import { DriveFolder } from "@tutao/entities/drive"
import { FileActions } from "../../drive/view/DriveFolderContentEntry"
import { IconMessageBox } from "../../../../ui/base/ColumnEmptyMessageBox"
import { BaseMobileHeader } from "../../../../ui/BaseMobileHeader"
import { ProgressBar } from "../../../../ui/base/ProgressBar"
import { MultiselectMobileHeader } from "../../../../ui/MultiselectMobileHeader"
import { selectionAttrsForList } from "../../../common/misc/ListModel"
import { MobileActionAttrs, MobileActionBar } from "../../../../ui/MobileActionBar"
import Stream from "mithril/stream"
import {
	cancelAllTransfersConfirmationDialog,
	driveItemContextMenu,
	driveKeyboardShortcuts,
	isMobileDriveLayout,
	newItemActions,
	operationUpdateSnackbar,
	showDuplicateFilesChoiceDialog,
	showRenameDialog,
} from "../../drive/view/DriveGuiUtils"
import { AppPromo } from "../../../common/gui/AppPromo"
import { DriveActionBar } from "../../drive/view/DriveActionBar"
import { SearchViewSearchBar } from "../../../common/search/SearchViewSearchBar"
import { Styles } from "../../../../ui/styles"
import { ClientDetector } from "../../../../platform-kit/app-env/boot/ClientDetector"
import { keyManager, Shortcut } from "../../../../ui/utils/KeyManager"
import { listSelectionKeyboardShortcuts, onlySingleSelection } from "../../../../ui/base/ListUtils"
import { DriveFilePicker } from "../../drive/view/DriveFilePicker"
import { FileType } from "../../drive/model/DriveMimeUtils"

export interface DriveSearchViewAttrs extends TopLevelAttrs {
	header: AppHeaderAttrs
	makeViewModel: () => DriveSearchViewModel
	drawerAttrs: DrawerMenuAttrs
	showMoveItemDialog: (items: FolderItem[], moveItems: MoveItems) => unknown
	filePicker: DriveFilePicker
	bottomNav?: () => Children
}

/**
 * View to display Drive search results (items and folders)
 */
export class DriveSearchView extends BaseTopLevelView implements TopLevelView<DriveSearchViewAttrs> {
	private readonly viewSlider: ViewSlider
	private readonly filtersColumn: ViewColumn
	private readonly searchResultsColumn: ViewColumn
	private readonly searchViewModel: DriveSearchViewModel
	private filePicker: DriveFilePicker
	private readonly showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]
	private startOfTheWeekOffset: number
	private operationUpdatesSubscription: Stream<unknown> | null = null

	constructor(vnode: Vnode<DriveSearchViewAttrs>) {
		super()
		this.searchViewModel = vnode.attrs.makeViewModel()
		this.showMoveItemDialog = vnode.attrs.showMoveItemDialog
		this.filePicker = vnode.attrs.filePicker
		this.startOfTheWeekOffset = this.searchViewModel.getStartOfTheWeekOffset()
		this.filtersColumn = new ViewColumn(
			{
				view: () => {
					return m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
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
												}),
										})(ev, ev.target as HTMLElement)
									},
								},
						content: [
							m(SidebarSection, {
								name: "searchFilters_label",
							}),
							m(".flex.wrap.plr-16.gap-8.flex-shrink-children", this.renderFilterChips()),
							m(".flex-grow"),
							m(AppPromo),
						],
						ariaLabel: "search_label",
					})
				},
			},
			ColumnType.Foreground,
			{
				minWidth: layout_size.first_col_min_width,
				maxWidth: layout_size.first_col_max_width,
				headerCenter: "search_label",
			},
		)
		this.searchResultsColumn = new ViewColumn(
			{
				view: () => {
					const listState = this.searchViewModel.listState()
					return m(BackgroundColumnLayout, {
						backgroundColor: theme.surface_container,
						desktopToolbar: () => [],
						columnLayout: [
							this.renderFolderView(listState, vnode.attrs.showMoveItemDialog),
							m(DriveTransferStack, {
								driveTransfers: this.searchViewModel.transfers(),
								cancelTransfer: (transferId) => this.searchViewModel.cancelTransfer(transferId),
								retryTransfer: (transferId) => this.searchViewModel.retryTransfer(transferId),
								cancelAllTransfers: async () => await this.searchViewModel.cancelAllTransfers(cancelAllTransfersConfirmationDialog),
							} satisfies DriveTransferStackAttrs),
						],
						mobileHeader: () => this.renderMobileListHeader(vnode.attrs.header),
					})
				},
			},
			ColumnType.Background,
			{
				minWidth: layout_size.second_col_min_width + layout_size.third_col_min_width,
				maxWidth: layout_size.second_col_max_width + layout_size.third_col_max_width,
			},
		)

		this.viewSlider = new ViewSlider([this.filtersColumn, this.searchResultsColumn], windowFacade)
	}
	async onPickFilesForUpload(boundingRect: DOMRect): Promise<void> {
		const files = await this.filePicker.pickFiles(boundingRect)
		await this.searchViewModel.uploadFiles(files, showDuplicateFilesChoiceDialog)
	}

	private async onPickFoldersForUpload(boundingRect: DOMRect): Promise<void> {
		try {
			const folders = await this.filePicker.pickFolders(boundingRect)
			await this.searchViewModel.uploadFiles([], showDuplicateFilesChoiceDialog, folders)
		} catch (e) {
			if (!(e instanceof CancelledError)) {
				throw e
			}
		}
	}

	private selectedItemsActions(listState: ListState<FolderItem>, showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]): DriveSelectedItemsActions {
		const anyItemInTrash = this.searchViewModel.anySelectedItemInTrash()
		const selectedItems = Array.from(listState.selectedItems)
		const hasSelectedItems = isNotEmpty(selectedItems)
		const allItemsInTrash = this.searchViewModel.allItemsInTrash()
		return {
			onTrash: hasSelectedItems && !allItemsInTrash ? () => this.searchViewModel.moveToTrash(selectedItems) : null,
			onDelete:
				allItemsInTrash && hasSelectedItems
					? async () => {
							await this.deleteItems()
						}
					: null,
			onRestore: allItemsInTrash && hasSelectedItems ? () => this.searchViewModel.restoreFromTrash(selectedItems) : null,
			onCut: !anyItemInTrash && hasSelectedItems ? () => this.searchViewModel.cut(selectedItems) : null,
			onCopy: !anyItemInTrash && hasSelectedItems ? () => this.searchViewModel.copy(selectedItems) : null,
			onPaste: null,
			onMove:
				!anyItemInTrash && hasSelectedItems
					? () => showMoveItemDialog(selectedItems, (items, destinationFolder) => this.searchViewModel.moveItems(items, destinationFolder._id))
					: null,
			onDownload:
				!anyItemInTrash && hasSelectedItems && this.searchViewModel.isDownloadPermitted(selectedItems)
					? () => {
							for (const item of selectedItems) {
								this.searchViewModel.downloadFile(item.file)
							}
						}
					: null,
		}
	}
	private renderMobileListHeader(header: AppHeaderAttrs): Children {
		return this.searchViewModel.listModel && this.searchViewModel.listModel.state.inMultiselect
			? this.renderMultiSelectMobileHeader()
			: this.renderMobileListActionsHeader(header)
	}
	protected async onNewUrl(args: Record<string, any>, requestedPath: string) {
		await this.searchViewModel.init()
		this.searchViewModel.onNewUrl(args, requestedPath)
		m.redraw()
	}

	private readonly shortcuts = lazyMemoized<ReadonlyArray<Shortcut>>(() => {
		const actions = () => this.selectedItemsActions(this.searchViewModel.listState(), this.showMoveItemDialog)

		return [
			...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.searchViewModel.listModel),
			...driveKeyboardShortcuts({
				clear: () => {
					this.searchViewModel.selectionEvents.selectNone()
				},
				rename: () => {
					const selectedItem = onlySingleSelection(this.searchViewModel.listState())
					if (selectedItem) {
						this.onRename(selectedItem)
					}
				},
				selectAll: () => {
					this.searchViewModel.selectionEvents.selectAll()
				},
				copy: () => {
					actions().onCopy?.()
				},
				cut: () => {
					actions().onCut?.()
				},
				move: () => {
					actions().onMove?.()
				},
				delete: () => {
					actions().onTrash?.()
				},
				open: () => {
					this.searchViewModel.openActiveItem()
				},
			}),
		]
	})

	oncreate() {
		this.operationUpdatesSubscription = this.searchViewModel.operationUpdates().map((maybeOperationUpdate: OperationUpdate | null) => {
			operationUpdateSnackbar(maybeOperationUpdate)
		})
		keyManager.registerShortcuts(this.shortcuts())
	}

	onremove() {
		this.operationUpdatesSubscription?.end(true)
		this.operationUpdatesSubscription = null
		keyManager.unregisterShortcuts(this.shortcuts())
		this.searchViewModel.dispose()
	}

	view({ attrs }: Vnode<DriveSearchViewAttrs>): Children {
		return m(
			"#search.main-view",
			m(this.viewSlider, {
				header: m(Header, {
					firstColWidth: this.filtersColumn.width,
					searchBar: () => this.renderSearchbar(),
					...attrs.header,
					buttons: renderHeaderButtons(),
				}),
				bottomNav:
					Styles.get().isUsingBottomNavigation() && isNotNull(attrs.bottomNav)
						? this.searchViewModel.listState().inMultiselect && this.searchViewModel.listState().selectedItems.size > 0
							? this.renderMobileActionBar(attrs.showMoveItemDialog)
							: attrs.bottomNav()
						: null,
			}),
		)
	}
	private renderMobileActionBar(showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]): Children {
		const { onCopy, onCut, onDelete, onRestore, onTrash, onMove, onDownload } = this.selectedItemsActions(
			this.searchViewModel.listState(),
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

	private renderSearchbar(): Children {
		return m(SearchViewSearchBar, {
			placeholder: lang.getTranslationText("searchDrive_placeholder"),
			text: this.searchViewModel.getCurrentQuery(),
			busy: this.searchViewModel.busy,
			onInput: (text: string) => this.searchViewModel.onSearchQueryUpdated(text),
			onClear: () => this.searchViewModel.onSearchQueryUpdated(""),
		})
	}

	private renderFilterChips(): Children {
		return [
			!ClientDetector.get().isDriveApp() ? this.renderCategoryChip("driveView_action", Icons.DriveFilled) : null,
			m(FilterChip, {
				label: lang.makeTranslation(
					"btn:date",
					`${this.searchViewModel.startDate ? formatDate(this.searchViewModel.startDate) : lang.getTranslationText("unlimited_label")} - ${
						isSameDayOfDate(new Date(), this.searchViewModel.endDate)
							? lang.getTranslationText("today_label")
							: formatDate(this.searchViewModel.endDate)
					}`,
				),
				selected: true,
				chevron: false,
				onClick: (_) => this.onDriveDateRangeSelect(),
			}),
			m(FilterChip, {
				label: this.searchViewModel.labelForDriveFileTypeFilterChip(),
				selected: this.searchViewModel.driveFileTypeFiler !== null,
				chevron: true,
				onClick: createDropdown({
					lazyButtons: () => [
						this.searchViewModel.driveFileTypeFiler !== null
							? {
									label: lang.getTranslation("driveAllFileTypes_label"),
									click: () => this.searchViewModel.setFileTypeFilter(null),
								}
							: null,
						{
							label: lang.getTranslation("driveAudioFilter_label"),
							click: () => this.searchViewModel.setFileTypeFilter(FileType.Audio),
						},
						{
							label: lang.getTranslation("driveVideoFilter_label"),
							click: () => this.searchViewModel.setFileTypeFilter(FileType.Video),
						},
						{
							label: lang.getTranslation("driveImageFilter_label"),
							click: () => this.searchViewModel.setFileTypeFilter(FileType.Image),
						},
						{
							label: lang.getTranslation("driveDocumentFilter_label"),
							click: () => this.searchViewModel.setFileTypeFilter(FileType.Document),
						},
						{
							label: lang.getTranslation("driveGenericFilter_label"),
							click: () => this.searchViewModel.setFileTypeFilter(FileType.Generic),
						},
					],
				}),
			}),
			m(FilterChip, {
				label: this.searchViewModel.labelForDriveSizeFilterChip(),
				selected: this.searchViewModel.driveSizeFilter !== DriveSizeFilter.NoLimit,
				chevron: true,
				onClick: createDropdown({
					lazyButtons: () => [
						this.searchViewModel.driveSizeFilter !== DriveSizeFilter.NoLimit
							? {
									label: lang.getTranslation("driveFileSizeNoLimit_label"),
									click: () => this.searchViewModel.setDriveFileSizeFilter(DriveSizeFilter.NoLimit),
								}
							: null,
						{
							label: lang.getTranslation("driveFileSizeLessThan1MB_label"),
							click: () => this.searchViewModel.setDriveFileSizeFilter(DriveSizeFilter.Below1MB),
						},
						{
							label: lang.getTranslation("driveFileSizeLessThan10MB_label"),
							click: () => this.searchViewModel.setDriveFileSizeFilter(DriveSizeFilter.Below10MB),
						},
						{
							label: lang.getTranslation("driveFileSizeLessThan250MB_label"),
							click: () => this.searchViewModel.setDriveFileSizeFilter(DriveSizeFilter.Below250MB),
						},
						{
							label: lang.getTranslation("driveFileSizeLessThan1GB_label"),
							click: () => this.searchViewModel.setDriveFileSizeFilter(DriveSizeFilter.Below1000MB),
						},
						{
							label: lang.getTranslation("driveFileSizeBiggerThan1GB_label"),
							click: () => this.searchViewModel.setDriveFileSizeFilter(DriveSizeFilter.Over1000MB),
						},
					],
				}),
			}),
		]
	}
	private renderCategoryChip(label: TranslationKey, icon: Icons): Children {
		return m(FilterChip, {
			label: lang.getTranslation(label),
			icon,
			selected: true,
			chevron: true,
			onClick: createDropdown({
				lazyButtons: () => [
					{
						label: "emails_label",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.mail)
							m.route.set(href)
						},
						icon: Icons.MailFilled,
					},
					{
						label: "contacts_label",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.contact)
							m.route.set(href)
						},
						icon: Icons.PeopleFilled,
					},
					{
						label: "calendar_label",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.calendar)
							m.route.set(href)
						},
						icon: Icons.CalendarFilled,
					},
					{
						label: "driveView_action",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.drive)
							m.route.set(href)
						},
						icon: Icons.DriveFilled,
					},
				],
			}),
		})
	}

	private async onDriveDateRangeSelect() {
		const { start, end } = await showDateRangeSelectionDialog({
			start: this.searchViewModel.startDate,
			end: this.searchViewModel.endDate,
			startOfTheWeekOffset: this.startOfTheWeekOffset,
			optionalStartDate: true,
			dateValidator: (startDate, endDate) => {
				switch (this.searchViewModel.checkDates(startDate, endDate)) {
					case "startafterend":
						return lang.getTranslationText("startAfterEnd_label")
					case "long":
						return lang.getTranslationText("longSearchRange_msg")
					case null:
						return null
					default:
						throw new ProgrammingError()
				}
			},
		})
		this.searchViewModel.selectStartDate(start)
		this.searchViewModel.selectEndDate(end)
	}

	private renderFolderView(listState: ListState<FolderItem>, showMoveItemDialog: (items: FolderItem[], moveItems: MoveItems) => unknown) {
		const selectionEvents = this.searchViewModel.selectionEvents
		const fileActions: FileActions = {
			onCut: (item) => this.searchViewModel.cut([item]),
			onCopy: (item) => this.searchViewModel.copy([item]),
			onOpenItem: (item) => {
				if (item.type === "folder") {
					this.searchViewModel.navigateToFolder(item.folder._id)
				} else {
					this.searchViewModel.openFile(item.file)
				}
			},
			onDownload: (item) => {
				if (item.type === "file") {
					this.searchViewModel.downloadFile(item.file)
				}
			},
			onTrash: (item) => this.searchViewModel.moveToTrash([item]),
			onRename: (item) => this.onRename(item),
			onRestore: (item) => this.searchViewModel.restoreFromTrash([item]),
			onDelete: (item) => this.deleteItems(item),
			onStartMove: (item) =>
				showMoveItemDialog([item], (items: readonly FolderItemId[], destinationFolder: DriveFolder) =>
					this.searchViewModel.moveItems(items, destinationFolder._id),
				),
		}
		return m(
			"div.col.flex.plr-8.fill-absolute..overflow-y-scroll",
			Styles.get().isDesktopLayout() ? null : this.renderFilterBar(),
			m(
				".rel.flex-grow",
				!Styles.get().isDesktopLayout() ? null : this.renderActionBar(showMoveItemDialog),
				listState.loadingStatus === ListLoadingState.Done && isEmpty(listState.items)
					? this.renderEmptyView()
					: m(DriveFolderContent, {
							sortOrder: this.searchViewModel.getCurrentColumnSortOrder(),
							onSort: (column: SortColumn) => this.searchViewModel.sort(column),
							fileActions: fileActions,
							listState: listState,
							selectionEvents: selectionEvents,
							onDropInto: (f: FolderItem, event: DragEvent) => {},
							onEntryContextMenu: (item: FolderItem, event: MouseEvent) => {
								driveItemContextMenu(
									selectionEvents,
									this.selectedItemsActions(this.searchViewModel.listState(), showMoveItemDialog),
									fileActions,
									listState,
									item,
									event,
								)
							},
							clipboard: this.searchViewModel.clipboard,
							displayLocation: true,
							highlightedStrings: this.searchViewModel.getHighlightedStrings(),
						}),
			),
		)
	}
	private onRename(item: FolderItem) {
		showRenameDialog(item, (newName) => this.searchViewModel.rename(item, newName))
	}

	private renderActionBar(showMoveItemDialog: (items: FolderItem[], moveItems: MoveItems) => unknown): Children {
		const actions = this.selectedItemsActions(this.searchViewModel.listState(), showMoveItemDialog)
		return m(DriveActionBar, actions)
	}

	async deleteItems(item?: FolderItem) {
		const items = item ? [item] : Array.from(this.searchViewModel.listState().selectedItems)

		const ok = await Dialog.confirm(
			lang.getTranslation("confirmDeleteFilesPermanently_msg", { "{count}": items.length }),
			"confirmDeleteFilesPermanently_action",
		)
		if (ok) this.searchViewModel.deleteFromTrash(items)
	}

	private renderEmptyView(): Children {
		return m(
			"",
			{
				style: {
					marginTop: "6.4rem",
				},
			},
			m(IconMessageBox, {
				message: lang.getTranslation("searchNoResults_msg"),
				icon: Icons.DriveFilled,
				color: theme.on_surface_variant,
			}),
		)
	}
	private renderFilterBar(): Children {
		return m(".flex.gap-8.pl-16.pr-16.pt-8.pb-8.scroll-x", this.renderFilterChips())
	}

	private renderMultiSelectMobileHeader(): Children {
		return m(MultiselectMobileHeader, {
			...selectionAttrsForList(this.searchViewModel.listModel),
			message: lang.getTranslation("itemsSelected_label", { "{number}": this.searchViewModel.listState().selectedItems.size }),
		})
	}

	private renderMobileListActionsHeader(header: AppHeaderAttrs): Children {
		const rightActions: Children[] = []
		rightActions.push(
			m(EnterMultiselectIconButton, {
				clickAction: () => {
					this.searchViewModel.enterMultiselect()
				},
			}),
		)
		return m(BaseMobileHeader, {
			left: !Styles.get().isMobileDesktopLayout()
				? m(
						".icon-button",
						m(IconButton, {
							title: "back_action",
							icon: Icons.ChevronLeft,
							click: () => this.searchViewModel.goToDriveView(),
						}),
					)
				: m(".ml-8"),
			right: rightActions,
			center: m(
				".flex-grow.flex.justify-center",
				{
					class: rightActions.length === 0 ? "mr-12" : "",
				},
				this.renderSearchbar(),
			),
			injections: m(ProgressBar, { progress: header.offlineIndicatorModel.getProgress() }),
		})
	}
}
