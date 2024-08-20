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
} from "../api/entities/tutanota/TypeRefs.js"
import { Group, GroupInfo, GroupInfoTypeRef, GroupMembership, GroupTypeRef } from "../api/entities/sys/TypeRefs.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { EventController } from "../api/main/EventController.js"
import { EntityClient } from "../api/common/EntityClient.js"
import { LoginController } from "../api/main/LoginController.js"
import { assertNotNull, lazyMemoized, neverNull, ofClass } from "@tutao/tutanota-utils"
import { FeatureType, MailSetKind, OperationType } from "../api/common/TutanotaConstants.js"
import { getEnabledMailAddressesWithUser } from "./SharedMailUtils.js"
import { PreconditionFailedError } from "../api/common/error/RestError.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"
import m from "mithril"
import { ProgrammingError } from "../api/common/error/ProgrammingError.js"
import { FolderSystem } from "../api/common/mail/FolderSystem.js"

export type MailboxDetail = {
	mailbox: MailBox
	folders: FolderSystem
	mailGroupInfo: GroupInfo
	mailGroup: Group
	mailboxGroupRoot: MailboxGroupRoot
}

export type MailboxCounters = Record<Id, Record<string, number>>

export class MailboxModel {
	/** Empty stream until init() is finished, exposed mostly for map()-ing, use getMailboxDetails to get a promise */
	readonly mailboxDetails: Stream<MailboxDetail[]> = stream()
	private initialization: Promise<void> | null = null
	/**
	 * Map from MailboxGroupRoot id to MailboxProperties
	 * A way to avoid race conditions in case we try to create mailbox properties from multiple places.
	 *
	 */
	private mailboxPropertiesPromises: Map<Id, Promise<MailboxProperties>> = new Map()

	constructor(private readonly eventController: EventController, private readonly entityClient: EntityClient, private readonly logins: LoginController) {}

	// only init listeners once
	private readonly initListeners = lazyMemoized(() => {
		this.eventController.addEntityListener((updates, eventOwnerGroupId) => this.entityEventsReceived(updates, eventOwnerGroupId))
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
			console.warn("mailbox model initialization failed!", e)
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

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(GroupInfoTypeRef, update)) {
				if (update.operation === OperationType.UPDATE) {
					await this._init()
					m.redraw()
				}
			} else if (this.logins.getUserController().isUpdateForLoggedInUserInstance(update, eventOwnerGroupId)) {
				let newMemberships = this.logins.getUserController().getMailGroupMemberships()
				const mailboxDetails = await this.getMailboxDetails()

				if (newMemberships.length !== mailboxDetails.length) {
					await this._init()
					m.redraw()
				}
			}
		}
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

	async loadOrCreateMailboxProperties(mailboxGroupRoot: MailboxGroupRoot): Promise<MailboxProperties> {
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

	loadFolders(folderListId: Id): Promise<MailFolder[]> {
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
}
