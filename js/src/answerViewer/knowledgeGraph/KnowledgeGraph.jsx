import React, { useState, useEffect, useRef } from 'react';
import Paper from '@material-ui/core/Paper';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Popper from '@material-ui/core/Popper';
import Button from '@material-ui/core/Button';
import Slider from '@material-ui/core/Slider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import { FaAngleDown } from 'react-icons/fa';

import './kg.css';
import AnswerGraph from '../shared/Old_AnswerGraph';

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

export default function KnowledgeGraph(props) {
  const { store, concepts, tab } = props;
  const [hierarchical, toggleHierarchy] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [localPruneNum, updateLocalPruneNum] = useState(35);
  const [committedPruneNum, setCommittedPruneNum] = useState(35);
  const [kg, setKg] = useState(null);
  const randomSeed = useRef(Math.floor(Math.random() * 100));
  const graphClickCallback = useRef(() => {});

  useEffect(() => {
    if (tab === 2) {
      setKg(store.annotatedPrunedKnowledgeGraph(committedPruneNum));
    }
  }, [tab, committedPruneNum, hierarchical]);

  return (
    <>
      {tab === 2 && (
        <Paper>
          <div
            style={{
              position: 'relative', minHeight: '200px', display: 'table', width: '100%',
            }}
          >
            <AnswerGraph
              subgraph={kg}
              concepts={concepts}
              layoutRandomSeed={randomSeed.current}
              layoutStyle={hierarchical ? 'hierarchical' : ''}
              showSupport={false}
              omitEdgeLabel
              callbackOnGraphClick={graphClickCallback.current}
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
                      `Pruned graph showing top ${committedPruneNum} nodes`
                    ) : (
                      'Prune Graph'
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
                        <Checkbox checked={hierarchical} onChange={(e) => toggleHierarchy(e.target.checked)} />
                      }
                      label="Hierarchical"
                    />
                  </div>
                </Popper>
              </div>
            </ClickAwayListener>
          </div>
        </Paper>
      )}
    </>
  );
}
