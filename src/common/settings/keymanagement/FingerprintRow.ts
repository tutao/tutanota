import m, { Children, Component, Vnode } from "mithril"
import { Card } from "../../gui/base/Card"
import { IconButton } from "../../gui/base/IconButton"
import { Icons } from "../../gui/base/icons/Icons"
import { ButtonSize } from "../../gui/base/ButtonSize"
import { MonospaceTextDisplay } from "../../gui/base/MonospaceTextDisplay"

import { Icon, IconSize } from "../../gui/base/Icon"
import { Hex } from "@tutao/tutanota-utils"

type FingerprintRowAttrs = {
	mailAddress: string
	publicKeyVersion: number
	publicKeyType: number
	publicKeyFingerprint: Hex
	onRemoveFingerprint?: (mailAddress: string) => void
}

/**
 * Component for displaying a verified public key fingerprint as a compact card,
 * including key version, key type and a shield icon.
 */

// Hack because right now we cannot import enum KeyPairType
function getProtocolName(keyPairType: number): string {
	if (keyPairType === 0) {
		return "Ed25519"
	} else {
		return "unknown protocol"
	}
}

export class FingerprintRow implements Component<FingerprintRowAttrs> {
	view(vnode: Vnode<FingerprintRowAttrs>): Children {
		const { mailAddress, publicKeyFingerprint, onRemoveFingerprint, publicKeyVersion, publicKeyType } = vnode.attrs

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
				text: publicKeyFingerprint,
				chunkSize: 4,
				chunksPerLine: 8,
				classes: ".small.flex-start.lh-l.pl-vpad-s.mb-s",
				border: false,
			}),
			m(".small.pl-vpad-s.mb-s", m("", `v${publicKeyVersion}, via ${getProtocolName(publicKeyType)}`)),
		])
	}
}
