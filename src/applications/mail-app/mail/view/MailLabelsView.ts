import m, { Child, Children, Component, Vnode } from "mithril"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { FolderSubtree, FolderSystem } from "../../../common/api/common/mail/FolderSystem.js"
import { isNavButtonSelected, isSelectedPrefix } from "../../../../ui/base/NavButton.js"
import { MAIL_PREFIX } from "../../../../ui/utils/RouteChange.js"
import { DropdownButtonAttrs } from "../../../../ui/base/Dropdown.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import { px, size } from "../../../../ui/size.js"
import { RowButton } from "../../../../ui/base/buttons/RowButton.js"
import { MailModel } from "../model/MailModel.js"
import { DropData } from "../../../../ui/base/GuiUtils"
import { MailSet } from "@tutao/entities/tutanota"
import { elementIdPart, getElementId } from "../../../../platform-kit/meta"
import { MailSetTreeActionAttrs, MailSetTreeAttrs, renderFolderTree } from "./MailSetTreeUtils"
import { Group } from "@tutao/entities/sys"
import { IconSize } from "../../../../ui/base/Icon"
import { getLabelColor } from "../../../../ui/base/Label"
import { theme } from "../../../../ui/theme"

export interface MailLabelViewAttrs {
	mailModel: MailModel
	mailboxDetail: MailboxDetail
	mailLabelElementIdToSelectedMailId: ReadonlyMap<Id, Id>
	onLabelClick: (label: MailSet) => unknown
	onLabelDrop: (dropData: DropData, folder: MailSet) => unknown
	expandedLabels: ReadonlySet<Id>
	onLabelExpanded: (label: MailSet, state: boolean) => unknown
	onShowLabelAddEditDialog: (mailGroupId: Id, label: MailSet | null, parentLabel: MailSet | null) => unknown
	onDeleteCustomMailLabel: (label: MailSet) => unknown
	inEditMode: boolean
	onEditMailbox: () => unknown
}

/** Displays a tree of all label mailSets. */
export class MailLabelsView implements Component<MailLabelViewAttrs> {
	// Contains the id of the visible row
	public visibleRow: string | null = null

	view({ attrs }: Vnode<MailLabelViewAttrs>): Children {
		const { mailboxDetail, mailModel } = attrs
		const groupCounters = mailModel.mailboxCounters()[mailboxDetail.mailGroup._id] || {}
		const labels = mailModel.getLabelFolderSystemByGroupId(mailboxDetail.mailGroup._id)
		// Important: this array is keyed so each item must have a key and `null` cannot be in the array
		// So instead we push or not push into array
		const customSystems = labels?.customSubtrees ?? []
		const children: Children = []
		const selectedLabel = labels
			?.getIndentedList()
			.map((l) => l.folder)
			.find((l) => isSelectedPrefix(MAIL_PREFIX + "/" + getElementId(l)))
		const path = labels && selectedLabel ? labels.getPathToFolder(selectedLabel._id) : []
		const mailTreeAttrs: MailSetTreeAttrs = {
			mailboxDetail: attrs.mailboxDetail,
			mailFolderElementIdToSelectedMailId: attrs.mailLabelElementIdToSelectedMailId,
			onFolderClick: attrs.onLabelClick,
			onFolderDrop: attrs.onLabelDrop,
			expandedFolders: attrs.expandedLabels,
			onFolderExpanded: attrs.onLabelExpanded,
			inEditMode: attrs.inEditMode,
			buttonAttrs: {
				edit: this.editButtonAttrs,
				add: this.addButtonAttrs,
				delete: this.deleteButtonAttrs,
			},
			actionAttrs: {
				onDeleteCustomMailLabel: attrs.onDeleteCustomMailLabel,
				onShowFolderAddEditDialog: attrs.onShowLabelAddEditDialog,
			},
			getIconForMailSet: (mailSet, button) => ({
				icon: Icons.LabelFilled,
				size: IconSize.PX24,
				style: {
					fill: getLabelColor(mailSet.color) ?? (isNavButtonSelected(button) ? theme.primary : theme.on_surface_variant),
				},
			}),
			getFolderName(system: FolderSubtree): string {
				return system.folder.name
			},
		}
		const labelsChildren = labels && renderFolderTree(customSystems, groupCounters, labels, mailTreeAttrs, path, true, this)
		if (labelsChildren) {
			children.push(...labelsChildren.children)
		}
		children.push(this.renderAddLabelButtonRow(attrs))
		return children
	}

	private renderAddLabelButtonRow(attrs: MailLabelViewAttrs): Child {
		// This button needs to fill the whole row, but is not a navigation button (so IconButton or NavButton weren't appropriate)
		return m(RowButton, {
			label: "addLabel_action",
			icon: Icons.Plus,
			key: "addLabel",
			class: "folder-row mlr-8 border-radius-4",
			style: {
				width: `calc(100% - ${px(size.spacing_8 * 2)})`,
			},
			onclick: () => {
				attrs.onShowLabelAddEditDialog(attrs.mailboxDetail.mailGroup._id, null, null)
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
			label: "addLabel_action",
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
}
