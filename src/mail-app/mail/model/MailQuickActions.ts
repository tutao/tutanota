import { MailModel } from "./MailModel"
import { QuickAction } from "../../../common/misc/QuickActionBar"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { getMailboxName } from "../../../common/mailFunctionality/SharedMailUtils"
import { LoginController } from "../../../common/api/main/LoginController"
import { getFolderName } from "./MailUtils"
import { Router } from "../../../common/gui/ScopedRouter"
import { getElementId } from "../../../common/api/common/utils/EntityUtils"
import { lang } from "../../../common/misc/LanguageViewModel"

export async function quickMailActions(
	mailboxModel: MailboxModel,
	mailModel: MailModel,
	loginController: LoginController,
	router: Router,
): Promise<readonly QuickAction[]> {
	const mailboxDetails: MailboxDetail[] = await mailboxModel.getMailboxDetails()
	return mailboxDetails.flatMap((mailboxDetail) => {
		const mailboxName = getMailboxName(loginController, mailboxDetail)

		const newEmailAction: QuickAction = {
			description: `${mailboxName} ${lang.getTranslationText("newMail_action")}`,
			exec: async () => {
				const { newMailEditor } = await import("../editor/MailEditor")
				const dialog = await newMailEditor(mailboxDetail)
				dialog?.show()
			},
		}

		const fs = mailModel.getFolderSystemByGroupId(mailboxDetail.mailGroup._id)

		let folderActions: readonly QuickAction[]
		if (fs == null) {
			folderActions = []
		} else {
			const needsMailboxDisambiguation = mailboxDetails.length > 1
			folderActions = fs.getIndentedList().map(({ folder }) => {
				return {
					description: needsMailboxDisambiguation
						? `${lang.getTranslationText("mailbox_label")} ${mailboxName} ${getFolderName(folder)}`
						: `${lang.getTranslationText("mailbox_label")} ${getFolderName(folder)}`,
					// TODO: this is not ideal as this will forget the selected mail in that folder. We could pull it
					//   up from somewhere.
					exec: () => router.routeTo("/mail/:folder", { folder: getElementId(folder) }),
				}
			})
		}

		return [newEmailAction, ...folderActions]
	})
}
