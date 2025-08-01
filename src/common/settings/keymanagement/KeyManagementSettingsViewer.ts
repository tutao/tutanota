import { UpdatableSettingsViewer } from "../Interfaces.js"
import { EntityUpdateData } from "../../api/common/utils/EntityUpdateUtils.js"
import m, { Children } from "mithril"
import { UserController } from "../../api/main/UserController.js"
import { lang } from "../../misc/LanguageViewModel"
import { IconButton } from "../../gui/base/IconButton"
import { Icons } from "../../gui/base/icons/Icons"
import { ButtonSize } from "../../gui/base/ButtonSize"
import { KeyVerificationFacade, TrustedIdentity } from "../../api/worker/facades/lazy/KeyVerificationFacade"
import { showKeyVerificationDialog } from "./KeyVerificationDialog"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade"
import { UsageTestController } from "@tutao/tutanota-usagetests"
import { TitleSection } from "../../gui/TitleSection"
import { Card } from "../../gui/base/Card"
import { renderFingerprintAsQrCode } from "./FingerprintRenderers"
import { MenuTitle } from "../../gui/titles/MenuTitle"
import { theme } from "../../gui/theme"
import { FingerprintRow } from "./FingerprintRow"
import { getDefaultSenderFromUser } from "../../mailFunctionality/SharedMailUtils"
import { ThemeController } from "../../gui/ThemeController"
import { PublicIdentity } from "./KeyVerificationModel"
import { PublicIdentityKeyProvider } from "../../api/worker/facades/PublicIdentityKeyProvider"
import { Versioned } from "@tutao/tutanota-utils"
import { SigningPublicKey } from "../../api/worker/facades/Ed25519Facade"
import { showSnackBar } from "../../gui/base/SnackBar"
import { copyToClipboard } from "../../misc/ClipboardUtils"

/**
 * Our own identity key, which is not stored on the trust DB.
 */
type OwnPublicIdentity = Omit<PublicIdentity, "trustDbEntry"> & { publicKey: Versioned<SigningPublicKey> }

/**
 * Section in user settings to deal with everything related to key verification.
 *
 * It can display the user's own fingerprint, list trusted identities, and start the key verification process.
 */
export class KeyManagementSettingsViewer implements UpdatableSettingsViewer {
	ownIdentity: OwnPublicIdentity | null

	trustedIdentities: Map<string, TrustedIdentity>

	constructor(
		private readonly keyVerificationFacade: KeyVerificationFacade,
		private readonly mobileSystemFacade: MobileSystemFacade,
		private readonly userController: UserController,
		private readonly usageTestController: UsageTestController,
		private readonly publicIdentityKeyProvider: PublicIdentityKeyProvider,
		private readonly themeController: ThemeController,
	) {
		this.ownIdentity = null
		this.trustedIdentities = new Map<string, TrustedIdentity>()
		this.view = this.view.bind(this)
	}

	async init() {
		const ownIdentityKey = await this.publicIdentityKeyProvider.loadPublicIdentityKeyFromGroup(this.userController.userGroupInfo.group)
		if (ownIdentityKey != null) {
			this.ownIdentity = {
				fingerprint: await this.keyVerificationFacade.calculateFingerprint(ownIdentityKey),
				mailAddress: getDefaultSenderFromUser(this.userController),
				publicKey: ownIdentityKey,
			}
		} else {
			this.ownIdentity = null
		}

		this.trustedIdentities = await this.keyVerificationFacade.getManuallyVerifiedIdentities()
		m.redraw()
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		// noop operation because key trusted entities are not stored only locally and will not trigger an entity event.
		return Promise.resolve()
	}

	async reload() {
		this.trustedIdentities = await this.keyVerificationFacade.getManuallyVerifiedIdentities()
		m.redraw()
	}

	view(): Children {
		const obj: KeyManagementSettingsViewer = this

		const addressRows = Array.from(this.trustedIdentities.entries()).map(([mailAddress, trustedIdentity]: [string, TrustedIdentity]) => {
			return m(FingerprintRow, {
				mailAddress,
				publicKeyType: trustedIdentity.publicIdentityKey.object.type,
				publicKeyFingerprint: trustedIdentity.fingerprint,
				publicKeyVersion: trustedIdentity.publicIdentityKey.version,
				action: {
					onClick: async (mailAddress: string) => {
						await this.keyVerificationFacade.untrust(mailAddress)
						await this.reload()
					},
					icon: Icons.Trash,
					tooltip: "delete_action",
				},
			})
		})

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
						subTitle: lang.get("keyManagement.keyVerification_subtitle_label"),
					}),
					this.ownIdentity != null ? this.renderOwnIdentity(this.ownIdentity) : null,
					m(".small.text-center.mb-l", lang.get("keyManagement.publicKeyFingerprintQrInfo_msg")),
					m(MenuTitle, { content: lang.get("keyManagement.verificationPool_label") }),
					m(
						Card,
						m(".full-width.flex-space-between.items-center.pl-vpad-s", [
							lang.get("keyManagement.verifyMailAddress_action"),
							m(IconButton, {
								title: "keyManagement.verifyMailAddress_action",
								click: async () => {
									await showKeyVerificationDialog(
										this.keyVerificationFacade,
										this.mobileSystemFacade,
										this.usageTestController,
										this.publicIdentityKeyProvider,
										() => obj.reload(),
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

	private renderOwnIdentity(ownIdentity: OwnPublicIdentity): Children {
		const isLightTheme = this.themeController.isLightTheme()

		const qrCodeGraphic = m.trust(renderFingerprintAsQrCode(ownIdentity.mailAddress, ownIdentity.fingerprint))
		return [
			m(MenuTitle, { content: lang.get("keyVerificationVerificationCode_title") }),
			m(Card, {}, [
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
				m(FingerprintRow, {
					mailAddress: ownIdentity.mailAddress,
					publicKeyVersion: ownIdentity.publicKey.version,
					publicKeyType: ownIdentity.publicKey.object.type,
					publicKeyFingerprint: ownIdentity.fingerprint,
					action: {
						onClick: async () => {
							await copyToClipboard(ownIdentity.fingerprint)
							await showSnackBar({
								message: "copied_msg",
								button: {
									label: "close_alt",
									click: () => {},
								},
							})
						},
						icon: Icons.CopyOutline,
						tooltip: "copyToClipboard_action",
					},
				}),
			]),
		]
	}
}
