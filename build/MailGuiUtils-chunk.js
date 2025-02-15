import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { isApp, isDesktop } from "./Env-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { assertNotNull, endsWith, neverNull, noOp, pMap } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { EncryptionAuthStatus, MailReportType, MailSetKind, MailState, ReportMovedMailsType, SYSTEM_GROUP_MAIL_ADDRESS, getMailFolderType } from "./TutanotaConstants-chunk.js";
import { modal } from "./RootView-chunk.js";
import { size } from "./size-chunk.js";
import { getElementId } from "./EntityUtils-chunk.js";
import { createMail } from "./TypeRefs-chunk.js";
import { LockedError, PreconditionFailedError } from "./RestError-chunk.js";
import { isOfTypeOrSubfolderOf, isSpamOrTrashFolder } from "./MailChecks-chunk.js";
import { ButtonType } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { Dialog, DomRectReadOnlyPolyfilled, Dropdown } from "./Dialog-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { hasValidEncryptionAuthForTeamOrSystemMail } from "./SharedMailUtils-chunk.js";
import { showSnackBar } from "./SnackBar-chunk.js";
import { Checkbox } from "./Checkbox-chunk.js";
import { mailLocator } from "./mailLocator-chunk.js";
import { assertSystemFolderOfType, getFolderName, getIndentedFolderNameForDropdown, getMoveTargetFolderSystems } from "./MailUtils-chunk.js";
import { FontIcons } from "./FontIcons-chunk.js";

//#region src/mail-app/mail/view/MailReportDialog.ts
function confirmMailReportDialog(mailModel, mailboxDetails) {
	return new Promise((resolve) => {
		let shallRememberDecision = false;
		const child = () => mithril_default(Checkbox, {
			label: () => lang.get("rememberDecision_msg"),
			checked: shallRememberDecision,
			onChecked: (v) => shallRememberDecision = v,
			helpLabel: "changeMailSettings_msg"
		});
		async function updateSpamReportSetting(areMailsReported) {
			if (shallRememberDecision) {
				const reportMovedMails = areMailsReported ? ReportMovedMailsType.AUTOMATICALLY_ONLY_SPAM : ReportMovedMailsType.NEVER;
				await mailModel.saveReportMovedMails(mailboxDetails.mailboxGroupRoot, reportMovedMails);
			}
			resolve(areMailsReported);
			dialog.close();
		}
		const yesButton = {
			label: "yes_label",
			click: () => updateSpamReportSetting(true),
			type: ButtonType.Primary
		};
		const noButton = {
			label: "no_label",
			click: () => updateSpamReportSetting(false),
			type: ButtonType.Secondary
		};
		const onclose = () => {
			resolve(false);
		};
		const dialog = Dialog.confirmMultiple(lang.makeTranslation("unencryptedTransmission_msg", lang.get("unencryptedTransmission_msg") + " " + lang.get("allowOperation_msg")), [noButton, yesButton], onclose, child);
	});
}
async function reportMailsAutomatically(mailReportType, mailboxModel, mailModel, mailboxDetails, mails) {
	if (mailReportType !== MailReportType.SPAM) return;
	const mailboxProperties = await mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot);
	let allowUndoing = true;
	let isReportable = false;
	if (!mailboxProperties || mailboxProperties.reportMovedMails === ReportMovedMailsType.ALWAYS_ASK) {
		isReportable = await confirmMailReportDialog(mailModel, mailboxDetails);
		allowUndoing = false;
	} else if (mailboxProperties.reportMovedMails === ReportMovedMailsType.AUTOMATICALLY_ONLY_SPAM) isReportable = true;
else if (mailboxProperties.reportMovedMails === ReportMovedMailsType.NEVER) {}
	if (isReportable) if (allowUndoing) {
		let undoClicked = false;
		showSnackBar({
			message: "undoMailReport_msg",
			button: {
				label: "cancel_action",
				click: () => undoClicked = true
			},
			onClose: () => {
				if (!undoClicked) mailModel.reportMails(mailReportType, mails);
			}
		});
	} else mailModel.reportMails(mailReportType, mails);
}

//#endregion
//#region src/common/gui/PinchZoom.ts
var PinchZoom = class PinchZoom {
	onTouchEndListener = null;
	onTouchStartListener = null;
	onTouchCancelListener = null;
	onTouchMoveListener = null;
	draggingOrZooming = false;
	currentTouchStart = {
		x: 0,
		y: 0,
		startTime: 0
	};
	static DRAG_THRESHOLD = 10;
	pinchTouchIDs = new Set();
	lastPinchTouchPositions = {
		pointer1: {
			x: 0,
			y: 0
		},
		pointer2: {
			x: 0,
			y: 0
		}
	};
	initialZoomablePosition = {
		x: 0,
		y: 0
	};
	initialViewportPosition = {
		x: 0,
		y: 0
	};
	pinchSessionTranslation = {
		x: 0,
		y: 0
	};
	initialZoomableSize = {
		width: 0,
		height: 0
	};
	zoomBoundaries = {
		min: 1,
		max: 3
	};
	currentScale = 1;
	lastDragTouchPosition = null;
	LONG_PRESS_MIN_MS = 400;
	DOUBLE_TAP_TIME_MS = 350;
	SAME_POSITION_RADIUS = 40;
	lastDoubleTapTouchStart = {
		x: 0,
		y: 0
	};
	firstTapTime = 0;
	/**
	* Creates a PinchZoom object and immediately starts recognizing and reacting to zoom, drag and tab gestures.
	* @precondition zoomable.x <= viewport.x && zoomable.y <= viewport.y && zoomable.x2 >= viewport.x2 && zoomable.y2 >= viewport.y2
	* @precondition zoomable must have been rendered already at least once.
	* @param zoomable The HTMLElement that shall be zoomed inside the viewport.
	* @param viewport The HTMLElement in which the zoomable is zoomed and dragged.
	* @param initiallyZoomToViewportWidth If true and the width of the zoomable is bigger than the viewport width, the zoomable is zoomed out to match the viewport __width__ and not the height! the viewport height is adapted to match the zoomed zoomable height (calling PinchZoom.remove() resets the height)
	* @param singleClickAction This function is called whenever a single click on the zoomable is detected, e.g. on a link. Since the PinchZoom class prevents all default actions these clicks need to be handled outside of this class.
	*/
	constructor(zoomable, viewport, initiallyZoomToViewportWidth, singleClickAction) {
		this.zoomable = zoomable;
		this.viewport = viewport;
		this.initiallyZoomToViewportWidth = initiallyZoomToViewportWidth;
		this.singleClickAction = singleClickAction;
		this.viewport.style.overflow = "hidden";
		this.update({
			x: 0,
			y: 0
		});
		this.zoomable.style.touchAction = "pan-y pan-x";
		this.zoomable.style.minWidth = "100%";
		this.zoomable.style.width = "fit-content";
		const initialZoomableCoords = this.getCoords(this.zoomable);
		this.initialZoomableSize = {
			width: this.zoomable.scrollWidth,
			height: this.zoomable.scrollHeight
		};
		this.initialZoomablePosition = {
			x: initialZoomableCoords.x,
			y: initialZoomableCoords.y
		};
		const initialViewportCoords = this.getCoords(this.viewport);
		this.initialViewportPosition = {
			x: initialViewportCoords.x,
			y: initialViewportCoords.y
		};
		this.onTouchEndListener = this.zoomable.ontouchend = (e) => {
			this.removeTouches(e);
			const eventTarget = e.target;
			if (e.touches.length === 0 && e.changedTouches.length === 1) this.handleDoubleTap(e, eventTarget, (e$1, target) => singleClickAction(e$1, target), (e$1) => {
				let scale = 1;
				if (this.currentScale > this.zoomBoundaries.min) scale = this.zoomBoundaries.min;
else scale = (this.zoomBoundaries.min + this.zoomBoundaries.max) / 2;
				const translationAndOrigin = this.calculateSessionsTranslationAndTransformOrigin({
					x: e$1.changedTouches[0].clientX,
					y: e$1.changedTouches[0].clientY
				});
				const newTransformOrigin = this.setCurrentSafePosition(translationAndOrigin.newTransformOrigin, translationAndOrigin.sessionTranslation, this.getCurrentZoomablePositionWithoutTransformation(), scale).newTransformOrigin;
				this.update(newTransformOrigin);
			});
		};
		this.onTouchStartListener = this.zoomable.ontouchstart = (e) => {
			const touch = e.touches[0];
			this.currentTouchStart = {
				x: touch.clientX,
				y: touch.clientY,
				startTime: Date.now()
			};
			if (e.touches.length >= 2) this.draggingOrZooming = true;
			if (e.touches.length === 1) this.lastDragTouchPosition = {
				x: touch.clientX,
				y: touch.clientY
			};
else this.lastDragTouchPosition = null;
		};
		this.onTouchMoveListener = this.zoomable.ontouchmove = (e) => {
			this.touchmove_handler(e);
		};
		this.onTouchCancelListener = this.zoomable.ontouchcancel = (e) => {
			this.removeTouches(e);
		};
		if (this.initiallyZoomToViewportWidth) this.rescale();
	}
	getViewport() {
		return this.viewport;
	}
	getZoomable() {
		return this.zoomable;
	}
	isDraggingOrZooming() {
		return this.draggingOrZooming;
	}
	/**
	* call this method before throwing away the reference to the pinch zoom object
	* changes to the viewport needs to be reverted. Otherwise, future operations would be influenced
	*/
	remove() {
		if (this.onTouchEndListener) this.zoomable.removeEventListener("ontouchend", this.onTouchEndListener);
		if (this.onTouchStartListener) this.zoomable.removeEventListener("ontouchstart", this.onTouchStartListener);
		if (this.onTouchCancelListener) this.zoomable.removeEventListener("ontouchcancel", this.onTouchCancelListener);
		if (this.onTouchMoveListener) this.zoomable.removeEventListener("ontouchmove", this.onTouchMoveListener);
		this.currentScale = this.zoomBoundaries.min;
		this.update({
			x: 0,
			y: 0
		});
		this.viewport.style.height = "auto";
	}
	touchmove_handler(ev) {
		switch (ev.touches.length) {
			case 1:
				this.dragHandling(ev);
				break;
			case 2:
				this.pinchHandling(ev);
				break;
			default: break;
		}
	}
	removeTouches(ev) {
		if (ev.touches.length === 0) this.draggingOrZooming = false;
		this.pinchTouchIDs.clear();
	}
	pointDistance(point1, point2) {
		return Math.round(Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)));
	}
	centerOfPoints(...points) {
		let x = 0;
		let y = 0;
		for (let point of points) {
			x += point.x;
			y += point.y;
		}
		return {
			x: Math.round(x / points.length),
			y: Math.round(y / points.length)
		};
	}
	/**
	* returns the absolute coordinates of the rendered object (includes CSS transformations)
	*/
	getCoords(elem) {
		let box = elem.getBoundingClientRect();
		let body = document.body;
		let docEl = document.documentElement;
		let scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
		let scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
		let clientTop = docEl.clientTop || body.clientTop || 0;
		let clientLeft = docEl.clientLeft || body.clientLeft || 0;
		let top = box.top + scrollTop - clientTop;
		let left = box.left + scrollLeft - clientLeft;
		let bottom = box.bottom + scrollTop - clientTop;
		let right = box.right + scrollLeft - clientLeft;
		return {
			x: left,
			y: top,
			x2: right,
			y2: bottom
		};
	}
	getCurrentlyAppliedTransformOriginOfZoomable() {
		const computedStyle = getComputedStyle(this.zoomable);
		let transformOrigin = computedStyle.transformOrigin;
		let numberPattern = /-?\d+\.?\d*/g;
		let transformOriginValues = transformOrigin.match(numberPattern);
		if (transformOriginValues) return {
			x: Number(transformOriginValues[0]),
			y: Number(transformOriginValues[1])
		};
		return {
			x: 0,
			y: 0
		};
	}
	/**
	* Returns the current position of the original (without CSS transformation) zoomable
	* the transformOrigin is relative to this point
	*/
	getCurrentZoomablePositionWithoutTransformation() {
		let currentScrollOffset = this.getOffsetFromInitialToCurrentViewportPosition();
		return {
			x: this.initialZoomablePosition.x - currentScrollOffset.x,
			y: this.initialZoomablePosition.y - currentScrollOffset.y
		};
	}
	/**
	* Returns the current offset of the viewport compared to the original position. E.g. if the viewport was scrolled this scroll offset is returned.
	**/
	getOffsetFromInitialToCurrentViewportPosition() {
		let currentViewport = this.getCoords(this.viewport);
		return {
			x: this.initialViewportPosition.x - currentViewport.x,
			y: this.initialViewportPosition.y - currentViewport.y
		};
	}
	/**
	* Scales the zoomable to match the viewport width if the zoomable width is bigger.
	*/
	rescale() {
		const containerWidth = this.viewport.offsetWidth;
		if (containerWidth >= this.zoomable.scrollWidth) {
			this.zoomable.style.transform = "";
			this.zoomable.style.marginBottom = "";
		} else {
			const width = this.zoomable.scrollWidth;
			const scale = containerWidth / width;
			this.viewport.style.height = `${this.viewport.scrollHeight * scale}px`;
			this.zoomBoundaries = {
				min: scale,
				max: this.zoomBoundaries.max
			};
			const newTransformOrigin = this.setCurrentSafePosition({
				x: 0,
				y: 0
			}, {
				x: 0,
				y: 0
			}, this.getCurrentZoomablePositionWithoutTransformation(), scale).newTransformOrigin;
			this.update(newTransformOrigin);
		}
	}
	/**
	* Calculate the nw sessionTranslation and transformOrigin dependent on the new finger position for flawless zooming behavior.
	* Dependent on the new position of the fingers the sessionTranslation is calculated so that the transformOrigin is in the center of the touch points
	* The session translation is the offset by which the original/initial zoomable is moved inside the viewport in a non-scaled state, so that when scaling to the current scale factor (this.currentScale) at the
	* calculated transform origin we get the current position and size of the zoomable inside the viewport.
	* The transform origin is the position relative to the original/initial zoomable position (non-scaled) at which we need to zoom in so that we get the current  position and size of the zoomable inside the viewport (with applied session translation).
	* @param absoluteZoomPosition The position in which the user wants to zoom, i.e. the center between the two fingers. This position is relative to the screen coordinates.
	*/
	calculateSessionsTranslationAndTransformOrigin(absoluteZoomPosition) {
		let currentZoomable = this.getCoords(this.zoomable);
		let scrollOffset = this.getOffsetFromInitialToCurrentViewportPosition();
		let transformedInitialZoomable = {
			x: (currentZoomable.x + absoluteZoomPosition.x * (this.currentScale - 1)) / this.currentScale,
			y: (currentZoomable.y + absoluteZoomPosition.y * (this.currentScale - 1)) / this.currentScale
		};
		let sessionTranslation = {
			x: transformedInitialZoomable.x - this.initialZoomablePosition.x + scrollOffset.x,
			y: transformedInitialZoomable.y - this.initialZoomablePosition.y + scrollOffset.y
		};
		let transformOrigin = {
			x: absoluteZoomPosition.x - transformedInitialZoomable.x,
			y: absoluteZoomPosition.y - transformedInitialZoomable.y
		};
		return {
			sessionTranslation,
			newTransformOrigin: transformOrigin
		};
	}
	/**
	* Calculate the transform origin that is needed to the desired targetCoordinates of the zoomable, given the session translation, the targetCoordinates and the scale
	*/
	calculateTransformOriginFromTarget(targetCoordinates, currentZoomablePositionWithoutTransformation, sessionTranslation, scale) {
		return {
			x: (currentZoomablePositionWithoutTransformation.x + sessionTranslation.x - targetCoordinates.x) / (scale - 1),
			y: (currentZoomablePositionWithoutTransformation.y + sessionTranslation.y - targetCoordinates.y) / (scale - 1)
		};
	}
	pinchHandling(ev) {
		this.draggingOrZooming = true;
		let transformOrigin = this.getCurrentlyAppliedTransformOriginOfZoomable();
		let pinchSessionTranslation = this.pinchSessionTranslation;
		const newTouches = !(this.pinchTouchIDs.has(ev.touches[0].identifier) && this.pinchTouchIDs.has(ev.touches[1].identifier));
		if (newTouches) this.lastPinchTouchPositions = {
			pointer1: {
				x: ev.touches[0].clientX,
				y: ev.touches[0].clientY
			},
			pointer2: {
				x: ev.touches[1].clientX,
				y: ev.touches[1].clientY
			}
		};
		const scaleDifference = this.pointDistance({
			x: ev.touches[0].clientX,
			y: ev.touches[0].clientY
		}, {
			x: ev.touches[1].clientX,
			y: ev.touches[1].clientY
		}) / this.pointDistance(this.lastPinchTouchPositions.pointer1, this.lastPinchTouchPositions.pointer2);
		const newAbsoluteScale = this.currentScale + (scaleDifference - 1);
		this.lastPinchTouchPositions = {
			pointer1: {
				x: ev.touches[0].clientX,
				y: ev.touches[0].clientY
			},
			pointer2: {
				x: ev.touches[1].clientX,
				y: ev.touches[1].clientY
			}
		};
		const pinchCenter = this.centerOfPoints({
			x: ev.touches[0].clientX,
			y: ev.touches[0].clientY
		}, {
			x: ev.touches[1].clientX,
			y: ev.touches[1].clientY
		});
		const startedPinchSession = this.calculateSessionsTranslationAndTransformOrigin(pinchCenter);
		transformOrigin = startedPinchSession.newTransformOrigin;
		pinchSessionTranslation = startedPinchSession.sessionTranslation;
		this.pinchTouchIDs = new Set([ev.touches[0].identifier, ev.touches[1].identifier]);
		const newTransformOrigin = this.setCurrentSafePosition(transformOrigin, pinchSessionTranslation, this.getCurrentZoomablePositionWithoutTransformation(), newAbsoluteScale).newTransformOrigin;
		this.update(newTransformOrigin);
	}
	dragHandling(ev) {
		if (this.currentScale > this.zoomBoundaries.min && this.lastDragTouchPosition) {
			if (Math.abs(ev.touches[0].clientX - this.currentTouchStart.x) >= PinchZoom.DRAG_THRESHOLD || Math.abs(ev.touches[0].clientY - this.currentTouchStart.y) >= PinchZoom.DRAG_THRESHOLD) this.draggingOrZooming = true;
			let delta = {
				x: ev.touches[0].clientX - this.lastDragTouchPosition.x,
				y: ev.touches[0].clientY - this.lastDragTouchPosition.y
			};
			this.lastDragTouchPosition = {
				x: ev.touches[0].clientX,
				y: ev.touches[0].clientY
			};
			let currentRect = this.getCoords(this.zoomable);
			let currentOriginalRect = this.getCurrentZoomablePositionWithoutTransformation();
			let newTransformOrigin = {
				x: (currentRect.x + delta.x - (currentOriginalRect.x + this.pinchSessionTranslation.x)) / (1 - this.currentScale),
				y: (currentRect.y + delta.y - (currentOriginalRect.y + this.pinchSessionTranslation.y)) / (1 - this.currentScale)
			};
			let newPinchSessionTranslation = this.pinchSessionTranslation;
			if (this.currentScale === 1) {
				newTransformOrigin = {
					x: 0,
					y: 0
				};
				newPinchSessionTranslation = {
					x: newPinchSessionTranslation.x + delta.x,
					y: newPinchSessionTranslation.y + delta.y
				};
			}
			let result = this.setCurrentSafePosition(newTransformOrigin, newPinchSessionTranslation, this.getCurrentZoomablePositionWithoutTransformation(), this.currentScale);
			if (ev.cancelable && result.verticalTransformationAllowed) ev.preventDefault();
			this.update(result.newTransformOrigin);
		}
	}
	handleDoubleTap(event, target, singleClickAction, doubleClickAction) {
		const now = Date.now();
		const touch = event.changedTouches[0];
		if (!touch || !event.cancelable) return;
		event.preventDefault();
		if (now - this.firstTapTime < this.DOUBLE_TAP_TIME_MS && Math.abs(touch.clientX - this.lastDoubleTapTouchStart.x) < this.SAME_POSITION_RADIUS && Math.abs(touch.clientY - this.lastDoubleTapTouchStart.y) < this.SAME_POSITION_RADIUS) {
			this.firstTapTime = 0;
			doubleClickAction(event);
		} else setTimeout(() => {
			if (this.firstTapTime === now && Math.abs(touch.clientX - this.currentTouchStart.x) < this.SAME_POSITION_RADIUS && Math.abs(touch.clientY - this.currentTouchStart.y) < this.SAME_POSITION_RADIUS) {
				if (now - this.currentTouchStart.startTime < this.LONG_PRESS_MIN_MS) window.getSelection()?.empty();
				singleClickAction(event, target);
			}
		}, this.DOUBLE_TAP_TIME_MS);
		this.lastDoubleTapTouchStart = this.currentTouchStart;
		this.firstTapTime = now;
	}
	/**
	* Applies the current session translation and scale to the zoomable, so it becomes visible.
	*/
	update(newTransformOrigin) {
		this.zoomable.style.transformOrigin = `${newTransformOrigin.x}px ${newTransformOrigin.y}px`;
		this.zoomable.style.transform = `translate3d(${this.pinchSessionTranslation.x}px, ${this.pinchSessionTranslation.y}px, 0) scale(${this.currentScale})`;
	}
	/**
	* Checks whether the zoomable is still in the allowed are (viewport) after applying the transformations
	* if not allowed -> adjust the transformOrigin to keep the transformed zoomable in an allowed state
	* apply changes to sessionTranslation, zoom and transformOrigin
	*/
	setCurrentSafePosition(newTransformOrigin, newPinchSessionTranslation, currentZoomablePositionWithoutTransformation, newScale) {
		this.getOffsetFromInitialToCurrentViewportPosition();
		let currentViewport = this.getCoords(this.viewport);
		let borders = {
			x: currentViewport.x + 1,
			y: currentViewport.y + 1,
			x2: currentViewport.x2 - 1,
			y2: currentViewport.y2 - 1
		};
		newScale = Math.max(this.zoomBoundaries.min, Math.min(this.zoomBoundaries.max, newScale));
		const targetedOutcome = this.simulateTransformation(currentZoomablePositionWithoutTransformation, this.initialZoomableSize.width, this.initialZoomableSize.height, newTransformOrigin, newPinchSessionTranslation, newScale);
		const targetedHeight = targetedOutcome.y2 - targetedOutcome.y;
		const targetedWidth = targetedOutcome.x2 - targetedOutcome.x;
		const horizontal1Allowed = targetedOutcome.x <= borders.x;
		const horizontal2Allowed = targetedOutcome.x2 >= borders.x2;
		const vertical1Allowed = targetedOutcome.y <= borders.y;
		const vertical2Allowed = targetedOutcome.y2 >= borders.y2;
		const horizontalTransformationAllowed = horizontal1Allowed && horizontal2Allowed;
		const verticalTransformationAllowed = vertical1Allowed && vertical2Allowed;
		const targetX = !horizontal1Allowed ? borders.x : !horizontal2Allowed ? borders.x2 - targetedWidth : targetedOutcome.x;
		const targetY = !vertical1Allowed ? borders.y : !vertical2Allowed ? borders.y2 - targetedHeight : targetedOutcome.y;
		if (targetX !== targetedOutcome.x || targetY !== targetedOutcome.y) newTransformOrigin = this.calculateTransformOriginFromTarget({
			x: targetX,
			y: targetY
		}, currentZoomablePositionWithoutTransformation, newPinchSessionTranslation, newScale);
		if (newScale === 1 && this.zoomBoundaries.min === 1) this.pinchSessionTranslation = {
			x: 0,
			y: 0
		};
else this.pinchSessionTranslation = newPinchSessionTranslation;
		this.currentScale = newScale;
		return {
			verticalTransformationAllowed,
			horizontalTransformationAllowed,
			newTransformOrigin
		};
	}
	/**
	* calculate the outcome of the css transformation
	* this is used to check the boundaries before actually applying the transformation
	*/
	simulateTransformation(currentOriginalPosition, originalWidth, originalHeight, transformOrigin, translation, scale) {
		return {
			x: currentOriginalPosition.x + transformOrigin.x - transformOrigin.x * scale + translation.x,
			y: currentOriginalPosition.y + transformOrigin.y - transformOrigin.y * scale + translation.y,
			x2: currentOriginalPosition.x + transformOrigin.x + (originalWidth - transformOrigin.x) * scale + translation.x,
			y2: currentOriginalPosition.y + transformOrigin.y + (originalHeight - transformOrigin.y) * scale + translation.y
		};
	}
};

//#endregion
//#region src/mail-app/mail/view/MailGuiUtils.ts
async function showDeleteConfirmationDialog(mails) {
	let trashMails = [];
	let moveMails$1 = [];
	for (let mail of mails) {
		const folder = mailLocator.mailModel.getMailFolderForMail(mail);
		const folders = await mailLocator.mailModel.getMailboxFoldersForMail(mail);
		if (folders == null) continue;
		const isFinalDelete = folder && isSpamOrTrashFolder(folders, folder);
		if (isFinalDelete) trashMails.push(mail);
else moveMails$1.push(mail);
	}
	let confirmationTextId = null;
	if (trashMails.length > 0) if (moveMails$1.length > 0) confirmationTextId = "finallyDeleteSelectedEmails_msg";
else confirmationTextId = "finallyDeleteEmails_msg";
	if (confirmationTextId != null) return Dialog.confirm(confirmationTextId, "ok_action");
else return Promise.resolve(true);
}
function promptAndDeleteMails(mailModel, mails, onConfirm) {
	return showDeleteConfirmationDialog(mails).then((confirmed) => {
		if (confirmed) {
			onConfirm();
			return mailModel.deleteMails(mails).then(() => true).catch((e) => {
				if (e instanceof PreconditionFailedError || e instanceof LockedError) return Dialog.message("operationStillActive_msg").then(() => false);
else throw e;
			});
		} else return Promise.resolve(false);
	});
}
async function moveMails({ mailboxModel, mailModel, mails, targetMailFolder, isReportable = true }) {
	const details = await mailModel.getMailboxDetailsForMailFolder(targetMailFolder);
	if (details == null || details.mailbox.folders == null) return false;
	const system = await mailModel.getMailboxFoldersForId(details.mailbox.folders._id);
	return mailModel.moveMails(mails, targetMailFolder).then(async () => {
		if (isOfTypeOrSubfolderOf(system, targetMailFolder, MailSetKind.SPAM) && isReportable) {
			const reportableMails = mails.map((mail) => {
				const reportableMail = createMail(mail);
				reportableMail._id = targetMailFolder.isMailSet ? mail._id : [targetMailFolder.mails, getElementId(mail)];
				return reportableMail;
			});
			const mailboxDetails = await mailboxModel.getMailboxDetailsForMailGroup(assertNotNull(targetMailFolder._ownerGroup));
			await reportMailsAutomatically(MailReportType.SPAM, mailboxModel, mailModel, mailboxDetails, reportableMails);
		}
		return true;
	}).catch((e) => {
		if (e instanceof LockedError || e instanceof PreconditionFailedError) return Dialog.message("operationStillActive_msg").then(() => false);
else throw e;
	});
}
function archiveMails(mails) {
	if (mails.length > 0) return mailLocator.mailModel.getMailboxFoldersForMail(mails[0]).then((folders) => {
		if (folders) moveMails({
			mailboxModel: locator.mailboxModel,
			mailModel: mailLocator.mailModel,
			mails,
			targetMailFolder: assertSystemFolderOfType(folders, MailSetKind.ARCHIVE)
		});
	});
else return Promise.resolve();
}
function moveToInbox(mails) {
	if (mails.length > 0) return mailLocator.mailModel.getMailboxFoldersForMail(mails[0]).then((folders) => {
		if (folders) moveMails({
			mailboxModel: locator.mailboxModel,
			mailModel: mailLocator.mailModel,
			mails,
			targetMailFolder: assertSystemFolderOfType(folders, MailSetKind.INBOX)
		});
	});
else return Promise.resolve();
}
function getFolderIconByType(folderType) {
	switch (folderType) {
		case MailSetKind.CUSTOM: return Icons.Folder;
		case MailSetKind.INBOX: return Icons.Inbox;
		case MailSetKind.SENT: return Icons.Send;
		case MailSetKind.TRASH: return Icons.TrashBin;
		case MailSetKind.ARCHIVE: return Icons.Archive;
		case MailSetKind.SPAM: return Icons.Spam;
		case MailSetKind.DRAFT: return Icons.Draft;
		default: return Icons.Folder;
	}
}
function getFolderIcon(folder) {
	return getFolderIconByType(getMailFolderType(folder));
}
function getMailFolderIcon(mail) {
	let folder = mailLocator.mailModel.getMailFolderForMail(mail);
	if (folder) return getFolderIcon(folder);
else return Icons.Folder;
}
function replaceCidsWithInlineImages(dom, inlineImages, onContext) {
	const imageElements = Array.from(dom.querySelectorAll("img[cid]"));
	if (dom.shadowRoot) {
		const shadowImageElements = Array.from(dom.shadowRoot.querySelectorAll("img[cid]"));
		imageElements.push(...shadowImageElements);
	}
	const elementsWithCid = [];
	for (const imageElement of imageElements) {
		const cid = imageElement.getAttribute("cid");
		if (cid) {
			const inlineImage = inlineImages.get(cid);
			if (inlineImage) {
				elementsWithCid.push(imageElement);
				imageElement.setAttribute("src", inlineImage.objectUrl);
				imageElement.classList.remove("tutanota-placeholder");
				if (isApp()) {
					let timeoutId;
					let startCoords;
					imageElement.addEventListener("touchstart", (e) => {
						const touch = e.touches[0];
						if (!touch) return;
						startCoords = {
							x: touch.clientX,
							y: touch.clientY
						};
						if (timeoutId) clearTimeout(timeoutId);
						timeoutId = setTimeout(() => {
							onContext(inlineImage.cid, e, imageElement);
						}, 800);
					});
					imageElement.addEventListener("touchmove", (e) => {
						const touch = e.touches[0];
						if (!touch || !startCoords || !timeoutId) return;
						if (Math.abs(touch.clientX - startCoords.x) > PinchZoom.DRAG_THRESHOLD || Math.abs(touch.clientY - startCoords.y) > PinchZoom.DRAG_THRESHOLD) {
							clearTimeout(timeoutId);
							timeoutId = null;
						}
					});
					imageElement.addEventListener("touchend", () => {
						if (timeoutId) {
							clearTimeout(timeoutId);
							timeoutId = null;
						}
					});
				}
				if (isDesktop()) imageElement.addEventListener("contextmenu", (e) => {
					onContext(inlineImage.cid, e, imageElement);
					e.preventDefault();
				});
			}
		}
	}
	return elementsWithCid;
}
function replaceInlineImagesWithCids(dom) {
	const domClone = dom.cloneNode(true);
	const inlineImages = Array.from(domClone.querySelectorAll("img[cid]"));
	for (const inlineImage of inlineImages) {
		const cid = inlineImage.getAttribute("cid");
		inlineImage.setAttribute("src", "cid:" + (cid || ""));
		inlineImage.removeAttribute("cid");
	}
	return domClone;
}
function createInlineImage(file) {
	const cid = Math.random().toString(30).substring(2);
	file.cid = cid;
	return createInlineImageReference(file, cid);
}
function createInlineImageReference(file, cid) {
	const blob = new Blob([file.data], { type: file.mimeType });
	const objectUrl = URL.createObjectURL(blob);
	return {
		cid,
		objectUrl,
		blob
	};
}
async function loadInlineImages(fileController, attachments, referencedCids) {
	const filesToLoad = getReferencedAttachments(attachments, referencedCids);
	const inlineImages = new Map();
	return pMap(filesToLoad, async (file) => {
		let dataFile = await fileController.getAsDataFile(file);
		const { htmlSanitizer } = await import("./HtmlSanitizer2-chunk.js");
		dataFile = htmlSanitizer.sanitizeInlineAttachment(dataFile);
		const inlineImageReference = createInlineImageReference(dataFile, neverNull(file.cid));
		inlineImages.set(inlineImageReference.cid, inlineImageReference);
	}).then(() => inlineImages);
}
function getReferencedAttachments(attachments, referencedCids) {
	return attachments.filter((file) => referencedCids.find((rcid) => file.cid === rcid));
}
async function showMoveMailsDropdown(mailboxModel, model, origin, mails, opts) {
	const folders = await getMoveTargetFolderSystems(model, mails);
	await showMailFolderDropdown(origin, folders, (f) => moveMails({
		mailboxModel,
		mailModel: model,
		mails,
		targetMailFolder: f.folder
	}), opts);
}
async function showMailFolderDropdown(origin, folders, onClick, opts) {
	const { width = 300, withBackground = false, onSelected = noOp } = opts ?? {};
	if (folders.length === 0) return;
	const folderButtons = folders.map((f) => ({
		label: lang.makeTranslation(`dropdown-folder:${getFolderName(f.folder)}`, lang.get("folderDepth_label", {
			"{folderName}": getFolderName(f.folder),
			"{depth}": f.level
		})),
		text: lang.makeTranslation("folder_name", getIndentedFolderNameForDropdown(f)),
		click: () => {
			onSelected();
			onClick(f);
		},
		icon: getFolderIcon(f.folder)
	}));
	const dropdown = new Dropdown(() => folderButtons, width);
	dropdown.setOrigin(new DomRectReadOnlyPolyfilled(origin.left, origin.top, origin.width, origin.height));
	modal.displayUnique(dropdown, withBackground);
}
function getConversationTitle(conversationViewModel) {
	if (!conversationViewModel.isFinished()) return lang.getTranslation("loading_msg");
	const numberOfEmails = conversationViewModel.conversationItems().length;
	if (numberOfEmails === 1) return lang.getTranslation("oneEmail_label");
else return lang.getTranslation("nbrOrEmails_label", { "{number}": numberOfEmails });
}
function getMoveMailBounds() {
	return new DomRectReadOnlyPolyfilled(size.hpad_large, size.vpad_large, 0, 0);
}
function isTutanotaTeamAddress(address) {
	return endsWith(address, "@tutao.de") || address === "no-reply@tutanota.de";
}
function isTutanotaTeamMail(mail) {
	const { confidential, sender, state } = mail;
	return confidential && state === MailState.RECEIVED && hasValidEncryptionAuthForTeamOrSystemMail(mail) && (sender.address === SYSTEM_GROUP_MAIL_ADDRESS || isTutanotaTeamAddress(sender.address));
}
function getConfidentialIcon(mail) {
	if (!mail.confidential) throw new ProgrammingError("mail is not confidential");
	if (mail.encryptionAuthStatus == EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED || mail.encryptionAuthStatus == EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED || mail.encryptionAuthStatus == EncryptionAuthStatus.TUTACRYPT_SENDER) return Icons.PQLock;
else return Icons.Lock;
}
function getConfidentialFontIcon(mail) {
	const confidentialIcon = getConfidentialIcon(mail);
	return confidentialIcon === Icons.PQLock ? FontIcons.PQConfidential : FontIcons.Confidential;
}
function isMailContrastFixNeeded(editorDom) {
	return Array.from(editorDom.querySelectorAll("*[style]"), (e) => e.style).some((s) => s.color && s.color !== "inherit" || s.backgroundColor && s.backgroundColor !== "inherit") || editorDom.querySelectorAll("font[color]").length > 0;
}

//#endregion
export { PinchZoom, archiveMails, createInlineImage, getConfidentialFontIcon, getConfidentialIcon, getConversationTitle, getFolderIcon, getFolderIconByType, getMailFolderIcon, getMoveMailBounds, getReferencedAttachments, isMailContrastFixNeeded, isTutanotaTeamMail, loadInlineImages, moveMails, moveToInbox, promptAndDeleteMails, replaceCidsWithInlineImages, replaceInlineImagesWithCids, reportMailsAutomatically, showDeleteConfirmationDialog, showMoveMailsDropdown };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbEd1aVV0aWxzLWNodW5rLmpzIiwibmFtZXMiOlsibWFpbE1vZGVsOiBNYWlsTW9kZWwiLCJtYWlsYm94RGV0YWlsczogTWFpbGJveERldGFpbCIsImFyZU1haWxzUmVwb3J0ZWQ6IGJvb2xlYW4iLCJ5ZXNCdXR0b246IEJ1dHRvbkF0dHJzIiwibm9CdXR0b246IEJ1dHRvbkF0dHJzIiwibWFpbFJlcG9ydFR5cGU6IE1haWxSZXBvcnRUeXBlIiwibWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWwiLCJtYWlsczogUmVhZG9ubHlBcnJheTxNYWlsPiIsInpvb21hYmxlOiBIVE1MRWxlbWVudCIsInZpZXdwb3J0OiBIVE1MRWxlbWVudCIsImluaXRpYWxseVpvb21Ub1ZpZXdwb3J0V2lkdGg6IGJvb2xlYW4iLCJzaW5nbGVDbGlja0FjdGlvbjogKGU6IEV2ZW50LCB0YXJnZXQ6IEV2ZW50VGFyZ2V0IHwgbnVsbCkgPT4gdm9pZCIsImUiLCJldjogVG91Y2hFdmVudCIsInBvaW50MTogQ29vcmRpbmF0ZVBhaXIiLCJwb2ludDI6IENvb3JkaW5hdGVQYWlyIiwiZWxlbTogSFRNTEVsZW1lbnQiLCJhYnNvbHV0ZVpvb21Qb3NpdGlvbjogQ29vcmRpbmF0ZVBhaXIiLCJ0YXJnZXRDb29yZGluYXRlczogQ29vcmRpbmF0ZVBhaXIiLCJjdXJyZW50Wm9vbWFibGVQb3NpdGlvbldpdGhvdXRUcmFuc2Zvcm1hdGlvbjogQ29vcmRpbmF0ZVBhaXIiLCJzZXNzaW9uVHJhbnNsYXRpb246IENvb3JkaW5hdGVQYWlyIiwic2NhbGU6IG51bWJlciIsImV2ZW50OiBUb3VjaEV2ZW50IiwidGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGwiLCJzaW5nbGVDbGlja0FjdGlvbjogKGU6IFRvdWNoRXZlbnQsIHRhcmdldDogRXZlbnRUYXJnZXQgfCBudWxsKSA9PiB2b2lkIiwiZG91YmxlQ2xpY2tBY3Rpb246IChlOiBUb3VjaEV2ZW50KSA9PiB2b2lkIiwibmV3VHJhbnNmb3JtT3JpZ2luOiBDb29yZGluYXRlUGFpciIsIm5ld1BpbmNoU2Vzc2lvblRyYW5zbGF0aW9uOiBDb29yZGluYXRlUGFpciIsIm5ld1NjYWxlOiBudW1iZXIiLCJjdXJyZW50T3JpZ2luYWxQb3NpdGlvbjogQ29vcmRpbmF0ZVBhaXIiLCJvcmlnaW5hbFdpZHRoOiBudW1iZXIiLCJvcmlnaW5hbEhlaWdodDogbnVtYmVyIiwidHJhbnNmb3JtT3JpZ2luOiBDb29yZGluYXRlUGFpciIsInRyYW5zbGF0aW9uOiBDb29yZGluYXRlUGFpciIsIm1haWxzOiBSZWFkb25seUFycmF5PE1haWw+IiwidHJhc2hNYWlsczogTWFpbFtdIiwibW92ZU1haWxzOiBNYWlsW10iLCJjb25maXJtYXRpb25UZXh0SWQ6IFRyYW5zbGF0aW9uS2V5IHwgbnVsbCIsIm1vdmVNYWlscyIsIm1haWxNb2RlbDogTWFpbE1vZGVsIiwib25Db25maXJtOiAoKSA9PiB2b2lkIiwibWFpbHM6IE1haWxbXSIsImZvbGRlcnM6IEZvbGRlclN5c3RlbSIsImZvbGRlclR5cGU6IE1haWxTZXRLaW5kIiwiZm9sZGVyOiBNYWlsRm9sZGVyIiwibWFpbDogTWFpbCIsImRvbTogSFRNTEVsZW1lbnQiLCJpbmxpbmVJbWFnZXM6IElubGluZUltYWdlcyIsIm9uQ29udGV4dDogKGNpZDogc3RyaW5nLCBhcmcxOiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCwgYXJnMjogSFRNTEVsZW1lbnQpID0+IHVua25vd24iLCJpbWFnZUVsZW1lbnRzOiBBcnJheTxIVE1MRWxlbWVudD4iLCJzaGFkb3dJbWFnZUVsZW1lbnRzOiBBcnJheTxIVE1MRWxlbWVudD4iLCJlbGVtZW50c1dpdGhDaWQ6IEhUTUxFbGVtZW50W10iLCJ0aW1lb3V0SWQ6IFRpbWVvdXRJRCB8IG51bGwiLCJzdGFydENvb3Jkczpcblx0XHRcdFx0XHRcdHwge1xuXHRcdFx0XHRcdFx0XHRcdHg6IG51bWJlclxuXHRcdFx0XHRcdFx0XHRcdHk6IG51bWJlclxuXHRcdFx0XHRcdFx0ICB9XG5cdFx0XHRcdFx0XHR8IG51bGxcblx0XHRcdFx0XHRcdHwgdW5kZWZpbmVkIiwiZTogVG91Y2hFdmVudCIsImU6IE1vdXNlRXZlbnQiLCJpbmxpbmVJbWFnZXM6IEFycmF5PEhUTUxFbGVtZW50PiIsImZpbGU6IERhdGFGaWxlIiwiY2lkOiBzdHJpbmciLCJmaWxlQ29udHJvbGxlcjogRmlsZUNvbnRyb2xsZXIiLCJhdHRhY2htZW50czogQXJyYXk8VHV0YW5vdGFGaWxlPiIsInJlZmVyZW5jZWRDaWRzOiBBcnJheTxzdHJpbmc+IiwibWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWwiLCJtb2RlbDogTWFpbE1vZGVsIiwib3JpZ2luOiBQb3NSZWN0IiwibWFpbHM6IHJlYWRvbmx5IE1haWxbXSIsIm9wdHM/OiB7IHdpZHRoPzogbnVtYmVyOyB3aXRoQmFja2dyb3VuZD86IGJvb2xlYW47IG9uU2VsZWN0ZWQ/OiAoKSA9PiB1bmtub3duIH0iLCJmb2xkZXJzOiByZWFkb25seSBGb2xkZXJJbmZvW10iLCJvbkNsaWNrOiAoZm9sZGVyOiBJbmRlbnRlZEZvbGRlcikgPT4gdW5rbm93biIsImNvbnZlcnNhdGlvblZpZXdNb2RlbDogQ29udmVyc2F0aW9uVmlld01vZGVsIiwiYWRkcmVzczogc3RyaW5nIiwiZWRpdG9yRG9tOiBQYXJlbnROb2RlIl0sInNvdXJjZXMiOlsiLi4vc3JjL21haWwtYXBwL21haWwvdmlldy9NYWlsUmVwb3J0RGlhbG9nLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvUGluY2hab29tLnRzIiwiLi4vc3JjL21haWwtYXBwL21haWwvdmlldy9NYWlsR3VpVXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBNYWlsLCBNYWlsYm94UHJvcGVydGllcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IENoZWNrYm94IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9DaGVja2JveC5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCBtIGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IE1haWxSZXBvcnRUeXBlLCBSZXBvcnRNb3ZlZE1haWxzVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBCdXR0b25BdHRycywgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB0eXBlIHsgTWFpbGJveERldGFpbCwgTWFpbGJveE1vZGVsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9NYWlsYm94TW9kZWwuanNcIlxuaW1wb3J0IHsgc2hvd1NuYWNrQmFyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9TbmFja0JhclwiXG5pbXBvcnQgeyBNYWlsTW9kZWwgfSBmcm9tIFwiLi4vbW9kZWwvTWFpbE1vZGVsLmpzXCJcblxuZnVuY3Rpb24gY29uZmlybU1haWxSZXBvcnREaWFsb2cobWFpbE1vZGVsOiBNYWlsTW9kZWwsIG1haWxib3hEZXRhaWxzOiBNYWlsYm94RGV0YWlsKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdGxldCBzaGFsbFJlbWVtYmVyRGVjaXNpb24gPSBmYWxzZVxuXHRcdGNvbnN0IGNoaWxkID0gKCkgPT5cblx0XHRcdG0oQ2hlY2tib3gsIHtcblx0XHRcdFx0bGFiZWw6ICgpID0+IGxhbmcuZ2V0KFwicmVtZW1iZXJEZWNpc2lvbl9tc2dcIiksXG5cdFx0XHRcdGNoZWNrZWQ6IHNoYWxsUmVtZW1iZXJEZWNpc2lvbixcblx0XHRcdFx0b25DaGVja2VkOiAodikgPT4gKHNoYWxsUmVtZW1iZXJEZWNpc2lvbiA9IHYpLFxuXHRcdFx0XHRoZWxwTGFiZWw6IFwiY2hhbmdlTWFpbFNldHRpbmdzX21zZ1wiLFxuXHRcdFx0fSlcblxuXHRcdGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVNwYW1SZXBvcnRTZXR0aW5nKGFyZU1haWxzUmVwb3J0ZWQ6IGJvb2xlYW4pIHtcblx0XHRcdGlmIChzaGFsbFJlbWVtYmVyRGVjaXNpb24pIHtcblx0XHRcdFx0Y29uc3QgcmVwb3J0TW92ZWRNYWlscyA9IGFyZU1haWxzUmVwb3J0ZWQgPyBSZXBvcnRNb3ZlZE1haWxzVHlwZS5BVVRPTUFUSUNBTExZX09OTFlfU1BBTSA6IFJlcG9ydE1vdmVkTWFpbHNUeXBlLk5FVkVSXG5cdFx0XHRcdGF3YWl0IG1haWxNb2RlbC5zYXZlUmVwb3J0TW92ZWRNYWlscyhtYWlsYm94RGV0YWlscy5tYWlsYm94R3JvdXBSb290LCByZXBvcnRNb3ZlZE1haWxzKVxuXHRcdFx0fVxuXG5cdFx0XHRyZXNvbHZlKGFyZU1haWxzUmVwb3J0ZWQpXG5cdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdH1cblxuXHRcdGNvbnN0IHllc0J1dHRvbjogQnV0dG9uQXR0cnMgPSB7XG5cdFx0XHRsYWJlbDogXCJ5ZXNfbGFiZWxcIixcblx0XHRcdGNsaWNrOiAoKSA9PiB1cGRhdGVTcGFtUmVwb3J0U2V0dGluZyh0cnVlKSxcblx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHR9XG5cdFx0Y29uc3Qgbm9CdXR0b246IEJ1dHRvbkF0dHJzID0ge1xuXHRcdFx0bGFiZWw6IFwibm9fbGFiZWxcIixcblx0XHRcdGNsaWNrOiAoKSA9PiB1cGRhdGVTcGFtUmVwb3J0U2V0dGluZyhmYWxzZSksXG5cdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHR9XG5cblx0XHQvLyBvbmNsb3NlIGlzIGNhbGxlZCB3aGVuIGRpYWxvZyBpcyBjbG9zZWQgYnkgRVNDIG9yIGJhY2sgYnV0dG9uLiBJbiB0aGlzIGNhc2Ugd2UgZG9uJ3Qgd2FudCB0byByZXBvcnQgc3BhbS5cblx0XHRjb25zdCBvbmNsb3NlID0gKCkgPT4ge1xuXHRcdFx0cmVzb2x2ZShmYWxzZSlcblx0XHR9XG5cblx0XHRjb25zdCBkaWFsb2cgPSBEaWFsb2cuY29uZmlybU11bHRpcGxlKFxuXHRcdFx0bGFuZy5tYWtlVHJhbnNsYXRpb24oXCJ1bmVuY3J5cHRlZFRyYW5zbWlzc2lvbl9tc2dcIiwgbGFuZy5nZXQoXCJ1bmVuY3J5cHRlZFRyYW5zbWlzc2lvbl9tc2dcIikgKyBcIiBcIiArIGxhbmcuZ2V0KFwiYWxsb3dPcGVyYXRpb25fbXNnXCIpKSxcblx0XHRcdFtub0J1dHRvbiwgeWVzQnV0dG9uXSxcblx0XHRcdG9uY2xvc2UsXG5cdFx0XHRjaGlsZCxcblx0XHQpXG5cdH0pXG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHVzZXIgd2FudHMgdG8gcmVwb3J0IG1haWxzIGFzIHNwYW0gd2hlbiB0aGV5IGFyZSBtb3ZlZCB0byB0aGUgc3BhbSBmb2xkZXIgYW5kIHJlcG9ydCB0aGVtLlxuICogTWF5IG9wZW4gYSBkaWFsb2cgZm9yIGNvbmZpcm1hdGlvbiBhbmQgb3RoZXJ3aXNlIHNob3dzIGEgU25hY2tiYXIgYmVmb3JlIHJlcG9ydGluZyB0byB0aGUgc2VydmVyLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVwb3J0TWFpbHNBdXRvbWF0aWNhbGx5KFxuXHRtYWlsUmVwb3J0VHlwZTogTWFpbFJlcG9ydFR5cGUsXG5cdG1haWxib3hNb2RlbDogTWFpbGJveE1vZGVsLFxuXHRtYWlsTW9kZWw6IE1haWxNb2RlbCxcblx0bWFpbGJveERldGFpbHM6IE1haWxib3hEZXRhaWwsXG5cdG1haWxzOiBSZWFkb25seUFycmF5PE1haWw+LFxuKTogUHJvbWlzZTx2b2lkPiB7XG5cdGlmIChtYWlsUmVwb3J0VHlwZSAhPT0gTWFpbFJlcG9ydFR5cGUuU1BBTSkge1xuXHRcdHJldHVyblxuXHR9XG5cblx0Y29uc3QgbWFpbGJveFByb3BlcnRpZXMgPSBhd2FpdCBtYWlsYm94TW9kZWwuZ2V0TWFpbGJveFByb3BlcnRpZXMobWFpbGJveERldGFpbHMubWFpbGJveEdyb3VwUm9vdClcblx0bGV0IGFsbG93VW5kb2luZyA9IHRydWUgLy8gZGVjaWRlcyBpZiBhIHNuYWNrYmFyIGlzIHNob3duIHRvIHByZXZlbnQgdGhlIHNlcnZlciByZXF1ZXN0XG5cblx0bGV0IGlzUmVwb3J0YWJsZSA9IGZhbHNlXG5cblx0aWYgKCFtYWlsYm94UHJvcGVydGllcyB8fCBtYWlsYm94UHJvcGVydGllcy5yZXBvcnRNb3ZlZE1haWxzID09PSBSZXBvcnRNb3ZlZE1haWxzVHlwZS5BTFdBWVNfQVNLKSB7XG5cdFx0aXNSZXBvcnRhYmxlID0gYXdhaXQgY29uZmlybU1haWxSZXBvcnREaWFsb2cobWFpbE1vZGVsLCBtYWlsYm94RGV0YWlscylcblx0XHRhbGxvd1VuZG9pbmcgPSBmYWxzZVxuXHR9IGVsc2UgaWYgKG1haWxib3hQcm9wZXJ0aWVzLnJlcG9ydE1vdmVkTWFpbHMgPT09IFJlcG9ydE1vdmVkTWFpbHNUeXBlLkFVVE9NQVRJQ0FMTFlfT05MWV9TUEFNKSB7XG5cdFx0aXNSZXBvcnRhYmxlID0gdHJ1ZVxuXHR9IGVsc2UgaWYgKG1haWxib3hQcm9wZXJ0aWVzLnJlcG9ydE1vdmVkTWFpbHMgPT09IFJlcG9ydE1vdmVkTWFpbHNUeXBlLk5FVkVSKSB7XG5cdFx0Ly8gbm8gcmVwb3J0XG5cdH1cblxuXHRpZiAoaXNSZXBvcnRhYmxlKSB7XG5cdFx0Ly8gb25seSBzaG93IHRoZSBzbmFja2JhciB0byB1bmRvIHRoZSByZXBvcnQgaWYgdGhlIHVzZXIgd2FzIG5vdCBhc2tlZCBhbHJlYWR5XG5cdFx0aWYgKGFsbG93VW5kb2luZykge1xuXHRcdFx0bGV0IHVuZG9DbGlja2VkID0gZmFsc2Vcblx0XHRcdHNob3dTbmFja0Jhcih7XG5cdFx0XHRcdG1lc3NhZ2U6IFwidW5kb01haWxSZXBvcnRfbXNnXCIsXG5cdFx0XHRcdGJ1dHRvbjoge1xuXHRcdFx0XHRcdGxhYmVsOiBcImNhbmNlbF9hY3Rpb25cIixcblx0XHRcdFx0XHRjbGljazogKCkgPT4gKHVuZG9DbGlja2VkID0gdHJ1ZSksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uQ2xvc2U6ICgpID0+IHtcblx0XHRcdFx0XHRpZiAoIXVuZG9DbGlja2VkKSB7XG5cdFx0XHRcdFx0XHRtYWlsTW9kZWwucmVwb3J0TWFpbHMobWFpbFJlcG9ydFR5cGUsIG1haWxzKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdH0pXG5cdFx0fSBlbHNlIHtcblx0XHRcdG1haWxNb2RlbC5yZXBvcnRNYWlscyhtYWlsUmVwb3J0VHlwZSwgbWFpbHMpXG5cdFx0fVxuXHR9XG59XG4iLCJ0eXBlIENvb3JkaW5hdGVQYWlyID0ge1xuXHR4OiBudW1iZXJcblx0eTogbnVtYmVyXG59XG5cbi8qKlxuICogVGhpcyBjbGFzcyBoYW5kbGVzIHBpbmNoIG9mIGEgZ2l2ZW4gSFRNTEVsZW1lbnQgKHpvb21hYmxlKSBpbnNpZGUgYW5vdGhlciBIVE1MRWxlbWVudCAodmlld3BvcnQpLiBJZiB0aGF0IHpvb21hYmxlIEhUTUxFbGVtZW50IGlzIHpvb21lZCBpbiBpdCBpcyBwb3NzaWJsZSB0byBkcmFnIGl0ICh3aXRoIGEgbmV3IGZpbmdlciBnZXN0dXJlKVxuICogdXAgdG8gdGhlIHZpZXdwb3J0IGJvcmRlcnMuXG4gKiBDZW50ZXIgb2YgdGhlIHpvb20gaXMgYWx3YXlzIHRoZSBjZW50ZXIgb2YgdGhlIGZpbmdlcnMsIGV2ZW4gd2hlbiB0aGVzZSBhcmUgbW92ZWQgZHVyaW5nIHpvb21pbmcuXG4gKiBUaGUgbWF4aW11bSB6b29tIGZhY3RvciBpcyAzLlxuICpcbiAqIFRoaXMgY2xhc3MgYWxzbyBzdXBwb3J0czpcbiAqICogSW5pdGlhbGx5IHpvb21pbmcgb3V0IHRvIG1hdGNoIHRoZSB2aWV3cG9ydCB3aWR0aFxuICogKiBEb3VibGUgdGFwIHRvIHpvb20gaW4gKHdoZW4gbm90IHpvb21lZCBpbikgdG8gaGFsZiBvZiB0aGUgcG9zc2libGUgem9vbSBmYWN0b3JcbiAqICogRG91YmxlIHRhcCB0byB6b29tIG91dCAod2hlbiB6b29tZWQgaW4gYnkgc29tZSBmYWN0b3IpIHRvIHRoZSBtaW5pbWFsIHpvb20gZmFjdG9yXG4gKlxuICogTm90IHN1cHBvcnRlZDpcbiAqICogRHJhZ2dpbmcgd2hpbGUgcGluY2ggem9vbWluZ1xuICogKiBSZXNpemluZyBvZiB0aGUgem9vbWFibGUgSFRNTEVsZW1lbnQuIElmIHRoZSBzaXplIGNoYW5nZXMgaXQgaXMgcmVxdWlyZWQgdG8gY3JlYXRlIGEgbmV3IFBpbmNoWm9vbSBvYmplY3QuXG4gKlxuICogX19JbXBvcnRhbnRfXzpcbiAqICogY2FsbCByZW1vdmUoKSBiZWZvcmUgY3JlYXRpbmcgYSBuZXcgUGluY2hab29tIG9iamVjdCBhbmQgdGhyb3dpbmcgYXdheSB0aGUgcmVmZXJlbmNlIG9mIHRoZSBvbGQgb25lIHRvIGRlcmVnaXN0ZXIgdGhlIGxpc3RlbmVycyFcbiAqL1xuZXhwb3J0IGNsYXNzIFBpbmNoWm9vbSB7XG5cdC8vLyBsaXN0ZW5lclxuXHRwcml2YXRlIHJlYWRvbmx5IG9uVG91Y2hFbmRMaXN0ZW5lcjogRXZlbnRMaXN0ZW5lciB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgcmVhZG9ubHkgb25Ub3VjaFN0YXJ0TGlzdGVuZXI6IEV2ZW50TGlzdGVuZXIgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHJlYWRvbmx5IG9uVG91Y2hDYW5jZWxMaXN0ZW5lcjogRXZlbnRMaXN0ZW5lciB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgcmVhZG9ubHkgb25Ub3VjaE1vdmVMaXN0ZW5lcjogRXZlbnRMaXN0ZW5lciB8IG51bGwgPSBudWxsXG5cblx0Ly8vIHByb3ZpZGUgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHBpbmNoIHpvb20gb2JqZWN0IGZvciBleHRlcm5hbCBhY2Nlc3Ncblx0cHJpdmF0ZSBkcmFnZ2luZ09yWm9vbWluZzogYm9vbGVhbiA9IGZhbHNlXG5cdHByaXZhdGUgY3VycmVudFRvdWNoU3RhcnQ6IHtcblx0XHR4OiBudW1iZXJcblx0XHR5OiBudW1iZXJcblx0XHRzdGFydFRpbWU6IG51bWJlclxuXHR9ID0geyB4OiAwLCB5OiAwLCBzdGFydFRpbWU6IDAgfVxuXHQvLyBkcmFnZ2luZyBiZWxvdyB0aGlzIHRocmVzaG9sZCBpcyBub3QgY29uc2lkZXJlZCBkcmFnZ2luZywgYnV0IG5vaXNlXG5cdHN0YXRpYyBEUkFHX1RIUkVTSE9MRCA9IDEwXG5cblx0Ly8vIHpvb21pbmdcblx0cHJpdmF0ZSBwaW5jaFRvdWNoSURzOiBTZXQ8bnVtYmVyPiA9IG5ldyBTZXQ8bnVtYmVyPigpXG5cdHByaXZhdGUgbGFzdFBpbmNoVG91Y2hQb3NpdGlvbnM6IHsgcG9pbnRlcjE6IENvb3JkaW5hdGVQYWlyOyBwb2ludGVyMjogQ29vcmRpbmF0ZVBhaXIgfSA9IHsgcG9pbnRlcjE6IHsgeDogMCwgeTogMCB9LCBwb2ludGVyMjogeyB4OiAwLCB5OiAwIH0gfVxuXHRwcml2YXRlIGluaXRpYWxab29tYWJsZVBvc2l0aW9uID0geyB4OiAwLCB5OiAwIH1cblx0cHJpdmF0ZSBpbml0aWFsVmlld3BvcnRQb3NpdGlvbiA9IHsgeDogMCwgeTogMCB9XG5cdHByaXZhdGUgcGluY2hTZXNzaW9uVHJhbnNsYXRpb246IENvb3JkaW5hdGVQYWlyID0geyB4OiAwLCB5OiAwIH1cblx0cHJpdmF0ZSBpbml0aWFsWm9vbWFibGVTaXplID0geyB3aWR0aDogMCwgaGVpZ2h0OiAwIH1cblx0cHJpdmF0ZSB6b29tQm91bmRhcmllcyA9IHsgbWluOiAxLCBtYXg6IDMgfVxuXHQvLyB2YWx1ZXMgb2YgdGhpcyB2YXJpYWJsZSBzaG91bGQgb25seSBiZSB0aGUgcmVzdWx0IG9mIHRoZSBjYWxjdWxhdGVTYWZlU2NhbGVWYWx1ZSBmdW5jdGlvbiAoZXhjZXB0IGZyb20gdGhlIGluaXRpYWwgdmFsdWUgdGhlIHZhbHVlIG11c3QgbmV2ZXIgYmUgMSBkdWUgdG8gZGl2aXNpb24gYnkgMS1zY2FsZSkuIE5ldmVyIHNldCB2YWx1ZXMgZGlyZWN0bHkhXG5cdHByaXZhdGUgY3VycmVudFNjYWxlID0gMVxuXG5cdC8vLyBkcmFnZ2luZ1xuXHQvLyBudWxsIGlmIHRoZXJlIHdhcyBubyBwcmV2aW91cyB0b3VjaCBwb3NpdGlvbiByZWxhdGVkIHRvIGRyYWdnaW5nXG5cdHByaXZhdGUgbGFzdERyYWdUb3VjaFBvc2l0aW9uOiBDb29yZGluYXRlUGFpciB8IG51bGwgPSBudWxsXG5cblx0Ly8gQXBwbGUgY29uc2lkZXJzIHRoYXQgYSBwcmVzcyBldmVudCBpcyBhIGxvbmcgcHJlc3MgYWZ0ZXIgNTAwbXNcblx0Ly8gR29vZ2xlIGNvbnNpZGVycyBhZnRlciA0MDBtc1xuXHQvLyBodHRwczovL2RldmVsb3Blci5hcHBsZS5jb20vZG9jdW1lbnRhdGlvbi91aWtpdC91aWxvbmdwcmVzc2dlc3R1cmVyZWNvZ25pemVyLzE2MTY0MjMtbWluaW11bXByZXNzZHVyYXRpb25cblx0Ly8gaHR0cHM6Ly9hbmRyb2lkLmdvb2dsZXNvdXJjZS5jb20vcGxhdGZvcm0vZnJhbWV3b3Jrcy9iYXNlLysvbWFzdGVyL2NvcmUvamF2YS9hbmRyb2lkL3ZpZXcvVmlld0NvbmZpZ3VyYXRpb24uamF2YVxuXHRwcml2YXRlIHJlYWRvbmx5IExPTkdfUFJFU1NfTUlOX01TID0gNDAwXG5cblx0Ly8vIGRvdWJsZSB0YXBcblx0Ly8gVHdvIGNvbnNlY3V0aXZlIHRhcHMgYXJlIHJlY29nbml6ZWQgYXMgZG91YmxlIHRhcCBpZiB0aGV5IG9jY3VyIHdpdGhpbiB0aGlzIHRpbWUgc3BhblxuXHRwcml2YXRlIERPVUJMRV9UQVBfVElNRV9NUyA9IDM1MFxuXHQvLyB0aGUgcmFkaXVzIGluIHdoaWNoIHdlIHJlY29nbml6ZSBhIHNlY29uZCB0YXAgb3Igc2luZ2xlIGNsaWNrIChhbmQgbm90IGRyYWcpXG5cdHByaXZhdGUgU0FNRV9QT1NJVElPTl9SQURJVVMgPSA0MFxuXHRwcml2YXRlIGxhc3REb3VibGVUYXBUb3VjaFN0YXJ0OiB7XG5cdFx0eDogbnVtYmVyXG5cdFx0eTogbnVtYmVyXG5cdH0gPSB7IHg6IDAsIHk6IDAgfVxuXHRwcml2YXRlIGZpcnN0VGFwVGltZSA9IDBcblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIFBpbmNoWm9vbSBvYmplY3QgYW5kIGltbWVkaWF0ZWx5IHN0YXJ0cyByZWNvZ25pemluZyBhbmQgcmVhY3RpbmcgdG8gem9vbSwgZHJhZyBhbmQgdGFiIGdlc3R1cmVzLlxuXHQgKiBAcHJlY29uZGl0aW9uIHpvb21hYmxlLnggPD0gdmlld3BvcnQueCAmJiB6b29tYWJsZS55IDw9IHZpZXdwb3J0LnkgJiYgem9vbWFibGUueDIgPj0gdmlld3BvcnQueDIgJiYgem9vbWFibGUueTIgPj0gdmlld3BvcnQueTJcblx0ICogQHByZWNvbmRpdGlvbiB6b29tYWJsZSBtdXN0IGhhdmUgYmVlbiByZW5kZXJlZCBhbHJlYWR5IGF0IGxlYXN0IG9uY2UuXG5cdCAqIEBwYXJhbSB6b29tYWJsZSBUaGUgSFRNTEVsZW1lbnQgdGhhdCBzaGFsbCBiZSB6b29tZWQgaW5zaWRlIHRoZSB2aWV3cG9ydC5cblx0ICogQHBhcmFtIHZpZXdwb3J0IFRoZSBIVE1MRWxlbWVudCBpbiB3aGljaCB0aGUgem9vbWFibGUgaXMgem9vbWVkIGFuZCBkcmFnZ2VkLlxuXHQgKiBAcGFyYW0gaW5pdGlhbGx5Wm9vbVRvVmlld3BvcnRXaWR0aCBJZiB0cnVlIGFuZCB0aGUgd2lkdGggb2YgdGhlIHpvb21hYmxlIGlzIGJpZ2dlciB0aGFuIHRoZSB2aWV3cG9ydCB3aWR0aCwgdGhlIHpvb21hYmxlIGlzIHpvb21lZCBvdXQgdG8gbWF0Y2ggdGhlIHZpZXdwb3J0IF9fd2lkdGhfXyBhbmQgbm90IHRoZSBoZWlnaHQhIHRoZSB2aWV3cG9ydCBoZWlnaHQgaXMgYWRhcHRlZCB0byBtYXRjaCB0aGUgem9vbWVkIHpvb21hYmxlIGhlaWdodCAoY2FsbGluZyBQaW5jaFpvb20ucmVtb3ZlKCkgcmVzZXRzIHRoZSBoZWlnaHQpXG5cdCAqIEBwYXJhbSBzaW5nbGVDbGlja0FjdGlvbiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuZXZlciBhIHNpbmdsZSBjbGljayBvbiB0aGUgem9vbWFibGUgaXMgZGV0ZWN0ZWQsIGUuZy4gb24gYSBsaW5rLiBTaW5jZSB0aGUgUGluY2hab29tIGNsYXNzIHByZXZlbnRzIGFsbCBkZWZhdWx0IGFjdGlvbnMgdGhlc2UgY2xpY2tzIG5lZWQgdG8gYmUgaGFuZGxlZCBvdXRzaWRlIG9mIHRoaXMgY2xhc3MuXG5cdCAqL1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IHpvb21hYmxlOiBIVE1MRWxlbWVudCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IHZpZXdwb3J0OiBIVE1MRWxlbWVudCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGluaXRpYWxseVpvb21Ub1ZpZXdwb3J0V2lkdGg6IGJvb2xlYW4sXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzaW5nbGVDbGlja0FjdGlvbjogKGU6IEV2ZW50LCB0YXJnZXQ6IEV2ZW50VGFyZ2V0IHwgbnVsbCkgPT4gdm9pZCxcblx0KSB7XG5cdFx0dGhpcy52aWV3cG9ydC5zdHlsZS5vdmVyZmxvdyA9IFwiaGlkZGVuXCIgLy8gZGlzYWJsZSBkZWZhdWx0IHNjcm9sbCBiZWhhdmlvclxuXHRcdHRoaXMudXBkYXRlKHsgeDogMCwgeTogMCB9KSAvLyB0cmFuc2Zvcm0gb3JpZ2luIG5lZWRzIHRvIGJlIGluaXRpYWxseSBzZXQuIGNhbiBsZWFkIHRvIHdyb25nIHRyYW5zZm9ybSBvcmlnaW5zIG90aGVyd2lzZVxuXHRcdHRoaXMuem9vbWFibGUuc3R5bGUudG91Y2hBY3Rpb24gPSBcInBhbi15IHBhbi14XCIgLy8gbWFrZXMgem9vbWluZyBzbW9vdGhcblx0XHR0aGlzLnpvb21hYmxlLnN0eWxlLm1pbldpZHRoID0gXCIxMDAlXCIgLy8gZm9yIGNvcnJlY3Qgem9vbWluZyBiZWhhdmlvciB0aGUgY29udGVudCBvZiB0aGUgem9vbWFibGUgc2hvdWxkIG1hdGNoIHRoZSB6b29tYWJsZVxuXHRcdHRoaXMuem9vbWFibGUuc3R5bGUud2lkdGggPSBcImZpdC1jb250ZW50XCIgLy8gcHJldmVudHMgb3ZlcmZsb3dpbmcgaXNzdWVzXG5cblx0XHRjb25zdCBpbml0aWFsWm9vbWFibGVDb29yZHMgPSB0aGlzLmdldENvb3Jkcyh0aGlzLnpvb21hYmxlKSAvLyBhbHJlYWR5IG5lZWRzIHRvIGJlIHJlbmRlcmVkXG5cdFx0Ly8gdGhlIGNvbnRlbnQgb2YgdGhlIHpvb21hYmxlIHJlY3QgY2FuIGJlIGJpZ2dlciB0aGFuIHRoZSByZWN0IGl0c2VsZiBkdWUgdG8gb3ZlcmZsb3dcblx0XHR0aGlzLmluaXRpYWxab29tYWJsZVNpemUgPSB7XG5cdFx0XHR3aWR0aDogdGhpcy56b29tYWJsZS5zY3JvbGxXaWR0aCxcblx0XHRcdGhlaWdodDogdGhpcy56b29tYWJsZS5zY3JvbGxIZWlnaHQsXG5cdFx0fVxuXHRcdHRoaXMuaW5pdGlhbFpvb21hYmxlUG9zaXRpb24gPSB7IHg6IGluaXRpYWxab29tYWJsZUNvb3Jkcy54LCB5OiBpbml0aWFsWm9vbWFibGVDb29yZHMueSB9XG5cblx0XHRjb25zdCBpbml0aWFsVmlld3BvcnRDb29yZHMgPSB0aGlzLmdldENvb3Jkcyh0aGlzLnZpZXdwb3J0KVxuXHRcdHRoaXMuaW5pdGlhbFZpZXdwb3J0UG9zaXRpb24gPSB7IHg6IGluaXRpYWxWaWV3cG9ydENvb3Jkcy54LCB5OiBpbml0aWFsVmlld3BvcnRDb29yZHMueSB9XG5cblx0XHQvLyBmb3IgdGhlIGRvdWJsZSB0YXBcblx0XHR0aGlzLm9uVG91Y2hFbmRMaXN0ZW5lciA9IHRoaXMuem9vbWFibGUub250b3VjaGVuZCA9IChlKSA9PiB7XG5cdFx0XHR0aGlzLnJlbW92ZVRvdWNoZXMoZSlcblx0XHRcdGNvbnN0IGV2ZW50VGFyZ2V0ID0gZS50YXJnZXQgLy8gaXQgaXMgbmVjZXNzYXJ5IHRvIHNhdmUgdGhlIHRhcmdldCBiZWNhdXNlIG90aGVyd2lzZSBpdCBjaGFuZ2VzIGFuZCBpcyBub3QgYWNjdXJhdGUgYW55bW9yZSBhZnRlciB0aGUgYnViYmxpbmcgcGhhc2Vcblx0XHRcdGlmIChlLnRvdWNoZXMubGVuZ3RoID09PSAwICYmIGUuY2hhbmdlZFRvdWNoZXMubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRcdC8vTEFURVI6IHdoZW4gcGluY2hpbmcgYW5kIHRoZW4gcmlnaHQgYWZ0ZXIgbGVhdmluZyB0aGUgZGlzcGxheSB0YXAgYWdhaW4gLT4gZG91YmxlIHRhcCAoaWYgZXZhbHVhdGVzIHRvIHRydWUgYmVjYXVzZSBvZiB0aGUgbGFzdCBmaW5nZXIgbGVhdmluZyB0aGUgZGlzcGxheSBhZnRlciBwaW5jaGluZylcblx0XHRcdFx0dGhpcy5oYW5kbGVEb3VibGVUYXAoXG5cdFx0XHRcdFx0ZSxcblx0XHRcdFx0XHRldmVudFRhcmdldCxcblx0XHRcdFx0XHQoZSwgdGFyZ2V0KSA9PiBzaW5nbGVDbGlja0FjdGlvbihlLCB0YXJnZXQpLFxuXHRcdFx0XHRcdChlKSA9PiB7XG5cdFx0XHRcdFx0XHRsZXQgc2NhbGUgPSAxXG5cdFx0XHRcdFx0XHRpZiAodGhpcy5jdXJyZW50U2NhbGUgPiB0aGlzLnpvb21Cb3VuZGFyaWVzLm1pbikge1xuXHRcdFx0XHRcdFx0XHRzY2FsZSA9IHRoaXMuem9vbUJvdW5kYXJpZXMubWluIC8vIHpvb20gb3V0XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRzY2FsZSA9ICh0aGlzLnpvb21Cb3VuZGFyaWVzLm1pbiArIHRoaXMuem9vbUJvdW5kYXJpZXMubWF4KSAvIDJcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvbnN0IHRyYW5zbGF0aW9uQW5kT3JpZ2luID0gdGhpcy5jYWxjdWxhdGVTZXNzaW9uc1RyYW5zbGF0aW9uQW5kVHJhbnNmb3JtT3JpZ2luKHtcblx0XHRcdFx0XHRcdFx0eDogZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRYLFxuXHRcdFx0XHRcdFx0XHR5OiBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFksXG5cdFx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdFx0XHRjb25zdCBuZXdUcmFuc2Zvcm1PcmlnaW4gPSB0aGlzLnNldEN1cnJlbnRTYWZlUG9zaXRpb24oXG5cdFx0XHRcdFx0XHRcdHRyYW5zbGF0aW9uQW5kT3JpZ2luLm5ld1RyYW5zZm9ybU9yaWdpbixcblx0XHRcdFx0XHRcdFx0dHJhbnNsYXRpb25BbmRPcmlnaW4uc2Vzc2lvblRyYW5zbGF0aW9uLFxuXHRcdFx0XHRcdFx0XHR0aGlzLmdldEN1cnJlbnRab29tYWJsZVBvc2l0aW9uV2l0aG91dFRyYW5zZm9ybWF0aW9uKCksXG5cdFx0XHRcdFx0XHRcdHNjYWxlLFxuXHRcdFx0XHRcdFx0KS5uZXdUcmFuc2Zvcm1PcmlnaW5cblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlKG5ld1RyYW5zZm9ybU9yaWdpbilcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHQpXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMub25Ub3VjaFN0YXJ0TGlzdGVuZXIgPSB0aGlzLnpvb21hYmxlLm9udG91Y2hzdGFydCA9IChlKSA9PiB7XG5cdFx0XHRjb25zdCB0b3VjaCA9IGUudG91Y2hlc1swXVxuXG5cdFx0XHR0aGlzLmN1cnJlbnRUb3VjaFN0YXJ0ID0geyB4OiB0b3VjaC5jbGllbnRYLCB5OiB0b3VjaC5jbGllbnRZLCBzdGFydFRpbWU6IERhdGUubm93KCkgfVxuXG5cdFx0XHRpZiAoZS50b3VjaGVzLmxlbmd0aCA+PSAyKSB7XG5cdFx0XHRcdHRoaXMuZHJhZ2dpbmdPclpvb21pbmcgPSB0cnVlXG5cdFx0XHR9XG5cblx0XHRcdGlmIChlLnRvdWNoZXMubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRcdHRoaXMubGFzdERyYWdUb3VjaFBvc2l0aW9uID0geyB4OiB0b3VjaC5jbGllbnRYLCB5OiB0b3VjaC5jbGllbnRZIH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMubGFzdERyYWdUb3VjaFBvc2l0aW9uID0gbnVsbFxuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLm9uVG91Y2hNb3ZlTGlzdGVuZXIgPSB0aGlzLnpvb21hYmxlLm9udG91Y2htb3ZlID0gKGUpID0+IHtcblx0XHRcdHRoaXMudG91Y2htb3ZlX2hhbmRsZXIoZSlcblx0XHR9XG5cdFx0dGhpcy5vblRvdWNoQ2FuY2VsTGlzdGVuZXIgPSB0aGlzLnpvb21hYmxlLm9udG91Y2hjYW5jZWwgPSAoZSkgPT4ge1xuXHRcdFx0dGhpcy5yZW1vdmVUb3VjaGVzKGUpXG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuaW5pdGlhbGx5Wm9vbVRvVmlld3BvcnRXaWR0aCkge1xuXHRcdFx0dGhpcy5yZXNjYWxlKClcblx0XHR9XG5cdH1cblxuXHRnZXRWaWV3cG9ydCgpIHtcblx0XHRyZXR1cm4gdGhpcy52aWV3cG9ydFxuXHR9XG5cblx0Z2V0Wm9vbWFibGUoKSB7XG5cdFx0cmV0dXJuIHRoaXMuem9vbWFibGVcblx0fVxuXG5cdGlzRHJhZ2dpbmdPclpvb21pbmcoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZHJhZ2dpbmdPclpvb21pbmdcblx0fVxuXG5cdC8qKlxuXHQgKiBjYWxsIHRoaXMgbWV0aG9kIGJlZm9yZSB0aHJvd2luZyBhd2F5IHRoZSByZWZlcmVuY2UgdG8gdGhlIHBpbmNoIHpvb20gb2JqZWN0XG5cdCAqIGNoYW5nZXMgdG8gdGhlIHZpZXdwb3J0IG5lZWRzIHRvIGJlIHJldmVydGVkLiBPdGhlcndpc2UsIGZ1dHVyZSBvcGVyYXRpb25zIHdvdWxkIGJlIGluZmx1ZW5jZWRcblx0ICovXG5cdHJlbW92ZSgpIHtcblx0XHRpZiAodGhpcy5vblRvdWNoRW5kTGlzdGVuZXIpIHtcblx0XHRcdHRoaXMuem9vbWFibGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm9udG91Y2hlbmRcIiwgdGhpcy5vblRvdWNoRW5kTGlzdGVuZXIpXG5cdFx0fVxuXHRcdGlmICh0aGlzLm9uVG91Y2hTdGFydExpc3RlbmVyKSB7XG5cdFx0XHR0aGlzLnpvb21hYmxlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJvbnRvdWNoc3RhcnRcIiwgdGhpcy5vblRvdWNoU3RhcnRMaXN0ZW5lcilcblx0XHR9XG5cdFx0aWYgKHRoaXMub25Ub3VjaENhbmNlbExpc3RlbmVyKSB7XG5cdFx0XHR0aGlzLnpvb21hYmxlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJvbnRvdWNoY2FuY2VsXCIsIHRoaXMub25Ub3VjaENhbmNlbExpc3RlbmVyKVxuXHRcdH1cblx0XHRpZiAodGhpcy5vblRvdWNoTW92ZUxpc3RlbmVyKSB7XG5cdFx0XHR0aGlzLnpvb21hYmxlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJvbnRvdWNobW92ZVwiLCB0aGlzLm9uVG91Y2hNb3ZlTGlzdGVuZXIpXG5cdFx0fVxuXHRcdHRoaXMuY3VycmVudFNjYWxlID0gdGhpcy56b29tQm91bmRhcmllcy5taW5cblx0XHR0aGlzLnVwZGF0ZSh7IHg6IDAsIHk6IDAgfSlcblx0XHR0aGlzLnZpZXdwb3J0LnN0eWxlLmhlaWdodCA9IFwiYXV0b1wiXG5cdH1cblxuXHRwcml2YXRlIHRvdWNobW92ZV9oYW5kbGVyKGV2OiBUb3VjaEV2ZW50KSB7XG5cdFx0c3dpdGNoIChldi50b3VjaGVzLmxlbmd0aCkge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0aGlzLmRyYWdIYW5kbGluZyhldilcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGhpcy5waW5jaEhhbmRsaW5nKGV2KVxuXHRcdFx0XHRicmVha1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbW92ZVRvdWNoZXMoZXY6IFRvdWNoRXZlbnQpIHtcblx0XHRpZiAoZXYudG91Y2hlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdHRoaXMuZHJhZ2dpbmdPclpvb21pbmcgPSBmYWxzZVxuXHRcdH1cblx0XHR0aGlzLnBpbmNoVG91Y2hJRHMuY2xlYXIoKVxuXHR9XG5cblx0cHJpdmF0ZSBwb2ludERpc3RhbmNlKHBvaW50MTogQ29vcmRpbmF0ZVBhaXIsIHBvaW50MjogQ29vcmRpbmF0ZVBhaXIpOiBudW1iZXIge1xuXHRcdHJldHVybiBNYXRoLnJvdW5kKE1hdGguc3FydChNYXRoLnBvdyhwb2ludDIueCAtIHBvaW50MS54LCAyKSArIE1hdGgucG93KHBvaW50Mi55IC0gcG9pbnQxLnksIDIpKSlcblx0fVxuXG5cdHByaXZhdGUgY2VudGVyT2ZQb2ludHMoLi4ucG9pbnRzOiBDb29yZGluYXRlUGFpcltdKTogQ29vcmRpbmF0ZVBhaXIge1xuXHRcdGxldCB4ID0gMFxuXHRcdGxldCB5ID0gMFxuXHRcdGZvciAobGV0IHBvaW50IG9mIHBvaW50cykge1xuXHRcdFx0eCArPSBwb2ludC54XG5cdFx0XHR5ICs9IHBvaW50Lnlcblx0XHR9XG5cdFx0cmV0dXJuIHsgeDogTWF0aC5yb3VuZCh4IC8gcG9pbnRzLmxlbmd0aCksIHk6IE1hdGgucm91bmQoeSAvIHBvaW50cy5sZW5ndGgpIH1cblx0fVxuXG5cdC8qKlxuXHQgKiByZXR1cm5zIHRoZSBhYnNvbHV0ZSBjb29yZGluYXRlcyBvZiB0aGUgcmVuZGVyZWQgb2JqZWN0IChpbmNsdWRlcyBDU1MgdHJhbnNmb3JtYXRpb25zKVxuXHQgKi9cblx0cHJpdmF0ZSBnZXRDb29yZHMoZWxlbTogSFRNTEVsZW1lbnQpIHtcblx0XHQvLyBjcm9zc2Jyb3dzZXIgdmVyc2lvblxuXHRcdGxldCBib3ggPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cblx0XHRsZXQgYm9keSA9IGRvY3VtZW50LmJvZHlcblx0XHRsZXQgZG9jRWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcblxuXHRcdGxldCBzY3JvbGxUb3AgPSB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jRWwuc2Nyb2xsVG9wIHx8IGJvZHkuc2Nyb2xsVG9wXG5cdFx0bGV0IHNjcm9sbExlZnQgPSB3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jRWwuc2Nyb2xsTGVmdCB8fCBib2R5LnNjcm9sbExlZnRcblxuXHRcdGxldCBjbGllbnRUb3AgPSBkb2NFbC5jbGllbnRUb3AgfHwgYm9keS5jbGllbnRUb3AgfHwgMFxuXHRcdGxldCBjbGllbnRMZWZ0ID0gZG9jRWwuY2xpZW50TGVmdCB8fCBib2R5LmNsaWVudExlZnQgfHwgMFxuXG5cdFx0bGV0IHRvcCA9IGJveC50b3AgKyBzY3JvbGxUb3AgLSBjbGllbnRUb3Bcblx0XHRsZXQgbGVmdCA9IGJveC5sZWZ0ICsgc2Nyb2xsTGVmdCAtIGNsaWVudExlZnRcblx0XHRsZXQgYm90dG9tID0gYm94LmJvdHRvbSArIHNjcm9sbFRvcCAtIGNsaWVudFRvcFxuXHRcdGxldCByaWdodCA9IGJveC5yaWdodCArIHNjcm9sbExlZnQgLSBjbGllbnRMZWZ0XG5cblx0XHQvLyByZXR1cm4geyB4OiBNYXRoLnJvdW5kKGxlZnQpLCB5OiBNYXRoLnJvdW5kKHRvcCksIHgyOiBNYXRoLnJvdW5kKHJpZ2h0KSwgeTI6IE1hdGgucm91bmQoYm90dG9tKSB9XG5cdFx0cmV0dXJuIHsgeDogbGVmdCwgeTogdG9wLCB4MjogcmlnaHQsIHkyOiBib3R0b20gfVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRDdXJyZW50bHlBcHBsaWVkVHJhbnNmb3JtT3JpZ2luT2Zab29tYWJsZSgpOiBDb29yZGluYXRlUGFpciB7XG5cdFx0Y29uc3QgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodGhpcy56b29tYWJsZSlcblx0XHRsZXQgdHJhbnNmb3JtT3JpZ2luID0gY29tcHV0ZWRTdHlsZS50cmFuc2Zvcm1PcmlnaW5cblxuXHRcdGxldCBudW1iZXJQYXR0ZXJuID0gLy0/XFxkK1xcLj9cXGQqL2dcblx0XHRsZXQgdHJhbnNmb3JtT3JpZ2luVmFsdWVzID0gdHJhbnNmb3JtT3JpZ2luLm1hdGNoKG51bWJlclBhdHRlcm4pIC8vcmVsYXRpdmVcblx0XHRpZiAodHJhbnNmb3JtT3JpZ2luVmFsdWVzKSB7XG5cdFx0XHRyZXR1cm4geyB4OiBOdW1iZXIodHJhbnNmb3JtT3JpZ2luVmFsdWVzWzBdKSwgeTogTnVtYmVyKHRyYW5zZm9ybU9yaWdpblZhbHVlc1sxXSkgfVxuXHRcdH1cblx0XHRyZXR1cm4geyB4OiAwLCB5OiAwIH1cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHBvc2l0aW9uIG9mIHRoZSBvcmlnaW5hbCAod2l0aG91dCBDU1MgdHJhbnNmb3JtYXRpb24pIHpvb21hYmxlXG5cdCAqIHRoZSB0cmFuc2Zvcm1PcmlnaW4gaXMgcmVsYXRpdmUgdG8gdGhpcyBwb2ludFxuXHQgKi9cblx0cHJpdmF0ZSBnZXRDdXJyZW50Wm9vbWFibGVQb3NpdGlvbldpdGhvdXRUcmFuc2Zvcm1hdGlvbigpIHtcblx0XHRsZXQgY3VycmVudFNjcm9sbE9mZnNldCA9IHRoaXMuZ2V0T2Zmc2V0RnJvbUluaXRpYWxUb0N1cnJlbnRWaWV3cG9ydFBvc2l0aW9uKClcblx0XHRyZXR1cm4ge1xuXHRcdFx0eDogdGhpcy5pbml0aWFsWm9vbWFibGVQb3NpdGlvbi54IC0gY3VycmVudFNjcm9sbE9mZnNldC54LFxuXHRcdFx0eTogdGhpcy5pbml0aWFsWm9vbWFibGVQb3NpdGlvbi55IC0gY3VycmVudFNjcm9sbE9mZnNldC55LFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBjdXJyZW50IG9mZnNldCBvZiB0aGUgdmlld3BvcnQgY29tcGFyZWQgdG8gdGhlIG9yaWdpbmFsIHBvc2l0aW9uLiBFLmcuIGlmIHRoZSB2aWV3cG9ydCB3YXMgc2Nyb2xsZWQgdGhpcyBzY3JvbGwgb2Zmc2V0IGlzIHJldHVybmVkLlxuXHQgKiovXG5cdHByaXZhdGUgZ2V0T2Zmc2V0RnJvbUluaXRpYWxUb0N1cnJlbnRWaWV3cG9ydFBvc2l0aW9uKCkge1xuXHRcdGxldCBjdXJyZW50Vmlld3BvcnQgPSB0aGlzLmdldENvb3Jkcyh0aGlzLnZpZXdwb3J0KVxuXHRcdHJldHVybiB7XG5cdFx0XHR4OiB0aGlzLmluaXRpYWxWaWV3cG9ydFBvc2l0aW9uLnggLSBjdXJyZW50Vmlld3BvcnQueCxcblx0XHRcdHk6IHRoaXMuaW5pdGlhbFZpZXdwb3J0UG9zaXRpb24ueSAtIGN1cnJlbnRWaWV3cG9ydC55LFxuXHRcdH1cblx0fVxuXG5cdC8vLyB6b29taW5nXG5cblx0LyoqXG5cdCAqIFNjYWxlcyB0aGUgem9vbWFibGUgdG8gbWF0Y2ggdGhlIHZpZXdwb3J0IHdpZHRoIGlmIHRoZSB6b29tYWJsZSB3aWR0aCBpcyBiaWdnZXIuXG5cdCAqL1xuXHRwcml2YXRlIHJlc2NhbGUoKSB7XG5cdFx0Y29uc3QgY29udGFpbmVyV2lkdGggPSB0aGlzLnZpZXdwb3J0Lm9mZnNldFdpZHRoXG5cblx0XHRpZiAoY29udGFpbmVyV2lkdGggPj0gdGhpcy56b29tYWJsZS5zY3JvbGxXaWR0aCkge1xuXHRcdFx0dGhpcy56b29tYWJsZS5zdHlsZS50cmFuc2Zvcm0gPSBcIlwiXG5cdFx0XHR0aGlzLnpvb21hYmxlLnN0eWxlLm1hcmdpbkJvdHRvbSA9IFwiXCJcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gem9vbSBvdXQgdG8gbWF0Y2ggdGhlIHNpemVcblx0XHRcdGNvbnN0IHdpZHRoID0gdGhpcy56b29tYWJsZS5zY3JvbGxXaWR0aFxuXHRcdFx0Y29uc3Qgc2NhbGUgPSBjb250YWluZXJXaWR0aCAvIHdpZHRoXG5cblx0XHRcdHRoaXMudmlld3BvcnQuc3R5bGUuaGVpZ2h0ID0gYCR7dGhpcy52aWV3cG9ydC5zY3JvbGxIZWlnaHQgKiBzY2FsZX1weGBcblxuXHRcdFx0dGhpcy56b29tQm91bmRhcmllcyA9IHsgbWluOiBzY2FsZSwgbWF4OiB0aGlzLnpvb21Cb3VuZGFyaWVzLm1heCB9IC8vIGFsbG93IHZhbHVlIDwxIGZvciBtaW5pbXVtIHNjYWxlXG5cdFx0XHRjb25zdCBuZXdUcmFuc2Zvcm1PcmlnaW4gPSB0aGlzLnNldEN1cnJlbnRTYWZlUG9zaXRpb24oXG5cdFx0XHRcdHsgeDogMCwgeTogMCB9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0eDogMCxcblx0XHRcdFx0XHR5OiAwLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR0aGlzLmdldEN1cnJlbnRab29tYWJsZVBvc2l0aW9uV2l0aG91dFRyYW5zZm9ybWF0aW9uKCksXG5cdFx0XHRcdHNjYWxlLFxuXHRcdFx0KS5uZXdUcmFuc2Zvcm1PcmlnaW5cblx0XHRcdHRoaXMudXBkYXRlKG5ld1RyYW5zZm9ybU9yaWdpbilcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQ2FsY3VsYXRlIHRoZSBudyBzZXNzaW9uVHJhbnNsYXRpb24gYW5kIHRyYW5zZm9ybU9yaWdpbiBkZXBlbmRlbnQgb24gdGhlIG5ldyBmaW5nZXIgcG9zaXRpb24gZm9yIGZsYXdsZXNzIHpvb21pbmcgYmVoYXZpb3IuXG5cdCAqIERlcGVuZGVudCBvbiB0aGUgbmV3IHBvc2l0aW9uIG9mIHRoZSBmaW5nZXJzIHRoZSBzZXNzaW9uVHJhbnNsYXRpb24gaXMgY2FsY3VsYXRlZCBzbyB0aGF0IHRoZSB0cmFuc2Zvcm1PcmlnaW4gaXMgaW4gdGhlIGNlbnRlciBvZiB0aGUgdG91Y2ggcG9pbnRzXG5cdCAqIFRoZSBzZXNzaW9uIHRyYW5zbGF0aW9uIGlzIHRoZSBvZmZzZXQgYnkgd2hpY2ggdGhlIG9yaWdpbmFsL2luaXRpYWwgem9vbWFibGUgaXMgbW92ZWQgaW5zaWRlIHRoZSB2aWV3cG9ydCBpbiBhIG5vbi1zY2FsZWQgc3RhdGUsIHNvIHRoYXQgd2hlbiBzY2FsaW5nIHRvIHRoZSBjdXJyZW50IHNjYWxlIGZhY3RvciAodGhpcy5jdXJyZW50U2NhbGUpIGF0IHRoZVxuXHQgKiBjYWxjdWxhdGVkIHRyYW5zZm9ybSBvcmlnaW4gd2UgZ2V0IHRoZSBjdXJyZW50IHBvc2l0aW9uIGFuZCBzaXplIG9mIHRoZSB6b29tYWJsZSBpbnNpZGUgdGhlIHZpZXdwb3J0LlxuXHQgKiBUaGUgdHJhbnNmb3JtIG9yaWdpbiBpcyB0aGUgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIG9yaWdpbmFsL2luaXRpYWwgem9vbWFibGUgcG9zaXRpb24gKG5vbi1zY2FsZWQpIGF0IHdoaWNoIHdlIG5lZWQgdG8gem9vbSBpbiBzbyB0aGF0IHdlIGdldCB0aGUgY3VycmVudCAgcG9zaXRpb24gYW5kIHNpemUgb2YgdGhlIHpvb21hYmxlIGluc2lkZSB0aGUgdmlld3BvcnQgKHdpdGggYXBwbGllZCBzZXNzaW9uIHRyYW5zbGF0aW9uKS5cblx0ICogQHBhcmFtIGFic29sdXRlWm9vbVBvc2l0aW9uIFRoZSBwb3NpdGlvbiBpbiB3aGljaCB0aGUgdXNlciB3YW50cyB0byB6b29tLCBpLmUuIHRoZSBjZW50ZXIgYmV0d2VlbiB0aGUgdHdvIGZpbmdlcnMuIFRoaXMgcG9zaXRpb24gaXMgcmVsYXRpdmUgdG8gdGhlIHNjcmVlbiBjb29yZGluYXRlcy5cblx0ICovXG5cdHByaXZhdGUgY2FsY3VsYXRlU2Vzc2lvbnNUcmFuc2xhdGlvbkFuZFRyYW5zZm9ybU9yaWdpbihhYnNvbHV0ZVpvb21Qb3NpdGlvbjogQ29vcmRpbmF0ZVBhaXIpOiB7XG5cdFx0c2Vzc2lvblRyYW5zbGF0aW9uOiBDb29yZGluYXRlUGFpclxuXHRcdG5ld1RyYW5zZm9ybU9yaWdpbjogQ29vcmRpbmF0ZVBhaXJcblx0fSB7XG5cdFx0bGV0IGN1cnJlbnRab29tYWJsZSA9IHRoaXMuZ2V0Q29vcmRzKHRoaXMuem9vbWFibGUpXG5cdFx0bGV0IHNjcm9sbE9mZnNldCA9IHRoaXMuZ2V0T2Zmc2V0RnJvbUluaXRpYWxUb0N1cnJlbnRWaWV3cG9ydFBvc2l0aW9uKClcblxuXHRcdC8vIFdlIHdhbnQgdG8gdXNlIHRoZSBuZXcgYWJzb2x1dGVab29tUG9zaXRpb24gYXMgdGhlIG5ldyB0cmFuc2Zvcm1PcmlnaW4uIFRoaXMgaXMgbmVlZGVkIGZvciBleHBlY3RlZCB6b29taW5nIGJlaGF2aW9yLlxuXHRcdC8vIFNpbmNlIHdlIGtub3cgdGhlIGN1cnJlbnQgcG9zaXRpb24gYW5kIHRoZSBuZXcgZGVzaXJlZCB0cmFuc2Zvcm1PcmlnaW4gd2UgY2FuIGNhbGN1bGF0ZSB0aGUgbmV3IHpvb21hYmxlIHBvc2l0aW9uIGZyb20gd2hpY2ggdGhlXG5cdFx0Ly8gdHJhbnNmb3JtYXRpb24gd291bGQgYmUgY29ycmVjdC5cblx0XHQvLyBpbnR1aXRpdmUgZm9ybXVsYVxuXHRcdC8vIGN1cnJlbnRab29tYWJsZSA9IGFic29sdXRlVHJhbnNmb3JtT3JpZ2luIC0gKHJlbGF0aXZlVHJhbnNmb3JtT3JpZ2luICogdGhpcy5jdXJyZW50U2NhbGUpXHR8IHN1YnN0aXR1dGUgdW5rbm93biB2YWx1ZXNcblx0XHQvLyBjdXJyZW50Wm9vbWFibGUgPSBhYnNvbHV0ZVpvb21Qb3NpdGlvbiAtICgoYWJzb2x1dGVab29tUG9zaXRpb24gLSBuZXdQb3NpdGlvbikgKiB0aGlzLmN1cnJlbnRTY2FsZSlcdHwgc29sdmUgZm9yIG5ld1Bvc2l0aW9uXG5cdFx0Ly9cblx0XHQvLyBuZXdQb3NpdGlvbiA9IChjdXJyZW50Wm9vbWFibGUueCArIGFic29sdXRlWm9vbVBvc2l0aW9uLnggKiAodGhpcy5jdXJyZW50U2NhbGUgLSAxKSkgLyB0aGlzLmN1cnJlbnRTY2FsZVxuXHRcdGxldCB0cmFuc2Zvcm1lZEluaXRpYWxab29tYWJsZSA9IHtcblx0XHRcdHg6IChjdXJyZW50Wm9vbWFibGUueCArIGFic29sdXRlWm9vbVBvc2l0aW9uLnggKiAodGhpcy5jdXJyZW50U2NhbGUgLSAxKSkgLyB0aGlzLmN1cnJlbnRTY2FsZSxcblx0XHRcdHk6IChjdXJyZW50Wm9vbWFibGUueSArIGFic29sdXRlWm9vbVBvc2l0aW9uLnkgKiAodGhpcy5jdXJyZW50U2NhbGUgLSAxKSkgLyB0aGlzLmN1cnJlbnRTY2FsZSxcblx0XHR9XG5cblx0XHQvLyB0aGUgdmVjdG9yIHRvIGdldCB0byB0aGUgZGVzaXJlZCBuZXcgcG9zaXRpb24gZnJvbSB0aGUgb3JpZ2luYWwgcG9zaXRpb25cblx0XHQvLyBuZXdQb3NpdGlvbiAtIG9yaWdpbmFsUG9zaXRpb25cblx0XHRsZXQgc2Vzc2lvblRyYW5zbGF0aW9uID0ge1xuXHRcdFx0eDogdHJhbnNmb3JtZWRJbml0aWFsWm9vbWFibGUueCAtIHRoaXMuaW5pdGlhbFpvb21hYmxlUG9zaXRpb24ueCArIHNjcm9sbE9mZnNldC54LFxuXHRcdFx0eTogdHJhbnNmb3JtZWRJbml0aWFsWm9vbWFibGUueSAtIHRoaXMuaW5pdGlhbFpvb21hYmxlUG9zaXRpb24ueSArIHNjcm9sbE9mZnNldC55LFxuXHRcdH1cblxuXHRcdC8vIHRyYW5zZm9ybSBvcmlnaW5cblx0XHQvLyBpcyByZWxhdGl2ZSB0byB0aGUgbmV3IHRyYW5zZm9ybWVkIHpvb21hYmxlXG5cdFx0bGV0IHRyYW5zZm9ybU9yaWdpbiA9IHtcblx0XHRcdHg6IGFic29sdXRlWm9vbVBvc2l0aW9uLnggLSB0cmFuc2Zvcm1lZEluaXRpYWxab29tYWJsZS54LFxuXHRcdFx0eTogYWJzb2x1dGVab29tUG9zaXRpb24ueSAtIHRyYW5zZm9ybWVkSW5pdGlhbFpvb21hYmxlLnksXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgc2Vzc2lvblRyYW5zbGF0aW9uOiBzZXNzaW9uVHJhbnNsYXRpb24sIG5ld1RyYW5zZm9ybU9yaWdpbjogdHJhbnNmb3JtT3JpZ2luIH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxjdWxhdGUgdGhlIHRyYW5zZm9ybSBvcmlnaW4gdGhhdCBpcyBuZWVkZWQgdG8gdGhlIGRlc2lyZWQgdGFyZ2V0Q29vcmRpbmF0ZXMgb2YgdGhlIHpvb21hYmxlLCBnaXZlbiB0aGUgc2Vzc2lvbiB0cmFuc2xhdGlvbiwgdGhlIHRhcmdldENvb3JkaW5hdGVzIGFuZCB0aGUgc2NhbGVcblx0ICovXG5cdHByaXZhdGUgY2FsY3VsYXRlVHJhbnNmb3JtT3JpZ2luRnJvbVRhcmdldChcblx0XHR0YXJnZXRDb29yZGluYXRlczogQ29vcmRpbmF0ZVBhaXIsXG5cdFx0Y3VycmVudFpvb21hYmxlUG9zaXRpb25XaXRob3V0VHJhbnNmb3JtYXRpb246IENvb3JkaW5hdGVQYWlyLFxuXHRcdHNlc3Npb25UcmFuc2xhdGlvbjogQ29vcmRpbmF0ZVBhaXIsXG5cdFx0c2NhbGU6IG51bWJlcixcblx0KTogQ29vcmRpbmF0ZVBhaXIge1xuXHRcdHJldHVybiB7XG5cdFx0XHR4OiAoY3VycmVudFpvb21hYmxlUG9zaXRpb25XaXRob3V0VHJhbnNmb3JtYXRpb24ueCArIHNlc3Npb25UcmFuc2xhdGlvbi54IC0gdGFyZ2V0Q29vcmRpbmF0ZXMueCkgLyAoc2NhbGUgLSAxKSxcblx0XHRcdHk6IChjdXJyZW50Wm9vbWFibGVQb3NpdGlvbldpdGhvdXRUcmFuc2Zvcm1hdGlvbi55ICsgc2Vzc2lvblRyYW5zbGF0aW9uLnkgLSB0YXJnZXRDb29yZGluYXRlcy55KSAvIChzY2FsZSAtIDEpLFxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcGluY2hIYW5kbGluZyhldjogVG91Y2hFdmVudCkge1xuXHRcdHRoaXMuZHJhZ2dpbmdPclpvb21pbmcgPSB0cnVlXG5cblx0XHQvLyBuZXcgcGluY2ggZ2VzdHVyZT9cblx0XHRsZXQgdHJhbnNmb3JtT3JpZ2luID0gdGhpcy5nZXRDdXJyZW50bHlBcHBsaWVkVHJhbnNmb3JtT3JpZ2luT2Zab29tYWJsZSgpXG5cdFx0bGV0IHBpbmNoU2Vzc2lvblRyYW5zbGF0aW9uID0gdGhpcy5waW5jaFNlc3Npb25UcmFuc2xhdGlvblxuXG5cdFx0Y29uc3QgbmV3VG91Y2hlcyA9ICEodGhpcy5waW5jaFRvdWNoSURzLmhhcyhldi50b3VjaGVzWzBdLmlkZW50aWZpZXIpICYmIHRoaXMucGluY2hUb3VjaElEcy5oYXMoZXYudG91Y2hlc1sxXS5pZGVudGlmaWVyKSlcblxuXHRcdGlmIChuZXdUb3VjaGVzKSB7XG5cdFx0XHR0aGlzLmxhc3RQaW5jaFRvdWNoUG9zaXRpb25zID0ge1xuXHRcdFx0XHRwb2ludGVyMTogeyB4OiBldi50b3VjaGVzWzBdLmNsaWVudFgsIHk6IGV2LnRvdWNoZXNbMF0uY2xpZW50WSB9LFxuXHRcdFx0XHRwb2ludGVyMjogeyB4OiBldi50b3VjaGVzWzFdLmNsaWVudFgsIHk6IGV2LnRvdWNoZXNbMV0uY2xpZW50WSB9LFxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIENhbGN1bGF0ZSB0aGUgc2NhbGVEaWZmZXJlbmNlICgxID0gbm8gc2NhbGVEaWZmZXJlbmNlLCAwID0gbWF4aW11bSBwaW5jaGVkIGluLCA8MSBwaW5jaGluZyBpbiAtPiB6b29tIG91dCwgPjEgcGluY2hpbmcgb3V0IC0+IHpvb20gaW5cblx0XHRjb25zdCBzY2FsZURpZmZlcmVuY2UgPVxuXHRcdFx0dGhpcy5wb2ludERpc3RhbmNlKHsgeDogZXYudG91Y2hlc1swXS5jbGllbnRYLCB5OiBldi50b3VjaGVzWzBdLmNsaWVudFkgfSwgeyB4OiBldi50b3VjaGVzWzFdLmNsaWVudFgsIHk6IGV2LnRvdWNoZXNbMV0uY2xpZW50WSB9KSAvXG5cdFx0XHR0aGlzLnBvaW50RGlzdGFuY2UodGhpcy5sYXN0UGluY2hUb3VjaFBvc2l0aW9ucy5wb2ludGVyMSwgdGhpcy5sYXN0UGluY2hUb3VjaFBvc2l0aW9ucy5wb2ludGVyMilcblx0XHRjb25zdCBuZXdBYnNvbHV0ZVNjYWxlID0gdGhpcy5jdXJyZW50U2NhbGUgKyAoc2NhbGVEaWZmZXJlbmNlIC0gMSlcblxuXHRcdHRoaXMubGFzdFBpbmNoVG91Y2hQb3NpdGlvbnMgPSB7XG5cdFx0XHRwb2ludGVyMTogeyB4OiBldi50b3VjaGVzWzBdLmNsaWVudFgsIHk6IGV2LnRvdWNoZXNbMF0uY2xpZW50WSB9LFxuXHRcdFx0cG9pbnRlcjI6IHsgeDogZXYudG91Y2hlc1sxXS5jbGllbnRYLCB5OiBldi50b3VjaGVzWzFdLmNsaWVudFkgfSxcblx0XHR9XG5cblx0XHQvLyBjYWxjdWxhdGUgbmV3IHNlc3Npb24gKGluIHRoZW9yeSBpdCBpcyBub3QgbmVjZXNzYXJ5IHRvIGNhbGN1bGF0ZSBhIG5ldyBzZXNzaW9uc1RyYW5zbGF0aW9uIGV2ZXJ5IHRpbWUsIGJ1dCB0aGVyZSBhcmUgYSBmZXcgZWRnZSBjYXNlcyAtPlxuXHRcdC8vIHNpbmNlIGl0IGRvZXNuJ3QgaHVydCB3ZSBkZWNpZGVkIHRvIHJlY2FsY3VsYXRlIGl0IGFsd2F5cylcblx0XHRjb25zdCBwaW5jaENlbnRlciA9IHRoaXMuY2VudGVyT2ZQb2ludHMoeyB4OiBldi50b3VjaGVzWzBdLmNsaWVudFgsIHk6IGV2LnRvdWNoZXNbMF0uY2xpZW50WSB9LCB7IHg6IGV2LnRvdWNoZXNbMV0uY2xpZW50WCwgeTogZXYudG91Y2hlc1sxXS5jbGllbnRZIH0pXG5cdFx0Y29uc3Qgc3RhcnRlZFBpbmNoU2Vzc2lvbiA9IHRoaXMuY2FsY3VsYXRlU2Vzc2lvbnNUcmFuc2xhdGlvbkFuZFRyYW5zZm9ybU9yaWdpbihwaW5jaENlbnRlcilcblx0XHR0cmFuc2Zvcm1PcmlnaW4gPSBzdGFydGVkUGluY2hTZXNzaW9uLm5ld1RyYW5zZm9ybU9yaWdpblxuXHRcdHBpbmNoU2Vzc2lvblRyYW5zbGF0aW9uID0gc3RhcnRlZFBpbmNoU2Vzc2lvbi5zZXNzaW9uVHJhbnNsYXRpb25cblxuXHRcdC8vdXBkYXRlIGN1cnJlbnQgdG91Y2hlc1xuXHRcdHRoaXMucGluY2hUb3VjaElEcyA9IG5ldyBTZXQ8bnVtYmVyPihbZXYudG91Y2hlc1swXS5pZGVudGlmaWVyLCBldi50b3VjaGVzWzFdLmlkZW50aWZpZXJdKVxuXG5cdFx0Y29uc3QgbmV3VHJhbnNmb3JtT3JpZ2luID0gdGhpcy5zZXRDdXJyZW50U2FmZVBvc2l0aW9uKFxuXHRcdFx0dHJhbnNmb3JtT3JpZ2luLFxuXHRcdFx0cGluY2hTZXNzaW9uVHJhbnNsYXRpb24sXG5cdFx0XHR0aGlzLmdldEN1cnJlbnRab29tYWJsZVBvc2l0aW9uV2l0aG91dFRyYW5zZm9ybWF0aW9uKCksXG5cdFx0XHRuZXdBYnNvbHV0ZVNjYWxlLFxuXHRcdCkubmV3VHJhbnNmb3JtT3JpZ2luXG5cdFx0dGhpcy51cGRhdGUobmV3VHJhbnNmb3JtT3JpZ2luKVxuXHR9XG5cblx0cHJpdmF0ZSBkcmFnSGFuZGxpbmcoZXY6IFRvdWNoRXZlbnQpIHtcblx0XHRpZiAodGhpcy5jdXJyZW50U2NhbGUgPiB0aGlzLnpvb21Cb3VuZGFyaWVzLm1pbiAmJiB0aGlzLmxhc3REcmFnVG91Y2hQb3NpdGlvbikge1xuXHRcdFx0aWYgKFxuXHRcdFx0XHRNYXRoLmFicyhldi50b3VjaGVzWzBdLmNsaWVudFggLSB0aGlzLmN1cnJlbnRUb3VjaFN0YXJ0LngpID49IFBpbmNoWm9vbS5EUkFHX1RIUkVTSE9MRCB8fFxuXHRcdFx0XHRNYXRoLmFicyhldi50b3VjaGVzWzBdLmNsaWVudFkgLSB0aGlzLmN1cnJlbnRUb3VjaFN0YXJ0LnkpID49IFBpbmNoWm9vbS5EUkFHX1RIUkVTSE9MRFxuXHRcdFx0KSB7XG5cdFx0XHRcdHRoaXMuZHJhZ2dpbmdPclpvb21pbmcgPSB0cnVlXG5cdFx0XHR9XG5cdFx0XHRsZXQgZGVsdGEgPSB7IHg6IGV2LnRvdWNoZXNbMF0uY2xpZW50WCAtIHRoaXMubGFzdERyYWdUb3VjaFBvc2l0aW9uLngsIHk6IGV2LnRvdWNoZXNbMF0uY2xpZW50WSAtIHRoaXMubGFzdERyYWdUb3VjaFBvc2l0aW9uLnkgfVxuXHRcdFx0dGhpcy5sYXN0RHJhZ1RvdWNoUG9zaXRpb24gPSB7IHg6IGV2LnRvdWNoZXNbMF0uY2xpZW50WCwgeTogZXYudG91Y2hlc1swXS5jbGllbnRZIH1cblxuXHRcdFx0bGV0IGN1cnJlbnRSZWN0ID0gdGhpcy5nZXRDb29yZHModGhpcy56b29tYWJsZSlcblx0XHRcdGxldCBjdXJyZW50T3JpZ2luYWxSZWN0ID0gdGhpcy5nZXRDdXJyZW50Wm9vbWFibGVQb3NpdGlvbldpdGhvdXRUcmFuc2Zvcm1hdGlvbigpXG5cblx0XHRcdC8vIGludHVpdGl2ZSBmb3JtdWxhOlxuXHRcdFx0Ly8gbmV3UG9zaXRpb24gPSB0cmFuc2Zvcm1PcmlnaW5BYnNvbHV0ZVBvc2l0aW9uIC0gcmVsYXRpdmVUcmFuc2Zvcm1PcmlnaW4gKiBzY2FsaW5nXHR8IHN1YnN0aXR1dGUgdW5rbm93biB2YWx1ZXNcblx0XHRcdC8vIGN1cnJlbnRSZWN0LnggKyBkZWx0YS54ID0gKGN1cnJlbnRPcmlnaW5hbFJlY3QgKyB0aGlzLnBpbmNoU2Vzc2lvblRyYW5zbGF0aW9uICsgbmV3VHJhbnNmb3JtT3JpZ2luKSAtIChuZXdUcmFuc2Zvcm1PcmlnaW4gKiB0aGlzLmN1cnJlbnRTY2FsZSlcdHwgc29sdmUgZm9yIG5ld1RyYW5zZm9ybU9yaWdpblxuXHRcdFx0Ly9cblx0XHRcdC8vIG5ld1RyYW5zZm9ybU9yaWdpbiA9IChjdXJyZW50UmVjdC54ICsgZGVsdGEueCAtIChjdXJyZW50T3JpZ2luYWxSZWN0LnggKyB0aGlzLnBpbmNoU2Vzc2lvblRyYW5zbGF0aW9uLngpKSAvICgxIC0gdGhpcy5jdXJyZW50U2NhbGUpXG5cdFx0XHRsZXQgbmV3VHJhbnNmb3JtT3JpZ2luID0ge1xuXHRcdFx0XHR4OiAoY3VycmVudFJlY3QueCArIGRlbHRhLnggLSAoY3VycmVudE9yaWdpbmFsUmVjdC54ICsgdGhpcy5waW5jaFNlc3Npb25UcmFuc2xhdGlvbi54KSkgLyAoMSAtIHRoaXMuY3VycmVudFNjYWxlKSwgLy8gem9vbSBpcyBuZXZlciAxXG5cdFx0XHRcdHk6IChjdXJyZW50UmVjdC55ICsgZGVsdGEueSAtIChjdXJyZW50T3JpZ2luYWxSZWN0LnkgKyB0aGlzLnBpbmNoU2Vzc2lvblRyYW5zbGF0aW9uLnkpKSAvICgxIC0gdGhpcy5jdXJyZW50U2NhbGUpLFxuXHRcdFx0fVxuXHRcdFx0bGV0IG5ld1BpbmNoU2Vzc2lvblRyYW5zbGF0aW9uID0gdGhpcy5waW5jaFNlc3Npb25UcmFuc2xhdGlvblxuXHRcdFx0Ly8gZm9yIHRvbyBsYXJnZSBlbWFpbHMgYW5kIHNjYWxlIDEgd2UgbWFudWFsbHkgbmVlZCB0byBzZXQgdGhlIHNlc3Npb25UcmFuc2xhdGlvbiB0byBhbGxvdyBkcmFnZ2luZ1xuXHRcdFx0Ly8gZHJhZ2dpbmcgdmlhIGFkanVzdGluZyB0aGUgdHJhbnNmb3JtIG9yaWdpbiBkb2VzIG5vdCB3b3JrIGZvciBzY2FsZT0xXG5cdFx0XHRpZiAodGhpcy5jdXJyZW50U2NhbGUgPT09IDEpIHtcblx0XHRcdFx0bmV3VHJhbnNmb3JtT3JpZ2luID0geyB4OiAwLCB5OiAwIH0gLy8gb3RoZXJ3aXNlIE5hTiBidXQgdGhlIHZhbHVlIGRvZXMgbm90IGhhdmUgYW55IGltcGFjdFxuXHRcdFx0XHRuZXdQaW5jaFNlc3Npb25UcmFuc2xhdGlvbiA9IHsgeDogbmV3UGluY2hTZXNzaW9uVHJhbnNsYXRpb24ueCArIGRlbHRhLngsIHk6IG5ld1BpbmNoU2Vzc2lvblRyYW5zbGF0aW9uLnkgKyBkZWx0YS55IH1cblx0XHRcdH1cblxuXHRcdFx0bGV0IHJlc3VsdCA9IHRoaXMuc2V0Q3VycmVudFNhZmVQb3NpdGlvbihcblx0XHRcdFx0bmV3VHJhbnNmb3JtT3JpZ2luLFxuXHRcdFx0XHRuZXdQaW5jaFNlc3Npb25UcmFuc2xhdGlvbixcblx0XHRcdFx0dGhpcy5nZXRDdXJyZW50Wm9vbWFibGVQb3NpdGlvbldpdGhvdXRUcmFuc2Zvcm1hdGlvbigpLFxuXHRcdFx0XHR0aGlzLmN1cnJlbnRTY2FsZSxcblx0XHRcdClcblx0XHRcdC8vIGRlZmF1bHQgYmVoYXZpb3IgaXMgYWxsb3dlZCBpZiB2ZXJ0aWNhbCBkcmFnZ2luZyBpcyBub3QgZGV0ZWN0ZWQvIHBvc3NpYmxlXG5cdFx0XHQvLyBob3Jpem9udGFsIGJlaGF2aW9yIGlzIGlnbm9yZWRcblx0XHRcdGlmIChldi5jYW5jZWxhYmxlICYmIHJlc3VsdC52ZXJ0aWNhbFRyYW5zZm9ybWF0aW9uQWxsb3dlZCkge1xuXHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpIC8vIHNob3VsZCBwcmV2ZW50IHRoZSBkZWZhdWx0IGJlaGF2aW9yIG9mIHRoZSBwYXJlbnQgZWxlbWVudHMgKGUuZy4gc2Nyb2xsaW5nKVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnVwZGF0ZShyZXN1bHQubmV3VHJhbnNmb3JtT3JpZ2luKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlRG91YmxlVGFwKFxuXHRcdGV2ZW50OiBUb3VjaEV2ZW50LFxuXHRcdHRhcmdldDogRXZlbnRUYXJnZXQgfCBudWxsLFxuXHRcdHNpbmdsZUNsaWNrQWN0aW9uOiAoZTogVG91Y2hFdmVudCwgdGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGwpID0+IHZvaWQsXG5cdFx0ZG91YmxlQ2xpY2tBY3Rpb246IChlOiBUb3VjaEV2ZW50KSA9PiB2b2lkLFxuXHQpIHtcblx0XHRjb25zdCBub3cgPSBEYXRlLm5vdygpXG5cdFx0Y29uc3QgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXVxuXG5cdFx0Ly8gSWYgdGhlcmUgYXJlIG5vIHRvdWNoZXMgb3IgaXQncyBub3QgY2FuY2VsbGFibGUgZXZlbnQgKGUuZy4gc2Nyb2xsKVxuXHRcdGlmICghdG91Y2ggfHwgIWV2ZW50LmNhbmNlbGFibGUpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuXHRcdGlmIChcblx0XHRcdG5vdyAtIHRoaXMuZmlyc3RUYXBUaW1lIDwgdGhpcy5ET1VCTEVfVEFQX1RJTUVfTVMgJiZcblx0XHRcdE1hdGguYWJzKHRvdWNoLmNsaWVudFggLSB0aGlzLmxhc3REb3VibGVUYXBUb3VjaFN0YXJ0LngpIDwgdGhpcy5TQU1FX1BPU0lUSU9OX1JBRElVUyAmJiAvLyBtYWtlIHN1cmUgdGhhdCB0aGUgZG91YmxlIHRhcCBzdGF5cyB3aXRoaW4gdGhlIHJpZ2h0IHJhZGl1c1xuXHRcdFx0TWF0aC5hYnModG91Y2guY2xpZW50WSAtIHRoaXMubGFzdERvdWJsZVRhcFRvdWNoU3RhcnQueSkgPCB0aGlzLlNBTUVfUE9TSVRJT05fUkFESVVTXG5cdFx0KSB7XG5cdFx0XHR0aGlzLmZpcnN0VGFwVGltZSA9IDBcblx0XHRcdGRvdWJsZUNsaWNrQWN0aW9uKGV2ZW50KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdHRoaXMuZmlyc3RUYXBUaW1lID09PSBub3cgJiYgLy8gc2FtZSB0b3VjaCwgaWYgYSBzZWNvbmQgdGFwIHdhcyBwZXJmb3JtZWQgdGhpcyBjb25kaXRpb24gaXMgZmFsc2Vcblx0XHRcdFx0XHRNYXRoLmFicyh0b3VjaC5jbGllbnRYIC0gdGhpcy5jdXJyZW50VG91Y2hTdGFydC54KSA8IHRoaXMuU0FNRV9QT1NJVElPTl9SQURJVVMgJiYgLy8gb3RoZXJ3aXNlIHNpbmdsZSBmYXN0IGRyYWcgaXMgcmVjb2duaXplZCBhcyBhIGNsaWNrXG5cdFx0XHRcdFx0TWF0aC5hYnModG91Y2guY2xpZW50WSAtIHRoaXMuY3VycmVudFRvdWNoU3RhcnQueSkgPCB0aGlzLlNBTUVfUE9TSVRJT05fUkFESVVTXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdC8vIGF0IHRoaXMgcG9pbnQgd2UgYXJlIHN1cmUgdGhhdCB0aGVyZSBpcyBubyBzZWNvbmQgdGFwIGZvciBhIGRvdWJsZSB0YXBcblxuXHRcdFx0XHRcdC8vIFdlIG5lZWQgdG8gdmVyaWZ5IGlmIGl0IHdhcyBhIGxvbmcgcHJlc3MsIHNvIHdlIGRvbid0IGNsZWFyIHRoZSB0ZXh0IHNlbGVjdGlvbiBpbiB0aGlzIGNhc2Vcblx0XHRcdFx0XHRpZiAobm93IC0gdGhpcy5jdXJyZW50VG91Y2hTdGFydC5zdGFydFRpbWUgPCB0aGlzLkxPTkdfUFJFU1NfTUlOX01TKSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk/LmVtcHR5KCkgLy8gZGVzZWxlY3QgYW55IHNlbGVjdGVkIHRleHRcblxuXHRcdFx0XHRcdHNpbmdsZUNsaWNrQWN0aW9uKGV2ZW50LCB0YXJnZXQpXG5cdFx0XHRcdH1cblx0XHRcdH0sIHRoaXMuRE9VQkxFX1RBUF9USU1FX01TKVxuXHRcdH1cblx0XHR0aGlzLmxhc3REb3VibGVUYXBUb3VjaFN0YXJ0ID0gdGhpcy5jdXJyZW50VG91Y2hTdGFydFxuXHRcdHRoaXMuZmlyc3RUYXBUaW1lID0gbm93XG5cdH1cblxuXHQvKipcblx0ICogQXBwbGllcyB0aGUgY3VycmVudCBzZXNzaW9uIHRyYW5zbGF0aW9uIGFuZCBzY2FsZSB0byB0aGUgem9vbWFibGUsIHNvIGl0IGJlY29tZXMgdmlzaWJsZS5cblx0ICovXG5cdHByaXZhdGUgdXBkYXRlKG5ld1RyYW5zZm9ybU9yaWdpbjogQ29vcmRpbmF0ZVBhaXIpIHtcblx0XHR0aGlzLnpvb21hYmxlLnN0eWxlLnRyYW5zZm9ybU9yaWdpbiA9IGAke25ld1RyYW5zZm9ybU9yaWdpbi54fXB4ICR7bmV3VHJhbnNmb3JtT3JpZ2luLnl9cHhgXG5cdFx0dGhpcy56b29tYWJsZS5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlM2QoJHt0aGlzLnBpbmNoU2Vzc2lvblRyYW5zbGF0aW9uLnh9cHgsICR7dGhpcy5waW5jaFNlc3Npb25UcmFuc2xhdGlvbi55fXB4LCAwKSBzY2FsZSgke3RoaXMuY3VycmVudFNjYWxlfSlgXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2tzIHdoZXRoZXIgdGhlIHpvb21hYmxlIGlzIHN0aWxsIGluIHRoZSBhbGxvd2VkIGFyZSAodmlld3BvcnQpIGFmdGVyIGFwcGx5aW5nIHRoZSB0cmFuc2Zvcm1hdGlvbnNcblx0ICogaWYgbm90IGFsbG93ZWQgLT4gYWRqdXN0IHRoZSB0cmFuc2Zvcm1PcmlnaW4gdG8ga2VlcCB0aGUgdHJhbnNmb3JtZWQgem9vbWFibGUgaW4gYW4gYWxsb3dlZCBzdGF0ZVxuXHQgKiBhcHBseSBjaGFuZ2VzIHRvIHNlc3Npb25UcmFuc2xhdGlvbiwgem9vbSBhbmQgdHJhbnNmb3JtT3JpZ2luXG5cdCAqL1xuXHRwcml2YXRlIHNldEN1cnJlbnRTYWZlUG9zaXRpb24oXG5cdFx0bmV3VHJhbnNmb3JtT3JpZ2luOiBDb29yZGluYXRlUGFpcixcblx0XHRuZXdQaW5jaFNlc3Npb25UcmFuc2xhdGlvbjogQ29vcmRpbmF0ZVBhaXIsXG5cdFx0Y3VycmVudFpvb21hYmxlUG9zaXRpb25XaXRob3V0VHJhbnNmb3JtYXRpb246IENvb3JkaW5hdGVQYWlyLFxuXHRcdG5ld1NjYWxlOiBudW1iZXIsXG5cdCkge1xuXHRcdHRoaXMuZ2V0T2Zmc2V0RnJvbUluaXRpYWxUb0N1cnJlbnRWaWV3cG9ydFBvc2l0aW9uKClcblx0XHRsZXQgY3VycmVudFZpZXdwb3J0ID0gdGhpcy5nZXRDb29yZHModGhpcy52aWV3cG9ydClcblx0XHQvLyBTaW5jZSB3ZSBkb24ndCByb3VuZCB0aGUgc2NyZWVuIGNvb3JkaW5hdGVzLCB3aXRob3V0IGFkZGluZyBhIHNtYWxsIHRvbGVyYW5jZSAoKy0xKSB1bndhbnRlZCBiZWhhdmlvciBzaG93cyB1cCAoZS5nLiB0aW55IGRpZmZlcmVuY2VzIGluIHRoZSBjb29yZGluYXRlcylcblx0XHRsZXQgYm9yZGVycyA9IHtcblx0XHRcdHg6IGN1cnJlbnRWaWV3cG9ydC54ICsgMSxcblx0XHRcdHk6IGN1cnJlbnRWaWV3cG9ydC55ICsgMSxcblx0XHRcdHgyOiBjdXJyZW50Vmlld3BvcnQueDIgLSAxLFxuXHRcdFx0eTI6IGN1cnJlbnRWaWV3cG9ydC55MiAtIDEsXG5cdFx0fVxuXG5cdFx0Ly8ga2VlcCB0aGUgem9vbWluZyBmYWN0b3Igd2l0aGluIHRoZSBkZWZpbmVkIGJvdW5kYXJpZXNcblx0XHRuZXdTY2FsZSA9IE1hdGgubWF4KHRoaXMuem9vbUJvdW5kYXJpZXMubWluLCBNYXRoLm1pbih0aGlzLnpvb21Cb3VuZGFyaWVzLm1heCwgbmV3U2NhbGUpKVxuXHRcdGNvbnN0IHRhcmdldGVkT3V0Y29tZSA9IHRoaXMuc2ltdWxhdGVUcmFuc2Zvcm1hdGlvbihcblx0XHRcdGN1cnJlbnRab29tYWJsZVBvc2l0aW9uV2l0aG91dFRyYW5zZm9ybWF0aW9uLFxuXHRcdFx0dGhpcy5pbml0aWFsWm9vbWFibGVTaXplLndpZHRoLFxuXHRcdFx0dGhpcy5pbml0aWFsWm9vbWFibGVTaXplLmhlaWdodCxcblx0XHRcdG5ld1RyYW5zZm9ybU9yaWdpbixcblx0XHRcdG5ld1BpbmNoU2Vzc2lvblRyYW5zbGF0aW9uLFxuXHRcdFx0bmV3U2NhbGUsXG5cdFx0KVxuXHRcdGNvbnN0IHRhcmdldGVkSGVpZ2h0ID0gdGFyZ2V0ZWRPdXRjb21lLnkyIC0gdGFyZ2V0ZWRPdXRjb21lLnlcblx0XHRjb25zdCB0YXJnZXRlZFdpZHRoID0gdGFyZ2V0ZWRPdXRjb21lLngyIC0gdGFyZ2V0ZWRPdXRjb21lLnhcblxuXHRcdGNvbnN0IGhvcml6b250YWwxQWxsb3dlZCA9IHRhcmdldGVkT3V0Y29tZS54IDw9IGJvcmRlcnMueFxuXHRcdGNvbnN0IGhvcml6b250YWwyQWxsb3dlZCA9IHRhcmdldGVkT3V0Y29tZS54MiA+PSBib3JkZXJzLngyXG5cblx0XHRjb25zdCB2ZXJ0aWNhbDFBbGxvd2VkID0gdGFyZ2V0ZWRPdXRjb21lLnkgPD0gYm9yZGVycy55XG5cdFx0Y29uc3QgdmVydGljYWwyQWxsb3dlZCA9IHRhcmdldGVkT3V0Y29tZS55MiA+PSBib3JkZXJzLnkyXG5cblx0XHRjb25zdCBob3Jpem9udGFsVHJhbnNmb3JtYXRpb25BbGxvd2VkID0gaG9yaXpvbnRhbDFBbGxvd2VkICYmIGhvcml6b250YWwyQWxsb3dlZFxuXHRcdGNvbnN0IHZlcnRpY2FsVHJhbnNmb3JtYXRpb25BbGxvd2VkID0gdmVydGljYWwxQWxsb3dlZCAmJiB2ZXJ0aWNhbDJBbGxvd2VkXG5cblx0XHQvLyBmaW5kIG91dCB3aGljaCBvcGVyYXRpb24gd291bGQgYmUgaWxsZWdhbCBhbmQgY2FsY3VsYXRlIHRoZSBhZGp1c3RlZCB0cmFuc2Zvcm1PcmlnaW5cblx0XHRjb25zdCB0YXJnZXRYID0gIWhvcml6b250YWwxQWxsb3dlZCA/IGJvcmRlcnMueCA6ICFob3Jpem9udGFsMkFsbG93ZWQgPyBib3JkZXJzLngyIC0gdGFyZ2V0ZWRXaWR0aCA6IHRhcmdldGVkT3V0Y29tZS54XG5cdFx0Y29uc3QgdGFyZ2V0WSA9ICF2ZXJ0aWNhbDFBbGxvd2VkID8gYm9yZGVycy55IDogIXZlcnRpY2FsMkFsbG93ZWQgPyBib3JkZXJzLnkyIC0gdGFyZ2V0ZWRIZWlnaHQgOiB0YXJnZXRlZE91dGNvbWUueVxuXHRcdGlmICh0YXJnZXRYICE9PSB0YXJnZXRlZE91dGNvbWUueCB8fCB0YXJnZXRZICE9PSB0YXJnZXRlZE91dGNvbWUueSkge1xuXHRcdFx0bmV3VHJhbnNmb3JtT3JpZ2luID0gdGhpcy5jYWxjdWxhdGVUcmFuc2Zvcm1PcmlnaW5Gcm9tVGFyZ2V0KFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0eDogdGFyZ2V0WCxcblx0XHRcdFx0XHR5OiB0YXJnZXRZLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjdXJyZW50Wm9vbWFibGVQb3NpdGlvbldpdGhvdXRUcmFuc2Zvcm1hdGlvbixcblx0XHRcdFx0bmV3UGluY2hTZXNzaW9uVHJhbnNsYXRpb24sXG5cdFx0XHRcdG5ld1NjYWxlLFxuXHRcdFx0KVxuXHRcdH1cblx0XHRpZiAobmV3U2NhbGUgPT09IDEgJiYgdGhpcy56b29tQm91bmRhcmllcy5taW4gPT09IDEpIHtcblx0XHRcdC8vIG5vdCBpbml0aWFsbHkgc2NhbGVkIGVtYWlsIGlzIGJhY2sgaW4gdGhlIG9yaWdpbmFsIHN0YXRlXG5cdFx0XHR0aGlzLnBpbmNoU2Vzc2lvblRyYW5zbGF0aW9uID0geyB4OiAwLCB5OiAwIH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5waW5jaFNlc3Npb25UcmFuc2xhdGlvbiA9IG5ld1BpbmNoU2Vzc2lvblRyYW5zbGF0aW9uXG5cdFx0fVxuXHRcdHRoaXMuY3VycmVudFNjYWxlID0gbmV3U2NhbGVcblxuXHRcdHJldHVybiB7XG5cdFx0XHR2ZXJ0aWNhbFRyYW5zZm9ybWF0aW9uQWxsb3dlZCxcblx0XHRcdGhvcml6b250YWxUcmFuc2Zvcm1hdGlvbkFsbG93ZWQsXG5cdFx0XHRuZXdUcmFuc2Zvcm1PcmlnaW4sXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIGNhbGN1bGF0ZSB0aGUgb3V0Y29tZSBvZiB0aGUgY3NzIHRyYW5zZm9ybWF0aW9uXG5cdCAqIHRoaXMgaXMgdXNlZCB0byBjaGVjayB0aGUgYm91bmRhcmllcyBiZWZvcmUgYWN0dWFsbHkgYXBwbHlpbmcgdGhlIHRyYW5zZm9ybWF0aW9uXG5cdCAqL1xuXHRwcml2YXRlIHNpbXVsYXRlVHJhbnNmb3JtYXRpb24oXG5cdFx0Y3VycmVudE9yaWdpbmFsUG9zaXRpb246IENvb3JkaW5hdGVQYWlyLFxuXHRcdG9yaWdpbmFsV2lkdGg6IG51bWJlcixcblx0XHRvcmlnaW5hbEhlaWdodDogbnVtYmVyLFxuXHRcdHRyYW5zZm9ybU9yaWdpbjogQ29vcmRpbmF0ZVBhaXIsXG5cdFx0dHJhbnNsYXRpb246IENvb3JkaW5hdGVQYWlyLFxuXHRcdHNjYWxlOiBudW1iZXIsXG5cdCk6IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IHgyOiBudW1iZXI7IHkyOiBudW1iZXIgfSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHg6IGN1cnJlbnRPcmlnaW5hbFBvc2l0aW9uLnggKyB0cmFuc2Zvcm1PcmlnaW4ueCAtIHRyYW5zZm9ybU9yaWdpbi54ICogc2NhbGUgKyB0cmFuc2xhdGlvbi54LFxuXHRcdFx0eTogY3VycmVudE9yaWdpbmFsUG9zaXRpb24ueSArIHRyYW5zZm9ybU9yaWdpbi55IC0gdHJhbnNmb3JtT3JpZ2luLnkgKiBzY2FsZSArIHRyYW5zbGF0aW9uLnksXG5cdFx0XHR4MjogY3VycmVudE9yaWdpbmFsUG9zaXRpb24ueCArIHRyYW5zZm9ybU9yaWdpbi54ICsgKG9yaWdpbmFsV2lkdGggLSB0cmFuc2Zvcm1PcmlnaW4ueCkgKiBzY2FsZSArIHRyYW5zbGF0aW9uLngsXG5cdFx0XHR5MjogY3VycmVudE9yaWdpbmFsUG9zaXRpb24ueSArIHRyYW5zZm9ybU9yaWdpbi55ICsgKG9yaWdpbmFsSGVpZ2h0IC0gdHJhbnNmb3JtT3JpZ2luLnkpICogc2NhbGUgKyB0cmFuc2xhdGlvbi55LFxuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHR5cGUgeyBNYWlsYm94TW9kZWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L01haWxib3hNb2RlbC5qc1wiXG5pbXBvcnQgeyBjcmVhdGVNYWlsLCBGaWxlIGFzIFR1dGFub3RhRmlsZSwgTWFpbCwgTWFpbEZvbGRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IExvY2tlZEVycm9yLCBQcmVjb25kaXRpb25GYWlsZWRFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2dcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvclwiXG5pbXBvcnQgeyBBbGxJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvblwiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnNcIlxuaW1wb3J0IHsgaXNBcHAsIGlzRGVza3RvcCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCwgZW5kc1dpdGgsIG5ldmVyTnVsbCwgbm9PcCwgcHJvbWlzZU1hcCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHtcblx0RW5jcnlwdGlvbkF1dGhTdGF0dXMsXG5cdGdldE1haWxGb2xkZXJUeXBlLFxuXHRNYWlsUmVwb3J0VHlwZSxcblx0TWFpbFNldEtpbmQsXG5cdE1haWxTdGF0ZSxcblx0U1lTVEVNX0dST1VQX01BSUxfQUREUkVTUyxcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IGdldEVsZW1lbnRJZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlsc1wiXG5pbXBvcnQgeyByZXBvcnRNYWlsc0F1dG9tYXRpY2FsbHkgfSBmcm9tIFwiLi9NYWlsUmVwb3J0RGlhbG9nXCJcbmltcG9ydCB7IERhdGFGaWxlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0RhdGFGaWxlXCJcbmltcG9ydCB7IGxhbmcsIFRyYW5zbGF0aW9uLCBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBGaWxlQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZmlsZS9GaWxlQ29udHJvbGxlclwiXG5pbXBvcnQgeyBEb21SZWN0UmVhZE9ubHlQb2x5ZmlsbGVkLCBEcm9wZG93biwgRHJvcGRvd25DaGlsZEF0dHJzLCBQb3NSZWN0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyBtb2RhbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTW9kYWwuanNcIlxuaW1wb3J0IHsgQ29udmVyc2F0aW9uVmlld01vZGVsIH0gZnJvbSBcIi4vQ29udmVyc2F0aW9uVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IHNpemUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplLmpzXCJcbmltcG9ydCB7IFBpbmNoWm9vbSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL1BpbmNoWm9vbS5qc1wiXG5pbXBvcnQgeyBJbmxpbmVJbWFnZVJlZmVyZW5jZSwgSW5saW5lSW1hZ2VzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9pbmxpbmVJbWFnZXNVdGlscy5qc1wiXG5pbXBvcnQgeyBNYWlsTW9kZWwgfSBmcm9tIFwiLi4vbW9kZWwvTWFpbE1vZGVsLmpzXCJcbmltcG9ydCB7IGhhc1ZhbGlkRW5jcnlwdGlvbkF1dGhGb3JUZWFtT3JTeXN0ZW1NYWlsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9TaGFyZWRNYWlsVXRpbHMuanNcIlxuaW1wb3J0IHsgbWFpbExvY2F0b3IgfSBmcm9tIFwiLi4vLi4vbWFpbExvY2F0b3IuanNcIlxuaW1wb3J0IHsgYXNzZXJ0U3lzdGVtRm9sZGVyT2ZUeXBlLCBGb2xkZXJJbmZvLCBnZXRGb2xkZXJOYW1lLCBnZXRJbmRlbnRlZEZvbGRlck5hbWVGb3JEcm9wZG93biwgZ2V0TW92ZVRhcmdldEZvbGRlclN5c3RlbXMgfSBmcm9tIFwiLi4vbW9kZWwvTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IEZvbnRJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvRm9udEljb25zLmpzXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgeyBpc09mVHlwZU9yU3ViZm9sZGVyT2YsIGlzU3BhbU9yVHJhc2hGb2xkZXIgfSBmcm9tIFwiLi4vbW9kZWwvTWFpbENoZWNrcy5qc1wiXG5pbXBvcnQgdHlwZSB7IEZvbGRlclN5c3RlbSwgSW5kZW50ZWRGb2xkZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vbWFpbC9Gb2xkZXJTeXN0ZW0uanNcIlxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvd0RlbGV0ZUNvbmZpcm1hdGlvbkRpYWxvZyhtYWlsczogUmVhZG9ubHlBcnJheTxNYWlsPik6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRsZXQgdHJhc2hNYWlsczogTWFpbFtdID0gW11cblx0bGV0IG1vdmVNYWlsczogTWFpbFtdID0gW11cblx0Zm9yIChsZXQgbWFpbCBvZiBtYWlscykge1xuXHRcdGNvbnN0IGZvbGRlciA9IG1haWxMb2NhdG9yLm1haWxNb2RlbC5nZXRNYWlsRm9sZGVyRm9yTWFpbChtYWlsKVxuXHRcdGNvbnN0IGZvbGRlcnMgPSBhd2FpdCBtYWlsTG9jYXRvci5tYWlsTW9kZWwuZ2V0TWFpbGJveEZvbGRlcnNGb3JNYWlsKG1haWwpXG5cdFx0aWYgKGZvbGRlcnMgPT0gbnVsbCkge1xuXHRcdFx0Y29udGludWVcblx0XHR9XG5cdFx0Y29uc3QgaXNGaW5hbERlbGV0ZSA9IGZvbGRlciAmJiBpc1NwYW1PclRyYXNoRm9sZGVyKGZvbGRlcnMsIGZvbGRlcilcblx0XHRpZiAoaXNGaW5hbERlbGV0ZSkge1xuXHRcdFx0dHJhc2hNYWlscy5wdXNoKG1haWwpXG5cdFx0fSBlbHNlIHtcblx0XHRcdG1vdmVNYWlscy5wdXNoKG1haWwpXG5cdFx0fVxuXHR9XG5cblx0bGV0IGNvbmZpcm1hdGlvblRleHRJZDogVHJhbnNsYXRpb25LZXkgfCBudWxsID0gbnVsbFxuXG5cdGlmICh0cmFzaE1haWxzLmxlbmd0aCA+IDApIHtcblx0XHRpZiAobW92ZU1haWxzLmxlbmd0aCA+IDApIHtcblx0XHRcdGNvbmZpcm1hdGlvblRleHRJZCA9IFwiZmluYWxseURlbGV0ZVNlbGVjdGVkRW1haWxzX21zZ1wiXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbmZpcm1hdGlvblRleHRJZCA9IFwiZmluYWxseURlbGV0ZUVtYWlsc19tc2dcIlxuXHRcdH1cblx0fVxuXG5cdGlmIChjb25maXJtYXRpb25UZXh0SWQgIT0gbnVsbCkge1xuXHRcdHJldHVybiBEaWFsb2cuY29uZmlybShjb25maXJtYXRpb25UZXh0SWQsIFwib2tfYWN0aW9uXCIpXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSh0cnVlKVxuXHR9XG59XG5cbi8qKlxuICogQHJldHVybiB3aGV0aGVyIGVtYWlscyB3ZXJlIGRlbGV0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb21wdEFuZERlbGV0ZU1haWxzKG1haWxNb2RlbDogTWFpbE1vZGVsLCBtYWlsczogUmVhZG9ubHlBcnJheTxNYWlsPiwgb25Db25maXJtOiAoKSA9PiB2b2lkKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdHJldHVybiBzaG93RGVsZXRlQ29uZmlybWF0aW9uRGlhbG9nKG1haWxzKS50aGVuKChjb25maXJtZWQpID0+IHtcblx0XHRpZiAoY29uZmlybWVkKSB7XG5cdFx0XHRvbkNvbmZpcm0oKVxuXHRcdFx0cmV0dXJuIG1haWxNb2RlbFxuXHRcdFx0XHQuZGVsZXRlTWFpbHMobWFpbHMpXG5cdFx0XHRcdC50aGVuKCgpID0+IHRydWUpXG5cdFx0XHRcdC5jYXRjaCgoZSkgPT4ge1xuXHRcdFx0XHRcdC8vTG9ja2VkRXJyb3Igc2hvdWxkIG5vIGxvbmdlciBiZSB0aHJvd24hPyFcblx0XHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFByZWNvbmRpdGlvbkZhaWxlZEVycm9yIHx8IGUgaW5zdGFuY2VvZiBMb2NrZWRFcnJvcikge1xuXHRcdFx0XHRcdFx0cmV0dXJuIERpYWxvZy5tZXNzYWdlKFwib3BlcmF0aW9uU3RpbGxBY3RpdmVfbXNnXCIpLnRoZW4oKCkgPT4gZmFsc2UpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpXG5cdFx0fVxuXHR9KVxufVxuXG5pbnRlcmZhY2UgTW92ZU1haWxzUGFyYW1zIHtcblx0bWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWxcblx0bWFpbE1vZGVsOiBNYWlsTW9kZWxcblx0bWFpbHM6IFJlYWRvbmx5QXJyYXk8TWFpbD5cblx0dGFyZ2V0TWFpbEZvbGRlcjogTWFpbEZvbGRlclxuXHRpc1JlcG9ydGFibGU/OiBib29sZWFuXG59XG5cbi8qKlxuICogTW92ZXMgdGhlIG1haWxzIGFuZCByZXBvcnRzIHRoZW0gYXMgc3BhbSBpZiB0aGUgdXNlciBvciBzZXR0aW5ncyBhbGxvdyBpdC5cbiAqIEByZXR1cm4gd2hldGhlciBtYWlscyB3ZXJlIGFjdHVhbGx5IG1vdmVkXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtb3ZlTWFpbHMoeyBtYWlsYm94TW9kZWwsIG1haWxNb2RlbCwgbWFpbHMsIHRhcmdldE1haWxGb2xkZXIsIGlzUmVwb3J0YWJsZSA9IHRydWUgfTogTW92ZU1haWxzUGFyYW1zKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdGNvbnN0IGRldGFpbHMgPSBhd2FpdCBtYWlsTW9kZWwuZ2V0TWFpbGJveERldGFpbHNGb3JNYWlsRm9sZGVyKHRhcmdldE1haWxGb2xkZXIpXG5cdGlmIChkZXRhaWxzID09IG51bGwgfHwgZGV0YWlscy5tYWlsYm94LmZvbGRlcnMgPT0gbnVsbCkge1xuXHRcdHJldHVybiBmYWxzZVxuXHR9XG5cdGNvbnN0IHN5c3RlbSA9IGF3YWl0IG1haWxNb2RlbC5nZXRNYWlsYm94Rm9sZGVyc0ZvcklkKGRldGFpbHMubWFpbGJveC5mb2xkZXJzLl9pZClcblx0cmV0dXJuIG1haWxNb2RlbFxuXHRcdC5tb3ZlTWFpbHMobWFpbHMsIHRhcmdldE1haWxGb2xkZXIpXG5cdFx0LnRoZW4oYXN5bmMgKCkgPT4ge1xuXHRcdFx0aWYgKGlzT2ZUeXBlT3JTdWJmb2xkZXJPZihzeXN0ZW0sIHRhcmdldE1haWxGb2xkZXIsIE1haWxTZXRLaW5kLlNQQU0pICYmIGlzUmVwb3J0YWJsZSkge1xuXHRcdFx0XHRjb25zdCByZXBvcnRhYmxlTWFpbHMgPSBtYWlscy5tYXAoKG1haWwpID0+IHtcblx0XHRcdFx0XHQvLyBtYWlscyBoYXZlIGp1c3QgYmVlbiBtb3ZlZFxuXHRcdFx0XHRcdGNvbnN0IHJlcG9ydGFibGVNYWlsID0gY3JlYXRlTWFpbChtYWlsKVxuXHRcdFx0XHRcdHJlcG9ydGFibGVNYWlsLl9pZCA9IHRhcmdldE1haWxGb2xkZXIuaXNNYWlsU2V0ID8gbWFpbC5faWQgOiBbdGFyZ2V0TWFpbEZvbGRlci5tYWlscywgZ2V0RWxlbWVudElkKG1haWwpXVxuXHRcdFx0XHRcdHJldHVybiByZXBvcnRhYmxlTWFpbFxuXHRcdFx0XHR9KVxuXHRcdFx0XHRjb25zdCBtYWlsYm94RGV0YWlscyA9IGF3YWl0IG1haWxib3hNb2RlbC5nZXRNYWlsYm94RGV0YWlsc0Zvck1haWxHcm91cChhc3NlcnROb3ROdWxsKHRhcmdldE1haWxGb2xkZXIuX293bmVyR3JvdXApKVxuXHRcdFx0XHRhd2FpdCByZXBvcnRNYWlsc0F1dG9tYXRpY2FsbHkoTWFpbFJlcG9ydFR5cGUuU1BBTSwgbWFpbGJveE1vZGVsLCBtYWlsTW9kZWwsIG1haWxib3hEZXRhaWxzLCByZXBvcnRhYmxlTWFpbHMpXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fSlcblx0XHQuY2F0Y2goKGUpID0+IHtcblx0XHRcdC8vTG9ja2VkRXJyb3Igc2hvdWxkIG5vIGxvbmdlciBiZSB0aHJvd24hPyFcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgTG9ja2VkRXJyb3IgfHwgZSBpbnN0YW5jZW9mIFByZWNvbmRpdGlvbkZhaWxlZEVycm9yKSB7XG5cdFx0XHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShcIm9wZXJhdGlvblN0aWxsQWN0aXZlX21zZ1wiKS50aGVuKCgpID0+IGZhbHNlKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcmNoaXZlTWFpbHMobWFpbHM6IE1haWxbXSk6IFByb21pc2U8dm9pZD4ge1xuXHRpZiAobWFpbHMubGVuZ3RoID4gMCkge1xuXHRcdC8vIGFzc3VtZSBhbGwgbWFpbHMgaW4gdGhlIGFycmF5IGJlbG9uZyB0byB0aGUgc2FtZSBNYWlsYm94XG5cdFx0cmV0dXJuIG1haWxMb2NhdG9yLm1haWxNb2RlbC5nZXRNYWlsYm94Rm9sZGVyc0Zvck1haWwobWFpbHNbMF0pLnRoZW4oKGZvbGRlcnM6IEZvbGRlclN5c3RlbSkgPT4ge1xuXHRcdFx0aWYgKGZvbGRlcnMpIHtcblx0XHRcdFx0bW92ZU1haWxzKHtcblx0XHRcdFx0XHRtYWlsYm94TW9kZWw6IGxvY2F0b3IubWFpbGJveE1vZGVsLFxuXHRcdFx0XHRcdG1haWxNb2RlbDogbWFpbExvY2F0b3IubWFpbE1vZGVsLFxuXHRcdFx0XHRcdG1haWxzOiBtYWlscyxcblx0XHRcdFx0XHR0YXJnZXRNYWlsRm9sZGVyOiBhc3NlcnRTeXN0ZW1Gb2xkZXJPZlR5cGUoZm9sZGVycywgTWFpbFNldEtpbmQuQVJDSElWRSksXG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0fSlcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbW92ZVRvSW5ib3gobWFpbHM6IE1haWxbXSk6IFByb21pc2U8YW55PiB7XG5cdGlmIChtYWlscy5sZW5ndGggPiAwKSB7XG5cdFx0Ly8gYXNzdW1lIGFsbCBtYWlscyBpbiB0aGUgYXJyYXkgYmVsb25nIHRvIHRoZSBzYW1lIE1haWxib3hcblx0XHRyZXR1cm4gbWFpbExvY2F0b3IubWFpbE1vZGVsLmdldE1haWxib3hGb2xkZXJzRm9yTWFpbChtYWlsc1swXSkudGhlbigoZm9sZGVyczogRm9sZGVyU3lzdGVtKSA9PiB7XG5cdFx0XHRpZiAoZm9sZGVycykge1xuXHRcdFx0XHRtb3ZlTWFpbHMoe1xuXHRcdFx0XHRcdG1haWxib3hNb2RlbDogbG9jYXRvci5tYWlsYm94TW9kZWwsXG5cdFx0XHRcdFx0bWFpbE1vZGVsOiBtYWlsTG9jYXRvci5tYWlsTW9kZWwsXG5cdFx0XHRcdFx0bWFpbHM6IG1haWxzLFxuXHRcdFx0XHRcdHRhcmdldE1haWxGb2xkZXI6IGFzc2VydFN5c3RlbUZvbGRlck9mVHlwZShmb2xkZXJzLCBNYWlsU2V0S2luZC5JTkJPWCksXG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0fSlcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Rm9sZGVySWNvbkJ5VHlwZShmb2xkZXJUeXBlOiBNYWlsU2V0S2luZCk6IEFsbEljb25zIHtcblx0c3dpdGNoIChmb2xkZXJUeXBlKSB7XG5cdFx0Y2FzZSBNYWlsU2V0S2luZC5DVVNUT006XG5cdFx0XHRyZXR1cm4gSWNvbnMuRm9sZGVyXG5cblx0XHRjYXNlIE1haWxTZXRLaW5kLklOQk9YOlxuXHRcdFx0cmV0dXJuIEljb25zLkluYm94XG5cblx0XHRjYXNlIE1haWxTZXRLaW5kLlNFTlQ6XG5cdFx0XHRyZXR1cm4gSWNvbnMuU2VuZFxuXG5cdFx0Y2FzZSBNYWlsU2V0S2luZC5UUkFTSDpcblx0XHRcdHJldHVybiBJY29ucy5UcmFzaEJpblxuXG5cdFx0Y2FzZSBNYWlsU2V0S2luZC5BUkNISVZFOlxuXHRcdFx0cmV0dXJuIEljb25zLkFyY2hpdmVcblxuXHRcdGNhc2UgTWFpbFNldEtpbmQuU1BBTTpcblx0XHRcdHJldHVybiBJY29ucy5TcGFtXG5cblx0XHRjYXNlIE1haWxTZXRLaW5kLkRSQUZUOlxuXHRcdFx0cmV0dXJuIEljb25zLkRyYWZ0XG5cblx0XHRkZWZhdWx0OlxuXHRcdFx0cmV0dXJuIEljb25zLkZvbGRlclxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGb2xkZXJJY29uKGZvbGRlcjogTWFpbEZvbGRlcik6IEFsbEljb25zIHtcblx0cmV0dXJuIGdldEZvbGRlckljb25CeVR5cGUoZ2V0TWFpbEZvbGRlclR5cGUoZm9sZGVyKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1haWxGb2xkZXJJY29uKG1haWw6IE1haWwpOiBBbGxJY29ucyB7XG5cdGxldCBmb2xkZXIgPSBtYWlsTG9jYXRvci5tYWlsTW9kZWwuZ2V0TWFpbEZvbGRlckZvck1haWwobWFpbClcblxuXHRpZiAoZm9sZGVyKSB7XG5cdFx0cmV0dXJuIGdldEZvbGRlckljb24oZm9sZGVyKVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBJY29ucy5Gb2xkZXJcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVwbGFjZUNpZHNXaXRoSW5saW5lSW1hZ2VzKFxuXHRkb206IEhUTUxFbGVtZW50LFxuXHRpbmxpbmVJbWFnZXM6IElubGluZUltYWdlcyxcblx0b25Db250ZXh0OiAoY2lkOiBzdHJpbmcsIGFyZzE6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50LCBhcmcyOiBIVE1MRWxlbWVudCkgPT4gdW5rbm93bixcbik6IEFycmF5PEhUTUxFbGVtZW50PiB7XG5cdC8vIGFsbCBpbWFnZSB0YWdzIHdoaWNoIGhhdmUgY2lkIGF0dHJpYnV0ZS4gVGhlIGNpZCBhdHRyaWJ1dGUgaGFzIGJlZW4gc2V0IGJ5IHRoZSBzYW5pdGl6ZXIgZm9yIGFkZGluZyBhIGRlZmF1bHQgaW1hZ2UuXG5cdGNvbnN0IGltYWdlRWxlbWVudHM6IEFycmF5PEhUTUxFbGVtZW50PiA9IEFycmF5LmZyb20oZG9tLnF1ZXJ5U2VsZWN0b3JBbGwoXCJpbWdbY2lkXVwiKSlcblx0aWYgKGRvbS5zaGFkb3dSb290KSB7XG5cdFx0Y29uc3Qgc2hhZG93SW1hZ2VFbGVtZW50czogQXJyYXk8SFRNTEVsZW1lbnQ+ID0gQXJyYXkuZnJvbShkb20uc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yQWxsKFwiaW1nW2NpZF1cIikpXG5cdFx0aW1hZ2VFbGVtZW50cy5wdXNoKC4uLnNoYWRvd0ltYWdlRWxlbWVudHMpXG5cdH1cblx0Y29uc3QgZWxlbWVudHNXaXRoQ2lkOiBIVE1MRWxlbWVudFtdID0gW11cblx0Zm9yIChjb25zdCBpbWFnZUVsZW1lbnQgb2YgaW1hZ2VFbGVtZW50cykge1xuXHRcdGNvbnN0IGNpZCA9IGltYWdlRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJjaWRcIilcblxuXHRcdGlmIChjaWQpIHtcblx0XHRcdGNvbnN0IGlubGluZUltYWdlID0gaW5saW5lSW1hZ2VzLmdldChjaWQpXG5cblx0XHRcdGlmIChpbmxpbmVJbWFnZSkge1xuXHRcdFx0XHRlbGVtZW50c1dpdGhDaWQucHVzaChpbWFnZUVsZW1lbnQpXG5cdFx0XHRcdGltYWdlRWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgaW5saW5lSW1hZ2Uub2JqZWN0VXJsKVxuXHRcdFx0XHRpbWFnZUVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcInR1dGFub3RhLXBsYWNlaG9sZGVyXCIpXG5cblx0XHRcdFx0aWYgKGlzQXBwKCkpIHtcblx0XHRcdFx0XHQvLyBBZGQgbG9uZyBwcmVzcyBhY3Rpb24gZm9yIGFwcHNcblx0XHRcdFx0XHRsZXQgdGltZW91dElkOiBUaW1lb3V0SUQgfCBudWxsXG5cdFx0XHRcdFx0bGV0IHN0YXJ0Q29vcmRzOlxuXHRcdFx0XHRcdFx0fCB7XG5cdFx0XHRcdFx0XHRcdFx0eDogbnVtYmVyXG5cdFx0XHRcdFx0XHRcdFx0eTogbnVtYmVyXG5cdFx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHRcdHwgbnVsbFxuXHRcdFx0XHRcdFx0fCB1bmRlZmluZWRcblx0XHRcdFx0XHRpbWFnZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGU6IFRvdWNoRXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHRvdWNoID0gZS50b3VjaGVzWzBdXG5cdFx0XHRcdFx0XHRpZiAoIXRvdWNoKSByZXR1cm5cblx0XHRcdFx0XHRcdHN0YXJ0Q29vcmRzID0ge1xuXHRcdFx0XHRcdFx0XHR4OiB0b3VjaC5jbGllbnRYLFxuXHRcdFx0XHRcdFx0XHR5OiB0b3VjaC5jbGllbnRZLFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYgKHRpbWVvdXRJZCkgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZClcblx0XHRcdFx0XHRcdHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRvbkNvbnRleHQoaW5saW5lSW1hZ2UuY2lkLCBlLCBpbWFnZUVsZW1lbnQpXG5cdFx0XHRcdFx0XHR9LCA4MDApXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRpbWFnZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZTogVG91Y2hFdmVudCkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgdG91Y2ggPSBlLnRvdWNoZXNbMF1cblx0XHRcdFx0XHRcdGlmICghdG91Y2ggfHwgIXN0YXJ0Q29vcmRzIHx8ICF0aW1lb3V0SWQpIHJldHVyblxuXG5cdFx0XHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0XHRcdE1hdGguYWJzKHRvdWNoLmNsaWVudFggLSBzdGFydENvb3Jkcy54KSA+IFBpbmNoWm9vbS5EUkFHX1RIUkVTSE9MRCB8fFxuXHRcdFx0XHRcdFx0XHRNYXRoLmFicyh0b3VjaC5jbGllbnRZIC0gc3RhcnRDb29yZHMueSkgPiBQaW5jaFpvb20uRFJBR19USFJFU0hPTERcblx0XHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0XHRjbGVhclRpbWVvdXQodGltZW91dElkKVxuXHRcdFx0XHRcdFx0XHR0aW1lb3V0SWQgPSBudWxsXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRpbWFnZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsICgpID0+IHtcblx0XHRcdFx0XHRcdGlmICh0aW1lb3V0SWQpIHtcblx0XHRcdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXRJZClcblx0XHRcdFx0XHRcdFx0dGltZW91dElkID0gbnVsbFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaXNEZXNrdG9wKCkpIHtcblx0XHRcdFx0XHQvLyBhZGQgcmlnaHQgY2xpY2sgYWN0aW9uIGZvciBkZXNrdG9wIGFwcHNcblx0XHRcdFx0XHRpbWFnZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlOiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRvbkNvbnRleHQoaW5saW5lSW1hZ2UuY2lkLCBlLCBpbWFnZUVsZW1lbnQpXG5cdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiBlbGVtZW50c1dpdGhDaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VJbmxpbmVJbWFnZXNXaXRoQ2lkcyhkb206IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQge1xuXHRjb25zdCBkb21DbG9uZSA9IGRvbS5jbG9uZU5vZGUodHJ1ZSkgYXMgSFRNTEVsZW1lbnRcblx0Y29uc3QgaW5saW5lSW1hZ2VzOiBBcnJheTxIVE1MRWxlbWVudD4gPSBBcnJheS5mcm9tKGRvbUNsb25lLnF1ZXJ5U2VsZWN0b3JBbGwoXCJpbWdbY2lkXVwiKSlcblx0Zm9yIChjb25zdCBpbmxpbmVJbWFnZSBvZiBpbmxpbmVJbWFnZXMpIHtcblx0XHRjb25zdCBjaWQgPSBpbmxpbmVJbWFnZS5nZXRBdHRyaWJ1dGUoXCJjaWRcIilcblx0XHRpbmxpbmVJbWFnZS5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCJjaWQ6XCIgKyAoY2lkIHx8IFwiXCIpKVxuXHRcdGlubGluZUltYWdlLnJlbW92ZUF0dHJpYnV0ZShcImNpZFwiKVxuXHR9XG5cdHJldHVybiBkb21DbG9uZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSW5saW5lSW1hZ2UoZmlsZTogRGF0YUZpbGUpOiBJbmxpbmVJbWFnZVJlZmVyZW5jZSB7XG5cdGNvbnN0IGNpZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzApLnN1YnN0cmluZygyKVxuXHRmaWxlLmNpZCA9IGNpZFxuXHRyZXR1cm4gY3JlYXRlSW5saW5lSW1hZ2VSZWZlcmVuY2UoZmlsZSwgY2lkKVxufVxuXG5mdW5jdGlvbiBjcmVhdGVJbmxpbmVJbWFnZVJlZmVyZW5jZShmaWxlOiBEYXRhRmlsZSwgY2lkOiBzdHJpbmcpOiBJbmxpbmVJbWFnZVJlZmVyZW5jZSB7XG5cdGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbZmlsZS5kYXRhXSwge1xuXHRcdHR5cGU6IGZpbGUubWltZVR5cGUsXG5cdH0pXG5cdGNvbnN0IG9iamVjdFVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYilcblx0cmV0dXJuIHtcblx0XHRjaWQsXG5cdFx0b2JqZWN0VXJsLFxuXHRcdGJsb2IsXG5cdH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRJbmxpbmVJbWFnZXMoZmlsZUNvbnRyb2xsZXI6IEZpbGVDb250cm9sbGVyLCBhdHRhY2htZW50czogQXJyYXk8VHV0YW5vdGFGaWxlPiwgcmVmZXJlbmNlZENpZHM6IEFycmF5PHN0cmluZz4pOiBQcm9taXNlPElubGluZUltYWdlcz4ge1xuXHRjb25zdCBmaWxlc1RvTG9hZCA9IGdldFJlZmVyZW5jZWRBdHRhY2htZW50cyhhdHRhY2htZW50cywgcmVmZXJlbmNlZENpZHMpXG5cdGNvbnN0IGlubGluZUltYWdlcyA9IG5ldyBNYXAoKVxuXHRyZXR1cm4gcHJvbWlzZU1hcChmaWxlc1RvTG9hZCwgYXN5bmMgKGZpbGUpID0+IHtcblx0XHRsZXQgZGF0YUZpbGUgPSBhd2FpdCBmaWxlQ29udHJvbGxlci5nZXRBc0RhdGFGaWxlKGZpbGUpXG5cdFx0Y29uc3QgeyBodG1sU2FuaXRpemVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vbWlzYy9IdG1sU2FuaXRpemVyXCIpXG5cdFx0ZGF0YUZpbGUgPSBodG1sU2FuaXRpemVyLnNhbml0aXplSW5saW5lQXR0YWNobWVudChkYXRhRmlsZSlcblx0XHRjb25zdCBpbmxpbmVJbWFnZVJlZmVyZW5jZSA9IGNyZWF0ZUlubGluZUltYWdlUmVmZXJlbmNlKGRhdGFGaWxlLCBuZXZlck51bGwoZmlsZS5jaWQpKVxuXHRcdGlubGluZUltYWdlcy5zZXQoaW5saW5lSW1hZ2VSZWZlcmVuY2UuY2lkLCBpbmxpbmVJbWFnZVJlZmVyZW5jZSlcblx0fSkudGhlbigoKSA9PiBpbmxpbmVJbWFnZXMpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZWZlcmVuY2VkQXR0YWNobWVudHMoYXR0YWNobWVudHM6IEFycmF5PFR1dGFub3RhRmlsZT4sIHJlZmVyZW5jZWRDaWRzOiBBcnJheTxzdHJpbmc+KTogQXJyYXk8VHV0YW5vdGFGaWxlPiB7XG5cdHJldHVybiBhdHRhY2htZW50cy5maWx0ZXIoKGZpbGUpID0+IHJlZmVyZW5jZWRDaWRzLmZpbmQoKHJjaWQpID0+IGZpbGUuY2lkID09PSByY2lkKSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNob3dNb3ZlTWFpbHNEcm9wZG93bihcblx0bWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWwsXG5cdG1vZGVsOiBNYWlsTW9kZWwsXG5cdG9yaWdpbjogUG9zUmVjdCxcblx0bWFpbHM6IHJlYWRvbmx5IE1haWxbXSxcblx0b3B0cz86IHsgd2lkdGg/OiBudW1iZXI7IHdpdGhCYWNrZ3JvdW5kPzogYm9vbGVhbjsgb25TZWxlY3RlZD86ICgpID0+IHVua25vd24gfSxcbik6IFByb21pc2U8dm9pZD4ge1xuXHRjb25zdCBmb2xkZXJzID0gYXdhaXQgZ2V0TW92ZVRhcmdldEZvbGRlclN5c3RlbXMobW9kZWwsIG1haWxzKVxuXHRhd2FpdCBzaG93TWFpbEZvbGRlckRyb3Bkb3duKFxuXHRcdG9yaWdpbixcblx0XHRmb2xkZXJzLFxuXHRcdChmKSA9PlxuXHRcdFx0bW92ZU1haWxzKHtcblx0XHRcdFx0bWFpbGJveE1vZGVsLFxuXHRcdFx0XHRtYWlsTW9kZWw6IG1vZGVsLFxuXHRcdFx0XHRtYWlsczogbWFpbHMsXG5cdFx0XHRcdHRhcmdldE1haWxGb2xkZXI6IGYuZm9sZGVyLFxuXHRcdFx0fSksXG5cdFx0b3B0cyxcblx0KVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvd01haWxGb2xkZXJEcm9wZG93bihcblx0b3JpZ2luOiBQb3NSZWN0LFxuXHRmb2xkZXJzOiByZWFkb25seSBGb2xkZXJJbmZvW10sXG5cdG9uQ2xpY2s6IChmb2xkZXI6IEluZGVudGVkRm9sZGVyKSA9PiB1bmtub3duLFxuXHRvcHRzPzogeyB3aWR0aD86IG51bWJlcjsgd2l0aEJhY2tncm91bmQ/OiBib29sZWFuOyBvblNlbGVjdGVkPzogKCkgPT4gdW5rbm93biB9LFxuKTogUHJvbWlzZTx2b2lkPiB7XG5cdGNvbnN0IHsgd2lkdGggPSAzMDAsIHdpdGhCYWNrZ3JvdW5kID0gZmFsc2UsIG9uU2VsZWN0ZWQgPSBub09wIH0gPSBvcHRzID8/IHt9XG5cblx0aWYgKGZvbGRlcnMubGVuZ3RoID09PSAwKSByZXR1cm5cblx0Y29uc3QgZm9sZGVyQnV0dG9ucyA9IGZvbGRlcnMubWFwKFxuXHRcdChmKSA9PlxuXHRcdFx0KHtcblx0XHRcdFx0Ly8gV2UgbmVlZCB0byBwYXNzIGluIHRoZSByYXcgZm9sZGVyIG5hbWUgdG8gYXZvaWQgaW5jbHVkaW5nIGl0IGluIHNlYXJjaGVzXG5cdFx0XHRcdGxhYmVsOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcblx0XHRcdFx0XHRgZHJvcGRvd24tZm9sZGVyOiR7Z2V0Rm9sZGVyTmFtZShmLmZvbGRlcil9YCxcblx0XHRcdFx0XHRsYW5nLmdldChcImZvbGRlckRlcHRoX2xhYmVsXCIsIHtcblx0XHRcdFx0XHRcdFwie2ZvbGRlck5hbWV9XCI6IGdldEZvbGRlck5hbWUoZi5mb2xkZXIpLFxuXHRcdFx0XHRcdFx0XCJ7ZGVwdGh9XCI6IGYubGV2ZWwsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdCksXG5cdFx0XHRcdHRleHQ6IGxhbmcubWFrZVRyYW5zbGF0aW9uKFwiZm9sZGVyX25hbWVcIiwgZ2V0SW5kZW50ZWRGb2xkZXJOYW1lRm9yRHJvcGRvd24oZikpLFxuXHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdG9uU2VsZWN0ZWQoKVxuXHRcdFx0XHRcdG9uQ2xpY2soZilcblx0XHRcdFx0fSxcblx0XHRcdFx0aWNvbjogZ2V0Rm9sZGVySWNvbihmLmZvbGRlciksXG5cdFx0XHR9IHNhdGlzZmllcyBEcm9wZG93bkNoaWxkQXR0cnMpLFxuXHQpXG5cblx0Y29uc3QgZHJvcGRvd24gPSBuZXcgRHJvcGRvd24oKCkgPT4gZm9sZGVyQnV0dG9ucywgd2lkdGgpXG5cdGRyb3Bkb3duLnNldE9yaWdpbihuZXcgRG9tUmVjdFJlYWRPbmx5UG9seWZpbGxlZChvcmlnaW4ubGVmdCwgb3JpZ2luLnRvcCwgb3JpZ2luLndpZHRoLCBvcmlnaW4uaGVpZ2h0KSlcblx0bW9kYWwuZGlzcGxheVVuaXF1ZShkcm9wZG93biwgd2l0aEJhY2tncm91bmQpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb252ZXJzYXRpb25UaXRsZShjb252ZXJzYXRpb25WaWV3TW9kZWw6IENvbnZlcnNhdGlvblZpZXdNb2RlbCk6IFRyYW5zbGF0aW9uIHtcblx0aWYgKCFjb252ZXJzYXRpb25WaWV3TW9kZWwuaXNGaW5pc2hlZCgpKSB7XG5cdFx0cmV0dXJuIGxhbmcuZ2V0VHJhbnNsYXRpb24oXCJsb2FkaW5nX21zZ1wiKVxuXHR9XG5cdGNvbnN0IG51bWJlck9mRW1haWxzID0gY29udmVyc2F0aW9uVmlld01vZGVsLmNvbnZlcnNhdGlvbkl0ZW1zKCkubGVuZ3RoXG5cdGlmIChudW1iZXJPZkVtYWlscyA9PT0gMSkge1xuXHRcdHJldHVybiBsYW5nLmdldFRyYW5zbGF0aW9uKFwib25lRW1haWxfbGFiZWxcIilcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gbGFuZy5nZXRUcmFuc2xhdGlvbihcIm5ick9yRW1haWxzX2xhYmVsXCIsIHsgXCJ7bnVtYmVyfVwiOiBudW1iZXJPZkVtYWlscyB9KVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb3ZlTWFpbEJvdW5kcygpOiBQb3NSZWN0IHtcblx0Ly8ganVzdCBwdXR0aW5nIHRoZSBtb3ZlIG1haWwgZHJvcGRvd24gaW4gdGhlIGxlZnQgc2lkZSBvZiB0aGUgdmlld3BvcnQgd2l0aCBhIGJpdCBvZiBtYXJnaW5cblx0cmV0dXJuIG5ldyBEb21SZWN0UmVhZE9ubHlQb2x5ZmlsbGVkKHNpemUuaHBhZF9sYXJnZSwgc2l6ZS52cGFkX2xhcmdlLCAwLCAwKVxufVxuXG4vKipcbiAqIE5PVEU6IERPRVMgTk9UIFZFUklGWSBJRiBUSEUgTUVTU0FHRSBJUyBBVVRIRU5USUMgLSBETyBOT1QgVVNFIFRISVMgT1VUU0lERSBPRiBUSElTIEZJTEUgT1IgRk9SIFRFU1RJTkdcbiAqIEBWaXNpYmxlRm9yVGVzdGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gaXNUdXRhbm90YVRlYW1BZGRyZXNzKGFkZHJlc3M6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRyZXR1cm4gZW5kc1dpdGgoYWRkcmVzcywgXCJAdHV0YW8uZGVcIikgfHwgYWRkcmVzcyA9PT0gXCJuby1yZXBseUB0dXRhbm90YS5kZVwiXG59XG5cbi8qKlxuICogSXMgdGhpcyBhIHR1dGFvIHRlYW0gbWVtYmVyIGVtYWlsIG9yIGEgc3lzdGVtIG5vdGlmaWNhdGlvblxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNUdXRhbm90YVRlYW1NYWlsKG1haWw6IE1haWwpOiBib29sZWFuIHtcblx0Y29uc3QgeyBjb25maWRlbnRpYWwsIHNlbmRlciwgc3RhdGUgfSA9IG1haWxcblx0cmV0dXJuIChcblx0XHRjb25maWRlbnRpYWwgJiZcblx0XHRzdGF0ZSA9PT0gTWFpbFN0YXRlLlJFQ0VJVkVEICYmXG5cdFx0aGFzVmFsaWRFbmNyeXB0aW9uQXV0aEZvclRlYW1PclN5c3RlbU1haWwobWFpbCkgJiZcblx0XHQoc2VuZGVyLmFkZHJlc3MgPT09IFNZU1RFTV9HUk9VUF9NQUlMX0FERFJFU1MgfHwgaXNUdXRhbm90YVRlYW1BZGRyZXNzKHNlbmRlci5hZGRyZXNzKSlcblx0KVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGNvbmZpZGVudGlhbCBpY29uIGZvciB0aGUgZ2l2ZW4gbWFpbCB3aGljaCBpbmRpY2F0ZXMgZWl0aGVyIFJTQSBvciBQUSBlbmNyeXB0aW9uLlxuICogVGhlIGNhbGxlciBtdXN0IGVuc3VyZSB0aGF0IHRoZSBtYWlsIGlzIGluIGEgY29uZmlkZW50aWFsIHN0YXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlkZW50aWFsSWNvbihtYWlsOiBNYWlsKTogSWNvbnMge1xuXHRpZiAoIW1haWwuY29uZmlkZW50aWFsKSB0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIm1haWwgaXMgbm90IGNvbmZpZGVudGlhbFwiKVxuXHRpZiAoXG5cdFx0bWFpbC5lbmNyeXB0aW9uQXV0aFN0YXR1cyA9PSBFbmNyeXB0aW9uQXV0aFN0YXR1cy5UVVRBQ1JZUFRfQVVUSEVOVElDQVRJT05fU1VDQ0VFREVEIHx8XG5cdFx0bWFpbC5lbmNyeXB0aW9uQXV0aFN0YXR1cyA9PSBFbmNyeXB0aW9uQXV0aFN0YXR1cy5UVVRBQ1JZUFRfQVVUSEVOVElDQVRJT05fRkFJTEVEIHx8XG5cdFx0bWFpbC5lbmNyeXB0aW9uQXV0aFN0YXR1cyA9PSBFbmNyeXB0aW9uQXV0aFN0YXR1cy5UVVRBQ1JZUFRfU0VOREVSXG5cdCkge1xuXHRcdHJldHVybiBJY29ucy5QUUxvY2tcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gSWNvbnMuTG9ja1xuXHR9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY29uZmlkZW50aWFsIGZvbnQgaWNvbiBmb3IgdGhlIGdpdmVuIG1haWwgd2hpY2ggaW5kaWNhdGVzIGVpdGhlciBSU0Egb3IgUFEgZW5jcnlwdGlvbi5cbiAqIFRoZSBjYWxsZXIgbXVzdCBlbnN1cmUgdGhhdCB0aGUgbWFpbCBpcyBpbiBhIGNvbmZpZGVudGlhbCBzdGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENvbmZpZGVudGlhbEZvbnRJY29uKG1haWw6IE1haWwpOiBzdHJpbmcge1xuXHRjb25zdCBjb25maWRlbnRpYWxJY29uID0gZ2V0Q29uZmlkZW50aWFsSWNvbihtYWlsKVxuXHRyZXR1cm4gY29uZmlkZW50aWFsSWNvbiA9PT0gSWNvbnMuUFFMb2NrID8gRm9udEljb25zLlBRQ29uZmlkZW50aWFsIDogRm9udEljb25zLkNvbmZpZGVudGlhbFxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNNYWlsQ29udHJhc3RGaXhOZWVkZWQoZWRpdG9yRG9tOiBQYXJlbnROb2RlKTogYm9vbGVhbiB7XG5cdHJldHVybiAoXG5cdFx0QXJyYXkuZnJvbShlZGl0b3JEb20ucXVlcnlTZWxlY3RvckFsbChcIipbc3R5bGVdXCIpLCAoZSkgPT4gKGUgYXMgSFRNTEVsZW1lbnQpLnN0eWxlKS5zb21lKFxuXHRcdFx0KHMpID0+IChzLmNvbG9yICYmIHMuY29sb3IgIT09IFwiaW5oZXJpdFwiKSB8fCAocy5iYWNrZ3JvdW5kQ29sb3IgJiYgcy5iYWNrZ3JvdW5kQ29sb3IgIT09IFwiaW5oZXJpdFwiKSxcblx0XHQpIHx8IGVkaXRvckRvbS5xdWVyeVNlbGVjdG9yQWxsKFwiZm9udFtjb2xvcl1cIikubGVuZ3RoID4gMFxu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