import { PerspectiveCamera } from 'three'
import CameraMapControls from './cameraMapControls'
import WorldInteractionControls from './worldInteractionControls'
import GameWorld from '../gameWorld'
import { IUpdate } from '../gameRenderer'

class GameControls implements IUpdate {
	private cameraMapControls: CameraMapControls

	private worldInteractionControls: WorldInteractionControls

	constructor(container: HTMLElement, camera: PerspectiveCamera, gameWorld: GameWorld) {
		this.worldInteractionControls = new WorldInteractionControls(container, camera, gameWorld)
		this.cameraMapControls = new CameraMapControls(camera, container)
	}

	public initialize = (): void => {
		this.worldInteractionControls.initialize()

		this.cameraMapControls.screenSpacePanning = false
		this.cameraMapControls.minDistance = 5
		this.cameraMapControls.maxDistance = 75

		// "Math.PI" = allow full bird view
		// "Math.PI / 10" = allow 10% angle from full bird view
		this.cameraMapControls.minPolarAngle = Math.PI / 10

		// "0" = allow to look from bottom
		// "Math.PI / 2.5" = lowest look angle is 40%
		this.cameraMapControls.maxPolarAngle = Math.PI / 2.5

		this.cameraMapControls.target.set(0, 0, 0)
		// setInterval(() => this.cameraMapControls.update(), 5000)
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public update = (timer: number, delta: number): void => {
		this.cameraMapControls.update()
	}
}
export default GameControls
