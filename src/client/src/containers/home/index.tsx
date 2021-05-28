import React, { PureComponent } from 'react'
import { Link } from 'react-router-dom'

class HomeContainer extends PureComponent<Record<string, never>> {
	render = (): JSX.Element => {
		return (
			<div className="home">
				<Link to="/game">Game</Link>
			</div>
		)
	}
}

export default HomeContainer
