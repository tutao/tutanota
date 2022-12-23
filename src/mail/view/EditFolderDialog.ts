import {MailFolder} from "../../api/entities/tutanota/TypeRefs.js"
import {DropDownSelector, SelectorItemList} from "../../gui/base/DropDownSelector.js"
import {MailFolderType} from "../../api/common/TutanotaConstants.js"
import {getFolderName, getIndentedFolderNameForDropdown} from "../model/MailUtils.js"
import m from "mithril"
import {TextField} from "../../gui/base/TextField.js"
import {Dialog} from "../../gui/base/Dialog.js"
import {locator} from "../../api/main/MainLocator.js"
import {isOfflineError} from "../../api/common/utils/ErrorCheckUtils.js"
import {LockedError} from "../../api/common/error/RestError.js"
import {lang, TranslationKey} from "../../misc/LanguageViewModel.js"
import {MailboxDetail} from "../model/MailModel.js"

export async function showEditFolderDialog(
	mailBoxDetail: MailboxDetail,
	folder: MailFolder | null = null,
	parentFolder: MailFolder | null = null,
) {
	const noParentFolderOption = "No Parent Folder";
	const mailGroupId = mailBoxDetail.mailGroup._id
	let folderNameValue = folder?.name ?? ""
	let targetFolders: SelectorItemList<MailFolder | null> = mailBoxDetail
		.folders.getIndentedList(folder)
		.filter(folderInfo => folderInfo.folder.folderType === MailFolderType.CUSTOM)
		.map(folderInfo => {
			return {
				name: getIndentedFolderNameForDropdown(folderInfo),
				value: folderInfo.folder,
			}
		})
	targetFolders = [{name: noParentFolderOption, value: null}, ...targetFolders]
	let selectedParentFolder = parentFolder ? parentFolder : null
	// @ts-ignore
	let form = () => [
		m(TextField, {
			label: folder ? "rename_action" : "folderName_label",
			value: folderNameValue,
			oninput: (newInput) => {
				folderNameValue = newInput
			}
		}),
		m(DropDownSelector, {
			label: "parentFolder_label",
			items: targetFolders,
			selectedValue: selectedParentFolder,
			selectedValueDisplay: selectedParentFolder ? getFolderName(selectedParentFolder) : noParentFolderOption,
			selectionChangedHandler: (newFolder: MailFolder | null) => selectedParentFolder = newFolder,
		}),
	]
	const okAction = async (dialog: Dialog) => {
		try {
			// if folder is null, create new folder
			if (folder === null) {
				await locator.mailFacade.createMailFolder(folderNameValue, selectedParentFolder ? selectedParentFolder._id : null, mailGroupId)
			} else {
				await locator.mailFacade.updateMailFolder(folder, selectedParentFolder?._id || null, folderNameValue)
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
	} else if (mailboxDetail.folders.getCustomFoldersOfParent(parentFolderId).some(f => f.name === name)) {
		return "folderNameInvalidExisting_msg"
	} else {
		return null
	}
}