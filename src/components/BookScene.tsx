export function BookScene() {
  return (
    <svg className="book-scene" viewBox="0 0 300 250" fill="none" aria-hidden="true">
      <circle cx="154" cy="127" r="96" fill="#e5ebd3" />
      <circle cx="222" cy="56" r="26" fill="#f1c976" />
      <path
        d="M50 184c-13-40-12-65-1-89 18 19 28 47 19 78M67 183c-2-44 17-69 36-77 3 34-10 59-30 78"
        fill="#95b394"
      />
      <path d="M49 111l19 75m27-64-24 65" stroke="#56856b" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="154" cy="210" rx="106" ry="9" fill="#56775d" opacity=".1" />
      <path
        d="M78 97c31-6 62 5 77 21 18-18 47-23 75-18v99c-29-7-53-2-75 12-22-15-46-22-77-15V97Z"
        fill="#38765b"
        stroke="#24583e"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M82 90c28-4 54 6 72 23v90c-26-16-47-19-72-15V90Z" fill="#fffdf3" />
      <path d="M156 113c20-15 41-24 68-20v98c-26-5-46 0-68 12v-90Z" fill="#f4edda" />
      <path
        d="M95 117c17 0 28 5 43 13m-43 3c15 1 29 7 43 14m-43 2c16 1 29 8 43 14m33-33c12-7 24-10 37-10m-37 26c13-7 25-11 37-10m-37 26c12-6 24-9 37-9"
        stroke="#c3cbb0"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M191 95v37l9-7 8 3V92" fill="#d68d5c" />
      <path
        d="m55 56 3 8 9 3-9 3-3 9-3-9-9-3 9-3 3-8Zm186 100 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"
        fill="#56856b"
      />
      <rect
        x="62"
        y="38"
        width="112"
        height="36"
        rx="12"
        fill="white"
        transform="rotate(-7 62 38)"
      />
      <text
        x="77"
        y="61"
        fill="#37664e"
        fontSize="12"
        fontFamily="Georgia, serif"
        transform="rotate(-7 77 61)"
      >
        Hello, future me.
      </text>
    </svg>
  )
}
