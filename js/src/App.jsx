import React, { useState, useEffect } from 'react';
import yaml from 'js-yaml';

import './app.css';
import backupBiolink from './biolink-model.yml';
import AnswerViewer from './AnswerViewer';
import Loading from './shared/loading/Loading';

import BiolinkContext from '../utils/biolinkContext';
import trapiUtils from '../utils/trapiUtils';
import useBiolink from '../utils/useBiolink';

export default function App(props) {
  // console.log('Props from Jupyter Notebook:', props);
  const { data } = props;
  const biolink = useBiolink();
  const [loading, toggleLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  // Load biolink on page load
  function fetchBiolink() {
    toggleLoading(true);
    fetch('https://raw.githubusercontent.com/biolink/biolink-model/master/biolink-model.yaml')
      .then(async (res) => {
        const response = await res.text();
        const model = yaml.load(response);
        biolink.initialize(model);
        toggleLoading(false);
      })
      .catch((err) => {
        console.error(err);
        biolink.initialize(backupBiolink);
        toggleLoading(false);
        // setErrors([...errors, 'Failed to retrieve the biolink model. Please try again later.']);
      });
  }
  useEffect(() => { fetchBiolink(); }, []);

  useEffect(() => {
    toggleLoading(true);
    setErrors(trapiUtils.validateMessage(data));
    toggleLoading(false);
  }, [data]);

  return (
    <div className="appContainer">
      {!loading ? (
        <>
          {!errors.length ? (
            <BiolinkContext.Provider value={biolink}>
              <AnswerViewer
                message={data.message}
              />
            </BiolinkContext.Provider>
          ) : (
            <>
              {errors.map((err, ind) => (
                <h4 key={ind}>{err}</h4>
              ))}
            </>
          )}
        </>
      ) : (
        <Loading message="Initializing..." positionStatic />
      )}
    </div>
  );
}
