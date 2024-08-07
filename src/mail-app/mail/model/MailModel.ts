import Stream from "mithril/stream"
import stream from "mithril/stream"
import { MailboxCounters, MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { FolderSystem, type IndentedFolder } from "../../../common/api/common/mail/FolderSystem.js"
import { assertNotNull, first, groupBy, lazyMemoized, neverNull, noOp, ofClass, promiseMap, splitInChunks } from "@tutao/tutanota-utils"
import { Mail, MailboxGroupRoot, MailboxProperties, MailFolder, MailFolderTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import {
	FeatureType,
	MailFolderType,
	MailReportType,
	MAX_NBR_MOVE_DELETE_MAIL_SERVICE,
	OperationType,
	ReportMovedMailsType,
} from "../../../common/api/common/TutanotaConstants.js"
import { elementIdPart, GENERATED_MAX_ID, getElementId, getListId, isSameId, listIdPart } from "../../../common/api/common/utils/EntityUtils.js"
import { FolderInfo } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { containsEventOfType, EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import m from "mithril"
import { WebsocketCounterData } from "../../../common/api/entities/sys/TypeRefs.js"
import { Notifications, NotificationType } from "../../../common/gui/Notifications.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { LockedError, NotFoundError, PreconditionFailedError } from "../../../common/api/common/error/RestError.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { EventController } from "../../../common/api/main/EventController.js"
import { InboxRuleHandler } from "./InboxRuleHandler.js"
import { WebsocketConnectivityModel } from "../../../common/misc/WebsocketConnectivityModel.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { mailLocator } from "../../mailLocator.js"

export class MailModel {
	readonly mailboxCounters: Stream<MailboxCounters> = stream({})
	readonly folders: Stream<Record<Id, FolderSystem>> = stream()

	constructor(
		private readonly notifications: Notifications,
		private readonly mailboxModel: MailboxModel,
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
		private readonly logins: LoginController,
		private readonly mailFacade: MailFacade,
		private readonly connectivityModel: WebsocketConnectivityModel | null,
		private readonly inboxRuleHandler: InboxRuleHandler | null,
	) {}

	// only init listeners once
	private readonly initListeners = lazyMemoized(() => {
		this.eventController.addEntityListener((updates) => this.entityEventsReceived(updates))

		this.eventController.getCountersStream().map((update) => {
			this._mailboxCountersUpdates(update)
		})
	})

	async init(): Promise<void> {
		this.initListeners()

		const mailboxDetails = this.mailboxModel.mailboxDetails() || []

		let tempFolders: Record<Id, FolderSystem> = {}

		for (let detail of mailboxDetails) {
			if (detail.mailbox.folders) {
				const detailFolders = await this.loadFolders(neverNull(detail.mailbox.folders).folders)
				tempFolders[detail.mailbox.folders._id] = new FolderSystem(detailFolders)
			}
		}

		this.folders(tempFolders)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
				await this.init()
				m.redraw()
			} else if (isUpdateForTypeRef(MailTypeRef, update) && update.operation === OperationType.CREATE) {
				if (this.inboxRuleHandler && this.connectivityModel) {
					const folder = this.getMailFolder(update.instanceListId)

					if (folder && folder.folderType === MailFolderType.INBOX && !containsEventOfType(updates, OperationType.DELETE, update.instanceId)) {
						// If we don't find another delete operation on this email in the batch, then it should be a create operation,
						// otherwise it's a move
						const mailId: IdTuple = [update.instanceListId, update.instanceId]
						const mail = await this.entityClient.load(MailTypeRef, mailId)
						await this.getMailboxDetailsForMailListId(update.instanceListId)
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
							.then((newId) => this._showNotification(newId || mailId))
							.catch(noOp)
					}
				}
			}
		}
	}

	//NOTE: This is in this model because the folder structure is needed to find the mailboxDetails
	//    This may be fixed by static mail ids which are currently being worked on
	getMailboxDetailsForMail(mail: Mail): Promise<MailboxDetail | null> {
		return this.getMailboxDetailsForMailListId(mail._id[0])
	}

	//NOTE: This is in this model because the folder structure is needed to find the mailboxDetails
	//    This may be fixed by static mail ids which are currently being worked on
	async getMailboxDetailsForMailListId(mailListId: Id): Promise<MailboxDetail | null> {
		const mailboxDetails = await this.mailboxModel.getMailboxDetails()
		const folderStructures = this.folders()
		for (let detail of mailboxDetails) {
			if (detail != null) {
				if (detail.mailbox.folders) {
					const folders = folderStructures[detail.mailbox.folders._id]
					if (folders.getFolderByMailListId(mailListId)) {
						return detail
					}
				}
			} else {
				console.warn("Mailbox detail for mail list does not exist", mailListId)
			}
		}
		return null
	}

	private loadFolders(folderListId: Id): Promise<MailFolder[]> {
		return this.entityClient.loadAll(MailFolderTypeRef, folderListId).then((folders) => {
			return folders.filter((f) => {
				// We do not show spam or archive for external users
				if (!this.logins.isInternalUserLoggedIn() && (f.folderType === MailFolderType.SPAM || f.folderType === MailFolderType.ARCHIVE)) {
					return false
				} else if (this.logins.isEnabled(FeatureType.InternalCommunication) && f.folderType === MailFolderType.SPAM) {
					return false
				} else {
					return true
				}
			})
		})
	}

	getMailboxFoldersForMail(mail: Mail): Promise<FolderSystem | null> {
		return this.getMailboxDetailsForMail(mail).then((md) => {
			if (md && md.mailbox.folders) {
				const folderStructures = this.folders()
				return folderStructures[md.mailbox.folders._id] ?? null
			}
			return null
		})
	}

	getMailboxFoldersForId(foldersId: Id): FolderSystem {
		const folderStructures = this.folders()
		return folderStructures[foldersId]
	}

	getMailFolder(mailListId: Id): MailFolder | null {
		const folderStructures = this.folders() || []

		for (const foldersId of Object.keys(folderStructures)) {
			const f = folderStructures[foldersId].getFolderByMailListId(mailListId)
			if (f) {
				return f
			}
		}

		return null
	}

	/**
	 * Preferably use moveMails() in MailGuiUtils.js which has built-in error handling
	 * @throws PreconditionFailedError or LockedError if operation is locked on the server
	 */
	async moveMails(mails: ReadonlyArray<Mail>, targetMailFolder: MailFolder): Promise<void> {
		const mailsPerFolder = groupBy(mails, (mail) => {
			return getListId(mail)
		})

		for (const [listId, mails] of mailsPerFolder) {
			const sourceMailFolder = this.getMailFolder(listId)

			if (sourceMailFolder) {
				await this.finalMoveMails(mails, targetMailFolder)
			} else {
				console.log("Move mail: no mail folder for list id", listId)
			}
		}
	}

	/**
	 * Finally deletes all given mails. Caller must ensure that mails are only from one folder
	 */
	private async finalMoveMails(mails: Mail[], targetMailFolder: MailFolder): Promise<void> {
		let moveMails = mails.filter((m) => m._id[0] !== targetMailFolder.mails && targetMailFolder._ownerGroup === m._ownerGroup) // prevent moving mails between mail boxes.

		// Do not move if target is the same as the current mailFolder
		const sourceMailFolder = this.getMailFolder(getListId(mails[0]))

		if (moveMails.length > 0 && sourceMailFolder && !isSameId(targetMailFolder._id, sourceMailFolder._id)) {
			const mailChunks = splitInChunks(
				MAX_NBR_MOVE_DELETE_MAIL_SERVICE,
				mails.map((m) => m._id),
			)

			for (const mailChunk of mailChunks) {
				await this.mailFacade.moveMails(mailChunk, targetMailFolder._id)
			}
		}
	}

	/**
	 * Finally deletes the given mails if they are already in the trash or spam folders,
	 * otherwise moves them to the trash folder.
	 * A deletion confirmation must have been show before.
	 */
	async deleteMails(mails: ReadonlyArray<Mail>): Promise<void> {
		const mailsPerFolder = groupBy(mails, (mail) => {
			return getListId(mail)
		})

		if (mails.length === 0) {
			return
		}
		const folders = await this.getMailboxFoldersForMail(mails[0])
		if (folders == null) {
			return
		}
		const trashFolder = assertNotNull(folders.getSystemFolderByType(MailFolderType.TRASH))

		for (const [listId, mails] of mailsPerFolder) {
			const sourceMailFolder = this.getMailFolder(listId)

			if (sourceMailFolder) {
				if (isSpamOrTrashFolder(folders, sourceMailFolder)) {
					await this.finallyDeleteMails(mails)
				} else {
					await this.finalMoveMails(mails, trashFolder)
				}
			} else {
				console.log("Delete mail: no mail folder for list id", listId)
			}
		}
	}

	/**
	 * Finally deletes all given mails. Caller must ensure that mails are only from one folder and the folder must allow final delete operation.
	 */
	private async finallyDeleteMails(mails: Mail[]): Promise<void> {
		if (!mails.length) return Promise.resolve()
		const mailFolder = neverNull(this.getMailFolder(getListId(mails[0])))
		const mailIds = mails.map((m) => m._id)
		const mailChunks = splitInChunks(MAX_NBR_MOVE_DELETE_MAIL_SERVICE, mailIds)

		for (const mailChunk of mailChunks) {
			await this.mailFacade.deleteMails(mailChunk, mailFolder._id)
		}
	}

	/**
	 * Sends the given folder and all its descendants to the spam folder, reporting mails (if applicable) and removes any empty folders
	 */
	async sendFolderToSpam(folder: MailFolder): Promise<void> {
		const mailboxDetail = await this.getMailboxDetailsForMailListId(folder.mails)
		if (mailboxDetail != null && mailboxDetail.mailbox.folders != null) {
			const folderStructures = this.folders()
			const folders = folderStructures[mailboxDetail.mailbox.folders._id]

			if (folders) {
				let deletedFolder = await this.removeAllEmpty(mailboxDetail, folders, folder)
				if (!deletedFolder) {
					return this.mailFacade.updateMailFolderParent(folder, assertSystemFolderOfType(folders, MailFolderType.SPAM)._id)
				}
			}
		}
	}

	async reportMails(reportType: MailReportType, mails: ReadonlyArray<Mail>): Promise<void> {
		for (const mail of mails) {
			await this.mailFacade.reportMail(mail, reportType).catch(ofClass(NotFoundError, (e) => console.log("mail to be reported not found", e)))
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

	_mailboxCountersUpdates(counters: WebsocketCounterData) {
		const normalized = this.mailboxCounters() || {}
		const group = normalized[counters.mailGroup] || {}
		for (const value of counters.counterValues) {
			group[value.mailListId] = Number(value.count) || 0
		}
		normalized[counters.mailGroup] = group
		this.mailboxCounters(normalized)
	}

	_showNotification(mailId: IdTuple) {
		this.notifications.showNotification(
			NotificationType.Mail,
			lang.get("newMails_msg"),
			{
				actions: [],
			},
			(_) => {
				m.route.set(`/mail/${listIdPart(mailId)}/${elementIdPart(mailId)}`)
				window.focus()
			},
		)
	}

	getCounterValue(listId: Id): Promise<number | null> {
		return this.getMailboxDetailsForMailListId(listId)
			.then((mailboxDetails) => {
				if (mailboxDetails == null) {
					return null
				} else {
					const counters = this.mailboxCounters()
					const mailGroupCounter = counters[mailboxDetails.mailGroup._id]
					return mailGroupCounter && mailGroupCounter[listId]
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
		const mailboxDetail = await this.getMailboxDetailsForMailListId(folder.mails)
		if (mailboxDetail != null && mailboxDetail.mailbox.folders != null) {
			const folderStructures = this.folders()
			const folders = folderStructures[mailboxDetail.mailbox.folders._id]

			if (folders) {
				let deletedFolder = await this.removeAllEmpty(mailboxDetail, folders, folder)
				if (!deletedFolder) {
					const trash = assertSystemFolderOfType(folders, MailFolderType.TRASH)
					return this.mailFacade.updateMailFolderParent(folder, trash._id)
				}
			}
		}
	}

	/**
	 * This is called when moving a folder to SPAM or TRASH, which do not allow empty folders (since only folders that contain mail are allowed)
	 */
	private async removeAllEmpty(mailboxDetail: MailboxDetail, folders: FolderSystem, folder: MailFolder): Promise<boolean> {
		// sort descendants deepest first so that we can clean them up before checking their ancestors
		const descendants = folders.getDescendantFoldersOfParent(folder._id).sort((l, r) => r.level - l.level)

		// we completely delete empty folders
		let someNonEmpty = false
		// we don't update folder system quickly enough so we keep track of deleted folders here and consider them "empty" when all their children are here
		const deleted = new Set<Id>()
		for (const descendant of descendants) {
			// Only load one mail, if there is even one we won't remove
			if (
				(await this.entityClient.loadRange(MailTypeRef, descendant.folder.mails, GENERATED_MAX_ID, 1, true)).length === 0 &&
				folders.getCustomFoldersOfParent(descendant.folder._id).every((f) => deleted.has(getElementId(f)))
			) {
				deleted.add(getElementId(descendant.folder))
				await this.finallyDeleteCustomMailFolder(descendant.folder)
			} else {
				someNonEmpty = true
			}
		}
		// Only load one mail, if there is even one we won't remove
		if (
			(await this.entityClient.loadRange(MailTypeRef, folder.mails, GENERATED_MAX_ID, 1, true)).length === 0 &&
			folders.getCustomFoldersOfParent(folder._id).every((f) => deleted.has(getElementId(f))) &&
			!someNonEmpty
		) {
			await this.finallyDeleteCustomMailFolder(folder)
			return true
		} else {
			return false
		}
	}

	public async finallyDeleteCustomMailFolder(folder: MailFolder): Promise<void> {
		if (folder.folderType !== MailFolderType.CUSTOM) {
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

	async fixupCounterForMailList(listId: Id, unreadMails: number) {
		const mailboxDetails = await this.getMailboxDetailsForMailListId(listId)
		mailboxDetails && (await this.mailFacade.fixupCounterForMailList(mailboxDetails.mailGroup._id, listId, unreadMails))
	}

	async clearFolder(folder: MailFolder): Promise<void> {
		await this.mailFacade.clearFolder(folder._id)
	}

	async unsubscribe(mail: Mail, recipient: string, headers: string[]) {
		await this.mailFacade.unsubscribe(mail._id, recipient, headers)
	}

	async saveReportMovedMails(mailboxGroupRoot: MailboxGroupRoot, reportMovedMails: ReportMovedMailsType): Promise<MailboxProperties> {
		const mailboxProperties = await this.mailboxModel.loadOrCreateMailboxProperties(mailboxGroupRoot)
		mailboxProperties.reportMovedMails = reportMovedMails
		await this.entityClient.update(mailboxProperties)
		return mailboxProperties
	}
}

export async function getMoveTargetFolderSystems(foldersModel: MailModel, mails: readonly Mail[]): Promise<Array<FolderInfo>> {
	const firstMail = first(mails)
	if (firstMail == null) return []

	const mailboxDetails = await foldersModel.getMailboxDetailsForMail(firstMail)
	if (mailboxDetails == null || mailboxDetails.mailbox.folders == null) {
		return []
	}
	const folderStructures = foldersModel.folders()
	const folderSystem = folderStructures[mailboxDetails.mailbox.folders._id]
	return folderSystem.getIndentedList().filter((f: IndentedFolder) => f.folder.mails !== getListId(firstMail))
}

export function isSubfolderOfType(system: FolderSystem, folder: MailFolder, type: MailFolderType): boolean {
	const systemFolder = system.getSystemFolderByType(type)
	return systemFolder != null && system.checkFolderForAncestor(folder, systemFolder._id)
}

export function isDraft(mail: Mail): boolean {
	return mail.mailDetailsDraft != null
}

export async function isMailInSpamOrTrash(mail: Mail): Promise<boolean> {
	const folders = await mailLocator.mailModel.getMailboxFoldersForMail(mail)
	const mailFolder = folders?.getFolderByMailListId(getListId(mail))
	if (folders && mailFolder) {
		return isSpamOrTrashFolder(folders, mailFolder)
	} else {
		return false
	}
}

/**
 * Returns true if given folder is the {@link MailFolderType.SPAM} or {@link MailFolderType.TRASH} folder, or a descendant of those folders.
 */
export function isSpamOrTrashFolder(system: FolderSystem, folder: MailFolder): boolean {
	// not using isOfTypeOrSubfolderOf because checking the type first is cheaper
	return (
		folder.folderType === MailFolderType.TRASH ||
		folder.folderType === MailFolderType.SPAM ||
		isSubfolderOfType(system, folder, MailFolderType.TRASH) ||
		isSubfolderOfType(system, folder, MailFolderType.SPAM)
	)
}

/**
 * Gets a system folder of the specified type and unwraps it.
 * Some system folders don't exist in some cases, e.g. spam or archive for external mailboxes!
 *
 * Use with caution.
 */
export function assertSystemFolderOfType(system: FolderSystem, type: Omit<MailFolderType, MailFolderType.CUSTOM>): MailFolder {
	return assertNotNull(system.getSystemFolderByType(type), "System folder of type does not exist!")
}

export function isOfTypeOrSubfolderOf(system: FolderSystem, folder: MailFolder, type: MailFolderType): boolean {
	return folder.folderType === type || isSubfolderOfType(system, folder, type)
}
