// src/games/Valorant3D2/systems/SoundSystem.js

class SoundSystem {
  constructor() {
    this.ctx = null
    this.enabled = true
    this.volume = 0.5
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val))
  }

  play(type, customParams = {}) {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return
      const now = this.ctx.currentTime

      switch (type) {
        case 'vandal':
        case 'guardian': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(340, now)
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.15)
          gain.gain.setValueAtTime(0.4 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.15)
          break
        }
        case 'phantom':
        case 'ghost':
        case 'spectre': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(400, now)
          osc.frequency.exponentialRampToValueAtTime(50, now + 0.09)
          gain.gain.setValueAtTime(0.28 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.09)
          break
        }
        case 'sheriff': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(260, now)
          osc.frequency.exponentialRampToValueAtTime(20, now + 0.22)
          gain.gain.setValueAtTime(0.5 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.22)
          break
        }
        case 'operator': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(120, now)
          osc.frequency.exponentialRampToValueAtTime(10, now + 0.5)
          gain.gain.setValueAtTime(0.7 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.5)
          break
        }
        case 'headshot': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(1400, now)
          osc.frequency.setValueAtTime(2200, now + 0.03)
          gain.gain.setValueAtTime(0.55 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.24)
          break
        }
        case 'hit': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(200, now)
          osc.frequency.exponentialRampToValueAtTime(70, now + 0.08)
          gain.gain.setValueAtTime(0.3 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.08)
          break
        }
        case 'spike_plant': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'square'
          osc.frequency.setValueAtTime(520, now)
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35)
          gain.gain.setValueAtTime(0.35 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.35)
          break
        }
        case 'spike_beep': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(980, now)
          gain.gain.setValueAtTime(0.3 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.06)
          break
        }
        case 'spike_defused': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(523, now)
          osc.frequency.setValueAtTime(659, now + 0.1)
          osc.frequency.setValueAtTime(784, now + 0.2)
          osc.frequency.setValueAtTime(1046, now + 0.3)
          gain.gain.setValueAtTime(0.45 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.6)
          break
        }
        case 'explosion': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(80, now)
          osc.frequency.exponentialRampToValueAtTime(15, now + 0.8)
          gain.gain.setValueAtTime(0.8 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.8)
          break
        }
        case 'dash': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(500, now)
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.2)
          gain.gain.setValueAtTime(0.35 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.2)
          break
        }
        case 'flash': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(1200, now)
          osc.frequency.setValueAtTime(300, now + 0.05)
          gain.gain.setValueAtTime(0.4 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.2)
          break
        }
        case 'recon': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(440, now)
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.25)
          gain.gain.setValueAtTime(0.3 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.25)
          break
        }
        case 'ult_activate': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(150, now)
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.5)
          gain.gain.setValueAtTime(0.6 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.7)
          break
        }
        case 'buy': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(700, now)
          osc.frequency.setValueAtTime(1100, now + 0.05)
          gain.gain.setValueAtTime(0.25 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.12)
          break
        }
        case 'round_won': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(523, now)
          osc.frequency.setValueAtTime(659, now + 0.15)
          osc.frequency.setValueAtTime(784, now + 0.3)
          osc.frequency.setValueAtTime(1046, now + 0.45)
          gain.gain.setValueAtTime(0.5 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.9)
          break
        }
        case 'round_lost': {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(300, now)
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.6)
          gain.gain.setValueAtTime(0.4 * this.volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
          osc.connect(gain); gain.connect(this.ctx.destination)
          osc.start(now); osc.stop(now + 0.6)
          break
        }
        default:
          break
      }
    } catch (e) {
      console.warn('Audio play error:', e)
    }
  }
}

export const soundManager = new SoundSystem()
