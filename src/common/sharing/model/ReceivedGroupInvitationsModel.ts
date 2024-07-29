import stream from "mithril/stream"
import Stream from "mithril/stream"
import type { ReceivedGroupInvitation } from "../../api/entities/sys/TypeRefs.js"
import { ReceivedGroupInvitationTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { EntityClient } from "../../api/common/EntityClient"
import { EventController } from "../../api/main/EventController"
import { getInvitationGroupType, loadReceivedGroupInvitations, ShareableGroupType } from "../GroupUtils"
import { OperationType } from "../../api/common/TutanotaConstants"
import type { LoginController } from "../../api/main/LoginController"
import { getLetId, isSameId } from "../../api/common/utils/EntityUtils"
import { promiseMap } from "@tutao/tutanota-utils"
import { EntityUpdateData, isUpdateForTypeRef } from "../../api/common/utils/EntityUpdateUtils.js"

export class ReceivedGroupInvitationsModel<TypeOfGroup extends ShareableGroupType> {
	readonly invitations: Stream<Array<ReceivedGroupInvitation>>

	constructor(
		private readonly groupType: TypeOfGroup,
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
		private readonly logins: LoginController,
	) {
		this.invitations = stream<Array<ReceivedGroupInvitation>>([])
	}

	init() {
		this.eventController.addEntityListener(this.entityEventsReceived)
		loadReceivedGroupInvitations(this.logins.getUserController(), this.entityClient, this.groupType).then((invitations) =>
			this.invitations(invitations.filter((invitation) => this.hasMatchingGroupType(invitation))),
		)
	}

	dispose() {
		this.eventController.removeEntityListener(this.entityEventsReceived)
		this.invitations.end(true)
	}

	private readonly entityEventsReceived = (updates: ReadonlyArray<EntityUpdateData>) => {
		return promiseMap(updates, (update) => {
			if (isUpdateForTypeRef(ReceivedGroupInvitationTypeRef, update)) {
				const updateId = [update.instanceListId, update.instanceId] as const

				if (update.operation === OperationType.CREATE) {
					return this.entityClient.load(ReceivedGroupInvitationTypeRef, updateId).then((invitation) => {
						if (this.hasMatchingGroupType(invitation)) {
							this.invitations(this.invitations().concat(invitation))
						}
					})
				} else if (update.operation === OperationType.DELETE) {
					this.invitations(this.invitations().filter((invitation) => !isSameId(getLetId(invitation), updateId)))
				}
			}
		})
	}

	private hasMatchingGroupType(invitation: ReceivedGroupInvitation): boolean {
		return getInvitationGroupType(invitation) === this.groupType
	}
}
