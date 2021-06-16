use crate::{
    game::game_state::{Unit, UnitType},
    Client, Clients, GameStateRef,
};
use futures::{FutureExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{from_str, to_string};
use tokio::sync::mpsc;
use tokio_stream::wrappers::UnboundedReceiverStream;
use uuid::Uuid;
use warp::ws::{Message, WebSocket};

#[derive(Deserialize, Debug)]
pub struct CreateUnitRequest {
    position: (f32, f32),
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ErrorResponse {
    message: String,
}

#[derive(Deserialize, Debug)]
pub struct SetUnitPositionRequest {
    position: (f32, f32),
    id: String,
}
#[derive(Deserialize, Debug)]
pub struct SetUnitDestinationRequest {
    destination: (f32, f32),
    id: String,
}

#[derive(Deserialize, Debug)]
pub enum RequestType {
    CreateUnit(CreateUnitRequest),
    SetUnitPosition(SetUnitPositionRequest),
    SetUnitDestination(SetUnitDestinationRequest),
}

#[derive(Deserialize, Serialize, Debug)]
pub enum ResponseType {
    CreateUnit(Unit),
    ErrorResponse(ErrorResponse),
}

pub async fn client_connection(
    ws: WebSocket,
    id: String,
    clients: Clients,
    mut client: Client,
    mut game_state: GameStateRef,
) {
    let (client_ws_sender, mut client_ws_rcv) = ws.split();
    let (client_sender, client_rcv) = mpsc::unbounded_channel();
    let rx = UnboundedReceiverStream::new(client_rcv);

    tokio::task::spawn(rx.forward(client_ws_sender).map(|result| {
        if let Err(e) = result {
            eprintln!("error sending websocket msg: {}", e);
        }
    }));

    client.sender = Some(client_sender);
    clients.write().await.insert(id.clone(), client);

    println!("{} connected", id);

    while let Some(result) = client_ws_rcv.next().await {
        let msg = match result {
            Ok(msg) => msg,
            Err(e) => {
                eprintln!("error receiving ws message for id: {}): {}", id.clone(), e);
                break;
            }
        };
        client_msg(&id, msg, &clients, &mut game_state).await;
    }

    clients.write().await.remove(&id);
    println!("{} disconnected", id);
}

async fn handle_request(message: &str, game_state: &mut GameStateRef) -> Option<String> {
    let request = from_str(&message);
    match request {
        Ok(RequestType::CreateUnit(CreateUnitRequest { position })) => {
            let uuid = Uuid::new_v4().to_string();
            let units = &mut game_state.write().await.units;
            let unit = Unit {
                position: position,
                destination: position,
                unit_type: UnitType::Normal,
                id: uuid.clone(),
            };
            units.insert(uuid.clone(), unit.clone());
            return to_string(&ResponseType::CreateUnit(unit.clone())).ok();
        }
        Ok(RequestType::SetUnitPosition(SetUnitPositionRequest { position, id })) => {
            let units = &mut game_state.write().await.units;
            match units.get_mut(&id) {
                Some(unit) => {
                    unit.position = position;
                }
                None => {
                    eprintln!(
                        "Could not set position for unit, because it was not found: {}",
                        id
                    );
                }
            }
        }
        Ok(RequestType::SetUnitDestination(SetUnitDestinationRequest { destination, id })) => {
            let units = &mut game_state.write().await.units;
            match units.get_mut(&id) {
                Some(unit) => {
                    unit.destination = destination;
                }
                None => {
                    eprintln!(
                        "Could not set destination for unit, because it was not found: {}",
                        id
                    );
                }
            }
        }
        Err(e) => {
            let example_string = "{\"CreateUnit\":{\"position\":[10.0,15.0]}}";
            //Send something like this {"CreateUnit":{"position":[10.0,15.0]}}
            eprintln!(
                "error parsing message: {} , try something like this\n {}",
                e, example_string
            );
        }
    };

    return None;
}
async fn client_msg(id: &str, msg: Message, clients: &Clients, game_state: &mut GameStateRef) {
    println!("received message from {}: {:?}", id, msg);
    let message = match msg.to_str() {
        Ok(v) => v,
        Err(_) => return,
    };

    if message == "ping" || message == "ping\n" {
        return;
    }

    let resp = handle_request(&message, game_state).await;

    clients.read().await.iter().for_each(|c| match &c.1.sender {
        Some(sender) => match &resp {
            Some(response) => {
                let _result = sender.send(Ok(Message::text(response.clone())));
            }
            None => {
                let _result = sender.send(Ok(msg.clone()));
            }
        },
        None => {}
    });
}
