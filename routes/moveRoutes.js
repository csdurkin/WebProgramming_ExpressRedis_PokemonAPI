/**
 * moveRoutes.JS
 * 
 *      What this file does: 
 *      Purpose 1. Initialize the Express router
 *      Purpose 2. Set up Redis client connection for caching
 *      Purpose 3. Fetch Pokémon move data from the Pokémon API
 *      Purpose 4. Define route to fetch and cache the move list (Homepage - '/move')
 *      Purpose 5. Define route to fetch and cache individual move details (Route - '/move/:id')
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
    });
*/
// Purpose 3: Import axios for making API requests to TVmaze

    const axios = require('axios');

//Receive redis client as an argument (defined once in app.js)
module.exports = (client) => {

//Import Middleware
const { cacheMoveHomepage, cacheMove} = require('./middleware.js') (client);

// Purpose 4: Define route to fetch and cache the move list (Homepage - '/move')

    // GET: '/'
    router.get('/', cacheMoveHomepage, async (req, res) => {
      
      //Log not cached. How do we know? Middleware would catch if it was.
      console.log('List of moves not cached');
      
      //Set variable to store moves, error flag and error status
      let moves = [];
      let hasError = false;
      let errorStatus = null;

      //Fetch list of moves from pokeApi; store in moves array
      try{
        let {data} = await axios.get('https://pokeapi.co/api/v2/move/');
        moves = data.results;

      //Catch Error   
      } catch (error) {
        
        console.error('Error fetching moves data:', error);
        hasError = true;

      // Check errortype:(404, not found) or (500, internal server error)
      if (error.response && error.response.status === 404) {
        return res.status(404).render('results/moves', { moves: [], hasError: true, errorStatus: '404: Not Found Error' });
      } else {
        return res.status(500).render('results/moves', { moves: [], hasError: true, errorStatus: '500: Internal Server Error' });
      }
    }

    // Render the results/moves Handlebars template with the moves and error status
    res.render('results/moves', { moves, hasError, errorStatus }, async (err, html) => {
      
      //Handle possible errors when rendering
      if (err) {
        console.error('Error rendering the page:', err);
        return res.status(500).render('results/moves', { moves: [], hasError: true, errorStatus: '500: Internal Server Error' });
      }

      // If no errors, cache the rendered HTML
      await client.set('moveHomepage', html);
  
      // Log successful cache
      console.log('HTML for move homepage stored in cache');
  
      // Send the rendered HTML to the client
      console.log('Sending MoveHomepage that was not originally in cache.')
      res.status(200).send(html); 

    });

});
 

// Purpose 5: Defines the route to fetch and cache individual move details (Route - '/move/:id')
// Notes: Fetches move details by ID from pokeapi, caches the rendered HTML in Redis, and sends it to the client
    
    //GET: /:id
    router.get('/:id', cacheMove, async (req, res) => {
        
      //Log: Not in cache (Known becuase middleware didn't catch and return)
      console.log('Move not in cache');

      // Check if the ID is a valid positive integer
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).render('results/error', { status: 400, message: 'Invalid ID. ID must be a positive integer.' });
      }

      //Set variable to store move, error flag and error status
      let move;
      let hasError = false;
      let errorStatus = null;
        
      //Fetch data about the specific show (based on ID) from pokeAPI
      try{
        let {data} = await axios.get(`https://pokeapi.co/api/v2/move/${req.params.id}`);
        move = data;

      } catch (error) {

        console.error('Error fetching move data:', error);
        hasError = true;
      
      // Check errortype:(404, not found) or (500, internal server error)

        if (error.response && error.response.status === 404) {
          return res.status(404).render('results/move', { move: {}, hasError: true, errorStatus: '404: Not Found Error' });
        } 
        
        else {
          return res.status(500).render('results/move', { move: {}, hasError: true, errorStatus: '500: Internal Server Error' });
        }

      }

      //Render results/move (handlebars), pass in data as the pokemon, call async (err, html) to start caching
      res.render('results/move', { move, hasError, errorStatus}, async (err, html) => {
        
        //Handle possible errors when rendering
        if (err) {
          console.error('Error rendering the page:', err);
          return res.status(500).render('results/move', { move: {}, hasError: true, errorStatus: '500: Internal Server Error' });
        }

        // Cache the HTML by move ID
        await client.set(`movePage:${req.params.id}`, html);
        
        //Log successful cache
        console.log('HTML for move stored in cache');

        //Send rendered html to client
        console.log('Sending movePage that was not originally in cache.')
        res.status(200).send(html);   
      });

    });


// Return the router object to be used in app.js
return router;

};