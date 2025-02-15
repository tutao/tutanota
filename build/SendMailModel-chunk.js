import { __toESM } from "./chunk-chunk.js";
import "./dist-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import "./mithril-chunk.js";
import { LazyLoaded, assertNotNull, cleanMatch, deduplicate, defer, downcast, findAndRemove, getFromMap, neverNull, noOp, ofClass, pMap, remove, typedValues } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { getAvailableLanguageCode, getSubstitutedLanguageCode, lang, languages } from "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import { ApprovalStatus, ConversationType, MAX_ATTACHMENT_SIZE, MailMethod, OperationType, ReplyType } from "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import { isSameId, stringToCustomId } from "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import { ContactTypeRef, ConversationEntryTypeRef, FileTypeRef, MailTypeRef, MailboxPropertiesTypeRef } from "./TypeRefs-chunk.js";
import { cleanMailAddress, findRecipientWithAddress } from "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import { CustomerPropertiesTypeRef } from "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import { isMailAddress } from "./FormatValidator-chunk.js";
import { require_stream } from "./stream-chunk.js";
import "./Logger-chunk.js";
import "./TypeModels3-chunk.js";
import { FileNotFoundError, RecipientNotResolvedError } from "./ErrorUtils-chunk.js";
import { AccessBlockedError, LockedError, NotAuthorizedError, NotFoundError, PayloadTooLargeError, PreconditionFailedError, TooManyRequestsError } from "./RestError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
import "./SuspensionError-chunk.js";
import "./LoginIncompleteError-chunk.js";
import "./CryptoError-chunk.js";
import { RecipientsNotFoundError } from "./RecipientsNotFoundError-chunk.js";
import "./DbError-chunk.js";
import "./QuotaExceededError-chunk.js";
import "./DeviceStorageUnavailableError-chunk.js";
import { MailBodyTooLargeError } from "./MailBodyTooLargeError-chunk.js";
import "./ImportError-chunk.js";
import "./WebauthnError-chunk.js";
import "./PermissionError-chunk.js";
import { isUpdateForTypeRef } from "./EntityUpdateUtils-chunk.js";
import "./SessionType-chunk.js";
import "./BirthdayUtils-chunk.js";
import "./GroupUtils-chunk.js";
import "./Button-chunk.js";
import "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import "./Formatter-chunk.js";
import "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import "./MailAddressParser-chunk.js";
import "./BlobUtils-chunk.js";
import "./FileUtils-chunk.js";
import "./ProgressDialog-chunk.js";
import { RecipientField, checkAttachmentSize, getDefaultSender, getTemplateLanguages, isUserEmail } from "./SharedMailUtils-chunk.js";
import { PASSWORD_MIN_SECURE_VALUE, getPasswordStrengthForUser, isSecurePassword } from "./PasswordUtils-chunk.js";
import { RecipientType } from "./Recipient-chunk.js";
import { getContactDisplayName } from "./ContactUtils-chunk.js";
import { ResolveMode } from "./RecipientsModel-chunk.js";
import "./SubscriptionDialogs-chunk.js";
import "./ExternalLink-chunk.js";
import "./ToggleButton-chunk.js";
import "./SnackBar-chunk.js";
import "./Credentials-chunk.js";
import "./NotificationOverlay-chunk.js";
import "./Checkbox-chunk.js";
import "./Expander-chunk.js";
import "./ClipboardUtils-chunk.js";
import { createApprovalMail } from "./Services4-chunk.js";
import "./BubbleButton-chunk.js";
import "./ErrorReporter-chunk.js";
import "./PasswordField-chunk.js";
import "./PasswordRequestDialog-chunk.js";
import "./ErrorHandlerImpl-chunk.js";
import "./LoginScreenHeader-chunk.js";
import "./LoginButton-chunk.js";
import { checkApprovalStatus } from "./LoginUtils-chunk.js";
import { getMailBodyText } from "./CommonMailUtils-chunk.js";
import { cloneInlineImages, revokeInlineImages } from "./inlineImagesUtils-chunk.js";
import { getSenderName } from "./MailboxPropertiesUtils-chunk.js";

//#region src/common/mailFunctionality/SendMailModel.ts
var import_stream = __toESM(require_stream(), 1);
assertMainOrNode();
const TOO_MANY_VISIBLE_RECIPIENTS = 10;
var SendMailModel = class {
	initialized = null;
	onMailChanged = (0, import_stream.default)(null);
	onRecipientDeleted = (0, import_stream.default)(null);
	onBeforeSend = noOp;
	loadedInlineImages = new Map();
	draft = null;
	conversationType = ConversationType.NEW;
	subject = "";
	body = "";
	recipients = new Map();
	senderAddress;
	confidential;
	attachments = [];
	replyTos = [];
	previousMessageId = null;
	previousMail = null;
	selectedNotificationLanguage;
	availableNotificationTemplateLanguages = [];
	mailChangedAt = 0;
	mailSavedAt = 1;
	passwords = new Map();
	currentSavePromise = null;
	doSaveAgain = false;
	recipientsResolved = new LazyLoaded(async () => {});
	/**
	* creates a new empty draft message. calling an init method will fill in all the blank data
	*/
	constructor(mailFacade, entity, logins, mailboxModel, contactModel, eventController, mailboxDetails, recipientsModel, dateProvider, mailboxProperties, needNewDraft) {
		this.mailFacade = mailFacade;
		this.entity = entity;
		this.logins = logins;
		this.mailboxModel = mailboxModel;
		this.contactModel = contactModel;
		this.eventController = eventController;
		this.mailboxDetails = mailboxDetails;
		this.recipientsModel = recipientsModel;
		this.dateProvider = dateProvider;
		this.mailboxProperties = mailboxProperties;
		this.needNewDraft = needNewDraft;
		const userProps = logins.getUserController().props;
		this.senderAddress = this.getDefaultSender();
		this.confidential = !userProps.defaultUnconfidential;
		this.selectedNotificationLanguage = getAvailableLanguageCode(userProps.notificationMailLanguage || lang.code);
		this.updateAvailableNotificationTemplateLanguages();
		this.eventController.addEntityListener(this.entityEventReceived);
	}
	entityEventReceived = async (updates) => {
		for (const update of updates) await this.handleEntityEvent(update);
	};
	/**
	* Sort list of all languages alphabetically
	* then we see if the user has custom notification templates
	* in which case we replace the list with just the templates that the user has specified
	*/
	async updateAvailableNotificationTemplateLanguages() {
		this.availableNotificationTemplateLanguages = languages.slice().sort((a, b) => lang.get(a.textId).localeCompare(lang.get(b.textId)));
		const filteredLanguages = await getTemplateLanguages(this.availableNotificationTemplateLanguages, this.entity, this.logins);
		if (filteredLanguages.length > 0) {
			const languageCodes = filteredLanguages.map((l) => l.code);
			this.selectedNotificationLanguage = getSubstitutedLanguageCode(this.logins.getUserController().props.notificationMailLanguage || lang.code, languageCodes) || languageCodes[0];
			this.availableNotificationTemplateLanguages = filteredLanguages;
		}
	}
	user() {
		return this.logins.getUserController();
	}
	isSharedMailbox() {
		return !this.mailboxDetails.mailGroup.user;
	}
	getPreviousMail() {
		return this.previousMail;
	}
	getConversationType() {
		return this.conversationType;
	}
	setPassword(mailAddress, password) {
		this.onMailChanged(null);
		this.passwords.set(mailAddress, password);
	}
	getPassword(mailAddress) {
		return this.passwords.get(mailAddress) || "";
	}
	getSubject() {
		return this.subject;
	}
	setSubject(subject) {
		this.markAsChangedIfNecessary(subject !== this.subject);
		this.subject = subject;
	}
	getBody() {
		return this.body;
	}
	setBody(body) {
		this.markAsChangedIfNecessary(this.body !== body);
		this.body = body;
	}
	/**
	* set the mail address used to send the mail.
	* @param senderAddress the mail address that will show up lowercased in the sender field of the sent mail.
	*/
	setSender(senderAddress) {
		senderAddress = cleanMailAddress(senderAddress);
		this.markAsChangedIfNecessary(this.senderAddress !== senderAddress);
		this.senderAddress = senderAddress;
	}
	getSender() {
		return this.senderAddress;
	}
	/**
	* Returns the strength indicator for the recipients password
	* @returns value between 0 and 100
	*/
	getPasswordStrength(recipient) {
		return getPasswordStrengthForUser(this.getPassword(recipient.address), recipient, this.mailboxDetails, this.logins);
	}
	hasMailChanged() {
		return this.mailChangedAt > this.mailSavedAt;
	}
	/**
	* update the changed state of the mail.
	* will only be reset when saving.
	*/
	markAsChangedIfNecessary(hasChanged) {
		if (!hasChanged) return;
		this.mailChangedAt = this.dateProvider.now();
		this.onMailChanged(null);
	}
	/**
	*
	* @param recipients
	* @param subject
	* @param bodyText
	* @param attachments
	* @param confidential
	* @param senderMailAddress
	* @param initialChangedState
	* @returns {Promise<SendMailModel>}
	*/
	initWithTemplate(recipients, subject, bodyText, attachments, confidential, senderMailAddress, initialChangedState) {
		this.startInit();
		return this.init({
			conversationType: ConversationType.NEW,
			subject,
			bodyText,
			recipients,
			attachments,
			confidential: confidential ?? null,
			senderMailAddress,
			initialChangedState: initialChangedState ?? null
		});
	}
	async initAsResponse(args, inlineImages) {
		this.startInit();
		const { previousMail, conversationType, senderMailAddress, recipients, attachments, subject, bodyText, replyTos } = args;
		let previousMessageId = null;
		await this.entity.load(ConversationEntryTypeRef, previousMail.conversationEntry).then((ce) => {
			previousMessageId = ce.messageId;
		}).catch(ofClass(NotFoundError, (e) => {
			console.log("could not load conversation entry", e);
		}));
		this.loadedInlineImages = cloneInlineImages(inlineImages);
		return this.init({
			conversationType,
			subject,
			bodyText,
			recipients,
			senderMailAddress,
			confidential: previousMail.confidential,
			attachments,
			replyTos,
			previousMail,
			previousMessageId,
			initialChangedState: false
		});
	}
	async initWithDraft(draft, draftDetails, attachments, inlineImages) {
		this.startInit();
		let previousMessageId = null;
		let previousMail = null;
		const conversationEntry = await this.entity.load(ConversationEntryTypeRef, draft.conversationEntry);
		const conversationType = downcast(conversationEntry.conversationType);
		if (conversationEntry.previous) try {
			const previousEntry = await this.entity.load(ConversationEntryTypeRef, conversationEntry.previous);
			previousMessageId = previousEntry.messageId;
			if (previousEntry.mail) previousMail = await this.entity.load(MailTypeRef, previousEntry.mail);
		} catch (e) {
			if (e instanceof NotFoundError) {} else throw e;
		}
		this.loadedInlineImages = cloneInlineImages(inlineImages);
		const { confidential, sender, subject } = draft;
		const { toRecipients, ccRecipients, bccRecipients } = draftDetails.recipients;
		const recipients = {
			to: toRecipients,
			cc: ccRecipients,
			bcc: bccRecipients
		};
		const bodyText = getMailBodyText(draftDetails.body);
		return this.init({
			conversationType,
			subject,
			bodyText,
			recipients,
			draft,
			senderMailAddress: sender.address,
			confidential,
			attachments,
			replyTos: draftDetails.replyTos,
			previousMail,
			previousMessageId,
			initialChangedState: false
		});
	}
	startInit() {
		if (this.initialized) throw new ProgrammingError("trying to initialize SendMailModel twice");
		this.initialized = defer();
	}
	async init({ conversationType, subject, bodyText, draft, recipients, senderMailAddress, confidential, attachments, replyTos, previousMail, previousMessageId, initialChangedState }) {
		this.conversationType = conversationType;
		this.subject = subject;
		this.body = bodyText;
		this.draft = draft || null;
		let to;
		let cc;
		let bcc;
		if (recipients instanceof Array) {
			to = recipients;
			cc = [];
			bcc = [];
		} else {
			to = recipients.to ?? [];
			cc = recipients.cc ?? [];
			bcc = recipients.bcc ?? [];
		}
		this.recipientsResolved = new LazyLoaded(async () => {
			await Promise.all([
				recipientsFilter(to).map((r) => this.insertRecipient(RecipientField.TO, r)),
				recipientsFilter(cc).map((r) => this.insertRecipient(RecipientField.CC, r)),
				recipientsFilter(bcc).map((r) => this.insertRecipient(RecipientField.BCC, r))
			]);
		});
		this.recipientsResolved.getAsync();
		this.senderAddress = senderMailAddress?.toLowerCase() || this.getDefaultSender();
		this.confidential = confidential ?? !this.user().props.defaultUnconfidential;
		this.attachments = [];
		if (attachments) this.attachFiles(attachments);
		this.replyTos = recipientsFilter(replyTos ?? []).map((recipient) => this.recipientsModel.resolve(recipient, ResolveMode.Eager));
		this.previousMail = previousMail || null;
		this.previousMessageId = previousMessageId || null;
		this.mailChangedAt = this.dateProvider.now();
		if (initialChangedState) {
			this.onMailChanged(null);
			this.mailSavedAt = this.mailChangedAt - 1;
		} else this.mailSavedAt = this.mailChangedAt + 1;
		assertNotNull(this.initialized, "somehow got to the end of init without startInit called").resolve();
		return this;
	}
	getDefaultSender() {
		return getDefaultSender(this.logins, this.mailboxDetails);
	}
	getRecipientList(type) {
		return getFromMap(this.recipients, type, () => []);
	}
	toRecipients() {
		return this.getRecipientList(RecipientField.TO);
	}
	toRecipientsResolved() {
		return Promise.all(this.toRecipients().map((recipient) => recipient.resolved()));
	}
	ccRecipients() {
		return this.getRecipientList(RecipientField.CC);
	}
	ccRecipientsResolved() {
		return Promise.all(this.ccRecipients().map((recipient) => recipient.resolved()));
	}
	bccRecipients() {
		return this.getRecipientList(RecipientField.BCC);
	}
	bccRecipientsResolved() {
		return Promise.all(this.bccRecipients().map((recipient) => recipient.resolved()));
	}
	replyTosResolved() {
		return Promise.all(this.replyTos.map((r) => r.resolved()));
	}
	/**
	* add a recipient to the recipient list without updating the saved state of the draft.
	* if the recipient is already inserted, it will wait for it to resolve before returning.
	*
	* @returns whether the list was actually changed.
	*/
	async insertRecipient(fieldType, { address, name, type, contact }, resolveMode = ResolveMode.Eager) {
		let recipient = findRecipientWithAddress(this.getRecipientList(fieldType), address);
		if (!recipient) {
			recipient = this.recipientsModel.resolve({
				address,
				name,
				type,
				contact
			}, resolveMode);
			this.getRecipientList(fieldType).push(recipient);
			recipient.resolved().then(({ address: address$1, contact: contact$1 }) => {
				if (!this.passwords.has(address$1) && contact$1 != null) this.setPassword(address$1, contact$1.presharedPassword ?? "");
else this.onMailChanged(null);
			});
			await recipient.resolved();
			return true;
		}
		await recipient.resolved();
		return false;
	}
	/**
	* Add a new recipient, this method resolves when the recipient resolves.
	* will notify of a changed draft state after the recipient was inserted
	*/
	async addRecipient(fieldType, partialRecipient, resolveMode = ResolveMode.Eager) {
		const wasAdded = await this.insertRecipient(fieldType, partialRecipient, resolveMode);
		this.markAsChangedIfNecessary(wasAdded);
	}
	getRecipient(type, address) {
		return findRecipientWithAddress(this.getRecipientList(type), address);
	}
	removeRecipientByAddress(address, type, notify = true) {
		const recipient = findRecipientWithAddress(this.getRecipientList(type), address);
		if (recipient) this.removeRecipient(recipient, type, notify);
	}
	/**
	* remove recipient from the recipient list
	* @return true if the recipient was removed
	*/
	removeRecipient(recipient, type, notify = true) {
		const recipients = this.recipients.get(type) ?? [];
		const cleanRecipientAddress = cleanMailAddress(recipient.address);
		const didRemove = findAndRemove(recipients, (r) => cleanMailAddress(r.address) === cleanRecipientAddress);
		this.markAsChangedIfNecessary(didRemove);
		if (didRemove && notify) this.onRecipientDeleted({
			field: type,
			recipient
		});
		return didRemove;
	}
	dispose() {
		this.eventController.removeEntityListener(this.entityEventReceived);
		revokeInlineImages(this.loadedInlineImages);
	}
	/**
	* @throws UserError in the case that any files were too big to attach. Small enough files will still have been attached
	*/
	getAttachments() {
		return this.attachments;
	}
	/** @throws UserError in case files are too big to add */
	attachFiles(files) {
		let sizeLeft = MAX_ATTACHMENT_SIZE - this.attachments.reduce((total, file) => total + Number(file.size), 0);
		const sizeCheckResult = checkAttachmentSize(files, sizeLeft);
		this.attachments.push(...sizeCheckResult.attachableFiles);
		this.markAsChangedIfNecessary(sizeCheckResult.attachableFiles.length > 0);
		if (sizeCheckResult.tooBigFiles.length > 0) throw new UserError(lang.makeTranslation("tooBigAttachment_msg", lang.get("tooBigAttachment_msg") + "\n" + sizeCheckResult.tooBigFiles.join("\n")));
	}
	removeAttachment(file) {
		this.markAsChangedIfNecessary(remove(this.attachments, file));
	}
	getSenderName() {
		return getSenderName(this.mailboxProperties, this.senderAddress) ?? "";
	}
	getDraft() {
		return this.draft;
	}
	async updateDraft(body, attachments, draft) {
		return this.mailFacade.updateDraft({
			subject: this.getSubject(),
			body,
			senderMailAddress: this.senderAddress,
			senderName: this.getSenderName(),
			toRecipients: await this.toRecipientsResolved(),
			ccRecipients: await this.ccRecipientsResolved(),
			bccRecipients: await this.bccRecipientsResolved(),
			attachments,
			confidential: this.isConfidential(),
			draft
		}).catch(ofClass(LockedError, (e) => {
			console.log("updateDraft: operation is still active", e);
			throw new UserError("operationStillActive_msg");
		})).catch(ofClass(NotFoundError, (e) => {
			console.log("draft has been deleted, creating new one");
			return this.createDraft(body, attachments, downcast(draft.method));
		}));
	}
	async createDraft(body, attachments, mailMethod) {
		return this.mailFacade.createDraft({
			subject: this.getSubject(),
			bodyText: body,
			senderMailAddress: this.senderAddress,
			senderName: this.getSenderName(),
			toRecipients: await this.toRecipientsResolved(),
			ccRecipients: await this.ccRecipientsResolved(),
			bccRecipients: await this.bccRecipientsResolved(),
			conversationType: this.conversationType,
			previousMessageId: this.previousMessageId,
			attachments,
			confidential: this.isConfidential(),
			replyTos: await this.replyTosResolved(),
			method: mailMethod
		});
	}
	isConfidential() {
		return this.confidential || !this.containsExternalRecipients();
	}
	isConfidentialExternal() {
		return this.confidential && this.containsExternalRecipients();
	}
	setConfidential(confidential) {
		this.markAsChangedIfNecessary(this.confidential !== confidential);
		this.confidential = confidential;
	}
	containsExternalRecipients() {
		return this.allRecipients().some((r) => r.type === RecipientType.EXTERNAL);
	}
	getExternalRecipients() {
		return this.allRecipients().filter((r) => r.type === RecipientType.EXTERNAL);
	}
	/**
	* @reject {RecipientsNotFoundError}
	* @reject {TooManyRequestsError}
	* @reject {AccessBlockedError}
	* @reject {FileNotFoundError}
	* @reject {PreconditionFailedError}
	* @reject {LockedError}
	* @reject {UserError}
	* @param mailMethod
	* @param getConfirmation: A callback to get user confirmation
	* @param waitHandler: A callback to allow UI blocking while the mail is being sent. it seems like wrapping the send call in showProgressDialog causes the confirmation dialogs not to be shown. We should fix this, but this works for now
	* @param tooManyRequestsError
	* @return true if the send was completed, false if it was aborted (by getConfirmation returning false
	*/
	async send(mailMethod, getConfirmation = (_) => Promise.resolve(true), waitHandler = (_, p) => p, tooManyRequestsError = "tooManyMails_msg") {
		this.onBeforeSend();
		if (this.allRecipients().length === 1 && this.allRecipients()[0].address.toLowerCase().trim() === "approval@tutao.de") {
			await this.sendApprovalMail(this.getBody());
			return true;
		}
		if (this.toRecipients().length === 0 && this.ccRecipients().length === 0 && this.bccRecipients().length === 0) throw new UserError("noRecipients_msg");
		const numVisibleRecipients = this.toRecipients().length + this.ccRecipients().length;
		if (numVisibleRecipients >= TOO_MANY_VISIBLE_RECIPIENTS && !await getConfirmation("manyRecipients_msg")) return false;
		if (this.getSubject().length === 0 && !await getConfirmation("noSubject_msg")) return false;
		const asyncSend = async () => {
			const recipients = await this.waitForResolvedRecipients();
			if (this.isConfidentialExternal() && this.getExternalRecipients().some((r) => !this.getPassword(r.address))) throw new UserError("noPreSharedPassword_msg");
			if (this.isConfidentialExternal() && this.hasInsecurePasswords() && !await getConfirmation("presharedPasswordNotStrongEnough_msg")) return false;
			await this.saveDraft(true, mailMethod);
			await this.updateContacts(recipients);
			await this.mailFacade.sendDraft(assertNotNull(this.draft, "draft was null?"), recipients, this.selectedNotificationLanguage);
			await this.updatePreviousMail();
			await this.updateExternalLanguage();
			return true;
		};
		return waitHandler(this.isConfidential() ? "sending_msg" : "sendingUnencrypted_msg", asyncSend()).catch(ofClass(LockedError, () => {
			throw new UserError("operationStillActive_msg");
		})).catch(ofClass(RecipientNotResolvedError, () => {
			throw new UserError("tooManyAttempts_msg");
		})).catch(ofClass(RecipientsNotFoundError, (e) => {
			if (mailMethod === MailMethod.ICAL_CANCEL) throw e;
else {
				let invalidRecipients = e.message;
				throw new UserError(lang.makeTranslation("error_msg", lang.get("tutanotaAddressDoesNotExist_msg") + " " + lang.get("invalidRecipients_msg") + "\n" + invalidRecipients));
			}
		})).catch(ofClass(TooManyRequestsError, () => {
			throw new UserError(tooManyRequestsError);
		})).catch(ofClass(AccessBlockedError, (e) => {
			return checkApprovalStatus(this.logins, true, ApprovalStatus.SPAM_SENDER).then(() => {
				console.log("could not send mail (blocked access)", e);
				return false;
			});
		})).catch(ofClass(FileNotFoundError, () => {
			throw new UserError("couldNotAttachFile_msg");
		})).catch(ofClass(PreconditionFailedError, () => {
			throw new UserError("operationStillActive_msg");
		}));
	}
	/**
	* Whether any of the external recipients have an insecure password.
	* We don't consider empty passwords, because an empty password will disallow and encrypted email from sending, whereas an insecure password
	* can still be used
	* @returns {boolean}
	*/
	hasInsecurePasswords() {
		const minimalPasswordStrength = this.allRecipients().filter((r) => this.getPassword(r.address) !== "").reduce((min, recipient) => Math.min(min, this.getPasswordStrength(recipient)), PASSWORD_MIN_SECURE_VALUE);
		return !isSecurePassword(minimalPasswordStrength);
	}
	saveDraft(saveAttachments, mailMethod) {
		if (this.currentSavePromise == null) this.currentSavePromise = Promise.resolve().then(async () => {
			try {
				await this.doSaveDraft(saveAttachments, mailMethod);
			} finally {
				this.currentSavePromise = null;
			}
			if (this.hasMailChanged() && this.doSaveAgain) {
				this.doSaveAgain = false;
				await this.saveDraft(saveAttachments, mailMethod);
			}
		});
else this.doSaveAgain = true;
		return this.currentSavePromise;
	}
	/**
	* Saves the draft.
	* @param saveAttachments True if also the attachments shall be saved, false otherwise.
	* @param mailMethod
	* @returns {Promise} When finished.
	* @throws FileNotFoundError when one of the attachments could not be opened
	* @throws PreconditionFailedError when the draft is locked
	*/
	async doSaveDraft(saveAttachments, mailMethod) {
		if (this.initialized == null) throw new ProgrammingError("init for SendMailModel was not called");
		await this.initialized;
		try {
			const attachments = saveAttachments ? this.attachments : null;
			const { htmlSanitizer } = await import("./HtmlSanitizer2-chunk.js");
			const unsanitized_body = this.getBody();
			const body = htmlSanitizer.sanitizeHTML(unsanitized_body, {
				blockExternalContent: false,
				allowRelativeLinks: true,
				usePlaceholderForInlineImages: false
			}).html;
			this.draft = this.draft == null || await this.needNewDraft(this.draft) ? await this.createDraft(body, attachments, mailMethod) : await this.updateDraft(body, attachments, this.draft);
			const attachmentIds = await this.mailFacade.getAttachmentIds(this.draft);
			const newAttachments = await pMap(attachmentIds, (fileId) => this.entity.load(FileTypeRef, fileId), { concurrency: 5 });
			this.attachments = [];
			this.attachFiles(newAttachments);
			this.mailSavedAt = this.dateProvider.now();
		} catch (e) {
			if (e instanceof PayloadTooLargeError) throw new UserError("requestTooLarge_msg");
else if (e instanceof MailBodyTooLargeError) throw new UserError("mailBodyTooLarge_msg");
else if (e instanceof FileNotFoundError) throw new UserError("couldNotAttachFile_msg");
else if (e instanceof PreconditionFailedError) throw new UserError("operationStillActive_msg");
else throw e;
		}
	}
	sendApprovalMail(body) {
		const listId = "---------c--";
		const m = createApprovalMail({
			_id: [listId, stringToCustomId(this.senderAddress)],
			_ownerGroup: this.user().user.userGroup.group,
			text: `Subject: ${this.getSubject()}<br>${body}`,
			date: null,
			range: null,
			customer: null
		});
		return this.entity.setup(listId, m).catch(ofClass(NotAuthorizedError, (e) => console.log("not authorized for approval message")));
	}
	getAvailableNotificationTemplateLanguages() {
		return this.availableNotificationTemplateLanguages;
	}
	getSelectedNotificationLanguageCode() {
		return this.selectedNotificationLanguage;
	}
	setSelectedNotificationLanguageCode(code) {
		this.markAsChangedIfNecessary(this.selectedNotificationLanguage !== code);
		this.selectedNotificationLanguage = code;
		this.markAsChangedIfNecessary(true);
	}
	updateExternalLanguage() {
		let props = this.user().props;
		if (props.notificationMailLanguage !== this.selectedNotificationLanguage) {
			props.notificationMailLanguage = this.selectedNotificationLanguage;
			this.entity.update(props);
		}
	}
	updatePreviousMail() {
		if (this.previousMail) {
			if (this.previousMail.replyType === ReplyType.NONE && this.conversationType === ConversationType.REPLY) this.previousMail.replyType = ReplyType.REPLY;
else if (this.previousMail.replyType === ReplyType.NONE && this.conversationType === ConversationType.FORWARD) this.previousMail.replyType = ReplyType.FORWARD;
else if (this.previousMail.replyType === ReplyType.FORWARD && this.conversationType === ConversationType.REPLY) this.previousMail.replyType = ReplyType.REPLY_FORWARD;
else if (this.previousMail.replyType === ReplyType.REPLY && this.conversationType === ConversationType.FORWARD) this.previousMail.replyType = ReplyType.REPLY_FORWARD;
else return Promise.resolve();
			return this.entity.update(this.previousMail).catch(ofClass(NotFoundError, noOp));
		} else return Promise.resolve();
	}
	/**
	* If contacts have had their passwords changed, we update them before sending
	*/
	async updateContacts(resolvedRecipients) {
		for (const { address, contact, type } of resolvedRecipients) {
			if (contact == null) continue;
			const isExternalAndConfidential = type === RecipientType.EXTERNAL && this.isConfidential();
			if (!contact._id && (!this.user().props.noAutomaticContacts || isExternalAndConfidential)) {
				if (isExternalAndConfidential) contact.presharedPassword = this.getPassword(address).trim();
				const listId = await this.contactModel.getContactListId();
				await this.entity.setup(listId, contact);
			} else if (contact._id && isExternalAndConfidential && contact.presharedPassword !== this.getPassword(address).trim()) {
				contact.presharedPassword = this.getPassword(address).trim();
				await this.entity.update(contact);
			}
		}
	}
	allRecipients() {
		return this.toRecipients().concat(this.ccRecipients()).concat(this.bccRecipients());
	}
	/**
	* Makes sure the recipient type and contact are resolved.
	*/
	async waitForResolvedRecipients() {
		await this.recipientsResolved.getAsync();
		return Promise.all(this.allRecipients().map((recipient) => recipient.resolved())).catch(ofClass(TooManyRequestsError, () => {
			throw new RecipientNotResolvedError("");
		}));
	}
	async handleEntityEvent(update) {
		const { operation, instanceId, instanceListId } = update;
		let contactId = [neverNull(instanceListId), instanceId];
		let changed = false;
		if (isUpdateForTypeRef(ContactTypeRef, update)) {
			await this.recipientsResolved.getAsync();
			if (operation === OperationType.UPDATE) this.entity.load(ContactTypeRef, contactId).then((contact) => {
				for (const fieldType of typedValues(RecipientField)) {
					const matching = this.getRecipientList(fieldType).filter((recipient) => recipient.contact && isSameId(recipient.contact._id, contact._id));
					for (const recipient of matching) if (!contact.mailAddresses.some((ma) => cleanMatch(ma.address, recipient.address))) changed = changed || this.removeRecipient(recipient, fieldType, true);
else {
						recipient.setName(getContactDisplayName(contact));
						recipient.setContact(contact);
						changed = true;
					}
				}
			});
else if (operation === OperationType.DELETE) for (const fieldType of typedValues(RecipientField)) {
				const recipients = this.getRecipientList(fieldType);
				const toDelete = recipients.filter((recipient) => recipient.contact && isSameId(recipient.contact._id, contactId) || false);
				for (const r of toDelete) changed = changed || this.removeRecipient(r, fieldType, true);
			}
			this.markAsChangedIfNecessary(true);
		} else if (isUpdateForTypeRef(CustomerPropertiesTypeRef, update)) this.updateAvailableNotificationTemplateLanguages();
else if (isUpdateForTypeRef(MailboxPropertiesTypeRef, update) && operation === OperationType.UPDATE) this.mailboxProperties = await this.entity.load(MailboxPropertiesTypeRef, update.instanceId);
		this.markAsChangedIfNecessary(changed);
		return Promise.resolve();
	}
	setOnBeforeSendFunction(fun) {
		this.onBeforeSend = fun;
	}
	isUserPreviousSender() {
		if (!this.previousMail) return false;
		return isUserEmail(this.logins, this.mailboxDetails, this.previousMail.sender.address);
	}
};
/**
* deduplicate a list of recipients for insertion in any of the recipient fields
* recipients are considered equal when their cleanMailAddress() is the same
* returns the recipients with their original mail address
*
* unhandled edge case: it's possible to lose recipients that should be kept when
* * the mail contains several recipients that have the same clean address (Bob@e.de and bob@e.de)
* * the e.de mail server considers these distinct
* * we hit "reply all"
*
*/
function recipientsFilter(recipientList) {
	const cleanedList = recipientList.filter((r) => isMailAddress(r.address, false)).map((a) => ({
		recipient: a,
		cleaned: cleanMailAddress(a.address)
	}));
	return deduplicate(cleanedList, (a, b) => a.cleaned === b.cleaned).map((a) => a.recipient);
}

//#endregion
export { SendMailModel };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VuZE1haWxNb2RlbC1jaHVuay5qcyIsIm5hbWVzIjpbIm1haWxGYWNhZGU6IE1haWxGYWNhZGUiLCJlbnRpdHk6IEVudGl0eUNsaWVudCIsImxvZ2luczogTG9naW5Db250cm9sbGVyIiwibWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWwiLCJjb250YWN0TW9kZWw6IENvbnRhY3RNb2RlbCIsImV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyIiwibWFpbGJveERldGFpbHM6IE1haWxib3hEZXRhaWwiLCJyZWNpcGllbnRzTW9kZWw6IFJlY2lwaWVudHNNb2RlbCIsImRhdGVQcm92aWRlcjogRGF0ZVByb3ZpZGVyIiwibWFpbGJveFByb3BlcnRpZXM6IE1haWxib3hQcm9wZXJ0aWVzIiwibmVlZE5ld0RyYWZ0OiAobWFpbDogTWFpbCkgPT4gUHJvbWlzZTxib29sZWFuPiIsInVwZGF0ZXM6IFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlRGF0YT4iLCJsOiBMYW5ndWFnZSIsIm1haWxBZGRyZXNzOiBzdHJpbmciLCJwYXNzd29yZDogc3RyaW5nIiwic3ViamVjdDogc3RyaW5nIiwiYm9keTogc3RyaW5nIiwic2VuZGVyQWRkcmVzczogc3RyaW5nIiwicmVjaXBpZW50OiBQYXJ0aWFsUmVjaXBpZW50IiwiaGFzQ2hhbmdlZDogYm9vbGVhbiIsInJlY2lwaWVudHM6IFJlY2lwaWVudHMiLCJib2R5VGV4dDogc3RyaW5nIiwiYXR0YWNobWVudHM/OiBSZWFkb25seUFycmF5PEF0dGFjaG1lbnQ+IiwiY29uZmlkZW50aWFsPzogYm9vbGVhbiIsInNlbmRlck1haWxBZGRyZXNzPzogc3RyaW5nIiwiaW5pdGlhbENoYW5nZWRTdGF0ZT86IGJvb2xlYW4iLCJhcmdzOiBJbml0QXNSZXNwb25zZUFyZ3MiLCJpbmxpbmVJbWFnZXM6IElubGluZUltYWdlcyIsInByZXZpb3VzTWVzc2FnZUlkOiBzdHJpbmcgfCBudWxsIiwiZHJhZnQ6IE1haWwiLCJkcmFmdERldGFpbHM6IE1haWxEZXRhaWxzIiwiYXR0YWNobWVudHM6IFR1dGFub3RhRmlsZVtdIiwicHJldmlvdXNNYWlsOiBNYWlsIHwgbnVsbCIsInRvOiBSZWNpcGllbnRMaXN0IiwiY2M6IFJlY2lwaWVudExpc3QiLCJiY2M6IFJlY2lwaWVudExpc3QiLCJ0eXBlOiBSZWNpcGllbnRGaWVsZCIsImZpZWxkVHlwZTogUmVjaXBpZW50RmllbGQiLCJyZXNvbHZlTW9kZTogUmVzb2x2ZU1vZGUiLCJhZGRyZXNzIiwiY29udGFjdCIsInBhcnRpYWxSZWNpcGllbnQ6IFBhcnRpYWxSZWNpcGllbnQiLCJhZGRyZXNzOiBzdHJpbmciLCJub3RpZnk6IGJvb2xlYW4iLCJyZWNpcGllbnQ6IFJlY2lwaWVudCIsImZpbGVzOiBSZWFkb25seUFycmF5PEF0dGFjaG1lbnQ+IiwiZmlsZTogQXR0YWNobWVudCIsImF0dGFjaG1lbnRzOiBSZWFkb25seUFycmF5PEF0dGFjaG1lbnQ+IHwgbnVsbCIsIm1haWxNZXRob2Q6IE1haWxNZXRob2QiLCJjb25maWRlbnRpYWw6IGJvb2xlYW4iLCJnZXRDb25maXJtYXRpb246IChhcmcwOiBNYXliZVRyYW5zbGF0aW9uKSA9PiBQcm9taXNlPGJvb2xlYW4+Iiwid2FpdEhhbmRsZXI6IChhcmcwOiBNYXliZVRyYW5zbGF0aW9uLCBhcmcxOiBQcm9taXNlPGFueT4pID0+IFByb21pc2U8YW55PiIsInRvb01hbnlSZXF1ZXN0c0Vycm9yOiBUcmFuc2xhdGlvbktleSIsInNhdmVBdHRhY2htZW50czogYm9vbGVhbiIsImNvZGU6IHN0cmluZyIsInJlc29sdmVkUmVjaXBpZW50czogUmVjaXBpZW50W10iLCJ1cGRhdGU6IEVudGl0eVVwZGF0ZURhdGEiLCJjb250YWN0SWQ6IElkVHVwbGUiLCJmdW46ICgpID0+IHVua25vd24iLCJyZWNpcGllbnRMaXN0OiBSZWFkb25seUFycmF5PFBhcnRpYWxSZWNpcGllbnQ+Il0sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9TZW5kTWFpbE1vZGVsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9FbnYuanNcIlxuaW1wb3J0IHsgRGF0YUZpbGUgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9EYXRhRmlsZS5qc1wiXG5pbXBvcnQgeyBGaWxlUmVmZXJlbmNlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vdXRpbHMvRmlsZVV0aWxzLmpzXCJcbmltcG9ydCB7XG5cdENvbnRhY3RUeXBlUmVmLFxuXHRDb252ZXJzYXRpb25FbnRyeVR5cGVSZWYsXG5cdEZpbGVUeXBlUmVmLFxuXHRNYWlsLFxuXHRNYWlsYm94UHJvcGVydGllcyxcblx0TWFpbGJveFByb3BlcnRpZXNUeXBlUmVmLFxuXHRNYWlsRGV0YWlscyxcblx0TWFpbFR5cGVSZWYsXG59IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgQXBwcm92YWxTdGF0dXMsIENvbnZlcnNhdGlvblR5cGUsIE1haWxTZXRLaW5kLCBNYWlsTWV0aG9kLCBNQVhfQVRUQUNITUVOVF9TSVpFLCBPcGVyYXRpb25UeXBlLCBSZXBseVR5cGUgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBQYXJ0aWFsUmVjaXBpZW50LCBSZWNpcGllbnQsIFJlY2lwaWVudExpc3QsIFJlY2lwaWVudHMsIFJlY2lwaWVudFR5cGUgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9yZWNpcGllbnRzL1JlY2lwaWVudC5qc1wiXG5pbXBvcnQge1xuXHRhc3NlcnROb3ROdWxsLFxuXHRjbGVhbk1hdGNoLFxuXHRkZWR1cGxpY2F0ZSxcblx0ZGVmZXIsXG5cdERlZmVycmVkT2JqZWN0LFxuXHRkb3duY2FzdCxcblx0ZmluZEFuZFJlbW92ZSxcblx0Z2V0RnJvbU1hcCxcblx0TGF6eUxvYWRlZCxcblx0bmV2ZXJOdWxsLFxuXHRub09wLFxuXHRvZkNsYXNzLFxuXHRwcm9taXNlTWFwLFxuXHRyZW1vdmUsXG5cdHR5cGVkVmFsdWVzLFxufSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB0eXBlIHsgRmlsZSBhcyBUdXRhbm90YUZpbGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBjaGVja0F0dGFjaG1lbnRTaXplLCBnZXREZWZhdWx0U2VuZGVyLCBnZXRUZW1wbGF0ZUxhbmd1YWdlcywgaXNVc2VyRW1haWwsIFJlY2lwaWVudEZpZWxkIH0gZnJvbSBcIi4vU2hhcmVkTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IGNsb25lSW5saW5lSW1hZ2VzLCBJbmxpbmVJbWFnZXMsIHJldm9rZUlubGluZUltYWdlcyB9IGZyb20gXCIuL2lubGluZUltYWdlc1V0aWxzLmpzXCJcbmltcG9ydCB7IFJlY2lwaWVudHNNb2RlbCwgUmVzb2x2YWJsZVJlY2lwaWVudCwgUmVzb2x2ZU1vZGUgfSBmcm9tIFwiLi4vYXBpL21haW4vUmVjaXBpZW50c01vZGVsLmpzXCJcbmltcG9ydCB7IGdldEF2YWlsYWJsZUxhbmd1YWdlQ29kZSwgZ2V0U3Vic3RpdHV0ZWRMYW5ndWFnZUNvZGUsIGxhbmcsIExhbmd1YWdlLCBsYW5ndWFnZXMsIFRyYW5zbGF0aW9uS2V5LCBNYXliZVRyYW5zbGF0aW9uIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgTWFpbEZhY2FkZSB9IGZyb20gXCIuLi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9NYWlsRmFjYWRlLmpzXCJcbmltcG9ydCB7IEVudGl0eUNsaWVudCB9IGZyb20gXCIuLi9hcGkvY29tbW9uL0VudGl0eUNsaWVudC5qc1wiXG5pbXBvcnQgeyBMb2dpbkNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vYXBpL21haW4vTG9naW5Db250cm9sbGVyLmpzXCJcbmltcG9ydCB7IEV2ZW50Q29udHJvbGxlciB9IGZyb20gXCIuLi9hcGkvbWFpbi9FdmVudENvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgRGF0ZVByb3ZpZGVyIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRGF0ZVByb3ZpZGVyLmpzXCJcbmltcG9ydCB7IEVudGl0eVVwZGF0ZURhdGEsIGlzVXBkYXRlRm9yVHlwZVJlZiB9IGZyb20gXCIuLi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVVwZGF0ZVV0aWxzLmpzXCJcbmltcG9ydCB7IFVzZXJDb250cm9sbGVyIH0gZnJvbSBcIi4uL2FwaS9tYWluL1VzZXJDb250cm9sbGVyLmpzXCJcbmltcG9ydCB7IGNsZWFuTWFpbEFkZHJlc3MsIGZpbmRSZWNpcGllbnRXaXRoQWRkcmVzcyB9IGZyb20gXCIuLi9hcGkvY29tbW9uL3V0aWxzL0NvbW1vbkNhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHsgZ2V0UGFzc3dvcmRTdHJlbmd0aEZvclVzZXIsIGlzU2VjdXJlUGFzc3dvcmQsIFBBU1NXT1JEX01JTl9TRUNVUkVfVkFMVUUgfSBmcm9tIFwiLi4vbWlzYy9wYXNzd29yZHMvUGFzc3dvcmRVdGlscy5qc1wiXG5pbXBvcnQge1xuXHRBY2Nlc3NCbG9ja2VkRXJyb3IsXG5cdExvY2tlZEVycm9yLFxuXHROb3RBdXRob3JpemVkRXJyb3IsXG5cdE5vdEZvdW5kRXJyb3IsXG5cdFBheWxvYWRUb29MYXJnZUVycm9yLFxuXHRQcmVjb25kaXRpb25GYWlsZWRFcnJvcixcblx0VG9vTWFueVJlcXVlc3RzRXJyb3IsXG59IGZyb20gXCIuLi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvci5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgeyBVc2VyRXJyb3IgfSBmcm9tIFwiLi4vYXBpL21haW4vVXNlckVycm9yLmpzXCJcbmltcG9ydCB7IGdldFNlbmRlck5hbWUgfSBmcm9tIFwiLi4vbWlzYy9NYWlsYm94UHJvcGVydGllc1V0aWxzLmpzXCJcbmltcG9ydCB7IFJlY2lwaWVudE5vdFJlc29sdmVkRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9SZWNpcGllbnROb3RSZXNvbHZlZEVycm9yLmpzXCJcbmltcG9ydCB7IFJlY2lwaWVudHNOb3RGb3VuZEVycm9yIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vZXJyb3IvUmVjaXBpZW50c05vdEZvdW5kRXJyb3IuanNcIlxuaW1wb3J0IHsgY2hlY2tBcHByb3ZhbFN0YXR1cyB9IGZyb20gXCIuLi9taXNjL0xvZ2luVXRpbHMuanNcIlxuaW1wb3J0IHsgRmlsZU5vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9lcnJvci9GaWxlTm90Rm91bmRFcnJvci5qc1wiXG5pbXBvcnQgeyBnZXRMaXN0SWQsIGlzU2FtZUlkLCBzdHJpbmdUb0N1c3RvbUlkIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgTWFpbEJvZHlUb29MYXJnZUVycm9yIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vZXJyb3IvTWFpbEJvZHlUb29MYXJnZUVycm9yLmpzXCJcbmltcG9ydCB7IGNyZWF0ZUFwcHJvdmFsTWFpbCB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvbW9uaXRvci9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBDdXN0b21lclByb3BlcnRpZXNUeXBlUmVmIH0gZnJvbSBcIi4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgaXNNYWlsQWRkcmVzcyB9IGZyb20gXCIuLi9taXNjL0Zvcm1hdFZhbGlkYXRvci5qc1wiXG5pbXBvcnQgeyBNYWlsYm94RGV0YWlsLCBNYWlsYm94TW9kZWwgfSBmcm9tIFwiLi9NYWlsYm94TW9kZWwuanNcIlxuaW1wb3J0IHsgQ29udGFjdE1vZGVsIH0gZnJvbSBcIi4uL2NvbnRhY3RzRnVuY3Rpb25hbGl0eS9Db250YWN0TW9kZWwuanNcIlxuaW1wb3J0IHsgZ2V0Q29udGFjdERpc3BsYXlOYW1lIH0gZnJvbSBcIi4uL2NvbnRhY3RzRnVuY3Rpb25hbGl0eS9Db250YWN0VXRpbHMuanNcIlxuaW1wb3J0IHsgZ2V0TWFpbEJvZHlUZXh0IH0gZnJvbSBcIi4uL2FwaS9jb21tb24vQ29tbW9uTWFpbFV0aWxzLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbmV4cG9ydCBjb25zdCBUT09fTUFOWV9WSVNJQkxFX1JFQ0lQSUVOVFMgPSAxMFxuXG5leHBvcnQgdHlwZSBBdHRhY2htZW50ID0gVHV0YW5vdGFGaWxlIHwgRGF0YUZpbGUgfCBGaWxlUmVmZXJlbmNlXG5cbmV4cG9ydCB0eXBlIEluaXRBc1Jlc3BvbnNlQXJncyA9IHtcblx0cHJldmlvdXNNYWlsOiBNYWlsXG5cdGNvbnZlcnNhdGlvblR5cGU6IENvbnZlcnNhdGlvblR5cGVcblx0c2VuZGVyTWFpbEFkZHJlc3M6IHN0cmluZ1xuXHRyZWNpcGllbnRzOiBSZWNpcGllbnRzXG5cdGF0dGFjaG1lbnRzOiBUdXRhbm90YUZpbGVbXVxuXHRzdWJqZWN0OiBzdHJpbmdcblx0Ym9keVRleHQ6IHN0cmluZ1xuXHRyZXBseVRvczogUmVjaXBpZW50TGlzdFxufVxuXG50eXBlIEluaXRBcmdzID0ge1xuXHRjb252ZXJzYXRpb25UeXBlOiBDb252ZXJzYXRpb25UeXBlXG5cdHN1YmplY3Q6IHN0cmluZ1xuXHRib2R5VGV4dDogc3RyaW5nXG5cdHJlY2lwaWVudHM6IFJlY2lwaWVudHNcblx0Y29uZmlkZW50aWFsOiBib29sZWFuIHwgbnVsbFxuXHRkcmFmdD86IE1haWwgfCBudWxsXG5cdHNlbmRlck1haWxBZGRyZXNzPzogc3RyaW5nXG5cdGF0dGFjaG1lbnRzPzogUmVhZG9ubHlBcnJheTxBdHRhY2htZW50PlxuXHRyZXBseVRvcz86IFJlY2lwaWVudExpc3Rcblx0cHJldmlvdXNNYWlsPzogTWFpbCB8IG51bGxcblx0cHJldmlvdXNNZXNzYWdlSWQ/OiBzdHJpbmcgfCBudWxsXG5cdGluaXRpYWxDaGFuZ2VkU3RhdGU6IGJvb2xlYW4gfCBudWxsXG59XG5cbi8qKlxuICogTW9kZWwgd2hpY2ggYWxsb3dzIHNlbmRpbmcgbWFpbHMgaW50ZXJhY3RpdmVseSAtIGluY2x1ZGluZyByZXNvbHZpbmcgb2YgcmVjaXBpZW50cyBhbmQgaGFuZGxpbmcgb2YgZHJhZnRzLlxuICovXG5leHBvcnQgY2xhc3MgU2VuZE1haWxNb2RlbCB7XG5cdHByaXZhdGUgaW5pdGlhbGl6ZWQ6IERlZmVycmVkT2JqZWN0PHZvaWQ+IHwgbnVsbCA9IG51bGxcblx0b25NYWlsQ2hhbmdlZDogU3RyZWFtPG51bGw+ID0gc3RyZWFtKG51bGwpXG5cdG9uUmVjaXBpZW50RGVsZXRlZDogU3RyZWFtPHsgZmllbGQ6IFJlY2lwaWVudEZpZWxkOyByZWNpcGllbnQ6IFJlY2lwaWVudCB9IHwgbnVsbD4gPSBzdHJlYW0obnVsbClcblx0b25CZWZvcmVTZW5kOiAoKSA9PiB2b2lkID0gbm9PcFxuXHRsb2FkZWRJbmxpbmVJbWFnZXM6IElubGluZUltYWdlcyA9IG5ldyBNYXAoKVxuXG5cdC8vIElzbid0IHByaXZhdGUgYmVjYXVzZSB1c2VkIGJ5IE1pbmltaXplZEVkaXRvck92ZXJsYXksIHJlZmFjdG9yP1xuXHRkcmFmdDogTWFpbCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgY29udmVyc2F0aW9uVHlwZTogQ29udmVyc2F0aW9uVHlwZSA9IENvbnZlcnNhdGlvblR5cGUuTkVXXG5cdHByaXZhdGUgc3ViamVjdDogc3RyaW5nID0gXCJcIlxuXHRwcml2YXRlIGJvZHk6IHN0cmluZyA9IFwiXCJcblx0cHJpdmF0ZSByZWNpcGllbnRzOiBNYXA8UmVjaXBpZW50RmllbGQsIEFycmF5PFJlc29sdmFibGVSZWNpcGllbnQ+PiA9IG5ldyBNYXAoKVxuXHRwcml2YXRlIHNlbmRlckFkZHJlc3M6IHN0cmluZ1xuXHRwcml2YXRlIGNvbmZpZGVudGlhbDogYm9vbGVhblxuXG5cdC8vIGNvbnRhaW5zIGVpdGhlciBGaWxlcyBmcm9tIFR1dGFub3RhIG9yIERhdGFGaWxlcyBvZiBsb2NhbGx5IGxvYWRlZCBmaWxlcy4gdGhlc2UgbWFwIDE6MSB0byB0aGUgX2F0dGFjaG1lbnRCdXR0b25zXG5cdHByaXZhdGUgYXR0YWNobWVudHM6IEFycmF5PEF0dGFjaG1lbnQ+ID0gW11cblxuXHRwcml2YXRlIHJlcGx5VG9zOiBBcnJheTxSZXNvbHZhYmxlUmVjaXBpZW50PiA9IFtdXG5cblx0Ly8gb25seSBuZWVkcyB0byBiZSB0aGUgY29ycmVjdCB2YWx1ZSBpZiB0aGlzIGlzIGEgbmV3IGVtYWlsLiBpZiB3ZSBhcmUgZWRpdGluZyBhIGRyYWZ0LCBjb252ZXJzYXRpb25UeXBlIGlzIG5vdCB1c2VkXG5cdHByaXZhdGUgcHJldmlvdXNNZXNzYWdlSWQ6IElkIHwgbnVsbCA9IG51bGxcblxuXHRwcml2YXRlIHByZXZpb3VzTWFpbDogTWFpbCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgc2VsZWN0ZWROb3RpZmljYXRpb25MYW5ndWFnZTogc3RyaW5nXG5cdHByaXZhdGUgYXZhaWxhYmxlTm90aWZpY2F0aW9uVGVtcGxhdGVMYW5ndWFnZXM6IEFycmF5PExhbmd1YWdlPiA9IFtdXG5cdHByaXZhdGUgbWFpbENoYW5nZWRBdDogbnVtYmVyID0gMFxuXHRwcml2YXRlIG1haWxTYXZlZEF0OiBudW1iZXIgPSAxXG5cdHByaXZhdGUgcGFzc3dvcmRzOiBNYXA8c3RyaW5nLCBzdHJpbmc+ID0gbmV3IE1hcCgpXG5cblx0Ly8gVGhlIHByb21pc2UgZm9yIHRoZSBkcmFmdCBjdXJyZW50bHkgYmVpbmcgc2F2ZWRcblx0cHJpdmF0ZSBjdXJyZW50U2F2ZVByb21pc2U6IFByb21pc2U8dm9pZD4gfCBudWxsID0gbnVsbFxuXG5cdC8vIElmIHNhdmVEcmFmdCBpcyBjYWxsZWQgd2hpbGUgdGhlIHByZXZpb3VzIGNhbGwgaXMgc3RpbGwgcnVubmluZywgdGhlbiBmbGFnIHRvIGNhbGwgYWdhaW4gYWZ0ZXJ3YXJkc1xuXHRwcml2YXRlIGRvU2F2ZUFnYWluOiBib29sZWFuID0gZmFsc2Vcblx0cHJpdmF0ZSByZWNpcGllbnRzUmVzb2x2ZWQgPSBuZXcgTGF6eUxvYWRlZDx2b2lkPihhc3luYyAoKSA9PiB7fSlcblxuXHQvKipcblx0ICogY3JlYXRlcyBhIG5ldyBlbXB0eSBkcmFmdCBtZXNzYWdlLiBjYWxsaW5nIGFuIGluaXQgbWV0aG9kIHdpbGwgZmlsbCBpbiBhbGwgdGhlIGJsYW5rIGRhdGFcblx0ICovXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHB1YmxpYyByZWFkb25seSBtYWlsRmFjYWRlOiBNYWlsRmFjYWRlLFxuXHRcdHB1YmxpYyByZWFkb25seSBlbnRpdHk6IEVudGl0eUNsaWVudCxcblx0XHRwdWJsaWMgcmVhZG9ubHkgbG9naW5zOiBMb2dpbkNvbnRyb2xsZXIsXG5cdFx0cHVibGljIHJlYWRvbmx5IG1haWxib3hNb2RlbDogTWFpbGJveE1vZGVsLFxuXHRcdHB1YmxpYyByZWFkb25seSBjb250YWN0TW9kZWw6IENvbnRhY3RNb2RlbCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyLFxuXHRcdHB1YmxpYyByZWFkb25seSBtYWlsYm94RGV0YWlsczogTWFpbGJveERldGFpbCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IHJlY2lwaWVudHNNb2RlbDogUmVjaXBpZW50c01vZGVsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZGF0ZVByb3ZpZGVyOiBEYXRlUHJvdmlkZXIsXG5cdFx0cHJpdmF0ZSBtYWlsYm94UHJvcGVydGllczogTWFpbGJveFByb3BlcnRpZXMsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBuZWVkTmV3RHJhZnQ6IChtYWlsOiBNYWlsKSA9PiBQcm9taXNlPGJvb2xlYW4+LFxuXHQpIHtcblx0XHRjb25zdCB1c2VyUHJvcHMgPSBsb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5wcm9wc1xuXHRcdHRoaXMuc2VuZGVyQWRkcmVzcyA9IHRoaXMuZ2V0RGVmYXVsdFNlbmRlcigpXG5cdFx0dGhpcy5jb25maWRlbnRpYWwgPSAhdXNlclByb3BzLmRlZmF1bHRVbmNvbmZpZGVudGlhbFxuXG5cdFx0dGhpcy5zZWxlY3RlZE5vdGlmaWNhdGlvbkxhbmd1YWdlID0gZ2V0QXZhaWxhYmxlTGFuZ3VhZ2VDb2RlKHVzZXJQcm9wcy5ub3RpZmljYXRpb25NYWlsTGFuZ3VhZ2UgfHwgbGFuZy5jb2RlKVxuXHRcdHRoaXMudXBkYXRlQXZhaWxhYmxlTm90aWZpY2F0aW9uVGVtcGxhdGVMYW5ndWFnZXMoKVxuXG5cdFx0dGhpcy5ldmVudENvbnRyb2xsZXIuYWRkRW50aXR5TGlzdGVuZXIodGhpcy5lbnRpdHlFdmVudFJlY2VpdmVkKVxuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSBlbnRpdHlFdmVudFJlY2VpdmVkID0gYXN5bmMgKHVwZGF0ZXM6IFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlRGF0YT4pID0+IHtcblx0XHRmb3IgKGNvbnN0IHVwZGF0ZSBvZiB1cGRhdGVzKSB7XG5cdFx0XHRhd2FpdCB0aGlzLmhhbmRsZUVudGl0eUV2ZW50KHVwZGF0ZSlcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogU29ydCBsaXN0IG9mIGFsbCBsYW5ndWFnZXMgYWxwaGFiZXRpY2FsbHlcblx0ICogdGhlbiB3ZSBzZWUgaWYgdGhlIHVzZXIgaGFzIGN1c3RvbSBub3RpZmljYXRpb24gdGVtcGxhdGVzXG5cdCAqIGluIHdoaWNoIGNhc2Ugd2UgcmVwbGFjZSB0aGUgbGlzdCB3aXRoIGp1c3QgdGhlIHRlbXBsYXRlcyB0aGF0IHRoZSB1c2VyIGhhcyBzcGVjaWZpZWRcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgdXBkYXRlQXZhaWxhYmxlTm90aWZpY2F0aW9uVGVtcGxhdGVMYW5ndWFnZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5hdmFpbGFibGVOb3RpZmljYXRpb25UZW1wbGF0ZUxhbmd1YWdlcyA9IGxhbmd1YWdlcy5zbGljZSgpLnNvcnQoKGEsIGIpID0+IGxhbmcuZ2V0KGEudGV4dElkKS5sb2NhbGVDb21wYXJlKGxhbmcuZ2V0KGIudGV4dElkKSkpXG5cdFx0Y29uc3QgZmlsdGVyZWRMYW5ndWFnZXMgPSBhd2FpdCBnZXRUZW1wbGF0ZUxhbmd1YWdlcyh0aGlzLmF2YWlsYWJsZU5vdGlmaWNhdGlvblRlbXBsYXRlTGFuZ3VhZ2VzLCB0aGlzLmVudGl0eSwgdGhpcy5sb2dpbnMpXG5cdFx0aWYgKGZpbHRlcmVkTGFuZ3VhZ2VzLmxlbmd0aCA+IDApIHtcblx0XHRcdGNvbnN0IGxhbmd1YWdlQ29kZXMgPSBmaWx0ZXJlZExhbmd1YWdlcy5tYXAoKGw6IExhbmd1YWdlKSA9PiBsLmNvZGUpXG5cdFx0XHR0aGlzLnNlbGVjdGVkTm90aWZpY2F0aW9uTGFuZ3VhZ2UgPVxuXHRcdFx0XHRnZXRTdWJzdGl0dXRlZExhbmd1YWdlQ29kZSh0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnByb3BzLm5vdGlmaWNhdGlvbk1haWxMYW5ndWFnZSB8fCBsYW5nLmNvZGUsIGxhbmd1YWdlQ29kZXMpIHx8IGxhbmd1YWdlQ29kZXNbMF1cblx0XHRcdHRoaXMuYXZhaWxhYmxlTm90aWZpY2F0aW9uVGVtcGxhdGVMYW5ndWFnZXMgPSBmaWx0ZXJlZExhbmd1YWdlc1xuXHRcdH1cblx0fVxuXG5cdHVzZXIoKTogVXNlckNvbnRyb2xsZXIge1xuXHRcdHJldHVybiB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpXG5cdH1cblxuXHRpc1NoYXJlZE1haWxib3goKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuICF0aGlzLm1haWxib3hEZXRhaWxzLm1haWxHcm91cC51c2VyXG5cdH1cblxuXHRnZXRQcmV2aW91c01haWwoKTogTWFpbCB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLnByZXZpb3VzTWFpbFxuXHR9XG5cblx0Z2V0Q29udmVyc2F0aW9uVHlwZSgpOiBDb252ZXJzYXRpb25UeXBlIHtcblx0XHRyZXR1cm4gdGhpcy5jb252ZXJzYXRpb25UeXBlXG5cdH1cblxuXHRzZXRQYXNzd29yZChtYWlsQWRkcmVzczogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKSB7XG5cdFx0dGhpcy5vbk1haWxDaGFuZ2VkKG51bGwpXG5cdFx0dGhpcy5wYXNzd29yZHMuc2V0KG1haWxBZGRyZXNzLCBwYXNzd29yZClcblx0fVxuXG5cdGdldFBhc3N3b3JkKG1haWxBZGRyZXNzOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdHJldHVybiB0aGlzLnBhc3N3b3Jkcy5nZXQobWFpbEFkZHJlc3MpIHx8IFwiXCJcblx0fVxuXG5cdGdldFN1YmplY3QoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy5zdWJqZWN0XG5cdH1cblxuXHRzZXRTdWJqZWN0KHN1YmplY3Q6IHN0cmluZykge1xuXHRcdHRoaXMubWFya0FzQ2hhbmdlZElmTmVjZXNzYXJ5KHN1YmplY3QgIT09IHRoaXMuc3ViamVjdClcblx0XHR0aGlzLnN1YmplY3QgPSBzdWJqZWN0XG5cdH1cblxuXHRnZXRCb2R5KCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHRoaXMuYm9keVxuXHR9XG5cblx0c2V0Qm9keShib2R5OiBzdHJpbmcpIHtcblx0XHR0aGlzLm1hcmtBc0NoYW5nZWRJZk5lY2Vzc2FyeSh0aGlzLmJvZHkgIT09IGJvZHkpXG5cdFx0dGhpcy5ib2R5ID0gYm9keVxuXHR9XG5cblx0LyoqXG5cdCAqIHNldCB0aGUgbWFpbCBhZGRyZXNzIHVzZWQgdG8gc2VuZCB0aGUgbWFpbC5cblx0ICogQHBhcmFtIHNlbmRlckFkZHJlc3MgdGhlIG1haWwgYWRkcmVzcyB0aGF0IHdpbGwgc2hvdyB1cCBsb3dlcmNhc2VkIGluIHRoZSBzZW5kZXIgZmllbGQgb2YgdGhlIHNlbnQgbWFpbC5cblx0ICovXG5cdHNldFNlbmRlcihzZW5kZXJBZGRyZXNzOiBzdHJpbmcpIHtcblx0XHQvLyB3ZSBjYW4gKGFuZCBzaG91bGQpIGRvIHRoaXMgYmVjYXVzZSB3ZSBsb3dlcmNhc2UgYWxsIGFkZHJlc3NlcyBvbiBzaWdudXAgYW5kIHdoZW4gY3JlYXRpbmcgYWxpYXNlcy5cblx0XHRzZW5kZXJBZGRyZXNzID0gY2xlYW5NYWlsQWRkcmVzcyhzZW5kZXJBZGRyZXNzKVxuXHRcdHRoaXMubWFya0FzQ2hhbmdlZElmTmVjZXNzYXJ5KHRoaXMuc2VuZGVyQWRkcmVzcyAhPT0gc2VuZGVyQWRkcmVzcylcblx0XHR0aGlzLnNlbmRlckFkZHJlc3MgPSBzZW5kZXJBZGRyZXNzXG5cdH1cblxuXHRnZXRTZW5kZXIoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kZXJBZGRyZXNzXG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgc3RyZW5ndGggaW5kaWNhdG9yIGZvciB0aGUgcmVjaXBpZW50cyBwYXNzd29yZFxuXHQgKiBAcmV0dXJucyB2YWx1ZSBiZXR3ZWVuIDAgYW5kIDEwMFxuXHQgKi9cblx0Z2V0UGFzc3dvcmRTdHJlbmd0aChyZWNpcGllbnQ6IFBhcnRpYWxSZWNpcGllbnQpOiBudW1iZXIge1xuXHRcdHJldHVybiBnZXRQYXNzd29yZFN0cmVuZ3RoRm9yVXNlcih0aGlzLmdldFBhc3N3b3JkKHJlY2lwaWVudC5hZGRyZXNzKSwgcmVjaXBpZW50LCB0aGlzLm1haWxib3hEZXRhaWxzLCB0aGlzLmxvZ2lucylcblx0fVxuXG5cdGhhc01haWxDaGFuZ2VkKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLm1haWxDaGFuZ2VkQXQgPiB0aGlzLm1haWxTYXZlZEF0XG5cdH1cblxuXHQvKipcblx0ICogdXBkYXRlIHRoZSBjaGFuZ2VkIHN0YXRlIG9mIHRoZSBtYWlsLlxuXHQgKiB3aWxsIG9ubHkgYmUgcmVzZXQgd2hlbiBzYXZpbmcuXG5cdCAqL1xuXHRtYXJrQXNDaGFuZ2VkSWZOZWNlc3NhcnkoaGFzQ2hhbmdlZDogYm9vbGVhbikge1xuXHRcdGlmICghaGFzQ2hhbmdlZCkgcmV0dXJuXG5cdFx0dGhpcy5tYWlsQ2hhbmdlZEF0ID0gdGhpcy5kYXRlUHJvdmlkZXIubm93KClcblx0XHQvLyBpZiB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgd2hlcmV2ZXIgc3RhdGUgZ2V0cyBjaGFuZ2VkLCBvbk1haWxDaGFuZ2VkIHNob3VsZCBmdW5jdGlvbiBwcm9wZXJseVxuXHRcdHRoaXMub25NYWlsQ2hhbmdlZChudWxsKVxuXHR9XG5cblx0LyoqXG5cdCAqXG5cdCAqIEBwYXJhbSByZWNpcGllbnRzXG5cdCAqIEBwYXJhbSBzdWJqZWN0XG5cdCAqIEBwYXJhbSBib2R5VGV4dFxuXHQgKiBAcGFyYW0gYXR0YWNobWVudHNcblx0ICogQHBhcmFtIGNvbmZpZGVudGlhbFxuXHQgKiBAcGFyYW0gc2VuZGVyTWFpbEFkZHJlc3Ncblx0ICogQHBhcmFtIGluaXRpYWxDaGFuZ2VkU3RhdGVcblx0ICogQHJldHVybnMge1Byb21pc2U8U2VuZE1haWxNb2RlbD59XG5cdCAqL1xuXHRpbml0V2l0aFRlbXBsYXRlKFxuXHRcdHJlY2lwaWVudHM6IFJlY2lwaWVudHMsXG5cdFx0c3ViamVjdDogc3RyaW5nLFxuXHRcdGJvZHlUZXh0OiBzdHJpbmcsXG5cdFx0YXR0YWNobWVudHM/OiBSZWFkb25seUFycmF5PEF0dGFjaG1lbnQ+LFxuXHRcdGNvbmZpZGVudGlhbD86IGJvb2xlYW4sXG5cdFx0c2VuZGVyTWFpbEFkZHJlc3M/OiBzdHJpbmcsXG5cdFx0aW5pdGlhbENoYW5nZWRTdGF0ZT86IGJvb2xlYW4sXG5cdCk6IFByb21pc2U8U2VuZE1haWxNb2RlbD4ge1xuXHRcdHRoaXMuc3RhcnRJbml0KClcblx0XHRyZXR1cm4gdGhpcy5pbml0KHtcblx0XHRcdGNvbnZlcnNhdGlvblR5cGU6IENvbnZlcnNhdGlvblR5cGUuTkVXLFxuXHRcdFx0c3ViamVjdCxcblx0XHRcdGJvZHlUZXh0LFxuXHRcdFx0cmVjaXBpZW50cyxcblx0XHRcdGF0dGFjaG1lbnRzLFxuXHRcdFx0Y29uZmlkZW50aWFsOiBjb25maWRlbnRpYWwgPz8gbnVsbCxcblx0XHRcdHNlbmRlck1haWxBZGRyZXNzLFxuXHRcdFx0aW5pdGlhbENoYW5nZWRTdGF0ZTogaW5pdGlhbENoYW5nZWRTdGF0ZSA/PyBudWxsLFxuXHRcdH0pXG5cdH1cblxuXHRhc3luYyBpbml0QXNSZXNwb25zZShhcmdzOiBJbml0QXNSZXNwb25zZUFyZ3MsIGlubGluZUltYWdlczogSW5saW5lSW1hZ2VzKTogUHJvbWlzZTxTZW5kTWFpbE1vZGVsPiB7XG5cdFx0dGhpcy5zdGFydEluaXQoKVxuXG5cdFx0Y29uc3QgeyBwcmV2aW91c01haWwsIGNvbnZlcnNhdGlvblR5cGUsIHNlbmRlck1haWxBZGRyZXNzLCByZWNpcGllbnRzLCBhdHRhY2htZW50cywgc3ViamVjdCwgYm9keVRleHQsIHJlcGx5VG9zIH0gPSBhcmdzXG5cdFx0bGV0IHByZXZpb3VzTWVzc2FnZUlkOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuXHRcdGF3YWl0IHRoaXMuZW50aXR5XG5cdFx0XHQubG9hZChDb252ZXJzYXRpb25FbnRyeVR5cGVSZWYsIHByZXZpb3VzTWFpbC5jb252ZXJzYXRpb25FbnRyeSlcblx0XHRcdC50aGVuKChjZSkgPT4ge1xuXHRcdFx0XHRwcmV2aW91c01lc3NhZ2VJZCA9IGNlLm1lc3NhZ2VJZFxuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChcblx0XHRcdFx0b2ZDbGFzcyhOb3RGb3VuZEVycm9yLCAoZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiY291bGQgbm90IGxvYWQgY29udmVyc2F0aW9uIGVudHJ5XCIsIGUpXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdC8vIGlmIHdlIHJldXNlIHRoZSBzYW1lIGltYWdlIHJlZmVyZW5jZXMsIGNoYW5naW5nIHRoZSBkaXNwbGF5ZWQgbWFpbCBpbiBtYWlsIHZpZXcgd2lsbCBjYXVzZSB0aGUgbWluaW1pemVkIGRyYWZ0IHRvIGxvc2Vcblx0XHQvLyB0aGF0IHJlZmVyZW5jZSwgYmVjYXVzZSBpdCB3aWxsIGJlIHJldm9rZWRcblx0XHR0aGlzLmxvYWRlZElubGluZUltYWdlcyA9IGNsb25lSW5saW5lSW1hZ2VzKGlubGluZUltYWdlcylcblxuXHRcdHJldHVybiB0aGlzLmluaXQoe1xuXHRcdFx0Y29udmVyc2F0aW9uVHlwZSxcblx0XHRcdHN1YmplY3QsXG5cdFx0XHRib2R5VGV4dCxcblx0XHRcdHJlY2lwaWVudHMsXG5cdFx0XHRzZW5kZXJNYWlsQWRkcmVzcyxcblx0XHRcdGNvbmZpZGVudGlhbDogcHJldmlvdXNNYWlsLmNvbmZpZGVudGlhbCxcblx0XHRcdGF0dGFjaG1lbnRzLFxuXHRcdFx0cmVwbHlUb3MsXG5cdFx0XHRwcmV2aW91c01haWwsXG5cdFx0XHRwcmV2aW91c01lc3NhZ2VJZCxcblx0XHRcdGluaXRpYWxDaGFuZ2VkU3RhdGU6IGZhbHNlLFxuXHRcdH0pXG5cdH1cblxuXHRhc3luYyBpbml0V2l0aERyYWZ0KGRyYWZ0OiBNYWlsLCBkcmFmdERldGFpbHM6IE1haWxEZXRhaWxzLCBhdHRhY2htZW50czogVHV0YW5vdGFGaWxlW10sIGlubGluZUltYWdlczogSW5saW5lSW1hZ2VzKTogUHJvbWlzZTxTZW5kTWFpbE1vZGVsPiB7XG5cdFx0dGhpcy5zdGFydEluaXQoKVxuXG5cdFx0bGV0IHByZXZpb3VzTWVzc2FnZUlkOiBzdHJpbmcgfCBudWxsID0gbnVsbFxuXHRcdGxldCBwcmV2aW91c01haWw6IE1haWwgfCBudWxsID0gbnVsbFxuXG5cdFx0Y29uc3QgY29udmVyc2F0aW9uRW50cnkgPSBhd2FpdCB0aGlzLmVudGl0eS5sb2FkKENvbnZlcnNhdGlvbkVudHJ5VHlwZVJlZiwgZHJhZnQuY29udmVyc2F0aW9uRW50cnkpXG5cdFx0Y29uc3QgY29udmVyc2F0aW9uVHlwZSA9IGRvd25jYXN0PENvbnZlcnNhdGlvblR5cGU+KGNvbnZlcnNhdGlvbkVudHJ5LmNvbnZlcnNhdGlvblR5cGUpXG5cblx0XHRpZiAoY29udmVyc2F0aW9uRW50cnkucHJldmlvdXMpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IHByZXZpb3VzRW50cnkgPSBhd2FpdCB0aGlzLmVudGl0eS5sb2FkKENvbnZlcnNhdGlvbkVudHJ5VHlwZVJlZiwgY29udmVyc2F0aW9uRW50cnkucHJldmlvdXMpXG5cdFx0XHRcdHByZXZpb3VzTWVzc2FnZUlkID0gcHJldmlvdXNFbnRyeS5tZXNzYWdlSWRcblx0XHRcdFx0aWYgKHByZXZpb3VzRW50cnkubWFpbCkge1xuXHRcdFx0XHRcdHByZXZpb3VzTWFpbCA9IGF3YWl0IHRoaXMuZW50aXR5LmxvYWQoTWFpbFR5cGVSZWYsIHByZXZpb3VzRW50cnkubWFpbClcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0XHQvLyBpZ25vcmVcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdyBlXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBpZiB3ZSByZXVzZSB0aGUgc2FtZSBpbWFnZSByZWZlcmVuY2VzLCBjaGFuZ2luZyB0aGUgZGlzcGxheWVkIG1haWwgaW4gbWFpbCB2aWV3IHdpbGwgY2F1c2UgdGhlIG1pbmltaXplZCBkcmFmdCB0byBsb3NlXG5cdFx0Ly8gdGhhdCByZWZlcmVuY2UsIGJlY2F1c2UgaXQgd2lsbCBiZSByZXZva2VkXG5cdFx0dGhpcy5sb2FkZWRJbmxpbmVJbWFnZXMgPSBjbG9uZUlubGluZUltYWdlcyhpbmxpbmVJbWFnZXMpXG5cdFx0Y29uc3QgeyBjb25maWRlbnRpYWwsIHNlbmRlciwgc3ViamVjdCB9ID0gZHJhZnRcblx0XHRjb25zdCB7IHRvUmVjaXBpZW50cywgY2NSZWNpcGllbnRzLCBiY2NSZWNpcGllbnRzIH0gPSBkcmFmdERldGFpbHMucmVjaXBpZW50c1xuXHRcdGNvbnN0IHJlY2lwaWVudHM6IFJlY2lwaWVudHMgPSB7XG5cdFx0XHR0bzogdG9SZWNpcGllbnRzLFxuXHRcdFx0Y2M6IGNjUmVjaXBpZW50cyxcblx0XHRcdGJjYzogYmNjUmVjaXBpZW50cyxcblx0XHR9XG5cblx0XHRjb25zdCBib2R5VGV4dCA9IGdldE1haWxCb2R5VGV4dChkcmFmdERldGFpbHMuYm9keSlcblx0XHRyZXR1cm4gdGhpcy5pbml0KHtcblx0XHRcdGNvbnZlcnNhdGlvblR5cGU6IGNvbnZlcnNhdGlvblR5cGUsXG5cdFx0XHRzdWJqZWN0LFxuXHRcdFx0Ym9keVRleHQsXG5cdFx0XHRyZWNpcGllbnRzLFxuXHRcdFx0ZHJhZnQsXG5cdFx0XHRzZW5kZXJNYWlsQWRkcmVzczogc2VuZGVyLmFkZHJlc3MsXG5cdFx0XHRjb25maWRlbnRpYWwsXG5cdFx0XHRhdHRhY2htZW50cyxcblx0XHRcdHJlcGx5VG9zOiBkcmFmdERldGFpbHMucmVwbHlUb3MsXG5cdFx0XHRwcmV2aW91c01haWwsXG5cdFx0XHRwcmV2aW91c01lc3NhZ2VJZCxcblx0XHRcdGluaXRpYWxDaGFuZ2VkU3RhdGU6IGZhbHNlLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHN0YXJ0SW5pdCgpIHtcblx0XHRpZiAodGhpcy5pbml0aWFsaXplZCkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJ0cnlpbmcgdG8gaW5pdGlhbGl6ZSBTZW5kTWFpbE1vZGVsIHR3aWNlXCIpXG5cdFx0fVxuXHRcdHRoaXMuaW5pdGlhbGl6ZWQgPSBkZWZlcigpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGluaXQoe1xuXHRcdGNvbnZlcnNhdGlvblR5cGUsXG5cdFx0c3ViamVjdCxcblx0XHRib2R5VGV4dCxcblx0XHRkcmFmdCxcblx0XHRyZWNpcGllbnRzLFxuXHRcdHNlbmRlck1haWxBZGRyZXNzLFxuXHRcdGNvbmZpZGVudGlhbCxcblx0XHRhdHRhY2htZW50cyxcblx0XHRyZXBseVRvcyxcblx0XHRwcmV2aW91c01haWwsXG5cdFx0cHJldmlvdXNNZXNzYWdlSWQsXG5cdFx0aW5pdGlhbENoYW5nZWRTdGF0ZSxcblx0fTogSW5pdEFyZ3MpOiBQcm9taXNlPFNlbmRNYWlsTW9kZWw+IHtcblx0XHR0aGlzLmNvbnZlcnNhdGlvblR5cGUgPSBjb252ZXJzYXRpb25UeXBlXG5cdFx0dGhpcy5zdWJqZWN0ID0gc3ViamVjdFxuXHRcdHRoaXMuYm9keSA9IGJvZHlUZXh0XG5cdFx0dGhpcy5kcmFmdCA9IGRyYWZ0IHx8IG51bGxcblxuXHRcdGxldCB0bzogUmVjaXBpZW50TGlzdFxuXHRcdGxldCBjYzogUmVjaXBpZW50TGlzdFxuXHRcdGxldCBiY2M6IFJlY2lwaWVudExpc3RcblxuXHRcdGlmIChyZWNpcGllbnRzIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRcdHRvID0gcmVjaXBpZW50c1xuXHRcdFx0Y2MgPSBbXVxuXHRcdFx0YmNjID0gW11cblx0XHR9IGVsc2Uge1xuXHRcdFx0dG8gPSByZWNpcGllbnRzLnRvID8/IFtdXG5cdFx0XHRjYyA9IHJlY2lwaWVudHMuY2MgPz8gW11cblx0XHRcdGJjYyA9IHJlY2lwaWVudHMuYmNjID8/IFtdXG5cdFx0fVxuXG5cdFx0Ly8gV2UgZGVsaWJlcmF0ZWx5IHVzZSAubWFwKCkgYW5kIG5vdCBwcm9taXNlTWFwKCkgaGVyZSBiZWNhdXNlIHdlIHdhbnQgdG8gaW5zZXJ0IGFsbFxuXHRcdC8vIHRoZSByZWNpcGllbnRzIHJpZ2h0IGF3YXksIHdlIGNvdW50IG9uIGl0IGluIHNvbWUgY2hlY2tzIGluIHNlbmQoKSBhbmQgd2UgYWxzbyB3YW50IGFsbCBvZiB0aGVtXG5cdFx0Ly8gdG8gc2hvdyB1cCBpbW1lZGlhdGVseS5cblx0XHQvLyBJZiB3ZSB3YW50IHRvIGxpbWl0IHJlY2lwaWVudCByZXNvbHV0aW9uIGF0IHNvbWUgcG9pbnQgd2UgbmVlZCB0byBidWlsZCBhIHF1ZXVlIGluIHNvbWUgb3RoZXIgcGxhY2UuXG5cdFx0Ly8gTWFraW5nIGl0IExhenlMb2FkZWQoKSB3aWxsIGFsbG93IHVzIHRvIHJldHJ5IGl0IGluIGNhc2UgaXQgZmFpbHMuXG5cdFx0Ly8gSXQgaXMgdmVyeSBpbXBvcnRhbnQgdGhhdCB3ZSBpbnNlcnQgdGhlIHJlY2lwaWVudHMgaGVyZSBzeW5jaHJvbm91c2x5LiBFdmVuIHRob3VnaCBpdCBpcyBpbnNpZGUgdGhlIGFzeW5jIGZ1bmN0aW9uIGl0IHdpbGwgY2FsbCBpbnNlcnRSZWNpcGllbnQoKVxuXHRcdC8vIHJpZ2h0IGF3YXkgd2hlbiB3ZSBjYWxsIGdldEFzeW5jKCkgYmVsb3dcblx0XHR0aGlzLnJlY2lwaWVudHNSZXNvbHZlZCA9IG5ldyBMYXp5TG9hZGVkKGFzeW5jICgpID0+IHtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRcdFx0cmVjaXBpZW50c0ZpbHRlcih0bykubWFwKChyKSA9PiB0aGlzLmluc2VydFJlY2lwaWVudChSZWNpcGllbnRGaWVsZC5UTywgcikpLFxuXHRcdFx0XHRyZWNpcGllbnRzRmlsdGVyKGNjKS5tYXAoKHIpID0+IHRoaXMuaW5zZXJ0UmVjaXBpZW50KFJlY2lwaWVudEZpZWxkLkNDLCByKSksXG5cdFx0XHRcdHJlY2lwaWVudHNGaWx0ZXIoYmNjKS5tYXAoKHIpID0+IHRoaXMuaW5zZXJ0UmVjaXBpZW50KFJlY2lwaWVudEZpZWxkLkJDQywgcikpLFxuXHRcdFx0XSlcblx0XHR9KVxuXHRcdC8vIG5vaW5zcGVjdGlvbiBFUzZNaXNzaW5nQXdhaXRcblx0XHR0aGlzLnJlY2lwaWVudHNSZXNvbHZlZC5nZXRBc3luYygpXG5cblx0XHQvLyAudG9Mb3dlckNhc2UgYmVjYXVzZSBhbGwgb3VyIGFsaWFzZXMgYW5kIGFjY291bnRzIGFyZSBsb3dlcmNhc2VkIG9uIGNyZWF0aW9uXG5cdFx0dGhpcy5zZW5kZXJBZGRyZXNzID0gc2VuZGVyTWFpbEFkZHJlc3M/LnRvTG93ZXJDYXNlKCkgfHwgdGhpcy5nZXREZWZhdWx0U2VuZGVyKClcblx0XHR0aGlzLmNvbmZpZGVudGlhbCA9IGNvbmZpZGVudGlhbCA/PyAhdGhpcy51c2VyKCkucHJvcHMuZGVmYXVsdFVuY29uZmlkZW50aWFsXG5cdFx0dGhpcy5hdHRhY2htZW50cyA9IFtdXG5cblx0XHRpZiAoYXR0YWNobWVudHMpIHtcblx0XHRcdHRoaXMuYXR0YWNoRmlsZXMoYXR0YWNobWVudHMpXG5cdFx0fVxuXG5cdFx0dGhpcy5yZXBseVRvcyA9IHJlY2lwaWVudHNGaWx0ZXIocmVwbHlUb3MgPz8gW10pLm1hcCgocmVjaXBpZW50KSA9PiB0aGlzLnJlY2lwaWVudHNNb2RlbC5yZXNvbHZlKHJlY2lwaWVudCwgUmVzb2x2ZU1vZGUuRWFnZXIpKVxuXHRcdHRoaXMucHJldmlvdXNNYWlsID0gcHJldmlvdXNNYWlsIHx8IG51bGxcblx0XHR0aGlzLnByZXZpb3VzTWVzc2FnZUlkID0gcHJldmlvdXNNZXNzYWdlSWQgfHwgbnVsbFxuXHRcdHRoaXMubWFpbENoYW5nZWRBdCA9IHRoaXMuZGF0ZVByb3ZpZGVyLm5vdygpXG5cblx0XHQvLyBEZXRlcm1pbmUgaWYgd2Ugc2hvdWxkIGhhdmUgdGhpcyBtYWlsIGFscmVhZHkgYmUgZGV0ZWN0ZWQgYXMgbW9kaWZpZWQgc28gaXQgc2F2ZXMuXG5cdFx0aWYgKGluaXRpYWxDaGFuZ2VkU3RhdGUpIHtcblx0XHRcdHRoaXMub25NYWlsQ2hhbmdlZChudWxsKVxuXHRcdFx0dGhpcy5tYWlsU2F2ZWRBdCA9IHRoaXMubWFpbENoYW5nZWRBdCAtIDFcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5tYWlsU2F2ZWRBdCA9IHRoaXMubWFpbENoYW5nZWRBdCArIDFcblx0XHR9XG5cblx0XHRhc3NlcnROb3ROdWxsKHRoaXMuaW5pdGlhbGl6ZWQsIFwic29tZWhvdyBnb3QgdG8gdGhlIGVuZCBvZiBpbml0IHdpdGhvdXQgc3RhcnRJbml0IGNhbGxlZFwiKS5yZXNvbHZlKClcblxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHRwcml2YXRlIGdldERlZmF1bHRTZW5kZXIoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gZ2V0RGVmYXVsdFNlbmRlcih0aGlzLmxvZ2lucywgdGhpcy5tYWlsYm94RGV0YWlscylcblx0fVxuXG5cdGdldFJlY2lwaWVudExpc3QodHlwZTogUmVjaXBpZW50RmllbGQpOiBBcnJheTxSZXNvbHZhYmxlUmVjaXBpZW50PiB7XG5cdFx0cmV0dXJuIGdldEZyb21NYXAodGhpcy5yZWNpcGllbnRzLCB0eXBlLCAoKSA9PiBbXSlcblx0fVxuXG5cdHRvUmVjaXBpZW50cygpOiBBcnJheTxSZXNvbHZhYmxlUmVjaXBpZW50PiB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0UmVjaXBpZW50TGlzdChSZWNpcGllbnRGaWVsZC5UTylcblx0fVxuXG5cdHRvUmVjaXBpZW50c1Jlc29sdmVkKCk6IFByb21pc2U8QXJyYXk8UmVjaXBpZW50Pj4ge1xuXHRcdHJldHVybiBQcm9taXNlLmFsbCh0aGlzLnRvUmVjaXBpZW50cygpLm1hcCgocmVjaXBpZW50KSA9PiByZWNpcGllbnQucmVzb2x2ZWQoKSkpXG5cdH1cblxuXHRjY1JlY2lwaWVudHMoKTogQXJyYXk8UmVzb2x2YWJsZVJlY2lwaWVudD4ge1xuXHRcdHJldHVybiB0aGlzLmdldFJlY2lwaWVudExpc3QoUmVjaXBpZW50RmllbGQuQ0MpXG5cdH1cblxuXHRjY1JlY2lwaWVudHNSZXNvbHZlZCgpOiBQcm9taXNlPEFycmF5PFJlY2lwaWVudD4+IHtcblx0XHRyZXR1cm4gUHJvbWlzZS5hbGwodGhpcy5jY1JlY2lwaWVudHMoKS5tYXAoKHJlY2lwaWVudCkgPT4gcmVjaXBpZW50LnJlc29sdmVkKCkpKVxuXHR9XG5cblx0YmNjUmVjaXBpZW50cygpOiBBcnJheTxSZXNvbHZhYmxlUmVjaXBpZW50PiB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0UmVjaXBpZW50TGlzdChSZWNpcGllbnRGaWVsZC5CQ0MpXG5cdH1cblxuXHRiY2NSZWNpcGllbnRzUmVzb2x2ZWQoKTogUHJvbWlzZTxBcnJheTxSZWNpcGllbnQ+PiB7XG5cdFx0cmV0dXJuIFByb21pc2UuYWxsKHRoaXMuYmNjUmVjaXBpZW50cygpLm1hcCgocmVjaXBpZW50KSA9PiByZWNpcGllbnQucmVzb2x2ZWQoKSkpXG5cdH1cblxuXHRyZXBseVRvc1Jlc29sdmVkKCk6IFByb21pc2U8QXJyYXk8UmVjaXBpZW50Pj4ge1xuXHRcdHJldHVybiBQcm9taXNlLmFsbCh0aGlzLnJlcGx5VG9zLm1hcCgocikgPT4gci5yZXNvbHZlZCgpKSlcblx0fVxuXG5cdC8qKlxuXHQgKiBhZGQgYSByZWNpcGllbnQgdG8gdGhlIHJlY2lwaWVudCBsaXN0IHdpdGhvdXQgdXBkYXRpbmcgdGhlIHNhdmVkIHN0YXRlIG9mIHRoZSBkcmFmdC5cblx0ICogaWYgdGhlIHJlY2lwaWVudCBpcyBhbHJlYWR5IGluc2VydGVkLCBpdCB3aWxsIHdhaXQgZm9yIGl0IHRvIHJlc29sdmUgYmVmb3JlIHJldHVybmluZy5cblx0ICpcblx0ICogQHJldHVybnMgd2hldGhlciB0aGUgbGlzdCB3YXMgYWN0dWFsbHkgY2hhbmdlZC5cblx0ICovXG5cdHByaXZhdGUgYXN5bmMgaW5zZXJ0UmVjaXBpZW50KFxuXHRcdGZpZWxkVHlwZTogUmVjaXBpZW50RmllbGQsXG5cdFx0eyBhZGRyZXNzLCBuYW1lLCB0eXBlLCBjb250YWN0IH06IFBhcnRpYWxSZWNpcGllbnQsXG5cdFx0cmVzb2x2ZU1vZGU6IFJlc29sdmVNb2RlID0gUmVzb2x2ZU1vZGUuRWFnZXIsXG5cdCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGxldCByZWNpcGllbnQgPSBmaW5kUmVjaXBpZW50V2l0aEFkZHJlc3ModGhpcy5nZXRSZWNpcGllbnRMaXN0KGZpZWxkVHlwZSksIGFkZHJlc3MpXG5cdFx0Ly8gT25seSBhZGQgYSByZWNpcGllbnQgaWYgaXQgZG9lc24ndCBleGlzdFxuXHRcdGlmICghcmVjaXBpZW50KSB7XG5cdFx0XHRyZWNpcGllbnQgPSB0aGlzLnJlY2lwaWVudHNNb2RlbC5yZXNvbHZlKFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0YWRkcmVzcyxcblx0XHRcdFx0XHRuYW1lLFxuXHRcdFx0XHRcdHR5cGUsXG5cdFx0XHRcdFx0Y29udGFjdCxcblx0XHRcdFx0fSxcblx0XHRcdFx0cmVzb2x2ZU1vZGUsXG5cdFx0XHQpXG5cblx0XHRcdHRoaXMuZ2V0UmVjaXBpZW50TGlzdChmaWVsZFR5cGUpLnB1c2gocmVjaXBpZW50KVxuXG5cdFx0XHRyZWNpcGllbnQucmVzb2x2ZWQoKS50aGVuKCh7IGFkZHJlc3MsIGNvbnRhY3QgfSkgPT4ge1xuXHRcdFx0XHRpZiAoIXRoaXMucGFzc3dvcmRzLmhhcyhhZGRyZXNzKSAmJiBjb250YWN0ICE9IG51bGwpIHtcblx0XHRcdFx0XHR0aGlzLnNldFBhc3N3b3JkKGFkZHJlc3MsIGNvbnRhY3QucHJlc2hhcmVkUGFzc3dvcmQgPz8gXCJcIilcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBhbHdheXMgbm90aWZ5IGxpc3RlbmVycyBhZnRlciB3ZSBmaW5pc2hlZCByZXNvbHZpbmcgdGhlIHJlY2lwaWVudCwgZXZlbiBpZiBlbWFpbCBpdHNlbGYgZGlkbid0IGNoYW5nZVxuXHRcdFx0XHRcdHRoaXMub25NYWlsQ2hhbmdlZChudWxsKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0YXdhaXQgcmVjaXBpZW50LnJlc29sdmVkKClcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXHRcdGF3YWl0IHJlY2lwaWVudC5yZXNvbHZlZCgpXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHQvKipcblx0ICogQWRkIGEgbmV3IHJlY2lwaWVudCwgdGhpcyBtZXRob2QgcmVzb2x2ZXMgd2hlbiB0aGUgcmVjaXBpZW50IHJlc29sdmVzLlxuXHQgKiB3aWxsIG5vdGlmeSBvZiBhIGNoYW5nZWQgZHJhZnQgc3RhdGUgYWZ0ZXIgdGhlIHJlY2lwaWVudCB3YXMgaW5zZXJ0ZWRcblx0ICovXG5cdGFzeW5jIGFkZFJlY2lwaWVudChmaWVsZFR5cGU6IFJlY2lwaWVudEZpZWxkLCBwYXJ0aWFsUmVjaXBpZW50OiBQYXJ0aWFsUmVjaXBpZW50LCByZXNvbHZlTW9kZTogUmVzb2x2ZU1vZGUgPSBSZXNvbHZlTW9kZS5FYWdlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHdhc0FkZGVkID0gYXdhaXQgdGhpcy5pbnNlcnRSZWNpcGllbnQoZmllbGRUeXBlLCBwYXJ0aWFsUmVjaXBpZW50LCByZXNvbHZlTW9kZSlcblx0XHR0aGlzLm1hcmtBc0NoYW5nZWRJZk5lY2Vzc2FyeSh3YXNBZGRlZClcblx0fVxuXG5cdGdldFJlY2lwaWVudCh0eXBlOiBSZWNpcGllbnRGaWVsZCwgYWRkcmVzczogc3RyaW5nKTogUmVzb2x2YWJsZVJlY2lwaWVudCB8IG51bGwge1xuXHRcdHJldHVybiBmaW5kUmVjaXBpZW50V2l0aEFkZHJlc3ModGhpcy5nZXRSZWNpcGllbnRMaXN0KHR5cGUpLCBhZGRyZXNzKVxuXHR9XG5cblx0cmVtb3ZlUmVjaXBpZW50QnlBZGRyZXNzKGFkZHJlc3M6IHN0cmluZywgdHlwZTogUmVjaXBpZW50RmllbGQsIG5vdGlmeTogYm9vbGVhbiA9IHRydWUpIHtcblx0XHRjb25zdCByZWNpcGllbnQgPSBmaW5kUmVjaXBpZW50V2l0aEFkZHJlc3ModGhpcy5nZXRSZWNpcGllbnRMaXN0KHR5cGUpLCBhZGRyZXNzKVxuXHRcdGlmIChyZWNpcGllbnQpIHtcblx0XHRcdHRoaXMucmVtb3ZlUmVjaXBpZW50KHJlY2lwaWVudCwgdHlwZSwgbm90aWZ5KVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiByZW1vdmUgcmVjaXBpZW50IGZyb20gdGhlIHJlY2lwaWVudCBsaXN0XG5cdCAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgcmVjaXBpZW50IHdhcyByZW1vdmVkXG5cdCAqL1xuXHRyZW1vdmVSZWNpcGllbnQocmVjaXBpZW50OiBSZWNpcGllbnQsIHR5cGU6IFJlY2lwaWVudEZpZWxkLCBub3RpZnk6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgcmVjaXBpZW50cyA9IHRoaXMucmVjaXBpZW50cy5nZXQodHlwZSkgPz8gW11cblx0XHRjb25zdCBjbGVhblJlY2lwaWVudEFkZHJlc3MgPSBjbGVhbk1haWxBZGRyZXNzKHJlY2lwaWVudC5hZGRyZXNzKVxuXHRcdGNvbnN0IGRpZFJlbW92ZSA9IGZpbmRBbmRSZW1vdmUocmVjaXBpZW50cywgKHIpID0+IGNsZWFuTWFpbEFkZHJlc3Moci5hZGRyZXNzKSA9PT0gY2xlYW5SZWNpcGllbnRBZGRyZXNzKVxuXHRcdHRoaXMubWFya0FzQ2hhbmdlZElmTmVjZXNzYXJ5KGRpZFJlbW92ZSlcblxuXHRcdGlmIChkaWRSZW1vdmUgJiYgbm90aWZ5KSB7XG5cdFx0XHR0aGlzLm9uUmVjaXBpZW50RGVsZXRlZCh7XG5cdFx0XHRcdGZpZWxkOiB0eXBlLFxuXHRcdFx0XHRyZWNpcGllbnQsXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdHJldHVybiBkaWRSZW1vdmVcblx0fVxuXG5cdGRpc3Bvc2UoKSB7XG5cdFx0dGhpcy5ldmVudENvbnRyb2xsZXIucmVtb3ZlRW50aXR5TGlzdGVuZXIodGhpcy5lbnRpdHlFdmVudFJlY2VpdmVkKVxuXG5cdFx0cmV2b2tlSW5saW5lSW1hZ2VzKHRoaXMubG9hZGVkSW5saW5lSW1hZ2VzKVxuXHR9XG5cblx0LyoqXG5cdCAqIEB0aHJvd3MgVXNlckVycm9yIGluIHRoZSBjYXNlIHRoYXQgYW55IGZpbGVzIHdlcmUgdG9vIGJpZyB0byBhdHRhY2guIFNtYWxsIGVub3VnaCBmaWxlcyB3aWxsIHN0aWxsIGhhdmUgYmVlbiBhdHRhY2hlZFxuXHQgKi9cblx0Z2V0QXR0YWNobWVudHMoKTogQXJyYXk8QXR0YWNobWVudD4ge1xuXHRcdHJldHVybiB0aGlzLmF0dGFjaG1lbnRzXG5cdH1cblxuXHQvKiogQHRocm93cyBVc2VyRXJyb3IgaW4gY2FzZSBmaWxlcyBhcmUgdG9vIGJpZyB0byBhZGQgKi9cblx0YXR0YWNoRmlsZXMoZmlsZXM6IFJlYWRvbmx5QXJyYXk8QXR0YWNobWVudD4pOiB2b2lkIHtcblx0XHRsZXQgc2l6ZUxlZnQgPSBNQVhfQVRUQUNITUVOVF9TSVpFIC0gdGhpcy5hdHRhY2htZW50cy5yZWR1Y2UoKHRvdGFsLCBmaWxlKSA9PiB0b3RhbCArIE51bWJlcihmaWxlLnNpemUpLCAwKVxuXG5cdFx0Y29uc3Qgc2l6ZUNoZWNrUmVzdWx0ID0gY2hlY2tBdHRhY2htZW50U2l6ZShmaWxlcywgc2l6ZUxlZnQpXG5cblx0XHR0aGlzLmF0dGFjaG1lbnRzLnB1c2goLi4uc2l6ZUNoZWNrUmVzdWx0LmF0dGFjaGFibGVGaWxlcylcblx0XHR0aGlzLm1hcmtBc0NoYW5nZWRJZk5lY2Vzc2FyeShzaXplQ2hlY2tSZXN1bHQuYXR0YWNoYWJsZUZpbGVzLmxlbmd0aCA+IDApXG5cblx0XHRpZiAoc2l6ZUNoZWNrUmVzdWx0LnRvb0JpZ0ZpbGVzLmxlbmd0aCA+IDApIHtcblx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IobGFuZy5tYWtlVHJhbnNsYXRpb24oXCJ0b29CaWdBdHRhY2htZW50X21zZ1wiLCBsYW5nLmdldChcInRvb0JpZ0F0dGFjaG1lbnRfbXNnXCIpICsgXCJcXG5cIiArIHNpemVDaGVja1Jlc3VsdC50b29CaWdGaWxlcy5qb2luKFwiXFxuXCIpKSlcblx0XHR9XG5cdH1cblxuXHRyZW1vdmVBdHRhY2htZW50KGZpbGU6IEF0dGFjaG1lbnQpOiB2b2lkIHtcblx0XHR0aGlzLm1hcmtBc0NoYW5nZWRJZk5lY2Vzc2FyeShyZW1vdmUodGhpcy5hdHRhY2htZW50cywgZmlsZSkpXG5cdH1cblxuXHRnZXRTZW5kZXJOYW1lKCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIGdldFNlbmRlck5hbWUodGhpcy5tYWlsYm94UHJvcGVydGllcywgdGhpcy5zZW5kZXJBZGRyZXNzKSA/PyBcIlwiXG5cdH1cblxuXHRnZXREcmFmdCgpOiBSZWFkb25seTxNYWlsPiB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLmRyYWZ0XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHVwZGF0ZURyYWZ0KGJvZHk6IHN0cmluZywgYXR0YWNobWVudHM6IFJlYWRvbmx5QXJyYXk8QXR0YWNobWVudD4gfCBudWxsLCBkcmFmdDogTWFpbCk6IFByb21pc2U8TWFpbD4ge1xuXHRcdHJldHVybiB0aGlzLm1haWxGYWNhZGVcblx0XHRcdC51cGRhdGVEcmFmdCh7XG5cdFx0XHRcdHN1YmplY3Q6IHRoaXMuZ2V0U3ViamVjdCgpLFxuXHRcdFx0XHRib2R5OiBib2R5LFxuXHRcdFx0XHRzZW5kZXJNYWlsQWRkcmVzczogdGhpcy5zZW5kZXJBZGRyZXNzLFxuXHRcdFx0XHRzZW5kZXJOYW1lOiB0aGlzLmdldFNlbmRlck5hbWUoKSxcblx0XHRcdFx0dG9SZWNpcGllbnRzOiBhd2FpdCB0aGlzLnRvUmVjaXBpZW50c1Jlc29sdmVkKCksXG5cdFx0XHRcdGNjUmVjaXBpZW50czogYXdhaXQgdGhpcy5jY1JlY2lwaWVudHNSZXNvbHZlZCgpLFxuXHRcdFx0XHRiY2NSZWNpcGllbnRzOiBhd2FpdCB0aGlzLmJjY1JlY2lwaWVudHNSZXNvbHZlZCgpLFxuXHRcdFx0XHRhdHRhY2htZW50czogYXR0YWNobWVudHMsXG5cdFx0XHRcdGNvbmZpZGVudGlhbDogdGhpcy5pc0NvbmZpZGVudGlhbCgpLFxuXHRcdFx0XHRkcmFmdDogZHJhZnQsXG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKExvY2tlZEVycm9yLCAoZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwidXBkYXRlRHJhZnQ6IG9wZXJhdGlvbiBpcyBzdGlsbCBhY3RpdmVcIiwgZSlcblx0XHRcdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwib3BlcmF0aW9uU3RpbGxBY3RpdmVfbXNnXCIpXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKE5vdEZvdW5kRXJyb3IsIChlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJkcmFmdCBoYXMgYmVlbiBkZWxldGVkLCBjcmVhdGluZyBuZXcgb25lXCIpXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuY3JlYXRlRHJhZnQoYm9keSwgYXR0YWNobWVudHMsIGRvd25jYXN0KGRyYWZ0Lm1ldGhvZCkpXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBjcmVhdGVEcmFmdChib2R5OiBzdHJpbmcsIGF0dGFjaG1lbnRzOiBSZWFkb25seUFycmF5PEF0dGFjaG1lbnQ+IHwgbnVsbCwgbWFpbE1ldGhvZDogTWFpbE1ldGhvZCk6IFByb21pc2U8TWFpbD4ge1xuXHRcdHJldHVybiB0aGlzLm1haWxGYWNhZGUuY3JlYXRlRHJhZnQoe1xuXHRcdFx0c3ViamVjdDogdGhpcy5nZXRTdWJqZWN0KCksXG5cdFx0XHRib2R5VGV4dDogYm9keSxcblx0XHRcdHNlbmRlck1haWxBZGRyZXNzOiB0aGlzLnNlbmRlckFkZHJlc3MsXG5cdFx0XHRzZW5kZXJOYW1lOiB0aGlzLmdldFNlbmRlck5hbWUoKSxcblx0XHRcdHRvUmVjaXBpZW50czogYXdhaXQgdGhpcy50b1JlY2lwaWVudHNSZXNvbHZlZCgpLFxuXHRcdFx0Y2NSZWNpcGllbnRzOiBhd2FpdCB0aGlzLmNjUmVjaXBpZW50c1Jlc29sdmVkKCksXG5cdFx0XHRiY2NSZWNpcGllbnRzOiBhd2FpdCB0aGlzLmJjY1JlY2lwaWVudHNSZXNvbHZlZCgpLFxuXHRcdFx0Y29udmVyc2F0aW9uVHlwZTogdGhpcy5jb252ZXJzYXRpb25UeXBlLFxuXHRcdFx0cHJldmlvdXNNZXNzYWdlSWQ6IHRoaXMucHJldmlvdXNNZXNzYWdlSWQsXG5cdFx0XHRhdHRhY2htZW50czogYXR0YWNobWVudHMsXG5cdFx0XHRjb25maWRlbnRpYWw6IHRoaXMuaXNDb25maWRlbnRpYWwoKSxcblx0XHRcdHJlcGx5VG9zOiBhd2FpdCB0aGlzLnJlcGx5VG9zUmVzb2x2ZWQoKSxcblx0XHRcdG1ldGhvZDogbWFpbE1ldGhvZCxcblx0XHR9KVxuXHR9XG5cblx0aXNDb25maWRlbnRpYWwoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuY29uZmlkZW50aWFsIHx8ICF0aGlzLmNvbnRhaW5zRXh0ZXJuYWxSZWNpcGllbnRzKClcblx0fVxuXG5cdGlzQ29uZmlkZW50aWFsRXh0ZXJuYWwoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuY29uZmlkZW50aWFsICYmIHRoaXMuY29udGFpbnNFeHRlcm5hbFJlY2lwaWVudHMoKVxuXHR9XG5cblx0c2V0Q29uZmlkZW50aWFsKGNvbmZpZGVudGlhbDogYm9vbGVhbik6IHZvaWQge1xuXHRcdHRoaXMubWFya0FzQ2hhbmdlZElmTmVjZXNzYXJ5KHRoaXMuY29uZmlkZW50aWFsICE9PSBjb25maWRlbnRpYWwpXG5cdFx0dGhpcy5jb25maWRlbnRpYWwgPSBjb25maWRlbnRpYWxcblx0fVxuXG5cdGNvbnRhaW5zRXh0ZXJuYWxSZWNpcGllbnRzKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmFsbFJlY2lwaWVudHMoKS5zb21lKChyKSA9PiByLnR5cGUgPT09IFJlY2lwaWVudFR5cGUuRVhURVJOQUwpXG5cdH1cblxuXHRnZXRFeHRlcm5hbFJlY2lwaWVudHMoKTogQXJyYXk8UmVjaXBpZW50PiB7XG5cdFx0cmV0dXJuIHRoaXMuYWxsUmVjaXBpZW50cygpLmZpbHRlcigocikgPT4gci50eXBlID09PSBSZWNpcGllbnRUeXBlLkVYVEVSTkFMKVxuXHR9XG5cblx0LyoqXG5cdCAqIEByZWplY3Qge1JlY2lwaWVudHNOb3RGb3VuZEVycm9yfVxuXHQgKiBAcmVqZWN0IHtUb29NYW55UmVxdWVzdHNFcnJvcn1cblx0ICogQHJlamVjdCB7QWNjZXNzQmxvY2tlZEVycm9yfVxuXHQgKiBAcmVqZWN0IHtGaWxlTm90Rm91bmRFcnJvcn1cblx0ICogQHJlamVjdCB7UHJlY29uZGl0aW9uRmFpbGVkRXJyb3J9XG5cdCAqIEByZWplY3Qge0xvY2tlZEVycm9yfVxuXHQgKiBAcmVqZWN0IHtVc2VyRXJyb3J9XG5cdCAqIEBwYXJhbSBtYWlsTWV0aG9kXG5cdCAqIEBwYXJhbSBnZXRDb25maXJtYXRpb246IEEgY2FsbGJhY2sgdG8gZ2V0IHVzZXIgY29uZmlybWF0aW9uXG5cdCAqIEBwYXJhbSB3YWl0SGFuZGxlcjogQSBjYWxsYmFjayB0byBhbGxvdyBVSSBibG9ja2luZyB3aGlsZSB0aGUgbWFpbCBpcyBiZWluZyBzZW50LiBpdCBzZWVtcyBsaWtlIHdyYXBwaW5nIHRoZSBzZW5kIGNhbGwgaW4gc2hvd1Byb2dyZXNzRGlhbG9nIGNhdXNlcyB0aGUgY29uZmlybWF0aW9uIGRpYWxvZ3Mgbm90IHRvIGJlIHNob3duLiBXZSBzaG91bGQgZml4IHRoaXMsIGJ1dCB0aGlzIHdvcmtzIGZvciBub3dcblx0ICogQHBhcmFtIHRvb01hbnlSZXF1ZXN0c0Vycm9yXG5cdCAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgc2VuZCB3YXMgY29tcGxldGVkLCBmYWxzZSBpZiBpdCB3YXMgYWJvcnRlZCAoYnkgZ2V0Q29uZmlybWF0aW9uIHJldHVybmluZyBmYWxzZVxuXHQgKi9cblx0YXN5bmMgc2VuZChcblx0XHRtYWlsTWV0aG9kOiBNYWlsTWV0aG9kLFxuXHRcdGdldENvbmZpcm1hdGlvbjogKGFyZzA6IE1heWJlVHJhbnNsYXRpb24pID0+IFByb21pc2U8Ym9vbGVhbj4gPSAoXykgPT4gUHJvbWlzZS5yZXNvbHZlKHRydWUpLFxuXHRcdHdhaXRIYW5kbGVyOiAoYXJnMDogTWF5YmVUcmFuc2xhdGlvbiwgYXJnMTogUHJvbWlzZTxhbnk+KSA9PiBQcm9taXNlPGFueT4gPSAoXywgcCkgPT4gcCxcblx0XHR0b29NYW55UmVxdWVzdHNFcnJvcjogVHJhbnNsYXRpb25LZXkgPSBcInRvb01hbnlNYWlsc19tc2dcIixcblx0KTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Ly8gVG8gYXZvaWQgcGFyYWxsZWwgaW52b2NhdGlvbnMgZG8gbm90IGRvIGFueXRoaW5nIGFzeW5jIGhlcmUgdGhhdCB3b3VsZCBsYXRlciBleGVjdXRlIHRoZSBzZW5kaW5nLlxuXHRcdC8vIEl0IGlzIGZpbmUgdG8gd2FpdCBmb3IgZ2V0Q29uZmlybWF0aW9uKCkgYmVjYXVzZSBpdCBpcyBtb2RhbCBhbmQgd2lsbCBwcmV2ZW50IHRoZSB1c2VyIGZyb20gdHJpZ2dlcmluZyBtdWx0aXBsZSBzZW5kcy5cblx0XHQvLyBJZiB5b3UgbmVlZCB0byBkbyBzb21ldGhpbmcgYXN5bmMgaGVyZSBwdXQgaXQgaW50byBgYXN5bmNTZW5kYFxuXHRcdC8vXG5cdFx0Ly8gWW91IGNhbid0IHJlbHkgb24gcmVzb2x2ZWQgcmVjaXBpZW50cyBoZXJlLCBvbmx5IGFmdGVyIHdhaXRGb3JSZXNvbHZlZFJlY2lwaWVudHMoKSBpbnNpZGUgYXN5bmNTZW5kKCkhXG5cdFx0dGhpcy5vbkJlZm9yZVNlbmQoKVxuXG5cdFx0aWYgKHRoaXMuYWxsUmVjaXBpZW50cygpLmxlbmd0aCA9PT0gMSAmJiB0aGlzLmFsbFJlY2lwaWVudHMoKVswXS5hZGRyZXNzLnRvTG93ZXJDYXNlKCkudHJpbSgpID09PSBcImFwcHJvdmFsQHR1dGFvLmRlXCIpIHtcblx0XHRcdGF3YWl0IHRoaXMuc2VuZEFwcHJvdmFsTWFpbCh0aGlzLmdldEJvZHkoKSlcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMudG9SZWNpcGllbnRzKCkubGVuZ3RoID09PSAwICYmIHRoaXMuY2NSZWNpcGllbnRzKCkubGVuZ3RoID09PSAwICYmIHRoaXMuYmNjUmVjaXBpZW50cygpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihcIm5vUmVjaXBpZW50c19tc2dcIilcblx0XHR9XG5cblx0XHRjb25zdCBudW1WaXNpYmxlUmVjaXBpZW50cyA9IHRoaXMudG9SZWNpcGllbnRzKCkubGVuZ3RoICsgdGhpcy5jY1JlY2lwaWVudHMoKS5sZW5ndGhcblxuXHRcdC8vIE1hbnkgcmVjaXBpZW50cyBpcyBhIHdhcm5pbmdcblx0XHRpZiAobnVtVmlzaWJsZVJlY2lwaWVudHMgPj0gVE9PX01BTllfVklTSUJMRV9SRUNJUElFTlRTICYmICEoYXdhaXQgZ2V0Q29uZmlybWF0aW9uKFwibWFueVJlY2lwaWVudHNfbXNnXCIpKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXG5cdFx0Ly8gRW1wdHkgc3ViamVjdCBpcyBhIHdhcm5pbmdcblx0XHRpZiAodGhpcy5nZXRTdWJqZWN0KCkubGVuZ3RoID09PSAwICYmICEoYXdhaXQgZ2V0Q29uZmlybWF0aW9uKFwibm9TdWJqZWN0X21zZ1wiKSkpIHtcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdH1cblxuXHRcdGNvbnN0IGFzeW5jU2VuZCA9IGFzeW5jICgpID0+IHtcblx0XHRcdC8vIFRoZSBuZXh0IGNoZWNrIGRlcGVuZHMgb24gY29udGFjdHMgYmVpbmcgYXZhaWxhYmxlXG5cdFx0XHQvLyBTbyB3ZSBuZWVkIHRvIHdhaXQgZm9yIG91ciByZWNpcGllbnRzIGhlcmVcblx0XHRcdGNvbnN0IHJlY2lwaWVudHMgPSBhd2FpdCB0aGlzLndhaXRGb3JSZXNvbHZlZFJlY2lwaWVudHMoKVxuXG5cdFx0XHQvLyBObyBwYXNzd29yZCBpbiBleHRlcm5hbCBjb25maWRlbnRpYWwgbWFpbCBpcyBhbiBlcnJvclxuXHRcdFx0aWYgKHRoaXMuaXNDb25maWRlbnRpYWxFeHRlcm5hbCgpICYmIHRoaXMuZ2V0RXh0ZXJuYWxSZWNpcGllbnRzKCkuc29tZSgocikgPT4gIXRoaXMuZ2V0UGFzc3dvcmQoci5hZGRyZXNzKSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihcIm5vUHJlU2hhcmVkUGFzc3dvcmRfbXNnXCIpXG5cdFx0XHR9XG5cblx0XHRcdC8vIFdlYWsgcGFzc3dvcmQgaXMgYSB3YXJuaW5nXG5cdFx0XHRpZiAodGhpcy5pc0NvbmZpZGVudGlhbEV4dGVybmFsKCkgJiYgdGhpcy5oYXNJbnNlY3VyZVBhc3N3b3JkcygpICYmICEoYXdhaXQgZ2V0Q29uZmlybWF0aW9uKFwicHJlc2hhcmVkUGFzc3dvcmROb3RTdHJvbmdFbm91Z2hfbXNnXCIpKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgdGhpcy5zYXZlRHJhZnQodHJ1ZSwgbWFpbE1ldGhvZClcblx0XHRcdGF3YWl0IHRoaXMudXBkYXRlQ29udGFjdHMocmVjaXBpZW50cylcblx0XHRcdGF3YWl0IHRoaXMubWFpbEZhY2FkZS5zZW5kRHJhZnQoYXNzZXJ0Tm90TnVsbCh0aGlzLmRyYWZ0LCBcImRyYWZ0IHdhcyBudWxsP1wiKSwgcmVjaXBpZW50cywgdGhpcy5zZWxlY3RlZE5vdGlmaWNhdGlvbkxhbmd1YWdlKVxuXHRcdFx0YXdhaXQgdGhpcy51cGRhdGVQcmV2aW91c01haWwoKVxuXHRcdFx0YXdhaXQgdGhpcy51cGRhdGVFeHRlcm5hbExhbmd1YWdlKClcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHdhaXRIYW5kbGVyKHRoaXMuaXNDb25maWRlbnRpYWwoKSA/IFwic2VuZGluZ19tc2dcIiA6IFwic2VuZGluZ1VuZW5jcnlwdGVkX21zZ1wiLCBhc3luY1NlbmQoKSlcblx0XHRcdC5jYXRjaChcblx0XHRcdFx0b2ZDbGFzcyhMb2NrZWRFcnJvciwgKCkgPT4ge1xuXHRcdFx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IoXCJvcGVyYXRpb25TdGlsbEFjdGl2ZV9tc2dcIilcblx0XHRcdFx0fSksXG5cdFx0XHQpIC8vIGNhdGNoIGFsbCBvZiB0aGUgYmFkbmVzc1xuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKFJlY2lwaWVudE5vdFJlc29sdmVkRXJyb3IsICgpID0+IHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwidG9vTWFueUF0dGVtcHRzX21zZ1wiKVxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHRcdC5jYXRjaChcblx0XHRcdFx0b2ZDbGFzcyhSZWNpcGllbnRzTm90Rm91bmRFcnJvciwgKGUpID0+IHtcblx0XHRcdFx0XHRpZiAobWFpbE1ldGhvZCA9PT0gTWFpbE1ldGhvZC5JQ0FMX0NBTkNFTCkge1xuXHRcdFx0XHRcdFx0Ly8gaW4gY2FzZSBvZiBjYWxlbmRhciBldmVudCB0ZXJtaW5hdGlvbiB3ZSB3aWxsIHJlbW92ZSBpbnZhbGlkIHJlY2lwaWVudHMgYW5kIHRoZW4gZGVsZXRlIHRoZSBldmVudCB3aXRob3V0IHNlbmRpbmcgdXBkYXRlc1xuXHRcdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRsZXQgaW52YWxpZFJlY2lwaWVudHMgPSBlLm1lc3NhZ2Vcblx0XHRcdFx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IoXG5cdFx0XHRcdFx0XHRcdGxhbmcubWFrZVRyYW5zbGF0aW9uKFxuXHRcdFx0XHRcdFx0XHRcdFwiZXJyb3JfbXNnXCIsXG5cdFx0XHRcdFx0XHRcdFx0bGFuZy5nZXQoXCJ0dXRhbm90YUFkZHJlc3NEb2VzTm90RXhpc3RfbXNnXCIpICsgXCIgXCIgKyBsYW5nLmdldChcImludmFsaWRSZWNpcGllbnRzX21zZ1wiKSArIFwiXFxuXCIgKyBpbnZhbGlkUmVjaXBpZW50cyxcblx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKFRvb01hbnlSZXF1ZXN0c0Vycm9yLCAoKSA9PiB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcih0b29NYW55UmVxdWVzdHNFcnJvcilcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0XHQuY2F0Y2goXG5cdFx0XHRcdG9mQ2xhc3MoQWNjZXNzQmxvY2tlZEVycm9yLCAoZSkgPT4ge1xuXHRcdFx0XHRcdC8vIHNwZWNpYWwgY2FzZTogdGhlIGFwcHJvdmFsIHN0YXR1cyBpcyBzZXQgdG8gU3BhbVNlbmRlciwgYnV0IHRoZSB1cGRhdGUgaGFzIG5vdCBiZWVuIHJlY2VpdmVkIHlldCwgc28gdXNlIFNwYW1TZW5kZXIgYXMgZGVmYXVsdFxuXHRcdFx0XHRcdHJldHVybiBjaGVja0FwcHJvdmFsU3RhdHVzKHRoaXMubG9naW5zLCB0cnVlLCBBcHByb3ZhbFN0YXR1cy5TUEFNX1NFTkRFUikudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcImNvdWxkIG5vdCBzZW5kIG1haWwgKGJsb2NrZWQgYWNjZXNzKVwiLCBlKVxuXHRcdFx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0XHQuY2F0Y2goXG5cdFx0XHRcdG9mQ2xhc3MoRmlsZU5vdEZvdW5kRXJyb3IsICgpID0+IHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwiY291bGROb3RBdHRhY2hGaWxlX21zZ1wiKVxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHRcdC5jYXRjaChcblx0XHRcdFx0b2ZDbGFzcyhQcmVjb25kaXRpb25GYWlsZWRFcnJvciwgKCkgPT4ge1xuXHRcdFx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IoXCJvcGVyYXRpb25TdGlsbEFjdGl2ZV9tc2dcIilcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdH1cblxuXHQvKipcblx0ICogV2hldGhlciBhbnkgb2YgdGhlIGV4dGVybmFsIHJlY2lwaWVudHMgaGF2ZSBhbiBpbnNlY3VyZSBwYXNzd29yZC5cblx0ICogV2UgZG9uJ3QgY29uc2lkZXIgZW1wdHkgcGFzc3dvcmRzLCBiZWNhdXNlIGFuIGVtcHR5IHBhc3N3b3JkIHdpbGwgZGlzYWxsb3cgYW5kIGVuY3J5cHRlZCBlbWFpbCBmcm9tIHNlbmRpbmcsIHdoZXJlYXMgYW4gaW5zZWN1cmUgcGFzc3dvcmRcblx0ICogY2FuIHN0aWxsIGJlIHVzZWRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRoYXNJbnNlY3VyZVBhc3N3b3JkcygpOiBib29sZWFuIHtcblx0XHRjb25zdCBtaW5pbWFsUGFzc3dvcmRTdHJlbmd0aCA9IHRoaXMuYWxsUmVjaXBpZW50cygpXG5cdFx0XHQuZmlsdGVyKChyKSA9PiB0aGlzLmdldFBhc3N3b3JkKHIuYWRkcmVzcykgIT09IFwiXCIpXG5cdFx0XHQucmVkdWNlKChtaW4sIHJlY2lwaWVudCkgPT4gTWF0aC5taW4obWluLCB0aGlzLmdldFBhc3N3b3JkU3RyZW5ndGgocmVjaXBpZW50KSksIFBBU1NXT1JEX01JTl9TRUNVUkVfVkFMVUUpXG5cdFx0cmV0dXJuICFpc1NlY3VyZVBhc3N3b3JkKG1pbmltYWxQYXNzd29yZFN0cmVuZ3RoKVxuXHR9XG5cblx0c2F2ZURyYWZ0KHNhdmVBdHRhY2htZW50czogYm9vbGVhbiwgbWFpbE1ldGhvZDogTWFpbE1ldGhvZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICh0aGlzLmN1cnJlbnRTYXZlUHJvbWlzZSA9PSBudWxsKSB7XG5cdFx0XHR0aGlzLmN1cnJlbnRTYXZlUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuZG9TYXZlRHJhZnQoc2F2ZUF0dGFjaG1lbnRzLCBtYWlsTWV0aG9kKVxuXHRcdFx0XHR9IGZpbmFsbHkge1xuXHRcdFx0XHRcdC8vIElmIHRoZXJlIGlzIGFuIGVycm9yLCB3ZSBzdGlsbCBuZWVkIHRvIHJlc2V0IGN1cnJlbnRTYXZlUHJvbWlzZVxuXHRcdFx0XHRcdHRoaXMuY3VycmVudFNhdmVQcm9taXNlID0gbnVsbFxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0aGlzLmhhc01haWxDaGFuZ2VkKCkgJiYgdGhpcy5kb1NhdmVBZ2Fpbikge1xuXHRcdFx0XHRcdHRoaXMuZG9TYXZlQWdhaW4gPSBmYWxzZVxuXHRcdFx0XHRcdGF3YWl0IHRoaXMuc2F2ZURyYWZ0KHNhdmVBdHRhY2htZW50cywgbWFpbE1ldGhvZClcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5kb1NhdmVBZ2FpbiA9IHRydWVcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5jdXJyZW50U2F2ZVByb21pc2Vcblx0fVxuXG5cdC8qKlxuXHQgKiBTYXZlcyB0aGUgZHJhZnQuXG5cdCAqIEBwYXJhbSBzYXZlQXR0YWNobWVudHMgVHJ1ZSBpZiBhbHNvIHRoZSBhdHRhY2htZW50cyBzaGFsbCBiZSBzYXZlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuXHQgKiBAcGFyYW0gbWFpbE1ldGhvZFxuXHQgKiBAcmV0dXJucyB7UHJvbWlzZX0gV2hlbiBmaW5pc2hlZC5cblx0ICogQHRocm93cyBGaWxlTm90Rm91bmRFcnJvciB3aGVuIG9uZSBvZiB0aGUgYXR0YWNobWVudHMgY291bGQgbm90IGJlIG9wZW5lZFxuXHQgKiBAdGhyb3dzIFByZWNvbmRpdGlvbkZhaWxlZEVycm9yIHdoZW4gdGhlIGRyYWZ0IGlzIGxvY2tlZFxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBkb1NhdmVEcmFmdChzYXZlQXR0YWNobWVudHM6IGJvb2xlYW4sIG1haWxNZXRob2Q6IE1haWxNZXRob2QpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAodGhpcy5pbml0aWFsaXplZCA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcImluaXQgZm9yIFNlbmRNYWlsTW9kZWwgd2FzIG5vdCBjYWxsZWRcIilcblx0XHR9XG5cdFx0YXdhaXQgdGhpcy5pbml0aWFsaXplZFxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBhdHRhY2htZW50cyA9IHNhdmVBdHRhY2htZW50cyA/IHRoaXMuYXR0YWNobWVudHMgOiBudWxsXG5cblx0XHRcdC8vIFdlIGFsc28gd2FudCB0byBjcmVhdGUgbmV3IGRyYWZ0cyBmb3IgZHJhZnRzIGVkaXRlZCBmcm9tIHRyYXNoIG9yIHNwYW0gZm9sZGVyXG5cdFx0XHRjb25zdCB7IGh0bWxTYW5pdGl6ZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL21pc2MvSHRtbFNhbml0aXplci5qc1wiKVxuXHRcdFx0Y29uc3QgdW5zYW5pdGl6ZWRfYm9keSA9IHRoaXMuZ2V0Qm9keSgpXG5cdFx0XHRjb25zdCBib2R5ID0gaHRtbFNhbml0aXplci5zYW5pdGl6ZUhUTUwodW5zYW5pdGl6ZWRfYm9keSwge1xuXHRcdFx0XHQvLyBzdG9yZSB0aGUgZHJhZnQgYWx3YXlzIHdpdGggZXh0ZXJuYWwgbGlua3MgcHJlc2VydmVkLiB0aGlzIHJldmVydHNcblx0XHRcdFx0Ly8gdGhlIGRyYWZ0LXNyYyBhbmQgZHJhZnQtc3Jjc2V0IGF0dHJpYnV0ZSBzdG93LlxuXHRcdFx0XHRibG9ja0V4dGVybmFsQ29udGVudDogZmFsc2UsXG5cdFx0XHRcdC8vIHNpbmNlIHdlJ3JlIG5vdCBkaXNwbGF5aW5nIHRoaXMsIHRoaXMgaXMgZmluZS5cblx0XHRcdFx0YWxsb3dSZWxhdGl2ZUxpbmtzOiB0cnVlLFxuXHRcdFx0XHQvLyBkbyBub3QgdG91Y2ggaW5saW5lIGltYWdlcywgd2UganVzdCB3YW50IHRvIHN0b3JlIHRoaXMuXG5cdFx0XHRcdHVzZVBsYWNlaG9sZGVyRm9ySW5saW5lSW1hZ2VzOiBmYWxzZSxcblx0XHRcdH0pLmh0bWxcblxuXHRcdFx0dGhpcy5kcmFmdCA9XG5cdFx0XHRcdHRoaXMuZHJhZnQgPT0gbnVsbCB8fCAoYXdhaXQgdGhpcy5uZWVkTmV3RHJhZnQodGhpcy5kcmFmdCkpXG5cdFx0XHRcdFx0PyBhd2FpdCB0aGlzLmNyZWF0ZURyYWZ0KGJvZHksIGF0dGFjaG1lbnRzLCBtYWlsTWV0aG9kKVxuXHRcdFx0XHRcdDogYXdhaXQgdGhpcy51cGRhdGVEcmFmdChib2R5LCBhdHRhY2htZW50cywgdGhpcy5kcmFmdClcblxuXHRcdFx0Y29uc3QgYXR0YWNobWVudElkcyA9IGF3YWl0IHRoaXMubWFpbEZhY2FkZS5nZXRBdHRhY2htZW50SWRzKHRoaXMuZHJhZnQpXG5cdFx0XHRjb25zdCBuZXdBdHRhY2htZW50cyA9IGF3YWl0IHByb21pc2VNYXAoYXR0YWNobWVudElkcywgKGZpbGVJZCkgPT4gdGhpcy5lbnRpdHkubG9hZDxUdXRhbm90YUZpbGU+KEZpbGVUeXBlUmVmLCBmaWxlSWQpLCB7XG5cdFx0XHRcdGNvbmN1cnJlbmN5OiA1LFxuXHRcdFx0fSlcblxuXHRcdFx0dGhpcy5hdHRhY2htZW50cyA9IFtdIC8vIGF0dGFjaEZpbGVzIHdpbGwgcHVzaCB0byBleGlzdGluZyBmaWxlcyBidXQgd2Ugd2FudCB0byBvdmVyd3JpdGUgdGhlbVxuXHRcdFx0dGhpcy5hdHRhY2hGaWxlcyhuZXdBdHRhY2htZW50cylcblxuXHRcdFx0Ly8gQWxsb3cgYW55IGNoYW5nZXMgdGhhdCBtaWdodCBvY2N1ciB3aGlsZSB0aGUgbWFpbCBpcyBiZWluZyBzYXZlZCB0byBiZSBhY2NvdW50ZWQgZm9yXG5cdFx0XHQvLyBpZiBzYXZlZCBpcyBjYWxsZWQgYmVmb3JlIHRoaXMgaGFzIGNvbXBsZXRlZFxuXHRcdFx0dGhpcy5tYWlsU2F2ZWRBdCA9IHRoaXMuZGF0ZVByb3ZpZGVyLm5vdygpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBQYXlsb2FkVG9vTGFyZ2VFcnJvcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwicmVxdWVzdFRvb0xhcmdlX21zZ1wiKVxuXHRcdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgTWFpbEJvZHlUb29MYXJnZUVycm9yKSB7XG5cdFx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IoXCJtYWlsQm9keVRvb0xhcmdlX21zZ1wiKVxuXHRcdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgRmlsZU5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihcImNvdWxkTm90QXR0YWNoRmlsZV9tc2dcIilcblx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIFByZWNvbmRpdGlvbkZhaWxlZEVycm9yKSB7XG5cdFx0XHRcdHRocm93IG5ldyBVc2VyRXJyb3IoXCJvcGVyYXRpb25TdGlsbEFjdGl2ZV9tc2dcIilcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IGVcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHNlbmRBcHByb3ZhbE1haWwoYm9keTogc3RyaW5nKTogUHJvbWlzZTx1bmtub3duPiB7XG5cdFx0Y29uc3QgbGlzdElkID0gXCItLS0tLS0tLS1jLS1cIlxuXHRcdGNvbnN0IG0gPSBjcmVhdGVBcHByb3ZhbE1haWwoe1xuXHRcdFx0X2lkOiBbbGlzdElkLCBzdHJpbmdUb0N1c3RvbUlkKHRoaXMuc2VuZGVyQWRkcmVzcyldLFxuXHRcdFx0X293bmVyR3JvdXA6IHRoaXMudXNlcigpLnVzZXIudXNlckdyb3VwLmdyb3VwLFxuXHRcdFx0dGV4dDogYFN1YmplY3Q6ICR7dGhpcy5nZXRTdWJqZWN0KCl9PGJyPiR7Ym9keX1gLFxuXHRcdFx0ZGF0ZTogbnVsbCxcblx0XHRcdHJhbmdlOiBudWxsLFxuXHRcdFx0Y3VzdG9tZXI6IG51bGwsXG5cdFx0fSlcblx0XHRyZXR1cm4gdGhpcy5lbnRpdHkuc2V0dXAobGlzdElkLCBtKS5jYXRjaChvZkNsYXNzKE5vdEF1dGhvcml6ZWRFcnJvciwgKGUpID0+IGNvbnNvbGUubG9nKFwibm90IGF1dGhvcml6ZWQgZm9yIGFwcHJvdmFsIG1lc3NhZ2VcIikpKVxuXHR9XG5cblx0Z2V0QXZhaWxhYmxlTm90aWZpY2F0aW9uVGVtcGxhdGVMYW5ndWFnZXMoKTogQXJyYXk8TGFuZ3VhZ2U+IHtcblx0XHRyZXR1cm4gdGhpcy5hdmFpbGFibGVOb3RpZmljYXRpb25UZW1wbGF0ZUxhbmd1YWdlc1xuXHR9XG5cblx0Z2V0U2VsZWN0ZWROb3RpZmljYXRpb25MYW5ndWFnZUNvZGUoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy5zZWxlY3RlZE5vdGlmaWNhdGlvbkxhbmd1YWdlXG5cdH1cblxuXHRzZXRTZWxlY3RlZE5vdGlmaWNhdGlvbkxhbmd1YWdlQ29kZShjb2RlOiBzdHJpbmcpIHtcblx0XHR0aGlzLm1hcmtBc0NoYW5nZWRJZk5lY2Vzc2FyeSh0aGlzLnNlbGVjdGVkTm90aWZpY2F0aW9uTGFuZ3VhZ2UgIT09IGNvZGUpXG5cdFx0dGhpcy5zZWxlY3RlZE5vdGlmaWNhdGlvbkxhbmd1YWdlID0gY29kZVxuXHRcdHRoaXMubWFya0FzQ2hhbmdlZElmTmVjZXNzYXJ5KHRydWUpXG5cdH1cblxuXHRwcml2YXRlIHVwZGF0ZUV4dGVybmFsTGFuZ3VhZ2UoKSB7XG5cdFx0bGV0IHByb3BzID0gdGhpcy51c2VyKCkucHJvcHNcblxuXHRcdGlmIChwcm9wcy5ub3RpZmljYXRpb25NYWlsTGFuZ3VhZ2UgIT09IHRoaXMuc2VsZWN0ZWROb3RpZmljYXRpb25MYW5ndWFnZSkge1xuXHRcdFx0cHJvcHMubm90aWZpY2F0aW9uTWFpbExhbmd1YWdlID0gdGhpcy5zZWxlY3RlZE5vdGlmaWNhdGlvbkxhbmd1YWdlXG5cblx0XHRcdHRoaXMuZW50aXR5LnVwZGF0ZShwcm9wcylcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHVwZGF0ZVByZXZpb3VzTWFpbCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAodGhpcy5wcmV2aW91c01haWwpIHtcblx0XHRcdGlmICh0aGlzLnByZXZpb3VzTWFpbC5yZXBseVR5cGUgPT09IFJlcGx5VHlwZS5OT05FICYmIHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PT0gQ29udmVyc2F0aW9uVHlwZS5SRVBMWSkge1xuXHRcdFx0XHR0aGlzLnByZXZpb3VzTWFpbC5yZXBseVR5cGUgPSBSZXBseVR5cGUuUkVQTFlcblx0XHRcdH0gZWxzZSBpZiAodGhpcy5wcmV2aW91c01haWwucmVwbHlUeXBlID09PSBSZXBseVR5cGUuTk9ORSAmJiB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT09IENvbnZlcnNhdGlvblR5cGUuRk9SV0FSRCkge1xuXHRcdFx0XHR0aGlzLnByZXZpb3VzTWFpbC5yZXBseVR5cGUgPSBSZXBseVR5cGUuRk9SV0FSRFxuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnByZXZpb3VzTWFpbC5yZXBseVR5cGUgPT09IFJlcGx5VHlwZS5GT1JXQVJEICYmIHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PT0gQ29udmVyc2F0aW9uVHlwZS5SRVBMWSkge1xuXHRcdFx0XHR0aGlzLnByZXZpb3VzTWFpbC5yZXBseVR5cGUgPSBSZXBseVR5cGUuUkVQTFlfRk9SV0FSRFxuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnByZXZpb3VzTWFpbC5yZXBseVR5cGUgPT09IFJlcGx5VHlwZS5SRVBMWSAmJiB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT09IENvbnZlcnNhdGlvblR5cGUuRk9SV0FSRCkge1xuXHRcdFx0XHR0aGlzLnByZXZpb3VzTWFpbC5yZXBseVR5cGUgPSBSZXBseVR5cGUuUkVQTFlfRk9SV0FSRFxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0aGlzLmVudGl0eS51cGRhdGUodGhpcy5wcmV2aW91c01haWwpLmNhdGNoKG9mQ2xhc3MoTm90Rm91bmRFcnJvciwgbm9PcCkpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBJZiBjb250YWN0cyBoYXZlIGhhZCB0aGVpciBwYXNzd29yZHMgY2hhbmdlZCwgd2UgdXBkYXRlIHRoZW0gYmVmb3JlIHNlbmRpbmdcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgdXBkYXRlQ29udGFjdHMocmVzb2x2ZWRSZWNpcGllbnRzOiBSZWNpcGllbnRbXSk6IFByb21pc2U8YW55PiB7XG5cdFx0Zm9yIChjb25zdCB7IGFkZHJlc3MsIGNvbnRhY3QsIHR5cGUgfSBvZiByZXNvbHZlZFJlY2lwaWVudHMpIHtcblx0XHRcdGlmIChjb250YWN0ID09IG51bGwpIHtcblx0XHRcdFx0Y29udGludWVcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgaXNFeHRlcm5hbEFuZENvbmZpZGVudGlhbCA9IHR5cGUgPT09IFJlY2lwaWVudFR5cGUuRVhURVJOQUwgJiYgdGhpcy5pc0NvbmZpZGVudGlhbCgpXG5cblx0XHRcdGlmICghY29udGFjdC5faWQgJiYgKCF0aGlzLnVzZXIoKS5wcm9wcy5ub0F1dG9tYXRpY0NvbnRhY3RzIHx8IGlzRXh0ZXJuYWxBbmRDb25maWRlbnRpYWwpKSB7XG5cdFx0XHRcdGlmIChpc0V4dGVybmFsQW5kQ29uZmlkZW50aWFsKSB7XG5cdFx0XHRcdFx0Y29udGFjdC5wcmVzaGFyZWRQYXNzd29yZCA9IHRoaXMuZ2V0UGFzc3dvcmQoYWRkcmVzcykudHJpbSgpXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBsaXN0SWQgPSBhd2FpdCB0aGlzLmNvbnRhY3RNb2RlbC5nZXRDb250YWN0TGlzdElkKClcblx0XHRcdFx0YXdhaXQgdGhpcy5lbnRpdHkuc2V0dXAobGlzdElkLCBjb250YWN0KVxuXHRcdFx0fSBlbHNlIGlmIChjb250YWN0Ll9pZCAmJiBpc0V4dGVybmFsQW5kQ29uZmlkZW50aWFsICYmIGNvbnRhY3QucHJlc2hhcmVkUGFzc3dvcmQgIT09IHRoaXMuZ2V0UGFzc3dvcmQoYWRkcmVzcykudHJpbSgpKSB7XG5cdFx0XHRcdGNvbnRhY3QucHJlc2hhcmVkUGFzc3dvcmQgPSB0aGlzLmdldFBhc3N3b3JkKGFkZHJlc3MpLnRyaW0oKVxuXHRcdFx0XHRhd2FpdCB0aGlzLmVudGl0eS51cGRhdGUoY29udGFjdClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRhbGxSZWNpcGllbnRzKCk6IFJlYWRvbmx5QXJyYXk8UmVzb2x2YWJsZVJlY2lwaWVudD4ge1xuXHRcdHJldHVybiB0aGlzLnRvUmVjaXBpZW50cygpLmNvbmNhdCh0aGlzLmNjUmVjaXBpZW50cygpKS5jb25jYXQodGhpcy5iY2NSZWNpcGllbnRzKCkpXG5cdH1cblxuXHQvKipcblx0ICogTWFrZXMgc3VyZSB0aGUgcmVjaXBpZW50IHR5cGUgYW5kIGNvbnRhY3QgYXJlIHJlc29sdmVkLlxuXHQgKi9cblx0YXN5bmMgd2FpdEZvclJlc29sdmVkUmVjaXBpZW50cygpOiBQcm9taXNlPFJlY2lwaWVudFtdPiB7XG5cdFx0YXdhaXQgdGhpcy5yZWNpcGllbnRzUmVzb2x2ZWQuZ2V0QXN5bmMoKVxuXHRcdHJldHVybiBQcm9taXNlLmFsbCh0aGlzLmFsbFJlY2lwaWVudHMoKS5tYXAoKHJlY2lwaWVudCkgPT4gcmVjaXBpZW50LnJlc29sdmVkKCkpKS5jYXRjaChcblx0XHRcdG9mQ2xhc3MoVG9vTWFueVJlcXVlc3RzRXJyb3IsICgpID0+IHtcblx0XHRcdFx0dGhyb3cgbmV3IFJlY2lwaWVudE5vdFJlc29sdmVkRXJyb3IoXCJcIilcblx0XHRcdH0pLFxuXHRcdClcblx0fVxuXG5cdGFzeW5jIGhhbmRsZUVudGl0eUV2ZW50KHVwZGF0ZTogRW50aXR5VXBkYXRlRGF0YSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHsgb3BlcmF0aW9uLCBpbnN0YW5jZUlkLCBpbnN0YW5jZUxpc3RJZCB9ID0gdXBkYXRlXG5cdFx0bGV0IGNvbnRhY3RJZDogSWRUdXBsZSA9IFtuZXZlck51bGwoaW5zdGFuY2VMaXN0SWQpLCBpbnN0YW5jZUlkXVxuXHRcdGxldCBjaGFuZ2VkID0gZmFsc2VcblxuXHRcdGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoQ29udGFjdFR5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdGF3YWl0IHRoaXMucmVjaXBpZW50c1Jlc29sdmVkLmdldEFzeW5jKClcblxuXHRcdFx0aWYgKG9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5VUERBVEUpIHtcblx0XHRcdFx0dGhpcy5lbnRpdHkubG9hZChDb250YWN0VHlwZVJlZiwgY29udGFjdElkKS50aGVuKChjb250YWN0KSA9PiB7XG5cdFx0XHRcdFx0Zm9yIChjb25zdCBmaWVsZFR5cGUgb2YgdHlwZWRWYWx1ZXMoUmVjaXBpZW50RmllbGQpKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBtYXRjaGluZyA9IHRoaXMuZ2V0UmVjaXBpZW50TGlzdChmaWVsZFR5cGUpLmZpbHRlcihcblx0XHRcdFx0XHRcdFx0KHJlY2lwaWVudCkgPT4gcmVjaXBpZW50LmNvbnRhY3QgJiYgaXNTYW1lSWQocmVjaXBpZW50LmNvbnRhY3QuX2lkLCBjb250YWN0Ll9pZCksXG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHJlY2lwaWVudCBvZiBtYXRjaGluZykge1xuXHRcdFx0XHRcdFx0XHQvLyBpZiB0aGUgbWFpbCBhZGRyZXNzIG5vIGxvbmdlciBleGlzdHMgb24gdGhlIGNvbnRhY3QgdGhlbiBkZWxldGUgdGhlIHJlY2lwaWVudFxuXHRcdFx0XHRcdFx0XHRpZiAoIWNvbnRhY3QubWFpbEFkZHJlc3Nlcy5zb21lKChtYSkgPT4gY2xlYW5NYXRjaChtYS5hZGRyZXNzLCByZWNpcGllbnQuYWRkcmVzcykpKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y2hhbmdlZCA9IGNoYW5nZWQgfHwgdGhpcy5yZW1vdmVSZWNpcGllbnQocmVjaXBpZW50LCBmaWVsZFR5cGUsIHRydWUpXG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gZWxzZSBqdXN0IG1vZGlmeSB0aGUgcmVjaXBpZW50XG5cdFx0XHRcdFx0XHRcdFx0cmVjaXBpZW50LnNldE5hbWUoZ2V0Q29udGFjdERpc3BsYXlOYW1lKGNvbnRhY3QpKVxuXHRcdFx0XHRcdFx0XHRcdHJlY2lwaWVudC5zZXRDb250YWN0KGNvbnRhY3QpXG5cdFx0XHRcdFx0XHRcdFx0Y2hhbmdlZCA9IHRydWVcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLkRFTEVURSkge1xuXHRcdFx0XHRmb3IgKGNvbnN0IGZpZWxkVHlwZSBvZiB0eXBlZFZhbHVlcyhSZWNpcGllbnRGaWVsZCkpIHtcblx0XHRcdFx0XHRjb25zdCByZWNpcGllbnRzID0gdGhpcy5nZXRSZWNpcGllbnRMaXN0KGZpZWxkVHlwZSlcblxuXHRcdFx0XHRcdGNvbnN0IHRvRGVsZXRlID0gcmVjaXBpZW50cy5maWx0ZXIoKHJlY2lwaWVudCkgPT4gKHJlY2lwaWVudC5jb250YWN0ICYmIGlzU2FtZUlkKHJlY2lwaWVudC5jb250YWN0Ll9pZCwgY29udGFjdElkKSkgfHwgZmFsc2UpXG5cblx0XHRcdFx0XHRmb3IgKGNvbnN0IHIgb2YgdG9EZWxldGUpIHtcblx0XHRcdFx0XHRcdGNoYW5nZWQgPSBjaGFuZ2VkIHx8IHRoaXMucmVtb3ZlUmVjaXBpZW50KHIsIGZpZWxkVHlwZSwgdHJ1ZSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy5tYXJrQXNDaGFuZ2VkSWZOZWNlc3NhcnkodHJ1ZSlcblx0XHR9IGVsc2UgaWYgKGlzVXBkYXRlRm9yVHlwZVJlZihDdXN0b21lclByb3BlcnRpZXNUeXBlUmVmLCB1cGRhdGUpKSB7XG5cdFx0XHR0aGlzLnVwZGF0ZUF2YWlsYWJsZU5vdGlmaWNhdGlvblRlbXBsYXRlTGFuZ3VhZ2VzKClcblx0XHR9IGVsc2UgaWYgKGlzVXBkYXRlRm9yVHlwZVJlZihNYWlsYm94UHJvcGVydGllc1R5cGVSZWYsIHVwZGF0ZSkgJiYgb3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLlVQREFURSkge1xuXHRcdFx0dGhpcy5tYWlsYm94UHJvcGVydGllcyA9IGF3YWl0IHRoaXMuZW50aXR5LmxvYWQoTWFpbGJveFByb3BlcnRpZXNUeXBlUmVmLCB1cGRhdGUuaW5zdGFuY2VJZClcblx0XHR9XG5cdFx0dGhpcy5tYXJrQXNDaGFuZ2VkSWZOZWNlc3NhcnkoY2hhbmdlZClcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcblx0fVxuXG5cdHNldE9uQmVmb3JlU2VuZEZ1bmN0aW9uKGZ1bjogKCkgPT4gdW5rbm93bikge1xuXHRcdHRoaXMub25CZWZvcmVTZW5kID0gZnVuXG5cdH1cblxuXHRpc1VzZXJQcmV2aW91c1NlbmRlcigpOiBib29sZWFuIHtcblx0XHRpZiAoIXRoaXMucHJldmlvdXNNYWlsKSByZXR1cm4gZmFsc2VcblxuXHRcdHJldHVybiBpc1VzZXJFbWFpbCh0aGlzLmxvZ2lucywgdGhpcy5tYWlsYm94RGV0YWlscywgdGhpcy5wcmV2aW91c01haWwuc2VuZGVyLmFkZHJlc3MpXG5cdH1cbn1cblxuLyoqXG4gKiBkZWR1cGxpY2F0ZSBhIGxpc3Qgb2YgcmVjaXBpZW50cyBmb3IgaW5zZXJ0aW9uIGluIGFueSBvZiB0aGUgcmVjaXBpZW50IGZpZWxkc1xuICogcmVjaXBpZW50cyBhcmUgY29uc2lkZXJlZCBlcXVhbCB3aGVuIHRoZWlyIGNsZWFuTWFpbEFkZHJlc3MoKSBpcyB0aGUgc2FtZVxuICogcmV0dXJucyB0aGUgcmVjaXBpZW50cyB3aXRoIHRoZWlyIG9yaWdpbmFsIG1haWwgYWRkcmVzc1xuICpcbiAqIHVuaGFuZGxlZCBlZGdlIGNhc2U6IGl0J3MgcG9zc2libGUgdG8gbG9zZSByZWNpcGllbnRzIHRoYXQgc2hvdWxkIGJlIGtlcHQgd2hlblxuICogKiB0aGUgbWFpbCBjb250YWlucyBzZXZlcmFsIHJlY2lwaWVudHMgdGhhdCBoYXZlIHRoZSBzYW1lIGNsZWFuIGFkZHJlc3MgKEJvYkBlLmRlIGFuZCBib2JAZS5kZSlcbiAqICogdGhlIGUuZGUgbWFpbCBzZXJ2ZXIgY29uc2lkZXJzIHRoZXNlIGRpc3RpbmN0XG4gKiAqIHdlIGhpdCBcInJlcGx5IGFsbFwiXG4gKlxuICovXG5mdW5jdGlvbiByZWNpcGllbnRzRmlsdGVyKHJlY2lwaWVudExpc3Q6IFJlYWRvbmx5QXJyYXk8UGFydGlhbFJlY2lwaWVudD4pOiBBcnJheTxQYXJ0aWFsUmVjaXBpZW50PiB7XG5cdC8vIHdlIHBhY2sgZWFjaCByZWNpcGllbnQgYWxvbmcgd2l0aCBpdHMgY2xlYW5lZCBhZGRyZXNzLCBkZWR1cGxpY2F0ZSB0aGUgYXJyYXkgYnkgY29tcGFyaW5nIGNsZWFuZWQgYW5kIHRoZW4gdW5wYWNrIHRoZSBvcmlnaW5hbCByZWNpcGllbnRcblx0Ly8gdGhpcyBwcmV2ZW50cyB1cyBmcm9tIGNoYW5naW5nIHRoZSB2YWx1ZXMgY29udGFpbmVkIGluIHRoZSBhcnJheSBhbmQgc3RpbGwga2VlcHMgdGhlIGNsZWFuQWRkcmVzcyBjYWxscyBvdXQgb2YgdGhlIG5eMiBsb29wXG5cdGNvbnN0IGNsZWFuZWRMaXN0ID0gcmVjaXBpZW50TGlzdC5maWx0ZXIoKHIpID0+IGlzTWFpbEFkZHJlc3Moci5hZGRyZXNzLCBmYWxzZSkpLm1hcCgoYSkgPT4gKHsgcmVjaXBpZW50OiBhLCBjbGVhbmVkOiBjbGVhbk1haWxBZGRyZXNzKGEuYWRkcmVzcykgfSkpXG5cdHJldHVybiBkZWR1cGxpY2F0ZShjbGVhbmVkTGlzdCwgKGEsIGIpID0+IGEuY2xlYW5lZCA9PT0gYi5jbGVhbmVkKS5tYXAoKGEpID0+IGEucmVjaXBpZW50KVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMEVBLGtCQUFrQjtNQUVMLDhCQUE4QjtJQWlDOUIsZ0JBQU4sTUFBb0I7Q0FDMUIsQUFBUSxjQUEyQztDQUNuRCxnQkFBOEIsMkJBQU8sS0FBSztDQUMxQyxxQkFBcUYsMkJBQU8sS0FBSztDQUNqRyxlQUEyQjtDQUMzQixxQkFBbUMsSUFBSTtDQUd2QyxRQUFxQjtDQUNyQixBQUFRLG1CQUFxQyxpQkFBaUI7Q0FDOUQsQUFBUSxVQUFrQjtDQUMxQixBQUFRLE9BQWU7Q0FDdkIsQUFBUSxhQUE4RCxJQUFJO0NBQzFFLEFBQVE7Q0FDUixBQUFRO0NBR1IsQUFBUSxjQUFpQyxDQUFFO0NBRTNDLEFBQVEsV0FBdUMsQ0FBRTtDQUdqRCxBQUFRLG9CQUErQjtDQUV2QyxBQUFRLGVBQTRCO0NBQ3BDLEFBQVE7Q0FDUixBQUFRLHlDQUEwRCxDQUFFO0NBQ3BFLEFBQVEsZ0JBQXdCO0NBQ2hDLEFBQVEsY0FBc0I7Q0FDOUIsQUFBUSxZQUFpQyxJQUFJO0NBRzdDLEFBQVEscUJBQTJDO0NBR25ELEFBQVEsY0FBdUI7Q0FDL0IsQUFBUSxxQkFBcUIsSUFBSSxXQUFpQixZQUFZLENBQUU7Ozs7Q0FLaEUsWUFDaUJBLFlBQ0FDLFFBQ0FDLFFBQ0FDLGNBQ0FDLGNBQ0NDLGlCQUNEQyxnQkFDQ0MsaUJBQ0FDLGNBQ1RDLG1CQUNTQyxjQUNoQjtFQXM2QkYsS0FqN0JpQjtFQWk3QmhCLEtBaDdCZ0I7RUFnN0JmLEtBLzZCZTtFQSs2QmQsS0E5NkJjO0VBODZCYixLQTc2QmE7RUE2NkJaLEtBNTZCYTtFQTQ2QlosS0EzNkJXO0VBMjZCVixLQTE2Qlc7RUEwNkJWLEtBejZCVTtFQXk2QlQsS0F4NkJBO0VBdzZCQyxLQXY2QlE7RUFFakIsTUFBTSxZQUFZLE9BQU8sbUJBQW1CLENBQUM7QUFDN0MsT0FBSyxnQkFBZ0IsS0FBSyxrQkFBa0I7QUFDNUMsT0FBSyxnQkFBZ0IsVUFBVTtBQUUvQixPQUFLLCtCQUErQix5QkFBeUIsVUFBVSw0QkFBNEIsS0FBSyxLQUFLO0FBQzdHLE9BQUssOENBQThDO0FBRW5ELE9BQUssZ0JBQWdCLGtCQUFrQixLQUFLLG9CQUFvQjtDQUNoRTtDQUVELEFBQWlCLHNCQUFzQixPQUFPQyxZQUE2QztBQUMxRixPQUFLLE1BQU0sVUFBVSxRQUNwQixPQUFNLEtBQUssa0JBQWtCLE9BQU87Q0FFckM7Ozs7OztDQU9ELE1BQWMsK0NBQThEO0FBQzNFLE9BQUsseUNBQXlDLFVBQVUsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sS0FBSyxJQUFJLEVBQUUsT0FBTyxDQUFDLGNBQWMsS0FBSyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7RUFDcEksTUFBTSxvQkFBb0IsTUFBTSxxQkFBcUIsS0FBSyx3Q0FBd0MsS0FBSyxRQUFRLEtBQUssT0FBTztBQUMzSCxNQUFJLGtCQUFrQixTQUFTLEdBQUc7R0FDakMsTUFBTSxnQkFBZ0Isa0JBQWtCLElBQUksQ0FBQ0MsTUFBZ0IsRUFBRSxLQUFLO0FBQ3BFLFFBQUssK0JBQ0osMkJBQTJCLEtBQUssT0FBTyxtQkFBbUIsQ0FBQyxNQUFNLDRCQUE0QixLQUFLLE1BQU0sY0FBYyxJQUFJLGNBQWM7QUFDekksUUFBSyx5Q0FBeUM7RUFDOUM7Q0FDRDtDQUVELE9BQXVCO0FBQ3RCLFNBQU8sS0FBSyxPQUFPLG1CQUFtQjtDQUN0QztDQUVELGtCQUEyQjtBQUMxQixVQUFRLEtBQUssZUFBZSxVQUFVO0NBQ3RDO0NBRUQsa0JBQStCO0FBQzlCLFNBQU8sS0FBSztDQUNaO0NBRUQsc0JBQXdDO0FBQ3ZDLFNBQU8sS0FBSztDQUNaO0NBRUQsWUFBWUMsYUFBcUJDLFVBQWtCO0FBQ2xELE9BQUssY0FBYyxLQUFLO0FBQ3hCLE9BQUssVUFBVSxJQUFJLGFBQWEsU0FBUztDQUN6QztDQUVELFlBQVlELGFBQTZCO0FBQ3hDLFNBQU8sS0FBSyxVQUFVLElBQUksWUFBWSxJQUFJO0NBQzFDO0NBRUQsYUFBcUI7QUFDcEIsU0FBTyxLQUFLO0NBQ1o7Q0FFRCxXQUFXRSxTQUFpQjtBQUMzQixPQUFLLHlCQUF5QixZQUFZLEtBQUssUUFBUTtBQUN2RCxPQUFLLFVBQVU7Q0FDZjtDQUVELFVBQWtCO0FBQ2pCLFNBQU8sS0FBSztDQUNaO0NBRUQsUUFBUUMsTUFBYztBQUNyQixPQUFLLHlCQUF5QixLQUFLLFNBQVMsS0FBSztBQUNqRCxPQUFLLE9BQU87Q0FDWjs7Ozs7Q0FNRCxVQUFVQyxlQUF1QjtBQUVoQyxrQkFBZ0IsaUJBQWlCLGNBQWM7QUFDL0MsT0FBSyx5QkFBeUIsS0FBSyxrQkFBa0IsY0FBYztBQUNuRSxPQUFLLGdCQUFnQjtDQUNyQjtDQUVELFlBQW9CO0FBQ25CLFNBQU8sS0FBSztDQUNaOzs7OztDQU1ELG9CQUFvQkMsV0FBcUM7QUFDeEQsU0FBTywyQkFBMkIsS0FBSyxZQUFZLFVBQVUsUUFBUSxFQUFFLFdBQVcsS0FBSyxnQkFBZ0IsS0FBSyxPQUFPO0NBQ25IO0NBRUQsaUJBQTBCO0FBQ3pCLFNBQU8sS0FBSyxnQkFBZ0IsS0FBSztDQUNqQzs7Ozs7Q0FNRCx5QkFBeUJDLFlBQXFCO0FBQzdDLE9BQUssV0FBWTtBQUNqQixPQUFLLGdCQUFnQixLQUFLLGFBQWEsS0FBSztBQUU1QyxPQUFLLGNBQWMsS0FBSztDQUN4Qjs7Ozs7Ozs7Ozs7O0NBYUQsaUJBQ0NDLFlBQ0FMLFNBQ0FNLFVBQ0FDLGFBQ0FDLGNBQ0FDLG1CQUNBQyxxQkFDeUI7QUFDekIsT0FBSyxXQUFXO0FBQ2hCLFNBQU8sS0FBSyxLQUFLO0dBQ2hCLGtCQUFrQixpQkFBaUI7R0FDbkM7R0FDQTtHQUNBO0dBQ0E7R0FDQSxjQUFjLGdCQUFnQjtHQUM5QjtHQUNBLHFCQUFxQix1QkFBdUI7RUFDNUMsRUFBQztDQUNGO0NBRUQsTUFBTSxlQUFlQyxNQUEwQkMsY0FBb0Q7QUFDbEcsT0FBSyxXQUFXO0VBRWhCLE1BQU0sRUFBRSxjQUFjLGtCQUFrQixtQkFBbUIsWUFBWSxhQUFhLFNBQVMsVUFBVSxVQUFVLEdBQUc7RUFDcEgsSUFBSUMsb0JBQW1DO0FBQ3ZDLFFBQU0sS0FBSyxPQUNULEtBQUssMEJBQTBCLGFBQWEsa0JBQWtCLENBQzlELEtBQUssQ0FBQyxPQUFPO0FBQ2IsdUJBQW9CLEdBQUc7RUFDdkIsRUFBQyxDQUNELE1BQ0EsUUFBUSxlQUFlLENBQUMsTUFBTTtBQUM3QixXQUFRLElBQUkscUNBQXFDLEVBQUU7RUFDbkQsRUFBQyxDQUNGO0FBR0YsT0FBSyxxQkFBcUIsa0JBQWtCLGFBQWE7QUFFekQsU0FBTyxLQUFLLEtBQUs7R0FDaEI7R0FDQTtHQUNBO0dBQ0E7R0FDQTtHQUNBLGNBQWMsYUFBYTtHQUMzQjtHQUNBO0dBQ0E7R0FDQTtHQUNBLHFCQUFxQjtFQUNyQixFQUFDO0NBQ0Y7Q0FFRCxNQUFNLGNBQWNDLE9BQWFDLGNBQTJCQyxhQUE2QkosY0FBb0Q7QUFDNUksT0FBSyxXQUFXO0VBRWhCLElBQUlDLG9CQUFtQztFQUN2QyxJQUFJSSxlQUE0QjtFQUVoQyxNQUFNLG9CQUFvQixNQUFNLEtBQUssT0FBTyxLQUFLLDBCQUEwQixNQUFNLGtCQUFrQjtFQUNuRyxNQUFNLG1CQUFtQixTQUEyQixrQkFBa0IsaUJBQWlCO0FBRXZGLE1BQUksa0JBQWtCLFNBQ3JCLEtBQUk7R0FDSCxNQUFNLGdCQUFnQixNQUFNLEtBQUssT0FBTyxLQUFLLDBCQUEwQixrQkFBa0IsU0FBUztBQUNsRyx1QkFBb0IsY0FBYztBQUNsQyxPQUFJLGNBQWMsS0FDakIsZ0JBQWUsTUFBTSxLQUFLLE9BQU8sS0FBSyxhQUFhLGNBQWMsS0FBSztFQUV2RSxTQUFRLEdBQUc7QUFDWCxPQUFJLGFBQWEsZUFBZSxDQUUvQixNQUNBLE9BQU07RUFFUDtBQUtGLE9BQUsscUJBQXFCLGtCQUFrQixhQUFhO0VBQ3pELE1BQU0sRUFBRSxjQUFjLFFBQVEsU0FBUyxHQUFHO0VBQzFDLE1BQU0sRUFBRSxjQUFjLGNBQWMsZUFBZSxHQUFHLGFBQWE7RUFDbkUsTUFBTVosYUFBeUI7R0FDOUIsSUFBSTtHQUNKLElBQUk7R0FDSixLQUFLO0VBQ0w7RUFFRCxNQUFNLFdBQVcsZ0JBQWdCLGFBQWEsS0FBSztBQUNuRCxTQUFPLEtBQUssS0FBSztHQUNFO0dBQ2xCO0dBQ0E7R0FDQTtHQUNBO0dBQ0EsbUJBQW1CLE9BQU87R0FDMUI7R0FDQTtHQUNBLFVBQVUsYUFBYTtHQUN2QjtHQUNBO0dBQ0EscUJBQXFCO0VBQ3JCLEVBQUM7Q0FDRjtDQUVELEFBQVEsWUFBWTtBQUNuQixNQUFJLEtBQUssWUFDUixPQUFNLElBQUksaUJBQWlCO0FBRTVCLE9BQUssY0FBYyxPQUFPO0NBQzFCO0NBRUQsTUFBYyxLQUFLLEVBQ2xCLGtCQUNBLFNBQ0EsVUFDQSxPQUNBLFlBQ0EsbUJBQ0EsY0FDQSxhQUNBLFVBQ0EsY0FDQSxtQkFDQSxxQkFDVSxFQUEwQjtBQUNwQyxPQUFLLG1CQUFtQjtBQUN4QixPQUFLLFVBQVU7QUFDZixPQUFLLE9BQU87QUFDWixPQUFLLFFBQVEsU0FBUztFQUV0QixJQUFJYTtFQUNKLElBQUlDO0VBQ0osSUFBSUM7QUFFSixNQUFJLHNCQUFzQixPQUFPO0FBQ2hDLFFBQUs7QUFDTCxRQUFLLENBQUU7QUFDUCxTQUFNLENBQUU7RUFDUixPQUFNO0FBQ04sUUFBSyxXQUFXLE1BQU0sQ0FBRTtBQUN4QixRQUFLLFdBQVcsTUFBTSxDQUFFO0FBQ3hCLFNBQU0sV0FBVyxPQUFPLENBQUU7RUFDMUI7QUFTRCxPQUFLLHFCQUFxQixJQUFJLFdBQVcsWUFBWTtBQUNwRCxTQUFNLFFBQVEsSUFBSTtJQUNqQixpQkFBaUIsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssZ0JBQWdCLGVBQWUsSUFBSSxFQUFFLENBQUM7SUFDM0UsaUJBQWlCLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLGdCQUFnQixlQUFlLElBQUksRUFBRSxDQUFDO0lBQzNFLGlCQUFpQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxnQkFBZ0IsZUFBZSxLQUFLLEVBQUUsQ0FBQztHQUM3RSxFQUFDO0VBQ0Y7QUFFRCxPQUFLLG1CQUFtQixVQUFVO0FBR2xDLE9BQUssZ0JBQWdCLG1CQUFtQixhQUFhLElBQUksS0FBSyxrQkFBa0I7QUFDaEYsT0FBSyxlQUFlLGlCQUFpQixLQUFLLE1BQU0sQ0FBQyxNQUFNO0FBQ3ZELE9BQUssY0FBYyxDQUFFO0FBRXJCLE1BQUksWUFDSCxNQUFLLFlBQVksWUFBWTtBQUc5QixPQUFLLFdBQVcsaUJBQWlCLFlBQVksQ0FBRSxFQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsS0FBSyxnQkFBZ0IsUUFBUSxXQUFXLFlBQVksTUFBTSxDQUFDO0FBQy9ILE9BQUssZUFBZSxnQkFBZ0I7QUFDcEMsT0FBSyxvQkFBb0IscUJBQXFCO0FBQzlDLE9BQUssZ0JBQWdCLEtBQUssYUFBYSxLQUFLO0FBRzVDLE1BQUkscUJBQXFCO0FBQ3hCLFFBQUssY0FBYyxLQUFLO0FBQ3hCLFFBQUssY0FBYyxLQUFLLGdCQUFnQjtFQUN4QyxNQUNBLE1BQUssY0FBYyxLQUFLLGdCQUFnQjtBQUd6QyxnQkFBYyxLQUFLLGFBQWEsMERBQTBELENBQUMsU0FBUztBQUVwRyxTQUFPO0NBQ1A7Q0FFRCxBQUFRLG1CQUEyQjtBQUNsQyxTQUFPLGlCQUFpQixLQUFLLFFBQVEsS0FBSyxlQUFlO0NBQ3pEO0NBRUQsaUJBQWlCQyxNQUFrRDtBQUNsRSxTQUFPLFdBQVcsS0FBSyxZQUFZLE1BQU0sTUFBTSxDQUFFLEVBQUM7Q0FDbEQ7Q0FFRCxlQUEyQztBQUMxQyxTQUFPLEtBQUssaUJBQWlCLGVBQWUsR0FBRztDQUMvQztDQUVELHVCQUFrRDtBQUNqRCxTQUFPLFFBQVEsSUFBSSxLQUFLLGNBQWMsQ0FBQyxJQUFJLENBQUMsY0FBYyxVQUFVLFVBQVUsQ0FBQyxDQUFDO0NBQ2hGO0NBRUQsZUFBMkM7QUFDMUMsU0FBTyxLQUFLLGlCQUFpQixlQUFlLEdBQUc7Q0FDL0M7Q0FFRCx1QkFBa0Q7QUFDakQsU0FBTyxRQUFRLElBQUksS0FBSyxjQUFjLENBQUMsSUFBSSxDQUFDLGNBQWMsVUFBVSxVQUFVLENBQUMsQ0FBQztDQUNoRjtDQUVELGdCQUE0QztBQUMzQyxTQUFPLEtBQUssaUJBQWlCLGVBQWUsSUFBSTtDQUNoRDtDQUVELHdCQUFtRDtBQUNsRCxTQUFPLFFBQVEsSUFBSSxLQUFLLGVBQWUsQ0FBQyxJQUFJLENBQUMsY0FBYyxVQUFVLFVBQVUsQ0FBQyxDQUFDO0NBQ2pGO0NBRUQsbUJBQThDO0FBQzdDLFNBQU8sUUFBUSxJQUFJLEtBQUssU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0NBQzFEOzs7Ozs7O0NBUUQsTUFBYyxnQkFDYkMsV0FDQSxFQUFFLFNBQVMsTUFBTSxNQUFNLFNBQTJCLEVBQ2xEQyxjQUEyQixZQUFZLE9BQ3BCO0VBQ25CLElBQUksWUFBWSx5QkFBeUIsS0FBSyxpQkFBaUIsVUFBVSxFQUFFLFFBQVE7QUFFbkYsT0FBSyxXQUFXO0FBQ2YsZUFBWSxLQUFLLGdCQUFnQixRQUNoQztJQUNDO0lBQ0E7SUFDQTtJQUNBO0dBQ0EsR0FDRCxZQUNBO0FBRUQsUUFBSyxpQkFBaUIsVUFBVSxDQUFDLEtBQUssVUFBVTtBQUVoRCxhQUFVLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRSxvQkFBUyxvQkFBUyxLQUFLO0FBQ25ELFNBQUssS0FBSyxVQUFVLElBQUlDLFVBQVEsSUFBSUMsYUFBVyxLQUM5QyxNQUFLLFlBQVlELFdBQVNDLFVBQVEscUJBQXFCLEdBQUc7SUFHMUQsTUFBSyxjQUFjLEtBQUs7R0FFekIsRUFBQztBQUNGLFNBQU0sVUFBVSxVQUFVO0FBQzFCLFVBQU87RUFDUDtBQUNELFFBQU0sVUFBVSxVQUFVO0FBQzFCLFNBQU87Q0FDUDs7Ozs7Q0FNRCxNQUFNLGFBQWFILFdBQTJCSSxrQkFBb0NILGNBQTJCLFlBQVksT0FBc0I7RUFDOUksTUFBTSxXQUFXLE1BQU0sS0FBSyxnQkFBZ0IsV0FBVyxrQkFBa0IsWUFBWTtBQUNyRixPQUFLLHlCQUF5QixTQUFTO0NBQ3ZDO0NBRUQsYUFBYUYsTUFBc0JNLFNBQTZDO0FBQy9FLFNBQU8seUJBQXlCLEtBQUssaUJBQWlCLEtBQUssRUFBRSxRQUFRO0NBQ3JFO0NBRUQseUJBQXlCQSxTQUFpQk4sTUFBc0JPLFNBQWtCLE1BQU07RUFDdkYsTUFBTSxZQUFZLHlCQUF5QixLQUFLLGlCQUFpQixLQUFLLEVBQUUsUUFBUTtBQUNoRixNQUFJLFVBQ0gsTUFBSyxnQkFBZ0IsV0FBVyxNQUFNLE9BQU87Q0FFOUM7Ozs7O0NBTUQsZ0JBQWdCQyxXQUFzQlIsTUFBc0JPLFNBQWtCLE1BQWU7RUFDNUYsTUFBTSxhQUFhLEtBQUssV0FBVyxJQUFJLEtBQUssSUFBSSxDQUFFO0VBQ2xELE1BQU0sd0JBQXdCLGlCQUFpQixVQUFVLFFBQVE7RUFDakUsTUFBTSxZQUFZLGNBQWMsWUFBWSxDQUFDLE1BQU0saUJBQWlCLEVBQUUsUUFBUSxLQUFLLHNCQUFzQjtBQUN6RyxPQUFLLHlCQUF5QixVQUFVO0FBRXhDLE1BQUksYUFBYSxPQUNoQixNQUFLLG1CQUFtQjtHQUN2QixPQUFPO0dBQ1A7RUFDQSxFQUFDO0FBR0gsU0FBTztDQUNQO0NBRUQsVUFBVTtBQUNULE9BQUssZ0JBQWdCLHFCQUFxQixLQUFLLG9CQUFvQjtBQUVuRSxxQkFBbUIsS0FBSyxtQkFBbUI7Q0FDM0M7Ozs7Q0FLRCxpQkFBb0M7QUFDbkMsU0FBTyxLQUFLO0NBQ1o7O0NBR0QsWUFBWUUsT0FBd0M7RUFDbkQsSUFBSSxXQUFXLHNCQUFzQixLQUFLLFlBQVksT0FBTyxDQUFDLE9BQU8sU0FBUyxRQUFRLE9BQU8sS0FBSyxLQUFLLEVBQUUsRUFBRTtFQUUzRyxNQUFNLGtCQUFrQixvQkFBb0IsT0FBTyxTQUFTO0FBRTVELE9BQUssWUFBWSxLQUFLLEdBQUcsZ0JBQWdCLGdCQUFnQjtBQUN6RCxPQUFLLHlCQUF5QixnQkFBZ0IsZ0JBQWdCLFNBQVMsRUFBRTtBQUV6RSxNQUFJLGdCQUFnQixZQUFZLFNBQVMsRUFDeEMsT0FBTSxJQUFJLFVBQVUsS0FBSyxnQkFBZ0Isd0JBQXdCLEtBQUssSUFBSSx1QkFBdUIsR0FBRyxPQUFPLGdCQUFnQixZQUFZLEtBQUssS0FBSyxDQUFDO0NBRW5KO0NBRUQsaUJBQWlCQyxNQUF3QjtBQUN4QyxPQUFLLHlCQUF5QixPQUFPLEtBQUssYUFBYSxLQUFLLENBQUM7Q0FDN0Q7Q0FFRCxnQkFBd0I7QUFDdkIsU0FBTyxjQUFjLEtBQUssbUJBQW1CLEtBQUssY0FBYyxJQUFJO0NBQ3BFO0NBRUQsV0FBa0M7QUFDakMsU0FBTyxLQUFLO0NBQ1o7Q0FFRCxNQUFjLFlBQVk5QixNQUFjK0IsYUFBK0NsQixPQUE0QjtBQUNsSCxTQUFPLEtBQUssV0FDVixZQUFZO0dBQ1osU0FBUyxLQUFLLFlBQVk7R0FDcEI7R0FDTixtQkFBbUIsS0FBSztHQUN4QixZQUFZLEtBQUssZUFBZTtHQUNoQyxjQUFjLE1BQU0sS0FBSyxzQkFBc0I7R0FDL0MsY0FBYyxNQUFNLEtBQUssc0JBQXNCO0dBQy9DLGVBQWUsTUFBTSxLQUFLLHVCQUF1QjtHQUNwQztHQUNiLGNBQWMsS0FBSyxnQkFBZ0I7R0FDNUI7RUFDUCxFQUFDLENBQ0QsTUFDQSxRQUFRLGFBQWEsQ0FBQyxNQUFNO0FBQzNCLFdBQVEsSUFBSSwwQ0FBMEMsRUFBRTtBQUN4RCxTQUFNLElBQUksVUFBVTtFQUNwQixFQUFDLENBQ0YsQ0FDQSxNQUNBLFFBQVEsZUFBZSxDQUFDLE1BQU07QUFDN0IsV0FBUSxJQUFJLDJDQUEyQztBQUN2RCxVQUFPLEtBQUssWUFBWSxNQUFNLGFBQWEsU0FBUyxNQUFNLE9BQU8sQ0FBQztFQUNsRSxFQUFDLENBQ0Y7Q0FDRjtDQUVELE1BQWMsWUFBWWIsTUFBYytCLGFBQStDQyxZQUF1QztBQUM3SCxTQUFPLEtBQUssV0FBVyxZQUFZO0dBQ2xDLFNBQVMsS0FBSyxZQUFZO0dBQzFCLFVBQVU7R0FDVixtQkFBbUIsS0FBSztHQUN4QixZQUFZLEtBQUssZUFBZTtHQUNoQyxjQUFjLE1BQU0sS0FBSyxzQkFBc0I7R0FDL0MsY0FBYyxNQUFNLEtBQUssc0JBQXNCO0dBQy9DLGVBQWUsTUFBTSxLQUFLLHVCQUF1QjtHQUNqRCxrQkFBa0IsS0FBSztHQUN2QixtQkFBbUIsS0FBSztHQUNYO0dBQ2IsY0FBYyxLQUFLLGdCQUFnQjtHQUNuQyxVQUFVLE1BQU0sS0FBSyxrQkFBa0I7R0FDdkMsUUFBUTtFQUNSLEVBQUM7Q0FDRjtDQUVELGlCQUEwQjtBQUN6QixTQUFPLEtBQUssaUJBQWlCLEtBQUssNEJBQTRCO0NBQzlEO0NBRUQseUJBQWtDO0FBQ2pDLFNBQU8sS0FBSyxnQkFBZ0IsS0FBSyw0QkFBNEI7Q0FDN0Q7Q0FFRCxnQkFBZ0JDLGNBQTZCO0FBQzVDLE9BQUsseUJBQXlCLEtBQUssaUJBQWlCLGFBQWE7QUFDakUsT0FBSyxlQUFlO0NBQ3BCO0NBRUQsNkJBQXNDO0FBQ3JDLFNBQU8sS0FBSyxlQUFlLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLGNBQWMsU0FBUztDQUMxRTtDQUVELHdCQUEwQztBQUN6QyxTQUFPLEtBQUssZUFBZSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsU0FBUyxjQUFjLFNBQVM7Q0FDNUU7Ozs7Ozs7Ozs7Ozs7OztDQWdCRCxNQUFNLEtBQ0xELFlBQ0FFLGtCQUFnRSxDQUFDLE1BQU0sUUFBUSxRQUFRLEtBQUssRUFDNUZDLGNBQTRFLENBQUMsR0FBRyxNQUFNLEdBQ3RGQyx1QkFBdUMsb0JBQ3BCO0FBTW5CLE9BQUssY0FBYztBQUVuQixNQUFJLEtBQUssZUFBZSxDQUFDLFdBQVcsS0FBSyxLQUFLLGVBQWUsQ0FBQyxHQUFHLFFBQVEsYUFBYSxDQUFDLE1BQU0sS0FBSyxxQkFBcUI7QUFDdEgsU0FBTSxLQUFLLGlCQUFpQixLQUFLLFNBQVMsQ0FBQztBQUMzQyxVQUFPO0VBQ1A7QUFFRCxNQUFJLEtBQUssY0FBYyxDQUFDLFdBQVcsS0FBSyxLQUFLLGNBQWMsQ0FBQyxXQUFXLEtBQUssS0FBSyxlQUFlLENBQUMsV0FBVyxFQUMzRyxPQUFNLElBQUksVUFBVTtFQUdyQixNQUFNLHVCQUF1QixLQUFLLGNBQWMsQ0FBQyxTQUFTLEtBQUssY0FBYyxDQUFDO0FBRzlFLE1BQUksd0JBQXdCLGdDQUFpQyxNQUFNLGdCQUFnQixxQkFBcUIsQ0FDdkcsUUFBTztBQUlSLE1BQUksS0FBSyxZQUFZLENBQUMsV0FBVyxNQUFPLE1BQU0sZ0JBQWdCLGdCQUFnQixDQUM3RSxRQUFPO0VBR1IsTUFBTSxZQUFZLFlBQVk7R0FHN0IsTUFBTSxhQUFhLE1BQU0sS0FBSywyQkFBMkI7QUFHekQsT0FBSSxLQUFLLHdCQUF3QixJQUFJLEtBQUssdUJBQXVCLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQzFHLE9BQU0sSUFBSSxVQUFVO0FBSXJCLE9BQUksS0FBSyx3QkFBd0IsSUFBSSxLQUFLLHNCQUFzQixLQUFNLE1BQU0sZ0JBQWdCLHVDQUF1QyxDQUNsSSxRQUFPO0FBR1IsU0FBTSxLQUFLLFVBQVUsTUFBTSxXQUFXO0FBQ3RDLFNBQU0sS0FBSyxlQUFlLFdBQVc7QUFDckMsU0FBTSxLQUFLLFdBQVcsVUFBVSxjQUFjLEtBQUssT0FBTyxrQkFBa0IsRUFBRSxZQUFZLEtBQUssNkJBQTZCO0FBQzVILFNBQU0sS0FBSyxvQkFBb0I7QUFDL0IsU0FBTSxLQUFLLHdCQUF3QjtBQUNuQyxVQUFPO0VBQ1A7QUFFRCxTQUFPLFlBQVksS0FBSyxnQkFBZ0IsR0FBRyxnQkFBZ0IsMEJBQTBCLFdBQVcsQ0FBQyxDQUMvRixNQUNBLFFBQVEsYUFBYSxNQUFNO0FBQzFCLFNBQU0sSUFBSSxVQUFVO0VBQ3BCLEVBQUMsQ0FDRixDQUNBLE1BQ0EsUUFBUSwyQkFBMkIsTUFBTTtBQUN4QyxTQUFNLElBQUksVUFBVTtFQUNwQixFQUFDLENBQ0YsQ0FDQSxNQUNBLFFBQVEseUJBQXlCLENBQUMsTUFBTTtBQUN2QyxPQUFJLGVBQWUsV0FBVyxZQUU3QixPQUFNO0tBQ0E7SUFDTixJQUFJLG9CQUFvQixFQUFFO0FBQzFCLFVBQU0sSUFBSSxVQUNULEtBQUssZ0JBQ0osYUFDQSxLQUFLLElBQUksa0NBQWtDLEdBQUcsTUFBTSxLQUFLLElBQUksd0JBQXdCLEdBQUcsT0FBTyxrQkFDL0Y7R0FFRjtFQUNELEVBQUMsQ0FDRixDQUNBLE1BQ0EsUUFBUSxzQkFBc0IsTUFBTTtBQUNuQyxTQUFNLElBQUksVUFBVTtFQUNwQixFQUFDLENBQ0YsQ0FDQSxNQUNBLFFBQVEsb0JBQW9CLENBQUMsTUFBTTtBQUVsQyxVQUFPLG9CQUFvQixLQUFLLFFBQVEsTUFBTSxlQUFlLFlBQVksQ0FBQyxLQUFLLE1BQU07QUFDcEYsWUFBUSxJQUFJLHdDQUF3QyxFQUFFO0FBQ3RELFdBQU87R0FDUCxFQUFDO0VBQ0YsRUFBQyxDQUNGLENBQ0EsTUFDQSxRQUFRLG1CQUFtQixNQUFNO0FBQ2hDLFNBQU0sSUFBSSxVQUFVO0VBQ3BCLEVBQUMsQ0FDRixDQUNBLE1BQ0EsUUFBUSx5QkFBeUIsTUFBTTtBQUN0QyxTQUFNLElBQUksVUFBVTtFQUNwQixFQUFDLENBQ0Y7Q0FDRjs7Ozs7OztDQVFELHVCQUFnQztFQUMvQixNQUFNLDBCQUEwQixLQUFLLGVBQWUsQ0FDbEQsT0FBTyxDQUFDLE1BQU0sS0FBSyxZQUFZLEVBQUUsUUFBUSxLQUFLLEdBQUcsQ0FDakQsT0FBTyxDQUFDLEtBQUssY0FBYyxLQUFLLElBQUksS0FBSyxLQUFLLG9CQUFvQixVQUFVLENBQUMsRUFBRSwwQkFBMEI7QUFDM0csVUFBUSxpQkFBaUIsd0JBQXdCO0NBQ2pEO0NBRUQsVUFBVUMsaUJBQTBCTCxZQUF1QztBQUMxRSxNQUFJLEtBQUssc0JBQXNCLEtBQzlCLE1BQUsscUJBQXFCLFFBQVEsU0FBUyxDQUFDLEtBQUssWUFBWTtBQUM1RCxPQUFJO0FBQ0gsVUFBTSxLQUFLLFlBQVksaUJBQWlCLFdBQVc7R0FDbkQsVUFBUztBQUVULFNBQUsscUJBQXFCO0dBQzFCO0FBQ0QsT0FBSSxLQUFLLGdCQUFnQixJQUFJLEtBQUssYUFBYTtBQUM5QyxTQUFLLGNBQWM7QUFDbkIsVUFBTSxLQUFLLFVBQVUsaUJBQWlCLFdBQVc7R0FDakQ7RUFDRCxFQUFDO0lBRUYsTUFBSyxjQUFjO0FBR3BCLFNBQU8sS0FBSztDQUNaOzs7Ozs7Ozs7Q0FVRCxNQUFjLFlBQVlLLGlCQUEwQkwsWUFBdUM7QUFDMUYsTUFBSSxLQUFLLGVBQWUsS0FDdkIsT0FBTSxJQUFJLGlCQUFpQjtBQUU1QixRQUFNLEtBQUs7QUFDWCxNQUFJO0dBQ0gsTUFBTSxjQUFjLGtCQUFrQixLQUFLLGNBQWM7R0FHekQsTUFBTSxFQUFFLGVBQWUsR0FBRyxNQUFNLE9BQU87R0FDdkMsTUFBTSxtQkFBbUIsS0FBSyxTQUFTO0dBQ3ZDLE1BQU0sT0FBTyxjQUFjLGFBQWEsa0JBQWtCO0lBR3pELHNCQUFzQjtJQUV0QixvQkFBb0I7SUFFcEIsK0JBQStCO0dBQy9CLEVBQUMsQ0FBQztBQUVILFFBQUssUUFDSixLQUFLLFNBQVMsUUFBUyxNQUFNLEtBQUssYUFBYSxLQUFLLE1BQU0sR0FDdkQsTUFBTSxLQUFLLFlBQVksTUFBTSxhQUFhLFdBQVcsR0FDckQsTUFBTSxLQUFLLFlBQVksTUFBTSxhQUFhLEtBQUssTUFBTTtHQUV6RCxNQUFNLGdCQUFnQixNQUFNLEtBQUssV0FBVyxpQkFBaUIsS0FBSyxNQUFNO0dBQ3hFLE1BQU0saUJBQWlCLE1BQU0sS0FBVyxlQUFlLENBQUMsV0FBVyxLQUFLLE9BQU8sS0FBbUIsYUFBYSxPQUFPLEVBQUUsRUFDdkgsYUFBYSxFQUNiLEVBQUM7QUFFRixRQUFLLGNBQWMsQ0FBRTtBQUNyQixRQUFLLFlBQVksZUFBZTtBQUloQyxRQUFLLGNBQWMsS0FBSyxhQUFhLEtBQUs7RUFDMUMsU0FBUSxHQUFHO0FBQ1gsT0FBSSxhQUFhLHFCQUNoQixPQUFNLElBQUksVUFBVTtTQUNWLGFBQWEsc0JBQ3ZCLE9BQU0sSUFBSSxVQUFVO1NBQ1YsYUFBYSxrQkFDdkIsT0FBTSxJQUFJLFVBQVU7U0FDVixhQUFhLHdCQUN2QixPQUFNLElBQUksVUFBVTtJQUVwQixPQUFNO0VBRVA7Q0FDRDtDQUVELEFBQVEsaUJBQWlCaEMsTUFBZ0M7RUFDeEQsTUFBTSxTQUFTO0VBQ2YsTUFBTSxJQUFJLG1CQUFtQjtHQUM1QixLQUFLLENBQUMsUUFBUSxpQkFBaUIsS0FBSyxjQUFjLEFBQUM7R0FDbkQsYUFBYSxLQUFLLE1BQU0sQ0FBQyxLQUFLLFVBQVU7R0FDeEMsT0FBTyxXQUFXLEtBQUssWUFBWSxDQUFDLE1BQU0sS0FBSztHQUMvQyxNQUFNO0dBQ04sT0FBTztHQUNQLFVBQVU7RUFDVixFQUFDO0FBQ0YsU0FBTyxLQUFLLE9BQU8sTUFBTSxRQUFRLEVBQUUsQ0FBQyxNQUFNLFFBQVEsb0JBQW9CLENBQUMsTUFBTSxRQUFRLElBQUksc0NBQXNDLENBQUMsQ0FBQztDQUNqSTtDQUVELDRDQUE2RDtBQUM1RCxTQUFPLEtBQUs7Q0FDWjtDQUVELHNDQUE4QztBQUM3QyxTQUFPLEtBQUs7Q0FDWjtDQUVELG9DQUFvQ3NDLE1BQWM7QUFDakQsT0FBSyx5QkFBeUIsS0FBSyxpQ0FBaUMsS0FBSztBQUN6RSxPQUFLLCtCQUErQjtBQUNwQyxPQUFLLHlCQUF5QixLQUFLO0NBQ25DO0NBRUQsQUFBUSx5QkFBeUI7RUFDaEMsSUFBSSxRQUFRLEtBQUssTUFBTSxDQUFDO0FBRXhCLE1BQUksTUFBTSw2QkFBNkIsS0FBSyw4QkFBOEI7QUFDekUsU0FBTSwyQkFBMkIsS0FBSztBQUV0QyxRQUFLLE9BQU8sT0FBTyxNQUFNO0VBQ3pCO0NBQ0Q7Q0FFRCxBQUFRLHFCQUFvQztBQUMzQyxNQUFJLEtBQUssY0FBYztBQUN0QixPQUFJLEtBQUssYUFBYSxjQUFjLFVBQVUsUUFBUSxLQUFLLHFCQUFxQixpQkFBaUIsTUFDaEcsTUFBSyxhQUFhLFlBQVksVUFBVTtTQUM5QixLQUFLLGFBQWEsY0FBYyxVQUFVLFFBQVEsS0FBSyxxQkFBcUIsaUJBQWlCLFFBQ3ZHLE1BQUssYUFBYSxZQUFZLFVBQVU7U0FDOUIsS0FBSyxhQUFhLGNBQWMsVUFBVSxXQUFXLEtBQUsscUJBQXFCLGlCQUFpQixNQUMxRyxNQUFLLGFBQWEsWUFBWSxVQUFVO1NBQzlCLEtBQUssYUFBYSxjQUFjLFVBQVUsU0FBUyxLQUFLLHFCQUFxQixpQkFBaUIsUUFDeEcsTUFBSyxhQUFhLFlBQVksVUFBVTtJQUV4QyxRQUFPLFFBQVEsU0FBUztBQUd6QixVQUFPLEtBQUssT0FBTyxPQUFPLEtBQUssYUFBYSxDQUFDLE1BQU0sUUFBUSxlQUFlLEtBQUssQ0FBQztFQUNoRixNQUNBLFFBQU8sUUFBUSxTQUFTO0NBRXpCOzs7O0NBS0QsTUFBYyxlQUFlQyxvQkFBK0M7QUFDM0UsT0FBSyxNQUFNLEVBQUUsU0FBUyxTQUFTLE1BQU0sSUFBSSxvQkFBb0I7QUFDNUQsT0FBSSxXQUFXLEtBQ2Q7R0FHRCxNQUFNLDRCQUE0QixTQUFTLGNBQWMsWUFBWSxLQUFLLGdCQUFnQjtBQUUxRixRQUFLLFFBQVEsU0FBUyxLQUFLLE1BQU0sQ0FBQyxNQUFNLHVCQUF1Qiw0QkFBNEI7QUFDMUYsUUFBSSwwQkFDSCxTQUFRLG9CQUFvQixLQUFLLFlBQVksUUFBUSxDQUFDLE1BQU07SUFHN0QsTUFBTSxTQUFTLE1BQU0sS0FBSyxhQUFhLGtCQUFrQjtBQUN6RCxVQUFNLEtBQUssT0FBTyxNQUFNLFFBQVEsUUFBUTtHQUN4QyxXQUFVLFFBQVEsT0FBTyw2QkFBNkIsUUFBUSxzQkFBc0IsS0FBSyxZQUFZLFFBQVEsQ0FBQyxNQUFNLEVBQUU7QUFDdEgsWUFBUSxvQkFBb0IsS0FBSyxZQUFZLFFBQVEsQ0FBQyxNQUFNO0FBQzVELFVBQU0sS0FBSyxPQUFPLE9BQU8sUUFBUTtHQUNqQztFQUNEO0NBQ0Q7Q0FFRCxnQkFBb0Q7QUFDbkQsU0FBTyxLQUFLLGNBQWMsQ0FBQyxPQUFPLEtBQUssY0FBYyxDQUFDLENBQUMsT0FBTyxLQUFLLGVBQWUsQ0FBQztDQUNuRjs7OztDQUtELE1BQU0sNEJBQWtEO0FBQ3ZELFFBQU0sS0FBSyxtQkFBbUIsVUFBVTtBQUN4QyxTQUFPLFFBQVEsSUFBSSxLQUFLLGVBQWUsQ0FBQyxJQUFJLENBQUMsY0FBYyxVQUFVLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFDakYsUUFBUSxzQkFBc0IsTUFBTTtBQUNuQyxTQUFNLElBQUksMEJBQTBCO0VBQ3BDLEVBQUMsQ0FDRjtDQUNEO0NBRUQsTUFBTSxrQkFBa0JDLFFBQXlDO0VBQ2hFLE1BQU0sRUFBRSxXQUFXLFlBQVksZ0JBQWdCLEdBQUc7RUFDbEQsSUFBSUMsWUFBcUIsQ0FBQyxVQUFVLGVBQWUsRUFBRSxVQUFXO0VBQ2hFLElBQUksVUFBVTtBQUVkLE1BQUksbUJBQW1CLGdCQUFnQixPQUFPLEVBQUU7QUFDL0MsU0FBTSxLQUFLLG1CQUFtQixVQUFVO0FBRXhDLE9BQUksY0FBYyxjQUFjLE9BQy9CLE1BQUssT0FBTyxLQUFLLGdCQUFnQixVQUFVLENBQUMsS0FBSyxDQUFDLFlBQVk7QUFDN0QsU0FBSyxNQUFNLGFBQWEsWUFBWSxlQUFlLEVBQUU7S0FDcEQsTUFBTSxXQUFXLEtBQUssaUJBQWlCLFVBQVUsQ0FBQyxPQUNqRCxDQUFDLGNBQWMsVUFBVSxXQUFXLFNBQVMsVUFBVSxRQUFRLEtBQUssUUFBUSxJQUFJLENBQ2hGO0FBQ0QsVUFBSyxNQUFNLGFBQWEsU0FFdkIsTUFBSyxRQUFRLGNBQWMsS0FBSyxDQUFDLE9BQU8sV0FBVyxHQUFHLFNBQVMsVUFBVSxRQUFRLENBQUMsQ0FDakYsV0FBVSxXQUFXLEtBQUssZ0JBQWdCLFdBQVcsV0FBVyxLQUFLO0tBQy9EO0FBRU4sZ0JBQVUsUUFBUSxzQkFBc0IsUUFBUSxDQUFDO0FBQ2pELGdCQUFVLFdBQVcsUUFBUTtBQUM3QixnQkFBVTtLQUNWO0lBRUY7R0FDRCxFQUFDO1NBQ1EsY0FBYyxjQUFjLE9BQ3RDLE1BQUssTUFBTSxhQUFhLFlBQVksZUFBZSxFQUFFO0lBQ3BELE1BQU0sYUFBYSxLQUFLLGlCQUFpQixVQUFVO0lBRW5ELE1BQU0sV0FBVyxXQUFXLE9BQU8sQ0FBQyxjQUFlLFVBQVUsV0FBVyxTQUFTLFVBQVUsUUFBUSxLQUFLLFVBQVUsSUFBSyxNQUFNO0FBRTdILFNBQUssTUFBTSxLQUFLLFNBQ2YsV0FBVSxXQUFXLEtBQUssZ0JBQWdCLEdBQUcsV0FBVyxLQUFLO0dBRTlEO0FBR0YsUUFBSyx5QkFBeUIsS0FBSztFQUNuQyxXQUFVLG1CQUFtQiwyQkFBMkIsT0FBTyxDQUMvRCxNQUFLLDhDQUE4QztTQUN6QyxtQkFBbUIsMEJBQTBCLE9BQU8sSUFBSSxjQUFjLGNBQWMsT0FDOUYsTUFBSyxvQkFBb0IsTUFBTSxLQUFLLE9BQU8sS0FBSywwQkFBMEIsT0FBTyxXQUFXO0FBRTdGLE9BQUsseUJBQXlCLFFBQVE7QUFDdEMsU0FBTyxRQUFRLFNBQVM7Q0FDeEI7Q0FFRCx3QkFBd0JDLEtBQW9CO0FBQzNDLE9BQUssZUFBZTtDQUNwQjtDQUVELHVCQUFnQztBQUMvQixPQUFLLEtBQUssYUFBYyxRQUFPO0FBRS9CLFNBQU8sWUFBWSxLQUFLLFFBQVEsS0FBSyxnQkFBZ0IsS0FBSyxhQUFhLE9BQU8sUUFBUTtDQUN0RjtBQUNEOzs7Ozs7Ozs7Ozs7QUFhRCxTQUFTLGlCQUFpQkMsZUFBeUU7Q0FHbEcsTUFBTSxjQUFjLGNBQWMsT0FBTyxDQUFDLE1BQU0sY0FBYyxFQUFFLFNBQVMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU87RUFBRSxXQUFXO0VBQUcsU0FBUyxpQkFBaUIsRUFBRSxRQUFRO0NBQUUsR0FBRTtBQUNySixRQUFPLFlBQVksYUFBYSxDQUFDLEdBQUcsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxVQUFVO0FBQzFGIn0=