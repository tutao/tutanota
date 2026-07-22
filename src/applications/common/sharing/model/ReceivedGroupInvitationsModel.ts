import stream from "mithril/stream"
import Stream from "mithril/stream"
import { getLetId, isSameId, OperationType } from "@tutao/meta"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { EventController } from "../../api/main/EventController"
import { loadReceivedGroupInvitations } from "../GroupUtils"
import type { LoginController } from "../../api/main/LoginController"
import { promiseMap } from "@tutao/utils"
import { ReceivedGroupInvitation, ReceivedGroupInvitationTypeRef } from "@tutao/entities/sys"
import { getInvitationGroupType, ShareableGroupType } from "../../../../entities/sys/Utils"
import {
	EntityUpdatesListener,
	EntityUpdateData,
	isUpdateForTypeRef,
	ListenerPriority,
} from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

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
		this.eventController.addEntityUpdatesListener(this.entityUpdatesListener)
		loadReceivedGroupInvitations(this.logins.getUserController(), this.entityClient, this.groupType).then((invitations) =>
			this.invitations(invitations.filter((invitation) => this.hasMatchingGroupType(invitation))),
		)
	}

	dispose() {
		this.eventController.removeEntityUpdatesListener(this.entityUpdatesListener)
		this.invitations.end(true)
	}

	private readonly entityUpdatesListener: EntityUpdatesListener = {
		id: "ReceivedGroupInvitationsModel",
		onEntityUpdatesReceived: (updates: ReadonlyArray<EntityUpdateData>) => {
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
		},
		priority: ListenerPriority.NORMAL,
	}

	private hasMatchingGroupType(invitation: ReceivedGroupInvitation): boolean {
		return getInvitationGroupType(invitation) === this.groupType
	}
}
