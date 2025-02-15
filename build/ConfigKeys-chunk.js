
//#region src/common/desktop/config/ConfigKeys.ts
let DesktopConfigKey = function(DesktopConfigKey$1) {
	DesktopConfigKey$1["heartbeatTimeoutInSeconds"] = "heartbeatTimeoutInSeconds";
	DesktopConfigKey$1["defaultDownloadPath"] = "defaultDownloadPath";
	DesktopConfigKey$1["enableAutoUpdate"] = "enableAutoUpdate";
	DesktopConfigKey$1["showAutoUpdateOption"] = "showAutoUpdateOption";
	DesktopConfigKey$1["runAsTrayApp"] = "runAsTrayApp";
	DesktopConfigKey$1["lastBounds"] = "lastBounds";
	DesktopConfigKey$1["pushEncSessionKeys"] = "pushEncSessionKeys";
	DesktopConfigKey$1["scheduledAlarms"] = "scheduledAlarms";
	DesktopConfigKey$1["lastProcessedNotificationId"] = "lastProcessedNotificationId";
	DesktopConfigKey$1["lastMissedNotificationCheckTime"] = "lastMissedNotificationCheckTime";
	DesktopConfigKey$1["desktopConfigVersion"] = "desktopConfigVersion";
	DesktopConfigKey$1["mailExportMode"] = "mailExportMode";
	DesktopConfigKey$1["spellcheck"] = "spellcheck";
	DesktopConfigKey$1["selectedTheme"] = "selectedTheme";
	DesktopConfigKey$1["themes"] = "themes";
	/** the app password salt for encrypting the credentials key */
	DesktopConfigKey$1["appPassSalt"] = "appPassSalt";
	DesktopConfigKey$1["webConfigLocation"] = "webConfigLocation";
	DesktopConfigKey$1["extendedNotificationMode"] = "extendedNotificationMode";
	DesktopConfigKey$1["mailboxExportState"] = "mailboxExportState";
	return DesktopConfigKey$1;
}({});
let DesktopConfigEncKey = function(DesktopConfigEncKey$1) {
	DesktopConfigEncKey$1["sseInfo"] = "sseInfo";
	return DesktopConfigEncKey$1;
}({});
let BuildConfigKey = function(BuildConfigKey$1) {
	BuildConfigKey$1["pollingInterval"] = "pollingInterval";
	BuildConfigKey$1["checkUpdateSignature"] = "checkUpdateSignature";
	BuildConfigKey$1["appUserModelId"] = "appUserModelId";
	BuildConfigKey$1["initialSseConnectTimeoutInSeconds"] = "initialSseConnectTimeoutInSeconds";
	BuildConfigKey$1["maxSseConnectTimeoutInSeconds"] = "maxSseConnectTimeoutInSeconds";
	BuildConfigKey$1["defaultDesktopConfig"] = "defaultDesktopConfig";
	BuildConfigKey$1["iconName"] = "iconName";
	BuildConfigKey$1["fileManagerTimeout"] = "fileManagerTimeout";
	BuildConfigKey$1["pubKeys"] = "pubKeys";
	BuildConfigKey$1["updateUrl"] = "updateUrl";
	return BuildConfigKey$1;
}({});

//#endregion
export { DesktopConfigKey };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29uZmlnS2V5cy1jaHVuay5qcyIsIm5hbWVzIjpbXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2Rlc2t0b3AvY29uZmlnL0NvbmZpZ0tleXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQGJ1bmRsZUludG86Y29tbW9uXG5cbmV4cG9ydCBlbnVtIERlc2t0b3BDb25maWdLZXkge1xuXHRoZWFydGJlYXRUaW1lb3V0SW5TZWNvbmRzID0gXCJoZWFydGJlYXRUaW1lb3V0SW5TZWNvbmRzXCIsXG5cdGRlZmF1bHREb3dubG9hZFBhdGggPSBcImRlZmF1bHREb3dubG9hZFBhdGhcIixcblx0ZW5hYmxlQXV0b1VwZGF0ZSA9IFwiZW5hYmxlQXV0b1VwZGF0ZVwiLFxuXHRzaG93QXV0b1VwZGF0ZU9wdGlvbiA9IFwic2hvd0F1dG9VcGRhdGVPcHRpb25cIixcblx0cnVuQXNUcmF5QXBwID0gXCJydW5Bc1RyYXlBcHBcIixcblx0bGFzdEJvdW5kcyA9IFwibGFzdEJvdW5kc1wiLFxuXHRwdXNoRW5jU2Vzc2lvbktleXMgPSBcInB1c2hFbmNTZXNzaW9uS2V5c1wiLFxuXHRzY2hlZHVsZWRBbGFybXMgPSBcInNjaGVkdWxlZEFsYXJtc1wiLFxuXHRsYXN0UHJvY2Vzc2VkTm90aWZpY2F0aW9uSWQgPSBcImxhc3RQcm9jZXNzZWROb3RpZmljYXRpb25JZFwiLFxuXHRsYXN0TWlzc2VkTm90aWZpY2F0aW9uQ2hlY2tUaW1lID0gXCJsYXN0TWlzc2VkTm90aWZpY2F0aW9uQ2hlY2tUaW1lXCIsXG5cdGRlc2t0b3BDb25maWdWZXJzaW9uID0gXCJkZXNrdG9wQ29uZmlnVmVyc2lvblwiLFxuXHRtYWlsRXhwb3J0TW9kZSA9IFwibWFpbEV4cG9ydE1vZGVcIixcblx0c3BlbGxjaGVjayA9IFwic3BlbGxjaGVja1wiLFxuXHRzZWxlY3RlZFRoZW1lID0gXCJzZWxlY3RlZFRoZW1lXCIsXG5cdHRoZW1lcyA9IFwidGhlbWVzXCIsXG5cdC8qKiB0aGUgYXBwIHBhc3N3b3JkIHNhbHQgZm9yIGVuY3J5cHRpbmcgdGhlIGNyZWRlbnRpYWxzIGtleSAqL1xuXHRhcHBQYXNzU2FsdCA9IFwiYXBwUGFzc1NhbHRcIixcblx0d2ViQ29uZmlnTG9jYXRpb24gPSBcIndlYkNvbmZpZ0xvY2F0aW9uXCIsXG5cdGV4dGVuZGVkTm90aWZpY2F0aW9uTW9kZSA9IFwiZXh0ZW5kZWROb3RpZmljYXRpb25Nb2RlXCIsXG5cdG1haWxib3hFeHBvcnRTdGF0ZSA9IFwibWFpbGJveEV4cG9ydFN0YXRlXCIsXG59XG5cbmV4cG9ydCBlbnVtIERlc2t0b3BDb25maWdFbmNLZXkge1xuXHRzc2VJbmZvID0gXCJzc2VJbmZvXCIsXG59XG5cbmV4cG9ydCBlbnVtIEJ1aWxkQ29uZmlnS2V5IHtcblx0cG9sbGluZ0ludGVydmFsID0gXCJwb2xsaW5nSW50ZXJ2YWxcIixcblx0Y2hlY2tVcGRhdGVTaWduYXR1cmUgPSBcImNoZWNrVXBkYXRlU2lnbmF0dXJlXCIsXG5cdGFwcFVzZXJNb2RlbElkID0gXCJhcHBVc2VyTW9kZWxJZFwiLFxuXHRpbml0aWFsU3NlQ29ubmVjdFRpbWVvdXRJblNlY29uZHMgPSBcImluaXRpYWxTc2VDb25uZWN0VGltZW91dEluU2Vjb25kc1wiLFxuXHRtYXhTc2VDb25uZWN0VGltZW91dEluU2Vjb25kcyA9IFwibWF4U3NlQ29ubmVjdFRpbWVvdXRJblNlY29uZHNcIixcblx0ZGVmYXVsdERlc2t0b3BDb25maWcgPSBcImRlZmF1bHREZXNrdG9wQ29uZmlnXCIsXG5cdGljb25OYW1lID0gXCJpY29uTmFtZVwiLFxuXHRmaWxlTWFuYWdlclRpbWVvdXQgPSBcImZpbGVNYW5hZ2VyVGltZW91dFwiLFxuXHRwdWJLZXlzID0gXCJwdWJLZXlzXCIsXG5cdHVwZGF0ZVVybCA9IFwidXBkYXRlVXJsXCIsXG59XG4iXSwibWFwcGluZ3MiOiI7O0lBRVksZ0RBQUw7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBQ0E7SUFFVyxzREFBTDtBQUNOOztBQUNBO0lBRVcsNENBQUw7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSJ9