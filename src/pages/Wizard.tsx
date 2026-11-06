import React, { useState } from 'react'
import Step1Drawing from './wizard/Step1Drawing'
import Step2Mold from './wizard/Step2Mold'
import Step2Press from './wizard/Step2Press'
import Step3Material from './wizard/Step3Material'
import Step4Parametri from './wizard/Step4Parametri'

const steps = [
  { id: 1, title: 'Carica disegno' },
  { id: 2, title: 'Stampo' },
  { id: 3, title: 'Pressa + vite' },
  { id: 4, title: 'Materiale' },
  { id: 5, title: 'Parametri' },
]

export default function Wizard() {
  const [index, setIndex] = useState(0)

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-800 mb-4">Wizard Future Molding</h1>

      <ol aria-label="Passaggi configurazione" className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {steps.map((step, i) => (
          <li key={step.id} aria-current={i === index ? 'step' : undefined}
            className="fm-step fm-card flex items-center gap-2 px-3 py-2 text-sm font-semibold">
            <span className="rounded bg-blue-950 px-1.5 text-white">{step.id}</span>
            {step.title}
          </li>
        ))}
      </ol>

      <div className="fm-card mb-4 p-3 sm:p-5">
        {index === 0 && <Step1Drawing onNext={() => setIndex(1)} />}
        {index === 1 && <Step2Mold onNext={() => setIndex(2)} onBack={() => setIndex(0)} />}
        {index === 2 && <Step2Press onNext={() => setIndex(3)} onBack={() => setIndex(1)} />}
        {index === 3 && <Step3Material onNext={() => setIndex(4)} onBack={() => setIndex(2)} />}
        {index === 4 && <Step4Parametri onBack={() => setIndex(3)} />}
      </div>

      <div className="flex justify-between mt-4">
        <button className="fm-action text-sm" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
          Indietro
        </button>
        <div />
      </div>
    </div>
  )
}
