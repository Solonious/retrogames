/**
 * Created by sergeysolonar on 25.02.17.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import Routes from './routes';

import '../dist/css/style.css';
import config from '/config';

filepicker.setKey(config.apiKey);

ReactDOM.render(
	Routes,
	document.getElementById('content')
);