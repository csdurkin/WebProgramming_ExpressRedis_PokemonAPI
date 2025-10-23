//Receive redist client as an argument (defined once in app.js)
module.exports = (client) => {

/*
//Set up Redis client connection for caching

    //Import Redis
    const redis = require('redis');
    
    //Initialize a Redis client
    const client = redis.createClient();
    
    //Connect to Redis client
    client.connect().then(() => {
      console.log('Connected to Redis');
    });
    */


// Middleware for caching Pokemon homepage

     async function cachePokemonHomepage(req, res, next) {
       
        if (req.originalUrl === '/api/pokemon') {
            
            let exists = await client.exists('pokemonHomepage');
            
            if (exists) {
            
            // If the pokemon list is in cache, send the cached HTML from Redis
            
            let pokemonHomepage = await client.get('pokemonHomepage');
    
            console.log('Sending pokemonHomepage HTML from Redis.');
            return res.status(200).send(pokemonHomepage);

        // If not in cache, move to the next handler  

            } else {
            next();
            }

        } else {
            next();
        }

    }

// Middleware for caching Pokemon by ID

    async function cachePokemon(req, res, next) {
    
    //Check if HTML and JSON data are stored in the cache for this Pokemon
    let htmlExists = await client.exists(`pokemonPage:${req.params.id}`);
    let jsonExists = await client.exists(`pokemonData:${req.params.id}`);
        
    //If pokemon details are in cache, retrieve both 
    console.log('htmlExists', htmlExists);
    console.log('jsonExists', jsonExists);

    if (htmlExists && jsonExists) {
        console.log('Pokemon in Cache');
        
        // Retrieve HTML and JSON separately
        let pokemonPage = await client.get(`pokemonPage:${req.params.id}`);
        let pokemonData = await client.json.get(`pokemonData:${req.params.id}`);

       // Add to history (ensures its also added even if from cache)
         
        //Confirm history exists; create if not 
        const historyExists = await client.exists('pokemonHistory');
        if (!historyExists) {
            await client.json.set('pokemonHistory', '.', []);
            console.log('Initialized pokemonHistory as an empty array');
        }

        await client.json.arrAppend('pokemonHistory', '.', pokemonData);
        console.log(`Appended ${pokemonData.name} to history from cache`);

        //Send HTML from Cache
        console.log('Sending pokemonPage HTML from Redis.');
        return res.status(200).send(pokemonPage);
                    
        } else {
        next();
        }

    }

// Middleware for caching Item homepage

     async function cacheItemHomepage(req, res, next) {
        
        if (req.originalUrl === '/api/item') {
        
        let exists = await client.exists('itemHomepage');
        
        if (exists) {
            
        // If the pokemon list is in cache, send the cached HTML from Redis
            
            let itemHomepage = await client.get('itemHomepage');
            console.log('Sending itemHomepage HTML from Redis.');
            return res.status(200).send(itemHomepage);
    
        // If not in cache, move to the next handler  
    
        } else {
            next();
        }
        } else {
        next();
        }
    };

// Middleware for caching Item by ID

     async function cacheItem(req, res, next) {
       
        let exists = await client.exists(`itemPage:${req.params.id}`);

        // If the item detail page is in cache, send the cached HTML
        
        if (exists) {
            let itemPage = await client.get(`itemPage:${req.params.id}`);
            console.log('Sending itemPage HTML from Redis.');
            return res.status(200).send(itemPage);

    // If not in cache, move to the next handler
    
    } else {
        next();
    }
    };

// Middleware for caching Move homepage

     async function cacheMoveHomepage(req, res, next) {
        
        if (req.originalUrl === '/api/move') {
        
        let exists = await client.exists('moveHomepage');
        
        if (exists) {
            
        // If the pokemon list is in cache, send the cached HTML from Redis
            
            console.log('Pulling move list from cache');
            let moveHomepage = await client.get('moveHomepage');
    
            console.log('Sending moveHomepage HTML from Redis.');
            return res.status(200).send(moveHomepage);
    
        // If not in cache, move to the next handler  
    
        } else {
            next();
        }

        } else {
        next();
        }

    };

  
// Middleware for caching Move by ID

     async function cacheMove(req, res, next) {
        
        let exists = await client.exists(`movePage:${req.params.id}`);

        // If the move detail page is in cache, send the cached HTML
        

        if (exists) {
            let movePage = await client.get(`movePage:${req.params.id}`);
            console.log('Sending movePage HTML from Redis.');
            return res.status(200).send(movePage);

    // If not in cache, move to the next handler
    
    } else {
        next();
    }
    };

return {
    cachePokemonHomepage,
    cachePokemon,
    cacheItemHomepage,
    cacheItem,
    cacheMoveHomepage,
    cacheMove
};

};