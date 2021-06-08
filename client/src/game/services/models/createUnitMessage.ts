import Unit from './unit'

type CreateUnitRequest = {
	CreateUnit: Pick<Unit, 'position'>
}
type CreateUnitResponse = {
	CreateUnit: Unit
}
export type { CreateUnitRequest, CreateUnitResponse }
