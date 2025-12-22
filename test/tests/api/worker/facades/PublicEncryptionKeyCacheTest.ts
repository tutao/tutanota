import o from "@tutao/otest"
import { object } from "testdouble"
import { KeyVersion } from "@tutao/tutanota-utils"
import { MaybeSignedPublicKey, PublicKeyIdentifier } from "../../../../../src/common/api/worker/facades/PublicEncryptionKeyProvider.js"
import { PublicKeySignatureTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { PublicKeyIdentifierType, SYSTEM_GROUP_MAIL_ADDRESS } from "../../../../../src/common/api/common/TutanotaConstants"
import { createTestEntity } from "../../../TestUtils"
import { PublicEncryptionKeyCache } from "../../../../../src/common/api/worker/facades/PublicEncryptionKeyCache"

const PUBLIC_KEY_IDENTIFIER_MAIL_ADDRESS = "alice@tuta.com"

o.spec("PublicEncryptionKeyCacheTest", function () {
	let pubKeyCache: PublicEncryptionKeyCache

	let version: KeyVersion = 2
	let publicKeyIdentifier: PublicKeyIdentifier
	let publicKey: MaybeSignedPublicKey

	o.beforeEach(function () {
		pubKeyCache = new PublicEncryptionKeyCache()

		publicKey = { publicKey: { version: version, object: object() }, signature: createTestEntity(PublicKeySignatureTypeRef) }
		publicKeyIdentifier = {
			identifier: PUBLIC_KEY_IDENTIFIER_MAIL_ADDRESS,
			identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
		}
		version = 2
	})

	o.spec("put and get", function () {
		o("get - not present returns undefined", async function () {
			o(pubKeyCache.get(publicKeyIdentifier, version)).equals(undefined)
		})

		o("put and get success", async function () {
			pubKeyCache.put(publicKeyIdentifier, publicKey)
			o(pubKeyCache.get(publicKeyIdentifier, version)).deepEquals(publicKey)
		})

		o("put does not update existing key", async function () {
			pubKeyCache.put(publicKeyIdentifier, publicKey)
			const anotherPubKey: MaybeSignedPublicKey = { publicKey: { version, object: object() }, signature: publicKey.signature }
			pubKeyCache.put(publicKeyIdentifier, anotherPubKey)
			o(pubKeyCache.get(publicKeyIdentifier, version)).deepEquals(publicKey)
			o(pubKeyCache.get(publicKeyIdentifier, version)).notDeepEquals(anotherPubKey)
		})

		o("no update without signature", async function () {
			publicKey.signature = null
			pubKeyCache.put(publicKeyIdentifier, publicKey)
			o(pubKeyCache.get(publicKeyIdentifier, version)).equals(undefined)
		})

		o("update without signature for system user group", async function () {
			publicKey.signature = null
			publicKeyIdentifier.identifier = SYSTEM_GROUP_MAIL_ADDRESS
			pubKeyCache.put(publicKeyIdentifier, publicKey)
			o(pubKeyCache.get(publicKeyIdentifier, version)).deepEquals(publicKey)
		})
	})
})
