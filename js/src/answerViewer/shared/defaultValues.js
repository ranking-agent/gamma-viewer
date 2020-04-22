import entityNameDisplay from '../../../utils/entityNameDisplay';

const graphOptions = {
  autoResize: true,
  height: '500px',
  physics: {
    minVelocity: 1,
    barnesHut: {
      gravitationalConstant: -300,
      centralGravity: 0.3,
      springLength: 120,
      springConstant: 0.05,
      damping: 0.2,
      avoidOverlap: 1,
    },
  },
  layout: {
    randomSeed: 0,
    improvedLayout: false,
  },
  edges: {
    color: {
      color: '#000',
      highlight: '#000',
      hover: '#000',
    },
    hoverWidth: 1,
    selectionWidth: 1,
    // smooth: {
    //   enabled: true,
    //   type: 'dynamic',
    // },
  },
  nodes: {
    shape: 'box',
    labelHighlightBold: false,
    borderWidthSelected: 2,
    borderWidth: 1,
    chosen: false,
  },
  interaction: {
    hover: true,
    zoomView: true,
    dragView: true,
    hoverConnectedEdges: true,
    selectConnectedEdges: false,
    selectable: true,
    tooltipDelay: 400,
  },
};

/* eslint-disable no-param-reassign */
const nodePreProcFn = (n) => {
  n.isSet = ('set' in n) && (((typeof n.set === typeof true) && n.set) || ((typeof n.set === 'string') && n.set === 'true'));
  n.chosen = false; // Not needed since borderWidth manually set below
  n.borderWidth = 1;
  n.borderWidthSelected = 2;
  if (n.isSet) {
    n.borderWidth = 3;
    n.borderWidthSelected = 5;
  } else {
    n.borderWidth = 1;
  }
  if (n.isSelected) { // Override borderwidth when isSelected set by user thru props
    n.borderWidth = n.borderWidthSelected;
  }
  if (!('label' in n)) {
    if ('name' in n) {
      n.label = n.name;
    } else if (n.curie) {
      if (Array.isArray(n.curie)) {
        if (n.curie.length > 0) {
          n.label = n.curie[0]; // eslint-disable-line prefer-destructuring
        } else {
          n.label = '';
        }
      } else {
        n.label = n.curie;
      }
    } else if ('type' in n) {
      n.label = entityNameDisplay(n.type);
    } else {
      n.label = '';
    }
  }
  n.label = `${n.id}: ${n.label}`;
  return n;
};
/* eslint-enable no-param-reassign */

export { graphOptions, nodePreProcFn };
