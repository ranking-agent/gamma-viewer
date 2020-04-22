import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

const Loading = (props) => {
  const { message } = props;
  const showMessage = Boolean(props && message);

  return (
    <div className="center-block">
      <CircularProgress size={50} />
      {showMessage && message}
    </div>
  );
};

export default Loading;
