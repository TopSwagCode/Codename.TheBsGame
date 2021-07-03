import React from 'react'
import ReactDOM from 'react-dom'

import App from './containers'
import './styles/index.scss'

ReactDOM.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
	document.getElementById('root')
)
import('thebsgame-wasm').then((gameLogic) => {
	const game = gameLogic.initialize_game()
	let i = 0
	while (i < 100) {
		game.set_elapsed_seconds(1)
		game.execute()
		i += 1
		game.get_changed_units()
	}
})
