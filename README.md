[Tutorial](https://scotch.io/tutorials/retrogames-library-with-node-react-and-redux-1-server-api-and-react-frontend#filestack)

## Create route table
###Routes Table
| route | result |
| ------| ------ |
| GET /games	| Get all the games. |
|POST /games | Create a game. |
|GET /games/:id	| Get a single game.|
|DELETE /games/:id | Delete a game. | 

## Setup
Initialize `package.json`

```Bash
>yarn init
>yarn add express mongoose morgan body-parser
>yarn add babel-core babel-cli babel-preset-es2015 --dev
```

Open the `package.json` file and add

```Bash
"scripts": {
    "api": "babel-node server.js"
  }
```
Add `.babbelrc` file with context

```Bash
{
  "presets": ["es2015"]
}
```
## Server JS

Create the `server.js` file

```javascript
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import morgan from 'morgan';

// We gotta import our models and routes
import Game from './app/models/game';
import { getGames, getGame, postGame, deleteGame } from './app/routes/game';

const app = express(); // Our express server!
const port = process.env.PORT || 8080;

// DB connection through Mongoose
const options = {
  server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
  replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } }
}; // Just a bunch of options for the db connection
mongoose.Promise = global.Promise;
// Don't forget to substitute it with your connection string
mongoose.connect('YOUR_MONGO_CONNECTION', options);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

// Body parser and Morgan middleware
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use(morgan('dev'));

// We tell express where to find static assets
app.use(express.static(__dirname + '/client/dist'));

// Enable CORS so that we can make HTTP request from webpack-dev-server
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// API routes
app.route('/games')
  // create a game
  .post(postGame)
  // get all the games
  .get(getGames);
app.route('/games/:id')
  // get a single game
  .get(getGame)
  // delete a single game
  .delete(deleteGame);

// ...For all the other requests just sends back the Homepage
app.route("*").get((req, res) => {
  res.sendFile('client/dist/index.html', { root: __dirname });
});

app.listen(port);

console.log(`listening on port ${port}`);
```

## Game model define

Paste the following code in `/app/modes/game.js:`
```javascript
// Dependencies
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Our schema definition
const gameSchema = new Schema(
    {
        name: String,
        year: Number,
        description: String,
        picture: String,
        postDate : { type: Date, default: Date.now } // Timestamp

    }
);

// We export the schema to use it anywhere else
export default mongoose.model('Game', gameSchema);
```
##Routes callbacks

Create the `game.js` file in `/client/app/routes` and paste the following code:

```javascript
// We import our game schema
import Game from '../models/game';

// Get all the games sorted by postDate
const getGames = (req, res) => {
    // Query the db, if no errors send all the games to the client
    Game.find(null, null, { sort: { postDate : 1 } }, (err, games) => {
        if (err) {
            res.send(err);
        }
        res.json(games); // Games sent as json
    });
}

// Get a single game filtered by ID
const getGame = (req, res) => {
    const { id } = req.params;
    // Query the db for a single game, if no errors send it to the client
    Game.findById(id, (err, game) => {
        if (err) {
            res.send(err);
        }
        res.json(game); // Game sent as json
    });
}

// Get the body data and create a new Game
const postGame = (req, res) => {
  // We assign the game info to a empty game and send a message back if no errors
  let game = Object.assign(new Game(), req.body);
  // ...Then we save it into the db
  game.save(err => {
    if (err) {
      res.send(err);
    }
    res.json({ message: 'game created' }); // A simple JSON answer to inform the client
  });
};

// Delete a game by the given ID
const deleteGame = (req, res) => {
// We remove the game by the given id and send a message back if no errors
  Game.remove(
    { _id: req.params.id },
    err => {
      if (err) {
        res.send(err);
      }
      res.json({ message: 'successfully deleted' }); // A simple JSON answer to inform the client
    }
  );
};

// We export our functions to be used in the server routes
export { getGames, getGame, postGame, deleteGame };
```
##Client side
Installing `webpack`

```bash
>yarn add webpack webpack-dev-server webpack-merge webpack-validator --dev
>yarn add babel-preset-react babel-loader react-hot-loader style-loader css-loader file-loader --dev
>yarn add react-hot-loader@3.0.0-beta.6 --dev
```
Let's create `webpack-paths.js` and paste the following code:

```javascript
"use strict";

const path = require('path');
// We define some paths to be used throughout the webpack config
module.exports = {
  src: path.join(__dirname, 'client/src'),
  dist: path.join(__dirname, 'client/dist'),
  css: path.join(__dirname, 'client/dist/css')
};
```

Let's move on and create the `webpack.config.js` file and paste the following code:

```javascript
"use strict";

const merge = require('webpack-merge');
const validate = require('webpack-validator');

const PATHS = require('./webpack-paths');
const loaders = require('./webpack-loaders');

const common = {
    entry: { // The entry file is index.js in /client/src
        app: PATHS.src 
    },
    output: { // The output defines where the bundle output gets created
        path: PATHS.dist,
        filename: 'bundle.js'
    },
    module: { 
        loaders: [
          loaders.babel, // Transpiler
          loaders.css, // Our bundle will contain the css 
          loaders.font, // Load fonts
        ]
    },
    resolve: {
        extensions: ['', '.js', '.jsx'] // the extensions to resolve
    }
};

let config;
// The switch defines the different configuration as development requires webpack-dev-server
switch(process.env.NODE_ENV) {
    case 'build':
        config = merge(
            common,
            { devtool: 'source-map' } // SourceMaps on separate file
         );
        break;
    case 'development':
        config = merge(
            common,
            { devtool: 'eval-source-map' }, // Default value
            loaders.devServer({
                host: process.env.host,
                port: 3000
            })
        );
}

// We export the config
module.exports = validate(config);
```
Let's create `webpack-loaders.js` and paste the following code:
```javascript
"use strict";

const webpack = require('webpack');
const PATHS = require('./webpack-paths');

exports.devServer = function(options) {
    return {
        devServer:{
            historyApiFallback: true,
            hot: true, // Enable hot module
            inline: true,
            stats: 'errors-only',
            host: options.host, // http://localhost
            port: options.port, // 3000
            contentBase: './client/dist',
        },
        // Enable multi-pass compilation for enhanced performance
        plugins: [ // Hot module
            new webpack.HotModuleReplacementPlugin({
                multistep: true
            })
        ]
    };
}
// the css loader
exports.css = {
  test: /\.css$/,
  loaders: ['style', 'css'],
  include: PATHS.css
}
// The file loader
exports.font = {
  test: /\.ttf$/,
  loaders: ['file']
}
// Babel loader
exports.babel = {
  test: /\.jsx?$/,
  exclude: /node_modules/,
  loaders: ['babel']
};
```

And added `.babelrc`

```json
{
  "presets": [
    "es2015",
    "react"
  ],
  "plugins": [
    "react-hot-loader/babel"
  ]
}
```
Finally, we also gotta edit `package.json` to include new scripts commands:

```javascript
"start": "NODE_ENV=development webpack-dev-server",
"build": "NODE_ENV=build webpack"
 ```
##Assets

In `/client/dist` create a file `index.html` and paste the following code:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Retrogames Archive</title>
    <link rel="icon" href="https://cdn.filestackcontent.com/S0zeyXxRem6pL6tHq9pz">
    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet">
  </head>
  <body>
    <div id="content"></div>
    <script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
    <script src="https://api.filestackapi.com/filestack.js"></script>
    <script src="./bundle.js"></script>
  </body>
</html>
```
##React

Our routes configuration is composed by two main routes with their children routes:

>The Homepage is a route with three children routes in charge to render the components related to home, features and contacts links.

>The Games route handles the children routes to list the games and add a new one.

Let's install `react packages`
```bash
>yarn add react react-dom react-router
```

Creating a file `index.js` in `/client/src` and past the following code:

```javascript
import '../dist/css/style.css';
import React from 'react';
import ReactDOM from 'react-dom';
import Routes from './routes';

// Don't forget to add your API key
filepicker.setKey("YOUR_API_KEY");

// Our views are rendered inside the #content div
ReactDOM.render(
  Routes,
  document.getElementById('content')
);
```

>REMEMBER You should have own `apiKey` from [`Filestack`](https://dev.filestack.com)  

##Routes

Create `routes.js` in `/client/src` and paste the following code:
```javascript
import React from 'react';
import { Router, Route, hashHistory, IndexRoute } from 'react-router';
import { Home, Welcome, About, Contact } from './components';

// Use hashHistory for easier development
const routes = (
  <Router history={hashHistory}>
    <Route path="/" component={Home}>
      <IndexRoute component={Welcome} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
    </Route>
  </Router>
);

export default routes;
```
####URL paths structure:
| Url | Component |
|---|---|
| / | Home -> Welcome |
| /about | Home -> About |
| /contact | Home -> Contact |
| /games   | Archive -> GamesContainer |
| /games/add | Archive -> AddGameContainer |



##Components
###Home.jsx

in `/client/src/components` create a file `Home.jsx` and paste the following code:

```javascript
import React, { PureComponent } from 'react';
import { Link } from 'react-router';

export default class Home extends PureComponent {
  active (path) {
    // Returns active when the path is equal to the current location
    if (this.props.location.pathname === path) {
      return 'active';
    }
  }
  render () {
    return (
      <div className="main">
        <div className="site-wrapper">
          <div className="site-wrapper-inner">
            <div className="cover-container">
              <div className="masthead clearfix">
                <div className="inner">
                  <nav>
                    <img className="header-logo" src="https://cdn.filestackcontent.com/nLnmrZQaRpeythR4ezUo"/>
                    <ul className="nav masthead-nav">
                      <li className={this.active('/')}><Link to="/">Home</Link></li>
                      <li className={this.active('/about')}><Link to="/about">About</Link></li>
                      <li className={this.active('/contact')}><Link to="/contact">Contact</Link></li>
                    </ul>
                  </nav>
                </div>
              </div>
              {this.props.children}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
```

###Welcome.jsx

Create the file `Welcome.jsx` in `/client/src/component` and paste the following code:

```javascript
import React, { PureComponent } from 'react';
import { Link } from 'react-router';

export default class Welcome extends PureComponent {
  render () {
    return (
      <div className="inner cover">
        <h1 className="cover-heading">Welcome</h1>
        <p className="lead">Click on browse to start your journey into the wiki of games that made history.</p>
        <p className="lead">
          <Link className="btn btn-lg" to="/games">Browse!</Link>
        </p>
      </div>
    );
  }
}
```

###About.jsx
Create `About.jsx` in `/client/src/components` and paste the following code:

````javascript
import React, { PureComponent } from 'react';

export default class About extends PureComponent {
  render () {
    return (
      <div className="inner cover">
        <h1 className="cover-heading">Javascript Everywhere</h1>
        <p className="lead">This archive is made with Node.js and React. The two communicate through async HTTP requests handled by Redux-saga... Yes we love Redux here!</p>
      </div>
    );
  }
}
````
###Contact.jsx

Create `Contact.jsx` in `/client/src/components` and paste the following code:

````javascript
import React, { PureComponent } from 'react';

export default class About extends PureComponent {
  render () {
    return (
      <div className="inner cover">
        <h1 className="cover-heading">Any Questions?</h1>
        <p className="lead">Don't hesitate to contact me: zaza.samuele@gmail.com</p>
      </div>
    );
  }
}
````
###/components/index.js

````javascript
import About from './About';
import Contact from './Contact';
import Home from './Home';
import Welcome from './Welcome';

// We export all the components at once
export { About, Contact, Home, Welcome };
````
###/containers/index.js

Create it in `/client/src/containers` and paste the following code:

````javascript
import AddGameContainer from './AddGameContainer';
import GamesContainer from './GamesContainer';

// We export all the containers at once
export {
  AddGameContainer,
  GamesContainer
};
````

###Archive.jsx

Create `Archive.jsx` in `/client/src/components` and paste the following code:

````javascript
import React, { PureComponent } from 'react';
import { Link } from 'react-router';

export default class Layout extends PureComponent {
  render () {
    return (
      <div className="view">
        <nav className="navbar navbar-inverse">
          <div className="container">
            <div className="navbar-header">
              <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar" />
                <span className="icon-bar" />
                <span className="icon-bar" />
              </button>
              <Link className="navbar-brand" to="/">
                <img src="https://cdn.filestackcontent.com/nLnmrZQaRpeythR4ezUo" className="header-logo" />
              </Link>
            </div>
          </div>
        </nav>
        {this.props.children}
        <footer className="text-center">
          <p>© 2016 Samuele Zaza</p>
        </footer>
      </div>
    );
  }
}
````
###GamesContainer.jsx

Create `GamesContainer.jsx` in `/client/src/containers` and paste the following code:

````javascript
import React, { Component } from 'react';
import { Modal, GamesListManager } from '../components';

export default class GamesContainer extends Component {
  constructor (props) {
    super(props);
    // The initial state
    this.state = { games: [], selectedGame: {}, searchBar: '' };
    // Bind the functions to this (context) 
    this.toggleModal = this.toggleModal.bind(this);
    this.deleteGame = this.deleteGame.bind(this);
    this.setSearchBar = this.setSearchBar.bind(this);
  }

  // Once the component mounted it fetches the data from the server
  componentDidMount () {
    this.getGames();
  }

  toggleModal (index) {
    this.setState({ selectedGame: this.state.games[index] });
    // Since we included bootstrap we can show our modal through its syntax
    $('#game-modal').modal();
  }

  getGames () {
    fetch('http://localhost:8080/games', {
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    })
    .then(response => response.json()) // The json response to object literal
    .then(data => this.setState({ games: data }));
  }

  deleteGame (id) {
    fetch(`http://localhost:8080/games/${id}`, {
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      method: 'DELETE',
    })
    .then(response => response.json())
    .then(response => {
      // The game is also removed from the state thanks to the filter function
      this.setState({ games: this.state.games.filter(game => game._id !== id) }); 
      console.log(response.message);
    });
  }

  setSearchBar (event) { 
    // Super still filters super mario thanks to toLowerCase
    this.setState({ searchBar: event.target.value.toLowerCase() });
  }

  render () {
    const { games, selectedGame, searchBar } = this.state;
    return (
      <div>
        <Modal game={selectedGame} />
        <GamesListManager
          games={games}
          searchBar={searchBar}
          setSearchBar={this.setSearchBar}
          toggleModal={this.toggleModal}
          deleteGame={this.deleteGame}
        />
      </div>
    );
  }
}
````

###Modal.jsx
`/client/src/components` and paste the following code:

````javascript
import React, { PureComponent } from 'react';

export default class Modal extends PureComponent {
  render () {
    const { _id, img, name, description, year, picture } = this.props.game;
    return(
      <div className="modal fade" id="game-modal" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
              <h4 className="modal-title" id="myModalLabel">{`${name} (${year})`}</h4>
            </div>
            <div className="modal-body">
              <div>
                <img src={picture} className="img-responsive img-big" />
              </div>
              <hr />
              <p>{description}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-warning" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
````
###GamesListManager.jsx
   
Create it in `/client/src/components` and paste the following code:

````javascript
import React, { PureComponent } from 'react';
import { Link } from 'react-router';
import Game from './Game';

export default class GamesListManager extends PureComponent {
  render () {
    const { games, searchBar, setSearchBar, toggleModal, deleteGame } = this.props;
    return (

      <div className="container scrollable">
        <div className="row text-left">
          <Link to="/games/add" className="btn btn-danger">Add a new Game!</Link>
        </div>
        <div className="row">
          <input
            type="search" placeholder="Search by Name" className="form-control search-bar" onKeyUp={setSearchBar} />
        </div>
        <div className="row">
        {
    // A Game is only shown if its name contains the string from the searchBar
          games
            .filter(game => game.name.toLowerCase().includes(searchBar))
            .map((game, i) => {
              return (
                <Game  {...game}
                  key={game._id}
                  i={i}
                  toggleModal={toggleModal}
                  deleteGame={deleteGame}
                />
              );
            })
        }
        </div>
        <hr />
      </div>

    );
  }
}
````
###Game.jsx

`/client/src/components` and paste the following code:

````javascript
import React, { PureComponent } from 'react';
import { Link } from 'react-router';

export default class Game extends PureComponent {
  render () {
    const { _id, i, name, description, picture, toggleModal, deleteGame } = this.props;
    return (
      <div className="col-md-4">
        <div className="thumbnail">
          <div className="thumbnail-frame">
            <img src={picture} alt="..." className="img-responsive thumbnail-pic" />
          </div>
          <div className="caption">
            <h5>{name}</h5>
            <p className="description-thumbnail">{`${description.substring(0, 150)}...`}</p>
            <div className="btn-group" role="group" aria-label="...">
              <button className="btn btn-success" role="button" onClick={() => toggleModal(i)}>View</button>
              <button className="btn btn-danger" role="button" onClick={() => deleteGame(_id)}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
````

###AddGameContainer.jsx

Create the `AddGameContainer.jsx` in `/client/src/containers` and paste the following code:

````javascript
import React, { Component } from 'react';
import { hashHistory } from 'react-router';
import { Form } from '../components';

export default class AddGameContainer extends Component {
  constructor (props) {
    super(props);
    // Initial state
    this.state = { newGame: {}};
    // Bind this (context) to the functions to be passed down to the children components
    this.submit = this.submit.bind(this);
    this.uploadPicture = this.uploadPicture.bind(this);
    this.setGame = this.setGame.bind(this);
  }
  submit () {
    // We create the newGame object to be posted to the server
    const newGame = Object.assign({}, { picture: $('#picture').attr('src') }, this.state.newGame);
    fetch('http://localhost:8080/games', {
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      method: 'POST',
      body: JSON.stringify(newGame)
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      // We go back to the games list view
      hashHistory.push('/games');
    });
  }
  uploadPicture () {
    filepicker.pick (
      {
        mimetype: 'image/*', // Cannot upload other files but images
        container: 'modal',
        services: ['COMPUTER', 'FACEBOOK', 'INSTAGRAM', 'URL', 'IMGUR', 'PICASA'],
        openTo: 'COMPUTER' // First choice to upload files from
      },
      function (Blob) {
        console.log(JSON.stringify(Blob));
        $('#picture').attr('src', Blob.url);
      },
      function (FPError) {
        console.log(FPError.toString());
      }
    );
  }
  // We make sure to keep the state up-to-date to the latest input values
  setGame () {
    const newGame = {
      name: document.getElementById('name').value,
      description: document.getElementById('description').value,
      year: document.getElementById('year').value,
      picture: $('#picture').attr('src')
    };
    this.setState({ newGame });
  }
  render () {
    return <Form submit={this.submit} uploadPicture={this.uploadPicture} setGame={this.setGame} />
  }
}
````
###Form.jsx

Create it in `/client/src/components` (used to it yet?!) and paste the following code:
````javascript
import React, { PureComponent } from 'react';
import { Link } from 'react-router';

export default class Form extends PureComponent {
  render () {
    return (
      <div className="row scrollable">
    <div className="col-md-offset-2 col-md-8">
        <div className="text-left">
        <Link to="/games" className="btn btn-info">Back</Link>
        </div>
        <div className="panel panel-default">
            <div className="panel-heading">
                <h2 className="panel-title text-center">
                Add a Game!
                </h2>
            </div>
            <div className="panel-body">
                <form name="product-form" action="" onSubmit={() => this.props.submit()} noValidate>
                <div className="form-group text-left">
                      <label htmlFor="caption">Name</label>
                      <input id="name" type="text" className="form-control" placeholder="Enter the title" onChange={() => this.props.setGame()} />
                </div>
                <div className="form-group text-left">
                      <label htmlFor="description">Description</label>
                      <textarea id="description" type="text" className="form-control" placeholder="Enter the description" rows="5" onChange={() => this.props.setGame()} ></textarea>
                </div>
                <div className="form-group text-left">
                    <label htmlFor="price">Year</label>
                    <input id="year" type="number" className="form-control" placeholder="Enter the year" onChange={() => this.props.setGame()} />
                </div>
                <div className="form-group text-left">
                    <label htmlFor="picture">Picture</label>
                       <div className="text-center dropup">
                            <button id="button-upload" type="button" className="btn btn-danger" onClick={() => this.props.uploadPicture()}>
                              Upload <span className="caret" />
                            </button>
                        </div>
                </div>
                <div className="form-group text-center">
                    <img id="picture" className="img-responsive img-upload" />
                </div>
                <button type="submit" className="btn btn-submit btn-block">Submit</button>
                </form>
            </div>
        </div>
    </div>
</div>
    );
  }
}
````
