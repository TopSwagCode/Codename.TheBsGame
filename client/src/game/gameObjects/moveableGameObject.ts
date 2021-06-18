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
		const direction = {
			x: destination.x - source.x,
			y: destination.y - source.y,
			z: destination.z - source.z
		}
		const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z)
		if (magnitude === 0) {
			return source
		}
		const movement = {
			x: (direction.x / magnitude) * delta * this.movementSpeed,
			y: (direction.y / magnitude) * delta * this.movementSpeed,
			z: (direction.z / magnitude) * delta * this.movementSpeed
		}
		return {
			x: movement.x + source.x,
			y: movement.y + source.y,
			z: movement.z + source.z
		}
	}
}
export default MoveableGameObject
