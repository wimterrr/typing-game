import './style.css'

const TEXT_BANK = {
  ko: [
    '오늘의 리듬은 손끝에서 시작되고 화면 위에서 완성된다.',
    '비가 오는 저녁에는 기계식 키보드 소리가 더 또렷하게 들린다.',
    '빠르게 치는 것보다 정확하게 끝까지 밀고 가는 집중력이 더 중요하다.',
    '짧은 문장 하나를 완벽하게 입력하는 순간이 생각보다 꽤 짜릿하다.',
    '실수는 금방 지나가지만 콤보는 끝까지 플레이어를 들뜨게 만든다.',
  ],
  en: [
    'Fast fingers win rounds, but clean focus wins the whole session.',
    'Every accurate keystroke builds momentum like a drum fill before the chorus.',
    'Typing games feel simple until the timer starts hunting every small mistake.',
    'Stay calm, keep rhythm, and let precision outrun raw panic speed.',
    'A perfect line is less about force and more about consistent control.',
  ],
  mixed: [
    'Hello rhythm, 오늘도 정확도가 속도를 이긴다.',
    'Combo를 지키려면 fast 보다 steady 한 손이 필요하다.',
    '오늘의 목표는 clean typing, 그리고 끝까지 zero quit.',
    '타자는 speed game 같지만 결국은 focus battle 이다.',
    '마지막 10초에는 calm mind 와 quick hands 가 답이다.',
  ],
}

const app = document.querySelector('#app')

const state = {
  mode: 'ko',
  duration: 60,
  timeLeft: 60,
  timerId: null,
  running: false,
  finished: false,
  currentText: '',
  currentInput: '',
  completed: 0,
  mistakes: 0,
  correctChars: 0,
  typedChars: 0,
  combo: 0,
  bestCombo: 0,
  score: 0,
  startedAt: null,
  lineHadMistake: false,
}

const bestScoreKey = 'key-tempo-best-score'

function getBestScore() {
  return Number(window.localStorage.getItem(bestScoreKey) || 0)
}

function setBestScore(score) {
  const next = Math.max(getBestScore(), score)
  window.localStorage.setItem(bestScoreKey, String(next))
  return next
}

function pickText(mode, previous) {
  const bank = TEXT_BANK[mode]
  const filtered = bank.filter((text) => text !== previous)
  const pool = filtered.length > 0 ? filtered : bank
  return pool[Math.floor(Math.random() * pool.length)]
}

function formatTime(value) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

function getAccuracy() {
  if (state.typedChars === 0) {
    return 100
  }

  return Math.max(0, Math.round((state.correctChars / state.typedChars) * 100))
}

function getSpeed() {
  const elapsed = state.startedAt ? Math.max(1, (Date.now() - state.startedAt) / 1000) : 1
  return Math.round((state.correctChars / 5) * (60 / elapsed))
}

function getProgress() {
  return Math.max(0, Math.min(100, Math.round(((state.duration - state.timeLeft) / state.duration) * 100)))
}

function buildHighlightedText() {
  return state.currentText
    .split('')
    .map((char, index) => {
      const typed = state.currentInput[index]

      if (typed == null) {
        return `<span>${escapeHtml(char)}</span>`
      }

      if (typed === char) {
        return `<span class="is-correct">${escapeHtml(char)}</span>`
      }

      return `<span class="is-wrong">${escapeHtml(char)}</span>`
    })
    .join('')
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function resetMetrics() {
  state.timeLeft = state.duration
  state.running = false
  state.finished = false
  state.currentInput = ''
  state.completed = 0
  state.mistakes = 0
  state.correctChars = 0
  state.typedChars = 0
  state.combo = 0
  state.bestCombo = 0
  state.score = 0
  state.startedAt = null
  state.lineHadMistake = false
  state.currentText = pickText(state.mode, state.currentText)
  clearInterval(state.timerId)
  state.timerId = null
}

function startTimer() {
  if (state.running || state.finished) {
    return
  }

  state.running = true
  state.startedAt = Date.now()
  state.timerId = window.setInterval(() => {
    state.timeLeft -= 1

    if (state.timeLeft <= 0) {
      finishGame()
      return
    }

    render()
  }, 1000)
}

function finishGame() {
  clearInterval(state.timerId)
  state.timerId = null
  state.timeLeft = 0
  state.running = false
  state.finished = true
  setBestScore(state.score)
  render()
}

function handleInput(value) {
  if (state.finished) {
    return
  }

  if (!state.running && value.length > 0) {
    startTimer()
  }

  const previousInput = state.currentInput

  if (value.length > previousInput.length) {
    value
      .slice(previousInput.length)
      .split('')
      .forEach((char, offset) => {
        const index = previousInput.length + offset
        state.typedChars += 1

        if (char === state.currentText[index]) {
          state.correctChars += 1
        } else {
          state.mistakes += 1
          state.lineHadMistake = true
        }
      })
  }

  state.currentInput = value

  if (value === state.currentText) {
    state.completed += 1
    state.combo = state.lineHadMistake ? 0 : state.combo + 1
    state.bestCombo = Math.max(state.bestCombo, state.combo)
    state.score += state.currentText.length * 4 + (state.lineHadMistake ? 0 : 30)
    state.currentInput = ''
    state.lineHadMistake = false
    state.currentText = pickText(state.mode, state.currentText)
  }

  render()
}

function bindEvents() {
  app.addEventListener('click', (event) => {
    const target = event.target

    if (!(target instanceof HTMLElement)) {
      return
    }

    if (target.matches('[data-mode]')) {
      state.mode = target.dataset.mode
      resetMetrics()
      render()
      focusInput()
    }

    if (target.matches('[data-duration]')) {
      state.duration = Number(target.dataset.duration)
      resetMetrics()
      render()
      focusInput()
    }

    if (target.matches('[data-action="restart"]')) {
      resetMetrics()
      render()
      focusInput()
    }
  })

  app.addEventListener('input', (event) => {
    const target = event.target

    if (target instanceof HTMLTextAreaElement && target.id === 'typing-input') {
      handleInput(target.value)
    }
  })

  app.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLTextAreaElement) {
      return
    }

    if (event.key.length === 1 || event.key === 'Backspace') {
      focusInput()
    }
  })
}

function focusInput() {
  const input = document.querySelector('#typing-input')

  if (input instanceof HTMLTextAreaElement && !state.finished) {
    input.focus()
  }
}

function render() {
  const bestScore = getBestScore()
  const accuracy = getAccuracy()
  const speed = getSpeed()
  const shouldRefocus = document.activeElement instanceof HTMLTextAreaElement
  const status = state.finished
    ? '시간 종료. 다시 눌러 최고 점수를 갱신해보세요.'
    : state.running
      ? '리듬을 유지하세요. 실수하면 콤보가 끊깁니다.'
      : '입력을 시작하는 순간 타이머가 작동합니다.'

  app.innerHTML = `
    <main class="shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <p class="eyebrow">ARCADE TYPING</p>
          <h1>Key Tempo</h1>
          <p class="hero-text">웹에 바로 올릴 수 있는, 한국어와 영어를 섞은 반응형 타자게임.</p>
        </div>
        <div class="hero-metrics">
          <div class="metric-card">
            <span>남은 시간</span>
            <strong>${formatTime(state.timeLeft)}</strong>
          </div>
          <div class="metric-card">
            <span>속도</span>
            <strong>${speed} WPM</strong>
          </div>
          <div class="metric-card">
            <span>정확도</span>
            <strong>${accuracy}%</strong>
          </div>
        </div>
      </section>

      <section class="game-panel">
        <div class="toolbar">
          <div class="chip-group">
            <button class="chip ${state.mode === 'ko' ? 'is-active' : ''}" data-mode="ko">한글</button>
            <button class="chip ${state.mode === 'en' ? 'is-active' : ''}" data-mode="en">영문</button>
            <button class="chip ${state.mode === 'mixed' ? 'is-active' : ''}" data-mode="mixed">믹스</button>
          </div>
          <div class="chip-group">
            <button class="chip ${state.duration === 30 ? 'is-active' : ''}" data-duration="30">30초</button>
            <button class="chip ${state.duration === 60 ? 'is-active' : ''}" data-duration="60">60초</button>
            <button class="chip ${state.duration === 90 ? 'is-active' : ''}" data-duration="90">90초</button>
          </div>
        </div>

        <div class="progress-track" aria-hidden="true">
          <div class="progress-bar" style="width: ${getProgress()}%"></div>
        </div>

        <div class="prompt-box" aria-live="polite">${buildHighlightedText()}</div>

        <label class="input-wrap" for="typing-input">
          <span>입력창</span>
          <textarea
            id="typing-input"
            rows="4"
            placeholder="여기에 그대로 입력하세요"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            ${state.finished ? 'disabled' : ''}
          ></textarea>
        </label>

        <div class="status-row">
          <p class="status">${status}</p>
          <button class="reset-button" data-action="restart">${state.finished ? '다시 시작' : '리셋'}</button>
        </div>
      </section>

      <section class="stats-grid">
        <article class="stat-panel">
          <span>점수</span>
          <strong>${state.score}</strong>
        </article>
        <article class="stat-panel">
          <span>완료 문장</span>
          <strong>${state.completed}</strong>
        </article>
        <article class="stat-panel">
          <span>현재 콤보</span>
          <strong>${state.combo}</strong>
        </article>
        <article class="stat-panel">
          <span>최고 콤보</span>
          <strong>${state.bestCombo}</strong>
        </article>
        <article class="stat-panel">
          <span>실수</span>
          <strong>${state.mistakes}</strong>
        </article>
        <article class="stat-panel accent">
          <span>베스트 점수</span>
          <strong>${Math.max(bestScore, state.score)}</strong>
        </article>
      </section>
    </main>
  `

  const input = document.querySelector('#typing-input')

  if (input instanceof HTMLTextAreaElement) {
    input.value = state.currentInput

    if (shouldRefocus && !state.finished) {
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    }
  }
}

resetMetrics()
bindEvents()
render()
