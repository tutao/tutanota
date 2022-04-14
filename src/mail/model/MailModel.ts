import m from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {containsEventOfType} from "../../api/common/utils/Utils"
import {groupBy, neverNull, noOp, ofClass, promiseMap, splitInChunks} from "@tutao/tutanota-utils"
import {logins} from "../../api/main/LoginController"
import type {MailBox} from "../../api/entities/tutanota/TypeRefs.js"
import {MailBoxTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import type {MailboxGroupRoot} from "../../api/entities/tutanota/TypeRefs.js"
import {MailboxGroupRootTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import type {GroupInfo} from "../../api/entities/sys/TypeRefs.js"
import {GroupInfoTypeRef} from "../../api/entities/sys/TypeRefs.js"
import type {Group} from "../../api/entities/sys/TypeRefs.js"
import {GroupTypeRef} from "../../api/entities/sys/TypeRefs.js"
import type {MailFolder} from "../../api/entities/tutanota/TypeRefs.js"
import {MailFolderTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import type {MailReportType} from "../../api/common/TutanotaConstants"
import {FeatureType, GroupType, MailFolderType, MAX_NBR_MOVE_DELETE_MAIL_SERVICE, OperationType} from "../../api/common/TutanotaConstants"
import {UserTypeRef} from "../../api/entities/sys/TypeRefs.js"
import type {Mail} from "../../api/entities/tutanota/TypeRefs.js"
import {MailTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import type {EntityUpdateData} from "../../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../../api/main/EventController"
import {lang} from "../../misc/LanguageViewModel"
import {Notifications} from "../../gui/Notifications"
import {findAndApplyMatchingRule} from "./InboxRuleHandler"
import type {WebsocketCounterData} from "../../api/entities/sys/TypeRefs.js"
import type {WorkerClient} from "../../api/main/WorkerClient"
import {EntityClient} from "../../api/common/EntityClient"
import {elementIdPart, getListId, isSameId, listIdPart} from "../../api/common/utils/EntityUtils"
import {NotFoundError} from "../../api/common/error/RestError"
import type {MailFacade} from "../../api/worker/facades/MailFacade"

export type MailboxDetail = {
	mailbox: MailBox
	folders: MailFolder[]
	mailGroupInfo: GroupInfo
	mailGroup: Group
	mailboxGroupRoot: MailboxGroupRoot
}
export type MailboxCounters = Record<Id, Record<string, number>>

export class MailModel {
	/** Empty stream until init() is finished, exposed mostly for map()-ing, use getMailboxDetails to get a promise */
	mailboxDetails: Stream<MailboxDetail[]>
	mailboxCounters: Stream<MailboxCounters>
	_initialization: Promise<any> | null
	_notifications: Notifications
	_eventController: EventController
	_worker: WorkerClient
	_mailFacade: MailFacade
	_entityClient: EntityClient

	constructor(notifications: Notifications, eventController: EventController, worker: WorkerClient, mailFacade: MailFacade, entityClient: EntityClient) {
		this.mailboxDetails = stream()
		this.mailboxCounters = stream({})
		this._initialization = null
		this._notifications = notifications
		this._eventController = eventController
		this._worker = worker
		this._mailFacade = mailFacade
		this._entityClient = entityClient
	}

	init(): Promise<void> {
		if (this._initialization) {
			return this._initialization
		}

		this._eventController.addEntityListener(updates => this.entityEventsReceived(updates))

		this._eventController.countersStream().map(update => {
			this._mailboxCountersUpdates(update)
		})

		return this._init()
	}

	_init(): Promise<void> {
		let mailGroupMemberships = logins.getUserController().getMailGroupMemberships()
		this._initialization = Promise.all(
			mailGroupMemberships.map(mailGroupMembership => {
				return Promise.all([
					this._entityClient.load(MailboxGroupRootTypeRef, mailGroupMembership.group),
					this._entityClient.load(GroupInfoTypeRef, mailGroupMembership.groupInfo),
					this._entityClient.load(GroupTypeRef, mailGroupMembership.group),
				]).then(([mailboxGroupRoot, mailGroupInfo, mailGroup]) => {
					return this._entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox).then(mailbox => {
						return this._loadFolders(neverNull(mailbox.systemFolders).folders, true).then(folders => {
							return {
								mailbox,
								folders,
								mailGroupInfo,
								mailGroup,
								mailboxGroupRoot,
							}
						})
					})
				})
			}),
		).then(details => {
			this.mailboxDetails(details)
		})
		return this._initialization
	}

	_loadFolders(folderListId: Id, loadSubFolders: boolean): Promise<MailFolder[]> {
		return this._entityClient
				   .loadAll(MailFolderTypeRef, folderListId)
				   .then(folders => {
					   if (loadSubFolders) {
						   return promiseMap(folders, folder => this._loadFolders(folder.subFolders, false), {
							   concurrency: 5,
						   }).then(subfolders => {
							   return folders.concat(...subfolders)
						   })
					   } else {
						   return folders
					   }
				   })
				   .then(folders => {
					   return folders.filter(f => {
						   if ((f.folderType === MailFolderType.SPAM || f.folderType === MailFolderType.ARCHIVE) && !logins.isInternalUserLoggedIn()) {
							   return false
						   } else if (logins.isEnabled(FeatureType.InternalCommunication) && f.folderType === MailFolderType.SPAM) {
							   return false
						   } else {
							   return true
						   }
					   })
				   })
	}

	getMailboxDetails(): Promise<Array<MailboxDetail>> {
		return this.init().then(() => {
			return this.mailboxDetails()
		})
	}

	getMailboxDetailsForMail(mail: Mail): Promise<MailboxDetail> {
		return this.getMailboxDetailsForMailListId(mail._id[0])
	}

	getMailboxDetailsForMailListId(mailListId: Id): Promise<MailboxDetail> {
		return this.getMailboxDetails().then(mailboxDetails => neverNull(mailboxDetails.find(md => md.folders.find(f => f.mails === mailListId) != null)))
	}

	getMailboxDetailsForMailGroup(mailGroupId: Id): Promise<MailboxDetail> {
		return this.getMailboxDetails().then(mailboxDetails => neverNull(mailboxDetails.find(md => mailGroupId === md.mailGroup._id)))
	}

	getUserMailboxDetails(): Promise<MailboxDetail> {
		let userMailGroupMembership = logins.getUserController().getUserMailGroupMembership()
		return this.getMailboxDetails().then(mailboxDetails => neverNull(mailboxDetails.find(md => md.mailGroup._id === userMailGroupMembership.group)))
	}

	getMailboxFolders(mail: Mail): Promise<MailFolder[]> {
		return this.getMailboxDetailsForMail(mail).then(md => md.folders)
	}

	getMailFolder(mailListId: Id): MailFolder | null {
		const mailboxDetails = this.mailboxDetails() || []

		for (let e of mailboxDetails) {
			for (let f of e.folders) {
				if (f.mails === mailListId) {
					return f
				}
			}
		}

		return null
	}

	async reportMails(reportType: MailReportType, mails: ReadonlyArray<Mail>): Promise<void> {
		for (const mail of mails) {
			await this._mailFacade.reportMail(mail, reportType)
					  .catch(ofClass(NotFoundError, e => console.log("mail to be reported not found", e)))
		}
	}

	/**
	 * Finally deletes all given mails. Caller must ensure that mails are only from one folder
	 */
	async _moveMails(mails: Mail[], targetMailFolder: MailFolder): Promise<void> {
		let moveMails = mails.filter(m => m._id[0] !== targetMailFolder.mails && targetMailFolder._ownerGroup === m._ownerGroup) // prevent moving mails between mail boxes.

		// Do not move if target is the same as the current mailFolder
		const sourceMailFolder = this.getMailFolder(getListId(mails[0]))

		if (moveMails.length > 0 && sourceMailFolder && !isSameId(targetMailFolder._id, sourceMailFolder._id)) {
			const mailChunks = splitInChunks(MAX_NBR_MOVE_DELETE_MAIL_SERVICE, mails.map(m => m._id))

			for (const mailChunk of mailChunks) {
				await this._mailFacade.moveMails(mailChunk, targetMailFolder._id)
			}
		}
	}

	/**
	 * Preferably use moveMails() in MailGuiUtils.js which has built-in error handling
	 * @throws PreconditionFailedError or LockedError if operation is locked on the server
	 */
	async moveMails(mails: ReadonlyArray<Mail>, targetMailFolder: MailFolder): Promise<void> {
		const mailsPerFolder = groupBy(mails, mail => {
			return getListId(mail)
		})

		for (const [listId, mails] of mailsPerFolder) {
			const sourceMailFolder = this.getMailFolder(listId)

			if (sourceMailFolder) {
				await this._moveMails(mails, targetMailFolder)
			} else {
				console.log("Move mail: no mail folder for list id", listId)
			}
		}
	}

	/**
	 * Finally deletes the given mails if they are already in the trash or spam folders,
	 * otherwise moves them to the trash folder.
	 * A deletion confirmation must have been show before.
	 */
	async deleteMails(mails: ReadonlyArray<Mail>): Promise<void> {
		const mailsPerFolder = groupBy(mails, mail => {
			return getListId(mail)
		})

		for (const [listId, mails] of mailsPerFolder) {
			const sourceMailFolder = this.getMailFolder(listId)

			if (sourceMailFolder) {
				if (this.isFinalDelete(sourceMailFolder)) {
					await this._finallyDeleteMails(mails)
				} else {
					await this.getMailboxFolders(mails[0]).then(folders => this._moveMails(mails, this.getTrashFolder(folders)))
				}
			} else {
				console.log("Delete mail: no mail folder for list id", listId)
			}
		}
	}

	/**
	 * Finally deletes all given mails. Caller must ensure that mails are only from one folder and the folder must allow final delete operation.
	 */
	async _finallyDeleteMails(mails: Mail[]): Promise<void> {
		if (!mails.length) return Promise.resolve()
		const mailFolder = neverNull(this.getMailFolder(getListId(mails[0])))
		const mailIds = mails.map(m => m._id)
		const mailChunks = splitInChunks(MAX_NBR_MOVE_DELETE_MAIL_SERVICE, mailIds)

		for (const mailChunk of mailChunks) {
			await this._mailFacade.deleteMails(mailChunk, mailFolder._id)
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
				await this._init()
				m.redraw()
			} else if (isUpdateForTypeRef(GroupInfoTypeRef, update)) {
				if (update.operation === OperationType.UPDATE) {
					await this._init()
					m.redraw
				}
			} else if (isUpdateForTypeRef(UserTypeRef, update)) {
				if (update.operation === OperationType.UPDATE && isSameId(logins.getUserController().user._id, update.instanceId)) {
					const updatedUser = await this._entityClient.load(UserTypeRef, update.instanceId)
					let newMemberships = updatedUser.memberships.filter(membership => membership.groupType === GroupType.Mail)
					const mailboxDetails = await this.getMailboxDetails()

					if (newMemberships.length !== mailboxDetails.length) {
						await this._init()
						m.redraw()
					}
				}
			} else if (isUpdateForTypeRef(MailTypeRef, update) && update.operation === OperationType.CREATE) {
				const folder = this.getMailFolder(update.instanceListId)

				if (folder && folder.folderType === MailFolderType.INBOX && !containsEventOfType(updates, OperationType.DELETE, update.instanceId)) {
					// If we don't find another delete operation on this email in the batch, then it should be a create operation,
					// otherwise it's a move
					const mailId: IdTuple = [update.instanceListId, update.instanceId]
					const mail = await this._entityClient.load(MailTypeRef, mailId)
					await this.getMailboxDetailsForMailListId(update.instanceListId)
							  .then(mailboxDetail => {
								  // We only apply rules on server if we are the leader in case of incoming messages
								  return findAndApplyMatchingRule(this._mailFacade, this._entityClient, mailboxDetail, mail, this._worker.isLeader())
							  })
							  .then(newId => this._showNotification(newId || mailId))
							  .catch(noOp)
				}
			}
		}
	}

	_mailboxCountersUpdates(counters: WebsocketCounterData) {
		const normalized = this.mailboxCounters() || {}
		const group = normalized[counters.mailGroup] || {}
		counters.counterValues.forEach(value => {
			group[value.mailListId] = Number(value.count) || 0
		})
		normalized[counters.mailGroup] = group
		this.mailboxCounters(normalized)
	}

	_showNotification(mailId: IdTuple) {
		this._notifications.showNotification(
			lang.get("newMails_msg"),
			{
				actions: [],
			},
			e => {
				m.route.set(`/mail/${listIdPart(mailId)}/${elementIdPart(mailId)}`)
				window.focus()
			},
		)
	}

	getCounterValue(listId: Id): Promise<number | null> {
		return this.getMailboxDetailsForMailListId(listId)
				   .then(mailboxDetails => {
					   const counters = this.mailboxCounters()
					   const mailGroupCounter = counters[mailboxDetails.mailGroup._id]
					   return mailGroupCounter && mailGroupCounter[listId]
				   })
				   .catch(() => null)
	}

	checkMailForPhishing(
		mail: Mail,
		links: Array<{
			href: string
			innerHTML: string
		}>,
	): Promise<boolean> {
		return this._mailFacade.checkMailForPhishing(mail, links)
	}

	getTrashFolder(folders: MailFolder[]): MailFolder {
		return folders.find(f => f.folderType === MailFolderType.TRASH) as any
	}

	isFinalDelete(folder: MailFolder | null): boolean {
		return folder != null && (folder.folderType === MailFolderType.TRASH || folder.folderType === MailFolderType.SPAM)
	}

	async deleteFolder(folder: MailFolder): Promise<void> {
		await this._mailFacade.deleteFolder(folder._id)
	}

	async fixupCounterForMailList(listId: Id, unreadMails: number) {
		const mailboxDetails = await this.getMailboxDetailsForMailListId(listId)
		await this._mailFacade.fixupCounterForMailList(mailboxDetails.mailGroup._id, listId, unreadMails)
	}

	async clearFolder(folder: MailFolder): Promise<void> {
		await this._mailFacade.clearFolder(folder._id)
	}

	async unsubscribe(mail: Mail, recipient: string, headers: string[]) {
		await this._mailFacade.unsubscribe(mail._id, recipient, headers)
	}
}