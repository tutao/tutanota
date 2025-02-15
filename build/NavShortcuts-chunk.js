import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import "./Env-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import "./dist2-chunk.js";
import { FeatureType, Keys } from "./TutanotaConstants-chunk.js";
import { keyManager } from "./KeyManager-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { CALENDAR_PREFIX, CONTACTS_PREFIX, LogoutUrl, MAIL_PREFIX, SETTINGS_PREFIX } from "./RouteChange-chunk.js";

//#region src/common/misc/NavShortcuts.ts
function setupNavShortcuts() {
	keyManager.registerShortcuts([
		{
			key: Keys.M,
			enabled: () => locator.logins.isUserLoggedIn(),
			exec: () => mithril_default.route.set(MAIL_PREFIX),
			help: "mailView_action"
		},
		{
			key: Keys.C,
			enabled: () => locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableContacts),
			exec: () => mithril_default.route.set(CONTACTS_PREFIX),
			help: "contactView_action"
		},
		{
			key: Keys.O,
			enabled: () => locator.logins.isInternalUserLoggedIn(),
			exec: () => mithril_default.route.set(CALENDAR_PREFIX),
			help: "calendarView_action"
		},
		{
			key: Keys.S,
			enabled: () => locator.logins.isInternalUserLoggedIn(),
			exec: () => mithril_default.route.set(SETTINGS_PREFIX),
			help: "settingsView_action"
		},
		{
			key: Keys.L,
			shift: true,
			ctrlOrCmd: true,
			enabled: () => locator.logins.isUserLoggedIn(),
			exec: (key) => mithril_default.route.set(LogoutUrl),
			help: "switchAccount_action"
		}
	]);
}

//#endregion
export { setupNavShortcuts };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmF2U2hvcnRjdXRzLWNodW5rLmpzIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vbWlzYy9OYXZTaG9ydGN1dHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsga2V5TWFuYWdlciB9IGZyb20gXCIuL0tleU1hbmFnZXIuanNcIlxuaW1wb3J0IHsgRmVhdHVyZVR5cGUsIEtleXMgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3IuanNcIlxuaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgQ0FMRU5EQVJfUFJFRklYLCBDT05UQUNUU19QUkVGSVgsIExvZ291dFVybCwgTUFJTF9QUkVGSVgsIFNFVFRJTkdTX1BSRUZJWCB9IGZyb20gXCIuL1JvdXRlQ2hhbmdlLmpzXCJcblxuZXhwb3J0IGZ1bmN0aW9uIHNldHVwTmF2U2hvcnRjdXRzKCkge1xuXHRrZXlNYW5hZ2VyLnJlZ2lzdGVyU2hvcnRjdXRzKFtcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuTSxcblx0XHRcdGVuYWJsZWQ6ICgpID0+IGxvY2F0b3IubG9naW5zLmlzVXNlckxvZ2dlZEluKCksXG5cdFx0XHRleGVjOiAoKSA9PiBtLnJvdXRlLnNldChNQUlMX1BSRUZJWCksXG5cdFx0XHRoZWxwOiBcIm1haWxWaWV3X2FjdGlvblwiLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0a2V5OiBLZXlzLkMsXG5cdFx0XHRlbmFibGVkOiAoKSA9PiBsb2NhdG9yLmxvZ2lucy5pc0ludGVybmFsVXNlckxvZ2dlZEluKCkgJiYgIWxvY2F0b3IubG9naW5zLmlzRW5hYmxlZChGZWF0dXJlVHlwZS5EaXNhYmxlQ29udGFjdHMpLFxuXHRcdFx0ZXhlYzogKCkgPT4gbS5yb3V0ZS5zZXQoQ09OVEFDVFNfUFJFRklYKSxcblx0XHRcdGhlbHA6IFwiY29udGFjdFZpZXdfYWN0aW9uXCIsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuTyxcblx0XHRcdGVuYWJsZWQ6ICgpID0+IGxvY2F0b3IubG9naW5zLmlzSW50ZXJuYWxVc2VyTG9nZ2VkSW4oKSxcblx0XHRcdGV4ZWM6ICgpID0+IG0ucm91dGUuc2V0KENBTEVOREFSX1BSRUZJWCksXG5cdFx0XHRoZWxwOiBcImNhbGVuZGFyVmlld19hY3Rpb25cIixcblx0XHR9LFxuXHRcdHtcblx0XHRcdGtleTogS2V5cy5TLFxuXHRcdFx0ZW5hYmxlZDogKCkgPT4gbG9jYXRvci5sb2dpbnMuaXNJbnRlcm5hbFVzZXJMb2dnZWRJbigpLFxuXHRcdFx0ZXhlYzogKCkgPT4gbS5yb3V0ZS5zZXQoU0VUVElOR1NfUFJFRklYKSxcblx0XHRcdGhlbHA6IFwic2V0dGluZ3NWaWV3X2FjdGlvblwiLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0a2V5OiBLZXlzLkwsXG5cdFx0XHRzaGlmdDogdHJ1ZSxcblx0XHRcdGN0cmxPckNtZDogdHJ1ZSxcblx0XHRcdGVuYWJsZWQ6ICgpID0+IGxvY2F0b3IubG9naW5zLmlzVXNlckxvZ2dlZEluKCksXG5cdFx0XHRleGVjOiAoa2V5KSA9PiBtLnJvdXRlLnNldChMb2dvdXRVcmwpLFxuXHRcdFx0aGVscDogXCJzd2l0Y2hBY2NvdW50X2FjdGlvblwiLFxuXHRcdH0sXG5cdF0pXG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBTU8sU0FBUyxvQkFBb0I7QUFDbkMsWUFBVyxrQkFBa0I7RUFDNUI7R0FDQyxLQUFLLEtBQUs7R0FDVixTQUFTLE1BQU0sUUFBUSxPQUFPLGdCQUFnQjtHQUM5QyxNQUFNLE1BQU0sZ0JBQUUsTUFBTSxJQUFJLFlBQVk7R0FDcEMsTUFBTTtFQUNOO0VBQ0Q7R0FDQyxLQUFLLEtBQUs7R0FDVixTQUFTLE1BQU0sUUFBUSxPQUFPLHdCQUF3QixLQUFLLFFBQVEsT0FBTyxVQUFVLFlBQVksZ0JBQWdCO0dBQ2hILE1BQU0sTUFBTSxnQkFBRSxNQUFNLElBQUksZ0JBQWdCO0dBQ3hDLE1BQU07RUFDTjtFQUNEO0dBQ0MsS0FBSyxLQUFLO0dBQ1YsU0FBUyxNQUFNLFFBQVEsT0FBTyx3QkFBd0I7R0FDdEQsTUFBTSxNQUFNLGdCQUFFLE1BQU0sSUFBSSxnQkFBZ0I7R0FDeEMsTUFBTTtFQUNOO0VBQ0Q7R0FDQyxLQUFLLEtBQUs7R0FDVixTQUFTLE1BQU0sUUFBUSxPQUFPLHdCQUF3QjtHQUN0RCxNQUFNLE1BQU0sZ0JBQUUsTUFBTSxJQUFJLGdCQUFnQjtHQUN4QyxNQUFNO0VBQ047RUFDRDtHQUNDLEtBQUssS0FBSztHQUNWLE9BQU87R0FDUCxXQUFXO0dBQ1gsU0FBUyxNQUFNLFFBQVEsT0FBTyxnQkFBZ0I7R0FDOUMsTUFBTSxDQUFDLFFBQVEsZ0JBQUUsTUFBTSxJQUFJLFVBQVU7R0FDckMsTUFBTTtFQUNOO0NBQ0QsRUFBQztBQUNGIn0=