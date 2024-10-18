use crate::logging::logger::{LogLevel, LogMessage, Logger};
use napi::Env;
use std::sync::OnceLock;

const TAG: &'static str = file!();

pub static INSTANCE: OnceLock<Console> = OnceLock::new();

/// A way for the rust code to log messages to the main applications log files
/// without having to deal with obtaining a reference to console each time.
#[derive(Clone)]
pub struct Console {
	tx: std::sync::mpsc::Sender<LogMessage>,
}

impl Console {
	pub fn get(env: Env) -> &'static Self {
		let (tx, rx) = std::sync::mpsc::channel::<LogMessage>();
		let console = Console { tx };
		let logger = Logger::new(rx);
		let Ok(()) = INSTANCE.set(console) else {
			// some other thread already initialized the cell, we don't need to set up the logger.
			return INSTANCE
				.get()
				.expect("should already have been initialized!");
		};

		// this may be the instance set by another thread, but that's okay.
		let console = INSTANCE.get().expect("not initialized");
		let maybe_async_task = env.spawn(logger);
		match maybe_async_task {
			Ok(_) => console.log(TAG, "spawned logger"),
			Err(e) => eprintln!("failed to spawn logger: {e}"),
		};
		set_panic_hook(console);
		console
	}

	pub fn log(&self, tag: &str, message: &str) {
		// todo: this returns Err if the logger closes the channel, what to do in that case?
		let _ = self.tx.send(LogMessage {
			level: LogLevel::Log,
			tag: tag.into(),
			message: message.into(),
		});
	}
	pub fn warn(&self, tag: &str, message: &str) {
		let _ = self.tx.send(LogMessage {
			level: LogLevel::Warn,
			tag: tag.into(),
			message: message.into(),
		});
	}

	pub fn error(&self, tag: &str, message: &str) {
		let _ = self.tx.send(LogMessage {
			level: LogLevel::Error,
			tag: tag.into(),
			message: message.into(),
		});
	}
}

/// set a panic hook that tries to log the panic to the JS side before continuing
/// a normal unwind. should work unless the panicking thread is the main thread.
fn set_panic_hook(console: &'static Console) {
	let logger_thread_id = std::thread::current().id();
	let panic_console = console.clone();
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
			panic_console.error(
				"PANIC",
				format!(
					"thread {} {}",
					std::thread::current().name().unwrap_or_else(|| "<unknown>"),
					formatted_info
				)
				.as_str(),
			);
			panic_console.error("PANIC", formatted_stack.as_str());
		}
		old_panic_hook(panic_info)
	}));
}
