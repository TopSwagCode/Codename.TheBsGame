/* eslint-disable no-console */
type LoggerType = (prefix?: string, loglevel?: LogLevel, maxLogsPerSecond?: number) => LogType
type LogType = (message?: unknown, ...optionalParams: unknown[]) => void

type LogLevel = 'info' | 'warn' | 'error'

const logger: LoggerType = (prefix = '', loglevel: LogLevel = 'info', maxLogsPerSecond = 10): LogType => {
	let logCount = 0
	let lastLog = new Date().getTime()
	const log: LogType = (message, ...optionalParams): void => {
		if (process.env.NODE_ENV === 'production') {
			return
		}
		const now = new Date().getTime()
		if (lastLog - now >= 1000 / maxLogsPerSecond) {
			logCount = 0
			log(message, ...optionalParams)
		}
		if (logCount <= maxLogsPerSecond) {
			if (loglevel === 'info') console.info(`${prefix}${message}`, ...optionalParams)
			if (loglevel === 'warn') console.warn(`${prefix}${message}`, ...optionalParams)
			if (loglevel === 'error') console.error(`${prefix}${message}`, ...optionalParams)
			logCount += 1
			lastLog = now
		}
	}
	return log
}

export default logger
