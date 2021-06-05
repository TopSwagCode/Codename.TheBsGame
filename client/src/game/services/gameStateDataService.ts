import { ConnectResponse, CreateUnitMessage, GameState } from './models'
import SetUnitMessage from './models/setUnitMessage'

interface WebsocketMessages {
	CreateUnit: CreateUnitMessage
	SetUnit: SetUnitMessage
}

type WebsocketMessageType = keyof WebsocketMessages
type WebsocketMessage = WebsocketMessages[WebsocketMessageType]

type MessageHandlerCallback<TMessage> = (message: TMessage) => void
type AddMessageHandler = <TMessageKey extends WebsocketMessageType>(type: TMessageKey, handler: MessageHandlerCallback<WebsocketMessages[TMessageKey]>) => void
interface MessageHandler {
	type: WebsocketMessageType
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	handler: MessageHandlerCallback<any & WebsocketMessage>
}

class GameStateDataService {
	private apiUri: string

	private socket: WebSocket | undefined

	private messageHandlers: MessageHandler[]

	constructor() {
		this.apiUri = process.env.REACT_APP_SERVER_API
		this.messageHandlers = []
	}

	public connectToWebsocket = (userId: number): Promise<boolean> =>
		new Promise<boolean>((resolve, reject) => {
			fetch(`${this.apiUri}/register`, {
				method: 'POST',
				mode: 'cors',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ user_id: userId })
			})
				.then((r) => r.json())
				.then((r: ConnectResponse) => r.url)
				.then((url) => {
					const socket = new WebSocket(url)
					socket.onopen = () => {
						this.socket = socket
						resolve(true)
					}
					socket.onmessage = this.onMessageRecived
				})
				.catch(() => reject())
		})

	public createUnit = (x: number, z: number): void => {
		this.socket?.send(JSON.stringify({ CreatUnit: { position: [x, z] } }))
	}

	public setUnit = (id: string, x: number, z: number): void => {
		this.socket?.send(JSON.stringify({ SetUnit: { position: [x, z], id } }))
	}

	public fetchInitialGameState = (): Promise<GameState> =>
		new Promise<GameState>((resolve, reject) => {
			fetch(`${this.apiUri}/game`)
				.then((response) => response.json())
				.then((state: GameState) => resolve(state))
				.catch(() => reject())
		})

	public addMessageHandler: AddMessageHandler = (type, handler) => {
		this.messageHandlers = [{ type, handler }]
	}

	private notifyHandlers = (type: WebsocketMessageType, message: WebsocketMessage): void => {
		this.messageHandlers.filter((h) => h.type === type).forEach((handler) => handler.handler(message))
	}

	private onMessageRecived = (e: MessageEvent): void => {
		const msg: WebsocketMessage = JSON.parse(e.data)
		if ((msg as CreateUnitMessage).CreatUnit) {
			this.notifyHandlers('CreateUnit', msg)
		}
	}
}

export default GameStateDataService
