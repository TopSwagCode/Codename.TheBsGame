import React, { PureComponent } from 'react'
import { BrowserRouter, Route } from 'react-router-dom'
import GameContainer from './game'
import HomeContainer from './home'

class App extends PureComponent {
	render = (): JSX.Element => {
		return (
			<div className="App">
				<BrowserRouter>
					<Route path="/">
						<HomeContainer />
					</Route>
					<Route path="/game">
						<GameContainer />
					</Route>
				</BrowserRouter>
			</div>
		)
	}
}

export default App
