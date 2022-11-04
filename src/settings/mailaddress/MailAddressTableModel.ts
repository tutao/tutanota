import {EntityClient} from "../../api/common/EntityClient.js"
import {createMailAddressProperties, MailboxProperties, MailboxPropertiesTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {MailAddressFacade} from "../../api/worker/facades/MailAddressFacade.js"
import {LoginController} from "../../api/main/LoginController.js"
import stream from "mithril/stream"
import {EntityUpdateData, EventController, isUpdateForTypeRef} from "../../api/main/EventController.js"
import {OperationType} from "../../api/common/TutanotaConstants.js"
import {getSenderName} from "../../misc/MailboxPropertiesUtils.js"
import {getAvailableDomains} from "./MailAddressesUtils.js"
import {MailModel} from "../../mail/model/MailModel.js"
import {CustomerInfoTypeRef} from "../../api/entities/sys/TypeRefs.js"

export interface AliasCount {
	availableToCreate: number
	availableToEnable: number
}

export interface AddressInfo {
	name: string
	address: string
	enabled: boolean
}

/** Model for showing the list of mail addresses and optionally adding more, enabling/disabling/setting names for them. */
export class MailAddressTableModel {
	readonly redraw = stream<void>()
	private mailboxProperties: MailboxProperties | null = null
	private _aliasCount: AliasCount | null = null

	constructor(
		private readonly entityClient: EntityClient,
		private readonly mailAddressFacade: MailAddressFacade,
		private readonly logins: LoginController,
		private readonly eventController: EventController,
		private readonly mailModel: MailModel,
		private readonly mailGroupId: Id,
	) {
		eventController.addEntityListener(this.entityEventsReceived)
	}

	async init() {
		await this.updateAliasCount()
		await this.loadMailboxProperties()
		this.redraw()
	}

	addresses(): AddressInfo[] {
		const {mailboxProperties} = this
		if (mailboxProperties == null) {
			return []
		}
		return this.logins.getUserController().userGroupInfo.mailAddressAliases
				   .slice()
				   .sort((a, b) => (a.mailAddress > b.mailAddress ? 1 : -1))
				   .map(({mailAddress, enabled}) => {
					   return {
						   name: getSenderName(mailboxProperties, mailAddress) ?? "",
						   address: mailAddress,
						   enabled: enabled,
					   }
				   })
	}

	aliasCount(): AliasCount | null {
		return this._aliasCount
	}

	async setAliasName(address: string, senderName: string) {
		if (this.mailboxProperties == null) return
		let aliasConfig = this.mailboxProperties.mailAddressProperties.find((p) => p.mailAddress === address)
		if (aliasConfig == null) {
			aliasConfig = createMailAddressProperties({mailAddress: address})
			this.mailboxProperties.mailAddressProperties.push(aliasConfig)
		}
		aliasConfig.senderName = senderName
		await this.entityClient.update(this.mailboxProperties)
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
		await this.mailAddressFacade.addMailAlias(this.logins.getUserController().userGroupInfo.group, alias)
		await this.updateAliasCount()
	}

	getAvailableDomains(): Promise<string[]> {
		return getAvailableDomains(this.entityClient, this.logins)
	}

	async setAliasStatus(address: string, restore: boolean): Promise<void> {
		await this.mailAddressFacade
				  .setMailAliasStatus(this.logins.getUserController().userGroupInfo.group, address, restore)
		this.redraw()
		await this.updateAliasCount()
	}

	canAddAlias(): "loading" | "freeaccount" | "limitreached" | "ok" {
		if (this._aliasCount == null) {
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
				await this.loadMailboxProperties()
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update)) {
				await this.updateAliasCount()
			}
		}
		this.redraw()
	}

	private async loadMailboxProperties() {
		const mailboxDetails = await this.mailModel.getMailboxDetailsForMailGroup(this.mailGroupId)
		this.mailboxProperties = await this.mailModel.getMailboxProperties(mailboxDetails)
	}

	dispose() {
		this.eventController.removeEntityListener(this.entityEventsReceived)
		this.redraw.end(true)
	}
}