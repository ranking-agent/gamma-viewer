import React from 'react';
import Paper from '@material-ui/core/Paper';
import QuestionGraph from './QuestionGraph';

import { nodePreProcFn } from '../shared/defaultValues';

export default function QuestionGraphWrapper(props) {
  const { store, concepts, tab } = props;

  return (
    <>
      {tab === 0 && (
        <Paper>
          <QuestionGraph
            height={200}
            // width={width}
            question={store.message.query_graph}
            concepts={concepts}
            graphState="display"
            selectable
            nodePreProcFn={nodePreProcFn}
            graphClickCallback={() => {}} // we don't want the graph to select anything on click
          />
        </Paper>
      )}
    </>
  );
}
