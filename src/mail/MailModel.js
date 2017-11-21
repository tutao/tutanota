//@flow
import {neverNull} from "../api/common/utils/Utils"
import {createMoveMailData} from "../api/entities/tutanota/MoveMailData"
import {serviceRequestVoid} from "../api/main/Entity"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {Dialog} from "../gui/base/Dialog"
import {logins} from "../api/main/LoginController"
import {isFinallyDeleteAllowed, getTrashFolder} from "./MailUtils"
import {createDeleteMailData} from "../api/entities/tutanota/DeleteMailData"


export type MailboxDetails ={
	mailbox: MailBox,
	folders: MailFolder[],
	mailGroupInfo: GroupInfo,
	mailGroup: Group
}

class MailModel {

	_mailboxes: MailboxDetails[]

	constructor() {
		this._mailboxes = []
	}

	getMailboxDetails(mail: Mail): MailboxDetails {
		return neverNull(this._mailboxes.find((md) => md.folders.find(f => f.mails == mail._id[0]) != null))
	}

	getMailboxDetailsForMembership(mailGroupMembership: GroupMembership): MailboxDetails {
		return neverNull(this._mailboxes.find((md) => mailGroupMembership.group == md.mailbox._ownerGroup))
	}

	getUserMailboxDetails(): MailboxDetails {
		let userMailGroupMembership = logins.getUserController().getUserMailGroupMembership()
		return neverNull(this._mailboxes.find(md => md.mailGroup._id == userMailGroupMembership.group))
	}

	getMailboxFolders(mail: Mail): MailFolder[] {
		return this.getMailboxDetails(mail).folders
	}

	getMailFolder(mail: Mail): MailFolder {
		for (let e of this._mailboxes) {
			for (let f of e.folders) {
				if (f.mails == mail._id[0]) {
					return f
				}
			}
		}
		throw new Error("No folder found for mail " + JSON.stringify(mail._id))
	}

	moveMails(mails: Mail[], target: MailFolder): Promise<void> {
		let moveMails = mails.filter(m => m._id[0] != target.mails && target._ownerGroup != mails[0]._ownerGroup) // prevent moving mails between mail boxes.
		if (moveMails.length > 0) {
			let moveMailData = createMoveMailData()
			moveMailData.targetFolder = target._id
			moveMailData.mails.push(...mails.map(m => m._id))
			return serviceRequestVoid(TutanotaService.MoveMailService, HttpMethod.POST, moveMailData)
				.catch(PreconditionFailedError, e => Dialog.error("operationStillActive_msg"))
		}
		return Promise.resolve()
	}

	deleteMails(mails: Mail[]): Promise<void> {
		let groupedMails = mails.reduce((all, mail) => {
			isFinallyDeleteAllowed(mailModel.getMailFolder(mail)) ? all.trash.push(mail) : all.move.push(mail)
			return all
		}, {trash: [], move: []})

		let promises = []
		if (groupedMails.trash.length > 0) {
			let deleteMailData = createDeleteMailData()
			deleteMailData.mails.push(...groupedMails.trash.map(m => m._id))
			promises.push(serviceRequestVoid(TutanotaService.MailService, HttpMethod.DELETE, deleteMailData)
				.catch(PreconditionFailedError, e => Dialog.error("operationStillActive_msg")))

		} else if (groupedMails.move.length > 0) {
			promises.push(mailModel.moveMails(groupedMails.move, getTrashFolder(mailModel.getMailboxFolders(groupedMails.move[0]))))
		}
		return Promise.all(promises).return()
	}


}


export const mailModel = new MailModel()