import React, { useState, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import {
  FaThList, FaFileCode,
} from 'react-icons/fa';
import { IoIosGitNetwork } from 'react-icons/io';
// import IoCodeWorking from 'react-icons/lib/io/code-working'

import './tableSubComponent.css';

import { makeNodePairs, addSupportEdges } from './funcs';
import TableSubGraph from './subGraph/TableSubGraph';
import JsonView from './subJson/JsonView';
import MetaDataView from './subMetaData/MetaDataView';

export const answersetSubComponentEnum = {
  graph: 1,
  json: 2,
  metadata: 3,
};

export default function TableSubComponent(props) {
  const {
    data, store, activeButton, setActiveButton,
  } = props;
  const [nodeId, setNodeId] = useState(null);
  const [rowData, updateRowData] = useState({});
  const [graph, setGraph] = useState({});
  const [loadedGraph, setLoadedGraph] = useState(false);

  function fetchGraphSupport(axiosCalls) { // eslint-disable-line
    // async call all of the axios calls for edge publications
    return Promise.all(axiosCalls);
  }

  // Method that updates local mobx state with activeButton and nodeId based on props
  function syncPropsWithState() {
    if (nodeId) {
      setNodeId(nodeId);
    }
    // if (activeButtonKey) {
    //   setActiveButton(activeButtonKey);
    // }
    const tempRowData = store.getDenseAnswer(data.id);
    const ansId = tempRowData.id;
    // store.updateActiveAnswerId(ansId);
    let g = store.activeAnswerGraph(ansId);
    // returns the array of calls to make, and an array of node pairs
    const { calls, nodes } = makeNodePairs(g.nodes, g.edges);
    // async calls for omnicorp publications
    fetchGraphSupport(calls)
      .then((result) => {
        const pubs = [];
        // put all the publications into one array
        result.forEach((graphTest) => pubs.push(graphTest.data));
        // adds support edges to graph object
        g = addSupportEdges(g, pubs, nodes);
        // this signifies that the graph is updated and to display the AnswerGraph
        setGraph(g);
        updateRowData(tempRowData);
        setLoadedGraph(true);
      })
      .catch((error) => {
        console.log('Error: ', error);
      });
  }

  useEffect(() => {
    syncPropsWithState();
  }, []);

  const isJsonActive = activeButton === answersetSubComponentEnum.json;
  const isGraphActive = activeButton === answersetSubComponentEnum.graph;
  const isMetadataActive = activeButton === answersetSubComponentEnum.metadata;
  return (
    <div id="tableSubComponentBackground">
      <div id="tableSubComponentContainer">
        <ButtonGroup
          orientation="vertical"
          variant="contained"
          className="tableSubComponentButtons"
        >
          <Button
            color={isJsonActive ? 'primary' : ''}
            style={{ textAlign: 'left' }}
            onClick={() => setActiveButton(answersetSubComponentEnum.json)}
          >
            <span className="valign-center">
              <FaFileCode />
              <span style={{ paddingLeft: '5px' }}>JSON</span>
            </span>
          </Button>
          <Button
            color={isGraphActive ? 'primary' : ''}
            style={{ textAlign: 'left' }}
            onClick={() => setActiveButton(answersetSubComponentEnum.graph)}
          >
            <div className="valign-center">
              <IoIosGitNetwork />
              <span style={{ paddingLeft: '5px' }}>Graph</span>
            </div>
          </Button>
          <Button
            color={isMetadataActive ? 'primary' : ''}
            style={{ textAlign: 'left' }}
            onClick={() => setActiveButton(answersetSubComponentEnum.metadata)}
          >
            <span className="valign-center">
              <FaThList />
              <span style={{ paddingLeft: '5px' }}>Metadata</span>
            </span>
          </Button>
        </ButtonGroup>
        {isJsonActive && (
          <JsonView
            rowData={rowData}
          />
        )}
        {isGraphActive && (
          <TableSubGraph
            loadedGraph={loadedGraph}
            store={store}
            graph={graph}
            activeAnswerId={rowData.id}
          />
        )}
        {isMetadataActive && rowData.nodes && (
          <MetaDataView
            store={store}
            rowData={rowData.nodes}
          />
        )}
      </div>
    </div>
  );
}
