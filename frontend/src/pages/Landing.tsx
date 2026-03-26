import { ConnectButton } from '@mysten/dapp-kit'

interface LandingProps {
  onEnter: () => void
}

export default function Landing({ onEnter }: LandingProps) {
  return (
    <section className="landing">
      <div className="landing-glow" />
      <h1>NFTFlip</h1>
      <p>
        Mint randomized collectible outcomes on-chain with transparent rarity distribution.
        Every flip is verifiable and permanently recorded.
      </p>
      <div className="landing-actions">
        <ConnectButton />
        <button className="cta" onClick={onEnter}>Enter NFTFlip Arena</button>
      </div>
      <div className="landing-meta">Common · Rare · Epic · Provably fair outcomes</div>
    </section>
  )
}
