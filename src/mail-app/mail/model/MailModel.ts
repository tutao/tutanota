import Stream from "mithril/stream"
import stream from "mithril/stream"
import { MailboxCounters, MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem.js"
import {
	assertNotNull,
	collectToMap,
	downcast,
	getFirstOrThrow,
	groupBy,
	groupByAndMap,
	isNotNull,
	lazyMemoized,
	Nullable,
	ofClass,
	partition,
	promiseMap,
	splitInChunks,
} from "@tutao/tutanota-utils"
import {
	Mail,
	MailboxGroupRoot,
	MailboxProperties,
	MailFolder,
	MailFolderTypeRef,
	MailSetEntryTypeRef,
	MailTypeRef,
	MovedMails,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import {
	FeatureType,
	isLabel,
	MailReportType,
	MailSetKind,
	MAX_NBR_OF_MAILS_SYNC_OPERATION,
	OperationType,
	ProcessingState,
	ReportMovedMailsType,
	SimpleMoveMailTarget,
	SystemFolderType,
} from "../../../common/api/common/TutanotaConstants.js"
import { CUSTOM_MIN_ID, elementIdPart, getElementId, listIdPart } from "../../../common/api/common/utils/EntityUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import m from "mithril"
import { WebsocketCounterData } from "../../../common/api/entities/sys/TypeRefs.js"
import { Notifications, NotificationType } from "../../../common/gui/Notifications.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { NotAuthorizedError, NotFoundError, PreconditionFailedError } from "../../../common/api/common/error/RestError.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { EventController } from "../../../common/api/main/EventController.js"
import { InboxRuleHandler } from "./InboxRuleHandler.js"
import { WebsocketConnectivityModel } from "../../../common/misc/WebsocketConnectivityModel.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { assertSystemFolderOfType } from "./MailUtils.js"
import { TutanotaError } from "@tutao/tutanota-error"
import { SpamClassificationHandler } from "./SpamClassificationHandler"
import { isWebClient } from "../../../common/api/common/Env"
import { isExpectedErrorForSynchronization } from "../../../common/api/common/utils/ErrorUtils"

interface MailboxSets {
	folders: FolderSystem
	/** a map from element id to the mail set */
	labels: ReadonlyMap<Id, MailFolder>
}

export const enum LabelState {
	/** Label was applied to all emails*/
	Applied,
	/** Label was applied to some of the emails but not to others*/
	AppliedToSome,
	/** Label was applied to none of the emails */
	NotApplied,
}

export const enum MoveMode {
	Mails,
	Conversation,
}

export class MailModel {
	readonly mailboxCounters: Stream<MailboxCounters> = stream({})
	/**
	 * map from mailbox folders list to folder system
	 */
	private mailSets: Map<Id, MailboxSets> = new Map()

	constructor(
		private readonly notifications: Notifications,
		private readonly mailboxModel: MailboxModel,
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
		private readonly logins: LoginController,
		private readonly mailFacade: MailFacade,
		private readonly connectivityModel: WebsocketConnectivityModel | null,
		private spamHandler: () => SpamClassificationHandler | null,
		private readonly inboxRuleHandler: () => InboxRuleHandler | null,
	) {}

	// only init listeners once
	private readonly initListeners = lazyMemoized(() => {
		this.eventController.addEntityListener((updates) => this.entityEventsReceived(updates))

		this.eventController.getCountersStream().map((update) => {
			this._mailboxCountersUpdates(update)
		})

		this.mailboxModel.mailboxDetails.map(() => {
			// this can cause little race between loading the folders but it should be fine
			this.loadMailSets().then((newFolders) => (this.mailSets = newFolders))
		})
	})

	async init(): Promise<void> {
		this.initListeners()
		this.mailSets = await this.loadMailSets()

		await this.logins.loadCustomizations()
		const isSpamClassificationFeatureEnabled = this.logins.isEnabled(FeatureType.SpamClientClassification)
		if (!isSpamClassificationFeatureEnabled) {
			this.spamHandler = () => null
		}
	}

	private async loadMailSets(): Promise<Map<Id, MailboxSets>> {
		const mailboxDetails = await this.mailboxModel.getMailboxDetails()

		const tempFolders = new Map<Id, MailboxSets>()
		let lastCaughtRestError: TutanotaError | null = null

		for (let detail of mailboxDetails) {
			const foldersRef = detail.mailbox.folders
			if (foldersRef != null) {
				let mailSets: MailFolder[]
				try {
					mailSets = await this.loadMailSetsForListId(foldersRef.folders)
				} catch (e) {
					// This can happen on desktop/mobile if we lose a membership while we're not logged in.
					//
					// This occurs because LoginFacade will bypass cache to load the user, and this triggers deletion of
					// cached entities owned by groups that the user lost access to. As MailboxModel isn't immediately
					// updated (until finally receiving the entity event), it will still have an outdated list of
					// mailbox details (temporarily).
					if (e instanceof NotAuthorizedError || e instanceof NotFoundError) {
						console.warn(
							"Got",
							e.name,
							"when trying to load a mailbox",
							detail.mailbox._id,
							"(mailbox details in MailboxModel likely outdated due to group membership loss)",
						)
						lastCaughtRestError = e
						continue
					} else {
						throw e
					}
				}
				const [labels, folders] = partition(mailSets, isLabel)
				const labelsMap = collectToMap(labels, getElementId)
				const folderSystem = new FolderSystem(folders)
				tempFolders.set(foldersRef._id, { folders: folderSystem, labels: labelsMap })
			}
		}

		// Only re-throw the caught error if we didn't get *any* mailboxes for some reason.
		if (tempFolders.size === 0 && lastCaughtRestError != null) {
			throw lastCaughtRestError
		}

		return tempFolders
	}

	private async loadMailSetsForListId(listId: Id): Promise<MailFolder[]> {
		const folders = await this.entityClient.loadAll(MailFolderTypeRef, listId)

		return folders.filter((f) => {
			// We do not show spam or archive for external users
			if (!this.logins.isInternalUserLoggedIn() && (f.folderType === MailSetKind.SPAM || f.folderType === MailSetKind.ARCHIVE)) {
				return false
			} else {
				return !(this.logins.isEnabled(FeatureType.InternalCommunication) && f.folderType === MailSetKind.SPAM)
			}
		})
	}

	private async getFolders(): Promise<Map<Id, MailboxSets>> {
		if (this.mailSets.size === 0) {
			return await this.loadMailSets()
		} else {
			return this.mailSets
		}
	}

	// visibleForTesting
	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<{ processingDone: Promise<void> }> {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
				await this.init()
				m.redraw()
			} else if (isUpdateForTypeRef(MailTypeRef, update) && update.operation === OperationType.UPDATE) {
				const mailId: IdTuple = [update.instanceListId, update.instanceId]
				const mail = await this.loadMail(mailId)
				if (mail == null) {
					return { processingDone: Promise.resolve() }
				}
				const spamHandler = this.spamHandler()
				await spamHandler?.updateSpamClassificationData(mail)
			} else if (isUpdateForTypeRef(MailTypeRef, update) && update.operation === OperationType.CREATE) {
				const mailId: IdTuple = [update.instanceListId, update.instanceId]
				const mail = await this.loadMail(mailId)
				if (mail == null) {
					return { processingDone: Promise.resolve() }
				}

				// If an inbox rule has been applied or a spam prediction has been made
				// we can return, because those are the two final processing states
				if (
					mail.processingState === ProcessingState.INBOX_RULE_APPLIED ||
					mail.processingState === ProcessingState.INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_MADE
				) {
					return { processingDone: Promise.resolve() }
				}

				// The webapp currently does not support spam prediction, and the inbox rule has been processed
				if (isWebClient() && mail.processingState === ProcessingState.INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_PENDING) {
					return { processingDone: Promise.resolve() }
				}

				const sourceMailFolder = this.getMailFolderForMail(mail)
				if (sourceMailFolder == null) {
					return { processingDone: Promise.resolve() }
				}

				const isLeaderClient = this.connectivityModel?.isLeader() ?? false
				if (sourceMailFolder.folderType === MailSetKind.INBOX) {
					const isInboxRuleTargetFolder = await this.getMailboxDetailsForMail(mail).then((mailboxDetail) => {
						// We only apply rules on server if we are the leader in case of incoming messages
						return mailboxDetail && this.inboxRuleHandler()?.findAndApplyMatchingRule(mailboxDetail, mail, isLeaderClient)
					})

					if (isWebClient()) {
						// we only need to show notifications explicitly on the webapp
						this._showNotification(isInboxRuleTargetFolder ?? sourceMailFolder, mail)
					} else if (this.spamHandler() != null) {
						const mailDetails = await this.mailFacade.loadMailDetailsBlob(mail)
						this.spamHandler()?.storeTrainingDatum(mail, mailDetails)

						if (isInboxRuleTargetFolder) {
							return { processingDone: Promise.resolve() }
						} else if (
							(isLeaderClient && mail.processingState === ProcessingState.INBOX_RULE_NOT_PROCESSED) ||
							(mail.processingState === ProcessingState.INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_PENDING && mail.unread)
						) {
							const folderSystem = this.getFolderSystemByGroupId(assertNotNull(mail._ownerGroup))
							if (sourceMailFolder && folderSystem) {
								const predictPromise = this.spamHandler()?.predictSpamForNewMail(mail, mailDetails, sourceMailFolder, folderSystem)
								return { processingDone: downcast(predictPromise) }
							}
						}
					}
				} else if (sourceMailFolder.folderType === MailSetKind.SPAM) {
					const mailDetails = await this.mailFacade.loadMailDetailsBlob(mail)
					this.spamHandler()?.storeTrainingDatum(mail, mailDetails)

					if (
						(isLeaderClient && mail.processingState === ProcessingState.INBOX_RULE_NOT_PROCESSED) ||
						mail.processingState === ProcessingState.INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_PENDING
					) {
						const folderSystem = this.getFolderSystemByGroupId(assertNotNull(mail._ownerGroup))
						if (sourceMailFolder && folderSystem) {
							const predictPromise = this.spamHandler()?.predictSpamForNewMail(mail, mailDetails, sourceMailFolder, folderSystem)
							return { processingDone: downcast(predictPromise) }
						}
					}
				}
			} else if (isUpdateForTypeRef(MailTypeRef, update) && update.operation === OperationType.DELETE) {
				const mailId: IdTuple = [update.instanceListId, update.instanceId]
				await this.spamHandler()?.dropClassificationData(mailId)
			}
		}
		return { processingDone: Promise.resolve() }
	}

	public async loadMail(mailId: IdTuple): Promise<Nullable<Mail>> {
		return await this.entityClient.load(MailTypeRef, mailId).catch((e) => {
			if (isExpectedErrorForSynchronization(e)) {
				console.log(`Could not find mail ${JSON.stringify(mailId)}`)
				return null
			}
			throw e
		})
	}

	async applyInboxRuleToMail(mail: Mail) {
		const inboxRuleHandler = this.inboxRuleHandler()
		if (inboxRuleHandler) {
			const mailboxDetail = await this.getMailboxDetailsForMail(mail)
			if (mailboxDetail) {
				return inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, mail, true)
			}
		}
	}

	async getMailboxDetailsForMail(mail: Mail): Promise<MailboxDetail | null> {
		const detail = await this.mailboxModel.getMailboxDetailsForMailGroup(assertNotNull(mail._ownerGroup))
		if (detail == null) {
			console.warn("Mailbox detail for mail does not exist", mail)
		}
		return detail
	}

	async getMailboxDetailsForMailFolder(mailFolder: MailFolder): Promise<MailboxDetail | null> {
		const detail = await this.mailboxModel.getMailboxDetailsForMailGroup(assertNotNull(mailFolder._ownerGroup))
		if (detail == null) {
			console.warn("Mailbox detail for mail folder does not exist", mailFolder)
		}
		return detail
	}

	async getMailboxFoldersForMail(mail: Mail): Promise<FolderSystem | null> {
		const mailboxDetail = await this.getMailboxDetailsForMail(mail)
		if (mailboxDetail && mailboxDetail.mailbox.folders) {
			const folders = await this.getFolders()
			return folders.get(mailboxDetail.mailbox.folders._id)?.folders ?? null
		} else {
			return null
		}
	}

	async getMailboxFoldersForId(foldersId: Id): Promise<FolderSystem> {
		const folderStructures = await this.loadMailSets()
		const folderSystem = folderStructures.get(foldersId)?.folders
		if (folderSystem == null) {
			throw new ProgrammingError(`no folder system for folder id ${foldersId}`)
		}
		return folderSystem
	}

	getMailFolderForMail(mail: Mail): MailFolder | null {
		const folderSystem = this.getFolderSystemByGroupId(assertNotNull(mail._ownerGroup))
		if (folderSystem == null) return null

		return folderSystem.getFolderByMail(mail)
	}

	getFolderSystemByGroupId(groupId: Id): FolderSystem | null {
		return this.getMailSetsForGroup(groupId)?.folders ?? null
	}

	getLabelsByGroupId(groupId: Id): ReadonlyMap<Id, MailFolder> {
		return this.getMailSetsForGroup(groupId)?.labels ?? new Map()
	}

	/**
	 * @return all labels that could be applied to the {@param mails} with the state relative to {@param mails}.
	 */
	getLabelStatesForMails(mails: readonly Mail[]): { label: MailFolder; state: LabelState }[] {
		if (mails.length === 0) {
			return []
		}
		const labels = this.getLabelsByGroupId(assertNotNull(getFirstOrThrow(mails)._ownerGroup))
		const allUsedSets = new Map<Id, number>()
		for (const mail of mails) {
			for (const set of mail.sets) {
				const currentValue = allUsedSets.get(elementIdPart(set)) ?? 0
				allUsedSets.set(elementIdPart(set), currentValue + 1)
			}
		}

		return Array.from(labels.values()).map((label) => {
			const count = allUsedSets.get(getElementId(label)) ?? 0
			const state: LabelState = count === 0 ? LabelState.NotApplied : count === mails.length ? LabelState.Applied : LabelState.AppliedToSome
			return { label, state }
		})
	}

	getLabelsForMails(mails: readonly Mail[]): ReadonlyMap<Id, ReadonlyArray<MailFolder>> {
		const labelsForMails = new Map<Id, MailFolder[]>()
		for (const mail of mails) {
			labelsForMails.set(getElementId(mail), this.getLabelsForMail(mail))
		}

		return labelsForMails
	}

	/**
	 * @return labels that are currently applied to {@param mail}.
	 */
	getLabelsForMail(mail: Mail): MailFolder[] {
		const groupLabels = this.getLabelsByGroupId(assertNotNull(mail._ownerGroup))
		return mail.sets.map((labelId) => groupLabels.get(elementIdPart(labelId))).filter(isNotNull)
	}

	private getMailSetsForGroup(groupId: Id): MailboxSets | null {
		const mailboxDetails = this.mailboxModel.mailboxDetails() || []
		const detail = mailboxDetails.find((md) => groupId === md.mailGroup._id)
		const sets = detail?.mailbox?.folders?._id
		if (sets == null) {
			return null
		}
		return this.mailSets.get(sets) ?? null
	}

	/**
	 * Move all given mails to the target folder kind in their respective mailbox(es)
	 *
	 * This will only work for mails in
	 * @param mails
	 * @param targetMailFolderKind
	 */
	async simpleMoveMails(mails: readonly IdTuple[], targetMailFolderKind: SimpleMoveMailTarget): Promise<MovedMails[]> {
		return await this.mailFacade.simpleMoveMails(mails, targetMailFolderKind, null)
	}

	getFolderExcludedFromMove(moveMode: MoveMode): SystemFolderType | null {
		return moveMode === MoveMode.Conversation ? MailSetKind.SENT : null
	}

	/**
	 * Move mails from {@param targetFolder} except those that are in {@param excludeMailSet}.
	 */
	async moveMails(mails: readonly IdTuple[], targetFolder: MailFolder, moveMode: MoveMode): Promise<MovedMails[]> {
		const folderSystem = this.getFolderSystemByGroupId(assertNotNull(targetFolder._ownerGroup))
		if (folderSystem == null) {
			return []
		}

		const excludedFolderType = this.getFolderExcludedFromMove(moveMode)
		const excludeFolder = excludedFolderType != null ? assertNotNull(folderSystem.getSystemFolderByType(excludedFolderType))._id : null
		return await this.mailFacade.moveMails(mails, targetFolder._id, excludeFolder)
	}

	/**
	 * Finally deletes all given mails. Caller must ensure that all mails are in folders that allows final delete operation.
	 * @param mailIds mails to delete
	 * @param filterMailSet when set, only mails in the filterMailSet would be deleted
	 */
	async finallyDeleteMails(mailIds: readonly IdTuple[], filterMailSet: IdTuple | null): Promise<void> {
		await this.mailFacade.deleteMails(mailIds, filterMailSet)
	}

	/**
	 * Sends the given folder and all its descendants to the spam folder, reporting mails (if applicable) and removes any empty folders
	 */
	async sendFolderToSpam(folder: MailFolder): Promise<void> {
		const mailboxDetail = await this.getMailboxDetailsForMailFolder(folder)
		if (mailboxDetail == null) {
			return
		}

		const folderSystem = this.getFolderSystemByGroupId(assertNotNull(folder._ownerGroup))
		if (folderSystem == null) return
		const deletedFolder = await this.removeAllEmpty(folderSystem, folder)
		if (!deletedFolder) {
			return this.mailFacade.updateMailFolderParent(folder, assertSystemFolderOfType(folderSystem, MailSetKind.SPAM)._id)
		}
	}

	async reportMails(reportType: MailReportType, mails: ReadonlyArray<Mail>): Promise<void> {
		if (!this.logins.isInternalUserLoggedIn()) {
			return
		}

		for (const mail of mails) {
			await this.mailFacade.reportMail(mail, reportType).catch(ofClass(NotFoundError, (e) => console.log("mail to be reported not found", e)))
		}
	}

	canManageLabels(): boolean {
		return this.logins.getUserController().isInternalUser()
	}

	canAssignLabels(): boolean {
		return this.logins.getUserController().isInternalUser()
	}

	isExportingMailsAllowed(): boolean {
		return !this.logins.isEnabled(FeatureType.DisableMailExport)
	}

	/**
	 * @return true if the user is allowed to use conversation views (listing and viewing mails)
	 */
	canUseConversationView(): boolean {
		return this.logins.getUserController().isInternalUser()
	}

	async markMails(mails: readonly IdTuple[], unread: boolean): Promise<void> {
		await this.mailFacade.markMails(mails, unread)
	}

	async applyLabels(mails: readonly IdTuple[], addedLabels: readonly MailFolder[], removedLabels: readonly MailFolder[]): Promise<void> {
		const groupedByListIds = groupBy(mails, (mailId) => listIdPart(mailId))
		for (const [_, groupedMails] of groupedByListIds) {
			const mailChunks = splitInChunks(MAX_NBR_OF_MAILS_SYNC_OPERATION, groupedMails)
			for (const mailChunk of mailChunks) {
				await this.mailFacade.applyLabels(mailChunk, addedLabels, removedLabels)
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
		this.notifications.showNotification(NotificationType.Mail, lang.get("newMails_msg"), {}, (_) => {
			m.route.set(`/mail/${getElementId(folder)}/${getElementId(mail)}`)
			window.focus()
		})
	}

	getCounterValue(folder: MailFolder): Promise<number | null> {
		return this.getMailboxDetailsForMailFolder(folder)
			.then((mailboxDetails) => {
				if (mailboxDetails == null) {
					return null
				} else {
					const mailGroupCounter = this.mailboxCounters()[mailboxDetails.mailGroup._id]
					if (mailGroupCounter) {
						const counterId = getElementId(folder)
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
		const folderSystem = this.getFolderSystemByGroupId(assertNotNull(folder._ownerGroup))
		if (folderSystem == null) return

		const deletedFolder = await this.removeAllEmpty(folderSystem, folder)
		if (!deletedFolder) {
			const trash = assertSystemFolderOfType(folderSystem, MailSetKind.TRASH)
			return this.mailFacade.updateMailFolderParent(folder, trash._id)
		}
	}

	/**
	 * This is called when moving a folder to SPAM or TRASH, which do not allow empty folders (since only folders that contain mail are allowed)
	 */
	private async removeAllEmpty(folderSystem: FolderSystem, folder: MailFolder): Promise<boolean> {
		// sort descendants deepest first so that we can clean them up before checking their ancestors
		const descendants = folderSystem.getDescendantFoldersOfParent(folder._id).sort((l, r) => r.level - l.level)

		// we completely delete empty folders
		let someNonEmpty = false
		// we don't update folder system quickly enough so we keep track of deleted folders here and consider them "empty" when all their children are here
		const deleted = new Set<Id>()
		for (const descendant of descendants) {
			if (
				(await this.isEmptyFolder(descendant.folder)) &&
				folderSystem.getCustomFoldersOfParent(descendant.folder._id).every((f) => deleted.has(getElementId(f)))
			) {
				deleted.add(getElementId(descendant.folder))
				await this.finallyDeleteCustomMailFolder(descendant.folder)
			} else {
				someNonEmpty = true
			}
		}
		if (
			(await this.isEmptyFolder(folder)) &&
			folderSystem.getCustomFoldersOfParent(folder._id).every((f) => deleted.has(getElementId(f))) &&
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
		return (await this.entityClient.loadRange(MailSetEntryTypeRef, descendant.entries, CUSTOM_MIN_ID, 1, false)).length === 0
	}

	public async finallyDeleteCustomMailFolder(folder: MailFolder): Promise<void> {
		if (folder.folderType !== MailSetKind.CUSTOM && folder.folderType !== MailSetKind.Imported) {
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

	async serverUnsubscribe(mail: Mail, postUrl: string) {
		await this.mailFacade.unsubscribe(mail._id, postUrl)
	}

	async saveReportMovedMails(mailboxGroupRoot: MailboxGroupRoot, reportMovedMails: ReportMovedMailsType): Promise<MailboxProperties> {
		const mailboxProperties = await this.mailboxModel.loadOrCreateMailboxProperties(mailboxGroupRoot)
		mailboxProperties.reportMovedMails = reportMovedMails
		await this.entityClient.update(mailboxProperties)
		return mailboxProperties
	}

	/**
	 * Create a label (aka MailSet aka {@link MailFolder} of kind {@link MailSetKind.LABEL}) for the group {@param mailGroupId}.
	 */
	async createLabel(mailGroupId: Id, labelData: { name: string; color: string }) {
		await this.mailFacade.createLabel(mailGroupId, labelData)
	}

	async updateLabel(label: MailFolder, newData: { name: string; color: string }) {
		await this.mailFacade.updateLabel(label, newData.name, newData.color)
	}

	async deleteLabel(label: MailFolder) {
		await this.mailFacade.deleteLabel(label)
	}

	async getMailSetById(folderElementId: Id): Promise<MailFolder | null> {
		const folderStructures = await this.loadMailSets()
		for (const folders of folderStructures.values()) {
			const folder = folders.folders.getFolderById(folderElementId)
			if (folder) {
				return folder
			}

			const label = folders.labels.get(folderElementId)
			if (label) {
				return label
			}
		}
		return null
	}

	getImportedMailSets(): Array<MailFolder> {
		return [...this.mailSets.values()].filter((f) => f.folders.importedMailSet).map((f) => f.folders.importedMailSet!)
	}

	/** Resolve conversation list ids to the IDs of mails in those conversations. */
	async resolveConversationsForMails(mails: readonly Mail[]): Promise<IdTuple[]> {
		return await this.mailFacade.resolveConversations(mails.map((m) => listIdPart(m.conversationEntry)))
	}

	async loadAllMails(mailIds: readonly IdTuple[]): Promise<Mail[]> {
		const mailIdsPerList = groupByAndMap(mailIds, listIdPart, elementIdPart)
		return (
			await promiseMap(mailIdsPerList, ([listId, elementIds]) => this.entityClient.loadMultiple(MailTypeRef, listId, elementIds), { concurrency: 2 })
		).flat()
	}

	async unscheduleMail(mail: Mail): Promise<void> {
		return await this.mailFacade.unscheduleMail(mail._id)
	}
}
