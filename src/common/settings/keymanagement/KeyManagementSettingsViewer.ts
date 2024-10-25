import { UpdatableSettingsViewer } from "../Interfaces.js"
import { EntityUpdateData } from "../../api/common/utils/EntityUpdateUtils.js"
import m, { Children } from "mithril"
import { UserController } from "../../api/main/UserController.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { CryptoFacade } from "../../api/worker/crypto/CryptoFacade.js"
import { lang } from "../../misc/LanguageViewModel"
import { IconButton } from "../../gui/base/IconButton"
import { Icons } from "../../gui/base/icons/Icons"
import { ButtonSize } from "../../gui/base/ButtonSize"
import { VerifyMailAddressDialog } from "./VerifyMailAddressDialog"
import { KeyVerificationDetails, KeyVerificationFacade, MailAddress } from "../../api/worker/facades/lazy/KeyVerificationFacade"

export class KeyManagementSettingsViewer implements UpdatableSettingsViewer {
	publicKeyHash: string | null
	verificationPool: Map<MailAddress, KeyVerificationDetails>

	constructor(
		private readonly keyVerificationFacade: KeyVerificationFacade,
		private readonly cryptoFacade: CryptoFacade,
		private readonly userController: UserController,
	) {
		this.publicKeyHash = null
		this.verificationPool = new Map<MailAddress, KeyVerificationDetails>()
		this.view = this.view.bind(this)
	}

	async init() {
		this.publicKeyHash = await this.cryptoFacade.getPublicKeyHash(assertNotNull(this.userController.userGroupInfo.mailAddress))
		this.verificationPool = await this.keyVerificationFacade.getPool()

		m.redraw()
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		m.redraw()
		return Promise.resolve()
	}

	async reload() {
		this.verificationPool = await this.keyVerificationFacade.getPool()
		m.redraw()
	}

	renderVerificationStatus(verified: boolean): m.Vnode<any, any> {
		return m("", verified ? "✔ (verified) " : "✘ (unverified) ")
	}

	view(): Children {
		const obj = this

		const addressRows = Array.from(this.verificationPool.entries()).map(([mailAddress, details]: [string, KeyVerificationDetails]) => {
			return [
				m(".flex.items-center.selectable", [
					m("span.b.text-break.selectable", mailAddress),
					m(".flex-grow"),
					this.renderVerificationStatus(details.verified),
					m(IconButton, {
						title: "keyManagement.verifyMailAddress_action",
						click: async () => {
							await this.keyVerificationFacade.removeFromPool(mailAddress)
							await obj.reload()
						},
						icon: Icons.Trash,
						size: ButtonSize.Compact,
					}),
				]),
				m(".small.text-break.monospace.selectable", details.fingerprint),
			]
		})

		return m("", [
			m(".fill-absolute.scroll.plr-l.pb-xl", [
				m(".h4.mt-l", lang.get("keyManagement.publicKeyFingerprint_label")),
				m("p", [m(".small.text-break.monospace.selectable", this.publicKeyHash)]),
				m(".small.text-break", lang.get("keyManagement.publicKeyFingerprintInfo_msg") + " "),

				m(".h4.mt-l", lang.get("keyManagement.verificationPool_label")),
				m(".full-width.flex-space-between.items-center.mb-s", [
					lang.get("keyManagement.verifyMailAddress_action"),
					m(IconButton, {
						title: "keyManagement.verifyMailAddress_action",
						click: async () => {
							const dialog = new VerifyMailAddressDialog(this.keyVerificationFacade, () => obj.reload())
							dialog.show()
						},
						icon: Icons.Add,
						size: ButtonSize.Compact,
					}),
				]),

				m("", ...addressRows),
			]),
		])
	}
}
