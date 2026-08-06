import { AppHeaderAttrs, Header } from "../../../../ui/Header"
import { TopLevelAttrs, TopLevelView } from "../../../../ui/base/TopLevelView"
import { BaseTopLevelView } from "../../../../ui/BaseTopLevelView"
import { ColumnType, ViewColumn } from "../../../../ui/base/ViewColumn"
import { DriveSearchViewModel, DriveSizeFilter } from "./DriveSearchViewModel"
import m, { Children, Vnode } from "mithril"
import { FolderColumnView } from "../../../common/gui/FolderColumnView"
import { SidebarSection } from "../../../../ui/SidebarSection"
import { component_size, layout_size, px, size } from "../../../../ui/size"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { AllIcons } from "../../../../ui/base/Icon"
import { FilterChip } from "../../../../ui/base/FilterChip"
import { createDropdown } from "../../../../ui/base/Dropdown"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { Icons } from "../../../../ui/base/icons/Icons"
import { formatDate } from "../../../../ui/utils/Formatter"
import { isEmpty, isNotEmpty, isNotNull, isSameDayOfDate } from "@tutao/utils"
import { ViewSlider } from "../../../../ui/nav/ViewSlider"
import { windowFacade } from "../../../common/misc/WindowFacade"
import { renderHeaderButtons } from "../../../calendar-app/gui/HeaderButtons"
import { styles } from "../../../../ui/styles"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../../ui/base/BaseSearchBar"
import { isKeyPressed } from "../../../../ui/utils/KeyManager"
import { Keys, ProgrammingError } from "@tutao/app-env"
import { renderSearchInOurApps } from "../../../common/search/SearchUtils"
import { Card } from "../../../../ui/base/Card"
import { showDateRangeSelectionDialog } from "../../../calendar-app/calendar/gui/pickers/DatePickerDialog"
import { BackgroundColumnLayout } from "../../../../ui/BackgroundColumnLayout"
import { theme } from "../../../../ui/theme"
import { DriveTransferStack, DriveTransferStackAttrs } from "../../drive/view/DriveTransferStack"
import { Dialog } from "../../../../ui/base/Dialog"
import { FolderItem, FolderItemId } from "../../drive/view/DriveUtils"
import { MoveItems } from "../../drive/view/DriveMoveItemDialog"
import { ListLoadingState, ListState } from "../../../../ui/base/List"
import { IconButton } from "../../../../ui/base/IconButton"
import { EnterMultiselectIconButton } from "../../../../ui/EnterMultiselectIconButton"
import { DriveViewAttrs } from "../../drive/view/DriveView"
import { DriveSelectedItemsActions } from "../../drive/view/DriveFolderNav"
import { DriveFolderContent } from "../../drive/view/DriveFolderContent"
import { SortColumn } from "../../drive/view/DriveViewModel"
import { driveItemContextMenu, showRenameDialog } from "../../drive/view/DriveGuiUtils"
import { DriveFolder } from "@tutao/entities/drive"
import { FileActions } from "../../drive/view/DriveFolderContentEntry"
import { IconMessageBox } from "../../../../ui/base/ColumnEmptyMessageBox"
import { BaseMobileHeader } from "../../../../ui/BaseMobileHeader"
import { DRIVE_PREFIX } from "../../../../ui/utils/RouteChange"
import { ProgressBar } from "../../../../ui/base/ProgressBar"
import { MultiselectMobileHeader } from "../../../../ui/MultiselectMobileHeader"
import { selectionAttrsForList } from "../../../common/misc/ListModel"
import { MobileActionAttrs, MobileActionBar } from "../../../../ui/MobileActionBar"

export interface DriveSearchViewAttrs extends TopLevelAttrs {
	header: AppHeaderAttrs
	makeViewModel: () => DriveSearchViewModel
	drawerAttrs: DrawerMenuAttrs
	showMoveItemDialog: (items: FolderItem[], moveItems: MoveItems) => unknown
	bottomNav?: () => Children
}

export class DriveSearchView extends BaseTopLevelView implements TopLevelView<DriveSearchViewAttrs> {
	private readonly viewSlider: ViewSlider
	private readonly filtersColumn: ViewColumn
	private readonly searchResultsColumn: ViewColumn
	private readonly searchViewModel: DriveSearchViewModel
	private startOfTheWeekOffset: number

	constructor(vnode: Vnode<DriveSearchViewAttrs>) {
		super()
		this.searchViewModel = vnode.attrs.makeViewModel()
		this.startOfTheWeekOffset = this.searchViewModel.getStartOfTheWeekOffset()
		this.filtersColumn = new ViewColumn(
			{
				view: () => {
					return m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
						button: null,
						content: [
							m(SidebarSection, {
								name: "searchFilters_label",
							}),
							m(".flex.wrap.plr-16.gap-8.flex-shrink-children", this.renderFilterChips()),
							m(".flex-grow"),
							this.renderAppPromo(),
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
								cancelAllTransfers: async () => {
									const { currentTransfers } = this.searchViewModel.transfers()
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
												this.searchViewModel.cancelTransfer(id)
											}
											this.searchViewModel.flushTransfers()
										}
									} else {
										this.searchViewModel.flushTransfers()
									}
								},
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
					styles.isUsingBottomNavigation() && isNotNull(attrs.bottomNav)
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

	private renderSearchbar() {
		return m(
			// form wrapper to isolate the search input and prevent it from being autofilled when unrelated buttons are clicked on chrome
			// this is done because chrome doesn't appear to respect `autocomplete="off"` and will autofill the field anyway
			"form.full-width",
			{
				style: {
					maxWidth: styles.isUsingBottomNavigation() ? "" : px(layout_size.second_col_max_width + 50),
				},
				onsubmit: (e: SubmitEvent) => {
					e.stopPropagation()
					e.preventDefault()
				},
			},
			m(BaseSearchBar, {
				placeholder: lang.get("searchDrive_placeholder"),
				text: this.searchViewModel.getCurrentQuery(),
				busy: this.searchViewModel.busy,
				onInput: (text: string) => {
					this.searchViewModel.onSearchQueryUpdated(text)
				},
				onKeyDown: (e) => {
					e.stopPropagation()
					if (isKeyPressed(e.key, Keys.RETURN)) {
						e.preventDefault()
					}
				},
				onClear: () => this.searchViewModel.onSearchQueryUpdated(""),
			} satisfies BaseSearchBarAttrs),
		)
	}

	private renderFilterChips() {
		return [
			this.renderCategoryChip("driveView_action", Icons.DriveFilled),
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
				label: this.searchViewModel.labelForDriveSizeFilterChip(),
				selected: this.searchViewModel.driveSizeFilter !== DriveSizeFilter.NoLimit,
				chevron: true,
				onClick: createDropdown({
					lazyButtons: () => [
						{
							label: lang.getTranslation("driveFileSizeLessThan1MB_label"),
							click: () => this.searchViewModel.setDriveFilter(DriveSizeFilter.Below1MB),
						},
						{
							label: lang.getTranslation("driveFileSizeLessThan10MB_label"),
							click: () => this.searchViewModel.setDriveFilter(DriveSizeFilter.Below10MB),
						},
						{
							label: lang.getTranslation("driveFileSizeLessThan250MB_label"),
							click: () => this.searchViewModel.setDriveFilter(DriveSizeFilter.Below250MB),
						},
						{
							label: lang.getTranslation("driveFileSizeLessThan1GB_label"),
							click: () => this.searchViewModel.setDriveFilter(DriveSizeFilter.Below1000MB),
						},
						{
							label: lang.getTranslation("driveFileSizeBiggerThan1GB_label"),
							click: () => this.searchViewModel.setDriveFilter(DriveSizeFilter.Over1000MB),
						},
						{
							label: lang.getTranslation("driveFileSizeNoLimit_label"),
							click: () => this.searchViewModel.setDriveFilter(DriveSizeFilter.NoLimit),
						},
					],
				}),
			}),
		]
	}
	private renderCategoryChip(label: TranslationKey, icon: AllIcons): Children {
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

	private renderAppPromo(): Children {
		const searchText = renderSearchInOurApps()
		if (searchText == null) {
			return null
		}
		return m("div.ml-8.mt-12.small.plr-8.content-fg.mb-16", m(Card, searchText))
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
		const selectionEvents = {
			onSingleSelection: (item: FolderItem) => this.searchViewModel.onSingleSelection(item),
			onSingleExclusiveSelection: (item: FolderItem) => this.searchViewModel.onSingleExclusiveSelection(item),
			onSingleInclusiveSelection: (item: FolderItem) => this.searchViewModel.onSingleInclusiveSelection(item),
			onSelectPrevious: (item: FolderItem) => {},
			onSelectNext: (item: FolderItem) => {},
			onSelectAll: () => this.searchViewModel.toggleSelectAll(),
			onSelectNone: () => this.searchViewModel.selectNone(),
			onRangeSelectionTowards: (item: FolderItem) => this.searchViewModel.onRangeSelectionTowards(item),
		}
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
			"div.col.flex.plr-8.fill-absolute",
			styles.isDesktopLayout() ? null : this.renderFilterBar(),
			m(
				".rel.flex-grow",
				!styles.isDesktopLayout() ? null : this.renderActionBar(showMoveItemDialog),
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
						}),
			),
		)
	}
	private onRename(item: FolderItem) {
		showRenameDialog(item, (newName) => this.searchViewModel.rename(item, newName))
	}

	private renderActionBar(showMoveItemDialog: (items: FolderItem[], moveItems: MoveItems) => unknown) {
		const { onRestore, onDelete, onCopy, onCut, onTrash, onDownload, onMove } = this.selectedItemsActions(
			this.searchViewModel.listState(),
			showMoveItemDialog,
		)
		return m(
			".flex.items-center.justify-right.border-radius-12",
			{
				style: {
					background: theme.surface,
					padding: `${size.base_4}px ${size.spacing_12}px ${size.base_4}px ${size.spacing_24}px`,
				},
			},
			m(".flex.items-center.column-gap-4", [
				// Ensure that the height of the bar remains the same even when no buttons are shown
				m("", {
					style: {
						width: px(1),
						height: px(component_size.button_height),
					},
				}),

				// Caution: when adding actions, make sure they match the order in the file context menu.
				onDownload
					? m(IconButton, {
							title: "download_action",
							click: onDownload,
							icon: Icons.DownloadFilled,
						})
					: null,
				onRestore
					? m(IconButton, {
							title: "restoreFromTrash_action",
							click: onRestore,
							icon: Icons.ArrowBackFilled,
						})
					: null,
				onDelete
					? m(IconButton, {
							title: "delete_action",
							click: onDelete,
							icon: Icons.TrashCrossFilled,
						})
					: null,
				onCopy
					? m(IconButton, {
							title: "copy_action",
							click: onCopy,
							icon: Icons.CopyFilled,
						})
					: null,
				onCut
					? m(IconButton, {
							title: "cut_action",
							click: onCut,
							icon: Icons.ScissorsFilled,
						})
					: null,
				onMove
					? m(IconButton, {
							title: "move_action",
							click: onMove,
							icon: Icons.Move,
						})
					: null,
				onTrash
					? m(IconButton, {
							title: "trash_action",
							click: onTrash,
							icon: Icons.TrashFilled,
						})
					: null,
			]),
		)
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

	private renderMobileListActionsHeader(header: AppHeaderAttrs) {
		const rightActions: Children[] = []
		rightActions.push(
			m(EnterMultiselectIconButton, {
				clickAction: () => {
					this.searchViewModel.listModel.enterMultiselect()
				},
			}),
		)
		return m(BaseMobileHeader, {
			left: !styles.isMobileDesktopLayout()
				? m(
						".icon-button",
						m(IconButton, {
							title: "back_action",
							icon: Icons.ChevronLeft,
							click: () => m.route.set(DRIVE_PREFIX),
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
