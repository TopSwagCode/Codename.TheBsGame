import React from 'react'

import { render, screen } from '@testing-library/react'
import Temp from './temp'

test('renders temp', () => {
	render(<Temp />)
	const element = screen.getByText(/temp/i)
	// console.log(element)
	expect(element).toBeInTheDocument()
})
