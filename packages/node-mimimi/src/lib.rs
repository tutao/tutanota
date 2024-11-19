#![deny(clippy::all)]

pub mod importer;
#[cfg(feature = "javascript")]
mod importer_api;
#[cfg(feature = "javascript")]
pub mod logging;
mod reduce_to_chunks;
mod tuta_imap;

pub trait BufReadExtension {
	/// Same as `std::io::BufRead::read_until`
	/// instead of accepting a single byte, accept a slice
	fn read_until_slice(&mut self, delimiter: &[u8], buf: &mut Vec<u8>) -> std::io::Result<usize>;
}

// implement for everything that have BufRead
impl<T> BufReadExtension for T
where
	T: std::io::BufRead,
{
	fn read_until_slice(&mut self, delimeter: &[u8], buf: &mut Vec<u8>) -> std::io::Result<usize> {
		let mut read_count = 0;

		loop {
			let mut one_byte = [0];
			self.read_exact(&mut one_byte)?;
			buf.push(one_byte[0]);

			read_count += 1;
			if buf.ends_with(delimeter) {
				break Ok(read_count);
			}
		}
	}
}
