import { EntityClient } from "../../api/common/EntityClient.js"
import { MailboxPropertiesTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { MailAddressFacade } from "../../api/worker/facades/lazy/MailAddressFacade.js"
import { LoginController } from "../../api/main/LoginController.js"
import { EventController } from "../../api/main/EventController.js"
import { OperationType } from "../../api/common/TutanotaConstants.js"
import { EmailDomainData, getAvailableDomains } from "./MailAddressesUtils.js"
import { GroupInfo, GroupInfoTypeRef, MailAddressAliasServiceReturn } from "../../api/entities/sys/TypeRefs.js"
import { assertNotNull, lazyMemoized } from "@tutao/tutanota-utils"
import { LimitReachedError } from "../../api/common/error/RestError.js"
import { UserError } from "../../api/main/UserError.js"
import { UpgradeRequiredError } from "../../api/main/UpgradeRequiredError.js"
import { IServiceExecutor } from "../../api/common/ServiceRequest.js"
import { getAvailableMatchingPlans } from "../../subscription/SubscriptionUtils.js"
import { EntityUpdateData, isUpdateFor, isUpdateForTypeRef } from "../../api/common/utils/EntityUpdateUtils.js"
import { isTutaMailAddress } from "../../mailFunctionality/SharedMailUtils.js"

export enum AddressStatus {
	Primary,
	Alias,
	DisabledAlias,
	Custom,
}

export interface AddressInfo {
	name: string
	address: string
	status: AddressStatus
}

export type AddressToName = Map<string, string>

/** A strategy to change mail address to sender name mapping. */
export interface MailAddressNameChanger {
	getSenderNames(): Promise<AddressToName>

	setSenderName(address: string, name: string): Promise<AddressToName>

	removeSenderName(address: string): Promise<AddressToName>
}

/** Model for showing the list of mail addresses and optionally adding more, enabling/disabling/setting names for them. */
export class MailAddressTableModel {
	private nameMappings: AddressToName | null = null
	private onLegacyPlan: boolean = false
	aliasCount: MailAddressAliasServiceReturn | null = null

	init: () => Promise<void> = lazyMemoized(async () => {
		this.eventController.addEntityListener(this.entityEventsReceived)

		// important: "not on legacy plan" is true for free plans
		const userController = this.logins.getUserController()
		this.onLegacyPlan = userController.isLegacyPlan(await userController.getPlanType())

		await this.loadNames()
		this.redraw()
		await this.loadAliasCount()
		this.redraw()
	})

	constructor(
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly mailAddressFacade: MailAddressFacade,
		private readonly logins: LoginController,
		private readonly eventController: EventController,
		private userGroupInfo: GroupInfo,
		private readonly nameChanger: MailAddressNameChanger,
		private readonly redraw: () => unknown,
	) {}

	dispose() {
		this.eventController.removeEntityListener(this.entityEventsReceived)
	}

	userCanModifyAliases(): boolean {
		return this.logins.getUserController().isGlobalAdmin()
	}

	aliasLimitIncludesCustomDomains(): boolean {
		return this.onLegacyPlan
	}

	addresses(): AddressInfo[] {
		const { nameMappings } = this
		if (nameMappings == null) {
			return []
		}

		const primaryAddress = assertNotNull(this.userGroupInfo.mailAddress)
		const primaryAddressInfo = {
			name: nameMappings.get(primaryAddress) ?? "",
			address: primaryAddress,
			status: AddressStatus.Primary,
		}

		const aliasesInfo = this.userGroupInfo.mailAddressAliases
			.slice()
			.sort((a, b) => (a.mailAddress > b.mailAddress ? 1 : -1))
			.map(({ mailAddress, enabled }) => {
				const status =
					// O(aliases * TUTA_MAIL_ADDRESS_DOMAINS)
					isTutaMailAddress(mailAddress) ? (enabled ? AddressStatus.Alias : AddressStatus.DisabledAlias) : AddressStatus.Custom

				return {
					name: nameMappings.get(mailAddress) ?? "",
					address: mailAddress,
					status,
				}
			})
		return [primaryAddressInfo, ...aliasesInfo]
	}

	async setAliasName(address: string, senderName: string) {
		this.nameMappings = await this.nameChanger.setSenderName(address, senderName)
		this.redraw()
	}

	/**
	 * Add an alias.
	 * @throws if an error occurred, such as a LimitReachedError if too many aliases were added
	 */
	async addAlias(alias: string, senderName: string): Promise<void> {
		try {
			await this.mailAddressFacade.addMailAlias(this.userGroupInfo.group, alias)
			await this.setAliasName(alias, senderName)
		} catch (e) {
			if (e instanceof LimitReachedError) {
				await this.handleTooManyAliases()
			}
			throw e
		}
	}

	getAvailableDomains(): Promise<EmailDomainData[]> {
		return getAvailableDomains(this.logins)
	}

	async setAliasStatus(address: string, restore: boolean): Promise<void> {
		await this.mailAddressFacade.setMailAliasStatus(this.userGroupInfo.group, address, restore)
		this.redraw()
		this.nameMappings = await this.nameChanger.removeSenderName(address)
		this.redraw()
	}

	defaultSenderName(): string {
		return this.userGroupInfo.name
	}

	private entityEventsReceived = async (updates: ReadonlyArray<EntityUpdateData>) => {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailboxPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				await this.loadNames()
			} else if (isUpdateFor(this.userGroupInfo, update) && update.operation === OperationType.UPDATE) {
				this.userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.userGroupInfo._id)
				await this.loadAliasCount()
			}
		}
		this.redraw()
	}

	private async loadNames() {
		this.nameMappings = await this.nameChanger.getSenderNames()
	}

	private async loadAliasCount() {
		this.aliasCount = await this.mailAddressFacade.getAliasCounters(this.userGroupInfo.group)
	}

	/**
	 * Chooses the correct error to throw.
	 * @throws UpgradeRequiredError if the customer can upgrade to a plan with more aliases
	 * @throws UserError if the customer cannot add more aliases
	 */
	public async handleTooManyAliases(): Promise<void> {
		// Determine if there is an available plan we can switch to that would let the user add an alias.
		// If so, show an upgrade dialog. Otherwise, inform the user that they reached the maximum number of aliases.
		const plansWithMoreAliases = await getAvailableMatchingPlans(
			this.serviceExecutor,
			(config) => Number(config.nbrOfAliases) > this.userGroupInfo.mailAddressAliases.length,
		)
		if (plansWithMoreAliases.length > 0) {
			throw new UpgradeRequiredError("moreAliasesRequired_msg", plansWithMoreAliases)
		} else {
			throw new UserError("adminMaxNbrOfAliasesReached_msg")
		}
	}
}
