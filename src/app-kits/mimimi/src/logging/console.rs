use crate::logging::logger::{LogLevel, LogMessage, Logger};
use log::{Level, LevelFilter, Log, Metadata, Record};
use napi::Env;
use std::sync::mpsc::Sender;
use std::sync::Once;
use std::sync::RwLock;

const TAG: &str = file!();

/// Maintain one instance of the logger, as the log crate can only have the logger be set exactly
/// once.
static GLOBAL_CONSOLE: Console = Console {
	sender: RwLock::new(None),
};

/// A way for the rust code to log messages to the main applications log files
/// without having to deal with obtaining a reference to console each time.
pub struct Console {
	sender: RwLock<Option<Sender<LogMessage>>>,
}

impl Log for Console {
	fn enabled(&self, metadata: &Metadata) -> bool {
		metadata.level() <= Level::Info
	}

	fn log(&self, record: &Record) {
		let metadata = record.metadata();
		if !self.enabled(metadata) {
			return;
		}

		let tag = record.file().unwrap_or("<unknown>").to_string();

		let lock = self.sender.read().expect("poisoned");
		if let Some(sender) = lock.as_ref() {
			let _ = sender.send(LogMessage {
				level: record.metadata().level().into(),
				message: format!("{}", record.args()),
				tag,
			});
		}
	}

	fn flush(&self) {}
}

impl Console {
	pub fn init(env: Env) {
		// println because log is not init yet
		println!("initializing logger");
		Self::init_global_state();

		let mut current_sender = GLOBAL_CONSOLE.sender.write().expect("poisoned");
		if current_sender.is_some() {
			// some other thread already initialized the cell, we don't need to set up the logger.
			return;
		}

		let (tx, rx) = std::sync::mpsc::channel::<LogMessage>();
		let logger = Logger::new(rx);
		let maybe_async_task = env.spawn(logger);

		match maybe_async_task {
			Ok(_logger_task) => {
				*current_sender = Some(tx);
				drop(current_sender);
				GLOBAL_CONSOLE.log(
					&Record::builder()
						.level(Level::Info)
						.file(Some(TAG))
						.args(format_args!("{}", "spawned logger"))
						.build(),
				);
			},
			Err(e) => {
				eprintln!("failed to spawn logger: {e}");
			},
		}
	}

	pub fn deinit() {
		let sender = GLOBAL_CONSOLE
			.sender
			.write()
			.expect("poisoned")
			.take()
			.expect("cannot deinit logger before initializing");
		sender
			.send(LogMessage {
				level: LogLevel::Finish,
				message: "called deinit".to_string(),
				tag: "[deinit]".to_string(),
			})
			.expect("Can not send finish log message. Receiver already disconnected");
	}

	/// Sets the panic hook and global logger.
	///
	/// This function must be called once before the console can be used, but it can be safely
	/// called multiple times, and it is thread-safe.
	fn init_global_state() {
		// Limit scope to this function only.
		static GLOBAL_CONSOLE_SETUP: Once = Once::new();

		GLOBAL_CONSOLE_SETUP.call_once(|| {
			// Sets the logger to the static instance and sets up the panic hook.
			// This can fail if the logger was set somewhere else.
			if let Err(e) = log::set_logger(&GLOBAL_CONSOLE) {
				eprintln!("failed to set logger: {e}");
			} else {
				log::set_max_level(LevelFilter::Info);
			}

			// set a panic hook that tries to log the panic to the JS side before continuing
			// a normal unwind. should work unless the panicking thread is the main thread.
			let logger_thread_id = std::thread::current().id();
			let old_panic_hook = std::panic::take_hook();

			std::panic::set_hook(Box::new(move |panic_info| {
				let formatted_info = panic_info.to_string();
				let formatted_stack = std::backtrace::Backtrace::force_capture().to_string();
				if logger_thread_id == std::thread::current().id() {
					// logger is (probably) running on the currently panicking thread,
					// so we can't use it to log to JS. this at least shows up in stderr.
					eprintln!("PANIC MAIN {}", formatted_info);
					eprintln!("PANIC MAIN {}", formatted_stack);
				} else {
					GLOBAL_CONSOLE.log(
						&Record::builder()
							.level(Level::Error)
							.file(Some("PANIC"))
							.args(format_args!(
								"thread {} {}",
								std::thread::current().name().unwrap_or("<unknown>"),
								formatted_info
							))
							.build(),
					);
					GLOBAL_CONSOLE.log(
						&Record::builder()
							.level(Level::Error)
							.file(Some("PANIC"))
							.args(format_args!("{}", formatted_stack.as_str()))
							.build(),
					);
				}
				old_panic_hook(panic_info)
			}));
		});
	}
}
