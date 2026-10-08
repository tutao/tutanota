import o from "@tutao/otest"
import { ElementId, elementIdToId, idToElementId } from "../../../../../src/platform-kit/meta"
import { DriveFileSharingFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/DriveFileSharingFacade"
import {
	Aes256Key,
	aes256RandomKey,
	blake3Kdf,
	CryptoWrapper,
	KdfNonce,
	keyToBase64,
	keyToUint8Array,
	uint8ArrayTo256Key,
	VersionedKey,
} from "../../../../../src/platform-kit/crypto"
import { IServiceExecutor } from "../../../../../src/platform-kit/network/ServiceRequest"
import { CryptoFacade } from "../../../../../src/platform-kit/base/base-crypto/CryptoFacade"
import { UserFacade } from "../../../../../src/platform-kit/base/facades/UserFacade"
import { KeyLoaderFacade } from "../../../../../src/platform-kit/base/base-crypto/KeyLoaderFacade"
import { DomainConfig } from "../../../../../src/platform-kit/app-env"
import { Argon2idFacade } from "../../../../../src/platform-kit/base/base-crypto/WasmArgon2idFacade"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { BlobFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/BlobFacade"
import { matchers, object, when } from "testdouble"
import { createTestEntity } from "../../../TestUtils"
import { DriveFileShareTypeRef } from "@tutao/entities/drive"
import { concat, stringToUtf8Uint8Array, uint8ArrayToBase64 } from "../../../../../src/platform-kit/utils"

function deriveFileShareKey(fileGroupKey: VersionedKey, nonce: KdfNonce): Aes256Key {
	const keyBytes = blake3Kdf(concat(keyToUint8Array(fileGroupKey.object), nonce), "driveFileShareShareKey", 32)
	return uint8ArrayTo256Key(keyBytes)
}

o.spec("DriveFileSharingFacade", function () {
	let fileSharingFacade: DriveFileSharingFacade

	let cryptoWrapper: CryptoWrapper
	let serviceExecutor: IServiceExecutor
	let cryptoFacade: CryptoFacade
	let userFacade: UserFacade
	let keyLoaderFacade: KeyLoaderFacade
	let domainConfig: DomainConfig
	let argon2IdFacade: Argon2idFacade
	let entityClient: EntityClient
	let blobFacade: BlobFacade

	o.beforeEach(async function () {
		cryptoWrapper = object()
		serviceExecutor = object()
		cryptoFacade = object()
		userFacade = object()
		keyLoaderFacade = object()
		domainConfig = object()
		argon2IdFacade = object()
		entityClient = object()
		blobFacade = object()

		fileSharingFacade = new DriveFileSharingFacade(
			cryptoWrapper,
			serviceExecutor,
			cryptoFacade,
			userFacade,
			keyLoaderFacade,
			domainConfig,
			argon2IdFacade,
			entityClient,
			blobFacade,
		)
	})

	o.spec("getShareInfo", function () {
		o.test("building public link with password-protected share", async function () {
			const shareId: ElementId = idToElementId("some share id")

			const fileGroupKey: VersionedKey = { object: aes256RandomKey(), version: 1 }

			domainConfig.apiUrl = "http://testcase"

			const share = createTestEntity(DriveFileShareTypeRef, {
				authToken: stringToUtf8Uint8Array("open up"),
				nonce: stringToUtf8Uint8Array("the nonce"),
				ownerEncPassword: stringToUtf8Uint8Array("encrypted password"),
			})

			const encryptedShareKey = stringToUtf8Uint8Array("encrypted share key")
			const decryptedPassword = "decrypted password"

			const shareKey = deriveFileShareKey(fileGroupKey, share.nonce as KdfNonce)
			const salt = blake3Kdf(concat(keyToUint8Array(shareKey), share.nonce), "driveFileShareSalt", 32)

			when(keyLoaderFacade.getCurrentSymGroupKey(matchers.anything())).thenResolve(fileGroupKey)
			when(entityClient.load(DriveFileShareTypeRef, shareId)).thenResolve(share)
			when(cryptoWrapper.decryptString(fileGroupKey.object, matchers.anything())).thenReturn(decryptedPassword)
			when(cryptoWrapper.encryptKey(matchers.anything(), matchers.anything())).thenReturn(encryptedShareKey)

			const shareInfo = await fileSharingFacade.getShareInfo(shareId)

			const queryParams = new URLSearchParams({
				authToken: uint8ArrayToBase64(share.authToken),
			})
			const fragmentParams = new URLSearchParams({
				shareKey: uint8ArrayToBase64(encryptedShareKey),
				salt: uint8ArrayToBase64(salt),
			})

			// verify that:
			o.check(shareInfo.share).deepEquals(share)
			o.check(shareInfo.publicLink).equals(`http://testcase/drivefile/${elementIdToId(shareId)}?${queryParams.toString()}#${fragmentParams.toString()}`)
			o.check(shareInfo.password).equals(decryptedPassword)
		})

		o.test("building public link without password-protected share", async function () {
			const shareId: ElementId = idToElementId("some share id")

			const fileGroupKey: VersionedKey = { object: aes256RandomKey(), version: 1 }

			domainConfig.apiUrl = "http://testcase"

			const share = createTestEntity(DriveFileShareTypeRef, {
				authToken: stringToUtf8Uint8Array("open up"),
				nonce: stringToUtf8Uint8Array("the nonce"),
				ownerEncPassword: null,
			})

			const shareKey = deriveFileShareKey(fileGroupKey, share.nonce as KdfNonce)

			when(keyLoaderFacade.getCurrentSymGroupKey(matchers.anything())).thenResolve(fileGroupKey)
			when(entityClient.load(DriveFileShareTypeRef, shareId)).thenResolve(share)

			const shareInfo = await fileSharingFacade.getShareInfo(shareId)

			const queryParams = new URLSearchParams({
				authToken: uint8ArrayToBase64(share.authToken),
			})
			const fragmentParams = new URLSearchParams({
				shareKey: keyToBase64(shareKey),
			})

			// verify that:
			o.check(shareInfo.share).deepEquals(share)
			o.check(shareInfo.publicLink).equals(`http://testcase/drivefile/${elementIdToId(shareId)}?${queryParams.toString()}#${fragmentParams.toString()}`)
			o.check(shareInfo.password).equals(undefined)
		})
	})
})
