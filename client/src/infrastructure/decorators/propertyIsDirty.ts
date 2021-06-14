/* eslint-disable @typescript-eslint/no-explicit-any */
import CompareHelper from '../compareHelper'

export type DirtyProps<T> = {
	[K in keyof T as K]?: boolean
}
export type IDirtyable<T> = {
	isDirty: DirtyProps<T>
	isAnyDirty: boolean
	clearDirty: () => void
}

type GenericPropertyDescriptorMap<T> = PropertyDescriptorMap & ThisType<T> & any
type TypedPropertyDecorator<T extends IDirtyable<T>, K extends keyof T = keyof T> = (target: T, propertyKey: K) => GenericPropertyDescriptorMap<T>
type DirtyMethod = 'normal' | 'shalowCompare'
export function PropertyIsDirty(method: DirtyMethod = 'normal'): TypedPropertyDecorator<any> {
	return <T extends IDirtyable<T>, K extends keyof T>(target: T, propertyKey: K) => {
		const privateKey = `_${propertyKey.toString()}` as keyof T
		return Object.defineProperty(target, propertyKey, {
			set(this: T, value) {
				const oldValue = this[privateKey]
				if ((method === 'normal' && oldValue !== value) || (method === 'shalowCompare' && !CompareHelper.shallowEqual(oldValue, value))) {
					if (!this.isDirty) {
						this.isDirty = {}
					}
					this.isDirty[propertyKey] = true
					this.isAnyDirty = true
					this[privateKey] = value
				}
			},
			get() {
				return this[privateKey]
			},
			enumerable: true,
			configurable: true
		})
	}
}
