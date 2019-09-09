//@flow


import {createPublicKeyData} from "../../entities/sys/PublicKeyData"
import {serviceRequest} from "../EntityWorker"
import {SysService} from "../../entities/sys/Services"
import {HttpMethod} from "../../common/EntityFunctions"
import {PublicKeyReturnTypeRef} from "../../entities/sys/PublicKeyReturn"
import {hexToPublicKey, rsaEncrypt} from "../crypto/Rsa"
import {uint8ArrayToHex} from "../../common/utils/Encoding"
import {bitArrayToUint8Array} from "../crypto/CryptoUtils"
import {createInternalRecipientKeyData} from "../../entities/tutanota/InternalRecipientKeyData"
import {NotFoundError, TooManyRequestsError} from "../../common/error/RestError"
import {RecipientNotResolvedError} from "../../common/error/RecipientNotResolvedError"


export function encryptBucketKeyForInternalRecipient(bucketKey: Aes128Key, recipientInfo: RecipientInfo, notFoundRecipients: Array<string>): Promise<?InternalRecipientKeyData> {
	let keyData = createPublicKeyData()
	keyData.mailAddress = recipientInfo.mailAddress
	return serviceRequest(SysService.PublicKeyService, HttpMethod.GET, keyData, PublicKeyReturnTypeRef)
		.then(publicKeyData => {
			let publicKey = hexToPublicKey(uint8ArrayToHex(publicKeyData.pubKey))
			let uint8ArrayBucketKey = bitArrayToUint8Array(bucketKey)
			if (notFoundRecipients.length === 0) {
				return rsaEncrypt(publicKey, uint8ArrayBucketKey).then(encrypted => {
					let data = createInternalRecipientKeyData()
					data.mailAddress = recipientInfo.mailAddress
					data.pubEncBucketKey = encrypted
					data.pubKeyVersion = publicKeyData.pubKeyVersion
					return data
				})
			}
		})
		.catch(NotFoundError, e => {
			notFoundRecipients.push(recipientInfo.mailAddress)
		})
		.catch(TooManyRequestsError, e => {
			throw new RecipientNotResolvedError()
		})
}
