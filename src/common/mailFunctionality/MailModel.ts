import {
	createMailAddressProperties,
	createMailboxProperties,
	Mail,
	MailBox,
	MailboxGroupRoot,
	MailboxGroupRootTypeRef,
	MailboxProperties,
	MailboxPropertiesTypeRef,
	MailBoxTypeRef,
	MailFolder,
	MailFolderTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../api/entities/tutanota/TypeRefs.js"
import { Group, GroupInfo, GroupInfoTypeRef, GroupMembership, GroupTypeRef, WebsocketCounterData } from "../api/entities/sys/TypeRefs.js"
import { FolderSystem } from "../api/common/mail/FolderSystem.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { Notifications, NotificationType } from "../gui/Notifications.js"
import { EventController } from "../api/main/EventController.js"
import { MailFacade } from "../api/worker/facades/lazy/MailFacade.js"
import { EntityClient } from "../api/common/EntityClient.js"
import { LoginController } from "../api/main/LoginController.js"
import { WebsocketConnectivityModel } from "../misc/WebsocketConnectivityModel.js"
import { InboxRuleHandler } from "../../mail-app/mail/model/InboxRuleHandler.js"
import { assertNotNull, groupBy, isNotEmpty, lazyMemoized, neverNull, noOp, ofClass, promiseMap, splitInChunks } from "@tutao/tutanota-utils"
import {
	FeatureType,
	MailReportType,
	MailSetKind,
	MAX_NBR_MOVE_DELETE_MAIL_SERVICE,
	OperationType,
	ReportMovedMailsType,
} from "../api/common/TutanotaConstants.js"
import { assertSystemFolderOfType, getEnabledMailAddressesWithUser } from "./SharedMailUtils.js"
import { LockedError, NotFoundError, PreconditionFailedError } from "../api/common/error/RestError.js"
import { CUSTOM_MIN_ID, elementIdPart, GENERATED_MAX_ID, getElementId, getListId, isSameId } from "../api/common/utils/EntityUtils.js"
import { containsEventOfType, EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"
import m from "mithril"
import { lang } from "../misc/LanguageViewModel.js"
import { ProgrammingError } from "../api/common/error/ProgrammingError.js"
import { UserError } from "../api/main/UserError.js"
import { isSpamOrTrashFolder } from "../api/common/CommonMailUtils.js"

export type MailboxDetail = {
	mailbox: MailBox
	folders: FolderSystem
	mailGroupInfo: GroupInfo
	mailGroup: Group
	mailboxGroupRoot: MailboxGroupRoot
}

export type MailboxCounters = Record<Id, Record<string, number>>

export class MailModel {
	/** Empty stream until init() is finished, exposed mostly for map()-ing, use getMailboxDetails to get a promise */
	readonly mailboxDetails: Stream<MailboxDetail[]> = stream()
	readonly mailboxCounters: Stream<MailboxCounters> = stream({})
	private initialization: Promise<void> | null = null
	/**
	 * Map from MailboxGroupRoot id to MailboxProperties
	 * A way to avoid race conditions in case we try to create mailbox properties from multiple places.
	 *
	 */
	private mailboxPropertiesPromises: Map<Id, Promise<MailboxProperties>> = new Map()

	constructor(
		private readonly notifications: Notifications,
		private readonly eventController: EventController,
		private readonly mailFacade: MailFacade,
		private readonly entityClient: EntityClient,
		private readonly logins: LoginController,
		private readonly connectivityModel: WebsocketConnectivityModel | null,
		private readonly inboxRuleHandler: InboxRuleHandler | null,
	) {}

	// only init listeners once
	private readonly initListeners = lazyMemoized(() => {
		this.eventController.addEntityListener((updates, eventOwnerGroupId) => this.entityEventsReceived(updates, eventOwnerGroupId))

		this.eventController.getCountersStream().map((update) => {
			this._mailboxCountersUpdates(update)
		})
	})

	init(): Promise<void> {
		// if we are in the process of loading do not start another one in parallel
		if (this.initialization) {
			return this.initialization
		}
		this.initListeners()

		return this._init()
	}

	private _init(): Promise<void> {
		const mailGroupMemberships = this.logins.getUserController().getMailGroupMemberships()
		const mailBoxDetailsPromises = mailGroupMemberships.map((m) => this.mailboxDetailsFromMembership(m))
		this.initialization = Promise.all(mailBoxDetailsPromises).then((details) => {
			this.mailboxDetails(details)
		})
		return this.initialization.catch((e) => {
			console.warn("mail model initialization failed!", e)
			this.initialization = null
			throw e
		})
	}

	/**
	 * load mailbox details from a mailgroup membership
	 */
	private async mailboxDetailsFromMembership(membership: GroupMembership): Promise<MailboxDetail> {
		const [mailboxGroupRoot, mailGroupInfo, mailGroup] = await Promise.all([
			this.entityClient.load(MailboxGroupRootTypeRef, membership.group),
			this.entityClient.load(GroupInfoTypeRef, membership.groupInfo),
			this.entityClient.load(GroupTypeRef, membership.group),
		])
		const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
		const folders = await this.loadFolders(neverNull(mailbox.folders).folders)
		return {
			mailbox,
			folders: new FolderSystem(folders),
			mailGroupInfo,
			mailGroup,
			mailboxGroupRoot,
		}
	}

	private loadFolders(folderListId: Id): Promise<MailFolder[]> {
		return this.entityClient.loadAll(MailFolderTypeRef, folderListId).then((folders) => {
			return folders.filter((f) => {
				// We do not show spam or archive for external users
				if (!this.logins.isInternalUserLoggedIn() && (f.folderType === MailSetKind.SPAM || f.folderType === MailSetKind.ARCHIVE)) {
					return false
				} else {
					return !(this.logins.isEnabled(FeatureType.InternalCommunication) && f.folderType === MailSetKind.SPAM)
				}
			})
		})
	}

	/**
	 * Get the list of MailboxDetails that this user has access to from their memberships.
	 *
	 * Will wait for successful initialization.
	 */
	async getMailboxDetails(): Promise<Array<MailboxDetail>> {
		// If details are there, use them
		if (this.mailboxDetails()) {
			return this.mailboxDetails()
		} else {
			// If they are not there, trigger loading again (just in case) but do not fail and wait until we actually have the details.
			// This is so that the rest of the app is not in the broken state if details fail to load but is just waiting until the success.
			return new Promise((resolve) => {
				this.init()
				const end = this.mailboxDetails.map((details) => {
					resolve(details)
					end.end(true)
				})
			})
		}
	}

	async getMailboxDetailsForMail(mail: Mail): Promise<MailboxDetail | null> {
		const mailboxDetails = await this.getMailboxDetails()
		const detail = mailboxDetails.find((md) => md.folders.getFolderByMail(mail)) ?? null
		if (detail == null) {
			console.warn("Mailbox detail for mail does not exist", mail)
		}
		return detail
	}

	async getMailboxDetailsForMailFolder(mailFolder: MailFolder): Promise<MailboxDetail | null> {
		const mailboxDetails = await this.getMailboxDetails()
		const detail = mailboxDetails.find((md) => md.folders.getFolderById(getElementId(mailFolder))) ?? null
		if (detail == null) {
			console.warn("Mailbox detail for mail folder does not exist", mailFolder)
		}
		return detail
	}

	async getMailboxDetailsForMailGroup(mailGroupId: Id): Promise<MailboxDetail> {
		const mailboxDetails = await this.getMailboxDetails()
		return assertNotNull(
			mailboxDetails.find((md) => mailGroupId === md.mailGroup._id),
			"Mailbox detail for mail group does not exist",
		)
	}

	async getUserMailboxDetails(): Promise<MailboxDetail> {
		const userMailGroupMembership = this.logins.getUserController().getUserMailGroupMembership()
		const mailboxDetails = await this.getMailboxDetails()
		return assertNotNull(
			mailboxDetails.find((md) => md.mailGroup._id === userMailGroupMembership.group),
			"Mailbox detail for user does not exist",
		)
	}

	async getMailboxFolders(mail: Mail): Promise<FolderSystem | null> {
		return this.getMailboxDetailsForMail(mail).then((md) => md && md.folders)
	}

	getMailFolderForMail(mail: Mail): MailFolder | null {
		const mailboxDetails = this.mailboxDetails() || []

		let foundFolder: MailFolder | null = null
		for (let detail of mailboxDetails) {
			if (isNotEmpty(mail.sets)) {
				foundFolder = detail.folders.getFolderById(elementIdPart(mail.sets[0]))
			} else {
				foundFolder = detail.folders.getFolderByMail(mail)
			}

			if (foundFolder != null) return foundFolder
		}
		return null
	}

	/**
	 * Sends the given folder and all its descendants to the spam folder, reporting mails (if applicable) and removes any empty folders
	 */
	async sendFolderToSpam(folder: MailFolder): Promise<void> {
		const mailboxDetail = await this.getMailboxDetailsForMailFolder(folder)
		if (mailboxDetail == null) {
			return
		}

		let deletedFolder = await this.removeAllEmpty(mailboxDetail, folder)
		if (!deletedFolder) {
			return this.mailFacade.updateMailFolderParent(folder, assertSystemFolderOfType(mailboxDetail.folders, MailSetKind.SPAM)._id)
		}
	}

	async reportMails(reportType: MailReportType, mails: ReadonlyArray<Mail>): Promise<void> {
		for (const mail of mails) {
			await this.mailFacade.reportMail(mail, reportType).catch(ofClass(NotFoundError, (e) => console.log("mail to be reported not found", e)))
		}
	}

	/**
	 * Finally move all given mails. Caller must ensure that mails are only from
	 * * one folder (because we send one source folder)
	 * * from one list (for locking it on the server)
	 */
	async _moveMails(mails: Mail[], targetMailFolder: MailFolder): Promise<void> {
		// Do not move if target is the same as the current mailFolder
		const sourceMailFolder = this.getMailFolderForMail(mails[0])
		let moveMails = mails.filter((m) => sourceMailFolder !== targetMailFolder && targetMailFolder._ownerGroup === m._ownerGroup) // prevent moving mails between mail boxes.

		if (moveMails.length > 0 && sourceMailFolder && !isSameId(targetMailFolder._id, sourceMailFolder._id)) {
			const mailChunks = splitInChunks(
				MAX_NBR_MOVE_DELETE_MAIL_SERVICE,
				mails.map((m) => m._id),
			)

			for (const mailChunk of mailChunks) {
				await this.mailFacade.moveMails(mailChunk, sourceMailFolder._id, targetMailFolder._id)
			}
		}
	}

	/**
	 * Preferably use moveMails() in MailGuiUtils.js which has built-in error handling
	 * @throws PreconditionFailedError or LockedError if operation is locked on the server
	 */
	async moveMails(mails: ReadonlyArray<Mail>, targetMailFolder: MailFolder): Promise<void> {
		const mailsPerFolder = groupBy(mails, (mail) => {
			return isNotEmpty(mail.sets) ? elementIdPart(mail.sets[0]) : getListId(mail)
		})

		for (const [folderId, mailsInFolder] of mailsPerFolder) {
			const sourceMailFolder = this.getMailFolderForMail(mailsInFolder[0])

			if (sourceMailFolder) {
				// group another time because mails in the same Set can be from different mail bags.
				const mailsPerList = groupBy(mailsInFolder, (mail) => getListId(mail))
				for (const [listId, mailsInList] of mailsPerList) {
					await this._moveMails(mailsInList, targetMailFolder)
				}
			} else {
				console.log("Move mail: no mail folder for folder id", folderId)
			}
		}
	}

	isMovingMailsAllowed(): boolean {
		return this.logins.getUserController().isInternalUser()
	}

	isExportingMailsAllowed(): boolean {
		return !this.logins.isEnabled(FeatureType.DisableMailExport)
	}

	async markMails(mails: readonly Mail[], unread: boolean): Promise<void> {
		await promiseMap(
			mails,
			async (mail) => {
				if (mail.unread !== unread) {
					mail.unread = unread
					return this.entityClient.update(mail).catch(ofClass(NotFoundError, noOp)).catch(ofClass(LockedError, noOp))
				}
			},
			{ concurrency: 5 },
		)
	}

	/**
	 * Finally deletes the given mails if they are already in the trash or spam folders,
	 * otherwise moves them to the trash folder.
	 * A deletion confirmation must have been show before.
	 */
	async deleteMails(mails: ReadonlyArray<Mail>): Promise<void> {
		if (mails.length === 0) {
			return
		}

		const mailsPerFolder = groupBy(mails, (mail) => {
			return isNotEmpty(mail.sets) ? elementIdPart(mail.sets[0]) : getListId(mail)
		})

		const folders = await this.getMailboxFolders(mails[0])
		if (folders == null) {
			return
		}
		const trashFolder = assertNotNull(folders.getSystemFolderByType(MailSetKind.TRASH))

		for (const [folder, mailsInFolder] of mailsPerFolder) {
			const sourceMailFolder = this.getMailFolderForMail(mailsInFolder[0])

			const mailsPerList = groupBy(mailsInFolder, (mail) => getListId(mail))
			for (const [listId, mailsInList] of mailsPerList) {
				if (sourceMailFolder) {
					if (isSpamOrTrashFolder(folders, sourceMailFolder)) {
						await this._finallyDeleteMails(mailsInList)
					} else {
						await this._moveMails(mailsInList, trashFolder)
					}
				} else {
					console.log("Delete mail: no mail folder for list id", folder)
				}
			}
		}
	}

	/**
	 * Finally deletes all given mails. Caller must ensure that mails are only from one folder and the folder must allow final delete operation.
	 */
	async _finallyDeleteMails(mails: Mail[]): Promise<void> {
		if (!mails.length) return Promise.resolve()
		const mailFolder = neverNull(this.getMailFolderForMail(mails[0]))
		const mailIds = mails.map((m) => m._id)
		const mailChunks = splitInChunks(MAX_NBR_MOVE_DELETE_MAIL_SERVICE, mailIds)

		for (const mailChunk of mailChunks) {
			await this.mailFacade.deleteMails(mailChunk, mailFolder._id)
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
				await this._init()
				m.redraw()
			} else if (isUpdateForTypeRef(GroupInfoTypeRef, update)) {
				if (update.operation === OperationType.UPDATE) {
					await this._init()
					m.redraw
				}
			} else if (this.logins.getUserController().isUpdateForLoggedInUserInstance(update, eventOwnerGroupId)) {
				let newMemberships = this.logins.getUserController().getMailGroupMemberships()
				const mailboxDetails = await this.getMailboxDetails()

				if (newMemberships.length !== mailboxDetails.length) {
					await this._init()
					m.redraw()
				}
			} else if (
				isUpdateForTypeRef(MailTypeRef, update) &&
				update.operation === OperationType.CREATE &&
				!containsEventOfType(updates, OperationType.DELETE, update.instanceId)
			) {
				if (this.inboxRuleHandler && this.connectivityModel) {
					const mailId: IdTuple = [update.instanceListId, update.instanceId]
					try {
						const mail = await this.entityClient.load(MailTypeRef, mailId)
						const folder = this.getMailFolderForMail(mail)

						if (folder && folder.folderType === MailSetKind.INBOX) {
							// If we don't find another delete operation on this email in the batch, then it should be a create operation,
							// otherwise it's a move
							await this.getMailboxDetailsForMail(mail)
								.then((mailboxDetail) => {
									// We only apply rules on server if we are the leader in case of incoming messages
									return (
										mailboxDetail &&
										this.inboxRuleHandler?.findAndApplyMatchingRule(
											mailboxDetail,
											mail,
											this.connectivityModel ? this.connectivityModel.isLeader() : false,
										)
									)
								})
								.then((newFolderAndMail) => {
									if (newFolderAndMail) {
										this._showNotification(newFolderAndMail.folder, newFolderAndMail.mail)
									} else {
										this._showNotification(folder, mail)
									}
								})
								.catch(noOp)
						}
					} catch (e) {
						if (e instanceof NotFoundError) {
							console.log(`Could not find updated mail ${JSON.stringify(mailId)}`)
						} else {
							throw e
						}
					}
				}
			}
		}
	}

	_mailboxCountersUpdates(counters: WebsocketCounterData) {
		const normalized = this.mailboxCounters() || {}
		const group = normalized[counters.mailGroup] || {}
		for (const value of counters.counterValues) {
			group[value.counterId] = Number(value.count) || 0
		}
		normalized[counters.mailGroup] = group
		this.mailboxCounters(normalized)
	}

	_showNotification(folder: MailFolder, mail: Mail) {
		this.notifications.showNotification(
			NotificationType.Mail,
			lang.get("newMails_msg"),
			{
				actions: [],
			},
			(_) => {
				m.route.set(`/mail/${getElementId(folder)}/${getElementId(mail)}`)
				window.focus()
			},
		)
	}

	getCounterValue(folder: MailFolder): Promise<number | null> {
		return this.getMailboxDetailsForMailFolder(folder)
			.then((mailboxDetails) => {
				if (mailboxDetails == null) {
					return null
				} else {
					const mailGroupCounter = this.mailboxCounters()[mailboxDetails.mailGroup._id]
					if (mailGroupCounter) {
						const counterId = folder.isMailSet ? getElementId(folder) : folder.mails
						return mailGroupCounter[counterId]
					} else {
						return null
					}
				}
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
		return this.mailFacade.checkMailForPhishing(mail, links)
	}

	/**
	 * Sends the given folder and all its descendants to the trash folder, removes any empty folders
	 */
	async trashFolderAndSubfolders(folder: MailFolder): Promise<void> {
		const mailboxDetail = await this.getMailboxDetailsForMailFolder(folder)
		if (mailboxDetail == null) {
			return
		}
		let deletedFolder = await this.removeAllEmpty(mailboxDetail, folder)
		if (!deletedFolder) {
			const trash = assertSystemFolderOfType(mailboxDetail.folders, MailSetKind.TRASH)
			return this.mailFacade.updateMailFolderParent(folder, trash._id)
		}
	}

	/**
	 * This is called when moving a folder to SPAM or TRASH, which do not allow empty folders (since only folders that contain mail are allowed)
	 */
	private async removeAllEmpty(mailboxDetail: MailboxDetail, folder: MailFolder): Promise<boolean> {
		// sort descendants deepest first so that we can clean them up before checking their ancestors
		const descendants = mailboxDetail.folders.getDescendantFoldersOfParent(folder._id).sort((l, r) => r.level - l.level)

		// we completely delete empty folders
		let someNonEmpty = false
		// we don't update folder system quickly enough so we keep track of deleted folders here and consider them "empty" when all their children are here
		const deleted = new Set<Id>()
		for (const descendant of descendants) {
			if (
				(await this.isEmptyFolder(descendant.folder)) &&
				mailboxDetail.folders.getCustomFoldersOfParent(descendant.folder._id).every((f) => deleted.has(getElementId(f)))
			) {
				deleted.add(getElementId(descendant.folder))
				await this.finallyDeleteCustomMailFolder(descendant.folder)
			} else {
				someNonEmpty = true
			}
		}
		if (
			(await this.isEmptyFolder(folder)) &&
			mailboxDetail.folders.getCustomFoldersOfParent(folder._id).every((f) => deleted.has(getElementId(f))) &&
			!someNonEmpty
		) {
			await this.finallyDeleteCustomMailFolder(folder)
			return true
		} else {
			return false
		}
	}

	// Only load one mail, if there is even one we won't remove
	private async isEmptyFolder(descendant: MailFolder) {
		if (descendant.isMailSet) {
			return (await this.entityClient.loadRange(MailSetEntryTypeRef, descendant.entries, CUSTOM_MIN_ID, 1, false)).length === 0
		} else {
			return (await this.entityClient.loadRange(MailTypeRef, descendant.mails, GENERATED_MAX_ID, 1, true)).length === 0
		}
	}

	public async finallyDeleteCustomMailFolder(folder: MailFolder): Promise<void> {
		if (folder.folderType !== MailSetKind.CUSTOM) {
			throw new ProgrammingError("Cannot delete non-custom folder: " + String(folder._id))
		}

		return await this.mailFacade
			.deleteFolder(folder._id)
			.catch(ofClass(NotFoundError, () => console.log("mail folder already deleted")))
			.catch(
				ofClass(PreconditionFailedError, () => {
					throw new UserError("operationStillActive_msg")
				}),
			)
	}

	async fixupCounterForFolder(folder: MailFolder, unreadMails: number) {
		const mailboxDetails = await this.getMailboxDetailsForMailFolder(folder)
		if (mailboxDetails) {
			await this.mailFacade.fixupCounterForFolder(mailboxDetails.mailGroup._id, folder, unreadMails)
		}
	}

	async clearFolder(folder: MailFolder): Promise<void> {
		await this.mailFacade.clearFolder(folder._id)
	}

	async unsubscribe(mail: Mail, recipient: string, headers: string[]) {
		await this.mailFacade.unsubscribe(mail._id, recipient, headers)
	}

	async getMailboxProperties(mailboxGroupRoot: MailboxGroupRoot): Promise<MailboxProperties> {
		// MailboxProperties is an encrypted instance that is created lazily. When we create it the reference is automatically written to the MailboxGroupRoot.
		// Unfortunately we will only get updated new MailboxGroupRoot with the next EntityUpdate.
		// To prevent parallel creation attempts we do two things:
		//  - we save the loading promise to avoid calling setup() twice in parallel
		//  - we set mailboxProperties reference manually (we could save the id elsewhere but it's easier this way)

		// If we are already loading/creating, just return it to avoid races
		const existingPromise = this.mailboxPropertiesPromises.get(mailboxGroupRoot._id)
		if (existingPromise) {
			return existingPromise
		}

		const promise: Promise<MailboxProperties> = this.loadOrCreateMailboxProperties(mailboxGroupRoot)
		this.mailboxPropertiesPromises.set(mailboxGroupRoot._id, promise)
		return promise.finally(() => this.mailboxPropertiesPromises.delete(mailboxGroupRoot._id))
	}

	private async loadOrCreateMailboxProperties(mailboxGroupRoot: MailboxGroupRoot): Promise<MailboxProperties> {
		if (!mailboxGroupRoot.mailboxProperties) {
			mailboxGroupRoot.mailboxProperties = await this.entityClient
				.setup(
					null,
					createMailboxProperties({
						_ownerGroup: mailboxGroupRoot._ownerGroup ?? "",
						reportMovedMails: "0",
						mailAddressProperties: [],
					}),
				)
				.catch(
					ofClass(PreconditionFailedError, (e) => {
						// We try to prevent race conditions but they can still happen with multiple clients trying ot create mailboxProperties at the same time.
						// We send special precondition from the server with an existing id.
						if (e.data && e.data.startsWith("exists:")) {
							const existingId = e.data.substring("exists:".length)
							console.log("mailboxProperties already exists", existingId)
							return existingId
						} else {
							throw new ProgrammingError(`Could not create mailboxProperties, precondition: ${e.data}`)
						}
					}),
				)
		}
		const mailboxProperties = await this.entityClient.load(MailboxPropertiesTypeRef, mailboxGroupRoot.mailboxProperties)
		if (mailboxProperties.mailAddressProperties.length === 0) {
			await this.migrateFromOldSenderName(mailboxGroupRoot, mailboxProperties)
		}
		return mailboxProperties
	}

	/** If there was no sender name configured before take the user's name and assign it to all email addresses. */
	private async migrateFromOldSenderName(mailboxGroupRoot: MailboxGroupRoot, mailboxProperties: MailboxProperties) {
		const userGroupInfo = this.logins.getUserController().userGroupInfo
		const legacySenderName = userGroupInfo.name
		const mailboxDetails = await this.getMailboxDetailsForMailGroup(mailboxGroupRoot._id)
		const mailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, userGroupInfo)
		for (const mailAddress of mailAddresses) {
			mailboxProperties.mailAddressProperties.push(
				createMailAddressProperties({
					mailAddress,
					senderName: legacySenderName,
				}),
			)
		}
		await this.entityClient.update(mailboxProperties)
	}

	async saveReportMovedMails(mailboxGroupRoot: MailboxGroupRoot, reportMovedMails: ReportMovedMailsType): Promise<MailboxProperties> {
		const mailboxProperties = await this.loadOrCreateMailboxProperties(mailboxGroupRoot)
		mailboxProperties.reportMovedMails = reportMovedMails
		await this.entityClient.update(mailboxProperties)
		return mailboxProperties
	}
}
