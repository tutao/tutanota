import { createPushIdentifier, User } from "../../common/api/entities/sys/TypeRefs.js"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs.js"
import { Dialog } from "../../common/gui/base/Dialog.js"
import { lang, type TranslationKey } from "../../common/misc/LanguageViewModel.js"
import m from "mithril"
import { TextField, TextFieldType } from "../../common/gui/base/TextField.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { getCleanedMailAddress } from "../../common/misc/parsing/MailAddressParser.js"
import { PushServiceType } from "../../common/api/common/TutanotaConstants.js"
import { showProgressDialog } from "../../common/gui/dialogs/ProgressDialog.js"
import { LoginController } from "../../common/api/main/LoginController.js"
import { EntityClient } from "../../common/api/common/EntityClient.js"
import { AppType } from "../../common/misc/ClientConstants.js"

export class AddNotificationEmailDialog {
	constructor(private readonly logins: LoginController, private readonly entityClient: EntityClient) {}

	show() {
		if (this.logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog()
		} else {
			let mailAddress = ""

			Dialog.showActionDialog({
				title: lang.get("notificationSettings_action"),
				child: {
					view: () => [
						m(TextField, {
							label: "mailAddress_label",
							value: mailAddress,
							type: TextFieldType.Email,
							oninput: (newValue) => (mailAddress = newValue),
						}),
						m(".small.mt-s", lang.get("emailPushNotification_msg")),
					],
				},
				validator: () => this.validateAddNotificationEmailAddressInput(mailAddress),
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
			_area: "0", // legacy
			_owner: user.userGroup.group, // legacy
			_ownerGroup: user.userGroup.group,
			displayName: lang.get("adminEmailSettings_action"),
			identifier: assertNotNull(getCleanedMailAddress(mailAddress)),
			language: lang.code,
			pushServiceType: PushServiceType.EMAIL,
			lastUsageTime: new Date(),
			lastNotificationDate: null,
			disabled: false,
			app: AppType.Mail, // Calendar app doesn't receive mail notifications
		})

		showProgressDialog("pleaseWait_msg", this.entityClient.setup(assertNotNull(user.pushIdentifierList).list, pushIdentifier))
	}

	private validateAddNotificationEmailAddressInput(emailAddress: string): TranslationKey | null {
		return getCleanedMailAddress(emailAddress) == null ? "mailAddressInvalid_msg" : null // TODO check if it is a Tutanota mail address
	}
}
