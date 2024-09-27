import { Mail, MailFolder, MailSetEntryTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { DropDownSelector, SelectorItemList } from "../../../common/gui/base/DropDownSelector.js"
import m from "mithril"
import { TextField } from "../../../common/gui/base/TextField.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { LockedError } from "../../../common/api/common/error/RestError.js"
import { lang, TranslationKey } from "../../../common/misc/LanguageViewModel.js"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { MailReportType, MailSetKind } from "../../../common/api/common/TutanotaConstants.js"
import { elementIdPart, isSameId, listIdPart } from "../../../common/api/common/utils/EntityUtils.js"
import { reportMailsAutomatically } from "./MailReportDialog.js"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils.js"
import { groupByAndMap } from "@tutao/tutanota-utils"
import { mailLocator } from "../../mailLocator.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import type { FolderSystem, IndentedFolder } from "../../../common/api/common/mail/FolderSystem.js"
import { getFolderName, getIndentedFolderNameForDropdown, getPathToFolderString } from "../model/MailUtils.js"
import { isSpamOrTrashFolder } from "../model/MailChecks.js"

/**
 * Dialog for Edit and Add folder are the same.
 * @param editedFolder if this is null, a folder is being added, otherwise a folder is being edited
 */
export async function showEditFolderDialog(mailBoxDetail: MailboxDetail, editedFolder: MailFolder | null = null, parentFolder: MailFolder | null = null) {
	const noParentFolderOption = lang.get("comboBoxSelectionNone_msg")
	const mailGroupId = mailBoxDetail.mailGroup._id
	const folders = mailLocator.mailModel.getMailboxFoldersForId(assertNotNull(mailBoxDetail.mailbox.folders)._id)
	let folderNameValue = editedFolder?.name ?? ""
	let targetFolders: SelectorItemList<MailFolder | null> = folders
		.getIndentedList(editedFolder)
		// filter: SPAM and TRASH and descendants are only shown if editing (folders can only be moved there, not created there)
		.filter((folderInfo: IndentedFolder) => !(editedFolder === null && isSpamOrTrashFolder(folders, folderInfo.folder)))
		.map((folderInfo: IndentedFolder) => {
			return {
				name: getIndentedFolderNameForDropdown(folderInfo),
				value: folderInfo.folder,
			}
		})
	targetFolders = [{ name: noParentFolderOption, value: null }, ...targetFolders]
	let selectedParentFolder = parentFolder
	let form = () => [
		m(TextField, {
			label: editedFolder ? "rename_action" : "folderName_label",
			value: folderNameValue,
			oninput: (newInput) => {
				folderNameValue = newInput
			},
		}),
		m(DropDownSelector, {
			label: "parentFolder_label",
			items: targetFolders,
			selectedValue: selectedParentFolder,
			selectedValueDisplay: selectedParentFolder ? getFolderName(selectedParentFolder) : noParentFolderOption,
			selectionChangedHandler: (newFolder: MailFolder | null) => (selectedParentFolder = newFolder),
			helpLabel: () => (selectedParentFolder ? getPathToFolderString(folders, selectedParentFolder) : ""),
		}),
	]

	async function getMailIdsGroupedByListId(folder: MailFolder): Promise<Map<Id, Id[]>> {
		const mailSetEntries = await locator.entityClient.loadAll(MailSetEntryTypeRef, folder.entries)
		return groupByAndMap(
			mailSetEntries,
			(mse) => listIdPart(mse.mail),
			(mse) => elementIdPart(mse.mail),
		)
	}

	async function loadAllMailsOfFolder(folder: MailFolder, reportableMails: Array<Mail>) {
		if (folder.isMailSet) {
			const mailIdsPerBag = await getMailIdsGroupedByListId(folder)
			for (const [mailListId, mailIds] of mailIdsPerBag) {
				reportableMails.push(...(await locator.entityClient.loadMultiple(MailTypeRef, mailListId, mailIds)))
			}
		} else {
			reportableMails.push(...(await locator.entityClient.loadAll(MailTypeRef, folder.mails)))
		}
	}

	const okAction = async (dialog: Dialog) => {
		// closing right away to prevent duplicate actions
		dialog.close()
		try {
			// if folder is null, create new folder
			if (editedFolder === null) {
				await locator.mailFacade.createMailFolder(folderNameValue, selectedParentFolder?._id ?? null, mailGroupId)
			} else {
				// if it is being moved to trash (and not already in trash), ask about trashing
				if (selectedParentFolder?.folderType === MailSetKind.TRASH && !isSameId(selectedParentFolder._id, editedFolder.parentFolder)) {
					const confirmed = await Dialog.confirm(() =>
						lang.get("confirmDeleteCustomFolder_msg", {
							"{1}": getFolderName(editedFolder),
						}),
					)
					if (!confirmed) return

					await locator.mailFacade.updateMailFolderName(editedFolder, folderNameValue)
					await mailLocator.mailModel.trashFolderAndSubfolders(editedFolder)
				} else if (selectedParentFolder?.folderType === MailSetKind.SPAM && !isSameId(selectedParentFolder._id, editedFolder.parentFolder)) {
					// if it is being moved to spam (and not already in spam), ask about reporting containing emails
					const confirmed = await Dialog.confirm(() =>
						lang.get("confirmSpamCustomFolder_msg", {
							"{1}": getFolderName(editedFolder),
						}),
					)
					if (!confirmed) return

					// get mails to report before moving to mail model
					const descendants = folders.getDescendantFoldersOfParent(editedFolder._id).sort((l: IndentedFolder, r: IndentedFolder) => r.level - l.level)
					let reportableMails: Array<Mail> = []
					await loadAllMailsOfFolder(editedFolder, reportableMails)
					for (const descendant of descendants) {
						await loadAllMailsOfFolder(descendant.folder, reportableMails)
					}
					await reportMailsAutomatically(MailReportType.SPAM, locator.mailboxModel, mailLocator.mailModel, mailBoxDetail, reportableMails)

					await locator.mailFacade.updateMailFolderName(editedFolder, folderNameValue)
					await mailLocator.mailModel.sendFolderToSpam(editedFolder)
				} else {
					await locator.mailFacade.updateMailFolderName(editedFolder, folderNameValue)
					await locator.mailFacade.updateMailFolderParent(editedFolder, selectedParentFolder?._id || null)
				}
			}
		} catch (error) {
			if (isOfflineError(error) || !(error instanceof LockedError)) {
				throw error
			}
		}
	}

	Dialog.showActionDialog({
		title: editedFolder ? lang.get("editFolder_action") : lang.get("addFolder_action"),
		child: form,
		validator: () => checkFolderName(mailBoxDetail, folders, folderNameValue, mailGroupId, selectedParentFolder?._id ?? null),
		allowOkWithReturn: true,
		okAction: okAction,
	})
}

function checkFolderName(
	mailboxDetail: MailboxDetail,
	folders: FolderSystem,
	name: string,
	mailGroupId: Id,
	parentFolderId: IdTuple | null,
): TranslationKey | null {
	if (name.trim() === "") {
		return "folderNameNeutral_msg"
	} else if (folders.getCustomFoldersOfParent(parentFolderId).some((f) => f.name === name)) {
		return "folderNameInvalidExisting_msg"
	} else {
		return null
	}
}
