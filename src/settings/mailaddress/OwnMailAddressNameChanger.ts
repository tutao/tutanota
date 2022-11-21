import {AddressToName, MailAddressNameChanger} from "./MailAddressTableModel.js"
import {MailModel} from "../../mail/model/MailModel.js"
import {createMailAddressProperties, MailboxProperties} from "../../api/entities/tutanota/TypeRefs.js"
import {EntityClient} from "../../api/common/EntityClient.js"

/** Name changer for personal mailbox of the currently logged-in user. */
export class OwnMailAddressNameChanger implements MailAddressNameChanger {
	constructor(
		private readonly mailModel: MailModel,
		private readonly entityClient: EntityClient,
	) {
	}

	async getSenderNames(): Promise<AddressToName> {
		const mailboxProperties = await this.getMailboxProperties()
		return this.collectMap(mailboxProperties)
	}

	async setSenderName(address: string, name: string): Promise<AddressToName> {
		const mailboxDetails = await this.mailModel.getUserMailboxDetails()
		const mailboxProperties =
			await this.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		let aliasConfig = mailboxProperties.mailAddressProperties.find((p) => p.mailAddress === address)
		if (aliasConfig == null) {
			aliasConfig = createMailAddressProperties({mailAddress: address})
			mailboxProperties.mailAddressProperties.push(aliasConfig)
		}
		aliasConfig.senderName = name
		await this.entityClient.update(mailboxProperties)
		return this.collectMap(mailboxProperties)
	}

	private collectMap(mailboxProperties: MailboxProperties) {
		const result = new Map()
		for (const properties of mailboxProperties.mailAddressProperties) {
			result.set(properties.mailAddress, properties.senderName)
		}
		return result
	}

	private async getMailboxProperties(): Promise<MailboxProperties> {
		const mailboxDetails = await this.mailModel.getUserMailboxDetails()
		return await this.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
	}
}