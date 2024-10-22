import { UpdatableSettingsViewer } from "../Interfaces.js"
import { EntityUpdateData } from "../../api/common/utils/EntityUpdateUtils.js"
import m, { Children } from "mithril"
import { UserController } from "../../api/main/UserController.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { CryptoFacade } from "../../api/worker/crypto/CryptoFacade.js"
import { lang } from "../../misc/LanguageViewModel"
import { KeyVerificationFacade } from "../../api/worker/facades/lazy/KeyVerificationFacade"

export class KeyManagementSettingsViewer implements UpdatableSettingsViewer {
	publicKeyHash: string | null

	constructor(
		private readonly keyVerificationFacade: KeyVerificationFacade,
		private readonly cryptoFacade: CryptoFacade,
		private readonly userController: UserController,
	) {
		this.publicKeyHash = null
	}

	async init() {
		this.publicKeyHash = await this.cryptoFacade.getPublicKeyHash(assertNotNull(this.userController.userGroupInfo.mailAddress))
		const blah = await this.keyVerificationFacade.meow()
		console.log("KV-Facade: ", blah)
		m.redraw()
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		m.redraw()
		return Promise.resolve()
	}

	view(): Children {
		return m("", [
			m(".fill-absolute.scroll.plr-l.pb-xl", [
				m(".h4.mt-l", lang.get("keyManagement.publicKeyFingerprint_label")),
				m("p", [m(".small.text-break.monospace.selectable", this.publicKeyHash)]),
				m(".small.text-break", lang.get("keyManagement.publicKeyFingerprintInfo_msg") + " "),
			]),
		])
	}
}
