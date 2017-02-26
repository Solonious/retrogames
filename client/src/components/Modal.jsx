import React from 'react';

export default class Modal extends React.PureComponent {
	
	render() {
		const { _id, img, name, description, year, picture } = this.props.game;
		return (
			<div className="modalfade" id="game-modal" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel">
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<button className="close" type="button" data-dismiss="modal" aria-label="Close">
								<span aria-hidden="true">x</span>
							</button>
							<h4 className="modal-title" id="myModalLabel" >{`${name} (${year})`}</h4>
						</div>
						<div className="modal-body">
							<div>
								<img src={picture} className="img-responsive img-big"/>
							</div>
							<hr/>
							<p>{description}</p>
						</div>
						<div className="modal-footer">
							<button className="btn btn-warning" data-dismiss="modal">Close</button>
						</div>
					</div>
				</div>
			</div>
		);
	}
}