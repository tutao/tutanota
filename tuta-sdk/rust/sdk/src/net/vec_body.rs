use http_body_util::Full;
use hyper::body::Buf;
pub type VecBody = Full<VecBuf>;
pub struct VecBuf(pub Vec<u8>);

impl From<VecBuf> for VecBody {
	fn from(val: VecBuf) -> Self {
		Full::new(val)
	}
}

/// somewhat stolen from impl Buf for &[u8]
/// also don't know why impl Buf for Vec<u8> doesn't come with hyper
impl Buf for VecBuf {
	#[inline]
	fn remaining(&self) -> usize {
		self.0.len()
	}

	#[inline]
	fn chunk(&self) -> &[u8] {
		self.0.as_slice()
	}

	#[inline]
	fn advance(&mut self, cnt: usize) {
		if self.0.len() < cnt {
			panic_advance(cnt, self.0.len());
		}
		self.0.drain(..cnt);
	}

	#[inline]
	fn copy_to_slice(&mut self, dst: &mut [u8]) {
		if self.0.len() < dst.len() {
			panic_advance(dst.len(), self.0.len());
		}

		dst.copy_from_slice(&self.0[..dst.len()]);
		self.advance(dst.len());
	}
}

/// Panic with a nice error message.
#[cold]
fn panic_advance(idx: usize, len: usize) -> ! {
	panic!(
		"advance out of bounds: the len is {} but advancing by {}",
		len, idx
	);
}
