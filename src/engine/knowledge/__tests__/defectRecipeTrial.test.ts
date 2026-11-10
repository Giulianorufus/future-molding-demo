import { proposeDefectRecipeTrial } from '../defectRecipeTrial'

const observed = { location: 'distributed', phase: 'hold', mold: 'no' }
const window = { current: 600, minimum: 550, maximum: 650 }

test('only confirmed compatible observations produce a pressure change', () => {
  expect(proposeDefectRecipeTrial('flash', observed, window)).toMatchObject({ before: 600, after: 570 })
  expect(proposeDefectRecipeTrial('flash', { ...observed, location: 'local' }, window)).toBeNull()
  expect(proposeDefectRecipeTrial('flash', { ...observed, mold: 'unknown' }, window)).toBeNull()
})

test('respects the process window and verified press maximum', () => {
  expect(proposeDefectRecipeTrial('flash', observed, { ...window, pressMaximum: 590 })).toBeNull()
  expect(proposeDefectRecipeTrial('flash', observed, { ...window, minimum: 580 })).toMatchObject({ after: 580 })
  expect(proposeDefectRecipeTrial('flash', observed, { ...window, minimum: 600 })).toBeNull()
})
