/*--------------------------------------------------------------------
GGR472 LAB 4: Map Representation of Pedestrian Collisions in Toronto 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Part 1: Creating a map frame
--------------------------------------------------------------------*/
// defining access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYW5uYS1oZWluMSIsImEiOiJjbHMyOWllNW8wa2J3MmpsZHM1eHk0b3oxIn0.9g1JErkZTD4sg70-swx-YQ';

// creating a map container specially referenced around Toronto and initializing the map
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/anna-hein1/cltq8azbv024r01qp54by1bkc',
    center: [-79.38, 43.72],  // starting point, longitude/latitude
    zoom: 10.5 // starting zoom level
});

/*--------------------------------------------------------------------
Part 2: Adding geojson point data to the map
--------------------------------------------------------------------*/
// the following code adds the pedestrian collision geojson point data onto the map
let collisiongeojson;

fetch('https://raw.githubusercontent.com/anna-hein25/GGR472-lab4/ed29c9a264739fa82c90f146cd79e08eac577133/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response);
        collisiongeojson = response;
    });

/*--------------------------------------------------------------------
Part 3: Creating a bounding box and hexgrid 
--------------------------------------------------------------------*/
// this code creates a rectangle box that consists of hexagons to encase the pedestrian collision points
map.on('load', () => {

    let bboxgeojson;
    let bbox = turf.envelope(collisiongeojson);
    let bboxscaled = turf.transformScale(bbox, 1.10);

    bboxgeojson = {
        'type': 'FeatureCollection',
        'features': [bboxscaled]
    };

    let bboxcoords = [bboxscaled.geometry.coordinates[0][0][0],
                    bboxscaled.geometry.coordinates[0][0][1],
                    bboxscaled.geometry.coordinates[0][2][0],
                    bboxscaled.geometry.coordinates[0][2][1],];
   let hexgeojson = turf.hexGrid(bboxcoords, 0.3, { units: 'kilometers' });

/*--------------------------------------------------------------------
Part 4: Aggregating collisions by hexgrid
--------------------------------------------------------------------*/
// this section of the code counts the number of collision points and clusters them based on the hexagons in the hexgrid
    let collishex = turf.collect(hexgeojson, collisiongeojson, '_id', 'values');
    let maxcollis = 0;

    collishex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length
        if (feature.properties.COUNT > maxcollis) {
            console.log(feature);
            maxcollis = feature.properties.COUNT
        }
    });

/*--------------------------------------------------------------------
Part 5: Finalizing my web map
--------------------------------------------------------------------*/
// the code below displays the code above on the web map page
    map.addSource('collision-hex', {
        type: 'geojson',
        data: hexgeojson
    });

    map.addLayer({
        'id': 'collision-hex-fill',
        'type': 'fill',
        'source': 'collision-hex',
        'paint': {
            'fill-color': [ // the colors used here are assigned to certain values and is displayed on the legend
                'step',
                ['get', 'COUNT'],
                '#fd8d3c', // colors assigned to any values < first step
                5, '#fc4e2a', // colors assigned to values >= each step
                10, '#e31a1c',
                16, '#bd0026',
                22, '#800026'
            ],
            'fill-opacity': 0.5,
            'fill-outline-color': "white"
        }
    });
});


// defining the popup window
// allows users to click a hexagon and the exact number of pedestrian collisions occurred in that area
map.on('click', 'collision-hex-fill', (e) => {
    if (e.features.length > 0) {
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML("<b>Pedestrian Collision count:</b> " + e.features[0].properties.COUNT)
            .addTo(map);
    }
});
