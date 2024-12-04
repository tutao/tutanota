use crate::logging::logger::{LogMessage, Logger};
use log::{Level, LevelFilter, Log, Metadata, Record};
use napi::Env;
use std::sync::OnceLock;

const TAG: &str = file!();

pub static GLOBAL_CONSOLE: OnceLock<Console> = OnceLock::new();

/// A way for the rust code to log messages to the main applications log files
/// without having to deal with obtaining a reference to console each time.
#[derive(Clone)]
pub struct Console {
	tx: std::sync::mpsc::Sender<LogMessage>,
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

		let _ = self.tx.send(LogMessage {
			level: record.metadata().level().into(),
			message: format!("{}", record.args()),
			tag,
		});
	}

	fn flush(&self) {}
}

impl Console {
	pub fn init(env: Env) {
		let (tx, rx) = std::sync::mpsc::channel::<LogMessage>();
		let console = Console { tx };
		let logger = Logger::new(rx);
		let Ok(()) = GLOBAL_CONSOLE.set(console) else {
			// some other thread already initialized the cell, we don't need to set up the logger.
			return;
		};

		// this may be the instance set by another thread, but that's okay.
		let console = GLOBAL_CONSOLE.get().expect("not initialized");
		let maybe_async_task = env.spawn(logger);
		match maybe_async_task {
			Ok(_) => console.log(
				&Record::builder()
					.level(Level::Info)
					.file(Some(TAG))
					.args(format_args!("{}", "spawned logger"))
					.build(),
			),
			Err(e) => eprintln!("failed to spawn logger: {e}"),
		};
		set_panic_hook(console);
		log::set_logger(console).unwrap_or_else(|e| eprintln!("failed to set logger: {e}"));
		log::set_max_level(LevelFilter::Info);
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
			panic_console.log(
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
			panic_console.log(
				&Record::builder()
					.level(Level::Error)
					.file(Some("PANIC"))
					.args(format_args!("{}", formatted_stack.as_str()))
					.build(),
			);
		}
		old_panic_hook(panic_info)
	}));
}
