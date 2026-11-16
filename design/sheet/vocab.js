// The vocabulary a brain is written in, as data: the brain's counterpart of the species sheet.
// Taken word for word from design/neural-blocks.md, draft 5, sections 2 to 9. A stand-in for the game's own data.
// The mechanics pass (design/plan.md, section 3) runs on this list: every word has to matter somewhere in play.
//
// Each entry: kind (the slot it fills), family (words that share one mechanic), word, and where given:
//   needs   the body part or sense without which the word cannot be used
//   sec     the section of the vocabulary document it comes from
// Words in one family are tested together: the family's mechanic is tested fully with some of its words,
// and each of the others is checked to be told apart from its neighbours.
(function (root) {
  const out = [], add = (kind, family, words, more = {}) => { for (const w of words) out.push(Object.assign({ id: kind + ': ' + w, kind, family, word: w }, more)); };

  // ---- noticing: reach, how many, which one ----
  add('reach', 'reach', ['touch', 'near', 'see', 'far'], { sec: 3 });
  add('reach', 'reach', ['hear'], { sec: 3, needs: 'ears' }); add('reach', 'reach', ['smell'], { sec: 3, needs: 'nose' }); add('reach', 'reach', ['feel'], { sec: 3, needs: 'sideLine' });
  add('count', 'how many', ['no', 'a', 'a few', 'many', 'a crowd'], { sec: 3 });
  add('count', 'several as one', ['my group', 'outnumbering', 'outnumbered'], { sec: 3 });
  add('which', 'which one', ['nearest', 'biggest', 'smallest', 'weakest', 'lone', 'my [mood] one', 'the oldest', 'the youngest'], { sec: 3 });

  // ---- noticing: what ----
  add('what', 'food', ['plant', 'meat', 'egg'], { sec: 3 });
  add('what', 'my kind', ['my kind', 'male', 'female', 'young', 'adult', 'old', 'family', 'stranger', 'of my home', 'of another home', 'bigger than me', 'smaller than me', 'older than me', 'younger than me', 'a named form'], { sec: 3 });
  add('what', 'other creatures', ['bigger creature', 'smaller creature', 'creature about my size'], { sec: 3 });
  add('what', 'what it is covered in', ['spiked', 'shelled', 'slimy', 'fat'], { sec: 3 });
  add('what', 'known kinds', ['a species I have met', 'a kind I learned about'], { sec: 3 });
  add('what', 'things to carry', ['food to carry', 'seed', 'an egg to carry', 'a young one', 'building material', 'the dead', 'a smaller creature to carry'], { sec: 3 });
  add('what', 'signals', ['a call', 'my mark', 'my kind\'s mark', 'a stranger\'s mark', 'a display'], { sec: 3 });
  add('what', 'a rider', ['a rider', 'a rider of my kind'], { sec: 3 });
  add('what', 'ground', ['open grass', 'tall grass', 'thicket', 'scrub', 'rock', 'scree', 'sand', 'mud', 'bare ground', 'snow and ice'], { sec: 3 });
  add('what', 'water', ['still water', 'shallows', 'deep water', 'running water', 'a pool left by tide or flood'], { sec: 3 });
  add('what', 'shelter', ['cover', 'a crevice', 'a cave', 'a hollow', 'a burrow', 'shade'], { sec: 3 });
  add('what', 'made things', ['a nest', 'a wall', 'a larder', 'a trail of marks'], { sec: 3 });
  add('what', 'lines', ['an edge of cover', 'the water\'s edge', 'a river bank', 'the tide line', 'a wall as a line'], { sec: 3 });
  add('what', 'high and open', ['high ground', 'open ground', 'an island', 'a crossing'], { sec: 3 });
  add('what', 'changed ground', ['burnt ground', 'new growth', 'grazed ground', 'flooded ground', 'frozen water'], { sec: 3 });
  add('what', 'plenty', ['a bloom', 'a stand in fruit', 'fallen seed', 'food left by the tide', 'a carcass'], { sec: 3 });
  add('what', 'directions', ['brighter', 'darker', 'warmer', 'cooler', 'uphill', 'downhill', 'deeper', 'shallower', 'wetter', 'drier'], { sec: 3 });
  add('what', 'directions', ['upstream', 'downstream'], { sec: 3, needs: 'sideLine' }); add('what', 'directions', ['upwind', 'downwind'], { sec: 3, needs: 'nose' }); add('what', 'directions', ['north', 'south', 'east', 'west'], { sec: 3, needs: 'compass' });
  add('what', 'remembered', ['my [mood] place', 'toward my [mood] place'], { sec: 3 });
  add('what', 'keeper', ['my keeper'], { sec: 3 });

  // ---- noticing: what it is doing ----
  add('state', 'what it is doing', ['still', 'coming at me', 'going away', 'facing me', 'facing away', 'eating', 'resting', 'fighting', 'carrying', 'clinging', 'hurt', 'calling', 'showing [display]'], { sec: 3 });

  // ---- feelings: what conditions test ----
  add('feeling', 'body', ['hungry', 'hurt', 'tired', 'cold', 'warm', 'carrying', 'covered', 'clung to', 'clinging'], { sec: 3 });
  add('feeling', 'breeding', ['fertile', 'gravid'], { sec: 3 });
  add('feeling', 'surroundings', ['dark', 'light', 'crowded'], { sec: 3 });
  add('feeling', 'company', ['alone', 'outnumbering', 'outnumbered'], { sec: 3 });
  add('feeling', 'traits', ['male', 'female', 'young', 'adult', 'old', 'the form it is'], { sec: 3 });
  add('feeling', 'state of mind', ['idle', 'torn', 'stuck'], { sec: 3 });
  add('feeling', 'moods', ['[mood]'], { sec: 3 });
  add('feeling', 'constants', ['always', 'sometimes'], { sec: 3 });
  add('feeling', 'time of day', ['day', 'night', 'dawn', 'dusk'], { sec: 3 });
  add('feeling', 'season', ['spring', 'summer', 'autumn', 'winter'], { sec: 3 });
  add('feeling', 'weather', ['raining', 'windy', 'hot weather', 'freezing', 'snow lying'], { sec: 3 });
  add('feeling', 'state of the water', ['tide in', 'tide out', 'tide rising', 'tide falling', 'flood', 'low water'], { sec: 3 });
  add('feeling', 'fire', ['fire near', 'smoke'], { sec: 3 });
  add('feeling', 'where I am', ['in water', 'out of my depth', 'in a current', 'being swept along', 'sinking', 'wet', 'dry', 'exposed', 'in shade', 'in sun', 'underground', 'high up', 'on [ground]'], { sec: 3 });
  add('degree', 'degree', ['a little', 'very'], { sec: 3 });

  // ---- moments: things that just happened ----
  add('moment', 'to me', ['just hatched', 'just ate', 'just bitten', 'just fed', 'just tended', 'just grabbed', 'startled'], { sec: 3 });
  add('moment', 'by me', ['just bit', 'just killed', 'just mated', 'just laid'], { sec: 3 });
  add('moment', 'losing track', ['just lost sight of it'], { sec: 3 });
  add('moment', 'the world', ['rain just started', 'rain just stopped', 'the tide just turned', 'the water just rose', 'the first frost', 'a fire just started', 'day just broke', 'night just fell', 'the season just turned', 'food just arrived'], { sec: 3 });
  add('moment', 'moods', ['[mood] just started', '[mood] just ended'], { sec: 3 });
  add('moment', 'keeper', ['keeper\'s touch', 'keeper\'s treat'], { sec: 3 });

  // ---- acts ----
  add('act', 'moving', ['approach', 'move away', 'stay near', 'keep apart', 'circle', 'go along', 'go the same way', 'head off', 'face', 'wander', 'hold still'], { sec: 4 });
  add('pace', 'pace', ['creeping', 'normal pace', 'sprinting'], { sec: 4 });
  add('act', 'body', ['bite', 'rest', 'lay', 'mate', 'grab', 'drop', 'give', 'tend', 'roll'], { sec: 4 });
  add('act', 'body', ['cling', 'let go'], { sec: 4, needs: 'grip' }); add('act', 'body', ['hide'], { sec: 4, needs: 'shell or burrow' }); add('act', 'body', ['shed'], { sec: 4, needs: 'shedTail' });
  add('act', 'from a part', ['sting'], { sec: 4, needs: 'sting' }); add('act', 'from a part', ['spray'], { sec: 4, needs: 'ink' }); add('act', 'from a part', ['glow'], { sec: 4, needs: 'glow' });
  add('act', 'poses', ['puff up'], { sec: 4, needs: 'crest' }); add('act', 'poses', ['play dead', 'crouch'], { sec: 4 });
  add('act', 'changing the world', ['mark', 'wipe', 'dig', 'build'], { sec: 4 });
  add('act', 'signals and moods', ['call', 'show', 'raise', 'calm', 'hurry'], { sec: 4 }); add('act', 'signals and moods', ['ping'], { sec: 4, needs: 'ping' });
  add('aim', 'aim', ['the one it is facing'], { sec: 2 });

  // ---- how an instinct is weighed ----
  add('condition', 'conditions', ['only when', 'not when', 'more when', 'less when'], { sec: 2 });
  add('strength', 'strength', ['weak', 'normal strength', 'strong'], { sec: 6 });
  add('setting', 'act settings', ['close', 'mid', 'far apart', 'tight', 'medium', 'wide'], { sec: 4 });

  // ---- moods ----
  add('mood', 'raised and calmed', ['raised by', 'calmed by', 'quickly', 'normally', 'slowly'], { sec: 5 });
  add('mood', 'lingers', ['briefly', 'a while', 'a long time', 'until calmed'], { sec: 5 });
  add('mood', 'kicks in', ['kicks in low', 'kicks in at half', 'kicks in high'], { sec: 5 });
  add('function', 'mood functions', ['Bond', 'Place', 'Rhythm', 'Count', 'Born with', 'Catching', 'Learn', 'Takes over', 'Habit', 'For life'], { sec: 7 });

  // ---- signals ----
  add('signal', 'signals', ['a call heard near', 'a call heard far', 'a mark that fades soon', 'a mark that lasts', 'a display'], { sec: 8 });
  add('signal', 'whose it is', ['mine', 'my home\'s', 'another home\'s', 'a stranger\'s'], { sec: 8 });
  add('signal', 'pointing', ['facing while showing'], { sec: 8 });

  // ---- what doing one thing costs the senses (rule 7) ----
  add('attention', 'attention', ['eating sees only near', 'resting sees nothing', 'hiding sees nothing and is unseen', 'sprinting smells nothing and is loud', 'creeping is hard to hear or feel', 'holding still is unfelt'], { sec: 6 });

  // ---- settings for the whole species ----
  add('species', 'way of breeding', ['alone', 'in pairs', 'one breeder with helpers', 'both sexes in one', 'splitting'], { sec: 9 });
  add('species', 'brood mix', ['share of each sex and form', 'a rule on the mix'], { sec: 9 });
  add('species', 'mating', ['each time', 'once and lay for life'], { sec: 9 });
  add('species', 'what breeding costs the parent', ['nothing', 'the mother dies after laying', 'the father dies after mating'], { sec: 9 });
  add('species', 'eggs', ['many small', 'a few large', 'laid', 'kept inside until they hatch', 'hatch at once', 'wait for a season'], { sec: 9 });
  add('species', 'lay once or again', ['once, with everything', 'repeatedly'], { sec: 9 });
  add('species', 'sleep', ['adults sleep through a season', 'no sleep'], { sec: 9 });

  // Words the vocabulary document names and leaves out on purpose (section 4), so that nobody adds them back by mistake
  const LEFT_OUT = ['eat and attack as separate verbs', 'flee, chase, stalk, follow, guard, patrol, search', 'get behind', 'watch', 'push, block, dodge', 'copy', 'grow, heal, digest', 'hunt, court, nest, flock', 'spit, shock'];

  const families = () => { const m = new Map(); for (const v of out) { const k = v.kind + ' / ' + v.family; if (!m.has(k)) m.set(k, []); m.get(k).push(v); } return m; };
  const VOCAB = { words: out, families, LEFT_OUT, byId: Object.fromEntries(out.map((v) => [v.id, v])) };
  if (typeof module !== 'undefined' && module.exports) module.exports = VOCAB; else root.VOCAB = VOCAB;
})(typeof window !== 'undefined' ? window : globalThis);
