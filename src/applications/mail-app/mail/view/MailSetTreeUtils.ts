import { FolderSubtree, FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { MailSet } from "@tutao/entities/tutanota"
import m, { Children } from "mithril"
import { getElementId } from "@tutao/meta"
import { MAIL_PREFIX } from "../../../../ui/utils/RouteChange"
import { NavButtonAttrs, NavButtonColor } from "../../../../ui/base/NavButton"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { canHaveDescendents, isEditableMailSet, isNestableMailSet } from "../MailUtils"
import { theme } from "../../../../ui/theme"
import { DropData, DropType, renderDragElement } from "../../../../ui/base/GuiUtils"
import { MailSetRow } from "./MailSetRow"
import { getFolderName, MAX_FOLDER_INDENT_LEVEL } from "../model/MailUtils"
import { last, noOp, Nullable, Thunk } from "@tutao/utils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { IconAttrs } from "../../../../ui/base/Icon"
import { IconButtonAttrs } from "../../../../ui/base/IconButton"
import { attachDropdown, DropdownButtonAttrs } from "../../../../ui/base/Dropdown"
import { ButtonColor } from "../../../../ui/base/Button"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { getSafeAreaInsetBottom, getSafeAreaInsetTop } from "../../../../ui/HtmlUtils"
import { size } from "../../../../ui/size"
import { MailSetKind } from "../../../../entities/tutanota/Utils"
import { isSpamOrTrashFolder } from "../model/MailChecks"
import { Group } from "@tutao/entities/sys"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel"

type Counters = Record<string, number>

type MailSetTreeDeleteButtonAttrs = (actionAttrs: MailSetTreeActionAttrs, mailGroupId: Group["_id"], mailSet: MailSet) => DropdownButtonAttrs
type MailSetTreeAddButtonAttrs = (actionAttrs: MailSetTreeActionAttrs, mailGroupId: Group["_id"], mailSet: MailSet) => DropdownButtonAttrs
type MailSetTreeEditButtonAttrs = (
	actionAttrs: MailSetTreeActionAttrs,
	mailGroupId: Group["_id"],
	folderSystem: FolderSystem,
	mailSet: MailSet,
) => DropdownButtonAttrs

export interface MailSetTreeActionAttrs {
	onShowFolderAddEditDialog: (mailGroupId: Id, folder: MailSet | null, parentFolder: MailSet | null) => unknown
	onDeleteCustomMailLabel: (folder: MailSet) => unknown
}

export type MailSetTreeButtonAttrs = {
	delete: MailSetTreeDeleteButtonAttrs
	add: MailSetTreeAddButtonAttrs
	edit: MailSetTreeEditButtonAttrs
}
export enum FolderSystemKind {
	System,
	Custom,
	Orphan,
	Label,
}

export interface MailSetTreeAttrs {
	mailboxDetail: MailboxDetail
	mailFolderElementIdToSelectedMailId: ReadonlyMap<Id, Id>
	onFolderClick: (folder: MailSet) => unknown
	onFolderDrop: (dropData: DropData, folder: MailSet) => unknown
	expandedFolders: ReadonlySet<Id>
	onFolderExpanded: (folder: MailSet, state: boolean) => unknown
	inEditMode: boolean
	buttonAttrs: MailSetTreeButtonAttrs
	actionAttrs: MailSetTreeActionAttrs
	getIconForMailSet: (mailSet: MailSet, button: Nullable<NavButtonAttrs>) => IconAttrs
	getFolderName(system: FolderSubtree): string
}

/**
 * Get a full path to a folder with colons in between,
 * Used for data-testids
 */
function getPathToFolderAsString(folderSystem: FolderSystem, currentFolder: MailSet): string {
	return folderSystem
		.getPathToFolder(currentFolder._id)
		.map((f) => getFolderName(f))
		.join(":")
}

function getTotalFolderCounter(counters: Counters, system: FolderSubtree): number {
	const counterId = getElementId(system.folder)
	return (counters[counterId] ?? 0) + system.children.reduce((acc, child) => acc + getTotalFolderCounter(counters, child), 0)
}

function createFolderMoreButton(
	folder: MailSet,
	folders: FolderSystem,
	mailGroup: Group,
	onClose: Thunk,
	buttonAttrs: MailSetTreeButtonAttrs,
	actionAttrs: MailSetTreeActionAttrs,
	folderSystemKind: FolderSystemKind,
): IconButtonAttrs {
	return attachDropdown({
		mainButtonAttrs: {
			title: "more_label",
			icon: Icons.More,
			colors: ButtonColor.Nav,
			size: ButtonSize.Compact,
		},
		overrideOrigin: (original: DOMRect) => {
			// the upper/lower Space check is the same as used in showDropdown to determine where the dropdown is shown
			const upperSpace = original.top - getSafeAreaInsetTop()
			const lowerSpace = window.innerHeight - original.bottom - getSafeAreaInsetBottom()
			// Shift the dropdown up by the icon size to hide the fact that the more button disappears after being clicked on
			if (lowerSpace < upperSpace) {
				return new DOMRect(original.x, original.y + size.icon_24, original.width, original.height)
			} else {
				return new DOMRect(original.x, original.y - size.icon_24, original.width, original.height)
			}
		},
		childAttrs: async () => {
			return folder.folderType === MailSetKind.CUSTOM || folder.folderType === MailSetKind.LABEL
				? // cannot add new folder to custom folder in spam, trash, or orphan folder tree
					folderSystemKind === FolderSystemKind.Orphan || isSpamOrTrashFolder(folders, folder)
					? [buttonAttrs.edit(actionAttrs, mailGroup._id, folders, folder), buttonAttrs.delete(actionAttrs, mailGroup._id, folder)]
					: [
							buttonAttrs.edit(actionAttrs, mailGroup._id, folders, folder),
							buttonAttrs.add(actionAttrs, mailGroup._id, folder),
							buttonAttrs.delete(actionAttrs, mailGroup._id, folder),
						]
				: [buttonAttrs.add(actionAttrs, mailGroup._id, folder)]
		},
		onClose,
	})
}

export function renderFolderTree(
	subSystems: readonly FolderSubtree[],
	folderSystemKind: FolderSystemKind,
	groupCounters: Counters,
	folders: FolderSystem,
	attrs: MailSetTreeAttrs,
	path: MailSet[],
	isInternalUser: boolean,
	rowContainer: { visibleRow: string | null },
	indentationLevel: number = 0,
): { children: Children[]; numRows: number } {
	// we need to keep track of how many rows we've drawn so far for this subtree so that we can draw hierarchy lines correctly
	const result: { children: Children[]; numRows: number } = { children: [], numRows: 0 }
	for (let system of subSystems) {
		const id = getElementId(system.folder)
		const folderName = attrs.getFolderName(system) //system.folder.name
		const fullFolderPath = getPathToFolderAsString(folders, system.folder)
		const href = () => {
			if (attrs.inEditMode) {
				return m.route.get()
			} else {
				const folderElementId = getElementId(system.folder)
				const mailId = attrs.mailFolderElementIdToSelectedMailId.get(folderElementId)
				if (mailId) {
					return `${MAIL_PREFIX}/${folderElementId}/${mailId}`
				} else {
					return `${MAIL_PREFIX}/${folderElementId}`
				}
			}
		}
		const button: NavButtonAttrs = {
			label: lang.makeTranslation(`folder:${fullFolderPath}`, folderName),
			href,
			isSelectedPrefix: attrs.inEditMode ? false : MAIL_PREFIX + "/" + getElementId(system.folder),
			colors: NavButtonColor.Nav,
			click: () => attrs.onFolderClick(system.folder),
			dropHandler: folderSystemKind === FolderSystemKind.Orphan ? noOp : (dropData) => attrs.onFolderDrop(dropData, system.folder),
			disableHoverBackground: true,
			disabled: attrs.inEditMode,
			dragStartHandler: isNestableMailSet(system.folder)
				? (e: DragEvent) => {
						const domElement = e.target as HTMLElement | null
						// The quick change of the background color is to prevent a white background appearing in dark mode
						if (domElement) domElement.style.background = theme.surface_container
						requestAnimationFrame(() => {
							if (domElement) domElement.style.background = ""
						})
						const icon = attrs.getIconForMailSet(system.folder, null).icon
						const el = renderDragElement(system.folder.name, icon, 0)
						e.dataTransfer?.setDragImage(el, 10, 10)
						e.dataTransfer?.setData(DropType.Folder, getElementId(system.folder))
					}
				: undefined,
		}
		const currentExpansionState = attrs.inEditMode ? true : (attrs.expandedFolders.has(getElementId(system.folder)) ?? false) //default is false
		const hasChildren = system.children.length > 0
		const counterId = getElementId(system.folder)
		const summedCount = !currentExpansionState && hasChildren ? getTotalFolderCounter(groupCounters, system) : groupCounters[counterId]
		const childResult =
			hasChildren && currentExpansionState
				? renderFolderTree(system.children, folderSystemKind, groupCounters, folders, attrs, path, isInternalUser, rowContainer, indentationLevel + 1)
				: { children: null, numRows: 0 }
		const isRightButtonVisible = rowContainer.visibleRow === id
		const rightButton =
			isInternalUser && (isEditableMailSet(system.folder) || canHaveDescendents(system.folder)) && (isRightButtonVisible || attrs.inEditMode)
				? createFolderMoreButton(
						system.folder,
						folders,
						attrs.mailboxDetail.mailGroup,
						() => {
							rowContainer.visibleRow = null
						},
						attrs.buttonAttrs,
						attrs.actionAttrs,
						folderSystemKind,
					)
				: null
		const render = m.fragment(
			{
				key: id,
			},
			[
				m(MailSetRow, {
					count: attrs.inEditMode ? 0 : summedCount,
					button,
					mailSet: system.folder,
					rightButton,
					expanded: hasChildren ? currentExpansionState : null,
					indentationLevel: Math.min(indentationLevel, MAX_FOLDER_INDENT_LEVEL),
					onExpanderClick: hasChildren
						? () => attrs.onFolderExpanded(system.folder, currentExpansionState)
						: (event: Event) => {
								event.preventDefault()
								attrs.onFolderClick(system.folder)
								m.route.set(href())
							},
					hasChildren,
					onSelectedPath: path.includes(system.folder),
					numberOfPreviousRows: result.numRows,
					isLastSibling: last(subSystems) === system,
					editMode: attrs.inEditMode,
					onHover: () => {
						rowContainer.visibleRow = id
					},
					onDragEnter: () => {
						if (hasChildren && !currentExpansionState) {
							attrs.onFolderExpanded(system.folder, currentExpansionState)
						}
					},
					fullFolderPath: fullFolderPath,
					getIconForMailSet: attrs.getIconForMailSet,
				}),
				childResult.children,
			],
		)
		result.numRows += childResult.numRows + 1
		result.children.push(render)
	}
	return result
}
