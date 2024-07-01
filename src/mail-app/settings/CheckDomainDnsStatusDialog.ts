import m from "mithril"
import { lang } from "../../common/misc/LanguageViewModel"
import { Dialog, DialogType } from "../../common/gui/base/Dialog"
import { DomainDnsStatus } from "./DomainDnsStatus"
import { renderCheckResult } from "./emaildomain/VerifyDnsRecordsPage"
import { assertMainOrNode } from "../../common/api/common/Env"

assertMainOrNode()

/**
 * @pre domainStatus.status.isLoaded() == true
 */
export function showDnsCheckDialog(domainStatus: DomainDnsStatus) {
	let dialog = Dialog.showActionDialog({
		type: DialogType.EditLarger,
		title: () => lang.get("checkDnsRecords_action"),
		okActionTextId: "checkAgain_action",
		cancelActionTextId: "close_alt",
		child: () => renderCheckResult(domainStatus, true),
		okAction: () => {
			domainStatus.loadCurrentStatus().then(() => {
				if (domainStatus.areRecordsFine()) {
					dialog.close()
				} else {
					m.redraw()
				}
			})
		},
	})
}
