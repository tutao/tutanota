import { __toESM } from "./chunk-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { Mode, assertMainOrNode, isApp, isBrowser, isDesktop } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { LazyLoaded, SortedArray, assertNotNull, cleanMatch, debounce, downcast, findAllAndRemove, getFirstOrThrow, isNotNull, memoized, neverNull, noOp, ofClass, pMap, remove, resolveMaybeLazy, startsWith, typedValues } from "./dist2-chunk.js";
import { InfoLink, lang, languageByCode } from "./LanguageViewModel-chunk.js";
import { DefaultAnimationTime, animations, height, opacity, styles } from "./styles-chunk.js";
import { getNavButtonIconBackground, theme } from "./theme-chunk.js";
import { ALLOWED_IMAGE_FORMATS, ConversationType, ExternalImageRule, FeatureType, Keys, MailAuthenticationStatus, MailMethod, OperationType, ShareCapability } from "./TutanotaConstants-chunk.js";
import { isKeyPressed, keyboardEventToKeyPress } from "./KeyManager-chunk.js";
import { windowFacade } from "./WindowFacade-chunk.js";
import { LayerType, displayOverlay, modal } from "./RootView-chunk.js";
import { inputLineHeight, px, size } from "./size-chunk.js";
import { getElementId, getEtId, getLetId, isSameId } from "./EntityUtils-chunk.js";
import { ContactTypeRef, EmailTemplateTypeRef, KnowledgeBaseEntryTypeRef, MailTypeRef, TemplateGroupRootTypeRef, createTranslationGetIn } from "./TypeRefs-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { FileNotFoundError, FileOpenError, isOfflineError } from "./ErrorUtils-chunk.js";
import { NotFoundError, TooManyRequestsError } from "./RestError-chunk.js";
import { CancelledError } from "./CancelledError-chunk.js";
import { PermissionError } from "./PermissionError-chunk.js";
import { isUpdateForTypeRef } from "./EntityUpdateUtils-chunk.js";
import { TranslationService } from "./Services2-chunk.js";
import { Button, ButtonColor, ButtonType } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { Autocomplete, Dialog, DomRectReadOnlyPolyfilled, DropDownSelector, Dropdown, TextField, attachDropdown, canSeeTutaLinks, createDropdown, getConfirmation, makeListSelectionChangedScrollHandler } from "./Dialog-chunk.js";
import { BootIcons, Icon } from "./Icon-chunk.js";
import { ButtonSize, IconButton } from "./IconButton-chunk.js";
import { getSharedGroupName, hasCapabilityOnGroup } from "./GroupUtils2-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import { parseMailtoUrl } from "./MailAddressParser-chunk.js";
import { createDataFile } from "./BlobUtils-chunk.js";
import { fileListToArray, isDataFile, isFileReference, isTutanotaFile } from "./FileUtils-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import { LINE_BREAK, RecipientField, checkAttachmentSize, createNewContact, dialogTitleTranslationKey, getEnabledMailAddressesWithUser, getMailAddressDisplayText, readLocalFiles, showFileChooser } from "./SharedMailUtils-chunk.js";
import { RecipientType } from "./Recipient-chunk.js";
import { getContactDisplayName } from "./ContactUtils-chunk.js";
import { showPlanUpgradeRequiredDialog } from "./SubscriptionDialogs-chunk.js";
import { ToggleButton } from "./ToggleButton-chunk.js";
import { MailRecipientsTextField } from "./MailRecipientsTextField-chunk.js";
import { InfoBanner } from "./InfoBanner-chunk.js";
import { ExpanderPanel } from "./Expander-chunk.js";
import { PasswordField } from "./PasswordField-chunk.js";
import { showUserError } from "./ErrorHandlerImpl-chunk.js";
import { handleRatingByEvent } from "./InAppRatingDialog-chunk.js";
import { isCustomizationEnabledForCustomer } from "./CustomerUtils-chunk.js";
import { SaveErrorReason, SaveStatusEnum, mailLocator } from "./mailLocator-chunk.js";
import { CounterBadge } from "./CounterBadge-chunk.js";
import { Editor, RichTextToolbar, animateToolbar } from "./HtmlEditor-chunk.js";
import { htmlSanitizer } from "./HtmlSanitizer-chunk.js";
import { appendEmailSignature } from "./Signature-chunk.js";
import { checkApprovalStatus } from "./LoginUtils-chunk.js";
import { AttachmentBubble, AttachmentType } from "./AttachmentBubble-chunk.js";
import { createInlineImage, isMailContrastFixNeeded, promptAndDeleteMails, replaceCidsWithInlineImages, replaceInlineImagesWithCids } from "./MailGuiUtils-chunk.js";
import { SELECT_NEXT_TEMPLATE, SELECT_PREV_TEMPLATE, TEMPLATE_SHORTCUT_PREFIX, TemplatePopupModel, loadTemplateGroupInstance, search } from "./TemplatePopupModel-chunk.js";
import { ContentBlockingStatus } from "./MailViewerViewModel-chunk.js";

//#region src/mail-app/mail/editor/MailEditorViewModel.ts
async function chooseAndAttachFile(model, boundingRect, fileTypes) {
	boundingRect.height = Math.round(boundingRect.height);
	boundingRect.width = Math.round(boundingRect.width);
	boundingRect.x = Math.round(boundingRect.x);
	boundingRect.y = Math.round(boundingRect.y);
	try {
		const files = await showFileChooserForAttachments(boundingRect, fileTypes);
		if (!files || files.length === 0) return;
		switch (env.mode) {
			case Mode.App:
				model.attachFiles(files);
				return files;
			case Mode.Desktop: {
				const dataFiles = (await Promise.all(files.map(async (f) => locator.fileApp.readDataFile(f.location)))).filter(isNotNull);
				model.attachFiles(dataFiles);
				return dataFiles;
			}
			default:
				model.attachFiles(files);
				return files;
		}
	} catch (e) {
		if (e instanceof UserError) await showUserError(e);
else {
			const msg = e.message || "unknown error";
			console.error("could not attach files:", msg);
		}
	}
}
function showFileChooserForAttachments(boundingRect, fileTypes) {
	const fileSelector = [Mode.App, Mode.Desktop].includes(env.mode) ? locator.fileApp.openFileChooser(boundingRect, fileTypes) : showFileChooser(true, fileTypes);
	return fileSelector.catch(ofClass(PermissionError, () => {
		Dialog.message("fileAccessDeniedMobile_msg");
	})).catch(ofClass(FileNotFoundError, () => {
		Dialog.message("couldNotAttachFile_msg");
	}));
}
function createAttachmentBubbleAttrs(model, inlineImageElements) {
	return model.getAttachments().map((attachment) => ({
		attachment,
		open: null,
		download: () => _downloadAttachment(attachment),
		remove: () => {
			model.removeAttachment(attachment);
			if (attachment.cid) {
				const imageElement = inlineImageElements.find((e) => e.getAttribute("cid") === attachment.cid);
				if (imageElement) {
					imageElement.remove();
					remove(inlineImageElements, imageElement);
				}
			}
			mithril_default.redraw();
		},
		fileImport: null,
		type: AttachmentType.GENERIC
	}));
}
async function _downloadAttachment(attachment) {
	try {
		if (isFileReference(attachment)) await locator.fileApp.open(attachment);
else if (isDataFile(attachment)) await locator.fileController.saveDataFile(attachment);
else if (isTutanotaFile(attachment)) await locator.fileController.download(attachment);
else throw new ProgrammingError("attachment is neither reference, datafile nor tutanotafile!");
	} catch (e) {
		if (e instanceof FileOpenError) return Dialog.message("canNotOpenFileOnDevice_msg");
else {
			const msg = e.message || "unknown error";
			console.error("could not open file:", msg);
			return Dialog.message("errorDuringFileOpen_msg");
		}
	}
}
const cleanupInlineAttachments = debounce(50, (domElement, inlineImageElements, attachments) => {
	const elementsToRemove = [];
	for (const inlineImage of inlineImageElements) if (domElement && !domElement.contains(inlineImage)) {
		const cid = inlineImage.getAttribute("cid");
		const attachmentIndex = attachments.findIndex((a) => a.cid === cid);
		if (attachmentIndex !== -1) {
			attachments.splice(attachmentIndex, 1);
			elementsToRemove.push(inlineImage);
			mithril_default.redraw();
		}
	}
	findAllAndRemove(inlineImageElements, (imageElement) => elementsToRemove.includes(imageElement));
});
function getConfidentialStateMessage(isConfidential) {
	return isConfidential ? lang.get("confidentialStatus_msg") : lang.get("nonConfidentialStatus_msg");
}

//#endregion
//#region src/mail-app/templates/view/TemplateConstants.ts
const TEMPLATE_POPUP_HEIGHT = 340;
const TEMPLATE_POPUP_TWO_COLUMN_MIN_WIDTH = 600;
const TEMPLATE_LIST_ENTRY_HEIGHT = 47;
const TEMPLATE_LIST_ENTRY_WIDTH = 354;

//#endregion
//#region src/mail-app/templates/view/TemplatePopupResultRow.ts
var TemplatePopupResultRow = class {
	view(vnode) {
		const { title, tag } = vnode.attrs.template;
		return mithril_default(".flex.flex-column.overflow-hidden.full-width.ml-s", {
			style: { height: px(TEMPLATE_LIST_ENTRY_HEIGHT) },
			title
		}, [mithril_default(".text-ellipsis.smaller", { style: { marginLeft: "4px" } }, title), mithril_default(".flex.badge-line-height.text-ellipsis", [tag ? mithril_default(".small.keyword-bubble-no-padding.pl-s.pr-s.border-radius.no-wrap.small.min-content", TEMPLATE_SHORTCUT_PREFIX + tag.toLowerCase()) : null])]);
	}
};

//#endregion
//#region src/mail-app/templates/view/TemplateExpander.ts
var TemplateExpander = class {
	sanitizedText = memoized((text) => htmlSanitizer.sanitizeHTML(text, {
		blockExternalContent: false,
		allowRelativeLinks: true
	}).html);
	view({ attrs }) {
		const { model, template } = attrs;
		const selectedContent = model.getSelectedContent();
		return mithril_default(".flex.flex-column.flex-grow.scroll.ml-s", {
			style: { maxHeight: px(TEMPLATE_POPUP_HEIGHT - size.button_height) },
			onkeydown: (e) => {
				if (isKeyPressed(e.key, Keys.TAB)) e.preventDefault();
			}
		}, [mithril_default(".text-break.smaller.b.text-center", { style: { "border-bottom": `1px solid ${theme.content_border}` } }, template.title), mithril_default(".text-break.flex-grow.pr.overflow-y-visible.pt", selectedContent ? mithril_default.trust(this.sanitizedText(selectedContent.text)) : null)]);
	}
};

//#endregion
//#region src/mail-app/templates/view/TemplateSearchBar.ts
var TemplateSearchBar = class {
	domInput = null;
	view(vnode) {
		const a = vnode.attrs;
		return mithril_default(".inputWrapper.pt-xs.pb-xs", { style: { "border-bottom": `1px solid ${theme.content_border}` } }, this._getInputField(a));
	}
	_getInputField(a) {
		return mithril_default("input.input", {
			placeholder: a.placeholder && lang.getTranslationText(a.placeholder),
			oncreate: (vnode) => {
				this.domInput = vnode.dom;
				this.domInput.value = a.value();
				this.domInput.focus();
			},
			onkeydown: (e) => {
				const key = keyboardEventToKeyPress(e);
				return a.keyHandler != null ? a.keyHandler(key) : true;
			},
			oninput: () => {
				const domInput = assertNotNull(this.domInput);
				a.value(domInput.value);
				a.oninput?.(domInput.value, domInput);
			},
			style: { lineHeight: px(inputLineHeight) }
		});
	}
};

//#endregion
//#region src/mail-app/templates/TemplateGroupUtils.ts
async function createInitialTemplateListIfAllowed() {
	const userController = locator.logins.getUserController();
	const customer = await userController.loadCustomer();
	const { getAvailablePlansWithTemplates } = await import("./SubscriptionUtils2-chunk.js");
	let allowed = (await userController.getPlanConfig()).templates || isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled);
	if (!allowed) if (userController.isGlobalAdmin()) allowed = await showPlanUpgradeRequiredDialog(await getAvailablePlansWithTemplates());
else Dialog.message("contactAdmin_msg");
	if (allowed) {
		const groupId = await locator.groupManagementFacade.createTemplateGroup("");
		return locator.entityClient.load(TemplateGroupRootTypeRef, groupId);
	} else return null;
}

//#endregion
//#region src/common/gui/ScrollSelectList.ts
var ScrollSelectList = class {
	selectedItem = null;
	view(vnode) {
		const a = vnode.attrs;
		return mithril_default(".flex.flex-column.scroll-no-overlay", a.items.length > 0 ? a.items.map((item) => this.renderRow(item, vnode)) : mithril_default(".row-selected.text-center.pt", lang.get(resolveMaybeLazy(a.emptyListMessage))));
	}
	onupdate(vnode) {
		const newSelectedItem = vnode.attrs.selectedItem;
		if (newSelectedItem !== this.selectedItem) {
			this._onSelectionChanged(newSelectedItem, vnode.attrs.items, vnode.dom);
			mithril_default.redraw();
		}
	}
	renderRow(item, vnode) {
		const a = vnode.attrs;
		const isSelected = a.selectedItem === item;
		return mithril_default(".flex.flex-column.click", { style: { maxWidth: a.width } }, [mithril_default(".flex.template-list-row" + (isSelected ? ".row-selected" : ""), {
			onclick: (e) => {
				a.onItemSelected(item);
				e.stopPropagation();
			},
			ondblclick: (e) => {
				a.onItemSelected(item);
				a.onItemDoubleClicked(item);
				e.stopPropagation();
			}
		}, [a.renderItem(item), isSelected ? mithril_default(Icon, {
			icon: Icons.ArrowForward,
			style: {
				marginTop: "auto",
				marginBottom: "auto"
			}
		}) : mithril_default("", { style: {
			width: "17.1px",
			height: "16px"
		} })])]);
	}
	_onSelectionChanged(selectedItem, items, scrollDom) {
		this.selectedItem = selectedItem;
		if (selectedItem != null) {
			const selectedIndex = items.indexOf(selectedItem);
			if (selectedIndex !== -1) {
				const selectedDomElement = scrollDom.children.item(selectedIndex);
				if (selectedDomElement) selectedDomElement.scrollIntoView({
					block: "nearest",
					inline: "nearest"
				});
			}
		}
	}
};

//#endregion
//#region src/mail-app/templates/view/TemplatePopup.ts
var import_stream$4 = __toESM(require_stream(), 1);
function showTemplatePopupInEditor(templateModel, editor, template, highlightedText) {
	const initialSearchString = template ? TEMPLATE_SHORTCUT_PREFIX + template.tag : highlightedText;
	const cursorRect = editor.getCursorPosition();
	const editorRect = editor.getDOM().getBoundingClientRect();
	const onSelect = (text) => {
		editor.insertHTML(text);
		editor.focus();
	};
	let rect;
	const availableHeightBelowCursor = window.innerHeight - cursorRect.bottom;
	const popUpHeight = TEMPLATE_POPUP_HEIGHT + 10;
	const popUpWidth = editorRect.right - editorRect.left;
	if (availableHeightBelowCursor < popUpHeight) {
		const diff = popUpHeight - availableHeightBelowCursor;
		rect = new DomRectReadOnlyPolyfilled(editorRect.left, cursorRect.bottom - diff, popUpWidth, cursorRect.height);
	} else rect = new DomRectReadOnlyPolyfilled(editorRect.left, cursorRect.bottom, popUpWidth, cursorRect.height);
	const popup = new TemplatePopup(templateModel, rect, onSelect, initialSearchString, () => editor.focus());
	templateModel.search(initialSearchString);
	popup.show();
}
var TemplatePopup = class {
	_rect;
	_shortcuts;
	_onSelect;
	_initialWindowWidth;
	_resizeListener;
	_redrawStream;
	_templateModel;
	_searchBarValue;
	_selectTemplateButtonAttrs;
	_inputDom = null;
	_debounceFilter;
	focusedBeforeShown = null;
	constructor(templateModel, rect, onSelect, initialSearchString, restoreEditorFocus) {
		this.restoreEditorFocus = restoreEditorFocus;
		this._rect = rect;
		this._onSelect = onSelect;
		this._initialWindowWidth = window.innerWidth;
		this._resizeListener = () => {
			this._close();
		};
		this._searchBarValue = (0, import_stream$4.default)(initialSearchString);
		this._templateModel = templateModel;
		this._shortcuts = [
			{
				key: Keys.ESC,
				enabled: () => true,
				exec: () => {
					this.restoreEditorFocus?.();
					this._close();
					mithril_default.redraw();
				},
				help: "closeTemplate_action"
			},
			{
				key: Keys.RETURN,
				enabled: () => true,
				exec: () => {
					const selectedContent = this._templateModel.getSelectedContent();
					if (selectedContent) {
						this._onSelect(selectedContent.text);
						this._close();
					}
				},
				help: "insertTemplate_action"
			},
			{
				key: Keys.UP,
				enabled: () => true,
				exec: () => {
					this._templateModel.selectNextTemplate(SELECT_PREV_TEMPLATE);
				},
				help: "selectPreviousTemplate_action"
			},
			{
				key: Keys.DOWN,
				enabled: () => true,
				exec: () => {
					this._templateModel.selectNextTemplate(SELECT_NEXT_TEMPLATE);
				},
				help: "selectNextTemplate_action"
			}
		];
		this._redrawStream = templateModel.searchResults.map((results) => {
			mithril_default.redraw();
		});
		this._selectTemplateButtonAttrs = {
			label: "selectTemplate_action",
			click: () => {
				const selected = this._templateModel.getSelectedContent();
				if (selected) {
					this._onSelect(selected.text);
					this._close();
				}
			},
			type: ButtonType.Primary
		};
		this._debounceFilter = debounce(200, (value) => {
			templateModel.search(value);
		});
		this._debounceFilter(initialSearchString);
	}
	view = () => {
		const showTwoColumns = this._isScreenWideEnough();
		return mithril_default(".flex.flex-column.abs.elevated-bg.border-radius.dropdown-shadow", {
			style: {
				width: px(this._rect.width),
				height: px(TEMPLATE_POPUP_HEIGHT),
				top: px(this._rect.top),
				left: px(this._rect.left)
			},
			onclick: (e) => {
				this._inputDom?.focus();
				e.stopPropagation();
			},
			oncreate: () => {
				windowFacade.addResizeListener(this._resizeListener);
			},
			onremove: () => {
				windowFacade.removeResizeListener(this._resizeListener);
			}
		}, [this._renderHeader(), mithril_default(".flex.flex-grow.scroll.mb-s", [mithril_default(".flex.flex-column.scroll" + (showTwoColumns ? ".pr" : ""), { style: { flex: "1 1 40%" } }, this._renderList()), showTwoColumns ? mithril_default(".flex.flex-column.flex-grow-shrink-half", { style: { flex: "1 1 60%" } }, this._renderRightColumn()) : null])]);
	};
	_renderHeader() {
		const selectedTemplate = this._templateModel.getSelectedTemplate();
		return mithril_default(".flex-space-between.center-vertically.pl.pr-s", [mithril_default(".flex-start", [mithril_default(".flex.center-vertically", this._renderSearchBar()), this._renderAddButton()]), mithril_default(".flex-end", [selectedTemplate ? this._renderEditButtons(selectedTemplate) : null])]);
	}
	_renderSearchBar = () => {
		return mithril_default(TemplateSearchBar, {
			value: this._searchBarValue,
			placeholder: "filter_label",
			keyHandler: (keyPress) => {
				if (isKeyPressed(keyPress.key, Keys.DOWN, Keys.UP)) {
					this._templateModel.selectNextTemplate(isKeyPressed(keyPress.key, Keys.UP) ? SELECT_PREV_TEMPLATE : SELECT_NEXT_TEMPLATE);
					return false;
				} else return true;
			},
			oninput: (value) => {
				this._debounceFilter(value);
			},
			oncreate: (vnode) => {
				this._inputDom = vnode.dom.firstElementChild;
			}
		});
	};
	_renderAddButton() {
		const attrs = this._createAddButtonAttributes();
		return mithril_default("", { onkeydown: (e) => {
			if (isKeyPressed(e.key, Keys.TAB) && !this._templateModel.getSelectedTemplate()) {
				this._inputDom?.focus();
				e.preventDefault();
			}
		} }, attrs ? mithril_default(IconButton, attrs) : null);
	}
	_createAddButtonAttributes() {
		const templateGroupInstances = this._templateModel.getTemplateGroupInstances();
		const writeableGroups = templateGroupInstances.filter((instance) => hasCapabilityOnGroup(locator.logins.getUserController().user, instance.group, ShareCapability.Write));
		if (templateGroupInstances.length === 0) return {
			title: "createTemplate_action",
			click: () => {
				createInitialTemplateListIfAllowed().then((groupRoot) => {
					if (groupRoot) this.showTemplateEditor(null, groupRoot);
				});
			},
			icon: Icons.Add,
			colors: ButtonColor.DrawerNav
		};
else if (writeableGroups.length === 1) return {
			title: "createTemplate_action",
			click: () => this.showTemplateEditor(null, writeableGroups[0].groupRoot),
			icon: Icons.Add,
			colors: ButtonColor.DrawerNav
		};
else if (writeableGroups.length > 1) return attachDropdown({
			mainButtonAttrs: {
				title: "createTemplate_action",
				icon: Icons.Add,
				colors: ButtonColor.DrawerNav
			},
			childAttrs: () => writeableGroups.map((groupInstances) => {
				return {
					label: lang.makeTranslation("group_name", getSharedGroupName(groupInstances.groupInfo, locator.logins.getUserController(), true)),
					click: () => this.showTemplateEditor(null, groupInstances.groupRoot)
				};
			})
		});
else return null;
	}
	_renderEditButtons(selectedTemplate) {
		const selectedContent = this._templateModel.getSelectedContent();
		const selectedGroup = this._templateModel.getSelectedTemplateGroupInstance();
		const canEdit = !!selectedGroup && hasCapabilityOnGroup(locator.logins.getUserController().user, selectedGroup.group, ShareCapability.Write);
		return [
			mithril_default(".flex.flex-column.justify-center.mr-m", selectedContent ? mithril_default("", lang.get(languageByCode[selectedContent.languageCode].textId)) : ""),
			mithril_default(IconButton, attachDropdown({
				mainButtonAttrs: {
					title: "chooseLanguage_action",
					icon: Icons.Language
				},
				childAttrs: () => selectedTemplate.contents.map((content) => {
					const langCode = downcast(content.languageCode);
					return {
						label: languageByCode[langCode].textId,
						click: (e) => {
							e.stopPropagation();
							this._templateModel.setSelectedContentLanguage(langCode);
							this._inputDom?.focus();
						}
					};
				})
			})),
			canEdit ? [mithril_default(IconButton, {
				title: "editTemplate_action",
				click: () => locator.entityClient.load(TemplateGroupRootTypeRef, neverNull(selectedTemplate._ownerGroup)).then((groupRoot) => this.showTemplateEditor(selectedTemplate, groupRoot)),
				icon: Icons.Edit,
				colors: ButtonColor.DrawerNav
			}), mithril_default(IconButton, {
				title: "remove_action",
				click: () => {
					getConfirmation("deleteTemplate_msg").confirmed(() => locator.entityClient.erase(selectedTemplate));
				},
				icon: Icons.Trash,
				colors: ButtonColor.DrawerNav
			})] : null,
			mithril_default(".pr-s", mithril_default(".nav-bar-spacer")),
			mithril_default("", { onkeydown: (e) => {
				if (isKeyPressed(e.key, Keys.TAB)) {
					this._inputDom?.focus();
					e.preventDefault();
				}
			} }, mithril_default(Button, this._selectTemplateButtonAttrs))
		];
	}
	_renderList() {
		return mithril_default(ScrollSelectList, {
			items: this._templateModel.searchResults(),
			selectedItem: this._templateModel.selectedTemplate(),
			onItemSelected: this._templateModel.selectedTemplate,
			emptyListMessage: () => this._templateModel.isLoaded() ? "nothingFound_label" : "loadingTemplates_label",
			width: TEMPLATE_LIST_ENTRY_WIDTH,
			renderItem: (template) => mithril_default(TemplatePopupResultRow, { template }),
			onItemDoubleClicked: (_) => {
				const selected = this._templateModel.getSelectedContent();
				if (selected) {
					this._onSelect(selected.text);
					this._close();
				}
			}
		});
	}
	_renderRightColumn() {
		const template = this._templateModel.getSelectedTemplate();
		if (template) return [mithril_default(TemplateExpander, {
			template,
			model: this._templateModel
		})];
else return null;
	}
	_isScreenWideEnough() {
		return window.innerWidth > TEMPLATE_POPUP_TWO_COLUMN_MIN_WIDTH;
	}
	_getWindowWidthChange() {
		return window.innerWidth - this._initialWindowWidth;
	}
	show() {
		this.focusedBeforeShown = document.activeElement;
		modal.display(this, false);
	}
	_close() {
		modal.remove(this);
	}
	backgroundClick(e) {
		this.restoreEditorFocus?.();
		this._close();
	}
	hideAnimation() {
		return Promise.resolve();
	}
	onClose() {
		this._redrawStream.end(true);
	}
	shortcuts() {
		return this._shortcuts;
	}
	popState(e) {
		return true;
	}
	callingElement() {
		return this.focusedBeforeShown;
	}
	showTemplateEditor(templateToEdit, groupRoot) {
		import("./TemplateEditor2-chunk.js").then((editor) => {
			editor.showTemplateEditor(templateToEdit, groupRoot);
		});
	}
};

//#endregion
//#region src/mail-app/templates/view/TemplateShortcutListener.ts
function registerTemplateShortcutListener(editor, templateModel) {
	const listener = new TemplateShortcutListener(editor, templateModel, lang);
	editor.addEventListener("keydown", (event) => listener.handleKeyDown(event));
	editor.addEventListener("cursor", (event) => listener.handleCursorChange(event));
	return listener;
}
var TemplateShortcutListener = class {
	_currentCursorPosition;
	_editor;
	_templateModel;
	_lang;
	constructor(editor, templateModel, lang$1) {
		this._editor = editor;
		this._currentCursorPosition = null;
		this._templateModel = templateModel;
		this._lang = lang$1;
	}
	handleKeyDown(event) {
		if (isKeyPressed(event.key, Keys.TAB) && this._currentCursorPosition) {
			const cursorEndPos = this._currentCursorPosition;
			const text = cursorEndPos.startContainer.nodeType === Node.TEXT_NODE ? cursorEndPos.startContainer.textContent ?? "" : "";
			const templateShortcutStartIndex = text.lastIndexOf(TEMPLATE_SHORTCUT_PREFIX);
			const lastWhiteSpaceIndex = text.search(/\s\S*$/);
			if (templateShortcutStartIndex !== -1 && templateShortcutStartIndex < cursorEndPos.startOffset && templateShortcutStartIndex > lastWhiteSpaceIndex) {
				event.stopPropagation();
				event.preventDefault();
				const range = document.createRange();
				range.setStart(cursorEndPos.startContainer, templateShortcutStartIndex);
				range.setEnd(cursorEndPos.startContainer, cursorEndPos.startOffset);
				this._editor.setSelection(range);
				const selectedText = this._editor.getSelectedText();
				const template = this._templateModel.findTemplateWithTag(selectedText);
				if (template) if (template.contents.length > 1) {
					let buttons = template.contents.map((content) => {
						return {
							label: languageByCode[downcast(content.languageCode)].textId,
							click: () => {
								this._editor.insertHTML(content.text);
								this._editor.focus();
							}
						};
					});
					const dropdown = new Dropdown(() => buttons, 200);
					dropdown.setOrigin(this._editor.getCursorPosition());
					modal.displayUnique(dropdown, false);
				} else this._editor.insertHTML(getFirstOrThrow(template.contents).text);
else showTemplatePopupInEditor(this._templateModel, this._editor, null, selectedText);
			}
		}
	}
	handleCursorChange(event) {
		this._currentCursorPosition = event.detail.range;
	}
};

//#endregion
//#region src/mail-app/knowledgebase/view/KnowledgeBaseListEntry.ts
const KNOWLEDGEBASE_LIST_ENTRY_HEIGHT = 50;
var KnowledgeBaseListEntry = class {
	view(vnode) {
		const { title, keywords } = vnode.attrs.entry;
		return mithril_default(".flex.flex-column.overflow-hidden.full-width", { style: { height: px(KNOWLEDGEBASE_LIST_ENTRY_HEIGHT) } }, [mithril_default(".text-ellipsis.mb-xs.b", title), mithril_default(".flex.badge-line-height.text-ellipsis", [keywords.map((keyword) => {
			return mithril_default(".b.small.teamLabel.pl-s.pr-s.border-radius.no-wrap.small.mr-s.min-content", keyword.keyword);
		})])]);
	}
};

//#endregion
//#region src/mail-app/knowledgebase/view/KnowledgeBaseEntryView.ts
var KnowledgeBaseEntryView = class {
	_sanitizedEntry;
	constructor() {
		this._sanitizedEntry = memoized((entry) => {
			return { content: htmlSanitizer.sanitizeHTML(entry.description, { blockExternalContent: true }).html };
		});
	}
	view({ attrs }) {
		return mithril_default(".flex.flex-column", [this._renderContent(attrs)]);
	}
	_renderContent(attrs) {
		const { entry, readonly } = attrs;
		return mithril_default("", { onclick: (event) => {
			this._handleAnchorClick(event, attrs);
		} }, [mithril_default(".flex.mt-l.center-vertically.selectable", mithril_default(".h4.text-ellipsis", entry.title), !readonly ? [mithril_default(".flex.flex-grow.justify-end", [this.renderEditButton(entry), this.renderRemoveButton(entry)])] : null), mithril_default("", [mithril_default(".mt-s.flex.mt-s.wrap", [entry.keywords.map((entryKeyword) => {
			return mithril_default(".keyword-bubble.selectable", entryKeyword.keyword);
		})]), mithril_default(".flex.flex-column.mt-s", [mithril_default(".editor-border.text-break.selectable", mithril_default.trust(this._sanitizedEntry(entry).content))])])]);
	}
	renderRemoveButton(entry) {
		return mithril_default(IconButton, {
			title: "remove_action",
			icon: Icons.Trash,
			click: () => {
				getConfirmation("deleteEntryConfirm_msg").confirmed(() => locator.entityClient.erase(entry).catch(ofClass(NotFoundError, noOp)));
			}
		});
	}
	renderEditButton(entry) {
		return mithril_default(IconButton, {
			title: "edit_action",
			icon: Icons.Edit,
			click: () => {
				import("./KnowledgeBaseEditor2-chunk.js").then(({ showKnowledgeBaseEditor: showKnowledgeBaseEditor$1 }) => {
					locator.entityClient.load(TemplateGroupRootTypeRef, neverNull(entry._ownerGroup)).then((groupRoot) => {
						showKnowledgeBaseEditor$1(entry, groupRoot);
					});
				});
			}
		});
	}
	_handleAnchorClick(event, attrs) {
		let target = event.target;
		if (target && target.closest) {
			let anchorElement = target.closest("a");
			if (anchorElement && startsWith(anchorElement.href, "tutatemplate:")) {
				event.preventDefault();
				const [listId, elementId] = new URL(anchorElement.href).pathname.split("/");
				attrs.onTemplateSelected([listId, elementId]);
			}
		}
	}
};

//#endregion
//#region src/mail-app/knowledgebase/view/KnowledgeBaseDialogContent.ts
var import_stream$3 = __toESM(require_stream(), 1);
var KnowledgeBaseDialogContent = class {
	_streams;
	filterValue = "";
	_selectionChangedListener;
	constructor() {
		this._streams = [];
	}
	oncreate({ attrs }) {
		const { model } = attrs;
		this._streams.push(import_stream$3.default.combine(() => {
			mithril_default.redraw();
		}, [model.selectedEntry, model.filteredEntries]));
	}
	onremove() {
		for (let stream$5 of this._streams) stream$5.end(true);
	}
	view({ attrs }) {
		const model = attrs.model;
		const selectedEntry = model.selectedEntry();
		return selectedEntry ? mithril_default(KnowledgeBaseEntryView, {
			entry: selectedEntry,
			onTemplateSelected: (templateId) => {
				model.loadTemplate(templateId).then((fetchedTemplate) => {
					attrs.onTemplateSelect(fetchedTemplate);
				}).catch(ofClass(NotFoundError, () => Dialog.message("templateNotExists_msg")));
			},
			readonly: model.isReadOnly(selectedEntry)
		}) : [
			mithril_default(TextField, {
				label: "filter_label",
				value: this.filterValue,
				oninput: (value) => {
					this.filterValue = value;
					model.filter(value);
					mithril_default.redraw();
				}
			}),
			this._renderKeywords(model),
			this._renderList(model, attrs)
		];
	}
	_renderKeywords(model) {
		const matchedKeywords = model.getMatchedKeywordsInContent();
		return mithril_default(".flex.mt-s.wrap", [matchedKeywords.length > 0 ? mithril_default(".small.full-width", lang.get("matchingKeywords_label")) : null, matchedKeywords.map((keyword) => {
			return mithril_default(".keyword-bubble-no-padding.plr-button.pl-s.pr-s.border-radius.no-wrap.mr-s.min-content", keyword);
		})]);
	}
	_renderList(model, attrs) {
		return mithril_default(".mt-s.scroll", {
			oncreate: (vnode) => {
				this._selectionChangedListener = model.selectedEntry.map(makeListSelectionChangedScrollHandler(vnode.dom, KNOWLEDGEBASE_LIST_ENTRY_HEIGHT, model.getSelectedEntryIndex.bind(model)));
			},
			onbeforeremove: () => {
				this._selectionChangedListener.end();
			}
		}, [model.containsResult() ? model.filteredEntries().map((entry) => this._renderListEntry(model, entry)) : mithril_default(".center", lang.get("noEntryFound_label"))]);
	}
	_renderListEntry(model, entry) {
		return mithril_default(".flex.flex-column.click.hoverable-list-item", [mithril_default(".flex", { onclick: () => {
			model.selectedEntry(entry);
		} }, [mithril_default(KnowledgeBaseListEntry, { entry }), mithril_default("", { style: {
			width: "17.1px",
			height: "16px"
		} })])]);
	}
};

//#endregion
//#region src/mail-app/knowledgebase/view/KnowledgeBaseDialog.ts
var import_stream$2 = __toESM(require_stream(), 1);
function createKnowledgeBaseDialogInjection(knowledgeBase, templateModel, editor) {
	const knowledgebaseAttrs = {
		onTemplateSelect: (template) => {
			showTemplatePopupInEditor(templateModel, editor, template, "");
		},
		model: knowledgeBase
	};
	const isDialogVisible = (0, import_stream$2.default)(false);
	return {
		visible: isDialogVisible,
		headerAttrs: _createHeaderAttrs(knowledgebaseAttrs, isDialogVisible),
		componentAttrs: knowledgebaseAttrs,
		component: KnowledgeBaseDialogContent
	};
}
function _createHeaderAttrs(attrs, isDialogVisible) {
	return () => {
		const selectedEntry = attrs.model.selectedEntry();
		return selectedEntry ? createEntryViewHeader(selectedEntry, attrs.model) : createListViewHeader(attrs.model, isDialogVisible);
	};
}
function createEntryViewHeader(entry, model) {
	return {
		left: [{
			label: "back_action",
			click: () => model.selectedEntry(null),
			type: ButtonType.Secondary
		}],
		middle: "knowledgebase_label"
	};
}
function createListViewHeader(model, isDialogVisible) {
	return {
		left: () => [{
			label: "close_alt",
			click: () => isDialogVisible(false),
			type: ButtonType.Primary
		}],
		middle: "knowledgebase_label",
		right: [createAddButtonAttrs(model)]
	};
}
function createAddButtonAttrs(model) {
	const templateGroupInstances = model.getTemplateGroupInstances();
	if (templateGroupInstances.length === 1) return {
		label: "add_action",
		click: () => {
			showKnowledgeBaseEditor(null, templateGroupInstances[0].groupRoot);
		},
		type: ButtonType.Primary
	};
else return {
		label: "add_action",
		type: ButtonType.Primary,
		click: createDropdown({ lazyButtons: () => templateGroupInstances.map((groupInstances) => {
			return {
				label: lang.makeTranslation("group_name", getSharedGroupName(groupInstances.groupInfo, model.userController, true)),
				click: () => {
					showKnowledgeBaseEditor(null, groupInstances.groupRoot);
				}
			};
		}) })
	};
}
function showKnowledgeBaseEditor(entryToEdit, groupRoot) {
	import("./KnowledgeBaseEditor2-chunk.js").then((editor) => {
		editor.showKnowledgeBaseEditor(entryToEdit, groupRoot);
	});
}

//#endregion
//#region src/mail-app/knowledgebase/model/KnowledgeBaseSearchFilter.ts
function knowledgeBaseSearch(input, allEntries) {
	return search(input, allEntries, [
		"title",
		"description",
		"keywords.keyword"
	], false);
}

//#endregion
//#region src/mail-app/knowledgebase/model/KnowledgeBaseModel.ts
var import_stream$1 = __toESM(require_stream(), 1);
const SELECT_NEXT_ENTRY = "next";
function compareKnowledgeBaseEntriesForSort(entry1, entry2) {
	return entry1.title.localeCompare(entry2.title);
}
var KnowledgeBaseModel = class {
	_allEntries;
	filteredEntries;
	selectedEntry;
	_allKeywords;
	_matchedKeywordsInContent;
	_filterValue;
	_eventController;
	_entityClient;
	_entityEventReceived;
	_groupInstances;
	_initialized;
	userController;
	constructor(eventController, entityClient, userController) {
		this._eventController = eventController;
		this._entityClient = entityClient;
		this.userController = userController;
		this._allEntries = SortedArray.empty(compareKnowledgeBaseEntriesForSort);
		this._allKeywords = [];
		this._matchedKeywordsInContent = [];
		this.filteredEntries = (0, import_stream$1.default)(this._allEntries.array);
		this.selectedEntry = (0, import_stream$1.default)(null);
		this._filterValue = "";
		this._entityEventReceived = (updates) => {
			return this._entityUpdate(updates);
		};
		this._eventController.addEntityListener(this._entityEventReceived);
		this._groupInstances = [];
		this._allKeywords = [];
		this.filteredEntries(this._allEntries.array);
		this.selectedEntry(this.containsResult() ? this.filteredEntries()[0] : null);
		this._initialized = new LazyLoaded(() => {
			const templateMemberships = this.userController.getTemplateMemberships();
			let newGroupInstances = [];
			return pMap(templateMemberships, (membership) => loadTemplateGroupInstance(membership, entityClient)).then((groupInstances) => {
				newGroupInstances = groupInstances;
				return loadKnowledgebaseEntries(groupInstances, entityClient);
			}).then((knowledgebaseEntries) => {
				this._allEntries.insertAll(knowledgebaseEntries);
				this._groupInstances = newGroupInstances;
				this.initAllKeywords();
				return this;
			});
		});
	}
	init() {
		return this._initialized.getAsync();
	}
	isInitialized() {
		return this._initialized.isLoaded();
	}
	getTemplateGroupInstances() {
		return this._groupInstances;
	}
	initAllKeywords() {
		this._allKeywords = [];
		this._matchedKeywordsInContent = [];
		for (const entry of this._allEntries.array) for (const keyword of entry.keywords) this._allKeywords.push(keyword.keyword);
	}
	isSelectedEntry(entry) {
		return this.selectedEntry() === entry;
	}
	containsResult() {
		return this.filteredEntries().length > 0;
	}
	getAllKeywords() {
		return this._allKeywords.sort();
	}
	getMatchedKeywordsInContent() {
		return this._matchedKeywordsInContent;
	}
	getLanguageFromTemplate(template) {
		const clientLanguage = lang.code;
		const hasClientLanguage = template.contents.some((content) => content.languageCode === clientLanguage);
		if (hasClientLanguage) return clientLanguage;
		return downcast(template.contents[0].languageCode);
	}
	sortEntriesByMatchingKeywords(emailContent) {
		this._matchedKeywordsInContent = [];
		const emailContentNoTags = emailContent.replace(/(<([^>]+)>)/gi, "");
		for (const keyword of this._allKeywords) if (emailContentNoTags.includes(keyword)) this._matchedKeywordsInContent.push(keyword);
		this._allEntries = SortedArray.from(this._allEntries.array, (a, b) => this._compareEntriesByMatchedKeywords(a, b));
		this._filterValue = "";
		this.filteredEntries(this._allEntries.array);
	}
	_compareEntriesByMatchedKeywords(entry1, entry2) {
		const difference = this._getMatchedKeywordsNumber(entry2) - this._getMatchedKeywordsNumber(entry1);
		return difference === 0 ? compareKnowledgeBaseEntriesForSort(entry1, entry2) : difference;
	}
	_getMatchedKeywordsNumber(entry) {
		let matches = 0;
		for (const k of entry.keywords) if (this._matchedKeywordsInContent.includes(k.keyword)) matches++;
		return matches;
	}
	filter(input) {
		this._filterValue = input;
		const inputTrimmed = input.trim();
		if (inputTrimmed) this.filteredEntries(knowledgeBaseSearch(inputTrimmed, this._allEntries.array));
else this.filteredEntries(this._allEntries.array);
	}
	selectNextEntry(action) {
		const selectedIndex = this.getSelectedEntryIndex();
		const nextIndex = selectedIndex + (action === SELECT_NEXT_ENTRY ? 1 : -1);
		if (nextIndex >= 0 && nextIndex < this.filteredEntries().length) {
			const nextSelectedEntry = this.filteredEntries()[nextIndex];
			this.selectedEntry(nextSelectedEntry);
			return true;
		}
		return false;
	}
	getSelectedEntryIndex() {
		const selectedEntry = this.selectedEntry();
		if (selectedEntry == null) return -1;
		return this.filteredEntries().indexOf(selectedEntry);
	}
	_removeFromAllKeywords(keyword) {
		const index = this._allKeywords.indexOf(keyword);
		if (index > -1) this._allKeywords.splice(index, 1);
	}
	dispose() {
		this._eventController.removeEntityListener(this._entityEventReceived);
	}
	loadTemplate(templateId) {
		return this._entityClient.load(EmailTemplateTypeRef, templateId);
	}
	isReadOnly(entry) {
		const instance = this._groupInstances.find((instance$1) => isSameId(entry._ownerGroup, getEtId(instance$1.group)));
		return !instance || !hasCapabilityOnGroup(this.userController.user, instance.group, ShareCapability.Write);
	}
	_entityUpdate(updates) {
		return pMap(updates, (update) => {
			if (isUpdateForTypeRef(KnowledgeBaseEntryTypeRef, update)) {
				if (update.operation === OperationType.CREATE) return this._entityClient.load(KnowledgeBaseEntryTypeRef, [update.instanceListId, update.instanceId]).then((entry) => {
					this._allEntries.insert(entry);
					this.filter(this._filterValue);
				});
else if (update.operation === OperationType.UPDATE) return this._entityClient.load(KnowledgeBaseEntryTypeRef, [update.instanceListId, update.instanceId]).then((updatedEntry) => {
					this._allEntries.removeFirst((e) => isSameId(getElementId(e), update.instanceId));
					this._allEntries.insert(updatedEntry);
					this.filter(this._filterValue);
					const oldSelectedEntry = this.selectedEntry();
					if (oldSelectedEntry && isSameId(oldSelectedEntry._id, updatedEntry._id)) this.selectedEntry(updatedEntry);
				});
else if (update.operation === OperationType.DELETE) {
					const selected = this.selectedEntry();
					if (selected && isSameId(getLetId(selected), [update.instanceListId, update.instanceId])) this.selectedEntry(null);
					this._allEntries.removeFirst((e) => isSameId(getElementId(e), update.instanceId));
					this.filter(this._filterValue);
				}
			}
		}).then(noOp);
	}
};
function loadKnowledgebaseEntries(templateGroups, entityClient) {
	return pMap(templateGroups, (group) => entityClient.loadAll(KnowledgeBaseEntryTypeRef, group.groupRoot.knowledgeBase)).then((groupedTemplates) => groupedTemplates.flat());
}

//#endregion
//#region src/mail-app/mail/view/MinimizedEditorOverlay.ts
const COUNTER_POS_OFFSET = px(-8);
var MinimizedEditorOverlay = class {
	_listener;
	_eventController;
	constructor(vnode) {
		const { minimizedEditor, viewModel, eventController } = vnode.attrs;
		this._eventController = eventController;
		this._listener = (updates, eventOwnerGroupId) => {
			return pMap(updates, (update) => {
				if (isUpdateForTypeRef(MailTypeRef, update) && update.operation === OperationType.DELETE) {
					let draft = minimizedEditor.sendMailModel.getDraft();
					if (draft && isSameId(draft._id, [update.instanceListId, update.instanceId])) viewModel.removeMinimizedEditor(minimizedEditor);
				}
			});
		};
		eventController.addEntityListener(this._listener);
	}
	onremove() {
		this._eventController.removeEntityListener(this._listener);
	}
	view(vnode) {
		const { minimizedEditor, viewModel, eventController } = vnode.attrs;
		const subject = minimizedEditor.sendMailModel.getSubject();
		return mithril_default(".elevated-bg.pl.border-radius", [mithril_default(CounterBadge, {
			count: viewModel.getMinimizedEditors().indexOf(minimizedEditor) + 1,
			position: {
				top: COUNTER_POS_OFFSET,
				right: COUNTER_POS_OFFSET
			},
			color: theme.navigation_button_icon,
			background: getNavButtonIconBackground()
		}), mithril_default(".flex.justify-between.pb-xs.pt-xs", [mithril_default(".flex.col.justify-center.min-width-0.flex-grow", { onclick: () => viewModel.reopenMinimizedEditor(minimizedEditor) }, [mithril_default(".b.text-ellipsis", subject ? subject : lang.get("newMail_action")), mithril_default(".small.text-ellipsis", getStatusMessage(minimizedEditor.saveStatus()))]), mithril_default(".flex.items-center.justify-right", [
			!styles.isSingleColumnLayout() ? mithril_default(IconButton, {
				title: "edit_action",
				click: () => viewModel.reopenMinimizedEditor(minimizedEditor),
				icon: Icons.Edit
			}) : null,
			mithril_default(IconButton, {
				title: "delete_action",
				click: () => this._onDeleteClicked(minimizedEditor, viewModel),
				icon: Icons.Trash
			}),
			mithril_default(IconButton, {
				title: "close_alt",
				click: () => viewModel.removeMinimizedEditor(minimizedEditor),
				icon: Icons.Cancel
			})
		])])]);
	}
	_onDeleteClicked(minimizedEditor, viewModel) {
		const model = minimizedEditor.sendMailModel;
		viewModel.removeMinimizedEditor(minimizedEditor);
		minimizedEditor.saveStatus.map(async ({ status }) => {
			if (status !== SaveStatusEnum.Saving) {
				const draft = model.draft;
				if (draft) await promptAndDeleteMails(mailLocator.mailModel, [draft], noOp);
			}
		});
	}
};
function getStatusMessage(saveStatus) {
	switch (saveStatus.status) {
		case SaveStatusEnum.Saving: return lang.get("save_msg");
		case SaveStatusEnum.NotSaved: switch (saveStatus.reason) {
			case SaveErrorReason.ConnectionLost: return lang.get("draftNotSavedConnectionLost_msg");
			default: return lang.get("draftNotSaved_msg");
		}
		case SaveStatusEnum.Saved: return lang.get("draftSaved_msg");
		default: return "";
	}
}

//#endregion
//#region src/mail-app/mail/view/MinimizedMailEditorOverlay.ts
assertMainOrNode();
const MINIMIZED_OVERLAY_WIDTH_WIDE = 350;
const MINIMIZED_OVERLAY_WIDTH_SMALL = 220;
function showMinimizedMailEditor(dialog, sendMailModel, viewModel, eventController, dispose, saveStatus) {
	let closeOverlayFunction = noOp;
	const minimizedEditor = viewModel.minimizeMailEditor(dialog, sendMailModel, dispose, saveStatus, () => closeOverlayFunction());
	setTimeout(() => {
		closeOverlayFunction = showMinimizedEditorOverlay(viewModel, minimizedEditor, eventController);
	}, DefaultAnimationTime);
}
function showMinimizedEditorOverlay(viewModel, minimizedEditor, eventController) {
	return displayOverlay(() => getOverlayPosition(), { view: () => mithril_default(MinimizedEditorOverlay, {
		viewModel,
		minimizedEditor,
		eventController
	}) }, "slide-bottom", undefined, "minimized-shadow");
}
function getOverlayPosition() {
	return {
		bottom: styles.isUsingBottomNavigation() ? px(size.hpad) : px(size.vpad),
		right: styles.isUsingBottomNavigation() ? px(size.hpad) : px(size.hpad_medium),
		width: px(styles.isSingleColumnLayout() ? MINIMIZED_OVERLAY_WIDTH_SMALL : MINIMIZED_OVERLAY_WIDTH_WIDE),
		zIndex: LayerType.LowPriorityOverlay
	};
}

//#endregion
//#region src/mail-app/mail/editor/MailEditor.ts
var import_stream = __toESM(require_stream(), 1);
function createMailEditorAttrs(model, doBlockExternalContent, doFocusEditorOnLoad, dialog, templateModel, knowledgeBaseInjection, search$1, alwaysBlockExternalContent) {
	return {
		model,
		doBlockExternalContent: (0, import_stream.default)(doBlockExternalContent),
		doShowToolbar: (0, import_stream.default)(false),
		selectedNotificationLanguage: (0, import_stream.default)(""),
		dialog,
		templateModel,
		knowledgeBaseInjection,
		search: search$1,
		alwaysBlockExternalContent
	};
}
var MailEditor = class {
	attrs;
	editor;
	recipientFieldTexts = {
		to: (0, import_stream.default)(""),
		cc: (0, import_stream.default)(""),
		bcc: (0, import_stream.default)("")
	};
	mentionedInlineImages;
	inlineImageElements;
	templateModel;
	knowledgeBaseInjection = null;
	sendMailModel;
	areDetailsExpanded;
	recipientShowConfidential = new Map();
	blockExternalContent;
	alwaysBlockExternalContent = false;
	blockedExternalContent = 0;
	constructor(vnode) {
		const a = vnode.attrs;
		this.attrs = a;
		this.inlineImageElements = [];
		this.mentionedInlineImages = [];
		const model = a.model;
		this.sendMailModel = model;
		this.templateModel = a.templateModel;
		this.blockExternalContent = a.doBlockExternalContent();
		this.alwaysBlockExternalContent = a.alwaysBlockExternalContent;
		this.areDetailsExpanded = model.bccRecipients().length + model.ccRecipients().length > 0;
		this.editor = new Editor(200, (html, isPaste) => {
			const sanitized = htmlSanitizer.sanitizeFragment(html, { blockExternalContent: !isPaste && this.blockExternalContent });
			this.blockedExternalContent = sanitized.blockedExternalContent;
			this.mentionedInlineImages = sanitized.inlineImageCids;
			return sanitized.fragment;
		}, null);
		const onEditorChanged = () => {
			cleanupInlineAttachments(this.editor.getDOM(), this.inlineImageElements, model.getAttachments());
			model.markAsChangedIfNecessary(true);
			mithril_default.redraw();
		};
		this.editor.initialized.promise.then(() => {
			this.editor.setHTML(model.getBody());
			const editorDom = this.editor.getDOM();
			const contrastFixNeeded = isMailContrastFixNeeded(editorDom);
			if (contrastFixNeeded) editorDom.classList.add("bg-fix-quoted");
			this.processInlineImages();
			new MutationObserver(onEditorChanged).observe(this.editor.getDOM(), {
				attributes: false,
				childList: true,
				subtree: true
			});
			this.editor.addChangeListener(() => model.setBody(replaceInlineImagesWithCids(this.editor.getDOM()).innerHTML));
			this.editor.addEventListener("pasteImage", ({ detail }) => {
				const items = Array.from(detail.clipboardData.items);
				const imageItems = items.filter((item) => /image/.test(item.type));
				if (!imageItems.length) return false;
				const file = imageItems[0]?.getAsFile();
				if (file == null) return false;
				const reader = new FileReader();
				reader.onload = () => {
					if (reader.result == null || "string" === typeof reader.result) return;
					const newInlineImages = [createDataFile(file.name, file.type, new Uint8Array(reader.result))];
					model.attachFiles(newInlineImages);
					this.insertInlineImages(model, newInlineImages);
				};
				reader.readAsArrayBuffer(file);
			});
			if (a.templateModel) a.templateModel.init().then((templateModel) => {
				registerTemplateShortcutListener(this.editor, templateModel);
			});
		});
		model.onMailChanged.map(() => mithril_default.redraw());
		model.setOnBeforeSendFunction(() => {
			let invalidText = "";
			for (const leftoverText of typedValues(this.recipientFieldTexts)) if (leftoverText().trim() !== "") invalidText += "\n" + leftoverText().trim();
			if (invalidText !== "") throw new UserError(lang.makeTranslation("invalidRecipients_msg", lang.get("invalidRecipients_msg") + invalidText));
		});
		const dialog = a.dialog();
		if (model.getConversationType() === ConversationType.REPLY || model.toRecipients().length) dialog.setFocusOnLoadFunction(() => {
			this.editor.initialized.promise.then(() => this.editor.focus());
		});
		const shortcuts = [
			{
				key: Keys.SPACE,
				ctrlOrCmd: true,
				exec: () => this.openTemplates(),
				help: "openTemplatePopup_msg"
			},
			{
				key: Keys.B,
				ctrlOrCmd: true,
				exec: noOp,
				help: "formatTextBold_msg"
			},
			{
				key: Keys.I,
				ctrlOrCmd: true,
				exec: noOp,
				help: "formatTextItalic_msg"
			},
			{
				key: Keys.U,
				ctrlOrCmd: true,
				exec: noOp,
				help: "formatTextUnderline_msg"
			}
		];
		for (const shortcut of shortcuts) dialog.addShortcut(shortcut);
		this.editor.initialized.promise.then(() => {
			a.knowledgeBaseInjection(this.editor).then((injection) => {
				this.knowledgeBaseInjection = injection;
				mithril_default.redraw();
			});
		});
	}
	downloadInlineImage(model, cid) {
		const tutanotaFiles = model.getAttachments().filter((attachment) => isTutanotaFile(attachment));
		const inlineAttachment = tutanotaFiles.find((attachment) => attachment.cid === cid);
		if (inlineAttachment && isTutanotaFile(inlineAttachment)) locator.fileController.open(inlineAttachment).catch(ofClass(FileOpenError, () => Dialog.message("canNotOpenFileOnDevice_msg")));
	}
	view(vnode) {
		const a = vnode.attrs;
		this.attrs = a;
		const { model } = a;
		this.sendMailModel = model;
		const showConfidentialButton = model.containsExternalRecipients();
		const isConfidential = model.isConfidential() && showConfidentialButton;
		const confidentialButtonAttrs = {
			title: "confidential_action",
			onToggled: (_, e) => {
				e.stopPropagation();
				model.setConfidential(!model.isConfidential());
			},
			icon: model.isConfidential() ? Icons.Lock : Icons.Unlock,
			toggled: model.isConfidential(),
			size: ButtonSize.Compact
		};
		const attachFilesButtonAttrs = {
			title: "attachFiles_action",
			click: (ev, dom) => chooseAndAttachFile(model, dom.getBoundingClientRect()).then(() => mithril_default.redraw()),
			icon: Icons.Attachment,
			size: ButtonSize.Compact
		};
		const plaintextFormatting = locator.logins.getUserController().props.sendPlaintextOnly;
		this.editor.setCreatesLists(!plaintextFormatting);
		const toolbarButton = () => !plaintextFormatting ? mithril_default(ToggleButton, {
			title: "showRichTextToolbar_action",
			icon: Icons.FontSize,
			size: ButtonSize.Compact,
			toggled: a.doShowToolbar(),
			onToggled: (_, e) => {
				a.doShowToolbar(!a.doShowToolbar());
				e.stopPropagation();
				this.editor.focus();
			}
		}) : null;
		const subjectFieldAttrs = {
			label: "subject_label",
			helpLabel: () => getConfidentialStateMessage(model.isConfidential()),
			value: model.getSubject(),
			oninput: (val) => model.setSubject(val),
			injectionsRight: () => mithril_default(".flex.end.ml-between-s.items-center", [
				showConfidentialButton ? mithril_default(ToggleButton, confidentialButtonAttrs) : null,
				this.knowledgeBaseInjection ? this.renderToggleKnowledgeBase(this.knowledgeBaseInjection) : null,
				mithril_default(IconButton, attachFilesButtonAttrs),
				toolbarButton()
			])
		};
		const attachmentBubbleAttrs = createAttachmentBubbleAttrs(model, this.inlineImageElements);
		let editCustomNotificationMailAttrs = null;
		if (locator.logins.getUserController().isGlobalAdmin()) editCustomNotificationMailAttrs = attachDropdown({
			mainButtonAttrs: {
				title: "more_label",
				icon: Icons.More,
				size: ButtonSize.Compact
			},
			childAttrs: () => [{
				label: "add_action",
				click: () => {
					import("./EditNotificationEmailDialog2-chunk.js").then(({ showAddOrEditNotificationEmailDialog }) => showAddOrEditNotificationEmailDialog(locator.logins.getUserController()));
				}
			}, {
				label: "edit_action",
				click: () => {
					import("./EditNotificationEmailDialog2-chunk.js").then(({ showAddOrEditNotificationEmailDialog }) => showAddOrEditNotificationEmailDialog(locator.logins.getUserController(), model.getSelectedNotificationLanguageCode()));
				}
			}]
		});
		return mithril_default("#mail-editor.full-height.text.touch-callout.flex.flex-column", {
			onclick: (e) => {
				if (e.target === this.editor.getDOM()) this.editor.focus();
			},
			ondragover: (ev) => {
				ev.stopPropagation();
				ev.preventDefault();
			},
			ondrop: (ev) => {
				if (ev.dataTransfer?.files && ev.dataTransfer.files.length > 0) {
					let nativeFiles = fileListToArray(ev.dataTransfer.files);
					readLocalFiles(nativeFiles).then((dataFiles) => {
						model.attachFiles(dataFiles);
						mithril_default.redraw();
					}).catch((e) => {
						console.log(e);
						return Dialog.message("couldNotAttachFile_msg");
					});
					ev.stopPropagation();
					ev.preventDefault();
				}
			}
		}, [
			mithril_default(".rel", this.renderRecipientField(RecipientField.TO, this.recipientFieldTexts.to, a.search)),
			mithril_default(".rel", mithril_default(ExpanderPanel, { expanded: this.areDetailsExpanded }, mithril_default(".details", [this.renderRecipientField(RecipientField.CC, this.recipientFieldTexts.cc, a.search), this.renderRecipientField(RecipientField.BCC, this.recipientFieldTexts.bcc, a.search)]))),
			mithril_default(".wrapping-row", [mithril_default("", { style: { "min-width": "250px" } }, mithril_default(DropDownSelector, {
				label: "sender_label",
				items: getEnabledMailAddressesWithUser(model.mailboxDetails, model.user().userGroupInfo).sort().map((mailAddress) => ({
					name: mailAddress,
					value: mailAddress
				})),
				selectedValue: a.model.getSender(),
				selectedValueDisplay: getMailAddressDisplayText(a.model.getSenderName(), a.model.getSender(), false),
				selectionChangedHandler: (selection) => model.setSender(selection),
				dropdownWidth: 250
			})), isConfidential ? mithril_default(".flex", {
				style: { "min-width": "250px" },
				oncreate: (vnode$1) => {
					const htmlDom = vnode$1.dom;
					htmlDom.style.opacity = "0";
					return animations.add(htmlDom, opacity(0, 1, true));
				},
				onbeforeremove: (vnode$1) => {
					const htmlDom = vnode$1.dom;
					htmlDom.style.opacity = "1";
					return animations.add(htmlDom, opacity(1, 0, true));
				}
			}, [mithril_default(".flex-grow", mithril_default(DropDownSelector, {
				label: "notificationMailLanguage_label",
				items: model.getAvailableNotificationTemplateLanguages().map((language) => {
					return {
						name: lang.get(language.textId),
						value: language.code
					};
				}),
				selectedValue: model.getSelectedNotificationLanguageCode(),
				selectionChangedHandler: (v) => model.setSelectedNotificationLanguageCode(v),
				dropdownWidth: 250
			})), editCustomNotificationMailAttrs ? mithril_default(".pt.flex-no-grow.flex-end.border-bottom.flex.items-center", mithril_default(IconButton, editCustomNotificationMailAttrs)) : null]) : null]),
			isConfidential ? this.renderPasswordFields() : null,
			mithril_default(".row", mithril_default(TextField, subjectFieldAttrs)),
			mithril_default(".flex-start.flex-wrap.mt-s.mb-s.gap-hpad", attachmentBubbleAttrs.map((a$1) => mithril_default(AttachmentBubble, a$1))),
			model.getAttachments().length > 0 ? mithril_default("hr.hr") : null,
			this.renderExternalContentBanner(this.attrs),
			a.doShowToolbar() ? this.renderToolbar(model) : null,
			mithril_default(".pt-s.text.scroll-x.break-word-links.flex.flex-column.flex-grow", { onclick: () => this.editor.focus() }, mithril_default(this.editor)),
			mithril_default(".pb")
		]);
	}
	renderExternalContentBanner(attrs) {
		if (!this.blockExternalContent || this.alwaysBlockExternalContent || this.blockedExternalContent === 0) return null;
		const showButton = {
			label: "showBlockedContent_action",
			click: () => {
				this.updateExternalContentStatus(ContentBlockingStatus.Show);
				this.processInlineImages();
			}
		};
		return mithril_default(InfoBanner, {
			message: "contentBlocked_msg",
			icon: Icons.Picture,
			helpLink: canSeeTutaLinks(attrs.model.logins) ? InfoLink.LoadImages : null,
			buttons: [showButton]
		});
	}
	updateExternalContentStatus(status) {
		this.blockExternalContent = status === ContentBlockingStatus.Block || status === ContentBlockingStatus.AlwaysBlock;
		const sanitized = htmlSanitizer.sanitizeHTML(this.editor.getHTML(), { blockExternalContent: this.blockExternalContent });
		this.editor.setHTML(sanitized.html);
	}
	processInlineImages() {
		this.inlineImageElements = replaceCidsWithInlineImages(this.editor.getDOM(), this.sendMailModel.loadedInlineImages, (cid, event, dom) => {
			const downloadClickHandler = createDropdown({ lazyButtons: () => [{
				label: "download_action",
				click: () => this.downloadInlineImage(this.sendMailModel, cid)
			}] });
			downloadClickHandler(downcast(event), dom);
		});
	}
	renderToggleKnowledgeBase(knowledgeBaseInjection) {
		return mithril_default(ToggleButton, {
			title: "openKnowledgebase_action",
			toggled: knowledgeBaseInjection.visible(),
			onToggled: () => {
				if (knowledgeBaseInjection.visible()) knowledgeBaseInjection.visible(false);
else {
					knowledgeBaseInjection.componentAttrs.model.sortEntriesByMatchingKeywords(this.editor.getValue());
					knowledgeBaseInjection.visible(true);
					knowledgeBaseInjection.componentAttrs.model.init();
				}
			},
			icon: Icons.Book,
			size: ButtonSize.Compact
		});
	}
	renderToolbar(model) {
		return mithril_default.fragment({ onbeforeremove: ({ dom }) => animateToolbar(dom.children[0], false) }, [mithril_default(RichTextToolbar, {
			editor: this.editor,
			imageButtonClickHandler: isApp() ? null : (event) => this.imageButtonClickHandler(model, event.target.getBoundingClientRect()),
			customButtonAttrs: this.templateModel ? [{
				title: "openTemplatePopup_msg",
				click: () => {
					this.openTemplates();
				},
				icon: Icons.ListAlt,
				size: ButtonSize.Compact
			}] : []
		}), mithril_default("hr.hr")]);
	}
	async imageButtonClickHandler(model, rect) {
		const files = await chooseAndAttachFile(model, rect, ALLOWED_IMAGE_FORMATS);
		if (!files || files.length === 0) return;
		return await this.insertInlineImages(model, files);
	}
	async insertInlineImages(model, files) {
		for (const file of files) {
			const img = createInlineImage(file);
			model.loadedInlineImages.set(img.cid, img);
			this.inlineImageElements.push(this.editor.insertImage(img.objectUrl, {
				cid: img.cid,
				style: "max-width: 100%"
			}));
		}
		mithril_default.redraw();
	}
	renderPasswordFields() {
		return mithril_default(".external-recipients.overflow-hidden", {
			oncreate: (vnode) => this.animateHeight(vnode.dom, true),
			onbeforeremove: (vnode) => this.animateHeight(vnode.dom, false)
		}, this.sendMailModel.allRecipients().filter((r) => r.type === RecipientType.EXTERNAL).map((recipient) => {
			if (!this.recipientShowConfidential.has(recipient.address)) this.recipientShowConfidential.set(recipient.address, false);
			return mithril_default(PasswordField, {
				oncreate: (vnode) => this.animateHeight(vnode.dom, true),
				onbeforeremove: (vnode) => this.animateHeight(vnode.dom, false),
				label: lang.getTranslation("passwordFor_label", { "{1}": recipient.address }),
				value: this.sendMailModel.getPassword(recipient.address),
				passwordStrength: this.sendMailModel.getPasswordStrength(recipient),
				status: "auto",
				autocompleteAs: Autocomplete.off,
				oninput: (val) => this.sendMailModel.setPassword(recipient.address, val)
			});
		}));
	}
	renderRecipientField(field, fieldText, search$1) {
		const label = {
			to: "to_label",
			cc: "cc_label",
			bcc: "bcc_label"
		}[field];
		return mithril_default(MailRecipientsTextField, {
			label,
			text: fieldText(),
			onTextChanged: (text) => fieldText(text),
			recipients: this.sendMailModel.getRecipientList(field),
			onRecipientAdded: async (address, name) => {
				try {
					await this.sendMailModel.addRecipient(field, {
						address,
						name
					});
				} catch (e) {
					if (isOfflineError(e)) {} else if (e instanceof TooManyRequestsError) await Dialog.message("tooManyAttempts_msg");
else throw e;
				}
			},
			onRecipientRemoved: (address) => this.sendMailModel.removeRecipientByAddress(address, field),
			getRecipientClickedDropdownAttrs: (address) => {
				const recipient = this.sendMailModel.getRecipient(field, address);
				return this.getRecipientClickedContextButtons(recipient, field);
			},
			disabled: !this.sendMailModel.logins.isInternalUserLoggedIn(),
			injectionsRight: field === RecipientField.TO && this.sendMailModel.logins.isInternalUserLoggedIn() ? mithril_default("", mithril_default(ToggleButton, {
				title: "show_action",
				icon: BootIcons.Expand,
				size: ButtonSize.Compact,
				toggled: this.areDetailsExpanded,
				onToggled: (_, e) => {
					e.stopPropagation();
					this.areDetailsExpanded = !this.areDetailsExpanded;
				}
			})) : null,
			search: search$1
		});
	}
	async getRecipientClickedContextButtons(recipient, field) {
		const { entity, contactModel } = this.sendMailModel;
		const canEditBubbleRecipient = locator.logins.getUserController().isInternalUser() && !locator.logins.isEnabled(FeatureType.DisableContacts);
		const canRemoveBubble = locator.logins.getUserController().isInternalUser();
		const createdContactReceiver = (contactElementId) => {
			const mailAddress = recipient.address;
			contactModel.getContactListId().then((contactListId) => {
				if (!contactListId) return;
				const id = [contactListId, contactElementId];
				entity.load(ContactTypeRef, id).then((contact) => {
					if (contact.mailAddresses.some((ma) => cleanMatch(ma.address, mailAddress))) {
						recipient.setName(getContactDisplayName(contact));
						recipient.setContact(contact);
					} else this.sendMailModel.removeRecipient(recipient, field, false);
				});
			});
		};
		const contextButtons = [];
		if (canEditBubbleRecipient) if (recipient.contact && recipient.contact._id) contextButtons.push({
			label: "editContact_label",
			click: () => {
				import("./ContactEditor2-chunk.js").then(({ ContactEditor }) => new ContactEditor(entity, recipient.contact).show());
			}
		});
else contextButtons.push({
			label: "createContact_action",
			click: () => {
				contactModel.getContactListId().then((contactListId) => {
					const newContact = createNewContact(locator.logins.getUserController().user, recipient.address, recipient.name);
					import("./ContactEditor2-chunk.js").then(({ ContactEditor }) => {
						new ContactEditor(entity, newContact, assertNotNull(contactListId), createdContactReceiver).show();
					});
				});
			}
		});
		if (canRemoveBubble) contextButtons.push({
			label: "remove_action",
			click: () => this.sendMailModel.removeRecipient(recipient, field, false)
		});
		return contextButtons;
	}
	openTemplates() {
		if (this.templateModel) this.templateModel.init().then((templateModel) => {
			showTemplatePopupInEditor(templateModel, this.editor, null, this.editor.getSelectedText());
		});
	}
	animateHeight(domElement, fadein) {
		let childHeight = domElement.offsetHeight;
		return animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0)).then(() => {
			domElement.style.height = "";
		});
	}
};
/**
* Creates a new Dialog with a MailEditor inside.
* @param model
* @param blockExternalContent
* @param alwaysBlockExternalContent
* @returns {Dialog}
* @private
*/
async function createMailEditorDialog(model, blockExternalContent = false, alwaysBlockExternalContent = false) {
	let dialog;
	let mailEditorAttrs;
	const save = (showProgress = true) => {
		const savePromise = model.saveDraft(true, MailMethod.NONE);
		if (showProgress) return showProgressDialog("save_msg", savePromise);
else return savePromise;
	};
	const send = async () => {
		if (model.isSharedMailbox() && model.containsExternalRecipients() && model.isConfidential()) {
			await Dialog.message("sharedMailboxCanNotSendConfidentialExternal_msg");
			return;
		}
		try {
			const success = await model.send(MailMethod.NONE, Dialog.confirm, showProgressDialog);
			if (success) {
				dispose();
				dialog.close();
				await handleRatingByEvent();
			}
		} catch (e) {
			if (e instanceof UserError) showUserError(e);
else throw e;
		}
	};
	const disposables = [];
	const dispose = () => {
		model.dispose();
		if (templatePopupModel) templatePopupModel.dispose();
		for (const disposable of disposables) disposable.dispose();
	};
	const minimize = () => {
		let saveStatus = (0, import_stream.default)({ status: SaveStatusEnum.Saving });
		if (model.hasMailChanged()) save(false).then(() => saveStatus({ status: SaveStatusEnum.Saved })).catch((e) => {
			const reason = isOfflineError(e) ? SaveErrorReason.ConnectionLost : SaveErrorReason.Unknown;
			saveStatus({
				status: SaveStatusEnum.NotSaved,
				reason
			});
			if (reason === SaveErrorReason.Unknown) if (e instanceof UserError) showUserError(e);
else throw e;
		}).finally(() => mithril_default.redraw());
else if (!model.draft) {
			dispose();
			dialog.close();
			return;
		} else saveStatus = (0, import_stream.default)({ status: SaveStatusEnum.Saved });
		showMinimizedMailEditor(dialog, model, mailLocator.minimizedMailModel, locator.eventController, dispose, saveStatus);
	};
	let windowCloseUnsubscribe = () => {};
	const headerBarAttrs = {
		left: [{
			label: "close_alt",
			click: () => minimize(),
			type: ButtonType.Secondary
		}],
		right: [{
			label: "send_action",
			click: () => {
				send();
			},
			type: ButtonType.Primary
		}],
		middle: dialogTitleTranslationKey(model.getConversationType()),
		create: () => {
			if (isBrowser()) windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {});
else if (isDesktop()) windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {
				minimize();
			});
		},
		remove: () => {
			windowCloseUnsubscribe();
		}
	};
	const templatePopupModel = locator.logins.isInternalUserLoggedIn() && client.isDesktopDevice() ? new TemplatePopupModel(locator.eventController, locator.logins, locator.entityClient) : null;
	const createKnowledgebaseButtonAttrs = async (editor) => {
		if (locator.logins.isInternalUserLoggedIn()) {
			const customer = await locator.logins.getUserController().loadCustomer();
			if (styles.isDesktopLayout() && templatePopupModel && locator.logins.getUserController().getTemplateMemberships().length > 0 && isCustomizationEnabledForCustomer(customer, FeatureType.KnowledgeBase)) {
				const knowledgebaseModel = new KnowledgeBaseModel(locator.eventController, locator.entityClient, locator.logins.getUserController());
				await knowledgebaseModel.init();
				disposables.push(knowledgebaseModel);
				const knowledgebaseInjection = createKnowledgeBaseDialogInjection(knowledgebaseModel, templatePopupModel, editor);
				dialog.setInjectionRight(knowledgebaseInjection);
				return knowledgebaseInjection;
			} else return null;
		} else return null;
	};
	mailEditorAttrs = createMailEditorAttrs(model, blockExternalContent, model.toRecipients().length !== 0, () => dialog, templatePopupModel, createKnowledgebaseButtonAttrs, await locator.recipientsSearchModel(), alwaysBlockExternalContent);
	const shortcuts = [
		{
			key: Keys.ESC,
			exec: () => {
				minimize();
			},
			help: "close_alt"
		},
		{
			key: Keys.S,
			ctrlOrCmd: true,
			exec: () => {
				save().catch(ofClass(UserError, showUserError));
			},
			help: "save_action"
		},
		{
			key: Keys.S,
			ctrlOrCmd: true,
			shift: true,
			exec: () => {
				send();
			},
			help: "send_action"
		},
		{
			key: Keys.RETURN,
			ctrlOrCmd: true,
			exec: () => {
				send();
			},
			help: "send_action"
		}
	];
	dialog = Dialog.editDialog(headerBarAttrs, MailEditor, mailEditorAttrs);
	dialog.setCloseHandler(() => minimize());
	for (let shortcut of shortcuts) dialog.addShortcut(shortcut);
	return dialog;
}
async function newMailEditor(mailboxDetails) {
	await checkApprovalStatus(locator.logins, false);
	const { appendEmailSignature: appendEmailSignature$1 } = await import("./Signature2-chunk.js");
	const signature = appendEmailSignature$1("", locator.logins.getUserController().props);
	const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails);
	return newMailEditorFromTemplate(detailsProperties.mailboxDetails, {}, "", signature);
}
async function getExternalContentRulesForEditor(model, currentStatus) {
	let contentRules;
	const previousMail = model.getPreviousMail();
	if (!previousMail) contentRules = {
		alwaysBlockExternalContent: false,
		blockExternalContent: false
	};
else {
		const externalImageRule = await locator.configFacade.getExternalImageRule(previousMail.sender.address).catch((e) => {
			console.log("Error getting external image rule:", e);
			return ExternalImageRule.None;
		});
		let isAuthenticatedMail;
		if (previousMail.authStatus !== null) isAuthenticatedMail = previousMail.authStatus === MailAuthenticationStatus.AUTHENTICATED;
else {
			const mailDetails = await locator.mailFacade.loadMailDetailsBlob(previousMail);
			isAuthenticatedMail = mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED;
		}
		if (externalImageRule === ExternalImageRule.Block || externalImageRule === ExternalImageRule.None && model.isUserPreviousSender()) contentRules = {
			alwaysBlockExternalContent: externalImageRule === ExternalImageRule.Block,
			blockExternalContent: true
		};
else if (externalImageRule === ExternalImageRule.Allow && isAuthenticatedMail) contentRules = {
			alwaysBlockExternalContent: false,
			blockExternalContent: false
		};
else contentRules = {
			alwaysBlockExternalContent: false,
			blockExternalContent: currentStatus
		};
	}
	return contentRules;
}
async function newMailEditorAsResponse(args, blockExternalContent, inlineImages, mailboxDetails) {
	const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails);
	const model = await locator.sendMailModel(detailsProperties.mailboxDetails, detailsProperties.mailboxProperties);
	await model.initAsResponse(args, inlineImages);
	const externalImageRules = await getExternalContentRulesForEditor(model, blockExternalContent);
	return createMailEditorDialog(model, externalImageRules?.blockExternalContent, externalImageRules?.alwaysBlockExternalContent);
}
async function newMailEditorFromDraft(mail, mailDetails, attachments, inlineImages, blockExternalContent, mailboxDetails) {
	const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails);
	const model = await locator.sendMailModel(detailsProperties.mailboxDetails, detailsProperties.mailboxProperties);
	await model.initWithDraft(mail, mailDetails, attachments, inlineImages);
	const externalImageRules = await getExternalContentRulesForEditor(model, blockExternalContent);
	return createMailEditorDialog(model, externalImageRules?.blockExternalContent, externalImageRules?.alwaysBlockExternalContent);
}
async function newMailtoUrlMailEditor(mailtoUrl, confidential, mailboxDetails) {
	const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails);
	const mailTo = parseMailtoUrl(mailtoUrl);
	let dataFiles = [];
	if (mailTo.attach) {
		const attach = mailTo.attach;
		if (isDesktop()) {
			const files = await Promise.all(attach.map((uri) => locator.fileApp.readDataFile(uri)));
			dataFiles = files.filter(isNotNull);
		}
		const keepAttachments = dataFiles.length === 0 || await Dialog.confirm("attachmentWarning_msg", "attachFiles_action", () => dataFiles.map((df, i) => mithril_default(".text-break.selectable.mt-xs", { title: attach[i] }, df.name)));
		if (keepAttachments) {
			const sizeCheckResult = checkAttachmentSize(dataFiles);
			dataFiles = sizeCheckResult.attachableFiles;
			if (sizeCheckResult.tooBigFiles.length > 0) await Dialog.message("tooBigAttachment_msg", () => sizeCheckResult.tooBigFiles.map((file) => mithril_default(".text-break.selectable", file)));
		} else throw new CancelledError("user cancelled opening mail editor with attachments");
	}
	return newMailEditorFromTemplate(detailsProperties.mailboxDetails, mailTo.recipients, mailTo.subject || "", appendEmailSignature(mailTo.body || "", locator.logins.getUserController().props), dataFiles, confidential, undefined, true);
}
async function newMailEditorFromTemplate(mailboxDetails, recipients, subject, bodyText, attachments, confidential, senderMailAddress, initialChangedState) {
	const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot);
	return locator.sendMailModel(mailboxDetails, mailboxProperties).then((model) => model.initWithTemplate(recipients, subject, bodyText, attachments, confidential, senderMailAddress, initialChangedState)).then((model) => createMailEditorDialog(model));
}
function getSupportMailSignature() {
	return import("./CalendarUtils2-chunk.js").then(({ getTimeZone }) => {
		return LINE_BREAK + LINE_BREAK + "--" + `<br>Client: ${client.getIdentifier()}` + `<br>Tutanota version: ${env.versionNumber}` + `<br>Time zone: ${getTimeZone()}` + `<br>User agent:<br> ${navigator.userAgent}`;
	});
}
async function writeSupportMail(subject = "", mailboxDetails) {
	if (locator.logins.getUserController().isPremiumAccount()) {
		const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails);
		const recipients = { to: [{
			name: null,
			address: "premium@tutao.de"
		}] };
		const signature = await getSupportMailSignature();
		const dialog = await newMailEditorFromTemplate(detailsProperties.mailboxDetails, recipients, subject, signature);
		dialog.show();
		return true;
	} else return import("./PriceUtils2-chunk.js").then(({ formatPrice }) => {
		const message = lang.get("premiumOffer_msg", { "{1}": formatPrice(1, true) });
		const title = lang.get("upgradeReminderTitle_msg");
		return Dialog.reminder(title, message);
	}).then((confirm) => {
		if (confirm) import("./UpgradeSubscriptionWizard-chunk.js").then((utils) => utils.showUpgradeWizard(locator.logins));
	}).then(() => false);
}
async function writeInviteMail(referralLink) {
	const detailsProperties = await getMailboxDetailsAndProperties(null);
	const username = locator.logins.getUserController().userGroupInfo.name;
	const body = lang.get("invitationMailBody_msg", {
		"{registrationLink}": referralLink,
		"{username}": username
	});
	const { invitationSubject } = await locator.serviceExecutor.get(TranslationService, createTranslationGetIn({ lang: lang.code }));
	const dialog = await newMailEditorFromTemplate(detailsProperties.mailboxDetails, {}, invitationSubject, body, [], false);
	dialog.show();
}
async function writeGiftCardMail(link, mailboxDetails) {
	const detailsProperties = await getMailboxDetailsAndProperties(mailboxDetails);
	const bodyText = lang.get("defaultShareGiftCardBody_msg", {
		"{link}": "<a href=\"" + link + "\">" + link + "</a>",
		"{username}": locator.logins.getUserController().userGroupInfo.name
	}).split("\n").join("<br />");
	const { giftCardSubject } = await locator.serviceExecutor.get(TranslationService, createTranslationGetIn({ lang: lang.code }));
	locator.sendMailModel(detailsProperties.mailboxDetails, detailsProperties.mailboxProperties).then((model) => model.initWithTemplate({}, giftCardSubject, appendEmailSignature(bodyText, locator.logins.getUserController().props), [], false)).then((model) => createMailEditorDialog(model, false)).then((dialog) => dialog.show());
}
async function getMailboxDetailsAndProperties(mailboxDetails) {
	mailboxDetails = mailboxDetails ?? await locator.mailboxModel.getUserMailboxDetails();
	const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot);
	return {
		mailboxDetails,
		mailboxProperties
	};
}

//#endregion
export { KnowledgeBaseEntryView, MailEditor, createInitialTemplateListIfAllowed, createMailEditorAttrs, getSupportMailSignature, knowledgeBaseSearch, newMailEditor, newMailEditorAsResponse, newMailEditorFromDraft, newMailEditorFromTemplate, newMailtoUrlMailEditor, writeGiftCardMail, writeInviteMail, writeSupportMail };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbEVkaXRvci1jaHVuay5qcyIsIm5hbWVzIjpbIm1vZGVsOiBTZW5kTWFpbE1vZGVsIiwiYm91bmRpbmdSZWN0OiBDbGllbnRSZWN0IiwiZmlsZVR5cGVzPzogQXJyYXk8c3RyaW5nPiIsImRhdGFGaWxlczogQXJyYXk8RGF0YUZpbGU+IiwiaW5saW5lSW1hZ2VFbGVtZW50czogQXJyYXk8SFRNTEVsZW1lbnQ+IiwiYXR0YWNobWVudDogQXR0YWNobWVudCIsImNsZWFudXBJbmxpbmVBdHRhY2htZW50czogKGFyZzA6IEhUTUxFbGVtZW50LCBhcmcxOiBBcnJheTxIVE1MRWxlbWVudD4sIGFyZzI6IEFycmF5PEF0dGFjaG1lbnQ+KSA9PiB2b2lkIiwiZG9tRWxlbWVudDogSFRNTEVsZW1lbnQiLCJhdHRhY2htZW50czogQXJyYXk8QXR0YWNobWVudD4iLCJlbGVtZW50c1RvUmVtb3ZlOiBIVE1MRWxlbWVudFtdIiwiaXNDb25maWRlbnRpYWw6IGJvb2xlYW4iLCJ2bm9kZTogVm5vZGU8VGVtcGxhdGVSZXN1bHRSb3dBdHRycz4iLCJ0ZXh0OiBzdHJpbmciLCJlOiBLZXlib2FyZEV2ZW50Iiwidm5vZGU6IFZub2RlPFRlbXBsYXRlU2VhcmNoQmFyQXR0cnM+IiwiYTogVGVtcGxhdGVTZWFyY2hCYXJBdHRycyIsImU6IEtleWJvYXJkRXZlbnQiLCJ2bm9kZTogQ1Zub2RlPFNjcm9sbFNlbGVjdExpc3RBdHRyczxUPj4iLCJ2bm9kZTogQ1Zub2RlRE9NPFNjcm9sbFNlbGVjdExpc3RBdHRyczxUPj4iLCJpdGVtOiBUIiwidm5vZGU6IFZub2RlPFNjcm9sbFNlbGVjdExpc3RBdHRyczxUPj4iLCJlOiBNb3VzZUV2ZW50Iiwic2VsZWN0ZWRJdGVtOiBUIHwgbnVsbCIsIml0ZW1zOiBSZWFkb25seUFycmF5PFQ+Iiwic2Nyb2xsRG9tOiBIVE1MRWxlbWVudCIsInRlbXBsYXRlTW9kZWw6IFRlbXBsYXRlUG9wdXBNb2RlbCIsImVkaXRvcjogRWRpdG9yIiwidGVtcGxhdGU6IEVtYWlsVGVtcGxhdGUgfCBudWxsIiwiaGlnaGxpZ2h0ZWRUZXh0OiBzdHJpbmciLCJ0ZXh0OiBzdHJpbmciLCJyZWN0OiBQb3NSZWN0Iiwib25TZWxlY3Q6IChhcmcwOiBzdHJpbmcpID0+IHZvaWQiLCJpbml0aWFsU2VhcmNoU3RyaW5nOiBzdHJpbmciLCJyZXN0b3JlRWRpdG9yRm9jdXM/OiAoKSA9PiB2b2lkIiwidmFsdWU6IHN0cmluZyIsImU6IE1vdXNlRXZlbnQiLCJlOiBLZXlib2FyZEV2ZW50Iiwic2VsZWN0ZWRUZW1wbGF0ZTogRW1haWxUZW1wbGF0ZSIsImxhbmdDb2RlOiBMYW5ndWFnZUNvZGUiLCJ0ZW1wbGF0ZTogRW1haWxUZW1wbGF0ZSIsIl86IEVtYWlsVGVtcGxhdGUiLCJlOiBFdmVudCIsInRlbXBsYXRlVG9FZGl0OiBFbWFpbFRlbXBsYXRlIHwgbnVsbCIsImdyb3VwUm9vdDogVGVtcGxhdGVHcm91cFJvb3QiLCJlZGl0b3I6IEVkaXRvciIsInRlbXBsYXRlTW9kZWw6IFRlbXBsYXRlUG9wdXBNb2RlbCIsImV2ZW50OiBLZXlib2FyZEV2ZW50IiwiZXZlbnQ6IEN1c3RvbUV2ZW50PHsgcmFuZ2U6IFJhbmdlIHwgbnVsbCB9PiIsImxhbmc6IExhbmd1YWdlVmlld01vZGVsIiwibGFuZyIsInZub2RlOiBWbm9kZTxLbm93bGVkZ2ViYXNlTGlzdEVudHJ5QXR0cnM+IiwiYXR0cnM6IEtub3dsZWRnZUJhc2VFbnRyeVZpZXdBdHRycyIsImV2ZW50OiBNb3VzZUV2ZW50IiwiZW50cnk6IEtub3dsZWRnZUJhc2VFbnRyeSIsImV2ZW50OiBFdmVudCIsInN0cmVhbSIsIm1vZGVsOiBLbm93bGVkZ2VCYXNlTW9kZWwiLCJhdHRyczogS25vd2xlZGdlYmFzZURpYWxvZ0NvbnRlbnRBdHRycyIsImVudHJ5OiBLbm93bGVkZ2VCYXNlRW50cnkiLCJrbm93bGVkZ2VCYXNlOiBLbm93bGVkZ2VCYXNlTW9kZWwiLCJ0ZW1wbGF0ZU1vZGVsOiBUZW1wbGF0ZVBvcHVwTW9kZWwiLCJlZGl0b3I6IEVkaXRvciIsImtub3dsZWRnZWJhc2VBdHRyczogS25vd2xlZGdlYmFzZURpYWxvZ0NvbnRlbnRBdHRycyIsImF0dHJzOiBLbm93bGVkZ2ViYXNlRGlhbG9nQ29udGVudEF0dHJzIiwiaXNEaWFsb2dWaXNpYmxlOiBTdHJlYW08Ym9vbGVhbj4iLCJlbnRyeTogS25vd2xlZGdlQmFzZUVudHJ5IiwibW9kZWw6IEtub3dsZWRnZUJhc2VNb2RlbCIsImVudHJ5VG9FZGl0OiBLbm93bGVkZ2VCYXNlRW50cnkgfCBudWxsIiwiZ3JvdXBSb290OiBUZW1wbGF0ZUdyb3VwUm9vdCIsImlucHV0OiBzdHJpbmciLCJhbGxFbnRyaWVzOiBSZWFkb25seUFycmF5PEtub3dsZWRnZUJhc2VFbnRyeT4iLCJlbnRyeTE6IEtub3dsZWRnZUJhc2VFbnRyeSIsImVudHJ5MjogS25vd2xlZGdlQmFzZUVudHJ5IiwiZXZlbnRDb250cm9sbGVyOiBFdmVudENvbnRyb2xsZXIiLCJlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCIsInVzZXJDb250cm9sbGVyOiBVc2VyQ29udHJvbGxlciIsIm5ld0dyb3VwSW5zdGFuY2VzOiBUZW1wbGF0ZUdyb3VwSW5zdGFuY2VbXSIsImVudHJ5OiBLbm93bGVkZ2VCYXNlRW50cnkiLCJ0ZW1wbGF0ZTogRW1haWxUZW1wbGF0ZSIsImVtYWlsQ29udGVudDogc3RyaW5nIiwiaW5wdXQ6IHN0cmluZyIsImFjdGlvbjogc3RyaW5nIiwia2V5d29yZDogc3RyaW5nIiwidGVtcGxhdGVJZDogSWRUdXBsZSIsImluc3RhbmNlIiwidXBkYXRlczogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGVEYXRhPiIsInRlbXBsYXRlR3JvdXBzOiBBcnJheTxUZW1wbGF0ZUdyb3VwSW5zdGFuY2U+Iiwidm5vZGU6IFZub2RlPE1pbmltaXplZEVkaXRvck92ZXJsYXlBdHRycz4iLCJ1cGRhdGVzOiBSZWFkb25seUFycmF5PEVudGl0eVVwZGF0ZURhdGE+IiwiZXZlbnRPd25lckdyb3VwSWQ6IElkIiwibWluaW1pemVkRWRpdG9yOiBNaW5pbWl6ZWRFZGl0b3IiLCJ2aWV3TW9kZWw6IE1pbmltaXplZE1haWxFZGl0b3JWaWV3TW9kZWwiLCJzYXZlU3RhdHVzOiBTYXZlU3RhdHVzIiwiZGlhbG9nOiBEaWFsb2ciLCJzZW5kTWFpbE1vZGVsOiBTZW5kTWFpbE1vZGVsIiwidmlld01vZGVsOiBNaW5pbWl6ZWRNYWlsRWRpdG9yVmlld01vZGVsIiwiZXZlbnRDb250cm9sbGVyOiBFdmVudENvbnRyb2xsZXIiLCJkaXNwb3NlOiAoKSA9PiB2b2lkIiwic2F2ZVN0YXR1czogU3RyZWFtPFNhdmVTdGF0dXM+IiwiY2xvc2VPdmVybGF5RnVuY3Rpb246ICgpID0+IHZvaWQiLCJtaW5pbWl6ZWRFZGl0b3I6IE1pbmltaXplZEVkaXRvciIsIm1vZGVsOiBTZW5kTWFpbE1vZGVsIiwiZG9CbG9ja0V4dGVybmFsQ29udGVudDogYm9vbGVhbiIsImRvRm9jdXNFZGl0b3JPbkxvYWQ6IGJvb2xlYW4iLCJkaWFsb2c6IGxhenk8RGlhbG9nPiIsInRlbXBsYXRlTW9kZWw6IFRlbXBsYXRlUG9wdXBNb2RlbCB8IG51bGwiLCJrbm93bGVkZ2VCYXNlSW5qZWN0aW9uOiAoZWRpdG9yOiBFZGl0b3IpID0+IFByb21pc2U8RGlhbG9nSW5qZWN0aW9uUmlnaHRBdHRyczxLbm93bGVkZ2ViYXNlRGlhbG9nQ29udGVudEF0dHJzPiB8IG51bGw+Iiwic2VhcmNoOiBSZWNpcGllbnRzU2VhcmNoTW9kZWwiLCJhbHdheXNCbG9ja0V4dGVybmFsQ29udGVudDogYm9vbGVhbiIsInZub2RlOiBWbm9kZTxNYWlsRWRpdG9yQXR0cnM+Iiwic2hvcnRjdXRzOiBTaG9ydGN1dFtdIiwiY2lkOiBzdHJpbmciLCJjb25maWRlbnRpYWxCdXR0b25BdHRyczogVG9nZ2xlQnV0dG9uQXR0cnMiLCJhdHRhY2hGaWxlc0J1dHRvbkF0dHJzOiBJY29uQnV0dG9uQXR0cnMiLCJzdWJqZWN0RmllbGRBdHRyczogVGV4dEZpZWxkQXR0cnMiLCJlZGl0Q3VzdG9tTm90aWZpY2F0aW9uTWFpbEF0dHJzOiBJY29uQnV0dG9uQXR0cnMgfCBudWxsIiwiZTogTW91c2VFdmVudCIsImV2OiBEcmFnRXZlbnQiLCJzZWxlY3Rpb246IHN0cmluZyIsInZub2RlIiwidjogc3RyaW5nIiwiYSIsImF0dHJzOiBNYWlsRWRpdG9yQXR0cnMiLCJzaG93QnV0dG9uOiBCYW5uZXJCdXR0b25BdHRycyIsInN0YXR1czogQ29udGVudEJsb2NraW5nU3RhdHVzIiwia25vd2xlZGdlQmFzZUluamVjdGlvbjogRGlhbG9nSW5qZWN0aW9uUmlnaHRBdHRyczxLbm93bGVkZ2ViYXNlRGlhbG9nQ29udGVudEF0dHJzPiIsImV2ZW50OiBFdmVudCIsInJlY3Q6IERPTVJlY3QiLCJmaWxlczogUmVhZG9ubHlBcnJheTxEYXRhRmlsZSB8IEZpbGVSZWZlcmVuY2U+IiwiZmllbGQ6IFJlY2lwaWVudEZpZWxkIiwiZmllbGRUZXh0OiBTdHJlYW08c3RyaW5nPiIsInJlY2lwaWVudDogUmVzb2x2YWJsZVJlY2lwaWVudCIsImNvbnRhY3RFbGVtZW50SWQ6IElkIiwiY29udGFjdExpc3RJZDogc3RyaW5nIiwiaWQ6IElkVHVwbGUiLCJjb250YWN0OiBDb250YWN0IiwiY29udGV4dEJ1dHRvbnM6IEFycmF5PERyb3Bkb3duQ2hpbGRBdHRycz4iLCJjb250YWN0TGlzdElkOiBJZCIsImRvbUVsZW1lbnQ6IEhUTUxFbGVtZW50IiwiZmFkZWluOiBib29sZWFuIiwiZGlhbG9nOiBEaWFsb2ciLCJtYWlsRWRpdG9yQXR0cnM6IE1haWxFZGl0b3JBdHRycyIsInNob3dQcm9ncmVzczogYm9vbGVhbiIsImRpc3Bvc2FibGVzOiB7IGRpc3Bvc2U6ICgpID0+IHVua25vd24gfVtdIiwiaGVhZGVyQmFyQXR0cnM6IERpYWxvZ0hlYWRlckJhckF0dHJzIiwiZWRpdG9yOiBFZGl0b3IiLCJtYWlsYm94RGV0YWlsczogTWFpbGJveERldGFpbCIsImN1cnJlbnRTdGF0dXM6IGJvb2xlYW4iLCJlOiB1bmtub3duIiwiYXJnczogSW5pdEFzUmVzcG9uc2VBcmdzIiwiYmxvY2tFeHRlcm5hbENvbnRlbnQ6IGJvb2xlYW4iLCJpbmxpbmVJbWFnZXM6IElubGluZUltYWdlcyIsIm1haWxib3hEZXRhaWxzPzogTWFpbGJveERldGFpbCIsIm1haWw6IE1haWwiLCJtYWlsRGV0YWlsczogTWFpbERldGFpbHMiLCJhdHRhY2htZW50czogVHV0YW5vdGFGaWxlW10iLCJtYWlsdG9Vcmw6IHN0cmluZyIsImNvbmZpZGVudGlhbDogYm9vbGVhbiIsImRhdGFGaWxlczogQXR0YWNobWVudFtdIiwicmVjaXBpZW50czogUmVjaXBpZW50cyIsInN1YmplY3Q6IHN0cmluZyIsImJvZHlUZXh0OiBzdHJpbmciLCJhdHRhY2htZW50cz86IFJlYWRvbmx5QXJyYXk8QXR0YWNobWVudD4iLCJjb25maWRlbnRpYWw/OiBib29sZWFuIiwic2VuZGVyTWFpbEFkZHJlc3M/OiBzdHJpbmciLCJpbml0aWFsQ2hhbmdlZFN0YXRlPzogYm9vbGVhbiIsInJlZmVycmFsTGluazogc3RyaW5nIiwibGluazogc3RyaW5nIiwibWFpbGJveERldGFpbHM6IE1haWxib3hEZXRhaWwgfCBudWxsIHwgdW5kZWZpbmVkIl0sInNvdXJjZXMiOlsiLi4vc3JjL21haWwtYXBwL21haWwvZWRpdG9yL01haWxFZGl0b3JWaWV3TW9kZWwudHMiLCIuLi9zcmMvbWFpbC1hcHAvdGVtcGxhdGVzL3ZpZXcvVGVtcGxhdGVDb25zdGFudHMudHMiLCIuLi9zcmMvbWFpbC1hcHAvdGVtcGxhdGVzL3ZpZXcvVGVtcGxhdGVQb3B1cFJlc3VsdFJvdy50cyIsIi4uL3NyYy9tYWlsLWFwcC90ZW1wbGF0ZXMvdmlldy9UZW1wbGF0ZUV4cGFuZGVyLnRzIiwiLi4vc3JjL21haWwtYXBwL3RlbXBsYXRlcy92aWV3L1RlbXBsYXRlU2VhcmNoQmFyLnRzIiwiLi4vc3JjL21haWwtYXBwL3RlbXBsYXRlcy9UZW1wbGF0ZUdyb3VwVXRpbHMudHMiLCIuLi9zcmMvY29tbW9uL2d1aS9TY3JvbGxTZWxlY3RMaXN0LnRzIiwiLi4vc3JjL21haWwtYXBwL3RlbXBsYXRlcy92aWV3L1RlbXBsYXRlUG9wdXAudHMiLCIuLi9zcmMvbWFpbC1hcHAvdGVtcGxhdGVzL3ZpZXcvVGVtcGxhdGVTaG9ydGN1dExpc3RlbmVyLnRzIiwiLi4vc3JjL21haWwtYXBwL2tub3dsZWRnZWJhc2Uvdmlldy9Lbm93bGVkZ2VCYXNlTGlzdEVudHJ5LnRzIiwiLi4vc3JjL21haWwtYXBwL2tub3dsZWRnZWJhc2Uvdmlldy9Lbm93bGVkZ2VCYXNlRW50cnlWaWV3LnRzIiwiLi4vc3JjL21haWwtYXBwL2tub3dsZWRnZWJhc2Uvdmlldy9Lbm93bGVkZ2VCYXNlRGlhbG9nQ29udGVudC50cyIsIi4uL3NyYy9tYWlsLWFwcC9rbm93bGVkZ2ViYXNlL3ZpZXcvS25vd2xlZGdlQmFzZURpYWxvZy50cyIsIi4uL3NyYy9tYWlsLWFwcC9rbm93bGVkZ2ViYXNlL21vZGVsL0tub3dsZWRnZUJhc2VTZWFyY2hGaWx0ZXIudHMiLCIuLi9zcmMvbWFpbC1hcHAva25vd2xlZGdlYmFzZS9tb2RlbC9Lbm93bGVkZ2VCYXNlTW9kZWwudHMiLCIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L01pbmltaXplZEVkaXRvck92ZXJsYXkudHMiLCIuLi9zcmMvbWFpbC1hcHAvbWFpbC92aWV3L01pbmltaXplZE1haWxFZGl0b3JPdmVybGF5LnRzIiwiLi4vc3JjL21haWwtYXBwL21haWwvZWRpdG9yL01haWxFZGl0b3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHR5cGUgeyBBdHRhY2htZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9TZW5kTWFpbE1vZGVsLmpzXCJcbmltcG9ydCB7IFNlbmRNYWlsTW9kZWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L1NlbmRNYWlsTW9kZWwuanNcIlxuaW1wb3J0IHsgZGVib3VuY2UsIGZpbmRBbGxBbmRSZW1vdmUsIGlzTm90TnVsbCwgb2ZDbGFzcywgcmVtb3ZlIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBNb2RlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBQZXJtaXNzaW9uRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUGVybWlzc2lvbkVycm9yXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IEZpbGVOb3RGb3VuZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL0ZpbGVOb3RGb3VuZEVycm9yXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgRmlsZU9wZW5FcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9GaWxlT3BlbkVycm9yXCJcbmltcG9ydCB7IFVzZXJFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vVXNlckVycm9yXCJcbmltcG9ydCB7IHNob3dVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvRXJyb3JIYW5kbGVySW1wbFwiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IEZpbGVSZWZlcmVuY2UsIGlzRGF0YUZpbGUsIGlzRmlsZVJlZmVyZW5jZSwgaXNUdXRhbm90YUZpbGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRmlsZVV0aWxzXCJcbmltcG9ydCB7IERhdGFGaWxlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0RhdGFGaWxlXCJcbmltcG9ydCB7IHNob3dGaWxlQ2hvb3NlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZmlsZS9GaWxlQ29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHsgQXR0YWNobWVudEJ1YmJsZUF0dHJzLCBBdHRhY2htZW50VHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0F0dGFjaG1lbnRCdWJibGUuanNcIlxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hvb3NlQW5kQXR0YWNoRmlsZShcblx0bW9kZWw6IFNlbmRNYWlsTW9kZWwsXG5cdGJvdW5kaW5nUmVjdDogQ2xpZW50UmVjdCxcblx0ZmlsZVR5cGVzPzogQXJyYXk8c3RyaW5nPixcbik6IFByb21pc2U8UmVhZG9ubHlBcnJheTxEYXRhRmlsZSB8IEZpbGVSZWZlcmVuY2U+IHwgdm9pZD4ge1xuXHRib3VuZGluZ1JlY3QuaGVpZ2h0ID0gTWF0aC5yb3VuZChib3VuZGluZ1JlY3QuaGVpZ2h0KVxuXHRib3VuZGluZ1JlY3Qud2lkdGggPSBNYXRoLnJvdW5kKGJvdW5kaW5nUmVjdC53aWR0aClcblx0Ym91bmRpbmdSZWN0LnggPSBNYXRoLnJvdW5kKGJvdW5kaW5nUmVjdC54KVxuXHRib3VuZGluZ1JlY3QueSA9IE1hdGgucm91bmQoYm91bmRpbmdSZWN0LnkpXG5cdHRyeSB7XG5cdFx0Y29uc3QgZmlsZXMgPSBhd2FpdCBzaG93RmlsZUNob29zZXJGb3JBdHRhY2htZW50cyhib3VuZGluZ1JlY3QsIGZpbGVUeXBlcylcblx0XHRpZiAoIWZpbGVzIHx8IGZpbGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cdFx0c3dpdGNoIChlbnYubW9kZSkge1xuXHRcdFx0Y2FzZSBNb2RlLkFwcDpcblx0XHRcdFx0Ly8gd2UgaGF2ZSBmaWxlIHJlZnMgYW5kIHdhbnQgdG8ga2VlcCB0aGVtXG5cdFx0XHRcdG1vZGVsLmF0dGFjaEZpbGVzKGZpbGVzKVxuXHRcdFx0XHRyZXR1cm4gZmlsZXNcblx0XHRcdGNhc2UgTW9kZS5EZXNrdG9wOiB7XG5cdFx0XHRcdC8vIHRoaXMgaXMgaW1wb3J0YW50IGZvciB0aGUgZGVza3RvcCBjbGllbnQgc28gaXQgY2FuIGF0dGFjaCB0aGVtIGFzIGlubGluZSBpbWFnZXMuIC8vIHdlIGhhdmUgZmlsZSByZWZzIGFuZCB3YW50IHRvIHJlYWQgdGhlbS5cblx0XHRcdFx0Y29uc3QgZGF0YUZpbGVzOiBBcnJheTxEYXRhRmlsZT4gPSAoXG5cdFx0XHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoKGZpbGVzIGFzIEFycmF5PEZpbGVSZWZlcmVuY2U+KS5tYXAoYXN5bmMgKGYpID0+IGxvY2F0b3IuZmlsZUFwcC5yZWFkRGF0YUZpbGUoZi5sb2NhdGlvbikpKVxuXHRcdFx0XHQpLmZpbHRlcihpc05vdE51bGwpXG5cdFx0XHRcdG1vZGVsLmF0dGFjaEZpbGVzKGRhdGFGaWxlcylcblx0XHRcdFx0cmV0dXJuIGRhdGFGaWxlc1xuXHRcdFx0fVxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0Ly8gd2UgaGF2ZSBkYXRhIGZpbGVzIGFuZCB3YW50IHRvIGtlZXAgdGhlbVxuXHRcdFx0XHRtb2RlbC5hdHRhY2hGaWxlcyhmaWxlcylcblx0XHRcdFx0cmV0dXJuIGZpbGVzXG5cdFx0fVxuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKGUgaW5zdGFuY2VvZiBVc2VyRXJyb3IpIHtcblx0XHRcdGF3YWl0IHNob3dVc2VyRXJyb3IoZSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgbXNnID0gZS5tZXNzYWdlIHx8IFwidW5rbm93biBlcnJvclwiXG5cdFx0XHRjb25zb2xlLmVycm9yKFwiY291bGQgbm90IGF0dGFjaCBmaWxlczpcIiwgbXNnKVxuXHRcdH1cblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0ZpbGVDaG9vc2VyRm9yQXR0YWNobWVudHMoYm91bmRpbmdSZWN0OiBDbGllbnRSZWN0LCBmaWxlVHlwZXM/OiBBcnJheTxzdHJpbmc+KTogUHJvbWlzZTxSZWFkb25seUFycmF5PEZpbGVSZWZlcmVuY2UgfCBEYXRhRmlsZT4gfCB2b2lkPiB7XG5cdGNvbnN0IGZpbGVTZWxlY3RvciA9IFtNb2RlLkFwcCwgTW9kZS5EZXNrdG9wXS5pbmNsdWRlcyhlbnYubW9kZSlcblx0XHQ/IGxvY2F0b3IuZmlsZUFwcC5vcGVuRmlsZUNob29zZXIoYm91bmRpbmdSZWN0LCBmaWxlVHlwZXMpXG5cdFx0OiBzaG93RmlsZUNob29zZXIodHJ1ZSwgZmlsZVR5cGVzKVxuXHRyZXR1cm4gZmlsZVNlbGVjdG9yXG5cdFx0LmNhdGNoKFxuXHRcdFx0b2ZDbGFzcyhQZXJtaXNzaW9uRXJyb3IsICgpID0+IHtcblx0XHRcdFx0RGlhbG9nLm1lc3NhZ2UoXCJmaWxlQWNjZXNzRGVuaWVkTW9iaWxlX21zZ1wiKVxuXHRcdFx0fSksXG5cdFx0KVxuXHRcdC5jYXRjaChcblx0XHRcdG9mQ2xhc3MoRmlsZU5vdEZvdW5kRXJyb3IsICgpID0+IHtcblx0XHRcdFx0RGlhbG9nLm1lc3NhZ2UoXCJjb3VsZE5vdEF0dGFjaEZpbGVfbXNnXCIpXG5cdFx0XHR9KSxcblx0XHQpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBdHRhY2htZW50QnViYmxlQXR0cnMobW9kZWw6IFNlbmRNYWlsTW9kZWwsIGlubGluZUltYWdlRWxlbWVudHM6IEFycmF5PEhUTUxFbGVtZW50Pik6IEFycmF5PEF0dGFjaG1lbnRCdWJibGVBdHRycz4ge1xuXHRyZXR1cm4gbW9kZWwuZ2V0QXR0YWNobWVudHMoKS5tYXAoKGF0dGFjaG1lbnQpID0+ICh7XG5cdFx0YXR0YWNobWVudCxcblx0XHRvcGVuOiBudWxsLFxuXHRcdGRvd25sb2FkOiAoKSA9PiBfZG93bmxvYWRBdHRhY2htZW50KGF0dGFjaG1lbnQpLFxuXHRcdHJlbW92ZTogKCkgPT4ge1xuXHRcdFx0bW9kZWwucmVtb3ZlQXR0YWNobWVudChhdHRhY2htZW50KVxuXG5cdFx0XHQvLyBJZiBhbiBhdHRhY2htZW50IGhhcyBhIGNpZCBpdCBtZWFucyBpdCBjb3VsZCBiZSBpbiB0aGUgZWRpdG9yJ3MgaW5saW5lIGltYWdlcyB0b29cblx0XHRcdGlmIChhdHRhY2htZW50LmNpZCkge1xuXHRcdFx0XHRjb25zdCBpbWFnZUVsZW1lbnQgPSBpbmxpbmVJbWFnZUVsZW1lbnRzLmZpbmQoKGUpID0+IGUuZ2V0QXR0cmlidXRlKFwiY2lkXCIpID09PSBhdHRhY2htZW50LmNpZClcblxuXHRcdFx0XHRpZiAoaW1hZ2VFbGVtZW50KSB7XG5cdFx0XHRcdFx0aW1hZ2VFbGVtZW50LnJlbW92ZSgpXG5cdFx0XHRcdFx0cmVtb3ZlKGlubGluZUltYWdlRWxlbWVudHMsIGltYWdlRWxlbWVudClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRtLnJlZHJhdygpXG5cdFx0fSxcblx0XHRmaWxlSW1wb3J0OiBudWxsLFxuXHRcdHR5cGU6IEF0dGFjaG1lbnRUeXBlLkdFTkVSSUMsXG5cdH0pKVxufVxuXG5hc3luYyBmdW5jdGlvbiBfZG93bmxvYWRBdHRhY2htZW50KGF0dGFjaG1lbnQ6IEF0dGFjaG1lbnQpIHtcblx0dHJ5IHtcblx0XHRpZiAoaXNGaWxlUmVmZXJlbmNlKGF0dGFjaG1lbnQpKSB7XG5cdFx0XHRhd2FpdCBsb2NhdG9yLmZpbGVBcHAub3BlbihhdHRhY2htZW50KVxuXHRcdH0gZWxzZSBpZiAoaXNEYXRhRmlsZShhdHRhY2htZW50KSkge1xuXHRcdFx0YXdhaXQgbG9jYXRvci5maWxlQ29udHJvbGxlci5zYXZlRGF0YUZpbGUoYXR0YWNobWVudClcblx0XHR9IGVsc2UgaWYgKGlzVHV0YW5vdGFGaWxlKGF0dGFjaG1lbnQpKSB7XG5cdFx0XHRhd2FpdCBsb2NhdG9yLmZpbGVDb250cm9sbGVyLmRvd25sb2FkKGF0dGFjaG1lbnQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwiYXR0YWNobWVudCBpcyBuZWl0aGVyIHJlZmVyZW5jZSwgZGF0YWZpbGUgbm9yIHR1dGFub3RhZmlsZSFcIilcblx0XHR9XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAoZSBpbnN0YW5jZW9mIEZpbGVPcGVuRXJyb3IpIHtcblx0XHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShcImNhbk5vdE9wZW5GaWxlT25EZXZpY2VfbXNnXCIpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IG1zZyA9IGUubWVzc2FnZSB8fCBcInVua25vd24gZXJyb3JcIlxuXHRcdFx0Y29uc29sZS5lcnJvcihcImNvdWxkIG5vdCBvcGVuIGZpbGU6XCIsIG1zZylcblx0XHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShcImVycm9yRHVyaW5nRmlsZU9wZW5fbXNnXCIpXG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCBjb25zdCBjbGVhbnVwSW5saW5lQXR0YWNobWVudHM6IChhcmcwOiBIVE1MRWxlbWVudCwgYXJnMTogQXJyYXk8SFRNTEVsZW1lbnQ+LCBhcmcyOiBBcnJheTxBdHRhY2htZW50PikgPT4gdm9pZCA9IGRlYm91bmNlKFxuXHQ1MCxcblx0KGRvbUVsZW1lbnQ6IEhUTUxFbGVtZW50LCBpbmxpbmVJbWFnZUVsZW1lbnRzOiBBcnJheTxIVE1MRWxlbWVudD4sIGF0dGFjaG1lbnRzOiBBcnJheTxBdHRhY2htZW50PikgPT4ge1xuXHRcdC8vIFByZXZpb3VzbHkgd2UgcmVwbGllZCBvbiBzdWJ0cmVlIG9wdGlvbiBvZiBNdXRhdGlvbk9ic2VydmVyIHRvIHJlY2VpdmUgaW5mbyB3aGVuIG5lc3RlZCBjaGlsZCBpcyByZW1vdmVkLlxuXHRcdC8vIEl0IHdvcmtzIGJ1dCBpdCBkb2Vzbid0IHdvcmsgaWYgdGhlIHBhcmVudCBvZiB0aGUgbmVzdGVkIGNoaWxkIGlzIHJlbW92ZWQsIHdlIHdvdWxkIGhhdmUgdG8gZ28gb3ZlciBlYWNoIG11dGF0aW9uXG5cdFx0Ly8gYW5kIGNoZWNrIGVhY2ggZGVzY2VuZGFudCBhbmQgaWYgaXQncyBhbiBpbWFnZSB3aXRoIENJRCBvciBub3QuXG5cdFx0Ly8gSXQncyBlYXNpZXIgYW5kIGZhc3RlciB0byBqdXN0IGdvIG92ZXIgZWFjaCBpbmxpbmUgaW1hZ2UgdGhhdCB3ZSBrbm93IGFib3V0LiBJdCdzIG1vcmUgYm9va2tlZXBpbmcgYnV0IGl0J3MgZWFzaWVyXG5cdFx0Ly8gY29kZSB3aGljaCB0b3VjaGVzIGxlc3MgZG9tZS5cblx0XHQvL1xuXHRcdC8vIEFsdGVybmF0aXZlIHdvdWxkIGJlIG9ic2VydmUgdGhlIHBhcmVudCBvZiBlYWNoIGlubGluZSBpbWFnZSBidXQgdGhhdCdzIG1vcmUgY29tcGxleGl0eSBhbmQgd2UgbmVlZCB0byB0YWtlIGNhcmUgb2Zcblx0XHQvLyBuZXcgKGp1c3QgaW5zZXJ0ZWQpIGlubGluZSBpbWFnZXMgYW5kIGFsc28gYXNzaWduIGxpc3RlbmVyIHRoZXJlLlxuXHRcdC8vIERvaW5nIHRoaXMgY2hlY2sgaW5zdGVhZCBvZiByZWx5aW5nIG9uIG11dGF0aW9ucyBhbHNvIGhlbHBzIHdpdGggdGhlIGNhc2Ugd2hlbiBub2RlIGlzIHJlbW92ZWQgYnV0IGluc2VydGVkIGFnYWluXG5cdFx0Ly8gYnJpZWZseSwgZS5nLiBpZiBzb21lIHRleHQgaXMgaW5zZXJ0ZWQgYmVmb3JlL2FmdGVyIHRoZSBlbGVtZW50LCBTcXVpcmUgd291bGQgcHV0IGl0IGludG8gYW5vdGhlciBkaWZmIGFuZCB0aGlzXG5cdFx0Ly8gbWVhbnMgcmVtb3ZhbCArIGluc2VydGlvbi5cblx0XHRjb25zdCBlbGVtZW50c1RvUmVtb3ZlOiBIVE1MRWxlbWVudFtdID0gW11cblx0XHRmb3IgKGNvbnN0IGlubGluZUltYWdlIG9mIGlubGluZUltYWdlRWxlbWVudHMpIHtcblx0XHRcdGlmIChkb21FbGVtZW50ICYmICFkb21FbGVtZW50LmNvbnRhaW5zKGlubGluZUltYWdlKSkge1xuXHRcdFx0XHRjb25zdCBjaWQgPSBpbmxpbmVJbWFnZS5nZXRBdHRyaWJ1dGUoXCJjaWRcIilcblx0XHRcdFx0Y29uc3QgYXR0YWNobWVudEluZGV4ID0gYXR0YWNobWVudHMuZmluZEluZGV4KChhKSA9PiBhLmNpZCA9PT0gY2lkKVxuXG5cdFx0XHRcdGlmIChhdHRhY2htZW50SW5kZXggIT09IC0xKSB7XG5cdFx0XHRcdFx0YXR0YWNobWVudHMuc3BsaWNlKGF0dGFjaG1lbnRJbmRleCwgMSlcblx0XHRcdFx0XHRlbGVtZW50c1RvUmVtb3ZlLnB1c2goaW5saW5lSW1hZ2UpXG5cdFx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGZpbmRBbGxBbmRSZW1vdmUoaW5saW5lSW1hZ2VFbGVtZW50cywgKGltYWdlRWxlbWVudCkgPT4gZWxlbWVudHNUb1JlbW92ZS5pbmNsdWRlcyhpbWFnZUVsZW1lbnQpKVxuXHR9LFxuKVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlkZW50aWFsU3RhdGVNZXNzYWdlKGlzQ29uZmlkZW50aWFsOiBib29sZWFuKTogc3RyaW5nIHtcblx0cmV0dXJuIGlzQ29uZmlkZW50aWFsID8gbGFuZy5nZXQoXCJjb25maWRlbnRpYWxTdGF0dXNfbXNnXCIpIDogbGFuZy5nZXQoXCJub25Db25maWRlbnRpYWxTdGF0dXNfbXNnXCIpXG59XG4iLCJleHBvcnQgY29uc3QgVEVNUExBVEVfUE9QVVBfSEVJR0hUID0gMzQwXG5leHBvcnQgY29uc3QgVEVNUExBVEVfUE9QVVBfVFdPX0NPTFVNTl9NSU5fV0lEVEggPSA2MDBcbmV4cG9ydCBjb25zdCBURU1QTEFURV9MSVNUX0VOVFJZX0hFSUdIVCA9IDQ3XG5leHBvcnQgY29uc3QgVEVNUExBVEVfTElTVF9FTlRSWV9XSURUSCA9IDM1NFxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBweCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemVcIlxuaW1wb3J0IHR5cGUgeyBFbWFpbFRlbXBsYXRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgVEVNUExBVEVfU0hPUlRDVVRfUFJFRklYIH0gZnJvbSBcIi4uL21vZGVsL1RlbXBsYXRlUG9wdXBNb2RlbC5qc1wiXG5pbXBvcnQgeyBURU1QTEFURV9MSVNUX0VOVFJZX0hFSUdIVCB9IGZyb20gXCIuL1RlbXBsYXRlQ29uc3RhbnRzLmpzXCJcblxuZXhwb3J0IHR5cGUgVGVtcGxhdGVSZXN1bHRSb3dBdHRycyA9IHtcblx0dGVtcGxhdGU6IEVtYWlsVGVtcGxhdGVcbn1cblxuLyoqXG4gKiAgIHJlbmRlcnMgb25lIGVudHJ5IG9mIHRoZSBsaXN0IGluIHRoZSB0ZW1wbGF0ZSBwb3B1cFxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVQb3B1cFJlc3VsdFJvdyBpbXBsZW1lbnRzIENvbXBvbmVudDxUZW1wbGF0ZVJlc3VsdFJvd0F0dHJzPiB7XG5cdHZpZXcodm5vZGU6IFZub2RlPFRlbXBsYXRlUmVzdWx0Um93QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgdGl0bGUsIHRhZyB9ID0gdm5vZGUuYXR0cnMudGVtcGxhdGVcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZsZXguZmxleC1jb2x1bW4ub3ZlcmZsb3ctaGlkZGVuLmZ1bGwtd2lkdGgubWwtc1wiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdGhlaWdodDogcHgoVEVNUExBVEVfTElTVF9FTlRSWV9IRUlHSFQpLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHQvLyB0aGlzIHRpdGxlIGlzIGZvciB0aGUgaG92ZXIgdGV4dFxuXHRcdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHQvLyBtYXJnaW5MZWZ0IDRweCBiZWNhdXNlIGJvcmRlci1yYWRpdXMgb2YgdGFnIGhhcyBtYXJnaW4gb2YgNHB4XG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIudGV4dC1lbGxpcHNpcy5zbWFsbGVyXCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0bWFyZ2luTGVmdDogXCI0cHhcIixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR0aXRsZSxcblx0XHRcdFx0KSxcblx0XHRcdFx0bShcIi5mbGV4LmJhZGdlLWxpbmUtaGVpZ2h0LnRleHQtZWxsaXBzaXNcIiwgW1xuXHRcdFx0XHRcdHRhZ1xuXHRcdFx0XHRcdFx0PyBtKFwiLnNtYWxsLmtleXdvcmQtYnViYmxlLW5vLXBhZGRpbmcucGwtcy5wci1zLmJvcmRlci1yYWRpdXMubm8td3JhcC5zbWFsbC5taW4tY29udGVudFwiLCBURU1QTEFURV9TSE9SVENVVF9QUkVGSVggKyB0YWcudG9Mb3dlckNhc2UoKSlcblx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XSksXG5cdFx0XHRdLFxuXHRcdClcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemVcIlxuaW1wb3J0IHsgS2V5cyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBUZW1wbGF0ZVBvcHVwTW9kZWwgfSBmcm9tIFwiLi4vbW9kZWwvVGVtcGxhdGVQb3B1cE1vZGVsLmpzXCJcbmltcG9ydCB7IGlzS2V5UHJlc3NlZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9LZXlNYW5hZ2VyXCJcbmltcG9ydCB0eXBlIHsgRW1haWxUZW1wbGF0ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IFRFTVBMQVRFX1BPUFVQX0hFSUdIVCB9IGZyb20gXCIuL1RlbXBsYXRlQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IG1lbW9pemVkIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBodG1sU2FuaXRpemVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0h0bWxTYW5pdGl6ZXIuanNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS90aGVtZS5qc1wiXG5cbi8qKlxuICogVGVtcGxhdGVFeHBhbmRlciBpcyB0aGUgcmlnaHQgc2lkZSB0aGF0IGlzIHJlbmRlcmVkIHdpdGhpbiB0aGUgUG9wdXAuIENvbnNpc3RzIG9mIERyb3Bkb3duLCBDb250ZW50IGFuZCBCdXR0b24uXG4gKiBUaGUgUG9wdXAgaGFuZGxlcyB3aGV0aGVyIHRoZSBFeHBhbmRlciBzaG91bGQgYmUgcmVuZGVyZWQgb3Igbm90LCBkZXBlbmRpbmcgb24gYXZhaWxhYmxlIHdpZHRoLXNwYWNlLlxuICovXG5leHBvcnQgdHlwZSBUZW1wbGF0ZUV4cGFuZGVyQXR0cnMgPSB7XG5cdHRlbXBsYXRlOiBFbWFpbFRlbXBsYXRlXG5cdG1vZGVsOiBUZW1wbGF0ZVBvcHVwTW9kZWxcbn1cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlRXhwYW5kZXIgaW1wbGVtZW50cyBDb21wb25lbnQ8VGVtcGxhdGVFeHBhbmRlckF0dHJzPiB7XG5cdHByaXZhdGUgcmVhZG9ubHkgc2FuaXRpemVkVGV4dCA9IG1lbW9pemVkKFxuXHRcdCh0ZXh0OiBzdHJpbmcpID0+XG5cdFx0XHRodG1sU2FuaXRpemVyLnNhbml0aXplSFRNTCh0ZXh0LCB7XG5cdFx0XHRcdGJsb2NrRXh0ZXJuYWxDb250ZW50OiBmYWxzZSxcblx0XHRcdFx0YWxsb3dSZWxhdGl2ZUxpbmtzOiB0cnVlLFxuXHRcdFx0fSkuaHRtbCxcblx0KVxuXG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxUZW1wbGF0ZUV4cGFuZGVyQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgbW9kZWwsIHRlbXBsYXRlIH0gPSBhdHRyc1xuXHRcdGNvbnN0IHNlbGVjdGVkQ29udGVudCA9IG1vZGVsLmdldFNlbGVjdGVkQ29udGVudCgpXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5mbGV4LmZsZXgtY29sdW1uLmZsZXgtZ3Jvdy5zY3JvbGwubWwtc1wiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdC8vIG1heEhlaWdodCBoYXMgdG8gYmUgc2V0LCBiZWNhdXNlIG90aGVyd2lzZSB0aGUgY29udGVudCB3b3VsZCBvdmVyZmxvdyBvdXRzaWRlIHRoZSBmbGV4Ym94ICgtNDQgYmVjYXVzZSBvZiBoZWFkZXIgaGVpZ2h0KVxuXHRcdFx0XHRcdG1heEhlaWdodDogcHgoVEVNUExBVEVfUE9QVVBfSEVJR0hUIC0gc2l6ZS5idXR0b25faGVpZ2h0KSxcblx0XHRcdFx0fSxcblx0XHRcdFx0b25rZXlkb3duOiAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuXHRcdFx0XHRcdGlmIChpc0tleVByZXNzZWQoZS5rZXksIEtleXMuVEFCKSkge1xuXHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIi50ZXh0LWJyZWFrLnNtYWxsZXIuYi50ZXh0LWNlbnRlclwiLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFwiYm9yZGVyLWJvdHRvbVwiOiBgMXB4IHNvbGlkICR7dGhlbWUuY29udGVudF9ib3JkZXJ9YCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR0ZW1wbGF0ZS50aXRsZSxcblx0XHRcdFx0KSxcblx0XHRcdFx0bShcIi50ZXh0LWJyZWFrLmZsZXgtZ3Jvdy5wci5vdmVyZmxvdy15LXZpc2libGUucHRcIiwgc2VsZWN0ZWRDb250ZW50ID8gbS50cnVzdCh0aGlzLnNhbml0aXplZFRleHQoc2VsZWN0ZWRDb250ZW50LnRleHQpKSA6IG51bGwpLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDbGFzc0NvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgdHlwZSB7IE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBpbnB1dExpbmVIZWlnaHQsIHB4IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc2l6ZVwiXG5pbXBvcnQgeyBrZXlib2FyZEV2ZW50VG9LZXlQcmVzcywga2V5SGFuZGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9LZXlNYW5hZ2VyXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWVcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuXG5leHBvcnQgdHlwZSBUZW1wbGF0ZVNlYXJjaEJhckF0dHJzID0ge1xuXHR2YWx1ZTogU3RyZWFtPHN0cmluZz5cblx0cGxhY2Vob2xkZXI/OiBNYXliZVRyYW5zbGF0aW9uXG5cdG9uaW5wdXQ/OiAodmFsdWU6IHN0cmluZywgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQpID0+IHVua25vd25cblx0a2V5SGFuZGxlcj86IGtleUhhbmRsZXJcbn1cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlU2VhcmNoQmFyIGltcGxlbWVudHMgQ2xhc3NDb21wb25lbnQ8VGVtcGxhdGVTZWFyY2hCYXJBdHRycz4ge1xuXHRkb21JbnB1dDogSFRNTElucHV0RWxlbWVudCB8IG51bGwgPSBudWxsXG5cblx0dmlldyh2bm9kZTogVm5vZGU8VGVtcGxhdGVTZWFyY2hCYXJBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgYSA9IHZub2RlLmF0dHJzXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5pbnB1dFdyYXBwZXIucHQteHMucGIteHNcIixcblx0XHRcdHtcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcImJvcmRlci1ib3R0b21cIjogYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYm9yZGVyfWAsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0dGhpcy5fZ2V0SW5wdXRGaWVsZChhKSxcblx0XHQpXG5cdH1cblxuXHRfZ2V0SW5wdXRGaWVsZChhOiBUZW1wbGF0ZVNlYXJjaEJhckF0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFwiaW5wdXQuaW5wdXRcIiwge1xuXHRcdFx0cGxhY2Vob2xkZXI6IGEucGxhY2Vob2xkZXIgJiYgbGFuZy5nZXRUcmFuc2xhdGlvblRleHQoYS5wbGFjZWhvbGRlciksXG5cdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdHRoaXMuZG9tSW5wdXQgPSB2bm9kZS5kb20gYXMgSFRNTElucHV0RWxlbWVudFxuXHRcdFx0XHR0aGlzLmRvbUlucHV0LnZhbHVlID0gYS52YWx1ZSgpXG5cdFx0XHRcdHRoaXMuZG9tSW5wdXQuZm9jdXMoKVxuXHRcdFx0fSxcblx0XHRcdG9ua2V5ZG93bjogKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRcdFx0Y29uc3Qga2V5ID0ga2V5Ym9hcmRFdmVudFRvS2V5UHJlc3MoZSlcblx0XHRcdFx0cmV0dXJuIGEua2V5SGFuZGxlciAhPSBudWxsID8gYS5rZXlIYW5kbGVyKGtleSkgOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0b25pbnB1dDogKCkgPT4ge1xuXHRcdFx0XHRjb25zdCBkb21JbnB1dCA9IGFzc2VydE5vdE51bGwodGhpcy5kb21JbnB1dClcblx0XHRcdFx0YS52YWx1ZShkb21JbnB1dC52YWx1ZSlcblx0XHRcdFx0YS5vbmlucHV0Py4oZG9tSW5wdXQudmFsdWUsIGRvbUlucHV0KVxuXHRcdFx0fSxcblx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdGxpbmVIZWlnaHQ6IHB4KGlucHV0TGluZUhlaWdodCksXG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cbn1cbiIsImltcG9ydCB0eXBlIHsgVGVtcGxhdGVHcm91cFJvb3QgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBUZW1wbGF0ZUdyb3VwUm9vdFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBzaG93UGxhblVwZ3JhZGVSZXF1aXJlZERpYWxvZyB9IGZyb20gXCIuLi8uLi9jb21tb24vbWlzYy9TdWJzY3JpcHRpb25EaWFsb2dzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3JcIlxuaW1wb3J0IHsgRmVhdHVyZVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2cuanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBpc0N1c3RvbWl6YXRpb25FbmFibGVkRm9yQ3VzdG9tZXIgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvQ3VzdG9tZXJVdGlscy5qc1wiXG5cbi8qKlxuICogQHJldHVybiBUcnVlIGlmIHRoZSBncm91cCBoYXMgYmVlbiBjcmVhdGVkLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlSW5pdGlhbFRlbXBsYXRlTGlzdElmQWxsb3dlZCgpOiBQcm9taXNlPFRlbXBsYXRlR3JvdXBSb290IHwgbnVsbD4ge1xuXHRjb25zdCB1c2VyQ29udHJvbGxlciA9IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKClcblx0Y29uc3QgY3VzdG9tZXIgPSBhd2FpdCB1c2VyQ29udHJvbGxlci5sb2FkQ3VzdG9tZXIoKVxuXHRjb25zdCB7IGdldEF2YWlsYWJsZVBsYW5zV2l0aFRlbXBsYXRlcyB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vLi4vY29tbW9uL3N1YnNjcmlwdGlvbi9TdWJzY3JpcHRpb25VdGlscy5qc1wiKVxuXHRsZXQgYWxsb3dlZCA9IChhd2FpdCB1c2VyQ29udHJvbGxlci5nZXRQbGFuQ29uZmlnKCkpLnRlbXBsYXRlcyB8fCBpc0N1c3RvbWl6YXRpb25FbmFibGVkRm9yQ3VzdG9tZXIoY3VzdG9tZXIsIEZlYXR1cmVUeXBlLkJ1c2luZXNzRmVhdHVyZUVuYWJsZWQpXG5cdGlmICghYWxsb3dlZCkge1xuXHRcdGlmICh1c2VyQ29udHJvbGxlci5pc0dsb2JhbEFkbWluKCkpIHtcblx0XHRcdGFsbG93ZWQgPSBhd2FpdCBzaG93UGxhblVwZ3JhZGVSZXF1aXJlZERpYWxvZyhhd2FpdCBnZXRBdmFpbGFibGVQbGFuc1dpdGhUZW1wbGF0ZXMoKSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0RGlhbG9nLm1lc3NhZ2UoXCJjb250YWN0QWRtaW5fbXNnXCIpXG5cdFx0fVxuXHR9XG5cblx0aWYgKGFsbG93ZWQpIHtcblx0XHRjb25zdCBncm91cElkID0gYXdhaXQgbG9jYXRvci5ncm91cE1hbmFnZW1lbnRGYWNhZGUuY3JlYXRlVGVtcGxhdGVHcm91cChcIlwiKVxuXHRcdHJldHVybiBsb2NhdG9yLmVudGl0eUNsaWVudC5sb2FkPFRlbXBsYXRlR3JvdXBSb290PihUZW1wbGF0ZUdyb3VwUm9vdFR5cGVSZWYsIGdyb3VwSWQpXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIG51bGxcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENsYXNzQ29tcG9uZW50LCBDb21wb25lbnQsIENWbm9kZSwgQ1Zub2RlRE9NLCBWbm9kZSwgVm5vZGVET00gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9uS2V5IH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IEljb24gfSBmcm9tIFwiLi9iYXNlL0ljb25cIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi9iYXNlL2ljb25zL0ljb25zXCJcbmltcG9ydCB0eXBlIHsgTWF5YmVMYXp5IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyByZXNvbHZlTWF5YmVMYXp5IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5cbmV4cG9ydCB0eXBlIFNjcm9sbFNlbGVjdExpc3RBdHRyczxUPiA9IHtcblx0aXRlbXM6IFJlYWRvbmx5QXJyYXk8VD5cblx0c2VsZWN0ZWRJdGVtOiBUIHwgbnVsbFxuXHRvbkl0ZW1TZWxlY3RlZDogKGl0ZW06IFQpID0+IHVua25vd25cblx0ZW1wdHlMaXN0TWVzc2FnZTogTWF5YmVMYXp5PFRyYW5zbGF0aW9uS2V5PlxuXHR3aWR0aDogbnVtYmVyXG5cdHJlbmRlckl0ZW06IChpdGVtOiBUKSA9PiBDaGlsZHJlblxuXHRvbkl0ZW1Eb3VibGVDbGlja2VkOiAoaXRlbTogVCkgPT4gdW5rbm93blxufVxuXG5leHBvcnQgY2xhc3MgU2Nyb2xsU2VsZWN0TGlzdDxUPiBpbXBsZW1lbnRzIENsYXNzQ29tcG9uZW50PFNjcm9sbFNlbGVjdExpc3RBdHRyczxUPj4ge1xuXHRwcml2YXRlIHNlbGVjdGVkSXRlbTogVCB8IG51bGwgPSBudWxsXG5cblx0dmlldyh2bm9kZTogQ1Zub2RlPFNjcm9sbFNlbGVjdExpc3RBdHRyczxUPj4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgYSA9IHZub2RlLmF0dHJzXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5mbGV4LmZsZXgtY29sdW1uLnNjcm9sbC1uby1vdmVybGF5XCIsXG5cdFx0XHRhLml0ZW1zLmxlbmd0aCA+IDBcblx0XHRcdFx0PyBhLml0ZW1zLm1hcCgoaXRlbSkgPT4gdGhpcy5yZW5kZXJSb3coaXRlbSwgdm5vZGUpKVxuXHRcdFx0XHQ6IG0oXCIucm93LXNlbGVjdGVkLnRleHQtY2VudGVyLnB0XCIsIGxhbmcuZ2V0KHJlc29sdmVNYXliZUxhenkoYS5lbXB0eUxpc3RNZXNzYWdlKSkpLFxuXHRcdClcblx0fVxuXG5cdG9udXBkYXRlKHZub2RlOiBDVm5vZGVET008U2Nyb2xsU2VsZWN0TGlzdEF0dHJzPFQ+Pikge1xuXHRcdGNvbnN0IG5ld1NlbGVjdGVkSXRlbSA9IHZub2RlLmF0dHJzLnNlbGVjdGVkSXRlbVxuXG5cdFx0aWYgKG5ld1NlbGVjdGVkSXRlbSAhPT0gdGhpcy5zZWxlY3RlZEl0ZW0pIHtcblx0XHRcdHRoaXMuX29uU2VsZWN0aW9uQ2hhbmdlZChuZXdTZWxlY3RlZEl0ZW0sIHZub2RlLmF0dHJzLml0ZW1zLCB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpXG5cdFx0XHQvLyBFbnN1cmVzIHRoYXQgcmVkcmF3IGhhcHBlbnMgYWZ0ZXIgc2VsZWN0ZWQgaXRlbSBjaGFuZ2VkIHRoaXMgZ3VhcmFudGVzcyB0aGF0IHRoZSBzZWxlY3RlZCBpdGVtIGlzIGZvY3VzZWQgY29ycmVjdGx5LlxuXHRcdFx0Ly8gU2VsZWN0aW5nIHRoZSBjb3JyZWN0IGl0ZW0gaW4gdGhlIGxpc3QgcmVxdWlyZXMgdGhhdCB0aGUgKHBvc3NpYmxlIGZpbHRlcmVkKSBsaXN0IG5lZWRzIHJlbmRlciBmaXJzdCBhbmQgdGhlbiB3ZVxuXHRcdFx0Ly8gY2FuIHNjcm9sbCB0byB0aGUgbmV3IHNlbGVjdGVkIGl0ZW0uIFRoZXJlZm9yZSB3ZSBjYWxsIG9uU2VsZWN0aW9uQ2hhbmdlIGluIG9udXBkYXRlIGNhbGxiYWNrLlxuXHRcdFx0bS5yZWRyYXcoKVxuXHRcdH1cblx0fVxuXG5cdHJlbmRlclJvdyhpdGVtOiBULCB2bm9kZTogVm5vZGU8U2Nyb2xsU2VsZWN0TGlzdEF0dHJzPFQ+Pik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBhID0gdm5vZGUuYXR0cnNcblx0XHRjb25zdCBpc1NlbGVjdGVkID0gYS5zZWxlY3RlZEl0ZW0gPT09IGl0ZW1cblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZsZXguZmxleC1jb2x1bW4uY2xpY2tcIixcblx0XHRcdHtcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRtYXhXaWR0aDogYS53aWR0aCxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRbXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIuZmxleC50ZW1wbGF0ZS1saXN0LXJvd1wiICsgKGlzU2VsZWN0ZWQgPyBcIi5yb3ctc2VsZWN0ZWRcIiA6IFwiXCIpLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdG9uY2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGEub25JdGVtU2VsZWN0ZWQoaXRlbSlcblx0XHRcdFx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG9uZGJsY2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGEub25JdGVtU2VsZWN0ZWQoaXRlbSlcblx0XHRcdFx0XHRcdFx0YS5vbkl0ZW1Eb3VibGVDbGlja2VkKGl0ZW0pXG5cdFx0XHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHRhLnJlbmRlckl0ZW0oaXRlbSksXG5cdFx0XHRcdFx0XHRpc1NlbGVjdGVkXG5cdFx0XHRcdFx0XHRcdD8gbShJY29uLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5BcnJvd0ZvcndhcmQsXG5cdFx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRtYXJnaW5Ub3A6IFwiYXV0b1wiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRtYXJnaW5Cb3R0b206IFwiYXV0b1wiLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdFx0XHQ6IG0oXCJcIiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0d2lkdGg6IFwiMTcuMXB4XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGhlaWdodDogXCIxNnB4XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHQgIH0pLFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdCksXG5cdFx0XHRdLFxuXHRcdClcblx0fVxuXG5cdF9vblNlbGVjdGlvbkNoYW5nZWQoc2VsZWN0ZWRJdGVtOiBUIHwgbnVsbCwgaXRlbXM6IFJlYWRvbmx5QXJyYXk8VD4sIHNjcm9sbERvbTogSFRNTEVsZW1lbnQpIHtcblx0XHR0aGlzLnNlbGVjdGVkSXRlbSA9IHNlbGVjdGVkSXRlbVxuXHRcdGlmIChzZWxlY3RlZEl0ZW0gIT0gbnVsbCkge1xuXHRcdFx0Y29uc3Qgc2VsZWN0ZWRJbmRleCA9IGl0ZW1zLmluZGV4T2Yoc2VsZWN0ZWRJdGVtKVxuXG5cdFx0XHRpZiAoc2VsZWN0ZWRJbmRleCAhPT0gLTEpIHtcblx0XHRcdFx0Y29uc3Qgc2VsZWN0ZWREb21FbGVtZW50ID0gc2Nyb2xsRG9tLmNoaWxkcmVuLml0ZW0oc2VsZWN0ZWRJbmRleClcblxuXHRcdFx0XHRpZiAoc2VsZWN0ZWREb21FbGVtZW50KSB7XG5cdFx0XHRcdFx0c2VsZWN0ZWREb21FbGVtZW50LnNjcm9sbEludG9WaWV3KHtcblx0XHRcdFx0XHRcdGJsb2NrOiBcIm5lYXJlc3RcIixcblx0XHRcdFx0XHRcdGlubGluZTogXCJuZWFyZXN0XCIsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgdHlwZSB7IE1vZGFsQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Nb2RhbFwiXG5pbXBvcnQgeyBtb2RhbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTW9kYWxcIlxuaW1wb3J0IHsgcHggfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplXCJcbmltcG9ydCB0eXBlIHsgU2hvcnRjdXQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvS2V5TWFuYWdlclwiXG5pbXBvcnQgeyBpc0tleVByZXNzZWQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvS2V5TWFuYWdlclwiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgU3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBLZXlzLCBTaGFyZUNhcGFiaWxpdHkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgVGVtcGxhdGVQb3B1cFJlc3VsdFJvdyB9IGZyb20gXCIuL1RlbXBsYXRlUG9wdXBSZXN1bHRSb3cuanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zXCJcbmltcG9ydCB7IFRlbXBsYXRlRXhwYW5kZXIgfSBmcm9tIFwiLi9UZW1wbGF0ZUV4cGFuZGVyLmpzXCJcbmltcG9ydCB0eXBlIHsgTGFuZ3VhZ2VDb2RlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGxhbmcsIGxhbmd1YWdlQnlDb2RlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB0eXBlIHsgd2luZG93U2l6ZUxpc3RlbmVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL1dpbmRvd0ZhY2FkZVwiXG5pbXBvcnQgeyB3aW5kb3dGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvV2luZG93RmFjYWRlXCJcbmltcG9ydCB0eXBlIHsgRW1haWxUZW1wbGF0ZSwgVGVtcGxhdGVHcm91cFJvb3QgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBUZW1wbGF0ZUdyb3VwUm9vdFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgdHlwZSB7IEJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgQnV0dG9uLCBCdXR0b25Db2xvciwgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB7IFNFTEVDVF9ORVhUX1RFTVBMQVRFLCBTRUxFQ1RfUFJFVl9URU1QTEFURSwgVEVNUExBVEVfU0hPUlRDVVRfUFJFRklYLCBUZW1wbGF0ZVBvcHVwTW9kZWwgfSBmcm9tIFwiLi4vbW9kZWwvVGVtcGxhdGVQb3B1cE1vZGVsLmpzXCJcbmltcG9ydCB7IGF0dGFjaERyb3Bkb3duLCBEb21SZWN0UmVhZE9ubHlQb2x5ZmlsbGVkLCBQb3NSZWN0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyBkZWJvdW5jZSwgZG93bmNhc3QsIG5ldmVyTnVsbCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvclwiXG5pbXBvcnQgeyBUZW1wbGF0ZVNlYXJjaEJhciB9IGZyb20gXCIuL1RlbXBsYXRlU2VhcmNoQmFyLmpzXCJcbmltcG9ydCB7IEVkaXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2VkaXRvci9FZGl0b3JcIlxuaW1wb3J0IHsgZ2V0U2hhcmVkR3JvdXBOYW1lLCBoYXNDYXBhYmlsaXR5T25Hcm91cCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vc2hhcmluZy9Hcm91cFV0aWxzXCJcbmltcG9ydCB7IGNyZWF0ZUluaXRpYWxUZW1wbGF0ZUxpc3RJZkFsbG93ZWQgfSBmcm9tIFwiLi4vVGVtcGxhdGVHcm91cFV0aWxzLmpzXCJcbmltcG9ydCB7IGdldENvbmZpcm1hdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvR3VpVXRpbHNcIlxuaW1wb3J0IHsgU2Nyb2xsU2VsZWN0TGlzdCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL1Njcm9sbFNlbGVjdExpc3RcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiwgSWNvbkJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uQnV0dG9uLmpzXCJcbmltcG9ydCB7IFRFTVBMQVRFX0xJU1RfRU5UUllfV0lEVEgsIFRFTVBMQVRFX1BPUFVQX0hFSUdIVCwgVEVNUExBVEVfUE9QVVBfVFdPX0NPTFVNTl9NSU5fV0lEVEggfSBmcm9tIFwiLi9UZW1wbGF0ZUNvbnN0YW50cy5qc1wiXG5cbi8qKlxuICpcdENyZWF0ZXMgYSBNb2RhbC9Qb3B1cCB0aGF0IGFsbG93cyB1c2VyIHRvIHBhc3RlIHRlbXBsYXRlcyBkaXJlY3RseSBpbnRvIHRoZSBNYWlsRWRpdG9yLlxuICpcdEFsc28gYWxsb3dzIHVzZXIgdG8gY2hhbmdlIGRlc2lyZWQgbGFuZ3VhZ2Ugd2hlbiBwYXN0aW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2hvd1RlbXBsYXRlUG9wdXBJbkVkaXRvcih0ZW1wbGF0ZU1vZGVsOiBUZW1wbGF0ZVBvcHVwTW9kZWwsIGVkaXRvcjogRWRpdG9yLCB0ZW1wbGF0ZTogRW1haWxUZW1wbGF0ZSB8IG51bGwsIGhpZ2hsaWdodGVkVGV4dDogc3RyaW5nKSB7XG5cdGNvbnN0IGluaXRpYWxTZWFyY2hTdHJpbmcgPSB0ZW1wbGF0ZSA/IFRFTVBMQVRFX1NIT1JUQ1VUX1BSRUZJWCArIHRlbXBsYXRlLnRhZyA6IGhpZ2hsaWdodGVkVGV4dFxuXHRjb25zdCBjdXJzb3JSZWN0ID0gZWRpdG9yLmdldEN1cnNvclBvc2l0aW9uKClcblx0Y29uc3QgZWRpdG9yUmVjdCA9IGVkaXRvci5nZXRET00oKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuXG5cdGNvbnN0IG9uU2VsZWN0ID0gKHRleHQ6IHN0cmluZykgPT4ge1xuXHRcdGVkaXRvci5pbnNlcnRIVE1MKHRleHQpXG5cdFx0ZWRpdG9yLmZvY3VzKClcblx0fVxuXG5cdGxldCByZWN0XG5cdGNvbnN0IGF2YWlsYWJsZUhlaWdodEJlbG93Q3Vyc29yID0gd2luZG93LmlubmVySGVpZ2h0IC0gY3Vyc29yUmVjdC5ib3R0b21cblx0Y29uc3QgcG9wVXBIZWlnaHQgPSBURU1QTEFURV9QT1BVUF9IRUlHSFQgKyAxMCAvLyBoZWlnaHQgKyAxMHB4IG9mZnNldCBmb3Igc3BhY2UgZnJvbSB0aGUgYm90dG9tIG9mIHRoZSBzY3JlZW5cblxuXHQvLyBCeSBkZWZhdWx0IHRoZSBwb3B1cCBpcyBzaG93biBiZWxvdyB0aGUgY3Vyc29yLiBJZiB0aGVyZSBpcyBub3QgZW5vdWdoIHNwYWNlIG1vdmUgdGhlIHBvcHVwIGFib3ZlIHRoZSBjdXJzb3Jcblx0Y29uc3QgcG9wVXBXaWR0aCA9IGVkaXRvclJlY3QucmlnaHQgLSBlZGl0b3JSZWN0LmxlZnRcblxuXHRpZiAoYXZhaWxhYmxlSGVpZ2h0QmVsb3dDdXJzb3IgPCBwb3BVcEhlaWdodCkge1xuXHRcdGNvbnN0IGRpZmYgPSBwb3BVcEhlaWdodCAtIGF2YWlsYWJsZUhlaWdodEJlbG93Q3Vyc29yXG5cdFx0cmVjdCA9IG5ldyBEb21SZWN0UmVhZE9ubHlQb2x5ZmlsbGVkKGVkaXRvclJlY3QubGVmdCwgY3Vyc29yUmVjdC5ib3R0b20gLSBkaWZmLCBwb3BVcFdpZHRoLCBjdXJzb3JSZWN0LmhlaWdodClcblx0fSBlbHNlIHtcblx0XHRyZWN0ID0gbmV3IERvbVJlY3RSZWFkT25seVBvbHlmaWxsZWQoZWRpdG9yUmVjdC5sZWZ0LCBjdXJzb3JSZWN0LmJvdHRvbSwgcG9wVXBXaWR0aCwgY3Vyc29yUmVjdC5oZWlnaHQpXG5cdH1cblxuXHRjb25zdCBwb3B1cCA9IG5ldyBUZW1wbGF0ZVBvcHVwKHRlbXBsYXRlTW9kZWwsIHJlY3QsIG9uU2VsZWN0LCBpbml0aWFsU2VhcmNoU3RyaW5nLCAoKSA9PiBlZGl0b3IuZm9jdXMoKSlcblx0dGVtcGxhdGVNb2RlbC5zZWFyY2goaW5pdGlhbFNlYXJjaFN0cmluZylcblx0cG9wdXAuc2hvdygpXG59XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZVBvcHVwIGltcGxlbWVudHMgTW9kYWxDb21wb25lbnQge1xuXHRwcml2YXRlIF9yZWN0OiBQb3NSZWN0XG5cdHByaXZhdGUgX3Nob3J0Y3V0czogU2hvcnRjdXRbXVxuXHRwcml2YXRlIF9vblNlbGVjdDogKF86IHN0cmluZykgPT4gdm9pZFxuXHRwcml2YXRlIF9pbml0aWFsV2luZG93V2lkdGg6IG51bWJlclxuXHRwcml2YXRlIF9yZXNpemVMaXN0ZW5lcjogd2luZG93U2l6ZUxpc3RlbmVyXG5cdHByaXZhdGUgX3JlZHJhd1N0cmVhbTogU3RyZWFtPGFueT5cblx0cHJpdmF0ZSByZWFkb25seSBfdGVtcGxhdGVNb2RlbDogVGVtcGxhdGVQb3B1cE1vZGVsXG5cdHByaXZhdGUgcmVhZG9ubHkgX3NlYXJjaEJhclZhbHVlOiBTdHJlYW08c3RyaW5nPlxuXHRwcml2YXRlIF9zZWxlY3RUZW1wbGF0ZUJ1dHRvbkF0dHJzOiBCdXR0b25BdHRyc1xuXHRwcml2YXRlIF9pbnB1dERvbTogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIF9kZWJvdW5jZUZpbHRlcjogKF86IHN0cmluZykgPT4gdm9pZFxuXHRwcml2YXRlIGZvY3VzZWRCZWZvcmVTaG93bjogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHRlbXBsYXRlTW9kZWw6IFRlbXBsYXRlUG9wdXBNb2RlbCxcblx0XHRyZWN0OiBQb3NSZWN0LFxuXHRcdG9uU2VsZWN0OiAoYXJnMDogc3RyaW5nKSA9PiB2b2lkLFxuXHRcdGluaXRpYWxTZWFyY2hTdHJpbmc6IHN0cmluZyxcblx0XHRwcml2YXRlIHJlYWRvbmx5IHJlc3RvcmVFZGl0b3JGb2N1cz86ICgpID0+IHZvaWQsXG5cdCkge1xuXHRcdHRoaXMuX3JlY3QgPSByZWN0XG5cdFx0dGhpcy5fb25TZWxlY3QgPSBvblNlbGVjdFxuXHRcdHRoaXMuX2luaXRpYWxXaW5kb3dXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoXG5cblx0XHR0aGlzLl9yZXNpemVMaXN0ZW5lciA9ICgpID0+IHtcblx0XHRcdHRoaXMuX2Nsb3NlKClcblx0XHR9XG5cblx0XHR0aGlzLl9zZWFyY2hCYXJWYWx1ZSA9IHN0cmVhbShpbml0aWFsU2VhcmNoU3RyaW5nKVxuXHRcdHRoaXMuX3RlbXBsYXRlTW9kZWwgPSB0ZW1wbGF0ZU1vZGVsXG5cdFx0dGhpcy5fc2hvcnRjdXRzID0gW1xuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdFx0XHRlbmFibGVkOiAoKSA9PiB0cnVlLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5yZXN0b3JlRWRpdG9yRm9jdXM/LigpXG5cblx0XHRcdFx0XHR0aGlzLl9jbG9zZSgpXG5cblx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlbHA6IFwiY2xvc2VUZW1wbGF0ZV9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5SRVRVUk4sXG5cdFx0XHRcdGVuYWJsZWQ6ICgpID0+IHRydWUsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBzZWxlY3RlZENvbnRlbnQgPSB0aGlzLl90ZW1wbGF0ZU1vZGVsLmdldFNlbGVjdGVkQ29udGVudCgpXG5cblx0XHRcdFx0XHRpZiAoc2VsZWN0ZWRDb250ZW50KSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9vblNlbGVjdChzZWxlY3RlZENvbnRlbnQudGV4dClcblxuXHRcdFx0XHRcdFx0dGhpcy5fY2xvc2UoKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJpbnNlcnRUZW1wbGF0ZV9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5VUCxcblx0XHRcdFx0ZW5hYmxlZDogKCkgPT4gdHJ1ZSxcblx0XHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuX3RlbXBsYXRlTW9kZWwuc2VsZWN0TmV4dFRlbXBsYXRlKFNFTEVDVF9QUkVWX1RFTVBMQVRFKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRoZWxwOiBcInNlbGVjdFByZXZpb3VzVGVtcGxhdGVfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuRE9XTixcblx0XHRcdFx0ZW5hYmxlZDogKCkgPT4gdHJ1ZSxcblx0XHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuX3RlbXBsYXRlTW9kZWwuc2VsZWN0TmV4dFRlbXBsYXRlKFNFTEVDVF9ORVhUX1RFTVBMQVRFKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRoZWxwOiBcInNlbGVjdE5leHRUZW1wbGF0ZV9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XVxuXHRcdHRoaXMuX3JlZHJhd1N0cmVhbSA9IHRlbXBsYXRlTW9kZWwuc2VhcmNoUmVzdWx0cy5tYXAoKHJlc3VsdHMpID0+IHtcblx0XHRcdG0ucmVkcmF3KClcblx0XHR9KVxuXHRcdHRoaXMuX3NlbGVjdFRlbXBsYXRlQnV0dG9uQXR0cnMgPSB7XG5cdFx0XHRsYWJlbDogXCJzZWxlY3RUZW1wbGF0ZV9hY3Rpb25cIixcblx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHNlbGVjdGVkID0gdGhpcy5fdGVtcGxhdGVNb2RlbC5nZXRTZWxlY3RlZENvbnRlbnQoKVxuXG5cdFx0XHRcdGlmIChzZWxlY3RlZCkge1xuXHRcdFx0XHRcdHRoaXMuX29uU2VsZWN0KHNlbGVjdGVkLnRleHQpXG5cblx0XHRcdFx0XHR0aGlzLl9jbG9zZSgpXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR0eXBlOiBCdXR0b25UeXBlLlByaW1hcnksXG5cdFx0fVxuXHRcdHRoaXMuX2RlYm91bmNlRmlsdGVyID0gZGVib3VuY2UoMjAwLCAodmFsdWU6IHN0cmluZykgPT4ge1xuXHRcdFx0dGVtcGxhdGVNb2RlbC5zZWFyY2godmFsdWUpXG5cdFx0fSlcblxuXHRcdHRoaXMuX2RlYm91bmNlRmlsdGVyKGluaXRpYWxTZWFyY2hTdHJpbmcpXG5cdH1cblxuXHR2aWV3OiAoKSA9PiBDaGlsZHJlbiA9ICgpID0+IHtcblx0XHRjb25zdCBzaG93VHdvQ29sdW1ucyA9IHRoaXMuX2lzU2NyZWVuV2lkZUVub3VnaCgpXG5cblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZsZXguZmxleC1jb2x1bW4uYWJzLmVsZXZhdGVkLWJnLmJvcmRlci1yYWRpdXMuZHJvcGRvd24tc2hhZG93XCIsXG5cdFx0XHR7XG5cdFx0XHRcdC8vIE1haW4gV3JhcHBlclxuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdHdpZHRoOiBweCh0aGlzLl9yZWN0LndpZHRoKSxcblx0XHRcdFx0XHRoZWlnaHQ6IHB4KFRFTVBMQVRFX1BPUFVQX0hFSUdIVCksXG5cdFx0XHRcdFx0dG9wOiBweCh0aGlzLl9yZWN0LnRvcCksXG5cdFx0XHRcdFx0bGVmdDogcHgodGhpcy5fcmVjdC5sZWZ0KSxcblx0XHRcdFx0fSxcblx0XHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHR0aGlzLl9pbnB1dERvbT8uZm9jdXMoKVxuXG5cdFx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmNyZWF0ZTogKCkgPT4ge1xuXHRcdFx0XHRcdHdpbmRvd0ZhY2FkZS5hZGRSZXNpemVMaXN0ZW5lcih0aGlzLl9yZXNpemVMaXN0ZW5lcilcblx0XHRcdFx0fSxcblx0XHRcdFx0b25yZW1vdmU6ICgpID0+IHtcblx0XHRcdFx0XHR3aW5kb3dGYWNhZGUucmVtb3ZlUmVzaXplTGlzdGVuZXIodGhpcy5fcmVzaXplTGlzdGVuZXIpXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHR0aGlzLl9yZW5kZXJIZWFkZXIoKSxcblx0XHRcdFx0bShcIi5mbGV4LmZsZXgtZ3Jvdy5zY3JvbGwubWItc1wiLCBbXG5cdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFwiLmZsZXguZmxleC1jb2x1bW4uc2Nyb2xsXCIgKyAoc2hvd1R3b0NvbHVtbnMgPyBcIi5wclwiIDogXCJcIiksXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0ZmxleDogXCIxIDEgNDAlXCIsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0dGhpcy5fcmVuZGVyTGlzdCgpLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0c2hvd1R3b0NvbHVtbnNcblx0XHRcdFx0XHRcdD8gbShcblx0XHRcdFx0XHRcdFx0XHRcIi5mbGV4LmZsZXgtY29sdW1uLmZsZXgtZ3Jvdy1zaHJpbmstaGFsZlwiLFxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGZsZXg6IFwiMSAxIDYwJVwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuX3JlbmRlclJpZ2h0Q29sdW1uKCksXG5cdFx0XHRcdFx0XHQgIClcblx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XSksXG5cdFx0XHRdLFxuXHRcdClcblx0fVxuXG5cdF9yZW5kZXJIZWFkZXIoKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHNlbGVjdGVkVGVtcGxhdGUgPSB0aGlzLl90ZW1wbGF0ZU1vZGVsLmdldFNlbGVjdGVkVGVtcGxhdGUoKVxuXG5cdFx0cmV0dXJuIG0oXCIuZmxleC1zcGFjZS1iZXR3ZWVuLmNlbnRlci12ZXJ0aWNhbGx5LnBsLnByLXNcIiwgW1xuXHRcdFx0bShcIi5mbGV4LXN0YXJ0XCIsIFttKFwiLmZsZXguY2VudGVyLXZlcnRpY2FsbHlcIiwgdGhpcy5fcmVuZGVyU2VhcmNoQmFyKCkpLCB0aGlzLl9yZW5kZXJBZGRCdXR0b24oKV0pLFxuXHRcdFx0bShcIi5mbGV4LWVuZFwiLCBbXG5cdFx0XHRcdHNlbGVjdGVkVGVtcGxhdGVcblx0XHRcdFx0XHQ/IHRoaXMuX3JlbmRlckVkaXRCdXR0b25zKHNlbGVjdGVkVGVtcGxhdGUpIC8vIFJpZ2h0IGhlYWRlciB3cmFwcGVyXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XSksXG5cdFx0XSlcblx0fVxuXG5cdF9yZW5kZXJTZWFyY2hCYXI6ICgpID0+IENoaWxkcmVuID0gKCkgPT4ge1xuXHRcdHJldHVybiBtKFRlbXBsYXRlU2VhcmNoQmFyLCB7XG5cdFx0XHR2YWx1ZTogdGhpcy5fc2VhcmNoQmFyVmFsdWUsXG5cdFx0XHRwbGFjZWhvbGRlcjogXCJmaWx0ZXJfbGFiZWxcIixcblx0XHRcdGtleUhhbmRsZXI6IChrZXlQcmVzcykgPT4ge1xuXHRcdFx0XHRpZiAoaXNLZXlQcmVzc2VkKGtleVByZXNzLmtleSwgS2V5cy5ET1dOLCBLZXlzLlVQKSkge1xuXHRcdFx0XHRcdC8vIFRoaXMgZHVwbGljYXRlcyB0aGUgbGlzdGVuZXIgc2V0IGluIHRoaXMuX3Nob3J0Y3V0c1xuXHRcdFx0XHRcdC8vIGJlY2F1c2UgdGhlIGlucHV0IGNvbnN1bWVzIHRoZSBldmVudFxuXHRcdFx0XHRcdHRoaXMuX3RlbXBsYXRlTW9kZWwuc2VsZWN0TmV4dFRlbXBsYXRlKGlzS2V5UHJlc3NlZChrZXlQcmVzcy5rZXksIEtleXMuVVApID8gU0VMRUNUX1BSRVZfVEVNUExBVEUgOiBTRUxFQ1RfTkVYVF9URU1QTEFURSlcblxuXHRcdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB0cnVlXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRvbmlucHV0OiAodmFsdWUpID0+IHtcblx0XHRcdFx0dGhpcy5fZGVib3VuY2VGaWx0ZXIodmFsdWUpXG5cdFx0XHR9LFxuXHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHR0aGlzLl9pbnB1dERvbSA9IHZub2RlLmRvbS5maXJzdEVsZW1lbnRDaGlsZCBhcyBIVE1MRWxlbWVudCAvLyBmaXJzdEVsZW1lbnRDaGlsZCBpcyB0aGUgaW5wdXQgZmllbGQgb2YgdGhlIGlucHV0IHdyYXBwZXJcblx0XHRcdH0sXG5cdFx0fSlcblx0fVxuXG5cdF9yZW5kZXJBZGRCdXR0b24oKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGF0dHJzID0gdGhpcy5fY3JlYXRlQWRkQnV0dG9uQXR0cmlidXRlcygpXG5cblx0XHRyZXR1cm4gbShcblx0XHRcdFwiXCIsXG5cdFx0XHR7XG5cdFx0XHRcdG9ua2V5ZG93bjogKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRcdFx0XHQvLyBwcmV2ZW50cyB0YWJiaW5nIGludG8gdGhlIGJhY2tncm91bmQgb2YgdGhlIG1vZGFsXG5cdFx0XHRcdFx0aWYgKGlzS2V5UHJlc3NlZChlLmtleSwgS2V5cy5UQUIpICYmICF0aGlzLl90ZW1wbGF0ZU1vZGVsLmdldFNlbGVjdGVkVGVtcGxhdGUoKSkge1xuXHRcdFx0XHRcdFx0dGhpcy5faW5wdXREb20/LmZvY3VzKClcblxuXHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdGF0dHJzID8gbShJY29uQnV0dG9uLCBhdHRycyBhcyBJY29uQnV0dG9uQXR0cnMpIDogbnVsbCxcblx0XHQpXG5cdH1cblxuXHRfY3JlYXRlQWRkQnV0dG9uQXR0cmlidXRlcygpOiBJY29uQnV0dG9uQXR0cnMgfCBudWxsIHtcblx0XHRjb25zdCB0ZW1wbGF0ZUdyb3VwSW5zdGFuY2VzID0gdGhpcy5fdGVtcGxhdGVNb2RlbC5nZXRUZW1wbGF0ZUdyb3VwSW5zdGFuY2VzKClcblxuXHRcdGNvbnN0IHdyaXRlYWJsZUdyb3VwcyA9IHRlbXBsYXRlR3JvdXBJbnN0YW5jZXMuZmlsdGVyKChpbnN0YW5jZSkgPT5cblx0XHRcdGhhc0NhcGFiaWxpdHlPbkdyb3VwKGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlciwgaW5zdGFuY2UuZ3JvdXAsIFNoYXJlQ2FwYWJpbGl0eS5Xcml0ZSksXG5cdFx0KVxuXG5cdFx0aWYgKHRlbXBsYXRlR3JvdXBJbnN0YW5jZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0aXRsZTogXCJjcmVhdGVUZW1wbGF0ZV9hY3Rpb25cIixcblx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRjcmVhdGVJbml0aWFsVGVtcGxhdGVMaXN0SWZBbGxvd2VkKCkudGhlbigoZ3JvdXBSb290KSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoZ3JvdXBSb290KSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc2hvd1RlbXBsYXRlRWRpdG9yKG51bGwsIGdyb3VwUm9vdClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRpY29uOiBJY29ucy5BZGQsXG5cdFx0XHRcdGNvbG9yczogQnV0dG9uQ29sb3IuRHJhd2VyTmF2LFxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAod3JpdGVhYmxlR3JvdXBzLmxlbmd0aCA9PT0gMSkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dGl0bGU6IFwiY3JlYXRlVGVtcGxhdGVfYWN0aW9uXCIsXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLnNob3dUZW1wbGF0ZUVkaXRvcihudWxsLCB3cml0ZWFibGVHcm91cHNbMF0uZ3JvdXBSb290KSxcblx0XHRcdFx0aWNvbjogSWNvbnMuQWRkLFxuXHRcdFx0XHRjb2xvcnM6IEJ1dHRvbkNvbG9yLkRyYXdlck5hdixcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHdyaXRlYWJsZUdyb3Vwcy5sZW5ndGggPiAxKSB7XG5cdFx0XHRyZXR1cm4gYXR0YWNoRHJvcGRvd24oe1xuXHRcdFx0XHRtYWluQnV0dG9uQXR0cnM6IHtcblx0XHRcdFx0XHR0aXRsZTogXCJjcmVhdGVUZW1wbGF0ZV9hY3Rpb25cIixcblx0XHRcdFx0XHRpY29uOiBJY29ucy5BZGQsXG5cdFx0XHRcdFx0Y29sb3JzOiBCdXR0b25Db2xvci5EcmF3ZXJOYXYsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNoaWxkQXR0cnM6ICgpID0+XG5cdFx0XHRcdFx0d3JpdGVhYmxlR3JvdXBzLm1hcCgoZ3JvdXBJbnN0YW5jZXMpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdGxhYmVsOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcImdyb3VwX25hbWVcIiwgZ2V0U2hhcmVkR3JvdXBOYW1lKGdyb3VwSW5zdGFuY2VzLmdyb3VwSW5mbywgbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKSwgdHJ1ZSkpLFxuXHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4gdGhpcy5zaG93VGVtcGxhdGVFZGl0b3IobnVsbCwgZ3JvdXBJbnN0YW5jZXMuZ3JvdXBSb290KSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KSxcblx0XHRcdH0pXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG5cblx0X3JlbmRlckVkaXRCdXR0b25zKHNlbGVjdGVkVGVtcGxhdGU6IEVtYWlsVGVtcGxhdGUpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3Qgc2VsZWN0ZWRDb250ZW50ID0gdGhpcy5fdGVtcGxhdGVNb2RlbC5nZXRTZWxlY3RlZENvbnRlbnQoKVxuXG5cdFx0Y29uc3Qgc2VsZWN0ZWRHcm91cCA9IHRoaXMuX3RlbXBsYXRlTW9kZWwuZ2V0U2VsZWN0ZWRUZW1wbGF0ZUdyb3VwSW5zdGFuY2UoKVxuXG5cdFx0Y29uc3QgY2FuRWRpdCA9ICEhc2VsZWN0ZWRHcm91cCAmJiBoYXNDYXBhYmlsaXR5T25Hcm91cChsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXIsIHNlbGVjdGVkR3JvdXAuZ3JvdXAsIFNoYXJlQ2FwYWJpbGl0eS5Xcml0ZSlcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcIi5mbGV4LmZsZXgtY29sdW1uLmp1c3RpZnktY2VudGVyLm1yLW1cIiwgc2VsZWN0ZWRDb250ZW50ID8gbShcIlwiLCBsYW5nLmdldChsYW5ndWFnZUJ5Q29kZVtzZWxlY3RlZENvbnRlbnQubGFuZ3VhZ2VDb2RlXS50ZXh0SWQpKSA6IFwiXCIpLFxuXHRcdFx0bShcblx0XHRcdFx0SWNvbkJ1dHRvbixcblx0XHRcdFx0YXR0YWNoRHJvcGRvd24oe1xuXHRcdFx0XHRcdG1haW5CdXR0b25BdHRyczoge1xuXHRcdFx0XHRcdFx0dGl0bGU6IFwiY2hvb3NlTGFuZ3VhZ2VfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRpY29uOiBJY29ucy5MYW5ndWFnZSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGNoaWxkQXR0cnM6ICgpID0+XG5cdFx0XHRcdFx0XHRzZWxlY3RlZFRlbXBsYXRlLmNvbnRlbnRzLm1hcCgoY29udGVudCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBsYW5nQ29kZTogTGFuZ3VhZ2VDb2RlID0gZG93bmNhc3QoY29udGVudC5sYW5ndWFnZUNvZGUpXG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0bGFiZWw6IGxhbmd1YWdlQnlDb2RlW2xhbmdDb2RlXS50ZXh0SWQsXG5cdFx0XHRcdFx0XHRcdFx0Y2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLl90ZW1wbGF0ZU1vZGVsLnNldFNlbGVjdGVkQ29udGVudExhbmd1YWdlKGxhbmdDb2RlKVxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5faW5wdXREb20/LmZvY3VzKClcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0fSksXG5cdFx0XHQpLFxuXHRcdFx0Y2FuRWRpdFxuXHRcdFx0XHQ/IFtcblx0XHRcdFx0XHRcdG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHR0aXRsZTogXCJlZGl0VGVtcGxhdGVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PlxuXHRcdFx0XHRcdFx0XHRcdGxvY2F0b3IuZW50aXR5Q2xpZW50XG5cdFx0XHRcdFx0XHRcdFx0XHQubG9hZChUZW1wbGF0ZUdyb3VwUm9vdFR5cGVSZWYsIG5ldmVyTnVsbChzZWxlY3RlZFRlbXBsYXRlLl9vd25lckdyb3VwKSlcblx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKChncm91cFJvb3QpID0+IHRoaXMuc2hvd1RlbXBsYXRlRWRpdG9yKHNlbGVjdGVkVGVtcGxhdGUsIGdyb3VwUm9vdCkpLFxuXHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5FZGl0LFxuXHRcdFx0XHRcdFx0XHRjb2xvcnM6IEJ1dHRvbkNvbG9yLkRyYXdlck5hdixcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0bShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBcInJlbW92ZV9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRnZXRDb25maXJtYXRpb24oXCJkZWxldGVUZW1wbGF0ZV9tc2dcIikuY29uZmlybWVkKCgpID0+IGxvY2F0b3IuZW50aXR5Q2xpZW50LmVyYXNlKHNlbGVjdGVkVGVtcGxhdGUpKVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5UcmFzaCxcblx0XHRcdFx0XHRcdFx0Y29sb3JzOiBCdXR0b25Db2xvci5EcmF3ZXJOYXYsXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0ICBdXG5cdFx0XHRcdDogbnVsbCxcblx0XHRcdG0oXCIucHItc1wiLCBtKFwiLm5hdi1iYXItc3BhY2VyXCIpKSxcblx0XHRcdG0oXG5cdFx0XHRcdFwiXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRvbmtleWRvd246IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHQvLyBwcmV2ZW50cyB0YWJiaW5nIGludG8gdGhlIGJhY2tncm91bmQgb2YgdGhlIG1vZGFsXG5cdFx0XHRcdFx0XHRpZiAoaXNLZXlQcmVzc2VkKGUua2V5LCBLZXlzLlRBQikpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5faW5wdXREb20/LmZvY3VzKClcblxuXHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtKEJ1dHRvbiwgdGhpcy5fc2VsZWN0VGVtcGxhdGVCdXR0b25BdHRycyksXG5cdFx0XHQpLFxuXHRcdF1cblx0fVxuXG5cdF9yZW5kZXJMaXN0KCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShTY3JvbGxTZWxlY3RMaXN0LCB7XG5cdFx0XHRpdGVtczogdGhpcy5fdGVtcGxhdGVNb2RlbC5zZWFyY2hSZXN1bHRzKCksXG5cdFx0XHRzZWxlY3RlZEl0ZW06IHRoaXMuX3RlbXBsYXRlTW9kZWwuc2VsZWN0ZWRUZW1wbGF0ZSgpLFxuXHRcdFx0b25JdGVtU2VsZWN0ZWQ6IHRoaXMuX3RlbXBsYXRlTW9kZWwuc2VsZWN0ZWRUZW1wbGF0ZSxcblx0XHRcdGVtcHR5TGlzdE1lc3NhZ2U6ICgpID0+ICh0aGlzLl90ZW1wbGF0ZU1vZGVsLmlzTG9hZGVkKCkgPyBcIm5vdGhpbmdGb3VuZF9sYWJlbFwiIDogXCJsb2FkaW5nVGVtcGxhdGVzX2xhYmVsXCIpLFxuXHRcdFx0d2lkdGg6IFRFTVBMQVRFX0xJU1RfRU5UUllfV0lEVEgsXG5cdFx0XHRyZW5kZXJJdGVtOiAodGVtcGxhdGU6IEVtYWlsVGVtcGxhdGUpID0+XG5cdFx0XHRcdG0oVGVtcGxhdGVQb3B1cFJlc3VsdFJvdywge1xuXHRcdFx0XHRcdHRlbXBsYXRlOiB0ZW1wbGF0ZSxcblx0XHRcdFx0fSksXG5cdFx0XHRvbkl0ZW1Eb3VibGVDbGlja2VkOiAoXzogRW1haWxUZW1wbGF0ZSkgPT4ge1xuXHRcdFx0XHRjb25zdCBzZWxlY3RlZCA9IHRoaXMuX3RlbXBsYXRlTW9kZWwuZ2V0U2VsZWN0ZWRDb250ZW50KClcblxuXHRcdFx0XHRpZiAoc2VsZWN0ZWQpIHtcblx0XHRcdFx0XHR0aGlzLl9vblNlbGVjdChzZWxlY3RlZC50ZXh0KVxuXG5cdFx0XHRcdFx0dGhpcy5fY2xvc2UoKVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRfcmVuZGVyUmlnaHRDb2x1bW4oKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHRlbXBsYXRlID0gdGhpcy5fdGVtcGxhdGVNb2RlbC5nZXRTZWxlY3RlZFRlbXBsYXRlKClcblxuXHRcdGlmICh0ZW1wbGF0ZSkge1xuXHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0bShUZW1wbGF0ZUV4cGFuZGVyLCB7XG5cdFx0XHRcdFx0dGVtcGxhdGU6IHRlbXBsYXRlLFxuXHRcdFx0XHRcdG1vZGVsOiB0aGlzLl90ZW1wbGF0ZU1vZGVsLFxuXHRcdFx0XHR9KSxcblx0XHRcdF1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cdH1cblxuXHRfaXNTY3JlZW5XaWRlRW5vdWdoKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB3aW5kb3cuaW5uZXJXaWR0aCA+IFRFTVBMQVRFX1BPUFVQX1RXT19DT0xVTU5fTUlOX1dJRFRIXG5cdH1cblxuXHRfZ2V0V2luZG93V2lkdGhDaGFuZ2UoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gd2luZG93LmlubmVyV2lkdGggLSB0aGlzLl9pbml0aWFsV2luZG93V2lkdGhcblx0fVxuXG5cdHNob3coKSB7XG5cdFx0dGhpcy5mb2N1c2VkQmVmb3JlU2hvd24gPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50XG5cdFx0bW9kYWwuZGlzcGxheSh0aGlzLCBmYWxzZSlcblx0fVxuXG5cdF9jbG9zZSgpOiB2b2lkIHtcblx0XHRtb2RhbC5yZW1vdmUodGhpcylcblx0fVxuXG5cdGJhY2tncm91bmRDbGljayhlOiBNb3VzZUV2ZW50KTogdm9pZCB7XG5cdFx0dGhpcy5yZXN0b3JlRWRpdG9yRm9jdXM/LigpXG5cdFx0dGhpcy5fY2xvc2UoKVxuXHR9XG5cblx0aGlkZUFuaW1hdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcblx0fVxuXG5cdG9uQ2xvc2UoKTogdm9pZCB7XG5cdFx0dGhpcy5fcmVkcmF3U3RyZWFtLmVuZCh0cnVlKVxuXHR9XG5cblx0c2hvcnRjdXRzKCk6IFNob3J0Y3V0W10ge1xuXHRcdHJldHVybiB0aGlzLl9zaG9ydGN1dHNcblx0fVxuXG5cdHBvcFN0YXRlKGU6IEV2ZW50KTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRydWVcblx0fVxuXG5cdGNhbGxpbmdFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuZm9jdXNlZEJlZm9yZVNob3duXG5cdH1cblxuXHRzaG93VGVtcGxhdGVFZGl0b3IodGVtcGxhdGVUb0VkaXQ6IEVtYWlsVGVtcGxhdGUgfCBudWxsLCBncm91cFJvb3Q6IFRlbXBsYXRlR3JvdXBSb290KSB7XG5cdFx0aW1wb3J0KFwiLi4vLi4vc2V0dGluZ3MvVGVtcGxhdGVFZGl0b3IuanNcIikudGhlbigoZWRpdG9yKSA9PiB7XG5cdFx0XHRlZGl0b3Iuc2hvd1RlbXBsYXRlRWRpdG9yKHRlbXBsYXRlVG9FZGl0LCBncm91cFJvb3QpXG5cdFx0fSlcblx0fVxufVxuIiwiaW1wb3J0IHsgRWRpdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvZWRpdG9yL0VkaXRvclwiXG5pbXBvcnQgeyBpc0tleVByZXNzZWQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvS2V5TWFuYWdlclwiXG5pbXBvcnQgeyBkb3duY2FzdCwgZ2V0Rmlyc3RPclRocm93IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBLZXlzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IFRFTVBMQVRFX1NIT1JUQ1VUX1BSRUZJWCwgVGVtcGxhdGVQb3B1cE1vZGVsIH0gZnJvbSBcIi4uL21vZGVsL1RlbXBsYXRlUG9wdXBNb2RlbC5qc1wiXG5pbXBvcnQgeyBsYW5nLCBsYW5ndWFnZUJ5Q29kZSwgTGFuZ3VhZ2VWaWV3TW9kZWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgRHJvcGRvd24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0Ryb3Bkb3duLmpzXCJcbmltcG9ydCB7IG1vZGFsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Nb2RhbFwiXG5pbXBvcnQgeyBzaG93VGVtcGxhdGVQb3B1cEluRWRpdG9yIH0gZnJvbSBcIi4vVGVtcGxhdGVQb3B1cC5qc1wiXG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclRlbXBsYXRlU2hvcnRjdXRMaXN0ZW5lcihlZGl0b3I6IEVkaXRvciwgdGVtcGxhdGVNb2RlbDogVGVtcGxhdGVQb3B1cE1vZGVsKTogVGVtcGxhdGVTaG9ydGN1dExpc3RlbmVyIHtcblx0Y29uc3QgbGlzdGVuZXIgPSBuZXcgVGVtcGxhdGVTaG9ydGN1dExpc3RlbmVyKGVkaXRvciwgdGVtcGxhdGVNb2RlbCwgbGFuZylcblx0ZWRpdG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4gbGlzdGVuZXIuaGFuZGxlS2V5RG93bihldmVudCkpXG5cdGVkaXRvci5hZGRFdmVudExpc3RlbmVyKFwiY3Vyc29yXCIsIChldmVudDogQ3VzdG9tRXZlbnQ8eyByYW5nZTogUmFuZ2UgfCBudWxsIH0+KSA9PiBsaXN0ZW5lci5oYW5kbGVDdXJzb3JDaGFuZ2UoZXZlbnQpKVxuXHRyZXR1cm4gbGlzdGVuZXJcbn1cblxuY2xhc3MgVGVtcGxhdGVTaG9ydGN1dExpc3RlbmVyIHtcblx0X2N1cnJlbnRDdXJzb3JQb3NpdGlvbjogUmFuZ2UgfCBudWxsXG5cdF9lZGl0b3I6IEVkaXRvclxuXHRfdGVtcGxhdGVNb2RlbDogVGVtcGxhdGVQb3B1cE1vZGVsXG5cdF9sYW5nOiBMYW5ndWFnZVZpZXdNb2RlbFxuXG5cdGNvbnN0cnVjdG9yKGVkaXRvcjogRWRpdG9yLCB0ZW1wbGF0ZU1vZGVsOiBUZW1wbGF0ZVBvcHVwTW9kZWwsIGxhbmc6IExhbmd1YWdlVmlld01vZGVsKSB7XG5cdFx0dGhpcy5fZWRpdG9yID0gZWRpdG9yXG5cdFx0dGhpcy5fY3VycmVudEN1cnNvclBvc2l0aW9uID0gbnVsbFxuXHRcdHRoaXMuX3RlbXBsYXRlTW9kZWwgPSB0ZW1wbGF0ZU1vZGVsXG5cdFx0dGhpcy5fbGFuZyA9IGxhbmdcblx0fVxuXG5cdC8vIGFkZCB0aGlzIGV2ZW50IGxpc3RlbmVyIHRvIGhhbmRsZSBxdWljayBzZWxlY3Rpb24gb2YgdGVtcGxhdGVzIGluc2lkZSB0aGUgZWRpdG9yXG5cdGhhbmRsZUtleURvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcblx0XHRpZiAoaXNLZXlQcmVzc2VkKGV2ZW50LmtleSwgS2V5cy5UQUIpICYmIHRoaXMuX2N1cnJlbnRDdXJzb3JQb3NpdGlvbikge1xuXHRcdFx0Y29uc3QgY3Vyc29yRW5kUG9zID0gdGhpcy5fY3VycmVudEN1cnNvclBvc2l0aW9uXG5cdFx0XHRjb25zdCB0ZXh0ID0gY3Vyc29yRW5kUG9zLnN0YXJ0Q29udGFpbmVyLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSA/IGN1cnNvckVuZFBvcy5zdGFydENvbnRhaW5lci50ZXh0Q29udGVudCA/PyBcIlwiIDogXCJcIlxuXHRcdFx0Y29uc3QgdGVtcGxhdGVTaG9ydGN1dFN0YXJ0SW5kZXggPSB0ZXh0Lmxhc3RJbmRleE9mKFRFTVBMQVRFX1NIT1JUQ1VUX1BSRUZJWClcblx0XHRcdGNvbnN0IGxhc3RXaGl0ZVNwYWNlSW5kZXggPSB0ZXh0LnNlYXJjaCgvXFxzXFxTKiQvKVxuXG5cdFx0XHRpZiAoXG5cdFx0XHRcdHRlbXBsYXRlU2hvcnRjdXRTdGFydEluZGV4ICE9PSAtMSAmJlxuXHRcdFx0XHR0ZW1wbGF0ZVNob3J0Y3V0U3RhcnRJbmRleCA8IGN1cnNvckVuZFBvcy5zdGFydE9mZnNldCAmJlxuXHRcdFx0XHR0ZW1wbGF0ZVNob3J0Y3V0U3RhcnRJbmRleCA+IGxhc3RXaGl0ZVNwYWNlSW5kZXhcblx0XHRcdCkge1xuXHRcdFx0XHQvLyBzdG9wUHJvcGFnYXRpb24gJiBwcmV2ZW50RGVmYXVsdCB0byBwcmV2ZW50IHRhYmJpbmcgdG8gXCJjbG9zZVwiIGJ1dHRvbiBvciB0YWJiaW5nIGludG8gYmFja2dyb3VuZFxuXHRcdFx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdGNvbnN0IHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKVxuXHRcdFx0XHRyYW5nZS5zZXRTdGFydChjdXJzb3JFbmRQb3Muc3RhcnRDb250YWluZXIsIHRlbXBsYXRlU2hvcnRjdXRTdGFydEluZGV4KVxuXHRcdFx0XHRyYW5nZS5zZXRFbmQoY3Vyc29yRW5kUG9zLnN0YXJ0Q29udGFpbmVyLCBjdXJzb3JFbmRQb3Muc3RhcnRPZmZzZXQpXG5cblx0XHRcdFx0dGhpcy5fZWRpdG9yLnNldFNlbGVjdGlvbihyYW5nZSlcblxuXHRcdFx0XHQvLyBmaW5kIGFuZCBpbnNlcnQgdGVtcGxhdGVcblx0XHRcdFx0Y29uc3Qgc2VsZWN0ZWRUZXh0ID0gdGhpcy5fZWRpdG9yLmdldFNlbGVjdGVkVGV4dCgpXG5cblx0XHRcdFx0Y29uc3QgdGVtcGxhdGUgPSB0aGlzLl90ZW1wbGF0ZU1vZGVsLmZpbmRUZW1wbGF0ZVdpdGhUYWcoc2VsZWN0ZWRUZXh0KVxuXG5cdFx0XHRcdGlmICh0ZW1wbGF0ZSkge1xuXHRcdFx0XHRcdGlmICh0ZW1wbGF0ZS5jb250ZW50cy5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdFx0XHQvLyBtdWx0aXBsZSBsYW5ndWFnZXNcblx0XHRcdFx0XHRcdC8vIHNob3cgZHJvcGRvd24gdG8gc2VsZWN0IGxhbmd1YWdlXG5cdFx0XHRcdFx0XHRsZXQgYnV0dG9ucyA9IHRlbXBsYXRlLmNvbnRlbnRzLm1hcCgoY29udGVudCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBsYW5ndWFnZUJ5Q29kZVtkb3duY2FzdChjb250ZW50Lmxhbmd1YWdlQ29kZSldLnRleHRJZCxcblx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5fZWRpdG9yLmluc2VydEhUTUwoY29udGVudC50ZXh0KVxuXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLl9lZGl0b3IuZm9jdXMoKVxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRjb25zdCBkcm9wZG93biA9IG5ldyBEcm9wZG93bigoKSA9PiBidXR0b25zLCAyMDApXG5cdFx0XHRcdFx0XHRkcm9wZG93bi5zZXRPcmlnaW4odGhpcy5fZWRpdG9yLmdldEN1cnNvclBvc2l0aW9uKCkpXG5cdFx0XHRcdFx0XHRtb2RhbC5kaXNwbGF5VW5pcXVlKGRyb3Bkb3duLCBmYWxzZSlcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5fZWRpdG9yLmluc2VydEhUTUwoZ2V0Rmlyc3RPclRocm93KHRlbXBsYXRlLmNvbnRlbnRzKS50ZXh0KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzaG93VGVtcGxhdGVQb3B1cEluRWRpdG9yKHRoaXMuX3RlbXBsYXRlTW9kZWwsIHRoaXMuX2VkaXRvciwgbnVsbCwgc2VsZWN0ZWRUZXh0KVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aGFuZGxlQ3Vyc29yQ2hhbmdlKGV2ZW50OiBDdXN0b21FdmVudDx7IHJhbmdlOiBSYW5nZSB8IG51bGwgfT4pIHtcblx0XHR0aGlzLl9jdXJyZW50Q3Vyc29yUG9zaXRpb24gPSBldmVudC5kZXRhaWwucmFuZ2Vcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgdHlwZSB7IEtub3dsZWRnZUJhc2VFbnRyeSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IHB4IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc2l6ZS5qc1wiXG5cbmV4cG9ydCB0eXBlIEtub3dsZWRnZWJhc2VMaXN0RW50cnlBdHRycyA9IHtcblx0ZW50cnk6IEtub3dsZWRnZUJhc2VFbnRyeVxufVxuZXhwb3J0IGNvbnN0IEtOT1dMRURHRUJBU0VfTElTVF9FTlRSWV9IRUlHSFQgPSA1MFxuXG4vKipcbiAqICBSZW5kZXJzIG9uZSBsaXN0IGVudHJ5IG9mIHRoZSBrbm93bGVkZ2VCYXNlXG4gKi9cbmV4cG9ydCBjbGFzcyBLbm93bGVkZ2VCYXNlTGlzdEVudHJ5IGltcGxlbWVudHMgQ29tcG9uZW50PEtub3dsZWRnZWJhc2VMaXN0RW50cnlBdHRycz4ge1xuXHR2aWV3KHZub2RlOiBWbm9kZTxLbm93bGVkZ2ViYXNlTGlzdEVudHJ5QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgdGl0bGUsIGtleXdvcmRzIH0gPSB2bm9kZS5hdHRycy5lbnRyeVxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIuZmxleC5mbGV4LWNvbHVtbi5vdmVyZmxvdy1oaWRkZW4uZnVsbC13aWR0aFwiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdGhlaWdodDogcHgoS05PV0xFREdFQkFTRV9MSVNUX0VOVFJZX0hFSUdIVCksXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHRtKFwiLnRleHQtZWxsaXBzaXMubWIteHMuYlwiLCB0aXRsZSksXG5cdFx0XHRcdG0oXCIuZmxleC5iYWRnZS1saW5lLWhlaWdodC50ZXh0LWVsbGlwc2lzXCIsIFtcblx0XHRcdFx0XHRrZXl3b3Jkcy5tYXAoKGtleXdvcmQpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiBtKFwiLmIuc21hbGwudGVhbUxhYmVsLnBsLXMucHItcy5ib3JkZXItcmFkaXVzLm5vLXdyYXAuc21hbGwubXItcy5taW4tY29udGVudFwiLCBrZXl3b3JkLmtleXdvcmQpXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHR5cGUgeyBLbm93bGVkZ2VCYXNlRW50cnkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBUZW1wbGF0ZUdyb3VwUm9vdFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBtZW1vaXplZCwgbmV2ZXJOdWxsLCBub09wLCBvZkNsYXNzLCBzdGFydHNXaXRoIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBodG1sU2FuaXRpemVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0h0bWxTYW5pdGl6ZXIuanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zLmpzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3IuanNcIlxuaW1wb3J0IHsgZ2V0Q29uZmlybWF0aW9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9HdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBOb3RGb3VuZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvci5qc1wiXG5pbXBvcnQgeyBJY29uQnV0dG9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uQnV0dG9uLmpzXCJcblxudHlwZSBLbm93bGVkZ2VCYXNlRW50cnlWaWV3QXR0cnMgPSB7XG5cdGVudHJ5OiBLbm93bGVkZ2VCYXNlRW50cnlcblx0b25UZW1wbGF0ZVNlbGVjdGVkOiAoYXJnMDogSWRUdXBsZSkgPT4gdW5rbm93blxuXHRyZWFkb25seTogYm9vbGVhblxufVxuXG4vKipcbiAqICBSZW5kZXJzIG9uZSBrbm93bGVkZ2VCYXNlIGVudHJ5XG4gKi9cbmV4cG9ydCBjbGFzcyBLbm93bGVkZ2VCYXNlRW50cnlWaWV3IGltcGxlbWVudHMgQ29tcG9uZW50PEtub3dsZWRnZUJhc2VFbnRyeVZpZXdBdHRycz4ge1xuXHRfc2FuaXRpemVkRW50cnk6IChhcmcwOiBLbm93bGVkZ2VCYXNlRW50cnkpID0+IHtcblx0XHRjb250ZW50OiBzdHJpbmdcblx0fVxuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuX3Nhbml0aXplZEVudHJ5ID0gbWVtb2l6ZWQoKGVudHJ5KSA9PiB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRjb250ZW50OiBodG1sU2FuaXRpemVyLnNhbml0aXplSFRNTChlbnRyeS5kZXNjcmlwdGlvbiwge1xuXHRcdFx0XHRcdGJsb2NrRXh0ZXJuYWxDb250ZW50OiB0cnVlLFxuXHRcdFx0XHR9KS5odG1sLFxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8S25vd2xlZGdlQmFzZUVudHJ5Vmlld0F0dHJzPik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4LmZsZXgtY29sdW1uXCIsIFt0aGlzLl9yZW5kZXJDb250ZW50KGF0dHJzKV0pXG5cdH1cblxuXHRfcmVuZGVyQ29udGVudChhdHRyczogS25vd2xlZGdlQmFzZUVudHJ5Vmlld0F0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgZW50cnksIHJlYWRvbmx5IH0gPSBhdHRyc1xuXHRcdHJldHVybiBtKFxuXHRcdFx0XCJcIixcblx0XHRcdHtcblx0XHRcdFx0b25jbGljazogKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5faGFuZGxlQW5jaG9yQ2xpY2soZXZlbnQsIGF0dHJzKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIi5mbGV4Lm10LWwuY2VudGVyLXZlcnRpY2FsbHkuc2VsZWN0YWJsZVwiLFxuXHRcdFx0XHRcdG0oXCIuaDQudGV4dC1lbGxpcHNpc1wiLCBlbnRyeS50aXRsZSksXG5cdFx0XHRcdFx0IXJlYWRvbmx5ID8gW20oXCIuZmxleC5mbGV4LWdyb3cuanVzdGlmeS1lbmRcIiwgW3RoaXMucmVuZGVyRWRpdEJ1dHRvbihlbnRyeSksIHRoaXMucmVuZGVyUmVtb3ZlQnV0dG9uKGVudHJ5KV0pXSA6IG51bGwsXG5cdFx0XHRcdCksXG5cdFx0XHRcdG0oXCJcIiwgW1xuXHRcdFx0XHRcdG0oXCIubXQtcy5mbGV4Lm10LXMud3JhcFwiLCBbXG5cdFx0XHRcdFx0XHRlbnRyeS5rZXl3b3Jkcy5tYXAoKGVudHJ5S2V5d29yZCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gbShcIi5rZXl3b3JkLWJ1YmJsZS5zZWxlY3RhYmxlXCIsIGVudHJ5S2V5d29yZC5rZXl3b3JkKVxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XSksXG5cdFx0XHRcdFx0bShcIi5mbGV4LmZsZXgtY29sdW1uLm10LXNcIiwgW20oXCIuZWRpdG9yLWJvcmRlci50ZXh0LWJyZWFrLnNlbGVjdGFibGVcIiwgbS50cnVzdCh0aGlzLl9zYW5pdGl6ZWRFbnRyeShlbnRyeSkuY29udGVudCkpXSksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclJlbW92ZUJ1dHRvbihlbnRyeTogS25vd2xlZGdlQmFzZUVudHJ5KSB7XG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwicmVtb3ZlX2FjdGlvblwiLFxuXHRcdFx0aWNvbjogSWNvbnMuVHJhc2gsXG5cdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRnZXRDb25maXJtYXRpb24oXCJkZWxldGVFbnRyeUNvbmZpcm1fbXNnXCIpLmNvbmZpcm1lZCgoKSA9PiBsb2NhdG9yLmVudGl0eUNsaWVudC5lcmFzZShlbnRyeSkuY2F0Y2gob2ZDbGFzcyhOb3RGb3VuZEVycm9yLCBub09wKSkpXG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckVkaXRCdXR0b24oZW50cnk6IEtub3dsZWRnZUJhc2VFbnRyeSkge1xuXHRcdHJldHVybiBtKEljb25CdXR0b24sIHtcblx0XHRcdHRpdGxlOiBcImVkaXRfYWN0aW9uXCIsXG5cdFx0XHRpY29uOiBJY29ucy5FZGl0LFxuXHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0aW1wb3J0KFwiLi4vLi4vc2V0dGluZ3MvS25vd2xlZGdlQmFzZUVkaXRvci5qc1wiKS50aGVuKCh7IHNob3dLbm93bGVkZ2VCYXNlRWRpdG9yIH0pID0+IHtcblx0XHRcdFx0XHRsb2NhdG9yLmVudGl0eUNsaWVudC5sb2FkKFRlbXBsYXRlR3JvdXBSb290VHlwZVJlZiwgbmV2ZXJOdWxsKGVudHJ5Ll9vd25lckdyb3VwKSkudGhlbigoZ3JvdXBSb290KSA9PiB7XG5cdFx0XHRcdFx0XHRzaG93S25vd2xlZGdlQmFzZUVkaXRvcihlbnRyeSwgZ3JvdXBSb290KVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0pXG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRfaGFuZGxlQW5jaG9yQ2xpY2soZXZlbnQ6IEV2ZW50LCBhdHRyczogS25vd2xlZGdlQmFzZUVudHJ5Vmlld0F0dHJzKTogdm9pZCB7XG5cdFx0bGV0IHRhcmdldCA9IGV2ZW50LnRhcmdldCBhcyBhbnlcblxuXHRcdGlmICh0YXJnZXQgJiYgdGFyZ2V0LmNsb3Nlc3QpIHtcblx0XHRcdGxldCBhbmNob3JFbGVtZW50ID0gdGFyZ2V0LmNsb3Nlc3QoXCJhXCIpXG5cblx0XHRcdGlmIChhbmNob3JFbGVtZW50ICYmIHN0YXJ0c1dpdGgoYW5jaG9yRWxlbWVudC5ocmVmLCBcInR1dGF0ZW1wbGF0ZTpcIikpIHtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRjb25zdCBbbGlzdElkLCBlbGVtZW50SWRdID0gbmV3IFVSTChhbmNob3JFbGVtZW50LmhyZWYpLnBhdGhuYW1lLnNwbGl0KFwiL1wiKVxuXHRcdFx0XHRhdHRycy5vblRlbXBsYXRlU2VsZWN0ZWQoW2xpc3RJZCwgZWxlbWVudElkXSlcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgS25vd2xlZGdlQmFzZU1vZGVsIH0gZnJvbSBcIi4uL21vZGVsL0tub3dsZWRnZUJhc2VNb2RlbC5qc1wiXG5pbXBvcnQgdHlwZSB7IEVtYWlsVGVtcGxhdGUsIEtub3dsZWRnZUJhc2VFbnRyeSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IEtOT1dMRURHRUJBU0VfTElTVF9FTlRSWV9IRUlHSFQsIEtub3dsZWRnZUJhc2VMaXN0RW50cnkgfSBmcm9tIFwiLi9Lbm93bGVkZ2VCYXNlTGlzdEVudHJ5LmpzXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgS25vd2xlZGdlQmFzZUVudHJ5VmlldyB9IGZyb20gXCIuL0tub3dsZWRnZUJhc2VFbnRyeVZpZXcuanNcIlxuaW1wb3J0IHsgTm90Rm91bmRFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3IuanNcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2cuanNcIlxuaW1wb3J0IHsgVGV4dEZpZWxkIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9UZXh0RmllbGQuanNcIlxuaW1wb3J0IHsgbWFrZUxpc3RTZWxlY3Rpb25DaGFuZ2VkU2Nyb2xsSGFuZGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvR3VpVXRpbHMuanNcIlxuaW1wb3J0IHsgb2ZDbGFzcyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuXG5leHBvcnQgdHlwZSBLbm93bGVkZ2ViYXNlRGlhbG9nQ29udGVudEF0dHJzID0ge1xuXHRyZWFkb25seSBvblRlbXBsYXRlU2VsZWN0OiAoYXJnMDogRW1haWxUZW1wbGF0ZSkgPT4gdm9pZFxuXHRyZWFkb25seSBtb2RlbDogS25vd2xlZGdlQmFzZU1vZGVsXG59XG5cbi8qKlxuICogIFJlbmRlcnMgdGhlIFNlYXJjaEJhciBhbmQgdGhlIHBhZ2VzIChsaXN0LCBlbnRyeSwgdGVtcGxhdGUpIG9mIHRoZSBrbm93bGVkZ2VCYXNlIGJlc2lkZXMgdGhlIE1haWxFZGl0b3JcbiAqL1xuZXhwb3J0IGNsYXNzIEtub3dsZWRnZUJhc2VEaWFsb2dDb250ZW50IGltcGxlbWVudHMgQ29tcG9uZW50PEtub3dsZWRnZWJhc2VEaWFsb2dDb250ZW50QXR0cnM+IHtcblx0cHJpdmF0ZSBfc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+XG5cdHByaXZhdGUgZmlsdGVyVmFsdWU6IHN0cmluZyA9IFwiXCJcblx0cHJpdmF0ZSBfc2VsZWN0aW9uQ2hhbmdlZExpc3RlbmVyITogU3RyZWFtPHZvaWQ+XG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5fc3RyZWFtcyA9IFtdXG5cdH1cblxuXHRvbmNyZWF0ZSh7IGF0dHJzIH06IFZub2RlPEtub3dsZWRnZWJhc2VEaWFsb2dDb250ZW50QXR0cnM+KSB7XG5cdFx0Y29uc3QgeyBtb2RlbCB9ID0gYXR0cnNcblxuXHRcdHRoaXMuX3N0cmVhbXMucHVzaChcblx0XHRcdHN0cmVhbS5jb21iaW5lKCgpID0+IHtcblx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0fSwgW21vZGVsLnNlbGVjdGVkRW50cnksIG1vZGVsLmZpbHRlcmVkRW50cmllc10pLFxuXHRcdClcblx0fVxuXG5cdG9ucmVtb3ZlKCkge1xuXHRcdGZvciAobGV0IHN0cmVhbSBvZiB0aGlzLl9zdHJlYW1zKSB7XG5cdFx0XHRzdHJlYW0uZW5kKHRydWUpXG5cdFx0fVxuXHR9XG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPEtub3dsZWRnZWJhc2VEaWFsb2dDb250ZW50QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IG1vZGVsID0gYXR0cnMubW9kZWxcblx0XHRjb25zdCBzZWxlY3RlZEVudHJ5ID0gbW9kZWwuc2VsZWN0ZWRFbnRyeSgpXG5cdFx0cmV0dXJuIHNlbGVjdGVkRW50cnlcblx0XHRcdD8gbShLbm93bGVkZ2VCYXNlRW50cnlWaWV3LCB7XG5cdFx0XHRcdFx0ZW50cnk6IHNlbGVjdGVkRW50cnksXG5cdFx0XHRcdFx0b25UZW1wbGF0ZVNlbGVjdGVkOiAodGVtcGxhdGVJZCkgPT4ge1xuXHRcdFx0XHRcdFx0bW9kZWxcblx0XHRcdFx0XHRcdFx0LmxvYWRUZW1wbGF0ZSh0ZW1wbGF0ZUlkKVxuXHRcdFx0XHRcdFx0XHQudGhlbigoZmV0Y2hlZFRlbXBsYXRlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0YXR0cnMub25UZW1wbGF0ZVNlbGVjdChmZXRjaGVkVGVtcGxhdGUpXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdC5jYXRjaChvZkNsYXNzKE5vdEZvdW5kRXJyb3IsICgpID0+IERpYWxvZy5tZXNzYWdlKFwidGVtcGxhdGVOb3RFeGlzdHNfbXNnXCIpKSlcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHJlYWRvbmx5OiBtb2RlbC5pc1JlYWRPbmx5KHNlbGVjdGVkRW50cnkpLFxuXHRcdFx0ICB9KVxuXHRcdFx0OiBbXG5cdFx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImZpbHRlcl9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0dmFsdWU6IHRoaXMuZmlsdGVyVmFsdWUsXG5cdFx0XHRcdFx0XHRvbmlucHV0OiAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRcdFx0dGhpcy5maWx0ZXJWYWx1ZSA9IHZhbHVlXG5cdFx0XHRcdFx0XHRcdG1vZGVsLmZpbHRlcih2YWx1ZSlcblx0XHRcdFx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHR0aGlzLl9yZW5kZXJLZXl3b3Jkcyhtb2RlbCksXG5cdFx0XHRcdFx0dGhpcy5fcmVuZGVyTGlzdChtb2RlbCwgYXR0cnMpLFxuXHRcdFx0ICBdXG5cdH1cblxuXHRfcmVuZGVyS2V5d29yZHMobW9kZWw6IEtub3dsZWRnZUJhc2VNb2RlbCk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBtYXRjaGVkS2V5d29yZHMgPSBtb2RlbC5nZXRNYXRjaGVkS2V5d29yZHNJbkNvbnRlbnQoKVxuXHRcdHJldHVybiBtKFwiLmZsZXgubXQtcy53cmFwXCIsIFtcblx0XHRcdG1hdGNoZWRLZXl3b3Jkcy5sZW5ndGggPiAwID8gbShcIi5zbWFsbC5mdWxsLXdpZHRoXCIsIGxhbmcuZ2V0KFwibWF0Y2hpbmdLZXl3b3Jkc19sYWJlbFwiKSkgOiBudWxsLFxuXHRcdFx0bWF0Y2hlZEtleXdvcmRzLm1hcCgoa2V5d29yZCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gbShcIi5rZXl3b3JkLWJ1YmJsZS1uby1wYWRkaW5nLnBsci1idXR0b24ucGwtcy5wci1zLmJvcmRlci1yYWRpdXMubm8td3JhcC5tci1zLm1pbi1jb250ZW50XCIsIGtleXdvcmQpXG5cdFx0XHR9KSxcblx0XHRdKVxuXHR9XG5cblx0X3JlbmRlckxpc3QobW9kZWw6IEtub3dsZWRnZUJhc2VNb2RlbCwgYXR0cnM6IEtub3dsZWRnZWJhc2VEaWFsb2dDb250ZW50QXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5tdC1zLnNjcm9sbFwiLFxuXHRcdFx0e1xuXHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5fc2VsZWN0aW9uQ2hhbmdlZExpc3RlbmVyID0gbW9kZWwuc2VsZWN0ZWRFbnRyeS5tYXAoXG5cdFx0XHRcdFx0XHRtYWtlTGlzdFNlbGVjdGlvbkNoYW5nZWRTY3JvbGxIYW5kbGVyKFxuXHRcdFx0XHRcdFx0XHR2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQsXG5cdFx0XHRcdFx0XHRcdEtOT1dMRURHRUJBU0VfTElTVF9FTlRSWV9IRUlHSFQsXG5cdFx0XHRcdFx0XHRcdG1vZGVsLmdldFNlbGVjdGVkRW50cnlJbmRleC5iaW5kKG1vZGVsKSxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmJlZm9yZXJlbW92ZTogKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuX3NlbGVjdGlvbkNoYW5nZWRMaXN0ZW5lci5lbmQoKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0bW9kZWwuY29udGFpbnNSZXN1bHQoKVxuXHRcdFx0XHRcdD8gbW9kZWwuZmlsdGVyZWRFbnRyaWVzKCkubWFwKChlbnRyeSkgPT4gdGhpcy5fcmVuZGVyTGlzdEVudHJ5KG1vZGVsLCBlbnRyeSkpXG5cdFx0XHRcdFx0OiBtKFwiLmNlbnRlclwiLCBsYW5nLmdldChcIm5vRW50cnlGb3VuZF9sYWJlbFwiKSksXG5cdFx0XHRdLFxuXHRcdClcblx0fVxuXG5cdF9yZW5kZXJMaXN0RW50cnkobW9kZWw6IEtub3dsZWRnZUJhc2VNb2RlbCwgZW50cnk6IEtub3dsZWRnZUJhc2VFbnRyeSk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4LmZsZXgtY29sdW1uLmNsaWNrLmhvdmVyYWJsZS1saXN0LWl0ZW1cIiwgW1xuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleFwiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0b25jbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0bW9kZWwuc2VsZWN0ZWRFbnRyeShlbnRyeSlcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0bShLbm93bGVkZ2VCYXNlTGlzdEVudHJ5LCB7XG5cdFx0XHRcdFx0XHRlbnRyeTogZW50cnksXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0bShcIlwiLCB7XG5cdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHR3aWR0aDogXCIxNy4xcHhcIixcblx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBcIjE2cHhcIixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdF0sXG5cdFx0XHQpLFxuXHRcdF0pXG5cdH1cbn1cbiIsImltcG9ydCB7IEtub3dsZWRnZUJhc2VNb2RlbCB9IGZyb20gXCIuLi9tb2RlbC9Lbm93bGVkZ2VCYXNlTW9kZWwuanNcIlxuaW1wb3J0IHsgRWRpdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvZWRpdG9yL0VkaXRvci5qc1wiXG5pbXBvcnQgdHlwZSB7IEtub3dsZWRnZWJhc2VEaWFsb2dDb250ZW50QXR0cnMgfSBmcm9tIFwiLi9Lbm93bGVkZ2VCYXNlRGlhbG9nQ29udGVudC5qc1wiXG5pbXBvcnQgeyBLbm93bGVkZ2VCYXNlRGlhbG9nQ29udGVudCB9IGZyb20gXCIuL0tub3dsZWRnZUJhc2VEaWFsb2dDb250ZW50LmpzXCJcbmltcG9ydCB7IHNob3dUZW1wbGF0ZVBvcHVwSW5FZGl0b3IgfSBmcm9tIFwiLi4vLi4vdGVtcGxhdGVzL3ZpZXcvVGVtcGxhdGVQb3B1cC5qc1wiXG5pbXBvcnQgdHlwZSB7IEJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB0eXBlIHsgRGlhbG9nSGVhZGVyQmFyQXR0cnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZ0hlYWRlckJhci5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB0eXBlIHsgS25vd2xlZGdlQmFzZUVudHJ5LCBUZW1wbGF0ZUdyb3VwUm9vdCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB0eXBlIHsgbGF6eSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgY3JlYXRlRHJvcGRvd24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0Ryb3Bkb3duLmpzXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB0eXBlIHsgRGlhbG9nSW5qZWN0aW9uUmlnaHRBdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nSW5qZWN0aW9uUmlnaHQuanNcIlxuaW1wb3J0IHsgVGVtcGxhdGVQb3B1cE1vZGVsIH0gZnJvbSBcIi4uLy4uL3RlbXBsYXRlcy9tb2RlbC9UZW1wbGF0ZVBvcHVwTW9kZWwuanNcIlxuXG5pbXBvcnQgeyBnZXRTaGFyZWRHcm91cE5hbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL3NoYXJpbmcvR3JvdXBVdGlscy5qc1wiXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVLbm93bGVkZ2VCYXNlRGlhbG9nSW5qZWN0aW9uKFxuXHRrbm93bGVkZ2VCYXNlOiBLbm93bGVkZ2VCYXNlTW9kZWwsXG5cdHRlbXBsYXRlTW9kZWw6IFRlbXBsYXRlUG9wdXBNb2RlbCxcblx0ZWRpdG9yOiBFZGl0b3IsXG4pOiBEaWFsb2dJbmplY3Rpb25SaWdodEF0dHJzPEtub3dsZWRnZWJhc2VEaWFsb2dDb250ZW50QXR0cnM+IHtcblx0Y29uc3Qga25vd2xlZGdlYmFzZUF0dHJzOiBLbm93bGVkZ2ViYXNlRGlhbG9nQ29udGVudEF0dHJzID0ge1xuXHRcdG9uVGVtcGxhdGVTZWxlY3Q6ICh0ZW1wbGF0ZSkgPT4ge1xuXHRcdFx0c2hvd1RlbXBsYXRlUG9wdXBJbkVkaXRvcih0ZW1wbGF0ZU1vZGVsLCBlZGl0b3IsIHRlbXBsYXRlLCBcIlwiKVxuXHRcdH0sXG5cdFx0bW9kZWw6IGtub3dsZWRnZUJhc2UsXG5cdH1cblx0Y29uc3QgaXNEaWFsb2dWaXNpYmxlID0gc3RyZWFtKGZhbHNlKVxuXHRyZXR1cm4ge1xuXHRcdHZpc2libGU6IGlzRGlhbG9nVmlzaWJsZSxcblx0XHRoZWFkZXJBdHRyczogX2NyZWF0ZUhlYWRlckF0dHJzKGtub3dsZWRnZWJhc2VBdHRycywgaXNEaWFsb2dWaXNpYmxlKSxcblx0XHRjb21wb25lbnRBdHRyczoga25vd2xlZGdlYmFzZUF0dHJzLFxuXHRcdGNvbXBvbmVudDogS25vd2xlZGdlQmFzZURpYWxvZ0NvbnRlbnQsXG5cdH1cbn1cblxuZnVuY3Rpb24gX2NyZWF0ZUhlYWRlckF0dHJzKGF0dHJzOiBLbm93bGVkZ2ViYXNlRGlhbG9nQ29udGVudEF0dHJzLCBpc0RpYWxvZ1Zpc2libGU6IFN0cmVhbTxib29sZWFuPik6IGxhenk8RGlhbG9nSGVhZGVyQmFyQXR0cnM+IHtcblx0cmV0dXJuICgpID0+IHtcblx0XHRjb25zdCBzZWxlY3RlZEVudHJ5ID0gYXR0cnMubW9kZWwuc2VsZWN0ZWRFbnRyeSgpXG5cdFx0cmV0dXJuIHNlbGVjdGVkRW50cnkgPyBjcmVhdGVFbnRyeVZpZXdIZWFkZXIoc2VsZWN0ZWRFbnRyeSwgYXR0cnMubW9kZWwpIDogY3JlYXRlTGlzdFZpZXdIZWFkZXIoYXR0cnMubW9kZWwsIGlzRGlhbG9nVmlzaWJsZSlcblx0fVxufVxuXG5mdW5jdGlvbiBjcmVhdGVFbnRyeVZpZXdIZWFkZXIoZW50cnk6IEtub3dsZWRnZUJhc2VFbnRyeSwgbW9kZWw6IEtub3dsZWRnZUJhc2VNb2RlbCk6IERpYWxvZ0hlYWRlckJhckF0dHJzIHtcblx0cmV0dXJuIHtcblx0XHRsZWZ0OiBbXG5cdFx0XHR7XG5cdFx0XHRcdGxhYmVsOiBcImJhY2tfYWN0aW9uXCIsXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiBtb2RlbC5zZWxlY3RlZEVudHJ5KG51bGwpLFxuXHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdH0sXG5cdFx0XSxcblx0XHRtaWRkbGU6IFwia25vd2xlZGdlYmFzZV9sYWJlbFwiLFxuXHR9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpc3RWaWV3SGVhZGVyKG1vZGVsOiBLbm93bGVkZ2VCYXNlTW9kZWwsIGlzRGlhbG9nVmlzaWJsZTogU3RyZWFtPGJvb2xlYW4+KTogRGlhbG9nSGVhZGVyQmFyQXR0cnMge1xuXHRyZXR1cm4ge1xuXHRcdGxlZnQ6ICgpID0+IFtcblx0XHRcdHtcblx0XHRcdFx0bGFiZWw6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiBpc0RpYWxvZ1Zpc2libGUoZmFsc2UpLFxuXHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlByaW1hcnksXG5cdFx0XHR9LFxuXHRcdF0sXG5cdFx0bWlkZGxlOiBcImtub3dsZWRnZWJhc2VfbGFiZWxcIixcblx0XHRyaWdodDogW2NyZWF0ZUFkZEJ1dHRvbkF0dHJzKG1vZGVsKV0sXG5cdH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlQWRkQnV0dG9uQXR0cnMobW9kZWw6IEtub3dsZWRnZUJhc2VNb2RlbCk6IEJ1dHRvbkF0dHJzIHtcblx0Y29uc3QgdGVtcGxhdGVHcm91cEluc3RhbmNlcyA9IG1vZGVsLmdldFRlbXBsYXRlR3JvdXBJbnN0YW5jZXMoKVxuXG5cdGlmICh0ZW1wbGF0ZUdyb3VwSW5zdGFuY2VzLmxlbmd0aCA9PT0gMSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRsYWJlbDogXCJhZGRfYWN0aW9uXCIsXG5cdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRzaG93S25vd2xlZGdlQmFzZUVkaXRvcihudWxsLCB0ZW1wbGF0ZUdyb3VwSW5zdGFuY2VzWzBdLmdyb3VwUm9vdClcblx0XHRcdH0sXG5cdFx0XHR0eXBlOiBCdXR0b25UeXBlLlByaW1hcnksXG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiB7XG5cdFx0XHRsYWJlbDogXCJhZGRfYWN0aW9uXCIsXG5cdFx0XHR0eXBlOiBCdXR0b25UeXBlLlByaW1hcnksXG5cdFx0XHRjbGljazogY3JlYXRlRHJvcGRvd24oe1xuXHRcdFx0XHRsYXp5QnV0dG9uczogKCkgPT5cblx0XHRcdFx0XHR0ZW1wbGF0ZUdyb3VwSW5zdGFuY2VzLm1hcCgoZ3JvdXBJbnN0YW5jZXMpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdGxhYmVsOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcImdyb3VwX25hbWVcIiwgZ2V0U2hhcmVkR3JvdXBOYW1lKGdyb3VwSW5zdGFuY2VzLmdyb3VwSW5mbywgbW9kZWwudXNlckNvbnRyb2xsZXIsIHRydWUpKSxcblx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRzaG93S25vd2xlZGdlQmFzZUVkaXRvcihudWxsLCBncm91cEluc3RhbmNlcy5ncm91cFJvb3QpXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSksXG5cdFx0XHR9KSxcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gc2hvd0tub3dsZWRnZUJhc2VFZGl0b3IoZW50cnlUb0VkaXQ6IEtub3dsZWRnZUJhc2VFbnRyeSB8IG51bGwsIGdyb3VwUm9vdDogVGVtcGxhdGVHcm91cFJvb3QpIHtcblx0aW1wb3J0KFwiLi4vLi4vc2V0dGluZ3MvS25vd2xlZGdlQmFzZUVkaXRvci5qc1wiKS50aGVuKChlZGl0b3IpID0+IHtcblx0XHRlZGl0b3Iuc2hvd0tub3dsZWRnZUJhc2VFZGl0b3IoZW50cnlUb0VkaXQsIGdyb3VwUm9vdClcblx0fSlcbn1cbiIsImltcG9ydCB0eXBlIHsgS25vd2xlZGdlQmFzZUVudHJ5IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgc2VhcmNoIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL1BsYWluVGV4dFNlYXJjaC5qc1wiXG5cbmV4cG9ydCBmdW5jdGlvbiBrbm93bGVkZ2VCYXNlU2VhcmNoKGlucHV0OiBzdHJpbmcsIGFsbEVudHJpZXM6IFJlYWRvbmx5QXJyYXk8S25vd2xlZGdlQmFzZUVudHJ5Pik6IFJlYWRvbmx5QXJyYXk8S25vd2xlZGdlQmFzZUVudHJ5PiB7XG5cdHJldHVybiBzZWFyY2goaW5wdXQsIGFsbEVudHJpZXMsIFtcInRpdGxlXCIsIFwiZGVzY3JpcHRpb25cIiwgXCJrZXl3b3Jkcy5rZXl3b3JkXCJdLCBmYWxzZSlcbn1cbiIsImltcG9ydCB0eXBlIHsgRW1haWxUZW1wbGF0ZSwgS25vd2xlZGdlQmFzZUVudHJ5IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgRW1haWxUZW1wbGF0ZVR5cGVSZWYsIEtub3dsZWRnZUJhc2VFbnRyeVR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7IGtub3dsZWRnZUJhc2VTZWFyY2ggfSBmcm9tIFwiLi9Lbm93bGVkZ2VCYXNlU2VhcmNoRmlsdGVyLmpzXCJcbmltcG9ydCB0eXBlIHsgTGFuZ3VhZ2VDb2RlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgT3BlcmF0aW9uVHlwZSwgU2hhcmVDYXBhYmlsaXR5IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IGRvd25jYXN0LCBMYXp5TG9hZGVkLCBub09wLCBwcm9taXNlTWFwLCBTb3J0ZWRBcnJheSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgZ2V0RWxlbWVudElkLCBnZXRFdElkLCBnZXRMZXRJZCwgaXNTYW1lSWQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHR5cGUgeyBUZW1wbGF0ZUdyb3VwSW5zdGFuY2UgfSBmcm9tIFwiLi4vLi4vdGVtcGxhdGVzL21vZGVsL1RlbXBsYXRlR3JvdXBNb2RlbC5qc1wiXG5pbXBvcnQgeyBsb2FkVGVtcGxhdGVHcm91cEluc3RhbmNlIH0gZnJvbSBcIi4uLy4uL3RlbXBsYXRlcy9tb2RlbC9UZW1wbGF0ZVBvcHVwTW9kZWwuanNcIlxuaW1wb3J0IHR5cGUgeyBVc2VyQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vVXNlckNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgaGFzQ2FwYWJpbGl0eU9uR3JvdXAgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL3NoYXJpbmcvR3JvdXBVdGlscy5qc1wiXG5pbXBvcnQgeyBFbnRpdHlVcGRhdGVEYXRhLCBpc1VwZGF0ZUZvclR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXBkYXRlVXRpbHMuanNcIlxuaW1wb3J0IHsgRW50aXR5RXZlbnRzTGlzdGVuZXIsIEV2ZW50Q29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vRXZlbnRDb250cm9sbGVyLmpzXCJcblxuZXhwb3J0IGNvbnN0IFNFTEVDVF9ORVhUX0VOVFJZID0gXCJuZXh0XCJcblxuZnVuY3Rpb24gY29tcGFyZUtub3dsZWRnZUJhc2VFbnRyaWVzRm9yU29ydChlbnRyeTE6IEtub3dsZWRnZUJhc2VFbnRyeSwgZW50cnkyOiBLbm93bGVkZ2VCYXNlRW50cnkpOiBudW1iZXIge1xuXHRyZXR1cm4gZW50cnkxLnRpdGxlLmxvY2FsZUNvbXBhcmUoZW50cnkyLnRpdGxlKVxufVxuXG4vKipcbiAqICAgTW9kZWwgdGhhdCBob2xkcyBtYWluIGxvZ2ljIGZvciB0aGUgS25vd2xlZGdlYmFzZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEtub3dsZWRnZUJhc2VNb2RlbCB7XG5cdF9hbGxFbnRyaWVzOiBTb3J0ZWRBcnJheTxLbm93bGVkZ2VCYXNlRW50cnk+XG5cdGZpbHRlcmVkRW50cmllczogU3RyZWFtPFJlYWRvbmx5QXJyYXk8S25vd2xlZGdlQmFzZUVudHJ5Pj5cblx0c2VsZWN0ZWRFbnRyeTogU3RyZWFtPEtub3dsZWRnZUJhc2VFbnRyeSB8IG51bGw+XG5cdF9hbGxLZXl3b3JkczogQXJyYXk8c3RyaW5nPlxuXHRfbWF0Y2hlZEtleXdvcmRzSW5Db250ZW50OiBBcnJheTxzdHJpbmcgfCBudWxsPlxuXHRfZmlsdGVyVmFsdWU6IHN0cmluZ1xuXHRyZWFkb25seSBfZXZlbnRDb250cm9sbGVyOiBFdmVudENvbnRyb2xsZXJcblx0cmVhZG9ubHkgX2VudGl0eUNsaWVudDogRW50aXR5Q2xpZW50XG5cdHJlYWRvbmx5IF9lbnRpdHlFdmVudFJlY2VpdmVkOiBFbnRpdHlFdmVudHNMaXN0ZW5lclxuXHRfZ3JvdXBJbnN0YW5jZXM6IEFycmF5PFRlbXBsYXRlR3JvdXBJbnN0YW5jZT5cblx0X2luaXRpYWxpemVkOiBMYXp5TG9hZGVkPEtub3dsZWRnZUJhc2VNb2RlbD5cblx0cmVhZG9ubHkgdXNlckNvbnRyb2xsZXI6IFVzZXJDb250cm9sbGVyXG5cblx0Y29uc3RydWN0b3IoZXZlbnRDb250cm9sbGVyOiBFdmVudENvbnRyb2xsZXIsIGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LCB1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXIpIHtcblx0XHR0aGlzLl9ldmVudENvbnRyb2xsZXIgPSBldmVudENvbnRyb2xsZXJcblx0XHR0aGlzLl9lbnRpdHlDbGllbnQgPSBlbnRpdHlDbGllbnRcblx0XHR0aGlzLnVzZXJDb250cm9sbGVyID0gdXNlckNvbnRyb2xsZXJcblx0XHR0aGlzLl9hbGxFbnRyaWVzID0gU29ydGVkQXJyYXkuZW1wdHkoY29tcGFyZUtub3dsZWRnZUJhc2VFbnRyaWVzRm9yU29ydClcblx0XHR0aGlzLl9hbGxLZXl3b3JkcyA9IFtdXG5cdFx0dGhpcy5fbWF0Y2hlZEtleXdvcmRzSW5Db250ZW50ID0gW11cblx0XHR0aGlzLmZpbHRlcmVkRW50cmllcyA9IHN0cmVhbSh0aGlzLl9hbGxFbnRyaWVzLmFycmF5KVxuXHRcdHRoaXMuc2VsZWN0ZWRFbnRyeSA9IHN0cmVhbTxLbm93bGVkZ2VCYXNlRW50cnkgfCBudWxsPihudWxsKVxuXHRcdHRoaXMuX2ZpbHRlclZhbHVlID0gXCJcIlxuXG5cdFx0dGhpcy5fZW50aXR5RXZlbnRSZWNlaXZlZCA9ICh1cGRhdGVzKSA9PiB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fZW50aXR5VXBkYXRlKHVwZGF0ZXMpXG5cdFx0fVxuXG5cdFx0dGhpcy5fZXZlbnRDb250cm9sbGVyLmFkZEVudGl0eUxpc3RlbmVyKHRoaXMuX2VudGl0eUV2ZW50UmVjZWl2ZWQpXG5cblx0XHR0aGlzLl9ncm91cEluc3RhbmNlcyA9IFtdXG5cdFx0dGhpcy5fYWxsS2V5d29yZHMgPSBbXVxuXHRcdHRoaXMuZmlsdGVyZWRFbnRyaWVzKHRoaXMuX2FsbEVudHJpZXMuYXJyYXkpXG5cdFx0dGhpcy5zZWxlY3RlZEVudHJ5KHRoaXMuY29udGFpbnNSZXN1bHQoKSA/IHRoaXMuZmlsdGVyZWRFbnRyaWVzKClbMF0gOiBudWxsKVxuXHRcdHRoaXMuX2luaXRpYWxpemVkID0gbmV3IExhenlMb2FkZWQoKCkgPT4ge1xuXHRcdFx0Y29uc3QgdGVtcGxhdGVNZW1iZXJzaGlwcyA9IHRoaXMudXNlckNvbnRyb2xsZXIuZ2V0VGVtcGxhdGVNZW1iZXJzaGlwcygpXG5cblx0XHRcdGxldCBuZXdHcm91cEluc3RhbmNlczogVGVtcGxhdGVHcm91cEluc3RhbmNlW10gPSBbXVxuXHRcdFx0cmV0dXJuIHByb21pc2VNYXAodGVtcGxhdGVNZW1iZXJzaGlwcywgKG1lbWJlcnNoaXApID0+IGxvYWRUZW1wbGF0ZUdyb3VwSW5zdGFuY2UobWVtYmVyc2hpcCwgZW50aXR5Q2xpZW50KSlcblx0XHRcdFx0LnRoZW4oKGdyb3VwSW5zdGFuY2VzKSA9PiB7XG5cdFx0XHRcdFx0bmV3R3JvdXBJbnN0YW5jZXMgPSBncm91cEluc3RhbmNlc1xuXHRcdFx0XHRcdHJldHVybiBsb2FkS25vd2xlZGdlYmFzZUVudHJpZXMoZ3JvdXBJbnN0YW5jZXMsIGVudGl0eUNsaWVudClcblx0XHRcdFx0fSlcblx0XHRcdFx0LnRoZW4oKGtub3dsZWRnZWJhc2VFbnRyaWVzKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5fYWxsRW50cmllcy5pbnNlcnRBbGwoa25vd2xlZGdlYmFzZUVudHJpZXMpXG5cblx0XHRcdFx0XHR0aGlzLl9ncm91cEluc3RhbmNlcyA9IG5ld0dyb3VwSW5zdGFuY2VzXG5cdFx0XHRcdFx0dGhpcy5pbml0QWxsS2V5d29yZHMoKVxuXHRcdFx0XHRcdHJldHVybiB0aGlzXG5cdFx0XHRcdH0pXG5cdFx0fSlcblx0fVxuXG5cdGluaXQoKTogUHJvbWlzZTxLbm93bGVkZ2VCYXNlTW9kZWw+IHtcblx0XHRyZXR1cm4gdGhpcy5faW5pdGlhbGl6ZWQuZ2V0QXN5bmMoKVxuXHR9XG5cblx0aXNJbml0aWFsaXplZCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5faW5pdGlhbGl6ZWQuaXNMb2FkZWQoKVxuXHR9XG5cblx0Z2V0VGVtcGxhdGVHcm91cEluc3RhbmNlcygpOiBBcnJheTxUZW1wbGF0ZUdyb3VwSW5zdGFuY2U+IHtcblx0XHRyZXR1cm4gdGhpcy5fZ3JvdXBJbnN0YW5jZXNcblx0fVxuXG5cdGluaXRBbGxLZXl3b3JkcygpIHtcblx0XHR0aGlzLl9hbGxLZXl3b3JkcyA9IFtdXG5cdFx0dGhpcy5fbWF0Y2hlZEtleXdvcmRzSW5Db250ZW50ID0gW11cblxuXHRcdGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5fYWxsRW50cmllcy5hcnJheSkge1xuXHRcdFx0Zm9yIChjb25zdCBrZXl3b3JkIG9mIGVudHJ5LmtleXdvcmRzKSB7XG5cdFx0XHRcdHRoaXMuX2FsbEtleXdvcmRzLnB1c2goa2V5d29yZC5rZXl3b3JkKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlzU2VsZWN0ZWRFbnRyeShlbnRyeTogS25vd2xlZGdlQmFzZUVudHJ5KTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuc2VsZWN0ZWRFbnRyeSgpID09PSBlbnRyeVxuXHR9XG5cblx0Y29udGFpbnNSZXN1bHQoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuZmlsdGVyZWRFbnRyaWVzKCkubGVuZ3RoID4gMFxuXHR9XG5cblx0Z2V0QWxsS2V5d29yZHMoKTogQXJyYXk8c3RyaW5nPiB7XG5cdFx0cmV0dXJuIHRoaXMuX2FsbEtleXdvcmRzLnNvcnQoKVxuXHR9XG5cblx0Z2V0TWF0Y2hlZEtleXdvcmRzSW5Db250ZW50KCk6IEFycmF5PHN0cmluZyB8IG51bGw+IHtcblx0XHRyZXR1cm4gdGhpcy5fbWF0Y2hlZEtleXdvcmRzSW5Db250ZW50XG5cdH1cblxuXHRnZXRMYW5ndWFnZUZyb21UZW1wbGF0ZSh0ZW1wbGF0ZTogRW1haWxUZW1wbGF0ZSk6IExhbmd1YWdlQ29kZSB7XG5cdFx0Y29uc3QgY2xpZW50TGFuZ3VhZ2UgPSBsYW5nLmNvZGVcblx0XHRjb25zdCBoYXNDbGllbnRMYW5ndWFnZSA9IHRlbXBsYXRlLmNvbnRlbnRzLnNvbWUoKGNvbnRlbnQpID0+IGNvbnRlbnQubGFuZ3VhZ2VDb2RlID09PSBjbGllbnRMYW5ndWFnZSlcblxuXHRcdGlmIChoYXNDbGllbnRMYW5ndWFnZSkge1xuXHRcdFx0cmV0dXJuIGNsaWVudExhbmd1YWdlXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRvd25jYXN0KHRlbXBsYXRlLmNvbnRlbnRzWzBdLmxhbmd1YWdlQ29kZSlcblx0fVxuXG5cdHNvcnRFbnRyaWVzQnlNYXRjaGluZ0tleXdvcmRzKGVtYWlsQ29udGVudDogc3RyaW5nKSB7XG5cdFx0dGhpcy5fbWF0Y2hlZEtleXdvcmRzSW5Db250ZW50ID0gW11cblx0XHRjb25zdCBlbWFpbENvbnRlbnROb1RhZ3MgPSBlbWFpbENvbnRlbnQucmVwbGFjZSgvKDwoW14+XSspPikvZ2ksIFwiXCIpIC8vIHJlbW92ZSBhbGwgaHRtbCB0YWdzXG5cblx0XHRmb3IgKGNvbnN0IGtleXdvcmQgb2YgdGhpcy5fYWxsS2V5d29yZHMpIHtcblx0XHRcdGlmIChlbWFpbENvbnRlbnROb1RhZ3MuaW5jbHVkZXMoa2V5d29yZCkpIHtcblx0XHRcdFx0dGhpcy5fbWF0Y2hlZEtleXdvcmRzSW5Db250ZW50LnB1c2goa2V5d29yZClcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLl9hbGxFbnRyaWVzID0gU29ydGVkQXJyYXkuZnJvbSh0aGlzLl9hbGxFbnRyaWVzLmFycmF5LCAoYSwgYikgPT4gdGhpcy5fY29tcGFyZUVudHJpZXNCeU1hdGNoZWRLZXl3b3JkcyhhLCBiKSlcblx0XHR0aGlzLl9maWx0ZXJWYWx1ZSA9IFwiXCJcblx0XHR0aGlzLmZpbHRlcmVkRW50cmllcyh0aGlzLl9hbGxFbnRyaWVzLmFycmF5KVxuXHR9XG5cblx0X2NvbXBhcmVFbnRyaWVzQnlNYXRjaGVkS2V5d29yZHMoZW50cnkxOiBLbm93bGVkZ2VCYXNlRW50cnksIGVudHJ5MjogS25vd2xlZGdlQmFzZUVudHJ5KTogbnVtYmVyIHtcblx0XHRjb25zdCBkaWZmZXJlbmNlID0gdGhpcy5fZ2V0TWF0Y2hlZEtleXdvcmRzTnVtYmVyKGVudHJ5MikgLSB0aGlzLl9nZXRNYXRjaGVkS2V5d29yZHNOdW1iZXIoZW50cnkxKVxuXG5cdFx0cmV0dXJuIGRpZmZlcmVuY2UgPT09IDAgPyBjb21wYXJlS25vd2xlZGdlQmFzZUVudHJpZXNGb3JTb3J0KGVudHJ5MSwgZW50cnkyKSA6IGRpZmZlcmVuY2Vcblx0fVxuXG5cdF9nZXRNYXRjaGVkS2V5d29yZHNOdW1iZXIoZW50cnk6IEtub3dsZWRnZUJhc2VFbnRyeSk6IG51bWJlciB7XG5cdFx0bGV0IG1hdGNoZXMgPSAwXG5cdFx0Zm9yIChjb25zdCBrIG9mIGVudHJ5LmtleXdvcmRzKSB7XG5cdFx0XHRpZiAodGhpcy5fbWF0Y2hlZEtleXdvcmRzSW5Db250ZW50LmluY2x1ZGVzKGsua2V5d29yZCkpIHtcblx0XHRcdFx0bWF0Y2hlcysrXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBtYXRjaGVzXG5cdH1cblxuXHRmaWx0ZXIoaW5wdXQ6IHN0cmluZyk6IHZvaWQge1xuXHRcdHRoaXMuX2ZpbHRlclZhbHVlID0gaW5wdXRcblx0XHRjb25zdCBpbnB1dFRyaW1tZWQgPSBpbnB1dC50cmltKClcblxuXHRcdGlmIChpbnB1dFRyaW1tZWQpIHtcblx0XHRcdHRoaXMuZmlsdGVyZWRFbnRyaWVzKGtub3dsZWRnZUJhc2VTZWFyY2goaW5wdXRUcmltbWVkLCB0aGlzLl9hbGxFbnRyaWVzLmFycmF5KSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5maWx0ZXJlZEVudHJpZXModGhpcy5fYWxsRW50cmllcy5hcnJheSlcblx0XHR9XG5cdH1cblxuXHRzZWxlY3ROZXh0RW50cnkoYWN0aW9uOiBzdHJpbmcpOiBib29sZWFuIHtcblx0XHQvLyByZXR1cm5zIHRydWUgaWYgc2VsZWN0aW9uIGlzIGNoYW5nZWRcblx0XHRjb25zdCBzZWxlY3RlZEluZGV4ID0gdGhpcy5nZXRTZWxlY3RlZEVudHJ5SW5kZXgoKVxuXHRcdGNvbnN0IG5leHRJbmRleCA9IHNlbGVjdGVkSW5kZXggKyAoYWN0aW9uID09PSBTRUxFQ1RfTkVYVF9FTlRSWSA/IDEgOiAtMSlcblxuXHRcdGlmIChuZXh0SW5kZXggPj0gMCAmJiBuZXh0SW5kZXggPCB0aGlzLmZpbHRlcmVkRW50cmllcygpLmxlbmd0aCkge1xuXHRcdFx0Y29uc3QgbmV4dFNlbGVjdGVkRW50cnkgPSB0aGlzLmZpbHRlcmVkRW50cmllcygpW25leHRJbmRleF1cblx0XHRcdHRoaXMuc2VsZWN0ZWRFbnRyeShuZXh0U2VsZWN0ZWRFbnRyeSlcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHRnZXRTZWxlY3RlZEVudHJ5SW5kZXgoKTogbnVtYmVyIHtcblx0XHRjb25zdCBzZWxlY3RlZEVudHJ5ID0gdGhpcy5zZWxlY3RlZEVudHJ5KClcblx0XHRpZiAoc2VsZWN0ZWRFbnRyeSA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gLTFcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuZmlsdGVyZWRFbnRyaWVzKCkuaW5kZXhPZihzZWxlY3RlZEVudHJ5KVxuXHR9XG5cblx0X3JlbW92ZUZyb21BbGxLZXl3b3JkcyhrZXl3b3JkOiBzdHJpbmcpIHtcblx0XHRjb25zdCBpbmRleCA9IHRoaXMuX2FsbEtleXdvcmRzLmluZGV4T2Yoa2V5d29yZClcblxuXHRcdGlmIChpbmRleCA+IC0xKSB7XG5cdFx0XHR0aGlzLl9hbGxLZXl3b3Jkcy5zcGxpY2UoaW5kZXgsIDEpXG5cdFx0fVxuXHR9XG5cblx0ZGlzcG9zZSgpIHtcblx0XHR0aGlzLl9ldmVudENvbnRyb2xsZXIucmVtb3ZlRW50aXR5TGlzdGVuZXIodGhpcy5fZW50aXR5RXZlbnRSZWNlaXZlZClcblx0fVxuXG5cdGxvYWRUZW1wbGF0ZSh0ZW1wbGF0ZUlkOiBJZFR1cGxlKTogUHJvbWlzZTxFbWFpbFRlbXBsYXRlPiB7XG5cdFx0cmV0dXJuIHRoaXMuX2VudGl0eUNsaWVudC5sb2FkKEVtYWlsVGVtcGxhdGVUeXBlUmVmLCB0ZW1wbGF0ZUlkKVxuXHR9XG5cblx0aXNSZWFkT25seShlbnRyeTogS25vd2xlZGdlQmFzZUVudHJ5KTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgaW5zdGFuY2UgPSB0aGlzLl9ncm91cEluc3RhbmNlcy5maW5kKChpbnN0YW5jZSkgPT4gaXNTYW1lSWQoZW50cnkuX293bmVyR3JvdXAsIGdldEV0SWQoaW5zdGFuY2UuZ3JvdXApKSlcblxuXHRcdHJldHVybiAhaW5zdGFuY2UgfHwgIWhhc0NhcGFiaWxpdHlPbkdyb3VwKHRoaXMudXNlckNvbnRyb2xsZXIudXNlciwgaW5zdGFuY2UuZ3JvdXAsIFNoYXJlQ2FwYWJpbGl0eS5Xcml0ZSlcblx0fVxuXG5cdF9lbnRpdHlVcGRhdGUodXBkYXRlczogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGVEYXRhPik6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiBwcm9taXNlTWFwKHVwZGF0ZXMsICh1cGRhdGUpID0+IHtcblx0XHRcdGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoS25vd2xlZGdlQmFzZUVudHJ5VHlwZVJlZiwgdXBkYXRlKSkge1xuXHRcdFx0XHRpZiAodXBkYXRlLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5DUkVBVEUpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fZW50aXR5Q2xpZW50LmxvYWQoS25vd2xlZGdlQmFzZUVudHJ5VHlwZVJlZiwgW3VwZGF0ZS5pbnN0YW5jZUxpc3RJZCwgdXBkYXRlLmluc3RhbmNlSWRdKS50aGVuKChlbnRyeSkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5fYWxsRW50cmllcy5pbnNlcnQoZW50cnkpXG5cblx0XHRcdFx0XHRcdHRoaXMuZmlsdGVyKHRoaXMuX2ZpbHRlclZhbHVlKVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0gZWxzZSBpZiAodXBkYXRlLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5VUERBVEUpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fZW50aXR5Q2xpZW50LmxvYWQoS25vd2xlZGdlQmFzZUVudHJ5VHlwZVJlZiwgW3VwZGF0ZS5pbnN0YW5jZUxpc3RJZCwgdXBkYXRlLmluc3RhbmNlSWRdKS50aGVuKCh1cGRhdGVkRW50cnkpID0+IHtcblx0XHRcdFx0XHRcdHRoaXMuX2FsbEVudHJpZXMucmVtb3ZlRmlyc3QoKGUpID0+IGlzU2FtZUlkKGdldEVsZW1lbnRJZChlKSwgdXBkYXRlLmluc3RhbmNlSWQpKVxuXG5cdFx0XHRcdFx0XHR0aGlzLl9hbGxFbnRyaWVzLmluc2VydCh1cGRhdGVkRW50cnkpXG5cblx0XHRcdFx0XHRcdHRoaXMuZmlsdGVyKHRoaXMuX2ZpbHRlclZhbHVlKVxuXHRcdFx0XHRcdFx0Y29uc3Qgb2xkU2VsZWN0ZWRFbnRyeSA9IHRoaXMuc2VsZWN0ZWRFbnRyeSgpXG5cblx0XHRcdFx0XHRcdGlmIChvbGRTZWxlY3RlZEVudHJ5ICYmIGlzU2FtZUlkKG9sZFNlbGVjdGVkRW50cnkuX2lkLCB1cGRhdGVkRW50cnkuX2lkKSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnNlbGVjdGVkRW50cnkodXBkYXRlZEVudHJ5KVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0gZWxzZSBpZiAodXBkYXRlLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5ERUxFVEUpIHtcblx0XHRcdFx0XHRjb25zdCBzZWxlY3RlZCA9IHRoaXMuc2VsZWN0ZWRFbnRyeSgpXG5cblx0XHRcdFx0XHRpZiAoc2VsZWN0ZWQgJiYgaXNTYW1lSWQoZ2V0TGV0SWQoc2VsZWN0ZWQpLCBbdXBkYXRlLmluc3RhbmNlTGlzdElkLCB1cGRhdGUuaW5zdGFuY2VJZF0pKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnNlbGVjdGVkRW50cnkobnVsbClcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0aGlzLl9hbGxFbnRyaWVzLnJlbW92ZUZpcnN0KChlKSA9PiBpc1NhbWVJZChnZXRFbGVtZW50SWQoZSksIHVwZGF0ZS5pbnN0YW5jZUlkKSlcblxuXHRcdFx0XHRcdHRoaXMuZmlsdGVyKHRoaXMuX2ZpbHRlclZhbHVlKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkudGhlbihub09wKVxuXHR9XG59XG5cbmZ1bmN0aW9uIGxvYWRLbm93bGVkZ2ViYXNlRW50cmllcyh0ZW1wbGF0ZUdyb3VwczogQXJyYXk8VGVtcGxhdGVHcm91cEluc3RhbmNlPiwgZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQpOiBQcm9taXNlPEFycmF5PEtub3dsZWRnZUJhc2VFbnRyeT4+IHtcblx0cmV0dXJuIHByb21pc2VNYXAodGVtcGxhdGVHcm91cHMsIChncm91cCkgPT4gZW50aXR5Q2xpZW50LmxvYWRBbGwoS25vd2xlZGdlQmFzZUVudHJ5VHlwZVJlZiwgZ3JvdXAuZ3JvdXBSb290Lmtub3dsZWRnZUJhc2UpKS50aGVuKChncm91cGVkVGVtcGxhdGVzKSA9PlxuXHRcdGdyb3VwZWRUZW1wbGF0ZXMuZmxhdCgpLFxuXHQpXG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IENvdW50ZXJCYWRnZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQ291bnRlckJhZGdlXCJcbmltcG9ydCB7IGdldE5hdkJ1dHRvbkljb25CYWNrZ3JvdW5kLCB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgQnV0dG9uLCBCdXR0b25Db2xvciwgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB0eXBlIHsgTWluaW1pemVkRWRpdG9yLCBNaW5pbWl6ZWRNYWlsRWRpdG9yVmlld01vZGVsIH0gZnJvbSBcIi4uL21vZGVsL01pbmltaXplZE1haWxFZGl0b3JWaWV3TW9kZWxcIlxuaW1wb3J0IHsgU2F2ZUVycm9yUmVhc29uLCBTYXZlU3RhdHVzLCBTYXZlU3RhdHVzRW51bSB9IGZyb20gXCIuLi9tb2RlbC9NaW5pbWl6ZWRNYWlsRWRpdG9yVmlld01vZGVsXCJcbmltcG9ydCB7IHB4IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc2l6ZVwiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnNcIlxuaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc3R5bGVzXCJcbmltcG9ydCB7IHByb21wdEFuZERlbGV0ZU1haWxzIH0gZnJvbSBcIi4vTWFpbEd1aVV0aWxzXCJcbmltcG9ydCB7IE1haWxUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgT3BlcmF0aW9uVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBpc1NhbWVJZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlsc1wiXG5pbXBvcnQgeyBub09wLCBwcm9taXNlTWFwIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBFbnRpdHlVcGRhdGVEYXRhLCBpc1VwZGF0ZUZvclR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXBkYXRlVXRpbHMuanNcIlxuaW1wb3J0IHsgRW50aXR5RXZlbnRzTGlzdGVuZXIsIEV2ZW50Q29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vRXZlbnRDb250cm9sbGVyLmpzXCJcbmltcG9ydCB7IEljb25CdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgbWFpbExvY2F0b3IgfSBmcm9tIFwiLi4vLi4vbWFpbExvY2F0b3IuanNcIlxuXG5jb25zdCBDT1VOVEVSX1BPU19PRkZTRVQgPSBweCgtOClcbmV4cG9ydCB0eXBlIE1pbmltaXplZEVkaXRvck92ZXJsYXlBdHRycyA9IHtcblx0dmlld01vZGVsOiBNaW5pbWl6ZWRNYWlsRWRpdG9yVmlld01vZGVsXG5cdG1pbmltaXplZEVkaXRvcjogTWluaW1pemVkRWRpdG9yXG5cdGV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyXG59XG5cbmV4cG9ydCBjbGFzcyBNaW5pbWl6ZWRFZGl0b3JPdmVybGF5IGltcGxlbWVudHMgQ29tcG9uZW50PE1pbmltaXplZEVkaXRvck92ZXJsYXlBdHRycz4ge1xuXHRfbGlzdGVuZXI6IEVudGl0eUV2ZW50c0xpc3RlbmVyXG5cdF9ldmVudENvbnRyb2xsZXI6IEV2ZW50Q29udHJvbGxlclxuXG5cdGNvbnN0cnVjdG9yKHZub2RlOiBWbm9kZTxNaW5pbWl6ZWRFZGl0b3JPdmVybGF5QXR0cnM+KSB7XG5cdFx0Y29uc3QgeyBtaW5pbWl6ZWRFZGl0b3IsIHZpZXdNb2RlbCwgZXZlbnRDb250cm9sbGVyIH0gPSB2bm9kZS5hdHRyc1xuXHRcdHRoaXMuX2V2ZW50Q29udHJvbGxlciA9IGV2ZW50Q29udHJvbGxlclxuXG5cdFx0dGhpcy5fbGlzdGVuZXIgPSAodXBkYXRlczogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGVEYXRhPiwgZXZlbnRPd25lckdyb3VwSWQ6IElkKTogUHJvbWlzZTx1bmtub3duPiA9PiB7XG5cdFx0XHRyZXR1cm4gcHJvbWlzZU1hcCh1cGRhdGVzLCAodXBkYXRlKSA9PiB7XG5cdFx0XHRcdGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoTWFpbFR5cGVSZWYsIHVwZGF0ZSkgJiYgdXBkYXRlLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5ERUxFVEUpIHtcblx0XHRcdFx0XHRsZXQgZHJhZnQgPSBtaW5pbWl6ZWRFZGl0b3Iuc2VuZE1haWxNb2RlbC5nZXREcmFmdCgpXG5cblx0XHRcdFx0XHRpZiAoZHJhZnQgJiYgaXNTYW1lSWQoZHJhZnQuX2lkLCBbdXBkYXRlLmluc3RhbmNlTGlzdElkLCB1cGRhdGUuaW5zdGFuY2VJZF0pKSB7XG5cdFx0XHRcdFx0XHR2aWV3TW9kZWwucmVtb3ZlTWluaW1pemVkRWRpdG9yKG1pbmltaXplZEVkaXRvcilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fVxuXG5cdFx0ZXZlbnRDb250cm9sbGVyLmFkZEVudGl0eUxpc3RlbmVyKHRoaXMuX2xpc3RlbmVyKVxuXHR9XG5cblx0b25yZW1vdmUoKSB7XG5cdFx0dGhpcy5fZXZlbnRDb250cm9sbGVyLnJlbW92ZUVudGl0eUxpc3RlbmVyKHRoaXMuX2xpc3RlbmVyKVxuXHR9XG5cblx0dmlldyh2bm9kZTogVm5vZGU8TWluaW1pemVkRWRpdG9yT3ZlcmxheUF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IG1pbmltaXplZEVkaXRvciwgdmlld01vZGVsLCBldmVudENvbnRyb2xsZXIgfSA9IHZub2RlLmF0dHJzXG5cdFx0Y29uc3Qgc3ViamVjdCA9IG1pbmltaXplZEVkaXRvci5zZW5kTWFpbE1vZGVsLmdldFN1YmplY3QoKVxuXHRcdHJldHVybiBtKFwiLmVsZXZhdGVkLWJnLnBsLmJvcmRlci1yYWRpdXNcIiwgW1xuXHRcdFx0bShDb3VudGVyQmFkZ2UsIHtcblx0XHRcdFx0Y291bnQ6IHZpZXdNb2RlbC5nZXRNaW5pbWl6ZWRFZGl0b3JzKCkuaW5kZXhPZihtaW5pbWl6ZWRFZGl0b3IpICsgMSxcblx0XHRcdFx0cG9zaXRpb246IHtcblx0XHRcdFx0XHR0b3A6IENPVU5URVJfUE9TX09GRlNFVCxcblx0XHRcdFx0XHRyaWdodDogQ09VTlRFUl9QT1NfT0ZGU0VULFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjb2xvcjogdGhlbWUubmF2aWdhdGlvbl9idXR0b25faWNvbixcblx0XHRcdFx0YmFja2dyb3VuZDogZ2V0TmF2QnV0dG9uSWNvbkJhY2tncm91bmQoKSxcblx0XHRcdH0pLFxuXHRcdFx0bShcIi5mbGV4Lmp1c3RpZnktYmV0d2Vlbi5wYi14cy5wdC14c1wiLCBbXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIuZmxleC5jb2wuanVzdGlmeS1jZW50ZXIubWluLXdpZHRoLTAuZmxleC1ncm93XCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0b25jbGljazogKCkgPT4gdmlld01vZGVsLnJlb3Blbk1pbmltaXplZEVkaXRvcihtaW5pbWl6ZWRFZGl0b3IpLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0W1xuXHRcdFx0XHRcdFx0bShcIi5iLnRleHQtZWxsaXBzaXNcIiwgc3ViamVjdCA/IHN1YmplY3QgOiBsYW5nLmdldChcIm5ld01haWxfYWN0aW9uXCIpKSxcblx0XHRcdFx0XHRcdG0oXCIuc21hbGwudGV4dC1lbGxpcHNpc1wiLCBnZXRTdGF0dXNNZXNzYWdlKG1pbmltaXplZEVkaXRvci5zYXZlU3RhdHVzKCkpKSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHQpLFxuXHRcdFx0XHRtKFwiLmZsZXguaXRlbXMtY2VudGVyLmp1c3RpZnktcmlnaHRcIiwgW1xuXHRcdFx0XHRcdCFzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKVxuXHRcdFx0XHRcdFx0PyBtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0XHR0aXRsZTogXCJlZGl0X2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB2aWV3TW9kZWwucmVvcGVuTWluaW1pemVkRWRpdG9yKG1pbmltaXplZEVkaXRvciksXG5cdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuRWRpdCxcblx0XHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XHRtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRcdHRpdGxlOiBcImRlbGV0ZV9hY3Rpb25cIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLl9vbkRlbGV0ZUNsaWNrZWQobWluaW1pemVkRWRpdG9yLCB2aWV3TW9kZWwpLFxuXHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuVHJhc2gsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0bShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHR0aXRsZTogXCJjbG9zZV9hbHRcIixcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB2aWV3TW9kZWwucmVtb3ZlTWluaW1pemVkRWRpdG9yKG1pbmltaXplZEVkaXRvciksXG5cdFx0XHRcdFx0XHRpY29uOiBJY29ucy5DYW5jZWwsXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XSksXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgX29uRGVsZXRlQ2xpY2tlZChtaW5pbWl6ZWRFZGl0b3I6IE1pbmltaXplZEVkaXRvciwgdmlld01vZGVsOiBNaW5pbWl6ZWRNYWlsRWRpdG9yVmlld01vZGVsKSB7XG5cdFx0Y29uc3QgbW9kZWwgPSBtaW5pbWl6ZWRFZGl0b3Iuc2VuZE1haWxNb2RlbFxuXHRcdHZpZXdNb2RlbC5yZW1vdmVNaW5pbWl6ZWRFZGl0b3IobWluaW1pemVkRWRpdG9yKVxuXHRcdC8vIG9ubHkgZGVsZXRlIG9uY2Ugc2F2ZSBoYXMgZmluaXNoZWRcblx0XHRtaW5pbWl6ZWRFZGl0b3Iuc2F2ZVN0YXR1cy5tYXAoYXN5bmMgKHsgc3RhdHVzIH0pID0+IHtcblx0XHRcdGlmIChzdGF0dXMgIT09IFNhdmVTdGF0dXNFbnVtLlNhdmluZykge1xuXHRcdFx0XHRjb25zdCBkcmFmdCA9IG1vZGVsLmRyYWZ0XG5cblx0XHRcdFx0aWYgKGRyYWZ0KSB7XG5cdFx0XHRcdFx0YXdhaXQgcHJvbXB0QW5kRGVsZXRlTWFpbHMobWFpbExvY2F0b3IubWFpbE1vZGVsLCBbZHJhZnRdLCBub09wKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSlcblx0fVxufVxuXG5mdW5jdGlvbiBnZXRTdGF0dXNNZXNzYWdlKHNhdmVTdGF0dXM6IFNhdmVTdGF0dXMpOiBzdHJpbmcge1xuXHRzd2l0Y2ggKHNhdmVTdGF0dXMuc3RhdHVzKSB7XG5cdFx0Y2FzZSBTYXZlU3RhdHVzRW51bS5TYXZpbmc6XG5cdFx0XHRyZXR1cm4gbGFuZy5nZXQoXCJzYXZlX21zZ1wiKVxuXHRcdGNhc2UgU2F2ZVN0YXR1c0VudW0uTm90U2F2ZWQ6XG5cdFx0XHRzd2l0Y2ggKHNhdmVTdGF0dXMucmVhc29uKSB7XG5cdFx0XHRcdGNhc2UgU2F2ZUVycm9yUmVhc29uLkNvbm5lY3Rpb25Mb3N0OlxuXHRcdFx0XHRcdHJldHVybiBsYW5nLmdldChcImRyYWZ0Tm90U2F2ZWRDb25uZWN0aW9uTG9zdF9tc2dcIilcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRyZXR1cm4gbGFuZy5nZXQoXCJkcmFmdE5vdFNhdmVkX21zZ1wiKVxuXHRcdFx0fVxuXHRcdGNhc2UgU2F2ZVN0YXR1c0VudW0uU2F2ZWQ6XG5cdFx0XHRyZXR1cm4gbGFuZy5nZXQoXCJkcmFmdFNhdmVkX21zZ1wiKVxuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gXCJcIlxuXHR9XG59XG4iLCJpbXBvcnQgbSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemVcIlxuaW1wb3J0IHsgZGlzcGxheU92ZXJsYXkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL092ZXJsYXlcIlxuaW1wb3J0IHsgRGVmYXVsdEFuaW1hdGlvblRpbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9hbmltYXRpb24vQW5pbWF0aW9uc1wiXG5pbXBvcnQgeyBFdmVudENvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL0V2ZW50Q29udHJvbGxlclwiXG5pbXBvcnQgeyBzdHlsZXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zdHlsZXNcIlxuaW1wb3J0IHsgTGF5ZXJUeXBlIH0gZnJvbSBcIi4uLy4uLy4uL1Jvb3RWaWV3XCJcbmltcG9ydCB0eXBlIHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2dcIlxuaW1wb3J0IHR5cGUgeyBTZW5kTWFpbE1vZGVsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9TZW5kTWFpbE1vZGVsLmpzXCJcbmltcG9ydCB0eXBlIHsgTWluaW1pemVkRWRpdG9yLCBTYXZlU3RhdHVzIH0gZnJvbSBcIi4uL21vZGVsL01pbmltaXplZE1haWxFZGl0b3JWaWV3TW9kZWxcIlxuaW1wb3J0IHsgTWluaW1pemVkTWFpbEVkaXRvclZpZXdNb2RlbCB9IGZyb20gXCIuLi9tb2RlbC9NaW5pbWl6ZWRNYWlsRWRpdG9yVmlld01vZGVsXCJcbmltcG9ydCB7IE1pbmltaXplZEVkaXRvck92ZXJsYXkgfSBmcm9tIFwiLi9NaW5pbWl6ZWRFZGl0b3JPdmVybGF5XCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IG5vT3AgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5jb25zdCBNSU5JTUlaRURfT1ZFUkxBWV9XSURUSF9XSURFID0gMzUwXG5jb25zdCBNSU5JTUlaRURfT1ZFUkxBWV9XSURUSF9TTUFMTCA9IDIyMFxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd01pbmltaXplZE1haWxFZGl0b3IoXG5cdGRpYWxvZzogRGlhbG9nLFxuXHRzZW5kTWFpbE1vZGVsOiBTZW5kTWFpbE1vZGVsLFxuXHR2aWV3TW9kZWw6IE1pbmltaXplZE1haWxFZGl0b3JWaWV3TW9kZWwsXG5cdGV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyLFxuXHRkaXNwb3NlOiAoKSA9PiB2b2lkLFxuXHRzYXZlU3RhdHVzOiBTdHJlYW08U2F2ZVN0YXR1cz4sXG4pOiB2b2lkIHtcblx0bGV0IGNsb3NlT3ZlcmxheUZ1bmN0aW9uOiAoKSA9PiB2b2lkID0gbm9PcCAvLyB3aWxsIGJlIGFzc2lnbmVkIHdpdGggdGhlIGFjdHVhbCBjbG9zZSBmdW5jdGlvbiB3aGVuIG92ZXJsYXkgaXMgdmlzaWJsZS5cblxuXHRjb25zdCBtaW5pbWl6ZWRFZGl0b3IgPSB2aWV3TW9kZWwubWluaW1pemVNYWlsRWRpdG9yKGRpYWxvZywgc2VuZE1haWxNb2RlbCwgZGlzcG9zZSwgc2F2ZVN0YXR1cywgKCkgPT4gY2xvc2VPdmVybGF5RnVuY3Rpb24oKSlcblx0Ly8gb25seSBzaG93IG92ZXJsYXkgb25jZSBlZGl0b3IgaXMgZ29uZVxuXHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRjbG9zZU92ZXJsYXlGdW5jdGlvbiA9IHNob3dNaW5pbWl6ZWRFZGl0b3JPdmVybGF5KHZpZXdNb2RlbCwgbWluaW1pemVkRWRpdG9yLCBldmVudENvbnRyb2xsZXIpXG5cdH0sIERlZmF1bHRBbmltYXRpb25UaW1lKVxufVxuXG5mdW5jdGlvbiBzaG93TWluaW1pemVkRWRpdG9yT3ZlcmxheSh2aWV3TW9kZWw6IE1pbmltaXplZE1haWxFZGl0b3JWaWV3TW9kZWwsIG1pbmltaXplZEVkaXRvcjogTWluaW1pemVkRWRpdG9yLCBldmVudENvbnRyb2xsZXI6IEV2ZW50Q29udHJvbGxlcik6ICgpID0+IHZvaWQge1xuXHRyZXR1cm4gZGlzcGxheU92ZXJsYXkoXG5cdFx0KCkgPT4gZ2V0T3ZlcmxheVBvc2l0aW9uKCksXG5cdFx0e1xuXHRcdFx0dmlldzogKCkgPT5cblx0XHRcdFx0bShNaW5pbWl6ZWRFZGl0b3JPdmVybGF5LCB7XG5cdFx0XHRcdFx0dmlld01vZGVsLFxuXHRcdFx0XHRcdG1pbmltaXplZEVkaXRvcixcblx0XHRcdFx0XHRldmVudENvbnRyb2xsZXIsXG5cdFx0XHRcdH0pLFxuXHRcdH0sXG5cdFx0XCJzbGlkZS1ib3R0b21cIixcblx0XHR1bmRlZmluZWQsXG5cdFx0XCJtaW5pbWl6ZWQtc2hhZG93XCIsXG5cdClcbn1cblxuZnVuY3Rpb24gZ2V0T3ZlcmxheVBvc2l0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdGJvdHRvbTogc3R5bGVzLmlzVXNpbmdCb3R0b21OYXZpZ2F0aW9uKCkgPyBweChzaXplLmhwYWQpIDogcHgoc2l6ZS52cGFkKSxcblx0XHQvLyBwb3NpdGlvbiB3aWxsIGNoYW5nZSB3aXRoIHRyYW5zbGF0ZVlcblx0XHRyaWdodDogc3R5bGVzLmlzVXNpbmdCb3R0b21OYXZpZ2F0aW9uKCkgPyBweChzaXplLmhwYWQpIDogcHgoc2l6ZS5ocGFkX21lZGl1bSksXG5cdFx0d2lkdGg6IHB4KHN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpID8gTUlOSU1JWkVEX09WRVJMQVlfV0lEVEhfU01BTEwgOiBNSU5JTUlaRURfT1ZFUkxBWV9XSURUSF9XSURFKSxcblx0XHR6SW5kZXg6IExheWVyVHlwZS5Mb3dQcmlvcml0eU92ZXJsYXksXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgRWRpdG9yLCBJbWFnZVBhc3RlRXZlbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9lZGl0b3IvRWRpdG9yXCJcbmltcG9ydCB0eXBlIHsgQXR0YWNobWVudCwgSW5pdEFzUmVzcG9uc2VBcmdzLCBTZW5kTWFpbE1vZGVsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9TZW5kTWFpbE1vZGVsLmpzXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IEluZm9MaW5rLCBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB0eXBlIHsgTWFpbGJveERldGFpbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvTWFpbGJveE1vZGVsLmpzXCJcbmltcG9ydCB7IGNoZWNrQXBwcm92YWxTdGF0dXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTG9naW5VdGlsc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7XG5cdEFMTE9XRURfSU1BR0VfRk9STUFUUyxcblx0Q29udmVyc2F0aW9uVHlwZSxcblx0RXh0ZXJuYWxJbWFnZVJ1bGUsXG5cdEZlYXR1cmVUeXBlLFxuXHRLZXlzLFxuXHRNYWlsQXV0aGVudGljYXRpb25TdGF0dXMsXG5cdE1haWxNZXRob2QsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBUb29NYW55UmVxdWVzdHNFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHR5cGUgeyBEaWFsb2dIZWFkZXJCYXJBdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nSGVhZGVyQmFyXCJcbmltcG9ydCB7IEJ1dHRvblR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBhdHRhY2hEcm9wZG93biwgY3JlYXRlRHJvcGRvd24sIERyb3Bkb3duQ2hpbGRBdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRHJvcGRvd24uanNcIlxuaW1wb3J0IHsgaXNBcHAsIGlzQnJvd3NlciwgaXNEZXNrdG9wIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnNcIlxuaW1wb3J0IHsgQW5pbWF0aW9uUHJvbWlzZSwgYW5pbWF0aW9ucywgaGVpZ2h0LCBvcGFjaXR5IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYW5pbWF0aW9uL0FuaW1hdGlvbnNcIlxuaW1wb3J0IHR5cGUgeyBUZXh0RmllbGRBdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IEF1dG9jb21wbGV0ZSwgVGV4dEZpZWxkIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9UZXh0RmllbGQuanNcIlxuaW1wb3J0IHsgY2hvb3NlQW5kQXR0YWNoRmlsZSwgY2xlYW51cElubGluZUF0dGFjaG1lbnRzLCBjcmVhdGVBdHRhY2htZW50QnViYmxlQXR0cnMsIGdldENvbmZpZGVudGlhbFN0YXRlTWVzc2FnZSB9IGZyb20gXCIuL01haWxFZGl0b3JWaWV3TW9kZWxcIlxuaW1wb3J0IHsgRXhwYW5kZXJQYW5lbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRXhwYW5kZXJcIlxuaW1wb3J0IHsgd2luZG93RmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL1dpbmRvd0ZhY2FkZVwiXG5pbXBvcnQgeyBVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1VzZXJFcnJvclwiXG5pbXBvcnQgeyBzaG93UHJvZ3Jlc3NEaWFsb2cgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9kaWFsb2dzL1Byb2dyZXNzRGlhbG9nXCJcbmltcG9ydCB7IGh0bWxTYW5pdGl6ZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvSHRtbFNhbml0aXplclwiXG5pbXBvcnQgeyBEcm9wRG93blNlbGVjdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wRG93blNlbGVjdG9yLmpzXCJcbmltcG9ydCB7XG5cdENvbnRhY3QsXG5cdENvbnRhY3RUeXBlUmVmLFxuXHRjcmVhdGVUcmFuc2xhdGlvbkdldEluLFxuXHRGaWxlIGFzIFR1dGFub3RhRmlsZSxcblx0TWFpbCxcblx0TWFpbGJveFByb3BlcnRpZXMsXG5cdE1haWxEZXRhaWxzLFxufSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBGaWxlT3BlbkVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL0ZpbGVPcGVuRXJyb3JcIlxuaW1wb3J0IHR5cGUgeyBsYXp5IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCBjbGVhbk1hdGNoLCBkb3duY2FzdCwgaXNOb3ROdWxsLCBub09wLCBvZkNsYXNzLCB0eXBlZFZhbHVlcyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgY3JlYXRlSW5saW5lSW1hZ2UsIGlzTWFpbENvbnRyYXN0Rml4TmVlZGVkLCByZXBsYWNlQ2lkc1dpdGhJbmxpbmVJbWFnZXMsIHJlcGxhY2VJbmxpbmVJbWFnZXNXaXRoQ2lkcyB9IGZyb20gXCIuLi92aWV3L01haWxHdWlVdGlsc1wiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50RGV0ZWN0b3JcIlxuaW1wb3J0IHsgYXBwZW5kRW1haWxTaWduYXR1cmUgfSBmcm9tIFwiLi4vc2lnbmF0dXJlL1NpZ25hdHVyZVwiXG5pbXBvcnQgeyBzaG93VGVtcGxhdGVQb3B1cEluRWRpdG9yIH0gZnJvbSBcIi4uLy4uL3RlbXBsYXRlcy92aWV3L1RlbXBsYXRlUG9wdXBcIlxuaW1wb3J0IHsgcmVnaXN0ZXJUZW1wbGF0ZVNob3J0Y3V0TGlzdGVuZXIgfSBmcm9tIFwiLi4vLi4vdGVtcGxhdGVzL3ZpZXcvVGVtcGxhdGVTaG9ydGN1dExpc3RlbmVyXCJcbmltcG9ydCB7IFRlbXBsYXRlUG9wdXBNb2RlbCB9IGZyb20gXCIuLi8uLi90ZW1wbGF0ZXMvbW9kZWwvVGVtcGxhdGVQb3B1cE1vZGVsXCJcbmltcG9ydCB7IGNyZWF0ZUtub3dsZWRnZUJhc2VEaWFsb2dJbmplY3Rpb24gfSBmcm9tIFwiLi4vLi4va25vd2xlZGdlYmFzZS92aWV3L0tub3dsZWRnZUJhc2VEaWFsb2dcIlxuaW1wb3J0IHsgS25vd2xlZGdlQmFzZU1vZGVsIH0gZnJvbSBcIi4uLy4uL2tub3dsZWRnZWJhc2UvbW9kZWwvS25vd2xlZGdlQmFzZU1vZGVsXCJcbmltcG9ydCB7IHN0eWxlcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3N0eWxlc1wiXG5pbXBvcnQgeyBzaG93TWluaW1pemVkTWFpbEVkaXRvciB9IGZyb20gXCIuLi92aWV3L01pbmltaXplZE1haWxFZGl0b3JPdmVybGF5XCJcbmltcG9ydCB7IFNhdmVFcnJvclJlYXNvbiwgU2F2ZVN0YXR1cywgU2F2ZVN0YXR1c0VudW0gfSBmcm9tIFwiLi4vbW9kZWwvTWluaW1pemVkTWFpbEVkaXRvclZpZXdNb2RlbFwiXG5pbXBvcnQgeyBmaWxlTGlzdFRvQXJyYXksIEZpbGVSZWZlcmVuY2UsIGlzVHV0YW5vdGFGaWxlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0ZpbGVVdGlsc1wiXG5pbXBvcnQgeyBwYXJzZU1haWx0b1VybCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9wYXJzaW5nL01haWxBZGRyZXNzUGFyc2VyXCJcbmltcG9ydCB7IENhbmNlbGxlZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL0NhbmNlbGxlZEVycm9yXCJcbmltcG9ydCB7IFNob3J0Y3V0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0tleU1hbmFnZXJcIlxuaW1wb3J0IHsgUmVjaXBpZW50cywgUmVjaXBpZW50VHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9yZWNpcGllbnRzL1JlY2lwaWVudFwiXG5pbXBvcnQgeyBzaG93VXNlckVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0Vycm9ySGFuZGxlckltcGxcIlxuaW1wb3J0IHsgTWFpbFJlY2lwaWVudHNUZXh0RmllbGQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9NYWlsUmVjaXBpZW50c1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBnZXRDb250YWN0RGlzcGxheU5hbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NvbnRhY3RzRnVuY3Rpb25hbGl0eS9Db250YWN0VXRpbHMuanNcIlxuaW1wb3J0IHsgUmVzb2x2YWJsZVJlY2lwaWVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vUmVjaXBpZW50c01vZGVsXCJcblxuaW1wb3J0IHsgYW5pbWF0ZVRvb2xiYXIsIFJpY2hUZXh0VG9vbGJhciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvUmljaFRleHRUb29sYmFyLmpzXCJcbmltcG9ydCB7IHJlYWRMb2NhbEZpbGVzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9maWxlL0ZpbGVDb250cm9sbGVyXCJcbmltcG9ydCB7IEljb25CdXR0b24sIEljb25CdXR0b25BdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBUb2dnbGVCdXR0b24sIFRvZ2dsZUJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9idXR0b25zL1RvZ2dsZUJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBCb290SWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0Jvb3RJY29ucy5qc1wiXG5pbXBvcnQgeyBCdXR0b25TaXplIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b25TaXplLmpzXCJcbmltcG9ydCB7IERpYWxvZ0luamVjdGlvblJpZ2h0QXR0cnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZ0luamVjdGlvblJpZ2h0LmpzXCJcbmltcG9ydCB7IEtub3dsZWRnZWJhc2VEaWFsb2dDb250ZW50QXR0cnMgfSBmcm9tIFwiLi4vLi4va25vd2xlZGdlYmFzZS92aWV3L0tub3dsZWRnZUJhc2VEaWFsb2dDb250ZW50LmpzXCJcbmltcG9ydCB7IFJlY2lwaWVudHNTZWFyY2hNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9SZWNpcGllbnRzU2VhcmNoTW9kZWwuanNcIlxuaW1wb3J0IHsgY3JlYXRlRGF0YUZpbGUsIERhdGFGaWxlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0RhdGFGaWxlLmpzXCJcbmltcG9ydCB7IEF0dGFjaG1lbnRCdWJibGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9BdHRhY2htZW50QnViYmxlLmpzXCJcbmltcG9ydCB7IENvbnRlbnRCbG9ja2luZ1N0YXR1cyB9IGZyb20gXCIuLi92aWV3L01haWxWaWV3ZXJWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgY2FuU2VlVHV0YUxpbmtzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9HdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBCYW5uZXJCdXR0b25BdHRycywgSW5mb0Jhbm5lciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSW5mb0Jhbm5lci5qc1wiXG5pbXBvcnQgeyBpc0N1c3RvbWl6YXRpb25FbmFibGVkRm9yQ3VzdG9tZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvQ3VzdG9tZXJVdGlscy5qc1wiXG5pbXBvcnQgeyBpc09mZmxpbmVFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FcnJvclV0aWxzLmpzXCJcbmltcG9ydCB7IFRyYW5zbGF0aW9uU2VydmljZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1NlcnZpY2VzLmpzXCJcbmltcG9ydCB7IFBhc3N3b3JkRmllbGQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvcGFzc3dvcmRzL1Bhc3N3b3JkRmllbGQuanNcIlxuaW1wb3J0IHsgSW5saW5lSW1hZ2VzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9pbmxpbmVJbWFnZXNVdGlscy5qc1wiXG5pbXBvcnQge1xuXHRjaGVja0F0dGFjaG1lbnRTaXplLFxuXHRjcmVhdGVOZXdDb250YWN0LFxuXHRkaWFsb2dUaXRsZVRyYW5zbGF0aW9uS2V5LFxuXHRnZXRFbmFibGVkTWFpbEFkZHJlc3Nlc1dpdGhVc2VyLFxuXHRnZXRNYWlsQWRkcmVzc0Rpc3BsYXlUZXh0LFxuXHRMSU5FX0JSRUFLLFxuXHRSZWNpcGllbnRGaWVsZCxcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9TaGFyZWRNYWlsVXRpbHMuanNcIlxuaW1wb3J0IHsgbWFpbExvY2F0b3IgfSBmcm9tIFwiLi4vLi4vbWFpbExvY2F0b3IuanNcIlxuXG5pbXBvcnQgeyBoYW5kbGVSYXRpbmdCeUV2ZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9yYXRpbmdzL0luQXBwUmF0aW5nRGlhbG9nLmpzXCJcblxuZXhwb3J0IHR5cGUgTWFpbEVkaXRvckF0dHJzID0ge1xuXHRtb2RlbDogU2VuZE1haWxNb2RlbFxuXHRkb0Jsb2NrRXh0ZXJuYWxDb250ZW50OiBTdHJlYW08Ym9vbGVhbj5cblx0ZG9TaG93VG9vbGJhcjogU3RyZWFtPGJvb2xlYW4+XG5cdG9ubG9hZD86IChlZGl0b3I6IEVkaXRvcikgPT4gdm9pZFxuXHRvbmNsb3NlPzogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueVxuXHRzZWxlY3RlZE5vdGlmaWNhdGlvbkxhbmd1YWdlOiBTdHJlYW08c3RyaW5nPlxuXHRkaWFsb2c6IGxhenk8RGlhbG9nPlxuXHR0ZW1wbGF0ZU1vZGVsOiBUZW1wbGF0ZVBvcHVwTW9kZWwgfCBudWxsXG5cdGtub3dsZWRnZUJhc2VJbmplY3Rpb246IChlZGl0b3I6IEVkaXRvcikgPT4gUHJvbWlzZTxEaWFsb2dJbmplY3Rpb25SaWdodEF0dHJzPEtub3dsZWRnZWJhc2VEaWFsb2dDb250ZW50QXR0cnM+IHwgbnVsbD5cblx0c2VhcmNoOiBSZWNpcGllbnRzU2VhcmNoTW9kZWxcblx0YWx3YXlzQmxvY2tFeHRlcm5hbENvbnRlbnQ6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1haWxFZGl0b3JBdHRycyhcblx0bW9kZWw6IFNlbmRNYWlsTW9kZWwsXG5cdGRvQmxvY2tFeHRlcm5hbENvbnRlbnQ6IGJvb2xlYW4sXG5cdGRvRm9jdXNFZGl0b3JPbkxvYWQ6IGJvb2xlYW4sXG5cdGRpYWxvZzogbGF6eTxEaWFsb2c+LFxuXHR0ZW1wbGF0ZU1vZGVsOiBUZW1wbGF0ZVBvcHVwTW9kZWwgfCBudWxsLFxuXHRrbm93bGVkZ2VCYXNlSW5qZWN0aW9uOiAoZWRpdG9yOiBFZGl0b3IpID0+IFByb21pc2U8RGlhbG9nSW5qZWN0aW9uUmlnaHRBdHRyczxLbm93bGVkZ2ViYXNlRGlhbG9nQ29udGVudEF0dHJzPiB8IG51bGw+LFxuXHRzZWFyY2g6IFJlY2lwaWVudHNTZWFyY2hNb2RlbCxcblx0YWx3YXlzQmxvY2tFeHRlcm5hbENvbnRlbnQ6IGJvb2xlYW4sXG4pOiBNYWlsRWRpdG9yQXR0cnMge1xuXHRyZXR1cm4ge1xuXHRcdG1vZGVsLFxuXHRcdGRvQmxvY2tFeHRlcm5hbENvbnRlbnQ6IHN0cmVhbShkb0Jsb2NrRXh0ZXJuYWxDb250ZW50KSxcblx0XHRkb1Nob3dUb29sYmFyOiBzdHJlYW08Ym9vbGVhbj4oZmFsc2UpLFxuXHRcdHNlbGVjdGVkTm90aWZpY2F0aW9uTGFuZ3VhZ2U6IHN0cmVhbShcIlwiKSxcblx0XHRkaWFsb2csXG5cdFx0dGVtcGxhdGVNb2RlbCxcblx0XHRrbm93bGVkZ2VCYXNlSW5qZWN0aW9uOiBrbm93bGVkZ2VCYXNlSW5qZWN0aW9uLFxuXHRcdHNlYXJjaCxcblx0XHRhbHdheXNCbG9ja0V4dGVybmFsQ29udGVudCxcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgTWFpbEVkaXRvciBpbXBsZW1lbnRzIENvbXBvbmVudDxNYWlsRWRpdG9yQXR0cnM+IHtcblx0cHJpdmF0ZSBhdHRyczogTWFpbEVkaXRvckF0dHJzXG5cblx0ZWRpdG9yOiBFZGl0b3JcblxuXHRwcml2YXRlIHJlYWRvbmx5IHJlY2lwaWVudEZpZWxkVGV4dHMgPSB7XG5cdFx0dG86IHN0cmVhbShcIlwiKSxcblx0XHRjYzogc3RyZWFtKFwiXCIpLFxuXHRcdGJjYzogc3RyZWFtKFwiXCIpLFxuXHR9XG5cblx0bWVudGlvbmVkSW5saW5lSW1hZ2VzOiBBcnJheTxzdHJpbmc+XG5cdGlubGluZUltYWdlRWxlbWVudHM6IEFycmF5PEhUTUxFbGVtZW50PlxuXHR0ZW1wbGF0ZU1vZGVsOiBUZW1wbGF0ZVBvcHVwTW9kZWwgfCBudWxsXG5cdGtub3dsZWRnZUJhc2VJbmplY3Rpb246IERpYWxvZ0luamVjdGlvblJpZ2h0QXR0cnM8S25vd2xlZGdlYmFzZURpYWxvZ0NvbnRlbnRBdHRycz4gfCBudWxsID0gbnVsbFxuXHRzZW5kTWFpbE1vZGVsOiBTZW5kTWFpbE1vZGVsXG5cdHByaXZhdGUgYXJlRGV0YWlsc0V4cGFuZGVkOiBib29sZWFuXG5cdHByaXZhdGUgcmVjaXBpZW50U2hvd0NvbmZpZGVudGlhbDogTWFwPHN0cmluZywgYm9vbGVhbj4gPSBuZXcgTWFwKClcblx0cHJpdmF0ZSBibG9ja0V4dGVybmFsQ29udGVudDogYm9vbGVhblxuXHRwcml2YXRlIHJlYWRvbmx5IGFsd2F5c0Jsb2NrRXh0ZXJuYWxDb250ZW50OiBib29sZWFuID0gZmFsc2Vcblx0Ly8gaWYgd2UncmUgc2V0IHRvIGJsb2NrIGV4dGVybmFsIGNvbnRlbnQsIGJ1dCB0aGVyZSBpcyBubyBjb250ZW50IHRvIGJsb2NrLFxuXHQvLyB3ZSBkb24ndCB3YW50IHRvIHNob3cgdGhlIGJhbm5lci5cblx0cHJpdmF0ZSBibG9ja2VkRXh0ZXJuYWxDb250ZW50OiBudW1iZXIgPSAwXG5cblx0Y29uc3RydWN0b3Iodm5vZGU6IFZub2RlPE1haWxFZGl0b3JBdHRycz4pIHtcblx0XHRjb25zdCBhID0gdm5vZGUuYXR0cnNcblx0XHR0aGlzLmF0dHJzID0gYVxuXHRcdHRoaXMuaW5saW5lSW1hZ2VFbGVtZW50cyA9IFtdXG5cdFx0dGhpcy5tZW50aW9uZWRJbmxpbmVJbWFnZXMgPSBbXVxuXHRcdGNvbnN0IG1vZGVsID0gYS5tb2RlbFxuXHRcdHRoaXMuc2VuZE1haWxNb2RlbCA9IG1vZGVsXG5cdFx0dGhpcy50ZW1wbGF0ZU1vZGVsID0gYS50ZW1wbGF0ZU1vZGVsXG5cdFx0dGhpcy5ibG9ja0V4dGVybmFsQ29udGVudCA9IGEuZG9CbG9ja0V4dGVybmFsQ29udGVudCgpXG5cdFx0dGhpcy5hbHdheXNCbG9ja0V4dGVybmFsQ29udGVudCA9IGEuYWx3YXlzQmxvY2tFeHRlcm5hbENvbnRlbnRcblxuXHRcdC8vIGlmIHdlIGhhdmUgYW55IENDL0JDQyByZWNpcGllbnRzLCB3ZSBzaG91bGQgc2hvdyB0aGVzZSBzbywgc2hvdWxkIHRoZSB1c2VyIHNlbmQgdGhlIG1haWwsIHRoZXkga25vdyB3aGVyZSBpdCB3aWxsIGJlIGdvaW5nIHRvXG5cdFx0dGhpcy5hcmVEZXRhaWxzRXhwYW5kZWQgPSBtb2RlbC5iY2NSZWNpcGllbnRzKCkubGVuZ3RoICsgbW9kZWwuY2NSZWNpcGllbnRzKCkubGVuZ3RoID4gMFxuXG5cdFx0dGhpcy5lZGl0b3IgPSBuZXcgRWRpdG9yKFxuXHRcdFx0MjAwLFxuXHRcdFx0KGh0bWwsIGlzUGFzdGUpID0+IHtcblx0XHRcdFx0Y29uc3Qgc2FuaXRpemVkID0gaHRtbFNhbml0aXplci5zYW5pdGl6ZUZyYWdtZW50KGh0bWwsIHtcblx0XHRcdFx0XHRibG9ja0V4dGVybmFsQ29udGVudDogIWlzUGFzdGUgJiYgdGhpcy5ibG9ja0V4dGVybmFsQ29udGVudCxcblx0XHRcdFx0fSlcblx0XHRcdFx0dGhpcy5ibG9ja2VkRXh0ZXJuYWxDb250ZW50ID0gc2FuaXRpemVkLmJsb2NrZWRFeHRlcm5hbENvbnRlbnRcblxuXHRcdFx0XHR0aGlzLm1lbnRpb25lZElubGluZUltYWdlcyA9IHNhbml0aXplZC5pbmxpbmVJbWFnZUNpZHNcblx0XHRcdFx0cmV0dXJuIHNhbml0aXplZC5mcmFnbWVudFxuXHRcdFx0fSxcblx0XHRcdG51bGwsXG5cdFx0KVxuXG5cdFx0Y29uc3Qgb25FZGl0b3JDaGFuZ2VkID0gKCkgPT4ge1xuXHRcdFx0Y2xlYW51cElubGluZUF0dGFjaG1lbnRzKHRoaXMuZWRpdG9yLmdldERPTSgpLCB0aGlzLmlubGluZUltYWdlRWxlbWVudHMsIG1vZGVsLmdldEF0dGFjaG1lbnRzKCkpXG5cdFx0XHRtb2RlbC5tYXJrQXNDaGFuZ2VkSWZOZWNlc3NhcnkodHJ1ZSlcblx0XHRcdG0ucmVkcmF3KClcblx0XHR9XG5cblx0XHQvLyBjYWxsIHRoaXMgYXN5bmMgYmVjYXVzZSB0aGUgZWRpdG9yIGlzIG5vdCBpbml0aWFsaXplZCBiZWZvcmUgdGhpcyBtYWlsIGVkaXRvciBkaWFsb2cgaXMgc2hvd25cblx0XHR0aGlzLmVkaXRvci5pbml0aWFsaXplZC5wcm9taXNlLnRoZW4oKCkgPT4ge1xuXHRcdFx0dGhpcy5lZGl0b3Iuc2V0SFRNTChtb2RlbC5nZXRCb2R5KCkpXG5cblx0XHRcdGNvbnN0IGVkaXRvckRvbSA9IHRoaXMuZWRpdG9yLmdldERPTSgpXG5cdFx0XHRjb25zdCBjb250cmFzdEZpeE5lZWRlZCA9IGlzTWFpbENvbnRyYXN0Rml4TmVlZGVkKGVkaXRvckRvbSlcblx0XHRcdC8vIElmIG1haWwgYm9keSBjYW5ub3QgYmUgZGlzcGxheWVkIGFzLWlzIG9uIHRoZSBkYXJrIGJhY2tncm91bmQgdGhlbiBhcHBseSB0aGUgYmFja2dyb3VuZCBhbmQgdGV4dCBjb2xvclxuXHRcdFx0Ly8gZml4LiBUaGlzIGNsYXNzIHdpbGwgY2hhbmdlIHR1dGFub3RhLXF1b3RlJ3MgaW5zaWRlIG9mIGl0LlxuXHRcdFx0aWYgKGNvbnRyYXN0Rml4TmVlZGVkKSB7XG5cdFx0XHRcdGVkaXRvckRvbS5jbGFzc0xpc3QuYWRkKFwiYmctZml4LXF1b3RlZFwiKVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnByb2Nlc3NJbmxpbmVJbWFnZXMoKVxuXG5cdFx0XHQvLyBBZGQgbXV0YXRpb24gb2JzZXJ2ZXIgdG8gcmVtb3ZlIGF0dGFjaG1lbnRzIHdoZW4gY29ycmVzcG9uZGluZyBET00gZWxlbWVudCBpcyByZW1vdmVkXG5cdFx0XHRuZXcgTXV0YXRpb25PYnNlcnZlcihvbkVkaXRvckNoYW5nZWQpLm9ic2VydmUodGhpcy5lZGl0b3IuZ2V0RE9NKCksIHtcblx0XHRcdFx0YXR0cmlidXRlczogZmFsc2UsXG5cdFx0XHRcdGNoaWxkTGlzdDogdHJ1ZSxcblx0XHRcdFx0c3VidHJlZTogdHJ1ZSxcblx0XHRcdH0pXG5cdFx0XHQvLyBzaW5jZSB0aGUgZWRpdG9yIGlzIHRoZSBzb3VyY2UgZm9yIHRoZSBib2R5IHRleHQsIHRoZSBtb2RlbCB3b24ndCBrbm93IGlmIHRoZSBib2R5IGhhcyBjaGFuZ2VkIHVubGVzcyB3ZSB0ZWxsIGl0XG5cdFx0XHR0aGlzLmVkaXRvci5hZGRDaGFuZ2VMaXN0ZW5lcigoKSA9PiBtb2RlbC5zZXRCb2R5KHJlcGxhY2VJbmxpbmVJbWFnZXNXaXRoQ2lkcyh0aGlzLmVkaXRvci5nZXRET00oKSkuaW5uZXJIVE1MKSlcblx0XHRcdHRoaXMuZWRpdG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJwYXN0ZUltYWdlXCIsICh7IGRldGFpbCB9OiBJbWFnZVBhc3RlRXZlbnQpID0+IHtcblx0XHRcdFx0Y29uc3QgaXRlbXMgPSBBcnJheS5mcm9tKGRldGFpbC5jbGlwYm9hcmREYXRhLml0ZW1zKVxuXHRcdFx0XHRjb25zdCBpbWFnZUl0ZW1zID0gaXRlbXMuZmlsdGVyKChpdGVtKSA9PiAvaW1hZ2UvLnRlc3QoaXRlbS50eXBlKSlcblx0XHRcdFx0aWYgKCFpbWFnZUl0ZW1zLmxlbmd0aCkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnN0IGZpbGUgPSBpbWFnZUl0ZW1zWzBdPy5nZXRBc0ZpbGUoKVxuXHRcdFx0XHRpZiAoZmlsZSA9PSBudWxsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuXHRcdFx0XHRyZWFkZXIub25sb2FkID0gKCkgPT4ge1xuXHRcdFx0XHRcdGlmIChyZWFkZXIucmVzdWx0ID09IG51bGwgfHwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIHJlYWRlci5yZXN1bHQpIHtcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjb25zdCBuZXdJbmxpbmVJbWFnZXMgPSBbY3JlYXRlRGF0YUZpbGUoZmlsZS5uYW1lLCBmaWxlLnR5cGUsIG5ldyBVaW50OEFycmF5KHJlYWRlci5yZXN1bHQpKV1cblx0XHRcdFx0XHRtb2RlbC5hdHRhY2hGaWxlcyhuZXdJbmxpbmVJbWFnZXMpXG5cdFx0XHRcdFx0dGhpcy5pbnNlcnRJbmxpbmVJbWFnZXMobW9kZWwsIG5ld0lubGluZUltYWdlcylcblx0XHRcdFx0fVxuXHRcdFx0XHRyZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSlcblx0XHRcdH0pXG5cblx0XHRcdGlmIChhLnRlbXBsYXRlTW9kZWwpIHtcblx0XHRcdFx0YS50ZW1wbGF0ZU1vZGVsLmluaXQoKS50aGVuKCh0ZW1wbGF0ZU1vZGVsKSA9PiB7XG5cdFx0XHRcdFx0Ly8gYWRkIHRoaXMgZXZlbnQgbGlzdGVuZXIgdG8gaGFuZGxlIHF1aWNrIHNlbGVjdGlvbiBvZiB0ZW1wbGF0ZXMgaW5zaWRlIHRoZSBlZGl0b3Jcblx0XHRcdFx0XHRyZWdpc3RlclRlbXBsYXRlU2hvcnRjdXRMaXN0ZW5lcih0aGlzLmVkaXRvciwgdGVtcGxhdGVNb2RlbClcblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHR9KVxuXG5cdFx0bW9kZWwub25NYWlsQ2hhbmdlZC5tYXAoKCkgPT4gbS5yZWRyYXcoKSlcblx0XHQvLyBMZWZ0b3ZlciB0ZXh0IGluIHJlY2lwaWVudCBmaWVsZCBpcyBhbiBlcnJvclxuXHRcdG1vZGVsLnNldE9uQmVmb3JlU2VuZEZ1bmN0aW9uKCgpID0+IHtcblx0XHRcdGxldCBpbnZhbGlkVGV4dCA9IFwiXCJcblx0XHRcdGZvciAoY29uc3QgbGVmdG92ZXJUZXh0IG9mIHR5cGVkVmFsdWVzKHRoaXMucmVjaXBpZW50RmllbGRUZXh0cykpIHtcblx0XHRcdFx0aWYgKGxlZnRvdmVyVGV4dCgpLnRyaW0oKSAhPT0gXCJcIikge1xuXHRcdFx0XHRcdGludmFsaWRUZXh0ICs9IFwiXFxuXCIgKyBsZWZ0b3ZlclRleHQoKS50cmltKClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoaW52YWxpZFRleHQgIT09IFwiXCIpIHtcblx0XHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihsYW5nLm1ha2VUcmFuc2xhdGlvbihcImludmFsaWRSZWNpcGllbnRzX21zZ1wiLCBsYW5nLmdldChcImludmFsaWRSZWNpcGllbnRzX21zZ1wiKSArIGludmFsaWRUZXh0KSlcblx0XHRcdH1cblx0XHR9KVxuXHRcdGNvbnN0IGRpYWxvZyA9IGEuZGlhbG9nKClcblxuXHRcdGlmIChtb2RlbC5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT09IENvbnZlcnNhdGlvblR5cGUuUkVQTFkgfHwgbW9kZWwudG9SZWNpcGllbnRzKCkubGVuZ3RoKSB7XG5cdFx0XHRkaWFsb2cuc2V0Rm9jdXNPbkxvYWRGdW5jdGlvbigoKSA9PiB7XG5cdFx0XHRcdHRoaXMuZWRpdG9yLmluaXRpYWxpemVkLnByb21pc2UudGhlbigoKSA9PiB0aGlzLmVkaXRvci5mb2N1cygpKVxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRjb25zdCBzaG9ydGN1dHM6IFNob3J0Y3V0W10gPSBbXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5TUEFDRSxcblx0XHRcdFx0Y3RybE9yQ21kOiB0cnVlLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB0aGlzLm9wZW5UZW1wbGF0ZXMoKSxcblx0XHRcdFx0aGVscDogXCJvcGVuVGVtcGxhdGVQb3B1cF9tc2dcIixcblx0XHRcdH0sIC8vIEIgKGJvbGQpLCBJIChpdGFsaWMpLCBhbmQgVSAodW5kZXJsaW5lKSBhcmUgaGFuZGxlZCBieSBzcXVpcmVcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLkIsXG5cdFx0XHRcdGN0cmxPckNtZDogdHJ1ZSxcblx0XHRcdFx0ZXhlYzogbm9PcCxcblx0XHRcdFx0aGVscDogXCJmb3JtYXRUZXh0Qm9sZF9tc2dcIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5JLFxuXHRcdFx0XHRjdHJsT3JDbWQ6IHRydWUsXG5cdFx0XHRcdGV4ZWM6IG5vT3AsXG5cdFx0XHRcdGhlbHA6IFwiZm9ybWF0VGV4dEl0YWxpY19tc2dcIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5VLFxuXHRcdFx0XHRjdHJsT3JDbWQ6IHRydWUsXG5cdFx0XHRcdGV4ZWM6IG5vT3AsXG5cdFx0XHRcdGhlbHA6IFwiZm9ybWF0VGV4dFVuZGVybGluZV9tc2dcIixcblx0XHRcdH0sXG5cdFx0XVxuXHRcdGZvciAoY29uc3Qgc2hvcnRjdXQgb2Ygc2hvcnRjdXRzKSB7XG5cdFx0XHRkaWFsb2cuYWRkU2hvcnRjdXQoc2hvcnRjdXQpXG5cdFx0fVxuXHRcdHRoaXMuZWRpdG9yLmluaXRpYWxpemVkLnByb21pc2UudGhlbigoKSA9PiB7XG5cdFx0XHRhLmtub3dsZWRnZUJhc2VJbmplY3Rpb24odGhpcy5lZGl0b3IpLnRoZW4oKGluamVjdGlvbikgPT4ge1xuXHRcdFx0XHR0aGlzLmtub3dsZWRnZUJhc2VJbmplY3Rpb24gPSBpbmplY3Rpb25cblx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0fSlcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBkb3dubG9hZElubGluZUltYWdlKG1vZGVsOiBTZW5kTWFpbE1vZGVsLCBjaWQ6IHN0cmluZykge1xuXHRcdGNvbnN0IHR1dGFub3RhRmlsZXMgPSBtb2RlbC5nZXRBdHRhY2htZW50cygpLmZpbHRlcigoYXR0YWNobWVudCkgPT4gaXNUdXRhbm90YUZpbGUoYXR0YWNobWVudCkpXG5cdFx0Y29uc3QgaW5saW5lQXR0YWNobWVudCA9IHR1dGFub3RhRmlsZXMuZmluZCgoYXR0YWNobWVudCkgPT4gYXR0YWNobWVudC5jaWQgPT09IGNpZClcblxuXHRcdGlmIChpbmxpbmVBdHRhY2htZW50ICYmIGlzVHV0YW5vdGFGaWxlKGlubGluZUF0dGFjaG1lbnQpKSB7XG5cdFx0XHRsb2NhdG9yLmZpbGVDb250cm9sbGVyLm9wZW4oaW5saW5lQXR0YWNobWVudCkuY2F0Y2gob2ZDbGFzcyhGaWxlT3BlbkVycm9yLCAoKSA9PiBEaWFsb2cubWVzc2FnZShcImNhbk5vdE9wZW5GaWxlT25EZXZpY2VfbXNnXCIpKSlcblx0XHR9XG5cdH1cblxuXHR2aWV3KHZub2RlOiBWbm9kZTxNYWlsRWRpdG9yQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGEgPSB2bm9kZS5hdHRyc1xuXHRcdHRoaXMuYXR0cnMgPSBhXG5cdFx0Y29uc3QgeyBtb2RlbCB9ID0gYVxuXHRcdHRoaXMuc2VuZE1haWxNb2RlbCA9IG1vZGVsXG5cblx0XHRjb25zdCBzaG93Q29uZmlkZW50aWFsQnV0dG9uID0gbW9kZWwuY29udGFpbnNFeHRlcm5hbFJlY2lwaWVudHMoKVxuXHRcdGNvbnN0IGlzQ29uZmlkZW50aWFsID0gbW9kZWwuaXNDb25maWRlbnRpYWwoKSAmJiBzaG93Q29uZmlkZW50aWFsQnV0dG9uXG5cdFx0Y29uc3QgY29uZmlkZW50aWFsQnV0dG9uQXR0cnM6IFRvZ2dsZUJ1dHRvbkF0dHJzID0ge1xuXHRcdFx0dGl0bGU6IFwiY29uZmlkZW50aWFsX2FjdGlvblwiLFxuXHRcdFx0b25Ub2dnbGVkOiAoXywgZSkgPT4ge1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdG1vZGVsLnNldENvbmZpZGVudGlhbCghbW9kZWwuaXNDb25maWRlbnRpYWwoKSlcblx0XHRcdH0sXG5cdFx0XHRpY29uOiBtb2RlbC5pc0NvbmZpZGVudGlhbCgpID8gSWNvbnMuTG9jayA6IEljb25zLlVubG9jayxcblx0XHRcdHRvZ2dsZWQ6IG1vZGVsLmlzQ29uZmlkZW50aWFsKCksXG5cdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0fVxuXHRcdGNvbnN0IGF0dGFjaEZpbGVzQnV0dG9uQXR0cnM6IEljb25CdXR0b25BdHRycyA9IHtcblx0XHRcdHRpdGxlOiBcImF0dGFjaEZpbGVzX2FjdGlvblwiLFxuXHRcdFx0Y2xpY2s6IChldiwgZG9tKSA9PiBjaG9vc2VBbmRBdHRhY2hGaWxlKG1vZGVsLCBkb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpLnRoZW4oKCkgPT4gbS5yZWRyYXcoKSksXG5cdFx0XHRpY29uOiBJY29ucy5BdHRhY2htZW50LFxuXHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdH1cblx0XHRjb25zdCBwbGFpbnRleHRGb3JtYXR0aW5nID0gbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5wcm9wcy5zZW5kUGxhaW50ZXh0T25seVxuXHRcdHRoaXMuZWRpdG9yLnNldENyZWF0ZXNMaXN0cyghcGxhaW50ZXh0Rm9ybWF0dGluZylcblxuXHRcdGNvbnN0IHRvb2xiYXJCdXR0b24gPSAoKSA9PlxuXHRcdFx0IXBsYWludGV4dEZvcm1hdHRpbmdcblx0XHRcdFx0PyBtKFRvZ2dsZUJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0dGl0bGU6IFwic2hvd1JpY2hUZXh0VG9vbGJhcl9hY3Rpb25cIixcblx0XHRcdFx0XHRcdGljb246IEljb25zLkZvbnRTaXplLFxuXHRcdFx0XHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdFx0XHRcdFx0dG9nZ2xlZDogYS5kb1Nob3dUb29sYmFyKCksXG5cdFx0XHRcdFx0XHRvblRvZ2dsZWQ6IChfLCBlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGEuZG9TaG93VG9vbGJhcighYS5kb1Nob3dUb29sYmFyKCkpXG5cdFx0XHRcdFx0XHRcdC8vIFN0b3AgdGhlIHN1YmplY3QgYmFyIGZyb20gYmVpbmcgZm9jdXNlZFxuXHRcdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdFx0XHRcdHRoaXMuZWRpdG9yLmZvY3VzKClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0OiBudWxsXG5cblx0XHRjb25zdCBzdWJqZWN0RmllbGRBdHRyczogVGV4dEZpZWxkQXR0cnMgPSB7XG5cdFx0XHRsYWJlbDogXCJzdWJqZWN0X2xhYmVsXCIsXG5cdFx0XHRoZWxwTGFiZWw6ICgpID0+IGdldENvbmZpZGVudGlhbFN0YXRlTWVzc2FnZShtb2RlbC5pc0NvbmZpZGVudGlhbCgpKSxcblx0XHRcdHZhbHVlOiBtb2RlbC5nZXRTdWJqZWN0KCksXG5cdFx0XHRvbmlucHV0OiAodmFsKSA9PiBtb2RlbC5zZXRTdWJqZWN0KHZhbCksXG5cdFx0XHRpbmplY3Rpb25zUmlnaHQ6ICgpID0+XG5cdFx0XHRcdG0oXCIuZmxleC5lbmQubWwtYmV0d2Vlbi1zLml0ZW1zLWNlbnRlclwiLCBbXG5cdFx0XHRcdFx0c2hvd0NvbmZpZGVudGlhbEJ1dHRvbiA/IG0oVG9nZ2xlQnV0dG9uLCBjb25maWRlbnRpYWxCdXR0b25BdHRycykgOiBudWxsLFxuXHRcdFx0XHRcdHRoaXMua25vd2xlZGdlQmFzZUluamVjdGlvbiA/IHRoaXMucmVuZGVyVG9nZ2xlS25vd2xlZGdlQmFzZSh0aGlzLmtub3dsZWRnZUJhc2VJbmplY3Rpb24pIDogbnVsbCxcblx0XHRcdFx0XHRtKEljb25CdXR0b24sIGF0dGFjaEZpbGVzQnV0dG9uQXR0cnMpLFxuXHRcdFx0XHRcdHRvb2xiYXJCdXR0b24oKSxcblx0XHRcdFx0XSksXG5cdFx0fVxuXG5cdFx0Y29uc3QgYXR0YWNobWVudEJ1YmJsZUF0dHJzID0gY3JlYXRlQXR0YWNobWVudEJ1YmJsZUF0dHJzKG1vZGVsLCB0aGlzLmlubGluZUltYWdlRWxlbWVudHMpXG5cblx0XHRsZXQgZWRpdEN1c3RvbU5vdGlmaWNhdGlvbk1haWxBdHRyczogSWNvbkJ1dHRvbkF0dHJzIHwgbnVsbCA9IG51bGxcblxuXHRcdGlmIChsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzR2xvYmFsQWRtaW4oKSkge1xuXHRcdFx0ZWRpdEN1c3RvbU5vdGlmaWNhdGlvbk1haWxBdHRycyA9IGF0dGFjaERyb3Bkb3duKHtcblx0XHRcdFx0bWFpbkJ1dHRvbkF0dHJzOiB7XG5cdFx0XHRcdFx0dGl0bGU6IFwibW9yZV9sYWJlbFwiLFxuXHRcdFx0XHRcdGljb246IEljb25zLk1vcmUsXG5cdFx0XHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjaGlsZEF0dHJzOiAoKSA9PiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGFiZWw6IFwiYWRkX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0aW1wb3J0KFwiLi4vLi4vLi4vY29tbW9uL3NldHRpbmdzL0VkaXROb3RpZmljYXRpb25FbWFpbERpYWxvZy5qc1wiKS50aGVuKCh7IHNob3dBZGRPckVkaXROb3RpZmljYXRpb25FbWFpbERpYWxvZyB9KSA9PlxuXHRcdFx0XHRcdFx0XHRcdHNob3dBZGRPckVkaXROb3RpZmljYXRpb25FbWFpbERpYWxvZyhsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpKSxcblx0XHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImVkaXRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vc2V0dGluZ3MvRWRpdE5vdGlmaWNhdGlvbkVtYWlsRGlhbG9nLmpzXCIpLnRoZW4oKHsgc2hvd0FkZE9yRWRpdE5vdGlmaWNhdGlvbkVtYWlsRGlhbG9nIH0pID0+XG5cdFx0XHRcdFx0XHRcdFx0c2hvd0FkZE9yRWRpdE5vdGlmaWNhdGlvbkVtYWlsRGlhbG9nKGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCksIG1vZGVsLmdldFNlbGVjdGVkTm90aWZpY2F0aW9uTGFuZ3VhZ2VDb2RlKCkpLFxuXHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdF0sXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIjbWFpbC1lZGl0b3IuZnVsbC1oZWlnaHQudGV4dC50b3VjaC1jYWxsb3V0LmZsZXguZmxleC1jb2x1bW5cIixcblx0XHRcdHtcblx0XHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHRpZiAoZS50YXJnZXQgPT09IHRoaXMuZWRpdG9yLmdldERPTSgpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmVkaXRvci5mb2N1cygpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmRyYWdvdmVyOiAoZXY6IERyYWdFdmVudCkgPT4ge1xuXHRcdFx0XHRcdC8vIGRvIG5vdCBjaGVjayB0aGUgZGF0YSB0cmFuc2ZlciBoZXJlIGJlY2F1c2UgaXQgaXMgbm90IGFsd2F5cyBmaWxsZWQsIGUuZy4gaW4gU2FmYXJpXG5cdFx0XHRcdFx0ZXYuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uZHJvcDogKGV2OiBEcmFnRXZlbnQpID0+IHtcblx0XHRcdFx0XHRpZiAoZXYuZGF0YVRyYW5zZmVyPy5maWxlcyAmJiBldi5kYXRhVHJhbnNmZXIuZmlsZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdFx0bGV0IG5hdGl2ZUZpbGVzID0gZmlsZUxpc3RUb0FycmF5KGV2LmRhdGFUcmFuc2Zlci5maWxlcylcblx0XHRcdFx0XHRcdHJlYWRMb2NhbEZpbGVzKG5hdGl2ZUZpbGVzKVxuXHRcdFx0XHRcdFx0XHQudGhlbigoZGF0YUZpbGVzKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0bW9kZWwuYXR0YWNoRmlsZXMoZGF0YUZpbGVzIGFzIGFueSlcblx0XHRcdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdC5jYXRjaCgoZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGUpXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIERpYWxvZy5tZXNzYWdlKFwiY291bGROb3RBdHRhY2hGaWxlX21zZ1wiKVxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0ZXYuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHRtKFwiLnJlbFwiLCB0aGlzLnJlbmRlclJlY2lwaWVudEZpZWxkKFJlY2lwaWVudEZpZWxkLlRPLCB0aGlzLnJlY2lwaWVudEZpZWxkVGV4dHMudG8sIGEuc2VhcmNoKSksXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIucmVsXCIsXG5cdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdEV4cGFuZGVyUGFuZWwsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGV4cGFuZGVkOiB0aGlzLmFyZURldGFpbHNFeHBhbmRlZCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRtKFwiLmRldGFpbHNcIiwgW1xuXHRcdFx0XHRcdFx0XHR0aGlzLnJlbmRlclJlY2lwaWVudEZpZWxkKFJlY2lwaWVudEZpZWxkLkNDLCB0aGlzLnJlY2lwaWVudEZpZWxkVGV4dHMuY2MsIGEuc2VhcmNoKSxcblx0XHRcdFx0XHRcdFx0dGhpcy5yZW5kZXJSZWNpcGllbnRGaWVsZChSZWNpcGllbnRGaWVsZC5CQ0MsIHRoaXMucmVjaXBpZW50RmllbGRUZXh0cy5iY2MsIGEuc2VhcmNoKSxcblx0XHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdCksXG5cdFx0XHRcdG0oXCIud3JhcHBpbmctcm93XCIsIFtcblx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XCJcIixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcIm1pbi13aWR0aFwiOiBcIjI1MHB4XCIsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0bShEcm9wRG93blNlbGVjdG9yLCB7XG5cdFx0XHRcdFx0XHRcdGxhYmVsOiBcInNlbmRlcl9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0XHRpdGVtczogZ2V0RW5hYmxlZE1haWxBZGRyZXNzZXNXaXRoVXNlcihtb2RlbC5tYWlsYm94RGV0YWlscywgbW9kZWwudXNlcigpLnVzZXJHcm91cEluZm8pXG5cdFx0XHRcdFx0XHRcdFx0LnNvcnQoKVxuXHRcdFx0XHRcdFx0XHRcdC5tYXAoKG1haWxBZGRyZXNzKSA9PiAoe1xuXHRcdFx0XHRcdFx0XHRcdFx0bmFtZTogbWFpbEFkZHJlc3MsXG5cdFx0XHRcdFx0XHRcdFx0XHR2YWx1ZTogbWFpbEFkZHJlc3MsXG5cdFx0XHRcdFx0XHRcdFx0fSkpLFxuXHRcdFx0XHRcdFx0XHRzZWxlY3RlZFZhbHVlOiBhLm1vZGVsLmdldFNlbmRlcigpLFxuXHRcdFx0XHRcdFx0XHRzZWxlY3RlZFZhbHVlRGlzcGxheTogZ2V0TWFpbEFkZHJlc3NEaXNwbGF5VGV4dChhLm1vZGVsLmdldFNlbmRlck5hbWUoKSwgYS5tb2RlbC5nZXRTZW5kZXIoKSwgZmFsc2UpLFxuXHRcdFx0XHRcdFx0XHRzZWxlY3Rpb25DaGFuZ2VkSGFuZGxlcjogKHNlbGVjdGlvbjogc3RyaW5nKSA9PiBtb2RlbC5zZXRTZW5kZXIoc2VsZWN0aW9uKSxcblx0XHRcdFx0XHRcdFx0ZHJvcGRvd25XaWR0aDogMjUwLFxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRpc0NvbmZpZGVudGlhbFxuXHRcdFx0XHRcdFx0PyBtKFxuXHRcdFx0XHRcdFx0XHRcdFwiLmZsZXhcIixcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcIm1pbi13aWR0aFwiOiBcIjI1MHB4XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBodG1sRG9tID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGh0bWxEb20uc3R5bGUub3BhY2l0eSA9IFwiMFwiXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBhbmltYXRpb25zLmFkZChodG1sRG9tLCBvcGFjaXR5KDAsIDEsIHRydWUpKVxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdG9uYmVmb3JlcmVtb3ZlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgaHRtbERvbSA9IHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRodG1sRG9tLnN0eWxlLm9wYWNpdHkgPSBcIjFcIlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gYW5pbWF0aW9ucy5hZGQoaHRtbERvbSwgb3BhY2l0eSgxLCAwLCB0cnVlKSlcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcIi5mbGV4LWdyb3dcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0bShEcm9wRG93blNlbGVjdG9yLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwibm90aWZpY2F0aW9uTWFpbExhbmd1YWdlX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aXRlbXM6IG1vZGVsLmdldEF2YWlsYWJsZU5vdGlmaWNhdGlvblRlbXBsYXRlTGFuZ3VhZ2VzKCkubWFwKChsYW5ndWFnZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bmFtZTogbGFuZy5nZXQobGFuZ3VhZ2UudGV4dElkKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dmFsdWU6IGxhbmd1YWdlLmNvZGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0c2VsZWN0ZWRWYWx1ZTogbW9kZWwuZ2V0U2VsZWN0ZWROb3RpZmljYXRpb25MYW5ndWFnZUNvZGUoKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzZWxlY3Rpb25DaGFuZ2VkSGFuZGxlcjogKHY6IHN0cmluZykgPT4gbW9kZWwuc2V0U2VsZWN0ZWROb3RpZmljYXRpb25MYW5ndWFnZUNvZGUodiksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZHJvcGRvd25XaWR0aDogMjUwLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdFx0XHRlZGl0Q3VzdG9tTm90aWZpY2F0aW9uTWFpbEF0dHJzXG5cdFx0XHRcdFx0XHRcdFx0XHRcdD8gbShcIi5wdC5mbGV4LW5vLWdyb3cuZmxleC1lbmQuYm9yZGVyLWJvdHRvbS5mbGV4Lml0ZW1zLWNlbnRlclwiLCBtKEljb25CdXR0b24sIGVkaXRDdXN0b21Ob3RpZmljYXRpb25NYWlsQXR0cnMpKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdCAgKVxuXHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRdKSxcblx0XHRcdFx0aXNDb25maWRlbnRpYWwgPyB0aGlzLnJlbmRlclBhc3N3b3JkRmllbGRzKCkgOiBudWxsLFxuXHRcdFx0XHRtKFwiLnJvd1wiLCBtKFRleHRGaWVsZCwgc3ViamVjdEZpZWxkQXR0cnMpKSxcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIi5mbGV4LXN0YXJ0LmZsZXgtd3JhcC5tdC1zLm1iLXMuZ2FwLWhwYWRcIixcblx0XHRcdFx0XHRhdHRhY2htZW50QnViYmxlQXR0cnMubWFwKChhKSA9PiBtKEF0dGFjaG1lbnRCdWJibGUsIGEpKSxcblx0XHRcdFx0KSxcblx0XHRcdFx0bW9kZWwuZ2V0QXR0YWNobWVudHMoKS5sZW5ndGggPiAwID8gbShcImhyLmhyXCIpIDogbnVsbCxcblx0XHRcdFx0dGhpcy5yZW5kZXJFeHRlcm5hbENvbnRlbnRCYW5uZXIodGhpcy5hdHRycyksXG5cdFx0XHRcdGEuZG9TaG93VG9vbGJhcigpID8gdGhpcy5yZW5kZXJUb29sYmFyKG1vZGVsKSA6IG51bGwsXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIucHQtcy50ZXh0LnNjcm9sbC14LmJyZWFrLXdvcmQtbGlua3MuZmxleC5mbGV4LWNvbHVtbi5mbGV4LWdyb3dcIixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRvbmNsaWNrOiAoKSA9PiB0aGlzLmVkaXRvci5mb2N1cygpLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0bSh0aGlzLmVkaXRvciksXG5cdFx0XHRcdCksXG5cdFx0XHRcdG0oXCIucGJcIiksXG5cdFx0XHRdLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRXh0ZXJuYWxDb250ZW50QmFubmVyKGF0dHJzOiBNYWlsRWRpdG9yQXR0cnMpOiBDaGlsZHJlbiB8IG51bGwge1xuXHRcdGlmICghdGhpcy5ibG9ja0V4dGVybmFsQ29udGVudCB8fCB0aGlzLmFsd2F5c0Jsb2NrRXh0ZXJuYWxDb250ZW50IHx8IHRoaXMuYmxvY2tlZEV4dGVybmFsQ29udGVudCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cblx0XHRjb25zdCBzaG93QnV0dG9uOiBCYW5uZXJCdXR0b25BdHRycyA9IHtcblx0XHRcdGxhYmVsOiBcInNob3dCbG9ja2VkQ29udGVudF9hY3Rpb25cIixcblx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdHRoaXMudXBkYXRlRXh0ZXJuYWxDb250ZW50U3RhdHVzKENvbnRlbnRCbG9ja2luZ1N0YXR1cy5TaG93KVxuXHRcdFx0XHR0aGlzLnByb2Nlc3NJbmxpbmVJbWFnZXMoKVxuXHRcdFx0fSxcblx0XHR9XG5cblx0XHRyZXR1cm4gbShJbmZvQmFubmVyLCB7XG5cdFx0XHRtZXNzYWdlOiBcImNvbnRlbnRCbG9ja2VkX21zZ1wiLFxuXHRcdFx0aWNvbjogSWNvbnMuUGljdHVyZSxcblx0XHRcdGhlbHBMaW5rOiBjYW5TZWVUdXRhTGlua3MoYXR0cnMubW9kZWwubG9naW5zKSA/IEluZm9MaW5rLkxvYWRJbWFnZXMgOiBudWxsLFxuXHRcdFx0YnV0dG9uczogW3Nob3dCdXR0b25dLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHVwZGF0ZUV4dGVybmFsQ29udGVudFN0YXR1cyhzdGF0dXM6IENvbnRlbnRCbG9ja2luZ1N0YXR1cykge1xuXHRcdHRoaXMuYmxvY2tFeHRlcm5hbENvbnRlbnQgPSBzdGF0dXMgPT09IENvbnRlbnRCbG9ja2luZ1N0YXR1cy5CbG9jayB8fCBzdGF0dXMgPT09IENvbnRlbnRCbG9ja2luZ1N0YXR1cy5BbHdheXNCbG9ja1xuXG5cdFx0Y29uc3Qgc2FuaXRpemVkID0gaHRtbFNhbml0aXplci5zYW5pdGl6ZUhUTUwodGhpcy5lZGl0b3IuZ2V0SFRNTCgpLCB7XG5cdFx0XHRibG9ja0V4dGVybmFsQ29udGVudDogdGhpcy5ibG9ja0V4dGVybmFsQ29udGVudCxcblx0XHR9KVxuXG5cdFx0dGhpcy5lZGl0b3Iuc2V0SFRNTChzYW5pdGl6ZWQuaHRtbClcblx0fVxuXG5cdHByaXZhdGUgcHJvY2Vzc0lubGluZUltYWdlcygpIHtcblx0XHR0aGlzLmlubGluZUltYWdlRWxlbWVudHMgPSByZXBsYWNlQ2lkc1dpdGhJbmxpbmVJbWFnZXModGhpcy5lZGl0b3IuZ2V0RE9NKCksIHRoaXMuc2VuZE1haWxNb2RlbC5sb2FkZWRJbmxpbmVJbWFnZXMsIChjaWQsIGV2ZW50LCBkb20pID0+IHtcblx0XHRcdGNvbnN0IGRvd25sb2FkQ2xpY2tIYW5kbGVyID0gY3JlYXRlRHJvcGRvd24oe1xuXHRcdFx0XHRsYXp5QnV0dG9uczogKCkgPT4gW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImRvd25sb2FkX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHRoaXMuZG93bmxvYWRJbmxpbmVJbWFnZSh0aGlzLnNlbmRNYWlsTW9kZWwsIGNpZCksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdH0pXG5cdFx0XHRkb3dubG9hZENsaWNrSGFuZGxlcihkb3duY2FzdChldmVudCksIGRvbSlcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJUb2dnbGVLbm93bGVkZ2VCYXNlKGtub3dsZWRnZUJhc2VJbmplY3Rpb246IERpYWxvZ0luamVjdGlvblJpZ2h0QXR0cnM8S25vd2xlZGdlYmFzZURpYWxvZ0NvbnRlbnRBdHRycz4pIHtcblx0XHRyZXR1cm4gbShUb2dnbGVCdXR0b24sIHtcblx0XHRcdHRpdGxlOiBcIm9wZW5Lbm93bGVkZ2ViYXNlX2FjdGlvblwiLFxuXHRcdFx0dG9nZ2xlZDoga25vd2xlZGdlQmFzZUluamVjdGlvbi52aXNpYmxlKCksXG5cdFx0XHRvblRvZ2dsZWQ6ICgpID0+IHtcblx0XHRcdFx0aWYgKGtub3dsZWRnZUJhc2VJbmplY3Rpb24udmlzaWJsZSgpKSB7XG5cdFx0XHRcdFx0a25vd2xlZGdlQmFzZUluamVjdGlvbi52aXNpYmxlKGZhbHNlKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGtub3dsZWRnZUJhc2VJbmplY3Rpb24uY29tcG9uZW50QXR0cnMubW9kZWwuc29ydEVudHJpZXNCeU1hdGNoaW5nS2V5d29yZHModGhpcy5lZGl0b3IuZ2V0VmFsdWUoKSlcblx0XHRcdFx0XHRrbm93bGVkZ2VCYXNlSW5qZWN0aW9uLnZpc2libGUodHJ1ZSlcblx0XHRcdFx0XHRrbm93bGVkZ2VCYXNlSW5qZWN0aW9uLmNvbXBvbmVudEF0dHJzLm1vZGVsLmluaXQoKVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0aWNvbjogSWNvbnMuQm9vayxcblx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJUb29sYmFyKG1vZGVsOiBTZW5kTWFpbE1vZGVsKTogQ2hpbGRyZW4ge1xuXHRcdC8vIFRvb2xiYXIgaXMgbm90IHJlbW92ZWQgZnJvbSBET00gZGlyZWN0bHksIG9ubHkgaXQncyBwYXJlbnQgKGFycmF5KSBpcyBzbyB3ZSBoYXZlIHRvIGFuaW1hdGUgaXQgbWFudWFsbHkuXG5cdFx0Ly8gbS5mcmFnbWVudCgpIGdpdmVzIHVzIGEgdm5vZGUgd2l0aG91dCBhY3R1YWwgRE9NIGVsZW1lbnQgc28gdGhhdCB3ZSBjYW4gcnVuIGNhbGxiYWNrIG9uIHJlbW92YWxcblx0XHRyZXR1cm4gbS5mcmFnbWVudChcblx0XHRcdHtcblx0XHRcdFx0b25iZWZvcmVyZW1vdmU6ICh7IGRvbSB9KSA9PiBhbmltYXRlVG9vbGJhcihkb20uY2hpbGRyZW5bMF0gYXMgSFRNTEVsZW1lbnQsIGZhbHNlKSxcblx0XHRcdH0sXG5cdFx0XHRbXG5cdFx0XHRcdG0oUmljaFRleHRUb29sYmFyLCB7XG5cdFx0XHRcdFx0ZWRpdG9yOiB0aGlzLmVkaXRvcixcblx0XHRcdFx0XHRpbWFnZUJ1dHRvbkNsaWNrSGFuZGxlcjogaXNBcHAoKVxuXHRcdFx0XHRcdFx0PyBudWxsXG5cdFx0XHRcdFx0XHQ6IChldmVudDogRXZlbnQpID0+IHRoaXMuaW1hZ2VCdXR0b25DbGlja0hhbmRsZXIobW9kZWwsIChldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKSxcblx0XHRcdFx0XHRjdXN0b21CdXR0b25BdHRyczogdGhpcy50ZW1wbGF0ZU1vZGVsXG5cdFx0XHRcdFx0XHQ/IFtcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aXRsZTogXCJvcGVuVGVtcGxhdGVQb3B1cF9tc2dcIixcblx0XHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMub3BlblRlbXBsYXRlcygpXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuTGlzdEFsdCxcblx0XHRcdFx0XHRcdFx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0ICBdXG5cdFx0XHRcdFx0XHQ6IFtdLFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0bShcImhyLmhyXCIpLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGltYWdlQnV0dG9uQ2xpY2tIYW5kbGVyKG1vZGVsOiBTZW5kTWFpbE1vZGVsLCByZWN0OiBET01SZWN0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgZmlsZXMgPSBhd2FpdCBjaG9vc2VBbmRBdHRhY2hGaWxlKG1vZGVsLCByZWN0LCBBTExPV0VEX0lNQUdFX0ZPUk1BVFMpXG5cdFx0aWYgKCFmaWxlcyB8fCBmaWxlcy5sZW5ndGggPT09IDApIHJldHVyblxuXHRcdHJldHVybiBhd2FpdCB0aGlzLmluc2VydElubGluZUltYWdlcyhtb2RlbCwgZmlsZXMpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGluc2VydElubGluZUltYWdlcyhtb2RlbDogU2VuZE1haWxNb2RlbCwgZmlsZXM6IFJlYWRvbmx5QXJyYXk8RGF0YUZpbGUgfCBGaWxlUmVmZXJlbmNlPik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuXHRcdFx0Y29uc3QgaW1nID0gY3JlYXRlSW5saW5lSW1hZ2UoZmlsZSBhcyBEYXRhRmlsZSlcblx0XHRcdG1vZGVsLmxvYWRlZElubGluZUltYWdlcy5zZXQoaW1nLmNpZCwgaW1nKVxuXHRcdFx0dGhpcy5pbmxpbmVJbWFnZUVsZW1lbnRzLnB1c2goXG5cdFx0XHRcdHRoaXMuZWRpdG9yLmluc2VydEltYWdlKGltZy5vYmplY3RVcmwsIHtcblx0XHRcdFx0XHRjaWQ6IGltZy5jaWQsXG5cdFx0XHRcdFx0c3R5bGU6IFwibWF4LXdpZHRoOiAxMDAlXCIsXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdH1cblx0XHRtLnJlZHJhdygpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclBhc3N3b3JkRmllbGRzKCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmV4dGVybmFsLXJlY2lwaWVudHMub3ZlcmZsb3ctaGlkZGVuXCIsXG5cdFx0XHR7XG5cdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHRoaXMuYW5pbWF0ZUhlaWdodCh2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQsIHRydWUpLFxuXHRcdFx0XHRvbmJlZm9yZXJlbW92ZTogKHZub2RlKSA9PiB0aGlzLmFuaW1hdGVIZWlnaHQodm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50LCBmYWxzZSksXG5cdFx0XHR9LFxuXHRcdFx0dGhpcy5zZW5kTWFpbE1vZGVsXG5cdFx0XHRcdC5hbGxSZWNpcGllbnRzKClcblx0XHRcdFx0LmZpbHRlcigocikgPT4gci50eXBlID09PSBSZWNpcGllbnRUeXBlLkVYVEVSTkFMKVxuXHRcdFx0XHQubWFwKChyZWNpcGllbnQpID0+IHtcblx0XHRcdFx0XHRpZiAoIXRoaXMucmVjaXBpZW50U2hvd0NvbmZpZGVudGlhbC5oYXMocmVjaXBpZW50LmFkZHJlc3MpKSB0aGlzLnJlY2lwaWVudFNob3dDb25maWRlbnRpYWwuc2V0KHJlY2lwaWVudC5hZGRyZXNzLCBmYWxzZSlcblxuXHRcdFx0XHRcdHJldHVybiBtKFBhc3N3b3JkRmllbGQsIHtcblx0XHRcdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHRoaXMuYW5pbWF0ZUhlaWdodCh2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQsIHRydWUpLFxuXHRcdFx0XHRcdFx0b25iZWZvcmVyZW1vdmU6ICh2bm9kZSkgPT4gdGhpcy5hbmltYXRlSGVpZ2h0KHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudCwgZmFsc2UpLFxuXHRcdFx0XHRcdFx0bGFiZWw6IGxhbmcuZ2V0VHJhbnNsYXRpb24oXCJwYXNzd29yZEZvcl9sYWJlbFwiLCB7IFwiezF9XCI6IHJlY2lwaWVudC5hZGRyZXNzIH0pLFxuXHRcdFx0XHRcdFx0dmFsdWU6IHRoaXMuc2VuZE1haWxNb2RlbC5nZXRQYXNzd29yZChyZWNpcGllbnQuYWRkcmVzcyksXG5cdFx0XHRcdFx0XHRwYXNzd29yZFN0cmVuZ3RoOiB0aGlzLnNlbmRNYWlsTW9kZWwuZ2V0UGFzc3dvcmRTdHJlbmd0aChyZWNpcGllbnQpLFxuXHRcdFx0XHRcdFx0c3RhdHVzOiBcImF1dG9cIixcblx0XHRcdFx0XHRcdGF1dG9jb21wbGV0ZUFzOiBBdXRvY29tcGxldGUub2ZmLFxuXHRcdFx0XHRcdFx0b25pbnB1dDogKHZhbCkgPT4gdGhpcy5zZW5kTWFpbE1vZGVsLnNldFBhc3N3b3JkKHJlY2lwaWVudC5hZGRyZXNzLCB2YWwpLFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0pLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyUmVjaXBpZW50RmllbGQoZmllbGQ6IFJlY2lwaWVudEZpZWxkLCBmaWVsZFRleHQ6IFN0cmVhbTxzdHJpbmc+LCBzZWFyY2g6IFJlY2lwaWVudHNTZWFyY2hNb2RlbCk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBsYWJlbCA9IChcblx0XHRcdHtcblx0XHRcdFx0dG86IFwidG9fbGFiZWxcIixcblx0XHRcdFx0Y2M6IFwiY2NfbGFiZWxcIixcblx0XHRcdFx0YmNjOiBcImJjY19sYWJlbFwiLFxuXHRcdFx0fSBhcyBjb25zdFxuXHRcdClbZmllbGRdXG5cblx0XHRyZXR1cm4gbShNYWlsUmVjaXBpZW50c1RleHRGaWVsZCwge1xuXHRcdFx0bGFiZWwsXG5cdFx0XHR0ZXh0OiBmaWVsZFRleHQoKSxcblx0XHRcdG9uVGV4dENoYW5nZWQ6ICh0ZXh0KSA9PiBmaWVsZFRleHQodGV4dCksXG5cdFx0XHRyZWNpcGllbnRzOiB0aGlzLnNlbmRNYWlsTW9kZWwuZ2V0UmVjaXBpZW50TGlzdChmaWVsZCksXG5cdFx0XHRvblJlY2lwaWVudEFkZGVkOiBhc3luYyAoYWRkcmVzcywgbmFtZSkgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuc2VuZE1haWxNb2RlbC5hZGRSZWNpcGllbnQoZmllbGQsIHsgYWRkcmVzcywgbmFtZSB9KVxuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0aWYgKGlzT2ZmbGluZUVycm9yKGUpKSB7XG5cdFx0XHRcdFx0XHQvLyB3ZSBhcmUgb2ZmbGluZSBidXQgd2Ugd2FudCB0byBzaG93IHRoZSBlcnJvciBkaWFsb2cgb25seSB3aGVuIHdlIGNsaWNrIG9uIHNlbmQuXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgVG9vTWFueVJlcXVlc3RzRXJyb3IpIHtcblx0XHRcdFx0XHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFwidG9vTWFueUF0dGVtcHRzX21zZ1wiKVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0b25SZWNpcGllbnRSZW1vdmVkOiAoYWRkcmVzcykgPT4gdGhpcy5zZW5kTWFpbE1vZGVsLnJlbW92ZVJlY2lwaWVudEJ5QWRkcmVzcyhhZGRyZXNzLCBmaWVsZCksXG5cdFx0XHRnZXRSZWNpcGllbnRDbGlja2VkRHJvcGRvd25BdHRyczogKGFkZHJlc3MpID0+IHtcblx0XHRcdFx0Y29uc3QgcmVjaXBpZW50ID0gdGhpcy5zZW5kTWFpbE1vZGVsLmdldFJlY2lwaWVudChmaWVsZCwgYWRkcmVzcykhXG5cdFx0XHRcdHJldHVybiB0aGlzLmdldFJlY2lwaWVudENsaWNrZWRDb250ZXh0QnV0dG9ucyhyZWNpcGllbnQsIGZpZWxkKVxuXHRcdFx0fSxcblx0XHRcdGRpc2FibGVkOiAhdGhpcy5zZW5kTWFpbE1vZGVsLmxvZ2lucy5pc0ludGVybmFsVXNlckxvZ2dlZEluKCksXG5cdFx0XHRpbmplY3Rpb25zUmlnaHQ6XG5cdFx0XHRcdGZpZWxkID09PSBSZWNpcGllbnRGaWVsZC5UTyAmJiB0aGlzLnNlbmRNYWlsTW9kZWwubG9naW5zLmlzSW50ZXJuYWxVc2VyTG9nZ2VkSW4oKVxuXHRcdFx0XHRcdD8gbShcblx0XHRcdFx0XHRcdFx0XCJcIixcblx0XHRcdFx0XHRcdFx0bShUb2dnbGVCdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0XHR0aXRsZTogXCJzaG93X2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdGljb246IEJvb3RJY29ucy5FeHBhbmQsXG5cdFx0XHRcdFx0XHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdFx0XHRcdFx0XHRcdHRvZ2dsZWQ6IHRoaXMuYXJlRGV0YWlsc0V4cGFuZGVkLFxuXHRcdFx0XHRcdFx0XHRcdG9uVG9nZ2xlZDogKF8sIGUpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuYXJlRGV0YWlsc0V4cGFuZGVkID0gIXRoaXMuYXJlRGV0YWlsc0V4cGFuZGVkXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0ICApXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0c2VhcmNoLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGdldFJlY2lwaWVudENsaWNrZWRDb250ZXh0QnV0dG9ucyhyZWNpcGllbnQ6IFJlc29sdmFibGVSZWNpcGllbnQsIGZpZWxkOiBSZWNpcGllbnRGaWVsZCk6IFByb21pc2U8RHJvcGRvd25DaGlsZEF0dHJzW10+IHtcblx0XHRjb25zdCB7IGVudGl0eSwgY29udGFjdE1vZGVsIH0gPSB0aGlzLnNlbmRNYWlsTW9kZWxcblxuXHRcdGNvbnN0IGNhbkVkaXRCdWJibGVSZWNpcGllbnQgPSBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzSW50ZXJuYWxVc2VyKCkgJiYgIWxvY2F0b3IubG9naW5zLmlzRW5hYmxlZChGZWF0dXJlVHlwZS5EaXNhYmxlQ29udGFjdHMpXG5cblx0XHRjb25zdCBjYW5SZW1vdmVCdWJibGUgPSBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzSW50ZXJuYWxVc2VyKClcblxuXHRcdGNvbnN0IGNyZWF0ZWRDb250YWN0UmVjZWl2ZXIgPSAoY29udGFjdEVsZW1lbnRJZDogSWQpID0+IHtcblx0XHRcdGNvbnN0IG1haWxBZGRyZXNzID0gcmVjaXBpZW50LmFkZHJlc3NcblxuXHRcdFx0Y29udGFjdE1vZGVsLmdldENvbnRhY3RMaXN0SWQoKS50aGVuKChjb250YWN0TGlzdElkOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0aWYgKCFjb250YWN0TGlzdElkKSByZXR1cm5cblx0XHRcdFx0Y29uc3QgaWQ6IElkVHVwbGUgPSBbY29udGFjdExpc3RJZCwgY29udGFjdEVsZW1lbnRJZF1cblx0XHRcdFx0ZW50aXR5LmxvYWQoQ29udGFjdFR5cGVSZWYsIGlkKS50aGVuKChjb250YWN0OiBDb250YWN0KSA9PiB7XG5cdFx0XHRcdFx0aWYgKGNvbnRhY3QubWFpbEFkZHJlc3Nlcy5zb21lKChtYSkgPT4gY2xlYW5NYXRjaChtYS5hZGRyZXNzLCBtYWlsQWRkcmVzcykpKSB7XG5cdFx0XHRcdFx0XHRyZWNpcGllbnQuc2V0TmFtZShnZXRDb250YWN0RGlzcGxheU5hbWUoY29udGFjdCkpXG5cdFx0XHRcdFx0XHRyZWNpcGllbnQuc2V0Q29udGFjdChjb250YWN0KVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLnNlbmRNYWlsTW9kZWwucmVtb3ZlUmVjaXBpZW50KHJlY2lwaWVudCwgZmllbGQsIGZhbHNlKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0fVxuXG5cdFx0Y29uc3QgY29udGV4dEJ1dHRvbnM6IEFycmF5PERyb3Bkb3duQ2hpbGRBdHRycz4gPSBbXVxuXG5cdFx0aWYgKGNhbkVkaXRCdWJibGVSZWNpcGllbnQpIHtcblx0XHRcdGlmIChyZWNpcGllbnQuY29udGFjdCAmJiByZWNpcGllbnQuY29udGFjdC5faWQpIHtcblx0XHRcdFx0Y29udGV4dEJ1dHRvbnMucHVzaCh7XG5cdFx0XHRcdFx0bGFiZWw6IFwiZWRpdENvbnRhY3RfbGFiZWxcIixcblx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0aW1wb3J0KFwiLi4vLi4vY29udGFjdHMvQ29udGFjdEVkaXRvclwiKS50aGVuKCh7IENvbnRhY3RFZGl0b3IgfSkgPT4gbmV3IENvbnRhY3RFZGl0b3IoZW50aXR5LCByZWNpcGllbnQuY29udGFjdCkuc2hvdygpKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb250ZXh0QnV0dG9ucy5wdXNoKHtcblx0XHRcdFx0XHRsYWJlbDogXCJjcmVhdGVDb250YWN0X2FjdGlvblwiLFxuXHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHQvLyBjb250YWN0IGxpc3Rcblx0XHRcdFx0XHRcdGNvbnRhY3RNb2RlbC5nZXRDb250YWN0TGlzdElkKCkudGhlbigoY29udGFjdExpc3RJZDogSWQpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgbmV3Q29udGFjdCA9IGNyZWF0ZU5ld0NvbnRhY3QobG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyLCByZWNpcGllbnQuYWRkcmVzcywgcmVjaXBpZW50Lm5hbWUpXG5cdFx0XHRcdFx0XHRcdGltcG9ydChcIi4uLy4uL2NvbnRhY3RzL0NvbnRhY3RFZGl0b3JcIikudGhlbigoeyBDb250YWN0RWRpdG9yIH0pID0+IHtcblx0XHRcdFx0XHRcdFx0XHQvLyBleHRlcm5hbCB1c2VycyBkb24ndCBzZWUgZWRpdCBidXR0b25zXG5cdFx0XHRcdFx0XHRcdFx0bmV3IENvbnRhY3RFZGl0b3IoZW50aXR5LCBuZXdDb250YWN0LCBhc3NlcnROb3ROdWxsKGNvbnRhY3RMaXN0SWQpLCBjcmVhdGVkQ29udGFjdFJlY2VpdmVyKS5zaG93KClcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoY2FuUmVtb3ZlQnViYmxlKSB7XG5cdFx0XHRjb250ZXh0QnV0dG9ucy5wdXNoKHtcblx0XHRcdFx0bGFiZWw6IFwicmVtb3ZlX2FjdGlvblwiLFxuXHRcdFx0XHRjbGljazogKCkgPT4gdGhpcy5zZW5kTWFpbE1vZGVsLnJlbW92ZVJlY2lwaWVudChyZWNpcGllbnQsIGZpZWxkLCBmYWxzZSksXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdHJldHVybiBjb250ZXh0QnV0dG9uc1xuXHR9XG5cblx0cHJpdmF0ZSBvcGVuVGVtcGxhdGVzKCkge1xuXHRcdGlmICh0aGlzLnRlbXBsYXRlTW9kZWwpIHtcblx0XHRcdHRoaXMudGVtcGxhdGVNb2RlbC5pbml0KCkudGhlbigodGVtcGxhdGVNb2RlbCkgPT4ge1xuXHRcdFx0XHRzaG93VGVtcGxhdGVQb3B1cEluRWRpdG9yKHRlbXBsYXRlTW9kZWwsIHRoaXMuZWRpdG9yLCBudWxsLCB0aGlzLmVkaXRvci5nZXRTZWxlY3RlZFRleHQoKSlcblx0XHRcdH0pXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhbmltYXRlSGVpZ2h0KGRvbUVsZW1lbnQ6IEhUTUxFbGVtZW50LCBmYWRlaW46IGJvb2xlYW4pOiBBbmltYXRpb25Qcm9taXNlIHtcblx0XHRsZXQgY2hpbGRIZWlnaHQgPSBkb21FbGVtZW50Lm9mZnNldEhlaWdodFxuXHRcdHJldHVybiBhbmltYXRpb25zLmFkZChkb21FbGVtZW50LCBmYWRlaW4gPyBoZWlnaHQoMCwgY2hpbGRIZWlnaHQpIDogaGVpZ2h0KGNoaWxkSGVpZ2h0LCAwKSkudGhlbigoKSA9PiB7XG5cdFx0XHRkb21FbGVtZW50LnN0eWxlLmhlaWdodCA9IFwiXCJcblx0XHR9KVxuXHR9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBEaWFsb2cgd2l0aCBhIE1haWxFZGl0b3IgaW5zaWRlLlxuICogQHBhcmFtIG1vZGVsXG4gKiBAcGFyYW0gYmxvY2tFeHRlcm5hbENvbnRlbnRcbiAqIEBwYXJhbSBhbHdheXNCbG9ja0V4dGVybmFsQ29udGVudFxuICogQHJldHVybnMge0RpYWxvZ31cbiAqIEBwcml2YXRlXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZU1haWxFZGl0b3JEaWFsb2cobW9kZWw6IFNlbmRNYWlsTW9kZWwsIGJsb2NrRXh0ZXJuYWxDb250ZW50ID0gZmFsc2UsIGFsd2F5c0Jsb2NrRXh0ZXJuYWxDb250ZW50ID0gZmFsc2UpOiBQcm9taXNlPERpYWxvZz4ge1xuXHRsZXQgZGlhbG9nOiBEaWFsb2dcblx0bGV0IG1haWxFZGl0b3JBdHRyczogTWFpbEVkaXRvckF0dHJzXG5cblx0Y29uc3Qgc2F2ZSA9IChzaG93UHJvZ3Jlc3M6IGJvb2xlYW4gPSB0cnVlKSA9PiB7XG5cdFx0Y29uc3Qgc2F2ZVByb21pc2UgPSBtb2RlbC5zYXZlRHJhZnQodHJ1ZSwgTWFpbE1ldGhvZC5OT05FKVxuXG5cdFx0aWYgKHNob3dQcm9ncmVzcykge1xuXHRcdFx0cmV0dXJuIHNob3dQcm9ncmVzc0RpYWxvZyhcInNhdmVfbXNnXCIsIHNhdmVQcm9taXNlKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gc2F2ZVByb21pc2Vcblx0XHR9XG5cdH1cblxuXHRjb25zdCBzZW5kID0gYXN5bmMgKCkgPT4ge1xuXHRcdGlmIChtb2RlbC5pc1NoYXJlZE1haWxib3goKSAmJiBtb2RlbC5jb250YWluc0V4dGVybmFsUmVjaXBpZW50cygpICYmIG1vZGVsLmlzQ29uZmlkZW50aWFsKCkpIHtcblx0XHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFwic2hhcmVkTWFpbGJveENhbk5vdFNlbmRDb25maWRlbnRpYWxFeHRlcm5hbF9tc2dcIilcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBzdWNjZXNzID0gYXdhaXQgbW9kZWwuc2VuZChNYWlsTWV0aG9kLk5PTkUsIERpYWxvZy5jb25maXJtLCBzaG93UHJvZ3Jlc3NEaWFsb2cpXG5cdFx0XHRpZiAoc3VjY2Vzcykge1xuXHRcdFx0XHRkaXNwb3NlKClcblx0XHRcdFx0ZGlhbG9nLmNsb3NlKClcblxuXHRcdFx0XHRhd2FpdCBoYW5kbGVSYXRpbmdCeUV2ZW50KClcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFVzZXJFcnJvcikge1xuXHRcdFx0XHRzaG93VXNlckVycm9yKGUpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBlXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8ga2VlcCB0cmFjayBvZiB0aGluZ3Mgd2UgbmVlZCB0byBkaXNwb3NlIG9mIHdoZW4gdGhlIGVkaXRvciBpcyBjb21wbGV0ZWx5IGNsb3NlZFxuXHRjb25zdCBkaXNwb3NhYmxlczogeyBkaXNwb3NlOiAoKSA9PiB1bmtub3duIH1bXSA9IFtdXG5cblx0Y29uc3QgZGlzcG9zZSA9ICgpID0+IHtcblx0XHRtb2RlbC5kaXNwb3NlKClcblx0XHRpZiAodGVtcGxhdGVQb3B1cE1vZGVsKSB0ZW1wbGF0ZVBvcHVwTW9kZWwuZGlzcG9zZSgpXG5cdFx0Zm9yIChjb25zdCBkaXNwb3NhYmxlIG9mIGRpc3Bvc2FibGVzKSB7XG5cdFx0XHRkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuXHRcdH1cblx0fVxuXG5cdGNvbnN0IG1pbmltaXplID0gKCkgPT4ge1xuXHRcdGxldCBzYXZlU3RhdHVzID0gc3RyZWFtPFNhdmVTdGF0dXM+KHsgc3RhdHVzOiBTYXZlU3RhdHVzRW51bS5TYXZpbmcgfSlcblx0XHRpZiAobW9kZWwuaGFzTWFpbENoYW5nZWQoKSkge1xuXHRcdFx0c2F2ZShmYWxzZSlcblx0XHRcdFx0LnRoZW4oKCkgPT4gc2F2ZVN0YXR1cyh7IHN0YXR1czogU2F2ZVN0YXR1c0VudW0uU2F2ZWQgfSkpXG5cdFx0XHRcdC5jYXRjaCgoZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHJlYXNvbiA9IGlzT2ZmbGluZUVycm9yKGUpID8gU2F2ZUVycm9yUmVhc29uLkNvbm5lY3Rpb25Mb3N0IDogU2F2ZUVycm9yUmVhc29uLlVua25vd25cblxuXHRcdFx0XHRcdHNhdmVTdGF0dXMoeyBzdGF0dXM6IFNhdmVTdGF0dXNFbnVtLk5vdFNhdmVkLCByZWFzb24gfSlcblxuXHRcdFx0XHRcdC8vIElmIHdlIGRvbid0IHNob3cgdGhlIGVycm9yIGluIHRoZSBtaW5pbWl6ZWQgZXJyb3IgZGlhbG9nLFxuXHRcdFx0XHRcdC8vIFRoZW4gd2UgbmVlZCB0byBjb21tdW5pY2F0ZSBpdCBpbiBhIGRpYWxvZyBvciBhcyBhbiB1bmhhbmRsZWQgZXJyb3Jcblx0XHRcdFx0XHRpZiAocmVhc29uID09PSBTYXZlRXJyb3JSZWFzb24uVW5rbm93bikge1xuXHRcdFx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBVc2VyRXJyb3IpIHtcblx0XHRcdFx0XHRcdFx0c2hvd1VzZXJFcnJvcihlKVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0LmZpbmFsbHkoKCkgPT4gbS5yZWRyYXcoKSlcblx0XHR9IGVsc2UgaWYgKCFtb2RlbC5kcmFmdCkge1xuXHRcdFx0Ly8gSWYgdGhlIG1haWwgaXMgdW5jaGFuZ2VkIGFuZCB0aGVyZSB3YXMgbm8gcHJlZXhpc3RpbmcgZHJhZnQsIGNsb3NlIGluc3RlYWQgb2Ygc2F2aW5nIGFuZCByZXR1cm4gdG8gbm90IHNob3cgbWluaW1pemVkIG1haWwgZWRpdG9yXG5cdFx0XHRkaXNwb3NlKClcblx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0Ly8gSWYgdGhlIG1haWwgaXMgdW5jaGFuZ2VkIGFuZCB0aGVyZSAvaXMvIGEgcHJlZXhpc3RpbmcgZHJhZnQsIHRoZXJlIHdhcyBubyBjaGFuZ2UgYW5kIHRoZSBtYWlsIGlzIGFscmVhZHkgc2F2ZWRcblx0XHRlbHNlIHNhdmVTdGF0dXMgPSBzdHJlYW08U2F2ZVN0YXR1cz4oeyBzdGF0dXM6IFNhdmVTdGF0dXNFbnVtLlNhdmVkIH0pXG5cdFx0c2hvd01pbmltaXplZE1haWxFZGl0b3IoZGlhbG9nLCBtb2RlbCwgbWFpbExvY2F0b3IubWluaW1pemVkTWFpbE1vZGVsLCBsb2NhdG9yLmV2ZW50Q29udHJvbGxlciwgZGlzcG9zZSwgc2F2ZVN0YXR1cylcblx0fVxuXG5cdGxldCB3aW5kb3dDbG9zZVVuc3Vic2NyaWJlID0gKCkgPT4ge31cblxuXHRjb25zdCBoZWFkZXJCYXJBdHRyczogRGlhbG9nSGVhZGVyQmFyQXR0cnMgPSB7XG5cdFx0bGVmdDogW1xuXHRcdFx0e1xuXHRcdFx0XHRsYWJlbDogXCJjbG9zZV9hbHRcIixcblx0XHRcdFx0Y2xpY2s6ICgpID0+IG1pbmltaXplKCksXG5cdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0fSxcblx0XHRdLFxuXHRcdHJpZ2h0OiBbXG5cdFx0XHR7XG5cdFx0XHRcdGxhYmVsOiBcInNlbmRfYWN0aW9uXCIsXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0c2VuZCgpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdH0sXG5cdFx0XSxcblx0XHRtaWRkbGU6IGRpYWxvZ1RpdGxlVHJhbnNsYXRpb25LZXkobW9kZWwuZ2V0Q29udmVyc2F0aW9uVHlwZSgpKSxcblx0XHRjcmVhdGU6ICgpID0+IHtcblx0XHRcdGlmIChpc0Jyb3dzZXIoKSkge1xuXHRcdFx0XHQvLyBIYXZlIGEgc2ltcGxlIGxpc3RlbmVyIG9uIGJyb3dzZXIsIHNvIHRoZWlyIGJyb3dzZXIgd2lsbCBtYWtlIHRoZSB1c2VyIGFzayBpZiB0aGV5IGFyZSBzdXJlIHRoZXkgd2FudCB0byBjbG9zZSB3aGVuIGNsb3NpbmcgdGhlIHRhYi93aW5kb3dcblx0XHRcdFx0d2luZG93Q2xvc2VVbnN1YnNjcmliZSA9IHdpbmRvd0ZhY2FkZS5hZGRXaW5kb3dDbG9zZUxpc3RlbmVyKCgpID0+IHt9KVxuXHRcdFx0fSBlbHNlIGlmIChpc0Rlc2t0b3AoKSkge1xuXHRcdFx0XHQvLyBTaW11bGF0ZSBjbGlja2luZyB0aGUgQ2xvc2UgYnV0dG9uIHdoZW4gb24gdGhlIGRlc2t0b3Agc28gdGhleSBjYW4gc2VlIHRoZXkgY2FuIHNhdmUgYSBkcmFmdCByYXRoZXIgdGhhbiBjb21wbGV0ZWx5IGNsb3NpbmcgaXRcblx0XHRcdFx0d2luZG93Q2xvc2VVbnN1YnNjcmliZSA9IHdpbmRvd0ZhY2FkZS5hZGRXaW5kb3dDbG9zZUxpc3RlbmVyKCgpID0+IHtcblx0XHRcdFx0XHRtaW5pbWl6ZSgpXG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZW1vdmU6ICgpID0+IHtcblx0XHRcdHdpbmRvd0Nsb3NlVW5zdWJzY3JpYmUoKVxuXHRcdH0sXG5cdH1cblx0Y29uc3QgdGVtcGxhdGVQb3B1cE1vZGVsID1cblx0XHRsb2NhdG9yLmxvZ2lucy5pc0ludGVybmFsVXNlckxvZ2dlZEluKCkgJiYgY2xpZW50LmlzRGVza3RvcERldmljZSgpXG5cdFx0XHQ/IG5ldyBUZW1wbGF0ZVBvcHVwTW9kZWwobG9jYXRvci5ldmVudENvbnRyb2xsZXIsIGxvY2F0b3IubG9naW5zLCBsb2NhdG9yLmVudGl0eUNsaWVudClcblx0XHRcdDogbnVsbFxuXG5cdGNvbnN0IGNyZWF0ZUtub3dsZWRnZWJhc2VCdXR0b25BdHRycyA9IGFzeW5jIChlZGl0b3I6IEVkaXRvcikgPT4ge1xuXHRcdGlmIChsb2NhdG9yLmxvZ2lucy5pc0ludGVybmFsVXNlckxvZ2dlZEluKCkpIHtcblx0XHRcdGNvbnN0IGN1c3RvbWVyID0gYXdhaXQgbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5sb2FkQ3VzdG9tZXIoKVxuXHRcdFx0Ly8gb25seSBjcmVhdGUga25vd2xlZGdlYmFzZSBidXR0b24gZm9yIGludGVybmFsIHVzZXJzIHdpdGggdmFsaWQgdGVtcGxhdGUgZ3JvdXAgYW5kIGVuYWJsZWQgS25vd2xlZGdlYmFzZUZlYXR1cmVcblx0XHRcdGlmIChcblx0XHRcdFx0c3R5bGVzLmlzRGVza3RvcExheW91dCgpICYmXG5cdFx0XHRcdHRlbXBsYXRlUG9wdXBNb2RlbCAmJlxuXHRcdFx0XHRsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmdldFRlbXBsYXRlTWVtYmVyc2hpcHMoKS5sZW5ndGggPiAwICYmXG5cdFx0XHRcdGlzQ3VzdG9taXphdGlvbkVuYWJsZWRGb3JDdXN0b21lcihjdXN0b21lciwgRmVhdHVyZVR5cGUuS25vd2xlZGdlQmFzZSlcblx0XHRcdCkge1xuXHRcdFx0XHRjb25zdCBrbm93bGVkZ2ViYXNlTW9kZWwgPSBuZXcgS25vd2xlZGdlQmFzZU1vZGVsKGxvY2F0b3IuZXZlbnRDb250cm9sbGVyLCBsb2NhdG9yLmVudGl0eUNsaWVudCwgbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKSlcblx0XHRcdFx0YXdhaXQga25vd2xlZGdlYmFzZU1vZGVsLmluaXQoKVxuXG5cdFx0XHRcdC8vIG1ha2Ugc3VyZSB3ZSBkaXNwb3NlIGtub3dsZWRiYXNlTW9kZWwgb25jZSB0aGUgZWRpdG9yIGlzIGNsb3NlZFxuXHRcdFx0XHRkaXNwb3NhYmxlcy5wdXNoKGtub3dsZWRnZWJhc2VNb2RlbClcblxuXHRcdFx0XHRjb25zdCBrbm93bGVkZ2ViYXNlSW5qZWN0aW9uID0gY3JlYXRlS25vd2xlZGdlQmFzZURpYWxvZ0luamVjdGlvbihrbm93bGVkZ2ViYXNlTW9kZWwsIHRlbXBsYXRlUG9wdXBNb2RlbCwgZWRpdG9yKVxuXHRcdFx0XHRkaWFsb2cuc2V0SW5qZWN0aW9uUmlnaHQoa25vd2xlZGdlYmFzZUluamVjdGlvbilcblx0XHRcdFx0cmV0dXJuIGtub3dsZWRnZWJhc2VJbmplY3Rpb25cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG5cblx0bWFpbEVkaXRvckF0dHJzID0gY3JlYXRlTWFpbEVkaXRvckF0dHJzKFxuXHRcdG1vZGVsLFxuXHRcdGJsb2NrRXh0ZXJuYWxDb250ZW50LFxuXHRcdG1vZGVsLnRvUmVjaXBpZW50cygpLmxlbmd0aCAhPT0gMCxcblx0XHQoKSA9PiBkaWFsb2csXG5cdFx0dGVtcGxhdGVQb3B1cE1vZGVsLFxuXHRcdGNyZWF0ZUtub3dsZWRnZWJhc2VCdXR0b25BdHRycyxcblx0XHRhd2FpdCBsb2NhdG9yLnJlY2lwaWVudHNTZWFyY2hNb2RlbCgpLFxuXHRcdGFsd2F5c0Jsb2NrRXh0ZXJuYWxDb250ZW50LFxuXHQpXG5cdGNvbnN0IHNob3J0Y3V0czogU2hvcnRjdXRbXSA9IFtcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRtaW5pbWl6ZSgpXG5cdFx0XHR9LFxuXHRcdFx0aGVscDogXCJjbG9zZV9hbHRcIixcblx0XHR9LFxuXHRcdHtcblx0XHRcdGtleTogS2V5cy5TLFxuXHRcdFx0Y3RybE9yQ21kOiB0cnVlLFxuXHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRzYXZlKCkuY2F0Y2gob2ZDbGFzcyhVc2VyRXJyb3IsIHNob3dVc2VyRXJyb3IpKVxuXHRcdFx0fSxcblx0XHRcdGhlbHA6IFwic2F2ZV9hY3Rpb25cIixcblx0XHR9LFxuXHRcdHtcblx0XHRcdGtleTogS2V5cy5TLFxuXHRcdFx0Y3RybE9yQ21kOiB0cnVlLFxuXHRcdFx0c2hpZnQ6IHRydWUsXG5cdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdHNlbmQoKVxuXHRcdFx0fSxcblx0XHRcdGhlbHA6IFwic2VuZF9hY3Rpb25cIixcblx0XHR9LFxuXHRcdHtcblx0XHRcdGtleTogS2V5cy5SRVRVUk4sXG5cdFx0XHRjdHJsT3JDbWQ6IHRydWUsXG5cdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdHNlbmQoKVxuXHRcdFx0fSxcblx0XHRcdGhlbHA6IFwic2VuZF9hY3Rpb25cIixcblx0XHR9LFxuXHRdXG5cdGRpYWxvZyA9IERpYWxvZy5lZGl0RGlhbG9nKGhlYWRlckJhckF0dHJzLCBNYWlsRWRpdG9yLCBtYWlsRWRpdG9yQXR0cnMpXG5cdGRpYWxvZy5zZXRDbG9zZUhhbmRsZXIoKCkgPT4gbWluaW1pemUoKSlcblxuXHRmb3IgKGxldCBzaG9ydGN1dCBvZiBzaG9ydGN1dHMpIHtcblx0XHRkaWFsb2cuYWRkU2hvcnRjdXQoc2hvcnRjdXQpXG5cdH1cblxuXHRyZXR1cm4gZGlhbG9nXG59XG5cbi8qKlxuICogb3BlbiBhIE1haWxFZGl0b3JcbiAqIEBwYXJhbSBtYWlsYm94RGV0YWlscyBkZXRhaWxzIHRvIHVzZSB3aGVuIHNlbmRpbmcgYW4gZW1haWxcbiAqIEByZXR1cm5zIHsqfVxuICogQHByaXZhdGVcbiAqIEB0aHJvd3MgUGVybWlzc2lvbkVycm9yXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBuZXdNYWlsRWRpdG9yKG1haWxib3hEZXRhaWxzOiBNYWlsYm94RGV0YWlsKTogUHJvbWlzZTxEaWFsb2c+IHtcblx0Ly8gV2UgY2hlY2sgYXBwcm92YWwgc3RhdHVzIHNvIGFzIHRvIGdldCBhIGRpYWxvZyBpbmZvcm1pbmcgdGhlIHVzZXIgdGhhdCB0aGV5IGNhbm5vdCBzZW5kIG1haWxzXG5cdC8vIGJ1dCB3ZSBzdGlsbCB3YW50IHRvIG9wZW4gdGhlIG1haWwgZWRpdG9yIGJlY2F1c2UgdGhleSBzaG91bGQgc3RpbGwgYmUgYWJsZSB0byBjb250YWN0IHNhbGVzQHR1dGFvLmRlXG5cdGF3YWl0IGNoZWNrQXBwcm92YWxTdGF0dXMobG9jYXRvci5sb2dpbnMsIGZhbHNlKVxuXHRjb25zdCB7IGFwcGVuZEVtYWlsU2lnbmF0dXJlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9zaWduYXR1cmUvU2lnbmF0dXJlXCIpXG5cdGNvbnN0IHNpZ25hdHVyZSA9IGFwcGVuZEVtYWlsU2lnbmF0dXJlKFwiXCIsIGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkucHJvcHMpXG5cdGNvbnN0IGRldGFpbHNQcm9wZXJ0aWVzID0gYXdhaXQgZ2V0TWFpbGJveERldGFpbHNBbmRQcm9wZXJ0aWVzKG1haWxib3hEZXRhaWxzKVxuXHRyZXR1cm4gbmV3TWFpbEVkaXRvckZyb21UZW1wbGF0ZShkZXRhaWxzUHJvcGVydGllcy5tYWlsYm94RGV0YWlscywge30sIFwiXCIsIHNpZ25hdHVyZSlcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0RXh0ZXJuYWxDb250ZW50UnVsZXNGb3JFZGl0b3IobW9kZWw6IFNlbmRNYWlsTW9kZWwsIGN1cnJlbnRTdGF0dXM6IGJvb2xlYW4pIHtcblx0bGV0IGNvbnRlbnRSdWxlc1xuXHRjb25zdCBwcmV2aW91c01haWwgPSBtb2RlbC5nZXRQcmV2aW91c01haWwoKVxuXG5cdGlmICghcHJldmlvdXNNYWlsKSB7XG5cdFx0Y29udGVudFJ1bGVzID0ge1xuXHRcdFx0YWx3YXlzQmxvY2tFeHRlcm5hbENvbnRlbnQ6IGZhbHNlLFxuXHRcdFx0Ly8gZXh0ZXJuYWwgY29udGVudCBpbiBhIG1haWwgZm9yIHdoaWNoIHdlIGRvbid0IGhhdmUgYVxuXHRcdFx0Ly8gcHJldmlvdXMgbWFpbCBtdXN0IGhhdmUgYmVlbiBwdXQgdGhlcmUgYnkgdXMuXG5cdFx0XHRibG9ja0V4dGVybmFsQ29udGVudDogZmFsc2UsXG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGNvbnN0IGV4dGVybmFsSW1hZ2VSdWxlID0gYXdhaXQgbG9jYXRvci5jb25maWdGYWNhZGUuZ2V0RXh0ZXJuYWxJbWFnZVJ1bGUocHJldmlvdXNNYWlsLnNlbmRlci5hZGRyZXNzKS5jYXRjaCgoZTogdW5rbm93bikgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coXCJFcnJvciBnZXR0aW5nIGV4dGVybmFsIGltYWdlIHJ1bGU6XCIsIGUpXG5cdFx0XHRyZXR1cm4gRXh0ZXJuYWxJbWFnZVJ1bGUuTm9uZVxuXHRcdH0pXG5cblx0XHRsZXQgaXNBdXRoZW50aWNhdGVkTWFpbFxuXHRcdGlmIChwcmV2aW91c01haWwuYXV0aFN0YXR1cyAhPT0gbnVsbCkge1xuXHRcdFx0aXNBdXRoZW50aWNhdGVkTWFpbCA9IHByZXZpb3VzTWFpbC5hdXRoU3RhdHVzID09PSBNYWlsQXV0aGVudGljYXRpb25TdGF0dXMuQVVUSEVOVElDQVRFRFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBtYWlsRGV0YWlscyA9IGF3YWl0IGxvY2F0b3IubWFpbEZhY2FkZS5sb2FkTWFpbERldGFpbHNCbG9iKHByZXZpb3VzTWFpbClcblx0XHRcdGlzQXV0aGVudGljYXRlZE1haWwgPSBtYWlsRGV0YWlscy5hdXRoU3RhdHVzID09PSBNYWlsQXV0aGVudGljYXRpb25TdGF0dXMuQVVUSEVOVElDQVRFRFxuXHRcdH1cblxuXHRcdGlmIChleHRlcm5hbEltYWdlUnVsZSA9PT0gRXh0ZXJuYWxJbWFnZVJ1bGUuQmxvY2sgfHwgKGV4dGVybmFsSW1hZ2VSdWxlID09PSBFeHRlcm5hbEltYWdlUnVsZS5Ob25lICYmIG1vZGVsLmlzVXNlclByZXZpb3VzU2VuZGVyKCkpKSB7XG5cdFx0XHRjb250ZW50UnVsZXMgPSB7XG5cdFx0XHRcdC8vIFdoZW4gd2UgaGF2ZSBhbiBleHBsaWNpdCBydWxlIGZvciBibG9ja2luZyBpbWFnZXMgd2UgZG9uwrR0XG5cdFx0XHRcdC8vIHdhbnQgdG8gcHJvbXB0IHRoZSB1c2VyIGFib3V0IHNob3dpbmcgaW1hZ2VzIGFnYWluXG5cdFx0XHRcdGFsd2F5c0Jsb2NrRXh0ZXJuYWxDb250ZW50OiBleHRlcm5hbEltYWdlUnVsZSA9PT0gRXh0ZXJuYWxJbWFnZVJ1bGUuQmxvY2ssXG5cdFx0XHRcdGJsb2NrRXh0ZXJuYWxDb250ZW50OiB0cnVlLFxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoZXh0ZXJuYWxJbWFnZVJ1bGUgPT09IEV4dGVybmFsSW1hZ2VSdWxlLkFsbG93ICYmIGlzQXV0aGVudGljYXRlZE1haWwpIHtcblx0XHRcdGNvbnRlbnRSdWxlcyA9IHtcblx0XHRcdFx0YWx3YXlzQmxvY2tFeHRlcm5hbENvbnRlbnQ6IGZhbHNlLFxuXHRcdFx0XHRibG9ja0V4dGVybmFsQ29udGVudDogZmFsc2UsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnRlbnRSdWxlcyA9IHtcblx0XHRcdFx0YWx3YXlzQmxvY2tFeHRlcm5hbENvbnRlbnQ6IGZhbHNlLFxuXHRcdFx0XHRibG9ja0V4dGVybmFsQ29udGVudDogY3VycmVudFN0YXR1cyxcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gY29udGVudFJ1bGVzXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBuZXdNYWlsRWRpdG9yQXNSZXNwb25zZShcblx0YXJnczogSW5pdEFzUmVzcG9uc2VBcmdzLFxuXHRibG9ja0V4dGVybmFsQ29udGVudDogYm9vbGVhbixcblx0aW5saW5lSW1hZ2VzOiBJbmxpbmVJbWFnZXMsXG5cdG1haWxib3hEZXRhaWxzPzogTWFpbGJveERldGFpbCxcbik6IFByb21pc2U8RGlhbG9nPiB7XG5cdGNvbnN0IGRldGFpbHNQcm9wZXJ0aWVzID0gYXdhaXQgZ2V0TWFpbGJveERldGFpbHNBbmRQcm9wZXJ0aWVzKG1haWxib3hEZXRhaWxzKVxuXHRjb25zdCBtb2RlbCA9IGF3YWl0IGxvY2F0b3Iuc2VuZE1haWxNb2RlbChkZXRhaWxzUHJvcGVydGllcy5tYWlsYm94RGV0YWlscywgZGV0YWlsc1Byb3BlcnRpZXMubWFpbGJveFByb3BlcnRpZXMpXG5cdGF3YWl0IG1vZGVsLmluaXRBc1Jlc3BvbnNlKGFyZ3MsIGlubGluZUltYWdlcylcblxuXHRjb25zdCBleHRlcm5hbEltYWdlUnVsZXMgPSBhd2FpdCBnZXRFeHRlcm5hbENvbnRlbnRSdWxlc0ZvckVkaXRvcihtb2RlbCwgYmxvY2tFeHRlcm5hbENvbnRlbnQpXG5cdHJldHVybiBjcmVhdGVNYWlsRWRpdG9yRGlhbG9nKG1vZGVsLCBleHRlcm5hbEltYWdlUnVsZXM/LmJsb2NrRXh0ZXJuYWxDb250ZW50LCBleHRlcm5hbEltYWdlUnVsZXM/LmFsd2F5c0Jsb2NrRXh0ZXJuYWxDb250ZW50KVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbmV3TWFpbEVkaXRvckZyb21EcmFmdChcblx0bWFpbDogTWFpbCxcblx0bWFpbERldGFpbHM6IE1haWxEZXRhaWxzLFxuXHRhdHRhY2htZW50czogVHV0YW5vdGFGaWxlW10sXG5cdGlubGluZUltYWdlczogSW5saW5lSW1hZ2VzLFxuXHRibG9ja0V4dGVybmFsQ29udGVudDogYm9vbGVhbixcblx0bWFpbGJveERldGFpbHM/OiBNYWlsYm94RGV0YWlsLFxuKTogUHJvbWlzZTxEaWFsb2c+IHtcblx0Y29uc3QgZGV0YWlsc1Byb3BlcnRpZXMgPSBhd2FpdCBnZXRNYWlsYm94RGV0YWlsc0FuZFByb3BlcnRpZXMobWFpbGJveERldGFpbHMpXG5cdGNvbnN0IG1vZGVsID0gYXdhaXQgbG9jYXRvci5zZW5kTWFpbE1vZGVsKGRldGFpbHNQcm9wZXJ0aWVzLm1haWxib3hEZXRhaWxzLCBkZXRhaWxzUHJvcGVydGllcy5tYWlsYm94UHJvcGVydGllcylcblx0YXdhaXQgbW9kZWwuaW5pdFdpdGhEcmFmdChtYWlsLCBtYWlsRGV0YWlscywgYXR0YWNobWVudHMsIGlubGluZUltYWdlcylcblx0Y29uc3QgZXh0ZXJuYWxJbWFnZVJ1bGVzID0gYXdhaXQgZ2V0RXh0ZXJuYWxDb250ZW50UnVsZXNGb3JFZGl0b3IobW9kZWwsIGJsb2NrRXh0ZXJuYWxDb250ZW50KVxuXHRyZXR1cm4gY3JlYXRlTWFpbEVkaXRvckRpYWxvZyhtb2RlbCwgZXh0ZXJuYWxJbWFnZVJ1bGVzPy5ibG9ja0V4dGVybmFsQ29udGVudCwgZXh0ZXJuYWxJbWFnZVJ1bGVzPy5hbHdheXNCbG9ja0V4dGVybmFsQ29udGVudClcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG5ld01haWx0b1VybE1haWxFZGl0b3IobWFpbHRvVXJsOiBzdHJpbmcsIGNvbmZpZGVudGlhbDogYm9vbGVhbiwgbWFpbGJveERldGFpbHM/OiBNYWlsYm94RGV0YWlsKTogUHJvbWlzZTxEaWFsb2c+IHtcblx0Y29uc3QgZGV0YWlsc1Byb3BlcnRpZXMgPSBhd2FpdCBnZXRNYWlsYm94RGV0YWlsc0FuZFByb3BlcnRpZXMobWFpbGJveERldGFpbHMpXG5cdGNvbnN0IG1haWxUbyA9IHBhcnNlTWFpbHRvVXJsKG1haWx0b1VybClcblx0bGV0IGRhdGFGaWxlczogQXR0YWNobWVudFtdID0gW11cblxuXHRpZiAobWFpbFRvLmF0dGFjaCkge1xuXHRcdGNvbnN0IGF0dGFjaCA9IG1haWxUby5hdHRhY2hcblxuXHRcdGlmIChpc0Rlc2t0b3AoKSkge1xuXHRcdFx0Y29uc3QgZmlsZXMgPSBhd2FpdCBQcm9taXNlLmFsbChhdHRhY2gubWFwKCh1cmkpID0+IGxvY2F0b3IuZmlsZUFwcC5yZWFkRGF0YUZpbGUodXJpKSkpXG5cdFx0XHRkYXRhRmlsZXMgPSBmaWxlcy5maWx0ZXIoaXNOb3ROdWxsKVxuXHRcdH1cblx0XHQvLyBtYWtlIHN1cmUgdGhlIHVzZXIgaXMgYXdhcmUgdGhhdCAoYW5kIHdoaWNoKSBmaWxlcyBoYXZlIGJlZW4gYXR0YWNoZWRcblx0XHRjb25zdCBrZWVwQXR0YWNobWVudHMgPVxuXHRcdFx0ZGF0YUZpbGVzLmxlbmd0aCA9PT0gMCB8fFxuXHRcdFx0KGF3YWl0IERpYWxvZy5jb25maXJtKFwiYXR0YWNobWVudFdhcm5pbmdfbXNnXCIsIFwiYXR0YWNoRmlsZXNfYWN0aW9uXCIsICgpID0+XG5cdFx0XHRcdGRhdGFGaWxlcy5tYXAoKGRmLCBpKSA9PlxuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcIi50ZXh0LWJyZWFrLnNlbGVjdGFibGUubXQteHNcIixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0dGl0bGU6IGF0dGFjaFtpXSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRkZi5uYW1lLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdCksXG5cdFx0XHQpKVxuXG5cdFx0aWYgKGtlZXBBdHRhY2htZW50cykge1xuXHRcdFx0Y29uc3Qgc2l6ZUNoZWNrUmVzdWx0ID0gY2hlY2tBdHRhY2htZW50U2l6ZShkYXRhRmlsZXMpXG5cdFx0XHRkYXRhRmlsZXMgPSBzaXplQ2hlY2tSZXN1bHQuYXR0YWNoYWJsZUZpbGVzXG5cblx0XHRcdGlmIChzaXplQ2hlY2tSZXN1bHQudG9vQmlnRmlsZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRhd2FpdCBEaWFsb2cubWVzc2FnZShcInRvb0JpZ0F0dGFjaG1lbnRfbXNnXCIsICgpID0+IHNpemVDaGVja1Jlc3VsdC50b29CaWdGaWxlcy5tYXAoKGZpbGUpID0+IG0oXCIudGV4dC1icmVhay5zZWxlY3RhYmxlXCIsIGZpbGUpKSlcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IENhbmNlbGxlZEVycm9yKFwidXNlciBjYW5jZWxsZWQgb3BlbmluZyBtYWlsIGVkaXRvciB3aXRoIGF0dGFjaG1lbnRzXCIpXG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIG5ld01haWxFZGl0b3JGcm9tVGVtcGxhdGUoXG5cdFx0ZGV0YWlsc1Byb3BlcnRpZXMubWFpbGJveERldGFpbHMsXG5cdFx0bWFpbFRvLnJlY2lwaWVudHMsXG5cdFx0bWFpbFRvLnN1YmplY3QgfHwgXCJcIixcblx0XHRhcHBlbmRFbWFpbFNpZ25hdHVyZShtYWlsVG8uYm9keSB8fCBcIlwiLCBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnByb3BzKSxcblx0XHRkYXRhRmlsZXMsXG5cdFx0Y29uZmlkZW50aWFsLFxuXHRcdHVuZGVmaW5lZCxcblx0XHR0cnVlLCAvLyBlbWFpbHMgY3JlYXRlZCB3aXRoIG1haWx0byBzaG91bGQgYWx3YXlzIHNhdmUgYXMgZHJhZnRcblx0KVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbmV3TWFpbEVkaXRvckZyb21UZW1wbGF0ZShcblx0bWFpbGJveERldGFpbHM6IE1haWxib3hEZXRhaWwsXG5cdHJlY2lwaWVudHM6IFJlY2lwaWVudHMsXG5cdHN1YmplY3Q6IHN0cmluZyxcblx0Ym9keVRleHQ6IHN0cmluZyxcblx0YXR0YWNobWVudHM/OiBSZWFkb25seUFycmF5PEF0dGFjaG1lbnQ+LFxuXHRjb25maWRlbnRpYWw/OiBib29sZWFuLFxuXHRzZW5kZXJNYWlsQWRkcmVzcz86IHN0cmluZyxcblx0aW5pdGlhbENoYW5nZWRTdGF0ZT86IGJvb2xlYW4sXG4pOiBQcm9taXNlPERpYWxvZz4ge1xuXHRjb25zdCBtYWlsYm94UHJvcGVydGllcyA9IGF3YWl0IGxvY2F0b3IubWFpbGJveE1vZGVsLmdldE1haWxib3hQcm9wZXJ0aWVzKG1haWxib3hEZXRhaWxzLm1haWxib3hHcm91cFJvb3QpXG5cdHJldHVybiBsb2NhdG9yXG5cdFx0LnNlbmRNYWlsTW9kZWwobWFpbGJveERldGFpbHMsIG1haWxib3hQcm9wZXJ0aWVzKVxuXHRcdC50aGVuKChtb2RlbCkgPT4gbW9kZWwuaW5pdFdpdGhUZW1wbGF0ZShyZWNpcGllbnRzLCBzdWJqZWN0LCBib2R5VGV4dCwgYXR0YWNobWVudHMsIGNvbmZpZGVudGlhbCwgc2VuZGVyTWFpbEFkZHJlc3MsIGluaXRpYWxDaGFuZ2VkU3RhdGUpKVxuXHRcdC50aGVuKChtb2RlbCkgPT4gY3JlYXRlTWFpbEVkaXRvckRpYWxvZyhtb2RlbCkpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdXBwb3J0TWFpbFNpZ25hdHVyZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRyZXR1cm4gaW1wb3J0KFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlsc1wiKS50aGVuKCh7IGdldFRpbWVab25lIH0pID0+IHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0TElORV9CUkVBSyArXG5cdFx0XHRMSU5FX0JSRUFLICtcblx0XHRcdFwiLS1cIiArXG5cdFx0XHRgPGJyPkNsaWVudDogJHtjbGllbnQuZ2V0SWRlbnRpZmllcigpfWAgK1xuXHRcdFx0YDxicj5UdXRhbm90YSB2ZXJzaW9uOiAke2Vudi52ZXJzaW9uTnVtYmVyfWAgK1xuXHRcdFx0YDxicj5UaW1lIHpvbmU6ICR7Z2V0VGltZVpvbmUoKX1gICtcblx0XHRcdGA8YnI+VXNlciBhZ2VudDo8YnI+ICR7bmF2aWdhdG9yLnVzZXJBZ2VudH1gXG5cdFx0KVxuXHR9KVxufVxuXG4vKipcbiAqIENyZWF0ZSBhbmQgc2hvdyBhIG5ldyBtYWlsIGVkaXRvciB3aXRoIGEgc3VwcG9ydCBxdWVyeSwgYWRkcmVzc2VkIHRvIHByZW1pdW0gc3VwcG9ydCxcbiAqIG9yIHNob3cgYW4gb3B0aW9uIHRvIHVwZ3JhZGVcbiAqIEBwYXJhbSBzdWJqZWN0XG4gKiBAcGFyYW0gbWFpbGJveERldGFpbHNcbiAqIEByZXR1cm5zIHRydWUgaWYgc2VuZGluZyBzdXBwb3J0IGVtYWlsIGlzIGFsbG93ZWQsIGZhbHNlIGlmIHVwZ3JhZGUgdG8gcHJlbWl1bSBpcyByZXF1aXJlZCAobWF5IGhhdmUgYmVlbiBvcmRlcmVkKVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVTdXBwb3J0TWFpbChzdWJqZWN0OiBzdHJpbmcgPSBcIlwiLCBtYWlsYm94RGV0YWlscz86IE1haWxib3hEZXRhaWwpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0aWYgKGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuaXNQcmVtaXVtQWNjb3VudCgpKSB7XG5cdFx0Y29uc3QgZGV0YWlsc1Byb3BlcnRpZXMgPSBhd2FpdCBnZXRNYWlsYm94RGV0YWlsc0FuZFByb3BlcnRpZXMobWFpbGJveERldGFpbHMpXG5cdFx0Y29uc3QgcmVjaXBpZW50cyA9IHtcblx0XHRcdHRvOiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRuYW1lOiBudWxsLFxuXHRcdFx0XHRcdGFkZHJlc3M6IFwicHJlbWl1bUB0dXRhby5kZVwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0XSxcblx0XHR9XG5cdFx0Y29uc3Qgc2lnbmF0dXJlID0gYXdhaXQgZ2V0U3VwcG9ydE1haWxTaWduYXR1cmUoKVxuXHRcdGNvbnN0IGRpYWxvZyA9IGF3YWl0IG5ld01haWxFZGl0b3JGcm9tVGVtcGxhdGUoZGV0YWlsc1Byb3BlcnRpZXMubWFpbGJveERldGFpbHMsIHJlY2lwaWVudHMsIHN1YmplY3QsIHNpZ25hdHVyZSlcblx0XHRkaWFsb2cuc2hvdygpXG5cdFx0cmV0dXJuIHRydWVcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gaW1wb3J0KFwiLi4vLi4vLi4vY29tbW9uL3N1YnNjcmlwdGlvbi9QcmljZVV0aWxzXCIpXG5cdFx0XHQudGhlbigoeyBmb3JtYXRQcmljZSB9KSA9PiB7XG5cdFx0XHRcdGNvbnN0IG1lc3NhZ2UgPSBsYW5nLmdldChcInByZW1pdW1PZmZlcl9tc2dcIiwge1xuXHRcdFx0XHRcdFwiezF9XCI6IGZvcm1hdFByaWNlKDEsIHRydWUpLFxuXHRcdFx0XHR9KVxuXHRcdFx0XHRjb25zdCB0aXRsZSA9IGxhbmcuZ2V0KFwidXBncmFkZVJlbWluZGVyVGl0bGVfbXNnXCIpXG5cdFx0XHRcdHJldHVybiBEaWFsb2cucmVtaW5kZXIodGl0bGUsIG1lc3NhZ2UpXG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oKGNvbmZpcm0pID0+IHtcblx0XHRcdFx0aWYgKGNvbmZpcm0pIHtcblx0XHRcdFx0XHRpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vc3Vic2NyaXB0aW9uL1VwZ3JhZGVTdWJzY3JpcHRpb25XaXphcmRcIikudGhlbigodXRpbHMpID0+IHV0aWxzLnNob3dVcGdyYWRlV2l6YXJkKGxvY2F0b3IubG9naW5zKSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC50aGVuKCgpID0+IGZhbHNlKVxuXHR9XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuZCBzaG93IGEgbmV3IG1haWwgZWRpdG9yIHdpdGggYW4gaW52aXRlIG1lc3NhZ2VcbiAqIEBwYXJhbSByZWZlcnJhbExpbmtcbiAqIEByZXR1cm5zIHsqfVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVJbnZpdGVNYWlsKHJlZmVycmFsTGluazogc3RyaW5nKSB7XG5cdGNvbnN0IGRldGFpbHNQcm9wZXJ0aWVzID0gYXdhaXQgZ2V0TWFpbGJveERldGFpbHNBbmRQcm9wZXJ0aWVzKG51bGwpXG5cdGNvbnN0IHVzZXJuYW1lID0gbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyR3JvdXBJbmZvLm5hbWVcblx0Y29uc3QgYm9keSA9IGxhbmcuZ2V0KFwiaW52aXRhdGlvbk1haWxCb2R5X21zZ1wiLCB7XG5cdFx0XCJ7cmVnaXN0cmF0aW9uTGlua31cIjogcmVmZXJyYWxMaW5rLFxuXHRcdFwie3VzZXJuYW1lfVwiOiB1c2VybmFtZSxcblx0fSlcblx0Y29uc3QgeyBpbnZpdGF0aW9uU3ViamVjdCB9ID0gYXdhaXQgbG9jYXRvci5zZXJ2aWNlRXhlY3V0b3IuZ2V0KFRyYW5zbGF0aW9uU2VydmljZSwgY3JlYXRlVHJhbnNsYXRpb25HZXRJbih7IGxhbmc6IGxhbmcuY29kZSB9KSlcblx0Y29uc3QgZGlhbG9nID0gYXdhaXQgbmV3TWFpbEVkaXRvckZyb21UZW1wbGF0ZShkZXRhaWxzUHJvcGVydGllcy5tYWlsYm94RGV0YWlscywge30sIGludml0YXRpb25TdWJqZWN0LCBib2R5LCBbXSwgZmFsc2UpXG5cdGRpYWxvZy5zaG93KClcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW5kIHNob3cgYSBuZXcgbWFpbCBlZGl0b3Igd2l0aCBhbiBpbnZpdGUgbWVzc2FnZVxuICogQHBhcmFtIGxpbmsgdGhlIGxpbmsgdG8gdGhlIGdpZnRjYXJkXG4gKiBAcGFyYW0gbWFpbGJveERldGFpbHNcbiAqIEByZXR1cm5zIHsqfVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVHaWZ0Q2FyZE1haWwobGluazogc3RyaW5nLCBtYWlsYm94RGV0YWlscz86IE1haWxib3hEZXRhaWwpIHtcblx0Y29uc3QgZGV0YWlsc1Byb3BlcnRpZXMgPSBhd2FpdCBnZXRNYWlsYm94RGV0YWlsc0FuZFByb3BlcnRpZXMobWFpbGJveERldGFpbHMpXG5cdGNvbnN0IGJvZHlUZXh0ID0gbGFuZ1xuXHRcdC5nZXQoXCJkZWZhdWx0U2hhcmVHaWZ0Q2FyZEJvZHlfbXNnXCIsIHtcblx0XHRcdFwie2xpbmt9XCI6ICc8YSBocmVmPVwiJyArIGxpbmsgKyAnXCI+JyArIGxpbmsgKyBcIjwvYT5cIixcblx0XHRcdFwie3VzZXJuYW1lfVwiOiBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJHcm91cEluZm8ubmFtZSxcblx0XHR9KVxuXHRcdC5zcGxpdChcIlxcblwiKVxuXHRcdC5qb2luKFwiPGJyIC8+XCIpXG5cdGNvbnN0IHsgZ2lmdENhcmRTdWJqZWN0IH0gPSBhd2FpdCBsb2NhdG9yLnNlcnZpY2VFeGVjdXRvci5nZXQoVHJhbnNsYXRpb25TZXJ2aWNlLCBjcmVhdGVUcmFuc2xhdGlvbkdldEluKHsgbGFuZzogbGFuZy5jb2RlIH0pKVxuXHRsb2NhdG9yXG5cdFx0LnNlbmRNYWlsTW9kZWwoZGV0YWlsc1Byb3BlcnRpZXMubWFpbGJveERldGFpbHMsIGRldGFpbHNQcm9wZXJ0aWVzLm1haWxib3hQcm9wZXJ0aWVzKVxuXHRcdC50aGVuKChtb2RlbCkgPT4gbW9kZWwuaW5pdFdpdGhUZW1wbGF0ZSh7fSwgZ2lmdENhcmRTdWJqZWN0LCBhcHBlbmRFbWFpbFNpZ25hdHVyZShib2R5VGV4dCwgbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5wcm9wcyksIFtdLCBmYWxzZSkpXG5cdFx0LnRoZW4oKG1vZGVsKSA9PiBjcmVhdGVNYWlsRWRpdG9yRGlhbG9nKG1vZGVsLCBmYWxzZSkpXG5cdFx0LnRoZW4oKGRpYWxvZykgPT4gZGlhbG9nLnNob3coKSlcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0TWFpbGJveERldGFpbHNBbmRQcm9wZXJ0aWVzKFxuXHRtYWlsYm94RGV0YWlsczogTWFpbGJveERldGFpbCB8IG51bGwgfCB1bmRlZmluZWQsXG4pOiBQcm9taXNlPHsgbWFpbGJveERldGFpbHM6IE1haWxib3hEZXRhaWw7IG1haWxib3hQcm9wZXJ0aWVzOiBNYWlsYm94UHJvcGVydGllcyB9PiB7XG5cdG1haWxib3hEZXRhaWxzID0gbWFpbGJveERldGFpbHMgPz8gKGF3YWl0IGxvY2F0b3IubWFpbGJveE1vZGVsLmdldFVzZXJNYWlsYm94RGV0YWlscygpKVxuXHRjb25zdCBtYWlsYm94UHJvcGVydGllcyA9IGF3YWl0IGxvY2F0b3IubWFpbGJveE1vZGVsLmdldE1haWxib3hQcm9wZXJ0aWVzKG1haWxib3hEZXRhaWxzLm1haWxib3hHcm91cFJvb3QpXG5cdHJldHVybiB7IG1haWxib3hEZXRhaWxzLCBtYWlsYm94UHJvcGVydGllcyB9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJPLGVBQWUsb0JBQ3JCQSxPQUNBQyxjQUNBQyxXQUMwRDtBQUMxRCxjQUFhLFNBQVMsS0FBSyxNQUFNLGFBQWEsT0FBTztBQUNyRCxjQUFhLFFBQVEsS0FBSyxNQUFNLGFBQWEsTUFBTTtBQUNuRCxjQUFhLElBQUksS0FBSyxNQUFNLGFBQWEsRUFBRTtBQUMzQyxjQUFhLElBQUksS0FBSyxNQUFNLGFBQWEsRUFBRTtBQUMzQyxLQUFJO0VBQ0gsTUFBTSxRQUFRLE1BQU0sOEJBQThCLGNBQWMsVUFBVTtBQUMxRSxPQUFLLFNBQVMsTUFBTSxXQUFXLEVBQUc7QUFDbEMsVUFBUSxJQUFJLE1BQVo7QUFDQyxRQUFLLEtBQUs7QUFFVCxVQUFNLFlBQVksTUFBTTtBQUN4QixXQUFPO0FBQ1IsUUFBSyxLQUFLLFNBQVM7SUFFbEIsTUFBTUMsWUFBNkIsQ0FDbEMsTUFBTSxRQUFRLElBQUksQUFBQyxNQUErQixJQUFJLE9BQU8sTUFBTSxRQUFRLFFBQVEsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDLEVBQzVHLE9BQU8sVUFBVTtBQUNuQixVQUFNLFlBQVksVUFBVTtBQUM1QixXQUFPO0dBQ1A7QUFDRDtBQUVDLFVBQU0sWUFBWSxNQUFNO0FBQ3hCLFdBQU87RUFDUjtDQUNELFNBQVEsR0FBRztBQUNYLE1BQUksYUFBYSxVQUNoQixPQUFNLGNBQWMsRUFBRTtLQUNoQjtHQUNOLE1BQU0sTUFBTSxFQUFFLFdBQVc7QUFDekIsV0FBUSxNQUFNLDJCQUEyQixJQUFJO0VBQzdDO0NBQ0Q7QUFDRDtBQUVNLFNBQVMsOEJBQThCRixjQUEwQkMsV0FBb0Y7Q0FDM0osTUFBTSxlQUFlLENBQUMsS0FBSyxLQUFLLEtBQUssT0FBUSxFQUFDLFNBQVMsSUFBSSxLQUFLLEdBQzdELFFBQVEsUUFBUSxnQkFBZ0IsY0FBYyxVQUFVLEdBQ3hELGdCQUFnQixNQUFNLFVBQVU7QUFDbkMsUUFBTyxhQUNMLE1BQ0EsUUFBUSxpQkFBaUIsTUFBTTtBQUM5QixTQUFPLFFBQVEsNkJBQTZCO0NBQzVDLEVBQUMsQ0FDRixDQUNBLE1BQ0EsUUFBUSxtQkFBbUIsTUFBTTtBQUNoQyxTQUFPLFFBQVEseUJBQXlCO0NBQ3hDLEVBQUMsQ0FDRjtBQUNGO0FBRU0sU0FBUyw0QkFBNEJGLE9BQXNCSSxxQkFBdUU7QUFDeEksUUFBTyxNQUFNLGdCQUFnQixDQUFDLElBQUksQ0FBQyxnQkFBZ0I7RUFDbEQ7RUFDQSxNQUFNO0VBQ04sVUFBVSxNQUFNLG9CQUFvQixXQUFXO0VBQy9DLFFBQVEsTUFBTTtBQUNiLFNBQU0saUJBQWlCLFdBQVc7QUFHbEMsT0FBSSxXQUFXLEtBQUs7SUFDbkIsTUFBTSxlQUFlLG9CQUFvQixLQUFLLENBQUMsTUFBTSxFQUFFLGFBQWEsTUFBTSxLQUFLLFdBQVcsSUFBSTtBQUU5RixRQUFJLGNBQWM7QUFDakIsa0JBQWEsUUFBUTtBQUNyQixZQUFPLHFCQUFxQixhQUFhO0lBQ3pDO0dBQ0Q7QUFFRCxtQkFBRSxRQUFRO0VBQ1Y7RUFDRCxZQUFZO0VBQ1osTUFBTSxlQUFlO0NBQ3JCLEdBQUU7QUFDSDtBQUVELGVBQWUsb0JBQW9CQyxZQUF3QjtBQUMxRCxLQUFJO0FBQ0gsTUFBSSxnQkFBZ0IsV0FBVyxDQUM5QixPQUFNLFFBQVEsUUFBUSxLQUFLLFdBQVc7U0FDNUIsV0FBVyxXQUFXLENBQ2hDLE9BQU0sUUFBUSxlQUFlLGFBQWEsV0FBVztTQUMzQyxlQUFlLFdBQVcsQ0FDcEMsT0FBTSxRQUFRLGVBQWUsU0FBUyxXQUFXO0lBRWpELE9BQU0sSUFBSSxpQkFBaUI7Q0FFNUIsU0FBUSxHQUFHO0FBQ1gsTUFBSSxhQUFhLGNBQ2hCLFFBQU8sT0FBTyxRQUFRLDZCQUE2QjtLQUM3QztHQUNOLE1BQU0sTUFBTSxFQUFFLFdBQVc7QUFDekIsV0FBUSxNQUFNLHdCQUF3QixJQUFJO0FBQzFDLFVBQU8sT0FBTyxRQUFRLDBCQUEwQjtFQUNoRDtDQUNEO0FBQ0Q7TUFFWUMsMkJBQTJHLFNBQ3ZILElBQ0EsQ0FBQ0MsWUFBeUJILHFCQUF5Q0ksZ0JBQW1DO0NBWXJHLE1BQU1DLG1CQUFrQyxDQUFFO0FBQzFDLE1BQUssTUFBTSxlQUFlLG9CQUN6QixLQUFJLGVBQWUsV0FBVyxTQUFTLFlBQVksRUFBRTtFQUNwRCxNQUFNLE1BQU0sWUFBWSxhQUFhLE1BQU07RUFDM0MsTUFBTSxrQkFBa0IsWUFBWSxVQUFVLENBQUMsTUFBTSxFQUFFLFFBQVEsSUFBSTtBQUVuRSxNQUFJLG9CQUFvQixJQUFJO0FBQzNCLGVBQVksT0FBTyxpQkFBaUIsRUFBRTtBQUN0QyxvQkFBaUIsS0FBSyxZQUFZO0FBQ2xDLG1CQUFFLFFBQVE7RUFDVjtDQUNEO0FBRUYsa0JBQWlCLHFCQUFxQixDQUFDLGlCQUFpQixpQkFBaUIsU0FBUyxhQUFhLENBQUM7QUFDaEcsRUFDRDtBQUVNLFNBQVMsNEJBQTRCQyxnQkFBaUM7QUFDNUUsUUFBTyxpQkFBaUIsS0FBSyxJQUFJLHlCQUF5QixHQUFHLEtBQUssSUFBSSw0QkFBNEI7QUFDbEc7Ozs7TUM1Slksd0JBQXdCO01BQ3hCLHNDQUFzQztNQUN0Qyw2QkFBNkI7TUFDN0IsNEJBQTRCOzs7O0lDVTVCLHlCQUFOLE1BQTBFO0NBQ2hGLEtBQUtDLE9BQWdEO0VBQ3BELE1BQU0sRUFBRSxPQUFPLEtBQUssR0FBRyxNQUFNLE1BQU07QUFDbkMsU0FBTyxnQkFDTixxREFDQTtHQUNDLE9BQU8sRUFDTixRQUFRLEdBQUcsMkJBQTJCLENBQ3RDO0dBRU07RUFDUCxHQUNELENBRUMsZ0JBQ0MsMEJBQ0EsRUFDQyxPQUFPLEVBQ04sWUFBWSxNQUNaLEVBQ0QsR0FDRCxNQUNBLEVBQ0QsZ0JBQUUseUNBQXlDLENBQzFDLE1BQ0csZ0JBQUUsc0ZBQXNGLDJCQUEyQixJQUFJLGFBQWEsQ0FBQyxHQUNySSxJQUNILEVBQUMsQUFDRixFQUNEO0NBQ0Q7QUFDRDs7OztJQ3hCWSxtQkFBTixNQUFtRTtDQUN6RSxBQUFpQixnQkFBZ0IsU0FDaEMsQ0FBQ0MsU0FDQSxjQUFjLGFBQWEsTUFBTTtFQUNoQyxzQkFBc0I7RUFDdEIsb0JBQW9CO0NBQ3BCLEVBQUMsQ0FBQyxLQUNKO0NBRUQsS0FBSyxFQUFFLE9BQXFDLEVBQVk7RUFDdkQsTUFBTSxFQUFFLE9BQU8sVUFBVSxHQUFHO0VBQzVCLE1BQU0sa0JBQWtCLE1BQU0sb0JBQW9CO0FBQ2xELFNBQU8sZ0JBQ04sMkNBQ0E7R0FDQyxPQUFPLEVBRU4sV0FBVyxHQUFHLHdCQUF3QixLQUFLLGNBQWMsQ0FDekQ7R0FDRCxXQUFXLENBQUNDLE1BQXFCO0FBQ2hDLFFBQUksYUFBYSxFQUFFLEtBQUssS0FBSyxJQUFJLENBQ2hDLEdBQUUsZ0JBQWdCO0dBRW5CO0VBQ0QsR0FDRCxDQUNDLGdCQUNDLHFDQUNBLEVBQ0MsT0FBTyxFQUNOLGtCQUFrQixZQUFZLE1BQU0sZUFBZSxFQUNuRCxFQUNELEdBQ0QsU0FBUyxNQUNULEVBQ0QsZ0JBQUUsa0RBQWtELGtCQUFrQixnQkFBRSxNQUFNLEtBQUssY0FBYyxnQkFBZ0IsS0FBSyxDQUFDLEdBQUcsS0FBSyxBQUMvSCxFQUNEO0NBQ0Q7QUFDRDs7OztJQzNDWSxvQkFBTixNQUEwRTtDQUNoRixXQUFvQztDQUVwQyxLQUFLQyxPQUFnRDtFQUNwRCxNQUFNLElBQUksTUFBTTtBQUNoQixTQUFPLGdCQUNOLDZCQUNBLEVBQ0MsT0FBTyxFQUNOLGtCQUFrQixZQUFZLE1BQU0sZUFBZSxFQUNuRCxFQUNELEdBQ0QsS0FBSyxlQUFlLEVBQUUsQ0FDdEI7Q0FDRDtDQUVELGVBQWVDLEdBQXFDO0FBQ25ELFNBQU8sZ0JBQUUsZUFBZTtHQUN2QixhQUFhLEVBQUUsZUFBZSxLQUFLLG1CQUFtQixFQUFFLFlBQVk7R0FDcEUsVUFBVSxDQUFDLFVBQVU7QUFDcEIsU0FBSyxXQUFXLE1BQU07QUFDdEIsU0FBSyxTQUFTLFFBQVEsRUFBRSxPQUFPO0FBQy9CLFNBQUssU0FBUyxPQUFPO0dBQ3JCO0dBQ0QsV0FBVyxDQUFDQyxNQUFxQjtJQUNoQyxNQUFNLE1BQU0sd0JBQXdCLEVBQUU7QUFDdEMsV0FBTyxFQUFFLGNBQWMsT0FBTyxFQUFFLFdBQVcsSUFBSSxHQUFHO0dBQ2xEO0dBQ0QsU0FBUyxNQUFNO0lBQ2QsTUFBTSxXQUFXLGNBQWMsS0FBSyxTQUFTO0FBQzdDLE1BQUUsTUFBTSxTQUFTLE1BQU07QUFDdkIsTUFBRSxVQUFVLFNBQVMsT0FBTyxTQUFTO0dBQ3JDO0dBQ0QsT0FBTyxFQUNOLFlBQVksR0FBRyxnQkFBZ0IsQ0FDL0I7RUFDRCxFQUFDO0NBQ0Y7QUFDRDs7OztBQzFDTSxlQUFlLHFDQUF3RTtDQUM3RixNQUFNLGlCQUFpQixRQUFRLE9BQU8sbUJBQW1CO0NBQ3pELE1BQU0sV0FBVyxNQUFNLGVBQWUsY0FBYztDQUNwRCxNQUFNLEVBQUUsZ0NBQWdDLEdBQUcsTUFBTSxPQUFPO0NBQ3hELElBQUksV0FBVyxNQUFNLGVBQWUsZUFBZSxFQUFFLGFBQWEsa0NBQWtDLFVBQVUsWUFBWSx1QkFBdUI7QUFDakosTUFBSyxRQUNKLEtBQUksZUFBZSxlQUFlLENBQ2pDLFdBQVUsTUFBTSw4QkFBOEIsTUFBTSxnQ0FBZ0MsQ0FBQztJQUVyRixRQUFPLFFBQVEsbUJBQW1CO0FBSXBDLEtBQUksU0FBUztFQUNaLE1BQU0sVUFBVSxNQUFNLFFBQVEsc0JBQXNCLG9CQUFvQixHQUFHO0FBQzNFLFNBQU8sUUFBUSxhQUFhLEtBQXdCLDBCQUEwQixRQUFRO0NBQ3RGLE1BQ0EsUUFBTztBQUVSOzs7O0lDYlksbUJBQU4sTUFBOEU7Q0FDcEYsQUFBUSxlQUF5QjtDQUVqQyxLQUFLQyxPQUFtRDtFQUN2RCxNQUFNLElBQUksTUFBTTtBQUNoQixTQUFPLGdCQUNOLHVDQUNBLEVBQUUsTUFBTSxTQUFTLElBQ2QsRUFBRSxNQUFNLElBQUksQ0FBQyxTQUFTLEtBQUssVUFBVSxNQUFNLE1BQU0sQ0FBQyxHQUNsRCxnQkFBRSxnQ0FBZ0MsS0FBSyxJQUFJLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FDcEY7Q0FDRDtDQUVELFNBQVNDLE9BQTRDO0VBQ3BELE1BQU0sa0JBQWtCLE1BQU0sTUFBTTtBQUVwQyxNQUFJLG9CQUFvQixLQUFLLGNBQWM7QUFDMUMsUUFBSyxvQkFBb0IsaUJBQWlCLE1BQU0sTUFBTSxPQUFPLE1BQU0sSUFBbUI7QUFJdEYsbUJBQUUsUUFBUTtFQUNWO0NBQ0Q7Q0FFRCxVQUFVQyxNQUFTQyxPQUFrRDtFQUNwRSxNQUFNLElBQUksTUFBTTtFQUNoQixNQUFNLGFBQWEsRUFBRSxpQkFBaUI7QUFDdEMsU0FBTyxnQkFDTiwyQkFDQSxFQUNDLE9BQU8sRUFDTixVQUFVLEVBQUUsTUFDWixFQUNELEdBQ0QsQ0FDQyxnQkFDQyw2QkFBNkIsYUFBYSxrQkFBa0IsS0FDNUQ7R0FDQyxTQUFTLENBQUNDLE1BQWtCO0FBQzNCLE1BQUUsZUFBZSxLQUFLO0FBQ3RCLE1BQUUsaUJBQWlCO0dBQ25CO0dBQ0QsWUFBWSxDQUFDQSxNQUFrQjtBQUM5QixNQUFFLGVBQWUsS0FBSztBQUN0QixNQUFFLG9CQUFvQixLQUFLO0FBQzNCLE1BQUUsaUJBQWlCO0dBQ25CO0VBQ0QsR0FDRCxDQUNDLEVBQUUsV0FBVyxLQUFLLEVBQ2xCLGFBQ0csZ0JBQUUsTUFBTTtHQUNSLE1BQU0sTUFBTTtHQUNaLE9BQU87SUFDTixXQUFXO0lBQ1gsY0FBYztHQUNkO0VBQ0EsRUFBQyxHQUNGLGdCQUFFLElBQUksRUFDTixPQUFPO0dBQ04sT0FBTztHQUNQLFFBQVE7RUFDUixFQUNBLEVBQUMsQUFDTCxFQUNELEFBQ0QsRUFDRDtDQUNEO0NBRUQsb0JBQW9CQyxjQUF3QkMsT0FBeUJDLFdBQXdCO0FBQzVGLE9BQUssZUFBZTtBQUNwQixNQUFJLGdCQUFnQixNQUFNO0dBQ3pCLE1BQU0sZ0JBQWdCLE1BQU0sUUFBUSxhQUFhO0FBRWpELE9BQUksa0JBQWtCLElBQUk7SUFDekIsTUFBTSxxQkFBcUIsVUFBVSxTQUFTLEtBQUssY0FBYztBQUVqRSxRQUFJLG1CQUNILG9CQUFtQixlQUFlO0tBQ2pDLE9BQU87S0FDUCxRQUFRO0lBQ1IsRUFBQztHQUVIO0VBQ0Q7Q0FDRDtBQUNEOzs7OztBQ3JFTSxTQUFTLDBCQUEwQkMsZUFBbUNDLFFBQWdCQyxVQUFnQ0MsaUJBQXlCO0NBQ3JKLE1BQU0sc0JBQXNCLFdBQVcsMkJBQTJCLFNBQVMsTUFBTTtDQUNqRixNQUFNLGFBQWEsT0FBTyxtQkFBbUI7Q0FDN0MsTUFBTSxhQUFhLE9BQU8sUUFBUSxDQUFDLHVCQUF1QjtDQUUxRCxNQUFNLFdBQVcsQ0FBQ0MsU0FBaUI7QUFDbEMsU0FBTyxXQUFXLEtBQUs7QUFDdkIsU0FBTyxPQUFPO0NBQ2Q7Q0FFRCxJQUFJO0NBQ0osTUFBTSw2QkFBNkIsT0FBTyxjQUFjLFdBQVc7Q0FDbkUsTUFBTSxjQUFjLHdCQUF3QjtDQUc1QyxNQUFNLGFBQWEsV0FBVyxRQUFRLFdBQVc7QUFFakQsS0FBSSw2QkFBNkIsYUFBYTtFQUM3QyxNQUFNLE9BQU8sY0FBYztBQUMzQixTQUFPLElBQUksMEJBQTBCLFdBQVcsTUFBTSxXQUFXLFNBQVMsTUFBTSxZQUFZLFdBQVc7Q0FDdkcsTUFDQSxRQUFPLElBQUksMEJBQTBCLFdBQVcsTUFBTSxXQUFXLFFBQVEsWUFBWSxXQUFXO0NBR2pHLE1BQU0sUUFBUSxJQUFJLGNBQWMsZUFBZSxNQUFNLFVBQVUscUJBQXFCLE1BQU0sT0FBTyxPQUFPO0FBQ3hHLGVBQWMsT0FBTyxvQkFBb0I7QUFDekMsT0FBTSxNQUFNO0FBQ1o7SUFFWSxnQkFBTixNQUE4QztDQUNwRCxBQUFRO0NBQ1IsQUFBUTtDQUNSLEFBQVE7Q0FDUixBQUFRO0NBQ1IsQUFBUTtDQUNSLEFBQVE7Q0FDUixBQUFpQjtDQUNqQixBQUFpQjtDQUNqQixBQUFRO0NBQ1IsQUFBUSxZQUFnQztDQUN4QyxBQUFRO0NBQ1IsQUFBUSxxQkFBeUM7Q0FFakQsWUFDQ0osZUFDQUssTUFDQUMsVUFDQUMscUJBQ2lCQyxvQkFDaEI7RUFvWUYsS0FyWWtCO0FBRWpCLE9BQUssUUFBUTtBQUNiLE9BQUssWUFBWTtBQUNqQixPQUFLLHNCQUFzQixPQUFPO0FBRWxDLE9BQUssa0JBQWtCLE1BQU07QUFDNUIsUUFBSyxRQUFRO0VBQ2I7QUFFRCxPQUFLLGtCQUFrQiw2QkFBTyxvQkFBb0I7QUFDbEQsT0FBSyxpQkFBaUI7QUFDdEIsT0FBSyxhQUFhO0dBQ2pCO0lBQ0MsS0FBSyxLQUFLO0lBQ1YsU0FBUyxNQUFNO0lBQ2YsTUFBTSxNQUFNO0FBQ1gsVUFBSyxzQkFBc0I7QUFFM0IsVUFBSyxRQUFRO0FBRWIscUJBQUUsUUFBUTtJQUNWO0lBQ0QsTUFBTTtHQUNOO0dBQ0Q7SUFDQyxLQUFLLEtBQUs7SUFDVixTQUFTLE1BQU07SUFDZixNQUFNLE1BQU07S0FDWCxNQUFNLGtCQUFrQixLQUFLLGVBQWUsb0JBQW9CO0FBRWhFLFNBQUksaUJBQWlCO0FBQ3BCLFdBQUssVUFBVSxnQkFBZ0IsS0FBSztBQUVwQyxXQUFLLFFBQVE7S0FDYjtJQUNEO0lBQ0QsTUFBTTtHQUNOO0dBQ0Q7SUFDQyxLQUFLLEtBQUs7SUFDVixTQUFTLE1BQU07SUFDZixNQUFNLE1BQU07QUFDWCxVQUFLLGVBQWUsbUJBQW1CLHFCQUFxQjtJQUM1RDtJQUNELE1BQU07R0FDTjtHQUNEO0lBQ0MsS0FBSyxLQUFLO0lBQ1YsU0FBUyxNQUFNO0lBQ2YsTUFBTSxNQUFNO0FBQ1gsVUFBSyxlQUFlLG1CQUFtQixxQkFBcUI7SUFDNUQ7SUFDRCxNQUFNO0dBQ047RUFDRDtBQUNELE9BQUssZ0JBQWdCLGNBQWMsY0FBYyxJQUFJLENBQUMsWUFBWTtBQUNqRSxtQkFBRSxRQUFRO0VBQ1YsRUFBQztBQUNGLE9BQUssNkJBQTZCO0dBQ2pDLE9BQU87R0FDUCxPQUFPLE1BQU07SUFDWixNQUFNLFdBQVcsS0FBSyxlQUFlLG9CQUFvQjtBQUV6RCxRQUFJLFVBQVU7QUFDYixVQUFLLFVBQVUsU0FBUyxLQUFLO0FBRTdCLFVBQUssUUFBUTtJQUNiO0dBQ0Q7R0FDRCxNQUFNLFdBQVc7RUFDakI7QUFDRCxPQUFLLGtCQUFrQixTQUFTLEtBQUssQ0FBQ0MsVUFBa0I7QUFDdkQsaUJBQWMsT0FBTyxNQUFNO0VBQzNCLEVBQUM7QUFFRixPQUFLLGdCQUFnQixvQkFBb0I7Q0FDekM7Q0FFRCxPQUF1QixNQUFNO0VBQzVCLE1BQU0saUJBQWlCLEtBQUsscUJBQXFCO0FBRWpELFNBQU8sZ0JBQ04sbUVBQ0E7R0FFQyxPQUFPO0lBQ04sT0FBTyxHQUFHLEtBQUssTUFBTSxNQUFNO0lBQzNCLFFBQVEsR0FBRyxzQkFBc0I7SUFDakMsS0FBSyxHQUFHLEtBQUssTUFBTSxJQUFJO0lBQ3ZCLE1BQU0sR0FBRyxLQUFLLE1BQU0sS0FBSztHQUN6QjtHQUNELFNBQVMsQ0FBQ0MsTUFBa0I7QUFDM0IsU0FBSyxXQUFXLE9BQU87QUFFdkIsTUFBRSxpQkFBaUI7R0FDbkI7R0FDRCxVQUFVLE1BQU07QUFDZixpQkFBYSxrQkFBa0IsS0FBSyxnQkFBZ0I7R0FDcEQ7R0FDRCxVQUFVLE1BQU07QUFDZixpQkFBYSxxQkFBcUIsS0FBSyxnQkFBZ0I7R0FDdkQ7RUFDRCxHQUNELENBQ0MsS0FBSyxlQUFlLEVBQ3BCLGdCQUFFLCtCQUErQixDQUNoQyxnQkFDQyw4QkFBOEIsaUJBQWlCLFFBQVEsS0FDdkQsRUFDQyxPQUFPLEVBQ04sTUFBTSxVQUNOLEVBQ0QsR0FDRCxLQUFLLGFBQWEsQ0FDbEIsRUFDRCxpQkFDRyxnQkFDQSwyQ0FDQSxFQUNDLE9BQU8sRUFDTixNQUFNLFVBQ04sRUFDRCxHQUNELEtBQUssb0JBQW9CLENBQ3hCLEdBQ0QsSUFDSCxFQUFDLEFBQ0YsRUFDRDtDQUNEO0NBRUQsZ0JBQTBCO0VBQ3pCLE1BQU0sbUJBQW1CLEtBQUssZUFBZSxxQkFBcUI7QUFFbEUsU0FBTyxnQkFBRSxpREFBaUQsQ0FDekQsZ0JBQUUsZUFBZSxDQUFDLGdCQUFFLDJCQUEyQixLQUFLLGtCQUFrQixDQUFDLEVBQUUsS0FBSyxrQkFBa0IsQUFBQyxFQUFDLEVBQ2xHLGdCQUFFLGFBQWEsQ0FDZCxtQkFDRyxLQUFLLG1CQUFtQixpQkFBaUIsR0FDekMsSUFDSCxFQUFDLEFBQ0YsRUFBQztDQUNGO0NBRUQsbUJBQW1DLE1BQU07QUFDeEMsU0FBTyxnQkFBRSxtQkFBbUI7R0FDM0IsT0FBTyxLQUFLO0dBQ1osYUFBYTtHQUNiLFlBQVksQ0FBQyxhQUFhO0FBQ3pCLFFBQUksYUFBYSxTQUFTLEtBQUssS0FBSyxNQUFNLEtBQUssR0FBRyxFQUFFO0FBR25ELFVBQUssZUFBZSxtQkFBbUIsYUFBYSxTQUFTLEtBQUssS0FBSyxHQUFHLEdBQUcsdUJBQXVCLHFCQUFxQjtBQUV6SCxZQUFPO0lBQ1AsTUFDQSxRQUFPO0dBRVI7R0FDRCxTQUFTLENBQUMsVUFBVTtBQUNuQixTQUFLLGdCQUFnQixNQUFNO0dBQzNCO0dBQ0QsVUFBVSxDQUFDLFVBQVU7QUFDcEIsU0FBSyxZQUFZLE1BQU0sSUFBSTtHQUMzQjtFQUNELEVBQUM7Q0FDRjtDQUVELG1CQUE2QjtFQUM1QixNQUFNLFFBQVEsS0FBSyw0QkFBNEI7QUFFL0MsU0FBTyxnQkFDTixJQUNBLEVBQ0MsV0FBVyxDQUFDQyxNQUFxQjtBQUVoQyxPQUFJLGFBQWEsRUFBRSxLQUFLLEtBQUssSUFBSSxLQUFLLEtBQUssZUFBZSxxQkFBcUIsRUFBRTtBQUNoRixTQUFLLFdBQVcsT0FBTztBQUV2QixNQUFFLGdCQUFnQjtHQUNsQjtFQUNELEVBQ0QsR0FDRCxRQUFRLGdCQUFFLFlBQVksTUFBeUIsR0FBRyxLQUNsRDtDQUNEO0NBRUQsNkJBQXFEO0VBQ3BELE1BQU0seUJBQXlCLEtBQUssZUFBZSwyQkFBMkI7RUFFOUUsTUFBTSxrQkFBa0IsdUJBQXVCLE9BQU8sQ0FBQyxhQUN0RCxxQkFBcUIsUUFBUSxPQUFPLG1CQUFtQixDQUFDLE1BQU0sU0FBUyxPQUFPLGdCQUFnQixNQUFNLENBQ3BHO0FBRUQsTUFBSSx1QkFBdUIsV0FBVyxFQUNyQyxRQUFPO0dBQ04sT0FBTztHQUNQLE9BQU8sTUFBTTtBQUNaLHdDQUFvQyxDQUFDLEtBQUssQ0FBQyxjQUFjO0FBQ3hELFNBQUksVUFDSCxNQUFLLG1CQUFtQixNQUFNLFVBQVU7SUFFekMsRUFBQztHQUNGO0dBQ0QsTUFBTSxNQUFNO0dBQ1osUUFBUSxZQUFZO0VBQ3BCO1NBQ1MsZ0JBQWdCLFdBQVcsRUFDckMsUUFBTztHQUNOLE9BQU87R0FDUCxPQUFPLE1BQU0sS0FBSyxtQkFBbUIsTUFBTSxnQkFBZ0IsR0FBRyxVQUFVO0dBQ3hFLE1BQU0sTUFBTTtHQUNaLFFBQVEsWUFBWTtFQUNwQjtTQUNTLGdCQUFnQixTQUFTLEVBQ25DLFFBQU8sZUFBZTtHQUNyQixpQkFBaUI7SUFDaEIsT0FBTztJQUNQLE1BQU0sTUFBTTtJQUNaLFFBQVEsWUFBWTtHQUNwQjtHQUNELFlBQVksTUFDWCxnQkFBZ0IsSUFBSSxDQUFDLG1CQUFtQjtBQUN2QyxXQUFPO0tBQ04sT0FBTyxLQUFLLGdCQUFnQixjQUFjLG1CQUFtQixlQUFlLFdBQVcsUUFBUSxPQUFPLG1CQUFtQixFQUFFLEtBQUssQ0FBQztLQUNqSSxPQUFPLE1BQU0sS0FBSyxtQkFBbUIsTUFBTSxlQUFlLFVBQVU7SUFDcEU7R0FDRCxFQUFDO0VBQ0gsRUFBQztJQUVGLFFBQU87Q0FFUjtDQUVELG1CQUFtQkMsa0JBQTJDO0VBQzdELE1BQU0sa0JBQWtCLEtBQUssZUFBZSxvQkFBb0I7RUFFaEUsTUFBTSxnQkFBZ0IsS0FBSyxlQUFlLGtDQUFrQztFQUU1RSxNQUFNLFlBQVksaUJBQWlCLHFCQUFxQixRQUFRLE9BQU8sbUJBQW1CLENBQUMsTUFBTSxjQUFjLE9BQU8sZ0JBQWdCLE1BQU07QUFDNUksU0FBTztHQUNOLGdCQUFFLHlDQUF5QyxrQkFBa0IsZ0JBQUUsSUFBSSxLQUFLLElBQUksZUFBZSxnQkFBZ0IsY0FBYyxPQUFPLENBQUMsR0FBRyxHQUFHO0dBQ3ZJLGdCQUNDLFlBQ0EsZUFBZTtJQUNkLGlCQUFpQjtLQUNoQixPQUFPO0tBQ1AsTUFBTSxNQUFNO0lBQ1o7SUFDRCxZQUFZLE1BQ1gsaUJBQWlCLFNBQVMsSUFBSSxDQUFDLFlBQVk7S0FDMUMsTUFBTUMsV0FBeUIsU0FBUyxRQUFRLGFBQWE7QUFDN0QsWUFBTztNQUNOLE9BQU8sZUFBZSxVQUFVO01BQ2hDLE9BQU8sQ0FBQ0gsTUFBa0I7QUFDekIsU0FBRSxpQkFBaUI7QUFDbkIsWUFBSyxlQUFlLDJCQUEyQixTQUFTO0FBQ3hELFlBQUssV0FBVyxPQUFPO01BQ3ZCO0tBQ0Q7SUFDRCxFQUFDO0dBQ0gsRUFBQyxDQUNGO0dBQ0QsVUFDRyxDQUNBLGdCQUFFLFlBQVk7SUFDYixPQUFPO0lBQ1AsT0FBTyxNQUNOLFFBQVEsYUFDTixLQUFLLDBCQUEwQixVQUFVLGlCQUFpQixZQUFZLENBQUMsQ0FDdkUsS0FBSyxDQUFDLGNBQWMsS0FBSyxtQkFBbUIsa0JBQWtCLFVBQVUsQ0FBQztJQUM1RSxNQUFNLE1BQU07SUFDWixRQUFRLFlBQVk7R0FDcEIsRUFBQyxFQUNGLGdCQUFFLFlBQVk7SUFDYixPQUFPO0lBQ1AsT0FBTyxNQUFNO0FBQ1oscUJBQWdCLHFCQUFxQixDQUFDLFVBQVUsTUFBTSxRQUFRLGFBQWEsTUFBTSxpQkFBaUIsQ0FBQztJQUNuRztJQUNELE1BQU0sTUFBTTtJQUNaLFFBQVEsWUFBWTtHQUNwQixFQUFDLEFBQ0QsSUFDRDtHQUNILGdCQUFFLFNBQVMsZ0JBQUUsa0JBQWtCLENBQUM7R0FDaEMsZ0JBQ0MsSUFDQSxFQUNDLFdBQVcsQ0FBQ0MsTUFBcUI7QUFFaEMsUUFBSSxhQUFhLEVBQUUsS0FBSyxLQUFLLElBQUksRUFBRTtBQUNsQyxVQUFLLFdBQVcsT0FBTztBQUV2QixPQUFFLGdCQUFnQjtJQUNsQjtHQUNELEVBQ0QsR0FDRCxnQkFBRSxRQUFRLEtBQUssMkJBQTJCLENBQzFDO0VBQ0Q7Q0FDRDtDQUVELGNBQXdCO0FBQ3ZCLFNBQU8sZ0JBQUUsa0JBQWtCO0dBQzFCLE9BQU8sS0FBSyxlQUFlLGVBQWU7R0FDMUMsY0FBYyxLQUFLLGVBQWUsa0JBQWtCO0dBQ3BELGdCQUFnQixLQUFLLGVBQWU7R0FDcEMsa0JBQWtCLE1BQU8sS0FBSyxlQUFlLFVBQVUsR0FBRyx1QkFBdUI7R0FDakYsT0FBTztHQUNQLFlBQVksQ0FBQ0csYUFDWixnQkFBRSx3QkFBd0IsRUFDZixTQUNWLEVBQUM7R0FDSCxxQkFBcUIsQ0FBQ0MsTUFBcUI7SUFDMUMsTUFBTSxXQUFXLEtBQUssZUFBZSxvQkFBb0I7QUFFekQsUUFBSSxVQUFVO0FBQ2IsVUFBSyxVQUFVLFNBQVMsS0FBSztBQUU3QixVQUFLLFFBQVE7SUFDYjtHQUNEO0VBQ0QsRUFBQztDQUNGO0NBRUQscUJBQStCO0VBQzlCLE1BQU0sV0FBVyxLQUFLLGVBQWUscUJBQXFCO0FBRTFELE1BQUksU0FDSCxRQUFPLENBQ04sZ0JBQUUsa0JBQWtCO0dBQ1Q7R0FDVixPQUFPLEtBQUs7RUFDWixFQUFDLEFBQ0Y7SUFFRCxRQUFPO0NBRVI7Q0FFRCxzQkFBK0I7QUFDOUIsU0FBTyxPQUFPLGFBQWE7Q0FDM0I7Q0FFRCx3QkFBZ0M7QUFDL0IsU0FBTyxPQUFPLGFBQWEsS0FBSztDQUNoQztDQUVELE9BQU87QUFDTixPQUFLLHFCQUFxQixTQUFTO0FBQ25DLFFBQU0sUUFBUSxNQUFNLE1BQU07Q0FDMUI7Q0FFRCxTQUFlO0FBQ2QsUUFBTSxPQUFPLEtBQUs7Q0FDbEI7Q0FFRCxnQkFBZ0JMLEdBQXFCO0FBQ3BDLE9BQUssc0JBQXNCO0FBQzNCLE9BQUssUUFBUTtDQUNiO0NBRUQsZ0JBQStCO0FBQzlCLFNBQU8sUUFBUSxTQUFTO0NBQ3hCO0NBRUQsVUFBZ0I7QUFDZixPQUFLLGNBQWMsSUFBSSxLQUFLO0NBQzVCO0NBRUQsWUFBd0I7QUFDdkIsU0FBTyxLQUFLO0NBQ1o7Q0FFRCxTQUFTTSxHQUFtQjtBQUMzQixTQUFPO0NBQ1A7Q0FFRCxpQkFBcUM7QUFDcEMsU0FBTyxLQUFLO0NBQ1o7Q0FFRCxtQkFBbUJDLGdCQUFzQ0MsV0FBOEI7QUFDdEYsU0FBTyw4QkFBb0MsS0FBSyxDQUFDLFdBQVc7QUFDM0QsVUFBTyxtQkFBbUIsZ0JBQWdCLFVBQVU7RUFDcEQsRUFBQztDQUNGO0FBQ0Q7Ozs7QUMvY00sU0FBUyxpQ0FBaUNDLFFBQWdCQyxlQUE2RDtDQUM3SCxNQUFNLFdBQVcsSUFBSSx5QkFBeUIsUUFBUSxlQUFlO0FBQ3JFLFFBQU8saUJBQWlCLFdBQVcsQ0FBQ0MsVUFBeUIsU0FBUyxjQUFjLE1BQU0sQ0FBQztBQUMzRixRQUFPLGlCQUFpQixVQUFVLENBQUNDLFVBQWdELFNBQVMsbUJBQW1CLE1BQU0sQ0FBQztBQUN0SCxRQUFPO0FBQ1A7SUFFSywyQkFBTixNQUErQjtDQUM5QjtDQUNBO0NBQ0E7Q0FDQTtDQUVBLFlBQVlILFFBQWdCQyxlQUFtQ0csUUFBeUI7QUFDdkYsT0FBSyxVQUFVO0FBQ2YsT0FBSyx5QkFBeUI7QUFDOUIsT0FBSyxpQkFBaUI7QUFDdEIsT0FBSyxRQUFRQztDQUNiO0NBR0QsY0FBY0gsT0FBc0I7QUFDbkMsTUFBSSxhQUFhLE1BQU0sS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLHdCQUF3QjtHQUNyRSxNQUFNLGVBQWUsS0FBSztHQUMxQixNQUFNLE9BQU8sYUFBYSxlQUFlLGFBQWEsS0FBSyxZQUFZLGFBQWEsZUFBZSxlQUFlLEtBQUs7R0FDdkgsTUFBTSw2QkFBNkIsS0FBSyxZQUFZLHlCQUF5QjtHQUM3RSxNQUFNLHNCQUFzQixLQUFLLE9BQU8sU0FBUztBQUVqRCxPQUNDLCtCQUErQixNQUMvQiw2QkFBNkIsYUFBYSxlQUMxQyw2QkFBNkIscUJBQzVCO0FBRUQsVUFBTSxpQkFBaUI7QUFDdkIsVUFBTSxnQkFBZ0I7SUFDdEIsTUFBTSxRQUFRLFNBQVMsYUFBYTtBQUNwQyxVQUFNLFNBQVMsYUFBYSxnQkFBZ0IsMkJBQTJCO0FBQ3ZFLFVBQU0sT0FBTyxhQUFhLGdCQUFnQixhQUFhLFlBQVk7QUFFbkUsU0FBSyxRQUFRLGFBQWEsTUFBTTtJQUdoQyxNQUFNLGVBQWUsS0FBSyxRQUFRLGlCQUFpQjtJQUVuRCxNQUFNLFdBQVcsS0FBSyxlQUFlLG9CQUFvQixhQUFhO0FBRXRFLFFBQUksU0FDSCxLQUFJLFNBQVMsU0FBUyxTQUFTLEdBQUc7S0FHakMsSUFBSSxVQUFVLFNBQVMsU0FBUyxJQUFJLENBQUMsWUFBWTtBQUNoRCxhQUFPO09BQ04sT0FBTyxlQUFlLFNBQVMsUUFBUSxhQUFhLEVBQUU7T0FDdEQsT0FBTyxNQUFNO0FBQ1osYUFBSyxRQUFRLFdBQVcsUUFBUSxLQUFLO0FBRXJDLGFBQUssUUFBUSxPQUFPO09BQ3BCO01BQ0Q7S0FDRCxFQUFDO0tBQ0YsTUFBTSxXQUFXLElBQUksU0FBUyxNQUFNLFNBQVM7QUFDN0MsY0FBUyxVQUFVLEtBQUssUUFBUSxtQkFBbUIsQ0FBQztBQUNwRCxXQUFNLGNBQWMsVUFBVSxNQUFNO0lBQ3BDLE1BQ0EsTUFBSyxRQUFRLFdBQVcsZ0JBQWdCLFNBQVMsU0FBUyxDQUFDLEtBQUs7SUFHakUsMkJBQTBCLEtBQUssZ0JBQWdCLEtBQUssU0FBUyxNQUFNLGFBQWE7R0FFakY7RUFDRDtDQUNEO0NBRUQsbUJBQW1CQyxPQUE2QztBQUMvRCxPQUFLLHlCQUF5QixNQUFNLE9BQU87Q0FDM0M7QUFDRDs7OztNQ2hGWSxrQ0FBa0M7SUFLbEMseUJBQU4sTUFBK0U7Q0FDckYsS0FBS0csT0FBcUQ7RUFDekQsTUFBTSxFQUFFLE9BQU8sVUFBVSxHQUFHLE1BQU0sTUFBTTtBQUN4QyxTQUFPLGdCQUNOLGdEQUNBLEVBQ0MsT0FBTyxFQUNOLFFBQVEsR0FBRyxnQ0FBZ0MsQ0FDM0MsRUFDRCxHQUNELENBQ0MsZ0JBQUUsMEJBQTBCLE1BQU0sRUFDbEMsZ0JBQUUseUNBQXlDLENBQzFDLFNBQVMsSUFBSSxDQUFDLFlBQVk7QUFDekIsVUFBTyxnQkFBRSw2RUFBNkUsUUFBUSxRQUFRO0VBQ3RHLEVBQUMsQUFDRixFQUFDLEFBQ0YsRUFDRDtDQUNEO0FBQ0Q7Ozs7SUNaWSx5QkFBTixNQUErRTtDQUNyRjtDQUlBLGNBQWM7QUFDYixPQUFLLGtCQUFrQixTQUFTLENBQUMsVUFBVTtBQUMxQyxVQUFPLEVBQ04sU0FBUyxjQUFjLGFBQWEsTUFBTSxhQUFhLEVBQ3RELHNCQUFzQixLQUN0QixFQUFDLENBQUMsS0FDSDtFQUNELEVBQUM7Q0FDRjtDQUVELEtBQUssRUFBRSxPQUEyQyxFQUFZO0FBQzdELFNBQU8sZ0JBQUUscUJBQXFCLENBQUMsS0FBSyxlQUFlLE1BQU0sQUFBQyxFQUFDO0NBQzNEO0NBRUQsZUFBZUMsT0FBOEM7RUFDNUQsTUFBTSxFQUFFLE9BQU8sVUFBVSxHQUFHO0FBQzVCLFNBQU8sZ0JBQ04sSUFDQSxFQUNDLFNBQVMsQ0FBQ0MsVUFBc0I7QUFDL0IsUUFBSyxtQkFBbUIsT0FBTyxNQUFNO0VBQ3JDLEVBQ0QsR0FDRCxDQUNDLGdCQUNDLDJDQUNBLGdCQUFFLHFCQUFxQixNQUFNLE1BQU0sR0FDbEMsV0FBVyxDQUFDLGdCQUFFLCtCQUErQixDQUFDLEtBQUssaUJBQWlCLE1BQU0sRUFBRSxLQUFLLG1CQUFtQixNQUFNLEFBQUMsRUFBQyxBQUFDLElBQUcsS0FDakgsRUFDRCxnQkFBRSxJQUFJLENBQ0wsZ0JBQUUsd0JBQXdCLENBQ3pCLE1BQU0sU0FBUyxJQUFJLENBQUMsaUJBQWlCO0FBQ3BDLFVBQU8sZ0JBQUUsOEJBQThCLGFBQWEsUUFBUTtFQUM1RCxFQUFDLEFBQ0YsRUFBQyxFQUNGLGdCQUFFLDBCQUEwQixDQUFDLGdCQUFFLHdDQUF3QyxnQkFBRSxNQUFNLEtBQUssZ0JBQWdCLE1BQU0sQ0FBQyxRQUFRLENBQUMsQUFBQyxFQUFDLEFBQ3RILEVBQUMsQUFDRixFQUNEO0NBQ0Q7Q0FFRCxBQUFRLG1CQUFtQkMsT0FBMkI7QUFDckQsU0FBTyxnQkFBRSxZQUFZO0dBQ3BCLE9BQU87R0FDUCxNQUFNLE1BQU07R0FDWixPQUFPLE1BQU07QUFDWixvQkFBZ0IseUJBQXlCLENBQUMsVUFBVSxNQUFNLFFBQVEsYUFBYSxNQUFNLE1BQU0sQ0FBQyxNQUFNLFFBQVEsZUFBZSxLQUFLLENBQUMsQ0FBQztHQUNoSTtFQUNELEVBQUM7Q0FDRjtDQUVELEFBQVEsaUJBQWlCQSxPQUEyQjtBQUNuRCxTQUFPLGdCQUFFLFlBQVk7R0FDcEIsT0FBTztHQUNQLE1BQU0sTUFBTTtHQUNaLE9BQU8sTUFBTTtBQUNaLFdBQU8sbUNBQXlDLEtBQUssQ0FBQyxFQUFFLG9EQUF5QixLQUFLO0FBQ3JGLGFBQVEsYUFBYSxLQUFLLDBCQUEwQixVQUFVLE1BQU0sWUFBWSxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWM7QUFDckcsZ0NBQXdCLE9BQU8sVUFBVTtLQUN6QyxFQUFDO0lBQ0YsRUFBQztHQUNGO0VBQ0QsRUFBQztDQUNGO0NBRUQsbUJBQW1CQyxPQUFjSCxPQUEwQztFQUMxRSxJQUFJLFNBQVMsTUFBTTtBQUVuQixNQUFJLFVBQVUsT0FBTyxTQUFTO0dBQzdCLElBQUksZ0JBQWdCLE9BQU8sUUFBUSxJQUFJO0FBRXZDLE9BQUksaUJBQWlCLFdBQVcsY0FBYyxNQUFNLGdCQUFnQixFQUFFO0FBQ3JFLFVBQU0sZ0JBQWdCO0lBQ3RCLE1BQU0sQ0FBQyxRQUFRLFVBQVUsR0FBRyxJQUFJLElBQUksY0FBYyxNQUFNLFNBQVMsTUFBTSxJQUFJO0FBQzNFLFVBQU0sbUJBQW1CLENBQUMsUUFBUSxTQUFVLEVBQUM7R0FDN0M7RUFDRDtDQUNEO0FBQ0Q7Ozs7O0lDakZZLDZCQUFOLE1BQXVGO0NBQzdGLEFBQVE7Q0FDUixBQUFRLGNBQXNCO0NBQzlCLEFBQVE7Q0FFUixjQUFjO0FBQ2IsT0FBSyxXQUFXLENBQUU7Q0FDbEI7Q0FFRCxTQUFTLEVBQUUsT0FBK0MsRUFBRTtFQUMzRCxNQUFNLEVBQUUsT0FBTyxHQUFHO0FBRWxCLE9BQUssU0FBUyxLQUNiLHdCQUFPLFFBQVEsTUFBTTtBQUNwQixtQkFBRSxRQUFRO0VBQ1YsR0FBRSxDQUFDLE1BQU0sZUFBZSxNQUFNLGVBQWdCLEVBQUMsQ0FDaEQ7Q0FDRDtDQUVELFdBQVc7QUFDVixPQUFLLElBQUlJLFlBQVUsS0FBSyxTQUN2QixVQUFPLElBQUksS0FBSztDQUVqQjtDQUVELEtBQUssRUFBRSxPQUErQyxFQUFZO0VBQ2pFLE1BQU0sUUFBUSxNQUFNO0VBQ3BCLE1BQU0sZ0JBQWdCLE1BQU0sZUFBZTtBQUMzQyxTQUFPLGdCQUNKLGdCQUFFLHdCQUF3QjtHQUMxQixPQUFPO0dBQ1Asb0JBQW9CLENBQUMsZUFBZTtBQUNuQyxVQUNFLGFBQWEsV0FBVyxDQUN4QixLQUFLLENBQUMsb0JBQW9CO0FBQzFCLFdBQU0saUJBQWlCLGdCQUFnQjtJQUN2QyxFQUFDLENBQ0QsTUFBTSxRQUFRLGVBQWUsTUFBTSxPQUFPLFFBQVEsd0JBQXdCLENBQUMsQ0FBQztHQUM5RTtHQUNELFVBQVUsTUFBTSxXQUFXLGNBQWM7RUFDeEMsRUFBQyxHQUNGO0dBQ0EsZ0JBQUUsV0FBVztJQUNaLE9BQU87SUFDUCxPQUFPLEtBQUs7SUFDWixTQUFTLENBQUMsVUFBVTtBQUNuQixVQUFLLGNBQWM7QUFDbkIsV0FBTSxPQUFPLE1BQU07QUFDbkIscUJBQUUsUUFBUTtJQUNWO0dBQ0QsRUFBQztHQUNGLEtBQUssZ0JBQWdCLE1BQU07R0FDM0IsS0FBSyxZQUFZLE9BQU8sTUFBTTtFQUM3QjtDQUNKO0NBRUQsZ0JBQWdCQyxPQUFxQztFQUNwRCxNQUFNLGtCQUFrQixNQUFNLDZCQUE2QjtBQUMzRCxTQUFPLGdCQUFFLG1CQUFtQixDQUMzQixnQkFBZ0IsU0FBUyxJQUFJLGdCQUFFLHFCQUFxQixLQUFLLElBQUkseUJBQXlCLENBQUMsR0FBRyxNQUMxRixnQkFBZ0IsSUFBSSxDQUFDLFlBQVk7QUFDaEMsVUFBTyxnQkFBRSwwRkFBMEYsUUFBUTtFQUMzRyxFQUFDLEFBQ0YsRUFBQztDQUNGO0NBRUQsWUFBWUEsT0FBMkJDLE9BQWtEO0FBQ3hGLFNBQU8sZ0JBQ04sZ0JBQ0E7R0FDQyxVQUFVLENBQUMsVUFBVTtBQUNwQixTQUFLLDRCQUE0QixNQUFNLGNBQWMsSUFDcEQsc0NBQ0MsTUFBTSxLQUNOLGlDQUNBLE1BQU0sc0JBQXNCLEtBQUssTUFBTSxDQUN2QyxDQUNEO0dBQ0Q7R0FDRCxnQkFBZ0IsTUFBTTtBQUNyQixTQUFLLDBCQUEwQixLQUFLO0dBQ3BDO0VBQ0QsR0FDRCxDQUNDLE1BQU0sZ0JBQWdCLEdBQ25CLE1BQU0saUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxpQkFBaUIsT0FBTyxNQUFNLENBQUMsR0FDM0UsZ0JBQUUsV0FBVyxLQUFLLElBQUkscUJBQXFCLENBQUMsQUFDL0MsRUFDRDtDQUNEO0NBRUQsaUJBQWlCRCxPQUEyQkUsT0FBcUM7QUFDaEYsU0FBTyxnQkFBRSwrQ0FBK0MsQ0FDdkQsZ0JBQ0MsU0FDQSxFQUNDLFNBQVMsTUFBTTtBQUNkLFNBQU0sY0FBYyxNQUFNO0VBQzFCLEVBQ0QsR0FDRCxDQUNDLGdCQUFFLHdCQUF3QixFQUNsQixNQUNQLEVBQUMsRUFDRixnQkFBRSxJQUFJLEVBQ0wsT0FBTztHQUNOLE9BQU87R0FDUCxRQUFRO0VBQ1IsRUFDRCxFQUFDLEFBQ0YsRUFDRCxBQUNELEVBQUM7Q0FDRjtBQUNEOzs7OztBQ3JITSxTQUFTLG1DQUNmQyxlQUNBQyxlQUNBQyxRQUM2RDtDQUM3RCxNQUFNQyxxQkFBc0Q7RUFDM0Qsa0JBQWtCLENBQUMsYUFBYTtBQUMvQiw2QkFBMEIsZUFBZSxRQUFRLFVBQVUsR0FBRztFQUM5RDtFQUNELE9BQU87Q0FDUDtDQUNELE1BQU0sa0JBQWtCLDZCQUFPLE1BQU07QUFDckMsUUFBTztFQUNOLFNBQVM7RUFDVCxhQUFhLG1CQUFtQixvQkFBb0IsZ0JBQWdCO0VBQ3BFLGdCQUFnQjtFQUNoQixXQUFXO0NBQ1g7QUFDRDtBQUVELFNBQVMsbUJBQW1CQyxPQUF3Q0MsaUJBQThEO0FBQ2pJLFFBQU8sTUFBTTtFQUNaLE1BQU0sZ0JBQWdCLE1BQU0sTUFBTSxlQUFlO0FBQ2pELFNBQU8sZ0JBQWdCLHNCQUFzQixlQUFlLE1BQU0sTUFBTSxHQUFHLHFCQUFxQixNQUFNLE9BQU8sZ0JBQWdCO0NBQzdIO0FBQ0Q7QUFFRCxTQUFTLHNCQUFzQkMsT0FBMkJDLE9BQWlEO0FBQzFHLFFBQU87RUFDTixNQUFNLENBQ0w7R0FDQyxPQUFPO0dBQ1AsT0FBTyxNQUFNLE1BQU0sY0FBYyxLQUFLO0dBQ3RDLE1BQU0sV0FBVztFQUNqQixDQUNEO0VBQ0QsUUFBUTtDQUNSO0FBQ0Q7QUFFRCxTQUFTLHFCQUFxQkEsT0FBMkJGLGlCQUF3RDtBQUNoSCxRQUFPO0VBQ04sTUFBTSxNQUFNLENBQ1g7R0FDQyxPQUFPO0dBQ1AsT0FBTyxNQUFNLGdCQUFnQixNQUFNO0dBQ25DLE1BQU0sV0FBVztFQUNqQixDQUNEO0VBQ0QsUUFBUTtFQUNSLE9BQU8sQ0FBQyxxQkFBcUIsTUFBTSxBQUFDO0NBQ3BDO0FBQ0Q7QUFFRCxTQUFTLHFCQUFxQkUsT0FBd0M7Q0FDckUsTUFBTSx5QkFBeUIsTUFBTSwyQkFBMkI7QUFFaEUsS0FBSSx1QkFBdUIsV0FBVyxFQUNyQyxRQUFPO0VBQ04sT0FBTztFQUNQLE9BQU8sTUFBTTtBQUNaLDJCQUF3QixNQUFNLHVCQUF1QixHQUFHLFVBQVU7RUFDbEU7RUFDRCxNQUFNLFdBQVc7Q0FDakI7SUFFRCxRQUFPO0VBQ04sT0FBTztFQUNQLE1BQU0sV0FBVztFQUNqQixPQUFPLGVBQWUsRUFDckIsYUFBYSxNQUNaLHVCQUF1QixJQUFJLENBQUMsbUJBQW1CO0FBQzlDLFVBQU87SUFDTixPQUFPLEtBQUssZ0JBQWdCLGNBQWMsbUJBQW1CLGVBQWUsV0FBVyxNQUFNLGdCQUFnQixLQUFLLENBQUM7SUFDbkgsT0FBTyxNQUFNO0FBQ1osNkJBQXdCLE1BQU0sZUFBZSxVQUFVO0lBQ3ZEO0dBQ0Q7RUFDRCxFQUFDLENBQ0gsRUFBQztDQUNGO0FBRUY7QUFFRCxTQUFTLHdCQUF3QkMsYUFBd0NDLFdBQThCO0FBQ3RHLFFBQU8sbUNBQXlDLEtBQUssQ0FBQyxXQUFXO0FBQ2hFLFNBQU8sd0JBQXdCLGFBQWEsVUFBVTtDQUN0RCxFQUFDO0FBQ0Y7Ozs7QUN4R00sU0FBUyxvQkFBb0JDLE9BQWVDLFlBQWtGO0FBQ3BJLFFBQU8sT0FBTyxPQUFPLFlBQVk7RUFBQztFQUFTO0VBQWU7Q0FBbUIsR0FBRSxNQUFNO0FBQ3JGOzs7OztNQ2FZLG9CQUFvQjtBQUVqQyxTQUFTLG1DQUFtQ0MsUUFBNEJDLFFBQW9DO0FBQzNHLFFBQU8sT0FBTyxNQUFNLGNBQWMsT0FBTyxNQUFNO0FBQy9DO0lBS1kscUJBQU4sTUFBeUI7Q0FDL0I7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0EsQUFBUztDQUNULEFBQVM7Q0FDVCxBQUFTO0NBQ1Q7Q0FDQTtDQUNBLEFBQVM7Q0FFVCxZQUFZQyxpQkFBa0NDLGNBQTRCQyxnQkFBZ0M7QUFDekcsT0FBSyxtQkFBbUI7QUFDeEIsT0FBSyxnQkFBZ0I7QUFDckIsT0FBSyxpQkFBaUI7QUFDdEIsT0FBSyxjQUFjLFlBQVksTUFBTSxtQ0FBbUM7QUFDeEUsT0FBSyxlQUFlLENBQUU7QUFDdEIsT0FBSyw0QkFBNEIsQ0FBRTtBQUNuQyxPQUFLLGtCQUFrQiw2QkFBTyxLQUFLLFlBQVksTUFBTTtBQUNyRCxPQUFLLGdCQUFnQiw2QkFBa0MsS0FBSztBQUM1RCxPQUFLLGVBQWU7QUFFcEIsT0FBSyx1QkFBdUIsQ0FBQyxZQUFZO0FBQ3hDLFVBQU8sS0FBSyxjQUFjLFFBQVE7RUFDbEM7QUFFRCxPQUFLLGlCQUFpQixrQkFBa0IsS0FBSyxxQkFBcUI7QUFFbEUsT0FBSyxrQkFBa0IsQ0FBRTtBQUN6QixPQUFLLGVBQWUsQ0FBRTtBQUN0QixPQUFLLGdCQUFnQixLQUFLLFlBQVksTUFBTTtBQUM1QyxPQUFLLGNBQWMsS0FBSyxnQkFBZ0IsR0FBRyxLQUFLLGlCQUFpQixDQUFDLEtBQUssS0FBSztBQUM1RSxPQUFLLGVBQWUsSUFBSSxXQUFXLE1BQU07R0FDeEMsTUFBTSxzQkFBc0IsS0FBSyxlQUFlLHdCQUF3QjtHQUV4RSxJQUFJQyxvQkFBNkMsQ0FBRTtBQUNuRCxVQUFPLEtBQVcscUJBQXFCLENBQUMsZUFBZSwwQkFBMEIsWUFBWSxhQUFhLENBQUMsQ0FDekcsS0FBSyxDQUFDLG1CQUFtQjtBQUN6Qix3QkFBb0I7QUFDcEIsV0FBTyx5QkFBeUIsZ0JBQWdCLGFBQWE7R0FDN0QsRUFBQyxDQUNELEtBQUssQ0FBQyx5QkFBeUI7QUFDL0IsU0FBSyxZQUFZLFVBQVUscUJBQXFCO0FBRWhELFNBQUssa0JBQWtCO0FBQ3ZCLFNBQUssaUJBQWlCO0FBQ3RCLFdBQU87R0FDUCxFQUFDO0VBQ0g7Q0FDRDtDQUVELE9BQW9DO0FBQ25DLFNBQU8sS0FBSyxhQUFhLFVBQVU7Q0FDbkM7Q0FFRCxnQkFBeUI7QUFDeEIsU0FBTyxLQUFLLGFBQWEsVUFBVTtDQUNuQztDQUVELDRCQUEwRDtBQUN6RCxTQUFPLEtBQUs7Q0FDWjtDQUVELGtCQUFrQjtBQUNqQixPQUFLLGVBQWUsQ0FBRTtBQUN0QixPQUFLLDRCQUE0QixDQUFFO0FBRW5DLE9BQUssTUFBTSxTQUFTLEtBQUssWUFBWSxNQUNwQyxNQUFLLE1BQU0sV0FBVyxNQUFNLFNBQzNCLE1BQUssYUFBYSxLQUFLLFFBQVEsUUFBUTtDQUd6QztDQUVELGdCQUFnQkMsT0FBb0M7QUFDbkQsU0FBTyxLQUFLLGVBQWUsS0FBSztDQUNoQztDQUVELGlCQUEwQjtBQUN6QixTQUFPLEtBQUssaUJBQWlCLENBQUMsU0FBUztDQUN2QztDQUVELGlCQUFnQztBQUMvQixTQUFPLEtBQUssYUFBYSxNQUFNO0NBQy9CO0NBRUQsOEJBQW9EO0FBQ25ELFNBQU8sS0FBSztDQUNaO0NBRUQsd0JBQXdCQyxVQUF1QztFQUM5RCxNQUFNLGlCQUFpQixLQUFLO0VBQzVCLE1BQU0sb0JBQW9CLFNBQVMsU0FBUyxLQUFLLENBQUMsWUFBWSxRQUFRLGlCQUFpQixlQUFlO0FBRXRHLE1BQUksa0JBQ0gsUUFBTztBQUdSLFNBQU8sU0FBUyxTQUFTLFNBQVMsR0FBRyxhQUFhO0NBQ2xEO0NBRUQsOEJBQThCQyxjQUFzQjtBQUNuRCxPQUFLLDRCQUE0QixDQUFFO0VBQ25DLE1BQU0scUJBQXFCLGFBQWEsUUFBUSxpQkFBaUIsR0FBRztBQUVwRSxPQUFLLE1BQU0sV0FBVyxLQUFLLGFBQzFCLEtBQUksbUJBQW1CLFNBQVMsUUFBUSxDQUN2QyxNQUFLLDBCQUEwQixLQUFLLFFBQVE7QUFJOUMsT0FBSyxjQUFjLFlBQVksS0FBSyxLQUFLLFlBQVksT0FBTyxDQUFDLEdBQUcsTUFBTSxLQUFLLGlDQUFpQyxHQUFHLEVBQUUsQ0FBQztBQUNsSCxPQUFLLGVBQWU7QUFDcEIsT0FBSyxnQkFBZ0IsS0FBSyxZQUFZLE1BQU07Q0FDNUM7Q0FFRCxpQ0FBaUNSLFFBQTRCQyxRQUFvQztFQUNoRyxNQUFNLGFBQWEsS0FBSywwQkFBMEIsT0FBTyxHQUFHLEtBQUssMEJBQTBCLE9BQU87QUFFbEcsU0FBTyxlQUFlLElBQUksbUNBQW1DLFFBQVEsT0FBTyxHQUFHO0NBQy9FO0NBRUQsMEJBQTBCSyxPQUFtQztFQUM1RCxJQUFJLFVBQVU7QUFDZCxPQUFLLE1BQU0sS0FBSyxNQUFNLFNBQ3JCLEtBQUksS0FBSywwQkFBMEIsU0FBUyxFQUFFLFFBQVEsQ0FDckQ7QUFHRixTQUFPO0NBQ1A7Q0FFRCxPQUFPRyxPQUFxQjtBQUMzQixPQUFLLGVBQWU7RUFDcEIsTUFBTSxlQUFlLE1BQU0sTUFBTTtBQUVqQyxNQUFJLGFBQ0gsTUFBSyxnQkFBZ0Isb0JBQW9CLGNBQWMsS0FBSyxZQUFZLE1BQU0sQ0FBQztJQUUvRSxNQUFLLGdCQUFnQixLQUFLLFlBQVksTUFBTTtDQUU3QztDQUVELGdCQUFnQkMsUUFBeUI7RUFFeEMsTUFBTSxnQkFBZ0IsS0FBSyx1QkFBdUI7RUFDbEQsTUFBTSxZQUFZLGlCQUFpQixXQUFXLG9CQUFvQixJQUFJO0FBRXRFLE1BQUksYUFBYSxLQUFLLFlBQVksS0FBSyxpQkFBaUIsQ0FBQyxRQUFRO0dBQ2hFLE1BQU0sb0JBQW9CLEtBQUssaUJBQWlCLENBQUM7QUFDakQsUUFBSyxjQUFjLGtCQUFrQjtBQUNyQyxVQUFPO0VBQ1A7QUFFRCxTQUFPO0NBQ1A7Q0FFRCx3QkFBZ0M7RUFDL0IsTUFBTSxnQkFBZ0IsS0FBSyxlQUFlO0FBQzFDLE1BQUksaUJBQWlCLEtBQ3BCLFFBQU87QUFFUixTQUFPLEtBQUssaUJBQWlCLENBQUMsUUFBUSxjQUFjO0NBQ3BEO0NBRUQsdUJBQXVCQyxTQUFpQjtFQUN2QyxNQUFNLFFBQVEsS0FBSyxhQUFhLFFBQVEsUUFBUTtBQUVoRCxNQUFJLFFBQVEsR0FDWCxNQUFLLGFBQWEsT0FBTyxPQUFPLEVBQUU7Q0FFbkM7Q0FFRCxVQUFVO0FBQ1QsT0FBSyxpQkFBaUIscUJBQXFCLEtBQUsscUJBQXFCO0NBQ3JFO0NBRUQsYUFBYUMsWUFBNkM7QUFDekQsU0FBTyxLQUFLLGNBQWMsS0FBSyxzQkFBc0IsV0FBVztDQUNoRTtDQUVELFdBQVdOLE9BQW9DO0VBQzlDLE1BQU0sV0FBVyxLQUFLLGdCQUFnQixLQUFLLENBQUNPLGVBQWEsU0FBUyxNQUFNLGFBQWEsUUFBUUEsV0FBUyxNQUFNLENBQUMsQ0FBQztBQUU5RyxVQUFRLGFBQWEscUJBQXFCLEtBQUssZUFBZSxNQUFNLFNBQVMsT0FBTyxnQkFBZ0IsTUFBTTtDQUMxRztDQUVELGNBQWNDLFNBQXlEO0FBQ3RFLFNBQU8sS0FBVyxTQUFTLENBQUMsV0FBVztBQUN0QyxPQUFJLG1CQUFtQiwyQkFBMkIsT0FBTyxFQUN4RDtRQUFJLE9BQU8sY0FBYyxjQUFjLE9BQ3RDLFFBQU8sS0FBSyxjQUFjLEtBQUssMkJBQTJCLENBQUMsT0FBTyxnQkFBZ0IsT0FBTyxVQUFXLEVBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVTtBQUNySCxVQUFLLFlBQVksT0FBTyxNQUFNO0FBRTlCLFVBQUssT0FBTyxLQUFLLGFBQWE7SUFDOUIsRUFBQztTQUNRLE9BQU8sY0FBYyxjQUFjLE9BQzdDLFFBQU8sS0FBSyxjQUFjLEtBQUssMkJBQTJCLENBQUMsT0FBTyxnQkFBZ0IsT0FBTyxVQUFXLEVBQUMsQ0FBQyxLQUFLLENBQUMsaUJBQWlCO0FBQzVILFVBQUssWUFBWSxZQUFZLENBQUMsTUFBTSxTQUFTLGFBQWEsRUFBRSxFQUFFLE9BQU8sV0FBVyxDQUFDO0FBRWpGLFVBQUssWUFBWSxPQUFPLGFBQWE7QUFFckMsVUFBSyxPQUFPLEtBQUssYUFBYTtLQUM5QixNQUFNLG1CQUFtQixLQUFLLGVBQWU7QUFFN0MsU0FBSSxvQkFBb0IsU0FBUyxpQkFBaUIsS0FBSyxhQUFhLElBQUksQ0FDdkUsTUFBSyxjQUFjLGFBQWE7SUFFakMsRUFBQztTQUNRLE9BQU8sY0FBYyxjQUFjLFFBQVE7S0FDckQsTUFBTSxXQUFXLEtBQUssZUFBZTtBQUVyQyxTQUFJLFlBQVksU0FBUyxTQUFTLFNBQVMsRUFBRSxDQUFDLE9BQU8sZ0JBQWdCLE9BQU8sVUFBVyxFQUFDLENBQ3ZGLE1BQUssY0FBYyxLQUFLO0FBR3pCLFVBQUssWUFBWSxZQUFZLENBQUMsTUFBTSxTQUFTLGFBQWEsRUFBRSxFQUFFLE9BQU8sV0FBVyxDQUFDO0FBRWpGLFVBQUssT0FBTyxLQUFLLGFBQWE7SUFDOUI7O0VBRUYsRUFBQyxDQUFDLEtBQUssS0FBSztDQUNiO0FBQ0Q7QUFFRCxTQUFTLHlCQUF5QkMsZ0JBQThDWixjQUFnRTtBQUMvSSxRQUFPLEtBQVcsZ0JBQWdCLENBQUMsVUFBVSxhQUFhLFFBQVEsMkJBQTJCLE1BQU0sVUFBVSxjQUFjLENBQUMsQ0FBQyxLQUFLLENBQUMscUJBQ2xJLGlCQUFpQixNQUFNLENBQ3ZCO0FBQ0Q7Ozs7QUMvT0QsTUFBTSxxQkFBcUIsR0FBRyxHQUFHO0lBT3BCLHlCQUFOLE1BQStFO0NBQ3JGO0NBQ0E7Q0FFQSxZQUFZYSxPQUEyQztFQUN0RCxNQUFNLEVBQUUsaUJBQWlCLFdBQVcsaUJBQWlCLEdBQUcsTUFBTTtBQUM5RCxPQUFLLG1CQUFtQjtBQUV4QixPQUFLLFlBQVksQ0FBQ0MsU0FBMENDLHNCQUE0QztBQUN2RyxVQUFPLEtBQVcsU0FBUyxDQUFDLFdBQVc7QUFDdEMsUUFBSSxtQkFBbUIsYUFBYSxPQUFPLElBQUksT0FBTyxjQUFjLGNBQWMsUUFBUTtLQUN6RixJQUFJLFFBQVEsZ0JBQWdCLGNBQWMsVUFBVTtBQUVwRCxTQUFJLFNBQVMsU0FBUyxNQUFNLEtBQUssQ0FBQyxPQUFPLGdCQUFnQixPQUFPLFVBQVcsRUFBQyxDQUMzRSxXQUFVLHNCQUFzQixnQkFBZ0I7SUFFakQ7R0FDRCxFQUFDO0VBQ0Y7QUFFRCxrQkFBZ0Isa0JBQWtCLEtBQUssVUFBVTtDQUNqRDtDQUVELFdBQVc7QUFDVixPQUFLLGlCQUFpQixxQkFBcUIsS0FBSyxVQUFVO0NBQzFEO0NBRUQsS0FBS0YsT0FBcUQ7RUFDekQsTUFBTSxFQUFFLGlCQUFpQixXQUFXLGlCQUFpQixHQUFHLE1BQU07RUFDOUQsTUFBTSxVQUFVLGdCQUFnQixjQUFjLFlBQVk7QUFDMUQsU0FBTyxnQkFBRSxpQ0FBaUMsQ0FDekMsZ0JBQUUsY0FBYztHQUNmLE9BQU8sVUFBVSxxQkFBcUIsQ0FBQyxRQUFRLGdCQUFnQixHQUFHO0dBQ2xFLFVBQVU7SUFDVCxLQUFLO0lBQ0wsT0FBTztHQUNQO0dBQ0QsT0FBTyxNQUFNO0dBQ2IsWUFBWSw0QkFBNEI7RUFDeEMsRUFBQyxFQUNGLGdCQUFFLHFDQUFxQyxDQUN0QyxnQkFDQyxrREFDQSxFQUNDLFNBQVMsTUFBTSxVQUFVLHNCQUFzQixnQkFBZ0IsQ0FDL0QsR0FDRCxDQUNDLGdCQUFFLG9CQUFvQixVQUFVLFVBQVUsS0FBSyxJQUFJLGlCQUFpQixDQUFDLEVBQ3JFLGdCQUFFLHdCQUF3QixpQkFBaUIsZ0JBQWdCLFlBQVksQ0FBQyxDQUFDLEFBQ3pFLEVBQ0QsRUFDRCxnQkFBRSxvQ0FBb0M7SUFDcEMsT0FBTyxzQkFBc0IsR0FDM0IsZ0JBQUUsWUFBWTtJQUNkLE9BQU87SUFDUCxPQUFPLE1BQU0sVUFBVSxzQkFBc0IsZ0JBQWdCO0lBQzdELE1BQU0sTUFBTTtHQUNYLEVBQUMsR0FDRjtHQUNILGdCQUFFLFlBQVk7SUFDYixPQUFPO0lBQ1AsT0FBTyxNQUFNLEtBQUssaUJBQWlCLGlCQUFpQixVQUFVO0lBQzlELE1BQU0sTUFBTTtHQUNaLEVBQUM7R0FDRixnQkFBRSxZQUFZO0lBQ2IsT0FBTztJQUNQLE9BQU8sTUFBTSxVQUFVLHNCQUFzQixnQkFBZ0I7SUFDN0QsTUFBTSxNQUFNO0dBQ1osRUFBQztFQUNGLEVBQUMsQUFDRixFQUFDLEFBQ0YsRUFBQztDQUNGO0NBRUQsQUFBUSxpQkFBaUJHLGlCQUFrQ0MsV0FBeUM7RUFDbkcsTUFBTSxRQUFRLGdCQUFnQjtBQUM5QixZQUFVLHNCQUFzQixnQkFBZ0I7QUFFaEQsa0JBQWdCLFdBQVcsSUFBSSxPQUFPLEVBQUUsUUFBUSxLQUFLO0FBQ3BELE9BQUksV0FBVyxlQUFlLFFBQVE7SUFDckMsTUFBTSxRQUFRLE1BQU07QUFFcEIsUUFBSSxNQUNILE9BQU0scUJBQXFCLFlBQVksV0FBVyxDQUFDLEtBQU0sR0FBRSxLQUFLO0dBRWpFO0VBQ0QsRUFBQztDQUNGO0FBQ0Q7QUFFRCxTQUFTLGlCQUFpQkMsWUFBZ0M7QUFDekQsU0FBUSxXQUFXLFFBQW5CO0FBQ0MsT0FBSyxlQUFlLE9BQ25CLFFBQU8sS0FBSyxJQUFJLFdBQVc7QUFDNUIsT0FBSyxlQUFlLFNBQ25CLFNBQVEsV0FBVyxRQUFuQjtBQUNDLFFBQUssZ0JBQWdCLGVBQ3BCLFFBQU8sS0FBSyxJQUFJLGtDQUFrQztBQUNuRCxXQUNDLFFBQU8sS0FBSyxJQUFJLG9CQUFvQjtFQUNyQztBQUNGLE9BQUssZUFBZSxNQUNuQixRQUFPLEtBQUssSUFBSSxpQkFBaUI7QUFDbEMsVUFDQyxRQUFPO0NBQ1I7QUFDRDs7OztBQ3JIRCxrQkFBa0I7QUFDbEIsTUFBTSwrQkFBK0I7QUFDckMsTUFBTSxnQ0FBZ0M7QUFFL0IsU0FBUyx3QkFDZkMsUUFDQUMsZUFDQUMsV0FDQUMsaUJBQ0FDLFNBQ0FDLFlBQ087Q0FDUCxJQUFJQyx1QkFBbUM7Q0FFdkMsTUFBTSxrQkFBa0IsVUFBVSxtQkFBbUIsUUFBUSxlQUFlLFNBQVMsWUFBWSxNQUFNLHNCQUFzQixDQUFDO0FBRTlILFlBQVcsTUFBTTtBQUNoQix5QkFBdUIsMkJBQTJCLFdBQVcsaUJBQWlCLGdCQUFnQjtDQUM5RixHQUFFLHFCQUFxQjtBQUN4QjtBQUVELFNBQVMsMkJBQTJCSixXQUF5Q0ssaUJBQWtDSixpQkFBOEM7QUFDNUosUUFBTyxlQUNOLE1BQU0sb0JBQW9CLEVBQzFCLEVBQ0MsTUFBTSxNQUNMLGdCQUFFLHdCQUF3QjtFQUN6QjtFQUNBO0VBQ0E7Q0FDQSxFQUFDLENBQ0gsR0FDRCxnQkFDQSxXQUNBLG1CQUNBO0FBQ0Q7QUFFRCxTQUFTLHFCQUFxQjtBQUM3QixRQUFPO0VBQ04sUUFBUSxPQUFPLHlCQUF5QixHQUFHLEdBQUcsS0FBSyxLQUFLLEdBQUcsR0FBRyxLQUFLLEtBQUs7RUFFeEUsT0FBTyxPQUFPLHlCQUF5QixHQUFHLEdBQUcsS0FBSyxLQUFLLEdBQUcsR0FBRyxLQUFLLFlBQVk7RUFDOUUsT0FBTyxHQUFHLE9BQU8sc0JBQXNCLEdBQUcsZ0NBQWdDLDZCQUE2QjtFQUN2RyxRQUFRLFVBQVU7Q0FDbEI7QUFDRDs7Ozs7QUNvRE0sU0FBUyxzQkFDZkssT0FDQUMsd0JBQ0FDLHFCQUNBQyxRQUNBQyxlQUNBQyx3QkFDQUMsVUFDQUMsNEJBQ2tCO0FBQ2xCLFFBQU87RUFDTjtFQUNBLHdCQUF3QiwyQkFBTyx1QkFBdUI7RUFDdEQsZUFBZSwyQkFBZ0IsTUFBTTtFQUNyQyw4QkFBOEIsMkJBQU8sR0FBRztFQUN4QztFQUNBO0VBQ3dCO0VBQ3hCO0VBQ0E7Q0FDQTtBQUNEO0lBRVksYUFBTixNQUF1RDtDQUM3RCxBQUFRO0NBRVI7Q0FFQSxBQUFpQixzQkFBc0I7RUFDdEMsSUFBSSwyQkFBTyxHQUFHO0VBQ2QsSUFBSSwyQkFBTyxHQUFHO0VBQ2QsS0FBSywyQkFBTyxHQUFHO0NBQ2Y7Q0FFRDtDQUNBO0NBQ0E7Q0FDQSx5QkFBNEY7Q0FDNUY7Q0FDQSxBQUFRO0NBQ1IsQUFBUSw0QkFBa0QsSUFBSTtDQUM5RCxBQUFRO0NBQ1IsQUFBaUIsNkJBQXNDO0NBR3ZELEFBQVEseUJBQWlDO0NBRXpDLFlBQVlDLE9BQStCO0VBQzFDLE1BQU0sSUFBSSxNQUFNO0FBQ2hCLE9BQUssUUFBUTtBQUNiLE9BQUssc0JBQXNCLENBQUU7QUFDN0IsT0FBSyx3QkFBd0IsQ0FBRTtFQUMvQixNQUFNLFFBQVEsRUFBRTtBQUNoQixPQUFLLGdCQUFnQjtBQUNyQixPQUFLLGdCQUFnQixFQUFFO0FBQ3ZCLE9BQUssdUJBQXVCLEVBQUUsd0JBQXdCO0FBQ3RELE9BQUssNkJBQTZCLEVBQUU7QUFHcEMsT0FBSyxxQkFBcUIsTUFBTSxlQUFlLENBQUMsU0FBUyxNQUFNLGNBQWMsQ0FBQyxTQUFTO0FBRXZGLE9BQUssU0FBUyxJQUFJLE9BQ2pCLEtBQ0EsQ0FBQyxNQUFNLFlBQVk7R0FDbEIsTUFBTSxZQUFZLGNBQWMsaUJBQWlCLE1BQU0sRUFDdEQsdUJBQXVCLFdBQVcsS0FBSyxxQkFDdkMsRUFBQztBQUNGLFFBQUsseUJBQXlCLFVBQVU7QUFFeEMsUUFBSyx3QkFBd0IsVUFBVTtBQUN2QyxVQUFPLFVBQVU7RUFDakIsR0FDRDtFQUdELE1BQU0sa0JBQWtCLE1BQU07QUFDN0IsNEJBQXlCLEtBQUssT0FBTyxRQUFRLEVBQUUsS0FBSyxxQkFBcUIsTUFBTSxnQkFBZ0IsQ0FBQztBQUNoRyxTQUFNLHlCQUF5QixLQUFLO0FBQ3BDLG1CQUFFLFFBQVE7RUFDVjtBQUdELE9BQUssT0FBTyxZQUFZLFFBQVEsS0FBSyxNQUFNO0FBQzFDLFFBQUssT0FBTyxRQUFRLE1BQU0sU0FBUyxDQUFDO0dBRXBDLE1BQU0sWUFBWSxLQUFLLE9BQU8sUUFBUTtHQUN0QyxNQUFNLG9CQUFvQix3QkFBd0IsVUFBVTtBQUc1RCxPQUFJLGtCQUNILFdBQVUsVUFBVSxJQUFJLGdCQUFnQjtBQUd6QyxRQUFLLHFCQUFxQjtBQUcxQixPQUFJLGlCQUFpQixpQkFBaUIsUUFBUSxLQUFLLE9BQU8sUUFBUSxFQUFFO0lBQ25FLFlBQVk7SUFDWixXQUFXO0lBQ1gsU0FBUztHQUNULEVBQUM7QUFFRixRQUFLLE9BQU8sa0JBQWtCLE1BQU0sTUFBTSxRQUFRLDRCQUE0QixLQUFLLE9BQU8sUUFBUSxDQUFDLENBQUMsVUFBVSxDQUFDO0FBQy9HLFFBQUssT0FBTyxpQkFBaUIsY0FBYyxDQUFDLEVBQUUsUUFBeUIsS0FBSztJQUMzRSxNQUFNLFFBQVEsTUFBTSxLQUFLLE9BQU8sY0FBYyxNQUFNO0lBQ3BELE1BQU0sYUFBYSxNQUFNLE9BQU8sQ0FBQyxTQUFTLFFBQVEsS0FBSyxLQUFLLEtBQUssQ0FBQztBQUNsRSxTQUFLLFdBQVcsT0FDZixRQUFPO0lBRVIsTUFBTSxPQUFPLFdBQVcsSUFBSSxXQUFXO0FBQ3ZDLFFBQUksUUFBUSxLQUNYLFFBQU87SUFFUixNQUFNLFNBQVMsSUFBSTtBQUNuQixXQUFPLFNBQVMsTUFBTTtBQUNyQixTQUFJLE9BQU8sVUFBVSxRQUFRLG9CQUFvQixPQUFPLE9BQ3ZEO0tBRUQsTUFBTSxrQkFBa0IsQ0FBQyxlQUFlLEtBQUssTUFBTSxLQUFLLE1BQU0sSUFBSSxXQUFXLE9BQU8sUUFBUSxBQUFDO0FBQzdGLFdBQU0sWUFBWSxnQkFBZ0I7QUFDbEMsVUFBSyxtQkFBbUIsT0FBTyxnQkFBZ0I7SUFDL0M7QUFDRCxXQUFPLGtCQUFrQixLQUFLO0dBQzlCLEVBQUM7QUFFRixPQUFJLEVBQUUsY0FDTCxHQUFFLGNBQWMsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0I7QUFFOUMscUNBQWlDLEtBQUssUUFBUSxjQUFjO0dBQzVELEVBQUM7RUFFSCxFQUFDO0FBRUYsUUFBTSxjQUFjLElBQUksTUFBTSxnQkFBRSxRQUFRLENBQUM7QUFFekMsUUFBTSx3QkFBd0IsTUFBTTtHQUNuQyxJQUFJLGNBQWM7QUFDbEIsUUFBSyxNQUFNLGdCQUFnQixZQUFZLEtBQUssb0JBQW9CLENBQy9ELEtBQUksY0FBYyxDQUFDLE1BQU0sS0FBSyxHQUM3QixnQkFBZSxPQUFPLGNBQWMsQ0FBQyxNQUFNO0FBSTdDLE9BQUksZ0JBQWdCLEdBQ25CLE9BQU0sSUFBSSxVQUFVLEtBQUssZ0JBQWdCLHlCQUF5QixLQUFLLElBQUksd0JBQXdCLEdBQUcsWUFBWTtFQUVuSCxFQUFDO0VBQ0YsTUFBTSxTQUFTLEVBQUUsUUFBUTtBQUV6QixNQUFJLE1BQU0scUJBQXFCLEtBQUssaUJBQWlCLFNBQVMsTUFBTSxjQUFjLENBQUMsT0FDbEYsUUFBTyx1QkFBdUIsTUFBTTtBQUNuQyxRQUFLLE9BQU8sWUFBWSxRQUFRLEtBQUssTUFBTSxLQUFLLE9BQU8sT0FBTyxDQUFDO0VBQy9ELEVBQUM7RUFHSCxNQUFNQyxZQUF3QjtHQUM3QjtJQUNDLEtBQUssS0FBSztJQUNWLFdBQVc7SUFDWCxNQUFNLE1BQU0sS0FBSyxlQUFlO0lBQ2hDLE1BQU07R0FDTjtHQUNEO0lBQ0MsS0FBSyxLQUFLO0lBQ1YsV0FBVztJQUNYLE1BQU07SUFDTixNQUFNO0dBQ047R0FDRDtJQUNDLEtBQUssS0FBSztJQUNWLFdBQVc7SUFDWCxNQUFNO0lBQ04sTUFBTTtHQUNOO0dBQ0Q7SUFDQyxLQUFLLEtBQUs7SUFDVixXQUFXO0lBQ1gsTUFBTTtJQUNOLE1BQU07R0FDTjtFQUNEO0FBQ0QsT0FBSyxNQUFNLFlBQVksVUFDdEIsUUFBTyxZQUFZLFNBQVM7QUFFN0IsT0FBSyxPQUFPLFlBQVksUUFBUSxLQUFLLE1BQU07QUFDMUMsS0FBRSx1QkFBdUIsS0FBSyxPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWM7QUFDekQsU0FBSyx5QkFBeUI7QUFDOUIsb0JBQUUsUUFBUTtHQUNWLEVBQUM7RUFDRixFQUFDO0NBQ0Y7Q0FFRCxBQUFRLG9CQUFvQlQsT0FBc0JVLEtBQWE7RUFDOUQsTUFBTSxnQkFBZ0IsTUFBTSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsZUFBZSxlQUFlLFdBQVcsQ0FBQztFQUMvRixNQUFNLG1CQUFtQixjQUFjLEtBQUssQ0FBQyxlQUFlLFdBQVcsUUFBUSxJQUFJO0FBRW5GLE1BQUksb0JBQW9CLGVBQWUsaUJBQWlCLENBQ3ZELFNBQVEsZUFBZSxLQUFLLGlCQUFpQixDQUFDLE1BQU0sUUFBUSxlQUFlLE1BQU0sT0FBTyxRQUFRLDZCQUE2QixDQUFDLENBQUM7Q0FFaEk7Q0FFRCxLQUFLRixPQUF5QztFQUM3QyxNQUFNLElBQUksTUFBTTtBQUNoQixPQUFLLFFBQVE7RUFDYixNQUFNLEVBQUUsT0FBTyxHQUFHO0FBQ2xCLE9BQUssZ0JBQWdCO0VBRXJCLE1BQU0seUJBQXlCLE1BQU0sNEJBQTRCO0VBQ2pFLE1BQU0saUJBQWlCLE1BQU0sZ0JBQWdCLElBQUk7RUFDakQsTUFBTUcsMEJBQTZDO0dBQ2xELE9BQU87R0FDUCxXQUFXLENBQUMsR0FBRyxNQUFNO0FBQ3BCLE1BQUUsaUJBQWlCO0FBQ25CLFVBQU0saUJBQWlCLE1BQU0sZ0JBQWdCLENBQUM7R0FDOUM7R0FDRCxNQUFNLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxPQUFPLE1BQU07R0FDbEQsU0FBUyxNQUFNLGdCQUFnQjtHQUMvQixNQUFNLFdBQVc7RUFDakI7RUFDRCxNQUFNQyx5QkFBMEM7R0FDL0MsT0FBTztHQUNQLE9BQU8sQ0FBQyxJQUFJLFFBQVEsb0JBQW9CLE9BQU8sSUFBSSx1QkFBdUIsQ0FBQyxDQUFDLEtBQUssTUFBTSxnQkFBRSxRQUFRLENBQUM7R0FDbEcsTUFBTSxNQUFNO0dBQ1osTUFBTSxXQUFXO0VBQ2pCO0VBQ0QsTUFBTSxzQkFBc0IsUUFBUSxPQUFPLG1CQUFtQixDQUFDLE1BQU07QUFDckUsT0FBSyxPQUFPLGlCQUFpQixvQkFBb0I7RUFFakQsTUFBTSxnQkFBZ0IsT0FDcEIsc0JBQ0UsZ0JBQUUsY0FBYztHQUNoQixPQUFPO0dBQ1AsTUFBTSxNQUFNO0dBQ1osTUFBTSxXQUFXO0dBQ2pCLFNBQVMsRUFBRSxlQUFlO0dBQzFCLFdBQVcsQ0FBQyxHQUFHLE1BQU07QUFDcEIsTUFBRSxlQUFlLEVBQUUsZUFBZSxDQUFDO0FBRW5DLE1BQUUsaUJBQWlCO0FBQ25CLFNBQUssT0FBTyxPQUFPO0dBQ25CO0VBQ0EsRUFBQyxHQUNGO0VBRUosTUFBTUMsb0JBQW9DO0dBQ3pDLE9BQU87R0FDUCxXQUFXLE1BQU0sNEJBQTRCLE1BQU0sZ0JBQWdCLENBQUM7R0FDcEUsT0FBTyxNQUFNLFlBQVk7R0FDekIsU0FBUyxDQUFDLFFBQVEsTUFBTSxXQUFXLElBQUk7R0FDdkMsaUJBQWlCLE1BQ2hCLGdCQUFFLHVDQUF1QztJQUN4Qyx5QkFBeUIsZ0JBQUUsY0FBYyx3QkFBd0IsR0FBRztJQUNwRSxLQUFLLHlCQUF5QixLQUFLLDBCQUEwQixLQUFLLHVCQUF1QixHQUFHO0lBQzVGLGdCQUFFLFlBQVksdUJBQXVCO0lBQ3JDLGVBQWU7R0FDZixFQUFDO0VBQ0g7RUFFRCxNQUFNLHdCQUF3Qiw0QkFBNEIsT0FBTyxLQUFLLG9CQUFvQjtFQUUxRixJQUFJQyxrQ0FBMEQ7QUFFOUQsTUFBSSxRQUFRLE9BQU8sbUJBQW1CLENBQUMsZUFBZSxDQUNyRCxtQ0FBa0MsZUFBZTtHQUNoRCxpQkFBaUI7SUFDaEIsT0FBTztJQUNQLE1BQU0sTUFBTTtJQUNaLE1BQU0sV0FBVztHQUNqQjtHQUNELFlBQVksTUFBTSxDQUNqQjtJQUNDLE9BQU87SUFDUCxPQUFPLE1BQU07QUFDWixZQUFPLDJDQUEyRCxLQUFLLENBQUMsRUFBRSxzQ0FBc0MsS0FDL0cscUNBQXFDLFFBQVEsT0FBTyxtQkFBbUIsQ0FBQyxDQUN4RTtJQUNEO0dBQ0QsR0FDRDtJQUNDLE9BQU87SUFDUCxPQUFPLE1BQU07QUFDWixZQUFPLDJDQUEyRCxLQUFLLENBQUMsRUFBRSxzQ0FBc0MsS0FDL0cscUNBQXFDLFFBQVEsT0FBTyxtQkFBbUIsRUFBRSxNQUFNLHFDQUFxQyxDQUFDLENBQ3JIO0lBQ0Q7R0FDRCxDQUNEO0VBQ0QsRUFBQztBQUdILFNBQU8sZ0JBQ04sZ0VBQ0E7R0FDQyxTQUFTLENBQUNDLE1BQWtCO0FBQzNCLFFBQUksRUFBRSxXQUFXLEtBQUssT0FBTyxRQUFRLENBQ3BDLE1BQUssT0FBTyxPQUFPO0dBRXBCO0dBQ0QsWUFBWSxDQUFDQyxPQUFrQjtBQUU5QixPQUFHLGlCQUFpQjtBQUNwQixPQUFHLGdCQUFnQjtHQUNuQjtHQUNELFFBQVEsQ0FBQ0EsT0FBa0I7QUFDMUIsUUFBSSxHQUFHLGNBQWMsU0FBUyxHQUFHLGFBQWEsTUFBTSxTQUFTLEdBQUc7S0FDL0QsSUFBSSxjQUFjLGdCQUFnQixHQUFHLGFBQWEsTUFBTTtBQUN4RCxvQkFBZSxZQUFZLENBQ3pCLEtBQUssQ0FBQyxjQUFjO0FBQ3BCLFlBQU0sWUFBWSxVQUFpQjtBQUNuQyxzQkFBRSxRQUFRO0tBQ1YsRUFBQyxDQUNELE1BQU0sQ0FBQyxNQUFNO0FBQ2IsY0FBUSxJQUFJLEVBQUU7QUFDZCxhQUFPLE9BQU8sUUFBUSx5QkFBeUI7S0FDL0MsRUFBQztBQUNILFFBQUcsaUJBQWlCO0FBQ3BCLFFBQUcsZ0JBQWdCO0lBQ25CO0dBQ0Q7RUFDRCxHQUNEO0dBQ0MsZ0JBQUUsUUFBUSxLQUFLLHFCQUFxQixlQUFlLElBQUksS0FBSyxvQkFBb0IsSUFBSSxFQUFFLE9BQU8sQ0FBQztHQUM5RixnQkFDQyxRQUNBLGdCQUNDLGVBQ0EsRUFDQyxVQUFVLEtBQUssbUJBQ2YsR0FDRCxnQkFBRSxZQUFZLENBQ2IsS0FBSyxxQkFBcUIsZUFBZSxJQUFJLEtBQUssb0JBQW9CLElBQUksRUFBRSxPQUFPLEVBQ25GLEtBQUsscUJBQXFCLGVBQWUsS0FBSyxLQUFLLG9CQUFvQixLQUFLLEVBQUUsT0FBTyxBQUNyRixFQUFDLENBQ0YsQ0FDRDtHQUNELGdCQUFFLGlCQUFpQixDQUNsQixnQkFDQyxJQUNBLEVBQ0MsT0FBTyxFQUNOLGFBQWEsUUFDYixFQUNELEdBQ0QsZ0JBQUUsa0JBQWtCO0lBQ25CLE9BQU87SUFDUCxPQUFPLGdDQUFnQyxNQUFNLGdCQUFnQixNQUFNLE1BQU0sQ0FBQyxjQUFjLENBQ3RGLE1BQU0sQ0FDTixJQUFJLENBQUMsaUJBQWlCO0tBQ3RCLE1BQU07S0FDTixPQUFPO0lBQ1AsR0FBRTtJQUNKLGVBQWUsRUFBRSxNQUFNLFdBQVc7SUFDbEMsc0JBQXNCLDBCQUEwQixFQUFFLE1BQU0sZUFBZSxFQUFFLEVBQUUsTUFBTSxXQUFXLEVBQUUsTUFBTTtJQUNwRyx5QkFBeUIsQ0FBQ0MsY0FBc0IsTUFBTSxVQUFVLFVBQVU7SUFDMUUsZUFBZTtHQUNmLEVBQUMsQ0FDRixFQUNELGlCQUNHLGdCQUNBLFNBQ0E7SUFDQyxPQUFPLEVBQ04sYUFBYSxRQUNiO0lBQ0QsVUFBVSxDQUFDQyxZQUFVO0tBQ3BCLE1BQU0sVUFBVUEsUUFBTTtBQUN0QixhQUFRLE1BQU0sVUFBVTtBQUN4QixZQUFPLFdBQVcsSUFBSSxTQUFTLFFBQVEsR0FBRyxHQUFHLEtBQUssQ0FBQztJQUNuRDtJQUNELGdCQUFnQixDQUFDQSxZQUFVO0tBQzFCLE1BQU0sVUFBVUEsUUFBTTtBQUN0QixhQUFRLE1BQU0sVUFBVTtBQUN4QixZQUFPLFdBQVcsSUFBSSxTQUFTLFFBQVEsR0FBRyxHQUFHLEtBQUssQ0FBQztJQUNuRDtHQUNELEdBQ0QsQ0FDQyxnQkFDQyxjQUNBLGdCQUFFLGtCQUFrQjtJQUNuQixPQUFPO0lBQ1AsT0FBTyxNQUFNLDJDQUEyQyxDQUFDLElBQUksQ0FBQyxhQUFhO0FBQzFFLFlBQU87TUFDTixNQUFNLEtBQUssSUFBSSxTQUFTLE9BQU87TUFDL0IsT0FBTyxTQUFTO0tBQ2hCO0lBQ0QsRUFBQztJQUNGLGVBQWUsTUFBTSxxQ0FBcUM7SUFDMUQseUJBQXlCLENBQUNDLE1BQWMsTUFBTSxvQ0FBb0MsRUFBRTtJQUNwRixlQUFlO0dBQ2YsRUFBQyxDQUNGLEVBQ0Qsa0NBQ0csZ0JBQUUsNkRBQTZELGdCQUFFLFlBQVksZ0NBQWdDLENBQUMsR0FDOUcsSUFDSCxFQUNBLEdBQ0QsSUFDSCxFQUFDO0dBQ0YsaUJBQWlCLEtBQUssc0JBQXNCLEdBQUc7R0FDL0MsZ0JBQUUsUUFBUSxnQkFBRSxXQUFXLGtCQUFrQixDQUFDO0dBQzFDLGdCQUNDLDRDQUNBLHNCQUFzQixJQUFJLENBQUNDLFFBQU0sZ0JBQUUsa0JBQWtCQSxJQUFFLENBQUMsQ0FDeEQ7R0FDRCxNQUFNLGdCQUFnQixDQUFDLFNBQVMsSUFBSSxnQkFBRSxRQUFRLEdBQUc7R0FDakQsS0FBSyw0QkFBNEIsS0FBSyxNQUFNO0dBQzVDLEVBQUUsZUFBZSxHQUFHLEtBQUssY0FBYyxNQUFNLEdBQUc7R0FDaEQsZ0JBQ0MsbUVBQ0EsRUFDQyxTQUFTLE1BQU0sS0FBSyxPQUFPLE9BQU8sQ0FDbEMsR0FDRCxnQkFBRSxLQUFLLE9BQU8sQ0FDZDtHQUNELGdCQUFFLE1BQU07RUFDUixFQUNEO0NBQ0Q7Q0FFRCxBQUFRLDRCQUE0QkMsT0FBeUM7QUFDNUUsT0FBSyxLQUFLLHdCQUF3QixLQUFLLDhCQUE4QixLQUFLLDJCQUEyQixFQUNwRyxRQUFPO0VBR1IsTUFBTUMsYUFBZ0M7R0FDckMsT0FBTztHQUNQLE9BQU8sTUFBTTtBQUNaLFNBQUssNEJBQTRCLHNCQUFzQixLQUFLO0FBQzVELFNBQUsscUJBQXFCO0dBQzFCO0VBQ0Q7QUFFRCxTQUFPLGdCQUFFLFlBQVk7R0FDcEIsU0FBUztHQUNULE1BQU0sTUFBTTtHQUNaLFVBQVUsZ0JBQWdCLE1BQU0sTUFBTSxPQUFPLEdBQUcsU0FBUyxhQUFhO0dBQ3RFLFNBQVMsQ0FBQyxVQUFXO0VBQ3JCLEVBQUM7Q0FDRjtDQUVELEFBQVEsNEJBQTRCQyxRQUErQjtBQUNsRSxPQUFLLHVCQUF1QixXQUFXLHNCQUFzQixTQUFTLFdBQVcsc0JBQXNCO0VBRXZHLE1BQU0sWUFBWSxjQUFjLGFBQWEsS0FBSyxPQUFPLFNBQVMsRUFBRSxFQUNuRSxzQkFBc0IsS0FBSyxxQkFDM0IsRUFBQztBQUVGLE9BQUssT0FBTyxRQUFRLFVBQVUsS0FBSztDQUNuQztDQUVELEFBQVEsc0JBQXNCO0FBQzdCLE9BQUssc0JBQXNCLDRCQUE0QixLQUFLLE9BQU8sUUFBUSxFQUFFLEtBQUssY0FBYyxvQkFBb0IsQ0FBQyxLQUFLLE9BQU8sUUFBUTtHQUN4SSxNQUFNLHVCQUF1QixlQUFlLEVBQzNDLGFBQWEsTUFBTSxDQUNsQjtJQUNDLE9BQU87SUFDUCxPQUFPLE1BQU0sS0FBSyxvQkFBb0IsS0FBSyxlQUFlLElBQUk7R0FDOUQsQ0FDRCxFQUNELEVBQUM7QUFDRix3QkFBcUIsU0FBUyxNQUFNLEVBQUUsSUFBSTtFQUMxQyxFQUFDO0NBQ0Y7Q0FFRCxBQUFRLDBCQUEwQkMsd0JBQW9GO0FBQ3JILFNBQU8sZ0JBQUUsY0FBYztHQUN0QixPQUFPO0dBQ1AsU0FBUyx1QkFBdUIsU0FBUztHQUN6QyxXQUFXLE1BQU07QUFDaEIsUUFBSSx1QkFBdUIsU0FBUyxDQUNuQyx3QkFBdUIsUUFBUSxNQUFNO0tBQy9CO0FBQ04sNEJBQXVCLGVBQWUsTUFBTSw4QkFBOEIsS0FBSyxPQUFPLFVBQVUsQ0FBQztBQUNqRyw0QkFBdUIsUUFBUSxLQUFLO0FBQ3BDLDRCQUF1QixlQUFlLE1BQU0sTUFBTTtJQUNsRDtHQUNEO0dBQ0QsTUFBTSxNQUFNO0dBQ1osTUFBTSxXQUFXO0VBQ2pCLEVBQUM7Q0FDRjtDQUVELEFBQVEsY0FBY3hCLE9BQWdDO0FBR3JELFNBQU8sZ0JBQUUsU0FDUixFQUNDLGdCQUFnQixDQUFDLEVBQUUsS0FBSyxLQUFLLGVBQWUsSUFBSSxTQUFTLElBQW1CLE1BQU0sQ0FDbEYsR0FDRCxDQUNDLGdCQUFFLGlCQUFpQjtHQUNsQixRQUFRLEtBQUs7R0FDYix5QkFBeUIsT0FBTyxHQUM3QixPQUNBLENBQUN5QixVQUFpQixLQUFLLHdCQUF3QixPQUFPLEFBQUMsTUFBTSxPQUF1Qix1QkFBdUIsQ0FBQztHQUMvRyxtQkFBbUIsS0FBSyxnQkFDckIsQ0FDQTtJQUNDLE9BQU87SUFDUCxPQUFPLE1BQU07QUFDWixVQUFLLGVBQWU7SUFDcEI7SUFDRCxNQUFNLE1BQU07SUFDWixNQUFNLFdBQVc7R0FDakIsQ0FDQSxJQUNELENBQUU7RUFDTCxFQUFDLEVBQ0YsZ0JBQUUsUUFBUSxBQUNWLEVBQ0Q7Q0FDRDtDQUVELE1BQWMsd0JBQXdCekIsT0FBc0IwQixNQUE4QjtFQUN6RixNQUFNLFFBQVEsTUFBTSxvQkFBb0IsT0FBTyxNQUFNLHNCQUFzQjtBQUMzRSxPQUFLLFNBQVMsTUFBTSxXQUFXLEVBQUc7QUFDbEMsU0FBTyxNQUFNLEtBQUssbUJBQW1CLE9BQU8sTUFBTTtDQUNsRDtDQUVELE1BQWMsbUJBQW1CMUIsT0FBc0IyQixPQUErRDtBQUNySCxPQUFLLE1BQU0sUUFBUSxPQUFPO0dBQ3pCLE1BQU0sTUFBTSxrQkFBa0IsS0FBaUI7QUFDL0MsU0FBTSxtQkFBbUIsSUFBSSxJQUFJLEtBQUssSUFBSTtBQUMxQyxRQUFLLG9CQUFvQixLQUN4QixLQUFLLE9BQU8sWUFBWSxJQUFJLFdBQVc7SUFDdEMsS0FBSyxJQUFJO0lBQ1QsT0FBTztHQUNQLEVBQUMsQ0FDRjtFQUNEO0FBQ0Qsa0JBQUUsUUFBUTtDQUNWO0NBRUQsQUFBUSx1QkFBaUM7QUFDeEMsU0FBTyxnQkFDTix3Q0FDQTtHQUNDLFVBQVUsQ0FBQyxVQUFVLEtBQUssY0FBYyxNQUFNLEtBQW9CLEtBQUs7R0FDdkUsZ0JBQWdCLENBQUMsVUFBVSxLQUFLLGNBQWMsTUFBTSxLQUFvQixNQUFNO0VBQzlFLEdBQ0QsS0FBSyxjQUNILGVBQWUsQ0FDZixPQUFPLENBQUMsTUFBTSxFQUFFLFNBQVMsY0FBYyxTQUFTLENBQ2hELElBQUksQ0FBQyxjQUFjO0FBQ25CLFFBQUssS0FBSywwQkFBMEIsSUFBSSxVQUFVLFFBQVEsQ0FBRSxNQUFLLDBCQUEwQixJQUFJLFVBQVUsU0FBUyxNQUFNO0FBRXhILFVBQU8sZ0JBQUUsZUFBZTtJQUN2QixVQUFVLENBQUMsVUFBVSxLQUFLLGNBQWMsTUFBTSxLQUFvQixLQUFLO0lBQ3ZFLGdCQUFnQixDQUFDLFVBQVUsS0FBSyxjQUFjLE1BQU0sS0FBb0IsTUFBTTtJQUM5RSxPQUFPLEtBQUssZUFBZSxxQkFBcUIsRUFBRSxPQUFPLFVBQVUsUUFBUyxFQUFDO0lBQzdFLE9BQU8sS0FBSyxjQUFjLFlBQVksVUFBVSxRQUFRO0lBQ3hELGtCQUFrQixLQUFLLGNBQWMsb0JBQW9CLFVBQVU7SUFDbkUsUUFBUTtJQUNSLGdCQUFnQixhQUFhO0lBQzdCLFNBQVMsQ0FBQyxRQUFRLEtBQUssY0FBYyxZQUFZLFVBQVUsU0FBUyxJQUFJO0dBQ3hFLEVBQUM7RUFDRixFQUFDLENBQ0g7Q0FDRDtDQUVELEFBQVEscUJBQXFCQyxPQUF1QkMsV0FBMkJ2QixVQUF5QztFQUN2SCxNQUFNLFFBQ0w7R0FDQyxJQUFJO0dBQ0osSUFBSTtHQUNKLEtBQUs7RUFDTCxFQUNBO0FBRUYsU0FBTyxnQkFBRSx5QkFBeUI7R0FDakM7R0FDQSxNQUFNLFdBQVc7R0FDakIsZUFBZSxDQUFDLFNBQVMsVUFBVSxLQUFLO0dBQ3hDLFlBQVksS0FBSyxjQUFjLGlCQUFpQixNQUFNO0dBQ3RELGtCQUFrQixPQUFPLFNBQVMsU0FBUztBQUMxQyxRQUFJO0FBQ0gsV0FBTSxLQUFLLGNBQWMsYUFBYSxPQUFPO01BQUU7TUFBUztLQUFNLEVBQUM7SUFDL0QsU0FBUSxHQUFHO0FBQ1gsU0FBSSxlQUFlLEVBQUUsRUFBRSxDQUV0QixXQUFVLGFBQWEscUJBQ3ZCLE9BQU0sT0FBTyxRQUFRLHNCQUFzQjtJQUUzQyxPQUFNO0lBRVA7R0FDRDtHQUNELG9CQUFvQixDQUFDLFlBQVksS0FBSyxjQUFjLHlCQUF5QixTQUFTLE1BQU07R0FDNUYsa0NBQWtDLENBQUMsWUFBWTtJQUM5QyxNQUFNLFlBQVksS0FBSyxjQUFjLGFBQWEsT0FBTyxRQUFRO0FBQ2pFLFdBQU8sS0FBSyxrQ0FBa0MsV0FBVyxNQUFNO0dBQy9EO0dBQ0QsV0FBVyxLQUFLLGNBQWMsT0FBTyx3QkFBd0I7R0FDN0QsaUJBQ0MsVUFBVSxlQUFlLE1BQU0sS0FBSyxjQUFjLE9BQU8sd0JBQXdCLEdBQzlFLGdCQUNBLElBQ0EsZ0JBQUUsY0FBYztJQUNmLE9BQU87SUFDUCxNQUFNLFVBQVU7SUFDaEIsTUFBTSxXQUFXO0lBQ2pCLFNBQVMsS0FBSztJQUNkLFdBQVcsQ0FBQyxHQUFHLE1BQU07QUFDcEIsT0FBRSxpQkFBaUI7QUFDbkIsVUFBSyxzQkFBc0IsS0FBSztJQUNoQztHQUNELEVBQUMsQ0FDRCxHQUNEO0dBQ0o7RUFDQSxFQUFDO0NBQ0Y7Q0FFRCxNQUFjLGtDQUFrQ3dCLFdBQWdDRixPQUFzRDtFQUNySSxNQUFNLEVBQUUsUUFBUSxjQUFjLEdBQUcsS0FBSztFQUV0QyxNQUFNLHlCQUF5QixRQUFRLE9BQU8sbUJBQW1CLENBQUMsZ0JBQWdCLEtBQUssUUFBUSxPQUFPLFVBQVUsWUFBWSxnQkFBZ0I7RUFFNUksTUFBTSxrQkFBa0IsUUFBUSxPQUFPLG1CQUFtQixDQUFDLGdCQUFnQjtFQUUzRSxNQUFNLHlCQUF5QixDQUFDRyxxQkFBeUI7R0FDeEQsTUFBTSxjQUFjLFVBQVU7QUFFOUIsZ0JBQWEsa0JBQWtCLENBQUMsS0FBSyxDQUFDQyxrQkFBMEI7QUFDL0QsU0FBSyxjQUFlO0lBQ3BCLE1BQU1DLEtBQWMsQ0FBQyxlQUFlLGdCQUFpQjtBQUNyRCxXQUFPLEtBQUssZ0JBQWdCLEdBQUcsQ0FBQyxLQUFLLENBQUNDLFlBQXFCO0FBQzFELFNBQUksUUFBUSxjQUFjLEtBQUssQ0FBQyxPQUFPLFdBQVcsR0FBRyxTQUFTLFlBQVksQ0FBQyxFQUFFO0FBQzVFLGdCQUFVLFFBQVEsc0JBQXNCLFFBQVEsQ0FBQztBQUNqRCxnQkFBVSxXQUFXLFFBQVE7S0FDN0IsTUFDQSxNQUFLLGNBQWMsZ0JBQWdCLFdBQVcsT0FBTyxNQUFNO0lBRTVELEVBQUM7R0FDRixFQUFDO0VBQ0Y7RUFFRCxNQUFNQyxpQkFBNEMsQ0FBRTtBQUVwRCxNQUFJLHVCQUNILEtBQUksVUFBVSxXQUFXLFVBQVUsUUFBUSxJQUMxQyxnQkFBZSxLQUFLO0dBQ25CLE9BQU87R0FDUCxPQUFPLE1BQU07QUFDWixXQUFPLDZCQUFnQyxLQUFLLENBQUMsRUFBRSxlQUFlLEtBQUssSUFBSSxjQUFjLFFBQVEsVUFBVSxTQUFTLE1BQU0sQ0FBQztHQUN2SDtFQUNELEVBQUM7SUFFRixnQkFBZSxLQUFLO0dBQ25CLE9BQU87R0FDUCxPQUFPLE1BQU07QUFFWixpQkFBYSxrQkFBa0IsQ0FBQyxLQUFLLENBQUNDLGtCQUFzQjtLQUMzRCxNQUFNLGFBQWEsaUJBQWlCLFFBQVEsT0FBTyxtQkFBbUIsQ0FBQyxNQUFNLFVBQVUsU0FBUyxVQUFVLEtBQUs7QUFDL0csWUFBTyw2QkFBZ0MsS0FBSyxDQUFDLEVBQUUsZUFBZSxLQUFLO0FBRWxFLFVBQUksY0FBYyxRQUFRLFlBQVksY0FBYyxjQUFjLEVBQUUsd0JBQXdCLE1BQU07S0FDbEcsRUFBQztJQUNGLEVBQUM7R0FDRjtFQUNELEVBQUM7QUFJSixNQUFJLGdCQUNILGdCQUFlLEtBQUs7R0FDbkIsT0FBTztHQUNQLE9BQU8sTUFBTSxLQUFLLGNBQWMsZ0JBQWdCLFdBQVcsT0FBTyxNQUFNO0VBQ3hFLEVBQUM7QUFHSCxTQUFPO0NBQ1A7Q0FFRCxBQUFRLGdCQUFnQjtBQUN2QixNQUFJLEtBQUssY0FDUixNQUFLLGNBQWMsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0I7QUFDakQsNkJBQTBCLGVBQWUsS0FBSyxRQUFRLE1BQU0sS0FBSyxPQUFPLGlCQUFpQixDQUFDO0VBQzFGLEVBQUM7Q0FFSDtDQUVELEFBQVEsY0FBY0MsWUFBeUJDLFFBQW1DO0VBQ2pGLElBQUksY0FBYyxXQUFXO0FBQzdCLFNBQU8sV0FBVyxJQUFJLFlBQVksU0FBUyxPQUFPLEdBQUcsWUFBWSxHQUFHLE9BQU8sYUFBYSxFQUFFLENBQUMsQ0FBQyxLQUFLLE1BQU07QUFDdEcsY0FBVyxNQUFNLFNBQVM7RUFDMUIsRUFBQztDQUNGO0FBQ0Q7Ozs7Ozs7OztBQVVELGVBQWUsdUJBQXVCdEMsT0FBc0IsdUJBQXVCLE9BQU8sNkJBQTZCLE9BQXdCO0NBQzlJLElBQUl1QztDQUNKLElBQUlDO0NBRUosTUFBTSxPQUFPLENBQUNDLGVBQXdCLFNBQVM7RUFDOUMsTUFBTSxjQUFjLE1BQU0sVUFBVSxNQUFNLFdBQVcsS0FBSztBQUUxRCxNQUFJLGFBQ0gsUUFBTyxtQkFBbUIsWUFBWSxZQUFZO0lBRWxELFFBQU87Q0FFUjtDQUVELE1BQU0sT0FBTyxZQUFZO0FBQ3hCLE1BQUksTUFBTSxpQkFBaUIsSUFBSSxNQUFNLDRCQUE0QixJQUFJLE1BQU0sZ0JBQWdCLEVBQUU7QUFDNUYsU0FBTSxPQUFPLFFBQVEsa0RBQWtEO0FBQ3ZFO0VBQ0E7QUFFRCxNQUFJO0dBQ0gsTUFBTSxVQUFVLE1BQU0sTUFBTSxLQUFLLFdBQVcsTUFBTSxPQUFPLFNBQVMsbUJBQW1CO0FBQ3JGLE9BQUksU0FBUztBQUNaLGFBQVM7QUFDVCxXQUFPLE9BQU87QUFFZCxVQUFNLHFCQUFxQjtHQUMzQjtFQUNELFNBQVEsR0FBRztBQUNYLE9BQUksYUFBYSxVQUNoQixlQUFjLEVBQUU7SUFFaEIsT0FBTTtFQUVQO0NBQ0Q7Q0FHRCxNQUFNQyxjQUE0QyxDQUFFO0NBRXBELE1BQU0sVUFBVSxNQUFNO0FBQ3JCLFFBQU0sU0FBUztBQUNmLE1BQUksbUJBQW9CLG9CQUFtQixTQUFTO0FBQ3BELE9BQUssTUFBTSxjQUFjLFlBQ3hCLFlBQVcsU0FBUztDQUVyQjtDQUVELE1BQU0sV0FBVyxNQUFNO0VBQ3RCLElBQUksYUFBYSwyQkFBbUIsRUFBRSxRQUFRLGVBQWUsT0FBUSxFQUFDO0FBQ3RFLE1BQUksTUFBTSxnQkFBZ0IsQ0FDekIsTUFBSyxNQUFNLENBQ1QsS0FBSyxNQUFNLFdBQVcsRUFBRSxRQUFRLGVBQWUsTUFBTyxFQUFDLENBQUMsQ0FDeEQsTUFBTSxDQUFDLE1BQU07R0FDYixNQUFNLFNBQVMsZUFBZSxFQUFFLEdBQUcsZ0JBQWdCLGlCQUFpQixnQkFBZ0I7QUFFcEYsY0FBVztJQUFFLFFBQVEsZUFBZTtJQUFVO0dBQVEsRUFBQztBQUl2RCxPQUFJLFdBQVcsZ0JBQWdCLFFBQzlCLEtBQUksYUFBYSxVQUNoQixlQUFjLEVBQUU7SUFFaEIsT0FBTTtFQUdSLEVBQUMsQ0FDRCxRQUFRLE1BQU0sZ0JBQUUsUUFBUSxDQUFDO1VBQ2hCLE1BQU0sT0FBTztBQUV4QixZQUFTO0FBQ1QsVUFBTyxPQUFPO0FBQ2Q7RUFDQSxNQUVJLGNBQWEsMkJBQW1CLEVBQUUsUUFBUSxlQUFlLE1BQU8sRUFBQztBQUN0RSwwQkFBd0IsUUFBUSxPQUFPLFlBQVksb0JBQW9CLFFBQVEsaUJBQWlCLFNBQVMsV0FBVztDQUNwSDtDQUVELElBQUkseUJBQXlCLE1BQU0sQ0FBRTtDQUVyQyxNQUFNQyxpQkFBdUM7RUFDNUMsTUFBTSxDQUNMO0dBQ0MsT0FBTztHQUNQLE9BQU8sTUFBTSxVQUFVO0dBQ3ZCLE1BQU0sV0FBVztFQUNqQixDQUNEO0VBQ0QsT0FBTyxDQUNOO0dBQ0MsT0FBTztHQUNQLE9BQU8sTUFBTTtBQUNaLFVBQU07R0FDTjtHQUNELE1BQU0sV0FBVztFQUNqQixDQUNEO0VBQ0QsUUFBUSwwQkFBMEIsTUFBTSxxQkFBcUIsQ0FBQztFQUM5RCxRQUFRLE1BQU07QUFDYixPQUFJLFdBQVcsQ0FFZCwwQkFBeUIsYUFBYSx1QkFBdUIsTUFBTSxDQUFFLEVBQUM7U0FDNUQsV0FBVyxDQUVyQiwwQkFBeUIsYUFBYSx1QkFBdUIsTUFBTTtBQUNsRSxjQUFVO0dBQ1YsRUFBQztFQUVIO0VBQ0QsUUFBUSxNQUFNO0FBQ2IsMkJBQXdCO0VBQ3hCO0NBQ0Q7Q0FDRCxNQUFNLHFCQUNMLFFBQVEsT0FBTyx3QkFBd0IsSUFBSSxPQUFPLGlCQUFpQixHQUNoRSxJQUFJLG1CQUFtQixRQUFRLGlCQUFpQixRQUFRLFFBQVEsUUFBUSxnQkFDeEU7Q0FFSixNQUFNLGlDQUFpQyxPQUFPQyxXQUFtQjtBQUNoRSxNQUFJLFFBQVEsT0FBTyx3QkFBd0IsRUFBRTtHQUM1QyxNQUFNLFdBQVcsTUFBTSxRQUFRLE9BQU8sbUJBQW1CLENBQUMsY0FBYztBQUV4RSxPQUNDLE9BQU8saUJBQWlCLElBQ3hCLHNCQUNBLFFBQVEsT0FBTyxtQkFBbUIsQ0FBQyx3QkFBd0IsQ0FBQyxTQUFTLEtBQ3JFLGtDQUFrQyxVQUFVLFlBQVksY0FBYyxFQUNyRTtJQUNELE1BQU0scUJBQXFCLElBQUksbUJBQW1CLFFBQVEsaUJBQWlCLFFBQVEsY0FBYyxRQUFRLE9BQU8sbUJBQW1CO0FBQ25JLFVBQU0sbUJBQW1CLE1BQU07QUFHL0IsZ0JBQVksS0FBSyxtQkFBbUI7SUFFcEMsTUFBTSx5QkFBeUIsbUNBQW1DLG9CQUFvQixvQkFBb0IsT0FBTztBQUNqSCxXQUFPLGtCQUFrQix1QkFBdUI7QUFDaEQsV0FBTztHQUNQLE1BQ0EsUUFBTztFQUVSLE1BQ0EsUUFBTztDQUVSO0FBRUQsbUJBQWtCLHNCQUNqQixPQUNBLHNCQUNBLE1BQU0sY0FBYyxDQUFDLFdBQVcsR0FDaEMsTUFBTSxRQUNOLG9CQUNBLGdDQUNBLE1BQU0sUUFBUSx1QkFBdUIsRUFDckMsMkJBQ0E7Q0FDRCxNQUFNbkMsWUFBd0I7RUFDN0I7R0FDQyxLQUFLLEtBQUs7R0FDVixNQUFNLE1BQU07QUFDWCxjQUFVO0dBQ1Y7R0FDRCxNQUFNO0VBQ047RUFDRDtHQUNDLEtBQUssS0FBSztHQUNWLFdBQVc7R0FDWCxNQUFNLE1BQU07QUFDWCxVQUFNLENBQUMsTUFBTSxRQUFRLFdBQVcsY0FBYyxDQUFDO0dBQy9DO0dBQ0QsTUFBTTtFQUNOO0VBQ0Q7R0FDQyxLQUFLLEtBQUs7R0FDVixXQUFXO0dBQ1gsT0FBTztHQUNQLE1BQU0sTUFBTTtBQUNYLFVBQU07R0FDTjtHQUNELE1BQU07RUFDTjtFQUNEO0dBQ0MsS0FBSyxLQUFLO0dBQ1YsV0FBVztHQUNYLE1BQU0sTUFBTTtBQUNYLFVBQU07R0FDTjtHQUNELE1BQU07RUFDTjtDQUNEO0FBQ0QsVUFBUyxPQUFPLFdBQVcsZ0JBQWdCLFlBQVksZ0JBQWdCO0FBQ3ZFLFFBQU8sZ0JBQWdCLE1BQU0sVUFBVSxDQUFDO0FBRXhDLE1BQUssSUFBSSxZQUFZLFVBQ3BCLFFBQU8sWUFBWSxTQUFTO0FBRzdCLFFBQU87QUFDUDtBQVNNLGVBQWUsY0FBY29DLGdCQUFnRDtBQUduRixPQUFNLG9CQUFvQixRQUFRLFFBQVEsTUFBTTtDQUNoRCxNQUFNLEVBQUUsOENBQXNCLEdBQUcsTUFBTSxPQUFPO0NBQzlDLE1BQU0sWUFBWSx1QkFBcUIsSUFBSSxRQUFRLE9BQU8sbUJBQW1CLENBQUMsTUFBTTtDQUNwRixNQUFNLG9CQUFvQixNQUFNLCtCQUErQixlQUFlO0FBQzlFLFFBQU8sMEJBQTBCLGtCQUFrQixnQkFBZ0IsQ0FBRSxHQUFFLElBQUksVUFBVTtBQUNyRjtBQUVELGVBQWUsaUNBQWlDN0MsT0FBc0I4QyxlQUF3QjtDQUM3RixJQUFJO0NBQ0osTUFBTSxlQUFlLE1BQU0saUJBQWlCO0FBRTVDLE1BQUssYUFDSixnQkFBZTtFQUNkLDRCQUE0QjtFQUc1QixzQkFBc0I7Q0FDdEI7S0FDSztFQUNOLE1BQU0sb0JBQW9CLE1BQU0sUUFBUSxhQUFhLHFCQUFxQixhQUFhLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQ0MsTUFBZTtBQUM1SCxXQUFRLElBQUksc0NBQXNDLEVBQUU7QUFDcEQsVUFBTyxrQkFBa0I7RUFDekIsRUFBQztFQUVGLElBQUk7QUFDSixNQUFJLGFBQWEsZUFBZSxLQUMvQix1QkFBc0IsYUFBYSxlQUFlLHlCQUF5QjtLQUNyRTtHQUNOLE1BQU0sY0FBYyxNQUFNLFFBQVEsV0FBVyxvQkFBb0IsYUFBYTtBQUM5RSx5QkFBc0IsWUFBWSxlQUFlLHlCQUF5QjtFQUMxRTtBQUVELE1BQUksc0JBQXNCLGtCQUFrQixTQUFVLHNCQUFzQixrQkFBa0IsUUFBUSxNQUFNLHNCQUFzQixDQUNqSSxnQkFBZTtHQUdkLDRCQUE0QixzQkFBc0Isa0JBQWtCO0dBQ3BFLHNCQUFzQjtFQUN0QjtTQUNTLHNCQUFzQixrQkFBa0IsU0FBUyxvQkFDM0QsZ0JBQWU7R0FDZCw0QkFBNEI7R0FDNUIsc0JBQXNCO0VBQ3RCO0lBRUQsZ0JBQWU7R0FDZCw0QkFBNEI7R0FDNUIsc0JBQXNCO0VBQ3RCO0NBRUY7QUFFRCxRQUFPO0FBQ1A7QUFFTSxlQUFlLHdCQUNyQkMsTUFDQUMsc0JBQ0FDLGNBQ0FDLGdCQUNrQjtDQUNsQixNQUFNLG9CQUFvQixNQUFNLCtCQUErQixlQUFlO0NBQzlFLE1BQU0sUUFBUSxNQUFNLFFBQVEsY0FBYyxrQkFBa0IsZ0JBQWdCLGtCQUFrQixrQkFBa0I7QUFDaEgsT0FBTSxNQUFNLGVBQWUsTUFBTSxhQUFhO0NBRTlDLE1BQU0scUJBQXFCLE1BQU0saUNBQWlDLE9BQU8scUJBQXFCO0FBQzlGLFFBQU8sdUJBQXVCLE9BQU8sb0JBQW9CLHNCQUFzQixvQkFBb0IsMkJBQTJCO0FBQzlIO0FBRU0sZUFBZSx1QkFDckJDLE1BQ0FDLGFBQ0FDLGFBQ0FKLGNBQ0FELHNCQUNBRSxnQkFDa0I7Q0FDbEIsTUFBTSxvQkFBb0IsTUFBTSwrQkFBK0IsZUFBZTtDQUM5RSxNQUFNLFFBQVEsTUFBTSxRQUFRLGNBQWMsa0JBQWtCLGdCQUFnQixrQkFBa0Isa0JBQWtCO0FBQ2hILE9BQU0sTUFBTSxjQUFjLE1BQU0sYUFBYSxhQUFhLGFBQWE7Q0FDdkUsTUFBTSxxQkFBcUIsTUFBTSxpQ0FBaUMsT0FBTyxxQkFBcUI7QUFDOUYsUUFBTyx1QkFBdUIsT0FBTyxvQkFBb0Isc0JBQXNCLG9CQUFvQiwyQkFBMkI7QUFDOUg7QUFFTSxlQUFlLHVCQUF1QkksV0FBbUJDLGNBQXVCTCxnQkFBaUQ7Q0FDdkksTUFBTSxvQkFBb0IsTUFBTSwrQkFBK0IsZUFBZTtDQUM5RSxNQUFNLFNBQVMsZUFBZSxVQUFVO0NBQ3hDLElBQUlNLFlBQTBCLENBQUU7QUFFaEMsS0FBSSxPQUFPLFFBQVE7RUFDbEIsTUFBTSxTQUFTLE9BQU87QUFFdEIsTUFBSSxXQUFXLEVBQUU7R0FDaEIsTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLE9BQU8sSUFBSSxDQUFDLFFBQVEsUUFBUSxRQUFRLGFBQWEsSUFBSSxDQUFDLENBQUM7QUFDdkYsZUFBWSxNQUFNLE9BQU8sVUFBVTtFQUNuQztFQUVELE1BQU0sa0JBQ0wsVUFBVSxXQUFXLEtBQ3BCLE1BQU0sT0FBTyxRQUFRLHlCQUF5QixzQkFBc0IsTUFDcEUsVUFBVSxJQUFJLENBQUMsSUFBSSxNQUNsQixnQkFDQyxnQ0FDQSxFQUNDLE9BQU8sT0FBTyxHQUNkLEdBQ0QsR0FBRyxLQUNILENBQ0QsQ0FDRDtBQUVGLE1BQUksaUJBQWlCO0dBQ3BCLE1BQU0sa0JBQWtCLG9CQUFvQixVQUFVO0FBQ3RELGVBQVksZ0JBQWdCO0FBRTVCLE9BQUksZ0JBQWdCLFlBQVksU0FBUyxFQUN4QyxPQUFNLE9BQU8sUUFBUSx3QkFBd0IsTUFBTSxnQkFBZ0IsWUFBWSxJQUFJLENBQUMsU0FBUyxnQkFBRSwwQkFBMEIsS0FBSyxDQUFDLENBQUM7RUFFakksTUFDQSxPQUFNLElBQUksZUFBZTtDQUUxQjtBQUVELFFBQU8sMEJBQ04sa0JBQWtCLGdCQUNsQixPQUFPLFlBQ1AsT0FBTyxXQUFXLElBQ2xCLHFCQUFxQixPQUFPLFFBQVEsSUFBSSxRQUFRLE9BQU8sbUJBQW1CLENBQUMsTUFBTSxFQUNqRixXQUNBLGNBQ0EsV0FDQSxLQUNBO0FBQ0Q7QUFFTSxlQUFlLDBCQUNyQlosZ0JBQ0FhLFlBQ0FDLFNBQ0FDLFVBQ0FDLGFBQ0FDLGNBQ0FDLG1CQUNBQyxxQkFDa0I7Q0FDbEIsTUFBTSxvQkFBb0IsTUFBTSxRQUFRLGFBQWEscUJBQXFCLGVBQWUsaUJBQWlCO0FBQzFHLFFBQU8sUUFDTCxjQUFjLGdCQUFnQixrQkFBa0IsQ0FDaEQsS0FBSyxDQUFDLFVBQVUsTUFBTSxpQkFBaUIsWUFBWSxTQUFTLFVBQVUsYUFBYSxjQUFjLG1CQUFtQixvQkFBb0IsQ0FBQyxDQUN6SSxLQUFLLENBQUMsVUFBVSx1QkFBdUIsTUFBTSxDQUFDO0FBQ2hEO0FBRU0sU0FBUywwQkFBMkM7QUFDMUQsUUFBTyxPQUFPLDZCQUErQyxLQUFLLENBQUMsRUFBRSxhQUFhLEtBQUs7QUFDdEYsU0FDQyxhQUNBLGFBQ0EsUUFDQyxjQUFjLE9BQU8sZUFBZSxDQUFDLEtBQ3JDLHdCQUF3QixJQUFJLGNBQWMsS0FDMUMsaUJBQWlCLGFBQWEsQ0FBQyxLQUMvQixzQkFBc0IsVUFBVSxVQUFVO0NBRTVDLEVBQUM7QUFDRjtBQVNNLGVBQWUsaUJBQWlCTCxVQUFrQixJQUFJUixnQkFBa0Q7QUFDOUcsS0FBSSxRQUFRLE9BQU8sbUJBQW1CLENBQUMsa0JBQWtCLEVBQUU7RUFDMUQsTUFBTSxvQkFBb0IsTUFBTSwrQkFBK0IsZUFBZTtFQUM5RSxNQUFNLGFBQWEsRUFDbEIsSUFBSSxDQUNIO0dBQ0MsTUFBTTtHQUNOLFNBQVM7RUFDVCxDQUNELEVBQ0Q7RUFDRCxNQUFNLFlBQVksTUFBTSx5QkFBeUI7RUFDakQsTUFBTSxTQUFTLE1BQU0sMEJBQTBCLGtCQUFrQixnQkFBZ0IsWUFBWSxTQUFTLFVBQVU7QUFDaEgsU0FBTyxNQUFNO0FBQ2IsU0FBTztDQUNQLE1BQ0EsUUFBTyxPQUFPLDBCQUNaLEtBQUssQ0FBQyxFQUFFLGFBQWEsS0FBSztFQUMxQixNQUFNLFVBQVUsS0FBSyxJQUFJLG9CQUFvQixFQUM1QyxPQUFPLFlBQVksR0FBRyxLQUFLLENBQzNCLEVBQUM7RUFDRixNQUFNLFFBQVEsS0FBSyxJQUFJLDJCQUEyQjtBQUNsRCxTQUFPLE9BQU8sU0FBUyxPQUFPLFFBQVE7Q0FDdEMsRUFBQyxDQUNELEtBQUssQ0FBQyxZQUFZO0FBQ2xCLE1BQUksUUFDSCxRQUFPLHdDQUEwRCxLQUFLLENBQUMsVUFBVSxNQUFNLGtCQUFrQixRQUFRLE9BQU8sQ0FBQztDQUUxSCxFQUFDLENBQ0QsS0FBSyxNQUFNLE1BQU07QUFFcEI7QUFPTSxlQUFlLGdCQUFnQmMsY0FBc0I7Q0FDM0QsTUFBTSxvQkFBb0IsTUFBTSwrQkFBK0IsS0FBSztDQUNwRSxNQUFNLFdBQVcsUUFBUSxPQUFPLG1CQUFtQixDQUFDLGNBQWM7Q0FDbEUsTUFBTSxPQUFPLEtBQUssSUFBSSwwQkFBMEI7RUFDL0Msc0JBQXNCO0VBQ3RCLGNBQWM7Q0FDZCxFQUFDO0NBQ0YsTUFBTSxFQUFFLG1CQUFtQixHQUFHLE1BQU0sUUFBUSxnQkFBZ0IsSUFBSSxvQkFBb0IsdUJBQXVCLEVBQUUsTUFBTSxLQUFLLEtBQU0sRUFBQyxDQUFDO0NBQ2hJLE1BQU0sU0FBUyxNQUFNLDBCQUEwQixrQkFBa0IsZ0JBQWdCLENBQUUsR0FBRSxtQkFBbUIsTUFBTSxDQUFFLEdBQUUsTUFBTTtBQUN4SCxRQUFPLE1BQU07QUFDYjtBQVFNLGVBQWUsa0JBQWtCQyxNQUFjZixnQkFBZ0M7Q0FDckYsTUFBTSxvQkFBb0IsTUFBTSwrQkFBK0IsZUFBZTtDQUM5RSxNQUFNLFdBQVcsS0FDZixJQUFJLGdDQUFnQztFQUNwQyxVQUFVLGVBQWMsT0FBTyxRQUFPLE9BQU87RUFDN0MsY0FBYyxRQUFRLE9BQU8sbUJBQW1CLENBQUMsY0FBYztDQUMvRCxFQUFDLENBQ0QsTUFBTSxLQUFLLENBQ1gsS0FBSyxTQUFTO0NBQ2hCLE1BQU0sRUFBRSxpQkFBaUIsR0FBRyxNQUFNLFFBQVEsZ0JBQWdCLElBQUksb0JBQW9CLHVCQUF1QixFQUFFLE1BQU0sS0FBSyxLQUFNLEVBQUMsQ0FBQztBQUM5SCxTQUNFLGNBQWMsa0JBQWtCLGdCQUFnQixrQkFBa0Isa0JBQWtCLENBQ3BGLEtBQUssQ0FBQyxVQUFVLE1BQU0saUJBQWlCLENBQUUsR0FBRSxpQkFBaUIscUJBQXFCLFVBQVUsUUFBUSxPQUFPLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxDQUFFLEdBQUUsTUFBTSxDQUFDLENBQ2pKLEtBQUssQ0FBQyxVQUFVLHVCQUF1QixPQUFPLE1BQU0sQ0FBQyxDQUNyRCxLQUFLLENBQUMsV0FBVyxPQUFPLE1BQU0sQ0FBQztBQUNqQztBQUVELGVBQWUsK0JBQ2RnQixnQkFDbUY7QUFDbkYsa0JBQWlCLGtCQUFtQixNQUFNLFFBQVEsYUFBYSx1QkFBdUI7Q0FDdEYsTUFBTSxvQkFBb0IsTUFBTSxRQUFRLGFBQWEscUJBQXFCLGVBQWUsaUJBQWlCO0FBQzFHLFFBQU87RUFBRTtFQUFnQjtDQUFtQjtBQUM1QyJ9
