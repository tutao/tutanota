import o from "@tutao/otest"
import { matchers, object, when } from "testdouble"
import { KeyVersion } from "@tutao/tutanota-utils"
import { PublicKeyIdentifier, PublicKeyProvider } from "../../../../../src/common/api/worker/facades/PublicKeyProvider.js"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor.js"
import { PublicKeyService } from "../../../../../src/common/api/entities/sys/Services.js"
import { createPublicKeyGetOut } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { InvalidDataError } from "../../../../../src/common/api/common/error/RestError.js"

o.spec("PublicKeyProviderTest", function () {
	let serviceExecutor: ServiceExecutor
	let publicKeyProvider: PublicKeyProvider

	let publicKeyIdentifier: PublicKeyIdentifier
	let currentVersion: KeyVersion

	o.beforeEach(function () {
		serviceExecutor = object()
		publicKeyProvider = new PublicKeyProvider(serviceExecutor)

		publicKeyIdentifier = object()
		currentVersion = 2
	})

	o.spec("loadCurrentPubKey", function () {
		o("success pq keys", async function () {
			const pubKyberKey = object<Uint8Array>()
			const pubEccKey = object<Uint8Array>()
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({ pubKeyVersion: String(currentVersion), pubRsaKey: null, pubKyberKey, pubEccKey }),
			)
			const pubKeys = await publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier)
			o(pubKeys.version).equals(currentVersion)
			o(pubKeys.object).deepEquals({ pubRsaKey: null, pubKyberKey, pubEccKey })
		})

		o("success rsa keys", async function () {
			currentVersion = 0
			const pubRsaKey = object<Uint8Array>()
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({ pubKeyVersion: String(currentVersion), pubRsaKey, pubKyberKey: null, pubEccKey: null }),
			)
			const pubKeys = await publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier)
			o(pubKeys.version).equals(currentVersion)
			o(pubKeys.object).deepEquals({ pubRsaKey, pubKyberKey: null, pubEccKey: null })
		})

		o("rsa key in version other than 0", async function () {
			const pubRsaKey = object<Uint8Array>()
			currentVersion = 1
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({ pubKeyVersion: String(currentVersion), pubRsaKey, pubKyberKey: null, pubEccKey: null }),
			)
			await assertThrows(CryptoError, async () => publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier))
		})
	})

	o.spec("loadVersionedPubKey", function () {
		const requestedVersion = 1

		o("success", async function () {
			const pubKyberKey = object<Uint8Array>()
			const pubEccKey = object<Uint8Array>()
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({ pubKeyVersion: String(requestedVersion), pubRsaKey: null, pubKyberKey, pubEccKey }),
			)
			const pubKeys = await publicKeyProvider.loadVersionedPubKey(publicKeyIdentifier, requestedVersion)
			o(pubKeys).deepEquals({ pubRsaKey: null, pubKyberKey, pubEccKey })
		})

		o("invalid Version returned", async function () {
			const pubKyberKey = object<Uint8Array>()
			const pubEccKey = object<Uint8Array>()
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({ pubKeyVersion: String(currentVersion), pubRsaKey: null, pubKyberKey, pubEccKey }),
			)
			o(currentVersion).notEquals(requestedVersion)
			await assertThrows(InvalidDataError, async () => publicKeyProvider.loadVersionedPubKey(publicKeyIdentifier, requestedVersion))
		})

		o("rsa key in version other than 0", async function () {
			const pubRsaKey = object<Uint8Array>()
			currentVersion = 1
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({ pubKeyVersion: String(currentVersion), pubRsaKey, pubKyberKey: null, pubEccKey: null }),
			)
			await assertThrows(CryptoError, async () => publicKeyProvider.loadVersionedPubKey(publicKeyIdentifier, currentVersion))
		})
	})

	o.spec("version validation", function () {
		o("throws if the version is negative", async function () {
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({ pubKeyVersion: "-1", pubRsaKey: object(), pubKyberKey: null, pubEccKey: null }),
			)

			const e = await assertThrows(CryptoError, async () => publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier))
			o(e.message).equals("key version is not a non-negative integer")
		})

		o("throws if the version is not an integer", async function () {
			when(serviceExecutor.get(PublicKeyService, matchers.anything())).thenResolve(
				createPublicKeyGetOut({ pubKeyVersion: "1.5", pubRsaKey: object(), pubKyberKey: null, pubEccKey: null }),
			)

			const e = await assertThrows(CryptoError, async () => publicKeyProvider.loadCurrentPubKey(publicKeyIdentifier))
			o(e.message).equals("key version is not a non-negative integer")
		})
	})
})
