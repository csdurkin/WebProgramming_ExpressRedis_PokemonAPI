/**
 * itemRoutes.JS
 * 
 *      What this file does: 
 *      Purpose 1. Initialize the Express router
 *      Purpose 2. Set up Redis client connection for caching
 *      Purpose 3. Fetch Pokémon item data from the Pokémon API
 *      Purpose 4. Define route to fetch and cache the item list (Homepage - '/item')
 *      Purpose 5. Define route to fetch and cache individual item details (Route - '/item/:id')
 */

// Purpose 1: Initialize the Express router

    //Import express library
    const express = require('express');

    //Initialize the router for handling /shows related routes (why /shows? defined in routes/index.js)
    const router = express.Router();
/*
// Purpose 2: Set up Redis client connection for caching

    //Import Redis
    const redis = require('redis');
    
    //Initialize a Redis client
    const client = redis.createClient();
    
    //Connect to Redis client
    client.connect().then(() => {
      console.log('Connected to Redis');
    });*/

// Purpose 3: Import axios for making API requests to TVmaze

    const axios = require('axios');

//Receive redist client as an argument (defined once in app.js)
module.exports = (client) => {

//Import Middleware
const { cacheItemHomepage, cacheItem} = require('./middleware.js')(client);

// Purpose 4: Define route to fetch and cache the item list (Homepage - '/item')

    // GET: '/'
    router.get('/', cacheItemHomepage, async (req, res) => {
      
      //Log not cached. How do we know? Middleware would catch if it was.
      console.log('List of items not cached');

      //Set variable to store items, error flag and error status
      let items = [];
      let hasError = false;
      let errorStatus = null;
      
      //Fetch list of items from pokeAPI
      try{
      
        let {data} = await axios.get('https://pokeapi.co/api/v2/item/');
        items = data.results;

        //console.log (items);

      } catch (error) {

        console.error('Error fetching items data:', error);
        hasError = true;
      
      // Check errortype:(404, not found) or (500, internal server error)

        if (error.response && error.response.status === 404) {
          return res.status(404).render('results/items', { items: [], hasError: true, errorStatus: '404: Not Found Error' });
        } 
        
        else {
          return res.status(500).render('results/items', { items: [], hasError: true, errorStatus: '500: Internal Server Error' });
        }

      }

      //Render results/items (handlebars), pass in data as the pokemon, call async (err, html) to start caching
      res.render('results/items', { items, hasError, errorStatus}, async (err, html) => {
        
        //Handle possible errors when rendering
        if (err) {
          console.error('Error rendering the page:', err);
          return res.status(500).render('results/items', { items: [], hasError: true, errorStatus: '500: Internal Server Error' });
        }

        // Cache the homepage HTML
        await client.set('itemHomepage', html); 
        
        //Log successful cache
        console.log('HTML for item homepage stored in cache');

        //Send rendered html to client
        console.log('Sending itemHomepage that was not originally in cache.')
        res.status(200).send(html); 

      });

    }
    
  );

// Purpose 5: Defines the route to fetch and cache individual item details (Route - '/item/:id')
// Notes: Fetches item details by ID from pokeapi, caches the rendered HTML in Redis, and sends it to the client
    
    //GET: /:id
    router.get('/:id', cacheItem, async (req, res) => {
        
      //Log: Not in cache (Known becuase middleware didn't catch and return)
      console.log('Item not in cache');

      // Check if the ID is a valid positive integer
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).render('results/error', { status: 400, message: 'Invalid ID. ID must be a positive integer.' });
      }

      //Set variable to store item, error flag and error status
      let item;
      let hasError = false;
      let errorStatus = null;
        
      //Fetch data about the specific item (based on ID) from pokeAPI
      try{

        let {data} = await axios.get(`https://pokeapi.co/api/v2/item/${req.params.id}`);
        item = data;

      } catch(error){
        
        console.error('Error fetching item data:', error);
        hasError = true;
    
        // Check errortype:(400, not found) or (500, internal server error)

        if (error.response && error.response.status === 404) {
          return res.status(404).render('results/item', { item: {}, hasError: true, errorStatus: '404: Not Found Error' });
        } 
        
        else {
          return res.status(500).render('results/item', { item: {}, hasError: true, errorStatus: '500: Internal Server Error' });
        }

    }

      //Render results/item (handlebars), pass in data as the show, call async (err, html) to start caching
        res.render('results/item', {item, hasError, errorStatus}, async (err, html) => {
          
        //Handle possible errors when rendering
        if (err) {
          console.error('Error rendering the page:', err);
          return res.status(500).render('results/item', { item: {}, hasError: true, errorStatus: '500: Internal Server Error' });
        }

        // Cache the HTML by item ID
        await client.set(`itemPage:${req.params.id}`, html);
        
        //Log successful cache
        console.log('HTML for item homepage stored in cache');

        //Send rendered html to client
        console.log('Sending itemPage that was not originally in cache.')
        res.status(200).send(html);   

        });
        
      });


// Return the router object to be used in app.js
return router;

};