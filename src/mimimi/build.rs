extern crate napi_build;

fn main() {
	#[cfg(feature = "javascript")]
	napi_build::setup();
}
