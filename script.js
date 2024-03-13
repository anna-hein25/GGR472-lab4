/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYW5uYS1oZWluMSIsImEiOiJjbHMyOWllNW8wa2J3MmpsZHM1eHk0b3oxIn0.9g1JErkZTD4sg70-swx-YQ'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/anna-hein1/cltq8azbv024r01qp54by1bkc',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 12 // starting zoom level
});

/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable

let collisiongeojson;

fetch('https://raw.githubusercontent.com/anna-hein25/GGR472-lab4/ed29c9a264739fa82c90f146cd79e08eac577133/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response);
        collisiongeojson = response;
    });

/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function

map.on('load', () => {

    let bboxgeojson;
    let bbox = turf.envelope(collisiongeojson);
    let bboxscaled = turf.transformScale(bbox, 1.10);

    bboxgeojson = {
        'type': 'FeatureCollection',
        'features': [bbox]
    };

    let bboxcoords = [bboxscaled.geometry.coordinates[0][0][0],
    bboxscaled.geometry.coordinates[0][0][1],
    bboxscaled.geometry.coordinates[0][2][0],
    bboxscaled.geometry.coordinates[0][2][1],];
    let hexgeojson = turf.hexGrid(bboxcoords, 0.5, { units: 'kilometers' });

    /*--------------------------------------------------------------------
    Step 4: AGGREGATE COLLISIONS BY HEXGRID
    --------------------------------------------------------------------*/
    //HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
    //      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty

    let collishex = turf.collect(hexgeojson, collisiongeojson, '_id', 'values');

    let maxcollis = 0;

    collishex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length
        if (feature.properties.COUNT > maxcollis) {
            console.log(feature);
            maxcollis = feature.properties.COUNT
        }
    });

    // /*--------------------------------------------------------------------
    // Step 5: FINALIZE YOUR WEB MAP
    // --------------------------------------------------------------------*/
    //HINT: Think about the display of your data and usability of your web map.
    //      Update the addlayer paint properties for your hexgrid using:
    //        - an expression
    //        - The COUNT attribute
    //        - The maximum number of collisions found in a hexagon
    //      Add a legend and additional functionality including pop-up windows

    map.addSource('collision-hex', {
        type: 'geojson',
        data: hexgeojson
    });

    map.addLayer({
        'id': 'collision-hex-fill',
        'type': 'fill',
        'source': 'collision-hex',
        'paint': {
            'fill-color': [
                'step',
                ['get', 'COUNT'],
                '#800026',
                10, '#bd0026',
                25, '#e31a1c'
            ],
            'fill-opacity': 0.5,
            'fill-outline-color': "white"
        }
    });
});

map.on('click', 'collis-hex-fill', (e) => {
    new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML("<b>Collision count:<b>" + e.features[0].properties.COUNT)
    .addTo(map);
})
