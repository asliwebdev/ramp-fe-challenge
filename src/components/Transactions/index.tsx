import { useCallback, useState, useEffect } from "react"
import { useCustomFetch } from "src/hooks/useCustomFetch"
import { SetTransactionApprovalParams } from "src/utils/types"
import { TransactionPane } from "./TransactionPane"
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types"

export const Transactions: TransactionsComponent = ({ transactions }) => {
  const { fetchWithoutCache, loading } = useCustomFetch()
  const [approvedTransactions, setApprovedTransactions] = useState<Record<string, boolean>>({})

  const setTransactionApproval: SetTransactionApprovalFunction = useCallback(
    async ({ transactionId, newValue }) => {
      await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
        transactionId,
        value: newValue,
      })

      setApprovedTransactions((prev) => {
        const updated = { ...prev, [transactionId]: newValue }
        localStorage.setItem("approvedTransactions", JSON.stringify(updated))
        return updated
      })
    },
    [fetchWithoutCache]
  )

  useEffect(() => {
    const storedApprovalState = localStorage.getItem("approvedTransactions")
    if (storedApprovalState) {
      setApprovedTransactions(JSON.parse(storedApprovalState))
    } else if (transactions) {
      const initialApprovalState = transactions.reduce((acc, transaction) => {
        acc[transaction.id] = transaction.approved
        return acc
      }, {} as Record<string, boolean>)

      setApprovedTransactions(initialApprovalState)
    }
  }, [transactions])

  if (transactions === null) {
    return <div className="RampLoading--container">Loading...</div>
  }

  return (
    <div data-testid="transaction-container">
      {transactions.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          approved={approvedTransactions[transaction.id] ?? transaction.approved}
          setTransactionApproval={setTransactionApproval}
        />
      ))}
    </div>
  )
}
