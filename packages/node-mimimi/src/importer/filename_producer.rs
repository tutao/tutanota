use std::ffi::OsStr;
use std::path::{Path, PathBuf};

pub(super) struct FileNameProducer<'a> {
	import_directory: &'a Path,

	eml_file_count: usize,
	mbox_file_count: usize,
	current_mbox_prefix: String,
	current_mbox_iter_count: usize,
}

impl<'a> FileNameProducer<'a> {
	pub fn new(import_dir: &'a Path) -> Self {
		Self {
			import_directory: import_dir,
			current_mbox_prefix: String::new(),
			current_mbox_iter_count: 0,
			mbox_file_count: 0,
			eml_file_count: 0,
		}
	}

	pub fn new_plain_eml(&mut self, mut eml_path: PathBuf) -> PathBuf {
		eml_path.set_extension("");
		let original_filename = eml_path
			.file_name()
			.and_then(OsStr::to_str)
			.unwrap_or("unnamed")
			.to_string()
			+ "-" + self.eml_file_count.to_string().as_str()
			+ ".eml";

		self.eml_file_count += 1;

		self.import_directory.join(original_filename)
	}

	pub fn new_mbox(&mut self, mut mbox_path: PathBuf) {
		mbox_path.set_extension("");
		let original_filename = mbox_path
			.file_name()
			.and_then(OsStr::to_str)
			.unwrap_or("unnamed")
			.to_string()
			+ "-" + self.mbox_file_count.to_string().as_str()
			+ ".mbox";

		self.mbox_file_count += 1;

		self.current_mbox_prefix = original_filename + "-item-";
		self.current_mbox_iter_count = 0;
	}

	pub fn new_file_of_current_mbox(&mut self) -> PathBuf {
		let new_filename = self.current_mbox_prefix.clone()
			+ self.current_mbox_iter_count.to_string().as_str()
			+ ".eml";
		self.current_mbox_iter_count += 1;

		self.import_directory.join(new_filename)
	}
}

#[cfg(test)]
mod tests {
	use crate::importer::filename_producer::FileNameProducer;
	use std::path::PathBuf;

	#[test]
	fn producer_for_multiple_emls_only() {
		let import_directory = PathBuf::from("/tmp/");
		let mut producer = FileNameProducer::new(&import_directory);
		let first_name = producer
			.new_plain_eml(PathBuf::from("/usr/var/log/somefile.eml"))
			.to_str()
			.unwrap()
			.to_string();
		let second_name = producer
			.new_plain_eml(PathBuf::from("/usr/var/log/someotherfile.eml"))
			.to_str()
			.unwrap()
			.to_string();
		let third_name = producer
			.new_plain_eml(PathBuf::from("/usr/var/log/someotherfile"))
			.to_str()
			.unwrap()
			.to_string();
		let fourth_name = producer
			.new_plain_eml(PathBuf::from("/usr/var/log/someotherdir/.."))
			.to_str()
			.unwrap()
			.to_string();

		assert_eq!("/tmp/somefile-0.eml", first_name);
		assert_eq!("/tmp/someotherfile-1.eml", second_name);
		assert_eq!("/tmp/someotherfile-2.eml", third_name);
		assert_eq!("/tmp/unnamed-3.eml", fourth_name);
	}

	#[test]
	fn producer_for_multiple_mbox_only() {
		let import_directory = PathBuf::from("/tmp/");
		let mut producer = FileNameProducer::new(&import_directory);
		producer.new_mbox(PathBuf::from("/usr/var/log/somefile.mbox"));
		let first_name = producer
			.new_file_of_current_mbox()
			.to_str()
			.unwrap()
			.to_string();
		let second_name = producer
			.new_file_of_current_mbox()
			.to_str()
			.unwrap()
			.to_string();
		producer.new_mbox(PathBuf::from("/usr/var/log/someotherdir/.."));
		let third_name = producer
			.new_file_of_current_mbox()
			.to_str()
			.unwrap()
			.to_string();
		let fourth_name = producer
			.new_file_of_current_mbox()
			.to_str()
			.unwrap()
			.to_string();
		producer.new_mbox(PathBuf::from("/usr/var/log/somedir/.."));
		let fifth_name = producer
			.new_file_of_current_mbox()
			.to_str()
			.unwrap()
			.to_string();
		let sixth_name = producer
			.new_file_of_current_mbox()
			.to_str()
			.unwrap()
			.to_string();
		assert_eq!("/tmp/somefile-0.mbox-item-0.eml", first_name);
		assert_eq!("/tmp/somefile-0.mbox-item-1.eml", second_name);
		assert_eq!("/tmp/unnamed-1.mbox-item-0.eml", third_name);
		assert_eq!("/tmp/unnamed-1.mbox-item-1.eml", fourth_name);
		assert_eq!("/tmp/unnamed-2.mbox-item-0.eml", fifth_name);
		assert_eq!("/tmp/unnamed-2.mbox-item-1.eml", sixth_name);
	}

	#[test]
	fn producer_for_multiple_mbox_and_multiple_eml() {
		let import_directory = PathBuf::from("/tmp/");
		let mut producer = FileNameProducer::new(&import_directory);
		producer.new_mbox(PathBuf::from("/usr/var/log/somefile.mbox"));
		let first_name = producer
			.new_file_of_current_mbox()
			.to_str()
			.unwrap()
			.to_string();
		let second_name = producer
			.new_file_of_current_mbox()
			.to_str()
			.unwrap()
			.to_string();
		let third_name = producer
			.new_plain_eml(PathBuf::from("/usr/var/log/someotherfile"))
			.to_str()
			.unwrap()
			.to_string();
		let fourth_name = producer
			.new_plain_eml(PathBuf::from("/usr/var/log/someotherdir/.."))
			.to_str()
			.unwrap()
			.to_string();

		assert_eq!("/tmp/somefile-0.mbox-item-0.eml", first_name);
		assert_eq!("/tmp/somefile-0.mbox-item-1.eml", second_name);
		assert_eq!("/tmp/someotherfile-0.eml", third_name);
		assert_eq!("/tmp/unnamed-1.eml", fourth_name);
	}

	/// when we show file select window, it is possible to select files from multiple folders which can have
	/// same name ( example: select files from RECENT view in file dialog )
	#[test]
	fn can_import_multiple_files_with_same_name() {
		let import_directory = PathBuf::from("/tmp/");
		let mut producer = FileNameProducer::new(&import_directory);
		producer.new_mbox(PathBuf::from("/usr/var/log/somefile.mbox"));
		let first_name = producer
			.new_file_of_current_mbox()
			.to_str()
			.unwrap()
			.to_string();
		producer.new_mbox(PathBuf::from("/usr/var/log/somefile.mbox"));
		let second_name = producer
			.new_file_of_current_mbox()
			.to_str()
			.unwrap()
			.to_string();
		let third_name = producer
			.new_plain_eml(PathBuf::from("/usr/var/log/someotherfile"))
			.to_str()
			.unwrap()
			.to_string();
		let fourth_name = producer
			.new_plain_eml(PathBuf::from("/usr/var/log/someotherfile"))
			.to_str()
			.unwrap()
			.to_string();
		assert_eq!("/tmp/somefile-0.mbox-item-0.eml", first_name);
		assert_eq!("/tmp/somefile-1.mbox-item-0.eml", second_name);
		assert_eq!("/tmp/someotherfile-0.eml", third_name);
		assert_eq!("/tmp/someotherfile-1.eml", fourth_name);
	}
}
