// this is commonjs because it's called by electron-builder
const {notarize} = require('electron-notarize');

exports.default = async function notarizing(context) {
	const {electronPlatformName, appOutDir} = context;
	if (electronPlatformName !== 'darwin') {
		return;
	}

	const appName = context.packager.appInfo.productFilename;

	console.log(`Notarizing ${appName}`)
	return await notarize({
		appBundleId: 'de.tutao.tutanota',
		appPath: `${appOutDir}/${appName}.app`,
		appleId: process.env.APPLEID,
		appleIdPassword: process.env.APPLEIDPASS,
		tool: "notarytool", // notarytool is part of Xcode 13, default is "legacy", notarytool is much faster
	});
};