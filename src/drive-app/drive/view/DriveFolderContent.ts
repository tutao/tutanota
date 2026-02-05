import m, { Children, Component, Vnode } from "mithril"
import { ClipboardAction, DriveClipboard, SortColumn, SortingPreference } from "./DriveViewModel"
import { DriveFolderContentEntry, DriveFolderContentEntryAttrs, FileActions, iconPerMimeType } from "./DriveFolderContentEntry"
import { DriveSortArrow } from "./DriveSortArrow"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { component_size, font_size, px, size } from "../../../common/gui/size"
import { ListState } from "../../../common/gui/base/List"
import { getElementId, isSameId } from "../../../common/api/common/utils/EntityUtils"
import { DropType } from "../../../common/gui/base/GuiUtils"
import { theme } from "../../../common/gui/theme"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { FolderItem, folderItemEntity, FolderItemId } from "./DriveUtils"

export type SelectionState = { type: "multiselect"; selectedItemCount: number; selectedAll: boolean } | { type: "none" }

export interface DriveFolderSelectionEvents {
	onSingleSelection: (item: FolderItem) => unknown
	onSingleExclusiveSelection: (item: FolderItem) => unknown
	onSingleInclusiveSelection: (item: FolderItem) => unknown
	onSelectPrevious: (item: FolderItem) => unknown
	onSelectNext: (item: FolderItem) => unknown
	onSelectAll: () => unknown
	onRangeSelectionTowards: (item: FolderItem) => unknown
}

export interface DriveFolderContentAttrs {
	selection: SelectionState
	sortOrder: SortingPreference
	fileActions: FileActions
	onSort: (column: SortColumn) => unknown
	listState: ListState<FolderItem>
	selectionEvents: DriveFolderSelectionEvents
	onDropInto: (f: FolderItem, event: DragEvent) => unknown
	clipboard: DriveClipboard | null
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

	view({
		attrs: { selection, sortOrder, onSort, fileActions, selectionEvents, listState, clipboard, onDropInto },
	}: Vnode<DriveFolderContentAttrs>): Children {
		return m(
			"div.flex.col.overflow-hidden.column-gap-12",
			{
				style: {
					display: "grid",
					"grid-template-columns": "calc(25px + 24px) 50px auto 100px 100px 300px calc(44px + 12px)",
				},
			},
			[
				this.renderHeader(selection, sortOrder, onSort, selectionEvents.onSelectAll),

				m(
					".flex.col.scroll.scrollbar-gutter-stable-or-fallback",
					{
						role: "grid",
						"data-testid": "grid:folderContent",
						style: {
							"grid-column-start": "1",
							"grid-column-end": "8",
							display: "grid",
							"grid-template-columns": "subgrid",
						},
					},
					listState.items.map((item) =>
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
							onDragStart: (item, event) => {
								const itemsToDrag = listState.selectedItems.has(item) ? Array.from(listState.selectedItems) : [item]

								// provide the element that will be displayed as a dragged item
								// it has to be in the DOM
								const el = this.renderDragElement(item, itemsToDrag.length)
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
						} satisfies DriveFolderContentEntryAttrs & { key: string }),
					),
				),
			],
		)
	}

	private renderDragElement(item: FolderItem, count: number) {
		const el = document.createElement("div")
		document.body.append(el)
		// TODO: Use theme as soon as we agreed on it.
		const boxShadow = `#D5D5D5 1px 1px 1px`
		m.render(
			el,
			m(
				".rel",
				{
					style: {
						// give some padding so we have the space to put the stack card and counter outside of the
						// primary card
						padding: px(size.spacing_8),
						width: "200px",
						// drag image element has to be in the DOM but we don't want it to be visible, shift it out of
						// the view
						translate: "-100%",
					},
				},
				[
					// when multiple elements are dragged render another card behind to create a "stack"
					// it is offset almost to the edge of the container
					count > 1
						? m(".abs.border-radius-12", {
								style: {
									// TODO: Use theme as soon as we agreed on it.
									background: "#EAEAEA",
									width: `calc(100% - ${size.spacing_8}px * 2)`,
									height: `calc(100% - ${size.spacing_8}px * 2)`,
									right: px(size.spacing_8 / 2),
									bottom: px(size.spacing_8 / 2),
									boxShadow,
								},
							})
						: null,
					m(
						".flex.items-center.overflow-hidden.border-radius-12.rel",
						{
							style: {
								color: theme.on_surface,
								padding: `${size.spacing_16}px ${size.spacing_8}px`,
								background: theme.surface,
								boxShadow,
							},
						},
						m(Icon, {
							icon: item.type === "folder" ? Icons.Folder : iconPerMimeType(item.file.mimeType),
							size: IconSize.PX24,
							style: {
								fill: theme.on_surface,
								display: "block",
								margin: `0 ${size.core_8}px`,
							},
						}),
						m(".text-ellipsis", item.type === "folder" ? item.folder.name : item.file.name),
					),
					// render counter in the corner
					count > 1
						? m(
								".abs.small.text-center",
								{
									style: {
										top: 0,
										right: 0,
										backgroundColor: theme.primary,
										color: theme.on_primary,
										aspectRatio: "1 / 1",
										borderRadius: "100%",
										padding: px(size.base_4),
										lineHeight: px(font_size.small),
										height: `calc(1em + ${size.base_4}px * 2)`,
									},
								},
								count,
							)
						: null,
				],
			),
		)
		return el
	}

	private renderHeader(selection: SelectionState, sortOrder: SortingPreference, onSort: (column: SortColumn) => unknown, onSelectAll: () => unknown) {
		return m(
			"div.flex.row.folder-row",
			{
				style: {
					padding: `${size.core_8}px ${size.core_16}px ${size.core_8}px ${size.core_24}px`,
					// ensure that the bar does not shrink too much if we have only text
					minHeight: px(component_size.button_height + 2 * size.core_8),
					"grid-column-start": "1",
					"grid-column-end": "8",
					display: "grid",
					"grid-template-columns": "subgrid",
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
						checked: selection.type === "multiselect" && selection.selectedAll,
						onchange: onSelectAll,
					}),
				),
				selection.type === "multiselect"
					? [m(""), m(".b", lang.getTranslation("itemsSelected_label", { "{number}": selection.selectedItemCount }).text)]
					: [
							m("div", { style: { ...columnStyle } }, []),
							renderHeaderCell(lang.getTranslation("name_label"), SortColumn.name, sortOrder, onSort),
							renderHeaderCell(lang.getTranslation("type_label"), SortColumn.mimeType, sortOrder, onSort),
							renderHeaderCell(lang.getTranslation("size_label"), SortColumn.size, sortOrder, onSort),
							renderHeaderCell(lang.getTranslation("date_label"), SortColumn.date, sortOrder, onSort),
							m("div", { style: { ...columnStyle, width: px(component_size.button_height) } }, null),
						],
			],
		)
	}
}
