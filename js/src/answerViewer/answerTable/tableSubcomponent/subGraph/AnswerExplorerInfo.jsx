import React, { useState, useEffect } from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { FaDownload } from 'react-icons/fa';
import axios from 'axios';

import AnswerGraph from '../../../shared/AnswerGraph';
import PubmedList from './PubmedList';

import curieUrls from '../../../../../utils/curieUrls';
import ctdUrls from '../../../../../utils/ctdUrls';
import getNodeTypeColorMap from '../../../../../utils/colorUtils';
import entityNameDisplay from '../../../../../utils/entityNameDisplay';

const shortid = require('shortid');

const nodeBlacklist = ['isSet', 'labels', 'label', 'equivalent_identifiers', 'type', 'id', 'degree', 'name', 'title', 'color', 'binding'];
const edgeBlacklist = ['binding', 'ctime', 'id', 'publications', 'source_database', 'source_id', 'target_id', 'type'];

export default function AnswerExplorerInfo(props) {
  const { graph, selectedEdge: parentSelectedEdge, store } = props;
  const [selectedEdge, setSelectedEdge] = useState(parentSelectedEdge);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [subgraph, setSubgraph] = useState({ nodes: [], edges: [] });
  const [disableGraphClick, setDisableGraphClick] = useState(false);
  const [downloadingPubs, setDownloadingPubs] = useState(false);

  function syncPropsAndState() {
    const nodes = graph.nodes.filter((n) => ((n.id === selectedEdge.source_id) || (n.id === selectedEdge.target_id)));
    const nodeIds = nodes.map((n) => n.id);
    const edges = graph.edges.filter((e) => (nodeIds.includes(e.source_id) && nodeIds.includes(e.target_id)));

    setSubgraph({ nodes, edges });
    setSelectedEdgeId(selectedEdge.edgeIdFromKG);
    setSelectedNodeId(null);

    if (edges.length === 1) {
      setDisableGraphClick(true);
    }
  }

  useEffect(() => {
    syncPropsAndState();
  }, []);

  function onGraphClick(event) {
    if (disableGraphClick) {
      return;
    }

    if (event.edges.length !== 0) { // Clicked on an Edge
      setSelectedEdgeId(event.edgeObjects[0].edgeIdFromKG);
      setSelectedEdge(event.edgeObects[0]);
    } else if (event.nodes.length !== 0) { // Clicked on a node
      setSelectedNodeId(event.nodes[0]);
    }
  }

  function getNodeInfoFrag(n) {
    if (!n || !('name' in n)) {
      return (<div />);
    }
    const edge = subgraph.edges.find((e) => e.id === selectedEdgeId);
    const urls = curieUrls(n.id);
    if (edge.source_database.includes('ctd')) {
      const urlObj = ctdUrls(n.type, n.equivalent_identifiers);
      urls.push(urlObj);
    }
    const nodeTypeColorMap = getNodeTypeColorMap(store.concepts);
    const backgroundColor = nodeTypeColorMap(n.type);
    const extraFields = Object.keys(n).filter((property) => !nodeBlacklist.includes(property));
    return (
      <Card>
        <h3 className="cardTitle" style={{ backgroundColor }}>
          {n.name}
          <div className="pull-right">
            {
              urls.map((link) => (
                <span key={shortid.generate()} style={{ margin: '0px 5px' }}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <img src={link.iconUrl} alt={link.label} height={16} width={16} />
                  </a>
                </span>
              ))
            }
          </div>
        </h3>
        <CardContent className="cardContent">
          <h5>
            {`type: ${entityNameDisplay(n.type)}`}
          </h5>
          <h5>
            {`id: ${n.id}`}
          </h5>
          {extraFields.map((property) => (
            <h5 key={shortid.generate()}>
              {`${property}: ${n[property].toString()}`}
            </h5>
          ))}
        </CardContent>
      </Card>
    );
  }

  function getEdgeInfoFrag(edgeId) {
    if (!edgeId) {
      return (<div />);
    }
    const edge = subgraph.edges.find((e) => e.id === edgeId);

    const extraFields = Object.keys(edge).filter((property) => !edgeBlacklist.includes(property));

    let origin = ['Unknown'];
    const sourceToOriginString = (source) => source; // source.substr(0, source.indexOf('.'));

    if ('source_database' in edge) {
      if (Array.isArray(edge.source_database) && edge.source_database.length > 0) {
        origin = edge.source_database.map((source) => sourceToOriginString(source));
      } else {
        origin = [sourceToOriginString(edge.source_database)];
      }
    }
    return (
      <Card>
        <h3 className="cardTitle greyBackground">
          {edge.type}
        </h3>
        <CardContent className="cardContent">
          <h5>
            Established using:
            <p>
              {origin.join(', ')}
            </p>
          </h5>
          {extraFields.map((property) => (
            <h5 key={shortid.generate()}>
              {`${property}: ${Array.isArray(edge[property]) ? edge[property].join(', ') : edge[property].toString()}`}
            </h5>
          ))}
        </CardContent>
      </Card>
    );
  }

  function downloadPublicationsInfo(publications) {
    const defaultInfo = {
      id: '',
      title: 'Unable to fetch publication information',
      authors: [],
      journal: '',
      source: '',
      pubdate: '',
      url: '',
      doid: '',
    };
    const getInfo = (pub) => {
      const paperInfo = {
        id: pub.uid,
        title: pub.title,
        authors: pub.authors,
        journal: pub.fulljournalname,
        source: pub.source,
        pubdate: pub.pubdate,
        url: `https://www.ncbi.nlm.nih.gov/pubmed/${pub.uid}/`,
        doid: pub.elocationid,
      };
      return { ...defaultInfo, ...paperInfo };
    };

    const getPubmedInformation = (pmid) => {
      let pmidStr = pmid.toString();
      if ((typeof pmidStr === 'string' || pmidStr instanceof String) && (pmidStr.indexOf(':') !== -1)) {
        // pmidStr has a colon, and therefore probably a curie, remove it.
        pmidStr = pmidStr.substr(pmidStr.indexOf(':') + 1);
      }

      return new Promise((resolve, reject) => {
        axios.request({
          method: 'GET',
          url: `https://robokop.renci.org/api/pubmed/${pmidStr}`,
        })
          .then((pub) => {
            console.log('pub', pub);
            resolve(getInfo(pub));
          })
          .catch((err) => {
            console.log('Error', err);
            reject(defaultInfo);
          });
      });
    };

    Promise.all(publications.map((pmid) => new Promise((resolve) => resolve(getPubmedInformation(pmid))))).then((data) => {
      // Transform the data into a json blob and give it a url
      // const json = JSON.stringify(data);
      // const blob = new Blob([json], { type: 'application/json' });
      // const url = URL.createObjectURL(blob);

      const fields = ['url', 'title', 'journal', 'pubdate'];
      const replacer = (key, value) => (value === null ? '' : value);

      const csv = data.map((row) => fields.map((f) => JSON.stringify(row[f], replacer)).join(','));
      csv.unshift(fields.join(','));
      const csvText = csv.join('\n');

      const blob = new Blob([csvText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      // Create a link with that URL and click it.
      const a = document.createElement('a');
      a.download = 'publications.csv';
      a.href = url;
      a.click();
      a.remove();
    }).then(() => setDownloadingPubs(false));
  }

  function getPublicationsFrag() {
    let publicationListFrag = <div><p>Click on edge above to see a list of publications.</p></div>;
    let publicationsTitle = 'Publications';

    let publications = [];
    if (selectedEdgeId !== null) {
      // Edge is selected
      let edge = subgraph.edges.find((e) => e.id === selectedEdgeId);
      if (typeof edge === 'undefined') {
        edge = subgraph.edges.find((e) => e.edgeIdFromKG === selectedEdgeId);
      }
      if (typeof edge === 'undefined') {
        console.log('Couldn\'t find this edge', selectedEdgeId, subgraph.edges);
        return (
          <div>
            <h4 style={{ marginTop: '15px' }}>
              An error was encountered fetching publication information.
            </h4>
          </div>
        );
      }

      const sourceNode = subgraph.nodes.find((n) => n.id === edge.source_id);
      const targetNode = subgraph.nodes.find((n) => n.id === edge.target_id);
      if ('publications' in edge && Array.isArray(edge.publications)) {
        ({ publications } = edge);
      }
      publicationsTitle = `${publications.length} Publications for ${sourceNode.name} and ${targetNode.name}`;
      publicationListFrag = <PubmedList publications={publications} />;
    } else if (selectedNodeId) {
      // Node is selected
      const node = subgraph.nodes.find((n) => n.id === selectedNodeId);
      if ('publications' in node && Array.isArray(node.publications)) {
        ({ publications } = node);
      }
      publicationsTitle = `${publications.length} Publications for ${node.name}`;
      publicationListFrag = <PubmedList publications={publications} />;
    }

    const downloadCallback = () => { setDownloadingPubs(true); downloadPublicationsInfo(publications); };
    const showDownload = publications.length >= 1;

    const cursor = downloadingPubs ? 'progress' : 'pointer';
    const activeCallback = downloadingPubs ? () => { } : downloadCallback;
    const downloadTitle = downloadingPubs ? 'Downloading Please Wait' : 'Download Publications';
    const downloadColor = downloadingPubs ? '#333' : '#000';
    return (
      <Card className="publicationsContainer">
        <h3 className="cardTitle greyBackground">
          {publicationsTitle}
          <div className="pull-right">
            <div style={{ position: 'relative' }}>
              {showDownload && (
                <div style={{ position: 'absolute', top: -3, right: -8 }}>
                  <span style={{ fontSize: '22px', color: downloadColor }} title={downloadTitle}>
                    <FaDownload onClick={activeCallback} style={{ cursor }} />
                  </span>
                </div>
              )}
            </div>
          </div>
        </h3>
        <CardContent style={{ padding: 0 }}>
          {publicationListFrag}
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="answerExplorerContainer">
      <AnswerGraph
        height={200}
        subgraph={{ nodes: subgraph.nodes, edges: subgraph.edges }}
        layoutStyle="auto"
        layoutRandomSeed={1}
        showSupport
        omitEdgeLabel={false}
        varyEdgeSmoothRoundness
        callbackOnGraphClick={onGraphClick}
        concepts={store.concepts}
      />
      <div id="subgraphModalNodeEdgeInfo">
        {getNodeInfoFrag(subgraph.nodes[0])}
        {getEdgeInfoFrag(selectedEdgeId)}
        {getNodeInfoFrag(subgraph.nodes[1])}
      </div>
      <div>
        {getPublicationsFrag()}
      </div>
    </div>
  );
}
