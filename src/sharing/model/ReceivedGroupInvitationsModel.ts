// @flow

import stream from "mithril/stream/stream.js"
import type {ReceivedGroupInvitation} from "../../api/entities/sys/ReceivedGroupInvitation"
import {ReceivedGroupInvitationTypeRef} from "../../api/entities/sys/ReceivedGroupInvitation"
import {EntityClient} from "../../api/common/EntityClient"
import type {EntityUpdateData} from "../../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../../api/main/EventController"
import {getInvitationGroupType, loadReceivedGroupInvitations} from "../GroupUtils"
import type {GroupTypeEnum} from "../../api/common/TutanotaConstants"
import {OperationType} from "../../api/common/TutanotaConstants"
import type {LoginController} from "../../api/main/LoginController"
import {getLetId, isSameId} from "../../api/common/utils/EntityUtils"
import {promiseMap} from "@tutao/tutanota-utils"

export class ReceivedGroupInvitationsModel {
	+invitations: Stream<Array<ReceivedGroupInvitation>>
	+groupType: GroupTypeEnum

	eventController: EventController
	entityClient: EntityClient
	logins: LoginController

	constructor(groupType: GroupTypeEnum, eventController: EventController, entityClient: EntityClient, logins: LoginController) {
		this.invitations = stream([])
		this.groupType = groupType

		this.eventController = eventController
		this.entityClient = entityClient
		this.logins = logins
	}

	init() {
				this.eventController.addEntityListener(this.entityEventsReceived.bind(this))
		loadReceivedGroupInvitations(this.logins.getUserController(), this.entityClient, this.groupType)
			.then(invitations => this.invitations(invitations.filter(invitation => this.hasCorrectGroupType(invitation))))
	}

	dispose() {
				this.eventController.removeEntityListener(this.entityEventsReceived.bind(this))
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<*> {
		return promiseMap(updates, update => {
			if (isUpdateForTypeRef(ReceivedGroupInvitationTypeRef, update)) {
				const updateId = [update.instanceListId, update.instanceId]
				if (update.operation === OperationType.CREATE) {
					return this.entityClient.load(ReceivedGroupInvitationTypeRef, updateId).then(invitation => {
						if (this.hasCorrectGroupType(invitation)) {
							this.invitations(this.invitations().concat(invitation))
						}
					})
				} else if (update.operation === OperationType.DELETE) {
					this.invitations(this.invitations().filter(invitation => !isSameId(getLetId(invitation), updateId)))
				}
			}
		})
	}

	hasCorrectGroupType(invitation: ReceivedGroupInvitation): boolean {
		return getInvitationGroupType(invitation) === this.groupType
	}
}