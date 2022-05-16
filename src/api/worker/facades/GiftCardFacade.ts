import {GroupType} from "../../common/TutanotaConstants"
import {
	assertNotNull,
	Base64,
	base64ExtToBase64,
	base64ToBase64Ext,
	base64ToBase64Url,
	base64UrlToBase64,
	firstThrow,
	uint8ArrayToBase64
} from "@tutao/tutanota-utils"
import type {GiftCardRedeemGetReturn} from "../../entities/sys/TypeRefs.js"
import {createGiftCardCreateData, createGiftCardRedeemData, GiftCard} from "../../entities/sys/TypeRefs.js"
import type {LoginFacadeImpl} from "./LoginFacade"
import {aes128RandomKey, base64ToKey, bitArrayToUint8Array, encryptKey, sha256Hash} from "@tutao/tutanota-crypto"
import {IServiceExecutor} from "../../common/ServiceRequest"
import {GiftCardRedeemService, GiftCardService} from "../../entities/sys/Services"
import {elementIdPart, GENERATED_MAX_ID} from "../../common/utils/EntityUtils"
import {CryptoFacade} from "../crypto/CryptoFacade"
import {UserFacade} from "./UserFacade"

export interface GiftCardFacade {
	generateGiftCard(message: string, value: NumberString, countryCode: string): Promise<IdTuple>

	getGiftCardInfo(id: Id, key: string): Promise<GiftCardRedeemGetReturn>

	redeemGiftCard(id: Id, key: string): Promise<void>

	encodeGiftCardToken(giftCard: GiftCard): Promise<string>

	decodeGiftCardToken(token: string): Promise<{id: Id, key: Base64}>
}

const ID_LENGTH = GENERATED_MAX_ID.length
const KEY_LENGTH_B64 = 24

export class GiftCardFacadeImpl implements GiftCardFacade {
	constructor(
		private readonly user: UserFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoFacade: CryptoFacade,
	) {
	}

	generateGiftCard(message: string, value: NumberString, countryCode: string): Promise<IdTuple> {
		const sessionKey = aes128RandomKey()
		const keyHash = sha256Hash(bitArrayToUint8Array(sessionKey))

		let adminGroupIds = this.user.getGroupIds(GroupType.Admin)

		if (adminGroupIds.length === 0) {
			throw new Error("missing admin membership")
		}

		const ownerKey = this.user.getGroupKey(firstThrow(adminGroupIds)) // adminGroupKey

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

	async encodeGiftCardToken(giftCard: GiftCard): Promise<string> {
		const key = assertNotNull(await this.cryptoFacade.resolveSessionKeyForInstance(giftCard))
		return this.encodeToken(elementIdPart(giftCard._id), bitArrayToUint8Array(key))
	}

	async decodeGiftCardToken(token: string): Promise<{id: Id; key: Base64}> {
		const id = base64ToBase64Ext(base64UrlToBase64(token.slice(0, ID_LENGTH)))
		const key = base64UrlToBase64(token.slice(ID_LENGTH, token.length))

		if (id.length !== ID_LENGTH || key.length !== KEY_LENGTH_B64) {
			throw new Error("invalid token")
		}

		return {id, key}
	}

	private encodeToken(id: Id, key: Uint8Array): Base64 {
		if (id.length !== ID_LENGTH) {
			throw new Error("Invalid gift card params")
		}
		const keyBase64 = uint8ArrayToBase64(key)
		if (keyBase64.length != KEY_LENGTH_B64) {
			throw new Error("Invalid gift card key")
		}

		const idPart = base64ToBase64Url(base64ExtToBase64(id))
		const keyPart = base64ToBase64Url(keyBase64)
		return idPart + keyPart
	}
}