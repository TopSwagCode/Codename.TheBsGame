use crate::game::components::Position;
use crate::game::components::UnitId;
use crate::game::components::Velocity;
// #![windows_subsystem = "windows"]
use crate::game::game_state::GameState;
use crate::game::game_state::Unit;
use crate::game::game_state::UnitType;
use crate::game::resources::TimeResource;
use crate::game::schedule::create_schedule;
use legion::*;
use std::collections::HashMap;
use std::convert::Infallible;
use std::sync::Arc;
use std::thread;
use std::time::{Duration, SystemTime};
use tokio::sync::{mpsc, RwLock};
use uuid::Uuid;
use warp::{ws::Message, Filter, Rejection};

mod game;
mod handler;
mod ws;

type Result<T> = std::result::Result<T, Rejection>;
type Clients = Arc<RwLock<HashMap<String, Client>>>;
type GameStateRef = Arc<RwLock<GameState>>;

#[derive(Debug, Clone)]
pub struct Client {
    pub user_id: usize,
    pub sender: Option<mpsc::UnboundedSender<std::result::Result<Message, warp::Error>>>,
}

#[tokio::main]
async fn main() {
    let game_state = Arc::new(RwLock::new(GameState::default()));

    let game_state_ref = game_state.clone();
    thread::spawn(move || {
        let mut world = World::default();
        let uuid = Uuid::new_v4().simple().to_string();
        world.push((
            Position { x: 1., y: 1. },
            Velocity { dx: 0.5, dy: 1.0 },
            UnitId { id: uuid },
        ));
        let mut schedule = create_schedule();

        let mut resources = Resources::default();
        resources.insert(TimeResource::default());

        loop {
            let before = SystemTime::now();
            schedule.execute(&mut world, &mut resources);
            let elapsed_duration = before.elapsed().unwrap();
            let mut time = resources
                .get_mut::<TimeResource>()
                .expect("Must have a time resource");
            time.ticks += 1;

            let mut new_game_state = GameState::default();
            <(&Position, &UnitId)>::query().for_each(&world, |(pos, id)| {
                new_game_state.units.insert(
                    id.id.clone(),
                    Unit {
                        position: (pos.x, pos.y),
                        unit_type: UnitType::Normal,
                        id: id.id.clone(),
                    },
                );
            });
            {
                // This block_on is used to make the game thread block on an async.
                // We don't want the game thread to use async, since it will require it to
                let mut lock = futures::executor::block_on(game_state_ref.write());
                lock.units = new_game_state.units;
            }
            thread::sleep(Duration::from_secs(1) - elapsed_duration);
            time.elapsed_seconds = before.elapsed().unwrap().as_secs_f64();
        }
    });

    let clients: Clients = Arc::new(RwLock::new(HashMap::new()));

    let health_route = warp::path!("health").and_then(handler::health_handler);

    let game = warp::path("game");
    let game_route = game
        .and(warp::get())
        .and(with_game_state(game_state.clone()))
        .and_then(handler::get_game_state_handler);

    let reset_path = warp::path("reset");
    let reset_route_get = reset_path
        .and(warp::get())
        .and(with_game_state(game_state.clone()))
        .and_then(handler::reset_game_state_handler);
    let reset_route_post = reset_path
        .and(warp::post())
        .and(with_game_state(game_state.clone()))
        .and_then(handler::reset_game_state_handler);

    let register = warp::path("register");
    let register_routes = register
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(clients.clone()))
        .and_then(handler::register_handler)
        .or(register
            .and(warp::delete())
            .and(warp::path::param())
            .and(with_clients(clients.clone()))
            .and_then(handler::unregister_handler));

    let ws_route = warp::path("ws")
        .and(warp::ws())
        .and(warp::path::param())
        .and(with_clients(clients))
        .and(with_game_state(game_state))
        .and_then(handler::ws_handler);
    let cors = warp::cors()
        .allow_any_origin()
        .allow_headers(vec![
            "Access-Control-Request-Headers",
            "Content-Type",
            "Accept",
            "*",
        ])
        .allow_methods(vec!["POST", "GET", "DELETE"]);

    let routes = health_route
        .or(game_route)
        .or(register_routes)
        .or(reset_route_get)
        .or(reset_route_post)
        .or(ws_route)
        .with(cors);
    let address = ([0, 0, 0, 0], 8000);
    println!("Listening on {:?}", address);
    warp::serve(routes).run(address).await;
}

fn with_clients(clients: Clients) -> impl Filter<Extract = (Clients,), Error = Infallible> + Clone {
    warp::any().map(move || clients.clone())
}

fn with_game_state(
    game_state: GameStateRef,
) -> impl Filter<Extract = (GameStateRef,), Error = Infallible> + Clone {
    warp::any().map(move || game_state.clone())
}
