import m, { Children, Component, Vnode } from "mithril"
import { Card } from "../../gui/base/Card"
import { IconButton } from "../../gui/base/IconButton"
import { Icons } from "../../gui/base/icons/Icons"
import { ButtonSize } from "../../gui/base/ButtonSize"
import { MonospaceTextDisplay } from "../../gui/base/MonospaceTextDisplay"
import { PublicKeyFingerprint } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import { Icon, IconSize } from "../../gui/base/Icon"

type FingerprintRowAttrs = {
	mailAddress: string
	publicKeyFingerprint: PublicKeyFingerprint
	onRemoveFingerprint?: (mailAddress: string) => void
}

/**
 * Component for displaying a verified public key fingerprint as a compact card,
 * including key version, key type and a shield icon.
 */

// Hack because right now we cannot import enum KeyPairType
function getProtocolName(keyPairType: number): string {
	if (keyPairType === 0) {
		return "RSA"
	} else if (keyPairType === 1) {
		return "RSA and ECC"
	} else if (keyPairType === 2) {
		return "TutaCrypt"
	} else {
		return "unknown protocol"
	}
}

export class FingerprintRow implements Component<FingerprintRowAttrs> {
	view(vnode: Vnode<FingerprintRowAttrs>): Children {
		const { mailAddress, publicKeyFingerprint, onRemoveFingerprint } = vnode.attrs

		const protocol = getProtocolName(publicKeyFingerprint.keyPairType)
		const version = publicKeyFingerprint.keyVersion

		return m(Card, [
			m(".flex.items-center.selectable.pl-vpad-s.mb-s.gap-vpad-xs", [
				m(Icon, {
					icon: Icons.Shield,
					size: IconSize.Large,
				}),
				m(".text-break.b.selectable", mailAddress),
				m(".flex-grow"),
				onRemoveFingerprint
					? m(IconButton, {
							title: "keyManagement.verifyMailAddress_action",
							click: async () => {
								onRemoveFingerprint(mailAddress)
							},
							icon: Icons.Trash,
							size: ButtonSize.Compact,
					  })
					: null,
			]),
			m(MonospaceTextDisplay, {
				text: publicKeyFingerprint.fingerprint,
				chunkSize: 4,
				chunksPerLine: 8,
				classes: ".small.flex-start.lh-l.pl-vpad-s.mb-s",
				border: false,
			}),
			m(".small.pl-vpad-s.mb-s", m("", `v${version}, via ${protocol}`)),
		])
	}
}
