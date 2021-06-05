import { Object3D } from 'three'
import GameObject, { IGameObject } from './gameObject'
import { ICordinates } from './gameObjectWorldData'
import MoveableGameObjectWorldData, { IMoveableGameObjectWorldData } from './moveableGameObjectWorldData'

export interface IMoveableGameObject extends IGameObject {
	worldData: IMoveableGameObjectWorldData
}

class MoveableGameObject extends GameObject implements IMoveableGameObject {
	public movementSpeed = 5

	public worldData: IMoveableGameObjectWorldData

	public destinationReached?: (obj: this) => void

	protected renderedWorldData: IMoveableGameObjectWorldData

	constructor(key: string, model: Object3D, worldData: IMoveableGameObjectWorldData = new MoveableGameObjectWorldData()) {
		super(key, model, worldData)
		this.worldData = worldData
		this.renderedWorldData = new MoveableGameObjectWorldData()
	}

	public update(time: number, delta: number): void {
		const updateData = this.updateData<IMoveableGameObjectWorldData>()
		updateData('destinationPosition')

		const { worldData } = this
		if (worldData.position.x !== worldData.destinationPosition.x || worldData.position.z !== worldData.destinationPosition.z) {
			worldData.position = this.move(worldData.position, worldData.destinationPosition, delta)
			if (worldData.position.x === worldData.destinationPosition.x && worldData.position.z === worldData.destinationPosition.z) {
				if (this.destinationReached) {
					this.destinationReached(this)
				}
			}
		}

		super.update(time, delta)
		// updateData('position')
	}

	private move(source: ICordinates, destination: ICordinates, delta: number): ICordinates {
		return {
			x: this.getDistanceToMove(source.x, destination.x, delta),
			y: this.getDistanceToMove(source.y, destination.y, delta),
			z: this.getDistanceToMove(source.z, destination.z, delta)
		}
	}

	private getDistanceToMove = (source: number, destination: number, delta: number, log = false): number => {
		let newPostion: number = source
		let moveDistance = delta * this.movementSpeed
		const diff = Math.abs(destination - source)
		if (diff === 0) {
			return destination
		}
		if (diff < moveDistance) {
			moveDistance = diff
		}
		if (source > destination) {
			newPostion = source - moveDistance
		}
		if (source < destination) {
			newPostion = source + moveDistance
		}
		if (log) {
			window.logC({ newPostion, diff, moveDistance, source, destination }, 100)
		}
		return newPostion
	}
}
export default MoveableGameObject
