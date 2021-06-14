class CompareHelper {
	public static shallowEqual = <T>(object1: T | undefined, object2: T | undefined): boolean => {
		if (object1 === undefined && object2 === undefined) return true
		if (object1 === undefined || object2 === undefined) return false
		const keys1 = Object.keys(object1)
		const keys2 = Object.keys(object2)

		if (keys1.length !== keys2.length) {
			return false
		}
		if (keys1.filter((k) => object1[k as keyof T] !== object2[k as keyof T]).length > 0) {
			return false
		}

		return true
	}
}
export default CompareHelper
