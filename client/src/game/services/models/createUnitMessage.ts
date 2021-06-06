import Unit from './unit'

type CreateUnitRequest = {
	CreatUnit: { position: number[] }
}
type CreateUnitResponse = {
	CreatUnit: Unit
}
export type { CreateUnitRequest, CreateUnitResponse }
