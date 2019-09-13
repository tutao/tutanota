// @flow

import {aes128RandomKey} from "../crypto/Aes"
import {GroupType} from "../../common/TutanotaConstants"
import {firstThrow} from "../../common/utils/ArrayUtils"
import {encryptKey} from "../crypto/KeyCryptoUtils"
import {createGiftCardCreateData} from "../../entities/sys/GiftCardCreateData"
import {serviceRequest, serviceRequestVoid} from "../EntityWorker"
import {SysService} from "../../entities/sys/Services"
import {HttpMethod} from "../../common/EntityFunctions"
import type {GiftCardCreateReturn} from "../../entities/sys/GiftCardCreateReturn"
import {GiftCardCreateReturnTypeRef} from "../../entities/sys/GiftCardCreateReturn"
import type {LoginFacade} from "./LoginFacade"
import type {GiftCardRedeemGetReturn} from "../../entities/sys/GiftCardRedeemGetReturn"
import {GiftCardRedeemGetReturnTypeRef} from "../../entities/sys/GiftCardRedeemGetReturn"
import {createGiftCardRedeemData} from "../../entities/sys/GiftCardRedeemData"
import {hash} from "../crypto/Sha256"
import {bitArrayToUint8Array} from "../crypto/CryptoUtils"

export class GiftCardFacade {

	_logins: LoginFacade

	constructor(logins: LoginFacade) {
		this._logins = logins
	}

	generateGiftCard(message: string, value: NumberString, countryCode: string): Promise<IdTuple> {

		const sessionKey = aes128RandomKey()
		const keyHash = hash(bitArrayToUint8Array(sessionKey))
		let adminGroupIds = this._logins.getGroupIds(GroupType.Admin)
		if (adminGroupIds.length === 0) {
			throw new Error("missing admin membership")
		}
		const ownerKey = this._logins.getGroupKey(firstThrow(adminGroupIds)) // adminGroupKey
		const ownerEncSessionKey = encryptKey(ownerKey, sessionKey)

		const data = createGiftCardCreateData({
			message: message,
			keyHash,
			value,
			country: countryCode,
			ownerEncSessionKey
		})

		return serviceRequest(SysService.GiftCardService, HttpMethod.POST, data, GiftCardCreateReturnTypeRef, null, sessionKey)
			.then((returnData: GiftCardCreateReturn) => returnData.giftCard)
	}

	getGiftCardInfo(id: Id, key: Aes128Key): Promise<GiftCardRedeemGetReturn> {
		const keyHash = hash(bitArrayToUint8Array(key))
		const data = createGiftCardRedeemData({giftCardInfo: id, keyHash: keyHash})
		return serviceRequest(SysService.GiftCardRedeemService, HttpMethod.GET, data, GiftCardRedeemGetReturnTypeRef, null, key)
	}

	redeemGiftCard(id: Id, key: Aes128Key): Promise<void> {
		const keyHash = hash(bitArrayToUint8Array(key))
		const data = createGiftCardRedeemData({giftCardInfo: id, keyHash: keyHash})
		return serviceRequestVoid(SysService.GiftCardRedeemService, HttpMethod.POST, data)
	}
}

