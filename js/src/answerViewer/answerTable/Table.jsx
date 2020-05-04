/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import {
  useTable, usePagination, useExpanded, useSortBy,
} from 'react-table';
import MuiTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Button from '@material-ui/core/Button';

import SubComponent, { answersetSubComponentEnum } from './tableSubComponent/TableSubComponent';

export default function Table(props) {
  const { columns, data, store } = props;
  const [activeSubComponentButton, setActiveSubComponentButton] = useState(answersetSubComponentEnum.graph);
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    visibleColumns,
    state: { pageIndex, pageSize },
  } = useTable(
    { columns, data, initialState: { pageIndex: 0 } },
    // useBlockLayout,
    useSortBy,
    useExpanded,
    usePagination,
  );
  console.log('headerGroups', headerGroups);

  return (
    <>
      <MuiTable {...getTableProps()} size="small">
        <TableHead>
          {headerGroups.map((headerGroup) => (
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <TableCell
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  style={{ width: column.width }}
                >
                  <div className={column.isSorted ? column.isSortedDesc ? 'underline' : 'upperline' : '' }>
                    {column.render('Header')}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody {...getTableBodyProps()}>
          {page.map((row, i) => {
            prepareRow(row);
            return (
              <React.Fragment key={`results-table-row-${i}`}>
                <TableRow {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <TableCell {...cell.getCellProps()}>
                      {cell.render('Cell')}
                    </TableCell>
                  ))}
                </TableRow>
                {row.isExpanded ? (
                  <tr>
                    <td colSpan={visibleColumns.length} className="expandedRow">
                      <SubComponent
                        data={row.original}
                        store={store}
                        activeButton={activeSubComponentButton}
                        setActiveButton={setActiveSubComponentButton}
                      />
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          })}
        </TableBody>
      </MuiTable>
      <div className="pagination">
        <Button
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
          variant="contained"
        >
          Previous
        </Button>
        <div>
          Page
          <input
            type="number"
            value={pageIndex + 1}
            min={1}
            max={pageCount}
            onChange={(e) => {
              const pageInd = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(pageInd);
            }}
            style={{ width: '100px' }}
          />
          {`of ${pageCount}`}
        </div>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pSize) => (
            <option key={pSize} value={pSize}>
              {`Show ${pSize}`}
            </option>
          ))}
        </select>
        <Button
          onClick={() => nextPage()}
          disabled={!canNextPage}
          variant="contained"
        >
          Next
        </Button>
      </div>
    </>
  );
}
