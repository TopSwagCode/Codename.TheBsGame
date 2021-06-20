use legion::{system, systems::CommandBuffer, Entity};
use vector2d::Vector2D;

use crate::components::{Destination, Position, Velocity};

#[system(for_each)]
pub fn remove_destination_on_arrival(
    des: &Destination,
    _vel: Option<&Velocity>,
    pos: &mut Position,
    command_buffer: &mut CommandBuffer,
    entity: &Entity,
) {
    let des_vec = Vector2D::new(des.x, des.y);
    let pos_vec = Vector2D::new(pos.x, pos.y);
    let length_sqrt = (des_vec - pos_vec).length_squared();
    // Todo this needs to handle the velocity as well
    // This can currently overshoot the target then just oscillate
    if length_sqrt < 0.1 {
        println!("Removing velocity and destination");
        pos.x = des.x;
        pos.y = des.y;
        command_buffer.remove_component::<Velocity>(*entity);
        command_buffer.remove_component::<Destination>(*entity);
    }
}
