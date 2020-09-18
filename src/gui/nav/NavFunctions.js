//@flow

import {asyncImport} from "../../api/common/utils/Utils"
import type {SubscriptionTypeEnum} from "../../subscription/SubscriptionUtils"

export function showUpgradeDialog() {
	_asyncImport("src/subscription/UpgradeSubscriptionWizard.js")
		.then(upgradeWizard => {
				// To not import constant
				let subscriptionType: SubscriptionTypeEnum = 'Free'
				return upgradeWizard.showUpgradeWizard(subscriptionType)
			}
		)
}

export function showSupportDialog() {
	_asyncImport("src/support/SupportDialog.js")
		.then(supportModule => supportModule.showSupportDialog())
}

export function writeInviteMail() {
	_asyncImport("src/mail/MailEditorN.js")
		.then(mailEditorModule => mailEditorModule.writeInviteMail())
}

function _asyncImport(path: string) {
	return asyncImport(typeof module !== "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}${path}`)
}
