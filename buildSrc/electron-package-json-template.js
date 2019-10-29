const path = require('path')

/**
 * This is used for launching electron:
 * 1. copied to app-desktop/build from make.js
 * 2. copied to app-desktop/build/dist from dist.js (DesktopBuilder)
 */

module.exports = function (nameSuffix, version, targetUrl, iconPath, sign, notarize) {
	return {
		"name": "tutanota-desktop" + nameSuffix,
		"main": "./src/desktop/DesktopMain.js",
		"version": version,
		"author": "Tutao GmbH",
		"description": "The desktop client for Tutanota, the secure e-mail service.",
		"scripts": {
			"start": "electron ."
		},
		"tutao-config": {
			"pubKeys": [
				"-----BEGIN PUBLIC KEY-----\n"
				+ "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhFrLW999Y/ODqGfGKSzh\n"
				+ "7SFm6UgIj5scpb1r+KmEgVr/3zmd973+u2z5gG/wtayUbdVUGlzTgxqTE76BGTBR\n"
				+ "szq932uTsPfjRbtbyjIOzfzPvkyAB1Ew91gQk5ubrO1VCbXAZyuFi7RxDibuklLO\n"
				+ "lzHyjKyEIVTTdOqOTE+mg/vr41MxDW0X4nZw5MT1mIV/aYGeOSdtNdFsL69aR+d7\n"
				+ "KufD43J60FUS9G0tf4KmyQInmGqC8MSXCO0SMwwEJZDxDzkBsSensKfS0HzIjCXS\n"
				+ "or/Ahu6RwhEhjm7MyXbhiDyis+kGHSfatsO5KWWuZ4xgCEUO0L6vMQwr5M/qYOj1\n"
				+ "7QIDAQAB\n"
				+ "-----END PUBLIC KEY-----",
				"key2"
			],
			"pollingInterval": 1000 * 60 * 60 * 3, // 3 hours
			"preloadjs": "./src/desktop/preload.js",
			"desktophtml": "./desktop.html",
			"iconName": "logo-solo-red.png",
			"fileManagerTimeout": 30000,
			// true if this version checks its updates. use to prevent local builds from checking sigs.
			"checkUpdateSignature": sign || !!process.env.JENKINS,
			"appUserModelId": "de.tutao.tutanota" + nameSuffix,
			"initialSseConnectTimeoutInSeconds": 60,
			"maxSseConnectTimeoutInSeconds": 2400,
			"defaultDesktopConfig": {
				"heartbeatTimeoutInSeconds": 30,
				"defaultDownloadPath": null,
				"enableAutoUpdate": true,
				"runAsTrayApp": true,
			}
		},
		"dependencies": {
			"electron-updater": "4.1.2",
			"chalk": "2.4.2",
			"electron-localshortcut": "3.1.0",
			"fs-extra": "7.0.1",
			"bluebird": "3.5.2",
			"node-forge": "0.9.1",
			"winreg": "1.2.4",
			"keytar": "4.13.0"
		},
		"build": {
			"electronVersion": "6.0.12",
			"icon": iconPath,
			"appId": "de.tutao.tutanota" + nameSuffix,
			"productName": nameSuffix.length > 0
				? nameSuffix.slice(1) + " Tutanota Desktop"
				: "Tutanota Desktop",
			"artifactName": "${name}-${os}.${ext}",
			"afterSign": notarize ? "buildSrc/notarize.js" : undefined,
			"protocols": [
				{
					"name": "Mailto Links",
					"schemes": [
						"mailto"
					],
					"role": "Editor"
				}
			],
			"forceCodeSigning": sign || !!process.env.JENKINS,
			"publish": {
				"provider": "generic",
				"url": targetUrl,
				"channel": "latest",
				"publishAutoUpdate": true
			},
			"directories": {
				"output": "installers"
			},
			"extraResources": {
				"from": path.dirname(iconPath),
				"to": "./icons/"
			},
			"win": {
				"publisherName": "Tutao GmbH",
				"sign": sign
					? "./buildSrc/winsigner.js"
					: undefined,
				"signingHashAlgorithms": [
					"sha256"
				],
				"target": [
					{
						"target": "nsis",
						"arch": "x64"
					}
				]
			},
			"nsis": {
				"oneClick": false, "perMachine": false,
				"createStartMenuShortcut": true,
				"allowElevation": true,
				"allowToChangeInstallationDirectory": true
			},
			"mac": {
				"hardenedRuntime": true,
				"gatekeeperAssess": false,
				"entitlements": "buildSrc/mac-entitlements.plist",
				"entitlementsInherit": "buildSrc/mac-entitlements.plist",
				"icon": path.join(path.dirname(iconPath), "logo-solo-red.png.icns"),
				"extendInfo": {
					"LSUIElement": 1 //hide dock icon on startup
				},
				"target": [
					{
						"target": "zip",
						"arch": "x64"
					},
					{
						"target": "dmg",
						"arch": "x64"
					}
				]
			},
			"linux": {
				"icon": path.join(path.dirname(iconPath), "icon/"),
				"synopsis": "Tutanota Desktop Client",
				"category": "Network",
				"desktop": {
					"StartupWMClass": "tutanota-desktop" + nameSuffix
				},
				"target": [
					{
						"target": "AppImage",
						"arch": "x64"
					}
				]
			}
		}
	}
}

