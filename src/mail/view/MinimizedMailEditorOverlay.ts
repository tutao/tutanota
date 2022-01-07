import m from "mithril"
import {px, size} from "../../gui/size"
import {displayOverlay} from "../../gui/base/Overlay"
import {DefaultAnimationTime, transform, TransformEnum} from "../../gui/animation/Animations"
import {EventController} from "../../api/main/EventController"
import {styles} from "../../gui/styles"
import {LayerType} from "../../RootView"
import type {Dialog} from "../../gui/base/Dialog"
import type {SendMailModel} from "../editor/SendMailModel"
import type {MinimizedEditor, SaveStatus} from "../model/MinimizedMailEditorViewModel"
import {MinimizedMailEditorViewModel} from "../model/MinimizedMailEditorViewModel"
import {MinimizedEditorOverlay} from "./MinimizedEditorOverlay"
import {windowFacade} from "../../misc/WindowFacade"
import {assertMainOrNode} from "../../api/common/Env"
import Stream from "mithril/stream";

assertMainOrNode()
const MINIMIZED_OVERLAY_WIDTH_WIDE = 350
const MINIMIZED_OVERLAY_WIDTH_SMALL = 220
const MINIMIZED_EDITOR_HEIGHT = size.button_height + 2 * size.vpad_xs

export function showMinimizedMailEditor(
	dialog: Dialog,
	sendMailModel: SendMailModel,
	viewModel: MinimizedMailEditorViewModel,
	eventController: EventController,
	dispose: () => void,
	saveStatus: Stream<SaveStatus>,
): void {
	let closeOverlayFunction = () => Promise.resolve() // will be assigned with the actual close function when overlay is visible.

	const minimizedEditor = viewModel.minimizeMailEditor(dialog, sendMailModel, dispose, saveStatus, () => closeOverlayFunction())
	// only show overlay once editor is gone
	setTimeout(() => {
		closeOverlayFunction = showMinimizedEditorOverlay(viewModel, minimizedEditor, eventController)
	}, DefaultAnimationTime)
}

function showMinimizedEditorOverlay(
	viewModel: MinimizedMailEditorViewModel,
	minimizedEditor: MinimizedEditor,
	eventController: EventController,
): () => Promise<void> {
	let overlayDom: HTMLElement | null = null

	const resizeListener = () => {
		if (overlayDom) {
			overlayDom.style.transform = `translateY(${px(-getVerticalOverlayPosition())})`
		}
	}

	windowFacade.addResizeListener(resizeListener)
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
		dom => {
			overlayDom = dom
			return transform(TransformEnum.TranslateY, 0, -getVerticalOverlayPosition())
		},
		dom => {
			windowFacade.removeResizeListener(resizeListener)
			return transform(TransformEnum.TranslateY, -getVerticalOverlayPosition(), 0)
		},
		"minimized-shadow",
	)
}

function getVerticalOverlayPosition(): number {
	return (
		MINIMIZED_EDITOR_HEIGHT +
		(styles.isUsingBottomNavigation() // use size.hpad values to keep bottom and right space even
			? size.bottom_nav_bar + size.hpad
			: size.hpad_medium)
	)
}

function getOverlayPosition() {
	return {
		bottom: px(-MINIMIZED_EDITOR_HEIGHT),
		// position will change with translateY
		right: styles.isUsingBottomNavigation() ? px(size.hpad) : px(size.hpad_medium),
		width: px(styles.isSingleColumnLayout() ? MINIMIZED_OVERLAY_WIDTH_SMALL : MINIMIZED_OVERLAY_WIDTH_WIDE),
		zIndex: LayerType.LowPriorityOverlay,
	}
}