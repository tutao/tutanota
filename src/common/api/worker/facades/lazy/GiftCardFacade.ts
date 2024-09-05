import { GroupType } from "../../../common/TutanotaConstants.js"
import {
	assertNotNull,
	Base64,
	base64ExtToBase64,
	base64ToBase64Ext,
	base64ToBase64Url,
	base64UrlToBase64,
	getFirstOrThrow,
	isEmpty,
	uint8ArrayToBase64,
} from "@tutao/tutanota-utils"
import type { GiftCardRedeemGetReturn } from "../../../entities/sys/TypeRefs.js"
import { createGiftCardCreateData, createGiftCardRedeemData, GiftCard } from "../../../entities/sys/TypeRefs.js"
import { aes256RandomKey, base64ToKey, bitArrayToUint8Array, sha256Hash } from "@tutao/tutanota-crypto"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { GiftCardRedeemService, GiftCardService } from "../../../entities/sys/Services.js"
import { elementIdPart, GENERATED_MAX_ID } from "../../../common/utils/EntityUtils.js"
import { CryptoFacade } from "../../crypto/CryptoFacade.js"
import { UserFacade } from "../UserFacade.js"
import { ProgrammingError } from "../../../common/error/ProgrammingError.js"
import { CustomerFacade } from "./CustomerFacade.js"
import { KeyLoaderFacade } from "../KeyLoaderFacade.js"
import { encryptKeyWithVersionedKey } from "../../crypto/CryptoWrapper.js"

const ID_LENGTH = GENERATED_MAX_ID.length
const KEY_LENGTH_128_BIT_B64 = 24
const KEY_LENGTH_256_BIT_B64 = 44

export class GiftCardFacade {
	constructor(
		private readonly user: UserFacade,
		private customer: CustomerFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly cryptoFacade: CryptoFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
	) {}

	async generateGiftCard(message: string, value: NumberString): Promise<IdTuple> {
		const adminGroupIds = this.user.getGroupIds(GroupType.Admin)

		if (isEmpty(adminGroupIds)) {
			throw new Error("missing admin membership")
		}

		const adminGroupId = getFirstOrThrow(adminGroupIds)
		const ownerKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupId)

		const sessionKey = aes256RandomKey()
		const ownerEncSessionKey = encryptKeyWithVersionedKey(ownerKey, sessionKey)
		const { giftCard } = await this.serviceExecutor.post(
			GiftCardService,
			createGiftCardCreateData({
				message: message,
				keyHash: sha256Hash(bitArrayToUint8Array(sessionKey)),
				value,
				ownerEncSessionKey: ownerEncSessionKey.key,
				ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
			}),
			{ sessionKey },
		)

		return giftCard
	}

	getGiftCardInfo(id: Id, key: string): Promise<GiftCardRedeemGetReturn> {
		return this.serviceExecutor.get(
			GiftCardRedeemService,
			createGiftCardRedeemData({
				giftCardInfo: id,
				keyHash: sha256Hash(bitArrayToUint8Array(base64ToKey(key))),
				countryCode: "",
			}),
			{
				sessionKey: base64ToKey(key),
			},
		)
	}

	async redeemGiftCard(
		giftCardInfoId: Id,
		key: string,
		/** Country code to use if a free user is being upgraded to premium (required if accountType is free) */
		countryCode: string,
	): Promise<void> {
		if ((await this.customer.loadAccountingInfo()).invoiceCountry == null && countryCode == null) {
			throw new ProgrammingError("User must provide a country")
		}

		await this.serviceExecutor.post(
			GiftCardRedeemService,
			createGiftCardRedeemData({
				giftCardInfo: giftCardInfoId,
				keyHash: sha256Hash(bitArrayToUint8Array(base64ToKey(key))),
				countryCode,
			}),
		)
	}

	async encodeGiftCardToken(giftCard: GiftCard): Promise<string> {
		const key = assertNotNull(await this.cryptoFacade.resolveSessionKeyForInstance(giftCard))
		return this.encodeToken(elementIdPart(giftCard._id), bitArrayToUint8Array(key))
	}

	async decodeGiftCardToken(token: string): Promise<{ id: Id; key: Base64 }> {
		const id = base64ToBase64Ext(base64UrlToBase64(token.slice(0, ID_LENGTH)))
		const key = base64UrlToBase64(token.slice(ID_LENGTH, token.length))

		if (id.length !== ID_LENGTH || (key.length !== KEY_LENGTH_128_BIT_B64 && key.length !== KEY_LENGTH_256_BIT_B64)) {
			throw new Error("invalid token")
		}

		return { id, key }
	}

	private encodeToken(id: Id, key: Uint8Array): Base64 {
		if (id.length !== ID_LENGTH) {
			throw new Error("Invalid gift card params")
		}
		const keyBase64 = uint8ArrayToBase64(key)
		if (keyBase64.length !== KEY_LENGTH_128_BIT_B64 && keyBase64.length !== KEY_LENGTH_256_BIT_B64) {
			throw new Error("Invalid gift card key")
		}

		const idPart = base64ToBase64Url(base64ExtToBase64(id))
		const keyPart = base64ToBase64Url(keyBase64)
		return idPart + keyPart
	}
}
