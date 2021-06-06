import React, { PureComponent } from 'react'
import { HashRouter, Route } from 'react-router-dom'
import GameContainer from './game/index'
import HomeContainer from './home'

class App extends PureComponent {
	render = (): JSX.Element => {
		return (
			<div className="App">
				<HashRouter basename={process.env.PUBLIC_URL}>
					<Route path="/" exact>
						<HomeContainer />
					</Route>
					<Route path="/game">
						<GameContainer />
					</Route>
				</HashRouter>
			</div>
		)
	}
}

export default App
