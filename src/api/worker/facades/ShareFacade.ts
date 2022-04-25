import type {CryptoFacade} from "../crypto/CryptoFacade"
import {encryptBytes, encryptString} from "../crypto/CryptoFacade"
import {GroupInfoTypeRef} from "../../entities/sys/TypeRefs.js"
import type {GroupInfo, ReceivedGroupInvitation} from "../../entities/sys/TypeRefs.js"
import type {ShareCapability} from "../../common/TutanotaConstants"
import type {GroupInvitationPostReturn} from "../../entities/tutanota/TypeRefs.js"
import {
	createGroupInvitationDeleteData,
	createGroupInvitationPostData,
	createGroupInvitationPutData,
	createSharedGroupData
} from "../../entities/tutanota/TypeRefs.js"
import {neverNull} from "@tutao/tutanota-utils"
import {RecipientsNotFoundError} from "../../common/error/RecipientsNotFoundError"
import {assertWorkerOrNode} from "../../common/Env"
import {aes128RandomKey, bitArrayToUint8Array, encryptKey, uint8ArrayToBitArray} from "@tutao/tutanota-crypto"
import {IServiceExecutor} from "../../common/ServiceRequest"
import {GroupInvitationService} from "../../entities/tutanota/Services.js"
import {UserFacade} from "./UserFacade"
import {EntityClient} from "../../common/EntityClient"

assertWorkerOrNode()

export class ShareFacade {

	constructor(
		private readonly userFacade: UserFacade,
		private readonly cryptoFacade: CryptoFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
	) {
	}

	async sendGroupInvitation(
		sharedGroupInfo: GroupInfo,
		sharedGroupName: string,
		recipientMailAddresses: Array<string>,
		shareCapability: ShareCapability,
	): Promise<GroupInvitationPostReturn> {
		const sharedGroupKey = this.userFacade.getGroupKey(sharedGroupInfo.group)
		const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.userFacade.getLoggedInUser().userGroup.groupInfo)

		const userGroupInfoSessionKey = await this.cryptoFacade.resolveSessionKeyForInstance(userGroupInfo)
		const sharedGroupInfoSessionKey = await this.cryptoFacade.resolveSessionKeyForInstance(sharedGroupInfo)
		const bucketKey = aes128RandomKey()
		const invitationSessionKey = aes128RandomKey()
		const sharedGroupData = createSharedGroupData({
			sessionEncInviterName: encryptString(invitationSessionKey, userGroupInfo.name),
			sessionEncSharedGroupKey: encryptBytes(invitationSessionKey, bitArrayToUint8Array(sharedGroupKey)),
			sessionEncSharedGroupName: encryptString(invitationSessionKey, sharedGroupName),
			bucketEncInvitationSessionKey: encryptKey(bucketKey, invitationSessionKey),
			sharedGroupEncInviterGroupInfoKey: encryptKey(sharedGroupKey, neverNull(userGroupInfoSessionKey)),
			sharedGroupEncSharedGroupInfoKey: encryptKey(sharedGroupKey, neverNull(sharedGroupInfoSessionKey)),
			capability: shareCapability,
			sharedGroup: sharedGroupInfo.group,
		})
		const invitationData = createGroupInvitationPostData({
			sharedGroupData,
			internalKeyData: [],
		})
		const notFoundRecipients: Array<string> = []

		for (let mailAddress of recipientMailAddresses) {
			const keyData = await this.cryptoFacade.encryptBucketKeyForInternalRecipient(bucketKey, mailAddress, notFoundRecipients)

			if (keyData) {
				invitationData.internalKeyData.push(keyData)
			}
		}

		if (notFoundRecipients.length > 0) {
			throw new RecipientsNotFoundError(notFoundRecipients.join("\n"))
		}
		return this.serviceExecutor.post(GroupInvitationService, invitationData)
	}

	async acceptGroupInvitation(invitation: ReceivedGroupInvitation): Promise<void> {
		const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.userFacade.getLoggedInUser().userGroup.groupInfo)
		const userGroupInfoSessionKey = await this.cryptoFacade.resolveSessionKeyForInstance(userGroupInfo)
		const sharedGroupKey = uint8ArrayToBitArray(invitation.sharedGroupKey)
		const serviceData = createGroupInvitationPutData({
			receivedInvitation: invitation._id,
			userGroupEncGroupKey: encryptKey(this.userFacade.getUserGroupKey(), sharedGroupKey),
			sharedGroupEncInviteeGroupInfoKey: encryptKey(sharedGroupKey, neverNull(userGroupInfoSessionKey))
		})
		await this.serviceExecutor.put(GroupInvitationService, serviceData)
	}

	async rejectGroupInvitation(receivedGroupInvitaitonId: IdTuple): Promise<void> {
		const serviceData = createGroupInvitationDeleteData({
			receivedInvitation: receivedGroupInvitaitonId,
		})
		await this.serviceExecutor.delete(GroupInvitationService, serviceData)
	}
}