import m, { Child, Children, Component, Vnode } from "mithril"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { SidebarSection } from "../../../../ui/SidebarSection.js"
import { IconButton } from "../../../../ui/base/IconButton.js"
import { FolderSubtree, FolderSystem } from "../../../common/api/common/mail/FolderSystem.js"
import { isNavButtonSelected, isSelectedPrefix } from "../../../../ui/base/NavButton.js"
import { MAIL_PREFIX } from "../../../../ui/utils/RouteChange.js"
import { isNotEmpty } from "../../../../platform-kit/utils"
import { DropdownButtonAttrs } from "../../../../ui/base/Dropdown.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import { ButtonSize } from "../../../../ui/base/ButtonSize.js"
import { px, size } from "../../../../ui/size.js"
import { RowButton } from "../../../../ui/base/buttons/RowButton.js"
import { MailModel } from "../model/MailModel.js"
import { getFolderName } from "../model/MailUtils.js"
import { DropData } from "../../../../ui/base/GuiUtils"
import { theme } from "../../../../ui/theme.js"
import { MailSet } from "@tutao/entities/tutanota"
import { elementIdPart, getElementId } from "../../../../platform-kit/meta"
import { getFolderIcon } from "./MailGuiUtils"
import { IconSize } from "../../../../ui/base/Icon"
import { FolderSystemKind, MailSetTreeActionAttrs, MailSetTreeAttrs, renderFolderTree } from "./MailSetTreeUtils"
import { Group } from "@tutao/entities/sys"

export interface MailFolderViewAttrs {
	mailModel: MailModel
	mailboxDetail: MailboxDetail
	mailFolderElementIdToSelectedMailId: ReadonlyMap<Id, Id>
	onFolderClick: (folder: MailSet) => unknown
	onFolderDrop: (dropData: DropData, folder: MailSet) => unknown
	expandedFolders: ReadonlySet<Id>
	onFolderExpanded: (folder: MailSet, state: boolean) => unknown
	onShowFolderAddEditDialog: (mailGroupId: Id, folder: MailSet | null, parentFolder: MailSet | null) => unknown
	onDeleteCustomMailFolder: (folder: MailSet) => unknown
	inEditMode: boolean
	onEditMailbox: () => unknown
}

type Counters = Record<string, number>

/** Displays a tree of all mailSets. */
export class MailFoldersView implements Component<MailFolderViewAttrs> {
	// Contains the id of the visible row
	public visibleRow: string | null = null

	view({ attrs }: Vnode<MailFolderViewAttrs>): Children {
		const { mailboxDetail, mailModel } = attrs
		const groupCounters = mailModel.mailboxCounters()[mailboxDetail.mailGroup._id] || {}
		const folders = mailModel.getFolderSystemByGroupId(mailboxDetail.mailGroup._id)
		// Important: this array is keyed so each item must have a key and `null` cannot be in the array
		// So instead we push or not push into array
		const customSystems = folders?.customSubtrees ?? []
		const orphanSystems = folders?.orphanSubtrees ?? []
		const systemSystems = folders?.systemSubtrees ?? []
		const children: Children = []
		const selectedFolder = folders
			?.getIndentedList()
			.map((f) => f.folder)
			.find((f) => isSelectedPrefix(MAIL_PREFIX + "/" + getElementId(f)))
		const path = folders && selectedFolder ? folders.getPathToFolder(selectedFolder._id) : []
		const isInternalUser = locator.logins.isInternalUserLoggedIn()
		const mailTreeAttrs: MailSetTreeAttrs = {
			mailboxDetail: attrs.mailboxDetail,
			mailFolderElementIdToSelectedMailId: attrs.mailFolderElementIdToSelectedMailId,
			onFolderClick: attrs.onFolderClick,
			onFolderDrop: attrs.onFolderDrop,
			expandedFolders: attrs.expandedFolders,
			onFolderExpanded: attrs.onFolderExpanded,
			inEditMode: attrs.inEditMode,
			buttonAttrs: {
				edit: this.editButtonAttrs,
				add: this.addButtonAttrs,
				delete: this.deleteButtonAttrs,
			},
			actionAttrs: {
				onDeleteCustomMailLabel: attrs.onDeleteCustomMailFolder,
				onShowFolderAddEditDialog: attrs.onShowFolderAddEditDialog,
			},
			getIconForMailSet: (mailSet, button) => ({
				icon: getFolderIcon(mailSet),
				size: IconSize.PX24,
				style: {
					fill: button && isNavButtonSelected(button) ? theme.primary : theme.on_surface_variant,
				},
			}),
			getFolderName(system: FolderSubtree): string {
				return getFolderName(system.folder)
			},
		}
		const systemChildren =
			folders && renderFolderTree(systemSystems, FolderSystemKind.System, groupCounters, folders, mailTreeAttrs, path, isInternalUser, this)
		if (systemChildren) {
			children.push(...systemChildren.children)
		}
		if (isInternalUser) {
			const customChildren = folders
				? renderFolderTree(customSystems, FolderSystemKind.Custom, groupCounters, folders, mailTreeAttrs, path, isInternalUser, this).children
				: []
			children.push(
				m(
					SidebarSection,
					{
						name: "yourFolders_action",
						button: attrs.inEditMode ? this.renderCreateFolderAddButton(null, attrs) : this.renderEditFoldersButton(attrs),
						key: "yourFolders", // we need to set a key because folder rows also have a key.
					},
					customChildren,
				),
			)
			children.push(this.renderAddFolderButtonRow(attrs))

			const orphanChildren = folders
				? renderFolderTree(orphanSystems, FolderSystemKind.Orphan, groupCounters, folders, mailTreeAttrs, path, isInternalUser, this).children
				: []
			if (isNotEmpty(orphanChildren)) {
				children.push(
					m(
						SidebarSection,
						{
							name: "failedToDeleteFolders_label",
							button: !attrs.inEditMode ? this.renderEditFoldersButton(attrs) : null,
							key: "orphanFolders", // we need to set a key because folder rows also have a key.
						},
						orphanChildren,
					),
				)
			}
		}

		return children
	}

	private renderAddFolderButtonRow(attrs: MailFolderViewAttrs): Child {
		// This button needs to fill the whole row, but is not a navigation button (so IconButton or NavButton weren't appropriate)
		return m(RowButton, {
			label: "addFolder_action",
			key: "addFolder",
			icon: Icons.Plus,
			class: "folder-row mlr-8 border-radius-4",
			style: {
				width: `calc(100% - ${px(size.spacing_8 * 2)})`,
			},
			onclick: () => {
				attrs.onShowFolderAddEditDialog(attrs.mailboxDetail.mailGroup._id, null, null)
			},
		})
	}

	private deleteButtonAttrs(attrs: MailSetTreeActionAttrs, mailGroupId: Group["_id"], folder: MailSet): DropdownButtonAttrs {
		return {
			label: "delete_action",
			icon: Icons.TrashFilled,
			click: () => {
				attrs.onDeleteCustomMailLabel(folder)
			},
		}
	}

	private addButtonAttrs(attrs: MailSetTreeActionAttrs, mailGroupId: Group["_id"], folder: MailSet): DropdownButtonAttrs {
		return {
			label: "addFolder_action",
			icon: Icons.Plus,
			click: () => {
				attrs.onShowFolderAddEditDialog(mailGroupId, null, folder)
			},
		}
	}

	private editButtonAttrs(attrs: MailSetTreeActionAttrs, mailGroupId: Group["_id"], folders: FolderSystem, folder: MailSet): DropdownButtonAttrs {
		return {
			label: "edit_action",
			icon: Icons.PenFilled,
			click: () => {
				attrs.onShowFolderAddEditDialog(mailGroupId, folder, folder.parentFolder ? folders.getFolderById(elementIdPart(folder.parentFolder)) : null)
			},
		}
	}

	private renderCreateFolderAddButton(parentFolder: MailSet | null, attrs: MailFolderViewAttrs): Child {
		return m(IconButton, {
			title: "addFolder_action",
			click: () => {
				return attrs.onShowFolderAddEditDialog(attrs.mailboxDetail.mailGroup._id, null, parentFolder)
			},
			icon: Icons.Plus,
			size: ButtonSize.Compact,
		})
	}

	private renderEditFoldersButton(attrs: MailFolderViewAttrs): Child {
		return m(IconButton, {
			title: "edit_action",
			click: () => attrs.onEditMailbox(),
			icon: Icons.PenFilled,
			size: ButtonSize.Compact,
		})
	}
}
