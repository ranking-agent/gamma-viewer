import _ from 'lodash';

export default function ingestMessage(object) {
  const message = _.cloneDeep(object);

  message.results.map((result) => {
    const nodeBindings = {};
    result.node_bindings.forEach((nb) => {
      if (nb.qg_id in nodeBindings) {
        if (Array.isArray(nb.kg_id)) {
          nodeBindings[nb.qg_id].concat(nb.kg_id);
        } else {
          nodeBindings[nb.qg_id].append(nb.kg_id);
        }
      } else if (Array.isArray(nb.kg_id)) {
        nodeBindings[nb.qg_id] = nb.kg_id;
      } else {
        nodeBindings[nb.qg_id] = [nb.kg_id];
      }
    });
    result.node_bindings = nodeBindings;
    const edgeBindings = {};
    result.edge_bindings.forEach((eb) => {
      if (eb.qg_id in edgeBindings) {
        if (Array.isArray(eb.kg_id)) {
          edgeBindings[eb.qg_id].concat(eb.kg_id);
        } else {
          edgeBindings[eb.qg_id].push(eb.kg_id);
        }
      } else if (Array.isArray(eb.kg_id)) {
        edgeBindings[eb.qg_id] = eb.kg_id;
      } else {
        edgeBindings[eb.qg_id] = [eb.kg_id];
      }
    });
    result.edge_bindings = edgeBindings;
    return result;
  });

  return message;
}
