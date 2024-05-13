<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.3/ScrollToPlugin.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>


<script>

 let accessToken =  "pk.eyJ1Ijoic3R1ZGlvLWZhYnJpYyIsImEiOiJjbGhiMGF3MTMwbW9jM2VwYmU2c3JuZzluIn0.Kj11xLOzx3RsWOhstX-yAQ";
  let styleMap = "mapbox://styles/studio-fabric/cls3xwddm00dm01pu2rn8e2pc";
  const mapCenterCoords = [-118.28396, 34.07541];

  mapboxgl.accessToken = accessToken;

  // create empty locations geojson object
  let mapLocations = {
    type: "FeatureCollection",
    features: []
  };

  // Initialize map and load in #map wrapper
  let map = new mapboxgl.Map({
    container: "map",
    style: styleMap,
    center: mapCenterCoords,
    zoom: 12,
    scrollZoom      : false,
    boxZoom         : true,
    doubleClickZoom : true
  });

  // Create a custom marker in the center of the map
  const el = document.createElement("div");
  el.className = "marker";
  let marker = new mapboxgl.Marker(el).setLngLat(mapCenterCoords).addTo(map);

  // Adjust zoom of map for mobile and desktop
  let mq = window.matchMedia("(min-width: 480px)");
  if (mq.matches) {
    map.setZoom(12); //set map zoom level for desktop size
  } else {
    map.setZoom(9); //set map zoom level for mobile size
  }

  // Add zoom and rotation controls to the map.
  map.addControl(new mapboxgl.NavigationControl());

  // get all children of #location-list
  let listLocations = document.querySelectorAll(
    "#location-list > .locations-map_item"
  );

  // For each colleciton item, grab hidden fields and convert to geojson proerty
  function getGeoData() {
    listLocations.forEach(function (location) {
      let locationName = location.querySelector("#locationName").value;
      let locationLat = location.querySelector("#locationLatitude").value;
      let locationLong = location.querySelector("#locationLongitude").value;
      let locationCategory = location.querySelector("#locationCategory").value;
      let locationAddress = location.querySelector("#locationAddress").value;
      let locationWebsite = location.querySelector("#locationWebsite").value;
      let locationInfo = location.querySelector(".location-map_card").innerHTML;
      let coordinates = [locationLat, locationLong];
      let locationID = location.querySelector("#locationID").value;
      let geoData = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coordinates
        },
        properties: {
          id: locationID,
          name: locationName,
          category: locationCategory,
          description: locationInfo,
          address: locationAddress,
          website: locationWebsite
        }
      };

      if (mapLocations.features.includes(geoData) === false) {
        mapLocations.features.push(geoData);
      }
    });
  }

  // Invoke function
  getGeoData();

  // filter section
  let filterItems = document.querySelectorAll(
    ".neighborhood-map-filter-wrap > a"
  );

  filterItems.forEach(function (item) {
    item.addEventListener("click", function (event) {

      // avoid default link behavior
      event.preventDefault();
      // remove any existing popups on map
      const popup = document.getElementsByClassName("mapboxgl-popup");
      // for each popup, remove it
      while (popup[0]) {
        popup[0].parentNode.removeChild(popup[0]);
      }
      // remove is-clicked class from all filter items
      filterItems.forEach(function (item) {
        item.classList.remove("is-clicked");
        // check if layer exists and remove if so
        if (map.getLayer(item.innerText)) {
          map.removeLayer(item.innerText);
          map.removeSource(item.innerText);
        }
      });
      item.classList.toggle("is-clicked");
      // get value of clicked link
      let filterValue = item.innerText;
      // foreach feature in mapLocations, check if category matches filterValue and if so, add to filteredLocations
      let filteredLocations = {
        type: "FeatureCollection",
        features: []
      };
      mapLocations.features.forEach(function (feature) {
        if (feature.properties.category.toLowerCase() === filterValue.toLowerCase()) {
          filteredLocations.features.push(feature);
        }
      });

      // add paint background style
			map.loadImage(
        "data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' rx='20' fill='%23949598'/%3E%3Cpath d='M12 20.5H29' stroke='white'/%3E%3Cpath d='M20.5 12L20.5 29' stroke='white'/%3E%3C/svg%3E%0A",
        function (error, image) {
          if (error) throw error;
          map.addImage("custom-marker", image);
        }
      );
      
      map.loadImage(
        "https://uploads-ssl.webflow.com/6601437b14a143a747ac3709/663479bbe357d355726b38f7_map_point-elipse.png",
        function (error, image) {
          if (error) throw error;
          map.addImage("custom-location-marker", image);
        }
      );
      
      // add filteredLocations to a new layer
      if (!map.getLayer(filterValue)) {
        map.addLayer({
                    id: filterValue,
                    type: 'symbol',
                   	source: {
                      type: "geojson",
                      data: filteredLocations
                    }, // reference the data source
                    layout: {
                        "icon-image": 'custom-location-marker', // reference the image
                        "icon-size": 1
                    }
                });

        map.on("click", filterValue, (e) => {
          // Copy coordinates array.

          const coordinates = e.features[0].geometry.coordinates.slice();
          const description = e.features[0].properties.name;
          const address = e.features[0].properties.address;
          const website = e.features[0].properties.website;
          
          map.flyTo({
            center: coordinates,
            /*zoom: 8,*/
            speed: 0.35,
            essential: true 
          });
          
          

          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          // Concatenate name and address into an HTML string with styling
     const popupContent = `
<div class="popup-name-wrap">
<p>${description}</p>
  </div>
  <div class="popup-address-wrap">
<p>${address}</p>
  </div>
 <a href="${website}" target="_blank" class="pop-up-website-link"><p>Website</p></a>
`;




          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
        });

        map.on("mouseenter", filterValue, (e) => {
          map.getCanvas().style.cursor = "pointer";
        });

        // Change it back to a pointer when it leaves.
        map.on("mouseleave", filterValue, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });
  });
</script>



<script>
function checkBreakpoint(x) {
  if (x.matches) {
    // desktop code here
  } else {
    let map = $("#map");

$(".location-filter-btn").each(function(){
$(this).on("click", function(){
gsap.to(window, { duration: 1, scrollTo: { y: map, offsetY: 300 } });
})
});
  }
}
const matchMediaDesktop = window.matchMedia("(min-width: 479px)");
checkBreakpoint(matchMediaDesktop);
matchMediaDesktop.addListener(checkBreakpoint);
</script>
