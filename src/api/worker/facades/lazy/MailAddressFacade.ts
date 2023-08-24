import type { GroupInfo, MailAddressAliasServiceReturn, MailAddressAvailability } from "../../../entities/sys/TypeRefs.js"
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
	createMailAddressProperties,
	createMailboxProperties,
	MailboxGroupRoot,
	MailboxGroupRootTypeRef,
	MailboxProperties,
	MailboxPropertiesTypeRef,
} from "../../../entities/tutanota/TypeRefs.js"
import { assertNotNull, findAndRemove, getFirstOrThrow, ofClass } from "@tutao/tutanota-utils"
import { getEnabledMailAddressesForGroupInfo } from "../../../common/utils/GroupUtils.js"
import { PreconditionFailedError } from "../../../common/error/RestError.js"
import { ProgrammingError } from "../../../common/error/ProgrammingError.js"
import { GroupManagementFacade } from "./GroupManagementFacade.js"

assertWorkerOrNode()

export class MailAddressFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly groupManagement: GroupManagementFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly nonCachingEntityClient: EntityClient,
	) {}

	isMailAddressAvailable(mailAddress: string): Promise<boolean> {
		if (this.userFacade.isFullyLoggedIn()) {
			const data = createDomainMailAddressAvailabilityData({ mailAddress })
			return this.serviceExecutor.get(DomainMailAddressAvailabilityService, data).then((result) => result.available)
		} else {
			return this.areMailAddressesAvailable([mailAddress]).then((result) => getFirstOrThrow(result).available)
		}
	}

	async areMailAddressesAvailable(mailAddresses: string[]): Promise<MailAddressAvailability[]> {
		const data = createMultipleMailAddressAvailabilityData({
			mailAddresses: mailAddresses.map((mailAddress) => createStringWrapper({ value: mailAddress })),
		})
		const result = await this.serviceExecutor.get(MultipleMailAddressAvailabilityService, data)
		return result.availabilities
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
			mailAddressProperty = createMailAddressProperties({ mailAddress })
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
		const groupKey = viaUser
			? await this.groupManagement.getGroupKeyViaUser(mailGroupId, viaUser)
			: await this.groupManagement.getGroupKeyViaAdminEncGKey(mailGroupId)
		// Using non-caching entityClient because we are not a member of the user's mail group and we won't receive updates for it
		const mailboxGroupRoot = await this.nonCachingEntityClient.load(MailboxGroupRootTypeRef, mailGroupId)
		if (mailboxGroupRoot.mailboxProperties == null) {
			mailboxGroupRoot.mailboxProperties = await this.createMailboxProperties(mailboxGroupRoot, groupKey)
		}
		const mailboxProperties = await this.nonCachingEntityClient.load(
			MailboxPropertiesTypeRef,
			mailboxGroupRoot.mailboxProperties,
			undefined,
			undefined,
			groupKey,
		)

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

	private async createMailboxProperties(mailboxGroupRoot: MailboxGroupRoot, groupKey: Aes128Key): Promise<Id> {
		// Using non-caching entityClient because we are not a member of the user's mail group and we won't receive updates for it
		const mailboxProperties = createMailboxProperties({
			_ownerGroup: mailboxGroupRoot._ownerGroup,
			reportMovedMails: "",
			mailAddressProperties: [],
		})
		return this.nonCachingEntityClient.setup(null, mailboxProperties, undefined, { ownerKey: groupKey }).catch(
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
		)
	}

	private async updateMailboxProperties(mailboxProperties: MailboxProperties, viaUser?: Id): Promise<MailboxProperties> {
		const groupKey = viaUser
			? await this.groupManagement.getGroupKeyViaUser(assertNotNull(mailboxProperties._ownerGroup), viaUser)
			: await this.groupManagement.getGroupKeyViaAdminEncGKey(assertNotNull(mailboxProperties._ownerGroup))
		await this.nonCachingEntityClient.update(mailboxProperties, groupKey)
		return await this.nonCachingEntityClient.load(MailboxPropertiesTypeRef, mailboxProperties._id, undefined, undefined, groupKey)
	}

	private async collectSenderNames(mailboxProperties: MailboxProperties): Promise<Map<string, string>> {
		const result = new Map<string, string>()
		for (const data of mailboxProperties.mailAddressProperties) {
			result.set(data.mailAddress, data.senderName)
		}
		return result
	}
}
