import type { GroupInfo, MailAddressAliasServiceReturn } from "../../../entities/sys/TypeRefs.js"
import {
	createDomainMailAddressAvailabilityData,
	createMailAddressAliasGetIn,
	createMailAddressAliasServiceData,
	createMailAddressAliasServiceDataDelete,
	createMultipleMailAddressAvailabilityData,
	createStringWrapper,
	GroupInfoTypeRef,
	GroupTypeRef,
	UserTypeRef,
} from "../../../entities/sys/TypeRefs.js"
import { DomainMailAddressAvailabilityService, MailAddressAliasService, MultipleMailAddressAvailabilityService } from "../../../entities/sys/Services.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { UserFacade } from "../UserFacade.js"
import { EntityClient } from "../../../common/EntityClient.js"
import {
	createChangePrimaryAddressServicePutIn,
	createMailAddressProperties,
	createMailboxProperties,
	MailboxGroupRoot,
	MailboxGroupRootTypeRef,
	MailboxProperties,
	MailboxPropertiesTypeRef,
} from "../../../entities/tutanota/TypeRefs.js"
import { assertNotNull, delay, findAndRemove, getFirstOrThrow, KeyVersion, ofClass } from "@tutao/tutanota-utils"
import { getEnabledMailAddressesForGroupInfo } from "../../../common/utils/GroupUtils.js"
import { PreconditionFailedError } from "../../../common/error/RestError.js"
import { ProgrammingError } from "../../../common/error/ProgrammingError.js"

import { VersionedKey } from "../../crypto/CryptoWrapper.js"
import { ChangePrimaryAddressService } from "../../../entities/tutanota/Services"
import { AdminKeyLoaderFacade } from "../AdminKeyLoaderFacade"
import { DateProvider } from "../../../common/DateProvider"

assertWorkerOrNode()

/**
 * utility to rate limit requests while keeping them as responsive as possible in normal usage.
 *
 * it models a "bucket" that has a limited amount of slots for "tokens", which regenerate at a fixed
 * rate if there is space in the bucket.
 *
 * call nextToken() before each request, and it will issue a token immediately if available or be delayed until a
 * token is generated.
 *
 * using this has the effect of limiting the amount of requests asymptotically to one
 * per timeBetweenTokens milliseconds, while allowing bursts of numberOfSlots back-to-back.
 *
 * Note that this implementation replaces waiting requests for tokens with new ones. It would also be possible to
 * serve all requests while maintaining the rate limit, but we currently don't need that functionality.
 */
export class TokenBucket {
	private lastTokenGeneratedAt: number
	private lastRequestStartTime: number = Number.NEGATIVE_INFINITY
	private sequence: number = 0

	/**
	 * all numeric arguments must be positive!
	 * @param occupiedSlots amount of tokens the bucket starts with
	 * @param numberOfSlots amount of tokens the bucket can hold before it stops generating tokens
	 * @param timeBetweenTokens how long it takes to generate one token
	 * @param delay a function to delay an amount of milliseconds
	 * @param dateProvider a time source
	 */
	constructor(
		private occupiedSlots: number,
		private readonly numberOfSlots: number,
		private readonly timeBetweenTokens: number,
		private readonly delay: (ms: number) => Promise<void>,
		private readonly dateProvider: DateProvider,
	) {
		this.lastTokenGeneratedAt = this.dateProvider.now()
	}

	/**
	 * returns false if it was called concurrently while it executed. In this case, it should be considered cancelled
	 * since no "token" was consumed.
	 * early cancellation is not supported: it will always delay for the full amount.
	 */
	async nextToken(): Promise<boolean> {
		// note: tests are easier to reason about if this function calls now() exactly once.
		const { now, sequence } = this.updateRequestStart()
		// time is not necessarily monotone, so clamp elapsed time to >= 0
		const timeSinceLastGeneratedToken = Math.max(0, now - this.lastTokenGeneratedAt)
		const freeTokenSlots = this.numberOfSlots - this.occupiedSlots
		const maxGeneratedTokens = Math.floor(timeSinceLastGeneratedToken / this.timeBetweenTokens)
		const numberOfGeneratedTokens = Math.min(freeTokenSlots, maxGeneratedTokens)
		const timeSpentOnTokens = numberOfGeneratedTokens * this.timeBetweenTokens

		// fast-forward token generation that we missed since the last call
		if (timeSinceLastGeneratedToken >= this.timeBetweenTokens) {
			this.lastTokenGeneratedAt += timeSpentOnTokens
			this.occupiedSlots += numberOfGeneratedTokens
		}
		if (this.occupiedSlots === 0) {
			const timeUntilNextToken = this.timeBetweenTokens - timeSinceLastGeneratedToken
			await this.delay(timeUntilNextToken)
			// if another request replaced this one, we treat this request as cancelled.
			if (this.lastRequestStartTime > now || this.sequence > sequence) {
				return false
			} else {
				// "now" is now in the past since we were delayed!
				this.lastTokenGeneratedAt = now + timeUntilNextToken
				this.occupiedSlots += 1
			}
		} else if (this.occupiedSlots === this.numberOfSlots) {
			this.lastTokenGeneratedAt = now
		}
		this.occupiedSlots -= 1
		return true
	}

	private updateRequestStart(): { now: number; sequence: number } {
		const now = this.dateProvider.now()
		if (this.lastRequestStartTime >= now) {
			this.sequence += 1
			return { now: this.lastRequestStartTime, sequence: this.sequence }
		} else {
			this.sequence = 0
			this.lastRequestStartTime = now
			return { now, sequence: 0 }
		}
	}
}

export class MailAddressFacade {
	private readonly availabilityBucket

	constructor(
		private readonly userFacade: UserFacade,
		private readonly adminKeyLoaderFacade: AdminKeyLoaderFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly nonCachingEntityClient: EntityClient,
		dateProvider: DateProvider,
	) {
		// this configuration allows at most 6 tokens in a little over 10 seconds
		// and limits it to at most one token every 3.4s on average.
		this.availabilityBucket = new TokenBucket(3, 3, 3400, delay, dateProvider)
	}

	/**
	 * For legacy accounts the given userGroupId is ignored since the alias counters are for the customer
	 */
	getAliasCounters(userGroupId: Id): Promise<MailAddressAliasServiceReturn> {
		const data = createMailAddressAliasGetIn({ targetGroup: userGroupId })
		return this.serviceExecutor.get(MailAddressAliasService, data)
	}

	/**
	 * used to check mail address availability for an existing account (alias, additional user) and during signup.
	 * when used during signup, the signup token must be passed.
	 */
	async isMailAddressAvailable(mailAddress: string, signupToken?: string): Promise<boolean> {
		if (this.userFacade.isFullyLoggedIn()) {
			const data = createDomainMailAddressAvailabilityData({ mailAddress })
			if (!(await this.availabilityBucket.nextToken())) {
				// another check came in while we were waiting
				return false
			}
			const availability = await this.serviceExecutor.get(DomainMailAddressAvailabilityService, data)
			return availability.available
		} else if (signupToken != null) {
			const data = createMultipleMailAddressAvailabilityData({
				signupToken,
				mailAddresses: [createStringWrapper({ value: mailAddress })],
			})
			if (!(await this.availabilityBucket.nextToken())) {
				return false
			}
			const result = await this.serviceExecutor.get(MultipleMailAddressAvailabilityService, data)
			return getFirstOrThrow(result.availabilities).available
		} else {
			throw new ProgrammingError("tried to get mail address availability while not fully logged in without a signup token")
		}
	}

	/**
	 * Add an {@param alias} to {@param targetGroupId}.
	 * {@param targetGroupId} is *not* a Mail group, it is currently only a user group.
	 *
	 * Can only be done by an admin.
	 */
	async addMailAlias(targetGroupId: Id, alias: string): Promise<void> {
		const data = createMailAddressAliasServiceData({
			group: targetGroupId,
			mailAddress: alias,
		})
		await this.serviceExecutor.post(MailAddressAliasService, data)
	}

	/**
	 * Enable/disable an {@param alias} on {@param targetGroupId}.
	 * {@param targetGroupId} is *not* a Mail group, it is currently only a user group.
	 *
	 * {@param restore} means whether the alias will be enabled or disabled.
	 *
	 * Can only be done by an admin.
	 */
	async setMailAliasStatus(targetGroupId: Id, alias: string, restore: boolean): Promise<void> {
		const deleteData = createMailAddressAliasServiceDataDelete({
			mailAddress: alias,
			restore,
			group: targetGroupId,
		})
		await this.serviceExecutor.delete(MailAddressAliasService, deleteData)
	}

	async setPrimaryMailAddress(userId: Id, address: string): Promise<void> {
		const data = createChangePrimaryAddressServicePutIn({
			address,
			user: userId,
		})
		await this.serviceExecutor.put(ChangePrimaryAddressService, data)
	}

	/**
	 * Get mailAddress to senderName mappings for mail group that the specified user is a member of.
	 * if no user is given, the operation is attempted as an admin of the given group.
	 * */
	async getSenderNames(mailGroupId: Id, viaUser?: Id): Promise<Map<string, string>> {
		const mailboxProperties = await this.getOrCreateMailboxProperties(mailGroupId, viaUser)
		return this.collectSenderNames(mailboxProperties)
	}

	/**
	 * Set mailAddress to senderName mapping for mail group that the specified user is a member of.
	 * if no user is specified, the operation will be attempted as an admin of the given group.
	 * */
	async setSenderName(mailGroupId: Id, mailAddress: string, senderName: string, viaUser?: Id): Promise<Map<string, string>> {
		const mailboxProperties = await this.getOrCreateMailboxProperties(mailGroupId, viaUser)
		let mailAddressProperty = mailboxProperties.mailAddressProperties.find((p) => p.mailAddress === mailAddress)
		if (mailAddressProperty == null) {
			mailAddressProperty = createMailAddressProperties({
				mailAddress,
				senderName: "",
			})
			mailboxProperties.mailAddressProperties.push(mailAddressProperty)
		}
		mailAddressProperty.senderName = senderName
		const updatedProperties = await this.updateMailboxProperties(mailboxProperties, viaUser)
		return this.collectSenderNames(updatedProperties)
	}

	/**
	 * remove the sender name of the given mail address.
	 * If no user is given, the operation will be attempted as an admin of the group.
	 */
	async removeSenderName(mailGroupId: Id, mailAddress: string, viaUser: Id): Promise<Map<string, string>> {
		const mailboxProperties = await this.getOrCreateMailboxProperties(mailGroupId, viaUser)
		findAndRemove(mailboxProperties.mailAddressProperties, (p) => p.mailAddress === mailAddress)
		const updatedProperties = await this.updateMailboxProperties(mailboxProperties, viaUser)
		return this.collectSenderNames(updatedProperties)
	}

	private async getOrCreateMailboxProperties(mailGroupId: Id, viaUser?: Id): Promise<MailboxProperties> {
		// Using non-caching entityClient because we are not a member of the user's mail group, and we won't receive updates for it
		const mailboxGroupRoot = await this.nonCachingEntityClient.load(MailboxGroupRootTypeRef, mailGroupId)

		if (mailboxGroupRoot.mailboxProperties == null) {
			const currentGroupKey = viaUser
				? await this.adminKeyLoaderFacade.getCurrentGroupKeyViaUser(mailGroupId, viaUser)
				: await this.adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(mailGroupId)
			mailboxGroupRoot.mailboxProperties = await this.createMailboxProperties(mailboxGroupRoot, currentGroupKey)
		}

		const groupKeyProvider = async (version: KeyVersion) =>
			viaUser
				? await this.adminKeyLoaderFacade.getGroupKeyViaUser(mailGroupId, version, viaUser)
				: await this.adminKeyLoaderFacade.getGroupKeyViaAdminEncGKey(mailGroupId, version)
		const mailboxProperties = await this.nonCachingEntityClient.load(MailboxPropertiesTypeRef, mailboxGroupRoot.mailboxProperties, {
			ownerKeyProvider: groupKeyProvider,
		})

		return mailboxProperties.mailAddressProperties.length === 0 ? this.mailboxPropertiesWithLegacySenderName(mailboxProperties, viaUser) : mailboxProperties
	}

	/**
	 * set the legacy sender name (groupInfo.name) of the group on all assigned mail addresses.
	 * if no user is given, the operation will be attempted as an admin of the group of the given mailboxProperties.
	 * */
	private async mailboxPropertiesWithLegacySenderName(mailboxProperties: MailboxProperties, viaUser?: Id): Promise<MailboxProperties> {
		const groupInfo = viaUser ? await this.loadUserGroupInfo(viaUser) : await this.loadMailGroupInfo(mailboxProperties._ownerGroup!)
		const legacySenderName = groupInfo.name
		const mailAddresses = getEnabledMailAddressesForGroupInfo(groupInfo)
		for (const mailAddress of mailAddresses) {
			mailboxProperties.mailAddressProperties.push(
				createMailAddressProperties({
					mailAddress,
					senderName: legacySenderName,
				}),
			)
		}
		return this.updateMailboxProperties(mailboxProperties, viaUser)
	}

	private async loadUserGroupInfo(userId: Id): Promise<GroupInfo> {
		const user = await this.nonCachingEntityClient.load(UserTypeRef, userId)
		return await this.nonCachingEntityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo)
	}

	private async loadMailGroupInfo(groupId: Id): Promise<GroupInfo> {
		const group = await this.nonCachingEntityClient.load(GroupTypeRef, groupId)
		return await this.nonCachingEntityClient.load(GroupInfoTypeRef, group.groupInfo)
	}

	private async createMailboxProperties(mailboxGroupRoot: MailboxGroupRoot, groupKey: VersionedKey): Promise<Id> {
		const _ownerGroup = mailboxGroupRoot._ownerGroup
		const mailboxProperties = createMailboxProperties({
			...(_ownerGroup != null ? { _ownerGroup } : null), // only set it if it is not null
			reportMovedMails: "",
			mailAddressProperties: [],
		})
		// Using non-caching entityClient because we are not a member of the user's mail group and we won't receive updates for it
		return assertNotNull(
			await this.nonCachingEntityClient.setup(null, mailboxProperties, undefined, { ownerKey: groupKey }).catch(
				ofClass(PreconditionFailedError, (e) => {
					// in admin case it is much harder to run into it because we use non-caching entityClient but it is still possible
					if (e.data && e.data.startsWith("exists:")) {
						const existingId = e.data.substring("exists:".length)
						console.log("mailboxProperties already exists", existingId)
						return existingId
					} else {
						throw new ProgrammingError(`Could not create mailboxProperties, precondition: ${e.data}`)
					}
				}),
			),
		)
	}

	private async updateMailboxProperties(mailboxProperties: MailboxProperties, viaUser?: Id): Promise<MailboxProperties> {
		const groupKeyProvider = async (version: KeyVersion) =>
			viaUser
				? await this.adminKeyLoaderFacade.getGroupKeyViaUser(assertNotNull(mailboxProperties._ownerGroup), version, viaUser)
				: await this.adminKeyLoaderFacade.getGroupKeyViaAdminEncGKey(assertNotNull(mailboxProperties._ownerGroup), version)
		await this.nonCachingEntityClient.update(mailboxProperties, { ownerKeyProvider: groupKeyProvider })
		return await this.nonCachingEntityClient.load(MailboxPropertiesTypeRef, mailboxProperties._id, { ownerKeyProvider: groupKeyProvider })
	}

	private async collectSenderNames(mailboxProperties: MailboxProperties): Promise<Map<string, string>> {
		const result = new Map<string, string>()
		for (const data of mailboxProperties.mailAddressProperties) {
			result.set(data.mailAddress, data.senderName)
		}
		return result
	}
}
