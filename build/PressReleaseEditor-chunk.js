import { __toESM } from "./chunk-chunk.js";
import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import { Keys, MailMethod, TabIndex } from "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./luxon-chunk.js";
import "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import "./TypeRefs-chunk.js";
import "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import "./CalendarUtils-chunk.js";
import "./ImportExportUtils-chunk.js";
import { isMailAddress } from "./FormatValidator-chunk.js";
import { require_stream } from "./stream-chunk.js";
import "./DeviceConfig-chunk.js";
import "./Logger-chunk.js";
import "./ErrorHandler-chunk.js";
import "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import "./ErrorUtils-chunk.js";
import "./RestError-chunk.js";
import "./SetupMultipleError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
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
import "./PermissionError-chunk.js";
import "./MessageDispatcher-chunk.js";
import "./WorkerProxy-chunk.js";
import "./EntityUpdateUtils-chunk.js";
import "./SessionType-chunk.js";
import "./EntityClient-chunk.js";
import "./PageContextLoginListener-chunk.js";
import "./RestClient-chunk.js";
import "./BirthdayUtils-chunk.js";
import "./Services2-chunk.js";
import "./FolderSystem-chunk.js";
import "./GroupUtils-chunk.js";
import "./MailChecks-chunk.js";
import { ButtonType } from "./Button-chunk.js";
import "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import { Dialog, DialogType, TextField } from "./Dialog-chunk.js";
import { progressIcon } from "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import "./Formatter-chunk.js";
import "./ProgressMonitor-chunk.js";
import "./Notifications-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import "./MailAddressParser-chunk.js";
import "./BlobUtils-chunk.js";
import "./FileUtils-chunk.js";
import "./ProgressDialog-chunk.js";
import { getDefaultSender } from "./SharedMailUtils-chunk.js";
import "./PasswordUtils-chunk.js";
import "./Recipient-chunk.js";
import "./ContactUtils-chunk.js";
import "./SubscriptionDialogs-chunk.js";
import "./ExternalLink-chunk.js";
import "./ToggleButton-chunk.js";
import "./SnackBar-chunk.js";
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
import { showUserError } from "./ErrorHandlerImpl-chunk.js";
import "./RouteChange-chunk.js";
import "./CustomerUtils-chunk.js";
import "./mailLocator-chunk.js";
import "./LoginButton-chunk.js";
import { Editor, RichTextToolbar } from "./HtmlEditor-chunk.js";
import { htmlSanitizer } from "./HtmlSanitizer-chunk.js";
import { replaceInlineImagesWithCids } from "./MailGuiUtils-chunk.js";
import "./UsageTestModel-chunk.js";
import "./MailUtils-chunk.js";
import "./BrowserWebauthn-chunk.js";
import "./PermissionType-chunk.js";
import "./CommonMailUtils-chunk.js";
import "./SearchUtils-chunk.js";
import "./FontIcons-chunk.js";

//#region src/mail-app/mail/press/PressReleaseEditor.ts
var import_stream = __toESM(require_stream(), 1);
function openPressReleaseEditor(mailboxDetails) {
	function close() {
		dialog.close();
	}
	async function send() {
		const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot);
		const body = pressRelease.bodyHtml();
		const subject = pressRelease.subject();
		let recipients;
		try {
			recipients = getValidRecipients(pressRelease.recipientsJson());
		} catch (e) {
			if (e instanceof UserError) return showUserError(e);
else throw e;
		}
		const choice = await Dialog.choice(lang.makeTranslation("press_release_confirmation", `Really send the press release out to ${recipients.length} recipients?`), [
			{
				text: "cancel_action",
				value: "cancel"
			},
			{
				text: lang.makeTranslation("noOp_action", "Just test"),
				value: "test"
			},
			{
				text: "yes_label",
				value: "send"
			}
		]);
		if (choice === "cancel") return;
		if (choice === "test") recipients.splice(0, recipients.length, {
			email: getDefaultSender(locator.logins, mailboxDetails),
			greeting: "Hi Test Recipient"
		});
		let progressMessage = "";
		let stop = false;
		const progressDialog = new Dialog(DialogType.Progress, { view: () => mithril_default(".hide-outline", {
			tabindex: TabIndex.Default,
			oncreate(vnode) {
				setTimeout(() => {
					vnode.dom.focus();
				}, 10);
			}
		}, [mithril_default(".flex-center", progressIcon()), mithril_default("p#dialog-title", progressMessage)]) }).addShortcut({
			key: Keys.ESC,
			exec: () => stop = true,
			help: "cancel_action"
		});
		progressDialog.show();
		let didFinish = true;
		for (let recipient of recipients) {
			if (stop) {
				didFinish = false;
				break;
			}
			const bodyWithGreeting = `<p>${recipient.greeting},</p>${body}`;
			try {
				const mailboxProperties$1 = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot);
				const sendMailModel = await locator.sendMailModel(mailboxDetails, mailboxProperties$1);
				const model = await sendMailModel.initWithTemplate({ to: [{
					address: recipient.email,
					name: null
				}] }, subject, bodyWithGreeting, [], false);
				await model.send(MailMethod.NONE, () => Promise.resolve(true), (_, p) => {
					progressMessage = `Sending to ${recipient.email}`;
					mithril_default.redraw();
					return p;
				});
			} catch (e) {
				Dialog.message(lang.makeTranslation("error_msg", `Error sending to ${recipient.email}: ${e.message}.\nStopping.`));
				didFinish = false;
				break;
			}
		}
		progressDialog.close();
		if (didFinish) close();
	}
	const pressRelease = {
		bodyHtml: (0, import_stream.default)(""),
		subject: (0, import_stream.default)(""),
		recipientsJson: (0, import_stream.default)("[\n    \n]")
	};
	const header = {
		left: [{
			label: "close_alt",
			click: close,
			type: ButtonType.Secondary
		}],
		middle: lang.makeTranslation("pr", "Press Release"),
		right: [{
			label: "send_action",
			click: send,
			type: ButtonType.Primary
		}]
	};
	const dialog = Dialog.editDialog(header, PressReleaseForm, pressRelease);
	dialog.show();
}
function getValidRecipients(recipientsJSON) {
	let parsed;
	try {
		parsed = JSON.parse(recipientsJSON);
	} catch (e) {
		throw new UserError(lang.makeTranslation("parse_json", "Unable to parse recipients JSON:\n" + e.toString()));
	}
	if (!(parsed instanceof Array)) throw new UserError(lang.makeTranslation("rec_arr", "Recipients must be an array"));
	return parsed.map(({ email, greeting }) => {
		if (typeof email !== "string" || !isMailAddress(email, false)) throw new UserError(lang.makeTranslation("no_email", `Not all provided recipients have an "email" field`));
		if (typeof greeting !== "string") throw new UserError(lang.makeTranslation("no_greeting", `Not all provided recipients have a "greeting" field`));
		return {
			email,
			greeting
		};
	});
}
var PressReleaseForm = class {
	editor;
	constructor(vnode) {
		const { bodyHtml } = vnode.attrs;
		this.editor = new Editor(200, (html, _) => htmlSanitizer.sanitizeFragment(html, { blockExternalContent: false }).fragment, null);
		this.editor.initialized.promise.then(() => {
			this.editor.setHTML(bodyHtml());
			this.editor.addChangeListener(() => bodyHtml(replaceInlineImagesWithCids(this.editor.getDOM()).innerHTML));
		});
	}
	view(vnode) {
		const { subject, recipientsJson } = vnode.attrs;
		return mithril_default("", [
			mithril_default("label.i.monospace", "Recipients JSON"),
			mithril_default("textarea.full-width", {
				style: {
					height: "200px",
					resize: "none"
				},
				oninput: (e) => recipientsJson(e.target.value),
				value: recipientsJson()
			}),
			mithril_default(TextField, {
				label: "subject_label",
				value: subject(),
				oninput: subject
			}),
			mithril_default(RichTextToolbar, { editor: this.editor }),
			mithril_default(".border-top", mithril_default(this.editor))
		]);
	}
};

//#endregion
export { openPressReleaseEditor };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJlc3NSZWxlYXNlRWRpdG9yLWNodW5rLmpzIiwibmFtZXMiOlsibWFpbGJveERldGFpbHM6IE1haWxib3hEZXRhaWwiLCJtYWlsYm94UHJvcGVydGllcyIsImhlYWRlcjogRGlhbG9nSGVhZGVyQmFyQXR0cnMiLCJyZWNpcGllbnRzSlNPTjogc3RyaW5nIiwidm5vZGU6IFZub2RlPFByZXNzUmVsZWFzZUZvcm1BdHRycz4iLCJlOiBJbnB1dEV2ZW50Il0sInNvdXJjZXMiOlsiLi4vc3JjL21haWwtYXBwL21haWwvcHJlc3MvUHJlc3NSZWxlYXNlRWRpdG9yLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgRGlhbG9nLCBEaWFsb2dUeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2dcIlxuaW1wb3J0IHsgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB7IGlzTWFpbEFkZHJlc3MgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvRm9ybWF0VmFsaWRhdG9yXCJcbmltcG9ydCB7IFVzZXJFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vVXNlckVycm9yXCJcbmltcG9ydCB7IHNob3dVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvRXJyb3JIYW5kbGVySW1wbFwiXG5pbXBvcnQgdHlwZSB7IE1haWxib3hEZXRhaWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L01haWxib3hNb2RlbC5qc1wiXG5pbXBvcnQgeyBLZXlzLCBNYWlsTWV0aG9kLCBUYWJJbmRleCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBwcm9ncmVzc0ljb24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb25cIlxuaW1wb3J0IHsgRWRpdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvZWRpdG9yL0VkaXRvclwiXG5pbXBvcnQgeyBodG1sU2FuaXRpemVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0h0bWxTYW5pdGl6ZXJcIlxuaW1wb3J0IHsgcmVwbGFjZUlubGluZUltYWdlc1dpdGhDaWRzIH0gZnJvbSBcIi4uL3ZpZXcvTWFpbEd1aVV0aWxzXCJcbmltcG9ydCB7IFRleHRGaWVsZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IERpYWxvZ0hlYWRlckJhckF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2dIZWFkZXJCYXJcIlxuaW1wb3J0IHsgUmljaFRleHRUb29sYmFyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9SaWNoVGV4dFRvb2xiYXIuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBnZXREZWZhdWx0U2VuZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9TaGFyZWRNYWlsVXRpbHMuanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5cbnR5cGUgUHJlc3NDb250YWN0ID0ge1xuXHRlbWFpbDogc3RyaW5nXG5cdGdyZWV0aW5nOiBzdHJpbmdcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9wZW5QcmVzc1JlbGVhc2VFZGl0b3IobWFpbGJveERldGFpbHM6IE1haWxib3hEZXRhaWwpOiB2b2lkIHtcblx0ZnVuY3Rpb24gY2xvc2UoKSB7XG5cdFx0ZGlhbG9nLmNsb3NlKClcblx0fVxuXG5cdGFzeW5jIGZ1bmN0aW9uIHNlbmQoKSB7XG5cdFx0Y29uc3QgbWFpbGJveFByb3BlcnRpZXMgPSBhd2FpdCBsb2NhdG9yLm1haWxib3hNb2RlbC5nZXRNYWlsYm94UHJvcGVydGllcyhtYWlsYm94RGV0YWlscy5tYWlsYm94R3JvdXBSb290KVxuXHRcdGNvbnN0IGJvZHkgPSBwcmVzc1JlbGVhc2UuYm9keUh0bWwoKVxuXHRcdGNvbnN0IHN1YmplY3QgPSBwcmVzc1JlbGVhc2Uuc3ViamVjdCgpXG5cdFx0bGV0IHJlY2lwaWVudHNcblxuXHRcdHRyeSB7XG5cdFx0XHRyZWNpcGllbnRzID0gZ2V0VmFsaWRSZWNpcGllbnRzKHByZXNzUmVsZWFzZS5yZWNpcGllbnRzSnNvbigpKVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgVXNlckVycm9yKSB7XG5cdFx0XHRcdHJldHVybiBzaG93VXNlckVycm9yKGUpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBlXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gV2UgYXJlbid0IHVzaW5nIHRyYW5zbGF0aW9uIGtleXMgaGVyZSBiZWNhdXNlIGl0J3Mgbm90IGEgdXNlciBmYWNpbmcgZmVhdHVyZVxuXHRcdGNvbnN0IGNob2ljZSA9IGF3YWl0IERpYWxvZy5jaG9pY2UoXG5cdFx0XHRsYW5nLm1ha2VUcmFuc2xhdGlvbihcInByZXNzX3JlbGVhc2VfY29uZmlybWF0aW9uXCIsIGBSZWFsbHkgc2VuZCB0aGUgcHJlc3MgcmVsZWFzZSBvdXQgdG8gJHtyZWNpcGllbnRzLmxlbmd0aH0gcmVjaXBpZW50cz9gKSxcblx0XHRcdFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRleHQ6IFwiY2FuY2VsX2FjdGlvblwiLFxuXHRcdFx0XHRcdHZhbHVlOiBcImNhbmNlbFwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGV4dDogbGFuZy5tYWtlVHJhbnNsYXRpb24oXCJub09wX2FjdGlvblwiLCBcIkp1c3QgdGVzdFwiKSxcblx0XHRcdFx0XHR2YWx1ZTogXCJ0ZXN0XCIsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0ZXh0OiBcInllc19sYWJlbFwiLFxuXHRcdFx0XHRcdHZhbHVlOiBcInNlbmRcIixcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0KVxuXG5cdFx0aWYgKGNob2ljZSA9PT0gXCJjYW5jZWxcIikge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0aWYgKGNob2ljZSA9PT0gXCJ0ZXN0XCIpIHtcblx0XHRcdHJlY2lwaWVudHMuc3BsaWNlKDAsIHJlY2lwaWVudHMubGVuZ3RoLCB7XG5cdFx0XHRcdGVtYWlsOiBnZXREZWZhdWx0U2VuZGVyKGxvY2F0b3IubG9naW5zLCBtYWlsYm94RGV0YWlscyksXG5cdFx0XHRcdGdyZWV0aW5nOiBcIkhpIFRlc3QgUmVjaXBpZW50XCIsXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdGxldCBwcm9ncmVzc01lc3NhZ2UgPSBcIlwiXG5cdFx0bGV0IHN0b3AgPSBmYWxzZVxuXHRcdC8vIFRha2VuIGZyb20gc2hvd1Byb2dyZXNzRGlhbG9nIHdoaWNoIGhhcyBhIGhhcmRjb2RlZCBkZWxheSB3aGVuIHlvdSBzaG93IGl0IHdoaWNoIHdlIGRvbid0IHdhbnRcblx0XHQvLyBzbyB3ZSBqdXN0IHJldXNlIHRoZSBzYW1lIGRpYWxvZyBhbmQgdXBkYXRlIHRoZSBtZXNzYWdlXG5cdFx0Y29uc3QgcHJvZ3Jlc3NEaWFsb2cgPSBuZXcgRGlhbG9nKERpYWxvZ1R5cGUuUHJvZ3Jlc3MsIHtcblx0XHRcdHZpZXc6ICgpID0+XG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIuaGlkZS1vdXRsaW5lXCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Ly8gV2UgbWFrZSB0aGlzIGVsZW1lbnQgZm9jdXNhYmxlIHNvIHRoYXQgdGhlIHNjcmVlbiByZWFkZXIgYW5ub3VuY2VzIHRoZSBkaWFsb2dcblx0XHRcdFx0XHRcdHRhYmluZGV4OiBUYWJJbmRleC5EZWZhdWx0LFxuXG5cdFx0XHRcdFx0XHRvbmNyZWF0ZSh2bm9kZSkge1xuXHRcdFx0XHRcdFx0XHQvLyBXZSBuZWVkIHRvIGRlbGF5IHNvIHRoYXQgdGhlIGVlbGVtZW50IGlzIGF0dGFjaGVkIHRvIHRoZSBwYXJlbnRcblx0XHRcdFx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0Oyh2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpLmZvY3VzKClcblx0XHRcdFx0XHRcdFx0fSwgMTApXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0W20oXCIuZmxleC1jZW50ZXJcIiwgcHJvZ3Jlc3NJY29uKCkpLCBtKFwicCNkaWFsb2ctdGl0bGVcIiwgcHJvZ3Jlc3NNZXNzYWdlKV0sXG5cdFx0XHRcdCksXG5cdFx0fSkuYWRkU2hvcnRjdXQoe1xuXHRcdFx0a2V5OiBLZXlzLkVTQyxcblx0XHRcdGV4ZWM6ICgpID0+IChzdG9wID0gdHJ1ZSksXG5cdFx0XHRoZWxwOiBcImNhbmNlbF9hY3Rpb25cIixcblx0XHR9KVxuXHRcdHByb2dyZXNzRGlhbG9nLnNob3coKVxuXHRcdGxldCBkaWRGaW5pc2ggPSB0cnVlXG5cblx0XHRmb3IgKGxldCByZWNpcGllbnQgb2YgcmVjaXBpZW50cykge1xuXHRcdFx0aWYgKHN0b3ApIHtcblx0XHRcdFx0ZGlkRmluaXNoID0gZmFsc2Vcblx0XHRcdFx0YnJlYWtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgYm9keVdpdGhHcmVldGluZyA9IGA8cD4ke3JlY2lwaWVudC5ncmVldGluZ30sPC9wPiR7Ym9keX1gXG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IG1haWxib3hQcm9wZXJ0aWVzID0gYXdhaXQgbG9jYXRvci5tYWlsYm94TW9kZWwuZ2V0TWFpbGJveFByb3BlcnRpZXMobWFpbGJveERldGFpbHMubWFpbGJveEdyb3VwUm9vdClcblx0XHRcdFx0Y29uc3Qgc2VuZE1haWxNb2RlbCA9IGF3YWl0IGxvY2F0b3Iuc2VuZE1haWxNb2RlbChtYWlsYm94RGV0YWlscywgbWFpbGJveFByb3BlcnRpZXMpXG5cdFx0XHRcdGNvbnN0IG1vZGVsID0gYXdhaXQgc2VuZE1haWxNb2RlbC5pbml0V2l0aFRlbXBsYXRlKFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRvOiBbXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRhZGRyZXNzOiByZWNpcGllbnQuZW1haWwsXG5cdFx0XHRcdFx0XHRcdFx0bmFtZTogbnVsbCxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRzdWJqZWN0LFxuXHRcdFx0XHRcdGJvZHlXaXRoR3JlZXRpbmcsXG5cdFx0XHRcdFx0W10sXG5cdFx0XHRcdFx0ZmFsc2UsXG5cdFx0XHRcdClcblx0XHRcdFx0YXdhaXQgbW9kZWwuc2VuZChcblx0XHRcdFx0XHRNYWlsTWV0aG9kLk5PTkUsXG5cdFx0XHRcdFx0KCkgPT4gUHJvbWlzZS5yZXNvbHZlKHRydWUpLFxuXHRcdFx0XHRcdChfLCBwKSA9PiB7XG5cdFx0XHRcdFx0XHRwcm9ncmVzc01lc3NhZ2UgPSBgU2VuZGluZyB0byAke3JlY2lwaWVudC5lbWFpbH1gXG5cdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0XHRyZXR1cm4gcFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdClcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0Ly8gU3RvcCBzZW5kaW5nIGFmdGVyIGZpcnN0IGZhaWx1cmUgaW4gY2FzZSBzb21ldGhpbmcgYmFkIGhhcHBlbmVkXG5cdFx0XHRcdERpYWxvZy5tZXNzYWdlKGxhbmcubWFrZVRyYW5zbGF0aW9uKFwiZXJyb3JfbXNnXCIsIGBFcnJvciBzZW5kaW5nIHRvICR7cmVjaXBpZW50LmVtYWlsfTogJHtlLm1lc3NhZ2V9LlxcblN0b3BwaW5nLmApKVxuXHRcdFx0XHRkaWRGaW5pc2ggPSBmYWxzZVxuXHRcdFx0XHRicmVha1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHByb2dyZXNzRGlhbG9nLmNsb3NlKClcblxuXHRcdGlmIChkaWRGaW5pc2gpIHtcblx0XHRcdGNsb3NlKClcblx0XHR9XG5cdH1cblxuXHRjb25zdCBwcmVzc1JlbGVhc2UgPSB7XG5cdFx0Ym9keUh0bWw6IHN0cmVhbShcIlwiKSxcblx0XHRzdWJqZWN0OiBzdHJlYW0oXCJcIiksXG5cdFx0cmVjaXBpZW50c0pzb246IHN0cmVhbShcIltcXG4gICAgXFxuXVwiKSxcblx0fVxuXHRjb25zdCBoZWFkZXI6IERpYWxvZ0hlYWRlckJhckF0dHJzID0ge1xuXHRcdGxlZnQ6IFtcblx0XHRcdHtcblx0XHRcdFx0bGFiZWw6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHRcdGNsaWNrOiBjbG9zZSxcblx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHR9LFxuXHRcdF0sXG5cdFx0bWlkZGxlOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcInByXCIsIFwiUHJlc3MgUmVsZWFzZVwiKSxcblx0XHRyaWdodDogW1xuXHRcdFx0e1xuXHRcdFx0XHRsYWJlbDogXCJzZW5kX2FjdGlvblwiLFxuXHRcdFx0XHRjbGljazogc2VuZCxcblx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5QcmltYXJ5LFxuXHRcdFx0fSxcblx0XHRdLFxuXHR9XG5cdGNvbnN0IGRpYWxvZyA9IERpYWxvZy5lZGl0RGlhbG9nKGhlYWRlciwgUHJlc3NSZWxlYXNlRm9ybSwgcHJlc3NSZWxlYXNlKVxuXHRkaWFsb2cuc2hvdygpXG59XG5cbmZ1bmN0aW9uIGdldFZhbGlkUmVjaXBpZW50cyhyZWNpcGllbnRzSlNPTjogc3RyaW5nKTogQXJyYXk8UHJlc3NDb250YWN0PiB7XG5cdGxldCBwYXJzZWRcblxuXHR0cnkge1xuXHRcdHBhcnNlZCA9IEpTT04ucGFyc2UocmVjaXBpZW50c0pTT04pXG5cdH0gY2F0Y2ggKGUpIHtcblx0XHR0aHJvdyBuZXcgVXNlckVycm9yKGxhbmcubWFrZVRyYW5zbGF0aW9uKFwicGFyc2VfanNvblwiLCBcIlVuYWJsZSB0byBwYXJzZSByZWNpcGllbnRzIEpTT046XFxuXCIgKyBlLnRvU3RyaW5nKCkpKVxuXHR9XG5cblx0aWYgKCEocGFyc2VkIGluc3RhbmNlb2YgQXJyYXkpKSB7XG5cdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihsYW5nLm1ha2VUcmFuc2xhdGlvbihcInJlY19hcnJcIiwgXCJSZWNpcGllbnRzIG11c3QgYmUgYW4gYXJyYXlcIikpXG5cdH1cblxuXHRyZXR1cm4gcGFyc2VkLm1hcCgoeyBlbWFpbCwgZ3JlZXRpbmcgfSkgPT4ge1xuXHRcdGlmICh0eXBlb2YgZW1haWwgIT09IFwic3RyaW5nXCIgfHwgIWlzTWFpbEFkZHJlc3MoZW1haWwsIGZhbHNlKSkge1xuXHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihsYW5nLm1ha2VUcmFuc2xhdGlvbihcIm5vX2VtYWlsXCIsIGBOb3QgYWxsIHByb3ZpZGVkIHJlY2lwaWVudHMgaGF2ZSBhbiBcImVtYWlsXCIgZmllbGRgKSlcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGdyZWV0aW5nICE9PSBcInN0cmluZ1wiKSB7XG5cdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKGxhbmcubWFrZVRyYW5zbGF0aW9uKFwibm9fZ3JlZXRpbmdcIiwgYE5vdCBhbGwgcHJvdmlkZWQgcmVjaXBpZW50cyBoYXZlIGEgXCJncmVldGluZ1wiIGZpZWxkYCkpXG5cdFx0fVxuXG5cdFx0Ly8gRGlzY2FyZCBhbnkgdW5uZWVkZWQgZmllbGRzXG5cdFx0cmV0dXJuIHtcblx0XHRcdGVtYWlsLFxuXHRcdFx0Z3JlZXRpbmcsXG5cdFx0fVxuXHR9KVxufVxuXG5leHBvcnQgdHlwZSBQcmVzc1JlbGVhc2VGb3JtQXR0cnMgPSB7XG5cdHN1YmplY3Q6IFN0cmVhbTxzdHJpbmc+XG5cdGJvZHlIdG1sOiBTdHJlYW08c3RyaW5nPlxuXHRyZWNpcGllbnRzSnNvbjogU3RyZWFtPHN0cmluZz5cbn1cblxuZXhwb3J0IGNsYXNzIFByZXNzUmVsZWFzZUZvcm0gaW1wbGVtZW50cyBDb21wb25lbnQ8UHJlc3NSZWxlYXNlRm9ybUF0dHJzPiB7XG5cdGVkaXRvcjogRWRpdG9yXG5cblx0Y29uc3RydWN0b3Iodm5vZGU6IFZub2RlPFByZXNzUmVsZWFzZUZvcm1BdHRycz4pIHtcblx0XHRjb25zdCB7IGJvZHlIdG1sIH0gPSB2bm9kZS5hdHRyc1xuXHRcdHRoaXMuZWRpdG9yID0gbmV3IEVkaXRvcihcblx0XHRcdDIwMCxcblx0XHRcdChodG1sLCBfKSA9PlxuXHRcdFx0XHRodG1sU2FuaXRpemVyLnNhbml0aXplRnJhZ21lbnQoaHRtbCwge1xuXHRcdFx0XHRcdGJsb2NrRXh0ZXJuYWxDb250ZW50OiBmYWxzZSxcblx0XHRcdFx0fSkuZnJhZ21lbnQsXG5cdFx0XHRudWxsLFxuXHRcdClcblx0XHR0aGlzLmVkaXRvci5pbml0aWFsaXplZC5wcm9taXNlLnRoZW4oKCkgPT4ge1xuXHRcdFx0dGhpcy5lZGl0b3Iuc2V0SFRNTChib2R5SHRtbCgpKVxuXHRcdFx0dGhpcy5lZGl0b3IuYWRkQ2hhbmdlTGlzdGVuZXIoKCkgPT4gYm9keUh0bWwocmVwbGFjZUlubGluZUltYWdlc1dpdGhDaWRzKHRoaXMuZWRpdG9yLmdldERPTSgpKS5pbm5lckhUTUwpKVxuXHRcdH0pXG5cdH1cblxuXHR2aWV3KHZub2RlOiBWbm9kZTxQcmVzc1JlbGVhc2VGb3JtQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgc3ViamVjdCwgcmVjaXBpZW50c0pzb24gfSA9IHZub2RlLmF0dHJzXG5cdFx0cmV0dXJuIG0oXCJcIiwgW1xuXHRcdFx0bShcImxhYmVsLmkubW9ub3NwYWNlXCIsIFwiUmVjaXBpZW50cyBKU09OXCIpLFxuXHRcdFx0bShcInRleHRhcmVhLmZ1bGwtd2lkdGhcIiwge1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdGhlaWdodDogXCIyMDBweFwiLFxuXHRcdFx0XHRcdHJlc2l6ZTogXCJub25lXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uaW5wdXQ6IChlOiBJbnB1dEV2ZW50KSA9PiByZWNpcGllbnRzSnNvbigoZS50YXJnZXQgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWUpLFxuXHRcdFx0XHR2YWx1ZTogcmVjaXBpZW50c0pzb24oKSxcblx0XHRcdH0pLFxuXHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0bGFiZWw6IFwic3ViamVjdF9sYWJlbFwiLFxuXHRcdFx0XHR2YWx1ZTogc3ViamVjdCgpLFxuXHRcdFx0XHRvbmlucHV0OiBzdWJqZWN0LFxuXHRcdFx0fSksXG5cdFx0XHRtKFJpY2hUZXh0VG9vbGJhciwgeyBlZGl0b3I6IHRoaXMuZWRpdG9yIH0pLFxuXHRcdFx0bShcIi5ib3JkZXItdG9wXCIsIG0odGhpcy5lZGl0b3IpKSxcblx0XHRdKVxuXHR9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQk8sU0FBUyx1QkFBdUJBLGdCQUFxQztDQUMzRSxTQUFTLFFBQVE7QUFDaEIsU0FBTyxPQUFPO0NBQ2Q7Q0FFRCxlQUFlLE9BQU87RUFDckIsTUFBTSxvQkFBb0IsTUFBTSxRQUFRLGFBQWEscUJBQXFCLGVBQWUsaUJBQWlCO0VBQzFHLE1BQU0sT0FBTyxhQUFhLFVBQVU7RUFDcEMsTUFBTSxVQUFVLGFBQWEsU0FBUztFQUN0QyxJQUFJO0FBRUosTUFBSTtBQUNILGdCQUFhLG1CQUFtQixhQUFhLGdCQUFnQixDQUFDO0VBQzlELFNBQVEsR0FBRztBQUNYLE9BQUksYUFBYSxVQUNoQixRQUFPLGNBQWMsRUFBRTtJQUV2QixPQUFNO0VBRVA7RUFHRCxNQUFNLFNBQVMs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