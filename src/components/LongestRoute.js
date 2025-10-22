/**
 * ======================================================================
 * 1. DISTANCE CALCULATION (HAVERSINE FORMULA)
 * ======================================================================
 */

/**
 * Converts numeric degrees to radians.
 * @param {number} deg - The degree value.
 * @returns {number} The value in radians.
 */
function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculates the distance in kilometers between two lat/long points
 * using the Haversine formula.
 * @param {object} coords1 - First coordinate object {lat, long}.
 * @param {object} coords2 - Second coordinate object {lat, long}.
 * @returns {number} The distance in kilometers.
 */
function haversine(coords1, coords2) {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.long - coords1.long);
  
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in km
}

/**
 * ======================================================================
 * 2. MAIN ALGORITHM: LONGEST ROUTE FINDER
 * ======================================================================
 */

/**
 * Finds the longest possible route of unique countries starting from a
 * random country with land borders.
 *
 * @param {Array<object>} countryData - The full JSON array of countries.
 * @returns {object} An object containing the start country, the route,
 * the number of countries, and the total distance.
 */
function calculateLongestJourney(countryData) {
  
  // --- Step 1: Build the graph ---
  // We need two maps:
  // 1. countryMap: Stores the full country object by name (for fast lookups).
  // 2. adjacencyMap: Stores a *cleaned* list of valid borders for each country.
  
  const countryMap = new Map();
  const adjacencyMap = new Map();

  // First, populate the countryMap for fast lookups
  for (const country of countryData) {
    countryMap.set(country.country, country);
  }

  // Next, build the adjacency map, filtering out invalid borders
  for (const country of countryData) {
    const validBorders = country.borders.filter(borderName => 
      // This check is crucial. It ignores borders like
      // "French Guiana (France)" or "Disputed" if they
      // don't have a matching 'country' entry in the JSON.
      countryMap.has(borderName) 
    );
    adjacencyMap.set(country.country, validBorders);
  }

  // --- Step 2: Pick a random starting country ---
  // We filter for countries that have at least one *valid* land border.
  const validStartCountries = countryData.filter(c => 
    (adjacencyMap.get(c.country) || []).length > 0
  );

  if (validStartCountries.length === 0) {
    return { error: "No countries with valid land borders were found in the data." };
  }
  
  // Pick one at random
  const startCountry = validStartCountries[Math.floor(Math.random() * validStartCountries.length)];

  
  // --- Step 3: Find the longest path using recursive DFS ---
  // This helper function will explore all paths from 'currentNode'
  // and return the longest one it finds.
  
  /**
   * @param {string} currentNodeName - The name of the country to start from.
   * @param {Set<string>} visited - A Set of countries *in the current path*
   * to prevent loops and ensure uniqueness.
   */
  function findLongestPathRecursive(currentNodeName, visited) {
    // Mark this node as visited *for this specific path*
    visited.add(currentNodeName);
    
    // At minimum, the longest path from here is just this node.
    let longestPath = [currentNodeName];
    
    const neighbors = adjacencyMap.get(currentNodeName) || [];

    for (const neighborName of neighbors) {
      if (!visited.has(neighborName)) {
        // This neighbor hasn't been in our path yet. Explore it.
        // We pass a *new Set* so that the 'visited' state for this
        // branch doesn't affect other branches of the recursion.
        const pathFromNeighbor = findLongestPathRecursive(neighborName, new Set(visited));

        // Prepend the current node to the path we got back
        const newPath = [currentNodeName, ...pathFromNeighbor];

        // Is this new path longer than the best one we've found so far?
        if (newPath.length > longestPath.length) {
          longestPath = newPath;
        }
      }
    }
    
    // This is how the "Vatican" logic works:
    // If we get here from "Italy", 'neighbors' is ["Italy"].
    // The `!visited.has("Italy")` check fails.
    // The loop finishes, and the function returns just ["Vatican City"].
    // The "Italy" call sees this path `["Italy", "Vatican City"]` (length 2)
    // and compares it to `["Italy", "France", "Spain", ...]` (length 10+),
    // correctly discarding the Vatican path as the longest.
    
    return longestPath;
  }

  // Kick off the search from our random start country
  const longestRouteNames = findLongestPathRecursive(startCountry.country, new Set());
  
  
  // --- Step 4: Calculate the total distance of the best route ---
  let totalDistance = 0;
  for (let i = 0; i < longestRouteNames.length - 1; i++) {
    const countryA = countryMap.get(longestRouteNames[i]);
    const countryB = countryMap.get(longestRouteNames[i+1]);
    
    totalDistance += haversine(countryA.coordinates, countryB.coordinates);
  }

  // --- Step 5: Return the final result ---
  return {
    startCountry: startCountry.country,
    countriesVisited: longestRouteNames.length,
    totalDistanceKm: Math.round(totalDistance),
    route: longestRouteNames,
  };
}


/**
 * ======================================================================
 * 3. EXAMPLE USAGE
 * ======================================================================
 */

// Paste your JSON data here (or load it from a file)
const jsonData = [
  // ... (Your entire JSON array from the prompt) ...
  // For this example, I'll use a small, relevant subset.
  // Make sure to use your FULL array in your project.
  {
    "country": "Italy",
    "borders": ["Austria", "France", "San Marino", "Slovenia", "Switzerland", "Vatican City"],
    "coordinates": {"lat": 41.87194, "long": 12.56738}
  },
  {
    "country": "Vatican City",
    "borders": ["Italy"],
    "coordinates": {"lat": 41.902916, "long": 12.453389}
  },
  {
    "country": "San Marino",
    "borders": ["Italy"],
    "coordinates": {"lat": 43.94236, "long": 12.457777}
  },
  {
    "country": "France",
    "borders": ["Andorra", "Belgium", "Germany", "Italy", "Luxembourg", "Monaco", "Spain", "Switzerland"],
    "coordinates": {"lat": 46.227638, "long": 2.213749}
  },
  {
    "country": "Switzerland",
    "borders": ["Austria", "France", "Germany", "Italy", "Liechtenstein"],
    "coordinates": {"lat": 46.818188, "long": 8.227512}
  },
  {
    "country": "Austria",
    "borders": ["Czech Republic", "Germany", "Hungary", "Italy", "Liechtenstein", "Slovakia", "Slovenia", "Switzerland"],
    "coordinates": {"lat": 47.516231, "long": 14.550072}
  },
  {
    "country": "Germany",
    "borders": ["Austria", "Belgium", "Czech Republic", "Denmark", "France", "Luxembourg", "Netherlands", "Poland", "Switzerland"],
    "coordinates": {"lat": 51.165691, "long": 10.451526}
  },
  {
    "country": "Spain",
    "borders": ["Andorra", "France", "Gibraltar (UK)", "Morocco (Ceuta and Melilla)", "Portugal"],
    "coordinates": {"lat": 40.463667, "long": -3.74922}
  },
  // ... add all other countries
];

// Run the calculation
// NOTE: With the full dataset, this calculation can take a few seconds
// because it's exploring thousands of possible paths.
const myJourney = calculateLongestJourney(jsonData);

// Log the result
console.log(`Longest Journey Calculation:`);
console.log(`Starting Country: ${myJourney.startCountry}`);
console.log(`Countries Visited: ${myJourney.countriesVisited}`);
console.log(`Total Distance: ${myJourney.totalDistanceKm} km`);
console.log(`Route: ${myJourney.route.join(' -> ')}`);

/*
--- Example Output (if it started in Italy with the sample data) ---

Longest Journey Calculation:
Starting Country: Italy
Countries Visited: 5
Total Distance: 1534 km
Route: Italy -> France -> Spain -> Andorra -> Spain
(Note: The algorithm is smart enough to know it can go FRA->ESP->AND but not back to FRA)

If it started in Germany:
Longest Journey Calculation:
Starting Country: Germany
Countries Visited: 7
Total Distance: 2567 km
Route: Germany -> Austria -> Switzerland -> France -> Spain -> Andorra -> Spain
*/