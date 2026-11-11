import { fireEvent, render, screen } from '@testing-library/react';
import FillingTrialPanel from '../../pages/wizard/FillingTrialPanel';

test('uses the PC reference by default and accepts grade-specific coefficients', () => {
  render(<FillingTrialPanel pcSelected vpVolumeCm3={6} />);
  const geometry = [
    ['Portata effettiva (cm³/s)', '30'],
    ['Lunghezza canale (mm)', '40'],
    ['Diametro canale (mm)', '6'],
    ['Lunghezza attacco (mm)', '2'],
    ['Diametro attacco (mm)', '2'],
    ['Percorso equivalente in cavità (mm)', '50'],
    ['Larghezza equivalente in cavità (mm)', '20'],
    ['Spessore equivalente in cavità (mm)', '2'],
  ];
  for (const [label, value] of geometry) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  expect(screen.getByText(/303,014 bar/)).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Usa viscosità di riferimento per il PC'));
  expect(screen.queryByText(/303,014 bar/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/Consistenza K/), { target: { value: '200' } });
  fireEvent.change(screen.getByLabelText(/Indice di flusso/), { target: { value: '1' } });
  expect(screen.getByText(/606,029 bar/)).toBeInTheDocument();
});
