import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import { assertMainOrNode } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import { ButtonType } from "./Button-chunk.js";
import { show } from "./NotificationOverlay-chunk.js";

//#region src/common/native/main/UpdatePrompt.ts
assertMainOrNode();
async function registerForUpdates(desktopSettingsFacade) {
	const updateInfo = await desktopSettingsFacade.getUpdateInfo();
	if (updateInfo) {
		let message = { view: () => mithril_default("", lang.get("updateAvailable_label", { "{version}": updateInfo.version })) };
		show(message, { label: "postpone_action" }, [{
			label: "installNow_action",
			click: () => desktopSettingsFacade.manualUpdate(),
			type: ButtonType.Primary
		}]);
	}
}

//#endregion
export { registerForUpdates };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXBkYXRlUHJvbXB0LWNodW5rLmpzIiwibmFtZXMiOlsiZGVza3RvcFNldHRpbmdzRmFjYWRlOiBTZXR0aW5nc0ZhY2FkZSJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vbmF0aXZlL21haW4vVXBkYXRlUHJvbXB0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtIGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBCdXR0b25UeXBlIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IHNob3cgfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvTm90aWZpY2F0aW9uT3ZlcmxheVwiXG5pbXBvcnQgeyBTZXR0aW5nc0ZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vZ2VuZXJhdGVkaXBjL1NldHRpbmdzRmFjYWRlLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWdpc3RlckZvclVwZGF0ZXMoZGVza3RvcFNldHRpbmdzRmFjYWRlOiBTZXR0aW5nc0ZhY2FkZSkge1xuXHRjb25zdCB1cGRhdGVJbmZvID0gYXdhaXQgZGVza3RvcFNldHRpbmdzRmFjYWRlLmdldFVwZGF0ZUluZm8oKVxuXG5cdGlmICh1cGRhdGVJbmZvKSB7XG5cdFx0bGV0IG1lc3NhZ2UgPSB7XG5cdFx0XHR2aWV3OiAoKSA9PlxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiXCIsXG5cdFx0XHRcdFx0bGFuZy5nZXQoXCJ1cGRhdGVBdmFpbGFibGVfbGFiZWxcIiwge1xuXHRcdFx0XHRcdFx0XCJ7dmVyc2lvbn1cIjogdXBkYXRlSW5mby52ZXJzaW9uLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpLFxuXHRcdH1cblx0XHRzaG93KFxuXHRcdFx0bWVzc2FnZSxcblx0XHRcdHtcblx0XHRcdFx0bGFiZWw6IFwicG9zdHBvbmVfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGFiZWw6IFwiaW5zdGFsbE5vd19hY3Rpb25cIixcblx0XHRcdFx0XHRjbGljazogKCkgPT4gZGVza3RvcFNldHRpbmdzRmFjYWRlLm1hbnVhbFVwZGF0ZSgpLFxuXHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBT0Esa0JBQWtCO0FBRVgsZUFBZSxtQkFBbUJBLHVCQUF1QztDQUMvRSxNQUFNLGFBQWEsTUFBTSxzQkFBc0IsZUFBZTtBQUU5RCxLQUFJLFlBQVk7RUFDZixJQUFJLFVBQVUsRUFDYixNQUFNLE1BQ0wsZ0JBQ0MsSUFDQSxLQUFLLElBQUkseUJBQXlCLEVBQ2pDLGFBQWEsV0FBVyxRQUN4QixFQUFDLENBQ0YsQ0FDRjtBQUNELE9BQ0MsU0FDQSxFQUNDLE9BQU8sa0JBQ1AsR0FDRCxDQUNDO0dBQ0MsT0FBTztHQUNQLE9BQU8sTUFBTSxzQkFBc0IsY0FBYztHQUNqRCxNQUFNLFdBQVc7RUFDakIsQ0FDRCxFQUNEO0NBQ0Q7QUFDRCJ9