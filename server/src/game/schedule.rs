use legion::Schedule;

use crate::game::systems::*;

pub fn create_schedule() -> Schedule{
    Schedule::builder()
    .add_system(velocity_to_position_system())
    // .add_system(print_position_system())
    .build()
}