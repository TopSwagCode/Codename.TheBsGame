import React, { PureComponent } from 'react'
import Game from '../../game'
import BasicUI from './components/basicUI'

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

	handleActionbarButtonClicked = (event: MouseEvent, button: string): void => {
		if (this.game) {
			this.game.handleActionbarButtonClicked(button)
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
				<BasicUI onClickButton={this.handleActionbarButtonClicked} />
			</div>
		)
	}
}

export default GameContainer
