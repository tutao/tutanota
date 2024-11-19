use super::GREENMAIL_TEST_SERVER_JAR;
use j4rs::{ClasspathEntry, JvmBuilder};

static mut START_JVM_INVOCATION_COUNTER: i32 = 0;

pub fn start_or_attach_to_jvm() -> i32 {
	// todo: SAFETY???
	unsafe {
		if START_JVM_INVOCATION_COUNTER == 0 {
			// create exactly one jvm and attach to it whenever we create a new IMAP test server

			JvmBuilder::new()
				.classpath_entry(ClasspathEntry::new(GREENMAIL_TEST_SERVER_JAR))
				.with_default_classloader()
				.build()
				.expect("Cannot start jvm");
		}
		START_JVM_INVOCATION_COUNTER += 1;
		START_JVM_INVOCATION_COUNTER
	}
}
