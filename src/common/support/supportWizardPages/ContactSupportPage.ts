import m, { Children, Component, Vnode } from "mithril"
import { SupportDialogState } from "../SupportDialog.js"
import { getLogAttachments } from "../../misc/ErrorReporter.js"
import { DataFile } from "../../api/common/DataFile.js"
import { Thunk } from "@tutao/tutanota-utils"
import { EmailSupportView } from "./EmailSupportView.js"
import { EmailSupportUnavailableView } from "./EmailSupportUnavailableView.js"

export type Props = {
	data: SupportDialogState
	goToSuccessPage: Thunk
}

export class ContactSupportPage implements Component<Props> {
	oninit(vnode: Vnode<Props>) {
		this.collectLogs().then((logs) => {
			vnode.attrs.data.logs(logs)
			m.redraw()
		})
	}

	view({ attrs: { data, goToSuccessPage } }: Vnode<Props>): Children {
		if (data.canHaveEmailSupport) {
			return m(EmailSupportView, { data, goToSuccessPage })
		} else {
			return m(EmailSupportUnavailableView)
		}
	}

	private async collectLogs(): Promise<DataFile[]> {
		return await getLogAttachments(new Date())
	}
}
