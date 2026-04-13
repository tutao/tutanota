import stream from "mithril/stream"
import Stream from "mithril/stream"
import { entityUpdateUtils, getLetId, isSameId, sysTypeRefs } from "@tutao/typeRefs"
import { EntityClient } from "../../api/common/EntityClient"
import { EventController } from "../../api/main/EventController"
import { getInvitationGroupType, loadReceivedGroupInvitations, ShareableGroupType } from "../GroupUtils"
import type { LoginController } from "../../api/main/LoginController"
import { promiseMap } from "@tutao/utils"
import { OperationType } from "@tutao/appEnv"

export class ReceivedGroupInvitationsModel<TypeOfGroup extends ShareableGroupType> {
	readonly invitations: Stream<Array<sysTypeRefs.ReceivedGroupInvitation>>

	constructor(
		private readonly groupType: TypeOfGroup,
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
		private readonly logins: LoginController,
	) {
		this.invitations = stream<Array<sysTypeRefs.ReceivedGroupInvitation>>([])
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

	private readonly entityEventsReceived: entityUpdateUtils.EntityEventsListener = {
		onEntityUpdatesReceived: (updates: ReadonlyArray<entityUpdateUtils.EntityUpdateData>) => {
			return promiseMap(updates, (update) => {
				if (entityUpdateUtils.isUpdateForTypeRef(sysTypeRefs.ReceivedGroupInvitationTypeRef, update)) {
					const updateId = [update.instanceListId, update.instanceId] as const

					if (update.operation === OperationType.CREATE) {
						return this.entityClient.load(sysTypeRefs.ReceivedGroupInvitationTypeRef, updateId).then((invitation) => {
							if (this.hasMatchingGroupType(invitation)) {
								this.invitations(this.invitations().concat(invitation))
							}
						})
					} else if (update.operation === OperationType.DELETE) {
						this.invitations(this.invitations().filter((invitation) => !isSameId(getLetId(invitation), updateId)))
					}
				}
			})
		},
		priority: entityUpdateUtils.OnEntityUpdateReceivedPriority.NORMAL,
	}

	private hasMatchingGroupType(invitation: sysTypeRefs.ReceivedGroupInvitation): boolean {
		return getInvitationGroupType(invitation) === this.groupType
	}
}
