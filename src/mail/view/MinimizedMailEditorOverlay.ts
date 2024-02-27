import m from "mithril"
import { px, size } from "../../gui/size"
import { displayOverlay } from "../../gui/base/Overlay"
import { DefaultAnimationTime } from "../../gui/animation/Animations"
import { EventController } from "../../api/main/EventController"
import { styles } from "../../gui/styles"
import { LayerType } from "../../RootView"
import type { Dialog } from "../../gui/base/Dialog"
import type { SendMailModel } from "../editor/SendMailModel"
import type { MinimizedEditor, SaveStatus } from "../model/MinimizedMailEditorViewModel"
import { MinimizedMailEditorViewModel } from "../model/MinimizedMailEditorViewModel"
import { MinimizedEditorOverlay } from "./MinimizedEditorOverlay"
import { assertMainOrNode } from "../../api/common/Env"
import Stream from "mithril/stream"
import { noOp } from "@tutao/tutanota-utils"

assertMainOrNode()
const MINIMIZED_OVERLAY_WIDTH_WIDE = 350
const MINIMIZED_OVERLAY_WIDTH_SMALL = 220

export function showMinimizedMailEditor(
	dialog: Dialog,
	sendMailModel: SendMailModel,
	viewModel: MinimizedMailEditorViewModel,
	eventController: EventController,
	dispose: () => void,
	saveStatus: Stream<SaveStatus>,
): void {
	let closeOverlayFunction: () => void = noOp // will be assigned with the actual close function when overlay is visible.

	const minimizedEditor = viewModel.minimizeMailEditor(dialog, sendMailModel, dispose, saveStatus, () => closeOverlayFunction())
	// only show overlay once editor is gone
	setTimeout(() => {
		closeOverlayFunction = showMinimizedEditorOverlay(viewModel, minimizedEditor, eventController)
	}, DefaultAnimationTime)
}

function showMinimizedEditorOverlay(viewModel: MinimizedMailEditorViewModel, minimizedEditor: MinimizedEditor, eventController: EventController): () => void {
	return displayOverlay(
		() => getOverlayPosition(),
		{
			view: () =>
				m(MinimizedEditorOverlay, {
					viewModel,
					minimizedEditor,
					eventController,
				}),
		},
		"slide-bottom",
		undefined,
		"minimized-shadow",
	)
}

function getOverlayPosition() {
	return {
		bottom: styles.isUsingBottomNavigation() ? px(size.hpad) : px(size.vpad),
		// position will change with translateY
		right: styles.isUsingBottomNavigation() ? px(size.hpad) : px(size.hpad_medium),
		width: px(styles.isSingleColumnLayout() ? MINIMIZED_OVERLAY_WIDTH_SMALL : MINIMIZED_OVERLAY_WIDTH_WIDE),
		zIndex: LayerType.LowPriorityOverlay,
	}
}
