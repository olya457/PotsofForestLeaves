export type CrosswordPlacement = {
  id: string;
  word: string;
  clue: string;
  direction: 'across' | 'down';
  row: number;
  col: number;
};

export type CrosswordLevel = {
  id: number;
  title: string;
  intro: string;
  size: number;
  placements: CrosswordPlacement[];
};

export const crosswordLevels: CrosswordLevel[] = [
  {
    id: 1,
    title: 'Level 1',
    intro: 'A soft beginning about goals and hidden support.',
    size: 7,
    placements: [
      {
        id: 'l1-d1',
        word: 'GOAL',
        clue: 'Something you want to reach step by step.',
        direction: 'down',
        row: 0,
        col: 2,
      },
      {
        id: 'l1-a1',
        word: 'ROOT',
        clue: 'The hidden base that helps growth.',
        direction: 'across',
        row: 1,
        col: 1,
      },
    ],
  },
  {
    id: 2,
    title: 'Level 2',
    intro: 'Planning and notes help you move through the day.',
    size: 7,
    placements: [
      {
        id: 'l2-d1',
        word: 'PLAN',
        clue: 'A simple structure for what you want to do.',
        direction: 'down',
        row: 0,
        col: 2,
      },
      {
        id: 'l2-a1',
        word: 'NOTE',
        clue: 'A short written reminder or idea.',
        direction: 'across',
        row: 3,
        col: 2,
      },
    ],
  },
  {
    id: 3,
    title: 'Level 3',
    intro: 'A task begins with a seed of action.',
    size: 7,
    placements: [
      {
        id: 'l3-d1',
        word: 'TASK',
        clue: 'A small piece of work to complete.',
        direction: 'down',
        row: 0,
        col: 2,
      },
      {
        id: 'l3-a1',
        word: 'SEED',
        clue: 'A tiny beginning of something bigger.',
        direction: 'across',
        row: 2,
        col: 2,
      },
    ],
  },
  {
    id: 4,
    title: 'Level 4',
    intro: 'Growth appears when movement becomes steady.',
    size: 7,
    placements: [
      {
        id: 'l4-d1',
        word: 'GROW',
        clue: 'To become stronger over time.',
        direction: 'down',
        row: 0,
        col: 2,
      },
      {
        id: 'l4-a1',
        word: 'WAVE',
        clue: 'A soft movement, like a natural rhythm.',
        direction: 'across',
        row: 3,
        col: 2,
      },
    ],
  },
  {
    id: 5,
    title: 'Level 5',
    intro: 'Learning becomes easier when you write things down.',
    size: 8,
    placements: [
      {
        id: 'l5-d1',
        word: 'LEARN',
        clue: 'To gain new understanding.',
        direction: 'down',
        row: 0,
        col: 3,
      },
      {
        id: 'l5-a1',
        word: 'NOTE',
        clue: 'A short written reminder or thought.',
        direction: 'across',
        row: 4,
        col: 3,
      },
    ],
  },
  {
    id: 6,
    title: 'Level 6',
    intro: 'Quiet attention gives shape to time.',
    size: 8,
    placements: [
      {
        id: 'l6-d1',
        word: 'QUIET',
        clue: 'A calm and peaceful state.',
        direction: 'down',
        row: 0,
        col: 3,
      },
      {
        id: 'l6-a1',
        word: 'TIME',
        clue: 'Something you manage through the day.',
        direction: 'across',
        row: 4,
        col: 3,
      },
    ],
  },
  {
    id: 7,
    title: 'Level 7',
    intro: 'Stories grow through reflection and the passing of time.',
    size: 8,
    placements: [
      {
        id: 'l7-d1',
        word: 'STORY',
        clue: 'Something the forest gnome can tell you.',
        direction: 'down',
        row: 0,
        col: 3,
      },
      {
        id: 'l7-a1',
        word: 'YEAR',
        clue: 'A long period of time.',
        direction: 'across',
        row: 4,
        col: 3,
      },
    ],
  },
  {
    id: 8,
    title: 'Level 8',
    intro: 'Levels and leaves reflect steady progress.',
    size: 9,
    placements: [
      {
        id: 'l8-d1',
        word: 'LEVEL',
        clue: 'A number that reflects your progress.',
        direction: 'down',
        row: 0,
        col: 3,
      },
      {
        id: 'l8-a1',
        word: 'LEAF',
        clue: 'A reward you collect after completing tasks.',
        direction: 'across',
        row: 0,
        col: 3,
      },
    ],
  },
  {
    id: 9,
    title: 'Level 9',
    intro: 'Patience turns a path into real progress.',
    size: 10,
    placements: [
      {
        id: 'l9-d1',
        word: 'PATIENCE',
        clue: 'The ability to keep going calmly over time.',
        direction: 'down',
        row: 0,
        col: 4,
      },
      {
        id: 'l9-a1',
        word: 'PATH',
        clue: 'A direction made one step at a time.',
        direction: 'across',
        row: 1,
        col: 3,
      },
    ],
  },
  {
    id: 10,
    title: 'Level 10',
    intro: 'The forest of progress grows from focus and steady effort.',
    size: 10,
    placements: [
      {
        id: 'l10-d1',
        word: 'FOREST',
        clue: 'A symbol of calm progress in the app.',
        direction: 'down',
        row: 0,
        col: 3,
      },
      {
        id: 'l10-a1',
        word: 'FOCUS',
        clue: 'Attention placed on one thing at a time.',
        direction: 'across',
        row: 0,
        col: 3,
      },
    ],
  },
];