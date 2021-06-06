import { ConnectResponse, CreateUnitRequest, CreateUnitResponse, GameState } from './models'
import SetUnitMessage from './models/setUnitMessage'

interface WebsocketMessages {
	CreatUnit: CreateUnitResponse
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

	private wsUri: string

	private socket: WebSocket | undefined

	private messageHandlers: MessageHandler[]

	constructor() {
		this.apiUri = process.env.REACT_APP_SERVER_API
		this.wsUri = process.env.REACT_APP_SERVER_WS

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
				.then((r) => {
					return r.json()
				})
				.then((r: ConnectResponse): string => {
					return r.url
				})
				.then((url) => {
					const socket = new WebSocket(`${this.wsUri}/${url}`)
					socket.onopen = () => {
						socket.onmessage = this.onMessageRecived
						this.socket = socket
						resolve(true)
					}
				})
				.catch(() => reject())
		})

	public createUnit = (x: number, z: number): void => {
		this.socket?.send(JSON.stringify({ CreatUnit: { position: [x, z] } } as CreateUnitRequest))
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
		this.messageHandlers = [...this.messageHandlers, { type, handler }]
	}

	private notifyHandlers = (type: WebsocketMessageType, message: WebsocketMessage): void => {
		this.messageHandlers.filter((h) => h.type === type).forEach((handler) => handler.handler(message))
	}

	private onMessageRecived = (e: MessageEvent): void => {
		const msg: WebsocketMessage = JSON.parse(e.data)
		console.log('onMessageRecived', e)
		if ((msg as CreateUnitResponse).CreatUnit) {
			this.notifyHandlers('CreatUnit', msg)
		}
		if ((msg as SetUnitMessage).SetUnit) {
			this.notifyHandlers('SetUnit', msg)
		}
	}
}

export default GameStateDataService
