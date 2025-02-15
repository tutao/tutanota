import { __toESM } from "./chunk-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { isDesktop } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { addAll, assertNonNull, assertNotNull, contains, downcast, filterInt, first, formatSortableDateTime, neverNull, noOp, ofClass, pMap, pad, sortableTimestamp, startsWith, stringToBase64, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "./dist2-chunk.js";
import { InfoLink, lang } from "./LanguageViewModel-chunk.js";
import { ConversationType, ExternalImageRule, FeatureType, Keys, MailAuthenticationStatus, MailMethod, MailPhishingStatus, MailReportType, MailSetKind, MailState, OperationType, ReplyType, SYSTEM_GROUP_MAIL_ADDRESS } from "./TutanotaConstants-chunk.js";
import { elementIdPart, getLetId, haveSameId, isSameId } from "./EntityUtils-chunk.js";
import { ConversationEntryTypeRef, FileTypeRef, MailTypeRef, createMailAddress } from "./TypeRefs-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { FileOpenError, isOfflineError } from "./ErrorUtils-chunk.js";
import { LockedError, NotAuthorizedError, NotFoundError } from "./RestError-chunk.js";
import { CancelledError } from "./CancelledError-chunk.js";
import { IndexingNotSupportedError } from "./QuotaExceededError-chunk.js";
import { isUpdateForTypeRef } from "./EntityUpdateUtils-chunk.js";
import { isDraft } from "./MailChecks-chunk.js";
import { Button, ButtonType } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { Dialog, ifAllowedTutaLinks } from "./Dialog-chunk.js";
import { progressIcon } from "./Icon-chunk.js";
import { formatDateTime, urlEncodeHtmlTags } from "./Formatter-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import { createDataFile, getCleanedMimeType } from "./BlobUtils-chunk.js";
import { sanitizeFilename } from "./FileUtils-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import { CALENDAR_MIME_TYPE, getDefaultSender, getEnabledMailAddressesWithUser, getMailAddressDisplayText, getMailboxName, hasValidEncryptionAuthForTeamOrSystemMail, zipDataFiles } from "./SharedMailUtils-chunk.js";
import { ExternalLink } from "./ExternalLink-chunk.js";
import { showUserError } from "./ErrorHandlerImpl-chunk.js";
import { mailLocator } from "./mailLocator-chunk.js";
import { checkApprovalStatus } from "./LoginUtils-chunk.js";
import { AttachmentType, getAttachmentType } from "./AttachmentBubble-chunk.js";
import { getReferencedAttachments, isMailContrastFixNeeded, isTutanotaTeamMail, loadInlineImages, moveMails } from "./MailGuiUtils-chunk.js";
import { assertSystemFolderOfType, getFolderName, getPathToFolderString, loadMailHeaders } from "./MailUtils-chunk.js";
import { getDisplayedSender, getMailBodyText } from "./CommonMailUtils-chunk.js";
import { LoadingStateTracker } from "./LoadingState-chunk.js";
import { revokeInlineImages } from "./inlineImagesUtils-chunk.js";

//#region src/mail-app/mail/view/SourceCodeViewer.ts
var SourceCodeViewer = class {
	view(vnode) {
		const { rawHtml } = vnode.attrs;
		return mithril_default("p.selectable", rawHtml);
	}
};

//#endregion
//#region src/mail-app/mail/view/MailViewerUtils.ts
async function showHeaderDialog(headersPromise) {
	let state = { state: "loading" };
	headersPromise.then((headers) => {
		state = {
			state: "loaded",
			headers
		};
		mithril_default.redraw();
	});
	let mailHeadersDialog;
	const closeHeadersAction = () => {
		mailHeadersDialog?.close();
	};
	mailHeadersDialog = Dialog.largeDialog({
		right: [{
			label: "ok_action",
			click: closeHeadersAction,
			type: ButtonType.Secondary
		}],
		middle: "mailHeaders_title"
	}, { view: () => mithril_default(".white-space-pre.pt.pb.selectable", state.state === "loading" ? mithril_default(".center", progressIcon()) : state.headers ?? mithril_default(".center", lang.get("noEntries_msg"))) }).addShortcut({
		key: Keys.ESC,
		exec: closeHeadersAction,
		help: "close_alt"
	}).setCloseHandler(closeHeadersAction).show();
}
async function loadMailDetails(mailFacade, mail) {
	if (isDraft(mail)) {
		const detailsDraftId = assertNotNull(mail.mailDetailsDraft);
		return mailFacade.loadMailDetailsDraft(mail);
	} else {
		const mailDetailsId = neverNull(mail.mailDetails);
		return mailFacade.loadMailDetailsBlob(mail);
	}
}
async function editDraft(viewModel) {
	const sendAllowed = await checkApprovalStatus(locator.logins, false);
	if (sendAllowed) {
		const minimizedEditor = mailLocator.minimizedMailModel.getEditorForDraft(viewModel.mail);
		if (minimizedEditor) mailLocator.minimizedMailModel.reopenMinimizedEditor(minimizedEditor);
else try {
			const [mailboxDetails, { newMailEditorFromDraft }] = await Promise.all([viewModel.mailModel.getMailboxDetailsForMail(viewModel.mail), import("./MailEditor2-chunk.js")]);
			if (mailboxDetails == null) return;
			const editorDialog = await newMailEditorFromDraft(viewModel.mail, await loadMailDetails(locator.mailFacade, viewModel.mail), viewModel.getAttachments(), viewModel.getLoadedInlineImages(), viewModel.isBlockingExternalImages(), mailboxDetails);
			editorDialog.show();
		} catch (e) {
			if (e instanceof UserError) await showUserError(e);
else throw e;
		}
	}
}
async function showSourceDialog(rawHtml) {
	return Dialog.viewerDialog("emailSourceCode_title", SourceCodeViewer, { rawHtml });
}
function mailViewerMoreActions(viewModel, showReadButton = true) {
	const moreButtons = [];
	if (showReadButton) if (viewModel.isUnread()) moreButtons.push({
		label: "markRead_action",
		click: () => viewModel.setUnread(false),
		icon: Icons.Eye
	});
else moreButtons.push({
		label: "markUnread_action",
		click: () => viewModel.setUnread(true),
		icon: Icons.NoEye
	});
	if (viewModel.canPersistBlockingStatus() && viewModel.isShowingExternalContent()) moreButtons.push({
		label: "disallowExternalContent_action",
		click: () => viewModel.setContentBlockingStatus(ContentBlockingStatus.Block),
		icon: Icons.Picture
	});
	if (viewModel.canPersistBlockingStatus() && viewModel.isBlockingExternalImages()) moreButtons.push({
		label: "showImages_action",
		click: () => viewModel.setContentBlockingStatus(ContentBlockingStatus.Show),
		icon: Icons.Picture
	});
	if (viewModel.isListUnsubscribe()) moreButtons.push({
		label: "unsubscribe_action",
		click: () => unsubscribe(viewModel),
		icon: Icons.Cancel
	});
	if (!client.isMobileDevice() && viewModel.canExport()) moreButtons.push({
		label: "export_action",
		click: () => showProgressDialog("pleaseWait_msg", viewModel.exportMail()),
		icon: Icons.Export
	});
	if (!client.isMobileDevice() && typeof window.print === "function" && viewModel.canPrint()) moreButtons.push({
		label: "print_action",
		click: () => window.print(),
		icon: Icons.Print
	});
	if (viewModel.canShowHeaders()) moreButtons.push({
		label: "showHeaders_action",
		click: () => showHeaderDialog(viewModel.getHeaders()),
		icon: Icons.ListUnordered
	});
	if (viewModel.canReport()) moreButtons.push({
		label: "reportEmail_action",
		click: () => reportMail(viewModel),
		icon: Icons.Warning
	});
	return moreButtons;
}
function unsubscribe(viewModel) {
	return showProgressDialog("pleaseWait_msg", viewModel.unsubscribe()).then((success) => {
		if (success) return Dialog.message("unsubscribeSuccessful_msg");
	}).catch((e) => {
		if (e instanceof LockedError) return Dialog.message("operationStillActive_msg");
else return Dialog.message("unsubscribeFailed_msg");
	});
}
function reportMail(viewModel) {
	const sendReport = (reportType) => {
		viewModel.reportMail(reportType).catch(ofClass(LockedError, () => Dialog.message("operationStillActive_msg"))).finally(mithril_default.redraw);
	};
	const dialog = Dialog.showActionDialog({
		title: "reportEmail_action",
		child: () => mithril_default(".flex.col.mt-m", { style: { marginBottom: "-10px" } }, [
			mithril_default("div", lang.get("phishingReport_msg")),
			ifAllowedTutaLinks(locator.logins, InfoLink.Phishing, (link) => mithril_default(ExternalLink, {
				href: link,
				text: lang.get("whatIsPhishing_msg"),
				isCompanySite: true,
				class: "mt-s"
			})),
			mithril_default(".flex-wrap.flex-end", [mithril_default(Button, {
				label: "reportPhishing_action",
				click: () => {
					sendReport(MailReportType.PHISHING);
					dialog.close();
				},
				type: ButtonType.Secondary
			}), mithril_default(Button, {
				label: "reportSpam_action",
				click: () => {
					sendReport(MailReportType.SPAM);
					dialog.close();
				},
				type: ButtonType.Secondary
			})])
		]),
		okAction: null
	});
}
function isNoReplyTeamAddress(address) {
	return address === "no-reply@tutao.de" || address === "no-reply@tutanota.de";
}
function isSystemNotification(mail) {
	const { confidential, sender, state } = mail;
	return state === MailState.RECEIVED && confidential && hasValidEncryptionAuthForTeamOrSystemMail(mail) && (sender.address === SYSTEM_GROUP_MAIL_ADDRESS || isNoReplyTeamAddress(sender.address));
}
function getRecipientHeading(mail, preferNameOnly) {
	let recipientCount = parseInt(mail.recipientCount);
	if (recipientCount > 0) {
		let recipient = neverNull(mail.firstRecipient);
		return getMailAddressDisplayText(recipient.name, recipient.address, preferNameOnly) + (recipientCount > 1 ? ", ..." : "");
	} else return "";
}
function getSenderOrRecipientHeading(mail, preferNameOnly) {
	if (isSystemNotification(mail)) return "";
else if (mail.state === MailState.RECEIVED) {
		const sender = getDisplayedSender(mail);
		return getMailAddressDisplayText(sender.name, sender.address, preferNameOnly);
	} else return getRecipientHeading(mail, preferNameOnly);
}
let MailFilterType = function(MailFilterType$1) {
	MailFilterType$1[MailFilterType$1["Unread"] = 0] = "Unread";
	MailFilterType$1[MailFilterType$1["Read"] = 1] = "Read";
	MailFilterType$1[MailFilterType$1["WithAttachments"] = 2] = "WithAttachments";
	return MailFilterType$1;
}({});
function getMailFilterForType(filter) {
	switch (filter) {
		case MailFilterType.Read: return (mail) => !mail.unread;
		case MailFilterType.Unread: return (mail) => mail.unread;
		case MailFilterType.WithAttachments: return (mail) => mail.attachments.length > 0;
		case null: return null;
	}
}
function isRepliedTo(mail) {
	return mail.replyType === ReplyType.REPLY || mail.replyType === ReplyType.REPLY_FORWARD;
}
function canDoDragAndDropExport() {
	return isDesktop();
}

//#endregion
//#region src/mail-app/mail/export/Bundler.ts
function makeMailBundle(sanitizer, mail, mailDetails, attachments) {
	const recipientMapper = ({ address, name }) => ({
		address,
		name
	});
	const body = sanitizer.sanitizeHTML(getMailBodyText(mailDetails.body), {
		blockExternalContent: false,
		allowRelativeLinks: false,
		usePlaceholderForInlineImages: false
	}).html;
	return {
		mailId: getLetId(mail),
		subject: mail.subject,
		body,
		sender: recipientMapper(getDisplayedSender(mail)),
		to: mailDetails.recipients.toRecipients.map(recipientMapper),
		cc: mailDetails.recipients.ccRecipients.map(recipientMapper),
		bcc: mailDetails.recipients.bccRecipients.map(recipientMapper),
		replyTo: mailDetails.replyTos.map(recipientMapper),
		isDraft: mail.state === MailState.DRAFT,
		isRead: !mail.unread,
		sentOn: mailDetails.sentDate.getTime(),
		receivedOn: mail.receivedDate.getTime(),
		headers: mailDetails.headers?.compressedHeaders ?? mailDetails.headers?.headers ?? null,
		attachments
	};
}
async function downloadMailBundle(mail, mailFacade, entityClient, fileController, sanitizer, cryptoFacade) {
	const mailDetails = await loadMailDetails(mailFacade, mail);
	const files = await pMap(mail.attachments, async (fileId) => await entityClient.load(FileTypeRef, fileId));
	const attachments = await pMap(await cryptoFacade.enforceSessionKeyUpdateIfNeeded(mail, files), async (file) => await fileController.getAsDataFile(file));
	return makeMailBundle(sanitizer, mail, mailDetails, attachments);
}

//#endregion
//#region src/mail-app/mail/export/emlUtils.ts
function mailToEmlFile(mail, fileName) {
	const data = stringToUtf8Uint8Array(mailToEml(mail));
	return createDataFile(fileName, "message/rfc822", data);
}
function _formatSmtpDateTime(date) {
	const dayNames = [
		"Sun",
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat"
	];
	const monthNames = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	];
	return dayNames[date.getUTCDay()] + ", " + date.getUTCDate() + " " + monthNames[date.getUTCMonth()] + " " + date.getUTCFullYear() + " " + pad(date.getUTCHours(), 2) + ":" + pad(date.getUTCMinutes(), 2) + ":" + pad(date.getUTCSeconds(), 2) + " +0000";
}
function mailToEml(mail) {
	const lines = [];
	if (mail.headers) {
		const filteredHeaders = mail.headers.split(/\r\n|\n/).filter((line) => !line.match(/^\s*(Content-Type:|boundary=)/));
		lines.push(...filteredHeaders);
	} else {
		lines.push("From: " + mail.sender.address, "MIME-Version: 1.0");
		const formatRecipients = (key, recipients) => `${key}: ${recipients.map((recipient) => (recipient.name ? `${escapeSpecialCharacters(recipient.name)} ` : "") + `<${recipient.address}>`).join(",")}`;
		if (mail.to.length > 0) lines.push(formatRecipients("To", mail.to));
		if (mail.cc.length > 0) lines.push(formatRecipients("CC", mail.cc));
		if (mail.bcc.length > 0) lines.push(formatRecipients("BCC", mail.bcc));
		let subject = mail.subject.trim() === "" ? "" : `=?UTF-8?B?${uint8ArrayToBase64(stringToUtf8Uint8Array(mail.subject))}?=`;
		lines.push(
			"Subject: " + subject,
			"Date: " + _formatSmtpDateTime(new Date(mail.sentOn))
			//"Message-ID: " + // <006e01cf442b$52864f10$f792ed30$@tutao.de>
			//References: <53074EB8.4010505@tutao.de> <DD374AF0-AC6D-4C58-8F38-7F6D8A0307F3@tutao.de> <530E3529.70503@tutao.de>
);
	}
	lines.push("Content-Type: multipart/related; boundary=\"------------79Bu5A16qPEYcVIZL@tutanota\"", "", "--------------79Bu5A16qPEYcVIZL@tutanota", "Content-Type: text/html; charset=UTF-8", "Content-transfer-encoding: base64", "");
	for (let bodyLine of breakIntoLines(stringToBase64(mail.body))) lines.push(bodyLine);
	lines.push("");
	for (let attachment of mail.attachments) {
		const base64Filename = `=?UTF-8?B?${uint8ArrayToBase64(stringToUtf8Uint8Array(attachment.name))}?=`;
		const fileContentLines = breakIntoLines(uint8ArrayToBase64(attachment.data));
		lines.push("--------------79Bu5A16qPEYcVIZL@tutanota", "Content-Type: " + getCleanedMimeType(attachment.mimeType) + ";", " name=" + base64Filename + "", "Content-Transfer-Encoding: base64", "Content-Disposition: attachment;", " filename=" + base64Filename + "");
		if (attachment.cid) lines.push("Content-Id: <" + attachment.cid + ">");
		lines.push("");
		for (let fileLine of fileContentLines) lines.push(fileLine);
		lines.push("");
	}
	lines.push("--------------79Bu5A16qPEYcVIZL@tutanota--");
	return lines.join("\r\n");
}
function escapeSpecialCharacters(name) {
	return name.replace(/[,<>]/gi, "\\$&");
}
/**
* Break up a long string into lines of up to 78 characters
* @param string
* @returns the lines, each as an individual array
*/
function breakIntoLines(string) {
	return string.length > 0 ? assertNotNull(string.match(/.{1,78}/g)) : [];
}
function generateExportFileName(id, subject, sentOn, mode) {
	let filename = [
		...formatSortableDateTime(sentOn).split(" "),
		id,
		subject
	].join("-");
	filename = filename.trim();
	if (filename.length === 0) filename = "unnamed";
else if (filename.length > 96) filename = filename.substring(0, 95) + "_";
	return sanitizeFilename(`${filename}.${mode}`);
}

//#endregion
//#region src/mail-app/mail/export/Exporter.ts
async function generateMailFile(bundle, fileName, mode) {
	return mode === "eml" ? mailToEmlFile(bundle, fileName) : locator.fileApp.mailToMsg(bundle, fileName);
}
async function getMailExportMode() {
	if (isDesktop()) {
		const ConfigKeys = await import("./ConfigKeys2-chunk.js");
		const mailExportMode = await locator.desktopSettingsFacade.getStringConfigValue(ConfigKeys.DesktopConfigKey.mailExportMode).catch(noOp);
		return mailExportMode ?? "eml";
	} else return "eml";
}
async function exportMails(mails, mailFacade, entityClient, fileController, cryptoFacade, operationId, signal) {
	let cancelled = false;
	const onAbort = () => {
		cancelled = true;
	};
	try {
		const totalMails = mails.length * 3;
		let doneMails = 0;
		const errorMails = [];
		signal?.addEventListener("abort", onAbort);
		const updateProgress = operationId !== undefined ? () => locator.operationProgressTracker.onProgress(operationId, ++doneMails / totalMails * 100) : noOp;
		const checkAbortSignal = () => {
			if (cancelled) throw new CancelledError("export cancelled");
		};
		const downloadPromise = pMap(mails, async (mail) => {
			checkAbortSignal();
			try {
				const { htmlSanitizer } = await import("./HtmlSanitizer2-chunk.js");
				return await downloadMailBundle(mail, mailFacade, entityClient, fileController, htmlSanitizer, cryptoFacade);
			} catch (e) {
				errorMails.push(mail);
			} finally {
				updateProgress();
				updateProgress();
			}
		});
		const [mode, bundles] = await Promise.all([getMailExportMode(), downloadPromise]);
		const dataFiles = [];
		for (const bundle of bundles) {
			if (!bundle) continue;
			checkAbortSignal();
			const mailFile = await generateMailFile(bundle, generateExportFileName(elementIdPart(bundle.mailId), bundle.subject, new Date(bundle.receivedOn), mode), mode);
			dataFiles.push(mailFile);
			updateProgress();
		}
		const zipName = `${sortableTimestamp()}-${mode}-mail-export.zip`;
		const outputFile = await (dataFiles.length === 1 ? dataFiles[0] : zipDataFiles(dataFiles, zipName));
		await fileController.saveDataFile(outputFile);
		return { failed: errorMails };
	} catch (e) {
		if (e.name !== "CancelledError") throw e;
	} finally {
		signal?.removeEventListener("abort", onAbort);
	}
	return { failed: [] };
}

//#endregion
//#region src/mail-app/mail/view/MailViewerViewModel.ts
var import_stream = __toESM(require_stream(), 1);
let ContentBlockingStatus = function(ContentBlockingStatus$1) {
	ContentBlockingStatus$1["Block"] = "0";
	ContentBlockingStatus$1["Show"] = "1";
	ContentBlockingStatus$1["AlwaysShow"] = "2";
	ContentBlockingStatus$1["NoExternalContent"] = "3";
	ContentBlockingStatus$1["AlwaysBlock"] = "4";
	return ContentBlockingStatus$1;
}({});
var MailViewerViewModel = class {
	contrastFixNeeded = false;
	sanitizeResult = null;
	loadingAttachments = false;
	attachments = [];
	contentBlockingStatus = null;
	errorOccurred = false;
	loadedInlineImages = null;
	/** only loaded when showFolder is set to true */
	folderMailboxText;
	/** @see getRelevantRecipient */
	relevantRecipient = null;
	warningDismissed = false;
	calendarEventAttachment = null;
	loadingState = new LoadingStateTracker();
	renderIsDelayed = true;
	loadCompleteNotification = (0, import_stream.default)();
	renderedMail = null;
	loading = null;
	collapsed = true;
	get mail() {
		return this._mail;
	}
	mailDetails = null;
	constructor(_mail, showFolder, entityClient, mailboxModel, mailModel, contactModel, configFacade, fileController, logins, sendMailModelFactory, eventController, workerFacade, searchModel, mailFacade, cryptoFacade, contactImporter) {
		this._mail = _mail;
		this.entityClient = entityClient;
		this.mailboxModel = mailboxModel;
		this.mailModel = mailModel;
		this.contactModel = contactModel;
		this.configFacade = configFacade;
		this.fileController = fileController;
		this.logins = logins;
		this.sendMailModelFactory = sendMailModelFactory;
		this.eventController = eventController;
		this.workerFacade = workerFacade;
		this.searchModel = searchModel;
		this.mailFacade = mailFacade;
		this.cryptoFacade = cryptoFacade;
		this.contactImporter = contactImporter;
		this.folderMailboxText = null;
		if (showFolder) this.showFolder();
		this.eventController.addEntityListener(this.entityListener);
	}
	entityListener = async (events) => {
		for (const update of events) if (isUpdateForTypeRef(MailTypeRef, update)) {
			const { instanceListId, instanceId, operation } = update;
			if (operation === OperationType.UPDATE && isSameId(this.mail._id, [instanceListId, instanceId])) try {
				const updatedMail = await this.entityClient.load(MailTypeRef, this.mail._id);
				this.updateMail({ mail: updatedMail });
			} catch (e) {
				if (e instanceof NotFoundError) console.log(`Could not find updated mail ${JSON.stringify([instanceListId, instanceId])}`);
else throw e;
			}
		}
	};
	async determineRelevantRecipient() {
		const mailboxDetails = await this.mailModel.getMailboxDetailsForMail(this.mail);
		if (mailboxDetails == null) return;
		const enabledMailAddresses = new Set(getEnabledMailAddressesWithUser(mailboxDetails, this.logins.getUserController().userGroupInfo));
		if (this.mailDetails == null) return;
		this.relevantRecipient = this.mailDetails.recipients.toRecipients.find((r) => enabledMailAddresses.has(r.address)) ?? this.mailDetails.recipients.ccRecipients.find((r) => enabledMailAddresses.has(r.address)) ?? this.mailDetails.recipients.bccRecipients.find((r) => enabledMailAddresses.has(r.address)) ?? first(this.mailDetails.recipients.toRecipients) ?? first(this.mailDetails.recipients.ccRecipients) ?? first(this.mailDetails.recipients.bccRecipients);
		mithril_default.redraw();
	}
	showFolder() {
		this.folderMailboxText = null;
		const folder = this.mailModel.getMailFolderForMail(this.mail);
		if (folder) this.mailModel.getMailboxDetailsForMail(this.mail).then(async (mailboxDetails) => {
			if (mailboxDetails == null || mailboxDetails.mailbox.folders == null) return;
			const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetails.mailbox.folders._id);
			const name = getPathToFolderString(folders, folder);
			this.folderMailboxText = `${getMailboxName(this.logins, mailboxDetails)} / ${name}`;
			mithril_default.redraw();
		});
	}
	dispose() {
		this.dispose = () => console.log("disposed MailViewerViewModel a second time, ignoring");
		this.eventController.removeEntityListener(this.entityListener);
		const inlineImages = this.getLoadedInlineImages();
		revokeInlineImages(inlineImages);
	}
	async loadAll(delay, { notify } = { notify: true }) {
		this.renderIsDelayed = true;
		try {
			await this.loading;
			try {
				this.loading = this.loadAndProcessAdditionalMailInfo(this.mail, delay).then((inlineImageCids) => {
					this.determineRelevantRecipient();
					return inlineImageCids;
				}).then((inlineImageCids) => this.loadAttachments(this.mail, inlineImageCids));
				await this.loadingState.trackPromise(this.loading);
				if (notify) this.loadCompleteNotification(null);
			} catch (e) {
				this.loading = null;
				if (!isOfflineError(e)) throw e;
			}
			mithril_default.redraw();
			this.entityClient.load(ConversationEntryTypeRef, this.mail.conversationEntry).catch((e) => {
				if (e instanceof NotFoundError) console.log("could load conversation entry as it has been moved/deleted already", e);
else if (isOfflineError(e)) console.log("failed to load conversation entry, because of a lost connection", e);
else throw e;
			});
		} finally {
			this.renderIsDelayed = false;
		}
	}
	isLoading() {
		return this.loadingState.isLoading();
	}
	isConnectionLost() {
		return this.loadingState.isConnectionLost();
	}
	getAttachments() {
		return this.attachments;
	}
	getInlineCids() {
		return this.sanitizeResult?.inlineImageCids ?? [];
	}
	getLoadedInlineImages() {
		return this.loadedInlineImages ?? new Map();
	}
	isContrastFixNeeded() {
		return this.contrastFixNeeded;
	}
	isDraftMail() {
		return this.mail.state === MailState.DRAFT;
	}
	isReceivedMail() {
		return this.mail.state === MailState.RECEIVED;
	}
	isLoadingAttachments() {
		return this.loadingAttachments;
	}
	getFolderMailboxText() {
		return this.folderMailboxText;
	}
	getFolderInfo() {
		const folder = this.mailModel.getMailFolderForMail(this.mail);
		if (!folder) return null;
		return {
			folderType: folder.folderType,
			name: getFolderName(folder)
		};
	}
	getSubject() {
		return this.mail.subject;
	}
	isConfidential() {
		return this.mail.confidential;
	}
	isMailSuspicious() {
		return this.mail.phishingStatus === MailPhishingStatus.SUSPICIOUS;
	}
	getMailId() {
		return this.mail._id;
	}
	getSanitizedMailBody() {
		return this.sanitizeResult?.fragment ?? null;
	}
	getMailBody() {
		if (this.mailDetails) return getMailBodyText(this.mailDetails.body);
else return "";
	}
	getDate() {
		return this.mail.receivedDate;
	}
	getToRecipients() {
		if (this.mailDetails === null) return [];
		return this.mailDetails.recipients.toRecipients;
	}
	getCcRecipients() {
		if (this.mailDetails === null) return [];
		return this.mailDetails.recipients.ccRecipients;
	}
	getBccRecipients() {
		if (this.mailDetails === null) return [];
		return this.mailDetails.recipients.bccRecipients;
	}
	/** Get the recipient which is relevant the most for the current mailboxes. */
	getRelevantRecipient() {
		return this.relevantRecipient;
	}
	getNumberOfRecipients() {
		return filterInt(this.mail.recipientCount);
	}
	getReplyTos() {
		if (this.mailDetails === null) return [];
		return this.mailDetails.replyTos;
	}
	getSender() {
		return this.mail.sender;
	}
	/**
	* Can be {@code null} if sender should not be displayed e.g. for system notifications.
	*/
	getDisplayedSender() {
		if (isSystemNotification(this.mail)) return null;
else return getDisplayedSender(this.mail);
	}
	getPhishingStatus() {
		return this.mail.phishingStatus;
	}
	setPhishingStatus(status) {
		this.mail.phishingStatus = status;
	}
	checkMailAuthenticationStatus(status) {
		if (this.mail.authStatus != null) return this.mail.authStatus === status;
else if (this.mailDetails) return this.mailDetails.authStatus === status;
else return false;
	}
	canCreateSpamRule() {
		return this.logins.isGlobalAdminUserLoggedIn() && !this.logins.isEnabled(FeatureType.InternalCommunication);
	}
	didErrorsOccur() {
		let bodyErrors = false;
		if (this.mailDetails) bodyErrors = typeof downcast(this.mailDetails.body)._errors !== "undefined";
		return this.errorOccurred || typeof this.mail._errors !== "undefined" || bodyErrors;
	}
	isTutanotaTeamMail() {
		return isTutanotaTeamMail(this.mail);
	}
	isShowingExternalContent() {
		return this.contentBlockingStatus === ContentBlockingStatus.Show || this.contentBlockingStatus === ContentBlockingStatus.AlwaysShow;
	}
	isBlockingExternalImages() {
		return this.contentBlockingStatus === ContentBlockingStatus.Block || this.contentBlockingStatus === ContentBlockingStatus.AlwaysBlock;
	}
	getDifferentEnvelopeSender() {
		return this.mail.differentEnvelopeSender;
	}
	getCalendarEventAttachment() {
		return this.calendarEventAttachment;
	}
	getContentBlockingStatus() {
		return this.contentBlockingStatus;
	}
	isWarningDismissed() {
		return this.warningDismissed;
	}
	setWarningDismissed(dismissed) {
		this.warningDismissed = dismissed;
	}
	async setContentBlockingStatus(status) {
		if (status === ContentBlockingStatus.NoExternalContent || this.contentBlockingStatus === ContentBlockingStatus.NoExternalContent || this.contentBlockingStatus === status) return;
		if (status === ContentBlockingStatus.AlwaysShow) this.configFacade.addExternalImageRule(this.getSender().address, ExternalImageRule.Allow).catch(ofClass(IndexingNotSupportedError, noOp));
else if (status === ContentBlockingStatus.AlwaysBlock) this.configFacade.addExternalImageRule(this.getSender().address, ExternalImageRule.Block).catch(ofClass(IndexingNotSupportedError, noOp));
else this.configFacade.addExternalImageRule(this.getSender().address, ExternalImageRule.None).catch(ofClass(IndexingNotSupportedError, noOp));
		this.sanitizeResult = await this.sanitizeMailBody(this.mail, status === ContentBlockingStatus.Block || status === ContentBlockingStatus.AlwaysBlock);
		this.contentBlockingStatus = status;
	}
	async markAsNotPhishing() {
		const oldStatus = this.getPhishingStatus();
		if (oldStatus === MailPhishingStatus.WHITELISTED) return;
		this.setPhishingStatus(MailPhishingStatus.WHITELISTED);
		await this.entityClient.update(this.mail).catch(() => this.setPhishingStatus(oldStatus));
	}
	async reportMail(reportType) {
		try {
			await this.mailModel.reportMails(reportType, [this.mail]);
			if (reportType === MailReportType.PHISHING) {
				this.setPhishingStatus(MailPhishingStatus.SUSPICIOUS);
				await this.entityClient.update(this.mail);
			}
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMail(this.mail);
			if (mailboxDetail == null || mailboxDetail.mailbox.folders == null) return;
			const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id);
			const spamFolder = assertSystemFolderOfType(folders, MailSetKind.SPAM);
			await moveMails({
				mailboxModel: this.mailboxModel,
				mailModel: this.mailModel,
				mails: [this.mail],
				targetMailFolder: spamFolder,
				isReportable: false
			});
		} catch (e) {
			if (e instanceof NotFoundError) console.log("mail already moved");
else throw e;
		}
	}
	canExport() {
		return !this.isAnnouncement() && !this.logins.isEnabled(FeatureType.DisableMailExport);
	}
	canPrint() {
		return !this.logins.isEnabled(FeatureType.DisableMailExport);
	}
	canReport() {
		return this.getPhishingStatus() === MailPhishingStatus.UNKNOWN && !this.isTutanotaTeamMail() && this.logins.isInternalUserLoggedIn();
	}
	canShowHeaders() {
		return this.logins.isInternalUserLoggedIn();
	}
	canPersistBlockingStatus() {
		return this.searchModel.indexingSupported;
	}
	async exportMail() {
		await exportMails([this.mail], this.mailFacade, this.entityClient, this.fileController, this.cryptoFacade);
	}
	async getHeaders() {
		const mailDetails = await loadMailDetails(this.mailFacade, this.mail);
		return loadMailHeaders(mailDetails);
	}
	isUnread() {
		return this.mail.unread;
	}
	async setUnread(unread) {
		if (this.mail.unread !== unread) {
			this.mail.unread = unread;
			await this.entityClient.update(this.mail).catch(ofClass(LockedError, () => console.log("could not update mail read state: ", lang.get("operationStillActive_msg")))).catch(ofClass(NotFoundError, noOp));
		}
	}
	isListUnsubscribe() {
		return this.mail.listUnsubscribe;
	}
	isAnnouncement() {
		const replyTos = this.mailDetails?.replyTos;
		return isSystemNotification(this.mail) && (replyTos == null || replyTos?.length === 0 || replyTos?.length === 1 && isNoReplyTeamAddress(replyTos[0].address));
	}
	async unsubscribe() {
		if (!this.isListUnsubscribe()) return false;
		const mailHeaders = await this.getHeaders();
		if (!mailHeaders) return false;
		const unsubHeaders = mailHeaders.replaceAll(/\r\n/g, "\n").replaceAll(/\n[ \t]/g, "").split("\n").filter((headerLine) => headerLine.toLowerCase().startsWith("list-unsubscribe"));
		if (unsubHeaders.length > 0) {
			const recipient = await this.getSenderOfResponseMail();
			await this.mailModel.unsubscribe(this.mail, recipient, unsubHeaders);
			return true;
		} else return false;
	}
	getMailboxDetails() {
		return this.mailModel.getMailboxDetailsForMail(this.mail);
	}
	/** @return list of inline referenced cid */
	async loadAndProcessAdditionalMailInfo(mail, delayBodyRenderingUntil) {
		let isDraft$1 = mail.state === MailState.DRAFT;
		if (this.renderedMail != null && haveSameId(mail, this.renderedMail) && !isDraft$1 && this.sanitizeResult != null) return this.sanitizeResult.inlineImageCids;
		try {
			this.mailDetails = await loadMailDetails(this.mailFacade, this.mail);
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log("could load mail body as it has been moved/deleted already", e);
				this.errorOccurred = true;
				return [];
			}
			if (e instanceof NotAuthorizedError) {
				console.log("could load mail body as the permission is missing", e);
				this.errorOccurred = true;
				return [];
			}
			throw e;
		}
		const externalImageRule = await this.configFacade.getExternalImageRule(mail.sender.address).catch((e) => {
			console.log("Error getting external image rule:", e);
			return ExternalImageRule.None;
		});
		const isAllowedAndAuthenticatedExternalSender = externalImageRule === ExternalImageRule.Allow && this.checkMailAuthenticationStatus(MailAuthenticationStatus.AUTHENTICATED);
		await delayBodyRenderingUntil;
		this.renderIsDelayed = false;
		this.sanitizeResult = await this.sanitizeMailBody(mail, !isAllowedAndAuthenticatedExternalSender);
		if (!isDraft$1) this.checkMailForPhishing(mail, this.sanitizeResult.links);
		this.contentBlockingStatus = externalImageRule === ExternalImageRule.Block ? ContentBlockingStatus.AlwaysBlock : isAllowedAndAuthenticatedExternalSender ? ContentBlockingStatus.AlwaysShow : this.sanitizeResult.blockedExternalContent > 0 ? ContentBlockingStatus.Block : ContentBlockingStatus.NoExternalContent;
		mithril_default.redraw();
		this.renderedMail = this.mail;
		return this.sanitizeResult.inlineImageCids;
	}
	async loadAttachments(mail, inlineCids) {
		if (mail.attachments.length === 0) {
			this.loadingAttachments = false;
			mithril_default.redraw();
		} else {
			this.loadingAttachments = true;
			try {
				const files = await this.cryptoFacade.enforceSessionKeyUpdateIfNeeded(this._mail, await this.mailFacade.loadAttachments(mail));
				this.handleCalendarFile(files, mail);
				this.attachments = files;
				this.loadingAttachments = false;
				mithril_default.redraw();
				if (this.loadedInlineImages == null) this.loadedInlineImages = await loadInlineImages(this.fileController, files, inlineCids);
				mithril_default.redraw();
			} catch (e) {
				if (e instanceof NotFoundError) console.log("could load attachments as they have been moved/deleted already", e);
else throw e;
			}
		}
	}
	checkMailForPhishing(mail, links) {
		if (mail.phishingStatus === MailPhishingStatus.UNKNOWN) {
			const linkObjects = links.map((link) => {
				return {
					href: link.getAttribute("href") || "",
					innerHTML: link.innerHTML
				};
			});
			this.mailModel.checkMailForPhishing(mail, linkObjects).then((isSuspicious) => {
				if (isSuspicious) {
					mail.phishingStatus = MailPhishingStatus.SUSPICIOUS;
					this.entityClient.update(mail).catch(ofClass(LockedError, (e) => console.log("could not update mail phishing status as mail is locked"))).catch(ofClass(NotFoundError, (e) => console.log("mail already moved")));
					mithril_default.redraw();
				}
			});
		}
	}
	/**
	* Check if the list of files contain an iCal file which we can then load and display details for. A calendar notification
	* should contain only one iCal attachment, so we only process the first matching one.
	*
	* (this is not true for ie google calendar, they send the invite twice in each mail, but it's always the same file twice)
	*/
	handleCalendarFile(files, mail) {
		const calendarFile = files.find((a) => a.mimeType && a.mimeType.startsWith(CALENDAR_MIME_TYPE));
		if (calendarFile && (mail.method === MailMethod.ICAL_REQUEST || mail.method === MailMethod.ICAL_REPLY) && mail.state === MailState.RECEIVED) Promise.all([import("./CalendarInvites2-chunk.js").then(({ getEventsFromFile }) => getEventsFromFile(calendarFile, mail.confidential)), this.getSenderOfResponseMail()]).then(([contents, recipient]) => {
			this.calendarEventAttachment = contents != null ? {
				contents,
				recipient
			} : null;
			mithril_default.redraw();
		});
	}
	getSenderOfResponseMail() {
		return this.mailModel.getMailboxDetailsForMail(this.mail).then(async (mailboxDetails) => {
			assertNonNull(mailboxDetails, "Mail list does not exist anymore");
			const myMailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, this.logins.getUserController().userGroupInfo);
			const addressesInMail = [];
			const mailDetails = await loadMailDetails(this.mailFacade, this.mail);
			addressesInMail.push(...mailDetails.recipients.toRecipients);
			addressesInMail.push(...mailDetails.recipients.ccRecipients);
			addressesInMail.push(...mailDetails.recipients.bccRecipients);
			const mailAddressAndName = this.getDisplayedSender();
			if (mailAddressAndName) addressesInMail.push(createMailAddress({
				name: mailAddressAndName.name,
				address: mailAddressAndName.address,
				contact: null
			}));
			const foundAddress = addressesInMail.find((address) => contains(myMailAddresses, address.address.toLowerCase()));
			if (foundAddress) return foundAddress.address.toLowerCase();
else return getDefaultSender(this.logins, mailboxDetails);
		});
	}
	/** @throws UserError */
	async forward() {
		const sendAllowed = await checkApprovalStatus(this.logins, false);
		if (sendAllowed) {
			const args = await this.createResponseMailArgsForForwarding([], [], true);
			const [mailboxDetails, { newMailEditorAsResponse }] = await Promise.all([this.getMailboxDetails(), import("./MailEditor2-chunk.js")]);
			if (mailboxDetails == null) return;
			const isReloadNeeded = !this.sanitizeResult || this.mail.attachments.length !== this.attachments.length;
			if (isReloadNeeded) await this.loadAll(Promise.resolve(), { notify: true });
			const editor = await newMailEditorAsResponse(args, this.isBlockingExternalImages(), this.getLoadedInlineImages(), mailboxDetails);
			editor.show();
		}
	}
	async createResponseMailArgsForForwarding(recipients, replyTos, addSignature) {
		let infoLine = lang.get("date_label") + ": " + formatDateTime(this.mail.receivedDate) + "<br>";
		const senderAddress = this.getDisplayedSender()?.address;
		if (senderAddress) infoLine += lang.get("from_label") + ": " + senderAddress + "<br>";
		if (this.getToRecipients().length > 0) {
			infoLine += lang.get("to_label") + ": " + this.getToRecipients().map((recipient) => recipient.address).join(", ");
			infoLine += "<br>";
		}
		if (this.getCcRecipients().length > 0) {
			infoLine += lang.get("cc_label") + ": " + this.getCcRecipients().map((recipient) => recipient.address).join(", ");
			infoLine += "<br>";
		}
		const mailSubject = this.getSubject() || "";
		infoLine += lang.get("subject_label") + ": " + urlEncodeHtmlTags(mailSubject);
		let body = infoLine + "<br><br><blockquote class=\"tutanota_quote\">" + this.getMailBody() + "</blockquote>";
		const { prependEmailSignature } = await import("./Signature2-chunk.js");
		const senderMailAddress = await this.getSenderOfResponseMail();
		return {
			previousMail: this.mail,
			conversationType: ConversationType.FORWARD,
			senderMailAddress,
			recipients,
			attachments: this.attachments.slice(),
			subject: "FWD: " + mailSubject,
			bodyText: addSignature ? prependEmailSignature(body, this.logins) : body,
			replyTos
		};
	}
	async reply(replyAll) {
		if (this.isAnnouncement()) return;
		const sendAllowed = await checkApprovalStatus(this.logins, false);
		if (sendAllowed) {
			const mailboxDetails = await this.mailModel.getMailboxDetailsForMail(this.mail);
			if (mailboxDetails == null) return;
			const mailAddressAndName = getDisplayedSender(this.mail);
			const sender = createMailAddress({
				name: mailAddressAndName.name,
				address: mailAddressAndName.address,
				contact: null
			});
			let prefix = "Re: ";
			const mailSubject = this.getSubject();
			let subject = mailSubject ? startsWith(mailSubject.toUpperCase(), prefix.toUpperCase()) ? mailSubject : prefix + mailSubject : "";
			let infoLine = formatDateTime(this.getDate()) + " " + lang.get("by_label") + " " + sender.address + ":";
			let body = infoLine + "<br><blockquote class=\"tutanota_quote\">" + this.getMailBody() + "</blockquote>";
			let toRecipients = [];
			let ccRecipients = [];
			let bccRecipients = [];
			if (!this.logins.getUserController().isInternalUser() && this.isReceivedMail()) toRecipients.push(sender);
else if (this.isReceivedMail()) {
				if (this.getReplyTos().some((address) => !downcast(address)._errors)) addAll(toRecipients, this.getReplyTos());
else toRecipients.push(sender);
				if (replyAll) {
					let myMailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, this.logins.getUserController().userGroupInfo);
					addAll(ccRecipients, this.getToRecipients().filter((recipient) => !contains(myMailAddresses, recipient.address.toLowerCase())));
					addAll(ccRecipients, this.getCcRecipients().filter((recipient) => !contains(myMailAddresses, recipient.address.toLowerCase())));
				}
			} else {
				addAll(toRecipients, this.getToRecipients());
				if (replyAll) {
					addAll(ccRecipients, this.getCcRecipients());
					addAll(bccRecipients, this.getBccRecipients());
				}
			}
			const { prependEmailSignature } = await import("./Signature2-chunk.js");
			const { newMailEditorAsResponse } = await import("./MailEditor2-chunk.js");
			const isReloadNeeded = !this.sanitizeResult || this.mail.attachments.length !== this.attachments.length;
			if (isReloadNeeded) await this.loadAll(Promise.resolve(), { notify: true });
			const inlineImageCids = this.sanitizeResult?.inlineImageCids ?? [];
			const [senderMailAddress, referencedCids] = await Promise.all([this.getSenderOfResponseMail(), inlineImageCids]);
			const attachmentsForReply = getReferencedAttachments(this.attachments, referencedCids);
			try {
				const editor = await newMailEditorAsResponse({
					previousMail: this.mail,
					conversationType: ConversationType.REPLY,
					senderMailAddress,
					recipients: {
						to: toRecipients,
						cc: ccRecipients,
						bcc: bccRecipients
					},
					attachments: attachmentsForReply,
					subject,
					bodyText: prependEmailSignature(body, this.logins),
					replyTos: []
				}, this.isBlockingExternalImages() || !this.isShowingExternalContent(), this.getLoadedInlineImages(), mailboxDetails);
				editor.show();
			} catch (e) {
				if (e instanceof UserError) showUserError(e);
else throw e;
			}
		}
	}
	async sanitizeMailBody(mail, blockExternalContent) {
		const { htmlSanitizer } = await import("./HtmlSanitizer2-chunk.js");
		const rawBody = this.getMailBody();
		const sanitizeResult = htmlSanitizer.sanitizeFragment(rawBody, {
			blockExternalContent,
			allowRelativeLinks: isTutanotaTeamMail(mail)
		});
		const { fragment, inlineImageCids, links, blockedExternalContent } = sanitizeResult;
		/**
		* Check if we need to improve contrast for dark theme. We apply the contrast fix if any of the following is contained in
		* the html body of the mail
		*  * any tag with a style attribute that has the color property set (besides "inherit")
		*  * any tag with a style attribute that has the background-color set (besides "inherit")
		*  * any font tag with the color attribute set
		*/
		this.contrastFixNeeded = isMailContrastFixNeeded(fragment);
		mithril_default.redraw();
		return {
			fragment,
			inlineImageCids,
			links,
			blockedExternalContent
		};
	}
	getNonInlineAttachments() {
		const inlineFileIds = this.sanitizeResult?.inlineImageCids ?? [];
		return this.attachments.filter((a) => a.cid == null || !inlineFileIds.includes(a.cid));
	}
	async downloadAll() {
		const nonInlineAttachments = await this.cryptoFacade.enforceSessionKeyUpdateIfNeeded(this._mail, this.getNonInlineAttachments());
		try {
			await this.fileController.downloadAll(nonInlineAttachments);
		} catch (e) {
			if (e instanceof FileOpenError) {
				console.warn("FileOpenError", e);
				await Dialog.message("canNotOpenFileOnDevice_msg");
			} else {
				console.error("could not open file:", e.message ?? "unknown error");
				await Dialog.message("errorDuringFileOpen_msg");
			}
		}
	}
	async downloadAndOpenAttachment(file, open) {
		file = (await this.cryptoFacade.enforceSessionKeyUpdateIfNeeded(this._mail, [file]))[0];
		try {
			if (open) await this.fileController.open(file);
else await this.fileController.download(file);
		} catch (e) {
			if (e instanceof FileOpenError) {
				console.warn("FileOpenError", e);
				await Dialog.message("canNotOpenFileOnDevice_msg");
			} else {
				console.error("could not open file:", e.message ?? "unknown error");
				await Dialog.message("errorDuringFileOpen_msg");
			}
		}
	}
	async importAttachment(file) {
		const attachmentType = getAttachmentType(file.mimeType ?? "");
		if (attachmentType === AttachmentType.CONTACT) await this.importContacts(file);
else if (attachmentType === AttachmentType.CALENDAR) await this.importCalendar(file);
	}
	async importContacts(file) {
		file = (await this.cryptoFacade.enforceSessionKeyUpdateIfNeeded(this._mail, [file]))[0];
		try {
			const dataFile = await this.fileController.getAsDataFile(file);
			const contactListId = await this.contactModel.getContactListId();
			if (contactListId == null) return;
			const contactImporter = await this.contactImporter();
			await contactImporter.importContactsFromFile(utf8Uint8ArrayToString(dataFile.data), contactListId);
		} catch (e) {
			console.log(e);
			throw new UserError("errorDuringFileOpen_msg");
		}
	}
	async importCalendar(file) {
		file = (await this.cryptoFacade.enforceSessionKeyUpdateIfNeeded(this._mail, [file]))[0];
		try {
			const { importCalendarFile, parseCalendarFile } = await import("./CalendarImporter2-chunk.js");
			const dataFile = await this.fileController.getAsDataFile(file);
			const data = parseCalendarFile(dataFile);
			await importCalendarFile(await mailLocator.calendarModel(), this.logins.getUserController(), data.contents);
		} catch (e) {
			console.log(e);
			throw new UserError("errorDuringFileOpen_msg");
		}
	}
	canImportFile(file) {
		if (!this.logins.isInternalUserLoggedIn() || file.mimeType == null) return false;
		const attachmentType = getAttachmentType(file.mimeType);
		return attachmentType === AttachmentType.CONTACT || attachmentType === AttachmentType.CALENDAR;
	}
	canReplyAll() {
		return this.logins.getUserController().isInternalUser() && this.getToRecipients().length + this.getCcRecipients().length + this.getBccRecipients().length > 1;
	}
	canForwardOrMove() {
		return this.logins.getUserController().isInternalUser();
	}
	shouldDelayRendering() {
		return this.renderIsDelayed;
	}
	isCollapsed() {
		return this.collapsed;
	}
	expandMail(delayBodyRendering) {
		this.loadAll(delayBodyRendering, { notify: true });
		if (this.isUnread()) this.logins.waitForFullLogin().then(() => this.setUnread(false));
		this.collapsed = false;
	}
	collapseMail() {
		this.collapsed = true;
	}
	getLabels() {
		return this.mailModel.getLabelsForMail(this.mail);
	}
	getMailOwnerGroup() {
		return this.mail._ownerGroup;
	}
	updateMail({ mail, showFolder }) {
		if (!isSameId(mail._id, this.mail._id)) throw new ProgrammingError(`Trying to update MailViewerViewModel with unrelated email ${JSON.stringify(this.mail._id)} ${JSON.stringify(mail._id)} ${mithril_default.route.get()}`);
		this._mail = mail;
		this.folderMailboxText = null;
		if (showFolder) this.showFolder();
		this.relevantRecipient = null;
		this.determineRelevantRecipient();
		this.loadAll(Promise.resolve(), { notify: true });
	}
};

//#endregion
export { ContentBlockingStatus, MailFilterType, MailViewerViewModel, canDoDragAndDropExport, downloadMailBundle, editDraft, exportMails, generateExportFileName, generateMailFile, getMailExportMode, getMailFilterForType, getSenderOrRecipientHeading, isRepliedTo, mailViewerMoreActions, makeMailBundle, showHeaderDialog, showSourceDialog };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbFZpZXdlclZpZXdNb2RlbC1jaHVuay5qcyIsIm5hbWVzIjpbInZub2RlOiBWbm9kZTxTb3VyY2VDb2RlVmlld2VyQXR0cnM+IiwiaGVhZGVyc1Byb21pc2U6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4iLCJzdGF0ZTogeyBzdGF0ZTogXCJsb2FkaW5nXCIgfSB8IHsgc3RhdGU6IFwibG9hZGVkXCI7IGhlYWRlcnM6IHN0cmluZyB8IG51bGwgfSIsIm1haWxIZWFkZXJzRGlhbG9nOiBEaWFsb2ciLCJtYWlsRmFjYWRlOiBNYWlsRmFjYWRlIiwibWFpbDogTWFpbCIsInZpZXdNb2RlbDogTWFpbFZpZXdlclZpZXdNb2RlbCIsInJhd0h0bWw6IHN0cmluZyIsInNob3dSZWFkQnV0dG9uOiBib29sZWFuIiwibW9yZUJ1dHRvbnM6IEFycmF5PERyb3Bkb3duQnV0dG9uQXR0cnM+IiwicmVwb3J0VHlwZTogTWFpbFJlcG9ydFR5cGUiLCJtIiwiYWRkcmVzczogc3RyaW5nIiwicHJlZmVyTmFtZU9ubHk6IGJvb2xlYW4iLCJmaWx0ZXI6IE1haWxGaWx0ZXJUeXBlIHwgbnVsbCIsInNhbml0aXplcjogSHRtbFNhbml0aXplciIsIm1haWw6IE1haWwiLCJtYWlsRGV0YWlsczogTWFpbERldGFpbHMiLCJhdHRhY2htZW50czogQXJyYXk8RGF0YUZpbGU+IiwibWFpbEZhY2FkZTogTWFpbEZhY2FkZSIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50IiwiZmlsZUNvbnRyb2xsZXI6IEZpbGVDb250cm9sbGVyIiwiY3J5cHRvRmFjYWRlOiBDcnlwdG9GYWNhZGUiLCJtYWlsOiBNYWlsQnVuZGxlIiwiZmlsZU5hbWU6IHN0cmluZyIsImRhdGU6IERhdGUiLCJsaW5lczogc3RyaW5nW10iLCJrZXk6IHN0cmluZyIsInJlY2lwaWVudHM6IE1haWxCdW5kbGVSZWNpcGllbnRbXSIsIm5hbWU6IHN0cmluZyIsInN0cmluZzogc3RyaW5nIiwiaWQ6IHN0cmluZyIsInN1YmplY3Q6IHN0cmluZyIsInNlbnRPbjogRGF0ZSIsIm1vZGU6IE1haWxFeHBvcnRNb2RlIiwiYnVuZGxlOiBNYWlsQnVuZGxlIiwiZmlsZU5hbWU6IHN0cmluZyIsIm1vZGU6IE1haWxFeHBvcnRNb2RlIiwibWFpbHM6IEFycmF5PE1haWw+IiwibWFpbEZhY2FkZTogTWFpbEZhY2FkZSIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50IiwiZmlsZUNvbnRyb2xsZXI6IEZpbGVDb250cm9sbGVyIiwiY3J5cHRvRmFjYWRlOiBDcnlwdG9GYWNhZGUiLCJvcGVyYXRpb25JZD86IE9wZXJhdGlvbklkIiwic2lnbmFsPzogQWJvcnRTaWduYWwiLCJlcnJvck1haWxzOiBNYWlsW10iLCJkYXRhRmlsZXM6IERhdGFGaWxlW10iLCJfbWFpbDogTWFpbCIsInNob3dGb2xkZXI6IGJvb2xlYW4iLCJlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCIsIm1haWxib3hNb2RlbDogTWFpbGJveE1vZGVsIiwibWFpbE1vZGVsOiBNYWlsTW9kZWwiLCJjb250YWN0TW9kZWw6IENvbnRhY3RNb2RlbCIsImNvbmZpZ0ZhY2FkZTogQ29uZmlndXJhdGlvbkRhdGFiYXNlIiwiZmlsZUNvbnRyb2xsZXI6IEZpbGVDb250cm9sbGVyIiwibG9naW5zOiBMb2dpbkNvbnRyb2xsZXIiLCJzZW5kTWFpbE1vZGVsRmFjdG9yeTogKG1haWxib3hEZXRhaWxzOiBNYWlsYm94RGV0YWlsKSA9PiBQcm9taXNlPFNlbmRNYWlsTW9kZWw+IiwiZXZlbnRDb250cm9sbGVyOiBFdmVudENvbnRyb2xsZXIiLCJ3b3JrZXJGYWNhZGU6IFdvcmtlckZhY2FkZSIsInNlYXJjaE1vZGVsOiBTZWFyY2hNb2RlbCIsIm1haWxGYWNhZGU6IE1haWxGYWNhZGUiLCJjcnlwdG9GYWNhZGU6IENyeXB0b0ZhY2FkZSIsImNvbnRhY3RJbXBvcnRlcjogbGF6eUFzeW5jPENvbnRhY3RJbXBvcnRlcj4iLCJldmVudHM6IEVudGl0eVVwZGF0ZURhdGFbXSIsImRlbGF5OiBQcm9taXNlPHVua25vd24+Iiwic3RhdHVzOiBNYWlsUGhpc2hpbmdTdGF0dXMiLCJzdGF0dXM6IE1haWxBdXRoZW50aWNhdGlvblN0YXR1cyIsImRpc21pc3NlZDogYm9vbGVhbiIsInN0YXR1czogQ29udGVudEJsb2NraW5nU3RhdHVzIiwicmVwb3J0VHlwZTogTWFpbFJlcG9ydFR5cGUiLCJ1bnJlYWQ6IGJvb2xlYW4iLCJtYWlsOiBNYWlsIiwiZGVsYXlCb2R5UmVuZGVyaW5nVW50aWw6IFByb21pc2U8dW5rbm93bj4iLCJpc0RyYWZ0IiwiaW5saW5lQ2lkczogc3RyaW5nW10iLCJsaW5rczogQXJyYXk8SFRNTEVsZW1lbnQ+IiwiZmlsZXM6IEFycmF5PFR1dGFub3RhRmlsZT4iLCJhZGRyZXNzZXNJbk1haWw6IE1haWxBZGRyZXNzW10iLCJyZWNpcGllbnRzOiBNYWlsQWRkcmVzc1tdIiwicmVwbHlUb3M6IEVuY3J5cHRlZE1haWxBZGRyZXNzW10iLCJhZGRTaWduYXR1cmU6IGJvb2xlYW4iLCJyZXBseUFsbDogYm9vbGVhbiIsInRvUmVjaXBpZW50czogTWFpbEFkZHJlc3NbXSIsImNjUmVjaXBpZW50czogTWFpbEFkZHJlc3NbXSIsImJjY1JlY2lwaWVudHM6IE1haWxBZGRyZXNzW10iLCJibG9ja0V4dGVybmFsQ29udGVudDogYm9vbGVhbiIsImZpbGU6IFR1dGFub3RhRmlsZSIsIm9wZW46IGJvb2xlYW4iLCJkZWxheUJvZHlSZW5kZXJpbmc6IFByb21pc2U8dW5rbm93bj4iXSwic291cmNlcyI6WyIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L1NvdXJjZUNvZGVWaWV3ZXIudHMiLCIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L01haWxWaWV3ZXJVdGlscy50cyIsIi4uL3NyYy9tYWlsLWFwcC9tYWlsL2V4cG9ydC9CdW5kbGVyLnRzIiwiLi4vc3JjL21haWwtYXBwL21haWwvZXhwb3J0L2VtbFV0aWxzLnRzIiwiLi4vc3JjL21haWwtYXBwL21haWwvZXhwb3J0L0V4cG9ydGVyLnRzIiwiLi4vc3JjL21haWwtYXBwL21haWwvdmlldy9NYWlsVmlld2VyVmlld01vZGVsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtLCB7IENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5cbmV4cG9ydCB0eXBlIFNvdXJjZUNvZGVWaWV3ZXJBdHRycyA9IHtcblx0cmF3SHRtbDogc3RyaW5nXG59XG5cbmV4cG9ydCBjbGFzcyBTb3VyY2VDb2RlVmlld2VyIGltcGxlbWVudHMgQ29tcG9uZW50PFNvdXJjZUNvZGVWaWV3ZXJBdHRycz4ge1xuXHR2aWV3KHZub2RlOiBWbm9kZTxTb3VyY2VDb2RlVmlld2VyQXR0cnM+KSB7XG5cdFx0Y29uc3QgeyByYXdIdG1sIH0gPSB2bm9kZS5hdHRyc1xuXHRcdHJldHVybiBtKFwicC5zZWxlY3RhYmxlXCIsIHJhd0h0bWwpXG5cdH1cbn1cbiIsImltcG9ydCB7IEtleXMsIE1haWxSZXBvcnRUeXBlLCBNYWlsU3RhdGUsIFJlcGx5VHlwZSwgU1lTVEVNX0dST1VQX01BSUxfQUREUkVTUyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCBuZXZlck51bGwsIG9mQ2xhc3MgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEluZm9MaW5rLCBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCBtIGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IEJ1dHRvbiwgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB7IHByb2dyZXNzSWNvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbi5qc1wiXG5pbXBvcnQgeyBjaGVja0FwcHJvdmFsU3RhdHVzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xvZ2luVXRpbHMuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1VzZXJFcnJvci5qc1wiXG5pbXBvcnQgeyBzaG93VXNlckVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0Vycm9ySGFuZGxlckltcGwuanNcIlxuaW1wb3J0IHsgQ29udGVudEJsb2NraW5nU3RhdHVzLCBNYWlsVmlld2VyVmlld01vZGVsIH0gZnJvbSBcIi4vTWFpbFZpZXdlclZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBEcm9wZG93bkJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnMuanNcIlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0NsaWVudERldGVjdG9yLmpzXCJcbmltcG9ydCB7IHNob3dQcm9ncmVzc0RpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2cuanNcIlxuaW1wb3J0IHsgTG9ja2VkRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yLmpzXCJcbmltcG9ydCB7IGlmQWxsb3dlZFR1dGFMaW5rcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvR3VpVXRpbHMuanNcIlxuaW1wb3J0IHsgRXh0ZXJuYWxMaW5rIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9FeHRlcm5hbExpbmsuanNcIlxuaW1wb3J0IHsgU291cmNlQ29kZVZpZXdlciB9IGZyb20gXCIuL1NvdXJjZUNvZGVWaWV3ZXIuanNcIlxuaW1wb3J0IHsgZ2V0TWFpbEFkZHJlc3NEaXNwbGF5VGV4dCwgaGFzVmFsaWRFbmNyeXB0aW9uQXV0aEZvclRlYW1PclN5c3RlbU1haWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L1NoYXJlZE1haWxVdGlscy5qc1wiXG5pbXBvcnQgeyBtYWlsTG9jYXRvciB9IGZyb20gXCIuLi8uLi9tYWlsTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBNYWlsLCBNYWlsRGV0YWlscyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGdldERpc3BsYXllZFNlbmRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9Db21tb25NYWlsVXRpbHMuanNcIlxuaW1wb3J0IHsgTWFpbEZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvTWFpbEZhY2FkZS5qc1wiXG5cbmltcG9ydCB7IExpc3RGaWx0ZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGlzdE1vZGVsLmpzXCJcbmltcG9ydCB7IGlzRGVza3RvcCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9FbnYuanNcIlxuaW1wb3J0IHsgaXNEcmFmdCB9IGZyb20gXCIuLi9tb2RlbC9NYWlsQ2hlY2tzLmpzXCJcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNob3dIZWFkZXJEaWFsb2coaGVhZGVyc1Byb21pc2U6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4pIHtcblx0bGV0IHN0YXRlOiB7IHN0YXRlOiBcImxvYWRpbmdcIiB9IHwgeyBzdGF0ZTogXCJsb2FkZWRcIjsgaGVhZGVyczogc3RyaW5nIHwgbnVsbCB9ID0geyBzdGF0ZTogXCJsb2FkaW5nXCIgfVxuXG5cdGhlYWRlcnNQcm9taXNlLnRoZW4oKGhlYWRlcnMpID0+IHtcblx0XHRzdGF0ZSA9IHsgc3RhdGU6IFwibG9hZGVkXCIsIGhlYWRlcnMgfVxuXHRcdG0ucmVkcmF3KClcblx0fSlcblxuXHRsZXQgbWFpbEhlYWRlcnNEaWFsb2c6IERpYWxvZ1xuXHRjb25zdCBjbG9zZUhlYWRlcnNBY3Rpb24gPSAoKSA9PiB7XG5cdFx0bWFpbEhlYWRlcnNEaWFsb2c/LmNsb3NlKClcblx0fVxuXG5cdG1haWxIZWFkZXJzRGlhbG9nID0gRGlhbG9nLmxhcmdlRGlhbG9nKFxuXHRcdHtcblx0XHRcdHJpZ2h0OiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsYWJlbDogXCJva19hY3Rpb25cIixcblx0XHRcdFx0XHRjbGljazogY2xvc2VIZWFkZXJzQWN0aW9uLFxuXHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHRcdG1pZGRsZTogXCJtYWlsSGVhZGVyc190aXRsZVwiLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dmlldzogKCkgPT5cblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIi53aGl0ZS1zcGFjZS1wcmUucHQucGIuc2VsZWN0YWJsZVwiLFxuXHRcdFx0XHRcdHN0YXRlLnN0YXRlID09PSBcImxvYWRpbmdcIiA/IG0oXCIuY2VudGVyXCIsIHByb2dyZXNzSWNvbigpKSA6IHN0YXRlLmhlYWRlcnMgPz8gbShcIi5jZW50ZXJcIiwgbGFuZy5nZXQoXCJub0VudHJpZXNfbXNnXCIpKSxcblx0XHRcdFx0KSxcblx0XHR9LFxuXHQpXG5cdFx0LmFkZFNob3J0Y3V0KHtcblx0XHRcdGtleTogS2V5cy5FU0MsXG5cdFx0XHRleGVjOiBjbG9zZUhlYWRlcnNBY3Rpb24sXG5cdFx0XHRoZWxwOiBcImNsb3NlX2FsdFwiLFxuXHRcdH0pXG5cdFx0LnNldENsb3NlSGFuZGxlcihjbG9zZUhlYWRlcnNBY3Rpb24pXG5cdFx0LnNob3coKVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZE1haWxEZXRhaWxzKG1haWxGYWNhZGU6IE1haWxGYWNhZGUsIG1haWw6IE1haWwpOiBQcm9taXNlPE1haWxEZXRhaWxzPiB7XG5cdGlmIChpc0RyYWZ0KG1haWwpKSB7XG5cdFx0Y29uc3QgZGV0YWlsc0RyYWZ0SWQgPSBhc3NlcnROb3ROdWxsKG1haWwubWFpbERldGFpbHNEcmFmdClcblx0XHRyZXR1cm4gbWFpbEZhY2FkZS5sb2FkTWFpbERldGFpbHNEcmFmdChtYWlsKVxuXHR9IGVsc2Uge1xuXHRcdGNvbnN0IG1haWxEZXRhaWxzSWQgPSBuZXZlck51bGwobWFpbC5tYWlsRGV0YWlscylcblx0XHRyZXR1cm4gbWFpbEZhY2FkZS5sb2FkTWFpbERldGFpbHNCbG9iKG1haWwpXG5cdH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVkaXREcmFmdCh2aWV3TW9kZWw6IE1haWxWaWV3ZXJWaWV3TW9kZWwpOiBQcm9taXNlPHZvaWQ+IHtcblx0Y29uc3Qgc2VuZEFsbG93ZWQgPSBhd2FpdCBjaGVja0FwcHJvdmFsU3RhdHVzKGxvY2F0b3IubG9naW5zLCBmYWxzZSlcblx0aWYgKHNlbmRBbGxvd2VkKSB7XG5cdFx0Ly8gY2hlY2sgaWYgdG8gYmUgb3BlbmVkIGRyYWZ0IGhhcyBhbHJlYWR5IGJlZW4gbWluaW1pemVkLCBpZmYgdGhhdCBpcyB0aGUgY2FzZSwgcmUtb3BlbiBpdFxuXHRcdGNvbnN0IG1pbmltaXplZEVkaXRvciA9IG1haWxMb2NhdG9yLm1pbmltaXplZE1haWxNb2RlbC5nZXRFZGl0b3JGb3JEcmFmdCh2aWV3TW9kZWwubWFpbClcblxuXHRcdGlmIChtaW5pbWl6ZWRFZGl0b3IpIHtcblx0XHRcdG1haWxMb2NhdG9yLm1pbmltaXplZE1haWxNb2RlbC5yZW9wZW5NaW5pbWl6ZWRFZGl0b3IobWluaW1pemVkRWRpdG9yKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCBbbWFpbGJveERldGFpbHMsIHsgbmV3TWFpbEVkaXRvckZyb21EcmFmdCB9XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRcdFx0XHR2aWV3TW9kZWwubWFpbE1vZGVsLmdldE1haWxib3hEZXRhaWxzRm9yTWFpbCh2aWV3TW9kZWwubWFpbCksXG5cdFx0XHRcdFx0aW1wb3J0KFwiLi4vZWRpdG9yL01haWxFZGl0b3JcIiksXG5cdFx0XHRcdF0pXG5cdFx0XHRcdGlmIChtYWlsYm94RGV0YWlscyA9PSBudWxsKSB7XG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgZWRpdG9yRGlhbG9nID0gYXdhaXQgbmV3TWFpbEVkaXRvckZyb21EcmFmdChcblx0XHRcdFx0XHR2aWV3TW9kZWwubWFpbCxcblx0XHRcdFx0XHRhd2FpdCBsb2FkTWFpbERldGFpbHMobG9jYXRvci5tYWlsRmFjYWRlLCB2aWV3TW9kZWwubWFpbCksXG5cdFx0XHRcdFx0dmlld01vZGVsLmdldEF0dGFjaG1lbnRzKCksXG5cdFx0XHRcdFx0dmlld01vZGVsLmdldExvYWRlZElubGluZUltYWdlcygpLFxuXHRcdFx0XHRcdHZpZXdNb2RlbC5pc0Jsb2NraW5nRXh0ZXJuYWxJbWFnZXMoKSxcblx0XHRcdFx0XHRtYWlsYm94RGV0YWlscyxcblx0XHRcdFx0KVxuXHRcdFx0XHRlZGl0b3JEaWFsb2cuc2hvdygpXG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgVXNlckVycm9yKSB7XG5cdFx0XHRcdFx0YXdhaXQgc2hvd1VzZXJFcnJvcihlKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvd1NvdXJjZURpYWxvZyhyYXdIdG1sOiBzdHJpbmcpIHtcblx0cmV0dXJuIERpYWxvZy52aWV3ZXJEaWFsb2coXCJlbWFpbFNvdXJjZUNvZGVfdGl0bGVcIiwgU291cmNlQ29kZVZpZXdlciwgeyByYXdIdG1sIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWlsVmlld2VyTW9yZUFjdGlvbnModmlld01vZGVsOiBNYWlsVmlld2VyVmlld01vZGVsLCBzaG93UmVhZEJ1dHRvbjogYm9vbGVhbiA9IHRydWUpOiBBcnJheTxEcm9wZG93bkJ1dHRvbkF0dHJzPiB7XG5cdGNvbnN0IG1vcmVCdXR0b25zOiBBcnJheTxEcm9wZG93bkJ1dHRvbkF0dHJzPiA9IFtdXG5cdGlmIChzaG93UmVhZEJ1dHRvbikge1xuXHRcdGlmICh2aWV3TW9kZWwuaXNVbnJlYWQoKSkge1xuXHRcdFx0bW9yZUJ1dHRvbnMucHVzaCh7XG5cdFx0XHRcdGxhYmVsOiBcIm1hcmtSZWFkX2FjdGlvblwiLFxuXHRcdFx0XHRjbGljazogKCkgPT4gdmlld01vZGVsLnNldFVucmVhZChmYWxzZSksXG5cdFx0XHRcdGljb246IEljb25zLkV5ZSxcblx0XHRcdH0pXG5cdFx0fSBlbHNlIHtcblx0XHRcdG1vcmVCdXR0b25zLnB1c2goe1xuXHRcdFx0XHRsYWJlbDogXCJtYXJrVW5yZWFkX2FjdGlvblwiLFxuXHRcdFx0XHRjbGljazogKCkgPT4gdmlld01vZGVsLnNldFVucmVhZCh0cnVlKSxcblx0XHRcdFx0aWNvbjogSWNvbnMuTm9FeWUsXG5cdFx0XHR9KVxuXHRcdH1cblx0fVxuXG5cdGlmICh2aWV3TW9kZWwuY2FuUGVyc2lzdEJsb2NraW5nU3RhdHVzKCkgJiYgdmlld01vZGVsLmlzU2hvd2luZ0V4dGVybmFsQ29udGVudCgpKSB7XG5cdFx0bW9yZUJ1dHRvbnMucHVzaCh7XG5cdFx0XHRsYWJlbDogXCJkaXNhbGxvd0V4dGVybmFsQ29udGVudF9hY3Rpb25cIixcblx0XHRcdGNsaWNrOiAoKSA9PiB2aWV3TW9kZWwuc2V0Q29udGVudEJsb2NraW5nU3RhdHVzKENvbnRlbnRCbG9ja2luZ1N0YXR1cy5CbG9jayksXG5cdFx0XHRpY29uOiBJY29ucy5QaWN0dXJlLFxuXHRcdH0pXG5cdH1cblxuXHRpZiAodmlld01vZGVsLmNhblBlcnNpc3RCbG9ja2luZ1N0YXR1cygpICYmIHZpZXdNb2RlbC5pc0Jsb2NraW5nRXh0ZXJuYWxJbWFnZXMoKSkge1xuXHRcdG1vcmVCdXR0b25zLnB1c2goe1xuXHRcdFx0bGFiZWw6IFwic2hvd0ltYWdlc19hY3Rpb25cIixcblx0XHRcdGNsaWNrOiAoKSA9PiB2aWV3TW9kZWwuc2V0Q29udGVudEJsb2NraW5nU3RhdHVzKENvbnRlbnRCbG9ja2luZ1N0YXR1cy5TaG93KSxcblx0XHRcdGljb246IEljb25zLlBpY3R1cmUsXG5cdFx0fSlcblx0fVxuXG5cdGlmICh2aWV3TW9kZWwuaXNMaXN0VW5zdWJzY3JpYmUoKSkge1xuXHRcdG1vcmVCdXR0b25zLnB1c2goe1xuXHRcdFx0bGFiZWw6IFwidW5zdWJzY3JpYmVfYWN0aW9uXCIsXG5cdFx0XHRjbGljazogKCkgPT4gdW5zdWJzY3JpYmUodmlld01vZGVsKSxcblx0XHRcdGljb246IEljb25zLkNhbmNlbCxcblx0XHR9KVxuXHR9XG5cblx0aWYgKCFjbGllbnQuaXNNb2JpbGVEZXZpY2UoKSAmJiB2aWV3TW9kZWwuY2FuRXhwb3J0KCkpIHtcblx0XHRtb3JlQnV0dG9ucy5wdXNoKHtcblx0XHRcdGxhYmVsOiBcImV4cG9ydF9hY3Rpb25cIixcblx0XHRcdGNsaWNrOiAoKSA9PiBzaG93UHJvZ3Jlc3NEaWFsb2coXCJwbGVhc2VXYWl0X21zZ1wiLCB2aWV3TW9kZWwuZXhwb3J0TWFpbCgpKSxcblx0XHRcdGljb246IEljb25zLkV4cG9ydCxcblx0XHR9KVxuXHR9XG5cblx0aWYgKCFjbGllbnQuaXNNb2JpbGVEZXZpY2UoKSAmJiB0eXBlb2Ygd2luZG93LnByaW50ID09PSBcImZ1bmN0aW9uXCIgJiYgdmlld01vZGVsLmNhblByaW50KCkpIHtcblx0XHRtb3JlQnV0dG9ucy5wdXNoKHtcblx0XHRcdGxhYmVsOiBcInByaW50X2FjdGlvblwiLFxuXHRcdFx0Y2xpY2s6ICgpID0+IHdpbmRvdy5wcmludCgpLFxuXHRcdFx0aWNvbjogSWNvbnMuUHJpbnQsXG5cdFx0fSlcblx0fVxuXG5cdGlmICh2aWV3TW9kZWwuY2FuU2hvd0hlYWRlcnMoKSkge1xuXHRcdG1vcmVCdXR0b25zLnB1c2goe1xuXHRcdFx0bGFiZWw6IFwic2hvd0hlYWRlcnNfYWN0aW9uXCIsXG5cdFx0XHRjbGljazogKCkgPT4gc2hvd0hlYWRlckRpYWxvZyh2aWV3TW9kZWwuZ2V0SGVhZGVycygpKSxcblx0XHRcdGljb246IEljb25zLkxpc3RVbm9yZGVyZWQsXG5cdFx0fSlcblx0fVxuXG5cdGlmICh2aWV3TW9kZWwuY2FuUmVwb3J0KCkpIHtcblx0XHRtb3JlQnV0dG9ucy5wdXNoKHtcblx0XHRcdGxhYmVsOiBcInJlcG9ydEVtYWlsX2FjdGlvblwiLFxuXHRcdFx0Y2xpY2s6ICgpID0+IHJlcG9ydE1haWwodmlld01vZGVsKSxcblx0XHRcdGljb246IEljb25zLldhcm5pbmcsXG5cdFx0fSlcblx0fVxuXG5cdC8vIGFkZGluZyBtb3JlIG9wdGlvbmFsIGJ1dHRvbnM/IHB1dCB0aGVtIGFib3ZlIHRoZSByZXBvcnQgYWN0aW9uIHNvIHRoZSBuZXcgYnV0dG9uXG5cdC8vIGlzIG5vdCBzb21ldGltZXMgd2hlcmUgdGhlIHJlcG9ydCBhY3Rpb24gdXN1YWxseSBzaXRzLlxuXG5cdHJldHVybiBtb3JlQnV0dG9uc1xufVxuXG5mdW5jdGlvbiB1bnN1YnNjcmliZSh2aWV3TW9kZWw6IE1haWxWaWV3ZXJWaWV3TW9kZWwpOiBQcm9taXNlPHZvaWQ+IHtcblx0cmV0dXJuIHNob3dQcm9ncmVzc0RpYWxvZyhcInBsZWFzZVdhaXRfbXNnXCIsIHZpZXdNb2RlbC51bnN1YnNjcmliZSgpKVxuXHRcdC50aGVuKChzdWNjZXNzKSA9PiB7XG5cdFx0XHRpZiAoc3VjY2Vzcykge1xuXHRcdFx0XHRyZXR1cm4gRGlhbG9nLm1lc3NhZ2UoXCJ1bnN1YnNjcmliZVN1Y2Nlc3NmdWxfbXNnXCIpXG5cdFx0XHR9XG5cdFx0fSlcblx0XHQuY2F0Y2goKGUpID0+IHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgTG9ja2VkRXJyb3IpIHtcblx0XHRcdFx0cmV0dXJuIERpYWxvZy5tZXNzYWdlKFwib3BlcmF0aW9uU3RpbGxBY3RpdmVfbXNnXCIpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gRGlhbG9nLm1lc3NhZ2UoXCJ1bnN1YnNjcmliZUZhaWxlZF9tc2dcIilcblx0XHRcdH1cblx0XHR9KVxufVxuXG5mdW5jdGlvbiByZXBvcnRNYWlsKHZpZXdNb2RlbDogTWFpbFZpZXdlclZpZXdNb2RlbCkge1xuXHRjb25zdCBzZW5kUmVwb3J0ID0gKHJlcG9ydFR5cGU6IE1haWxSZXBvcnRUeXBlKSA9PiB7XG5cdFx0dmlld01vZGVsXG5cdFx0XHQucmVwb3J0TWFpbChyZXBvcnRUeXBlKVxuXHRcdFx0LmNhdGNoKG9mQ2xhc3MoTG9ja2VkRXJyb3IsICgpID0+IERpYWxvZy5tZXNzYWdlKFwib3BlcmF0aW9uU3RpbGxBY3RpdmVfbXNnXCIpKSlcblx0XHRcdC5maW5hbGx5KG0ucmVkcmF3KVxuXHR9XG5cblx0Y29uc3QgZGlhbG9nID0gRGlhbG9nLnNob3dBY3Rpb25EaWFsb2coe1xuXHRcdHRpdGxlOiBcInJlcG9ydEVtYWlsX2FjdGlvblwiLFxuXHRcdGNoaWxkOiAoKSA9PlxuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleC5jb2wubXQtbVwiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly8gU28gdGhhdCBzcGFjZSBiZWxvdyBidXR0b25zIGRvZXNuJ3QgbG9vayBodWdlXG5cdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdG1hcmdpbkJvdHRvbTogXCItMTBweFwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHRtKFwiZGl2XCIsIGxhbmcuZ2V0KFwicGhpc2hpbmdSZXBvcnRfbXNnXCIpKSxcblx0XHRcdFx0XHRpZkFsbG93ZWRUdXRhTGlua3MobG9jYXRvci5sb2dpbnMsIEluZm9MaW5rLlBoaXNoaW5nLCAobGluaykgPT5cblx0XHRcdFx0XHRcdG0oRXh0ZXJuYWxMaW5rLCB7XG5cdFx0XHRcdFx0XHRcdGhyZWY6IGxpbmssXG5cdFx0XHRcdFx0XHRcdHRleHQ6IGxhbmcuZ2V0KFwid2hhdElzUGhpc2hpbmdfbXNnXCIpLFxuXHRcdFx0XHRcdFx0XHRpc0NvbXBhbnlTaXRlOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRjbGFzczogXCJtdC1zXCIsXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdG0oXCIuZmxleC13cmFwLmZsZXgtZW5kXCIsIFtcblx0XHRcdFx0XHRcdG0oQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRcdGxhYmVsOiBcInJlcG9ydFBoaXNoaW5nX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdHNlbmRSZXBvcnQoTWFpbFJlcG9ydFR5cGUuUEhJU0hJTkcpXG5cdFx0XHRcdFx0XHRcdFx0ZGlhbG9nLmNsb3NlKClcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdG0oQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRcdGxhYmVsOiBcInJlcG9ydFNwYW1fYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0c2VuZFJlcG9ydChNYWlsUmVwb3J0VHlwZS5TUEFNKVxuXHRcdFx0XHRcdFx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XSksXG5cdFx0XHRcdF0sXG5cdFx0XHQpLFxuXHRcdG9rQWN0aW9uOiBudWxsLFxuXHR9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOb1JlcGx5VGVhbUFkZHJlc3MoYWRkcmVzczogc3RyaW5nKTogYm9vbGVhbiB7XG5cdHJldHVybiBhZGRyZXNzID09PSBcIm5vLXJlcGx5QHR1dGFvLmRlXCIgfHwgYWRkcmVzcyA9PT0gXCJuby1yZXBseUB0dXRhbm90YS5kZVwiXG59XG5cbi8qKlxuICogSXMgdGhpcyBhIHN5c3RlbSBub3RpZmljYXRpb24/XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N5c3RlbU5vdGlmaWNhdGlvbihtYWlsOiBNYWlsKTogYm9vbGVhbiB7XG5cdGNvbnN0IHsgY29uZmlkZW50aWFsLCBzZW5kZXIsIHN0YXRlIH0gPSBtYWlsXG5cdHJldHVybiAoXG5cdFx0c3RhdGUgPT09IE1haWxTdGF0ZS5SRUNFSVZFRCAmJlxuXHRcdGNvbmZpZGVudGlhbCAmJlxuXHRcdGhhc1ZhbGlkRW5jcnlwdGlvbkF1dGhGb3JUZWFtT3JTeXN0ZW1NYWlsKG1haWwpICYmXG5cdFx0KHNlbmRlci5hZGRyZXNzID09PSBTWVNURU1fR1JPVVBfTUFJTF9BRERSRVNTIHx8XG5cdFx0XHQvLyBOZXcgZW1haWxzIHdpbGwgaGF2ZSBzZW5kZXIgc2V0IHRvIHN5c3RlbSBhbmQgd2lsbCBvbmx5IGhhdmUgcmVwbHlUbyBzZXQgdG8gbm8tcmVwbHlcblx0XHRcdC8vIGJ1dCB3ZSBzaG91bGQga2VlcCBkaXNwbGF5aW5nIG9sZCBlbWFpbHMgY29ycmVjdGx5LlxuXHRcdFx0aXNOb1JlcGx5VGVhbUFkZHJlc3Moc2VuZGVyLmFkZHJlc3MpKVxuXHQpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZWNpcGllbnRIZWFkaW5nKG1haWw6IE1haWwsIHByZWZlck5hbWVPbmx5OiBib29sZWFuKSB7XG5cdGxldCByZWNpcGllbnRDb3VudCA9IHBhcnNlSW50KG1haWwucmVjaXBpZW50Q291bnQpXG5cdGlmIChyZWNpcGllbnRDb3VudCA+IDApIHtcblx0XHRsZXQgcmVjaXBpZW50ID0gbmV2ZXJOdWxsKG1haWwuZmlyc3RSZWNpcGllbnQpXG5cdFx0cmV0dXJuIGdldE1haWxBZGRyZXNzRGlzcGxheVRleHQocmVjaXBpZW50Lm5hbWUsIHJlY2lwaWVudC5hZGRyZXNzLCBwcmVmZXJOYW1lT25seSkgKyAocmVjaXBpZW50Q291bnQgPiAxID8gXCIsIC4uLlwiIDogXCJcIilcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gXCJcIlxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZW5kZXJPclJlY2lwaWVudEhlYWRpbmcobWFpbDogTWFpbCwgcHJlZmVyTmFtZU9ubHk6IGJvb2xlYW4pOiBzdHJpbmcge1xuXHRpZiAoaXNTeXN0ZW1Ob3RpZmljYXRpb24obWFpbCkpIHtcblx0XHRyZXR1cm4gXCJcIlxuXHR9IGVsc2UgaWYgKG1haWwuc3RhdGUgPT09IE1haWxTdGF0ZS5SRUNFSVZFRCkge1xuXHRcdGNvbnN0IHNlbmRlciA9IGdldERpc3BsYXllZFNlbmRlcihtYWlsKVxuXHRcdHJldHVybiBnZXRNYWlsQWRkcmVzc0Rpc3BsYXlUZXh0KHNlbmRlci5uYW1lLCBzZW5kZXIuYWRkcmVzcywgcHJlZmVyTmFtZU9ubHkpXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIGdldFJlY2lwaWVudEhlYWRpbmcobWFpbCwgcHJlZmVyTmFtZU9ubHkpXG5cdH1cbn1cblxuZXhwb3J0IGVudW0gTWFpbEZpbHRlclR5cGUge1xuXHRVbnJlYWQsXG5cdFJlYWQsXG5cdFdpdGhBdHRhY2htZW50cyxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1haWxGaWx0ZXJGb3JUeXBlKGZpbHRlcjogTWFpbEZpbHRlclR5cGUgfCBudWxsKTogTGlzdEZpbHRlcjxNYWlsPiB8IG51bGwge1xuXHRzd2l0Y2ggKGZpbHRlcikge1xuXHRcdGNhc2UgTWFpbEZpbHRlclR5cGUuUmVhZDpcblx0XHRcdHJldHVybiAobWFpbCkgPT4gIW1haWwudW5yZWFkXG5cdFx0Y2FzZSBNYWlsRmlsdGVyVHlwZS5VbnJlYWQ6XG5cdFx0XHRyZXR1cm4gKG1haWwpID0+IG1haWwudW5yZWFkXG5cdFx0Y2FzZSBNYWlsRmlsdGVyVHlwZS5XaXRoQXR0YWNobWVudHM6XG5cdFx0XHRyZXR1cm4gKG1haWwpID0+IG1haWwuYXR0YWNobWVudHMubGVuZ3RoID4gMFxuXHRcdGNhc2UgbnVsbDpcblx0XHRcdHJldHVybiBudWxsXG5cdH1cbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZ2l2ZW4gbWFpbCB3YXMgYWxyZWFkeSByZXBsaWVkIHRvLiBPdGhlcndpc2UgZmFsc2UuXG4gKiBOb3RlIHRoYXQgaXQgYWxzbyByZXR1cm5zIHRydWUgaWYgdGhlIG1haWwgd2FzIHJlcGxpZWQgdG8gQU5EIGZvcndhcmRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUmVwbGllZFRvKG1haWw6IE1haWwpOiBib29sZWFuIHtcblx0cmV0dXJuIG1haWwucmVwbHlUeXBlID09PSBSZXBseVR5cGUuUkVQTFkgfHwgbWFpbC5yZXBseVR5cGUgPT09IFJlcGx5VHlwZS5SRVBMWV9GT1JXQVJEXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5Eb0RyYWdBbmREcm9wRXhwb3J0KCk6IGJvb2xlYW4ge1xuXHRyZXR1cm4gaXNEZXNrdG9wKClcbn1cbiIsImltcG9ydCB0eXBlIHsgTWFpbCwgTWFpbERldGFpbHMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBGaWxlVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB0eXBlIHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudGl0eUNsaWVudFwiXG5pbXBvcnQgeyBNYWlsU3RhdGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgZ2V0TGV0SWQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHNcIlxuaW1wb3J0IHR5cGUgeyBIdG1sU2FuaXRpemVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0h0bWxTYW5pdGl6ZXJcIlxuaW1wb3J0IHsgcHJvbWlzZU1hcCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgRmlsZUNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2ZpbGUvRmlsZUNvbnRyb2xsZXJcIlxuaW1wb3J0IHsgTWFpbEZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvTWFpbEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBDcnlwdG9GYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvY3J5cHRvL0NyeXB0b0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBnZXREaXNwbGF5ZWRTZW5kZXIsIGdldE1haWxCb2R5VGV4dCwgTWFpbEFkZHJlc3NBbmROYW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0NvbW1vbk1haWxVdGlscy5qc1wiXG5pbXBvcnQgeyBsb2FkTWFpbERldGFpbHMgfSBmcm9tIFwiLi4vdmlldy9NYWlsVmlld2VyVXRpbHMuanNcIlxuaW1wb3J0IHsgTWFpbEJ1bmRsZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvU2hhcmVkTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IERhdGFGaWxlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0RhdGFGaWxlLmpzXCJcblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNYWlsQnVuZGxlKHNhbml0aXplcjogSHRtbFNhbml0aXplciwgbWFpbDogTWFpbCwgbWFpbERldGFpbHM6IE1haWxEZXRhaWxzLCBhdHRhY2htZW50czogQXJyYXk8RGF0YUZpbGU+KTogTWFpbEJ1bmRsZSB7XG5cdGNvbnN0IHJlY2lwaWVudE1hcHBlciA9ICh7IGFkZHJlc3MsIG5hbWUgfTogTWFpbEFkZHJlc3NBbmROYW1lKSA9PiAoeyBhZGRyZXNzLCBuYW1lIH0pXG5cdGNvbnN0IGJvZHkgPSBzYW5pdGl6ZXIuc2FuaXRpemVIVE1MKGdldE1haWxCb2R5VGV4dChtYWlsRGV0YWlscy5ib2R5KSwge1xuXHRcdGJsb2NrRXh0ZXJuYWxDb250ZW50OiBmYWxzZSxcblx0XHRhbGxvd1JlbGF0aXZlTGlua3M6IGZhbHNlLFxuXHRcdHVzZVBsYWNlaG9sZGVyRm9ySW5saW5lSW1hZ2VzOiBmYWxzZSxcblx0fSkuaHRtbFxuXG5cdHJldHVybiB7XG5cdFx0bWFpbElkOiBnZXRMZXRJZChtYWlsKSxcblx0XHRzdWJqZWN0OiBtYWlsLnN1YmplY3QsXG5cdFx0Ym9keSxcblx0XHRzZW5kZXI6IHJlY2lwaWVudE1hcHBlcihnZXREaXNwbGF5ZWRTZW5kZXIobWFpbCkpLFxuXHRcdHRvOiBtYWlsRGV0YWlscy5yZWNpcGllbnRzLnRvUmVjaXBpZW50cy5tYXAocmVjaXBpZW50TWFwcGVyKSxcblx0XHRjYzogbWFpbERldGFpbHMucmVjaXBpZW50cy5jY1JlY2lwaWVudHMubWFwKHJlY2lwaWVudE1hcHBlciksXG5cdFx0YmNjOiBtYWlsRGV0YWlscy5yZWNpcGllbnRzLmJjY1JlY2lwaWVudHMubWFwKHJlY2lwaWVudE1hcHBlciksXG5cdFx0cmVwbHlUbzogbWFpbERldGFpbHMucmVwbHlUb3MubWFwKHJlY2lwaWVudE1hcHBlciksXG5cdFx0aXNEcmFmdDogbWFpbC5zdGF0ZSA9PT0gTWFpbFN0YXRlLkRSQUZULFxuXHRcdGlzUmVhZDogIW1haWwudW5yZWFkLFxuXHRcdHNlbnRPbjogbWFpbERldGFpbHMuc2VudERhdGUuZ2V0VGltZSgpLFxuXHRcdHJlY2VpdmVkT246IG1haWwucmVjZWl2ZWREYXRlLmdldFRpbWUoKSxcblx0XHRoZWFkZXJzOiBtYWlsRGV0YWlscy5oZWFkZXJzPy5jb21wcmVzc2VkSGVhZGVycyA/PyBtYWlsRGV0YWlscy5oZWFkZXJzPy5oZWFkZXJzID8/IG51bGwsXG5cdFx0YXR0YWNobWVudHMsXG5cdH1cbn1cblxuLyoqXG4gKiBEb3dubG9hZHMgdGhlIG1haWwgYm9keSBhbmQgdGhlIGF0dGFjaG1lbnRzIGZvciBhbiBlbWFpbCwgdG8gcHJlcGFyZSBmb3IgZXhwb3J0aW5nXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZE1haWxCdW5kbGUoXG5cdG1haWw6IE1haWwsXG5cdG1haWxGYWNhZGU6IE1haWxGYWNhZGUsXG5cdGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRmaWxlQ29udHJvbGxlcjogRmlsZUNvbnRyb2xsZXIsXG5cdHNhbml0aXplcjogSHRtbFNhbml0aXplcixcblx0Y3J5cHRvRmFjYWRlOiBDcnlwdG9GYWNhZGUsXG4pOiBQcm9taXNlPE1haWxCdW5kbGU+IHtcblx0Y29uc3QgbWFpbERldGFpbHMgPSBhd2FpdCBsb2FkTWFpbERldGFpbHMobWFpbEZhY2FkZSwgbWFpbClcblxuXHRjb25zdCBmaWxlcyA9IGF3YWl0IHByb21pc2VNYXAobWFpbC5hdHRhY2htZW50cywgYXN5bmMgKGZpbGVJZCkgPT4gYXdhaXQgZW50aXR5Q2xpZW50LmxvYWQoRmlsZVR5cGVSZWYsIGZpbGVJZCkpXG5cdGNvbnN0IGF0dGFjaG1lbnRzID0gYXdhaXQgcHJvbWlzZU1hcChcblx0XHRhd2FpdCBjcnlwdG9GYWNhZGUuZW5mb3JjZVNlc3Npb25LZXlVcGRhdGVJZk5lZWRlZChtYWlsLCBmaWxlcyksXG5cdFx0YXN5bmMgKGZpbGUpID0+IGF3YWl0IGZpbGVDb250cm9sbGVyLmdldEFzRGF0YUZpbGUoZmlsZSksXG5cdClcblx0cmV0dXJuIG1ha2VNYWlsQnVuZGxlKHNhbml0aXplciwgbWFpbCwgbWFpbERldGFpbHMsIGF0dGFjaG1lbnRzKVxufVxuIiwiaW1wb3J0IHsgTWFpbEJ1bmRsZSwgTWFpbEJ1bmRsZVJlY2lwaWVudCwgTWFpbEV4cG9ydE1vZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L1NoYXJlZE1haWxVdGlscy5qc1wiXG5pbXBvcnQgeyBjcmVhdGVEYXRhRmlsZSwgRGF0YUZpbGUsIGdldENsZWFuZWRNaW1lVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9EYXRhRmlsZS5qc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCBmb3JtYXRTb3J0YWJsZURhdGVUaW1lLCBwYWQsIHN0cmluZ1RvQmFzZTY0LCBzdHJpbmdUb1V0ZjhVaW50OEFycmF5LCB1aW50OEFycmF5VG9CYXNlNjQgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IHNhbml0aXplRmlsZW5hbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRmlsZVV0aWxzLmpzXCJcblxuZXhwb3J0IGZ1bmN0aW9uIG1haWxUb0VtbEZpbGUobWFpbDogTWFpbEJ1bmRsZSwgZmlsZU5hbWU6IHN0cmluZyk6IERhdGFGaWxlIHtcblx0Y29uc3QgZGF0YSA9IHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkobWFpbFRvRW1sKG1haWwpKVxuXHRyZXR1cm4gY3JlYXRlRGF0YUZpbGUoZmlsZU5hbWUsIFwibWVzc2FnZS9yZmM4MjJcIiwgZGF0YSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9mb3JtYXRTbXRwRGF0ZVRpbWUoZGF0ZTogRGF0ZSk6IHN0cmluZyB7XG5cdGNvbnN0IGRheU5hbWVzID0gW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCJdXG5cdGNvbnN0IG1vbnRoTmFtZXMgPSBbXCJKYW5cIiwgXCJGZWJcIiwgXCJNYXJcIiwgXCJBcHJcIiwgXCJNYXlcIiwgXCJKdW5cIiwgXCJKdWxcIiwgXCJBdWdcIiwgXCJTZXBcIiwgXCJPY3RcIiwgXCJOb3ZcIiwgXCJEZWNcIl1cblx0cmV0dXJuIChcblx0XHRkYXlOYW1lc1tkYXRlLmdldFVUQ0RheSgpXSArXG5cdFx0XCIsIFwiICtcblx0XHRkYXRlLmdldFVUQ0RhdGUoKSArXG5cdFx0XCIgXCIgK1xuXHRcdG1vbnRoTmFtZXNbZGF0ZS5nZXRVVENNb250aCgpXSArXG5cdFx0XCIgXCIgK1xuXHRcdGRhdGUuZ2V0VVRDRnVsbFllYXIoKSArXG5cdFx0XCIgXCIgK1xuXHRcdHBhZChkYXRlLmdldFVUQ0hvdXJzKCksIDIpICtcblx0XHRcIjpcIiArXG5cdFx0cGFkKGRhdGUuZ2V0VVRDTWludXRlcygpLCAyKSArXG5cdFx0XCI6XCIgK1xuXHRcdHBhZChkYXRlLmdldFVUQ1NlY29uZHMoKSwgMikgK1xuXHRcdFwiICswMDAwXCJcblx0KVxufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgbWFpbCBpbnRvIHRoZSBwbGFpbiB0ZXh0IEVNTCBmb3JtYXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYWlsVG9FbWwobWFpbDogTWFpbEJ1bmRsZSk6IHN0cmluZyB7XG5cdGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdXG5cblx0aWYgKG1haWwuaGVhZGVycykge1xuXHRcdGNvbnN0IGZpbHRlcmVkSGVhZGVycyA9IG1haWwuaGVhZGVyc1xuXHRcdFx0Ly8gd2Ugd2FudCB0byBtYWtlIHN1cmUgYWxsIGxpbmUgZW5kaW5ncyBhcmUgZXhhY3RseSBcXHJcXG4gYWZ0ZXIgd2UncmUgZG9uZS5cblx0XHRcdC5zcGxpdCgvXFxyXFxufFxcbi8pXG5cdFx0XHQuZmlsdGVyKChsaW5lKSA9PiAhbGluZS5tYXRjaCgvXlxccyooQ29udGVudC1UeXBlOnxib3VuZGFyeT0pLykpXG5cdFx0bGluZXMucHVzaCguLi5maWx0ZXJlZEhlYWRlcnMpXG5cdH0gZWxzZSB7XG5cdFx0bGluZXMucHVzaChcIkZyb206IFwiICsgbWFpbC5zZW5kZXIuYWRkcmVzcywgXCJNSU1FLVZlcnNpb246IDEuMFwiKVxuXG5cdFx0Y29uc3QgZm9ybWF0UmVjaXBpZW50cyA9IChrZXk6IHN0cmluZywgcmVjaXBpZW50czogTWFpbEJ1bmRsZVJlY2lwaWVudFtdKSA9PlxuXHRcdFx0YCR7a2V5fTogJHtyZWNpcGllbnRzXG5cdFx0XHRcdC5tYXAoKHJlY2lwaWVudCkgPT4gKHJlY2lwaWVudC5uYW1lID8gYCR7ZXNjYXBlU3BlY2lhbENoYXJhY3RlcnMocmVjaXBpZW50Lm5hbWUpfSBgIDogXCJcIikgKyBgPCR7cmVjaXBpZW50LmFkZHJlc3N9PmApXG5cdFx0XHRcdC5qb2luKFwiLFwiKX1gXG5cblx0XHRpZiAobWFpbC50by5sZW5ndGggPiAwKSB7XG5cdFx0XHRsaW5lcy5wdXNoKGZvcm1hdFJlY2lwaWVudHMoXCJUb1wiLCBtYWlsLnRvKSlcblx0XHR9XG5cblx0XHRpZiAobWFpbC5jYy5sZW5ndGggPiAwKSB7XG5cdFx0XHRsaW5lcy5wdXNoKGZvcm1hdFJlY2lwaWVudHMoXCJDQ1wiLCBtYWlsLmNjKSlcblx0XHR9XG5cblx0XHRpZiAobWFpbC5iY2MubGVuZ3RoID4gMCkge1xuXHRcdFx0bGluZXMucHVzaChmb3JtYXRSZWNpcGllbnRzKFwiQkNDXCIsIG1haWwuYmNjKSlcblx0XHR9XG5cblx0XHRsZXQgc3ViamVjdCA9IG1haWwuc3ViamVjdC50cmltKCkgPT09IFwiXCIgPyBcIlwiIDogYD0/VVRGLTg/Qj8ke3VpbnQ4QXJyYXlUb0Jhc2U2NChzdHJpbmdUb1V0ZjhVaW50OEFycmF5KG1haWwuc3ViamVjdCkpfT89YFxuXHRcdGxpbmVzLnB1c2goXG5cdFx0XHRcIlN1YmplY3Q6IFwiICsgc3ViamVjdCxcblx0XHRcdFwiRGF0ZTogXCIgKyBfZm9ybWF0U210cERhdGVUaW1lKG5ldyBEYXRlKG1haWwuc2VudE9uKSksIC8vIFRPRE8gKGxhdGVyKSBsb2FkIGNvbnZlcnNhdGlvbiBlbnRyaWVzIGFuZCB3cml0ZSBtZXNzYWdlIGlkIGFuZCByZWZlcmVuY2VzXG5cdFx0XHQvL1wiTWVzc2FnZS1JRDogXCIgKyAvLyA8MDA2ZTAxY2Y0NDJiJDUyODY0ZjEwJGY3OTJlZDMwJEB0dXRhby5kZT5cblx0XHRcdC8vUmVmZXJlbmNlczogPDUzMDc0RUI4LjQwMTA1MDVAdHV0YW8uZGU+IDxERDM3NEFGMC1BQzZELTRDNTgtOEYzOC03RjZEOEEwMzA3RjNAdHV0YW8uZGU+IDw1MzBFMzUyOS43MDUwM0B0dXRhby5kZT5cblx0XHQpXG5cdH1cblxuXHRsaW5lcy5wdXNoKFxuXHRcdCdDb250ZW50LVR5cGU6IG11bHRpcGFydC9yZWxhdGVkOyBib3VuZGFyeT1cIi0tLS0tLS0tLS0tLTc5QnU1QTE2cVBFWWNWSVpMQHR1dGFub3RhXCInLFxuXHRcdFwiXCIsXG5cdFx0XCItLS0tLS0tLS0tLS0tLTc5QnU1QTE2cVBFWWNWSVpMQHR1dGFub3RhXCIsXG5cdFx0XCJDb250ZW50LVR5cGU6IHRleHQvaHRtbDsgY2hhcnNldD1VVEYtOFwiLFxuXHRcdFwiQ29udGVudC10cmFuc2Zlci1lbmNvZGluZzogYmFzZTY0XCIsXG5cdFx0XCJcIixcblx0KVxuXG5cdGZvciAobGV0IGJvZHlMaW5lIG9mIGJyZWFrSW50b0xpbmVzKHN0cmluZ1RvQmFzZTY0KG1haWwuYm9keSkpKSB7XG5cdFx0bGluZXMucHVzaChib2R5TGluZSlcblx0fVxuXG5cdGxpbmVzLnB1c2goXCJcIilcblxuXHRmb3IgKGxldCBhdHRhY2htZW50IG9mIG1haWwuYXR0YWNobWVudHMpIHtcblx0XHRjb25zdCBiYXNlNjRGaWxlbmFtZSA9IGA9P1VURi04P0I/JHt1aW50OEFycmF5VG9CYXNlNjQoc3RyaW5nVG9VdGY4VWludDhBcnJheShhdHRhY2htZW50Lm5hbWUpKX0/PWBcblx0XHRjb25zdCBmaWxlQ29udGVudExpbmVzID0gYnJlYWtJbnRvTGluZXModWludDhBcnJheVRvQmFzZTY0KGF0dGFjaG1lbnQuZGF0YSkpXG5cdFx0bGluZXMucHVzaChcblx0XHRcdFwiLS0tLS0tLS0tLS0tLS03OUJ1NUExNnFQRVljVklaTEB0dXRhbm90YVwiLFxuXHRcdFx0XCJDb250ZW50LVR5cGU6IFwiICsgZ2V0Q2xlYW5lZE1pbWVUeXBlKGF0dGFjaG1lbnQubWltZVR5cGUpICsgXCI7XCIsXG5cdFx0XHRcIiBuYW1lPVwiICsgYmFzZTY0RmlsZW5hbWUgKyBcIlwiLFxuXHRcdFx0XCJDb250ZW50LVRyYW5zZmVyLUVuY29kaW5nOiBiYXNlNjRcIixcblx0XHRcdFwiQ29udGVudC1EaXNwb3NpdGlvbjogYXR0YWNobWVudDtcIixcblx0XHRcdFwiIGZpbGVuYW1lPVwiICsgYmFzZTY0RmlsZW5hbWUgKyBcIlwiLFxuXHRcdClcblxuXHRcdGlmIChhdHRhY2htZW50LmNpZCkge1xuXHRcdFx0bGluZXMucHVzaChcIkNvbnRlbnQtSWQ6IDxcIiArIGF0dGFjaG1lbnQuY2lkICsgXCI+XCIpXG5cdFx0fVxuXG5cdFx0bGluZXMucHVzaChcIlwiKVxuXG5cdFx0Ly8gZG9uJ3QgdXNlIGRlc3RydWN0dXJpbmcsIGJpZyBmaWxlcyBjYW4gaGl0IGNhbGxzdGFjayBsaW1pdFxuXHRcdGZvciAobGV0IGZpbGVMaW5lIG9mIGZpbGVDb250ZW50TGluZXMpIHtcblx0XHRcdGxpbmVzLnB1c2goZmlsZUxpbmUpXG5cdFx0fVxuXG5cdFx0bGluZXMucHVzaChcIlwiKVxuXHR9XG5cblx0bGluZXMucHVzaChcIi0tLS0tLS0tLS0tLS0tNzlCdTVBMTZxUEVZY1ZJWkxAdHV0YW5vdGEtLVwiKVxuXHRyZXR1cm4gbGluZXMuam9pbihcIlxcclxcblwiKVxufVxuXG5mdW5jdGlvbiBlc2NhcGVTcGVjaWFsQ2hhcmFjdGVycyhuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuXHQvLyBUaGVyZSBtYXkgYmUgb3RoZXIgc3BlY2lhbCBjaGFyYWN0ZXJzIHRoYXQgbmVlZCBlc2NhcGluZ1xuXHRyZXR1cm4gbmFtZS5yZXBsYWNlKC9bLDw+XS9naSwgXCJcXFxcJCZcIilcbn1cblxuLyoqXG4gKiBCcmVhayB1cCBhIGxvbmcgc3RyaW5nIGludG8gbGluZXMgb2YgdXAgdG8gNzggY2hhcmFjdGVyc1xuICogQHBhcmFtIHN0cmluZ1xuICogQHJldHVybnMgdGhlIGxpbmVzLCBlYWNoIGFzIGFuIGluZGl2aWR1YWwgYXJyYXlcbiAqL1xuZnVuY3Rpb24gYnJlYWtJbnRvTGluZXMoc3RyaW5nOiBzdHJpbmcpOiBBcnJheTxzdHJpbmc+IHtcblx0cmV0dXJuIHN0cmluZy5sZW5ndGggPiAwID8gYXNzZXJ0Tm90TnVsbChzdHJpbmcubWF0Y2goLy57MSw3OH0vZykpIDogW11cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlRXhwb3J0RmlsZU5hbWUoaWQ6IHN0cmluZywgc3ViamVjdDogc3RyaW5nLCBzZW50T246IERhdGUsIG1vZGU6IE1haWxFeHBvcnRNb2RlKTogc3RyaW5nIHtcblx0bGV0IGZpbGVuYW1lID0gWy4uLmZvcm1hdFNvcnRhYmxlRGF0ZVRpbWUoc2VudE9uKS5zcGxpdChcIiBcIiksIGlkLCBzdWJqZWN0XS5qb2luKFwiLVwiKVxuXHRmaWxlbmFtZSA9IGZpbGVuYW1lLnRyaW0oKVxuXG5cdGlmIChmaWxlbmFtZS5sZW5ndGggPT09IDApIHtcblx0XHRmaWxlbmFtZSA9IFwidW5uYW1lZFwiXG5cdH0gZWxzZSBpZiAoZmlsZW5hbWUubGVuZ3RoID4gOTYpIHtcblx0XHQvLyB3aW5kb3dzIE1BWF9QQVRIIGlzIDI2MCwgdGhpcyBzaG91bGQgYmUgZmFpcmx5IHNhZmUuXG5cdFx0ZmlsZW5hbWUgPSBmaWxlbmFtZS5zdWJzdHJpbmcoMCwgOTUpICsgXCJfXCJcblx0fVxuXG5cdHJldHVybiBzYW5pdGl6ZUZpbGVuYW1lKGAke2ZpbGVuYW1lfS4ke21vZGV9YClcbn1cbiIsImltcG9ydCB7IG5vT3AsIHByb21pc2VNYXAsIHNvcnRhYmxlVGltZXN0YW1wIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBEYXRhRmlsZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9EYXRhRmlsZVwiXG5pbXBvcnQgeyBkb3dubG9hZE1haWxCdW5kbGUgfSBmcm9tIFwiLi9CdW5kbGVyXCJcbmltcG9ydCB7IGlzRGVza3RvcCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHR5cGUgeyBNYWlsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHR5cGUgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50XCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3JcIlxuaW1wb3J0IHsgRmlsZUNvbnRyb2xsZXIsIHppcERhdGFGaWxlcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZmlsZS9GaWxlQ29udHJvbGxlclwiXG5pbXBvcnQgeyBNYWlsRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9NYWlsRmFjYWRlLmpzXCJcbmltcG9ydCB7IE9wZXJhdGlvbklkIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9PcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIuanNcIlxuaW1wb3J0IHsgQ2FuY2VsbGVkRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvQ2FuY2VsbGVkRXJyb3IuanNcIlxuaW1wb3J0IHsgQ3J5cHRvRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2NyeXB0by9DcnlwdG9GYWNhZGUuanNcIlxuaW1wb3J0IHsgTWFpbEJ1bmRsZSwgTWFpbEV4cG9ydE1vZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L1NoYXJlZE1haWxVdGlscy5qc1wiXG5pbXBvcnQgeyBnZW5lcmF0ZUV4cG9ydEZpbGVOYW1lLCBtYWlsVG9FbWxGaWxlIH0gZnJvbSBcIi4vZW1sVXRpbHMuanNcIlxuaW1wb3J0IHsgZWxlbWVudElkUGFydCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlsc1wiXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZU1haWxGaWxlKGJ1bmRsZTogTWFpbEJ1bmRsZSwgZmlsZU5hbWU6IHN0cmluZywgbW9kZTogTWFpbEV4cG9ydE1vZGUpOiBQcm9taXNlPERhdGFGaWxlPiB7XG5cdHJldHVybiBtb2RlID09PSBcImVtbFwiID8gbWFpbFRvRW1sRmlsZShidW5kbGUsIGZpbGVOYW1lKSA6IGxvY2F0b3IuZmlsZUFwcC5tYWlsVG9Nc2coYnVuZGxlLCBmaWxlTmFtZSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1haWxFeHBvcnRNb2RlKCk6IFByb21pc2U8TWFpbEV4cG9ydE1vZGU+IHtcblx0aWYgKGlzRGVza3RvcCgpKSB7XG5cdFx0Y29uc3QgQ29uZmlnS2V5cyA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uL2NvbW1vbi9kZXNrdG9wL2NvbmZpZy9Db25maWdLZXlzXCIpXG5cdFx0Y29uc3QgbWFpbEV4cG9ydE1vZGUgPSAoYXdhaXQgbG9jYXRvci5kZXNrdG9wU2V0dGluZ3NGYWNhZGVcblx0XHRcdC5nZXRTdHJpbmdDb25maWdWYWx1ZShDb25maWdLZXlzLkRlc2t0b3BDb25maWdLZXkubWFpbEV4cG9ydE1vZGUpXG5cdFx0XHQuY2F0Y2gobm9PcCkpIGFzIE1haWxFeHBvcnRNb2RlXG5cdFx0cmV0dXJuIG1haWxFeHBvcnRNb2RlID8/IFwiZW1sXCJcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gXCJlbWxcIlxuXHR9XG59XG5cbi8qKlxuICogZXhwb3J0IG1haWxzLiBhIHNpbmdsZSBvbmUgd2lsbCBiZSBleHBvcnRlZCBhcyBpcywgbXVsdGlwbGUgd2lsbCBiZSBwdXQgaW50byBhIHppcCBmaWxlXG4gKiBhIHNhdmUgZGlhbG9nIHdpbGwgdGhlbiBiZSBzaG93blxuICogQHJldHVybnMge1Byb21pc2U8TWFpbFtdPn0gcmVzb2x2ZWQgd2l0aCBmYWlsZWQgbWFpbHMgb3IgZW1wdHkgYWZ0ZXIgdGhlIGZpbGVDb250cm9sbGVyXG4gKiB3YXMgaW5zdHJ1Y3RlZCB0byBvcGVuIHRoZSBuZXcgemlwIEZpbGUgY29udGFpbmluZyB0aGUgZXhwb3J0ZWQgZmlsZXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4cG9ydE1haWxzKFxuXHRtYWlsczogQXJyYXk8TWFpbD4sXG5cdG1haWxGYWNhZGU6IE1haWxGYWNhZGUsXG5cdGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRmaWxlQ29udHJvbGxlcjogRmlsZUNvbnRyb2xsZXIsXG5cdGNyeXB0b0ZhY2FkZTogQ3J5cHRvRmFjYWRlLFxuXHRvcGVyYXRpb25JZD86IE9wZXJhdGlvbklkLFxuXHRzaWduYWw/OiBBYm9ydFNpZ25hbCxcbik6IFByb21pc2U8eyBmYWlsZWQ6IE1haWxbXSB9PiB7XG5cdGxldCBjYW5jZWxsZWQgPSBmYWxzZVxuXG5cdGNvbnN0IG9uQWJvcnQgPSAoKSA9PiB7XG5cdFx0Y2FuY2VsbGVkID0gdHJ1ZVxuXHR9XG5cblx0dHJ5IHtcblx0XHQvLyBDb25zaWRlcmluZyB0aGF0IHRoZSBlZmZvcnQgZm9yIGdlbmVyYXRpbmcgdGhlIGJ1bmRsZSBpcyBoaWdoZXJcblx0XHQvLyB0aGFuIGdlbmVyYXRpbmcgdGhlIGZpbGVzLCB3ZSBuZWVkIHRvIGNvbnNpZGVyIGl0IHR3aWNlLCBzbyB0aGVcblx0XHQvLyB0b3RhbCBlZmZvcnQgd291bGQgYmUgKG1haWxzVG9CdW5kbGUgKiAyKSArIGZpbGVzVG9HZW5lcmF0ZVxuXHRcdGNvbnN0IHRvdGFsTWFpbHMgPSBtYWlscy5sZW5ndGggKiAzXG5cdFx0bGV0IGRvbmVNYWlscyA9IDBcblx0XHRjb25zdCBlcnJvck1haWxzOiBNYWlsW10gPSBbXVxuXG5cdFx0c2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgb25BYm9ydClcblx0XHRjb25zdCB1cGRhdGVQcm9ncmVzcyA9XG5cdFx0XHRvcGVyYXRpb25JZCAhPT0gdW5kZWZpbmVkID8gKCkgPT4gbG9jYXRvci5vcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIub25Qcm9ncmVzcyhvcGVyYXRpb25JZCwgKCsrZG9uZU1haWxzIC8gdG90YWxNYWlscykgKiAxMDApIDogbm9PcFxuXG5cdFx0Ly9UaGUgb25seSB3YXkgdG8gc2tpcCBhIFByb21pc2UgaXMgdGhyb3dpbmcgYW4gZXJyb3IuXG5cdFx0Ly90aGlzIHRocm93cyBqdXN0IGEgQ2FuY2VsbGVkRXJyb3IgdG8gYmUgaGFuZGxlZCBieSB0aGUgdHJ5L2NhdGNoIHN0YXRlbWVudC5cblxuXHRcdC8vVGhpcyBmdW5jdGlvbiBtdXN0IGJlIGNhbGxlZCBpbiBlYWNoIGl0ZXJhdGlvbiBhY3Jvc3MgYWxsIHByb21pc2VzIHNpbmNlXG5cdFx0Ly90aHJvd2luZyBpdCBpbnNpZGUgdGhlIG9uQWJvcnQgZnVuY3Rpb24gZG9lc24ndCBpbnRlcnJ1cHQgdGhlIHBlbmRpbmcgcHJvbWlzZXMuXG5cdFx0Y29uc3QgY2hlY2tBYm9ydFNpZ25hbCA9ICgpID0+IHtcblx0XHRcdGlmIChjYW5jZWxsZWQpIHRocm93IG5ldyBDYW5jZWxsZWRFcnJvcihcImV4cG9ydCBjYW5jZWxsZWRcIilcblx0XHR9XG5cblx0XHRjb25zdCBkb3dubG9hZFByb21pc2UgPSBwcm9taXNlTWFwKG1haWxzLCBhc3luYyAobWFpbCkgPT4ge1xuXHRcdFx0Y2hlY2tBYm9ydFNpZ25hbCgpXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCB7IGh0bWxTYW5pdGl6ZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0h0bWxTYW5pdGl6ZXJcIilcblx0XHRcdFx0cmV0dXJuIGF3YWl0IGRvd25sb2FkTWFpbEJ1bmRsZShtYWlsLCBtYWlsRmFjYWRlLCBlbnRpdHlDbGllbnQsIGZpbGVDb250cm9sbGVyLCBodG1sU2FuaXRpemVyLCBjcnlwdG9GYWNhZGUpXG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGVycm9yTWFpbHMucHVzaChtYWlsKVxuXHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0dXBkYXRlUHJvZ3Jlc3MoKVxuXHRcdFx0XHR1cGRhdGVQcm9ncmVzcygpXG5cdFx0XHR9XG5cdFx0fSlcblxuXHRcdGNvbnN0IFttb2RlLCBidW5kbGVzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtnZXRNYWlsRXhwb3J0TW9kZSgpLCBkb3dubG9hZFByb21pc2VdKVxuXHRcdGNvbnN0IGRhdGFGaWxlczogRGF0YUZpbGVbXSA9IFtdXG5cdFx0Zm9yIChjb25zdCBidW5kbGUgb2YgYnVuZGxlcykge1xuXHRcdFx0aWYgKCFidW5kbGUpIGNvbnRpbnVlXG5cblx0XHRcdGNoZWNrQWJvcnRTaWduYWwoKVxuXHRcdFx0Y29uc3QgbWFpbEZpbGUgPSBhd2FpdCBnZW5lcmF0ZU1haWxGaWxlKFxuXHRcdFx0XHRidW5kbGUsXG5cdFx0XHRcdGdlbmVyYXRlRXhwb3J0RmlsZU5hbWUoZWxlbWVudElkUGFydChidW5kbGUubWFpbElkKSwgYnVuZGxlLnN1YmplY3QsIG5ldyBEYXRlKGJ1bmRsZS5yZWNlaXZlZE9uKSwgbW9kZSksXG5cdFx0XHRcdG1vZGUsXG5cdFx0XHQpXG5cdFx0XHRkYXRhRmlsZXMucHVzaChtYWlsRmlsZSlcblx0XHRcdHVwZGF0ZVByb2dyZXNzKClcblx0XHR9XG5cblx0XHRjb25zdCB6aXBOYW1lID0gYCR7c29ydGFibGVUaW1lc3RhbXAoKX0tJHttb2RlfS1tYWlsLWV4cG9ydC56aXBgXG5cdFx0Y29uc3Qgb3V0cHV0RmlsZSA9IGF3YWl0IChkYXRhRmlsZXMubGVuZ3RoID09PSAxID8gZGF0YUZpbGVzWzBdIDogemlwRGF0YUZpbGVzKGRhdGFGaWxlcywgemlwTmFtZSkpXG5cdFx0YXdhaXQgZmlsZUNvbnRyb2xsZXIuc2F2ZURhdGFGaWxlKG91dHB1dEZpbGUpXG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0ZmFpbGVkOiBlcnJvck1haWxzLFxuXHRcdH1cblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmIChlLm5hbWUgIT09IFwiQ2FuY2VsbGVkRXJyb3JcIikgdGhyb3cgZVxuXHR9IGZpbmFsbHkge1xuXHRcdHNpZ25hbD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIG9uQWJvcnQpXG5cdH1cblxuXHRyZXR1cm4geyBmYWlsZWQ6IFtdIH1cbn1cbiIsImltcG9ydCB7XG5cdENvbnZlcnNhdGlvbkVudHJ5VHlwZVJlZixcblx0Y3JlYXRlTWFpbEFkZHJlc3MsXG5cdEVuY3J5cHRlZE1haWxBZGRyZXNzLFxuXHRGaWxlIGFzIFR1dGFub3RhRmlsZSxcblx0TWFpbCxcblx0TWFpbEFkZHJlc3MsXG5cdE1haWxEZXRhaWxzLFxuXHRNYWlsRm9sZGVyLFxuXHRNYWlsVHlwZVJlZixcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHtcblx0Q29udmVyc2F0aW9uVHlwZSxcblx0RXh0ZXJuYWxJbWFnZVJ1bGUsXG5cdEZlYXR1cmVUeXBlLFxuXHRNYWlsQXV0aGVudGljYXRpb25TdGF0dXMsXG5cdE1haWxNZXRob2QsXG5cdE1haWxQaGlzaGluZ1N0YXR1cyxcblx0TWFpbFJlcG9ydFR5cGUsXG5cdE1haWxTZXRLaW5kLFxuXHRNYWlsU3RhdGUsXG5cdE9wZXJhdGlvblR5cGUsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50XCJcbmltcG9ydCB7IE1haWxib3hEZXRhaWwsIE1haWxib3hNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvTWFpbGJveE1vZGVsLmpzXCJcbmltcG9ydCB7IENvbnRhY3RNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vY29udGFjdHNGdW5jdGlvbmFsaXR5L0NvbnRhY3RNb2RlbC5qc1wiXG5pbXBvcnQgeyBDb25maWd1cmF0aW9uRGF0YWJhc2UgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0NvbmZpZ3VyYXRpb25EYXRhYmFzZS5qc1wiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQge1xuXHRhZGRBbGwsXG5cdGFzc2VydE5vbk51bGwsXG5cdGNvbnRhaW5zLFxuXHRkb3duY2FzdCxcblx0ZmlsdGVySW50LFxuXHRmaXJzdCxcblx0bGF6eUFzeW5jLFxuXHRub09wLFxuXHRvZkNsYXNzLFxuXHRzdGFydHNXaXRoLFxuXHR1dGY4VWludDhBcnJheVRvU3RyaW5nLFxufSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgTG9naW5Db250cm9sbGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXJcIlxuaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgTG9ja2VkRXJyb3IsIE5vdEF1dGhvcml6ZWRFcnJvciwgTm90Rm91bmRFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHsgaGF2ZVNhbWVJZCwgaXNTYW1lSWQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHNcIlxuaW1wb3J0IHsgZ2V0UmVmZXJlbmNlZEF0dGFjaG1lbnRzLCBpc01haWxDb250cmFzdEZpeE5lZWRlZCwgaXNUdXRhbm90YVRlYW1NYWlsLCBsb2FkSW5saW5lSW1hZ2VzLCBtb3ZlTWFpbHMgfSBmcm9tIFwiLi9NYWlsR3VpVXRpbHNcIlxuaW1wb3J0IHsgU2FuaXRpemVkRnJhZ21lbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvSHRtbFNhbml0aXplclwiXG5pbXBvcnQgeyBDQUxFTkRBUl9NSU1FX1RZUEUsIEZpbGVDb250cm9sbGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9maWxlL0ZpbGVDb250cm9sbGVyXCJcbmltcG9ydCB7IGV4cG9ydE1haWxzIH0gZnJvbSBcIi4uL2V4cG9ydC9FeHBvcnRlci5qc1wiXG5pbXBvcnQgeyBJbmRleGluZ05vdFN1cHBvcnRlZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL0luZGV4aW5nTm90U3VwcG9ydGVkRXJyb3JcIlxuaW1wb3J0IHsgRmlsZU9wZW5FcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9GaWxlT3BlbkVycm9yXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IGNoZWNrQXBwcm92YWxTdGF0dXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTG9naW5VdGlsc1wiXG5pbXBvcnQgeyBmb3JtYXREYXRlVGltZSwgdXJsRW5jb2RlSHRtbFRhZ3MgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvRm9ybWF0dGVyXCJcbmltcG9ydCB7IFVzZXJFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vVXNlckVycm9yXCJcbmltcG9ydCB7IHNob3dVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvRXJyb3JIYW5kbGVySW1wbFwiXG5pbXBvcnQgeyBMb2FkaW5nU3RhdGVUcmFja2VyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9vZmZsaW5lL0xvYWRpbmdTdGF0ZVwiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3JcIlxuaW1wb3J0IHsgSW5pdEFzUmVzcG9uc2VBcmdzLCBTZW5kTWFpbE1vZGVsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9TZW5kTWFpbE1vZGVsLmpzXCJcbmltcG9ydCB7IEV2ZW50Q29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vRXZlbnRDb250cm9sbGVyLmpzXCJcbmltcG9ydCB7IFdvcmtlckZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL1dvcmtlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBTZWFyY2hNb2RlbCB9IGZyb20gXCIuLi8uLi9zZWFyY2gvbW9kZWwvU2VhcmNoTW9kZWwuanNcIlxuaW1wb3J0IHsgUGFyc2VkSWNhbEZpbGVDb250ZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci92aWV3L0NhbGVuZGFySW52aXRlcy5qc1wiXG5pbXBvcnQgeyBNYWlsRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9NYWlsRmFjYWRlLmpzXCJcbmltcG9ydCB7IEVudGl0eVVwZGF0ZURhdGEsIGlzVXBkYXRlRm9yVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVcGRhdGVVdGlscy5qc1wiXG5pbXBvcnQgeyBpc09mZmxpbmVFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FcnJvclV0aWxzLmpzXCJcbmltcG9ydCB7IENyeXB0b0ZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9jcnlwdG8vQ3J5cHRvRmFjYWRlLmpzXCJcbmltcG9ydCB7IEF0dGFjaG1lbnRUeXBlLCBnZXRBdHRhY2htZW50VHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0F0dGFjaG1lbnRCdWJibGUuanNcIlxuaW1wb3J0IHR5cGUgeyBDb250YWN0SW1wb3J0ZXIgfSBmcm9tIFwiLi4vLi4vY29udGFjdHMvQ29udGFjdEltcG9ydGVyLmpzXCJcbmltcG9ydCB7IElubGluZUltYWdlcywgcmV2b2tlSW5saW5lSW1hZ2VzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9pbmxpbmVJbWFnZXNVdGlscy5qc1wiXG5pbXBvcnQgeyBnZXREZWZhdWx0U2VuZGVyLCBnZXRFbmFibGVkTWFpbEFkZHJlc3Nlc1dpdGhVc2VyLCBnZXRNYWlsYm94TmFtZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvU2hhcmVkTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IGdldERpc3BsYXllZFNlbmRlciwgZ2V0TWFpbEJvZHlUZXh0LCBNYWlsQWRkcmVzc0FuZE5hbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vQ29tbW9uTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IE1haWxNb2RlbCB9IGZyb20gXCIuLi9tb2RlbC9NYWlsTW9kZWwuanNcIlxuaW1wb3J0IHsgaXNOb1JlcGx5VGVhbUFkZHJlc3MsIGlzU3lzdGVtTm90aWZpY2F0aW9uLCBsb2FkTWFpbERldGFpbHMgfSBmcm9tIFwiLi9NYWlsVmlld2VyVXRpbHMuanNcIlxuaW1wb3J0IHsgYXNzZXJ0U3lzdGVtRm9sZGVyT2ZUeXBlLCBnZXRGb2xkZXJOYW1lLCBnZXRQYXRoVG9Gb2xkZXJTdHJpbmcsIGxvYWRNYWlsSGVhZGVycyB9IGZyb20gXCIuLi9tb2RlbC9NYWlsVXRpbHMuanNcIlxuaW1wb3J0IHsgbWFpbExvY2F0b3IgfSBmcm9tIFwiLi4vLi4vbWFpbExvY2F0b3IuanNcIlxuXG5leHBvcnQgY29uc3QgZW51bSBDb250ZW50QmxvY2tpbmdTdGF0dXMge1xuXHRCbG9jayA9IFwiMFwiLFxuXHRTaG93ID0gXCIxXCIsXG5cdEFsd2F5c1Nob3cgPSBcIjJcIixcblx0Tm9FeHRlcm5hbENvbnRlbnQgPSBcIjNcIixcblx0QWx3YXlzQmxvY2sgPSBcIjRcIixcbn1cblxuZXhwb3J0IGNsYXNzIE1haWxWaWV3ZXJWaWV3TW9kZWwge1xuXHRwcml2YXRlIGNvbnRyYXN0Rml4TmVlZGVkOiBib29sZWFuID0gZmFsc2Vcblx0Ly8gYWx3YXlzIHNhbml0aXplZCBpbiB0aGlzLnNhbml0aXplTWFpbEJvZHlcblxuXHRwcml2YXRlIHNhbml0aXplUmVzdWx0OiBTYW5pdGl6ZWRGcmFnbWVudCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgbG9hZGluZ0F0dGFjaG1lbnRzOiBib29sZWFuID0gZmFsc2Vcblx0cHJpdmF0ZSBhdHRhY2htZW50czogVHV0YW5vdGFGaWxlW10gPSBbXVxuXG5cdHByaXZhdGUgY29udGVudEJsb2NraW5nU3RhdHVzOiBDb250ZW50QmxvY2tpbmdTdGF0dXMgfCBudWxsID0gbnVsbFxuXG5cdHByaXZhdGUgZXJyb3JPY2N1cnJlZDogYm9vbGVhbiA9IGZhbHNlXG5cdHByaXZhdGUgbG9hZGVkSW5saW5lSW1hZ2VzOiBJbmxpbmVJbWFnZXMgfCBudWxsID0gbnVsbFxuXHQvKiogb25seSBsb2FkZWQgd2hlbiBzaG93Rm9sZGVyIGlzIHNldCB0byB0cnVlICovXG5cdHByaXZhdGUgZm9sZGVyTWFpbGJveFRleHQ6IHN0cmluZyB8IG51bGxcblxuXHQvKiogQHNlZSBnZXRSZWxldmFudFJlY2lwaWVudCAqL1xuXHRwcml2YXRlIHJlbGV2YW50UmVjaXBpZW50OiBNYWlsQWRkcmVzcyB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgd2FybmluZ0Rpc21pc3NlZDogYm9vbGVhbiA9IGZhbHNlXG5cblx0cHJpdmF0ZSBjYWxlbmRhckV2ZW50QXR0YWNobWVudDoge1xuXHRcdGNvbnRlbnRzOiBQYXJzZWRJY2FsRmlsZUNvbnRlbnRcblx0XHRyZWNpcGllbnQ6IHN0cmluZ1xuXHR9IHwgbnVsbCA9IG51bGxcblxuXHRwcml2YXRlIHJlYWRvbmx5IGxvYWRpbmdTdGF0ZSA9IG5ldyBMb2FkaW5nU3RhdGVUcmFja2VyKClcblxuXHRwcml2YXRlIHJlbmRlcklzRGVsYXllZDogYm9vbGVhbiA9IHRydWVcblxuXHRyZWFkb25seSBsb2FkQ29tcGxldGVOb3RpZmljYXRpb24gPSBzdHJlYW08bnVsbD4oKVxuXG5cdHByaXZhdGUgcmVuZGVyZWRNYWlsOiBNYWlsIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBsb2FkaW5nOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGxcblxuXHRwcml2YXRlIGNvbGxhcHNlZDogYm9vbGVhbiA9IHRydWVcblxuXHRnZXQgbWFpbCgpOiBNYWlsIHtcblx0XHRyZXR1cm4gdGhpcy5fbWFpbFxuXHR9XG5cblx0cHJpdmF0ZSBtYWlsRGV0YWlsczogTWFpbERldGFpbHMgfCBudWxsID0gbnVsbFxuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgX21haWw6IE1haWwsXG5cdFx0c2hvd0ZvbGRlcjogYm9vbGVhbixcblx0XHRyZWFkb25seSBlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCxcblx0XHRwdWJsaWMgcmVhZG9ubHkgbWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWwsXG5cdFx0cHVibGljIHJlYWRvbmx5IG1haWxNb2RlbDogTWFpbE1vZGVsLFxuXHRcdHJlYWRvbmx5IGNvbnRhY3RNb2RlbDogQ29udGFjdE1vZGVsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY29uZmlnRmFjYWRlOiBDb25maWd1cmF0aW9uRGF0YWJhc2UsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBmaWxlQ29udHJvbGxlcjogRmlsZUNvbnRyb2xsZXIsXG5cdFx0cmVhZG9ubHkgbG9naW5zOiBMb2dpbkNvbnRyb2xsZXIsXG5cdFx0cHJpdmF0ZSBzZW5kTWFpbE1vZGVsRmFjdG9yeTogKG1haWxib3hEZXRhaWxzOiBNYWlsYm94RGV0YWlsKSA9PiBQcm9taXNlPFNlbmRNYWlsTW9kZWw+LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZXZlbnRDb250cm9sbGVyOiBFdmVudENvbnRyb2xsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSB3b3JrZXJGYWNhZGU6IFdvcmtlckZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IHNlYXJjaE1vZGVsOiBTZWFyY2hNb2RlbCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IG1haWxGYWNhZGU6IE1haWxGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjcnlwdG9GYWNhZGU6IENyeXB0b0ZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNvbnRhY3RJbXBvcnRlcjogbGF6eUFzeW5jPENvbnRhY3RJbXBvcnRlcj4sXG5cdCkge1xuXHRcdHRoaXMuZm9sZGVyTWFpbGJveFRleHQgPSBudWxsXG5cdFx0aWYgKHNob3dGb2xkZXIpIHtcblx0XHRcdHRoaXMuc2hvd0ZvbGRlcigpXG5cdFx0fVxuXHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLmFkZEVudGl0eUxpc3RlbmVyKHRoaXMuZW50aXR5TGlzdGVuZXIpXG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eUxpc3RlbmVyID0gYXN5bmMgKGV2ZW50czogRW50aXR5VXBkYXRlRGF0YVtdKSA9PiB7XG5cdFx0Zm9yIChjb25zdCB1cGRhdGUgb2YgZXZlbnRzKSB7XG5cdFx0XHRpZiAoaXNVcGRhdGVGb3JUeXBlUmVmKE1haWxUeXBlUmVmLCB1cGRhdGUpKSB7XG5cdFx0XHRcdGNvbnN0IHsgaW5zdGFuY2VMaXN0SWQsIGluc3RhbmNlSWQsIG9wZXJhdGlvbiB9ID0gdXBkYXRlXG5cdFx0XHRcdGlmIChvcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuVVBEQVRFICYmIGlzU2FtZUlkKHRoaXMubWFpbC5faWQsIFtpbnN0YW5jZUxpc3RJZCwgaW5zdGFuY2VJZF0pKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGNvbnN0IHVwZGF0ZWRNYWlsID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChNYWlsVHlwZVJlZiwgdGhpcy5tYWlsLl9pZClcblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlTWFpbCh7IG1haWw6IHVwZGF0ZWRNYWlsIH0pXG5cdFx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBOb3RGb3VuZEVycm9yKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGBDb3VsZCBub3QgZmluZCB1cGRhdGVkIG1haWwgJHtKU09OLnN0cmluZ2lmeShbaW5zdGFuY2VMaXN0SWQsIGluc3RhbmNlSWRdKX1gKVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZGV0ZXJtaW5lUmVsZXZhbnRSZWNpcGllbnQoKSB7XG5cdFx0Ly8gVGhlIGlkZWEgaXMgdGhhdCBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgcmVjaXBpZW50cyB0aGVuIHdlIHNob3VsZCBkaXNwbGF5IHRoZSBvbmUgd2hpY2ggYmVsb25ncyB0byBvbmUgb2Ygb3VyIG1haWxib3hlcyBhbmQgdGhlbiBmYWxsIGJhY2sgdG8gYW55XG5cdFx0Ly8gb3RoZXIgb25lXG5cdFx0Y29uc3QgbWFpbGJveERldGFpbHMgPSBhd2FpdCB0aGlzLm1haWxNb2RlbC5nZXRNYWlsYm94RGV0YWlsc0Zvck1haWwodGhpcy5tYWlsKVxuXHRcdGlmIChtYWlsYm94RGV0YWlscyA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0Y29uc3QgZW5hYmxlZE1haWxBZGRyZXNzZXMgPSBuZXcgU2V0KGdldEVuYWJsZWRNYWlsQWRkcmVzc2VzV2l0aFVzZXIobWFpbGJveERldGFpbHMsIHRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlckdyb3VwSW5mbykpXG5cdFx0aWYgKHRoaXMubWFpbERldGFpbHMgPT0gbnVsbCkge1xuXHRcdFx0Ly8gd2UgY291bGQgbm90IGxvYWQgdGhlIG1haWxEZXRhaWxzIGZvciBzb21lIHJlYXNvblxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdHRoaXMucmVsZXZhbnRSZWNpcGllbnQgPVxuXHRcdFx0dGhpcy5tYWlsRGV0YWlscy5yZWNpcGllbnRzLnRvUmVjaXBpZW50cy5maW5kKChyKSA9PiBlbmFibGVkTWFpbEFkZHJlc3Nlcy5oYXMoci5hZGRyZXNzKSkgPz9cblx0XHRcdHRoaXMubWFpbERldGFpbHMucmVjaXBpZW50cy5jY1JlY2lwaWVudHMuZmluZCgocikgPT4gZW5hYmxlZE1haWxBZGRyZXNzZXMuaGFzKHIuYWRkcmVzcykpID8/XG5cdFx0XHR0aGlzLm1haWxEZXRhaWxzLnJlY2lwaWVudHMuYmNjUmVjaXBpZW50cy5maW5kKChyKSA9PiBlbmFibGVkTWFpbEFkZHJlc3Nlcy5oYXMoci5hZGRyZXNzKSkgPz9cblx0XHRcdGZpcnN0KHRoaXMubWFpbERldGFpbHMucmVjaXBpZW50cy50b1JlY2lwaWVudHMpID8/XG5cdFx0XHRmaXJzdCh0aGlzLm1haWxEZXRhaWxzLnJlY2lwaWVudHMuY2NSZWNpcGllbnRzKSA/P1xuXHRcdFx0Zmlyc3QodGhpcy5tYWlsRGV0YWlscy5yZWNpcGllbnRzLmJjY1JlY2lwaWVudHMpXG5cdFx0bS5yZWRyYXcoKVxuXHR9XG5cblx0cHJpdmF0ZSBzaG93Rm9sZGVyKCkge1xuXHRcdHRoaXMuZm9sZGVyTWFpbGJveFRleHQgPSBudWxsXG5cdFx0Y29uc3QgZm9sZGVyID0gdGhpcy5tYWlsTW9kZWwuZ2V0TWFpbEZvbGRlckZvck1haWwodGhpcy5tYWlsKVxuXG5cdFx0aWYgKGZvbGRlcikge1xuXHRcdFx0dGhpcy5tYWlsTW9kZWwuZ2V0TWFpbGJveERldGFpbHNGb3JNYWlsKHRoaXMubWFpbCkudGhlbihhc3luYyAobWFpbGJveERldGFpbHMpID0+IHtcblx0XHRcdFx0aWYgKG1haWxib3hEZXRhaWxzID09IG51bGwgfHwgbWFpbGJveERldGFpbHMubWFpbGJveC5mb2xkZXJzID09IG51bGwpIHtcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCBmb2xkZXJzID0gYXdhaXQgdGhpcy5tYWlsTW9kZWwuZ2V0TWFpbGJveEZvbGRlcnNGb3JJZChtYWlsYm94RGV0YWlscy5tYWlsYm94LmZvbGRlcnMuX2lkKVxuXHRcdFx0XHRjb25zdCBuYW1lID0gZ2V0UGF0aFRvRm9sZGVyU3RyaW5nKGZvbGRlcnMsIGZvbGRlcilcblx0XHRcdFx0dGhpcy5mb2xkZXJNYWlsYm94VGV4dCA9IGAke2dldE1haWxib3hOYW1lKHRoaXMubG9naW5zLCBtYWlsYm94RGV0YWlscyl9IC8gJHtuYW1lfWBcblx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cblxuXHRkaXNwb3NlKCkge1xuXHRcdC8vIGN1cnJlbnRseSwgdGhlIGNvbnZlcnNhdGlvbiB2aWV3IGRpc3Bvc2VzIHVzIHR3aWNlIGlmIG91ciBtYWlsIGlzIGRlbGV0ZWQgYmVjYXVzZSBpdCdzIGdldHRpbmcgZGlzcG9zZWQgaXRzZWxmXG5cdFx0Ly8gKGZyb20gdGhlIGxpc3Qgc2VsZWN0aW5nIGEgZGlmZmVyZW50IGVsZW1lbnQpIGFuZCBiZWNhdXNlIGl0IGRpc3Bvc2VzIHRoZSBtYWlsVmlld2VyVmlld01vZGVsIHRoYXQgZ290IHVwZGF0ZWRcblx0XHQvLyB0aGlzIHNpbGVuY2VzIHRoZSB3YXJuaW5nIGFib3V0IGxlYWtpbmcgZW50aXR5IGV2ZW50IGxpc3RlbmVycyB3aGVuIHRoZSBsaXN0ZW5lciBpcyByZW1vdmVkIHR3aWNlLlxuXHRcdHRoaXMuZGlzcG9zZSA9ICgpID0+IGNvbnNvbGUubG9nKFwiZGlzcG9zZWQgTWFpbFZpZXdlclZpZXdNb2RlbCBhIHNlY29uZCB0aW1lLCBpZ25vcmluZ1wiKVxuXHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLnJlbW92ZUVudGl0eUxpc3RlbmVyKHRoaXMuZW50aXR5TGlzdGVuZXIpXG5cdFx0Y29uc3QgaW5saW5lSW1hZ2VzID0gdGhpcy5nZXRMb2FkZWRJbmxpbmVJbWFnZXMoKVxuXHRcdHJldm9rZUlubGluZUltYWdlcyhpbmxpbmVJbWFnZXMpXG5cdH1cblxuXHRhc3luYyBsb2FkQWxsKFxuXHRcdGRlbGF5OiBQcm9taXNlPHVua25vd24+LFxuXHRcdHtcblx0XHRcdG5vdGlmeSxcblx0XHR9OiB7XG5cdFx0XHRub3RpZnk6IGJvb2xlYW5cblx0XHR9ID0geyBub3RpZnk6IHRydWUgfSxcblx0KSB7XG5cdFx0dGhpcy5yZW5kZXJJc0RlbGF5ZWQgPSB0cnVlXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMubG9hZGluZ1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0dGhpcy5sb2FkaW5nID0gdGhpcy5sb2FkQW5kUHJvY2Vzc0FkZGl0aW9uYWxNYWlsSW5mbyh0aGlzLm1haWwsIGRlbGF5KVxuXHRcdFx0XHRcdC50aGVuKChpbmxpbmVJbWFnZUNpZHMpID0+IHtcblx0XHRcdFx0XHRcdHRoaXMuZGV0ZXJtaW5lUmVsZXZhbnRSZWNpcGllbnQoKVxuXHRcdFx0XHRcdFx0cmV0dXJuIGlubGluZUltYWdlQ2lkc1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LnRoZW4oKGlubGluZUltYWdlQ2lkcykgPT4gdGhpcy5sb2FkQXR0YWNobWVudHModGhpcy5tYWlsLCBpbmxpbmVJbWFnZUNpZHMpKVxuXHRcdFx0XHRhd2FpdCB0aGlzLmxvYWRpbmdTdGF0ZS50cmFja1Byb21pc2UodGhpcy5sb2FkaW5nKVxuXG5cdFx0XHRcdGlmIChub3RpZnkpIHRoaXMubG9hZENvbXBsZXRlTm90aWZpY2F0aW9uKG51bGwpXG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHRoaXMubG9hZGluZyA9IG51bGxcblxuXHRcdFx0XHRpZiAoIWlzT2ZmbGluZUVycm9yKGUpKSB7XG5cdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdG0ucmVkcmF3KClcblxuXHRcdFx0Ly8gV2UgbmVlZCB0aGUgY29udmVyc2F0aW9uIGVudHJ5IGluIG9yZGVyIHRvIHJlcGx5IHRvIHRoZSBtZXNzYWdlLlxuXHRcdFx0Ly8gV2UgZG9uJ3Qgd2FudCB0aGUgdXNlciB0byBoYXZlIHRvIHdhaXQgZm9yIGl0IHRvIGxvYWQgd2hlbiB0aGV5IGNsaWNrIHJlcGx5LFxuXHRcdFx0Ly8gU28gd2UgbG9hZCBpdCBoZXJlIHByZS1lbXB0aXZlbHkgdG8gbWFrZSBzdXJlIGl0IGlzIGluIHRoZSBjYWNoZS5cblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoQ29udmVyc2F0aW9uRW50cnlUeXBlUmVmLCB0aGlzLm1haWwuY29udmVyc2F0aW9uRW50cnkpLmNhdGNoKChlKSA9PiB7XG5cdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiY291bGQgbG9hZCBjb252ZXJzYXRpb24gZW50cnkgYXMgaXQgaGFzIGJlZW4gbW92ZWQvZGVsZXRlZCBhbHJlYWR5XCIsIGUpXG5cdFx0XHRcdH0gZWxzZSBpZiAoaXNPZmZsaW5lRXJyb3IoZSkpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcImZhaWxlZCB0byBsb2FkIGNvbnZlcnNhdGlvbiBlbnRyeSwgYmVjYXVzZSBvZiBhIGxvc3QgY29ubmVjdGlvblwiLCBlKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0dGhpcy5yZW5kZXJJc0RlbGF5ZWQgPSBmYWxzZVxuXHRcdH1cblx0fVxuXG5cdGlzTG9hZGluZygpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5sb2FkaW5nU3RhdGUuaXNMb2FkaW5nKClcblx0fVxuXG5cdGlzQ29ubmVjdGlvbkxvc3QoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMubG9hZGluZ1N0YXRlLmlzQ29ubmVjdGlvbkxvc3QoKVxuXHR9XG5cblx0Z2V0QXR0YWNobWVudHMoKTogQXJyYXk8VHV0YW5vdGFGaWxlPiB7XG5cdFx0cmV0dXJuIHRoaXMuYXR0YWNobWVudHNcblx0fVxuXG5cdGdldElubGluZUNpZHMoKTogQXJyYXk8c3RyaW5nPiB7XG5cdFx0cmV0dXJuIHRoaXMuc2FuaXRpemVSZXN1bHQ/LmlubGluZUltYWdlQ2lkcyA/PyBbXVxuXHR9XG5cblx0Z2V0TG9hZGVkSW5saW5lSW1hZ2VzKCk6IElubGluZUltYWdlcyB7XG5cdFx0cmV0dXJuIHRoaXMubG9hZGVkSW5saW5lSW1hZ2VzID8/IG5ldyBNYXAoKVxuXHR9XG5cblx0aXNDb250cmFzdEZpeE5lZWRlZCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5jb250cmFzdEZpeE5lZWRlZFxuXHR9XG5cblx0aXNEcmFmdE1haWwoKSB7XG5cdFx0cmV0dXJuIHRoaXMubWFpbC5zdGF0ZSA9PT0gTWFpbFN0YXRlLkRSQUZUXG5cdH1cblxuXHRpc1JlY2VpdmVkTWFpbCgpIHtcblx0XHRyZXR1cm4gdGhpcy5tYWlsLnN0YXRlID09PSBNYWlsU3RhdGUuUkVDRUlWRURcblx0fVxuXG5cdGlzTG9hZGluZ0F0dGFjaG1lbnRzKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmxvYWRpbmdBdHRhY2htZW50c1xuXHR9XG5cblx0Z2V0Rm9sZGVyTWFpbGJveFRleHQoKTogc3RyaW5nIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuZm9sZGVyTWFpbGJveFRleHRcblx0fVxuXG5cdGdldEZvbGRlckluZm8oKTogeyBmb2xkZXJUeXBlOiBNYWlsU2V0S2luZDsgbmFtZTogc3RyaW5nIH0gfCBudWxsIHtcblx0XHRjb25zdCBmb2xkZXIgPSB0aGlzLm1haWxNb2RlbC5nZXRNYWlsRm9sZGVyRm9yTWFpbCh0aGlzLm1haWwpXG5cdFx0aWYgKCFmb2xkZXIpIHJldHVybiBudWxsXG5cdFx0cmV0dXJuIHsgZm9sZGVyVHlwZTogZm9sZGVyLmZvbGRlclR5cGUgYXMgTWFpbFNldEtpbmQsIG5hbWU6IGdldEZvbGRlck5hbWUoZm9sZGVyKSB9XG5cdH1cblxuXHRnZXRTdWJqZWN0KCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHRoaXMubWFpbC5zdWJqZWN0XG5cdH1cblxuXHRpc0NvbmZpZGVudGlhbCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5tYWlsLmNvbmZpZGVudGlhbFxuXHR9XG5cblx0aXNNYWlsU3VzcGljaW91cygpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5tYWlsLnBoaXNoaW5nU3RhdHVzID09PSBNYWlsUGhpc2hpbmdTdGF0dXMuU1VTUElDSU9VU1xuXHR9XG5cblx0Z2V0TWFpbElkKCk6IElkVHVwbGUge1xuXHRcdHJldHVybiB0aGlzLm1haWwuX2lkXG5cdH1cblxuXHRnZXRTYW5pdGl6ZWRNYWlsQm9keSgpOiBEb2N1bWVudEZyYWdtZW50IHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuc2FuaXRpemVSZXN1bHQ/LmZyYWdtZW50ID8/IG51bGxcblx0fVxuXG5cdGdldE1haWxCb2R5KCk6IHN0cmluZyB7XG5cdFx0aWYgKHRoaXMubWFpbERldGFpbHMpIHtcblx0XHRcdHJldHVybiBnZXRNYWlsQm9keVRleHQodGhpcy5tYWlsRGV0YWlscy5ib2R5KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gXCJcIlxuXHRcdH1cblx0fVxuXG5cdGdldERhdGUoKTogRGF0ZSB7XG5cdFx0cmV0dXJuIHRoaXMubWFpbC5yZWNlaXZlZERhdGVcblx0fVxuXG5cdGdldFRvUmVjaXBpZW50cygpOiBBcnJheTxNYWlsQWRkcmVzcz4ge1xuXHRcdGlmICh0aGlzLm1haWxEZXRhaWxzID09PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gW11cblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMubWFpbERldGFpbHMucmVjaXBpZW50cy50b1JlY2lwaWVudHNcblx0fVxuXG5cdGdldENjUmVjaXBpZW50cygpOiBBcnJheTxNYWlsQWRkcmVzcz4ge1xuXHRcdGlmICh0aGlzLm1haWxEZXRhaWxzID09PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gW11cblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMubWFpbERldGFpbHMucmVjaXBpZW50cy5jY1JlY2lwaWVudHNcblx0fVxuXG5cdGdldEJjY1JlY2lwaWVudHMoKTogQXJyYXk8TWFpbEFkZHJlc3M+IHtcblx0XHRpZiAodGhpcy5tYWlsRGV0YWlscyA9PT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIFtdXG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLm1haWxEZXRhaWxzLnJlY2lwaWVudHMuYmNjUmVjaXBpZW50c1xuXHR9XG5cblx0LyoqIEdldCB0aGUgcmVjaXBpZW50IHdoaWNoIGlzIHJlbGV2YW50IHRoZSBtb3N0IGZvciB0aGUgY3VycmVudCBtYWlsYm94ZXMuICovXG5cdGdldFJlbGV2YW50UmVjaXBpZW50KCk6IE1haWxBZGRyZXNzIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMucmVsZXZhbnRSZWNpcGllbnRcblx0fVxuXG5cdGdldE51bWJlck9mUmVjaXBpZW50cygpOiBudW1iZXIge1xuXHRcdHJldHVybiBmaWx0ZXJJbnQodGhpcy5tYWlsLnJlY2lwaWVudENvdW50KVxuXHR9XG5cblx0Z2V0UmVwbHlUb3MoKTogQXJyYXk8RW5jcnlwdGVkTWFpbEFkZHJlc3M+IHtcblx0XHRpZiAodGhpcy5tYWlsRGV0YWlscyA9PT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIFtdXG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLm1haWxEZXRhaWxzLnJlcGx5VG9zXG5cdH1cblxuXHRnZXRTZW5kZXIoKTogTWFpbEFkZHJlc3Mge1xuXHRcdHJldHVybiB0aGlzLm1haWwuc2VuZGVyXG5cdH1cblxuXHQvKipcblx0ICogQ2FuIGJlIHtAY29kZSBudWxsfSBpZiBzZW5kZXIgc2hvdWxkIG5vdCBiZSBkaXNwbGF5ZWQgZS5nLiBmb3Igc3lzdGVtIG5vdGlmaWNhdGlvbnMuXG5cdCAqL1xuXHRnZXREaXNwbGF5ZWRTZW5kZXIoKTogTWFpbEFkZHJlc3NBbmROYW1lIHwgbnVsbCB7XG5cdFx0aWYgKGlzU3lzdGVtTm90aWZpY2F0aW9uKHRoaXMubWFpbCkpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBnZXREaXNwbGF5ZWRTZW5kZXIodGhpcy5tYWlsKVxuXHRcdH1cblx0fVxuXG5cdGdldFBoaXNoaW5nU3RhdHVzKCk6IE1haWxQaGlzaGluZ1N0YXR1cyB7XG5cdFx0cmV0dXJuIHRoaXMubWFpbC5waGlzaGluZ1N0YXR1cyBhcyBNYWlsUGhpc2hpbmdTdGF0dXNcblx0fVxuXG5cdHNldFBoaXNoaW5nU3RhdHVzKHN0YXR1czogTWFpbFBoaXNoaW5nU3RhdHVzKSB7XG5cdFx0dGhpcy5tYWlsLnBoaXNoaW5nU3RhdHVzID0gc3RhdHVzXG5cdH1cblxuXHRjaGVja01haWxBdXRoZW50aWNhdGlvblN0YXR1cyhzdGF0dXM6IE1haWxBdXRoZW50aWNhdGlvblN0YXR1cyk6IGJvb2xlYW4ge1xuXHRcdGlmICh0aGlzLm1haWwuYXV0aFN0YXR1cyAhPSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5tYWlsLmF1dGhTdGF0dXMgPT09IHN0YXR1c1xuXHRcdH0gZWxzZSBpZiAodGhpcy5tYWlsRGV0YWlscykge1xuXHRcdFx0cmV0dXJuIHRoaXMubWFpbERldGFpbHMuYXV0aFN0YXR1cyA9PT0gc3RhdHVzXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIG1haWxEZXRhaWxzIG5vdCBsb2FkZWQgeWV0XG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cdH1cblxuXHRjYW5DcmVhdGVTcGFtUnVsZSgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5sb2dpbnMuaXNHbG9iYWxBZG1pblVzZXJMb2dnZWRJbigpICYmICF0aGlzLmxvZ2lucy5pc0VuYWJsZWQoRmVhdHVyZVR5cGUuSW50ZXJuYWxDb21tdW5pY2F0aW9uKVxuXHR9XG5cblx0ZGlkRXJyb3JzT2NjdXIoKTogYm9vbGVhbiB7XG5cdFx0bGV0IGJvZHlFcnJvcnMgPSBmYWxzZVxuXHRcdGlmICh0aGlzLm1haWxEZXRhaWxzKSB7XG5cdFx0XHRib2R5RXJyb3JzID0gdHlwZW9mIGRvd25jYXN0KHRoaXMubWFpbERldGFpbHMuYm9keSkuX2Vycm9ycyAhPT0gXCJ1bmRlZmluZWRcIlxuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5lcnJvck9jY3VycmVkIHx8IHR5cGVvZiB0aGlzLm1haWwuX2Vycm9ycyAhPT0gXCJ1bmRlZmluZWRcIiB8fCBib2R5RXJyb3JzXG5cdH1cblxuXHRpc1R1dGFub3RhVGVhbU1haWwoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIGlzVHV0YW5vdGFUZWFtTWFpbCh0aGlzLm1haWwpXG5cdH1cblxuXHRpc1Nob3dpbmdFeHRlcm5hbENvbnRlbnQoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuY29udGVudEJsb2NraW5nU3RhdHVzID09PSBDb250ZW50QmxvY2tpbmdTdGF0dXMuU2hvdyB8fCB0aGlzLmNvbnRlbnRCbG9ja2luZ1N0YXR1cyA9PT0gQ29udGVudEJsb2NraW5nU3RhdHVzLkFsd2F5c1Nob3dcblx0fVxuXG5cdGlzQmxvY2tpbmdFeHRlcm5hbEltYWdlcygpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5jb250ZW50QmxvY2tpbmdTdGF0dXMgPT09IENvbnRlbnRCbG9ja2luZ1N0YXR1cy5CbG9jayB8fCB0aGlzLmNvbnRlbnRCbG9ja2luZ1N0YXR1cyA9PT0gQ29udGVudEJsb2NraW5nU3RhdHVzLkFsd2F5c0Jsb2NrXG5cdH1cblxuXHRnZXREaWZmZXJlbnRFbnZlbG9wZVNlbmRlcigpOiBzdHJpbmcgfCBudWxsIHtcblx0XHRyZXR1cm4gdGhpcy5tYWlsLmRpZmZlcmVudEVudmVsb3BlU2VuZGVyXG5cdH1cblxuXHRnZXRDYWxlbmRhckV2ZW50QXR0YWNobWVudCgpOiBNYWlsVmlld2VyVmlld01vZGVsW1wiY2FsZW5kYXJFdmVudEF0dGFjaG1lbnRcIl0ge1xuXHRcdHJldHVybiB0aGlzLmNhbGVuZGFyRXZlbnRBdHRhY2htZW50XG5cdH1cblxuXHRnZXRDb250ZW50QmxvY2tpbmdTdGF0dXMoKTogQ29udGVudEJsb2NraW5nU3RhdHVzIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuY29udGVudEJsb2NraW5nU3RhdHVzXG5cdH1cblxuXHRpc1dhcm5pbmdEaXNtaXNzZWQoKSB7XG5cdFx0cmV0dXJuIHRoaXMud2FybmluZ0Rpc21pc3NlZFxuXHR9XG5cblx0c2V0V2FybmluZ0Rpc21pc3NlZChkaXNtaXNzZWQ6IGJvb2xlYW4pIHtcblx0XHR0aGlzLndhcm5pbmdEaXNtaXNzZWQgPSBkaXNtaXNzZWRcblx0fVxuXG5cdGFzeW5jIHNldENvbnRlbnRCbG9ja2luZ1N0YXR1cyhzdGF0dXM6IENvbnRlbnRCbG9ja2luZ1N0YXR1cyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdC8vIFdlIGNhbiBvbmx5IGJlIHNldCB0byBOb0V4dGVybmFsQ29udGVudCB3aGVuIGluaXRpYWxseSBsb2FkaW5nIHRoZSBtYWlsYm9keSAoX2xvYWRNYWlsQm9keSlcblx0XHQvLyBzbyB3ZSBpZ25vcmUgaXQgaGVyZSwgYW5kIGRvbid0IGRvIGFueXRoaW5nIGlmIHdlIHdlcmUgYWxyZWFkeSBzZXQgdG8gTm9FeHRlcm5hbENvbnRlbnRcblx0XHRpZiAoXG5cdFx0XHRzdGF0dXMgPT09IENvbnRlbnRCbG9ja2luZ1N0YXR1cy5Ob0V4dGVybmFsQ29udGVudCB8fFxuXHRcdFx0dGhpcy5jb250ZW50QmxvY2tpbmdTdGF0dXMgPT09IENvbnRlbnRCbG9ja2luZ1N0YXR1cy5Ob0V4dGVybmFsQ29udGVudCB8fFxuXHRcdFx0dGhpcy5jb250ZW50QmxvY2tpbmdTdGF0dXMgPT09IHN0YXR1c1xuXHRcdCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0aWYgKHN0YXR1cyA9PT0gQ29udGVudEJsb2NraW5nU3RhdHVzLkFsd2F5c1Nob3cpIHtcblx0XHRcdHRoaXMuY29uZmlnRmFjYWRlLmFkZEV4dGVybmFsSW1hZ2VSdWxlKHRoaXMuZ2V0U2VuZGVyKCkuYWRkcmVzcywgRXh0ZXJuYWxJbWFnZVJ1bGUuQWxsb3cpLmNhdGNoKG9mQ2xhc3MoSW5kZXhpbmdOb3RTdXBwb3J0ZWRFcnJvciwgbm9PcCkpXG5cdFx0fSBlbHNlIGlmIChzdGF0dXMgPT09IENvbnRlbnRCbG9ja2luZ1N0YXR1cy5BbHdheXNCbG9jaykge1xuXHRcdFx0dGhpcy5jb25maWdGYWNhZGUuYWRkRXh0ZXJuYWxJbWFnZVJ1bGUodGhpcy5nZXRTZW5kZXIoKS5hZGRyZXNzLCBFeHRlcm5hbEltYWdlUnVsZS5CbG9jaykuY2F0Y2gob2ZDbGFzcyhJbmRleGluZ05vdFN1cHBvcnRlZEVycm9yLCBub09wKSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gd2UgYXJlIGdvaW5nIGZyb20gYWxsb3cgb3IgYmxvY2sgdG8gc29tZXRoaW5nIGVsc2UgaXQgbWVhbnMgd2UncmUgcmVzZXR0aW5nIHRvIHRoZSBkZWZhdWx0IHJ1bGUgZm9yIHRoZSBnaXZlbiBzZW5kZXJcblx0XHRcdHRoaXMuY29uZmlnRmFjYWRlLmFkZEV4dGVybmFsSW1hZ2VSdWxlKHRoaXMuZ2V0U2VuZGVyKCkuYWRkcmVzcywgRXh0ZXJuYWxJbWFnZVJ1bGUuTm9uZSkuY2F0Y2gob2ZDbGFzcyhJbmRleGluZ05vdFN1cHBvcnRlZEVycm9yLCBub09wKSlcblx0XHR9XG5cblx0XHQvLyBXZSBkb24ndCBjaGVjayBtYWlsIGF1dGhlbnRpY2F0aW9uIHN0YXR1cyBoZXJlIGJlY2F1c2UgdGhlIHVzZXIgaGFzIG1hbnVhbGx5IGNhbGxlZCB0aGlzXG5cdFx0dGhpcy5zYW5pdGl6ZVJlc3VsdCA9IGF3YWl0IHRoaXMuc2FuaXRpemVNYWlsQm9keSh0aGlzLm1haWwsIHN0YXR1cyA9PT0gQ29udGVudEJsb2NraW5nU3RhdHVzLkJsb2NrIHx8IHN0YXR1cyA9PT0gQ29udGVudEJsb2NraW5nU3RhdHVzLkFsd2F5c0Jsb2NrKVxuXHRcdC8vZm9sbG93LXVwIGFjdGlvbnMgcmVzdWx0aW5nIGZyb20gYSBjaGFuZ2VkIGJsb2NraW5nIHN0YXR1cyBtdXN0IHN0YXJ0IGFmdGVyIHNhbml0aXphdGlvbiBmaW5pc2hlZFxuXHRcdHRoaXMuY29udGVudEJsb2NraW5nU3RhdHVzID0gc3RhdHVzXG5cdH1cblxuXHRhc3luYyBtYXJrQXNOb3RQaGlzaGluZygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBvbGRTdGF0dXMgPSB0aGlzLmdldFBoaXNoaW5nU3RhdHVzKClcblxuXHRcdGlmIChvbGRTdGF0dXMgPT09IE1haWxQaGlzaGluZ1N0YXR1cy5XSElURUxJU1RFRCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0dGhpcy5zZXRQaGlzaGluZ1N0YXR1cyhNYWlsUGhpc2hpbmdTdGF0dXMuV0hJVEVMSVNURUQpXG5cblx0XHRhd2FpdCB0aGlzLmVudGl0eUNsaWVudC51cGRhdGUodGhpcy5tYWlsKS5jYXRjaCgoKSA9PiB0aGlzLnNldFBoaXNoaW5nU3RhdHVzKG9sZFN0YXR1cykpXG5cdH1cblxuXHRhc3luYyByZXBvcnRNYWlsKHJlcG9ydFR5cGU6IE1haWxSZXBvcnRUeXBlKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMubWFpbE1vZGVsLnJlcG9ydE1haWxzKHJlcG9ydFR5cGUsIFt0aGlzLm1haWxdKVxuXHRcdFx0aWYgKHJlcG9ydFR5cGUgPT09IE1haWxSZXBvcnRUeXBlLlBISVNISU5HKSB7XG5cdFx0XHRcdHRoaXMuc2V0UGhpc2hpbmdTdGF0dXMoTWFpbFBoaXNoaW5nU3RhdHVzLlNVU1BJQ0lPVVMpXG5cdFx0XHRcdGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LnVwZGF0ZSh0aGlzLm1haWwpXG5cdFx0XHR9XG5cdFx0XHRjb25zdCBtYWlsYm94RGV0YWlsID0gYXdhaXQgdGhpcy5tYWlsTW9kZWwuZ2V0TWFpbGJveERldGFpbHNGb3JNYWlsKHRoaXMubWFpbClcblx0XHRcdGlmIChtYWlsYm94RGV0YWlsID09IG51bGwgfHwgbWFpbGJveERldGFpbC5tYWlsYm94LmZvbGRlcnMgPT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblx0XHRcdGNvbnN0IGZvbGRlcnMgPSBhd2FpdCB0aGlzLm1haWxNb2RlbC5nZXRNYWlsYm94Rm9sZGVyc0ZvcklkKG1haWxib3hEZXRhaWwubWFpbGJveC5mb2xkZXJzLl9pZClcblx0XHRcdGNvbnN0IHNwYW1Gb2xkZXIgPSBhc3NlcnRTeXN0ZW1Gb2xkZXJPZlR5cGUoZm9sZGVycywgTWFpbFNldEtpbmQuU1BBTSlcblx0XHRcdC8vIGRvIG5vdCByZXBvcnQgbW92ZWQgbWFpbHMgYWdhaW5cblx0XHRcdGF3YWl0IG1vdmVNYWlscyh7XG5cdFx0XHRcdG1haWxib3hNb2RlbDogdGhpcy5tYWlsYm94TW9kZWwsXG5cdFx0XHRcdG1haWxNb2RlbDogdGhpcy5tYWlsTW9kZWwsXG5cdFx0XHRcdG1haWxzOiBbdGhpcy5tYWlsXSxcblx0XHRcdFx0dGFyZ2V0TWFpbEZvbGRlcjogc3BhbUZvbGRlcixcblx0XHRcdFx0aXNSZXBvcnRhYmxlOiBmYWxzZSxcblx0XHRcdH0pXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBOb3RGb3VuZEVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwibWFpbCBhbHJlYWR5IG1vdmVkXCIpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBlXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Y2FuRXhwb3J0KCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiAhdGhpcy5pc0Fubm91bmNlbWVudCgpICYmICF0aGlzLmxvZ2lucy5pc0VuYWJsZWQoRmVhdHVyZVR5cGUuRGlzYWJsZU1haWxFeHBvcnQpXG5cdH1cblxuXHRjYW5QcmludCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gIXRoaXMubG9naW5zLmlzRW5hYmxlZChGZWF0dXJlVHlwZS5EaXNhYmxlTWFpbEV4cG9ydClcblx0fVxuXG5cdGNhblJlcG9ydCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRQaGlzaGluZ1N0YXR1cygpID09PSBNYWlsUGhpc2hpbmdTdGF0dXMuVU5LTk9XTiAmJiAhdGhpcy5pc1R1dGFub3RhVGVhbU1haWwoKSAmJiB0aGlzLmxvZ2lucy5pc0ludGVybmFsVXNlckxvZ2dlZEluKClcblx0fVxuXG5cdGNhblNob3dIZWFkZXJzKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmxvZ2lucy5pc0ludGVybmFsVXNlckxvZ2dlZEluKClcblx0fVxuXG5cdGNhblBlcnNpc3RCbG9ja2luZ1N0YXR1cygpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5zZWFyY2hNb2RlbC5pbmRleGluZ1N1cHBvcnRlZFxuXHR9XG5cblx0YXN5bmMgZXhwb3J0TWFpbCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRhd2FpdCBleHBvcnRNYWlscyhbdGhpcy5tYWlsXSwgdGhpcy5tYWlsRmFjYWRlLCB0aGlzLmVudGl0eUNsaWVudCwgdGhpcy5maWxlQ29udHJvbGxlciwgdGhpcy5jcnlwdG9GYWNhZGUpXG5cdH1cblxuXHRhc3luYyBnZXRIZWFkZXJzKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuXHRcdC8vIG1ha2Ugc3VyZSB0aGF0IHRoZSBtYWlsRGV0YWlscyBhcmUgbG9hZGVkXG5cdFx0Y29uc3QgbWFpbERldGFpbHMgPSBhd2FpdCBsb2FkTWFpbERldGFpbHModGhpcy5tYWlsRmFjYWRlLCB0aGlzLm1haWwpXG5cdFx0cmV0dXJuIGxvYWRNYWlsSGVhZGVycyhtYWlsRGV0YWlscylcblx0fVxuXG5cdGlzVW5yZWFkKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLm1haWwudW5yZWFkXG5cdH1cblxuXHRhc3luYyBzZXRVbnJlYWQodW5yZWFkOiBib29sZWFuKSB7XG5cdFx0aWYgKHRoaXMubWFpbC51bnJlYWQgIT09IHVucmVhZCkge1xuXHRcdFx0dGhpcy5tYWlsLnVucmVhZCA9IHVucmVhZFxuXG5cdFx0XHRhd2FpdCB0aGlzLmVudGl0eUNsaWVudFxuXHRcdFx0XHQudXBkYXRlKHRoaXMubWFpbClcblx0XHRcdFx0LmNhdGNoKG9mQ2xhc3MoTG9ja2VkRXJyb3IsICgpID0+IGNvbnNvbGUubG9nKFwiY291bGQgbm90IHVwZGF0ZSBtYWlsIHJlYWQgc3RhdGU6IFwiLCBsYW5nLmdldChcIm9wZXJhdGlvblN0aWxsQWN0aXZlX21zZ1wiKSkpKVxuXHRcdFx0XHQuY2F0Y2gob2ZDbGFzcyhOb3RGb3VuZEVycm9yLCBub09wKSlcblx0XHR9XG5cdH1cblxuXHRpc0xpc3RVbnN1YnNjcmliZSgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5tYWlsLmxpc3RVbnN1YnNjcmliZVxuXHR9XG5cblx0aXNBbm5vdW5jZW1lbnQoKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgcmVwbHlUb3MgPSB0aGlzLm1haWxEZXRhaWxzPy5yZXBseVRvc1xuXHRcdHJldHVybiAoXG5cdFx0XHRpc1N5c3RlbU5vdGlmaWNhdGlvbih0aGlzLm1haWwpICYmXG5cdFx0XHQvLyBoaWRlIHRoZSBhY3Rpb25zIHVudGlsIG1haWxEZXRhaWxzIGFyZSBsb2FkZWQgcmF0aGVyIHRoYW4gc2hvd2luZyB0aGVtIHF1aWNrbHkgYW5kIHRoZW4gaGlkaW5nIHRoZW1cblx0XHRcdChyZXBseVRvcyA9PSBudWxsIHx8IHJlcGx5VG9zPy5sZW5ndGggPT09IDAgfHwgKHJlcGx5VG9zPy5sZW5ndGggPT09IDEgJiYgaXNOb1JlcGx5VGVhbUFkZHJlc3MocmVwbHlUb3NbMF0uYWRkcmVzcykpKVxuXHRcdClcblx0fVxuXG5cdGFzeW5jIHVuc3Vic2NyaWJlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGlmICghdGhpcy5pc0xpc3RVbnN1YnNjcmliZSgpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cblx0XHRjb25zdCBtYWlsSGVhZGVycyA9IGF3YWl0IHRoaXMuZ2V0SGVhZGVycygpXG5cdFx0aWYgKCFtYWlsSGVhZGVycykge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXHRcdGNvbnN0IHVuc3ViSGVhZGVycyA9IG1haWxIZWFkZXJzXG5cdFx0XHQucmVwbGFjZUFsbCgvXFxyXFxuL2csIFwiXFxuXCIpIC8vIHJlcGxhY2UgYWxsIENSIExGIHdpdGggTEZcblx0XHRcdC5yZXBsYWNlQWxsKC9cXG5bIFxcdF0vZywgXCJcIikgLy8gam9pbiBtdWx0aWxpbmUgaGVhZGVycyB0byBhIHNpbmdsZSBsaW5lXG5cdFx0XHQuc3BsaXQoXCJcXG5cIikgLy8gc3BsaXQgaGVhZGVyc1xuXHRcdFx0LmZpbHRlcigoaGVhZGVyTGluZSkgPT4gaGVhZGVyTGluZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCJsaXN0LXVuc3Vic2NyaWJlXCIpKVxuXHRcdGlmICh1bnN1YkhlYWRlcnMubGVuZ3RoID4gMCkge1xuXHRcdFx0Y29uc3QgcmVjaXBpZW50ID0gYXdhaXQgdGhpcy5nZXRTZW5kZXJPZlJlc3BvbnNlTWFpbCgpXG5cdFx0XHRhd2FpdCB0aGlzLm1haWxNb2RlbC51bnN1YnNjcmliZSh0aGlzLm1haWwsIHJlY2lwaWVudCwgdW5zdWJIZWFkZXJzKVxuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRNYWlsYm94RGV0YWlscygpOiBQcm9taXNlPE1haWxib3hEZXRhaWwgfCBudWxsPiB7XG5cdFx0cmV0dXJuIHRoaXMubWFpbE1vZGVsLmdldE1haWxib3hEZXRhaWxzRm9yTWFpbCh0aGlzLm1haWwpXG5cdH1cblxuXHQvKiogQHJldHVybiBsaXN0IG9mIGlubGluZSByZWZlcmVuY2VkIGNpZCAqL1xuXHRwcml2YXRlIGFzeW5jIGxvYWRBbmRQcm9jZXNzQWRkaXRpb25hbE1haWxJbmZvKG1haWw6IE1haWwsIGRlbGF5Qm9keVJlbmRlcmluZ1VudGlsOiBQcm9taXNlPHVua25vd24+KTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuXHRcdC8vIElmIHRoZSBtYWlsIGlzIGEgbm9uLWRyYWZ0IGFuZCB3ZSBoYXZlIGxvYWRlZCBpdCBiZWZvcmUsIHdlIGRvbid0IG5lZWQgdG8gcmVsb2FkIGl0IGJlY2F1c2UgaXQgY2Fubm90IGhhdmUgYmVlbiBlZGl0ZWQsIHNvIHdlIHJldHVybiBlYXJseVxuXHRcdC8vIGRyYWZ0cyBob3dldmVyIGNhbiBiZSBlZGl0ZWQsIGFuZCB3ZSB3YW50IHRvIHJlY2VpdmUgdGhlIGNoYW5nZXMsIHNvIGZvciBkcmFmdHMgd2Ugd2lsbCBhbHdheXMgcmVsb2FkXG5cdFx0bGV0IGlzRHJhZnQgPSBtYWlsLnN0YXRlID09PSBNYWlsU3RhdGUuRFJBRlRcblx0XHRpZiAodGhpcy5yZW5kZXJlZE1haWwgIT0gbnVsbCAmJiBoYXZlU2FtZUlkKG1haWwsIHRoaXMucmVuZGVyZWRNYWlsKSAmJiAhaXNEcmFmdCAmJiB0aGlzLnNhbml0aXplUmVzdWx0ICE9IG51bGwpIHtcblx0XHRcdHJldHVybiB0aGlzLnNhbml0aXplUmVzdWx0LmlubGluZUltYWdlQ2lkc1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLm1haWxEZXRhaWxzID0gYXdhaXQgbG9hZE1haWxEZXRhaWxzKHRoaXMubWFpbEZhY2FkZSwgdGhpcy5tYWlsKVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcImNvdWxkIGxvYWQgbWFpbCBib2R5IGFzIGl0IGhhcyBiZWVuIG1vdmVkL2RlbGV0ZWQgYWxyZWFkeVwiLCBlKVxuXHRcdFx0XHR0aGlzLmVycm9yT2NjdXJyZWQgPSB0cnVlXG5cdFx0XHRcdHJldHVybiBbXVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE5vdEF1dGhvcml6ZWRFcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcImNvdWxkIGxvYWQgbWFpbCBib2R5IGFzIHRoZSBwZXJtaXNzaW9uIGlzIG1pc3NpbmdcIiwgZSlcblx0XHRcdFx0dGhpcy5lcnJvck9jY3VycmVkID0gdHJ1ZVxuXHRcdFx0XHRyZXR1cm4gW11cblx0XHRcdH1cblxuXHRcdFx0dGhyb3cgZVxuXHRcdH1cblxuXHRcdGNvbnN0IGV4dGVybmFsSW1hZ2VSdWxlID0gYXdhaXQgdGhpcy5jb25maWdGYWNhZGUuZ2V0RXh0ZXJuYWxJbWFnZVJ1bGUobWFpbC5zZW5kZXIuYWRkcmVzcykuY2F0Y2goKGUpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKFwiRXJyb3IgZ2V0dGluZyBleHRlcm5hbCBpbWFnZSBydWxlOlwiLCBlKVxuXHRcdFx0cmV0dXJuIEV4dGVybmFsSW1hZ2VSdWxlLk5vbmVcblx0XHR9KVxuXHRcdGNvbnN0IGlzQWxsb3dlZEFuZEF1dGhlbnRpY2F0ZWRFeHRlcm5hbFNlbmRlciA9XG5cdFx0XHRleHRlcm5hbEltYWdlUnVsZSA9PT0gRXh0ZXJuYWxJbWFnZVJ1bGUuQWxsb3cgJiYgdGhpcy5jaGVja01haWxBdXRoZW50aWNhdGlvblN0YXR1cyhNYWlsQXV0aGVudGljYXRpb25TdGF0dXMuQVVUSEVOVElDQVRFRClcblx0XHQvLyBXZSBzaG91bGQgbm90IHRyeSB0byBzYW5pdGl6ZSBib2R5IHdoaWxlIHdlIHN0aWxsIGFuaW1hdGUgYmVjYXVzZSBpdCdzIGEgaGVhdnkgb3BlcmF0aW9uLlxuXHRcdGF3YWl0IGRlbGF5Qm9keVJlbmRlcmluZ1VudGlsXG5cdFx0dGhpcy5yZW5kZXJJc0RlbGF5ZWQgPSBmYWxzZVxuXG5cdFx0dGhpcy5zYW5pdGl6ZVJlc3VsdCA9IGF3YWl0IHRoaXMuc2FuaXRpemVNYWlsQm9keShtYWlsLCAhaXNBbGxvd2VkQW5kQXV0aGVudGljYXRlZEV4dGVybmFsU2VuZGVyKVxuXG5cdFx0aWYgKCFpc0RyYWZ0KSB7XG5cdFx0XHR0aGlzLmNoZWNrTWFpbEZvclBoaXNoaW5nKG1haWwsIHRoaXMuc2FuaXRpemVSZXN1bHQubGlua3MpXG5cdFx0fVxuXG5cdFx0dGhpcy5jb250ZW50QmxvY2tpbmdTdGF0dXMgPVxuXHRcdFx0ZXh0ZXJuYWxJbWFnZVJ1bGUgPT09IEV4dGVybmFsSW1hZ2VSdWxlLkJsb2NrXG5cdFx0XHRcdD8gQ29udGVudEJsb2NraW5nU3RhdHVzLkFsd2F5c0Jsb2NrXG5cdFx0XHRcdDogaXNBbGxvd2VkQW5kQXV0aGVudGljYXRlZEV4dGVybmFsU2VuZGVyXG5cdFx0XHRcdD8gQ29udGVudEJsb2NraW5nU3RhdHVzLkFsd2F5c1Nob3dcblx0XHRcdFx0OiB0aGlzLnNhbml0aXplUmVzdWx0LmJsb2NrZWRFeHRlcm5hbENvbnRlbnQgPiAwXG5cdFx0XHRcdD8gQ29udGVudEJsb2NraW5nU3RhdHVzLkJsb2NrXG5cdFx0XHRcdDogQ29udGVudEJsb2NraW5nU3RhdHVzLk5vRXh0ZXJuYWxDb250ZW50XG5cdFx0bS5yZWRyYXcoKVxuXHRcdHRoaXMucmVuZGVyZWRNYWlsID0gdGhpcy5tYWlsXG5cdFx0cmV0dXJuIHRoaXMuc2FuaXRpemVSZXN1bHQuaW5saW5lSW1hZ2VDaWRzXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGxvYWRBdHRhY2htZW50cyhtYWlsOiBNYWlsLCBpbmxpbmVDaWRzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmIChtYWlsLmF0dGFjaG1lbnRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhpcy5sb2FkaW5nQXR0YWNobWVudHMgPSBmYWxzZVxuXHRcdFx0bS5yZWRyYXcoKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmxvYWRpbmdBdHRhY2htZW50cyA9IHRydWVcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLmNyeXB0b0ZhY2FkZS5lbmZvcmNlU2Vzc2lvbktleVVwZGF0ZUlmTmVlZGVkKHRoaXMuX21haWwsIGF3YWl0IHRoaXMubWFpbEZhY2FkZS5sb2FkQXR0YWNobWVudHMobWFpbCkpXG5cblx0XHRcdFx0dGhpcy5oYW5kbGVDYWxlbmRhckZpbGUoZmlsZXMsIG1haWwpXG5cblx0XHRcdFx0dGhpcy5hdHRhY2htZW50cyA9IGZpbGVzXG5cdFx0XHRcdHRoaXMubG9hZGluZ0F0dGFjaG1lbnRzID0gZmFsc2Vcblx0XHRcdFx0bS5yZWRyYXcoKVxuXG5cdFx0XHRcdC8vIFdlIGNhbiBsb2FkIGFueSBvdGhlciBwYXJ0IGFnYWluIGJlY2F1c2UgdGhleSBhcmUgY2FjaGVkIGJ1dCBpbmxpbmUgaW1hZ2VzIGFyZSBmaWxlRGF0YSBlLmcuIGJpbmFyeSBibG9icyBzbyB3ZSBkb24ndCBjYWNoZSB0aGVtIGxpa2Vcblx0XHRcdFx0Ly8gZW50aXRpZXMuIFNvIGluc3RlYWQgd2UgY2hlY2sgaGVyZSB3aGV0aGVyIHdlIG5lZWQgdG8gbG9hZCB0aGVtLlxuXHRcdFx0XHRpZiAodGhpcy5sb2FkZWRJbmxpbmVJbWFnZXMgPT0gbnVsbCkge1xuXHRcdFx0XHRcdHRoaXMubG9hZGVkSW5saW5lSW1hZ2VzID0gYXdhaXQgbG9hZElubGluZUltYWdlcyh0aGlzLmZpbGVDb250cm9sbGVyLCBmaWxlcywgaW5saW5lQ2lkcylcblx0XHRcdFx0fVxuXHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiY291bGQgbG9hZCBhdHRhY2htZW50cyBhcyB0aGV5IGhhdmUgYmVlbiBtb3ZlZC9kZWxldGVkIGFscmVhZHlcIiwgZSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdyBlXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGNoZWNrTWFpbEZvclBoaXNoaW5nKG1haWw6IE1haWwsIGxpbmtzOiBBcnJheTxIVE1MRWxlbWVudD4pIHtcblx0XHRpZiAobWFpbC5waGlzaGluZ1N0YXR1cyA9PT0gTWFpbFBoaXNoaW5nU3RhdHVzLlVOS05PV04pIHtcblx0XHRcdGNvbnN0IGxpbmtPYmplY3RzID0gbGlua3MubWFwKChsaW5rKSA9PiB7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0aHJlZjogbGluay5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpIHx8IFwiXCIsXG5cdFx0XHRcdFx0aW5uZXJIVE1MOiBsaW5rLmlubmVySFRNTCxcblx0XHRcdFx0fVxuXHRcdFx0fSlcblxuXHRcdFx0dGhpcy5tYWlsTW9kZWwuY2hlY2tNYWlsRm9yUGhpc2hpbmcobWFpbCwgbGlua09iamVjdHMpLnRoZW4oKGlzU3VzcGljaW91cykgPT4ge1xuXHRcdFx0XHRpZiAoaXNTdXNwaWNpb3VzKSB7XG5cdFx0XHRcdFx0bWFpbC5waGlzaGluZ1N0YXR1cyA9IE1haWxQaGlzaGluZ1N0YXR1cy5TVVNQSUNJT1VTXG5cblx0XHRcdFx0XHR0aGlzLmVudGl0eUNsaWVudFxuXHRcdFx0XHRcdFx0LnVwZGF0ZShtYWlsKVxuXHRcdFx0XHRcdFx0LmNhdGNoKG9mQ2xhc3MoTG9ja2VkRXJyb3IsIChlKSA9PiBjb25zb2xlLmxvZyhcImNvdWxkIG5vdCB1cGRhdGUgbWFpbCBwaGlzaGluZyBzdGF0dXMgYXMgbWFpbCBpcyBsb2NrZWRcIikpKVxuXHRcdFx0XHRcdFx0LmNhdGNoKG9mQ2xhc3MoTm90Rm91bmRFcnJvciwgKGUpID0+IGNvbnNvbGUubG9nKFwibWFpbCBhbHJlYWR5IG1vdmVkXCIpKSlcblxuXHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2sgaWYgdGhlIGxpc3Qgb2YgZmlsZXMgY29udGFpbiBhbiBpQ2FsIGZpbGUgd2hpY2ggd2UgY2FuIHRoZW4gbG9hZCBhbmQgZGlzcGxheSBkZXRhaWxzIGZvci4gQSBjYWxlbmRhciBub3RpZmljYXRpb25cblx0ICogc2hvdWxkIGNvbnRhaW4gb25seSBvbmUgaUNhbCBhdHRhY2htZW50LCBzbyB3ZSBvbmx5IHByb2Nlc3MgdGhlIGZpcnN0IG1hdGNoaW5nIG9uZS5cblx0ICpcblx0ICogKHRoaXMgaXMgbm90IHRydWUgZm9yIGllIGdvb2dsZSBjYWxlbmRhciwgdGhleSBzZW5kIHRoZSBpbnZpdGUgdHdpY2UgaW4gZWFjaCBtYWlsLCBidXQgaXQncyBhbHdheXMgdGhlIHNhbWUgZmlsZSB0d2ljZSlcblx0ICovXG5cdHByaXZhdGUgaGFuZGxlQ2FsZW5kYXJGaWxlKGZpbGVzOiBBcnJheTxUdXRhbm90YUZpbGU+LCBtYWlsOiBNYWlsKTogdm9pZCB7XG5cdFx0Y29uc3QgY2FsZW5kYXJGaWxlID0gZmlsZXMuZmluZCgoYSkgPT4gYS5taW1lVHlwZSAmJiBhLm1pbWVUeXBlLnN0YXJ0c1dpdGgoQ0FMRU5EQVJfTUlNRV9UWVBFKSlcblxuXHRcdGlmIChjYWxlbmRhckZpbGUgJiYgKG1haWwubWV0aG9kID09PSBNYWlsTWV0aG9kLklDQUxfUkVRVUVTVCB8fCBtYWlsLm1ldGhvZCA9PT0gTWFpbE1ldGhvZC5JQ0FMX1JFUExZKSAmJiBtYWlsLnN0YXRlID09PSBNYWlsU3RhdGUuUkVDRUlWRUQpIHtcblx0XHRcdFByb21pc2UuYWxsKFtcblx0XHRcdFx0aW1wb3J0KFwiLi4vLi4vLi4vY2FsZW5kYXItYXBwL2NhbGVuZGFyL3ZpZXcvQ2FsZW5kYXJJbnZpdGVzLmpzXCIpLnRoZW4oKHsgZ2V0RXZlbnRzRnJvbUZpbGUgfSkgPT5cblx0XHRcdFx0XHRnZXRFdmVudHNGcm9tRmlsZShjYWxlbmRhckZpbGUsIG1haWwuY29uZmlkZW50aWFsKSxcblx0XHRcdFx0KSxcblx0XHRcdFx0dGhpcy5nZXRTZW5kZXJPZlJlc3BvbnNlTWFpbCgpLFxuXHRcdFx0XSkudGhlbigoW2NvbnRlbnRzLCByZWNpcGllbnRdKSA9PiB7XG5cdFx0XHRcdHRoaXMuY2FsZW5kYXJFdmVudEF0dGFjaG1lbnQgPVxuXHRcdFx0XHRcdGNvbnRlbnRzICE9IG51bGxcblx0XHRcdFx0XHRcdD8ge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnRlbnRzLFxuXHRcdFx0XHRcdFx0XHRcdHJlY2lwaWVudCxcblx0XHRcdFx0XHRcdCAgfVxuXHRcdFx0XHRcdFx0OiBudWxsXG5cdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdH0pXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRTZW5kZXJPZlJlc3BvbnNlTWFpbCgpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdHJldHVybiB0aGlzLm1haWxNb2RlbC5nZXRNYWlsYm94RGV0YWlsc0Zvck1haWwodGhpcy5tYWlsKS50aGVuKGFzeW5jIChtYWlsYm94RGV0YWlscykgPT4ge1xuXHRcdFx0YXNzZXJ0Tm9uTnVsbChtYWlsYm94RGV0YWlscywgXCJNYWlsIGxpc3QgZG9lcyBub3QgZXhpc3QgYW55bW9yZVwiKVxuXHRcdFx0Y29uc3QgbXlNYWlsQWRkcmVzc2VzID0gZ2V0RW5hYmxlZE1haWxBZGRyZXNzZXNXaXRoVXNlcihtYWlsYm94RGV0YWlscywgdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyR3JvdXBJbmZvKVxuXHRcdFx0Y29uc3QgYWRkcmVzc2VzSW5NYWlsOiBNYWlsQWRkcmVzc1tdID0gW11cblx0XHRcdGNvbnN0IG1haWxEZXRhaWxzID0gYXdhaXQgbG9hZE1haWxEZXRhaWxzKHRoaXMubWFpbEZhY2FkZSwgdGhpcy5tYWlsKVxuXHRcdFx0YWRkcmVzc2VzSW5NYWlsLnB1c2goLi4ubWFpbERldGFpbHMucmVjaXBpZW50cy50b1JlY2lwaWVudHMpXG5cdFx0XHRhZGRyZXNzZXNJbk1haWwucHVzaCguLi5tYWlsRGV0YWlscy5yZWNpcGllbnRzLmNjUmVjaXBpZW50cylcblx0XHRcdGFkZHJlc3Nlc0luTWFpbC5wdXNoKC4uLm1haWxEZXRhaWxzLnJlY2lwaWVudHMuYmNjUmVjaXBpZW50cylcblxuXHRcdFx0Y29uc3QgbWFpbEFkZHJlc3NBbmROYW1lID0gdGhpcy5nZXREaXNwbGF5ZWRTZW5kZXIoKVxuXHRcdFx0aWYgKG1haWxBZGRyZXNzQW5kTmFtZSkge1xuXHRcdFx0XHRhZGRyZXNzZXNJbk1haWwucHVzaChcblx0XHRcdFx0XHRjcmVhdGVNYWlsQWRkcmVzcyh7XG5cdFx0XHRcdFx0XHRuYW1lOiBtYWlsQWRkcmVzc0FuZE5hbWUubmFtZSxcblx0XHRcdFx0XHRcdGFkZHJlc3M6IG1haWxBZGRyZXNzQW5kTmFtZS5hZGRyZXNzLFxuXHRcdFx0XHRcdFx0Y29udGFjdDogbnVsbCxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KVxuXHRcdFx0fVxuXHRcdFx0Y29uc3QgZm91bmRBZGRyZXNzID0gYWRkcmVzc2VzSW5NYWlsLmZpbmQoKGFkZHJlc3MpID0+IGNvbnRhaW5zKG15TWFpbEFkZHJlc3NlcywgYWRkcmVzcy5hZGRyZXNzLnRvTG93ZXJDYXNlKCkpKVxuXHRcdFx0aWYgKGZvdW5kQWRkcmVzcykge1xuXHRcdFx0XHRyZXR1cm4gZm91bmRBZGRyZXNzLmFkZHJlc3MudG9Mb3dlckNhc2UoKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIGdldERlZmF1bHRTZW5kZXIodGhpcy5sb2dpbnMsIG1haWxib3hEZXRhaWxzKVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHQvKiogQHRocm93cyBVc2VyRXJyb3IgKi9cblx0YXN5bmMgZm9yd2FyZCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBzZW5kQWxsb3dlZCA9IGF3YWl0IGNoZWNrQXBwcm92YWxTdGF0dXModGhpcy5sb2dpbnMsIGZhbHNlKVxuXHRcdGlmIChzZW5kQWxsb3dlZCkge1xuXHRcdFx0Y29uc3QgYXJncyA9IGF3YWl0IHRoaXMuY3JlYXRlUmVzcG9uc2VNYWlsQXJnc0ZvckZvcndhcmRpbmcoW10sIFtdLCB0cnVlKVxuXHRcdFx0Y29uc3QgW21haWxib3hEZXRhaWxzLCB7IG5ld01haWxFZGl0b3JBc1Jlc3BvbnNlIH1dID0gYXdhaXQgUHJvbWlzZS5hbGwoW3RoaXMuZ2V0TWFpbGJveERldGFpbHMoKSwgaW1wb3J0KFwiLi4vZWRpdG9yL01haWxFZGl0b3JcIildKVxuXHRcdFx0aWYgKG1haWxib3hEZXRhaWxzID09IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGlzUmVsb2FkTmVlZGVkID0gIXRoaXMuc2FuaXRpemVSZXN1bHQgfHwgdGhpcy5tYWlsLmF0dGFjaG1lbnRzLmxlbmd0aCAhPT0gdGhpcy5hdHRhY2htZW50cy5sZW5ndGhcblx0XHRcdGlmIChpc1JlbG9hZE5lZWRlZCkge1xuXHRcdFx0XHQvLyBDYWxsIHRoaXMgYWdhaW4gdG8gbWFrZSBzdXJlIGV2ZXJ5dGhpbmcgaXMgbG9hZGVkLCBpbmNsdWRpbmcgaW5saW5lIGltYWdlcyBiZWNhdXNlIHRoaXMgY2FuIGJlIGNhbGxlZCBlYXJsaWVyIHRoYW4gYWxsIHRoZSBwYXJ0cyBhcmUgbG9hZGVkLlxuXHRcdFx0XHRhd2FpdCB0aGlzLmxvYWRBbGwoUHJvbWlzZS5yZXNvbHZlKCksIHsgbm90aWZ5OiB0cnVlIH0pXG5cdFx0XHR9XG5cdFx0XHRjb25zdCBlZGl0b3IgPSBhd2FpdCBuZXdNYWlsRWRpdG9yQXNSZXNwb25zZShhcmdzLCB0aGlzLmlzQmxvY2tpbmdFeHRlcm5hbEltYWdlcygpLCB0aGlzLmdldExvYWRlZElubGluZUltYWdlcygpLCBtYWlsYm94RGV0YWlscylcblx0XHRcdGVkaXRvci5zaG93KClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGNyZWF0ZVJlc3BvbnNlTWFpbEFyZ3NGb3JGb3J3YXJkaW5nKFxuXHRcdHJlY2lwaWVudHM6IE1haWxBZGRyZXNzW10sXG5cdFx0cmVwbHlUb3M6IEVuY3J5cHRlZE1haWxBZGRyZXNzW10sXG5cdFx0YWRkU2lnbmF0dXJlOiBib29sZWFuLFxuXHQpOiBQcm9taXNlPEluaXRBc1Jlc3BvbnNlQXJncz4ge1xuXHRcdGxldCBpbmZvTGluZSA9IGxhbmcuZ2V0KFwiZGF0ZV9sYWJlbFwiKSArIFwiOiBcIiArIGZvcm1hdERhdGVUaW1lKHRoaXMubWFpbC5yZWNlaXZlZERhdGUpICsgXCI8YnI+XCJcblx0XHRjb25zdCBzZW5kZXJBZGRyZXNzID0gdGhpcy5nZXREaXNwbGF5ZWRTZW5kZXIoKT8uYWRkcmVzc1xuXHRcdGlmIChzZW5kZXJBZGRyZXNzKSB7XG5cdFx0XHRpbmZvTGluZSArPSBsYW5nLmdldChcImZyb21fbGFiZWxcIikgKyBcIjogXCIgKyBzZW5kZXJBZGRyZXNzICsgXCI8YnI+XCJcblx0XHR9XG5cblx0XHRpZiAodGhpcy5nZXRUb1JlY2lwaWVudHMoKS5sZW5ndGggPiAwKSB7XG5cdFx0XHRpbmZvTGluZSArPVxuXHRcdFx0XHRsYW5nLmdldChcInRvX2xhYmVsXCIpICtcblx0XHRcdFx0XCI6IFwiICtcblx0XHRcdFx0dGhpcy5nZXRUb1JlY2lwaWVudHMoKVxuXHRcdFx0XHRcdC5tYXAoKHJlY2lwaWVudCkgPT4gcmVjaXBpZW50LmFkZHJlc3MpXG5cdFx0XHRcdFx0LmpvaW4oXCIsIFwiKVxuXHRcdFx0aW5mb0xpbmUgKz0gXCI8YnI+XCJcblx0XHR9XG5cblx0XHRpZiAodGhpcy5nZXRDY1JlY2lwaWVudHMoKS5sZW5ndGggPiAwKSB7XG5cdFx0XHRpbmZvTGluZSArPVxuXHRcdFx0XHRsYW5nLmdldChcImNjX2xhYmVsXCIpICtcblx0XHRcdFx0XCI6IFwiICtcblx0XHRcdFx0dGhpcy5nZXRDY1JlY2lwaWVudHMoKVxuXHRcdFx0XHRcdC5tYXAoKHJlY2lwaWVudCkgPT4gcmVjaXBpZW50LmFkZHJlc3MpXG5cdFx0XHRcdFx0LmpvaW4oXCIsIFwiKVxuXHRcdFx0aW5mb0xpbmUgKz0gXCI8YnI+XCJcblx0XHR9XG5cblx0XHRjb25zdCBtYWlsU3ViamVjdCA9IHRoaXMuZ2V0U3ViamVjdCgpIHx8IFwiXCJcblx0XHRpbmZvTGluZSArPSBsYW5nLmdldChcInN1YmplY3RfbGFiZWxcIikgKyBcIjogXCIgKyB1cmxFbmNvZGVIdG1sVGFncyhtYWlsU3ViamVjdClcblx0XHRsZXQgYm9keSA9IGluZm9MaW5lICsgJzxicj48YnI+PGJsb2NrcXVvdGUgY2xhc3M9XCJ0dXRhbm90YV9xdW90ZVwiPicgKyB0aGlzLmdldE1haWxCb2R5KCkgKyBcIjwvYmxvY2txdW90ZT5cIlxuXHRcdGNvbnN0IHsgcHJlcGVuZEVtYWlsU2lnbmF0dXJlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9zaWduYXR1cmUvU2lnbmF0dXJlXCIpXG5cdFx0Y29uc3Qgc2VuZGVyTWFpbEFkZHJlc3MgPSBhd2FpdCB0aGlzLmdldFNlbmRlck9mUmVzcG9uc2VNYWlsKClcblx0XHRyZXR1cm4ge1xuXHRcdFx0cHJldmlvdXNNYWlsOiB0aGlzLm1haWwsXG5cdFx0XHRjb252ZXJzYXRpb25UeXBlOiBDb252ZXJzYXRpb25UeXBlLkZPUldBUkQsXG5cdFx0XHRzZW5kZXJNYWlsQWRkcmVzcyxcblx0XHRcdHJlY2lwaWVudHMsXG5cdFx0XHRhdHRhY2htZW50czogdGhpcy5hdHRhY2htZW50cy5zbGljZSgpLFxuXHRcdFx0c3ViamVjdDogXCJGV0Q6IFwiICsgbWFpbFN1YmplY3QsXG5cdFx0XHRib2R5VGV4dDogYWRkU2lnbmF0dXJlID8gcHJlcGVuZEVtYWlsU2lnbmF0dXJlKGJvZHksIHRoaXMubG9naW5zKSA6IGJvZHksXG5cdFx0XHRyZXBseVRvcyxcblx0XHR9XG5cdH1cblxuXHRhc3luYyByZXBseShyZXBseUFsbDogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICh0aGlzLmlzQW5ub3VuY2VtZW50KCkpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IHNlbmRBbGxvd2VkID0gYXdhaXQgY2hlY2tBcHByb3ZhbFN0YXR1cyh0aGlzLmxvZ2lucywgZmFsc2UpXG5cblx0XHRpZiAoc2VuZEFsbG93ZWQpIHtcblx0XHRcdGNvbnN0IG1haWxib3hEZXRhaWxzID0gYXdhaXQgdGhpcy5tYWlsTW9kZWwuZ2V0TWFpbGJveERldGFpbHNGb3JNYWlsKHRoaXMubWFpbClcblx0XHRcdGlmIChtYWlsYm94RGV0YWlscyA9PSBudWxsKSB7XG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXG5cdFx0XHQvLyBXZSBhbHJlYWR5IGtub3cgaXQgaXMgbm90IGFuIGFubm91bmNlbWVudCBlbWFpbCBhbmQgd2Ugd2FudCB0byBnZXQgdGhlIHNlbmRlciBldmVuIGlmIGl0XG5cdFx0XHQvLyBpcyBoaWRkZW4uIEl0IHdpbGwgYmUgcmVwbGFjZWQgd2l0aCByZXBseVRvKCkgYW55d2F5XG5cdFx0XHRjb25zdCBtYWlsQWRkcmVzc0FuZE5hbWUgPSBnZXREaXNwbGF5ZWRTZW5kZXIodGhpcy5tYWlsKVxuXHRcdFx0Y29uc3Qgc2VuZGVyID0gY3JlYXRlTWFpbEFkZHJlc3Moe1xuXHRcdFx0XHRuYW1lOiBtYWlsQWRkcmVzc0FuZE5hbWUubmFtZSxcblx0XHRcdFx0YWRkcmVzczogbWFpbEFkZHJlc3NBbmROYW1lLmFkZHJlc3MsXG5cdFx0XHRcdGNvbnRhY3Q6IG51bGwsXG5cdFx0XHR9KVxuXHRcdFx0bGV0IHByZWZpeCA9IFwiUmU6IFwiXG5cdFx0XHRjb25zdCBtYWlsU3ViamVjdCA9IHRoaXMuZ2V0U3ViamVjdCgpXG5cdFx0XHRsZXQgc3ViamVjdCA9IG1haWxTdWJqZWN0ID8gKHN0YXJ0c1dpdGgobWFpbFN1YmplY3QudG9VcHBlckNhc2UoKSwgcHJlZml4LnRvVXBwZXJDYXNlKCkpID8gbWFpbFN1YmplY3QgOiBwcmVmaXggKyBtYWlsU3ViamVjdCkgOiBcIlwiXG5cdFx0XHRsZXQgaW5mb0xpbmUgPSBmb3JtYXREYXRlVGltZSh0aGlzLmdldERhdGUoKSkgKyBcIiBcIiArIGxhbmcuZ2V0KFwiYnlfbGFiZWxcIikgKyBcIiBcIiArIHNlbmRlci5hZGRyZXNzICsgXCI6XCJcblx0XHRcdGxldCBib2R5ID0gaW5mb0xpbmUgKyAnPGJyPjxibG9ja3F1b3RlIGNsYXNzPVwidHV0YW5vdGFfcXVvdGVcIj4nICsgdGhpcy5nZXRNYWlsQm9keSgpICsgXCI8L2Jsb2NrcXVvdGU+XCJcblx0XHRcdGxldCB0b1JlY2lwaWVudHM6IE1haWxBZGRyZXNzW10gPSBbXVxuXHRcdFx0bGV0IGNjUmVjaXBpZW50czogTWFpbEFkZHJlc3NbXSA9IFtdXG5cdFx0XHRsZXQgYmNjUmVjaXBpZW50czogTWFpbEFkZHJlc3NbXSA9IFtdXG5cblx0XHRcdGlmICghdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0ludGVybmFsVXNlcigpICYmIHRoaXMuaXNSZWNlaXZlZE1haWwoKSkge1xuXHRcdFx0XHR0b1JlY2lwaWVudHMucHVzaChzZW5kZXIpXG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMuaXNSZWNlaXZlZE1haWwoKSkge1xuXHRcdFx0XHRpZiAodGhpcy5nZXRSZXBseVRvcygpLnNvbWUoKGFkZHJlc3MpID0+ICFkb3duY2FzdChhZGRyZXNzKS5fZXJyb3JzKSkge1xuXHRcdFx0XHRcdGFkZEFsbCh0b1JlY2lwaWVudHMsIHRoaXMuZ2V0UmVwbHlUb3MoKSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0b1JlY2lwaWVudHMucHVzaChzZW5kZXIpXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocmVwbHlBbGwpIHtcblx0XHRcdFx0XHRsZXQgbXlNYWlsQWRkcmVzc2VzID0gZ2V0RW5hYmxlZE1haWxBZGRyZXNzZXNXaXRoVXNlcihtYWlsYm94RGV0YWlscywgdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyR3JvdXBJbmZvKVxuXHRcdFx0XHRcdGFkZEFsbChcblx0XHRcdFx0XHRcdGNjUmVjaXBpZW50cyxcblx0XHRcdFx0XHRcdHRoaXMuZ2V0VG9SZWNpcGllbnRzKCkuZmlsdGVyKChyZWNpcGllbnQpID0+ICFjb250YWlucyhteU1haWxBZGRyZXNzZXMsIHJlY2lwaWVudC5hZGRyZXNzLnRvTG93ZXJDYXNlKCkpKSxcblx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0YWRkQWxsKFxuXHRcdFx0XHRcdFx0Y2NSZWNpcGllbnRzLFxuXHRcdFx0XHRcdFx0dGhpcy5nZXRDY1JlY2lwaWVudHMoKS5maWx0ZXIoKHJlY2lwaWVudCkgPT4gIWNvbnRhaW5zKG15TWFpbEFkZHJlc3NlcywgcmVjaXBpZW50LmFkZHJlc3MudG9Mb3dlckNhc2UoKSkpLFxuXHRcdFx0XHRcdClcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gdGhpcyBpcyBhIHNlbnQgZW1haWwsIHNvIHVzZSB0aGUgdG8gcmVjaXBpZW50cyBhcyBuZXcgcmVjaXBpZW50c1xuXHRcdFx0XHRhZGRBbGwodG9SZWNpcGllbnRzLCB0aGlzLmdldFRvUmVjaXBpZW50cygpKVxuXG5cdFx0XHRcdGlmIChyZXBseUFsbCkge1xuXHRcdFx0XHRcdGFkZEFsbChjY1JlY2lwaWVudHMsIHRoaXMuZ2V0Q2NSZWNpcGllbnRzKCkpXG5cdFx0XHRcdFx0YWRkQWxsKGJjY1JlY2lwaWVudHMsIHRoaXMuZ2V0QmNjUmVjaXBpZW50cygpKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHsgcHJlcGVuZEVtYWlsU2lnbmF0dXJlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9zaWduYXR1cmUvU2lnbmF0dXJlLmpzXCIpXG5cdFx0XHRjb25zdCB7IG5ld01haWxFZGl0b3JBc1Jlc3BvbnNlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9lZGl0b3IvTWFpbEVkaXRvclwiKVxuXG5cdFx0XHRjb25zdCBpc1JlbG9hZE5lZWRlZCA9ICF0aGlzLnNhbml0aXplUmVzdWx0IHx8IHRoaXMubWFpbC5hdHRhY2htZW50cy5sZW5ndGggIT09IHRoaXMuYXR0YWNobWVudHMubGVuZ3RoXG5cdFx0XHRpZiAoaXNSZWxvYWROZWVkZWQpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5sb2FkQWxsKFByb21pc2UucmVzb2x2ZSgpLCB7IG5vdGlmeTogdHJ1ZSB9KVxuXHRcdFx0fVxuXHRcdFx0Ly8gSXQgc2hvdWxkIGJlIHRoZXJlIGFmdGVyIGxvYWRBbGwoKSBidXQgaWYgbm90IHdlIGp1c3QgZ2l2ZSB1cFxuXHRcdFx0Y29uc3QgaW5saW5lSW1hZ2VDaWRzID0gdGhpcy5zYW5pdGl6ZVJlc3VsdD8uaW5saW5lSW1hZ2VDaWRzID8/IFtdXG5cblx0XHRcdGNvbnN0IFtzZW5kZXJNYWlsQWRkcmVzcywgcmVmZXJlbmNlZENpZHNdID0gYXdhaXQgUHJvbWlzZS5hbGwoW3RoaXMuZ2V0U2VuZGVyT2ZSZXNwb25zZU1haWwoKSwgaW5saW5lSW1hZ2VDaWRzXSlcblxuXHRcdFx0Y29uc3QgYXR0YWNobWVudHNGb3JSZXBseSA9IGdldFJlZmVyZW5jZWRBdHRhY2htZW50cyh0aGlzLmF0dGFjaG1lbnRzLCByZWZlcmVuY2VkQ2lkcylcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGVkaXRvciA9IGF3YWl0IG5ld01haWxFZGl0b3JBc1Jlc3BvbnNlKFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHByZXZpb3VzTWFpbDogdGhpcy5tYWlsLFxuXHRcdFx0XHRcdFx0Y29udmVyc2F0aW9uVHlwZTogQ29udmVyc2F0aW9uVHlwZS5SRVBMWSxcblx0XHRcdFx0XHRcdHNlbmRlck1haWxBZGRyZXNzLFxuXHRcdFx0XHRcdFx0cmVjaXBpZW50czoge1xuXHRcdFx0XHRcdFx0XHR0bzogdG9SZWNpcGllbnRzLFxuXHRcdFx0XHRcdFx0XHRjYzogY2NSZWNpcGllbnRzLFxuXHRcdFx0XHRcdFx0XHRiY2M6IGJjY1JlY2lwaWVudHMsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0YXR0YWNobWVudHM6IGF0dGFjaG1lbnRzRm9yUmVwbHksXG5cdFx0XHRcdFx0XHRzdWJqZWN0LFxuXHRcdFx0XHRcdFx0Ym9keVRleHQ6IHByZXBlbmRFbWFpbFNpZ25hdHVyZShib2R5LCB0aGlzLmxvZ2lucyksXG5cdFx0XHRcdFx0XHRyZXBseVRvczogW10sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR0aGlzLmlzQmxvY2tpbmdFeHRlcm5hbEltYWdlcygpIHx8ICF0aGlzLmlzU2hvd2luZ0V4dGVybmFsQ29udGVudCgpLFxuXHRcdFx0XHRcdHRoaXMuZ2V0TG9hZGVkSW5saW5lSW1hZ2VzKCksXG5cdFx0XHRcdFx0bWFpbGJveERldGFpbHMsXG5cdFx0XHRcdClcblx0XHRcdFx0ZWRpdG9yLnNob3coKVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFVzZXJFcnJvcikge1xuXHRcdFx0XHRcdHNob3dVc2VyRXJyb3IoZSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdyBlXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNhbml0aXplTWFpbEJvZHkobWFpbDogTWFpbCwgYmxvY2tFeHRlcm5hbENvbnRlbnQ6IGJvb2xlYW4pOiBQcm9taXNlPFNhbml0aXplZEZyYWdtZW50PiB7XG5cdFx0Y29uc3QgeyBodG1sU2FuaXRpemVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vbWlzYy9IdG1sU2FuaXRpemVyXCIpXG5cdFx0Y29uc3QgcmF3Qm9keSA9IHRoaXMuZ2V0TWFpbEJvZHkoKVxuXHRcdC8vIEtlZXBpbmcgdGhpcyBjb21tZW50ZWQgb3V0IGJlY2F1c2Ugd2Ugd2FudCBzZWUgdGhlIHJlc3BvbnNlXG5cdFx0Ly8gY29uc3QgdXJsaWZpZWQgPSBhd2FpdCB0aGlzLndvcmtlckZhY2FkZS51cmxpZnkocmF3Qm9keSkuY2F0Y2goKGUpID0+IHtcblx0XHQvLyBcdGNvbnNvbGUud2FybihcIkZhaWxlZCB0byB1cmxpZnkgbWFpbCBib2R5IVwiLCBlKVxuXHRcdC8vIFx0cmV0dXJuIHJhd0JvZHlcblx0XHQvLyB9KVxuXHRcdGNvbnN0IHNhbml0aXplUmVzdWx0ID0gaHRtbFNhbml0aXplci5zYW5pdGl6ZUZyYWdtZW50KHJhd0JvZHksIHtcblx0XHRcdGJsb2NrRXh0ZXJuYWxDb250ZW50LFxuXHRcdFx0YWxsb3dSZWxhdGl2ZUxpbmtzOiBpc1R1dGFub3RhVGVhbU1haWwobWFpbCksXG5cdFx0fSlcblx0XHRjb25zdCB7IGZyYWdtZW50LCBpbmxpbmVJbWFnZUNpZHMsIGxpbmtzLCBibG9ja2VkRXh0ZXJuYWxDb250ZW50IH0gPSBzYW5pdGl6ZVJlc3VsdFxuXG5cdFx0LyoqXG5cdFx0ICogQ2hlY2sgaWYgd2UgbmVlZCB0byBpbXByb3ZlIGNvbnRyYXN0IGZvciBkYXJrIHRoZW1lLiBXZSBhcHBseSB0aGUgY29udHJhc3QgZml4IGlmIGFueSBvZiB0aGUgZm9sbG93aW5nIGlzIGNvbnRhaW5lZCBpblxuXHRcdCAqIHRoZSBodG1sIGJvZHkgb2YgdGhlIG1haWxcblx0XHQgKiAgKiBhbnkgdGFnIHdpdGggYSBzdHlsZSBhdHRyaWJ1dGUgdGhhdCBoYXMgdGhlIGNvbG9yIHByb3BlcnR5IHNldCAoYmVzaWRlcyBcImluaGVyaXRcIilcblx0XHQgKiAgKiBhbnkgdGFnIHdpdGggYSBzdHlsZSBhdHRyaWJ1dGUgdGhhdCBoYXMgdGhlIGJhY2tncm91bmQtY29sb3Igc2V0IChiZXNpZGVzIFwiaW5oZXJpdFwiKVxuXHRcdCAqICAqIGFueSBmb250IHRhZyB3aXRoIHRoZSBjb2xvciBhdHRyaWJ1dGUgc2V0XG5cdFx0ICovXG5cdFx0dGhpcy5jb250cmFzdEZpeE5lZWRlZCA9IGlzTWFpbENvbnRyYXN0Rml4TmVlZGVkKGZyYWdtZW50KVxuXG5cdFx0bS5yZWRyYXcoKVxuXHRcdHJldHVybiB7XG5cdFx0XHQvLyBXZSB3YW50IHRvIHN0cmluZ2lmeSBhbmQgcmV0dXJuIHRoZSBmcmFnbWVudCBoZXJlLCBiZWNhdXNlIG9uY2UgYSBmcmFnbWVudCBpcyBhcHBlbmRlZCB0byBhIERPTSBOb2RlLCBpdCdzIGNoaWxkcmVuIGFyZSBtb3ZlZFxuXHRcdFx0Ly8gYW5kIHRoZSBmcmFnbWVudCBpcyBsZWZ0IGVtcHR5LiBJZiB3ZSBjYWNoZSB0aGUgZnJhZ21lbnQgYW5kIHRoZW4gYXBwZW5kIHRoYXQgZGlyZWN0bHkgdG8gdGhlIERPTSB0cmVlIHdoZW4gcmVuZGVyaW5nLCB0aGVyZSBhcmUgY2FzZXMgd2hlcmVcblx0XHRcdC8vIHdlIHdvdWxkIHRyeSB0byBkbyBzbyB0d2ljZSwgYW5kIG9uIHRoZSBzZWNvbmQgcGFzcyB0aGUgbWFpbCBib2R5IHdpbGwgYmUgbGVmdCBibGFua1xuXHRcdFx0ZnJhZ21lbnQsXG5cdFx0XHRpbmxpbmVJbWFnZUNpZHMsXG5cdFx0XHRsaW5rcyxcblx0XHRcdGJsb2NrZWRFeHRlcm5hbENvbnRlbnQsXG5cdFx0fVxuXHR9XG5cblx0Z2V0Tm9uSW5saW5lQXR0YWNobWVudHMoKTogVHV0YW5vdGFGaWxlW10ge1xuXHRcdC8vIElmIHdlIGhhdmUgYXR0YWNobWVudHMgaXQgaXMgc2FmZSB0byBhc3N1bWUgdGhhdCB3ZSBhbHJlYWR5IGhhdmUgYm9keSBhbmQgcmVmZXJlbmNlZCBjaWRzIGZyb20gaXRcblx0XHRjb25zdCBpbmxpbmVGaWxlSWRzID0gdGhpcy5zYW5pdGl6ZVJlc3VsdD8uaW5saW5lSW1hZ2VDaWRzID8/IFtdXG5cdFx0cmV0dXJuIHRoaXMuYXR0YWNobWVudHMuZmlsdGVyKChhKSA9PiBhLmNpZCA9PSBudWxsIHx8ICFpbmxpbmVGaWxlSWRzLmluY2x1ZGVzKGEuY2lkKSlcblx0fVxuXG5cdGFzeW5jIGRvd25sb2FkQWxsKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG5vbklubGluZUF0dGFjaG1lbnRzID0gYXdhaXQgdGhpcy5jcnlwdG9GYWNhZGUuZW5mb3JjZVNlc3Npb25LZXlVcGRhdGVJZk5lZWRlZCh0aGlzLl9tYWlsLCB0aGlzLmdldE5vbklubGluZUF0dGFjaG1lbnRzKCkpXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuZmlsZUNvbnRyb2xsZXIuZG93bmxvYWRBbGwobm9uSW5saW5lQXR0YWNobWVudHMpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBGaWxlT3BlbkVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihcIkZpbGVPcGVuRXJyb3JcIiwgZSlcblx0XHRcdFx0YXdhaXQgRGlhbG9nLm1lc3NhZ2UoXCJjYW5Ob3RPcGVuRmlsZU9uRGV2aWNlX21zZ1wiKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihcImNvdWxkIG5vdCBvcGVuIGZpbGU6XCIsIGUubWVzc2FnZSA/PyBcInVua25vd24gZXJyb3JcIilcblx0XHRcdFx0YXdhaXQgRGlhbG9nLm1lc3NhZ2UoXCJlcnJvckR1cmluZ0ZpbGVPcGVuX21zZ1wiKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGRvd25sb2FkQW5kT3BlbkF0dGFjaG1lbnQoZmlsZTogVHV0YW5vdGFGaWxlLCBvcGVuOiBib29sZWFuKSB7XG5cdFx0ZmlsZSA9IChhd2FpdCB0aGlzLmNyeXB0b0ZhY2FkZS5lbmZvcmNlU2Vzc2lvbktleVVwZGF0ZUlmTmVlZGVkKHRoaXMuX21haWwsIFtmaWxlXSkpWzBdXG5cdFx0dHJ5IHtcblx0XHRcdGlmIChvcGVuKSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMuZmlsZUNvbnRyb2xsZXIub3BlbihmaWxlKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5maWxlQ29udHJvbGxlci5kb3dubG9hZChmaWxlKVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgRmlsZU9wZW5FcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oXCJGaWxlT3BlbkVycm9yXCIsIGUpXG5cdFx0XHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFwiY2FuTm90T3BlbkZpbGVPbkRldmljZV9tc2dcIilcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJjb3VsZCBub3Qgb3BlbiBmaWxlOlwiLCBlLm1lc3NhZ2UgPz8gXCJ1bmtub3duIGVycm9yXCIpXG5cdFx0XHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFwiZXJyb3JEdXJpbmdGaWxlT3Blbl9tc2dcIilcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRhc3luYyBpbXBvcnRBdHRhY2htZW50KGZpbGU6IFR1dGFub3RhRmlsZSkge1xuXHRcdGNvbnN0IGF0dGFjaG1lbnRUeXBlID0gZ2V0QXR0YWNobWVudFR5cGUoZmlsZS5taW1lVHlwZSA/PyBcIlwiKVxuXHRcdGlmIChhdHRhY2htZW50VHlwZSA9PT0gQXR0YWNobWVudFR5cGUuQ09OVEFDVCkge1xuXHRcdFx0YXdhaXQgdGhpcy5pbXBvcnRDb250YWN0cyhmaWxlKVxuXHRcdH0gZWxzZSBpZiAoYXR0YWNobWVudFR5cGUgPT09IEF0dGFjaG1lbnRUeXBlLkNBTEVOREFSKSB7XG5cdFx0XHRhd2FpdCB0aGlzLmltcG9ydENhbGVuZGFyKGZpbGUpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBpbXBvcnRDb250YWN0cyhmaWxlOiBUdXRhbm90YUZpbGUpIHtcblx0XHRmaWxlID0gKGF3YWl0IHRoaXMuY3J5cHRvRmFjYWRlLmVuZm9yY2VTZXNzaW9uS2V5VXBkYXRlSWZOZWVkZWQodGhpcy5fbWFpbCwgW2ZpbGVdKSlbMF1cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgZGF0YUZpbGUgPSBhd2FpdCB0aGlzLmZpbGVDb250cm9sbGVyLmdldEFzRGF0YUZpbGUoZmlsZSlcblx0XHRcdGNvbnN0IGNvbnRhY3RMaXN0SWQgPSBhd2FpdCB0aGlzLmNvbnRhY3RNb2RlbC5nZXRDb250YWN0TGlzdElkKClcblx0XHRcdC8vIHRoaXMgc2hvdWxkbid0IGhhcHBlbiBidXQgaWYgaXQgZGlkIHdlIGNhbiBqdXN0IGJhaWxcblx0XHRcdGlmIChjb250YWN0TGlzdElkID09IG51bGwpIHJldHVyblxuXHRcdFx0Y29uc3QgY29udGFjdEltcG9ydGVyID0gYXdhaXQgdGhpcy5jb250YWN0SW1wb3J0ZXIoKVxuXHRcdFx0YXdhaXQgY29udGFjdEltcG9ydGVyLmltcG9ydENvbnRhY3RzRnJvbUZpbGUodXRmOFVpbnQ4QXJyYXlUb1N0cmluZyhkYXRhRmlsZS5kYXRhKSwgY29udGFjdExpc3RJZClcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhlKVxuXHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihcImVycm9yRHVyaW5nRmlsZU9wZW5fbXNnXCIpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBpbXBvcnRDYWxlbmRhcihmaWxlOiBUdXRhbm90YUZpbGUpIHtcblx0XHRmaWxlID0gKGF3YWl0IHRoaXMuY3J5cHRvRmFjYWRlLmVuZm9yY2VTZXNzaW9uS2V5VXBkYXRlSWZOZWVkZWQodGhpcy5fbWFpbCwgW2ZpbGVdKSlbMF1cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgeyBpbXBvcnRDYWxlbmRhckZpbGUsIHBhcnNlQ2FsZW5kYXJGaWxlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvaW1wb3J0L0NhbGVuZGFySW1wb3J0ZXIuanNcIilcblx0XHRcdGNvbnN0IGRhdGFGaWxlID0gYXdhaXQgdGhpcy5maWxlQ29udHJvbGxlci5nZXRBc0RhdGFGaWxlKGZpbGUpXG5cdFx0XHRjb25zdCBkYXRhID0gcGFyc2VDYWxlbmRhckZpbGUoZGF0YUZpbGUpXG5cdFx0XHRhd2FpdCBpbXBvcnRDYWxlbmRhckZpbGUoYXdhaXQgbWFpbExvY2F0b3IuY2FsZW5kYXJNb2RlbCgpLCB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLCBkYXRhLmNvbnRlbnRzKVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUubG9nKGUpXG5cdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwiZXJyb3JEdXJpbmdGaWxlT3Blbl9tc2dcIilcblx0XHR9XG5cdH1cblxuXHRjYW5JbXBvcnRGaWxlKGZpbGU6IFR1dGFub3RhRmlsZSk6IGJvb2xlYW4ge1xuXHRcdGlmICghdGhpcy5sb2dpbnMuaXNJbnRlcm5hbFVzZXJMb2dnZWRJbigpIHx8IGZpbGUubWltZVR5cGUgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXHRcdGNvbnN0IGF0dGFjaG1lbnRUeXBlID0gZ2V0QXR0YWNobWVudFR5cGUoZmlsZS5taW1lVHlwZSlcblx0XHRyZXR1cm4gYXR0YWNobWVudFR5cGUgPT09IEF0dGFjaG1lbnRUeXBlLkNPTlRBQ1QgfHwgYXR0YWNobWVudFR5cGUgPT09IEF0dGFjaG1lbnRUeXBlLkNBTEVOREFSXG5cdH1cblxuXHRjYW5SZXBseUFsbCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0dGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0ludGVybmFsVXNlcigpICYmXG5cdFx0XHR0aGlzLmdldFRvUmVjaXBpZW50cygpLmxlbmd0aCArIHRoaXMuZ2V0Q2NSZWNpcGllbnRzKCkubGVuZ3RoICsgdGhpcy5nZXRCY2NSZWNpcGllbnRzKCkubGVuZ3RoID4gMVxuXHRcdClcblx0fVxuXG5cdGNhbkZvcndhcmRPck1vdmUoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuaXNJbnRlcm5hbFVzZXIoKVxuXHR9XG5cblx0c2hvdWxkRGVsYXlSZW5kZXJpbmcoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMucmVuZGVySXNEZWxheWVkXG5cdH1cblxuXHRpc0NvbGxhcHNlZCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5jb2xsYXBzZWRcblx0fVxuXG5cdGV4cGFuZE1haWwoZGVsYXlCb2R5UmVuZGVyaW5nOiBQcm9taXNlPHVua25vd24+KTogdm9pZCB7XG5cdFx0dGhpcy5sb2FkQWxsKGRlbGF5Qm9keVJlbmRlcmluZywgeyBub3RpZnk6IHRydWUgfSlcblx0XHRpZiAodGhpcy5pc1VucmVhZCgpKSB7XG5cdFx0XHQvLyBXaGVuIHdlIGF1dG9tYXRpY2FsbHkgbWFyayBlbWFpbCBhcyByZWFkIChlLmcuIG9wZW5pbmcgaXQgZnJvbSBub3RpZmljYXRpb24pIHdlIGRvbid0IHdhbnQgdG8gcnVuIGludG8gb2ZmbGluZSBlcnJvcnMsIGJ1dCB3ZSBzdGlsbCB3YW50IHRvIG1hcmtcblx0XHRcdC8vIHRoZSBlbWFpbCBhcyByZWFkIG9uY2Ugd2UgbG9nIGluLmxcblx0XHRcdC8vIEl0IGlzIGFwcHJvcHJpYXRlIHRvIHNob3cgdGhlIGVycm9yIHdoZW4gdGhlIHVzZXIgbWFya3MgdGhlIGVtYWlsIGFzIHVucmVhZCBleHBsaWNpdGx5IGJ1dCBsZXNzIHNvIHdoZW4gdGhleSBvcGVuIGl0IGFuZCBqdXN0IGRpZG4ndCByZWFjaCB0aGVcblx0XHRcdC8vIGZ1bGwgbG9naW4geWV0LlxuXHRcdFx0dGhpcy5sb2dpbnMud2FpdEZvckZ1bGxMb2dpbigpLnRoZW4oKCkgPT4gdGhpcy5zZXRVbnJlYWQoZmFsc2UpKVxuXHRcdH1cblx0XHR0aGlzLmNvbGxhcHNlZCA9IGZhbHNlXG5cdH1cblxuXHRjb2xsYXBzZU1haWwoKTogdm9pZCB7XG5cdFx0dGhpcy5jb2xsYXBzZWQgPSB0cnVlXG5cdH1cblxuXHRnZXRMYWJlbHMoKTogcmVhZG9ubHkgTWFpbEZvbGRlcltdIHtcblx0XHRyZXR1cm4gdGhpcy5tYWlsTW9kZWwuZ2V0TGFiZWxzRm9yTWFpbCh0aGlzLm1haWwpXG5cdH1cblxuXHRwcml2YXRlIGdldE1haWxPd25lckdyb3VwKCk6IElkIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMubWFpbC5fb3duZXJHcm91cFxuXHR9XG5cblx0cHJpdmF0ZSB1cGRhdGVNYWlsKHsgbWFpbCwgc2hvd0ZvbGRlciB9OiB7IG1haWw6IE1haWw7IHNob3dGb2xkZXI/OiBib29sZWFuIH0pIHtcblx0XHRpZiAoIWlzU2FtZUlkKG1haWwuX2lkLCB0aGlzLm1haWwuX2lkKSkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXG5cdFx0XHRcdGBUcnlpbmcgdG8gdXBkYXRlIE1haWxWaWV3ZXJWaWV3TW9kZWwgd2l0aCB1bnJlbGF0ZWQgZW1haWwgJHtKU09OLnN0cmluZ2lmeSh0aGlzLm1haWwuX2lkKX0gJHtKU09OLnN0cmluZ2lmeShtYWlsLl9pZCl9ICR7bS5yb3V0ZS5nZXQoKX1gLFxuXHRcdFx0KVxuXHRcdH1cblx0XHR0aGlzLl9tYWlsID0gbWFpbFxuXG5cdFx0dGhpcy5mb2xkZXJNYWlsYm94VGV4dCA9IG51bGxcblx0XHRpZiAoc2hvd0ZvbGRlcikge1xuXHRcdFx0dGhpcy5zaG93Rm9sZGVyKClcblx0XHR9XG5cblx0XHR0aGlzLnJlbGV2YW50UmVjaXBpZW50ID0gbnVsbFxuXHRcdHRoaXMuZGV0ZXJtaW5lUmVsZXZhbnRSZWNpcGllbnQoKVxuXG5cdFx0dGhpcy5sb2FkQWxsKFByb21pc2UucmVzb2x2ZSgpLCB7IG5vdGlmeTogdHJ1ZSB9KVxuXHR9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFNYSxtQkFBTixNQUFtRTtDQUN6RSxLQUFLQSxP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