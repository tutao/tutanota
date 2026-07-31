import { AppHeaderAttrs, Header } from "../../../../ui/Header"
import { TopLevelAttrs, TopLevelView } from "../../../../ui/base/TopLevelView"
import { BaseTopLevelView } from "../../../../ui/BaseTopLevelView"
import { ColumnType, ViewColumn } from "../../../../ui/base/ViewColumn"
import { DriveSearchViewModel } from "./DriveSearchViewModel"
import m, { Children, Vnode } from "mithril"
import { FolderColumnView } from "../../../common/gui/FolderColumnView"
import { SidebarSection } from "../../../../ui/SidebarSection"
import { layout_size, px } from "../../../../ui/size"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { AllIcons } from "../../../../ui/base/Icon"
import { FilterChip } from "../../../../ui/base/FilterChip"
import { createDropdown } from "../../../../ui/base/Dropdown"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { Icons } from "../../../../ui/base/icons/Icons"
import { formatDate } from "../../../../ui/utils/Formatter"
import { isNotEmpty, isSameDayOfDate } from "@tutao/utils"
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
import { FolderItem, folderItemToId } from "../../drive/view/DriveUtils"
import { MoveItems } from "../../drive/view/DriveMoveItemDialog"
import { ListState } from "../../../../ui/base/List"
import { MultiselectMobileHeader } from "../../../../ui/MultiselectMobileHeader"
import { MobileHeader } from "../../../../ui/MobileHeader"
import { DriveMobileSortButton } from "../../drive/view/DriveMobileSortButton"
import { IconButton } from "../../../../ui/base/IconButton"
import { EnterMultiselectIconButton } from "../../../../ui/EnterMultiselectIconButton"
import { DriveViewAttrs } from "../../drive/view/DriveView"
import { DriveSelectedItemsActions } from "../../drive/view/DriveFolderNav"
import { DriveFolderContent } from "../../drive/view/DriveFolderContent"
import { SortColumn } from "../../drive/view/DriveViewModel"

export interface DriveSearchViewAttrs extends TopLevelAttrs {
	header: AppHeaderAttrs
	makeViewModel: () => DriveSearchViewModel
	drawerAttrs: DrawerMenuAttrs
	showMoveItemDialog: (items: FolderItem[], moveItems: MoveItems) => unknown
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
						mobileHeader: () => this.renderMobileHeader(vnode.attrs.header, vnode.attrs.showMoveItemDialog),
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
			onTrash: !allItemsInTrash && selectedItems.length === 0 ? null : () => this.searchViewModel.moveToTrash(selectedItems.map(folderItemToId)),
			onDelete:
				this.searchViewModel.allItemsInTrash() && hasSelectedItems
					? async () => {
							this.deleteItems()
						}
					: null,
			onRestore: allItemsInTrash && hasSelectedItems ? () => this.searchViewModel.restoreFromTrash(selectedItems) : null,
			//FIXME
			onCut: null,
			onCopy: null,
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
	private renderMobileHeader(headerAttrs: AppHeaderAttrs, showMoveItemDialog: DriveViewAttrs["showMoveItemDialog"]): Children {
		const listState = this.searchViewModel.listState()
		const actions = this.selectedItemsActions(listState, showMoveItemDialog)
		const { onPaste } = actions

		if (listState.inMultiselect) {
			return m(MultiselectMobileHeader, {
				message: lang.getTranslation("itemsSelected_label", { "{number}": listState.selectedItems.size }),
				selected: listState.selectedItems.size === listState.items.length,
				selectAll: () => this.searchViewModel.toggleSelectAll(),
				selectNone: () => this.searchViewModel.selectNone(),
			})
		} else {
			return m(MobileHeader, {
				...headerAttrs,
				title: undefined,
				columnType: "first",
				actions: [
					m(DriveMobileSortButton, {
						currentSort: this.searchViewModel.getCurrentColumnSortOrder(),
						onSort: (property) => this.searchViewModel.sort(property),
					}),
					onPaste
						? m(IconButton, {
								title: "paste_action",
								icon: Icons.ClipboardFilled,
								click: () => onPaste(),
							})
						: null,
					m(EnterMultiselectIconButton, {
						clickAction: () => this.searchViewModel.enterMultiselect(),
					}),
				],
				primaryAction: () => null,
				backAction: () => this.searchViewModel.goToDriveView(),
				useBackButton: true,
			})
		}
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
				bottomNav: this.renderBottomNav(),
			}),
		)
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
		] //FIXME: more filter chips
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

	private renderBottomNav() {
		return undefined
	}

	private renderFolderView(listState: ListState<FolderItem>, showMoveItemDialog: any) {
		return null
		// return m(DriveFolderContent, {
		// 	selection: {
		// 		type: "multiselect",
		// 		selectedItemCount: listState.selectedItems.size,
		// 		selectedAll: listState.selectedItems.size === listState.items.length,
		// 	},
		// 	sortOrder: this.searchViewModel.getCurrentColumnSortOrder(),
		// 	fileActions: {
		// 		onCut:()=>{},
		// 		onCopy:()=>{},
		// 		onOpenItem:()=>{},
		// 		onDownload:()=>{},
		// 		onTrash:()=>{},
		// 		onRename:()=>{},
		// 		onRestore:()=>{},
		// 		onDelete:()=>{},
		// 		onStartMove:()=>{}
		// 	},
		// 	onSort:(column:SortColumn)=>this.searchViewModel.sort(column),
		// 	listState: listState,
		// 	selectionEvents:{
		// 		onSingleSelection: (item: FolderItem) => {},
		// 		onSingleExclusiveSelection: (item: FolderItem) => {},
		// 		onSingleInclusiveSelection: (item: FolderItem) => {},
		// 		onSelectPrevious: (item: FolderItem) => {},
		// 		onSelectNext: (item: FolderItem) => {},
		// 		onSelectAll: () => {},
		// 		onSelectNone: () => {},
		// 		onRangeSelectionTowards: (item: FolderItem) => {},
		// 	},
		// 	onDropInto:(f:FolderItem,event:DragEvent)=>{},
		// 	onEntryContextMenu
		// })
	}

	async deleteItems(item?: FolderItem) {
		const items = item ? [item] : Array.from(this.searchViewModel.listState().selectedItems)

		const ok = await Dialog.confirm(
			lang.getTranslation("confirmDeleteFilesPermanently_msg", { "{count}": items.length }),
			"confirmDeleteFilesPermanently_action",
		)
		if (ok) this.searchViewModel.deleteFromTrash(items)
	}
}
