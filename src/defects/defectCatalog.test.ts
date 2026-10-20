import { DEFECT_CATALOG, findDefectCatalogEntries, resolveDefectCatalogEntry } from './defectCatalog'
import { getAutomaticDefectCorrection, mapLegacyDefectId } from './defectAdapter'

describe('unified defect catalog', () => {
  test('contains 24 unique canonical IDs and no alias collisions', () => {
    expect(DEFECT_CATALOG).toHaveLength(24)
    expect(new Set(DEFECT_CATALOG.map((entry) => entry.id)).size).toBe(24)
    expect(DEFECT_CATALOG.filter((entry) => entry.verificationStatus === 'partial')).toHaveLength(13)
    expect(DEFECT_CATALOG.filter((entry) => entry.verificationStatus === 'unverified')).toHaveLength(11)
    for (const entry of DEFECT_CATALOG) {
      expect(entry.nameIt).toBeTruthy()
      expect(entry.description).toBeTruthy()
      expect(entry.severityCriteria[1]).toBeTruthy()
      expect(entry.severityCriteria[2]).toBeTruthy()
      expect(entry.severityCriteria[3]).toBeTruthy()
      expect(entry.diagnosticQuestions.length).toBeGreaterThan(0)
      expect(resolveDefectCatalogEntry(entry.id)?.id).toBe(entry.id)
      for (const alias of entry.legacyIds) expect(resolveDefectCatalogEntry(alias)?.id).toBe(entry.id)
    }
  })

  test('keeps historical aliases and distinguishes related defect meanings', () => {
    expect(resolveDefectCatalogEntry('SHORT_SHOT')?.id).toBe('short_shot')
    expect(resolveDefectCatalogEntry('BAVE')?.id).toBe('flash')
    expect(resolveDefectCatalogEntry('RITIRO')?.id).toBe('sink')
    expect(resolveDefectCatalogEntry('voids')?.id).not.toBe(resolveDefectCatalogEntry('sink-mark')?.id)
    expect(resolveDefectCatalogEntry('materiale_degradato')?.id).not.toBe(resolveDefectCatalogEntry('burn-mark')?.id)
  })

  test('searches names and legacy synonyms across all entries', () => {
    expect(findDefectCatalogEntries('filamenti').map((entry) => entry.id)).toContain('drool_stringing')
    expect(findDefectCatalogEntries('puntinatura').map((entry) => entry.id)).toContain('surface_roughness')
    expect(findDefectCatalogEntries('termine che non esiste')).toEqual([])
  })

  test('only existing active speed proposals retain automation; new entries have no delta', () => {
    expect(getAutomaticDefectCorrection('short-shot', 'medium')?.speedDeltaPct).toBe(10)
    expect(getAutomaticDefectCorrection('burn-mark', 'medium')?.speedDeltaPct).toBe(-10)
    expect(getAutomaticDefectCorrection('flash', 'medium')?.speedDeltaPct).toBe(-10)
    expect(getAutomaticDefectCorrection('jetting', 'medium')).toBeNull()
    expect(mapLegacyDefectId('jetting')).toBeNull()
    expect(DEFECT_CATALOG.find((entry) => entry.id === 'jetting')).toMatchObject({
      automationStatus: 'disabled',
      correctionId: null,
    })
    expect(DEFECT_CATALOG.find((entry) => entry.id === 'cold_slug')).toMatchObject({
      automationStatus: 'disabled',
      correctionId: null,
      probableCauses: [],
      orderedActions: [],
    })
  })
})
