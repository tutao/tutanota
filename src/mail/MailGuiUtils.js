//@flow
import type {MailModel} from "./MailModel"
import type {Mail} from "../api/entities/tutanota/Mail"
import {LockedError, PreconditionFailedError} from "../api/common/error/RestError"
import {Dialog} from "../gui/base/Dialog"
import type {MailFolder} from "../api/entities/tutanota/MailFolder"
import {locator} from "../api/main/MainLocator";
import {EntityClient} from "../api/common/EntityClient"
import {MailBodyTypeRef} from "../api/entities/tutanota/MailBody"
import {mailToEmlFile} from "./Exporter"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {getMailBodyText} from "../api/common/utils/Utils"
import {sortableTimestamp} from "../api/common/utils/DateUtils"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {fileController} from "../file/FileController"
import {logins} from "../api/main/LoginController"
import {FeatureType} from "../api/common/TutanotaConstants"
import {getArchiveFolder, getFolderIcon, getInboxFolder} from "./MailUtils"
import type {AllIconsEnum} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"

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

export function exportMails(entityClient: EntityClient, mails: Mail[]): Promise<void> {
	const mapper = mail => entityClient.load(MailBodyTypeRef, mail.body)
	                                   .then(body => mailToEmlFile(entityClient, mail, htmlSanitizer.sanitize(getMailBodyText(body), false).text))
	const exportPromise = Promise.map(mails, mapper, {concurrency: 5})
	const zipName = `${sortableTimestamp()}-mail-export.zip`
	return showProgressDialog("pleaseWait_msg", fileController.zipDataFiles(exportPromise, zipName))
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