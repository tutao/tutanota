import { MailModel } from "./MailModel"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { getMailboxName } from "../../../common/mailFunctionality/SharedMailUtils"
import { LoginController } from "../../../common/api/main/LoginController"
import { getIndentedFolderNameForDropdown, getPathToFolderString } from "./MailUtils"
import { Router } from "../../../common/gui/ScopedRouter"
import { getElementId } from "../../../common/api/common/utils/EntityUtils"
import { lang } from "../../../common/misc/LanguageViewModel"
import { IndentedFolder } from "../../../common/api/common/mail/FolderSystem"
import { MAIL_PREFIX } from "../../../common/misc/RouteChange"
import { QuickAction } from "../../../common/misc/quickactions/QuickActionsModel"

export async function quickMailActions(
	mailboxModel: MailboxModel,
	mailModel: MailModel,
	loginController: LoginController,
	router: Router,
): Promise<readonly QuickAction[]> {
	const mailboxDetails: MailboxDetail[] = await mailboxModel.getMailboxDetails()
	const needsMailboxDisambiguation = mailboxDetails.length > 1
	return mailboxDetails.flatMap((mailboxDetail) => {
		const mailboxName = needsMailboxDisambiguation ? getMailboxName(loginController, mailboxDetail) : ""

		const mailTabAction: QuickAction = {
			description: lang.getTranslationText("emails_label"),
			exec: () => router.routeTo(MAIL_PREFIX, {}),
		}

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
			folderActions = fs.getIndentedList().map(({ folder }) => {
				return {
					// this is not the most performant thing, but we are doing this once so it's okay
					description: `${mailboxName} ${getPathToFolderString(fs, folder)}`,
					// TODO: this is not ideal as this will forget the selected mail in that folder. We could pull it
					//   up from somewhere.
					exec: () => router.routeTo(`${MAIL_PREFIX}/:folder`, { folder: getElementId(folder) }),
				}
			})
		}

		return [mailTabAction, newEmailAction, ...folderActions]
	})
}
