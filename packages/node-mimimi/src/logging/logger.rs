use log::Level;
use napi::{bindgen_prelude::*, Env, JsFunction, JsObject, JsUndefined};

/// The part of the logging setup that receives log messages from the rust log
/// {@link struct Console} and forwards them to the node environment to log.
pub struct Logger {
	/// This is an option because we need to Option::take it from the old instance before
	/// rescheduling the listen job with a new one.
	rx: Option<std::sync::mpsc::Receiver<LogMessage>>,
}

impl Logger {
	pub fn new(rx: std::sync::mpsc::Receiver<LogMessage>) -> Self {
		Self { rx: Some(rx) }
	}
	fn execute_log(&self, env: Env, log_message: LogMessage) {
		let globals = env.get_global().expect("no globals in env");
		let console: JsObject = globals
			.get_named_property("console")
			.expect("console property not found");

		let formatted_message = format!(
			"[{} {}] {}",
			log_message.marker(),
			log_message.tag,
			log_message.message
		);
		let js_string: napi::JsString = env
			.create_string_from_std(formatted_message)
			.expect("could not create string");

		let js_error: JsFunction = console
			.get_named_property(log_message.method())
			.expect("logging fn not found");
		js_error.call(None, &[js_string]).expect("logging failed");
	}
}

#[cfg(feature = "javascript")]
impl Task for Logger {
	type Output = LogMessage;
	type JsValue = JsUndefined;

	/// runs on the libuv thread pool.
	fn compute(&mut self) -> Result<Self::Output> {
		if let Some(rx) = &self.rx {
			Ok(rx.recv().unwrap_or_else(|_| LogMessage {
				level: LogLevel::Finish,
				tag: "Logger".to_string(),
				message: "channel closed, logger finished".to_string(),
			}))
		} else {
			// should not happen - each Logger instance listens for exactly one message and then
			// gets dropped and reincarnated.
			Ok(LogMessage {
				level: LogLevel::Error,
				tag: "Logger".to_string(),
				message: "rx not available, already moved".to_string(),
			})
		}
	}

	/// runs on the main thread and receives the output produced by compute
	fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
		let level = output.level;
		self.execute_log(env, output);
		if level != LogLevel::Finish {
			// we only have a &mut self, so can't revive ourselves directly.
			// I guess this is reincarnation.
			let rx = self.rx.take();
			let _promise = env.spawn(Logger { rx });
		}
		env.get_undefined()
	}
}

/// determines the urgency and some formatting of the log message
#[derive(Eq, PartialEq, Copy, Clone)]
pub enum LogLevel {
	/// used if we want to log the fact that all consoles have been dropped (there will not be any more log messages)
	Finish,
	Log,
	Warn,
	Error,
}

impl From<Level> for LogLevel {
	fn from(value: Level) -> Self {
		match value {
			Level::Error => LogLevel::Error,
			Level::Warn => LogLevel::Warn,
			Level::Info => LogLevel::Log,
			Level::Debug => LogLevel::Log,
			Level::Trace => LogLevel::Log,
		}
	}
}

/// a struct containing all information necessary to print the
pub struct LogMessage {
	pub level: LogLevel,
	pub message: String,
	pub tag: String,
}

impl LogMessage {
	/// get a prefix for labeling the log level in cases where it's
	/// not obvious from terminal colors or similar
	pub fn marker(&self) -> &str {
		match self.level {
			LogLevel::Finish | LogLevel::Log => "I",
			LogLevel::Warn => "W",
			LogLevel::Error => "E",
		}
	}

	/// the name of the logging method to use for each log level.
	/// very js-specific.
	pub fn method(&self) -> &str {
		match self.level {
			LogLevel::Finish | LogLevel::Log => "log",
			LogLevel::Warn => "warn",
			LogLevel::Error => "error",
		}
	}
}
