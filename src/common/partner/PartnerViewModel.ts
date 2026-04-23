import { ReceivedGroupInvitationsModel } from "../sharing/model/ReceivedGroupInvitationsModel"
import { GroupType } from "@tutao/app-env"
import Stream from "mithril/stream"
import { sysTypeRefs } from "@tutao/typerefs"

export class PartnerViewModel {
	constructor(private readonly adminInvitationsModel: ReceivedGroupInvitationsModel<GroupType.Admin>) {
		adminInvitationsModel.init()
	}

	get adminInvitations(): Stream<Array<sysTypeRefs.ReceivedGroupInvitation>> {
		return this.adminInvitationsModel.invitations
	}
}
