import React from 'react';

export default function App(props) {
  console.log('Props from Jupyter Notebook:', props);
  return (
    <>
      <h1>This is React.</h1>
      <p>The message you sent was: {props.data.test}</p>
    </>
  );
}