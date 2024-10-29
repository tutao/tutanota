use crate::date::date_time::DateTime;

pub trait DateProvider: Send + Sync {
	fn now(&self) -> DateTime;
}

pub struct SystemDateProvider;

impl DateProvider for SystemDateProvider {
	fn now(&self) -> DateTime {
		DateTime::from_system_time(std::time::SystemTime::now())
	}
}

#[cfg(test)]
pub mod stub {
	use super::DateProvider;
	use crate::date::DateTime;

	pub(crate) struct DateProviderStub {
		value: u64,
	}

	impl DateProviderStub {
		pub fn new(value: u64) -> Self {
			Self { value }
		}

		#[allow(dead_code)]
		pub fn advance_timer(&mut self, by: u64) {
			self.value += by
		}
	}

	impl DateProvider for DateProviderStub {
		fn now(&self) -> DateTime {
			DateTime::from_millis(self.value)
		}
	}
}
