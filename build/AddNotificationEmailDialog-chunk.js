import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import "./Env-chunk.js";
import { AppType } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { assertNotNull } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import { PushServiceType } from "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./EntityUtils-chunk.js";
import "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import { createPushIdentifier } from "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import "./FormatValidator-chunk.js";
import "./stream-chunk.js";
import "./ErrorUtils-chunk.js";
import "./RestError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
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
import "./Button-chunk.js";
import "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import { Dialog, TextField, TextFieldType } from "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import "./Formatter-chunk.js";
import "./CommonLocator-chunk.js";
import { getCleanedMailAddress } from "./MailAddressParser-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import { showNotAvailableForFreeDialog } from "./SubscriptionDialogs-chunk.js";

//#region src/mail-app/settings/AddNotificationEmailDialog.ts
var AddNotificationEmailDialog = class {
	constructor(logins, entityClient) {
		this.logins = logins;
		this.entityClient = entityClient;
	}
	show() {
		if (this.logins.getUserController().isFreeAccount()) showNotAvailableForFreeDialog();
else {
			let mailAddress = "";
			Dialog.showActionDialog({
				title: "notificationSettings_action",
				child: { view: () => [mithril_default(TextField, {
					label: "mailAddress_label",
					value: mailAddress,
					type: TextFieldType.Email,
					oninput: (newValue) => mailAddress = newValue
				}), mithril_default(".small.mt-s", lang.get("emailPushNotification_msg"))] },
				validator: () => this.validateAddNotificationEmailAddressInput(mailAddress),
				allowOkWithReturn: true,
				okAction: (dialog) => {
					this.createNotificationEmail(mailAddress, this.logins.getUserController().user);
					dialog.close();
				}
			});
		}
	}
	createNotificationEmail(mailAddress, user) {
		const pushIdentifier = createPushIdentifier({
			_area: "0",
			_owner: user.userGroup.group,
			_ownerGroup: user.userGroup.group,
			displayName: lang.get("adminEmailSettings_action"),
			identifier: assertNotNull(getCleanedMailAddress(mailAddress)),
			language: lang.code,
			pushServiceType: PushServiceType.EMAIL,
			lastUsageTime: new Date(),
			lastNotificationDate: null,
			disabled: false,
			app: AppType.Mail
		});
		showProgressDialog("pleaseWait_msg", this.entityClient.setup(assertNotNull(user.pushIdentifierList).list, pushIdentifier));
	}
	validateAddNotificationEmailAddressInput(emailAddress) {
		return getCleanedMailAddress(emailAddress) == null ? "mailAddressInvalid_msg" : null;
	}
};

//#endregion
export { AddNotificationEmailDialog };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWRkTm90aWZpY2F0aW9uRW1haWxEaWFsb2ctY2h1bmsuanMiLCJuYW1lcyI6WyJsb2dpbnM6IExvZ2luQ29udHJvbGxlciIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50IiwiZGlhbG9nOiBEaWFsb2ciLCJtYWlsQWRkcmVzczogc3RyaW5nIiwidXNlcjogVXNlciIsImVtYWlsQWRkcmVzczogc3RyaW5nIl0sInNvdXJjZXMiOlsiLi4vc3JjL21haWwtYXBwL3NldHRpbmdzL0FkZE5vdGlmaWNhdGlvbkVtYWlsRGlhbG9nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZVB1c2hJZGVudGlmaWVyLCBVc2VyIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IHNob3dOb3RBdmFpbGFibGVGb3JGcmVlRGlhbG9nIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9taXNjL1N1YnNjcmlwdGlvbkRpYWxvZ3MuanNcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2cuanNcIlxuaW1wb3J0IHsgbGFuZywgdHlwZSBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgbSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBUZXh0RmllbGQsIFRleHRGaWVsZFR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBnZXRDbGVhbmVkTWFpbEFkZHJlc3MgfSBmcm9tIFwiLi4vLi4vY29tbW9uL21pc2MvcGFyc2luZy9NYWlsQWRkcmVzc1BhcnNlci5qc1wiXG5pbXBvcnQgeyBQdXNoU2VydmljZVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgc2hvd1Byb2dyZXNzRGlhbG9nIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvZGlhbG9ncy9Qcm9ncmVzc0RpYWxvZy5qc1wiXG5pbXBvcnQgeyBMb2dpbkNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9tYWluL0xvZ2luQ29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7IEFwcFR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50Q29uc3RhbnRzLmpzXCJcblxuZXhwb3J0IGNsYXNzIEFkZE5vdGlmaWNhdGlvbkVtYWlsRGlhbG9nIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBsb2dpbnM6IExvZ2luQ29udHJvbGxlciwgcHJpdmF0ZSByZWFkb25seSBlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCkge31cblxuXHRzaG93KCkge1xuXHRcdGlmICh0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzRnJlZUFjY291bnQoKSkge1xuXHRcdFx0c2hvd05vdEF2YWlsYWJsZUZvckZyZWVEaWFsb2coKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRsZXQgbWFpbEFkZHJlc3MgPSBcIlwiXG5cblx0XHRcdERpYWxvZy5zaG93QWN0aW9uRGlhbG9nKHtcblx0XHRcdFx0dGl0bGU6IFwibm90aWZpY2F0aW9uU2V0dGluZ3NfYWN0aW9uXCIsXG5cdFx0XHRcdGNoaWxkOiB7XG5cdFx0XHRcdFx0dmlldzogKCkgPT4gW1xuXHRcdFx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdFx0bGFiZWw6IFwibWFpbEFkZHJlc3NfbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0dmFsdWU6IG1haWxBZGRyZXNzLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBUZXh0RmllbGRUeXBlLkVtYWlsLFxuXHRcdFx0XHRcdFx0XHRvbmlucHV0OiAobmV3VmFsdWUpID0+IChtYWlsQWRkcmVzcyA9IG5ld1ZhbHVlKSxcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0bShcIi5zbWFsbC5tdC1zXCIsIGxhbmcuZ2V0KFwiZW1haWxQdXNoTm90aWZpY2F0aW9uX21zZ1wiKSksXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0fSxcblx0XHRcdFx0dmFsaWRhdG9yOiAoKSA9PiB0aGlzLnZhbGlkYXRlQWRkTm90aWZpY2F0aW9uRW1haWxBZGRyZXNzSW5wdXQobWFpbEFkZHJlc3MpLFxuXHRcdFx0XHRhbGxvd09rV2l0aFJldHVybjogdHJ1ZSxcblx0XHRcdFx0b2tBY3Rpb246IChkaWFsb2c6IERpYWxvZykgPT4ge1xuXHRcdFx0XHRcdHRoaXMuY3JlYXRlTm90aWZpY2F0aW9uRW1haWwobWFpbEFkZHJlc3MsIHRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlcilcblx0XHRcdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGNyZWF0ZU5vdGlmaWNhdGlvbkVtYWlsKG1haWxBZGRyZXNzOiBzdHJpbmcsIHVzZXI6IFVzZXIpIHtcblx0XHRjb25zdCBwdXNoSWRlbnRpZmllciA9IGNyZWF0ZVB1c2hJZGVudGlmaWVyKHtcblx0XHRcdF9hcmVhOiBcIjBcIiwgLy8gbGVnYWN5XG5cdFx0XHRfb3duZXI6IHVzZXIudXNlckdyb3VwLmdyb3VwLCAvLyBsZWdhY3lcblx0XHRcdF9vd25lckdyb3VwOiB1c2VyLnVzZXJHcm91cC5ncm91cCxcblx0XHRcdGRpc3BsYXlOYW1lOiBsYW5nLmdldChcImFkbWluRW1haWxTZXR0aW5nc19hY3Rpb25cIiksXG5cdFx0XHRpZGVudGlmaWVyOiBhc3NlcnROb3ROdWxsKGdldENsZWFuZWRNYWlsQWRkcmVzcyhtYWlsQWRkcmVzcykpLFxuXHRcdFx0bGFuZ3VhZ2U6IGxhbmcuY29kZSxcblx0XHRcdHB1c2hTZXJ2aWNlVHlwZTogUHVzaFNlcnZpY2VUeXBlLkVNQUlMLFxuXHRcdFx0bGFzdFVzYWdlVGltZTogbmV3IERhdGUoKSxcblx0XHRcdGxhc3ROb3RpZmljYXRpb25EYXRlOiBudWxsLFxuXHRcdFx0ZGlzYWJsZWQ6IGZhbHNlLFxuXHRcdFx0YXBwOiBBcHBUeXBlLk1haWwsIC8vIENhbGVuZGFyIGFwcCBkb2Vzbid0IHJlY2VpdmUgbWFpbCBub3RpZmljYXRpb25zXG5cdFx0fSlcblxuXHRcdHNob3dQcm9ncmVzc0RpYWxvZyhcInBsZWFzZVdhaXRfbXNnXCIsIHRoaXMuZW50aXR5Q2xpZW50LnNldHVwKGFzc2VydE5vdE51bGwodXNlci5wdXNoSWRlbnRpZmllckxpc3QpLmxpc3QsIHB1c2hJZGVudGlmaWVyKSlcblx0fVxuXG5cdHByaXZhdGUgdmFsaWRhdGVBZGROb3RpZmljYXRpb25FbWFpbEFkZHJlc3NJbnB1dChlbWFpbEFkZHJlc3M6IHN0cmluZyk6IFRyYW5zbGF0aW9uS2V5IHwgbnVsbCB7XG5cdFx0cmV0dXJuIGdldENsZWFuZWRNYWlsQWRkcmVzcyhlbWFpbEFkZHJlc3MpID09IG51bGwgPyBcIm1haWxBZGRyZXNzSW52YWxpZF9tc2dcIiA6IG51bGwgLy8gVE9ETyBjaGVjayBpZiBpdCBpcyBhIFR1dGFub3RhIG1haWwgYWRkcmVzc1xuXHR9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBY2EsNkJBQU4sTUFBaUM7Q0FDdkMsWUFBNkJBLFFBQTBDQyxjQUE0QjtFQXFEbkcsS0FyRDZCO0VBcUQ1QixLQXJEc0U7Q0FBOEI7Q0FFckcsT0FBTztBQUNOLE1BQUksS0FBSyxPQUFPLG1CQUFtQixDQUFDLGVBQWUsQ0FDbEQsZ0NBQStCO0tBQ3pCO0dBQ04sSUFBSSxjQUFjO0FBRWxCLFVBQU8saUJBQWlCO0lBQ3ZCLE9BQU87SUFDUCxPQUFPLEVBQ04sTUFBTSxNQUFNLENBQ1gsZ0JBQUUsV0FBVztLQUNaLE9BQU87S0FDUCxPQUFPO0tBQ1AsTUFBTSxjQUFjO0tBQ3BCLFNBQVMsQ0FBQyxhQUFjLGNBQWM7SUFDdEMsRUFBQyxFQUNGLGdCQUFFLGVBQWUsS0FBSyxJQUFJLDRCQUE0QixDQUFDLEFBQ3ZELEVBQ0Q7SUFDRCxXQUFXLE1BQU0sS0FBSyx5Q0FBeUMsWUFBWTtJQUMzRSxtQkFBbUI7SUFDbkIsVUFBVSxDQUFDQyxXQUFtQjtBQUM3QixVQUFLLHdCQUF3QixhQUFhLEtBQUssT0FBTyxtQkFBbUIsQ0FBQyxLQUFLO0FBQy9FLFlBQU8sT0FBTztJQUNkO0dBQ0QsRUFBQztFQUNGO0NBQ0Q7Q0FFRCxBQUFRLHdCQUF3QkMsYUFBcUJDLE1BQVk7RUFDaEUsTUFBTSxpQkFBaUIscUJBQXFCO0dBQzNDLE9BQU87R0FDUCxRQUFRLEtBQUssVUFBVTtHQUN2QixhQUFhLEtBQUssVUFBVTtHQUM1QixhQUFhLEtBQUssSUFBSSw0QkFBNEI7R0FDbEQsWUFBWSxjQUFjLHNCQUFzQixZQUFZLENBQUM7R0FDN0QsVUFBVSxLQUFLO0dBQ2YsaUJBQWlCLGdCQUFnQjtHQUNqQyxlQUFlLElBQUk7R0FDbkIsc0JBQXNCO0dBQ3RCLFVBQVU7R0FDVixLQUFLLFFBQVE7RUFDYixFQUFDO0FBRUYscUJBQW1CLGtCQUFrQixLQUFLLGFBQWEsTUFBTSxjQUFjLEtBQUssbUJBQW1CLENBQUMsTUFBTSxlQUFlLENBQUM7Q0FDMUg7Q0FFRCxBQUFRLHlDQUF5Q0MsY0FBNkM7QUFDN0YsU0FBTyxzQkFBc0IsYUFBYSxJQUFJLE9BQU8sMkJBQTJCO0NBQ2hGO0FBQ0QifQ==