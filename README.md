# Work Track

A small workout app that keeps track of which set you're on and runs a rest timer between sets.

**Live demo:** https://YOUR-USERNAME.github.io/work-track/

<!-- Add a screenshot or short GIF here, e.g. ![screenshot](screenshot.png) -->

## Why I built this

While training I noticed that people around me (and I) often lose count of the set they're on, especially between heavy sets. Phone apps for this are usually too complicated or full of features I don't need. I wanted something simple: tell me which set I'm on, let me confirm it, and tell me when to start the next one.

## What it does

- Shows the current exercise and set (for example 2 / 4)
- Confirm a set when you finish it, with an undo button for misclicks
- Starts a rest timer automatically after each set
- When the timer ends: alarm sound, vibration (on devices that support it) and a screen change
- Timer can be adjusted during rest (-15 s / +15 s / skip)
- Add your own exercises with a set count and a rest time for each one
- Your data stays in the browser (localStorage), so it's still there after you close the page

## How to run it

It's a single HTML file, no build step and no dependencies.

1. Download `index.html`
2. Open it in a browser

On a phone, open the live demo link and add it to the home screen (on iPhone: Safari -> Share -> Add to Home Screen).

## Known limitations

- iOS Safari doesn't support the Vibration API, so on iPhone you only get sound and the visual alert.
- If the phone screen locks or the browser goes to the background, the alarm may not play. The timer itself stays correct because it uses an end timestamp instead of counting ticks, but you won't be notified until you open the page again.
- No workout history yet, only the current session is stored.

These are the main reasons I'd consider a native version later.

## Roadmap

- [ ] Workout history
- [ ] Log weight and reps per set
- [ ] PWA support (offline use, proper install)
- [ ] Native mobile version (iOS and Android)

## Tech

Plain HTML, CSS and JavaScript. Web Audio API for the alarm, Vibration API where available, localStorage for saving data.

## About

Built by Ege, an electrical and electronics engineer working in industrial automation, as a personal project while improving my software skills.

## License

MIT
