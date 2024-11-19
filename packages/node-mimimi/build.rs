extern crate napi_build;
use std::process::Command;

const GREENMAIL_TEST_SERVER_JAR: &str = concat!(
	env!("CARGO_MANIFEST_DIR"),
	"/java/build/libs/greenmail-test-server.jar"
);
const BUILD_WATCHLIST: &[&str] = &["/java/src/", "/java/build/libs/greenmail-test-server.jar"];

fn main() {
	#[cfg(feature = "javascript")]
	napi_build::setup();

	println!("cargo::rustc-env=GREENMAIL_TEST_SERVER_JAR={GREENMAIL_TEST_SERVER_JAR}",);
	for watch in BUILD_WATCHLIST {
		println!("cargo::rerun-if-changed={watch}");
	}

	run_gradle_jar();
}

fn run_gradle_jar() {
	Command::new("/opt/gradle-8.5/bin/gradle")
		.current_dir(concat!(env!("CARGO_MANIFEST_DIR"), "/java"))
		.args(["jar"])
		.spawn()
		.expect("Cannot spawn gradle command")
		.wait()
		.expect("Cannot wait for gradle command")
		.success()
		.then_some(())
		.expect("gradle exited with non-success status code");
}
