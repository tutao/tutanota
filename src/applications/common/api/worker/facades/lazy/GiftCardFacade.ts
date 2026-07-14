import {
	assertNotNull,
	base64ExtToBase64Url,
	base64ToBase64Url,
	base64ToUint8Array,
	base64UrlToBase64,
	base64UrlToBase64Ext,
	getFirstOrThrow,
	isEmpty,
	uint8ArrayToBase64,
} from "@tutao/utils"
import { elementIdPart, GENERATED_MAX_ID } from "@tutao/meta"
import { _encryptKeyWithVersionedKey, aes256RandomKey, base64ToKey, keyToUint8Array, sha256Hash } from "@tutao/crypto"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest.js"
import { CryptoFacade } from "../../../../../../platform-kit/base/base-crypto/CryptoFacade.js"
import { UserFacade } from "../../../../../../platform-kit/base/facades/UserFacade.js"
import { ProgrammingError } from "@tutao/app-env"
import { CustomerFacade } from "./CustomerFacade.js"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade.js"
import {
	createGiftCardCreateData,
	createGiftCardRedeemData,
	GiftCard,
	GiftCardRedeemGetReturn,
	GiftCardRedeemService,
	GiftCardService,
} from "@tutao/entities/sys"
import { GroupType } from "../../../../../../entities/sys/Utils"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"

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
		const ownerEncSessionKey = _encryptKeyWithVersionedKey(ownerKey, sessionKey)
		const data = createGiftCardCreateData({
			message: message,
			keyHash: sha256Hash(keyToUint8Array(sessionKey)),
			value,
		})
		data.ownerEncSessionKey = ownerEncSessionKey.key
		data.ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()
		const { giftCard } = await this.serviceExecutor.post(GiftCardService, data, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey })

		return giftCard
	}

	getGiftCardInfo(id: Id, key: string): Promise<GiftCardRedeemGetReturn> {
		return this.serviceExecutor.get(
			GiftCardRedeemService,
			createGiftCardRedeemData({
				giftCardInfo: id,
				keyHash: sha256Hash(base64ToUint8Array(key)),
				countryCode: "",
			}),
			{
				...DEFAULT_EXTRA_SERVICE_PARAMS,
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
				keyHash: sha256Hash(base64ToUint8Array(key)),
				countryCode,
			}),
			null,
		)
	}

	async encodeGiftCardToken(giftCard: GiftCard): Promise<string> {
		const key = assertNotNull(await this.cryptoFacade.resolveSessionKey(giftCard))
		return this.encodeToken(elementIdPart(giftCard._id), keyToUint8Array(key))
	}

	async decodeGiftCardToken(token: string): Promise<{ id: Id; key: Base64 }> {
		const id = base64UrlToBase64Ext(token.slice(0, ID_LENGTH))
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

		const idPart = base64ExtToBase64Url(id)
		const keyPart = base64ToBase64Url(keyBase64)
		return idPart + keyPart
	}
}
