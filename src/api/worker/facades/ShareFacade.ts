import type {CryptoFacade} from "../crypto/CryptoFacade"
import {encryptBytes, encryptString, resolveSessionKey} from "../crypto/CryptoFacade"
import type {GroupInfo} from "../../entities/sys/GroupInfo"
import {_TypeModel as GroupInfoTypeModel} from "../../entities/sys/GroupInfo"
import type {ShareCapability} from "../../common/TutanotaConstants"
import {createSharedGroupData} from "../../entities/tutanota/SharedGroupData"
import {neverNull} from "@tutao/tutanota-utils"
import {RecipientsNotFoundError} from "../../common/error/RecipientsNotFoundError"
import {LoginFacadeImpl} from "./LoginFacade"
import {createGroupInvitationPostData} from "../../entities/tutanota/GroupInvitationPostData"
import {createGroupInvitationPutData} from "../../entities/tutanota/GroupInvitationPutData"
import {createGroupInvitationDeleteData} from "../../entities/tutanota/GroupInvitationDeleteData"
import type {GroupInvitationPostReturn} from "../../entities/tutanota/GroupInvitationPostReturn"
import type {ReceivedGroupInvitation} from "../../entities/sys/ReceivedGroupInvitation"
import {assertWorkerOrNode} from "../../common/Env"
import {aes128RandomKey, bitArrayToUint8Array, encryptKey, uint8ArrayToBitArray} from "@tutao/tutanota-crypto"
import {IServiceExecutor} from "../../common/ServiceRequest"
import {GroupInvitationService} from "../../entities/tutanota/Services"

assertWorkerOrNode()

export class ShareFacade {
	_loginFacade: LoginFacadeImpl
	_crypto: CryptoFacade

	constructor(
		loginFacade: LoginFacadeImpl,
		crypto: CryptoFacade,
		private readonly serviceExecutor: IServiceExecutor
	) {
		this._loginFacade = loginFacade
		this._crypto = crypto
	}

	async sendGroupInvitation(
		sharedGroupInfo: GroupInfo,
		sharedGroupName: string,
		recipientMailAddresses: Array<string>,
		shareCapability: ShareCapability,
	): Promise<GroupInvitationPostReturn> {
		const sharedGroupKey = this._loginFacade.getGroupKey(sharedGroupInfo.group)

		const userGroupInfoSessionKey = await resolveSessionKey(GroupInfoTypeModel, this._loginFacade.getUserGroupInfo())
		const sharedGroupInfoSessionKey = await resolveSessionKey(GroupInfoTypeModel, sharedGroupInfo)
		const bucketKey = aes128RandomKey()
		const invitationSessionKey = aes128RandomKey()
		const sharedGroupData = createSharedGroupData({
			sessionEncInviterName: encryptString(invitationSessionKey, this._loginFacade.getUserGroupInfo().name),
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
			const keyData = await this._crypto.encryptBucketKeyForInternalRecipient(bucketKey, mailAddress, notFoundRecipients)

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
		const userGroupInfoSessionKey = await resolveSessionKey(GroupInfoTypeModel, this._loginFacade.getUserGroupInfo())
		const sharedGroupKey = uint8ArrayToBitArray(invitation.sharedGroupKey)
		const serviceData = createGroupInvitationPutData({
			receivedInvitation: invitation._id,
			userGroupEncGroupKey: encryptKey(this._loginFacade.getUserGroupKey(), sharedGroupKey),
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