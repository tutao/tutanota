// @flow
import stream from "mithril/stream/stream.js"
import type {EntityUpdateData} from "../../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../../api/main/EventController"
import {EntityClient} from "../../api/common/EntityClient"
import {getElementId, getEtId, isSameId} from "../../api/common/utils/EntityUtils"
import type {SentGroupInvitation} from "../../api/entities/sys/SentGroupInvitation"
import {SentGroupInvitationTypeRef} from "../../api/entities/sys/SentGroupInvitation"
import type {ShareCapabilityEnum} from "../../api/common/TutanotaConstants"
import {OperationType, ShareCapability} from "../../api/common/TutanotaConstants"
import {NotFoundError} from "../../api/common/error/RestError"
import {findAndRemove} from "../../api/common/utils/ArrayUtils"
import type {GroupMember} from "../../api/entities/sys/GroupMember"
import {GroupMemberTypeRef} from "../../api/entities/sys/GroupMember"
import type {GroupInfo} from "../../api/entities/sys/GroupInfo"
import type {Group} from "../../api/entities/sys/Group"
import {GroupTypeRef} from "../../api/entities/sys/Group"
import type {GroupMemberInfo} from "../GroupUtils"
import {getSharedGroupName, hasCapabilityOnGroup, isSharedGroupOwner, loadGroupInfoForMember, loadGroupMembers} from "../GroupUtils"
import type {LoginController} from "../../api/main/LoginController"
import {UserError} from "../../api/main/UserError"
import type {RecipientInfo} from "../../api/common/RecipientInfo"
import {RecipientInfoType} from "../../api/common/RecipientInfo"
import type {MailAddress} from "../../api/entities/tutanota/MailAddress"
import {lang} from "../../misc/LanguageViewModel"
import {RecipientsNotFoundError} from "../../api/common/error/RecipientsNotFoundError"
import {ProgrammingError} from "../../api/common/error/ProgrammingError"
import {resolveRecipientInfo} from "../../mail/model/MailUtils"
import {ofClass, promiseMap} from "../../api/common/utils/PromiseUtils"
import {noOp} from "../../api/common/utils/Utils"
import type {MailFacade} from "../../api/worker/facades/MailFacade"
import type {ShareFacade} from "../../api/worker/facades/ShareFacade"
import type {GroupManagementFacade} from "../../api/worker/facades/GroupManagementFacade"

export class GroupSharingModel {
	+info: GroupInfo
	+group: Group
	+memberInfos: Array<GroupMemberInfo>
	+sentGroupInvitations: Array<SentGroupInvitation>

	eventController: EventController
	entityClient: EntityClient
	logins: LoginController

	// notifier for outside to do a redraw
	onEntityUpdate: Stream<void>
	_mailFacade: MailFacade
	_shareFacade: ShareFacade
	_groupManagementFacade: GroupManagementFacade

	constructor(groupInfo: GroupInfo,
	            group: Group,
	            memberInfos: Array<GroupMemberInfo>,
	            sentGroupInvitations: Array<SentGroupInvitation>,
	            eventController: EventController,
	            entityClient: EntityClient,
	            logins: LoginController,
				mailFacade: MailFacade,
				shareFacade: ShareFacade,
	            groupManagementFacade: GroupManagementFacade,
	) {

		this.info = groupInfo
		this.group = group
		this.memberInfos = memberInfos
		this.sentGroupInvitations = sentGroupInvitations

		this.eventController = eventController
		this.entityClient = entityClient
		this.logins = logins
		this._mailFacade = mailFacade
		this._shareFacade = shareFacade
		this._groupManagementFacade = groupManagementFacade

		this.onEntityUpdate = stream()

		this.eventController.addEntityListener((events, id) => this.entityEventsReceived(events, id))
	}

	static newAsync(
		info: GroupInfo,
		eventController: EventController,
		entityClient: EntityClient,
		logins: LoginController,
		mailFacade: MailFacade,
		shareFacade: ShareFacade,
		groupManagementFacade: GroupManagementFacade,
	): Promise<GroupSharingModel> {
		return entityClient.load(GroupTypeRef, info.group).then(group =>
			Promise.all([entityClient.loadAll(SentGroupInvitationTypeRef, group.invitations), loadGroupMembers(group, entityClient)])
			       .then(([sentGroupInvitations, memberInfos]) =>
				       new GroupSharingModel(info, group, memberInfos, sentGroupInvitations, eventController, entityClient, logins, mailFacade, shareFacade, groupManagementFacade)))
	}

	dispose() {
		this.eventController.removeEntityListener((events, id) => this.entityEventsReceived(events, id))
	}

	/**
	 * Whether or not a given member can be removed from the group by the current user
	 */
	canRemoveGroupMember(member: GroupMember): boolean {
		return (hasCapabilityOnGroup(this.logins.getUserController().user, this.group, ShareCapability.Invite)
			|| isSameId(this.logins.getUserController().user._id, member.user))
			&& !isSharedGroupOwner(this.group, member.user)
	}

	removeGroupMember(member: GroupMember): Promise<void> {
		return this.canRemoveGroupMember(member)
			? this._groupManagementFacade.removeUserFromGroup(member.user, getEtId(this.group))
			: Promise.reject(new ProgrammingError("User does not have permission to remove this member from the group"))
	}

	/**
	 * Whether or not a given invitation can be cancelled by the current user
	 * @param group
	 * @param sentGroupInvitation
	 * @returns {boolean}
	 */
	canCancelInvitation(sentGroupInvitation: SentGroupInvitation): boolean {
		return hasCapabilityOnGroup(this.logins.getUserController().user, this.group, ShareCapability.Invite)
			|| isSharedGroupOwner(this.group, this.logins.getUserController().user._id)
	}

	cancelInvitation(invitation: SentGroupInvitation): Promise<void> {
		return this.canCancelInvitation(invitation) && invitation.receivedInvitation
			? this._shareFacade.rejectGroupInvitation(invitation.receivedInvitation)
			: Promise.reject(new Error("User does not have permission to cancel this invitation")) // TODO error type
	}


	sendGroupInvitation(sharedGroupInfo: GroupInfo, recipients: Array<RecipientInfo>, capability: ShareCapabilityEnum): Promise<Array<MailAddress>> {
		const externalRecipients = []
		return promiseMap(recipients, (recipient) => {
			return resolveRecipientInfo(this._mailFacade, recipient)
				.then(r => {
					if (r.type !== RecipientInfoType.INTERNAL) {
						externalRecipients.push(r.mailAddress)
					}
				})
		}).then(() => {
			if (externalRecipients.length) {
				throw new UserError(() => lang.get("featureTutanotaOnly_msg") + " " + lang.get("invalidRecipients_msg") + "\n"
					+ externalRecipients.join("\n"))
			}
			return this._shareFacade.sendGroupInvitation(sharedGroupInfo, getSharedGroupName(sharedGroupInfo, false), recipients.map(r => r.mailAddress), capability)
			           .then((groupInvitationReturn) => {
				           if (groupInvitationReturn.existingMailAddresses.length > 0
					           || groupInvitationReturn.invalidMailAddresses.length > 0) {
					           const existingMailAddresses = groupInvitationReturn.existingMailAddresses.map(ma => ma.address).join("\n")
					           const invalidMailAddresses = groupInvitationReturn.invalidMailAddresses.map(ma => ma.address).join("\n")
					           throw new UserError(() => {
						           let msg = ""
						           msg += existingMailAddresses.length === 0
							           ? ""
							           : lang.get("existingMailAddress_msg") + "\n" + existingMailAddresses
						           msg += existingMailAddresses.length === 0 && invalidMailAddresses.length === 0
							           ? ""
							           : "\n\n"
						           msg += invalidMailAddresses.length === 0
							           ? ""
							           : lang.get("invalidMailAddress_msg") + "\n" + invalidMailAddresses
						           return msg
					           })
				           }
				           return groupInvitationReturn.invitedMailAddresses
			           })
			           .catch(ofClass(RecipientsNotFoundError, e => {
				           throw new UserError(() => `${lang.get("tutanotaAddressDoesNotExist_msg")} ${lang.get("invalidRecipients_msg")}\n${e.message}`)
			           }))
		})
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId:Id): Promise<void> {
		return promiseMap(updates, update => {
			if (!isSameId(eventOwnerGroupId, getEtId(this.group))) {
				// ignore events of different group here
				return
			}
			if (isUpdateForTypeRef(SentGroupInvitationTypeRef, update)) {
				if (update.operation === OperationType.CREATE
					&& isSameId(update.instanceListId, this.group.invitations)) {
					return this.entityClient.load(SentGroupInvitationTypeRef, [update.instanceListId, update.instanceId]).then(instance => {
						if (instance) {
							this.sentGroupInvitations.push(instance)
							this.onEntityUpdate()
						}
					}).catch(ofClass(NotFoundError, e => console.log("sent invitation not found", update)))
				}
				if (update.operation === OperationType.DELETE) {
					findAndRemove(this.sentGroupInvitations, (sentGroupInvitation) => isSameId(getElementId(sentGroupInvitation), update.instanceId))
					this.onEntityUpdate()
				}
			} else if (isUpdateForTypeRef(GroupMemberTypeRef, update)) {
				console.log("update received in share dialog", update)
				if (update.operation === OperationType.CREATE
					&& isSameId(update.instanceListId, this.group.members)) {
					return this.entityClient.load(GroupMemberTypeRef, [update.instanceListId, update.instanceId]).then(instance => {
						if (instance) {
							return loadGroupInfoForMember(instance, this.entityClient).then(groupMemberInfo => {
								console.log("new member", groupMemberInfo)
								this.memberInfos.push(groupMemberInfo)
								this.onEntityUpdate()
							})
						}
					}).catch(ofClass(NotFoundError, e => console.log("group member not found", update)))
				}
				if (update.operation === OperationType.DELETE) {
					findAndRemove(this.memberInfos, (memberInfo) => isSameId(getElementId(memberInfo.member), update.instanceId))
					this.onEntityUpdate()
				}
			}
		}).then(noOp)
	}


}