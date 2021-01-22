//@flow
import type {MailModel} from "./MailModel"
import type {Mail} from "../api/entities/tutanota/Mail"
import {LockedError, PreconditionFailedError} from "../api/common/error/RestError"
import {Dialog} from "../gui/base/Dialog"
import type {MailFolder} from "../api/entities/tutanota/MailFolder"
import {locator} from "../api/main/MainLocator";
import {sortableTimestamp} from "../api/common/utils/DateUtils"
import {fileController} from "../file/FileController"
import {logins} from "../api/main/LoginController"
import {FeatureType} from "../api/common/TutanotaConstants"
import type {MailBundle} from "./MailUtils"
import {getArchiveFolder, getFolderIcon, getInboxFolder, makeMailBundle} from "./MailUtils"
import type {AllIconsEnum} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {worker} from "../api/main/WorkerClient"
import {mailToEmlFile} from "./Exporter"

export function showDeleteConfirmationDialog(mails: $ReadOnlyArray<Mail>): Promise<boolean> {
	let groupedMails = mails.reduce((all, mail) => {
		locator.mailModel.isFinalDelete(locator.mailModel.getMailFolder(mail._id[0])) ? all.trash.push(mail) : all.move.push(mail)
		return all
	}, {trash: [], move: []})

	let confirmationTextId = null
	if (groupedMails.trash.length > 0) {
		if (groupedMails.move.length > 0) {
			confirmationTextId = "finallyDeleteSelectedEmails_msg"
		} else {
			confirmationTextId = "finallyDeleteEmails_msg"
		}
	}
	if (confirmationTextId != null) {
		return Dialog.confirm(confirmationTextId)
	} else {
		return Promise.resolve(true)
	}
}

export function promptAndDeleteMails(mailModel: MailModel, mails: $ReadOnlyArray<Mail>, onConfirm: () => void): Promise<void> {
	return showDeleteConfirmationDialog(mails).then(() => {
		onConfirm()

		return mailModel.deleteMails(mails)
			// FIXME: do not import dialog here
			            .catch(PreconditionFailedError, e => Dialog.error("operationStillActive_msg"))
			            .catch(LockedError, e => Dialog.error("operationStillActive_msg")) //LockedError should no longer be thrown!?!
	})
}

export function moveMails(mailModel: MailModel, mails: $ReadOnlyArray<Mail>, targetMailFolder: MailFolder): Promise<void> {
	return mailModel.moveMails(mails, targetMailFolder)
	                .catch(LockedError, e => Dialog.error("operationStillActive_msg")) //LockedError should no longer be thrown!?!
	                .catch(PreconditionFailedError, e => Dialog.error("operationStillActive_msg"))
}


/**
 * export a set of mails into a zip file and offer to download
 * @param entityClient
 * @param worker
 * @param mails array of mails to export
 * @returns {Promise<void>} resolved after the fileController
 * was instructed to open the new zip File containing the mail eml
 */
export function exportMails(mails: Array<MailBundle>): Promise<void> {
	const zipName = `${sortableTimestamp()}-mail-export.zip`
	return fileController.zipDataFiles(mails.map(mailToEmlFile), zipName)
	                     .then(zip => fileController.open(zip))
}

export function isNewMailActionAvailable(): boolean {
	return logins.isInternalUserLoggedIn() && !logins.isEnabled(FeatureType.ReplyOnly)
}

export function archiveMails(mails: Mail[]): Promise<*> {
	if (mails.length > 0) {
		// assume all mails in the array belong to the same Mailbox
		return locator.mailModel.getMailboxFolders(mails[0])
		              .then((folders) => moveMails(locator.mailModel, mails, getArchiveFolder(folders)))
	} else {
		return Promise.resolve()
	}
}

export function moveToInbox(mails: Mail[]): Promise<*> {
	if (mails.length > 0) {
		// assume all mails in the array belong to the same Mailbox
		return locator.mailModel.getMailboxFolders(mails[0])
		              .then((folders) => moveMails(locator.mailModel, mails, getInboxFolder(folders)))
	} else {
		return Promise.resolve()
	}
}

export function getMailFolderIcon(mail: Mail): AllIconsEnum {
	let folder = locator.mailModel.getMailFolder(mail._id[0])
	if (folder) {
		return getFolderIcon(folder)()
	} else {
		return Icons.Folder
	}
}

/**
 * Uses the global entityClient and worker to bundle a mail
 * (the worker and entityClient can't be imported from mailUtils, and it's nice to keep them as parameters in makeMailBundle anyway, for testing)
 * Convenience function, should maybe be removed?
 * @param mail
 * @returns {Promise<MailBundle>}
 */
export function bundleMail(mail: Mail): Promise<MailBundle> {
	return makeMailBundle(mail, locator.entityClient, worker)
}

/**
 * Uses the global entityClient and worker to bundle some mails
 * Also convenience function that should also maybe be removed
 * @param mails
 * @returns {Promise<MailBundle[]>}
 */
export function bundleMails(mails: Array<Mail>): Promise<Array<MailBundle>> {
	return Promise.mapSeries(mails, bundleMail)
}
