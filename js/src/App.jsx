import React from 'react';
import config from '../config.json';
import './app.css';
import AnswerViewer from './answerViewer/AnswerViewer';

import ingestMessage from './ingestMessage';
import validateMessage from '../utils/validateMessage';

export default function App(props) {
  // console.log('Props from Jupyter Notebook:', props);
  const { data } = props;
  const { concepts } = config;
  const msg = validateMessage(data);
  if (!msg.valid) {
    return (
      <>
        <h4>Invalid message. Errors:</h4>
        {msg.errors.map((err) => (
          <p>{`${err.dataPath}: ${err.keyword} ${err.message}`}</p>
        ))}
      </>
    );
  }
  const message = ingestMessage(data);
  if (message.errors) {
    return (
      <div>
        {message.message.join('\n')}
      </div>
    );
  }
  return (
    <div className="appContainer">
      <AnswerViewer
        message={message}
        concepts={concepts}
      />
    </div>
  );
}
