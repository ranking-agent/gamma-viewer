import _ from 'lodash';

export default function ingestMessage(object) {
  console.log('initial message', object);
  const message = _.cloneDeep(object);

  message.results.map((result) => {
    const node_bindings = {};
    result.node_bindings.forEach((nb) => {
      if (nb.qg_id in node_bindings) {
        if (Array.isArray(nb.kg_id)) {
          node_bindings[nb.qg_id].concat(nb.kg_id);
        } else {
          node_bindings[nb.qg_id].append(nb.kg_id);
        }
      } else if (Array.isArray(nb.kg_id)) {
        node_bindings[nb.qg_id] = nb.kg_id;
      } else {
        node_bindings[nb.qg_id] = [nb.kg_id];
      }
    });
    result.node_bindings = node_bindings;
    const edge_bindings = {};
    result.edge_bindings.forEach((eb) => {
      if (eb.qg_id in edge_bindings) {
        if (Array.isArray(eb.kg_id)) {
          edge_bindings[eb.qg_id].concat(eb.kg_id);
        } else {
          edge_bindings[eb.qg_id].push(eb.kg_id);
        }
      } else if (Array.isArray(eb.kg_id)) {
        edge_bindings[eb.qg_id] = eb.kg_id;
      } else {
        edge_bindings[eb.qg_id] = [eb.kg_id];
      }
    });
    result.edge_bindings = edge_bindings;
    return result;
  });

  return message;
}
