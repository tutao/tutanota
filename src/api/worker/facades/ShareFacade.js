//@flow
import {assertWorkerOrNode} from "../../Env"
import {load, serviceRequestVoid} from "../EntityWorker"
import {TutanotaService} from "../../entities/tutanota/Services"
import {createInvitationPostData} from "../../entities/tutanota/InvitationPostData"
import {encryptKey, resolveSessionKey} from "../crypto/CryptoFacade"
import {_TypeModel as GroupInfoTypeModel, GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {GroupTypeRef} from "../../entities/sys/Group"
import {aes128RandomKey} from "../crypto/Aes"
import type {ShareCapabilityEnum} from "../../common/TutanotaConstants"
import {createSharedGroupData} from "../../entities/tutanota/SharedGroupData"
import {HttpMethod} from "../../common/EntityFunctions"
import {neverNull} from "../../common/utils/Utils"
import {encryptBucketKeyForInternalRecipient} from "./ReceipientKeyDataUtils"
import {RecipientsNotFoundError} from "../../common/error/RecipientsNotFoundError"
import {LoginFacade} from "./LoginFacade"

assertWorkerOrNode()


export class ShareFacade {

	_loginFacade: LoginFacade;

	constructor(loginFacade: LoginFace) {
		this._loginFacade = loginFacade
	}


	sendGroupInvitation(groupId: Id, recipients: Array<RecipientInfo>, shareCapability: ShareCapabilityEnum): Promise<void> {
		return this.resolveGroupKeys(groupId).then(groupKeys => {
			const bucketKey = aes128RandomKey()
			const sharedGroupData = createSharedGroupData({
				bucketEncGInfoKey: encryptKey(bucketKey, groupKeys.groupInfoKey),
				bucketEncGKey: encryptKey(bucketKey, groupKeys.groupKey),
				capability: shareCapability,
				group: groupId
			})

			const invitationData = createInvitationPostData({
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
				return serviceRequestVoid(TutanotaService.InvitationService, HttpMethod.POST, invitationData)
			})
		})
	}

	resolveGroupKeys(groupId: Id): Promise<{groupKey: Aes128Key, groupInfoKey: Aes128Key}> {
		return load(GroupTypeRef, groupId).then(group => {
			return load(GroupInfoTypeRef, group.groupInfo).then(groupInfo => {
				return resolveSessionKey(GroupInfoTypeModel, groupInfo).then(groupInfoKey => {
					return {
						groupKey: this._loginFacade.getGroupKey(groupId),
						groupInfoKey: neverNull(groupInfoKey)
					}
				})
			})
		})
	}


}
