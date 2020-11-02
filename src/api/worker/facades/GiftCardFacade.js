// @flow

import {aes128Decrypt, aes128RandomKey} from "../crypto/Aes"
import {GroupType} from "../../common/TutanotaConstants"
import {firstThrow} from "../../common/utils/ArrayUtils"
import {encryptKey} from "../crypto/KeyCryptoUtils"
import {createGiftCardCreateData} from "../../entities/sys/GiftCardCreateData"
import {serviceRequest} from "../EntityWorker"
import {SysService} from "../../entities/sys/Services"
import {HttpMethod, listIdPart} from "../../common/EntityFunctions"
import {GiftCardCreateReturnTypeRef} from "../../entities/sys/GiftCardCreateReturn"
import type {GiftCardCreateReturn} from "../../entities/sys/GiftCardCreateReturn"
import type {LoginFacade} from "./LoginFacade"
import type {GiftCardRedeemGetReturn} from "../../entities/sys/GiftCardRedeemGetReturn"
import {GiftCardRedeemGetReturnTypeRef} from "../../entities/sys/GiftCardRedeemGetReturn"
import {createGiftCardRedeemData} from "../../entities/sys/GiftCardRedeemData"

export class GiftCardFacade {

	_logins: LoginFacade

	constructor(logins: LoginFacade) {
		this._logins = logins
	}

	generateGiftCard(message: string, value: NumberString, countryCode: string): Promise<IdTuple> {

		const sessionKey = aes128RandomKey()
		let adminGroupIds = this._logins.getGroupIds(GroupType.Admin)
		if (adminGroupIds.length === 0) {
			throw new Error("missing admin membership")
		}
		const ownerKey = this._logins.getGroupKey(firstThrow(adminGroupIds)) // adminGroupKey
		const ownerEncSessionKey = encryptKey(ownerKey, sessionKey)

		const data = createGiftCardCreateData({
			message: message,
			value,
			country: countryCode,
			ownerEncSessionKey
		})

		return serviceRequest(SysService.GiftCardService, HttpMethod.POST, data, GiftCardCreateReturnTypeRef, null, sessionKey)
			.then((returnData: GiftCardCreateReturn) => returnData.giftCard)
	}

	updateGiftCard() {

	}

	deleteGiftCard() {

	}

	getGiftCardInfo(id: Id, key: Aes128Key): Promise<GiftCardRedeemGetReturn> {
		const data = createGiftCardRedeemData({giftCardInfo: id})
		return serviceRequest(SysService.GiftCardRedeemService, HttpMethod.GET, data, GiftCardRedeemGetReturnTypeRef, null, key)
	}
}

