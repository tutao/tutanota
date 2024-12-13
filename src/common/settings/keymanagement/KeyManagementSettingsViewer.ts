import { UpdatableSettingsViewer } from "../Interfaces.js"
import { EntityUpdateData } from "../../api/common/utils/EntityUpdateUtils.js"
import m, { Children } from "mithril"
import { UserController } from "../../api/main/UserController.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { lang } from "../../misc/LanguageViewModel"
import { IconButton } from "../../gui/base/IconButton"
import { Icons } from "../../gui/base/icons/Icons"
import { ButtonSize } from "../../gui/base/ButtonSize"
import { KeyVerificationDetails, KeyVerificationFacade, MailAddress } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import { renderFingerprintAsQrCode, renderFingerprintAsText } from "./FingerprintRenderers"
import { DropDownSelector, DropDownSelectorAttrs } from "../../gui/base/DropDownSelector"
import { KeyVerificationMethodOptions, KeyVerificationMethodType, KeyVerificationSourceOfTruth } from "../../api/common/TutanotaConstants"
import { showKeyVerificationWizard } from "./KeyVerificationWizard"

export class KeyManagementSettingsViewer implements UpdatableSettingsViewer {
	mailAddress: string | null
	publicKeyHash: string | null
	trustedIdentities: Map<MailAddress, KeyVerificationDetails>
	selectedFingerprintRenderMethod: KeyVerificationMethodType = KeyVerificationMethodType.text

	constructor(private readonly keyVerificationFacade: KeyVerificationFacade, private readonly userController: UserController) {
		this.mailAddress = null
		this.publicKeyHash = null
		this.trustedIdentities = new Map<MailAddress, KeyVerificationDetails>()
		this.view = this.view.bind(this)
	}

	async init() {
		this.mailAddress = assertNotNull(this.userController.userGroupInfo.mailAddress)
		this.publicKeyHash = await this.keyVerificationFacade.getFingerprint(this.mailAddress, KeyVerificationSourceOfTruth.PublicKeyService)
		this.trustedIdentities = await this.keyVerificationFacade.getTrustedIdentities()

		m.redraw()
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		m.redraw()
		return Promise.resolve()
	}

	async reload() {
		this.trustedIdentities = await this.keyVerificationFacade.getTrustedIdentities()
		m.redraw()
	}

	renderVerificationStatus(verified: boolean): m.Vnode<any, any> {
		return m("", verified ? "✔ (verified) " : "✘ (unverified) ")
	}

	view(): Children {
		const obj: KeyManagementSettingsViewer = this

		const selfMailAddress = assertNotNull(this.mailAddress)
		const selfFingerprint = assertNotNull(this.publicKeyHash)

		const addressRows = Array.from(this.trustedIdentities.entries()).map(([mailAddress, details]: [string, KeyVerificationDetails]) => {
			return [
				m(".flex.items-center.selectable", [
					m("span.b.text-break.selectable", mailAddress),
					m(".flex-grow"),
					this.renderVerificationStatus(details.verified),
					m(IconButton, {
						title: "keyManagement.verifyMailAddress_action",
						click: async () => {
							await this.keyVerificationFacade.untrust(mailAddress)
							await obj.reload()
						},
						icon: Icons.Trash,
						size: ButtonSize.Compact,
					}),
				]),
				m(".small.text-break.monospace.selectable", details.fingerprint),
			]
		})

		const fingerprintRenderDropdownAttrs: DropDownSelectorAttrs<KeyVerificationMethodType> = {
			label: "keyManagement.showFingerprintAs_label",
			selectedValue: this.selectedFingerprintRenderMethod,
			selectionChangedHandler: (newValue) => (this.selectedFingerprintRenderMethod = newValue),
			items: KeyVerificationMethodOptions,
			dropdownWidth: 300,
		}

		let renderChosenVerificationMethod: (selfMailAddress: string, selfFingerprint: string) => Children
		if (this.selectedFingerprintRenderMethod === KeyVerificationMethodType.text) {
			renderChosenVerificationMethod = this.renderForTextMethod.bind(this)
		} else if (this.selectedFingerprintRenderMethod === KeyVerificationMethodType.qr) {
			renderChosenVerificationMethod = this.renderForQrMethod.bind(this)
		} else {
			// Text as a fallback
			renderChosenVerificationMethod = this.renderForTextMethod.bind(this)
		}

		return m("", [
			m(".fill-absolute.scroll.plr-l.pb-xl", [
				m(".h4.mt-l", lang.get("keyManagement.publicKeyFingerprint_label")),

				m(DropDownSelector, fingerprintRenderDropdownAttrs),
				renderChosenVerificationMethod(selfMailAddress, selfFingerprint),

				m(".h4.mt-l", lang.get("keyManagement.verificationPool_label")),
				m(".full-width.flex-space-between.items-center.mb-s", [
					lang.get("keyManagement.verifyMailAddress_action"),
					m(IconButton, {
						title: "keyManagement.verifyMailAddress_action",
						click: async () => {
							await showKeyVerificationWizard(this.keyVerificationFacade, () => obj.reload())
						},
						icon: Icons.Add,
						size: ButtonSize.Compact,
					}),
				]),

				...addressRows,
			]),
		])
	}

	private renderForTextMethod(selfMailAddress: string, selfFingerprint: string): Children {
		return [
			m("p", [m(".b.text-break.monospace.selectable", renderFingerprintAsText(selfFingerprint))]),
			m(".small.text-break", lang.get("keyManagement.publicKeyFingerprintTextInfo_msg")),
		]
	}

	private renderForQrMethod(selfMailAddress: string, selfFingerprint: string): Children {
		return [
			m("p", [m.trust(renderFingerprintAsQrCode(selfMailAddress, selfFingerprint))]),
			m(".small.text-break", lang.get("keyManagement.publicKeyFingerprintQrInfo_msg")),
		]
	}
}
