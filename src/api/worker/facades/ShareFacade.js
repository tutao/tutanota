//@flow
import {serviceRequest, serviceRequestVoid} from "../EntityWorker"
import {TutanotaService} from "../../entities/tutanota/Services"
import {encryptBytes, encryptKey, encryptString, resolveSessionKey} from "../crypto/CryptoFacade"
import type {GroupInfo} from "../../entities/sys/GroupInfo"
import {_TypeModel as GroupInfoTypeModel} from "../../entities/sys/GroupInfo"
import {aes128RandomKey} from "../crypto/Aes"
import type {ShareCapabilityEnum} from "../../common/TutanotaConstants"
import {createSharedGroupData} from "../../entities/tutanota/SharedGroupData"
import {HttpMethod} from "../../common/EntityFunctions"
import {neverNull} from "@tutao/tutanota-utils"
import {encryptBucketKeyForInternalRecipient} from "../utils/ReceipientKeyDataUtils"
import {RecipientsNotFoundError} from "../../common/error/RecipientsNotFoundError"
import {LoginFacadeImpl} from "./LoginFacade"
import {bitArrayToUint8Array, uint8ArrayToBitArray} from "../crypto/CryptoUtils"
import {createGroupInvitationPostData} from "../../entities/tutanota/GroupInvitationPostData"
import {createGroupInvitationPutData} from "../../entities/tutanota/GroupInvitationPutData"
import {createGroupInvitationDeleteData} from "../../entities/tutanota/GroupInvitationDeleteData"
import type {GroupInvitationPostReturn} from "../../entities/tutanota/GroupInvitationPostReturn"
import {GroupInvitationPostReturnTypeRef} from "../../entities/tutanota/GroupInvitationPostReturn"
import type {ReceivedGroupInvitation} from "../../entities/sys/ReceivedGroupInvitation"
import {assertWorkerOrNode} from "../../common/Env"

assertWorkerOrNode()


export class ShareFacade {

	_loginFacade: LoginFacadeImpl;

	constructor(loginFacade: LoginFacadeImpl) {
		this._loginFacade = loginFacade
	}


	async sendGroupInvitation(sharedGroupInfo: GroupInfo, sharedGroupName: string, recipientMailAddresses: Array<string>, shareCapability: ShareCapabilityEnum): Promise<GroupInvitationPostReturn> {
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
			sharedGroup: sharedGroupInfo.group
		})

		const invitationData = createGroupInvitationPostData({
			sharedGroupData,
			internalKeyData: []
		})

		const notFoundRecipients: Array<string> = []
		for (let mailAddress of recipientMailAddresses) {
			const keyData = await encryptBucketKeyForInternalRecipient(bucketKey, mailAddress, notFoundRecipients)
			if (keyData) {
				invitationData.internalKeyData.push(keyData)
			}
		}

		if (notFoundRecipients.length > 0) {
			throw new RecipientsNotFoundError(notFoundRecipients.join("\n"))
		}

		return serviceRequest(TutanotaService.GroupInvitationService, HttpMethod.POST, invitationData, GroupInvitationPostReturnTypeRef)
	}


	acceptGroupInvitation(invitation: ReceivedGroupInvitation): Promise<void> {
		return resolveSessionKey(GroupInfoTypeModel, this._loginFacade.getUserGroupInfo()).then(userGroupInfoSessionKey => {
			const sharedGroupKey = uint8ArrayToBitArray(invitation.sharedGroupKey)
			const serviceData = createGroupInvitationPutData()
			serviceData.receivedInvitation = invitation._id
			serviceData.userGroupEncGroupKey = encryptKey(this._loginFacade.getUserGroupKey(), sharedGroupKey)
			serviceData.sharedGroupEncInviteeGroupInfoKey = encryptKey(sharedGroupKey, neverNull(userGroupInfoSessionKey))
			return serviceRequestVoid(TutanotaService.GroupInvitationService, HttpMethod.PUT, serviceData)
		})
	}

	rejectGroupInvitation(receivedGroupInvitaitonId: IdTuple): Promise<void> {
		const serviceData = createGroupInvitationDeleteData({
			receivedInvitation: receivedGroupInvitaitonId
		})
		return serviceRequestVoid(TutanotaService.GroupInvitationService, HttpMethod.DELETE, serviceData)
	}

}
