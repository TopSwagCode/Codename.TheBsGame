import Unit from './unit'

type SetUnitPosition = {
	SetUnitPosition: Pick<Unit, 'id' | 'position'>
}
type SetUnitDestination = {
	SetUnitDestination: Pick<Unit, 'id' | 'destination'>
}

export type { SetUnitPosition, SetUnitDestination }
