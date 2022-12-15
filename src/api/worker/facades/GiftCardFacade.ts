import {GroupType} from "../../common/TutanotaConstants"
import {
	assertNotNull,
	Base64,
	base64ExtToBase64,
	base64ToBase64Ext,
	base64ToBase64Url,
	base64UrlToBase64,
	getFirstOrThrow,
	uint8ArrayToBase64
} from "@tutao/tutanota-utils"
import type {GiftCardRedeemGetReturn} from "../../entities/sys/TypeRefs.js"
import {createGiftCardCreateData, createGiftCardRedeemData, GiftCard} from "../../entities/sys/TypeRefs.js"
import {aes128RandomKey, base64ToKey, bitArrayToUint8Array, encryptKey, sha256Hash} from "@tutao/tutanota-crypto"
import {IServiceExecutor} from "../../common/ServiceRequest"
import {GiftCardRedeemService, GiftCardService} from "../../entities/sys/Services"
import {elementIdPart, GENERATED_MAX_ID} from "../../common/utils/EntityUtils"
import {CryptoFacade} from "../crypto/CryptoFacade"
import {UserFacade} from "./UserFacade"
import {ProgrammingError} from "../../common/error/ProgrammingError.js"
import {CustomerFacade} from "./CustomerFacade.js"

const ID_LENGTH = GENERATED_MAX_ID.length
const KEY_LENGTH_B64 = 24

export class GiftCardFacade {
	constructor(
		private readonly user: UserFacade,
		private customer: CustomerFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoFacade: CryptoFacade,
	) {
	}

	async generateGiftCard(message: string, value: NumberString): Promise<IdTuple> {

		const adminGroupIds = this.user.getGroupIds(GroupType.Admin)

		if (adminGroupIds.length === 0) {
			throw new Error("missing admin membership")
		}

		const ownerKey = this.user.getGroupKey(getFirstOrThrow(adminGroupIds)) // adminGroupKey

		const sessionKey = aes128RandomKey()
		const {giftCard} = await this.serviceExecutor.post(
			GiftCardService,
			createGiftCardCreateData({
				message: message,
				keyHash: sha256Hash(bitArrayToUint8Array(sessionKey)),
				value,
				ownerEncSessionKey: encryptKey(ownerKey, sessionKey),
			}),
			{sessionKey}
		)

		return giftCard
	}

	getGiftCardInfo(id: Id, key: string): Promise<GiftCardRedeemGetReturn> {
		return this.serviceExecutor.get(
			GiftCardRedeemService,
			createGiftCardRedeemData({
				giftCardInfo: id,
				keyHash: sha256Hash(bitArrayToUint8Array(base64ToKey(key))),
			}),
			{
				sessionKey: base64ToKey(key)
			}
		)
	}

	async redeemGiftCard(
		giftCardInfoId: Id,
		key: string,
		/** Country code to use if a free user is being upgraded to premium (required if accountType is free) */
		countryCode: string
	): Promise<void> {

		if (
			(await this.customer.loadAccountingInfo()).invoiceCountry == null
			&& countryCode == null
		) {
			throw new ProgrammingError("User must provide a country")
		}

		await this.serviceExecutor.post(
			GiftCardRedeemService,
			createGiftCardRedeemData({
				giftCardInfo: giftCardInfoId,
				keyHash: sha256Hash(bitArrayToUint8Array(base64ToKey(key))),
				countryCode
			})
		)
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