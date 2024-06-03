#![allow(non_snake_case)]
use super::*;

pub struct PersistenceResourcePostReturn {
	pub _format: String,
	pub generatedId: Id,
	pub permissionListId: Id,
}