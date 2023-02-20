import { ConversationEntry, ConversationEntryTypeRef, Mail, MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { CreateMailViewerOptions } from "./MailViewer.js"
import { elementIdPart, firstBiggerThanSecond, getElementId, getListId, haveSameId, isSameId, listIdPart } from "../../api/common/utils/EntityUtils.js"
import { assertNotNull, findLast, findLastIndex, groupBy } from "@tutao/tutanota-utils"
import { EntityClient } from "../../api/common/EntityClient.js"
import { LoadingStateTracker } from "../../offline/LoadingState.js"
import { EntityEventsListener, EntityUpdateData, EventController, isUpdateForTypeRef } from "../../api/main/EventController.js"
import { ConversationType, MailFolderType, MailState, OperationType } from "../../api/common/TutanotaConstants.js"
import { NotFoundError } from "../../api/common/error/RestError.js"
import { normalizeSubject } from "../model/MailUtils.js"
import { isOfTypeOrSubfolderOf } from "../../api/common/mail/CommonMailUtils.js"

export type MailViewerViewModelFactory = (options: CreateMailViewerOptions) => MailViewerViewModel

export type MailItem = { type: "mail"; viewModel: MailViewerViewModel; entryId: IdTuple }
export type SubjectItem = { type: "subject"; subject: string; id: string; entryId: IdTuple }
export type DeletedItem = { type: "deleted"; entryId: IdTuple }
export type ConversationItem = MailItem | SubjectItem | DeletedItem

interface ConversationPrefProvider {
	getConversationViewShowOnlySelectedMail(): boolean
}

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
		private readonly onUiUpdate: () => unknown,
	) {
		this._primaryViewModel = viewModelFactory(options)
	}

	init() {
		this.loadingPromise = this.loadingState.trackPromise(this.loadConversation())
		this.eventController.addEntityListener(this.onEntityEvent)
		this._primaryViewModel.expandMail()
	}

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
				const newSubject = normalizeSubject(mail.subject)
				let index = findLastIndex(conversation, (i) => firstBiggerThanSecond(getElementId(entry), elementIdPart(i.entryId)))
				if (index < 0) {
					index = conversation.length
				}
				const lastSubject = findLast(conversation, (c) => c.type === "subject") as SubjectItem | null
				if (newSubject !== lastSubject?.subject) {
					conversation.splice(index + 1, 0, { type: "subject", subject: newSubject, id: getElementId(mail), entryId: entry._id })
					index += 1
				}
				conversation.splice(index + 1, 0, { type: "mail", viewModel: this.viewModelFactory({ ...this.options, mail }), entryId: entry._id })
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
					? await this.entityClient.load(MailTypeRef, conversationEntry.mail)
					: null
		} catch (e) {
			if (e instanceof NotFoundError) {
				// Ignore, something was already deleted
				return
			} else {
				throw e
			}
		}

		const oldItemIndex = conversation.findIndex(
			(e) => (e.type === "mail" && isSameId(e.viewModel.mail.conversationEntry, ceId)) || (e.type === "deleted" && isSameId(e.entryId, ceId)),
		)
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
				const conversationEntries = await this.entityClient.loadAll(ConversationEntryTypeRef, listIdPart(this.primaryMail.conversationEntry))
				const allMails = await this.loadMails(conversationEntries)
				this.conversation = this.createConversationItems(conversationEntries, allMails)
			}
		} finally {
			this.onUiUpdate()
		}
	}

	private createConversationItems(conversationEntries: ConversationEntry[], allMails: Map<Id, Mail>) {
		const newConversation: ConversationItem[] = []
		let previousSubject: string | null = null
		for (const c of conversationEntries) {
			const mail = c.mail && allMails.get(elementIdPart(c.mail))

			if (mail) {
				// Every time subject changes we show it as an item in the conversation list
				// We normalize the subjects so that Re: and FWD: are not shown
				const subject = normalizeSubject(mail.subject)
				if (subject !== previousSubject) {
					previousSubject = subject
					newConversation.push({ type: "subject", subject: subject, id: getElementId(mail), entryId: c._id })
				}

				newConversation.push({
					type: "mail",
					viewModel: isSameId(mail._id, this.options.mail._id) ? this._primaryViewModel : this.viewModelFactory({ ...this.options, mail }),
					entryId: c._id,
				})
			}
			// add newConversation.push({ type: "deleted", entryId: c._id }) when we have DELETED conversation entry status
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
		const mailboxDetail = await this._primaryViewModel.mailModel.getMailboxDetailsForMail(mail)
		const mailFolder = this._primaryViewModel.mailModel.getMailFolder(getListId(mail))
		return mailFolder && mailboxDetail && isOfTypeOrSubfolderOf(mailboxDetail.folders, mailFolder, MailFolderType.TRASH)
	}

	conversationItems(): ReadonlyArray<ConversationItem> {
		return this.conversation ?? this.conversationItemsForSelectedMailOnly()
	}

	private conversationItemsForSelectedMailOnly(): ConversationItem[] {
		return [
			{
				type: "subject",
				subject: normalizeSubject(this._primaryViewModel.mail.subject),
				id: getElementId(this._primaryViewModel.mail),
				entryId: this._primaryViewModel.mail.conversationEntry,
			},
			{ type: "mail", viewModel: this._primaryViewModel, entryId: this._primaryViewModel.mail.conversationEntry },
		]
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
			this.loadingState.trackPromise(this.loadConversation())
		}
	}

	dispose() {
		for (const item of this.conversationItems()) {
			if (item.type === "mail") {
				item.viewModel.dispose()
			}
		}
	}
}
