use legion::system;

use crate::{
    components::{Position, Velocity},
    resources::TimeResource,
};

#[system(par_for_each)]
pub fn velocity_to_position(pos: &mut Position, vel: &Velocity, #[resource] time: &TimeResource) {
    pos.x += vel.dx * (time.elapsed_seconds as f32);
    pos.y += vel.dy * (time.elapsed_seconds as f32);
}
