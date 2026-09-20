export type Board = {
  id: string;
  title: string;
  videoUrl?: string;
  team: string;
  formation: string;
  phases: {
    label: string;
    desc: string;
    caption: string;
    us: [number, number][];
    op: [number, number][];
    arrows: [number, number, number, number][];
    zone?: { x: number; y: number; w: number; h: number };
  }[];
  players: { pos: string; name: string; num: string; notes: string[] }[];
  source: string;
};

export const sampleBoard: Board = {
  id: 'illustration',
  title: 'Illustration',
  team: 'Barcelona',
  formation: '4-3-3',
  source: 'His analysis',
  phases: [
    {
      label: 'Base shape',
      desc: 'A 4-3-3 with the ball at the centre-back.',
      caption: 'Base shape: two centre-backs split, full-backs high, the pivot in front. The opponent sits in a mid-block and waits.',
      us: [[40,225],[130,90],[120,180],[120,270],[130,360],[230,225],[290,140],[290,310],[400,80],[430,225],[400,370]],
      op: [[300,190],[300,260],[380,90],[370,180],[370,270],[380,360],[520,110],[510,190],[510,260],[520,340],[660,225]],
      arrows: [],
    },
    {
      label: 'The press arrives',
      desc: 'Two strikers and the wide mids squeeze the lanes.',
      caption: 'The press: both strikers jump, the wide mids tuck in, and every short pass into midfield is covered.',
      us: [[40,225],[130,90],[120,180],[120,270],[130,360],[230,225],[290,140],[290,310],[400,80],[430,225],[400,370]],
      op: [[200,180],[200,270],[265,95],[270,190],[270,260],[265,355],[430,120],[420,190],[420,260],[430,330],[600,225]],
      arrows: [],
    },
    {
      label: 'The escape',
      desc: 'The pivot drops, the full-back rises, the half-space opens.',
      caption: 'The escape: the pivot drops, the left-back pushes up to pin the winger, and the ball travels through the gap into the half-space.',
      us: [[40,225],[230,70],[120,160],[120,290],[230,380],[180,225],[340,170],[340,290],[470,90],[500,225],[470,360]],
      op: [[200,180],[200,270],[265,95],[270,190],[270,260],[265,355],[430,120],[420,190],[420,260],[430,330],[600,225]],
      arrows: [
        [120,160,226,74],
        [120,160,165,215],
        [185,225,330,180],
        [345,172,485,220],
      ],
      zone: { x: 150, y: 130, w: 230, h: 190 },
    },
  ],
  players: [
    { pos: 'GK', name: 'Joan Garcia', num: '1', notes: ['Starts the play from the back', 'Sweeps behind a high line'] },
    { pos: 'LB', name: 'Alejandro Balde', num: '3', notes: ['Pushes high to pin the winger', 'Supports the half-space'] },
    { pos: 'CB', name: 'Pau Cubarsí', num: '5', notes: ['Splits wide to open the pivot', 'Steps out to break lines'] },
    { pos: 'CB', name: 'Eric García', num: '24', notes: ['Holds the line', 'Plays through the first press'] },
    { pos: 'RB', name: 'Jules Koundé', num: '23', notes: ['Offers the outlet on the right', 'Tucks in when the ball is on the far side'] },
    { pos: 'DM', name: 'Frenkie de Jong', num: '21', notes: ['Drops between the centre-backs', 'Carries the ball through pressure'] },
    { pos: 'CM', name: 'Pedri', num: '8', notes: ['Dictates the tempo', 'Links defence and attack', 'Creates space'] },
    { pos: 'CM', name: 'Dani Olmo', num: '20', notes: ['Arrives late into the box', 'Finds pockets between the lines'] },
    { pos: 'LW', name: 'Raphinha', num: '11', notes: ['Stretches the back line', 'Presses the full-back'] },
    { pos: 'ST', name: 'Gabriel Jesus', num: '9', notes: ['Pins the centre-backs', 'Drops to link play'] },
    { pos: 'RW', name: 'Lamine Yamal', num: '10', notes: ['Isolates the full-back', 'Cuts inside onto his left'] },
  ],
};

export const boards: Board[] = [
  {
    id: 'flick-high-line',
    title: "Flick's high line",
    team: 'Barcelona',
    formation: '4-3-3',
    source: 'Based on published tactical analysis (Total Football Analysis, Yahoo Sports)',
    phases: [
      {
        label: 'High line',
        desc: 'The whole team squeezes toward halfway.',
        caption: 'The defence sits near halfway, the goalkeeper acts as a sweeper, and the lines stay close so the press can restart the moment it is beaten.',
        us: [[160,225],[310,85],[315,180],[315,270],[310,365],[390,225],[420,150],[420,300],[520,90],[550,225],[520,360]],
        op: [[660,225],[600,120],[605,190],[605,260],[600,335],[540,170],[540,280],[490,225],[470,110],[470,340],[430,225]],
        arrows: [],
      },
      {
        label: 'The press',
        desc: 'The front line jumps to force a bad pass.',
        caption: 'The front three and the midfield jump together to cut the passing lanes and force a long or hurried pass.',
        us: [[200,225],[340,90],[345,180],[345,270],[340,360],[400,225],[450,190],[450,270],[470,120],[500,205],[480,330]],
        op: [[660,225],[600,120],[605,190],[605,260],[600,335],[540,170],[540,280],[490,225],[470,110],[470,340],[430,225]],
        arrows: [[500,205,585,190],[470,120,595,120],[480,330,590,335]],
      },
      {
        label: 'Offside trap',
        desc: 'The line steps up together as the ball is played over.',
        caption: 'As the pass goes over the top, all four defenders step up at once and leave the runner offside. If they are out of sync, the space behind is the risk.',
        us: [[200,225],[355,90],[358,180],[358,270],[355,360],[400,225],[450,190],[450,270],[470,120],[500,205],[480,330]],
        op: [[660,225],[600,120],[605,190],[605,260],[600,335],[540,170],[540,280],[500,225],[470,110],[470,340],[335,225]],
        arrows: [[315,90,355,90],[315,180,358,180],[315,270,358,270],[315,365,355,365]],
        zone: { x: 350, y: 20, w: 14, h: 410 },
      },
    ],
    players: [
      { pos: 'GK', name: 'Joan Garcia', num: '1', notes: ['Sweeps behind the high line', 'Starts the play from the back'] },
      { pos: 'LB', name: 'Alejandro Balde', num: '3', notes: ['Steps up with the line', 'Pushes high to support the winger'] },
      { pos: 'CB', name: 'Pau Cubarsí', num: '5', notes: ['Defends space in behind', 'Leads the step-up'] },
      { pos: 'CB', name: 'Eric García', num: '24', notes: ['Holds the line\'s timing', 'Covers when the press is beaten'] },
      { pos: 'RB', name: 'Jules Koundé', num: '23', notes: ['Recovers quickly in open space', 'Offers the outlet on the right'] },
      { pos: 'DM', name: 'Frenkie de Jong', num: '21', notes: ['Screens in front of the line', 'Drops between the centre-backs'] },
      { pos: 'CM', name: 'Pedri', num: '8', notes: ['Links midfield and attack', 'Triggers the counter-press'] },
      { pos: 'CM', name: 'Dani Olmo', num: '20', notes: ['Finds space between the lines', 'Joins the press'] },
      { pos: 'LW', name: 'Raphinha', num: '11', notes: ['Runs to the back post', 'Presses the full-back'] },
      { pos: 'ST', name: 'Gabriel Jesus', num: '9', notes: ['First line of the press', 'Drops to link play'] },
      { pos: 'RW', name: 'Lamine Yamal', num: '10', notes: ['Stays wide on the touchline', 'Takes the progressive duty'] },
    ],
  },
];
