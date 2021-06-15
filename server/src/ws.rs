use crate::{
    game::{
        self,
        game_state::{Unit},
    },
    Client, Clients, GameCommandSender,
};

use futures::{FutureExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{from_str};
use tokio::sync::mpsc;
use uuid::Uuid;
use warp::ws::{Message, WebSocket};

#[derive(Deserialize, Debug, Clone)]
pub struct CreateUnitRequest {
    position: (f32, f32),
}

#[derive(Deserialize, Debug, Clone)]
pub struct SetUnitRequest {}
#[derive(Deserialize, Serialize, Debug)]
pub struct ErrorResponse {
    message: String,
}

#[derive(Deserialize, Debug)]
pub struct SetUnitPositionRequest {
    position: (f32, f32),
    id: String,
}
#[derive(Deserialize, Debug, Clone)]
pub struct SetUnitDestinationRequest {
    destination: (f32, f32),
    id: String,
}

#[derive(Deserialize, Debug, Clone)]
pub enum RequestType {
    CreatUnit(CreateUnitRequest),
    SetUnitDestination(SetUnitDestinationRequest),
    ResetGame,
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
    sender: GameCommandSender,
) {
    let (client_ws_sender, mut client_ws_rcv) = ws.split();
    let (client_sender, client_rcv) = mpsc::unbounded_channel();

    tokio::task::spawn(client_rcv.forward(client_ws_sender).map(|result| {
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
        client_msg(&id, msg, &clients, sender.clone()).await;
    }

    clients.write().await.remove(&id);
    println!("{} disconnected", id);
}

async fn client_msg(id: &str, msg: Message, clients: &Clients, sender: GameCommandSender) {
    println!("received message from {}: {:?}", id, msg);
    let message = match msg.to_str() {
        Ok(v) => v,
        Err(_) => return,
    };

    if message == "ping" || message == "ping\n" {
        return;
    }
    let response = handle_request(message, sender).await;
    
    send_response(response, clients).await;
}

async fn send_response(response: Option<String>, clients: &std::sync::Arc<tokio::sync::RwLock<std::collections::HashMap<String, Client>>>) {
    if let Some(response) = response {
        clients.read().await.iter().for_each(|c| match &c.1.sender {
            Some(sender) => {
                let _result = sender.send(Ok(Message::text(response.clone())));
            }
            None => {}
        });
    }
}

async fn handle_request(message: &str, mut sender: GameCommandSender) -> Option<String> {
    let request = from_str(&message);
    use RequestType::*;

    match request {
        Ok(CreatUnit(CreateUnitRequest { position })) => {
            let uuid = Uuid::new_v4().simple().to_string();
            sender
                .send(game::commands::GameCommand::CreateUnitCommand {
                    position,
                    uuid: uuid.clone(),
                })
                .await
                .expect("Should be able to send");
            Some(uuid)
        }
        Ok(SetUnitDestination(SetUnitDestinationRequest { id, destination })) => {
            sender
                .send(game::commands::GameCommand::SetUnitDestinationCommand {
                    position: destination,
                    uuid: id,
                })
                .await
                .expect("Should be able to send");
            None
        }
        Ok(RequestType::ResetGame) => {
            sender
                .send(game::commands::GameCommand::ResetGameCommand)
                .await
                .expect("Could not send message");
            None
        }
        Err(e) => {
            let example_string = "{\"CreatUnit\":{\"position\":[10.0,15.0]}}";
            //Send something like this {"CreatUnit":{"position":[10.0,15.0]}}
            eprintln!(
                "error parsing message: {} , try something like this\n {}",
                e, example_string
            );
            None
        }
    }
}
