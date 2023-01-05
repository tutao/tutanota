import { MailFolder, MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { DropDownSelector, SelectorItemList } from "../../gui/base/DropDownSelector.js"
import { getFolderName, getIndentedFolderNameForDropdown, getPathToFolderString } from "../model/MailUtils.js"
import m from "mithril"
import { TextField } from "../../gui/base/TextField.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { locator } from "../../api/main/MainLocator.js"
import { isOfflineError } from "../../api/common/utils/ErrorCheckUtils.js"
import { LockedError } from "../../api/common/error/RestError.js"
import { lang, TranslationKey } from "../../misc/LanguageViewModel.js"
import { MailboxDetail } from "../model/MailModel.js"
import { MailFolderType, MailReportType } from "../../api/common/TutanotaConstants.js"
import { isSameId } from "../../api/common/utils/EntityUtils.js"
import { reportMailsAutomatically } from "../view/MailReportDialog.js"

/**
 * Dialog for Edit and Add folder are the same.
 * @param folder if this is null, a folder is being added, otherwise that folder is being edited
 */
export async function showEditFolderDialog(mailBoxDetail: MailboxDetail, folder: MailFolder | null = null, parentFolder: MailFolder | null = null) {
	const noParentFolderOption = lang.get("comboBoxSelectionNone_msg")
	const mailGroupId = mailBoxDetail.mailGroup._id
	let folderNameValue = folder?.name ?? ""
	let targetFolders: SelectorItemList<MailFolder | null> = mailBoxDetail.folders
		.getIndentedList(folder)
		// filter: SPAM and TRASH and descendants are only shown if editing (folders can only be moved there, not created there)
		.filter(
			(folderInfo) =>
				!(
					folder === null &&
					(folderInfo.folder.folderType === MailFolderType.TRASH ||
						folderInfo.folder.folderType === MailFolderType.SPAM ||
						mailBoxDetail.folders.checkFolderForAncestor(
							folderInfo.folder,
							mailBoxDetail.folders.getSystemFolderByType(MailFolderType.TRASH)._id,
						) ||
						mailBoxDetail.folders.checkFolderForAncestor(folderInfo.folder, mailBoxDetail.folders.getSystemFolderByType(MailFolderType.SPAM)._id))
				),
		)
		.map((folderInfo) => {
			return {
				name: getIndentedFolderNameForDropdown(folderInfo),
				value: folderInfo.folder,
			}
		})
	targetFolders = [{ name: noParentFolderOption, value: null }, ...targetFolders]
	let selectedParentFolder = parentFolder ? parentFolder : null
	// @ts-ignore
	let form = () => [
		m(TextField, {
			label: folder ? "rename_action" : "folderName_label",
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
		try {
			// if folder is null, create new folder
			if (folder === null) {
				await locator.mailFacade.createMailFolder(folderNameValue, selectedParentFolder ? selectedParentFolder._id : null, mailGroupId)
			} else {
				// if it is being moved to trash (and not already in trash), ask about trashing
				if (selectedParentFolder?.folderType === MailFolderType.TRASH && !isSameId(selectedParentFolder._id, folder.parentFolder)) {
					const confirmed = await Dialog.confirm(() =>
						lang.get("confirmDeleteCustomFolder_msg", {
							"{1}": getFolderName(folder),
						}),
					)
					if (!confirmed) return
					await locator.mailModel.trashFolderAndSubfolders(folder)
				} else if (selectedParentFolder?.folderType === MailFolderType.SPAM && !isSameId(selectedParentFolder._id, folder.parentFolder)) {
					// if it is being moved to spam (and not already in spam), ask about reporting containing emails
					const confirmed = await Dialog.confirm(() =>
						lang.get("confirmSpamCustomFolder_msg", {
							"{1}": getFolderName(folder),
						}),
					)
					if (!confirmed) return
					// get mails to report before moving to mail model
					const descendants = mailBoxDetail.folders.getDescendantFoldersOfParent(folder._id).sort((l, r) => r.level - l.level)

					let reportableMails = await locator.entityClient.loadAll(MailTypeRef, folder.mails)
					for (const descendant of descendants) {
						reportableMails.push(...(await locator.entityClient.loadAll(MailTypeRef, descendant.folder.mails)))
					}
					await reportMailsAutomatically(MailReportType.SPAM, locator.mailModel, mailBoxDetail, reportableMails)
					await locator.mailModel.spamFolderAndSubfolders(folder)
				} else {
					await locator.mailFacade.updateMailFolder(folder, selectedParentFolder?._id || null, folderNameValue)
				}
			}
			dialog.close()
		} catch (error) {
			if (isOfflineError(error)) {
				//do not close
				throw error
			} else if (error instanceof LockedError) {
				dialog.close()
			} else {
				dialog.close()
				throw error
			}
		}
	}
	const validateFolderEdit = (name: string, newParentFolder: readonly [string, string] | null) => {
		return checkFolderName(mailBoxDetail, name, mailGroupId, newParentFolder)
	}
	Dialog.showActionDialog({
		title: folder ? lang.get("editFolder_action") : lang.get("addFolder_action"),
		child: form,
		validator: () => validateFolderEdit(folderNameValue, selectedParentFolder?._id ?? null),
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
