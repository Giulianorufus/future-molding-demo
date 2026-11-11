/** @jest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { CalculationResult } from '@/core/calcEngine'
import DefectOutcomeLog from './DefectOutcomeLog'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

test('saves a press trial and restores it only in the history for its defect', () => {
  const result: CalculationResult = {
    shotVolumeCm3: 19.307248,
    vpSwitchVolumeCm3: 18.874567,
    vpSwitchPercentOfShot: 97.76,
    tonnellaggioRequired: 9.3,
    pressureBar: 750,
    screwDiameterMm: 22,
    injectionFlowCm3s: 42,
    switchoverMs: 450,
    times: { injectionMs: 500, coolingMs: 12000 },
    cooling: { suggestedC: 30 },
  }
  localStorage.setItem('fm:defect-outcomes', JSON.stringify([{
    id: 'legacy',
    status: 'SUCCESS',
    metadata: { defectId: 'short-shot', action: 'Prova precedente' },
  }]))
  const { unmount } = render(<DefectOutcomeLog defectId="short-shot" pressId="arburg" materialId="PP" result={result} />)
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

  render(<DefectOutcomeLog defectId="short-shot" result={{ ...result, shotVolumeCm3: 21 }} />)
  expect(screen.getByText(/Dose 19,307248 cm³/)).toBeTruthy()
  expect(screen.queryByText(/Dose 21 cm³/)).toBeNull()
  expect(screen.getByText(/Prova precedente/)).toBeTruthy()
  expect(screen.getByText('Segno ancora visibile')).toBeTruthy()
  expect(screen.getByText('Ricetta precedente ripristinata in pressa.')).toBeTruthy()
})

test('links only the proposal explicitly tried by the operator', () => {
  const trial = { parameter: 'Tempo di mantenimento', unit: 's', before: 3, after: 3.15, reason: 'Finestra validata' }
  const { rerender } = render(<DefectOutcomeLog defectId="sink-mark" trial={trial} />)
  fireEvent.click(screen.getByRole('checkbox', { name: /Ho provato la modifica proposta/ }))
  fireEvent.change(screen.getByLabelText('Esito in pressa'), { target: { value: 'PARTIAL_SUCCESS' } })

  const newTrial = { ...trial, after: 3.2 }
  rerender(<DefectOutcomeLog defectId="sink-mark" trial={newTrial} />)
  expect(screen.getByRole('checkbox', { name: /Ho provato la modifica proposta/ })).not.toBeChecked()
  expect(screen.getByRole('button', { name: 'Salva esito' })).toBeDisabled()

  fireEvent.click(screen.getByRole('checkbox', { name: /Ho provato la modifica proposta/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Salva esito' }))
  const [record] = JSON.parse(localStorage.getItem('fm:defect-outcomes') ?? '[]')
  expect(record.metadata.appliedTrial).toEqual(newTrial)
  expect(record.metadata.action).toBe('Tempo di mantenimento 3 → 3,2 s')
})
