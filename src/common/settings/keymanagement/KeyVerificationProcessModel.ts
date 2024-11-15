import { KeyVerificationMethodType } from "../../api/common/TutanotaConstants"

// TODO: switch value type to TranslationKey
export const KeyVerificationMethodTypeToNameTextId: Record<KeyVerificationMethodType, string> = Object.freeze({
	[KeyVerificationMethodType.text]: "Public-key fingerprint",
	[KeyVerificationMethodType.qr]: "QR code",
})

export class KeyVerificationProcessModel {
	mailAddress: string = ""
	fingerprint: string = ""
	selectedMethod: KeyVerificationMethodType | null = null

	onMethodSelected(newValue: KeyVerificationMethodType) {
		this.selectedMethod = newValue
	}
}
