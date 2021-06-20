use legion::Schedule;

use crate::game::systems::*;

pub fn create_schedule() -> Schedule{
    Schedule::builder()
    .add_system(handle_commands_system())
    .flush()
    .add_system(destination_to_velocity_system())
    .add_system(remove_destination_on_arrival_system())    
    .flush()
    .add_system(velocity_to_position_system())    
    // .add_system(print_position_system())
    .build()
}