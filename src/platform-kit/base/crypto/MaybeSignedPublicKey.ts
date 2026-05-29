import { Versioned } from "@tutao/utils"
import { PublicKey } from "@tutao/crypto"
import { PublicKeySignature } from "@tutao/entities/sys"

export type MaybeSignedPublicKey = { publicKey: Versioned<PublicKey>; signature: PublicKeySignature | null }
