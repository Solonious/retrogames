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
