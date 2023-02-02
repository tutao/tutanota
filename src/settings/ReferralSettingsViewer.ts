import m, { Children } from "mithril"
import type { EntityUpdateData } from "../api/main/EventController"
import type { UpdatableSettingsViewer } from "./SettingsView"
import { getReferralLink, ReferralLinkViewer } from "../misc/news/items/ReferralLinkViewer.js"
import { logins } from "../api/main/LoginController.js"

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
		getReferralLink(logins.getUserController()).then((link) => {
			this.referralLink = link
			m.redraw()
		})
	}
}
