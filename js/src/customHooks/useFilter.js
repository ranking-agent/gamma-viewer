import { useState } from 'react';

export default function useFilter() {
  const [filter, setFilter] = useState({});
  const [filterKeys, setFilterKeys] = useState({});
  const [searchedFilter, updateSearchedFilter] = useState({});
  const [filteredAnswers, setFilteredAnswers] = useState({});
  const [filterHash, setFilterHash] = useState('');

  function initializeFilter() {
    // makes simple filter object
    // {
    //  n0:{
    //    MONDO:0005737: true
    //  },
    //  n1: {
    //    LINS1: true
    //  }
    // }
    const { filter, message } = this;
    const qNodeIds = this.getQNodeIds();
    qNodeIds.forEach((id) => {
      filter[id] = {};
    });
    message.answers.forEach((ans) => {
      const nodeBindings = ans.node_bindings;
      qNodeIds.forEach((id) => {
        if (isObservableArray(nodeBindings[id])) {
          nodeBindings[id].forEach((kNodeId) => {
            filter[id][kNodeId] = true;
          });
        } else {
          filter[id][nodeBindings[id]] = true;
        }
      });
    });
    this.filter = filter;
    this.initializeFilterKeys();
  }

  // get only keys that show up in every single answer
  function initializeFilterKeys() {
    // makes nested filter keys object
    // {
    //  n0: {
    //    name: {
    //      Ebola: [true, true]
    //    }
    //  },
    //  n1: {
    //    name: {
    //      LINS1: [true, true]
    //    }
    //  }
    // }
    // the arrays are [checked, available given other columns]
    const { question_graph: qg } = this.message;
    const { filter } = this;
    const filterKeys = {};
    qg.nodes.forEach((qnode) => {
      const qnodeId = qnode.id;
      filterKeys[qnodeId] = {};
      const qnodeFilter = filterKeys[qnodeId];
      Object.keys(filter[qnodeId]).forEach((knodeId) => {
        const knode = this.getKgNode(knodeId);
        if (knode) {
          if (Object.keys(qnodeFilter).length === 0) {
            // we are dealing with the first node
            Object.keys(knode).forEach((propertyKey) => {
              propertyKey = propertyKey.replace(/ /g, '_'); // for consistency, change all spaces to underscores
              if (!this.keyBlacklist.includes(propertyKey)) {
                qnodeFilter[propertyKey] = {};
                qnodeFilter[propertyKey][knode[propertyKey]] = [true, true];
              }
            });
          } else {
            // we are adding a node to the existing filterKeys
            Object.keys(knode).forEach((propertyKey) => {
              propertyKey = propertyKey.replace(/ /g, '_'); // for consistency, change all spaces to underscores
              if (!this.keyBlacklist.includes(propertyKey) && qnodeFilter[propertyKey]) {
                qnodeFilter[propertyKey][knode[propertyKey]] = [true, true];
              }
            });
          }
          Object.keys(qnodeFilter).forEach((propertyKey) => {
            if (!Object.keys(knode).includes(propertyKey)) {
              delete qnodeFilter[propertyKey];
            }
          });
        }
      });
    });
    this.filterKeys = filterKeys;
    this.searchedFilter = filterKeys;
  }

  // given a value and nodeId, either check or uncheck it
  function updateFilterKeys(qnodeId, propertyKey, propertyValue) {
    const oldValue = this.filterKeys[qnodeId][propertyKey][propertyValue][0];
    this.filterKeys[qnodeId][propertyKey][propertyValue][0] = !oldValue;
    this.updateFilter();
  }

  // update filter object given the filterKeys object
  function updateFilter() {
    const { filter, message } = this;
    const qNodeIds = this.getQNodeIds();
    message.answers.forEach((ans) => {
      const nodeBindings = ans.node_bindings;
      qNodeIds.forEach((qnodeId) => {
        let knodeIds = nodeBindings[qnodeId];
        if (!isObservableArray(knodeIds)) {
          knodeIds = [knodeIds];
        }
        const qnodeFilter = this.filterKeys[qnodeId];
        let show;
        knodeIds.forEach((knodeId) => {
          const knode = this.getKgNode(knodeId);
          if (knode) {
            show = !Object.keys(qnodeFilter).some(propertyKey => !qnodeFilter[propertyKey][knode[propertyKey]][0]);
            filter[qnodeId][knodeId] = show;
          }
        });
      });
    });
  }

  function searchFilter(qnodeId, value) {
    const { filterKeys } = this;
    // we need to make a complete copy of filterKeys
    const searchedFilter = _.cloneDeep(filterKeys);
    Object.keys(filterKeys[qnodeId]).forEach((propertyKey) => {
      Object.keys(filterKeys[qnodeId][propertyKey]).forEach((propertyValue) => {
        // if the property value doesn't include the search term, delete it from the searched filter
        if (!propertyValue.toLowerCase().includes(value.toLowerCase())) {
          delete searchedFilter[qnodeId][propertyKey][propertyValue];
        }
      });
    });
    this.searchedFilter = searchedFilter;
  }

  // reset the filter and filterKeys objects back to all trues
  function reset(qnodeId) {
    const { filterKeys } = this;
    Object.keys(filterKeys[qnodeId]).forEach((propertyKey) => {
      Object.keys(filterKeys[qnodeId][propertyKey]).forEach((propertyValue) => {
        filterKeys[qnodeId][propertyKey][propertyValue][0] = true;
      });
    });
    this.searchedFilter = _.cloneDeep(filterKeys);
    this.updateFilter();
  }

  // check whether any properties are checked and either check or uncheck all
  function checkAll(qnodeId, propertyKey) {
    const { filterKeys } = this;
    const check = this.isPropFiltered(filterKeys[qnodeId][propertyKey]);
    Object.keys(filterKeys[qnodeId][propertyKey]).forEach((propertyValue) => {
      filterKeys[qnodeId][propertyKey][propertyValue][0] = check;
    });
    this.updateFilter();
  }

  // return boolean of if any properties are checked
  function isPropFiltered(propertyKey) {
    let filtered = false;
    filtered = Object.keys(propertyKey).some(propertyValue => !propertyKey[propertyValue][0]);
    return filtered;
  }

  // update react table based on filter object
  function defaultFilter(row) {
    const { filter } = this;
    let show = true;
    const qnodeIds = this.getQNodeIds();
    qnodeIds.forEach((qnodeId) => {
      row._original[qnodeId].forEach((knode) => {
        if (knode.id && !filter[qnodeId][knode.id]) {
          show = false;
          return show;
        }
      });
    });
    return show;
  }

  // check to see if whole column filter has any false values
  function isFiltered(qnodeId) {
    const { filterKeys } = this;
    let filtered = false;
    if (filterKeys[qnodeId]) {
      // goes through the filterkeys until it finds one that is false
      filtered = Object.keys(filterKeys[qnodeId]).some(propertyKey =>
        Object.keys(filterKeys[qnodeId][propertyKey]).some(propertyValue =>
          !filterKeys[qnodeId][propertyKey][propertyValue][0]));
    }
    return filtered;
  }

  // update filterKeys object based on filter and table filtered answers
  function updateFilteredAnswers(filteredAnswers) {
    this.filteredAnswers = filteredAnswers;
    const { question_graph: qg } = this.message;
    const { filter, filterKeys } = this;
    qg.nodes.forEach((qnode) => {
      const qnodeId = qnode.id;
      const qnodeFilter = filterKeys[qnodeId];
      Object.keys(qnodeFilter).forEach((propertyKey) => {
        Object.keys(qnodeFilter[propertyKey]).forEach((propertyValue) => {
          qnodeFilter[propertyKey][propertyValue][1] = false;
        });
      });
    });

    this.filteredAnswers.forEach((answer) => { // loop over rows (remaining answers)
      this.getQNodeIds().forEach((qnodeId) => { // loop over columns (qnodes)
        answer._original[qnodeId].forEach((knode) => { // loop over knodes
          if (filter[qnodeId][knode.id]) {
            knode = this.getKgNode(knode.id);
            Object.keys(knode).forEach((propertyKey) => { // loop over properties belonging to knode
              propertyKey = propertyKey.replace(/ /g, '_'); // for consistency, change all spaces to underscores
              if (propertyKey in filterKeys[qnodeId]) {
                filterKeys[qnodeId][propertyKey][knode[propertyKey]][1] = true;
              }
            });
          }
        });
      });
    });
  }

  return {

  };
}