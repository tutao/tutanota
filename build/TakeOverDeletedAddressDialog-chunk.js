import { __toESM } from "./chunk-chunk.js";
import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import { assertMainOrNode } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { InfoLink, lang } from "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./ParserCombinator-chunk.js";
import { isMailAddress } from "./FormatValidator-chunk.js";
import { require_stream } from "./stream-chunk.js";
import "./ErrorUtils-chunk.js";
import { AccessBlockedError, AccessDeactivatedError, InvalidDataError, NotAuthenticatedError, TooManyRequestsError } from "./RestError-chunk.js";
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
import { Autocomplete, Dialog, DialogType, TextField, TextFieldType } from "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import "./ExternalLink-chunk.js";
import "./ToggleButton-chunk.js";
import { HtmlEditor, HtmlEditorMode } from "./HtmlEditor-chunk.js";
import "./HtmlSanitizer-chunk.js";
import { MoreInfoLink } from "./MoreInfoLink-chunk.js";

//#region src/common/login/recover/TakeOverDeletedAddressDialog.ts
var import_stream = __toESM(require_stream(), 1);
assertMainOrNode();
function showTakeOverDialog(mailAddress, password) {
	const targetAccountAddress = (0, import_stream.default)("");
	const editor = new HtmlEditor("recoveryCode_label");
	editor.setMode(HtmlEditorMode.HTML);
	editor.setHtmlMonospace(true);
	editor.setMinHeight(80);
	editor.showBorders();
	const takeoverDialog = Dialog.showActionDialog({
		title: "help_label",
		type: DialogType.EditSmall,
		child: { view: () => {
			return [
				mithril_default(".mt", lang.get("takeOverUnusedAddress_msg")),
				mithril_default(MoreInfoLink, { link: InfoLink.InactiveAccounts }),
				mithril_default(TextField, {
					label: "targetAddress_label",
					value: targetAccountAddress(),
					autocompleteAs: Autocomplete.email,
					type: TextFieldType.Email,
					oninput: targetAccountAddress
				}),
				mithril_default(editor)
			];
		} },
		okAction: () => {
			const cleanTargetAccountAddress = targetAccountAddress().trim().toLowerCase();
			const cleanMailAddress = mailAddress.trim().toLowerCase();
			const cleanRecoveryCode = editor.getValue().replace(/\s/g, "").toLowerCase();
			if (!isMailAddress(cleanMailAddress, true)) Dialog.message("mailAddressInvalid_msg");
else if (!isMailAddress(cleanTargetAccountAddress, true)) Dialog.message("mailAddressInvalid_msg");
else showProgressDialog("pleaseWait_msg", locator.loginFacade.takeOverDeletedAddress(cleanMailAddress, password, cleanRecoveryCode, cleanTargetAccountAddress)).then(() => Dialog.message("takeoverSuccess_msg")).then(() => {
				takeoverDialog.close();
				mithril_default.route.set("/login", {
					loginWith: cleanTargetAccountAddress,
					noAutoLogin: true
				});
			}).catch((e) => handleError(e));
		},
		cancelAction: () => mithril_default.route.set("/login", { noAutoLogin: true })
	});
	return takeoverDialog;
}
function handleError(e) {
	if (e instanceof NotAuthenticatedError) Dialog.message("loginFailed_msg");
else if (e instanceof AccessBlockedError || e instanceof AccessDeactivatedError) Dialog.message("loginFailedOften_msg");
else if (e instanceof InvalidDataError) Dialog.message("takeoverAccountInvalid_msg");
else if (e instanceof TooManyRequestsError) Dialog.message("tooManyAttempts_msg");
else throw e;
}

//#endregion
export { showTakeOverDialog };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGFrZU92ZXJEZWxldGVkQWRkcmVzc0RpYWxvZy1jaHVuay5qcyIsIm5hbWVzIjpbIm1haWxBZGRyZXNzOiBzdHJpbmciLCJwYXNzd29yZDogc3RyaW5nIiwiZTogRXJyb3IiXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2xvZ2luL3JlY292ZXIvVGFrZU92ZXJEZWxldGVkQWRkcmVzc0RpYWxvZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBBY2Nlc3NCbG9ja2VkRXJyb3IsIEFjY2Vzc0RlYWN0aXZhdGVkRXJyb3IsIEludmFsaWREYXRhRXJyb3IsIE5vdEF1dGhlbnRpY2F0ZWRFcnJvciwgVG9vTWFueVJlcXVlc3RzRXJyb3IgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3JcIlxuaW1wb3J0IHsgc2hvd1Byb2dyZXNzRGlhbG9nIH0gZnJvbSBcIi4uLy4uL2d1aS9kaWFsb2dzL1Byb2dyZXNzRGlhbG9nXCJcbmltcG9ydCB7IGlzTWFpbEFkZHJlc3MgfSBmcm9tIFwiLi4vLi4vbWlzYy9Gb3JtYXRWYWxpZGF0b3IuanNcIlxuaW1wb3J0IHsgSW5mb0xpbmssIGxhbmcgfSBmcm9tIFwiLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBBdXRvY29tcGxldGUsIFRleHRGaWVsZCwgVGV4dEZpZWxkVHlwZSB9IGZyb20gXCIuLi8uLi9ndWkvYmFzZS9UZXh0RmllbGQuanNcIlxuaW1wb3J0IHsgRGlhbG9nLCBEaWFsb2dUeXBlIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgeyBIdG1sRWRpdG9yLCBIdG1sRWRpdG9yTW9kZSB9IGZyb20gXCIuLi8uLi9ndWkvZWRpdG9yL0h0bWxFZGl0b3JcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgTW9yZUluZm9MaW5rIH0gZnJvbSBcIi4uLy4uL21pc2MvbmV3cy9Nb3JlSW5mb0xpbmsuanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dUYWtlT3ZlckRpYWxvZyhtYWlsQWRkcmVzczogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nKTogRGlhbG9nIHtcblx0Y29uc3QgdGFyZ2V0QWNjb3VudEFkZHJlc3MgPSBzdHJlYW0oXCJcIilcblx0Y29uc3QgZWRpdG9yID0gbmV3IEh0bWxFZGl0b3IoXCJyZWNvdmVyeUNvZGVfbGFiZWxcIilcblx0ZWRpdG9yLnNldE1vZGUoSHRtbEVkaXRvck1vZGUuSFRNTClcblx0ZWRpdG9yLnNldEh0bWxNb25vc3BhY2UodHJ1ZSlcblx0ZWRpdG9yLnNldE1pbkhlaWdodCg4MClcblx0ZWRpdG9yLnNob3dCb3JkZXJzKClcblx0Y29uc3QgdGFrZW92ZXJEaWFsb2cgPSBEaWFsb2cuc2hvd0FjdGlvbkRpYWxvZyh7XG5cdFx0dGl0bGU6IFwiaGVscF9sYWJlbFwiLFxuXHRcdHR5cGU6IERpYWxvZ1R5cGUuRWRpdFNtYWxsLFxuXHRcdGNoaWxkOiB7XG5cdFx0XHR2aWV3OiAoKSA9PiB7XG5cdFx0XHRcdHJldHVybiBbXG5cdFx0XHRcdFx0bShcIi5tdFwiLCBsYW5nLmdldChcInRha2VPdmVyVW51c2VkQWRkcmVzc19tc2dcIikpLFxuXHRcdFx0XHRcdG0oTW9yZUluZm9MaW5rLCB7IGxpbms6IEluZm9MaW5rLkluYWN0aXZlQWNjb3VudHMgfSksXG5cdFx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcInRhcmdldEFkZHJlc3NfbGFiZWxcIixcblx0XHRcdFx0XHRcdHZhbHVlOiB0YXJnZXRBY2NvdW50QWRkcmVzcygpLFxuXHRcdFx0XHRcdFx0YXV0b2NvbXBsZXRlQXM6IEF1dG9jb21wbGV0ZS5lbWFpbCxcblx0XHRcdFx0XHRcdHR5cGU6IFRleHRGaWVsZFR5cGUuRW1haWwsXG5cdFx0XHRcdFx0XHRvbmlucHV0OiB0YXJnZXRBY2NvdW50QWRkcmVzcyxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRtKGVkaXRvciksXG5cdFx0XHRcdF1cblx0XHRcdH0sXG5cdFx0fSxcblx0XHRva0FjdGlvbjogKCkgPT4ge1xuXHRcdFx0Y29uc3QgY2xlYW5UYXJnZXRBY2NvdW50QWRkcmVzcyA9IHRhcmdldEFjY291bnRBZGRyZXNzKCkudHJpbSgpLnRvTG93ZXJDYXNlKClcblx0XHRcdGNvbnN0IGNsZWFuTWFpbEFkZHJlc3MgPSBtYWlsQWRkcmVzcy50cmltKCkudG9Mb3dlckNhc2UoKVxuXHRcdFx0Y29uc3QgY2xlYW5SZWNvdmVyeUNvZGUgPSBlZGl0b3IuZ2V0VmFsdWUoKS5yZXBsYWNlKC9cXHMvZywgXCJcIikudG9Mb3dlckNhc2UoKVxuXG5cdFx0XHRpZiAoIWlzTWFpbEFkZHJlc3MoY2xlYW5NYWlsQWRkcmVzcywgdHJ1ZSkpIHtcblx0XHRcdFx0RGlhbG9nLm1lc3NhZ2UoXCJtYWlsQWRkcmVzc0ludmFsaWRfbXNnXCIpXG5cdFx0XHR9IGVsc2UgaWYgKCFpc01haWxBZGRyZXNzKGNsZWFuVGFyZ2V0QWNjb3VudEFkZHJlc3MsIHRydWUpKSB7XG5cdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwibWFpbEFkZHJlc3NJbnZhbGlkX21zZ1wiKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c2hvd1Byb2dyZXNzRGlhbG9nKFxuXHRcdFx0XHRcdFwicGxlYXNlV2FpdF9tc2dcIixcblx0XHRcdFx0XHRsb2NhdG9yLmxvZ2luRmFjYWRlLnRha2VPdmVyRGVsZXRlZEFkZHJlc3MoY2xlYW5NYWlsQWRkcmVzcywgcGFzc3dvcmQsIGNsZWFuUmVjb3ZlcnlDb2RlLCBjbGVhblRhcmdldEFjY291bnRBZGRyZXNzKSxcblx0XHRcdFx0KVxuXHRcdFx0XHRcdC50aGVuKCgpID0+IERpYWxvZy5tZXNzYWdlKFwidGFrZW92ZXJTdWNjZXNzX21zZ1wiKSlcblx0XHRcdFx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHR0YWtlb3ZlckRpYWxvZy5jbG9zZSgpXG5cdFx0XHRcdFx0XHRtLnJvdXRlLnNldChcIi9sb2dpblwiLCB7XG5cdFx0XHRcdFx0XHRcdGxvZ2luV2l0aDogY2xlYW5UYXJnZXRBY2NvdW50QWRkcmVzcyxcblx0XHRcdFx0XHRcdFx0bm9BdXRvTG9naW46IHRydWUsXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmNhdGNoKChlKSA9PiBoYW5kbGVFcnJvcihlKSlcblx0XHRcdH1cblx0XHR9LFxuXHRcdGNhbmNlbEFjdGlvbjogKCkgPT5cblx0XHRcdG0ucm91dGUuc2V0KFwiL2xvZ2luXCIsIHtcblx0XHRcdFx0bm9BdXRvTG9naW46IHRydWUsXG5cdFx0XHR9KSxcblx0fSlcblx0cmV0dXJuIHRha2VvdmVyRGlhbG9nXG59XG5cbmZ1bmN0aW9uIGhhbmRsZUVycm9yKGU6IEVycm9yKSB7XG5cdGlmIChlIGluc3RhbmNlb2YgTm90QXV0aGVudGljYXRlZEVycm9yKSB7XG5cdFx0RGlhbG9nLm1lc3NhZ2UoXCJsb2dpbkZhaWxlZF9tc2dcIilcblx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgQWNjZXNzQmxvY2tlZEVycm9yIHx8IGUgaW5zdGFuY2VvZiBBY2Nlc3NEZWFjdGl2YXRlZEVycm9yKSB7XG5cdFx0RGlhbG9nLm1lc3NhZ2UoXCJsb2dpbkZhaWxlZE9mdGVuX21zZ1wiKVxuXHR9IGVsc2UgaWYgKGUgaW5zdGFuY2VvZiBJbnZhbGlkRGF0YUVycm9yKSB7XG5cdFx0RGlhbG9nLm1lc3NhZ2UoXCJ0YWtlb3ZlckFjY291bnRJbnZhbGlkX21zZ1wiKVxuXHR9IGVsc2UgaWYgKGUgaW5zdGFuY2VvZiBUb29NYW55UmVxdWVzdHNFcnJvcikge1xuXHRcdERpYWxvZy5tZXNzYWdlKFwidG9vTWFueUF0dGVtcHRzX21zZ1wiKVxuXHR9IGVsc2Uge1xuXHRcdHRocm93IGVcblx0fVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWFBLGtCQUFrQjtBQUVYLFNBQVMsbUJBQW1CQSxhQUFxQkMsVUFBMEI7Q0FDakYsTUFBTSx1QkFBdUIsMkJBQU8sR0FBRztDQUN2QyxNQUFNLFNBQVMsSUFBSSxXQUFXO0FBQzlCLFFBQU8sUUFBUSxlQUFlLEtBQUs7QUFDbkMsUUFBTyxpQkFBaUIsS0FBSztBQUM3QixRQUFPLGFBQWEsR0FBRztBQUN2QixRQUFPLGFBQWE7Q0FDcEIsTUFBTSxpQkFBaUIsT0FBTyxpQkFBaUI7RUFDOUMsT0FBTztFQUNQLE1BQU0sV0FBVztFQUNqQixPQUFPLEVBQ04sTUFBTSxNQUFNO0FBQ1gsVUFBTztJQUNOLGdCQUFFLE9BQU8sS0FBSyxJQUFJLDRCQUE0QixDQUFDO0lBQy9DLGdCQUFFLGNBQWMsRUFBRSxNQUFNLFNBQVMsaUJBQWtCLEVBQUM7SUFDcEQsZ0JBQUUsV0FBVztLQUNaLE9BQU87S0FDUCxPQUFPLHNCQUFzQjtLQUM3QixnQkFBZ0IsYUFBYTtLQUM3QixNQUFNLGNBQWM7S0FDcEIsU0FBUztJQUNULEVBQUM7SUFDRixnQkFBRSxPQUFPO0dBQ1Q7RUFDRCxFQUNEO0VBQ0QsVUFBVSxNQUFNO0dBQ2YsTUFBTSw0QkFBNEIsc0JBQXNCLENBQUMsTUFBTSxDQUFDLGFBQWE7R0FDN0UsTUFBTSxtQkFBbUIsWUFBWSxNQUFNLENBQUMsYUFBYTtHQUN6RCxNQUFNLG9CQUFvQixPQUFPLFVBQVUsQ0FBQyxRQUFRLE9BQU8sR0FBRyxDQUFDLGFBQWE7QUFFNUUsUUFBSyxjQUFjLGtCQUFrQixLQUFLLENBQ3pDLFFBQU8sUUFBUSx5QkFBeUI7VUFDN0IsY0FBYywyQkFBMkIsS0FBSyxDQUN6RCxRQUFPLFFBQVEseUJBQXlCO0lBRXhDLG9CQUNDLGtCQUNBLFFBQVEsWUFBWSx1QkFBdUIsa0JBQWtCLFVBQVUsbUJBQW1CLDBCQUEwQixDQUNwSCxDQUNDLEtBQUssTUFBTSxPQUFPLFFBQVEsc0JBQXNCLENBQUMsQ0FDakQsS0FBSyxNQUFNO0FBQ1gsbUJBQWUsT0FBTztBQUN0QixvQkFBRSxNQUFNLElBQUksVUFBVTtLQUNyQixXQUFXO0tBQ1gsYUFBYTtJQUNiLEVBQUM7R0FDRixFQUFDLENBQ0QsTUFBTSxDQUFDLE1BQU0sWUFBWSxFQUFFLENBQUM7RUFFL0I7RUFDRCxjQUFjLE1BQ2IsZ0JBQUUsTUFBTSxJQUFJLFVBQVUsRUFDckIsYUFBYSxLQUNiLEVBQUM7Q0FDSCxFQUFDO0FBQ0YsUUFBTztBQUNQO0FBRUQsU0FBUyxZQUFZQyxHQUFVO0FBQzlCLEtBQUksYUFBYSxzQkFDaEIsUUFBTyxRQUFRLGtCQUFrQjtTQUN2QixhQUFhLHNCQUFzQixhQUFhLHVCQUMxRCxRQUFPLFFBQVEsdUJBQXVCO1NBQzVCLGFBQWEsaUJBQ3ZCLFFBQU8sUUFBUSw2QkFBNkI7U0FDbEMsYUFBYSxxQkFDdkIsUUFBTyxRQUFRLHNCQUFzQjtJQUVyQyxPQUFNO0FBRVAifQ==