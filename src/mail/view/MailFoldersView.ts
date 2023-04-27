import m, { Child, Children, Component, Vnode } from "mithril"
import { MailboxDetail } from "../model/MailModel.js"
import { locator } from "../../api/main/MainLocator.js"
import { SidebarSection } from "../../gui/SidebarSection.js"
import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton.js"
import { FolderSubtree } from "../../api/common/mail/FolderSystem.js"
import { getElementId } from "../../api/common/utils/EntityUtils.js"
import { isSelectedPrefix, NavButtonAttrs, NavButtonColor } from "../../gui/base/NavButton.js"
import { getFolderIcon, getFolderName, MAX_FOLDER_INDENT_LEVEL } from "../model/MailUtils.js"
import { MAIL_PREFIX } from "../../misc/RouteChange.js"
import { MailFolderRow } from "./MailFolderRow.js"
import { last, noOp } from "@tutao/tutanota-utils"
import { MailFolder } from "../../api/entities/tutanota/TypeRefs.js"
import { attachDropdown, DropdownButtonAttrs } from "../../gui/base/Dropdown.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { ButtonColor } from "../../gui/base/Button.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { MailFolderType } from "../../api/common/TutanotaConstants.js"
import { isSpamOrTrashFolder } from "../../api/common/mail/CommonMailUtils.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { Icon } from "../../gui/base/Icon.js"
import { theme } from "../../gui/theme.js"

export interface MailFolderViewAttrs {
	mailboxDetail: MailboxDetail
	folderToUrl: Readonly<Record<Id, string>>
	onFolderClick: (folder: MailFolder) => unknown
	onFolderDrop: (mailId: string, folder: MailFolder) => unknown
	expandedFolders: ReadonlySet<Id>
	onFolderExpanded: (folder: MailFolder, state: boolean) => unknown
	onShowFolderAddEditDialog: (mailGroupId: Id, folder: MailFolder | null, parentFolder: MailFolder | null) => unknown
	onDeleteCustomMailFolder: (folder: MailFolder) => unknown
	inEditMode: boolean
	onEditMailbox: () => unknown
	onEditingDone: () => unknown
}

type Counters = Record<string, number>

/** Displays a tree of all folders. */
export class MailFoldersView implements Component<MailFolderViewAttrs> {
	view({ attrs }: Vnode<MailFolderViewAttrs>): Children {
		const { mailboxDetail } = attrs
		const groupCounters = locator.mailModel.mailboxCounters()[mailboxDetail.mailGroup._id] || {}
		// Important: this array is keyed so each item must have a key and `null` cannot be in the array
		// So instead we push or not push into array
		const customSystems = mailboxDetail.folders.customSubtrees
		const systemSystems = mailboxDetail.folders.systemSubtrees
		const children: Children = []
		const selectedFolder = mailboxDetail.folders
			.getIndentedList()
			.map((f) => f.folder)
			.find((f) => isSelectedPrefix(MAIL_PREFIX + "/" + f.mails))
		const path = selectedFolder ? mailboxDetail.folders.getPathToFolder(selectedFolder._id) : []
		const systemChildren = this.renderFolderTree(systemSystems, groupCounters, attrs, path)
		if (systemChildren) {
			children.push(...systemChildren.children)
		}
		if (locator.logins.isInternalUserLoggedIn()) {
			children.push(
				m(
					SidebarSection,
					{
						name: "yourFolders_action",
						button: attrs.inEditMode ? this.renderCreateFolderAddButton(null, attrs) : this.renderEditFoldersButton(attrs),
						key: "yourFolders", // we need to set a key because folder rows also have a key.
					},
					this.renderFolderTree(customSystems, groupCounters, attrs, path).children,
				),
			)
			children.push(this.renderAddButton(attrs))
		}
		return children
	}

	private renderFolderTree(
		subSystems: readonly FolderSubtree[],
		groupCounters: Counters,
		attrs: MailFolderViewAttrs,
		path: MailFolder[],
		indentationLevel: number = 0,
	): { children: Children[]; numRows: number } {
		// we need to keep track of how many rows we've drawn so far for this subtree so that we can draw hierarchy lines correctly
		const result: { children: Children[]; numRows: number } = { children: [], numRows: 0 }
		for (let system of subSystems) {
			const id = getElementId(system.folder)
			const button: NavButtonAttrs = {
				label: () => getFolderName(system.folder),
				href: () => (attrs.inEditMode ? m.route.get() : attrs.folderToUrl[system.folder._id[1]]),
				isSelectedPrefix: attrs.inEditMode ? false : MAIL_PREFIX + "/" + system.folder.mails,
				colors: NavButtonColor.Nav,
				click: () => attrs.onFolderClick(system.folder),
				dropHandler: (droppedMailId) => attrs.onFolderDrop(droppedMailId, system.folder),
				disableHoverBackground: true,
				disabled: attrs.inEditMode,
			}
			const currentExpansionState = attrs.inEditMode ? true : attrs.expandedFolders.has(getElementId(system.folder)) ?? false //default is false
			const hasChildren = system.children.length > 0
			const summedCount = !currentExpansionState && hasChildren ? this.getTotalFolderCounter(groupCounters, system) : groupCounters[system.folder.mails]
			const childResult =
				hasChildren && currentExpansionState
					? this.renderFolderTree(system.children, groupCounters, attrs, path, indentationLevel + 1)
					: { children: null, numRows: 0 }
			const render = m.fragment(
				{
					key: id,
				},
				[
					m(MailFolderRow, {
						count: attrs.inEditMode ? 0 : summedCount,
						button,
						icon: getFolderIcon(system.folder),
						rightButton: !(system.folder.folderType === MailFolderType.TRASH || system.folder.folderType === MailFolderType.SPAM)
							? this.createFolderMoreButton(system.folder, attrs)
							: null,
						expanded: hasChildren ? currentExpansionState : null,
						indentationLevel: Math.min(indentationLevel, MAX_FOLDER_INDENT_LEVEL),
						onExpanderClick: hasChildren ? () => attrs.onFolderExpanded(system.folder, currentExpansionState) : noOp,
						hasChildren,
						onSelectedPath: path.includes(system.folder),
						numberOfPreviousRows: result.numRows,
						isLastSibling: last(subSystems) === system,
						editMode: attrs.inEditMode,
					}),
					childResult.children,
				],
			)
			result.numRows += childResult.numRows + 1
			result.children.push(render)
		}
		return result
	}

	private renderAddButton(attrs: MailFolderViewAttrs): Child | null {
		return m(
			".folder-row.flex.flex-row.mlr-button.border-radius-small.state-bg.button-height.click",
			{
				key: "addFolder",
				onclick: () => {
					attrs.onShowFolderAddEditDialog(attrs.mailboxDetail.mailGroup._id, null, null)
				},
			},
			m(Icon, {
				icon: Icons.Add,
				large: true,
				style: {
					fill: theme.navigation_button,
				},
				class: "plr-button",
			}),
			m("span.label.plr-button", lang.get("addFolder_action")),
		)
	}

	private getTotalFolderCounter(counters: Counters, system: FolderSubtree): number {
		return (counters[system.folder.mails] ?? 0) + system.children.reduce((acc, child) => acc + this.getTotalFolderCounter(counters, child), 0)
	}

	private createFolderMoreButton(folder: MailFolder, attrs: MailFolderViewAttrs): IconButtonAttrs {
		return attachDropdown({
			mainButtonAttrs: {
				title: "more_label",
				icon: Icons.More,
				colors: ButtonColor.Nav,
				size: ButtonSize.Compact,
			},
			childAttrs: () => {
				return folder.folderType === MailFolderType.CUSTOM
					? // cannot add new folder to custom folder in spam or trash folder
					  isSpamOrTrashFolder(attrs.mailboxDetail.folders, folder)
						? [this.editButtonAttrs(attrs, folder), this.deleteButtonAttrs(attrs, folder)]
						: [this.editButtonAttrs(attrs, folder), this.addButtonAttrs(attrs, folder), this.deleteButtonAttrs(attrs, folder)]
					: [this.addButtonAttrs(attrs, folder)]
			},
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

	private editButtonAttrs(attrs: MailFolderViewAttrs, folder: MailFolder): DropdownButtonAttrs {
		return {
			label: "edit_action",
			icon: Icons.Edit,
			click: () => {
				attrs.onShowFolderAddEditDialog(
					attrs.mailboxDetail.mailGroup._id,
					folder,
					folder.parentFolder ? attrs.mailboxDetail.folders.getFolderById(folder.parentFolder) : null,
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
