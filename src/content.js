export const hero = {
  title: 'Simulate connected &<br><em>automated mobility.</em>',
  description: 'CAVISE is a co-simulation environment for connected and automated vehicles, combining traffic, perception, communication and wireless-channel modeling in one synchronized experiment.',
  actions: [
    { label: 'Explore on GitHub', href: 'https://github.com/cavise', primary: true },
    { label: 'Read documentation', href: 'https://cavise.github.io/Documentation/', icon: 'arrow' }
  ],
  scrollHint: 'Explore the simulation'
};

export const simulationSteps = [
  {
    kicker: '01 · Scenario',
    title: 'Compose the world.',
    description: 'A YAML scenario brings maps, vehicles and traffic into one repeatable CARLA–SUMO world, ready for sensors, behavior and controlled experiments.'
  },
  {
    kicker: '02 · Perception',
    title: 'Turn motion into perception.',
    description: 'LiDAR turns the ego vehicle’s surroundings into data. OpenCDA converts sensor returns into object detections ready for visualization, evaluation and cooperative fusion.'
  },
  {
    kicker: '03 · V2X communication',
    title: 'Connect every agent.',
    description: 'CAPI streams live vehicle state into Artery, where V2X services exchange messages while Sionna models how the 3D scene shapes every wireless link.'
  },
  {
    kicker: '04 · Synchronized experiment',
    title: 'Close the loop.',
    description: 'Traffic, vehicle dynamics, perception and communication advance together, producing synchronized data for repeatable cooperative-driving experiments.'
  }
];

export const simulationLinks = [
  { label: 'GitHub', value: 'github.com/CAVISE', href: 'https://github.com/CAVISE' },
  { label: 'Documentation', value: 'Guides, architecture & setup', href: 'https://cavise.github.io/Documentation/' },
  { label: 'Contacts', value: 'vg.stepanyants@hse.ru', href: 'mailto:vg.stepanyants@hse.ru' }
];

export const research = {
  header: {
    title: 'Research & publications',
    description: 'Advancing the state of the art through open research on autonomous driving, V2X networking, and wireless communications.'
  },
  publications: [
    {
      year: '2025',
      venue: 'Future Transportation',
      title: 'Parallel Multi-Level Simulation for Large-Scale Detailed Intelligent Transportation System Modeling',
      href: 'https://doi.org/10.3390/futuretransp5040141'
    },
    {
      year: '2025',
      venue: 'RusAutoCon',
      title: 'InGrid: Towards a Simulation-Based Automated Decision-Making System for Transportation',
      href: 'https://ieeexplore.ieee.org/abstract/document/11177316'
    },
    {
      year: '2025',
      venue: 'IEEE Access',
      title: 'Integrating OPAL Into CAVISE for Connected Vehicle Simulation With 3D Signal Propagation',
      href: 'https://ieeexplore.ieee.org/abstract/document/11098930'
    },
    {
      year: '2025',
      venue: 'SmartIndustryCon',
      title: 'Effects of Simulator Fidelity on Automated Vehicle Object Perception Accuracy',
      href: 'https://ieeexplore.ieee.org/document/10986291'
    },
    {
      year: '2024',
      venue: 'RusAutoCon',
      title: 'Evaluation of Cooperative Perception Algorithms in Simulation Environments with Realistic Communication Models',
      href: 'https://ieeexplore.ieee.org/document/10694627'
    },
    {
      year: '2024',
      venue: 'IEEE Access',
      title: 'Influence of Realistic Perception and Surroundings on Qualitative Results in Automated and Connected Vehicle Simulation',
      href: 'https://ieeexplore.ieee.org/document/10477481'
    },
    {
      year: '2023',
      venue: 'IEEE ITS Magazine',
      title: 'A Survey of Integrated Simulation Environments for Connected Automated Vehicles: Requirements, Tools, and Architecture',
      href: 'https://doi.org/10.1109/MITS.2023.3335126'
    },
    {
      year: '2023',
      venue: 'SmartIndustryCon',
      title: 'A Pipeline for Traffic Accident Dataset Development',
      href: 'https://ieeexplore.ieee.org/document/10110794'
    },
    {
      year: '2022',
      venue: 'Dynamics',
      title: 'Analysis of Requirements for Next-Generation Complex Urban and Transportation System Simulation',
      href: 'https://doi.org/10.1109/Dynamics56256.2022.10014795'
    },
    {
      year: '2022',
      venue: 'IEEE ICITE',
      title: 'An Object-Oriented Approach to a Structured Description of Machine Perception and Traffic Participant Interactions in Traffic Scenarios',
      href: 'https://ieeexplore.ieee.org/document/10101411'
    }
  ],
  openSource: {
    title: 'Built in the open.',
    links: [
      { label: 'GitHub', href: 'https://github.com/cavise', featured: true },
      { label: 'Documentation', href: 'https://cavise.github.io/Documentation/' },
      { label: 'Publications', href: '#publications' }
    ]
  },
  stats: [
    { value: '5+', label: 'Repositories', icon: 'branch' },
    { value: '20+', label: 'Contributors', icon: 'users' },
    { value: '10', label: 'Publications', icon: 'document' },
    { value: '4', label: 'Research domains', icon: 'layers' }
  ],
  mediaMentions: [
    {
      publisher: 'РБК Компании',
      date: '31 октября 2025',
      title: 'В ВШЭ создали среду для моделирования беспилотного транспорта',
      description: 'Разработка позволяет одновременно учитывать восприятие окружающей среды беспилотным транспортом и распространение сигналов подключенного транспорта.',
      image: '/assets/images/media/cavise-simulation-news.jpg',
      href: 'https://companies.rbc.ru/amp/news/d5f9e17c-1064-4ce0-9487-3651c41c8746/'
    },
    {
      publisher: 'НИУ ВШЭ',
      date: '29 октября 2025',
      title: 'Ученые НИУ ВШЭ создали среду для моделирования подключенного и беспилотного транспорта',
      description: 'CAVISE объединяет детальное моделирование восприятия и беспроводной связи в одной открытой среде.',
      image: '/assets/images/media/cavise-simulation-news.jpg',
      href: 'https://www.hse.ru/news/science/1097456705.html'
    },
    {
      publisher: 'МИЭМ НИУ ВШЭ',
      date: '11 февраля 2024',
      title: 'Проектная команда МИЭМ объединяет беспилотный и подключенный транспорт',
      description: 'Интервью о разработке высокоточного инструмента моделирования, исследовательской команде и развитии проекта CAVISE.',
      image: '/assets/images/media/cavise-project-team.jpg',
      href: 'https://miem.hse.ru/news/895735925.html'
    }
  ]
};
