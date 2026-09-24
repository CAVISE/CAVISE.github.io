import { hero, research, simulationLinks, simulationSteps } from '../content.js';
import { ResearchSection } from './ResearchSection.js';
import { Simulation } from './Simulation.js';

export function App() {
  return `
    <div class="loading" id="loading" role="status">Loading CAVISE scene</div>
    <main>
      ${Simulation({ hero, steps: simulationSteps, links: simulationLinks })}
      ${ResearchSection(research)}
    </main>
  `;
}
