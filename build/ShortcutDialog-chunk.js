import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import { isAppleDevice } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import { Keys } from "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./ParserCombinator-chunk.js";
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
import { Dialog, TextField } from "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";

//#region src/common/gui/dialogs/ShortcutDialog.ts
function makeShortcutName(shortcut) {
	const mainModifier = isAppleDevice() ? Keys.META.name : Keys.CTRL.name;
	return lang.makeTranslation(shortcut.help, (shortcut.meta ? Keys.META.name + " + " : "") + (shortcut.ctrlOrCmd ? mainModifier + " + " : "") + (shortcut.ctrl ? Keys.CTRL.name + " + " : "") + (shortcut.shift ? Keys.SHIFT.name + " + " : "") + (shortcut.alt ? Keys.ALT.name + " + " : "") + shortcut.key.name);
}
function showShortcutDialog(shortcuts) {
	return Dialog.viewerDialog("keyboardShortcuts_title", ShortcutDialog, { shortcuts });
}
var ShortcutDialog = class {
	view(vnode) {
		const { shortcuts } = vnode.attrs;
		const textFieldAttrs = shortcuts.filter((shortcut) => shortcut.enabled == null || shortcut.enabled()).map((shortcut) => ({
			label: makeShortcutName(shortcut),
			value: lang.get(shortcut.help),
			isReadOnly: true
		}));
		return mithril_default("div.pb", textFieldAttrs.map((t) => mithril_default(TextField, t)));
	}
};

//#endregion
export { showShortcutDialog };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2hvcnRjdXREaWFsb2ctY2h1bmsuanMiLCJuYW1lcyI6WyJzaG9ydGN1dDogU2hvcnRjdXQiLCJzaG9ydGN1dHM6IEFycmF5PFNob3J0Y3V0PiIsInZub2RlOiBWbm9kZTxTaG9ydGN1dERpYWxvZ0F0dHJzPiJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vZ3VpL2RpYWxvZ3MvU2hvcnRjdXREaWFsb2cudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbGFuZywgVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgbSwgeyBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IEtleXMgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBUZXh0RmllbGQgfSBmcm9tIFwiLi4vYmFzZS9UZXh0RmllbGQuanNcIlxuaW1wb3J0IHR5cGUgeyBTaG9ydGN1dCB9IGZyb20gXCIuLi8uLi9taXNjL0tleU1hbmFnZXJcIlxuaW1wb3J0IHsgQnV0dG9uVHlwZSB9IGZyb20gXCIuLi9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBEaWFsb2dIZWFkZXJCYXJBdHRycyB9IGZyb20gXCIuLi9iYXNlL0RpYWxvZ0hlYWRlckJhclwiXG5pbXBvcnQgeyBpc0FwcGxlRGV2aWNlIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vRW52LmpzXCJcblxuZnVuY3Rpb24gbWFrZVNob3J0Y3V0TmFtZShzaG9ydGN1dDogU2hvcnRjdXQpOiBUcmFuc2xhdGlvbiB7XG5cdGNvbnN0IG1haW5Nb2RpZmllciA9IGlzQXBwbGVEZXZpY2UoKSA/IEtleXMuTUVUQS5uYW1lIDogS2V5cy5DVFJMLm5hbWVcblxuXHRyZXR1cm4gbGFuZy5tYWtlVHJhbnNsYXRpb24oXG5cdFx0c2hvcnRjdXQuaGVscCxcblx0XHQoc2hvcnRjdXQubWV0YSA/IEtleXMuTUVUQS5uYW1lICsgXCIgKyBcIiA6IFwiXCIpICtcblx0XHRcdChzaG9ydGN1dC5jdHJsT3JDbWQgPyBtYWluTW9kaWZpZXIgKyBcIiArIFwiIDogXCJcIikgK1xuXHRcdFx0KHNob3J0Y3V0LmN0cmwgPyBLZXlzLkNUUkwubmFtZSArIFwiICsgXCIgOiBcIlwiKSArXG5cdFx0XHQoc2hvcnRjdXQuc2hpZnQgPyBLZXlzLlNISUZULm5hbWUgKyBcIiArIFwiIDogXCJcIikgK1xuXHRcdFx0KHNob3J0Y3V0LmFsdCA/IEtleXMuQUxULm5hbWUgKyBcIiArIFwiIDogXCJcIikgK1xuXHRcdFx0c2hvcnRjdXQua2V5Lm5hbWUsXG5cdClcbn1cblxuLyoqXG4gKiByZXR1cm4gYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgZGlhbG9nIGlzIGNsb3NlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2hvd1Nob3J0Y3V0RGlhbG9nKHNob3J0Y3V0czogQXJyYXk8U2hvcnRjdXQ+KTogUHJvbWlzZTx2b2lkPiB7XG5cdHJldHVybiBEaWFsb2cudmlld2VyRGlhbG9nKFwia2V5Ym9hcmRTaG9ydGN1dHNfdGl0bGVcIiwgU2hvcnRjdXREaWFsb2csIHtcblx0XHRzaG9ydGN1dHMsXG5cdH0pXG59XG5cbnR5cGUgU2hvcnRjdXREaWFsb2dBdHRycyA9IHtcblx0c2hvcnRjdXRzOiBBcnJheTxTaG9ydGN1dD5cbn1cblxuLyoqXG4gKiBUaGUgRGlhbG9nIHRoYXQgc2hvd3MgdGhlIGN1cnJlbnRseSBhY3RpdmUgS2V5Ym9hcmQgc2hvcnRjdXRzIHdoZW4geW91IHByZXNzIEYxXG4gKlxuICpcbiAqL1xuXG5jbGFzcyBTaG9ydGN1dERpYWxvZyBpbXBsZW1lbnRzIENvbXBvbmVudDxTaG9ydGN1dERpYWxvZ0F0dHJzPiB7XG5cdHZpZXcodm5vZGU6IFZub2RlPFNob3J0Y3V0RGlhbG9nQXR0cnM+KSB7XG5cdFx0Y29uc3QgeyBzaG9ydGN1dHMgfSA9IHZub2RlLmF0dHJzXG5cdFx0Y29uc3QgdGV4dEZpZWxkQXR0cnMgPSBzaG9ydGN1dHNcblx0XHRcdC5maWx0ZXIoKHNob3J0Y3V0KSA9PiBzaG9ydGN1dC5lbmFibGVkID09IG51bGwgfHwgc2hvcnRjdXQuZW5hYmxlZCgpKVxuXHRcdFx0Lm1hcCgoc2hvcnRjdXQpID0+ICh7XG5cdFx0XHRcdGxhYmVsOiBtYWtlU2hvcnRjdXROYW1lKHNob3J0Y3V0KSxcblx0XHRcdFx0dmFsdWU6IGxhbmcuZ2V0KHNob3J0Y3V0LmhlbHApLFxuXHRcdFx0XHRpc1JlYWRPbmx5OiB0cnVlLFxuXHRcdFx0fSkpXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcImRpdi5wYlwiLFxuXHRcdFx0dGV4dEZpZWxkQXR0cnMubWFwKCh0KSA9PiBtKFRleHRGaWVsZCwgdCkpLFxuXHRcdClcblx0fVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBVUEsU0FBUyxpQkFBaUJBLFVBQWlDO0NBQzFELE1BQU0sZUFBZSxlQUFlLEdBQUcsS0FBSyxLQUFLLE9BQU8sS0FBSyxLQUFLO0FBRWxFLFFBQU8sS0FBSyxnQkFDWCxTQUFTLE9BQ1IsU0FBUyxPQUFPLEtBQUssS0FBSyxPQUFPLFFBQVEsT0FDeEMsU0FBUyxZQUFZLGVBQWUsUUFBUSxPQUM1QyxTQUFTLE9BQU8sS0FBSyxLQUFLLE9BQU8sUUFBUSxPQUN6QyxTQUFTLFFBQVEsS0FBSyxNQUFNLE9BQU8sUUFBUSxPQUMzQyxTQUFTLE1BQU0sS0FBSyxJQUFJLE9BQU8sUUFBUSxNQUN4QyxTQUFTLElBQUksS0FDZDtBQUNEO0FBS00sU0FBUyxtQkFBbUJDLFdBQTJDO0FBQzdFLFFBQU8sT0FBTyxhQUFhLDJCQUEyQixnQkFBZ0IsRUFDckUsVUFDQSxFQUFDO0FBQ0Y7SUFZSyxpQkFBTixNQUErRDtDQUM5RCxLQUFLQyxPQUFtQztFQUN2QyxNQUFNLEVBQUUsV0FBVyxHQUFHLE1BQU07RUFDNUIsTUFBTSxpQkFBaUIsVUFDckIsT0FBTyxDQUFDLGFBQWEsU0FBUyxXQUFXLFFBQVEsU0FBUyxTQUFTLENBQUMsQ0FDcEUsSUFBSSxDQUFDLGNBQWM7R0FDbkIsT0FBTyxpQkFBaUIsU0FBUztHQUNqQyxPQUFPLEtBQUssSUFBSSxTQUFTLEtBQUs7R0FDOUIsWUFBWTtFQUNaLEdBQUU7QUFDSixTQUFPLGdCQUNOLFVBQ0EsZUFBZSxJQUFJLENBQUMsTUFBTSxnQkFBRSxXQUFXLEVBQUUsQ0FBQyxDQUMxQztDQUNEO0FBQ0QifQ==