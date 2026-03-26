import './classic.css'

const TEXT_BANK = {
  ko: [
    '오늘의 리듬은 손끝에서 시작되고 화면 위에서 완성된다.',
    '비가 오는 저녁에는 기계식 키보드 소리가 더 또렷하게 들린다.',
    '빠르게 치는 것보다 정확하게 끝까지 밀고 가는 집중력이 더 중요하다.',
    '짧은 문장 하나를 완벽하게 입력하는 순간이 생각보다 꽤 짜릿하다.',
    '실수는 금방 지나가지만 콤보는 끝까지 플레이어를 들뜨게 만든다.',
    '알잘딱깔센으로 끝내고 퇴근하는 날은 이상하게 자신감이 오른다.',
    '킹받는 일이 있어도 타자는 침착하게 치는 사람이 결국 이긴다.',
    '오늘은 갓생 모드로 들어가서 미뤄둔 일들을 하나씩 정리해본다.',
    '스불재 같은 상황도 막상 하나씩 치워내면 생각보다 금방 풀린다.',
    '만반잘부 한마디만 봐도 요즘 인터넷 말투가 바로 느껴질 때가 있다.',
    '메불메 갈리는 취향도 막상 얘기해보면 의외로 겹치는 지점이 많다.',
    '내또출인 걸 알면서도 밤새 떠드는 건 묘하게 끊기지 않는 재미가 있다.',
    '들추날추 같은 말은 팬덤의 과몰입이 얼마나 빠르게 밈이 되는지 보여준다.',
    '토마토코어 같은 표현은 요즘 스타일 얘기가 거의 밈처럼 굴러간다는 뜻이다.',
    '갑분싸가 되지 않게 눈치 보면서도 결국 TMI를 흘리는 사람이 꼭 있다.',
    '최애 얘기가 시작되면 덕질의 온도와 말투가 순식간에 달라지는 걸 느낀다.',
    '입덕은 순식간인데 탈덕은 늘 서사와 떡밥이 길게 남는 편이다.',
    '스밍과 포카와 직찍 얘기가 한 번 열리면 팬덤어는 거의 외국어처럼 들린다.',
    '칼퇴를 꿈꾸지만 회의실에서 보고자료와 메일회신이 끝없이 늘어나는 날도 있다.',
    '연차 다음 날의 업무공유는 늘 많고 퇴근각은 생각보다 늦게 잡히곤 한다.',
  ],
  en: [
    'Fast fingers win rounds, but clean focus wins the whole session.',
    'Every accurate keystroke builds momentum like a drum fill before the chorus.',
    'Typing games feel simple until the timer starts hunting every small mistake.',
    'Stay calm, keep rhythm, and let precision outrun raw panic speed.',
    'A perfect line is less about force and more about consistent control.',
    'Some trends burn out fast, but the best meme words still sound sharp in chat.',
    'A good typing run feels like catching the exact rhythm of a fast group conversation.',
    'Even a short phrase can feel fresh when the internet suddenly decides it is the word.',
    'The cleanest score usually comes from calm timing and not from frantic speed.',
    'A strong combo feels better when the phrase itself sounds current and a little chaotic.',
  ],
  mixed: [
    'Hello rhythm, 오늘도 정확도가 속도를 이긴다.',
    'Combo를 지키려면 fast 보다 steady 한 손이 필요하다.',
    '오늘의 목표는 clean typing, 그리고 끝까지 zero quit.',
    '타자는 speed game 같지만 결국은 focus battle 이다.',
    '마지막 10초에는 calm mind 와 quick hands 가 답이다.',
    '토마토코어 vibe 가 돌 때도 typing rhythm 은 surprisingly steady 해야 한다.',
    '만반잘부 한마디로 시작된 chat 이 갑자기 밈 배틀로 번질 때가 있다.',
    '들추날추 level 로 과몰입해도 손은 calm 하게 움직여야 점수가 오른다.',
    '독파민 채우듯 한 줄씩 넘기다 보면 combo 가 은근히 길게 이어진다.',
    '메불메 갈릴 문장도 beat 에 맞춰 치면 strangely fun 해진다.',
    '최애 서사 얘기로 입덕한 사람은 no joke 떡밥 정리에 진심이 된다.',
    '칼퇴를 꿈꾸지만 회의실 일정이 또 잡히면 mood 가 바로 달라진다.',
    '포카 얘기하다가 갑분싸 되지 않으려면 chat flow 를 잘 읽어야 한다.',
    '퇴근각 보일 때 메일회신이 오면 vibe 가 한순간에 뒤집히는 법이다.',
    'TMI 한 스푼과 덕질 한 스푼이 섞이면 thread 가 surprisingly 길어진다.',
  ],
}

const bestScoreKey = 'key-tempo-classic-best-score'
const app = document.querySelector('#app')
const refs = {}

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
  isComposing: false,
}

function getBestScore() {
  return Number(window.localStorage.getItem(bestScoreKey) || 0)
}

function setBestScore(score) {
  const next = Math.max(getBestScore(), score)
  window.localStorage.setItem(bestScoreKey, String(next))
  return next
}

function normalizeText(value) {
  return value.normalize('NFC')
}

function pickText(mode, previous) {
  const bank = TEXT_BANK[mode]
  const filtered = bank.filter((text) => text !== previous)
  const pool = filtered.length > 0 ? filtered : bank
  return normalizeText(pool[Math.floor(Math.random() * pool.length)])
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

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
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
  state.isComposing = false
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

function handleInput(rawValue) {
  const value = normalizeText(rawValue)

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

function focusInput() {
  if (!state.finished) {
    refs.input.focus()
    window.setTimeout(() => {
      refs.input.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }, 120)
  }
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
          <p class="eyebrow">TERMINAL PRACTICE MODE</p>
          <h1>Key Tempo</h1>
          <p class="hero-text">터미널 로그를 정리하듯 문장을 따라 치면서 속도와 정확도를 겨루는 클래식 모드.</p>
        </div>
        <div class="hero-metrics">
          <div class="metric-card">
            <span>남은 시간</span>
            <strong id="time-left"></strong>
          </div>
          <div class="metric-card">
            <span>속도</span>
            <strong id="speed"></strong>
          </div>
          <div class="metric-card">
            <span>정확도</span>
            <strong id="accuracy"></strong>
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
            <button class="chip" data-duration="30">30초</button>
            <button class="chip" data-duration="60">60초</button>
            <button class="chip" data-duration="90">90초</button>
          </div>
        </div>

        <div class="progress-track" aria-hidden="true">
          <div class="progress-bar" id="progress-bar"></div>
        </div>

        <div class="prompt-box" id="prompt-box" aria-live="polite"></div>

        <div class="mobile-dock">
          <label class="input-wrap" for="typing-input">
            <span>입력창</span>
            <textarea
              id="typing-input"
              rows="4"
              enterkeyhint="enter"
              placeholder="여기에 그대로 입력하세요"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
            ></textarea>
          </label>

          <div class="status-row">
            <p class="status" id="status-text"></p>
            <button class="reset-button" id="reset-button" data-action="restart">리셋</button>
          </div>
        </div>
      </section>

      <section class="stats-grid">
        <article class="stat-panel">
          <span>점수</span>
          <strong id="score"></strong>
        </article>
        <article class="stat-panel">
          <span>완료 문장</span>
          <strong id="completed"></strong>
        </article>
        <article class="stat-panel">
          <span>현재 콤보</span>
          <strong id="combo"></strong>
        </article>
        <article class="stat-panel">
          <span>최고 콤보</span>
          <strong id="best-combo"></strong>
        </article>
        <article class="stat-panel">
          <span>실수</span>
          <strong id="mistakes"></strong>
        </article>
        <article class="stat-panel accent">
          <span>베스트 점수</span>
          <strong id="best-score"></strong>
        </article>
      </section>
    </main>
  `

  refs.timeLeft = document.querySelector('#time-left')
  refs.speed = document.querySelector('#speed')
  refs.accuracy = document.querySelector('#accuracy')
  refs.progressBar = document.querySelector('#progress-bar')
  refs.promptBox = document.querySelector('#prompt-box')
  refs.input = document.querySelector('#typing-input')
  refs.statusText = document.querySelector('#status-text')
  refs.resetButton = document.querySelector('#reset-button')
  refs.score = document.querySelector('#score')
  refs.completed = document.querySelector('#completed')
  refs.combo = document.querySelector('#combo')
  refs.bestCombo = document.querySelector('#best-combo')
  refs.mistakes = document.querySelector('#mistakes')
  refs.bestScore = document.querySelector('#best-score')
  refs.modeButtons = [...document.querySelectorAll('[data-mode]')]
  refs.durationButtons = [...document.querySelectorAll('[data-duration]')]
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

  refs.promptBox.addEventListener('pointerdown', (event) => {
    const target = event.target

    if (target instanceof HTMLElement && target.closest('button, textarea, a')) {
      return
    }

    focusInput()
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

function render() {
  const bestScore = getBestScore()
  const status = state.finished
    ? '시간 종료. 다시 눌러 최고 점수를 갱신해보세요.'
    : state.running
      ? '리듬을 유지하세요. 실수하면 콤보가 끊깁니다.'
      : '입력을 시작하는 순간 타이머가 작동합니다.'

  refs.timeLeft.textContent = formatTime(state.timeLeft)
  refs.speed.textContent = `${getSpeed()} WPM`
  refs.accuracy.textContent = `${getAccuracy()}%`
  refs.progressBar.style.width = `${getProgress()}%`
  refs.promptBox.innerHTML = buildHighlightedText()
  refs.statusText.textContent = status
  refs.resetButton.textContent = state.finished ? '다시 시작' : '리셋'
  refs.score.textContent = String(state.score)
  refs.completed.textContent = String(state.completed)
  refs.combo.textContent = String(state.combo)
  refs.bestCombo.textContent = String(state.bestCombo)
  refs.mistakes.textContent = String(state.mistakes)
  refs.bestScore.textContent = String(Math.max(bestScore, state.score))

  refs.modeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mode === state.mode)
  })

  refs.durationButtons.forEach((button) => {
    button.classList.toggle('is-active', Number(button.dataset.duration) === state.duration)
  })

  refs.input.disabled = state.finished

  if (!state.isComposing && refs.input.value !== state.currentInput) {
    refs.input.value = state.currentInput
  }
}

renderShell()
bindEvents()
resetMetrics()
render()
