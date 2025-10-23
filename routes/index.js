
//Receive redist client as an argument (defined once in app.js)
module.exports = (app, client) => {

  //console.log('Inside index');

  const pokemonRoutes = require('./pokemonRoutes')(client);
  const moveRoutes = require('./moveRoutes')(client);
  const itemRoutes = require('./itemRoutes')(client);

  //console.log('past consts in index');
  
  //const constructorMethod = (app) => {

    //console.log('Setting up /api/pokemon route');
    app.use('/api/pokemon', pokemonRoutes);

    //console.log('Setting up /api/move route');
    app.use('/api/move', moveRoutes);

    //console.log('Setting up /api/item route');
    app.use('/api/item', itemRoutes);

    app.use('*', (req, res) => {
      res.json({error: 'Route not valid'});
    });
  //};

  //module.exports = constructorMethod;

};