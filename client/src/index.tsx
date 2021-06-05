import React from 'react'
import ReactDOM from 'react-dom'

import App from './containers'
import './styles/index.scss'

// let logCount = 0
window.log = (message?: unknown, ...optionalParams: unknown[]): void => {
	// eslint-disable-next-line no-console
	console.log(message, optionalParams)
}
window.logCount = 0
window.logC = (message?: unknown, mod = 100, ...optionalParams: unknown[]): void => {
	if (window.logCount === 0 || window.logCount % mod === 1) {
		window.log(message, optionalParams)
	}
	window.logCount += 1
}
ReactDOM.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
	document.getElementById('root')
)
