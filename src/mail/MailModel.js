//@flow
import m from "mithril"
import {neverNull} from "../api/common/utils/Utils"
import {createMoveMailData} from "../api/entities/tutanota/MoveMailData"
import {serviceRequestVoid, loadAll, load} from "../api/main/Entity"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {HttpMethod, isSameId, isSameTypeRef} from "../api/common/EntityFunctions"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {Dialog} from "../gui/base/Dialog"
import {logins} from "../api/main/LoginController"
import {isFinallyDeleteAllowed, getTrashFolder} from "./MailUtils"
import {createDeleteMailData} from "../api/entities/tutanota/DeleteMailData"
import {MailBoxTypeRef} from "../api/entities/tutanota/MailBox"
import {MailboxGroupRootTypeRef} from "../api/entities/tutanota/MailboxGroupRoot"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {MailFolderTypeRef} from "../api/entities/tutanota/MailFolder"
import {worker} from "../api/main/WorkerClient"
import {OperationType} from "../api/common/TutanotaConstants"
import {module as replaced} from "@hot"


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

		worker.getEntityEventController().addListener((typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum) => this.entityEventReceived(typeRef, listId, elementId, operation))
	}

	init(): Promise<void> {
		let mailGroupMemberships = logins.getUserController().getMailGroupMemberships()
		return Promise.all(mailGroupMemberships.map(mailGroupMembership => {
			return Promise.all([
				load(MailboxGroupRootTypeRef, mailGroupMembership.group).then(mailGroupRoot => load(MailBoxTypeRef, mailGroupRoot.mailbox)),
				load(GroupInfoTypeRef, mailGroupMembership.groupInfo),
				load(GroupTypeRef, mailGroupMembership.group)
			]).spread((mailbox, mailGroupInfo, mailGroup) => {
				return this._loadFolders(neverNull(mailbox.systemFolders).folders, true).then(folders => {
					this._mailboxes.push({
						mailbox,
						folders,
						mailGroupInfo,
						mailGroup
					})
				})
			})
		})).return()
	}

	_loadFolders(folderListId: Id, loadSubFolders: boolean): Promise<MailFolder[]> {
		return loadAll(MailFolderTypeRef, folderListId).then(folders => {
			if (loadSubFolders) {
				return Promise.map(folders, folder => this._loadFolders(folder.subFolders, false)).then(subfolders => {
					return folders.concat(...subfolders)
				})
			} else {
				return folders
			}
		})
	}

	getMailboxDetails(mail: Mail): MailboxDetails {
		return neverNull(this._mailboxes.find((md) => md.folders.find(f => f.mails == mail._id[0]) != null))
	}

	getMailboxDetailsForMembership(mailGroupMembership: GroupMembership): MailboxDetails {
		return neverNull(this._mailboxes.find((md) => mailGroupMembership.group == md.mailbox._ownerGroup))
	}

	getMailboxDetailsForGroupInfo(mailGroupInfoId: IdTuple): MailboxDetails {
		return neverNull(this._mailboxes.find((md) => isSameId(mailGroupInfoId, md.mailGroupInfo._id)))
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

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, MailFolderTypeRef) || isSameTypeRef(typeRef, GroupInfoTypeRef)) {
			this.init().then(() => m.redraw())
		} else if (isSameTypeRef(typeRef, GroupInfoTypeRef)) {
			if (operation == OperationType.UPDATE) {
				this.init().then(() => m.redraw())
			}
		}
	}

}


export const mailModel = new MailModel()

if (replaced) {
	Object.assign(mailModel, replaced.mailModel)
}




