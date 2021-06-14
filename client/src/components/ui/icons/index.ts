import './index.scss'
import withSvgIcon from './withSvgIcon'
import { ReactComponent as TowerIconSVG } from '../../../assets/icons/tower-icon.svg'
import { ReactComponent as WellIconSVG } from '../../../assets/icons/well-icon.svg'

const TowerIcon = withSvgIcon(TowerIconSVG)
const WellIcon = withSvgIcon(WellIconSVG)
export { TowerIcon, WellIcon }
