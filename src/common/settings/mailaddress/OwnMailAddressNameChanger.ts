import { AddressToName, MailAddressNameChanger } from "./MailAddressTableModel.js"
import { MailboxModel } from "../../mailFunctionality/MailboxModel.js"
import { createMailAddressProperties, MailboxProperties } from "../../api/entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { findAndRemove } from "@tutao/tutanota-utils"

/** Name changer for personal mailbox of the currently logged-in user. */
export class OwnMailAddressNameChanger implements MailAddressNameChanger {
	constructor(private readonly mailboxModel: MailboxModel, private readonly entityClient: EntityClient) {}

	async getSenderNames(): Promise<AddressToName> {
		const mailboxProperties = await this.getMailboxProperties()
		return this.collectMap(mailboxProperties)
	}

	async setSenderName(address: string, name: string): Promise<AddressToName> {
		const mailboxDetails = await this.mailboxModel.getUserMailboxDetails()
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		let aliasConfig = mailboxProperties.mailAddressProperties.find((p) => p.mailAddress === address)
		if (aliasConfig == null) {
			aliasConfig = createMailAddressProperties({ mailAddress: address, senderName: name })
			mailboxProperties.mailAddressProperties.push(aliasConfig)
		} else {
			aliasConfig.senderName = name
		}
		await this.entityClient.update(mailboxProperties)
		return this.collectMap(mailboxProperties)
	}

	async removeSenderName(address: string): Promise<AddressToName> {
		const mailboxDetails = await this.mailboxModel.getUserMailboxDetails()
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		findAndRemove(mailboxProperties.mailAddressProperties, (p) => p.mailAddress === address)
		await this.entityClient.update(mailboxProperties)
		return this.collectMap(mailboxProperties)
	}

	private collectMap(mailboxProperties: MailboxProperties): AddressToName {
		const result = new Map()
		for (const properties of mailboxProperties.mailAddressProperties) {
			result.set(properties.mailAddress, properties.senderName)
		}
		return result
	}

	private async getMailboxProperties(): Promise<MailboxProperties> {
		const mailboxDetails = await this.mailboxModel.getUserMailboxDetails()
		return await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
	}
}
