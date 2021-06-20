use game_logic::components::Destination;
use game_logic::components::Position;
use game_logic::components::UnitId;
// #![windows_subsystem = "windows"]
use game_logic::game_state::GameStateCache;
use game_logic::game_state::UidEntityMap;
use game_logic::game_state::Unit;
use game_logic::resources::TimeResource;
use game_logic::schedule::create_schedule;
use futures::FutureExt;
use game_logic::commands::GameCommand;
use legion::systems::CommandBuffer;
use legion::*;
use std::collections::HashMap;
use std::convert::Infallible;
use std::sync::Arc;
use std::thread;
use std::time::{Duration, SystemTime};
use tokio::sync::{mpsc, RwLock};
use warp::{ws::Message, Filter, Rejection};

mod handler;
mod ws;

type Result<T> = std::result::Result<T, Rejection>;
type Clients = Arc<RwLock<HashMap<String, Client>>>;
type GameStateRef = Arc<RwLock<GameStateCache>>;
type GameCommandSender = mpsc::Sender<GameCommand>;


#[derive(Debug, Clone)]
pub struct Client {
    pub user_id: usize,
    pub sender: Option<mpsc::UnboundedSender<std::result::Result<Message, warp::Error>>>,
}

#[tokio::main]
async fn main() {
    let game_state = Arc::new(RwLock::new(GameStateCache::default()));
    let (sender, mut receiver) = mpsc::channel::<GameCommand>(1000);

    let game_state_cache_ref = game_state.clone();
    thread::spawn(move || {
        let mut world = World::default();
        let mut schedule = create_schedule();

        let mut resources = Resources::default();
        resources.insert(TimeResource::default());
        resources.insert(UidEntityMap::default());

        loop {
            let before = SystemTime::now();
            {
                let mut command_buffer = CommandBuffer::new(&world);

                while let Some(Some(command)) = receiver.recv().fuse().now_or_never() {
                    if matches!(command, GameCommand::ResetGameCommand) {
                        world = World::default();
                    } else {
                        // The extra 1 here, is to get around bug that you need 2 components when pushing to buffer
                        command_buffer.push((command, 1));
                    }
                }
                command_buffer.flush(&mut world, &mut resources);
            }
            schedule.execute(&mut world, &mut resources);
            let elapsed_duration = before.elapsed().unwrap();
            let mut time = resources
                .get_mut::<TimeResource>()
                .expect("Must have a time resource");
            time.ticks += 1;

            let mut new_game_state_cache = GameStateCache::default();
            <(&Position, Option<&Destination>, &UnitId)>::query().for_each(
                &world,
                |(pos, des_op, id)| {
                    let des = des_op.map(|s| (s.x, s.y)).unwrap_or((pos.x, pos.y));
                    new_game_state_cache.units.insert(
                        id.id.clone(),
                        Unit {
                            destination: des,
                            position: (pos.x, pos.y),
                            id: id.id.clone(),
                        },
                    );
                },
            );
            {
                // This block_on is used to make the game thread block on an async.
                // We don't want the game thread to use async, since it will require it to
                let mut lock = futures::executor::block_on(game_state_cache_ref.write());
                lock.units = new_game_state_cache.units;
            }

            let target_interval = Duration::from_secs(1);
            if elapsed_duration.le(&target_interval) {
                thread::sleep(target_interval - elapsed_duration);
            }
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
        .and(with_sender(sender.clone()))
        .and_then(move |my_sender| async move {
            Ok::<_, Infallible>(handler::reset_game_state_handler(my_sender).await)
        });

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
        .and(with_sender(sender.clone()))
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
        // .or(reset_route_post)
        .or(ws_route)
        .with(cors);
    let address = ([0, 0, 0, 0], 80);
    println!("Listening on {:?}", address);
    warp::serve(routes).run(address).await;
}

fn with_clients(clients: Clients) -> impl Filter<Extract = (Clients,), Error = Infallible> + Clone {
    warp::any().map(move || clients.clone())
}

fn with_sender<T: Send + Sync>(
    sender: mpsc::Sender<T>,
) -> impl Filter<Extract = (mpsc::Sender<T>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || sender.clone())
}

fn with_game_state(
    game_state: GameStateRef,
) -> impl Filter<Extract = (GameStateRef,), Error = Infallible> + Clone {
    warp::any().map(move || game_state.clone())
}
