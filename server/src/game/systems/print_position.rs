use legion::{Entity, system};

use crate::game::{
    components::{Position},
};

#[system(par_for_each)]
pub fn print_position(pos: &Position, entity: &Entity) {
    println!("{:?} - {:?}", entity, pos);
}
