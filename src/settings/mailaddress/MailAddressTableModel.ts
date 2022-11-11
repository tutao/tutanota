import {EntityClient} from "../../api/common/EntityClient.js"
import {MailboxPropertiesTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {MailAddressFacade} from "../../api/worker/facades/MailAddressFacade.js"
import {LoginController} from "../../api/main/LoginController.js"
import stream from "mithril/stream"
import {EntityUpdateData, EventController, isUpdateFor, isUpdateForTypeRef} from "../../api/main/EventController.js"
import {OperationType} from "../../api/common/TutanotaConstants.js"
import {getAvailableDomains} from "./MailAddressesUtils.js"
import {CustomerInfoTypeRef, GroupInfo, GroupInfoTypeRef} from "../../api/entities/sys/TypeRefs.js"
import {assertNotNull} from "@tutao/tutanota-utils"
import {isTutanotaMailAddress} from "../../mail/model/MailUtils.js"

export interface AliasCount {
	availableToCreate: number
	availableToEnable: number
}

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
}

/** Model for showing the list of mail addresses and optionally adding more, enabling/disabling/setting names for them. */
export class MailAddressTableModel {
	readonly redraw = stream<void>()
	private _aliasCount: AliasCount | null = null
	private nameMappings: AddressToName | null = null

	constructor(
		private readonly entityClient: EntityClient,
		private readonly mailAddressFacade: MailAddressFacade,
		private readonly logins: LoginController,
		private readonly eventController: EventController,
		private userGroupInfo: GroupInfo,
		private readonly nameChanger: MailAddressNameChanger,
	) {
		eventController.addEntityListener(this.entityEventsReceived)
	}

	async init() {
		await this.updateAliasCount()
		await this.loadNames()
		this.redraw()
	}

	dispose() {
		this.eventController.removeEntityListener(this.entityEventsReceived)
		this.redraw.end(true)
	}

	userCanModifyAliases(): boolean {
		return this.logins.getUserController().isGlobalAdmin()
	}

	addresses(): AddressInfo[] {
		const {nameMappings} = this
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
								.map(({mailAddress, enabled}) => {
									const status =
										// O(aliases * TUTANOTA_MAIL_ADDRESS_DOMAINS)
										(isTutanotaMailAddress(mailAddress))
											? (enabled)
												? AddressStatus.Alias
												: AddressStatus.DisabledAlias
											: AddressStatus.Custom

									return {
										name: nameMappings.get(mailAddress) ?? "",
										address: mailAddress,
										status,
									}
								})
		return [primaryAddressInfo, ...aliasesInfo]
	}

	aliasCount(): AliasCount | null {
		return this._aliasCount
	}

	async setAliasName(address: string, senderName: string) {
		this.nameMappings = await this.nameChanger.setSenderName(address, senderName)
		this.redraw()
	}

	private async updateAliasCount() {
		const mailAddressAliasServiceReturn = await this.mailAddressFacade.getAliasCounters()
		const newNbr = Math.max(0, Number(mailAddressAliasServiceReturn.totalAliases) - Number(mailAddressAliasServiceReturn.usedAliases))
		const newNbrToEnable = Math.max(0, Number(mailAddressAliasServiceReturn.totalAliases) - Number(mailAddressAliasServiceReturn.enabledAliases))
		this._aliasCount = {
			availableToCreate: newNbr,
			availableToEnable: newNbrToEnable,
		}
		this.redraw()
	}

	async addAlias(alias: string): Promise<void> {
		await this.mailAddressFacade.addMailAlias(this.userGroupInfo.group, alias)
		await this.updateAliasCount()
	}

	getAvailableDomains(): Promise<string[]> {
		return getAvailableDomains(this.entityClient, this.logins)
	}

	async setAliasStatus(address: string, restore: boolean): Promise<void> {
		await this.mailAddressFacade
				  .setMailAliasStatus(this.userGroupInfo.group, address, restore)
		this.redraw()
		await this.updateAliasCount()
	}

	checkTryingToAddAlias(): "loading" | "freeaccount" | "limitreached" | "notanadmin" | "ok" {
		if (!this.logins.getUserController().isGlobalAdmin()) {
			return "notanadmin"
		} else if (this._aliasCount == null) {
			return "loading"
		} else if (this._aliasCount.availableToCreate === 0) {
			if (this.logins.getUserController().isFreeAccount()) {
				return "freeaccount"
			} else {
				return "limitreached"
			}
		} else {
			return "ok"
		}
	}

	private entityEventsReceived = async (updates: ReadonlyArray<EntityUpdateData>) => {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailboxPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				await this.loadNames()
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update)) {
				await this.updateAliasCount()
			} else if (isUpdateFor(this.userGroupInfo, update) && update.operation === OperationType.UPDATE) {
				this.userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.userGroupInfo._id)
			}
		}
		this.redraw()
	}

	private async loadNames() {
		this.nameMappings = await this.nameChanger.getSenderNames()
	}
}