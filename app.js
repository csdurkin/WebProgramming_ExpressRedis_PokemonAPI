/**
 * APP.JS
 * 
 *      What this file does: 
 *        Purpose 1. Initializes Express app
 *        Purpose 2. Serves static files from the 'public' directory
 *        Purpose 3. Sets up Redis client connection for caching
 *        Purpose 4. Configures Handlebars as the templating engine
 *        Purpose 5. Sets up middleware for request handling (body parsing, static files)
 *        Purpose 12. Configures routes and starts the server on port 3000
 * 
 *      Removed: 
 *        Purpose 6. Middleware for caching logic for '/pokemon'
 *        Purpose 7. Middleware for caching logic for '/pokemon/:id'
 *        Purpose 8. Middleware for caching logic for '/move'
 *        Purpose 9. Middleware for caching logic for '/move/:id'
 *        Purpose 10. Middleware for caching logic for '/item'
 *        Purpose 11. Middleware for caching logic for '/item/:id'
 */

// Purpose 1: Initializes Express app

    // Notes: import express library; initialize express application
    const express = require('express');
    const app = express();


// Purpose 2: Serves static files from the 'public' directory

    // Notes: Serve static files that are located in the /public directory
    const static = express.static(__dirname + '/public');

// Purpose 3: Sets up Redis client connection for caching

    // Notes: Import Redis, initialize a Redis client, and connect to it
    const redis = require('redis');
    const client = redis.createClient({
      //url: 'redis://localhost:6379'       //Necessary? Not shown in example
    });
    client.connect().then(() => {
      console.log('Connected to Redis');
    });

    /*
    REDUNDANT. DONE BY CONFIFROUTES
    // Pass the Redis client to the routes configuration
    const pokemonRoutes = require('./routes/pokemonRoutes')(client);
    const itemRoutes = require('./routes/itemRoutes')(client);
    const moveRoutes = require('./routes/moveRoutes')(client);
    const index = require('./routes/index')(client);
    const middleware = require('./routes/middleware')(client);
    */ 
// Purpose 4: Configures Handlebars as the templating engine

    // Notes: Import express-handlebars and configure the Handlebars engine with 'main' as the default layout
    const exphbs = require('express-handlebars');
    const handlebarsInstance = exphbs.create({
      defaultLayout: 'main',
      //Helper: JSON to appear nicely
      //Helers notes: allow you to execute Javascript within handlebars
      helpers: {
        //Stringify json
        json: function(context) {                       //json: defines the function name to be called within handlebars; argument: context
          return JSON.stringify(context, null, 2);      //Convert javascript object into JSON string; null: no replacer function (filter or modifier); 2 (spaces of indentation)
        },
        // Extract an ID from any URL (for Pokémon, moves, or items)
        extractIdFromUrl: function(url) {
        const matches = url.match(/\/(\d+)\/$/);      // Matches the ID from a URL ending with /{id}/
        return matches ? matches[1] : null;           // Returns the ID if found, otherwise null
    }
      }
    });

    // Notes: Tell express to use handlebars as the templating engine
    //handlebarsInstance.engine: defined above
    app.engine('handlebars', handlebarsInstance.engine);
    app.set('view engine', 'handlebars');

    //console.log('Completed purpose 4 of app.js');

// Purpose 5: Sets up middleware for request handling

    // Middleware: Serve static files from the /public directory on any requests to /public
    app.use('/public', static);

    // Middleware: Body parsers to handle incoming JSON and URL-encoded data
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    //console.log('Completed purpose 5 of app.js');

// Purpose 12: Configure routes and start the server

    // Notes: Import the route configuration file and set up the routes
    const configRoutes = require('./routes');
    console.log('Configuring routes...');
    configRoutes(app, client);

    // Notes: Start the server, listen on port 3000
    app.listen(3000, async () => {
      console.log("We've now got a server!");
      console.log('Your routes will be running on http://localhost:3000');
    });

    //console.log('Completed purpose 12 of app.js');

/*

REMOVED MIDDLEWARES. PLACED AS ROUTE MIDDLEWARES IN ROUTES/MIDDLEWARE.JS
//Purpose 6: Middleware for /pokemon

    app.use('/pokemon', async (req, res, next) => {
      
      if (req.originalUrl === '/pokemon') {
        
        let exists = await client.exists('pokemonHomepage');
        
        if (exists) {
          
        // If the pokemon list is in cache, send the cached HTML from Redis
          
          console.log('Pulling pokemon list from cache');
          let pokemonHomepage = await client.get('pokemonHomepage');

          //Check if 'section' in HTML (Only will be included from the added handlebar)
          if (pokemonHomepage.includes('<section>') && pokemonHomepage.includes('</section>')) {
            console.log('Sending valid pokemonHomepage HTML from Redis....');
            res.send(pokemonHomepage);

          } else {
            console.log('Cached HTML is incomplete. Fetching data...');
            next(); 
          }

      // If not in cache, move to the next handler  

        } else {
          next();
        }
      } else {
        next();
      }
    });

//Purpose 7: Middleware for /pokemon/:id

    // Middleware: Caching logic for individual show details (/pokemon/:id)
    app.use('/pokemon/:id', async (req, res, next) => {
      
      if (req.originalUrl !== '/pokemon/history') {
        
        let exists = await client.exists(req.params.id);

        // If the pokemon detail page is in cache, send the cached HTML
        
        if (exists) {

          console.log('Pokemon in Cache');
          let pokemonPage = await client.get(req.params.id);

          console.log('Sending pokemonPage HTML from Redis....');
          res.send(pokemonPage);

    // If not in cache, move to the next handler
       
        } else {
          next();
        }
      } else {
        next();
      }
    });

//Purpose 8: Middleware for /move

app.use('/move', async (req, res, next) => {
      
  if (req.originalUrl === '/move') {
    
    let exists = await client.exists('moveHomepage');
    
    if (exists) {
      
    // If the pokemon list is in cache, send the cached HTML from Redis
      
      console.log('Pulling move list from cache');
      let moveHomepage = await client.get('moveHomepage');

      console.log('Sending moveHomepage HTML from Redis....');
      res.send(moveHomepage);

      return;

  // If not in cache, move to the next handler  

    } else {
      next();
    }
  } else {
    next();
  }
});

//Purpose 9: Middleware for /move/:id

// Middleware: Caching logic for individual show details (/move/:id)
app.use('/move/:id', async (req, res, next) => {
    
    let exists = await client.exists(req.params.id);

    // If the move detail page is in cache, send the cached HTML
    
    if (exists) {
      
      console.log('Move in Cache');
      let movePage = await client.get(req.params.id);

      console.log('Sending pokemonPage HTML from Redis....');
      res.send(movePage);

// If not in cache, move to the next handler
   
  } else {
    next();
  }
});

//Purpose 10: Middleware for /item

app.use('/item', async (req, res, next) => {
      
  if (req.originalUrl === '/item') {
    
    let exists = await client.exists('itemHomepage');
    
    if (exists) {
      
    // If the pokemon list is in cache, send the cached HTML from Redis
      
      console.log('Pulling item list from cache');
      let itemHomepage = await client.get('itemHomepage');

      console.log('Sending itemHomepage HTML from Redis....');
      res.send(itemHomepage);

      return;

  // If not in cache, move to the next handler  

    } else {
      next();
    }
  } else {
    next();
  }
});

//Purpose 11: Middleware for /item/:id

// Middleware: Caching logic for individual item details (/item/:id)
app.use('/item/:id', async (req, res, next) => {
    
    let exists = await client.exists(req.params.id);

    // If the item detail page is in cache, send the cached HTML
    
    if (exists) {
      
      console.log('Item in Cache');
      let itemPage = await client.get(req.params.id);

      console.log('Sending itemPage HTML from Redis....');
      res.send(itemPage);

// If not in cache, move to the next handler
   
  } else {
    next();
  }
});
*/