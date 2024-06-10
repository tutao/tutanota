import stream from "mithril/stream"
import Stream from "mithril/stream"
import { EntityEventsListener, EventController } from "../../api/main/EventController"
import { EntityClient } from "../../api/common/EntityClient"
import { getElementId, getEtId, isSameId } from "../../api/common/utils/EntityUtils"
import type { Group, GroupInfo, GroupMember, SentGroupInvitation } from "../../api/entities/sys/TypeRefs.js"
import { GroupMemberTypeRef, GroupTypeRef, SentGroupInvitationTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { OperationType, ShareCapability } from "../../api/common/TutanotaConstants"
import { NotFoundError } from "../../api/common/error/RestError"
import { findAndRemove, noOp, ofClass, promiseMap } from "@tutao/tutanota-utils"
import type { GroupMemberInfo } from "../GroupUtils"
import { hasCapabilityOnGroup, isSharedGroupOwner, loadGroupInfoForMember, loadGroupMembers } from "../GroupUtils"
import type { LoginController } from "../../api/main/LoginController"
import { UserError } from "../../api/main/UserError"
import type { MailAddress } from "../../api/entities/tutanota/TypeRefs.js"
import { lang } from "../../misc/LanguageViewModel"
import { RecipientsNotFoundError } from "../../api/common/error/RecipientsNotFoundError"
import { ProgrammingError } from "../../api/common/error/ProgrammingError"
import type { MailFacade } from "../../api/worker/facades/lazy/MailFacade.js"
import type { ShareFacade } from "../../api/worker/facades/lazy/ShareFacade.js"
import type { GroupManagementFacade } from "../../api/worker/facades/lazy/GroupManagementFacade.js"
import { Recipient, RecipientType } from "../../api/common/recipients/Recipient"
import { RecipientsModel, ResolveMode } from "../../api/main/RecipientsModel"
import { EntityUpdateData, isUpdateForTypeRef } from "../../api/common/utils/EntityUpdateUtils.js"

export class GroupSharingModel {
	readonly info: GroupInfo
	readonly group: Group
	readonly memberInfos: Array<GroupMemberInfo>
	readonly sentGroupInvitations: Array<SentGroupInvitation>
	eventController: EventController
	entityClient: EntityClient
	logins: LoginController
	// notifier for outside to do a redraw
	onEntityUpdate: Stream<void>
	_mailFacade: MailFacade
	_shareFacade: ShareFacade
	_groupManagementFacade: GroupManagementFacade

	constructor(
		groupInfo: GroupInfo,
		group: Group,
		memberInfos: Array<GroupMemberInfo>,
		sentGroupInvitations: Array<SentGroupInvitation>,
		eventController: EventController,
		entityClient: EntityClient,
		logins: LoginController,
		mailFacade: MailFacade,
		shareFacade: ShareFacade,
		groupManagementFacade: GroupManagementFacade,
		private readonly recipientsModel: RecipientsModel,
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
		this.eventController.addEntityListener(this.onEntityEvents)
	}

	private readonly onEntityEvents: EntityEventsListener = (events, id) => this.entityEventsReceived(events, id)

	static newAsync(
		info: GroupInfo,
		eventController: EventController,
		entityClient: EntityClient,
		logins: LoginController,
		mailFacade: MailFacade,
		shareFacade: ShareFacade,
		groupManagementFacade: GroupManagementFacade,
		recipientsModel: RecipientsModel,
	): Promise<GroupSharingModel> {
		return entityClient
			.load(GroupTypeRef, info.group)
			.then((group) =>
				Promise.all([entityClient.loadAll(SentGroupInvitationTypeRef, group.invitations), loadGroupMembers(group, entityClient)]).then(
					([sentGroupInvitations, memberInfos]) =>
						new GroupSharingModel(
							info,
							group,
							memberInfos,
							sentGroupInvitations,
							eventController,
							entityClient,
							logins,
							mailFacade,
							shareFacade,
							groupManagementFacade,
							recipientsModel,
						),
				),
			)
	}

	dispose() {
		this.eventController.removeEntityListener(this.onEntityEvents)
	}

	/**
	 * Whether or not a given member can be removed from the group by the current user
	 */
	canRemoveGroupMember(member: GroupMember): boolean {
		return (
			(hasCapabilityOnGroup(this.logins.getUserController().user, this.group, ShareCapability.Invite) || this.memberIsSelf(member)) &&
			!isSharedGroupOwner(this.group, member.user)
		)
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
		return (
			hasCapabilityOnGroup(this.logins.getUserController().user, this.group, ShareCapability.Invite) ||
			isSharedGroupOwner(this.group, this.logins.getUserController().user._id)
		)
	}

	memberIsSelf(member: GroupMember): boolean {
		return isSameId(this.logins.getUserController().user._id, member.user)
	}

	cancelInvitation(invitation: SentGroupInvitation): Promise<void> {
		return this.canCancelInvitation(invitation) && invitation.receivedInvitation
			? this._shareFacade.rejectOrCancelGroupInvitation(invitation.receivedInvitation)
			: Promise.reject(new Error("User does not have permission to cancel this invitation")) // TODO error type
	}

	async sendGroupInvitation(sharedGroupInfo: GroupInfo, recipients: Array<Recipient>, capability: ShareCapability): Promise<Array<MailAddress>> {
		const externalRecipients: string[] = []
		for (let recipient of recipients) {
			const resolved = await this.recipientsModel.resolve(recipient, ResolveMode.Eager).resolved()
			if (resolved.type !== RecipientType.INTERNAL) {
				externalRecipients.push(resolved.address)
			}
		}
		if (externalRecipients.length) {
			throw new UserError(() => lang.get("featureTutanotaOnly_msg") + " " + lang.get("invalidRecipients_msg") + "\n" + externalRecipients.join("\n"))
		}

		let groupInvitationReturn
		try {
			groupInvitationReturn = await this._shareFacade.sendGroupInvitation(
				sharedGroupInfo,
				recipients.map((r) => r.address),
				capability,
			)
		} catch (e) {
			if (e instanceof RecipientsNotFoundError) {
				throw new UserError(() => `${lang.get("tutanotaAddressDoesNotExist_msg")} ${lang.get("invalidRecipients_msg")}\n${e.message}`)
			} else {
				throw e
			}
		}

		if (groupInvitationReturn.existingMailAddresses.length > 0 || groupInvitationReturn.invalidMailAddresses.length > 0) {
			const existingMailAddresses = groupInvitationReturn.existingMailAddresses.map((ma) => ma.address).join("\n")
			const invalidMailAddresses = groupInvitationReturn.invalidMailAddresses.map((ma) => ma.address).join("\n")
			throw new UserError(() => {
				let msg = ""
				msg += existingMailAddresses.length === 0 ? "" : lang.get("existingMailAddress_msg") + "\n" + existingMailAddresses
				msg += existingMailAddresses.length === 0 && invalidMailAddresses.length === 0 ? "" : "\n\n"
				msg += invalidMailAddresses.length === 0 ? "" : lang.get("invalidMailAddress_msg") + "\n" + invalidMailAddresses
				return msg
			})
		}

		return groupInvitationReturn.invitedMailAddresses
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		return promiseMap(updates, (update) => {
			if (!isSameId(eventOwnerGroupId, getEtId(this.group))) {
				// ignore events of different group here
				return
			}

			if (isUpdateForTypeRef(SentGroupInvitationTypeRef, update)) {
				if (update.operation === OperationType.CREATE && isSameId(update.instanceListId, this.group.invitations)) {
					return this.entityClient
						.load(SentGroupInvitationTypeRef, [update.instanceListId, update.instanceId])
						.then((instance) => {
							if (instance) {
								this.sentGroupInvitations.push(instance)
								this.onEntityUpdate()
							}
						})
						.catch(ofClass(NotFoundError, (e) => console.log("sent invitation not found", update)))
				}

				if (update.operation === OperationType.DELETE) {
					findAndRemove(this.sentGroupInvitations, (sentGroupInvitation) => isSameId(getElementId(sentGroupInvitation), update.instanceId))
					this.onEntityUpdate()
				}
			} else if (isUpdateForTypeRef(GroupMemberTypeRef, update)) {
				console.log("update received in share dialog", update)

				if (update.operation === OperationType.CREATE && isSameId(update.instanceListId, this.group.members)) {
					return this.entityClient
						.load(GroupMemberTypeRef, [update.instanceListId, update.instanceId])
						.then((instance) => {
							if (instance) {
								return loadGroupInfoForMember(instance, this.entityClient).then((groupMemberInfo) => {
									console.log("new member", groupMemberInfo)
									this.memberInfos.push(groupMemberInfo)
									this.onEntityUpdate()
								})
							}
						})
						.catch(ofClass(NotFoundError, (e) => console.log("group member not found", update)))
				}

				if (update.operation === OperationType.DELETE) {
					findAndRemove(this.memberInfos, (memberInfo) => isSameId(getElementId(memberInfo.member), update.instanceId))
					this.onEntityUpdate()
				}
			}
		}).then(noOp)
	}
}
