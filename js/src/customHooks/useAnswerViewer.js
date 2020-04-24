/* eslint-disable no-param-reassign */
import { useState, useEffect } from 'react';
import _ from 'lodash';

import entityNameDisplay from '../../utils/entityNameDisplay';
import useFilter from './useFilter';

const makeEmptyArray = (len, init) => {
  const array = new Array(len);
  for (let i = 0; i < len; i += 1) array[i] = init;
  return array;
};

export default function useAnswerViewer(msg) {
  const [message, updateMessage] = useState(msg);
  const [activeAnswerId, updateActiveAnswerId] = useState(null);
  const [denseAnswer, updateDenseAnswer] = useState({});
  const [numAgSetNodes, updateNumAgSetNodes] = useState(10);
  const [idToIndMaps, setIdToIndMaps] = useState(null);
  const filter = useFilter();

  useEffect(() => {
    message.results.forEach((a, i) => {
      if (!a.id) {
        a.id = i;
      }
    });
    updateActiveAnswerId(message.results[0].id);
  }, []);

  const keyBlacklist = ['isSet', 'labels', 'equivalent_identifiers', 'type', 'id', 'degree'];
  let unknownNodes = false;

  function graphToIndMap(graph, type) {
    const indMap = new Map();
    if (message[graph]) {
      message[graph][type].forEach((t, i) => indMap.set(t.id, i));
    }
    return indMap;
  }

  function makeMaps() {
    const kgNodeMap = graphToIndMap('knowledge_graph', 'nodes');
    const kgEdgeMap = graphToIndMap('knowledge_graph', 'edges');
    const qgNodeMap = graphToIndMap('query_graph', 'nodes');
    const qgEdgeMap = graphToIndMap('query_graph', 'edges');
    setIdToIndMaps({
      kgNodeMap, kgEdgeMap, qgNodeMap, qgEdgeMap,
    });
    message.query_graph.nodes.forEach((node) => {
      if (!node.type && node.curie) {
        // if no node type, go look up in knowledge graph
        const kgNodeInd = kgNodeMap.get(node.curie);
        // TODO: don't just grab the first type from the array
        [node.type] = message.knowledge_graph.nodes[kgNodeInd].type;
      }
    });
  }

  useEffect(() => {
    makeMaps();
  }, []);

  function ansIdToIndMap() {
    const indMap = new Map();
    if (message.results) {
      message.results.forEach((ans, i) => indMap.set(ans.id, i));
    }
    return indMap;
  }

  /**
   * Number of graph nodes
   * @param {object} graph graph from message
   * @returns {int} number of nodes in graph
   */
  function numNodes(graph) {
    return message[graph] ? message[graph].nodes.length : 0;
  }
  function getGraphNode(graph, nodeId) {
    return graph.nodes.find((node) => node.id === nodeId);
  }
  function getGraphEdge(graph, edgeId) {
    return graph.edges.find((edge) => edge.id === edgeId);
  }

  function getQNodeIds() {
    const qNodeIds = [];
    message.query_graph.nodes.forEach((n) => {
      qNodeIds.push(n.id);
    });
    return qNodeIds;
  }
  function getQEdgeIds() {
    const qEdgeIds = [];
    message.query_graph.edges.forEach((e) => {
      qEdgeIds.push(e.id);
    });
    return qEdgeIds;
  }

  function getQgNode(id) {
    return message.query_graph.nodes[idToIndMaps.qgNodeMap.get(id)];
  }

  function getKgNode(nodeId) {
    return message.knowledge_graph.nodes[idToIndMaps.kgNodeMap.get(nodeId)];
  }

  function annotatedPrunedKnowledgeGraph(pruneNum) {
    if (message.query_graph) {
      // KG nodes don't always have type
      // If they don't we need to figure out which qNodes they most like correspond to
      // Then check labels and use the corresponding type

      const { results, knowledge_graph: kg, query_graph: qg } = message;
      const numQgNodes = numNodes('query_graph');
      const Nj = Math.round(pruneNum / numQgNodes);

      // Create a map between qGraph index to node id (for scoreVector)
      const qgNodeIndToIdMap = {};
      qg.nodes.forEach((node, i) => {
        qgNodeIndToIdMap[i] = node.id;
      });

      // Object map mapping qNodeId to Array of Objects of score info
      // of format { scoreVector, aggScore, kGNodeId }
      // eg: {"node01": [{ scoreVector, aggScore, id }, ...], "node02": [{ scoreVector, aggScore, id }, ...]}
      const qgNodeIdToScoreObjArrMap = {};
      idToIndMaps.qgNodeMap.forEach((qNodeInd, qNodeId) => (qgNodeIdToScoreObjArrMap[qNodeId] = []));

      const qgNodeIdToCountMap = {};
      idToIndMaps.qgNodeMap.forEach((qNodeInd, qNodeId) => (qgNodeIdToCountMap[qNodeId] = []));

      // Iterate through each node in knowledgeGraph and score them
      kg.nodes.forEach((node) => {
        node.scoreVector = makeEmptyArray(numQgNodes, 0);
        node.count = makeEmptyArray(numQgNodes, 0);
        // Iterate through each answer
        results.forEach((ans) => {
          const { node_bindings: nodeBindings } = ans;
          // Iterate through each node_binding in an answer and if the KG node matches any, update score
          Object.keys(nodeBindings).forEach((nodeBinding) => {
            let isMatch = false;
            if (Array.isArray(nodeBindings[nodeBinding])) {
              if (nodeBindings[nodeBinding].indexOf(node.id) > -1) {
                isMatch = true;
              }
            } else if (nodeBindings[nodeBinding] === node.id) {
              isMatch = true;
            }
            // Update score for qNode position in scoreVector since this kGNode was
            // referenced in this answer
            // sometimes results don't have scores
            if (isMatch) {
              node.count[idToIndMaps.qgNodeMap.get(nodeBinding)] += 1;
              if (ans.score !== undefined) {
                node.scoreVector[idToIndMaps.qgNodeMap.get(nodeBinding)] += ans.score;
              }
            }
          });
        });
        node.aggScore = node.scoreVector.reduce((a, b) => a + b, 0);
        // Update qgNodeIdToScoreObjArrMap with this node for any non-zero
        // qNodeScore (Meaning that this node was referenced one or more times by
        // the corresponding qNode for qNodeInd)
        node.scoreVector.forEach((qNodeScore, qNodeInd) => {
          if (qNodeScore > 0) {
            qgNodeIdToScoreObjArrMap[qgNodeIndToIdMap[qNodeInd]].push({
              scoreVector: node.scoreVector, aggScore: node.aggScore, id: node.id,
            });
          }
        });
        node.count.forEach((count, qNodeInd) => {
          if (count > 0) {
            qgNodeIdToCountMap[qgNodeIndToIdMap[qNodeInd]].push({
              count, id: node.id,
            });
          }
        });
      });

      let rankedQgNodeMap = qgNodeIdToScoreObjArrMap;
      let hasScores = true;
      Object.values(qgNodeIdToScoreObjArrMap).forEach((arr) => {
        if (!arr.length) {
          hasScores = false;
        }
      });
      if (!hasScores) {
        rankedQgNodeMap = qgNodeIdToCountMap;
      }

      // Now sort for each qNode, by aggScore and retain a max of Nj nodes for each qNodeId
      let extraNumNodes = 0; // Increment if any qNodeId utilizes less than Nj nodes
      let unselectedScoreObjArrMap = []; // Array of { scoreVector, aggScore, kGNodeId } objects that were not selected
      Object.keys(rankedQgNodeMap).forEach((qGraphNodeId) => {
        rankedQgNodeMap[qGraphNodeId] = _.uniqBy(rankedQgNodeMap[qGraphNodeId], (el) => el.id); // Remove dup nodes
        rankedQgNodeMap[qGraphNodeId] = _.reverse(_.sortBy(rankedQgNodeMap[qGraphNodeId], (el) => el.aggScore || el.count));
        const numQGraphNodes = rankedQgNodeMap[qGraphNodeId].length;
        if (numQGraphNodes < Nj) {
          extraNumNodes += Nj - numQGraphNodes;
        } else {
          unselectedScoreObjArrMap = unselectedScoreObjArrMap.concat(rankedQgNodeMap[qGraphNodeId].slice(Nj));
          rankedQgNodeMap[qGraphNodeId] = rankedQgNodeMap[qGraphNodeId].slice(0, Nj);
        }
      });

      // Construct list of all nodeIds for final pruned knowledgeGraph
      let prunedKGNodeIds = [];
      Object.keys(rankedQgNodeMap).forEach((qGraphNodeId) => {
        rankedQgNodeMap[qGraphNodeId].forEach((scoreObj) => prunedKGNodeIds.push(scoreObj.id));
      });
      const numExtraNodesToGrab = pruneNum - prunedKGNodeIds.length;
      // If extraNodes available to be populated, sort unselectedScoreObjArrMap and
      // pick max remaining nodes to pick and add their ids to selectedNodeIdSet
      // TODO: This step can result in all extra nodes from a single qNode that has high AggScore (eg node6 in message_test.json)
      if (numExtraNodesToGrab > 0) {
        unselectedScoreObjArrMap = _.uniqBy(unselectedScoreObjArrMap, (el) => el.id);
        unselectedScoreObjArrMap = _.reverse(_.sortBy(unselectedScoreObjArrMap, (el) => el.aggScore));
        prunedKGNodeIds = prunedKGNodeIds.concat(unselectedScoreObjArrMap.slice(0, numExtraNodesToGrab).map((el) => el.id));
      }

      // Construct prunedKgNodeList
      const prunedKgNodeList = prunedKGNodeIds.map((kgNodeId) => kg.nodes[idToIndMaps.kgNodeMap.get(kgNodeId)]);
      const prunedKgNodeIdSet = new Set(prunedKgNodeList.map((node) => node.id));
      // Construct pruned edges from original KG-graph
      const prunedKgEdgeList = kg.edges.filter((edge) => {
        if (prunedKgNodeIdSet.has(edge.source_id) && prunedKgNodeIdSet.has(edge.target_id)) {
          return true;
        }
        return false;
      });

      const prunedGraph = {
        nodes: prunedKgNodeList,
        edges: prunedKgEdgeList,
      };

      // Now set correct type for nodes by going through answers and
      // allowing for majority vote across all answers for the type
      const qNodes = qg.nodes;
      const qNodeBindings = qNodes.map((q) => q.id);

      prunedGraph.nodes.forEach((node) => {
        if ((('type' in node) && Array.isArray(node.type)) || (!('type' in node) && ('labels' in node))) {
          // if a prunedGraph node doesn't have a type
          // We will look through all answers
          // We will count the number of times is used in each qNode
          // Then take the max to pick the best one
          // The type is then the type of that qNode
          const qNodeCounts = qNodeBindings.map(() => 0);

          results.forEach((a) => {
            // Go through answers and look for this node
            Object.keys(a.node_bindings).forEach((key) => {
              const theseIds = a.node_bindings[key];
              if (Array.isArray(theseIds)) {
                // This answer has a set of nodes for this binding
                if (theseIds.includes(node.id)) {
                  // The set contains this id
                  qNodeCounts[qNodeBindings.indexOf(key)] += 1;
                }
              } else if (theseIds === node.id) {
                // This answer lists this node as qNode: key
                qNodeCounts[qNodeBindings.indexOf(key)] += 1;
              }
            });
          });
          // See what question node this was mapped to most
          const maxCounts = qNodeCounts.reduce((m, val) => Math.max(m, val));
          const qNodeIndex = qNodeCounts.indexOf(maxCounts);
          // level is added to let the user display the graph hierarchically
          node.level = qNodeIndex;

          // Use that numQgNodes Nodes Type
          node.type = qNodes[qNodeIndex].type;
          if (node.type === 'named_thing') { // we don't actually want any named_things
            let kgNodeType = getKgNode(node.id).type;
            if (!Array.isArray(kgNodeType)) { // so the type will always be an array
              kgNodeType = [kgNodeType];
            }
            node.type = kgNodeType;
          }
        }
      });

      return prunedGraph;
    }
    return {};
  }

  // Returns formatted answerset data for tabular display
  // {
  //   answers: [{ nodes: {n0: {name: , id: , type: , isSet, setNodes?: }, n1: {}, ...}, score: -1 }, {}, ...],
  //   columnHeaders: [{ Header: 'n01: Gene', id: 'n01', isSet: false, type: 'gene'}, {}, ...],
  // }
  function answerSetTableData() {
    const columnHeaders = [];
    const answers = [];
    // set the column headers object
    message.query_graph.nodes.forEach((n) => {
      if (!n.type) {
        console.log(n);
        n.type = 'undefined';
      }
      columnHeaders.push({
        Header: `${n.id}: ${entityNameDisplay(n.type)}`,
        id: n.id,
        isSet: n.set,
        type: n.type,
      });
    });
    // get the names and score from each answer for the table
    message.results.forEach((ans) => {
      const nodeBindings = ans.node_bindings;
      const answer = {};
      Object.keys(nodeBindings).forEach((qnodeId) => {
        let kNodeIds = nodeBindings[qnodeId];
        if (!Array.isArray(kNodeIds)) {
          kNodeIds = [kNodeIds];
        }
        answer[qnodeId] = [];
        kNodeIds.forEach((kNodeId) => {
          const kNode = getKgNode(kNodeId);
          if (kNode) {
            answer[qnodeId].push({
              name: kNode.name,
              id: kNode.id,
            });
          } else {
            answer[qnodeId].push({
              name: 'Missing Node',
            });
            unknownNodes = true;
          }
        });
      });
      answer.score = ans.score;
      answer.id = ans.id;
      answers.push(answer);
    });
    return { columnHeaders, answers };
  }

  // builds dense answer
  function getDenseAnswer(answerId) {
    const qNodeIds = getQNodeIds();
    const qEdgeIds = getQEdgeIds();
    const kg = message.knowledge_graph;
    const { kgEdgeMap } = idToIndMaps;
    const answer = message.answers[answerId];
    const ansObj = {
      score: answer.score, nodes: {}, edges: {}, id: answer.id,
    };
    qNodeIds.forEach((qNodeId) => {
      const qNode = getQgNode(qNodeId);
      let nodeListObj = { type: qNode.type, isSet: false };
      const knodeIds = answer.node_bindings[qNodeId];
      if (!Array.isArray(knodeIds)) {
        // This is not a set node
        if (('set' in qNode) && qNode.set) {
          // Actually a set but only has one element
          nodeListObj = { type: qNode.type, name: `Set: ${entityNameDisplay(qNode.type)}`, isSet: true };
          nodeListObj.setNodes = [knodeIds].map((kgNodeId) => getKgNode(kgNodeId));
        } else {
          // for real, not a set
          nodeListObj = { ...getKgNode(knodeIds), ...nodeListObj };
        }
      } else if ((knodeIds.length === 1) && ('set' in qNode) && !qNode.set) {
        // This is not a set node but, for some reason is an array

        nodeListObj = { ...getKgNode(knodeIds[0]), ...nodeListObj };
      } else {
        // Set
        nodeListObj = { type: qNode.type, name: `Set: ${entityNameDisplay(qNode.type)}`, isSet: true };
        nodeListObj.setNodes = knodeIds.map((kgNodeId) => getKgNode(kgNodeId));
      }
      ansObj.nodes[qNodeId] = nodeListObj;
    });
    qEdgeIds.forEach((qEdgeId) => {
      let cEdgeIds = [];
      if (!Array.isArray(answer.edge_bindings[qEdgeId])) { // Just a single id
        cEdgeIds = [answer.edge_bindings[qEdgeId]];
      } else { // we already have an array.
        cEdgeIds = answer.edge_bindings[qEdgeId];
      }
      ansObj.edges[qEdgeId] = cEdgeIds.map((eid) => kg.edges[kgEdgeMap.get(eid)]);
    });

    return ansObj;
  }

  return {
    message,
    annotatedPrunedKnowledgeGraph,
    numKgNodes: numNodes('knowledge_graph'),
    numQgNodes: numNodes('query_graph'),
    answerSetTableData,
    getDenseAnswer,
    unknownNodes,
  };
}
