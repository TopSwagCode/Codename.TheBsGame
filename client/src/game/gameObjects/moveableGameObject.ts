import GameObject, { IGameObject } from './gameObject'
import { ICordinates } from './gameObjectWorldData'

export type IMoveableGameObject = IGameObject

class MoveableGameObject extends GameObject implements IMoveableGameObject {
	public movementSpeed = 5

	public destinationReached?: (obj: this) => void

	// constructor(key: string, model: Object3D, worldData: IGameObjectWorldData | undefined) {
	// 	super(key, model, worldData)
	// }

	public update(time: number, delta: number): void {
		// const updateData = this.updateData<IGameObjectWorldData>()
		// updateData('destination')

		const { worldData } = this
		if (worldData.position.x !== worldData.destination.x || worldData.position.z !== worldData.destination.z) {
			worldData.position = this.move(worldData.position, worldData.destination, delta)
			if (worldData.position.x === worldData.destination.x && worldData.position.z === worldData.destination.z) {
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

	private getDistanceToMove = (source: number, destination: number, delta: number): number => {
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
		return newPostion
	}
}
export default MoveableGameObject
