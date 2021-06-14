import React, { PureComponent } from 'react'

export type withSvgIconProps = React.SVGProps<SVGSVGElement>

const withSvgIcon = <P extends React.SVGProps<SVGSVGElement>>(WrappedSvgIcon: React.ComponentType<P>, defaultProps?: withSvgIconProps): React.ComponentType<P & withSvgIconProps> =>
	class WithSvgIcon extends PureComponent<P & withSvgIconProps> {
		private defaultPropValues: withSvgIconProps = {
			fill: '#336699',
			...defaultProps
		}

		render(): JSX.Element {
			const { props } = this
			const { ...svgProps } = { ...this.defaultPropValues, ...props, className: `with-svg-icon ${props.className}` }
			return <WrappedSvgIcon {...svgProps} />
		}
	}

export default withSvgIcon
