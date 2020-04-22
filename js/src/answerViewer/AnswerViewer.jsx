import React, { useState } from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Paper from '@material-ui/core/Paper';

import QuestionGraph from './questionGraph/Wrapper';
// import AnswerTable from './answerTable/AnswerTable';
import KnowledgeGraph from './knowledgeGraph/KnowledgeGraph';
import useAnswerViewer from '../customHooks/useAnswerViewer';

const answerSetTabEnum = {
  questionGraph: 0,
  answerTable: 1,
  aggregateGraph: 2,
};


export default function AnswerViewer(props) {
  const { message, concepts } = props;
  const [tabKey, setTabKey] = useState(answerSetTabEnum.questionGraph);
  // console.log('message', message);
  const answersetStore = useAnswerViewer(message);

  return (
    <>
      {message.results && Array.isArray(message.results) && message.results.length > 0 ? (
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
          <QuestionGraph
            concepts={concepts}
            store={answersetStore}
            tab={tabKey}
          />
          {/* <AnswerTable
            concepts={concepts}
            store={answersetStore}
            tab={tabKey}
          /> */}
          <KnowledgeGraph
            concepts={concepts}
            store={answersetStore}
            tab={tabKey}
          />
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
