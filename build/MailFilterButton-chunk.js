import { __toESM } from "./chunk-chunk.js";
import { assertMainOrNode, isAndroidApp, isApp, isDesktop, isIOSApp } from "./Env-chunk.js";
import { client, companyTeamLabel } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { LazyLoaded, assertNonNull, assertNotNull, defer, isNotNull, noOp, ofClass, resolveMaybeLazy } from "./dist2-chunk.js";
import { InfoLink, lang } from "./LanguageViewModel-chunk.js";
import { styles } from "./styles-chunk.js";
import { theme } from "./theme-chunk.js";
import { CalendarAttendeeStatus, CalendarMethod, EncryptionAuthStatus, FeatureType, InboxRuleType, Keys, MAX_LABELS_PER_MAIL, MailAuthenticationStatus, MailSetKind, SpamRuleFieldType, SpamRuleType, TabIndex } from "./TutanotaConstants-chunk.js";
import { focusNext, focusPrevious, isKeyPressed, keyManager } from "./KeyManager-chunk.js";
import { windowFacade } from "./WindowFacade-chunk.js";
import { modal } from "./RootView-chunk.js";
import { px, size } from "./size-chunk.js";
import { elementIdPart, getElementId, isSameId } from "./EntityUtils-chunk.js";
import { findAttendeeInAddresses } from "./CommonCalendarUtils-chunk.js";
import { createEmailSenderListElement } from "./TypeRefs2-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { CancelledError } from "./CancelledError-chunk.js";
import { BaseButton, Button, ButtonType } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { DROPDOWN_MARGIN, Dialog, DialogType, Dropdown, canSeeTutaLinks, createAsyncDropdown, createDropdown, getCoordsOfMouseOrTouchEvent, showDropdown, showDropdownAtPosition } from "./Dialog-chunk.js";
import { BootIcons, Icon, IconSize, progressIcon } from "./Icon-chunk.js";
import { AriaRole, liveDataAttrs } from "./AriaUtils-chunk.js";
import { IconButton } from "./IconButton-chunk.js";
import { formatDateWithWeekday, formatDateWithWeekdayAndYear, formatStorageSize, formatTime } from "./Formatter-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import { createNewContact, getMailAddressDisplayText } from "./SharedMailUtils-chunk.js";
import { ToggleButton } from "./ToggleButton-chunk.js";
import { ColumnEmptyMessageBox, IconMessageBox } from "./ColumnEmptyMessageBox-chunk.js";
import { BannerType, InfoBanner } from "./InfoBanner-chunk.js";
import { ExpanderButton, ExpanderPanel } from "./Expander-chunk.js";
import { copyToClipboard } from "./ClipboardUtils-chunk.js";
import { showUserError } from "./ErrorHandlerImpl-chunk.js";
import { ReplyResult } from "./CalendarInvites-chunk.js";
import { isNewMailActionAvailable } from "./MobileHeader-chunk.js";
import { LabelState, mailLocator } from "./mailLocator-chunk.js";
import { MobileBottomActionBar, responsiveCardHMargin, responsiveCardHPadding } from "./SidebarSectionRow-chunk.js";
import { ColumnWidth, Table } from "./Table-chunk.js";
import { AttachmentBubble, getAttachmentType } from "./AttachmentBubble-chunk.js";
import { PinchZoom, getConfidentialIcon, getFolderIconByType, isTutanotaTeamMail, promptAndDeleteMails, replaceCidsWithInlineImages, showMoveMailsDropdown } from "./MailGuiUtils-chunk.js";
import { allInSameMailbox, getExistingRuleForType } from "./MailUtils-chunk.js";
import { ContentBlockingStatus, MailFilterType, editDraft, exportMails, isRepliedTo, mailViewerMoreActions, showHeaderDialog, showSourceDialog } from "./MailViewerViewModel-chunk.js";
import { Badge } from "./Badge-chunk.js";
import { Label, getLabelColor } from "./MailRow-chunk.js";

//#region src/mail-app/mail/view/MultiItemViewer.ts
assertMainOrNode();
var MultiItemViewer = class {
	view({ attrs }) {
		const { selectedEntities } = attrs;
		return [mithril_default(".flex.col.fill-absolute", mithril_default(".flex-grow.rel.overflow-hidden", mithril_default(ColumnEmptyMessageBox, {
			message: attrs.getSelectionMessage(selectedEntities),
			icon: BootIcons.Mail,
			color: theme.content_message_bg,
			backgroundColor: theme.navigation_bg,
			bottomContent: this.renderEmptyMessageButtons(attrs)
		})))];
	}
	renderEmptyMessageButtons({ loadingAll, stopLoadAll, selectedEntities, selectNone, loadAll }) {
		return loadingAll === "loading" ? mithril_default(".flex.items-center", [mithril_default(Button, {
			label: "cancel_action",
			type: ButtonType.Secondary,
			click: () => {
				stopLoadAll();
			}
		}), mithril_default(".flex.items-center.plr-button", progressIcon())]) : selectedEntities.length === 0 ? null : mithril_default(".flex", [mithril_default(Button, {
			label: "cancel_action",
			type: ButtonType.Secondary,
			click: () => {
				selectNone();
			}
		}), loadingAll === "can_load" ? mithril_default(Button, {
			label: "loadAll_action",
			type: ButtonType.Secondary,
			click: () => {
				loadAll();
			}
		}) : null]);
	}
};
function getMailSelectionMessage(selectedEntities) {
	let nbrOfSelectedMails = selectedEntities.length;
	if (nbrOfSelectedMails === 0) return lang.getTranslation("noMail_msg");
else if (nbrOfSelectedMails === 1) return lang.getTranslation("oneMailSelected_msg");
else return lang.getTranslation("nbrOfMailsSelected_msg", { "{1}": nbrOfSelectedMails });
}

//#endregion
//#region src/mail-app/mail/view/LabelsPopup.ts
var LabelsPopup = class {
	dom = null;
	isMaxLabelsReached;
	constructor(sourceElement, origin, width, labelsForMails, labels, onLabelsApplied) {
		this.sourceElement = sourceElement;
		this.origin = origin;
		this.width = width;
		this.labelsForMails = labelsForMails;
		this.labels = labels;
		this.onLabelsApplied = onLabelsApplied;
		this.view = this.view.bind(this);
		this.oncreate = this.oncreate.bind(this);
		this.isMaxLabelsReached = this.checkIsMaxLabelsReached();
	}
	async hideAnimation() {}
	onClose() {
		modal.remove(this);
	}
	shortcuts() {
		return this.shortCuts;
	}
	backgroundClick(e) {
		modal.remove(this);
	}
	popState(e) {
		return true;
	}
	callingElement() {
		return this.sourceElement;
	}
	view() {
		return mithril_default(".flex.col.elevated-bg.abs.dropdown-shadow.pt-s.border-radius", {
			tabindex: TabIndex.Programmatic,
			role: AriaRole.Menu
		}, [
			mithril_default(".pb-s.scroll", this.labels.map((labelState) => {
				const { label, state } = labelState;
				const color = theme.content_button;
				const canToggleLabel = state === LabelState.Applied || state === LabelState.AppliedToSome || !this.isMaxLabelsReached;
				const opacity = !canToggleLabel ? .5 : undefined;
				return mithril_default("label-item.flex.items-center.plr.state-bg.cursor-pointer", {
					"data-labelid": getElementId(label),
					role: AriaRole.MenuItemCheckbox,
					tabindex: TabIndex.Default,
					"aria-checked": ariaCheckedForState(state),
					"aria-disabled": !canToggleLabel,
					onclick: canToggleLabel ? () => this.toggleLabel(labelState) : noOp
				}, [mithril_default(Icon, {
					icon: this.iconForState(state),
					size: IconSize.Medium,
					style: {
						fill: getLabelColor(label.color),
						opacity
					}
				}), mithril_default(".button-height.flex.items-center.ml.overflow-hidden", { style: {
					color,
					opacity
				} }, mithril_default(".text-ellipsis", label.name))]);
			})),
			this.isMaxLabelsReached && mithril_default(".small.center.pb-s", lang.get("maximumLabelsPerMailReached_msg")),
			mithril_default(BaseButton, {
				label: "apply_action",
				text: lang.get("apply_action"),
				class: "limit-width noselect bg-transparent button-height text-ellipsis content-accent-fg flex items-center plr-button button-content justify-center border-top state-bg",
				onclick: () => {
					this.applyLabels();
				}
			}),
			mithril_default(BaseButton, {
				label: "close_alt",
				text: lang.get("close_alt"),
				class: "hidden-until-focus content-accent-fg button-content",
				onclick: () => {
					modal.remove(this);
				}
			})
		]);
	}
	iconForState(state) {
		switch (state) {
			case LabelState.AppliedToSome: return Icons.LabelPartial;
			case LabelState.Applied: return Icons.Label;
			case LabelState.NotApplied: return Icons.LabelOutline;
		}
	}
	checkIsMaxLabelsReached() {
		const { addedLabels, removedLabels } = this.getSortedLabels();
		if (addedLabels.length >= MAX_LABELS_PER_MAIL) return true;
		for (const [, labels] of this.labelsForMails) {
			const labelsOnMail = new Set(labels.map((label) => getElementId(label)));
			for (const label of removedLabels) labelsOnMail.delete(getElementId(label));
			if (labelsOnMail.size >= MAX_LABELS_PER_MAIL) return true;
			for (const label of addedLabels) {
				labelsOnMail.add(getElementId(label));
				if (labelsOnMail.size >= MAX_LABELS_PER_MAIL) return true;
			}
		}
		return false;
	}
	getSortedLabels() {
		const removedLabels = [];
		const addedLabels = [];
		for (const { label, state } of this.labels) if (state === LabelState.Applied) addedLabels.push(label);
else if (state === LabelState.NotApplied) removedLabels.push(label);
		return {
			addedLabels,
			removedLabels
		};
	}
	applyLabels() {
		const { addedLabels, removedLabels } = this.getSortedLabels();
		this.onLabelsApplied(addedLabels, removedLabels);
		modal.remove(this);
	}
	oncreate(vnode) {
		this.dom = vnode.dom;
		const displayedLabels = Math.min(this.labels.length, 6);
		const height = (displayedLabels + 1) * size.button_height + size.vpad_small * 2;
		showDropdown(this.origin, this.dom, height, this.width).then(() => {
			const firstLabel = vnode.dom.getElementsByTagName("label-item").item(0);
			if (firstLabel !== null) firstLabel.focus();
else vnode.dom.focus();
		});
	}
	shortCuts = [
		{
			key: Keys.ESC,
			exec: () => this.onClose(),
			help: "close_alt"
		},
		{
			key: Keys.TAB,
			shift: true,
			exec: () => this.dom ? focusPrevious(this.dom) : false,
			help: "selectPrevious_action"
		},
		{
			key: Keys.TAB,
			shift: false,
			exec: () => this.dom ? focusNext(this.dom) : false,
			help: "selectNext_action"
		},
		{
			key: Keys.UP,
			exec: () => this.dom ? focusPrevious(this.dom) : false,
			help: "selectPrevious_action"
		},
		{
			key: Keys.DOWN,
			exec: () => this.dom ? focusNext(this.dom) : false,
			help: "selectNext_action"
		},
		{
			key: Keys.RETURN,
			exec: () => this.applyLabels(),
			help: "ok_action"
		},
		{
			key: Keys.SPACE,
			exec: () => {
				const labelId = document.activeElement?.getAttribute("data-labelid");
				if (labelId) {
					const labelItem = this.labels.find((item) => getElementId(item.label) === labelId);
					if (labelItem) this.toggleLabel(labelItem);
				} else return true;
			},
			help: "ok_action"
		}
	];
	show() {
		modal.displayUnique(this, false);
	}
	toggleLabel(labelState) {
		switch (labelState.state) {
			case LabelState.AppliedToSome:
				labelState.state = this.isMaxLabelsReached ? LabelState.NotApplied : LabelState.Applied;
				break;
			case LabelState.NotApplied:
				labelState.state = LabelState.Applied;
				break;
			case LabelState.Applied:
				labelState.state = LabelState.NotApplied;
				break;
		}
		this.isMaxLabelsReached = this.checkIsMaxLabelsReached();
	}
};
function ariaCheckedForState(state) {
	switch (state) {
		case LabelState.Applied: return "true";
		case LabelState.AppliedToSome: return "mixed";
		case LabelState.NotApplied: return "false";
	}
}

//#endregion
//#region src/mail-app/mail/view/MobileMailActionBar.ts
var MobileMailActionBar = class {
	dom = null;
	view(vnode) {
		const { attrs } = vnode;
		const { viewModel } = attrs;
		let actions;
		if (viewModel.isAnnouncement()) actions = [
			this.placeholder(),
			this.placeholder(),
			this.deleteButton(attrs),
			this.placeholder(),
			this.moreButton(attrs)
		];
else if (viewModel.isDraftMail()) actions = [
			this.placeholder(),
			this.placeholder(),
			this.deleteButton(attrs),
			this.moveButton(attrs),
			this.editButton(attrs)
		];
else if (viewModel.canForwardOrMove()) actions = [
			this.replyButton(attrs),
			this.forwardButton(attrs),
			this.deleteButton(attrs),
			this.moveButton(attrs),
			this.moreButton(attrs)
		];
else actions = [
			this.replyButton(attrs),
			this.placeholder(),
			this.deleteButton(attrs),
			this.placeholder(),
			this.moreButton(attrs)
		];
		return mithril_default(".bottom-nav.bottom-action-bar.flex.items-center.plr-l.justify-between", { oncreate: (vnode$1) => {
			this.dom = vnode$1.dom;
		} }, [actions]);
	}
	placeholder() {
		return mithril_default("", { style: { width: px(size.button_height) } });
	}
	moveButton({ viewModel }) {
		return mithril_default(IconButton, {
			title: "move_action",
			click: (e, dom) => showMoveMailsDropdown(viewModel.mailboxModel, viewModel.mailModel, dom.getBoundingClientRect(), [viewModel.mail], {
				width: this.dropdownWidth(),
				withBackground: true
			}),
			icon: Icons.Folder
		});
	}
	dropdownWidth() {
		return this.dom?.offsetWidth ? this.dom.offsetWidth - DROPDOWN_MARGIN * 2 : undefined;
	}
	moreButton({ viewModel }) {
		return mithril_default(IconButton, {
			title: "more_label",
			click: createDropdown({
				lazyButtons: () => {
					const moreButtons = [];
					if (viewModel.mailModel.canAssignLabels()) moreButtons.push({
						label: "assignLabel_action",
						click: (event, dom) => {
							const referenceDom = this.dom ?? dom;
							const popup = new LabelsPopup(referenceDom, referenceDom.getBoundingClientRect(), this.dropdownWidth() ?? 200, viewModel.mailModel.getLabelsForMails([viewModel.mail]), viewModel.mailModel.getLabelStatesForMails([viewModel.mail]), (addedLabels, removedLabels) => viewModel.mailModel.applyLabels([viewModel.mail], addedLabels, removedLabels));
							setTimeout(() => {
								popup.show();
							}, 16);
						},
						icon: Icons.Label
					});
					return [...moreButtons, ...mailViewerMoreActions(viewModel)];
				},
				width: this.dropdownWidth(),
				withBackground: true
			}),
			icon: Icons.More
		});
	}
	deleteButton({ viewModel }) {
		return mithril_default(IconButton, {
			title: "delete_action",
			click: () => promptAndDeleteMails(viewModel.mailModel, [viewModel.mail], noOp),
			icon: Icons.Trash
		});
	}
	forwardButton({ viewModel }) {
		return mithril_default(IconButton, {
			title: "forward_action",
			click: () => viewModel.forward().catch(ofClass(UserError, showUserError)),
			icon: Icons.Forward
		});
	}
	replyButton({ viewModel }) {
		return mithril_default(IconButton, {
			title: "reply_action",
			click: viewModel.canReplyAll() ? (e, dom) => {
				const dropdown = new Dropdown(() => {
					const buttons = [];
					buttons.push({
						label: "replyAll_action",
						icon: Icons.ReplyAll,
						click: () => viewModel.reply(true)
					});
					buttons.push({
						label: "reply_action",
						icon: Icons.Reply,
						click: () => viewModel.reply(false)
					});
					return buttons;
				}, this.dropdownWidth() ?? 300);
				const domRect = this.dom?.getBoundingClientRect() ?? dom.getBoundingClientRect();
				dropdown.setOrigin(domRect);
				modal.displayUnique(dropdown, true);
			} : () => viewModel.reply(false),
			icon: viewModel.canReplyAll() ? Icons.ReplyAll : Icons.Reply
		});
	}
	editButton(attrs) {
		return mithril_default(IconButton, {
			title: "edit_action",
			icon: Icons.Edit,
			click: () => editDraft(attrs.viewModel)
		});
	}
};

//#endregion
//#region src/mail-app/mail/view/EventBanner.ts
var EventBanner = class {
	/** ReplyButtons are used from mail-view and calendar-view.
	* they can't import each other and only have gui-base as a
	* common ancestor, where these don't belong. */
	ReplyButtons = new LazyLoaded(async () => (await import("./EventPreviewView2-chunk.js")).ReplyButtons);
	view({ attrs }) {
		const { contents, mail } = attrs;
		if (contents == null || contents.events.length === 0) return null;
		const messages = contents.events.map((event) => {
			const message = this.getMessage(event, attrs.mail, attrs.recipient, contents.method);
			return message == null ? null : {
				event,
				message
			};
		}).filter(isNotNull);
		return messages.map(({ event, message }) => mithril_default(InfoBanner, {
			message: () => message,
			type: BannerType.Info,
			icon: Icons.People,
			buttons: [{
				label: "viewEvent_action",
				click: (e, dom) => import("./CalendarInvites2-chunk.js").then(({ showEventDetails }) => showEventDetails(event, dom.getBoundingClientRect(), mail))
			}]
		}));
	}
	getMessage(event, mail, recipient, method) {
		const ownAttendee = findAttendeeInAddresses(event.attendees, [recipient]);
		if (method === CalendarMethod.REQUEST && ownAttendee != null) if (isRepliedTo(mail) && ownAttendee.status !== CalendarAttendeeStatus.NEEDS_ACTION) return mithril_default(".align-self-start.start.small", lang.get("alreadyReplied_msg"));
else if (this.ReplyButtons.isLoaded()) return mithril_default(this.ReplyButtons.getLoaded(), {
			ownAttendee,
			setParticipation: async (status) => sendResponse(event, recipient, status, mail)
		});
else {
			this.ReplyButtons.reload().then(mithril_default.redraw);
			return null;
		}
else if (method === CalendarMethod.REPLY) return mithril_default(".pt.align-self-start.start.small", lang.get("eventNotificationUpdated_msg"));
else return null;
	}
};
function sendResponse(event, recipient, status, previousMail) {
	showProgressDialog("pleaseWait_msg", import("./CalendarInvites2-chunk.js").then(async ({ getLatestEvent }) => {
		const latestEvent = await getLatestEvent(event);
		const ownAttendee = findAttendeeInAddresses(latestEvent.attendees, [recipient]);
		const calendarInviteHandler = await mailLocator.calendarInviteHandler();
		if (ownAttendee == null) {
			Dialog.message("attendeeNotFound_msg");
			return;
		}
		const mailboxDetails = await mailLocator.mailModel.getMailboxDetailsForMail(previousMail);
		if (mailboxDetails == null) return;
		const replyResult = await calendarInviteHandler.replyToEventInvitation(latestEvent, ownAttendee, status, previousMail, mailboxDetails);
		if (replyResult === ReplyResult.ReplySent) ownAttendee.status = status;
		mithril_default.redraw();
	}));
}

//#endregion
//#region src/common/gui/base/RecipientButton.ts
var RecipientButton = class {
	view({ attrs }) {
		return mithril_default("button.mr-button.content-accent-fg.print.small", {
			style: Object.assign({
				"white-space": "normal",
				"word-break": "break-all"
			}, attrs.style),
			onclick: (e) => attrs.click(e, e.target)
		}, [attrs.label]);
	}
};

//#endregion
//#region src/mail-app/mail/view/MailViewerHeader.ts
var MailViewerHeader = class {
	detailsExpanded = false;
	filesExpanded = false;
	view({ attrs }) {
		const { viewModel } = attrs;
		const dateTime = formatDateWithWeekday(viewModel.mail.receivedDate) + " • " + formatTime(viewModel.mail.receivedDate);
		const dateTimeFull = formatDateWithWeekdayAndYear(viewModel.mail.receivedDate) + " • " + formatTime(viewModel.mail.receivedDate);
		return mithril_default(".header.selectable", [
			this.renderSubjectActionsLine(attrs),
			this.renderFolderAndLabels(viewModel),
			this.renderAddressesAndDate(viewModel, attrs, dateTime, dateTimeFull),
			mithril_default(ExpanderPanel, { expanded: this.detailsExpanded }, this.renderDetails(attrs, { bubbleMenuWidth: 300 })),
			this.renderAttachments(viewModel, attrs.importFile),
			this.renderConnectionLostBanner(viewModel),
			this.renderEventBanner(viewModel),
			this.renderBanners(attrs)
		]);
	}
	renderFolderAndLabels(viewModel) {
		const folderInfo = viewModel.getFolderInfo();
		if (!folderInfo) return null;
		const icon = getFolderIconByType(folderInfo.folderType);
		const folderText = viewModel.getFolderMailboxText();
		const labels = viewModel.getLabels();
		if (folderText == null && labels.length === 0) return null;
		const margin = px(size.vpad_xsm);
		return mithril_default(".flex.mb-xs.flex-wrap", {
			style: {
				columnGap: margin,
				rowGap: margin
			},
			class: responsiveCardHMargin()
		}, [folderText ? mithril_default(".flex.small", [
			mithril_default(".b", mithril_default("", lang.get("location_label"))),
			mithril_default(Icon, {
				icon,
				container: "div",
				style: {
					fill: theme.content_button,
					marginLeft: margin
				}
			}),
			mithril_default(".span", folderInfo.name)
		]) : null, labels.map((label) => mithril_default(Label, {
			text: label.name,
			color: label.color ?? theme.content_accent
		}))]);
	}
	renderAddressesAndDate(viewModel, attrs, dateTime, dateTimeFull) {
		const folderInfo = viewModel.getFolderInfo();
		if (!folderInfo) return null;
		const displayedSender = viewModel.getDisplayedSender();
		return mithril_default(".flex.mt-xs.click.col", {
			class: responsiveCardHMargin(),
			role: "button",
			"aria-pressed": String(this.detailsExpanded),
			"aria-expanded": String(this.detailsExpanded),
			tabindex: TabIndex.Default,
			onclick: () => {
				this.detailsExpanded = !this.detailsExpanded;
			},
			onkeydown: (e) => {
				if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
					this.detailsExpanded = !this.detailsExpanded;
					e.preventDefault();
				}
			}
		}, [displayedSender == null ? null : mithril_default(".small.flex.flex-wrap.items-start", [mithril_default("span.text-break", getMailAddressDisplayText(displayedSender.name, displayedSender.address, false))]), mithril_default(".flex", [
			this.getRecipientEmailAddress(attrs),
			mithril_default(".flex-grow"),
			mithril_default(".flex.items-center.white-space-pre.ml-s.ml-between-s", {
				tabindex: TabIndex.Default,
				"aria-label": lang.get(viewModel.isConfidential() ? "confidential_action" : "nonConfidential_action") + ", " + dateTime
			}),
			mithril_default(".flex.ml-between-s.items-center", [
				viewModel.isConfidential() ? mithril_default(Icon, {
					icon: getConfidentialIcon(viewModel.mail),
					container: "div",
					style: { fill: theme.content_button },
					hoverText: lang.get("confidential_label")
				}) : null,
				mithril_default(Icon, {
					icon: getFolderIconByType(folderInfo.folderType),
					container: "div",
					style: { fill: theme.content_button },
					hoverText: folderInfo.name
				}),
				mithril_default(".small.font-weight-600.selectable.no-wrap", { style: { color: theme.content_button } }, [mithril_default(".noprint", dateTime), mithril_default(".noscreen", dateTimeFull)])
			])
		])]);
	}
	renderSubjectActionsLine(attrs) {
		const { viewModel } = attrs;
		const classes = this.makeSubjectActionsLineClasses();
		const senderName = viewModel.getDisplayedSender()?.name?.trim() ?? "";
		const displayAddressForSender = senderName === "";
		return mithril_default(classes, [mithril_default(".flex.flex-grow.align-self-start.items-start.overflow-hidden", {
			class: styles.isSingleColumnLayout() ? "mt-m" : "mt",
			role: "button",
			"mail-expander": "true",
			"aria-expanded": "true",
			tabindex: TabIndex.Default,
			onclick: (e) => {
				viewModel.collapseMail();
				e.stopPropagation();
			},
			onkeydown: (e) => {
				if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN) && e.target.hasAttribute("mail-expander")) {
					viewModel.collapseMail();
					e.preventDefault();
				}
			}
		}, [
			viewModel.isUnread() ? this.renderUnreadDot() : null,
			viewModel.isDraftMail() ? mithril_default(".mr-xs.align-self-center", mithril_default(Icon, {
				icon: Icons.Edit,
				container: "div",
				style: { fill: theme.content_button },
				hoverText: lang.get("draft_label")
			})) : null,
			this.tutaoBadge(viewModel),
			mithril_default("span" + (displayAddressForSender ? ".invisible.overflow-hidden" : ".text-break") + (viewModel.isUnread() ? ".font-weight-600" : ""), displayAddressForSender ? viewModel.getDisplayedSender()?.address ?? "" : senderName)
		]), mithril_default(".flex-end.items-start.ml-between-s", {
			class: styles.isSingleColumnLayout() ? "" : "mt-xs",
			style: { marginRight: styles.isSingleColumnLayout() ? "-3px" : "6px" },
			onclick: (e) => e.stopPropagation()
		}, this.moreButton(attrs))]);
	}
	renderUnreadDot() {
		return mithril_default(".flex.flex-no-grow.no-shrink.pr-s", { style: { paddingTop: "2px" } }, mithril_default(".dot.bg-accent-fg"));
	}
	makeSubjectActionsLineClasses() {
		let classes = ".flex.click";
		if (styles.isSingleColumnLayout()) classes += ".ml";
else classes += ".pl-l";
		return classes;
	}
	renderBanners(attrs) {
		const { viewModel } = attrs;
		if (viewModel.isCollapsed()) return null;
		return [
			mithril_default("." + responsiveCardHMargin(), this.renderPhishingWarning(viewModel) || this.renderHardAuthenticationFailWarning(viewModel) || this.renderSoftAuthenticationFailWarning(viewModel)),
			mithril_default("." + responsiveCardHMargin(), this.renderExternalContentBanner(attrs)),
			mithril_default("hr.hr.mt-xs." + responsiveCardHMargin())
		].filter(Boolean);
	}
	renderConnectionLostBanner(viewModel) {
		if (viewModel.isConnectionLost()) return mithril_default("." + responsiveCardHMargin(), mithril_default(InfoBanner, {
			message: "mailPartsNotLoaded_msg",
			icon: Icons.Warning,
			buttons: [{
				label: "retry_action",
				click: () => viewModel.loadAll(Promise.resolve())
			}]
		}));
else return null;
	}
	renderEventBanner(viewModel) {
		const eventAttachment = viewModel.getCalendarEventAttachment();
		return eventAttachment ? mithril_default("." + responsiveCardHMargin(), mithril_default(EventBanner, {
			contents: eventAttachment.contents,
			recipient: eventAttachment.recipient,
			mail: viewModel.mail
		})) : null;
	}
	renderDetails(attrs, { bubbleMenuWidth }) {
		const { viewModel, createMailAddressContextButtons } = attrs;
		const envelopeSender = viewModel.getDifferentEnvelopeSender();
		const displayedSender = viewModel.getDisplayedSender();
		return mithril_default("." + responsiveCardHPadding(), liveDataAttrs(), [
			mithril_default(".mt-s", displayedSender == null ? null : [mithril_default(".small.b", lang.get("from_label")), mithril_default(RecipientButton, {
				label: getMailAddressDisplayText(displayedSender.name, displayedSender.address, false),
				click: createAsyncDropdown({
					lazyButtons: () => createMailAddressContextButtons({
						mailAddress: displayedSender,
						defaultInboxRuleField: InboxRuleType.FROM_EQUALS
					}),
					width: bubbleMenuWidth
				})
			})], envelopeSender ? [mithril_default(".small.b", lang.get("sender_label")), mithril_default(RecipientButton, {
				label: getMailAddressDisplayText("", envelopeSender, false),
				click: createAsyncDropdown({
					lazyButtons: async () => {
						const childElements = [{
							info: lang.get("envelopeSenderInfo_msg"),
							center: false,
							bold: false
						}, {
							info: envelopeSender,
							center: true,
							bold: true
						}];
						const contextButtons = await createMailAddressContextButtons({
							mailAddress: {
								address: envelopeSender,
								name: ""
							},
							defaultInboxRuleField: InboxRuleType.FROM_EQUALS,
							createContact: false
						});
						return [...childElements, ...contextButtons];
					},
					width: bubbleMenuWidth
				})
			})] : null),
			mithril_default(".mt-s", viewModel.getToRecipients().length ? [mithril_default(".small.b", lang.get("to_label")), mithril_default(".flex.col.mt-between-s", viewModel.getToRecipients().map((recipient) => mithril_default(".flex", mithril_default(RecipientButton, {
				label: getMailAddressDisplayText(recipient.name, recipient.address, false),
				click: createAsyncDropdown({
					lazyButtons: () => createMailAddressContextButtons({
						mailAddress: recipient,
						defaultInboxRuleField: InboxRuleType.RECIPIENT_TO_EQUALS
					}),
					width: bubbleMenuWidth
				}),
				style: { flex: "0 1 auto" }
			}))))] : null),
			mithril_default(".mt-s", viewModel.getCcRecipients().length ? [mithril_default(".small.b", lang.get("cc_label")), mithril_default(".flex-start.flex-wrap", viewModel.getCcRecipients().map((recipient) => mithril_default(RecipientButton, {
				label: getMailAddressDisplayText(recipient.name, recipient.address, false),
				click: createAsyncDropdown({
					lazyButtons: () => createMailAddressContextButtons({
						mailAddress: recipient,
						defaultInboxRuleField: InboxRuleType.RECIPIENT_CC_EQUALS
					}),
					width: bubbleMenuWidth
				}),
				style: { flex: "0 1 auto" }
			})))] : null),
			mithril_default(".mt-s", viewModel.getBccRecipients().length ? [mithril_default(".small.b", lang.get("bcc_label")), mithril_default(".flex-start.flex-wrap", viewModel.getBccRecipients().map((recipient) => mithril_default(RecipientButton, {
				label: getMailAddressDisplayText(recipient.name, recipient.address, false),
				click: createAsyncDropdown({
					lazyButtons: () => createMailAddressContextButtons({
						mailAddress: recipient,
						defaultInboxRuleField: InboxRuleType.RECIPIENT_BCC_EQUALS
					}),
					width: bubbleMenuWidth
				}),
				style: { flex: "0 1 auto" }
			})))] : null),
			mithril_default(".mt-s", viewModel.getReplyTos().length ? [mithril_default(".small.b", lang.get("replyTo_label")), mithril_default(".flex-start.flex-wrap", viewModel.getReplyTos().map((recipient) => mithril_default(RecipientButton, {
				label: getMailAddressDisplayText(recipient.name, recipient.address, false),
				click: createAsyncDropdown({
					lazyButtons: () => createMailAddressContextButtons({
						mailAddress: recipient,
						defaultInboxRuleField: null
					}),
					width: bubbleMenuWidth
				}),
				style: { flex: "0 1 auto" }
			})))] : null)
		]);
	}
	renderAttachments(viewModel, importFile) {
		if (viewModel.isLoadingAttachments() && !viewModel.isConnectionLost()) return mithril_default(".flex." + responsiveCardHMargin(), [mithril_default(".flex-v-center.pl-button", progressIcon()), mithril_default(".small.flex-v-center.plr.button-height", lang.get("loading_msg"))]);
else {
			const attachments = viewModel.getNonInlineAttachments();
			const attachmentCount = attachments.length;
			if (attachmentCount === 0) return null;
			let totalAttachmentSize = 0;
			for (const attachment of attachments) totalAttachmentSize += Number(attachment.size);
			return [mithril_default(".flex.mt-s.mb-s." + responsiveCardHMargin(), liveDataAttrs(), [attachmentCount === 1 ? this.renderAttachmentContainer(viewModel, attachments, importFile) : mithril_default(ExpanderButton, {
				label: lang.makeTranslation("attachmentAmount_label", lang.get("attachmentAmount_label", { "{amount}": attachmentCount + "" }) + ` (${formatStorageSize(totalAttachmentSize)})`),
				style: {
					"padding-top": "inherit",
					height: "inherit",
					"min-height": "inherit",
					"text-decoration": "none",
					"font-weight": "normal"
				},
				expanded: this.filesExpanded,
				color: theme.content_fg,
				isBig: true,
				isUnformattedLabel: true,
				onExpandedChange: (change) => {
					this.filesExpanded = change;
				}
			})]), attachments.length > 1 ? mithril_default(ExpanderPanel, { expanded: this.filesExpanded }, mithril_default(".flex.col." + responsiveCardHMargin(), [mithril_default(".flex.flex-wrap.gap-hpad", this.renderAttachmentContainer(viewModel, attachments, importFile)), isIOSApp() ? null : mithril_default(".flex", mithril_default(Button, {
				label: "saveAll_action",
				type: ButtonType.Secondary,
				click: () => viewModel.downloadAll()
			}))])) : null];
		}
	}
	renderAttachmentContainer(viewModel, attachments, importFile) {
		return attachments.map((attachment) => {
			const attachmentType = getAttachmentType(attachment.mimeType ?? "");
			return mithril_default(AttachmentBubble, {
				attachment,
				remove: null,
				download: isAndroidApp() || isDesktop() ? () => viewModel.downloadAndOpenAttachment(attachment, false) : () => viewModel.downloadAndOpenAttachment(attachment, true),
				open: isAndroidApp() || isDesktop() ? () => viewModel.downloadAndOpenAttachment(attachment, true) : null,
				fileImport: viewModel.canImportFile(attachment) ? () => importFile(attachment) : null,
				type: attachmentType
			});
		});
	}
	tutaoBadge(viewModel) {
		return isTutanotaTeamMail(viewModel.mail) ? mithril_default(Badge, { classes: ".mr-s" }, companyTeamLabel) : null;
	}
	renderPhishingWarning(viewModel) {
		if (viewModel.isMailSuspicious()) return mithril_default(InfoBanner, {
			message: "phishingMessageBody_msg",
			icon: Icons.Warning,
			type: BannerType.Warning,
			helpLink: canSeeTutaLinks(viewModel.logins) ? InfoLink.Phishing : null,
			buttons: [{
				label: "markAsNotPhishing_action",
				click: () => viewModel.markAsNotPhishing().then(() => mithril_default.redraw())
			}]
		});
	}
	renderHardAuthenticationFailWarning(viewModel) {
		const authFailed = viewModel.checkMailAuthenticationStatus(MailAuthenticationStatus.HARD_FAIL) || viewModel.mail.encryptionAuthStatus === EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED;
		if (!viewModel.isWarningDismissed() && authFailed) return mithril_default(InfoBanner, {
			message: "mailAuthFailed_msg",
			icon: Icons.Warning,
			helpLink: canSeeTutaLinks(viewModel.logins) ? InfoLink.MailAuth : null,
			type: BannerType.Warning,
			buttons: [{
				label: "close_alt",
				click: () => viewModel.setWarningDismissed(true)
			}]
		});
	}
	renderSoftAuthenticationFailWarning(viewModel) {
		if (!viewModel.isWarningDismissed() && viewModel.checkMailAuthenticationStatus(MailAuthenticationStatus.SOFT_FAIL)) return mithril_default(InfoBanner, {
			message: () => viewModel.mail.differentEnvelopeSender ? lang.get("mailAuthMissingWithTechnicalSender_msg", { "{sender}": viewModel.mail.differentEnvelopeSender }) : lang.get("mailAuthMissing_label"),
			icon: Icons.Warning,
			helpLink: canSeeTutaLinks(viewModel.logins) ? InfoLink.MailAuth : null,
			buttons: [{
				label: "close_alt",
				click: () => viewModel.setWarningDismissed(true)
			}]
		});
else return null;
	}
	renderExternalContentBanner(attrs) {
		if (attrs.viewModel.getContentBlockingStatus() !== ContentBlockingStatus.Block) return null;
		const showButton = {
			label: "showBlockedContent_action",
			click: () => attrs.viewModel.setContentBlockingStatus(ContentBlockingStatus.Show)
		};
		const alwaysOrNeverAllowButtons = attrs.viewModel.canPersistBlockingStatus() ? [attrs.viewModel.checkMailAuthenticationStatus(MailAuthenticationStatus.AUTHENTICATED) ? {
			label: "allowExternalContentSender_action",
			click: () => attrs.viewModel.setContentBlockingStatus(ContentBlockingStatus.AlwaysShow)
		} : null, {
			label: "blockExternalContentSender_action",
			click: () => attrs.viewModel.setContentBlockingStatus(ContentBlockingStatus.AlwaysBlock)
		}].filter(isNotNull) : [];
		const maybeDropdownButtons = styles.isSingleColumnLayout() && alwaysOrNeverAllowButtons.length > 1 ? [{
			label: "more_label",
			click: createAsyncDropdown({
				width: 216,
				lazyButtons: async () => resolveMaybeLazy(alwaysOrNeverAllowButtons)
			})
		}] : alwaysOrNeverAllowButtons;
		return mithril_default(InfoBanner, {
			message: "contentBlocked_msg",
			icon: Icons.Picture,
			helpLink: canSeeTutaLinks(attrs.viewModel.logins) ? InfoLink.LoadImages : null,
			buttons: [showButton, ...maybeDropdownButtons]
		});
	}
	moreButton(attrs) {
		return mithril_default(IconButton, {
			title: "more_label",
			icon: Icons.More,
			click: this.prepareMoreActions(attrs)
		});
	}
	prepareMoreActions({ viewModel }) {
		return createDropdown({
			lazyButtons: () => {
				let actionButtons = [];
				if (viewModel.isDraftMail()) {
					actionButtons.push({
						label: "edit_action",
						click: () => editDraft(viewModel),
						icon: Icons.Edit
					});
					actionButtons.push({
						label: "move_action",
						click: (_, dom) => showMoveMailsDropdown(viewModel.mailboxModel, viewModel.mailModel, dom.getBoundingClientRect(), [viewModel.mail]),
						icon: Icons.Folder
					});
					actionButtons.push({
						label: "delete_action",
						click: () => promptAndDeleteMails(viewModel.mailModel, [viewModel.mail], noOp),
						icon: Icons.Trash
					});
				} else {
					if (viewModel.canForwardOrMove()) {
						actionButtons.push({
							label: "reply_action",
							click: () => viewModel.reply(false),
							icon: Icons.Reply
						});
						if (viewModel.canReplyAll()) actionButtons.push({
							label: "replyAll_action",
							click: () => viewModel.reply(true),
							icon: Icons.ReplyAll
						});
						actionButtons.push({
							label: "forward_action",
							click: () => viewModel.forward(),
							icon: Icons.Forward
						});
						actionButtons.push({
							label: "move_action",
							click: (_, dom) => showMoveMailsDropdown(viewModel.mailboxModel, viewModel.mailModel, dom.getBoundingClientRect(), [viewModel.mail]),
							icon: Icons.Folder
						});
					}
					if (viewModel.mailModel.canAssignLabels()) actionButtons.push({
						label: "assignLabel_action",
						click: (_, dom) => {
							const popup = new LabelsPopup(dom, dom.getBoundingClientRect(), styles.isDesktopLayout() ? 300 : 200, viewModel.mailModel.getLabelsForMails([viewModel.mail]), viewModel.mailModel.getLabelStatesForMails([viewModel.mail]), (addedLabels, removedLabels) => viewModel.mailModel.applyLabels([viewModel.mail], addedLabels, removedLabels));
							setTimeout(() => {
								popup.show();
							}, 16);
						},
						icon: Icons.Label
					});
					actionButtons.push({
						label: "delete_action",
						click: () => promptAndDeleteMails(viewModel.mailModel, [viewModel.mail], noOp),
						icon: Icons.Trash
					});
					actionButtons.push(...mailViewerMoreActions(viewModel));
				}
				return actionButtons;
			},
			width: 300
		});
	}
	getRecipientEmailAddress({ viewModel }) {
		const relevantRecipient = viewModel.getRelevantRecipient();
		if (relevantRecipient) {
			const numberOfAllRecipients = viewModel.getNumberOfRecipients();
			return mithril_default(".flex.click.small.ml-between-s.items-center", { style: { minWidth: "20px" } }, [
				mithril_default("", lang.get("mailViewerRecipients_label")),
				mithril_default(".text-ellipsis", relevantRecipient.address),
				mithril_default(".flex.no-wrap", [numberOfAllRecipients > 1 ? `+ ${numberOfAllRecipients - 1}` : null, mithril_default(Icon, {
					icon: BootIcons.Expand,
					container: "div",
					style: {
						fill: theme.content_fg,
						transform: this.detailsExpanded ? "rotate(180deg)" : ""
					}
				})])
			]);
		} else return "";
	}
};

//#endregion
//#region src/mail-app/mail/view/MailViewer.ts
var import_stream$1 = __toESM(require_stream(), 1);
assertMainOrNode();
var MailViewer = class {
	/** it is set after we measured mail body element */
	bodyLineHeight = null;
	/**
	* Delay the display of the progress spinner in main body view for a short time to suppress it when we are switching between cached emails
	* and we are just sanitizing
	*/
	delayProgressSpinner = true;
	resizeListener;
	resizeObserverViewport = null;
	resizeObserverZoomable = null;
	viewModel;
	pinchZoomable = null;
	shortcuts;
	scrollDom = null;
	domBodyDeferred = defer();
	domBody = null;
	shadowDomRoot = null;
	shadowDomMailContent = null;
	currentlyRenderedMailBody = null;
	lastContentBlockingStatus = null;
	loadAllListener = (0, import_stream$1.default)();
	/** for block quotes in mail bodies, whether to display quote before user interaction
	* is "none" until we render once */
	currentQuoteBehavior = "none";
	/** for block quotes in mail bodies, whether to display placeholder or original quote */
	quoteState = "unset";
	/** most recent resize animation frame request ID */
	resizeRaf;
	constructor(vnode) {
		this.setViewModel(vnode.attrs.viewModel, vnode.attrs.isPrimary);
		this.resizeListener = () => this.domBodyDeferred.promise.then((dom) => this.updateLineHeight(dom));
		this.shortcuts = this.setupShortcuts(vnode.attrs);
	}
	oncreate({ attrs }) {
		if (attrs.isPrimary) keyManager.registerShortcuts(this.shortcuts);
		windowFacade.addResizeListener(this.resizeListener);
	}
	onremove({ attrs }) {
		windowFacade.removeResizeListener(this.resizeListener);
		if (this.resizeObserverZoomable) this.resizeObserverZoomable.disconnect();
		if (this.resizeObserverViewport) this.resizeObserverViewport.disconnect();
		this.pinchZoomable?.remove();
		this.clearDomBody();
		if (attrs.isPrimary) keyManager.unregisterShortcuts(this.shortcuts);
	}
	setViewModel(viewModel, isPrimary) {
		const oldViewModel = this.viewModel;
		this.viewModel = viewModel;
		if (this.viewModel !== oldViewModel) {
			this.loadAllListener.end(true);
			this.loadAllListener = this.viewModel.loadCompleteNotification.map(async () => {
				await Promise.resolve();
				mithril_default.redraw.sync();
				await this.replaceInlineImages();
				mithril_default.redraw();
			});
			this.lastContentBlockingStatus = null;
			this.delayProgressSpinner = true;
			setTimeout(() => {
				this.delayProgressSpinner = false;
				mithril_default.redraw();
			}, 50);
		}
	}
	view(vnode) {
		this.handleContentBlockingOnRender();
		return [mithril_default(".mail-viewer.overflow-x-hidden", [
			this.renderMailHeader(vnode.attrs),
			this.renderMailSubject(vnode.attrs),
			mithril_default(".flex-grow.scroll-x.pt.pb.border-radius-big" + (this.viewModel.isContrastFixNeeded() ? ".bg-white.content-black" : " "), {
				class: responsiveCardHPadding(),
				oncreate: (vnode$1) => {
					this.scrollDom = vnode$1.dom;
				}
			}, this.renderMailBodySection(vnode.attrs)),
			this.renderQuoteExpanderButton()
		])];
	}
	renderMailSubject(attrs) {
		return mithril_default("h4.font-weight-600.mt.mb.text-break.selectable." + responsiveCardHMargin(), { "data-testid": `h:${lang.getTestId("subject_label")}` }, attrs.viewModel.getSubject());
	}
	/**
	* important: must be called after rendering the mail body part so that {@link quoteState} is set correctly.
	* The logic here relies on the fact that lifecycle methods will be called after body section lifecycle methods.
	*/
	renderQuoteExpanderButton() {
		const buttonHeight = 24;
		return mithril_default(".abs.flex.justify-center.full-width", {
			style: {
				bottom: px(-(buttonHeight / 2 + 1)),
				display: "hidden"
			},
			oncreate: ({ dom }) => {
				dom.style.display = this.quoteState === "noquotes" ? "none" : "";
			},
			onupdate: ({ dom }) => {
				dom.style.display = this.quoteState === "noquotes" ? "none" : "";
			}
		}, mithril_default(
			// needs flex for correct height
			".flex",
			{ style: {
				borderRadius: "25%",
				border: `1px solid ${theme.list_border}`,
				backgroundColor: theme.content_bg
			} },
			mithril_default(ToggleButton, {
				icon: Icons.More,
				title: "showText_action",
				toggled: this.shouldDisplayCollapsedQuotes(),
				onToggled: () => {
					this.quoteState = this.shouldDisplayCollapsedQuotes() ? "collapsed" : "expanded";
					if (this.shadowDomRoot) this.updateCollapsedQuotes(this.shadowDomRoot, this.shouldDisplayCollapsedQuotes());
				},
				style: {
					height: "24px",
					width: px(size.button_height_compact)
				}
			})
));
	}
	handleContentBlockingOnRender() {
		if (this.lastContentBlockingStatus != null && this.viewModel.getContentBlockingStatus() != this.lastContentBlockingStatus) Promise.resolve().then(async () => {
			mithril_default.redraw.sync();
			await this.replaceInlineImages();
		});
		this.lastContentBlockingStatus = this.viewModel.getContentBlockingStatus();
	}
	renderMailHeader(attrs) {
		return mithril_default(MailViewerHeader, {
			viewModel: this.viewModel,
			createMailAddressContextButtons: this.createMailAddressContextButtons.bind(this),
			isPrimary: attrs.isPrimary,
			importFile: (file) => this.handleAttachmentImport(file)
		});
	}
	onbeforeupdate(vnode) {
		this.setViewModel(vnode.attrs.viewModel, vnode.attrs.isPrimary);
		const shouldSkipRender = this.viewModel.isLoading() && this.delayProgressSpinner;
		return !shouldSkipRender;
	}
	renderMailBodySection(attrs) {
		if (this.viewModel.didErrorsOccur()) return mithril_default(IconMessageBox, {
			message: "corrupted_msg",
			icon: Icons.Warning,
			color: theme.content_message_bg
		});
		const sanitizedMailBody = this.viewModel.getSanitizedMailBody();
		if (this.viewModel.shouldDelayRendering()) return null;
else if (sanitizedMailBody != null) return this.renderMailBody(sanitizedMailBody, attrs);
else if (this.viewModel.isLoading()) return this.renderLoadingIcon();
else return null;
	}
	renderMailBody(sanitizedMailBody, attrs) {
		return mithril_default("#mail-body", {
			key: "mailBody",
			oncreate: (vnode) => {
				const dom = vnode.dom;
				this.setDomBody(dom);
				this.updateLineHeight(dom);
				this.renderShadowMailBody(sanitizedMailBody, attrs, vnode.dom);
				if (client.isMobileDevice()) {
					this.resizeObserverViewport?.disconnect();
					this.resizeObserverViewport = new ResizeObserver((entries) => {
						if (this.pinchZoomable) this.createPinchZoom(this.pinchZoomable.getZoomable(), vnode.dom);
					});
					this.resizeObserverViewport.observe(vnode.dom);
				}
			},
			onupdate: (vnode) => {
				const dom = vnode.dom;
				this.setDomBody(dom);
				if (!this.bodyLineHeight) this.updateLineHeight(vnode.dom);
				if (this.currentlyRenderedMailBody !== sanitizedMailBody) this.renderShadowMailBody(sanitizedMailBody, attrs, vnode.dom);
				if (this.currentQuoteBehavior !== attrs.defaultQuoteBehavior) this.updateCollapsedQuotes(assertNotNull(this.shadowDomRoot), attrs.defaultQuoteBehavior === "expand");
				this.currentQuoteBehavior = attrs.defaultQuoteBehavior;
				if (client.isMobileDevice() && !this.pinchZoomable && this.shadowDomMailContent) this.createPinchZoom(this.shadowDomMailContent, vnode.dom);
			},
			onbeforeremove: () => {
				this.clearDomBody();
			},
			onsubmit: (event) => {
				if (!confirm(lang.get("reallySubmitContent_msg"))) event.preventDefault();
			},
			style: {
				"line-height": this.bodyLineHeight ? this.bodyLineHeight.toString() : size.line_height,
				"transform-origin": "top left"
			}
		});
	}
	createPinchZoom(zoomable, viewport) {
		this.pinchZoomable?.remove();
		this.pinchZoomable = new PinchZoom(zoomable, viewport, true, (e, target) => {
			this.handleAnchorClick(e, target, true);
		});
	}
	updateCollapsedQuotes(dom, showQuote) {
		const quotes = dom.querySelectorAll("[tuta-collapsed-quote]");
		for (const quoteWrap of Array.from(quotes)) {
			const quote = quoteWrap.children[0];
			quote.style.display = showQuote ? "" : "none";
			const quoteIndicator = quoteWrap.children[1];
			quoteIndicator.style.display = showQuote ? "none" : "";
		}
		if (this.pinchZoomable) this.createPinchZoom(this.pinchZoomable.getZoomable(), this.pinchZoomable.getViewport());
	}
	shouldDisplayCollapsedQuotes() {
		return this.quoteState === "unset" ? this.currentQuoteBehavior === "expand" : this.quoteState === "expanded";
	}
	/**
	* manually wrap and style a mail body to display correctly inside a shadow root
	* @param sanitizedMailBody the mail body to display
	* @param attrs
	* @param parent the parent element that contains the shadowMailBody
	* @private
	*/
	renderShadowMailBody(sanitizedMailBody, attrs, parent) {
		this.currentQuoteBehavior = attrs.defaultQuoteBehavior;
		assertNonNull(this.shadowDomRoot, "shadow dom root is null!");
		while (this.shadowDomRoot.firstChild) this.shadowDomRoot.firstChild.remove();
		const wrapNode = document.createElement("div");
		wrapNode.className = "drag selectable touch-callout break-word-links" + (client.isMobileDevice() ? " break-pre" : "");
		wrapNode.setAttribute("data-testid", "mailBody_label");
		wrapNode.style.lineHeight = String(this.bodyLineHeight ? this.bodyLineHeight.toString() : size.line_height);
		wrapNode.style.transformOrigin = "0px 0px";
		const contentRoot = sanitizedMailBody.cloneNode(true);
		for (const child of Array.from(contentRoot.children)) child.removeAttribute("align");
		wrapNode.appendChild(contentRoot);
		this.shadowDomMailContent = wrapNode;
		const quoteElements = Array.from(wrapNode.querySelectorAll("blockquote:not(blockquote blockquote)"));
		if (quoteElements.length === 0) this.quoteState = "noquotes";
		for (const quote of quoteElements) this.createCollapsedBlockQuote(quote, this.shouldDisplayCollapsedQuotes());
		this.shadowDomRoot.appendChild(styles.getStyleSheetElement("main"));
		this.shadowDomRoot.appendChild(wrapNode);
		if (client.isMobileDevice()) {
			this.pinchZoomable = null;
			this.resizeObserverZoomable?.disconnect();
			this.resizeObserverZoomable = new ResizeObserver((entries) => {
				if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
				this.resizeRaf = requestAnimationFrame(() => {
					this.createPinchZoom(wrapNode, parent);
				});
			});
			this.resizeObserverZoomable.observe(wrapNode);
		} else wrapNode.addEventListener("click", (event) => {
			this.handleAnchorClick(event, event.target, false);
		});
		this.currentlyRenderedMailBody = sanitizedMailBody;
	}
	createCollapsedBlockQuote(quote, expanded) {
		const quoteWrap = document.createElement("div");
		quoteWrap.setAttribute("tuta-collapsed-quote", "true");
		quote.replaceWith(quoteWrap);
		quote.style.display = expanded ? "" : "none";
		const quoteIndicator = document.createElement("div");
		quoteIndicator.classList.add("flex");
		quoteIndicator.style.borderLeft = `2px solid ${theme.content_border}`;
		quoteIndicator.style.display = expanded ? "none" : "";
		mithril_default.render(quoteIndicator, mithril_default(Icon, {
			icon: Icons.More,
			class: "icon-xl mlr",
			container: "div",
			style: { fill: theme.navigation_menu_icon }
		}));
		quoteWrap.appendChild(quote);
		quoteWrap.appendChild(quoteIndicator);
	}
	clearDomBody() {
		this.domBodyDeferred = defer();
		this.domBody = null;
		this.shadowDomRoot = null;
	}
	setDomBody(dom) {
		if (dom !== this.domBody || this.shadowDomRoot == null) {
			this.shadowDomRoot = dom.attachShadow({ mode: "open" });
			this.shadowDomRoot.getRootNode().addEventListener("keydown", (event) => {
				const { target } = event;
				if (this.eventTargetWithKeyboardInput(target)) event.stopPropagation();
			});
		}
		this.domBodyDeferred.resolve(dom);
		this.domBody = dom;
	}
	renderLoadingIcon() {
		return mithril_default(".progress-panel.flex-v-center.items-center", {
			key: "loadingIcon",
			style: { height: "200px" }
		}, [progressIcon(), mithril_default("small", lang.get("loading_msg"))]);
	}
	async replaceInlineImages() {
		const loadedInlineImages = await this.viewModel.getLoadedInlineImages();
		const domBody = await this.domBodyDeferred.promise;
		replaceCidsWithInlineImages(domBody, loadedInlineImages, (cid, event) => {
			const inlineAttachment = this.viewModel.getAttachments().find((attachment) => attachment.cid === cid);
			if (inlineAttachment && (!client.isMobileDevice() || !this.pinchZoomable || !this.pinchZoomable.isDraggingOrZooming())) {
				const coords = getCoordsOfMouseOrTouchEvent(event);
				showDropdownAtPosition([{
					label: "download_action",
					click: () => this.viewModel.downloadAndOpenAttachment(inlineAttachment, false)
				}, {
					label: "open_action",
					click: () => this.viewModel.downloadAndOpenAttachment(inlineAttachment, true)
				}], coords.x, coords.y);
			}
		});
	}
	setupShortcuts(attrs) {
		const userController = locator.logins.getUserController();
		const shortcuts = [
			{
				key: Keys.E,
				enabled: () => this.viewModel.isDraftMail(),
				exec: () => {
					editDraft(this.viewModel);
				},
				help: "editMail_action"
			},
			{
				key: Keys.H,
				enabled: () => !this.viewModel.isDraftMail(),
				exec: () => {
					showHeaderDialog(this.viewModel.getHeaders());
				},
				help: "showHeaders_action"
			},
			{
				key: Keys.I,
				enabled: () => !this.viewModel.isDraftMail(),
				exec: () => {
					showSourceDialog(this.viewModel.getMailBody());
				},
				help: "showSource_action"
			},
			{
				key: Keys.R,
				exec: () => {
					this.viewModel.reply(false);
				},
				enabled: () => !this.viewModel.isDraftMail(),
				help: "reply_action"
			},
			{
				key: Keys.R,
				shift: true,
				exec: () => {
					this.viewModel.reply(true);
				},
				enabled: () => !this.viewModel.isDraftMail(),
				help: "replyAll_action"
			}
		];
		if (userController.isInternalUser()) shortcuts.push({
			key: Keys.F,
			shift: true,
			enabled: () => !this.viewModel.isDraftMail(),
			exec: () => {
				this.viewModel.forward().catch(ofClass(UserError, showUserError));
			},
			help: "forward_action"
		});
		return shortcuts;
	}
	updateLineHeight(dom) {
		const width = dom.offsetWidth;
		if (width > 900) this.bodyLineHeight = size.line_height_l;
else if (width > 600) this.bodyLineHeight = size.line_height_m;
else this.bodyLineHeight = size.line_height;
		dom.style.lineHeight = String(this.bodyLineHeight);
	}
	async createMailAddressContextButtons(args) {
		const { mailAddress, defaultInboxRuleField, createContact = true } = args;
		const buttons = [];
		buttons.push({
			label: "copy_action",
			click: () => copyToClipboard(mailAddress.address)
		});
		if (locator.logins.getUserController().isInternalUser()) {
			if (createContact && !locator.logins.isEnabled(FeatureType.DisableContacts) && locator.logins.isFullyLoggedIn()) {
				const contact = await this.viewModel.contactModel.searchForContact(mailAddress.address);
				if (contact) buttons.push({
					label: "showContact_action",
					click: () => {
						const [listId, contactId] = assertNotNull(contact)._id;
						mithril_default.route.set("/contact/:listId/:contactId", {
							listId,
							contactId,
							focusItem: true
						});
					}
				});
else buttons.push({
					label: "createContact_action",
					click: () => {
						this.viewModel.contactModel.getContactListId().then((contactListId) => {
							import("./ContactEditor2-chunk.js").then(({ ContactEditor }) => {
								const contact$1 = createNewContact(locator.logins.getUserController().user, mailAddress.address, mailAddress.name);
								new ContactEditor(this.viewModel.entityClient, contact$1, assertNotNull(contactListId)).show();
							});
						});
					}
				});
			}
			if (defaultInboxRuleField && !locator.logins.isEnabled(FeatureType.InternalCommunication)) {
				const rule = getExistingRuleForType(locator.logins.getUserController().props, mailAddress.address.trim().toLowerCase(), defaultInboxRuleField);
				buttons.push({
					label: rule ? "editInboxRule_action" : "addInboxRule_action",
					click: async () => {
						const mailboxDetails = await this.viewModel.mailModel.getMailboxDetailsForMail(this.viewModel.mail);
						if (mailboxDetails == null) return;
						const { show, createInboxRuleTemplate } = await import("./AddInboxRuleDialog2-chunk.js");
						const newRule = rule ?? createInboxRuleTemplate(defaultInboxRuleField, mailAddress.address.trim().toLowerCase());
						show(mailboxDetails, newRule);
					}
				});
			}
			if (this.viewModel.canCreateSpamRule()) buttons.push({
				label: "addSpamRule_action",
				click: () => this.addSpamRule(defaultInboxRuleField, mailAddress.address)
			});
		}
		return buttons;
	}
	addSpamRule(defaultInboxRuleField, address) {
		const folder = this.viewModel.mailModel.getMailFolderForMail(this.viewModel.mail);
		const spamRuleType = folder && folder.folderType === MailSetKind.SPAM ? SpamRuleType.WHITELIST : SpamRuleType.BLACKLIST;
		let spamRuleField;
		switch (defaultInboxRuleField) {
			case InboxRuleType.RECIPIENT_TO_EQUALS:
				spamRuleField = SpamRuleFieldType.TO;
				break;
			case InboxRuleType.RECIPIENT_CC_EQUALS:
				spamRuleField = SpamRuleFieldType.CC;
				break;
			case InboxRuleType.RECIPIENT_BCC_EQUALS:
				spamRuleField = SpamRuleFieldType.BCC;
				break;
			default:
				spamRuleField = SpamRuleFieldType.FROM;
				break;
		}
		import("./AddSpamRuleDialog2-chunk.js").then(async ({ showAddSpamRuleDialog }) => {
			const value = address.trim().toLowerCase();
			showAddSpamRuleDialog(createEmailSenderListElement({
				value,
				type: spamRuleType,
				field: spamRuleField,
				hashedValue: await locator.worker.getWorkerInterface().cryptoFacade.sha256(value)
			}));
		});
	}
	handleAnchorClick(event, eventTarget, shouldDispatchSyntheticClick) {
		const href = eventTarget?.closest("a")?.getAttribute("href") ?? null;
		if (href) {
			if (href.startsWith("mailto:")) {
				event.preventDefault();
				if (isNewMailActionAvailable()) import("./MailEditor2-chunk.js").then(({ newMailtoUrlMailEditor }) => {
					newMailtoUrlMailEditor(href, !locator.logins.getUserController().props.defaultUnconfidential).then((editor) => editor.show()).catch(ofClass(CancelledError, noOp));
				});
			} else if (isSettingsLink(href, this.viewModel.mail)) {
				const newRoute = href.substring(href.indexOf("/settings/"));
				mithril_default.route.set(newRoute);
				event.preventDefault();
			} else if (shouldDispatchSyntheticClick) {
				const syntheticTag = document.createElement("a");
				syntheticTag.setAttribute("href", href);
				syntheticTag.setAttribute("target", "_blank");
				syntheticTag.setAttribute("rel", "noopener noreferrer");
				const newClickEvent = new MouseEvent("click");
				syntheticTag.dispatchEvent(newClickEvent);
			}
		}
	}
	/**
	* returns true if the passed in target is an HTMLElement that can receive some sort of keyboard input
	*/
	eventTargetWithKeyboardInput(target) {
		if (target && target instanceof HTMLElement) return target.matches("input[type=\"text\"], input[type=\"date\"], input[type=\"datetime-local\"], input[type=\"email\"], input[type=\"month\"], input[type=\"number\"],input[type=\"password\"], input[type=\"search\"], input[type=\"tel\"], input[type=\"time\"], input[type=\"url\"], input[type=\"week\"], input[type=\"datetime\"], textarea");
		return false;
	}
	async handleAttachmentImport(file) {
		try {
			await this.viewModel.importAttachment(file);
		} catch (e) {
			console.log(e);
			if (e instanceof UserError) return await Dialog.message(lang.makeTranslation("error_msg", e.message));
			await Dialog.message("unknownError_msg");
		}
	}
};
/**
* support and invoice mails can contain links to the settings page.
* we don't want normal mails to be able to link places in the app, though.
* */
function isSettingsLink(href, mail) {
	return (href.startsWith("/settings/") ?? false) && isTutanotaTeamMail(mail);
}

//#endregion
//#region src/mail-app/mail/view/CollapsedMailView.ts
var CollapsedMailView = class {
	view({ attrs }) {
		const { viewModel } = attrs;
		const { mail } = viewModel;
		const dateTime = formatDateWithWeekday(mail.receivedDate) + " • " + formatTime(mail.receivedDate);
		const folderInfo = viewModel.getFolderInfo();
		if (!folderInfo) return null;
		return mithril_default(".flex.items-center.pt.pb.click.no-wrap", {
			class: responsiveCardHPadding(),
			role: "button",
			"aria-expanded": "false",
			style: { color: theme.content_button },
			onclick: () => viewModel.expandMail(Promise.resolve()),
			onkeyup: (e) => {
				if (isKeyPressed(e.key, Keys.SPACE)) viewModel.expandMail(Promise.resolve());
			},
			tabindex: TabIndex.Default
		}, [
			viewModel.isUnread() ? this.renderUnreadDot() : null,
			viewModel.isDraftMail() ? mithril_default(".mr-xs", this.renderIcon(Icons.Edit, lang.get("draft_label"))) : null,
			this.renderSender(viewModel),
			mithril_default(".flex.ml-between-s.items-center", [
				mail.attachments.length > 0 ? this.renderIcon(Icons.Attachment, lang.get("attachment_label")) : null,
				viewModel.isConfidential() ? this.renderIcon(getConfidentialIcon(mail), lang.get("confidential_label")) : null,
				this.renderIcon(getFolderIconByType(folderInfo.folderType), folderInfo.name),
				mithril_default(".small.font-weight-600", dateTime)
			])
		]);
	}
	renderSender(viewModel) {
		const sender = viewModel.getDisplayedSender();
		return mithril_default(this.getMailAddressDisplayClasses(viewModel), sender == null ? "" : getMailAddressDisplayText(sender.name, sender.address, true));
	}
	getMailAddressDisplayClasses(viewModel) {
		let classes = ".flex-grow.text-ellipsis";
		if (viewModel.isUnread()) classes += ".font-weight-600";
		return classes;
	}
	renderUnreadDot() {
		return mithril_default(".flex.flex-no-grow.no-shrink.pr-s", mithril_default(".dot.bg-accent-fg", { style: { marginTop: 0 } }));
	}
	renderIcon(icon, hoverText = null) {
		return mithril_default(Icon, {
			icon,
			container: "div",
			style: { fill: theme.content_button },
			hoverText
		});
	}
};

//#endregion
//#region src/mail-app/mail/view/ConversationViewer.ts
const SCROLL_FACTOR = .8;
const conversationCardMargin = size.hpad_large;
var ConversationViewer = class {
	containerDom = null;
	didScroll = false;
	/** items from the last render, we need them to calculate the right subject based on the scroll position without the full re-render. */
	lastItems = null;
	shortcuts = [
		{
			key: Keys.PAGE_UP,
			exec: () => this.scrollUp(),
			help: "scrollUp_action"
		},
		{
			key: Keys.PAGE_DOWN,
			exec: () => this.scrollDown(),
			help: "scrollDown_action"
		},
		{
			key: Keys.HOME,
			exec: () => this.scrollToTop(),
			help: "scrollToTop_action"
		},
		{
			key: Keys.END,
			exec: () => this.scrollToBottom(),
			help: "scrollToBottom_action"
		}
	];
	oncreate() {
		keyManager.registerShortcuts(this.shortcuts);
	}
	onremove() {
		keyManager.unregisterShortcuts(this.shortcuts);
	}
	view(vnode) {
		const { viewModel, delayBodyRendering } = vnode.attrs;
		viewModel.init(delayBodyRendering);
		this.lastItems = viewModel.conversationItems();
		this.doScroll(viewModel, this.lastItems);
		return mithril_default(".fill-absolute.nav-bg.flex.col", [mithril_default(".flex-grow.overflow-y-scroll", {
			oncreate: (vnode$1) => {
				this.containerDom = vnode$1.dom;
			},
			onremove: () => {
				console.log("remove container");
			}
		}, this.renderItems(viewModel, this.lastItems), this.renderLoadingState(viewModel), this.renderFooter())]);
	}
	renderFooter() {
		const height = document.body.offsetHeight - (styles.isUsingBottomNavigation() ? size.navbar_height_mobile + size.bottom_nav_bar : size.navbar_height) - 300;
		return mithril_default(".mt-l.noprint", { style: { height: px(height) } });
	}
	renderItems(viewModel, entries) {
		return entries.map((entry, position) => {
			switch (entry.type) {
				case "mail": {
					const mailViewModel = entry.viewModel;
					const isPrimary = mailViewModel === viewModel.primaryViewModel();
					return this.renderViewer(mailViewModel, isPrimary, viewModel.isFinished() ? position : null);
				}
			}
		});
	}
	renderLoadingState(viewModel) {
		return viewModel.isConnectionLost() ? mithril_default(".center", mithril_default(Button, {
			type: ButtonType.Secondary,
			label: "retry_action",
			click: () => viewModel.retry()
		})) : !viewModel.isFinished() ? mithril_default(".font-weight-600.center.mt-l." + responsiveCardHMargin(), { style: { color: theme.content_button } }, lang.get("loading_msg")) : null;
	}
	renderViewer(mailViewModel, isPrimary, position) {
		return mithril_default(".mlr-safe-inset", mithril_default(".border-radius-big.rel", {
			class: responsiveCardHMargin(),
			key: elementIdPart(mailViewModel.mail.conversationEntry),
			style: {
				backgroundColor: theme.content_bg,
				marginTop: px(position == null || position === 0 ? 0 : conversationCardMargin)
			}
		}, mailViewModel.isCollapsed() ? mithril_default(CollapsedMailView, { viewModel: mailViewModel }) : mithril_default(MailViewer, {
			viewModel: mailViewModel,
			isPrimary,
			defaultQuoteBehavior: position === 0 ? "expand" : "collapse"
		})));
	}
	doScroll(viewModel, items) {
		const containerDom = this.containerDom;
		if (!this.didScroll && containerDom && viewModel.isFinished()) {
			const conversationId = viewModel.primaryMail.conversationEntry;
			this.didScroll = true;
			Promise.resolve().then(() => {
				const itemIndex = items.findIndex((e) => e.type === "mail" && isSameId(e.entryId, conversationId));
				if (itemIndex > 0) {
					const childDom = containerDom.childNodes[itemIndex];
					const parentTop = containerDom.getBoundingClientRect().top;
					const childTop = childDom.getBoundingClientRect().top;
					const relativeTop = childTop - parentTop;
					const top = relativeTop - conversationCardMargin * 2 - 10;
					containerDom.scrollTo({ top });
				}
			});
		}
	}
	scrollUp() {
		if (this.containerDom) this.containerDom.scrollBy({
			top: -this.containerDom.clientHeight * SCROLL_FACTOR,
			behavior: "smooth"
		});
	}
	scrollDown() {
		if (this.containerDom) this.containerDom.scrollBy({
			top: this.containerDom.clientHeight * SCROLL_FACTOR,
			behavior: "smooth"
		});
	}
	scrollToTop() {
		if (this.containerDom) this.containerDom.scrollTo({
			top: 0,
			behavior: "smooth"
		});
	}
	scrollToBottom() {
		if (this.containerDom) this.containerDom.scrollTo({
			top: this.containerDom.scrollHeight - this.containerDom.offsetHeight,
			behavior: "smooth"
		});
	}
};

//#endregion
//#region src/mail-app/mail/view/MailViewerToolbar.ts
var import_stream = __toESM(require_stream(), 1);
var MailViewerActions = class {
	view(vnode) {
		return mithril_default(".flex.ml-between-s.items-center", [
			this.renderSingleMailActions(vnode.attrs),
			vnode.attrs.mailViewerViewModel ? mithril_default(".nav-bar-spacer") : null,
			this.renderActions(vnode.attrs),
			this.renderMoreButton(vnode.attrs.mailViewerViewModel)
		]);
	}
	renderActions(attrs) {
		const mailModel = attrs.mailViewerViewModel ? attrs.mailViewerViewModel.mailModel : attrs.mailModel;
		if (!mailModel || !attrs.mails) return null;
else if (attrs.mailViewerViewModel) return [
			this.renderDeleteButton(mailModel, attrs.mails, attrs.selectNone ?? noOp),
			attrs.mailViewerViewModel.canForwardOrMove() ? this.renderMoveButton(attrs.mailboxModel, mailModel, attrs.mails) : null,
			attrs.mailModel.canAssignLabels() ? this.renderLabelButton(mailModel, attrs.mails) : null,
			attrs.mailViewerViewModel.isDraftMail() ? null : this.renderReadButton(attrs)
		];
else if (attrs.mails.length > 0) return [
			this.renderDeleteButton(mailModel, attrs.mails, attrs.selectNone ?? noOp),
			attrs.mailModel.isMovingMailsAllowed() ? this.renderMoveButton(attrs.mailboxModel, mailModel, attrs.mails) : null,
			attrs.mailModel.canAssignLabels() && allInSameMailbox(attrs.mails) ? this.renderLabelButton(mailModel, attrs.mails) : null,
			this.renderReadButton(attrs),
			this.renderExportButton(attrs)
		];
	}
	renderSingleMailActions(attrs) {
		if (attrs.mailViewerViewModel) if (attrs.mailViewerViewModel.isAnnouncement()) return [];
else if (attrs.mailViewerViewModel.isDraftMail()) return [this.renderEditButton(attrs.mailViewerViewModel)];
else if (attrs.mailViewerViewModel.canForwardOrMove()) return [this.renderReplyButton(attrs.mailViewerViewModel), this.renderForwardButton(attrs.mailViewerViewModel)];
else return [this.renderReplyButton(attrs.mailViewerViewModel)];
else return [];
	}
	renderDeleteButton(mailModel, mails, selectNone) {
		return mithril_default(IconButton, {
			title: "delete_action",
			click: () => {
				promptAndDeleteMails(mailModel, mails, selectNone);
			},
			icon: Icons.Trash
		});
	}
	renderMoveButton(mailboxModel, mailModel, mails) {
		return mithril_default(IconButton, {
			title: "move_action",
			icon: Icons.Folder,
			click: (e, dom) => showMoveMailsDropdown(mailboxModel, mailModel, dom.getBoundingClientRect(), mails)
		});
	}
	renderLabelButton(mailModel, mails) {
		return mithril_default(IconButton, {
			title: "assignLabel_action",
			icon: Icons.Label,
			click: (_, dom) => {
				const popup = new LabelsPopup(dom, dom.getBoundingClientRect(), styles.isDesktopLayout() ? 300 : 200, mailModel.getLabelsForMails(mails), mailModel.getLabelStatesForMails(mails), (addedLabels, removedLabels) => mailModel.applyLabels(mails, addedLabels, removedLabels));
				popup.show();
			}
		});
	}
	renderReadButton({ mailModel, mailViewerViewModel, mails }) {
		const markAction = mailViewerViewModel ? (unread) => mailViewerViewModel.setUnread(unread) : (unread) => mailModel.markMails(mails, unread);
		const markReadButton = mithril_default(IconButton, {
			title: "markRead_action",
			click: () => markAction(false),
			icon: Icons.Eye
		});
		const markUnreadButton = mithril_default(IconButton, {
			title: "markUnread_action",
			click: () => markAction(true),
			icon: Icons.NoEye
		});
		if (mailViewerViewModel) if (mailViewerViewModel.isUnread()) return markReadButton;
else return markUnreadButton;
		return [markReadButton, markUnreadButton];
	}
	renderExportButton(attrs) {
		if (!isApp() && attrs.mailModel.isExportingMailsAllowed()) {
			const operation = locator.operationProgressTracker.startNewOperation();
			const ac = new AbortController();
			const headerBarAttrs = {
				left: [{
					label: "cancel_action",
					click: () => ac.abort(),
					type: ButtonType.Secondary
				}],
				middle: "emptyString_msg"
			};
			return mithril_default(IconButton, {
				title: "export_action",
				click: () => showProgressDialog(lang.getTranslation("mailExportProgress_msg", {
					"{current}": Math.round(operation.progress() / 100 * attrs.mails.length).toFixed(0),
					"{total}": attrs.mails.length
				}), exportMails(attrs.mails, locator.mailFacade, locator.entityClient, locator.fileController, locator.cryptoFacade, operation.id, ac.signal).then((result) => this.handleExportEmailsResult(result.failed)).finally(operation.done), operation.progress, true, headerBarAttrs),
				icon: Icons.Export
			});
		}
	}
	handleExportEmailsResult(mailList) {
		if (mailList && mailList.length > 0) {
			const lines = mailList.map((mail) => ({
				cells: [mail.sender.address, mail.subject],
				actionButtonAttrs: null
			}));
			const expanded = (0, import_stream.default)(false);
			const dialog = Dialog.createActionDialog({
				title: "failedToExport_title",
				child: () => mithril_default("", [
					mithril_default(".pt-m", lang.get("failedToExport_msg")),
					mithril_default(".flex-start.items-center", [mithril_default(ExpanderButton, {
						label: lang.makeTranslation("hide_show", `${lang.get(expanded() ? "hide_action" : "show_action")} ${lang.get("failedToExport_label", { "{0}": mailList.length })}`),
						expanded: expanded(),
						onExpandedChange: expanded
					})]),
					mithril_default(ExpanderPanel, { expanded: expanded() }, mithril_default(Table, {
						columnHeading: ["email_label", "subject_label"],
						columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
						showActionButtonColumn: false,
						lines
					}))
				]),
				okAction: () => dialog.close(),
				allowCancel: false,
				okActionTextId: "ok_action",
				type: DialogType.EditMedium
			});
			dialog.show();
		}
	}
	renderReplyButton(viewModel) {
		const actions = [];
		actions.push(mithril_default(IconButton, {
			title: "reply_action",
			click: () => viewModel.reply(false),
			icon: Icons.Reply
		}));
		if (viewModel.canReplyAll()) actions.push(mithril_default(IconButton, {
			title: "replyAll_action",
			click: () => viewModel.reply(true),
			icon: Icons.ReplyAll
		}));
		return actions;
	}
	renderForwardButton(viewModel) {
		return mithril_default(IconButton, {
			title: "forward_action",
			click: () => viewModel.forward().catch(ofClass(UserError, showUserError)),
			icon: Icons.Forward
		});
	}
	renderMoreButton(viewModel) {
		let actions = [];
		if (viewModel) actions = mailViewerMoreActions(viewModel, false);
		return actions.length > 0 ? mithril_default(IconButton, {
			title: "more_label",
			icon: Icons.More,
			click: createDropdown({
				lazyButtons: () => actions,
				width: 300
			})
		}) : null;
	}
	renderEditButton(viewModel) {
		return mithril_default(IconButton, {
			title: "edit_action",
			click: () => editDraft(viewModel),
			icon: Icons.Edit
		});
	}
};

//#endregion
//#region src/mail-app/mail/view/MobileMailMultiselectionActionBar.ts
var MobileMailMultiselectionActionBar = class {
	dom = null;
	view({ attrs }) {
		const { mails, selectNone, mailModel, mailboxModel } = attrs;
		return mithril_default(MobileBottomActionBar, { oncreate: ({ dom }) => this.dom = dom }, [
			mithril_default(IconButton, {
				icon: Icons.Trash,
				title: "delete_action",
				click: () => promptAndDeleteMails(mailModel, mails, selectNone)
			}),
			mailModel.isMovingMailsAllowed() ? mithril_default(IconButton, {
				icon: Icons.Folder,
				title: "move_action",
				click: (e, dom) => {
					const referenceDom = this.dom ?? dom;
					showMoveMailsDropdown(mailboxModel, mailModel, referenceDom.getBoundingClientRect(), mails, {
						onSelected: () => selectNone,
						width: referenceDom.offsetWidth - DROPDOWN_MARGIN * 2
					});
				}
			}) : null,
			mailModel.canAssignLabels() && allInSameMailbox(mails) ? mithril_default(IconButton, {
				icon: Icons.Label,
				title: "assignLabel_action",
				click: (e, dom) => {
					const referenceDom = this.dom ?? dom;
					if (mails.length !== 0) {
						const popup = new LabelsPopup(referenceDom, referenceDom.getBoundingClientRect(), referenceDom.offsetWidth - DROPDOWN_MARGIN * 2, mailModel.getLabelsForMails(mails), mailModel.getLabelStatesForMails(mails), (addedLabels, removedLabels) => mailModel.applyLabels(mails, addedLabels, removedLabels));
						popup.show();
					}
				}
			}) : null,
			mithril_default(IconButton, {
				icon: Icons.Eye,
				title: "markRead_action",
				click: () => {
					mailModel.markMails(mails, false);
				}
			}),
			mithril_default(IconButton, {
				icon: Icons.NoEye,
				title: "markUnread_action",
				click: () => {
					mailModel.markMails(mails, true);
				}
			})
		]);
	}
};

//#endregion
//#region src/mail-app/mail/view/MailFilterButton.ts
var MailFilterButton = class {
	view({ attrs }) {
		return mithril_default(ToggleButton, {
			icon: Icons.Filter,
			title: "filter_label",
			toggled: attrs.filter != null,
			onToggled: (_, event) => this.showDropdown(attrs, event)
		});
	}
	showDropdown({ filter, setFilter }, event) {
		createDropdown({ lazyButtons: () => [
			{
				selected: filter === MailFilterType.Unread,
				label: "filterUnread_label",
				click: () => {
					setFilter(MailFilterType.Unread);
				}
			},
			{
				selected: filter === MailFilterType.Read,
				label: "filterRead_label",
				click: () => {
					setFilter(MailFilterType.Read);
				}
			},
			{
				selected: filter === MailFilterType.WithAttachments,
				label: "filterWithAttachments_label",
				click: () => {
					setFilter(MailFilterType.WithAttachments);
				}
			},
			{
				label: "filterAllMails_label",
				click: () => {
					setFilter(null);
				}
			}
		] })(event, event.target);
	}
};

//#endregion
export { ConversationViewer, LabelsPopup, MailFilterButton, MailViewerActions, MobileMailActionBar, MobileMailMultiselectionActionBar, MultiItemViewer, conversationCardMargin, getMailSelectionMessage };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbEZpbHRlckJ1dHRvbi1jaHVuay5qcyIsIm5hbWVzIjpbInNlbGVjdGVkRW50aXRpZXM6IFJlYWRvbmx5QXJyYXk8TWFpbD4iLCJzb3VyY2VFbGVtZW50OiBIVE1MRWxlbWVudCIsIm9yaWdpbjogUG9zUmVjdCIsIndpZHRoOiBudW1iZXIiLCJsYWJlbHNGb3JNYWlsczogUmVhZG9ubHlNYXA8SWQsIFJlYWRvbmx5QXJyYXk8TWFpbEZvbGRlcj4+IiwibGFiZWxzOiB7IGxhYmVsOiBNYWlsRm9sZGVyOyBzdGF0ZTogTGFiZWxTdGF0ZSB9W10iLCJvbkxhYmVsc0FwcGxpZWQ6IChhZGRlZExhYmVsczogTWFpbEZvbGRlcltdLCByZW1vdmVkTGFiZWxzOiBNYWlsRm9sZGVyW10pID0+IHVua25vd24iLCJlOiBNb3VzZUV2ZW50IiwiZTogRXZlbnQiLCJzdGF0ZTogTGFiZWxTdGF0ZSIsInJlbW92ZWRMYWJlbHM6IE1haWxGb2xkZXJbXSIsImFkZGVkTGFiZWxzOiBNYWlsRm9sZGVyW10iLCJ2bm9kZTogVm5vZGVET00iLCJsYWJlbFN0YXRlOiB7IGxhYmVsOiBNYWlsRm9sZGVyOyBzdGF0ZTogTGFiZWxTdGF0ZSB9Iiwidm5vZGU6IFZub2RlPE1vYmlsZU1haWxBY3Rpb25CYXJBdHRycz4iLCJhY3Rpb25zOiBDaGlsZHJlbltdIiwidm5vZGUiLCJtb3JlQnV0dG9uczogRHJvcGRvd25CdXR0b25BdHRyc1tdIiwiYnV0dG9uczogRHJvcGRvd25CdXR0b25BdHRyc1tdIiwiYXR0cnM6IE1vYmlsZU1haWxBY3Rpb25CYXJBdHRycyIsImV2ZW50OiBDYWxlbmRhckV2ZW50IiwibWFpbDogTWFpbCIsInJlY2lwaWVudDogc3RyaW5nIiwibWV0aG9kOiBDYWxlbmRhck1ldGhvZCIsInN0YXR1czogQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cyIsIm0iLCJwcmV2aW91c01haWw6IE1haWwiLCJlOiBNb3VzZUV2ZW50Iiwidmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsIiwiYXR0cnM6IE1haWxWaWV3ZXJIZWFkZXJBdHRycyIsImRhdGVUaW1lOiBzdHJpbmciLCJkYXRlVGltZUZ1bGw6IHN0cmluZyIsImU6IEtleWJvYXJkRXZlbnQiLCJlOiBNb3VzZUV2ZW50IiwiaW1wb3J0RmlsZTogKGZpbGU6IFR1dGFub3RhRmlsZSkgPT4gdm9pZCIsImF0dGFjaG1lbnRzOiBUdXRhbm90YUZpbGVbXSIsInNob3dCdXR0b246IEJhbm5lckJ1dHRvbkF0dHJzIiwibWF5YmVEcm9wZG93bkJ1dHRvbnM6IFJlYWRvbmx5QXJyYXk8QmFubmVyQnV0dG9uQXR0cnM+IiwiYWN0aW9uQnV0dG9uczogRHJvcGRvd25CdXR0b25BdHRyc1tdIiwiXzogTW91c2VFdmVudCIsImRvbTogSFRNTEVsZW1lbnQiLCJ2bm9kZTogVm5vZGU8TWFpbFZpZXdlckF0dHJzPiIsInZpZXdNb2RlbDogTWFpbFZpZXdlclZpZXdNb2RlbCIsImlzUHJpbWFyeTogYm9vbGVhbiIsInZub2RlIiwiYXR0cnM6IE1haWxWaWV3ZXJBdHRycyIsImZpbGU6IFR1dGFub3RhRmlsZSIsInNhbml0aXplZE1haWxCb2R5OiBEb2N1bWVudEZyYWdtZW50IiwiZXZlbnQ6IEV2ZW50Iiwiem9vbWFibGU6IEhUTUxFbGVtZW50Iiwidmlld3BvcnQ6IEhUTUxFbGVtZW50IiwiZG9tOiBQYXJlbnROb2RlIiwic2hvd1F1b3RlOiBib29sZWFuIiwicXVvdGVzOiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiIsInBhcmVudDogSFRNTEVsZW1lbnQiLCJxdW90ZTogSFRNTEVsZW1lbnQiLCJleHBhbmRlZDogYm9vbGVhbiIsImRvbTogSFRNTEVsZW1lbnQiLCJzaG9ydGN1dHM6IFNob3J0Y3V0W10iLCJhcmdzOiB7XG5cdFx0bWFpbEFkZHJlc3M6IE1haWxBZGRyZXNzQW5kTmFtZVxuXHRcdGRlZmF1bHRJbmJveFJ1bGVGaWVsZDogSW5ib3hSdWxlVHlwZSB8IG51bGxcblx0XHRjcmVhdGVDb250YWN0PzogYm9vbGVhblxuXHR9IiwiY29udGFjdCIsImRlZmF1bHRJbmJveFJ1bGVGaWVsZDogSW5ib3hSdWxlVHlwZSB8IG51bGwiLCJhZGRyZXNzOiBzdHJpbmciLCJzcGFtUnVsZUZpZWxkOiBTcGFtUnVsZUZpZWxkVHlwZSIsImV2ZW50VGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGwiLCJzaG91bGREaXNwYXRjaFN5bnRoZXRpY0NsaWNrOiBib29sZWFuIiwidGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGwiLCJocmVmOiBzdHJpbmciLCJtYWlsOiBNYWlsIiwiZTogS2V5Ym9hcmRFdmVudCIsInZpZXdNb2RlbDogTWFpbFZpZXdlclZpZXdNb2RlbCIsImljb246IEFsbEljb25zIiwiaG92ZXJUZXh0OiBzdHJpbmcgfCBudWxsIiwidm5vZGU6IFZub2RlPENvbnZlcnNhdGlvblZpZXdlckF0dHJzPiIsInZub2RlIiwidmlld01vZGVsOiBDb252ZXJzYXRpb25WaWV3TW9kZWwiLCJlbnRyaWVzOiByZWFkb25seSBDb252ZXJzYXRpb25JdGVtW10iLCJtYWlsVmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsIiwiaXNQcmltYXJ5OiBib29sZWFuIiwicG9zaXRpb246IG51bWJlciB8IG51bGwiLCJpdGVtczogcmVhZG9ubHkgQ29udmVyc2F0aW9uSXRlbVtdIiwidm5vZGU6IFZub2RlPE1haWxWaWV3ZXJUb29sYmFyQXR0cnM+IiwiYXR0cnM6IE1haWxWaWV3ZXJUb29sYmFyQXR0cnMiLCJtYWlsTW9kZWw6IE1haWxNb2RlbCIsIm1haWxzOiBNYWlsW10iLCJzZWxlY3ROb25lOiAoKSA9PiB2b2lkIiwibWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWwiLCJtYXJrQWN0aW9uOiAodW5yZWFkOiBib29sZWFuKSA9PiB1bmtub3duIiwiaGVhZGVyQmFyQXR0cnM6IERpYWxvZ0hlYWRlckJhckF0dHJzIiwibWFpbExpc3Q6IE1haWxbXSIsInZpZXdNb2RlbDogTWFpbFZpZXdlclZpZXdNb2RlbCIsImFjdGlvbnM6IENoaWxkcmVuIiwidmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsIHwgdW5kZWZpbmVkIiwiYWN0aW9uczogRHJvcGRvd25CdXR0b25BdHRyc1tdIiwiZXZlbnQ6IE1vdXNlRXZlbnQiXSwic291cmNlcyI6WyIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L011bHRpSXRlbVZpZXdlci50cyIsIi4uL3NyYy9tYWlsLWFwcC9tYWlsL3ZpZXcvTGFiZWxzUG9wdXAudHMiLCIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L01vYmlsZU1haWxBY3Rpb25CYXIudHMiLCIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L0V2ZW50QmFubmVyLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvYmFzZS9SZWNpcGllbnRCdXR0b24udHMiLCIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L01haWxWaWV3ZXJIZWFkZXIudHMiLCIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L01haWxWaWV3ZXIudHMiLCIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L0NvbGxhcHNlZE1haWxWaWV3LnRzIiwiLi4vc3JjL21haWwtYXBwL21haWwvdmlldy9Db252ZXJzYXRpb25WaWV3ZXIudHMiLCIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L01haWxWaWV3ZXJUb29sYmFyLnRzIiwiLi4vc3JjL21haWwtYXBwL21haWwvdmlldy9Nb2JpbGVNYWlsTXVsdGlzZWxlY3Rpb25BY3Rpb25CYXIudHMiLCIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L01haWxGaWx0ZXJCdXR0b24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG0sIHsgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCBDb2x1bW5FbXB0eU1lc3NhZ2VCb3ggZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Db2x1bW5FbXB0eU1lc3NhZ2VCb3hcIlxuaW1wb3J0IHsgbGFuZywgVHJhbnNsYXRpb24sIE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgQm9vdEljb25zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9Cb290SWNvbnNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS90aGVtZVwiXG5pbXBvcnQgdHlwZSB7IE1haWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBCdXR0b24sIEJ1dHRvblR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBwcm9ncmVzc0ljb24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb24uanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcblxuZXhwb3J0IHR5cGUgTXVsdGlJdGVtVmlld2VyQXR0cnM8VD4gPSB7XG5cdHNlbGVjdGVkRW50aXRpZXM6IEFycmF5PFQ+XG5cdHNlbGVjdE5vbmU6ICgpID0+IHVua25vd25cblx0bG9hZGluZ0FsbDogXCJjYW5fbG9hZFwiIHwgXCJsb2FkaW5nXCIgfCBcImxvYWRlZFwiXG5cdGxvYWRBbGw6ICgpID0+IHVua25vd25cblx0c3RvcExvYWRBbGw6ICgpID0+IHVua25vd25cblx0Z2V0U2VsZWN0aW9uTWVzc2FnZTogKGVudGl0aWVzOiBSZWFkb25seUFycmF5PFQ+KSA9PiBNYXliZVRyYW5zbGF0aW9uXG59XG5cbmV4cG9ydCBjbGFzcyBNdWx0aUl0ZW1WaWV3ZXI8VD4gaW1wbGVtZW50cyBDb21wb25lbnQ8TXVsdGlJdGVtVmlld2VyQXR0cnM8VD4+IHtcblx0dmlldyh7IGF0dHJzIH06IFZub2RlPE11bHRpSXRlbVZpZXdlckF0dHJzPFQ+Pikge1xuXHRcdGNvbnN0IHsgc2VsZWN0ZWRFbnRpdGllcyB9ID0gYXR0cnNcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleC5jb2wuZmlsbC1hYnNvbHV0ZVwiLFxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmZsZXgtZ3Jvdy5yZWwub3ZlcmZsb3ctaGlkZGVuXCIsXG5cdFx0XHRcdFx0bShDb2x1bW5FbXB0eU1lc3NhZ2VCb3gsIHtcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IGF0dHJzLmdldFNlbGVjdGlvbk1lc3NhZ2Uoc2VsZWN0ZWRFbnRpdGllcyksXG5cdFx0XHRcdFx0XHRpY29uOiBCb290SWNvbnMuTWFpbCxcblx0XHRcdFx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X21lc3NhZ2VfYmcsXG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lLm5hdmlnYXRpb25fYmcsXG5cdFx0XHRcdFx0XHRib3R0b21Db250ZW50OiB0aGlzLnJlbmRlckVtcHR5TWVzc2FnZUJ1dHRvbnMoYXR0cnMpLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpLFxuXHRcdFx0KSxcblx0XHRdXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckVtcHR5TWVzc2FnZUJ1dHRvbnMoeyBsb2FkaW5nQWxsLCBzdG9wTG9hZEFsbCwgc2VsZWN0ZWRFbnRpdGllcywgc2VsZWN0Tm9uZSwgbG9hZEFsbCB9OiBNdWx0aUl0ZW1WaWV3ZXJBdHRyczxUPikge1xuXHRcdHJldHVybiBsb2FkaW5nQWxsID09PSBcImxvYWRpbmdcIlxuXHRcdFx0PyBtKFwiLmZsZXguaXRlbXMtY2VudGVyXCIsIFtcblx0XHRcdFx0XHRtKEJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwiY2FuY2VsX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRzdG9wTG9hZEFsbCgpXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdG0oXCIuZmxleC5pdGVtcy1jZW50ZXIucGxyLWJ1dHRvblwiLCBwcm9ncmVzc0ljb24oKSksXG5cdFx0XHQgIF0pXG5cdFx0XHQ6IHNlbGVjdGVkRW50aXRpZXMubGVuZ3RoID09PSAwXG5cdFx0XHQ/IG51bGxcblx0XHRcdDogbShcIi5mbGV4XCIsIFtcblx0XHRcdFx0XHRtKEJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwiY2FuY2VsX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRzZWxlY3ROb25lKClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0bG9hZGluZ0FsbCA9PT0gXCJjYW5fbG9hZFwiXG5cdFx0XHRcdFx0XHQ/IG0oQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwibG9hZEFsbF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0bG9hZEFsbCgpXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdCAgXSlcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWFpbFNlbGVjdGlvbk1lc3NhZ2Uoc2VsZWN0ZWRFbnRpdGllczogUmVhZG9ubHlBcnJheTxNYWlsPik6IFRyYW5zbGF0aW9uIHtcblx0bGV0IG5ick9mU2VsZWN0ZWRNYWlscyA9IHNlbGVjdGVkRW50aXRpZXMubGVuZ3RoXG5cblx0aWYgKG5ick9mU2VsZWN0ZWRNYWlscyA9PT0gMCkge1xuXHRcdHJldHVybiBsYW5nLmdldFRyYW5zbGF0aW9uKFwibm9NYWlsX21zZ1wiKVxuXHR9IGVsc2UgaWYgKG5ick9mU2VsZWN0ZWRNYWlscyA9PT0gMSkge1xuXHRcdHJldHVybiBsYW5nLmdldFRyYW5zbGF0aW9uKFwib25lTWFpbFNlbGVjdGVkX21zZ1wiKVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBsYW5nLmdldFRyYW5zbGF0aW9uKFwibmJyT2ZNYWlsc1NlbGVjdGVkX21zZ1wiLCB7XG5cdFx0XHRcInsxfVwiOiBuYnJPZlNlbGVjdGVkTWFpbHMsXG5cdFx0fSlcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIFZub2RlRE9NIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgbW9kYWwsIE1vZGFsQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Nb2RhbC5qc1wiXG5pbXBvcnQgeyBmb2N1c05leHQsIGZvY3VzUHJldmlvdXMsIFNob3J0Y3V0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0tleU1hbmFnZXIuanNcIlxuaW1wb3J0IHsgQmFzZUJ1dHRvbiwgQmFzZUJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9idXR0b25zL0Jhc2VCdXR0b24uanNcIlxuaW1wb3J0IHsgUG9zUmVjdCwgc2hvd0Ryb3Bkb3duIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyBNYWlsRm9sZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemUuanNcIlxuaW1wb3J0IHsgQWxsSWNvbnMsIEljb24sIEljb25TaXplIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uLmpzXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29ucy5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lLmpzXCJcbmltcG9ydCB7IEtleXMsIE1BWF9MQUJFTFNfUEVSX01BSUwsIFRhYkluZGV4IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IGdldEVsZW1lbnRJZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQgeyBnZXRMYWJlbENvbG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9MYWJlbC5qc1wiXG5pbXBvcnQgeyBMYWJlbFN0YXRlIH0gZnJvbSBcIi4uL21vZGVsL01haWxNb2RlbC5qc1wiXG5pbXBvcnQgeyBBcmlhUm9sZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0FyaWFVdGlscy5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IG5vT3AgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcblxuLyoqXG4gKiBQb3B1cCB0aGF0IGRpc3BsYXlzIGFzc2lnbmVkIGxhYmVscyBhbmQgYWxsb3dzIGNoYW5naW5nIHRoZW1cbiAqL1xuZXhwb3J0IGNsYXNzIExhYmVsc1BvcHVwIGltcGxlbWVudHMgTW9kYWxDb21wb25lbnQge1xuXHRwcml2YXRlIGRvbTogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGlzTWF4TGFiZWxzUmVhY2hlZDogYm9vbGVhblxuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgc291cmNlRWxlbWVudDogSFRNTEVsZW1lbnQsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBvcmlnaW46IFBvc1JlY3QsXG5cdFx0cHJpdmF0ZSByZWFkb25seSB3aWR0aDogbnVtYmVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbGFiZWxzRm9yTWFpbHM6IFJlYWRvbmx5TWFwPElkLCBSZWFkb25seUFycmF5PE1haWxGb2xkZXI+Pixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGxhYmVsczogeyBsYWJlbDogTWFpbEZvbGRlcjsgc3RhdGU6IExhYmVsU3RhdGUgfVtdLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgb25MYWJlbHNBcHBsaWVkOiAoYWRkZWRMYWJlbHM6IE1haWxGb2xkZXJbXSwgcmVtb3ZlZExhYmVsczogTWFpbEZvbGRlcltdKSA9PiB1bmtub3duLFxuXHQpIHtcblx0XHR0aGlzLnZpZXcgPSB0aGlzLnZpZXcuYmluZCh0aGlzKVxuXHRcdHRoaXMub25jcmVhdGUgPSB0aGlzLm9uY3JlYXRlLmJpbmQodGhpcylcblx0XHR0aGlzLmlzTWF4TGFiZWxzUmVhY2hlZCA9IHRoaXMuY2hlY2tJc01heExhYmVsc1JlYWNoZWQoKVxuXHR9XG5cblx0YXN5bmMgaGlkZUFuaW1hdGlvbigpOiBQcm9taXNlPHZvaWQ+IHt9XG5cblx0b25DbG9zZSgpOiB2b2lkIHtcblx0XHRtb2RhbC5yZW1vdmUodGhpcylcblx0fVxuXG5cdHNob3J0Y3V0cygpOiBTaG9ydGN1dFtdIHtcblx0XHRyZXR1cm4gdGhpcy5zaG9ydEN1dHNcblx0fVxuXG5cdGJhY2tncm91bmRDbGljayhlOiBNb3VzZUV2ZW50KTogdm9pZCB7XG5cdFx0bW9kYWwucmVtb3ZlKHRoaXMpXG5cdH1cblxuXHRwb3BTdGF0ZShlOiBFdmVudCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0cnVlXG5cdH1cblxuXHRjYWxsaW5nRWxlbWVudCgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLnNvdXJjZUVsZW1lbnRcblx0fVxuXG5cdHZpZXcoKTogdm9pZCB8IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4LmNvbC5lbGV2YXRlZC1iZy5hYnMuZHJvcGRvd24tc2hhZG93LnB0LXMuYm9yZGVyLXJhZGl1c1wiLCB7IHRhYmluZGV4OiBUYWJJbmRleC5Qcm9ncmFtbWF0aWMsIHJvbGU6IEFyaWFSb2xlLk1lbnUgfSwgW1xuXHRcdFx0bShcblx0XHRcdFx0XCIucGItcy5zY3JvbGxcIixcblx0XHRcdFx0dGhpcy5sYWJlbHMubWFwKChsYWJlbFN0YXRlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgeyBsYWJlbCwgc3RhdGUgfSA9IGxhYmVsU3RhdGVcblx0XHRcdFx0XHRjb25zdCBjb2xvciA9IHRoZW1lLmNvbnRlbnRfYnV0dG9uXG5cdFx0XHRcdFx0Y29uc3QgY2FuVG9nZ2xlTGFiZWwgPSBzdGF0ZSA9PT0gTGFiZWxTdGF0ZS5BcHBsaWVkIHx8IHN0YXRlID09PSBMYWJlbFN0YXRlLkFwcGxpZWRUb1NvbWUgfHwgIXRoaXMuaXNNYXhMYWJlbHNSZWFjaGVkXG5cdFx0XHRcdFx0Y29uc3Qgb3BhY2l0eSA9ICFjYW5Ub2dnbGVMYWJlbCA/IDAuNSA6IHVuZGVmaW5lZFxuXG5cdFx0XHRcdFx0cmV0dXJuIG0oXG5cdFx0XHRcdFx0XHRcImxhYmVsLWl0ZW0uZmxleC5pdGVtcy1jZW50ZXIucGxyLnN0YXRlLWJnLmN1cnNvci1wb2ludGVyXCIsXG5cblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XCJkYXRhLWxhYmVsaWRcIjogZ2V0RWxlbWVudElkKGxhYmVsKSxcblx0XHRcdFx0XHRcdFx0cm9sZTogQXJpYVJvbGUuTWVudUl0ZW1DaGVja2JveCxcblx0XHRcdFx0XHRcdFx0dGFiaW5kZXg6IFRhYkluZGV4LkRlZmF1bHQsXG5cdFx0XHRcdFx0XHRcdFwiYXJpYS1jaGVja2VkXCI6IGFyaWFDaGVja2VkRm9yU3RhdGUoc3RhdGUpLFxuXHRcdFx0XHRcdFx0XHRcImFyaWEtZGlzYWJsZWRcIjogIWNhblRvZ2dsZUxhYmVsLFxuXHRcdFx0XHRcdFx0XHRvbmNsaWNrOiBjYW5Ub2dnbGVMYWJlbCA/ICgpID0+IHRoaXMudG9nZ2xlTGFiZWwobGFiZWxTdGF0ZSkgOiBub09wLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFtcblx0XHRcdFx0XHRcdFx0bShJY29uLCB7XG5cdFx0XHRcdFx0XHRcdFx0aWNvbjogdGhpcy5pY29uRm9yU3RhdGUoc3RhdGUpLFxuXHRcdFx0XHRcdFx0XHRcdHNpemU6IEljb25TaXplLk1lZGl1bSxcblx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsbDogZ2V0TGFiZWxDb2xvcihsYWJlbC5jb2xvciksXG5cdFx0XHRcdFx0XHRcdFx0XHRvcGFjaXR5LFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRtKFwiLmJ1dHRvbi1oZWlnaHQuZmxleC5pdGVtcy1jZW50ZXIubWwub3ZlcmZsb3ctaGlkZGVuXCIsIHsgc3R5bGU6IHsgY29sb3IsIG9wYWNpdHkgfSB9LCBtKFwiLnRleHQtZWxsaXBzaXNcIiwgbGFiZWwubmFtZSkpLFxuXHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdH0pLFxuXHRcdFx0KSxcblx0XHRcdHRoaXMuaXNNYXhMYWJlbHNSZWFjaGVkICYmIG0oXCIuc21hbGwuY2VudGVyLnBiLXNcIiwgbGFuZy5nZXQoXCJtYXhpbXVtTGFiZWxzUGVyTWFpbFJlYWNoZWRfbXNnXCIpKSxcblx0XHRcdG0oQmFzZUJ1dHRvbiwge1xuXHRcdFx0XHRsYWJlbDogXCJhcHBseV9hY3Rpb25cIixcblx0XHRcdFx0dGV4dDogbGFuZy5nZXQoXCJhcHBseV9hY3Rpb25cIiksXG5cdFx0XHRcdGNsYXNzOiBcImxpbWl0LXdpZHRoIG5vc2VsZWN0IGJnLXRyYW5zcGFyZW50IGJ1dHRvbi1oZWlnaHQgdGV4dC1lbGxpcHNpcyBjb250ZW50LWFjY2VudC1mZyBmbGV4IGl0ZW1zLWNlbnRlciBwbHItYnV0dG9uIGJ1dHRvbi1jb250ZW50IGp1c3RpZnktY2VudGVyIGJvcmRlci10b3Agc3RhdGUtYmdcIixcblx0XHRcdFx0b25jbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuYXBwbHlMYWJlbHMoKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSBzYXRpc2ZpZXMgQmFzZUJ1dHRvbkF0dHJzKSxcblx0XHRcdG0oQmFzZUJ1dHRvbiwge1xuXHRcdFx0XHRsYWJlbDogXCJjbG9zZV9hbHRcIixcblx0XHRcdFx0dGV4dDogbGFuZy5nZXQoXCJjbG9zZV9hbHRcIiksXG5cdFx0XHRcdGNsYXNzOiBcImhpZGRlbi11bnRpbC1mb2N1cyBjb250ZW50LWFjY2VudC1mZyBidXR0b24tY29udGVudFwiLFxuXHRcdFx0XHRvbmNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0bW9kYWwucmVtb3ZlKHRoaXMpXG5cdFx0XHRcdH0sXG5cdFx0XHR9KSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSBpY29uRm9yU3RhdGUoc3RhdGU6IExhYmVsU3RhdGUpOiBBbGxJY29ucyB7XG5cdFx0c3dpdGNoIChzdGF0ZSkge1xuXHRcdFx0Y2FzZSBMYWJlbFN0YXRlLkFwcGxpZWRUb1NvbWU6XG5cdFx0XHRcdHJldHVybiBJY29ucy5MYWJlbFBhcnRpYWxcblx0XHRcdGNhc2UgTGFiZWxTdGF0ZS5BcHBsaWVkOlxuXHRcdFx0XHRyZXR1cm4gSWNvbnMuTGFiZWxcblx0XHRcdGNhc2UgTGFiZWxTdGF0ZS5Ob3RBcHBsaWVkOlxuXHRcdFx0XHRyZXR1cm4gSWNvbnMuTGFiZWxPdXRsaW5lXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBjaGVja0lzTWF4TGFiZWxzUmVhY2hlZCgpOiBib29sZWFuIHtcblx0XHRjb25zdCB7IGFkZGVkTGFiZWxzLCByZW1vdmVkTGFiZWxzIH0gPSB0aGlzLmdldFNvcnRlZExhYmVscygpXG5cdFx0aWYgKGFkZGVkTGFiZWxzLmxlbmd0aCA+PSBNQVhfTEFCRUxTX1BFUl9NQUlMKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgWywgbGFiZWxzXSBvZiB0aGlzLmxhYmVsc0Zvck1haWxzKSB7XG5cdFx0XHRjb25zdCBsYWJlbHNPbk1haWwgPSBuZXcgU2V0PElkPihsYWJlbHMubWFwKChsYWJlbCkgPT4gZ2V0RWxlbWVudElkKGxhYmVsKSkpXG5cblx0XHRcdGZvciAoY29uc3QgbGFiZWwgb2YgcmVtb3ZlZExhYmVscykge1xuXHRcdFx0XHRsYWJlbHNPbk1haWwuZGVsZXRlKGdldEVsZW1lbnRJZChsYWJlbCkpXG5cdFx0XHR9XG5cdFx0XHRpZiAobGFiZWxzT25NYWlsLnNpemUgPj0gTUFYX0xBQkVMU19QRVJfTUFJTCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKGNvbnN0IGxhYmVsIG9mIGFkZGVkTGFiZWxzKSB7XG5cdFx0XHRcdGxhYmVsc09uTWFpbC5hZGQoZ2V0RWxlbWVudElkKGxhYmVsKSlcblx0XHRcdFx0aWYgKGxhYmVsc09uTWFpbC5zaXplID49IE1BWF9MQUJFTFNfUEVSX01BSUwpIHtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHRwcml2YXRlIGdldFNvcnRlZExhYmVscygpOiBSZWNvcmQ8XCJhZGRlZExhYmVsc1wiIHwgXCJyZW1vdmVkTGFiZWxzXCIsIE1haWxGb2xkZXJbXT4ge1xuXHRcdGNvbnN0IHJlbW92ZWRMYWJlbHM6IE1haWxGb2xkZXJbXSA9IFtdXG5cdFx0Y29uc3QgYWRkZWRMYWJlbHM6IE1haWxGb2xkZXJbXSA9IFtdXG5cdFx0Zm9yIChjb25zdCB7IGxhYmVsLCBzdGF0ZSB9IG9mIHRoaXMubGFiZWxzKSB7XG5cdFx0XHRpZiAoc3RhdGUgPT09IExhYmVsU3RhdGUuQXBwbGllZCkge1xuXHRcdFx0XHRhZGRlZExhYmVscy5wdXNoKGxhYmVsKVxuXHRcdFx0fSBlbHNlIGlmIChzdGF0ZSA9PT0gTGFiZWxTdGF0ZS5Ob3RBcHBsaWVkKSB7XG5cdFx0XHRcdHJlbW92ZWRMYWJlbHMucHVzaChsYWJlbClcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHsgYWRkZWRMYWJlbHMsIHJlbW92ZWRMYWJlbHMgfVxuXHR9XG5cblx0cHJpdmF0ZSBhcHBseUxhYmVscygpIHtcblx0XHRjb25zdCB7IGFkZGVkTGFiZWxzLCByZW1vdmVkTGFiZWxzIH0gPSB0aGlzLmdldFNvcnRlZExhYmVscygpXG5cdFx0dGhpcy5vbkxhYmVsc0FwcGxpZWQoYWRkZWRMYWJlbHMsIHJlbW92ZWRMYWJlbHMpXG5cdFx0bW9kYWwucmVtb3ZlKHRoaXMpXG5cdH1cblxuXHRvbmNyZWF0ZSh2bm9kZTogVm5vZGVET00pIHtcblx0XHR0aGlzLmRvbSA9IHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudFxuXG5cdFx0Ly8gcmVzdHJpY3QgbGFiZWwgaGVpZ2h0IHRvIHNob3dpbmcgbWF4aW11bSA2IGxhYmVscyB0byBhdm9pZCBvdmVyZmxvd1xuXHRcdGNvbnN0IGRpc3BsYXllZExhYmVscyA9IE1hdGgubWluKHRoaXMubGFiZWxzLmxlbmd0aCwgNilcblx0XHRjb25zdCBoZWlnaHQgPSAoZGlzcGxheWVkTGFiZWxzICsgMSkgKiBzaXplLmJ1dHRvbl9oZWlnaHQgKyBzaXplLnZwYWRfc21hbGwgKiAyXG5cdFx0c2hvd0Ryb3Bkb3duKHRoaXMub3JpZ2luLCB0aGlzLmRvbSwgaGVpZ2h0LCB0aGlzLndpZHRoKS50aGVuKCgpID0+IHtcblx0XHRcdGNvbnN0IGZpcnN0TGFiZWwgPSB2bm9kZS5kb20uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJsYWJlbC1pdGVtXCIpLml0ZW0oMClcblx0XHRcdGlmIChmaXJzdExhYmVsICE9PSBudWxsKSB7XG5cdFx0XHRcdDsoZmlyc3RMYWJlbCBhcyBIVE1MRWxlbWVudCkuZm9jdXMoKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Oyh2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpLmZvY3VzKClcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSBzaG9ydEN1dHM6IEFycmF5PFNob3J0Y3V0PiA9IFtcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdFx0ZXhlYzogKCkgPT4gdGhpcy5vbkNsb3NlKCksXG5cdFx0XHRoZWxwOiBcImNsb3NlX2FsdFwiLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0a2V5OiBLZXlzLlRBQixcblx0XHRcdHNoaWZ0OiB0cnVlLFxuXHRcdFx0ZXhlYzogKCkgPT4gKHRoaXMuZG9tID8gZm9jdXNQcmV2aW91cyh0aGlzLmRvbSkgOiBmYWxzZSksXG5cdFx0XHRoZWxwOiBcInNlbGVjdFByZXZpb3VzX2FjdGlvblwiLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0a2V5OiBLZXlzLlRBQixcblx0XHRcdHNoaWZ0OiBmYWxzZSxcblx0XHRcdGV4ZWM6ICgpID0+ICh0aGlzLmRvbSA/IGZvY3VzTmV4dCh0aGlzLmRvbSkgOiBmYWxzZSksXG5cdFx0XHRoZWxwOiBcInNlbGVjdE5leHRfYWN0aW9uXCIsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuVVAsXG5cdFx0XHRleGVjOiAoKSA9PiAodGhpcy5kb20gPyBmb2N1c1ByZXZpb3VzKHRoaXMuZG9tKSA6IGZhbHNlKSxcblx0XHRcdGhlbHA6IFwic2VsZWN0UHJldmlvdXNfYWN0aW9uXCIsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuRE9XTixcblx0XHRcdGV4ZWM6ICgpID0+ICh0aGlzLmRvbSA/IGZvY3VzTmV4dCh0aGlzLmRvbSkgOiBmYWxzZSksXG5cdFx0XHRoZWxwOiBcInNlbGVjdE5leHRfYWN0aW9uXCIsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuUkVUVVJOLFxuXHRcdFx0ZXhlYzogKCkgPT4gdGhpcy5hcHBseUxhYmVscygpLFxuXHRcdFx0aGVscDogXCJva19hY3Rpb25cIixcblx0XHR9LFxuXHRcdHtcblx0XHRcdGtleTogS2V5cy5TUEFDRSxcblx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0Y29uc3QgbGFiZWxJZCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ/LmdldEF0dHJpYnV0ZShcImRhdGEtbGFiZWxpZFwiKVxuXHRcdFx0XHRpZiAobGFiZWxJZCkge1xuXHRcdFx0XHRcdGNvbnN0IGxhYmVsSXRlbSA9IHRoaXMubGFiZWxzLmZpbmQoKGl0ZW0pID0+IGdldEVsZW1lbnRJZChpdGVtLmxhYmVsKSA9PT0gbGFiZWxJZClcblx0XHRcdFx0XHRpZiAobGFiZWxJdGVtKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnRvZ2dsZUxhYmVsKGxhYmVsSXRlbSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGhlbHA6IFwib2tfYWN0aW9uXCIsXG5cdFx0fSxcblx0XVxuXG5cdHNob3coKSB7XG5cdFx0bW9kYWwuZGlzcGxheVVuaXF1ZSh0aGlzLCBmYWxzZSlcblx0fVxuXG5cdHByaXZhdGUgdG9nZ2xlTGFiZWwobGFiZWxTdGF0ZTogeyBsYWJlbDogTWFpbEZvbGRlcjsgc3RhdGU6IExhYmVsU3RhdGUgfSkge1xuXHRcdHN3aXRjaCAobGFiZWxTdGF0ZS5zdGF0ZSkge1xuXHRcdFx0Y2FzZSBMYWJlbFN0YXRlLkFwcGxpZWRUb1NvbWU6XG5cdFx0XHRcdGxhYmVsU3RhdGUuc3RhdGUgPSB0aGlzLmlzTWF4TGFiZWxzUmVhY2hlZCA/IExhYmVsU3RhdGUuTm90QXBwbGllZCA6IExhYmVsU3RhdGUuQXBwbGllZFxuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSBMYWJlbFN0YXRlLk5vdEFwcGxpZWQ6XG5cdFx0XHRcdGxhYmVsU3RhdGUuc3RhdGUgPSBMYWJlbFN0YXRlLkFwcGxpZWRcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgTGFiZWxTdGF0ZS5BcHBsaWVkOlxuXHRcdFx0XHRsYWJlbFN0YXRlLnN0YXRlID0gTGFiZWxTdGF0ZS5Ob3RBcHBsaWVkXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXG5cdFx0dGhpcy5pc01heExhYmVsc1JlYWNoZWQgPSB0aGlzLmNoZWNrSXNNYXhMYWJlbHNSZWFjaGVkKClcblx0fVxufVxuXG5mdW5jdGlvbiBhcmlhQ2hlY2tlZEZvclN0YXRlKHN0YXRlOiBMYWJlbFN0YXRlKTogc3RyaW5nIHtcblx0c3dpdGNoIChzdGF0ZSkge1xuXHRcdGNhc2UgTGFiZWxTdGF0ZS5BcHBsaWVkOlxuXHRcdFx0cmV0dXJuIFwidHJ1ZVwiXG5cdFx0Y2FzZSBMYWJlbFN0YXRlLkFwcGxpZWRUb1NvbWU6XG5cdFx0XHRyZXR1cm4gXCJtaXhlZFwiXG5cdFx0Y2FzZSBMYWJlbFN0YXRlLk5vdEFwcGxpZWQ6XG5cdFx0XHRyZXR1cm4gXCJmYWxzZVwiXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgTWFpbFZpZXdlclZpZXdNb2RlbCB9IGZyb20gXCIuL01haWxWaWV3ZXJWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBjcmVhdGVEcm9wZG93biwgRHJvcGRvd24sIERST1BET1dOX01BUkdJTiwgRHJvcGRvd25CdXR0b25BdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRHJvcGRvd24uanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zLmpzXCJcbmltcG9ydCB7IFVzZXJFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vVXNlckVycm9yLmpzXCJcbmltcG9ydCB7IHNob3dVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvRXJyb3JIYW5kbGVySW1wbC5qc1wiXG5pbXBvcnQgeyBwcm9tcHRBbmREZWxldGVNYWlscywgc2hvd01vdmVNYWlsc0Ryb3Bkb3duIH0gZnJvbSBcIi4vTWFpbEd1aVV0aWxzLmpzXCJcbmltcG9ydCB7IG5vT3AsIG9mQ2xhc3MgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IG1vZGFsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Nb2RhbC5qc1wiXG5pbXBvcnQgeyBlZGl0RHJhZnQsIG1haWxWaWV3ZXJNb3JlQWN0aW9ucyB9IGZyb20gXCIuL01haWxWaWV3ZXJVdGlscy5qc1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemUuanNcIlxuaW1wb3J0IHsgTGFiZWxzUG9wdXAgfSBmcm9tIFwiLi9MYWJlbHNQb3B1cC5qc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9iaWxlTWFpbEFjdGlvbkJhckF0dHJzIHtcblx0dmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsXG59XG5cbmV4cG9ydCBjbGFzcyBNb2JpbGVNYWlsQWN0aW9uQmFyIGltcGxlbWVudHMgQ29tcG9uZW50PE1vYmlsZU1haWxBY3Rpb25CYXJBdHRycz4ge1xuXHRwcml2YXRlIGRvbTogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXG5cdHZpZXcodm5vZGU6IFZub2RlPE1vYmlsZU1haWxBY3Rpb25CYXJBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgeyBhdHRycyB9ID0gdm5vZGVcblx0XHRjb25zdCB7IHZpZXdNb2RlbCB9ID0gYXR0cnNcblx0XHRsZXQgYWN0aW9uczogQ2hpbGRyZW5bXVxuXG5cdFx0aWYgKHZpZXdNb2RlbC5pc0Fubm91bmNlbWVudCgpKSB7XG5cdFx0XHRhY3Rpb25zID0gW3RoaXMucGxhY2Vob2xkZXIoKSwgdGhpcy5wbGFjZWhvbGRlcigpLCB0aGlzLmRlbGV0ZUJ1dHRvbihhdHRycyksIHRoaXMucGxhY2Vob2xkZXIoKSwgdGhpcy5tb3JlQnV0dG9uKGF0dHJzKV1cblx0XHR9IGVsc2UgaWYgKHZpZXdNb2RlbC5pc0RyYWZ0TWFpbCgpKSB7XG5cdFx0XHRhY3Rpb25zID0gW3RoaXMucGxhY2Vob2xkZXIoKSwgdGhpcy5wbGFjZWhvbGRlcigpLCB0aGlzLmRlbGV0ZUJ1dHRvbihhdHRycyksIHRoaXMubW92ZUJ1dHRvbihhdHRycyksIHRoaXMuZWRpdEJ1dHRvbihhdHRycyldXG5cdFx0fSBlbHNlIGlmICh2aWV3TW9kZWwuY2FuRm9yd2FyZE9yTW92ZSgpKSB7XG5cdFx0XHRhY3Rpb25zID0gW3RoaXMucmVwbHlCdXR0b24oYXR0cnMpLCB0aGlzLmZvcndhcmRCdXR0b24oYXR0cnMpLCB0aGlzLmRlbGV0ZUJ1dHRvbihhdHRycyksIHRoaXMubW92ZUJ1dHRvbihhdHRycyksIHRoaXMubW9yZUJ1dHRvbihhdHRycyldXG5cdFx0fSBlbHNlIHtcblx0XHRcdGFjdGlvbnMgPSBbdGhpcy5yZXBseUJ1dHRvbihhdHRycyksIHRoaXMucGxhY2Vob2xkZXIoKSwgdGhpcy5kZWxldGVCdXR0b24oYXR0cnMpLCB0aGlzLnBsYWNlaG9sZGVyKCksIHRoaXMubW9yZUJ1dHRvbihhdHRycyldXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5ib3R0b20tbmF2LmJvdHRvbS1hY3Rpb24tYmFyLmZsZXguaXRlbXMtY2VudGVyLnBsci1sLmp1c3RpZnktYmV0d2VlblwiLFxuXHRcdFx0e1xuXHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5kb20gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRbYWN0aW9uc10sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBwbGFjZWhvbGRlcigpIHtcblx0XHRyZXR1cm4gbShcIlwiLCB7XG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHR3aWR0aDogcHgoc2l6ZS5idXR0b25faGVpZ2h0KSxcblx0XHRcdH0sXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgbW92ZUJ1dHRvbih7IHZpZXdNb2RlbCB9OiBNb2JpbGVNYWlsQWN0aW9uQmFyQXR0cnMpIHtcblx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJtb3ZlX2FjdGlvblwiLFxuXHRcdFx0Y2xpY2s6IChlLCBkb20pID0+XG5cdFx0XHRcdHNob3dNb3ZlTWFpbHNEcm9wZG93bih2aWV3TW9kZWwubWFpbGJveE1vZGVsLCB2aWV3TW9kZWwubWFpbE1vZGVsLCBkb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIFt2aWV3TW9kZWwubWFpbF0sIHtcblx0XHRcdFx0XHR3aWR0aDogdGhpcy5kcm9wZG93bldpZHRoKCksXG5cdFx0XHRcdFx0d2l0aEJhY2tncm91bmQ6IHRydWUsXG5cdFx0XHRcdH0pLFxuXHRcdFx0aWNvbjogSWNvbnMuRm9sZGVyLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGRyb3Bkb3duV2lkdGgoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZG9tPy5vZmZzZXRXaWR0aCA/IHRoaXMuZG9tLm9mZnNldFdpZHRoIC0gRFJPUERPV05fTUFSR0lOICogMiA6IHVuZGVmaW5lZFxuXHR9XG5cblx0cHJpdmF0ZSBtb3JlQnV0dG9uKHsgdmlld01vZGVsIH06IE1vYmlsZU1haWxBY3Rpb25CYXJBdHRycykge1xuXHRcdHJldHVybiBtKEljb25CdXR0b24sIHtcblx0XHRcdHRpdGxlOiBcIm1vcmVfbGFiZWxcIixcblx0XHRcdGNsaWNrOiBjcmVhdGVEcm9wZG93bih7XG5cdFx0XHRcdGxhenlCdXR0b25zOiAoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgbW9yZUJ1dHRvbnM6IERyb3Bkb3duQnV0dG9uQXR0cnNbXSA9IFtdXG5cdFx0XHRcdFx0aWYgKHZpZXdNb2RlbC5tYWlsTW9kZWwuY2FuQXNzaWduTGFiZWxzKCkpIHtcblx0XHRcdFx0XHRcdG1vcmVCdXR0b25zLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogXCJhc3NpZ25MYWJlbF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0Y2xpY2s6IChldmVudCwgZG9tKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgcmVmZXJlbmNlRG9tID0gdGhpcy5kb20gPz8gZG9tXG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgcG9wdXAgPSBuZXcgTGFiZWxzUG9wdXAoXG5cdFx0XHRcdFx0XHRcdFx0XHRyZWZlcmVuY2VEb20sXG5cdFx0XHRcdFx0XHRcdFx0XHRyZWZlcmVuY2VEb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmRyb3Bkb3duV2lkdGgoKSA/PyAyMDAsXG5cdFx0XHRcdFx0XHRcdFx0XHR2aWV3TW9kZWwubWFpbE1vZGVsLmdldExhYmVsc0Zvck1haWxzKFt2aWV3TW9kZWwubWFpbF0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0dmlld01vZGVsLm1haWxNb2RlbC5nZXRMYWJlbFN0YXRlc0Zvck1haWxzKFt2aWV3TW9kZWwubWFpbF0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0KGFkZGVkTGFiZWxzLCByZW1vdmVkTGFiZWxzKSA9PiB2aWV3TW9kZWwubWFpbE1vZGVsLmFwcGx5TGFiZWxzKFt2aWV3TW9kZWwubWFpbF0sIGFkZGVkTGFiZWxzLCByZW1vdmVkTGFiZWxzKSxcblx0XHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRwb3B1cC5zaG93KClcblx0XHRcdFx0XHRcdFx0XHR9LCAxNilcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuTGFiZWwsXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gWy4uLm1vcmVCdXR0b25zLCAuLi5tYWlsVmlld2VyTW9yZUFjdGlvbnModmlld01vZGVsKV1cblx0XHRcdFx0fSxcblx0XHRcdFx0d2lkdGg6IHRoaXMuZHJvcGRvd25XaWR0aCgpLFxuXHRcdFx0XHR3aXRoQmFja2dyb3VuZDogdHJ1ZSxcblx0XHRcdH0pLFxuXHRcdFx0aWNvbjogSWNvbnMuTW9yZSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBkZWxldGVCdXR0b24oeyB2aWV3TW9kZWwgfTogTW9iaWxlTWFpbEFjdGlvbkJhckF0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKEljb25CdXR0b24sIHtcblx0XHRcdHRpdGxlOiBcImRlbGV0ZV9hY3Rpb25cIixcblx0XHRcdGNsaWNrOiAoKSA9PiBwcm9tcHRBbmREZWxldGVNYWlscyh2aWV3TW9kZWwubWFpbE1vZGVsLCBbdmlld01vZGVsLm1haWxdLCBub09wKSxcblx0XHRcdGljb246IEljb25zLlRyYXNoLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGZvcndhcmRCdXR0b24oeyB2aWV3TW9kZWwgfTogTW9iaWxlTWFpbEFjdGlvbkJhckF0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKEljb25CdXR0b24sIHtcblx0XHRcdHRpdGxlOiBcImZvcndhcmRfYWN0aW9uXCIsXG5cdFx0XHRjbGljazogKCkgPT4gdmlld01vZGVsLmZvcndhcmQoKS5jYXRjaChvZkNsYXNzKFVzZXJFcnJvciwgc2hvd1VzZXJFcnJvcikpLFxuXHRcdFx0aWNvbjogSWNvbnMuRm9yd2FyZCxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZXBseUJ1dHRvbih7IHZpZXdNb2RlbCB9OiBNb2JpbGVNYWlsQWN0aW9uQmFyQXR0cnMpIHtcblx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJyZXBseV9hY3Rpb25cIixcblx0XHRcdGNsaWNrOiB2aWV3TW9kZWwuY2FuUmVwbHlBbGwoKVxuXHRcdFx0XHQ/IChlLCBkb20pID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IGRyb3Bkb3duID0gbmV3IERyb3Bkb3duKCgpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgYnV0dG9uczogRHJvcGRvd25CdXR0b25BdHRyc1tdID0gW11cblx0XHRcdFx0XHRcdFx0YnV0dG9ucy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJyZXBseUFsbF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5SZXBseUFsbCxcblx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4gdmlld01vZGVsLnJlcGx5KHRydWUpLFxuXHRcdFx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdFx0XHRcdGJ1dHRvbnMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwicmVwbHlfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuUmVwbHksXG5cdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHZpZXdNb2RlbC5yZXBseShmYWxzZSksXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdHJldHVybiBidXR0b25zXG5cdFx0XHRcdFx0XHR9LCB0aGlzLmRyb3Bkb3duV2lkdGgoKSA/PyAzMDApXG5cblx0XHRcdFx0XHRcdGNvbnN0IGRvbVJlY3QgPSB0aGlzLmRvbT8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgPz8gZG9tLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cdFx0XHRcdFx0XHRkcm9wZG93bi5zZXRPcmlnaW4oZG9tUmVjdClcblx0XHRcdFx0XHRcdG1vZGFsLmRpc3BsYXlVbmlxdWUoZHJvcGRvd24sIHRydWUpXG5cdFx0XHRcdCAgfVxuXHRcdFx0XHQ6ICgpID0+IHZpZXdNb2RlbC5yZXBseShmYWxzZSksXG5cdFx0XHRpY29uOiB2aWV3TW9kZWwuY2FuUmVwbHlBbGwoKSA/IEljb25zLlJlcGx5QWxsIDogSWNvbnMuUmVwbHksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgZWRpdEJ1dHRvbihhdHRyczogTW9iaWxlTWFpbEFjdGlvbkJhckF0dHJzKSB7XG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwiZWRpdF9hY3Rpb25cIixcblx0XHRcdGljb246IEljb25zLkVkaXQsXG5cdFx0XHRjbGljazogKCkgPT4gZWRpdERyYWZ0KGF0dHJzLnZpZXdNb2RlbCksXG5cdFx0fSlcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBDYWxlbmRhckF0dGVuZGVlU3RhdHVzLCBDYWxlbmRhck1ldGhvZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB0eXBlIHsgQ2FsZW5kYXJFdmVudCwgTWFpbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IHNob3dQcm9ncmVzc0RpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2dcIlxuaW1wb3J0IHsgZmluZEF0dGVuZGVlSW5BZGRyZXNzZXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvQ29tbW9uQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBCYW5uZXJUeXBlLCBJbmZvQmFubmVyLCBJbmZvQmFubmVyQXR0cnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0luZm9CYW5uZXIuanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zLmpzXCJcbmltcG9ydCB7IGlzTm90TnVsbCwgTGF6eUxvYWRlZCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgUGFyc2VkSWNhbEZpbGVDb250ZW50LCBSZXBseVJlc3VsdCB9IGZyb20gXCIuLi8uLi8uLi9jYWxlbmRhci1hcHAvY2FsZW5kYXIvdmlldy9DYWxlbmRhckludml0ZXMuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBtYWlsTG9jYXRvciB9IGZyb20gXCIuLi8uLi9tYWlsTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBpc1JlcGxpZWRUbyB9IGZyb20gXCIuL01haWxWaWV3ZXJVdGlscy5qc1wiXG5cbmV4cG9ydCB0eXBlIEV2ZW50QmFubmVyQXR0cnMgPSB7XG5cdGNvbnRlbnRzOiBQYXJzZWRJY2FsRmlsZUNvbnRlbnRcblx0bWFpbDogTWFpbFxuXHRyZWNpcGllbnQ6IHN0cmluZ1xufVxuXG4vKipcbiAqIGRpc3BsYXllZCBhYm92ZSBhIG1haWwgdGhhdCBjb250YWlucyBhIGNhbGVuZGFyIGludml0ZS5cbiAqIEl0cyBtYWluIGZ1bmN0aW9uIGlzIHRvIG1ha2UgaXQgcG9zc2libGUgdG8gaW5zcGVjdCB0aGUgZXZlbnQgd2l0aCB0aGUgQ2FsZW5kYXJFdmVudFBvcHVwLCB0byBxdWljayByZXNwb25kXG4gKiB5b3VyIGF0dGVuZGFuY2Ugd2l0aCBBY2NlcHQvRGVjbGluZS9UZW50YXRpdmUgd2hpbGUgYWRkaW5nIHRoZSBldmVudCB0byB5b3VyIHBlcnNvbmFsIGNhbGVuZGFyXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudEJhbm5lciBpbXBsZW1lbnRzIENvbXBvbmVudDxFdmVudEJhbm5lckF0dHJzPiB7XG5cdC8qKiBSZXBseUJ1dHRvbnMgYXJlIHVzZWQgZnJvbSBtYWlsLXZpZXcgYW5kIGNhbGVuZGFyLXZpZXcuXG5cdCAqIHRoZXkgY2FuJ3QgaW1wb3J0IGVhY2ggb3RoZXIgYW5kIG9ubHkgaGF2ZSBndWktYmFzZSBhcyBhXG5cdCAqIGNvbW1vbiBhbmNlc3Rvciwgd2hlcmUgdGhlc2UgZG9uJ3QgYmVsb25nLiAqL1xuXHRwcml2YXRlIHJlYWRvbmx5IFJlcGx5QnV0dG9ucyA9IG5ldyBMYXp5TG9hZGVkKGFzeW5jICgpID0+IChhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jYWxlbmRhci1hcHAvY2FsZW5kYXIvZ3VpL2V2ZW50cG9wdXAvRXZlbnRQcmV2aWV3Vmlldy5qc1wiKSkuUmVwbHlCdXR0b25zKVxuXG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxFdmVudEJhbm5lckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IGNvbnRlbnRzLCBtYWlsIH0gPSBhdHRyc1xuXHRcdGlmIChjb250ZW50cyA9PSBudWxsIHx8IGNvbnRlbnRzLmV2ZW50cy5sZW5ndGggPT09IDApIHJldHVybiBudWxsXG5cblx0XHRjb25zdCBtZXNzYWdlcyA9IGNvbnRlbnRzLmV2ZW50c1xuXHRcdFx0Lm1hcCgoZXZlbnQ6IENhbGVuZGFyRXZlbnQpOiB7IGV2ZW50OiBDYWxlbmRhckV2ZW50OyBtZXNzYWdlOiBDaGlsZHJlbiB9IHwgTm9uZSA9PiB7XG5cdFx0XHRcdGNvbnN0IG1lc3NhZ2UgPSB0aGlzLmdldE1lc3NhZ2UoZXZlbnQsIGF0dHJzLm1haWwsIGF0dHJzLnJlY2lwaWVudCwgY29udGVudHMubWV0aG9kKVxuXHRcdFx0XHRyZXR1cm4gbWVzc2FnZSA9PSBudWxsID8gbnVsbCA6IHsgZXZlbnQsIG1lc3NhZ2UgfVxuXHRcdFx0fSlcblx0XHRcdC8vIHRodW5kZXJiaXJkIGRvZXMgbm90IGFkZCBhdHRlbmRlZXMgdG8gcmVzY2hlZHVsZWQgaW5zdGFuY2VzIHdoZW4gdGhleSB3ZXJlIGFkZGVkIGR1cmluZyBhbiBcImFsbCBldmVudFwiXG5cdFx0XHQvLyBlZGl0IG9wZXJhdGlvbiwgYnV0IF93aWxsXyBzZW5kIGFsbCB0aGUgZXZlbnRzIHRvIHRoZSBwYXJ0aWNpcGFudHMgaW4gYSBzaW5nbGUgZmlsZS4gd2UgZG8gbm90IHNob3cgdGhlXG5cdFx0XHQvLyBiYW5uZXIgZm9yIGV2ZW50cyB0aGF0IGRvIG5vdCBtZW50aW9uIHVzLlxuXHRcdFx0LmZpbHRlcihpc05vdE51bGwpXG5cblx0XHRyZXR1cm4gbWVzc2FnZXMubWFwKCh7IGV2ZW50LCBtZXNzYWdlIH0pID0+XG5cdFx0XHRtKEluZm9CYW5uZXIsIHtcblx0XHRcdFx0bWVzc2FnZTogKCkgPT4gbWVzc2FnZSxcblx0XHRcdFx0dHlwZTogQmFubmVyVHlwZS5JbmZvLFxuXHRcdFx0XHRpY29uOiBJY29ucy5QZW9wbGUsXG5cdFx0XHRcdGJ1dHRvbnM6IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJ2aWV3RXZlbnRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRjbGljazogKGUsIGRvbSkgPT5cblx0XHRcdFx0XHRcdFx0aW1wb3J0KFwiLi4vLi4vLi4vY2FsZW5kYXItYXBwL2NhbGVuZGFyL3ZpZXcvQ2FsZW5kYXJJbnZpdGVzLmpzXCIpLnRoZW4oKHsgc2hvd0V2ZW50RGV0YWlscyB9KSA9PlxuXHRcdFx0XHRcdFx0XHRcdHNob3dFdmVudERldGFpbHMoZXZlbnQsIGRvbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSwgbWFpbCksXG5cdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdH0gc2F0aXNmaWVzIEluZm9CYW5uZXJBdHRycyksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRNZXNzYWdlKGV2ZW50OiBDYWxlbmRhckV2ZW50LCBtYWlsOiBNYWlsLCByZWNpcGllbnQ6IHN0cmluZywgbWV0aG9kOiBDYWxlbmRhck1ldGhvZCk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBvd25BdHRlbmRlZSA9IGZpbmRBdHRlbmRlZUluQWRkcmVzc2VzKGV2ZW50LmF0dGVuZGVlcywgW3JlY2lwaWVudF0pXG5cdFx0aWYgKG1ldGhvZCA9PT0gQ2FsZW5kYXJNZXRob2QuUkVRVUVTVCAmJiBvd25BdHRlbmRlZSAhPSBudWxsKSB7XG5cdFx0XHQvLyBzb21lIG1haWxzIGNvbnRhaW4gbW9yZSB0aGFuIG9uZSBldmVudCB0aGF0IHdlIHdhbnQgdG8gYmUgYWJsZSB0byByZXNwb25kIHRvXG5cdFx0XHQvLyBzZXBhcmF0ZWx5LlxuXHRcdFx0aWYgKGlzUmVwbGllZFRvKG1haWwpICYmIG93bkF0dGVuZGVlLnN0YXR1cyAhPT0gQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cy5ORUVEU19BQ1RJT04pIHtcblx0XHRcdFx0cmV0dXJuIG0oXCIuYWxpZ24tc2VsZi1zdGFydC5zdGFydC5zbWFsbFwiLCBsYW5nLmdldChcImFscmVhZHlSZXBsaWVkX21zZ1wiKSlcblx0XHRcdH0gZWxzZSBpZiAodGhpcy5SZXBseUJ1dHRvbnMuaXNMb2FkZWQoKSkge1xuXHRcdFx0XHRyZXR1cm4gbSh0aGlzLlJlcGx5QnV0dG9ucy5nZXRMb2FkZWQoKSwge1xuXHRcdFx0XHRcdG93bkF0dGVuZGVlLFxuXHRcdFx0XHRcdHNldFBhcnRpY2lwYXRpb246IGFzeW5jIChzdGF0dXM6IENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMpID0+IHNlbmRSZXNwb25zZShldmVudCwgcmVjaXBpZW50LCBzdGF0dXMsIG1haWwpLFxuXHRcdFx0XHR9KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5SZXBseUJ1dHRvbnMucmVsb2FkKCkudGhlbihtLnJlZHJhdylcblx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKG1ldGhvZCA9PT0gQ2FsZW5kYXJNZXRob2QuUkVQTFkpIHtcblx0XHRcdHJldHVybiBtKFwiLnB0LmFsaWduLXNlbGYtc3RhcnQuc3RhcnQuc21hbGxcIiwgbGFuZy5nZXQoXCJldmVudE5vdGlmaWNhdGlvblVwZGF0ZWRfbXNnXCIpKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblx0fVxufVxuXG4vKiogc2hvdyBhIHByb2dyZXNzIGRpYWxvZyB3aGlsZSBzZW5kaW5nIGEgcmVzcG9uc2UgdG8gdGhlIGV2ZW50J3Mgb3JnYW5pemVyIGFuZCB1cGRhdGUgdGhlIHVpLiB3aWxsIGFsd2F5cyBzZW5kIGEgcmVwbHksIGV2ZW4gaWYgdGhlIHN0YXR1cyBkaWQgbm90IGNoYW5nZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZW5kUmVzcG9uc2UoZXZlbnQ6IENhbGVuZGFyRXZlbnQsIHJlY2lwaWVudDogc3RyaW5nLCBzdGF0dXM6IENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMsIHByZXZpb3VzTWFpbDogTWFpbCkge1xuXHRzaG93UHJvZ3Jlc3NEaWFsb2coXG5cdFx0XCJwbGVhc2VXYWl0X21zZ1wiLFxuXHRcdGltcG9ydChcIi4uLy4uLy4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci92aWV3L0NhbGVuZGFySW52aXRlcy5qc1wiKS50aGVuKGFzeW5jICh7IGdldExhdGVzdEV2ZW50IH0pID0+IHtcblx0XHRcdGNvbnN0IGxhdGVzdEV2ZW50ID0gYXdhaXQgZ2V0TGF0ZXN0RXZlbnQoZXZlbnQpXG5cdFx0XHRjb25zdCBvd25BdHRlbmRlZSA9IGZpbmRBdHRlbmRlZUluQWRkcmVzc2VzKGxhdGVzdEV2ZW50LmF0dGVuZGVlcywgW3JlY2lwaWVudF0pXG5cdFx0XHRjb25zdCBjYWxlbmRhckludml0ZUhhbmRsZXIgPSBhd2FpdCBtYWlsTG9jYXRvci5jYWxlbmRhckludml0ZUhhbmRsZXIoKVxuXG5cdFx0XHRpZiAob3duQXR0ZW5kZWUgPT0gbnVsbCkge1xuXHRcdFx0XHREaWFsb2cubWVzc2FnZShcImF0dGVuZGVlTm90Rm91bmRfbXNnXCIpXG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBtYWlsYm94RGV0YWlscyA9IGF3YWl0IG1haWxMb2NhdG9yLm1haWxNb2RlbC5nZXRNYWlsYm94RGV0YWlsc0Zvck1haWwocHJldmlvdXNNYWlsKVxuXHRcdFx0aWYgKG1haWxib3hEZXRhaWxzID09IG51bGwpIHJldHVyblxuXG5cdFx0XHRjb25zdCByZXBseVJlc3VsdCA9IGF3YWl0IGNhbGVuZGFySW52aXRlSGFuZGxlci5yZXBseVRvRXZlbnRJbnZpdGF0aW9uKGxhdGVzdEV2ZW50LCBvd25BdHRlbmRlZSwgc3RhdHVzLCBwcmV2aW91c01haWwsIG1haWxib3hEZXRhaWxzKVxuXHRcdFx0aWYgKHJlcGx5UmVzdWx0ID09PSBSZXBseVJlc3VsdC5SZXBseVNlbnQpIHtcblx0XHRcdFx0b3duQXR0ZW5kZWUuc3RhdHVzID0gc3RhdHVzXG5cdFx0XHR9XG5cdFx0XHRtLnJlZHJhdygpXG5cdFx0fSksXG5cdClcbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHR5cGUgeyBDbGlja0hhbmRsZXIgfSBmcm9tIFwiLi9HdWlVdGlsc1wiXG5cbmV4cG9ydCB0eXBlIEF0dHJzID0ge1xuXHRsYWJlbDogc3RyaW5nXG5cdGNsaWNrOiBDbGlja0hhbmRsZXJcblx0c3R5bGU/OiBvYmplY3Rcbn1cblxuZXhwb3J0IGNsYXNzIFJlY2lwaWVudEJ1dHRvbiBpbXBsZW1lbnRzIENvbXBvbmVudDxBdHRycz4ge1xuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0XCJidXR0b24ubXItYnV0dG9uLmNvbnRlbnQtYWNjZW50LWZnLnByaW50LnNtYWxsXCIsXG5cdFx0XHR7XG5cdFx0XHRcdHN0eWxlOiBPYmplY3QuYXNzaWduKFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFwid2hpdGUtc3BhY2VcIjogXCJub3JtYWxcIixcblx0XHRcdFx0XHRcdFwid29yZC1icmVha1wiOiBcImJyZWFrLWFsbFwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0YXR0cnMuc3R5bGUsXG5cdFx0XHRcdCksXG5cdFx0XHRcdG9uY2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiBhdHRycy5jbGljayhlLCBlLnRhcmdldCBhcyBIVE1MRWxlbWVudCksXG5cdFx0XHR9LFxuXHRcdFx0W2F0dHJzLmxhYmVsXSxcblx0XHQpXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgSW5mb0xpbmssIGxhbmcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS90aGVtZS5qc1wiXG5pbXBvcnQgeyBzdHlsZXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zdHlsZXMuanNcIlxuaW1wb3J0IHsgRXhwYW5kZXJCdXR0b24sIEV4cGFuZGVyUGFuZWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0V4cGFuZGVyLmpzXCJcbmltcG9ydCB7IEZpbGUgYXMgVHV0YW5vdGFGaWxlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgQmFubmVyQnV0dG9uQXR0cnMsIEJhbm5lclR5cGUsIEluZm9CYW5uZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0luZm9CYW5uZXIuanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zLmpzXCJcbmltcG9ydCB7IEV2ZW50QmFubmVyLCBFdmVudEJhbm5lckF0dHJzIH0gZnJvbSBcIi4vRXZlbnRCYW5uZXIuanNcIlxuaW1wb3J0IHsgUmVjaXBpZW50QnV0dG9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9SZWNpcGllbnRCdXR0b24uanNcIlxuaW1wb3J0IHsgY3JlYXRlQXN5bmNEcm9wZG93biwgY3JlYXRlRHJvcGRvd24sIERyb3Bkb3duQnV0dG9uQXR0cnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0Ryb3Bkb3duLmpzXCJcbmltcG9ydCB7IEVuY3J5cHRpb25BdXRoU3RhdHVzLCBJbmJveFJ1bGVUeXBlLCBLZXlzLCBNYWlsQXV0aGVudGljYXRpb25TdGF0dXMsIFRhYkluZGV4IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IEljb24sIHByb2dyZXNzSWNvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbi5qc1wiXG5pbXBvcnQgeyBmb3JtYXREYXRlV2l0aFdlZWtkYXksIGZvcm1hdERhdGVXaXRoV2Vla2RheUFuZFllYXIsIGZvcm1hdFN0b3JhZ2VTaXplLCBmb3JtYXRUaW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0Zvcm1hdHRlci5qc1wiXG5pbXBvcnQgeyBpc0FuZHJvaWRBcHAsIGlzRGVza3RvcCwgaXNJT1NBcHAgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IEJ1dHRvbiwgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCBCYWRnZSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0JhZGdlLmpzXCJcbmltcG9ydCB7IENvbnRlbnRCbG9ja2luZ1N0YXR1cywgTWFpbFZpZXdlclZpZXdNb2RlbCB9IGZyb20gXCIuL01haWxWaWV3ZXJWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgY2FuU2VlVHV0YUxpbmtzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9HdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBpc05vdE51bGwsIG5vT3AsIHJlc29sdmVNYXliZUxhenkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEljb25CdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgZ2V0Q29uZmlkZW50aWFsSWNvbiwgZ2V0Rm9sZGVySWNvbkJ5VHlwZSwgaXNUdXRhbm90YVRlYW1NYWlsLCBwcm9tcHRBbmREZWxldGVNYWlscywgc2hvd01vdmVNYWlsc0Ryb3Bkb3duIH0gZnJvbSBcIi4vTWFpbEd1aVV0aWxzLmpzXCJcbmltcG9ydCB7IEJvb3RJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvQm9vdEljb25zLmpzXCJcbmltcG9ydCB7IGVkaXREcmFmdCwgbWFpbFZpZXdlck1vcmVBY3Rpb25zIH0gZnJvbSBcIi4vTWFpbFZpZXdlclV0aWxzLmpzXCJcbmltcG9ydCB7IGxpdmVEYXRhQXR0cnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9BcmlhVXRpbHMuanNcIlxuaW1wb3J0IHsgaXNLZXlQcmVzc2VkIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0tleU1hbmFnZXIuanNcIlxuaW1wb3J0IHsgQXR0YWNobWVudEJ1YmJsZSwgZ2V0QXR0YWNobWVudFR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9BdHRhY2htZW50QnViYmxlLmpzXCJcbmltcG9ydCB7IHJlc3BvbnNpdmVDYXJkSE1hcmdpbiwgcmVzcG9uc2l2ZUNhcmRIUGFkZGluZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2NhcmRzLmpzXCJcbmltcG9ydCB7IGNvbXBhbnlUZWFtTGFiZWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50Q29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IGdldE1haWxBZGRyZXNzRGlzcGxheVRleHQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L1NoYXJlZE1haWxVdGlscy5qc1wiXG5pbXBvcnQgeyBNYWlsQWRkcmVzc0FuZE5hbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vQ29tbW9uTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IExhYmVsc1BvcHVwIH0gZnJvbSBcIi4vTGFiZWxzUG9wdXAuanNcIlxuaW1wb3J0IHsgTGFiZWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0xhYmVsLmpzXCJcbmltcG9ydCB7IHB4LCBzaXplIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc2l6ZS5qc1wiXG5cbmV4cG9ydCB0eXBlIE1haWxBZGRyZXNzRHJvcGRvd25DcmVhdG9yID0gKGFyZ3M6IHtcblx0bWFpbEFkZHJlc3M6IE1haWxBZGRyZXNzQW5kTmFtZVxuXHRkZWZhdWx0SW5ib3hSdWxlRmllbGQ6IEluYm94UnVsZVR5cGUgfCBudWxsXG5cdGNyZWF0ZUNvbnRhY3Q/OiBib29sZWFuXG59KSA9PiBQcm9taXNlPEFycmF5PERyb3Bkb3duQnV0dG9uQXR0cnM+PlxuXG5leHBvcnQgaW50ZXJmYWNlIE1haWxWaWV3ZXJIZWFkZXJBdHRycyB7XG5cdC8vIFBhc3NpbmcgdGhlIHdob2xlIHZpZXdNb2RlbCBiZWNhdXNlIHRoZXJlIGFyZSBhIGxvdCBvZiBzZXBhcmF0ZSBiaXRzIHdlIG1pZ2h0IG5lZWQuXG5cdC8vIElmIHdlIHdhbnQgdG8gcmV1c2UgdGhpcyB2aWV3IHdlIHNob3VsZCBwcm9iYWJseSBwYXNzIGV2ZXJ5dGhpbmcgb24gaXRzIG93bi5cblx0dmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsXG5cdGNyZWF0ZU1haWxBZGRyZXNzQ29udGV4dEJ1dHRvbnM6IE1haWxBZGRyZXNzRHJvcGRvd25DcmVhdG9yXG5cdGlzUHJpbWFyeTogYm9vbGVhblxuXHRpbXBvcnRGaWxlOiAoZmlsZTogVHV0YW5vdGFGaWxlKSA9PiB2b2lkXG59XG5cbi8qKiBUaGUgdXBwZXIgcGFydCBvZiB0aGUgbWFpbCB2aWV3ZXIsIGV2ZXJ5dGhpbmcgYnV0IHRoZSBtYWlsIGJvZHkgaXRzZWxmLiAqL1xuZXhwb3J0IGNsYXNzIE1haWxWaWV3ZXJIZWFkZXIgaW1wbGVtZW50cyBDb21wb25lbnQ8TWFpbFZpZXdlckhlYWRlckF0dHJzPiB7XG5cdHByaXZhdGUgZGV0YWlsc0V4cGFuZGVkID0gZmFsc2Vcblx0cHJpdmF0ZSBmaWxlc0V4cGFuZGVkID0gZmFsc2VcblxuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8TWFpbFZpZXdlckhlYWRlckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IHZpZXdNb2RlbCB9ID0gYXR0cnNcblx0XHRjb25zdCBkYXRlVGltZSA9IGZvcm1hdERhdGVXaXRoV2Vla2RheSh2aWV3TW9kZWwubWFpbC5yZWNlaXZlZERhdGUpICsgXCIg4oCiIFwiICsgZm9ybWF0VGltZSh2aWV3TW9kZWwubWFpbC5yZWNlaXZlZERhdGUpXG5cdFx0Y29uc3QgZGF0ZVRpbWVGdWxsID0gZm9ybWF0RGF0ZVdpdGhXZWVrZGF5QW5kWWVhcih2aWV3TW9kZWwubWFpbC5yZWNlaXZlZERhdGUpICsgXCIg4oCiIFwiICsgZm9ybWF0VGltZSh2aWV3TW9kZWwubWFpbC5yZWNlaXZlZERhdGUpXG5cblx0XHRyZXR1cm4gbShcIi5oZWFkZXIuc2VsZWN0YWJsZVwiLCBbXG5cdFx0XHR0aGlzLnJlbmRlclN1YmplY3RBY3Rpb25zTGluZShhdHRycyksXG5cdFx0XHR0aGlzLnJlbmRlckZvbGRlckFuZExhYmVscyh2aWV3TW9kZWwpLFxuXHRcdFx0dGhpcy5yZW5kZXJBZGRyZXNzZXNBbmREYXRlKHZpZXdNb2RlbCwgYXR0cnMsIGRhdGVUaW1lLCBkYXRlVGltZUZ1bGwpLFxuXHRcdFx0bShcblx0XHRcdFx0RXhwYW5kZXJQYW5lbCxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGV4cGFuZGVkOiB0aGlzLmRldGFpbHNFeHBhbmRlZCxcblx0XHRcdFx0fSxcblx0XHRcdFx0dGhpcy5yZW5kZXJEZXRhaWxzKGF0dHJzLCB7IGJ1YmJsZU1lbnVXaWR0aDogMzAwIH0pLFxuXHRcdFx0KSxcblx0XHRcdHRoaXMucmVuZGVyQXR0YWNobWVudHModmlld01vZGVsLCBhdHRycy5pbXBvcnRGaWxlKSxcblx0XHRcdHRoaXMucmVuZGVyQ29ubmVjdGlvbkxvc3RCYW5uZXIodmlld01vZGVsKSxcblx0XHRcdHRoaXMucmVuZGVyRXZlbnRCYW5uZXIodmlld01vZGVsKSxcblx0XHRcdHRoaXMucmVuZGVyQmFubmVycyhhdHRycyksXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRm9sZGVyQW5kTGFiZWxzKHZpZXdNb2RlbDogTWFpbFZpZXdlclZpZXdNb2RlbCkge1xuXHRcdGNvbnN0IGZvbGRlckluZm8gPSB2aWV3TW9kZWwuZ2V0Rm9sZGVySW5mbygpXG5cdFx0aWYgKCFmb2xkZXJJbmZvKSByZXR1cm4gbnVsbFxuXHRcdGNvbnN0IGljb24gPSBnZXRGb2xkZXJJY29uQnlUeXBlKGZvbGRlckluZm8uZm9sZGVyVHlwZSlcblxuXHRcdGNvbnN0IGZvbGRlclRleHQgPSB2aWV3TW9kZWwuZ2V0Rm9sZGVyTWFpbGJveFRleHQoKVxuXHRcdGNvbnN0IGxhYmVscyA9IHZpZXdNb2RlbC5nZXRMYWJlbHMoKVxuXHRcdGlmIChmb2xkZXJUZXh0ID09IG51bGwgJiYgbGFiZWxzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cblx0XHRjb25zdCBtYXJnaW4gPSBweChzaXplLnZwYWRfeHNtKVxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIuZmxleC5tYi14cy5mbGV4LXdyYXBcIixcblx0XHRcdHtcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRjb2x1bW5HYXA6IG1hcmdpbixcblx0XHRcdFx0XHRyb3dHYXA6IG1hcmdpbixcblx0XHRcdFx0fSxcblx0XHRcdFx0Y2xhc3M6IHJlc3BvbnNpdmVDYXJkSE1hcmdpbigpLFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0Zm9sZGVyVGV4dFxuXHRcdFx0XHRcdD8gbShcIi5mbGV4LnNtYWxsXCIsIFtcblx0XHRcdFx0XHRcdFx0bShcIi5iXCIsIG0oXCJcIiwgbGFuZy5nZXQoXCJsb2NhdGlvbl9sYWJlbFwiKSkpLFxuXHRcdFx0XHRcdFx0XHRtKEljb24sIHtcblx0XHRcdFx0XHRcdFx0XHRpY29uLFxuXHRcdFx0XHRcdFx0XHRcdGNvbnRhaW5lcjogXCJkaXZcIixcblx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsbDogdGhlbWUuY29udGVudF9idXR0b24sXG5cdFx0XHRcdFx0XHRcdFx0XHRtYXJnaW5MZWZ0OiBtYXJnaW4sXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdG0oXCIuc3BhblwiLCBmb2xkZXJJbmZvLm5hbWUpLFxuXHRcdFx0XHRcdCAgXSlcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdGxhYmVscy5tYXAoKGxhYmVsKSA9PlxuXHRcdFx0XHRcdG0oTGFiZWwsIHtcblx0XHRcdFx0XHRcdHRleHQ6IGxhYmVsLm5hbWUsXG5cdFx0XHRcdFx0XHRjb2xvcjogbGFiZWwuY29sb3IgPz8gdGhlbWUuY29udGVudF9hY2NlbnQsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdCksXG5cdFx0XHRdLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQWRkcmVzc2VzQW5kRGF0ZSh2aWV3TW9kZWw6IE1haWxWaWV3ZXJWaWV3TW9kZWwsIGF0dHJzOiBNYWlsVmlld2VySGVhZGVyQXR0cnMsIGRhdGVUaW1lOiBzdHJpbmcsIGRhdGVUaW1lRnVsbDogc3RyaW5nKSB7XG5cdFx0Y29uc3QgZm9sZGVySW5mbyA9IHZpZXdNb2RlbC5nZXRGb2xkZXJJbmZvKClcblx0XHRpZiAoIWZvbGRlckluZm8pIHJldHVybiBudWxsXG5cblx0XHRjb25zdCBkaXNwbGF5ZWRTZW5kZXIgPSB2aWV3TW9kZWwuZ2V0RGlzcGxheWVkU2VuZGVyKClcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZsZXgubXQteHMuY2xpY2suY29sXCIsXG5cdFx0XHR7XG5cdFx0XHRcdGNsYXNzOiByZXNwb25zaXZlQ2FyZEhNYXJnaW4oKSxcblx0XHRcdFx0cm9sZTogXCJidXR0b25cIixcblx0XHRcdFx0XCJhcmlhLXByZXNzZWRcIjogU3RyaW5nKHRoaXMuZGV0YWlsc0V4cGFuZGVkKSxcblx0XHRcdFx0XCJhcmlhLWV4cGFuZGVkXCI6IFN0cmluZyh0aGlzLmRldGFpbHNFeHBhbmRlZCksXG5cdFx0XHRcdHRhYmluZGV4OiBUYWJJbmRleC5EZWZhdWx0LFxuXHRcdFx0XHRvbmNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5kZXRhaWxzRXhwYW5kZWQgPSAhdGhpcy5kZXRhaWxzRXhwYW5kZWRcblx0XHRcdFx0fSxcblx0XHRcdFx0b25rZXlkb3duOiAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuXHRcdFx0XHRcdGlmIChpc0tleVByZXNzZWQoZS5rZXksIEtleXMuU1BBQ0UsIEtleXMuUkVUVVJOKSkge1xuXHRcdFx0XHRcdFx0dGhpcy5kZXRhaWxzRXhwYW5kZWQgPSAhdGhpcy5kZXRhaWxzRXhwYW5kZWRcblx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRbXG5cdFx0XHRcdGRpc3BsYXllZFNlbmRlciA9PSBudWxsXG5cdFx0XHRcdFx0PyBudWxsXG5cdFx0XHRcdFx0OiBtKFwiLnNtYWxsLmZsZXguZmxleC13cmFwLml0ZW1zLXN0YXJ0XCIsIFtcblx0XHRcdFx0XHRcdFx0bShcInNwYW4udGV4dC1icmVha1wiLCBnZXRNYWlsQWRkcmVzc0Rpc3BsYXlUZXh0KGRpc3BsYXllZFNlbmRlci5uYW1lLCBkaXNwbGF5ZWRTZW5kZXIuYWRkcmVzcywgZmFsc2UpKSxcblx0XHRcdFx0XHQgIF0pLFxuXHRcdFx0XHRtKFwiLmZsZXhcIiwgW1xuXHRcdFx0XHRcdHRoaXMuZ2V0UmVjaXBpZW50RW1haWxBZGRyZXNzKGF0dHJzKSxcblx0XHRcdFx0XHRtKFwiLmZsZXgtZ3Jvd1wiKSxcblx0XHRcdFx0XHRtKFwiLmZsZXguaXRlbXMtY2VudGVyLndoaXRlLXNwYWNlLXByZS5tbC1zLm1sLWJldHdlZW4tc1wiLCB7XG5cdFx0XHRcdFx0XHQvLyBPcmNhIHJlZnVzZXMgdG8gcmVhZCB1dCB1bmxlc3MgaXQncyBub3QgZm9jdXNhYmxlXG5cdFx0XHRcdFx0XHR0YWJpbmRleDogVGFiSW5kZXguRGVmYXVsdCxcblx0XHRcdFx0XHRcdFwiYXJpYS1sYWJlbFwiOiBsYW5nLmdldCh2aWV3TW9kZWwuaXNDb25maWRlbnRpYWwoKSA/IFwiY29uZmlkZW50aWFsX2FjdGlvblwiIDogXCJub25Db25maWRlbnRpYWxfYWN0aW9uXCIpICsgXCIsIFwiICsgZGF0ZVRpbWUsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0bShcIi5mbGV4Lm1sLWJldHdlZW4tcy5pdGVtcy1jZW50ZXJcIiwgW1xuXHRcdFx0XHRcdFx0dmlld01vZGVsLmlzQ29uZmlkZW50aWFsKClcblx0XHRcdFx0XHRcdFx0PyBtKEljb24sIHtcblx0XHRcdFx0XHRcdFx0XHRcdGljb246IGdldENvbmZpZGVudGlhbEljb24odmlld01vZGVsLm1haWwpLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29udGFpbmVyOiBcImRpdlwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZmlsbDogdGhlbWUuY29udGVudF9idXR0b24sXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0aG92ZXJUZXh0OiBsYW5nLmdldChcImNvbmZpZGVudGlhbF9sYWJlbFwiKSxcblx0XHRcdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdFx0XHQ6IG51bGwsXG5cblx0XHRcdFx0XHRcdG0oSWNvbiwge1xuXHRcdFx0XHRcdFx0XHRpY29uOiBnZXRGb2xkZXJJY29uQnlUeXBlKGZvbGRlckluZm8uZm9sZGVyVHlwZSksXG5cdFx0XHRcdFx0XHRcdGNvbnRhaW5lcjogXCJkaXZcIixcblx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRmaWxsOiB0aGVtZS5jb250ZW50X2J1dHRvbixcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0aG92ZXJUZXh0OiBmb2xkZXJJbmZvLm5hbWUsXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdG0oXCIuc21hbGwuZm9udC13ZWlnaHQtNjAwLnNlbGVjdGFibGUubm8td3JhcFwiLCB7IHN0eWxlOiB7IGNvbG9yOiB0aGVtZS5jb250ZW50X2J1dHRvbiB9IH0sIFtcblx0XHRcdFx0XHRcdFx0bShcIi5ub3ByaW50XCIsIGRhdGVUaW1lKSwgLy8gc2hvdyB0aGUgc2hvcnQgZGF0ZSB3aGVuIHZpZXdpbmdcblx0XHRcdFx0XHRcdFx0bShcIi5ub3NjcmVlblwiLCBkYXRlVGltZUZ1bGwpLCAvLyBzaG93IHRoZSBkYXRlIHdpdGggeWVhciB3aGVuIHByaW50aW5nXG5cdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XSksXG5cdFx0XHRdLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyU3ViamVjdEFjdGlvbnNMaW5lKGF0dHJzOiBNYWlsVmlld2VySGVhZGVyQXR0cnMpIHtcblx0XHRjb25zdCB7IHZpZXdNb2RlbCB9ID0gYXR0cnNcblx0XHRjb25zdCBjbGFzc2VzID0gdGhpcy5tYWtlU3ViamVjdEFjdGlvbnNMaW5lQ2xhc3NlcygpXG5cdFx0Y29uc3Qgc2VuZGVyTmFtZSA9IHZpZXdNb2RlbC5nZXREaXNwbGF5ZWRTZW5kZXIoKT8ubmFtZT8udHJpbSgpID8/IFwiXCJcblx0XHRjb25zdCBkaXNwbGF5QWRkcmVzc0ZvclNlbmRlciA9IHNlbmRlck5hbWUgPT09IFwiXCJcblxuXHRcdHJldHVybiBtKGNsYXNzZXMsIFtcblx0XHRcdG0oXG5cdFx0XHRcdFwiLmZsZXguZmxleC1ncm93LmFsaWduLXNlbGYtc3RhcnQuaXRlbXMtc3RhcnQub3ZlcmZsb3ctaGlkZGVuXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjbGFzczogc3R5bGVzLmlzU2luZ2xlQ29sdW1uTGF5b3V0KCkgPyBcIm10LW1cIiA6IFwibXRcIixcblx0XHRcdFx0XHRyb2xlOiBcImJ1dHRvblwiLFxuXHRcdFx0XHRcdFwibWFpbC1leHBhbmRlclwiOiBcInRydWVcIixcblx0XHRcdFx0XHQvLyBcImFyaWEtZXhwYW5kZWRcIiBpcyBhbHdheXMgdHJ1ZSBiZWNhdXNlIHRoaXMgY29tcG9uZW50IGlzIG9ubHkgdXNlZCBpbiBleHBhbmRlZCB2aWV3XG5cdFx0XHRcdFx0XCJhcmlhLWV4cGFuZGVkXCI6IFwidHJ1ZVwiLFxuXHRcdFx0XHRcdHRhYmluZGV4OiBUYWJJbmRleC5EZWZhdWx0LFxuXHRcdFx0XHRcdG9uY2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHR2aWV3TW9kZWwuY29sbGFwc2VNYWlsKClcblx0XHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9ua2V5ZG93bjogKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdGlmIChpc0tleVByZXNzZWQoZS5rZXksIEtleXMuU1BBQ0UsIEtleXMuUkVUVVJOKSAmJiAoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmhhc0F0dHJpYnV0ZShcIm1haWwtZXhwYW5kZXJcIikpIHtcblx0XHRcdFx0XHRcdFx0dmlld01vZGVsLmNvbGxhcHNlTWFpbCgpXG5cdFx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHR2aWV3TW9kZWwuaXNVbnJlYWQoKSA/IHRoaXMucmVuZGVyVW5yZWFkRG90KCkgOiBudWxsLFxuXHRcdFx0XHRcdHZpZXdNb2RlbC5pc0RyYWZ0TWFpbCgpXG5cdFx0XHRcdFx0XHQ/IG0oXG5cdFx0XHRcdFx0XHRcdFx0XCIubXIteHMuYWxpZ24tc2VsZi1jZW50ZXJcIixcblx0XHRcdFx0XHRcdFx0XHRtKEljb24sIHtcblx0XHRcdFx0XHRcdFx0XHRcdGljb246IEljb25zLkVkaXQsXG5cdFx0XHRcdFx0XHRcdFx0XHRjb250YWluZXI6IFwiZGl2XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRmaWxsOiB0aGVtZS5jb250ZW50X2J1dHRvbixcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRob3ZlclRleHQ6IGxhbmcuZ2V0KFwiZHJhZnRfbGFiZWxcIiksXG5cdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHQgIClcblx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XHR0aGlzLnR1dGFvQmFkZ2Uodmlld01vZGVsKSxcblx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XCJzcGFuXCIgKyAoZGlzcGxheUFkZHJlc3NGb3JTZW5kZXIgPyBcIi5pbnZpc2libGUub3ZlcmZsb3ctaGlkZGVuXCIgOiBcIi50ZXh0LWJyZWFrXCIpICsgKHZpZXdNb2RlbC5pc1VucmVhZCgpID8gXCIuZm9udC13ZWlnaHQtNjAwXCIgOiBcIlwiKSxcblx0XHRcdFx0XHRcdGRpc3BsYXlBZGRyZXNzRm9yU2VuZGVyID8gdmlld01vZGVsLmdldERpc3BsYXllZFNlbmRlcigpPy5hZGRyZXNzID8/IFwiXCIgOiBzZW5kZXJOYW1lLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdF0sXG5cdFx0XHQpLFxuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleC1lbmQuaXRlbXMtc3RhcnQubWwtYmV0d2Vlbi1zXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjbGFzczogc3R5bGVzLmlzU2luZ2xlQ29sdW1uTGF5b3V0KCkgPyBcIlwiIDogXCJtdC14c1wiLFxuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHQvLyBhbGlnbiBcIm1vcmVcIiBidXR0b24gd2l0aCB0aGUgZGF0ZXRpbWUgdGV4dFxuXHRcdFx0XHRcdFx0bWFyZ2luUmlnaHQ6IHN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpID8gXCItM3B4XCIgOiBcIjZweFwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRoaXMubW9yZUJ1dHRvbihhdHRycyksXG5cdFx0XHQpLFxuXHRcdF0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclVucmVhZERvdCgpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5mbGV4LmZsZXgtbm8tZ3Jvdy5uby1zaHJpbmsucHItc1wiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdHBhZGRpbmdUb3A6IFwiMnB4XCIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0bShcIi5kb3QuYmctYWNjZW50LWZnXCIpLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgbWFrZVN1YmplY3RBY3Rpb25zTGluZUNsYXNzZXMoKSB7XG5cdFx0bGV0IGNsYXNzZXMgPSBcIi5mbGV4LmNsaWNrXCJcblx0XHRpZiAoc3R5bGVzLmlzU2luZ2xlQ29sdW1uTGF5b3V0KCkpIHtcblx0XHRcdGNsYXNzZXMgKz0gXCIubWxcIlxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjbGFzc2VzICs9IFwiLnBsLWxcIlxuXHRcdH1cblxuXHRcdHJldHVybiBjbGFzc2VzXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckJhbm5lcnMoYXR0cnM6IE1haWxWaWV3ZXJIZWFkZXJBdHRycyk6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IHZpZXdNb2RlbCB9ID0gYXR0cnNcblx0XHRpZiAodmlld01vZGVsLmlzQ29sbGFwc2VkKCkpIHJldHVybiBudWxsXG5cdFx0Ly8gd2UgZG9uJ3Qgd3JhcCBpdCBpbiBhIHNpbmdsZSBlbGVtZW50IGJlY2F1c2Ugb3VyIGNvbnRhaW5lciBtaWdodCBkZXBlbmQgb24gdXMgYmVpbmcgc2VwYXJhdGUgY2hpbGRyZW4gZm9yIG1hcmdpbnNcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcblx0XHRcdFx0XCIuXCIgKyByZXNwb25zaXZlQ2FyZEhNYXJnaW4oKSxcblx0XHRcdFx0dGhpcy5yZW5kZXJQaGlzaGluZ1dhcm5pbmcodmlld01vZGVsKSB8fFxuXHRcdFx0XHRcdHRoaXMucmVuZGVySGFyZEF1dGhlbnRpY2F0aW9uRmFpbFdhcm5pbmcodmlld01vZGVsKSB8fFxuXHRcdFx0XHRcdHRoaXMucmVuZGVyU29mdEF1dGhlbnRpY2F0aW9uRmFpbFdhcm5pbmcodmlld01vZGVsKSxcblx0XHRcdCksXG5cdFx0XHRtKFwiLlwiICsgcmVzcG9uc2l2ZUNhcmRITWFyZ2luKCksIHRoaXMucmVuZGVyRXh0ZXJuYWxDb250ZW50QmFubmVyKGF0dHJzKSksXG5cdFx0XHRtKFwiaHIuaHIubXQteHMuXCIgKyByZXNwb25zaXZlQ2FyZEhNYXJnaW4oKSksXG5cdFx0XS5maWx0ZXIoQm9vbGVhbilcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQ29ubmVjdGlvbkxvc3RCYW5uZXIodmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsKTogQ2hpbGRyZW4ge1xuXHRcdC8vIElmIHRoZSBtYWlsIGJvZHkgZmFpbGVkIHRvIGxvYWQsIHRoZW4gd2Ugc2hvdyBhIG1lc3NhZ2UgaW4gdGhlIG1haW4gY29sdW1uXG5cdFx0Ly8gSWYgdGhlIG1haWwgYm9keSBkaWQgbG9hZCBidXQgbm90IGV2ZXJ5dGhpbmcgZWxzZSwgd2Ugc2hvdyB0aGUgbWVzc2FnZSBoZXJlXG5cdFx0aWYgKHZpZXdNb2RlbC5pc0Nvbm5lY3Rpb25Mb3N0KCkpIHtcblx0XHRcdHJldHVybiBtKFxuXHRcdFx0XHRcIi5cIiArIHJlc3BvbnNpdmVDYXJkSE1hcmdpbigpLFxuXHRcdFx0XHRtKEluZm9CYW5uZXIsIHtcblx0XHRcdFx0XHRtZXNzYWdlOiBcIm1haWxQYXJ0c05vdExvYWRlZF9tc2dcIixcblx0XHRcdFx0XHRpY29uOiBJY29ucy5XYXJuaW5nLFxuXHRcdFx0XHRcdGJ1dHRvbnM6IFtcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGFiZWw6IFwicmV0cnlfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB2aWV3TW9kZWwubG9hZEFsbChQcm9taXNlLnJlc29sdmUoKSksXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRXZlbnRCYW5uZXIodmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGV2ZW50QXR0YWNobWVudCA9IHZpZXdNb2RlbC5nZXRDYWxlbmRhckV2ZW50QXR0YWNobWVudCgpXG5cdFx0cmV0dXJuIGV2ZW50QXR0YWNobWVudFxuXHRcdFx0PyBtKFxuXHRcdFx0XHRcdFwiLlwiICsgcmVzcG9uc2l2ZUNhcmRITWFyZ2luKCksXG5cdFx0XHRcdFx0bShFdmVudEJhbm5lciwge1xuXHRcdFx0XHRcdFx0Y29udGVudHM6IGV2ZW50QXR0YWNobWVudC5jb250ZW50cyxcblx0XHRcdFx0XHRcdHJlY2lwaWVudDogZXZlbnRBdHRhY2htZW50LnJlY2lwaWVudCxcblx0XHRcdFx0XHRcdG1haWw6IHZpZXdNb2RlbC5tYWlsLFxuXHRcdFx0XHRcdH0gc2F0aXNmaWVzIEV2ZW50QmFubmVyQXR0cnMpLFxuXHRcdFx0ICApXG5cdFx0XHQ6IG51bGxcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRGV0YWlscyhhdHRyczogTWFpbFZpZXdlckhlYWRlckF0dHJzLCB7IGJ1YmJsZU1lbnVXaWR0aCB9OiB7IGJ1YmJsZU1lbnVXaWR0aDogbnVtYmVyIH0pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgeyB2aWV3TW9kZWwsIGNyZWF0ZU1haWxBZGRyZXNzQ29udGV4dEJ1dHRvbnMgfSA9IGF0dHJzXG5cdFx0Y29uc3QgZW52ZWxvcGVTZW5kZXIgPSB2aWV3TW9kZWwuZ2V0RGlmZmVyZW50RW52ZWxvcGVTZW5kZXIoKVxuXHRcdGNvbnN0IGRpc3BsYXllZFNlbmRlciA9IHZpZXdNb2RlbC5nZXREaXNwbGF5ZWRTZW5kZXIoKVxuXG5cdFx0cmV0dXJuIG0oXCIuXCIgKyByZXNwb25zaXZlQ2FyZEhQYWRkaW5nKCksIGxpdmVEYXRhQXR0cnMoKSwgW1xuXHRcdFx0bShcblx0XHRcdFx0XCIubXQtc1wiLFxuXHRcdFx0XHRkaXNwbGF5ZWRTZW5kZXIgPT0gbnVsbFxuXHRcdFx0XHRcdD8gbnVsbFxuXHRcdFx0XHRcdDogW1xuXHRcdFx0XHRcdFx0XHRtKFwiLnNtYWxsLmJcIiwgbGFuZy5nZXQoXCJmcm9tX2xhYmVsXCIpKSxcblx0XHRcdFx0XHRcdFx0bShSZWNpcGllbnRCdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogZ2V0TWFpbEFkZHJlc3NEaXNwbGF5VGV4dChkaXNwbGF5ZWRTZW5kZXIubmFtZSwgZGlzcGxheWVkU2VuZGVyLmFkZHJlc3MsIGZhbHNlKSxcblx0XHRcdFx0XHRcdFx0XHRjbGljazogY3JlYXRlQXN5bmNEcm9wZG93bih7XG5cdFx0XHRcdFx0XHRcdFx0XHRsYXp5QnV0dG9uczogKCkgPT5cblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3JlYXRlTWFpbEFkZHJlc3NDb250ZXh0QnV0dG9ucyh7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bWFpbEFkZHJlc3M6IGRpc3BsYXllZFNlbmRlcixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0SW5ib3hSdWxlRmllbGQ6IEluYm94UnVsZVR5cGUuRlJPTV9FUVVBTFMsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0d2lkdGg6IGJ1YmJsZU1lbnVXaWR0aCxcblx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0ICBdLFxuXHRcdFx0XHRlbnZlbG9wZVNlbmRlclxuXHRcdFx0XHRcdD8gW1xuXHRcdFx0XHRcdFx0XHRtKFwiLnNtYWxsLmJcIiwgbGFuZy5nZXQoXCJzZW5kZXJfbGFiZWxcIikpLFxuXHRcdFx0XHRcdFx0XHRtKFJlY2lwaWVudEJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBnZXRNYWlsQWRkcmVzc0Rpc3BsYXlUZXh0KFwiXCIsIGVudmVsb3BlU2VuZGVyLCBmYWxzZSksXG5cdFx0XHRcdFx0XHRcdFx0Y2xpY2s6IGNyZWF0ZUFzeW5jRHJvcGRvd24oe1xuXHRcdFx0XHRcdFx0XHRcdFx0bGF6eUJ1dHRvbnM6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgY2hpbGRFbGVtZW50cyA9IFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpbmZvOiBsYW5nLmdldChcImVudmVsb3BlU2VuZGVySW5mb19tc2dcIiksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjZW50ZXI6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ym9sZDogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpbmZvOiBlbnZlbG9wZVNlbmRlcixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNlbnRlcjogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJvbGQ6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBjb250ZXh0QnV0dG9ucyA9IGF3YWl0IGNyZWF0ZU1haWxBZGRyZXNzQ29udGV4dEJ1dHRvbnMoe1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1haWxBZGRyZXNzOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRhZGRyZXNzOiBlbnZlbG9wZVNlbmRlcixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG5hbWU6IFwiXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0SW5ib3hSdWxlRmllbGQ6IEluYm94UnVsZVR5cGUuRlJPTV9FUVVBTFMsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3JlYXRlQ29udGFjdDogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBbLi4uY2hpbGRFbGVtZW50cywgLi4uY29udGV4dEJ1dHRvbnNdXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0d2lkdGg6IGJ1YmJsZU1lbnVXaWR0aCxcblx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0ICBdXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0KSxcblx0XHRcdG0oXG5cdFx0XHRcdFwiLm10LXNcIixcblx0XHRcdFx0dmlld01vZGVsLmdldFRvUmVjaXBpZW50cygpLmxlbmd0aFxuXHRcdFx0XHRcdD8gW1xuXHRcdFx0XHRcdFx0XHRtKFwiLnNtYWxsLmJcIiwgbGFuZy5nZXQoXCJ0b19sYWJlbFwiKSksXG5cdFx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdFx0XCIuZmxleC5jb2wubXQtYmV0d2Vlbi1zXCIsXG5cdFx0XHRcdFx0XHRcdFx0dmlld01vZGVsLmdldFRvUmVjaXBpZW50cygpLm1hcCgocmVjaXBpZW50KSA9PlxuXHRcdFx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCIuZmxleFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRtKFJlY2lwaWVudEJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBnZXRNYWlsQWRkcmVzc0Rpc3BsYXlUZXh0KHJlY2lwaWVudC5uYW1lLCByZWNpcGllbnQuYWRkcmVzcywgZmFsc2UpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNsaWNrOiBjcmVhdGVBc3luY0Ryb3Bkb3duKHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhenlCdXR0b25zOiAoKSA9PlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjcmVhdGVNYWlsQWRkcmVzc0NvbnRleHRCdXR0b25zKHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtYWlsQWRkcmVzczogcmVjaXBpZW50LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRlZmF1bHRJbmJveFJ1bGVGaWVsZDogSW5ib3hSdWxlVHlwZS5SRUNJUElFTlRfVE9fRVFVQUxTLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHdpZHRoOiBidWJibGVNZW51V2lkdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gVG8gd3JhcCB0ZXh0IGluc2lkZSBmbGV4IGNvbnRhaW5lciwgd2UgbmVlZCB0byBhbGxvdyBlbGVtZW50IHRvIHNocmluayBhbmQgcGljayBvd24gd2lkdGhcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZmxleDogXCIwIDEgYXV0b1wiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdCAgXVxuXHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdCksXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5tdC1zXCIsXG5cdFx0XHRcdHZpZXdNb2RlbC5nZXRDY1JlY2lwaWVudHMoKS5sZW5ndGhcblx0XHRcdFx0XHQ/IFtcblx0XHRcdFx0XHRcdFx0bShcIi5zbWFsbC5iXCIsIGxhbmcuZ2V0KFwiY2NfbGFiZWxcIikpLFxuXHRcdFx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XHRcdFwiLmZsZXgtc3RhcnQuZmxleC13cmFwXCIsXG5cdFx0XHRcdFx0XHRcdFx0dmlld01vZGVsLmdldENjUmVjaXBpZW50cygpLm1hcCgocmVjaXBpZW50KSA9PlxuXHRcdFx0XHRcdFx0XHRcdFx0bShSZWNpcGllbnRCdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw6IGdldE1haWxBZGRyZXNzRGlzcGxheVRleHQocmVjaXBpZW50Lm5hbWUsIHJlY2lwaWVudC5hZGRyZXNzLCBmYWxzZSksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNsaWNrOiBjcmVhdGVBc3luY0Ryb3Bkb3duKHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsYXp5QnV0dG9uczogKCkgPT5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNyZWF0ZU1haWxBZGRyZXNzQ29udGV4dEJ1dHRvbnMoe1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtYWlsQWRkcmVzczogcmVjaXBpZW50LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0SW5ib3hSdWxlRmllbGQ6IEluYm94UnVsZVR5cGUuUkVDSVBJRU5UX0NDX0VRVUFMUyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHdpZHRoOiBidWJibGVNZW51V2lkdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGZsZXg6IFwiMCAxIGF1dG9cIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0ICBdXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0KSxcblx0XHRcdG0oXG5cdFx0XHRcdFwiLm10LXNcIixcblx0XHRcdFx0dmlld01vZGVsLmdldEJjY1JlY2lwaWVudHMoKS5sZW5ndGhcblx0XHRcdFx0XHQ/IFtcblx0XHRcdFx0XHRcdFx0bShcIi5zbWFsbC5iXCIsIGxhbmcuZ2V0KFwiYmNjX2xhYmVsXCIpKSxcblx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRcIi5mbGV4LXN0YXJ0LmZsZXgtd3JhcFwiLFxuXHRcdFx0XHRcdFx0XHRcdHZpZXdNb2RlbC5nZXRCY2NSZWNpcGllbnRzKCkubWFwKChyZWNpcGllbnQpID0+XG5cdFx0XHRcdFx0XHRcdFx0XHRtKFJlY2lwaWVudEJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRsYWJlbDogZ2V0TWFpbEFkZHJlc3NEaXNwbGF5VGV4dChyZWNpcGllbnQubmFtZSwgcmVjaXBpZW50LmFkZHJlc3MsIGZhbHNlKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6IGNyZWF0ZUFzeW5jRHJvcGRvd24oe1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhenlCdXR0b25zOiAoKSA9PlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3JlYXRlTWFpbEFkZHJlc3NDb250ZXh0QnV0dG9ucyh7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1haWxBZGRyZXNzOiByZWNpcGllbnQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRlZmF1bHRJbmJveFJ1bGVGaWVsZDogSW5ib3hSdWxlVHlwZS5SRUNJUElFTlRfQkNDX0VRVUFMUyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHdpZHRoOiBidWJibGVNZW51V2lkdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGZsZXg6IFwiMCAxIGF1dG9cIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0ICBdXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0KSxcblx0XHRcdG0oXG5cdFx0XHRcdFwiLm10LXNcIixcblx0XHRcdFx0dmlld01vZGVsLmdldFJlcGx5VG9zKCkubGVuZ3RoXG5cdFx0XHRcdFx0PyBbXG5cdFx0XHRcdFx0XHRcdG0oXCIuc21hbGwuYlwiLCBsYW5nLmdldChcInJlcGx5VG9fbGFiZWxcIikpLFxuXHRcdFx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XHRcdFwiLmZsZXgtc3RhcnQuZmxleC13cmFwXCIsXG5cdFx0XHRcdFx0XHRcdFx0dmlld01vZGVsLmdldFJlcGx5VG9zKCkubWFwKChyZWNpcGllbnQpID0+XG5cdFx0XHRcdFx0XHRcdFx0XHRtKFJlY2lwaWVudEJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRsYWJlbDogZ2V0TWFpbEFkZHJlc3NEaXNwbGF5VGV4dChyZWNpcGllbnQubmFtZSwgcmVjaXBpZW50LmFkZHJlc3MsIGZhbHNlKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6IGNyZWF0ZUFzeW5jRHJvcGRvd24oe1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhenlCdXR0b25zOiAoKSA9PlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3JlYXRlTWFpbEFkZHJlc3NDb250ZXh0QnV0dG9ucyh7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1haWxBZGRyZXNzOiByZWNpcGllbnQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRlZmF1bHRJbmJveFJ1bGVGaWVsZDogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHdpZHRoOiBidWJibGVNZW51V2lkdGgsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGZsZXg6IFwiMCAxIGF1dG9cIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0ICBdXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0KSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJBdHRhY2htZW50cyh2aWV3TW9kZWw6IE1haWxWaWV3ZXJWaWV3TW9kZWwsIGltcG9ydEZpbGU6IChmaWxlOiBUdXRhbm90YUZpbGUpID0+IHZvaWQpOiBDaGlsZHJlbiB7XG5cdFx0Ly8gU2hvdyBhIGxvYWRpbmcgc3ltYm9sIGlmIHdlIGFyZSBsb2FkaW5nIGF0dGFjaG1lbnRzXG5cdFx0aWYgKHZpZXdNb2RlbC5pc0xvYWRpbmdBdHRhY2htZW50cygpICYmICF2aWV3TW9kZWwuaXNDb25uZWN0aW9uTG9zdCgpKSB7XG5cdFx0XHRyZXR1cm4gbShcIi5mbGV4LlwiICsgcmVzcG9uc2l2ZUNhcmRITWFyZ2luKCksIFtcblx0XHRcdFx0bShcIi5mbGV4LXYtY2VudGVyLnBsLWJ1dHRvblwiLCBwcm9ncmVzc0ljb24oKSksXG5cdFx0XHRcdG0oXCIuc21hbGwuZmxleC12LWNlbnRlci5wbHIuYnV0dG9uLWhlaWdodFwiLCBsYW5nLmdldChcImxvYWRpbmdfbXNnXCIpKSxcblx0XHRcdF0pXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IGF0dGFjaG1lbnRzID0gdmlld01vZGVsLmdldE5vbklubGluZUF0dGFjaG1lbnRzKClcblx0XHRcdGNvbnN0IGF0dGFjaG1lbnRDb3VudCA9IGF0dGFjaG1lbnRzLmxlbmd0aFxuXG5cdFx0XHQvLyBEbyBub3RoaW5nIGlmIHdlIGhhdmUgbm8gYXR0YWNobWVudHNcblx0XHRcdGlmIChhdHRhY2htZW50Q291bnQgPT09IDApIHtcblx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdH1cblxuXHRcdFx0Ly8gR2V0IHRoZSB0b3RhbCBzaXplIG9mIHRoZSBhdHRhY2htZW50c1xuXHRcdFx0bGV0IHRvdGFsQXR0YWNobWVudFNpemUgPSAwXG5cdFx0XHRmb3IgKGNvbnN0IGF0dGFjaG1lbnQgb2YgYXR0YWNobWVudHMpIHtcblx0XHRcdFx0dG90YWxBdHRhY2htZW50U2l6ZSArPSBOdW1iZXIoYXR0YWNobWVudC5zaXplKVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHRtKFwiLmZsZXgubXQtcy5tYi1zXCIgKyBcIi5cIiArIHJlc3BvbnNpdmVDYXJkSE1hcmdpbigpLCBsaXZlRGF0YUF0dHJzKCksIFtcblx0XHRcdFx0XHRhdHRhY2htZW50Q291bnQgPT09IDFcblx0XHRcdFx0XHRcdD8gLy8gSWYgd2UgaGF2ZSBleGFjdGx5IG9uZSBhdHRhY2htZW50LCBqdXN0IHNob3cgdGhlIGF0dGFjaG1lbnRcblx0XHRcdFx0XHRcdCAgdGhpcy5yZW5kZXJBdHRhY2htZW50Q29udGFpbmVyKHZpZXdNb2RlbCwgYXR0YWNobWVudHMsIGltcG9ydEZpbGUpXG5cdFx0XHRcdFx0XHQ6IC8vIE90aGVyd2lzZSwgd2Ugc2hvdyB0aGUgbnVtYmVyIG9mIGF0dGFjaG1lbnRzIGFuZCBpdHMgdG90YWwgc2l6ZSBhbG9uZyB3aXRoIGEgc2hvdyBhbGwgYnV0dG9uXG5cdFx0XHRcdFx0XHQgIG0oRXhwYW5kZXJCdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogbGFuZy5tYWtlVHJhbnNsYXRpb24oXG5cdFx0XHRcdFx0XHRcdFx0XHRcImF0dGFjaG1lbnRBbW91bnRfbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0XHRcdGxhbmcuZ2V0KFwiYXR0YWNobWVudEFtb3VudF9sYWJlbFwiLCB7IFwie2Ftb3VudH1cIjogYXR0YWNobWVudENvdW50ICsgXCJcIiB9KSArIGAgKCR7Zm9ybWF0U3RvcmFnZVNpemUodG90YWxBdHRhY2htZW50U2l6ZSl9KWAsXG5cdFx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XCJwYWRkaW5nLXRvcFwiOiBcImluaGVyaXRcIixcblx0XHRcdFx0XHRcdFx0XHRcdGhlaWdodDogXCJpbmhlcml0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcIm1pbi1oZWlnaHRcIjogXCJpbmhlcml0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcInRleHQtZGVjb3JhdGlvblwiOiBcIm5vbmVcIixcblx0XHRcdFx0XHRcdFx0XHRcdFwiZm9udC13ZWlnaHRcIjogXCJub3JtYWxcIixcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdGV4cGFuZGVkOiB0aGlzLmZpbGVzRXhwYW5kZWQsXG5cdFx0XHRcdFx0XHRcdFx0Y29sb3I6IHRoZW1lLmNvbnRlbnRfZmcsXG5cdFx0XHRcdFx0XHRcdFx0aXNCaWc6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0aXNVbmZvcm1hdHRlZExhYmVsOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdG9uRXhwYW5kZWRDaGFuZ2U6IChjaGFuZ2UpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuZmlsZXNFeHBhbmRlZCA9IGNoYW5nZVxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHQgIH0pLFxuXHRcdFx0XHRdKSxcblxuXHRcdFx0XHQvLyBpZiB3ZSBoYXZlIG1vcmUgdGhhbiBvbmUgYXR0YWNobWVudCwgbGlzdCB0aGVtIGhlcmUgaW4gdGhpcyBleHBhbmRlciBwYW5lbFxuXHRcdFx0XHRhdHRhY2htZW50cy5sZW5ndGggPiAxXG5cdFx0XHRcdFx0PyBtKFxuXHRcdFx0XHRcdFx0XHRFeHBhbmRlclBhbmVsLFxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0ZXhwYW5kZWQ6IHRoaXMuZmlsZXNFeHBhbmRlZCxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0bShcIi5mbGV4LmNvbC5cIiArIHJlc3BvbnNpdmVDYXJkSE1hcmdpbigpLCBbXG5cdFx0XHRcdFx0XHRcdFx0bShcIi5mbGV4LmZsZXgtd3JhcC5nYXAtaHBhZFwiLCB0aGlzLnJlbmRlckF0dGFjaG1lbnRDb250YWluZXIodmlld01vZGVsLCBhdHRhY2htZW50cywgaW1wb3J0RmlsZSkpLFxuXHRcdFx0XHRcdFx0XHRcdGlzSU9TQXBwKClcblx0XHRcdFx0XHRcdFx0XHRcdD8gbnVsbFxuXHRcdFx0XHRcdFx0XHRcdFx0OiBtKFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwiLmZsZXhcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtKEJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwic2F2ZUFsbF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHZpZXdNb2RlbC5kb3dubG9hZEFsbCgpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0ICApLFxuXHRcdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHQgIClcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRdXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJBdHRhY2htZW50Q29udGFpbmVyKHZpZXdNb2RlbDogTWFpbFZpZXdlclZpZXdNb2RlbCwgYXR0YWNobWVudHM6IFR1dGFub3RhRmlsZVtdLCBpbXBvcnRGaWxlOiAoZmlsZTogVHV0YW5vdGFGaWxlKSA9PiB2b2lkKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBhdHRhY2htZW50cy5tYXAoKGF0dGFjaG1lbnQpID0+IHtcblx0XHRcdGNvbnN0IGF0dGFjaG1lbnRUeXBlID0gZ2V0QXR0YWNobWVudFR5cGUoYXR0YWNobWVudC5taW1lVHlwZSA/PyBcIlwiKVxuXHRcdFx0cmV0dXJuIG0oQXR0YWNobWVudEJ1YmJsZSwge1xuXHRcdFx0XHRhdHRhY2htZW50LFxuXHRcdFx0XHRyZW1vdmU6IG51bGwsXG5cdFx0XHRcdGRvd25sb2FkOlxuXHRcdFx0XHRcdGlzQW5kcm9pZEFwcCgpIHx8IGlzRGVza3RvcCgpXG5cdFx0XHRcdFx0XHQ/ICgpID0+IHZpZXdNb2RlbC5kb3dubG9hZEFuZE9wZW5BdHRhY2htZW50KGF0dGFjaG1lbnQsIGZhbHNlKVxuXHRcdFx0XHRcdFx0OiAoKSA9PiB2aWV3TW9kZWwuZG93bmxvYWRBbmRPcGVuQXR0YWNobWVudChhdHRhY2htZW50LCB0cnVlKSxcblx0XHRcdFx0b3BlbjogaXNBbmRyb2lkQXBwKCkgfHwgaXNEZXNrdG9wKCkgPyAoKSA9PiB2aWV3TW9kZWwuZG93bmxvYWRBbmRPcGVuQXR0YWNobWVudChhdHRhY2htZW50LCB0cnVlKSA6IG51bGwsXG5cdFx0XHRcdGZpbGVJbXBvcnQ6IHZpZXdNb2RlbC5jYW5JbXBvcnRGaWxlKGF0dGFjaG1lbnQpID8gKCkgPT4gaW1wb3J0RmlsZShhdHRhY2htZW50KSA6IG51bGwsXG5cdFx0XHRcdHR5cGU6IGF0dGFjaG1lbnRUeXBlLFxuXHRcdFx0fSlcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSB0dXRhb0JhZGdlKHZpZXdNb2RlbDogTWFpbFZpZXdlclZpZXdNb2RlbCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gaXNUdXRhbm90YVRlYW1NYWlsKHZpZXdNb2RlbC5tYWlsKVxuXHRcdFx0PyBtKFxuXHRcdFx0XHRcdEJhZGdlLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNsYXNzZXM6IFwiLm1yLXNcIixcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGNvbXBhbnlUZWFtTGFiZWwsXG5cdFx0XHQgIClcblx0XHRcdDogbnVsbFxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJQaGlzaGluZ1dhcm5pbmcodmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsKTogQ2hpbGRyZW4gfCBudWxsIHtcblx0XHRpZiAodmlld01vZGVsLmlzTWFpbFN1c3BpY2lvdXMoKSkge1xuXHRcdFx0cmV0dXJuIG0oSW5mb0Jhbm5lciwge1xuXHRcdFx0XHRtZXNzYWdlOiBcInBoaXNoaW5nTWVzc2FnZUJvZHlfbXNnXCIsXG5cdFx0XHRcdGljb246IEljb25zLldhcm5pbmcsXG5cdFx0XHRcdHR5cGU6IEJhbm5lclR5cGUuV2FybmluZyxcblx0XHRcdFx0aGVscExpbms6IGNhblNlZVR1dGFMaW5rcyh2aWV3TW9kZWwubG9naW5zKSA/IEluZm9MaW5rLlBoaXNoaW5nIDogbnVsbCxcblx0XHRcdFx0YnV0dG9uczogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcIm1hcmtBc05vdFBoaXNoaW5nX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHZpZXdNb2RlbC5tYXJrQXNOb3RQaGlzaGluZygpLnRoZW4oKCkgPT4gbS5yZWRyYXcoKSksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdH0pXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJIYXJkQXV0aGVudGljYXRpb25GYWlsV2FybmluZyh2aWV3TW9kZWw6IE1haWxWaWV3ZXJWaWV3TW9kZWwpOiBDaGlsZHJlbiB8IG51bGwge1xuXHRcdGNvbnN0IGF1dGhGYWlsZWQgPVxuXHRcdFx0dmlld01vZGVsLmNoZWNrTWFpbEF1dGhlbnRpY2F0aW9uU3RhdHVzKE1haWxBdXRoZW50aWNhdGlvblN0YXR1cy5IQVJEX0ZBSUwpIHx8XG5cdFx0XHR2aWV3TW9kZWwubWFpbC5lbmNyeXB0aW9uQXV0aFN0YXR1cyA9PT0gRW5jcnlwdGlvbkF1dGhTdGF0dXMuVFVUQUNSWVBUX0FVVEhFTlRJQ0FUSU9OX0ZBSUxFRFxuXHRcdGlmICghdmlld01vZGVsLmlzV2FybmluZ0Rpc21pc3NlZCgpICYmIGF1dGhGYWlsZWQpIHtcblx0XHRcdHJldHVybiBtKEluZm9CYW5uZXIsIHtcblx0XHRcdFx0bWVzc2FnZTogXCJtYWlsQXV0aEZhaWxlZF9tc2dcIixcblx0XHRcdFx0aWNvbjogSWNvbnMuV2FybmluZyxcblx0XHRcdFx0aGVscExpbms6IGNhblNlZVR1dGFMaW5rcyh2aWV3TW9kZWwubG9naW5zKSA/IEluZm9MaW5rLk1haWxBdXRoIDogbnVsbCxcblx0XHRcdFx0dHlwZTogQmFubmVyVHlwZS5XYXJuaW5nLFxuXHRcdFx0XHRidXR0b25zOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4gdmlld01vZGVsLnNldFdhcm5pbmdEaXNtaXNzZWQodHJ1ZSksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdH0pXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJTb2Z0QXV0aGVudGljYXRpb25GYWlsV2FybmluZyh2aWV3TW9kZWw6IE1haWxWaWV3ZXJWaWV3TW9kZWwpOiBDaGlsZHJlbiB8IG51bGwge1xuXHRcdGlmICghdmlld01vZGVsLmlzV2FybmluZ0Rpc21pc3NlZCgpICYmIHZpZXdNb2RlbC5jaGVja01haWxBdXRoZW50aWNhdGlvblN0YXR1cyhNYWlsQXV0aGVudGljYXRpb25TdGF0dXMuU09GVF9GQUlMKSkge1xuXHRcdFx0cmV0dXJuIG0oSW5mb0Jhbm5lciwge1xuXHRcdFx0XHRtZXNzYWdlOiAoKSA9PlxuXHRcdFx0XHRcdHZpZXdNb2RlbC5tYWlsLmRpZmZlcmVudEVudmVsb3BlU2VuZGVyXG5cdFx0XHRcdFx0XHQ/IGxhbmcuZ2V0KFwibWFpbEF1dGhNaXNzaW5nV2l0aFRlY2huaWNhbFNlbmRlcl9tc2dcIiwge1xuXHRcdFx0XHRcdFx0XHRcdFwie3NlbmRlcn1cIjogdmlld01vZGVsLm1haWwuZGlmZmVyZW50RW52ZWxvcGVTZW5kZXIsXG5cdFx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0XHQ6IGxhbmcuZ2V0KFwibWFpbEF1dGhNaXNzaW5nX2xhYmVsXCIpLFxuXHRcdFx0XHRpY29uOiBJY29ucy5XYXJuaW5nLFxuXHRcdFx0XHRoZWxwTGluazogY2FuU2VlVHV0YUxpbmtzKHZpZXdNb2RlbC5sb2dpbnMpID8gSW5mb0xpbmsuTWFpbEF1dGggOiBudWxsLFxuXHRcdFx0XHRidXR0b25zOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4gdmlld01vZGVsLnNldFdhcm5pbmdEaXNtaXNzZWQodHJ1ZSksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdH0pXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJFeHRlcm5hbENvbnRlbnRCYW5uZXIoYXR0cnM6IE1haWxWaWV3ZXJIZWFkZXJBdHRycyk6IENoaWxkcmVuIHwgbnVsbCB7XG5cdFx0Ly8gb25seSBzaG93IGJhbm5lciB3aGVuIHRoZXJlIGFyZSBibG9ja2VkIGltYWdlcyBhbmQgdGhlIHVzZXIgaGFzbid0IG1hZGUgYSBkZWNpc2lvbiBhYm91dCBob3cgdG8gaGFuZGxlIHRoZW1cblx0XHRpZiAoYXR0cnMudmlld01vZGVsLmdldENvbnRlbnRCbG9ja2luZ1N0YXR1cygpICE9PSBDb250ZW50QmxvY2tpbmdTdGF0dXMuQmxvY2spIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2hvd0J1dHRvbjogQmFubmVyQnV0dG9uQXR0cnMgPSB7XG5cdFx0XHRsYWJlbDogXCJzaG93QmxvY2tlZENvbnRlbnRfYWN0aW9uXCIsXG5cdFx0XHRjbGljazogKCkgPT4gYXR0cnMudmlld01vZGVsLnNldENvbnRlbnRCbG9ja2luZ1N0YXR1cyhDb250ZW50QmxvY2tpbmdTdGF0dXMuU2hvdyksXG5cdFx0fVxuXHRcdGNvbnN0IGFsd2F5c09yTmV2ZXJBbGxvd0J1dHRvbnMgPSBhdHRycy52aWV3TW9kZWwuY2FuUGVyc2lzdEJsb2NraW5nU3RhdHVzKClcblx0XHRcdD8gW1xuXHRcdFx0XHRcdGF0dHJzLnZpZXdNb2RlbC5jaGVja01haWxBdXRoZW50aWNhdGlvblN0YXR1cyhNYWlsQXV0aGVudGljYXRpb25TdGF0dXMuQVVUSEVOVElDQVRFRClcblx0XHRcdFx0XHRcdD8ge1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImFsbG93RXh0ZXJuYWxDb250ZW50U2VuZGVyX2FjdGlvblwiIGFzIGNvbnN0LFxuXHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBhdHRycy52aWV3TW9kZWwuc2V0Q29udGVudEJsb2NraW5nU3RhdHVzKENvbnRlbnRCbG9ja2luZ1N0YXR1cy5BbHdheXNTaG93KSxcblx0XHRcdFx0XHRcdCAgfVxuXHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImJsb2NrRXh0ZXJuYWxDb250ZW50U2VuZGVyX2FjdGlvblwiIGFzIGNvbnN0LFxuXHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IGF0dHJzLnZpZXdNb2RlbC5zZXRDb250ZW50QmxvY2tpbmdTdGF0dXMoQ29udGVudEJsb2NraW5nU3RhdHVzLkFsd2F5c0Jsb2NrKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0ICBdLmZpbHRlcihpc05vdE51bGwpXG5cdFx0XHQ6IFtdXG5cdFx0Ly8gb24gbmFycm93IHNjcmVlbnMgdGhlIGJ1dHRvbnMgd2lsbCBlbmQgdXAgb24gMiBsaW5lcyBpZiB0aGVyZSBhcmUgdG9vIG1hbnksIHRoaXMgbG9va3MgYmFkLlxuXHRcdGNvbnN0IG1heWJlRHJvcGRvd25CdXR0b25zOiBSZWFkb25seUFycmF5PEJhbm5lckJ1dHRvbkF0dHJzPiA9XG5cdFx0XHRzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSAmJiBhbHdheXNPck5ldmVyQWxsb3dCdXR0b25zLmxlbmd0aCA+IDFcblx0XHRcdFx0PyBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxhYmVsOiBcIm1vcmVfbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0Y2xpY2s6IGNyZWF0ZUFzeW5jRHJvcGRvd24oe1xuXHRcdFx0XHRcdFx0XHRcdHdpZHRoOiAyMTYsXG5cdFx0XHRcdFx0XHRcdFx0bGF6eUJ1dHRvbnM6IGFzeW5jICgpID0+IHJlc29sdmVNYXliZUxhenkoYWx3YXlzT3JOZXZlckFsbG93QnV0dG9ucyksXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0ICBdXG5cdFx0XHRcdDogYWx3YXlzT3JOZXZlckFsbG93QnV0dG9uc1xuXHRcdHJldHVybiBtKEluZm9CYW5uZXIsIHtcblx0XHRcdG1lc3NhZ2U6IFwiY29udGVudEJsb2NrZWRfbXNnXCIsXG5cdFx0XHRpY29uOiBJY29ucy5QaWN0dXJlLFxuXHRcdFx0aGVscExpbms6IGNhblNlZVR1dGFMaW5rcyhhdHRycy52aWV3TW9kZWwubG9naW5zKSA/IEluZm9MaW5rLkxvYWRJbWFnZXMgOiBudWxsLFxuXHRcdFx0YnV0dG9uczogW3Nob3dCdXR0b24sIC4uLm1heWJlRHJvcGRvd25CdXR0b25zXSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBtb3JlQnV0dG9uKGF0dHJzOiBNYWlsVmlld2VySGVhZGVyQXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwibW9yZV9sYWJlbFwiLFxuXHRcdFx0aWNvbjogSWNvbnMuTW9yZSxcblx0XHRcdGNsaWNrOiB0aGlzLnByZXBhcmVNb3JlQWN0aW9ucyhhdHRycyksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcHJlcGFyZU1vcmVBY3Rpb25zKHsgdmlld01vZGVsIH06IE1haWxWaWV3ZXJIZWFkZXJBdHRycykge1xuXHRcdHJldHVybiBjcmVhdGVEcm9wZG93bih7XG5cdFx0XHRsYXp5QnV0dG9uczogKCkgPT4ge1xuXHRcdFx0XHRsZXQgYWN0aW9uQnV0dG9uczogRHJvcGRvd25CdXR0b25BdHRyc1tdID0gW11cblx0XHRcdFx0aWYgKHZpZXdNb2RlbC5pc0RyYWZ0TWFpbCgpKSB7XG5cdFx0XHRcdFx0YWN0aW9uQnV0dG9ucy5wdXNoKHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImVkaXRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4gZWRpdERyYWZ0KHZpZXdNb2RlbCksXG5cdFx0XHRcdFx0XHRpY29uOiBJY29ucy5FZGl0LFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0YWN0aW9uQnV0dG9ucy5wdXNoKHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcIm1vdmVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRjbGljazogKF86IE1vdXNlRXZlbnQsIGRvbTogSFRNTEVsZW1lbnQpID0+XG5cdFx0XHRcdFx0XHRcdHNob3dNb3ZlTWFpbHNEcm9wZG93bih2aWV3TW9kZWwubWFpbGJveE1vZGVsLCB2aWV3TW9kZWwubWFpbE1vZGVsLCBkb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIFt2aWV3TW9kZWwubWFpbF0pLFxuXHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuRm9sZGVyLFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0YWN0aW9uQnV0dG9ucy5wdXNoKHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImRlbGV0ZV9hY3Rpb25cIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBwcm9tcHRBbmREZWxldGVNYWlscyh2aWV3TW9kZWwubWFpbE1vZGVsLCBbdmlld01vZGVsLm1haWxdLCBub09wKSxcblx0XHRcdFx0XHRcdGljb246IEljb25zLlRyYXNoLFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aWYgKHZpZXdNb2RlbC5jYW5Gb3J3YXJkT3JNb3ZlKCkpIHtcblx0XHRcdFx0XHRcdGFjdGlvbkJ1dHRvbnMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdGxhYmVsOiBcInJlcGx5X2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4gdmlld01vZGVsLnJlcGx5KGZhbHNlKSxcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuUmVwbHksXG5cdFx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdFx0XHRpZiAodmlld01vZGVsLmNhblJlcGx5QWxsKCkpIHtcblx0XHRcdFx0XHRcdFx0YWN0aW9uQnV0dG9ucy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJyZXBseUFsbF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4gdmlld01vZGVsLnJlcGx5KHRydWUpLFxuXHRcdFx0XHRcdFx0XHRcdGljb246IEljb25zLlJlcGx5QWxsLFxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRhY3Rpb25CdXR0b25zLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogXCJmb3J3YXJkX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4gdmlld01vZGVsLmZvcndhcmQoKSxcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuRm9yd2FyZCxcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRhY3Rpb25CdXR0b25zLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogXCJtb3ZlX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRjbGljazogKF86IE1vdXNlRXZlbnQsIGRvbTogSFRNTEVsZW1lbnQpID0+XG5cdFx0XHRcdFx0XHRcdFx0c2hvd01vdmVNYWlsc0Ryb3Bkb3duKHZpZXdNb2RlbC5tYWlsYm94TW9kZWwsIHZpZXdNb2RlbC5tYWlsTW9kZWwsIGRvbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSwgW3ZpZXdNb2RlbC5tYWlsXSksXG5cdFx0XHRcdFx0XHRcdGljb246IEljb25zLkZvbGRlcixcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmICh2aWV3TW9kZWwubWFpbE1vZGVsLmNhbkFzc2lnbkxhYmVscygpKSB7XG5cdFx0XHRcdFx0XHRhY3Rpb25CdXR0b25zLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogXCJhc3NpZ25MYWJlbF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0Y2xpY2s6IChfLCBkb20pID0+IHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBwb3B1cCA9IG5ldyBMYWJlbHNQb3B1cChcblx0XHRcdFx0XHRcdFx0XHRcdGRvbSxcblx0XHRcdFx0XHRcdFx0XHRcdGRvbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcblx0XHRcdFx0XHRcdFx0XHRcdHN0eWxlcy5pc0Rlc2t0b3BMYXlvdXQoKSA/IDMwMCA6IDIwMCxcblx0XHRcdFx0XHRcdFx0XHRcdHZpZXdNb2RlbC5tYWlsTW9kZWwuZ2V0TGFiZWxzRm9yTWFpbHMoW3ZpZXdNb2RlbC5tYWlsXSksXG5cdFx0XHRcdFx0XHRcdFx0XHR2aWV3TW9kZWwubWFpbE1vZGVsLmdldExhYmVsU3RhdGVzRm9yTWFpbHMoW3ZpZXdNb2RlbC5tYWlsXSksXG5cdFx0XHRcdFx0XHRcdFx0XHQoYWRkZWRMYWJlbHMsIHJlbW92ZWRMYWJlbHMpID0+IHZpZXdNb2RlbC5tYWlsTW9kZWwuYXBwbHlMYWJlbHMoW3ZpZXdNb2RlbC5tYWlsXSwgYWRkZWRMYWJlbHMsIHJlbW92ZWRMYWJlbHMpLFxuXHRcdFx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdFx0XHQvLyB3YWl0aW5nIGZvciB0aGUgZHJvcGRvd24gdG8gYmUgY2xvc2VkXG5cdFx0XHRcdFx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRwb3B1cC5zaG93KClcblx0XHRcdFx0XHRcdFx0XHR9LCAxNilcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuTGFiZWwsXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGFjdGlvbkJ1dHRvbnMucHVzaCh7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJkZWxldGVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4gcHJvbXB0QW5kRGVsZXRlTWFpbHModmlld01vZGVsLm1haWxNb2RlbCwgW3ZpZXdNb2RlbC5tYWlsXSwgbm9PcCksXG5cdFx0XHRcdFx0XHRpY29uOiBJY29ucy5UcmFzaCxcblx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdFx0YWN0aW9uQnV0dG9ucy5wdXNoKC4uLm1haWxWaWV3ZXJNb3JlQWN0aW9ucyh2aWV3TW9kZWwpKVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGFjdGlvbkJ1dHRvbnNcblx0XHRcdH0sXG5cdFx0XHR3aWR0aDogMzAwLFxuXHRcdH0pXG5cdH1cblxuXHRnZXRSZWNpcGllbnRFbWFpbEFkZHJlc3MoeyB2aWV3TW9kZWwgfTogTWFpbFZpZXdlckhlYWRlckF0dHJzKSB7XG5cdFx0Y29uc3QgcmVsZXZhbnRSZWNpcGllbnQgPSB2aWV3TW9kZWwuZ2V0UmVsZXZhbnRSZWNpcGllbnQoKVxuXG5cdFx0aWYgKHJlbGV2YW50UmVjaXBpZW50KSB7XG5cdFx0XHRjb25zdCBudW1iZXJPZkFsbFJlY2lwaWVudHMgPSB2aWV3TW9kZWwuZ2V0TnVtYmVyT2ZSZWNpcGllbnRzKClcblx0XHRcdHJldHVybiBtKFxuXHRcdFx0XHRcIi5mbGV4LmNsaWNrLnNtYWxsLm1sLWJldHdlZW4tcy5pdGVtcy1jZW50ZXJcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHQvLyB1c2UgdGhpcyB0byBhbGxvdyB0aGUgY29udGFpbmVyIHRvIHNocmluaywgb3RoZXJ3aXNlIGl0IGRvZXNuJ3Qgd2FudCB0byBjdXQgdGhlIHJlY2lwaWVudCBhZGRyZXNzXG5cdFx0XHRcdFx0XHRtaW5XaWR0aDogXCIyMHB4XCIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdG0oXCJcIiwgbGFuZy5nZXQoXCJtYWlsVmlld2VyUmVjaXBpZW50c19sYWJlbFwiKSksXG5cdFx0XHRcdFx0bShcIi50ZXh0LWVsbGlwc2lzXCIsIHJlbGV2YW50UmVjaXBpZW50LmFkZHJlc3MpLFxuXHRcdFx0XHRcdG0oXCIuZmxleC5uby13cmFwXCIsIFtcblx0XHRcdFx0XHRcdG51bWJlck9mQWxsUmVjaXBpZW50cyA+IDEgPyBgKyAke251bWJlck9mQWxsUmVjaXBpZW50cyAtIDF9YCA6IG51bGwsXG5cdFx0XHRcdFx0XHRtKEljb24sIHtcblx0XHRcdFx0XHRcdFx0aWNvbjogQm9vdEljb25zLkV4cGFuZCxcblx0XHRcdFx0XHRcdFx0Y29udGFpbmVyOiBcImRpdlwiLFxuXHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdGZpbGw6IHRoZW1lLmNvbnRlbnRfZmcsXG5cdFx0XHRcdFx0XHRcdFx0dHJhbnNmb3JtOiB0aGlzLmRldGFpbHNFeHBhbmRlZCA/IFwicm90YXRlKDE4MGRlZylcIiA6IFwiXCIsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XSxcblx0XHRcdClcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwiXCJcblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCB7IHB4LCBzaXplIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc2l6ZVwiXG5pbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IHdpbmRvd0ZhY2FkZSwgd2luZG93U2l6ZUxpc3RlbmVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL1dpbmRvd0ZhY2FkZVwiXG5pbXBvcnQgeyBGZWF0dXJlVHlwZSwgSW5ib3hSdWxlVHlwZSwgS2V5cywgTWFpbFNldEtpbmQsIFNwYW1SdWxlRmllbGRUeXBlLCBTcGFtUnVsZVR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgRmlsZSBhcyBUdXRhbm90YUZpbGUsIE1haWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IGFzc2VydE5vbk51bGwsIGFzc2VydE5vdE51bGwsIGRlZmVyLCBEZWZlcnJlZE9iamVjdCwgbm9PcCwgb2ZDbGFzcyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgSWNvbk1lc3NhZ2VCb3ggfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0NvbHVtbkVtcHR5TWVzc2FnZUJveFwiXG5pbXBvcnQgdHlwZSB7IFNob3J0Y3V0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0tleU1hbmFnZXJcIlxuaW1wb3J0IHsga2V5TWFuYWdlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9LZXlNYW5hZ2VyXCJcbmltcG9ydCB7IEljb24sIHByb2dyZXNzSWNvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvblwiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS90aGVtZVwiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50RGV0ZWN0b3JcIlxuaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc3R5bGVzXCJcbmltcG9ydCB7IERyb3Bkb3duQnV0dG9uQXR0cnMsIHNob3dEcm9wZG93bkF0UG9zaXRpb24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0Ryb3Bkb3duLmpzXCJcbmltcG9ydCB7IGlzVHV0YW5vdGFUZWFtTWFpbCwgcmVwbGFjZUNpZHNXaXRoSW5saW5lSW1hZ2VzIH0gZnJvbSBcIi4vTWFpbEd1aVV0aWxzXCJcbmltcG9ydCB7IGdldENvb3Jkc09mTW91c2VPclRvdWNoRXZlbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0d1aVV0aWxzXCJcbmltcG9ydCB7IGNvcHlUb0NsaXBib2FyZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9DbGlwYm9hcmRVdGlsc1wiXG5pbXBvcnQgeyBDb250ZW50QmxvY2tpbmdTdGF0dXMsIE1haWxWaWV3ZXJWaWV3TW9kZWwgfSBmcm9tIFwiLi9NYWlsVmlld2VyVmlld01vZGVsXCJcbmltcG9ydCB7IGNyZWF0ZUVtYWlsU2VuZGVyTGlzdEVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgVXNlckVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Vc2VyRXJyb3JcIlxuaW1wb3J0IHsgc2hvd1VzZXJFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9FcnJvckhhbmRsZXJJbXBsXCJcbmltcG9ydCB7IGlzTmV3TWFpbEFjdGlvbkF2YWlsYWJsZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL25hdi9OYXZGdW5jdGlvbnNcIlxuaW1wb3J0IHsgQ2FuY2VsbGVkRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvQ2FuY2VsbGVkRXJyb3JcIlxuaW1wb3J0IHsgTWFpbFZpZXdlckhlYWRlciB9IGZyb20gXCIuL01haWxWaWV3ZXJIZWFkZXIuanNcIlxuaW1wb3J0IHsgZWRpdERyYWZ0LCBzaG93SGVhZGVyRGlhbG9nLCBzaG93U291cmNlRGlhbG9nIH0gZnJvbSBcIi4vTWFpbFZpZXdlclV0aWxzLmpzXCJcbmltcG9ydCB7IFRvZ2dsZUJ1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvYnV0dG9ucy9Ub2dnbGVCdXR0b24uanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBQaW5jaFpvb20gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9QaW5jaFpvb20uanNcIlxuaW1wb3J0IHsgcmVzcG9uc2l2ZUNhcmRITWFyZ2luLCByZXNwb25zaXZlQ2FyZEhQYWRkaW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvY2FyZHMuanNcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2cuanNcIlxuaW1wb3J0IHsgY3JlYXRlTmV3Q29udGFjdCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvU2hhcmVkTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IGdldEV4aXN0aW5nUnVsZUZvclR5cGUgfSBmcm9tIFwiLi4vbW9kZWwvTWFpbFV0aWxzLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbnR5cGUgTWFpbEFkZHJlc3NBbmROYW1lID0ge1xuXHRuYW1lOiBzdHJpbmdcblx0YWRkcmVzczogc3RyaW5nXG59XG5cbmV4cG9ydCB0eXBlIE1haWxWaWV3ZXJBdHRycyA9IHtcblx0dmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsXG5cdGlzUHJpbWFyeTogYm9vbGVhblxuXHQvKipcblx0ICogTWFpbCBib2R5IG1pZ2h0IGNvbnRhaW4gYmxvY2txdW90ZXMgdGhhdCB3ZSB3YW50IHRvIGNvbGxhcHNlIGluIHNvbWUgY2FzZXMgKGUuZy4gdGhlIHRocmVhZCBpcyB2aXNpYmxlIGluIGNvbnZlcnNhdGlvbiBhbnl3YXkpIG9yIGV4cGFuZCBpbiBvdGhlclxuXHQgKiBjYXNlcyAoZS5nLiBpZiBpdCdzIGEgc2luZ2xlL3RoZSBmaXJzdCBlbWFpbCBpbiB0aGUgY29udmVyc2F0aW9uKS5cblx0ICpcblx0ICovXG5cdGRlZmF1bHRRdW90ZUJlaGF2aW9yOiBcImNvbGxhcHNlXCIgfCBcImV4cGFuZFwiXG59XG5cbi8qKlxuICogVGhlIE1haWxWaWV3ZXIgZGlzcGxheXMgYSBtYWlsLiBUaGUgbWFpbCBib2R5IGlzIGxvYWRlZCBhc3luY2hyb25vdXNseS5cbiAqXG4gKiBUaGUgdmlld2VyIGhhcyBhIGxvbmdlciBsaWZlY3ljbGUgdGhhbiB2aWV3TW9kZWwgc28gd2UgbmVlZCB0byBiZSBjYXJlZnVsIGFib3V0IHRoZSBzdGF0ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIE1haWxWaWV3ZXIgaW1wbGVtZW50cyBDb21wb25lbnQ8TWFpbFZpZXdlckF0dHJzPiB7XG5cdC8qKiBpdCBpcyBzZXQgYWZ0ZXIgd2UgbWVhc3VyZWQgbWFpbCBib2R5IGVsZW1lbnQgKi9cblx0cHJpdmF0ZSBib2R5TGluZUhlaWdodDogbnVtYmVyIHwgbnVsbCA9IG51bGxcblxuXHQvKipcblx0ICogRGVsYXkgdGhlIGRpc3BsYXkgb2YgdGhlIHByb2dyZXNzIHNwaW5uZXIgaW4gbWFpbiBib2R5IHZpZXcgZm9yIGEgc2hvcnQgdGltZSB0byBzdXBwcmVzcyBpdCB3aGVuIHdlIGFyZSBzd2l0Y2hpbmcgYmV0d2VlbiBjYWNoZWQgZW1haWxzXG5cdCAqIGFuZCB3ZSBhcmUganVzdCBzYW5pdGl6aW5nXG5cdCAqL1xuXHRwcml2YXRlIGRlbGF5UHJvZ3Jlc3NTcGlubmVyID0gdHJ1ZVxuXG5cdHByaXZhdGUgcmVhZG9ubHkgcmVzaXplTGlzdGVuZXI6IHdpbmRvd1NpemVMaXN0ZW5lclxuXHRwcml2YXRlIHJlc2l6ZU9ic2VydmVyVmlld3BvcnQ6IFJlc2l6ZU9ic2VydmVyIHwgbnVsbCA9IG51bGwgLy8gbmVlZGVkIHRvIGRldGVjdCBvcmllbnRhdGlvbiBjaGFuZ2UgdG8gcmVjcmVhdGUgcGluY2h6b29tIGF0IHRoZSByaWdodCB0aW1lXG5cdHByaXZhdGUgcmVzaXplT2JzZXJ2ZXJab29tYWJsZTogUmVzaXplT2JzZXJ2ZXIgfCBudWxsID0gbnVsbCAvLyBuZWVkZWQgdG8gcmVjcmVhdGUgcGluY2h6b29tIGUuZy4gd2hlbiBsb2FkaW5nIGltYWdlc1xuXG5cdHByaXZhdGUgdmlld01vZGVsITogTWFpbFZpZXdlclZpZXdNb2RlbFxuXHRwcml2YXRlIHBpbmNoWm9vbWFibGU6IFBpbmNoWm9vbSB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgcmVhZG9ubHkgc2hvcnRjdXRzOiBBcnJheTxTaG9ydGN1dD5cblxuXHRwcml2YXRlIHNjcm9sbERvbTogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXG5cdHByaXZhdGUgZG9tQm9keURlZmVycmVkOiBEZWZlcnJlZE9iamVjdDxIVE1MRWxlbWVudD4gPSBkZWZlcigpXG5cdHByaXZhdGUgZG9tQm9keTogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXG5cdHByaXZhdGUgc2hhZG93RG9tUm9vdDogU2hhZG93Um9vdCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgc2hhZG93RG9tTWFpbENvbnRlbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBjdXJyZW50bHlSZW5kZXJlZE1haWxCb2R5OiBEb2N1bWVudEZyYWdtZW50IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBsYXN0Q29udGVudEJsb2NraW5nU3RhdHVzOiBDb250ZW50QmxvY2tpbmdTdGF0dXMgfCBudWxsID0gbnVsbFxuXG5cdHByaXZhdGUgbG9hZEFsbExpc3RlbmVyID0gc3RyZWFtKClcblx0LyoqIGZvciBibG9jayBxdW90ZXMgaW4gbWFpbCBib2RpZXMsIHdoZXRoZXIgdG8gZGlzcGxheSBxdW90ZSBiZWZvcmUgdXNlciBpbnRlcmFjdGlvblxuXHQgKiBpcyBcIm5vbmVcIiB1bnRpbCB3ZSByZW5kZXIgb25jZSAqL1xuXHRwcml2YXRlIGN1cnJlbnRRdW90ZUJlaGF2aW9yOiBcIm5vbmVcIiB8IFwiY29sbGFwc2VcIiB8IFwiZXhwYW5kXCIgPSBcIm5vbmVcIlxuXHQvKiogZm9yIGJsb2NrIHF1b3RlcyBpbiBtYWlsIGJvZGllcywgd2hldGhlciB0byBkaXNwbGF5IHBsYWNlaG9sZGVyIG9yIG9yaWdpbmFsIHF1b3RlICovXG5cdHByaXZhdGUgcXVvdGVTdGF0ZTogXCJub3F1b3Rlc1wiIHwgXCJ1bnNldFwiIHwgXCJjb2xsYXBzZWRcIiB8IFwiZXhwYW5kZWRcIiA9IFwidW5zZXRcIlxuXG5cdC8qKiBtb3N0IHJlY2VudCByZXNpemUgYW5pbWF0aW9uIGZyYW1lIHJlcXVlc3QgSUQgKi9cblx0cHJpdmF0ZSByZXNpemVSYWY6IG51bWJlciB8IHVuZGVmaW5lZFxuXG5cdGNvbnN0cnVjdG9yKHZub2RlOiBWbm9kZTxNYWlsVmlld2VyQXR0cnM+KSB7XG5cdFx0dGhpcy5zZXRWaWV3TW9kZWwodm5vZGUuYXR0cnMudmlld01vZGVsLCB2bm9kZS5hdHRycy5pc1ByaW1hcnkpXG5cblx0XHR0aGlzLnJlc2l6ZUxpc3RlbmVyID0gKCkgPT4gdGhpcy5kb21Cb2R5RGVmZXJyZWQucHJvbWlzZS50aGVuKChkb20pID0+IHRoaXMudXBkYXRlTGluZUhlaWdodChkb20pKVxuXG5cdFx0dGhpcy5zaG9ydGN1dHMgPSB0aGlzLnNldHVwU2hvcnRjdXRzKHZub2RlLmF0dHJzKVxuXHR9XG5cblx0b25jcmVhdGUoeyBhdHRycyB9OiBWbm9kZTxNYWlsVmlld2VyQXR0cnM+KSB7XG5cdFx0aWYgKGF0dHJzLmlzUHJpbWFyeSkge1xuXHRcdFx0a2V5TWFuYWdlci5yZWdpc3RlclNob3J0Y3V0cyh0aGlzLnNob3J0Y3V0cylcblx0XHR9XG5cdFx0d2luZG93RmFjYWRlLmFkZFJlc2l6ZUxpc3RlbmVyKHRoaXMucmVzaXplTGlzdGVuZXIpXG5cdH1cblxuXHRvbnJlbW92ZSh7IGF0dHJzIH06IFZub2RlPE1haWxWaWV3ZXJBdHRycz4pIHtcblx0XHR3aW5kb3dGYWNhZGUucmVtb3ZlUmVzaXplTGlzdGVuZXIodGhpcy5yZXNpemVMaXN0ZW5lcilcblx0XHRpZiAodGhpcy5yZXNpemVPYnNlcnZlclpvb21hYmxlKSB7XG5cdFx0XHR0aGlzLnJlc2l6ZU9ic2VydmVyWm9vbWFibGUuZGlzY29ubmVjdCgpXG5cdFx0fVxuXHRcdGlmICh0aGlzLnJlc2l6ZU9ic2VydmVyVmlld3BvcnQpIHtcblx0XHRcdHRoaXMucmVzaXplT2JzZXJ2ZXJWaWV3cG9ydC5kaXNjb25uZWN0KClcblx0XHR9XG5cdFx0dGhpcy5waW5jaFpvb21hYmxlPy5yZW1vdmUoKSAvLyByZW1vdmUgdGhlIGxpc3RlbmVyc1xuXHRcdHRoaXMuY2xlYXJEb21Cb2R5KClcblx0XHRpZiAoYXR0cnMuaXNQcmltYXJ5KSB7XG5cdFx0XHRrZXlNYW5hZ2VyLnVucmVnaXN0ZXJTaG9ydGN1dHModGhpcy5zaG9ydGN1dHMpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBzZXRWaWV3TW9kZWwodmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsLCBpc1ByaW1hcnk6IGJvb2xlYW4pIHtcblx0XHQvLyBGaWd1cmluZyBvdXQgd2hldGhlciB3ZSBoYXZlIGEgbmV3IGVtYWlsIGFzc2lnbmVkLlxuXHRcdGNvbnN0IG9sZFZpZXdNb2RlbCA9IHRoaXMudmlld01vZGVsXG5cdFx0dGhpcy52aWV3TW9kZWwgPSB2aWV3TW9kZWxcblx0XHRpZiAodGhpcy52aWV3TW9kZWwgIT09IG9sZFZpZXdNb2RlbCkge1xuXHRcdFx0dGhpcy5sb2FkQWxsTGlzdGVuZXIuZW5kKHRydWUpXG5cdFx0XHR0aGlzLmxvYWRBbGxMaXN0ZW5lciA9IHRoaXMudmlld01vZGVsLmxvYWRDb21wbGV0ZU5vdGlmaWNhdGlvbi5tYXAoYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHQvLyBzdHJlYW1zIGFyZSBwcmV0dHkgbXVjaCBzeW5jaHJvbm91cywgc28gd2UgY291bGQgYmUgaW4gdGhlIG1pZGRsZSBvZiBhIHJlZHJhdyBoZXJlIGFuZCBtaXRocmlsIGRvZXMgbm90IGp1c3Qgc2NoZWR1bGUgYW5vdGhlciByZWRyYXcsIGl0XG5cdFx0XHRcdC8vIHdpbGwgZXJyb3Igb3V0IHNvIGJlZm9yZSBjYWxsaW5nIG0ucmVkcmF3LnN5bmMoKSB3ZSB3YW50IHRvIG1ha2Ugc3VyZSB0aGF0IHdlIGFyZSBub3QgaW5zaWRlIGEgcmVkcmF3IGJ5IGp1c3Qgc2NoZWR1bGluZyBhIG1pY3JvdGFzayB3aXRoXG5cdFx0XHRcdC8vIHRoaXMgc2ltcGxlIGF3YWl0LlxuXHRcdFx0XHRhd2FpdCBQcm9taXNlLnJlc29sdmUoKVxuXHRcdFx0XHQvLyBXYWl0IGZvciBtYWlsIGJvZHkgdG8gYmUgcmVkcmF3biBiZWZvcmUgcmVwbGFjaW5nIGltYWdlc1xuXHRcdFx0XHRtLnJlZHJhdy5zeW5jKClcblx0XHRcdFx0YXdhaXQgdGhpcy5yZXBsYWNlSW5saW5lSW1hZ2VzKClcblx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0fSlcblxuXHRcdFx0dGhpcy5sYXN0Q29udGVudEJsb2NraW5nU3RhdHVzID0gbnVsbFxuXHRcdFx0dGhpcy5kZWxheVByb2dyZXNzU3Bpbm5lciA9IHRydWVcblx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmRlbGF5UHJvZ3Jlc3NTcGlubmVyID0gZmFsc2Vcblx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0fSwgNTApXG5cdFx0fVxuXHR9XG5cblx0dmlldyh2bm9kZTogVm5vZGU8TWFpbFZpZXdlckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHR0aGlzLmhhbmRsZUNvbnRlbnRCbG9ja2luZ09uUmVuZGVyKClcblxuXHRcdHJldHVybiBbXG5cdFx0XHRtKFwiLm1haWwtdmlld2VyLm92ZXJmbG93LXgtaGlkZGVuXCIsIFtcblx0XHRcdFx0dGhpcy5yZW5kZXJNYWlsSGVhZGVyKHZub2RlLmF0dHJzKSxcblx0XHRcdFx0dGhpcy5yZW5kZXJNYWlsU3ViamVjdCh2bm9kZS5hdHRycyksXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIuZmxleC1ncm93LnNjcm9sbC14LnB0LnBiLmJvcmRlci1yYWRpdXMtYmlnXCIgKyAodGhpcy52aWV3TW9kZWwuaXNDb250cmFzdEZpeE5lZWRlZCgpID8gXCIuYmctd2hpdGUuY29udGVudC1ibGFja1wiIDogXCIgXCIpLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNsYXNzOiByZXNwb25zaXZlQ2FyZEhQYWRkaW5nKCksXG5cdFx0XHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc2Nyb2xsRG9tID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0dGhpcy5yZW5kZXJNYWlsQm9keVNlY3Rpb24odm5vZGUuYXR0cnMpLFxuXHRcdFx0XHQpLFxuXHRcdFx0XHR0aGlzLnJlbmRlclF1b3RlRXhwYW5kZXJCdXR0b24oKSxcblx0XHRcdF0pLFxuXHRcdF1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTWFpbFN1YmplY3QoYXR0cnM6IE1haWxWaWV3ZXJBdHRycykge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0XCJoNC5mb250LXdlaWdodC02MDAubXQubWIudGV4dC1icmVhay5zZWxlY3RhYmxlLlwiICsgcmVzcG9uc2l2ZUNhcmRITWFyZ2luKCksXG5cdFx0XHR7XG5cdFx0XHRcdFwiZGF0YS10ZXN0aWRcIjogYGg6JHtsYW5nLmdldFRlc3RJZChcInN1YmplY3RfbGFiZWxcIil9YCxcblx0XHRcdH0sXG5cdFx0XHRhdHRycy52aWV3TW9kZWwuZ2V0U3ViamVjdCgpLFxuXHRcdClcblx0fVxuXG5cdC8qKlxuXHQgKiBpbXBvcnRhbnQ6IG11c3QgYmUgY2FsbGVkIGFmdGVyIHJlbmRlcmluZyB0aGUgbWFpbCBib2R5IHBhcnQgc28gdGhhdCB7QGxpbmsgcXVvdGVTdGF0ZX0gaXMgc2V0IGNvcnJlY3RseS5cblx0ICogVGhlIGxvZ2ljIGhlcmUgcmVsaWVzIG9uIHRoZSBmYWN0IHRoYXQgbGlmZWN5Y2xlIG1ldGhvZHMgd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgYm9keSBzZWN0aW9uIGxpZmVjeWNsZSBtZXRob2RzLlxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJRdW90ZUV4cGFuZGVyQnV0dG9uKCkge1xuXHRcdGNvbnN0IGJ1dHRvbkhlaWdodCA9IDI0XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5hYnMuZmxleC5qdXN0aWZ5LWNlbnRlci5mdWxsLXdpZHRoXCIsXG5cdFx0XHR7XG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0Ly8gKzEgZm9yIHRoZSBib3JkZXJcblx0XHRcdFx0XHRib3R0b206IHB4KC0oYnV0dG9uSGVpZ2h0IC8gMiArIDEpKSxcblx0XHRcdFx0XHRkaXNwbGF5OiBcImhpZGRlblwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmNyZWF0ZTogKHsgZG9tIH0pID0+IHtcblx0XHRcdFx0XHQ7KGRvbSBhcyBIVE1MRWxlbWVudCkuc3R5bGUuZGlzcGxheSA9IHRoaXMucXVvdGVTdGF0ZSA9PT0gXCJub3F1b3Rlc1wiID8gXCJub25lXCIgOiBcIlwiXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9udXBkYXRlOiAoeyBkb20gfSkgPT4ge1xuXHRcdFx0XHRcdDsoZG9tIGFzIEhUTUxFbGVtZW50KS5zdHlsZS5kaXNwbGF5ID0gdGhpcy5xdW90ZVN0YXRlID09PSBcIm5vcXVvdGVzXCIgPyBcIm5vbmVcIiA6IFwiXCJcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRtKFxuXHRcdFx0XHQvLyBuZWVkcyBmbGV4IGZvciBjb3JyZWN0IGhlaWdodFxuXHRcdFx0XHRcIi5mbGV4XCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0Ym9yZGVyUmFkaXVzOiBcIjI1JVwiLFxuXHRcdFx0XHRcdFx0Ym9yZGVyOiBgMXB4IHNvbGlkICR7dGhlbWUubGlzdF9ib3JkZXJ9YCxcblx0XHRcdFx0XHRcdGJhY2tncm91bmRDb2xvcjogdGhlbWUuY29udGVudF9iZyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtKFRvZ2dsZUJ1dHRvbiwge1xuXHRcdFx0XHRcdGljb246IEljb25zLk1vcmUsXG5cdFx0XHRcdFx0dGl0bGU6IFwic2hvd1RleHRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0dG9nZ2xlZDogdGhpcy5zaG91bGREaXNwbGF5Q29sbGFwc2VkUXVvdGVzKCksXG5cdFx0XHRcdFx0b25Ub2dnbGVkOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHR0aGlzLnF1b3RlU3RhdGUgPSB0aGlzLnNob3VsZERpc3BsYXlDb2xsYXBzZWRRdW90ZXMoKSA/IFwiY29sbGFwc2VkXCIgOiBcImV4cGFuZGVkXCJcblx0XHRcdFx0XHRcdGlmICh0aGlzLnNoYWRvd0RvbVJvb3QpIHRoaXMudXBkYXRlQ29sbGFwc2VkUXVvdGVzKHRoaXMuc2hhZG93RG9tUm9vdCwgdGhpcy5zaG91bGREaXNwbGF5Q29sbGFwc2VkUXVvdGVzKCkpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0aGVpZ2h0OiBcIjI0cHhcIixcblx0XHRcdFx0XHRcdHdpZHRoOiBweChzaXplLmJ1dHRvbl9oZWlnaHRfY29tcGFjdCksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSksXG5cdFx0XHQpLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlQ29udGVudEJsb2NraW5nT25SZW5kZXIoKSB7XG5cdFx0aWYgKHRoaXMubGFzdENvbnRlbnRCbG9ja2luZ1N0YXR1cyAhPSBudWxsICYmIHRoaXMudmlld01vZGVsLmdldENvbnRlbnRCbG9ja2luZ1N0YXR1cygpICE9IHRoaXMubGFzdENvbnRlbnRCbG9ja2luZ1N0YXR1cykge1xuXHRcdFx0UHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyAoKSA9PiB7XG5cdFx0XHRcdC8vIFdhaXQgZm9yIG5ldyBtYWlsIGJvZHkgdG8gYmUgcmVuZGVyZWQgYmVmb3JlIHJlcGxhY2luZyBpbWFnZXMuIFByb2JhYmx5IG5vdCBuZWNlc3NhcnkgYW55bW9yZSBhcyB3ZSBhbHJlYWR5IHNjaGVkdWxlIGl0IGFmdGVyIHRoZSByZW5kZXJcblx0XHRcdFx0Ly8gYnV0IGJldHRlciBiZSBzYWZlLlxuXHRcdFx0XHRtLnJlZHJhdy5zeW5jKClcblx0XHRcdFx0YXdhaXQgdGhpcy5yZXBsYWNlSW5saW5lSW1hZ2VzKClcblx0XHRcdH0pXG5cdFx0fVxuXHRcdHRoaXMubGFzdENvbnRlbnRCbG9ja2luZ1N0YXR1cyA9IHRoaXMudmlld01vZGVsLmdldENvbnRlbnRCbG9ja2luZ1N0YXR1cygpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlck1haWxIZWFkZXIoYXR0cnM6IE1haWxWaWV3ZXJBdHRycykge1xuXHRcdHJldHVybiBtKE1haWxWaWV3ZXJIZWFkZXIsIHtcblx0XHRcdHZpZXdNb2RlbDogdGhpcy52aWV3TW9kZWwsXG5cdFx0XHRjcmVhdGVNYWlsQWRkcmVzc0NvbnRleHRCdXR0b25zOiB0aGlzLmNyZWF0ZU1haWxBZGRyZXNzQ29udGV4dEJ1dHRvbnMuYmluZCh0aGlzKSxcblx0XHRcdGlzUHJpbWFyeTogYXR0cnMuaXNQcmltYXJ5LFxuXHRcdFx0aW1wb3J0RmlsZTogKGZpbGU6IFR1dGFub3RhRmlsZSkgPT4gdGhpcy5oYW5kbGVBdHRhY2htZW50SW1wb3J0KGZpbGUpLFxuXHRcdH0pXG5cdH1cblxuXHRvbmJlZm9yZXVwZGF0ZSh2bm9kZTogVm5vZGU8TWFpbFZpZXdlckF0dHJzPik6IGJvb2xlYW4gfCB2b2lkIHtcblx0XHQvLyBTZXR0aW5nIHZpZXdNb2RlbCBoZXJlIHRvIGhhdmUgdmlld01vZGVsIHRoYXQgd2Ugd2lsbCB1c2UgZm9yIHJlbmRlciBhbHJlYWR5IGFuZCBiZSBhYmxlIHRvIG1ha2UgYSBkZWNpc2lvblxuXHRcdC8vIGFib3V0IHNraXBwaW5nIHJlbmRlcmluZ1xuXHRcdHRoaXMuc2V0Vmlld01vZGVsKHZub2RlLmF0dHJzLnZpZXdNb2RlbCwgdm5vZGUuYXR0cnMuaXNQcmltYXJ5KVxuXHRcdC8vIFdlIHNraXAgcmVuZGVyaW5nIHByb2dyZXNzIGluZGljYXRvciB3aGVuIHN3aXRjaGluZyBiZXR3ZWVuIGVtYWlscy5cblx0XHQvLyBIb3dldmVyIGlmIHdlIGFscmVhZHkgbG9hZGVkIHRoZSBtYWlsIHRoZW4gd2UgY2FuIGp1c3QgcmVuZGVyIGl0LlxuXHRcdGNvbnN0IHNob3VsZFNraXBSZW5kZXIgPSB0aGlzLnZpZXdNb2RlbC5pc0xvYWRpbmcoKSAmJiB0aGlzLmRlbGF5UHJvZ3Jlc3NTcGlubmVyXG5cdFx0cmV0dXJuICFzaG91bGRTa2lwUmVuZGVyXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlck1haWxCb2R5U2VjdGlvbihhdHRyczogTWFpbFZpZXdlckF0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdGlmICh0aGlzLnZpZXdNb2RlbC5kaWRFcnJvcnNPY2N1cigpKSB7XG5cdFx0XHRyZXR1cm4gbShJY29uTWVzc2FnZUJveCwge1xuXHRcdFx0XHRtZXNzYWdlOiBcImNvcnJ1cHRlZF9tc2dcIixcblx0XHRcdFx0aWNvbjogSWNvbnMuV2FybmluZyxcblx0XHRcdFx0Y29sb3I6IHRoZW1lLmNvbnRlbnRfbWVzc2FnZV9iZyxcblx0XHRcdH0pXG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2FuaXRpemVkTWFpbEJvZHkgPSB0aGlzLnZpZXdNb2RlbC5nZXRTYW5pdGl6ZWRNYWlsQm9keSgpXG5cblx0XHQvLyBEbyBub3QgcmVuZGVyIHByb2dyZXNzIHNwaW5uZXIgb3IgbWFpbCBib2R5IHdoaWxlIHdlIGFyZSBhbmltYXRpbmcuXG5cdFx0aWYgKHRoaXMudmlld01vZGVsLnNob3VsZERlbGF5UmVuZGVyaW5nKCkpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fSBlbHNlIGlmIChzYW5pdGl6ZWRNYWlsQm9keSAhPSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJNYWlsQm9keShzYW5pdGl6ZWRNYWlsQm9keSwgYXR0cnMpXG5cdFx0fSBlbHNlIGlmICh0aGlzLnZpZXdNb2RlbC5pc0xvYWRpbmcoKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyTG9hZGluZ0ljb24oKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBUaGUgYm9keSBmYWlsZWQgdG8gbG9hZCwganVzdCBzaG93IGJsYW5rIGJvZHkgYmVjYXVzZSB0aGVyZSBpcyBhIGJhbm5lclxuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlck1haWxCb2R5KHNhbml0aXplZE1haWxCb2R5OiBEb2N1bWVudEZyYWdtZW50LCBhdHRyczogTWFpbFZpZXdlckF0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFwiI21haWwtYm9keVwiLCB7XG5cdFx0XHQvLyBrZXkgdG8gYXZvaWQgbWl0aHJpbCByZXVzaW5nIHRoZSBkb20gZWxlbWVudCB3aGVuIGl0IHNob3VsZCBzd2l0Y2ggdGhlIHJlbmRlcmluZyB0aGUgbG9hZGluZyBzcGlubmVyXG5cdFx0XHRrZXk6IFwibWFpbEJvZHlcIixcblx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0Y29uc3QgZG9tID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdFx0XHRcdHRoaXMuc2V0RG9tQm9keShkb20pXG5cdFx0XHRcdHRoaXMudXBkYXRlTGluZUhlaWdodChkb20pXG5cdFx0XHRcdHRoaXMucmVuZGVyU2hhZG93TWFpbEJvZHkoc2FuaXRpemVkTWFpbEJvZHksIGF0dHJzLCB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpXG5cdFx0XHRcdGlmIChjbGllbnQuaXNNb2JpbGVEZXZpY2UoKSkge1xuXHRcdFx0XHRcdHRoaXMucmVzaXplT2JzZXJ2ZXJWaWV3cG9ydD8uZGlzY29ubmVjdCgpXG5cdFx0XHRcdFx0dGhpcy5yZXNpemVPYnNlcnZlclZpZXdwb3J0ID0gbmV3IFJlc2l6ZU9ic2VydmVyKChlbnRyaWVzKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5waW5jaFpvb21hYmxlKSB7XG5cdFx0XHRcdFx0XHRcdC8vIHJlY3JlYXRlIGlmIHRoZSBvcmllbnRhdGlvbiBvZiB0aGUgZGV2aWNlIGNoYW5nZXMgLT4gc2l6ZSBvZiB0aGUgdmlld3BvcnQgLyBtYWlsLWJvZHkgY2hhbmdlc1xuXHRcdFx0XHRcdFx0XHR0aGlzLmNyZWF0ZVBpbmNoWm9vbSh0aGlzLnBpbmNoWm9vbWFibGUuZ2V0Wm9vbWFibGUoKSwgdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50KVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0dGhpcy5yZXNpemVPYnNlcnZlclZpZXdwb3J0Lm9ic2VydmUodm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50KVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0b251cGRhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRjb25zdCBkb20gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0dGhpcy5zZXREb21Cb2R5KGRvbSlcblxuXHRcdFx0XHQvLyBPbmx5IG1lYXN1cmUgYW5kIHVwZGF0ZSBsaW5lIGhlaWdodCBvbmNlLlxuXHRcdFx0XHQvLyBCVVQgd2UgbmVlZCB0byBkbyBpbiBmcm9tIG9udXBkYXRlIHRvbyBpZiB3ZSBzd2FwIG1haWxWaWV3ZXIgYnV0IG1pdGhyaWwgZG9lcyBub3QgcmVhbGl6ZVxuXHRcdFx0XHQvLyB0aGF0IGl0J3MgYSBkaWZmZXJlbnQgdm5vZGUgc28gb25jcmVhdGUgbWlnaHQgbm90IGJlIGNhbGxlZC5cblx0XHRcdFx0aWYgKCF0aGlzLmJvZHlMaW5lSGVpZ2h0KSB7XG5cdFx0XHRcdFx0dGhpcy51cGRhdGVMaW5lSGVpZ2h0KHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudClcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0aGlzLmN1cnJlbnRseVJlbmRlcmVkTWFpbEJvZHkgIT09IHNhbml0aXplZE1haWxCb2R5KSB0aGlzLnJlbmRlclNoYWRvd01haWxCb2R5KHNhbml0aXplZE1haWxCb2R5LCBhdHRycywgdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50KVxuXHRcdFx0XHQvLyBJZiB0aGUgcXVvdGUgYmVoYXZpb3IgY2hhbmdlcyAoZS5nLiBhZnRlciBsb2FkaW5nIGlzIGZpbmlzaGVkKSB3ZSBzaG91bGQgdXBkYXRlIHRoZSBxdW90ZXMuXG5cdFx0XHRcdC8vIElmIHdlIGFscmVhZHkgcmVuZGVyZWQgaXQgY29ycmVjdGx5IGl0IHdpbGwgYWxyZWFkeSBiZSBzZXQgaW4gcmVuZGVyU2hhZG93TWFpbEJvZHkoKSBzbyB3ZSB3aWxsIGF2b2lkIGRvaW5nIGl0IHR3aWNlLlxuXHRcdFx0XHRpZiAodGhpcy5jdXJyZW50UXVvdGVCZWhhdmlvciAhPT0gYXR0cnMuZGVmYXVsdFF1b3RlQmVoYXZpb3IpIHtcblx0XHRcdFx0XHR0aGlzLnVwZGF0ZUNvbGxhcHNlZFF1b3Rlcyhhc3NlcnROb3ROdWxsKHRoaXMuc2hhZG93RG9tUm9vdCksIGF0dHJzLmRlZmF1bHRRdW90ZUJlaGF2aW9yID09PSBcImV4cGFuZFwiKVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuY3VycmVudFF1b3RlQmVoYXZpb3IgPSBhdHRycy5kZWZhdWx0UXVvdGVCZWhhdmlvclxuXG5cdFx0XHRcdGlmIChjbGllbnQuaXNNb2JpbGVEZXZpY2UoKSAmJiAhdGhpcy5waW5jaFpvb21hYmxlICYmIHRoaXMuc2hhZG93RG9tTWFpbENvbnRlbnQpIHtcblx0XHRcdFx0XHR0aGlzLmNyZWF0ZVBpbmNoWm9vbSh0aGlzLnNoYWRvd0RvbU1haWxDb250ZW50LCB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRvbmJlZm9yZXJlbW92ZTogKCkgPT4ge1xuXHRcdFx0XHQvLyBDbGVhciBkb20gYm9keSBpbiBjYXNlIHRoZXJlIHdpbGwgYmUgYSBuZXcgb25lLCB3ZSB3YW50IHByb21pc2UgdG8gYmUgdXAtdG8tZGF0ZVxuXHRcdFx0XHR0aGlzLmNsZWFyRG9tQm9keSgpXG5cdFx0XHR9LFxuXHRcdFx0b25zdWJtaXQ6IChldmVudDogRXZlbnQpID0+IHtcblx0XHRcdFx0Ly8gdXNlIHRoZSBkZWZhdWx0IGNvbmZpcm0gZGlhbG9nIGhlcmUgYmVjYXVzZSB0aGUgc3VibWl0IGNhbiBub3QgYmUgZG9uZSBhc3luY1xuXHRcdFx0XHRpZiAoIWNvbmZpcm0obGFuZy5nZXQoXCJyZWFsbHlTdWJtaXRDb250ZW50X21zZ1wiKSkpIHtcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcImxpbmUtaGVpZ2h0XCI6IHRoaXMuYm9keUxpbmVIZWlnaHQgPyB0aGlzLmJvZHlMaW5lSGVpZ2h0LnRvU3RyaW5nKCkgOiBzaXplLmxpbmVfaGVpZ2h0LFxuXHRcdFx0XHRcInRyYW5zZm9ybS1vcmlnaW5cIjogXCJ0b3AgbGVmdFwiLFxuXHRcdFx0fSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBjcmVhdGVQaW5jaFpvb20oem9vbWFibGU6IEhUTUxFbGVtZW50LCB2aWV3cG9ydDogSFRNTEVsZW1lbnQpIHtcblx0XHQvLyB0aGUgUGluY2hab29tIGNsYXNzIGRvZXMgbm90IGFsbG93IGEgY2hhbmdpbmcgem9vbWFibGUgcmVjdCBzaXplIChtYWlsIGJvZHkgY29udGVudCkuIFdoZW4gd2Ugc2hvdyBwcmV2aW91c2x5IHVubG9hZGVkIGltYWdlcyB0aGUgc2l6ZVxuXHRcdC8vIG9mIHRoZSBtYWlsIGJvZHkgY2hhbmdlcy4gU28gd2UgaGF2ZSB0byBjcmVhdGUgYSBuZXcgUGluY2hab29tIG9iamVjdFxuXHRcdHRoaXMucGluY2hab29tYWJsZT8ucmVtb3ZlKClcblxuXHRcdHRoaXMucGluY2hab29tYWJsZSA9IG5ldyBQaW5jaFpvb20oem9vbWFibGUsIHZpZXdwb3J0LCB0cnVlLCAoZSwgdGFyZ2V0KSA9PiB7XG5cdFx0XHR0aGlzLmhhbmRsZUFuY2hvckNsaWNrKGUsIHRhcmdldCwgdHJ1ZSlcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSB1cGRhdGVDb2xsYXBzZWRRdW90ZXMoZG9tOiBQYXJlbnROb2RlLCBzaG93UXVvdGU6IGJvb2xlYW4pIHtcblx0XHRjb25zdCBxdW90ZXM6IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+ID0gZG9tLnF1ZXJ5U2VsZWN0b3JBbGwoXCJbdHV0YS1jb2xsYXBzZWQtcXVvdGVdXCIpXG5cdFx0Zm9yIChjb25zdCBxdW90ZVdyYXAgb2YgQXJyYXkuZnJvbShxdW90ZXMpKSB7XG5cdFx0XHRjb25zdCBxdW90ZSA9IHF1b3RlV3JhcC5jaGlsZHJlblswXSBhcyBIVE1MRWxlbWVudFxuXHRcdFx0cXVvdGUuc3R5bGUuZGlzcGxheSA9IHNob3dRdW90ZSA/IFwiXCIgOiBcIm5vbmVcIlxuXHRcdFx0Y29uc3QgcXVvdGVJbmRpY2F0b3IgPSBxdW90ZVdyYXAuY2hpbGRyZW5bMV0gYXMgSFRNTEVsZW1lbnRcblx0XHRcdHF1b3RlSW5kaWNhdG9yLnN0eWxlLmRpc3BsYXkgPSBzaG93UXVvdGUgPyBcIm5vbmVcIiA6IFwiXCJcblx0XHR9XG5cblx0XHRpZiAodGhpcy5waW5jaFpvb21hYmxlKSB7XG5cdFx0XHR0aGlzLmNyZWF0ZVBpbmNoWm9vbSh0aGlzLnBpbmNoWm9vbWFibGUuZ2V0Wm9vbWFibGUoKSwgdGhpcy5waW5jaFpvb21hYmxlLmdldFZpZXdwb3J0KCkpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBzaG91bGREaXNwbGF5Q29sbGFwc2VkUXVvdGVzKCk6IGJvb2xlYW4ge1xuXHRcdC8vIGlmIHRoZSB1c2VyIGRpZG4ndCBkbyBhbnl0aGluZyB5ZXQgdGFrZSB0aGUgYmVoYXZpb3IgcGFzc2VkIGZyb20gdGhlIG91dHNpZGUsIG90aGVyd2lzZSB3aGF0ZXZlciB1c2VyIGhhcyBzZWxlY3RlZFxuXHRcdHJldHVybiB0aGlzLnF1b3RlU3RhdGUgPT09IFwidW5zZXRcIiA/IHRoaXMuY3VycmVudFF1b3RlQmVoYXZpb3IgPT09IFwiZXhwYW5kXCIgOiB0aGlzLnF1b3RlU3RhdGUgPT09IFwiZXhwYW5kZWRcIlxuXHR9XG5cblx0LyoqXG5cdCAqIG1hbnVhbGx5IHdyYXAgYW5kIHN0eWxlIGEgbWFpbCBib2R5IHRvIGRpc3BsYXkgY29ycmVjdGx5IGluc2lkZSBhIHNoYWRvdyByb290XG5cdCAqIEBwYXJhbSBzYW5pdGl6ZWRNYWlsQm9keSB0aGUgbWFpbCBib2R5IHRvIGRpc3BsYXlcblx0ICogQHBhcmFtIGF0dHJzXG5cdCAqIEBwYXJhbSBwYXJlbnQgdGhlIHBhcmVudCBlbGVtZW50IHRoYXQgY29udGFpbnMgdGhlIHNoYWRvd01haWxCb2R5XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRwcml2YXRlIHJlbmRlclNoYWRvd01haWxCb2R5KHNhbml0aXplZE1haWxCb2R5OiBEb2N1bWVudEZyYWdtZW50LCBhdHRyczogTWFpbFZpZXdlckF0dHJzLCBwYXJlbnQ6IEhUTUxFbGVtZW50KSB7XG5cdFx0dGhpcy5jdXJyZW50UXVvdGVCZWhhdmlvciA9IGF0dHJzLmRlZmF1bHRRdW90ZUJlaGF2aW9yXG5cdFx0YXNzZXJ0Tm9uTnVsbCh0aGlzLnNoYWRvd0RvbVJvb3QsIFwic2hhZG93IGRvbSByb290IGlzIG51bGwhXCIpXG5cdFx0d2hpbGUgKHRoaXMuc2hhZG93RG9tUm9vdC5maXJzdENoaWxkKSB7XG5cdFx0XHR0aGlzLnNoYWRvd0RvbVJvb3QuZmlyc3RDaGlsZC5yZW1vdmUoKVxuXHRcdH1cblx0XHRjb25zdCB3cmFwTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcblx0XHR3cmFwTm9kZS5jbGFzc05hbWUgPSBcImRyYWcgc2VsZWN0YWJsZSB0b3VjaC1jYWxsb3V0IGJyZWFrLXdvcmQtbGlua3NcIiArIChjbGllbnQuaXNNb2JpbGVEZXZpY2UoKSA/IFwiIGJyZWFrLXByZVwiIDogXCJcIilcblx0XHR3cmFwTm9kZS5zZXRBdHRyaWJ1dGUoXCJkYXRhLXRlc3RpZFwiLCBcIm1haWxCb2R5X2xhYmVsXCIpXG5cdFx0d3JhcE5vZGUuc3R5bGUubGluZUhlaWdodCA9IFN0cmluZyh0aGlzLmJvZHlMaW5lSGVpZ2h0ID8gdGhpcy5ib2R5TGluZUhlaWdodC50b1N0cmluZygpIDogc2l6ZS5saW5lX2hlaWdodClcblx0XHR3cmFwTm9kZS5zdHlsZS50cmFuc2Zvcm1PcmlnaW4gPSBcIjBweCAwcHhcIlxuXG5cdFx0Ly8gUmVtb3ZlIFwiYWxpZ25cIiBwcm9wZXJ0eSBmcm9tIHRoZSB0b3AtbGV2ZWwgY29udGVudCBhcyBpdCBjYXVzZXMgb3ZlcmZsb3cuXG5cdFx0Ly8gTm90ZTogdGhpcyBpcyBub3QgQ1NTIGFsaWduLCB0aGlzIGlzIGEgZGVwcmVjYXRlZCBhbGlnbiBhdHRyaWJ1dGUuXG5cdFx0Ly8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90dXRhby90dXRhbm90YS9pc3N1ZXMvODI3MVxuXHRcdGNvbnN0IGNvbnRlbnRSb290ID0gc2FuaXRpemVkTWFpbEJvZHkuY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxFbGVtZW50XG5cdFx0Zm9yIChjb25zdCBjaGlsZCBvZiBBcnJheS5mcm9tKGNvbnRlbnRSb290LmNoaWxkcmVuKSkge1xuXHRcdFx0Y2hpbGQucmVtb3ZlQXR0cmlidXRlKFwiYWxpZ25cIilcblx0XHR9XG5cblx0XHR3cmFwTm9kZS5hcHBlbmRDaGlsZChjb250ZW50Um9vdClcblxuXHRcdHRoaXMuc2hhZG93RG9tTWFpbENvbnRlbnQgPSB3cmFwTm9kZVxuXG5cdFx0Ly8gcXVlcnkgYWxsIHRvcCBsZXZlbCBibG9jayBxdW90ZXNcblx0XHRjb25zdCBxdW90ZUVsZW1lbnRzID0gQXJyYXkuZnJvbSh3cmFwTm9kZS5xdWVyeVNlbGVjdG9yQWxsKFwiYmxvY2txdW90ZTpub3QoYmxvY2txdW90ZSBibG9ja3F1b3RlKVwiKSkgYXMgSFRNTEVsZW1lbnRbXVxuXHRcdGlmIChxdW90ZUVsZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhpcy5xdW90ZVN0YXRlID0gXCJub3F1b3Rlc1wiXG5cdFx0fVxuXHRcdGZvciAoY29uc3QgcXVvdGUgb2YgcXVvdGVFbGVtZW50cykge1xuXHRcdFx0dGhpcy5jcmVhdGVDb2xsYXBzZWRCbG9ja1F1b3RlKHF1b3RlLCB0aGlzLnNob3VsZERpc3BsYXlDb2xsYXBzZWRRdW90ZXMoKSlcblx0XHR9XG5cblx0XHR0aGlzLnNoYWRvd0RvbVJvb3QuYXBwZW5kQ2hpbGQoc3R5bGVzLmdldFN0eWxlU2hlZXRFbGVtZW50KFwibWFpblwiKSlcblx0XHR0aGlzLnNoYWRvd0RvbVJvb3QuYXBwZW5kQ2hpbGQod3JhcE5vZGUpXG5cblx0XHRpZiAoY2xpZW50LmlzTW9iaWxlRGV2aWNlKCkpIHtcblx0XHRcdHRoaXMucGluY2hab29tYWJsZSA9IG51bGxcblx0XHRcdHRoaXMucmVzaXplT2JzZXJ2ZXJab29tYWJsZT8uZGlzY29ubmVjdCgpXG5cdFx0XHR0aGlzLnJlc2l6ZU9ic2VydmVyWm9vbWFibGUgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKGVudHJpZXMpID0+IHtcblx0XHRcdFx0aWYgKHRoaXMucmVzaXplUmFmKSB7XG5cdFx0XHRcdFx0Ly8gZGlkIHdlIGFscmVhZHkgc2NoZWR1bGUgYSByZXNldCBmb3IgcGluY2ggdG8gem9vbSBpbiB0aGUgZnJhbWVcblx0XHRcdFx0XHRjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJlc2l6ZVJhZilcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLnJlc2l6ZVJhZiA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5jcmVhdGVQaW5jaFpvb20od3JhcE5vZGUsIHBhcmVudCkgLy8gcmVjcmVhdGUgZm9yIGV4YW1wbGUgaWYgaW1hZ2VzIGFyZSBsb2FkZWQgc2xvd2x5XG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdFx0dGhpcy5yZXNpemVPYnNlcnZlclpvb21hYmxlLm9ic2VydmUod3JhcE5vZGUpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHdyYXBOb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcblx0XHRcdFx0dGhpcy5oYW5kbGVBbmNob3JDbGljayhldmVudCwgZXZlbnQudGFyZ2V0LCBmYWxzZSlcblx0XHRcdH0pXG5cdFx0fVxuXHRcdHRoaXMuY3VycmVudGx5UmVuZGVyZWRNYWlsQm9keSA9IHNhbml0aXplZE1haWxCb2R5XG5cdH1cblxuXHRwcml2YXRlIGNyZWF0ZUNvbGxhcHNlZEJsb2NrUXVvdGUocXVvdGU6IEhUTUxFbGVtZW50LCBleHBhbmRlZDogYm9vbGVhbikge1xuXHRcdGNvbnN0IHF1b3RlV3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcblx0XHQvLyB1c2VkIHRvIHF1ZXJ5IHF1b3RlcyBsYXRlclxuXHRcdHF1b3RlV3JhcC5zZXRBdHRyaWJ1dGUoXCJ0dXRhLWNvbGxhcHNlZC1xdW90ZVwiLCBcInRydWVcIilcblxuXHRcdHF1b3RlLnJlcGxhY2VXaXRoKHF1b3RlV3JhcClcblx0XHRxdW90ZS5zdHlsZS5kaXNwbGF5ID0gZXhwYW5kZWQgPyBcIlwiIDogXCJub25lXCJcblxuXHRcdGNvbnN0IHF1b3RlSW5kaWNhdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuXHRcdHF1b3RlSW5kaWNhdG9yLmNsYXNzTGlzdC5hZGQoXCJmbGV4XCIpXG5cdFx0cXVvdGVJbmRpY2F0b3Iuc3R5bGUuYm9yZGVyTGVmdCA9IGAycHggc29saWQgJHt0aGVtZS5jb250ZW50X2JvcmRlcn1gXG5cdFx0cXVvdGVJbmRpY2F0b3Iuc3R5bGUuZGlzcGxheSA9IGV4cGFuZGVkID8gXCJub25lXCIgOiBcIlwiXG5cblx0XHRtLnJlbmRlcihcblx0XHRcdHF1b3RlSW5kaWNhdG9yLFxuXHRcdFx0bShJY29uLCB7XG5cdFx0XHRcdGljb246IEljb25zLk1vcmUsXG5cdFx0XHRcdGNsYXNzOiBcImljb24teGwgbWxyXCIsXG5cdFx0XHRcdGNvbnRhaW5lcjogXCJkaXZcIixcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRmaWxsOiB0aGVtZS5uYXZpZ2F0aW9uX21lbnVfaWNvbixcblx0XHRcdFx0fSxcblx0XHRcdH0pLFxuXHRcdClcblxuXHRcdHF1b3RlV3JhcC5hcHBlbmRDaGlsZChxdW90ZSlcblx0XHRxdW90ZVdyYXAuYXBwZW5kQ2hpbGQocXVvdGVJbmRpY2F0b3IpXG5cdH1cblxuXHRwcml2YXRlIGNsZWFyRG9tQm9keSgpIHtcblx0XHR0aGlzLmRvbUJvZHlEZWZlcnJlZCA9IGRlZmVyKClcblx0XHR0aGlzLmRvbUJvZHkgPSBudWxsXG5cdFx0dGhpcy5zaGFkb3dEb21Sb290ID0gbnVsbFxuXHR9XG5cblx0cHJpdmF0ZSBzZXREb21Cb2R5KGRvbTogSFRNTEVsZW1lbnQpIHtcblx0XHRpZiAoZG9tICE9PSB0aGlzLmRvbUJvZHkgfHwgdGhpcy5zaGFkb3dEb21Sb290ID09IG51bGwpIHtcblx0XHRcdC8vIElmIHRoZSBkb20gZWxlbWVudCBoYXNuJ3QgYmVlbiBjcmVhdGVkIGFuZXcgaW4gb251cGRhdGVcblx0XHRcdC8vIHRoZW4gdHJ5aW5nIHRvIGNyZWF0ZSBhIG5ldyBzaGFkb3cgcm9vdCBvbiB0aGUgc2FtZSBub2RlIHdpbGwgY2F1c2UgYW4gZXJyb3Jcblx0XHRcdHRoaXMuc2hhZG93RG9tUm9vdCA9IGRvbS5hdHRhY2hTaGFkb3coeyBtb2RlOiBcIm9wZW5cIiB9KVxuXG5cdFx0XHQvLyBBbGxvdyBmb3JtcyBpbnNpZGUgb2YgbWFpbCBib2RpZXMgdG8gYmUgZmlsbGVkIG91dCB3aXRob3V0IHJlc3VsdGluZyBpbiBrZXlzdHJva2VzIGJlaW5nIGludGVycHJldGVkIGFzIHNob3J0Y3V0c1xuXHRcdFx0dGhpcy5zaGFkb3dEb21Sb290LmdldFJvb3ROb2RlKCkuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50OiBFdmVudCkgPT4ge1xuXHRcdFx0XHRjb25zdCB7IHRhcmdldCB9ID0gZXZlbnRcblx0XHRcdFx0aWYgKHRoaXMuZXZlbnRUYXJnZXRXaXRoS2V5Ym9hcmRJbnB1dCh0YXJnZXQpKSB7XG5cdFx0XHRcdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHR0aGlzLmRvbUJvZHlEZWZlcnJlZC5yZXNvbHZlKGRvbSlcblx0XHR0aGlzLmRvbUJvZHkgPSBkb21cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTG9hZGluZ0ljb24oKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIucHJvZ3Jlc3MtcGFuZWwuZmxleC12LWNlbnRlci5pdGVtcy1jZW50ZXJcIixcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBcImxvYWRpbmdJY29uXCIsXG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0aGVpZ2h0OiBcIjIwMHB4XCIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0W3Byb2dyZXNzSWNvbigpLCBtKFwic21hbGxcIiwgbGFuZy5nZXQoXCJsb2FkaW5nX21zZ1wiKSldLFxuXHRcdClcblx0fVxuXG5cdGFzeW5jIHJlcGxhY2VJbmxpbmVJbWFnZXMoKSB7XG5cdFx0Y29uc3QgbG9hZGVkSW5saW5lSW1hZ2VzID0gYXdhaXQgdGhpcy52aWV3TW9kZWwuZ2V0TG9hZGVkSW5saW5lSW1hZ2VzKClcblx0XHRjb25zdCBkb21Cb2R5ID0gYXdhaXQgdGhpcy5kb21Cb2R5RGVmZXJyZWQucHJvbWlzZVxuXHRcdHJlcGxhY2VDaWRzV2l0aElubGluZUltYWdlcyhkb21Cb2R5LCBsb2FkZWRJbmxpbmVJbWFnZXMsIChjaWQsIGV2ZW50KSA9PiB7XG5cdFx0XHRjb25zdCBpbmxpbmVBdHRhY2htZW50ID0gdGhpcy52aWV3TW9kZWwuZ2V0QXR0YWNobWVudHMoKS5maW5kKChhdHRhY2htZW50KSA9PiBhdHRhY2htZW50LmNpZCA9PT0gY2lkKVxuXHRcdFx0aWYgKGlubGluZUF0dGFjaG1lbnQgJiYgKCFjbGllbnQuaXNNb2JpbGVEZXZpY2UoKSB8fCAhdGhpcy5waW5jaFpvb21hYmxlIHx8ICF0aGlzLnBpbmNoWm9vbWFibGUuaXNEcmFnZ2luZ09yWm9vbWluZygpKSkge1xuXHRcdFx0XHRjb25zdCBjb29yZHMgPSBnZXRDb29yZHNPZk1vdXNlT3JUb3VjaEV2ZW50KGV2ZW50KVxuXHRcdFx0XHRzaG93RHJvcGRvd25BdFBvc2l0aW9uKFxuXHRcdFx0XHRcdFtcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGFiZWw6IFwiZG93bmxvYWRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLnZpZXdNb2RlbC5kb3dubG9hZEFuZE9wZW5BdHRhY2htZW50KGlubGluZUF0dGFjaG1lbnQsIGZhbHNlKSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxhYmVsOiBcIm9wZW5fYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLnZpZXdNb2RlbC5kb3dubG9hZEFuZE9wZW5BdHRhY2htZW50KGlubGluZUF0dGFjaG1lbnQsIHRydWUpLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdGNvb3Jkcy54LFxuXHRcdFx0XHRcdGNvb3Jkcy55LFxuXHRcdFx0XHQpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgc2V0dXBTaG9ydGN1dHMoYXR0cnM6IE1haWxWaWV3ZXJBdHRycyk6IEFycmF5PFNob3J0Y3V0PiB7XG5cdFx0Y29uc3QgdXNlckNvbnRyb2xsZXIgPSBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpXG5cdFx0Y29uc3Qgc2hvcnRjdXRzOiBTaG9ydGN1dFtdID0gW1xuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuRSxcblx0XHRcdFx0ZW5hYmxlZDogKCkgPT4gdGhpcy52aWV3TW9kZWwuaXNEcmFmdE1haWwoKSxcblx0XHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRcdGVkaXREcmFmdCh0aGlzLnZpZXdNb2RlbClcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJlZGl0TWFpbF9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5ILFxuXHRcdFx0XHRlbmFibGVkOiAoKSA9PiAhdGhpcy52aWV3TW9kZWwuaXNEcmFmdE1haWwoKSxcblx0XHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRcdHNob3dIZWFkZXJEaWFsb2codGhpcy52aWV3TW9kZWwuZ2V0SGVhZGVycygpKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRoZWxwOiBcInNob3dIZWFkZXJzX2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLkksXG5cdFx0XHRcdGVuYWJsZWQ6ICgpID0+ICF0aGlzLnZpZXdNb2RlbC5pc0RyYWZ0TWFpbCgpLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0c2hvd1NvdXJjZURpYWxvZyh0aGlzLnZpZXdNb2RlbC5nZXRNYWlsQm9keSgpKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRoZWxwOiBcInNob3dTb3VyY2VfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuUixcblx0XHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMudmlld01vZGVsLnJlcGx5KGZhbHNlKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRlbmFibGVkOiAoKSA9PiAhdGhpcy52aWV3TW9kZWwuaXNEcmFmdE1haWwoKSxcblx0XHRcdFx0aGVscDogXCJyZXBseV9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5SLFxuXHRcdFx0XHRzaGlmdDogdHJ1ZSxcblx0XHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMudmlld01vZGVsLnJlcGx5KHRydWUpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGVuYWJsZWQ6ICgpID0+ICF0aGlzLnZpZXdNb2RlbC5pc0RyYWZ0TWFpbCgpLFxuXHRcdFx0XHRoZWxwOiBcInJlcGx5QWxsX2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRdXG5cblx0XHRpZiAodXNlckNvbnRyb2xsZXIuaXNJbnRlcm5hbFVzZXIoKSkge1xuXHRcdFx0c2hvcnRjdXRzLnB1c2goe1xuXHRcdFx0XHRrZXk6IEtleXMuRixcblx0XHRcdFx0c2hpZnQ6IHRydWUsXG5cdFx0XHRcdGVuYWJsZWQ6ICgpID0+ICF0aGlzLnZpZXdNb2RlbC5pc0RyYWZ0TWFpbCgpLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy52aWV3TW9kZWwuZm9yd2FyZCgpLmNhdGNoKG9mQ2xhc3MoVXNlckVycm9yLCBzaG93VXNlckVycm9yKSlcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJmb3J3YXJkX2FjdGlvblwiLFxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRyZXR1cm4gc2hvcnRjdXRzXG5cdH1cblxuXHRwcml2YXRlIHVwZGF0ZUxpbmVIZWlnaHQoZG9tOiBIVE1MRWxlbWVudCkge1xuXHRcdGNvbnN0IHdpZHRoID0gZG9tLm9mZnNldFdpZHRoXG5cblx0XHRpZiAod2lkdGggPiA5MDApIHtcblx0XHRcdHRoaXMuYm9keUxpbmVIZWlnaHQgPSBzaXplLmxpbmVfaGVpZ2h0X2xcblx0XHR9IGVsc2UgaWYgKHdpZHRoID4gNjAwKSB7XG5cdFx0XHR0aGlzLmJvZHlMaW5lSGVpZ2h0ID0gc2l6ZS5saW5lX2hlaWdodF9tXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuYm9keUxpbmVIZWlnaHQgPSBzaXplLmxpbmVfaGVpZ2h0XG5cdFx0fVxuXG5cdFx0ZG9tLnN0eWxlLmxpbmVIZWlnaHQgPSBTdHJpbmcodGhpcy5ib2R5TGluZUhlaWdodClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgY3JlYXRlTWFpbEFkZHJlc3NDb250ZXh0QnV0dG9ucyhhcmdzOiB7XG5cdFx0bWFpbEFkZHJlc3M6IE1haWxBZGRyZXNzQW5kTmFtZVxuXHRcdGRlZmF1bHRJbmJveFJ1bGVGaWVsZDogSW5ib3hSdWxlVHlwZSB8IG51bGxcblx0XHRjcmVhdGVDb250YWN0PzogYm9vbGVhblxuXHR9KTogUHJvbWlzZTxBcnJheTxEcm9wZG93bkJ1dHRvbkF0dHJzPj4ge1xuXHRcdGNvbnN0IHsgbWFpbEFkZHJlc3MsIGRlZmF1bHRJbmJveFJ1bGVGaWVsZCwgY3JlYXRlQ29udGFjdCA9IHRydWUgfSA9IGFyZ3NcblxuXHRcdGNvbnN0IGJ1dHRvbnMgPSBbXSBhcyBBcnJheTxEcm9wZG93bkJ1dHRvbkF0dHJzPlxuXG5cdFx0YnV0dG9ucy5wdXNoKHtcblx0XHRcdGxhYmVsOiBcImNvcHlfYWN0aW9uXCIsXG5cdFx0XHRjbGljazogKCkgPT4gY29weVRvQ2xpcGJvYXJkKG1haWxBZGRyZXNzLmFkZHJlc3MpLFxuXHRcdH0pXG5cblx0XHRpZiAobG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0ludGVybmFsVXNlcigpKSB7XG5cdFx0XHQvL3NlYXJjaGluZyBmb3IgY29udGFjdHMgd2lsbCBuZXZlciByZXNvbHZlIGlmIHRoZSB1c2VyIGhhcyBub3QgbG9nZ2VkIGluIG9ubGluZVxuXHRcdFx0aWYgKGNyZWF0ZUNvbnRhY3QgJiYgIWxvY2F0b3IubG9naW5zLmlzRW5hYmxlZChGZWF0dXJlVHlwZS5EaXNhYmxlQ29udGFjdHMpICYmIGxvY2F0b3IubG9naW5zLmlzRnVsbHlMb2dnZWRJbigpKSB7XG5cdFx0XHRcdGNvbnN0IGNvbnRhY3QgPSBhd2FpdCB0aGlzLnZpZXdNb2RlbC5jb250YWN0TW9kZWwuc2VhcmNoRm9yQ29udGFjdChtYWlsQWRkcmVzcy5hZGRyZXNzKVxuXHRcdFx0XHRpZiAoY29udGFjdCkge1xuXHRcdFx0XHRcdGJ1dHRvbnMucHVzaCh7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJzaG93Q29udGFjdF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IFtsaXN0SWQsIGNvbnRhY3RJZF0gPSBhc3NlcnROb3ROdWxsKGNvbnRhY3QpLl9pZFxuXHRcdFx0XHRcdFx0XHRtLnJvdXRlLnNldChcIi9jb250YWN0LzpsaXN0SWQvOmNvbnRhY3RJZFwiLCB7IGxpc3RJZCwgY29udGFjdElkLCBmb2N1c0l0ZW06IHRydWUgfSlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRidXR0b25zLnB1c2goe1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwiY3JlYXRlQ29udGFjdF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMudmlld01vZGVsLmNvbnRhY3RNb2RlbC5nZXRDb250YWN0TGlzdElkKCkudGhlbigoY29udGFjdExpc3RJZCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGltcG9ydChcIi4uLy4uL2NvbnRhY3RzL0NvbnRhY3RFZGl0b3JcIikudGhlbigoeyBDb250YWN0RWRpdG9yIH0pID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IGNvbnRhY3QgPSBjcmVhdGVOZXdDb250YWN0KGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlciwgbWFpbEFkZHJlc3MuYWRkcmVzcywgbWFpbEFkZHJlc3MubmFtZSlcblx0XHRcdFx0XHRcdFx0XHRcdG5ldyBDb250YWN0RWRpdG9yKHRoaXMudmlld01vZGVsLmVudGl0eUNsaWVudCwgY29udGFjdCwgYXNzZXJ0Tm90TnVsbChjb250YWN0TGlzdElkKSkuc2hvdygpXG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGVmYXVsdEluYm94UnVsZUZpZWxkICYmICFsb2NhdG9yLmxvZ2lucy5pc0VuYWJsZWQoRmVhdHVyZVR5cGUuSW50ZXJuYWxDb21tdW5pY2F0aW9uKSkge1xuXHRcdFx0XHRjb25zdCBydWxlID0gZ2V0RXhpc3RpbmdSdWxlRm9yVHlwZShsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnByb3BzLCBtYWlsQWRkcmVzcy5hZGRyZXNzLnRyaW0oKS50b0xvd2VyQ2FzZSgpLCBkZWZhdWx0SW5ib3hSdWxlRmllbGQpXG5cdFx0XHRcdGJ1dHRvbnMucHVzaCh7XG5cdFx0XHRcdFx0bGFiZWw6IHJ1bGUgPyBcImVkaXRJbmJveFJ1bGVfYWN0aW9uXCIgOiBcImFkZEluYm94UnVsZV9hY3Rpb25cIixcblx0XHRcdFx0XHRjbGljazogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgbWFpbGJveERldGFpbHMgPSBhd2FpdCB0aGlzLnZpZXdNb2RlbC5tYWlsTW9kZWwuZ2V0TWFpbGJveERldGFpbHNGb3JNYWlsKHRoaXMudmlld01vZGVsLm1haWwpXG5cdFx0XHRcdFx0XHRpZiAobWFpbGJveERldGFpbHMgPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvbnN0IHsgc2hvdywgY3JlYXRlSW5ib3hSdWxlVGVtcGxhdGUgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uL3NldHRpbmdzL0FkZEluYm94UnVsZURpYWxvZ1wiKVxuXHRcdFx0XHRcdFx0Y29uc3QgbmV3UnVsZSA9IHJ1bGUgPz8gY3JlYXRlSW5ib3hSdWxlVGVtcGxhdGUoZGVmYXVsdEluYm94UnVsZUZpZWxkLCBtYWlsQWRkcmVzcy5hZGRyZXNzLnRyaW0oKS50b0xvd2VyQ2FzZSgpKVxuXG5cdFx0XHRcdFx0XHRzaG93KG1haWxib3hEZXRhaWxzLCBuZXdSdWxlKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLnZpZXdNb2RlbC5jYW5DcmVhdGVTcGFtUnVsZSgpKSB7XG5cdFx0XHRcdGJ1dHRvbnMucHVzaCh7XG5cdFx0XHRcdFx0bGFiZWw6IFwiYWRkU3BhbVJ1bGVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHRoaXMuYWRkU3BhbVJ1bGUoZGVmYXVsdEluYm94UnVsZUZpZWxkLCBtYWlsQWRkcmVzcy5hZGRyZXNzKSxcblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gYnV0dG9uc1xuXHR9XG5cblx0cHJpdmF0ZSBhZGRTcGFtUnVsZShkZWZhdWx0SW5ib3hSdWxlRmllbGQ6IEluYm94UnVsZVR5cGUgfCBudWxsLCBhZGRyZXNzOiBzdHJpbmcpIHtcblx0XHRjb25zdCBmb2xkZXIgPSB0aGlzLnZpZXdNb2RlbC5tYWlsTW9kZWwuZ2V0TWFpbEZvbGRlckZvck1haWwodGhpcy52aWV3TW9kZWwubWFpbClcblxuXHRcdGNvbnN0IHNwYW1SdWxlVHlwZSA9IGZvbGRlciAmJiBmb2xkZXIuZm9sZGVyVHlwZSA9PT0gTWFpbFNldEtpbmQuU1BBTSA/IFNwYW1SdWxlVHlwZS5XSElURUxJU1QgOiBTcGFtUnVsZVR5cGUuQkxBQ0tMSVNUXG5cblx0XHRsZXQgc3BhbVJ1bGVGaWVsZDogU3BhbVJ1bGVGaWVsZFR5cGVcblx0XHRzd2l0Y2ggKGRlZmF1bHRJbmJveFJ1bGVGaWVsZCkge1xuXHRcdFx0Y2FzZSBJbmJveFJ1bGVUeXBlLlJFQ0lQSUVOVF9UT19FUVVBTFM6XG5cdFx0XHRcdHNwYW1SdWxlRmllbGQgPSBTcGFtUnVsZUZpZWxkVHlwZS5UT1xuXHRcdFx0XHRicmVha1xuXG5cdFx0XHRjYXNlIEluYm94UnVsZVR5cGUuUkVDSVBJRU5UX0NDX0VRVUFMUzpcblx0XHRcdFx0c3BhbVJ1bGVGaWVsZCA9IFNwYW1SdWxlRmllbGRUeXBlLkNDXG5cdFx0XHRcdGJyZWFrXG5cblx0XHRcdGNhc2UgSW5ib3hSdWxlVHlwZS5SRUNJUElFTlRfQkNDX0VRVUFMUzpcblx0XHRcdFx0c3BhbVJ1bGVGaWVsZCA9IFNwYW1SdWxlRmllbGRUeXBlLkJDQ1xuXHRcdFx0XHRicmVha1xuXG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRzcGFtUnVsZUZpZWxkID0gU3BhbVJ1bGVGaWVsZFR5cGUuRlJPTVxuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdGltcG9ydChcIi4uLy4uL3NldHRpbmdzL0FkZFNwYW1SdWxlRGlhbG9nXCIpLnRoZW4oYXN5bmMgKHsgc2hvd0FkZFNwYW1SdWxlRGlhbG9nIH0pID0+IHtcblx0XHRcdGNvbnN0IHZhbHVlID0gYWRkcmVzcy50cmltKCkudG9Mb3dlckNhc2UoKVxuXHRcdFx0c2hvd0FkZFNwYW1SdWxlRGlhbG9nKFxuXHRcdFx0XHRjcmVhdGVFbWFpbFNlbmRlckxpc3RFbGVtZW50KHtcblx0XHRcdFx0XHR2YWx1ZSxcblx0XHRcdFx0XHR0eXBlOiBzcGFtUnVsZVR5cGUsXG5cdFx0XHRcdFx0ZmllbGQ6IHNwYW1SdWxlRmllbGQsXG5cdFx0XHRcdFx0aGFzaGVkVmFsdWU6IGF3YWl0IGxvY2F0b3Iud29ya2VyLmdldFdvcmtlckludGVyZmFjZSgpLmNyeXB0b0ZhY2FkZS5zaGEyNTYodmFsdWUpLFxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBoYW5kbGVBbmNob3JDbGljayhldmVudDogRXZlbnQsIGV2ZW50VGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGwsIHNob3VsZERpc3BhdGNoU3ludGhldGljQ2xpY2s6IGJvb2xlYW4pOiB2b2lkIHtcblx0XHRjb25zdCBocmVmID0gKGV2ZW50VGFyZ2V0IGFzIEVsZW1lbnQgfCBudWxsKT8uY2xvc2VzdChcImFcIik/LmdldEF0dHJpYnV0ZShcImhyZWZcIikgPz8gbnVsbFxuXHRcdGlmIChocmVmKSB7XG5cdFx0XHRpZiAoaHJlZi5zdGFydHNXaXRoKFwibWFpbHRvOlwiKSkge1xuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cblx0XHRcdFx0aWYgKGlzTmV3TWFpbEFjdGlvbkF2YWlsYWJsZSgpKSB7XG5cdFx0XHRcdFx0Ly8gZGlzYWJsZSBuZXcgbWFpbHMgZm9yIGV4dGVybmFsIHVzZXJzLlxuXHRcdFx0XHRcdGltcG9ydChcIi4uL2VkaXRvci9NYWlsRWRpdG9yXCIpLnRoZW4oKHsgbmV3TWFpbHRvVXJsTWFpbEVkaXRvciB9KSA9PiB7XG5cdFx0XHRcdFx0XHRuZXdNYWlsdG9VcmxNYWlsRWRpdG9yKGhyZWYsICFsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnByb3BzLmRlZmF1bHRVbmNvbmZpZGVudGlhbClcblx0XHRcdFx0XHRcdFx0LnRoZW4oKGVkaXRvcikgPT4gZWRpdG9yLnNob3coKSlcblx0XHRcdFx0XHRcdFx0LmNhdGNoKG9mQ2xhc3MoQ2FuY2VsbGVkRXJyb3IsIG5vT3ApKVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoaXNTZXR0aW5nc0xpbmsoaHJlZiwgdGhpcy52aWV3TW9kZWwubWFpbCkpIHtcblx0XHRcdFx0Ly8gTmF2aWdhdGUgdG8gdGhlIHNldHRpbmdzIG1lbnUgaWYgdGhleSBhcmUgbGlua2VkIHdpdGhpbiBhbiBlbWFpbC5cblx0XHRcdFx0Y29uc3QgbmV3Um91dGUgPSBocmVmLnN1YnN0cmluZyhocmVmLmluZGV4T2YoXCIvc2V0dGluZ3MvXCIpKVxuXHRcdFx0XHRtLnJvdXRlLnNldChuZXdSb3V0ZSlcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdFx0fSBlbHNlIGlmIChzaG91bGREaXNwYXRjaFN5bnRoZXRpY0NsaWNrKSB7XG5cdFx0XHRcdGNvbnN0IHN5bnRoZXRpY1RhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpXG5cdFx0XHRcdHN5bnRoZXRpY1RhZy5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIGhyZWYpXG5cdFx0XHRcdHN5bnRoZXRpY1RhZy5zZXRBdHRyaWJ1dGUoXCJ0YXJnZXRcIiwgXCJfYmxhbmtcIilcblx0XHRcdFx0c3ludGhldGljVGFnLnNldEF0dHJpYnV0ZShcInJlbFwiLCBcIm5vb3BlbmVyIG5vcmVmZXJyZXJcIilcblx0XHRcdFx0Y29uc3QgbmV3Q2xpY2tFdmVudCA9IG5ldyBNb3VzZUV2ZW50KFwiY2xpY2tcIilcblx0XHRcdFx0c3ludGhldGljVGFnLmRpc3BhdGNoRXZlbnQobmV3Q2xpY2tFdmVudClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogcmV0dXJucyB0cnVlIGlmIHRoZSBwYXNzZWQgaW4gdGFyZ2V0IGlzIGFuIEhUTUxFbGVtZW50IHRoYXQgY2FuIHJlY2VpdmUgc29tZSBzb3J0IG9mIGtleWJvYXJkIGlucHV0XG5cdCAqL1xuXHRwcml2YXRlIGV2ZW50VGFyZ2V0V2l0aEtleWJvYXJkSW5wdXQodGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGwpOiBib29sZWFuIHtcblx0XHRpZiAodGFyZ2V0ICYmIHRhcmdldCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG5cdFx0XHRyZXR1cm4gdGFyZ2V0Lm1hdGNoZXMoXG5cdFx0XHRcdCdpbnB1dFt0eXBlPVwidGV4dFwiXSwgaW5wdXRbdHlwZT1cImRhdGVcIl0sIGlucHV0W3R5cGU9XCJkYXRldGltZS1sb2NhbFwiXSwgaW5wdXRbdHlwZT1cImVtYWlsXCJdLCBpbnB1dFt0eXBlPVwibW9udGhcIl0sIGlucHV0W3R5cGU9XCJudW1iZXJcIl0sJyArXG5cdFx0XHRcdFx0J2lucHV0W3R5cGU9XCJwYXNzd29yZFwiXSwgaW5wdXRbdHlwZT1cInNlYXJjaFwiXSwgaW5wdXRbdHlwZT1cInRlbFwiXSwgaW5wdXRbdHlwZT1cInRpbWVcIl0sIGlucHV0W3R5cGU9XCJ1cmxcIl0sIGlucHV0W3R5cGU9XCJ3ZWVrXCJdLCBpbnB1dFt0eXBlPVwiZGF0ZXRpbWVcIl0sIHRleHRhcmVhJyxcblx0XHRcdClcblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGhhbmRsZUF0dGFjaG1lbnRJbXBvcnQoZmlsZTogVHV0YW5vdGFGaWxlKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMudmlld01vZGVsLmltcG9ydEF0dGFjaG1lbnQoZmlsZSlcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhlKVxuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBVc2VyRXJyb3IpIHtcblx0XHRcdFx0cmV0dXJuIGF3YWl0IERpYWxvZy5tZXNzYWdlKGxhbmcubWFrZVRyYW5zbGF0aW9uKFwiZXJyb3JfbXNnXCIsIGUubWVzc2FnZSkpXG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFwidW5rbm93bkVycm9yX21zZ1wiKVxuXHRcdH1cblx0fVxufVxuXG5leHBvcnQgdHlwZSBDcmVhdGVNYWlsVmlld2VyT3B0aW9ucyA9IHtcblx0bWFpbDogTWFpbFxuXHRzaG93Rm9sZGVyOiBib29sZWFuXG5cdGRlbGF5Qm9keVJlbmRlcmluZ1VudGlsPzogUHJvbWlzZTx2b2lkPlxufVxuXG4vKipcbiAqIHN1cHBvcnQgYW5kIGludm9pY2UgbWFpbHMgY2FuIGNvbnRhaW4gbGlua3MgdG8gdGhlIHNldHRpbmdzIHBhZ2UuXG4gKiB3ZSBkb24ndCB3YW50IG5vcm1hbCBtYWlscyB0byBiZSBhYmxlIHRvIGxpbmsgcGxhY2VzIGluIHRoZSBhcHAsIHRob3VnaC5cbiAqICovXG5mdW5jdGlvbiBpc1NldHRpbmdzTGluayhocmVmOiBzdHJpbmcsIG1haWw6IE1haWwpOiBib29sZWFuIHtcblx0cmV0dXJuIChocmVmLnN0YXJ0c1dpdGgoXCIvc2V0dGluZ3MvXCIpID8/IGZhbHNlKSAmJiBpc1R1dGFub3RhVGVhbU1haWwobWFpbClcbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgZm9ybWF0RGF0ZVdpdGhXZWVrZGF5LCBmb3JtYXRUaW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0Zvcm1hdHRlci5qc1wiXG5pbXBvcnQgeyBNYWlsVmlld2VyVmlld01vZGVsIH0gZnJvbSBcIi4vTWFpbFZpZXdlclZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lLmpzXCJcbmltcG9ydCB7IEFsbEljb25zLCBJY29uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uLmpzXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29ucy5qc1wiXG5pbXBvcnQgeyByZXNwb25zaXZlQ2FyZEhQYWRkaW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvY2FyZHMuanNcIlxuaW1wb3J0IHsgS2V5cywgVGFiSW5kZXggfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgaXNLZXlQcmVzc2VkIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0tleU1hbmFnZXIuanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBnZXRNYWlsQWRkcmVzc0Rpc3BsYXlUZXh0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9TaGFyZWRNYWlsVXRpbHMuanNcIlxuaW1wb3J0IHsgZ2V0Q29uZmlkZW50aWFsSWNvbiwgZ2V0Rm9sZGVySWNvbkJ5VHlwZSB9IGZyb20gXCIuL01haWxHdWlVdGlscy5qc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29sbGFwc2VkTWFpbFZpZXdBdHRycyB7XG5cdHZpZXdNb2RlbDogTWFpbFZpZXdlclZpZXdNb2RlbFxufVxuXG5leHBvcnQgY2xhc3MgQ29sbGFwc2VkTWFpbFZpZXcgaW1wbGVtZW50cyBDb21wb25lbnQ8Q29sbGFwc2VkTWFpbFZpZXdBdHRycz4ge1xuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8Q29sbGFwc2VkTWFpbFZpZXdBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgeyB2aWV3TW9kZWwgfSA9IGF0dHJzXG5cdFx0Y29uc3QgeyBtYWlsIH0gPSB2aWV3TW9kZWxcblx0XHRjb25zdCBkYXRlVGltZSA9IGZvcm1hdERhdGVXaXRoV2Vla2RheShtYWlsLnJlY2VpdmVkRGF0ZSkgKyBcIiDigKIgXCIgKyBmb3JtYXRUaW1lKG1haWwucmVjZWl2ZWREYXRlKVxuXHRcdGNvbnN0IGZvbGRlckluZm8gPSB2aWV3TW9kZWwuZ2V0Rm9sZGVySW5mbygpXG5cdFx0aWYgKCFmb2xkZXJJbmZvKSByZXR1cm4gbnVsbFxuXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5mbGV4Lml0ZW1zLWNlbnRlci5wdC5wYi5jbGljay5uby13cmFwXCIsXG5cdFx0XHR7XG5cdFx0XHRcdGNsYXNzOiByZXNwb25zaXZlQ2FyZEhQYWRkaW5nKCksXG5cdFx0XHRcdHJvbGU6IFwiYnV0dG9uXCIsXG5cdFx0XHRcdFwiYXJpYS1leHBhbmRlZFwiOiBcImZhbHNlXCIsXG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0Y29sb3I6IHRoZW1lLmNvbnRlbnRfYnV0dG9uLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmNsaWNrOiAoKSA9PiB2aWV3TW9kZWwuZXhwYW5kTWFpbChQcm9taXNlLnJlc29sdmUoKSksXG5cdFx0XHRcdG9ua2V5dXA6IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0aWYgKGlzS2V5UHJlc3NlZChlLmtleSwgS2V5cy5TUEFDRSkpIHtcblx0XHRcdFx0XHRcdHZpZXdNb2RlbC5leHBhbmRNYWlsKFByb21pc2UucmVzb2x2ZSgpKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0dGFiaW5kZXg6IFRhYkluZGV4LkRlZmF1bHQsXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHR2aWV3TW9kZWwuaXNVbnJlYWQoKSA/IHRoaXMucmVuZGVyVW5yZWFkRG90KCkgOiBudWxsLFxuXHRcdFx0XHR2aWV3TW9kZWwuaXNEcmFmdE1haWwoKSA/IG0oXCIubXIteHNcIiwgdGhpcy5yZW5kZXJJY29uKEljb25zLkVkaXQsIGxhbmcuZ2V0KFwiZHJhZnRfbGFiZWxcIikpKSA6IG51bGwsXG5cdFx0XHRcdHRoaXMucmVuZGVyU2VuZGVyKHZpZXdNb2RlbCksXG5cdFx0XHRcdG0oXCIuZmxleC5tbC1iZXR3ZWVuLXMuaXRlbXMtY2VudGVyXCIsIFtcblx0XHRcdFx0XHRtYWlsLmF0dGFjaG1lbnRzLmxlbmd0aCA+IDAgPyB0aGlzLnJlbmRlckljb24oSWNvbnMuQXR0YWNobWVudCwgbGFuZy5nZXQoXCJhdHRhY2htZW50X2xhYmVsXCIpKSA6IG51bGwsXG5cdFx0XHRcdFx0dmlld01vZGVsLmlzQ29uZmlkZW50aWFsKCkgPyB0aGlzLnJlbmRlckljb24oZ2V0Q29uZmlkZW50aWFsSWNvbihtYWlsKSwgbGFuZy5nZXQoXCJjb25maWRlbnRpYWxfbGFiZWxcIikpIDogbnVsbCxcblx0XHRcdFx0XHR0aGlzLnJlbmRlckljb24oZ2V0Rm9sZGVySWNvbkJ5VHlwZShmb2xkZXJJbmZvLmZvbGRlclR5cGUpLCBmb2xkZXJJbmZvLm5hbWUpLFxuXHRcdFx0XHRcdG0oXCIuc21hbGwuZm9udC13ZWlnaHQtNjAwXCIsIGRhdGVUaW1lKSxcblx0XHRcdFx0XSksXG5cdFx0XHRdLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyU2VuZGVyKHZpZXdNb2RlbDogTWFpbFZpZXdlclZpZXdNb2RlbCkge1xuXHRcdGNvbnN0IHNlbmRlciA9IHZpZXdNb2RlbC5nZXREaXNwbGF5ZWRTZW5kZXIoKVxuXHRcdHJldHVybiBtKHRoaXMuZ2V0TWFpbEFkZHJlc3NEaXNwbGF5Q2xhc3Nlcyh2aWV3TW9kZWwpLCBzZW5kZXIgPT0gbnVsbCA/IFwiXCIgOiBnZXRNYWlsQWRkcmVzc0Rpc3BsYXlUZXh0KHNlbmRlci5uYW1lLCBzZW5kZXIuYWRkcmVzcywgdHJ1ZSkpXG5cdH1cblxuXHRwcml2YXRlIGdldE1haWxBZGRyZXNzRGlzcGxheUNsYXNzZXModmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsKTogc3RyaW5nIHtcblx0XHRsZXQgY2xhc3NlcyA9IFwiLmZsZXgtZ3Jvdy50ZXh0LWVsbGlwc2lzXCJcblx0XHRpZiAodmlld01vZGVsLmlzVW5yZWFkKCkpIHtcblx0XHRcdGNsYXNzZXMgKz0gXCIuZm9udC13ZWlnaHQtNjAwXCJcblx0XHR9XG5cdFx0cmV0dXJuIGNsYXNzZXNcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyVW5yZWFkRG90KCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZsZXguZmxleC1uby1ncm93Lm5vLXNocmluay5wci1zXCIsXG5cdFx0XHRtKFwiLmRvdC5iZy1hY2NlbnQtZmdcIiwge1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdG1hcmdpblRvcDogMCxcblx0XHRcdFx0fSxcblx0XHRcdH0pLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVySWNvbihpY29uOiBBbGxJY29ucywgaG92ZXJUZXh0OiBzdHJpbmcgfCBudWxsID0gbnVsbCkge1xuXHRcdHJldHVybiBtKEljb24sIHtcblx0XHRcdGljb24sXG5cdFx0XHRjb250YWluZXI6IFwiZGl2XCIsXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRmaWxsOiB0aGVtZS5jb250ZW50X2J1dHRvbixcblx0XHRcdH0sXG5cdFx0XHRob3ZlclRleHQ6IGhvdmVyVGV4dCxcblx0XHR9KVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IENvbnZlcnNhdGlvbkl0ZW0sIENvbnZlcnNhdGlvblZpZXdNb2RlbCB9IGZyb20gXCIuL0NvbnZlcnNhdGlvblZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBNYWlsVmlld2VyIH0gZnJvbSBcIi4vTWFpbFZpZXdlci5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgQnV0dG9uLCBCdXR0b25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgZWxlbWVudElkUGFydCwgaXNTYW1lSWQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgQ29sbGFwc2VkTWFpbFZpZXcgfSBmcm9tIFwiLi9Db2xsYXBzZWRNYWlsVmlldy5qc1wiXG5pbXBvcnQgeyBNYWlsVmlld2VyVmlld01vZGVsIH0gZnJvbSBcIi4vTWFpbFZpZXdlclZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemUuanNcIlxuaW1wb3J0IHsgS2V5cyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBrZXlNYW5hZ2VyLCBTaG9ydGN1dCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9LZXlNYW5hZ2VyLmpzXCJcbmltcG9ydCB7IHN0eWxlcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3N0eWxlcy5qc1wiXG5pbXBvcnQgeyByZXNwb25zaXZlQ2FyZEhNYXJnaW4gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9jYXJkcy5qc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29udmVyc2F0aW9uVmlld2VyQXR0cnMge1xuXHR2aWV3TW9kZWw6IENvbnZlcnNhdGlvblZpZXdNb2RlbFxuXHRkZWxheUJvZHlSZW5kZXJpbmc6IFByb21pc2U8dW5rbm93bj5cbn1cblxuY29uc3QgU0NST0xMX0ZBQ1RPUiA9IDQgLyA1XG5cbmV4cG9ydCBjb25zdCBjb252ZXJzYXRpb25DYXJkTWFyZ2luID0gc2l6ZS5ocGFkX2xhcmdlXG5cbi8qKlxuICogRGlzcGxheXMgbWFpbHMgaW4gYSBjb252ZXJzYXRpb25cbiAqL1xuZXhwb3J0IGNsYXNzIENvbnZlcnNhdGlvblZpZXdlciBpbXBsZW1lbnRzIENvbXBvbmVudDxDb252ZXJzYXRpb25WaWV3ZXJBdHRycz4ge1xuXHRwcml2YXRlIGNvbnRhaW5lckRvbTogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGRpZFNjcm9sbCA9IGZhbHNlXG5cdC8qKiBpdGVtcyBmcm9tIHRoZSBsYXN0IHJlbmRlciwgd2UgbmVlZCB0aGVtIHRvIGNhbGN1bGF0ZSB0aGUgcmlnaHQgc3ViamVjdCBiYXNlZCBvbiB0aGUgc2Nyb2xsIHBvc2l0aW9uIHdpdGhvdXQgdGhlIGZ1bGwgcmUtcmVuZGVyLiAqL1xuXHRwcml2YXRlIGxhc3RJdGVtczogcmVhZG9ubHkgQ29udmVyc2F0aW9uSXRlbVtdIHwgbnVsbCA9IG51bGxcblxuXHRwcml2YXRlIHJlYWRvbmx5IHNob3J0Y3V0czogU2hvcnRjdXRbXSA9IFtcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuUEFHRV9VUCxcblx0XHRcdGV4ZWM6ICgpID0+IHRoaXMuc2Nyb2xsVXAoKSxcblx0XHRcdGhlbHA6IFwic2Nyb2xsVXBfYWN0aW9uXCIsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuUEFHRV9ET1dOLFxuXHRcdFx0ZXhlYzogKCkgPT4gdGhpcy5zY3JvbGxEb3duKCksXG5cdFx0XHRoZWxwOiBcInNjcm9sbERvd25fYWN0aW9uXCIsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuSE9NRSxcblx0XHRcdGV4ZWM6ICgpID0+IHRoaXMuc2Nyb2xsVG9Ub3AoKSxcblx0XHRcdGhlbHA6IFwic2Nyb2xsVG9Ub3BfYWN0aW9uXCIsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuRU5ELFxuXHRcdFx0ZXhlYzogKCkgPT4gdGhpcy5zY3JvbGxUb0JvdHRvbSgpLFxuXHRcdFx0aGVscDogXCJzY3JvbGxUb0JvdHRvbV9hY3Rpb25cIixcblx0XHR9LFxuXHRdXG5cblx0b25jcmVhdGUoKSB7XG5cdFx0a2V5TWFuYWdlci5yZWdpc3RlclNob3J0Y3V0cyh0aGlzLnNob3J0Y3V0cylcblx0fVxuXG5cdG9ucmVtb3ZlKCkge1xuXHRcdGtleU1hbmFnZXIudW5yZWdpc3RlclNob3J0Y3V0cyh0aGlzLnNob3J0Y3V0cylcblx0fVxuXG5cdHZpZXcodm5vZGU6IFZub2RlPENvbnZlcnNhdGlvblZpZXdlckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IHZpZXdNb2RlbCwgZGVsYXlCb2R5UmVuZGVyaW5nIH0gPSB2bm9kZS5hdHRyc1xuXG5cdFx0dmlld01vZGVsLmluaXQoZGVsYXlCb2R5UmVuZGVyaW5nKVxuXG5cdFx0dGhpcy5sYXN0SXRlbXMgPSB2aWV3TW9kZWwuY29udmVyc2F0aW9uSXRlbXMoKVxuXHRcdHRoaXMuZG9TY3JvbGwodmlld01vZGVsLCB0aGlzLmxhc3RJdGVtcylcblxuXHRcdHJldHVybiBtKFwiLmZpbGwtYWJzb2x1dGUubmF2LWJnLmZsZXguY29sXCIsIFtcblx0XHRcdC8vIHNlZSBjb21tZW50IGZvciAuc2Nyb2xsYmFyLWd1dHRlci1zdGFibGUtb3ItZmFsbGJhY2tcblx0XHRcdG0oXG5cdFx0XHRcdFwiLmZsZXgtZ3Jvdy5vdmVyZmxvdy15LXNjcm9sbFwiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5jb250YWluZXJEb20gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9ucmVtb3ZlOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcInJlbW92ZSBjb250YWluZXJcIilcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR0aGlzLnJlbmRlckl0ZW1zKHZpZXdNb2RlbCwgdGhpcy5sYXN0SXRlbXMpLFxuXHRcdFx0XHR0aGlzLnJlbmRlckxvYWRpbmdTdGF0ZSh2aWV3TW9kZWwpLFxuXHRcdFx0XHR0aGlzLnJlbmRlckZvb3RlcigpLFxuXHRcdFx0KSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJGb290ZXIoKSB7XG5cdFx0Ly8gSGF2aW5nIG1vcmUgcm9vbSBhdCB0aGUgYm90dG9tIGFsbG93cyB0aGUgbGFzdCBlbWFpbCBzbyBpdCBpcyAoYWxtb3N0KSBhbHdheXMgaW4gdGhlIHNhbWUgcGxhY2Ugb24gdGhlIHNjcmVlbi5cblx0XHQvLyBXZSByZWR1Y2Ugc3BhY2UgYnkgMTAwIGZvciB0aGUgaGVhZGVyIG9mIHRoZSB2aWV3ZXIgYW5kIGEgYml0IG1vcmVcblx0XHRjb25zdCBoZWlnaHQgPVxuXHRcdFx0ZG9jdW1lbnQuYm9keS5vZmZzZXRIZWlnaHQgLSAoc3R5bGVzLmlzVXNpbmdCb3R0b21OYXZpZ2F0aW9uKCkgPyBzaXplLm5hdmJhcl9oZWlnaHRfbW9iaWxlICsgc2l6ZS5ib3R0b21fbmF2X2JhciA6IHNpemUubmF2YmFyX2hlaWdodCkgLSAzMDBcblx0XHRyZXR1cm4gbShcIi5tdC1sLm5vcHJpbnRcIiwge1xuXHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0aGVpZ2h0OiBweChoZWlnaHQpLFxuXHRcdFx0fSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJJdGVtcyh2aWV3TW9kZWw6IENvbnZlcnNhdGlvblZpZXdNb2RlbCwgZW50cmllczogcmVhZG9ubHkgQ29udmVyc2F0aW9uSXRlbVtdKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBlbnRyaWVzLm1hcCgoZW50cnksIHBvc2l0aW9uKSA9PiB7XG5cdFx0XHRzd2l0Y2ggKGVudHJ5LnR5cGUpIHtcblx0XHRcdFx0Y2FzZSBcIm1haWxcIjoge1xuXHRcdFx0XHRcdGNvbnN0IG1haWxWaWV3TW9kZWwgPSBlbnRyeS52aWV3TW9kZWxcblx0XHRcdFx0XHRjb25zdCBpc1ByaW1hcnkgPSBtYWlsVmlld01vZGVsID09PSB2aWV3TW9kZWwucHJpbWFyeVZpZXdNb2RlbCgpXG5cdFx0XHRcdFx0Ly8gb25seSBwYXNzIGluIHBvc2l0aW9uIGlmIHdlIGRvIGhhdmUgYW4gYWN0dWFsIGNvbnZlcnNhdGlvbiBwb3NpdGlvblxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlclZpZXdlcihtYWlsVmlld01vZGVsLCBpc1ByaW1hcnksIHZpZXdNb2RlbC5pc0ZpbmlzaGVkKCkgPyBwb3NpdGlvbiA6IG51bGwpXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJMb2FkaW5nU3RhdGUodmlld01vZGVsOiBDb252ZXJzYXRpb25WaWV3TW9kZWwpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIHZpZXdNb2RlbC5pc0Nvbm5lY3Rpb25Mb3N0KClcblx0XHRcdD8gbShcblx0XHRcdFx0XHRcIi5jZW50ZXJcIixcblx0XHRcdFx0XHRtKEJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdFx0XHRsYWJlbDogXCJyZXRyeV9hY3Rpb25cIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB2aWV3TW9kZWwucmV0cnkoKSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdCAgKVxuXHRcdFx0OiAhdmlld01vZGVsLmlzRmluaXNoZWQoKVxuXHRcdFx0PyBtKFxuXHRcdFx0XHRcdFwiLmZvbnQtd2VpZ2h0LTYwMC5jZW50ZXIubXQtbFwiICsgXCIuXCIgKyByZXNwb25zaXZlQ2FyZEhNYXJnaW4oKSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9idXR0b24sXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0bGFuZy5nZXQoXCJsb2FkaW5nX21zZ1wiKSxcblx0XHRcdCAgKVxuXHRcdFx0OiBudWxsXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclZpZXdlcihtYWlsVmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsLCBpc1ByaW1hcnk6IGJvb2xlYW4sIHBvc2l0aW9uOiBudW1iZXIgfCBudWxsKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIubWxyLXNhZmUtaW5zZXRcIixcblx0XHRcdG0oXG5cdFx0XHRcdFwiLmJvcmRlci1yYWRpdXMtYmlnLnJlbFwiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y2xhc3M6IHJlc3BvbnNpdmVDYXJkSE1hcmdpbigpLFxuXHRcdFx0XHRcdGtleTogZWxlbWVudElkUGFydChtYWlsVmlld01vZGVsLm1haWwuY29udmVyc2F0aW9uRW50cnkpLFxuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lLmNvbnRlbnRfYmcsXG5cdFx0XHRcdFx0XHRtYXJnaW5Ub3A6IHB4KHBvc2l0aW9uID09IG51bGwgfHwgcG9zaXRpb24gPT09IDAgPyAwIDogY29udmVyc2F0aW9uQ2FyZE1hcmdpbiksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0bWFpbFZpZXdNb2RlbC5pc0NvbGxhcHNlZCgpXG5cdFx0XHRcdFx0PyBtKENvbGxhcHNlZE1haWxWaWV3LCB7XG5cdFx0XHRcdFx0XHRcdHZpZXdNb2RlbDogbWFpbFZpZXdNb2RlbCxcblx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0OiBtKE1haWxWaWV3ZXIsIHtcblx0XHRcdFx0XHRcdFx0dmlld01vZGVsOiBtYWlsVmlld01vZGVsLFxuXHRcdFx0XHRcdFx0XHRpc1ByaW1hcnk6IGlzUHJpbWFyeSxcblx0XHRcdFx0XHRcdFx0Ly8gd2Ugd2FudCB0byBleHBhbmQgZm9yIHRoZSBmaXJzdCBlbWFpbCBsaWtlIHdoZW4gaXQncyBhIGZvcndhcmRlZCBlbWFpbFxuXHRcdFx0XHRcdFx0XHRkZWZhdWx0UXVvdGVCZWhhdmlvcjogcG9zaXRpb24gPT09IDAgPyBcImV4cGFuZFwiIDogXCJjb2xsYXBzZVwiLFxuXHRcdFx0XHRcdCAgfSksXG5cdFx0XHQpLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgZG9TY3JvbGwodmlld01vZGVsOiBDb252ZXJzYXRpb25WaWV3TW9kZWwsIGl0ZW1zOiByZWFkb25seSBDb252ZXJzYXRpb25JdGVtW10pIHtcblx0XHRjb25zdCBjb250YWluZXJEb20gPSB0aGlzLmNvbnRhaW5lckRvbVxuXHRcdGlmICghdGhpcy5kaWRTY3JvbGwgJiYgY29udGFpbmVyRG9tICYmIHZpZXdNb2RlbC5pc0ZpbmlzaGVkKCkpIHtcblx0XHRcdGNvbnN0IGNvbnZlcnNhdGlvbklkID0gdmlld01vZGVsLnByaW1hcnlNYWlsLmNvbnZlcnNhdGlvbkVudHJ5XG5cblx0XHRcdHRoaXMuZGlkU2Nyb2xsID0gdHJ1ZVxuXHRcdFx0Ly8gV2UgbmVlZCB0byBkbyB0aGlzIGF0IHRoZSBlbmQgb2YgdGhlIGZyYW1lIHdoZW4gZXZlcnkgY2hhbmdlIGlzIGFscmVhZHkgYXBwbGllZC5cblx0XHRcdC8vIFByb21pc2UucmVzb2x2ZSgpIHNjaGVkdWxlcyBhIG1pY3JvdGFzayBleGFjdGx5IHdoZXJlIHdlIG5lZWQgaXQuXG5cdFx0XHQvLyBSQUYgaXMgdG9vIGxvbmcgYW5kIHdvdWxkIGZsYXNoIHRoZSB3cm9uZyBmcmFtZVxuXHRcdFx0UHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cdFx0XHRcdC8vIFRoZXJlJ3MgYSBjaGFuY2UgdGhhdCBpdGVtIGFyZSBub3QgaW4gc3luYyB3aXRoIGRvbSBidXQgaXQncyB2ZXJ5IHVubGlrZWx5LCB0aGlzIGlzIHRoZSBzYW1lIGZyYW1lIGFmdGVyIHRoZSBsYXN0IHJlbmRlciB3ZSB1c2VkIHRoZSBpdGVtc1xuXHRcdFx0XHQvLyBhbmQgdmlld01vZGVsIGlzIGZpbmlzaGVkLlxuXHRcdFx0XHRjb25zdCBpdGVtSW5kZXggPSBpdGVtcy5maW5kSW5kZXgoKGUpID0+IGUudHlwZSA9PT0gXCJtYWlsXCIgJiYgaXNTYW1lSWQoZS5lbnRyeUlkLCBjb252ZXJzYXRpb25JZCkpXG5cdFx0XHRcdC8vIERvbid0IHNjcm9sbCBpZiBpdCdzIGFscmVhZHkgdGhlIGZpcnN0IChvciBpZiB3ZSBkaWRuJ3QgZmluZCBpdCBidXQgdGhhdCB3b3VsZCBiZSB3ZWlyZClcblx0XHRcdFx0aWYgKGl0ZW1JbmRleCA+IDApIHtcblx0XHRcdFx0XHRjb25zdCBjaGlsZERvbSA9IGNvbnRhaW5lckRvbS5jaGlsZE5vZGVzW2l0ZW1JbmRleF0gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHRjb25zdCBwYXJlbnRUb3AgPSBjb250YWluZXJEb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG5cdFx0XHRcdFx0Y29uc3QgY2hpbGRUb3AgPSBjaGlsZERvbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3Bcblx0XHRcdFx0XHRjb25zdCByZWxhdGl2ZVRvcCA9IGNoaWxkVG9wIC0gcGFyZW50VG9wXG5cdFx0XHRcdFx0Y29uc3QgdG9wID0gcmVsYXRpdmVUb3AgLSBjb252ZXJzYXRpb25DYXJkTWFyZ2luICogMiAtIDEwXG5cdFx0XHRcdFx0Y29udGFpbmVyRG9tLnNjcm9sbFRvKHsgdG9wOiB0b3AgfSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHNjcm9sbFVwKCk6IHZvaWQge1xuXHRcdGlmICh0aGlzLmNvbnRhaW5lckRvbSkge1xuXHRcdFx0dGhpcy5jb250YWluZXJEb20uc2Nyb2xsQnkoeyB0b3A6IC10aGlzLmNvbnRhaW5lckRvbS5jbGllbnRIZWlnaHQgKiBTQ1JPTExfRkFDVE9SLCBiZWhhdmlvcjogXCJzbW9vdGhcIiB9KVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgc2Nyb2xsRG93bigpOiB2b2lkIHtcblx0XHRpZiAodGhpcy5jb250YWluZXJEb20pIHtcblx0XHRcdHRoaXMuY29udGFpbmVyRG9tLnNjcm9sbEJ5KHsgdG9wOiB0aGlzLmNvbnRhaW5lckRvbS5jbGllbnRIZWlnaHQgKiBTQ1JPTExfRkFDVE9SLCBiZWhhdmlvcjogXCJzbW9vdGhcIiB9KVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgc2Nyb2xsVG9Ub3AoKTogdm9pZCB7XG5cdFx0aWYgKHRoaXMuY29udGFpbmVyRG9tKSB7XG5cdFx0XHR0aGlzLmNvbnRhaW5lckRvbS5zY3JvbGxUbyh7IHRvcDogMCwgYmVoYXZpb3I6IFwic21vb3RoXCIgfSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHNjcm9sbFRvQm90dG9tKCk6IHZvaWQge1xuXHRcdGlmICh0aGlzLmNvbnRhaW5lckRvbSkge1xuXHRcdFx0dGhpcy5jb250YWluZXJEb20uc2Nyb2xsVG8oeyB0b3A6IHRoaXMuY29udGFpbmVyRG9tLnNjcm9sbEhlaWdodCAtIHRoaXMuY29udGFpbmVyRG9tLm9mZnNldEhlaWdodCwgYmVoYXZpb3I6IFwic21vb3RoXCIgfSlcblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgTWFpbGJveE1vZGVsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9NYWlsYm94TW9kZWwuanNcIlxuaW1wb3J0IHsgTWFpbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IEljb25CdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgcHJvbXB0QW5kRGVsZXRlTWFpbHMsIHNob3dNb3ZlTWFpbHNEcm9wZG93biB9IGZyb20gXCIuL01haWxHdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBub09wLCBvZkNsYXNzIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnMuanNcIlxuaW1wb3J0IHsgTWFpbFZpZXdlclZpZXdNb2RlbCB9IGZyb20gXCIuL01haWxWaWV3ZXJWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgVXNlckVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Vc2VyRXJyb3IuanNcIlxuaW1wb3J0IHsgc2hvd1VzZXJFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9FcnJvckhhbmRsZXJJbXBsLmpzXCJcbmltcG9ydCB7IGNyZWF0ZURyb3Bkb3duLCBEcm9wZG93bkJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyBlZGl0RHJhZnQsIG1haWxWaWV3ZXJNb3JlQWN0aW9ucyB9IGZyb20gXCIuL01haWxWaWV3ZXJVdGlscy5qc1wiXG5pbXBvcnQgeyBCdXR0b25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgaXNBcHAgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3IuanNcIlxuaW1wb3J0IHsgc2hvd1Byb2dyZXNzRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvZGlhbG9ncy9Qcm9ncmVzc0RpYWxvZy5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IERpYWxvZ0hlYWRlckJhckF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2dIZWFkZXJCYXIuanNcIlxuaW1wb3J0IHsgRGlhbG9nLCBEaWFsb2dUeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2cuanNcIlxuaW1wb3J0IHsgQ29sdW1uV2lkdGgsIFRhYmxlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9UYWJsZS5qc1wiXG5pbXBvcnQgeyBFeHBhbmRlckJ1dHRvbiwgRXhwYW5kZXJQYW5lbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRXhwYW5kZXIuanNcIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgZXhwb3J0TWFpbHMgfSBmcm9tIFwiLi4vZXhwb3J0L0V4cG9ydGVyLmpzXCJcbmltcG9ydCB7IE1haWxNb2RlbCB9IGZyb20gXCIuLi9tb2RlbC9NYWlsTW9kZWwuanNcIlxuaW1wb3J0IHsgTGFiZWxzUG9wdXAgfSBmcm9tIFwiLi9MYWJlbHNQb3B1cC5qc1wiXG5pbXBvcnQgeyBhbGxJblNhbWVNYWlsYm94IH0gZnJvbSBcIi4uL21vZGVsL01haWxVdGlsc1wiXG5pbXBvcnQgeyBzdHlsZXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zdHlsZXNcIlxuXG4vKlxuXHRub3RlIHRoYXQgbWFpbFZpZXdlclZpZXdNb2RlbCBoYXMgYSBtYWlsTW9kZWwsIHNvIHlvdSBkbyBub3QgbmVlZCB0byBwYXNzIGJvdGggaWYgeW91IHBhc3MgYSBtYWlsVmlld2VyVmlld01vZGVsXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWFpbFZpZXdlclRvb2xiYXJBdHRycyB7XG5cdG1haWxib3hNb2RlbDogTWFpbGJveE1vZGVsXG5cdG1haWxNb2RlbDogTWFpbE1vZGVsXG5cdG1haWxWaWV3ZXJWaWV3TW9kZWw/OiBNYWlsVmlld2VyVmlld01vZGVsXG5cdG1haWxzOiBNYWlsW11cblx0c2VsZWN0Tm9uZT86ICgpID0+IHZvaWRcbn1cblxuLy8gTm90ZTogdGhpcyBpcyBvbmx5IHVzZWQgZm9yIG5vbi1tb2JpbGUgdmlld3MuIFBsZWFzZSBhbHNvIHVwZGF0ZSBNb2JpbGVNYWlsTXVsdGlzZWxlY3Rpb25BY3Rpb25CYXIgb3IgTW9iaWxlTWFpbEFjdGlvbkJhclxuZXhwb3J0IGNsYXNzIE1haWxWaWV3ZXJBY3Rpb25zIGltcGxlbWVudHMgQ29tcG9uZW50PE1haWxWaWV3ZXJUb29sYmFyQXR0cnM+IHtcblx0dmlldyh2bm9kZTogVm5vZGU8TWFpbFZpZXdlclRvb2xiYXJBdHRycz4pIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4Lm1sLWJldHdlZW4tcy5pdGVtcy1jZW50ZXJcIiwgW1xuXHRcdFx0dGhpcy5yZW5kZXJTaW5nbGVNYWlsQWN0aW9ucyh2bm9kZS5hdHRycyksXG5cdFx0XHR2bm9kZS5hdHRycy5tYWlsVmlld2VyVmlld01vZGVsID8gbShcIi5uYXYtYmFyLXNwYWNlclwiKSA6IG51bGwsXG5cdFx0XHR0aGlzLnJlbmRlckFjdGlvbnModm5vZGUuYXR0cnMpLFxuXHRcdFx0dGhpcy5yZW5kZXJNb3JlQnV0dG9uKHZub2RlLmF0dHJzLm1haWxWaWV3ZXJWaWV3TW9kZWwpLFxuXHRcdF0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckFjdGlvbnMoYXR0cnM6IE1haWxWaWV3ZXJUb29sYmFyQXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgbWFpbE1vZGVsID0gYXR0cnMubWFpbFZpZXdlclZpZXdNb2RlbCA/IGF0dHJzLm1haWxWaWV3ZXJWaWV3TW9kZWwubWFpbE1vZGVsIDogYXR0cnMubWFpbE1vZGVsXG5cblx0XHRpZiAoIW1haWxNb2RlbCB8fCAhYXR0cnMubWFpbHMpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fSBlbHNlIGlmIChhdHRycy5tYWlsVmlld2VyVmlld01vZGVsKSB7XG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHR0aGlzLnJlbmRlckRlbGV0ZUJ1dHRvbihtYWlsTW9kZWwsIGF0dHJzLm1haWxzLCBhdHRycy5zZWxlY3ROb25lID8/IG5vT3ApLFxuXHRcdFx0XHRhdHRycy5tYWlsVmlld2VyVmlld01vZGVsLmNhbkZvcndhcmRPck1vdmUoKSA/IHRoaXMucmVuZGVyTW92ZUJ1dHRvbihhdHRycy5tYWlsYm94TW9kZWwsIG1haWxNb2RlbCwgYXR0cnMubWFpbHMpIDogbnVsbCxcblx0XHRcdFx0YXR0cnMubWFpbE1vZGVsLmNhbkFzc2lnbkxhYmVscygpID8gdGhpcy5yZW5kZXJMYWJlbEJ1dHRvbihtYWlsTW9kZWwsIGF0dHJzLm1haWxzKSA6IG51bGwsXG5cdFx0XHRcdGF0dHJzLm1haWxWaWV3ZXJWaWV3TW9kZWwuaXNEcmFmdE1haWwoKSA/IG51bGwgOiB0aGlzLnJlbmRlclJlYWRCdXR0b24oYXR0cnMpLFxuXHRcdFx0XVxuXHRcdH0gZWxzZSBpZiAoYXR0cnMubWFpbHMubGVuZ3RoID4gMCkge1xuXHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0dGhpcy5yZW5kZXJEZWxldGVCdXR0b24obWFpbE1vZGVsLCBhdHRycy5tYWlscywgYXR0cnMuc2VsZWN0Tm9uZSA/PyBub09wKSxcblx0XHRcdFx0YXR0cnMubWFpbE1vZGVsLmlzTW92aW5nTWFpbHNBbGxvd2VkKCkgPyB0aGlzLnJlbmRlck1vdmVCdXR0b24oYXR0cnMubWFpbGJveE1vZGVsLCBtYWlsTW9kZWwsIGF0dHJzLm1haWxzKSA6IG51bGwsXG5cdFx0XHRcdGF0dHJzLm1haWxNb2RlbC5jYW5Bc3NpZ25MYWJlbHMoKSAmJiBhbGxJblNhbWVNYWlsYm94KGF0dHJzLm1haWxzKSA/IHRoaXMucmVuZGVyTGFiZWxCdXR0b24obWFpbE1vZGVsLCBhdHRycy5tYWlscykgOiBudWxsLFxuXHRcdFx0XHR0aGlzLnJlbmRlclJlYWRCdXR0b24oYXR0cnMpLFxuXHRcdFx0XHR0aGlzLnJlbmRlckV4cG9ydEJ1dHRvbihhdHRycyksXG5cdFx0XHRdXG5cdFx0fVxuXHR9XG5cblx0Lypcblx0ICogQWN0aW9ucyB0aGF0IGNhbiBvbmx5IGJlIHRha2VuIG9uIGEgc2luZ2xlIG1haWwgKHJlcGx5LCBmb3J3YXJkLCBlZGl0LCBhc3NpZ24pXG5cdCAqIFdpbGwgb25seSByZXR1cm4gYWN0aW9ucyBpZiB0aGVyZSBpcyBhIG1haWxWaWV3ZXJWaWV3TW9kZWxcblx0ICogKi9cblx0cHJpdmF0ZSByZW5kZXJTaW5nbGVNYWlsQWN0aW9ucyhhdHRyczogTWFpbFZpZXdlclRvb2xiYXJBdHRycyk6IENoaWxkcmVuIHtcblx0XHQvLyBtYWlsVmlld2VyVmlld01vZGVsIG1lYW5zIHdlIGFyZSB2aWV3aW5nIG9uZSBtYWlsOyBpZiB0aGVyZSBpcyBvbmx5IHRoZSBtYWlsTW9kZWwsIGl0IGlzIGNvbWluZyBmcm9tIGEgTXVsdGlWaWV3ZXJcblx0XHRpZiAoYXR0cnMubWFpbFZpZXdlclZpZXdNb2RlbCkge1xuXHRcdFx0aWYgKGF0dHJzLm1haWxWaWV3ZXJWaWV3TW9kZWwuaXNBbm5vdW5jZW1lbnQoKSkge1xuXHRcdFx0XHRyZXR1cm4gW11cblx0XHRcdH0gZWxzZSBpZiAoYXR0cnMubWFpbFZpZXdlclZpZXdNb2RlbC5pc0RyYWZ0TWFpbCgpKSB7XG5cdFx0XHRcdHJldHVybiBbdGhpcy5yZW5kZXJFZGl0QnV0dG9uKGF0dHJzLm1haWxWaWV3ZXJWaWV3TW9kZWwpXVxuXHRcdFx0fSBlbHNlIGlmIChhdHRycy5tYWlsVmlld2VyVmlld01vZGVsLmNhbkZvcndhcmRPck1vdmUoKSkge1xuXHRcdFx0XHRyZXR1cm4gW3RoaXMucmVuZGVyUmVwbHlCdXR0b24oYXR0cnMubWFpbFZpZXdlclZpZXdNb2RlbCksIHRoaXMucmVuZGVyRm9yd2FyZEJ1dHRvbihhdHRycy5tYWlsVmlld2VyVmlld01vZGVsKV1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBbdGhpcy5yZW5kZXJSZXBseUJ1dHRvbihhdHRycy5tYWlsVmlld2VyVmlld01vZGVsKV1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFtdXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJEZWxldGVCdXR0b24obWFpbE1vZGVsOiBNYWlsTW9kZWwsIG1haWxzOiBNYWlsW10sIHNlbGVjdE5vbmU6ICgpID0+IHZvaWQpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwiZGVsZXRlX2FjdGlvblwiLFxuXHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0cHJvbXB0QW5kRGVsZXRlTWFpbHMobWFpbE1vZGVsLCBtYWlscywgc2VsZWN0Tm9uZSlcblx0XHRcdH0sXG5cdFx0XHRpY29uOiBJY29ucy5UcmFzaCxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJNb3ZlQnV0dG9uKG1haWxib3hNb2RlbDogTWFpbGJveE1vZGVsLCBtYWlsTW9kZWw6IE1haWxNb2RlbCwgbWFpbHM6IE1haWxbXSk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJtb3ZlX2FjdGlvblwiLFxuXHRcdFx0aWNvbjogSWNvbnMuRm9sZGVyLFxuXHRcdFx0Y2xpY2s6IChlLCBkb20pID0+IHNob3dNb3ZlTWFpbHNEcm9wZG93bihtYWlsYm94TW9kZWwsIG1haWxNb2RlbCwgZG9tLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBtYWlscyksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTGFiZWxCdXR0b24obWFpbE1vZGVsOiBNYWlsTW9kZWwsIG1haWxzOiBNYWlsW10pOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwiYXNzaWduTGFiZWxfYWN0aW9uXCIsXG5cdFx0XHRpY29uOiBJY29ucy5MYWJlbCxcblx0XHRcdGNsaWNrOiAoXywgZG9tKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHBvcHVwID0gbmV3IExhYmVsc1BvcHVwKFxuXHRcdFx0XHRcdGRvbSxcblx0XHRcdFx0XHRkb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG5cdFx0XHRcdFx0c3R5bGVzLmlzRGVza3RvcExheW91dCgpID8gMzAwIDogMjAwLFxuXHRcdFx0XHRcdG1haWxNb2RlbC5nZXRMYWJlbHNGb3JNYWlscyhtYWlscyksXG5cdFx0XHRcdFx0bWFpbE1vZGVsLmdldExhYmVsU3RhdGVzRm9yTWFpbHMobWFpbHMpLFxuXHRcdFx0XHRcdChhZGRlZExhYmVscywgcmVtb3ZlZExhYmVscykgPT4gbWFpbE1vZGVsLmFwcGx5TGFiZWxzKG1haWxzLCBhZGRlZExhYmVscywgcmVtb3ZlZExhYmVscyksXG5cdFx0XHRcdClcblx0XHRcdFx0cG9wdXAuc2hvdygpXG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclJlYWRCdXR0b24oeyBtYWlsTW9kZWwsIG1haWxWaWV3ZXJWaWV3TW9kZWwsIG1haWxzIH06IE1haWxWaWV3ZXJUb29sYmFyQXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgbWFya0FjdGlvbjogKHVucmVhZDogYm9vbGVhbikgPT4gdW5rbm93biA9IG1haWxWaWV3ZXJWaWV3TW9kZWxcblx0XHRcdD8gKHVucmVhZCkgPT4gbWFpbFZpZXdlclZpZXdNb2RlbC5zZXRVbnJlYWQodW5yZWFkKVxuXHRcdFx0OiAodW5yZWFkKSA9PiBtYWlsTW9kZWwubWFya01haWxzKG1haWxzLCB1bnJlYWQpXG5cblx0XHRjb25zdCBtYXJrUmVhZEJ1dHRvbiA9IG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwibWFya1JlYWRfYWN0aW9uXCIsXG5cdFx0XHRjbGljazogKCkgPT4gbWFya0FjdGlvbihmYWxzZSksXG5cdFx0XHRpY29uOiBJY29ucy5FeWUsXG5cdFx0fSlcblx0XHRjb25zdCBtYXJrVW5yZWFkQnV0dG9uID0gbShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJtYXJrVW5yZWFkX2FjdGlvblwiLFxuXHRcdFx0Y2xpY2s6ICgpID0+IG1hcmtBY3Rpb24odHJ1ZSksXG5cdFx0XHRpY29uOiBJY29ucy5Ob0V5ZSxcblx0XHR9KVxuXG5cdFx0Ly8gbWFpbFZpZXdlclZpZXdNb2RlbCBtZWFucyB3ZSBhcmUgdmlld2luZyBvbmUgbWFpbDsgaWYgdGhlcmUgaXMgb25seSB0aGUgbWFpbE1vZGVsLCBpdCBpcyBjb21pbmcgZnJvbSBhIE11bHRpVmlld2VyXG5cdFx0aWYgKG1haWxWaWV3ZXJWaWV3TW9kZWwpIHtcblx0XHRcdGlmIChtYWlsVmlld2VyVmlld01vZGVsLmlzVW5yZWFkKCkpIHtcblx0XHRcdFx0cmV0dXJuIG1hcmtSZWFkQnV0dG9uXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gbWFya1VucmVhZEJ1dHRvblxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBbbWFya1JlYWRCdXR0b24sIG1hcmtVbnJlYWRCdXR0b25dXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckV4cG9ydEJ1dHRvbihhdHRyczogTWFpbFZpZXdlclRvb2xiYXJBdHRycykge1xuXHRcdGlmICghaXNBcHAoKSAmJiBhdHRycy5tYWlsTW9kZWwuaXNFeHBvcnRpbmdNYWlsc0FsbG93ZWQoKSkge1xuXHRcdFx0Y29uc3Qgb3BlcmF0aW9uID0gbG9jYXRvci5vcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIuc3RhcnROZXdPcGVyYXRpb24oKVxuXHRcdFx0Y29uc3QgYWMgPSBuZXcgQWJvcnRDb250cm9sbGVyKClcblx0XHRcdGNvbnN0IGhlYWRlckJhckF0dHJzOiBEaWFsb2dIZWFkZXJCYXJBdHRycyA9IHtcblx0XHRcdFx0bGVmdDogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImNhbmNlbF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBhYy5hYm9ydCgpLFxuXHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdFx0bWlkZGxlOiBcImVtcHR5U3RyaW5nX21zZ1wiLFxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdHRpdGxlOiBcImV4cG9ydF9hY3Rpb25cIixcblx0XHRcdFx0Y2xpY2s6ICgpID0+XG5cdFx0XHRcdFx0c2hvd1Byb2dyZXNzRGlhbG9nKFxuXHRcdFx0XHRcdFx0bGFuZy5nZXRUcmFuc2xhdGlvbihcIm1haWxFeHBvcnRQcm9ncmVzc19tc2dcIiwge1xuXHRcdFx0XHRcdFx0XHRcIntjdXJyZW50fVwiOiBNYXRoLnJvdW5kKChvcGVyYXRpb24ucHJvZ3Jlc3MoKSAvIDEwMCkgKiBhdHRycy5tYWlscy5sZW5ndGgpLnRvRml4ZWQoMCksXG5cdFx0XHRcdFx0XHRcdFwie3RvdGFsfVwiOiBhdHRycy5tYWlscy5sZW5ndGgsXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdGV4cG9ydE1haWxzKFxuXHRcdFx0XHRcdFx0XHRhdHRycy5tYWlscyxcblx0XHRcdFx0XHRcdFx0bG9jYXRvci5tYWlsRmFjYWRlLFxuXHRcdFx0XHRcdFx0XHRsb2NhdG9yLmVudGl0eUNsaWVudCxcblx0XHRcdFx0XHRcdFx0bG9jYXRvci5maWxlQ29udHJvbGxlcixcblx0XHRcdFx0XHRcdFx0bG9jYXRvci5jcnlwdG9GYWNhZGUsXG5cdFx0XHRcdFx0XHRcdG9wZXJhdGlvbi5pZCxcblx0XHRcdFx0XHRcdFx0YWMuc2lnbmFsLFxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0XHQudGhlbigocmVzdWx0KSA9PiB0aGlzLmhhbmRsZUV4cG9ydEVtYWlsc1Jlc3VsdChyZXN1bHQuZmFpbGVkKSlcblx0XHRcdFx0XHRcdFx0LmZpbmFsbHkob3BlcmF0aW9uLmRvbmUpLFxuXHRcdFx0XHRcdFx0b3BlcmF0aW9uLnByb2dyZXNzLFxuXHRcdFx0XHRcdFx0dHJ1ZSxcblx0XHRcdFx0XHRcdGhlYWRlckJhckF0dHJzLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdGljb246IEljb25zLkV4cG9ydCxcblx0XHRcdH0pXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBoYW5kbGVFeHBvcnRFbWFpbHNSZXN1bHQobWFpbExpc3Q6IE1haWxbXSkge1xuXHRcdGlmIChtYWlsTGlzdCAmJiBtYWlsTGlzdC5sZW5ndGggPiAwKSB7XG5cdFx0XHRjb25zdCBsaW5lcyA9IG1haWxMaXN0Lm1hcCgobWFpbCkgPT4gKHtcblx0XHRcdFx0Y2VsbHM6IFttYWlsLnNlbmRlci5hZGRyZXNzLCBtYWlsLnN1YmplY3RdLFxuXHRcdFx0XHRhY3Rpb25CdXR0b25BdHRyczogbnVsbCxcblx0XHRcdH0pKVxuXG5cdFx0XHRjb25zdCBleHBhbmRlZCA9IHN0cmVhbTxib29sZWFuPihmYWxzZSlcblx0XHRcdGNvbnN0IGRpYWxvZyA9IERpYWxvZy5jcmVhdGVBY3Rpb25EaWFsb2coe1xuXHRcdFx0XHR0aXRsZTogXCJmYWlsZWRUb0V4cG9ydF90aXRsZVwiLFxuXHRcdFx0XHRjaGlsZDogKCkgPT5cblx0XHRcdFx0XHRtKFwiXCIsIFtcblx0XHRcdFx0XHRcdG0oXCIucHQtbVwiLCBsYW5nLmdldChcImZhaWxlZFRvRXhwb3J0X21zZ1wiKSksXG5cdFx0XHRcdFx0XHRtKFwiLmZsZXgtc3RhcnQuaXRlbXMtY2VudGVyXCIsIFtcblx0XHRcdFx0XHRcdFx0bShFeHBhbmRlckJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcblx0XHRcdFx0XHRcdFx0XHRcdFwiaGlkZV9zaG93XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRgJHtsYW5nLmdldChleHBhbmRlZCgpID8gXCJoaWRlX2FjdGlvblwiIDogXCJzaG93X2FjdGlvblwiKX0gJHtsYW5nLmdldChcImZhaWxlZFRvRXhwb3J0X2xhYmVsXCIsIHsgXCJ7MH1cIjogbWFpbExpc3QubGVuZ3RoIH0pfWAsXG5cdFx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0XHRleHBhbmRlZDogZXhwYW5kZWQoKSxcblx0XHRcdFx0XHRcdFx0XHRvbkV4cGFuZGVkQ2hhbmdlOiBleHBhbmRlZCxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdEV4cGFuZGVyUGFuZWwsXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRleHBhbmRlZDogZXhwYW5kZWQoKSxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0bShUYWJsZSwge1xuXHRcdFx0XHRcdFx0XHRcdGNvbHVtbkhlYWRpbmc6IFtcImVtYWlsX2xhYmVsXCIsIFwic3ViamVjdF9sYWJlbFwiXSxcblx0XHRcdFx0XHRcdFx0XHRjb2x1bW5XaWR0aHM6IFtDb2x1bW5XaWR0aC5MYXJnZXN0LCBDb2x1bW5XaWR0aC5MYXJnZXN0XSxcblx0XHRcdFx0XHRcdFx0XHRzaG93QWN0aW9uQnV0dG9uQ29sdW1uOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRsaW5lcyxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRva0FjdGlvbjogKCkgPT4gZGlhbG9nLmNsb3NlKCksXG5cdFx0XHRcdGFsbG93Q2FuY2VsOiBmYWxzZSxcblx0XHRcdFx0b2tBY3Rpb25UZXh0SWQ6IFwib2tfYWN0aW9uXCIsXG5cdFx0XHRcdHR5cGU6IERpYWxvZ1R5cGUuRWRpdE1lZGl1bSxcblx0XHRcdH0pXG5cblx0XHRcdGRpYWxvZy5zaG93KClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclJlcGx5QnV0dG9uKHZpZXdNb2RlbDogTWFpbFZpZXdlclZpZXdNb2RlbCkge1xuXHRcdGNvbnN0IGFjdGlvbnM6IENoaWxkcmVuID0gW11cblx0XHRhY3Rpb25zLnB1c2goXG5cdFx0XHRtKEljb25CdXR0b24sIHtcblx0XHRcdFx0dGl0bGU6IFwicmVwbHlfYWN0aW9uXCIsXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiB2aWV3TW9kZWwucmVwbHkoZmFsc2UpLFxuXHRcdFx0XHRpY29uOiBJY29ucy5SZXBseSxcblx0XHRcdH0pLFxuXHRcdClcblxuXHRcdGlmICh2aWV3TW9kZWwuY2FuUmVwbHlBbGwoKSkge1xuXHRcdFx0YWN0aW9ucy5wdXNoKFxuXHRcdFx0XHRtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHR0aXRsZTogXCJyZXBseUFsbF9hY3Rpb25cIixcblx0XHRcdFx0XHRjbGljazogKCkgPT4gdmlld01vZGVsLnJlcGx5KHRydWUpLFxuXHRcdFx0XHRcdGljb246IEljb25zLlJlcGx5QWxsLFxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHR9XG5cdFx0cmV0dXJuIGFjdGlvbnNcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRm9yd2FyZEJ1dHRvbih2aWV3TW9kZWw6IE1haWxWaWV3ZXJWaWV3TW9kZWwpIHtcblx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJmb3J3YXJkX2FjdGlvblwiLFxuXHRcdFx0Y2xpY2s6ICgpID0+IHZpZXdNb2RlbC5mb3J3YXJkKCkuY2F0Y2gob2ZDbGFzcyhVc2VyRXJyb3IsIHNob3dVc2VyRXJyb3IpKSxcblx0XHRcdGljb246IEljb25zLkZvcndhcmQsXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTW9yZUJ1dHRvbih2aWV3TW9kZWw6IE1haWxWaWV3ZXJWaWV3TW9kZWwgfCB1bmRlZmluZWQpOiBDaGlsZHJlbiB7XG5cdFx0bGV0IGFjdGlvbnM6IERyb3Bkb3duQnV0dG9uQXR0cnNbXSA9IFtdXG5cblx0XHRpZiAodmlld01vZGVsKSB7XG5cdFx0XHRhY3Rpb25zID0gbWFpbFZpZXdlck1vcmVBY3Rpb25zKHZpZXdNb2RlbCwgZmFsc2UpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFjdGlvbnMubGVuZ3RoID4gMFxuXHRcdFx0PyBtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHR0aXRsZTogXCJtb3JlX2xhYmVsXCIsXG5cdFx0XHRcdFx0aWNvbjogSWNvbnMuTW9yZSxcblx0XHRcdFx0XHRjbGljazogY3JlYXRlRHJvcGRvd24oe1xuXHRcdFx0XHRcdFx0bGF6eUJ1dHRvbnM6ICgpID0+IGFjdGlvbnMsXG5cdFx0XHRcdFx0XHR3aWR0aDogMzAwLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0ICB9KVxuXHRcdFx0OiBudWxsXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckVkaXRCdXR0b24odmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsKSB7XG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwiZWRpdF9hY3Rpb25cIixcblx0XHRcdGNsaWNrOiAoKSA9PiBlZGl0RHJhZnQodmlld01vZGVsKSxcblx0XHRcdGljb246IEljb25zLkVkaXQsXG5cdFx0fSlcblx0fVxufVxuIiwiaW1wb3J0IHsgTWFpbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuLCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IEljb25CdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zLmpzXCJcbmltcG9ydCB7IHByb21wdEFuZERlbGV0ZU1haWxzLCBzaG93TW92ZU1haWxzRHJvcGRvd24gfSBmcm9tIFwiLi9NYWlsR3VpVXRpbHMuanNcIlxuaW1wb3J0IHsgRFJPUERPV05fTUFSR0lOIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyBNb2JpbGVCb3R0b21BY3Rpb25CYXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9Nb2JpbGVCb3R0b21BY3Rpb25CYXIuanNcIlxuaW1wb3J0IHsgTWFpbGJveE1vZGVsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9NYWlsYm94TW9kZWwuanNcIlxuaW1wb3J0IHsgTWFpbE1vZGVsIH0gZnJvbSBcIi4uL21vZGVsL01haWxNb2RlbC5qc1wiXG5pbXBvcnQgeyBMYWJlbHNQb3B1cCB9IGZyb20gXCIuL0xhYmVsc1BvcHVwLmpzXCJcbmltcG9ydCB7IGFsbEluU2FtZU1haWxib3ggfSBmcm9tIFwiLi4vbW9kZWwvTWFpbFV0aWxzXCJcblxuZXhwb3J0IGludGVyZmFjZSBNb2JpbGVNYWlsTXVsdGlzZWxlY3Rpb25BY3Rpb25CYXJBdHRycyB7XG5cdG1haWxzOiByZWFkb25seSBNYWlsW11cblx0bWFpbE1vZGVsOiBNYWlsTW9kZWxcblx0bWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWxcblx0c2VsZWN0Tm9uZTogKCkgPT4gdW5rbm93blxufVxuXG4vLyBOb3RlOiBUaGUgTWFpbFZpZXdlclRvb2xiYXIgaXMgdGhlIGNvdW50ZXJwYXJ0IGZvciB0aGlzIG9uIG5vbi1tb2JpbGUgdmlld3MuIFBsZWFzZSB1cGRhdGUgdGhlcmUgdG9vIGlmIG5lZWRlZFxuZXhwb3J0IGNsYXNzIE1vYmlsZU1haWxNdWx0aXNlbGVjdGlvbkFjdGlvbkJhciB7XG5cdHByaXZhdGUgZG9tOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPE1vYmlsZU1haWxNdWx0aXNlbGVjdGlvbkFjdGlvbkJhckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IG1haWxzLCBzZWxlY3ROb25lLCBtYWlsTW9kZWwsIG1haWxib3hNb2RlbCB9ID0gYXR0cnNcblx0XHRyZXR1cm4gbShcblx0XHRcdE1vYmlsZUJvdHRvbUFjdGlvbkJhcixcblx0XHRcdHtcblx0XHRcdFx0b25jcmVhdGU6ICh7IGRvbSB9KSA9PiAodGhpcy5kb20gPSBkb20gYXMgSFRNTEVsZW1lbnQpLFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0bShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0aWNvbjogSWNvbnMuVHJhc2gsXG5cdFx0XHRcdFx0dGl0bGU6IFwiZGVsZXRlX2FjdGlvblwiLFxuXHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBwcm9tcHRBbmREZWxldGVNYWlscyhtYWlsTW9kZWwsIG1haWxzLCBzZWxlY3ROb25lKSxcblx0XHRcdFx0fSksXG5cdFx0XHRcdG1haWxNb2RlbC5pc01vdmluZ01haWxzQWxsb3dlZCgpXG5cdFx0XHRcdFx0PyBtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuRm9sZGVyLFxuXHRcdFx0XHRcdFx0XHR0aXRsZTogXCJtb3ZlX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRjbGljazogKGUsIGRvbSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IHJlZmVyZW5jZURvbSA9IHRoaXMuZG9tID8/IGRvbVxuXHRcdFx0XHRcdFx0XHRcdHNob3dNb3ZlTWFpbHNEcm9wZG93bihtYWlsYm94TW9kZWwsIG1haWxNb2RlbCwgcmVmZXJlbmNlRG9tLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBtYWlscywge1xuXHRcdFx0XHRcdFx0XHRcdFx0b25TZWxlY3RlZDogKCkgPT4gc2VsZWN0Tm9uZSxcblx0XHRcdFx0XHRcdFx0XHRcdHdpZHRoOiByZWZlcmVuY2VEb20ub2Zmc2V0V2lkdGggLSBEUk9QRE9XTl9NQVJHSU4gKiAyLFxuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0bWFpbE1vZGVsLmNhbkFzc2lnbkxhYmVscygpICYmIGFsbEluU2FtZU1haWxib3gobWFpbHMpXG5cdFx0XHRcdFx0PyBtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuTGFiZWwsXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBcImFzc2lnbkxhYmVsX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRjbGljazogKGUsIGRvbSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IHJlZmVyZW5jZURvbSA9IHRoaXMuZG9tID8/IGRvbVxuXHRcdFx0XHRcdFx0XHRcdGlmIChtYWlscy5sZW5ndGggIT09IDApIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IHBvcHVwID0gbmV3IExhYmVsc1BvcHVwKFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZWZlcmVuY2VEb20sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJlZmVyZW5jZURvbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmVmZXJlbmNlRG9tLm9mZnNldFdpZHRoIC0gRFJPUERPV05fTUFSR0lOICogMixcblx0XHRcdFx0XHRcdFx0XHRcdFx0bWFpbE1vZGVsLmdldExhYmVsc0Zvck1haWxzKG1haWxzKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0bWFpbE1vZGVsLmdldExhYmVsU3RhdGVzRm9yTWFpbHMobWFpbHMpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQoYWRkZWRMYWJlbHMsIHJlbW92ZWRMYWJlbHMpID0+IG1haWxNb2RlbC5hcHBseUxhYmVscyhtYWlscywgYWRkZWRMYWJlbHMsIHJlbW92ZWRMYWJlbHMpLFxuXHRcdFx0XHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0XHRcdFx0cG9wdXAuc2hvdygpXG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdGljb246IEljb25zLkV5ZSxcblx0XHRcdFx0XHR0aXRsZTogXCJtYXJrUmVhZF9hY3Rpb25cIixcblx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0bWFpbE1vZGVsLm1hcmtNYWlscyhtYWlscywgZmFsc2UpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSksXG5cdFx0XHRcdG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdGljb246IEljb25zLk5vRXllLFxuXHRcdFx0XHRcdHRpdGxlOiBcIm1hcmtVbnJlYWRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdG1haWxNb2RlbC5tYXJrTWFpbHMobWFpbHMsIHRydWUpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSksXG5cdFx0XHRdLFxuXHRcdClcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENsYXNzQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29ucy5qc1wiXG5pbXBvcnQgeyBjcmVhdGVEcm9wZG93biB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRHJvcGRvd24uanNcIlxuaW1wb3J0IHsgVG9nZ2xlQnV0dG9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9idXR0b25zL1RvZ2dsZUJ1dHRvbi5qc1wiXG5cbmltcG9ydCB7IE1haWxGaWx0ZXJUeXBlIH0gZnJvbSBcIi4vTWFpbFZpZXdlclV0aWxzLmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSBNYWlsRmlsdGVyQnV0dG9uQXR0cnMge1xuXHRmaWx0ZXI6IE1haWxGaWx0ZXJUeXBlIHwgbnVsbFxuXHRzZXRGaWx0ZXI6IChmaWx0ZXI6IE1haWxGaWx0ZXJUeXBlIHwgbnVsbCkgPT4gdW5rbm93blxufVxuXG5leHBvcnQgY2xhc3MgTWFpbEZpbHRlckJ1dHRvbiBpbXBsZW1lbnRzIENsYXNzQ29tcG9uZW50PE1haWxGaWx0ZXJCdXR0b25BdHRycz4ge1xuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8TWFpbEZpbHRlckJ1dHRvbkF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShUb2dnbGVCdXR0b24sIHtcblx0XHRcdGljb246IEljb25zLkZpbHRlcixcblx0XHRcdHRpdGxlOiBcImZpbHRlcl9sYWJlbFwiLFxuXHRcdFx0dG9nZ2xlZDogYXR0cnMuZmlsdGVyICE9IG51bGwsXG5cdFx0XHRvblRvZ2dsZWQ6IChfLCBldmVudCkgPT4gdGhpcy5zaG93RHJvcGRvd24oYXR0cnMsIGV2ZW50KSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBzaG93RHJvcGRvd24oeyBmaWx0ZXIsIHNldEZpbHRlciB9OiBNYWlsRmlsdGVyQnV0dG9uQXR0cnMsIGV2ZW50OiBNb3VzZUV2ZW50KSB7XG5cdFx0Y3JlYXRlRHJvcGRvd24oe1xuXHRcdFx0bGF6eUJ1dHRvbnM6ICgpID0+IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHNlbGVjdGVkOiBmaWx0ZXIgPT09IE1haWxGaWx0ZXJUeXBlLlVucmVhZCxcblx0XHRcdFx0XHRsYWJlbDogXCJmaWx0ZXJVbnJlYWRfbGFiZWxcIixcblx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0c2V0RmlsdGVyKE1haWxGaWx0ZXJUeXBlLlVucmVhZClcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0c2VsZWN0ZWQ6IGZpbHRlciA9PT0gTWFpbEZpbHRlclR5cGUuUmVhZCxcblx0XHRcdFx0XHRsYWJlbDogXCJmaWx0ZXJSZWFkX2xhYmVsXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdHNldEZpbHRlcihNYWlsRmlsdGVyVHlwZS5SZWFkKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzZWxlY3RlZDogZmlsdGVyID09PSBNYWlsRmlsdGVyVHlwZS5XaXRoQXR0YWNobWVudHMsXG5cdFx0XHRcdFx0bGFiZWw6IFwiZmlsdGVyV2l0aEF0dGFjaG1lbnRzX2xhYmVsXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdHNldEZpbHRlcihNYWlsRmlsdGVyVHlwZS5XaXRoQXR0YWNobWVudHMpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxhYmVsOiBcImZpbHRlckFsbE1haWxzX2xhYmVsXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdHNldEZpbHRlcihudWxsKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdH0pKGV2ZW50LCBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpXG5cdH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBVUEsa0JBQWtCO0lBV0wsa0JBQU4sTUFBdUU7Q0FDN0UsS0FBSyxFQUFFLE9BQXVDLEVBQUU7RUFDL0MsTUFBTSxFQUFFLGtCQUFrQixHQUFHO0FBQzdCLFNBQU8sQ0FDTixnQkFDQywyQkFDQSxnQkFDQyxrQ0FDQSxnQkFBRSx1QkFBdUI7R0FDeEIsU0FBUyxNQUFNLG9CQUFvQixpQkFBaUI7R0FDcEQsTUFBTSxVQUFVO0dBQ2hCLE9BQU8sTUFBTTtHQUNiLGlCQUFpQixNQUFNO0dBQ3ZCLGVBQWUsS0FBSywwQkFBMEIsTUFBTTtFQUNwRCxFQUFDLENBQ0YsQ0FDRCxBQUNEO0NBQ0Q7Q0FFRCxBQUFRLDBCQUEwQixFQUFFLFlBQVksYUFBYSxrQkFBa0IsWUFBWSxTQUFrQyxFQUFFO0FBQzlILFNBQU8sZUFBZSxZQUNuQixnQkFBRSxzQkFBc0IsQ0FDeEIsZ0JBQUUsUUFBUTtHQUNULE9BQU87R0FDUCxNQUFNLFdBQVc7R0FDakIsT0FBTyxNQUFNO0FBQ1osaUJBQWE7R0FDYjtFQUNELEVBQUMsRUFDRixnQkFBRSxpQ0FBaUMsY0FBYyxDQUFDLEFBQ2pELEVBQUMsR0FDRixpQkFBaUIsV0FBVyxJQUM1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
