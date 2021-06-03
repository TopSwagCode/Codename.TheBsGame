import React, { PureComponent } from 'react'
import { Link } from 'react-router-dom'

class HomeContainer extends PureComponent<Record<string, never>> {
	render = (): JSX.Element => {
		return (
			<div className="home" style={{ padding: 100 }}>
				<Link to="/game" style={{ fontSize: 50 }}>
					Game
				</Link>
			</div>
		)
	}
}

export default HomeContainer
