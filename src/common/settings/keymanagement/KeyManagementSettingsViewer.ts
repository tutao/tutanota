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
import { DropDownSelectorAttrs } from "../../gui/base/DropDownSelector"
import { KeyVerificationMethodOptions, KeyVerificationMethodType, KeyVerificationSourceOfTruth } from "../../api/common/TutanotaConstants"
import { showKeyVerificationWizard } from "./KeyVerificationWizard"
import { MonospaceTextDisplay } from "../../gui/base/MonospaceTextDisplay"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade"
import { UsageTestController } from "@tutao/tutanota-usagetests"
import { TitleSection } from "../../gui/TitleSection"
import { Card } from "../../gui/base/Card"
import { renderFingerprintAsQrCode, renderFingerprintAsText } from "./FingerprintRenderers"
import { locator } from "../../api/main/CommonLocator"
import { MenuTitle } from "../../gui/titles/MenuTitle"
import { theme } from "../../gui/theme"
import { FingerprintRow } from "./FingerprintRow"

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

	view(): Children {
		const obj: KeyManagementSettingsViewer = this

		const selfMailAddress = assertNotNull(this.mailAddress)
		const selfFingerprint = assertNotNull(this.publicKeyHash)

		const addressRows = Array.from(this.trustedIdentities.entries()).map(([mailAddress, publicKeyFingerprint]: [string, PublicKeyFingerprint]) => {
			return m(FingerprintRow, {
				mailAddress,
				publicKeyFingerprint,
				onRemoveFingerprint: async (mailAddress: string) => {
					await this.keyVerificationFacade.untrust(mailAddress)
					await this.reload()
				},
			})
		})

		const fingerprintRenderDropdownAttrs: DropDownSelectorAttrs<KeyVerificationMethodType> = {
			label: "keyManagement.showFingerprintAs_label",
			selectedValue: this.selectedFingerprintRenderMethod,
			selectionChangedHandler: (newValue) => (this.selectedFingerprintRenderMethod = newValue),
			items: KeyVerificationMethodOptions,
			dropdownWidth: 300,
		}

		return m("", [
			m(
				".fill-absolute.scroll.plr-l.pb-xl",
				{
					style: {
						backgroundColor: theme.navigation_bg,
						gap: "16px",
						display: "flex",
						flexDirection: "column",
					},
				},
				[
					m(TitleSection, {
						icon: Icons.KeyRegular,
						title: lang.get("keyManagement.keyVerification_label"),
						subTitle: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr.",
					}),
					this.renderQrTextMethod(selfMailAddress, selfFingerprint),
					m(".small.text-break.text-center.mb-l", lang.get("keyManagement.publicKeyFingerprintQrInfo_msg")),

					m(MenuTitle, { content: lang.get("keyManagement.verificationPool_label") }),
					m(
						Card,
						m(".full-width.flex-space-between.items-center.pl-vpad-s", [
							lang.get("keyManagement.verifyMailAddress_action"),
							m(IconButton, {
								title: "keyManagement.verifyMailAddress_action",
								click: async () => {
									await showKeyVerificationWizard(this.keyVerificationFacade, this.mobileSystemFacade, this.usageTestController, () =>
										obj.reload(),
									)
								},
								icon: Icons.Add,
								size: ButtonSize.Compact,
							}),
						]),
					),
					...addressRows,
				],
			),
		])
	}

	private renderQrTextMethod(selfMailAddress: string, selfFingerprint: PublicKeyFingerprint): Children {
		const currentTheme = locator.themeController.getCurrentTheme()
		const isLightTheme = currentTheme.themeId === "light" || currentTheme.themeId === "light_secondary"

		const qrCodeGraphic = m.trust(renderFingerprintAsQrCode(selfMailAddress, selfFingerprint))
		return m(Card, {}, [
			// QR code
			m(
				".pb.pt",
				{ style: { display: "flex", "justify-content": "center" } },
				// If the user is on a dark theme, we want to render a white border around the QR code to help the detection algorithm.
				// We do not want any extra padding on light themes since it looks ugly.
				isLightTheme
					? m("", qrCodeGraphic)
					: m(
							".bg-white.border-radius-big",
							{
								style: {
									"line-height": "0",
									padding: "24px",
								},
							},
							qrCodeGraphic,
					  ),
			),
			// text
			m(MonospaceTextDisplay, {
				text: renderFingerprintAsText(selfFingerprint),
				chunkSize: 4,
				classes: ".center.lh",
				border: false,
			}),
			m(".mb-s"),
		])
	}
}
