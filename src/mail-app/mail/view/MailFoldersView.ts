import m, { Child, Children, Component, Vnode } from "mithril"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { SidebarSection } from "../../../common/gui/SidebarSection.js"
import { IconButton, IconButtonAttrs } from "../../../common/gui/base/IconButton.js"
import { FolderSubtree, FolderSystem } from "../../../common/api/common/mail/FolderSystem.js"
import { elementIdPart, getElementId } from "../../../common/api/common/utils/EntityUtils.js"
import { isSelectedPrefix, NavButtonAttrs, NavButtonColor } from "../../../common/gui/base/NavButton.js"
import { MAIL_PREFIX } from "../../../common/misc/RouteChange.js"
import { MailFolderRow } from "./MailFolderRow.js"
import { assertNotNull, last, noOp, Thunk } from "@tutao/tutanota-utils"
import { MailFolder } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { attachDropdown, DropdownButtonAttrs } from "../../../common/gui/base/Dropdown.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { ButtonColor } from "../../../common/gui/base/Button.js"
import { ButtonSize } from "../../../common/gui/base/ButtonSize.js"
import { MailSetKind } from "../../../common/api/common/TutanotaConstants.js"
import { px, size } from "../../../common/gui/size.js"
import { RowButton } from "../../../common/gui/base/buttons/RowButton.js"
import { MailModel } from "../model/MailModel.js"
import { getFolderName, MAX_FOLDER_INDENT_LEVEL } from "../model/MailUtils.js"
import { getFolderIcon } from "./MailGuiUtils.js"
import { isSpamOrTrashFolder } from "../model/MailChecks.js"

export interface MailFolderViewAttrs {
	mailModel: MailModel
	mailboxDetail: MailboxDetail
	mailFolderElementIdToSelectedMailId: ReadonlyMap<Id, Id>
	onFolderClick: (folder: MailFolder) => unknown
	onFolderDrop: (mailId: string, folder: MailFolder) => unknown
	expandedFolders: ReadonlySet<Id>
	onFolderExpanded: (folder: MailFolder, state: boolean) => unknown
	onShowFolderAddEditDialog: (mailGroupId: Id, folder: MailFolder | null, parentFolder: MailFolder | null) => unknown
	onDeleteCustomMailFolder: (folder: MailFolder) => unknown
	inEditMode: boolean
	onEditMailbox: () => unknown
}

type Counters = Record<string, number>

/** Displays a tree of all folders. */
export class MailFoldersView implements Component<MailFolderViewAttrs> {
	// Contains the id of the visible row
	private visibleRow: string | null = null

	view({ attrs }: Vnode<MailFolderViewAttrs>): Children {
		const { mailboxDetail, mailModel } = attrs
		const groupCounters = mailModel.mailboxCounters()[mailboxDetail.mailGroup._id] || {}
		const folders = mailModel.getMailboxFoldersForId(assertNotNull(mailboxDetail.mailbox.folders)._id)
		// Important: this array is keyed so each item must have a key and `null` cannot be in the array
		// So instead we push or not push into array
		const customSystems = folders.customSubtrees
		const systemSystems = folders.systemSubtrees
		const children: Children = []
		const selectedFolder = folders
			.getIndentedList()
			.map((f) => f.folder)
			.find((f) => isSelectedPrefix(MAIL_PREFIX + "/" + getElementId(f)))
		const path = selectedFolder ? folders.getPathToFolder(selectedFolder._id) : []
		const isInternalUser = locator.logins.isInternalUserLoggedIn()
		const systemChildren = this.renderFolderTree(systemSystems, groupCounters, folders, attrs, path, isInternalUser)
		if (systemChildren) {
			children.push(...systemChildren.children)
		}
		if (isInternalUser) {
			children.push(
				m(
					SidebarSection,
					{
						name: "yourFolders_action",
						button: attrs.inEditMode ? this.renderCreateFolderAddButton(null, attrs) : this.renderEditFoldersButton(attrs),
						key: "yourFolders", // we need to set a key because folder rows also have a key.
					},
					this.renderFolderTree(customSystems, groupCounters, folders, attrs, path, isInternalUser).children,
				),
			)
			children.push(this.renderAddFolderButtonRow(attrs))
		}
		return children
	}

	private renderFolderTree(
		subSystems: readonly FolderSubtree[],
		groupCounters: Counters,
		folders: FolderSystem,
		attrs: MailFolderViewAttrs,
		path: MailFolder[],
		isInternalUser: boolean,
		indentationLevel: number = 0,
	): { children: Children[]; numRows: number } {
		// we need to keep track of how many rows we've drawn so far for this subtree so that we can draw hierarchy lines correctly
		const result: { children: Children[]; numRows: number } = { children: [], numRows: 0 }
		for (let system of subSystems) {
			const id = getElementId(system.folder)
			const button: NavButtonAttrs = {
				label: () => getFolderName(system.folder),
				href: () => {
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
				},
				isSelectedPrefix: attrs.inEditMode ? false : MAIL_PREFIX + "/" + getElementId(system.folder),
				colors: NavButtonColor.Nav,
				click: () => attrs.onFolderClick(system.folder),
				dropHandler: (droppedMailId) => attrs.onFolderDrop(droppedMailId, system.folder),
				disableHoverBackground: true,
				disabled: attrs.inEditMode,
			}
			const currentExpansionState = attrs.inEditMode ? true : attrs.expandedFolders.has(getElementId(system.folder)) ?? false //default is false
			const hasChildren = system.children.length > 0
			const counterId = system.folder.isMailSet ? getElementId(system.folder) : system.folder.mails
			const summedCount = !currentExpansionState && hasChildren ? this.getTotalFolderCounter(groupCounters, system) : groupCounters[counterId]
			const childResult =
				hasChildren && currentExpansionState
					? this.renderFolderTree(system.children, groupCounters, folders, attrs, path, isInternalUser, indentationLevel + 1)
					: { children: null, numRows: 0 }
			const isTrashOrSpam = system.folder.folderType === MailSetKind.TRASH || system.folder.folderType === MailSetKind.SPAM
			const isRightButtonVisible = this.visibleRow === id
			const rightButton =
				isInternalUser && !isTrashOrSpam && (isRightButtonVisible || attrs.inEditMode)
					? this.createFolderMoreButton(system.folder, folders, attrs, () => {
							this.visibleRow = null
					  })
					: null
			const render = m.fragment(
				{
					key: id,
				},
				[
					m(MailFolderRow, {
						count: attrs.inEditMode ? 0 : summedCount,
						button,
						icon: getFolderIcon(system.folder),
						rightButton,
						expanded: hasChildren ? currentExpansionState : null,
						indentationLevel: Math.min(indentationLevel, MAX_FOLDER_INDENT_LEVEL),
						onExpanderClick: hasChildren ? () => attrs.onFolderExpanded(system.folder, currentExpansionState) : noOp,
						hasChildren,
						onSelectedPath: path.includes(system.folder),
						numberOfPreviousRows: result.numRows,
						isLastSibling: last(subSystems) === system,
						editMode: attrs.inEditMode,
						onHover: () => {
							this.visibleRow = id
						},
					}),
					childResult.children,
				],
			)
			result.numRows += childResult.numRows + 1
			result.children.push(render)
		}
		return result
	}

	private renderAddFolderButtonRow(attrs: MailFolderViewAttrs): Child {
		// This button needs to fill the whole row, but is not a navigation button (so IconButton or NavButton weren't appropriate)
		return m(RowButton, {
			label: "addFolder_action",
			key: "addFolder",
			icon: Icons.Add,
			class: "folder-row mlr-button border-radius-small",
			style: {
				width: `calc(100% - ${px(size.hpad_button * 2)})`,
			},
			onclick: () => {
				attrs.onShowFolderAddEditDialog(attrs.mailboxDetail.mailGroup._id, null, null)
			},
		})
	}

	private getTotalFolderCounter(counters: Counters, system: FolderSubtree): number {
		const counterId = system.folder.isMailSet ? getElementId(system.folder) : system.folder.mails
		return (counters[counterId] ?? 0) + system.children.reduce((acc, child) => acc + this.getTotalFolderCounter(counters, child), 0)
	}

	private createFolderMoreButton(folder: MailFolder, folders: FolderSystem, attrs: MailFolderViewAttrs, onClose: Thunk): IconButtonAttrs {
		return attachDropdown({
			mainButtonAttrs: {
				title: "more_label",
				icon: Icons.More,
				colors: ButtonColor.Nav,
				size: ButtonSize.Compact,
			},
			childAttrs: () => {
				return folder.folderType === MailSetKind.CUSTOM
					? // cannot add new folder to custom folder in spam or trash folder
					  isSpamOrTrashFolder(folders, folder)
						? [this.editButtonAttrs(attrs, folders, folder), this.deleteButtonAttrs(attrs, folder)]
						: [this.editButtonAttrs(attrs, folders, folder), this.addButtonAttrs(attrs, folder), this.deleteButtonAttrs(attrs, folder)]
					: [this.addButtonAttrs(attrs, folder)]
			},
			onClose,
		})
	}

	private deleteButtonAttrs(attrs: MailFolderViewAttrs, folder: MailFolder): DropdownButtonAttrs {
		return {
			label: "delete_action",
			icon: Icons.Trash,
			click: () => {
				attrs.onDeleteCustomMailFolder(folder)
			},
		}
	}

	private addButtonAttrs(attrs: MailFolderViewAttrs, folder: MailFolder): DropdownButtonAttrs {
		return {
			label: "addFolder_action",
			icon: Icons.Add,
			click: () => {
				attrs.onShowFolderAddEditDialog(attrs.mailboxDetail.mailGroup._id, null, folder)
			},
		}
	}

	private editButtonAttrs(attrs: MailFolderViewAttrs, folders: FolderSystem, folder: MailFolder): DropdownButtonAttrs {
		return {
			label: "edit_action",
			icon: Icons.Edit,
			click: () => {
				attrs.onShowFolderAddEditDialog(
					attrs.mailboxDetail.mailGroup._id,
					folder,
					folder.parentFolder ? folders.getFolderById(elementIdPart(folder.parentFolder)) : null,
				)
			},
		}
	}

	private renderCreateFolderAddButton(parentFolder: MailFolder | null, attrs: MailFolderViewAttrs): Child {
		return m(IconButton, {
			title: "addFolder_action",
			click: () => {
				return attrs.onShowFolderAddEditDialog(attrs.mailboxDetail.mailGroup._id, null, parentFolder)
			},
			icon: Icons.Add,
			size: ButtonSize.Compact,
		})
	}

	private renderEditFoldersButton(attrs: MailFolderViewAttrs): Child {
		return m(IconButton, {
			title: "edit_action",
			click: () => attrs.onEditMailbox(),
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		})
	}
}
