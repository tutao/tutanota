import m, { Children, Component, Vnode } from "mithril"
import { Card } from "../../gui/base/Card"
import { IconButton } from "../../gui/base/IconButton"
import { Icons } from "../../gui/base/icons/Icons"
import { ButtonSize } from "../../gui/base/ButtonSize"
import { MonospaceTextDisplay } from "../../gui/base/MonospaceTextDisplay"

import { AllIcons, Icon, IconSize } from "../../gui/base/Icon"
import { Hex } from "@tutao/tutanota-utils"
import { MaybeTranslation } from "../../misc/LanguageViewModel"

type Action = {
	onClick: (mailAddress: string) => void
	icon: AllIcons
	tooltip: MaybeTranslation
}
type FingerprintRowAttrs = {
	mailAddress: string
	publicKeyVersion: number
	publicKeyType: number
	publicKeyFingerprint: Hex
	action?: Action
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
		const { mailAddress, publicKeyFingerprint, action, publicKeyVersion, publicKeyType } = vnode.attrs

		return m(Card, [
			m(".flex.items-center.selectable.pl-vpad-s.mb-s.gap-vpad-xs", [
				m(Icon, {
					icon: Icons.NeutralShield,
					size: IconSize.Large,
				}),
				m(".text-break.b.selectable", mailAddress),
				m(".flex-grow"),
				action
					? m(IconButton, {
							title: action.tooltip,
							click: async () => {
								action.onClick(mailAddress)
							},
							icon: action.icon,
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
