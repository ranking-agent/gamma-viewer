import React, { useState, useEffect } from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Paper from '@material-ui/core/Paper';

import QuestionGraph from './questionGraph/Wrapper';
import AnswerTable from './answerTable/AnswerTable';
import KnowledgeGraph from './knowledgeGraph/KnowledgeGraph';
import useMessageStore from './customHooks/useMessageStore';
import strings from '../utils/stringUtils';
import queryGraphUtils from '../utils/queryGraph';

const answerSetTabEnum = {
  questionGraph: 0,
  answerTable: 1,
  aggregateGraph: 2,
};

function bindingTrapiToStoreFormat(oldBinding) {
  const newBindings = {};
  const convertedEdgeBindings = [];
  Object.keys(oldBinding.edge_bindings).forEach((qg_id) => {
    const kg_ids = [];
    oldBinding.edge_bindings[qg_id].forEach((kg_id) => {
      kg_ids.push(kg_id.id);
    });
    convertedEdgeBindings.push({
      qg_id,
      kg_id: kg_ids,
    });
  });
  newBindings.edge_bindings = convertedEdgeBindings;
  const convertedNodeBindings = [];
  Object.keys(oldBinding.node_bindings).forEach((qg_id) => {
    const kg_ids = [];
    oldBinding.node_bindings[qg_id].forEach((kg_id) => {
      kg_ids.push(kg_id.id);
    });
    convertedNodeBindings.push({
      qg_id,
      kg_id: kg_ids,
    });
  });
  newBindings.node_bindings = convertedNodeBindings;
  if ('score' in oldBinding) {
    newBindings.score = oldBinding.score;
  }
  return newBindings;
}

/*
 * Convert a message of the new Trapi v1.0 format to match
 * the old format used by useMessageStore
*/
function msgTrapiToStoreFormat(message) {
  message.query_graph = queryGraphUtils.convert.internalToReasoner(message.query_graph);
  message.knowledge_graph = queryGraphUtils.convert.internalToReasoner(message.knowledge_graph);
  message.results = message.results.map(bindingTrapiToStoreFormat);
  return message;
}

export default function AnswerViewer(props) {
  const { message } = props;
  const [tabKey, setTabKey] = useState(answerSetTabEnum.questionGraph);
  // console.log('message', message);
  const messageStore = useMessageStore();

  useEffect(() => {
    const convertedMessage = _.cloneDeep(message);
    Object.values(convertedMessage.query_graph.nodes).forEach((node) => {
      if (!node.name) {
        node.name = `${node.id || strings.displayCategory(node.category)}`;
      }
    });
    Object.values(convertedMessage.query_graph.nodes).forEach(queryGraphUtils.standardizeCategory);
    Object.values(convertedMessage.query_graph.edges).forEach(queryGraphUtils.standardizePredicate);
    Object.values(convertedMessage.knowledge_graph.nodes).forEach(queryGraphUtils.standardizeCategory);
    Object.values(convertedMessage.knowledge_graph.edges).forEach(queryGraphUtils.standardizePredicate);

    messageStore.initializeMessage(msgTrapiToStoreFormat(convertedMessage));
  }, [message]);
  // const answersetStore = useAnswerViewer(message);

  return (
    <>
      {messageStore.message.results && Array.isArray(messageStore.message.results) && messageStore.message.results.length > 0 ? (
        <>
          <Tabs
            value={tabKey}
            onChange={(e, v) => setTabKey(v)}
            id="answerset_tabs"
          >
            <Tab label="Question Graph" />
            <Tab label="Answers Table" />
            <Tab label="Aggregate Graph" />
          </Tabs>
          {tabKey === answerSetTabEnum.questionGraph && (
            <QuestionGraph
              store={messageStore}
            />
          )}
          {tabKey === answerSetTabEnum.answerTable && (
            <AnswerTable
              store={messageStore}
            />
          )}
          {tabKey === answerSetTabEnum.aggregateGraph && (
            <KnowledgeGraph
              store={messageStore}
            />
          )}
        </>
      ) : (
        <Paper>
          <h4>
            No answers were found.
          </h4>
        </Paper>
      )}
    </>
  );
}
