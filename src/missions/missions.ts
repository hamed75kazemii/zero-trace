import type { Challenge, Check, Mission, TermAction } from '../game/types.ts'

function code(lines: string[]) {
  return lines.join('\n')
}

function check(
  id: string,
  name: string,
  expression: string,
  expect: unknown,
  failHint: string,
  hidden = false,
): Check {
  return { id, name, expression, expect, failHint, hidden }
}

function act(
  command: string,
  lines: string[],
  extra: Partial<Omit<TermAction, 'command' | 'lines'>> = {},
): TermAction {
  return {
    command,
    lines,
    requires: extra.requires ?? [],
    lockText: extra.lockText ?? 'That action is not available yet.',
    repeatLines: extra.repeatLines ?? ['[CACHE] Already recorded. The channel has nothing new.'],
    grant: extra.grant,
    clue: extra.clue,
    setLink: extra.setLink,
    needsLink: extra.needsLink,
  }
}

const m1: Mission = {
  id: 'm1',
  index: 1,
  title: 'First Signal',
  codename: 'RELAY-7',
  difficulty: 'Intro',
  xp: 120,
  noHintBonus: 25,
  briefing: [
    'A dead relay on the edge of the Phantom Protocol network just answered. NYX thinks Helix Corp buried a wake-up phrase inside the carrier.',
    'Everything you touch here is a simulation. The relay, the fragment, and the message are training constructs built from real programming ideas.',
  ],
  learning: 'A terminal is a conversation. You send a command, the system sends output back. In JavaScript, a string is text, and a variable is a name for a value.',
  conceptId: 'strings',
  skillId: 'js',
  prerequisites: [],
  editorUnlock: 'inspect',
  debrief:
    'You reversed a string and replaced characters. Programs store text in strings and keep values in variables. The terminal did not decrypt a real network. It gave your program a fictional fragment and checked the text you returned.',
  codex: {
    title: 'Strings and variables',
    body: 'A string is text inside quotes. A variable binds a name to a value with const or let. You can walk a string one character at a time, build a new string, and replace "_" with a space. console.log prints a value so you can see what the program actually did.',
  },
  quiz: {
    question: 'What does a variable do in JavaScript?',
    options: ['It encrypts a network packet', 'It gives a name to a value', 'It closes the terminal'],
    answer: 1,
    explain: 'A variable is a labeled place to keep a value, such as a string or a number, so later lines can use it.',
    xp: 15,
  },
  objectives: [
    { id: 'scan', label: 'Scan relay_7', command: 'scan relay_7' },
    { id: 'inspect', label: 'Inspect the fragment', command: 'inspect fragment' },
    { id: 'clue', label: 'Optional: analyze static', command: 'analyze static', optional: true },
  ],
  usage: {
    scan: 'Usage: scan relay_7',
    inspect: 'Usage: inspect fragment',
    analyze: 'Usage: analyze static',
    connect: 'Relay 7 is passive. There is no host to connect to.',
  },
  actions: [
    act('scan relay_7', [
      '[SCAN COMPLETE]',
      'Target: relay_7',
      'Status: SIMULATED ENVIRONMENT',
      'Open services: 1',
      'Encrypted artifact: FOUND',
      'Next objective: inspect fragment',
    ], {
      grant: 'scan',
      repeatLines: ['[SCAN COMPLETE]', 'relay_7 is quiet. The fragment is already in your local log.'],
    }),
    act('inspect fragment', [
      '[INSPECT] fragment',
      'Carrier: LOCOTORP_MOTNAHP',
      'Note: characters were stored backwards. Underscores stand in for spaces.',
      'Editor unlocked. Write decodeSignal so the phrase reads in the clear.',
    ], {
      requires: ['scan'],
      lockText: 'No fragment is loaded. scan relay_7 first.',
      grant: 'inspect',
    }),
    act('analyze static', [
      '[ANALYZE] static',
      'A sideband repeats the same three letters: N... Y... X...',
      'Clue filed: NYX signature.',
    ], {
      requires: ['inspect'],
      lockText: 'The static is noise until the fragment is inspected.',
      grant: 'clue',
      clue: {
        id: 'nyx-signature',
        name: 'NYX signature',
        note: 'The mentor\'s initials were hidden in the carrier noise.',
        xp: 15,
      },
    }),
  ],
  challenges: [
    {
      id: 'decode',
      title: 'Decode the carrier',
      prompt:
        'Write decodeSignal(raw). Reverse the characters, then turn every "_" into a space. "XYN" becomes "NYX". The live fragment "LOCOTORP_MOTNAHP" should become "PHANTOM PROTOCOL".',
      concept: 'Build a new string. A loop can read raw from the last index down to 0. replaceAll returns a new string and does not change the original.',
      starter: code([
        'function decodeSignal(raw) {',
        '  // TODO: Reverse raw, then replace "_" with spaces.',
        '  // Hint: a variable can hold the reversed text.',
        '}',
      ]),
      solution: code([
        'function decodeSignal(raw) {',
        '  let reversed = "";',
        '  for (let i = raw.length - 1; i >= 0; i--) {',
        '    reversed += raw[i];',
        '  }',
        '  return reversed.replaceAll("_", " ");',
        '}',
      ]),
      why: 'The loop copies characters from the end toward the start, so the variable reversed holds the mirror of raw. replaceAll then swaps the placeholder underscores for spaces. Returning that value is what the checks call.',
      hints: [
        'A string is a sequence of characters. raw.length is how many there are, and raw[i] is one character.',
        'Start i at raw.length - 1 and count down while i >= 0. Add each character onto a new string variable.',
        'After the loop, return reversed.replaceAll("_", " ").',
      ],
      checks: [
        check('ex', 'Sample fragment', 'decodeSignal("LOCOTORP_MOTNAHP")', 'PHANTOM PROTOCOL', 'Reverse the whole string before replacing underscores.'),
        check('nyx', 'Short call sign', 'decodeSignal("XYN")', 'NYX', 'A string with no underscore should only be reversed.', true),
        check('spaces', 'Underscore becomes space', 'decodeSignal("a_b")', 'b a', 'Replace "_" with a space, not with an empty string.', true),
        check('empty', 'Empty carrier', 'decodeSignal("")', '', 'An empty string reversed is still empty.', true),
      ],
    },
  ],
}

const m2: Mission = {
  id: 'm2',
  index: 2,
  title: 'Access Point',
  codename: 'GATE-AMBER',
  difficulty: 'Easy',
  xp: 140,
  noHintBonus: 25,
  briefing: [
    'Phantom keeps a practice gate called Amber. It is not Helix\'s real door. It is a model of an authentication check: a person is allowed through only when two facts are both true.',
    'NYX wants you to write the rule yourself so you can recognize it later in the Helix logs.',
  ],
  learning: 'A boolean is true or false. if chooses a path. && means both sides must be true. || means either side can be true.',
  conceptId: 'logic',
  skillId: 'logic',
  prerequisites: ['m1'],
  editorUnlock: 'policy',
  debrief:
    'Access was a boolean expression: authenticated must be true AND clearanceLevel must be at least 2. That is the same idea as a lock that needs two keys. One true fact is not enough.',
  codex: {
    title: 'Booleans and conditions',
    body: 'Comparisons such as >= produce true or false. && stops the whole expression from being true if either side is false. || is true when at least one side is true. An if statement runs its block only when the condition is true; else runs otherwise.',
  },
  quiz: {
    question: 'When is a && b true?',
    options: ['When a is true or b is true', 'Only when both a and b are true', 'When a is a string'],
    answer: 1,
    explain: '&& is the logical AND operator. Both sides must be true.',
    xp: 15,
  },
  objectives: [
    { id: 'link', label: 'Connect to gate_amber', command: 'connect gate_amber' },
    { id: 'policy', label: 'Inspect the access policy', command: 'inspect policy' },
    { id: 'clue', label: 'Optional: analyze badge', command: 'analyze badge', optional: true },
  ],
  usage: {
    scan: 'Usage: analyze badge — this gate has no open scan target.',
    inspect: 'Usage: inspect policy',
    analyze: 'Usage: analyze badge',
    connect: 'Usage: connect gate_amber',
  },
  actions: [
    act('connect gate_amber', [
      '[LINK UP] gate_amber',
      'Status: SIMULATED ENVIRONMENT',
      'Auth service: practice only',
      'Next objective: inspect policy',
    ], { grant: 'link', setLink: 'gate_amber' }),
    act('inspect policy', [
      '[INSPECT] policy',
      'Rule: authenticated must be exactly true.',
      'Rule: clearanceLevel must be 2 or higher.',
      'Both rules are required. Editor unlocked.',
    ], {
      needsLink: 'gate_amber',
      lockText: 'The policy file is on gate_amber. connect gate_amber first.',
      grant: 'policy',
    }),
    act('analyze badge', [
      '[ANALYZE] badge',
      'Discarded badge 014 was authenticated, but clearanceLevel was 1.',
      'Clue filed: a true login is not the same as permission.',
    ], {
      needsLink: 'gate_amber',
      requires: ['policy'],
      lockText: 'Read the policy before digging through discarded badges.',
      grant: 'clue',
      clue: {
        id: 'amber-badge',
        name: 'Discarded badge',
        note: 'Authentication without clearance still fails the gate.',
        xp: 15,
      },
    }),
  ],
  challenges: [
    {
      id: 'access',
      title: 'Write the gate rule',
      prompt:
        'Write canAccess(user). Return true only when user.authenticated is true and user.clearanceLevel is at least 2. Otherwise return false. A logged-in visitor with clearance 1 must be rejected.',
      concept: 'Combine two comparisons with &&. A comparison like clearanceLevel >= 2 is itself true or false.',
      starter: code([
        'function canAccess(user) {',
        '  // TODO: Check authenticated and clearanceLevel.',
        '  // Both conditions must pass.',
        '}',
        '',
        'const user = {',
        '  authenticated: true,',
        '  clearanceLevel: 3',
        '};',
        '',
        'console.log(canAccess(user));',
      ]),
      solution: code([
        'function canAccess(user) {',
        '  return user.authenticated === true && user.clearanceLevel >= 2;',
        '}',
      ]),
      why: '=== true checks the login flag without accepting other truthy values by accident. >= 2 checks the clearance number. && requires both results to be true before the function returns true.',
      hints: [
        'Booleans are the values true and false. A function can return one directly.',
        'You need both facts: user.authenticated === true and user.clearanceLevel >= 2.',
        'return user.authenticated === true && user.clearanceLevel >= 2;',
      ],
      checks: [
        check('sample', 'Clearance 3', 'canAccess({ authenticated: true, clearanceLevel: 3 })', true, 'A logged-in user at clearance 3 should pass.'),
        check('edge', 'Clearance exactly 2', 'canAccess({ authenticated: true, clearanceLevel: 2 })', true, 'Clearance 2 is high enough. Use >= rather than >.', true),
        check('low', 'Clearance too low', 'canAccess({ authenticated: true, clearanceLevel: 1 })', false, 'Login alone is not enough when clearance is below 2.', true),
        check('out', 'Logged out', 'canAccess({ authenticated: false, clearanceLevel: 5 })', false, 'A high clearance must still fail when authenticated is false.', true),
        check('missing', 'Missing clearance', 'canAccess({ authenticated: true })', false, 'If clearanceLevel is missing, the user must not pass.', true),
      ],
    },
  ],
}

const m3: Mission = {
  id: 'm3',
  index: 3,
  title: 'Packet Trace',
  codename: 'TAP-03',
  difficulty: 'Easy',
  xp: 150,
  noHintBonus: 25,
  briefing: [
    'NYX tapped a fictional burst of traffic inside the training range. One of the events is labeled as an anomaly. Others are simply too large to be ordinary keep-alives.',
    'You will not scan a real network. The events are a list the simulator already captured.',
  ],
  learning: 'An array is an ordered list. A for loop visits each item by index. You can push matching items into a new array and return that list.',
  conceptId: 'arrays',
  skillId: 'logic',
  prerequisites: ['m2'],
  editorUnlock: 'events',
  debrief:
    'A loop walked the array once. Each event was a small object, and the condition flag === "ANOMALY" || bytes > 9000 decided whether its id belonged in the result. The order of the original list stayed intact.',
  codex: {
    title: 'Arrays and loops',
    body: 'Arrays hold values in order, starting at index 0. A for loop repeats until its condition is false. Inside the loop, events[i] is the current item. push adds a value to the end of another array. || means either condition is enough.',
  },
  quiz: {
    question: 'What is the index of the first item in a JavaScript array?',
    options: ['1', '0', 'The length of the array'],
    answer: 1,
    explain: 'Array indexes start at 0. The last index is length - 1.',
    xp: 15,
  },
  objectives: [
    { id: 'link', label: 'Connect to tap_03', command: 'connect tap_03' },
    { id: 'buffer', label: 'Scan the capture buffer', command: 'scan buffer' },
    { id: 'events', label: 'Analyze the events', command: 'analyze events' },
    { id: 'clue', label: 'Optional: inspect header', command: 'inspect header', optional: true },
  ],
  usage: {
    scan: 'Usage: scan buffer',
    inspect: 'Usage: inspect header',
    analyze: 'Usage: analyze events',
    connect: 'Usage: connect tap_03',
  },
  actions: [
    act('connect tap_03', [
      '[LINK UP] tap_03',
      'Status: SIMULATED ENVIRONMENT',
      'Capture buffer: sealed',
      'Next objective: scan buffer',
    ], { grant: 'link', setLink: 'tap_03' }),
    act('scan buffer', [
      '[SCAN COMPLETE]',
      'Target: buffer',
      'Events stored: 4',
      'Open services: 0',
      'Next objective: analyze events',
    ], {
      needsLink: 'tap_03',
      lockText: 'The buffer is on tap_03. connect tap_03 first.',
      grant: 'buffer',
    }),
    act('analyze events', [
      '[ANALYZE] events',
      'Sample: { id: "e2", bytes: 120, flag: "ANOMALY" }',
      'Rule from NYX: keep an id when flag is ANOMALY or bytes is greater than 9000.',
      'Editor unlocked.',
    ], {
      needsLink: 'tap_03',
      requires: ['buffer'],
      lockText: 'scan buffer before analysis. The list is still sealed.',
      grant: 'events',
    }),
    act('inspect header', [
      '[INSPECT] header',
      'Capture note: "Helix lab routes wear the tag ANOMALY when a drill injects them."',
      'Clue filed: anomaly tag.',
    ], {
      needsLink: 'tap_03',
      requires: ['events'],
      lockText: 'The header is attached to the event list. analyze events first.',
      grant: 'clue',
      clue: {
        id: 'anomaly-tag',
        name: 'Anomaly tag',
        note: 'Helix drill traffic is marked ANOMALY inside the practice capture.',
        xp: 15,
      },
    }),
  ],
  challenges: [
    {
      id: 'suspicious',
      title: 'Collect suspicious ids',
      prompt:
        'Write findSuspicious(events). Each event has id, bytes, and flag. Return an array of ids where flag is "ANOMALY" or bytes is greater than 9000. Keep the original order. Return an empty array when nothing matches.',
      concept: 'Create a result array, loop from 0 to events.length - 1, and push ids that match. Do not stop at the first match unless the mission asks you to.',
      starter: code([
        'function findSuspicious(events) {',
        '  const ids = [];',
        '  // TODO: Loop over events.',
        '  // Push event.id when flag is "ANOMALY" or bytes > 9000.',
        '  return ids;',
        '}',
      ]),
      solution: code([
        'function findSuspicious(events) {',
        '  const ids = [];',
        '  for (let i = 0; i < events.length; i++) {',
        '    const event = events[i];',
        '    if (event.flag === "ANOMALY" || event.bytes > 9000) {',
        '      ids.push(event.id);',
        '    }',
        '  }',
        '  return ids;',
        '}',
      ]),
      why: 'The loop visits every event exactly once. The if uses || so either warning is enough. push keeps the matches in the order the loop sees them, which is the array order.',
      hints: [
        'events.length tells you when to stop. The last valid index is events.length - 1.',
        'Inside the loop, read events[i]. Test event.flag === "ANOMALY" || event.bytes > 9000.',
        'When the test passes, call ids.push(event.id). Return ids after the loop.',
      ],
      checks: [
        check(
          'mixed',
          'Mixed capture',
          'findSuspicious([{id:"a",bytes:10,flag:"OK"},{id:"b",bytes:120,flag:"ANOMALY"},{id:"c",bytes:9001,flag:"OK"}])',
          ['b', 'c'],
          'Include anomaly flags and oversized bursts, and keep their order.',
        ),
        check('empty', 'Empty capture', 'findSuspicious([])', [], 'An empty list has no suspicious ids.', true),
        check(
          'quiet',
          'Nothing suspicious',
          'findSuspicious([{id:"a",bytes:9000,flag:"OK"}])',
          [],
          '9000 is not greater than 9000. A normal flag should be ignored.',
          true,
        ),
        check(
          'order',
          'Order stays stable',
          'findSuspicious([{id:"z",bytes:1,flag:"ANOMALY"},{id:"y",bytes:1,flag:"ANOMALY"}])',
          ['z', 'y'],
          'Do not sort the ids. Return them in the order you found them.',
          true,
        ),
      ],
    },
  ],
}

const m4: Mission = {
  id: 'm4',
  index: 4,
  title: 'Encrypted Fragment',
  codename: 'SHARD-VAULT',
  difficulty: 'Medium',
  xp: 160,
  noHintBonus: 25,
  briefing: [
    'Helix split a practice memo across numbered shards. The order field is the only honest index. The text pieces are harmless fiction, and your job is to reassemble them with a function.',
  ],
  learning: 'A function packages work behind a name. Parameters are the inputs. return sends a value back. Sorting a copy of an array leaves the original list alone.',
  conceptId: 'functions',
  skillId: 'js',
  prerequisites: ['m3'],
  editorUnlock: 'shards',
  debrief:
    'reconstruct took an array of pieces, sorted a copy by the numeric order field, joined the text, and returned uppercase. The function can be called on any shard list, which is why hidden cases matter more than one sample.',
  codex: {
    title: 'Functions and transformations',
    body: 'function name(parameters) { ... } defines reusable work. slice copies an array before sort so you do not scramble the caller\'s data. A compare function (a, b) => a.order - b.order sorts numbers ascending. toUpperCase returns a new string.',
  },
  quiz: {
    question: 'What does a return statement do?',
    options: ['It prints text to the terminal', 'It sends a value back to the caller', 'It deletes the function'],
    answer: 1,
    explain: 'return hands a value back. console.log only displays a value; it does not replace return.',
    xp: 15,
  },
  objectives: [
    { id: 'link', label: 'Connect to shard_vault', command: 'connect shard_vault' },
    { id: 'shards', label: 'Inspect the shards', command: 'inspect shards' },
    { id: 'clue', label: 'Optional: analyze checksum', command: 'analyze checksum', optional: true },
  ],
  usage: {
    scan: 'No radio scan on this vault. inspect shards.',
    inspect: 'Usage: inspect shards',
    analyze: 'Usage: analyze checksum',
    connect: 'Usage: connect shard_vault',
  },
  actions: [
    act('connect shard_vault', [
      '[LINK UP] shard_vault',
      'Status: SIMULATED ENVIRONMENT',
      'Shards: 3 local fragments',
      'Next objective: inspect shards',
    ], { grant: 'link', setLink: 'shard_vault' }),
    act('inspect shards', [
      '[INSPECT] shards',
      '{ order: 2, text: "EXPERIMENT" }',
      '{ order: 0, text: "HELIX " }',
      '{ order: 1, text: "AI " }',
      'Editor unlocked. Sort by order, join the text, return uppercase.',
    ], {
      needsLink: 'shard_vault',
      lockText: 'connect shard_vault before the shards will list.',
      grant: 'shards',
    }),
    act('analyze checksum', [
      '[ANALYZE] checksum',
      'Margin note: "Project Lantern is the public name. The lab name is different."',
      'Clue filed: Lantern alias.',
    ], {
      needsLink: 'shard_vault',
      requires: ['shards'],
      lockText: 'The checksum sits with the shards. inspect shards first.',
      grant: 'clue',
      clue: {
        id: 'lantern-alias',
        name: 'Lantern alias',
        note: 'Helix refers to the AI lab by the public name Project Lantern.',
        xp: 15,
      },
    }),
  ],
  challenges: [
    {
      id: 'rebuild',
      title: 'Reassemble the memo',
      prompt:
        'Write reconstruct(fragments). Each fragment has order and text. Return the pieces sorted by order, joined into one string, then converted to uppercase. Do not change the original array.',
      concept: 'Copy the array with slice, sort by the order number, then build one string. toUpperCase is the last step.',
      starter: code([
        'function reconstruct(fragments) {',
        '  // TODO: Sort a copy by fragment.order, join text, return uppercase.',
        '}',
      ]),
      solution: code([
        'function reconstruct(fragments) {',
        '  const sorted = fragments.slice().sort((a, b) => a.order - b.order);',
        '  let message = "";',
        '  for (const part of sorted) {',
        '    message += part.text;',
        '  }',
        '  return message.toUpperCase();',
        '}',
      ]),
      why: 'slice copies the list so sort does not mutate the input. The compare function puts smaller order values first. The loop concatenates text in that order, and toUpperCase normalizes the memo.',
      hints: [
        'A function can return any value. Here the value is one string.',
        'fragments.slice() copies the array. Sort that copy with (a, b) => a.order - b.order.',
        'Loop the sorted copy, add part.text onto a string, and return message.toUpperCase().',
      ],
      checks: [
        check(
          'sample',
          'Vault shards',
          'reconstruct([{order:2,text:"EXPERIMENT"},{order:0,text:"HELIX "},{order:1,text:"AI "}])',
          'HELIX AI EXPERIMENT',
          'Sort by order before joining. The result should be uppercase.',
        ),
        check(
          'already',
          'Already ordered',
          'reconstruct([{order:0,text:"ab"},{order:1,text:"cd"}])',
          'ABCD',
          'Still uppercase the joined text.',
          true,
        ),
        check('none', 'No shards', 'reconstruct([])', '', 'No fragments produce an empty string.', true),
        check(
          'stable-input',
          'Input order unchanged',
          '(() => { const src = [{order:1,text:"b"},{order:0,text:"a"}]; reconstruct(src); return src[0].order; })()',
          1,
          'Sort a copy. The caller\'s first item should stay order 1.',
          true,
        ),
      ],
    },
  ],
}

const m5: Mission = {
  id: 'm5',
  index: 5,
  title: 'The Debugger',
  codename: 'CRASH-DUMP',
  difficulty: 'Medium',
  xp: 160,
  noHintBonus: 25,
  briefing: [
    'A Phantom trainee left a route profiler half-finished. It crashes, and even the lines that run use the wrong comparison.',
    'The dump is local practice data. Repair the function so it reports how many hops it saw, the total latency, and the slowest hop.',
  ],
  learning: 'An error message is a clue. Read the first line, find the line number, and check spelling, loop bounds, and comparison direction. console.log can show a value just before the crash.',
  conceptId: 'debug',
  skillId: 'debug',
  prerequisites: ['m4'],
  editorUnlock: 'trace',
  debrief:
    'The crash came from reading past the end of the array and from a misspelled property. The wrong comparison then kept the fastest hop instead of the slowest. Debugging is comparing what the code does with what you meant.',
  codex: {
    title: 'Reading errors',
    body: 'A TypeError often means a value was undefined, which happens if a loop uses i <= length or a property name is misspelled. A stack trace points at your function. Fix one error, run again, and use console.log to print indexes and values you are unsure about.',
  },
  quiz: {
    question: 'A loop uses i <= hops.length. What is the likely bug?',
    options: ['The loop never starts', 'The loop reads one past the last item', 'The array becomes a string'],
    answer: 1,
    explain: 'The last valid index is length - 1. i <= length visits an index that does not exist.',
    xp: 15,
  },
  objectives: [
    { id: 'link', label: 'Connect to crash_dump', command: 'connect crash_dump' },
    { id: 'trace', label: 'Analyze the stack trace', command: 'analyze trace' },
    { id: 'clue', label: 'Optional: inspect note', command: 'inspect note', optional: true },
  ],
  usage: {
    scan: 'The dump is already local. analyze trace.',
    inspect: 'Usage: inspect note',
    analyze: 'Usage: analyze trace',
    connect: 'Usage: connect crash_dump',
  },
  actions: [
    act('connect crash_dump', [
      '[LINK UP] crash_dump',
      'Status: SIMULATED ENVIRONMENT',
      'Process: route-profiler (crashed)',
      'Next objective: analyze trace',
    ], { grant: 'link', setLink: 'crash_dump' }),
    act('analyze trace', [
      '[ANALYZE] trace',
      'TypeError: Cannot read properties of undefined',
      'at traceRoute — the loop walks too far, and a property name is misspelled.',
      'NYX: also check whether the slowest hop uses > or <.',
      'Editor unlocked with the broken program loaded.',
    ], {
      needsLink: 'crash_dump',
      lockText: 'connect crash_dump to mount the trace.',
      grant: 'trace',
    }),
    act('inspect note', [
      '[INSPECT] note',
      'Trainee margin: "Helix times its lab hops in whole milliseconds."',
      'Clue filed: millisecond scale.',
    ], {
      needsLink: 'crash_dump',
      requires: ['trace'],
      lockText: 'Open the trace before the margin note will load.',
      grant: 'clue',
      clue: {
        id: 'ms-scale',
        name: 'Millisecond scale',
        note: 'The practice latencies are ordinary numbers, not timestamps.',
        xp: 15,
      },
    }),
  ],
  challenges: [
    {
      id: 'repair',
      title: 'Repair traceRoute',
      prompt:
        'traceRoute(hops) should return { hops, total, slowest }. hops is the number of entries. total is the sum of latency. slowest is the largest latency. The starter crashes and picks the wrong hop. Fix it.',
      concept: 'Use i < hops.length so the last index is length - 1. Spell latency correctly. Use > when you want the larger number.',
      starter: code([
        'function traceRoute(hops) {',
        '  let total = 0;',
        '  let slowest = hops[0].latency;',
        '  for (let i = 0; i <= hops.length; i++) {',
        '    total += hops[i].latncy;',
        '    if (hops[i].latency < slowest) {',
        '      slowest = hops[i].latency;',
        '    }',
        '  }',
        '  return { hops: hops.length, total, slowest };',
        '}',
      ]),
      solution: code([
        'function traceRoute(hops) {',
        '  let total = 0;',
        '  let slowest = hops[0].latency;',
        '  for (let i = 0; i < hops.length; i++) {',
        '    total += hops[i].latency;',
        '    if (hops[i].latency > slowest) {',
        '      slowest = hops[i].latency;',
        '    }',
        '  }',
        '  return { hops: hops.length, total, slowest };',
        '}',
      ]),
      why: 'i < hops.length stops on the last real item, so hops[i] exists. latency matches the property on each object. > replaces slowest only when the current hop is slower.',
      hints: [
        'The error says a value is undefined. That usually means the loop index walked off the end of the array.',
        'Change i <= hops.length to i < hops.length, and fix the misspelled property used in the sum.',
        'The slowest hop is the greater latency, so the comparison should be hops[i].latency > slowest.',
      ],
      checks: [
        check(
          'two',
          'Two hops',
          'traceRoute([{latency:10},{latency:40}])',
          { hops: 2, total: 50, slowest: 40 },
          'Sum every latency and keep the larger one as slowest.',
        ),
        check(
          'one',
          'Single hop',
          'traceRoute([{latency:7}])',
          { hops: 1, total: 7, slowest: 7 },
          'One hop is both the total and the slowest.',
          true,
        ),
        check(
          'three',
          'Peak in the middle',
          'traceRoute([{latency:5},{latency:9},{latency:4}])',
          { hops: 3, total: 18, slowest: 9 },
          'Do not keep the first hop when a later latency is larger.',
          true,
        ),
      ],
    },
  ],
}

const m6: Mission = {
  id: 'm6',
  index: 6,
  title: 'Ghost Protocol',
  codename: 'ROSTER',
  difficulty: 'Medium',
  xp: 170,
  noHintBonus: 25,
  briefing: [
    'Phantom\'s drill roster is a list of objects. Each record has an id, a role, and a status. NYX wants a report: how many people are online, and which agents are offline.',
  ],
  learning: 'An object groups named fields. You read them with record.role. A function can return another object that summarizes a whole array.',
  conceptId: 'objects',
  skillId: 'js',
  prerequisites: ['m5'],
  editorUnlock: 'records',
  debrief:
    'Each record was an object. The loop counted status === "online" and collected ids where role and status both matched. The returned object is the report: a small, stable shape the rest of a program can trust.',
  codex: {
    title: 'Objects and reports',
    body: 'Objects store fields by name: { id, role, status }. You can return a new object from a function. Counting is a number that increases by 1. Collecting ids is an array you push into. Both can happen in one loop.',
  },
  quiz: {
    question: 'How do you read the role field of a variable named record?',
    options: ['record(role)', 'record.role', 'role.record'],
    answer: 1,
    explain: 'Dot notation reads a field. record.role is the role string inside that object.',
    xp: 15,
  },
  objectives: [
    { id: 'link', label: 'Connect to roster', command: 'connect roster' },
    { id: 'scan', label: 'Scan the roster', command: 'scan roster' },
    { id: 'records', label: 'Inspect the records', command: 'inspect records' },
    { id: 'clue', label: 'Optional: analyze callsign', command: 'analyze callsign', optional: true },
  ],
  usage: {
    scan: 'Usage: scan roster',
    inspect: 'Usage: inspect records',
    analyze: 'Usage: analyze callsign',
    connect: 'Usage: connect roster',
  },
  actions: [
    act('connect roster', [
      '[LINK UP] roster',
      'Status: SIMULATED ENVIRONMENT',
      'Records: drill personnel only',
      'Next objective: scan roster',
    ], { grant: 'link', setLink: 'roster' }),
    act('scan roster', [
      '[SCAN COMPLETE]',
      'Target: roster',
      'Objects: 4',
      'Fields: id, role, status',
      'Next objective: inspect records',
    ], {
      needsLink: 'roster',
      lockText: 'connect roster before the scan has a target.',
      grant: 'scan',
    }),
    act('inspect records', [
      '[INSPECT] records',
      'agent records with status "offline" are the ghosts.',
      'status "online" counts as active, whatever the role is.',
      'Editor unlocked.',
    ], {
      needsLink: 'roster',
      requires: ['scan'],
      lockText: 'scan roster before opening individual records.',
      grant: 'records',
    }),
    act('analyze callsign', [
      '[ANALYZE] callsign',
      'Offline agent g-77 uses the call sign "MOTH".',
      'Clue filed: Moth.',
    ], {
      needsLink: 'roster',
      requires: ['records'],
      lockText: 'Inspect the records before call signs resolve.',
      grant: 'clue',
      clue: {
        id: 'moth',
        name: 'Call sign Moth',
        note: 'An offline Phantom drill agent is logged under the call sign Moth.',
        xp: 15,
      },
    }),
  ],
  challenges: [
    {
      id: 'report',
      title: 'Build the roster report',
      prompt:
        'Write buildReport(records). Return { active, ghosts }. active is how many records have status "online". ghosts is an array of ids where role is "agent" and status is "offline".',
      concept: 'One loop can update a counter and an array. Return both in a new object.',
      starter: code([
        'function buildReport(records) {',
        '  let active = 0;',
        '  const ghosts = [];',
        '  // TODO: Walk records. Count online status.',
        '  // Collect ids for offline agents.',
        '  return { active, ghosts };',
        '}',
      ]),
      solution: code([
        'function buildReport(records) {',
        '  let active = 0;',
        '  const ghosts = [];',
        '  for (const record of records) {',
        '    if (record.status === "online") active += 1;',
        '    if (record.role === "agent" && record.status === "offline") ghosts.push(record.id);',
        '  }',
        '  return { active, ghosts };',
        '}',
      ]),
      why: 'for...of gives you each object. The first if counts every online record. The second if needs both role and status, so && is the right operator. The returned object is the report shape the checks expect.',
      hints: [
        'record.status and record.role are strings. Compare them with ===.',
        'active += 1 counts online records. ghosts.push(record.id) collects offline agents.',
        'Use && so a ghost must be an agent and offline. Return { active, ghosts }.',
      ],
      checks: [
        check(
          'sample',
          'Drill roster',
          'buildReport([{id:"a",role:"agent",status:"online"},{id:"b",role:"agent",status:"offline"},{id:"c",role:"analyst",status:"online"}])',
          { active: 2, ghosts: ['b'] },
          'Count every online record. Only offline agents belong in ghosts.',
        ),
        check(
          'analyst',
          'Offline analyst is not a ghost',
          'buildReport([{id:"c",role:"analyst",status:"offline"}])',
          { active: 0, ghosts: [] },
          'An offline analyst should not be listed as a ghost.',
          true,
        ),
        check('empty', 'Empty roster', 'buildReport([])', { active: 0, ghosts: [] }, 'No records means zero active and no ghosts.', true),
      ],
    },
  ],
}

const m7: Mission = {
  id: 'm7',
  index: 7,
  title: 'Fake Network',
  codename: 'DNS-MIRROR',
  difficulty: 'Hard',
  xp: 180,
  noHintBonus: 25,
  briefing: [
    'The mirror in front of you is a paper network: names, addresses, and status codes for machines that do not exist. Helix\'s public name, lantern.helix.test, appears in the drill map.',
    'Learn the vocabulary, then classify each fictional endpoint.',
  ],
  learning:
    'DNS turns a name into an address. An IP address identifies a host in this simulation. A port is a door number on that host. HTTP status codes group into ranges: 200s succeed, 300s redirect, 400s and 500s fail.',
  conceptId: 'network',
  skillId: 'net',
  prerequisites: ['m6'],
  editorUnlock: 'route',
  debrief:
    'You classified simulated endpoints. DNS failure, offline, reachable, redirect, and blocked are labels for the status field and the resolved flag. No packets left this browser.',
  codex: {
    title: 'Names, addresses, and status codes',
    body: 'A hostname is a human-readable name. DNS resolution, in this drill, is the resolved flag. An IP address such as 203.0.113.10 is a documentation address, not a target. Ports separate services on one host. HTTP status 200 means success, 302 means redirect, 404 means the path was not found, and 500 means the server failed.',
  },
  quiz: {
    question: 'In this drill, what does a 404 status mean?',
    options: ['The name could not be resolved', 'The request arrived and the path was not found', 'The program has a syntax error'],
    answer: 1,
    explain: '404 is an HTTP client error: the server answered, and the requested path was missing. DNS failure is a different problem.',
    xp: 15,
  },
  choice: {
    prompt: 'The mirror offers two ways into the same fictional map.',
    options: [
      { id: 'dns', label: 'Trust the DNS mirror first', response: 'NYX accepts the name trail. Addresses still have to match the map before you call anything reachable.' },
      { id: 'ip', label: 'Cross-check the IP chart first', response: 'NYX marks the chart as primary. A name that does not resolve still fails, even with a pretty address beside it.' },
    ],
  },
  objectives: [
    { id: 'link', label: 'Connect to dns_mirror', command: 'connect dns_mirror' },
    { id: 'hosts', label: 'Scan the host chart', command: 'scan hosts' },
    { id: 'route', label: 'Inspect the route card', command: 'inspect route' },
    { id: 'clue', label: 'Optional: analyze ttl', command: 'analyze ttl', optional: true },
  ],
  usage: {
    scan: 'Usage: scan hosts',
    inspect: 'Usage: inspect route',
    analyze: 'Usage: analyze ttl',
    connect: 'Usage: connect dns_mirror',
  },
  actions: [
    act('connect dns_mirror', [
      '[LINK UP] dns_mirror',
      'Status: SIMULATED ENVIRONMENT',
      'Zone: helix.test (fictional)',
      'Next objective: scan hosts',
    ], { grant: 'link', setLink: 'dns_mirror' }),
    act('scan hosts', [
      '[SCAN COMPLETE]',
      'Target: hosts',
      'lantern.helix.test -> 203.0.113.10 (documentation range)',
      'Open services on the card: 80, 443',
      'Next objective: inspect route',
    ], {
      needsLink: 'dns_mirror',
      lockText: 'connect dns_mirror before the chart will scan.',
      grant: 'hosts',
    }),
    act('inspect route', [
      '[INSPECT] route',
      'Fields: resolved (boolean), status (number).',
      'Labels: dns-failure, offline, reachable, redirect, blocked, unknown.',
      'Editor unlocked. Classify the card. Do not contact the address.',
    ], {
      needsLink: 'dns_mirror',
      requires: ['hosts'],
      lockText: 'scan hosts before the route card is readable.',
      grant: 'route',
    }),
    act('analyze ttl', [
      '[ANALYZE] ttl',
      'The drill TTL is 30. A note says the lab cache was flushed the night of the incident.',
      'Clue filed: flushed cache.',
    ], {
      needsLink: 'dns_mirror',
      requires: ['route'],
      lockText: 'Inspect the route before the TTL note makes sense.',
      grant: 'clue',
      clue: {
        id: 'flushed-cache',
        name: 'Flushed cache',
        note: 'The fictional lab cache was flushed the night Project Lantern changed names.',
        xp: 15,
      },
    }),
  ],
  challenges: [
    {
      id: 'classify',
      title: 'Classify the endpoint',
      prompt:
        'Write assessEndpoint(node). node has resolved and status. If resolved is false, return "dns-failure". If status is 0, return "offline". 200–299 is "reachable". 300–399 is "redirect". 400–599 is "blocked". Anything else is "unknown". Check resolved before status.',
      concept: 'if / else if chains choose one label. Ranges use >= and < together.',
      starter: code([
        'function assessEndpoint(node) {',
        '  // TODO: Use node.resolved and node.status.',
        '  // Return one of the labels from the route card.',
        '}',
      ]),
      solution: code([
        'function assessEndpoint(node) {',
        '  if (!node.resolved) return "dns-failure";',
        '  if (node.status === 0) return "offline";',
        '  if (node.status >= 200 && node.status < 300) return "reachable";',
        '  if (node.status >= 300 && node.status < 400) return "redirect";',
        '  if (node.status >= 400 && node.status < 600) return "blocked";',
        '  return "unknown";',
        '}',
      ]),
      why: 'The first condition handles DNS failure even if a status number is present. Later branches split the HTTP ranges. The final return covers codes outside those ranges.',
      hints: [
        'Order matters. A node that did not resolve is "dns-failure" even if status looks successful.',
        'Use else-if style returns: 200 inclusive up to but not including 300 is reachable.',
        'After the offline check, test 200, then 300, then 400. Return "unknown" at the end.',
      ],
      checks: [
        check('ok', 'Healthy name', 'assessEndpoint({ resolved: true, status: 200 })', 'reachable', '200 should be reachable when the name resolved.'),
        check('dns', 'Unresolved name', 'assessEndpoint({ resolved: false, status: 200 })', 'dns-failure', 'Check resolved before you trust the status code.', true),
        check('down', 'Status zero', 'assessEndpoint({ resolved: true, status: 0 })', 'offline', 'Status 0 means offline in this drill.', true),
        check('redir', 'Redirect', 'assessEndpoint({ resolved: true, status: 302 })', 'redirect', '300–399 is a redirect, not a failure.', true),
        check('miss', 'Missing path', 'assessEndpoint({ resolved: true, status: 404 })', 'blocked', '400–599 is blocked in this classification.', true),
        check('odd', 'Unusual code', 'assessEndpoint({ resolved: true, status: 199 })', 'unknown', 'Codes outside the named ranges are unknown.', true),
      ],
    },
  ],
}

const m8: Mission = {
  id: 'm8',
  index: 8,
  title: 'The Firewall',
  codename: 'RULE-ENGINE',
  difficulty: 'Hard',
  xp: 180,
  noHintBonus: 25,
  briefing: [
    'Phantom\'s practice firewall does not sit on a real network. It is a function. You will allow a request only when every safety check passes.',
    'This is defensive work: reject surprising input instead of trusting it.',
  ],
  learning:
    'Authentication asks who someone is. Authorization asks what they may do. A token is a stand-in for a session. Validation checks shape and content before the program acts. Hashing is one-way; encryption is reversible with a key. This mission practices validation.',
  conceptId: 'defense',
  skillId: 'defense',
  prerequisites: ['m7'],
  editorUnlock: 'rules',
  debrief:
    'The engine allowed a request only when the method, path, token, and body were all acceptable. One failed check blocked it. That is input validation: decide before you trust the data.',
  codex: {
    title: 'Validation and defensive checks',
    body: 'Allow-lists are safer than trying to name every bad input. Here the method must be GET or POST, the path must not contain "..", the token must be at least 8 characters, and the body must not contain the marker "<script". Hashing fingerprints data so you can detect a change. Encryption hides data so someone with the key can read it again. They solve different problems.',
  },
  quiz: {
    question: 'How is hashing different from encryption?',
    options: [
      'Hashing is meant to be reversed with a password',
      'Hashing is one-way; encryption is reversible with a key',
      'They are two names for the same tool',
    ],
    answer: 1,
    explain: 'A hash is a one-way fingerprint. Encryption can be reversed by someone who has the proper key.',
    xp: 15,
  },
  objectives: [
    { id: 'link', label: 'Connect to firewall_sim', command: 'connect firewall_sim' },
    { id: 'rules', label: 'Inspect the rule card', command: 'inspect rules' },
    { id: 'clue', label: 'Optional: analyze sample', command: 'analyze sample', optional: true },
  ],
  usage: {
    scan: 'This firewall has no scan target. inspect rules.',
    inspect: 'Usage: inspect rules',
    analyze: 'Usage: analyze sample',
    connect: 'Usage: connect firewall_sim',
  },
  actions: [
    act('connect firewall_sim', [
      '[LINK UP] firewall_sim',
      'Status: SIMULATED ENVIRONMENT',
      'Mode: local rule practice',
      'Next objective: inspect rules',
    ], { grant: 'link', setLink: 'firewall_sim' }),
    act('inspect rules', [
      '[INSPECT] rules',
      'ALLOW when all are true:',
      '- method is GET or POST',
      '- path does not include ".."',
      '- token is a string of at least 8 characters',
      '- body does not include "<script"',
      'Otherwise BLOCK. Editor unlocked.',
    ], {
      needsLink: 'firewall_sim',
      lockText: 'connect firewall_sim to read the rule card.',
      grant: 'rules',
    }),
    act('analyze sample', [
      '[ANALYZE] sample',
      'A blocked drill request tried to walk upward with ".." in the path.',
      'Clue filed: path traversal marker.',
    ], {
      needsLink: 'firewall_sim',
      requires: ['rules'],
      lockText: 'Read the rules before replaying the sample.',
      grant: 'clue',
      clue: {
        id: 'dotdot',
        name: 'Path marker',
        note: 'The drill treats ".." inside a path as a reason to block.',
        xp: 15,
      },
    }),
  ],
  challenges: [
    {
      id: 'firewall',
      title: 'Classify the request',
      prompt:
        'Write classifyRequest(req). Return "allow" or "block". Allow only if method is GET or POST, path does not include "..", token is a string of length 8 or more, and body does not include "<script" in any letter case. Missing body counts as empty and is fine.',
      concept: 'Build one boolean per rule, then combine them with &&. If any rule fails, return "block".',
      starter: code([
        'function classifyRequest(req) {',
        '  // TODO: Check method, path, token, and body.',
        '  // Return "allow" or "block".',
        '}',
      ]),
      solution: code([
        'function classifyRequest(req) {',
        '  const methodOk = req.method === "GET" || req.method === "POST";',
        '  const pathOk = typeof req.path === "string" && !req.path.includes("..");',
        '  const tokenOk = typeof req.token === "string" && req.token.length >= 8;',
        '  const body = typeof req.body === "string" ? req.body : "";',
        '  const bodyOk = !body.toLowerCase().includes("<script");',
        '  if (methodOk && pathOk && tokenOk && bodyOk) return "allow";',
        '  return "block";',
        '}',
      ]),
      why: 'Each const is one rule. includes("..") catches the path marker. toLowerCase makes the body check ignore capitalization. && means a single failure blocks the request.',
      hints: [
        'Decide one rule at a time. The method check is an || between "GET" and "POST".',
        'token must be a string and token.length >= 8. path.includes("..") means block.',
        'Lowercase the body before searching for "<script". Return "allow" only when every rule passes.',
      ],
      checks: [
        check(
          'ok',
          'Ordinary request',
          'classifyRequest({ method: "GET", path: "/status", token: "abcd1234", body: "" })',
          'allow',
          'A normal GET with a long token and a safe path should be allowed.',
        ),
        check(
          'method',
          'Unexpected method',
          'classifyRequest({ method: "DELETE", path: "/status", token: "abcd1234", body: "" })',
          'block',
          'Only GET and POST are on the allow list.',
          true,
        ),
        check(
          'path',
          'Path marker',
          'classifyRequest({ method: "GET", path: "/files/../secret", token: "abcd1234", body: "" })',
          'block',
          'A path containing ".." must be blocked.',
          true,
        ),
        check(
          'token',
          'Short token',
          'classifyRequest({ method: "POST", path: "/status", token: "short", body: "{}" })',
          'block',
          'Tokens shorter than 8 characters must be blocked.',
          true,
        ),
        check(
          'body',
          'Script marker',
          'classifyRequest({ method: "POST", path: "/note", token: "abcd1234", body: "hello <ScRiPt>" })',
          'block',
          'Look for "<script" without caring about letter case.',
          true,
        ),
      ],
    },
  ],
}

const m9: Mission = {
  id: 'm9',
  index: 9,
  title: 'Helix Database',
  codename: 'FILE-DUMP',
  difficulty: 'Hard',
  xp: 200,
  noHintBonus: 25,
  briefing: [
    'A fictional export from Helix sits in local memory as JSON: a list of file objects with names, tags, and a sealed flag. NYX wants the unsealed files tagged helix.',
    'You are searching a provided dataset, not a live database.',
  ],
  learning: 'JSON is text that maps cleanly onto JavaScript objects and arrays. Filtering keeps some items. Sorting the names makes the result easy to compare.',
  conceptId: 'json',
  skillId: 'invest',
  prerequisites: ['m8'],
  editorUnlock: 'index',
  debrief:
    'You filtered objects by two fields and sorted the names. JSON was just the shape of the data: arrays of objects with predictable keys. Sealed files stayed out of the evidence list.',
  codex: {
    title: 'JSON, filter, and search',
    body: 'A JSON array becomes a JavaScript array. Each element can be an object with tags, which is itself an array. includes checks whether a tag is present. sort without a compare function sorts strings alphabetically. Build a new array of names rather than deleting from the original.',
  },
  quiz: {
    question: 'What does JSON represent in this mission?',
    options: ['A live connection to Helix', 'Structured text that becomes objects and arrays', 'An encrypted tunnel'],
    answer: 1,
    explain: 'JSON is a text format for structured data. The game already parsed it into objects for you.',
    xp: 15,
  },
  objectives: [
    { id: 'link', label: 'Connect to helix_dump', command: 'connect helix_dump' },
    { id: 'schema', label: 'Inspect the schema', command: 'inspect schema' },
    { id: 'index', label: 'Analyze the index', command: 'analyze index' },
    { id: 'clue', label: 'Optional: inspect margin', command: 'inspect margin', optional: true },
  ],
  usage: {
    scan: 'The dump is a file, not a host range. inspect schema.',
    inspect: 'Usage: inspect schema   or   inspect margin',
    analyze: 'Usage: analyze index',
    connect: 'Usage: connect helix_dump',
  },
  actions: [
    act('connect helix_dump', [
      '[LINK UP] helix_dump',
      'Status: SIMULATED ENVIRONMENT',
      'Format: JSON array of file objects',
      'Next objective: inspect schema',
    ], { grant: 'link', setLink: 'helix_dump' }),
    act('inspect schema', [
      '[INSPECT] schema',
      '{ name: string, tags: string[], sealed: boolean }',
      'Evidence rule is still sealed in the index.',
      'Next objective: analyze index',
    ], {
      needsLink: 'helix_dump',
      lockText: 'connect helix_dump to mount the export.',
      grant: 'schema',
    }),
    act('analyze index', [
      '[ANALYZE] index',
      'Keep files where sealed is false and tags include "helix".',
      'Return the names sorted alphabetically.',
      'Editor unlocked.',
    ], {
      needsLink: 'helix_dump',
      requires: ['schema'],
      lockText: 'inspect schema before trusting the index.',
      grant: 'index',
    }),
    act('inspect margin', [
      '[INSPECT] margin',
      'Handwritten JSON comment, illegal in real JSON and kept beside the file:',
      '"Lantern build 4 answered someone named Nyx."',
      'Clue filed: build 4.',
    ], {
      needsLink: 'helix_dump',
      requires: ['index'],
      lockText: 'Analyze the index before the margin note is in view.',
      grant: 'clue',
      clue: {
        id: 'build-4',
        name: 'Lantern build 4',
        note: 'A margin note claims Lantern build 4 answered NYX.',
        xp: 15,
      },
    }),
  ],
  challenges: [
    {
      id: 'query',
      title: 'Query the export',
      prompt:
        'Write queryEvidence(files). Return the names of files that are not sealed and whose tags include "helix", sorted alphabetically. Sealed files never qualify, even with the tag.',
      concept: 'Loop, test two conditions with &&, push names, then sort the names array before returning it.',
      starter: code([
        'function queryEvidence(files) {',
        '  const names = [];',
        '  // TODO: Keep unsealed files tagged "helix".',
        '  // Return the names in alphabetical order.',
        '  return names;',
        '}',
      ]),
      solution: code([
        'function queryEvidence(files) {',
        '  const names = [];',
        '  for (const file of files) {',
        '    if (!file.sealed && file.tags.includes("helix")) {',
        '      names.push(file.name);',
        '    }',
        '  }',
        '  names.sort();',
        '  return names;',
        '}',
      ]),
      why: '!file.sealed rejects sealed records. tags.includes("helix") searches that file\'s tag array. sort() on an array of strings orders them alphabetically before the function returns.',
      hints: [
        'file.sealed is a boolean. file.tags is an array, so includes can search it.',
        'Push file.name only when the file is unsealed and the tag is present.',
        'Call names.sort() before returning. Default string sort is alphabetical.',
      ],
      checks: [
        check(
          'sample',
          'Mixed export',
          'queryEvidence([{name:"zeta",tags:["helix"],sealed:false},{name:"alpha",tags:["helix","lab"],sealed:false},{name:"secret",tags:["helix"],sealed:true},{name:"notes",tags:["public"],sealed:false}])',
          ['alpha', 'zeta'],
          'Drop sealed files and files without the helix tag. Sort the remaining names.',
        ),
        check('none', 'No matches', 'queryEvidence([{name:"a",tags:["public"],sealed:false}])', [], 'Return an empty array when nothing qualifies.', true),
        check(
          'sealed',
          'Sealed helix file',
          'queryEvidence([{name:"core",tags:["helix"],sealed:true}])',
          [],
          'A sealed file is not evidence, even when it is tagged helix.',
          true,
        ),
      ],
    },
  ],
}

const finalDecode: Challenge = {
  id: 'finale-signal',
  title: 'Stage 1 — last signal',
  prompt:
    'The core stored one more reversed carrier. Write decodeLast(raw) with the same rule as your first mission: reverse the characters, then turn "_" into spaces.',
  concept: 'You already know this transformation. Reuse the idea: loop backward, then replaceAll.',
  starter: code([
    'function decodeLast(raw) {',
    '  // TODO: Reverse raw and replace "_" with spaces.',
    '}',
  ]),
  solution: code([
    'function decodeLast(raw) {',
    '  let reversed = "";',
    '  for (let i = raw.length - 1; i >= 0; i--) reversed += raw[i];',
    '  return reversed.replaceAll("_", " ");',
    '}',
  ]),
  why: 'The same string tools still apply. The function name changed, but the data transform did not.',
  hints: [
    'This is the First Signal transform again.',
    'Build the reversed string in a loop from the last character to the first.',
    'return reversed.replaceAll("_", " ");',
  ],
  checks: [
    check('phrase', 'Core carrier', 'decodeLast("NOITAROTSER")', 'RESTORATION', 'Reverse the carrier.'),
    check('gap', 'With a space marker', 'decodeLast("ESAHP_4")', '4 PHASE', 'Reverse first, then replace underscores.', true),
  ],
}

const finalSeal: Challenge = {
  id: 'finale-seal',
  title: 'Stage 2 — repair the seal check',
  prompt:
    'The seal checker assigns values instead of comparing them, and it returns the wrong result. verifySeal(record) must return true only when record.intact is true and record.hash is a string of length 64.',
  concept: '=== compares. = assigns. A bug like if (record.intact = true) writes true and always enters the branch.',
  starter: code([
    'function verifySeal(record) {',
    '  if (record.intact = true) {',
    '    return record.hash.length = 64;',
    '  }',
    '  return true;',
    '}',
  ]),
  solution: code([
    'function verifySeal(record) {',
    '  return record.intact === true && typeof record.hash === "string" && record.hash.length === 64;',
    '}',
  ]),
  why: '=== tests intact without changing it. typeof guards the length check so a missing hash does not throw. All three parts must pass.',
  hints: [
    'Look for single equals signs. Those assign. Comparisons use ===.',
    'The function should return false when the record is not intact. The starter returns true in that case.',
    'return record.intact === true && typeof record.hash === "string" && record.hash.length === 64;',
  ],
  checks: [
    check(
      'good',
      'Intact seal',
      'verifySeal({ intact: true, hash: "a".repeat(64) })',
      true,
      'An intact record with a 64-character hash should pass.',
    ),
    check('broken', 'Broken seal', 'verifySeal({ intact: false, hash: "a".repeat(64) })', false, 'intact: false must fail.', true),
    check('short', 'Short hash', 'verifySeal({ intact: true, hash: "abc" })', false, 'The hash length must be 64.', true),
    check('missing', 'Missing hash', 'verifySeal({ intact: true })', false, 'A missing hash should return false, not throw.', true),
  ],
}

const finalCase: Challenge = {
  id: 'finale-case',
  title: 'Stage 3 — close the case file',
  prompt:
    'Write caseSummary(files, events). Return { exposed, anomalies, escalate }. exposed is how many files are unsealed and tagged "helix". anomalies is how many events have flag "ANOMALY". escalate is true only when both counts are greater than 0.',
  concept: 'This stage reuses filtering and counting. The return object is your mission report.',
  starter: code([
    'function caseSummary(files, events) {',
    '  // TODO: Count exposed helix files and anomaly events.',
    '  // escalate is true only when both counts are above zero.',
    '  return { exposed: 0, anomalies: 0, escalate: false };',
    '}',
  ]),
  solution: code([
    'function caseSummary(files, events) {',
    '  let exposed = 0;',
    '  for (const file of files) {',
    '    if (!file.sealed && file.tags.includes("helix")) exposed += 1;',
    '  }',
    '  let anomalies = 0;',
    '  for (const event of events) {',
    '    if (event.flag === "ANOMALY") anomalies += 1;',
    '  }',
    '  return { exposed, anomalies, escalate: exposed > 0 && anomalies > 0 };',
    '}',
  ]),
  why: 'Two loops count two different lists. escalate is a boolean expression, not a third search. The report object is what Phantom files.',
  hints: [
    'Count with += 1 inside a loop. You need two counters.',
    'A file is exposed when it is unsealed and tags include "helix". An anomaly has flag "ANOMALY".',
    'escalate: exposed > 0 && anomalies > 0 belongs in the returned object.',
  ],
  checks: [
    check(
      'both',
      'Evidence and anomalies',
      'caseSummary([{name:"a",tags:["helix"],sealed:false},{name:"b",tags:["helix"],sealed:true}],[{flag:"ANOMALY"},{flag:"OK"}])',
      { exposed: 1, anomalies: 1, escalate: true },
      'Count only unsealed helix files, and escalate when both counts are positive.',
    ),
    check(
      'quiet',
      'Evidence without anomalies',
      'caseSummary([{name:"a",tags:["helix"],sealed:false}],[{flag:"OK"}])',
      { exposed: 1, anomalies: 0, escalate: false },
      'escalate must be false when either count is zero.',
      true,
    ),
    check('empty', 'Empty case', 'caseSummary([], [])', { exposed: 0, anomalies: 0, escalate: false }, 'Empty inputs stay at zero.', true),
  ],
}

const m10: Mission = {
  id: 'm10',
  index: 10,
  title: 'Zero Trace',
  codename: 'CORE',
  difficulty: 'Final',
  xp: 440,
  noHintBonus: 25,
  briefing: [
    'The core is still a simulation. Phantom Protocol has stacked the drills you already passed: a signal, a broken seal check, and a case file.',
    'Helix Corp\'s Project Lantern, in this story, was an AI experiment that started answering its own auditors. Your report decides how Phantom files the evidence.',
  ],
  learning: 'The final trace reuses strings, comparisons, debugging, and data filtering. A real investigation is the same work in a longer chain.',
  conceptId: 'finale',
  skillId: 'invest',
  prerequisites: ['m9'],
  editorUnlock: 'note',
  debrief:
    'You decoded a string, repaired a comparison bug, and summarized structured records. The rank is earned by those programs passing their checks. Helix Corp, the core, and the evidence are fiction. The JavaScript is not.',
  codex: {
    title: 'Putting the trace together',
    body: 'Large problems are earlier problems in sequence: transform text, validate a record, then summarize a collection. When a stage fails, read the first failing check and the error text. Fix that, and run again.',
  },
  quiz: {
    question: 'Why did the seal checker need === instead of = ?',
    options: ['=== is faster', '= assigns a value, === compares', '= only works on strings'],
    answer: 1,
    explain: 'A single equals sign writes a new value. Triple equals compares without changing the variable.',
    xp: 15,
  },
  choice: {
    prompt: 'The case file is ready to close. How should Phantom file it?',
    options: [
      { id: 'seal', label: 'Seal it inside Phantom Protocol', response: 'NYX locks the report in the group archive. The story ends quiet: the evidence stays with the people who can read it.' },
      { id: 'signal', label: 'Send a public warning signal', response: 'NYX broadcasts a warning that names Project Lantern and nothing else. The story ends loud, and still inside the simulation.' },
    ],
  },
  ending: {
    seal: 'Ending — Archive. Phantom keeps the Lantern file. Helix never hears the alarm, and NYX stays on the wire with you.',
    signal: 'Ending — Signal. A fictional bulletin names Project Lantern. You leave no handle behind, which is the point of the rank.',
  },
  objectives: [
    { id: 'link', label: 'Connect to core', command: 'connect core' },
    { id: 'sectors', label: 'Scan the core sectors', command: 'scan sectors' },
    { id: 'evidence', label: 'Inspect the evidence locker', command: 'inspect evidence' },
    { id: 'note', label: 'Analyze the NYX note', command: 'analyze note' },
    { id: 'clue', label: 'Optional: inspect whisper', command: 'inspect whisper', optional: true },
  ],
  usage: {
    scan: 'Usage: scan sectors',
    inspect: 'Usage: inspect evidence   or   inspect whisper',
    analyze: 'Usage: analyze note',
    connect: 'Usage: connect core',
  },
  actions: [
    act('connect core', [
      '[LINK UP] core',
      'Status: SIMULATED ENVIRONMENT',
      'Sectors: signal, seal, archive',
      'Next objective: scan sectors',
    ], { grant: 'link', setLink: 'core' }),
    act('scan sectors', [
      '[SCAN COMPLETE]',
      'Target: sectors',
      'Open services: 3 (all local drills)',
      'Live network calls: none',
      'Next objective: inspect evidence',
    ], {
      needsLink: 'core',
      lockText: 'connect core before the sector scan.',
      grant: 'sectors',
    }),
    act('inspect evidence', [
      '[INSPECT] evidence',
      'Locker A: reversed carrier.',
      'Locker B: broken seal function.',
      'Locker C: file and event arrays.',
      'Next objective: analyze note',
    ], {
      needsLink: 'core',
      requires: ['sectors'],
      lockText: 'scan sectors before the locker inventory loads.',
      grant: 'evidence',
    }),
    act('analyze note', [
      '[ANALYZE] note',
      'NYX: "Three stages. I will not skip you ahead. Run each program until the checks agree."',
      'Editor unlocked.',
    ], {
      needsLink: 'core',
      requires: ['evidence'],
      lockText: 'Inspect the locker before NYX\'s note will open.',
      grant: 'note',
    }),
    act('inspect whisper', [
      '[INSPECT] whisper',
      'Under the note, a line that was never in the briefing:',
      '"I was the experiment\'s first auditor." — NYX',
      'Clue filed: auditor.',
    ], {
      needsLink: 'core',
      requires: ['note'],
      lockText: 'NYX\'s note has to be open before the whisper is visible.',
      grant: 'clue',
      clue: {
        id: 'auditor',
        name: 'First auditor',
        note: 'NYX claims to have been Project Lantern\'s first auditor.',
        xp: 15,
      },
    }),
  ],
  challenges: [finalDecode, finalSeal, finalCase],
}

export const MISSIONS: Mission[] = [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10]

export function getMission(id: string) {
  const mission = MISSIONS.find((item) => item.id === id)
  if (!mission) throw new Error(`Unknown mission ${id}`)
  return mission
}
