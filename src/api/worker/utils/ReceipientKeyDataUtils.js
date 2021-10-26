//@flow
import {createPublicKeyData} from "../../entities/sys/PublicKeyData"
import {serviceRequest} from "../EntityWorker"
import {SysService} from "../../entities/sys/Services"
import {HttpMethod} from "../../common/EntityFunctions"
import {PublicKeyReturnTypeRef} from "../../entities/sys/PublicKeyReturn"
import {hexToPublicKey, rsaEncrypt} from "../crypto/Rsa"
import {ofClass, uint8ArrayToHex} from "@tutao/tutanota-utils"
import {bitArrayToUint8Array} from "../crypto/CryptoUtils"
import type {InternalRecipientKeyData} from "../../entities/tutanota/InternalRecipientKeyData"
import {createInternalRecipientKeyData} from "../../entities/tutanota/InternalRecipientKeyData"
import {NotFoundError, TooManyRequestsError} from "../../common/error/RestError"
import {RecipientNotResolvedError} from "../../common/error/RecipientNotResolvedError"

export function encryptBucketKeyForInternalRecipient(bucketKey: Aes128Key, recipientMailAddress: string, notFoundRecipients: Array<string>): Promise<?InternalRecipientKeyData> {
	let keyData = createPublicKeyData()
	keyData.mailAddress = recipientMailAddress
	return serviceRequest(SysService.PublicKeyService, HttpMethod.GET, keyData, PublicKeyReturnTypeRef)
		.then(publicKeyData => {
			let publicKey = hexToPublicKey(uint8ArrayToHex(publicKeyData.pubKey))
			let uint8ArrayBucketKey = bitArrayToUint8Array(bucketKey)
			if (notFoundRecipients.length === 0) {
				return rsaEncrypt(publicKey, uint8ArrayBucketKey).then(encrypted => {
					let data = createInternalRecipientKeyData()
					data.mailAddress = recipientMailAddress
					data.pubEncBucketKey = encrypted
					data.pubKeyVersion = publicKeyData.pubKeyVersion
					return data
				})
			}
		})
		.catch(ofClass(NotFoundError, e => {
			notFoundRecipients.push(recipientMailAddress)
		}))
		.catch(ofClass(TooManyRequestsError, e => {
			throw new RecipientNotResolvedError("")
		}))
}
