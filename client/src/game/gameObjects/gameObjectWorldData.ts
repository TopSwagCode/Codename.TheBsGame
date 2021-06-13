import { DirtyProps, IDirtyable, PropertyIsDirty } from '../../infrastructure/decorators/propertyIsDirty'

export interface ICordinates {
	x: number
	y: number
	z: number
}
export interface IGameObjectWorldData extends IDirtyable<IGameObjectWorldData> {
	position: ICordinates
	rotation: ICordinates
	destination: ICordinates
	selected: boolean
	highlighted: boolean
}
class GameObjectWorldData implements IGameObjectWorldData {
	constructor() {
		this.isDirty = {}
		this.position = { x: 0, y: 0, z: 0 }
		this.rotation = { x: 0, y: 0, z: 0 }
		this.destination = this.position
		this.selected = false
		this.highlighted = false
	}

	public isAnyDirty = false

	public isDirty: DirtyProps<IGameObjectWorldData>

	public clearDirty = (): void => {
		this.isDirty = {}
		this.isAnyDirty = false
	}

	@PropertyIsDirty('shalowCompare')
	public position: ICordinates

	@PropertyIsDirty('shalowCompare')
	public rotation: ICordinates

	@PropertyIsDirty('shalowCompare')
	public destination: ICordinates

	@PropertyIsDirty()
	public selected: boolean

	@PropertyIsDirty()
	public highlighted: boolean
}

export default GameObjectWorldData
