import React, { PureComponent } from 'react'

class Temp extends PureComponent<Record<string, never>> {
	render = (): JSX.Element => {
		return (
			<div id="Temp" style={{ padding: 100 }}>
				Temp
			</div>
		)
	}
}

export default Temp
