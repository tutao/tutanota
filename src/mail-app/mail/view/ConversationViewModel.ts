import { ConversationEntry, ConversationEntryTypeRef, Mail, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { CreateMailViewerOptions } from "./MailViewer.js"
import { elementIdPart, firstBiggerThanSecond, getElementId, haveSameId, isSameId, listIdPart } from "../../../common/api/common/utils/EntityUtils.js"
import { assertNotNull, findLastIndex, groupBy, makeSingleUse, ofClass } from "@tutao/tutanota-utils"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { LoadingStateTracker } from "../../../common/offline/LoadingState.js"
import { EntityEventsListener, EventController } from "../../../common/api/main/EventController.js"
import { ConversationType, MailSetKind, MailState, OperationType } from "../../../common/api/common/TutanotaConstants.js"
import { NotAuthorizedError, NotFoundError } from "../../../common/api/common/error/RestError.js"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig.js"

import { MailModel } from "../model/MailModel.js"

import { isOfTypeOrSubfolderOf } from "../model/MailChecks.js"

export type MailViewerViewModelFactory = (options: CreateMailViewerOptions) => MailViewerViewModel

export type MailItem = { type: "mail"; viewModel: MailViewerViewModel; entryId: IdTuple }
export type ConversationItem = MailItem

export interface ConversationPrefProvider {
	getConversationViewShowOnlySelectedMail(): boolean

	getMailAutoSelectBehavior(): ListAutoSelectBehavior
}

export type ConversationViewModelFactory = (options: CreateMailViewerOptions) => ConversationViewModel

export class ConversationViewModel {
	/** Primary viewModel is for the mail that was selected from the list. */
	private readonly _primaryViewModel: MailViewerViewModel
	private loadingState = new LoadingStateTracker()
	private loadingPromise: Promise<void> | null = null
	/** Is not set until {@link loadConversation is finished. Until it is finished we display primary mail and subject. */
	private conversation: ConversationItem[] | null = null

	constructor(
		private options: CreateMailViewerOptions,
		private readonly viewModelFactory: MailViewerViewModelFactory,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly conversationPrefProvider: ConversationPrefProvider,
		private readonly mailModel: MailModel,
		private readonly onUiUpdate: () => unknown,
	) {
		this._primaryViewModel = viewModelFactory(options)
	}

	readonly init = makeSingleUse((delayBodyRendering: Promise<unknown>) => {
		this.loadingPromise = this.loadingState.trackPromise(this.loadConversation())
		this.eventController.addEntityListener(this.onEntityEvent)
		this._primaryViewModel.expandMail(delayBodyRendering)
	})

	private readonly onEntityEvent: EntityEventsListener = async (updates, eventOwnerGroupId) => {
		// conversation entry can be created when new email arrives
		// conversation entry can be updated when email is moved around or deleted
		// conversation entry is deleted only when every email in the conversation is deleted (the whole conversation list will be deleted)
		for (const update of updates) {
			if (isUpdateForTypeRef(ConversationEntryTypeRef, update) && update.instanceListId === this.conversationListId()) {
				if (this.conversationPrefProvider.getConversationViewShowOnlySelectedMail()) {
					// no need to handle CREATE because we only show a single item and we don't want to add new ones
					// no need to handle UPDATE because the only update that can happen is when email gets deleted and then we should be closed from the
					// outside anyway
					continue
				}
				switch (update.operation) {
					case OperationType.CREATE:
						await this.processCreateConversationEntry(update)
						break
					case OperationType.UPDATE:
						await this.processUpdateConversationEntry(update)
						break
					// don't process DELETE because the primary email (selected from the mail list) will be deleted first anyway
					// and we should be closed when it happens
				}
			}
		}
	}

	private async processCreateConversationEntry(update: EntityUpdateData) {
		const id: IdTuple = [update.instanceListId, update.instanceId]
		try {
			const entry = await this.entityClient.load(ConversationEntryTypeRef, id)
			if (entry.mail) {
				try {
					// first wait that we load the conversation, otherwise we might already have the email
					await this.loadingPromise
				} catch (e) {
					return
				}
				const conversation = assertNotNull(this.conversation)
				if (conversation.some((item) => item.type === "mail" && isSameId(item.viewModel.mail.conversationEntry, id))) {
					// already loaded
					return
				}
				const mail = await this.entityClient.load(MailTypeRef, entry.mail)
				let index = findLastIndex(conversation, (i) => firstBiggerThanSecond(getElementId(entry), elementIdPart(i.entryId)))
				if (index < 0) {
					index = conversation.length
				} else {
					index = index + 1
				}
				conversation.splice(index, 0, { type: "mail", viewModel: this.viewModelFactory({ ...this.options, mail }), entryId: entry._id })
				this.onUiUpdate()
			}
		} catch (e) {
			if (e instanceof NotFoundError) {
				// Ignore, something was already deleted
			} else {
				throw e
			}
		}
	}

	private async processUpdateConversationEntry(update: EntityUpdateData) {
		try {
			// first wait that we load the conversation, otherwise we might already have the email
			await this.loadingPromise
		} catch (e) {
			return
		}
		const conversation = assertNotNull(this.conversation)
		const ceId: IdTuple = [update.instanceListId, update.instanceId]
		let conversationEntry: ConversationEntry
		let mail: Mail | null
		try {
			conversationEntry = await this.entityClient.load(ConversationEntryTypeRef, ceId)
			mail =
				// ideally checking the `mail` ref should be enough but we sometimes get an update with UNKNOWN and non-existing email but still with the ref
				conversationEntry.conversationType !== ConversationType.UNKNOWN && conversationEntry.mail
					? await this.entityClient.load(MailTypeRef, conversationEntry.mail).catch(
							ofClass(NotFoundError, () => {
								console.log(`Could not find updated mail ${JSON.stringify(conversationEntry.mail)}`)
								return null
							}),
					  )
					: null
		} catch (e) {
			if (e instanceof NotFoundError) {
				// Ignore, something was already deleted
				return
			} else {
				throw e
			}
		}

		const oldItemIndex = conversation.findIndex((e) => e.type === "mail" && isSameId(e.viewModel.mail.conversationEntry, ceId))
		if (oldItemIndex === -1) {
			return
		}
		const oldItem = conversation[oldItemIndex]
		if (mail && oldItem.type === "mail" && haveSameId(oldItem.viewModel.mail, mail)) {
			console.log("Noop entry update?", oldItem.viewModel.mail)
			// nothing to do really, why do we get this update again?
		} else {
			if (oldItem.type === "mail") {
				oldItem.viewModel.dispose()
			}

			if (mail) {
				// We do not show trashed drafts
				if (mail.state === MailState.DRAFT && (await this.isInTrash(mail))) {
					conversation.splice(oldItemIndex, 1)
				} else {
					conversation[oldItemIndex] = {
						type: "mail",
						viewModel: this.viewModelFactory({ ...this.options, mail }),
						entryId: conversationEntry._id,
					}
				}
			} else {
				// When DELETED conversation status type is added, replace entry with deleted entry instead of splicing out
				conversation.splice(oldItemIndex, 1)
			}
			this.onUiUpdate()
		}
	}

	private conversationListId() {
		return listIdPart(this._primaryViewModel.mail.conversationEntry)
	}

	private async loadConversation() {
		try {
			if (this.conversationPrefProvider.getConversationViewShowOnlySelectedMail()) {
				this.conversation = this.conversationItemsForSelectedMailOnly()
			} else {
				// Catch errors but only for loading conversation entries.
				// if success, proceed with loading mails
				// otherwise do the error handling
				this.conversation = await this.entityClient.loadAll(ConversationEntryTypeRef, listIdPart(this.primaryMail.conversationEntry)).then(
					async (entries) => {
						// if the primary mail is not along conversation then only display the primary mail
						if (!entries.some((entry) => isSameId(entry.mail, this.primaryMail._id))) {
							return this.conversationItemsForSelectedMailOnly()
						} else {
							const allMails = await this.loadMails(entries)
							return this.createConversationItems(entries, allMails)
						}
					},
					async (e) => {
						if (e instanceof NotAuthorizedError) {
							// Most likely the conversation entry list does not exist anymore. The server does not distinguish between the case when the
							// list does not exist and when we have no permission on it (and for good reasons, it prevents enumeration).
							// Most often it happens when we are not fully synced with the server yet and the primary mail does not even exist.
							return this.conversationItemsForSelectedMailOnly()
						} else {
							throw e
						}
					},
				)
			}
		} finally {
			this.onUiUpdate()
		}
	}

	private createConversationItems(conversationEntries: ConversationEntry[], allMails: Map<Id, Mail>) {
		const newConversation: ConversationItem[] = []
		for (const c of conversationEntries) {
			const mail = c.mail && allMails.get(elementIdPart(c.mail))

			if (mail) {
				newConversation.push({
					type: "mail",
					viewModel: isSameId(mail._id, this.options.mail._id) ? this._primaryViewModel : this.viewModelFactory({ ...this.options, mail }),
					entryId: c._id,
				})
			}
		}
		return newConversation
	}

	private async loadMails(conversationEntries: ConversationEntry[]) {
		const byList = groupBy(conversationEntries, (c) => c.mail && listIdPart(c.mail))
		const allMails: Map<Id, Mail> = new Map()
		for (const [listId, conversations] of byList.entries()) {
			if (!listId) continue
			const loaded = await this.entityClient.loadMultiple(
				MailTypeRef,
				listId,
				conversations.map((c) => elementIdPart(assertNotNull(c.mail))),
			)

			for (const mail of loaded) {
				// If the mail is a draft and is the primary mail, we will show it no matter what
				// otherwise, if a draft is in trash we will not show it
				if (isSameId(mail._id, this.primaryMail._id) || mail.state !== MailState.DRAFT || !(await this.isInTrash(mail))) {
					allMails.set(getElementId(mail), mail)
				}
			}
		}
		return allMails
	}

	private async isInTrash(mail: Mail) {
		const mailboxDetail = await this.mailModel.getMailboxDetailsForMail(mail)
		const mailFolder = this.mailModel.getMailFolderForMail(mail)
		if (mailFolder == null || mailboxDetail == null || mailboxDetail.mailbox.folders == null) {
			return
		}
		const folders = this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id)
		return isOfTypeOrSubfolderOf(folders, mailFolder, MailSetKind.TRASH)
	}

	conversationItems(): ReadonlyArray<ConversationItem> {
		return this.conversation ?? this.conversationItemsForSelectedMailOnly()
	}

	private conversationItemsForSelectedMailOnly(): ConversationItem[] {
		return [{ type: "mail", viewModel: this._primaryViewModel, entryId: this._primaryViewModel.mail.conversationEntry }]
	}

	get primaryMail(): Mail {
		return this._primaryViewModel.mail
	}

	primaryViewModel(): MailViewerViewModel {
		return this._primaryViewModel
	}

	isFinished(): boolean {
		return this.loadingState.isIdle()
	}

	isConnectionLost(): boolean {
		return this.loadingState.isConnectionLost()
	}

	retry() {
		if (this.loadingState.isConnectionLost()) {
			this.loadingState.trackPromise(
				this.loadConversation().then(async () => {
					const mails = (this.conversation?.filter((e) => e.type === "mail") ?? []) as Array<MailItem>
					await Promise.all(mails.map((m) => m.viewModel.loadAll(Promise.resolve())))
				}),
			)
		}
	}

	dispose() {
		// hack: init has been called if loadingPromise is set
		if (this.loadingPromise != null) {
			this.eventController.removeEntityListener(this.onEntityEvent)
			for (const item of this.conversationItems()) {
				if (item.type === "mail") {
					item.viewModel.dispose()
				}
			}
		}
	}
}
