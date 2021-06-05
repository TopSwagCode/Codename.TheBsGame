import GameObjectWorldData, { ICordinates, IGameObjectWorldData } from './gameObjectWorldData'

export interface IMoveableGameObjectWorldData extends IGameObjectWorldData {
	destinationPosition: ICordinates
}
class MoveableGameObjectWorldData extends GameObjectWorldData implements IMoveableGameObjectWorldData {
	public destinationPosition: ICordinates = this.position
}
export default MoveableGameObjectWorldData
