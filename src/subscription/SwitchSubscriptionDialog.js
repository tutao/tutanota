// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {lang} from "../misc/LanguageViewModel"
import {Button, ButtonType} from "../gui/base/Button"
import {Keys} from "../misc/KeyManager"
import {serviceRequestVoid} from "../api/main/Entity"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {createSwitchAccountTypeData} from "../api/entities/sys/SwitchAccountTypeData"
import {AccountType, Const} from "../api/common/TutanotaConstants"
import {InvalidDataError, PreconditionFailedError} from "../api/common/error/RestError"
import {worker} from "../api/main/WorkerClient"
import {SubscriptionSelector} from "./SubscriptionSelector"
import stream from "mithril/stream/stream.js"
import {buyAliases} from "./EmailAliasOptionsDialog"
import {buyStorage} from "./StorageCapacityOptionsDialog"
import {buyWhitelabel} from "./WhitelabelBuyDialog"
import {changeSubscriptionInterval} from "./SubscriptionViewer"

export function showDowngradeDialog(accountingInfo: AccountingInfo, isPro: boolean) {
	let businessStream = stream(accountingInfo.business)
	let selector = new SubscriptionSelector(AccountType.PREMIUM,
		() => cancelSubscription(dialog),
		() => switchSubscription(false, isPro, accountingInfo, selector._premiumUpgradeBox.paymentInterval().value, dialog),
		() => switchSubscription(true, isPro, accountingInfo, selector._proUpgradeBox.paymentInterval().value, dialog),
		businessStream)

	const cancelAction = () => {
		dialog.close()
	}

	const headerBar = new DialogHeaderBar()
		.addLeft(new Button("cancel_action", cancelAction).setType(ButtonType.Secondary))
		.setMiddle(() => lang.get("subscription_label"))
	const dialog = Dialog.largeDialog(headerBar, {
		view: () => m("#upgrade-account-dialog.pt", m(selector))
	})

	dialog.addShortcut({
		key: Keys.ESC,
		exec: cancelAction,
		help: "closeDialog_msg"
	})
	dialog.show()

}

function cancelSubscription(dialog: Dialog) {
	Dialog.confirm("unsubscribeConfirm_msg").then(ok => {
		if (ok) {
			let d = createSwitchAccountTypeData()
			d.accountType = AccountType.FREE
			d.date = Const.CURRENT_DATE
			serviceRequestVoid(SysService.SwitchAccountTypeService, HttpMethod.POST, d)
				.then(() => worker.switchPremiumToFreeGroup())
				.catch(InvalidDataError, e => Dialog.error("accountSwitchTooManyActiveUsers_msg"))
				.catch(PreconditionFailedError, e => Dialog.error("accountSwitchAdditionalPackagesActive_msg"))
				.finally(() => dialog.close())
		}
		// TODO deactivatePremiumWithCustomDomainError_msg ?
	})
}

function switchSubscription(bookPro: boolean, isPro: boolean, accountingInfo: AccountingInfo, paymentInterval: number, dialog: Dialog) {
	let promise = Promise.resolve()
	if (bookPro && !isPro) {
		Dialog.confirm("upgradePro_msg").then(ok => {
			if (ok) {
				promise = buyAliases(20)
					.then(() => buyStorage(10))
					.then(() => buyWhitelabel(true))
					.then(() => updatePaymentInterval(paymentInterval, accountingInfo))
					.then(() => dialog.close())
			}
		})
	} else if (!bookPro && isPro) {
		Dialog.confirm("downgradeToPremium_msg").then(ok => {
			if (ok) {
				promise = buyAliases(0)
					.then(() => buyStorage(0))
					.then(() => buyWhitelabel(false))
					.then(() => updatePaymentInterval(paymentInterval, accountingInfo))
					.then(() => dialog.close())
			}
		})
	}
}

function updatePaymentInterval(paymentInterval: number, accountingInfo: AccountingInfo) {
	if (paymentInterval != Number(accountingInfo.paymentInterval)) {
		changeSubscriptionInterval(accountingInfo, paymentInterval)
	}
}