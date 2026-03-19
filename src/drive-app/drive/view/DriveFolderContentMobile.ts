import m, { Children, Component, Vnode } from "mithril"
import { List, ListAttrs, ListState, MultiselectMode, RenderConfig, ViewHolder } from "../../../common/gui/base/List"
import { FolderItem } from "./DriveUtils"
import { SelectableRowContainer, SelectableRowSelectedSetter } from "../../../common/gui/SelectableRowContainer"
import { px } from "../../../common/gui/size"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { Icons, IconsSvg } from "../../../common/gui/base/icons/Icons"
import { theme } from "../../../common/gui/theme"
import { IconButton } from "../../../common/gui/base/IconButton"
import { attachDropdown } from "../../../common/gui/base/Dropdown"
import { formatDateTime } from "../../../common/misc/Formatter"
import { FileActions, iconPerMimeType } from "./DriveFolderContentEntry"
import { getContextActions } from "./DriveGuiUtils"
import { DriveFolderSelectionEvents } from "./DriveFolderContent"

export interface DriveFolderContentMobileAttrs {
	listState: ListState<FolderItem>
	fileActions: FileActions
	selectionEvents: DriveFolderSelectionEvents
}

export class DriveFolderContentMobile implements Component<DriveFolderContentMobileAttrs> {
	private fileActions: FileActions
	constructor({ attrs: { fileActions } }: Vnode<DriveFolderContentMobileAttrs>) {
		this.fileActions = fileActions
	}

	private readonly renderConfig: RenderConfig<FolderItem, DriveFolderItemRow> = {
		createElement: (dom: HTMLElement) => {
			const row = new DriveFolderItemRow(() => this.fileActions)
			m.render(dom, row.render())
			return row
		},
		itemHeight: ROW_HEIGHT_PX + 4, // 4 px gap between rows
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
	}

	view({ attrs: { listState, fileActions, selectionEvents } }: Vnode<DriveFolderContentMobileAttrs>): Children {
		this.fileActions = fileActions

		return m("", {}, [
			m(List, {
				state: listState,
				renderConfig: this.renderConfig,
				onLoadMore: () => {},
				onRetryLoading: () => {},
				onStopLoading: () => {},
				onSingleSelection: (item: FolderItem) => {
					if (listState.inMultiselect) {
						selectionEvents.onSingleSelection(item)
					} else {
						fileActions.onOpenItem(item)
					}
				},
				onRangeSelectionTowards: (item: FolderItem) => {
					selectionEvents.onRangeSelectionTowards(item)
				},
				onSingleTogglingMultiselection: (item: FolderItem) => {
					selectionEvents.onSingleInclusiveSelection(item)
				},
			} satisfies ListAttrs<FolderItem, DriveFolderItemRow>),
		])
	}
}

const ROW_HEIGHT_PX = 56

class DriveFolderItemRow implements ViewHolder<FolderItem> {
	private iconDom!: HTMLElement
	private filenameDom!: HTMLElement
	private dateDom!: HTMLElement
	private item: FolderItem | null = null
	private selectionSetter!: SelectableRowSelectedSetter

	constructor(private fileActions: () => FileActions) {}

	render(): Children {
		return m(
			SelectableRowContainer,
			{
				style: { height: px(ROW_HEIGHT_PX) },
				onSelectedChangeRef: (changer) => {
					this.selectionSetter = changer
				},
			},
			[
				m(".flex.flex-grow.items-center.pl-12.pr-12.gap-12.overflow-hidden", {}, [
					m(Icon, {
						icon: Icons.FolderFilled,
						size: IconSize.PX24,
						oncreate: (vnode) => {
							this.iconDom = vnode.dom as HTMLElement
						},
						style: {
							fill: theme.on_surface_variant,
							display: "block",
							margin: "4px auto",
						},
					}),
					m(".col.flex-grow.overflow-hidden", [
						m(".text-ellipsis", {
							oncreate: (vnode) => {
								this.filenameDom = vnode.dom as HTMLElement
							},
						}),
						m("", {
							style: { fontSize: "10px", color: theme.on_surface_variant },
							oncreate: (vnode) => {
								this.dateDom = vnode.dom as HTMLElement
							},
						}),
					]),
					m(
						IconButton,
						attachDropdown({
							mainButtonAttrs: {
								icon: Icons.More,
								title: "more_label",
							},
							childAttrs: () => {
								const { onCopy, onCut, onDelete, onOpenItem, onRename, onRestore, onStartMove, onTrash } = this.fileActions()
								if (this.item) {
									return getContextActions(this.item, onRename, onCopy, onCut, onRestore, onTrash, onStartMove, onDelete)
								} else {
									return []
								}
							},
						}),
					),
				]),
			],
		)
	}

	update(item: FolderItem, selected: boolean, multiselect: boolean) {
		this.item = item

		this.filenameDom.innerText = item.type === "file" ? item.file.name : item.folder.name
		const updatedDate = item.type === "file" ? item.file.updatedDate : item.folder.updatedDate
		this.dateDom.innerText = formatDateTime(updatedDate)
		const icon = item.type === "file" ? iconPerMimeType(item.file.mimeType) : Icons.FolderFilled
		// SAFETY: we only use our sanitized icons
		this.iconDom.innerHTML = IconsSvg[icon]
		this.selectionSetter(selected, multiselect)
	}
}
