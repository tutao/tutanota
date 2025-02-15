import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import { assertMainOrNode, isApp } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { AsyncResult, assertNotNull, downcast, groupByAndMap, isEmpty, last, neverNull, noOp, ofClass, pMap } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { AlphaEnum, DefaultAnimationTime, alpha, animations, ease, opacity, styles } from "./styles-chunk.js";
import { getElevatedBackground, getNavButtonIconBackground, stateBgHover, theme } from "./theme-chunk.js";
import { FeatureType, Keys, MailReportType, MailSetKind, MailState, getMailFolderType } from "./TutanotaConstants-chunk.js";
import { focusNext, focusPrevious, isKeyPressed, keyManager } from "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import { modal } from "./RootView-chunk.js";
import { px, size } from "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./luxon-chunk.js";
import { elementIdPart, getElementId, getLetId, haveSameId, isSameId, listIdPart } from "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import { MailSetEntryTypeRef, MailTypeRef } from "./TypeRefs-chunk.js";
import "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import "./CalendarUtils-chunk.js";
import "./ImportExportUtils-chunk.js";
import "./FormatValidator-chunk.js";
import "./stream-chunk.js";
import { deviceConfig } from "./DeviceConfig-chunk.js";
import "./Logger-chunk.js";
import "./ErrorHandler-chunk.js";
import "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import { isOfflineError } from "./ErrorUtils-chunk.js";
import { LockedError, PreconditionFailedError } from "./RestError-chunk.js";
import "./SetupMultipleError-chunk.js";
import "./OutOfSyncError-chunk.js";
import { CancelledError } from "./CancelledError-chunk.js";
import "./EventQueue-chunk.js";
import "./EntityRestClient-chunk.js";
import "./SuspensionError-chunk.js";
import "./LoginIncompleteError-chunk.js";
import "./CryptoError-chunk.js";
import "./RecipientsNotFoundError-chunk.js";
import "./DbError-chunk.js";
import "./QuotaExceededError-chunk.js";
import "./DeviceStorageUnavailableError-chunk.js";
import "./MailBodyTooLargeError-chunk.js";
import "./ImportError-chunk.js";
import "./WebauthnError-chunk.js";
import { PermissionError } from "./PermissionError-chunk.js";
import "./MessageDispatcher-chunk.js";
import "./WorkerProxy-chunk.js";
import "./EntityUpdateUtils-chunk.js";
import "./SessionType-chunk.js";
import "./Services-chunk.js";
import "./EntityClient-chunk.js";
import "./dist3-chunk.js";
import "./PageContextLoginListener-chunk.js";
import "./RestClient-chunk.js";
import "./BirthdayUtils-chunk.js";
import "./Services2-chunk.js";
import "./FolderSystem-chunk.js";
import "./GroupUtils-chunk.js";
import { isOfTypeOrSubfolderOf, isSpamOrTrashFolder } from "./MailChecks-chunk.js";
import { Button, ButtonColor, ButtonType } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import { Dialog, DropDownSelector, DropType, INPUT, RowButton, TextField, attachDropdown } from "./Dialog-chunk.js";
import { BootIcons, Icon, IconSize } from "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import { ButtonSize, IconButton } from "./IconButton-chunk.js";
import "./CalendarEventWhenModel-chunk.js";
import "./Formatter-chunk.js";
import { makeTrackedProgressMonitor } from "./ProgressMonitor-chunk.js";
import "./Notifications-chunk.js";
import "./CalendarFacade-chunk.js";
import "./CalendarModel-chunk.js";
import "./GroupUtils2-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import "./UserError-chunk.js";
import "./MailAddressParser-chunk.js";
import "./BlobUtils-chunk.js";
import { deduplicateFilenames, fileListToArray } from "./FileUtils-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import { getMailboxName, readLocalFiles } from "./SharedMailUtils-chunk.js";
import "./PasswordUtils-chunk.js";
import "./Recipient-chunk.js";
import "./ContactUtils-chunk.js";
import "./RecipientsModel-chunk.js";
import "./CalendarGuiUtils-chunk.js";
import "./UpgradeRequiredError-chunk.js";
import "./ColorPickerModel-chunk.js";
import { showNotAvailableForFreeDialog } from "./SubscriptionDialogs-chunk.js";
import "./ExternalLink-chunk.js";
import "./ToggleButton-chunk.js";
import { ColumnEmptyMessageBox } from "./ColumnEmptyMessageBox-chunk.js";
import { NavButton, NavButtonColor, isNavButtonSelected, isSelectedPrefix } from "./NavButton-chunk.js";
import "./InfoBanner-chunk.js";
import { showSnackBar } from "./SnackBar-chunk.js";
import "./Credentials-chunk.js";
import "./NotificationOverlay-chunk.js";
import "./Checkbox-chunk.js";
import "./Expander-chunk.js";
import "./ClipboardUtils-chunk.js";
import "./Services4-chunk.js";
import "./BubbleButton-chunk.js";
import "./ErrorReporter-chunk.js";
import "./PasswordField-chunk.js";
import "./PasswordRequestDialog-chunk.js";
import "./ErrorHandlerImpl-chunk.js";
import { List, ListLoadingState, ListSwipeDecision, MultiselectMode, listSelectionKeyboardShortcuts } from "./List-chunk.js";
import "./SelectableRowContainer-chunk.js";
import "./CalendarRow-chunk.js";
import { MAIL_PREFIX } from "./RouteChange-chunk.js";
import { selectionAttrsForList } from "./ListModel-chunk.js";
import "./CalendarExporter-chunk.js";
import "./CalendarImporter-chunk.js";
import "./CustomerUtils-chunk.js";
import "./CalendarInvites-chunk.js";
import { BackgroundColumnLayout, ColumnType, FolderColumnView, Header, MobileHeader, SidebarSection, ViewColumn, ViewSlider, isNewMailActionAvailable } from "./MobileHeader-chunk.js";
import { mailLocator } from "./mailLocator-chunk.js";
import { BaseTopLevelView } from "./LoginScreenHeader-chunk.js";
import { DesktopListToolbar, DesktopViewerToolbar, EnterMultiselectIconButton, MultiselectMobileHeader, SidebarSectionRow } from "./SidebarSectionRow-chunk.js";
import { LoginButton } from "./LoginButton-chunk.js";
import { ColorPickerView } from "./ColorPickerView-chunk.js";
import { CounterBadge } from "./CounterBadge-chunk.js";
import "./InfoIcon-chunk.js";
import "./Table-chunk.js";
import { ListColumnWrapper } from "./ListColumnWrapper-chunk.js";
import "./LoginUtils-chunk.js";
import "./AttachmentBubble-chunk.js";
import { archiveMails, getConversationTitle, getFolderIcon, getMoveMailBounds, moveMails, moveToInbox, promptAndDeleteMails, reportMailsAutomatically, showMoveMailsDropdown } from "./MailGuiUtils-chunk.js";
import "./UsageTestModel-chunk.js";
import { MAX_FOLDER_INDENT_LEVEL, assertSystemFolderOfType, getFolderName, getIndentedFolderNameForDropdown, getPathToFolderString } from "./MailUtils-chunk.js";
import "./BrowserWebauthn-chunk.js";
import "./PermissionType-chunk.js";
import "./CommonMailUtils-chunk.js";
import "./SearchUtils-chunk.js";
import "./FontIcons-chunk.js";
import { canDoDragAndDropExport, downloadMailBundle, generateExportFileName, generateMailFile, getMailExportMode } from "./MailViewerViewModel-chunk.js";
import "./LoadingState-chunk.js";
import "./inlineImagesUtils-chunk.js";
import { SelectAllCheckbox } from "./SelectAllCheckbox-chunk.js";
import { LazySearchBar } from "./LazySearchBar-chunk.js";
import { BottomNav } from "./BottomNav-chunk.js";
import "./Badge-chunk.js";
import { MailRow, getLabelColor } from "./MailRow-chunk.js";
import { ConversationViewer, LabelsPopup, MailFilterButton, MailViewerActions, MobileMailActionBar, MobileMailMultiselectionActionBar, MultiItemViewer, conversationCardMargin, getMailSelectionMessage } from "./MailFilterButton-chunk.js";

//#region src/mail-app/mail/view/MailListView.ts
assertMainOrNode();
var MailListView = class {
	exportedMails;
	_listDom;
	showingSpamOrTrash = false;
	showingDraft = false;
	showingArchive = false;
	attrs;
	get mailViewModel() {
		return this.attrs.mailViewModel;
	}
	renderConfig = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		createElement: (dom) => {
			const mailRow = new MailRow(this.mailViewModel.getSelectedMailSetKind() === MailSetKind.LABEL, (mail) => this.mailViewModel.getLabelsForMail(mail), (entity) => this.attrs.onSingleExclusiveSelection(entity));
			mithril_default.render(dom, mailRow.render());
			return mailRow;
		},
		swipe: locator.logins.isInternalUserLoggedIn() ? {
			renderLeftSpacer: () => this.renderLeftSpacer(),
			renderRightSpacer: () => this.renderRightSpacer(),
			swipeLeft: (listElement) => this.onSwipeLeft(listElement),
			swipeRight: (listElement) => this.onSwipeRight(listElement)
		} : null,
		dragStart: (event, row, selected) => this._newDragStart(event, row, selected)
	};
	constructor({ attrs }) {
		this.attrs = attrs;
		this.exportedMails = new Map();
		this._listDom = null;
		this.mailViewModel.showingTrashOrSpamFolder().then((result) => {
			this.showingSpamOrTrash = result;
			mithril_default.redraw();
		});
		this.mailViewModel.showingDraftsFolder().then((result) => {
			this.showingDraft = result;
			mithril_default.redraw();
		});
		this.targetInbox().then((result) => {
			this.showingArchive = result;
			mithril_default.redraw();
		});
		this.view = this.view.bind(this);
	}
	getRecoverFolder(mail, folders) {
		if (mail.state === MailState.DRAFT) return assertSystemFolderOfType(folders, MailSetKind.DRAFT);
else return assertSystemFolderOfType(folders, MailSetKind.INBOX);
	}
	_newDragStart(event, row, selected) {
		if (!row) return;
		const mailUnderCursor = row;
		if (isExportDragEvent(event)) {
			this._listDom?.classList.remove("drag-mod-key");
			event.preventDefault();
			const draggedMails = selected.has(mailUnderCursor) ? [...selected] : [mailUnderCursor];
			this._doExportDrag(draggedMails);
		} else if (styles.isDesktopLayout()) neverNull(event.dataTransfer).setData(DropType.Mail, getLetId(neverNull(mailUnderCursor))[1]);
else event.preventDefault();
	}
	_dragStart(event, row, selected) {
		if (!row.entity) return;
		const mailUnderCursor = row.entity;
		if (isExportDragEvent(event)) {
			this._listDom?.classList.remove("drag-mod-key");
			event.preventDefault();
			const draggedMails = selected.some((mail) => haveSameId(mail, mailUnderCursor)) ? selected.slice() : [mailUnderCursor];
			this._doExportDrag(draggedMails);
		} else if (styles.isDesktopLayout()) neverNull(event.dataTransfer).setData(DropType.Mail, getLetId(neverNull(mailUnderCursor))[1]);
else event.preventDefault();
	}
	async _doExportDrag(draggedMails) {
		assertNotNull(document.body).style.cursor = "progress";
		const mouseupPromise = new Promise((resolve) => {
			document.addEventListener("mouseup", resolve, { once: true });
		});
		const filePathsPromise = this._prepareMailsForDrag(draggedMails);
		const [didComplete, fileNames] = await Promise.race([filePathsPromise.then((filePaths) => [true, filePaths]), mouseupPromise.then(() => [false, []])]);
		if (didComplete) await locator.fileApp.startNativeDrag(fileNames);
else {
			await locator.desktopSystemFacade.focusApplicationWindow();
			Dialog.message("unsuccessfulDrop_msg");
		}
		neverNull(document.body).style.cursor = "default";
	}
	/**
	* Given a mail, will prepare it by downloading, bundling, saving, then returns the filepath of the saved file.
	* @returns {Promise<R>|Promise<string>}
	* @private
	* @param mails
	*/
	async _prepareMailsForDrag(mails) {
		const exportMode = await getMailExportMode();
		const progressMonitor = makeTrackedProgressMonitor(locator.progressTracker, 3 * mails.length + 1);
		progressMonitor.workDone(1);
		const mapKey = (mail) => `${getLetId(mail).join("")}${exportMode}`;
		const notDownloaded = [];
		const downloaded = [];
		const handleNotDownloaded = (mail) => {
			notDownloaded.push({
				mail,
				fileName: generateExportFileName(getElementId(mail), mail.subject, mail.receivedDate, exportMode)
			});
		};
		const handleDownloaded = (fileName, promise) => {
			progressMonitor.workDone(3);
			downloaded.push({
				fileName,
				promise
			});
		};
		for (let mail of mails) {
			const key = mapKey(mail);
			const existing = this.exportedMails.get(key);
			if (!existing || existing.result.state().status === "failure") handleNotDownloaded(mail);
else {
				const state = existing.result.state();
				switch (state.status) {
					case "pending": {
						handleDownloaded(existing.fileName, state.promise);
						continue;
					}
					case "complete": {
						const exists = await locator.fileApp.checkFileExistsInExportDir(existing.fileName);
						if (exists) handleDownloaded(existing.fileName, Promise.resolve(mail));
else handleNotDownloaded(mail);
					}
				}
			}
		}
		const deduplicatedNames = deduplicateFilenames(notDownloaded.map((f) => f.fileName), new Set(downloaded.map((f) => f.fileName)));
		const [newFiles, existingFiles] = await Promise.all([pMap(notDownloaded, async ({ mail, fileName }) => {
			const name = assertNotNull(deduplicatedNames[fileName].shift());
			const key = mapKey(mail);
			const downloadPromise = Promise.resolve().then(async () => {
				const { htmlSanitizer } = await import("./HtmlSanitizer2-chunk.js");
				const bundle = await downloadMailBundle(mail, locator.mailFacade, locator.entityClient, locator.fileController, htmlSanitizer, locator.cryptoFacade);
				progressMonitor.workDone(1);
				const file = await generateMailFile(bundle, name, exportMode);
				progressMonitor.workDone(1);
				await locator.fileApp.saveToExportDir(file);
				progressMonitor.workDone(1);
			});
			this.exportedMails.set(key, {
				fileName: name,
				result: new AsyncResult(downloadPromise)
			});
			await downloadPromise;
			return name;
		}), pMap(downloaded, (result) => result.promise.then(() => result.fileName))]);
		return newFiles.concat(existingFiles);
	}
	view(vnode) {
		this.attrs = vnode.attrs;
		const folder = this.mailViewModel.getFolder();
		const purgeButtonAttrs = {
			label: "clearFolder_action",
			type: ButtonType.Primary,
			colors: ButtonColor.Nav,
			click: async () => {
				vnode.attrs.onClearFolder();
			}
		};
		const onKeyDown = (event) => {
			if (isDragAndDropModifierHeld(event)) this._listDom?.classList.add("drag-mod-key");
		};
		const onKeyUp = (event) => {
			this._listDom?.classList.remove("drag-mod-key");
		};
		const listModel = vnode.attrs.mailViewModel.listModel;
		return mithril_default(
			".mail-list-wrapper",
			{
				oncreate: (vnode$1) => {
					this._listDom = downcast(vnode$1.dom.firstChild);
					if (canDoDragAndDropExport()) {
						assertNotNull(document.body).addEventListener("keydown", onKeyDown);
						assertNotNull(document.body).addEventListener("keyup", onKeyUp);
					}
				},
				onbeforeremove: (vnode$1) => {
					if (canDoDragAndDropExport()) {
						assertNotNull(document.body).removeEventListener("keydown", onKeyDown);
						assertNotNull(document.body).removeEventListener("keyup", onKeyUp);
					}
				}
			},
			// always render the wrapper so that the list is not re-created from scratch when
			// showingSpamOrTrash changes.
			mithril_default(ListColumnWrapper, { headerContent: this.renderListHeader(purgeButtonAttrs) }, listModel.isEmptyAndDone() ? mithril_default(ColumnEmptyMessageBox, {
				icon: BootIcons.Mail,
				message: "noMails_msg",
				color: theme.list_message_bg
			}) : mithril_default(List, {
				state: listModel.stateStream(),
				renderConfig: this.renderConfig,
				onLoadMore() {
					listModel.loadMore();
				},
				onRetryLoading() {
					listModel.retryLoading();
				},
				onSingleSelection: (item) => {
					vnode.attrs.onSingleSelection(item);
				},
				onSingleTogglingMultiselection: (item) => {
					vnode.attrs.onSingleInclusiveSelection(item, styles.isSingleColumnLayout());
				},
				onRangeSelectionTowards: (item) => {
					vnode.attrs.onRangeSelectionTowards(item);
				},
				onStopLoading() {
					listModel.stopLoading();
				}
			}))
);
	}
	renderListHeader(purgeButtonAttrs) {
		return mithril_default(".flex.col", [this.showingSpamOrTrash ? [mithril_default(".flex.flex-column.plr-l", [mithril_default(".small.flex-grow.pt", lang.get("storageDeletion_msg")), mithril_default(".mr-negative-s.align-self-end", mithril_default(Button, purgeButtonAttrs))])] : null]);
	}
	async targetInbox() {
		const selectedFolder = this.mailViewModel.getFolder();
		if (selectedFolder) {
			const mailDetails = await this.mailViewModel.getMailboxDetails();
			if (mailDetails.mailbox.folders) {
				const folders = await mailLocator.mailModel.getMailboxFoldersForId(mailDetails.mailbox.folders._id);
				return isOfTypeOrSubfolderOf(folders, selectedFolder, MailSetKind.ARCHIVE) || selectedFolder.folderType === MailSetKind.TRASH;
			}
		}
		return false;
	}
	async onSwipeLeft(listElement) {
		const wereDeleted = await promptAndDeleteMails(mailLocator.mailModel, [listElement], () => this.mailViewModel.listModel?.selectNone());
		return wereDeleted ? ListSwipeDecision.Commit : ListSwipeDecision.Cancel;
	}
	async onSwipeRight(listElement) {
		if (this.showingDraft) {
			this.mailViewModel.listModel?.selectNone();
			return ListSwipeDecision.Cancel;
		} else {
			const folders = await mailLocator.mailModel.getMailboxFoldersForMail(listElement);
			if (folders) {
				const targetMailFolder = this.showingSpamOrTrash ? this.getRecoverFolder(listElement, folders) : assertNotNull(folders.getSystemFolderByType(this.showingArchive ? MailSetKind.INBOX : MailSetKind.ARCHIVE));
				const wereMoved = await moveMails({
					mailboxModel: locator.mailboxModel,
					mailModel: mailLocator.mailModel,
					mails: [listElement],
					targetMailFolder
				});
				return wereMoved ? ListSwipeDecision.Commit : ListSwipeDecision.Cancel;
			} else return ListSwipeDecision.Cancel;
		}
	}
	renderLeftSpacer() {
		return this.showingDraft ? [mithril_default(Icon, { icon: Icons.Cancel }), mithril_default(".pl-s", lang.get("cancel_action"))] : [mithril_default(Icon, { icon: Icons.Folder }), mithril_default(".pl-s", this.showingSpamOrTrash ? lang.get("recover_label") : this.showingArchive ? lang.get("received_action") : lang.get("archive_label"))];
	}
	renderRightSpacer() {
		return [mithril_default(Icon, { icon: Icons.Trash }), mithril_default(".pl-s", lang.get("delete_action"))];
	}
};
function isExportDragEvent(event) {
	return canDoDragAndDropExport() && isDragAndDropModifierHeld(event);
}
function isDragAndDropModifierHeld(event) {
	return event.ctrlKey || event.altKey || event.key != null && isKeyPressed(event.key, Keys.CTRL, Keys.ALT);
}

//#endregion
//#region src/mail-app/mail/view/EditFolderDialog.ts
async function showEditFolderDialog(mailBoxDetail, editedFolder = null, parentFolder = null) {
	const noParentFolderOption = lang.get("comboBoxSelectionNone_msg");
	const mailGroupId = mailBoxDetail.mailGroup._id;
	const folders = await mailLocator.mailModel.getMailboxFoldersForId(assertNotNull(mailBoxDetail.mailbox.folders)._id);
	let folderNameValue = editedFolder?.name ?? "";
	let targetFolders = folders.getIndentedList(editedFolder).filter((folderInfo) => !(editedFolder === null && isSpamOrTrashFolder(folders, folderInfo.folder))).map((folderInfo) => {
		return {
			name: getIndentedFolderNameForDropdown(folderInfo),
			value: folderInfo.folder
		};
	});
	targetFolders = [{
		name: noParentFolderOption,
		value: null
	}, ...targetFolders];
	let selectedParentFolder = parentFolder;
	let form = () => [mithril_default(TextField, {
		label: editedFolder ? "rename_action" : "folderName_label",
		value: folderNameValue,
		oninput: (newInput) => {
			folderNameValue = newInput;
		}
	}), mithril_default(DropDownSelector, {
		label: "parentFolder_label",
		items: targetFolders,
		selectedValue: selectedParentFolder,
		selectedValueDisplay: selectedParentFolder ? getFolderName(selectedParentFolder) : noParentFolderOption,
		selectionChangedHandler: (newFolder) => selectedParentFolder = newFolder,
		helpLabel: () => selectedParentFolder ? getPathToFolderString(folders, selectedParentFolder) : ""
	})];
	async function getMailIdsGroupedByListId(folder) {
		const mailSetEntries = await locator.entityClient.loadAll(MailSetEntryTypeRef, folder.entries);
		return groupByAndMap(mailSetEntries, (mse) => listIdPart(mse.mail), (mse) => elementIdPart(mse.mail));
	}
	async function loadAllMailsOfFolder(folder, reportableMails) {
		if (folder.isMailSet) {
			const mailIdsPerBag = await getMailIdsGroupedByListId(folder);
			for (const [mailListId, mailIds] of mailIdsPerBag) reportableMails.push(...await locator.entityClient.loadMultiple(MailTypeRef, mailListId, mailIds));
		} else reportableMails.push(...await locator.entityClient.loadAll(MailTypeRef, folder.mails));
	}
	const okAction = async (dialog) => {
		dialog.close();
		try {
			if (editedFolder === null) await locator.mailFacade.createMailFolder(folderNameValue, selectedParentFolder?._id ?? null, mailGroupId);
else if (selectedParentFolder?.folderType === MailSetKind.TRASH && !isSameId(selectedParentFolder._id, editedFolder.parentFolder)) {
				const confirmed = await Dialog.confirm(lang.makeTranslation("confirm", lang.get("confirmDeleteCustomFolder_msg", { "{1}": getFolderName(editedFolder) })));
				if (!confirmed) return;
				await locator.mailFacade.updateMailFolderName(editedFolder, folderNameValue);
				await mailLocator.mailModel.trashFolderAndSubfolders(editedFolder);
			} else if (selectedParentFolder?.folderType === MailSetKind.SPAM && !isSameId(selectedParentFolder._id, editedFolder.parentFolder)) {
				const confirmed = await Dialog.confirm(lang.makeTranslation("confirm", lang.get("confirmSpamCustomFolder_msg", { "{1}": getFolderName(editedFolder) })));
				if (!confirmed) return;
				const descendants = folders.getDescendantFoldersOfParent(editedFolder._id).sort((l, r) => r.level - l.level);
				let reportableMails = [];
				await loadAllMailsOfFolder(editedFolder, reportableMails);
				for (const descendant of descendants) await loadAllMailsOfFolder(descendant.folder, reportableMails);
				await reportMailsAutomatically(MailReportType.SPAM, locator.mailboxModel, mailLocator.mailModel, mailBoxDetail, reportableMails);
				await locator.mailFacade.updateMailFolderName(editedFolder, folderNameValue);
				await mailLocator.mailModel.sendFolderToSpam(editedFolder);
			} else {
				await locator.mailFacade.updateMailFolderName(editedFolder, folderNameValue);
				await locator.mailFacade.updateMailFolderParent(editedFolder, selectedParentFolder?._id || null);
			}
		} catch (error) {
			if (isOfflineError(error) || !(error instanceof LockedError)) throw error;
		}
	};
	Dialog.showActionDialog({
		title: editedFolder ? "editFolder_action" : "addFolder_action",
		child: form,
		validator: () => checkFolderName(mailBoxDetail, folders, folderNameValue, mailGroupId, selectedParentFolder?._id ?? null),
		allowOkWithReturn: true,
		okAction
	});
}
function checkFolderName(mailboxDetail, folders, name, mailGroupId, parentFolderId) {
	if (name.trim() === "") return "folderNameNeutral_msg";
else if (folders.getCustomFoldersOfParent(parentFolderId).some((f) => f.name === name)) return "folderNameInvalidExisting_msg";
else return null;
}

//#endregion
//#region src/mail-app/mail/view/MailFolderRow.ts
var MailFolderRow = class {
	hovered = false;
	onupdate(vnode) {
		if (isNavButtonSelected(vnode.attrs.button)) this.hovered = true;
	}
	view(vnode) {
		const { count, button, rightButton, expanded, indentationLevel, folder, hasChildren, editMode } = vnode.attrs;
		const icon = getFolderIcon(folder);
		const onHover = () => {
			vnode.attrs.onHover();
			this.hovered = true;
		};
		const handleForwardsTab = (event) => {
			if (event.key === "Tab" && !event.shiftKey) this.hovered = false;
		};
		const handleBackwardsTab = (event) => {
			if (event.key === "Tab" && event.shiftKey) this.hovered = false;
		};
		const indentationMargin = indentationLevel * size.hpad;
		const paddingNeeded = size.hpad_button;
		const buttonWidth = size.icon_size_large + paddingNeeded * 2;
		return mithril_default(".folder-row.flex.flex-row.mlr-button.border-radius-small.state-bg", {
			style: { background: isNavButtonSelected(button) ? stateBgHover : "" },
			title: lang.getTranslationText(button.label),
			onmouseenter: onHover,
			onmouseleave: () => {
				this.hovered = false;
			}
		}, [
			hasChildren && !expanded ? mithril_default(Icon, {
				style: {
					position: "absolute",
					bottom: px(9),
					left: px(5 + indentationMargin + buttonWidth / 2),
					fill: isNavButtonSelected(button) ? theme.navigation_button_selected : theme.navigation_button
				},
				icon: Icons.Add,
				class: "icon-small"
			}) : null,
			mithril_default("", { style: { marginLeft: px(indentationMargin) } }),
			this.renderHierarchyLine(vnode.attrs, indentationMargin),
			mithril_default("button.flex.items-center.justify-end" + (editMode || !hasChildren ? ".no-hover" : ""), {
				style: {
					left: px(indentationMargin),
					width: px(buttonWidth),
					height: px(size.button_height),
					paddingLeft: px(paddingNeeded),
					paddingRight: px(paddingNeeded),
					zIndex: 3
				},
				"data-testid": `btn:icon:${getFolderName(folder)}`,
				"data-expanded": vnode.attrs.expanded ? "true" : "false",
				onclick: vnode.attrs.onExpanderClick,
				onkeydown: handleBackwardsTab
			}, mithril_default(Icon, {
				icon,
				size: IconSize.Medium,
				style: { fill: isNavButtonSelected(button) ? theme.navigation_button_selected : theme.navigation_button }
			})),
			mithril_default(NavButton, {
				...button,
				onfocus: onHover,
				onkeydown: handleBackwardsTab
			}),
			rightButton && (editMode || !client.isMobileDevice() && this.hovered) ? mithril_default(IconButton, {
				...rightButton,
				click: (event, dom) => {
					rightButton.click(event, dom);
				},
				onkeydown: handleForwardsTab
			}) : mithril_default("", { style: { marginRight: px(size.hpad_button) } }, [mithril_default(CounterBadge, {
				count,
				color: theme.navigation_button_icon,
				background: getNavButtonIconBackground(),
				showFullCount: true
			})])
		]);
	}
	renderHierarchyLine({ indentationLevel, numberOfPreviousRows, isLastSibling, onSelectedPath }, indentationMargin) {
		const lineSize = 2;
		const border = `${lineSize}px solid ${theme.content_border}`;
		const verticalOffsetInsideRow = size.button_height / 2 + 1;
		const verticalOffsetForParent = (size.button_height - size.icon_size_large) / 2;
		const lengthOfHorizontalLine = size.hpad - 2;
		const leftOffset = indentationMargin;
		return indentationLevel !== 0 ? [isLastSibling || onSelectedPath ? mithril_default(".abs", { style: {
			width: px(lengthOfHorizontalLine),
			borderBottomLeftRadius: "3px",
			height: px(1 + verticalOffsetInsideRow + verticalOffsetForParent + numberOfPreviousRows * size.button_height),
			top: px(-verticalOffsetForParent - numberOfPreviousRows * size.button_height),
			left: px(leftOffset),
			borderLeft: border,
			borderBottom: border,
			zIndex: onSelectedPath ? 2 : 1
		} }) : mithril_default(".abs", { style: {
			height: px(lineSize),
			top: px(verticalOffsetInsideRow),
			left: px(leftOffset),
			width: px(lengthOfHorizontalLine),
			backgroundColor: theme.content_border
		} })] : null;
	}
};

//#endregion
//#region src/mail-app/mail/view/MailFoldersView.ts
var MailFoldersView = class {
	visibleRow = null;
	view({ attrs }) {
		const { mailboxDetail, mailModel } = attrs;
		const groupCounters = mailModel.mailboxCounters()[mailboxDetail.mailGroup._id] || {};
		const folders = mailModel.getFolderSystemByGroupId(mailboxDetail.mailGroup._id);
		const customSystems = folders?.customSubtrees ?? [];
		const systemSystems = folders?.systemSubtrees.filter((f) => f.folder.folderType !== MailSetKind.Imported) ?? [];
		const children = [];
		const selectedFolder = folders?.getIndentedList().map((f) => f.folder).find((f) => isSelectedPrefix(MAIL_PREFIX + "/" + getElementId(f)));
		const path = folders && selectedFolder ? folders.getPathToFolder(selectedFolder._id) : [];
		const isInternalUser = locator.logins.isInternalUserLoggedIn();
		const systemChildren = folders && this.renderFolderTree(systemSystems, groupCounters, folders, attrs, path, isInternalUser);
		if (systemChildren) children.push(...systemChildren.children);
		if (isInternalUser) {
			const customChildren = folders ? this.renderFolderTree(customSystems, groupCounters, folders, attrs, path, isInternalUser).children : [];
			children.push(mithril_default(SidebarSection, {
				name: "yourFolders_action",
				button: attrs.inEditMode ? this.renderCreateFolderAddButton(null, attrs) : this.renderEditFoldersButton(attrs),
				key: "yourFolders"
			}, customChildren));
			children.push(this.renderAddFolderButtonRow(attrs));
		}
		return children;
	}
	renderFolderTree(subSystems, groupCounters, folders, attrs, path, isInternalUser, indentationLevel = 0) {
		const result = {
			children: [],
			numRows: 0
		};
		for (let system of subSystems) {
			const id = getElementId(system.folder);
			const folderName = getFolderName(system.folder);
			const button = {
				label: lang.makeTranslation(`folder:${folderName}`, folderName),
				href: () => {
					if (attrs.inEditMode) return mithril_default.route.get();
else {
						const folderElementId = getElementId(system.folder);
						const mailId = attrs.mailFolderElementIdToSelectedMailId.get(folderElementId);
						if (mailId) return `${MAIL_PREFIX}/${folderElementId}/${mailId}`;
else return `${MAIL_PREFIX}/${folderElementId}`;
					}
				},
				isSelectedPrefix: attrs.inEditMode ? false : MAIL_PREFIX + "/" + getElementId(system.folder),
				colors: NavButtonColor.Nav,
				click: () => attrs.onFolderClick(system.folder),
				dropHandler: (dropData) => attrs.onFolderDrop(dropData, system.folder),
				disableHoverBackground: true,
				disabled: attrs.inEditMode
			};
			const currentExpansionState = attrs.inEditMode ? true : attrs.expandedFolders.has(getElementId(system.folder)) ?? false;
			const hasChildren = system.children.length > 0;
			const counterId = system.folder.isMailSet ? getElementId(system.folder) : system.folder.mails;
			const summedCount = !currentExpansionState && hasChildren ? this.getTotalFolderCounter(groupCounters, system) : groupCounters[counterId];
			const childResult = hasChildren && currentExpansionState ? this.renderFolderTree(system.children, groupCounters, folders, attrs, path, isInternalUser, indentationLevel + 1) : {
				children: null,
				numRows: 0
			};
			const isTrashOrSpam = system.folder.folderType === MailSetKind.TRASH || system.folder.folderType === MailSetKind.SPAM;
			const isRightButtonVisible = this.visibleRow === id;
			const rightButton = isInternalUser && !isTrashOrSpam && (isRightButtonVisible || attrs.inEditMode) ? this.createFolderMoreButton(system.folder, folders, attrs, () => {
				this.visibleRow = null;
			}) : null;
			const render = mithril_default.fragment({ key: id }, [mithril_default(MailFolderRow, {
				count: attrs.inEditMode ? 0 : summedCount,
				button,
				folder: system.folder,
				rightButton,
				expanded: hasChildren ? currentExpansionState : null,
				indentationLevel: Math.min(indentationLevel, MAX_FOLDER_INDENT_LEVEL),
				onExpanderClick: hasChildren ? () => attrs.onFolderExpanded(system.folder, currentExpansionState) : noOp,
				hasChildren,
				onSelectedPath: path.includes(system.folder),
				numberOfPreviousRows: result.numRows,
				isLastSibling: last(subSystems) === system,
				editMode: attrs.inEditMode,
				onHover: () => {
					this.visibleRow = id;
				}
			}), childResult.children]);
			result.numRows += childResult.numRows + 1;
			result.children.push(render);
		}
		return result;
	}
	renderAddFolderButtonRow(attrs) {
		return mithril_default(RowButton, {
			label: "addFolder_action",
			key: "addFolder",
			icon: Icons.Add,
			class: "folder-row mlr-button border-radius-small",
			style: { width: `calc(100% - ${px(size.hpad_button * 2)})` },
			onclick: () => {
				attrs.onShowFolderAddEditDialog(attrs.mailboxDetail.mailGroup._id, null, null);
			}
		});
	}
	getTotalFolderCounter(counters, system) {
		const counterId = system.folder.isMailSet ? getElementId(system.folder) : system.folder.mails;
		return (counters[counterId] ?? 0) + system.children.reduce((acc, child) => acc + this.getTotalFolderCounter(counters, child), 0);
	}
	createFolderMoreButton(folder, folders, attrs, onClose) {
		return attachDropdown({
			mainButtonAttrs: {
				title: "more_label",
				icon: Icons.More,
				colors: ButtonColor.Nav,
				size: ButtonSize.Compact
			},
			childAttrs: () => {
				return folder.folderType === MailSetKind.CUSTOM ? isSpamOrTrashFolder(folders, folder) ? [this.editButtonAttrs(attrs, folders, folder), this.deleteButtonAttrs(attrs, folder)] : [
					this.editButtonAttrs(attrs, folders, folder),
					this.addButtonAttrs(attrs, folder),
					this.deleteButtonAttrs(attrs, folder)
				] : [this.addButtonAttrs(attrs, folder)];
			},
			onClose
		});
	}
	deleteButtonAttrs(attrs, folder) {
		return {
			label: "delete_action",
			icon: Icons.Trash,
			click: () => {
				attrs.onDeleteCustomMailFolder(folder);
			}
		};
	}
	addButtonAttrs(attrs, folder) {
		return {
			label: "addFolder_action",
			icon: Icons.Add,
			click: () => {
				attrs.onShowFolderAddEditDialog(attrs.mailboxDetail.mailGroup._id, null, folder);
			}
		};
	}
	editButtonAttrs(attrs, folders, folder) {
		return {
			label: "edit_action",
			icon: Icons.Edit,
			click: () => {
				attrs.onShowFolderAddEditDialog(attrs.mailboxDetail.mailGroup._id, folder, folder.parentFolder ? folders.getFolderById(elementIdPart(folder.parentFolder)) : null);
			}
		};
	}
	renderCreateFolderAddButton(parentFolder, attrs) {
		return mithril_default(IconButton, {
			title: "addFolder_action",
			click: () => {
				return attrs.onShowFolderAddEditDialog(attrs.mailboxDetail.mailGroup._id, null, parentFolder);
			},
			icon: Icons.Add,
			size: ButtonSize.Compact
		});
	}
	renderEditFoldersButton(attrs) {
		return mithril_default(IconButton, {
			title: "edit_action",
			click: () => attrs.onEditMailbox(),
			icon: Icons.Edit,
			size: ButtonSize.Compact
		});
	}
};

//#endregion
//#region src/mail-app/mail/view/EditFoldersDialog.ts
var EditFoldersDialog = class EditFoldersDialog {
	visible;
	_shortcuts;
	_domDialog = null;
	/** The element that was focused before we've shown the component so that we can return it back upon closing. */
	focusedBeforeShown = null;
	_closeHandler = null;
	usedBottomNavBefore = styles.isUsingBottomNavigation();
	constructor(folderList) {
		this.folderList = folderList;
		this.visible = false;
		this._shortcuts = [
			{
				key: Keys.RETURN,
				shift: false,
				exec: () => this.close(),
				help: "close_alt"
			},
			{
				key: Keys.ESC,
				shift: false,
				exec: () => this.close(),
				help: "close_alt"
			},
			{
				key: Keys.TAB,
				shift: true,
				exec: () => this._domDialog ? focusPrevious(this._domDialog) : false,
				help: "selectPrevious_action"
			},
			{
				key: Keys.TAB,
				shift: false,
				exec: () => this._domDialog ? focusNext(this._domDialog) : false,
				help: "selectNext_action"
			}
		];
		this.view = this.view.bind(this);
	}
	view() {
		if (this.usedBottomNavBefore !== styles.isUsingBottomNavigation()) this.close();
		this.usedBottomNavBefore = styles.isUsingBottomNavigation();
		const marginTop = this.usedBottomNavBefore ? "env(safe-area-inset-top)" : px(size.navbar_height);
		return mithril_default(".flex.col", {
			style: {
				width: px(size.first_col_max_width - size.button_height),
				height: `calc(100% - ${marginTop})`,
				marginTop,
				marginLeft: px(size.button_height)
			},
			onclick: (e) => e.stopPropagation(),
			oncreate: (vnode) => {
				this._domDialog = vnode.dom;
				let animation = null;
				const bgcolor = theme.navigation_bg;
				const children = Array.from(this._domDialog.children);
				for (let child of children) child.style.opacity = "0";
				this._domDialog.style.backgroundColor = `rgba(0, 0, 0, 0)`;
				animation = Promise.all([animations.add(this._domDialog, alpha(AlphaEnum.BackgroundColor, bgcolor, 0, 1)), animations.add(children, opacity(0, 1, true), { delay: DefaultAnimationTime / 2 })]);
				window.requestAnimationFrame(() => {
					const activeElement = document.activeElement;
					if (activeElement && typeof activeElement.blur === "function") activeElement.blur();
				});
				animation.then(() => {
					this.defaultFocusOnLoad();
				});
			}
		}, [mithril_default(".plr-button.mt.mb", mithril_default(LoginButton, {
			label: "done_action",
			onclick: () => this.close()
		})), mithril_default(".scroll.overflow-x-hidden.flex.col.flex-grow", { onscroll: (e) => {
			const target = e.target;
			target.style.borderTop = `1px solid ${theme.content_border}`;
		} }, this.folderList())]);
	}
	defaultFocusOnLoad() {
		const dom = assertNotNull(this._domDialog);
		let inputs = Array.from(dom.querySelectorAll(INPUT));
		if (inputs.length > 0) inputs[0].focus();
else {
			let button = dom.querySelector("button");
			if (button) button.focus();
		}
	}
	hideAnimation() {
		let bgcolor = getElevatedBackground();
		if (this._domDialog) return Promise.all([animations.add(this._domDialog.children, opacity(1, 0, true)), animations.add(this._domDialog, alpha(AlphaEnum.BackgroundColor, bgcolor, 1, 0), {
			delay: DefaultAnimationTime / 2,
			easing: ease.linear
		})]).then(noOp);
else return Promise.resolve();
	}
	show() {
		this.focusedBeforeShown = document.activeElement;
		modal.display(this);
		this.visible = true;
		return this;
	}
	close() {
		this.visible = false;
		modal.remove(this);
	}
	/**
	* Should be called to close a dialog. Notifies the closeHandler about the close attempt.
	*/
	onClose() {
		if (this._closeHandler) this._closeHandler();
else this.close();
	}
	shortcuts() {
		return this._shortcuts;
	}
	backgroundClick(e) {}
	popState(e) {
		this.onClose();
		return false;
	}
	callingElement() {
		return this.focusedBeforeShown;
	}
	addShortcut(shortcut) {
		this._shortcuts.push(shortcut);
		if (this.visible) keyManager.registerModalShortcuts([shortcut]);
		return this;
	}
	static showEdit(folders) {
		new EditFoldersDialog(folders).show();
	}
};

//#endregion
//#region src/mail-app/mail/view/EditLabelDialog.ts
const LIMIT_EXCEEDED_ERROR = "limitReached";
async function showEditLabelDialog(mailbox, mailViewModel, label) {
	let name = label ? label.name : "";
	let color = label && label.color ? label.color : "";
	async function onOkClicked(dialog) {
		dialog.close();
		try {
			if (label) await mailViewModel.editLabel(label, {
				name,
				color
			});
else if (mailbox) await mailViewModel.createLabel(mailbox, {
				name,
				color
			});
		} catch (error) {
			if (error instanceof PreconditionFailedError) if (error.data === LIMIT_EXCEEDED_ERROR) showNotAvailableForFreeDialog();
else Dialog.message("unknownError_msg");
else if (isOfflineError(error) || !(error instanceof LockedError)) throw error;
		}
	}
	Dialog.showActionDialog({
		title: label ? "editLabel_action" : "addLabel_action",
		allowCancel: true,
		okAction: (dialog) => {
			onOkClicked(dialog);
		},
		child: () => mithril_default(".flex.col.gap-vpad", [mithril_default(TextField, {
			label: "name_label",
			value: name,
			oninput: (newName) => {
				name = newName;
			}
		}), mithril_default(ColorPickerView, {
			value: color,
			onselect: (newColor) => {
				color = newColor;
			}
		})])
	});
}

//#endregion
//#region src/mail-app/mail/view/MailView.ts
assertMainOrNode();
var MailView = class extends BaseTopLevelView {
	listColumn;
	folderColumn;
	mailColumn;
	viewSlider;
	cache;
	oncreate;
	onremove;
	countersStream = null;
	expandedState;
	mailViewModel;
	get conversationViewModel() {
		return this.mailViewModel.getConversationViewModel();
	}
	constructor(vnode) {
		super();
		this.expandedState = new Set(deviceConfig.getExpandedFolders(locator.logins.getUserController().userId));
		this.cache = vnode.attrs.cache;
		this.folderColumn = this.createFolderColumn(null, vnode.attrs.drawerAttrs);
		this.mailViewModel = vnode.attrs.mailViewModel;
		this.listColumn = new ViewColumn({ view: () => {
			const folder = this.mailViewModel.getFolder();
			return mithril_default(BackgroundColumnLayout, {
				backgroundColor: theme.navigation_bg,
				desktopToolbar: () => mithril_default(DesktopListToolbar, mithril_default(SelectAllCheckbox, selectionAttrsForList(this.mailViewModel)), this.renderFilterButton()),
				columnLayout: folder ? mithril_default("", { style: { marginBottom: px(conversationCardMargin) } }, mithril_default(MailListView, {
					key: getElementId(folder),
					mailViewModel: this.mailViewModel,
					onSingleSelection: (mail) => {
						this.mailViewModel.onSingleSelection(mail);
						if (!this.mailViewModel.listModel?.isInMultiselect()) {
							this.viewSlider.focus(this.mailColumn);
							Promise.resolve().then(() => {
								const conversationViewModel = this.mailViewModel.getConversationViewModel();
								if (conversationViewModel && isSameId(mail._id, conversationViewModel.primaryMail._id)) conversationViewModel?.primaryViewModel().setUnread(false);
							});
						}
					},
					onSingleInclusiveSelection: (...args) => {
						this.mailViewModel?.onSingleInclusiveSelection(...args);
					},
					onRangeSelectionTowards: (...args) => {
						this.mailViewModel.onRangeSelectionTowards(...args);
					},
					onSingleExclusiveSelection: (...args) => {
						this.mailViewModel.onSingleExclusiveSelection(...args);
					},
					onClearFolder: async () => {
						const folder$1 = this.mailViewModel.getFolder();
						if (folder$1 == null) {
							console.warn("Cannot delete folder, no folder is selected");
							return;
						}
						const confirmed = await Dialog.confirm(lang.getTranslation("confirmDeleteFinallySystemFolder_msg", { "{1}": getFolderName(folder$1) }));
						if (confirmed) showProgressDialog("progressDeleting_msg", this.mailViewModel.finallyDeleteAllMailsInSelectedFolder(folder$1));
					}
				})) : null,
				mobileHeader: () => this.mailViewModel.listModel?.isInMultiselect() ? mithril_default(MultiselectMobileHeader, {
					...selectionAttrsForList(this.mailViewModel.listModel),
					message: getMailSelectionMessage(this.mailViewModel.listModel.getSelectedAsArray())
				}) : mithril_default(MobileHeader, {
					...vnode.attrs.header,
					title: this.listColumn.getTitle(),
					columnType: "first",
					actions: [this.renderFilterButton(), mithril_default(EnterMultiselectIconButton, { clickAction: () => {
						this.mailViewModel.listModel?.enterMultiselect();
					} })],
					primaryAction: () => this.renderHeaderRightView(),
					backAction: () => this.viewSlider.focusPreviousColumn()
				})
			});
		} }, ColumnType.Background, {
			minWidth: size.second_col_min_width,
			maxWidth: size.second_col_max_width,
			headerCenter: () => {
				const folder = this.mailViewModel.getFolder();
				return folder ? lang.makeTranslation("folder_name", getFolderName(folder)) : "emptyString_msg";
			}
		});
		this.mailColumn = new ViewColumn({ view: () => {
			const viewModel = this.conversationViewModel;
			if (viewModel) return this.renderSingleMailViewer(vnode.attrs.header, viewModel);
else return this.renderMultiMailViewer(vnode.attrs.header);
		} }, ColumnType.Background, {
			minWidth: size.third_col_min_width,
			maxWidth: size.third_col_max_width,
			ariaLabel: () => lang.get("email_label")
		});
		this.viewSlider = new ViewSlider([
			this.folderColumn,
			this.listColumn,
			this.mailColumn
		]);
		this.viewSlider.focusedColumn = this.listColumn;
		const shortcuts = this.getShortcuts();
		vnode.attrs.mailViewModel.init();
		this.oncreate = (vnode$1) => {
			this.countersStream = mailLocator.mailModel.mailboxCounters.map(mithril_default.redraw);
			keyManager.registerShortcuts(shortcuts);
			this.cache.conversationViewPreference = deviceConfig.getConversationViewShowOnlySelectedMail();
		};
		this.onremove = () => {
			this.mailViewModel.listModel?.cancelLoadAll();
			this.countersStream?.end(true);
			this.countersStream = null;
			keyManager.unregisterShortcuts(shortcuts);
		};
	}
	renderFilterButton() {
		return mithril_default(MailFilterButton, {
			filter: this.mailViewModel.filterType,
			setFilter: (filter) => this.mailViewModel.setFilter(filter)
		});
	}
	mailViewerSingleActions(viewModel) {
		return mithril_default(MailViewerActions, {
			mailboxModel: viewModel.primaryViewModel().mailboxModel,
			mailModel: viewModel.primaryViewModel().mailModel,
			mailViewerViewModel: viewModel.primaryViewModel(),
			mails: [viewModel.primaryMail]
		});
	}
	renderSingleMailViewer(header, viewModel) {
		return mithril_default(BackgroundColumnLayout, {
			backgroundColor: theme.navigation_bg,
			desktopToolbar: () => mithril_default(DesktopViewerToolbar, this.mailViewerSingleActions(viewModel)),
			mobileHeader: () => mithril_default(MobileHeader, {
				...header,
				backAction: () => {
					this.viewSlider.focusPreviousColumn();
				},
				columnType: "other",
				actions: null,
				multicolumnActions: () => this.mailViewerSingleActions(viewModel),
				primaryAction: () => this.renderHeaderRightView(),
				title: getConversationTitle(viewModel)
			}),
			columnLayout: mithril_default(ConversationViewer, {
				key: getElementId(viewModel.primaryMail),
				viewModel,
				delayBodyRendering: this.viewSlider.waitForAnimation()
			})
		});
	}
	mailViewerMultiActions() {
		return mithril_default(MailViewerActions, {
			mailboxModel: locator.mailboxModel,
			mailModel: mailLocator.mailModel,
			mails: this.mailViewModel.listModel?.getSelectedAsArray() ?? [],
			selectNone: () => this.mailViewModel.listModel?.selectNone()
		});
	}
	renderMultiMailViewer(header) {
		return mithril_default(BackgroundColumnLayout, {
			backgroundColor: theme.navigation_bg,
			desktopToolbar: () => mithril_default(DesktopViewerToolbar, this.mailViewerMultiActions()),
			mobileHeader: () => mithril_default(MobileHeader, {
				actions: this.mailViewerMultiActions(),
				primaryAction: () => this.renderHeaderRightView(),
				backAction: () => this.viewSlider.focusPreviousColumn(),
				...header,
				columnType: "other"
			}),
			columnLayout: mithril_default(MultiItemViewer, {
				selectedEntities: this.mailViewModel.listModel?.getSelectedAsArray() ?? [],
				selectNone: () => {
					this.mailViewModel.listModel?.selectNone();
				},
				loadAll: () => this.mailViewModel.listModel?.loadAll(),
				stopLoadAll: () => this.mailViewModel.listModel?.cancelLoadAll(),
				loadingAll: this.mailViewModel.listModel?.isLoadingAll() ? "loading" : this.mailViewModel.listModel?.loadingStatus === ListLoadingState.Done ? "loaded" : "can_load",
				getSelectionMessage: (selected) => getMailSelectionMessage(selected)
			})
		});
	}
	view({ attrs }) {
		return mithril_default("#mail.main-view", {
			ondragover: (ev) => {
				ev.stopPropagation();
				ev.preventDefault();
			},
			ondrop: (ev) => {
				if (isNewMailActionAvailable() && ev.dataTransfer?.files && ev.dataTransfer.files.length > 0) this.handleFileDrop({
					dropType: DropType.ExternalFile,
					files: fileListToArray(ev.dataTransfer.files)
				});
				ev.stopPropagation();
				ev.preventDefault();
			}
		}, mithril_default(this.viewSlider, {
			header: mithril_default(Header, {
				rightView: this.renderHeaderRightView(),
				searchBar: () => locator.logins.isInternalUserLoggedIn() ? mithril_default(LazySearchBar, {
					placeholder: lang.get("searchEmails_placeholder"),
					disabled: !locator.logins.isFullyLoggedIn()
				}) : null,
				...attrs.header
			}),
			bottomNav: styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.mailColumn && this.conversationViewModel ? mithril_default(MobileMailActionBar, { viewModel: this.conversationViewModel.primaryViewModel() }) : styles.isSingleColumnLayout() && this.mailViewModel.listModel?.isInMultiselect() ? mithril_default(MobileMailMultiselectionActionBar, {
				mails: this.mailViewModel.listModel.getSelectedAsArray(),
				selectNone: () => this.mailViewModel.listModel?.selectNone(),
				mailModel: mailLocator.mailModel,
				mailboxModel: locator.mailboxModel
			}) : mithril_default(BottomNav)
		}));
	}
	getViewSlider() {
		return this.viewSlider;
	}
	handleBackButton() {
		const listModel = this.mailViewModel.listModel;
		if (listModel && listModel.isInMultiselect()) {
			listModel.selectNone();
			return true;
		} else if (this.viewSlider.isFirstBackgroundColumnFocused()) {
			const folder = this.mailViewModel.getFolder();
			if (folder == null || getMailFolderType(folder) !== MailSetKind.INBOX) {
				this.mailViewModel.switchToFolder(MailSetKind.INBOX);
				return true;
			} else return false;
		} else return false;
	}
	renderHeaderRightView() {
		return isNewMailActionAvailable() ? [mithril_default(IconButton, {
			title: "newMail_action",
			click: () => this.showNewMailDialog().catch(ofClass(PermissionError, noOp)),
			icon: Icons.PencilSquare
		})] : null;
	}
	getShortcuts() {
		return [
			...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.mailViewModel),
			{
				key: Keys.N,
				exec: () => {
					this.showNewMailDialog().catch(ofClass(PermissionError, noOp));
				},
				enabled: () => !!this.mailViewModel.getFolder() && isNewMailActionAvailable(),
				help: "newMail_action"
			},
			{
				key: Keys.DELETE,
				exec: () => {
					if (this.mailViewModel.listModel) this.deleteMails(this.mailViewModel.listModel.getSelectedAsArray());
				},
				help: "deleteEmails_action"
			},
			{
				key: Keys.BACKSPACE,
				exec: () => {
					if (this.mailViewModel.listModel) this.deleteMails(this.mailViewModel.listModel.getSelectedAsArray());
				},
				help: "deleteEmails_action"
			},
			{
				key: Keys.A,
				exec: () => {
					if (this.mailViewModel.listModel) archiveMails(this.mailViewModel.listModel.getSelectedAsArray());
					return true;
				},
				help: "archive_action",
				enabled: () => locator.logins.isInternalUserLoggedIn()
			},
			{
				key: Keys.I,
				exec: () => {
					if (this.mailViewModel.listModel) moveToInbox(this.mailViewModel.listModel.getSelectedAsArray());
					return true;
				},
				help: "moveToInbox_action"
			},
			{
				key: Keys.V,
				exec: () => {
					this.moveMails();
					return true;
				},
				help: "move_action"
			},
			{
				key: Keys.L,
				exec: () => {
					this.labels();
					return true;
				},
				help: "labels_label"
			},
			{
				key: Keys.U,
				exec: () => {
					if (this.mailViewModel.listModel) this.toggleUnreadMails(this.mailViewModel.listModel.getSelectedAsArray());
				},
				help: "toggleUnread_action"
			},
			{
				key: Keys.ONE,
				exec: () => {
					this.mailViewModel.switchToFolder(MailSetKind.INBOX);
					return true;
				},
				help: "switchInbox_action"
			},
			{
				key: Keys.TWO,
				exec: () => {
					this.mailViewModel.switchToFolder(MailSetKind.DRAFT);
					return true;
				},
				help: "switchDrafts_action"
			},
			{
				key: Keys.THREE,
				exec: () => {
					this.mailViewModel.switchToFolder(MailSetKind.SENT);
					return true;
				},
				help: "switchSentFolder_action"
			},
			{
				key: Keys.FOUR,
				exec: () => {
					this.mailViewModel.switchToFolder(MailSetKind.TRASH);
					return true;
				},
				help: "switchTrash_action"
			},
			{
				key: Keys.FIVE,
				exec: () => {
					this.mailViewModel.switchToFolder(MailSetKind.ARCHIVE);
					return true;
				},
				enabled: () => locator.logins.isInternalUserLoggedIn(),
				help: "switchArchive_action"
			},
			{
				key: Keys.SIX,
				exec: () => {
					this.mailViewModel.switchToFolder(MailSetKind.SPAM);
					return true;
				},
				enabled: () => locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.InternalCommunication),
				help: "switchSpam_action"
			},
			{
				key: Keys.CTRL,
				exec: () => false,
				enabled: canDoDragAndDropExport,
				help: "dragAndDrop_action"
			},
			{
				key: Keys.P,
				exec: () => {
					this.pressRelease();
					return true;
				},
				help: "emptyString_msg",
				enabled: () => locator.logins.isEnabled(FeatureType.Newsletter)
			}
		];
	}
	async pressRelease() {
		const { openPressReleaseEditor } = await import("./PressReleaseEditor-chunk.js");
		const mailboxDetails = await this.mailViewModel.getMailboxDetails();
		if (mailboxDetails) openPressReleaseEditor(mailboxDetails);
	}
	moveMails() {
		const mailList = this.mailViewModel.listModel;
		if (mailList == null) return;
		const selectedMails = mailList.getSelectedAsArray();
		showMoveMailsDropdown(locator.mailboxModel, mailLocator.mailModel, getMoveMailBounds(), selectedMails);
	}
	/**
	*Shortcut Method to show Labels dropdown only when atleast one mail is selected.
	*/
	labels() {
		const mailList = this.mailViewModel.listModel;
		if (mailList == null || !mailLocator.mailModel.canAssignLabels()) return;
		const labels = mailLocator.mailModel.getLabelStatesForMails(mailList.getSelectedAsArray());
		const selectedMails = mailList.getSelectedAsArray();
		if (isEmpty(labels) || isEmpty(selectedMails)) return;
		const popup = new LabelsPopup(document.activeElement, getMoveMailBounds(), styles.isDesktopLayout() ? 300 : 200, mailLocator.mailModel.getLabelsForMails(selectedMails), mailLocator.mailModel.getLabelStatesForMails(selectedMails), (addedLabels, removedLabels) => mailLocator.mailModel.applyLabels(selectedMails, addedLabels, removedLabels));
		popup.show();
	}
	createFolderColumn(editingFolderForMailGroup = null, drawerAttrs) {
		return new ViewColumn({ view: () => {
			return mithril_default(FolderColumnView, {
				drawer: drawerAttrs,
				button: editingFolderForMailGroup ? null : !styles.isUsingBottomNavigation() && isNewMailActionAvailable() ? {
					label: "newMail_action",
					click: () => this.showNewMailDialog().catch(ofClass(PermissionError, noOp))
				} : null,
				content: this.renderFoldersAndLabels(editingFolderForMailGroup),
				ariaLabel: "folderTitle_label"
			});
		} }, editingFolderForMailGroup ? ColumnType.Background : ColumnType.Foreground, {
			minWidth: size.first_col_min_width,
			maxWidth: size.first_col_max_width,
			headerCenter: "folderTitle_label"
		});
	}
	renderFoldersAndLabels(editingFolderForMailGroup) {
		const details = locator.mailboxModel.mailboxDetails() ?? [];
		return [...details.map((mailboxDetail) => {
			return this.renderFoldersAndLabelsForMailbox(mailboxDetail, editingFolderForMailGroup);
		})];
	}
	renderFoldersAndLabelsForMailbox(mailboxDetail, editingFolderForMailGroup) {
		const inEditMode = editingFolderForMailGroup === mailboxDetail.mailGroup._id;
		if (editingFolderForMailGroup && !inEditMode) return null;
else return mithril_default(SidebarSection, { name: lang.makeTranslation("mailbox_name", getMailboxName(locator.logins, mailboxDetail)) }, [this.createMailboxFolderItems(mailboxDetail, inEditMode, () => {
			EditFoldersDialog.showEdit(() => this.renderFoldersAndLabels(mailboxDetail.mailGroup._id));
		}), mailLocator.mailModel.canManageLabels() ? this.renderMailboxLabelItems(mailboxDetail, inEditMode, () => {
			EditFoldersDialog.showEdit(() => this.renderFoldersAndLabels(mailboxDetail.mailGroup._id));
		}) : null]);
	}
	createMailboxFolderItems(mailboxDetail, inEditMode, onEditMailbox) {
		return mithril_default(MailFoldersView, {
			mailModel: mailLocator.mailModel,
			mailboxDetail,
			expandedFolders: this.expandedState,
			mailFolderElementIdToSelectedMailId: this.mailViewModel.getMailFolderToSelectedMail(),
			onFolderClick: () => {
				if (!inEditMode) this.viewSlider.focus(this.listColumn);
			},
			onFolderExpanded: (folder, state) => this.setExpandedState(folder, state),
			onShowFolderAddEditDialog: (...args) => this.showFolderAddEditDialog(...args),
			onDeleteCustomMailFolder: (folder) => this.deleteCustomMailFolder(mailboxDetail, folder),
			onFolderDrop: (dropData, folder) => {
				if (dropData.dropType == DropType.Mail) this.handleFolderMailDrop(dropData, folder);
else if (dropData.dropType == DropType.ExternalFile) this.handeFolderFileDrop(dropData, mailboxDetail, folder);
			},
			inEditMode,
			onEditMailbox
		});
	}
	setExpandedState(folder, currentExpansionState) {
		if (currentExpansionState) this.expandedState.delete(getElementId(folder));
else this.expandedState.add(getElementId(folder));
		deviceConfig.setExpandedFolders(locator.logins.getUserController().userId, [...this.expandedState]);
	}
	onNewUrl(args, requestedPath) {
		if (requestedPath.startsWith("/mailto")) {
			if (location.hash.length > 5) {
				let url = location.hash.substring(5);
				let decodedUrl = decodeURIComponent(url);
				Promise.all([locator.mailboxModel.getUserMailboxDetails(), import("./MailEditor2-chunk.js")]).then(([mailboxDetails, { newMailtoUrlMailEditor }]) => {
					newMailtoUrlMailEditor(decodedUrl, false, mailboxDetails).then((editor) => editor.show()).catch(ofClass(CancelledError, noOp));
					history.pushState("", document.title, window.location.pathname);
				});
			}
		} else if (args.action === "supportMail" && locator.logins.isGlobalAdminUserLoggedIn()) import("./MailEditor2-chunk.js").then(({ writeSupportMail }) => writeSupportMail());
		if (isApp()) {
			let userGroupInfo = locator.logins.getUserController().userGroupInfo;
			locator.pushService.closePushNotification(userGroupInfo.mailAddressAliases.map((alias) => alias.mailAddress).concat(userGroupInfo.mailAddress || []));
		}
		if (typeof args.mail === "string") {
			const [mailListId, mailId] = args.mail.split(",");
			if (mailListId && mailId) {
				this.mailViewModel.showStickyMail([mailListId, mailId], () => showSnackBar({
					message: "mailMoved_msg",
					button: {
						label: "ok_action",
						click: noOp
					}
				}));
				this.viewSlider.focus(this.mailColumn);
			} else this.showMail(args);
		} else this.showMail(args);
	}
	showMail(args) {
		this.mailViewModel.showMailWithMailSetId(args.folderId, args.mailId);
		if (styles.isSingleColumnLayout() && !args.mailId && this.viewSlider.focusedColumn === this.mailColumn) this.viewSlider.focus(this.listColumn);
	}
	async handleFileDrop(fileDrop) {
		try {
			const [mailbox, dataFiles, { appendEmailSignature }, { newMailEditorFromTemplate }] = await Promise.all([
				this.mailViewModel.getMailboxDetails(),
				readLocalFiles(fileDrop.files),
				import("./Signature2-chunk.js"),
				import("./MailEditor2-chunk.js")
			]);
			if (mailbox != null) {
				const dialog = await newMailEditorFromTemplate(mailbox, {}, "", appendEmailSignature("", locator.logins.getUserController().props), dataFiles);
				dialog.show();
			}
		} catch (e) {
			if (!(e instanceof PermissionError)) throw e;
		}
	}
	async handleFolderMailDrop(dropData, folder) {
		const { mailId } = dropData;
		if (!this.mailViewModel.listModel) return;
		let mailsToMove = [];
		if (this.mailViewModel.listModel.isItemSelected(mailId)) mailsToMove = this.mailViewModel.listModel.getSelectedAsArray();
else {
			const entity = this.mailViewModel.listModel.getMail(mailId);
			if (entity) mailsToMove.push(entity);
		}
		moveMails({
			mailboxModel: locator.mailboxModel,
			mailModel: mailLocator.mailModel,
			mails: mailsToMove,
			targetMailFolder: folder
		});
	}
	async handeFolderFileDrop(dropData, mailboxDetail, mailFolder) {
		function droppedOnlyMailFiles(files) {
			return files.every((f) => f.name.endsWith(".eml") || f.name.endsWith(".mbox"));
		}
		await this.handleFileDrop(dropData);
	}
	async showNewMailDialog() {
		const mailboxDetails = await this.mailViewModel.getMailboxDetails();
		if (mailboxDetails == null) return;
		const { newMailEditor } = await import("./MailEditor2-chunk.js");
		const dialog = await newMailEditor(mailboxDetails);
		dialog.show();
	}
	async deleteCustomMailFolder(mailboxDetail, folder) {
		if (folder.folderType !== MailSetKind.CUSTOM) throw new Error("Cannot delete non-custom folder: " + String(folder._id));
		this.mailViewModel?.listModel?.selectNone();
		if (mailboxDetail.mailbox.folders == null) return;
		const folders = await mailLocator.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id);
		if (isSpamOrTrashFolder(folders, folder)) {
			const confirmed = await Dialog.confirm(lang.getTranslation("confirmDeleteFinallyCustomFolder_msg", { "{1}": getFolderName(folder) }));
			if (!confirmed) return;
			await mailLocator.mailModel.finallyDeleteCustomMailFolder(folder);
		} else {
			const confirmed = await Dialog.confirm(lang.getTranslation("confirmDeleteCustomFolder_msg", { "{1}": getFolderName(folder) }));
			if (!confirmed) return;
			await mailLocator.mailModel.trashFolderAndSubfolders(folder);
		}
	}
	logout() {
		mithril_default.route.set("/");
	}
	async toggleUnreadMails(mails) {
		if (mails.length == 0) return;
		await mailLocator.mailModel.markMails(mails, !mails[0].unread);
	}
	deleteMails(mails) {
		return promptAndDeleteMails(mailLocator.mailModel, mails, noOp);
	}
	async showFolderAddEditDialog(mailGroupId, folder, parentFolder) {
		const mailboxDetail = await locator.mailboxModel.getMailboxDetailsForMailGroup(mailGroupId);
		await showEditFolderDialog(mailboxDetail, folder, parentFolder);
	}
	async showLabelAddDialog(mailbox) {
		await showEditLabelDialog(mailbox, this.mailViewModel, null);
	}
	async showLabelEditDialog(label) {
		await showEditLabelDialog(null, this.mailViewModel, label);
	}
	async showLabelDeleteDialog(label) {
		const confirmed = await Dialog.confirm(lang.getTranslation("confirmDeleteLabel_msg", { "{1}": label.name }));
		if (!confirmed) return;
		await this.mailViewModel.deleteLabel(label);
	}
	renderMailboxLabelItems(mailboxDetail, inEditMode, onEditMailbox) {
		return [mithril_default(SidebarSection, {
			name: "labels_label",
			button: inEditMode ? this.renderAddLabelButton(mailboxDetail) : this.renderEditMailboxButton(onEditMailbox)
		}, [mithril_default(".flex.col", [Array.from(mailLocator.mailModel.getLabelsByGroupId(mailboxDetail.mailGroup._id).values()).map((label) => {
			const path = `${MAIL_PREFIX}/${getElementId(label)}`;
			return mithril_default(SidebarSectionRow, {
				icon: Icons.Label,
				iconColor: getLabelColor(label.color),
				label: lang.makeTranslation(`folder:${label.name}`, label.name),
				path,
				isSelectedPrefix: inEditMode ? false : path,
				disabled: inEditMode,
				onClick: () => {
					if (!inEditMode) this.viewSlider.focus(this.listColumn);
				},
				alwaysShowMoreButton: inEditMode,
				moreButton: attachDropdown({
					mainButtonAttrs: {
						icon: Icons.More,
						title: "more_label"
					},
					childAttrs: () => [{
						label: "edit_action",
						icon: Icons.Edit,
						click: () => {
							this.showLabelEditDialog(label);
						}
					}, {
						label: "delete_action",
						icon: Icons.Trash,
						click: () => {
							this.showLabelDeleteDialog(label);
						}
					}]
				})
			});
		})])]), mithril_default(RowButton, {
			label: "addLabel_action",
			icon: Icons.Add,
			class: "folder-row mlr-button border-radius-small",
			style: { width: `calc(100% - ${px(size.hpad_button * 2)})` },
			onclick: () => {
				this.showLabelAddDialog(mailboxDetail.mailbox);
			}
		})];
	}
	renderEditMailboxButton(onEditMailbox) {
		return mithril_default(IconButton, {
			icon: Icons.Edit,
			size: ButtonSize.Compact,
			title: "edit_action",
			click: onEditMailbox
		});
	}
	renderAddLabelButton(mailboxDetail) {
		return mithril_default(IconButton, {
			title: "addLabel_action",
			icon: Icons.Add,
			click: () => {
				this.showLabelAddDialog(mailboxDetail.mailbox);
			}
		});
	}
};

//#endregion
export { MailView };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbFZpZXctY2h1bmsuanMiLCJuYW1lcyI6WyJkb206IEhUTUxFbGVtZW50IiwibGlzdEVsZW1lbnQ6IE1haWwiLCJtYWlsOiBNYWlsIiwiZm9sZGVyczogRm9sZGVyU3lzdGVtIiwiZXZlbnQ6IERyYWdFdmVudCIsInJvdzogTWFpbCIsInNlbGVjdGVkOiBSZWFkb25seVNldDxNYWlsPiIsInJvdzogVmlydHVhbFJvdzxNYWlsPiIsInNlbGVjdGVkOiBSZWFkb25seUFycmF5PE1haWw+IiwiZHJhZ2dlZE1haWxzOiBBcnJheTxNYWlsPiIsIm1haWxzOiBBcnJheTxNYWlsPiIsIm5vdERvd25sb2FkZWQ6IEFycmF5PHsgbWFpbDogTWFpbDsgZmlsZU5hbWU6IHN0cmluZyB9PiIsImRvd25sb2FkZWQ6IEFycmF5PHsgZmlsZU5hbWU6IHN0cmluZzsgcHJvbWlzZTogUHJvbWlzZTxNYWlsPiB9PiIsImZpbGVOYW1lOiBzdHJpbmciLCJwcm9taXNlOiBQcm9taXNlPE1haWw+Iiwidm5vZGU6IFZub2RlPE1haWxMaXN0Vmlld0F0dHJzPiIsInB1cmdlQnV0dG9uQXR0cnM6IEJ1dHRvbkF0dHJzIiwiZXZlbnQ6IEtleWJvYXJkRXZlbnQiLCJ2bm9kZSIsIml0ZW06IE1haWwiLCJldmVudDogRHJhZ0V2ZW50IHwgS2V5Ym9hcmRFdmVudCIsIm1haWxCb3hEZXRhaWw6IE1haWxib3hEZXRhaWwiLCJlZGl0ZWRGb2xkZXI6IE1haWxGb2xkZXIgfCBudWxsIiwicGFyZW50Rm9sZGVyOiBNYWlsRm9sZGVyIHwgbnVsbCIsInRhcmdldEZvbGRlcnM6IFNlbGVjdG9ySXRlbUxpc3Q8TWFpbEZvbGRlciB8IG51bGw+IiwiZm9sZGVySW5mbzogSW5kZW50ZWRGb2xkZXIiLCJuZXdGb2xkZXI6IE1haWxGb2xkZXIgfCBudWxsIiwiZm9sZGVyOiBNYWlsRm9sZGVyIiwicmVwb3J0YWJsZU1haWxzOiBBcnJheTxNYWlsPiIsImRpYWxvZzogRGlhbG9nIiwibDogSW5kZW50ZWRGb2xkZXIiLCJyOiBJbmRlbnRlZEZvbGRlciIsIm1haWxib3hEZXRhaWw6IE1haWxib3hEZXRhaWwiLCJmb2xkZXJzOiBGb2xkZXJTeXN0ZW0iLCJuYW1lOiBzdHJpbmciLCJtYWlsR3JvdXBJZDogSWQiLCJwYXJlbnRGb2xkZXJJZDogSWRUdXBsZSB8IG51bGwiLCJ2bm9kZTogVm5vZGU8TWFpbEZvbGRlclJvd0F0dHJzPiIsImV2ZW50OiBLZXlib2FyZEV2ZW50IiwiaW5kZW50YXRpb25NYXJnaW46IG51bWJlciIsImNoaWxkcmVuOiBDaGlsZHJlbiIsInN1YlN5c3RlbXM6IHJlYWRvbmx5IEZvbGRlclN1YnRyZWVbXSIsImdyb3VwQ291bnRlcnM6IENvdW50ZXJzIiwiZm9sZGVyczogRm9sZGVyU3lzdGVtIiwiYXR0cnM6IE1haWxGb2xkZXJWaWV3QXR0cnMiLCJwYXRoOiBNYWlsRm9sZGVyW10iLCJpc0ludGVybmFsVXNlcjogYm9vbGVhbiIsImluZGVudGF0aW9uTGV2ZWw6IG51bWJlciIsInJlc3VsdDogeyBjaGlsZHJlbjogQ2hpbGRyZW5bXTsgbnVtUm93czogbnVtYmVyIH0iLCJidXR0b246IE5hdkJ1dHRvbkF0dHJzIiwiY291bnRlcnM6IENvdW50ZXJzIiwic3lzdGVtOiBGb2xkZXJTdWJ0cmVlIiwiZm9sZGVyOiBNYWlsRm9sZGVyIiwib25DbG9zZTogVGh1bmsiLCJwYXJlbnRGb2xkZXI6IE1haWxGb2xkZXIgfCBudWxsIiwiZm9sZGVyTGlzdDogKCkgPT4gQ2hpbGRyZW4iLCJlOiBNb3VzZUV2ZW50IiwiYW5pbWF0aW9uOiBBbmltYXRpb25Qcm9taXNlIHwgbnVsbCIsImU6IEV2ZW50Iiwic2hvcnRjdXQ6IFNob3J0Y3V0IiwiZm9sZGVyczogKCkgPT4gQ2hpbGRyZW4iLCJtYWlsYm94OiBNYWlsQm94IHwgbnVsbCIsIm1haWxWaWV3TW9kZWw6IE1haWxWaWV3TW9kZWwiLCJsYWJlbDogTWFpbEZvbGRlciB8IG51bGwiLCJkaWFsb2c6IERpYWxvZyIsIm5ld0NvbG9yOiBzdHJpbmciLCJ2bm9kZTogVm5vZGU8TWFpbFZpZXdBdHRycz4iLCJmb2xkZXIiLCJ2bm9kZSIsIm0iLCJ2aWV3TW9kZWw6IENvbnZlcnNhdGlvblZpZXdNb2RlbCIsImhlYWRlcjogQXBwSGVhZGVyQXR0cnMiLCJzZWxlY3RlZDogUmVhZG9ubHlBcnJheTxNYWlsPiIsImV2OiBEcmFnRXZlbnQiLCJlZGl0aW5nRm9sZGVyRm9yTWFpbEdyb3VwOiBJZCB8IG51bGwiLCJkcmF3ZXJBdHRyczogRHJhd2VyTWVudUF0dHJzIiwibWFpbGJveERldGFpbDogTWFpbGJveERldGFpbCIsImVkaXRpbmdGb2xkZXJGb3JNYWlsR3JvdXA6IHN0cmluZyB8IG51bGwiLCJpbkVkaXRNb2RlOiBib29sZWFuIiwib25FZGl0TWFpbGJveDogKCkgPT4gdm9pZCIsImZvbGRlcjogTWFpbEZvbGRlciIsImN1cnJlbnRFeHBhbnNpb25TdGF0ZTogYm9vbGVhbiIsImFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4iLCJyZXF1ZXN0ZWRQYXRoOiBzdHJpbmciLCJmaWxlRHJvcDogRmlsZURyb3BEYXRhIiwiZHJvcERhdGE6IE1haWxEcm9wRGF0YSIsIm1haWxzVG9Nb3ZlOiBNYWlsW10iLCJkcm9wRGF0YTogRmlsZURyb3BEYXRhIiwibWFpbEZvbGRlcjogTWFpbEZvbGRlciIsImZpbGVzOiBBcnJheTxGaWxlPiIsIm1haWxzOiBNYWlsW10iLCJtYWlsR3JvdXBJZDogSWQiLCJmb2xkZXI6IE1haWxGb2xkZXIgfCBudWxsIiwicGFyZW50Rm9sZGVyOiBNYWlsRm9sZGVyIHwgbnVsbCIsIm1haWxib3g6IE1haWxCb3giLCJsYWJlbDogTWFpbEZvbGRlciIsIm9uRWRpdE1haWxib3g6ICgpID0+IHVua25vd24iXSwic291cmNlcyI6WyIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L01haWxMaXN0Vmlldy50cyIsIi4uL3NyYy9tYWlsLWFwcC9tYWlsL3ZpZXcvRWRpdEZvbGRlckRpYWxvZy50cyIsIi4uL3NyYy9tYWlsLWFwcC9tYWlsL3ZpZXcvTWFpbEZvbGRlclJvdy50cyIsIi4uL3NyYy9tYWlsLWFwcC9tYWlsL3ZpZXcvTWFpbEZvbGRlcnNWaWV3LnRzIiwiLi4vc3JjL21haWwtYXBwL21haWwvdmlldy9FZGl0Rm9sZGVyc0RpYWxvZy50cyIsIi4uL3NyYy9tYWlsLWFwcC9tYWlsL3ZpZXcvRWRpdExhYmVsRGlhbG9nLnRzIiwiLi4vc3JjL21haWwtYXBwL21haWwvdmlldy9NYWlsVmlldy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuXG5pbXBvcnQgeyBLZXlzLCBNYWlsU2V0S2luZCwgTWFpbFN0YXRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB0eXBlIHsgTWFpbCwgTWFpbEZvbGRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IHNpemUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplXCJcbmltcG9ydCB7IHN0eWxlcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3N0eWxlc1wiXG5pbXBvcnQgeyBJY29uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29uc1wiXG5pbXBvcnQgdHlwZSB7IEJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgQnV0dG9uLCBCdXR0b25Db2xvciwgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIEFzeW5jUmVzdWx0LCBkb3duY2FzdCwgbmV2ZXJOdWxsLCBwcm9taXNlTWFwIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IGdldEVsZW1lbnRJZCwgZ2V0TGV0SWQsIGhhdmVTYW1lSWQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHNcIlxuaW1wb3J0IHsgbW92ZU1haWxzLCBwcm9tcHRBbmREZWxldGVNYWlscyB9IGZyb20gXCIuL01haWxHdWlVdGlsc1wiXG5pbXBvcnQgeyBNYWlsUm93IH0gZnJvbSBcIi4vTWFpbFJvd1wiXG5pbXBvcnQgeyBtYWtlVHJhY2tlZFByb2dyZXNzTW9uaXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Qcm9ncmVzc01vbml0b3JcIlxuaW1wb3J0IHsgZ2VuZXJhdGVNYWlsRmlsZSwgZ2V0TWFpbEV4cG9ydE1vZGUgfSBmcm9tIFwiLi4vZXhwb3J0L0V4cG9ydGVyXCJcbmltcG9ydCB7IGRlZHVwbGljYXRlRmlsZW5hbWVzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0ZpbGVVdGlsc1wiXG5pbXBvcnQgeyBkb3dubG9hZE1haWxCdW5kbGUgfSBmcm9tIFwiLi4vZXhwb3J0L0J1bmRsZXJcIlxuaW1wb3J0IHsgTGlzdENvbHVtbldyYXBwZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9MaXN0Q29sdW1uV3JhcHBlclwiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBGb2xkZXJTeXN0ZW0gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vbWFpbC9Gb2xkZXJTeXN0ZW0uanNcIlxuaW1wb3J0IHsgTWFpbFZpZXdNb2RlbCB9IGZyb20gXCIuL01haWxWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgTGlzdCwgTGlzdEF0dHJzLCBMaXN0U3dpcGVEZWNpc2lvbiwgTXVsdGlzZWxlY3RNb2RlLCBSZW5kZXJDb25maWcsIFN3aXBlQ29uZmlndXJhdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTGlzdC5qc1wiXG5pbXBvcnQgQ29sdW1uRW1wdHlNZXNzYWdlQm94IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQ29sdW1uRW1wdHlNZXNzYWdlQm94LmpzXCJcbmltcG9ydCB7IEJvb3RJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvQm9vdEljb25zLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgVmlydHVhbFJvdyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTGlzdFV0aWxzLmpzXCJcbmltcG9ydCB7IGlzS2V5UHJlc3NlZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9LZXlNYW5hZ2VyLmpzXCJcbmltcG9ydCB7IG1haWxMb2NhdG9yIH0gZnJvbSBcIi4uLy4uL21haWxMb2NhdG9yLmpzXCJcbmltcG9ydCB7IGFzc2VydFN5c3RlbUZvbGRlck9mVHlwZSB9IGZyb20gXCIuLi9tb2RlbC9NYWlsVXRpbHMuanNcIlxuaW1wb3J0IHsgY2FuRG9EcmFnQW5kRHJvcEV4cG9ydCB9IGZyb20gXCIuL01haWxWaWV3ZXJVdGlscy5qc1wiXG5pbXBvcnQgeyBpc09mVHlwZU9yU3ViZm9sZGVyT2YgfSBmcm9tIFwiLi4vbW9kZWwvTWFpbENoZWNrcy5qc1wiXG5pbXBvcnQgeyBEcm9wVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvR3VpVXRpbHNcIlxuaW1wb3J0IHsgTGlzdEVsZW1lbnRMaXN0TW9kZWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGlzdEVsZW1lbnRMaXN0TW9kZWxcIlxuaW1wb3J0IHsgZ2VuZXJhdGVFeHBvcnRGaWxlTmFtZSB9IGZyb20gXCIuLi9leHBvcnQvZW1sVXRpbHMuanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcblxuZXhwb3J0IGludGVyZmFjZSBNYWlsTGlzdFZpZXdBdHRycyB7XG5cdC8vIFdlIHdvdWxkIGxpa2UgdG8gbm90IGdldCBhbmQgaG9sZCB0byB0aGUgd2hvbGUgTWFpbFZpZXcgZXZlbnR1YWxseVxuXHQvLyBidXQgZm9yIHRoYXQgd2UgbmVlZCB0byByZXdyaXRlIHRoZSBMaXN0XG5cdG9uQ2xlYXJGb2xkZXI6ICgpID0+IHVua25vd25cblx0bWFpbFZpZXdNb2RlbDogTWFpbFZpZXdNb2RlbFxuXHRvblNpbmdsZVNlbGVjdGlvbjogKG1haWw6IE1haWwpID0+IHVua25vd25cblx0b25TaW5nbGVJbmNsdXNpdmVTZWxlY3Rpb246IExpc3RFbGVtZW50TGlzdE1vZGVsPE1haWw+W1wib25TaW5nbGVJbmNsdXNpdmVTZWxlY3Rpb25cIl1cblx0b25SYW5nZVNlbGVjdGlvblRvd2FyZHM6IExpc3RFbGVtZW50TGlzdE1vZGVsPE1haWw+W1wic2VsZWN0UmFuZ2VUb3dhcmRzXCJdXG5cdG9uU2luZ2xlRXhjbHVzaXZlU2VsZWN0aW9uOiBMaXN0RWxlbWVudExpc3RNb2RlbDxNYWlsPltcIm9uU2luZ2xlRXhjbHVzaXZlU2VsZWN0aW9uXCJdXG59XG5cbmV4cG9ydCBjbGFzcyBNYWlsTGlzdFZpZXcgaW1wbGVtZW50cyBDb21wb25lbnQ8TWFpbExpc3RWaWV3QXR0cnM+IHtcblx0Ly8gTWFpbHMgdGhhdCBhcmUgY3VycmVudGx5IGJlaW5nIG9yIGhhdmUgYWxyZWFkeSBiZWVuIGRvd25sb2FkZWQvYnVuZGxlZC9zYXZlZFxuXHQvLyBNYXAgb2YgKE1haWwuX2lkICsrIE1haWxFeHBvcnRNb2RlKSAtPiBQcm9taXNlPEZpbGVwYXRoPlxuXHQvLyBUT0RPIHRoaXMgY3VycmVudGx5IGdyb3dzIGJpZ2dlciBhbmQgYmlnZ2VyIGFuZCBiaWdnZXIgaWYgdGhlIHVzZXIgZ29lcyBvbiBhbiBleHBvcnRpbmcgc3ByZWUuXG5cdC8vICBtYXliZSB3ZSBzaG91bGQgZGVhbCB3aXRoIHRoaXMsIG9yIG1heWJlIHRoaXMgbmV2ZXIgYmVjb21lcyBhbiBpc3N1ZT9cblx0ZXhwb3J0ZWRNYWlsczogTWFwPFxuXHRcdHN0cmluZyxcblx0XHR7XG5cdFx0XHRmaWxlTmFtZTogc3RyaW5nXG5cdFx0XHRyZXN1bHQ6IEFzeW5jUmVzdWx0PGFueT5cblx0XHR9XG5cdD5cblx0Ly8gVXNlZCBmb3IgbW9kaWZ5aW5nIHRoZSBjdXJzb3IgZHVyaW5nIGRyYWcgYW5kIGRyb3Bcblx0X2xpc3REb206IEhUTUxFbGVtZW50IHwgbnVsbFxuXHRzaG93aW5nU3BhbU9yVHJhc2g6IGJvb2xlYW4gPSBmYWxzZVxuXHRzaG93aW5nRHJhZnQ6IGJvb2xlYW4gPSBmYWxzZVxuXHRzaG93aW5nQXJjaGl2ZTogYm9vbGVhbiA9IGZhbHNlXG5cdHByaXZhdGUgYXR0cnM6IE1haWxMaXN0Vmlld0F0dHJzXG5cblx0cHJpdmF0ZSBnZXQgbWFpbFZpZXdNb2RlbCgpOiBNYWlsVmlld01vZGVsIHtcblx0XHRyZXR1cm4gdGhpcy5hdHRycy5tYWlsVmlld01vZGVsXG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IHJlbmRlckNvbmZpZzogUmVuZGVyQ29uZmlnPE1haWwsIE1haWxSb3c+ID0ge1xuXHRcdGl0ZW1IZWlnaHQ6IHNpemUubGlzdF9yb3dfaGVpZ2h0LFxuXHRcdG11bHRpc2VsZWN0aW9uQWxsb3dlZDogTXVsdGlzZWxlY3RNb2RlLkVuYWJsZWQsXG5cdFx0Y3JlYXRlRWxlbWVudDogKGRvbTogSFRNTEVsZW1lbnQpID0+IHtcblx0XHRcdGNvbnN0IG1haWxSb3cgPSBuZXcgTWFpbFJvdyhcblx0XHRcdFx0dGhpcy5tYWlsVmlld01vZGVsLmdldFNlbGVjdGVkTWFpbFNldEtpbmQoKSA9PT0gTWFpbFNldEtpbmQuTEFCRUwsXG5cdFx0XHRcdChtYWlsKSA9PiB0aGlzLm1haWxWaWV3TW9kZWwuZ2V0TGFiZWxzRm9yTWFpbChtYWlsKSxcblx0XHRcdFx0KGVudGl0eSkgPT4gdGhpcy5hdHRycy5vblNpbmdsZUV4Y2x1c2l2ZVNlbGVjdGlvbihlbnRpdHkpLFxuXHRcdFx0KVxuXHRcdFx0bS5yZW5kZXIoZG9tLCBtYWlsUm93LnJlbmRlcigpKVxuXHRcdFx0cmV0dXJuIG1haWxSb3dcblx0XHR9LFxuXHRcdHN3aXBlOiBsb2NhdG9yLmxvZ2lucy5pc0ludGVybmFsVXNlckxvZ2dlZEluKClcblx0XHRcdD8gKHtcblx0XHRcdFx0XHRyZW5kZXJMZWZ0U3BhY2VyOiAoKSA9PiB0aGlzLnJlbmRlckxlZnRTcGFjZXIoKSxcblx0XHRcdFx0XHRyZW5kZXJSaWdodFNwYWNlcjogKCkgPT4gdGhpcy5yZW5kZXJSaWdodFNwYWNlcigpLFxuXHRcdFx0XHRcdHN3aXBlTGVmdDogKGxpc3RFbGVtZW50OiBNYWlsKSA9PiB0aGlzLm9uU3dpcGVMZWZ0KGxpc3RFbGVtZW50KSxcblx0XHRcdFx0XHRzd2lwZVJpZ2h0OiAobGlzdEVsZW1lbnQ6IE1haWwpID0+IHRoaXMub25Td2lwZVJpZ2h0KGxpc3RFbGVtZW50KSxcblx0XHRcdCAgfSBzYXRpc2ZpZXMgU3dpcGVDb25maWd1cmF0aW9uPE1haWw+KVxuXHRcdFx0OiBudWxsLFxuXHRcdGRyYWdTdGFydDogKGV2ZW50LCByb3csIHNlbGVjdGVkKSA9PiB0aGlzLl9uZXdEcmFnU3RhcnQoZXZlbnQsIHJvdywgc2VsZWN0ZWQpLFxuXHR9XG5cblx0Y29uc3RydWN0b3IoeyBhdHRycyB9OiBWbm9kZTxNYWlsTGlzdFZpZXdBdHRycz4pIHtcblx0XHR0aGlzLmF0dHJzID0gYXR0cnNcblx0XHR0aGlzLmV4cG9ydGVkTWFpbHMgPSBuZXcgTWFwKClcblx0XHR0aGlzLl9saXN0RG9tID0gbnVsbFxuXHRcdHRoaXMubWFpbFZpZXdNb2RlbC5zaG93aW5nVHJhc2hPclNwYW1Gb2xkZXIoKS50aGVuKChyZXN1bHQpID0+IHtcblx0XHRcdHRoaXMuc2hvd2luZ1NwYW1PclRyYXNoID0gcmVzdWx0XG5cdFx0XHRtLnJlZHJhdygpXG5cdFx0fSlcblx0XHR0aGlzLm1haWxWaWV3TW9kZWwuc2hvd2luZ0RyYWZ0c0ZvbGRlcigpLnRoZW4oKHJlc3VsdCkgPT4ge1xuXHRcdFx0dGhpcy5zaG93aW5nRHJhZnQgPSByZXN1bHRcblx0XHRcdG0ucmVkcmF3KClcblx0XHR9KVxuXHRcdHRoaXMudGFyZ2V0SW5ib3goKS50aGVuKChyZXN1bHQpID0+IHtcblx0XHRcdHRoaXMuc2hvd2luZ0FyY2hpdmUgPSByZXN1bHRcblx0XHRcdG0ucmVkcmF3KClcblx0XHR9KVxuXG5cdFx0Ly8gXCJ0aGlzXCIgaXMgaW5jb3JyZWN0bHkgYm91bmQgaWYgd2UgZG9uJ3QgZG8gaXQgdGhpcyB3YXlcblx0XHR0aGlzLnZpZXcgPSB0aGlzLnZpZXcuYmluZCh0aGlzKVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRSZWNvdmVyRm9sZGVyKG1haWw6IE1haWwsIGZvbGRlcnM6IEZvbGRlclN5c3RlbSk6IE1haWxGb2xkZXIge1xuXHRcdGlmIChtYWlsLnN0YXRlID09PSBNYWlsU3RhdGUuRFJBRlQpIHtcblx0XHRcdHJldHVybiBhc3NlcnRTeXN0ZW1Gb2xkZXJPZlR5cGUoZm9sZGVycywgTWFpbFNldEtpbmQuRFJBRlQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBhc3NlcnRTeXN0ZW1Gb2xkZXJPZlR5cGUoZm9sZGVycywgTWFpbFNldEtpbmQuSU5CT1gpXG5cdFx0fVxuXHR9XG5cblx0Ly8gTk9URSB3ZSBkbyBhbGwgb2YgdGhlIGVsZWN0cm9uIGRyYWcgaGFuZGxpbmcgZGlyZWN0bHkgaW5zaWRlIE1haWxMaXN0VmlldywgYmVjYXVzZSB3ZSBjdXJyZW50bHkgaGF2ZSBubyBuZWVkIHRvIGdlbmVyYWxpc2Vcblx0Ly8gd291bGQgc3Ryb25nbHkgc3VnZ2VzdCB3aXRoIHN0YXJ0aW5nIGdlbmVyYWxpc2luZyB0aGlzIGZpcnN0IGlmIHdlIGV2ZXIgbmVlZCB0byBzdXBwb3J0IGRyYWdnaW5nIG1vcmUgdGhhbiBqdXN0IG1haWxzXG5cdF9uZXdEcmFnU3RhcnQoZXZlbnQ6IERyYWdFdmVudCwgcm93OiBNYWlsLCBzZWxlY3RlZDogUmVhZG9ubHlTZXQ8TWFpbD4pIHtcblx0XHRpZiAoIXJvdykgcmV0dXJuXG5cdFx0Y29uc3QgbWFpbFVuZGVyQ3Vyc29yID0gcm93XG5cblx0XHRpZiAoaXNFeHBvcnREcmFnRXZlbnQoZXZlbnQpKSB7XG5cdFx0XHQvLyBXZSBoYXZlIHRvIHJlbW92ZSB0aGUgZHJhZyBtb2Qga2V5IGNsYXNzIGhlcmUgYmVjYXVzZSBvbmNlIHRoZSBkcmFnc3RhcnQgaGFzIGJlZ3VuXG5cdFx0XHQvLyB3ZSB3b24ndCByZWNlaXZlIHRoZSBrZXl1cCBldmVudCB0aGF0IHdvdWxkIG5vcm1hbGx5IHJlbW92ZSBpdFxuXHRcdFx0dGhpcy5fbGlzdERvbT8uY2xhc3NMaXN0LnJlbW92ZShcImRyYWctbW9kLWtleVwiKVxuXHRcdFx0Ly8gV2UgaGF2ZSB0byBwcmV2ZW50RGVmYXVsdCBvciB3ZSBnZXQgbXlzdGVyaW91cyBhbmQgaW5jb25zaXN0ZW50IGVsZWN0cm9uIGNyYXNoZXMgYXQgdGhlIGNhbGwgdG8gc3RhcnREcmFnIGluIElQQ1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdFx0Ly8gaWYgdGhlIG1haWwgYmVpbmcgZHJhZ2dlZCBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIG1haWxzIHRoYXQgYXJlIHNlbGVjdGVkLCB0aGVuIHdlIG9ubHkgZHJhZ1xuXHRcdFx0Ly8gdGhlIG1haWwgdGhhdCBpcyBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZCwgdG8gbWF0Y2ggdGhlIGJlaGF2aW91ciBvZiByZWd1bGFyIGluLWFwcCBkcmFnZ2luZyBhbmQgZHJvcHBpbmdcblx0XHRcdC8vIHdoaWNoIHNlZW1pbmdseSBiZWhhdmVzIGhvdyBpdCBkb2VzIGp1c3QgYnkgZGVmYXVsdFxuXHRcdFx0Ly9jb25zdCBkcmFnZ2VkTWFpbHMgPSBzZWxlY3RlZC5maW5kKChtYWlsKSA9PiBoYXZlU2FtZUlkKG1haWwsIG1haWxVbmRlckN1cnNvcikpID8gc2VsZWN0ZWQuc2xpY2UoKSA6IFttYWlsVW5kZXJDdXJzb3JdXG5cdFx0XHRjb25zdCBkcmFnZ2VkTWFpbHMgPSBzZWxlY3RlZC5oYXMobWFpbFVuZGVyQ3Vyc29yKSA/IFsuLi5zZWxlY3RlZF0gOiBbbWFpbFVuZGVyQ3Vyc29yXVxuXG5cdFx0XHR0aGlzLl9kb0V4cG9ydERyYWcoZHJhZ2dlZE1haWxzKVxuXHRcdH0gZWxzZSBpZiAoc3R5bGVzLmlzRGVza3RvcExheW91dCgpKSB7XG5cdFx0XHQvLyBEZXNrdG9wIGxheW91dCBvbmx5IGJlY2F1c2UgaXQgZG9lc24ndCBtYWtlIHNlbnNlIHRvIGRyYWcgbWFpbHMgdG8gZm9sZGVycyB3aGVuIHRoZSBmb2xkZXIgbGlzdCBhbmQgbWFpbCBsaXN0IGFyZW4ndCB2aXNpYmxlIGF0IHRoZSBzYW1lIHRpbWVcblx0XHRcdG5ldmVyTnVsbChldmVudC5kYXRhVHJhbnNmZXIpLnNldERhdGEoRHJvcFR5cGUuTWFpbCwgZ2V0TGV0SWQobmV2ZXJOdWxsKG1haWxVbmRlckN1cnNvcikpWzFdKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0fVxuXHR9XG5cblx0Ly8gTk9URSB3ZSBkbyBhbGwgb2YgdGhlIGVsZWN0cm9uIGRyYWcgaGFuZGxpbmcgZGlyZWN0bHkgaW5zaWRlIE1haWxMaXN0VmlldywgYmVjYXVzZSB3ZSBjdXJyZW50bHkgaGF2ZSBubyBuZWVkIHRvIGdlbmVyYWxpc2Vcblx0Ly8gd291bGQgc3Ryb25nbHkgc3VnZ2VzdCB3aXRoIHN0YXJ0aW5nIGdlbmVyYWxpc2luZyB0aGlzIGZpcnN0IGlmIHdlIGV2ZXIgbmVlZCB0byBzdXBwb3J0IGRyYWdnaW5nIG1vcmUgdGhhbiBqdXN0IG1haWxzXG5cdF9kcmFnU3RhcnQoZXZlbnQ6IERyYWdFdmVudCwgcm93OiBWaXJ0dWFsUm93PE1haWw+LCBzZWxlY3RlZDogUmVhZG9ubHlBcnJheTxNYWlsPikge1xuXHRcdGlmICghcm93LmVudGl0eSkgcmV0dXJuXG5cdFx0Y29uc3QgbWFpbFVuZGVyQ3Vyc29yID0gcm93LmVudGl0eVxuXG5cdFx0aWYgKGlzRXhwb3J0RHJhZ0V2ZW50KGV2ZW50KSkge1xuXHRcdFx0Ly8gV2UgaGF2ZSB0byByZW1vdmUgdGhlIGRyYWcgbW9kIGtleSBjbGFzcyBoZXJlIGJlY2F1c2Ugb25jZSB0aGUgZHJhZ3N0YXJ0IGhhcyBiZWd1blxuXHRcdFx0Ly8gd2Ugd29uJ3QgcmVjZWl2ZSB0aGUga2V5dXAgZXZlbnQgdGhhdCB3b3VsZCBub3JtYWxseSByZW1vdmUgaXRcblx0XHRcdHRoaXMuX2xpc3REb20/LmNsYXNzTGlzdC5yZW1vdmUoXCJkcmFnLW1vZC1rZXlcIilcblx0XHRcdC8vIFdlIGhhdmUgdG8gcHJldmVudERlZmF1bHQgb3Igd2UgZ2V0IG15c3RlcmlvdXMgYW5kIGluY29uc2lzdGVudCBlbGVjdHJvbiBjcmFzaGVzIGF0IHRoZSBjYWxsIHRvIHN0YXJ0RHJhZyBpbiBJUENcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblx0XHRcdC8vIGlmIHRoZSBtYWlsIGJlaW5nIGRyYWdnZWQgaXMgbm90IGluY2x1ZGVkIGluIHRoZSBtYWlscyB0aGF0IGFyZSBzZWxlY3RlZCwgdGhlbiB3ZSBvbmx5IGRyYWdcblx0XHRcdC8vIHRoZSBtYWlsIHRoYXQgaXMgY3VycmVudGx5IGJlaW5nIGRyYWdnZWQsIHRvIG1hdGNoIHRoZSBiZWhhdmlvdXIgb2YgcmVndWxhciBpbi1hcHAgZHJhZ2dpbmcgYW5kIGRyb3BwaW5nXG5cdFx0XHQvLyB3aGljaCBzZWVtaW5nbHkgYmVoYXZlcyBob3cgaXQgZG9lcyBqdXN0IGJ5IGRlZmF1bHRcblx0XHRcdGNvbnN0IGRyYWdnZWRNYWlscyA9IHNlbGVjdGVkLnNvbWUoKG1haWwpID0+IGhhdmVTYW1lSWQobWFpbCwgbWFpbFVuZGVyQ3Vyc29yKSkgPyBzZWxlY3RlZC5zbGljZSgpIDogW21haWxVbmRlckN1cnNvcl1cblxuXHRcdFx0dGhpcy5fZG9FeHBvcnREcmFnKGRyYWdnZWRNYWlscylcblx0XHR9IGVsc2UgaWYgKHN0eWxlcy5pc0Rlc2t0b3BMYXlvdXQoKSkge1xuXHRcdFx0Ly8gRGVza3RvcCBsYXlvdXQgb25seSBiZWNhdXNlIGl0IGRvZXNuJ3QgbWFrZSBzZW5zZSB0byBkcmFnIG1haWxzIHRvIGZvbGRlcnMgd2hlbiB0aGUgZm9sZGVyIGxpc3QgYW5kIG1haWwgbGlzdCBhcmVuJ3QgdmlzaWJsZSBhdCB0aGUgc2FtZSB0aW1lXG5cdFx0XHRuZXZlck51bGwoZXZlbnQuZGF0YVRyYW5zZmVyKS5zZXREYXRhKERyb3BUeXBlLk1haWwsIGdldExldElkKG5ldmVyTnVsbChtYWlsVW5kZXJDdXJzb3IpKVsxXSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIF9kb0V4cG9ydERyYWcoZHJhZ2dlZE1haWxzOiBBcnJheTxNYWlsPik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGFzc2VydE5vdE51bGwoZG9jdW1lbnQuYm9keSkuc3R5bGUuY3Vyc29yID0gXCJwcm9ncmVzc1wiXG5cdFx0Ly8gV2UgbGlzdGVuIHRvIG1vdXNldXAgdG8gZGV0ZWN0IGlmIHRoZSB1c2VyIHJlbGVhc2VkIHRoZSBtb3VzZSBiZWZvcmUgdGhlIGRvd25sb2FkIHdhcyBjb21wbGV0ZVxuXHRcdC8vIHdlIGNhbid0IHVzZSBkcmFnZW5kIGJlY2F1c2Ugd2UgYnJva2UgdGhlIERyYWdFdmVudCBjaGFpbiBieSBjYWxsaW5nIHByZXZlbnQgZGVmYXVsdFxuXHRcdGNvbnN0IG1vdXNldXBQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIHJlc29sdmUsIHtcblx0XHRcdFx0b25jZTogdHJ1ZSxcblx0XHRcdH0pXG5cdFx0fSlcblxuXHRcdGNvbnN0IGZpbGVQYXRoc1Byb21pc2UgPSB0aGlzLl9wcmVwYXJlTWFpbHNGb3JEcmFnKGRyYWdnZWRNYWlscylcblxuXHRcdC8vIElmIHRoZSBkb3dubG9hZCBjb21wbGV0ZXMgYmVmb3JlIHRoZSB1c2VyIHJlbGVhc2VzIHRoZWlyIG1vdXNlLCB0aGVuIHdlIGNhbiBjYWxsIGVsZWN0cm9uIHN0YXJ0IGRyYWcgYW5kIGRvIHRoZSBvcGVyYXRpb25cblx0XHQvLyBvdGhlcndpc2Ugd2UgaGF2ZSB0byBnaXZlIHNvbWUga2luZCBvZiBmZWVkYmFjayB0byB0aGUgdXNlciB0aGF0IHRoZSBkcm9wIHdhcyB1bnN1Y2Nlc3NmdWxcblx0XHRjb25zdCBbZGlkQ29tcGxldGUsIGZpbGVOYW1lc10gPSBhd2FpdCBQcm9taXNlLnJhY2UoW2ZpbGVQYXRoc1Byb21pc2UudGhlbigoZmlsZVBhdGhzKSA9PiBbdHJ1ZSwgZmlsZVBhdGhzXSksIG1vdXNldXBQcm9taXNlLnRoZW4oKCkgPT4gW2ZhbHNlLCBbXV0pXSlcblxuXHRcdGlmIChkaWRDb21wbGV0ZSkge1xuXHRcdFx0YXdhaXQgbG9jYXRvci5maWxlQXBwLnN0YXJ0TmF0aXZlRHJhZyhmaWxlTmFtZXMgYXMgc3RyaW5nW10pXG5cdFx0fSBlbHNlIHtcblx0XHRcdGF3YWl0IGxvY2F0b3IuZGVza3RvcFN5c3RlbUZhY2FkZS5mb2N1c0FwcGxpY2F0aW9uV2luZG93KClcblx0XHRcdERpYWxvZy5tZXNzYWdlKFwidW5zdWNjZXNzZnVsRHJvcF9tc2dcIilcblx0XHR9XG5cblx0XHRuZXZlck51bGwoZG9jdW1lbnQuYm9keSkuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCJcblx0fVxuXG5cdC8qKlxuXHQgKiBHaXZlbiBhIG1haWwsIHdpbGwgcHJlcGFyZSBpdCBieSBkb3dubG9hZGluZywgYnVuZGxpbmcsIHNhdmluZywgdGhlbiByZXR1cm5zIHRoZSBmaWxlcGF0aCBvZiB0aGUgc2F2ZWQgZmlsZS5cblx0ICogQHJldHVybnMge1Byb21pc2U8Uj58UHJvbWlzZTxzdHJpbmc+fVxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0gbWFpbHNcblx0ICovXG5cdGFzeW5jIF9wcmVwYXJlTWFpbHNGb3JEcmFnKG1haWxzOiBBcnJheTxNYWlsPik6IFByb21pc2U8QXJyYXk8c3RyaW5nPj4ge1xuXHRcdGNvbnN0IGV4cG9ydE1vZGUgPSBhd2FpdCBnZXRNYWlsRXhwb3J0TW9kZSgpXG5cdFx0Ly8gMyBhY3Rpb25zIHBlciBtYWlsICsgMSB0byBpbmRpY2F0ZSB0aGF0IHNvbWV0aGluZyBpcyBoYXBwZW5pbmcgKGlmIHRoZSBkb3dubG9hZHMgdGFrZSBhIHdoaWxlKVxuXHRcdGNvbnN0IHByb2dyZXNzTW9uaXRvciA9IG1ha2VUcmFja2VkUHJvZ3Jlc3NNb25pdG9yKGxvY2F0b3IucHJvZ3Jlc3NUcmFja2VyLCAzICogbWFpbHMubGVuZ3RoICsgMSlcblx0XHRwcm9ncmVzc01vbml0b3Iud29ya0RvbmUoMSlcblxuXHRcdGNvbnN0IG1hcEtleSA9IChtYWlsOiBNYWlsKSA9PiBgJHtnZXRMZXRJZChtYWlsKS5qb2luKFwiXCIpfSR7ZXhwb3J0TW9kZX1gXG5cblx0XHRjb25zdCBub3REb3dubG9hZGVkOiBBcnJheTx7IG1haWw6IE1haWw7IGZpbGVOYW1lOiBzdHJpbmcgfT4gPSBbXVxuXHRcdGNvbnN0IGRvd25sb2FkZWQ6IEFycmF5PHsgZmlsZU5hbWU6IHN0cmluZzsgcHJvbWlzZTogUHJvbWlzZTxNYWlsPiB9PiA9IFtdXG5cblx0XHRjb25zdCBoYW5kbGVOb3REb3dubG9hZGVkID0gKG1haWw6IE1haWwpID0+IHtcblx0XHRcdG5vdERvd25sb2FkZWQucHVzaCh7XG5cdFx0XHRcdG1haWwsXG5cdFx0XHRcdGZpbGVOYW1lOiBnZW5lcmF0ZUV4cG9ydEZpbGVOYW1lKGdldEVsZW1lbnRJZChtYWlsKSwgbWFpbC5zdWJqZWN0LCBtYWlsLnJlY2VpdmVkRGF0ZSwgZXhwb3J0TW9kZSksXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdGNvbnN0IGhhbmRsZURvd25sb2FkZWQgPSAoZmlsZU5hbWU6IHN0cmluZywgcHJvbWlzZTogUHJvbWlzZTxNYWlsPikgPT4ge1xuXHRcdFx0Ly8gd2UgZG9uJ3QgaGF2ZSB0byBkbyBhbnl0aGluZyBlbHNlIHdpdGggdGhlIGRvd25sb2FkZWQgb25lc1xuXHRcdFx0Ly8gc28gZmluaXNoIHRoaXMgY2h1bmsgb2Ygd29ya1xuXHRcdFx0cHJvZ3Jlc3NNb25pdG9yLndvcmtEb25lKDMpXG5cdFx0XHRkb3dubG9hZGVkLnB1c2goe1xuXHRcdFx0XHRmaWxlTmFtZSxcblx0XHRcdFx0cHJvbWlzZTogcHJvbWlzZSxcblx0XHRcdH0pXG5cdFx0fVxuXG5cdFx0Ly8gR2F0aGVyIHVwIGZpbGVzIHRoYXQgaGF2ZSBiZWVuIGRvd25sb2FkZWRcblx0XHQvLyBhbmQgYWxsIGZpbGVzIHRoYXQgbmVlZCB0byBiZSBkb3dubG9hZGVkLCBvciB3ZXJlIGFscmVhZHkgZG93bmxvYWRlZCBidXQgaGF2ZSBkaXNhcHBlYXJlZFxuXHRcdGZvciAobGV0IG1haWwgb2YgbWFpbHMpIHtcblx0XHRcdGNvbnN0IGtleSA9IG1hcEtleShtYWlsKVxuXHRcdFx0Y29uc3QgZXhpc3RpbmcgPSB0aGlzLmV4cG9ydGVkTWFpbHMuZ2V0KGtleSlcblxuXHRcdFx0aWYgKCFleGlzdGluZyB8fCBleGlzdGluZy5yZXN1bHQuc3RhdGUoKS5zdGF0dXMgPT09IFwiZmFpbHVyZVwiKSB7XG5cdFx0XHRcdC8vIFNvbWV0aGluZyB3ZW50IHdyb25nIGxhc3QgdGltZSB3ZSB0cmllZCB0byBkcmFnIHRoaXMgZmlsZSxcblx0XHRcdFx0Ly8gc28gdHJ5IGFnYWluIChub3QgY29uZmlkZW50IHRoYXQgaXQgd2lsbCB3b3JrIHRoaXMgdGltZSwgdGhvdWdoKVxuXHRcdFx0XHRoYW5kbGVOb3REb3dubG9hZGVkKG1haWwpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCBzdGF0ZSA9IGV4aXN0aW5nLnJlc3VsdC5zdGF0ZSgpXG5cblx0XHRcdFx0c3dpdGNoIChzdGF0ZS5zdGF0dXMpIHtcblx0XHRcdFx0XHQvLyBNYWlsIGlzIHN0aWxsIGJlaW5nIHByZXBhcmVkLCBhbHJlYWR5IGhhcyBhIGZpbGUgcGF0aCBhc3NpZ25lZCB0byBpdFxuXHRcdFx0XHRcdGNhc2UgXCJwZW5kaW5nXCI6IHtcblx0XHRcdFx0XHRcdGhhbmRsZURvd25sb2FkZWQoZXhpc3RpbmcuZmlsZU5hbWUsIHN0YXRlLnByb21pc2UpXG5cdFx0XHRcdFx0XHRjb250aW51ZVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNhc2UgXCJjb21wbGV0ZVwiOiB7XG5cdFx0XHRcdFx0XHQvLyBXZSBoYXZlIGRvd25sb2FkZWQgaXQsIGJ1dCB3ZSBuZWVkIHRvIGNoZWNrIGlmIGl0IHN0aWxsIGV4aXN0c1xuXHRcdFx0XHRcdFx0Y29uc3QgZXhpc3RzID0gYXdhaXQgbG9jYXRvci5maWxlQXBwLmNoZWNrRmlsZUV4aXN0c0luRXhwb3J0RGlyKGV4aXN0aW5nLmZpbGVOYW1lKVxuXG5cdFx0XHRcdFx0XHRpZiAoZXhpc3RzKSB7XG5cdFx0XHRcdFx0XHRcdGhhbmRsZURvd25sb2FkZWQoZXhpc3RpbmcuZmlsZU5hbWUsIFByb21pc2UucmVzb2x2ZShtYWlsKSlcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGhhbmRsZU5vdERvd25sb2FkZWQobWFpbClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBkZWR1cGxpY2F0ZWROYW1lcyA9IGRlZHVwbGljYXRlRmlsZW5hbWVzKFxuXHRcdFx0bm90RG93bmxvYWRlZC5tYXAoKGYpID0+IGYuZmlsZU5hbWUpLFxuXHRcdFx0bmV3IFNldChkb3dubG9hZGVkLm1hcCgoZikgPT4gZi5maWxlTmFtZSkpLFxuXHRcdClcblx0XHRjb25zdCBbbmV3RmlsZXMsIGV4aXN0aW5nRmlsZXNdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuXHRcdFx0Ly8gRG93bmxvYWQgYWxsIHRoZSBmaWxlcyB0aGF0IG5lZWQgZG93bmxvYWRpbmcsIHdhaXQgZm9yIHRoZW0sIGFuZCB0aGVuIHJldHVybiB0aGUgZmlsZW5hbWVcblx0XHRcdHByb21pc2VNYXAobm90RG93bmxvYWRlZCwgYXN5bmMgKHsgbWFpbCwgZmlsZU5hbWUgfSkgPT4ge1xuXHRcdFx0XHRjb25zdCBuYW1lID0gYXNzZXJ0Tm90TnVsbChkZWR1cGxpY2F0ZWROYW1lc1tmaWxlTmFtZV0uc2hpZnQoKSlcblx0XHRcdFx0Y29uc3Qga2V5ID0gbWFwS2V5KG1haWwpXG5cdFx0XHRcdGNvbnN0IGRvd25sb2FkUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHsgaHRtbFNhbml0aXplciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vLi4vLi4vY29tbW9uL21pc2MvSHRtbFNhbml0aXplclwiKVxuXHRcdFx0XHRcdGNvbnN0IGJ1bmRsZSA9IGF3YWl0IGRvd25sb2FkTWFpbEJ1bmRsZShcblx0XHRcdFx0XHRcdG1haWwsXG5cdFx0XHRcdFx0XHRsb2NhdG9yLm1haWxGYWNhZGUsXG5cdFx0XHRcdFx0XHRsb2NhdG9yLmVudGl0eUNsaWVudCxcblx0XHRcdFx0XHRcdGxvY2F0b3IuZmlsZUNvbnRyb2xsZXIsXG5cdFx0XHRcdFx0XHRodG1sU2FuaXRpemVyLFxuXHRcdFx0XHRcdFx0bG9jYXRvci5jcnlwdG9GYWNhZGUsXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHRcdHByb2dyZXNzTW9uaXRvci53b3JrRG9uZSgxKVxuXHRcdFx0XHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBnZW5lcmF0ZU1haWxGaWxlKGJ1bmRsZSwgbmFtZSwgZXhwb3J0TW9kZSlcblx0XHRcdFx0XHRwcm9ncmVzc01vbml0b3Iud29ya0RvbmUoMSlcblx0XHRcdFx0XHRhd2FpdCBsb2NhdG9yLmZpbGVBcHAuc2F2ZVRvRXhwb3J0RGlyKGZpbGUpXG5cdFx0XHRcdFx0cHJvZ3Jlc3NNb25pdG9yLndvcmtEb25lKDEpXG5cdFx0XHRcdH0pXG5cdFx0XHRcdHRoaXMuZXhwb3J0ZWRNYWlscy5zZXQoa2V5LCB7XG5cdFx0XHRcdFx0ZmlsZU5hbWU6IG5hbWUsXG5cdFx0XHRcdFx0cmVzdWx0OiBuZXcgQXN5bmNSZXN1bHQoZG93bmxvYWRQcm9taXNlKSxcblx0XHRcdFx0fSlcblx0XHRcdFx0YXdhaXQgZG93bmxvYWRQcm9taXNlXG5cdFx0XHRcdHJldHVybiBuYW1lXG5cdFx0XHR9KSwgLy8gV2FpdCBmb3Igb25lcyB0aGF0IGFscmVhZHkgd2VyZSBkb3dubG9hZGluZyBvciBoYXZlIGZpbmlzaGVkLCBhbmQgIHRoZW4gcmV0dXJuIHRoZWlyIGZpbGVuYW1lcyB0b29cblx0XHRcdHByb21pc2VNYXAoZG93bmxvYWRlZCwgKHJlc3VsdCkgPT4gcmVzdWx0LnByb21pc2UudGhlbigoKSA9PiByZXN1bHQuZmlsZU5hbWUpKSxcblx0XHRdKVxuXHRcdC8vIGNvbWJpbmUgdGhlIGxpc3Qgb2YgbmV3bHkgZG93bmxvYWRlZCBhbmQgcHJldmlvdXNseSBkb3dubG9hZGVkIGZpbGVzXG5cdFx0cmV0dXJuIG5ld0ZpbGVzLmNvbmNhdChleGlzdGluZ0ZpbGVzKVxuXHR9XG5cblx0dmlldyh2bm9kZTogVm5vZGU8TWFpbExpc3RWaWV3QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdHRoaXMuYXR0cnMgPSB2bm9kZS5hdHRyc1xuXG5cdFx0Ly8gU2F2ZSB0aGUgZm9sZGVyIGJlZm9yZSBzaG93aW5nIHRoZSBkaWFsb2cgc28gdGhhdCB0aGVyZSdzIG5vIGNoYW5jZSB0aGF0IGl0IHdpbGwgY2hhbmdlXG5cdFx0Y29uc3QgZm9sZGVyID0gdGhpcy5tYWlsVmlld01vZGVsLmdldEZvbGRlcigpXG5cdFx0Y29uc3QgcHVyZ2VCdXR0b25BdHRyczogQnV0dG9uQXR0cnMgPSB7XG5cdFx0XHRsYWJlbDogXCJjbGVhckZvbGRlcl9hY3Rpb25cIixcblx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdGNvbG9yczogQnV0dG9uQ29sb3IuTmF2LFxuXHRcdFx0Y2xpY2s6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0dm5vZGUuYXR0cnMub25DbGVhckZvbGRlcigpXG5cdFx0XHR9LFxuXHRcdH1cblxuXHRcdC8vIGxpc3RlbmVycyB0byBpbmRpY2F0ZSB0aGUgd2hlbiBtb2Qga2V5IGlzIGhlbGQsIGRyYWdnaW5nIHdpbGwgZG8gc29tZXRoaW5nXG5cdFx0Y29uc3Qgb25LZXlEb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB7XG5cdFx0XHRpZiAoaXNEcmFnQW5kRHJvcE1vZGlmaWVySGVsZChldmVudCkpIHtcblx0XHRcdFx0dGhpcy5fbGlzdERvbT8uY2xhc3NMaXN0LmFkZChcImRyYWctbW9kLWtleVwiKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IG9uS2V5VXAgPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRcdC8vIFRoZSBldmVudCBkb2Vzbid0IGhhdmUgYVxuXHRcdFx0dGhpcy5fbGlzdERvbT8uY2xhc3NMaXN0LnJlbW92ZShcImRyYWctbW9kLWtleVwiKVxuXHRcdH1cblxuXHRcdGNvbnN0IGxpc3RNb2RlbCA9IHZub2RlLmF0dHJzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsIVxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIubWFpbC1saXN0LXdyYXBwZXJcIixcblx0XHRcdHtcblx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuX2xpc3REb20gPSBkb3duY2FzdCh2bm9kZS5kb20uZmlyc3RDaGlsZClcblxuXHRcdFx0XHRcdGlmIChjYW5Eb0RyYWdBbmREcm9wRXhwb3J0KCkpIHtcblx0XHRcdFx0XHRcdGFzc2VydE5vdE51bGwoZG9jdW1lbnQuYm9keSkuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgb25LZXlEb3duKVxuXHRcdFx0XHRcdFx0YXNzZXJ0Tm90TnVsbChkb2N1bWVudC5ib2R5KS5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgb25LZXlVcClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uYmVmb3JlcmVtb3ZlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHRpZiAoY2FuRG9EcmFnQW5kRHJvcEV4cG9ydCgpKSB7XG5cdFx0XHRcdFx0XHRhc3NlcnROb3ROdWxsKGRvY3VtZW50LmJvZHkpLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIG9uS2V5RG93bilcblx0XHRcdFx0XHRcdGFzc2VydE5vdE51bGwoZG9jdW1lbnQuYm9keSkucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIG9uS2V5VXApXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdC8vIGFsd2F5cyByZW5kZXIgdGhlIHdyYXBwZXIgc28gdGhhdCB0aGUgbGlzdCBpcyBub3QgcmUtY3JlYXRlZCBmcm9tIHNjcmF0Y2ggd2hlblxuXHRcdFx0Ly8gc2hvd2luZ1NwYW1PclRyYXNoIGNoYW5nZXMuXG5cdFx0XHRtKFxuXHRcdFx0XHRMaXN0Q29sdW1uV3JhcHBlcixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGhlYWRlckNvbnRlbnQ6IHRoaXMucmVuZGVyTGlzdEhlYWRlcihwdXJnZUJ1dHRvbkF0dHJzKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0bGlzdE1vZGVsLmlzRW1wdHlBbmREb25lKClcblx0XHRcdFx0XHQ/IG0oQ29sdW1uRW1wdHlNZXNzYWdlQm94LCB7XG5cdFx0XHRcdFx0XHRcdGljb246IEJvb3RJY29ucy5NYWlsLFxuXHRcdFx0XHRcdFx0XHRtZXNzYWdlOiBcIm5vTWFpbHNfbXNnXCIsXG5cdFx0XHRcdFx0XHRcdGNvbG9yOiB0aGVtZS5saXN0X21lc3NhZ2VfYmcsXG5cdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdDogbShMaXN0LCB7XG5cdFx0XHRcdFx0XHRcdHN0YXRlOiBsaXN0TW9kZWwuc3RhdGVTdHJlYW0oKSxcblx0XHRcdFx0XHRcdFx0cmVuZGVyQ29uZmlnOiB0aGlzLnJlbmRlckNvbmZpZyxcblx0XHRcdFx0XHRcdFx0b25Mb2FkTW9yZSgpIHtcblx0XHRcdFx0XHRcdFx0XHRsaXN0TW9kZWwubG9hZE1vcmUoKVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRvblJldHJ5TG9hZGluZygpIHtcblx0XHRcdFx0XHRcdFx0XHRsaXN0TW9kZWwucmV0cnlMb2FkaW5nKClcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0b25TaW5nbGVTZWxlY3Rpb246IChpdGVtKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0dm5vZGUuYXR0cnMub25TaW5nbGVTZWxlY3Rpb24oaXRlbSlcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0b25TaW5nbGVUb2dnbGluZ011bHRpc2VsZWN0aW9uOiAoaXRlbTogTWFpbCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdHZub2RlLmF0dHJzLm9uU2luZ2xlSW5jbHVzaXZlU2VsZWN0aW9uKGl0ZW0sIHN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpKVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRvblJhbmdlU2VsZWN0aW9uVG93YXJkczogKGl0ZW06IE1haWwpID0+IHtcblx0XHRcdFx0XHRcdFx0XHR2bm9kZS5hdHRycy5vblJhbmdlU2VsZWN0aW9uVG93YXJkcyhpdGVtKVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRvblN0b3BMb2FkaW5nKCkge1xuXHRcdFx0XHRcdFx0XHRcdGxpc3RNb2RlbC5zdG9wTG9hZGluZygpXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ICB9IHNhdGlzZmllcyBMaXN0QXR0cnM8TWFpbCwgTWFpbFJvdz4pLFxuXHRcdFx0KSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckxpc3RIZWFkZXIocHVyZ2VCdXR0b25BdHRyczogQnV0dG9uQXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXCIuZmxleC5jb2xcIiwgW1xuXHRcdFx0dGhpcy5zaG93aW5nU3BhbU9yVHJhc2hcblx0XHRcdFx0PyBbXG5cdFx0XHRcdFx0XHRtKFwiLmZsZXguZmxleC1jb2x1bW4ucGxyLWxcIiwgW1xuXHRcdFx0XHRcdFx0XHRtKFwiLnNtYWxsLmZsZXgtZ3Jvdy5wdFwiLCBsYW5nLmdldChcInN0b3JhZ2VEZWxldGlvbl9tc2dcIikpLFxuXHRcdFx0XHRcdFx0XHRtKFwiLm1yLW5lZ2F0aXZlLXMuYWxpZ24tc2VsZi1lbmRcIiwgbShCdXR0b24sIHB1cmdlQnV0dG9uQXR0cnMpKSxcblx0XHRcdFx0XHRcdF0pLFxuXHRcdFx0XHQgIF1cblx0XHRcdFx0OiBudWxsLFxuXHRcdF0pXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHRhcmdldEluYm94KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IHNlbGVjdGVkRm9sZGVyID0gdGhpcy5tYWlsVmlld01vZGVsLmdldEZvbGRlcigpXG5cdFx0aWYgKHNlbGVjdGVkRm9sZGVyKSB7XG5cdFx0XHRjb25zdCBtYWlsRGV0YWlscyA9IGF3YWl0IHRoaXMubWFpbFZpZXdNb2RlbC5nZXRNYWlsYm94RGV0YWlscygpXG5cdFx0XHRpZiAobWFpbERldGFpbHMubWFpbGJveC5mb2xkZXJzKSB7XG5cdFx0XHRcdGNvbnN0IGZvbGRlcnMgPSBhd2FpdCBtYWlsTG9jYXRvci5tYWlsTW9kZWwuZ2V0TWFpbGJveEZvbGRlcnNGb3JJZChtYWlsRGV0YWlscy5tYWlsYm94LmZvbGRlcnMuX2lkKVxuXHRcdFx0XHRyZXR1cm4gaXNPZlR5cGVPclN1YmZvbGRlck9mKGZvbGRlcnMsIHNlbGVjdGVkRm9sZGVyLCBNYWlsU2V0S2luZC5BUkNISVZFKSB8fCBzZWxlY3RlZEZvbGRlci5mb2xkZXJUeXBlID09PSBNYWlsU2V0S2luZC5UUkFTSFxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2Vcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgb25Td2lwZUxlZnQobGlzdEVsZW1lbnQ6IE1haWwpOiBQcm9taXNlPExpc3RTd2lwZURlY2lzaW9uPiB7XG5cdFx0Y29uc3Qgd2VyZURlbGV0ZWQgPSBhd2FpdCBwcm9tcHRBbmREZWxldGVNYWlscyhtYWlsTG9jYXRvci5tYWlsTW9kZWwsIFtsaXN0RWxlbWVudF0sICgpID0+IHRoaXMubWFpbFZpZXdNb2RlbC5saXN0TW9kZWw/LnNlbGVjdE5vbmUoKSlcblx0XHRyZXR1cm4gd2VyZURlbGV0ZWQgPyBMaXN0U3dpcGVEZWNpc2lvbi5Db21taXQgOiBMaXN0U3dpcGVEZWNpc2lvbi5DYW5jZWxcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgb25Td2lwZVJpZ2h0KGxpc3RFbGVtZW50OiBNYWlsKTogUHJvbWlzZTxMaXN0U3dpcGVEZWNpc2lvbj4ge1xuXHRcdGlmICh0aGlzLnNob3dpbmdEcmFmdCkge1xuXHRcdFx0Ly8ganVzdCBjYW5jZWwgc2VsZWN0aW9uIGlmIGluIGRyYWZ0c1xuXHRcdFx0dGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbD8uc2VsZWN0Tm9uZSgpXG5cdFx0XHRyZXR1cm4gTGlzdFN3aXBlRGVjaXNpb24uQ2FuY2VsXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IGZvbGRlcnMgPSBhd2FpdCBtYWlsTG9jYXRvci5tYWlsTW9kZWwuZ2V0TWFpbGJveEZvbGRlcnNGb3JNYWlsKGxpc3RFbGVtZW50KVxuXHRcdFx0aWYgKGZvbGRlcnMpIHtcblx0XHRcdFx0Ly9DaGVjayBpZiB0aGUgdXNlciBpcyBpbiB0aGUgdHJhc2gvc3BhbSBmb2xkZXIgb3IgaWYgaXQncyBpbiBJbmJveCBvciBBcmNoaXZlXG5cdFx0XHRcdC8vdG8gZGV0ZXJtaW5hdGUgdGhlIHRhcmdldCBmb2xkZXJcblx0XHRcdFx0Y29uc3QgdGFyZ2V0TWFpbEZvbGRlciA9IHRoaXMuc2hvd2luZ1NwYW1PclRyYXNoXG5cdFx0XHRcdFx0PyB0aGlzLmdldFJlY292ZXJGb2xkZXIobGlzdEVsZW1lbnQsIGZvbGRlcnMpXG5cdFx0XHRcdFx0OiBhc3NlcnROb3ROdWxsKGZvbGRlcnMuZ2V0U3lzdGVtRm9sZGVyQnlUeXBlKHRoaXMuc2hvd2luZ0FyY2hpdmUgPyBNYWlsU2V0S2luZC5JTkJPWCA6IE1haWxTZXRLaW5kLkFSQ0hJVkUpKVxuXHRcdFx0XHRjb25zdCB3ZXJlTW92ZWQgPSBhd2FpdCBtb3ZlTWFpbHMoe1xuXHRcdFx0XHRcdG1haWxib3hNb2RlbDogbG9jYXRvci5tYWlsYm94TW9kZWwsXG5cdFx0XHRcdFx0bWFpbE1vZGVsOiBtYWlsTG9jYXRvci5tYWlsTW9kZWwsXG5cdFx0XHRcdFx0bWFpbHM6IFtsaXN0RWxlbWVudF0sXG5cdFx0XHRcdFx0dGFyZ2V0TWFpbEZvbGRlcixcblx0XHRcdFx0fSlcblx0XHRcdFx0cmV0dXJuIHdlcmVNb3ZlZCA/IExpc3RTd2lwZURlY2lzaW9uLkNvbW1pdCA6IExpc3RTd2lwZURlY2lzaW9uLkNhbmNlbFxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIExpc3RTd2lwZURlY2lzaW9uLkNhbmNlbFxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTGVmdFNwYWNlcigpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIHRoaXMuc2hvd2luZ0RyYWZ0XG5cdFx0XHQ/IFtcblx0XHRcdFx0XHRtKEljb24sIHtcblx0XHRcdFx0XHRcdGljb246IEljb25zLkNhbmNlbCxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRtKFwiLnBsLXNcIiwgbGFuZy5nZXQoXCJjYW5jZWxfYWN0aW9uXCIpKSwgLy8gaWYgdGhpcyBpcyB0aGUgZHJhZnRzIGZvbGRlciwgd2UgY2FuIG9ubHkgY2FuY2VsIHRoZSBzZWxlY3Rpb24gYXMgd2UgaGF2ZSBub3doZXJlIGVsc2UgdG8gcHV0IHRoZSBtYWlsXG5cdFx0XHQgIF1cblx0XHRcdDogW1xuXHRcdFx0XHRcdG0oSWNvbiwge1xuXHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuRm9sZGVyLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcIi5wbC1zXCIsXG5cdFx0XHRcdFx0XHR0aGlzLnNob3dpbmdTcGFtT3JUcmFzaFxuXHRcdFx0XHRcdFx0XHQ/IGxhbmcuZ2V0KFwicmVjb3Zlcl9sYWJlbFwiKSAvLyBzaG93IFwicmVjb3ZlclwiIGlmIHRoaXMgaXMgdGhlIHRyYXNoL3NwYW0gZm9sZGVyXG5cdFx0XHRcdFx0XHRcdDogdGhpcy5zaG93aW5nQXJjaGl2ZSAvLyBvdGhlcndpc2Ugc2hvdyBcImluYm94XCIgb3IgXCJhcmNoaXZlXCIgZGVwZW5kaW5nIG9uIHRoZSBmb2xkZXJcblx0XHRcdFx0XHRcdFx0PyBsYW5nLmdldChcInJlY2VpdmVkX2FjdGlvblwiKVxuXHRcdFx0XHRcdFx0XHQ6IGxhbmcuZ2V0KFwiYXJjaGl2ZV9sYWJlbFwiKSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0ICBdXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclJpZ2h0U3BhY2VyKCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShJY29uLCB7XG5cdFx0XHRcdGljb246IEljb25zLlRyYXNoLFxuXHRcdFx0fSksXG5cdFx0XHRtKFwiLnBsLXNcIiwgbGFuZy5nZXQoXCJkZWxldGVfYWN0aW9uXCIpKSxcblx0XHRdXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRXhwb3J0RHJhZ0V2ZW50KGV2ZW50OiBEcmFnRXZlbnQpOiBib29sZWFuIHtcblx0cmV0dXJuIGNhbkRvRHJhZ0FuZERyb3BFeHBvcnQoKSAmJiBpc0RyYWdBbmREcm9wTW9kaWZpZXJIZWxkKGV2ZW50KVxufVxuXG5mdW5jdGlvbiBpc0RyYWdBbmREcm9wTW9kaWZpZXJIZWxkKGV2ZW50OiBEcmFnRXZlbnQgfCBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiB7XG5cdHJldHVybiAoXG5cdFx0ZXZlbnQuY3RybEtleSB8fFxuXHRcdGV2ZW50LmFsdEtleSB8fFxuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHQoZXZlbnQua2V5ICE9IG51bGwgJiYgaXNLZXlQcmVzc2VkKGV2ZW50LmtleSwgS2V5cy5DVFJMLCBLZXlzLkFMVCkpXG5cdClcbn1cbiIsImltcG9ydCB7IE1haWwsIE1haWxGb2xkZXIsIE1haWxTZXRFbnRyeVR5cGVSZWYsIE1haWxUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgRHJvcERvd25TZWxlY3RvciwgU2VsZWN0b3JJdGVtTGlzdCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRHJvcERvd25TZWxlY3Rvci5qc1wiXG5pbXBvcnQgbSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBUZXh0RmllbGQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZy5qc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCJcbmltcG9ydCB7IExvY2tlZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvci5qc1wiXG5pbXBvcnQgeyBsYW5nLCBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBNYWlsYm94RGV0YWlsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9NYWlsYm94TW9kZWwuanNcIlxuaW1wb3J0IHsgTWFpbFJlcG9ydFR5cGUsIE1haWxTZXRLaW5kIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IGVsZW1lbnRJZFBhcnQsIGlzU2FtZUlkLCBsaXN0SWRQYXJ0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzLmpzXCJcbmltcG9ydCB7IHJlcG9ydE1haWxzQXV0b21hdGljYWxseSB9IGZyb20gXCIuL01haWxSZXBvcnREaWFsb2cuanNcIlxuaW1wb3J0IHsgaXNPZmZsaW5lRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRXJyb3JVdGlscy5qc1wiXG5pbXBvcnQgeyBncm91cEJ5QW5kTWFwIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBtYWlsTG9jYXRvciB9IGZyb20gXCIuLi8uLi9tYWlsTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgdHlwZSB7IEZvbGRlclN5c3RlbSwgSW5kZW50ZWRGb2xkZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vbWFpbC9Gb2xkZXJTeXN0ZW0uanNcIlxuaW1wb3J0IHsgZ2V0Rm9sZGVyTmFtZSwgZ2V0SW5kZW50ZWRGb2xkZXJOYW1lRm9yRHJvcGRvd24sIGdldFBhdGhUb0ZvbGRlclN0cmluZyB9IGZyb20gXCIuLi9tb2RlbC9NYWlsVXRpbHMuanNcIlxuaW1wb3J0IHsgaXNTcGFtT3JUcmFzaEZvbGRlciB9IGZyb20gXCIuLi9tb2RlbC9NYWlsQ2hlY2tzLmpzXCJcblxuLyoqXG4gKiBEaWFsb2cgZm9yIEVkaXQgYW5kIEFkZCBmb2xkZXIgYXJlIHRoZSBzYW1lLlxuICogQHBhcmFtIGVkaXRlZEZvbGRlciBpZiB0aGlzIGlzIG51bGwsIGEgZm9sZGVyIGlzIGJlaW5nIGFkZGVkLCBvdGhlcndpc2UgYSBmb2xkZXIgaXMgYmVpbmcgZWRpdGVkXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzaG93RWRpdEZvbGRlckRpYWxvZyhtYWlsQm94RGV0YWlsOiBNYWlsYm94RGV0YWlsLCBlZGl0ZWRGb2xkZXI6IE1haWxGb2xkZXIgfCBudWxsID0gbnVsbCwgcGFyZW50Rm9sZGVyOiBNYWlsRm9sZGVyIHwgbnVsbCA9IG51bGwpIHtcblx0Y29uc3Qgbm9QYXJlbnRGb2xkZXJPcHRpb24gPSBsYW5nLmdldChcImNvbWJvQm94U2VsZWN0aW9uTm9uZV9tc2dcIilcblx0Y29uc3QgbWFpbEdyb3VwSWQgPSBtYWlsQm94RGV0YWlsLm1haWxHcm91cC5faWRcblx0Y29uc3QgZm9sZGVycyA9IGF3YWl0IG1haWxMb2NhdG9yLm1haWxNb2RlbC5nZXRNYWlsYm94Rm9sZGVyc0ZvcklkKGFzc2VydE5vdE51bGwobWFpbEJveERldGFpbC5tYWlsYm94LmZvbGRlcnMpLl9pZClcblx0bGV0IGZvbGRlck5hbWVWYWx1ZSA9IGVkaXRlZEZvbGRlcj8ubmFtZSA/PyBcIlwiXG5cdGxldCB0YXJnZXRGb2xkZXJzOiBTZWxlY3Rvckl0ZW1MaXN0PE1haWxGb2xkZXIgfCBudWxsPiA9IGZvbGRlcnNcblx0XHQuZ2V0SW5kZW50ZWRMaXN0KGVkaXRlZEZvbGRlcilcblx0XHQvLyBmaWx0ZXI6IFNQQU0gYW5kIFRSQVNIIGFuZCBkZXNjZW5kYW50cyBhcmUgb25seSBzaG93biBpZiBlZGl0aW5nIChmb2xkZXJzIGNhbiBvbmx5IGJlIG1vdmVkIHRoZXJlLCBub3QgY3JlYXRlZCB0aGVyZSlcblx0XHQuZmlsdGVyKChmb2xkZXJJbmZvOiBJbmRlbnRlZEZvbGRlcikgPT4gIShlZGl0ZWRGb2xkZXIgPT09IG51bGwgJiYgaXNTcGFtT3JUcmFzaEZvbGRlcihmb2xkZXJzLCBmb2xkZXJJbmZvLmZvbGRlcikpKVxuXHRcdC5tYXAoKGZvbGRlckluZm86IEluZGVudGVkRm9sZGVyKSA9PiB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRuYW1lOiBnZXRJbmRlbnRlZEZvbGRlck5hbWVGb3JEcm9wZG93bihmb2xkZXJJbmZvKSxcblx0XHRcdFx0dmFsdWU6IGZvbGRlckluZm8uZm9sZGVyLFxuXHRcdFx0fVxuXHRcdH0pXG5cdHRhcmdldEZvbGRlcnMgPSBbeyBuYW1lOiBub1BhcmVudEZvbGRlck9wdGlvbiwgdmFsdWU6IG51bGwgfSwgLi4udGFyZ2V0Rm9sZGVyc11cblx0bGV0IHNlbGVjdGVkUGFyZW50Rm9sZGVyID0gcGFyZW50Rm9sZGVyXG5cdGxldCBmb3JtID0gKCkgPT4gW1xuXHRcdG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRsYWJlbDogZWRpdGVkRm9sZGVyID8gXCJyZW5hbWVfYWN0aW9uXCIgOiBcImZvbGRlck5hbWVfbGFiZWxcIixcblx0XHRcdHZhbHVlOiBmb2xkZXJOYW1lVmFsdWUsXG5cdFx0XHRvbmlucHV0OiAobmV3SW5wdXQpID0+IHtcblx0XHRcdFx0Zm9sZGVyTmFtZVZhbHVlID0gbmV3SW5wdXRcblx0XHRcdH0sXG5cdFx0fSksXG5cdFx0bShEcm9wRG93blNlbGVjdG9yLCB7XG5cdFx0XHRsYWJlbDogXCJwYXJlbnRGb2xkZXJfbGFiZWxcIixcblx0XHRcdGl0ZW1zOiB0YXJnZXRGb2xkZXJzLFxuXHRcdFx0c2VsZWN0ZWRWYWx1ZTogc2VsZWN0ZWRQYXJlbnRGb2xkZXIsXG5cdFx0XHRzZWxlY3RlZFZhbHVlRGlzcGxheTogc2VsZWN0ZWRQYXJlbnRGb2xkZXIgPyBnZXRGb2xkZXJOYW1lKHNlbGVjdGVkUGFyZW50Rm9sZGVyKSA6IG5vUGFyZW50Rm9sZGVyT3B0aW9uLFxuXHRcdFx0c2VsZWN0aW9uQ2hhbmdlZEhhbmRsZXI6IChuZXdGb2xkZXI6IE1haWxGb2xkZXIgfCBudWxsKSA9PiAoc2VsZWN0ZWRQYXJlbnRGb2xkZXIgPSBuZXdGb2xkZXIpLFxuXHRcdFx0aGVscExhYmVsOiAoKSA9PiAoc2VsZWN0ZWRQYXJlbnRGb2xkZXIgPyBnZXRQYXRoVG9Gb2xkZXJTdHJpbmcoZm9sZGVycywgc2VsZWN0ZWRQYXJlbnRGb2xkZXIpIDogXCJcIiksXG5cdFx0fSksXG5cdF1cblxuXHRhc3luYyBmdW5jdGlvbiBnZXRNYWlsSWRzR3JvdXBlZEJ5TGlzdElkKGZvbGRlcjogTWFpbEZvbGRlcik6IFByb21pc2U8TWFwPElkLCBJZFtdPj4ge1xuXHRcdGNvbnN0IG1haWxTZXRFbnRyaWVzID0gYXdhaXQgbG9jYXRvci5lbnRpdHlDbGllbnQubG9hZEFsbChNYWlsU2V0RW50cnlUeXBlUmVmLCBmb2xkZXIuZW50cmllcylcblx0XHRyZXR1cm4gZ3JvdXBCeUFuZE1hcChcblx0XHRcdG1haWxTZXRFbnRyaWVzLFxuXHRcdFx0KG1zZSkgPT4gbGlzdElkUGFydChtc2UubWFpbCksXG5cdFx0XHQobXNlKSA9PiBlbGVtZW50SWRQYXJ0KG1zZS5tYWlsKSxcblx0XHQpXG5cdH1cblxuXHRhc3luYyBmdW5jdGlvbiBsb2FkQWxsTWFpbHNPZkZvbGRlcihmb2xkZXI6IE1haWxGb2xkZXIsIHJlcG9ydGFibGVNYWlsczogQXJyYXk8TWFpbD4pIHtcblx0XHRpZiAoZm9sZGVyLmlzTWFpbFNldCkge1xuXHRcdFx0Y29uc3QgbWFpbElkc1BlckJhZyA9IGF3YWl0IGdldE1haWxJZHNHcm91cGVkQnlMaXN0SWQoZm9sZGVyKVxuXHRcdFx0Zm9yIChjb25zdCBbbWFpbExpc3RJZCwgbWFpbElkc10gb2YgbWFpbElkc1BlckJhZykge1xuXHRcdFx0XHRyZXBvcnRhYmxlTWFpbHMucHVzaCguLi4oYXdhaXQgbG9jYXRvci5lbnRpdHlDbGllbnQubG9hZE11bHRpcGxlKE1haWxUeXBlUmVmLCBtYWlsTGlzdElkLCBtYWlsSWRzKSkpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlcG9ydGFibGVNYWlscy5wdXNoKC4uLihhd2FpdCBsb2NhdG9yLmVudGl0eUNsaWVudC5sb2FkQWxsKE1haWxUeXBlUmVmLCBmb2xkZXIubWFpbHMpKSlcblx0XHR9XG5cdH1cblxuXHRjb25zdCBva0FjdGlvbiA9IGFzeW5jIChkaWFsb2c6IERpYWxvZykgPT4ge1xuXHRcdC8vIGNsb3NpbmcgcmlnaHQgYXdheSB0byBwcmV2ZW50IGR1cGxpY2F0ZSBhY3Rpb25zXG5cdFx0ZGlhbG9nLmNsb3NlKClcblx0XHR0cnkge1xuXHRcdFx0Ly8gaWYgZm9sZGVyIGlzIG51bGwsIGNyZWF0ZSBuZXcgZm9sZGVyXG5cdFx0XHRpZiAoZWRpdGVkRm9sZGVyID09PSBudWxsKSB7XG5cdFx0XHRcdGF3YWl0IGxvY2F0b3IubWFpbEZhY2FkZS5jcmVhdGVNYWlsRm9sZGVyKGZvbGRlck5hbWVWYWx1ZSwgc2VsZWN0ZWRQYXJlbnRGb2xkZXI/Ll9pZCA/PyBudWxsLCBtYWlsR3JvdXBJZClcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIGlmIGl0IGlzIGJlaW5nIG1vdmVkIHRvIHRyYXNoIChhbmQgbm90IGFscmVhZHkgaW4gdHJhc2gpLCBhc2sgYWJvdXQgdHJhc2hpbmdcblx0XHRcdFx0aWYgKHNlbGVjdGVkUGFyZW50Rm9sZGVyPy5mb2xkZXJUeXBlID09PSBNYWlsU2V0S2luZC5UUkFTSCAmJiAhaXNTYW1lSWQoc2VsZWN0ZWRQYXJlbnRGb2xkZXIuX2lkLCBlZGl0ZWRGb2xkZXIucGFyZW50Rm9sZGVyKSkge1xuXHRcdFx0XHRcdGNvbnN0IGNvbmZpcm1lZCA9IGF3YWl0IERpYWxvZy5jb25maXJtKFxuXHRcdFx0XHRcdFx0bGFuZy5tYWtlVHJhbnNsYXRpb24oXG5cdFx0XHRcdFx0XHRcdFwiY29uZmlybVwiLFxuXHRcdFx0XHRcdFx0XHRsYW5nLmdldChcImNvbmZpcm1EZWxldGVDdXN0b21Gb2xkZXJfbXNnXCIsIHtcblx0XHRcdFx0XHRcdFx0XHRcInsxfVwiOiBnZXRGb2xkZXJOYW1lKGVkaXRlZEZvbGRlciksXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0aWYgKCFjb25maXJtZWQpIHJldHVyblxuXG5cdFx0XHRcdFx0YXdhaXQgbG9jYXRvci5tYWlsRmFjYWRlLnVwZGF0ZU1haWxGb2xkZXJOYW1lKGVkaXRlZEZvbGRlciwgZm9sZGVyTmFtZVZhbHVlKVxuXHRcdFx0XHRcdGF3YWl0IG1haWxMb2NhdG9yLm1haWxNb2RlbC50cmFzaEZvbGRlckFuZFN1YmZvbGRlcnMoZWRpdGVkRm9sZGVyKVxuXHRcdFx0XHR9IGVsc2UgaWYgKHNlbGVjdGVkUGFyZW50Rm9sZGVyPy5mb2xkZXJUeXBlID09PSBNYWlsU2V0S2luZC5TUEFNICYmICFpc1NhbWVJZChzZWxlY3RlZFBhcmVudEZvbGRlci5faWQsIGVkaXRlZEZvbGRlci5wYXJlbnRGb2xkZXIpKSB7XG5cdFx0XHRcdFx0Ly8gaWYgaXQgaXMgYmVpbmcgbW92ZWQgdG8gc3BhbSAoYW5kIG5vdCBhbHJlYWR5IGluIHNwYW0pLCBhc2sgYWJvdXQgcmVwb3J0aW5nIGNvbnRhaW5pbmcgZW1haWxzXG5cdFx0XHRcdFx0Y29uc3QgY29uZmlybWVkID0gYXdhaXQgRGlhbG9nLmNvbmZpcm0oXG5cdFx0XHRcdFx0XHRsYW5nLm1ha2VUcmFuc2xhdGlvbihcblx0XHRcdFx0XHRcdFx0XCJjb25maXJtXCIsXG5cdFx0XHRcdFx0XHRcdGxhbmcuZ2V0KFwiY29uZmlybVNwYW1DdXN0b21Gb2xkZXJfbXNnXCIsIHtcblx0XHRcdFx0XHRcdFx0XHRcInsxfVwiOiBnZXRGb2xkZXJOYW1lKGVkaXRlZEZvbGRlciksXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0aWYgKCFjb25maXJtZWQpIHJldHVyblxuXG5cdFx0XHRcdFx0Ly8gZ2V0IG1haWxzIHRvIHJlcG9ydCBiZWZvcmUgbW92aW5nIHRvIG1haWwgbW9kZWxcblx0XHRcdFx0XHRjb25zdCBkZXNjZW5kYW50cyA9IGZvbGRlcnMuZ2V0RGVzY2VuZGFudEZvbGRlcnNPZlBhcmVudChlZGl0ZWRGb2xkZXIuX2lkKS5zb3J0KChsOiBJbmRlbnRlZEZvbGRlciwgcjogSW5kZW50ZWRGb2xkZXIpID0+IHIubGV2ZWwgLSBsLmxldmVsKVxuXHRcdFx0XHRcdGxldCByZXBvcnRhYmxlTWFpbHM6IEFycmF5PE1haWw+ID0gW11cblx0XHRcdFx0XHRhd2FpdCBsb2FkQWxsTWFpbHNPZkZvbGRlcihlZGl0ZWRGb2xkZXIsIHJlcG9ydGFibGVNYWlscylcblx0XHRcdFx0XHRmb3IgKGNvbnN0IGRlc2NlbmRhbnQgb2YgZGVzY2VuZGFudHMpIHtcblx0XHRcdFx0XHRcdGF3YWl0IGxvYWRBbGxNYWlsc09mRm9sZGVyKGRlc2NlbmRhbnQuZm9sZGVyLCByZXBvcnRhYmxlTWFpbHMpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGF3YWl0IHJlcG9ydE1haWxzQXV0b21hdGljYWxseShNYWlsUmVwb3J0VHlwZS5TUEFNLCBsb2NhdG9yLm1haWxib3hNb2RlbCwgbWFpbExvY2F0b3IubWFpbE1vZGVsLCBtYWlsQm94RGV0YWlsLCByZXBvcnRhYmxlTWFpbHMpXG5cblx0XHRcdFx0XHRhd2FpdCBsb2NhdG9yLm1haWxGYWNhZGUudXBkYXRlTWFpbEZvbGRlck5hbWUoZWRpdGVkRm9sZGVyLCBmb2xkZXJOYW1lVmFsdWUpXG5cdFx0XHRcdFx0YXdhaXQgbWFpbExvY2F0b3IubWFpbE1vZGVsLnNlbmRGb2xkZXJUb1NwYW0oZWRpdGVkRm9sZGVyKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGF3YWl0IGxvY2F0b3IubWFpbEZhY2FkZS51cGRhdGVNYWlsRm9sZGVyTmFtZShlZGl0ZWRGb2xkZXIsIGZvbGRlck5hbWVWYWx1ZSlcblx0XHRcdFx0XHRhd2FpdCBsb2NhdG9yLm1haWxGYWNhZGUudXBkYXRlTWFpbEZvbGRlclBhcmVudChlZGl0ZWRGb2xkZXIsIHNlbGVjdGVkUGFyZW50Rm9sZGVyPy5faWQgfHwgbnVsbClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRpZiAoaXNPZmZsaW5lRXJyb3IoZXJyb3IpIHx8ICEoZXJyb3IgaW5zdGFuY2VvZiBMb2NrZWRFcnJvcikpIHtcblx0XHRcdFx0dGhyb3cgZXJyb3Jcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHREaWFsb2cuc2hvd0FjdGlvbkRpYWxvZyh7XG5cdFx0dGl0bGU6IGVkaXRlZEZvbGRlciA/IFwiZWRpdEZvbGRlcl9hY3Rpb25cIiA6IFwiYWRkRm9sZGVyX2FjdGlvblwiLFxuXHRcdGNoaWxkOiBmb3JtLFxuXHRcdHZhbGlkYXRvcjogKCkgPT4gY2hlY2tGb2xkZXJOYW1lKG1haWxCb3hEZXRhaWwsIGZvbGRlcnMsIGZvbGRlck5hbWVWYWx1ZSwgbWFpbEdyb3VwSWQsIHNlbGVjdGVkUGFyZW50Rm9sZGVyPy5faWQgPz8gbnVsbCksXG5cdFx0YWxsb3dPa1dpdGhSZXR1cm46IHRydWUsXG5cdFx0b2tBY3Rpb246IG9rQWN0aW9uLFxuXHR9KVxufVxuXG5mdW5jdGlvbiBjaGVja0ZvbGRlck5hbWUoXG5cdG1haWxib3hEZXRhaWw6IE1haWxib3hEZXRhaWwsXG5cdGZvbGRlcnM6IEZvbGRlclN5c3RlbSxcblx0bmFtZTogc3RyaW5nLFxuXHRtYWlsR3JvdXBJZDogSWQsXG5cdHBhcmVudEZvbGRlcklkOiBJZFR1cGxlIHwgbnVsbCxcbik6IFRyYW5zbGF0aW9uS2V5IHwgbnVsbCB7XG5cdGlmIChuYW1lLnRyaW0oKSA9PT0gXCJcIikge1xuXHRcdHJldHVybiBcImZvbGRlck5hbWVOZXV0cmFsX21zZ1wiXG5cdH0gZWxzZSBpZiAoZm9sZGVycy5nZXRDdXN0b21Gb2xkZXJzT2ZQYXJlbnQocGFyZW50Rm9sZGVySWQpLnNvbWUoKGYpID0+IGYubmFtZSA9PT0gbmFtZSkpIHtcblx0XHRyZXR1cm4gXCJmb2xkZXJOYW1lSW52YWxpZEV4aXN0aW5nX21zZ1wiXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIG51bGxcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgdHlwZSB7IE5hdkJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9OYXZCdXR0b24uanNcIlxuaW1wb3J0IHsgaXNOYXZCdXR0b25TZWxlY3RlZCwgTmF2QnV0dG9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9OYXZCdXR0b24uanNcIlxuaW1wb3J0IHsgQ291bnRlckJhZGdlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Db3VudGVyQmFkZ2VcIlxuaW1wb3J0IHsgZ2V0TmF2QnV0dG9uSWNvbkJhY2tncm91bmQsIHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWVcIlxuaW1wb3J0IHsgcHgsIHNpemUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplXCJcbmltcG9ydCB7IEljb25CdXR0b24sIEljb25CdXR0b25BdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBJY29uLCBJY29uU2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbi5qc1wiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnMuanNcIlxuaW1wb3J0IHsgc3RhdGVCZ0hvdmVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYnVpbHRpblRoZW1lcy5qc1wiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50RGV0ZWN0b3IuanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBNYWlsRm9sZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnNcIlxuaW1wb3J0IHsgZ2V0Rm9sZGVySWNvbiB9IGZyb20gXCIuL01haWxHdWlVdGlsc1wiXG5pbXBvcnQgeyBnZXRGb2xkZXJOYW1lIH0gZnJvbSBcIi4uL21vZGVsL01haWxVdGlsc1wiXG5cbmV4cG9ydCB0eXBlIE1haWxGb2xkZXJSb3dBdHRycyA9IHtcblx0Y291bnQ6IG51bWJlclxuXHRidXR0b246IE5hdkJ1dHRvbkF0dHJzXG5cdHJpZ2h0QnV0dG9uPzogSWNvbkJ1dHRvbkF0dHJzIHwgbnVsbFxuXHRleHBhbmRlZDogYm9vbGVhbiB8IG51bGxcblx0aW5kZW50YXRpb25MZXZlbDogbnVtYmVyXG5cdG9uRXhwYW5kZXJDbGljazogKCkgPT4gdW5rbm93blxuXHRmb2xkZXI6IE1haWxGb2xkZXJcblx0aGFzQ2hpbGRyZW46IGJvb2xlYW5cblx0b25TZWxlY3RlZFBhdGg6IGJvb2xlYW5cblx0bnVtYmVyT2ZQcmV2aW91c1Jvd3M6IG51bWJlclxuXHRpc0xhc3RTaWJsaW5nOiBib29sZWFuXG5cdGVkaXRNb2RlOiBib29sZWFuXG5cdG9uSG92ZXI6ICgpID0+IHZvaWRcbn1cblxuZXhwb3J0IGNsYXNzIE1haWxGb2xkZXJSb3cgaW1wbGVtZW50cyBDb21wb25lbnQ8TWFpbEZvbGRlclJvd0F0dHJzPiB7XG5cdHByaXZhdGUgaG92ZXJlZDogYm9vbGVhbiA9IGZhbHNlXG5cblx0b251cGRhdGUodm5vZGU6IFZub2RlPE1haWxGb2xkZXJSb3dBdHRycz4pOiBhbnkge1xuXHRcdGlmIChpc05hdkJ1dHRvblNlbGVjdGVkKHZub2RlLmF0dHJzLmJ1dHRvbikpIHtcblx0XHRcdHRoaXMuaG92ZXJlZCA9IHRydWVcblx0XHR9XG5cdH1cblxuXHR2aWV3KHZub2RlOiBWbm9kZTxNYWlsRm9sZGVyUm93QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgY291bnQsIGJ1dHRvbiwgcmlnaHRCdXR0b24sIGV4cGFuZGVkLCBpbmRlbnRhdGlvbkxldmVsLCBmb2xkZXIsIGhhc0NoaWxkcmVuLCBlZGl0TW9kZSB9ID0gdm5vZGUuYXR0cnNcblx0XHRjb25zdCBpY29uID0gZ2V0Rm9sZGVySWNvbihmb2xkZXIpXG5cdFx0Y29uc3Qgb25Ib3ZlciA9ICgpID0+IHtcblx0XHRcdHZub2RlLmF0dHJzLm9uSG92ZXIoKVxuXHRcdFx0dGhpcy5ob3ZlcmVkID0gdHJ1ZVxuXHRcdH1cblxuXHRcdC8vIGJlY2F1c2Ugb25ibHVyIGlzIGZpcmVkIHVwb24gY2hhbmdpbmcgZm9sZGVyIGR1ZSB0byB0aGUgcm91dGUgY2hhbmdlXG5cdFx0Ly8gdGhlc2UgZnVuY3Rpb25zIGNhbiBiZSB1c2VkIHRvIGhhbmRsZSBrZXlib2FyZCBuYXZpZ2F0aW9uXG5cdFx0Y29uc3QgaGFuZGxlRm9yd2FyZHNUYWIgPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRcdGlmIChldmVudC5rZXkgPT09IFwiVGFiXCIgJiYgIWV2ZW50LnNoaWZ0S2V5KSB7XG5cdFx0XHRcdHRoaXMuaG92ZXJlZCA9IGZhbHNlXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGNvbnN0IGhhbmRsZUJhY2t3YXJkc1RhYiA9IChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuXHRcdFx0aWYgKGV2ZW50LmtleSA9PT0gXCJUYWJcIiAmJiBldmVudC5zaGlmdEtleSkgdGhpcy5ob3ZlcmVkID0gZmFsc2Vcblx0XHR9XG5cblx0XHRjb25zdCBpbmRlbnRhdGlvbk1hcmdpbiA9IGluZGVudGF0aW9uTGV2ZWwgKiBzaXplLmhwYWRcblx0XHRjb25zdCBwYWRkaW5nTmVlZGVkID0gc2l6ZS5ocGFkX2J1dHRvblxuXHRcdGNvbnN0IGJ1dHRvbldpZHRoID0gc2l6ZS5pY29uX3NpemVfbGFyZ2UgKyBwYWRkaW5nTmVlZGVkICogMlxuXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5mb2xkZXItcm93LmZsZXguZmxleC1yb3cubWxyLWJ1dHRvbi5ib3JkZXItcmFkaXVzLXNtYWxsLnN0YXRlLWJnXCIsXG5cdFx0XHR7XG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0YmFja2dyb3VuZDogaXNOYXZCdXR0b25TZWxlY3RlZChidXR0b24pID8gc3RhdGVCZ0hvdmVyIDogXCJcIixcblx0XHRcdFx0fSxcblx0XHRcdFx0dGl0bGU6IGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KGJ1dHRvbi5sYWJlbCksXG5cdFx0XHRcdG9ubW91c2VlbnRlcjogb25Ib3Zlcixcblx0XHRcdFx0b25tb3VzZWxlYXZlOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5ob3ZlcmVkID0gZmFsc2Vcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRbXG5cdFx0XHRcdGhhc0NoaWxkcmVuICYmICFleHBhbmRlZFxuXHRcdFx0XHRcdD8gbShJY29uLCB7XG5cdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdFx0XHRcdFx0XHRib3R0b206IHB4KDkpLFxuXHRcdFx0XHRcdFx0XHRcdGxlZnQ6IHB4KDUgKyBpbmRlbnRhdGlvbk1hcmdpbiArIGJ1dHRvbldpZHRoIC8gMiksXG5cdFx0XHRcdFx0XHRcdFx0ZmlsbDogaXNOYXZCdXR0b25TZWxlY3RlZChidXR0b24pID8gdGhlbWUubmF2aWdhdGlvbl9idXR0b25fc2VsZWN0ZWQgOiB0aGVtZS5uYXZpZ2F0aW9uX2J1dHRvbixcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuQWRkLFxuXHRcdFx0XHRcdFx0XHRjbGFzczogXCJpY29uLXNtYWxsXCIsXG5cdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0bShcIlwiLCB7XG5cdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdG1hcmdpbkxlZnQ6IHB4KGluZGVudGF0aW9uTWFyZ2luKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0dGhpcy5yZW5kZXJIaWVyYXJjaHlMaW5lKHZub2RlLmF0dHJzLCBpbmRlbnRhdGlvbk1hcmdpbiksXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCJidXR0b24uZmxleC5pdGVtcy1jZW50ZXIuanVzdGlmeS1lbmRcIiArIChlZGl0TW9kZSB8fCAhaGFzQ2hpbGRyZW4gPyBcIi5uby1ob3ZlclwiIDogXCJcIiksXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0bGVmdDogcHgoaW5kZW50YXRpb25NYXJnaW4pLFxuXHRcdFx0XHRcdFx0XHR3aWR0aDogcHgoYnV0dG9uV2lkdGgpLFxuXHRcdFx0XHRcdFx0XHRoZWlnaHQ6IHB4KHNpemUuYnV0dG9uX2hlaWdodCksXG5cdFx0XHRcdFx0XHRcdHBhZGRpbmdMZWZ0OiBweChwYWRkaW5nTmVlZGVkKSxcblx0XHRcdFx0XHRcdFx0cGFkZGluZ1JpZ2h0OiBweChwYWRkaW5nTmVlZGVkKSxcblx0XHRcdFx0XHRcdFx0Ly8gdGhlIHpJbmRleCBpcyBzbyB0aGUgaGllcmFyY2h5IGxpbmVzIG5ldmVyIGdldCBkcmF3biBvdmVyIHRoZSBpY29uXG5cdFx0XHRcdFx0XHRcdHpJbmRleDogMyxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcImRhdGEtdGVzdGlkXCI6IGBidG46aWNvbjoke2dldEZvbGRlck5hbWUoZm9sZGVyKX1gLFxuXHRcdFx0XHRcdFx0XCJkYXRhLWV4cGFuZGVkXCI6IHZub2RlLmF0dHJzLmV4cGFuZGVkID8gXCJ0cnVlXCIgOiBcImZhbHNlXCIsXG5cdFx0XHRcdFx0XHRvbmNsaWNrOiB2bm9kZS5hdHRycy5vbkV4cGFuZGVyQ2xpY2ssXG5cdFx0XHRcdFx0XHRvbmtleWRvd246IGhhbmRsZUJhY2t3YXJkc1RhYixcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG0oSWNvbiwge1xuXHRcdFx0XHRcdFx0aWNvbixcblx0XHRcdFx0XHRcdHNpemU6IEljb25TaXplLk1lZGl1bSxcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdGZpbGw6IGlzTmF2QnV0dG9uU2VsZWN0ZWQoYnV0dG9uKSA/IHRoZW1lLm5hdmlnYXRpb25fYnV0dG9uX3NlbGVjdGVkIDogdGhlbWUubmF2aWdhdGlvbl9idXR0b24sXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpLFxuXHRcdFx0XHRtKE5hdkJ1dHRvbiwge1xuXHRcdFx0XHRcdC4uLmJ1dHRvbixcblx0XHRcdFx0XHRvbmZvY3VzOiBvbkhvdmVyLFxuXHRcdFx0XHRcdG9ua2V5ZG93bjogaGFuZGxlQmFja3dhcmRzVGFiLFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0Ly8gc2hvdyB0aGUgZWRpdCBidXR0b24gaW4gZWl0aGVyIGVkaXQgbW9kZSBvciBvbiBob3ZlciAoZXhjbHVkaW5nIGhvdmVyIG9uIG1vYmlsZSlcblx0XHRcdFx0cmlnaHRCdXR0b24gJiYgKGVkaXRNb2RlIHx8ICghY2xpZW50LmlzTW9iaWxlRGV2aWNlKCkgJiYgdGhpcy5ob3ZlcmVkKSlcblx0XHRcdFx0XHQ/IG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHQuLi5yaWdodEJ1dHRvbixcblx0XHRcdFx0XHRcdFx0Y2xpY2s6IChldmVudCwgZG9tKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0cmlnaHRCdXR0b24uY2xpY2soZXZlbnQsIGRvbSlcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0b25rZXlkb3duOiBoYW5kbGVGb3J3YXJkc1RhYixcblx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0OiBtKFwiXCIsIHsgc3R5bGU6IHsgbWFyZ2luUmlnaHQ6IHB4KHNpemUuaHBhZF9idXR0b24pIH0gfSwgW1xuXHRcdFx0XHRcdFx0XHRtKENvdW50ZXJCYWRnZSwge1xuXHRcdFx0XHRcdFx0XHRcdGNvdW50LFxuXHRcdFx0XHRcdFx0XHRcdGNvbG9yOiB0aGVtZS5uYXZpZ2F0aW9uX2J1dHRvbl9pY29uLFxuXHRcdFx0XHRcdFx0XHRcdGJhY2tncm91bmQ6IGdldE5hdkJ1dHRvbkljb25CYWNrZ3JvdW5kKCksXG5cdFx0XHRcdFx0XHRcdFx0c2hvd0Z1bGxDb3VudDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0ICBdKSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJIaWVyYXJjaHlMaW5lKHsgaW5kZW50YXRpb25MZXZlbCwgbnVtYmVyT2ZQcmV2aW91c1Jvd3MsIGlzTGFzdFNpYmxpbmcsIG9uU2VsZWN0ZWRQYXRoIH06IE1haWxGb2xkZXJSb3dBdHRycywgaW5kZW50YXRpb25NYXJnaW46IG51bWJlcikge1xuXHRcdGNvbnN0IGxpbmVTaXplID0gMlxuXHRcdGNvbnN0IGJvcmRlciA9IGAke2xpbmVTaXplfXB4IHNvbGlkICR7dGhlbWUuY29udGVudF9ib3JkZXJ9YFxuXHRcdGNvbnN0IHZlcnRpY2FsT2Zmc2V0SW5zaWRlUm93ID0gc2l6ZS5idXR0b25faGVpZ2h0IC8gMiArIDFcblx0XHRjb25zdCB2ZXJ0aWNhbE9mZnNldEZvclBhcmVudCA9IChzaXplLmJ1dHRvbl9oZWlnaHQgLSBzaXplLmljb25fc2l6ZV9sYXJnZSkgLyAyXG5cdFx0Y29uc3QgbGVuZ3RoT2ZIb3Jpem9udGFsTGluZSA9IHNpemUuaHBhZCAtIDJcblx0XHRjb25zdCBsZWZ0T2Zmc2V0ID0gaW5kZW50YXRpb25NYXJnaW5cblxuXHRcdHJldHVybiBpbmRlbnRhdGlvbkxldmVsICE9PSAwXG5cdFx0XHQ/IFtcblx0XHRcdFx0XHRpc0xhc3RTaWJsaW5nIHx8IG9uU2VsZWN0ZWRQYXRoXG5cdFx0XHRcdFx0XHQ/IC8vIGRyYXcgYm90aCB2ZXJ0aWNhbCBhbmQgaG9yaXpvbnRhbCBsaW5lc1xuXHRcdFx0XHRcdFx0ICBtKFwiLmFic1wiLCB7XG5cdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdHdpZHRoOiBweChsZW5ndGhPZkhvcml6b250YWxMaW5lKSxcblx0XHRcdFx0XHRcdFx0XHRcdGJvcmRlckJvdHRvbUxlZnRSYWRpdXM6IFwiM3B4XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyB0aGVyZSdzIHNvbWUgc3VidGxlIGRpZmZlcmVuY2UgYmV0d2VlbiBib3JkZXIgd2UgdXNlIGhlcmUgYW5kIHRoZSB0b3AgZm9yIHRoZSBvdGhlciBlbGVtZW50IGFuZCB0aGlzICsxIGlzIHRvXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBhY2NvbW1vZGF0ZSBpdFxuXHRcdFx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBweCgxICsgdmVydGljYWxPZmZzZXRJbnNpZGVSb3cgKyB2ZXJ0aWNhbE9mZnNldEZvclBhcmVudCArIG51bWJlck9mUHJldmlvdXNSb3dzICogc2l6ZS5idXR0b25faGVpZ2h0KSxcblx0XHRcdFx0XHRcdFx0XHRcdHRvcDogcHgoLXZlcnRpY2FsT2Zmc2V0Rm9yUGFyZW50IC0gbnVtYmVyT2ZQcmV2aW91c1Jvd3MgKiBzaXplLmJ1dHRvbl9oZWlnaHQpLFxuXHRcdFx0XHRcdFx0XHRcdFx0bGVmdDogcHgobGVmdE9mZnNldCksXG5cdFx0XHRcdFx0XHRcdFx0XHRib3JkZXJMZWZ0OiBib3JkZXIsXG5cdFx0XHRcdFx0XHRcdFx0XHRib3JkZXJCb3R0b206IGJvcmRlcixcblx0XHRcdFx0XHRcdFx0XHRcdC8vIHdlIG5lZWQgdG8gZHJhdyBzZWxlY3RlZCBsaW5lcyBvdmVyIGV2ZXJ5dGhpbmcgZWxzZSwgZXZlbiB0aGluZ3MgdGhhdCBhcmUgZHJhd24gbGF0ZXJcblx0XHRcdFx0XHRcdFx0XHRcdHpJbmRleDogb25TZWxlY3RlZFBhdGggPyAyIDogMSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdFx0OiAvLyBkcmF3IG9ubHkgdGhlIGhvcml6b250YWwgbGluZVxuXHRcdFx0XHRcdFx0ICBtKFwiLmFic1wiLCB7XG5cdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdGhlaWdodDogcHgobGluZVNpemUpLFxuXHRcdFx0XHRcdFx0XHRcdFx0dG9wOiBweCh2ZXJ0aWNhbE9mZnNldEluc2lkZVJvdyksXG5cdFx0XHRcdFx0XHRcdFx0XHRsZWZ0OiBweChsZWZ0T2Zmc2V0KSxcblx0XHRcdFx0XHRcdFx0XHRcdHdpZHRoOiBweChsZW5ndGhPZkhvcml6b250YWxMaW5lKSxcblx0XHRcdFx0XHRcdFx0XHRcdGJhY2tncm91bmRDb2xvcjogdGhlbWUuY29udGVudF9ib3JkZXIsXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdCAgfSksXG5cdFx0XHQgIF1cblx0XHRcdDogbnVsbFxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZCwgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBNYWlsYm94RGV0YWlsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9NYWlsYm94TW9kZWwuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBTaWRlYmFyU2VjdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL1NpZGViYXJTZWN0aW9uLmpzXCJcbmltcG9ydCB7IEljb25CdXR0b24sIEljb25CdXR0b25BdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBGb2xkZXJTdWJ0cmVlLCBGb2xkZXJTeXN0ZW0gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vbWFpbC9Gb2xkZXJTeXN0ZW0uanNcIlxuaW1wb3J0IHsgZWxlbWVudElkUGFydCwgZ2V0RWxlbWVudElkIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzLmpzXCJcbmltcG9ydCB7IGlzU2VsZWN0ZWRQcmVmaXgsIE5hdkJ1dHRvbkF0dHJzLCBOYXZCdXR0b25Db2xvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTmF2QnV0dG9uLmpzXCJcbmltcG9ydCB7IE1BSUxfUFJFRklYIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL1JvdXRlQ2hhbmdlLmpzXCJcbmltcG9ydCB7IE1haWxGb2xkZXJSb3cgfSBmcm9tIFwiLi9NYWlsRm9sZGVyUm93LmpzXCJcbmltcG9ydCB7IGxhc3QsIG5vT3AsIFRodW5rIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBNYWlsRm9sZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgYXR0YWNoRHJvcGRvd24sIERyb3Bkb3duQnV0dG9uQXR0cnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0Ryb3Bkb3duLmpzXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29ucy5qc1wiXG5pbXBvcnQgeyBCdXR0b25Db2xvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB7IEJ1dHRvblNpemUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0J1dHRvblNpemUuanNcIlxuaW1wb3J0IHsgTWFpbFNldEtpbmQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgcHgsIHNpemUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplLmpzXCJcbmltcG9ydCB7IFJvd0J1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvYnV0dG9ucy9Sb3dCdXR0b24uanNcIlxuaW1wb3J0IHsgTWFpbE1vZGVsIH0gZnJvbSBcIi4uL21vZGVsL01haWxNb2RlbC5qc1wiXG5pbXBvcnQgeyBnZXRGb2xkZXJOYW1lLCBNQVhfRk9MREVSX0lOREVOVF9MRVZFTCB9IGZyb20gXCIuLi9tb2RlbC9NYWlsVXRpbHMuanNcIlxuaW1wb3J0IHsgZ2V0Rm9sZGVySWNvbiB9IGZyb20gXCIuL01haWxHdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBpc1NwYW1PclRyYXNoRm9sZGVyIH0gZnJvbSBcIi4uL21vZGVsL01haWxDaGVja3MuanNcIlxuaW1wb3J0IHsgRHJvcERhdGEgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0d1aVV0aWxzXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIE1haWxGb2xkZXJWaWV3QXR0cnMge1xuXHRtYWlsTW9kZWw6IE1haWxNb2RlbFxuXHRtYWlsYm94RGV0YWlsOiBNYWlsYm94RGV0YWlsXG5cdG1haWxGb2xkZXJFbGVtZW50SWRUb1NlbGVjdGVkTWFpbElkOiBSZWFkb25seU1hcDxJZCwgSWQ+XG5cdG9uRm9sZGVyQ2xpY2s6IChmb2xkZXI6IE1haWxGb2xkZXIpID0+IHVua25vd25cblx0b25Gb2xkZXJEcm9wOiAoZHJvcERhdGE6IERyb3BEYXRhLCBmb2xkZXI6IE1haWxGb2xkZXIpID0+IHVua25vd25cblx0ZXhwYW5kZWRGb2xkZXJzOiBSZWFkb25seVNldDxJZD5cblx0b25Gb2xkZXJFeHBhbmRlZDogKGZvbGRlcjogTWFpbEZvbGRlciwgc3RhdGU6IGJvb2xlYW4pID0+IHVua25vd25cblx0b25TaG93Rm9sZGVyQWRkRWRpdERpYWxvZzogKG1haWxHcm91cElkOiBJZCwgZm9sZGVyOiBNYWlsRm9sZGVyIHwgbnVsbCwgcGFyZW50Rm9sZGVyOiBNYWlsRm9sZGVyIHwgbnVsbCkgPT4gdW5rbm93blxuXHRvbkRlbGV0ZUN1c3RvbU1haWxGb2xkZXI6IChmb2xkZXI6IE1haWxGb2xkZXIpID0+IHVua25vd25cblx0aW5FZGl0TW9kZTogYm9vbGVhblxuXHRvbkVkaXRNYWlsYm94OiAoKSA9PiB1bmtub3duXG59XG5cbnR5cGUgQ291bnRlcnMgPSBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+XG5cbi8qKiBEaXNwbGF5cyBhIHRyZWUgb2YgYWxsIGZvbGRlcnMuICovXG5leHBvcnQgY2xhc3MgTWFpbEZvbGRlcnNWaWV3IGltcGxlbWVudHMgQ29tcG9uZW50PE1haWxGb2xkZXJWaWV3QXR0cnM+IHtcblx0Ly8gQ29udGFpbnMgdGhlIGlkIG9mIHRoZSB2aXNpYmxlIHJvd1xuXHRwcml2YXRlIHZpc2libGVSb3c6IHN0cmluZyB8IG51bGwgPSBudWxsXG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPE1haWxGb2xkZXJWaWV3QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgbWFpbGJveERldGFpbCwgbWFpbE1vZGVsIH0gPSBhdHRyc1xuXHRcdGNvbnN0IGdyb3VwQ291bnRlcnMgPSBtYWlsTW9kZWwubWFpbGJveENvdW50ZXJzKClbbWFpbGJveERldGFpbC5tYWlsR3JvdXAuX2lkXSB8fCB7fVxuXHRcdGNvbnN0IGZvbGRlcnMgPSBtYWlsTW9kZWwuZ2V0Rm9sZGVyU3lzdGVtQnlHcm91cElkKG1haWxib3hEZXRhaWwubWFpbEdyb3VwLl9pZClcblx0XHQvLyBJbXBvcnRhbnQ6IHRoaXMgYXJyYXkgaXMga2V5ZWQgc28gZWFjaCBpdGVtIG11c3QgaGF2ZSBhIGtleSBhbmQgYG51bGxgIGNhbm5vdCBiZSBpbiB0aGUgYXJyYXlcblx0XHQvLyBTbyBpbnN0ZWFkIHdlIHB1c2ggb3Igbm90IHB1c2ggaW50byBhcnJheVxuXHRcdGNvbnN0IGN1c3RvbVN5c3RlbXMgPSBmb2xkZXJzPy5jdXN0b21TdWJ0cmVlcyA/PyBbXVxuXHRcdGNvbnN0IHN5c3RlbVN5c3RlbXMgPSBmb2xkZXJzPy5zeXN0ZW1TdWJ0cmVlcy5maWx0ZXIoKGYpID0+IGYuZm9sZGVyLmZvbGRlclR5cGUgIT09IE1haWxTZXRLaW5kLkltcG9ydGVkKSA/PyBbXVxuXHRcdGNvbnN0IGNoaWxkcmVuOiBDaGlsZHJlbiA9IFtdXG5cdFx0Y29uc3Qgc2VsZWN0ZWRGb2xkZXIgPSBmb2xkZXJzXG5cdFx0XHQ/LmdldEluZGVudGVkTGlzdCgpXG5cdFx0XHQubWFwKChmKSA9PiBmLmZvbGRlcilcblx0XHRcdC5maW5kKChmKSA9PiBpc1NlbGVjdGVkUHJlZml4KE1BSUxfUFJFRklYICsgXCIvXCIgKyBnZXRFbGVtZW50SWQoZikpKVxuXHRcdGNvbnN0IHBhdGggPSBmb2xkZXJzICYmIHNlbGVjdGVkRm9sZGVyID8gZm9sZGVycy5nZXRQYXRoVG9Gb2xkZXIoc2VsZWN0ZWRGb2xkZXIuX2lkKSA6IFtdXG5cdFx0Y29uc3QgaXNJbnRlcm5hbFVzZXIgPSBsb2NhdG9yLmxvZ2lucy5pc0ludGVybmFsVXNlckxvZ2dlZEluKClcblx0XHRjb25zdCBzeXN0ZW1DaGlsZHJlbiA9IGZvbGRlcnMgJiYgdGhpcy5yZW5kZXJGb2xkZXJUcmVlKHN5c3RlbVN5c3RlbXMsIGdyb3VwQ291bnRlcnMsIGZvbGRlcnMsIGF0dHJzLCBwYXRoLCBpc0ludGVybmFsVXNlcilcblx0XHRpZiAoc3lzdGVtQ2hpbGRyZW4pIHtcblx0XHRcdGNoaWxkcmVuLnB1c2goLi4uc3lzdGVtQ2hpbGRyZW4uY2hpbGRyZW4pXG5cdFx0fVxuXHRcdGlmIChpc0ludGVybmFsVXNlcikge1xuXHRcdFx0Y29uc3QgY3VzdG9tQ2hpbGRyZW4gPSBmb2xkZXJzID8gdGhpcy5yZW5kZXJGb2xkZXJUcmVlKGN1c3RvbVN5c3RlbXMsIGdyb3VwQ291bnRlcnMsIGZvbGRlcnMsIGF0dHJzLCBwYXRoLCBpc0ludGVybmFsVXNlcikuY2hpbGRyZW4gOiBbXVxuXHRcdFx0Y2hpbGRyZW4ucHVzaChcblx0XHRcdFx0bShcblx0XHRcdFx0XHRTaWRlYmFyU2VjdGlvbixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRuYW1lOiBcInlvdXJGb2xkZXJzX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0YnV0dG9uOiBhdHRycy5pbkVkaXRNb2RlID8gdGhpcy5yZW5kZXJDcmVhdGVGb2xkZXJBZGRCdXR0b24obnVsbCwgYXR0cnMpIDogdGhpcy5yZW5kZXJFZGl0Rm9sZGVyc0J1dHRvbihhdHRycyksXG5cdFx0XHRcdFx0XHRrZXk6IFwieW91ckZvbGRlcnNcIiwgLy8gd2UgbmVlZCB0byBzZXQgYSBrZXkgYmVjYXVzZSBmb2xkZXIgcm93cyBhbHNvIGhhdmUgYSBrZXkuXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRjdXN0b21DaGlsZHJlbixcblx0XHRcdFx0KSxcblx0XHRcdClcblx0XHRcdGNoaWxkcmVuLnB1c2godGhpcy5yZW5kZXJBZGRGb2xkZXJCdXR0b25Sb3coYXR0cnMpKVxuXHRcdH1cblx0XHRyZXR1cm4gY2hpbGRyZW5cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRm9sZGVyVHJlZShcblx0XHRzdWJTeXN0ZW1zOiByZWFkb25seSBGb2xkZXJTdWJ0cmVlW10sXG5cdFx0Z3JvdXBDb3VudGVyczogQ291bnRlcnMsXG5cdFx0Zm9sZGVyczogRm9sZGVyU3lzdGVtLFxuXHRcdGF0dHJzOiBNYWlsRm9sZGVyVmlld0F0dHJzLFxuXHRcdHBhdGg6IE1haWxGb2xkZXJbXSxcblx0XHRpc0ludGVybmFsVXNlcjogYm9vbGVhbixcblx0XHRpbmRlbnRhdGlvbkxldmVsOiBudW1iZXIgPSAwLFxuXHQpOiB7IGNoaWxkcmVuOiBDaGlsZHJlbltdOyBudW1Sb3dzOiBudW1iZXIgfSB7XG5cdFx0Ly8gd2UgbmVlZCB0byBrZWVwIHRyYWNrIG9mIGhvdyBtYW55IHJvd3Mgd2UndmUgZHJhd24gc28gZmFyIGZvciB0aGlzIHN1YnRyZWUgc28gdGhhdCB3ZSBjYW4gZHJhdyBoaWVyYXJjaHkgbGluZXMgY29ycmVjdGx5XG5cdFx0Y29uc3QgcmVzdWx0OiB7IGNoaWxkcmVuOiBDaGlsZHJlbltdOyBudW1Sb3dzOiBudW1iZXIgfSA9IHsgY2hpbGRyZW46IFtdLCBudW1Sb3dzOiAwIH1cblx0XHRmb3IgKGxldCBzeXN0ZW0gb2Ygc3ViU3lzdGVtcykge1xuXHRcdFx0Y29uc3QgaWQgPSBnZXRFbGVtZW50SWQoc3lzdGVtLmZvbGRlcilcblx0XHRcdGNvbnN0IGZvbGRlck5hbWUgPSBnZXRGb2xkZXJOYW1lKHN5c3RlbS5mb2xkZXIpXG5cdFx0XHRjb25zdCBidXR0b246IE5hdkJ1dHRvbkF0dHJzID0ge1xuXHRcdFx0XHRsYWJlbDogbGFuZy5tYWtlVHJhbnNsYXRpb24oYGZvbGRlcjoke2ZvbGRlck5hbWV9YCwgZm9sZGVyTmFtZSksXG5cdFx0XHRcdGhyZWY6ICgpID0+IHtcblx0XHRcdFx0XHRpZiAoYXR0cnMuaW5FZGl0TW9kZSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIG0ucm91dGUuZ2V0KClcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc3QgZm9sZGVyRWxlbWVudElkID0gZ2V0RWxlbWVudElkKHN5c3RlbS5mb2xkZXIpXG5cdFx0XHRcdFx0XHRjb25zdCBtYWlsSWQgPSBhdHRycy5tYWlsRm9sZGVyRWxlbWVudElkVG9TZWxlY3RlZE1haWxJZC5nZXQoZm9sZGVyRWxlbWVudElkKVxuXHRcdFx0XHRcdFx0aWYgKG1haWxJZCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gYCR7TUFJTF9QUkVGSVh9LyR7Zm9sZGVyRWxlbWVudElkfS8ke21haWxJZH1gXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gYCR7TUFJTF9QUkVGSVh9LyR7Zm9sZGVyRWxlbWVudElkfWBcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGlzU2VsZWN0ZWRQcmVmaXg6IGF0dHJzLmluRWRpdE1vZGUgPyBmYWxzZSA6IE1BSUxfUFJFRklYICsgXCIvXCIgKyBnZXRFbGVtZW50SWQoc3lzdGVtLmZvbGRlciksXG5cdFx0XHRcdGNvbG9yczogTmF2QnV0dG9uQ29sb3IuTmF2LFxuXHRcdFx0XHRjbGljazogKCkgPT4gYXR0cnMub25Gb2xkZXJDbGljayhzeXN0ZW0uZm9sZGVyKSxcblx0XHRcdFx0ZHJvcEhhbmRsZXI6IChkcm9wRGF0YSkgPT4gYXR0cnMub25Gb2xkZXJEcm9wKGRyb3BEYXRhLCBzeXN0ZW0uZm9sZGVyKSxcblx0XHRcdFx0ZGlzYWJsZUhvdmVyQmFja2dyb3VuZDogdHJ1ZSxcblx0XHRcdFx0ZGlzYWJsZWQ6IGF0dHJzLmluRWRpdE1vZGUsXG5cdFx0XHR9XG5cdFx0XHRjb25zdCBjdXJyZW50RXhwYW5zaW9uU3RhdGUgPSBhdHRycy5pbkVkaXRNb2RlID8gdHJ1ZSA6IGF0dHJzLmV4cGFuZGVkRm9sZGVycy5oYXMoZ2V0RWxlbWVudElkKHN5c3RlbS5mb2xkZXIpKSA/PyBmYWxzZSAvL2RlZmF1bHQgaXMgZmFsc2Vcblx0XHRcdGNvbnN0IGhhc0NoaWxkcmVuID0gc3lzdGVtLmNoaWxkcmVuLmxlbmd0aCA+IDBcblx0XHRcdGNvbnN0IGNvdW50ZXJJZCA9IHN5c3RlbS5mb2xkZXIuaXNNYWlsU2V0ID8gZ2V0RWxlbWVudElkKHN5c3RlbS5mb2xkZXIpIDogc3lzdGVtLmZvbGRlci5tYWlsc1xuXHRcdFx0Y29uc3Qgc3VtbWVkQ291bnQgPSAhY3VycmVudEV4cGFuc2lvblN0YXRlICYmIGhhc0NoaWxkcmVuID8gdGhpcy5nZXRUb3RhbEZvbGRlckNvdW50ZXIoZ3JvdXBDb3VudGVycywgc3lzdGVtKSA6IGdyb3VwQ291bnRlcnNbY291bnRlcklkXVxuXHRcdFx0Y29uc3QgY2hpbGRSZXN1bHQgPVxuXHRcdFx0XHRoYXNDaGlsZHJlbiAmJiBjdXJyZW50RXhwYW5zaW9uU3RhdGVcblx0XHRcdFx0XHQ/IHRoaXMucmVuZGVyRm9sZGVyVHJlZShzeXN0ZW0uY2hpbGRyZW4sIGdyb3VwQ291bnRlcnMsIGZvbGRlcnMsIGF0dHJzLCBwYXRoLCBpc0ludGVybmFsVXNlciwgaW5kZW50YXRpb25MZXZlbCArIDEpXG5cdFx0XHRcdFx0OiB7IGNoaWxkcmVuOiBudWxsLCBudW1Sb3dzOiAwIH1cblx0XHRcdGNvbnN0IGlzVHJhc2hPclNwYW0gPSBzeXN0ZW0uZm9sZGVyLmZvbGRlclR5cGUgPT09IE1haWxTZXRLaW5kLlRSQVNIIHx8IHN5c3RlbS5mb2xkZXIuZm9sZGVyVHlwZSA9PT0gTWFpbFNldEtpbmQuU1BBTVxuXHRcdFx0Y29uc3QgaXNSaWdodEJ1dHRvblZpc2libGUgPSB0aGlzLnZpc2libGVSb3cgPT09IGlkXG5cdFx0XHRjb25zdCByaWdodEJ1dHRvbiA9XG5cdFx0XHRcdGlzSW50ZXJuYWxVc2VyICYmICFpc1RyYXNoT3JTcGFtICYmIChpc1JpZ2h0QnV0dG9uVmlzaWJsZSB8fCBhdHRycy5pbkVkaXRNb2RlKVxuXHRcdFx0XHRcdD8gdGhpcy5jcmVhdGVGb2xkZXJNb3JlQnV0dG9uKHN5c3RlbS5mb2xkZXIsIGZvbGRlcnMsIGF0dHJzLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMudmlzaWJsZVJvdyA9IG51bGxcblx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0OiBudWxsXG5cdFx0XHRjb25zdCByZW5kZXIgPSBtLmZyYWdtZW50KFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0a2V5OiBpZCxcblx0XHRcdFx0fSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdG0oTWFpbEZvbGRlclJvdywge1xuXHRcdFx0XHRcdFx0Y291bnQ6IGF0dHJzLmluRWRpdE1vZGUgPyAwIDogc3VtbWVkQ291bnQsXG5cdFx0XHRcdFx0XHRidXR0b24sXG5cdFx0XHRcdFx0XHRmb2xkZXI6IHN5c3RlbS5mb2xkZXIsXG5cdFx0XHRcdFx0XHRyaWdodEJ1dHRvbixcblx0XHRcdFx0XHRcdGV4cGFuZGVkOiBoYXNDaGlsZHJlbiA/IGN1cnJlbnRFeHBhbnNpb25TdGF0ZSA6IG51bGwsXG5cdFx0XHRcdFx0XHRpbmRlbnRhdGlvbkxldmVsOiBNYXRoLm1pbihpbmRlbnRhdGlvbkxldmVsLCBNQVhfRk9MREVSX0lOREVOVF9MRVZFTCksXG5cdFx0XHRcdFx0XHRvbkV4cGFuZGVyQ2xpY2s6IGhhc0NoaWxkcmVuID8gKCkgPT4gYXR0cnMub25Gb2xkZXJFeHBhbmRlZChzeXN0ZW0uZm9sZGVyLCBjdXJyZW50RXhwYW5zaW9uU3RhdGUpIDogbm9PcCxcblx0XHRcdFx0XHRcdGhhc0NoaWxkcmVuLFxuXHRcdFx0XHRcdFx0b25TZWxlY3RlZFBhdGg6IHBhdGguaW5jbHVkZXMoc3lzdGVtLmZvbGRlciksXG5cdFx0XHRcdFx0XHRudW1iZXJPZlByZXZpb3VzUm93czogcmVzdWx0Lm51bVJvd3MsXG5cdFx0XHRcdFx0XHRpc0xhc3RTaWJsaW5nOiBsYXN0KHN1YlN5c3RlbXMpID09PSBzeXN0ZW0sXG5cdFx0XHRcdFx0XHRlZGl0TW9kZTogYXR0cnMuaW5FZGl0TW9kZSxcblx0XHRcdFx0XHRcdG9uSG92ZXI6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0dGhpcy52aXNpYmxlUm93ID0gaWRcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0Y2hpbGRSZXN1bHQuY2hpbGRyZW4sXG5cdFx0XHRcdF0sXG5cdFx0XHQpXG5cdFx0XHRyZXN1bHQubnVtUm93cyArPSBjaGlsZFJlc3VsdC5udW1Sb3dzICsgMVxuXHRcdFx0cmVzdWx0LmNoaWxkcmVuLnB1c2gocmVuZGVyKVxuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckFkZEZvbGRlckJ1dHRvblJvdyhhdHRyczogTWFpbEZvbGRlclZpZXdBdHRycyk6IENoaWxkIHtcblx0XHQvLyBUaGlzIGJ1dHRvbiBuZWVkcyB0byBmaWxsIHRoZSB3aG9sZSByb3csIGJ1dCBpcyBub3QgYSBuYXZpZ2F0aW9uIGJ1dHRvbiAoc28gSWNvbkJ1dHRvbiBvciBOYXZCdXR0b24gd2VyZW4ndCBhcHByb3ByaWF0ZSlcblx0XHRyZXR1cm4gbShSb3dCdXR0b24sIHtcblx0XHRcdGxhYmVsOiBcImFkZEZvbGRlcl9hY3Rpb25cIixcblx0XHRcdGtleTogXCJhZGRGb2xkZXJcIixcblx0XHRcdGljb246IEljb25zLkFkZCxcblx0XHRcdGNsYXNzOiBcImZvbGRlci1yb3cgbWxyLWJ1dHRvbiBib3JkZXItcmFkaXVzLXNtYWxsXCIsXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHR3aWR0aDogYGNhbGMoMTAwJSAtICR7cHgoc2l6ZS5ocGFkX2J1dHRvbiAqIDIpfSlgLFxuXHRcdFx0fSxcblx0XHRcdG9uY2xpY2s6ICgpID0+IHtcblx0XHRcdFx0YXR0cnMub25TaG93Rm9sZGVyQWRkRWRpdERpYWxvZyhhdHRycy5tYWlsYm94RGV0YWlsLm1haWxHcm91cC5faWQsIG51bGwsIG51bGwpXG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGdldFRvdGFsRm9sZGVyQ291bnRlcihjb3VudGVyczogQ291bnRlcnMsIHN5c3RlbTogRm9sZGVyU3VidHJlZSk6IG51bWJlciB7XG5cdFx0Y29uc3QgY291bnRlcklkID0gc3lzdGVtLmZvbGRlci5pc01haWxTZXQgPyBnZXRFbGVtZW50SWQoc3lzdGVtLmZvbGRlcikgOiBzeXN0ZW0uZm9sZGVyLm1haWxzXG5cdFx0cmV0dXJuIChjb3VudGVyc1tjb3VudGVySWRdID8/IDApICsgc3lzdGVtLmNoaWxkcmVuLnJlZHVjZSgoYWNjLCBjaGlsZCkgPT4gYWNjICsgdGhpcy5nZXRUb3RhbEZvbGRlckNvdW50ZXIoY291bnRlcnMsIGNoaWxkKSwgMClcblx0fVxuXG5cdHByaXZhdGUgY3JlYXRlRm9sZGVyTW9yZUJ1dHRvbihmb2xkZXI6IE1haWxGb2xkZXIsIGZvbGRlcnM6IEZvbGRlclN5c3RlbSwgYXR0cnM6IE1haWxGb2xkZXJWaWV3QXR0cnMsIG9uQ2xvc2U6IFRodW5rKTogSWNvbkJ1dHRvbkF0dHJzIHtcblx0XHRyZXR1cm4gYXR0YWNoRHJvcGRvd24oe1xuXHRcdFx0bWFpbkJ1dHRvbkF0dHJzOiB7XG5cdFx0XHRcdHRpdGxlOiBcIm1vcmVfbGFiZWxcIixcblx0XHRcdFx0aWNvbjogSWNvbnMuTW9yZSxcblx0XHRcdFx0Y29sb3JzOiBCdXR0b25Db2xvci5OYXYsXG5cdFx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHRcdH0sXG5cdFx0XHRjaGlsZEF0dHJzOiAoKSA9PiB7XG5cdFx0XHRcdHJldHVybiBmb2xkZXIuZm9sZGVyVHlwZSA9PT0gTWFpbFNldEtpbmQuQ1VTVE9NXG5cdFx0XHRcdFx0PyAvLyBjYW5ub3QgYWRkIG5ldyBmb2xkZXIgdG8gY3VzdG9tIGZvbGRlciBpbiBzcGFtIG9yIHRyYXNoIGZvbGRlclxuXHRcdFx0XHRcdCAgaXNTcGFtT3JUcmFzaEZvbGRlcihmb2xkZXJzLCBmb2xkZXIpXG5cdFx0XHRcdFx0XHQ/IFt0aGlzLmVkaXRCdXR0b25BdHRycyhhdHRycywgZm9sZGVycywgZm9sZGVyKSwgdGhpcy5kZWxldGVCdXR0b25BdHRycyhhdHRycywgZm9sZGVyKV1cblx0XHRcdFx0XHRcdDogW3RoaXMuZWRpdEJ1dHRvbkF0dHJzKGF0dHJzLCBmb2xkZXJzLCBmb2xkZXIpLCB0aGlzLmFkZEJ1dHRvbkF0dHJzKGF0dHJzLCBmb2xkZXIpLCB0aGlzLmRlbGV0ZUJ1dHRvbkF0dHJzKGF0dHJzLCBmb2xkZXIpXVxuXHRcdFx0XHRcdDogW3RoaXMuYWRkQnV0dG9uQXR0cnMoYXR0cnMsIGZvbGRlcildXG5cdFx0XHR9LFxuXHRcdFx0b25DbG9zZSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBkZWxldGVCdXR0b25BdHRycyhhdHRyczogTWFpbEZvbGRlclZpZXdBdHRycywgZm9sZGVyOiBNYWlsRm9sZGVyKTogRHJvcGRvd25CdXR0b25BdHRycyB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGxhYmVsOiBcImRlbGV0ZV9hY3Rpb25cIixcblx0XHRcdGljb246IEljb25zLlRyYXNoLFxuXHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0YXR0cnMub25EZWxldGVDdXN0b21NYWlsRm9sZGVyKGZvbGRlcilcblx0XHRcdH0sXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhZGRCdXR0b25BdHRycyhhdHRyczogTWFpbEZvbGRlclZpZXdBdHRycywgZm9sZGVyOiBNYWlsRm9sZGVyKTogRHJvcGRvd25CdXR0b25BdHRycyB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGxhYmVsOiBcImFkZEZvbGRlcl9hY3Rpb25cIixcblx0XHRcdGljb246IEljb25zLkFkZCxcblx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdGF0dHJzLm9uU2hvd0ZvbGRlckFkZEVkaXREaWFsb2coYXR0cnMubWFpbGJveERldGFpbC5tYWlsR3JvdXAuX2lkLCBudWxsLCBmb2xkZXIpXG5cdFx0XHR9LFxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgZWRpdEJ1dHRvbkF0dHJzKGF0dHJzOiBNYWlsRm9sZGVyVmlld0F0dHJzLCBmb2xkZXJzOiBGb2xkZXJTeXN0ZW0sIGZvbGRlcjogTWFpbEZvbGRlcik6IERyb3Bkb3duQnV0dG9uQXR0cnMge1xuXHRcdHJldHVybiB7XG5cdFx0XHRsYWJlbDogXCJlZGl0X2FjdGlvblwiLFxuXHRcdFx0aWNvbjogSWNvbnMuRWRpdCxcblx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdGF0dHJzLm9uU2hvd0ZvbGRlckFkZEVkaXREaWFsb2coXG5cdFx0XHRcdFx0YXR0cnMubWFpbGJveERldGFpbC5tYWlsR3JvdXAuX2lkLFxuXHRcdFx0XHRcdGZvbGRlcixcblx0XHRcdFx0XHRmb2xkZXIucGFyZW50Rm9sZGVyID8gZm9sZGVycy5nZXRGb2xkZXJCeUlkKGVsZW1lbnRJZFBhcnQoZm9sZGVyLnBhcmVudEZvbGRlcikpIDogbnVsbCxcblx0XHRcdFx0KVxuXHRcdFx0fSxcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckNyZWF0ZUZvbGRlckFkZEJ1dHRvbihwYXJlbnRGb2xkZXI6IE1haWxGb2xkZXIgfCBudWxsLCBhdHRyczogTWFpbEZvbGRlclZpZXdBdHRycyk6IENoaWxkIHtcblx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJhZGRGb2xkZXJfYWN0aW9uXCIsXG5cdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gYXR0cnMub25TaG93Rm9sZGVyQWRkRWRpdERpYWxvZyhhdHRycy5tYWlsYm94RGV0YWlsLm1haWxHcm91cC5faWQsIG51bGwsIHBhcmVudEZvbGRlcilcblx0XHRcdH0sXG5cdFx0XHRpY29uOiBJY29ucy5BZGQsXG5cdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRWRpdEZvbGRlcnNCdXR0b24oYXR0cnM6IE1haWxGb2xkZXJWaWV3QXR0cnMpOiBDaGlsZCB7XG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwiZWRpdF9hY3Rpb25cIixcblx0XHRcdGNsaWNrOiAoKSA9PiBhdHRycy5vbkVkaXRNYWlsYm94KCksXG5cdFx0XHRpY29uOiBJY29ucy5FZGl0LFxuXHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdH0pXG5cdH1cbn1cbiIsImltcG9ydCB7IG1vZGFsLCBNb2RhbENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTW9kYWwuanNcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCwgbm9PcCwgVGh1bmsgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGZvY3VzTmV4dCwgZm9jdXNQcmV2aW91cywga2V5TWFuYWdlciwgU2hvcnRjdXQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvS2V5TWFuYWdlci5qc1wiXG5pbXBvcnQgeyBLZXlzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgYWxwaGEsIEFscGhhRW51bSwgQW5pbWF0aW9uUHJvbWlzZSwgYW5pbWF0aW9ucywgRGVmYXVsdEFuaW1hdGlvblRpbWUsIG9wYWNpdHkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9hbmltYXRpb24vQW5pbWF0aW9ucy5qc1wiXG5pbXBvcnQgeyBnZXRFbGV2YXRlZEJhY2tncm91bmQsIHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgSU5QVVQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZy5qc1wiXG5pbXBvcnQgeyBlYXNlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYW5pbWF0aW9uL0Vhc2luZy5qc1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemUuanNcIlxuaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc3R5bGVzLmpzXCJcbmltcG9ydCB7IExvZ2luQnV0dG9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9idXR0b25zL0xvZ2luQnV0dG9uLmpzXCJcblxuZXhwb3J0IGNsYXNzIEVkaXRGb2xkZXJzRGlhbG9nIGltcGxlbWVudHMgTW9kYWxDb21wb25lbnQge1xuXHRwcml2YXRlIHZpc2libGU6IGJvb2xlYW5cblx0cHJpdmF0ZSByZWFkb25seSBfc2hvcnRjdXRzOiBTaG9ydGN1dFtdXG5cdHByaXZhdGUgX2RvbURpYWxvZzogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXHQvKiogVGhlIGVsZW1lbnQgdGhhdCB3YXMgZm9jdXNlZCBiZWZvcmUgd2UndmUgc2hvd24gdGhlIGNvbXBvbmVudCBzbyB0aGF0IHdlIGNhbiByZXR1cm4gaXQgYmFjayB1cG9uIGNsb3NpbmcuICovXG5cdHByaXZhdGUgZm9jdXNlZEJlZm9yZVNob3duOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cblx0cHJpdmF0ZSBfY2xvc2VIYW5kbGVyOiBUaHVuayB8IG51bGwgPSBudWxsXG5cblx0cHJpdmF0ZSB1c2VkQm90dG9tTmF2QmVmb3JlOiBib29sZWFuID0gc3R5bGVzLmlzVXNpbmdCb3R0b21OYXZpZ2F0aW9uKClcblxuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGZvbGRlckxpc3Q6ICgpID0+IENoaWxkcmVuKSB7XG5cdFx0dGhpcy52aXNpYmxlID0gZmFsc2VcblxuXHRcdHRoaXMuX3Nob3J0Y3V0cyA9IFtcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLlJFVFVSTixcblx0XHRcdFx0c2hpZnQ6IGZhbHNlLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB0aGlzLmNsb3NlKCksXG5cdFx0XHRcdGhlbHA6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdFx0XHRzaGlmdDogZmFsc2UsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHRoaXMuY2xvc2UoKSxcblx0XHRcdFx0aGVscDogXCJjbG9zZV9hbHRcIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5UQUIsXG5cdFx0XHRcdHNoaWZ0OiB0cnVlLFxuXHRcdFx0XHRleGVjOiAoKSA9PiAodGhpcy5fZG9tRGlhbG9nID8gZm9jdXNQcmV2aW91cyh0aGlzLl9kb21EaWFsb2cpIDogZmFsc2UpLFxuXHRcdFx0XHRoZWxwOiBcInNlbGVjdFByZXZpb3VzX2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLlRBQixcblx0XHRcdFx0c2hpZnQ6IGZhbHNlLFxuXHRcdFx0XHRleGVjOiAoKSA9PiAodGhpcy5fZG9tRGlhbG9nID8gZm9jdXNOZXh0KHRoaXMuX2RvbURpYWxvZykgOiBmYWxzZSksXG5cdFx0XHRcdGhlbHA6IFwic2VsZWN0TmV4dF9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XVxuXG5cdFx0dGhpcy52aWV3ID0gdGhpcy52aWV3LmJpbmQodGhpcylcblx0fVxuXG5cdHZpZXcoKSB7XG5cdFx0aWYgKHRoaXMudXNlZEJvdHRvbU5hdkJlZm9yZSAhPT0gc3R5bGVzLmlzVXNpbmdCb3R0b21OYXZpZ2F0aW9uKCkpIHtcblx0XHRcdHRoaXMuY2xvc2UoKVxuXHRcdH1cblx0XHR0aGlzLnVzZWRCb3R0b21OYXZCZWZvcmUgPSBzdHlsZXMuaXNVc2luZ0JvdHRvbU5hdmlnYXRpb24oKVxuXHRcdGNvbnN0IG1hcmdpblRvcCA9IHRoaXMudXNlZEJvdHRvbU5hdkJlZm9yZSA/IFwiZW52KHNhZmUtYXJlYS1pbnNldC10b3ApXCIgOiBweChzaXplLm5hdmJhcl9oZWlnaHQpXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5mbGV4LmNvbFwiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdHdpZHRoOiBweChzaXplLmZpcnN0X2NvbF9tYXhfd2lkdGggLSBzaXplLmJ1dHRvbl9oZWlnaHQpLFxuXHRcdFx0XHRcdGhlaWdodDogYGNhbGMoMTAwJSAtICR7bWFyZ2luVG9wfSlgLFxuXHRcdFx0XHRcdC8vIGZvciB0aGUgaGVhZGVyXG5cdFx0XHRcdFx0bWFyZ2luVG9wLFxuXHRcdFx0XHRcdG1hcmdpbkxlZnQ6IHB4KHNpemUuYnV0dG9uX2hlaWdodCksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uY2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpLFxuXHRcdFx0XHQvLyBkbyBub3QgcHJvcGFnYXRlIGNsaWNrcyBvbiB0aGUgZGlhbG9nIGFzIHRoZSBNb2RhbCBleHBlY3RzIGFsbCBwcm9wYWdhdGVkIGNsaWNrcyB0byBiZSBjbGlja3Mgb24gdGhlIGJhY2tncm91bmRcblx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuX2RvbURpYWxvZyA9IHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudFxuXHRcdFx0XHRcdGxldCBhbmltYXRpb246IEFuaW1hdGlvblByb21pc2UgfCBudWxsID0gbnVsbFxuXG5cdFx0XHRcdFx0Y29uc3QgYmdjb2xvciA9IHRoZW1lLm5hdmlnYXRpb25fYmdcblx0XHRcdFx0XHRjb25zdCBjaGlsZHJlbiA9IEFycmF5LmZyb20odGhpcy5fZG9tRGlhbG9nLmNoaWxkcmVuKSBhcyBBcnJheTxIVE1MRWxlbWVudD5cblx0XHRcdFx0XHRmb3IgKGxldCBjaGlsZCBvZiBjaGlsZHJlbikge1xuXHRcdFx0XHRcdFx0Y2hpbGQuc3R5bGUub3BhY2l0eSA9IFwiMFwiXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRoaXMuX2RvbURpYWxvZy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBgcmdiYSgwLCAwLCAwLCAwKWBcblx0XHRcdFx0XHRhbmltYXRpb24gPSBQcm9taXNlLmFsbChbXG5cdFx0XHRcdFx0XHRhbmltYXRpb25zLmFkZCh0aGlzLl9kb21EaWFsb2csIGFscGhhKEFscGhhRW51bS5CYWNrZ3JvdW5kQ29sb3IsIGJnY29sb3IsIDAsIDEpKSxcblx0XHRcdFx0XHRcdGFuaW1hdGlvbnMuYWRkKGNoaWxkcmVuLCBvcGFjaXR5KDAsIDEsIHRydWUpLCB7XG5cdFx0XHRcdFx0XHRcdGRlbGF5OiBEZWZhdWx0QW5pbWF0aW9uVGltZSAvIDIsXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRdKVxuXG5cdFx0XHRcdFx0Ly8gc2VsZWN0IGZpcnN0IGlucHV0IGZpZWxkLiBibHVyIGZpcnN0IHRvIGF2b2lkIHRoYXQgdXNlcnMgY2FuIGVudGVyIHRleHQgaW4gdGhlIHByZXZpb3VzbHkgZm9jdXNlZCBlbGVtZW50IHdoaWxlIHRoZSBhbmltYXRpb24gaXMgcnVubmluZ1xuXHRcdFx0XHRcdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgYWN0aXZlRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQgfCBudWxsXG5cdFx0XHRcdFx0XHRpZiAoYWN0aXZlRWxlbWVudCAmJiB0eXBlb2YgYWN0aXZlRWxlbWVudC5ibHVyID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHRcdFx0YWN0aXZlRWxlbWVudC5ibHVyKClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdGFuaW1hdGlvbi50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdHRoaXMuZGVmYXVsdEZvY3VzT25Mb2FkKClcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIi5wbHItYnV0dG9uLm10Lm1iXCIsXG5cdFx0XHRcdFx0bShMb2dpbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwiZG9uZV9hY3Rpb25cIixcblx0XHRcdFx0XHRcdG9uY2xpY2s6ICgpID0+IHRoaXMuY2xvc2UoKSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KSxcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIi5zY3JvbGwub3ZlcmZsb3cteC1oaWRkZW4uZmxleC5jb2wuZmxleC1ncm93XCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0b25zY3JvbGw6IChlOiBFdmVudCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MRWxlbWVudFxuXHRcdFx0XHRcdFx0XHR0YXJnZXQuc3R5bGUuYm9yZGVyVG9wID0gYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYm9yZGVyfWBcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR0aGlzLmZvbGRlckxpc3QoKSxcblx0XHRcdFx0KSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBkZWZhdWx0Rm9jdXNPbkxvYWQoKSB7XG5cdFx0Y29uc3QgZG9tID0gYXNzZXJ0Tm90TnVsbCh0aGlzLl9kb21EaWFsb2cpXG5cdFx0bGV0IGlucHV0cyA9IEFycmF5LmZyb20oZG9tLnF1ZXJ5U2VsZWN0b3JBbGwoSU5QVVQpKSBhcyBBcnJheTxIVE1MRWxlbWVudD5cblxuXHRcdGlmIChpbnB1dHMubGVuZ3RoID4gMCkge1xuXHRcdFx0aW5wdXRzWzBdLmZvY3VzKClcblx0XHR9IGVsc2Uge1xuXHRcdFx0bGV0IGJ1dHRvbiA9IGRvbS5xdWVyeVNlbGVjdG9yKFwiYnV0dG9uXCIpXG5cblx0XHRcdGlmIChidXR0b24pIHtcblx0XHRcdFx0YnV0dG9uLmZvY3VzKClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRoaWRlQW5pbWF0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGxldCBiZ2NvbG9yID0gZ2V0RWxldmF0ZWRCYWNrZ3JvdW5kKClcblxuXHRcdGlmICh0aGlzLl9kb21EaWFsb2cpIHtcblx0XHRcdHJldHVybiBQcm9taXNlLmFsbChbXG5cdFx0XHRcdGFuaW1hdGlvbnMuYWRkKHRoaXMuX2RvbURpYWxvZy5jaGlsZHJlbiwgb3BhY2l0eSgxLCAwLCB0cnVlKSksXG5cdFx0XHRcdGFuaW1hdGlvbnMuYWRkKHRoaXMuX2RvbURpYWxvZywgYWxwaGEoQWxwaGFFbnVtLkJhY2tncm91bmRDb2xvciwgYmdjb2xvciwgMSwgMCksIHtcblx0XHRcdFx0XHRkZWxheTogRGVmYXVsdEFuaW1hdGlvblRpbWUgLyAyLFxuXHRcdFx0XHRcdGVhc2luZzogZWFzZS5saW5lYXIsXG5cdFx0XHRcdH0pLFxuXHRcdFx0XSkudGhlbihub09wKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcblx0XHR9XG5cdH1cblxuXHRzaG93KCk6IEVkaXRGb2xkZXJzRGlhbG9nIHtcblx0XHR0aGlzLmZvY3VzZWRCZWZvcmVTaG93biA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnRcblx0XHRtb2RhbC5kaXNwbGF5KHRoaXMpXG5cdFx0dGhpcy52aXNpYmxlID0gdHJ1ZVxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHRjbG9zZSgpOiB2b2lkIHtcblx0XHR0aGlzLnZpc2libGUgPSBmYWxzZVxuXHRcdG1vZGFsLnJlbW92ZSh0aGlzKVxuXHR9XG5cblx0LyoqXG5cdCAqIFNob3VsZCBiZSBjYWxsZWQgdG8gY2xvc2UgYSBkaWFsb2cuIE5vdGlmaWVzIHRoZSBjbG9zZUhhbmRsZXIgYWJvdXQgdGhlIGNsb3NlIGF0dGVtcHQuXG5cdCAqL1xuXHRvbkNsb3NlKCk6IHZvaWQge1xuXHRcdGlmICh0aGlzLl9jbG9zZUhhbmRsZXIpIHtcblx0XHRcdHRoaXMuX2Nsb3NlSGFuZGxlcigpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuY2xvc2UoKVxuXHRcdH1cblx0fVxuXG5cdHNob3J0Y3V0cygpOiBTaG9ydGN1dFtdIHtcblx0XHRyZXR1cm4gdGhpcy5fc2hvcnRjdXRzXG5cdH1cblxuXHRiYWNrZ3JvdW5kQ2xpY2soZTogTW91c2VFdmVudCkge31cblxuXHRwb3BTdGF0ZShlOiBFdmVudCk6IGJvb2xlYW4ge1xuXHRcdHRoaXMub25DbG9zZSgpXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHRjYWxsaW5nRWxlbWVudCgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLmZvY3VzZWRCZWZvcmVTaG93blxuXHR9XG5cblx0YWRkU2hvcnRjdXQoc2hvcnRjdXQ6IFNob3J0Y3V0KTogRWRpdEZvbGRlcnNEaWFsb2cge1xuXHRcdHRoaXMuX3Nob3J0Y3V0cy5wdXNoKHNob3J0Y3V0KVxuXG5cdFx0aWYgKHRoaXMudmlzaWJsZSkge1xuXHRcdFx0a2V5TWFuYWdlci5yZWdpc3Rlck1vZGFsU2hvcnRjdXRzKFtzaG9ydGN1dF0pXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdHN0YXRpYyBzaG93RWRpdChmb2xkZXJzOiAoKSA9PiBDaGlsZHJlbikge1xuXHRcdG5ldyBFZGl0Rm9sZGVyc0RpYWxvZyhmb2xkZXJzKS5zaG93KClcblx0fVxufVxuIiwiaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2dcIlxuaW1wb3J0IHsgVGV4dEZpZWxkLCBUZXh0RmllbGRBdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvVGV4dEZpZWxkXCJcbmltcG9ydCBtIGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB0eXBlIHsgTWFpbEJveCwgTWFpbEZvbGRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzXCJcbmltcG9ydCB7IGlzT2ZmbGluZUVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0Vycm9yVXRpbHNcIlxuaW1wb3J0IHsgTG9ja2VkRXJyb3IsIFByZWNvbmRpdGlvbkZhaWxlZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvclwiXG5pbXBvcnQgeyBNYWlsVmlld01vZGVsIH0gZnJvbSBcIi4vTWFpbFZpZXdNb2RlbFwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IENvbG9yUGlja2VyVmlldyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvY29sb3JQaWNrZXIvQ29sb3JQaWNrZXJWaWV3XCJcbmltcG9ydCB7IHNob3dOb3RBdmFpbGFibGVGb3JGcmVlRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL1N1YnNjcmlwdGlvbkRpYWxvZ3NcIlxuXG5jb25zdCBMSU1JVF9FWENFRURFRF9FUlJPUiA9IFwibGltaXRSZWFjaGVkXCJcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNob3dFZGl0TGFiZWxEaWFsb2cobWFpbGJveDogTWFpbEJveCB8IG51bGwsIG1haWxWaWV3TW9kZWw6IE1haWxWaWV3TW9kZWwsIGxhYmVsOiBNYWlsRm9sZGVyIHwgbnVsbCkge1xuXHRsZXQgbmFtZSA9IGxhYmVsID8gbGFiZWwubmFtZSA6IFwiXCJcblx0bGV0IGNvbG9yID0gbGFiZWwgJiYgbGFiZWwuY29sb3IgPyBsYWJlbC5jb2xvciA6IFwiXCJcblxuXHRhc3luYyBmdW5jdGlvbiBvbk9rQ2xpY2tlZChkaWFsb2c6IERpYWxvZykge1xuXHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0dHJ5IHtcblx0XHRcdGlmIChsYWJlbCkge1xuXHRcdFx0XHQvLyBlZGl0aW5nIGEgbGFiZWxcblx0XHRcdFx0YXdhaXQgbWFpbFZpZXdNb2RlbC5lZGl0TGFiZWwobGFiZWwsIHsgbmFtZSwgY29sb3IgfSlcblx0XHRcdH0gZWxzZSBpZiAobWFpbGJveCkge1xuXHRcdFx0XHQvLyBhZGRpbmcgYSBsYWJlbFxuXHRcdFx0XHRhd2FpdCBtYWlsVmlld01vZGVsLmNyZWF0ZUxhYmVsKG1haWxib3gsIHsgbmFtZSwgY29sb3IgfSlcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0aWYgKGVycm9yIGluc3RhbmNlb2YgUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IpIHtcblx0XHRcdFx0aWYgKGVycm9yLmRhdGEgPT09IExJTUlUX0VYQ0VFREVEX0VSUk9SKSB7XG5cdFx0XHRcdFx0c2hvd05vdEF2YWlsYWJsZUZvckZyZWVEaWFsb2coKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwidW5rbm93bkVycm9yX21zZ1wiKVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGlzT2ZmbGluZUVycm9yKGVycm9yKSB8fCAhKGVycm9yIGluc3RhbmNlb2YgTG9ja2VkRXJyb3IpKSB7XG5cdFx0XHRcdHRocm93IGVycm9yXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0RGlhbG9nLnNob3dBY3Rpb25EaWFsb2coe1xuXHRcdHRpdGxlOiBsYWJlbCA/IFwiZWRpdExhYmVsX2FjdGlvblwiIDogXCJhZGRMYWJlbF9hY3Rpb25cIixcblx0XHRhbGxvd0NhbmNlbDogdHJ1ZSxcblx0XHRva0FjdGlvbjogKGRpYWxvZzogRGlhbG9nKSA9PiB7XG5cdFx0XHRvbk9rQ2xpY2tlZChkaWFsb2cpXG5cdFx0fSxcblx0XHRjaGlsZDogKCkgPT5cblx0XHRcdG0oXCIuZmxleC5jb2wuZ2FwLXZwYWRcIiwgW1xuXHRcdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdGxhYmVsOiBcIm5hbWVfbGFiZWxcIixcblx0XHRcdFx0XHR2YWx1ZTogbmFtZSxcblx0XHRcdFx0XHRvbmlucHV0OiAobmV3TmFtZSkgPT4ge1xuXHRcdFx0XHRcdFx0bmFtZSA9IG5ld05hbWVcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9IHNhdGlzZmllcyBUZXh0RmllbGRBdHRycyksXG5cdFx0XHRcdG0oQ29sb3JQaWNrZXJWaWV3LCB7XG5cdFx0XHRcdFx0dmFsdWU6IGNvbG9yLFxuXHRcdFx0XHRcdG9uc2VsZWN0OiAobmV3Q29sb3I6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRcdFx0Y29sb3IgPSBuZXdDb2xvclxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pLFxuXHRcdFx0XSksXG5cdH0pXG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBWaWV3U2xpZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvbmF2L1ZpZXdTbGlkZXIuanNcIlxuaW1wb3J0IHsgQ29sdW1uVHlwZSwgVmlld0NvbHVtbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvVmlld0NvbHVtblwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IEZlYXR1cmVUeXBlLCBnZXRNYWlsRm9sZGVyVHlwZSwgS2V5cywgTWFpbFNldEtpbmQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgQXBwSGVhZGVyQXR0cnMsIEhlYWRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0hlYWRlci5qc1wiXG5pbXBvcnQgeyBNYWlsLCBNYWlsQm94LCBNYWlsRm9sZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgaXNFbXB0eSwgbm9PcCwgb2ZDbGFzcyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgTWFpbExpc3RWaWV3IH0gZnJvbSBcIi4vTWFpbExpc3RWaWV3XCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUsIGlzQXBwIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgdHlwZSB7IFNob3J0Y3V0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0tleU1hbmFnZXJcIlxuaW1wb3J0IHsga2V5TWFuYWdlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9LZXlNYW5hZ2VyXCJcbmltcG9ydCB7IGdldE1haWxTZWxlY3Rpb25NZXNzYWdlLCBNdWx0aUl0ZW1WaWV3ZXIgfSBmcm9tIFwiLi9NdWx0aUl0ZW1WaWV3ZXIuanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zXCJcbmltcG9ydCB7IHNob3dQcm9ncmVzc0RpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2dcIlxuaW1wb3J0IHR5cGUgeyBNYWlsYm94RGV0YWlsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9NYWlsYm94TW9kZWwuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvclwiXG5pbXBvcnQgeyBQZXJtaXNzaW9uRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUGVybWlzc2lvbkVycm9yXCJcbmltcG9ydCB7IHN0eWxlcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3N0eWxlc1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemVcIlxuaW1wb3J0IHsgYXJjaGl2ZU1haWxzLCBnZXRDb252ZXJzYXRpb25UaXRsZSwgZ2V0TW92ZU1haWxCb3VuZHMsIG1vdmVNYWlscywgbW92ZVRvSW5ib3gsIHByb21wdEFuZERlbGV0ZU1haWxzLCBzaG93TW92ZU1haWxzRHJvcGRvd24gfSBmcm9tIFwiLi9NYWlsR3VpVXRpbHNcIlxuaW1wb3J0IHsgZ2V0RWxlbWVudElkLCBpc1NhbWVJZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlsc1wiXG5pbXBvcnQgeyBpc05ld01haWxBY3Rpb25BdmFpbGFibGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9uYXYvTmF2RnVuY3Rpb25zXCJcbmltcG9ydCB7IENhbmNlbGxlZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL0NhbmNlbGxlZEVycm9yXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IHJlYWRMb2NhbEZpbGVzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9maWxlL0ZpbGVDb250cm9sbGVyLmpzXCJcbmltcG9ydCB7IE1vYmlsZU1haWxBY3Rpb25CYXIgfSBmcm9tIFwiLi9Nb2JpbGVNYWlsQWN0aW9uQmFyLmpzXCJcbmltcG9ydCB7IGRldmljZUNvbmZpZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9EZXZpY2VDb25maWcuanNcIlxuaW1wb3J0IHsgRHJhd2VyTWVudUF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvbmF2L0RyYXdlck1lbnUuanNcIlxuaW1wb3J0IHsgQmFzZVRvcExldmVsVmlldyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0Jhc2VUb3BMZXZlbFZpZXcuanNcIlxuaW1wb3J0IHsgc2hvd0VkaXRGb2xkZXJEaWFsb2cgfSBmcm9tIFwiLi9FZGl0Rm9sZGVyRGlhbG9nLmpzXCJcbmltcG9ydCB7IE1haWxGb2xkZXJzVmlldyB9IGZyb20gXCIuL01haWxGb2xkZXJzVmlldy5qc1wiXG5pbXBvcnQgeyBGb2xkZXJDb2x1bW5WaWV3IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvRm9sZGVyQ29sdW1uVmlldy5qc1wiXG5pbXBvcnQgeyBTaWRlYmFyU2VjdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL1NpZGViYXJTZWN0aW9uLmpzXCJcbmltcG9ydCB7IEVkaXRGb2xkZXJzRGlhbG9nIH0gZnJvbSBcIi4vRWRpdEZvbGRlcnNEaWFsb2cuanNcIlxuaW1wb3J0IHsgVG9wTGV2ZWxBdHRycywgVG9wTGV2ZWxWaWV3IH0gZnJvbSBcIi4uLy4uLy4uL1RvcExldmVsVmlldy5qc1wiXG5pbXBvcnQgeyBDb252ZXJzYXRpb25WaWV3TW9kZWwgfSBmcm9tIFwiLi9Db252ZXJzYXRpb25WaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgY29udmVyc2F0aW9uQ2FyZE1hcmdpbiwgQ29udmVyc2F0aW9uVmlld2VyIH0gZnJvbSBcIi4vQ29udmVyc2F0aW9uVmlld2VyLmpzXCJcbmltcG9ydCB7IEljb25CdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgQmFja2dyb3VuZENvbHVtbkxheW91dCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0JhY2tncm91bmRDb2x1bW5MYXlvdXQuanNcIlxuaW1wb3J0IHsgTWFpbFZpZXdlckFjdGlvbnMgfSBmcm9tIFwiLi9NYWlsVmlld2VyVG9vbGJhci5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lLmpzXCJcbmltcG9ydCB7IE1vYmlsZU1haWxNdWx0aXNlbGVjdGlvbkFjdGlvbkJhciB9IGZyb20gXCIuL01vYmlsZU1haWxNdWx0aXNlbGVjdGlvbkFjdGlvbkJhci5qc1wiXG5pbXBvcnQgeyBTZWxlY3RBbGxDaGVja2JveCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL1NlbGVjdEFsbENoZWNrYm94LmpzXCJcbmltcG9ydCB7IERlc2t0b3BMaXN0VG9vbGJhciwgRGVza3RvcFZpZXdlclRvb2xiYXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9EZXNrdG9wVG9vbGJhcnMuanNcIlxuaW1wb3J0IHsgTW9iaWxlSGVhZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvTW9iaWxlSGVhZGVyLmpzXCJcbmltcG9ydCB7IExhenlTZWFyY2hCYXIgfSBmcm9tIFwiLi4vLi4vTGF6eVNlYXJjaEJhci5qc1wiXG5pbXBvcnQgeyBNdWx0aXNlbGVjdE1vYmlsZUhlYWRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL011bHRpc2VsZWN0TW9iaWxlSGVhZGVyLmpzXCJcbmltcG9ydCB7IE1haWxWaWV3TW9kZWwgfSBmcm9tIFwiLi9NYWlsVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IHNlbGVjdGlvbkF0dHJzRm9yTGlzdCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MaXN0TW9kZWwuanNcIlxuaW1wb3J0IHsgTGlzdExvYWRpbmdTdGF0ZSwgTXVsdGlzZWxlY3RNb2RlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9MaXN0LmpzXCJcbmltcG9ydCB7IEVudGVyTXVsdGlzZWxlY3RJY29uQnV0dG9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvRW50ZXJNdWx0aXNlbGVjdEljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgTWFpbEZpbHRlckJ1dHRvbiB9IGZyb20gXCIuL01haWxGaWx0ZXJCdXR0b24uanNcIlxuaW1wb3J0IHsgbGlzdFNlbGVjdGlvbktleWJvYXJkU2hvcnRjdXRzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9MaXN0VXRpbHMuanNcIlxuaW1wb3J0IHsgZ2V0TWFpbGJveE5hbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L1NoYXJlZE1haWxVdGlscy5qc1wiXG5pbXBvcnQgeyBCb3R0b21OYXYgfSBmcm9tIFwiLi4vLi4vZ3VpL0JvdHRvbU5hdi5qc1wiXG5pbXBvcnQgeyBtYWlsTG9jYXRvciB9IGZyb20gXCIuLi8uLi9tYWlsTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBzaG93U25hY2tCYXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1NuYWNrQmFyLmpzXCJcbmltcG9ydCB7IGdldEZvbGRlck5hbWUgfSBmcm9tIFwiLi4vbW9kZWwvTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IGNhbkRvRHJhZ0FuZERyb3BFeHBvcnQgfSBmcm9tIFwiLi9NYWlsVmlld2VyVXRpbHMuanNcIlxuaW1wb3J0IHsgaXNTcGFtT3JUcmFzaEZvbGRlciB9IGZyb20gXCIuLi9tb2RlbC9NYWlsQ2hlY2tzLmpzXCJcbmltcG9ydCB7IHNob3dFZGl0TGFiZWxEaWFsb2cgfSBmcm9tIFwiLi9FZGl0TGFiZWxEaWFsb2dcIlxuaW1wb3J0IHsgU2lkZWJhclNlY3Rpb25Sb3cgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1NpZGViYXJTZWN0aW9uUm93XCJcbmltcG9ydCB7IGF0dGFjaERyb3Bkb3duIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wZG93blwiXG5pbXBvcnQgeyBCdXR0b25TaXplIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b25TaXplXCJcbmltcG9ydCB7IFJvd0J1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvYnV0dG9ucy9Sb3dCdXR0b25cIlxuaW1wb3J0IHsgZ2V0TGFiZWxDb2xvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTGFiZWwuanNcIlxuaW1wb3J0IHsgTUFJTF9QUkVGSVggfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvUm91dGVDaGFuZ2VcIlxuaW1wb3J0IHsgRHJvcFR5cGUsIEZpbGVEcm9wRGF0YSwgTWFpbERyb3BEYXRhIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9HdWlVdGlsc1wiXG5pbXBvcnQgeyBNYWlsSW1wb3J0ZXIgfSBmcm9tIFwiLi4vaW1wb3J0L01haWxJbXBvcnRlci5qc1wiXG5pbXBvcnQgeyBmaWxlTGlzdFRvQXJyYXkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRmlsZVV0aWxzLmpzXCJcbmltcG9ydCB7IExhYmVsc1BvcHVwIH0gZnJvbSBcIi4vTGFiZWxzUG9wdXBcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcblxuLyoqIFN0YXRlIHBlcnNpc3RlZCBiZXR3ZWVuIHJlLWNyZWF0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWFpbFZpZXdDYWNoZSB7XG5cdC8qKiBUaGUgcHJlZmVyZW5jZSBmb3IgaWYgY29udmVyc2F0aW9uIHZpZXcgd2FzIHVzZWQsIHNvIHdlIGNhbiByZXNldCBpZiBpdCB3YXMgY2hhbmdlZCAqL1xuXHRjb252ZXJzYXRpb25WaWV3UHJlZmVyZW5jZTogYm9vbGVhbiB8IG51bGxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNYWlsVmlld0F0dHJzIGV4dGVuZHMgVG9wTGV2ZWxBdHRycyB7XG5cdGRyYXdlckF0dHJzOiBEcmF3ZXJNZW51QXR0cnNcblx0Y2FjaGU6IE1haWxWaWV3Q2FjaGVcblx0aGVhZGVyOiBBcHBIZWFkZXJBdHRyc1xuXHRtYWlsVmlld01vZGVsOiBNYWlsVmlld01vZGVsXG59XG5cbi8qKlxuICogVG9wLWxldmVsIHZpZXcgZm9yIGRpc3BsYXlpbmcgbWFpbGJveGVzLlxuICovXG5leHBvcnQgY2xhc3MgTWFpbFZpZXcgZXh0ZW5kcyBCYXNlVG9wTGV2ZWxWaWV3IGltcGxlbWVudHMgVG9wTGV2ZWxWaWV3PE1haWxWaWV3QXR0cnM+IHtcblx0cHJpdmF0ZSByZWFkb25seSBsaXN0Q29sdW1uOiBWaWV3Q29sdW1uXG5cdHByaXZhdGUgcmVhZG9ubHkgZm9sZGVyQ29sdW1uOiBWaWV3Q29sdW1uXG5cdHByaXZhdGUgcmVhZG9ubHkgbWFpbENvbHVtbjogVmlld0NvbHVtblxuXHRwcml2YXRlIHJlYWRvbmx5IHZpZXdTbGlkZXI6IFZpZXdTbGlkZXJcblx0Y2FjaGU6IE1haWxWaWV3Q2FjaGVcblx0cmVhZG9ubHkgb25jcmVhdGU6IFRvcExldmVsVmlld1tcIm9uY3JlYXRlXCJdXG5cdHJlYWRvbmx5IG9ucmVtb3ZlOiBUb3BMZXZlbFZpZXdbXCJvbnJlbW92ZVwiXVxuXG5cdHByaXZhdGUgY291bnRlcnNTdHJlYW06IFN0cmVhbTx1bmtub3duPiB8IG51bGwgPSBudWxsXG5cblx0cHJpdmF0ZSByZWFkb25seSBleHBhbmRlZFN0YXRlOiBTZXQ8SWQ+XG5cdHByaXZhdGUgcmVhZG9ubHkgbWFpbFZpZXdNb2RlbDogTWFpbFZpZXdNb2RlbFxuXG5cdGdldCBjb252ZXJzYXRpb25WaWV3TW9kZWwoKTogQ29udmVyc2F0aW9uVmlld01vZGVsIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMubWFpbFZpZXdNb2RlbC5nZXRDb252ZXJzYXRpb25WaWV3TW9kZWwoKVxuXHR9XG5cblx0Y29uc3RydWN0b3Iodm5vZGU6IFZub2RlPE1haWxWaWV3QXR0cnM+KSB7XG5cdFx0c3VwZXIoKVxuXHRcdHRoaXMuZXhwYW5kZWRTdGF0ZSA9IG5ldyBTZXQoZGV2aWNlQ29uZmlnLmdldEV4cGFuZGVkRm9sZGVycyhsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJJZCkpXG5cdFx0dGhpcy5jYWNoZSA9IHZub2RlLmF0dHJzLmNhY2hlXG5cdFx0dGhpcy5mb2xkZXJDb2x1bW4gPSB0aGlzLmNyZWF0ZUZvbGRlckNvbHVtbihudWxsLCB2bm9kZS5hdHRycy5kcmF3ZXJBdHRycylcblx0XHR0aGlzLm1haWxWaWV3TW9kZWwgPSB2bm9kZS5hdHRycy5tYWlsVmlld01vZGVsXG5cblx0XHR0aGlzLmxpc3RDb2x1bW4gPSBuZXcgVmlld0NvbHVtbihcblx0XHRcdHtcblx0XHRcdFx0dmlldzogKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGZvbGRlciA9IHRoaXMubWFpbFZpZXdNb2RlbC5nZXRGb2xkZXIoKVxuXHRcdFx0XHRcdHJldHVybiBtKEJhY2tncm91bmRDb2x1bW5MYXlvdXQsIHtcblx0XHRcdFx0XHRcdGJhY2tncm91bmRDb2xvcjogdGhlbWUubmF2aWdhdGlvbl9iZyxcblx0XHRcdFx0XHRcdGRlc2t0b3BUb29sYmFyOiAoKSA9PiBtKERlc2t0b3BMaXN0VG9vbGJhciwgbShTZWxlY3RBbGxDaGVja2JveCwgc2VsZWN0aW9uQXR0cnNGb3JMaXN0KHRoaXMubWFpbFZpZXdNb2RlbCkpLCB0aGlzLnJlbmRlckZpbHRlckJ1dHRvbigpKSxcblx0XHRcdFx0XHRcdGNvbHVtbkxheW91dDogZm9sZGVyXG5cdFx0XHRcdFx0XHRcdD8gbShcblx0XHRcdFx0XHRcdFx0XHRcdFwiXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bWFyZ2luQm90dG9tOiBweChjb252ZXJzYXRpb25DYXJkTWFyZ2luKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRtKE1haWxMaXN0Vmlldywge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRrZXk6IGdldEVsZW1lbnRJZChmb2xkZXIpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRtYWlsVmlld01vZGVsOiB0aGlzLm1haWxWaWV3TW9kZWwsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9uU2luZ2xlU2VsZWN0aW9uOiAobWFpbCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubWFpbFZpZXdNb2RlbC5vblNpbmdsZVNlbGVjdGlvbihtYWlsKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmICghdGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbD8uaXNJbk11bHRpc2VsZWN0KCkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMudmlld1NsaWRlci5mb2N1cyh0aGlzLm1haWxDb2x1bW4pXG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIE1ha2Ugc3VyZSB0aGF0IHdlIG1hcmsgbWFpbCBhcyByZWFkIGlmIHlvdSBzZWxlY3QgdGhlIG1haWwgYWdhaW4sIGV2ZW4gaWYgaXQgd2FzIHNlbGVjdGVkIGJlZm9yZS5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIERvIGl0IGluIHRoZSBuZXh0IGV2ZW4gbG9vcCB0byBub3QgcmVseSBvbiB3aGF0IGlzIGNhbGxlZCBmaXJzdCwgbGlzdE1vZGVsIG9yIHVzLiBMaXN0TW9kZWwgY2hhbmdlcyBhcmVcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIHN5bmMgc28gdGhpcyBzaG91bGQgYmUgZW5vdWdoLlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0UHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IGNvbnZlcnNhdGlvblZpZXdNb2RlbCA9IHRoaXMubWFpbFZpZXdNb2RlbC5nZXRDb252ZXJzYXRpb25WaWV3TW9kZWwoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoY29udmVyc2F0aW9uVmlld01vZGVsICYmIGlzU2FtZUlkKG1haWwuX2lkLCBjb252ZXJzYXRpb25WaWV3TW9kZWwucHJpbWFyeU1haWwuX2lkKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnZlcnNhdGlvblZpZXdNb2RlbD8ucHJpbWFyeVZpZXdNb2RlbCgpLnNldFVucmVhZChmYWxzZSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9uU2luZ2xlSW5jbHVzaXZlU2VsZWN0aW9uOiAoLi4uYXJncykgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubWFpbFZpZXdNb2RlbD8ub25TaW5nbGVJbmNsdXNpdmVTZWxlY3Rpb24oLi4uYXJncylcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0b25SYW5nZVNlbGVjdGlvblRvd2FyZHM6ICguLi5hcmdzKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5tYWlsVmlld01vZGVsLm9uUmFuZ2VTZWxlY3Rpb25Ub3dhcmRzKC4uLmFyZ3MpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9uU2luZ2xlRXhjbHVzaXZlU2VsZWN0aW9uOiAoLi4uYXJncykgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubWFpbFZpZXdNb2RlbC5vblNpbmdsZUV4Y2x1c2l2ZVNlbGVjdGlvbiguLi5hcmdzKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRvbkNsZWFyRm9sZGVyOiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgZm9sZGVyID0gdGhpcy5tYWlsVmlld01vZGVsLmdldEZvbGRlcigpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKGZvbGRlciA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oXCJDYW5ub3QgZGVsZXRlIGZvbGRlciwgbm8gZm9sZGVyIGlzIHNlbGVjdGVkXCIpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgY29uZmlybWVkID0gYXdhaXQgRGlhbG9nLmNvbmZpcm0oXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsYW5nLmdldFRyYW5zbGF0aW9uKFwiY29uZmlybURlbGV0ZUZpbmFsbHlTeXN0ZW1Gb2xkZXJfbXNnXCIsIHsgXCJ7MX1cIjogZ2V0Rm9sZGVyTmFtZShmb2xkZXIpIH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoY29uZmlybWVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzaG93UHJvZ3Jlc3NEaWFsb2coXCJwcm9ncmVzc0RlbGV0aW5nX21zZ1wiLCB0aGlzLm1haWxWaWV3TW9kZWwuZmluYWxseURlbGV0ZUFsbE1haWxzSW5TZWxlY3RlZEZvbGRlcihmb2xkZXIpKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHQgIClcblx0XHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRcdFx0bW9iaWxlSGVhZGVyOiAoKSA9PlxuXHRcdFx0XHRcdFx0XHR0aGlzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsPy5pc0luTXVsdGlzZWxlY3QoKVxuXHRcdFx0XHRcdFx0XHRcdD8gbShNdWx0aXNlbGVjdE1vYmlsZUhlYWRlciwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQuLi5zZWxlY3Rpb25BdHRyc0Zvckxpc3QodGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG1lc3NhZ2U6IGdldE1haWxTZWxlY3Rpb25NZXNzYWdlKHRoaXMubWFpbFZpZXdNb2RlbC5saXN0TW9kZWwuZ2V0U2VsZWN0ZWRBc0FycmF5KCkpLFxuXHRcdFx0XHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHRcdFx0XHQ6IG0oTW9iaWxlSGVhZGVyLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC4uLnZub2RlLmF0dHJzLmhlYWRlcixcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGl0bGU6IHRoaXMubGlzdENvbHVtbi5nZXRUaXRsZSgpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjb2x1bW5UeXBlOiBcImZpcnN0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbnM6IFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnJlbmRlckZpbHRlckJ1dHRvbigpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG0oRW50ZXJNdWx0aXNlbGVjdEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNsaWNrQWN0aW9uOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubWFpbFZpZXdNb2RlbC5saXN0TW9kZWw/LmVudGVyTXVsdGlzZWxlY3QoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0cHJpbWFyeUFjdGlvbjogKCkgPT4gdGhpcy5yZW5kZXJIZWFkZXJSaWdodFZpZXcoKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0YmFja0FjdGlvbjogKCkgPT4gdGhpcy52aWV3U2xpZGVyLmZvY3VzUHJldmlvdXNDb2x1bW4oKSxcblx0XHRcdFx0XHRcdFx0XHQgIH0pLFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0Q29sdW1uVHlwZS5CYWNrZ3JvdW5kLFxuXHRcdFx0e1xuXHRcdFx0XHRtaW5XaWR0aDogc2l6ZS5zZWNvbmRfY29sX21pbl93aWR0aCxcblx0XHRcdFx0bWF4V2lkdGg6IHNpemUuc2Vjb25kX2NvbF9tYXhfd2lkdGgsXG5cdFx0XHRcdGhlYWRlckNlbnRlcjogKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGZvbGRlciA9IHRoaXMubWFpbFZpZXdNb2RlbC5nZXRGb2xkZXIoKVxuXHRcdFx0XHRcdHJldHVybiBmb2xkZXIgPyBsYW5nLm1ha2VUcmFuc2xhdGlvbihcImZvbGRlcl9uYW1lXCIsIGdldEZvbGRlck5hbWUoZm9sZGVyKSkgOiBcImVtcHR5U3RyaW5nX21zZ1wiXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdClcblxuXHRcdHRoaXMubWFpbENvbHVtbiA9IG5ldyBWaWV3Q29sdW1uKFxuXHRcdFx0e1xuXHRcdFx0XHR2aWV3OiAoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3Qgdmlld01vZGVsID0gdGhpcy5jb252ZXJzYXRpb25WaWV3TW9kZWxcblx0XHRcdFx0XHRpZiAodmlld01vZGVsKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJTaW5nbGVNYWlsVmlld2VyKHZub2RlLmF0dHJzLmhlYWRlciwgdmlld01vZGVsKVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJNdWx0aU1haWxWaWV3ZXIodm5vZGUuYXR0cnMuaGVhZGVyKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRDb2x1bW5UeXBlLkJhY2tncm91bmQsXG5cdFx0XHR7XG5cdFx0XHRcdG1pbldpZHRoOiBzaXplLnRoaXJkX2NvbF9taW5fd2lkdGgsXG5cdFx0XHRcdG1heFdpZHRoOiBzaXplLnRoaXJkX2NvbF9tYXhfd2lkdGgsXG5cdFx0XHRcdGFyaWFMYWJlbDogKCkgPT4gbGFuZy5nZXQoXCJlbWFpbF9sYWJlbFwiKSxcblx0XHRcdH0sXG5cdFx0KVxuXHRcdHRoaXMudmlld1NsaWRlciA9IG5ldyBWaWV3U2xpZGVyKFt0aGlzLmZvbGRlckNvbHVtbiwgdGhpcy5saXN0Q29sdW1uLCB0aGlzLm1haWxDb2x1bW5dKVxuXHRcdHRoaXMudmlld1NsaWRlci5mb2N1c2VkQ29sdW1uID0gdGhpcy5saXN0Q29sdW1uXG5cblx0XHRjb25zdCBzaG9ydGN1dHMgPSB0aGlzLmdldFNob3J0Y3V0cygpXG5cdFx0dm5vZGUuYXR0cnMubWFpbFZpZXdNb2RlbC5pbml0KClcblxuXHRcdHRoaXMub25jcmVhdGUgPSAodm5vZGUpID0+IHtcblx0XHRcdHRoaXMuY291bnRlcnNTdHJlYW0gPSBtYWlsTG9jYXRvci5tYWlsTW9kZWwubWFpbGJveENvdW50ZXJzLm1hcChtLnJlZHJhdylcblx0XHRcdGtleU1hbmFnZXIucmVnaXN0ZXJTaG9ydGN1dHMoc2hvcnRjdXRzKVxuXHRcdFx0dGhpcy5jYWNoZS5jb252ZXJzYXRpb25WaWV3UHJlZmVyZW5jZSA9IGRldmljZUNvbmZpZy5nZXRDb252ZXJzYXRpb25WaWV3U2hvd09ubHlTZWxlY3RlZE1haWwoKVxuXHRcdH1cblxuXHRcdHRoaXMub25yZW1vdmUgPSAoKSA9PiB7XG5cdFx0XHQvLyBjYW5jZWwgdGhlIGxvYWRpbmcgaWYgd2UgYXJlIGRlc3Ryb3llZFxuXHRcdFx0dGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbD8uY2FuY2VsTG9hZEFsbCgpXG5cblx0XHRcdHRoaXMuY291bnRlcnNTdHJlYW0/LmVuZCh0cnVlKVxuXHRcdFx0dGhpcy5jb3VudGVyc1N0cmVhbSA9IG51bGxcblxuXHRcdFx0a2V5TWFuYWdlci51bnJlZ2lzdGVyU2hvcnRjdXRzKHNob3J0Y3V0cylcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckZpbHRlckJ1dHRvbigpIHtcblx0XHRyZXR1cm4gbShNYWlsRmlsdGVyQnV0dG9uLCB7XG5cdFx0XHRmaWx0ZXI6IHRoaXMubWFpbFZpZXdNb2RlbC5maWx0ZXJUeXBlLFxuXHRcdFx0c2V0RmlsdGVyOiAoZmlsdGVyKSA9PiB0aGlzLm1haWxWaWV3TW9kZWwuc2V0RmlsdGVyKGZpbHRlciksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgbWFpbFZpZXdlclNpbmdsZUFjdGlvbnModmlld01vZGVsOiBDb252ZXJzYXRpb25WaWV3TW9kZWwpIHtcblx0XHRyZXR1cm4gbShNYWlsVmlld2VyQWN0aW9ucywge1xuXHRcdFx0bWFpbGJveE1vZGVsOiB2aWV3TW9kZWwucHJpbWFyeVZpZXdNb2RlbCgpLm1haWxib3hNb2RlbCxcblx0XHRcdG1haWxNb2RlbDogdmlld01vZGVsLnByaW1hcnlWaWV3TW9kZWwoKS5tYWlsTW9kZWwsXG5cdFx0XHRtYWlsVmlld2VyVmlld01vZGVsOiB2aWV3TW9kZWwucHJpbWFyeVZpZXdNb2RlbCgpLFxuXHRcdFx0bWFpbHM6IFt2aWV3TW9kZWwucHJpbWFyeU1haWxdLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclNpbmdsZU1haWxWaWV3ZXIoaGVhZGVyOiBBcHBIZWFkZXJBdHRycywgdmlld01vZGVsOiBDb252ZXJzYXRpb25WaWV3TW9kZWwpIHtcblx0XHRyZXR1cm4gbShCYWNrZ3JvdW5kQ29sdW1uTGF5b3V0LCB7XG5cdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lLm5hdmlnYXRpb25fYmcsXG5cdFx0XHRkZXNrdG9wVG9vbGJhcjogKCkgPT4gbShEZXNrdG9wVmlld2VyVG9vbGJhciwgdGhpcy5tYWlsVmlld2VyU2luZ2xlQWN0aW9ucyh2aWV3TW9kZWwpKSxcblx0XHRcdG1vYmlsZUhlYWRlcjogKCkgPT5cblx0XHRcdFx0bShNb2JpbGVIZWFkZXIsIHtcblx0XHRcdFx0XHQuLi5oZWFkZXIsXG5cdFx0XHRcdFx0YmFja0FjdGlvbjogKCkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy52aWV3U2xpZGVyLmZvY3VzUHJldmlvdXNDb2x1bW4oKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0Y29sdW1uVHlwZTogXCJvdGhlclwiLFxuXHRcdFx0XHRcdGFjdGlvbnM6IG51bGwsXG5cdFx0XHRcdFx0bXVsdGljb2x1bW5BY3Rpb25zOiAoKSA9PiB0aGlzLm1haWxWaWV3ZXJTaW5nbGVBY3Rpb25zKHZpZXdNb2RlbCksXG5cdFx0XHRcdFx0cHJpbWFyeUFjdGlvbjogKCkgPT4gdGhpcy5yZW5kZXJIZWFkZXJSaWdodFZpZXcoKSxcblx0XHRcdFx0XHR0aXRsZTogZ2V0Q29udmVyc2F0aW9uVGl0bGUodmlld01vZGVsKSxcblx0XHRcdFx0fSksXG5cdFx0XHRjb2x1bW5MYXlvdXQ6IG0oQ29udmVyc2F0aW9uVmlld2VyLCB7XG5cdFx0XHRcdC8vIFJlLWNyZWF0ZSB0aGUgd2hvbGUgdmlld2VyIGFuZCBpdHMgdm5vZGUgdHJlZSBpZiBlbWFpbCBoYXMgY2hhbmdlZFxuXHRcdFx0XHRrZXk6IGdldEVsZW1lbnRJZCh2aWV3TW9kZWwucHJpbWFyeU1haWwpLFxuXHRcdFx0XHR2aWV3TW9kZWw6IHZpZXdNb2RlbCxcblx0XHRcdFx0Ly8gdGhpcyBhc3N1bWVzIHRoYXQgdGhlIHZpZXdTbGlkZXIgZm9jdXMgYW5pbWF0aW9uIGlzIGFscmVhZHkgc3RhcnRlZFxuXHRcdFx0XHRkZWxheUJvZHlSZW5kZXJpbmc6IHRoaXMudmlld1NsaWRlci53YWl0Rm9yQW5pbWF0aW9uKCksXG5cdFx0XHR9KSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBtYWlsVmlld2VyTXVsdGlBY3Rpb25zKCkge1xuXHRcdHJldHVybiBtKE1haWxWaWV3ZXJBY3Rpb25zLCB7XG5cdFx0XHRtYWlsYm94TW9kZWw6IGxvY2F0b3IubWFpbGJveE1vZGVsLFxuXHRcdFx0bWFpbE1vZGVsOiBtYWlsTG9jYXRvci5tYWlsTW9kZWwsXG5cdFx0XHRtYWlsczogdGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbD8uZ2V0U2VsZWN0ZWRBc0FycmF5KCkgPz8gW10sXG5cdFx0XHRzZWxlY3ROb25lOiAoKSA9PiB0aGlzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsPy5zZWxlY3ROb25lKCksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTXVsdGlNYWlsVmlld2VyKGhlYWRlcjogQXBwSGVhZGVyQXR0cnMpIHtcblx0XHRyZXR1cm4gbShCYWNrZ3JvdW5kQ29sdW1uTGF5b3V0LCB7XG5cdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lLm5hdmlnYXRpb25fYmcsXG5cdFx0XHRkZXNrdG9wVG9vbGJhcjogKCkgPT4gbShEZXNrdG9wVmlld2VyVG9vbGJhciwgdGhpcy5tYWlsVmlld2VyTXVsdGlBY3Rpb25zKCkpLFxuXHRcdFx0bW9iaWxlSGVhZGVyOiAoKSA9PlxuXHRcdFx0XHRtKE1vYmlsZUhlYWRlciwge1xuXHRcdFx0XHRcdGFjdGlvbnM6IHRoaXMubWFpbFZpZXdlck11bHRpQWN0aW9ucygpLFxuXHRcdFx0XHRcdHByaW1hcnlBY3Rpb246ICgpID0+IHRoaXMucmVuZGVySGVhZGVyUmlnaHRWaWV3KCksXG5cdFx0XHRcdFx0YmFja0FjdGlvbjogKCkgPT4gdGhpcy52aWV3U2xpZGVyLmZvY3VzUHJldmlvdXNDb2x1bW4oKSxcblx0XHRcdFx0XHQuLi5oZWFkZXIsXG5cdFx0XHRcdFx0Y29sdW1uVHlwZTogXCJvdGhlclwiLFxuXHRcdFx0XHR9KSxcblx0XHRcdGNvbHVtbkxheW91dDogbShNdWx0aUl0ZW1WaWV3ZXIsIHtcblx0XHRcdFx0c2VsZWN0ZWRFbnRpdGllczogdGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbD8uZ2V0U2VsZWN0ZWRBc0FycmF5KCkgPz8gW10sXG5cdFx0XHRcdHNlbGVjdE5vbmU6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsPy5zZWxlY3ROb25lKClcblx0XHRcdFx0fSxcblx0XHRcdFx0bG9hZEFsbDogKCkgPT4gdGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbD8ubG9hZEFsbCgpLFxuXHRcdFx0XHRzdG9wTG9hZEFsbDogKCkgPT4gdGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbD8uY2FuY2VsTG9hZEFsbCgpLFxuXHRcdFx0XHRsb2FkaW5nQWxsOiB0aGlzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsPy5pc0xvYWRpbmdBbGwoKVxuXHRcdFx0XHRcdD8gXCJsb2FkaW5nXCJcblx0XHRcdFx0XHQ6IHRoaXMubWFpbFZpZXdNb2RlbC5saXN0TW9kZWw/LmxvYWRpbmdTdGF0dXMgPT09IExpc3RMb2FkaW5nU3RhdGUuRG9uZVxuXHRcdFx0XHRcdD8gXCJsb2FkZWRcIlxuXHRcdFx0XHRcdDogXCJjYW5fbG9hZFwiLFxuXHRcdFx0XHRnZXRTZWxlY3Rpb25NZXNzYWdlOiAoc2VsZWN0ZWQ6IFJlYWRvbmx5QXJyYXk8TWFpbD4pID0+IGdldE1haWxTZWxlY3Rpb25NZXNzYWdlKHNlbGVjdGVkKSxcblx0XHRcdH0pLFxuXHRcdH0pXG5cdH1cblxuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8TWFpbFZpZXdBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIiNtYWlsLm1haW4tdmlld1wiLFxuXHRcdFx0e1xuXHRcdFx0XHRvbmRyYWdvdmVyOiAoZXY6IERyYWdFdmVudCkgPT4ge1xuXHRcdFx0XHRcdC8vIGRvIG5vdCBjaGVjayB0aGUgZGF0YSB0cmFuc2ZlciBoZXJlIGJlY2F1c2UgaXQgaXMgbm90IGFsd2F5cyBmaWxsZWQsIGUuZy4gaW4gU2FmYXJpXG5cdFx0XHRcdFx0ZXYuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uZHJvcDogKGV2OiBEcmFnRXZlbnQpID0+IHtcblx0XHRcdFx0XHRpZiAoaXNOZXdNYWlsQWN0aW9uQXZhaWxhYmxlKCkgJiYgZXYuZGF0YVRyYW5zZmVyPy5maWxlcyAmJiBldi5kYXRhVHJhbnNmZXIuZmlsZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdFx0dGhpcy5oYW5kbGVGaWxlRHJvcCh7XG5cdFx0XHRcdFx0XHRcdGRyb3BUeXBlOiBEcm9wVHlwZS5FeHRlcm5hbEZpbGUsXG5cdFx0XHRcdFx0XHRcdGZpbGVzOiBmaWxlTGlzdFRvQXJyYXkoZXYuZGF0YVRyYW5zZmVyLmZpbGVzKSxcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gcHJldmVudCBpbiBhbnkgY2FzZSBiZWNhdXNlIGZpcmVmb3ggdHJpZXMgdG8gb3BlblxuXHRcdFx0XHRcdC8vIGRhdGFUcmFuc2ZlciBhcyBhIFVSTCBvdGhlcndpc2UuXG5cdFx0XHRcdFx0ZXYuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0bSh0aGlzLnZpZXdTbGlkZXIsIHtcblx0XHRcdFx0aGVhZGVyOiBtKEhlYWRlciwge1xuXHRcdFx0XHRcdHJpZ2h0VmlldzogdGhpcy5yZW5kZXJIZWFkZXJSaWdodFZpZXcoKSxcblx0XHRcdFx0XHRzZWFyY2hCYXI6ICgpID0+XG5cdFx0XHRcdFx0XHQvLyBub3Qgc2hvd2luZyBzZWFyY2ggZm9yIGV4dGVybmFsIHVzZXJzXG5cdFx0XHRcdFx0XHRsb2NhdG9yLmxvZ2lucy5pc0ludGVybmFsVXNlckxvZ2dlZEluKClcblx0XHRcdFx0XHRcdFx0PyBtKExhenlTZWFyY2hCYXIsIHtcblx0XHRcdFx0XHRcdFx0XHRcdHBsYWNlaG9sZGVyOiBsYW5nLmdldChcInNlYXJjaEVtYWlsc19wbGFjZWhvbGRlclwiKSxcblx0XHRcdFx0XHRcdFx0XHRcdGRpc2FibGVkOiAhbG9jYXRvci5sb2dpbnMuaXNGdWxseUxvZ2dlZEluKCksXG5cdFx0XHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRcdC4uLmF0dHJzLmhlYWRlcixcblx0XHRcdFx0fSksXG5cdFx0XHRcdGJvdHRvbU5hdjpcblx0XHRcdFx0XHRzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSAmJiB0aGlzLnZpZXdTbGlkZXIuZm9jdXNlZENvbHVtbiA9PT0gdGhpcy5tYWlsQ29sdW1uICYmIHRoaXMuY29udmVyc2F0aW9uVmlld01vZGVsXG5cdFx0XHRcdFx0XHQ/IG0oTW9iaWxlTWFpbEFjdGlvbkJhciwgeyB2aWV3TW9kZWw6IHRoaXMuY29udmVyc2F0aW9uVmlld01vZGVsLnByaW1hcnlWaWV3TW9kZWwoKSB9KVxuXHRcdFx0XHRcdFx0OiBzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSAmJiB0aGlzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsPy5pc0luTXVsdGlzZWxlY3QoKVxuXHRcdFx0XHRcdFx0PyBtKE1vYmlsZU1haWxNdWx0aXNlbGVjdGlvbkFjdGlvbkJhciwge1xuXHRcdFx0XHRcdFx0XHRcdG1haWxzOiB0aGlzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsLmdldFNlbGVjdGVkQXNBcnJheSgpLFxuXHRcdFx0XHRcdFx0XHRcdHNlbGVjdE5vbmU6ICgpID0+IHRoaXMubWFpbFZpZXdNb2RlbC5saXN0TW9kZWw/LnNlbGVjdE5vbmUoKSxcblx0XHRcdFx0XHRcdFx0XHRtYWlsTW9kZWw6IG1haWxMb2NhdG9yLm1haWxNb2RlbCxcblx0XHRcdFx0XHRcdFx0XHRtYWlsYm94TW9kZWw6IGxvY2F0b3IubWFpbGJveE1vZGVsLFxuXHRcdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdFx0OiBtKEJvdHRvbU5hdiksXG5cdFx0XHR9KSxcblx0XHQpXG5cdH1cblxuXHRnZXRWaWV3U2xpZGVyKCk6IFZpZXdTbGlkZXIgfCBudWxsIHtcblx0XHRyZXR1cm4gdGhpcy52aWV3U2xpZGVyXG5cdH1cblxuXHRoYW5kbGVCYWNrQnV0dG9uKCk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IGxpc3RNb2RlbCA9IHRoaXMubWFpbFZpZXdNb2RlbC5saXN0TW9kZWxcblx0XHRpZiAobGlzdE1vZGVsICYmIGxpc3RNb2RlbC5pc0luTXVsdGlzZWxlY3QoKSkge1xuXHRcdFx0bGlzdE1vZGVsLnNlbGVjdE5vbmUoKVxuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9IGVsc2UgaWYgKHRoaXMudmlld1NsaWRlci5pc0ZpcnN0QmFja2dyb3VuZENvbHVtbkZvY3VzZWQoKSkge1xuXHRcdFx0Y29uc3QgZm9sZGVyID0gdGhpcy5tYWlsVmlld01vZGVsLmdldEZvbGRlcigpXG5cdFx0XHRpZiAoZm9sZGVyID09IG51bGwgfHwgZ2V0TWFpbEZvbGRlclR5cGUoZm9sZGVyKSAhPT0gTWFpbFNldEtpbmQuSU5CT1gpIHtcblx0XHRcdFx0dGhpcy5tYWlsVmlld01vZGVsLnN3aXRjaFRvRm9sZGVyKE1haWxTZXRLaW5kLklOQk9YKVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVySGVhZGVyUmlnaHRWaWV3KCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gaXNOZXdNYWlsQWN0aW9uQXZhaWxhYmxlKClcblx0XHRcdD8gW1xuXHRcdFx0XHRcdG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0dGl0bGU6IFwibmV3TWFpbF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLnNob3dOZXdNYWlsRGlhbG9nKCkuY2F0Y2gob2ZDbGFzcyhQZXJtaXNzaW9uRXJyb3IsIG5vT3ApKSxcblx0XHRcdFx0XHRcdGljb246IEljb25zLlBlbmNpbFNxdWFyZSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdCAgXVxuXHRcdFx0OiBudWxsXG5cdH1cblxuXHRwcml2YXRlIGdldFNob3J0Y3V0cygpOiBBcnJheTxTaG9ydGN1dD4ge1xuXHRcdHJldHVybiBbXG5cdFx0XHQuLi5saXN0U2VsZWN0aW9uS2V5Ym9hcmRTaG9ydGN1dHMoTXVsdGlzZWxlY3RNb2RlLkVuYWJsZWQsICgpID0+IHRoaXMubWFpbFZpZXdNb2RlbCksXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5OLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5zaG93TmV3TWFpbERpYWxvZygpLmNhdGNoKG9mQ2xhc3MoUGVybWlzc2lvbkVycm9yLCBub09wKSlcblx0XHRcdFx0fSxcblx0XHRcdFx0ZW5hYmxlZDogKCkgPT4gISF0aGlzLm1haWxWaWV3TW9kZWwuZ2V0Rm9sZGVyKCkgJiYgaXNOZXdNYWlsQWN0aW9uQXZhaWxhYmxlKCksXG5cdFx0XHRcdGhlbHA6IFwibmV3TWFpbF9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5ERUxFVEUsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHRpZiAodGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbCkgdGhpcy5kZWxldGVNYWlscyh0aGlzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsLmdldFNlbGVjdGVkQXNBcnJheSgpKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRoZWxwOiBcImRlbGV0ZUVtYWlsc19hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5CQUNLU1BBQ0UsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHRpZiAodGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbCkgdGhpcy5kZWxldGVNYWlscyh0aGlzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsLmdldFNlbGVjdGVkQXNBcnJheSgpKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRoZWxwOiBcImRlbGV0ZUVtYWlsc19hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5BLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHRoaXMubWFpbFZpZXdNb2RlbC5saXN0TW9kZWwpIGFyY2hpdmVNYWlscyh0aGlzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsLmdldFNlbGVjdGVkQXNBcnJheSgpKVxuXHRcdFx0XHRcdHJldHVybiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlbHA6IFwiYXJjaGl2ZV9hY3Rpb25cIixcblx0XHRcdFx0ZW5hYmxlZDogKCkgPT4gbG9jYXRvci5sb2dpbnMuaXNJbnRlcm5hbFVzZXJMb2dnZWRJbigpLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLkksXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHRpZiAodGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbCkgbW92ZVRvSW5ib3godGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbC5nZXRTZWxlY3RlZEFzQXJyYXkoKSlcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRoZWxwOiBcIm1vdmVUb0luYm94X2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLlYsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLm1vdmVNYWlscygpXG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJtb3ZlX2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLkwsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLmxhYmVscygpXG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJsYWJlbHNfbGFiZWxcIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5VLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHRoaXMubWFpbFZpZXdNb2RlbC5saXN0TW9kZWwpIHRoaXMudG9nZ2xlVW5yZWFkTWFpbHModGhpcy5tYWlsVmlld01vZGVsLmxpc3RNb2RlbC5nZXRTZWxlY3RlZEFzQXJyYXkoKSlcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJ0b2dnbGVVbnJlYWRfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuT05FLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5tYWlsVmlld01vZGVsLnN3aXRjaFRvRm9sZGVyKE1haWxTZXRLaW5kLklOQk9YKVxuXHRcdFx0XHRcdHJldHVybiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlbHA6IFwic3dpdGNoSW5ib3hfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuVFdPLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5tYWlsVmlld01vZGVsLnN3aXRjaFRvRm9sZGVyKE1haWxTZXRLaW5kLkRSQUZUKVxuXHRcdFx0XHRcdHJldHVybiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlbHA6IFwic3dpdGNoRHJhZnRzX2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLlRIUkVFLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5tYWlsVmlld01vZGVsLnN3aXRjaFRvRm9sZGVyKE1haWxTZXRLaW5kLlNFTlQpXG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJzd2l0Y2hTZW50Rm9sZGVyX2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLkZPVVIsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLm1haWxWaWV3TW9kZWwuc3dpdGNoVG9Gb2xkZXIoTWFpbFNldEtpbmQuVFJBU0gpXG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJzd2l0Y2hUcmFzaF9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5GSVZFLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5tYWlsVmlld01vZGVsLnN3aXRjaFRvRm9sZGVyKE1haWxTZXRLaW5kLkFSQ0hJVkUpXG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0ZW5hYmxlZDogKCkgPT4gbG9jYXRvci5sb2dpbnMuaXNJbnRlcm5hbFVzZXJMb2dnZWRJbigpLFxuXHRcdFx0XHRoZWxwOiBcInN3aXRjaEFyY2hpdmVfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuU0lYLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5tYWlsVmlld01vZGVsLnN3aXRjaFRvRm9sZGVyKE1haWxTZXRLaW5kLlNQQU0pXG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0ZW5hYmxlZDogKCkgPT4gbG9jYXRvci5sb2dpbnMuaXNJbnRlcm5hbFVzZXJMb2dnZWRJbigpICYmICFsb2NhdG9yLmxvZ2lucy5pc0VuYWJsZWQoRmVhdHVyZVR5cGUuSW50ZXJuYWxDb21tdW5pY2F0aW9uKSxcblx0XHRcdFx0aGVscDogXCJzd2l0Y2hTcGFtX2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLkNUUkwsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IGZhbHNlLFxuXHRcdFx0XHRlbmFibGVkOiBjYW5Eb0RyYWdBbmREcm9wRXhwb3J0LFxuXHRcdFx0XHRoZWxwOiBcImRyYWdBbmREcm9wX2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLlAsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnByZXNzUmVsZWFzZSgpXG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJlbXB0eVN0cmluZ19tc2dcIixcblx0XHRcdFx0ZW5hYmxlZDogKCkgPT4gbG9jYXRvci5sb2dpbnMuaXNFbmFibGVkKEZlYXR1cmVUeXBlLk5ld3NsZXR0ZXIpLFxuXHRcdFx0fSxcblx0XHRdXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHByZXNzUmVsZWFzZSgpIHtcblx0XHRjb25zdCB7IG9wZW5QcmVzc1JlbGVhc2VFZGl0b3IgfSA9IGF3YWl0IGltcG9ydChcIi4uL3ByZXNzL1ByZXNzUmVsZWFzZUVkaXRvclwiKVxuXHRcdGNvbnN0IG1haWxib3hEZXRhaWxzID0gYXdhaXQgdGhpcy5tYWlsVmlld01vZGVsLmdldE1haWxib3hEZXRhaWxzKClcblx0XHRpZiAobWFpbGJveERldGFpbHMpIHtcblx0XHRcdG9wZW5QcmVzc1JlbGVhc2VFZGl0b3IobWFpbGJveERldGFpbHMpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBtb3ZlTWFpbHMoKSB7XG5cdFx0Y29uc3QgbWFpbExpc3QgPSB0aGlzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsXG5cdFx0aWYgKG1haWxMaXN0ID09IG51bGwpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IHNlbGVjdGVkTWFpbHMgPSBtYWlsTGlzdC5nZXRTZWxlY3RlZEFzQXJyYXkoKVxuXG5cdFx0c2hvd01vdmVNYWlsc0Ryb3Bkb3duKGxvY2F0b3IubWFpbGJveE1vZGVsLCBtYWlsTG9jYXRvci5tYWlsTW9kZWwsIGdldE1vdmVNYWlsQm91bmRzKCksIHNlbGVjdGVkTWFpbHMpXG5cdH1cblxuXHQvKipcblx0ICpTaG9ydGN1dCBNZXRob2QgdG8gc2hvdyBMYWJlbHMgZHJvcGRvd24gb25seSB3aGVuIGF0bGVhc3Qgb25lIG1haWwgaXMgc2VsZWN0ZWQuXG5cdCAqL1xuXHRwcml2YXRlIGxhYmVscygpIHtcblx0XHRjb25zdCBtYWlsTGlzdCA9IHRoaXMubWFpbFZpZXdNb2RlbC5saXN0TW9kZWxcblx0XHRpZiAobWFpbExpc3QgPT0gbnVsbCB8fCAhbWFpbExvY2F0b3IubWFpbE1vZGVsLmNhbkFzc2lnbkxhYmVscygpKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0Y29uc3QgbGFiZWxzID0gbWFpbExvY2F0b3IubWFpbE1vZGVsLmdldExhYmVsU3RhdGVzRm9yTWFpbHMobWFpbExpc3QuZ2V0U2VsZWN0ZWRBc0FycmF5KCkpXG5cdFx0Y29uc3Qgc2VsZWN0ZWRNYWlscyA9IG1haWxMaXN0LmdldFNlbGVjdGVkQXNBcnJheSgpXG5cblx0XHRpZiAoaXNFbXB0eShsYWJlbHMpIHx8IGlzRW1wdHkoc2VsZWN0ZWRNYWlscykpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IHBvcHVwID0gbmV3IExhYmVsc1BvcHVwKFxuXHRcdFx0ZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudCxcblx0XHRcdGdldE1vdmVNYWlsQm91bmRzKCksXG5cdFx0XHRzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KCkgPyAzMDAgOiAyMDAsXG5cdFx0XHRtYWlsTG9jYXRvci5tYWlsTW9kZWwuZ2V0TGFiZWxzRm9yTWFpbHMoc2VsZWN0ZWRNYWlscyksXG5cdFx0XHRtYWlsTG9jYXRvci5tYWlsTW9kZWwuZ2V0TGFiZWxTdGF0ZXNGb3JNYWlscyhzZWxlY3RlZE1haWxzKSxcblx0XHRcdChhZGRlZExhYmVscywgcmVtb3ZlZExhYmVscykgPT4gbWFpbExvY2F0b3IubWFpbE1vZGVsLmFwcGx5TGFiZWxzKHNlbGVjdGVkTWFpbHMsIGFkZGVkTGFiZWxzLCByZW1vdmVkTGFiZWxzKSxcblx0XHQpXG5cdFx0cG9wdXAuc2hvdygpXG5cdH1cblxuXHRwcml2YXRlIGNyZWF0ZUZvbGRlckNvbHVtbihlZGl0aW5nRm9sZGVyRm9yTWFpbEdyb3VwOiBJZCB8IG51bGwgPSBudWxsLCBkcmF3ZXJBdHRyczogRHJhd2VyTWVudUF0dHJzKSB7XG5cdFx0cmV0dXJuIG5ldyBWaWV3Q29sdW1uKFxuXHRcdFx0e1xuXHRcdFx0XHR2aWV3OiAoKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIG0oRm9sZGVyQ29sdW1uVmlldywge1xuXHRcdFx0XHRcdFx0ZHJhd2VyOiBkcmF3ZXJBdHRycyxcblx0XHRcdFx0XHRcdGJ1dHRvbjogZWRpdGluZ0ZvbGRlckZvck1haWxHcm91cFxuXHRcdFx0XHRcdFx0XHQ/IG51bGxcblx0XHRcdFx0XHRcdFx0OiAhc3R5bGVzLmlzVXNpbmdCb3R0b21OYXZpZ2F0aW9uKCkgJiYgaXNOZXdNYWlsQWN0aW9uQXZhaWxhYmxlKClcblx0XHRcdFx0XHRcdFx0PyB7XG5cdFx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJuZXdNYWlsX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHRoaXMuc2hvd05ld01haWxEaWFsb2coKS5jYXRjaChvZkNsYXNzKFBlcm1pc3Npb25FcnJvciwgbm9PcCkpLFxuXHRcdFx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRcdFx0Y29udGVudDogdGhpcy5yZW5kZXJGb2xkZXJzQW5kTGFiZWxzKGVkaXRpbmdGb2xkZXJGb3JNYWlsR3JvdXApLFxuXHRcdFx0XHRcdFx0YXJpYUxhYmVsOiBcImZvbGRlclRpdGxlX2xhYmVsXCIsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRlZGl0aW5nRm9sZGVyRm9yTWFpbEdyb3VwID8gQ29sdW1uVHlwZS5CYWNrZ3JvdW5kIDogQ29sdW1uVHlwZS5Gb3JlZ3JvdW5kLFxuXHRcdFx0e1xuXHRcdFx0XHRtaW5XaWR0aDogc2l6ZS5maXJzdF9jb2xfbWluX3dpZHRoLFxuXHRcdFx0XHRtYXhXaWR0aDogc2l6ZS5maXJzdF9jb2xfbWF4X3dpZHRoLFxuXHRcdFx0XHRoZWFkZXJDZW50ZXI6IFwiZm9sZGVyVGl0bGVfbGFiZWxcIixcblx0XHRcdH0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJGb2xkZXJzQW5kTGFiZWxzKGVkaXRpbmdGb2xkZXJGb3JNYWlsR3JvdXA6IElkIHwgbnVsbCkge1xuXHRcdGNvbnN0IGRldGFpbHMgPSBsb2NhdG9yLm1haWxib3hNb2RlbC5tYWlsYm94RGV0YWlscygpID8/IFtdXG5cdFx0cmV0dXJuIFtcblx0XHRcdC4uLmRldGFpbHMubWFwKChtYWlsYm94RGV0YWlsKSA9PiB7XG5cdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlckZvbGRlcnNBbmRMYWJlbHNGb3JNYWlsYm94KG1haWxib3hEZXRhaWwsIGVkaXRpbmdGb2xkZXJGb3JNYWlsR3JvdXApXG5cdFx0XHR9KSxcblx0XHRdXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckZvbGRlcnNBbmRMYWJlbHNGb3JNYWlsYm94KG1haWxib3hEZXRhaWw6IE1haWxib3hEZXRhaWwsIGVkaXRpbmdGb2xkZXJGb3JNYWlsR3JvdXA6IHN0cmluZyB8IG51bGwpIHtcblx0XHRjb25zdCBpbkVkaXRNb2RlID0gZWRpdGluZ0ZvbGRlckZvck1haWxHcm91cCA9PT0gbWFpbGJveERldGFpbC5tYWlsR3JvdXAuX2lkXG5cdFx0Ly8gT25seSBzaG93IGZvbGRlcnMgZm9yIG1haWxib3ggaW4gd2hpY2ggZWRpdCB3YXMgc2VsZWN0ZWRcblx0XHRpZiAoZWRpdGluZ0ZvbGRlckZvck1haWxHcm91cCAmJiAhaW5FZGl0TW9kZSkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG0oXG5cdFx0XHRcdFNpZGViYXJTZWN0aW9uLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZTogbGFuZy5tYWtlVHJhbnNsYXRpb24oXCJtYWlsYm94X25hbWVcIiwgZ2V0TWFpbGJveE5hbWUobG9jYXRvci5sb2dpbnMsIG1haWxib3hEZXRhaWwpKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdHRoaXMuY3JlYXRlTWFpbGJveEZvbGRlckl0ZW1zKG1haWxib3hEZXRhaWwsIGluRWRpdE1vZGUsICgpID0+IHtcblx0XHRcdFx0XHRcdEVkaXRGb2xkZXJzRGlhbG9nLnNob3dFZGl0KCgpID0+IHRoaXMucmVuZGVyRm9sZGVyc0FuZExhYmVscyhtYWlsYm94RGV0YWlsLm1haWxHcm91cC5faWQpKVxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdG1haWxMb2NhdG9yLm1haWxNb2RlbC5jYW5NYW5hZ2VMYWJlbHMoKVxuXHRcdFx0XHRcdFx0PyB0aGlzLnJlbmRlck1haWxib3hMYWJlbEl0ZW1zKG1haWxib3hEZXRhaWwsIGluRWRpdE1vZGUsICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRFZGl0Rm9sZGVyc0RpYWxvZy5zaG93RWRpdCgoKSA9PiB0aGlzLnJlbmRlckZvbGRlcnNBbmRMYWJlbHMobWFpbGJveERldGFpbC5tYWlsR3JvdXAuX2lkKSlcblx0XHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XSxcblx0XHRcdClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGNyZWF0ZU1haWxib3hGb2xkZXJJdGVtcyhtYWlsYm94RGV0YWlsOiBNYWlsYm94RGV0YWlsLCBpbkVkaXRNb2RlOiBib29sZWFuLCBvbkVkaXRNYWlsYm94OiAoKSA9PiB2b2lkKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKE1haWxGb2xkZXJzVmlldywge1xuXHRcdFx0bWFpbE1vZGVsOiBtYWlsTG9jYXRvci5tYWlsTW9kZWwsXG5cdFx0XHRtYWlsYm94RGV0YWlsLFxuXHRcdFx0ZXhwYW5kZWRGb2xkZXJzOiB0aGlzLmV4cGFuZGVkU3RhdGUsXG5cdFx0XHRtYWlsRm9sZGVyRWxlbWVudElkVG9TZWxlY3RlZE1haWxJZDogdGhpcy5tYWlsVmlld01vZGVsLmdldE1haWxGb2xkZXJUb1NlbGVjdGVkTWFpbCgpLFxuXHRcdFx0b25Gb2xkZXJDbGljazogKCkgPT4ge1xuXHRcdFx0XHRpZiAoIWluRWRpdE1vZGUpIHtcblx0XHRcdFx0XHR0aGlzLnZpZXdTbGlkZXIuZm9jdXModGhpcy5saXN0Q29sdW1uKVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0b25Gb2xkZXJFeHBhbmRlZDogKGZvbGRlciwgc3RhdGUpID0+IHRoaXMuc2V0RXhwYW5kZWRTdGF0ZShmb2xkZXIsIHN0YXRlKSxcblx0XHRcdG9uU2hvd0ZvbGRlckFkZEVkaXREaWFsb2c6ICguLi5hcmdzKSA9PiB0aGlzLnNob3dGb2xkZXJBZGRFZGl0RGlhbG9nKC4uLmFyZ3MpLFxuXHRcdFx0b25EZWxldGVDdXN0b21NYWlsRm9sZGVyOiAoZm9sZGVyKSA9PiB0aGlzLmRlbGV0ZUN1c3RvbU1haWxGb2xkZXIobWFpbGJveERldGFpbCwgZm9sZGVyKSxcblx0XHRcdG9uRm9sZGVyRHJvcDogKGRyb3BEYXRhLCBmb2xkZXIpID0+IHtcblx0XHRcdFx0aWYgKGRyb3BEYXRhLmRyb3BUeXBlID09IERyb3BUeXBlLk1haWwpIHtcblx0XHRcdFx0XHR0aGlzLmhhbmRsZUZvbGRlck1haWxEcm9wKGRyb3BEYXRhLCBmb2xkZXIpXG5cdFx0XHRcdH0gZWxzZSBpZiAoZHJvcERhdGEuZHJvcFR5cGUgPT0gRHJvcFR5cGUuRXh0ZXJuYWxGaWxlKSB7XG5cdFx0XHRcdFx0dGhpcy5oYW5kZUZvbGRlckZpbGVEcm9wKGRyb3BEYXRhLCBtYWlsYm94RGV0YWlsLCBmb2xkZXIpXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRpbkVkaXRNb2RlLFxuXHRcdFx0b25FZGl0TWFpbGJveCxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBzZXRFeHBhbmRlZFN0YXRlKGZvbGRlcjogTWFpbEZvbGRlciwgY3VycmVudEV4cGFuc2lvblN0YXRlOiBib29sZWFuKSB7XG5cdFx0aWYgKGN1cnJlbnRFeHBhbnNpb25TdGF0ZSkge1xuXHRcdFx0dGhpcy5leHBhbmRlZFN0YXRlLmRlbGV0ZShnZXRFbGVtZW50SWQoZm9sZGVyKSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5leHBhbmRlZFN0YXRlLmFkZChnZXRFbGVtZW50SWQoZm9sZGVyKSlcblx0XHR9XG5cdFx0ZGV2aWNlQ29uZmlnLnNldEV4cGFuZGVkRm9sZGVycyhsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJJZCwgWy4uLnRoaXMuZXhwYW5kZWRTdGF0ZV0pXG5cdH1cblxuXHRwcm90ZWN0ZWQgb25OZXdVcmwoYXJnczogUmVjb3JkPHN0cmluZywgYW55PiwgcmVxdWVzdGVkUGF0aDogc3RyaW5nKSB7XG5cdFx0aWYgKHJlcXVlc3RlZFBhdGguc3RhcnRzV2l0aChcIi9tYWlsdG9cIikpIHtcblx0XHRcdGlmIChsb2NhdGlvbi5oYXNoLmxlbmd0aCA+IDUpIHtcblx0XHRcdFx0bGV0IHVybCA9IGxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDUpXG5cdFx0XHRcdGxldCBkZWNvZGVkVXJsID0gZGVjb2RlVVJJQ29tcG9uZW50KHVybClcblx0XHRcdFx0UHJvbWlzZS5hbGwoW2xvY2F0b3IubWFpbGJveE1vZGVsLmdldFVzZXJNYWlsYm94RGV0YWlscygpLCBpbXBvcnQoXCIuLi9lZGl0b3IvTWFpbEVkaXRvclwiKV0pLnRoZW4oXG5cdFx0XHRcdFx0KFttYWlsYm94RGV0YWlscywgeyBuZXdNYWlsdG9VcmxNYWlsRWRpdG9yIH1dKSA9PiB7XG5cdFx0XHRcdFx0XHRuZXdNYWlsdG9VcmxNYWlsRWRpdG9yKGRlY29kZWRVcmwsIGZhbHNlLCBtYWlsYm94RGV0YWlscylcblx0XHRcdFx0XHRcdFx0LnRoZW4oKGVkaXRvcikgPT4gZWRpdG9yLnNob3coKSlcblx0XHRcdFx0XHRcdFx0LmNhdGNoKG9mQ2xhc3MoQ2FuY2VsbGVkRXJyb3IsIG5vT3ApKVxuXHRcdFx0XHRcdFx0aGlzdG9yeS5wdXNoU3RhdGUoXCJcIiwgZG9jdW1lbnQudGl0bGUsIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSkgLy8gcmVtb3ZlICMgZnJvbSB1cmxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHQpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChhcmdzLmFjdGlvbiA9PT0gXCJzdXBwb3J0TWFpbFwiICYmIGxvY2F0b3IubG9naW5zLmlzR2xvYmFsQWRtaW5Vc2VyTG9nZ2VkSW4oKSkge1xuXHRcdFx0aW1wb3J0KFwiLi4vZWRpdG9yL01haWxFZGl0b3JcIikudGhlbigoeyB3cml0ZVN1cHBvcnRNYWlsIH0pID0+IHdyaXRlU3VwcG9ydE1haWwoKSlcblx0XHR9XG5cblx0XHRpZiAoaXNBcHAoKSkge1xuXHRcdFx0bGV0IHVzZXJHcm91cEluZm8gPSBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJHcm91cEluZm9cblx0XHRcdGxvY2F0b3IucHVzaFNlcnZpY2UuY2xvc2VQdXNoTm90aWZpY2F0aW9uKFxuXHRcdFx0XHR1c2VyR3JvdXBJbmZvLm1haWxBZGRyZXNzQWxpYXNlcy5tYXAoKGFsaWFzKSA9PiBhbGlhcy5tYWlsQWRkcmVzcykuY29uY2F0KHVzZXJHcm91cEluZm8ubWFpbEFkZHJlc3MgfHwgW10pLFxuXHRcdFx0KVxuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgYXJncy5tYWlsID09PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRjb25zdCBbbWFpbExpc3RJZCwgbWFpbElkXSA9IGFyZ3MubWFpbC5zcGxpdChcIixcIilcblx0XHRcdGlmIChtYWlsTGlzdElkICYmIG1haWxJZCkge1xuXHRcdFx0XHR0aGlzLm1haWxWaWV3TW9kZWwuc2hvd1N0aWNreU1haWwoW21haWxMaXN0SWQsIG1haWxJZF0sICgpID0+XG5cdFx0XHRcdFx0c2hvd1NuYWNrQmFyKHtcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IFwibWFpbE1vdmVkX21zZ1wiLFxuXHRcdFx0XHRcdFx0YnV0dG9uOiB7XG5cdFx0XHRcdFx0XHRcdGxhYmVsOiBcIm9rX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRjbGljazogbm9PcCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdClcblx0XHRcdFx0dGhpcy52aWV3U2xpZGVyLmZvY3VzKHRoaXMubWFpbENvbHVtbilcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuc2hvd01haWwoYXJncylcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5zaG93TWFpbChhcmdzKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgc2hvd01haWwoYXJnczogUmVjb3JkPHN0cmluZywgYW55Pikge1xuXHRcdHRoaXMubWFpbFZpZXdNb2RlbC5zaG93TWFpbFdpdGhNYWlsU2V0SWQoYXJncy5mb2xkZXJJZCwgYXJncy5tYWlsSWQpXG5cdFx0aWYgKHN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpICYmICFhcmdzLm1haWxJZCAmJiB0aGlzLnZpZXdTbGlkZXIuZm9jdXNlZENvbHVtbiA9PT0gdGhpcy5tYWlsQ29sdW1uKSB7XG5cdFx0XHR0aGlzLnZpZXdTbGlkZXIuZm9jdXModGhpcy5saXN0Q29sdW1uKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgaGFuZGxlRmlsZURyb3AoZmlsZURyb3A6IEZpbGVEcm9wRGF0YSkge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBbbWFpbGJveCwgZGF0YUZpbGVzLCB7IGFwcGVuZEVtYWlsU2lnbmF0dXJlIH0sIHsgbmV3TWFpbEVkaXRvckZyb21UZW1wbGF0ZSB9XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRcdFx0dGhpcy5tYWlsVmlld01vZGVsLmdldE1haWxib3hEZXRhaWxzKCksXG5cdFx0XHRcdHJlYWRMb2NhbEZpbGVzKGZpbGVEcm9wLmZpbGVzKSxcblx0XHRcdFx0aW1wb3J0KFwiLi4vc2lnbmF0dXJlL1NpZ25hdHVyZVwiKSxcblx0XHRcdFx0aW1wb3J0KFwiLi4vZWRpdG9yL01haWxFZGl0b3JcIiksXG5cdFx0XHRdKVxuXG5cdFx0XHRpZiAobWFpbGJveCAhPSBudWxsKSB7XG5cdFx0XHRcdGNvbnN0IGRpYWxvZyA9IGF3YWl0IG5ld01haWxFZGl0b3JGcm9tVGVtcGxhdGUobWFpbGJveCwge30sIFwiXCIsIGFwcGVuZEVtYWlsU2lnbmF0dXJlKFwiXCIsIGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkucHJvcHMpLCBkYXRhRmlsZXMpXG5cdFx0XHRcdGRpYWxvZy5zaG93KClcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoIShlIGluc3RhbmNlb2YgUGVybWlzc2lvbkVycm9yKSkgdGhyb3cgZVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgaGFuZGxlRm9sZGVyTWFpbERyb3AoZHJvcERhdGE6IE1haWxEcm9wRGF0YSwgZm9sZGVyOiBNYWlsRm9sZGVyKSB7XG5cdFx0Y29uc3QgeyBtYWlsSWQgfSA9IGRyb3BEYXRhXG5cdFx0aWYgKCF0aGlzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0bGV0IG1haWxzVG9Nb3ZlOiBNYWlsW10gPSBbXVxuXG5cdFx0Ly8gdGhlIGRyb3BwZWQgbWFpbCBpcyBhbW9uZyB0aGUgc2VsZWN0ZWQgbWFpbHMsIG1vdmUgYWxsIHNlbGVjdGVkIG1haWxzXG5cdFx0aWYgKHRoaXMubWFpbFZpZXdNb2RlbC5saXN0TW9kZWwuaXNJdGVtU2VsZWN0ZWQobWFpbElkKSkge1xuXHRcdFx0bWFpbHNUb01vdmUgPSB0aGlzLm1haWxWaWV3TW9kZWwubGlzdE1vZGVsLmdldFNlbGVjdGVkQXNBcnJheSgpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IGVudGl0eSA9IHRoaXMubWFpbFZpZXdNb2RlbC5saXN0TW9kZWwuZ2V0TWFpbChtYWlsSWQpXG5cblx0XHRcdGlmIChlbnRpdHkpIHtcblx0XHRcdFx0bWFpbHNUb01vdmUucHVzaChlbnRpdHkpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bW92ZU1haWxzKHtcblx0XHRcdG1haWxib3hNb2RlbDogbG9jYXRvci5tYWlsYm94TW9kZWwsXG5cdFx0XHRtYWlsTW9kZWw6IG1haWxMb2NhdG9yLm1haWxNb2RlbCxcblx0XHRcdG1haWxzOiBtYWlsc1RvTW92ZSxcblx0XHRcdHRhcmdldE1haWxGb2xkZXI6IGZvbGRlcixcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBoYW5kZUZvbGRlckZpbGVEcm9wKGRyb3BEYXRhOiBGaWxlRHJvcERhdGEsIG1haWxib3hEZXRhaWw6IE1haWxib3hEZXRhaWwsIG1haWxGb2xkZXI6IE1haWxGb2xkZXIpIHtcblx0XHRmdW5jdGlvbiBkcm9wcGVkT25seU1haWxGaWxlcyhmaWxlczogQXJyYXk8RmlsZT4pOiBib29sZWFuIHtcblx0XHRcdC8vIHRoZXJlJ3Mgc2ltaWxhciBsb2dpYyBvbiB0aGUgQXR0YWNobWVudEJ1YmJsZSwgYnV0IGZvciBuYXRpdmVseSBzaGFyZWQgZmlsZXMuXG5cdFx0XHRyZXR1cm4gZmlsZXMuZXZlcnkoKGYpID0+IGYubmFtZS5lbmRzV2l0aChcIi5lbWxcIikgfHwgZi5uYW1lLmVuZHNXaXRoKFwiLm1ib3hcIikpXG5cdFx0fVxuXG5cdFx0YXdhaXQgdGhpcy5oYW5kbGVGaWxlRHJvcChkcm9wRGF0YSlcblxuXHRcdC8vIERuRCBtYWlsIGltcG9ydGluZyBpcyBkaXNhYmxlZCBmb3Igbm93IGFzIHRoZSBNYWlsSW1wb3J0ZXIgbWlnaHQgbm90IGhhdmVcblx0XHQvLyBiZWVuIGluaXRpYWxpemVkIHlldC5cblx0XHQvL1xuXHRcdC8vIC8vIGltcG9ydGluZyBtYWlscyBpcyBjdXJyZW50bHkgb25seSBhbGxvd2VkIG9uIHBsYW4gTEVHRU5EIGFuZCBVTkxJTUlURURcblx0XHQvLyBjb25zdCBjdXJyZW50UGxhblR5cGUgPSBhd2FpdCBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmdldFBsYW5UeXBlKClcblx0XHQvLyBjb25zdCBpc0hpZ2hlc3RUaWVyUGxhbiA9IEhpZ2hlc3RUaWVyUGxhbnMuaW5jbHVkZXMoY3VycmVudFBsYW5UeXBlKVxuXHRcdC8vXG5cdFx0Ly8gbGV0IGltcG9ydEFjdGlvbjogeyB0ZXh0OiBUcmFuc2xhdGlvblRleHQ7IHZhbHVlOiBib29sZWFuIH0gPSB7XG5cdFx0Ly8gXHR0ZXh0OiBcImltcG9ydF9hY3Rpb25cIixcblx0XHQvLyBcdHZhbHVlOiB0cnVlLFxuXHRcdC8vIH1cblx0XHQvLyBsZXQgYXR0YWNoRmlsZXNBY3Rpb246IHsgdGV4dDogVHJhbnNsYXRpb25UZXh0OyB2YWx1ZTogYm9vbGVhbiB9ID0ge1xuXHRcdC8vIFx0dGV4dDogXCJhdHRhY2hGaWxlc19hY3Rpb25cIixcblx0XHQvLyBcdHZhbHVlOiBmYWxzZSxcblx0XHQvLyB9XG5cdFx0Ly8gY29uc3Qgd2lsbEltcG9ydCA9XG5cdFx0Ly8gXHRpc0hpZ2hlc3RUaWVyUGxhbiAmJiBkcm9wcGVkT25seU1haWxGaWxlcyhkcm9wRGF0YS5maWxlcykgJiYgKGF3YWl0IERpYWxvZy5jaG9pY2UoXCJlbWxPck1ib3hJblNoYXJpbmdGaWxlc19tc2dcIiwgW2ltcG9ydEFjdGlvbiwgYXR0YWNoRmlsZXNBY3Rpb25dKSlcblx0XHQvL1xuXHRcdC8vIGlmICghd2lsbEltcG9ydCkge1xuXHRcdC8vIFx0YXdhaXQgdGhpcy5oYW5kbGVGaWxlRHJvcChkcm9wRGF0YSlcblx0XHQvLyB9IGVsc2UgaWYgKG1haWxGb2xkZXIuX293bmVyR3JvdXAgJiYgdGhpcy5tYWlsSW1wb3J0ZXIpIHtcblx0XHQvLyBcdGF3YWl0IHRoaXMubWFpbEltcG9ydGVyLm9uU3RhcnRCdG5DbGljayhcblx0XHQvLyBcdFx0bWFpbEZvbGRlcixcblx0XHQvLyBcdFx0ZHJvcERhdGEuZmlsZXMubWFwKChmaWxlKSA9PiB3aW5kb3cubmF0aXZlQXBwLmdldFBhdGhGb3JGaWxlKGZpbGUpKSxcblx0XHQvLyBcdClcblx0XHQvLyB9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNob3dOZXdNYWlsRGlhbG9nKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG1haWxib3hEZXRhaWxzID0gYXdhaXQgdGhpcy5tYWlsVmlld01vZGVsLmdldE1haWxib3hEZXRhaWxzKClcblx0XHRpZiAobWFpbGJveERldGFpbHMgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdGNvbnN0IHsgbmV3TWFpbEVkaXRvciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vZWRpdG9yL01haWxFZGl0b3JcIilcblx0XHRjb25zdCBkaWFsb2cgPSBhd2FpdCBuZXdNYWlsRWRpdG9yKG1haWxib3hEZXRhaWxzKVxuXHRcdGRpYWxvZy5zaG93KClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZGVsZXRlQ3VzdG9tTWFpbEZvbGRlcihtYWlsYm94RGV0YWlsOiBNYWlsYm94RGV0YWlsLCBmb2xkZXI6IE1haWxGb2xkZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoZm9sZGVyLmZvbGRlclR5cGUgIT09IE1haWxTZXRLaW5kLkNVU1RPTSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRlbGV0ZSBub24tY3VzdG9tIGZvbGRlcjogXCIgKyBTdHJpbmcoZm9sZGVyLl9pZCkpXG5cdFx0fVxuXG5cdFx0Ly8gcmVtb3ZlIGFueSBzZWxlY3Rpb24gdG8gYXZvaWQgdGhhdCB0aGUgbmV4dCBtYWlsIGlzIGxvYWRlZCBhbmQgc2VsZWN0ZWQgZm9yIGVhY2ggZGVsZXRlZCBtYWlsIGV2ZW50XG5cdFx0dGhpcy5tYWlsVmlld01vZGVsPy5saXN0TW9kZWw/LnNlbGVjdE5vbmUoKVxuXHRcdGlmIChtYWlsYm94RGV0YWlsLm1haWxib3guZm9sZGVycyA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0Y29uc3QgZm9sZGVycyA9IGF3YWl0IG1haWxMb2NhdG9yLm1haWxNb2RlbC5nZXRNYWlsYm94Rm9sZGVyc0ZvcklkKG1haWxib3hEZXRhaWwubWFpbGJveC5mb2xkZXJzLl9pZClcblxuXHRcdGlmIChpc1NwYW1PclRyYXNoRm9sZGVyKGZvbGRlcnMsIGZvbGRlcikpIHtcblx0XHRcdGNvbnN0IGNvbmZpcm1lZCA9IGF3YWl0IERpYWxvZy5jb25maXJtKFxuXHRcdFx0XHRsYW5nLmdldFRyYW5zbGF0aW9uKFwiY29uZmlybURlbGV0ZUZpbmFsbHlDdXN0b21Gb2xkZXJfbXNnXCIsIHtcblx0XHRcdFx0XHRcInsxfVwiOiBnZXRGb2xkZXJOYW1lKGZvbGRlciksXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdFx0aWYgKCFjb25maXJtZWQpIHJldHVyblxuXHRcdFx0YXdhaXQgbWFpbExvY2F0b3IubWFpbE1vZGVsLmZpbmFsbHlEZWxldGVDdXN0b21NYWlsRm9sZGVyKGZvbGRlcilcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgY29uZmlybWVkID0gYXdhaXQgRGlhbG9nLmNvbmZpcm0oXG5cdFx0XHRcdGxhbmcuZ2V0VHJhbnNsYXRpb24oXCJjb25maXJtRGVsZXRlQ3VzdG9tRm9sZGVyX21zZ1wiLCB7XG5cdFx0XHRcdFx0XCJ7MX1cIjogZ2V0Rm9sZGVyTmFtZShmb2xkZXIpLFxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHRcdGlmICghY29uZmlybWVkKSByZXR1cm5cblx0XHRcdGF3YWl0IG1haWxMb2NhdG9yLm1haWxNb2RlbC50cmFzaEZvbGRlckFuZFN1YmZvbGRlcnMoZm9sZGVyKVxuXHRcdH1cblx0fVxuXG5cdGxvZ291dCgpIHtcblx0XHRtLnJvdXRlLnNldChcIi9cIilcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgdG9nZ2xlVW5yZWFkTWFpbHMobWFpbHM6IE1haWxbXSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmIChtYWlscy5sZW5ndGggPT0gMCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdC8vIHNldCBhbGwgc2VsZWN0ZWQgZW1haWxzIHRvIHRoZSBvcHBvc2l0ZSBvZiB0aGUgZmlyc3QgZW1haWwncyB1bnJlYWQgc3RhdGVcblx0XHRhd2FpdCBtYWlsTG9jYXRvci5tYWlsTW9kZWwubWFya01haWxzKG1haWxzLCAhbWFpbHNbMF0udW5yZWFkKVxuXHR9XG5cblx0cHJpdmF0ZSBkZWxldGVNYWlscyhtYWlsczogTWFpbFtdKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0cmV0dXJuIHByb21wdEFuZERlbGV0ZU1haWxzKG1haWxMb2NhdG9yLm1haWxNb2RlbCwgbWFpbHMsIG5vT3ApXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNob3dGb2xkZXJBZGRFZGl0RGlhbG9nKG1haWxHcm91cElkOiBJZCwgZm9sZGVyOiBNYWlsRm9sZGVyIHwgbnVsbCwgcGFyZW50Rm9sZGVyOiBNYWlsRm9sZGVyIHwgbnVsbCkge1xuXHRcdGNvbnN0IG1haWxib3hEZXRhaWwgPSBhd2FpdCBsb2NhdG9yLm1haWxib3hNb2RlbC5nZXRNYWlsYm94RGV0YWlsc0Zvck1haWxHcm91cChtYWlsR3JvdXBJZClcblx0XHRhd2FpdCBzaG93RWRpdEZvbGRlckRpYWxvZyhtYWlsYm94RGV0YWlsLCBmb2xkZXIsIHBhcmVudEZvbGRlcilcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2hvd0xhYmVsQWRkRGlhbG9nKG1haWxib3g6IE1haWxCb3gpIHtcblx0XHRhd2FpdCBzaG93RWRpdExhYmVsRGlhbG9nKG1haWxib3gsIHRoaXMubWFpbFZpZXdNb2RlbCwgbnVsbClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2hvd0xhYmVsRWRpdERpYWxvZyhsYWJlbDogTWFpbEZvbGRlcikge1xuXHRcdGF3YWl0IHNob3dFZGl0TGFiZWxEaWFsb2cobnVsbCwgdGhpcy5tYWlsVmlld01vZGVsLCBsYWJlbClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2hvd0xhYmVsRGVsZXRlRGlhbG9nKGxhYmVsOiBNYWlsRm9sZGVyKSB7XG5cdFx0Y29uc3QgY29uZmlybWVkID0gYXdhaXQgRGlhbG9nLmNvbmZpcm0oXG5cdFx0XHRsYW5nLmdldFRyYW5zbGF0aW9uKFwiY29uZmlybURlbGV0ZUxhYmVsX21zZ1wiLCB7XG5cdFx0XHRcdFwiezF9XCI6IGxhYmVsLm5hbWUsXG5cdFx0XHR9KSxcblx0XHQpXG5cdFx0aWYgKCFjb25maXJtZWQpIHJldHVyblxuXHRcdGF3YWl0IHRoaXMubWFpbFZpZXdNb2RlbC5kZWxldGVMYWJlbChsYWJlbClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTWFpbGJveExhYmVsSXRlbXMobWFpbGJveERldGFpbDogTWFpbGJveERldGFpbCwgaW5FZGl0TW9kZTogYm9vbGVhbiwgb25FZGl0TWFpbGJveDogKCkgPT4gdm9pZCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcblx0XHRcdFx0U2lkZWJhclNlY3Rpb24sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRuYW1lOiBcImxhYmVsc19sYWJlbFwiLFxuXHRcdFx0XHRcdGJ1dHRvbjogaW5FZGl0TW9kZSA/IHRoaXMucmVuZGVyQWRkTGFiZWxCdXR0b24obWFpbGJveERldGFpbCkgOiB0aGlzLnJlbmRlckVkaXRNYWlsYm94QnV0dG9uKG9uRWRpdE1haWxib3gpLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0bShcIi5mbGV4LmNvbFwiLCBbXG5cdFx0XHRcdFx0XHRBcnJheS5mcm9tKG1haWxMb2NhdG9yLm1haWxNb2RlbC5nZXRMYWJlbHNCeUdyb3VwSWQobWFpbGJveERldGFpbC5tYWlsR3JvdXAuX2lkKS52YWx1ZXMoKSkubWFwKChsYWJlbCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBwYXRoID0gYCR7TUFJTF9QUkVGSVh9LyR7Z2V0RWxlbWVudElkKGxhYmVsKX1gXG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIG0oU2lkZWJhclNlY3Rpb25Sb3csIHtcblx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5MYWJlbCxcblx0XHRcdFx0XHRcdFx0XHRpY29uQ29sb3I6IGdldExhYmVsQ29sb3IobGFiZWwuY29sb3IpLFxuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihgZm9sZGVyOiR7bGFiZWwubmFtZX1gLCBsYWJlbC5uYW1lKSxcblx0XHRcdFx0XHRcdFx0XHRwYXRoLFxuXHRcdFx0XHRcdFx0XHRcdGlzU2VsZWN0ZWRQcmVmaXg6IGluRWRpdE1vZGUgPyBmYWxzZSA6IHBhdGgsXG5cdFx0XHRcdFx0XHRcdFx0ZGlzYWJsZWQ6IGluRWRpdE1vZGUsXG5cdFx0XHRcdFx0XHRcdFx0b25DbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKCFpbkVkaXRNb2RlKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMudmlld1NsaWRlci5mb2N1cyh0aGlzLmxpc3RDb2x1bW4pXG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRhbHdheXNTaG93TW9yZUJ1dHRvbjogaW5FZGl0TW9kZSxcblx0XHRcdFx0XHRcdFx0XHRtb3JlQnV0dG9uOiBhdHRhY2hEcm9wZG93bih7XG5cdFx0XHRcdFx0XHRcdFx0XHRtYWluQnV0dG9uQXR0cnM6IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuTW9yZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGl0bGU6IFwibW9yZV9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdGNoaWxkQXR0cnM6ICgpID0+IFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImVkaXRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuRWRpdCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5zaG93TGFiZWxFZGl0RGlhbG9nKGxhYmVsKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJkZWxldGVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuVHJhc2gsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuc2hvd0xhYmVsRGVsZXRlRGlhbG9nKGxhYmVsKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XSksXG5cdFx0XHRcdF0sXG5cdFx0XHQpLFxuXHRcdFx0bShSb3dCdXR0b24sIHtcblx0XHRcdFx0bGFiZWw6IFwiYWRkTGFiZWxfYWN0aW9uXCIsXG5cdFx0XHRcdGljb246IEljb25zLkFkZCxcblx0XHRcdFx0Y2xhc3M6IFwiZm9sZGVyLXJvdyBtbHItYnV0dG9uIGJvcmRlci1yYWRpdXMtc21hbGxcIixcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHR3aWR0aDogYGNhbGMoMTAwJSAtICR7cHgoc2l6ZS5ocGFkX2J1dHRvbiAqIDIpfSlgLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5zaG93TGFiZWxBZGREaWFsb2cobWFpbGJveERldGFpbC5tYWlsYm94KVxuXHRcdFx0XHR9LFxuXHRcdFx0fSksXG5cdFx0XVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJFZGl0TWFpbGJveEJ1dHRvbihvbkVkaXRNYWlsYm94OiAoKSA9PiB1bmtub3duKSB7XG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0aWNvbjogSWNvbnMuRWRpdCxcblx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHRcdHRpdGxlOiBcImVkaXRfYWN0aW9uXCIsXG5cdFx0XHRjbGljazogb25FZGl0TWFpbGJveCxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJBZGRMYWJlbEJ1dHRvbihtYWlsYm94RGV0YWlsOiBNYWlsYm94RGV0YWlsKSB7XG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwiYWRkTGFiZWxfYWN0aW9uXCIsXG5cdFx0XHRpY29uOiBJY29ucy5BZGQsXG5cdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHR0aGlzLnNob3dMYWJlbEFkZERpYWxvZyhtYWlsYm94RGV0YWlsLm1haWxib3gpXG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUNBLGtCQUFrQjtJQWFMLGVBQU4sTUFBMkQ7Q0FLakU7Q0FRQTtDQUNBLHFCQUE4QjtDQUM5QixlQUF3QjtDQUN4QixpQkFBMEI7Q0FDMUIsQUFBUTtDQUVSLElBQVksZ0JBQStCO0FBQzFDLFNBQU8sS0FBSyxNQUFNO0NBQ2xCO0NBRUQsQUFBaUIsZUFBNEM7RUFDNUQsWUFBWSxLQUFLO0VBQ2pCLHVCQUF1QixnQkFBZ0I7RUFDdkMsZUFBZSxDQUFDQSxRQUFxQjtHQUNwQyxNQUFNLFVBQVUsSUFBSSxRQUNuQixLQUFLLGNBQWMsd0JBQXdCLEtBQUssWUFBWSxPQUM1RCxDQUFDLFNBQVMsS0FB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