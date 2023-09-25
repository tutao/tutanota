import { x25519 } from "@noble/curves/ed25519"
import { Hex, hexToUint8Array, uint8ArrayToHex } from "@tutao/tutanota-utils"

export type X25519Private = Uint8Array
export type X25519Public = Uint8Array

/**
 * Contains a public key and its corresponding private key
 *
 * NOTE: Keys should be cleared from memory once they are no longer needed!
 */
export type X25519KeyPair = {
	pub: X25519Public
	priv: X25519Private
}

/**
 * Contains all information for deriving AES keys
 *
 * The shared secret MUST NEVER be used as a key directly as it is a biased (some bits are more likely to be set than others).
 * The sender's public key should also be included when deriving an AES key from this shared secret.
 */
export type X25519SharedSecret = {
	senderPub: X25519Public
	sharedSecret: Uint8Array
}

/**
 * @return randomly generated X25519 key pair
 */
export function x25519generateKeyPair(): X25519KeyPair {
	// noble-curves appears to clamp the private key when using it, but not when generating it, so for safety, we do not want to store it un-clamped in case we
	// use a different implementation later
	const priv = clampPrivateKey(x25519.utils.randomPrivateKey())
	const pub = derivePublicKey(priv)
	return { priv, pub }
}

/**
 * Derive a shared secret from the sender's private key and the recipient's public key to encrypt a message
 * @param senderKeys sender's key pair
 * @param recipientPub recipient's public key
 * @return shared secret and the sender's public key
 */
export function x25519encapsulate(senderKeys: X25519KeyPair, recipientPub: X25519Public): X25519SharedSecret {
	return generateSharedSecret(senderKeys.priv, recipientPub, senderKeys.pub)
}

/**
 * Derive a shared secret from the recipient's private key and the sender's public key to decrypt a message
 * @param recipientPriv recipient's private key
 * @param senderPub sender's public key
 * @return shared secret and the sender's public key
 */
export function x25519decapsulate(recipientPriv: X25519Private, senderPub: X25519Public): X25519SharedSecret {
	return generateSharedSecret(recipientPriv, senderPub, senderPub)
}

/** visible for testing */
export function x25519privateKeyToHex(privateKey: X25519Private): Hex {
	return uint8ArrayToHex(privateKey)
}

/** visible for testing */
export function x25519publicKeyToHex(publicKey: X25519Private): Hex {
	return uint8ArrayToHex(publicKey)
}

/** visible for testing */
export function x25519hexToPrivateKey(hex: Hex): X25519Private {
	return hexToUint8Array(hex)
}

/** visible for testing */
export function x25519hexToPublicKey(hex: Hex): X25519Public {
	return hexToUint8Array(hex)
}

/**
 * Diffie-Hellman key exchange; works by combining one party's private key and the other party's public key to form a shared secret between both parties
 */
function generateSharedSecret(localPrivateKey: X25519Private, remotePublicKey: X25519Public, senderPublicKey: X25519Public): X25519SharedSecret {
	const sharedSecret = x25519.getSharedSecret(localPrivateKey, remotePublicKey)

	// if every byte somehow happens to be 0, we can't use this as a secret; this is astronomically unlikely to happen by chance
	if (sharedSecret.every((val) => val === 0)) {
		throw new Error("can't get shared secret: bad key inputs")
	}

	return { senderPub: senderPublicKey, sharedSecret }
}

// see https://www.jcraige.com/an-explainer-on-ed25519-clamping for an explanation on why we do this
function clampPrivateKey(priv: X25519Private): X25519Private {
	// First, we want to unset the highest bit but set the second-highest bit to 1. This prevents potential timing and brute-force attacks, respectively.
	priv[priv.length - 1] = (priv[priv.length - 1] & 0b01111111) | 0b01000000

	// Then, we want to guarantee our scalar is a multiple of 8, our cofactor, to protect against small-subgroup attacks per RFC 2785 which could leak key data!
	priv[0] &= 0b11111000

	return priv
}

function derivePublicKey(priv: X25519Private): X25519Public {
	return x25519.getPublicKey(priv)
}
