import type {MailAddressAliasServiceReturn, MailAddressAvailability} from "../../entities/sys/TypeRefs.js"
import {
	createDomainMailAddressAvailabilityData,
	createMailAddressAliasServiceData,
	createMailAddressAliasServiceDataDelete,
	createMailAddressAvailabilityData,
	createStringWrapper
} from "../../entities/sys/TypeRefs.js"
import {DomainMailAddressAvailabilityService, MailAddressAliasService, MailAddressAvailabilityService} from "../../entities/sys/Services.js"
import {assertWorkerOrNode} from "../../common/Env"
import {IServiceExecutor} from "../../common/ServiceRequest"
import {UserFacade} from "./UserFacade"
import {firstThrow} from "@tutao/tutanota-utils"

assertWorkerOrNode()

export class MailAddressFacade {
	constructor(
		private readonly user: UserFacade,
		private readonly serviceExecutor: IServiceExecutor,
	) {
	}

	getAliasCounters(): Promise<MailAddressAliasServiceReturn> {
		return this.serviceExecutor.get(MailAddressAliasService, null)
	}

	isMailAddressAvailable(mailAddress: string): Promise<boolean> {
		if (this.user.isFullyLoggedIn()) {
			const data = createDomainMailAddressAvailabilityData({mailAddress})
			return this.serviceExecutor.get(DomainMailAddressAvailabilityService, data)
					   .then(result => result.available)
		} else {
			return this.areMailAddressesAvailable([mailAddress])
					   .then(result => firstThrow(result).available)
		}
	}

	async areMailAddressesAvailable(mailAddresses: string[]): Promise<MailAddressAvailability[]> {
		const data = createMailAddressAvailabilityData({
			mailAddresses: mailAddresses.map(mailAddress => createStringWrapper({value: mailAddress}))
		})
		const result = await this.serviceExecutor.get(MailAddressAvailabilityService, data)
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
}