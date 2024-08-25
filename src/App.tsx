import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, loading: employeesLoading, fetchAll: fetchEmployees } = useEmployees()
  const {
    data: paginatedTransactions,
    loading: transactionsLoading,
    fetchAll: fetchPaginatedTransactions,
    invalidateData: invalidatePaginatedData,
  } = usePaginatedTransactions()
  const {
    data: transactionsByEmployee,
    fetchById: fetchTransactionsByEmployee,
    invalidateData: invalidateEmployeeTransactions,
  } = useTransactionsByEmployee()
  const [filteredByEmployee, setFilteredByEmployee] = useState(false)

  const transactions = useMemo(
    () => (filteredByEmployee ? transactionsByEmployee : paginatedTransactions?.data),
    [filteredByEmployee, paginatedTransactions, transactionsByEmployee]
  )

  const hasMoreData = useMemo(
    () => !filteredByEmployee && paginatedTransactions?.nextPage != null,
    [filteredByEmployee, paginatedTransactions]
  )

  const loadAllTransactions = useCallback(async () => {
    invalidateEmployeeTransactions()
    invalidatePaginatedData()

    await fetchEmployees()
    await fetchPaginatedTransactions()
  }, [
    fetchEmployees,
    fetchPaginatedTransactions,
    invalidateEmployeeTransactions,
    invalidatePaginatedData,
  ])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      invalidatePaginatedData()
      await fetchTransactionsByEmployee(employeeId)
      setFilteredByEmployee(employeeId !== EMPTY_EMPLOYEE.id)
    },
    [fetchTransactionsByEmployee, invalidatePaginatedData]
  )

  useEffect(() => {
    if (employees === null && !employeesLoading) {
      loadAllTransactions()
    }
  }, [employeesLoading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={employeesLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            if (newValue.id === EMPTY_EMPLOYEE.id) {
              setFilteredByEmployee(false)
              await loadAllTransactions()
            } else {
              setFilteredByEmployee(true)
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions || null} />

          {hasMoreData && !filteredByEmployee && (
            <button
              className="RampButton"
              disabled={transactionsLoading}
              onClick={async () => {
                if (hasMoreData) {
                  await fetchPaginatedTransactions()
                }
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
