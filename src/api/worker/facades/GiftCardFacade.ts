import {GroupType} from "../../common/TutanotaConstants"
import {firstThrow} from "@tutao/tutanota-utils"
import {createGiftCardCreateData} from "../../entities/sys/GiftCardCreateData"
import type {LoginFacadeImpl} from "./LoginFacade"
import type {GiftCardRedeemGetReturn} from "../../entities/sys/GiftCardRedeemGetReturn"
import {createGiftCardRedeemData} from "../../entities/sys/GiftCardRedeemData"
import {aes128RandomKey, base64ToKey, bitArrayToUint8Array, encryptKey, sha256Hash} from "@tutao/tutanota-crypto"
import {IServiceExecutor} from "../../common/ServiceRequest"
import {GiftCardRedeemService, GiftCardService} from "../../entities/sys/Services"

export interface GiftCardFacade {
	generateGiftCard(message: string, value: NumberString, countryCode: string): Promise<IdTuple>

	getGiftCardInfo(id: Id, key: string): Promise<GiftCardRedeemGetReturn>

	redeemGiftCard(id: Id, key: string): Promise<void>
}

export class GiftCardFacadeImpl implements GiftCardFacade {
	_logins: LoginFacadeImpl

	constructor(
		logins: LoginFacadeImpl,
		private readonly serviceExecutor: IServiceExecutor,
	) {
		this._logins = logins
	}

	generateGiftCard(message: string, value: NumberString, countryCode: string): Promise<IdTuple> {
		const sessionKey = aes128RandomKey()
		const keyHash = sha256Hash(bitArrayToUint8Array(sessionKey))

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
			ownerEncSessionKey,
		})
		return this.serviceExecutor.post(GiftCardService, data, {sessionKey})
				   .then((returnData) => returnData.giftCard)
	}

	getGiftCardInfo(id: Id, key: string): Promise<GiftCardRedeemGetReturn> {
		const bitKey = base64ToKey(key)
		const keyHash = sha256Hash(bitArrayToUint8Array(bitKey))
		const data = createGiftCardRedeemData({
			giftCardInfo: id,
			keyHash: keyHash,
		})
		return this.serviceExecutor.get(GiftCardRedeemService, data, {sessionKey: bitKey})
	}

	async redeemGiftCard(id: Id, key: string): Promise<void> {
		const bitKey = base64ToKey(key)
		const keyHash = sha256Hash(bitArrayToUint8Array(bitKey))
		const data = createGiftCardRedeemData({
			giftCardInfo: id,
			keyHash: keyHash,
		})
		await this.serviceExecutor.post(GiftCardRedeemService, data)
	}
}