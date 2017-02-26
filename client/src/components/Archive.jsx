import React from 'react';
import { Link } from 'react-router';

export default class Layout extends React.PureComponent {

	render() {
		return (
			<div className="view">
				<nav className="navbar navbar-inverse">
					<div className="container">
						<div className="navbar-header">
							<button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-targe="#navbar" aria-expanded="false" aria-controls="navbar">
								<span className="sr-only">Toggle navigation</span>
								<span className="icon-bar"></span>
								<span className="icon-bar"></span>
								<span className="icon-bar"></span>
							</button>
							<Link className="navbar-brand" to="/">
								<img src="https://cdn.filestackcontent.com/nLnmrZQaRpeythR4ezUo" className="header-logo" />
							</Link>
						</div>
					</div>
				</nav>
				{this.props.children}
				<footer className="text-center">
					<p>&copy 2016 Sergii Solonar</p>
				</footer>
			</div>
		);
	}
}