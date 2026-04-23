import { AccountDeletionPageState, showTitleSection, TitleState } from "../DeleteAccountDialogNew"
import m, { Children, Component, Vnode } from "mithril"
import { TextFieldType } from "../../../gui/base/TextField"
import { LoginTextField } from "../../../gui/base/LoginTextField"
import { isMailAddress } from "../../../misc/FormatValidator"
import { locator } from "../../../api/main/CommonLocator"
import { debounce } from "@tutao/tutanota-utils"

type MailTakeoverPageProps = {
	data: AccountDeletionPageState
	goToPasswordEntryPage: () => void
}

export class MailTakeoverPage implements Component<MailTakeoverPageProps> {
	private state: TitleState = "initial"
	private debouncedOnInput = debounce(1000, async (mailAddress: string, data: AccountDeletionPageState) => {
		if (isMailAddress(mailAddress, false)) {
			this.state = "sync"
			//FIXME: Only checks if available, not if paid and existing...
			const result = await locator.mailAddressFacade.isMailAddressAvailable(mailAddress)
			if (!result) {
				data.canContinueTakeoverMail = true
				data.takeOverMailAddress = mailAddress
				this.state = "success"
			} else {
				this.state = "error"
			}
		}
		m.redraw()
	})
	view({ attrs: { data } }: Vnode<MailTakeoverPageProps>): Children {
		return m(
			".pt-16.pb-16",
			m("", [
				m("", { style: { minHeight: "185px" } }, showTitleSection(data.primaryMailAddress, this.state, "mail")),
				m(LoginTextField, {
					label: "targetAddress_label",
					value: data.takeOverMailAddress,
					type: TextFieldType.Email,
					oninput: (value) => {
						this.state = "initial"
						data.takeOverMailAddress = value
						data.canContinueTakeoverMail = false
						this.debouncedOnInput(value, data)
					},
				}),
			]),
		)
	}
}
