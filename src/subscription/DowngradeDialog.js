// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {lang} from "../misc/LanguageViewModel"
import {BuyOptionBox} from "./BuyOptionBox"
import {Button, ButtonType} from "../gui/base/Button"
import {Keys} from "../misc/KeyManager"
import {serviceRequestVoid} from "../api/main/Entity"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {createSwitchAccountTypeData} from "../api/entities/sys/SwitchAccountTypeData"
import {AccountType, Const} from "../api/common/TutanotaConstants"
import {InvalidDataError, PreconditionFailedError} from "../api/common/error/RestError"
import {worker} from "../api/main/WorkerClient"

export function showDowngradeDialog() {
	let freeTypeBox = new BuyOptionBox(() => "Free", "choose_action",
		() => cancelSubscription(dialog),
		[], 230, 240
	)
	freeTypeBox.setValue("")
	freeTypeBox.setHelpLabel(lang.get("downgradeSubscription_msg"))

	let subscriptionTypeBox = new BuyOptionBox(() => "Premium", "choose_action",
		() => dialog.close(),
		[], 230, 240
	)
	subscriptionTypeBox.setValue("")
	subscriptionTypeBox.setHelpLabel(lang.get("keepSubscription_msg"))

	const cancelAction = () => {
		dialog.close()
	}

	const headerBar = new DialogHeaderBar()
		.addLeft(new Button("cancel_action", cancelAction).setType(ButtonType.Secondary))
		.setMiddle(() => lang.get("accountType_label"))
	const dialog = Dialog.largeDialog(headerBar, {
		view: () => m("#upgrade-account-dialog.pt", [
			m(".flex-center.flex-wrap", [freeTypeBox, subscriptionTypeBox].map(bo => m(bo)))
		])
	})

	dialog.addShortcut({
		key: Keys.ESC,
		exec: cancelAction,
		help: "closeDialog_msg"
	})
	dialog.show()

	// accountSwitchAdditionalPackagesActive_msg
	// accountSwitchTooManyActiveUsers_msg
	// deactivatePremiumWithCustomDomainError_msg
}

function cancelSubscription(dialog: Dialog) {

	Dialog.confirm("unsubscribePremiumConfirm_msg").then(ok => {
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
	})
}