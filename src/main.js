import './style.css'

const WORD_BANK = {
  ko: [
    '리듬',
    '타이핑',
    '산성비',
    '키보드',
    '집중력',
    '속도',
    '정확도',
    '파도',
    '신호등',
    '별빛',
    '온도',
    '화면',
    '손끝',
    '도시',
    '심장',
    '한글',
    '박자',
    '유리창',
    '구름',
    '기록',
  ],
  en: [
    'tempo',
    'acid',
    'storm',
    'focus',
    'signal',
    'neon',
    'rhythm',
    'switch',
    'silver',
    'pixel',
    'meteor',
    'tunnel',
    'gravity',
    'vector',
    'sprint',
    'charge',
    'rocket',
    'arcade',
    'glow',
    'score',
  ],
  mixed: [
    'tempo',
    '리듬',
    'acid',
    '집중',
    'combo',
    '속도',
    'signal',
    '한글',
    'storm',
    '화면',
    'neon',
    '정확도',
    'boost',
    '타이핑',
    'gravity',
    '박자',
    'arcade',
    '도시',
    'focus',
    '별빛',
  ],
}

const DIFFICULTY = {
  easy: { label: '순한 비', spawnMs: 1500, minSpeed: 36, maxSpeed: 58 },
  normal: { label: '산성비', spawnMs: 1000, minSpeed: 56, maxSpeed: 82 },
  hard: { label: '폭우', spawnMs: 700, minSpeed: 80, maxSpeed: 118 },
}

const app = document.querySelector('#app')
const refs = {}

const state = {
  mode: 'ko',
  difficulty: 'normal',
  running: false,
  finished: false,
  started: false,
  isComposing: false,
  currentInput: '',
  words: [],
  lastFrame: 0,
  spawnAccumulator: 0,
  animationId: null,
  score: 0,
  combo: 0,
  bestCombo: 0,
  cleared: 0,
  misses: 0,
  lives: 5,
  nextWordId: 1,
}

function normalizeText(value) {
  return value.normalize('NFC').trim()
}

function getWordPool() {
  return WORD_BANK[state.mode]
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function getArenaWidth() {
  return refs.arena?.clientWidth || 320
}

function getArenaHeight() {
  return refs.arena?.clientHeight || 420
}

function getLevel() {
  return Math.floor(state.cleared / 8) + 1
}

function getStatusText() {
  if (state.finished) {
    return '게임 종료. 다시 시작해서 기록을 갱신해보세요.'
  }

  if (!state.started) {
    return '입력을 시작하면 단어가 떨어집니다. 같은 단어를 정확히 치면 제거됩니다.'
  }

  return '떨어지는 단어를 그대로 입력하세요. 놓치면 체력이 줄어듭니다.'
}

function resetGame() {
  cancelAnimationFrame(state.animationId)
  state.running = false
  state.finished = false
  state.started = false
  state.isComposing = false
  state.currentInput = ''
  state.words = []
  state.lastFrame = 0
  state.spawnAccumulator = 0
  state.animationId = null
  state.score = 0
  state.combo = 0
  state.bestCombo = 0
  state.cleared = 0
  state.misses = 0
  state.lives = 5
  state.nextWordId = 1
}

function startGame() {
  if (state.running || state.finished) {
    return
  }

  state.running = true
  state.started = true
  state.lastFrame = performance.now()
  state.animationId = requestAnimationFrame(tick)
}

function finishGame() {
  state.running = false
  state.finished = true
  cancelAnimationFrame(state.animationId)
  state.animationId = null
  render()
}

function spawnWord() {
  const arenaWidth = getArenaWidth()
  const levelBoost = (getLevel() - 1) * 8
  const difficulty = DIFFICULTY[state.difficulty]
  const text = randomFrom(getWordPool())
  const widthEstimate = Math.max(72, text.length * 22 + 24)
  const maxX = Math.max(24, arenaWidth - widthEstimate - 12)

  state.words.push({
    id: state.nextWordId,
    text,
    x: 12 + Math.random() * maxX,
    y: -24,
    speed: difficulty.minSpeed + Math.random() * (difficulty.maxSpeed - difficulty.minSpeed) + levelBoost,
  })

  state.nextWordId += 1
}

function removeWord(id) {
  state.words = state.words.filter((word) => word.id !== id)
}

function handleSuccessfulHit(word) {
  removeWord(word.id)
  state.cleared += 1
  state.combo += 1
  state.bestCombo = Math.max(state.bestCombo, state.combo)
  state.score += word.text.length * 10 + getLevel() * 8 + state.combo * 2
  state.currentInput = ''
  refs.input.value = ''
  render()
}

function handleMissedWord(word) {
  removeWord(word.id)
  state.misses += 1
  state.combo = 0
  state.lives -= 1

  if (state.lives <= 0) {
    finishGame()
    return
  }

  render()
}

function handleInput(rawValue) {
  const value = normalizeText(rawValue)
  state.currentInput = value

  if (value.length > 0 && !state.started) {
    startGame()
  }

  const matchedWord = state.words.find((word) => normalizeText(word.text) === value)

  if (matchedWord) {
    handleSuccessfulHit(matchedWord)
    return
  }

  render()
}

function tick(now) {
  if (!state.running) {
    return
  }

  const delta = Math.min(32, now - state.lastFrame)
  state.lastFrame = now
  state.spawnAccumulator += delta

  const difficulty = DIFFICULTY[state.difficulty]

  if (state.spawnAccumulator >= difficulty.spawnMs) {
    state.spawnAccumulator = 0
    spawnWord()
  }

  const floorY = getArenaHeight() - 54
  const missedIds = []

  state.words.forEach((word) => {
    word.y += (word.speed * delta) / 1000

    if (word.y >= floorY) {
      missedIds.push(word.id)
    }
  })

  if (missedIds.length > 0) {
    missedIds.forEach((id) => {
      const word = state.words.find((item) => item.id === id)
      if (word) {
        handleMissedWord(word)
      }
    })
  }

  renderWords()

  if (state.running) {
    state.animationId = requestAnimationFrame(tick)
  }
}

function focusInput() {
  if (!state.finished) {
    refs.input.focus()
  }
}

function renderWords() {
  refs.arena.innerHTML = state.words
    .map((word) => {
      const isTarget = state.currentInput.length > 0 && normalizeText(word.text).startsWith(state.currentInput)

      return `
        <div
          class="falling-word ${isTarget ? 'is-target' : ''}"
          style="transform: translate(${word.x}px, ${word.y}px)"
        >
          ${word.text}
        </div>
      `
    })
    .join('')
}

function render() {
  refs.score.textContent = String(state.score)
  refs.combo.textContent = String(state.combo)
  refs.bestCombo.textContent = String(state.bestCombo)
  refs.cleared.textContent = String(state.cleared)
  refs.lives.textContent = String(state.lives)
  refs.level.textContent = String(getLevel())
  refs.status.textContent = getStatusText()
  refs.resetButton.textContent = state.finished ? '다시 시작' : '리셋'
  refs.modeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mode === state.mode)
  })
  refs.difficultyButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.difficulty === state.difficulty)
  })

  refs.input.disabled = state.finished

  if (!state.isComposing && refs.input.value !== state.currentInput) {
    refs.input.value = state.currentInput
  }

  renderWords()
}

function renderShell() {
  app.innerHTML = `
    <main class="shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <div class="mode-links">
            <a class="mode-link" href="/">산성비</a>
            <a class="mode-link" href="/classic.html">클래식</a>
          </div>
          <p class="eyebrow">ACID RAIN TYPING</p>
          <h1>Key Tempo</h1>
          <p class="hero-text">위에서 떨어지는 단어를 그대로 입력해서 지우는 산성비 스타일 타자게임.</p>
        </div>
        <div class="hero-metrics">
          <div class="metric-card">
            <span>점수</span>
            <strong id="score"></strong>
          </div>
          <div class="metric-card">
            <span>체력</span>
            <strong id="lives"></strong>
          </div>
          <div class="metric-card">
            <span>레벨</span>
            <strong id="level"></strong>
          </div>
        </div>
      </section>

      <section class="game-panel">
        <div class="toolbar">
          <div class="chip-group">
            <button class="chip" data-mode="ko">한글</button>
            <button class="chip" data-mode="en">영문</button>
            <button class="chip" data-mode="mixed">믹스</button>
          </div>
          <div class="chip-group">
            <button class="chip" data-difficulty="easy">${DIFFICULTY.easy.label}</button>
            <button class="chip" data-difficulty="normal">${DIFFICULTY.normal.label}</button>
            <button class="chip" data-difficulty="hard">${DIFFICULTY.hard.label}</button>
          </div>
        </div>

        <div class="arena-shell">
          <div class="arena-hud">
            <span>콤보 <strong id="combo"></strong></span>
            <span>최고 콤보 <strong id="best-combo"></strong></span>
            <span>제거 단어 <strong id="cleared"></strong></span>
          </div>
          <div class="arena" id="arena"></div>
        </div>

        <label class="input-wrap" for="typing-input">
          <span>떨어지는 단어 입력</span>
          <input
            id="typing-input"
            class="typing-input"
            type="text"
            placeholder="단어를 그대로 입력하세요"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </label>

        <div class="status-row">
          <p class="status" id="status-text"></p>
          <button class="reset-button" data-action="restart" id="reset-button">리셋</button>
        </div>
      </section>
    </main>
  `

  refs.score = document.querySelector('#score')
  refs.lives = document.querySelector('#lives')
  refs.level = document.querySelector('#level')
  refs.combo = document.querySelector('#combo')
  refs.bestCombo = document.querySelector('#best-combo')
  refs.cleared = document.querySelector('#cleared')
  refs.arena = document.querySelector('#arena')
  refs.input = document.querySelector('#typing-input')
  refs.status = document.querySelector('#status-text')
  refs.resetButton = document.querySelector('#reset-button')
  refs.modeButtons = [...document.querySelectorAll('[data-mode]')]
  refs.difficultyButtons = [...document.querySelectorAll('[data-difficulty]')]
}

function bindEvents() {
  app.addEventListener('click', (event) => {
    const target = event.target

    if (!(target instanceof HTMLElement)) {
      return
    }

    if (target.matches('[data-mode]')) {
      state.mode = target.dataset.mode
      resetGame()
      render()
      focusInput()
    }

    if (target.matches('[data-difficulty]')) {
      state.difficulty = target.dataset.difficulty
      resetGame()
      render()
      focusInput()
    }

    if (target.matches('[data-action="restart"]')) {
      resetGame()
      render()
      focusInput()
    }
  })

  refs.input.addEventListener('compositionstart', () => {
    state.isComposing = true
  })

  refs.input.addEventListener('compositionend', (event) => {
    state.isComposing = false
    handleInput(event.target.value)
  })

  refs.input.addEventListener('input', (event) => {
    if (state.isComposing) {
      return
    }

    handleInput(event.target.value)
  })

  refs.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !state.isComposing) {
      event.preventDefault()
      state.currentInput = ''
      refs.input.value = ''
      render()
    }
  })

  app.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) {
      return
    }

    if (event.key.length === 1 || event.key === 'Backspace') {
      focusInput()
    }
  })
}

renderShell()
bindEvents()
resetGame()
render()
