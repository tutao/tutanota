//@flow
import {assertWorkerOrNode} from "../../Env"
import {serviceRequestVoid} from "../EntityWorker"
import {TutanotaService} from "../../entities/tutanota/Services"
import {encryptBytes, encryptKey, encryptString, resolveSessionKey} from "../crypto/CryptoFacade"
import {_TypeModel as GroupInfoTypeModel} from "../../entities/sys/GroupInfo"
import {aes128RandomKey} from "../crypto/Aes"
import type {ShareCapabilityEnum} from "../../common/TutanotaConstants"
import {createSharedGroupData} from "../../entities/tutanota/SharedGroupData"
import {HttpMethod} from "../../common/EntityFunctions"
import {neverNull} from "../../common/utils/Utils"
import {encryptBucketKeyForInternalRecipient} from "./ReceipientKeyDataUtils"
import {RecipientsNotFoundError} from "../../common/error/RecipientsNotFoundError"
import {LoginFacade} from "./LoginFacade"
import {bitArrayToUint8Array, uint8ArrayToBitArray} from "../crypto/CryptoUtils"
import {createGroupInvitationPostData} from "../../entities/tutanota/GroupInvitationPostData"
import {createGroupInvitationPutData} from "../../entities/tutanota/GroupInvitationPutData"
import {createGroupInvitationDeleteData} from "../../entities/tutanota/GroupInvitationDeleteData"

assertWorkerOrNode()


export class ShareFacade {

	_loginFacade: LoginFacade;

	constructor(loginFacade: LoginFacade) {
		this._loginFacade = loginFacade
	}


	sendGroupInvitation(sharedGroupInfo: GroupInfo, sharedGroupName: string, recipients: Array<RecipientInfo>, shareCapability: ShareCapabilityEnum): Promise<void> {
		const sharedGroupKey = this._loginFacade.getGroupKey(sharedGroupInfo.group)
		return resolveSessionKey(GroupInfoTypeModel, this._loginFacade.getUserGroupInfo()).then(userGroupInfoSessionKey => {
			return resolveSessionKey(GroupInfoTypeModel, sharedGroupInfo).then(sharedGroupInfoSessionKey => {
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
				return Promise.each(recipients, (recipient) => {
					return encryptBucketKeyForInternalRecipient(bucketKey, recipient, notFoundRecipients).then(keyData => {
						if (keyData) {
							invitationData.internalKeyData.push(keyData)
						}
					})
				}).then(() => {
					if (notFoundRecipients.length > 0) throw new RecipientsNotFoundError(notFoundRecipients)
					return serviceRequestVoid(TutanotaService.GroupInvitationService, HttpMethod.POST, invitationData)
				})
			})
		})
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
