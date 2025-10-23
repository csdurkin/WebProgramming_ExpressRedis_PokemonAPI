/**
 * pokemonRoutes.JS
 * 
 *      What this file does: 
 *      Purpose 1. Initialize the Express router
 *      Purpose 2. Set up Redis client connection for caching
 *      Purpose 3. Fetch Pokémon data from the Pokémon API
 *      Purpose 4. Define route to fetch and cache the Pokémon list (Homepage - '/pokemon')
 *      Purpose 5. Define route to fetch and display the top 25 most recently accessed Pokémon (Route - '/history')
 *      Purpose 6. Define route to fetch and cache individual Pokémon details (Route - '/pokemon/:id')
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

// Purpose 3: Import axios for making API requests to pokeapi

    const axios = require('axios');

//Receive redist client as an argument (defined once in app.js)
module.exports = (client) => {

//Import middleware
const { cachePokemonHomepage, cachePokemon} = require('./middleware.js')(client);

console.log('In pokemonroutes');

// Purpose 4: Define route to fetch and cache the pokemon list (Homepage - '/pokemon')

    // GET: '/'
    router.get('/', cachePokemonHomepage, async (req, res) => {
      console.log('Inside GET /api/pokemon');
      
      //Log not cached. How do we know? Middleware would catch if it was.
      console.log('List of Pokemon not cached');

      //Set variable to store pokemons, error flag and error status
      let pokemons = [];
      let hasError = false;
      let errorStatus = null;
      
      //Fetch list of Pokemon from pokeAPI
      try{
        let {data} = await axios.get('https://pokeapi.co/api/v2/pokemon/');
        pokemons = data.results;

        //console.log (pokemons);

      } 

      catch (error){
        
        console.error('Error fetching Pokemon list data:', error);
        hasError = true;

      // Check errortype:(404, not found) or (500, internal server error)
        if (error.response && error.response.status === 404) {
          return res.status(404).render('results/pokemons', { pokemons: [], hasError: true, errorStatus: '404: Not Found Error' });
        } else {
          return res.status(500).render('results/pokemons', { pokemons: [], hasError: true, errorStatus: '500: Internal Server Error' });
        }
      }

        /*
        //pokemonHistory: confirm it exists, otherwise initialize
        const exists = await client.exists('pokemonHistory');
        if (!exists) {
          await client.json.set('pokemonHistory', '.', []); 
          console.log('Initialized pokemonHistory as an empty array');
        }
        
        //Loop through list and add pokemon data to the most recently accessed pokemon
        for (let pokemon of pokemons) {
          await client.json.arrAppend('pokemonHistory', '.', pokemon);
        }*/
      
        //Render results/pokemonList (handlebars), pass in data as the pokemon, call async (err, html) to start caching
        res.render('results/pokemons', { pokemons, hasError, errorStatus }, async (err, html) => {

          //Handle possible errors when rendering
          if (err) {
            console.error('Error rendering the page:', err);
            return res.status(500).render('results/pokemons', { pokemons: [], hasError: true, errorStatus: '500: Internal Server Error' });
          }

          // Cache the homepage HTML
          await client.set('pokemonHomepage', html); 
          
          //Log successful cache
          console.log('HTML for pokemon homepage stored in cache');

          //Send rendered html to client
          console.log('Sending pokemonHomepage that was not originally in cache.')
          res.status(200).send(html); 

        });

      }
    );

// Purpose 5: Define route to fetch and display the last 25 accessed
    
    // GET: '/history'
    router.get('/history', async (req, res) => {

      //Set variables for error flag and error status
      let hasError = false;
      let errorStatus = null;

      try{

        //Redis: Get last 25 pokemon accessed       
        const recentPokemon = await client.json.get('pokemonHistory', { path: '.', start: -25, stop: -1 });

        let recentPokemonReversed = [];

        // Reverse to show the most recently accessed first
        if (recentPokemon) {recentPokemonReversed = recentPokemon.reverse();}

        // Trim the reversed list down to the last 25 entries
        if (recentPokemonReversed.length > 25) {
          recentPokemonReversed = recentPokemonReversed.slice(0, 25);
        }
        
        //console.log('reversed pokemon below');
        //console.log(recentPokemonReversed);
        
        //Log: scores
        //console.log(recentPokemonReversed);

        //Render the top search results
        res.render('results/history', { pokemonList: recentPokemonReversed, hasError}); 
   
     } catch (error) {
      
        //log  
        console.error('Error fetching Pokémon history:', error);
      
        console.error('Error fetching pokemon data:', error);
        hasError = true;

        // Check errortype:(404, not found) or (500, internal server error)

        if (error.response && error.response.status === 404) {
          res.status(404); 
          errorStatus = 404;
        } 

        else {
          res.status(500); 
          errorStatus = 500;
        }
  
        // Render the page with error information and the status code
        console.log('Rendering history page (never stored in cache).')
        res.render('results/history', { pokemonList: [], hasError, errorStatus});

    }

    });

// Purpose 6: Defines the route to fetch and cache individual pokemon details (Route - '/pokemon/:id')
// Notes: Fetches pokemon details by ID from pokeapi, caches the rendered HTML in Redis, and sends it to the client
    
    //GET: /:id
    router.get('/:id', cachePokemon, async (req, res) => {
        
      //Log: Not in cache (Known becuase middleware didn't catch and return)
      console.log('Pokemon not in cache');

      // Check if the ID is a valid positive integer
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).render('results/error', { status: 400, message: 'Invalid ID. ID must be a positive integer.' });
      }
      
      //Set variable to store move, error flag and error status
      let pokemon;
      let hasError = false;
      let errorStatus = null;

      //Fetch data about the specific show (based on ID) from pokeAPI
      try{
        let {data} = await axios.get(`https://pokeapi.co/api/v2/pokemon/${req.params.id}`);
        pokemon = data;

      } catch (error) {

        console.error('Error fetching pokemon data:', error);
        hasError = true;

        // Check errortype:(404, not found) or (500, internal server error)

        if (error.response && error.response.status === 404) {
          return res.status(404).render('results/pokemon', { pokemon: {}, hasError: true, errorStatus: '404: Not Found Error' });
        } 
        else {
          return res.status(500).render('results/pokemon', { pokemon: {}, hasError: true, errorStatus: '500: Internal Server Error' });
        }

      }
      //console.log('Pokemon JSON data:', pokemon);
      //Add jason to cache and add to history if no error
      if (!hasError && pokemon) {
        
        // Cache the JSON data
        //console.log('Storing Pokemon JSON data:', pokemon);
        await client.json.set(`pokemonData:${req.params.id}`, '.', pokemon);
        console.log(`Pokemon data for ${pokemon.name} cached as JSON.`);

        //pokemonHistory: confirm it exists, otherwise initialize
        const historyExists = await client.exists('pokemonHistory');
        if (!historyExists) {
          await client.json.set('pokemonHistory', '.', []); 
          console.log('Initialized pokemonHistory as an empty array');
        }

        //Add the pokemon's data into the  accessed pokemon list
        await client.json.arrAppend('pokemonHistory', '.', pokemon);
        console.log(`Appended ${pokemon.name} to history`);
        
        // Limit history to the last 25 entries
        const currentHistory = await client.json.get('pokemonHistory', { path: '.' });
        if (currentHistory.length > 25) {
          const trimmedHistory = currentHistory.slice(-25);
          await client.json.set('pokemonHistory', '.', trimmedHistory);
        }

      }

        
      //Render shows/show (handlebars), pass in data as the show, call async (err, html) to start caching
        res.render('results/pokemon', {pokemon, hasError, errorStatus}, async (err, html) => {
          
          //Handle possible errors when rendering
          if (err) {
            console.error('Error rendering the page:', err);
            return res.status(500).render('results/pokemon', { pokemon: {}, hasError: true, errorStatus: '500: Internal Server Error' });
          }

          // Cache the HTML by show ID
          await client.set(`pokemonPage:${req.params.id}`, html);
          console.log('HTML for pokemon stored in cache');
          
          // Send the rendered HTML to the client
          console.log('Sending pokemonPage that was not originally in cache.')
          res.status(200).send(html);   

        });
      });

      // Return the router object to be used in app.js
      return router;

};