import { useState } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import Landing from './pages/Landing'
import GuessArena from './components/GuessArena'

export default function App() {
  const [entered, setEntered] = useState(false)
  const account = useCurrentAccount()

  if (!entered) {
    return <Landing onEnter={() => setEntered(true)} />
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <h2>NFTFlip</h2>
        <button className="ghost" onClick={() => setEntered(false)}>Back</button>
      </header>
      {account ? (
        <GuessArena account={{ address: account.address }} />
      ) : (
        <div className="empty">Connect wallet from landing page to start.</div>
      )}
    </main>
  )
}
