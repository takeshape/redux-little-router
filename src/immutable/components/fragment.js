// @flow
import type { MapStateToProps } from 'react-redux';
import { connect } from 'react-redux';
import { FragmentComponent } from '../../components/fragment';
import propsToJS from './props-to-js';

const mapStateToProps: MapStateToProps<*, *, *> = state => ({
  location: state.get('router')
});

// $FlowFixMe
export default connect(mapStateToProps)(propsToJS(FragmentComponent));
