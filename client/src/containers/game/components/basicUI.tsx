import React, { PureComponent } from 'react'
import './basicUI.scss'

interface BasicUIProps {
	onClickButton: (event: MouseEvent, button: string) => void
}
class BasicUI extends PureComponent<BasicUIProps> {
	handleButtonClick =
		(button: string) =>
		(event: React.MouseEvent<HTMLButtonElement>): void => {
			event.preventDefault()
			const { onClickButton } = this.props
			onClickButton(event.nativeEvent, button)
		}

	render = (): JSX.Element => {
		return (
			<div className="ui-actionbar">
				<button type="button" onClick={this.handleButtonClick('tower')}>
					Tower
				</button>
				<button type="button" onClick={this.handleButtonClick('well')}>
					Well
				</button>
			</div>
		)
	}
}

export default BasicUI
