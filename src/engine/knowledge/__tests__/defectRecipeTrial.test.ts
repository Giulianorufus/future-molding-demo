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

test('an observed sink mark can yield a bounded holding-time change', () => {
  const observations = { location: 'yes', holdingResponse: 'yes', cooling: 'no' }
  const timeWindow = { current: 3, minimum: 2.5, maximum: 3.15 }
  expect(proposeDefectRecipeTrial('sink-mark', observations, timeWindow)).toMatchObject({ before: 3, after: 3.15 })
  expect(proposeDefectRecipeTrial('sink-mark', { ...observations, location: 'no' }, timeWindow)).toBeNull()
  expect(proposeDefectRecipeTrial('sink-mark', { ...observations, cooling: 'unknown' }, timeWindow)).toBeNull()
  expect(proposeDefectRecipeTrial('sink-mark', observations, { ...timeWindow, maximum: 3 })).toBeNull()
})
