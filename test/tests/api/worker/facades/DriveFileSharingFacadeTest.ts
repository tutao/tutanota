import o from "@tutao/otest"
import { ElementId, elementIdToId, idToElementId } from "../../../../../src/platform-kit/meta"
import { DriveFileSharingFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/DriveFileSharingFacade"
import {
	Aes256Key,
	aes256RandomKey,
	blake3Kdf,
	createAuthVerifier,
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
import { DriveFileShareTypeRef, DriveFileTypeRef } from "@tutao/entities/drive"
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
	o.spec("downloadFileForShare", function () {
		o.test("downloading password protected file", async function () {
			const shareId = "some share id"
			const authToken = "some authToken"
			const sharedKey = aes256RandomKey()
			const encParam: { type: "password"; password: string; salt: string; sharedKey: Base64 } = {
				type: "password",
				password: "some password",
				salt: uint8ArrayToBase64(new Uint8Array([1, 2, 3])),
				sharedKey: uint8ArrayToBase64(keyToUint8Array(sharedKey)),
			}
			const share = createTestEntity(DriveFileShareTypeRef, {
				_id: idToElementId(shareId),
			})

			const passwordKey = aes256RandomKey()

			const shareKey = aes256RandomKey()
			const fileSessionKey = aes256RandomKey()

			const file = createTestEntity(DriveFileTypeRef)

			const loadFileShareRequestCaptor = matchers.captor()
			const loadFileRequestCaptor = matchers.captor()

			when(cryptoWrapper.decryptKey(matchers.anything(), matchers.anything())).thenReturn(shareKey, fileSessionKey)
			when(entityClient.load(DriveFileShareTypeRef, idToElementId(shareId), loadFileShareRequestCaptor.capture())).thenResolve(share)
			when(entityClient.load(DriveFileTypeRef, share.file, loadFileRequestCaptor.capture())).thenResolve(file)
			when(argon2IdFacade.generateKeyFromPassphrase(matchers.anything(), matchers.anything())).thenResolve(passwordKey)

			const fileInfo = await fileSharingFacade.downloadFileForShare(shareId, authToken, encParam)

			o.check(fileInfo.file).deepEquals(file)
			o.check(fileInfo.fileSessionKey).deepEquals(keyToUint8Array(fileSessionKey))
			o.check(fileInfo.share).deepEquals(share)

			o.check(loadFileShareRequestCaptor.value.extraHeaders).deepEquals({ authToken, verifier: uint8ArrayToBase64(createAuthVerifier(passwordKey)) })

			o.check(loadFileRequestCaptor.value.extraHeaders).deepEquals({ authToken })
			o.check(loadFileRequestCaptor.value.sessionKey).deepEquals(fileSessionKey)
		})
		o.test("downloading non-password protected file", async function () {
			const shareId = "some share id"
			const authToken = "some authToken"
			const sharedKey = aes256RandomKey()
			const encParam: { type: "key"; sharedKey: Base64 } = {
				type: "key",
				sharedKey: uint8ArrayToBase64(keyToUint8Array(sharedKey)),
			}
			const share = createTestEntity(DriveFileShareTypeRef, {
				_id: idToElementId(shareId),
			})

			const fileSessionKey = aes256RandomKey()

			const file = createTestEntity(DriveFileTypeRef)

			const loadFileShareRequestCaptor = matchers.captor()
			const loadFileRequestCaptor = matchers.captor()

			when(cryptoWrapper.decryptKey(matchers.anything(), matchers.anything())).thenReturn(fileSessionKey)
			when(entityClient.load(DriveFileShareTypeRef, idToElementId(shareId), loadFileShareRequestCaptor.capture())).thenResolve(share)
			when(entityClient.load(DriveFileTypeRef, share.file, loadFileRequestCaptor.capture())).thenResolve(file)

			const fileInfo = await fileSharingFacade.downloadFileForShare(shareId, authToken, encParam)

			o.check(fileInfo.file).deepEquals(file)
			o.check(fileInfo.fileSessionKey).deepEquals(keyToUint8Array(fileSessionKey))
			o.check(fileInfo.share).deepEquals(share)

			o.check(loadFileShareRequestCaptor.value.extraHeaders).deepEquals({ authToken })

			o.check(loadFileRequestCaptor.value.extraHeaders).deepEquals({ authToken })
			o.check(loadFileRequestCaptor.value.sessionKey).deepEquals(fileSessionKey)
		})
	})
})
