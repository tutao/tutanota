import {AddressToName, MailAddressNameChanger} from "./MailAddressTableModel.js"
import {UserManagementFacade} from "../../api/worker/facades/UserManagementFacade.js"

/**
 *  A {@link MailAddressNameChanger} intended for admins to set names for aliases bound to user mailboxes.
 *  We can't normally update instances for the groups we are not member of so we do it via a service.
 */
export class AnotherUserMailAddressNameChanger implements MailAddressNameChanger {
	constructor(
		private readonly userManagementFacade: UserManagementFacade,
		private readonly mailGroupId: Id,
		private readonly userId: Id,
	) {
	}

	getSenderNames(): Promise<AddressToName> {
		return this.userManagementFacade.getSenderNames(this.mailGroupId, this.userId)
	}

	setSenderName(address: string, name: string): Promise<AddressToName> {
		return this.userManagementFacade.setSenderName(this.mailGroupId, this.userId, address, name)
	}

	removeSenderName(address: string): Promise<AddressToName> {
		return this.userManagementFacade.removeSenderName(this.mailGroupId, this.userId, address)
	}
}