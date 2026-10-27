import type { ChristmasArtKind } from '../data/advent'

export function ChristmasArt({ kind }: { kind: ChristmasArtKind }) {
  return (
    <svg viewBox="0 0 100 80" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'bow' ? <>
        <path d="M47 36C25 7 11 19 23 35c6 7 16 6 24 1ZM53 36C75 7 89 19 77 35c-6 7-16 6-24 1Z" />
        <path d="M45 37c-3 15-8 22-18 25l4-13-10-2c13-2 17-6 22-11M55 37c3 15 8 22 18 25l-4-13 10-2c-13-2-17-6-22-11" />
        <ellipse cx="50" cy="36" rx="6" ry="5" /><path d="M26 27c5 0 13 3 19 8M74 27c-5 0-13 3-19 8" />
      </> : null}
      {kind === 'star' ? <>
        <path d="m50 9 10 21 24 4-17 17 4 24-21-12-21 12 4-24-17-17 24-4Z" />
        <path d="m50 20 7 15 17 3-12 11 3 17-15-8-15 8 3-17-12-11 17-3Z" strokeWidth=".8" />
      </> : null}
      {kind === 'tree' ? <>
        <path d="m50 15-16 20h8L27 52h12L23 68h54L61 52h12L58 35h8L50 15ZM50 68v8" />
        <path d="m50 3 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1Z" />
        <path d="M41 39c7 3 12 5 20 5M35 55c11 5 19 6 31 5" />
        <circle cx="45" cy="30" r="1.5" fill="currentColor" /><circle cx="53" cy="52" r="1.5" fill="currentColor" />
      </> : null}
      {kind === 'heart' ? <>
        <path d="M50 66S17 47 20 29c3-17 24-18 30-3 6-15 27-14 30 3 3 18-30 37-30 37Z" />
        <path d="M29 32c0-6 4-9 9-9M19 11l-4-5M81 11l4-5M10 40H4M90 40h6" />
      </> : null}
      {kind === 'ornament' ? <>
        <path d="M50 0v15M44 21v-6h12v6M41 22h18" />
        <circle cx="50" cy="47" r="25" />
        <path d="M26 42c17 10 31 10 48 0M26 52c17 10 31 10 48 0M50 22c-12 15-12 35 0 50M50 22c12 15 12 35 0 50" />
        <path d="m71 11 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
      </> : null}
      {kind === 'snowflake' ? <>
        <path d="M50 9v62M23 24l54 32M23 56l54-32M43 15l7 7 7-7M43 65l7-7 7 7M25 33l10-3-2-10M67 60l-2-10 10-3M25 47l10 3-2 10M67 20l-2 10 10 3" />
        <path d="m50 30 9 5v10l-9 5-9-5V35Z" />
      </> : null}
      {kind === 'gift' ? <>
        <path d="M25 37h50v34H25zM21 27h58v12H21zM46 27h8v44M50 27C29 27 26 9 37 11c9 1 13 16 13 16ZM50 27S54 12 63 11c11-2 8 16-13 16Z" />
        <path d="m70 8 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z" />
      </> : null}
      {kind === 'sprig' ? <>
        <path d="M26 69c13-16 26-29 46-54M38 54C19 56 18 43 21 39c11 0 17 6 17 15ZM49 42C31 42 32 28 35 25c10 2 15 8 14 17ZM59 29C47 27 48 15 52 12c8 4 11 9 7 17ZM44 48c0-16 14-18 19-16 0 11-7 16-19 16ZM57 34c1-14 14-15 18-12-1 9-7 13-18 12ZM69 18c-2-9 7-16 12-15 2 8-2 13-12 15Z" />
        <circle cx="28" cy="26" r="3" /><circle cx="22" cy="20" r="2" /><circle cx="72" cy="45" r="3" />
      </> : null}
    </svg>
  )
}

export function Icon({ name }: { name: 'lock' | 'heart' | 'sparkle' | 'check' | 'close' | 'arrow' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'lock' ? <><rect x="6" y="10" width="12" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" /></> : null}
      {name === 'heart' ? <path d="M12 20S3 14.5 3 8.5a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 6-9 11.5-9 11.5Z" /> : null}
      {name === 'sparkle' ? <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /><path d="M20 2v4M18 4h4" /></> : null}
      {name === 'check' ? <path d="m5 12 4 4L19 6" /> : null}
      {name === 'close' ? <path d="m6 6 12 12M6 18 18 6" /> : null}
      {name === 'arrow' ? <path d="M19 12H5m6-6-6 6 6 6" /> : null}
    </svg>
  )
}

export function PineBranch() {
  return (
    <svg viewBox="0 0 260 290" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 7c41 83 92 156 206 244M41 61 8 51M55 84 11 78M71 106l-53-4M89 129l-62 2M110 151l-66 10M132 174l-64 17M156 196l-58 24M180 218l-53 29M47 71l3-43M63 96l9-45M82 121l14-51M101 143l24-52M124 166l29-48M147 190l34-47M170 210l41-39M192 232l42-31" />
        <path d="m32 42-19-3M43 62l-29-2M59 86l-35 3M77 109l-42 9M96 133l-46 17M120 159l-45 21M145 183l-40 27M169 207l-39 33M37 50l-1-27M53 76l4-35M72 102l9-37M91 125l16-40M114 151l23-42M138 176l27-40M160 199l32-34M183 223l37-28" opacity=".65" />
      </g>
      <g fill="#a4423d">
        <circle cx="66" cy="127" r="5" /><circle cx="75" cy="137" r="4" /><circle cx="62" cy="140" r="4" />
        <circle cx="151" cy="156" r="5" /><circle cx="159" cy="147" r="4" /><circle cx="162" cy="160" r="4" />
      </g>
    </svg>
  )
}
