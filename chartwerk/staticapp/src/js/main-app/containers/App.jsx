import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Actions from './../actions/';

import Component from './../components/Component';

const App = (props) => {
  const actions = bindActionCreators(Actions, props.dispatch);
  return (
    <div>
      <Component data={props.data} actions={actions} />
    </div>
  );
};

App.propTypes = {
  dispatch: React.PropTypes.object,
  actions: React.PropTypes.object,
  data: React.PropTypes.object,
};

const mapStateToProps = state => ({
  data: state,
});

export default connect(mapStateToProps)(App);
