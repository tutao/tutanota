import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import { isIOSApp } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import "./mithril-chunk.js";
import "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import "./TutanotaConstants-chunk.js";
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
import { PermissionError } from "./PermissionError-chunk.js";
import "./Button-chunk.js";
import "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import { Dialog } from "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import { PermissionType$1 as PermissionType } from "./PermissionType-chunk.js";

//#region src/common/native/main/SystemPermissionHandler.ts
var SystemPermissionHandler = class {
	constructor(systemFacade) {
		this.systemFacade = systemFacade;
	}
	async queryPermissionsState(permissions) {
		const permissionsStatus = new Map();
		for (const permission of permissions) permissionsStatus.set(permission, await this.hasPermission(permission));
		return permissionsStatus;
	}
	async hasPermission(permission) {
		if (permission === PermissionType.IgnoreBatteryOptimization && isIOSApp()) return true;
		return await this.systemFacade.hasPermission(permission);
	}
	async requestPermission(permission, deniedMessage) {
		try {
			await this.systemFacade.requestPermission(permission);
			return true;
		} catch (e) {
			if (e instanceof PermissionError) {
				console.warn("Permission denied for", permission);
				Dialog.confirm(deniedMessage).then((confirmed) => {
					if (confirmed) this.systemFacade.goToSettings();
				});
				return false;
			}
			throw e;
		}
	}
};

//#endregion
export { SystemPermissionHandler };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3lzdGVtUGVybWlzc2lvbkhhbmRsZXItY2h1bmsuanMiLCJuYW1lcyI6WyJzeXN0ZW1GYWNhZGU6IE1vYmlsZVN5c3RlbUZhY2FkZSIsInBlcm1pc3Npb25zOiBQZXJtaXNzaW9uVHlwZVtdIiwicGVybWlzc2lvbnNTdGF0dXM6IE1hcDxQZXJtaXNzaW9uVHlwZSwgYm9vbGVhbj4iLCJwZXJtaXNzaW9uOiBQZXJtaXNzaW9uVHlwZSIsImRlbmllZE1lc3NhZ2U6IFRyYW5zbGF0aW9uS2V5Il0sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1vbi9uYXRpdmUvbWFpbi9TeXN0ZW1QZXJtaXNzaW9uSGFuZGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2JpbGVTeXN0ZW1GYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9Nb2JpbGVTeXN0ZW1GYWNhZGUuanNcIlxuaW1wb3J0IHsgUGVybWlzc2lvblR5cGUgfSBmcm9tIFwiLi4vY29tbW9uL2dlbmVyYXRlZGlwYy9QZXJtaXNzaW9uVHlwZS5qc1wiXG5pbXBvcnQgeyBpc0lPU0FwcCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL0Vudi5qc1wiXG5pbXBvcnQgeyBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi8uLi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IFBlcm1pc3Npb25FcnJvciB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL2Vycm9yL1Blcm1pc3Npb25FcnJvci5qc1wiXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvRGlhbG9nLmpzXCJcblxuZXhwb3J0IGNsYXNzIFN5c3RlbVBlcm1pc3Npb25IYW5kbGVyIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBzeXN0ZW1GYWNhZGU6IE1vYmlsZVN5c3RlbUZhY2FkZSkge31cblxuXHRhc3luYyBxdWVyeVBlcm1pc3Npb25zU3RhdGUocGVybWlzc2lvbnM6IFBlcm1pc3Npb25UeXBlW10pIHtcblx0XHRjb25zdCBwZXJtaXNzaW9uc1N0YXR1czogTWFwPFBlcm1pc3Npb25UeXBlLCBib29sZWFuPiA9IG5ldyBNYXAoKVxuXG5cdFx0Zm9yIChjb25zdCBwZXJtaXNzaW9uIG9mIHBlcm1pc3Npb25zKSB7XG5cdFx0XHRwZXJtaXNzaW9uc1N0YXR1cy5zZXQocGVybWlzc2lvbiwgYXdhaXQgdGhpcy5oYXNQZXJtaXNzaW9uKHBlcm1pc3Npb24pKVxuXHRcdH1cblxuXHRcdHJldHVybiBwZXJtaXNzaW9uc1N0YXR1c1xuXHR9XG5cblx0YXN5bmMgaGFzUGVybWlzc2lvbihwZXJtaXNzaW9uOiBQZXJtaXNzaW9uVHlwZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGlmIChwZXJtaXNzaW9uID09PSBQZXJtaXNzaW9uVHlwZS5JZ25vcmVCYXR0ZXJ5T3B0aW1pemF0aW9uICYmIGlzSU9TQXBwKCkpIHtcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGF3YWl0IHRoaXMuc3lzdGVtRmFjYWRlLmhhc1Blcm1pc3Npb24ocGVybWlzc2lvbilcblx0fVxuXG5cdGFzeW5jIHJlcXVlc3RQZXJtaXNzaW9uKHBlcm1pc3Npb246IFBlcm1pc3Npb25UeXBlLCBkZW5pZWRNZXNzYWdlOiBUcmFuc2xhdGlvbktleSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLnN5c3RlbUZhY2FkZS5yZXF1ZXN0UGVybWlzc2lvbihwZXJtaXNzaW9uKVxuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFBlcm1pc3Npb25FcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oXCJQZXJtaXNzaW9uIGRlbmllZCBmb3JcIiwgcGVybWlzc2lvbilcblx0XHRcdFx0RGlhbG9nLmNvbmZpcm0oZGVuaWVkTWVzc2FnZSkudGhlbigoY29uZmlybWVkKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGNvbmZpcm1lZCkge1xuXHRcdFx0XHRcdFx0dGhpcy5zeXN0ZW1GYWNhZGUuZ29Ub1NldHRpbmdzKClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fVxuXHRcdFx0dGhyb3cgZVxuXHRcdH1cblx0fVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQU9hLDBCQUFOLE1BQThCO0NBQ3BDLFlBQTZCQSxjQUFrQztFQXNDL0QsS0F0QzZCO0NBQW9DO0NBRWpFLE1BQU0sc0JBQXNCQyxhQUErQjtFQUMxRCxNQUFNQyxvQkFBa0QsSUFBSTtBQUU1RCxPQUFLLE1BQU0sY0FBYyxZQUN4QixtQkFBa0IsSUFBSSxZQUFZLE1BQU0sS0FBSyxjQUFjLFdBQVcsQ0FBQztBQUd4RSxTQUFPO0NBQ1A7Q0FFRCxNQUFNLGNBQWNDLFlBQThDO0FBQ2pFLE1BQUksZUFBZSxlQUFlLDZCQUE2QixVQUFVLENBQ3hFLFFBQU87QUFHUixTQUFPLE1BQU0sS0FBSyxhQUFhLGNBQWMsV0FBVztDQUN4RDtDQUVELE1BQU0sa0JBQWtCQSxZQUE0QkMsZUFBaUQ7QUFDcEcsTUFBSTtBQUNILFNBQU0sS0FBSyxhQUFhLGtCQUFrQixXQUFXO0FBQ3JELFVBQU87RUFDUCxTQUFRLEdBQUc7QUFDWCxPQUFJLGFBQWEsaUJBQWlCO0FBQ2pDLFlBQVEsS0FBSyx5QkFBeUIsV0FBVztBQUNqRCxXQUFPLFFBQVEsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjO0FBQ2pELFNBQUksVUFDSCxNQUFLLGFBQWEsY0FBYztJQUVqQyxFQUFDO0FBQ0YsV0FBTztHQUNQO0FBQ0QsU0FBTTtFQUNOO0NBQ0Q7QUFDRCJ9