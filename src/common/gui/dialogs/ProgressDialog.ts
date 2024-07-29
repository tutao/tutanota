import m from "mithril"
import { assertMainOrNode, isAdminClient } from "../../api/common/Env"
import { Dialog, DialogType } from "../base/Dialog"
import { DefaultAnimationTime } from "../animation/Animations"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { progressIcon } from "../base/Icon"
import { CompletenessIndicator } from "../CompletenessIndicator.js"
import Stream from "mithril/stream"
import { TabIndex } from "../../api/common/TutanotaConstants"
import type { lazy } from "@tutao/tutanota-utils"
import { delay } from "@tutao/tutanota-utils"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../base/DialogHeaderBar.js"

assertMainOrNode()

export async function showProgressDialog<T>(
	messageIdOrMessageFunction: TranslationKey | lazy<string>,
	action: Promise<T>,
	progressStream?: Stream<number>,
	isCancelable?: boolean,
	headerBarAttrs?: DialogHeaderBarAttrs,
): Promise<T> {
	if (progressStream != null) {
		progressStream.map(() => {
			m.redraw()
		})
	}

	const progressDialog = new Dialog(DialogType.Progress, {
		view: () =>
			m("", [
				isCancelable && headerBarAttrs ? m(DialogHeaderBar, { ...headerBarAttrs, class: "mb-l mt-negative-l mr-negative-l ml-negative-l" }) : null,
				m(
					".hide-outline",
					{
						// We make this element focusable so that the screen reader announces the dialog
						tabindex: TabIndex.Default,

						oncreate(vnode) {
							// We need to delay so that the eelement is attached to the parent
							setTimeout(() => {
								;(vnode.dom as HTMLElement).focus()
							}, 10)
						},
					},
					[
						m(".flex-center", progressStream ? m(CompletenessIndicator, { percentageCompleted: progressStream() }) : progressIcon()),
						m("p#dialog-title", lang.getMaybeLazy(messageIdOrMessageFunction)),
					],
				),
			]),
	}).setCloseHandler(() => {
		// do not close progress on onClose event
	})
	progressDialog.show()
	let start = new Date().getTime()
	let minDialogVisibilityMillis = isAdminClient() ? 0 : 1000
	try {
		return await action
	} finally {
		const diff = Date.now() - start
		await delay(Math.max(minDialogVisibilityMillis - diff, 0))
		progressDialog.close()
		await delay(DefaultAnimationTime)
	}
}
