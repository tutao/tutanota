import type { CryptoFacade } from "../../crypto/CryptoFacade.js"
import type { GroupInfo, ReceivedGroupInvitation } from "../../../entities/sys/TypeRefs.js"
import { GroupInfoTypeRef } from "../../../entities/sys/TypeRefs.js"
import type { ShareCapability } from "../../../common/TutanotaConstants.js"
import type { GroupInvitationPostData, GroupInvitationPostReturn, InternalRecipientKeyData } from "../../../entities/tutanota/TypeRefs.js"
import {
	createGroupInvitationDeleteData,
	createGroupInvitationPostData,
	createGroupInvitationPutData,
	createSharedGroupData,
	InternalRecipientKeyDataTypeRef,
} from "../../../entities/tutanota/TypeRefs.js"
import { isSameTypeRef, neverNull } from "@tutao/tutanota-utils"
import { RecipientsNotFoundError } from "../../../common/error/RecipientsNotFoundError.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import { aes256RandomKey, bitArrayToUint8Array, encryptKey, uint8ArrayToBitArray } from "@tutao/tutanota-crypto"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { GroupInvitationService } from "../../../entities/tutanota/Services.js"
import { UserFacade } from "../UserFacade.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { KeyLoaderFacade } from "../KeyLoaderFacade.js"
import { encryptBytes, encryptKeyWithVersionedKey, encryptString, VersionedKey } from "../../crypto/CryptoWrapper.js"

assertWorkerOrNode()

export class ShareFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly cryptoFacade: CryptoFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly keyLoaderFacade: KeyLoaderFacade,
	) {}

	async sendGroupInvitation(
		sharedGroupInfo: GroupInfo,
		recipientMailAddresses: Array<string>,
		shareCapability: ShareCapability,
	): Promise<GroupInvitationPostReturn> {
		const sharedGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(sharedGroupInfo.group)
		const invitationData = await this.prepareGroupInvitation(sharedGroupKey, sharedGroupInfo, recipientMailAddresses, shareCapability)
		return this.sendGroupInvitationRequest(invitationData)
	}

	async sendGroupInvitationRequest(invitationData: GroupInvitationPostData): Promise<GroupInvitationPostReturn> {
		return this.serviceExecutor.post(GroupInvitationService, invitationData)
	}

	async prepareGroupInvitation(
		sharedGroupKey: VersionedKey,
		sharedGroupInfo: GroupInfo,
		recipientMailAddresses: Array<string>,
		shareCapability: ShareCapability,
	): Promise<GroupInvitationPostData> {
		const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.userFacade.getLoggedInUser().userGroup.groupInfo)
		const userGroupInfoSessionKey = await this.cryptoFacade.resolveSessionKeyForInstance(userGroupInfo)
		const sharedGroupInfoSessionKey = await this.cryptoFacade.resolveSessionKeyForInstance(sharedGroupInfo)
		const bucketKey = aes256RandomKey()
		const invitationSessionKey = aes256RandomKey()
		const sharedGroupEncInviterGroupInfoKey = encryptKeyWithVersionedKey(sharedGroupKey, neverNull(userGroupInfoSessionKey))
		const sharedGroupEncSharedGroupInfoKey = encryptKeyWithVersionedKey(sharedGroupKey, neverNull(sharedGroupInfoSessionKey))
		const sharedGroupData = createSharedGroupData({
			sessionEncInviterName: encryptString(invitationSessionKey, userGroupInfo.name),
			sessionEncSharedGroupKey: encryptBytes(invitationSessionKey, bitArrayToUint8Array(sharedGroupKey.object)),
			sessionEncSharedGroupName: encryptString(invitationSessionKey, sharedGroupInfo.name),
			bucketEncInvitationSessionKey: encryptKey(bucketKey, invitationSessionKey),
			capability: shareCapability,
			sharedGroup: sharedGroupInfo.group,
			sharedGroupEncInviterGroupInfoKey: sharedGroupEncInviterGroupInfoKey.key,
			sharedGroupEncSharedGroupInfoKey: sharedGroupEncSharedGroupInfoKey.key,
			sharedGroupKeyVersion: String(sharedGroupKey.version),
		})
		const invitationData = createGroupInvitationPostData({
			sharedGroupData,
			internalKeyData: [],
		})
		const notFoundRecipients: Array<string> = []

		for (let mailAddress of recipientMailAddresses) {
			const keyData = await this.cryptoFacade.encryptBucketKeyForInternalRecipient(userGroupInfo.group, bucketKey, mailAddress, notFoundRecipients)
			if (keyData && isSameTypeRef(keyData._type, InternalRecipientKeyDataTypeRef)) {
				invitationData.internalKeyData.push(keyData as InternalRecipientKeyData)
			}
		}

		if (notFoundRecipients.length > 0) {
			throw new RecipientsNotFoundError(notFoundRecipients.join("\n"))
		}
		return invitationData
	}

	async acceptGroupInvitation(invitation: ReceivedGroupInvitation): Promise<void> {
		const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.userFacade.getLoggedInUser().userGroup.groupInfo)
		const userGroupInfoSessionKey = await this.cryptoFacade.resolveSessionKeyForInstance(userGroupInfo)
		const sharedGroupKey = { object: uint8ArrayToBitArray(invitation.sharedGroupKey), version: Number(invitation.sharedGroupKeyVersion) }
		const userGroupKey = this.userFacade.getCurrentUserGroupKey()
		const userGroupEncGroupKey = encryptKeyWithVersionedKey(userGroupKey, sharedGroupKey.object)
		const sharedGroupEncInviteeGroupInfoKey = encryptKeyWithVersionedKey(sharedGroupKey, neverNull(userGroupInfoSessionKey))
		const serviceData = createGroupInvitationPutData({
			receivedInvitation: invitation._id,
			userGroupEncGroupKey: userGroupEncGroupKey.key,
			sharedGroupEncInviteeGroupInfoKey: sharedGroupEncInviteeGroupInfoKey.key,
			userGroupKeyVersion: userGroupEncGroupKey.encryptingKeyVersion.toString(),
			sharedGroupKeyVersion: sharedGroupEncInviteeGroupInfoKey.encryptingKeyVersion.toString(),
		})
		await this.serviceExecutor.put(GroupInvitationService, serviceData)
	}

	async rejectOrCancelGroupInvitation(receivedGroupInvitationId: IdTuple): Promise<void> {
		const serviceData = createGroupInvitationDeleteData({
			receivedInvitation: receivedGroupInvitationId,
		})
		await this.serviceExecutor.delete(GroupInvitationService, serviceData)
	}
}
