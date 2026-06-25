import m, { Children, CommonAttributes, Component, Vnode } from "mithril"
import { DriveFolderContentEntry, DriveFolderContentEntryAttrs, FileActions } from "./DriveFolderContentEntry"
import { DriveSortArrow } from "./DriveSortArrow"
import { lang, Translation } from "../../../../ui/utils/LanguageViewModel"
import { component_size, px, size } from "../../../../ui/size"
import { ListState } from "../../../../ui/base/List"
import { getElementId, isSameId } from "../../../../platform-kit/meta"
import { DropType, renderDragElement } from "../../../../ui/base/GuiUtils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { FolderItem, folderItemEntity, FolderItemId, SortColumn, SortingPreference } from "./DriveUtils"
import { isKeyPressed } from "../../../../ui/utils/KeyManager"
import { DriveFolderContentMobile } from "./DriveFolderContentMobile"
import { isMobileDriveLayout } from "./DriveGuiUtils"
import { getDisplayType, getFileIcon } from "../model/DriveMimeUtils"
import { assertNotNull } from "../../../../platform-kit/utils"
import { wholeListSelected } from "../../../common/misc/ListModel"
import { ClipboardAction, DriveClipboard } from "../model/DriveModel"
import { ListItemSelectionCallbacks } from "../../../../ui/base/ListUtils"
import { SearchToken } from "../../../../ui/utils/QueryTokenUtils"
import { Keys } from "../../../../ui/utils/KeyboardKeys"

export interface DriveFolderContentAttrs {
	sortOrder: SortingPreference
	fileActions: FileActions
	onSort: (column: SortColumn) => unknown
	listState: ListState<FolderItem>
	selectionEvents: ListItemSelectionCallbacks<FolderItem>
	onDropInto: (f: FolderItem, event: DragEvent) => unknown
	onEntryContextMenu: (f: FolderItem, event: MouseEvent) => unknown
	clipboard: DriveClipboard | null
	displayLocation: boolean
	highlightedStrings?: readonly SearchToken[]
}

const columnStyle = {
	display: "flex",
	"align-items": "center",
	cursor: "pointer",
}

function renderHeaderCell(
	columnName: Translation,
	columnId: SortColumn,
	{ column, order }: SortingPreference,
	onSort: DriveFolderContentAttrs["onSort"],
): Children {
	return m(
		"button",
		{
			"data-testid": `btn:${columnName.testId}`,
			style: { ...columnStyle },
			onclick: () => {
				onSort(columnId)
			},
		},
		[
			columnName.text,
			m(DriveSortArrow, {
				sortOrder: columnId === column ? order : null,
			}),
		],
	)
}

function serializeDragItems(items: readonly FolderItemId[]): string {
	return JSON.stringify(items)
}

export class DriveFolderContent implements Component<DriveFolderContentAttrs> {
	private dragImageEl: Element | null = null
	private selectAllDom: HTMLElement | null = null
	/**
	 *  Keep track of whether we are actually focused in the table contents or outside of it.
	 *  When we are in the content tab key is overridden and focus tracks active element.
	 */
	private focusedInContent: boolean = false
	/** Whether the focus should track more button or the whole row (default) */
	private focusedOnMoreActions: boolean = false

	view({
		attrs: { sortOrder, onSort, fileActions, selectionEvents, listState, clipboard, onDropInto, onEntryContextMenu, displayLocation, highlightedStrings },
	}: Vnode<DriveFolderContentAttrs>): Children {
		return m(
			"div.flex.col.overflow-hidden.column-gap-12",
			{
				style: {
					display: "grid",
					"grid-template-columns": `calc(25px + 24px) 50px auto ${displayLocation ? "150px" : ""} 100px 100px 200px calc(44px + 12px)`,
				},
				onkeydown: (event: KeyboardEvent) => {
					if (this.focusedInContent && isKeyPressed(event.key, Keys.TAB) && event.shiftKey) {
						// if the focus is in the table content and the user presses Shift+Tab we drop focus on the
						// content and focus the checkbox in the table header.
						this.focusedInContent = false
						this.selectAllDom?.focus()
						// The table is often the last element on the page. Default behavior might focus browser
						// control outside of the page and we wouldn't be able to control the focus after that.
						// We prevent the browser from doing that.
						event.preventDefault()
					} else if (this.focusedInContent && isKeyPressed(event.key, Keys.TAB)) {
						// If the focus is in the table content Tab will drop the focus on the content.
						// In this case the browser will take care of selecting another element.
						this.focusedInContent = false
					} else if (!this.focusedInContent && isKeyPressed(event.key, Keys.TAB) && !event.shiftKey) {
						// If the focus is in the table header Tab will move the focus into content
						this.focusedInContent = true
						// Do not drop the focus to the browser
						event.preventDefault()
					} else if (this.focusedInContent && isKeyPressed(event.key, Keys.RIGHT)) {
						// Left and Right switch between focusing on the whole row and on the more button
						this.focusedOnMoreActions = true
					} else if (this.focusedOnMoreActions && isKeyPressed(event.key, Keys.LEFT)) {
						// Left and Right switch between focusing on the whole row and on the more button
						this.focusedOnMoreActions = false
					}
				},
			},
			isMobileDriveLayout()
				? m(DriveFolderContentMobile, {
						listState,
						fileActions,
						selectionEvents,
					})
				: [
						this.renderHeader(listState, sortOrder, onSort, selectionEvents.selectAll, selectionEvents.selectNone, displayLocation),

						m(
							".flex.col.scroll.scrollbar-gutter-stable-or-fallback",
							{
								role: "grid",
								"data-testid": "grid:folderContent",
								style: {
									"grid-column-start": "1",
									"grid-column-end": displayLocation ? "9" : "8",
									display: "grid",
									"grid-template-columns": "subgrid",
								},
							},
							listState.items.map((item, index) =>
								m(DriveFolderContentEntry, {
									key: getElementId(folderItemEntity(item)),
									item: item,
									selected: listState.selectedItems.has(item),
									onSingleSelection: selectionEvents.onSingleSelection,
									onRangeSelectionTowards: selectionEvents.onRangeSelectionTowards,
									onSingleInclusiveSelection: selectionEvents.onSingleInclusiveSelection,
									onSingleExclusiveSelection: selectionEvents.onSingleExclusiveSelection,
									checked: listState.inMultiselect && listState.selectedItems.has(item),
									multiselect: listState.inMultiselect,
									isCut:
										clipboard != null &&
										clipboard.action === ClipboardAction.Cut &&
										clipboard.items.some((clipboardItem) => isSameId(clipboardItem.id, folderItemEntity(item)._id)),
									fileActions,
									onDomUpdated: (dom, moreActionsDom) => {
										// While we are focused on the content we forcefully focus on the element for the active
										// index on every redraw. We do it every time in case the list structure changes.
										// It is not possible to tab through the table rows, users must use up-down keys.
										if (this.focusedInContent && (index === listState.activeIndex || (listState.activeIndex == null && index === 0))) {
											if (!this.focusedOnMoreActions) {
												dom.focus()
											} else {
												moreActionsDom.focus()
											}
										}
									},
									onDragStart: (item, event) => {
										const itemsToDrag = listState.selectedItems.has(item) ? Array.from(listState.selectedItems) : [item]

										// provide the element that will be displayed as a dragged item
										// it has to be in the DOM
										const name = item.type === "folder" ? item.folder.name : item.file.name
										const icon: Icons =
											item.type === "folder" ? Icons.FolderFilled : getFileIcon(assertNotNull(getDisplayType(item.file.mimeType)))
										const el = renderDragElement(name, icon, itemsToDrag.length)
										event.dataTransfer?.setDragImage(el, 10, 10)
										this.dragImageEl = el

										const dragItems: FolderItemId[] = itemsToDrag.map((item) => {
											return {
												type: item.type,
												id: folderItemEntity(item)._id,
											}
										})
										event.dataTransfer?.setData(DropType.DriveItems, serializeDragItems(dragItems))
									},
									onDragEnd: () => {
										if (this.dragImageEl) {
											this.dragImageEl.remove()
											this.dragImageEl = null
										}
									},
									onDropInto,
									onContextMenu: onEntryContextMenu,
									displayLocation,
									highlightedStrings,
								} satisfies DriveFolderContentEntryAttrs & CommonAttributes<DriveFolderContentEntryAttrs, DriveFolderContentEntry>),
							),
						),
					],
		)
	}

	private renderHeader(
		listState: ListState<unknown>,
		sortOrder: SortingPreference,
		onSort: (column: SortColumn) => unknown,
		onSelectAll: () => unknown,
		onSelectNone: () => unknown,
		displayLocation: boolean,
	) {
		return m(
			"div.flex.row.folder-row",
			{
				style: {
					padding: `${size.core_8}px ${size.core_16}px ${size.core_8}px ${size.core_24}px`,
					// ensure that the bar does not shrink too much if we have only text
					minHeight: px(component_size.button_height + 2 * size.core_8),
					"grid-column-start": "1",
					"grid-column-end": displayLocation ? "9" : "8",
					display: "grid",
					"grid-template-columns": "subgrid",
				},
				onclick: (e: MouseEvent) => {
					e.stopPropagation()
				},
			},
			[
				m(
					"div",
					{ style: { ...columnStyle } },
					m("input.checkbox", {
						type: "checkbox",
						"data-testid": "cb:selectAllLoaded_action",
						title: lang.getTranslationText("selectAllLoaded_action"),
						checked: wholeListSelected(listState),
						onchange: wholeListSelected(listState) ? onSelectNone : onSelectAll,
						oncreate: ({ dom }) => {
							this.selectAllDom = dom as HTMLElement
						},
					}),
				),
				listState.inMultiselect
					? [m(""), m(".b", lang.getTranslation("itemsSelected_label", { "{number}": listState.selectedItems.size }).text)]
					: [
							m("div", { style: { ...columnStyle } }, []),
							renderHeaderCell(lang.getTranslation("name_label"), SortColumn.name, sortOrder, onSort),
							displayLocation ? renderHeaderCell(lang.getTranslation("location_label"), SortColumn.location, sortOrder, onSort) : null,
							renderHeaderCell(lang.getTranslation("type_label"), SortColumn.mimeType, sortOrder, onSort),
							renderHeaderCell(lang.getTranslation("size_label"), SortColumn.size, sortOrder, onSort),
							renderHeaderCell(lang.getTranslation("date_label"), SortColumn.date, sortOrder, onSort),
							m("div", { style: { ...columnStyle, width: px(component_size.button_height) } }, null),
						],
			],
		)
	}
}
