// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {DomainDnsStatus} from "./DomainDnsStatus"
import {renderCheckResult} from "./emaildomain/VerifyDnsRecordsPage"
import {assertMainOrNode} from "../api/common/Env"

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
