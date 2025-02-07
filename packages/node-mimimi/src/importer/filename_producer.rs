use std::ffi::OsStr;
use std::path::{Path, PathBuf};

/// When user select single or multiple files to import,
/// we move all of those to our current_import directory in ~/.cong/tutanota-desktop-
/// and when user select mbox we destruct them to eml files,
/// In that case, we still want to preserve the filename of those destructed eml files
/// so that in case of failure or some eml file not being imported,
/// one can always trace back which mbox produced that file,
/// Also when user select multiple file with same filename ( example: they selected it from Recent menu in file dialog )
/// we need some form of unique identifier to differentiate between those
pub(super) struct FileNameProducer<'a> {
	pub import_directory: &'a Path,

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

	/// `eml_path` is already a single eml file path,
	/// we can just add some counter to it to make it differentiate and
	/// original filename will be part of new filename as well
	pub fn new_plain_eml(&mut self, eml_path: impl AsRef<Path>) -> PathBuf {
		let original_filename =
			Self::format_new_file_name(eml_path.as_ref(), self.eml_file_count, ".eml");

		self.eml_file_count += 1;
		self.import_directory.join(original_filename)
	}

	/// `mbox_path` is user selected mbox file, which we had/will destruct to it's eml file,
	/// for now, just record the mbox file ( with unique counter )
	/// and all the eml of this mbox can call `Self::new_file_of_current_mbox`
	/// once a new mbox is encountered, this will reset own state and start over
	///
	/// Note: one should check for apple export beforehand and call `Self::new_apple_mbox` if that's the case
	pub fn new_mbox(&mut self, mbox_path: impl AsRef<Path>) {
		let mbox_marker =
			Self::format_new_file_name(mbox_path.as_ref(), self.mbox_file_count, ".mbox-item-");

		self.current_mbox_prefix = mbox_marker;
		self.mbox_file_count += 1;
		self.current_mbox_iter_count = 0;
	}

	/// Same as `Self::new_mbox`
	/// specific to Apple mail export mbox format,
	/// See `file_reader::UserSelectedFileType::AppleMbox` for how this location of `mbox_path` layout is different
	pub fn new_apple_mbox(&mut self, mbox_path: impl AsRef<Path>) {
		let mbox_path = mbox_path.as_ref();
		let mbox_marker = Self::format_new_file_name(
			mbox_path.parent().unwrap_or_else(|| {
				// we were not able to get the parent of this file, how could we have selected
				// root directory. this is very highly unlikely
				log::info!("Can not get parent directory in new_apple_mbox");
				mbox_path
			}),
			self.mbox_file_count,
			".mbox-item-",
		);

		self.current_mbox_prefix = mbox_marker;
		self.mbox_file_count += 1;
		self.current_mbox_iter_count = 0;
	}

	/// For all actual mail inside a mbox, each mail will be kept as eml file
	/// but should preserve information about the actual mbox file it originated from
	pub fn new_file_of_current_mbox(&mut self) -> PathBuf {
		let current_prefix = &self.current_mbox_prefix;
		let count = self.current_mbox_iter_count;
		let new_filename = format!("{current_prefix}{count}.eml");

		self.current_mbox_iter_count += 1;
		self.import_directory.join(new_filename)
	}

	fn format_new_file_name(path: &Path, count: usize, suffix: &str) -> String {
		let file_name = path
			.file_stem()
			.and_then(OsStr::to_str)
			.unwrap_or("unnamed");
		format!("{file_name}-{count}{suffix}")
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

		assert_eq!(
			Some("/tmp/somefile-0.eml"),
			producer.new_plain_eml("/usr/var/log/somefile.eml").to_str()
		);
		assert_eq!(
			Some("/tmp/someotherfile-1.eml"),
			producer
				.new_plain_eml("/usr/var/log/someotherfile.eml")
				.to_str()
		);
		assert_eq!(
			Some("/tmp/someotherfile-2.eml"),
			producer
				.new_plain_eml("/usr/var/log/someotherfile")
				.to_str()
		);
		assert_eq!(
			Some("/tmp/unnamed-3.eml"),
			producer
				.new_plain_eml("/usr/var/log/someotherdir/..")
				.to_str()
		);
	}

	#[test]
	fn producer_for_multiple_mbox_only() {
		let import_directory = PathBuf::from("/tmp/");
		let mut producer = FileNameProducer::new(&import_directory);

		// first mbox
		producer.new_mbox("/usr/var/log/somefile.mbox");
		assert_eq!(
			Some("/tmp/somefile-0.mbox-item-0.eml"),
			producer.new_file_of_current_mbox().to_str()
		);
		assert_eq!(
			Some("/tmp/somefile-0.mbox-item-1.eml"),
			producer.new_file_of_current_mbox().to_str()
		);

		// second mbox
		producer.new_mbox("/usr/var/log/someotherdir/..");
		assert_eq!(
			Some("/tmp/unnamed-1.mbox-item-0.eml"),
			producer.new_file_of_current_mbox().to_str()
		);
		assert_eq!(
			Some("/tmp/unnamed-1.mbox-item-1.eml"),
			producer.new_file_of_current_mbox().to_str()
		);

		// third mbox
		producer.new_mbox("/usr/var/log/somedir/..");
		assert_eq!(
			Some("/tmp/unnamed-2.mbox-item-0.eml"),
			producer.new_file_of_current_mbox().to_str()
		);
		assert_eq!(
			Some("/tmp/unnamed-2.mbox-item-1.eml"),
			producer.new_file_of_current_mbox().to_str()
		);
	}

	#[test]
	fn producer_for_multiple_mbox_and_multiple_eml() {
		let import_directory = PathBuf::from("/tmp/");
		let mut producer = FileNameProducer::new(&import_directory);

		// a mbox
		producer.new_mbox("/usr/var/log/somefile.mbox");
		assert_eq!(
			Some("/tmp/somefile-0.mbox-item-0.eml"),
			producer.new_file_of_current_mbox().to_str()
		);
		assert_eq!(
			Some("/tmp/somefile-0.mbox-item-1.eml"),
			producer.new_file_of_current_mbox().to_str()
		);

		// a plain eml
		assert_eq!(
			Some("/tmp/someotherfile-0.eml"),
			producer
				.new_plain_eml("/usr/var/log/someotherfile")
				.to_str()
		);

		// unknown filestem
		assert_eq!(
			Some("/tmp/unnamed-1.eml"),
			producer
				.new_plain_eml("/usr/var/log/someotherdir/..")
				.to_str()
		);
	}

	/// when we show file select window, it is possible to select files from multiple folders which can have
	/// same name ( example: select files from RECENT view in file dialog )
	#[test]
	fn can_import_multiple_files_with_same_name() {
		let import_directory = PathBuf::from("/tmp/");
		let mut producer = FileNameProducer::new(&import_directory);

		// first mbox
		producer.new_mbox("/usr/var/log/somefile.mbox");
		assert_eq!(
			Some("/tmp/somefile-0.mbox-item-0.eml"),
			producer.new_file_of_current_mbox().to_str()
		);

		// second mbox
		producer.new_mbox("/usr/var/log/somefile.mbox");
		assert_eq!(
			Some("/tmp/somefile-1.mbox-item-0.eml"),
			producer.new_file_of_current_mbox().to_str()
		);
		assert_eq!(
			Some("/tmp/someotherfile-0.eml"),
			producer
				.new_plain_eml("/usr/var/log/someotherfile")
				.to_str()
		);

		// plain eml
		assert_eq!(
			Some("/tmp/someotherfile-1.eml"),
			producer
				.new_plain_eml("/usr/var/log/someotherfile")
				.to_str()
		);
	}

	#[test]
	fn apple_mbox_uses_directory_name() {
		let import_directory = PathBuf::from("/tmp/");
		let mut producer = FileNameProducer::new(&import_directory);

		producer.new_apple_mbox("/usr/var/log/inbox.mbox/mbox");
		assert_eq!(
			Some("/tmp/inbox-0.mbox-item-0.eml"),
			producer.new_file_of_current_mbox().to_str()
		);

		// otherwise we can't get parent directory we can still use the actual mbox file name
		producer.new_apple_mbox("mbox-in-root-with-no-parent");
		assert_eq!(
			Some("/tmp/unnamed-1.mbox-item-0.eml"),
			producer.new_file_of_current_mbox().to_str()
		);
	}
}
