import axios from 'axios';
import shortid from 'shortid';
import config from '../../../../config.json';

function makeNodePairs(nodes, edges) {
  const axiosArray = [];
  const nodePairs = [];
  // const addrFun = (id1, id2) => `${config.protocol}://${config.host}:${config.port}/api/omnicorp/${id1}/${id2}`;
  const addrFun = (id1, id2) => `https://robokop.renci.org/api/omnicorp/${id1}/${id2}`;
  for (let i = 0; i < nodes.length; i += 1) {
    if (!(('isSet' in nodes[i]) && nodes[i].isSet)) {
      for (let m = i + 1; m < nodes.length; m += 1) {
        if (!(('isSet' in nodes[m]) && nodes[m].isSet)) {
          // Both i and m are not from a set.

          // builds the api call address and pushes it into an array for the promises
          const addr = addrFun(nodes[i].id, nodes[m].id);
          axiosArray.push(axios.request({
            method: 'GET',
            url: addr,
          }));
          // putting the node pairs as an array into an array for when we make the edges
          nodePairs.push([nodes[i].id, nodes[m].id]);
        }
      }
    }
  }
  // We picked pairs of nodes, due to the way simple view works, we might have literature_co-occurence edges for additional nodes
  // We need to look through those edges and add those node pairs
  edges.forEach((e) => {
    if (e.type === 'literature_co-occurrence') {
      const existingPair = nodePairs.find((p) => ((p[0] === e.source_id) && (p[1] === e.target_id)) || ((p[1] === e.source_id) && (p[0] === e.target_id)));
      if (!existingPair) {
        // We need to add this pair
        const addr = addrFun(e.source_id, e.target_id);
        axiosArray.push(axios.get(addr));
        nodePairs.push([e.source_id, e.target_id]);
      }
    }
  });

  const results = { calls: axiosArray, nodes: nodePairs };
  return results;
}

function addSupportEdges(graph, edgePubs, nodes) {
  const { edges } = graph;
  const updatedGraph = graph;
  edgePubs.forEach((pubs, index) => {
    // we only want to add the edge if it has any publications
    if (pubs.length) {
      // We found some pubs to put on the edge
      // There could already be an edge to which we want to add the edges
      const thisEdge = edges.find((e) => {
        const matchesForward = (e.source_id === nodes[index][0]) && (e.target_id === nodes[index][1]);
        const matchesBackward = (e.target_id === nodes[index][0]) && (e.source_id === nodes[index][1]);
        const isSupport = (e.type === 'literature_co-occurrence');

        return isSupport && (matchesForward || matchesBackward);
      });

      if (thisEdge) {
        // We fould an edge
        thisEdge.publications = pubs;
      } else {
        const newEdge = {
          publications: pubs,
          type: 'literature_co-occurrence',
          source_database: 'omnicorp',
          source_id: nodes[index][0],
          target_id: nodes[index][1],
          id: shortid.generate(),
        };
        edges.push(newEdge);
      }
    }
  });
  updatedGraph.edges = edges;
  return updatedGraph;
}

export { makeNodePairs, addSupportEdges };
