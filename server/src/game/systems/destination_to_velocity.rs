use crate::game::components::{Destination, Position, Velocity};
use legion::*;
use legion::{system, systems::CommandBuffer, world::SubWorld, Entity};
use vector2d::Vector2D;

#[system]
#[read_component(Position)]
#[write_component(Destination)]
#[write_component(Velocity)]
pub fn destination_to_velocity(world: &mut SubWorld, command_buffer: &mut CommandBuffer) {
    //The maybe_changed<Destination> should filter out most destinations that have not changed, but not all
    let mut qeury = <(&Position, &Destination, Option<&mut Velocity>, Entity)>::query()
        .filter(maybe_changed::<Destination>());
    qeury.for_each_mut(world, |(pos, des, vel_op, entity)| {
        let pos_vec = Vector2D { x: pos.x, y: pos.y };
        let des_vec = Vector2D { x: des.x, y: des.y };

        let direction = des_vec - pos_vec;
        let velocity = direction.normalise() * 5.; //todo make a unit have variable velocity

        match vel_op {
            Some(vel) => {
                vel.dx = velocity.x;
                vel.dy = velocity.y;
            }
            None => {
                command_buffer.add_component(
                *entity,
                Velocity {
                    dx: velocity.x,
                    dy: velocity.y,
                },
            )},
        }
    });
}
