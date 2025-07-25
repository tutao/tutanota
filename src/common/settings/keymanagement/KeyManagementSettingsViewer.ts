import { UpdatableSettingsViewer } from "../Interfaces.js"
import { EntityUpdateData } from "../../api/common/utils/EntityUpdateUtils.js"
import m, { Children } from "mithril"
import { UserController } from "../../api/main/UserController.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { lang } from "../../misc/LanguageViewModel"
import { IconButton } from "../../gui/base/IconButton"
import { Icons } from "../../gui/base/icons/Icons"
import { ButtonSize } from "../../gui/base/ButtonSize"
import { KeyVerificationFacade, PublicKeyFingerprint } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import { KeyVerificationSourceOfTruth } from "../../api/common/TutanotaConstants"
import { showKeyVerificationDialog } from "./KeyVerificationDialog"
import { MonospaceTextDisplay } from "../../gui/base/MonospaceTextDisplay"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade"
import { UsageTestController } from "@tutao/tutanota-usagetests"
import { TitleSection } from "../../gui/TitleSection"
import { Card } from "../../gui/base/Card"
import { renderFingerprintAsQrCode, renderFingerprintAsText } from "./FingerprintRenderers"
import { MenuTitle } from "../../gui/titles/MenuTitle"
import { theme } from "../../gui/theme"
import { FingerprintRow } from "./FingerprintRow"
import { locator } from "../../api/main/CommonLocator.js"

/**
 * Section in user settings to deal with everything related to key verification.
 *
 * It can display the user's own fingerprint, list trusted identities, and start the key verification process.
 */
export class KeyManagementSettingsViewer implements UpdatableSettingsViewer {
	mailAddress: string | null
	publicKeyHash: PublicKeyFingerprint | null
	trustedIdentities: Map<string, PublicKeyFingerprint>

	constructor(
		private readonly keyVerificationFacade: KeyVerificationFacade,
		private readonly mobileSystemFacade: MobileSystemFacade,
		private readonly userController: UserController,
		private readonly usageTestController: UsageTestController,
	) {
		this.mailAddress = null
		this.publicKeyHash = null
		this.trustedIdentities = new Map<string, PublicKeyFingerprint>()
		this.view = this.view.bind(this)
	}

	async init() {
		this.mailAddress = assertNotNull(this.userController.userGroupInfo.mailAddress)
		this.publicKeyHash = await this.keyVerificationFacade.getFingerprint(this.mailAddress, KeyVerificationSourceOfTruth.PublicKeyService)
		this.trustedIdentities = await this.keyVerificationFacade.getTrustedIdentities()

		m.redraw()
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		// noop operation because key trusted entities are not stored only locally and will not trigger an entity event.
		return Promise.resolve()
	}

	async reload() {
		this.trustedIdentities = await this.keyVerificationFacade.getTrustedIdentities()
		m.redraw()
	}

	view(): Children {
		const obj: KeyManagementSettingsViewer = this

		const selfMailAddress = assertNotNull(this.mailAddress)
		const selfFingerprint = this.publicKeyHash

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

		return m("", [
			m(
				".fill-absolute.scroll.plr-l.pb-xl",
				{
					style: {
						backgroundColor: theme.surface_container,
						gap: "16px",
						display: "flex",
						flexDirection: "column",
					},
				},
				[
					m(TitleSection, {
						icon: Icons.KeyRegular,
						title: lang.get("keyManagement.keyVerification_label"),
						subTitle: lang.get("keyManagement.keyVerification_subtitle_label"),
					}),
					selfFingerprint ? this.renderQrTextMethod(selfMailAddress, selfFingerprint) : null,
					m(".small.text-center.mb-l", lang.get("keyManagement.publicKeyFingerprintQrInfo_msg")),
					m(MenuTitle, { content: lang.get("keyManagement.verificationPool_label") }),
					m(
						Card,
						m(".full-width.flex-space-between.items-center.pl-vpad-s", [
							lang.get("keyManagement.verifyMailAddress_action"),
							m(IconButton, {
								title: "keyManagement.verifyMailAddress_action",
								click: async () => {
									await showKeyVerificationDialog(this.keyVerificationFacade, this.mobileSystemFacade, this.usageTestController, () =>
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
		const isLightTheme = locator.themeController.isLightTheme()

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
			// mail address
			m(".b.center.mt-s.mb-s", selfMailAddress),
			// text
			// specifying chunksPerLine: 8 is possible, but breaks on very narrow display sizes, so we don't
			m(MonospaceTextDisplay, {
				text: renderFingerprintAsText(selfFingerprint),
				chunkSize: 4,
				classes: ".center.lh",
				border: false,
			}),
			m(".mb"),
		])
	}
}
