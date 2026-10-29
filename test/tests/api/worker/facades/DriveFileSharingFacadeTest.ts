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
import { func, matchers, object, when } from "testdouble"
import { clientInitializedTypeModelResolver, createTestEntity } from "../../../TestUtils"
import {
	createDriveShareServicePasswordUpdate,
	createDriveShareServicePutIn,
	DriveFileShareTypeRef,
	DriveFileTypeRef,
	DriveShareService_PUT,
} from "@tutao/entities/drive"
import { base64ToUint8Array, concat, stringToBase64, stringToUtf8Uint8Array, uint8ArrayToBase64 } from "../../../../../src/platform-kit/utils"
import { EntityRestClientMock } from "../rest/EntityRestClientMock"

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
	let entityRestClientMock: EntityRestClientMock
	let blobFacade: BlobFacade

	o.beforeEach(async function () {
		cryptoWrapper = object()
		serviceExecutor = object()
		cryptoFacade = object()
		userFacade = object()
		keyLoaderFacade = object()
		domainConfig = object()
		argon2IdFacade = object()
		entityRestClientMock = new EntityRestClientMock()
		entityClient = new EntityClient(entityRestClientMock, clientInitializedTypeModelResolver())
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

			const fileGroupKey: VersionedKey = { object: aes256RandomKey(), version: 0 }

			domainConfig.apiUrl = "http://testcase"

			const share = createTestEntity(DriveFileShareTypeRef, {
				_id: shareId,
				authToken: stringToUtf8Uint8Array("open up"),
				nonce: stringToUtf8Uint8Array("the nonce"),
				ownerEncPassword: stringToUtf8Uint8Array("encrypted password"),
				groupKeyVersion: "0",
				_ownerGroup: "ownerGroup",
			})

			const file = createTestEntity(DriveFileTypeRef, {
				share: elementIdToId(share._id),
				_ownerGroup: "group",
				_ownerKeyVersion: "0",
			})

			const encryptedShareKey = stringToUtf8Uint8Array("encrypted share key")
			const decryptedPassword = "decrypted password"

			const shareKey = deriveFileShareKey(fileGroupKey, share.nonce as KdfNonce)
			const salt = blake3Kdf(concat(keyToUint8Array(shareKey), share.nonce), "driveFileShareSalt", 32)

			when(keyLoaderFacade.loadSymGroupKey("ownerGroup", 0)).thenResolve(fileGroupKey.object)
			entityRestClientMock.addElementInstances(share)
			when(entityClient.load(DriveFileShareTypeRef, shareId)).thenResolve(share)
			when(cryptoWrapper.decryptString(fileGroupKey.object, matchers.anything())).thenReturn(decryptedPassword)
			when(cryptoWrapper.encryptKey(matchers.anything(), matchers.anything())).thenReturn(encryptedShareKey)

			const shareInfo = await fileSharingFacade.getShareInfoForManagement(file)

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

			const fileGroupKey: VersionedKey = { object: aes256RandomKey(), version: 0 }

			domainConfig.apiUrl = "http://testcase"

			const share = createTestEntity(DriveFileShareTypeRef, {
				_id: shareId,
				authToken: stringToUtf8Uint8Array("open up"),
				nonce: stringToUtf8Uint8Array("the nonce"),
				ownerEncPassword: null,
				groupKeyVersion: "0",
				_ownerGroup: "ownerGroup",
			})
			const file = createTestEntity(DriveFileTypeRef, {
				share: elementIdToId(share._id),
				_ownerGroup: "group",
				_ownerKeyVersion: "0",
			})

			const shareKey = deriveFileShareKey(fileGroupKey, share.nonce as KdfNonce)

			when(keyLoaderFacade.loadSymGroupKey("ownerGroup", 0)).thenResolve(fileGroupKey.object)
			entityRestClientMock.addElementInstances(share)

			const shareInfo = await fileSharingFacade.getShareInfoForManagement(file)

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
	o.spec("updateShare", function () {
		o.test(
			"adding a password to an existing share, without a password, should send a server request to update the share with the password provided",
			async function () {
				const shareId: ElementId = idToElementId("some share id")

				const share = createTestEntity(DriveFileShareTypeRef, {
					_id: shareId,
					authToken: stringToUtf8Uint8Array("open up"),
					nonce: stringToUtf8Uint8Array("the nonce"),
					ownerEncPassword: null,
					groupKeyVersion: "0",
					_ownerGroup: "ownerGroup",
				})

				const fileGroupKey: VersionedKey = { object: aes256RandomKey(), version: 0 }
				const password = "password"
				const encPassword = base64ToUint8Array(stringToBase64("encPassword"))
				when(cryptoWrapper.encryptString(fileGroupKey.object, password)).thenReturn(encPassword)
				entityRestClientMock.addElementInstances(share)
				when(keyLoaderFacade.loadSymGroupKey("ownerGroup", 0)).thenResolve(fileGroupKey.object)
				const passwordKey = aes256RandomKey()
				when(argon2IdFacade.generateKeyFromPassphrase(matchers.anything(), matchers.anything())).thenResolve(passwordKey)

				when(
					serviceExecutor.execute(
						DriveShareService_PUT,
						createDriveShareServicePutIn({
							share: elementIdToId(shareId),
							passwordUpdate: createDriveShareServicePasswordUpdate({
								verifier: matchers.anything(),
								ownerEncPassword: encPassword,
								groupKeyVersion: matchers.anything(),
							}),
							expirationDate: null,
						}),
						null,
					),
				).thenDo(() => {
					share.ownerEncPassword = encPassword
				})
				await fileSharingFacade.updateShare(share, password, null)
				o.check(share.ownerEncPassword).deepEquals(encPassword)
			},
		)
		o.test("adding expiration date to a share, without an expiration, should send a server request with the expiration date provided", async function () {
			const shareId: ElementId = idToElementId("some share id")

			const share = createTestEntity(DriveFileShareTypeRef, {
				_id: shareId,
				authToken: stringToUtf8Uint8Array("open up"),
				nonce: stringToUtf8Uint8Array("the nonce"),
				ownerEncPassword: null,
				groupKeyVersion: "0",
				_ownerGroup: "ownerGroup",
			})
			const expirationDate = new Date(2028, 5, 12)

			when(
				serviceExecutor.execute(
					DriveShareService_PUT,
					createDriveShareServicePutIn({
						share: elementIdToId(shareId),
						passwordUpdate: null,
						expirationDate: expirationDate,
					}),
					null,
				),
			).thenDo(() => {
				share.expirationDate = expirationDate
			})
			await fileSharingFacade.updateShare(share, null, expirationDate)
			o.check(share.expirationDate).deepEquals(expirationDate)
		})
		// This is a case to remove password and expiration from a share
		o.test("updating a share with password and expirationDate as null values should send a server request with null values", async function () {
			const shareId: ElementId = idToElementId("some share id")

			const share = createTestEntity(DriveFileShareTypeRef, {
				_id: shareId,
				authToken: stringToUtf8Uint8Array("open up"),
				nonce: stringToUtf8Uint8Array("the nonce"),
				ownerEncPassword: new Uint8Array([1, 2, 3]),
				groupKeyVersion: "0",
				_ownerGroup: "ownerGroup",
				expirationDate: new Date(2028, 5, 12),
			})

			when(
				serviceExecutor.execute(
					DriveShareService_PUT,
					createDriveShareServicePutIn({
						share: elementIdToId(shareId),
						passwordUpdate: null,
						expirationDate: null,
					}),
					null,
				),
			).thenDo(() => {
				share.ownerEncPassword = null
				share.expirationDate = null
			})
			await fileSharingFacade.updateShare(share, null, null)
			o.check(share.expirationDate).deepEquals(null)
			o.check(share.ownerEncPassword).deepEquals(null)
		})
	})
	o.spec("downloadFileForShare", function () {
		const fileId: IdTuple = ["fileListId", "fileId"]
		o.test("downloading password protected file", async function () {
			const shareId = "some share id"
			const authToken = "some authToken"
			const sharedKey = aes256RandomKey()
			const encParam: { type: "password"; password: string; salt: Uint8Array<ArrayBuffer>; shareKey: Uint8Array<ArrayBuffer> } = {
				type: "password",
				password: "some password",
				salt: new Uint8Array([1, 2, 3]),
				shareKey: keyToUint8Array(sharedKey),
			}
			const share = createTestEntity(DriveFileShareTypeRef, {
				_id: idToElementId(shareId),
				file: fileId,
			})

			const passwordKey = aes256RandomKey()

			const shareKey = aes256RandomKey()
			const fileSessionKey = aes256RandomKey()

			const file = createTestEntity(DriveFileTypeRef, {
				_id: fileId,
			})

			when(cryptoWrapper.decryptKey(matchers.anything(), matchers.anything())).thenReturn(shareKey, fileSessionKey)

			const loadFileShareRequestCaptor = matchers.captor()
			const loadFileRequestCaptor = matchers.captor()

			const originalLoad = entityClient.load.bind(entityClient)
			const fakeLoad = func<EntityClient["load"]>()
			when(fakeLoad(DriveFileTypeRef, fileId, loadFileRequestCaptor.capture())).thenDo((...args) => originalLoad(...args))
			when(fakeLoad(DriveFileShareTypeRef, idToElementId(shareId), loadFileShareRequestCaptor.capture())).thenDo((...args) => originalLoad(...args))
			entityClient.load = fakeLoad

			entityRestClientMock.addListInstances(file)
			entityRestClientMock.addElementInstances(share)
			when(argon2IdFacade.generateKeyFromPassphrase(matchers.anything(), matchers.anything())).thenResolve(passwordKey)

			const fileInfo = await fileSharingFacade.loadSharedFile(shareId, authToken, encParam)

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
			const encParam: { type: "key"; shareKey: Uint8Array<ArrayBuffer> } = {
				type: "key",
				shareKey: keyToUint8Array(sharedKey),
			}
			const share = createTestEntity(DriveFileShareTypeRef, {
				_id: idToElementId(shareId),
				file: fileId,
			})

			const fileSessionKey = aes256RandomKey()

			const file = createTestEntity(DriveFileTypeRef, {
				_id: fileId,
				share: elementIdToId(share._id),
			})

			const loadFileShareRequestCaptor = matchers.captor()
			const loadFileRequestCaptor = matchers.captor()

			const originalLoad = entityClient.load.bind(entityClient)
			const fakeLoad = func<EntityClient["load"]>()
			when(fakeLoad(DriveFileTypeRef, fileId, loadFileRequestCaptor.capture())).thenDo((...args) => originalLoad(...args))
			when(fakeLoad(DriveFileShareTypeRef, idToElementId(shareId), loadFileShareRequestCaptor.capture())).thenDo((...args) => originalLoad(...args))
			entityClient.load = fakeLoad

			when(cryptoWrapper.decryptKey(matchers.anything(), matchers.anything())).thenReturn(fileSessionKey)
			entityRestClientMock.addElementInstances(share)
			entityRestClientMock.addListInstances(file)

			const fileInfo = await fileSharingFacade.loadSharedFile(shareId, authToken, encParam)

			o.check(fileInfo.file).deepEquals(file)
			o.check(fileInfo.fileSessionKey).deepEquals(keyToUint8Array(fileSessionKey))
			o.check(fileInfo.share).deepEquals(share)

			o.check(loadFileShareRequestCaptor.value.extraHeaders).deepEquals({ authToken })

			o.check(loadFileRequestCaptor.value.extraHeaders).deepEquals({ authToken })
			o.check(loadFileRequestCaptor.value.sessionKey).deepEquals(fileSessionKey)
		})
	})
})
