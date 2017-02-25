/**
 * Created by sergeysolonar on 25.02.17.
 */
import React from 'react';
import {Router, Route, hashHistory, IndexRoute} from 'react-router';
// import {Home, Welcome, About, Contact} from './components';

const routes = {
	<Router history={hashHistory}>
		<Route path="/" component={Home}>
			<IndexRoute component={Welcome}/>
			<Route path="/about" component={About}/>
			<Route path="/contact" component={Contact}/>
		</Route>
	</Router>
};

export default routes;