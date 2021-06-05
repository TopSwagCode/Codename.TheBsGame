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
}

class GameObjectWorldData implements IGameObjectWorldData {
	public position: ICordinates = { x: 0, y: 0, z: 0 }

	public rotation: ICordinates = { x: 0, y: 0, z: 0 }

	public scale = 1

	public castShadow = false

	public receiveShadow = false

	public selected = false

	public highlighted = false
}

export default GameObjectWorldData
