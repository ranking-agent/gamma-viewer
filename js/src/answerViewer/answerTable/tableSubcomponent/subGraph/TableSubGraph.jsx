import React, { useState, useEffect, useMemo } from 'react';
import shortid from 'shortid';
import { FaAngleDown } from 'react-icons/fa';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Popper from '@material-ui/core/Popper';
import Button from '@material-ui/core/Button';
import Slider from '@material-ui/core/Slider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';

import './subGraph.css';

import AnswerGraph from '../../../shared/AnswerGraph';
import Loading from '../../../shared/Loading';
// import AnswerExplorerInfo from './AnswerExplorerInfo';

function SliderLabel(props) {
  const { children, open, value } = props;
  return (
    <Tooltip
      className="sliderTooltip"
      open={open}
      enterTouchDelay={0}
      placement="top"
      title={`${value} Nodes`}
    >
      {children}
    </Tooltip>
  );
}

export default function TableSubGraph(props) {
  const {
    store, loadedGraph, graph,
  } = props;
  const [hierarchical, toggleHierarchical] = useState(false);
  const [showModal, toggleModal] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [localPruneNum, updateLocalPruneNum] = useState(10);
  const [committedPruneNum, setCommittedPruneNum] = useState(10);
  const randomSeed = useMemo(() => Math.floor(Math.random() * 100));

  function handleSliderChange(value) {
    store.updateNumAgNodes(value);
    this.setState({ loadedGraph: false });
  }

  function modalClose() {
    this.setState({ showModal: false });
  }

  function onGraphClick(event) {
    // if (event.edges.length !== 0) { // Clicked on an Edge
    //   this.setState({ selectedEdge: event.edgeObjects[0], showModal: true });
    // } else { // Reset things since something else was clicked
    //   this.setState({ selectedEdge: null, showModal: false });
    // }
  }

  // useEffect(() => {
  //   if (tab === 2) {
  //     setKg(store.annotatedPrunedKnowledgeGraph(committedPruneNum));
  //   }
  // }, [tab, committedPruneNum, hierarchical]);

  return (
    <div>
      {loadedGraph ? (
        <div>
          <AnswerGraph
            subgraph={graph}
            concepts={store.concepts}
            layoutRandomSeed={randomSeed}
            layoutStyle={hierarchical ? 'hierarchical' : ''}
            callbackOnGraphClick={onGraphClick}
            showSupport
            varyEdgeSmoothRoundness
            omitEdgeLabel={false}
            height={350}
          />
          <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
            <div className="graphPopover">
              <Button
                style={{
                  width: '100%', textAlign: 'center', cursor: 'pointer', padding: '10px',
                }}
                onClick={(e) => setAnchorEl(anchorEl ? null : e.target)}
                variant="contained"
              >
                Graph Options
                <FaAngleDown />
              </Button>
              <Popper
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
              >
                <div className="popoverDiv">
                  {store.numKgNodes !== committedPruneNum ? (
                    `Pruned graph showing top ${committedPruneNum} set nodes`
                  ) : (
                    'Prune Set Nodes'
                  )}
                  <Slider
                    value={localPruneNum}
                    onChange={(e, v) => updateLocalPruneNum(v)}
                    onChangeCommitted={(e, v) => setCommittedPruneNum(v)}
                    min={store.numQgNodes}
                    max={store.numKgNodes}
                    ValueLabelComponent={SliderLabel}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox checked={hierarchical} onChange={(e) => toggleHierarchical(e.target.checked)} />
                    }
                    label="Hierarchical"
                  />
                </div>
              </Popper>
            </div>
          </ClickAwayListener>
          {/* <Modal
            show={showModal}
            onHide={modalClose}
            container={this}
            bsSize="large"
            aria-labelledby="AnswerExplorerModal"
          >
            <Modal.Header closeButton>
              <Modal.Title id="AnswerExplorerModalTitle">Edge Explorer</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <AnswerExplorerInfo
                graph={graph}
                selectedEdge={selectedEdge}
                concepts={concepts}
              />
            </Modal.Body>
          </Modal> */}
        </div>
      ) : (
        <Loading />
      )}
    </div>
  );
}
