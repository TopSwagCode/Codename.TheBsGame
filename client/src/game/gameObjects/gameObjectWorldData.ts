import { OnChange } from '../../infrastructure/decorators/onPropertyChange'

export interface ICordinates {
	x: number
	y: number
	z: number
}
export interface IGameObjectWorldData {
	position: ICordinates
	rotation: ICordinates
	scale: number
	castShadow: boolean
	receiveShadow: boolean
	selected: boolean
	highlighted: boolean
	isDirty: boolean
}

class GameObjectWorldData implements IGameObjectWorldData {
	public position: ICordinates = { x: 0, y: 0, z: 0 }

	public rotation: ICordinates = { x: 0, y: 0, z: 0 }

	public isDirty = false

	public scale = 1

	public castShadow = false

	public receiveShadow = false

	public selected = false

	public highlighted = false

	@OnChange(['selected', 'highlighted', 'position', 'scale', 'rotation'])
	protected setDirty(): void {
		this.isDirty = true
	}

	protected clearDirty(): void {
		this.isDirty = false
	}
}

export default GameObjectWorldData
