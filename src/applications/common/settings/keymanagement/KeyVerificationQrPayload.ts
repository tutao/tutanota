/**
 * Structure of the JSON object embedded in a QR code used for key verification.
 */
export interface KeyVerificationQrPayload {
	mailAddress: string
	fingerprint: string
}
