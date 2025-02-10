import { UpdatableSettingsViewer } from "../Interfaces.js"
import { EntityUpdateData } from "../../api/common/utils/EntityUpdateUtils.js"
import m, { Children } from "mithril"
import { UserController } from "../../api/main/UserController.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { lang } from "../../misc/LanguageViewModel"
import { IconButton } from "../../gui/base/IconButton"
import { Icons } from "../../gui/base/icons/Icons"
import { ButtonSize } from "../../gui/base/ButtonSize"
import { KeyVerificationFacade, MailAddress, PublicKeyFingerprint } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import { renderFingerprintAsQrCode, renderFingerprintAsText } from "./FingerprintRenderers"
import { DropDownSelector, DropDownSelectorAttrs } from "../../gui/base/DropDownSelector"
import { KeyVerificationMethodOptions, KeyVerificationMethodType, KeyVerificationSourceOfTruth } from "../../api/common/TutanotaConstants"
import { showKeyVerificationWizard } from "./KeyVerificationWizard"
import { locator } from "../../api/main/CommonLocator"
import { MonospaceTextDisplay } from "../../gui/base/MonospaceTextDisplay"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade"
import { KeyPairType } from "@tutao/tutanota-crypto"
import { UsageTestController } from "@tutao/tutanota-usagetests"

export class KeyManagementSettingsViewer implements UpdatableSettingsViewer {
	mailAddress: string | null
	publicKeyHash: PublicKeyFingerprint | null
	trustedIdentities: Map<MailAddress, PublicKeyFingerprint>
	selectedFingerprintRenderMethod: KeyVerificationMethodType = KeyVerificationMethodType.text

	constructor(
		private readonly keyVerificationFacade: KeyVerificationFacade,
		private readonly mobileSystemFacade: MobileSystemFacade,
		private readonly userController: UserController,
		private readonly usageTestController: UsageTestController,
	) {
		this.mailAddress = null
		this.publicKeyHash = null
		this.trustedIdentities = new Map<MailAddress, PublicKeyFingerprint>()
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

	renderFingerprintDetails(publicKeyFingerprint: PublicKeyFingerprint): m.Vnode<any, any> {
		const protocol = KeyPairType[publicKeyFingerprint.keyPairType]
		const version = publicKeyFingerprint.keyVersion
		return m("", `v${version}, via ${protocol}`)
	}

	view(): Children {
		const obj: KeyManagementSettingsViewer = this

		const selfMailAddress = assertNotNull(this.mailAddress)
		const selfFingerprint = assertNotNull(this.publicKeyHash)

		const addressRows = Array.from(this.trustedIdentities.entries()).map(([mailAddress, publicKeyFingerprint]: [string, PublicKeyFingerprint]) => {
			return [
				m(".flex.items-center.selectable", [
					m(".text-break.b.selectable", mailAddress),
					m(".flex-grow"),
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
				m(MonospaceTextDisplay, { text: publicKeyFingerprint.fingerprint, chunkSize: 4, classes: ".small", border: false }),
				m(".small", this.renderFingerprintDetails(publicKeyFingerprint)),
			]
		})

		const fingerprintRenderDropdownAttrs: DropDownSelectorAttrs<KeyVerificationMethodType> = {
			label: "keyManagement.showFingerprintAs_label",
			selectedValue: this.selectedFingerprintRenderMethod,
			selectionChangedHandler: (newValue) => (this.selectedFingerprintRenderMethod = newValue),
			items: KeyVerificationMethodOptions,
			dropdownWidth: 300,
		}

		let renderChosenVerificationMethod: (selfMailAddress: string, selfFingerprint: PublicKeyFingerprint) => Children
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
							await showKeyVerificationWizard(this.keyVerificationFacade, this.mobileSystemFacade, this.usageTestController, () => obj.reload())
						},
						icon: Icons.Add,
						size: ButtonSize.Compact,
					}),
				]),

				...addressRows,
			]),
		])
	}

	private renderForTextMethod(selfMailAddress: string, selfFingerprint: PublicKeyFingerprint): Children {
		return [
			m(MonospaceTextDisplay, { text: renderFingerprintAsText(selfFingerprint), chunkSize: 4, classes: ".b.mt.mb.center" }),
			m(".small.text-break", lang.get("keyManagement.publicKeyFingerprintTextInfo_msg")),
		]
	}

	private renderForQrMethod(selfMailAddress: string, selfFingerprint: PublicKeyFingerprint): Children {
		const currentTheme = locator.themeController.getCurrentTheme()
		const isLightTheme = currentTheme.themeId === "light" || currentTheme.themeId === "light_secondary"

		const qrCodeGraphic = m.trust(renderFingerprintAsQrCode(selfMailAddress, selfFingerprint))

		return [
			m(
				".pb.pt",
				{ style: { display: "flex", "justify-content": "center" } },
				// If the user is on a dark theme, we want to render a white border around the QR code to help the detection algorithm.
				// We do not want any extra padding on light themes since it looks ugly.
				isLightTheme ? m("", qrCodeGraphic) : m(".bg-white.border-radius-big", { style: { "line-height": "0", padding: "24px" } }, qrCodeGraphic),
			),
			m(".small.text-break", lang.get("keyManagement.publicKeyFingerprintQrInfo_msg")),
		]
	}
}
