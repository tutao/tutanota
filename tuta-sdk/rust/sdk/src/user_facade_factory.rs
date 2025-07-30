use crate::entities::generated::sys::User;
#[cfg_attr(test, mockall_double::double)]
use crate::key_cache::KeyCache;
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use std::sync::Arc;

pub struct UserFacadeFactory {
	key_cache: Arc<KeyCache>,
}

#[cfg_attr(test, mockall::automock)]
#[allow(unused)]
impl UserFacadeFactory {
	pub fn new(key_cache: Arc<KeyCache>) -> Self {
		UserFacadeFactory { key_cache }
	}

	pub fn create_user_facade(&self, user: User) -> UserFacade {
		UserFacade::new(self.key_cache.clone(), user)
	}
}
