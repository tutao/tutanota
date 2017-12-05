//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {neverNull} from "../api/common/utils/Utils"
import {createMoveMailData} from "../api/entities/tutanota/MoveMailData"
import {serviceRequestVoid, loadAll, load} from "../api/main/Entity"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {HttpMethod, isSameTypeRef, isSameId} from "../api/common/EntityFunctions"
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
import {OperationType, MailFolderType, FeatureType, GroupType} from "../api/common/TutanotaConstants"
import {module as replaced} from "@hot"
import {UserTypeRef} from "../api/entities/sys/User"
import {locator} from "../api/main/MainLocator"

export type MailboxDetail ={
	mailbox: MailBox,
	folders: MailFolder[],
	mailGroupInfo: GroupInfo,
	mailGroup: Group
}

class MailModel {

	_details: stream<MailboxDetail[]>
	_initialization: ?Promise<void>

	constructor() {
		this._details = stream([])
		this._initialization = null

		locator.entityEvent.addListener((typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum) => this.entityEventReceived(typeRef, listId, elementId, operation))
	}

	init(): Promise<void> {
		if (this._initialization) {
			return this._initialization
		}

		let mailGroupMemberships = logins.getUserController().getMailGroupMemberships()
		this._initialization = Promise.all(mailGroupMemberships.map(mailGroupMembership => {
			return Promise.all([
				load(MailboxGroupRootTypeRef, mailGroupMembership.group).then(mailGroupRoot => load(MailBoxTypeRef, mailGroupRoot.mailbox)),
				load(GroupInfoTypeRef, mailGroupMembership.groupInfo),
				load(GroupTypeRef, mailGroupMembership.group)
			]).spread((mailbox, mailGroupInfo, mailGroup) => {
				return this._loadFolders(neverNull(mailbox.systemFolders).folders, true).then(folders => {
					return {
						mailbox,
						folders,
						mailGroupInfo,
						mailGroup
					}
				})
			})
		})).then(details => {
			this._details(details)
		}).return()
		return this._initialization
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
		}).then(folders => {
			return folders.filter(f => {
				if (f.folderType == MailFolderType.SPAM && !logins.isInternalUserLoggedIn()) {
					return false
				} else if (logins.isEnabled(FeatureType.InternalCommunication) && f.folderType === MailFolderType.SPAM) {
					return false
				} else {
					return true
				}
			})
		})
	}

	getMailboxDetails(mail: Mail): MailboxDetail {
		return this.getMailboxDetailsForMailListId(mail._id[0])
	}

	getMailboxDetailsForMailListId(mailListId: Id): MailboxDetail {
		return neverNull(this._details().find((md) => md.folders.find(f => f.mails == mailListId) != null))
	}

	getMailboxDetailsForMailGroup(mailGroupId: Id): MailboxDetail {
		return neverNull(this._details().find((md) => mailGroupId == md.mailGroup._id))
	}

	getUserMailboxDetails(): MailboxDetail {
		let userMailGroupMembership = logins.getUserController().getUserMailGroupMembership()
		return neverNull(this._details().find(md => md.mailGroup._id == userMailGroupMembership.group))
	}

	getMailboxFolders(mail: Mail): MailFolder[] {
		return this.getMailboxDetails(mail).folders
	}

	getMailFolder(mailListId: Id): ?MailFolder {
		for (let e of this._details()) {
			for (let f of e.folders) {
				if (f.mails == mailListId) {
					return f
				}
			}
		}
		return null
	}

	moveMails(mails: Mail[], target: MailFolder): Promise<void> {
		let moveMails = mails.filter(m => m._id[0] != target.mails && target._ownerGroup == m._ownerGroup) // prevent moving mails between mail boxes.
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
			isFinallyDeleteAllowed(mailModel.getMailFolder(mail._id[0])) ? all.trash.push(mail) : all.move.push(mail)
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
		if (isSameTypeRef(typeRef, MailFolderTypeRef)) {
			this._initialization = null
			this.init().then(() => m.redraw())
		} else if (isSameTypeRef(typeRef, GroupInfoTypeRef)) {
			if (operation == OperationType.UPDATE) {
				this._initialization = null
				this.init().then(() => m.redraw())
			}
		} else if (isSameTypeRef(typeRef, UserTypeRef)) {
			if (operation == OperationType.UPDATE && isSameId(logins.getUserController().user._id, elementId)) {
				load(UserTypeRef, elementId).then(updatedUser => {
					let newMemberships = updatedUser.memberships.filter(membership => membership.groupType == GroupType.Mail)
					let currentDetails = this._details()
					if (newMemberships.length != currentDetails.length) {
						this._initialization = null
						this.init().then(() => m.redraw())
					}
				})
			}
		}
	}

}


export const mailModel = new MailModel()

if (replaced) {
	Object.assign(mailModel, replaced.mailModel)
}




