import React, { PureComponent } from 'react'
import Game from '../../game'

class GameContainer extends PureComponent<Record<string, never>> {
	private initialized = false

	private game: Game | undefined

	private gameContainer: HTMLDivElement | null = null

	componentDidMount(): void {
		this.initGame()
	}

	initGame = (): void => {
		if (this.gameContainer && !this.initialized) {
			this.game = new Game(this.gameContainer)
			this.game.initialize()
			this.initialized = true
		}
	}

	render = (): JSX.Element => {
		return (
			<div className="game">
				<div
					id="game-container"
					ref={(gameContainer): void => {
						this.gameContainer = gameContainer
					}}
				/>
			</div>
		)
	}
}

export default GameContainer
