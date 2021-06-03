/// <reference types="react-scripts" />

declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: 'development' | 'production' | 'test'
		PUBLIC_URL: string
		REACT_APP_SERVER_API: string
		REACT_APP_SERVER_WS: string
	}
}
interface Window {
	logCount: number
	log: (message?: unknown, ...optionalParams: unknown[]) => void
	logC: (message?: unknown, mod: number = 100, ...optionalParams: unknown[]) => void
}
