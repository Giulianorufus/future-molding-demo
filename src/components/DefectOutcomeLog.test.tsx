/** @jest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import DefectOutcomeLog from './DefectOutcomeLog'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

test('saves a press trial and restores it only in the history for its defect', () => {
  const { unmount } = render(<DefectOutcomeLog defectId="short-shot" pressId="arburg" materialId="PP" />)
  const save = screen.getByRole('button', { name: 'Salva esito' })
  fireEvent.change(screen.getByLabelText('Modifica provata'), { target: { value: 'Controllato lo sfiato' } })
  expect((save as HTMLButtonElement).disabled).toBe(true)

  fireEvent.change(screen.getByLabelText('Esito in pressa'), { target: { value: 'PARTIAL_SUCCESS' } })
  fireEvent.change(screen.getByLabelText('Note sulla prova'), { target: { value: 'Segno ancora visibile' } })
  fireEvent.click(screen.getByLabelText('Ho ripristinato la ricetta precedente in pressa'))
  fireEvent.click(save)
  expect(screen.getByRole('status').textContent).toMatch(/Esito salvato/)
  unmount()

  const other = render(<DefectOutcomeLog defectId="flash" />)
  expect(screen.queryByText('Segno ancora visibile')).toBeNull()
  other.unmount()

  render(<DefectOutcomeLog defectId="short-shot" />)
  expect(screen.getByText('Segno ancora visibile')).toBeTruthy()
  expect(screen.getByText('Ricetta precedente ripristinata in pressa.')).toBeTruthy()
})
