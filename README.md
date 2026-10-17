# Braille Quiz

A small game to learn to read Braille (English Grade 1), one row of the alphabet at a time, against the clock.

Braille letters are learned in three rows:

- **a – j** — the 10 base shapes, using only the top 4 dots.
- **k – t** — the same shapes as a – j, plus **dot 3**.
- **u – z** — the same shapes as a – e, plus **dots 3 & 6**. The exception is **w** (j + dot 6), added to Braille later.

## Levels

| Level | Letters | Cheat sheet |
| ----- | ------- | ----------- |
| 0     | your name in Braille (no quiz, no timer) | — |
| 1     | a – j   | yes         |
| 2     | a – j   | no          |
| 3     | a – t   | yes         |
| 4     | a – t   | no          |
| 5     | a – z   | yes         |
| 6     | a – z   | no          |

Each round shows 10 words written in Braille; type each word to move on (it's accepted as soon as it matches). Levels 3–6 only use words containing at least one of the newly introduced letters.

The timer runs for the whole round. Skipping a word adds 10s, peeking at the cheat sheet in a no-cheat level adds 5s. Best times are saved in the browser (localStorage).

## Run

No build step — open `index.html` in a browser, or serve the folder:

```
npx serve .
```

## Files

- `index.html` — screens (levels, game, results)
- `css/braille-quiz.css` — styles (light & dark)
- `js/braille-quiz.js` — game logic and Braille rendering
- `js/words.js` — word bank (add words freely; each level filters by letters)

## Related projects

- [Braille-Tools](https://github.com/evoluteur/braille-tools) — CSS and JavaScript library for displaying Braille in web pages ([live demo](https://evoluteur.github.io/braille-tools/index.html)).
- [Braille-Text](https://github.com/evoluteur/braille-text) — Braille on web pages with hover effect for translation ([live demo](https://evoluteur.github.io/braille-text/index.html)).

## License

MIT. (c) 2026 [Olivier Giulieri](https://evoluteur.github.io/)
