import { EnvProvider, ShareCapability } from "@tutao/app-env"
import { isNotNull, neverNull } from "@tutao/utils"
import { RecipientsNotFoundError } from "../../../network/error/RecipientsNotFoundError.js"
import { cryptoUtils, CryptoWrapper, KeyEncryption, keyToUint8Array, SymmetricCipherUtils, uint8ArrayToKey, VersionedKey } from "@tutao/crypto"
import { IServiceExecutor } from "../../../network/ServiceRequest.js"
import { UserFacade } from "../UserFacade.js"
import { KeyLoaderFacade } from "../../base-crypto/KeyLoaderFacade.js"
import { KeyVerificationMismatchError } from "../../../network/error/KeyVerificationMismatchError"
import { CryptoFacade, toInternalRecipientKeyData } from "../../base-crypto/CryptoFacade"
import { EntityClient } from "../../../network/EntityClient"
import {
	createGroupInvitationDeleteData,
	createGroupInvitationPostData,
	createGroupInvitationPutData,
	createSharedGroupData,
	GroupInvitationPostData,
	GroupInvitationPostReturn,
	GroupInvitationService_DELETE,
	GroupInvitationService_POST,
	GroupInvitationService_PUT,
} from "@tutao/entities/tutanota"
import { GroupInfo, GroupInfoTypeRef, ReceivedGroupInvitation } from "@tutao/entities/sys"
import { InstanceKeyFacade } from "../../base-crypto/InstanceKeyFacade"

EnvProvider.assertWorkerOrNode()

export class ShareFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly cryptoFacade: CryptoFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly instanceKeyFacade: InstanceKeyFacade,
		private readonly symmetricCipherUtils: SymmetricCipherUtils,
		private readonly keyEncryption: KeyEncryption,
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
		return this.serviceExecutor.execute(GroupInvitationService_POST, invitationData, null)
	}

	async prepareGroupInvitation(
		sharedGroupKey: VersionedKey,
		sharedGroupInfo: GroupInfo,
		recipientMailAddresses: Array<string>,
		shareCapability: ShareCapability,
	): Promise<GroupInvitationPostData> {
		const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.userFacade.getLoggedInUser().userGroup.groupInfo)
		const userGroupInfoSessionKey = await this.cryptoFacade.resolveSessionKey(userGroupInfo)
		const sharedGroupInfoSessionKey = await this.cryptoFacade.resolveSessionKey(sharedGroupInfo)
		const bucketKey = this.symmetricCipherUtils.aes256RandomKey()
		const invitationSessionKey = this.symmetricCipherUtils.aes256RandomKey()
		const sharedGroupEncInviterGroupInfoSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(sharedGroupKey, neverNull(userGroupInfoSessionKey))
		const sharedGroupEncSharedGroupInfoSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(sharedGroupKey, neverNull(sharedGroupInfoSessionKey))
		const inviterUserGroupInfoCurrentInstanceKey = await this.instanceKeyFacade.getCurrentInstanceKey(userGroupInfo)
		const sharedGroupEncInviterGroupInfoInstanceKey = this.cryptoWrapper.encryptKeyWithVersionedKey(
			sharedGroupKey,
			inviterUserGroupInfoCurrentInstanceKey.object,
		)
		const sharedGroupInfoCurrentInstanceKey = await this.instanceKeyFacade.getCurrentInstanceKey(sharedGroupInfo)
		const sharedGroupEncSharedGroupInfoInstanceKey = this.cryptoWrapper.encryptKeyWithVersionedKey(sharedGroupKey, sharedGroupInfoCurrentInstanceKey.object)

		// make sure the migration was run or do it now
		const groupInfosWithoutFormerInstanceKeys: GroupInfo[] = []
		if (userGroupInfo._formerInstanceKeys == null) {
			groupInfosWithoutFormerInstanceKeys.push(userGroupInfo)
		}
		if (sharedGroupInfo._formerInstanceKeys == null) {
			groupInfosWithoutFormerInstanceKeys.push(sharedGroupInfo)
		}
		await this.instanceKeyFacade.confirmAndPostInstanceKeysForSharedInstances(groupInfosWithoutFormerInstanceKeys)

		const sharedGroupData = createSharedGroupData({
			sessionEncInviterName: this.cryptoWrapper.encryptString(invitationSessionKey, userGroupInfo.name),
			sessionEncSharedGroupKey: this.cryptoWrapper.encryptBytes(invitationSessionKey, keyToUint8Array(sharedGroupKey.object)),
			sessionEncSharedGroupName: this.cryptoWrapper.encryptString(invitationSessionKey, sharedGroupInfo.name),
			bucketEncInvitationSessionKey: this.keyEncryption.encryptKey(bucketKey, invitationSessionKey),
			capability: shareCapability,
			sharedGroup: sharedGroupInfo.group,
			sharedGroupEncInviterGroupInfoSessionKey: sharedGroupEncInviterGroupInfoSessionKey.key,
			sharedGroupEncSharedGroupInfoSessionKey: sharedGroupEncSharedGroupInfoSessionKey.key,
			sharedGroupKeyVersion: String(sharedGroupKey.version),
			sharedGroupEncInviterGroupInfoInstanceKey: sharedGroupEncInviterGroupInfoInstanceKey.key,
			inviterGroupInfoInstanceKeyVersion: String(inviterUserGroupInfoCurrentInstanceKey.version),
			sharedGroupEncSharedGroupInfoInstanceKey: sharedGroupEncSharedGroupInfoInstanceKey.key,
			sharedGroupInfoInstanceKeyVersion: String(sharedGroupInfoCurrentInstanceKey.version),
		})
		const invitationData = createGroupInvitationPostData({
			sharedGroupData,
			internalKeyData: [],
		})
		const notFoundRecipients: Array<string> = []
		const keyVerificationMismatchRecipients: Array<string> = []

		for (let mailAddress of recipientMailAddresses) {
			const keyData = await this.cryptoFacade.encryptBucketKeyForInternalRecipientMailAddress(
				userGroupInfo.group,
				bucketKey,
				mailAddress,
				notFoundRecipients,
				keyVerificationMismatchRecipients,
			)
			if (isNotNull(keyData) && keyData.pubEncRecipientKeyData != null) {
				invitationData.internalKeyData.push(toInternalRecipientKeyData(keyData.pubEncRecipientKeyData))
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

	async acceptGroupInvitation(invitation: ReceivedGroupInvitation): Promise<void> {
		const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this.userFacade.getLoggedInUser().userGroup.groupInfo)
		// make sure the migration was run or do it now
		if (userGroupInfo._formerInstanceKeys == null) {
			await this.instanceKeyFacade.confirmAndPostInstanceKeysForSharedInstances([userGroupInfo])
		}
		const userGroupInfoSessionKey = await this.cryptoFacade.resolveSessionKey(userGroupInfo)
		const sharedGroupKey = {
			object: uint8ArrayToKey(invitation.sharedGroupKey),
			version: cryptoUtils.parseKeyVersion(invitation.sharedGroupKeyVersion),
		}
		const userGroupKey = this.userFacade.getCurrentUserGroupKey()
		const userGroupEncGroupKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, sharedGroupKey.object)
		const sharedGroupEncInviteeGroupInfoSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(sharedGroupKey, neverNull(userGroupInfoSessionKey))
		const userGroupInfoCurrentInstanceKey = await this.instanceKeyFacade.getCurrentInstanceKey(userGroupInfo)
		const sharedGroupEncInviteeGroupInfoInstanceKey = this.cryptoWrapper.encryptKeyWithVersionedKey(sharedGroupKey, userGroupInfoCurrentInstanceKey.object)
		const serviceData = createGroupInvitationPutData({
			receivedInvitation: invitation._id,
			userGroupEncGroupKey: userGroupEncGroupKey.key,
			sharedGroupEncInviteeGroupInfoSessionKey: sharedGroupEncInviteeGroupInfoSessionKey.key,
			userGroupKeyVersion: String(userGroupEncGroupKey.encryptingKeyVersion),
			sharedGroupKeyVersion: String(sharedGroupEncInviteeGroupInfoSessionKey.encryptingKeyVersion),
			sharedGroupEncInviteeGroupInfoInstanceKey: sharedGroupEncInviteeGroupInfoInstanceKey.key,
			inviteeGroupInfoInstanceKeyVersion: String(userGroupInfoCurrentInstanceKey.version),
		})
		await this.serviceExecutor.execute(GroupInvitationService_PUT, serviceData, null)
	}

	async rejectOrCancelGroupInvitation(receivedGroupInvitationId: IdTuple): Promise<void> {
		const serviceData = createGroupInvitationDeleteData({
			receivedInvitation: receivedGroupInvitationId,
		})
		await this.serviceExecutor.execute(GroupInvitationService_DELETE, serviceData, null)
	}
}
