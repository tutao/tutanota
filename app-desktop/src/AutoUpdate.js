const {autoUpdater} = require('electron-updater')

exports.initAndCheck = () => {

	autoUpdater.logger = {
		info: (m) => console.log("info: ", m),
		debug: (m) => console.log("debug: ", m),
		verbose: (m) => console.log("verbose: ", m),
		error: (m) => console.log("ERROR: ", m),
		warn: (m) => console.log("warn: ", m),
		silly: (m) => console.log("silly: ", m)
	}

	autoUpdater.on('checking-for-update', () => {
		autoUpdater.logger.info('[o] Checking for update...');
	})
	autoUpdater.on('update-available', () => {
		autoUpdater.logger.info('[o] Update available.');
	})
	autoUpdater.on('update-not-available', () => {
		autoUpdater.logger.info('[o] Update not available.');
	})
	autoUpdater.on('error', (err) => {
		autoUpdater.logger.info('[o] Error in auto-updater. ' + err);
	})

	autoUpdater.checkForUpdatesAndNotify()
}