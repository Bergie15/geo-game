const MEMBER_COUNTS = {
  Human: 4,
  Lily: 13,
  Pine: 4,
  Toad: 9,
  Fish: 7,
  Cloud: 8,
  Mangrove: 4,
  Banyan: 4,
};

const MEMBER_NAMES = new Set(Object.keys(MEMBER_COUNTS));

const ECOSYSTEMS = [
  { name: 'Desert', value: 2, req: ['Cloud', 'Toad'] },
  { name: 'Aquatic', value: 7, req: ['Lily', 'Toad', 'Mangrove', 'Marine'] },
  { name: 'Forest', value: 6, req: ['Human', 'Lily', 'Temperate', 'Tropical'] },
  { name: 'Freshwater', value: 3, req: ['Toad', 'Fish', 'Cloud'] },
  { name: 'Temperate', value: 2, req: ['Lily', 'Pine'] },
  { name: 'Terrestrial', value: 9, req: ['Pine', 'Mangrove', 'Desert'] },
  { name: 'World', value: 20, req: ['Human', 'Cloud', 'Terrestrial', 'Aquatic'] },
  { name: 'Tropical', value: 2, req: ['Lily', 'Banyan'] },
  { name: 'Marine', value: 4, req: ['Fish', 'Freshwater'] },
];

const ECOSYSTEM_NAMES = new Set(ECOSYSTEMS.map((ecosystem) => ecosystem.name));

const ORDERED_GRID = [
  'Tropical', 'Desert', 'Temperate',
  'Freshwater', 'Forest', 'Marine',
  'Terrestrial', 'Aquatic', 'World',
];

function shuffled(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function countCards(cards) {
  return cards.reduce((acc, c) => {
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
}

function canPay(hand, req) {
  const memberReq = req.filter((item) => MEMBER_NAMES.has(item));
  const counts = countCards(hand);
  return memberReq.every((member) => (counts[member] || 0) > 0);
}

function payReq(hand, req) {
  const memberReq = req.filter((item) => MEMBER_NAMES.has(item));
  const tmp = [...hand];
  memberReq.forEach((card) => {
    const i = tmp.indexOf(card);
    tmp.splice(i, 1);
  });
  return tmp;
}

function hasRequiredEcosystems(player, req) {
  const ownedEcosystems = new Set(player.ecosystems.map((ecosystem) => ecosystem.name));
  return req
    .filter((item) => ECOSYSTEM_NAMES.has(item))
    .every((ecosystemName) => ownedEcosystems.has(ecosystemName));
}

function formatRequirementText(req) {
  const memberReq = req.filter((item) => MEMBER_NAMES.has(item));
  const ecosystemReq = req.filter((item) => ECOSYSTEM_NAMES.has(item));
  const parts = [];
  if (memberReq.length) parts.push(`Members: ${memberReq.join(' + ')}`);
  if (ecosystemReq.length) parts.push(`Ecosystems: ${ecosystemReq.join(' + ')}`);
  return parts.join(' | ');
}

class GeoGame {
  constructor(playerCount = 6) {
    this.logs = [];
    this.newGame(playerCount);
  }

  newGame(playerCount = this.playerCount) {
    this.playerCount = playerCount;
    this.logs = [];
    this.memberDeck = shuffled(
      Object.entries(MEMBER_COUNTS).flatMap(([name, n]) => Array.from({ length: n }, () => name)),
    );
    this.discardPile = [];

    this.ecoDecks = Object.fromEntries(
      ECOSYSTEMS.map((e) => [e.name, Array.from({ length: 6 }, () => ({ ...e }))]),
    );

    this.players = Array.from({ length: this.playerCount }, (_, i) => ({
      id: i,
      name: i === 0 ? 'You' : `Bot ${i}`,
      hand: [],
      ecosystems: [],
    }));

    this.round = 1;
    this.startPlayer = 0;
    this.turnOffset = 0;
    this.gameOver = false;
    this.triggeredEnd = false;
    this.pendingDiscard = null;
    this.tradeUsedThisTurn = false;
    this.drawUpForRound();
    this.log(`New game started with ${this.playerCount} players.`);
  }

  drawCard() {
    if (!this.memberDeck.length) {
      if (!this.discardPile.length) return null;
      this.memberDeck = shuffled(this.discardPile);
      this.discardPile = [];
      this.log('Member deck depleted. Discard pile was shuffled into a new draw deck.');
    }
    return this.memberDeck.pop();
  }

  drawUpForRound() {
    for (let p = 0; p < this.playerCount; p += 1) {
      const idx = (this.startPlayer + p) % this.playerCount;
      while (this.players[idx].hand.length < 6) {
        const card = this.drawCard();
        if (!card) break;
        this.players[idx].hand.push(card);
      }
    }
  }

  currentPlayer() {
    return this.players[(this.startPlayer + this.turnOffset) % this.playerCount];
  }

  availableEcosystems(player) {
    return ECOSYSTEMS.filter((e) => this.ecoDecks[e.name].length > 0
      && !player.ecosystems.some((x) => x.name === e.name)
      && canPay(player.hand, e.req)
      && hasRequiredEcosystems(player, e.req));
  }

  requestTrade(requesterId, targetId, offerCard, requestedCard) {
    if (this.gameOver) return 'Game is over.';
    if (this.pendingDiscard) return 'Finish discarding before trading.';

    const current = this.currentPlayer();
    if (current.id !== requesterId) return 'Not this player turn.';
    if (requesterId !== 0) return 'Only the human player can request trades.';
    if (this.tradeUsedThisTurn) return 'You can only request one trade per turn.';

    const requester = this.players[requesterId];
    const target = this.players[targetId];
    if (!target || target.id === requesterId) return 'Choose a valid opposing player.';
    if (!offerCard || !requestedCard) return 'Pick both an offer and a requested card.';
    if (!MEMBER_NAMES.has(offerCard) || !MEMBER_NAMES.has(requestedCard)) {
      return 'Trades can only use member cards.';
    }
    if (!requester.hand.includes(offerCard)) return `You do not have ${offerCard} to offer.`;
    if (!target.hand.includes(requestedCard)) {
      this.tradeUsedThisTurn = true;
      this.log(`${requester.name} asked ${target.name} for ${requestedCard}, but ${target.name} declined.`);
      return null;
    }

    const targetCounts = countCards(target.hand);

    const hasDuplicateRequested = (targetCounts[requestedCard] || 0) > 1;
    const improvesVariety = (targetCounts[offerCard] || 0) === 0;

    let acceptChance = 0.3;
    if (hasDuplicateRequested) acceptChance += 0.4;
    if (improvesVariety) acceptChance += 0.2;
    if (offerCard === requestedCard) acceptChance -= 0.15;

    const accepted = Math.random() < Math.max(0.05, Math.min(0.95, acceptChance));
    this.tradeUsedThisTurn = true;

    if (!accepted) {
      this.log(`${requester.name} asked ${target.name} for ${requestedCard} in exchange for ${offerCard}. ${target.name} declined.`);
      return null;
    }

    requester.hand.splice(requester.hand.indexOf(offerCard), 1);
    target.hand.push(offerCard);

    target.hand.splice(target.hand.indexOf(requestedCard), 1);
    requester.hand.push(requestedCard);

    this.log(`${requester.name} traded ${offerCard} to ${target.name} for ${requestedCard}.`);
    return null;
  }

  acquire(playerId, ecoName) {
    if (this.gameOver) return 'Game is over.';
    const cp = this.currentPlayer();
    if (cp.id !== playerId) return 'Not this player turn.';
    const p = this.players[playerId];
    const eco = ECOSYSTEMS.find((e) => e.name === ecoName);
    if (!eco || !this.ecoDecks[eco.name].length) return 'No copies left.';
    if (p.ecosystems.some((x) => x.name === eco.name)) return 'Duplicate ecosystems are not allowed.';
    if (!canPay(p.hand, eco.req)) return 'Not enough member cards for this ecosystem.';
    if (!hasRequiredEcosystems(p, eco.req)) return 'Missing required prerequisite ecosystems.';

    p.hand = payReq(p.hand, eco.req);
    this.discardPile.push(...eco.req.filter((item) => MEMBER_NAMES.has(item)));
    const gained = this.ecoDecks[eco.name].pop();
    p.ecosystems.push(gained);
    this.log(`${p.name} acquired ${eco.name} (${eco.value} pts) with ${formatRequirementText(eco.req)}.`);
    return null;
  }

  botPlay(player) {
    let madeMove = false;
    while (true) {
      const options = this.availableEcosystems(player)
        .sort((a, b) => b.value - a.value);
      if (!options.length) break;
      this.acquire(player.id, options[0].name);
      madeMove = true;
    }
    if (!madeMove) this.log(`${player.name} could not acquire an ecosystem.`);
  }

  score(player) {
    return player.ecosystems.reduce((sum, e) => sum + e.value, 0);
  }

  endTurn() {
    if (this.gameOver || this.pendingDiscard) return;
    const p = this.currentPlayer();
    if (p.id !== 0) {
      this.botPlay(p);
    }

    this.turnOffset += 1;
    this.tradeUsedThisTurn = false;
    if (this.turnOffset >= this.playerCount) {
      this.endRound();
      return;
    }

    const next = this.currentPlayer();
    if (next.id !== 0) {
      this.endTurn();
    }
  }

  discardFromHand(player, cards) {
    const handCounts = countCards(player.hand);
    for (const card of cards) {
      if (!handCounts[card]) return false;
      handCounts[card] -= 1;
    }

    cards.forEach((card) => {
      const i = player.hand.indexOf(card);
      player.hand.splice(i, 1);
      this.discardPile.push(card);
    });
    return true;
  }

  finishRound() {
    const maxScore = Math.max(...this.players.map((p) => this.score(p)));
    if (maxScore >= 20) this.triggeredEnd = true;

    if (this.triggeredEnd) {
      const leaders = this.players.filter((p) => this.score(p) === maxScore);
      let winners = leaders;
      for (const value of [...new Set(ECOSYSTEMS.map((e) => e.value).sort((a, b) => b - a))]) {
        const withValueCount = winners.map((p) => ({
          p,
          c: p.ecosystems.filter((e) => e.value === value).length,
        }));
        const best = Math.max(...withValueCount.map((x) => x.c));
        winners = withValueCount.filter((x) => x.c === best).map((x) => x.p);
        if (winners.length === 1) break;
      }
      if (winners.length === 1) {
        this.gameOver = true;
        this.log(`Game over! Winner: ${winners[0].name} with ${this.score(winners[0])} points.`);
        return;
      }
    }

    this.round += 1;
    this.startPlayer = (this.startPlayer + 1) % this.playerCount;
    this.turnOffset = 0;
    this.tradeUsedThisTurn = false;
    this.drawUpForRound();
    this.log(`Round ${this.round} started. ${this.currentPlayer().name} goes first.`);

    if (this.currentPlayer().id !== 0) this.endTurn();
  }

  discardSelection(playerId, cards) {
    if (!this.pendingDiscard || this.pendingDiscard.playerId !== playerId) return 'No discard selection is pending.';
    if (cards.length !== this.pendingDiscard.count) {
      return `Select exactly ${this.pendingDiscard.count} cards to discard.`;
    }

    const player = this.players[playerId];
    if (!this.discardFromHand(player, cards)) return 'Invalid card selection.';

    this.log(`${player.name} discarded ${cards.join(', ')}.`);
    this.pendingDiscard = null;
    this.finishRound();
    return null;
  }

  endRound() {
    this.players.forEach((p) => {
      if (p.id === 0) return;
      while (p.hand.length > 4) {
        this.discardPile.push(p.hand.pop());
      }
    });

    const you = this.players[0];
    if (you.hand.length > 4) {
      this.pendingDiscard = { playerId: 0, count: you.hand.length - 4 };
      this.log(`Round ${this.round} ended. Choose ${this.pendingDiscard.count} member card(s) to discard.`);
      return;
    }

    this.finishRound();
  }

  log(text) {
    this.logs.unshift(`[R${this.round}] ${text}`);
    this.logs = this.logs.slice(0, 200);
  }
}

const game = new GeoGame();

const startMenuEl = document.getElementById('startMenu');
const gameContentEl = document.getElementById('gameContent');
const playerCountSelectEl = document.getElementById('playerCountSelect');
const startGameBtn = document.getElementById('startGameBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const statusEl = document.getElementById('status');
const handEl = document.getElementById('hand');
const ecoEl = document.getElementById('ecosystems');
const playersEl = document.getElementById('players');
const logEl = document.getElementById('log');
const acquireDialogEl = document.getElementById('acquireDialog');
const acquireTitleEl = document.getElementById('acquireTitle');
const acquireDetailsEl = document.getElementById('acquireDetails');
const confirmAcquireBtn = document.getElementById('confirmAcquireBtn');
const discardDialogEl = document.getElementById('discardDialog');
const discardPromptEl = document.getElementById('discardPrompt');
const discardOptionsEl = document.getElementById('discardOptions');
const confirmDiscardBtn = document.getElementById('confirmDiscardBtn');
const tradeTargetSelectEl = document.getElementById('tradeTargetSelect');
const tradeOfferSelectEl = document.getElementById('tradeOfferSelect');
const tradeRequestSelectEl = document.getElementById('tradeRequestSelect');
const requestTradeBtn = document.getElementById('requestTradeBtn');

let selectedEcoName = null;

function showAcquireDialog(eco) {
  selectedEcoName = eco.name;
  acquireTitleEl.textContent = `Buy ${eco.name}?`;
  acquireDetailsEl.textContent = `Value: ${eco.value} pts • ${formatRequirementText(eco.req)}`;
  acquireDialogEl.showModal();
}



function syncTradeControls() {
  const you = game.players[0];

  tradeTargetSelectEl.innerHTML = '';
  game.players
    .filter((player) => player.id !== 0)
    .forEach((bot) => {
      const option = document.createElement('option');
      option.value = String(bot.id);
      option.textContent = bot.name;
      tradeTargetSelectEl.appendChild(option);
    });

  tradeOfferSelectEl.innerHTML = '';
  const offeredMemberCards = [...new Set(you.hand)];
  offeredMemberCards.forEach((card) => {
    const option = document.createElement('option');
    option.value = card;
    option.textContent = card;
    tradeOfferSelectEl.appendChild(option);
  });

  tradeRequestSelectEl.innerHTML = '';
  [...MEMBER_NAMES].forEach((memberName) => {
    const option = document.createElement('option');
    option.value = memberName;
    option.textContent = memberName;
    tradeRequestSelectEl.appendChild(option);
  });

  const canTrade = !game.gameOver
    && !game.pendingDiscard
    && game.currentPlayer().id === 0
    && !game.tradeUsedThisTurn
    && game.players.length > 1
    && offeredMemberCards.length > 0;

  tradeTargetSelectEl.disabled = !canTrade;
  tradeOfferSelectEl.disabled = !canTrade;
  tradeRequestSelectEl.disabled = !canTrade;
  requestTradeBtn.disabled = !canTrade;
}

function syncDiscardDialog() {
  const pending = game.pendingDiscard;
  if (!pending || pending.playerId !== 0) {
    if (discardDialogEl.open) discardDialogEl.close();
    return;
  }

  const needed = pending.count;
  discardPromptEl.textContent = `Select exactly ${needed} card(s) to discard from your hand.`;
  discardOptionsEl.innerHTML = '';

  game.players[0].hand.forEach((card, index) => {
    const label = document.createElement('label');
    label.className = 'discard-option';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = String(index);
    input.addEventListener('change', () => {
      const checked = discardOptionsEl.querySelectorAll('input:checked').length;
      if (checked > needed) input.checked = false;
      const selectedNow = discardOptionsEl.querySelectorAll('input:checked').length;
      confirmDiscardBtn.disabled = selectedNow !== needed;
    });

    const text = document.createElement('span');
    text.textContent = card;

    label.appendChild(input);
    label.appendChild(text);
    discardOptionsEl.appendChild(label);
  });

  confirmDiscardBtn.disabled = true;
  if (!discardDialogEl.open) discardDialogEl.showModal();
}

function render() {
  const cp = game.currentPlayer();
  statusEl.textContent = [
    `Players: ${game.playerCount}`,
    `Round: ${game.round}`,
    `Current Turn: ${cp.name}`,
    `Start Player: ${game.players[game.startPlayer].name}`,
    `Member deck cards: ${game.memberDeck.length}`,
    `Discard cards: ${game.discardPile.length}`,
    game.pendingDiscard
      ? `Status: Waiting on discard (${game.pendingDiscard.count} card(s))`
      : (game.gameOver ? 'Status: Game Over' : 'Status: In Progress'),
  ].join('\n');

  const you = game.players[0];
  const acquirableNames = new Set(game.availableEcosystems(you).map((eco) => eco.name));
  handEl.innerHTML = '';

  const memberTitle = document.createElement('strong');
  memberTitle.textContent = 'Members:';
  handEl.appendChild(memberTitle);

  if (you.hand.length === 0) {
    const emptyMembers = document.createElement('div');
    emptyMembers.textContent = ' none';
    handEl.appendChild(emptyMembers);
  } else {
    you.hand.forEach((c) => {
      const span = document.createElement('span');
      span.className = 'chip';
      span.textContent = c;
      handEl.appendChild(span);
    });
  }

  const ecoTitle = document.createElement('strong');
  ecoTitle.textContent = 'Ecosystems in deck:';
  handEl.appendChild(ecoTitle);

  if (you.ecosystems.length === 0) {
    const emptyEco = document.createElement('div');
    emptyEco.textContent = ' none';
    handEl.appendChild(emptyEco);
  } else {
    you.ecosystems.forEach((eco) => {
      const span = document.createElement('span');
      span.className = 'chip';
      span.textContent = `${eco.name} (${eco.value})`;
      handEl.appendChild(span);
    });
  }

  ecoEl.innerHTML = '';
  ORDERED_GRID.forEach((name) => {
    const rule = ECOSYSTEMS.find((e) => e.name === name);
    const div = document.createElement('div');
    const canAcquire = !game.pendingDiscard && acquirableNames.has(name);
    div.className = `eco ${canAcquire ? 'eco--acquirable' : 'eco--locked'}`;
    div.innerHTML = `<strong>${name}</strong><br/>Value: ${rule.value}<br/>${formatRequirementText(rule.req)}<br/>Left: ${game.ecoDecks[name].length}`;
    if (canAcquire) {
      div.addEventListener('click', () => {
        if (game.pendingDiscard) {
          game.log('Discard cards to continue to the next round.');
          render();
          return;
        }
        if (game.currentPlayer().id !== 0) {
          game.log('Wait for your turn.');
          render();
          return;
        }
        showAcquireDialog(rule);
      });
    }
    ecoEl.appendChild(div);
  });

  playersEl.innerHTML = '';
  game.players.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'player';
    div.innerHTML = `<strong>${p.name}</strong> — score ${game.score(p)} | hand ${p.hand.length} | deck: ${p.ecosystems.map((e) => e.name).join(', ') || 'empty'}`;
    playersEl.appendChild(div);
  });

  syncTradeControls();
  syncDiscardDialog();

  logEl.innerHTML = '';
  game.logs.forEach((entry) => {
    const line = document.createElement('div');
    line.textContent = entry;
    logEl.appendChild(line);
  });
}

function startGame() {
  const selectedPlayerCount = Number(playerCountSelectEl.value);
  game.newGame(selectedPlayerCount);
  while (game.currentPlayer().id !== 0 && !game.gameOver) game.endTurn();
  game.logs = [];
  startMenuEl.classList.add('hidden');
  gameContentEl.classList.remove('hidden');
  render();
}

function goBackToHome() {
  if (acquireDialogEl.open) acquireDialogEl.close();
  if (discardDialogEl.open) discardDialogEl.close();
  startMenuEl.classList.remove('hidden');
  gameContentEl.classList.add('hidden');
}

startGameBtn.addEventListener('click', startGame);

document.getElementById('newGameBtn').addEventListener('click', () => {
  game.newGame();
  while (game.currentPlayer().id !== 0 && !game.gameOver) game.endTurn();
  game.logs = [];
  render();
});

backToHomeBtn.addEventListener('click', goBackToHome);

confirmAcquireBtn.addEventListener('click', () => {
  if (game.pendingDiscard) return;
  if (!selectedEcoName) return;
  const err = game.acquire(0, selectedEcoName);
  if (err) game.log(`You failed to acquire ${selectedEcoName}: ${err}`);
  acquireDialogEl.close();
  selectedEcoName = null;
  render();
});


requestTradeBtn.addEventListener('click', () => {
  const targetId = Number(tradeTargetSelectEl.value);
  const offerCard = tradeOfferSelectEl.value;
  const requestedCard = tradeRequestSelectEl.value;

  const err = game.requestTrade(0, targetId, offerCard, requestedCard);
  if (err) game.log(`Trade failed: ${err}`);
  render();
});

document.getElementById('nextTurnBtn').addEventListener('click', () => {
  if (game.pendingDiscard) {
    game.log('Discard cards to continue to the next round.');
  } else if (game.currentPlayer().id === 0) {
    game.endTurn();
  } else {
    game.log('Wait for your turn.');
  }
  render();
});

acquireDialogEl.addEventListener('close', () => {
  selectedEcoName = null;
});

confirmDiscardBtn.addEventListener('click', () => {
  if (!game.pendingDiscard) return;

  const selectedIndexes = [...discardOptionsEl.querySelectorAll('input:checked')]
    .map((input) => Number(input.value))
    .sort((a, b) => b - a);
  const selectedCards = selectedIndexes.map((i) => game.players[0].hand[i]);

  const err = game.discardSelection(0, selectedCards);
  if (err) game.log(err);
  render();
});
