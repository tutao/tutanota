import m, { Children } from "mithril"
<<<<<<<< HEAD:src/common/settings/ReferralSettingsViewer.ts
import type { UpdatableSettingsViewer } from "./Interfaces.js"
import { getReferralLink, ReferralLinkViewer } from "../../common/misc/news/items/ReferralLinkViewer.js"
import { locator } from "../../common/api/main/CommonLocator.js"
========
import type { UpdatableSettingsViewer } from "./SettingsView"
import { getReferralLink, ReferralLinkViewer } from "../../common/misc/news/items/ReferralLinkViewer.js"
import { locator } from "../../common/api/main/MainLocator.js"
>>>>>>>> 3349a964d (Move files to new folder structure):src/mail-app/settings/ReferralSettingsViewer.ts
import { EntityUpdateData } from "../../common/api/common/utils/EntityUpdateUtils.js"

/**
 * Section in user settings to display the referral link and let users share it.
 */
export class ReferralSettingsViewer implements UpdatableSettingsViewer {
	private referralLink: string = ""

	constructor() {
		this.refreshReferralLink()
	}

	view(): Children {
		return m(".mt-l.plr-l.pb-xl", m(ReferralLinkViewer, { referralLink: this.referralLink }))
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		// can be a noop because the referral code will never change once it was created
		// we trigger creation in the constructor if there is no code yet
	}

	private refreshReferralLink() {
		getReferralLink(locator.logins.getUserController()).then((link) => {
			this.referralLink = link
			m.redraw()
		})
	}
}
