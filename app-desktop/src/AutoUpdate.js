const {autoUpdater} = require('electron-updater')

exports.initAndCheck = () => {
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