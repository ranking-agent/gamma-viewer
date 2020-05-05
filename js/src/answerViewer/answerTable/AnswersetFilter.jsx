import React, { useState } from 'react';
import shortid from 'shortid';
import _ from 'lodash';
import {
  FaFilter, FaCheck,
} from 'react-icons/fa';
import Popper from '@material-ui/core/Popper';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Button from '@material-ui/core/Button';
// import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import entityNameDisplay from '../../../utils/entityNameDisplay';

export default function AnswersetFilter(props) {
  // Store comes from props in Table component
  const { qnodeId, store, setFilter } = props;
  // const [search, updateSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [expanded, setExpanded] = useState({});

  // function handleSearch(value) {
  //   store.searchFilter(qnodeId, value);
  //   updateSearch(value);
  // }

  function check(propertyKey, propertyValue) {
    store.updateFilterKeys(qnodeId, propertyKey, propertyValue);
    setFilter({});
  }

  function checkAll(propertyKey) {
    store.checkAll(qnodeId, propertyKey);
    setFilter({});
  }

  function reset() {
    store.reset(qnodeId);
    setFilter({});
    // updateSearch('');
  }

  const handleExpand = (panel) => (event, isExpanded) => {
    expanded[panel] = isExpanded;
    setExpanded(_.cloneDeep(expanded));
  };

  return (
    <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
      <div className="filterHeaderPopper">
        <Button
          style={{
            display: 'flex', justifyContent: 'center', width: '100%', cursor: 'pointer',
          }}
          onClick={(e) => setAnchorEl(anchorEl ? null : e.target)}
          variant="contained"
        >
          <FaFilter />
          {store.isFiltered(qnodeId) && <FaCheck />}
        </Button>
        <Popper id={shortid.generate()} className="answersetFilter MuiPaper-elevation10" open={Boolean(anchorEl)} anchorEl={anchorEl}>
          {/* <TextField
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search"
            style={{ width: '100%', padding: '5px' }}
            variant="outlined"
          /> */}
          <Button style={{ display: 'block', margin: '10px auto' }} onClick={reset}>Reset</Button>
          {Object.keys(store.searchedFilter[qnodeId] || {}).map((propertyKey) => {
            // if there aren't any values under the header, don't show anything
            if (Object.keys(store.searchedFilter[qnodeId][propertyKey]).length) {
              return (
                <div key={shortid.generate()}>
                  <ExpansionPanel expanded={expanded[propertyKey]} onChange={handleExpand(propertyKey)}>
                    <ExpansionPanelSummary
                      expandIcon={<ExpandMoreIcon />}
                    >
                      <FormControlLabel
                        className="pull-right"
                        control={(
                          <Checkbox
                            defaultChecked={!store.isPropFiltered(store.filterKeys[qnodeId][propertyKey])}
                            onChange={() => checkAll(propertyKey)}
                            style={{ marginRight: '10px' }}
                            color="primary"
                          />
                        )}
                        label="Toggle All"
                      />
                      <span style={{ marginLeft: 10, fontWeight: 'bold' }}>{entityNameDisplay(propertyKey)}</span>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails style={{ flexDirection: 'column' }}>
                      {Object.keys(store.searchedFilter[qnodeId][propertyKey]).map((propertyValue) => {
                        const style = { fontWeight: 'normal', whiteSpace: 'nowrap', overflow: 'auto' };
                        if (!store.filterKeys[qnodeId][propertyKey][propertyValue][1]) {
                          style.color = 'lightgrey';
                        }
                        return (
                          <div key={shortid.generate()} style={{ paddingLeft: '20px', display: 'flex' }}>
                            <FormControlLabel
                              style={style}
                              control={(
                                <Checkbox
                                  defaultChecked={store.filterKeys[qnodeId][propertyKey][propertyValue][0]}
                                  onChange={() => check(propertyKey, propertyValue)}
                                  style={{ marginRight: '10px' }}
                                  color="primary"
                                />
                              )}
                              label={propertyValue}
                            />
                          </div>
                        );
                      })}
                    </ExpansionPanelDetails>
                  </ExpansionPanel>
                </div>
              );
            }
            return null;
          })}
        </Popper>
      </div>
    </ClickAwayListener>
  );
}
