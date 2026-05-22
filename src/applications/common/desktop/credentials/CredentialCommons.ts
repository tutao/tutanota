import { assert } from "@tutao/utils"
import { CredentialEncryptionMode } from "@tutao/app-env"

/** the single source of truth for this configuration */
export const SUPPORTED_MODES = Object.freeze([CredentialEncryptionMode.DEVICE_LOCK, CredentialEncryptionMode.APP_PASSWORD] as const)
export type DesktopCredentialsMode = (typeof SUPPORTED_MODES)[number]

export function assertSupportedEncryptionMode(encryptionMode: DesktopCredentialsMode) {
	assert(SUPPORTED_MODES.includes(encryptionMode), `should not use unsupported encryption mode ${encryptionMode}`)
}

export function assertDesktopEncryptionMode(encryptionMode: CredentialEncryptionMode): asserts encryptionMode is DesktopCredentialsMode {
	assertSupportedEncryptionMode(encryptionMode as DesktopCredentialsMode)
}
