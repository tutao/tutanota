import m, { Children, Component, Vnode } from "mithril"
import { CounterBadge } from "../../../common/gui/base/CounterBadge"
import { getNavButtonIconBackground, theme } from "../../../common/gui/theme"
import { lang } from "../../../common/misc/LanguageViewModel"
import { Button, ButtonColor, ButtonType } from "../../../common/gui/base/Button.js"
import type { MinimizedEditor, MinimizedMailEditorViewModel } from "../model/MinimizedMailEditorViewModel"
import { SaveErrorReason, SaveStatus, SaveStatusEnum } from "../model/MinimizedMailEditorViewModel"
import { px } from "../../../common/gui/size"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { styles } from "../../../common/gui/styles"
import { promptAndDeleteMails } from "./MailGuiUtils"
import { MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { OperationType } from "../../../common/api/common/TutanotaConstants"
import { isSameId } from "../../../common/api/common/utils/EntityUtils"
import { noOp, promiseMap } from "@tutao/tutanota-utils"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { EntityEventsListener, EventController } from "../../../common/api/main/EventController.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { mailLocator } from "../../mailLocator.js"

const COUNTER_POS_OFFSET = px(-8)
export type MinimizedEditorOverlayAttrs = {
	viewModel: MinimizedMailEditorViewModel
	minimizedEditor: MinimizedEditor
	eventController: EventController
}

export class MinimizedEditorOverlay implements Component<MinimizedEditorOverlayAttrs> {
	_listener: EntityEventsListener
	_eventController: EventController

	constructor(vnode: Vnode<MinimizedEditorOverlayAttrs>) {
		const { minimizedEditor, viewModel, eventController } = vnode.attrs
		this._eventController = eventController

		this._listener = (updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<unknown> => {
			return promiseMap(updates, (update) => {
				if (isUpdateForTypeRef(MailTypeRef, update) && update.operation === OperationType.DELETE) {
					let draft = minimizedEditor.sendMailModel.getDraft()

					if (draft && isSameId(draft._id, [update.instanceListId, update.instanceId])) {
						viewModel.removeMinimizedEditor(minimizedEditor)
					}
				}
			})
		}

		eventController.addEntityListener(this._listener)
	}

	onremove() {
		this._eventController.removeEntityListener(this._listener)
	}

	view(vnode: Vnode<MinimizedEditorOverlayAttrs>): Children {
		const { minimizedEditor, viewModel, eventController } = vnode.attrs
		const subject = minimizedEditor.sendMailModel.getSubject()
		return m(".elevated-bg.pl.border-radius", [
			m(CounterBadge, {
				count: viewModel.getMinimizedEditors().indexOf(minimizedEditor) + 1,
				position: {
					top: COUNTER_POS_OFFSET,
					right: COUNTER_POS_OFFSET,
				},
				color: theme.navigation_button_icon,
				background: getNavButtonIconBackground(),
			}),
			m(".flex.justify-between.pb-xs.pt-xs", [
				m(
					".flex.col.justify-center.min-width-0.flex-grow",
					{
						onclick: () => viewModel.reopenMinimizedEditor(minimizedEditor),
					},
					[
						m(".b.text-ellipsis", subject ? subject : lang.get("newMail_action")),
						m(".small.text-ellipsis", getStatusMessage(minimizedEditor.saveStatus())),
					],
				),
				m(".flex.items-center.justify-right", [
					!styles.isSingleColumnLayout()
						? m(IconButton, {
								title: "edit_action",
								click: () => viewModel.reopenMinimizedEditor(minimizedEditor),
								icon: Icons.Edit,
						  })
						: null,
					m(IconButton, {
						title: "delete_action",
						click: () => this._onDeleteClicked(minimizedEditor, viewModel),
						icon: Icons.Trash,
					}),
					m(IconButton, {
						title: "close_alt",
						click: () => viewModel.removeMinimizedEditor(minimizedEditor),
						icon: Icons.Cancel,
					}),
				]),
			]),
		])
	}

	private _onDeleteClicked(minimizedEditor: MinimizedEditor, viewModel: MinimizedMailEditorViewModel) {
		const model = minimizedEditor.sendMailModel
		viewModel.removeMinimizedEditor(minimizedEditor)
		// only delete once save has finished
		minimizedEditor.saveStatus.map(async ({ status }) => {
			if (status !== SaveStatusEnum.Saving) {
				const draft = model.draft

				if (draft) {
					await promptAndDeleteMails(mailLocator.mailModel, [draft], noOp)
				}
			}
		})
	}
}

function getStatusMessage(saveStatus: SaveStatus): string {
	switch (saveStatus.status) {
		case SaveStatusEnum.Saving:
			return lang.get("save_msg")
		case SaveStatusEnum.NotSaved:
			switch (saveStatus.reason) {
				case SaveErrorReason.ConnectionLost:
					return lang.get("draftNotSavedConnectionLost_msg")
				default:
					return lang.get("draftNotSaved_msg")
			}
		case SaveStatusEnum.Saved:
			return lang.get("draftSaved_msg")
		default:
			return ""
	}
}
