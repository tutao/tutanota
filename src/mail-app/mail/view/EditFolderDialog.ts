import { MailFolder, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { DropDownSelector, SelectorItemList } from "../../../common/gui/base/DropDownSelector.js"
import m from "mithril"
import { TextField } from "../../../common/gui/base/TextField.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { LockedError } from "../../../common/api/common/error/RestError.js"
import { lang, TranslationKey } from "../../../common/misc/LanguageViewModel.js"
import { MailboxDetail } from "../../../common/mailFunctionality/MailModel.js"
import { MailFolderType, MailReportType } from "../../../common/api/common/TutanotaConstants.js"
import { isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import { reportMailsAutomatically } from "./MailReportDialog.js"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils.js"
import {
	getFolderName,
	getIndentedFolderNameForDropdown,
	getPathToFolderString,
	isSpamOrTrashFolder,
} from "../../../common/mailFunctionality/CommonMailUtils.js"

/**
 * Dialog for Edit and Add folder are the same.
 * @param editFolder if this is null, a folder is being added, otherwise a folder is being edited
 */
export async function showEditFolderDialog(mailBoxDetail: MailboxDetail, editFolder: MailFolder | null = null, parentFolder: MailFolder | null = null) {
	const noParentFolderOption = lang.get("comboBoxSelectionNone_msg")
	const mailGroupId = mailBoxDetail.mailGroup._id
	let folderNameValue = editFolder?.name ?? ""
	let targetFolders: SelectorItemList<MailFolder | null> = mailBoxDetail.folders
		.getIndentedList(editFolder)
		// filter: SPAM and TRASH and descendants are only shown if editing (folders can only be moved there, not created there)
		.filter((folderInfo) => !(editFolder === null && isSpamOrTrashFolder(mailBoxDetail.folders, folderInfo.folder)))
		.map((folderInfo) => {
			return {
				name: getIndentedFolderNameForDropdown(folderInfo),
				value: folderInfo.folder,
			}
		})
	targetFolders = [{ name: noParentFolderOption, value: null }, ...targetFolders]
	let selectedParentFolder = parentFolder
	let form = () => [
		m(TextField, {
			label: editFolder ? "rename_action" : "folderName_label",
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
			helpLabel: () => (selectedParentFolder ? getPathToFolderString(mailBoxDetail.folders, selectedParentFolder) : ""),
		}),
	]
	const okAction = async (dialog: Dialog) => {
		// closing right away to prevent duplicate actions
		dialog.close()
		try {
			// if folder is null, create new folder
			if (editFolder === null) {
				await locator.mailFacade.createMailFolder(folderNameValue, selectedParentFolder?._id ?? null, mailGroupId)
			} else {
				// if it is being moved to trash (and not already in trash), ask about trashing
				if (selectedParentFolder?.folderType === MailFolderType.TRASH && !isSameId(selectedParentFolder._id, editFolder.parentFolder)) {
					const confirmed = await Dialog.confirm(() =>
						lang.get("confirmDeleteCustomFolder_msg", {
							"{1}": getFolderName(editFolder),
						}),
					)
					if (!confirmed) return

					await locator.mailFacade.updateMailFolderName(editFolder, folderNameValue)
					await locator.mailModel.trashFolderAndSubfolders(editFolder)
				} else if (selectedParentFolder?.folderType === MailFolderType.SPAM && !isSameId(selectedParentFolder._id, editFolder.parentFolder)) {
					// if it is being moved to spam (and not already in spam), ask about reporting containing emails
					const confirmed = await Dialog.confirm(() =>
						lang.get("confirmSpamCustomFolder_msg", {
							"{1}": getFolderName(editFolder),
						}),
					)
					if (!confirmed) return

					// get mails to report before moving to mail model
					const descendants = mailBoxDetail.folders.getDescendantFoldersOfParent(editFolder._id).sort((l, r) => r.level - l.level)
					let reportableMails = await locator.entityClient.loadAll(MailTypeRef, editFolder.mails)
					for (const descendant of descendants) {
						reportableMails.push(...(await locator.entityClient.loadAll(MailTypeRef, descendant.folder.mails)))
					}
					await reportMailsAutomatically(MailReportType.SPAM, locator.mailModel, mailBoxDetail, reportableMails)

					await locator.mailFacade.updateMailFolderName(editFolder, folderNameValue)
					await locator.mailModel.sendFolderToSpam(editFolder)
				} else {
					await locator.mailFacade.updateMailFolderName(editFolder, folderNameValue)
					await locator.mailFacade.updateMailFolderParent(editFolder, selectedParentFolder?._id || null)
				}
			}
		} catch (error) {
			if (isOfflineError(error) || !(error instanceof LockedError)) {
				throw error
			}
		}
	}

	Dialog.showActionDialog({
		title: editFolder ? lang.get("editFolder_action") : lang.get("addFolder_action"),
		child: form,
		validator: () => checkFolderName(mailBoxDetail, folderNameValue, mailGroupId, selectedParentFolder?._id ?? null),
		allowOkWithReturn: true,
		okAction: okAction,
	})
}

function checkFolderName(mailboxDetail: MailboxDetail, name: string, mailGroupId: Id, parentFolderId: IdTuple | null): TranslationKey | null {
	if (name.trim() === "") {
		return "folderNameNeutral_msg"
	} else if (mailboxDetail.folders.getCustomFoldersOfParent(parentFolderId).some((f) => f.name === name)) {
		return "folderNameInvalidExisting_msg"
	} else {
		return null
	}
}
