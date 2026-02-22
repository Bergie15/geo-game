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

const ECOSYSTEMS = [
  { name: 'Tropical', value: 9, req: ['Lily', 'Mangrove'] },
  { name: 'Desert', value: 7, req: ['Cloud', 'Pine'] },
  { name: 'Temperate', value: 6, req: ['Pine', 'Toad'] },
  { name: 'Freshwater', value: 5, req: ['Fish', 'Lily'] },
  { name: 'Forest', value: 4, req: ['Banyan', 'Toad'] },
  { name: 'Marine', value: 8, req: ['Fish', 'Cloud'] },
  { name: 'Terrestrial', value: 3, req: ['Human', 'Pine'] },
  { name: 'Aquatic', value: 5, req: ['Fish', 'Toad'] },
  { name: 'World', value: 10, req: ['Human', 'Banyan', 'Cloud'] },
];

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
  const counts = countCards(hand);
  return req.every((c) => (counts[c] || 0) > 0);
}

function payReq(hand, req) {
  const tmp = [...hand];
  req.forEach((card) => {
    const i = tmp.indexOf(card);
    tmp.splice(i, 1);
  });
  return tmp;
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
      && canPay(player.hand, e.req));
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

    p.hand = payReq(p.hand, eco.req);
    this.discardPile.push(...eco.req);
    const gained = this.ecoDecks[eco.name].pop();
    p.ecosystems.push(gained);
    this.log(`${p.name} acquired ${eco.name} (${eco.value} pts) by paying ${eco.req.join(' + ')}.`);
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
    if (this.gameOver) return;
    const p = this.currentPlayer();
    if (p.id !== 0) {
      this.botPlay(p);
    }

    this.turnOffset += 1;
    if (this.turnOffset >= this.playerCount) {
      this.endRound();
      return;
    }

    const next = this.currentPlayer();
    if (next.id !== 0) {
      this.endTurn();
    }
  }

  endRound() {
    this.players.forEach((p) => {
      while (p.hand.length > 4) {
        this.discardPile.push(p.hand.pop());
      }
    });

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
    this.drawUpForRound();
    this.log(`Round ${this.round} started. ${this.currentPlayer().name} goes first.`);

    if (this.currentPlayer().id !== 0) this.endTurn();
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

let selectedEcoName = null;

function showAcquireDialog(eco) {
  selectedEcoName = eco.name;
  acquireTitleEl.textContent = `Buy ${eco.name}?`;
  acquireDetailsEl.textContent = `Value: ${eco.value} pts • Cost: ${eco.req.join(' + ')}`;
  acquireDialogEl.showModal();
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
    game.gameOver ? 'Status: Game Over' : 'Status: In Progress',
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
    const canAcquire = acquirableNames.has(name);
    div.className = `eco ${canAcquire ? 'eco--acquirable' : 'eco--locked'}`;
    div.innerHTML = `<strong>${name}</strong><br/>Value: ${rule.value}<br/>Need: ${rule.req.join(' + ')}<br/>Left: ${game.ecoDecks[name].length}`;
    if (canAcquire) {
      div.addEventListener('click', () => {
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
  if (!selectedEcoName) return;
  const err = game.acquire(0, selectedEcoName);
  if (err) game.log(`You failed to acquire ${selectedEcoName}: ${err}`);
  acquireDialogEl.close();
  selectedEcoName = null;
  render();
});

document.getElementById('nextTurnBtn').addEventListener('click', () => {
  if (game.currentPlayer().id === 0) {
    game.endTurn();
  } else {
    game.log('Wait for your turn.');
  }
  render();
});

acquireDialogEl.addEventListener('close', () => {
  selectedEcoName = null;
});
