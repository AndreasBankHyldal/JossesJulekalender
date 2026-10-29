import type { AdventActivity } from '../data/advent'
import { Icon } from './ChristmasArt'

export function ActivityCard({ activity, description }: { activity: AdventActivity; description: string }) {
  return (
    <section className="activity-card" aria-labelledby="activity-title">
      <h3 id="activity-title" className="eyebrow">DAGENS AKTIVITET</h3>
      <div className="activity-illustration" aria-hidden="true">
        <svg viewBox="0 0 320 155" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M37 139h246" stroke="#d4c7a8" />
          <rect x="83" y="12" width="154" height="85" rx="6" fill="#c6b58c" />
          <rect x="89" y="18" width="142" height="72" rx="3" fill="#294d40" />
          <path d="M106 36h5m-2.5-2.5v5M213 64h5m-2.5-2.5v5M186 31h4m-2-2v4" stroke="#e8dfb5" />
          <circle cx="207" cy="38" r="8" fill="#e8dfb5" />
          <path d="m151 33-15 20h8l-17 20h48l-17-20h8z" fill="#9ca783" />
          <path d="m150 25 2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill="#e3c782" />
          <path d="m140 55 18 7m-22 3 26 6" stroke="#f4e3bf" strokeWidth="2" />
          <path d="M95 9c30 17 100 17 130 0" stroke="#a28753" />
          <g fill="#b54d43">
            <circle cx="111" cy="15" r="3" /><circle cx="145" cy="21" r="3" />
            <circle cx="179" cy="21" r="3" /><circle cx="211" cy="15" r="3" />
          </g>
          <rect x="64" y="89" width="192" height="42" rx="12" fill="#647558" />
          <path d="M76 131v8m168-8v8" stroke="#294d40" strokeWidth="4" />
          <rect x="54" y="107" width="212" height="25" rx="8" fill="#7b8058" />
          <rect x="80" y="95" width="35" height="25" rx="5" fill="#eee4cd" />
          <path d="m88 99 19 17m0-17-19 17" stroke="#d4c7a8" />
          <path d="M208 95h30l8 37h-44z" fill="#a34a44" />
          <path d="M208 104h32m-34 10h36m-38 10h40m-23-29v36m9-36 6 36" stroke="#dfb69b" />
          <ellipse cx="153" cy="145" rx="47" ry="5" fill="#ded4be" />
          <g stroke="#963f3d" strokeWidth="2">
            <path d="M122 126h22v13a6 6 0 0 1-6 6h-10a6 6 0 0 1-6-6z" fill="#f7f4eb" />
            <path d="M144 129h3a5 5 0 0 1 0 10h-3M161 126h22v13a6 6 0 0 1-6 6h-10a6 6 0 0 1-6-6z" fill="#f7f4eb" />
            <path d="M183 129h3a5 5 0 0 1 0 10h-3" />
          </g>
          <path d="M130 119c-5-5 5-7 0-12m39 12c-5-5 5-7 0-12" stroke="#a28753" />
          <path d="m277 47 2 5 5 2-5 2-2 5-2-5-5-2 5-2ZM44 66l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="#b69a61" />
        </svg>
      </div>
      <p className="activity-description">{description}</p>
      <ul className="activity-essentials">
        {activity.essentials.map((item, index) => <li key={index}><Icon name="sparkle" />{item}</li>)}
      </ul>
      <p className="activity-timing">{activity.timing}</p>
    </section>
  )
}
