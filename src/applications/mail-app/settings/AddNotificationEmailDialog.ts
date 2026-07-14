import { createPushIdentifier, User } from "@tutao/entities/sys"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs.js"
import { Dialog } from "../../../ui/base/Dialog.js"
import { lang, type TranslationKey } from "../../../ui/utils/LanguageViewModel.js"
import m from "mithril"
import { LegacyTextField, LegacyTextFieldType } from "../../../ui/base/LegacyTextField.js"
import { assertNotNull } from "../../../platform-kit/utils"
import { getCleanedMailAddress } from "../../common/misc/parsing/MailAddressParser.js"
import { AppType, PushServiceType, UpgradePromptType } from "../../../platform-kit/app-env"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog.js"
import { LoginController } from "../../common/api/main/LoginController.js"
import { EntityClient } from "../../../platform-kit/network/EntityClient"

export class AddNotificationEmailDialog {
	constructor(
		private readonly logins: LoginController,
		private readonly entityClient: EntityClient,
	) {}

	show() {
		if (this.logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog(UpgradePromptType.NOTIFICATION_EMAILS)
		} else {
			let mailAddress = ""

			Dialog.showActionDialog({
				title: "notificationSettings_action",
				child: {
					view: () => [
						m(LegacyTextField, {
							label: "mailAddress_label",
							value: mailAddress,
							type: LegacyTextFieldType.Email,
							oninput: (newValue) => (mailAddress = newValue),
						}),
						m(".small.mt-8", lang.get("emailPushNotification_msg")),
					],
				},
				validator: async () => this.validateAddNotificationEmailAddressInput(mailAddress),
				allowOkWithReturn: true,
				okAction: (dialog: Dialog) => {
					this.createNotificationEmail(mailAddress, this.logins.getUserController().user)
					dialog.close()
				},
			})
		}
	}

	private createNotificationEmail(mailAddress: string, user: User) {
		const pushIdentifier = createPushIdentifier({
			displayName: lang.get("adminEmailSettings_action"),
			identifier: assertNotNull(getCleanedMailAddress(mailAddress)),
			language: lang.code,
			pushServiceType: PushServiceType.EMAIL,
			lastUsageTime: new Date(),
			lastNotificationDate: null,
			disabled: false,
			app: AppType.Mail, // Calendar app doesn't receive mail notifications
		})
		pushIdentifier._area = "0" // legacy
		pushIdentifier._owner = user.userGroup.group // legacy
		pushIdentifier._ownerGroup = user.userGroup.group

		showProgressDialog("pleaseWait_msg", this.entityClient.setup(assertNotNull(user.pushIdentifierList).list, pushIdentifier, null))
	}

	private validateAddNotificationEmailAddressInput(emailAddress: string): TranslationKey | null {
		return getCleanedMailAddress(emailAddress) == null ? "mailAddressInvalid_msg" : null // TODO check if it is a Tutanota mail address
	}
}
