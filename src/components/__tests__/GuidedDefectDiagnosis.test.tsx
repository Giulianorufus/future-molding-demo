import { fireEvent, render, screen, within } from '@testing-library/react'
import GuidedDefectDiagnosis from '../GuidedDefectDiagnosis'
import { useDefectsStore } from '@/stores/defectsStore'
import { useParametriStore } from '@/stores/parametriStore'

const props = { defectId: 'burn-mark', severity: 'medium', result: null, volumeCm3: null, pressId: null, materialId: null }

test('questions work without CAD or recipe and unknown answers do not claim evidence', async () => {
  render(<GuidedDefectDiagnosis {...props} />)
  expect(screen.getByText(/Completa il Wizard/)).toBeVisible()
  for (const input of screen.getAllByRole('combobox')) fireEvent.change(input, { target: { value: 'unknown' } })
  expect(await screen.findByText('3 di 3 risposte · 0 osservazioni verificate')).toBeVisible()
  expect(screen.queryByText('Indizi presenti')).toBeNull()
})

test('observations reorder checks and reset clears answers without modifying process stores', async () => {
  const recipe = useParametriStore.getState().result
  const defect = useDefectsStore.getState().selectedDefectId
  render(<GuidedDefectDiagnosis {...props} />)
  fireEvent.change(screen.getByRole('combobox', { name: 'Dove si vedono i segni scuri?' }), { target: { value: 'spread' } })
  fireEvent.change(screen.getByRole('combobox', { name: 'Il difetto peggiora dopo una sosta?' }), { target: { value: 'yes' } })
  expect(await screen.findByRole('heading', { name: '1. Degrado per temperatura o permanenza' })).toBeVisible()
  expect(within(screen.getByRole('list', { name: 'Cause possibili' })).getAllByRole('listitem').length).toBeGreaterThan(3)
  fireEvent.click(screen.getByRole('button', { name: 'Ricomincia le domande' }))
  expect(await screen.findByText('0 di 3 risposte · 0 osservazioni verificate')).toBeVisible()
  expect(screen.getByRole('combobox', { name: 'Dove si vedono i segni scuri?' })).toHaveValue('')
  expect(useParametriStore.getState().result).toBe(recipe)
  expect(useDefectsStore.getState().selectedDefectId).toBe(defect)
})
