/* ------------------------------------------------------------------
   Music note icon — a hand-drawn heart-note with a curly flag, drawn
   in white to sit on the pastel dock button. While music plays, two
   little sound waves pulse beside it.
   ------------------------------------------------------------------ */

export default function MusicNoteIcon({ playing }) {
  return (
    <svg viewBox="0 0 40 40" width="27" height="27" aria-hidden="true" focusable="false">
      {/* heart notehead */}
      <path
        d="M 12 21.5 C 9.2 17.6 4.4 18.8 4.4 22.7 C 4.4 25.8 12 31 12 31 C 12 31 19.6 25.8 19.6 22.7 C 19.6 18.8 14.8 17.6 12 21.5 Z"
        fill="#ffffff"
      />
      {/* stem */}
      <path
        d="M 16 20.5 L 18.8 6.5"
        stroke="#ffffff"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* flag */}
      <path
        d="M 18.8 6.5 C 22.6 8.6 23.4 12.2 21.2 15.8"
        stroke="#ffffff"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      {playing && (
        <g className="music-note-waves">
          <path
            d="M 25.5 9 C 28 11 28 15 25.5 17.5"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 29.5 6 C 33.5 9.5 33.5 16.5 29.5 20"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}
    </svg>
  );
}
