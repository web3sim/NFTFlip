import { useEffect, useMemo, useState } from 'react'
import { useSignTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { PACKAGE_ID, objectUrl, txUrl } from '../config/network'
import './GuessArena.css'

interface Props {
  account: { address: string }
}

type FlipItem = {
  player?: string
  rarity?: number | string
  nonce?: number | string
}

type MachineFields = {
  creator?: string
  total_mints?: number | string
  flips?: FlipItem[]
}

type MachineSummary = {
  id: string
  creator?: string
  digest?: string
}

const n = (v: number | string | undefined) => Number(v ?? 0)
const isHexObjectId = (v: string) => /^0x[0-9a-fA-F]{64}$/.test(v.trim())
const looksLikeTxDigest = (v: string) => !v.startsWith('0x') && /^[1-9A-HJ-NP-Za-km-z]{43,64}$/.test(v.trim())

const rarityLabel = (r: number) => {
  if (r === 2) return 'Epic'
  if (r === 1) return 'Rare'
  return 'Common'
}

export default function GuessArena({ account }: Props) {
  const client = useSuiClient()
  const { mutateAsync: signTransaction } = useSignTransaction()

  const [machineIdInput, setMachineIdInput] = useState('')
  const [machineId, setMachineId] = useState('')
  const [machine, setMachine] = useState<MachineFields | null>(null)
  const [machines, setMachines] = useState<MachineSummary[]>([])
  const [txDigest, setTxDigest] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const myLastFlip = useMemo(() => {
    const mine = (machine?.flips ?? []).filter((f) => (f.player ?? '').toLowerCase() === account.address.toLowerCase())
    return mine[mine.length - 1]
  }, [machine?.flips, account.address])

  const execute = async (tx: Transaction) => {
    const signed = await signTransaction({ transaction: tx })
    return client.executeTransactionBlock({
      transactionBlock: signed.bytes,
      signature: signed.signature,
      options: { showEffects: true, showObjectChanges: true, showEvents: true },
      requestType: 'WaitForEffectsCert',
    })
  }

  const readMachine = async (input?: string) => {
    const raw = (input ?? machineId).trim()
    if (!raw) return
    setError('')

    let id = raw
    if (looksLikeTxDigest(raw)) {
      const tx = await client.getTransactionBlock({ digest: raw, options: { showObjectChanges: true } })
      const found = tx.objectChanges?.find(
        (c) =>
          (c.type === 'created' || c.type === 'mutated') &&
          typeof c.objectType === 'string' &&
          c.objectType.includes('::nftflip::Machine') &&
          'objectId' in c,
      )
      if (!found || !('objectId' in found)) {
        setError('No NFTFlip machine object found in this transaction digest.')
        return
      }
      id = found.objectId as string
    }

    if (!isHexObjectId(id)) {
      setError('Use a machine object ID (0x...) or transaction digest.')
      return
    }

    const res = await client.getObject({ id, options: { showContent: true, showType: true } })
    const type = res.data?.type ?? ''
    const content = res.data?.content as { dataType?: string; fields?: unknown } | undefined
    if (!content || content.dataType !== 'moveObject' || typeof type !== 'string' || !type.includes('::nftflip::Machine') || !content.fields) {
      setError('Object is not an NFTFlip Machine.')
      return
    }

    const rawFields = content.fields as {
      creator?: string
      total_mints?: number | string
      flips?: Array<{ fields?: FlipItem } | FlipItem>
    }

    const flips = (rawFields.flips ?? []).map((f) => {
      if (f && typeof f === 'object' && 'fields' in f && (f as { fields?: FlipItem }).fields) {
        return (f as { fields: FlipItem }).fields
      }
      return f as FlipItem
    })

    setMachine({ creator: rawFields.creator, total_mints: rawFields.total_mints, flips })
    setMachineId(id)
    setMachineIdInput(id)
  }

  const fetchMachines = async () => {
    if (!PACKAGE_ID) return
    const ev = await client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::nftflip::MachineCreated` },
      limit: 20,
      order: 'descending',
    })
    const list = ev.data
      .map((e) => {
        const p = e.parsedJson as { machine_id?: string; creator?: string } | null
        if (!p?.machine_id) return null
        return { id: p.machine_id, creator: p.creator, digest: e.id?.txDigest }
      })
      .filter((x): x is MachineSummary => Boolean(x))

    setMachines(Array.from(new Map(list.map((x) => [x.id, x])).values()))
  }

  useEffect(() => {
    void fetchMachines()
    const timer = setInterval(() => {
      if (!pending) void fetchMachines()
      if (!pending && machineId) void readMachine(machineId)
    }, 12_000)
    return () => clearInterval(timer)
  }, [machineId, pending])

  const createMachine = () => {
    if (!PACKAGE_ID) {
      setError('Missing VITE_PACKAGE_ID in frontend/.env')
      return
    }
    setError('')
    void (async () => {
      setPending(true)
      try {
        const tx = new Transaction()
        tx.setSender(account.address)
        tx.setGasBudget(20_000_000)
        tx.moveCall({ target: `${PACKAGE_ID}::nftflip::create_machine`, arguments: [] })
        const res = await execute(tx)
        setTxDigest(res.digest)

        const created = res.objectChanges?.find(
          (c) => c.type === 'created' && typeof c.objectType === 'string' && c.objectType.includes('::nftflip::Machine'),
        )
        if (created && 'objectId' in created) {
          await readMachine(created.objectId as string)
        }
        await fetchMachines()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Create machine failed')
      } finally {
        setPending(false)
      }
    })()
  }

  const mint = () => {
    if (!PACKAGE_ID || !machineId) return
    setError('')
    void (async () => {
      setPending(true)
      try {
        const tx = new Transaction()
        tx.setSender(account.address)
        tx.setGasBudget(20_000_000)
        tx.moveCall({ target: `${PACKAGE_ID}::nftflip::mint`, arguments: [tx.object(machineId)] })
        const res = await execute(tx)
        setTxDigest(res.digest)
        await readMachine(machineId)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Mint failed')
      } finally {
        setPending(false)
      }
    })()
  }

  return (
    <section className="arena">
      <div>
        <div className="card">
          <h3>Create NFTFlip Machine</h3>
          <div className="btns">
            <button className="btn btn-primary" disabled={pending} onClick={createMachine}>Create Machine</button>
          </div>
        </div>

        <div className="card">
          <h3>Load Machine</h3>
          <div className="form">
            <input className="input mono" value={machineIdInput} onChange={(e) => setMachineIdInput(e.target.value)} placeholder="Machine object ID (0x...) or tx digest" />
            <div className="btns">
              <button className="btn btn-secondary" disabled={pending} onClick={() => void readMachine(machineIdInput)}>Load</button>
              {machineId && <a className="link" href={objectUrl(machineId)} target="_blank" rel="noreferrer">View Object</a>}
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          {txDigest && <a className="link" href={txUrl(txDigest)} target="_blank" rel="noreferrer">Last tx: {txDigest}</a>}
        </div>

        <div className="card">
          <h3>Mint Random NFT</h3>
          <div className="btns">
            <button className="btn" disabled={pending || !machineId} onClick={mint}>Mint Flip</button>
          </div>
          {myLastFlip && <div className="win">Your latest rarity: {rarityLabel(n(myLastFlip.rarity))}</div>}
        </div>
      </div>

      <div>
        <div className="card live-rounds">
          <h3>Live Machines</h3>
          <div className="btns"><button className="btn btn-mini" disabled={pending} onClick={() => void fetchMachines()}>Refresh</button></div>
          {machines.length === 0 && <div className="log-item">No machines found yet.</div>}
          {machines.map((m) => (
            <div className="log-item" key={m.id}>
              <div>Creator: <span className="mono">{m.creator}</span></div>
              <div className="btns">
                <button className="btn btn-mini" onClick={() => void readMachine(m.id)}>Load</button>
                {m.digest && <a className="link mono" href={txUrl(m.digest)} target="_blank" rel="noreferrer">{m.digest}</a>}
              </div>
            </div>
          ))}
        </div>

        <div className="card log">
          <h3>Flip History</h3>
          {(machine?.flips ?? []).slice().reverse().map((f, i) => (
            <div className="log-item" key={`${f.player}-${i}`}>
              <div><span className="mono">{f.player}</span></div>
              <div>Mint #{n(f.nonce)} | Rarity: {rarityLabel(n(f.rarity))}</div>
            </div>
          ))}
          {(!machine?.flips || machine.flips.length === 0) && <div className="log-item">No flips yet.</div>}
        </div>

        <div className="card">
          <h3>Machine State</h3>
          {!machine && <div className="status">No machine loaded.</div>}
          {machine && (
            <div className="status">
              <div>Creator: <span className="mono">{machine.creator}</span></div>
              <div>Total mints: {n(machine.total_mints)}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
