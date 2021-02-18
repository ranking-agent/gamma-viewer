import React from 'react';
import Paper from '@material-ui/core/Paper';
import QuestionGraph from './QuestionGraph';

export default function QuestionGraphWrapper(props) {
  const { store } = props;

  return (
    <Paper>
      <QuestionGraph
        height={200}
        // width={width}
        question={store.message.query_graph}
        graphState="display"
        selectable
        graphClickCallback={() => {}} // we don't want the graph to select anything on click
      />
    </Paper>
  );
}
