//@flow

import {asyncImport} from "../../api/common/utils/Utils"
import type {SubscriptionTypeEnum} from "../../subscription/SubscriptionUtils"

export function showUpgradeDialog() {
	asyncImport(typeof module !== "undefined" ?
		module.id : __moduleName, `${env.rootPathPrefix}src/subscription/UpgradeSubscriptionWizard.js`)
		.then(upgradeWizard => {
				// To not import constant
				let subscriptionType: SubscriptionTypeEnum = 'Free'
				return upgradeWizard.showUpgradeWizard(subscriptionType)
			}
		)
}

export function writeSupportMail() {
	asyncImport(typeof module !== "undefined" ?
		module.id : __moduleName, `${env.rootPathPrefix}src/mail/MailEditor.js`)
		.then(mailEditorModule => mailEditorModule.MailEditor.writeSupportMail())
}

export function writeInviteMail() {
	asyncImport(typeof module !== "undefined" ?
		module.id : __moduleName, `${env.rootPathPrefix}src/mail/MailEditor.js`)
		.then(mailEditorModule => mailEditorModule.MailEditor.writeInviteMail())
}