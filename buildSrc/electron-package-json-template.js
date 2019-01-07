const path = require('path')

/**
 * This is used for launching electron:
 * 1. copied to app-desktop/build from build.js
 * 2. copied to app-desktop/build/dist from dist.js (DesktopBuilder)
 */

module.exports = function (nameSuffix, version, targetUrl, iconPath, sign) {
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
			"pubKeyUrl": "https://raw.githubusercontent.com/tutao/tutanota/electron-client/tutao-pub.pem",
			"pollingInterval": 4000000,
			// true if this version checks its updates. use to prevent local builds from checking sigs.
			"checkUpdateSignature": sign || !!process.env.JENKINS,
			"appUserModelId": "de.tutao.tutanota"
		},
		"dependencies": {
			"electron-updater": "^4.0.6",
			"electron-localshortcut": "^3.1.0",
			"fs-extra": "1.0.0",
			"bluebird": "3.5.2",
			"request": "^2.88.0",
			"node-forge": "^0.7.6"
		},
		"build": {
			"afterAllArtifactBuild": "./buildSrc/afterAllArtifactBuild.js",
			"electronVersion": "4.0.0",
			"icon": iconPath,
			"appId": "de.tutao.tutanota" + nameSuffix,
			"productName": nameSuffix.length > 0
				? nameSuffix.slice(1) + " Tutanota Desktop"
				: "Tutanota Desktop",
			"artifactName": "${name}-${os}.${ext}",
			"protocols": [
				{
					"name": "Mailto Links",
					"schemes": [
						"mailto"
					],
					"role": "Editor"
				}
			],
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
				"oneClick": true,
				"perMachine": false,
				"createStartMenuShortcut": true,
				"allowElevation": true,
			},
			"mac": {
				"extendInfo": {
					"LSUIElement": 1 //hide dock icon on startup
				},
				"target": [
					{
						"target": "zip",
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