import { AddressToName, MailAddressNameChanger } from "./MailAddressTableModel.js"
import { MailAddressFacade } from "../../api/worker/facades/lazy/MailAddressFacade.js"

/**
 * A {@link MailAddressNameChanger} for aliases bound to a shared mail group.
 * Shared mailboxes have no owning user, so we always act as an admin of the group.
 */
export class SharedMailboxNameChanger implements MailAddressNameChanger {
	constructor(
		private readonly mailAddressFacade: MailAddressFacade,
		private readonly mailGroupId: Id,
	) {}

	getSenderNames(): Promise<AddressToName> {
		return this.mailAddressFacade.getSenderNames(this.mailGroupId)
	}

	setSenderName(address: string, name: string): Promise<AddressToName> {
		return this.mailAddressFacade.setSenderName(this.mailGroupId, address, name)
	}

	removeSenderName(address: string): Promise<AddressToName> {
		return this.mailAddressFacade.removeSenderName(this.mailGroupId, address)
	}
}
