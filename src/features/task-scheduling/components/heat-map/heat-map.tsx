import type { HeatMapModel } from '../../utils/heat-map';
import { formatFullDate } from '../../utils/date-utils';
import './heat-map.css';

interface HeatMapProps {
  model: HeatMapModel;
  onDayOpen: (iso: string) => void;
}

/** Las 6 muestras de la leyenda, del color cero al nivel 4 (RF-10). */
const LEGEND_LEVELS = ['cero', '0', '1', '2', '3', '4'] as const;

/** «1 completada» / «2 completadas»: mismo plural en tooltip y aria-label. */
function completadasText(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? 'completada' : 'completadas'}`;
}

/**
 * Mapa de calor de actividad (spec 001): puramente presentacional, recibe
 * el modelo ya calculado. Cada celda es un `<button>` nativo (RF-13: foco,
 * Enter/Espacio) con nombre accesible «fecha larga · N completadas», un
 * tooltip en CSS (RF-8) y, bajo la rejilla, la leyenda (RF-10) y el texto
 * de invitación cuando procede (RF-9, desactivado por RF-11).
 */
export default function HeatMap({ model, onDayOpen }: HeatMapProps) {
  return (
    <section className="heat-map" aria-label="Mapa de calor de actividad">
      {/* grid-auto-flow: column → las 7 filas de la izquierda son lun..dom */}
      <div className="hm-grid">
        {model.cells.map((cell) => (
          <button
            key={cell.iso}
            type="button"
            className={`hm-cell is-level-${cell.nivel}${cell.esHoy ? ' is-today' : ''}`}
            data-testid="heat-cell"
            data-date={cell.iso}
            data-level={cell.nivel}
            aria-label={`${formatFullDate(cell.iso)} · ${completadasText(cell.completadas)}`}
            onClick={() => onDayOpen(cell.iso)}
          >
            {/* span y no div: el contenido de <button> ha de ser frases (HTML). */}
            <span className="hm-tooltip" role="tooltip">
              {formatFullDate(cell.iso)} · {completadasText(cell.completadas)}
              {cell.otras > 0 && ` · ${cell.otras} sin completar`}
            </span>
          </button>
        ))}
      </div>

      <div className="hm-months" aria-hidden="true">
        {model.labelsMes.map((label, index) => (
          <span key={index} className="hm-month">
            {label}
          </span>
        ))}
      </div>

      {/* RF-10: siempre visible, 6 muestras con los extremos etiquetados. */}
      <div
        className="hm-legend"
        data-testid="heat-legend"
        role="img"
        aria-label="Leyenda de actividad: de menos a más"
      >
        <span className="hm-legend-edge">Menos</span>
        <span className="hm-legend-scale" aria-hidden="true">
          {LEGEND_LEVELS.map((level) => (
            <span
              key={level}
              className={`hm-swatch is-level-${level}`}
              data-testid="heat-legend-swatch"
            />
          ))}
        </span>
        <span className="hm-legend-edge">Más</span>
      </div>

      {/* RF-9: el modelo decide si procede (RF-11 lo desactiva). */}
      {model.mostrarTextoInvitacion && (
        <p className="hm-empty" data-testid="heat-empty">
          Todavía no has completado ninguna tarea con fecha en estas 12 semanas: marca una como
          completada
        </p>
      )}
    </section>
  );
}
