// The species sheet: one definition of a body, read by the rules, the drawing and the designer.
// Design area 13 in design/plan.md. A stand-in for the game's own data, like everything in design/.
//
// A sheet is a flat list of choices. Each choice is one of two kinds:
//   rule   it means something in play and costs budget
//   look   it changes only how the creature looks, and is free
// What is never chosen (lightness between parts that touch, where the eyes sit, shadows, gait) is worked
// out in toKit(), which turns a sheet into the row the paper kit draws.
//
// The rules of fit (design/plan.md, area 13): every rule choice names the kit entries that draw it, in `draws`;
// every kit entry is named by some choice here; nothing is drawn that promises what the body cannot do.
(function (root) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const SIDES = ['smooth', 'bristles', 'slime', 'spikes', 'shell'];
  const GROUNDS = ['none', 'grass', 'reed', 'sand', 'rock', 'mud', 'litter'];
  const SWATCHES = ['#e67c5c', '#e9a0b4', '#f26a3d', '#ffc857', '#ffe98a', '#b9d977', '#6cc5c1', '#5b9be6', '#7c6bd6', '#b9aef0', '#f4f1de', '#c9b08a', '#8a6a52', '#6b2d4e', '#3a3640', '#2f6fde', '#2ec4b6', '#ff6b9d', '#d98a3a', '#9aa574', '#7fb8c9', '#e8b4a0', '#a7c957', '#bc4749'];

  // id, kind, group, type, then: options | [min, max], def, src (section of design/body.md), does, shows, draws, lab
  const F = (id, kind, group, type, spec) => Object.assign({ id, kind, group, type }, spec);
  const FIELDS = [
    // ---- the body ----
    F('plan', 'rule', 'Body', 'pick', { options: ['front', 'round'], def: 'front', src: 3, does: 'Whether there is a rear to attack and a way to face', shows: 'A body with a head end, or a bell with arms all round', draws: ['PLAN.front', 'PLAN.round'] }),
    F('length', 'rule', 'Body', 'num', { range: [0, 1], def: 0.27, src: 3, does: 'Long bodies are fast and turn slowly', shows: 'The length of the outline', draws: ['BODY.shape'], lab: 'shape' }),
    F('width', 'rule', 'Body', 'num', { range: [0, 1], def: 0.75, src: 3, does: 'Room inside for organs; a wide body is slow', shows: 'The width of the outline', draws: ['BODY.shape'], lab: 'shape' }),
    F('taper', 'rule', 'Body', 'num', { range: [-0.8, 0.8], def: 0.3, src: 3, does: 'Where the weight sits: a heavy front turns slowly, a heavy rear starts slowly', shows: 'Which end of the outline is wider', draws: ['BODY.shape'] }),
    F('size', 'rule', 'Body', 'num', { range: [0.7, 1.5], def: 1, src: 4, does: 'The tempo of its whole life: small lives fast, large lives slow', shows: 'How big it is beside others', draws: ['BODY.size'], lab: 'scale' }),
    // ---- the inside: five shares of the room in the body ----
    F('gut', 'rule', 'Inside', 'num', { range: [0, 1], def: 0.2, src: 5, does: 'Lets it live on poor, bulky food', shows: 'A wide middle', draws: ['BODY.girth'], lab: 'inside' }),
    F('fat', 'rule', 'Inside', 'num', { range: [0, 1], def: 0.2, src: 5, does: 'Reserves for a winter, a famine or a sleep', shows: 'Plump all over, with blunt ends', draws: ['BODY.girth'], lab: 'inside' }),
    F('muscle', 'rule', 'Inside', 'num', { range: [0, 1], def: 0.2, src: 5, does: 'Speed off the mark, bite, carrying and digging', shows: 'Wide shoulders and haunches', draws: ['BODY.girth'], lab: 'inside' }),
    F('lungs', 'rule', 'Inside', 'num', { range: [0, 1], def: 0.2, src: 5, does: 'How long it can sprint or stay under water', shows: 'A deep chest', draws: ['BODY.girth'], lab: 'inside' }),
    F('brood', 'rule', 'Inside', 'num', { range: [0, 1], def: 0.2, src: 5, does: 'How many eggs, or how large', shows: 'Wide hips', draws: ['BODY.girth'] }),
    // ---- skin: what covers each side ----
    F('skinFront', 'rule', 'Skin', 'pick', { options: SIDES, def: 'smooth', src: 6, does: 'What can bite or cling to its front', shows: 'A ruff, a slick, a brow of spikes or a hood over the head', draws: ['CROWN.ruff', 'CROWN.slick', 'ON.slime', 'CROWN.brow', 'CROWN.hood'] }),
    F('skinFlanks', 'rule', 'Skin', 'pick', { options: SIDES, def: 'smooth', src: 6, does: 'What can bite or cling to its sides', shows: 'A fringed outline, a slick, spines standing out sideways or a rim of shell', draws: ['BODY.fur', 'ON.bristleRim', 'ON.slime', 'ON.flankSpikes', 'ON.rim'] }),
    F('skinBack', 'rule', 'Skin', 'pick', { options: SIDES, def: 'smooth', src: 6, does: 'What can bite or cling to its back', shows: 'A pelt, a slick, a row of spikes or a shell', draws: ['BACK.fur', 'ON.slime', 'BACK.spikes', 'BACK.shell', 'BACK.plates'], lab: 'shell, spikes' }),
    F('camo', 'rule', 'Skin', 'pick', { options: GROUNDS, def: 'none', src: 6, does: 'On that one ground, still or creeping, it cannot be seen except from very close', shows: 'It wears a piece of that ground on its back', draws: ['OVER.camo', 'OVER.cap'], lab: 'camo' }),
    F('falseEyes', 'rule', 'Skin', 'flag', { def: false, src: 6, does: 'A stalker thinks it is being watched', shows: 'Two eye spots on its rear', draws: ['ON.falseEyes'], lab: 'falseEyes' }),
    F('shedTail', 'rule', 'Skin', 'flag', { def: false, src: 6, does: 'Leaves its tail with whatever grabs it', shows: 'A bright tail with a ring where it breaks', draws: ['TAIL.shed'] }),
    F('ink', 'rule', 'Skin', 'flag', { def: false, src: 6, does: 'A cloud that works as cover', shows: 'A short nozzle at its rear', draws: ['ON.siphon'] }),
    // ---- senses ----
    F('eyes', 'rule', 'Senses', 'pick', { options: ['none', 'forward', 'side', 'stalk'], def: 'side', src: 8, does: 'Forward: far and narrow. Side: wide and shorter. Stalks: all round and shortest', shows: 'Close together at the front, far apart at the sides, or out on stalks', draws: ['EYES.none', 'EYES.forward', 'EYES.side', 'EYES.stalk'], lab: 'eyes' }),
    F('eyeSize', 'rule', 'Senses', 'num', { range: [0, 1], def: 0.32, src: 8, does: 'Larger eyes see farther and cost more', shows: 'The size of the eyes', draws: ['EYES.size'], lab: 'bigEyes' }),
    F('nose', 'rule', 'Senses', 'flag', { def: true, src: 8, does: 'Scent in the dark and through cover', shows: 'A dark nose on a pale muzzle', draws: ['SNOUT.nose'], lab: 'nose' }),
    F('ears', 'rule', 'Senses', 'flag', { def: true, src: 8, does: 'Hears calls from all directions', shows: 'Ears', draws: ['CROWN.ears'] }),
    F('whiskers', 'rule', 'Senses', 'flag', { def: false, src: 8, does: 'Touch, warmth, wet and dry, close by', shows: 'Feelers or barbels at its front', draws: ['CROWN.feelers', 'CROWN.barbels'] }),
    F('sideLine', 'rule', 'Senses', 'flag', { def: false, src: 8, does: 'Feels movement nearby without seeing it', shows: 'A row of dots along each flank', draws: ['ON.sideLine'], lab: 'sideLine' }),
    F('heatPits', 'rule', 'Senses', 'flag', { def: false, src: 8, does: 'Warm bodies in the dark', shows: 'Two warm-coloured pits ahead of its eyes', draws: ['SNOUT.pits'] }),
    F('ping', 'rule', 'Senses', 'flag', { def: false, src: 8, does: 'A call that shows what is near, and gives its own place away', shows: 'Two great dishes for ears', draws: ['CROWN.dishes'] }),
    F('compass', 'rule', 'Senses', 'flag', { def: false, src: 8, does: 'Knows north from south', shows: 'One bright lozenge on the crown of its head', draws: ['CROWN.gem'] }),
    // ---- movers ----
    F('mover', 'rule', 'Movers', 'pick', { options: ['legs', 'longLegs', 'wideFeet', 'fins', 'paddles', 'cilia', 'suckerFoot', 'wave'], def: 'legs', src: 9, does: 'What ground it is good on', shows: 'Paws, stilts, webbed feet, fins, paddles, a skirt of fringe, one broad foot, or a body that goes in waves', draws: ['LIMB.paw', 'LIMB.long', 'LIMB.web', 'LIMB.fin', 'LIMB.paddle', 'UNDER.skirt', 'UNDER.foot', 'BODY.wave'], lab: 'move' }),
    F('tailFin', 'rule', 'Movers', 'flag', { def: false, src: 9, does: 'Short bursts in water', shows: 'A fan of a tail', draws: ['TAIL.fan'] }),
    F('wings', 'rule', 'Movers', 'flag', { def: false, src: 'new', does: 'Short bursts over land. Proposed in area 13', shows: 'Two pairs of wings', draws: ['LIMB.wing'] }),
    // ---- weapons and grips ----
    F('mouth', 'rule', 'Weapons', 'pick', { options: ['plain', 'jaws', 'locking', 'tongue', 'beak'], def: 'plain', src: 7, does: 'Jaws bite what they can open round; locking jaws hold on; a tongue strikes from a distance; a beak cracks shells', shows: 'Tusks, crossed pincers, a coiled tongue or a hard beak', draws: ['SNOUT.jaws', 'SNOUT.pincers', 'SNOUT.tongue', 'SNOUT.beak'] }),
    F('sting', 'rule', 'Weapons', 'pick', { options: ['none', 'front', 'rear'], def: 'none', src: 7, does: 'Wounds or tires, and needs time to refill', shows: 'A lance at its front, or a barb on its tail', draws: ['SNOUT.lance', 'TAIL.sting'], lab: 'sting' }),
    F('horns', 'rule', 'Weapons', 'flag', { def: false, src: 7, does: 'Pushes others off food and tips over a shelled animal', shows: 'Horns', draws: ['CROWN.horns'] }),
    F('claws', 'rule', 'Weapons', 'flag', { def: false, src: 7, does: 'Digs burrows and buried food, and wounds', shows: 'Long pale claws on its fore feet', draws: ['LIMB.claws'] }),
    F('club', 'rule', 'Weapons', 'flag', { def: false, src: 'new', does: 'A weapon at the rear. Proposed in area 13', shows: 'A tail that ends in a club', draws: ['TAIL.club'] }),
    F('grip', 'rule', 'Weapons', 'pick', { options: ['none', 'suckers', 'hooks', 'arms'], def: 'none', src: 6, does: 'Holds on to another creature or to the world. Suckers hold smooth and wet; hooks hold bristles and stems; arms hold what they are put round', shows: 'Fore limbs that end in round pads, in hooks, or plain arms', draws: ['LIMB.sucker', 'LIMB.hook', 'LIMB.arm'] }),
    // ---- carrying, giving and signalling ----
    F('pouch', 'rule', 'Carrying', 'flag', { def: false, src: 10, does: 'Carries more food or seed, and carries young', shows: 'A pocket on its back', draws: ['ON.pouch', 'OVER.riders'] }),
    F('gland', 'rule', 'Carrying', 'flag', { def: false, src: 10, does: 'Makes food to give: dew, or milk for the young', shows: 'Pale beads along its back', draws: ['ON.dew'] }),
    F('voice', 'rule', 'Carrying', 'num', { range: [0, 1], def: 0.3, src: 10, does: 'The range and number of its calls', shows: 'Two pale sacs at its throat, once it is more than a small voice', draws: ['ON.sacs'] }),
    F('scent', 'rule', 'Carrying', 'flag', { def: false, src: 10, does: 'Marks, and how long they last', shows: 'Two ochre glands at its hips', draws: ['ON.scent'] }),
    F('glow', 'rule', 'Carrying', 'flag', { def: false, src: 10, does: 'A display that works in the dark', shows: 'A pale lantern on a stalk', draws: ['CROWN.lantern'] }),
    F('crest', 'rule', 'Carrying', 'flag', { def: false, src: 10, does: 'Puffs up to look bigger', shows: 'A crest', draws: ['CROWN.comb'] }),

    // ---- looks: free, and they mean nothing in the rules ----
    F('head', 'look', 'Head', 'pick', { options: ['round', 'wedge', 'spade', 'none'], def: 'round', shows: 'The shape of the head, or a face set on the body itself', draws: ['HEAD.round', 'HEAD.wedge', 'HEAD.spade', 'HEAD.none'] }),
    F('headSize', 'look', 'Head', 'num', { range: [0.55, 1.45], def: 1, shows: 'How big the head is for the body', draws: ['HEAD.size'] }),
    F('headLong', 'look', 'Head', 'num', { range: [0.8, 1.35], def: 1, shows: 'A short face or a long one', draws: ['HEAD.size'] }),
    F('blunt', 'look', 'Body', 'num', { range: [0, 1], def: 0.55, shows: 'Pointed ends or blunt ones', draws: ['BODY.shape'] }),
    F('rounds', 'look', 'Body', 'num', { range: [1, 12], step: 1, def: 1, shows: 'One piece, or a row of rounds', draws: ['BODY.rounds'] }),
    F('curve', 'look', 'Body', 'num', { range: [-1, 1], def: 0, shows: 'A body in rounds held straight or in an S', draws: ['BODY.rounds'] }),
    F('arms', 'look', 'Body', 'num', { range: [3, 8], step: 1, def: 5, shows: 'How many arms a body with no front has', draws: ['PLAN.round'] }),
    F('pairs', 'look', 'Limbs', 'num', { range: [1, 6], step: 1, def: 2, shows: 'How many pairs of limbs', draws: ['LIMB.pairs'] }),
    F('limbLen', 'look', 'Limbs', 'num', { range: [0.6, 1.6], def: 1, shows: 'Short limbs or long ones', draws: ['LIMB.pairs'] }),
    F('legStyle', 'look', 'Limbs', 'pick', { options: ['paws', 'pillars', 'hopper'], def: 'paws', shows: 'Legs as paws, as round feet, or with the hind pair folded to hop', draws: ['LIMB.paw', 'LIMB.pillar', 'LIMB.folded'] }),
    F('toes', 'look', 'Limbs', 'pick', { options: ['cream', 'accent'], def: 'cream', shows: 'The colour of its toes', draws: ['LIMB.pairs'] }),
    F('tail', 'look', 'Tail', 'pick', { options: ['none', 'tuft', 'whip', 'stub', 'fork', 'knob'], def: 'tuft', shows: 'The tail, where no part has already decided it', draws: ['TAIL.tuft', 'TAIL.whip', 'TAIL.stub', 'TAIL.fork', 'TAIL.knob'] }),
    F('tailLen', 'look', 'Tail', 'num', { range: [0.5, 2.2], def: 1, shows: 'How long the tail is', draws: ['TAIL.len'] }),
    F('eyeStyle', 'look', 'Face', 'pick', { options: ['plain', 'ring', 'dome', 'one'], def: 'plain', shows: 'Plain eyes, eyes in pale rings, eyes in domes, or one great eye', draws: ['EYES.plain', 'EYES.ring', 'EYES.dome', 'EYES.one'] }),
    F('eyeColour', 'look', 'Face', 'pick', { options: ['dark', 'accent'], def: 'dark', shows: 'Dark eyes, or eyes in its bright paper', draws: ['EYES.plain'] }),
    F('lids', 'look', 'Face', 'num', { range: [0, 0.6], def: 0, shows: 'Wide eyes or sleepy lids', draws: ['EYES.plain'] }),
    F('mouthStyle', 'look', 'Face', 'pick', { options: ['muzzle', 'smile', 'line', 'dot', 'none'], def: 'muzzle', shows: 'The mouth, where no weapon has already decided it', draws: ['SNOUT.muzzle', 'SNOUT.smile', 'SNOUT.line', 'SNOUT.dot', 'SNOUT.none'] }),
    F('jawStyle', 'look', 'Face', 'pick', { options: ['tusks', 'fang'], def: 'tusks', shows: 'Jaws as two tusks or as one fang', draws: ['SNOUT.jaws', 'SNOUT.fang'] }),
    F('cheeks', 'look', 'Face', 'num', { range: [0, 1.6], def: 1, shows: 'How rosy its cheeks are', draws: ['EYES.plain'] }),
    F('earStyle', 'look', 'Face', 'pick', { options: ['round', 'point'], def: 'round', shows: 'Round ears or pointed ones', draws: ['CROWN.ears'] }),
    F('touchStyle', 'look', 'Face', 'pick', { options: ['feelers', 'barbels'], def: 'feelers', shows: 'Feelers on the head or barbels at the mouth', draws: ['CROWN.feelers', 'CROWN.barbels'] }),
    F('ornament', 'look', 'Face', 'pick', { options: ['none', 'fronds', 'frill'], def: 'none', shows: 'Fronds behind the head, or a frill down the spine of a body in rounds', draws: ['CROWN.fronds', 'BACK.frill'] }),
    F('furStyle', 'look', 'Skin', 'pick', { options: ['pelt', 'fringe'], def: 'pelt', shows: 'Bristles on the back as a pelt or as rings of soft fringe', draws: ['BACK.fur', 'BACK.fringe', 'UNDER.fringe'] }),
    F('shellStyle', 'look', 'Skin', 'pick', { options: ['dome', 'bands'], def: 'dome', shows: 'A shell as one dome or as overlapping bands', draws: ['BACK.shell', 'BACK.plates'] }),
    F('pattern', 'look', 'Pattern', 'pick', { options: ['none', 'saddle', 'bib', 'bands', 'spots', 'mask'], def: 'saddle', shows: 'A patch on the back, a paler front, bands, spots or a mask over the eyes', draws: ['MARK.saddle', 'MARK.bib', 'MARK.bands', 'MARK.spots', 'MARK.mask'] }),
    F('hueBody', 'look', 'Colour', 'hue', { options: SWATCHES, def: '#e67c5c', shows: 'Its main paper. The kit sets how light each part is', draws: ['PAPERS'] }),
    F('hueSecond', 'look', 'Colour', 'hue', { options: SWATCHES, def: '#8a6a52', shows: 'The paper for its shell, bands and coverings', draws: ['PAPERS'] }),
    F('hueAccent', 'look', 'Colour', 'hue', { options: SWATCHES, def: '#ffc857', shows: 'Its bright paper, for tips, spots and signals', draws: ['PAPERS'] }),
  ];
  const BY = Object.fromEntries(FIELDS.map((f) => [f.id, f]));
  // what each choice is called on a screen
  const LABEL = { plan: 'Plan', length: 'Length', width: 'Width', taper: 'Taper', size: 'Size', gut: 'Gut', fat: 'Fat', muscle: 'Muscle', lungs: 'Lungs', brood: 'Brood', skinFront: 'Skin on its front', skinFlanks: 'Skin on its sides', skinBack: 'Skin on its back', camo: 'Camouflage', falseEyes: 'False eyes', shedTail: 'A tail that sheds', ink: 'Ink',
    eyes: 'Eyes', eyeSize: 'Eye size', nose: 'Nose', ears: 'Ears', whiskers: 'Touch', sideLine: 'Side line', heatPits: 'Heat pits', ping: 'Echo', compass: 'Compass', mover: 'Moves on', tailFin: 'Tail fin', wings: 'Wings', mouth: 'Mouth', sting: 'Sting', horns: 'Horns', claws: 'Digging claws', club: 'Club tail', grip: 'Grip',
    pouch: 'Pouch', gland: 'Gland that gives', voice: 'Voice', scent: 'Scent glands', glow: 'Glow', crest: 'Crest', head: 'Head', headSize: 'Head size', headLong: 'Face length', blunt: 'Blunt ends', rounds: 'Cut in rounds', curve: 'Curve', arms: 'Arms', pairs: 'Pairs of limbs', limbLen: 'Limb length', legStyle: 'Legs as', toes: 'Toes',
    tail: 'Tail', tailLen: 'Tail length', eyeStyle: 'Eye style', eyeColour: 'Eye colour', lids: 'Lids', mouthStyle: 'Mouth as', jawStyle: 'Jaws as', cheeks: 'Cheeks', earStyle: 'Ears as', touchStyle: 'Touch as', ornament: 'Ornament', furStyle: 'Bristles as', shellStyle: 'Shell as', pattern: 'Pattern', hueBody: 'Main paper', hueSecond: 'Second paper', hueAccent: 'Bright paper' };
  const WORD = { 'plan.front': 'front and back', 'plan.round': 'no front', 'head.none': 'none, a face on the body', longLegs: 'stilts', wideFeet: 'webbed feet', suckerFoot: 'one broad foot', wave: 'body waves', cilia: 'a skirt of cilia', locking: 'locking jaws', litter: 'leaf litter', forward: 'facing forward', side: 'on the sides', stalk: 'on stalks', none: 'none' };
  const word = (v, id) => WORD[id + '.' + v] || WORD[v] || String(v);
  // choices that do nothing as the sheet stands, and why. A choice that is idle is not offered and is not tested for being seen
  const idle = (s) => { const o = {}, round = s.plan === 'round', limbed = ['legs', 'longLegs', 'wideFeet', 'fins', 'paddles'].includes(s.mover), headless = round || s.head === 'none', set = (ids, why) => ids.forEach((id) => { if (!o[id]) o[id] = why; });
    if (round) set(['length', 'taper', 'blunt', 'rounds', 'curve', 'mover', 'tailFin', 'wings', 'pairs', 'limbLen', 'legStyle', 'toes', 'claws', 'grip', 'tail', 'tailLen', 'shedTail', 'club', 'head', 'headSize', 'headLong', 'skinFront', 'ink', 'sting', 'ornament', 'eyes', 'pouch'], 'a body with no front has no ends, limbs or tail'); else set(['arms'], 'only a body with no front has arms all round');
    if (headless) set(['headSize', 'headLong'], 'there is no separate head'); if (s.head === 'none' && !round) set(['skinFront'], 'there is no separate head to cover');
    if (!limbed) set(['pairs', 'limbLen', 'legStyle', 'toes', 'claws'], 'it has no limbs'); else if (s.mover !== 'legs') set(['legStyle', 'claws'], 'only legs take these'); if (s.mover !== 'legs' && s.mover !== 'wideFeet') set(['toes'], 'only feet have toes');
    if (s.rounds < 2 && s.mover !== 'wave') set(['curve'], 'only a body in rounds holds a curve');
    if (s.club || s.sting === 'rear' || s.tailFin) set(['tail'], 'a weapon or a fin has decided its tail'); if (s.tail === 'none' && !s.club && s.sting !== 'rear' && !s.tailFin && !s.shedTail) set(['tailLen'], 'it has no tail');
    if (s.eyes === 'none') set(['eyeSize', 'eyeStyle', 'eyeColour', 'lids'], 'it has no eyes'); else if (s.eyes === 'stalk') set(['eyeStyle'], 'eyes on stalks are drawn one way'); 
    if (s.mouth !== 'plain') set(['mouthStyle'], 'a weapon has decided its mouth'); else if (s.nose) set(['mouthStyle'], 'a nose sits on a muzzle'); if (s.mouth !== 'jaws') set(['jawStyle'], 'it has no jaws');
    if (!s.ears || s.ping) set(['earStyle'], s.ping ? 'its ears are dishes' : 'it has no ears'); if (!s.whiskers) set(['touchStyle'], 'it has no sense of touch to show');
    if (s.skinBack !== 'shell') set(['shellStyle'], 'its back has no shell'); if (s.skinBack !== 'bristles') set(['furStyle'], 'its back has no bristles');
    if (s.mover === 'wave') set(['rounds'], 'a body that goes in waves is always cut in rounds');
    return o; };
  // what it has, in a few words each: the parts a stranger should be able to read off it
  const says = (s) => { const out = [], dead = idle(s), add = (id, text) => { if (!dead[id]) out.push([id, text]); };
    for (const f of FIELDS) { if (f.kind !== 'rule') continue; const v = s[f.id]; if (f.type === 'flag') { if (v) add(f.id, LABEL[f.id].toLowerCase()); } else if (f.type === 'pick') { if (!['none', 'smooth', 'plain', 'front'].includes(v) || f.id === 'eyes') add(f.id, f.id === 'eyes' ? (v === 'none' ? 'no eyes' : 'eyes ' + word(v)) : f.id.startsWith('skin') ? v + ' on its ' + f.id.slice(4).toLowerCase() : f.id === 'mover' ? word(v) : f.id === 'camo' ? 'hidden on ' + word(v) : f.id === 'sting' ? 'a sting at the ' + v : f.id === 'mouth' ? word(v) : word(v)); } }
    const tot = s.gut + s.fat + s.muscle + s.lungs + s.brood || 1; for (const o of ['gut', 'fat', 'muscle', 'lungs', 'brood']) if (s[o] / tot > 0.32) add(o, 'a lot of ' + o); if (s.voice > 0.5) add('voice', 'a big voice'); if (s.size < 0.85) add('size', 'small'); if (s.size > 1.2) add('size', 'large'); return out; };

  // Parts the body design names that are not on the sheet, and why
  const LEFT_OUT = [
    ['spit, shock', 7, 'Untested and not yet defined'],
    ['warning colours, looking like another species', 6, 'Deferred in the body design'],
    ['a second sex, a caste, a life stage', 2, 'A form is a second sheet that differs from the base; see forms()'],
  ];

  const plain = () => Object.fromEntries(FIELDS.map((f) => [f.id, f.def]));
  // put every value inside its range; unknown keys are dropped
  const tidy = (s) => { const out = plain(); for (const f of FIELDS) { const v = s[f.id]; if (v === undefined) continue; if (f.type === 'num') { let n = clamp(+v, f.range[0], f.range[1]); if (f.step) n = Math.round(n / f.step) * f.step; out[f.id] = n; } else if (f.type === 'flag') out[f.id] = !!v; else if (f.options.includes(v)) out[f.id] = v; } return out; };
  const faults = (s) => { const bad = []; for (const f of FIELDS) { const v = s[f.id]; if (v === undefined) { bad.push(f.id + ' is missing'); continue; } if (f.type === 'num' && !(v >= f.range[0] && v <= f.range[1])) bad.push(f.id + ' is out of range'); if ((f.type === 'pick' || f.type === 'hue') && !f.options.includes(v)) bad.push(f.id + ' is not an option'); } for (const k in s) if (!BY[k] && k !== 'name') bad.push(k + ' is not on the sheet'); return bad; };
  // a sheet made by chance. `wild` reaches for the ends of every range, to stress the kit
  const random = (rnd, wild) => { const s = {}; for (const f of FIELDS) { if (f.type === 'num') { let u = rnd(); if (wild) u = u < 0.5 ? u * u * 2 : 1 - (1 - u) * (1 - u) * 2; s[f.id] = lerp(f.range[0], f.range[1], u); } else if (f.type === 'flag') s[f.id] = rnd() < (f.kind === 'rule' ? 0.22 : 0.5); else s[f.id] = f.options[Math.floor(rnd() * f.options.length)]; }
    if (rnd() < 0.55) s.rounds = 1; if (rnd() < 0.8) s.plan = 'front'; let out = tidy(s); if (wild) return out;
    // held to the budget, as a player's would be: parts are taken off by chance until it can be afforded
    const extras = FIELDS.filter((f) => f.kind === 'rule' && (f.type === 'flag' || f.type === 'pick') && !['plan', 'eyes', 'mover'].includes(f.id)); let guard = 200;
    while (cost(out) > BUDGET && guard--) { const f = extras[Math.floor(rnd() * extras.length)]; if (f.type === 'flag') out[f.id] = false; else out[f.id] = f.options.includes('none') ? 'none' : f.options.includes('smooth') ? 'smooth' : f.options[0]; if (guard < 120) out.size = Math.max(0.7, out.size - 0.05); } return tidy(out); };

  // ---- cost: placeholders, so the designer can show a budget. Numbers are for the balance pass and mean nothing yet ----
  const cost = (s) => { let c = 3 * s.size * s.size; c += { none: 0, forward: 2, side: 2, stalk: 3 }[s.eyes] + (s.eyeSize > 0.6 ? 1 : 0); for (const k of ['skinFront', 'skinFlanks', 'skinBack']) c += { smooth: 0, bristles: 0.5, slime: 0.5, spikes: 1, shell: 1.5 }[s[k]];
    for (const k of ['nose', 'whiskers', 'sideLine', 'heatPits', 'ping', 'compass', 'falseEyes', 'shedTail', 'ink', 'tailFin', 'wings', 'horns', 'claws', 'club', 'pouch', 'gland', 'scent', 'glow', 'crest']) if (s[k]) c += ({ nose: 2, wings: 2, ping: 2 })[k] || 1; if (s.ears) c += 0.5;
    c += { plain: 0, jaws: 1, locking: 2, tongue: 2, beak: 2 }[s.mouth] + (s.sting === 'none' ? 0 : 2) + (s.grip === 'none' ? 0 : 1) + (s.camo === 'none' ? 0 : 1) + s.voice + { legs: 1, longLegs: 1.5, wideFeet: 1.5, fins: 1, paddles: 1.5, cilia: 1, suckerFoot: 1, wave: 1 }[s.mover]; return Math.round(c * 10) / 10; };
  const BUDGET = 16;

  // ---- from a sheet to the row the kit draws. Everything that is never chosen is worked out here ----
  function toKit(s0) {
    const s = tidy(s0), round = s.plan === 'round', L = lerp(34, 104, s.length), W = lerp(9, 30, s.width), k = Math.pow(W / 25.6, 0.8), headless = s.head === 'none' || round;
    const tot = s.gut + s.fat + s.muscle + s.lungs + s.brood || 1, sh = (n) => s[n] / tot - 0.2;      // each organ's share, against an even split
    let segs = Math.round(s.rounds); if (s.mover === 'wave' && segs < 5) segs = 7;      // a body that goes in waves has to be cut in rounds
    const body = { L, W: W * (1 + 0.5 * Math.max(0, sh('fat'))), tap: s.taper, box: lerp(0.3, 1.25, s.blunt) + Math.max(0, sh('fat')) * 0.8,
      girth: { mid: sh('gut') * 5, sh: sh('lungs') * 5 + sh('muscle') * 2.5, hip: sh('brood') * 5 + sh('muscle') * 2.5 } };
    if (segs > 1) { body.segs = segs; body.wave = s.mover === 'wave' ? 0.24 : 0.12; body.cycles = 1; body.coil = 2.2 + segs * 0.28; body.pose = s.curve * 0.45; if (body.box > 0.6) body.box = 0.5; }
    if (round) { body.arms = Math.round(s.arms); body.W = lerp(13, 24, s.width); }
    if (s.skinFlanks === 'bristles') body.fur = true;
    const spec = { name: s0.name || 'Made', plan: round ? 'round' : undefined, scale: s.size, body, sheet: s };
    spec.pal = { body: s.hueBody, second: s.hueSecond, accent: s.hueAccent };
    // head and face. Where the eyes sit follows from the kind of eyes, never from a choice of looks
    const hs = s.headSize * clamp(Math.pow(W / 25.6, 0.7), 0.3, 1.25);
    spec.head = headless ? { kind: 'none', face: 0.88 } : { kind: s.head, size: hs, long: s.headLong };
    if (!headless && segs > 1) spec.head.reach = 9 * hs;
    if (!headless && s.skinFront === 'shell') { spec.head.under = true; spec.head.neck = 3; spec.head.reach = 8 * hs; spec.head.stiff = 0.6; }
    const size = lerp(0.14, 0.3, s.eyeSize), E = { forward: { apart: 0.3, fwd: 0.66 }, side: { apart: 0.8, fwd: 0.4 }, stalk: { kind: 'stalk', apart: 0.96, fwd: 0.5 }, none: { kind: 'none' } }[s.eyes];
    spec.eyes = Object.assign({ size, cheek: s.cheeks }, E);
    if (s.eyes === 'forward' && s.eyeStyle === 'one') { spec.eyes.kind = 'one'; spec.eyes.size = Math.max(size, 0.3) * 1.5; spec.eyes.fwd = 0.34; }
    else if (s.eyes !== 'none' && s.eyes !== 'stalk' && (s.eyeStyle === 'ring' || s.eyeStyle === 'dome')) spec.eyes.kind = s.eyeStyle;
    if (round) Object.assign(spec.eyes, { fwd: 0.3, apart: 0.62 });
    if (s.eyeColour === 'accent') { spec.eyes.iris = 'accent'; spec.eyes.bar = s.eyeStyle === 'dome'; }
    if (s.lids > 0.02) spec.eyes.heavy = s.lids;
    spec.snout = { plain: s.nose ? 'muzzle' : (s.mouthStyle === 'muzzle' ? 'smile' : s.mouthStyle), jaws: s.jawStyle === 'fang' ? 'fang' : 'jaws', locking: 'pincers', tongue: 'tongue', beak: 'beak' }[s.mouth];
    spec.nosed = s.nose; spec.pits = s.heatPits; spec.lance = s.sting === 'front'; if (s.pattern === 'mask') spec.mask = true;
    // things on the head: each is there because a sense, a weapon or a signal put it there
    const crown = [];
    if (s.ornament === 'fronds') crown.push({ kind: 'fronds' });
    if (s.skinFront === 'bristles') crown.push({ kind: 'ruff', col: 'second', r: 1.3 });
    if (s.skinFront === 'shell') crown.push({ kind: 'hood' }); if (s.skinFront === 'slime' && !headless) crown.push({ kind: 'slick' });
    if (s.ping) crown.push({ kind: 'dishes' }); else if (s.ears) crown.push({ kind: 'ears', point: s.earStyle === 'point' });
    if (s.horns) crown.push({ kind: 'horns' });
    if (s.crest) crown.push({ kind: 'comb' });
    if (s.whiskers) crown.push({ kind: s.touchStyle === 'barbels' ? 'barbels' : 'feelers', len: 17 });
    if (s.skinFront === 'spikes') crown.push({ kind: 'brow' });
    if (s.compass) crown.push({ kind: 'gem' });
    if (s.glow) crown.push({ kind: 'lantern' });
    if (crown.length) spec.crown = crown;
    // the tail: a weapon or a mover decides its end; where none does, it is a matter of looks
    const tl = s.tailLen;
    spec.tail = s.club ? { kind: 'club', len: 10 * tl * k } : s.sting === 'rear' ? { kind: 'sting', len: 15 * tl * k } : s.tailFin ? { kind: 'fan', len: 20 * tl * k } : s.tail === 'none' ? (s.shedTail ? { kind: 'whip', len: 16 * tl * k } : null) : { kind: s.tail, len: { tuft: 14, whip: 18, stub: 9, fork: 9, knob: 9 }[s.tail] * tl * k };
    if (spec.tail && s.shedTail) { spec.tail.shed = true; spec.tail.col = 'accent'; }
    if (!spec.tail) delete spec.tail;
    // limbs. Sockets are spread along the flank; pairs step in turn
    const limbs = [], n = Math.round(s.pairs), ll = s.limbLen * k, toe = s.toes === 'accent' ? 'accent' : undefined;
    const sockets = (m) => Array.from({ length: m }, (_, i) => (m === 1 ? 0.5 : lerp(0.81, 0.24, i / (m - 1))));
    const LIMBS = { legs: (u, i, m) => (s.legStyle === 'pillars' ? { kind: 'pillar', u, len: 6.6 * k * Math.sqrt(s.limbLen), inset: -2 * k } : s.legStyle === 'hopper' && i === m - 1 && m > 1 ? { kind: 'folded', u, len: 30 * ll, wd: 6.4 * k, ang: 2.2, inset: 7 * k } : { kind: 'paw', u, len: (s.legStyle === 'hopper' ? 11 : 17) * ll, wd: (s.legStyle === 'hopper' ? 4 : 6.2) * k, ang: lerp(0.95, 2.2, m === 1 ? 0.5 : i / (m - 1)), toe }), longLegs: (u, i, m) => ({ kind: 'long', u, len: 36 * ll, wd: 2.6 * Math.max(0.8, k), ang: lerp(0.6, 2.3, m === 1 ? 0.5 : i / (m - 1)), inset: 3 * k }),
      wideFeet: (u, i, m) => ({ kind: 'web', u, len: 16 * ll, wd: 9 * k, ang: lerp(0.95, 2.2, m === 1 ? 0.5 : i / (m - 1)), toe }), fins: (u, i, m) => ({ kind: 'fin', u, len: (i ? 12 : 15) * ll, wd: (i ? 5.5 : 7) * k, ang: i ? 2.25 : 1.9, inset: 2 * k }),
      paddles: (u, i, m) => ({ kind: 'paddle', u, len: 13 * ll, wd: 4.6 * k, ang: 1.5, inset: 2 * k, ph: i * 0.17 }) };
    if (!round && LIMBS[s.mover]) { const m = segs > 1 ? clamp(n, 1, segs - 1) : Math.min(n, s.mover === 'fins' ? 2 : 4); sockets(m).forEach((u, i) => { const l = LIMBS[s.mover](u, i, m); if (l.ph === undefined && i % 2) l.ph = 0.5; if (i === 0) l.front = true; limbs.push(l); }); }
    if (!round && s.claws && limbs.length && limbs[0].kind === 'paw') limbs[0].claws = true;
    if (!round && s.grip !== 'none') limbs.unshift({ kind: { suckers: 'sucker', hooks: 'hook', arms: 'arm' }[s.grip], u: 0.74, len: 25 * ll, wd: 4.6 * k, ang: 0.5, front: true, inset: 2 * k });
    if (!round && s.wings) limbs.push({ kind: 'wing', u: 0.62, len: lerp(26, 44, s.limbLen / 1.6) * k, wd: 13 * k, ang: 2.05, front: true, col: 'second' }, { kind: 'wing', u: 0.5, len: lerp(18, 30, s.limbLen / 1.6) * k, wd: 10 * k, ang: 2.6, col: 'second', spot: false });
    if (limbs.length) spec.limbs = limbs;
    if (s.mover === 'cilia') spec.under = { kind: 'skirt' }; if (s.mover === 'suckerFoot') spec.under = { kind: 'foot' };
    spec.step = s.mover === 'longLegs' ? 7 * s.limbLen : 4.7 * Math.sqrt(ll); spec.cycle = Math.round(36 * Math.pow(s.size, 0.5) * (s.mover === 'longLegs' ? 1.2 : 1) * (s.skinBack === 'shell' ? 1.25 : 1));
    // skin on the back, and things set on the body
    if (s.skinBack === 'shell') spec.back = s.shellStyle === 'bands' ? { kind: 'plates', n: clamp(Math.round(L / 13), 3, 7) } : { kind: 'shell' };
    else if (s.skinBack === 'spikes') spec.back = { kind: 'spikes', k: Math.max(1.05, W / 17) }; else if (s.skinBack === 'bristles') spec.back = { kind: s.furStyle === 'fringe' ? 'fringe' : 'fur' }; else if (s.ornament === 'frill' && segs > 1) spec.back = { kind: 'frill' };
    const on = [];
    const slick = ['skinFront', 'skinFlanks', 'skinBack'].filter((x) => s[x] === 'slime').map((x) => x.slice(4).toLowerCase()); if (slick.length) on.push({ kind: 'slime', sides: slick });
    if (s.skinFlanks === 'bristles') on.push({ kind: 'bristleRim' }); if (s.skinFlanks === 'spikes') on.push({ kind: 'flankSpikes' }); if (s.skinFlanks === 'shell') on.push({ kind: 'rim' });
    if (s.sideLine) on.push({ kind: 'sideLine' }); if (s.falseEyes) on.push({ kind: 'falseEyes' }); if (s.scent) on.push({ kind: 'scent' }); if (s.gland) on.push({ kind: 'dew' }); if (s.pouch) on.push({ kind: 'pouch' }); if (s.ink) on.push({ kind: 'siphon' }); if (s.voice > 0.5) on.push({ kind: 'sacs', size: s.voice });
    if (on.length) spec.on = on;
    if (s.camo !== 'none') spec.over = { kind: 'camo', ground: s.camo };
    if (s.pattern !== 'none' && s.pattern !== 'mask') spec.mark = s.pattern === 'saddle' ? { kind: 'saddle' } : s.pattern === 'bib' ? { kind: 'bib' } : s.pattern === 'bands' ? { kind: 'bands', at: [0.3, 0.46, 0.62], wd: Math.max(2.4, L * 0.05) } : { kind: 'spots', at: [[0.3, 0.45, 3], [0.5, -0.4, 3.6], [0.66, 0.3, 2.6]].map(([u, y, r]) => [u, y, r * k]) };
    return spec;
  }

  // ---- sheets already written. The first sixteen are the creatures of the paper study; the next twenty are the preset species of design/presets.md.
  // Each is the plain sheet and its differences. They are here to show that the sheet can say them, not as finished designs
  const KIT16 = {
    Plain: {},
    Plated: { length: 0.46, width: 0.5, taper: -0.42, skinBack: 'shell', shellStyle: 'bands', skinFront: 'shell', pairs: 3, tail: 'knob', nose: false, mouthStyle: 'dot', ears: false, pattern: 'none', headSize: 0.85, hueBody: '#e9a0b4', hueSecond: '#6b2d4e', hueAccent: '#ffc857' },
    Hunter: { length: 0.42, width: 0.45, taper: 0.4, head: 'wedge', headSize: 1.15, eyes: 'forward', eyeSize: 0.6, eyeColour: 'accent', eyeStyle: 'ring', pattern: 'mask', mouth: 'jaws', jawStyle: 'fang', tail: 'whip', tailLen: 1.9, muscle: 0.5, earStyle: 'point', hueBody: '#3a3640', hueSecond: '#7fb8c9', hueAccent: '#ffc857' },
    Long: { length: 0.83, width: 0.2, taper: -0.6, rounds: 7, mover: 'paddles', pairs: 6, whiskers: true, ears: false, nose: false, mouthStyle: 'none', headSize: 1.3, tail: 'stub', pattern: 'none', hueBody: '#7c6bd6', hueSecond: '#b9aef0', hueAccent: '#ffc857' },
    Swimmer: { length: 0.4, width: 0.5, mover: 'fins', tailFin: true, ornament: 'fronds', ears: false, nose: false, mouthStyle: 'none', pattern: 'spots', lungs: 0.5, hueBody: '#e9a0b4', hueSecond: '#ff6b9d', hueAccent: '#ff6b9d' },
    Shelled: { length: 0.25, width: 0.75, skinBack: 'shell', mover: 'paddles', pairs: 2, ears: false, nose: false, mouthStyle: 'smile', tail: 'stub', pattern: 'none', headSize: 0.8, hueBody: '#7fb8c9', hueSecond: '#8a6a52', hueAccent: '#ffc857' },
    Swarm: { size: 0.7, length: 0.02, width: 0.1, headSize: 1.45, ears: false, nose: false, mouthStyle: 'none', tail: 'fork', pattern: 'none', pairs: 1, limbLen: 0.6, cheeks: 0, hueBody: '#5b9be6', hueSecond: '#2f6fde', hueAccent: '#ff6b9d' },
    Breeder: { length: 0.36, width: 0.9, brood: 0.7, pattern: 'bands', skinFront: 'bristles', pairs: 3, ears: false, tail: 'none', hueBody: '#d98a3a', hueSecond: '#ff6b9d', hueAccent: '#f4f1de' },
    Helper: { size: 0.75, length: 0.25, width: 0.45, pattern: 'bands', mouth: 'jaws', pairs: 3, ears: false, tail: 'none', horns: true, hueBody: '#d98a3a', hueSecond: '#ff6b9d', hueAccent: '#f4f1de' },
    Puffle: { length: 0.2, width: 0.72, blunt: 1, head: 'none', skinBack: 'bristles', furStyle: 'fringe', skinFlanks: 'bristles', eyes: 'forward', eyeStyle: 'ring', eyeSize: 0.2, ears: false, nose: false, mouthStyle: 'none', tail: 'none', pattern: 'none', limbLen: 0.7, toes: 'accent', cheeks: 0, hueBody: '#3a3640', hueSecond: '#8a6a52', hueAccent: '#ffc857' },
    Flit: { length: 0.1, width: 0.4, wings: true, skinFront: 'bristles', whiskers: true, ears: false, nose: false, mouthStyle: 'none', lids: 0.4, tail: 'none', pattern: 'none', limbLen: 1.3, hueBody: '#b9aef0', hueSecond: '#f4f1de', hueAccent: '#d98a3a' },
    Ribbon: { length: 1, width: 0, rounds: 12, mover: 'wave', curve: 0.9, head: 'spade', ornament: 'frill', eyes: 'side', eyeSize: 0.4, ears: false, nose: false, mouthStyle: 'smile', tail: 'none', pattern: 'none', cheeks: 0, hueBody: '#f26a3d', hueSecond: '#f4f1de', hueAccent: '#2ec4b6' },
    Stilt: { length: 0, width: 0.3, blunt: 1, head: 'none', mover: 'longLegs', pairs: 3, eyes: 'forward', eyeStyle: 'one', eyeSize: 0.9, ears: false, nose: false, mouthStyle: 'none', tail: 'none', pattern: 'none', cheeks: 0, toes: 'accent', hueBody: '#f4f1de', hueSecond: '#8a6a52', hueAccent: '#e67c5c' },
    Lugg: { length: 0.23, width: 0.42, blunt: 0.9, camo: 'litter', grip: 'arms', legStyle: 'pillars', pairs: 1, ears: false, nose: false, mouthStyle: 'none', headSize: 0.9, tail: 'stub', pattern: 'none', hueBody: '#6cc5c1', hueSecond: '#8a6a52', hueAccent: '#ffc857' },
    Bloom: { plan: 'round', width: 0.64, arms: 5, cheeks: 1.4, nose: false, mouthStyle: 'none', hueBody: '#ffe98a', hueSecond: '#d98a3a', hueAccent: '#ff6b9d' },
    Hopper: { length: 0.26, width: 0.55, taper: 0.8, blunt: 0.9, head: 'none', legStyle: 'hopper', eyes: 'side', eyeStyle: 'dome', eyeColour: 'accent', eyeSize: 0.7, ears: false, nose: false, mouthStyle: 'line', tail: 'none', pattern: 'bib', toes: 'accent', cheeks: 0, hueBody: '#2f6fde', hueSecond: '#5b9be6', hueAccent: '#ffc857' },
    Bolster: { size: 1.5, length: 0.52, width: 1, taper: -0.5, fat: 0.5, gut: 0.4, legStyle: 'pillars', pouch: true, headSize: 0.62, cheeks: 1.6, tail: 'tuft', pattern: 'saddle', hueBody: '#bc4749', hueSecond: '#e8b4a0', hueAccent: '#6cc5c1' },
  };
  const CAST20 = {
    Nubbins: { size: 0.7, length: 0.1, width: 0.4, whiskers: true, ears: false, pairs: 3, tail: 'none', pattern: 'bands', hueBody: '#c9b08a', hueSecond: '#8a6a52', hueAccent: '#ffc857' },
    Lollops: { size: 1.45, length: 0.5, width: 0.95, gut: 0.6, brood: 0.4, skinBack: 'bristles', legStyle: 'pillars', mouthStyle: 'muzzle', headSize: 0.75, earStyle: 'round', pattern: 'none', hueBody: '#e8b4a0', hueSecond: '#c9b08a', hueAccent: '#f4f1de' },
    Frizzles: { size: 0.75, length: 0.12, width: 0.55, skinBack: 'spikes', skinFlanks: 'spikes', claws: true, tail: 'none', pattern: 'none', hueBody: '#d98a3a', hueSecond: '#8a6a52', hueAccent: '#f4f1de' },
    Glimps: { length: 0.35, width: 0.4, mover: 'fins', tailFin: true, ears: false, nose: false, mouthStyle: 'smile', gut: 0.45, pattern: 'bands', hueBody: '#6cc5c1', hueSecond: '#2ec4b6', hueAccent: '#ffe98a' },
    Scrumps: { size: 0.9, pouch: true, scent: true, tail: 'tuft', tailLen: 1.6, earStyle: 'point', pattern: 'bib', hueBody: '#8a6a52', hueSecond: '#c9b08a', hueAccent: '#ffc857' },
    Sippets: { size: 0.72, length: 0.1, width: 0.35, falseEyes: true, gland: true, mouth: 'tongue', nose: false, ears: false, whiskers: true, tail: 'none', pattern: 'none', hueBody: '#ffe98a', hueSecond: '#ff6b9d', hueAccent: '#ff6b9d' },
    Pipkins: { size: 0.8, length: 0.15, width: 0.35, mover: 'longLegs', pairs: 2, eyes: 'stalk', whiskers: true, touchStyle: 'barbels', voice: 0.8, crest: true, ears: false, nose: false, mouthStyle: 'none', tail: 'stub', pattern: 'none', hueBody: '#f4f1de', hueSecond: '#7fb8c9', hueAccent: '#e67c5c' },
    Splodges: { length: 0.3, width: 0.6, blunt: 0.9, nose: true, ears: false, gut: 0.4, tail: 'stub', pattern: 'spots', hueBody: '#9aa574', hueSecond: '#8a6a52', hueAccent: '#ffe98a' },
    Blibs: { length: 0.22, width: 0.6, blunt: 1, head: 'none', eyes: 'none', skinFront: 'slime', skinFlanks: 'slime', skinBack: 'slime', mover: 'suckerFoot', whiskers: true, ears: false, nose: false, mouthStyle: 'none', tail: 'none', pattern: 'none', cheeks: 0, hueBody: '#b9d977', hueSecond: '#6cc5c1', hueAccent: '#ffe98a' },
    Hobbins: { claws: true, pouch: true, pattern: 'bib', earStyle: 'round', hueBody: '#a7c957', hueSecond: '#8a6a52', hueAccent: '#ffc857' },
    Yips: { length: 0.55, width: 0.4, taper: 0.3, muscle: 0.4, lungs: 0.4, eyes: 'forward', mouth: 'jaws', voice: 0.7, head: 'wedge', earStyle: 'point', tail: 'whip', tailLen: 1.4, limbLen: 1.3, pattern: 'saddle', hueBody: '#d98a3a', hueSecond: '#8a6a52', hueAccent: '#f4f1de' },
    Gawps: { size: 1.35, length: 0.3, width: 0.9, blunt: 0.9, head: 'none', camo: 'reed', mouth: 'tongue', eyes: 'side', eyeStyle: 'dome', eyeSize: 0.7, mover: 'wideFeet', ears: false, nose: false, tail: 'none', pattern: 'none', hueBody: '#9aa574', hueSecond: '#8a6a52', hueAccent: '#ffc857' },
    Glumps: { size: 1.4, length: 0.6, width: 0.6, mover: 'fins', tailFin: true, sideLine: true, eyes: 'none', mouth: 'jaws', jawStyle: 'fang', ears: false, nose: false, glow: true, pattern: 'none', hueBody: '#3a3640', hueSecond: '#2f6fde', hueAccent: '#2ec4b6' },
    Snickets: { size: 0.8, length: 0.4, width: 0.3, heatPits: true, sting: 'rear', nose: true, eyes: 'forward', eyeSize: 0.1, earStyle: 'point', pattern: 'mask', hueBody: '#6b2d4e', hueSecond: '#3a3640', hueAccent: '#ffc857' },
    Fidgets: { size: 0.7, length: 0.2, width: 0.3, mouth: 'locking', pairs: 3, ears: false, nose: false, eyeSize: 0.15, tail: 'none', pattern: 'none', hueBody: '#bc4749', hueSecond: '#3a3640', hueAccent: '#ffc857' },
    Galumphs: { size: 1.5, length: 0.6, width: 0.85, mouth: 'beak', muscle: 0.5, legStyle: 'pillars', eyes: 'forward', ears: false, nose: false, headSize: 0.9, tail: 'stub', pattern: 'saddle', hueBody: '#7fb8c9', hueSecond: '#f4f1de', hueAccent: '#d98a3a' },
    Grumbles: { size: 1.35, length: 0.4, width: 0.9, fat: 0.5, nose: true, claws: true, mouth: 'jaws', earStyle: 'round', tail: 'tuft', pattern: 'bib', hueBody: '#8a6a52', hueSecond: '#c9b08a', hueAccent: '#f4f1de' },
    Mooches: { size: 0.8, length: 0.3, width: 0.35, nose: true, voice: 0.7, mover: 'wideFeet', earStyle: 'point', tail: 'whip', pattern: 'spots', hueBody: '#c9b08a', hueSecond: '#8a6a52', hueAccent: '#e67c5c' },
    Clonks: { size: 1.4, length: 0.3, width: 0.95, skinFront: 'shell', skinFlanks: 'shell', skinBack: 'shell', grip: 'hooks', mover: 'wideFeet', eyes: 'stalk', ears: false, nose: false, mouthStyle: 'none', tail: 'none', pattern: 'none', hueBody: '#e8b4a0', hueSecond: '#bc4749', hueAccent: '#f4f1de' },
    Fibs: { size: 0.8, length: 0.35, width: 0.3, shedTail: true, tail: 'whip', tailLen: 1.5, mover: 'cilia', ears: false, eyeSize: 0.5, pattern: 'none', hueBody: '#7fb8c9', hueSecond: '#3a3640', hueAccent: '#ff6b9d' },
  };
  const PRESETS = {}; for (const [n, d] of Object.entries(KIT16).concat(Object.entries(CAST20))) PRESETS[n] = tidy(Object.assign({}, d));
  // every kit entry a sheet can call for, for the check of cover
  const draws = () => { const out = new Map(); for (const f of FIELDS) for (const d of f.draws || []) { if (!out.has(d)) out.set(d, []); out.get(d).push(f.id); } return out; };
  // a form is the base sheet and its differences. Leaving a part out is free; every other difference costs, and each one more than the last
  const form = (base, diff) => tidy(Object.assign({}, base, diff));
  const formCost = (base, diff) => { let n = 0; for (const id in diff) { const f = BY[id]; if (!f || f.kind !== 'rule') continue; const off = f.type === 'flag' ? diff[id] === false : f.type === 'pick' ? ['none', 'smooth', 'plain'].includes(diff[id]) : false; if (!off && diff[id] !== base[id]) n++; } return n * (n + 1) / 2; };

  const SHEET = { FIELDS, BY, LABEL, word, LEFT_OUT, SIDES, GROUNDS, SWATCHES, BUDGET, PRESETS, KIT16: Object.keys(KIT16), CAST20: Object.keys(CAST20), plain, tidy, faults, random, cost, toKit, draws, form, formCost, idle, says };
  if (typeof module !== 'undefined' && module.exports) module.exports = SHEET; else root.SHEET = SHEET;
})(typeof window !== 'undefined' ? window : globalThis);
