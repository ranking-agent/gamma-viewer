import React, { useState, useEffect, useRef } from 'react';
import { AutoSizer, List } from 'react-virtualized';
import axios from 'axios';

import PubmedEntry from './PubmedEntry';

const { CancelToken } = axios;
const axiosCancel = CancelToken.source();

const styles = {
  list: {
    border: 'none',
    marginTop: '0px',
    outline: 'none',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    padding: '5px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
  },
};

export default function PubmedList(props) {
  const { publications } = props;
  const [pubs, setPubs] = useState({});
  const list = useRef(null);

  /**
   * Cancel all axios calls on unmount
   */
  useEffect(() => axiosCancel.cancel('Pubmed request canceled'), []);

  function rowRenderer({
    index,
    key,
    style,
    isScrolling,
  }) {
    let pmid = publications[index].toString();
    if ((typeof pmid === 'string' || pmid instanceof String) && (pmid.indexOf(':') !== -1)) {
      // pmidStr has a colon, and therefore probably a curie, remove it.
      pmid = pmid.substr(pmid.indexOf(':') + 1);
    }
    let publication = 'Loading...';
    if (pubs[index]) {
      publication = <PubmedEntry pub={pubs[index]} />;
    } else if (!isScrolling) {
      axios.request({
        method: 'GET',
        url: `https://robokop.renci.org/api/pubmed/${pmid}`,
        cancelToken: axiosCancel.token,
      })
        .then((res) => {
          console.log('res', res);
          pubs[index] = res;
          list.forceUpdateGrid();
          setPubs(pubs);
        })
        .catch((err) => {
          if (err.message !== 'Pubmed request canceled') {
            console.log('error', err);
          }
        });
    }
    return (
      <div
        style={{ ...style, ...styles.row }}
        key={key}
      >
        {publication}
      </div>
    );
  }

  function noRowsRenderer() {
    return (
      <h5 style={{ padding: '15px' }}>
        No Publications Found
      </h5>
    );
  }

  return (
    <AutoSizer disableHeight defaultWidth={100}>
      {({ width }) => (
        <List
          ref={list}
          style={styles.list}
          height={Math.max(Math.min((publications.length * 100), 500), 100)}
          overscanRowCount={1}
          rowCount={publications.length}
          rowHeight={100}
          noRowsRenderer={noRowsRenderer}
          rowRenderer={rowRenderer}
          width={width}
        />
      )}
    </AutoSizer>
  );
}
