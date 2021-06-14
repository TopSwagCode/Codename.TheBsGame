import React, { PureComponent } from 'react'
import './basicUI.scss'
import { TowerIcon, WellIcon } from '../../../components/ui/icons'

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
					<TowerIcon />
				</button>
				<button type="button" onClick={this.handleButtonClick('well')}>
					<WellIcon />
				</button>
			</div>
		)
	}
}

export default BasicUI
