import m, { Children } from "mithril"
import type { UpdatableSettingsViewer } from "./Interfaces.js"
import { getReferralLink, ReferralLinkViewer } from "../misc/news/items/ReferralLinkViewer.js"
import { locator } from "../api/main/CommonLocator.js"
import { EntityUpdateData } from "../api/common/utils/EntityUpdateUtils.js"

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
