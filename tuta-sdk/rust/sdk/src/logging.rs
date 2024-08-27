use std::sync::atomic::{AtomicBool, Ordering};

/// If true, the logger has been initialized.
static LOG_INIT: AtomicBool = AtomicBool::new(false);

/// Initialize the logger.
///
/// This is a no-op if it is called multiple times.
#[allow(unreachable_code)] // android/ios implementations return before simple_logger code
pub(crate) fn init_logger() {
	if !LOG_INIT.swap(true, Ordering::Relaxed) {
		// We need to use android_log so our logs show up in logcat, as standard output isn't so trivial to access.
		#[cfg(target_os = "android")]
		{
			android_log::init("TutaSDK").expect("failed to load android_log logger");
			return;
		}

		// For iOS, we can trivially print to stdout which will work when debugging, but messages won't appear in Console, so we need to use the unified logging
		#[cfg(target_os = "ios")]
		{
			oslog::OsLogger::new("de.tutao.tutanota.tutasdk")
				.level_filter(log::LevelFilter::Trace)
				.init()
				.expect("failed to load oslog logger");
			return;
		}

		// Use standard output for logging by default
		simple_logger::init().expect("failed to load simple_logger logger");
	}
}
