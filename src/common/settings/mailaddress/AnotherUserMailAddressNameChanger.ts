import { AddressToName, MailAddressNameChanger } from "./MailAddressTableModel.js"
import { MailAddressFacade } from "../../api/worker/facades/lazy/MailAddressFacade.js"

/**
 *  A {@link MailAddressNameChanger} intended for admins to set names for aliases bound to user mailboxes.
 *  We can't normally update instances for the groups we are not member of so we do it via a service.
 */
export class AnotherUserMailAddressNameChanger implements MailAddressNameChanger {
	constructor(private readonly mailAddressFacade: MailAddressFacade, private readonly mailGroupId: Id, private readonly userId: Id) {}

	getSenderNames(): Promise<AddressToName> {
		return this.mailAddressFacade.getSenderNames(this.mailGroupId, this.userId)
	}

	setSenderName(address: string, name: string): Promise<AddressToName> {
		return this.mailAddressFacade.setSenderName(this.mailGroupId, address, name, this.userId)
	}

	removeSenderName(address: string): Promise<AddressToName> {
		return this.mailAddressFacade.removeSenderName(this.mailGroupId, address, this.userId)
	}
}
