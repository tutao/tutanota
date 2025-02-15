import { assertMainOrNode, isApp } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { NBSP, assertNotNull, clear, defer, delay, downcast, getFirstOrThrow, memoized, neverNull, noOp, ofClass, stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { styles } from "./styles-chunk.js";
import { theme } from "./theme-chunk.js";
import { ContactAddressType, ContactComparisonResult, ContactMergeAction, ContactPhoneNumberType, IndifferentContactComparisonResult, Keys, getContactSocialType, getCustomDateType, getRelationshipType } from "./TutanotaConstants-chunk.js";
import { keyManager } from "./KeyManager-chunk.js";
import { windowFacade } from "./WindowFacade-chunk.js";
import { inputLineHeight, px, size } from "./size-chunk.js";
import { isSameId } from "./EntityUtils-chunk.js";
import { ContactTypeRef, createContact, createContactMailAddress, createFile } from "./TypeRefs-chunk.js";
import { cleanMailAddress } from "./CommonCalendarUtils-chunk.js";
import { isMailAddress } from "./FormatValidator-chunk.js";
import { LockedError, NotFoundError } from "./RestError-chunk.js";
import { isoDateToBirthday } from "./BirthdayUtils-chunk.js";
import { getGroupInfoDisplayName } from "./GroupUtils-chunk.js";
import { Button, ButtonColor, ButtonType } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { Dialog, TextField, TextFieldType, attachDropdown, createDropdown, getContactTitle } from "./Dialog-chunk.js";
import { BootIcons } from "./Icon-chunk.js";
import { ButtonSize, IconButton } from "./IconButton-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { convertToDataFile } from "./BlobUtils-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import { showFileChooser, showNativeFilePicker } from "./SharedMailUtils-chunk.js";
import { formatContactDate, getMessengerHandleUrl, getSocialUrl, getWebsiteUrl } from "./ContactUtils-chunk.js";
import { showPlanUpgradeRequiredDialog } from "./SubscriptionDialogs-chunk.js";
import { MailRecipientsTextField } from "./MailRecipientsTextField-chunk.js";
import { ColumnEmptyMessageBox } from "./ColumnEmptyMessageBox-chunk.js";
import { List, MultiselectMode, listSelectionKeyboardShortcuts } from "./List-chunk.js";
import { SelectableRowContainer, checkboxOpacity, scaleXHide, scaleXShow, selectableRowAnimParams, shouldAlwaysShowMultiselectCheckbox } from "./SelectableRowContainer-chunk.js";
import { CONTACTLIST_PREFIX } from "./RouteChange-chunk.js";
import { selectionAttrsForList } from "./ListModel-chunk.js";
import { BackgroundColumnLayout, ColumnType, FolderColumnView, Header, MobileHeader, SidebarSection, ViewColumn, ViewSlider } from "./MobileHeader-chunk.js";
import { mailLocator } from "./mailLocator-chunk.js";
import { BaseTopLevelView } from "./LoginScreenHeader-chunk.js";
import { getContactAddressTypeLabel, getContactCustomDateTypeToLabel, getContactCustomWebsiteTypeToLabel, getContactMessengerHandleTypeToLabel, getContactPhoneNumberTypeLabel, getContactRelationshipTypeToLabel, getContactSocialTypeLabel } from "./ContactGuiUtils-chunk.js";
import { DesktopListToolbar, DesktopViewerToolbar, EnterMultiselectIconButton, MobileBottomActionBar, MultiselectMobileHeader, SidebarSectionRow, responsiveCardHMargin } from "./SidebarSectionRow-chunk.js";
import { LoginButton } from "./LoginButton-chunk.js";
import { ContactEditor } from "./ContactEditor-chunk.js";
import { ListColumnWrapper } from "./ListColumnWrapper-chunk.js";
import { ContactListView, shiftByForCheckbox, translateXHide, translateXShow } from "./ContactListView-chunk.js";
import { HtmlEditor, HtmlEditorMode } from "./HtmlEditor-chunk.js";
import { appendEmailSignature } from "./Signature-chunk.js";
import { newMailEditorFromTemplate } from "./MailEditor-chunk.js";
import { SelectAllCheckbox } from "./SelectAllCheckbox-chunk.js";
import { LazySearchBar } from "./LazySearchBar-chunk.js";
import { BottomNav } from "./BottomNav-chunk.js";

//#region src/mail-app/contacts/view/ContactViewer.ts
assertMainOrNode();
var ContactViewer = class {
	contactAppellation = memoized(getContactTitle);
	contactPhoneticName = memoized((contact) => {
		const firstName = contact.phoneticFirst ?? "";
		const middleName = contact.phoneticMiddle ? ` ${contact.phoneticMiddle}` : "";
		const lastName = contact.phoneticLast ? ` ${contact.phoneticLast}` : "";
		const phoneticName = (firstName + middleName + lastName).trim();
		return phoneticName.length > 0 ? phoneticName : null;
	});
	formattedBirthday = memoized((contact) => {
		return this.hasBirthday(contact) ? formatContactDate(contact.birthdayIso) : null;
	});
	hasBirthday(contact) {
		return contact.birthdayIso != null;
	}
	view({ attrs }) {
		const { contact, onWriteMail } = attrs;
		const phoneticName = this.contactPhoneticName(attrs.contact);
		return mithril_default(".plr-l.pb-floating.mlr-safe-inset", [
			mithril_default("", [mithril_default(".flex-space-between.flex-wrap.mt-m", mithril_default(".left.flex-grow-shrink-150", [
				mithril_default(".h2.selectable.text-break", [this.contactAppellation(contact), NBSP]),
				phoneticName ? mithril_default("", phoneticName) : null,
				contact.pronouns.length > 0 ? this.renderPronounsInfo(contact) : null,
				contact.nickname ? mithril_default("", `"${contact.nickname}"`) : null,
				mithril_default("", this.renderJobInformation(contact)),
				this.hasBirthday(contact) ? mithril_default("", this.formattedBirthday(contact)) : null
			]), this.renderActions(contact, attrs)), mithril_default("hr.hr.mt.mb")]),
			this.renderCustomDatesAndRelationships(contact),
			this.renderMailAddressesAndPhones(contact, onWriteMail),
			this.renderAddressesAndSocialIds(contact),
			this.renderWebsitesAndInstantMessengers(contact),
			this.renderComment(contact)
		]);
	}
	renderExtendedActions(contact, attrs) {
		return mithril_default.fragment({}, [this.renderEditButton(contact, attrs), this.renderDeleteButton(contact, attrs)]);
	}
	renderEditButton(contact, attrs) {
		if (!attrs.editAction) return null;
		return mithril_default(IconButton, {
			title: "edit_action",
			icon: Icons.Edit,
			click: () => assertNotNull(attrs.editAction, "Invalid Edit action in Contact Viewer")(contact)
		});
	}
	renderDeleteButton(contact, attrs) {
		if (!attrs.deleteAction) return null;
		return mithril_default(IconButton, {
			title: "delete_action",
			icon: Icons.Trash,
			click: () => assertNotNull(attrs.deleteAction, "Invalid Delete action in Contact Viewer")([contact])
		});
	}
	renderActionsDropdown(contact, attrs) {
		const actions = [];
		if (attrs.editAction) actions.push({
			label: "edit_action",
			icon: Icons.Edit,
			click: () => {
				assertNotNull(attrs.editAction, "Edit action in Contact Viewer has disappeared")(contact);
			}
		});
		if (attrs.deleteAction) actions.push({
			label: "delete_action",
			icon: Icons.Trash,
			click: () => {
				assertNotNull(attrs.deleteAction, "Delete action in Contact Viewer has disappeared")([contact]);
			}
		});
		if (actions.length === 0) return null;
		return mithril_default(".flex-end", mithril_default(IconButton, attachDropdown({
			mainButtonAttrs: {
				title: "more_label",
				icon: Icons.More
			},
			childAttrs: () => actions
		})));
	}
	renderActions(contact, attrs) {
		if (!contact || !(attrs.editAction || attrs.deleteAction)) return null;
		if (attrs.extendedActions) return this.renderExtendedActions(contact, attrs);
		return this.renderActionsDropdown(contact, attrs);
	}
	renderJobInformation(contact) {
		const spacerFunction = () => mithril_default("span.plr-s", { style: { fontWeight: "900" } }, " · ");
		return insertBetween([
			contact.role ? mithril_default("span", contact.role) : null,
			contact.department ? mithril_default("span", contact.department) : null,
			contact.company ? mithril_default("span", contact.company) : null
		], spacerFunction);
	}
	renderPronounsInfo(contact) {
		const spacerFunction = () => mithril_default("span.plr-s", { style: { fontWeight: "900" } }, " · ");
		return insertBetween(contact.pronouns.map((pronouns) => {
			let language = "";
			if (pronouns.language != "") language = `${pronouns.language}: `;
			return mithril_default("span", `${language}${pronouns.pronouns}`);
		}), spacerFunction);
	}
	renderAddressesAndSocialIds(contact) {
		const addresses = contact.addresses.map((element) => this.renderAddress(element));
		const socials = contact.socialIds.map((element) => this.renderSocialId(element));
		return addresses.length > 0 || socials.length > 0 ? mithril_default(".wrapping-row", [mithril_default(".address.mt-l", addresses.length > 0 ? [mithril_default(".h4", lang.get("address_label")), mithril_default(".aggregateEditors", addresses)] : null), mithril_default(".social.mt-l", socials.length > 0 ? [mithril_default(".h4", lang.get("social_label")), mithril_default(".aggregateEditors", socials)] : null)]) : null;
	}
	renderWebsitesAndInstantMessengers(contact) {
		const websites = contact.websites.map((element) => this.renderWebsite(element));
		const instantMessengers = contact.messengerHandles.map((element) => this.renderMessengerHandle(element));
		return websites.length > 0 || instantMessengers.length > 0 ? mithril_default(".wrapping-row", [mithril_default(".website.mt-l", websites.length > 0 ? [mithril_default(".h4", lang.get("websites_label")), mithril_default(".aggregateEditors", websites)] : null), mithril_default(".messenger-handles.mt-l", instantMessengers.length > 0 ? [mithril_default(".h4", lang.get("messenger_handles_label")), mithril_default(".aggregateEditors", instantMessengers)] : null)]) : null;
	}
	renderCustomDatesAndRelationships(contact) {
		const dates = contact.customDate.map((element) => mithril_default(TextField, {
			label: getContactCustomDateTypeToLabel(getCustomDateType(element), element.customTypeName),
			value: formatContactDate(element.dateIso),
			isReadOnly: true
		}));
		const relationships = contact.relationships.map((element) => mithril_default(TextField, {
			label: getContactRelationshipTypeToLabel(getRelationshipType(element), element.customTypeName),
			value: element.person,
			isReadOnly: true
		}));
		return dates.length > 0 || relationships.length > 0 ? mithril_default(".wrapping-row", [mithril_default(".dates.mt-l", dates.length > 0 ? [mithril_default(".h4", lang.get("dates_label")), mithril_default(".aggregateEditors", dates)] : null), mithril_default(".relationships.mt-l", relationships.length > 0 ? [mithril_default(".h4", lang.get("relationships_label")), mithril_default(".aggregateEditors", relationships)] : null)]) : null;
	}
	renderMailAddressesAndPhones(contact, onWriteMail) {
		const mailAddresses = contact.mailAddresses.map((element) => this.renderMailAddress(contact, element, onWriteMail));
		const phones = contact.phoneNumbers.map((element) => this.renderPhoneNumber(element));
		return mailAddresses.length > 0 || phones.length > 0 ? mithril_default(".wrapping-row", [mithril_default(".mail.mt-l", mailAddresses.length > 0 ? [mithril_default(".h4", lang.get("email_label")), mithril_default(".aggregateEditors", [mailAddresses])] : null), mithril_default(".phone.mt-l", phones.length > 0 ? [mithril_default(".h4", lang.get("phone_label")), mithril_default(".aggregateEditors", [phones])] : null)]) : null;
	}
	renderComment(contact) {
		return contact.comment && contact.comment.trim().length > 0 ? [mithril_default(".h4.mt-l", lang.get("comment_label")), mithril_default("p.mt-l.text-prewrap.text-break.selectable", contact.comment)] : null;
	}
	renderSocialId(contactSocialId) {
		const showButton = mithril_default(IconButton, {
			title: "showURL_alt",
			click: noOp,
			icon: Icons.ArrowForward,
			size: ButtonSize.Compact
		});
		return mithril_default(TextField, {
			label: getContactSocialTypeLabel(getContactSocialType(contactSocialId), contactSocialId.customTypeName),
			value: contactSocialId.socialId,
			isReadOnly: true,
			injectionsRight: () => mithril_default(`a[href=${getSocialUrl(contactSocialId)}][target=_blank]`, showButton)
		});
	}
	renderWebsite(website) {
		const showButton = mithril_default(IconButton, {
			title: "showURL_alt",
			click: noOp,
			icon: Icons.ArrowForward,
			size: ButtonSize.Compact
		});
		return mithril_default(TextField, {
			label: getContactCustomWebsiteTypeToLabel(downcast(website.type), website.customTypeName),
			value: website.url,
			isReadOnly: true,
			injectionsRight: () => mithril_default(`a[href=${getWebsiteUrl(website.url)}][target=_blank]`, showButton)
		});
	}
	renderMessengerHandle(messengerHandle) {
		const showButton = mithril_default(IconButton, {
			title: "showURL_alt",
			click: noOp,
			icon: Icons.ArrowForward,
			size: ButtonSize.Compact
		});
		return mithril_default(TextField, {
			label: getContactMessengerHandleTypeToLabel(downcast(messengerHandle.type), messengerHandle.customTypeName),
			value: messengerHandle.handle,
			isReadOnly: true,
			injectionsRight: () => mithril_default(`a[href=${getMessengerHandleUrl(messengerHandle)}][target=_blank]`, showButton)
		});
	}
	renderMailAddress(contact, address, onWriteMail) {
		const newMailButton = mithril_default(IconButton, {
			title: "sendMail_alt",
			click: () => onWriteMail({
				name: `${contact.firstName} ${contact.lastName}`.trim(),
				address: address.address,
				contact
			}),
			icon: Icons.PencilSquare,
			size: ButtonSize.Compact
		});
		return mithril_default(TextField, {
			label: getContactAddressTypeLabel(address.type, address.customTypeName),
			value: address.address,
			isReadOnly: true,
			injectionsRight: () => [newMailButton]
		});
	}
	renderPhoneNumber(phone) {
		const callButton = mithril_default(IconButton, {
			title: "callNumber_alt",
			click: () => null,
			icon: Icons.Call,
			size: ButtonSize.Compact
		});
		return mithril_default(TextField, {
			label: getContactPhoneNumberTypeLabel(phone.type, phone.customTypeName),
			value: phone.number,
			isReadOnly: true,
			injectionsRight: () => mithril_default(`a[href="tel:${phone.number}"][target=_blank]`, callButton)
		});
	}
	renderAddress(address) {
		let prepAddress;
		if (address.address.indexOf("\n") !== -1) prepAddress = encodeURIComponent(address.address.split("\n").join(" "));
else prepAddress = encodeURIComponent(address.address);
		const showButton = mithril_default(IconButton, {
			title: "showAddress_alt",
			click: () => null,
			icon: Icons.Pin,
			size: ButtonSize.Compact
		});
		return mithril_default(TextField, {
			label: getContactAddressTypeLabel(downcast(address.type), address.customTypeName),
			value: address.address,
			isReadOnly: true,
			type: TextFieldType.Area,
			injectionsRight: () => mithril_default(`a[href="https://www.openstreetmap.org/search?query=${prepAddress}"][target=_blank]`, showButton)
		});
	}
};
function insertBetween(array, spacer) {
	let ret = [];
	for (let e of array) if (e != null) {
		if (ret.length > 0) ret.push(spacer());
		ret.push(e);
	}
	return ret;
}

//#endregion
//#region src/mail-app/contacts/view/ContactCardViewer.ts
var ContactCardViewer = class {
	view({ attrs }) {
		const { contact, onWriteMail, editAction, deleteAction, extendedActions } = attrs;
		return [mithril_default(".border-radius-big.rel", {
			class: responsiveCardHMargin(),
			style: {
				backgroundColor: theme.content_bg,
				...attrs.style
			}
		}, mithril_default(ContactViewer, {
			contact,
			onWriteMail,
			editAction,
			deleteAction,
			extendedActions
		})), mithril_default(".mt-l")];
	}
};

//#endregion
//#region src/mail-app/contacts/view/MultiContactViewer.ts
assertMainOrNode();
var MultiContactViewer = class {
	view({ attrs }) {
		return [mithril_default(ColumnEmptyMessageBox, {
			message: getContactSelectionMessage(attrs.selectedEntities.length),
			icon: BootIcons.Contacts,
			color: theme.content_message_bg,
			bottomContent: attrs.selectedEntities.length > 0 ? mithril_default(Button, {
				label: "cancel_action",
				type: ButtonType.Secondary,
				click: () => attrs.selectNone()
			}) : undefined,
			backgroundColor: theme.navigation_bg
		})];
	}
};
function getContactSelectionMessage(numberEntities) {
	if (numberEntities === 0) return lang.getTranslation("noContact_msg");
else return lang.getTranslation("nbrOfContactsSelected_msg", { "{1}": numberEntities });
}

//#endregion
//#region src/common/gui/base/TextDisplayArea.ts
var TextDisplayArea = class {
	view(vnode) {
		return mithril_default(".flex.flex-grow.flex-column.text.pt", [mithril_default("label.text-ellipsis.noselect.z1.i.pr-s", { style: { fontSize: px(size.font_size_small) } }, lang.getTranslationText(vnode.attrs.label)), mithril_default(".text-pre.flex-grow", {
			style: {
				borderBottom: `1px solid ${theme.content_border}`,
				lineHeight: px(inputLineHeight),
				minHeight: px(inputLineHeight)
			},
			isReadOnly: true
		}, vnode.attrs.value)]);
	}
};

//#endregion
//#region src/mail-app/contacts/view/ContactMergeView.ts
var ContactMergeView = class {
	dialog;
	contact1;
	contact2;
	resolveFunction = null;
	windowCloseUnsubscribe = null;
	constructor(contact1, contact2) {
		this.contact1 = contact1;
		this.contact2 = contact2;
		const cancelAction = () => {
			this._close(ContactMergeAction.Cancel);
		};
		const headerBarAttrs = {
			left: [{
				label: "cancel_action",
				click: cancelAction,
				type: ButtonType.Secondary
			}],
			right: [{
				label: "skip_action",
				click: () => this._close(ContactMergeAction.Skip),
				type: ButtonType.Primary
			}],
			middle: "merge_action"
		};
		this.dialog = Dialog.largeDialog(headerBarAttrs, this).setCloseHandler(cancelAction).addShortcut({
			key: Keys.ESC,
			exec: () => {
				this._close(ContactMergeAction.Cancel);
				return false;
			},
			help: "close_alt"
		});
	}
	view() {
		const { mailAddresses: mailAddresses1, phones: phones1, addresses: addresses1, socials: socials1 } = this._createContactFields(this.contact1);
		const { mailAddresses: mailAddresses2, phones: phones2, addresses: addresses2, socials: socials2 } = this._createContactFields(this.contact2);
		let emptyFieldPlaceholder = mithril_default(TextField, {
			label: "emptyString_msg",
			value: "",
			isReadOnly: true
		});
		let emptyHTMLFieldPlaceholder = mithril_default(new HtmlEditor("emptyString_msg").showBorders().setValue("").setReadOnly(false).setMode(HtmlEditorMode.HTML).setHtmlMonospace(false));
		let titleFields = this._createTextFields(this.contact1.title, this.contact2.title, "title_placeholder");
		let firstNameFields = this._createTextFields(this.contact1.firstName, this.contact2.firstName, "firstName_placeholder");
		let lastNameFields = this._createTextFields(this.contact1.lastName, this.contact2.lastName, "lastName_placeholder");
		let nicknameFields = this._createTextFields(this.contact1.nickname, this.contact2.nickname, "nickname_placeholder");
		let companyFields = this._createTextFields(this.contact1.company, this.contact2.company, "company_label");
		let roleFields = this._createTextFields(this.contact1.role, this.contact2.role, "role_placeholder");
		let birthdayFields = this._createTextFields(formatContactDate(this.contact1.birthdayIso), formatContactDate(this.contact2.birthdayIso), "birthday_alt");
		let presharedPasswordFields = this._createTextFields(this.contact1.presharedPassword && this.contact1.presharedPassword.length > 0 ? "***" : "", this.contact2.presharedPassword && this.contact2.presharedPassword.length > 0 ? "***" : "", "presharedPassword_label");
		let commentField1 = null;
		let commentField2 = null;
		if (this.contact1.comment || this.contact2.comment) {
			commentField1 = mithril_default(TextDisplayArea, {
				label: "comment_label",
				value: this.contact1.comment
			});
			commentField2 = mithril_default(TextDisplayArea, {
				label: "comment_label",
				value: this.contact2.comment
			});
		}
		return mithril_default("#contact-editor", {
			oncreate: () => this.windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {}),
			onremove: () => this.windowCloseUnsubscribe?.()
		}, [
			mithril_default(".flex-center.mt", [mithril_default(".full-width.max-width-s", [mithril_default(LoginButton, {
				label: "mergeContacts_action",
				onclick: () => this._close(ContactMergeAction.Merge)
			})])]),
			mithril_default(".non-wrapping-row", [mithril_default(
				"",
				/*first contact */
				[mithril_default(".items-center", [mithril_default(".items-base.flex-space-between", [mithril_default(".h4.mt-l", lang.get("firstMergeContact_label")), this._createDeleteContactButton(ContactMergeAction.DeleteFirst)])])]
), mithril_default(
				"",
				/*second contact */
				[mithril_default(".items-center", [mithril_default(".items-base.flex-space-between", [mithril_default(".h4.mt-l", lang.get("secondMergeContact_label")), this._createDeleteContactButton(ContactMergeAction.DeleteSecond)])])]
)]),
			titleFields ? mithril_default(".non-wrapping-row", titleFields) : null,
			firstNameFields ? mithril_default(".non-wrapping-row", firstNameFields) : null,
			lastNameFields ? mithril_default(".non-wrapping-row", lastNameFields) : null,
			nicknameFields ? mithril_default(".non-wrapping-row", nicknameFields) : null,
			companyFields ? mithril_default(".non-wrapping-row", companyFields) : null,
			birthdayFields ? mithril_default(".non-wrapping-row", birthdayFields) : null,
			roleFields ? mithril_default(".non-wrapping-row", roleFields) : null,
			mailAddresses1.length > 0 || mailAddresses2.length > 0 ? mithril_default(".non-wrapping-row", [mithril_default(".mail.mt-l", [mithril_default("", lang.get("email_label")), mailAddresses1.length > 0 ? mailAddresses1 : emptyFieldPlaceholder]), mithril_default(".mail.mt-l", [mithril_default("", lang.get("email_label")), mailAddresses2.length > 0 ? mailAddresses2 : emptyFieldPlaceholder])]) : null,
			phones1.length > 0 || phones2.length > 0 ? mithril_default(".non-wrapping-row", [mithril_default(".phone.mt-l", [mithril_default("", lang.get("phone_label")), mithril_default(".aggregateEditors", [phones1.length > 0 ? phones1 : emptyFieldPlaceholder])]), mithril_default(".phone.mt-l", [mithril_default("", lang.get("phone_label")), mithril_default(".aggregateEditors", [phones2.length > 0 ? phones2 : emptyFieldPlaceholder])])]) : null,
			addresses1.length > 0 || addresses2.length > 0 ? mithril_default(".non-wrapping-row", [mithril_default(".address.mt-l.flex.flex-column", [mithril_default("", lang.get("address_label")), mithril_default(".aggregateEditors.flex.flex-column.flex-grow", [addresses1.length > 0 ? addresses1 : emptyHTMLFieldPlaceholder])]), mithril_default(".address.mt-l", [mithril_default("", lang.get("address_label")), mithril_default(".aggregateEditors.flex.flex-column.flex-grow", [addresses2.length > 0 ? addresses2 : emptyHTMLFieldPlaceholder])])]) : null,
			socials1.length > 0 || socials2.length > 0 ? mithril_default(".non-wrapping-row", [mithril_default(".social.mt-l", [mithril_default("", lang.get("social_label")), mithril_default(".aggregateEditors", socials1.length > 0 ? socials1 : emptyFieldPlaceholder)]), mithril_default(".social.mt-l", [mithril_default("", lang.get("social_label")), mithril_default(".aggregateEditors", socials2.length > 0 ? socials2 : emptyFieldPlaceholder)])]) : null,
			commentField1 && commentField2 ? mithril_default(".non-wrapping-row", [mithril_default(".mt-l.flex.flex-column", [commentField1]), mithril_default(".mt-l.flex.flex-column", [commentField2])]) : null,
			presharedPasswordFields ? mithril_default(".non-wrapping-row", presharedPasswordFields) : null,
			mithril_default(
				"",
				{ style: { height: "5px" } }
				/*Used as spacer so the last gui-element is not touching the window border*/
)
		]);
	}
	_createContactFields(contact) {
		const mailAddresses = contact.mailAddresses.map((element) => {
			return mithril_default(TextField, {
				label: getContactAddressTypeLabel(element.type, element.customTypeName),
				value: element.address,
				isReadOnly: true
			});
		});
		const phones = contact.phoneNumbers.map((element) => {
			return mithril_default(TextField, {
				label: getContactPhoneNumberTypeLabel(element.type, element.customTypeName),
				value: element.number,
				isReadOnly: true
			});
		});
		const addresses = contact.addresses.map((element) => {
			return mithril_default(TextDisplayArea, {
				value: element.address,
				label: getContactAddressTypeLabel(downcast(element.type), element.customTypeName)
			});
		});
		const socials = contact.socialIds.map((element) => {
			return mithril_default(TextField, {
				label: getContactSocialTypeLabel(getContactSocialType(element), element.customTypeName),
				value: element.socialId,
				isReadOnly: true
			});
		});
		return {
			mailAddresses,
			phones,
			addresses,
			socials
		};
	}
	_createTextFields(value1, value2, labelTextId) {
		if (value1 || value2) return [mithril_default(TextField, {
			label: labelTextId,
			value: value1 || "",
			isReadOnly: true
		}), mithril_default(TextField, {
			label: labelTextId,
			value: value2 || "",
			isReadOnly: true
		})];
else return null;
	}
	_createDeleteContactButton(action) {
		return mithril_default(IconButton, {
			title: "delete_action",
			click: () => {
				Dialog.confirm("deleteContact_msg").then((confirmed) => {
					if (confirmed) this._close(action);
				});
			},
			icon: Icons.Trash
		});
	}
	show() {
		this.dialog.show();
		let d = defer();
		this.resolveFunction = d.resolve;
		return d.promise;
	}
	_close(action) {
		this.dialog.close();
		delay(200).then(() => {
			this.resolveFunction?.(action);
		});
	}
};

//#endregion
//#region src/mail-app/contacts/ContactMergeUtils.ts
function getMergeableContacts(inputContacts) {
	let mergableContacts = [];
	let duplicateContacts = [];
	let contacts = inputContacts.slice();
	let firstContactIndex = 0;
	while (firstContactIndex < contacts.length - 1) {
		let currentMergableContacts = [];
		let firstContact = contacts[firstContactIndex];
		currentMergableContacts.push(firstContact);
		let secondContactIndex = firstContactIndex + 1;
		while (secondContactIndex < contacts.length) {
			let secondContact = contacts[secondContactIndex];
			if (firstContact._id[1] !== secondContact._id[1]) {
				let overallResult = ContactComparisonResult.Unique;
				for (let i = 0; i < currentMergableContacts.length; i++) {
					let result = _compareContactsForMerge(currentMergableContacts[i], secondContact);
					if (result === ContactComparisonResult.Equal) {
						overallResult = ContactComparisonResult.Equal;
						break;
					} else if (result === ContactComparisonResult.Similar) overallResult = ContactComparisonResult.Similar;
else break;
				}
				if (overallResult === ContactComparisonResult.Equal) {
					duplicateContacts.push(secondContact);
					contacts.splice(secondContactIndex, 1);
				} else if (overallResult === ContactComparisonResult.Similar) {
					currentMergableContacts.push(secondContact);
					contacts.splice(secondContactIndex, 1);
				} else secondContactIndex++;
			}
		}
		if (currentMergableContacts.length > 1) mergableContacts.push(currentMergableContacts);
		firstContactIndex++;
	}
	return {
		mergeable: mergableContacts,
		deletable: duplicateContacts
	};
}
function mergeContacts(keptContact, eliminatedContact) {
	keptContact.firstName = _getMergedNameField(keptContact.firstName, eliminatedContact.firstName);
	keptContact.lastName = _getMergedNameField(keptContact.lastName, eliminatedContact.lastName);
	keptContact.title = neverNull(_getMergedOtherField(keptContact.title, eliminatedContact.title, ", "));
	keptContact.comment = neverNull(_getMergedOtherField(keptContact.comment, eliminatedContact.comment, "\n\n"));
	keptContact.company = neverNull(_getMergedOtherField(keptContact.company, eliminatedContact.company, ", "));
	keptContact.nickname = _getMergedOtherField(keptContact.nickname, eliminatedContact.nickname, ", ");
	keptContact.role = neverNull(_getMergedOtherField(keptContact.role, eliminatedContact.role, ", "));
	keptContact.birthdayIso = _getMergedBirthdays(keptContact.birthdayIso, eliminatedContact.birthdayIso);
	keptContact.mailAddresses = _getMergedEmailAddresses(keptContact.mailAddresses, eliminatedContact.mailAddresses);
	keptContact.phoneNumbers = _getMergedPhoneNumbers(keptContact.phoneNumbers, eliminatedContact.phoneNumbers);
	keptContact.socialIds = _getMergedSocialIds(keptContact.socialIds, eliminatedContact.socialIds);
	keptContact.addresses = _getMergedAddresses(keptContact.addresses, eliminatedContact.addresses);
	keptContact.presharedPassword = neverNull(_getMergedOtherField(keptContact.presharedPassword, eliminatedContact.presharedPassword, ""));
}
function _compareContactsForMerge(contact1, contact2) {
	let nameResult = _compareFullName(contact1, contact2);
	let mailResult = _compareMailAddresses(contact1.mailAddresses, contact2.mailAddresses);
	let phoneResult = _comparePhoneNumbers(contact1.phoneNumbers, contact2.phoneNumbers);
	let birthdayResult = _compareBirthdays(contact1, contact2);
	let residualContactFieldsEqual = _areResidualContactFieldsEqual(contact1, contact2);
	if (birthdayResult !== ContactComparisonResult.Unique && (!contact1.presharedPassword || !contact2.presharedPassword || contact1.presharedPassword === contact2.presharedPassword)) if ((nameResult === ContactComparisonResult.Equal || nameResult === IndifferentContactComparisonResult.BothEmpty) && (mailResult === ContactComparisonResult.Equal || mailResult === IndifferentContactComparisonResult.BothEmpty) && (phoneResult === ContactComparisonResult.Equal || phoneResult === IndifferentContactComparisonResult.BothEmpty) && residualContactFieldsEqual) if (birthdayResult === IndifferentContactComparisonResult.BothEmpty || birthdayResult === ContactComparisonResult.Equal) return ContactComparisonResult.Equal;
else return ContactComparisonResult.Similar;
else if (nameResult === ContactComparisonResult.Equal || nameResult === ContactComparisonResult.Similar) return ContactComparisonResult.Similar;
else if ((nameResult === IndifferentContactComparisonResult.BothEmpty || nameResult === IndifferentContactComparisonResult.OneEmpty) && (mailResult === ContactComparisonResult.Similar || phoneResult === ContactComparisonResult.Similar || mailResult === ContactComparisonResult.Equal || phoneResult === ContactComparisonResult.Equal)) return ContactComparisonResult.Similar;
else return ContactComparisonResult.Unique;
else return ContactComparisonResult.Unique;
}
function _compareFullName(contact1, contact2) {
	if (contact1.firstName === contact2.firstName && contact1.lastName === contact2.lastName && (contact1.lastName || contact1.firstName)) return ContactComparisonResult.Equal;
else if (!contact1.firstName && !contact1.lastName && !contact2.firstName && !contact2.lastName) return IndifferentContactComparisonResult.BothEmpty;
else if (!contact1.firstName && !contact1.lastName || !contact2.firstName && !contact2.lastName) return IndifferentContactComparisonResult.OneEmpty;
else if (contact1.firstName.toLowerCase() === contact2.firstName.toLowerCase() && contact1.lastName.toLowerCase() === contact2.lastName.toLowerCase() && contact1.lastName) return ContactComparisonResult.Similar;
else if ((!contact1.firstName || !contact2.firstName) && contact1.lastName.toLowerCase() === contact2.lastName.toLowerCase() && contact1.lastName) return ContactComparisonResult.Similar;
else return ContactComparisonResult.Unique;
}
function _getMergedNameField(name1, name2) {
	if (name1) return name1;
else return name2;
}
function _compareMailAddresses(contact1MailAddresses, contact2MailAddresses) {
	return _compareValues(contact1MailAddresses.map((m) => m.address), contact2MailAddresses.map((m) => m.address));
}
function _getMergedEmailAddresses(mailAddresses1, mailAddresses2) {
	let filteredMailAddresses2 = mailAddresses2.filter((ma2) => {
		return !mailAddresses1.some((ma1) => ma1.address.toLowerCase() === ma2.address.toLowerCase());
	});
	return mailAddresses1.concat(filteredMailAddresses2);
}
function _comparePhoneNumbers(contact1PhoneNumbers, contact2PhoneNumbers) {
	return _compareValues(contact1PhoneNumbers.map((m) => m.number), contact2PhoneNumbers.map((m) => m.number));
}
function _getMergedPhoneNumbers(phoneNumbers1, phoneNumbers2) {
	let filteredNumbers2 = phoneNumbers2.filter((ma2) => {
		const isIncludedInPhoneNumbers1 = phoneNumbers1.find((ma1) => ma1.number.replace(/\s/g, "") === ma2.number.replace(/\s/g, ""));
		return !isIncludedInPhoneNumbers1;
	});
	return phoneNumbers1.concat(filteredNumbers2);
}
function _areResidualContactFieldsEqual(contact1, contact2) {
	return _isEqualOtherField(contact1.comment, contact2.comment) && _isEqualOtherField(contact1.company, contact2.company) && _isEqualOtherField(contact1.nickname, contact2.nickname) && _isEqualOtherField(contact1.role, contact2.role) && _isEqualOtherField(contact1.title, contact2.title) && _isEqualOtherField(contact1.presharedPassword, contact2.presharedPassword) && _areSocialIdsEqual(contact1.socialIds, contact2.socialIds) && _areAddressesEqual(contact1.addresses, contact2.addresses);
}
function _areSocialIdsEqual(contact1SocialIds, contact2SocialIds) {
	let result = _compareValues(contact1SocialIds.map((m) => m.socialId), contact2SocialIds.map((m) => m.socialId));
	return result === IndifferentContactComparisonResult.BothEmpty || result === ContactComparisonResult.Equal;
}
function _getMergedSocialIds(socialIds1, socialIds2) {
	let filteredSocialIds2 = socialIds2.filter((ma2) => {
		return !socialIds1.some((ma1) => ma1.socialId === ma2.socialId);
	});
	return socialIds1.concat(filteredSocialIds2);
}
function _areAddressesEqual(contact1Addresses, contact2Addresses) {
	let result = _compareValues(contact1Addresses.map((m) => m.address), contact2Addresses.map((m) => m.address));
	return result === IndifferentContactComparisonResult.BothEmpty || result === ContactComparisonResult.Equal;
}
function _getMergedAddresses(addresses1, addresses2) {
	let filteredAddresses2 = addresses2.filter((ma2) => {
		return !addresses1.some((ma1) => ma1.address === ma2.address);
	});
	return addresses1.concat(filteredAddresses2);
}
function _compareBirthdays(contact1, contact2) {
	const b1 = _convertIsoBirthday(contact1.birthdayIso);
	const b2 = _convertIsoBirthday(contact2.birthdayIso);
	if (b1 && b2) if (b1.day === b2.day && b1.month === b2.month) if (b1.year === b2.year) return ContactComparisonResult.Equal;
else if (b1.year && b2.year && b1.year !== b2.year) return ContactComparisonResult.Unique;
else return ContactComparisonResult.Similar;
else return ContactComparisonResult.Unique;
else if (contact1.birthdayIso && !contact2.birthdayIso || !contact1.birthdayIso && contact2.birthdayIso) return IndifferentContactComparisonResult.OneEmpty;
else return IndifferentContactComparisonResult.BothEmpty;
}
function _convertIsoBirthday(isoBirthday) {
	if (isoBirthday) try {
		return isoDateToBirthday(isoBirthday);
	} catch (e) {
		console.log("failed to parse birthday", e);
		return null;
	}
else return null;
}
function _compareValues(values1, values2) {
	if (values1.length === 0 && values2.length === 0) return IndifferentContactComparisonResult.BothEmpty;
else if (values1.length === 0 || values2.length === 0) return IndifferentContactComparisonResult.OneEmpty;
	let equalAddresses = values2.filter((c2) => values1.find((c1) => c1.trim() === c2.trim()));
	if (values1.length === values2.length && values1.length === equalAddresses.length) return ContactComparisonResult.Equal;
	let equalAddressesInsensitive = values2.filter((c2) => values1.find((c1) => c1.trim().toLowerCase() === c2.trim().toLowerCase()));
	if (equalAddressesInsensitive.length > 0) return ContactComparisonResult.Similar;
	return ContactComparisonResult.Unique;
}
/**
* Returns equal if both values are equal and unique otherwise
*/
function _isEqualOtherField(otherAttribute1, otherAttribute2) {
	if (otherAttribute1 == null) otherAttribute1 = "";
	if (otherAttribute2 == null) otherAttribute2 = "";
	return otherAttribute1 === otherAttribute2;
}
function _getMergedOtherField(otherAttribute1, otherAttribute2, separator) {
	if (otherAttribute1 === otherAttribute2) return otherAttribute2;
else if (otherAttribute1 && otherAttribute2) return otherAttribute1 + separator + otherAttribute2;
else if (!otherAttribute1 && otherAttribute2) return otherAttribute2;
else return otherAttribute1;
}
function _getMergedBirthdays(birthday1, birthday2) {
	const b1 = _convertIsoBirthday(birthday1);
	const b2 = _convertIsoBirthday(birthday2);
	if (b1 && b2) if (b1.year) return birthday1;
else if (b2.year) return birthday2;
else return birthday1;
else if (birthday1) return birthday1;
else if (birthday2) return birthday2;
else return null;
}

//#endregion
//#region src/mail-app/contacts/VCardExporter.ts
assertMainOrNode();
function exportContacts(contacts) {
	let vCardFile = contactsToVCard(contacts);
	let data = stringToUtf8Uint8Array(vCardFile);
	let tmpFile = createFile({
		name: "vCard3.0.vcf",
		mimeType: "vCard/rfc2426",
		size: String(data.byteLength),
		blobs: [],
		cid: null,
		parent: null,
		subFiles: null
	});
	return locator.fileController.saveDataFile(convertToDataFile(tmpFile, data));
}
function contactsToVCard(contacts) {
	let vCardFile = "";
	for (const contact of contacts) vCardFile += _contactToVCard(contact);
	return vCardFile;
}
function _contactToVCard(contact) {
	let contactToVCardString = "BEGIN:VCARD\nVERSION:3.0\n";
	let fnString = "FN:";
	fnString += contact.title ? _getVCardEscaped(contact.title) + " " : "";
	fnString += contact.firstName ? _getVCardEscaped(contact.firstName) + " " : "";
	fnString += contact.middleName ? _getVCardEscaped(contact.middleName) + " " : "";
	fnString += contact.lastName ? _getVCardEscaped(contact.lastName) : "";
	fnString += contact.nameSuffix ? ", " + _getVCardEscaped(contact.nameSuffix) : "";
	contactToVCardString += _getFoldedString(fnString.trim()) + "\n";
	let nString = "N:";
	nString += contact.lastName ? _getVCardEscaped(contact.lastName) + ";" : ";";
	nString += contact.firstName ? _getVCardEscaped(contact.firstName) + ";" : ";";
	nString += contact.middleName ? _getVCardEscaped(contact.middleName) + ";" : ";";
	nString += contact.title ? _getVCardEscaped(contact.title) + ";" : ";";
	nString += contact.nameSuffix ? _getVCardEscaped(contact.nameSuffix) + "" : "";
	contactToVCardString += _getFoldedString(nString) + "\n";
	contactToVCardString += contact.nickname ? _getFoldedString("NICKNAME:" + _getVCardEscaped(contact.nickname)) + "\n" : "";
	if (contact.birthdayIso) {
		const bday = contact.birthdayIso;
		const bdayExported = bday.startsWith("--") ? bday.replace("--", "1111-") : bday;
		contactToVCardString += "BDAY:" + bdayExported + "\n";
	}
	contactToVCardString += _vCardFormatArrayToString(_addressesToVCardAddresses(contact.addresses), "ADR");
	contactToVCardString += _vCardFormatArrayToString(_addressesToVCardAddresses(contact.mailAddresses), "EMAIL");
	contactToVCardString += _vCardFormatArrayToString(_phoneNumbersToVCardPhoneNumbers(contact.phoneNumbers), "TEL");
	contactToVCardString += _vCardFormatArrayToString(_socialIdsToVCardSocialUrls(contact.socialIds), "URL");
	contactToVCardString += contact.role != "" ? _getFoldedString("TITLE:" + _getVCardEscaped(contact.role)) + "\n" : "";
	contact.websites.map((website) => {
		contactToVCardString += _getFoldedString("URL:" + getWebsiteUrl(website.url) + "\n");
	});
	const company = contact.company ? _getFoldedString("ORG:" + _getVCardEscaped(contact.company)) : "";
	if (contact.department) contactToVCardString += company + ";" + _getVCardEscaped(contact.department) + "\n";
else contactToVCardString += contact.company ? _getFoldedString("ORG:" + _getVCardEscaped(contact.company)) + "\n" : "";
	contactToVCardString += contact.comment ? _getFoldedString("NOTE:" + _getVCardEscaped(contact.comment)) + "\n" : "";
	contactToVCardString += "END:VCARD\n\n";
	return contactToVCardString;
}
function _addressesToVCardAddresses(addresses) {
	return addresses.map((ad) => {
		let kind = "";
		switch (ad.type) {
			case ContactAddressType.PRIVATE:
				kind = "home";
				break;
			case ContactAddressType.WORK:
				kind = "work";
				break;
			default:
		}
		return {
			KIND: kind,
			CONTENT: ad.address
		};
	});
}
function _phoneNumbersToVCardPhoneNumbers(numbers) {
	return numbers.map((num) => {
		let kind = "";
		switch (num.type) {
			case ContactPhoneNumberType.PRIVATE:
				kind = "home";
				break;
			case ContactPhoneNumberType.WORK:
				kind = "work";
				break;
			case ContactPhoneNumberType.MOBILE:
				kind = "cell";
				break;
			case ContactPhoneNumberType.FAX:
				kind = "fax";
				break;
			default:
		}
		return {
			KIND: kind,
			CONTENT: num.number
		};
	});
}
function _socialIdsToVCardSocialUrls(socialIds) {
	return socialIds.map((sId) => {
		return {
			KIND: "",
			CONTENT: getSocialUrl(sId)
		};
	});
}
function _vCardFormatArrayToString(typeAndContentArray, tagContent) {
	return typeAndContentArray.reduce((result, elem) => {
		if (elem.KIND) return result + _getFoldedString(tagContent + ";TYPE=" + elem.KIND + ":" + _getVCardEscaped(elem.CONTENT)) + "\n";
else return result + _getFoldedString(tagContent + ":" + _getVCardEscaped(elem.CONTENT)) + "\n";
	}, "");
}
/**
* Adds line breaks and padding in a CONTENT line to adhere to the vCard
* specifications.
*
* @param text The text to fold.
* @returns The same text but folded every 75 characters.
* @see https://datatracker.ietf.org/doc/html/rfc6350#section-3.2
*/
function _getFoldedString(text) {
	let separateLinesArray = [];
	while (text.length > 75) {
		separateLinesArray.push(text.substring(0, 75));
		text = text.substring(75, text.length);
	}
	separateLinesArray.push(text);
	text = separateLinesArray.join("\n ");
	return text;
}
function _getVCardEscaped(content) {
	content = content.replace(/\n/g, "\\n");
	content = content.replace(/;/g, "\\;");
	content = content.replace(/,/g, "\\,");
	return content;
}

//#endregion
//#region src/common/gui/MobileActionBar.ts
var MobileActionBar = class {
	view(vnode) {
		const { attrs } = vnode;
		return mithril_default(".bottom-nav.bottom-action-bar.flex.items-center.plr-l", { style: { justifyContent: "space-around" } }, attrs.actions.map((action) => mithril_default(IconButton, {
			title: action.title,
			icon: action.icon,
			click: action.action
		})));
	}
};

//#endregion
//#region src/mail-app/contacts/view/ContactViewerActions.ts
var ContactViewerActions = class {
	shortcuts = [];
	view({ attrs }) {
		const { contacts, onDelete, onEdit, onMerge, onExport } = attrs;
		const actionButtons = [];
		if (this.canEdit(contacts)) actionButtons.push(mithril_default(IconButton, {
			title: "edit_action",
			click: () => onEdit(contacts[0]),
			icon: Icons.Edit
		}));
else if (this.canMerge(contacts)) actionButtons.push(mithril_default(IconButton, {
			title: "merge_action",
			click: () => onMerge(contacts[0], contacts[1]),
			icon: Icons.People
		}));
		if (this.canExport(contacts)) actionButtons.push(mithril_default(IconButton, {
			title: "export_action",
			click: () => onExport(contacts),
			icon: Icons.Export
		}));
		if (this.canDelete(contacts)) actionButtons.push(mithril_default(IconButton, {
			title: "delete_action",
			click: () => onDelete(contacts),
			icon: Icons.Trash
		}));
		return actionButtons;
	}
	onupdate(vnode) {
		keyManager.unregisterShortcuts(this.shortcuts);
		this.shortcuts.length = 0;
		const { contacts, onEdit, onDelete, onMerge, onExport } = vnode.attrs;
		if (this.canEdit(contacts)) this.shortcuts.push({
			key: Keys.E,
			exec: () => {
				onEdit(contacts[0]);
			},
			help: "edit_action"
		});
		if (this.canMerge(contacts)) this.shortcuts.push({
			key: Keys.M,
			ctrlOrCmd: true,
			exec: () => {
				onMerge(contacts[0], contacts[1]);
			},
			help: "merge_action"
		});
		if (this.canExport(contacts)) this.shortcuts.push({
			key: Keys.E,
			ctrlOrCmd: true,
			exec: () => {
				onExport(contacts);
			},
			help: "export_action"
		});
		keyManager.registerShortcuts(this.shortcuts);
	}
	onremove() {
		keyManager.unregisterShortcuts(this.shortcuts);
	}
	canExport(contacts) {
		return contacts.length > 0;
	}
	canMerge(contacts) {
		return contacts.length === 2;
	}
	canDelete(contacts) {
		return contacts.length > 0;
	}
	canEdit(contacts) {
		return contacts.length === 1;
	}
};

//#endregion
//#region src/mail-app/contacts/view/ImportAsVCard.ts
async function importAsVCard() {
	const allowedExtensions = ["vcf"];
	const contactFiles = isApp() ? await showNativeFilePicker(allowedExtensions, true) : await showFileChooser(true, allowedExtensions);
	if (contactFiles.length <= 0) return;
	return showProgressDialog("pleaseWait_msg", (async () => {
		const contactImporter = await mailLocator.contactImporter();
		const contactListId = await locator.contactModel.getContactListId();
		const vCardList = contactFiles.flatMap((contactFile) => {
			return utf8Uint8ArrayToString(contactFile.data);
		});
		await contactImporter.importContactsFromFile(vCardList, contactListId);
	})());
}
function exportAsVCard(contactModel) {
	return showProgressDialog("pleaseWait_msg", contactModel.getContactListId().then((contactListId) => {
		if (!contactListId) return 0;
		return locator.entityClient.loadAll(ContactTypeRef, contactListId).then((allContacts) => {
			if (allContacts.length === 0) return 0;
else return exportContacts(allContacts).then(() => allContacts.length);
		});
	})).then((nbrOfContacts) => {
		if (nbrOfContacts === 0) Dialog.message("noContacts_msg");
	});
}

//#endregion
//#region src/mail-app/contacts/view/ContactListRecipientView.ts
assertMainOrNode();
var ContactListRecipientView = class {
	viewModel = null;
	view({ attrs: { viewModel, focusDetailsViewer } }) {
		this.viewModel = viewModel;
		const listModel = this.viewModel.listModel;
		return mithril_default(ListColumnWrapper, { headerContent: null }, listModel == null || listModel.isEmptyAndDone() ? mithril_default(ColumnEmptyMessageBox, {
			color: theme.list_message_bg,
			message: "noEntries_msg",
			icon: Icons.People
		}) : mithril_default(List, {
			renderConfig: this.renderConfig,
			state: listModel.state,
			onLoadMore: () => listModel.loadMore(),
			onRetryLoading: () => listModel.retryLoading(),
			onStopLoading: () => listModel.stopLoading(),
			onSingleSelection: (item) => {
				listModel.onSingleSelection(item);
				focusDetailsViewer();
			},
			onSingleTogglingMultiselection: (item) => {
				listModel.onSingleInclusiveSelection(item, styles.isSingleColumnLayout());
			},
			onRangeSelectionTowards: (item) => {
				listModel.selectRangeTowards(item);
			}
		}));
	}
	renderConfig = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			const recipientEntryRow = new RecipientRow((entity) => this.viewModel?.listModel?.onSingleExclusiveSelection(entity));
			mithril_default.render(dom, recipientEntryRow.render());
			return recipientEntryRow;
		}
	};
};
var RecipientRow = class {
	top = 0;
	domElement = null;
	checkboxDom;
	checkboxWasVisible = shouldAlwaysShowMultiselectCheckbox();
	entity = null;
	selectionUpdater;
	titleDom;
	idDom;
	constructor(onSelected) {
		this.onSelected = onSelected;
	}
	update(entry, selected, isInMultiSelect) {
		this.entity = entry;
		this.selectionUpdater(selected, false);
		this.showCheckboxAnimated(shouldAlwaysShowMultiselectCheckbox() || isInMultiSelect);
		checkboxOpacity(this.checkboxDom, selected);
		this.checkboxDom.checked = selected && isInMultiSelect;
		this.titleDom.textContent = entry.emailAddress;
	}
	showCheckboxAnimated(show) {
		if (this.checkboxWasVisible === show) return;
		if (show) {
			this.titleDom.style.paddingRight = shiftByForCheckbox;
			const addressAnim = this.titleDom.animate({ transform: [translateXHide, translateXShow] }, selectableRowAnimParams);
			const checkboxAnim = this.checkboxDom.animate({ transform: [scaleXHide, scaleXShow] }, selectableRowAnimParams);
			Promise.all([addressAnim.finished, checkboxAnim.finished]).then(() => {
				addressAnim.cancel();
				checkboxAnim.cancel();
				this.showCheckbox(show);
			}, noOp);
		} else {
			this.titleDom.style.paddingRight = "0";
			const addressAnim = this.titleDom.animate({ transform: [translateXShow, translateXHide] }, selectableRowAnimParams);
			const checkboxAnim = this.checkboxDom.animate({ transform: [scaleXShow, scaleXHide] }, selectableRowAnimParams);
			Promise.all([addressAnim.finished, checkboxAnim.finished]).then(() => {
				addressAnim.cancel();
				checkboxAnim.cancel();
				this.showCheckbox(show);
			}, noOp);
		}
		this.checkboxWasVisible = show;
	}
	render() {
		return mithril_default(SelectableRowContainer, {
			oncreate: (vnode) => {
				Promise.resolve().then(() => this.showCheckbox(shouldAlwaysShowMultiselectCheckbox()));
			},
			onSelectedChangeRef: (updater) => this.selectionUpdater = updater
		}, mithril_default(".mt-xs.abs", [
			mithril_default(".text-ellipsis.smaller.mt-xxs", { style: { height: px(9) } }),
			mithril_default("input.checkbox.list-checkbox", {
				type: "checkbox",
				style: { transformOrigin: "left" },
				onclick: (e) => {
					e.stopPropagation();
				},
				onchange: () => {
					if (this.entity) this.onSelected(this.entity, this.checkboxDom.checked);
				},
				oncreate: (vnode) => {
					this.checkboxDom = vnode.dom;
					checkboxOpacity(this.checkboxDom, false);
				}
			}),
			mithril_default(".text-ellipsis.smaller.mt-xxs", { style: { height: px(9) } })
		]), mithril_default(".flex.col.overflow-hidden.flex-grow", [mithril_default("", [
			mithril_default(".text-ellipsis.smaller.mt-xxs", { style: { height: px(9) } }),
			mithril_default(".text-ellipsis.badge-line-height", { oncreate: (vnode) => this.titleDom = vnode.dom }),
			mithril_default(".text-ellipsis.smaller.mt-xxs", { style: { height: px(9) } })
		])]));
	}
	showCheckbox(show) {
		let translate;
		let scale;
		let padding;
		if (show) {
			translate = translateXShow;
			scale = scaleXShow;
			padding = shiftByForCheckbox;
		} else {
			translate = translateXHide;
			scale = scaleXHide;
			padding = "0";
		}
		this.titleDom.style.transform = translate;
		this.titleDom.style.paddingRight = padding;
		this.checkboxDom.style.transform = scale;
		this.checkboxDom.style.display = show ? "" : "none";
	}
};

//#endregion
//#region src/mail-app/contacts/ContactListEditor.ts
async function showContactListEditor(contactListGroupRoot, headerText, save, addressesOnList) {
	let showNameInput = true;
	const recipientsSearch = await locator.recipientsSearchModel();
	if (contactListGroupRoot) {
		showNameInput = false;
		recipientsSearch.setFilter((item) => {
			return !(item.type === "contactlist" && isSameId(item.value.groupRoot._id, contactListGroupRoot._id));
		});
	}
	const editorModel = new ContactListEditorModel(addressesOnList ?? []);
	const dialogCloseAction = () => {
		dialog.close();
	};
	let headerBarAttrs = {
		left: [{
			label: "cancel_action",
			click: dialogCloseAction,
			type: ButtonType.Secondary
		}],
		right: [{
			label: "save_action",
			click: () => {
				save(editorModel.name, editorModel.newAddresses);
				dialog.close();
			},
			type: ButtonType.Primary
		}],
		middle: headerText
	};
	const dialog = Dialog.editDialog(headerBarAttrs, ContactListEditor, {
		model: editorModel,
		contactSearch: recipientsSearch,
		showNameInput
	}).addShortcut({
		key: Keys.ESC,
		exec: () => dialog.close(),
		help: "close_alt"
	});
	dialog.show();
}
async function showContactListNameEditor(name, save) {
	let nameInput = name;
	let form = () => [mithril_default(TextField, {
		label: "name_label",
		value: nameInput,
		oninput: (newInput) => {
			nameInput = newInput;
		}
	})];
	const okAction = async (dialog) => {
		dialog.close();
		save(nameInput);
	};
	Dialog.showActionDialog({
		title: "editContactList_action",
		child: form,
		allowOkWithReturn: true,
		okAction
	});
}
var ContactListEditorModel = class {
	name;
	newAddresses;
	currentAddresses;
	constructor(addresses) {
		this.name = "";
		this.newAddresses = [];
		this.currentAddresses = addresses;
	}
	addRecipient(address) {
		this.newAddresses = [address, ...this.newAddresses];
	}
	removeRecipient(address) {
		this.newAddresses = this.newAddresses.filter((a) => address !== a);
	}
};
var ContactListEditor = class {
	model;
	search;
	newAddress = "";
	showNameInput = true;
	constructor(vnode) {
		this.model = vnode.attrs.model;
		this.search = vnode.attrs.contactSearch;
		this.showNameInput = vnode.attrs.showNameInput ?? true;
	}
	view() {
		let helpLabel = null;
		if (this.newAddress.trim().length > 0 && !isMailAddress(this.newAddress.trim(), false)) helpLabel = () => lang.get("invalidInputFormat_msg");
else if (this.model.currentAddresses.includes(cleanMailAddress(this.newAddress)) || this.model.newAddresses.includes(cleanMailAddress(this.newAddress))) helpLabel = () => lang.get("addressAlreadyExistsOnList_msg");
		return mithril_default("", [
			this.showNameInput ? mithril_default(TextField, {
				label: "name_label",
				class: "big-input pt flex-grow",
				value: this.model.name,
				oninput: (name) => this.model.name = name
			}) : null,
			mithril_default(MailRecipientsTextField, {
				label: "addEntries_action",
				text: this.newAddress,
				onTextChanged: (v) => this.newAddress = v,
				recipients: [],
				disabled: false,
				onRecipientAdded: (address) => {
					if (!this.model.newAddresses.includes(address) && !this.model.currentAddresses.includes(address)) this.model.addRecipient(address);
					mithril_default.redraw();
				},
				onRecipientRemoved: noOp,
				search: this.search,
				helpLabel
			}),
			this.model.newAddresses.map((address) => this.renderAddress(address))
		]);
	}
	renderAddress(address) {
		return mithril_default(".flex", { style: {
			height: px(size.button_height),
			borderBottom: "1px transparent",
			marginTop: px(size.vpad)
		} }, [
			mithril_default(".flex.col.flex-grow.overflow-hidden.flex-no-grow-shrink-auto", [address]),
			mithril_default(".flex-grow"),
			mithril_default(IconButton, {
				title: "remove_action",
				icon: Icons.Cancel,
				click: () => this.model.removeRecipient(address)
			})
		]);
	}
};

//#endregion
//#region src/mail-app/contacts/view/ContactListEntryViewer.ts
var ContactListEntryViewer = class {
	view({ attrs }) {
		return mithril_default(".flex.flex-column", [
			mithril_default(".border-radius-big.rel", {
				class: responsiveCardHMargin(),
				style: { backgroundColor: theme.content_bg }
			}, mithril_default(".plr-l.pt.pb.mlr-safe-inset", mithril_default(".h2.selectable.text-break", attrs.entry.emailAddress))),
			mithril_default(".mt-l"),
			attrs.contacts.length >= 1 ? attrs.contacts.map((contact) => mithril_default(ContactCardViewer, {
				contact,
				onWriteMail: attrs.onWriteMail,
				editAction: attrs.contactEdit,
				deleteAction: attrs.contactDelete
			})) : mithril_default(".border-radius-big.rel", {
				class: responsiveCardHMargin(),
				style: { backgroundColor: theme.content_bg }
			}, mithril_default(".plr-l.pt.pb.mlr-safe-inset", lang.get("noContactFound_msg"), mithril_default(Button, {
				label: "createContact_action",
				click: () => {
					let newContact = createContact({
						mailAddresses: [createContactMailAddress({
							type: ContactAddressType.WORK,
							customTypeName: "",
							address: attrs.entry.emailAddress
						})],
						oldBirthdayAggregate: null,
						addresses: [],
						birthdayIso: null,
						comment: "",
						company: "",
						firstName: "",
						lastName: "",
						nickname: null,
						oldBirthdayDate: null,
						phoneNumbers: [],
						photo: null,
						role: "",
						presharedPassword: null,
						socialIds: [],
						title: null,
						department: null,
						middleName: null,
						nameSuffix: null,
						phoneticFirst: null,
						phoneticLast: null,
						phoneticMiddle: null,
						customDate: [],
						messengerHandles: [],
						pronouns: [],
						relationships: [],
						websites: []
					});
					attrs.contactCreate(newContact);
				},
				type: ButtonType.Primary
			})))
		]);
	}
};
function getContactListEntriesSelectionMessage(selectedEntities) {
	if (selectedEntities && selectedEntities.length > 0) return lang.getTranslation("nbrOfEntriesSelected_msg", { "{nbr}": selectedEntities.length });
else return lang.getTranslation("noSelection_msg");
}

//#endregion
//#region src/mail-app/contacts/view/ContactView.ts
assertMainOrNode();
var ContactView = class extends BaseTopLevelView {
	listColumn;
	folderColumn;
	viewSlider;
	contactViewModel;
	contactListViewModel;
	detailsColumn;
	invitationRows;
	oncreate;
	onremove;
	constructor(vnode) {
		super();
		this.contactViewModel = vnode.attrs.contactViewModel;
		this.contactListViewModel = vnode.attrs.contactListViewModel;
		this.contactListViewModel.init();
		this.folderColumn = new ViewColumn({ view: () => mithril_default(FolderColumnView, {
			drawer: vnode.attrs.drawerAttrs,
			button: styles.isUsingBottomNavigation() ? null : {
				label: "newContact_action",
				click: () => this.createNewContact()
			},
			content: [mithril_default(SidebarSection, { name: lang.makeTranslation("group_info", getGroupInfoDisplayName(locator.logins.getUserController().userGroupInfo)) }, this.renderSidebarElements())],
			ariaLabel: "folderTitle_label"
		}) }, ColumnType.Foreground, {
			minWidth: size.first_col_min_width,
			maxWidth: size.first_col_max_width,
			headerCenter: "folderTitle_label"
		});
		this.listColumn = new ViewColumn({ view: () => this.inContactListView() ? this.renderContactListRecipientColumn(vnode.attrs.header) : this.renderContactListColumn(vnode.attrs.header) }, ColumnType.Background, {
			minWidth: size.second_col_min_width,
			maxWidth: size.second_col_max_width,
			headerCenter: this.getHeaderLabel()
		});
		this.detailsColumn = new ViewColumn({ view: () => mithril_default(BackgroundColumnLayout, {
			backgroundColor: theme.navigation_bg,
			desktopToolbar: () => mithril_default(DesktopViewerToolbar, this.detailsViewerActions()),
			mobileHeader: () => mithril_default(MobileHeader, {
				...vnode.attrs.header,
				backAction: () => this.viewSlider.focusPreviousColumn(),
				actions: null,
				multicolumnActions: () => this.detailsViewerActions(),
				primaryAction: () => {
					return this.inContactListView() ? null : this.renderHeaderRightView();
				},
				title: this.getHeaderLabel(),
				columnType: "other"
			}),
			columnLayout: mithril_default(".fill-absolute.flex.col.overflow-y-scroll", this.renderDetailsViewer())
		}) }, ColumnType.Background, {
			minWidth: size.third_col_min_width,
			maxWidth: size.third_col_max_width,
			ariaLabel: () => this.getHeaderLabel()
		});
		this.viewSlider = new ViewSlider([
			this.folderColumn,
			this.listColumn,
			this.detailsColumn
		]);
		const shortcuts = this.getShortcuts();
		this.oncreate = (vnode$1) => {
			keyManager.registerShortcuts(shortcuts);
		};
		this.onremove = () => {
			keyManager.unregisterShortcuts(shortcuts);
		};
	}
	renderContactListColumn(header) {
		return mithril_default(BackgroundColumnLayout, {
			backgroundColor: theme.navigation_bg,
			columnLayout: mithril_default(ContactListView, {
				contactViewModel: this.contactViewModel,
				onSingleSelection: () => {
					this.viewSlider.focus(this.detailsColumn);
				}
			}),
			desktopToolbar: () => this.renderListToolbar(),
			mobileHeader: () => this.contactViewModel.listModel.state.inMultiselect ? mithril_default(MultiselectMobileHeader, {
				...selectionAttrsForList(this.contactViewModel.listModel),
				message: getContactSelectionMessage(this.getSelectedContacts().length)
			}) : mithril_default(MobileHeader, {
				...header,
				backAction: () => this.viewSlider.focusPreviousColumn(),
				columnType: "first",
				title: this.listColumn.getTitle(),
				actions: mithril_default(".flex", [this.renderSortByButton(), mithril_default(EnterMultiselectIconButton, { clickAction: () => {
					this.contactViewModel.listModel.enterMultiselect();
				} })]),
				primaryAction: () => this.renderHeaderRightView()
			})
		});
	}
	renderContactListRecipientColumn(header) {
		return mithril_default(BackgroundColumnLayout, {
			backgroundColor: theme.navigation_bg,
			columnLayout: mithril_default(ContactListRecipientView, {
				viewModel: this.contactListViewModel,
				focusDetailsViewer: () => {
					this.viewSlider.focus(this.detailsColumn);
				}
			}),
			desktopToolbar: () => this.renderListToolbar(),
			mobileHeader: () => this.contactListViewModel.listModel?.state.inMultiselect ? mithril_default(MultiselectMobileHeader, {
				...selectionAttrsForList(this.contactListViewModel.listModel),
				message: getContactSelectionMessage(this.contactListViewModel.listModel?.getSelectedAsArray().length)
			}) : mithril_default(MobileHeader, {
				...header,
				backAction: () => this.viewSlider.focusPreviousColumn(),
				columnType: "first",
				title: this.listColumn.getTitle(),
				actions: mithril_default(".flex", [mithril_default(EnterMultiselectIconButton, { clickAction: () => {
					this.contactListViewModel.listModel?.enterMultiselect();
				} })]),
				primaryAction: () => {
					if (this.canEditSelectedContactList()) return mithril_default(IconButton, {
						title: "addEntries_action",
						click: () => this.addAddressesToContactList(),
						icon: Icons.Add
					});
else return null;
				}
			})
		});
	}
	canEditSelectedContactList() {
		const contactListInfo = this.contactListViewModel.getSelectedContactListInfo();
		return contactListInfo != null && contactListInfo.canEdit;
	}
	detailsViewerActions() {
		if (this.inContactListView()) {
			const recipients = this.contactListViewModel.getSelectedContactListEntries();
			if (recipients && recipients.length > 0 && this.canEditSelectedContactList()) return mithril_default(IconButton, {
				title: "delete_action",
				icon: Icons.Trash,
				click: () => this.contactListViewModel.deleteContactListEntries(recipients)
			});
		} else {
			const contacts = this.getSelectedContacts();
			return mithril_default(ContactViewerActions, {
				contacts,
				onEdit: (c) => this.editContact(c),
				onExport: exportContacts,
				onDelete: (contacts$1) => deleteContacts(contacts$1, () => this.contactViewModel.listModel.selectNone()),
				onMerge: confirmMerge
			});
		}
	}
	inContactListView() {
		return mithril_default.route.get().startsWith(CONTACTLIST_PREFIX);
	}
	showingListView() {
		return this.inContactListView() ? this.contactListViewModel.getSelectedContactListEntries()?.length === 0 || this.contactListViewModel.listModel?.state.inMultiselect : this.getSelectedContacts().length === 0 || this.contactViewModel.listModel.state.inMultiselect;
	}
	view({ attrs }) {
		this.getContactListInvitationRows();
		return mithril_default("#contact.main-view", mithril_default(this.viewSlider, {
			header: styles.isSingleColumnLayout() ? null : mithril_default(Header, {
				searchBar: () => this.inContactListView() ? null : mithril_default(LazySearchBar, {
					placeholder: lang.get("searchContacts_placeholder"),
					disabled: !locator.logins.isFullyLoggedIn()
				}),
				...attrs.header
			}),
			bottomNav: styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.detailsColumn && !this.showingListView() ? this.inContactListView() ? mithril_default(MobileActionBar, { actions: this.canEditSelectedContactList() ? [{
				icon: Icons.Trash,
				title: "delete_action",
				action: () => this.contactListViewModel.deleteSelectedEntries()
			}] : [] }) : mithril_default(MobileActionBar, { actions: [{
				icon: Icons.Edit,
				title: "edit_action",
				action: () => this.editSelectedContact()
			}, {
				icon: Icons.Trash,
				title: "delete_action",
				action: () => this.deleteSelectedContacts()
			}] }) : styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.listColumn && this.contactViewModel.listModel.state.inMultiselect || this.contactListViewModel.listModel?.state.inMultiselect ? mithril_default(MobileBottomActionBar, this.detailsViewerActions()) : mithril_default(BottomNav)
		}));
	}
	getHeaderLabel() {
		if (this.inContactListView()) return "contactLists_label";
else return "contacts_label";
	}
	getSelectedContacts() {
		return this.contactViewModel.listModel.getSelectedAsArray();
	}
	async getContactListId() {
		if (this.inContactListView()) return assertNotNull(await this.contactListViewModel.getContactListId());
else return this.contactViewModel.contactListId;
	}
	async createNewContact() {
		const listId = await this.getContactListId();
		if (listId) new ContactEditor(locator.entityClient, null, listId).show();
	}
	editSelectedContact() {
		const firstSelected = this.getSelectedContacts()[0];
		if (!firstSelected) return;
		this.editContact(firstSelected);
	}
	editContact(contact, listId) {
		new ContactEditor(locator.entityClient, contact, listId).show();
	}
	renderHeaderRightView() {
		return mithril_default(IconButton, {
			title: "newContact_action",
			click: () => this.createNewContact(),
			icon: Icons.Add
		});
	}
	renderDetailsViewer() {
		if (this.inContactListView()) {
			const entries = this.contactListViewModel.getSelectedContactListEntries() ?? [];
			return this.contactListViewModel.listModel == null || this.showingListView() ? mithril_default(ColumnEmptyMessageBox, {
				message: getContactListEntriesSelectionMessage(entries),
				icon: Icons.People,
				color: theme.content_message_bg,
				bottomContent: entries.length > 0 ? mithril_default(Button, {
					label: "cancel_action",
					type: ButtonType.Secondary,
					click: () => this.contactListViewModel.listModel?.selectNone()
				}) : null,
				backgroundColor: theme.navigation_bg
			}) : mithril_default(ContactListEntryViewer, {
				entry: getFirstOrThrow(entries),
				contacts: this.contactListViewModel.contactsForSelectedEntry,
				contactEdit: (c) => this.editContact(c),
				contactDelete: deleteContacts,
				contactCreate: async (c) => {
					const listId = await this.getContactListId();
					if (listId) this.editContact(c, listId);
				},
				onWriteMail: writeMail,
				selectNone: () => this.contactListViewModel.listModel?.selectNone()
			});
		} else {
			const contacts = this.getSelectedContacts();
			return this.showingListView() ? mithril_default(MultiContactViewer, {
				selectedEntities: contacts,
				selectNone: () => this.contactViewModel.listModel.selectNone()
			}) : mithril_default(ContactCardViewer, {
				contact: contacts[0],
				onWriteMail: writeMail
			});
		}
	}
	getShortcuts() {
		let shortcuts = [
			...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => {
				return this.inContactListView() ? this.contactListViewModel.listModel : this.contactViewModel.listModel;
			}),
			{
				key: Keys.DELETE,
				exec: () => {
					if (this.inContactListView()) this.contactListViewModel.deleteSelectedEntries();
else this.deleteSelectedContacts();
					return true;
				},
				help: "deleteContacts_action"
			},
			{
				key: Keys.BACKSPACE,
				exec: () => {
					if (this.inContactListView()) this.contactListViewModel.deleteSelectedEntries();
else this.deleteSelectedContacts();
					return true;
				},
				help: "deleteContacts_action"
			},
			{
				key: Keys.N,
				exec: () => {
					this.createNewContact();
				},
				help: "newContact_action"
			}
		];
		return shortcuts;
	}
	renderSidebarElements() {
		return [
			mithril_default(SidebarSectionRow, {
				icon: BootIcons.Contacts,
				label: "all_contacts_label",
				path: `/contact`,
				onClick: () => this.viewSlider.focus(this.listColumn),
				moreButton: this.createMoreButtonAttrs(),
				alwaysShowMoreButton: client.isMobileDevice()
			}),
			mithril_default(SidebarSection, {
				name: "contactLists_label",
				button: mithril_default(IconButton, {
					icon: Icons.Add,
					size: ButtonSize.Compact,
					title: "addContactList_action",
					click: () => {
						this.addContactList();
					}
				})
			}, [this.contactListViewModel.getOwnContactListInfos().map((cl) => {
				return this.renderContactListRow(cl, false);
			})]),
			this.contactListViewModel.getSharedContactListInfos().length > 0 ? mithril_default("", mithril_default(SidebarSection, { name: "sharedContactLists_label" }, this.contactListViewModel.getSharedContactListInfos().map((cl) => {
				return this.renderContactListRow(cl, true);
			}))) : null,
			this.contactListViewModel.getContactListInvitations().length > 0 ? mithril_default(SidebarSection, { name: "contactListInvitations_label" }, this.invitationRows) : null
		];
	}
	getContactListInvitationRows() {
		import("./GroupInvitationFolderRow2-chunk.js").then(({ GroupInvitationFolderRow }) => {
			this.invitationRows = this.contactListViewModel.getContactListInvitations().map((invitation) => mithril_default(GroupInvitationFolderRow, { invitation }));
		}).then(mithril_default.redraw);
	}
	renderFolderMoreButton() {
		return mithril_default(IconButton, this.createMoreButtonAttrs());
	}
	createMoreButtonAttrs() {
		return attachDropdown({
			mainButtonAttrs: {
				title: "more_label",
				icon: Icons.More,
				size: ButtonSize.Compact,
				colors: ButtonColor.Nav
			},
			childAttrs: () => {
				const vcardButtons = isApp() ? [{
					label: "importContacts_label",
					click: () => importContacts(),
					icon: Icons.ContactImport
				}] : [{
					label: "exportVCard_action",
					click: () => exportAsVCard(locator.contactModel),
					icon: Icons.Export
				}];
				return vcardButtons.concat([{
					label: "importVCard_action",
					click: () => importAsVCard(),
					icon: Icons.ContactImport
				}, {
					label: "merge_action",
					icon: Icons.People,
					click: () => this._mergeAction()
				}]);
			},
			width: 250
		});
	}
	renderContactListRow(contactListInfo, shared) {
		const contactListButton = {
			label: lang.makeTranslation("contactListName_label", contactListInfo.name),
			icon: () => Icons.People,
			href: () => `${CONTACTLIST_PREFIX}/${contactListInfo.groupRoot.entries}`,
			disableHoverBackground: true,
			click: () => {
				this.contactListViewModel.updateSelectedContactList(contactListInfo.groupRoot.entries);
				this.viewSlider.focus(this.listColumn);
			}
		};
		const moreButton = this.createContactListMoreButton(contactListInfo, shared);
		return mithril_default(SidebarSectionRow, {
			icon: Icons.People,
			label: lang.makeTranslation("contactlist_name", contactListInfo.name),
			path: `${CONTACTLIST_PREFIX}/${contactListInfo.groupRoot.entries}`,
			onClick: () => {
				this.contactListViewModel.updateSelectedContactList(contactListInfo.groupRoot.entries);
				this.viewSlider.focus(this.listColumn);
			},
			moreButton
		});
	}
	createContactListMoreButton(contactListInfo, shared) {
		return attachDropdown({
			mainButtonAttrs: {
				title: "more_label",
				icon: Icons.More,
				colors: ButtonColor.Nav,
				size: ButtonSize.Compact
			},
			childAttrs: () => {
				return [
					{
						label: "edit_action",
						icon: Icons.Edit,
						click: () => {
							showContactListNameEditor(contactListInfo.name, (newName) => {
								if (shared) this.editSharedContactList(contactListInfo, newName);
else this.contactListViewModel.updateContactList(contactListInfo, newName, []);
							});
						}
					},
					{
						label: "sharing_label",
						icon: Icons.ContactImport,
						click: async () => {
							const { showGroupSharingDialog } = await import("./GroupSharingDialog2-chunk.js");
							showGroupSharingDialog(contactListInfo.groupInfo, true);
						}
					},
					contactListInfo.isOwner ? {
						label: "delete_action",
						icon: Icons.Trash,
						click: async () => {
							if (await Dialog.confirm("confirmDeleteContactList_msg")) this.contactListViewModel.deleteContactList(contactListInfo);
						}
					} : {
						label: "leaveGroup_action",
						icon: Icons.Trash,
						click: async () => {
							if (await Dialog.confirm(lang.makeTranslation("confirm_msg", lang.get("confirmLeaveSharedGroup_msg", { "{groupName}": contactListInfo.name })))) return this.contactListViewModel.removeUserFromContactList(contactListInfo);
						}
					}
				];
			}
		});
	}
	editSharedContactList(contactListInfo, newName) {
		const { userSettingsGroupRoot } = locator.logins.getUserController();
		const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === contactListInfo.groupInfo.group) ?? null;
		if (existingGroupSettings) existingGroupSettings.name = newName;
		locator.entityClient.update(userSettingsGroupRoot);
		contactListInfo.name = newName;
	}
	_mergeAction() {
		return showProgressDialog("pleaseWait_msg", locator.contactModel.getContactListId().then((contactListId) => {
			return contactListId ? locator.entityClient.loadAll(ContactTypeRef, contactListId) : [];
		})).then((allContacts) => {
			if (allContacts.length === 0) Dialog.message("noContacts_msg");
else {
				let mergeableAndDuplicates = getMergeableContacts(allContacts);
				let deletePromise = Promise.resolve();
				if (mergeableAndDuplicates.deletable.length > 0) deletePromise = Dialog.confirm(lang.makeTranslation("confirm_msg", lang.get("duplicatesNotification_msg", { "{1}": mergeableAndDuplicates.deletable.length }))).then((confirmed) => {
					if (confirmed) for (const dc of mergeableAndDuplicates.deletable) locator.entityClient.erase(dc);
				});
				deletePromise.then(() => {
					if (mergeableAndDuplicates.mergeable.length === 0) Dialog.message(lang.makeTranslation("confirm_msg", lang.get("noSimilarContacts_msg")));
else this._showMergeDialogs(mergeableAndDuplicates.mergeable).then((canceled) => {
						if (!canceled) Dialog.message("noMoreSimilarContacts_msg");
					});
				});
			}
		});
	}
	/**
	* @returns True if the merging was canceled by the user, false otherwise
	*/
	_showMergeDialogs(mergable) {
		let canceled = false;
		if (mergable.length > 0) {
			let contact1 = mergable[0][0];
			let contact2 = mergable[0][1];
			let mergeDialog = new ContactMergeView(contact1, contact2);
			return mergeDialog.show().then((action) => {
				if (action === ContactMergeAction.Merge) {
					this._removeFromMergableContacts(mergable, contact2);
					mergeContacts(contact1, contact2);
					return showProgressDialog("pleaseWait_msg", locator.entityClient.update(contact1).then(() => locator.entityClient.erase(contact2))).catch(ofClass(NotFoundError, noOp));
				} else if (action === ContactMergeAction.DeleteFirst) {
					this._removeFromMergableContacts(mergable, contact1);
					return locator.entityClient.erase(contact1);
				} else if (action === ContactMergeAction.DeleteSecond) {
					this._removeFromMergableContacts(mergable, contact2);
					return locator.entityClient.erase(contact2);
				} else if (action === ContactMergeAction.Skip) this._removeFromMergableContacts(mergable, contact2);
else if (action === ContactMergeAction.Cancel) {
					clear(mergable);
					canceled = true;
				}
			}).then(() => {
				if (!canceled && mergable.length > 0) return this._showMergeDialogs(mergable);
else return canceled;
			});
		} else return Promise.resolve(canceled);
	}
	/**
	* removes the given contact from the given mergable arrays first entry (first or second element)
	*/
	_removeFromMergableContacts(mergable, contact) {
		if (mergable[0][0] === contact) mergable[0].splice(0, 1);
else if (mergable[0][1] === contact) mergable[0].splice(1, 1);
		if (mergable[0].length <= 1) mergable.splice(0, 1);
	}
	onNewUrl(args) {
		if (this.inContactListView()) this.contactListViewModel.showListAndEntry(args.listId, args.Id).then(mithril_default.redraw);
else this.contactViewModel.init(args.listId).then(() => this.contactViewModel.selectContact(args.contactId));
		if (args.focusItem) this.viewSlider.focus(this.detailsColumn);
	}
	deleteSelectedContacts() {
		return deleteContacts(this.getSelectedContacts(), () => this.contactViewModel.listModel.selectNone());
	}
	getViewSlider() {
		return this.viewSlider;
	}
	handleBackButton() {
		if (this.viewSlider.focusedColumn === this.detailsColumn) {
			this.viewSlider.focus(this.listColumn);
			return true;
		} else if (this.showingListView() && (this.contactViewModel.listModel.state.inMultiselect || this.contactListViewModel.listModel && this.contactListViewModel.listModel?.state.inMultiselect)) {
			this.contactViewModel.listModel.selectNone();
			this.contactListViewModel.listModel?.selectNone();
			return true;
		}
		return false;
	}
	renderListToolbar() {
		if (this.inContactListView()) {
			const selectedList = this.contactListViewModel.getSelectedContactListInfo();
			return mithril_default(DesktopListToolbar, mithril_default(SelectAllCheckbox, selectionAttrsForList(this.contactListViewModel.listModel)), mithril_default(".flex-grow"), this.canEditSelectedContactList() ? mithril_default(IconButton, {
				title: "addEntries_action",
				icon: Icons.Add,
				click: () => {
					this.addAddressesToContactList();
				}
			}) : null);
		} else return mithril_default(DesktopListToolbar, mithril_default(SelectAllCheckbox, selectionAttrsForList(this.contactViewModel.listModel)), this.renderSortByButton());
	}
	addAddressesToContactList() {
		const groupRoot = this.contactListViewModel.getSelectedContactListInfo()?.groupRoot;
		if (!groupRoot) return;
		showContactListEditor(groupRoot, "addEntries_action", (_, addresses) => {
			this.contactListViewModel.addRecipientstoContactList(addresses, assertNotNull(groupRoot));
		}, this.contactListViewModel.listModel?.getUnfilteredAsArray().map((entry) => entry.emailAddress));
	}
	renderSortByButton() {
		return mithril_default(IconButton, {
			title: "sortBy_label",
			icon: Icons.ListOrdered,
			click: (e, dom) => {
				createDropdown({ lazyButtons: () => [{
					label: "firstName_placeholder",
					click: () => {
						this.contactViewModel.setSortByFirstName(true);
					}
				}, {
					label: "lastName_placeholder",
					click: () => {
						this.contactViewModel.setSortByFirstName(false);
					}
				}] })(e, dom);
			}
		});
	}
	async addContactList() {
		if (await this.contactListViewModel.canCreateContactList()) await showContactListEditor(null, "createContactList_action", (name, recipients) => {
			this.contactListViewModel.addContactList(name, recipients);
		});
else if (locator.logins.getUserController().isGlobalAdmin()) {
			const { getAvailablePlansWithContactList } = await import("./SubscriptionUtils2-chunk.js");
			const plans = await getAvailablePlansWithContactList();
			await showPlanUpgradeRequiredDialog(plans);
		} else Dialog.message("contactAdmin_msg");
	}
};
function writeMail(to, subject = "") {
	return locator.mailboxModel.getUserMailboxDetails().then((mailboxDetails) => {
		return newMailEditorFromTemplate(mailboxDetails, { to: [to] }, subject, appendEmailSignature("", locator.logins.getUserController().props)).then((editor) => editor.show());
	});
}
function deleteContacts(contactList, onConfirm = noOp) {
	return Dialog.confirm("deleteContacts_msg").then((confirmed) => {
		if (confirmed) {
			onConfirm();
			for (const contact of contactList) locator.entityClient.erase(contact).catch(ofClass(NotFoundError, noOp)).catch(ofClass(LockedError, noOp));
		}
	});
}
function confirmMerge(keptContact, goodbyeContact) {
	if (!keptContact.presharedPassword || !goodbyeContact.presharedPassword || keptContact.presharedPassword === goodbyeContact.presharedPassword) return Dialog.confirm("mergeAllSelectedContacts_msg").then((confirmed) => {
		if (confirmed) {
			mergeContacts(keptContact, goodbyeContact);
			return showProgressDialog("pleaseWait_msg", locator.entityClient.update(keptContact).then(() => locator.entityClient.erase(goodbyeContact))).catch(ofClass(NotFoundError, noOp));
		}
	});
else return Dialog.message("presharedPasswordsUnequal_msg");
}
async function importContacts() {
	const importer = await mailLocator.contactImporter();
	await importer.importContactsFromDeviceSafely();
}

//#endregion
export { ContactCardViewer, ContactView, ContactViewerActions, MobileActionBar, MultiContactViewer, confirmMerge, deleteContacts, exportContacts, getContactSelectionMessage, importContacts, writeMail };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29udGFjdFZpZXctY2h1bmsuanMiLCJuYW1lcyI6WyJjb250YWN0OiBDb250YWN0IiwiYXR0cnM6IENvbnRhY3RWaWV3ZXJBdHRycyIsImFjdGlvbnM6IHsgbGFiZWw6IFRyYW5zbGF0aW9uS2V5OyBpY29uOiBBbGxJY29uczsgY2xpY2s6ICgpID0+IHZvaWQgfVtdIiwib25Xcml0ZU1haWw6IENvbnRhY3RWaWV3ZXJBdHRyc1tcIm9uV3JpdGVNYWlsXCJdIiwiY29udGFjdFNvY2lhbElkOiBDb250YWN0U29jaWFsSWQiLCJ3ZWJzaXRlOiBDb250YWN0V2Vic2l0ZSIsIm1lc3NlbmdlckhhbmRsZTogQ29udGFjdE1lc3NlbmdlckhhbmRsZSIsImFkZHJlc3M6IENvbnRhY3RBZGRyZXNzIiwicGhvbmU6IENvbnRhY3RQaG9uZU51bWJlciIsInByZXBBZGRyZXNzOiBzdHJpbmciLCJhcnJheTogQ2hpbGRyZW5bXSIsInNwYWNlcjogKCkgPT4gQ2hpbGRyZW4iLCJyZXQ6IENoaWxkcmVuIiwibnVtYmVyRW50aXRpZXM6IG51bWJlciIsInZub2RlOiBWbm9kZTxUZXh0RGlzcGxheUFyZWFBdHRycz4iLCJjb250YWN0MTogQ29udGFjdCIsImNvbnRhY3QyOiBDb250YWN0IiwiY29tbWVudEZpZWxkMTogQ2hpbGRyZW4iLCJjb21tZW50RmllbGQyOiBDaGlsZHJlbiIsImNvbnRhY3Q6IENvbnRhY3QiLCJ2YWx1ZTE6IHN0cmluZyB8IG51bGwiLCJ2YWx1ZTI6IHN0cmluZyB8IG51bGwiLCJsYWJlbFRleHRJZDogVHJhbnNsYXRpb25LZXkiLCJhY3Rpb246IENvbnRhY3RNZXJnZUFjdGlvbiIsImlucHV0Q29udGFjdHM6IENvbnRhY3RbXSIsIm1lcmdhYmxlQ29udGFjdHM6IENvbnRhY3RbXVtdIiwiZHVwbGljYXRlQ29udGFjdHM6IENvbnRhY3RbXSIsImN1cnJlbnRNZXJnYWJsZUNvbnRhY3RzOiBDb250YWN0W10iLCJrZXB0Q29udGFjdDogQ29udGFjdCIsImVsaW1pbmF0ZWRDb250YWN0OiBDb250YWN0IiwiY29udGFjdDE6IENvbnRhY3QiLCJjb250YWN0MjogQ29udGFjdCIsIm5hbWUxOiBzdHJpbmciLCJuYW1lMjogc3RyaW5nIiwiY29udGFjdDFNYWlsQWRkcmVzc2VzOiBDb250YWN0TWFpbEFkZHJlc3NbXSIsImNvbnRhY3QyTWFpbEFkZHJlc3NlczogQ29udGFjdE1haWxBZGRyZXNzW10iLCJtYWlsQWRkcmVzc2VzMTogQ29udGFjdE1haWxBZGRyZXNzW10iLCJtYWlsQWRkcmVzc2VzMjogQ29udGFjdE1haWxBZGRyZXNzW10iLCJjb250YWN0MVBob25lTnVtYmVyczogQ29udGFjdFBob25lTnVtYmVyW10iLCJjb250YWN0MlBob25lTnVtYmVyczogQ29udGFjdFBob25lTnVtYmVyW10iLCJwaG9uZU51bWJlcnMxOiBDb250YWN0UGhvbmVOdW1iZXJbXSIsInBob25lTnVtYmVyczI6IENvbnRhY3RQaG9uZU51bWJlcltdIiwiY29udGFjdDFTb2NpYWxJZHM6IENvbnRhY3RTb2NpYWxJZFtdIiwiY29udGFjdDJTb2NpYWxJZHM6IENvbnRhY3RTb2NpYWxJZFtdIiwic29jaWFsSWRzMTogQ29udGFjdFNvY2lhbElkW10iLCJzb2NpYWxJZHMyOiBDb250YWN0U29jaWFsSWRbXSIsImNvbnRhY3QxQWRkcmVzc2VzOiBDb250YWN0QWRkcmVzc1tdIiwiY29udGFjdDJBZGRyZXNzZXM6IENvbnRhY3RBZGRyZXNzW10iLCJhZGRyZXNzZXMxOiBDb250YWN0QWRkcmVzc1tdIiwiYWRkcmVzc2VzMjogQ29udGFjdEFkZHJlc3NbXSIsImlzb0JpcnRoZGF5OiBzdHJpbmcgfCBudWxsIiwidmFsdWVzMTogc3RyaW5nW10iLCJ2YWx1ZXMyOiBzdHJpbmdbXSIsIm90aGVyQXR0cmlidXRlMTogc3RyaW5nIHwgbnVsbCIsIm90aGVyQXR0cmlidXRlMjogc3RyaW5nIHwgbnVsbCIsInNlcGFyYXRvcjogc3RyaW5nIiwiYmlydGhkYXkxOiBzdHJpbmcgfCBudWxsIiwiYmlydGhkYXkyOiBzdHJpbmcgfCBudWxsIiwiY29udGFjdHM6IENvbnRhY3RbXSIsImNvbnRhY3Q6IENvbnRhY3QiLCJhZGRyZXNzZXM6IENvbnRhY3RNYWlsQWRkcmVzc1tdIHwgQ29udGFjdEFkZHJlc3NbXSIsIm51bWJlcnM6IENvbnRhY3RQaG9uZU51bWJlcltdIiwic29jaWFsSWRzOiBDb250YWN0U29jaWFsSWRbXSIsInR5cGVBbmRDb250ZW50QXJyYXk6IHtcblx0XHRLSU5EOiBzdHJpbmdcblx0XHRDT05URU5UOiBzdHJpbmdcblx0fVtdIiwidGFnQ29udGVudDogc3RyaW5nIiwidGV4dDogc3RyaW5nIiwic2VwYXJhdGVMaW5lc0FycmF5OiBzdHJpbmdbXSIsImNvbnRlbnQ6IHN0cmluZyIsInZub2RlOiBWbm9kZTxNb2JpbGVBY3Rpb25CYXJBdHRycz4iLCJhY3Rpb25CdXR0b25zOiBDaGlsZHJlbltdIiwidm5vZGU6IFZub2RlRE9NPENvbnRhY3RWaWV3VG9vbGJhckF0dHJzPiIsImNvbnRhY3RzOiBDb250YWN0W10iLCJjb250YWN0TW9kZWw6IENvbnRhY3RNb2RlbCIsIml0ZW06IENvbnRhY3RMaXN0RW50cnkiLCJvblNlbGVjdGVkOiAoZW50aXR5OiBDb250YWN0TGlzdEVudHJ5LCBzZWxlY3RlZDogYm9vbGVhbikgPT4gdW5rbm93biIsImVudHJ5OiBDb250YWN0TGlzdEVudHJ5Iiwic2VsZWN0ZWQ6IGJvb2xlYW4iLCJpc0luTXVsdGlTZWxlY3Q6IGJvb2xlYW4iLCJzaG93OiBib29sZWFuIiwiZTogTW91c2VFdmVudCIsImNvbnRhY3RMaXN0R3JvdXBSb290OiBDb250YWN0TGlzdEdyb3VwUm9vdCB8IG51bGwiLCJoZWFkZXJUZXh0OiBUcmFuc2xhdGlvbktleSIsInNhdmU6IChuYW1lOiBzdHJpbmcsIGFkZHJlc3NlczogQXJyYXk8c3RyaW5nPikgPT4gdm9pZCIsImFkZHJlc3Nlc09uTGlzdD86IEFycmF5PHN0cmluZz4iLCJoZWFkZXJCYXJBdHRyczogRGlhbG9nSGVhZGVyQmFyQXR0cnMiLCJuYW1lOiBzdHJpbmciLCJzYXZlOiAobmFtZTogc3RyaW5nKSA9PiB2b2lkIiwiZGlhbG9nOiBEaWFsb2ciLCJhZGRyZXNzZXM6IEFycmF5PHN0cmluZz4iLCJhZGRyZXNzOiBzdHJpbmciLCJ2bm9kZTogVm5vZGU8Q29udGFjdExpc3RFZGl0b3JBdHRycz4iLCJoZWxwTGFiZWw6IGxhenk8c3RyaW5nPiB8IG51bGwiLCJzZWxlY3RlZEVudGl0aWVzOiBDb250YWN0TGlzdEVudHJ5W10gfCB1bmRlZmluZWQiLCJ2bm9kZTogVm5vZGU8Q29udGFjdFZpZXdBdHRycz4iLCJ2bm9kZSIsImhlYWRlcjogQXBwSGVhZGVyQXR0cnMiLCJjb250YWN0czogQ29udGFjdFtdIiwiY29udGFjdHMiLCJjb250YWN0OiBDb250YWN0IiwibGlzdElkPzogSWQiLCJjOiBDb250YWN0Iiwic2hvcnRjdXRzOiBTaG9ydGN1dFtdIiwibSIsInZjYXJkQnV0dG9uczogQXJyYXk8RHJvcGRvd25CdXR0b25BdHRycz4iLCJjb250YWN0TGlzdEluZm86IENvbnRhY3RMaXN0SW5mbyIsInNoYXJlZDogYm9vbGVhbiIsImNvbnRhY3RMaXN0QnV0dG9uOiBOYXZCdXR0b25BdHRycyIsIm5ld05hbWU6IHN0cmluZyIsIm1lcmdhYmxlOiBDb250YWN0W11bXSIsImFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4iLCJlOiBNb3VzZUV2ZW50IiwiZG9tOiBIVE1MRWxlbWVudCIsInRvOiBQYXJ0aWFsUmVjaXBpZW50Iiwic3ViamVjdDogc3RyaW5nIiwiY29udGFjdExpc3Q6IENvbnRhY3RbXSIsIm9uQ29uZmlybTogKCkgPT4gdm9pZCIsImtlcHRDb250YWN0OiBDb250YWN0IiwiZ29vZGJ5ZUNvbnRhY3Q6IENvbnRhY3QiXSwic291cmNlcyI6WyIuLi9zcmMvbWFpbC1hcHAvY29udGFjdHMvdmlldy9Db250YWN0Vmlld2VyLnRzIiwiLi4vc3JjL21haWwtYXBwL2NvbnRhY3RzL3ZpZXcvQ29udGFjdENhcmRWaWV3ZXIudHMiLCIuLi9zcmMvbWFpbC1hcHAvY29udGFjdHMvdmlldy9NdWx0aUNvbnRhY3RWaWV3ZXIudHMiLCIuLi9zcmMvY29tbW9uL2d1aS9iYXNlL1RleHREaXNwbGF5QXJlYS50cyIsIi4uL3NyYy9tYWlsLWFwcC9jb250YWN0cy92aWV3L0NvbnRhY3RNZXJnZVZpZXcudHMiLCIuLi9zcmMvbWFpbC1hcHAvY29udGFjdHMvQ29udGFjdE1lcmdlVXRpbHMudHMiLCIuLi9zcmMvbWFpbC1hcHAvY29udGFjdHMvVkNhcmRFeHBvcnRlci50cyIsIi4uL3NyYy9jb21tb24vZ3VpL01vYmlsZUFjdGlvbkJhci50cyIsIi4uL3NyYy9tYWlsLWFwcC9jb250YWN0cy92aWV3L0NvbnRhY3RWaWV3ZXJBY3Rpb25zLnRzIiwiLi4vc3JjL21haWwtYXBwL2NvbnRhY3RzL3ZpZXcvSW1wb3J0QXNWQ2FyZC50cyIsIi4uL3NyYy9tYWlsLWFwcC9jb250YWN0cy92aWV3L0NvbnRhY3RMaXN0UmVjaXBpZW50Vmlldy50cyIsIi4uL3NyYy9tYWlsLWFwcC9jb250YWN0cy9Db250YWN0TGlzdEVkaXRvci50cyIsIi4uL3NyYy9tYWlsLWFwcC9jb250YWN0cy92aWV3L0NvbnRhY3RMaXN0RW50cnlWaWV3ZXIudHMiLCIuLi9zcmMvbWFpbC1hcHAvY29udGFjdHMvdmlldy9Db250YWN0Vmlldy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ2xhc3NDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgbGFuZywgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgVGV4dEZpZWxkLCBUZXh0RmllbGRUeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9UZXh0RmllbGQuanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zXCJcbmltcG9ydCB7XG5cdENvbnRhY3RBZGRyZXNzVHlwZSxcblx0Q29udGFjdFBob25lTnVtYmVyVHlwZSxcblx0Z2V0Q29udGFjdFNvY2lhbFR5cGUsXG5cdGdldEN1c3RvbURhdGVUeXBlLFxuXHRnZXRSZWxhdGlvbnNoaXBUeXBlLFxufSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHR5cGUge1xuXHRDb250YWN0LFxuXHRDb250YWN0QWRkcmVzcyxcblx0Q29udGFjdE1lc3NlbmdlckhhbmRsZSxcblx0Q29udGFjdFBob25lTnVtYmVyLFxuXHRDb250YWN0U29jaWFsSWQsXG5cdENvbnRhY3RXZWJzaXRlLFxufSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCBkb3duY2FzdCwgbWVtb2l6ZWQsIE5CU1AsIG5vT3AgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7XG5cdGdldENvbnRhY3RBZGRyZXNzVHlwZUxhYmVsLFxuXHRnZXRDb250YWN0Q3VzdG9tRGF0ZVR5cGVUb0xhYmVsLFxuXHRnZXRDb250YWN0Q3VzdG9tV2Vic2l0ZVR5cGVUb0xhYmVsLFxuXHRnZXRDb250YWN0TWVzc2VuZ2VySGFuZGxlVHlwZVRvTGFiZWwsXG5cdGdldENvbnRhY3RQaG9uZU51bWJlclR5cGVMYWJlbCxcblx0Z2V0Q29udGFjdFJlbGF0aW9uc2hpcFR5cGVUb0xhYmVsLFxuXHRnZXRDb250YWN0U29jaWFsVHlwZUxhYmVsLFxufSBmcm9tIFwiLi9Db250YWN0R3VpVXRpbHNcIlxuaW1wb3J0IHsgZm9ybWF0Q29udGFjdERhdGUsIGdldE1lc3NlbmdlckhhbmRsZVVybCwgZ2V0U29jaWFsVXJsLCBnZXRXZWJzaXRlVXJsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jb250YWN0c0Z1bmN0aW9uYWxpdHkvQ29udGFjdFV0aWxzLmpzXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IEljb25CdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgQnV0dG9uU2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQnV0dG9uU2l6ZS5qc1wiXG5pbXBvcnQgeyBQYXJ0aWFsUmVjaXBpZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3JlY2lwaWVudHMvUmVjaXBpZW50LmpzXCJcbmltcG9ydCB7IGF0dGFjaERyb3Bkb3duIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgdHlwZSB7IEFsbEljb25zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uLmpzXCJcblxuaW1wb3J0IHsgZ2V0Q29udGFjdFRpdGxlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9HdWlVdGlscy5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbnRhY3RWaWV3ZXJBdHRycyB7XG5cdGNvbnRhY3Q6IENvbnRhY3Rcblx0b25Xcml0ZU1haWw6ICh0bzogUGFydGlhbFJlY2lwaWVudCkgPT4gdW5rbm93blxuXHRlZGl0QWN0aW9uPzogKGNvbnRhY3Q6IENvbnRhY3QpID0+IHVua25vd25cblx0ZGVsZXRlQWN0aW9uPzogKGNvbnRhY3RzOiBDb250YWN0W10pID0+IHVua25vd25cblx0ZXh0ZW5kZWRBY3Rpb25zPzogYm9vbGVhblxufVxuXG4vKipcbiAqICBEaXNwbGF5cyBpbmZvcm1hdGlvbiBhYm91dCBhIHNpbmdsZSBjb250YWN0XG4gKi9cbmV4cG9ydCBjbGFzcyBDb250YWN0Vmlld2VyIGltcGxlbWVudHMgQ2xhc3NDb21wb25lbnQ8Q29udGFjdFZpZXdlckF0dHJzPiB7XG5cdHByaXZhdGUgcmVhZG9ubHkgY29udGFjdEFwcGVsbGF0aW9uID0gbWVtb2l6ZWQoZ2V0Q29udGFjdFRpdGxlKVxuXG5cdHByaXZhdGUgcmVhZG9ubHkgY29udGFjdFBob25ldGljTmFtZSA9IG1lbW9pemVkKChjb250YWN0OiBDb250YWN0KTogc3RyaW5nIHwgbnVsbCA9PiB7XG5cdFx0Y29uc3QgZmlyc3ROYW1lID0gY29udGFjdC5waG9uZXRpY0ZpcnN0ID8/IFwiXCJcblx0XHRjb25zdCBtaWRkbGVOYW1lID0gY29udGFjdC5waG9uZXRpY01pZGRsZSA/IGAgJHtjb250YWN0LnBob25ldGljTWlkZGxlfWAgOiBcIlwiXG5cdFx0Y29uc3QgbGFzdE5hbWUgPSBjb250YWN0LnBob25ldGljTGFzdCA/IGAgJHtjb250YWN0LnBob25ldGljTGFzdH1gIDogXCJcIlxuXG5cdFx0Y29uc3QgcGhvbmV0aWNOYW1lID0gKGZpcnN0TmFtZSArIG1pZGRsZU5hbWUgKyBsYXN0TmFtZSkudHJpbSgpXG5cblx0XHRyZXR1cm4gcGhvbmV0aWNOYW1lLmxlbmd0aCA+IDAgPyBwaG9uZXRpY05hbWUgOiBudWxsXG5cdH0pXG5cblx0cHJpdmF0ZSByZWFkb25seSBmb3JtYXR0ZWRCaXJ0aGRheSA9IG1lbW9pemVkKChjb250YWN0OiBDb250YWN0KSA9PiB7XG5cdFx0cmV0dXJuIHRoaXMuaGFzQmlydGhkYXkoY29udGFjdCkgPyBmb3JtYXRDb250YWN0RGF0ZShjb250YWN0LmJpcnRoZGF5SXNvKSA6IG51bGxcblx0fSlcblxuXHRwcml2YXRlIGhhc0JpcnRoZGF5KGNvbnRhY3Q6IENvbnRhY3QpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gY29udGFjdC5iaXJ0aGRheUlzbyAhPSBudWxsXG5cdH1cblxuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8Q29udGFjdFZpZXdlckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IGNvbnRhY3QsIG9uV3JpdGVNYWlsIH0gPSBhdHRyc1xuXG5cdFx0Y29uc3QgcGhvbmV0aWNOYW1lID0gdGhpcy5jb250YWN0UGhvbmV0aWNOYW1lKGF0dHJzLmNvbnRhY3QpXG5cblx0XHRyZXR1cm4gbShcIi5wbHItbC5wYi1mbG9hdGluZy5tbHItc2FmZS1pbnNldFwiLCBbXG5cdFx0XHRtKFwiXCIsIFtcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIi5mbGV4LXNwYWNlLWJldHdlZW4uZmxleC13cmFwLm10LW1cIixcblx0XHRcdFx0XHRtKFwiLmxlZnQuZmxleC1ncm93LXNocmluay0xNTBcIiwgW1xuXHRcdFx0XHRcdFx0bShcIi5oMi5zZWxlY3RhYmxlLnRleHQtYnJlYWtcIiwgW1xuXHRcdFx0XHRcdFx0XHR0aGlzLmNvbnRhY3RBcHBlbGxhdGlvbihjb250YWN0KSxcblx0XHRcdFx0XHRcdFx0TkJTUCwgLy8gYWxpZ25tZW50IGluIGNhc2Ugbm90aGluZyBpcyBwcmVzZW50IGhlcmVcblx0XHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRcdFx0cGhvbmV0aWNOYW1lID8gbShcIlwiLCBwaG9uZXRpY05hbWUpIDogbnVsbCxcblx0XHRcdFx0XHRcdGNvbnRhY3QucHJvbm91bnMubGVuZ3RoID4gMCA/IHRoaXMucmVuZGVyUHJvbm91bnNJbmZvKGNvbnRhY3QpIDogbnVsbCxcblx0XHRcdFx0XHRcdGNvbnRhY3Qubmlja25hbWUgPyBtKFwiXCIsIGBcIiR7Y29udGFjdC5uaWNrbmFtZX1cImApIDogbnVsbCxcblx0XHRcdFx0XHRcdG0oXCJcIiwgdGhpcy5yZW5kZXJKb2JJbmZvcm1hdGlvbihjb250YWN0KSksXG5cdFx0XHRcdFx0XHR0aGlzLmhhc0JpcnRoZGF5KGNvbnRhY3QpID8gbShcIlwiLCB0aGlzLmZvcm1hdHRlZEJpcnRoZGF5KGNvbnRhY3QpKSA6IG51bGwsXG5cdFx0XHRcdFx0XSksXG5cdFx0XHRcdFx0dGhpcy5yZW5kZXJBY3Rpb25zKGNvbnRhY3QsIGF0dHJzKSxcblx0XHRcdFx0KSxcblx0XHRcdFx0bShcImhyLmhyLm10Lm1iXCIpLFxuXHRcdFx0XSksXG5cdFx0XHR0aGlzLnJlbmRlckN1c3RvbURhdGVzQW5kUmVsYXRpb25zaGlwcyhjb250YWN0KSxcblx0XHRcdHRoaXMucmVuZGVyTWFpbEFkZHJlc3Nlc0FuZFBob25lcyhjb250YWN0LCBvbldyaXRlTWFpbCksXG5cdFx0XHR0aGlzLnJlbmRlckFkZHJlc3Nlc0FuZFNvY2lhbElkcyhjb250YWN0KSxcblx0XHRcdHRoaXMucmVuZGVyV2Vic2l0ZXNBbmRJbnN0YW50TWVzc2VuZ2Vycyhjb250YWN0KSxcblx0XHRcdHRoaXMucmVuZGVyQ29tbWVudChjb250YWN0KSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJFeHRlbmRlZEFjdGlvbnMoY29udGFjdDogQ29udGFjdCwgYXR0cnM6IENvbnRhY3RWaWV3ZXJBdHRycykge1xuXHRcdHJldHVybiBtLmZyYWdtZW50KHt9LCBbdGhpcy5yZW5kZXJFZGl0QnV0dG9uKGNvbnRhY3QsIGF0dHJzKSwgdGhpcy5yZW5kZXJEZWxldGVCdXR0b24oY29udGFjdCwgYXR0cnMpXSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRWRpdEJ1dHRvbihjb250YWN0OiBDb250YWN0LCBhdHRyczogQ29udGFjdFZpZXdlckF0dHJzKSB7XG5cdFx0aWYgKCFhdHRycy5lZGl0QWN0aW9uKSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblxuXHRcdHJldHVybiBtKEljb25CdXR0b24sIHtcblx0XHRcdHRpdGxlOiBcImVkaXRfYWN0aW9uXCIsXG5cdFx0XHRpY29uOiBJY29ucy5FZGl0LFxuXHRcdFx0Y2xpY2s6ICgpID0+IGFzc2VydE5vdE51bGwoYXR0cnMuZWRpdEFjdGlvbiwgXCJJbnZhbGlkIEVkaXQgYWN0aW9uIGluIENvbnRhY3QgVmlld2VyXCIpKGNvbnRhY3QpLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckRlbGV0ZUJ1dHRvbihjb250YWN0OiBDb250YWN0LCBhdHRyczogQ29udGFjdFZpZXdlckF0dHJzKSB7XG5cdFx0aWYgKCFhdHRycy5kZWxldGVBY3Rpb24pIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwiZGVsZXRlX2FjdGlvblwiLFxuXHRcdFx0aWNvbjogSWNvbnMuVHJhc2gsXG5cdFx0XHRjbGljazogKCkgPT4gYXNzZXJ0Tm90TnVsbChhdHRycy5kZWxldGVBY3Rpb24sIFwiSW52YWxpZCBEZWxldGUgYWN0aW9uIGluIENvbnRhY3QgVmlld2VyXCIpKFtjb250YWN0XSksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQWN0aW9uc0Ryb3Bkb3duKGNvbnRhY3Q6IENvbnRhY3QsIGF0dHJzOiBDb250YWN0Vmlld2VyQXR0cnMpIHtcblx0XHRjb25zdCBhY3Rpb25zOiB7IGxhYmVsOiBUcmFuc2xhdGlvbktleTsgaWNvbjogQWxsSWNvbnM7IGNsaWNrOiAoKSA9PiB2b2lkIH1bXSA9IFtdXG5cblx0XHRpZiAoYXR0cnMuZWRpdEFjdGlvbikge1xuXHRcdFx0YWN0aW9ucy5wdXNoKHtcblx0XHRcdFx0bGFiZWw6IFwiZWRpdF9hY3Rpb25cIixcblx0XHRcdFx0aWNvbjogSWNvbnMuRWRpdCxcblx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRhc3NlcnROb3ROdWxsKGF0dHJzLmVkaXRBY3Rpb24sIFwiRWRpdCBhY3Rpb24gaW4gQ29udGFjdCBWaWV3ZXIgaGFzIGRpc2FwcGVhcmVkXCIpKGNvbnRhY3QpXG5cdFx0XHRcdH0sXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdGlmIChhdHRycy5kZWxldGVBY3Rpb24pIHtcblx0XHRcdGFjdGlvbnMucHVzaCh7XG5cdFx0XHRcdGxhYmVsOiBcImRlbGV0ZV9hY3Rpb25cIixcblx0XHRcdFx0aWNvbjogSWNvbnMuVHJhc2gsXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0YXNzZXJ0Tm90TnVsbChhdHRycy5kZWxldGVBY3Rpb24sIFwiRGVsZXRlIGFjdGlvbiBpbiBDb250YWN0IFZpZXdlciBoYXMgZGlzYXBwZWFyZWRcIikoW2NvbnRhY3RdKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRpZiAoYWN0aW9ucy5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5mbGV4LWVuZFwiLFxuXHRcdFx0bShcblx0XHRcdFx0SWNvbkJ1dHRvbixcblx0XHRcdFx0YXR0YWNoRHJvcGRvd24oe1xuXHRcdFx0XHRcdG1haW5CdXR0b25BdHRyczoge1xuXHRcdFx0XHRcdFx0dGl0bGU6IFwibW9yZV9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuTW9yZSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGNoaWxkQXR0cnM6ICgpID0+IGFjdGlvbnMsXG5cdFx0XHRcdH0pLFxuXHRcdFx0KSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckFjdGlvbnMoY29udGFjdDogQ29udGFjdCwgYXR0cnM6IENvbnRhY3RWaWV3ZXJBdHRycykge1xuXHRcdGlmICghY29udGFjdCB8fCAhKGF0dHJzLmVkaXRBY3Rpb24gfHwgYXR0cnMuZGVsZXRlQWN0aW9uKSkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cblx0XHRpZiAoYXR0cnMuZXh0ZW5kZWRBY3Rpb25zKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJFeHRlbmRlZEFjdGlvbnMoY29udGFjdCwgYXR0cnMpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMucmVuZGVyQWN0aW9uc0Ryb3Bkb3duKGNvbnRhY3QsIGF0dHJzKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJKb2JJbmZvcm1hdGlvbihjb250YWN0OiBDb250YWN0KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHNwYWNlckZ1bmN0aW9uID0gKCkgPT5cblx0XHRcdG0oXG5cdFx0XHRcdFwic3Bhbi5wbHItc1wiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdGZvbnRXZWlnaHQ6IFwiOTAwXCIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0XCIgwrcgXCIsXG5cdFx0XHQpXG5cblx0XHRyZXR1cm4gaW5zZXJ0QmV0d2Vlbihcblx0XHRcdFtcblx0XHRcdFx0Y29udGFjdC5yb2xlID8gbShcInNwYW5cIiwgY29udGFjdC5yb2xlKSA6IG51bGwsXG5cdFx0XHRcdGNvbnRhY3QuZGVwYXJ0bWVudCA/IG0oXCJzcGFuXCIsIGNvbnRhY3QuZGVwYXJ0bWVudCkgOiBudWxsLFxuXHRcdFx0XHRjb250YWN0LmNvbXBhbnkgPyBtKFwic3BhblwiLCBjb250YWN0LmNvbXBhbnkpIDogbnVsbCxcblx0XHRcdF0sXG5cdFx0XHRzcGFjZXJGdW5jdGlvbixcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclByb25vdW5zSW5mbyhjb250YWN0OiBDb250YWN0KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHNwYWNlckZ1bmN0aW9uID0gKCkgPT5cblx0XHRcdG0oXG5cdFx0XHRcdFwic3Bhbi5wbHItc1wiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdGZvbnRXZWlnaHQ6IFwiOTAwXCIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0XCIgwrcgXCIsXG5cdFx0XHQpXG5cblx0XHRyZXR1cm4gaW5zZXJ0QmV0d2Vlbihcblx0XHRcdGNvbnRhY3QucHJvbm91bnMubWFwKChwcm9ub3VucykgPT4ge1xuXHRcdFx0XHRsZXQgbGFuZ3VhZ2UgPSBcIlwiXG5cdFx0XHRcdGlmIChwcm9ub3Vucy5sYW5ndWFnZSAhPSBcIlwiKSB7XG5cdFx0XHRcdFx0bGFuZ3VhZ2UgPSBgJHtwcm9ub3Vucy5sYW5ndWFnZX06IGBcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBtKFwic3BhblwiLCBgJHtsYW5ndWFnZX0ke3Byb25vdW5zLnByb25vdW5zfWApXG5cdFx0XHR9KSxcblx0XHRcdHNwYWNlckZ1bmN0aW9uLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQWRkcmVzc2VzQW5kU29jaWFsSWRzKGNvbnRhY3Q6IENvbnRhY3QpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgYWRkcmVzc2VzID0gY29udGFjdC5hZGRyZXNzZXMubWFwKChlbGVtZW50KSA9PiB0aGlzLnJlbmRlckFkZHJlc3MoZWxlbWVudCkpXG5cdFx0Y29uc3Qgc29jaWFscyA9IGNvbnRhY3Quc29jaWFsSWRzLm1hcCgoZWxlbWVudCkgPT4gdGhpcy5yZW5kZXJTb2NpYWxJZChlbGVtZW50KSlcblx0XHRyZXR1cm4gYWRkcmVzc2VzLmxlbmd0aCA+IDAgfHwgc29jaWFscy5sZW5ndGggPiAwXG5cdFx0XHQ/IG0oXCIud3JhcHBpbmctcm93XCIsIFtcblx0XHRcdFx0XHRtKFwiLmFkZHJlc3MubXQtbFwiLCBhZGRyZXNzZXMubGVuZ3RoID4gMCA/IFttKFwiLmg0XCIsIGxhbmcuZ2V0KFwiYWRkcmVzc19sYWJlbFwiKSksIG0oXCIuYWdncmVnYXRlRWRpdG9yc1wiLCBhZGRyZXNzZXMpXSA6IG51bGwpLFxuXHRcdFx0XHRcdG0oXCIuc29jaWFsLm10LWxcIiwgc29jaWFscy5sZW5ndGggPiAwID8gW20oXCIuaDRcIiwgbGFuZy5nZXQoXCJzb2NpYWxfbGFiZWxcIikpLCBtKFwiLmFnZ3JlZ2F0ZUVkaXRvcnNcIiwgc29jaWFscyldIDogbnVsbCksXG5cdFx0XHQgIF0pXG5cdFx0XHQ6IG51bGxcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyV2Vic2l0ZXNBbmRJbnN0YW50TWVzc2VuZ2Vycyhjb250YWN0OiBDb250YWN0KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHdlYnNpdGVzID0gY29udGFjdC53ZWJzaXRlcy5tYXAoKGVsZW1lbnQpID0+IHRoaXMucmVuZGVyV2Vic2l0ZShlbGVtZW50KSlcblx0XHRjb25zdCBpbnN0YW50TWVzc2VuZ2VycyA9IGNvbnRhY3QubWVzc2VuZ2VySGFuZGxlcy5tYXAoKGVsZW1lbnQpID0+IHRoaXMucmVuZGVyTWVzc2VuZ2VySGFuZGxlKGVsZW1lbnQpKVxuXHRcdHJldHVybiB3ZWJzaXRlcy5sZW5ndGggPiAwIHx8IGluc3RhbnRNZXNzZW5nZXJzLmxlbmd0aCA+IDBcblx0XHRcdD8gbShcIi53cmFwcGluZy1yb3dcIiwgW1xuXHRcdFx0XHRcdG0oXCIud2Vic2l0ZS5tdC1sXCIsIHdlYnNpdGVzLmxlbmd0aCA+IDAgPyBbbShcIi5oNFwiLCBsYW5nLmdldChcIndlYnNpdGVzX2xhYmVsXCIpKSwgbShcIi5hZ2dyZWdhdGVFZGl0b3JzXCIsIHdlYnNpdGVzKV0gOiBudWxsKSxcblx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XCIubWVzc2VuZ2VyLWhhbmRsZXMubXQtbFwiLFxuXHRcdFx0XHRcdFx0aW5zdGFudE1lc3NlbmdlcnMubGVuZ3RoID4gMCA/IFttKFwiLmg0XCIsIGxhbmcuZ2V0KFwibWVzc2VuZ2VyX2hhbmRsZXNfbGFiZWxcIikpLCBtKFwiLmFnZ3JlZ2F0ZUVkaXRvcnNcIiwgaW5zdGFudE1lc3NlbmdlcnMpXSA6IG51bGwsXG5cdFx0XHRcdFx0KSxcblx0XHRcdCAgXSlcblx0XHRcdDogbnVsbFxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJDdXN0b21EYXRlc0FuZFJlbGF0aW9uc2hpcHMoY29udGFjdDogQ29udGFjdCk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBkYXRlcyA9IGNvbnRhY3QuY3VzdG9tRGF0ZS5tYXAoKGVsZW1lbnQpID0+XG5cdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRsYWJlbDogZ2V0Q29udGFjdEN1c3RvbURhdGVUeXBlVG9MYWJlbChnZXRDdXN0b21EYXRlVHlwZShlbGVtZW50KSwgZWxlbWVudC5jdXN0b21UeXBlTmFtZSksXG5cdFx0XHRcdHZhbHVlOiBmb3JtYXRDb250YWN0RGF0ZShlbGVtZW50LmRhdGVJc28pLFxuXHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0fSksXG5cdFx0KVxuXHRcdGNvbnN0IHJlbGF0aW9uc2hpcHMgPSBjb250YWN0LnJlbGF0aW9uc2hpcHMubWFwKChlbGVtZW50KSA9PlxuXHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0bGFiZWw6IGdldENvbnRhY3RSZWxhdGlvbnNoaXBUeXBlVG9MYWJlbChnZXRSZWxhdGlvbnNoaXBUeXBlKGVsZW1lbnQpLCBlbGVtZW50LmN1c3RvbVR5cGVOYW1lKSxcblx0XHRcdFx0dmFsdWU6IGVsZW1lbnQucGVyc29uLFxuXHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0fSksXG5cdFx0KVxuXG5cdFx0cmV0dXJuIGRhdGVzLmxlbmd0aCA+IDAgfHwgcmVsYXRpb25zaGlwcy5sZW5ndGggPiAwXG5cdFx0XHQ/IG0oXCIud3JhcHBpbmctcm93XCIsIFtcblx0XHRcdFx0XHRtKFwiLmRhdGVzLm10LWxcIiwgZGF0ZXMubGVuZ3RoID4gMCA/IFttKFwiLmg0XCIsIGxhbmcuZ2V0KFwiZGF0ZXNfbGFiZWxcIikpLCBtKFwiLmFnZ3JlZ2F0ZUVkaXRvcnNcIiwgZGF0ZXMpXSA6IG51bGwpLFxuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcIi5yZWxhdGlvbnNoaXBzLm10LWxcIixcblx0XHRcdFx0XHRcdHJlbGF0aW9uc2hpcHMubGVuZ3RoID4gMCA/IFttKFwiLmg0XCIsIGxhbmcuZ2V0KFwicmVsYXRpb25zaGlwc19sYWJlbFwiKSksIG0oXCIuYWdncmVnYXRlRWRpdG9yc1wiLCByZWxhdGlvbnNoaXBzKV0gOiBudWxsLFxuXHRcdFx0XHRcdCksXG5cdFx0XHQgIF0pXG5cdFx0XHQ6IG51bGxcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTWFpbEFkZHJlc3Nlc0FuZFBob25lcyhjb250YWN0OiBDb250YWN0LCBvbldyaXRlTWFpbDogQ29udGFjdFZpZXdlckF0dHJzW1wib25Xcml0ZU1haWxcIl0pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgbWFpbEFkZHJlc3NlcyA9IGNvbnRhY3QubWFpbEFkZHJlc3Nlcy5tYXAoKGVsZW1lbnQpID0+IHRoaXMucmVuZGVyTWFpbEFkZHJlc3MoY29udGFjdCwgZWxlbWVudCwgb25Xcml0ZU1haWwpKVxuXHRcdGNvbnN0IHBob25lcyA9IGNvbnRhY3QucGhvbmVOdW1iZXJzLm1hcCgoZWxlbWVudCkgPT4gdGhpcy5yZW5kZXJQaG9uZU51bWJlcihlbGVtZW50KSlcblx0XHRyZXR1cm4gbWFpbEFkZHJlc3Nlcy5sZW5ndGggPiAwIHx8IHBob25lcy5sZW5ndGggPiAwXG5cdFx0XHQ/IG0oXCIud3JhcHBpbmctcm93XCIsIFtcblx0XHRcdFx0XHRtKFwiLm1haWwubXQtbFwiLCBtYWlsQWRkcmVzc2VzLmxlbmd0aCA+IDAgPyBbbShcIi5oNFwiLCBsYW5nLmdldChcImVtYWlsX2xhYmVsXCIpKSwgbShcIi5hZ2dyZWdhdGVFZGl0b3JzXCIsIFttYWlsQWRkcmVzc2VzXSldIDogbnVsbCksXG5cdFx0XHRcdFx0bShcIi5waG9uZS5tdC1sXCIsIHBob25lcy5sZW5ndGggPiAwID8gW20oXCIuaDRcIiwgbGFuZy5nZXQoXCJwaG9uZV9sYWJlbFwiKSksIG0oXCIuYWdncmVnYXRlRWRpdG9yc1wiLCBbcGhvbmVzXSldIDogbnVsbCksXG5cdFx0XHQgIF0pXG5cdFx0XHQ6IG51bGxcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQ29tbWVudChjb250YWN0OiBDb250YWN0KTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBjb250YWN0LmNvbW1lbnQgJiYgY29udGFjdC5jb21tZW50LnRyaW0oKS5sZW5ndGggPiAwXG5cdFx0XHQ/IFttKFwiLmg0Lm10LWxcIiwgbGFuZy5nZXQoXCJjb21tZW50X2xhYmVsXCIpKSwgbShcInAubXQtbC50ZXh0LXByZXdyYXAudGV4dC1icmVhay5zZWxlY3RhYmxlXCIsIGNvbnRhY3QuY29tbWVudCldXG5cdFx0XHQ6IG51bGxcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyU29jaWFsSWQoY29udGFjdFNvY2lhbElkOiBDb250YWN0U29jaWFsSWQpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3Qgc2hvd0J1dHRvbiA9IG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwic2hvd1VSTF9hbHRcIixcblx0XHRcdGNsaWNrOiBub09wLFxuXHRcdFx0aWNvbjogSWNvbnMuQXJyb3dGb3J3YXJkLFxuXHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdH0pXG5cdFx0cmV0dXJuIG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRsYWJlbDogZ2V0Q29udGFjdFNvY2lhbFR5cGVMYWJlbChnZXRDb250YWN0U29jaWFsVHlwZShjb250YWN0U29jaWFsSWQpLCBjb250YWN0U29jaWFsSWQuY3VzdG9tVHlwZU5hbWUpLFxuXHRcdFx0dmFsdWU6IGNvbnRhY3RTb2NpYWxJZC5zb2NpYWxJZCxcblx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHRpbmplY3Rpb25zUmlnaHQ6ICgpID0+IG0oYGFbaHJlZj0ke2dldFNvY2lhbFVybChjb250YWN0U29jaWFsSWQpfV1bdGFyZ2V0PV9ibGFua11gLCBzaG93QnV0dG9uKSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJXZWJzaXRlKHdlYnNpdGU6IENvbnRhY3RXZWJzaXRlKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHNob3dCdXR0b24gPSBtKEljb25CdXR0b24sIHtcblx0XHRcdHRpdGxlOiBcInNob3dVUkxfYWx0XCIsXG5cdFx0XHRjbGljazogbm9PcCxcblx0XHRcdGljb246IEljb25zLkFycm93Rm9yd2FyZCxcblx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHR9KVxuXHRcdHJldHVybiBtKFRleHRGaWVsZCwge1xuXHRcdFx0bGFiZWw6IGdldENvbnRhY3RDdXN0b21XZWJzaXRlVHlwZVRvTGFiZWwoZG93bmNhc3Qod2Vic2l0ZS50eXBlKSwgd2Vic2l0ZS5jdXN0b21UeXBlTmFtZSksXG5cdFx0XHR2YWx1ZTogd2Vic2l0ZS51cmwsXG5cdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0aW5qZWN0aW9uc1JpZ2h0OiAoKSA9PiBtKGBhW2hyZWY9JHtnZXRXZWJzaXRlVXJsKHdlYnNpdGUudXJsKX1dW3RhcmdldD1fYmxhbmtdYCwgc2hvd0J1dHRvbiksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTWVzc2VuZ2VySGFuZGxlKG1lc3NlbmdlckhhbmRsZTogQ29udGFjdE1lc3NlbmdlckhhbmRsZSk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBzaG93QnV0dG9uID0gbShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJzaG93VVJMX2FsdFwiLFxuXHRcdFx0Y2xpY2s6IG5vT3AsXG5cdFx0XHRpY29uOiBJY29ucy5BcnJvd0ZvcndhcmQsXG5cdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0fSlcblx0XHRyZXR1cm4gbShUZXh0RmllbGQsIHtcblx0XHRcdGxhYmVsOiBnZXRDb250YWN0TWVzc2VuZ2VySGFuZGxlVHlwZVRvTGFiZWwoZG93bmNhc3QobWVzc2VuZ2VySGFuZGxlLnR5cGUpLCBtZXNzZW5nZXJIYW5kbGUuY3VzdG9tVHlwZU5hbWUpLFxuXHRcdFx0dmFsdWU6IG1lc3NlbmdlckhhbmRsZS5oYW5kbGUsXG5cdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0aW5qZWN0aW9uc1JpZ2h0OiAoKSA9PiBtKGBhW2hyZWY9JHtnZXRNZXNzZW5nZXJIYW5kbGVVcmwobWVzc2VuZ2VySGFuZGxlKX1dW3RhcmdldD1fYmxhbmtdYCwgc2hvd0J1dHRvbiksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTWFpbEFkZHJlc3MoY29udGFjdDogQ29udGFjdCwgYWRkcmVzczogQ29udGFjdEFkZHJlc3MsIG9uV3JpdGVNYWlsOiBDb250YWN0Vmlld2VyQXR0cnNbXCJvbldyaXRlTWFpbFwiXSk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBuZXdNYWlsQnV0dG9uID0gbShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJzZW5kTWFpbF9hbHRcIixcblx0XHRcdGNsaWNrOiAoKSA9PiBvbldyaXRlTWFpbCh7IG5hbWU6IGAke2NvbnRhY3QuZmlyc3ROYW1lfSAke2NvbnRhY3QubGFzdE5hbWV9YC50cmltKCksIGFkZHJlc3M6IGFkZHJlc3MuYWRkcmVzcywgY29udGFjdDogY29udGFjdCB9KSxcblx0XHRcdGljb246IEljb25zLlBlbmNpbFNxdWFyZSxcblx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHR9KVxuXHRcdHJldHVybiBtKFRleHRGaWVsZCwge1xuXHRcdFx0bGFiZWw6IGdldENvbnRhY3RBZGRyZXNzVHlwZUxhYmVsKGFkZHJlc3MudHlwZSBhcyBhbnksIGFkZHJlc3MuY3VzdG9tVHlwZU5hbWUpLFxuXHRcdFx0dmFsdWU6IGFkZHJlc3MuYWRkcmVzcyxcblx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHRpbmplY3Rpb25zUmlnaHQ6ICgpID0+IFtuZXdNYWlsQnV0dG9uXSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJQaG9uZU51bWJlcihwaG9uZTogQ29udGFjdFBob25lTnVtYmVyKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGNhbGxCdXR0b24gPSBtKEljb25CdXR0b24sIHtcblx0XHRcdHRpdGxlOiBcImNhbGxOdW1iZXJfYWx0XCIsXG5cdFx0XHRjbGljazogKCkgPT4gbnVsbCxcblx0XHRcdGljb246IEljb25zLkNhbGwsXG5cdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0fSlcblx0XHRyZXR1cm4gbShUZXh0RmllbGQsIHtcblx0XHRcdGxhYmVsOiBnZXRDb250YWN0UGhvbmVOdW1iZXJUeXBlTGFiZWwocGhvbmUudHlwZSBhcyBDb250YWN0UGhvbmVOdW1iZXJUeXBlLCBwaG9uZS5jdXN0b21UeXBlTmFtZSksXG5cdFx0XHR2YWx1ZTogcGhvbmUubnVtYmVyLFxuXHRcdFx0aXNSZWFkT25seTogdHJ1ZSxcblx0XHRcdGluamVjdGlvbnNSaWdodDogKCkgPT4gbShgYVtocmVmPVwidGVsOiR7cGhvbmUubnVtYmVyfVwiXVt0YXJnZXQ9X2JsYW5rXWAsIGNhbGxCdXR0b24pLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckFkZHJlc3MoYWRkcmVzczogQ29udGFjdEFkZHJlc3MpOiBDaGlsZHJlbiB7XG5cdFx0bGV0IHByZXBBZGRyZXNzOiBzdHJpbmdcblxuXHRcdGlmIChhZGRyZXNzLmFkZHJlc3MuaW5kZXhPZihcIlxcblwiKSAhPT0gLTEpIHtcblx0XHRcdHByZXBBZGRyZXNzID0gZW5jb2RlVVJJQ29tcG9uZW50KGFkZHJlc3MuYWRkcmVzcy5zcGxpdChcIlxcblwiKS5qb2luKFwiIFwiKSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cHJlcEFkZHJlc3MgPSBlbmNvZGVVUklDb21wb25lbnQoYWRkcmVzcy5hZGRyZXNzKVxuXHRcdH1cblxuXHRcdGNvbnN0IHNob3dCdXR0b24gPSBtKEljb25CdXR0b24sIHtcblx0XHRcdHRpdGxlOiBcInNob3dBZGRyZXNzX2FsdFwiLFxuXHRcdFx0Y2xpY2s6ICgpID0+IG51bGwsXG5cdFx0XHRpY29uOiBJY29ucy5QaW4sXG5cdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0fSlcblx0XHRyZXR1cm4gbShUZXh0RmllbGQsIHtcblx0XHRcdGxhYmVsOiBnZXRDb250YWN0QWRkcmVzc1R5cGVMYWJlbChkb3duY2FzdDxDb250YWN0QWRkcmVzc1R5cGU+KGFkZHJlc3MudHlwZSksIGFkZHJlc3MuY3VzdG9tVHlwZU5hbWUpLFxuXHRcdFx0dmFsdWU6IGFkZHJlc3MuYWRkcmVzcyxcblx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHR0eXBlOiBUZXh0RmllbGRUeXBlLkFyZWEsXG5cdFx0XHRpbmplY3Rpb25zUmlnaHQ6ICgpID0+IG0oYGFbaHJlZj1cImh0dHBzOi8vd3d3Lm9wZW5zdHJlZXRtYXAub3JnL3NlYXJjaD9xdWVyeT0ke3ByZXBBZGRyZXNzfVwiXVt0YXJnZXQ9X2JsYW5rXWAsIHNob3dCdXR0b24pLFxuXHRcdH0pXG5cdH1cbn1cblxuZnVuY3Rpb24gaW5zZXJ0QmV0d2VlbihhcnJheTogQ2hpbGRyZW5bXSwgc3BhY2VyOiAoKSA9PiBDaGlsZHJlbikge1xuXHRsZXQgcmV0OiBDaGlsZHJlbiA9IFtdXG5cblx0Zm9yIChsZXQgZSBvZiBhcnJheSkge1xuXHRcdGlmIChlICE9IG51bGwpIHtcblx0XHRcdGlmIChyZXQubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRyZXQucHVzaChzcGFjZXIoKSlcblx0XHRcdH1cblxuXHRcdFx0cmV0LnB1c2goZSlcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gcmV0XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgQ29udGFjdCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IENvbnRhY3RWaWV3ZXIgfSBmcm9tIFwiLi9Db250YWN0Vmlld2VyLmpzXCJcbmltcG9ydCB7IFBhcnRpYWxSZWNpcGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vcmVjaXBpZW50cy9SZWNpcGllbnQuanNcIlxuaW1wb3J0IHsgcmVzcG9uc2l2ZUNhcmRITWFyZ2luIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvY2FyZHMuanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIENvbnRhY3RDYXJkQXR0cnMge1xuXHRjb250YWN0OiBDb250YWN0XG5cdG9uV3JpdGVNYWlsOiAodG86IFBhcnRpYWxSZWNpcGllbnQpID0+IHVua25vd25cblx0ZWRpdEFjdGlvbj86IChjb250YWN0OiBDb250YWN0KSA9PiB1bmtub3duXG5cdGRlbGV0ZUFjdGlvbj86IChjb250YWN0czogQ29udGFjdFtdKSA9PiB1bmtub3duXG5cdGV4dGVuZGVkQWN0aW9ucz86IGJvb2xlYW5cblx0c3R5bGU/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG59XG5cbi8qKiBXcmFwcyBjb250YWN0IHZpZXdlciBpbiBhIG5pY2UgY2FyZC4gKi9cbmV4cG9ydCBjbGFzcyBDb250YWN0Q2FyZFZpZXdlciBpbXBsZW1lbnRzIENvbXBvbmVudDxDb250YWN0Q2FyZEF0dHJzPiB7XG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxDb250YWN0Q2FyZEF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IGNvbnRhY3QsIG9uV3JpdGVNYWlsLCBlZGl0QWN0aW9uLCBkZWxldGVBY3Rpb24sIGV4dGVuZGVkQWN0aW9ucyB9ID0gYXR0cnNcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcblx0XHRcdFx0XCIuYm9yZGVyLXJhZGl1cy1iaWcucmVsXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjbGFzczogcmVzcG9uc2l2ZUNhcmRITWFyZ2luKCksXG5cdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdGJhY2tncm91bmRDb2xvcjogdGhlbWUuY29udGVudF9iZyxcblx0XHRcdFx0XHRcdC4uLmF0dHJzLnN0eWxlLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG0oQ29udGFjdFZpZXdlciwge1xuXHRcdFx0XHRcdGNvbnRhY3QsXG5cdFx0XHRcdFx0b25Xcml0ZU1haWwsXG5cdFx0XHRcdFx0ZWRpdEFjdGlvbixcblx0XHRcdFx0XHRkZWxldGVBY3Rpb24sXG5cdFx0XHRcdFx0ZXh0ZW5kZWRBY3Rpb25zLFxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0XHRtKFwiLm10LWxcIiksXG5cdFx0XVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IENvbHVtbkVtcHR5TWVzc2FnZUJveCBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0NvbHVtbkVtcHR5TWVzc2FnZUJveFwiXG5pbXBvcnQgeyBsYW5nLCBUcmFuc2xhdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBCb290SWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0Jvb3RJY29uc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IENvbnRhY3QgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBCdXR0b24sIEJ1dHRvblR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG5leHBvcnQgaW50ZXJmYWNlIE11bHRpQ29udGFjdFZpZXdlckF0dHJzIHtcblx0c2VsZWN0ZWRFbnRpdGllczogQ29udGFjdFtdXG5cdHNlbGVjdE5vbmU6ICgpID0+IHVua25vd25cbn1cblxuLyoqXG4gKiBUaGUgQ29udGFjdFZpZXdlciBkaXNwbGF5cyB0aGUgYWN0aW9uIGJ1dHRvbnMgZm9yIG11bHRpcGxlIHNlbGVjdGVkIGNvbnRhY3RzLlxuICovXG5leHBvcnQgY2xhc3MgTXVsdGlDb250YWN0Vmlld2VyIGltcGxlbWVudHMgQ29tcG9uZW50PE11bHRpQ29udGFjdFZpZXdlckF0dHJzPiB7XG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxNdWx0aUNvbnRhY3RWaWV3ZXJBdHRycz4pIHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShDb2x1bW5FbXB0eU1lc3NhZ2VCb3gsIHtcblx0XHRcdFx0bWVzc2FnZTogZ2V0Q29udGFjdFNlbGVjdGlvbk1lc3NhZ2UoYXR0cnMuc2VsZWN0ZWRFbnRpdGllcy5sZW5ndGgpLFxuXHRcdFx0XHRpY29uOiBCb290SWNvbnMuQ29udGFjdHMsXG5cdFx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X21lc3NhZ2VfYmcsXG5cdFx0XHRcdGJvdHRvbUNvbnRlbnQ6XG5cdFx0XHRcdFx0YXR0cnMuc2VsZWN0ZWRFbnRpdGllcy5sZW5ndGggPiAwXG5cdFx0XHRcdFx0XHQ/IG0oQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwiY2FuY2VsX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBhdHRycy5zZWxlY3ROb25lKCksXG5cdFx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0XHQ6IHVuZGVmaW5lZCxcblx0XHRcdFx0YmFja2dyb3VuZENvbG9yOiB0aGVtZS5uYXZpZ2F0aW9uX2JnLFxuXHRcdFx0fSksXG5cdFx0XVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250YWN0U2VsZWN0aW9uTWVzc2FnZShudW1iZXJFbnRpdGllczogbnVtYmVyKTogVHJhbnNsYXRpb24ge1xuXHRpZiAobnVtYmVyRW50aXRpZXMgPT09IDApIHtcblx0XHRyZXR1cm4gbGFuZy5nZXRUcmFuc2xhdGlvbihcIm5vQ29udGFjdF9tc2dcIilcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gbGFuZy5nZXRUcmFuc2xhdGlvbihcIm5ick9mQ29udGFjdHNTZWxlY3RlZF9tc2dcIiwge1xuXHRcdFx0XCJ7MX1cIjogbnVtYmVyRW50aXRpZXMsXG5cdFx0fSlcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9uS2V5LCBNYXliZVRyYW5zbGF0aW9uIH0gZnJvbSBcIi4uLy4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uL3RoZW1lXCJcbmltcG9ydCB7IGlucHV0TGluZUhlaWdodCwgcHgsIHNpemUgfSBmcm9tIFwiLi4vc2l6ZVwiXG5pbXBvcnQgdHlwZSB7IGxhenkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcblxuZXhwb3J0IHR5cGUgVGV4dERpc3BsYXlBcmVhQXR0cnMgPSB7XG5cdHZhbHVlOiBzdHJpbmdcblx0bGFiZWw6IE1heWJlVHJhbnNsYXRpb25cbn1cblxuLyoqXG4gKiBTaW1wbGUgdGV4dCBhcmVhIHRvIGRpc3BsYXkgc29tZSBwcmVmb3JtYXRlZCBub24tZWRpdGFibGUgdGV4dC5cbiAqL1xuZXhwb3J0IGNsYXNzIFRleHREaXNwbGF5QXJlYSBpbXBsZW1lbnRzIENvbXBvbmVudDxUZXh0RGlzcGxheUFyZWFBdHRycz4ge1xuXHR2aWV3KHZub2RlOiBWbm9kZTxUZXh0RGlzcGxheUFyZWFBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXCIuZmxleC5mbGV4LWdyb3cuZmxleC1jb2x1bW4udGV4dC5wdFwiLCBbXG5cdFx0XHRtKFxuXHRcdFx0XHRcImxhYmVsLnRleHQtZWxsaXBzaXMubm9zZWxlY3QuejEuaS5wci1zXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0Zm9udFNpemU6IHB4KHNpemUuZm9udF9zaXplX3NtYWxsKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRsYW5nLmdldFRyYW5zbGF0aW9uVGV4dCh2bm9kZS5hdHRycy5sYWJlbCksXG5cdFx0XHQpLFxuXHRcdFx0bShcblx0XHRcdFx0XCIudGV4dC1wcmUuZmxleC1ncm93XCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0Ym9yZGVyQm90dG9tOiBgMXB4IHNvbGlkICR7dGhlbWUuY29udGVudF9ib3JkZXJ9YCxcblx0XHRcdFx0XHRcdGxpbmVIZWlnaHQ6IHB4KGlucHV0TGluZUhlaWdodCksXG5cdFx0XHRcdFx0XHRtaW5IZWlnaHQ6IHB4KGlucHV0TGluZUhlaWdodCksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR2bm9kZS5hdHRycy52YWx1ZSxcblx0XHRcdCksXG5cdFx0XSlcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRBcnJheSwgQ2hpbGRyZW4gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgeyB3aW5kb3dGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvV2luZG93RmFjYWRlXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29uc1wiXG5pbXBvcnQgeyBDb250YWN0QWRkcmVzc1R5cGUsIENvbnRhY3RNZXJnZUFjdGlvbiwgZ2V0Q29udGFjdFNvY2lhbFR5cGUsIEtleXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGZvcm1hdENvbnRhY3REYXRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jb250YWN0c0Z1bmN0aW9uYWxpdHkvQ29udGFjdFV0aWxzLmpzXCJcbmltcG9ydCB7IGRlZmVyLCBEZWZlcnJlZE9iamVjdCwgZGVsYXksIGRvd25jYXN0LCBUaHVuayB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgSHRtbEVkaXRvciwgSHRtbEVkaXRvck1vZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9lZGl0b3IvSHRtbEVkaXRvclwiXG5pbXBvcnQgeyBCdXR0b25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHR5cGUgeyBDb250YWN0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgZ2V0Q29udGFjdEFkZHJlc3NUeXBlTGFiZWwsIGdldENvbnRhY3RQaG9uZU51bWJlclR5cGVMYWJlbCwgZ2V0Q29udGFjdFNvY2lhbFR5cGVMYWJlbCB9IGZyb20gXCIuL0NvbnRhY3RHdWlVdGlsc1wiXG5pbXBvcnQgeyBUZXh0RmllbGQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBUZXh0RGlzcGxheUFyZWEgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1RleHREaXNwbGF5QXJlYVwiXG5pbXBvcnQgeyBEaWFsb2dIZWFkZXJCYXJBdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nSGVhZGVyQmFyXCJcbmltcG9ydCB7IEljb25CdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgTG9naW5CdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2J1dHRvbnMvTG9naW5CdXR0b24uanNcIlxuXG5leHBvcnQgY2xhc3MgQ29udGFjdE1lcmdlVmlldyB7XG5cdGRpYWxvZzogRGlhbG9nXG5cdGNvbnRhY3QxOiBDb250YWN0XG5cdGNvbnRhY3QyOiBDb250YWN0XG5cdHJlc29sdmVGdW5jdGlvbjogRGVmZXJyZWRPYmplY3Q8Q29udGFjdE1lcmdlQWN0aW9uPltcInJlc29sdmVcIl0gfCBudWxsID0gbnVsbCAvLyBtdXN0IGJlIGNhbGxlZCBhZnRlciB0aGUgdXNlciBhY3Rpb25cblxuXHR3aW5kb3dDbG9zZVVuc3Vic2NyaWJlOiBUaHVuayB8IG51bGwgPSBudWxsXG5cblx0Y29uc3RydWN0b3IoY29udGFjdDE6IENvbnRhY3QsIGNvbnRhY3QyOiBDb250YWN0KSB7XG5cdFx0dGhpcy5jb250YWN0MSA9IGNvbnRhY3QxXG5cdFx0dGhpcy5jb250YWN0MiA9IGNvbnRhY3QyXG5cblx0XHRjb25zdCBjYW5jZWxBY3Rpb24gPSAoKSA9PiB7XG5cdFx0XHR0aGlzLl9jbG9zZShDb250YWN0TWVyZ2VBY3Rpb24uQ2FuY2VsKVxuXHRcdH1cblxuXHRcdGNvbnN0IGhlYWRlckJhckF0dHJzID0ge1xuXHRcdFx0bGVmdDogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGFiZWw6IFwiY2FuY2VsX2FjdGlvblwiLFxuXHRcdFx0XHRcdGNsaWNrOiBjYW5jZWxBY3Rpb24sXG5cdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdFx0cmlnaHQ6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxhYmVsOiBcInNraXBfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHRoaXMuX2Nsb3NlKENvbnRhY3RNZXJnZUFjdGlvbi5Ta2lwKSxcblx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlByaW1hcnksXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdFx0bWlkZGxlOiBcIm1lcmdlX2FjdGlvblwiLFxuXHRcdH1cblx0XHR0aGlzLmRpYWxvZyA9IERpYWxvZy5sYXJnZURpYWxvZyhoZWFkZXJCYXJBdHRycyBhcyBEaWFsb2dIZWFkZXJCYXJBdHRycywgdGhpcylcblx0XHRcdC5zZXRDbG9zZUhhbmRsZXIoY2FuY2VsQWN0aW9uKVxuXHRcdFx0LmFkZFNob3J0Y3V0KHtcblx0XHRcdFx0a2V5OiBLZXlzLkVTQyxcblx0XHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuX2Nsb3NlKENvbnRhY3RNZXJnZUFjdGlvbi5DYW5jZWwpXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlbHA6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHR9KVxuXHR9XG5cblx0dmlldygpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgeyBtYWlsQWRkcmVzc2VzOiBtYWlsQWRkcmVzc2VzMSwgcGhvbmVzOiBwaG9uZXMxLCBhZGRyZXNzZXM6IGFkZHJlc3NlczEsIHNvY2lhbHM6IHNvY2lhbHMxIH0gPSB0aGlzLl9jcmVhdGVDb250YWN0RmllbGRzKHRoaXMuY29udGFjdDEpXG5cblx0XHRjb25zdCB7IG1haWxBZGRyZXNzZXM6IG1haWxBZGRyZXNzZXMyLCBwaG9uZXM6IHBob25lczIsIGFkZHJlc3NlczogYWRkcmVzc2VzMiwgc29jaWFsczogc29jaWFsczIgfSA9IHRoaXMuX2NyZWF0ZUNvbnRhY3RGaWVsZHModGhpcy5jb250YWN0MilcblxuXHRcdC8vZW1wdHkuLiBwbGFjZWhvbGRlcnMgYXJlIHVzZWQgaWYgb25lIGNvbnRhY3QgaGFzIGFuIGF0dHJpYnV0ZSB3aGlsZSB0aGUgb3RoZXIgZG9lcyBub3QgaGF2ZSBpdCwgc28gYW4gZW1wdHkgb25lIGlzIHNob3duIGZvciBjb21wYXJpc29uXG5cdFx0bGV0IGVtcHR5RmllbGRQbGFjZWhvbGRlciA9IG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRsYWJlbDogXCJlbXB0eVN0cmluZ19tc2dcIixcblx0XHRcdHZhbHVlOiBcIlwiLFxuXHRcdFx0aXNSZWFkT25seTogdHJ1ZSxcblx0XHR9KVxuXHRcdGxldCBlbXB0eUhUTUxGaWVsZFBsYWNlaG9sZGVyID0gbShcblx0XHRcdG5ldyBIdG1sRWRpdG9yKFwiZW1wdHlTdHJpbmdfbXNnXCIpLnNob3dCb3JkZXJzKCkuc2V0VmFsdWUoXCJcIikuc2V0UmVhZE9ubHkoZmFsc2UpLnNldE1vZGUoSHRtbEVkaXRvck1vZGUuSFRNTCkuc2V0SHRtbE1vbm9zcGFjZShmYWxzZSksXG5cdFx0KVxuXG5cdFx0bGV0IHRpdGxlRmllbGRzID0gdGhpcy5fY3JlYXRlVGV4dEZpZWxkcyh0aGlzLmNvbnRhY3QxLnRpdGxlLCB0aGlzLmNvbnRhY3QyLnRpdGxlLCBcInRpdGxlX3BsYWNlaG9sZGVyXCIpXG5cblx0XHRsZXQgZmlyc3ROYW1lRmllbGRzID0gdGhpcy5fY3JlYXRlVGV4dEZpZWxkcyh0aGlzLmNvbnRhY3QxLmZpcnN0TmFtZSwgdGhpcy5jb250YWN0Mi5maXJzdE5hbWUsIFwiZmlyc3ROYW1lX3BsYWNlaG9sZGVyXCIpXG5cblx0XHRsZXQgbGFzdE5hbWVGaWVsZHMgPSB0aGlzLl9jcmVhdGVUZXh0RmllbGRzKHRoaXMuY29udGFjdDEubGFzdE5hbWUsIHRoaXMuY29udGFjdDIubGFzdE5hbWUsIFwibGFzdE5hbWVfcGxhY2Vob2xkZXJcIilcblxuXHRcdGxldCBuaWNrbmFtZUZpZWxkcyA9IHRoaXMuX2NyZWF0ZVRleHRGaWVsZHModGhpcy5jb250YWN0MS5uaWNrbmFtZSwgdGhpcy5jb250YWN0Mi5uaWNrbmFtZSwgXCJuaWNrbmFtZV9wbGFjZWhvbGRlclwiKVxuXG5cdFx0bGV0IGNvbXBhbnlGaWVsZHMgPSB0aGlzLl9jcmVhdGVUZXh0RmllbGRzKHRoaXMuY29udGFjdDEuY29tcGFueSwgdGhpcy5jb250YWN0Mi5jb21wYW55LCBcImNvbXBhbnlfbGFiZWxcIilcblxuXHRcdGxldCByb2xlRmllbGRzID0gdGhpcy5fY3JlYXRlVGV4dEZpZWxkcyh0aGlzLmNvbnRhY3QxLnJvbGUsIHRoaXMuY29udGFjdDIucm9sZSwgXCJyb2xlX3BsYWNlaG9sZGVyXCIpXG5cblx0XHRsZXQgYmlydGhkYXlGaWVsZHMgPSB0aGlzLl9jcmVhdGVUZXh0RmllbGRzKGZvcm1hdENvbnRhY3REYXRlKHRoaXMuY29udGFjdDEuYmlydGhkYXlJc28pLCBmb3JtYXRDb250YWN0RGF0ZSh0aGlzLmNvbnRhY3QyLmJpcnRoZGF5SXNvKSwgXCJiaXJ0aGRheV9hbHRcIilcblxuXHRcdGxldCBwcmVzaGFyZWRQYXNzd29yZEZpZWxkcyA9IHRoaXMuX2NyZWF0ZVRleHRGaWVsZHMoXG5cdFx0XHR0aGlzLmNvbnRhY3QxLnByZXNoYXJlZFBhc3N3b3JkICYmIHRoaXMuY29udGFjdDEucHJlc2hhcmVkUGFzc3dvcmQubGVuZ3RoID4gMCA/IFwiKioqXCIgOiBcIlwiLFxuXHRcdFx0dGhpcy5jb250YWN0Mi5wcmVzaGFyZWRQYXNzd29yZCAmJiB0aGlzLmNvbnRhY3QyLnByZXNoYXJlZFBhc3N3b3JkLmxlbmd0aCA+IDAgPyBcIioqKlwiIDogXCJcIixcblx0XHRcdFwicHJlc2hhcmVkUGFzc3dvcmRfbGFiZWxcIixcblx0XHQpXG5cblx0XHRsZXQgY29tbWVudEZpZWxkMTogQ2hpbGRyZW4gPSBudWxsXG5cdFx0bGV0IGNvbW1lbnRGaWVsZDI6IENoaWxkcmVuID0gbnVsbFxuXG5cdFx0aWYgKHRoaXMuY29udGFjdDEuY29tbWVudCB8fCB0aGlzLmNvbnRhY3QyLmNvbW1lbnQpIHtcblx0XHRcdGNvbW1lbnRGaWVsZDEgPSBtKFRleHREaXNwbGF5QXJlYSwge1xuXHRcdFx0XHRsYWJlbDogXCJjb21tZW50X2xhYmVsXCIsXG5cdFx0XHRcdHZhbHVlOiB0aGlzLmNvbnRhY3QxLmNvbW1lbnQsXG5cdFx0XHR9KVxuXHRcdFx0Y29tbWVudEZpZWxkMiA9IG0oVGV4dERpc3BsYXlBcmVhLCB7XG5cdFx0XHRcdGxhYmVsOiBcImNvbW1lbnRfbGFiZWxcIixcblx0XHRcdFx0dmFsdWU6IHRoaXMuY29udGFjdDIuY29tbWVudCxcblx0XHRcdH0pXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIiNjb250YWN0LWVkaXRvclwiLFxuXHRcdFx0e1xuXHRcdFx0XHRvbmNyZWF0ZTogKCkgPT4gKHRoaXMud2luZG93Q2xvc2VVbnN1YnNjcmliZSA9IHdpbmRvd0ZhY2FkZS5hZGRXaW5kb3dDbG9zZUxpc3RlbmVyKCgpID0+IHt9KSksXG5cdFx0XHRcdG9ucmVtb3ZlOiAoKSA9PiB0aGlzLndpbmRvd0Nsb3NlVW5zdWJzY3JpYmU/LigpLFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0bShcIi5mbGV4LWNlbnRlci5tdFwiLCBbXG5cdFx0XHRcdFx0bShcIi5mdWxsLXdpZHRoLm1heC13aWR0aC1zXCIsIFtcblx0XHRcdFx0XHRcdG0oTG9naW5CdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0bGFiZWw6IFwibWVyZ2VDb250YWN0c19hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0b25jbGljazogKCkgPT4gdGhpcy5fY2xvc2UoQ29udGFjdE1lcmdlQWN0aW9uLk1lcmdlKSxcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRdKSxcblx0XHRcdFx0bShcIi5ub24td3JhcHBpbmctcm93XCIsIFtcblx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XCJcIixcblx0XHRcdFx0XHRcdC8qZmlyc3QgY29udGFjdCAqL1xuXHRcdFx0XHRcdFx0W1xuXHRcdFx0XHRcdFx0XHRtKFwiLml0ZW1zLWNlbnRlclwiLCBbXG5cdFx0XHRcdFx0XHRcdFx0bShcIi5pdGVtcy1iYXNlLmZsZXgtc3BhY2UtYmV0d2VlblwiLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHRtKFwiLmg0Lm10LWxcIiwgbGFuZy5nZXQoXCJmaXJzdE1lcmdlQ29udGFjdF9sYWJlbFwiKSksXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLl9jcmVhdGVEZWxldGVDb250YWN0QnV0dG9uKENvbnRhY3RNZXJnZUFjdGlvbi5EZWxldGVGaXJzdCksXG5cdFx0XHRcdFx0XHRcdFx0XSksXG5cdFx0XHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcIlwiLFxuXHRcdFx0XHRcdFx0LypzZWNvbmQgY29udGFjdCAqL1xuXHRcdFx0XHRcdFx0W1xuXHRcdFx0XHRcdFx0XHRtKFwiLml0ZW1zLWNlbnRlclwiLCBbXG5cdFx0XHRcdFx0XHRcdFx0bShcIi5pdGVtcy1iYXNlLmZsZXgtc3BhY2UtYmV0d2VlblwiLCBbXG5cdFx0XHRcdFx0XHRcdFx0XHRtKFwiLmg0Lm10LWxcIiwgbGFuZy5nZXQoXCJzZWNvbmRNZXJnZUNvbnRhY3RfbGFiZWxcIikpLFxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5fY3JlYXRlRGVsZXRlQ29udGFjdEJ1dHRvbihDb250YWN0TWVyZ2VBY3Rpb24uRGVsZXRlU2Vjb25kKSxcblx0XHRcdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRcdFx0XSksXG5cdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XHR0aXRsZUZpZWxkcyA/IG0oXCIubm9uLXdyYXBwaW5nLXJvd1wiLCB0aXRsZUZpZWxkcykgOiBudWxsLFxuXHRcdFx0XHRmaXJzdE5hbWVGaWVsZHMgPyBtKFwiLm5vbi13cmFwcGluZy1yb3dcIiwgZmlyc3ROYW1lRmllbGRzKSA6IG51bGwsXG5cdFx0XHRcdGxhc3ROYW1lRmllbGRzID8gbShcIi5ub24td3JhcHBpbmctcm93XCIsIGxhc3ROYW1lRmllbGRzKSA6IG51bGwsXG5cdFx0XHRcdG5pY2tuYW1lRmllbGRzID8gbShcIi5ub24td3JhcHBpbmctcm93XCIsIG5pY2tuYW1lRmllbGRzKSA6IG51bGwsXG5cdFx0XHRcdGNvbXBhbnlGaWVsZHMgPyBtKFwiLm5vbi13cmFwcGluZy1yb3dcIiwgY29tcGFueUZpZWxkcykgOiBudWxsLFxuXHRcdFx0XHRiaXJ0aGRheUZpZWxkcyA/IG0oXCIubm9uLXdyYXBwaW5nLXJvd1wiLCBiaXJ0aGRheUZpZWxkcykgOiBudWxsLFxuXHRcdFx0XHRyb2xlRmllbGRzID8gbShcIi5ub24td3JhcHBpbmctcm93XCIsIHJvbGVGaWVsZHMpIDogbnVsbCxcblx0XHRcdFx0bWFpbEFkZHJlc3NlczEubGVuZ3RoID4gMCB8fCBtYWlsQWRkcmVzc2VzMi5sZW5ndGggPiAwXG5cdFx0XHRcdFx0PyBtKFwiLm5vbi13cmFwcGluZy1yb3dcIiwgW1xuXHRcdFx0XHRcdFx0XHRtKFwiLm1haWwubXQtbFwiLCBbbShcIlwiLCBsYW5nLmdldChcImVtYWlsX2xhYmVsXCIpKSwgbWFpbEFkZHJlc3NlczEubGVuZ3RoID4gMCA/IG1haWxBZGRyZXNzZXMxIDogZW1wdHlGaWVsZFBsYWNlaG9sZGVyXSksXG5cdFx0XHRcdFx0XHRcdG0oXCIubWFpbC5tdC1sXCIsIFttKFwiXCIsIGxhbmcuZ2V0KFwiZW1haWxfbGFiZWxcIikpLCBtYWlsQWRkcmVzc2VzMi5sZW5ndGggPiAwID8gbWFpbEFkZHJlc3NlczIgOiBlbXB0eUZpZWxkUGxhY2Vob2xkZXJdKSxcblx0XHRcdFx0XHQgIF0pXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRwaG9uZXMxLmxlbmd0aCA+IDAgfHwgcGhvbmVzMi5sZW5ndGggPiAwXG5cdFx0XHRcdFx0PyBtKFwiLm5vbi13cmFwcGluZy1yb3dcIiwgW1xuXHRcdFx0XHRcdFx0XHRtKFwiLnBob25lLm10LWxcIiwgW20oXCJcIiwgbGFuZy5nZXQoXCJwaG9uZV9sYWJlbFwiKSksIG0oXCIuYWdncmVnYXRlRWRpdG9yc1wiLCBbcGhvbmVzMS5sZW5ndGggPiAwID8gcGhvbmVzMSA6IGVtcHR5RmllbGRQbGFjZWhvbGRlcl0pXSksXG5cdFx0XHRcdFx0XHRcdG0oXCIucGhvbmUubXQtbFwiLCBbbShcIlwiLCBsYW5nLmdldChcInBob25lX2xhYmVsXCIpKSwgbShcIi5hZ2dyZWdhdGVFZGl0b3JzXCIsIFtwaG9uZXMyLmxlbmd0aCA+IDAgPyBwaG9uZXMyIDogZW1wdHlGaWVsZFBsYWNlaG9sZGVyXSldKSxcblx0XHRcdFx0XHQgIF0pXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRhZGRyZXNzZXMxLmxlbmd0aCA+IDAgfHwgYWRkcmVzc2VzMi5sZW5ndGggPiAwXG5cdFx0XHRcdFx0PyBtKFwiLm5vbi13cmFwcGluZy1yb3dcIiwgW1xuXHRcdFx0XHRcdFx0XHRtKFwiLmFkZHJlc3MubXQtbC5mbGV4LmZsZXgtY29sdW1uXCIsIFtcblx0XHRcdFx0XHRcdFx0XHRtKFwiXCIsIGxhbmcuZ2V0KFwiYWRkcmVzc19sYWJlbFwiKSksXG5cdFx0XHRcdFx0XHRcdFx0bShcIi5hZ2dyZWdhdGVFZGl0b3JzLmZsZXguZmxleC1jb2x1bW4uZmxleC1ncm93XCIsIFthZGRyZXNzZXMxLmxlbmd0aCA+IDAgPyBhZGRyZXNzZXMxIDogZW1wdHlIVE1MRmllbGRQbGFjZWhvbGRlcl0pLFxuXHRcdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRcdFx0bShcIi5hZGRyZXNzLm10LWxcIiwgW1xuXHRcdFx0XHRcdFx0XHRcdG0oXCJcIiwgbGFuZy5nZXQoXCJhZGRyZXNzX2xhYmVsXCIpKSxcblx0XHRcdFx0XHRcdFx0XHRtKFwiLmFnZ3JlZ2F0ZUVkaXRvcnMuZmxleC5mbGV4LWNvbHVtbi5mbGV4LWdyb3dcIiwgW2FkZHJlc3NlczIubGVuZ3RoID4gMCA/IGFkZHJlc3NlczIgOiBlbXB0eUhUTUxGaWVsZFBsYWNlaG9sZGVyXSksXG5cdFx0XHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRcdCAgXSlcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdHNvY2lhbHMxLmxlbmd0aCA+IDAgfHwgc29jaWFsczIubGVuZ3RoID4gMFxuXHRcdFx0XHRcdD8gbShcIi5ub24td3JhcHBpbmctcm93XCIsIFtcblx0XHRcdFx0XHRcdFx0bShcIi5zb2NpYWwubXQtbFwiLCBbXG5cdFx0XHRcdFx0XHRcdFx0bShcIlwiLCBsYW5nLmdldChcInNvY2lhbF9sYWJlbFwiKSksXG5cdFx0XHRcdFx0XHRcdFx0bShcIi5hZ2dyZWdhdGVFZGl0b3JzXCIsIHNvY2lhbHMxLmxlbmd0aCA+IDAgPyBzb2NpYWxzMSA6IGVtcHR5RmllbGRQbGFjZWhvbGRlciksXG5cdFx0XHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRcdFx0XHRtKFwiLnNvY2lhbC5tdC1sXCIsIFtcblx0XHRcdFx0XHRcdFx0XHRtKFwiXCIsIGxhbmcuZ2V0KFwic29jaWFsX2xhYmVsXCIpKSxcblx0XHRcdFx0XHRcdFx0XHRtKFwiLmFnZ3JlZ2F0ZUVkaXRvcnNcIiwgc29jaWFsczIubGVuZ3RoID4gMCA/IHNvY2lhbHMyIDogZW1wdHlGaWVsZFBsYWNlaG9sZGVyKSxcblx0XHRcdFx0XHRcdFx0XSksXG5cdFx0XHRcdFx0ICBdKVxuXHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0Y29tbWVudEZpZWxkMSAmJiBjb21tZW50RmllbGQyXG5cdFx0XHRcdFx0PyBtKFwiLm5vbi13cmFwcGluZy1yb3dcIiwgW20oXCIubXQtbC5mbGV4LmZsZXgtY29sdW1uXCIsIFtjb21tZW50RmllbGQxXSksIG0oXCIubXQtbC5mbGV4LmZsZXgtY29sdW1uXCIsIFtjb21tZW50RmllbGQyXSldKVxuXHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0cHJlc2hhcmVkUGFzc3dvcmRGaWVsZHMgPyBtKFwiLm5vbi13cmFwcGluZy1yb3dcIiwgcHJlc2hhcmVkUGFzc3dvcmRGaWVsZHMpIDogbnVsbCxcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIlwiLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdGhlaWdodDogXCI1cHhcIixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQvKlVzZWQgYXMgc3BhY2VyIHNvIHRoZSBsYXN0IGd1aS1lbGVtZW50IGlzIG5vdCB0b3VjaGluZyB0aGUgd2luZG93IGJvcmRlciovXG5cdFx0XHRcdCksXG5cdFx0XHRdLFxuXHRcdClcblx0fVxuXG5cdF9jcmVhdGVDb250YWN0RmllbGRzKGNvbnRhY3Q6IENvbnRhY3QpOiB7XG5cdFx0bWFpbEFkZHJlc3NlczogQ2hpbGRBcnJheVxuXHRcdHBob25lczogQ2hpbGRBcnJheVxuXHRcdGFkZHJlc3NlczogQ2hpbGRBcnJheVxuXHRcdHNvY2lhbHM6IENoaWxkQXJyYXlcblx0fSB7XG5cdFx0Y29uc3QgbWFpbEFkZHJlc3NlcyA9IGNvbnRhY3QubWFpbEFkZHJlc3Nlcy5tYXAoKGVsZW1lbnQpID0+IHtcblx0XHRcdHJldHVybiBtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRsYWJlbDogZ2V0Q29udGFjdEFkZHJlc3NUeXBlTGFiZWwoZWxlbWVudC50eXBlIGFzIGFueSwgZWxlbWVudC5jdXN0b21UeXBlTmFtZSksXG5cdFx0XHRcdHZhbHVlOiBlbGVtZW50LmFkZHJlc3MsXG5cdFx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHR9KVxuXHRcdH0pXG5cdFx0Y29uc3QgcGhvbmVzID0gY29udGFjdC5waG9uZU51bWJlcnMubWFwKChlbGVtZW50KSA9PiB7XG5cdFx0XHRyZXR1cm4gbShUZXh0RmllbGQsIHtcblx0XHRcdFx0bGFiZWw6IGdldENvbnRhY3RQaG9uZU51bWJlclR5cGVMYWJlbChlbGVtZW50LnR5cGUgYXMgYW55LCBlbGVtZW50LmN1c3RvbVR5cGVOYW1lKSxcblx0XHRcdFx0dmFsdWU6IGVsZW1lbnQubnVtYmVyLFxuXHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0fSlcblx0XHR9KVxuXHRcdGNvbnN0IGFkZHJlc3NlcyA9IGNvbnRhY3QuYWRkcmVzc2VzLm1hcCgoZWxlbWVudCkgPT4ge1xuXHRcdFx0Ly8gTWFudWFsbHkgaW1wbGVtZW50IHRleHQgYXJlYSB0byBtYWtlIGl0IHN0cmV0Y2ggdmVydGljYWxseS4gVGV4dEZpZWxkIGlzIHVuYWJsZSB0byBkbyB0aGF0LlxuXHRcdFx0cmV0dXJuIG0oVGV4dERpc3BsYXlBcmVhLCB7XG5cdFx0XHRcdHZhbHVlOiBlbGVtZW50LmFkZHJlc3MsXG5cdFx0XHRcdGxhYmVsOiBnZXRDb250YWN0QWRkcmVzc1R5cGVMYWJlbChkb3duY2FzdDxDb250YWN0QWRkcmVzc1R5cGU+KGVsZW1lbnQudHlwZSksIGVsZW1lbnQuY3VzdG9tVHlwZU5hbWUpLFxuXHRcdFx0fSlcblx0XHR9KVxuXHRcdGNvbnN0IHNvY2lhbHMgPSBjb250YWN0LnNvY2lhbElkcy5tYXAoKGVsZW1lbnQpID0+IHtcblx0XHRcdHJldHVybiBtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRsYWJlbDogZ2V0Q29udGFjdFNvY2lhbFR5cGVMYWJlbChnZXRDb250YWN0U29jaWFsVHlwZShlbGVtZW50KSwgZWxlbWVudC5jdXN0b21UeXBlTmFtZSksXG5cdFx0XHRcdHZhbHVlOiBlbGVtZW50LnNvY2lhbElkLFxuXHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0fSlcblx0XHR9KVxuXHRcdHJldHVybiB7XG5cdFx0XHRtYWlsQWRkcmVzc2VzLFxuXHRcdFx0cGhvbmVzLFxuXHRcdFx0YWRkcmVzc2VzLFxuXHRcdFx0c29jaWFscyxcblx0XHR9XG5cdH1cblxuXHRfY3JlYXRlVGV4dEZpZWxkcyh2YWx1ZTE6IHN0cmluZyB8IG51bGwsIHZhbHVlMjogc3RyaW5nIHwgbnVsbCwgbGFiZWxUZXh0SWQ6IFRyYW5zbGF0aW9uS2V5KTogQ2hpbGRyZW4ge1xuXHRcdGlmICh2YWx1ZTEgfHwgdmFsdWUyKSB7XG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdGxhYmVsOiBsYWJlbFRleHRJZCxcblx0XHRcdFx0XHR2YWx1ZTogdmFsdWUxIHx8IFwiXCIsXG5cdFx0XHRcdFx0aXNSZWFkT25seTogdHJ1ZSxcblx0XHRcdFx0fSksXG5cdFx0XHRcdG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRcdFx0bGFiZWw6IGxhYmVsVGV4dElkLFxuXHRcdFx0XHRcdHZhbHVlOiB2YWx1ZTIgfHwgXCJcIixcblx0XHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0XHR9KSxcblx0XHRcdF1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cdH1cblxuXHRfY3JlYXRlRGVsZXRlQ29udGFjdEJ1dHRvbihhY3Rpb246IENvbnRhY3RNZXJnZUFjdGlvbik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJkZWxldGVfYWN0aW9uXCIsXG5cdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHREaWFsb2cuY29uZmlybShcImRlbGV0ZUNvbnRhY3RfbXNnXCIpLnRoZW4oKGNvbmZpcm1lZCkgPT4ge1xuXHRcdFx0XHRcdGlmIChjb25maXJtZWQpIHtcblx0XHRcdFx0XHRcdHRoaXMuX2Nsb3NlKGFjdGlvbilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHR9LFxuXHRcdFx0aWNvbjogSWNvbnMuVHJhc2gsXG5cdFx0fSlcblx0fVxuXG5cdHNob3coKTogUHJvbWlzZTxDb250YWN0TWVyZ2VBY3Rpb24+IHtcblx0XHR0aGlzLmRpYWxvZy5zaG93KClcblx0XHRsZXQgZCA9IGRlZmVyPENvbnRhY3RNZXJnZUFjdGlvbj4oKVxuXHRcdHRoaXMucmVzb2x2ZUZ1bmN0aW9uID0gZC5yZXNvbHZlXG5cdFx0cmV0dXJuIGQucHJvbWlzZVxuXHR9XG5cblx0X2Nsb3NlKGFjdGlvbjogQ29udGFjdE1lcmdlQWN0aW9uKTogdm9pZCB7XG5cdFx0dGhpcy5kaWFsb2cuY2xvc2UoKVxuXHRcdGRlbGF5KDIwMCkudGhlbigoKSA9PiB7XG5cdFx0XHR0aGlzLnJlc29sdmVGdW5jdGlvbj8uKGFjdGlvbilcblx0XHR9KVxuXHR9XG59XG4iLCJpbXBvcnQgeyBDb250YWN0Q29tcGFyaXNvblJlc3VsdCwgSW5kaWZmZXJlbnRDb250YWN0Q29tcGFyaXNvblJlc3VsdCB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBuZXZlck51bGwgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGlzb0RhdGVUb0JpcnRoZGF5IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0JpcnRoZGF5VXRpbHNcIlxuaW1wb3J0IHR5cGUgeyBDb250YWN0IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHR5cGUgeyBDb250YWN0TWFpbEFkZHJlc3MgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgdHlwZSB7IEJpcnRoZGF5IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHR5cGUgeyBDb250YWN0QWRkcmVzcyB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB0eXBlIHsgQ29udGFjdFBob25lTnVtYmVyIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHR5cGUgeyBDb250YWN0U29jaWFsSWQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5cbi8qKlxuICogcmV0dXJucyBhbGwgY29udGFjdHMgdGhhdCBhcmUgZGVsZXRhYmxlIGJlY2F1c2UgYW5vdGhlciBjb250YWN0IGV4aXN0cyB0aGF0IGlzIGV4YWN0bHkgdGhlIHNhbWUsIGFuZCBhbGwgY29udGFjdHMgdGhhdCBsb29rIHNpbWlsYXIgYW5kIHRoZXJmb3JlIG1heSBiZSBtZXJnZWQuXG4gKiBjb250YWN0cyBhcmUgbmV2ZXIgcmV0dXJuZWQgaW4gYm90aCBcIm1lcmdhYmxlXCIgYW5kIFwiZGVsZXRhYmxlXCJcbiAqIGNvbnRhY3Qgc2ltaWxhcml0eSBpcyBjaGVja2VkIHRyYW5zaXRpdmVseSwgaS5lLiBpZiBhIHNpbWlsYXIgdG8gYiBhbmQgYiBzaW1pbGFyIHRvIGMsIHRoZW4gYSBzaW1pbGFyIHRvIGNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE1lcmdlYWJsZUNvbnRhY3RzKGlucHV0Q29udGFjdHM6IENvbnRhY3RbXSk6IHtcblx0bWVyZ2VhYmxlOiBDb250YWN0W11bXVxuXHRkZWxldGFibGU6IENvbnRhY3RbXVxufSB7XG5cdGxldCBtZXJnYWJsZUNvbnRhY3RzOiBDb250YWN0W11bXSA9IFtdXG5cdGxldCBkdXBsaWNhdGVDb250YWN0czogQ29udGFjdFtdID0gW11cblx0bGV0IGNvbnRhY3RzID0gaW5wdXRDb250YWN0cy5zbGljZSgpXG5cdGxldCBmaXJzdENvbnRhY3RJbmRleCA9IDBcblxuXHR3aGlsZSAoZmlyc3RDb250YWN0SW5kZXggPCBjb250YWN0cy5sZW5ndGggLSAxKSB7XG5cdFx0bGV0IGN1cnJlbnRNZXJnYWJsZUNvbnRhY3RzOiBDb250YWN0W10gPSBbXVxuXHRcdGxldCBmaXJzdENvbnRhY3QgPSBjb250YWN0c1tmaXJzdENvbnRhY3RJbmRleF1cblx0XHRjdXJyZW50TWVyZ2FibGVDb250YWN0cy5wdXNoKGZpcnN0Q29udGFjdClcblx0XHRsZXQgc2Vjb25kQ29udGFjdEluZGV4ID0gZmlyc3RDb250YWN0SW5kZXggKyAxXG5cblx0XHQvLyBydW4gdGhyb3VnaCBhbGwgY29udGFjdHMgYWZ0ZXIgdGhlIGZpcnN0IGFuZCBjb21wYXJlIHRoZW0gd2l0aCB0aGUgZmlyc3QgKCsgYWxsIG90aGVycyBhbHJlYWR5IGluIHRoZSBjdXJyZW50TWVyZ2FibGVBcnJheSlcblx0XHR3aGlsZSAoc2Vjb25kQ29udGFjdEluZGV4IDwgY29udGFjdHMubGVuZ3RoKSB7XG5cdFx0XHRsZXQgc2Vjb25kQ29udGFjdCA9IGNvbnRhY3RzW3NlY29uZENvbnRhY3RJbmRleF1cblxuXHRcdFx0aWYgKGZpcnN0Q29udGFjdC5faWRbMV0gIT09IHNlY29uZENvbnRhY3QuX2lkWzFdKSB7XG5cdFx0XHRcdC8vIHNob3VsZCBub3QgaGFwcGVuLCBqdXN0IHRvIGJlIHNhZmVcblx0XHRcdFx0bGV0IG92ZXJhbGxSZXN1bHQgPSBDb250YWN0Q29tcGFyaXNvblJlc3VsdC5VbmlxdWVcblxuXHRcdFx0XHQvLyBjb21wYXJlIHRoZSBjdXJyZW50IHNlY29uZCBjb250YWN0IHdpdGggYWxsIGluIHRoZSBjdXJyZW50TWVyZ2FibGVBcnJheSB0byBmaW5kIG91dCBpZiB0aGUgb3ZlcmFsbCBjb21wYXJpc29uIHJlc3VsdCBpcyBlcXVhbCwgc2ltaWxhciBvciB1bmlxdWVcblx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjdXJyZW50TWVyZ2FibGVDb250YWN0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGxldCByZXN1bHQgPSBfY29tcGFyZUNvbnRhY3RzRm9yTWVyZ2UoY3VycmVudE1lcmdhYmxlQ29udGFjdHNbaV0sIHNlY29uZENvbnRhY3QpXG5cblx0XHRcdFx0XHRpZiAocmVzdWx0ID09PSBDb250YWN0Q29tcGFyaXNvblJlc3VsdC5FcXVhbCkge1xuXHRcdFx0XHRcdFx0b3ZlcmFsbFJlc3VsdCA9IENvbnRhY3RDb21wYXJpc29uUmVzdWx0LkVxdWFsXG5cdFx0XHRcdFx0XHRicmVhayAvLyBlcXVhbCBpcyBhbHdheXMgdGhlIGZpbmFsIHJlc3VsdFxuXHRcdFx0XHRcdH0gZWxzZSBpZiAocmVzdWx0ID09PSBDb250YWN0Q29tcGFyaXNvblJlc3VsdC5TaW1pbGFyKSB7XG5cdFx0XHRcdFx0XHRvdmVyYWxsUmVzdWx0ID0gQ29udGFjdENvbXBhcmlzb25SZXN1bHQuU2ltaWxhciAvLyBjb250aW51ZSBjaGVja2luZyB0aGUgb3RoZXIgY29udGFjdHMgaW4gY3VycmVudE1lcmdhYmxlQ29udGFjdHMgdG8gc2VlIGlmIHRoZXJlIGlzIGFuIGVxdWFsIG9uZVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyB0aGUgY29udGFjdHMgYXJlIHVuaXF1ZSwgc28gd2UgZG8gbm90IGhhdmUgdG8gY2hlY2sgdGhlIG90aGVyc1xuXHRcdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAob3ZlcmFsbFJlc3VsdCA9PT0gQ29udGFjdENvbXBhcmlzb25SZXN1bHQuRXF1YWwpIHtcblx0XHRcdFx0XHRkdXBsaWNhdGVDb250YWN0cy5wdXNoKHNlY29uZENvbnRhY3QpXG5cdFx0XHRcdFx0Y29udGFjdHMuc3BsaWNlKHNlY29uZENvbnRhY3RJbmRleCwgMSlcblx0XHRcdFx0fSBlbHNlIGlmIChvdmVyYWxsUmVzdWx0ID09PSBDb250YWN0Q29tcGFyaXNvblJlc3VsdC5TaW1pbGFyKSB7XG5cdFx0XHRcdFx0Y3VycmVudE1lcmdhYmxlQ29udGFjdHMucHVzaChzZWNvbmRDb250YWN0KVxuXHRcdFx0XHRcdGNvbnRhY3RzLnNwbGljZShzZWNvbmRDb250YWN0SW5kZXgsIDEpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2Vjb25kQ29udGFjdEluZGV4Kytcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChjdXJyZW50TWVyZ2FibGVDb250YWN0cy5sZW5ndGggPiAxKSB7XG5cdFx0XHRtZXJnYWJsZUNvbnRhY3RzLnB1c2goY3VycmVudE1lcmdhYmxlQ29udGFjdHMpXG5cdFx0fVxuXG5cdFx0Zmlyc3RDb250YWN0SW5kZXgrK1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRtZXJnZWFibGU6IG1lcmdhYmxlQ29udGFjdHMsXG5cdFx0ZGVsZXRhYmxlOiBkdXBsaWNhdGVDb250YWN0cyxcblx0fVxufVxuXG4vKipcbiAqIG1lcmdlcyB0d28gY29udGFjdHMgKGVsaW1pbmF0ZWRDb250YWN0IGlzIG1lcmdlZCBpbnRvIGtlcHRDb250YWN0KS4gb3V0c2lkZSB0aGlzIGZ1bmN0aW9uIGtlcHRDb250YWN0IG11c3QgYmUgdXBkYXRlZCBvbiB0aGUgc2VydmVyIGFuZCBlbGltaW5hdGVkQ29udGFjdCBtdXN0IGJlIGRlbGV0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlQ29udGFjdHMoa2VwdENvbnRhY3Q6IENvbnRhY3QsIGVsaW1pbmF0ZWRDb250YWN0OiBDb250YWN0KTogdm9pZCB7XG5cdGtlcHRDb250YWN0LmZpcnN0TmFtZSA9IF9nZXRNZXJnZWROYW1lRmllbGQoa2VwdENvbnRhY3QuZmlyc3ROYW1lLCBlbGltaW5hdGVkQ29udGFjdC5maXJzdE5hbWUpXG5cdGtlcHRDb250YWN0Lmxhc3ROYW1lID0gX2dldE1lcmdlZE5hbWVGaWVsZChrZXB0Q29udGFjdC5sYXN0TmFtZSwgZWxpbWluYXRlZENvbnRhY3QubGFzdE5hbWUpXG5cdGtlcHRDb250YWN0LnRpdGxlID0gbmV2ZXJOdWxsKF9nZXRNZXJnZWRPdGhlckZpZWxkKGtlcHRDb250YWN0LnRpdGxlLCBlbGltaW5hdGVkQ29udGFjdC50aXRsZSwgXCIsIFwiKSlcblx0a2VwdENvbnRhY3QuY29tbWVudCA9IG5ldmVyTnVsbChfZ2V0TWVyZ2VkT3RoZXJGaWVsZChrZXB0Q29udGFjdC5jb21tZW50LCBlbGltaW5hdGVkQ29udGFjdC5jb21tZW50LCBcIlxcblxcblwiKSlcblx0a2VwdENvbnRhY3QuY29tcGFueSA9IG5ldmVyTnVsbChfZ2V0TWVyZ2VkT3RoZXJGaWVsZChrZXB0Q29udGFjdC5jb21wYW55LCBlbGltaW5hdGVkQ29udGFjdC5jb21wYW55LCBcIiwgXCIpKVxuXHRrZXB0Q29udGFjdC5uaWNrbmFtZSA9IF9nZXRNZXJnZWRPdGhlckZpZWxkKGtlcHRDb250YWN0Lm5pY2tuYW1lLCBlbGltaW5hdGVkQ29udGFjdC5uaWNrbmFtZSwgXCIsIFwiKVxuXHRrZXB0Q29udGFjdC5yb2xlID0gbmV2ZXJOdWxsKF9nZXRNZXJnZWRPdGhlckZpZWxkKGtlcHRDb250YWN0LnJvbGUsIGVsaW1pbmF0ZWRDb250YWN0LnJvbGUsIFwiLCBcIikpXG5cdGtlcHRDb250YWN0LmJpcnRoZGF5SXNvID0gX2dldE1lcmdlZEJpcnRoZGF5cyhrZXB0Q29udGFjdC5iaXJ0aGRheUlzbywgZWxpbWluYXRlZENvbnRhY3QuYmlydGhkYXlJc28pXG5cdGtlcHRDb250YWN0Lm1haWxBZGRyZXNzZXMgPSBfZ2V0TWVyZ2VkRW1haWxBZGRyZXNzZXMoa2VwdENvbnRhY3QubWFpbEFkZHJlc3NlcywgZWxpbWluYXRlZENvbnRhY3QubWFpbEFkZHJlc3Nlcylcblx0a2VwdENvbnRhY3QucGhvbmVOdW1iZXJzID0gX2dldE1lcmdlZFBob25lTnVtYmVycyhrZXB0Q29udGFjdC5waG9uZU51bWJlcnMsIGVsaW1pbmF0ZWRDb250YWN0LnBob25lTnVtYmVycylcblx0a2VwdENvbnRhY3Quc29jaWFsSWRzID0gX2dldE1lcmdlZFNvY2lhbElkcyhrZXB0Q29udGFjdC5zb2NpYWxJZHMsIGVsaW1pbmF0ZWRDb250YWN0LnNvY2lhbElkcylcblx0a2VwdENvbnRhY3QuYWRkcmVzc2VzID0gX2dldE1lcmdlZEFkZHJlc3NlcyhrZXB0Q29udGFjdC5hZGRyZXNzZXMsIGVsaW1pbmF0ZWRDb250YWN0LmFkZHJlc3Nlcylcblx0a2VwdENvbnRhY3QucHJlc2hhcmVkUGFzc3dvcmQgPSBuZXZlck51bGwoX2dldE1lcmdlZE90aGVyRmllbGQoa2VwdENvbnRhY3QucHJlc2hhcmVkUGFzc3dvcmQsIGVsaW1pbmF0ZWRDb250YWN0LnByZXNoYXJlZFBhc3N3b3JkLCBcIlwiKSkgLy8gdGhlIHBhc3N3b3JkcyBhcmUgbmV2ZXIgZGlmZmVyZW50IGFuZCBub3QgbnVsbFxufVxuXG4vKipcbiAqIFJlc3VsdCBpcyB1bmlxdWUgaWYgcHJlc2hhcmVkIHBhc3N3b3JkcyBhcmUgbm90IGVxdWFsIGFuZCBhcmUgbm90IGVtcHR5LlxuICogUmVzdWx0IGlzIGVxdWFsIGlmIGFsbCBmaWVsZHMgYXJlIGVxdWFsIG9yIGVtcHR5ICh0eXBlcyBhcmUgaWdub3JlZCkuXG4gKiBSZXN1bHQgaXMgc2ltaWxhciBpZiBvbmUgb2Y6XG4gKiAxLiBuYW1lIHJlc3VsdCBpcyBlcXVhbCBvciBzaW1pbGFyIGFuZCBiaXJ0aGRheSByZXN1bHQgaXMgc2ltaWxhciBvciBvbmVFbXB0eSBvciBlcXVhbCBvciBib3RoRW1wdHlcbiAqIDIuIG5hbWUgcmVzdWx0IChib3RoRW1wdHkgb3Igb25lRW1wdHkpIGFuZCBtYWlsIG9yIHBob25lIHJlc3VsdCBpcyBzaW1pbGFyIG9yIGVxdWFsIGFuZCBiaXJ0aGRheSByZXN1bHQgaXMgc2ltaWxhciBvciBvbmVFbXB0eSBvciBlcXVhbCBvciBib3RoRW1wdHlcbiAqIE90aGVyd2lzZSB0aGUgcmVzdWx0IGlzIHVuaXF1ZVxuICogRXhwb3J0IGZvciB0ZXN0aW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfY29tcGFyZUNvbnRhY3RzRm9yTWVyZ2UoY29udGFjdDE6IENvbnRhY3QsIGNvbnRhY3QyOiBDb250YWN0KTogQ29udGFjdENvbXBhcmlzb25SZXN1bHQge1xuXHRsZXQgbmFtZVJlc3VsdCA9IF9jb21wYXJlRnVsbE5hbWUoY29udGFjdDEsIGNvbnRhY3QyKVxuXG5cdGxldCBtYWlsUmVzdWx0ID0gX2NvbXBhcmVNYWlsQWRkcmVzc2VzKGNvbnRhY3QxLm1haWxBZGRyZXNzZXMsIGNvbnRhY3QyLm1haWxBZGRyZXNzZXMpXG5cblx0bGV0IHBob25lUmVzdWx0ID0gX2NvbXBhcmVQaG9uZU51bWJlcnMoY29udGFjdDEucGhvbmVOdW1iZXJzLCBjb250YWN0Mi5waG9uZU51bWJlcnMpXG5cblx0bGV0IGJpcnRoZGF5UmVzdWx0ID0gX2NvbXBhcmVCaXJ0aGRheXMoY29udGFjdDEsIGNvbnRhY3QyKVxuXG5cdGxldCByZXNpZHVhbENvbnRhY3RGaWVsZHNFcXVhbCA9IF9hcmVSZXNpZHVhbENvbnRhY3RGaWVsZHNFcXVhbChjb250YWN0MSwgY29udGFjdDIpXG5cblx0aWYgKFxuXHRcdGJpcnRoZGF5UmVzdWx0ICE9PSBDb250YWN0Q29tcGFyaXNvblJlc3VsdC5VbmlxdWUgJiZcblx0XHQoIWNvbnRhY3QxLnByZXNoYXJlZFBhc3N3b3JkIHx8ICFjb250YWN0Mi5wcmVzaGFyZWRQYXNzd29yZCB8fCBjb250YWN0MS5wcmVzaGFyZWRQYXNzd29yZCA9PT0gY29udGFjdDIucHJlc2hhcmVkUGFzc3dvcmQpXG5cdCkge1xuXHRcdGlmIChcblx0XHRcdChuYW1lUmVzdWx0ID09PSBDb250YWN0Q29tcGFyaXNvblJlc3VsdC5FcXVhbCB8fCBuYW1lUmVzdWx0ID09PSBJbmRpZmZlcmVudENvbnRhY3RDb21wYXJpc29uUmVzdWx0LkJvdGhFbXB0eSkgJiZcblx0XHRcdChtYWlsUmVzdWx0ID09PSBDb250YWN0Q29tcGFyaXNvblJlc3VsdC5FcXVhbCB8fCBtYWlsUmVzdWx0ID09PSBJbmRpZmZlcmVudENvbnRhY3RDb21wYXJpc29uUmVzdWx0LkJvdGhFbXB0eSkgJiZcblx0XHRcdChwaG9uZVJlc3VsdCA9PT0gQ29udGFjdENvbXBhcmlzb25SZXN1bHQuRXF1YWwgfHwgcGhvbmVSZXN1bHQgPT09IEluZGlmZmVyZW50Q29udGFjdENvbXBhcmlzb25SZXN1bHQuQm90aEVtcHR5KSAmJlxuXHRcdFx0cmVzaWR1YWxDb250YWN0RmllbGRzRXF1YWxcblx0XHQpIHtcblx0XHRcdGlmIChiaXJ0aGRheVJlc3VsdCA9PT0gSW5kaWZmZXJlbnRDb250YWN0Q29tcGFyaXNvblJlc3VsdC5Cb3RoRW1wdHkgfHwgYmlydGhkYXlSZXN1bHQgPT09IENvbnRhY3RDb21wYXJpc29uUmVzdWx0LkVxdWFsKSB7XG5cdFx0XHRcdHJldHVybiBDb250YWN0Q29tcGFyaXNvblJlc3VsdC5FcXVhbFxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIENvbnRhY3RDb21wYXJpc29uUmVzdWx0LlNpbWlsYXJcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKG5hbWVSZXN1bHQgPT09IENvbnRhY3RDb21wYXJpc29uUmVzdWx0LkVxdWFsIHx8IG5hbWVSZXN1bHQgPT09IENvbnRhY3RDb21wYXJpc29uUmVzdWx0LlNpbWlsYXIpIHtcblx0XHRcdHJldHVybiBDb250YWN0Q29tcGFyaXNvblJlc3VsdC5TaW1pbGFyXG5cdFx0fSBlbHNlIGlmIChcblx0XHRcdChuYW1lUmVzdWx0ID09PSBJbmRpZmZlcmVudENvbnRhY3RDb21wYXJpc29uUmVzdWx0LkJvdGhFbXB0eSB8fCBuYW1lUmVzdWx0ID09PSBJbmRpZmZlcmVudENvbnRhY3RDb21wYXJpc29uUmVzdWx0Lk9uZUVtcHR5KSAmJlxuXHRcdFx0KG1haWxSZXN1bHQgPT09IENvbnRhY3RDb21wYXJpc29uUmVzdWx0LlNpbWlsYXIgfHxcblx0XHRcdFx0cGhvbmVSZXN1bHQgPT09IENvbnRhY3RDb21wYXJpc29uUmVzdWx0LlNpbWlsYXIgfHxcblx0XHRcdFx0bWFpbFJlc3VsdCA9PT0gQ29udGFjdENvbXBhcmlzb25SZXN1bHQuRXF1YWwgfHxcblx0XHRcdFx0cGhvbmVSZXN1bHQgPT09IENvbnRhY3RDb21wYXJpc29uUmVzdWx0LkVxdWFsKVxuXHRcdCkge1xuXHRcdFx0cmV0dXJuIENvbnRhY3RDb21wYXJpc29uUmVzdWx0LlNpbWlsYXJcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIENvbnRhY3RDb21wYXJpc29uUmVzdWx0LlVuaXF1ZVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gQ29udGFjdENvbXBhcmlzb25SZXN1bHQuVW5pcXVlXG5cdH1cbn1cblxuLyoqXG4gKiBOYW1lcyBhcmUgZXF1YWwgaWYgdGhlIGxhc3QgbmFtZXMgYXJlIGF2YWlsYWJsZSBhbmQgZXF1YWwgYW5kIGZpcnN0IG5hbWVzIGFyZSBlcXVhbCBvciBmaXJzdCBuYW1lcyBhcmUgYXZhaWxhYmxlIGFuZCBlcXVhbCBhbmQgbGFzdCBuYW1lcyBhcmUgZXF1YWwuXG4gKiBOYW1lcyBhcmUgc2ltaWxhciBpZiB0aGUgbGFzdCBuYW1lcyBhcmUgYXZhaWxhYmxlIGFuZCBlcXVhbCBhbmQgYXQgbGVhc3Qgb25lIGZpcnN0IG5hbWUgaXMgZW1wdHkgb3IgbGlrZSBlcXVhbCBidXQgY2FzZSBpbnNlbnNpdGl2ZS5cbiAqIFJldHVybnMgbnVsbCBpZiB0aGUgY29udGFjdHMgbmFtZXMgYXJlIG5vdCBjb21wYXJhYmxlLCBpLmUuIG9uZSBvZiB0aGUgY29udGFjdHMgZmlyc3QgYW5kIGxhc3QgbmFtZXMgYXJlIGVtcHR5LlxuICogRXhwb3J0IGZvciB0ZXN0aW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfY29tcGFyZUZ1bGxOYW1lKGNvbnRhY3QxOiBDb250YWN0LCBjb250YWN0MjogQ29udGFjdCk6IENvbnRhY3RDb21wYXJpc29uUmVzdWx0IHwgSW5kaWZmZXJlbnRDb250YWN0Q29tcGFyaXNvblJlc3VsdCB7XG5cdGlmIChjb250YWN0MS5maXJzdE5hbWUgPT09IGNvbnRhY3QyLmZpcnN0TmFtZSAmJiBjb250YWN0MS5sYXN0TmFtZSA9PT0gY29udGFjdDIubGFzdE5hbWUgJiYgKGNvbnRhY3QxLmxhc3ROYW1lIHx8IGNvbnRhY3QxLmZpcnN0TmFtZSkpIHtcblx0XHRyZXR1cm4gQ29udGFjdENvbXBhcmlzb25SZXN1bHQuRXF1YWxcblx0fSBlbHNlIGlmICghY29udGFjdDEuZmlyc3ROYW1lICYmICFjb250YWN0MS5sYXN0TmFtZSAmJiAhY29udGFjdDIuZmlyc3ROYW1lICYmICFjb250YWN0Mi5sYXN0TmFtZSkge1xuXHRcdHJldHVybiBJbmRpZmZlcmVudENvbnRhY3RDb21wYXJpc29uUmVzdWx0LkJvdGhFbXB0eVxuXHR9IGVsc2UgaWYgKCghY29udGFjdDEuZmlyc3ROYW1lICYmICFjb250YWN0MS5sYXN0TmFtZSkgfHwgKCFjb250YWN0Mi5maXJzdE5hbWUgJiYgIWNvbnRhY3QyLmxhc3ROYW1lKSkge1xuXHRcdHJldHVybiBJbmRpZmZlcmVudENvbnRhY3RDb21wYXJpc29uUmVzdWx0Lk9uZUVtcHR5XG5cdH0gZWxzZSBpZiAoXG5cdFx0Y29udGFjdDEuZmlyc3ROYW1lLnRvTG93ZXJDYXNlKCkgPT09IGNvbnRhY3QyLmZpcnN0TmFtZS50b0xvd2VyQ2FzZSgpICYmXG5cdFx0Y29udGFjdDEubGFzdE5hbWUudG9Mb3dlckNhc2UoKSA9PT0gY29udGFjdDIubGFzdE5hbWUudG9Mb3dlckNhc2UoKSAmJlxuXHRcdGNvbnRhY3QxLmxhc3ROYW1lXG5cdCkge1xuXHRcdHJldHVybiBDb250YWN0Q29tcGFyaXNvblJlc3VsdC5TaW1pbGFyXG5cdH0gZWxzZSBpZiAoKCFjb250YWN0MS5maXJzdE5hbWUgfHwgIWNvbnRhY3QyLmZpcnN0TmFtZSkgJiYgY29udGFjdDEubGFzdE5hbWUudG9Mb3dlckNhc2UoKSA9PT0gY29udGFjdDIubGFzdE5hbWUudG9Mb3dlckNhc2UoKSAmJiBjb250YWN0MS5sYXN0TmFtZSkge1xuXHRcdHJldHVybiBDb250YWN0Q29tcGFyaXNvblJlc3VsdC5TaW1pbGFyXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIENvbnRhY3RDb21wYXJpc29uUmVzdWx0LlVuaXF1ZVxuXHR9XG59XG5cbi8qKlxuICogUHJvdmlkZXMgbmFtZTEgaWYgaXQgaXMgbm90IGVtcHR5LCBvdGhlcndpc2UgbmFtZTJcbiAqIEV4cG9ydCBmb3IgdGVzdGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gX2dldE1lcmdlZE5hbWVGaWVsZChuYW1lMTogc3RyaW5nLCBuYW1lMjogc3RyaW5nKTogc3RyaW5nIHtcblx0aWYgKG5hbWUxKSB7XG5cdFx0cmV0dXJuIG5hbWUxXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIG5hbWUyXG5cdH1cbn1cblxuLyoqXG4gKiBJZiB0aGUgbWFpbCBhZGRyZXNzZXMgKHR5cGUgaXMgaWdub3JlZCkgYXJlIGFsbCBlcXVhbCAob3JkZXIgaW4gYXJyYXkgaXMgaWdub3JlZCksIHRoZSBhZGRyZXNzZXMgYXJlIGVxdWFsLlxuICogSWYgYXQgbGVhc3Qgb25lIG1haWwgYWRkcmVzcyBpcyBlcXVhbCBhbmQgYWxsIG90aGVycyBhcmUgdW5pcXVlLCB0aGUgcmVzdWx0IGlzIHNpbWlsYXIuIElmIHRoZSBtYWlsIGFkZHJlc3NlcyBhcmUgZXF1YWwgKG9ubHkgY2FzZSBpbnNlbnNpdGl2ZSksIHRoZW4gdGhlIHJlc3VsdCBpcyBhbHNvIHNpbWlsYXIuXG4gKiBJZiBvbmUgbWFpbCBhZGRyZXNzIGxpc3QgaXMgZW1wdHksIHRoZSByZXN1bHQgaXMgb25lRW1wdHkgYmVjYXVzZSB0aGUgbWFpbCBhZGRyZXNzZXMgYXJlIG5vdCBjb21wYXJhYmxlLlxuICogSWYgYm90aCBhcmUgZW1wdHkgdGhlIHJlc3VsdCBpcyBib3RoIGVtcHR5IGJlY2F1c2UgdGhlIG1haWwgYWRkcmVzc2VzIGFyZSBub3QgY29tcGFyYWJsZS5cbiAqIE90aGVyd2lzZSB0aGUgcmVzdWx0IGlzIHVuaXF1ZS5cbiAqIEV4cG9ydCBmb3IgdGVzdGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gX2NvbXBhcmVNYWlsQWRkcmVzc2VzKFxuXHRjb250YWN0MU1haWxBZGRyZXNzZXM6IENvbnRhY3RNYWlsQWRkcmVzc1tdLFxuXHRjb250YWN0Mk1haWxBZGRyZXNzZXM6IENvbnRhY3RNYWlsQWRkcmVzc1tdLFxuKTogQ29udGFjdENvbXBhcmlzb25SZXN1bHQgfCBJbmRpZmZlcmVudENvbnRhY3RDb21wYXJpc29uUmVzdWx0IHtcblx0cmV0dXJuIF9jb21wYXJlVmFsdWVzKFxuXHRcdGNvbnRhY3QxTWFpbEFkZHJlc3Nlcy5tYXAoKG0pID0+IG0uYWRkcmVzcyksXG5cdFx0Y29udGFjdDJNYWlsQWRkcmVzc2VzLm1hcCgobSkgPT4gbS5hZGRyZXNzKSxcblx0KVxufVxuXG4vKipcbiAqIEV4cG9ydCBmb3IgdGVzdGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gX2dldE1lcmdlZEVtYWlsQWRkcmVzc2VzKG1haWxBZGRyZXNzZXMxOiBDb250YWN0TWFpbEFkZHJlc3NbXSwgbWFpbEFkZHJlc3NlczI6IENvbnRhY3RNYWlsQWRkcmVzc1tdKTogQ29udGFjdE1haWxBZGRyZXNzW10ge1xuXHRsZXQgZmlsdGVyZWRNYWlsQWRkcmVzc2VzMiA9IG1haWxBZGRyZXNzZXMyLmZpbHRlcigobWEyKSA9PiB7XG5cdFx0cmV0dXJuICFtYWlsQWRkcmVzc2VzMS5zb21lKChtYTEpID0+IG1hMS5hZGRyZXNzLnRvTG93ZXJDYXNlKCkgPT09IG1hMi5hZGRyZXNzLnRvTG93ZXJDYXNlKCkpXG5cdH0pXG5cdHJldHVybiBtYWlsQWRkcmVzc2VzMS5jb25jYXQoZmlsdGVyZWRNYWlsQWRkcmVzc2VzMilcbn1cblxuLyoqXG4gKiBFeHBvcnQgZm9yIHRlc3RpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9jb21wYXJlUGhvbmVOdW1iZXJzKFxuXHRjb250YWN0MVBob25lTnVtYmVyczogQ29udGFjdFBob25lTnVtYmVyW10sXG5cdGNvbnRhY3QyUGhvbmVOdW1iZXJzOiBDb250YWN0UGhvbmVOdW1iZXJbXSxcbik6IENvbnRhY3RDb21wYXJpc29uUmVzdWx0IHwgSW5kaWZmZXJlbnRDb250YWN0Q29tcGFyaXNvblJlc3VsdCB7XG5cdHJldHVybiBfY29tcGFyZVZhbHVlcyhcblx0XHRjb250YWN0MVBob25lTnVtYmVycy5tYXAoKG0pID0+IG0ubnVtYmVyKSxcblx0XHRjb250YWN0MlBob25lTnVtYmVycy5tYXAoKG0pID0+IG0ubnVtYmVyKSxcblx0KVxufVxuXG4vKipcbiAqIEV4cG9ydCBmb3IgdGVzdGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gX2dldE1lcmdlZFBob25lTnVtYmVycyhwaG9uZU51bWJlcnMxOiBDb250YWN0UGhvbmVOdW1iZXJbXSwgcGhvbmVOdW1iZXJzMjogQ29udGFjdFBob25lTnVtYmVyW10pOiBDb250YWN0UGhvbmVOdW1iZXJbXSB7XG5cdGxldCBmaWx0ZXJlZE51bWJlcnMyID0gcGhvbmVOdW1iZXJzMi5maWx0ZXIoKG1hMikgPT4ge1xuXHRcdGNvbnN0IGlzSW5jbHVkZWRJblBob25lTnVtYmVyczEgPSBwaG9uZU51bWJlcnMxLmZpbmQoKG1hMSkgPT4gbWExLm51bWJlci5yZXBsYWNlKC9cXHMvZywgXCJcIikgPT09IG1hMi5udW1iZXIucmVwbGFjZSgvXFxzL2csIFwiXCIpKVxuXHRcdHJldHVybiAhaXNJbmNsdWRlZEluUGhvbmVOdW1iZXJzMVxuXHR9KVxuXHRyZXR1cm4gcGhvbmVOdW1iZXJzMS5jb25jYXQoZmlsdGVyZWROdW1iZXJzMilcbn1cblxuLyoqXG4gKiB1c2VkIGZvciBjbGFyaWZ5aW5nIG9mIHRoZSB1bmlxdWUgYW5kIGVxdWFsIGNhc2VzIGluIGNvbXBhcmVDb250YWN0c1xuICogRXhwb3J0IGZvciB0ZXN0aW5nXG4gKiByZXR1cm5zIHNpbWlsYXIgb25seSBpZiBzb2NpYWxpZHMgb3JlIGFkZHJlc3NlcyBhcmUgc2ltaWxhci4gUmV0dXJuIG9mIHNpbWlsYXIgaXMgYmFzaWNhbHkgbm90IG5lZWRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gX2FyZVJlc2lkdWFsQ29udGFjdEZpZWxkc0VxdWFsKGNvbnRhY3QxOiBDb250YWN0LCBjb250YWN0MjogQ29udGFjdCk6IGJvb2xlYW4ge1xuXHRyZXR1cm4gKFxuXHRcdF9pc0VxdWFsT3RoZXJGaWVsZChjb250YWN0MS5jb21tZW50LCBjb250YWN0Mi5jb21tZW50KSAmJlxuXHRcdF9pc0VxdWFsT3RoZXJGaWVsZChjb250YWN0MS5jb21wYW55LCBjb250YWN0Mi5jb21wYW55KSAmJlxuXHRcdF9pc0VxdWFsT3RoZXJGaWVsZChjb250YWN0MS5uaWNrbmFtZSwgY29udGFjdDIubmlja25hbWUpICYmXG5cdFx0X2lzRXF1YWxPdGhlckZpZWxkKGNvbnRhY3QxLnJvbGUsIGNvbnRhY3QyLnJvbGUpICYmXG5cdFx0X2lzRXF1YWxPdGhlckZpZWxkKGNvbnRhY3QxLnRpdGxlLCBjb250YWN0Mi50aXRsZSkgJiZcblx0XHRfaXNFcXVhbE90aGVyRmllbGQoY29udGFjdDEucHJlc2hhcmVkUGFzc3dvcmQsIGNvbnRhY3QyLnByZXNoYXJlZFBhc3N3b3JkKSAmJlxuXHRcdF9hcmVTb2NpYWxJZHNFcXVhbChjb250YWN0MS5zb2NpYWxJZHMsIGNvbnRhY3QyLnNvY2lhbElkcykgJiZcblx0XHRfYXJlQWRkcmVzc2VzRXF1YWwoY29udGFjdDEuYWRkcmVzc2VzLCBjb250YWN0Mi5hZGRyZXNzZXMpXG5cdClcbn1cblxuZnVuY3Rpb24gX2FyZVNvY2lhbElkc0VxdWFsKGNvbnRhY3QxU29jaWFsSWRzOiBDb250YWN0U29jaWFsSWRbXSwgY29udGFjdDJTb2NpYWxJZHM6IENvbnRhY3RTb2NpYWxJZFtdKTogYm9vbGVhbiB7XG5cdGxldCByZXN1bHQgPSBfY29tcGFyZVZhbHVlcyhcblx0XHRjb250YWN0MVNvY2lhbElkcy5tYXAoKG0pID0+IG0uc29jaWFsSWQpLFxuXHRcdGNvbnRhY3QyU29jaWFsSWRzLm1hcCgobSkgPT4gbS5zb2NpYWxJZCksXG5cdClcblxuXHRyZXR1cm4gcmVzdWx0ID09PSBJbmRpZmZlcmVudENvbnRhY3RDb21wYXJpc29uUmVzdWx0LkJvdGhFbXB0eSB8fCByZXN1bHQgPT09IENvbnRhY3RDb21wYXJpc29uUmVzdWx0LkVxdWFsXG59XG5cbi8qKlxuICogRXhwb3J0IGZvciB0ZXN0aW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0TWVyZ2VkU29jaWFsSWRzKHNvY2lhbElkczE6IENvbnRhY3RTb2NpYWxJZFtdLCBzb2NpYWxJZHMyOiBDb250YWN0U29jaWFsSWRbXSk6IENvbnRhY3RTb2NpYWxJZFtdIHtcblx0bGV0IGZpbHRlcmVkU29jaWFsSWRzMiA9IHNvY2lhbElkczIuZmlsdGVyKChtYTIpID0+IHtcblx0XHRyZXR1cm4gIXNvY2lhbElkczEuc29tZSgobWExKSA9PiBtYTEuc29jaWFsSWQgPT09IG1hMi5zb2NpYWxJZClcblx0fSlcblx0cmV0dXJuIHNvY2lhbElkczEuY29uY2F0KGZpbHRlcmVkU29jaWFsSWRzMilcbn1cblxuZnVuY3Rpb24gX2FyZUFkZHJlc3Nlc0VxdWFsKGNvbnRhY3QxQWRkcmVzc2VzOiBDb250YWN0QWRkcmVzc1tdLCBjb250YWN0MkFkZHJlc3NlczogQ29udGFjdEFkZHJlc3NbXSk6IGJvb2xlYW4ge1xuXHRsZXQgcmVzdWx0ID0gX2NvbXBhcmVWYWx1ZXMoXG5cdFx0Y29udGFjdDFBZGRyZXNzZXMubWFwKChtKSA9PiBtLmFkZHJlc3MpLFxuXHRcdGNvbnRhY3QyQWRkcmVzc2VzLm1hcCgobSkgPT4gbS5hZGRyZXNzKSxcblx0KVxuXG5cdHJldHVybiByZXN1bHQgPT09IEluZGlmZmVyZW50Q29udGFjdENvbXBhcmlzb25SZXN1bHQuQm90aEVtcHR5IHx8IHJlc3VsdCA9PT0gQ29udGFjdENvbXBhcmlzb25SZXN1bHQuRXF1YWxcbn1cblxuLyoqXG4gKiBFeHBvcnQgZm9yIHRlc3RpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9nZXRNZXJnZWRBZGRyZXNzZXMoYWRkcmVzc2VzMTogQ29udGFjdEFkZHJlc3NbXSwgYWRkcmVzc2VzMjogQ29udGFjdEFkZHJlc3NbXSk6IENvbnRhY3RBZGRyZXNzW10ge1xuXHRsZXQgZmlsdGVyZWRBZGRyZXNzZXMyID0gYWRkcmVzc2VzMi5maWx0ZXIoKG1hMikgPT4ge1xuXHRcdHJldHVybiAhYWRkcmVzc2VzMS5zb21lKChtYTEpID0+IG1hMS5hZGRyZXNzID09PSBtYTIuYWRkcmVzcylcblx0fSlcblx0cmV0dXJuIGFkZHJlc3NlczEuY29uY2F0KGZpbHRlcmVkQWRkcmVzc2VzMilcbn1cblxuLyoqXG4gKiBFeHBvcnQgZm9yIHRlc3RpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9jb21wYXJlQmlydGhkYXlzKGNvbnRhY3QxOiBDb250YWN0LCBjb250YWN0MjogQ29udGFjdCk6IENvbnRhY3RDb21wYXJpc29uUmVzdWx0IHwgSW5kaWZmZXJlbnRDb250YWN0Q29tcGFyaXNvblJlc3VsdCB7XG5cdGNvbnN0IGIxID0gX2NvbnZlcnRJc29CaXJ0aGRheShjb250YWN0MS5iaXJ0aGRheUlzbylcblxuXHRjb25zdCBiMiA9IF9jb252ZXJ0SXNvQmlydGhkYXkoY29udGFjdDIuYmlydGhkYXlJc28pXG5cblx0aWYgKGIxICYmIGIyKSB7XG5cdFx0aWYgKGIxLmRheSA9PT0gYjIuZGF5ICYmIGIxLm1vbnRoID09PSBiMi5tb250aCkge1xuXHRcdFx0aWYgKGIxLnllYXIgPT09IGIyLnllYXIpIHtcblx0XHRcdFx0cmV0dXJuIENvbnRhY3RDb21wYXJpc29uUmVzdWx0LkVxdWFsXG5cdFx0XHR9IGVsc2UgaWYgKGIxLnllYXIgJiYgYjIueWVhciAmJiBiMS55ZWFyICE9PSBiMi55ZWFyKSB7XG5cdFx0XHRcdC8vIGlmIHdlIGRldGVjdCB0aGF0IG9uZSBiaXJ0aGRheSBoYXMgbW9yZSBpbmZvcm1hdGlvbiAoeWVhcikgd2UgdXNlIHRoYXQgZGF0ZVxuXHRcdFx0XHRyZXR1cm4gQ29udGFjdENvbXBhcmlzb25SZXN1bHQuVW5pcXVlXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gQ29udGFjdENvbXBhcmlzb25SZXN1bHQuU2ltaWxhclxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gQ29udGFjdENvbXBhcmlzb25SZXN1bHQuVW5pcXVlXG5cdFx0fVxuXHR9IGVsc2UgaWYgKChjb250YWN0MS5iaXJ0aGRheUlzbyAmJiAhY29udGFjdDIuYmlydGhkYXlJc28pIHx8ICghY29udGFjdDEuYmlydGhkYXlJc28gJiYgY29udGFjdDIuYmlydGhkYXlJc28pKSB7XG5cdFx0cmV0dXJuIEluZGlmZmVyZW50Q29udGFjdENvbXBhcmlzb25SZXN1bHQuT25lRW1wdHlcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gSW5kaWZmZXJlbnRDb250YWN0Q29tcGFyaXNvblJlc3VsdC5Cb3RoRW1wdHlcblx0fVxufVxuXG5mdW5jdGlvbiBfY29udmVydElzb0JpcnRoZGF5KGlzb0JpcnRoZGF5OiBzdHJpbmcgfCBudWxsKTogQmlydGhkYXkgfCBudWxsIHtcblx0aWYgKGlzb0JpcnRoZGF5KSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBpc29EYXRlVG9CaXJ0aGRheShpc29CaXJ0aGRheSlcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcImZhaWxlZCB0byBwYXJzZSBiaXJ0aGRheVwiLCBlKVxuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIG51bGxcblx0fVxufVxuXG5mdW5jdGlvbiBfY29tcGFyZVZhbHVlcyh2YWx1ZXMxOiBzdHJpbmdbXSwgdmFsdWVzMjogc3RyaW5nW10pOiBDb250YWN0Q29tcGFyaXNvblJlc3VsdCB8IEluZGlmZmVyZW50Q29udGFjdENvbXBhcmlzb25SZXN1bHQge1xuXHRpZiAodmFsdWVzMS5sZW5ndGggPT09IDAgJiYgdmFsdWVzMi5sZW5ndGggPT09IDApIHtcblx0XHRyZXR1cm4gSW5kaWZmZXJlbnRDb250YWN0Q29tcGFyaXNvblJlc3VsdC5Cb3RoRW1wdHlcblx0fSBlbHNlIGlmICh2YWx1ZXMxLmxlbmd0aCA9PT0gMCB8fCB2YWx1ZXMyLmxlbmd0aCA9PT0gMCkge1xuXHRcdHJldHVybiBJbmRpZmZlcmVudENvbnRhY3RDb21wYXJpc29uUmVzdWx0Lk9uZUVtcHR5XG5cdH1cblxuXHRsZXQgZXF1YWxBZGRyZXNzZXMgPSB2YWx1ZXMyLmZpbHRlcigoYzIpID0+IHZhbHVlczEuZmluZCgoYzEpID0+IGMxLnRyaW0oKSA9PT0gYzIudHJpbSgpKSlcblxuXHRpZiAodmFsdWVzMS5sZW5ndGggPT09IHZhbHVlczIubGVuZ3RoICYmIHZhbHVlczEubGVuZ3RoID09PSBlcXVhbEFkZHJlc3Nlcy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gQ29udGFjdENvbXBhcmlzb25SZXN1bHQuRXF1YWxcblx0fVxuXG5cdGxldCBlcXVhbEFkZHJlc3Nlc0luc2Vuc2l0aXZlID0gdmFsdWVzMi5maWx0ZXIoKGMyKSA9PiB2YWx1ZXMxLmZpbmQoKGMxKSA9PiBjMS50cmltKCkudG9Mb3dlckNhc2UoKSA9PT0gYzIudHJpbSgpLnRvTG93ZXJDYXNlKCkpKVxuXG5cdGlmIChlcXVhbEFkZHJlc3Nlc0luc2Vuc2l0aXZlLmxlbmd0aCA+IDApIHtcblx0XHRyZXR1cm4gQ29udGFjdENvbXBhcmlzb25SZXN1bHQuU2ltaWxhclxuXHR9XG5cblx0cmV0dXJuIENvbnRhY3RDb21wYXJpc29uUmVzdWx0LlVuaXF1ZVxufVxuXG4vKipcbiAqIFJldHVybnMgZXF1YWwgaWYgYm90aCB2YWx1ZXMgYXJlIGVxdWFsIGFuZCB1bmlxdWUgb3RoZXJ3aXNlXG4gKi9cbmZ1bmN0aW9uIF9pc0VxdWFsT3RoZXJGaWVsZChvdGhlckF0dHJpYnV0ZTE6IHN0cmluZyB8IG51bGwsIG90aGVyQXR0cmlidXRlMjogc3RyaW5nIHwgbnVsbCk6IGJvb2xlYW4ge1xuXHQvLyByZWdhcmQgbnVsbCBhcyBcIlwiXG5cdGlmIChvdGhlckF0dHJpYnV0ZTEgPT0gbnVsbCkge1xuXHRcdG90aGVyQXR0cmlidXRlMSA9IFwiXCJcblx0fVxuXG5cdGlmIChvdGhlckF0dHJpYnV0ZTIgPT0gbnVsbCkge1xuXHRcdG90aGVyQXR0cmlidXRlMiA9IFwiXCJcblx0fVxuXG5cdHJldHVybiBvdGhlckF0dHJpYnV0ZTEgPT09IG90aGVyQXR0cmlidXRlMlxufVxuXG4vKipcbiAqIFByb3ZpZGVzIHRoZSB2YWx1ZSB0aGF0IGV4aXN0cyBvciBib3RoIHNlcGFyYXRlZCBieSB0aGUgZ2l2ZW4gc2VwYXJhdG9yIGlmIGJvdGggaGF2ZSBzb21lIGNvbnRlbnRcbiAqIEV4cG9ydCBmb3IgdGVzdGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gX2dldE1lcmdlZE90aGVyRmllbGQob3RoZXJBdHRyaWJ1dGUxOiBzdHJpbmcgfCBudWxsLCBvdGhlckF0dHJpYnV0ZTI6IHN0cmluZyB8IG51bGwsIHNlcGFyYXRvcjogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG5cdGlmIChvdGhlckF0dHJpYnV0ZTEgPT09IG90aGVyQXR0cmlidXRlMikge1xuXHRcdHJldHVybiBvdGhlckF0dHJpYnV0ZTJcblx0fSBlbHNlIGlmIChvdGhlckF0dHJpYnV0ZTEgJiYgb3RoZXJBdHRyaWJ1dGUyKSB7XG5cdFx0cmV0dXJuIG90aGVyQXR0cmlidXRlMSArIHNlcGFyYXRvciArIG90aGVyQXR0cmlidXRlMlxuXHR9IGVsc2UgaWYgKCFvdGhlckF0dHJpYnV0ZTEgJiYgb3RoZXJBdHRyaWJ1dGUyKSB7XG5cdFx0cmV0dXJuIG90aGVyQXR0cmlidXRlMlxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBvdGhlckF0dHJpYnV0ZTFcblx0fVxufVxuXG4vKipcbiAqIEV4cG9ydCBmb3IgdGVzdGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gX2dldE1lcmdlZEJpcnRoZGF5cyhiaXJ0aGRheTE6IHN0cmluZyB8IG51bGwsIGJpcnRoZGF5Mjogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB8IG51bGwge1xuXHRjb25zdCBiMSA9IF9jb252ZXJ0SXNvQmlydGhkYXkoYmlydGhkYXkxKVxuXG5cdGNvbnN0IGIyID0gX2NvbnZlcnRJc29CaXJ0aGRheShiaXJ0aGRheTIpXG5cblx0aWYgKGIxICYmIGIyKSB7XG5cdFx0aWYgKGIxLnllYXIpIHtcblx0XHRcdHJldHVybiBiaXJ0aGRheTFcblx0XHR9IGVsc2UgaWYgKGIyLnllYXIpIHtcblx0XHRcdHJldHVybiBiaXJ0aGRheTJcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGJpcnRoZGF5MVxuXHRcdH1cblx0fSBlbHNlIGlmIChiaXJ0aGRheTEpIHtcblx0XHRyZXR1cm4gYmlydGhkYXkxXG5cdH0gZWxzZSBpZiAoYmlydGhkYXkyKSB7XG5cdFx0cmV0dXJuIGJpcnRoZGF5MlxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBudWxsXG5cdH1cbn1cbiIsImltcG9ydCB7IGNvbnZlcnRUb0RhdGFGaWxlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0RhdGFGaWxlXCJcbmltcG9ydCB0eXBlIHsgQ29udGFjdCwgQ29udGFjdEFkZHJlc3MsIENvbnRhY3RNYWlsQWRkcmVzcywgQ29udGFjdFBob25lTnVtYmVyLCBDb250YWN0U29jaWFsSWQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBjcmVhdGVGaWxlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgc3RyaW5nVG9VdGY4VWludDhBcnJheSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgQ29udGFjdEFkZHJlc3NUeXBlLCBDb250YWN0UGhvbmVOdW1iZXJUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3JcIlxuaW1wb3J0IHsgZ2V0U29jaWFsVXJsLCBnZXRXZWJzaXRlVXJsIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9jb250YWN0c0Z1bmN0aW9uYWxpdHkvQ29udGFjdFV0aWxzLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbmV4cG9ydCBmdW5jdGlvbiBleHBvcnRDb250YWN0cyhjb250YWN0czogQ29udGFjdFtdKTogUHJvbWlzZTx2b2lkPiB7XG5cdGxldCB2Q2FyZEZpbGUgPSBjb250YWN0c1RvVkNhcmQoY29udGFjdHMpXG5cdGxldCBkYXRhID0gc3RyaW5nVG9VdGY4VWludDhBcnJheSh2Q2FyZEZpbGUpXG5cdGxldCB0bXBGaWxlID0gY3JlYXRlRmlsZSh7XG5cdFx0bmFtZTogXCJ2Q2FyZDMuMC52Y2ZcIixcblx0XHRtaW1lVHlwZTogXCJ2Q2FyZC9yZmMyNDI2XCIsXG5cdFx0c2l6ZTogU3RyaW5nKGRhdGEuYnl0ZUxlbmd0aCksXG5cdFx0YmxvYnM6IFtdLFxuXHRcdGNpZDogbnVsbCxcblx0XHRwYXJlbnQ6IG51bGwsXG5cdFx0c3ViRmlsZXM6IG51bGwsXG5cdH0pXG5cdHJldHVybiBsb2NhdG9yLmZpbGVDb250cm9sbGVyLnNhdmVEYXRhRmlsZShjb252ZXJ0VG9EYXRhRmlsZSh0bXBGaWxlLCBkYXRhKSlcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhbiBhcnJheSBvZiBjb250YWN0cyB0byBhIHZDYXJkIDMuMCBjb21wYXRpYmxlIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gY29udGFjdHNcbiAqIEByZXR1cm5zIHZDYXJkIDMuMCBjb21wYXRpYmxlIHN0cmluZyB3aGljaCBpcyB0aGUgdkNhcmQgb2YgZWFjaCBhbGwgY29udGFjdHMgY29uY2F0YW50ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWN0c1RvVkNhcmQoY29udGFjdHM6IENvbnRhY3RbXSk6IHN0cmluZyB7XG5cdGxldCB2Q2FyZEZpbGUgPSBcIlwiXG5cdGZvciAoY29uc3QgY29udGFjdCBvZiBjb250YWN0cykge1xuXHRcdHZDYXJkRmlsZSArPSBfY29udGFjdFRvVkNhcmQoY29udGFjdClcblx0fVxuXHRyZXR1cm4gdkNhcmRGaWxlXG59XG5cbi8qKlxuICogRXhwb3J0IGZvciB0ZXN0aW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfY29udGFjdFRvVkNhcmQoY29udGFjdDogQ29udGFjdCk6IHN0cmluZyB7XG5cdGxldCBjb250YWN0VG9WQ2FyZFN0cmluZyA9IFwiQkVHSU46VkNBUkRcXG5WRVJTSU9OOjMuMFxcblwiIC8vbXVzdCBiZSBpbnZjbHVkZWQgaW4gdkNhcmQzLjBcblxuXHQvL0ZOIHRhZyBtdXN0IGJlIGluY2x1ZGVkIGluIHZDYXJkMy4wXG5cdGxldCBmblN0cmluZyA9IFwiRk46XCJcblx0Zm5TdHJpbmcgKz0gY29udGFjdC50aXRsZSA/IF9nZXRWQ2FyZEVzY2FwZWQoY29udGFjdC50aXRsZSkgKyBcIiBcIiA6IFwiXCJcblx0Zm5TdHJpbmcgKz0gY29udGFjdC5maXJzdE5hbWUgPyBfZ2V0VkNhcmRFc2NhcGVkKGNvbnRhY3QuZmlyc3ROYW1lKSArIFwiIFwiIDogXCJcIlxuXHRmblN0cmluZyArPSBjb250YWN0Lm1pZGRsZU5hbWUgPyBfZ2V0VkNhcmRFc2NhcGVkKGNvbnRhY3QubWlkZGxlTmFtZSkgKyBcIiBcIiA6IFwiXCJcblx0Zm5TdHJpbmcgKz0gY29udGFjdC5sYXN0TmFtZSA/IF9nZXRWQ2FyZEVzY2FwZWQoY29udGFjdC5sYXN0TmFtZSkgOiBcIlwiXG5cdGZuU3RyaW5nICs9IGNvbnRhY3QubmFtZVN1ZmZpeCA/IFwiLCBcIiArIF9nZXRWQ2FyZEVzY2FwZWQoY29udGFjdC5uYW1lU3VmZml4KSA6IFwiXCJcblx0Y29udGFjdFRvVkNhcmRTdHJpbmcgKz0gX2dldEZvbGRlZFN0cmluZyhmblN0cmluZy50cmltKCkpICsgXCJcXG5cIlxuXHQvL04gdGFnIG11c3QgYmUgaW5jbHVkZWQgaW4gdkNhcmQzLjBcblx0bGV0IG5TdHJpbmcgPSBcIk46XCJcblx0blN0cmluZyArPSBjb250YWN0Lmxhc3ROYW1lID8gX2dldFZDYXJkRXNjYXBlZChjb250YWN0Lmxhc3ROYW1lKSArIFwiO1wiIDogXCI7XCJcblx0blN0cmluZyArPSBjb250YWN0LmZpcnN0TmFtZSA/IF9nZXRWQ2FyZEVzY2FwZWQoY29udGFjdC5maXJzdE5hbWUpICsgXCI7XCIgOiBcIjtcIlxuXHRuU3RyaW5nICs9IGNvbnRhY3QubWlkZGxlTmFtZSA/IF9nZXRWQ2FyZEVzY2FwZWQoY29udGFjdC5taWRkbGVOYW1lKSArIFwiO1wiIDogXCI7XCJcblx0blN0cmluZyArPSBjb250YWN0LnRpdGxlID8gX2dldFZDYXJkRXNjYXBlZChjb250YWN0LnRpdGxlKSArIFwiO1wiIDogXCI7XCJcblx0blN0cmluZyArPSBjb250YWN0Lm5hbWVTdWZmaXggPyBfZ2V0VkNhcmRFc2NhcGVkKGNvbnRhY3QubmFtZVN1ZmZpeCkgKyBcIlwiIDogXCJcIlxuXHRjb250YWN0VG9WQ2FyZFN0cmluZyArPSBfZ2V0Rm9sZGVkU3RyaW5nKG5TdHJpbmcpICsgXCJcXG5cIlxuXHRjb250YWN0VG9WQ2FyZFN0cmluZyArPSBjb250YWN0Lm5pY2tuYW1lID8gX2dldEZvbGRlZFN0cmluZyhcIk5JQ0tOQU1FOlwiICsgX2dldFZDYXJkRXNjYXBlZChjb250YWN0Lm5pY2tuYW1lKSkgKyBcIlxcblwiIDogXCJcIlxuXG5cdC8vYWRkcyBvbGRCaXJ0aGRheSBjb252ZXJ0ZWQgaW50byBhIHN0cmluZyBpZiBwcmVzZW50IGVsc2UgaWYgYXZhaWxhYmxlIG5ldyBiaXJ0aGRheSBmb3JtYXQgaXMgYWRkZWQgdG8gY29udGFjdFRvVkNhcmRTdHJpbmdcblx0aWYgKGNvbnRhY3QuYmlydGhkYXlJc28pIHtcblx0XHRjb25zdCBiZGF5ID0gY29udGFjdC5iaXJ0aGRheUlzb1xuXHRcdC8vIHdlIHVzZSAxMTExIGFzIG1hcmtlciBpZiBubyB5ZWFyIGhhcyBiZWVuIGRlZmluZWQgYXMgdmNhcmQgMy4wIGRvZXMgbm90IHN1cHBvcnQgZGF0ZXMgd2l0aG91dCB5ZWFyXG5cdFx0Ly8gdmNhcmQgNC4wIHN1cHBvcnRzIGlzbyBkYXRlIHdpdGhvdXQgeWVhclxuXHRcdGNvbnN0IGJkYXlFeHBvcnRlZCA9IGJkYXkuc3RhcnRzV2l0aChcIi0tXCIpID8gYmRheS5yZXBsYWNlKFwiLS1cIiwgXCIxMTExLVwiKSA6IGJkYXlcblx0XHRjb250YWN0VG9WQ2FyZFN0cmluZyArPSBcIkJEQVk6XCIgKyBiZGF5RXhwb3J0ZWQgKyBcIlxcblwiXG5cdH1cblxuXHRjb250YWN0VG9WQ2FyZFN0cmluZyArPSBfdkNhcmRGb3JtYXRBcnJheVRvU3RyaW5nKF9hZGRyZXNzZXNUb1ZDYXJkQWRkcmVzc2VzKGNvbnRhY3QuYWRkcmVzc2VzKSwgXCJBRFJcIilcblx0Y29udGFjdFRvVkNhcmRTdHJpbmcgKz0gX3ZDYXJkRm9ybWF0QXJyYXlUb1N0cmluZyhfYWRkcmVzc2VzVG9WQ2FyZEFkZHJlc3Nlcyhjb250YWN0Lm1haWxBZGRyZXNzZXMpLCBcIkVNQUlMXCIpXG5cdGNvbnRhY3RUb1ZDYXJkU3RyaW5nICs9IF92Q2FyZEZvcm1hdEFycmF5VG9TdHJpbmcoX3Bob25lTnVtYmVyc1RvVkNhcmRQaG9uZU51bWJlcnMoY29udGFjdC5waG9uZU51bWJlcnMpLCBcIlRFTFwiKVxuXHRjb250YWN0VG9WQ2FyZFN0cmluZyArPSBfdkNhcmRGb3JtYXRBcnJheVRvU3RyaW5nKF9zb2NpYWxJZHNUb1ZDYXJkU29jaWFsVXJscyhjb250YWN0LnNvY2lhbElkcyksIFwiVVJMXCIpXG5cdGNvbnRhY3RUb1ZDYXJkU3RyaW5nICs9IGNvbnRhY3Qucm9sZSAhPSBcIlwiID8gX2dldEZvbGRlZFN0cmluZyhcIlRJVExFOlwiICsgX2dldFZDYXJkRXNjYXBlZChjb250YWN0LnJvbGUpKSArIFwiXFxuXCIgOiBcIlwiXG5cblx0Y29udGFjdC53ZWJzaXRlcy5tYXAoKHdlYnNpdGUpID0+IHtcblx0XHRjb250YWN0VG9WQ2FyZFN0cmluZyArPSBfZ2V0Rm9sZGVkU3RyaW5nKFwiVVJMOlwiICsgZ2V0V2Vic2l0ZVVybCh3ZWJzaXRlLnVybCkgKyBcIlxcblwiKVxuXHR9KVxuXG5cdGNvbnN0IGNvbXBhbnkgPSBjb250YWN0LmNvbXBhbnkgPyBfZ2V0Rm9sZGVkU3RyaW5nKFwiT1JHOlwiICsgX2dldFZDYXJkRXNjYXBlZChjb250YWN0LmNvbXBhbnkpKSA6IFwiXCJcblx0aWYgKGNvbnRhY3QuZGVwYXJ0bWVudCkge1xuXHRcdGNvbnRhY3RUb1ZDYXJkU3RyaW5nICs9IGNvbXBhbnkgKyBcIjtcIiArIF9nZXRWQ2FyZEVzY2FwZWQoY29udGFjdC5kZXBhcnRtZW50KSArIFwiXFxuXCJcblx0fSBlbHNlIHtcblx0XHRjb250YWN0VG9WQ2FyZFN0cmluZyArPSBjb250YWN0LmNvbXBhbnkgPyBfZ2V0Rm9sZGVkU3RyaW5nKFwiT1JHOlwiICsgX2dldFZDYXJkRXNjYXBlZChjb250YWN0LmNvbXBhbnkpKSArIFwiXFxuXCIgOiBcIlwiXG5cdH1cblxuXHRjb250YWN0VG9WQ2FyZFN0cmluZyArPSBjb250YWN0LmNvbW1lbnQgPyBfZ2V0Rm9sZGVkU3RyaW5nKFwiTk9URTpcIiArIF9nZXRWQ2FyZEVzY2FwZWQoY29udGFjdC5jb21tZW50KSkgKyBcIlxcblwiIDogXCJcIlxuXHRjb250YWN0VG9WQ2FyZFN0cmluZyArPSBcIkVORDpWQ0FSRFxcblxcblwiIC8vbXVzdCBiZSBpbmNsdWRlZCBpbiB2Q2FyZDMuMFxuXG5cdHJldHVybiBjb250YWN0VG9WQ2FyZFN0cmluZ1xufVxuXG4vKipcbiAqIGV4cG9ydCBmb3IgdGVzdGluZ1xuICogV29ya3MgZm9yIG1haWwgYWRkcmVzc2VzIHRoZSBzYW1lIGFzIGZvciBhZGRyZXNzZXNcbiAqIFJldHVybnMgYWxsIG1haWwtYWRkcmVzc2VzL2FkZHJlc3NlcyBhbmQgdGhlaXIgdHlwZXMgaW4gYW4gb2JqZWN0IGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfYWRkcmVzc2VzVG9WQ2FyZEFkZHJlc3NlcyhhZGRyZXNzZXM6IENvbnRhY3RNYWlsQWRkcmVzc1tdIHwgQ29udGFjdEFkZHJlc3NbXSk6IHtcblx0S0lORDogc3RyaW5nXG5cdENPTlRFTlQ6IHN0cmluZ1xufVtdIHtcblx0cmV0dXJuIGFkZHJlc3Nlcy5tYXAoKGFkKSA9PiB7XG5cdFx0bGV0IGtpbmQgPSBcIlwiXG5cblx0XHRzd2l0Y2ggKGFkLnR5cGUpIHtcblx0XHRcdGNhc2UgQ29udGFjdEFkZHJlc3NUeXBlLlBSSVZBVEU6XG5cdFx0XHRcdGtpbmQgPSBcImhvbWVcIlxuXHRcdFx0XHRicmVha1xuXG5cdFx0XHRjYXNlIENvbnRhY3RBZGRyZXNzVHlwZS5XT1JLOlxuXHRcdFx0XHRraW5kID0gXCJ3b3JrXCJcblx0XHRcdFx0YnJlYWtcblxuXHRcdFx0ZGVmYXVsdDpcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0S0lORDoga2luZCxcblx0XHRcdENPTlRFTlQ6IGFkLmFkZHJlc3MsXG5cdFx0fVxuXHR9KVxufVxuXG4vKipcbiAqIGV4cG9ydCBmb3IgdGVzdGluZ1xuICogUmV0dXJucyBhbGwgcGhvbmUgbnVtYmVycyBhbmQgdGhlaXIgdHlwZXMgaW4gYW4gb2JqZWN0IGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfcGhvbmVOdW1iZXJzVG9WQ2FyZFBob25lTnVtYmVycyhudW1iZXJzOiBDb250YWN0UGhvbmVOdW1iZXJbXSk6IHtcblx0S0lORDogc3RyaW5nXG5cdENPTlRFTlQ6IHN0cmluZ1xufVtdIHtcblx0cmV0dXJuIG51bWJlcnMubWFwKChudW0pID0+IHtcblx0XHRsZXQga2luZCA9IFwiXCJcblxuXHRcdHN3aXRjaCAobnVtLnR5cGUpIHtcblx0XHRcdGNhc2UgQ29udGFjdFBob25lTnVtYmVyVHlwZS5QUklWQVRFOlxuXHRcdFx0XHRraW5kID0gXCJob21lXCJcblx0XHRcdFx0YnJlYWtcblxuXHRcdFx0Y2FzZSBDb250YWN0UGhvbmVOdW1iZXJUeXBlLldPUks6XG5cdFx0XHRcdGtpbmQgPSBcIndvcmtcIlxuXHRcdFx0XHRicmVha1xuXG5cdFx0XHRjYXNlIENvbnRhY3RQaG9uZU51bWJlclR5cGUuTU9CSUxFOlxuXHRcdFx0XHRraW5kID0gXCJjZWxsXCJcblx0XHRcdFx0YnJlYWtcblxuXHRcdFx0Y2FzZSBDb250YWN0UGhvbmVOdW1iZXJUeXBlLkZBWDpcblx0XHRcdFx0a2luZCA9IFwiZmF4XCJcblx0XHRcdFx0YnJlYWtcblxuXHRcdFx0ZGVmYXVsdDpcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0S0lORDoga2luZCxcblx0XHRcdENPTlRFTlQ6IG51bS5udW1iZXIsXG5cdFx0fVxuXHR9KVxufVxuXG4vKipcbiAqICBleHBvcnQgZm9yIHRlc3RpbmdcbiAqICBSZXR1cm5zIGFsbCBzb2NpYWxJZHMgYXMgYSB2Q2FyZCBVcmwgaW4gYW4gb2JqZWN0IGFycmF5XG4gKiAgVHlwZSBpcyBub3QgZGVmaW5lZCBoZXJlLiBVUkwgdGFnIGhhcyBubyBmaXR0aW5nIHR5cGUgaW1wbGVtZW50YXRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9zb2NpYWxJZHNUb1ZDYXJkU29jaWFsVXJscyhzb2NpYWxJZHM6IENvbnRhY3RTb2NpYWxJZFtdKToge1xuXHRLSU5EOiBzdHJpbmdcblx0Q09OVEVOVDogc3RyaW5nXG59W10ge1xuXHRyZXR1cm4gc29jaWFsSWRzLm1hcCgoc0lkKSA9PiB7XG5cdFx0Ly9JTiBWQ0FSRCAzLjAgaXMgbm8gdHlwZSBmb3IgVVJMU1xuXHRcdHJldHVybiB7XG5cdFx0XHRLSU5EOiBcIlwiLFxuXHRcdFx0Q09OVEVOVDogZ2V0U29jaWFsVXJsKHNJZCksXG5cdFx0fVxuXHR9KVxufVxuXG4vKipcbiAqIGV4cG9ydCBmb3IgdGVzdGluZ1xuICogUmV0dXJucyBhIG11bHRpcGxlIGxpbmUgc3RyaW5nIGZyb20gdGhlIGJlZm9yZSBjcmVhdGVkIG9iamVjdCBhcnJheXMgb2YgYWRkcmVzc2VzLCBtYWlsIGFkZHJlc3NlcyBhbmQgc29jaWFsSWRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfdkNhcmRGb3JtYXRBcnJheVRvU3RyaW5nKFxuXHR0eXBlQW5kQ29udGVudEFycmF5OiB7XG5cdFx0S0lORDogc3RyaW5nXG5cdFx0Q09OVEVOVDogc3RyaW5nXG5cdH1bXSxcblx0dGFnQ29udGVudDogc3RyaW5nLFxuKTogc3RyaW5nIHtcblx0cmV0dXJuIHR5cGVBbmRDb250ZW50QXJyYXkucmVkdWNlKChyZXN1bHQsIGVsZW0pID0+IHtcblx0XHRpZiAoZWxlbS5LSU5EKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0ICsgX2dldEZvbGRlZFN0cmluZyh0YWdDb250ZW50ICsgXCI7VFlQRT1cIiArIGVsZW0uS0lORCArIFwiOlwiICsgX2dldFZDYXJkRXNjYXBlZChlbGVtLkNPTlRFTlQpKSArIFwiXFxuXCJcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHJlc3VsdCArIF9nZXRGb2xkZWRTdHJpbmcodGFnQ29udGVudCArIFwiOlwiICsgX2dldFZDYXJkRXNjYXBlZChlbGVtLkNPTlRFTlQpKSArIFwiXFxuXCJcblx0XHR9XG5cdH0sIFwiXCIpXG59XG5cbi8qKlxuICogQWRkcyBsaW5lIGJyZWFrcyBhbmQgcGFkZGluZyBpbiBhIENPTlRFTlQgbGluZSB0byBhZGhlcmUgdG8gdGhlIHZDYXJkXG4gKiBzcGVjaWZpY2F0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBmb2xkLlxuICogQHJldHVybnMgVGhlIHNhbWUgdGV4dCBidXQgZm9sZGVkIGV2ZXJ5IDc1IGNoYXJhY3RlcnMuXG4gKiBAc2VlIGh0dHBzOi8vZGF0YXRyYWNrZXIuaWV0Zi5vcmcvZG9jL2h0bWwvcmZjNjM1MCNzZWN0aW9uLTMuMlxuICovXG5mdW5jdGlvbiBfZ2V0Rm9sZGVkU3RyaW5nKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG5cdGxldCBzZXBhcmF0ZUxpbmVzQXJyYXk6IHN0cmluZ1tdID0gW11cblxuXHR3aGlsZSAodGV4dC5sZW5ndGggPiA3NSkge1xuXHRcdHNlcGFyYXRlTGluZXNBcnJheS5wdXNoKHRleHQuc3Vic3RyaW5nKDAsIDc1KSlcblx0XHR0ZXh0ID0gdGV4dC5zdWJzdHJpbmcoNzUsIHRleHQubGVuZ3RoKVxuXHR9XG5cblx0c2VwYXJhdGVMaW5lc0FycmF5LnB1c2godGV4dClcblx0dGV4dCA9IHNlcGFyYXRlTGluZXNBcnJheS5qb2luKFwiXFxuIFwiKVxuXHRyZXR1cm4gdGV4dFxufVxuXG5mdW5jdGlvbiBfZ2V0VkNhcmRFc2NhcGVkKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG5cdGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL1xcbi9nLCBcIlxcXFxuXCIpXG5cdGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoLzsvZywgXCJcXFxcO1wiKVxuXHRjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC8sL2csIFwiXFxcXCxcIilcblx0cmV0dXJuIGNvbnRlbnRcbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiwgSWNvbkJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4vYmFzZS9JY29uQnV0dG9uLmpzXCJcbmltcG9ydCB7IENsaWNrSGFuZGxlciB9IGZyb20gXCIuL2Jhc2UvR3VpVXRpbHMuanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIE1vYmlsZUFjdGlvbkF0dHJzIHtcblx0aWNvbjogSWNvbkJ1dHRvbkF0dHJzW1wiaWNvblwiXVxuXHR0aXRsZTogSWNvbkJ1dHRvbkF0dHJzW1widGl0bGVcIl1cblx0YWN0aW9uOiBDbGlja0hhbmRsZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNb2JpbGVBY3Rpb25CYXJBdHRycyB7XG5cdGFjdGlvbnM6IEFycmF5PE1vYmlsZUFjdGlvbkF0dHJzPlxufVxuXG4vKiogVG9vbGJhciB3aXRoIG9wdGlvbmFsIGRlbGV0ZSAmIGVkaXQgYWN0aW9ucyBhdCB0aGUgYm90dG9tIG9mIHNpbmdsZS1jb2x1bW4gbGF5b3V0LiAqL1xuZXhwb3J0IGNsYXNzIE1vYmlsZUFjdGlvbkJhciBpbXBsZW1lbnRzIENvbXBvbmVudDxNb2JpbGVBY3Rpb25CYXJBdHRycz4ge1xuXHR2aWV3KHZub2RlOiBWbm9kZTxNb2JpbGVBY3Rpb25CYXJBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgeyBhdHRycyB9ID0gdm5vZGVcblxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIuYm90dG9tLW5hdi5ib3R0b20tYWN0aW9uLWJhci5mbGV4Lml0ZW1zLWNlbnRlci5wbHItbFwiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdGp1c3RpZnlDb250ZW50OiBcInNwYWNlLWFyb3VuZFwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdGF0dHJzLmFjdGlvbnMubWFwKChhY3Rpb24pID0+XG5cdFx0XHRcdG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdHRpdGxlOiBhY3Rpb24udGl0bGUsXG5cdFx0XHRcdFx0aWNvbjogYWN0aW9uLmljb24sXG5cdFx0XHRcdFx0Y2xpY2s6IGFjdGlvbi5hY3Rpb24sXG5cdFx0XHRcdH0pLFxuXHRcdFx0KSxcblx0XHQpXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlLCBWbm9kZURPTSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IENvbnRhY3QgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBJY29uQnV0dG9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uQnV0dG9uLmpzXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29ucy5qc1wiXG5pbXBvcnQgeyBrZXlNYW5hZ2VyLCBTaG9ydGN1dCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9LZXlNYW5hZ2VyLmpzXCJcbmltcG9ydCB7IEtleXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIENvbnRhY3RWaWV3VG9vbGJhckF0dHJzIHtcblx0Y29udGFjdHM6IENvbnRhY3RbXVxuXHRvbkVkaXQ6IChjb250YWN0OiBDb250YWN0KSA9PiB1bmtub3duXG5cdG9uRGVsZXRlOiAoY29udGFjdHM6IENvbnRhY3RbXSkgPT4gdW5rbm93blxuXHRvbk1lcmdlOiAobGVmdDogQ29udGFjdCwgcmlnaHQ6IENvbnRhY3QpID0+IHVua25vd25cblx0b25FeHBvcnQ6IChjb250YWN0czogQ29udGFjdFtdKSA9PiB1bmtub3duXG59XG5cbi8qKlxuICogRGlzcGxheXMgYWN0aW9ucyBmb3IgY29udGFjdCBvciBtdWx0aXBsZSBjb250YWN0cy5cbiAqIEFsc28gcmVnaXN0ZXJzIHNob3J0Y3V0c1xuICovXG5leHBvcnQgY2xhc3MgQ29udGFjdFZpZXdlckFjdGlvbnMgaW1wbGVtZW50cyBDb21wb25lbnQ8Q29udGFjdFZpZXdUb29sYmFyQXR0cnM+IHtcblx0cHJpdmF0ZSBzaG9ydGN1dHM6IEFycmF5PFNob3J0Y3V0PiA9IFtdXG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPENvbnRhY3RWaWV3VG9vbGJhckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IGNvbnRhY3RzLCBvbkRlbGV0ZSwgb25FZGl0LCBvbk1lcmdlLCBvbkV4cG9ydCB9ID0gYXR0cnNcblx0XHRjb25zdCBhY3Rpb25CdXR0b25zOiBDaGlsZHJlbltdID0gW11cblx0XHRpZiAodGhpcy5jYW5FZGl0KGNvbnRhY3RzKSkge1xuXHRcdFx0YWN0aW9uQnV0dG9ucy5wdXNoKFxuXHRcdFx0XHRtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHR0aXRsZTogXCJlZGl0X2FjdGlvblwiLFxuXHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBvbkVkaXQoY29udGFjdHNbMF0pLFxuXHRcdFx0XHRcdGljb246IEljb25zLkVkaXQsXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdH0gZWxzZSBpZiAodGhpcy5jYW5NZXJnZShjb250YWN0cykpIHtcblx0XHRcdGFjdGlvbkJ1dHRvbnMucHVzaChcblx0XHRcdFx0bShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0dGl0bGU6IFwibWVyZ2VfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IG9uTWVyZ2UoY29udGFjdHNbMF0sIGNvbnRhY3RzWzFdKSxcblx0XHRcdFx0XHRpY29uOiBJY29ucy5QZW9wbGUsXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdH1cblxuXHRcdGlmICh0aGlzLmNhbkV4cG9ydChjb250YWN0cykpIHtcblx0XHRcdGFjdGlvbkJ1dHRvbnMucHVzaChcblx0XHRcdFx0bShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0dGl0bGU6IFwiZXhwb3J0X2FjdGlvblwiLFxuXHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBvbkV4cG9ydChjb250YWN0cyksXG5cdFx0XHRcdFx0aWNvbjogSWNvbnMuRXhwb3J0LFxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHR9XG5cdFx0aWYgKHRoaXMuY2FuRGVsZXRlKGNvbnRhY3RzKSkge1xuXHRcdFx0YWN0aW9uQnV0dG9ucy5wdXNoKFxuXHRcdFx0XHRtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHR0aXRsZTogXCJkZWxldGVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IG9uRGVsZXRlKGNvbnRhY3RzKSxcblx0XHRcdFx0XHRpY29uOiBJY29ucy5UcmFzaCxcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0fVxuXHRcdHJldHVybiBhY3Rpb25CdXR0b25zXG5cdH1cblxuXHRvbnVwZGF0ZSh2bm9kZTogVm5vZGVET008Q29udGFjdFZpZXdUb29sYmFyQXR0cnM+KSB7XG5cdFx0a2V5TWFuYWdlci51bnJlZ2lzdGVyU2hvcnRjdXRzKHRoaXMuc2hvcnRjdXRzKVxuXHRcdHRoaXMuc2hvcnRjdXRzLmxlbmd0aCA9IDBcblx0XHRjb25zdCB7IGNvbnRhY3RzLCBvbkVkaXQsIG9uRGVsZXRlLCBvbk1lcmdlLCBvbkV4cG9ydCB9ID0gdm5vZGUuYXR0cnNcblx0XHRpZiAodGhpcy5jYW5FZGl0KGNvbnRhY3RzKSkge1xuXHRcdFx0dGhpcy5zaG9ydGN1dHMucHVzaCh7XG5cdFx0XHRcdGtleTogS2V5cy5FLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0b25FZGl0KGNvbnRhY3RzWzBdKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRoZWxwOiBcImVkaXRfYWN0aW9uXCIsXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdGlmICh0aGlzLmNhbk1lcmdlKGNvbnRhY3RzKSkge1xuXHRcdFx0dGhpcy5zaG9ydGN1dHMucHVzaCh7XG5cdFx0XHRcdGtleTogS2V5cy5NLFxuXHRcdFx0XHRjdHJsT3JDbWQ6IHRydWUsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHRvbk1lcmdlKGNvbnRhY3RzWzBdLCBjb250YWN0c1sxXSlcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJtZXJnZV9hY3Rpb25cIixcblx0XHRcdH0pXG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuY2FuRXhwb3J0KGNvbnRhY3RzKSkge1xuXHRcdFx0dGhpcy5zaG9ydGN1dHMucHVzaCh7XG5cdFx0XHRcdGtleTogS2V5cy5FLFxuXHRcdFx0XHRjdHJsT3JDbWQ6IHRydWUsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHRvbkV4cG9ydChjb250YWN0cylcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJleHBvcnRfYWN0aW9uXCIsXG5cdFx0XHR9KVxuXHRcdH1cblx0XHRrZXlNYW5hZ2VyLnJlZ2lzdGVyU2hvcnRjdXRzKHRoaXMuc2hvcnRjdXRzKVxuXHR9XG5cblx0b25yZW1vdmUoKSB7XG5cdFx0a2V5TWFuYWdlci51bnJlZ2lzdGVyU2hvcnRjdXRzKHRoaXMuc2hvcnRjdXRzKVxuXHR9XG5cblx0cHJpdmF0ZSBjYW5FeHBvcnQoY29udGFjdHM6IENvbnRhY3RbXSkge1xuXHRcdHJldHVybiBjb250YWN0cy5sZW5ndGggPiAwXG5cdH1cblxuXHRwcml2YXRlIGNhbk1lcmdlKGNvbnRhY3RzOiBDb250YWN0W10pIHtcblx0XHRyZXR1cm4gY29udGFjdHMubGVuZ3RoID09PSAyXG5cdH1cblxuXHRwcml2YXRlIGNhbkRlbGV0ZShjb250YWN0czogQ29udGFjdFtdKSB7XG5cdFx0cmV0dXJuIGNvbnRhY3RzLmxlbmd0aCA+IDBcblx0fVxuXG5cdHByaXZhdGUgY2FuRWRpdChjb250YWN0czogQ29udGFjdFtdKSB7XG5cdFx0cmV0dXJuIGNvbnRhY3RzLmxlbmd0aCA9PT0gMVxuXHR9XG59XG4iLCJpbXBvcnQgeyBzaG93RmlsZUNob29zZXIsIHNob3dOYXRpdmVGaWxlUGlja2VyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9maWxlL0ZpbGVDb250cm9sbGVyLmpzXCJcbmltcG9ydCB7IHV0ZjhVaW50OEFycmF5VG9TdHJpbmcgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IHNob3dQcm9ncmVzc0RpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2cuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZy5qc1wiXG5pbXBvcnQgeyBDb250YWN0TW9kZWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NvbnRhY3RzRnVuY3Rpb25hbGl0eS9Db250YWN0TW9kZWwuanNcIlxuaW1wb3J0IHsgQ29udGFjdFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBleHBvcnRDb250YWN0cyB9IGZyb20gXCIuLi9WQ2FyZEV4cG9ydGVyLmpzXCJcbmltcG9ydCB7IG1haWxMb2NhdG9yIH0gZnJvbSBcIi4uLy4uL21haWxMb2NhdG9yLmpzXCJcbmltcG9ydCB7IGlzQXBwIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0Vudi5qc1wiXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRBc1ZDYXJkKCkge1xuXHRjb25zdCBhbGxvd2VkRXh0ZW5zaW9ucyA9IFtcInZjZlwiXVxuXHRjb25zdCBjb250YWN0RmlsZXMgPSBpc0FwcCgpID8gYXdhaXQgc2hvd05hdGl2ZUZpbGVQaWNrZXIoYWxsb3dlZEV4dGVuc2lvbnMsIHRydWUpIDogYXdhaXQgc2hvd0ZpbGVDaG9vc2VyKHRydWUsIGFsbG93ZWRFeHRlbnNpb25zKVxuXHRpZiAoY29udGFjdEZpbGVzLmxlbmd0aCA8PSAwKSByZXR1cm5cblx0cmV0dXJuIHNob3dQcm9ncmVzc0RpYWxvZyhcblx0XHRcInBsZWFzZVdhaXRfbXNnXCIsXG5cdFx0KGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGNvbnRhY3RJbXBvcnRlciA9IGF3YWl0IG1haWxMb2NhdG9yLmNvbnRhY3RJbXBvcnRlcigpXG5cdFx0XHRjb25zdCBjb250YWN0TGlzdElkID0gYXdhaXQgbG9jYXRvci5jb250YWN0TW9kZWwuZ2V0Q29udGFjdExpc3RJZCgpXG5cdFx0XHQvLyBJZiBtdWx0aXBsZSB2Q2FyZCBmaWxlcyB3aGVyZSBzZWxlY3RlZCwgY29tYmluZSB0aGUgZGF0YSB3aXRoaW4gdGhlbVxuXHRcdFx0Y29uc3QgdkNhcmRMaXN0ID0gY29udGFjdEZpbGVzLmZsYXRNYXAoKGNvbnRhY3RGaWxlKSA9PiB7XG5cdFx0XHRcdHJldHVybiB1dGY4VWludDhBcnJheVRvU3RyaW5nKGNvbnRhY3RGaWxlLmRhdGEpXG5cdFx0XHR9KVxuXHRcdFx0YXdhaXQgY29udGFjdEltcG9ydGVyLmltcG9ydENvbnRhY3RzRnJvbUZpbGUodkNhcmRMaXN0LCBjb250YWN0TGlzdElkISlcblx0XHR9KSgpLFxuXHQpXG59XG5cbi8qKlxuICpDcmVhdGVzIGEgdkNhcmQgZmlsZSB3aXRoIGFsbCBjb250YWN0cyBpZiBhdCBsZWFzdCBvbmUgY29udGFjdCBleGlzdHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4cG9ydEFzVkNhcmQoY29udGFjdE1vZGVsOiBDb250YWN0TW9kZWwpOiBQcm9taXNlPHZvaWQ+IHtcblx0cmV0dXJuIHNob3dQcm9ncmVzc0RpYWxvZyhcblx0XHRcInBsZWFzZVdhaXRfbXNnXCIsXG5cdFx0Y29udGFjdE1vZGVsLmdldENvbnRhY3RMaXN0SWQoKS50aGVuKChjb250YWN0TGlzdElkKSA9PiB7XG5cdFx0XHRpZiAoIWNvbnRhY3RMaXN0SWQpIHJldHVybiAwXG5cdFx0XHRyZXR1cm4gbG9jYXRvci5lbnRpdHlDbGllbnQubG9hZEFsbChDb250YWN0VHlwZVJlZiwgY29udGFjdExpc3RJZCkudGhlbigoYWxsQ29udGFjdHMpID0+IHtcblx0XHRcdFx0aWYgKGFsbENvbnRhY3RzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdHJldHVybiAwXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIGV4cG9ydENvbnRhY3RzKGFsbENvbnRhY3RzKS50aGVuKCgpID0+IGFsbENvbnRhY3RzLmxlbmd0aClcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9KSxcblx0KS50aGVuKChuYnJPZkNvbnRhY3RzKSA9PiB7XG5cdFx0aWYgKG5ick9mQ29udGFjdHMgPT09IDApIHtcblx0XHRcdERpYWxvZy5tZXNzYWdlKFwibm9Db250YWN0c19tc2dcIilcblx0XHR9XG5cdH0pXG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IExpc3RDb2x1bW5XcmFwcGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvTGlzdENvbHVtbldyYXBwZXIuanNcIlxuaW1wb3J0IENvbHVtbkVtcHR5TWVzc2FnZUJveCBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0NvbHVtbkVtcHR5TWVzc2FnZUJveC5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lLmpzXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29ucy5qc1wiXG5pbXBvcnQgeyBMaXN0LCBNdWx0aXNlbGVjdE1vZGUsIFJlbmRlckNvbmZpZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTGlzdC5qc1wiXG5pbXBvcnQgeyBDb250YWN0TGlzdEVudHJ5IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgbm9PcCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgQ29udGFjdExpc3RWaWV3TW9kZWwgfSBmcm9tIFwiLi9Db250YWN0TGlzdFZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBWaXJ0dWFsUm93IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9MaXN0VXRpbHMuanNcIlxuaW1wb3J0IHtcblx0Y2hlY2tib3hPcGFjaXR5LFxuXHRzY2FsZVhIaWRlLFxuXHRzY2FsZVhTaG93LFxuXHRzZWxlY3RhYmxlUm93QW5pbVBhcmFtcyxcblx0U2VsZWN0YWJsZVJvd0NvbnRhaW5lcixcblx0U2VsZWN0YWJsZVJvd1NlbGVjdGVkU2V0dGVyLFxuXHRzaG91bGRBbHdheXNTaG93TXVsdGlzZWxlY3RDaGVja2JveCxcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvU2VsZWN0YWJsZVJvd0NvbnRhaW5lci5qc1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemUuanNcIlxuaW1wb3J0IHsgc2hpZnRCeUZvckNoZWNrYm94LCB0cmFuc2xhdGVYSGlkZSwgdHJhbnNsYXRlWFNob3cgfSBmcm9tIFwiLi9Db250YWN0Um93LmpzXCJcbmltcG9ydCB7IHN0eWxlcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3N0eWxlcy5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbnRhY3RMaXN0Vmlld0F0dHJzIHtcblx0dmlld01vZGVsOiBDb250YWN0TGlzdFZpZXdNb2RlbFxuXHRmb2N1c0RldGFpbHNWaWV3ZXI6ICgpID0+IHVua25vd25cbn1cblxuZXhwb3J0IGNsYXNzIENvbnRhY3RMaXN0UmVjaXBpZW50VmlldyBpbXBsZW1lbnRzIENvbXBvbmVudDxDb250YWN0TGlzdFZpZXdBdHRycz4ge1xuXHRwcml2YXRlIHZpZXdNb2RlbDogQ29udGFjdExpc3RWaWV3TW9kZWwgfCBudWxsID0gbnVsbFxuXG5cdHZpZXcoeyBhdHRyczogeyB2aWV3TW9kZWwsIGZvY3VzRGV0YWlsc1ZpZXdlciB9IH06IFZub2RlPENvbnRhY3RMaXN0Vmlld0F0dHJzPik6IENoaWxkcmVuIHtcblx0XHR0aGlzLnZpZXdNb2RlbCA9IHZpZXdNb2RlbFxuXG5cdFx0Y29uc3QgbGlzdE1vZGVsID0gdGhpcy52aWV3TW9kZWwubGlzdE1vZGVsXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRMaXN0Q29sdW1uV3JhcHBlcixcblx0XHRcdHtcblx0XHRcdFx0aGVhZGVyQ29udGVudDogbnVsbCxcblx0XHRcdH0sXG5cdFx0XHRsaXN0TW9kZWwgPT0gbnVsbCB8fCBsaXN0TW9kZWwuaXNFbXB0eUFuZERvbmUoKVxuXHRcdFx0XHQ/IG0oQ29sdW1uRW1wdHlNZXNzYWdlQm94LCB7XG5cdFx0XHRcdFx0XHRjb2xvcjogdGhlbWUubGlzdF9tZXNzYWdlX2JnLFxuXHRcdFx0XHRcdFx0bWVzc2FnZTogXCJub0VudHJpZXNfbXNnXCIsXG5cdFx0XHRcdFx0XHRpY29uOiBJY29ucy5QZW9wbGUsXG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0OiBtKExpc3QsIHtcblx0XHRcdFx0XHRcdHJlbmRlckNvbmZpZzogdGhpcy5yZW5kZXJDb25maWcsXG5cdFx0XHRcdFx0XHRzdGF0ZTogbGlzdE1vZGVsLnN0YXRlLFxuXHRcdFx0XHRcdFx0b25Mb2FkTW9yZTogKCkgPT4gbGlzdE1vZGVsLmxvYWRNb3JlKCksXG5cdFx0XHRcdFx0XHRvblJldHJ5TG9hZGluZzogKCkgPT4gbGlzdE1vZGVsLnJldHJ5TG9hZGluZygpLFxuXHRcdFx0XHRcdFx0b25TdG9wTG9hZGluZzogKCkgPT4gbGlzdE1vZGVsLnN0b3BMb2FkaW5nKCksXG5cdFx0XHRcdFx0XHRvblNpbmdsZVNlbGVjdGlvbjogKGl0ZW06IENvbnRhY3RMaXN0RW50cnkpID0+IHtcblx0XHRcdFx0XHRcdFx0bGlzdE1vZGVsLm9uU2luZ2xlU2VsZWN0aW9uKGl0ZW0pXG5cdFx0XHRcdFx0XHRcdGZvY3VzRGV0YWlsc1ZpZXdlcigpXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0b25TaW5nbGVUb2dnbGluZ011bHRpc2VsZWN0aW9uOiAoaXRlbTogQ29udGFjdExpc3RFbnRyeSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRsaXN0TW9kZWwub25TaW5nbGVJbmNsdXNpdmVTZWxlY3Rpb24oaXRlbSwgc3R5bGVzLmlzU2luZ2xlQ29sdW1uTGF5b3V0KCkpXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0b25SYW5nZVNlbGVjdGlvblRvd2FyZHM6IChpdGVtOiBDb250YWN0TGlzdEVudHJ5KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGxpc3RNb2RlbC5zZWxlY3RSYW5nZVRvd2FyZHMoaXRlbSlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdCAgfSksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSByZW5kZXJDb25maWc6IFJlbmRlckNvbmZpZzxDb250YWN0TGlzdEVudHJ5LCBSZWNpcGllbnRSb3c+ID0ge1xuXHRcdGl0ZW1IZWlnaHQ6IHNpemUubGlzdF9yb3dfaGVpZ2h0LFxuXHRcdG11bHRpc2VsZWN0aW9uQWxsb3dlZDogTXVsdGlzZWxlY3RNb2RlLkVuYWJsZWQsXG5cdFx0c3dpcGU6IG51bGwsXG5cdFx0Y3JlYXRlRWxlbWVudDogKGRvbSkgPT4ge1xuXHRcdFx0Y29uc3QgcmVjaXBpZW50RW50cnlSb3cgPSBuZXcgUmVjaXBpZW50Um93KChlbnRpdHkpID0+IHRoaXMudmlld01vZGVsPy5saXN0TW9kZWw/Lm9uU2luZ2xlRXhjbHVzaXZlU2VsZWN0aW9uKGVudGl0eSkpXG5cdFx0XHRtLnJlbmRlcihkb20sIHJlY2lwaWVudEVudHJ5Um93LnJlbmRlcigpKVxuXHRcdFx0cmV0dXJuIHJlY2lwaWVudEVudHJ5Um93XG5cdFx0fSxcblx0fVxufVxuXG5leHBvcnQgY2xhc3MgUmVjaXBpZW50Um93IGltcGxlbWVudHMgVmlydHVhbFJvdzxDb250YWN0TGlzdEVudHJ5PiB7XG5cdHRvcDogbnVtYmVyID0gMFxuXHRkb21FbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsIC8vIHNldCBmcm9tIExpc3Rcblx0cHJpdmF0ZSBjaGVja2JveERvbSE6IEhUTUxJbnB1dEVsZW1lbnRcblx0cHJpdmF0ZSBjaGVja2JveFdhc1Zpc2libGUgPSBzaG91bGRBbHdheXNTaG93TXVsdGlzZWxlY3RDaGVja2JveCgpXG5cblx0ZW50aXR5OiBDb250YWN0TGlzdEVudHJ5IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBzZWxlY3Rpb25VcGRhdGVyITogU2VsZWN0YWJsZVJvd1NlbGVjdGVkU2V0dGVyXG5cdHByaXZhdGUgdGl0bGVEb20hOiBIVE1MRWxlbWVudFxuXHRwcml2YXRlIGlkRG9tITogSFRNTEVsZW1lbnRcblxuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IG9uU2VsZWN0ZWQ6IChlbnRpdHk6IENvbnRhY3RMaXN0RW50cnksIHNlbGVjdGVkOiBib29sZWFuKSA9PiB1bmtub3duKSB7fVxuXG5cdHVwZGF0ZShlbnRyeTogQ29udGFjdExpc3RFbnRyeSwgc2VsZWN0ZWQ6IGJvb2xlYW4sIGlzSW5NdWx0aVNlbGVjdDogYm9vbGVhbik6IHZvaWQge1xuXHRcdHRoaXMuZW50aXR5ID0gZW50cnlcblxuXHRcdHRoaXMuc2VsZWN0aW9uVXBkYXRlcihzZWxlY3RlZCwgZmFsc2UpXG5cdFx0dGhpcy5zaG93Q2hlY2tib3hBbmltYXRlZChzaG91bGRBbHdheXNTaG93TXVsdGlzZWxlY3RDaGVja2JveCgpIHx8IGlzSW5NdWx0aVNlbGVjdClcblx0XHRjaGVja2JveE9wYWNpdHkodGhpcy5jaGVja2JveERvbSwgc2VsZWN0ZWQpXG5cdFx0dGhpcy5jaGVja2JveERvbS5jaGVja2VkID0gc2VsZWN0ZWQgJiYgaXNJbk11bHRpU2VsZWN0XG5cblx0XHR0aGlzLnRpdGxlRG9tLnRleHRDb250ZW50ID0gZW50cnkuZW1haWxBZGRyZXNzXG5cdH1cblxuXHRwcml2YXRlIHNob3dDaGVja2JveEFuaW1hdGVkKHNob3c6IGJvb2xlYW4pIHtcblx0XHRpZiAodGhpcy5jaGVja2JveFdhc1Zpc2libGUgPT09IHNob3cpIHJldHVyblxuXHRcdGlmIChzaG93KSB7XG5cdFx0XHR0aGlzLnRpdGxlRG9tLnN0eWxlLnBhZGRpbmdSaWdodCA9IHNoaWZ0QnlGb3JDaGVja2JveFxuXG5cdFx0XHRjb25zdCBhZGRyZXNzQW5pbSA9IHRoaXMudGl0bGVEb20uYW5pbWF0ZSh7IHRyYW5zZm9ybTogW3RyYW5zbGF0ZVhIaWRlLCB0cmFuc2xhdGVYU2hvd10gfSwgc2VsZWN0YWJsZVJvd0FuaW1QYXJhbXMpXG5cdFx0XHRjb25zdCBjaGVja2JveEFuaW0gPSB0aGlzLmNoZWNrYm94RG9tLmFuaW1hdGUoeyB0cmFuc2Zvcm06IFtzY2FsZVhIaWRlLCBzY2FsZVhTaG93XSB9LCBzZWxlY3RhYmxlUm93QW5pbVBhcmFtcylcblxuXHRcdFx0UHJvbWlzZS5hbGwoW2FkZHJlc3NBbmltLmZpbmlzaGVkLCBjaGVja2JveEFuaW0uZmluaXNoZWRdKS50aGVuKCgpID0+IHtcblx0XHRcdFx0YWRkcmVzc0FuaW0uY2FuY2VsKClcblx0XHRcdFx0Y2hlY2tib3hBbmltLmNhbmNlbCgpXG5cdFx0XHRcdHRoaXMuc2hvd0NoZWNrYm94KHNob3cpXG5cdFx0XHR9LCBub09wKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnRpdGxlRG9tLnN0eWxlLnBhZGRpbmdSaWdodCA9IFwiMFwiXG5cblx0XHRcdGNvbnN0IGFkZHJlc3NBbmltID0gdGhpcy50aXRsZURvbS5hbmltYXRlKHsgdHJhbnNmb3JtOiBbdHJhbnNsYXRlWFNob3csIHRyYW5zbGF0ZVhIaWRlXSB9LCBzZWxlY3RhYmxlUm93QW5pbVBhcmFtcylcblx0XHRcdGNvbnN0IGNoZWNrYm94QW5pbSA9IHRoaXMuY2hlY2tib3hEb20uYW5pbWF0ZSh7IHRyYW5zZm9ybTogW3NjYWxlWFNob3csIHNjYWxlWEhpZGVdIH0sIHNlbGVjdGFibGVSb3dBbmltUGFyYW1zKVxuXG5cdFx0XHRQcm9taXNlLmFsbChbYWRkcmVzc0FuaW0uZmluaXNoZWQsIGNoZWNrYm94QW5pbS5maW5pc2hlZF0pLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRhZGRyZXNzQW5pbS5jYW5jZWwoKVxuXHRcdFx0XHRjaGVja2JveEFuaW0uY2FuY2VsKClcblx0XHRcdFx0dGhpcy5zaG93Q2hlY2tib3goc2hvdylcblx0XHRcdH0sIG5vT3ApXG5cdFx0fVxuXHRcdHRoaXMuY2hlY2tib3hXYXNWaXNpYmxlID0gc2hvd1xuXHR9XG5cblx0cmVuZGVyKCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFNlbGVjdGFibGVSb3dDb250YWluZXIsXG5cdFx0XHR7XG5cdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHRQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHRoaXMuc2hvd0NoZWNrYm94KHNob3VsZEFsd2F5c1Nob3dNdWx0aXNlbGVjdENoZWNrYm94KCkpKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvblNlbGVjdGVkQ2hhbmdlUmVmOiAodXBkYXRlcikgPT4gKHRoaXMuc2VsZWN0aW9uVXBkYXRlciA9IHVwZGF0ZXIpLFxuXHRcdFx0fSxcblx0XHRcdG0oXCIubXQteHMuYWJzXCIsIFtcblx0XHRcdFx0bShcIi50ZXh0LWVsbGlwc2lzLnNtYWxsZXIubXQteHhzXCIsIHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0aGVpZ2h0OiBweCg5KSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0bShcImlucHV0LmNoZWNrYm94Lmxpc3QtY2hlY2tib3hcIiwge1xuXHRcdFx0XHRcdHR5cGU6IFwiY2hlY2tib3hcIixcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0dHJhbnNmb3JtT3JpZ2luOiBcImxlZnRcIixcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9uY2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvbmNoYW5nZTogKCkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuZW50aXR5KSB0aGlzLm9uU2VsZWN0ZWQodGhpcy5lbnRpdHksIHRoaXMuY2hlY2tib3hEb20uY2hlY2tlZClcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHRcdHRoaXMuY2hlY2tib3hEb20gPSB2bm9kZS5kb20gYXMgSFRNTElucHV0RWxlbWVudFxuXHRcdFx0XHRcdFx0Y2hlY2tib3hPcGFjaXR5KHRoaXMuY2hlY2tib3hEb20sIGZhbHNlKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRtKFwiLnRleHQtZWxsaXBzaXMuc21hbGxlci5tdC14eHNcIiwge1xuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRoZWlnaHQ6IHB4KDkpLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pLFxuXHRcdFx0XSksXG5cdFx0XHRtKFwiLmZsZXguY29sLm92ZXJmbG93LWhpZGRlbi5mbGV4LWdyb3dcIiwgW1xuXHRcdFx0XHRtKFwiXCIsIFtcblx0XHRcdFx0XHRtKFwiLnRleHQtZWxsaXBzaXMuc21hbGxlci5tdC14eHNcIiwge1xuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBweCg5KSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0bShcIi50ZXh0LWVsbGlwc2lzLmJhZGdlLWxpbmUtaGVpZ2h0XCIsIHtcblx0XHRcdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+ICh0aGlzLnRpdGxlRG9tID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50KSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRtKFwiLnRleHQtZWxsaXBzaXMuc21hbGxlci5tdC14eHNcIiwge1xuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBweCg5KSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XSksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBzaG93Q2hlY2tib3goc2hvdzogYm9vbGVhbikge1xuXHRcdGxldCB0cmFuc2xhdGVcblx0XHRsZXQgc2NhbGVcblx0XHRsZXQgcGFkZGluZ1xuXHRcdGlmIChzaG93KSB7XG5cdFx0XHR0cmFuc2xhdGUgPSB0cmFuc2xhdGVYU2hvd1xuXHRcdFx0c2NhbGUgPSBzY2FsZVhTaG93XG5cdFx0XHRwYWRkaW5nID0gc2hpZnRCeUZvckNoZWNrYm94XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRyYW5zbGF0ZSA9IHRyYW5zbGF0ZVhIaWRlXG5cdFx0XHRzY2FsZSA9IHNjYWxlWEhpZGVcblx0XHRcdHBhZGRpbmcgPSBcIjBcIlxuXHRcdH1cblxuXHRcdHRoaXMudGl0bGVEb20uc3R5bGUudHJhbnNmb3JtID0gdHJhbnNsYXRlXG5cdFx0dGhpcy50aXRsZURvbS5zdHlsZS5wYWRkaW5nUmlnaHQgPSBwYWRkaW5nXG5cdFx0dGhpcy5jaGVja2JveERvbS5zdHlsZS50cmFuc2Zvcm0gPSBzY2FsZVxuXHRcdC8vIFN0b3AgdGhlIGhpZGRlbiBjaGVja2JveCBmcm9tIGVudGVyaW5nIHRoZSB0YWIgaW5kZXhcblx0XHR0aGlzLmNoZWNrYm94RG9tLnN0eWxlLmRpc3BsYXkgPSBzaG93ID8gXCJcIiA6IFwibm9uZVwiXG5cdH1cbn1cbiIsImltcG9ydCB7IENvbnRhY3RMaXN0R3JvdXBSb290IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBEaWFsb2dIZWFkZXJCYXJBdHRycyB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nSGVhZGVyQmFyLmpzXCJcbmltcG9ydCB7IEJ1dHRvblR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZy5qc1wiXG5pbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IFRleHRGaWVsZCB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL2Jhc2UvVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IHB4LCBzaXplIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvc2l6ZS5qc1wiXG5pbXBvcnQgeyBJY29uQnV0dG9uIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uQnV0dG9uLmpzXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29ucy5qc1wiXG5pbXBvcnQgeyBNYWlsUmVjaXBpZW50c1RleHRGaWVsZCB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL01haWxSZWNpcGllbnRzVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IFJlY2lwaWVudHNTZWFyY2hNb2RlbCB9IGZyb20gXCIuLi8uLi9jb21tb24vbWlzYy9SZWNpcGllbnRzU2VhcmNoTW9kZWwuanNcIlxuaW1wb3J0IHsgbGF6eSwgbm9PcCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgbGFuZywgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgaXNTYW1lSWQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgS2V5cyB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBpc01haWxBZGRyZXNzIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9taXNjL0Zvcm1hdFZhbGlkYXRvci5qc1wiXG5pbXBvcnQgeyBjbGVhbk1haWxBZGRyZXNzIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0NvbW1vbkNhbGVuZGFyVXRpbHMuanNcIlxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvd0NvbnRhY3RMaXN0RWRpdG9yKFxuXHRjb250YWN0TGlzdEdyb3VwUm9vdDogQ29udGFjdExpc3RHcm91cFJvb3QgfCBudWxsLFxuXHRoZWFkZXJUZXh0OiBUcmFuc2xhdGlvbktleSxcblx0c2F2ZTogKG5hbWU6IHN0cmluZywgYWRkcmVzc2VzOiBBcnJheTxzdHJpbmc+KSA9PiB2b2lkLFxuXHRhZGRyZXNzZXNPbkxpc3Q/OiBBcnJheTxzdHJpbmc+LFxuKTogUHJvbWlzZTx2b2lkPiB7XG5cdGxldCBzaG93TmFtZUlucHV0ID0gdHJ1ZVxuXHRjb25zdCByZWNpcGllbnRzU2VhcmNoID0gYXdhaXQgbG9jYXRvci5yZWNpcGllbnRzU2VhcmNoTW9kZWwoKVxuXG5cdGlmIChjb250YWN0TGlzdEdyb3VwUm9vdCkge1xuXHRcdHNob3dOYW1lSW5wdXQgPSBmYWxzZVxuXHRcdHJlY2lwaWVudHNTZWFyY2guc2V0RmlsdGVyKChpdGVtKSA9PiB7XG5cdFx0XHQvLyBFeGNsdWRlIHRoZSBsaXN0IHRoYXQgd2UgYXJlIGVkaXRpbmcgdG8gbm90IHNob3cgdXAgaW4gc3VnZ2VzdGlvbnMuXG5cdFx0XHQvLyBJdCBpcyB2YWxpZCB0byBpbmNsdWRlIG90aGVyIGxpc3RzIHRvIGNvcHkgdGhlbSBpbnRvIHRoZSBjdXJyZW50IG9uZS5cblx0XHRcdHJldHVybiAhKGl0ZW0udHlwZSA9PT0gXCJjb250YWN0bGlzdFwiICYmIGlzU2FtZUlkKGl0ZW0udmFsdWUuZ3JvdXBSb290Ll9pZCwgY29udGFjdExpc3RHcm91cFJvb3QuX2lkKSlcblx0XHR9KVxuXHR9XG5cblx0Y29uc3QgZWRpdG9yTW9kZWwgPSBuZXcgQ29udGFjdExpc3RFZGl0b3JNb2RlbChhZGRyZXNzZXNPbkxpc3QgPz8gW10pXG5cblx0Y29uc3QgZGlhbG9nQ2xvc2VBY3Rpb24gPSAoKSA9PiB7XG5cdFx0ZGlhbG9nLmNsb3NlKClcblx0fVxuXG5cdGxldCBoZWFkZXJCYXJBdHRyczogRGlhbG9nSGVhZGVyQmFyQXR0cnMgPSB7XG5cdFx0bGVmdDogW1xuXHRcdFx0e1xuXHRcdFx0XHRsYWJlbDogXCJjYW5jZWxfYWN0aW9uXCIsXG5cdFx0XHRcdGNsaWNrOiBkaWFsb2dDbG9zZUFjdGlvbixcblx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHR9LFxuXHRcdF0sXG5cdFx0cmlnaHQ6IFtcblx0XHRcdHtcblx0XHRcdFx0bGFiZWw6IFwic2F2ZV9hY3Rpb25cIixcblx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRzYXZlKGVkaXRvck1vZGVsLm5hbWUsIGVkaXRvck1vZGVsLm5ld0FkZHJlc3Nlcylcblx0XHRcdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlByaW1hcnksXG5cdFx0XHR9LFxuXHRcdF0sXG5cdFx0bWlkZGxlOiBoZWFkZXJUZXh0LFxuXHR9XG5cblx0Y29uc3QgZGlhbG9nID0gRGlhbG9nLmVkaXREaWFsb2coaGVhZGVyQmFyQXR0cnMsIENvbnRhY3RMaXN0RWRpdG9yLCB7XG5cdFx0bW9kZWw6IGVkaXRvck1vZGVsLFxuXHRcdGNvbnRhY3RTZWFyY2g6IHJlY2lwaWVudHNTZWFyY2gsXG5cdFx0c2hvd05hbWVJbnB1dCxcblx0fSkuYWRkU2hvcnRjdXQoe1xuXHRcdGtleTogS2V5cy5FU0MsXG5cdFx0ZXhlYzogKCkgPT4gZGlhbG9nLmNsb3NlKCksXG5cdFx0aGVscDogXCJjbG9zZV9hbHRcIixcblx0fSlcblx0ZGlhbG9nLnNob3coKVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvd0NvbnRhY3RMaXN0TmFtZUVkaXRvcihuYW1lOiBzdHJpbmcsIHNhdmU6IChuYW1lOiBzdHJpbmcpID0+IHZvaWQpOiBQcm9taXNlPHZvaWQ+IHtcblx0bGV0IG5hbWVJbnB1dCA9IG5hbWVcblx0bGV0IGZvcm0gPSAoKSA9PiBbXG5cdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdGxhYmVsOiBcIm5hbWVfbGFiZWxcIixcblx0XHRcdHZhbHVlOiBuYW1lSW5wdXQsXG5cdFx0XHRvbmlucHV0OiAobmV3SW5wdXQpID0+IHtcblx0XHRcdFx0bmFtZUlucHV0ID0gbmV3SW5wdXRcblx0XHRcdH0sXG5cdFx0fSksXG5cdF1cblx0Y29uc3Qgb2tBY3Rpb24gPSBhc3luYyAoZGlhbG9nOiBEaWFsb2cpID0+IHtcblx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdHNhdmUobmFtZUlucHV0KVxuXHR9XG5cblx0RGlhbG9nLnNob3dBY3Rpb25EaWFsb2coe1xuXHRcdHRpdGxlOiBcImVkaXRDb250YWN0TGlzdF9hY3Rpb25cIixcblx0XHRjaGlsZDogZm9ybSxcblx0XHRhbGxvd09rV2l0aFJldHVybjogdHJ1ZSxcblx0XHRva0FjdGlvbjogb2tBY3Rpb24sXG5cdH0pXG59XG5cbmV4cG9ydCBjbGFzcyBDb250YWN0TGlzdEVkaXRvck1vZGVsIHtcblx0bmFtZTogc3RyaW5nXG5cdG5ld0FkZHJlc3NlczogQXJyYXk8c3RyaW5nPlxuXHRjdXJyZW50QWRkcmVzc2VzOiBBcnJheTxzdHJpbmc+XG5cblx0Y29uc3RydWN0b3IoYWRkcmVzc2VzOiBBcnJheTxzdHJpbmc+KSB7XG5cdFx0dGhpcy5uYW1lID0gXCJcIlxuXHRcdHRoaXMubmV3QWRkcmVzc2VzID0gW11cblx0XHR0aGlzLmN1cnJlbnRBZGRyZXNzZXMgPSBhZGRyZXNzZXNcblx0fVxuXG5cdGFkZFJlY2lwaWVudChhZGRyZXNzOiBzdHJpbmcpIHtcblx0XHR0aGlzLm5ld0FkZHJlc3NlcyA9IFthZGRyZXNzLCAuLi50aGlzLm5ld0FkZHJlc3Nlc11cblx0fVxuXG5cdHJlbW92ZVJlY2lwaWVudChhZGRyZXNzOiBzdHJpbmcpIHtcblx0XHR0aGlzLm5ld0FkZHJlc3NlcyA9IHRoaXMubmV3QWRkcmVzc2VzLmZpbHRlcigoYSkgPT4gYWRkcmVzcyAhPT0gYSlcblx0fVxufVxuXG50eXBlIENvbnRhY3RMaXN0RWRpdG9yQXR0cnMgPSB7XG5cdG1vZGVsOiBDb250YWN0TGlzdEVkaXRvck1vZGVsXG5cdGNvbnRhY3RTZWFyY2g6IFJlY2lwaWVudHNTZWFyY2hNb2RlbFxuXHRzaG93TmFtZUlucHV0PzogYm9vbGVhblxufVxuXG5jbGFzcyBDb250YWN0TGlzdEVkaXRvciBpbXBsZW1lbnRzIENvbXBvbmVudDxDb250YWN0TGlzdEVkaXRvckF0dHJzPiB7XG5cdHByaXZhdGUgbW9kZWw6IENvbnRhY3RMaXN0RWRpdG9yTW9kZWxcblx0cHJpdmF0ZSBzZWFyY2g6IFJlY2lwaWVudHNTZWFyY2hNb2RlbFxuXHRwcml2YXRlIG5ld0FkZHJlc3M6IHN0cmluZyA9IFwiXCJcblx0cHJpdmF0ZSBzaG93TmFtZUlucHV0OiBib29sZWFuID0gdHJ1ZVxuXG5cdGNvbnN0cnVjdG9yKHZub2RlOiBWbm9kZTxDb250YWN0TGlzdEVkaXRvckF0dHJzPikge1xuXHRcdHRoaXMubW9kZWwgPSB2bm9kZS5hdHRycy5tb2RlbFxuXHRcdHRoaXMuc2VhcmNoID0gdm5vZGUuYXR0cnMuY29udGFjdFNlYXJjaFxuXHRcdHRoaXMuc2hvd05hbWVJbnB1dCA9IHZub2RlLmF0dHJzLnNob3dOYW1lSW5wdXQgPz8gdHJ1ZVxuXHR9XG5cblx0dmlldygpOiBDaGlsZHJlbiB7XG5cdFx0bGV0IGhlbHBMYWJlbDogbGF6eTxzdHJpbmc+IHwgbnVsbCA9IG51bGxcblxuXHRcdGlmICh0aGlzLm5ld0FkZHJlc3MudHJpbSgpLmxlbmd0aCA+IDAgJiYgIWlzTWFpbEFkZHJlc3ModGhpcy5uZXdBZGRyZXNzLnRyaW0oKSwgZmFsc2UpKSB7XG5cdFx0XHRoZWxwTGFiZWwgPSAoKSA9PiBsYW5nLmdldChcImludmFsaWRJbnB1dEZvcm1hdF9tc2dcIilcblx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0dGhpcy5tb2RlbC5jdXJyZW50QWRkcmVzc2VzLmluY2x1ZGVzKGNsZWFuTWFpbEFkZHJlc3ModGhpcy5uZXdBZGRyZXNzKSkgfHxcblx0XHRcdHRoaXMubW9kZWwubmV3QWRkcmVzc2VzLmluY2x1ZGVzKGNsZWFuTWFpbEFkZHJlc3ModGhpcy5uZXdBZGRyZXNzKSlcblx0XHQpIHtcblx0XHRcdGhlbHBMYWJlbCA9ICgpID0+IGxhbmcuZ2V0KFwiYWRkcmVzc0FscmVhZHlFeGlzdHNPbkxpc3RfbXNnXCIpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG0oXCJcIiwgW1xuXHRcdFx0dGhpcy5zaG93TmFtZUlucHV0XG5cdFx0XHRcdD8gbShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcIm5hbWVfbGFiZWxcIixcblx0XHRcdFx0XHRcdGNsYXNzOiBcImJpZy1pbnB1dCBwdCBmbGV4LWdyb3dcIixcblx0XHRcdFx0XHRcdHZhbHVlOiB0aGlzLm1vZGVsLm5hbWUsXG5cdFx0XHRcdFx0XHRvbmlucHV0OiAobmFtZSkgPT4gKHRoaXMubW9kZWwubmFtZSA9IG5hbWUpLFxuXHRcdFx0XHQgIH0pXG5cdFx0XHRcdDogbnVsbCxcblx0XHRcdG0oTWFpbFJlY2lwaWVudHNUZXh0RmllbGQsIHtcblx0XHRcdFx0bGFiZWw6IFwiYWRkRW50cmllc19hY3Rpb25cIixcblx0XHRcdFx0dGV4dDogdGhpcy5uZXdBZGRyZXNzLFxuXHRcdFx0XHRvblRleHRDaGFuZ2VkOiAodikgPT4gKHRoaXMubmV3QWRkcmVzcyA9IHYpLFxuXHRcdFx0XHQvLyB3ZSBkb24ndCBzaG93IGJ1YmJsZXMsIHdlIGp1c3Qgd2FudCB0aGUgc2VhcmNoIGRyb3Bkb3duXG5cdFx0XHRcdHJlY2lwaWVudHM6IFtdLFxuXHRcdFx0XHRkaXNhYmxlZDogZmFsc2UsXG5cdFx0XHRcdG9uUmVjaXBpZW50QWRkZWQ6IChhZGRyZXNzKSA9PiB7XG5cdFx0XHRcdFx0aWYgKCF0aGlzLm1vZGVsLm5ld0FkZHJlc3Nlcy5pbmNsdWRlcyhhZGRyZXNzKSAmJiAhdGhpcy5tb2RlbC5jdXJyZW50QWRkcmVzc2VzLmluY2x1ZGVzKGFkZHJlc3MpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLm1vZGVsLmFkZFJlY2lwaWVudChhZGRyZXNzKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8vIGRvIG5vdGhpbmcgYmVjYXVzZSB3ZSBkb24ndCBoYXZlIGFueSBidWJibGVzIGhlcmVcblx0XHRcdFx0b25SZWNpcGllbnRSZW1vdmVkOiBub09wLFxuXHRcdFx0XHRzZWFyY2g6IHRoaXMuc2VhcmNoLFxuXHRcdFx0XHRoZWxwTGFiZWwsXG5cdFx0XHR9KSxcblx0XHRcdHRoaXMubW9kZWwubmV3QWRkcmVzc2VzLm1hcCgoYWRkcmVzcykgPT4gdGhpcy5yZW5kZXJBZGRyZXNzKGFkZHJlc3MpKSxcblx0XHRdKVxuXHR9XG5cblx0cmVuZGVyQWRkcmVzcyhhZGRyZXNzOiBzdHJpbmcpIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZsZXhcIixcblx0XHRcdHtcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRoZWlnaHQ6IHB4KHNpemUuYnV0dG9uX2hlaWdodCksXG5cdFx0XHRcdFx0Ym9yZGVyQm90dG9tOiBcIjFweCB0cmFuc3BhcmVudFwiLFxuXHRcdFx0XHRcdG1hcmdpblRvcDogcHgoc2l6ZS52cGFkKSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRbXG5cdFx0XHRcdG0oXCIuZmxleC5jb2wuZmxleC1ncm93Lm92ZXJmbG93LWhpZGRlbi5mbGV4LW5vLWdyb3ctc2hyaW5rLWF1dG9cIiwgW2FkZHJlc3NdKSxcblx0XHRcdFx0bShcIi5mbGV4LWdyb3dcIiksXG5cdFx0XHRcdG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdHRpdGxlOiBcInJlbW92ZV9hY3Rpb25cIixcblx0XHRcdFx0XHRpY29uOiBJY29ucy5DYW5jZWwsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHRoaXMubW9kZWwucmVtb3ZlUmVjaXBpZW50KGFkZHJlc3MpLFxuXHRcdFx0XHR9KSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IENvbnRhY3QsIENvbnRhY3RMaXN0RW50cnksIGNyZWF0ZUNvbnRhY3QsIGNyZWF0ZUNvbnRhY3RNYWlsQWRkcmVzcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgQnV0dG9uLCBCdXR0b25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgcmVzcG9uc2l2ZUNhcmRITWFyZ2luIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvY2FyZHMuanNcIlxuaW1wb3J0IHsgQ29udGFjdENhcmRWaWV3ZXIgfSBmcm9tIFwiLi9Db250YWN0Q2FyZFZpZXdlci5qc1wiXG5pbXBvcnQgeyBDb250YWN0QWRkcmVzc1R5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgUGFydGlhbFJlY2lwaWVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9yZWNpcGllbnRzL1JlY2lwaWVudC5qc1wiXG5pbXBvcnQgeyBsYW5nLCBUcmFuc2xhdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29udGFjdExpc3RFbnRyeVZpZXdlckF0dHJzIHtcblx0ZW50cnk6IENvbnRhY3RMaXN0RW50cnlcblx0Y29udGFjdHM6IENvbnRhY3RbXVxuXHRjb250YWN0RWRpdDogKGNvbnRhY3Q6IENvbnRhY3QpID0+IHVua25vd25cblx0Y29udGFjdERlbGV0ZTogKGNvbnRhY3RzOiBDb250YWN0W10pID0+IHVua25vd25cblx0Y29udGFjdENyZWF0ZTogKGNvbnRhY3Q6IENvbnRhY3QpID0+IHVua25vd25cblx0b25Xcml0ZU1haWw6ICh0bzogUGFydGlhbFJlY2lwaWVudCkgPT4gdW5rbm93blxuXHRzZWxlY3ROb25lOiAoKSA9PiB1bmtub3duXG59XG5cbmV4cG9ydCBjbGFzcyBDb250YWN0TGlzdEVudHJ5Vmlld2VyIGltcGxlbWVudHMgQ29tcG9uZW50PENvbnRhY3RMaXN0RW50cnlWaWV3ZXJBdHRycz4ge1xuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8Q29udGFjdExpc3RFbnRyeVZpZXdlckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4LmZsZXgtY29sdW1uXCIsIFtcblx0XHRcdG0oXG5cdFx0XHRcdFwiLmJvcmRlci1yYWRpdXMtYmlnLnJlbFwiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y2xhc3M6IHJlc3BvbnNpdmVDYXJkSE1hcmdpbigpLFxuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lLmNvbnRlbnRfYmcsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0bShcIi5wbHItbC5wdC5wYi5tbHItc2FmZS1pbnNldFwiLCBtKFwiLmgyLnNlbGVjdGFibGUudGV4dC1icmVha1wiLCBhdHRycy5lbnRyeS5lbWFpbEFkZHJlc3MpKSxcblx0XHRcdCksXG5cdFx0XHRtKFwiLm10LWxcIiksXG5cdFx0XHRhdHRycy5jb250YWN0cy5sZW5ndGggPj0gMVxuXHRcdFx0XHQ/IGF0dHJzLmNvbnRhY3RzLm1hcCgoY29udGFjdCkgPT5cblx0XHRcdFx0XHRcdG0oQ29udGFjdENhcmRWaWV3ZXIsIHtcblx0XHRcdFx0XHRcdFx0Y29udGFjdCxcblx0XHRcdFx0XHRcdFx0b25Xcml0ZU1haWw6IGF0dHJzLm9uV3JpdGVNYWlsLFxuXHRcdFx0XHRcdFx0XHRlZGl0QWN0aW9uOiBhdHRycy5jb250YWN0RWRpdCxcblx0XHRcdFx0XHRcdFx0ZGVsZXRlQWN0aW9uOiBhdHRycy5jb250YWN0RGVsZXRlLFxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdCAgKVxuXHRcdFx0XHQ6IG0oXG5cdFx0XHRcdFx0XHRcIi5ib3JkZXItcmFkaXVzLWJpZy5yZWxcIixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Y2xhc3M6IHJlc3BvbnNpdmVDYXJkSE1hcmdpbigpLFxuXHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdGJhY2tncm91bmRDb2xvcjogdGhlbWUuY29udGVudF9iZyxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XHRcIi5wbHItbC5wdC5wYi5tbHItc2FmZS1pbnNldFwiLFxuXHRcdFx0XHRcdFx0XHRsYW5nLmdldChcIm5vQ29udGFjdEZvdW5kX21zZ1wiKSxcblx0XHRcdFx0XHRcdFx0bShCdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJjcmVhdGVDb250YWN0X2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRsZXQgbmV3Q29udGFjdCA9IGNyZWF0ZUNvbnRhY3Qoe1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRtYWlsQWRkcmVzc2VzOiBbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3JlYXRlQ29udGFjdE1haWxBZGRyZXNzKHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHR5cGU6IENvbnRhY3RBZGRyZXNzVHlwZS5XT1JLLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y3VzdG9tVHlwZU5hbWU6IFwiXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRhZGRyZXNzOiBhdHRycy5lbnRyeS5lbWFpbEFkZHJlc3MsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9sZEJpcnRoZGF5QWdncmVnYXRlOiBudWxsLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRhZGRyZXNzZXM6IFtdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRiaXJ0aGRheUlzbzogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y29tbWVudDogXCJcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y29tcGFueTogXCJcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0Zmlyc3ROYW1lOiBcIlwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsYXN0TmFtZTogXCJcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0bmlja25hbWU6IG51bGwsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9sZEJpcnRoZGF5RGF0ZTogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0cGhvbmVOdW1iZXJzOiBbXSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0cGhvdG86IG51bGwsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJvbGU6IFwiXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHByZXNoYXJlZFBhc3N3b3JkOiBudWxsLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRzb2NpYWxJZHM6IFtdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aXRsZTogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVwYXJ0bWVudDogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0bWlkZGxlTmFtZTogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0bmFtZVN1ZmZpeDogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0cGhvbmV0aWNGaXJzdDogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0cGhvbmV0aWNMYXN0OiBudWxsLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRwaG9uZXRpY01pZGRsZTogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3VzdG9tRGF0ZTogW10sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG1lc3NlbmdlckhhbmRsZXM6IFtdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRwcm9ub3VuczogW10sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJlbGF0aW9uc2hpcHM6IFtdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR3ZWJzaXRlczogW10sXG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0YXR0cnMuY29udGFjdENyZWF0ZShuZXdDb250YWN0KVxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5QcmltYXJ5LFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdCAgKSxcblx0XHRdKVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250YWN0TGlzdEVudHJpZXNTZWxlY3Rpb25NZXNzYWdlKHNlbGVjdGVkRW50aXRpZXM6IENvbnRhY3RMaXN0RW50cnlbXSB8IHVuZGVmaW5lZCk6IFRyYW5zbGF0aW9uIHtcblx0aWYgKHNlbGVjdGVkRW50aXRpZXMgJiYgc2VsZWN0ZWRFbnRpdGllcy5sZW5ndGggPiAwKSB7XG5cdFx0cmV0dXJuIGxhbmcuZ2V0VHJhbnNsYXRpb24oXCJuYnJPZkVudHJpZXNTZWxlY3RlZF9tc2dcIiwgeyBcIntuYnJ9XCI6IHNlbGVjdGVkRW50aXRpZXMubGVuZ3RoIH0pXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIGxhbmcuZ2V0VHJhbnNsYXRpb24oXCJub1NlbGVjdGlvbl9tc2dcIilcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgVmlld1NsaWRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL25hdi9WaWV3U2xpZGVyLmpzXCJcbmltcG9ydCB7IENvbHVtblR5cGUsIFZpZXdDb2x1bW4gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1ZpZXdDb2x1bW5cIlxuaW1wb3J0IHsgQXBwSGVhZGVyQXR0cnMsIEhlYWRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0hlYWRlci5qc1wiXG5pbXBvcnQgeyBCdXR0b24sIEJ1dHRvbkNvbG9yLCBCdXR0b25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgQ29udGFjdEVkaXRvciB9IGZyb20gXCIuLi9Db250YWN0RWRpdG9yXCJcbmltcG9ydCB7IENvbnRhY3QsIENvbnRhY3RUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgQ29udGFjdExpc3RWaWV3IH0gZnJvbSBcIi4vQ29udGFjdExpc3RWaWV3XCJcbmltcG9ydCB7IGxhbmcsIFRyYW5zbGF0aW9uS2V5IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIGNsZWFyLCBnZXRGaXJzdE9yVGhyb3csIG5vT3AsIG9mQ2xhc3MgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IENvbnRhY3RNZXJnZUFjdGlvbiwgS2V5cyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlLCBpc0FwcCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHR5cGUgeyBTaG9ydGN1dCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9LZXlNYW5hZ2VyXCJcbmltcG9ydCB7IGtleU1hbmFnZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvS2V5TWFuYWdlclwiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnNcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2dcIlxuaW1wb3J0IHsgTG9ja2VkRXJyb3IsIE5vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yXCJcbmltcG9ydCB7IGdldENvbnRhY3RTZWxlY3Rpb25NZXNzYWdlLCBNdWx0aUNvbnRhY3RWaWV3ZXIgfSBmcm9tIFwiLi9NdWx0aUNvbnRhY3RWaWV3ZXJcIlxuaW1wb3J0IHsgQm9vdEljb25zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9Cb290SWNvbnNcIlxuaW1wb3J0IHsgc2hvd1Byb2dyZXNzRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvZGlhbG9ncy9Qcm9ncmVzc0RpYWxvZ1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IENvbnRhY3RNZXJnZVZpZXcgfSBmcm9tIFwiLi9Db250YWN0TWVyZ2VWaWV3XCJcbmltcG9ydCB7IGdldE1lcmdlYWJsZUNvbnRhY3RzLCBtZXJnZUNvbnRhY3RzIH0gZnJvbSBcIi4uL0NvbnRhY3RNZXJnZVV0aWxzXCJcbmltcG9ydCB7IGV4cG9ydENvbnRhY3RzIH0gZnJvbSBcIi4uL1ZDYXJkRXhwb3J0ZXJcIlxuaW1wb3J0IHsgTmF2QnV0dG9uQXR0cnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL05hdkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBzdHlsZXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zdHlsZXNcIlxuaW1wb3J0IHsgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemVcIlxuaW1wb3J0IHsgRm9sZGVyQ29sdW1uVmlldyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0ZvbGRlckNvbHVtblZpZXcuanNcIlxuaW1wb3J0IHsgZ2V0R3JvdXBJbmZvRGlzcGxheU5hbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvR3JvdXBVdGlsc1wiXG5pbXBvcnQgeyBTaWRlYmFyU2VjdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL1NpZGViYXJTZWN0aW9uXCJcbmltcG9ydCB7IGF0dGFjaERyb3Bkb3duLCBjcmVhdGVEcm9wZG93biwgRHJvcGRvd25CdXR0b25BdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRHJvcGRvd24uanNcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiwgSWNvbkJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uQnV0dG9uLmpzXCJcbmltcG9ydCB7IEJ1dHRvblNpemUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0J1dHRvblNpemUuanNcIlxuaW1wb3J0IHsgRHJhd2VyTWVudUF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvbmF2L0RyYXdlck1lbnUuanNcIlxuaW1wb3J0IHsgQmFzZVRvcExldmVsVmlldyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0Jhc2VUb3BMZXZlbFZpZXcuanNcIlxuaW1wb3J0IHsgVG9wTGV2ZWxBdHRycywgVG9wTGV2ZWxWaWV3IH0gZnJvbSBcIi4uLy4uLy4uL1RvcExldmVsVmlldy5qc1wiXG5pbXBvcnQgeyBDb250YWN0Q2FyZFZpZXdlciB9IGZyb20gXCIuL0NvbnRhY3RDYXJkVmlld2VyLmpzXCJcbmltcG9ydCB7IE1vYmlsZUFjdGlvbkJhciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL01vYmlsZUFjdGlvbkJhci5qc1wiXG5pbXBvcnQgeyBhcHBlbmRFbWFpbFNpZ25hdHVyZSB9IGZyb20gXCIuLi8uLi9tYWlsL3NpZ25hdHVyZS9TaWduYXR1cmUuanNcIlxuaW1wb3J0IHsgUGFydGlhbFJlY2lwaWVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9yZWNpcGllbnRzL1JlY2lwaWVudC5qc1wiXG5pbXBvcnQgeyBuZXdNYWlsRWRpdG9yRnJvbVRlbXBsYXRlIH0gZnJvbSBcIi4uLy4uL21haWwvZWRpdG9yL01haWxFZGl0b3IuanNcIlxuaW1wb3J0IHsgQmFja2dyb3VuZENvbHVtbkxheW91dCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0JhY2tncm91bmRDb2x1bW5MYXlvdXQuanNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS90aGVtZS5qc1wiXG5pbXBvcnQgeyBEZXNrdG9wTGlzdFRvb2xiYXIsIERlc2t0b3BWaWV3ZXJUb29sYmFyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvRGVza3RvcFRvb2xiYXJzLmpzXCJcbmltcG9ydCB7IFNlbGVjdEFsbENoZWNrYm94IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvU2VsZWN0QWxsQ2hlY2tib3guanNcIlxuaW1wb3J0IHsgQ29udGFjdFZpZXdlckFjdGlvbnMgfSBmcm9tIFwiLi9Db250YWN0Vmlld2VyQWN0aW9ucy5qc1wiXG5pbXBvcnQgeyBNb2JpbGVCb3R0b21BY3Rpb25CYXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9Nb2JpbGVCb3R0b21BY3Rpb25CYXIuanNcIlxuaW1wb3J0IHsgZXhwb3J0QXNWQ2FyZCwgaW1wb3J0QXNWQ2FyZCB9IGZyb20gXCIuL0ltcG9ydEFzVkNhcmQuanNcIlxuaW1wb3J0IHsgTW9iaWxlSGVhZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvTW9iaWxlSGVhZGVyLmpzXCJcbmltcG9ydCB7IExhenlTZWFyY2hCYXIgfSBmcm9tIFwiLi4vLi4vTGF6eVNlYXJjaEJhci5qc1wiXG5pbXBvcnQgeyBNdWx0aXNlbGVjdE1vYmlsZUhlYWRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL011bHRpc2VsZWN0TW9iaWxlSGVhZGVyLmpzXCJcbmltcG9ydCB7IE11bHRpc2VsZWN0TW9kZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTGlzdC5qc1wiXG5pbXBvcnQgeyBFbnRlck11bHRpc2VsZWN0SWNvbkJ1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0VudGVyTXVsdGlzZWxlY3RJY29uQnV0dG9uLmpzXCJcbmltcG9ydCB7IHNlbGVjdGlvbkF0dHJzRm9yTGlzdCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MaXN0TW9kZWwuanNcIlxuaW1wb3J0IHsgQ29udGFjdFZpZXdNb2RlbCB9IGZyb20gXCIuL0NvbnRhY3RWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgbGlzdFNlbGVjdGlvbktleWJvYXJkU2hvcnRjdXRzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9MaXN0VXRpbHMuanNcIlxuaW1wb3J0IHsgQ29udGFjdExpc3RWaWV3TW9kZWwgfSBmcm9tIFwiLi9Db250YWN0TGlzdFZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBDb250YWN0TGlzdFJlY2lwaWVudFZpZXcgfSBmcm9tIFwiLi9Db250YWN0TGlzdFJlY2lwaWVudFZpZXcuanNcIlxuaW1wb3J0IHsgc2hvd0NvbnRhY3RMaXN0RWRpdG9yLCBzaG93Q29udGFjdExpc3ROYW1lRWRpdG9yIH0gZnJvbSBcIi4uL0NvbnRhY3RMaXN0RWRpdG9yLmpzXCJcbmltcG9ydCB7IENvbnRhY3RMaXN0RW50cnlWaWV3ZXIsIGdldENvbnRhY3RMaXN0RW50cmllc1NlbGVjdGlvbk1lc3NhZ2UgfSBmcm9tIFwiLi9Db250YWN0TGlzdEVudHJ5Vmlld2VyLmpzXCJcbmltcG9ydCB7IHNob3dQbGFuVXBncmFkZVJlcXVpcmVkRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL1N1YnNjcmlwdGlvbkRpYWxvZ3MuanNcIlxuaW1wb3J0IENvbHVtbkVtcHR5TWVzc2FnZUJveCBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0NvbHVtbkVtcHR5TWVzc2FnZUJveC5qc1wiXG5pbXBvcnQgeyBDb250YWN0TGlzdEluZm8gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NvbnRhY3RzRnVuY3Rpb25hbGl0eS9Db250YWN0TW9kZWwuanNcIlxuaW1wb3J0IHsgQ09OVEFDVExJU1RfUFJFRklYIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL1JvdXRlQ2hhbmdlLmpzXCJcbmltcG9ydCB7IG1haWxMb2NhdG9yIH0gZnJvbSBcIi4uLy4uL21haWxMb2NhdG9yLmpzXCJcbmltcG9ydCB7IEJvdHRvbU5hdiB9IGZyb20gXCIuLi8uLi9ndWkvQm90dG9tTmF2LmpzXCJcbmltcG9ydCB7IFNpZGViYXJTZWN0aW9uUm93LCBTaWRlYmFyU2VjdGlvblJvd0F0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9TaWRlYmFyU2VjdGlvblJvd1wiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50RGV0ZWN0b3JcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcblxuZXhwb3J0IGludGVyZmFjZSBDb250YWN0Vmlld0F0dHJzIGV4dGVuZHMgVG9wTGV2ZWxBdHRycyB7XG5cdGRyYXdlckF0dHJzOiBEcmF3ZXJNZW51QXR0cnNcblx0aGVhZGVyOiBBcHBIZWFkZXJBdHRyc1xuXHRjb250YWN0Vmlld01vZGVsOiBDb250YWN0Vmlld01vZGVsXG5cdGNvbnRhY3RMaXN0Vmlld01vZGVsOiBDb250YWN0TGlzdFZpZXdNb2RlbFxufVxuXG5leHBvcnQgY2xhc3MgQ29udGFjdFZpZXcgZXh0ZW5kcyBCYXNlVG9wTGV2ZWxWaWV3IGltcGxlbWVudHMgVG9wTGV2ZWxWaWV3PENvbnRhY3RWaWV3QXR0cnM+IHtcblx0cHJpdmF0ZSBsaXN0Q29sdW1uOiBWaWV3Q29sdW1uXG5cdHByaXZhdGUgZm9sZGVyQ29sdW1uOiBWaWV3Q29sdW1uXG5cdHByaXZhdGUgdmlld1NsaWRlcjogVmlld1NsaWRlclxuXHRwcml2YXRlIGNvbnRhY3RWaWV3TW9kZWw6IENvbnRhY3RWaWV3TW9kZWxcblx0cHJpdmF0ZSBjb250YWN0TGlzdFZpZXdNb2RlbDogQ29udGFjdExpc3RWaWV3TW9kZWxcblx0cHJpdmF0ZSBkZXRhaWxzQ29sdW1uOiBWaWV3Q29sdW1uXG5cdHByaXZhdGUgaW52aXRhdGlvblJvd3M6IENoaWxkcmVuXG5cblx0b25jcmVhdGU6IFRvcExldmVsVmlld1tcIm9uY3JlYXRlXCJdXG5cdG9ucmVtb3ZlOiBUb3BMZXZlbFZpZXdbXCJvbnJlbW92ZVwiXVxuXG5cdGNvbnN0cnVjdG9yKHZub2RlOiBWbm9kZTxDb250YWN0Vmlld0F0dHJzPikge1xuXHRcdHN1cGVyKClcblx0XHR0aGlzLmNvbnRhY3RWaWV3TW9kZWwgPSB2bm9kZS5hdHRycy5jb250YWN0Vmlld01vZGVsXG5cdFx0dGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbCA9IHZub2RlLmF0dHJzLmNvbnRhY3RMaXN0Vmlld01vZGVsXG5cdFx0Ly8gc2FmZSB0byBjYWxsIG11bHRpcGxlIHRpbWVzIGJ1dCB3ZSBuZWVkIHRvIGRvIGl0IGVhcmx5IHRvIGxvYWQgdGhlIGNvbnRhY3QgbGlzdCBncm91cHNcblx0XHR0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLmluaXQoKVxuXG5cdFx0dGhpcy5mb2xkZXJDb2x1bW4gPSBuZXcgVmlld0NvbHVtbihcblx0XHRcdHtcblx0XHRcdFx0dmlldzogKCkgPT5cblx0XHRcdFx0XHRtKEZvbGRlckNvbHVtblZpZXcsIHtcblx0XHRcdFx0XHRcdGRyYXdlcjogdm5vZGUuYXR0cnMuZHJhd2VyQXR0cnMsXG5cdFx0XHRcdFx0XHRidXR0b246IHN0eWxlcy5pc1VzaW5nQm90dG9tTmF2aWdhdGlvbigpXG5cdFx0XHRcdFx0XHRcdD8gbnVsbFxuXHRcdFx0XHRcdFx0XHQ6IHtcblx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcIm5ld0NvbnRhY3RfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4gdGhpcy5jcmVhdGVOZXdDb250YWN0KCksXG5cdFx0XHRcdFx0XHRcdCAgfSxcblx0XHRcdFx0XHRcdGNvbnRlbnQ6IFtcblx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRTaWRlYmFyU2VjdGlvbixcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRuYW1lOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcImdyb3VwX2luZm9cIiwgZ2V0R3JvdXBJbmZvRGlzcGxheU5hbWUobG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyR3JvdXBJbmZvKSksXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnJlbmRlclNpZGViYXJFbGVtZW50cygpLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdGFyaWFMYWJlbDogXCJmb2xkZXJUaXRsZV9sYWJlbFwiLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0fSxcblx0XHRcdENvbHVtblR5cGUuRm9yZWdyb3VuZCxcblx0XHRcdHtcblx0XHRcdFx0bWluV2lkdGg6IHNpemUuZmlyc3RfY29sX21pbl93aWR0aCxcblx0XHRcdFx0bWF4V2lkdGg6IHNpemUuZmlyc3RfY29sX21heF93aWR0aCxcblx0XHRcdFx0aGVhZGVyQ2VudGVyOiBcImZvbGRlclRpdGxlX2xhYmVsXCIsXG5cdFx0XHR9LFxuXHRcdClcblxuXHRcdHRoaXMubGlzdENvbHVtbiA9IG5ldyBWaWV3Q29sdW1uKFxuXHRcdFx0e1xuXHRcdFx0XHR2aWV3OiAoKSA9PlxuXHRcdFx0XHRcdHRoaXMuaW5Db250YWN0TGlzdFZpZXcoKSA/IHRoaXMucmVuZGVyQ29udGFjdExpc3RSZWNpcGllbnRDb2x1bW4odm5vZGUuYXR0cnMuaGVhZGVyKSA6IHRoaXMucmVuZGVyQ29udGFjdExpc3RDb2x1bW4odm5vZGUuYXR0cnMuaGVhZGVyKSxcblx0XHRcdH0sXG5cdFx0XHRDb2x1bW5UeXBlLkJhY2tncm91bmQsXG5cdFx0XHR7XG5cdFx0XHRcdG1pbldpZHRoOiBzaXplLnNlY29uZF9jb2xfbWluX3dpZHRoLFxuXHRcdFx0XHRtYXhXaWR0aDogc2l6ZS5zZWNvbmRfY29sX21heF93aWR0aCxcblx0XHRcdFx0aGVhZGVyQ2VudGVyOiB0aGlzLmdldEhlYWRlckxhYmVsKCksXG5cdFx0XHR9LFxuXHRcdClcblxuXHRcdHRoaXMuZGV0YWlsc0NvbHVtbiA9IG5ldyBWaWV3Q29sdW1uKFxuXHRcdFx0e1xuXHRcdFx0XHR2aWV3OiAoKSA9PlxuXHRcdFx0XHRcdG0oQmFja2dyb3VuZENvbHVtbkxheW91dCwge1xuXHRcdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yOiB0aGVtZS5uYXZpZ2F0aW9uX2JnLFxuXHRcdFx0XHRcdFx0ZGVza3RvcFRvb2xiYXI6ICgpID0+IG0oRGVza3RvcFZpZXdlclRvb2xiYXIsIHRoaXMuZGV0YWlsc1ZpZXdlckFjdGlvbnMoKSksXG5cdFx0XHRcdFx0XHRtb2JpbGVIZWFkZXI6ICgpID0+XG5cdFx0XHRcdFx0XHRcdG0oTW9iaWxlSGVhZGVyLCB7XG5cdFx0XHRcdFx0XHRcdFx0Li4udm5vZGUuYXR0cnMuaGVhZGVyLFxuXHRcdFx0XHRcdFx0XHRcdGJhY2tBY3Rpb246ICgpID0+IHRoaXMudmlld1NsaWRlci5mb2N1c1ByZXZpb3VzQ29sdW1uKCksXG5cdFx0XHRcdFx0XHRcdFx0YWN0aW9uczogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRtdWx0aWNvbHVtbkFjdGlvbnM6ICgpID0+IHRoaXMuZGV0YWlsc1ZpZXdlckFjdGlvbnMoKSxcblx0XHRcdFx0XHRcdFx0XHRwcmltYXJ5QWN0aW9uOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5pbkNvbnRhY3RMaXN0VmlldygpID8gbnVsbCA6IHRoaXMucmVuZGVySGVhZGVyUmlnaHRWaWV3KClcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdHRpdGxlOiB0aGlzLmdldEhlYWRlckxhYmVsKCksXG5cdFx0XHRcdFx0XHRcdFx0Y29sdW1uVHlwZTogXCJvdGhlclwiLFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdGNvbHVtbkxheW91dDpcblx0XHRcdFx0XHRcdFx0Ly8gc2VlIGNvbW1lbnQgZm9yIC5zY3JvbGxiYXItZ3V0dGVyLXN0YWJsZS1vci1mYWxsYmFja1xuXHRcdFx0XHRcdFx0XHRtKFwiLmZpbGwtYWJzb2x1dGUuZmxleC5jb2wub3ZlcmZsb3cteS1zY3JvbGxcIiwgdGhpcy5yZW5kZXJEZXRhaWxzVmlld2VyKCkpLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0fSxcblx0XHRcdENvbHVtblR5cGUuQmFja2dyb3VuZCxcblx0XHRcdHtcblx0XHRcdFx0bWluV2lkdGg6IHNpemUudGhpcmRfY29sX21pbl93aWR0aCxcblx0XHRcdFx0bWF4V2lkdGg6IHNpemUudGhpcmRfY29sX21heF93aWR0aCxcblx0XHRcdFx0YXJpYUxhYmVsOiAoKSA9PiB0aGlzLmdldEhlYWRlckxhYmVsKCksXG5cdFx0XHR9LFxuXHRcdClcblxuXHRcdHRoaXMudmlld1NsaWRlciA9IG5ldyBWaWV3U2xpZGVyKFt0aGlzLmZvbGRlckNvbHVtbiwgdGhpcy5saXN0Q29sdW1uLCB0aGlzLmRldGFpbHNDb2x1bW5dKVxuXG5cdFx0Y29uc3Qgc2hvcnRjdXRzID0gdGhpcy5nZXRTaG9ydGN1dHMoKVxuXHRcdHRoaXMub25jcmVhdGUgPSAodm5vZGUpID0+IHtcblx0XHRcdGtleU1hbmFnZXIucmVnaXN0ZXJTaG9ydGN1dHMoc2hvcnRjdXRzKVxuXHRcdH1cblxuXHRcdHRoaXMub25yZW1vdmUgPSAoKSA9PiB7XG5cdFx0XHRrZXlNYW5hZ2VyLnVucmVnaXN0ZXJTaG9ydGN1dHMoc2hvcnRjdXRzKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQ29udGFjdExpc3RDb2x1bW4oaGVhZGVyOiBBcHBIZWFkZXJBdHRycykge1xuXHRcdHJldHVybiBtKEJhY2tncm91bmRDb2x1bW5MYXlvdXQsIHtcblx0XHRcdGJhY2tncm91bmRDb2xvcjogdGhlbWUubmF2aWdhdGlvbl9iZyxcblx0XHRcdGNvbHVtbkxheW91dDogbShDb250YWN0TGlzdFZpZXcsIHtcblx0XHRcdFx0Y29udGFjdFZpZXdNb2RlbDogdGhpcy5jb250YWN0Vmlld01vZGVsLFxuXHRcdFx0XHRvblNpbmdsZVNlbGVjdGlvbjogKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMudmlld1NsaWRlci5mb2N1cyh0aGlzLmRldGFpbHNDb2x1bW4pXG5cdFx0XHRcdH0sXG5cdFx0XHR9KSxcblx0XHRcdGRlc2t0b3BUb29sYmFyOiAoKSA9PiB0aGlzLnJlbmRlckxpc3RUb29sYmFyKCksXG5cdFx0XHRtb2JpbGVIZWFkZXI6ICgpID0+XG5cdFx0XHRcdHRoaXMuY29udGFjdFZpZXdNb2RlbC5saXN0TW9kZWwuc3RhdGUuaW5NdWx0aXNlbGVjdFxuXHRcdFx0XHRcdD8gbShNdWx0aXNlbGVjdE1vYmlsZUhlYWRlciwge1xuXHRcdFx0XHRcdFx0XHQuLi5zZWxlY3Rpb25BdHRyc0Zvckxpc3QodGhpcy5jb250YWN0Vmlld01vZGVsLmxpc3RNb2RlbCksXG5cdFx0XHRcdFx0XHRcdG1lc3NhZ2U6IGdldENvbnRhY3RTZWxlY3Rpb25NZXNzYWdlKHRoaXMuZ2V0U2VsZWN0ZWRDb250YWN0cygpLmxlbmd0aCksXG5cdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdDogbShNb2JpbGVIZWFkZXIsIHtcblx0XHRcdFx0XHRcdFx0Li4uaGVhZGVyLFxuXHRcdFx0XHRcdFx0XHRiYWNrQWN0aW9uOiAoKSA9PiB0aGlzLnZpZXdTbGlkZXIuZm9jdXNQcmV2aW91c0NvbHVtbigpLFxuXHRcdFx0XHRcdFx0XHRjb2x1bW5UeXBlOiBcImZpcnN0XCIsXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiB0aGlzLmxpc3RDb2x1bW4uZ2V0VGl0bGUoKSxcblx0XHRcdFx0XHRcdFx0YWN0aW9uczogbShcIi5mbGV4XCIsIFtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnJlbmRlclNvcnRCeUJ1dHRvbigpLFxuXHRcdFx0XHRcdFx0XHRcdG0oRW50ZXJNdWx0aXNlbGVjdEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNsaWNrQWN0aW9uOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuY29udGFjdFZpZXdNb2RlbC5saXN0TW9kZWwuZW50ZXJNdWx0aXNlbGVjdCgpXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRcdFx0cHJpbWFyeUFjdGlvbjogKCkgPT4gdGhpcy5yZW5kZXJIZWFkZXJSaWdodFZpZXcoKSxcblx0XHRcdFx0XHQgIH0pLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckNvbnRhY3RMaXN0UmVjaXBpZW50Q29sdW1uKGhlYWRlcjogQXBwSGVhZGVyQXR0cnMpIHtcblx0XHRyZXR1cm4gbShCYWNrZ3JvdW5kQ29sdW1uTGF5b3V0LCB7XG5cdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lLm5hdmlnYXRpb25fYmcsXG5cdFx0XHRjb2x1bW5MYXlvdXQ6IG0oQ29udGFjdExpc3RSZWNpcGllbnRWaWV3LCB7XG5cdFx0XHRcdHZpZXdNb2RlbDogdGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbCxcblx0XHRcdFx0Zm9jdXNEZXRhaWxzVmlld2VyOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy52aWV3U2xpZGVyLmZvY3VzKHRoaXMuZGV0YWlsc0NvbHVtbilcblx0XHRcdFx0fSxcblx0XHRcdH0pLFxuXHRcdFx0ZGVza3RvcFRvb2xiYXI6ICgpID0+IHRoaXMucmVuZGVyTGlzdFRvb2xiYXIoKSxcblx0XHRcdG1vYmlsZUhlYWRlcjogKCkgPT5cblx0XHRcdFx0dGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5saXN0TW9kZWw/LnN0YXRlLmluTXVsdGlzZWxlY3Rcblx0XHRcdFx0XHQ/IG0oTXVsdGlzZWxlY3RNb2JpbGVIZWFkZXIsIHtcblx0XHRcdFx0XHRcdFx0Li4uc2VsZWN0aW9uQXR0cnNGb3JMaXN0KHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwubGlzdE1vZGVsKSxcblx0XHRcdFx0XHRcdFx0bWVzc2FnZTogZ2V0Q29udGFjdFNlbGVjdGlvbk1lc3NhZ2UodGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5saXN0TW9kZWw/LmdldFNlbGVjdGVkQXNBcnJheSgpLmxlbmd0aCksXG5cdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdDogbShNb2JpbGVIZWFkZXIsIHtcblx0XHRcdFx0XHRcdFx0Li4uaGVhZGVyLFxuXHRcdFx0XHRcdFx0XHRiYWNrQWN0aW9uOiAoKSA9PiB0aGlzLnZpZXdTbGlkZXIuZm9jdXNQcmV2aW91c0NvbHVtbigpLFxuXHRcdFx0XHRcdFx0XHRjb2x1bW5UeXBlOiBcImZpcnN0XCIsXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiB0aGlzLmxpc3RDb2x1bW4uZ2V0VGl0bGUoKSxcblx0XHRcdFx0XHRcdFx0YWN0aW9uczogbShcIi5mbGV4XCIsIFtcblx0XHRcdFx0XHRcdFx0XHRtKEVudGVyTXVsdGlzZWxlY3RJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRjbGlja0FjdGlvbjogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLmxpc3RNb2RlbD8uZW50ZXJNdWx0aXNlbGVjdCgpXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRcdFx0cHJpbWFyeUFjdGlvbjogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGlmICh0aGlzLmNhbkVkaXRTZWxlY3RlZENvbnRhY3RMaXN0KCkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGl0bGU6IFwiYWRkRW50cmllc19hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHRoaXMuYWRkQWRkcmVzc2VzVG9Db250YWN0TGlzdCgpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5BZGQsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQgIH0pLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGNhbkVkaXRTZWxlY3RlZENvbnRhY3RMaXN0KCk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IGNvbnRhY3RMaXN0SW5mbyA9IHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwuZ2V0U2VsZWN0ZWRDb250YWN0TGlzdEluZm8oKVxuXHRcdHJldHVybiBjb250YWN0TGlzdEluZm8gIT0gbnVsbCAmJiBjb250YWN0TGlzdEluZm8uY2FuRWRpdFxuXHR9XG5cblx0cHJpdmF0ZSBkZXRhaWxzVmlld2VyQWN0aW9ucygpOiBDaGlsZHJlbiB7XG5cdFx0aWYgKHRoaXMuaW5Db250YWN0TGlzdFZpZXcoKSkge1xuXHRcdFx0Y29uc3QgcmVjaXBpZW50cyA9IHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwuZ2V0U2VsZWN0ZWRDb250YWN0TGlzdEVudHJpZXMoKVxuXHRcdFx0aWYgKHJlY2lwaWVudHMgJiYgcmVjaXBpZW50cy5sZW5ndGggPiAwICYmIHRoaXMuY2FuRWRpdFNlbGVjdGVkQ29udGFjdExpc3QoKSkge1xuXHRcdFx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0dGl0bGU6IFwiZGVsZXRlX2FjdGlvblwiLFxuXHRcdFx0XHRcdGljb246IEljb25zLlRyYXNoLFxuXHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLmRlbGV0ZUNvbnRhY3RMaXN0RW50cmllcyhyZWNpcGllbnRzKSxcblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgY29udGFjdHMgPSB0aGlzLmdldFNlbGVjdGVkQ29udGFjdHMoKVxuXHRcdFx0cmV0dXJuIG0oQ29udGFjdFZpZXdlckFjdGlvbnMsIHtcblx0XHRcdFx0Y29udGFjdHMsXG5cdFx0XHRcdG9uRWRpdDogKGMpID0+IHRoaXMuZWRpdENvbnRhY3QoYyksXG5cdFx0XHRcdG9uRXhwb3J0OiBleHBvcnRDb250YWN0cyxcblx0XHRcdFx0b25EZWxldGU6IChjb250YWN0czogQ29udGFjdFtdKSA9PiBkZWxldGVDb250YWN0cyhjb250YWN0cywgKCkgPT4gdGhpcy5jb250YWN0Vmlld01vZGVsLmxpc3RNb2RlbC5zZWxlY3ROb25lKCkpLFxuXHRcdFx0XHRvbk1lcmdlOiBjb25maXJtTWVyZ2UsXG5cdFx0XHR9KVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgaW5Db250YWN0TGlzdFZpZXcoKSB7XG5cdFx0cmV0dXJuIG0ucm91dGUuZ2V0KCkuc3RhcnRzV2l0aChDT05UQUNUTElTVF9QUkVGSVgpXG5cdH1cblxuXHRwcml2YXRlIHNob3dpbmdMaXN0VmlldygpIHtcblx0XHRyZXR1cm4gdGhpcy5pbkNvbnRhY3RMaXN0VmlldygpXG5cdFx0XHQ/IHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwuZ2V0U2VsZWN0ZWRDb250YWN0TGlzdEVudHJpZXMoKT8ubGVuZ3RoID09PSAwIHx8IHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwubGlzdE1vZGVsPy5zdGF0ZS5pbk11bHRpc2VsZWN0XG5cdFx0XHQ6IHRoaXMuZ2V0U2VsZWN0ZWRDb250YWN0cygpLmxlbmd0aCA9PT0gMCB8fCB0aGlzLmNvbnRhY3RWaWV3TW9kZWwubGlzdE1vZGVsLnN0YXRlLmluTXVsdGlzZWxlY3Rcblx0fVxuXG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxDb250YWN0Vmlld0F0dHJzPik6IENoaWxkcmVuIHtcblx0XHR0aGlzLmdldENvbnRhY3RMaXN0SW52aXRhdGlvblJvd3MoKVxuXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIiNjb250YWN0Lm1haW4tdmlld1wiLFxuXHRcdFx0bSh0aGlzLnZpZXdTbGlkZXIsIHtcblx0XHRcdFx0aGVhZGVyOiBzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKVxuXHRcdFx0XHRcdD8gbnVsbFxuXHRcdFx0XHRcdDogbShIZWFkZXIsIHtcblx0XHRcdFx0XHRcdFx0c2VhcmNoQmFyOiAoKSA9PlxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuaW5Db250YWN0TGlzdFZpZXcoKVxuXHRcdFx0XHRcdFx0XHRcdFx0PyBudWxsXG5cdFx0XHRcdFx0XHRcdFx0XHQ6IG0oTGF6eVNlYXJjaEJhciwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHBsYWNlaG9sZGVyOiBsYW5nLmdldChcInNlYXJjaENvbnRhY3RzX3BsYWNlaG9sZGVyXCIpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRpc2FibGVkOiAhbG9jYXRvci5sb2dpbnMuaXNGdWxseUxvZ2dlZEluKCksXG5cdFx0XHRcdFx0XHRcdFx0XHQgIH0pLFxuXHRcdFx0XHRcdFx0XHQuLi5hdHRycy5oZWFkZXIsXG5cdFx0XHRcdFx0ICB9KSxcblx0XHRcdFx0Ym90dG9tTmF2OlxuXHRcdFx0XHRcdHN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpICYmIHRoaXMudmlld1NsaWRlci5mb2N1c2VkQ29sdW1uID09PSB0aGlzLmRldGFpbHNDb2x1bW4gJiYgIXRoaXMuc2hvd2luZ0xpc3RWaWV3KClcblx0XHRcdFx0XHRcdD8gdGhpcy5pbkNvbnRhY3RMaXN0VmlldygpXG5cdFx0XHRcdFx0XHRcdD8gbShNb2JpbGVBY3Rpb25CYXIsIHtcblx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbnM6IHRoaXMuY2FuRWRpdFNlbGVjdGVkQ29udGFjdExpc3QoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQ/IFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuVHJhc2gsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRpdGxlOiBcImRlbGV0ZV9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YWN0aW9uOiAoKSA9PiB0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLmRlbGV0ZVNlbGVjdGVkRW50cmllcygpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0ICBdXG5cdFx0XHRcdFx0XHRcdFx0XHRcdDogW10sXG5cdFx0XHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHRcdFx0OiBtKE1vYmlsZUFjdGlvbkJhciwge1xuXHRcdFx0XHRcdFx0XHRcdFx0YWN0aW9uczogW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuRWRpdCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aXRsZTogXCJlZGl0X2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbjogKCkgPT4gdGhpcy5lZGl0U2VsZWN0ZWRDb250YWN0KCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5UcmFzaCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aXRsZTogXCJkZWxldGVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YWN0aW9uOiAoKSA9PiB0aGlzLmRlbGV0ZVNlbGVjdGVkQ29udGFjdHMoKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHRcdDogKHN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpICYmXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy52aWV3U2xpZGVyLmZvY3VzZWRDb2x1bW4gPT09IHRoaXMubGlzdENvbHVtbiAmJlxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuY29udGFjdFZpZXdNb2RlbC5saXN0TW9kZWwuc3RhdGUuaW5NdWx0aXNlbGVjdCkgfHxcblx0XHRcdFx0XHRcdCAgdGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5saXN0TW9kZWw/LnN0YXRlLmluTXVsdGlzZWxlY3Rcblx0XHRcdFx0XHRcdD8gbShNb2JpbGVCb3R0b21BY3Rpb25CYXIsIHRoaXMuZGV0YWlsc1ZpZXdlckFjdGlvbnMoKSlcblx0XHRcdFx0XHRcdDogbShCb3R0b21OYXYpLFxuXHRcdFx0fSksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRIZWFkZXJMYWJlbCgpOiBUcmFuc2xhdGlvbktleSB7XG5cdFx0aWYgKHRoaXMuaW5Db250YWN0TGlzdFZpZXcoKSkge1xuXHRcdFx0cmV0dXJuIFwiY29udGFjdExpc3RzX2xhYmVsXCJcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwiY29udGFjdHNfbGFiZWxcIlxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgZ2V0U2VsZWN0ZWRDb250YWN0cygpIHtcblx0XHRyZXR1cm4gdGhpcy5jb250YWN0Vmlld01vZGVsLmxpc3RNb2RlbC5nZXRTZWxlY3RlZEFzQXJyYXkoKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBnZXRDb250YWN0TGlzdElkKCk6IFByb21pc2U8SWQgfCBudWxsPiB7XG5cdFx0aWYgKHRoaXMuaW5Db250YWN0TGlzdFZpZXcoKSkge1xuXHRcdFx0cmV0dXJuIGFzc2VydE5vdE51bGwoYXdhaXQgdGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5nZXRDb250YWN0TGlzdElkKCkpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLmNvbnRhY3RWaWV3TW9kZWwuY29udGFjdExpc3RJZFxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGNyZWF0ZU5ld0NvbnRhY3QoKSB7XG5cdFx0Y29uc3QgbGlzdElkID0gYXdhaXQgdGhpcy5nZXRDb250YWN0TGlzdElkKClcblx0XHRpZiAobGlzdElkKSB7XG5cdFx0XHRuZXcgQ29udGFjdEVkaXRvcihsb2NhdG9yLmVudGl0eUNsaWVudCwgbnVsbCwgbGlzdElkKS5zaG93KClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGVkaXRTZWxlY3RlZENvbnRhY3QoKSB7XG5cdFx0Y29uc3QgZmlyc3RTZWxlY3RlZCA9IHRoaXMuZ2V0U2VsZWN0ZWRDb250YWN0cygpWzBdXG5cdFx0aWYgKCFmaXJzdFNlbGVjdGVkKSByZXR1cm5cblx0XHR0aGlzLmVkaXRDb250YWN0KGZpcnN0U2VsZWN0ZWQpXG5cdH1cblxuXHRwcml2YXRlIGVkaXRDb250YWN0KGNvbnRhY3Q6IENvbnRhY3QsIGxpc3RJZD86IElkKSB7XG5cdFx0bmV3IENvbnRhY3RFZGl0b3IobG9jYXRvci5lbnRpdHlDbGllbnQsIGNvbnRhY3QsIGxpc3RJZCkuc2hvdygpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckhlYWRlclJpZ2h0VmlldygpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwibmV3Q29udGFjdF9hY3Rpb25cIixcblx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLmNyZWF0ZU5ld0NvbnRhY3QoKSxcblx0XHRcdGljb246IEljb25zLkFkZCxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJEZXRhaWxzVmlld2VyKCk6IENoaWxkcmVuIHtcblx0XHRpZiAodGhpcy5pbkNvbnRhY3RMaXN0VmlldygpKSB7XG5cdFx0XHRjb25zdCBlbnRyaWVzID0gdGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5nZXRTZWxlY3RlZENvbnRhY3RMaXN0RW50cmllcygpID8/IFtdXG5cdFx0XHRyZXR1cm4gdGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5saXN0TW9kZWwgPT0gbnVsbCB8fCB0aGlzLnNob3dpbmdMaXN0VmlldygpXG5cdFx0XHRcdD8gbShDb2x1bW5FbXB0eU1lc3NhZ2VCb3gsIHtcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IGdldENvbnRhY3RMaXN0RW50cmllc1NlbGVjdGlvbk1lc3NhZ2UoZW50cmllcyksXG5cdFx0XHRcdFx0XHRpY29uOiBJY29ucy5QZW9wbGUsXG5cdFx0XHRcdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9tZXNzYWdlX2JnLFxuXHRcdFx0XHRcdFx0Ym90dG9tQ29udGVudDpcblx0XHRcdFx0XHRcdFx0ZW50cmllcy5sZW5ndGggPiAwXG5cdFx0XHRcdFx0XHRcdFx0PyBtKEJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJjYW5jZWxfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4gdGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5saXN0TW9kZWw/LnNlbGVjdE5vbmUoKSxcblx0XHRcdFx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yOiB0aGVtZS5uYXZpZ2F0aW9uX2JnLFxuXHRcdFx0XHQgIH0pXG5cdFx0XHRcdDogbShDb250YWN0TGlzdEVudHJ5Vmlld2VyLCB7XG5cdFx0XHRcdFx0XHRlbnRyeTogZ2V0Rmlyc3RPclRocm93KGVudHJpZXMpLFxuXHRcdFx0XHRcdFx0Y29udGFjdHM6IHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwuY29udGFjdHNGb3JTZWxlY3RlZEVudHJ5LFxuXHRcdFx0XHRcdFx0Y29udGFjdEVkaXQ6IChjOiBDb250YWN0KSA9PiB0aGlzLmVkaXRDb250YWN0KGMpLFxuXHRcdFx0XHRcdFx0Y29udGFjdERlbGV0ZTogZGVsZXRlQ29udGFjdHMsXG5cdFx0XHRcdFx0XHRjb250YWN0Q3JlYXRlOiBhc3luYyAoYzogQ29udGFjdCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBsaXN0SWQgPSBhd2FpdCB0aGlzLmdldENvbnRhY3RMaXN0SWQoKVxuXHRcdFx0XHRcdFx0XHRpZiAobGlzdElkKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5lZGl0Q29udGFjdChjLCBsaXN0SWQpXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRvbldyaXRlTWFpbDogd3JpdGVNYWlsLFxuXHRcdFx0XHRcdFx0c2VsZWN0Tm9uZTogKCkgPT4gdGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5saXN0TW9kZWw/LnNlbGVjdE5vbmUoKSxcblx0XHRcdFx0ICB9KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBjb250YWN0cyA9IHRoaXMuZ2V0U2VsZWN0ZWRDb250YWN0cygpXG5cdFx0XHRyZXR1cm4gdGhpcy5zaG93aW5nTGlzdFZpZXcoKVxuXHRcdFx0XHQ/IG0oTXVsdGlDb250YWN0Vmlld2VyLCB7XG5cdFx0XHRcdFx0XHRzZWxlY3RlZEVudGl0aWVzOiBjb250YWN0cyxcblx0XHRcdFx0XHRcdHNlbGVjdE5vbmU6ICgpID0+IHRoaXMuY29udGFjdFZpZXdNb2RlbC5saXN0TW9kZWwuc2VsZWN0Tm9uZSgpLFxuXHRcdFx0XHQgIH0pXG5cdFx0XHRcdDogbShDb250YWN0Q2FyZFZpZXdlciwge1xuXHRcdFx0XHRcdFx0Y29udGFjdDogY29udGFjdHNbMF0sXG5cdFx0XHRcdFx0XHRvbldyaXRlTWFpbDogd3JpdGVNYWlsLFxuXHRcdFx0XHQgIH0pXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRTaG9ydGN1dHMoKSB7XG5cdFx0bGV0IHNob3J0Y3V0czogU2hvcnRjdXRbXSA9IFtcblx0XHRcdC4uLmxpc3RTZWxlY3Rpb25LZXlib2FyZFNob3J0Y3V0cyhNdWx0aXNlbGVjdE1vZGUuRW5hYmxlZCwgKCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5pbkNvbnRhY3RMaXN0VmlldygpID8gdGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5saXN0TW9kZWwgOiB0aGlzLmNvbnRhY3RWaWV3TW9kZWwubGlzdE1vZGVsXG5cdFx0XHR9KSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLkRFTEVURSxcblx0XHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRcdGlmICh0aGlzLmluQ29udGFjdExpc3RWaWV3KCkpIHtcblx0XHRcdFx0XHRcdHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwuZGVsZXRlU2VsZWN0ZWRFbnRyaWVzKClcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5kZWxldGVTZWxlY3RlZENvbnRhY3RzKClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJkZWxldGVDb250YWN0c19hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5CQUNLU1BBQ0UsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHRpZiAodGhpcy5pbkNvbnRhY3RMaXN0VmlldygpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLmRlbGV0ZVNlbGVjdGVkRW50cmllcygpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRoaXMuZGVsZXRlU2VsZWN0ZWRDb250YWN0cygpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlbHA6IFwiZGVsZXRlQ29udGFjdHNfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuTixcblx0XHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuY3JlYXRlTmV3Q29udGFjdCgpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlbHA6IFwibmV3Q29udGFjdF9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XVxuXG5cdFx0cmV0dXJuIHNob3J0Y3V0c1xuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJTaWRlYmFyRWxlbWVudHMoKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBbXG5cdFx0XHRtKFNpZGViYXJTZWN0aW9uUm93LCB7XG5cdFx0XHRcdGljb246IEJvb3RJY29ucy5Db250YWN0cyxcblx0XHRcdFx0bGFiZWw6IFwiYWxsX2NvbnRhY3RzX2xhYmVsXCIsXG5cdFx0XHRcdHBhdGg6IGAvY29udGFjdGAsXG5cdFx0XHRcdG9uQ2xpY2s6ICgpID0+IHRoaXMudmlld1NsaWRlci5mb2N1cyh0aGlzLmxpc3RDb2x1bW4pLFxuXHRcdFx0XHRtb3JlQnV0dG9uOiB0aGlzLmNyZWF0ZU1vcmVCdXR0b25BdHRycygpLFxuXHRcdFx0XHRhbHdheXNTaG93TW9yZUJ1dHRvbjogY2xpZW50LmlzTW9iaWxlRGV2aWNlKCksXG5cdFx0XHR9IHNhdGlzZmllcyBTaWRlYmFyU2VjdGlvblJvd0F0dHJzKSxcblx0XHRcdG0oXG5cdFx0XHRcdFNpZGViYXJTZWN0aW9uLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZTogXCJjb250YWN0TGlzdHNfbGFiZWxcIixcblx0XHRcdFx0XHRidXR0b246IG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuQWRkLFxuXHRcdFx0XHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdFx0XHRcdFx0dGl0bGU6IFwiYWRkQ29udGFjdExpc3RfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmFkZENvbnRhY3RMaXN0KClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHR0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLmdldE93bkNvbnRhY3RMaXN0SW5mb3MoKS5tYXAoKGNsKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJDb250YWN0TGlzdFJvdyhjbCwgZmFsc2UpXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdF0sXG5cdFx0XHQpLFxuXHRcdFx0dGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5nZXRTaGFyZWRDb250YWN0TGlzdEluZm9zKCkubGVuZ3RoID4gMFxuXHRcdFx0XHQ/IG0oXG5cdFx0XHRcdFx0XHRcIlwiLFxuXHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0U2lkZWJhclNlY3Rpb24sXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRuYW1lOiBcInNoYXJlZENvbnRhY3RMaXN0c19sYWJlbFwiLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHR0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLmdldFNoYXJlZENvbnRhY3RMaXN0SW5mb3MoKS5tYXAoKGNsKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyQ29udGFjdExpc3RSb3coY2wsIHRydWUpXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0ICApXG5cdFx0XHRcdDogbnVsbCxcblx0XHRcdHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwuZ2V0Q29udGFjdExpc3RJbnZpdGF0aW9ucygpLmxlbmd0aCA+IDBcblx0XHRcdFx0PyBtKFxuXHRcdFx0XHRcdFx0U2lkZWJhclNlY3Rpb24sXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG5hbWU6IFwiY29udGFjdExpc3RJbnZpdGF0aW9uc19sYWJlbFwiLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHRoaXMuaW52aXRhdGlvblJvd3MsXG5cdFx0XHRcdCAgKVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRDb250YWN0TGlzdEludml0YXRpb25Sb3dzKCkge1xuXHRcdGltcG9ydChcIi4uLy4uLy4uL2NvbW1vbi9zaGFyaW5nL3ZpZXcvR3JvdXBJbnZpdGF0aW9uRm9sZGVyUm93LmpzXCIpXG5cdFx0XHQudGhlbigoeyBHcm91cEludml0YXRpb25Gb2xkZXJSb3cgfSkgPT4ge1xuXHRcdFx0XHR0aGlzLmludml0YXRpb25Sb3dzID0gdGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5nZXRDb250YWN0TGlzdEludml0YXRpb25zKCkubWFwKChpbnZpdGF0aW9uKSA9PlxuXHRcdFx0XHRcdG0oR3JvdXBJbnZpdGF0aW9uRm9sZGVyUm93LCB7XG5cdFx0XHRcdFx0XHRpbnZpdGF0aW9uLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpXG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4obS5yZWRyYXcpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckZvbGRlck1vcmVCdXR0b24oKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKEljb25CdXR0b24sIHRoaXMuY3JlYXRlTW9yZUJ1dHRvbkF0dHJzKCkpXG5cdH1cblxuXHRwcml2YXRlIGNyZWF0ZU1vcmVCdXR0b25BdHRycygpOiBJY29uQnV0dG9uQXR0cnMge1xuXHRcdHJldHVybiBhdHRhY2hEcm9wZG93bih7XG5cdFx0XHRtYWluQnV0dG9uQXR0cnM6IHtcblx0XHRcdFx0dGl0bGU6IFwibW9yZV9sYWJlbFwiLFxuXHRcdFx0XHRpY29uOiBJY29ucy5Nb3JlLFxuXHRcdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0XHRcdGNvbG9yczogQnV0dG9uQ29sb3IuTmF2LFxuXHRcdFx0fSxcblx0XHRcdGNoaWxkQXR0cnM6ICgpID0+IHtcblx0XHRcdFx0Y29uc3QgdmNhcmRCdXR0b25zOiBBcnJheTxEcm9wZG93bkJ1dHRvbkF0dHJzPiA9IGlzQXBwKClcblx0XHRcdFx0XHQ/IFtcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImltcG9ydENvbnRhY3RzX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IGltcG9ydENvbnRhY3RzKCksXG5cdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuQ29udGFjdEltcG9ydCxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQgIF1cblx0XHRcdFx0XHQ6IFtcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImV4cG9ydFZDYXJkX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBleHBvcnRBc1ZDYXJkKGxvY2F0b3IuY29udGFjdE1vZGVsKSxcblx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5FeHBvcnQsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ICBdXG5cblx0XHRcdFx0cmV0dXJuIHZjYXJkQnV0dG9ucy5jb25jYXQoW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImltcG9ydFZDYXJkX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IGltcG9ydEFzVkNhcmQoKSxcblx0XHRcdFx0XHRcdGljb246IEljb25zLkNvbnRhY3RJbXBvcnQsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJtZXJnZV9hY3Rpb25cIixcblx0XHRcdFx0XHRcdGljb246IEljb25zLlBlb3BsZSxcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLl9tZXJnZUFjdGlvbigpLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdF0pXG5cdFx0XHR9LFxuXHRcdFx0d2lkdGg6IDI1MCxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJDb250YWN0TGlzdFJvdyhjb250YWN0TGlzdEluZm86IENvbnRhY3RMaXN0SW5mbywgc2hhcmVkOiBib29sZWFuKSB7XG5cdFx0Y29uc3QgY29udGFjdExpc3RCdXR0b246IE5hdkJ1dHRvbkF0dHJzID0ge1xuXHRcdFx0bGFiZWw6IGxhbmcubWFrZVRyYW5zbGF0aW9uKFwiY29udGFjdExpc3ROYW1lX2xhYmVsXCIsIGNvbnRhY3RMaXN0SW5mby5uYW1lKSxcblx0XHRcdGljb246ICgpID0+IEljb25zLlBlb3BsZSxcblx0XHRcdGhyZWY6ICgpID0+IGAke0NPTlRBQ1RMSVNUX1BSRUZJWH0vJHtjb250YWN0TGlzdEluZm8uZ3JvdXBSb290LmVudHJpZXN9YCxcblx0XHRcdGRpc2FibGVIb3ZlckJhY2tncm91bmQ6IHRydWUsXG5cdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLnVwZGF0ZVNlbGVjdGVkQ29udGFjdExpc3QoY29udGFjdExpc3RJbmZvLmdyb3VwUm9vdC5lbnRyaWVzKVxuXHRcdFx0XHR0aGlzLnZpZXdTbGlkZXIuZm9jdXModGhpcy5saXN0Q29sdW1uKVxuXHRcdFx0fSxcblx0XHR9XG5cblx0XHRjb25zdCBtb3JlQnV0dG9uID0gdGhpcy5jcmVhdGVDb250YWN0TGlzdE1vcmVCdXR0b24oY29udGFjdExpc3RJbmZvLCBzaGFyZWQpXG5cblx0XHRyZXR1cm4gbShTaWRlYmFyU2VjdGlvblJvdywge1xuXHRcdFx0aWNvbjogSWNvbnMuUGVvcGxlLFxuXHRcdFx0bGFiZWw6IGxhbmcubWFrZVRyYW5zbGF0aW9uKFwiY29udGFjdGxpc3RfbmFtZVwiLCBjb250YWN0TGlzdEluZm8ubmFtZSksXG5cdFx0XHRwYXRoOiBgJHtDT05UQUNUTElTVF9QUkVGSVh9LyR7Y29udGFjdExpc3RJbmZvLmdyb3VwUm9vdC5lbnRyaWVzfWAsXG5cdFx0XHRvbkNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwudXBkYXRlU2VsZWN0ZWRDb250YWN0TGlzdChjb250YWN0TGlzdEluZm8uZ3JvdXBSb290LmVudHJpZXMpXG5cdFx0XHRcdHRoaXMudmlld1NsaWRlci5mb2N1cyh0aGlzLmxpc3RDb2x1bW4pXG5cdFx0XHR9LFxuXHRcdFx0bW9yZUJ1dHRvbjogbW9yZUJ1dHRvbixcblx0XHR9IHNhdGlzZmllcyBTaWRlYmFyU2VjdGlvblJvd0F0dHJzKVxuXHR9XG5cblx0Y3JlYXRlQ29udGFjdExpc3RNb3JlQnV0dG9uKGNvbnRhY3RMaXN0SW5mbzogQ29udGFjdExpc3RJbmZvLCBzaGFyZWQ6IGJvb2xlYW4pOiBJY29uQnV0dG9uQXR0cnMge1xuXHRcdHJldHVybiBhdHRhY2hEcm9wZG93bih7XG5cdFx0XHRtYWluQnV0dG9uQXR0cnM6IHtcblx0XHRcdFx0dGl0bGU6IFwibW9yZV9sYWJlbFwiLFxuXHRcdFx0XHRpY29uOiBJY29ucy5Nb3JlLFxuXHRcdFx0XHRjb2xvcnM6IEJ1dHRvbkNvbG9yLk5hdixcblx0XHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdFx0fSxcblx0XHRcdGNoaWxkQXR0cnM6ICgpID0+IHtcblx0XHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJlZGl0X2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuRWRpdCxcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHNob3dDb250YWN0TGlzdE5hbWVFZGl0b3IoY29udGFjdExpc3RJbmZvLm5hbWUsIChuZXdOYW1lKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHNoYXJlZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5lZGl0U2hhcmVkQ29udGFjdExpc3QoY29udGFjdExpc3RJbmZvLCBuZXdOYW1lKVxuXHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLnVwZGF0ZUNvbnRhY3RMaXN0KGNvbnRhY3RMaXN0SW5mbywgbmV3TmFtZSwgW10pXG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcInNoYXJpbmdfbGFiZWxcIixcblx0XHRcdFx0XHRcdGljb246IEljb25zLkNvbnRhY3RJbXBvcnQsXG5cdFx0XHRcdFx0XHRjbGljazogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCB7IHNob3dHcm91cFNoYXJpbmdEaWFsb2cgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uL2NvbW1vbi9zaGFyaW5nL3ZpZXcvR3JvdXBTaGFyaW5nRGlhbG9nLmpzXCIpXG5cdFx0XHRcdFx0XHRcdHNob3dHcm91cFNoYXJpbmdEaWFsb2coY29udGFjdExpc3RJbmZvLmdyb3VwSW5mbywgdHJ1ZSlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRjb250YWN0TGlzdEluZm8uaXNPd25lclxuXHRcdFx0XHRcdFx0PyB7XG5cdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwiZGVsZXRlX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdGljb246IEljb25zLlRyYXNoLFxuXHRcdFx0XHRcdFx0XHRcdGNsaWNrOiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoYXdhaXQgRGlhbG9nLmNvbmZpcm0oXCJjb25maXJtRGVsZXRlQ29udGFjdExpc3RfbXNnXCIpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwuZGVsZXRlQ29udGFjdExpc3QoY29udGFjdExpc3RJbmZvKVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHRcdDoge1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImxlYXZlR3JvdXBfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuVHJhc2gsXG5cdFx0XHRcdFx0XHRcdFx0Y2xpY2s6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgRGlhbG9nLmNvbmZpcm0oXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGFuZy5tYWtlVHJhbnNsYXRpb24oXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcImNvbmZpcm1fbXNnXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsYW5nLmdldChcImNvbmZpcm1MZWF2ZVNoYXJlZEdyb3VwX21zZ1wiLCB7IFwie2dyb3VwTmFtZX1cIjogY29udGFjdExpc3RJbmZvLm5hbWUgfSksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLnJlbW92ZVVzZXJGcm9tQ29udGFjdExpc3QoY29udGFjdExpc3RJbmZvKVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHQgIH0sXG5cdFx0XHRcdF1cblx0XHRcdH0sXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgZWRpdFNoYXJlZENvbnRhY3RMaXN0KGNvbnRhY3RMaXN0SW5mbzogQ29udGFjdExpc3RJbmZvLCBuZXdOYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCB7IHVzZXJTZXR0aW5nc0dyb3VwUm9vdCB9ID0gbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKVxuXHRcdGNvbnN0IGV4aXN0aW5nR3JvdXBTZXR0aW5ncyA9IHVzZXJTZXR0aW5nc0dyb3VwUm9vdC5ncm91cFNldHRpbmdzLmZpbmQoKGdjKSA9PiBnYy5ncm91cCA9PT0gY29udGFjdExpc3RJbmZvLmdyb3VwSW5mby5ncm91cCkgPz8gbnVsbFxuXG5cdFx0aWYgKGV4aXN0aW5nR3JvdXBTZXR0aW5ncykge1xuXHRcdFx0ZXhpc3RpbmdHcm91cFNldHRpbmdzLm5hbWUgPSBuZXdOYW1lXG5cdFx0fVxuXG5cdFx0bG9jYXRvci5lbnRpdHlDbGllbnQudXBkYXRlKHVzZXJTZXR0aW5nc0dyb3VwUm9vdClcblx0XHQvLyBVcGRhdGluZyB0aGUgY29udGFjdExpc3RJbmZvLm5hbWUgZGlyZWN0bHksIHNvIGl0IHVwZGF0ZXMgZm9yIHRoZSB1c2VyIHJpZ2h0IGF3YXlcblx0XHRjb250YWN0TGlzdEluZm8ubmFtZSA9IG5ld05hbWVcblx0fVxuXG5cdF9tZXJnZUFjdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gc2hvd1Byb2dyZXNzRGlhbG9nKFxuXHRcdFx0XCJwbGVhc2VXYWl0X21zZ1wiLFxuXHRcdFx0bG9jYXRvci5jb250YWN0TW9kZWwuZ2V0Q29udGFjdExpc3RJZCgpLnRoZW4oKGNvbnRhY3RMaXN0SWQpID0+IHtcblx0XHRcdFx0cmV0dXJuIGNvbnRhY3RMaXN0SWQgPyBsb2NhdG9yLmVudGl0eUNsaWVudC5sb2FkQWxsKENvbnRhY3RUeXBlUmVmLCBjb250YWN0TGlzdElkKSA6IFtdXG5cdFx0XHR9KSxcblx0XHQpLnRoZW4oKGFsbENvbnRhY3RzKSA9PiB7XG5cdFx0XHRpZiAoYWxsQ29udGFjdHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwibm9Db250YWN0c19tc2dcIilcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxldCBtZXJnZWFibGVBbmREdXBsaWNhdGVzID0gZ2V0TWVyZ2VhYmxlQ29udGFjdHMoYWxsQ29udGFjdHMpXG5cdFx0XHRcdGxldCBkZWxldGVQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKClcblxuXHRcdFx0XHRpZiAobWVyZ2VhYmxlQW5kRHVwbGljYXRlcy5kZWxldGFibGUubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdGRlbGV0ZVByb21pc2UgPSBEaWFsb2cuY29uZmlybShcblx0XHRcdFx0XHRcdGxhbmcubWFrZVRyYW5zbGF0aW9uKFxuXHRcdFx0XHRcdFx0XHRcImNvbmZpcm1fbXNnXCIsXG5cdFx0XHRcdFx0XHRcdGxhbmcuZ2V0KFwiZHVwbGljYXRlc05vdGlmaWNhdGlvbl9tc2dcIiwge1xuXHRcdFx0XHRcdFx0XHRcdFwiezF9XCI6IG1lcmdlYWJsZUFuZER1cGxpY2F0ZXMuZGVsZXRhYmxlLmxlbmd0aCxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdCkudGhlbigoY29uZmlybWVkKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoY29uZmlybWVkKSB7XG5cdFx0XHRcdFx0XHRcdC8vIGRlbGV0ZSBhc3luYyBpbiB0aGUgYmFja2dyb3VuZFxuXHRcdFx0XHRcdFx0XHRmb3IgKGNvbnN0IGRjIG9mIG1lcmdlYWJsZUFuZER1cGxpY2F0ZXMuZGVsZXRhYmxlKSB7XG5cdFx0XHRcdFx0XHRcdFx0bG9jYXRvci5lbnRpdHlDbGllbnQuZXJhc2UoZGMpXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZGVsZXRlUHJvbWlzZS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRpZiAobWVyZ2VhYmxlQW5kRHVwbGljYXRlcy5tZXJnZWFibGUubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0XHREaWFsb2cubWVzc2FnZShsYW5nLm1ha2VUcmFuc2xhdGlvbihcImNvbmZpcm1fbXNnXCIsIGxhbmcuZ2V0KFwibm9TaW1pbGFyQ29udGFjdHNfbXNnXCIpKSlcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5fc2hvd01lcmdlRGlhbG9ncyhtZXJnZWFibGVBbmREdXBsaWNhdGVzLm1lcmdlYWJsZSkudGhlbigoY2FuY2VsZWQpID0+IHtcblx0XHRcdFx0XHRcdFx0aWYgKCFjYW5jZWxlZCkge1xuXHRcdFx0XHRcdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwibm9Nb3JlU2ltaWxhckNvbnRhY3RzX21zZ1wiKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0LyoqXG5cdCAqIEByZXR1cm5zIFRydWUgaWYgdGhlIG1lcmdpbmcgd2FzIGNhbmNlbGVkIGJ5IHRoZSB1c2VyLCBmYWxzZSBvdGhlcndpc2Vcblx0ICovXG5cdF9zaG93TWVyZ2VEaWFsb2dzKG1lcmdhYmxlOiBDb250YWN0W11bXSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGxldCBjYW5jZWxlZCA9IGZhbHNlXG5cblx0XHRpZiAobWVyZ2FibGUubGVuZ3RoID4gMCkge1xuXHRcdFx0bGV0IGNvbnRhY3QxID0gbWVyZ2FibGVbMF1bMF1cblx0XHRcdGxldCBjb250YWN0MiA9IG1lcmdhYmxlWzBdWzFdXG5cdFx0XHRsZXQgbWVyZ2VEaWFsb2cgPSBuZXcgQ29udGFjdE1lcmdlVmlldyhjb250YWN0MSwgY29udGFjdDIpXG5cdFx0XHRyZXR1cm4gbWVyZ2VEaWFsb2dcblx0XHRcdFx0LnNob3coKVxuXHRcdFx0XHQudGhlbigoYWN0aW9uKSA9PiB7XG5cdFx0XHRcdFx0Ly8gZXhlY3V0ZSBhY3Rpb24gaGVyZSBhbmQgdXBkYXRlIG1lcmdhYmxlXG5cdFx0XHRcdFx0aWYgKGFjdGlvbiA9PT0gQ29udGFjdE1lcmdlQWN0aW9uLk1lcmdlKSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9yZW1vdmVGcm9tTWVyZ2FibGVDb250YWN0cyhtZXJnYWJsZSwgY29udGFjdDIpXG5cblx0XHRcdFx0XHRcdG1lcmdlQ29udGFjdHMoY29udGFjdDEsIGNvbnRhY3QyKVxuXHRcdFx0XHRcdFx0cmV0dXJuIHNob3dQcm9ncmVzc0RpYWxvZyhcblx0XHRcdFx0XHRcdFx0XCJwbGVhc2VXYWl0X21zZ1wiLFxuXHRcdFx0XHRcdFx0XHRsb2NhdG9yLmVudGl0eUNsaWVudC51cGRhdGUoY29udGFjdDEpLnRoZW4oKCkgPT4gbG9jYXRvci5lbnRpdHlDbGllbnQuZXJhc2UoY29udGFjdDIpKSxcblx0XHRcdFx0XHRcdCkuY2F0Y2gob2ZDbGFzcyhOb3RGb3VuZEVycm9yLCBub09wKSlcblx0XHRcdFx0XHR9IGVsc2UgaWYgKGFjdGlvbiA9PT0gQ29udGFjdE1lcmdlQWN0aW9uLkRlbGV0ZUZpcnN0KSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9yZW1vdmVGcm9tTWVyZ2FibGVDb250YWN0cyhtZXJnYWJsZSwgY29udGFjdDEpXG5cblx0XHRcdFx0XHRcdHJldHVybiBsb2NhdG9yLmVudGl0eUNsaWVudC5lcmFzZShjb250YWN0MSlcblx0XHRcdFx0XHR9IGVsc2UgaWYgKGFjdGlvbiA9PT0gQ29udGFjdE1lcmdlQWN0aW9uLkRlbGV0ZVNlY29uZCkge1xuXHRcdFx0XHRcdFx0dGhpcy5fcmVtb3ZlRnJvbU1lcmdhYmxlQ29udGFjdHMobWVyZ2FibGUsIGNvbnRhY3QyKVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4gbG9jYXRvci5lbnRpdHlDbGllbnQuZXJhc2UoY29udGFjdDIpXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChhY3Rpb24gPT09IENvbnRhY3RNZXJnZUFjdGlvbi5Ta2lwKSB7XG5cdFx0XHRcdFx0XHR0aGlzLl9yZW1vdmVGcm9tTWVyZ2FibGVDb250YWN0cyhtZXJnYWJsZSwgY29udGFjdDIpXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChhY3Rpb24gPT09IENvbnRhY3RNZXJnZUFjdGlvbi5DYW5jZWwpIHtcblx0XHRcdFx0XHRcdGNsZWFyKG1lcmdhYmxlKVxuXHRcdFx0XHRcdFx0Y2FuY2VsZWQgPSB0cnVlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKCFjYW5jZWxlZCAmJiBtZXJnYWJsZS5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fc2hvd01lcmdlRGlhbG9ncyhtZXJnYWJsZSlcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGNhbmNlbGVkXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhbmNlbGVkKVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiByZW1vdmVzIHRoZSBnaXZlbiBjb250YWN0IGZyb20gdGhlIGdpdmVuIG1lcmdhYmxlIGFycmF5cyBmaXJzdCBlbnRyeSAoZmlyc3Qgb3Igc2Vjb25kIGVsZW1lbnQpXG5cdCAqL1xuXHRfcmVtb3ZlRnJvbU1lcmdhYmxlQ29udGFjdHMobWVyZ2FibGU6IENvbnRhY3RbXVtdLCBjb250YWN0OiBDb250YWN0KSB7XG5cdFx0aWYgKG1lcmdhYmxlWzBdWzBdID09PSBjb250YWN0KSB7XG5cdFx0XHRtZXJnYWJsZVswXS5zcGxpY2UoMCwgMSkgLy8gcmVtb3ZlIGNvbnRhY3QxXG5cdFx0fSBlbHNlIGlmIChtZXJnYWJsZVswXVsxXSA9PT0gY29udGFjdCkge1xuXHRcdFx0bWVyZ2FibGVbMF0uc3BsaWNlKDEsIDEpIC8vIHJlbW92ZSBjb250YWN0MlxuXHRcdH1cblxuXHRcdC8vIHJlbW92ZSB0aGUgZmlyc3QgZW50cnkgaWYgdGhlcmUgaXMgb25seSBvbmUgY29udGFjdCBsZWZ0IGluIHRoZSBmaXJzdCBlbnRyeVxuXHRcdGlmIChtZXJnYWJsZVswXS5sZW5ndGggPD0gMSkge1xuXHRcdFx0bWVyZ2FibGUuc3BsaWNlKDAsIDEpXG5cdFx0fVxuXHR9XG5cblx0b25OZXdVcmwoYXJnczogUmVjb3JkPHN0cmluZywgYW55Pikge1xuXHRcdGlmICh0aGlzLmluQ29udGFjdExpc3RWaWV3KCkpIHtcblx0XHRcdHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwuc2hvd0xpc3RBbmRFbnRyeShhcmdzLmxpc3RJZCwgYXJncy5JZCkudGhlbihtLnJlZHJhdylcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5jb250YWN0Vmlld01vZGVsLmluaXQoYXJncy5saXN0SWQpLnRoZW4oKCkgPT4gdGhpcy5jb250YWN0Vmlld01vZGVsLnNlbGVjdENvbnRhY3QoYXJncy5jb250YWN0SWQpKVxuXHRcdH1cblx0XHQvLyBmb2N1cyB0aGUgZGV0YWlscyBjb2x1bW4gaWYgYXNrZWQgZXhwbGljaXRseSwgZS5nLiB0byBzaG93IGEgc3BlY2lmaWMgY29udGFjdFxuXHRcdGlmIChhcmdzLmZvY3VzSXRlbSkge1xuXHRcdFx0dGhpcy52aWV3U2xpZGVyLmZvY3VzKHRoaXMuZGV0YWlsc0NvbHVtbilcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGRlbGV0ZVNlbGVjdGVkQ29udGFjdHMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIGRlbGV0ZUNvbnRhY3RzKHRoaXMuZ2V0U2VsZWN0ZWRDb250YWN0cygpLCAoKSA9PiB0aGlzLmNvbnRhY3RWaWV3TW9kZWwubGlzdE1vZGVsLnNlbGVjdE5vbmUoKSlcblx0fVxuXG5cdGdldFZpZXdTbGlkZXIoKTogVmlld1NsaWRlciB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLnZpZXdTbGlkZXJcblx0fVxuXG5cdGhhbmRsZUJhY2tCdXR0b24oKTogYm9vbGVhbiB7XG5cdFx0Ly8gb25seSBoYW5kbGUgYmFjayBidXR0b24gaWYgdmlld2luZyBjb250YWN0XG5cdFx0aWYgKHRoaXMudmlld1NsaWRlci5mb2N1c2VkQ29sdW1uID09PSB0aGlzLmRldGFpbHNDb2x1bW4pIHtcblx0XHRcdHRoaXMudmlld1NsaWRlci5mb2N1cyh0aGlzLmxpc3RDb2x1bW4pXG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH0gZWxzZSBpZiAoXG5cdFx0XHR0aGlzLnNob3dpbmdMaXN0VmlldygpICYmXG5cdFx0XHQodGhpcy5jb250YWN0Vmlld01vZGVsLmxpc3RNb2RlbC5zdGF0ZS5pbk11bHRpc2VsZWN0IHx8XG5cdFx0XHRcdCh0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLmxpc3RNb2RlbCAmJiB0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLmxpc3RNb2RlbD8uc3RhdGUuaW5NdWx0aXNlbGVjdCkpXG5cdFx0KSB7XG5cdFx0XHQvLyBKdXN0IHRyeSB0byBlbXB0eSB0aGUgbGlzdCBvZiBzZWxlY3RlZCBpdGVtcyB0aGUgdXNlciBpcyBvblxuXHRcdFx0Ly8gbXVsdGlzZWxlY3QgbW9kZVxuXHRcdFx0dGhpcy5jb250YWN0Vmlld01vZGVsLmxpc3RNb2RlbC5zZWxlY3ROb25lKClcblx0XHRcdHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwubGlzdE1vZGVsPy5zZWxlY3ROb25lKClcblxuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2Vcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTGlzdFRvb2xiYXIoKSB7XG5cdFx0aWYgKHRoaXMuaW5Db250YWN0TGlzdFZpZXcoKSkge1xuXHRcdFx0Y29uc3Qgc2VsZWN0ZWRMaXN0ID0gdGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5nZXRTZWxlY3RlZENvbnRhY3RMaXN0SW5mbygpXG5cdFx0XHRyZXR1cm4gbShcblx0XHRcdFx0RGVza3RvcExpc3RUb29sYmFyLFxuXHRcdFx0XHRtKFNlbGVjdEFsbENoZWNrYm94LCBzZWxlY3Rpb25BdHRyc0Zvckxpc3QodGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5saXN0TW9kZWwpKSxcblx0XHRcdFx0bShcIi5mbGV4LWdyb3dcIiksXG5cdFx0XHRcdHRoaXMuY2FuRWRpdFNlbGVjdGVkQ29udGFjdExpc3QoKVxuXHRcdFx0XHRcdD8gbShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBcImFkZEVudHJpZXNfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdGljb246IEljb25zLkFkZCxcblx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmFkZEFkZHJlc3Nlc1RvQ29udGFjdExpc3QoKVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBtKERlc2t0b3BMaXN0VG9vbGJhciwgbShTZWxlY3RBbGxDaGVja2JveCwgc2VsZWN0aW9uQXR0cnNGb3JMaXN0KHRoaXMuY29udGFjdFZpZXdNb2RlbC5saXN0TW9kZWwpKSwgdGhpcy5yZW5kZXJTb3J0QnlCdXR0b24oKSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFkZEFkZHJlc3Nlc1RvQ29udGFjdExpc3QoKSB7XG5cdFx0Y29uc3QgZ3JvdXBSb290ID0gdGhpcy5jb250YWN0TGlzdFZpZXdNb2RlbC5nZXRTZWxlY3RlZENvbnRhY3RMaXN0SW5mbygpPy5ncm91cFJvb3Rcblx0XHRpZiAoIWdyb3VwUm9vdCkgcmV0dXJuXG5cdFx0c2hvd0NvbnRhY3RMaXN0RWRpdG9yKFxuXHRcdFx0Z3JvdXBSb290LFxuXHRcdFx0XCJhZGRFbnRyaWVzX2FjdGlvblwiLFxuXHRcdFx0KF8sIGFkZHJlc3NlcykgPT4ge1xuXHRcdFx0XHR0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLmFkZFJlY2lwaWVudHN0b0NvbnRhY3RMaXN0KGFkZHJlc3NlcywgYXNzZXJ0Tm90TnVsbChncm91cFJvb3QpKVxuXHRcdFx0fSxcblx0XHRcdHRoaXMuY29udGFjdExpc3RWaWV3TW9kZWwubGlzdE1vZGVsPy5nZXRVbmZpbHRlcmVkQXNBcnJheSgpLm1hcCgoZW50cnkpID0+IGVudHJ5LmVtYWlsQWRkcmVzcyksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJTb3J0QnlCdXR0b24oKSB7XG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwic29ydEJ5X2xhYmVsXCIsXG5cdFx0XHRpY29uOiBJY29ucy5MaXN0T3JkZXJlZCxcblx0XHRcdGNsaWNrOiAoZTogTW91c2VFdmVudCwgZG9tOiBIVE1MRWxlbWVudCkgPT4ge1xuXHRcdFx0XHRjcmVhdGVEcm9wZG93bih7XG5cdFx0XHRcdFx0bGF6eUJ1dHRvbnM6ICgpID0+IFtcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGFiZWw6IFwiZmlyc3ROYW1lX3BsYWNlaG9sZGVyXCIsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5jb250YWN0Vmlld01vZGVsLnNldFNvcnRCeUZpcnN0TmFtZSh0cnVlKVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGFiZWw6IFwibGFzdE5hbWVfcGxhY2Vob2xkZXJcIixcblx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmNvbnRhY3RWaWV3TW9kZWwuc2V0U29ydEJ5Rmlyc3ROYW1lKGZhbHNlKVxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHR9KShlLCBkb20pXG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGFkZENvbnRhY3RMaXN0KCkge1xuXHRcdGlmIChhd2FpdCB0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLmNhbkNyZWF0ZUNvbnRhY3RMaXN0KCkpIHtcblx0XHRcdGF3YWl0IHNob3dDb250YWN0TGlzdEVkaXRvcihudWxsLCBcImNyZWF0ZUNvbnRhY3RMaXN0X2FjdGlvblwiLCAobmFtZSwgcmVjaXBpZW50cykgPT4ge1xuXHRcdFx0XHR0aGlzLmNvbnRhY3RMaXN0Vmlld01vZGVsLmFkZENvbnRhY3RMaXN0KG5hbWUsIHJlY2lwaWVudHMpXG5cdFx0XHR9KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAobG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0dsb2JhbEFkbWluKCkpIHtcblx0XHRcdFx0Y29uc3QgeyBnZXRBdmFpbGFibGVQbGFuc1dpdGhDb250YWN0TGlzdCB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vLi4vLi4vY29tbW9uL3N1YnNjcmlwdGlvbi9TdWJzY3JpcHRpb25VdGlscy5qc1wiKVxuXHRcdFx0XHRjb25zdCBwbGFucyA9IGF3YWl0IGdldEF2YWlsYWJsZVBsYW5zV2l0aENvbnRhY3RMaXN0KClcblx0XHRcdFx0YXdhaXQgc2hvd1BsYW5VcGdyYWRlUmVxdWlyZWREaWFsb2cocGxhbnMpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHREaWFsb2cubWVzc2FnZShcImNvbnRhY3RBZG1pbl9tc2dcIilcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlTWFpbCh0bzogUGFydGlhbFJlY2lwaWVudCwgc3ViamVjdDogc3RyaW5nID0gXCJcIik6IFByb21pc2U8RGlhbG9nPiB7XG5cdHJldHVybiBsb2NhdG9yLm1haWxib3hNb2RlbC5nZXRVc2VyTWFpbGJveERldGFpbHMoKS50aGVuKChtYWlsYm94RGV0YWlscykgPT4ge1xuXHRcdHJldHVybiBuZXdNYWlsRWRpdG9yRnJvbVRlbXBsYXRlKFxuXHRcdFx0bWFpbGJveERldGFpbHMsXG5cdFx0XHR7XG5cdFx0XHRcdHRvOiBbdG9dLFxuXHRcdFx0fSxcblx0XHRcdHN1YmplY3QsXG5cdFx0XHRhcHBlbmRFbWFpbFNpZ25hdHVyZShcIlwiLCBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnByb3BzKSxcblx0XHQpLnRoZW4oKGVkaXRvcikgPT4gZWRpdG9yLnNob3coKSlcblx0fSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZUNvbnRhY3RzKGNvbnRhY3RMaXN0OiBDb250YWN0W10sIG9uQ29uZmlybTogKCkgPT4gdm9pZCA9IG5vT3ApOiBQcm9taXNlPHZvaWQ+IHtcblx0cmV0dXJuIERpYWxvZy5jb25maXJtKFwiZGVsZXRlQ29udGFjdHNfbXNnXCIpLnRoZW4oKGNvbmZpcm1lZCkgPT4ge1xuXHRcdGlmIChjb25maXJtZWQpIHtcblx0XHRcdG9uQ29uZmlybSgpXG5cdFx0XHRmb3IgKGNvbnN0IGNvbnRhY3Qgb2YgY29udGFjdExpc3QpIHtcblx0XHRcdFx0bG9jYXRvci5lbnRpdHlDbGllbnQuZXJhc2UoY29udGFjdCkuY2F0Y2gob2ZDbGFzcyhOb3RGb3VuZEVycm9yLCBub09wKSkuY2F0Y2gob2ZDbGFzcyhMb2NrZWRFcnJvciwgbm9PcCkpXG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uZmlybU1lcmdlKGtlcHRDb250YWN0OiBDb250YWN0LCBnb29kYnllQ29udGFjdDogQ29udGFjdCk6IFByb21pc2U8dm9pZD4ge1xuXHRpZiAoIWtlcHRDb250YWN0LnByZXNoYXJlZFBhc3N3b3JkIHx8ICFnb29kYnllQ29udGFjdC5wcmVzaGFyZWRQYXNzd29yZCB8fCBrZXB0Q29udGFjdC5wcmVzaGFyZWRQYXNzd29yZCA9PT0gZ29vZGJ5ZUNvbnRhY3QucHJlc2hhcmVkUGFzc3dvcmQpIHtcblx0XHRyZXR1cm4gRGlhbG9nLmNvbmZpcm0oXCJtZXJnZUFsbFNlbGVjdGVkQ29udGFjdHNfbXNnXCIpLnRoZW4oKGNvbmZpcm1lZCkgPT4ge1xuXHRcdFx0aWYgKGNvbmZpcm1lZCkge1xuXHRcdFx0XHRtZXJnZUNvbnRhY3RzKGtlcHRDb250YWN0LCBnb29kYnllQ29udGFjdClcblx0XHRcdFx0cmV0dXJuIHNob3dQcm9ncmVzc0RpYWxvZyhcblx0XHRcdFx0XHRcInBsZWFzZVdhaXRfbXNnXCIsXG5cdFx0XHRcdFx0bG9jYXRvci5lbnRpdHlDbGllbnQudXBkYXRlKGtlcHRDb250YWN0KS50aGVuKCgpID0+IGxvY2F0b3IuZW50aXR5Q2xpZW50LmVyYXNlKGdvb2RieWVDb250YWN0KSksXG5cdFx0XHRcdCkuY2F0Y2gob2ZDbGFzcyhOb3RGb3VuZEVycm9yLCBub09wKSlcblx0XHRcdH1cblx0XHR9KVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBEaWFsb2cubWVzc2FnZShcInByZXNoYXJlZFBhc3N3b3Jkc1VuZXF1YWxfbXNnXCIpXG5cdH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydENvbnRhY3RzKCkge1xuXHRjb25zdCBpbXBvcnRlciA9IGF3YWl0IG1haWxMb2NhdG9yLmNvbnRhY3RJbXBvcnRlcigpXG5cdGF3YWl0IGltcG9ydGVyLmltcG9ydENvbnRhY3RzRnJvbURldmljZVNhZmVseSgpXG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1Q0Esa0JBQWtCO0lBYUwsZ0JBQU4sTUFBa0U7Q0FDeEUsQUFBaUIscUJBQXFCLFNBQVMsZ0JBQWdCO0NBRS9ELEFBQWlCLHNCQUFzQixTQUFTLENBQUNBLFlBQW9DO0VBQ3BGLE1BQU0sWUFBWSxRQUFRLGlCQUFpQjtFQUMzQyxNQUFNLGFBQWEsUUFBUSxrQkFBa0IsR0FBRyxRQUFRLGVBQWUsSUFBSTtFQUMzRSxNQUFNLFdBQVcsUUFBUSxnQkFBZ0IsR0FBRyxRQUFRLGFBQWEsSUFBSTtFQUVyRSxNQUFNLGVBQWUsQ0FBQyxZQUFZLGFBQWEsVUFBVSxNQUFNO0FBRS9ELFNBQU8sYUFBYSxTQUFTLElBQUksZUFBZTtD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