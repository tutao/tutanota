import { isKeyVersion, KeyVersion, stringToCustomId } from "@tutao/utils"
import { CryptoError } from "@tutao/crypto/error"
import { customIdToString } from "@tutao/utils"

export function parseKeyVersion(version: NumberString): KeyVersion {
	const versionAsNumber = Number(version)
	return checkKeyVersionConstraints(versionAsNumber)
}

export function checkKeyVersionConstraints(version: number): KeyVersion {
	if (!isKeyVersion(version)) {
		throw new CryptoError("key version is not a non-negative integer")
	}
	return version
}
