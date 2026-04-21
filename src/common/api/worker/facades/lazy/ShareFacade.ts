import type { CryptoFacade } from "../../crypto/CryptoFacade.js"
import { isSameTypeRef, sysTypeRefs, tutanotaServices, tutanotaTypeRefs } from "@tutao/typerefs"
import type { ShareCapability } from "@tutao/app-env"
import { assertWorkerOrNode } from "@tutao/app-env"
import { neverNull } from "@tutao/utils"
import { RecipientsNotFoundError } from "../../../common/error/RecipientsNotFoundError.js"
import {
	_encryptBytes,
	_encryptKeyWithVersionedKey,
	_encryptString,
	aes256RandomKey,
	cryptoUtils,
	encryptKey,
	keyToUint8Array,
	uint8ArrayToKey,
	VersionedKey,
} from "@tutao/crypto"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { UserFacade } from "../UserFacade.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { KeyLoaderFacade } from "../KeyLoaderFacade.js"
import { KeyVerificationMismatchError } from "../../../common/error/KeyVerificationMismatchError"

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
		sharedGroupInfo: sysTypeRefs.GroupInfo,
		recipientMailAddresses: Array<string>,
		shareCapability: ShareCapability,
	): Promise<tutanotaTypeRefs.GroupInvitationPostReturn> {
		const sharedGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(sharedGroupInfo.group)
		const invitationData = await this.prepareGroupInvitation(sharedGroupKey, sharedGroupInfo, recipientMailAddresses, shareCapability)
		return this.sendGroupInvitationRequest(invitationData)
	}

	async sendGroupInvitationRequest(invitationData: tutanotaTypeRefs.GroupInvitationPostData): Promise<tutanotaTypeRefs.GroupInvitationPostReturn> {
		return this.serviceExecutor.post(tutanotaServices.GroupInvitationService, invitationData)
	}

	async prepareGroupInvitation(
		sharedGroupKey: VersionedKey,
		sharedGroupInfo: sysTypeRefs.GroupInfo,
		recipientMailAddresses: Array<string>,
		shareCapability: ShareCapability,
	): Promise<tutanotaTypeRefs.GroupInvitationPostData> {
		const userGroupInfo = await this.entityClient.load(sysTypeRefs.GroupInfoTypeRef, this.userFacade.getLoggedInUser().userGroup.groupInfo)
		const userGroupInfoSessionKey = await this.cryptoFacade.resolveSessionKey(userGroupInfo)
		const sharedGroupInfoSessionKey = await this.cryptoFacade.resolveSessionKey(sharedGroupInfo)
		const bucketKey = aes256RandomKey()
		const invitationSessionKey = aes256RandomKey()
		const sharedGroupEncInviterGroupInfoKey = _encryptKeyWithVersionedKey(sharedGroupKey, neverNull(userGroupInfoSessionKey))
		const sharedGroupEncSharedGroupInfoKey = _encryptKeyWithVersionedKey(sharedGroupKey, neverNull(sharedGroupInfoSessionKey))
		const sharedGroupData = tutanotaTypeRefs.createSharedGroupData({
			sessionEncInviterName: _encryptString(invitationSessionKey, userGroupInfo.name),
			sessionEncSharedGroupKey: _encryptBytes(invitationSessionKey, keyToUint8Array(sharedGroupKey.object)),
			sessionEncSharedGroupName: _encryptString(invitationSessionKey, sharedGroupInfo.name),
			bucketEncInvitationSessionKey: encryptKey(bucketKey, invitationSessionKey),
			capability: shareCapability,
			sharedGroup: sharedGroupInfo.group,
			sharedGroupEncInviterGroupInfoKey: sharedGroupEncInviterGroupInfoKey.key,
			sharedGroupEncSharedGroupInfoKey: sharedGroupEncSharedGroupInfoKey.key,
			sharedGroupKeyVersion: String(sharedGroupKey.version),
		})
		const invitationData = tutanotaTypeRefs.createGroupInvitationPostData({
			sharedGroupData,
			internalKeyData: [],
		})
		const notFoundRecipients: Array<string> = []
		const keyVerificationMismatchRecipients: Array<string> = []

		for (let mailAddress of recipientMailAddresses) {
			const keyData = await this.cryptoFacade.encryptBucketKeyForInternalRecipient(
				userGroupInfo.group,
				bucketKey,
				mailAddress,
				notFoundRecipients,
				keyVerificationMismatchRecipients,
			)
			if (keyData && isSameTypeRef(keyData._type, tutanotaTypeRefs.InternalRecipientKeyDataTypeRef)) {
				invitationData.internalKeyData.push(keyData as tutanotaTypeRefs.InternalRecipientKeyData)
			}
		}

		if (notFoundRecipients.length > 0) {
			throw new RecipientsNotFoundError(notFoundRecipients.join("\n"))
		}

		if (keyVerificationMismatchRecipients.length > 0) {
			throw new KeyVerificationMismatchError("key verification mismatch when sending group invitation").setData(keyVerificationMismatchRecipients)
		}

		return invitationData
	}

	async acceptGroupInvitation(invitation: sysTypeRefs.ReceivedGroupInvitation): Promise<void> {
		const userGroupInfo = await this.entityClient.load(sysTypeRefs.GroupInfoTypeRef, this.userFacade.getLoggedInUser().userGroup.groupInfo)
		const userGroupInfoSessionKey = await this.cryptoFacade.resolveSessionKey(userGroupInfo)
		const sharedGroupKey = {
			object: uint8ArrayToKey(invitation.sharedGroupKey),
			version: cryptoUtils.parseKeyVersion(invitation.sharedGroupKeyVersion),
		}
		const userGroupKey = this.userFacade.getCurrentUserGroupKey()
		const userGroupEncGroupKey = _encryptKeyWithVersionedKey(userGroupKey, sharedGroupKey.object)
		const sharedGroupEncInviteeGroupInfoKey = _encryptKeyWithVersionedKey(sharedGroupKey, neverNull(userGroupInfoSessionKey))
		const serviceData = tutanotaTypeRefs.createGroupInvitationPutData({
			receivedInvitation: invitation._id,
			userGroupEncGroupKey: userGroupEncGroupKey.key,
			sharedGroupEncInviteeGroupInfoKey: sharedGroupEncInviteeGroupInfoKey.key,
			userGroupKeyVersion: userGroupEncGroupKey.encryptingKeyVersion.toString(),
			sharedGroupKeyVersion: sharedGroupEncInviteeGroupInfoKey.encryptingKeyVersion.toString(),
		})
		await this.serviceExecutor.put(tutanotaServices.GroupInvitationService, serviceData)
	}

	async rejectOrCancelGroupInvitation(receivedGroupInvitationId: IdTuple): Promise<void> {
		const serviceData = tutanotaTypeRefs.createGroupInvitationDeleteData({
			receivedInvitation: receivedGroupInvitationId,
		})
		await this.serviceExecutor.delete(tutanotaServices.GroupInvitationService, serviceData)
	}
}
