import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import buildings from './buildings';
import RequestItem from '../../components/permRequestUtils/RequestItem'
import AccessRequestModal from '../../pages/permissionRequest/AccessRequestModal';
import RequestDetailsModal from './RequestDetailsModal';
import Modal from 'react-bootstrap/Modal';
import { useToasts } from 'react-toast-notifications'

import { GoogleSpreadsheet } from "google-spreadsheet";
import config from '../../config';

const SPREADSHEET_ID = config.spread_sheet_id;
const CLIENT_EMAIL = config.client_email;
const PRIVATE_KEY = config.private_key;
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

var buildingsRows;
var buildingsRowsArray = [];
var lockDownInAnyBuilding = false;

var user = localStorage.getItem('userInfo');
user = JSON.parse(user);


const Requests = () => {

  const [prDisplay, setPrDisplay] = useState(false);
  const [buildingInfo, setBuildingInfo] = useState({
      name: "Wendt Common",
      doors: "Room 43",
      type: "Class Rooms"
  });

  const hideModal = () => {
      setPrDisplay(false);
  }
  const showModal = () => {
      setPrDisplay(true);
  }



  const mapContainer = useRef();
  const { addToast } = useToasts();
  const [buildingsList, setBuildingsList] = useState([]);
  const [requestList, setRequestList] = useState([]);
  const [singleRequestItem, setSingleRequestItem] = useState({});
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
  
  const [showLockDown, setShowLockDown] = useState(false);
  
  const hideSRDM = () => {
    setShowRequestDetailsModal(false);
  }
  const setRequestItemFunc = (item) => {
    setShowRequestDetailsModal(true);
    setSingleRequestItem(item)
  }

  const getBuildingList = async () => {
    const SHEET_ID = "2070259920";
      try {
        await doc.useServiceAccountAuth({
          client_email: CLIENT_EMAIL,
          private_key: PRIVATE_KEY,
        });
        // loads document properties and worksheets
        await doc.loadInfo();
    
        const sheet = doc.sheetsById[SHEET_ID];
        // const result = await sheet.addRow(row);
    
        const rows = buildingsRows = await sheet.getRows(); // can pass in { limit, offset }
      //   buildings = rows;
      let buildingRows1 = rows.map((obj)=> {
        
        const { name, desc, lock_down, _rowNumber } = obj;

        if(lock_down.toString() === 'TRUE'){
          lockDownInAnyBuilding = true;
        }

        return {
          name, desc, lock_down, _rowNumber
        }
      })
      setBuildingsList(buildingRows1);
    
      } catch (e) {
        console.error('Error: ', e);
      }
  };


  const getRequestListSheet = async () => {
      const SHEET_ID = "1723216762";
      try {
        await doc.useServiceAccountAuth({
          client_email: CLIENT_EMAIL,
          private_key: PRIVATE_KEY,
        });
        // loads document properties and worksheets
        await doc.loadInfo();

        const sheet = doc.sheetsById[SHEET_ID];
        // const result = await sheet.addRow(row);

        const rows = await sheet.getRows();
        //   buildings = rows;
        setRequestList(rows);
      } catch (e) {
        console.error('Error: ', e);
      }
    };

    const addApproveOrDenyRequestToSheet = async (request, ApproveOrDeny) => {
      var requestInfo = request;
      let RequestAndUserInfo = {
          doors: requestInfo.doors,
          email: requestInfo.email,
          first_name: requestInfo.first_name,
          last_name: requestInfo.last_name,
          message: requestInfo.message,
          name: requestInfo.name,
          type: requestInfo.type,
          user_type: requestInfo.user_type,
          request_status: ApproveOrDeny
      }

      const SHEET_ID = "2067777639";
      try {
        await doc.useServiceAccountAuth({
          client_email: CLIENT_EMAIL,
          private_key: PRIVATE_KEY,
        });
        // loads document properties and worksheets
        await doc.loadInfo();

        const sheet = doc.sheetsById[SHEET_ID];
        const result = await sheet.addRow(RequestAndUserInfo);
        addToast("Request Submitted", {
          appearance: 'success',
          autoDismiss: true,
        });
        setShowRequestDetailsModal(false);
      } catch (e) {
        console.error('Error: ', e);
      }

    }

    const deleteRequestByRowNumber = async (rowNumber, ApproveOrDeny) => {
      let rl = requestList.map((obj) => {
        Sidebar();
        if(obj._rowNumber == rowNumber){
          addApproveOrDenyRequestToSheet(obj, ApproveOrDeny);
          obj.delete();
        }
      });
      getRequestListSheet();
    }

  function Sidebar() {
    document.getElementById('sidebar').classList.toggle('show');
  }

  const ToggleSidePanel = () => {
    var el = document.getElementById('slide-in-request-penel');
    if(el)
    el.classList.toggle('show');
  }

  const toggleAllCheckBoxes = (e) => {
    const { name, checked } = e.target;
    buildingsRowsArray = [];
    let updatebuildingList = buildingsList.map((obj, index) => {
      buildingsRowsArray.push({
        value: index,
        checked: checked,
        _rowNumber: obj._rowNumber
      });
      return { ...obj, lock_down: checked.toString().toUpperCase() }
    });
    setBuildingsList(updatebuildingList);
  }

  const handleChange = (e, _rowNumber) => {
      const { name, value, checked } = e.target;
      let found = buildingsRowsArray.findIndex(i => i.value.toString() === value.toString());
      if(found === -1){
        buildingsRowsArray.push({
          value,
          checked: checked,
          _rowNumber
        });
      }else{
        if(buildingsRowsArray.length > 0)
        buildingsRowsArray[found].checked = checked;
      }
      let updatebuildingList = buildingsList.map((obj, index) => {
        if(index.toString() === value.toString()){
          return { ...obj, lock_down: checked.toString().toUpperCase() }
        }
        return obj;
      });
      setBuildingsList(updatebuildingList);
    }
    
  const updateBuildingRows = async () =>{
    var __rowNumber, __checked;
      for (let index = 0; index < buildingsRowsArray.length; index++) {
        __rowNumber = buildingsRowsArray[index]._rowNumber;
        __checked = buildingsRowsArray[index].checked;
        buildingsRows.map( (__obj) => {
          if(__obj._rowNumber === __rowNumber){
            __obj.lock_down = __checked;
            __obj.save();
          }
        });
      }
      lockDownInAnyBuilding = false;
      buildingsList.map( (obje) => {
        if(obje.lock_down.toString() === 'TRUE'){
          lockDownInAnyBuilding = true;
        }
      })
      setShowLockDown(false);
  }
  const lockDownModal = () => {
    if(showLockDown)
      return <><Modal show={showLockDown} onHide={()=> setShowLockDown(false)}>
        <Modal.Header>
          <Modal.Title>What Buildings to Lockdown?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <span className="text-dark">All:</span>
              <hr className="modal-line" />
              <label className="container mb-4">All Buildings
                <input type="checkbox" name="checkAll" onChange={toggleAllCheckBoxes} />
                <span className="checkmark"></span>
              </label>
              <span className="text-dark">Specific:</span>
              <div className="checkboxes-content">
                { buildingsList.map((obj, index) => {
                  // console.log( typeof(  ))
                  return <label className="container" key={index + 1}> <span className="specific-text">{obj.name}</span>
                    <br />
                    <span className="sub-heading-text">{ obj.desc }</span>
                    <input type="checkbox" name="buildingArr" value={index} checked={ JSON.parse( (obj.lock_down).toLowerCase() ) } onChange={ (e) => handleChange(e, obj._rowNumber)}/>
                    <span className="checkmark"></span>
                  </label>;
                  })
                }
                </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
            <button type="button" className="btn btn-outline-secondary modal-footer-btn" onClick={ () => setShowLockDown(false)}>Cancel</button>
            <button type="button" className="btn btn-outline-secondary modal-footer-btn" onClick={updateBuildingRows}>Confirm</button>
        </Modal.Footer>
      </Modal>
      </>
  }

  const loadGeoJsonPlacesSourcesAndLayers = (mapInstance) => {
    if(mapInstance.getSource("places"))
    return;

    removeAllSourcesAndLayers(mapInstance);
    mapInstance.addSource('places', {
      'type': 'geojson',
      'data': buildings
    });
    // Add a layer showing the places.
    mapInstance.addLayer({
      'id': 'places',
      'type': 'fill',
      'source': 'places',
      'layout': {},
      'paint': {
        'fill-color': '#1F2C40', // blue color fill
        'fill-outline-color': '#1daefc'
      }

    });

    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    mapInstance.on('click', 'places', function (e) {

      var features = e.features[0];
      console.log(features.length);
      if (typeof mapInstance.getLayer('selectedBuilding') !== "undefined") {
        mapInstance.removeLayer('selectedBuilding')
        mapInstance.removeSource('selectedBuilding');
      }

      console.log(features.toJSON());
      mapInstance.addSource('selectedBuilding', {
        "type": "geojson",
        "data": features.toJSON()
      });
      mapInstance.addLayer({
        "id": "selectedBuilding",
        "type": "fill",
        "source": "selectedBuilding",
        'layout': {},
        'paint': {
          'fill-outline-color': '#1F2C40',
          'fill-color': '#178fed'
        }
      });

      var popup =
        '<div class="leaflet-popup  leaflet-zoom-animated" ><div class="leaflet-popup-content-wrapper"><div class="leaflet-popup-content" style="width: 311px;"><div class="content-wrapper clearfix">' +
        '<div class="popup-row">' +
        '<div class="popup-col mo-img">' +
        '<img src="https://map.wisc.edu/rails/active_storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBckFDIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--352c73a8c42905f2c6e0148f641c94f1e84e9dc1/Muir_Woods.jpg" alt="" data-modal-link="/api/v1/map_objects/552.html" class="thumbnail">' +
        '</div>' +
        '<div class="popup-col">' +
        '<h3>' + e.features[0].properties.name +
        '</h3><p></p></div></div>' +
        '<p class="align-right">' +
        '<a href="#" data-modal-link="/api/v1/map_objects/552.html" class="more_link" tabindex="1">' +
        'More ' +
        '<svg aria-hidden="true" id="uw-symbol-more" viewBox="0,0,1792,1792">' +
        '<title>More</title>' +
        '<path d="M979 960q0 13-10 23l-466 466q-10 10-23 10t-23-10l-50-50q-10-10-10-23t10-23l393-393-393-393q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l466 466q10 10 10 23zm384 0q0 13-10 23l-466 466q-10 10-23 10t-23-10l-50-50q-10-10-10-23t10-23l393-393-393-393q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l466 466q10 10 10 23z"></path>' +
        '</svg>' +
        '</a>' +
        '</p>' +
        '</div></div></div><div class="leaflet-popup-tip-container"><div class="leaflet-popup-tip"></div></div></div>';
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popup)
        .addTo(mapInstance);

      // Change the cursor to a pointer when the mouse is over the places layer.
      mapInstance.on('mouseenter', 'places', function () {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to a pointer when it leaves.
      mapInstance.on('mouseleave', 'places', function () {
        mapInstance.getCanvas().style.cursor = '';
      });
    });
  }

  const wallSourceAndLayers = mapInstance => {
    
    if(mapInstance.getSource("wall-source"))
      return
    mapInstance.addSource('wall-source', {
        'type': 'vector',
        'url': 'mapbox://alexmahnke.3mrlhcpi'
    });

    mapInstance.addLayer({
      'id': 'wall-layer',
      'type': 'line',
      'source': 'wall-source',
      'source-layer': 'Wall-9qavdz',
      'paint': {
        "line-color": "#ffffff",
        "line-width": 2 
      }
    });
  }

  const hiddenAreaSourceAndLayers = mapInstance => {
    if(mapInstance.getSource("hidden-area-source"))
    return;

    removeAllSourcesAndLayers(mapInstance);
    mapInstance.addSource('hidden-area-source', {
      'type': 'vector',
      'url': 'mapbox://alexmahnke.0ne2hfwr'
    });
    //set up data layers
    mapInstance.addLayer({
        'id': 'area-layer',
        'type': 'fill',
        'source': 'hidden-area-source',
        'source-layer': 'area_hidden_info-2lncd1',
        'paint': {
            // 'fill-outline-color': '#0066ff',
            // 'fill-color': '#0066ff',
            'fill-opacity': 0,
        },
        'paint.tilted': {}
    }, 'water');

    mapInstance.addLayer({
        'id': 'release-area-layer-outline',
        'type': 'line',
        'source': 'hidden-area-source',
        'source-layer': 'area_hidden_info-2lncd1',
        'paint': {
            'line-color': '#0066ff',
            'line-width': 1,
        }
    });

    mapInstance.addLayer({
      "id": "release-layer-hover",
      "type": "fill",
      'source': 'hidden-area-source',
      'source-layer': 'area_hidden_info-2lncd1',
      "layout": {},
      'paint': {
          'fill-outline-color': '#ff0000',
          'fill-color': '#ffffff',
          'fill-opacity': 0.5,
      },
      "filter": ["==", "Shape_Area", ""]
    });

    mapInstance.addLayer({
      'id': 'release-layer-border-hover',
      'type': 'line',
      'source': 'hidden-area-source',
      'source-layer': 'area_hidden_info-2lncd1',
      'paint': {
          'line-color': '#ffffff',
          'line-width': 4
      },
      "filter": ["==", "Shape_Area", ""]
    });

    mapInstance.on('click', 'area-layer', function (e) {
      var el = document.getElementById('slide-in-request-penel');
      if(el){
        if( ! el.classList.contains("show") ){
          el.classList.add('show');
        }
      }

      var features = e.features[0];
      var props = features.properties;
      var coordinates = features.geometry.coordinates;
      setBuildingInfo({ ...buildingInfo, doors: props.Number})
      // new mapboxgl.Popup()
      // .setLngLat(coordinates)
      // .setHTML("<div className='p-3'><h3>" + props.Name + "</h3></div>")
      // .addTo(mapInstance);
    });

    mapInstance.on('mousemove', 'area-layer', (e) => {
      
      var features = e.features;
      // Single out the first found feature.
      var ft = features[0];
      var showTooltip = ft && ft.properties;
      //  Add features that share the same PARCEL_TYP to the hover layer.
      if (showTooltip) {

          mapInstance.setFilter('release-layer-hover', [
              'in',
              'Shape_Area',
              ft.properties.Shape_Area
          ]);

          mapInstance.setFilter('release-layer-border-hover', [
              'in',
              'Shape_Area',
              ft.properties.Shape_Area
          ]);
    }else{
  
        mapInstance.setFilter('release-layer-hover', ['in', 'Shape_Area', '']);
        mapInstance.setFilter('release-layer-border-hover', ['in', 'Shape_Area', '']);

    }
  });
  mapInstance.on('mouseleave', 'area-layer', function () {
      mapInstance.setFilter('release-layer-hover', ['in', 'ALIAS_NAME', '']);
      mapInstance.setFilter('release-layer-border-hover', ['in', 'ALIAS_NAME', '']);
  });

  }

  const wallLinesSourceAndLayers = mapInstance => {
    
    if(mapInstance.getSource("wall-line-source"))
      return
    mapInstance.addSource('wall-line-source', {
        'type': 'vector',
        'url': 'mapbox://alexmahnke.akmgk869'
    });

    mapInstance.addLayer({
      'id': 'wall-line-layer',
      'type': 'line',
      'source': 'wall-line-source',
      'source-layer': 'wall_lines_topLayer-3xfmsr',
      'paint': {
        "line-color": "#ffffff",
        "line-width": 2
      }
    });
  }

  const floorSourceAndLayers = mapInstance => {
    if(mapInstance.getSource("floor-source"))
      return;
    mapInstance.addSource('floor-source', {
        'type': 'vector',
        'url': 'mapbox://alexmahnke.9if8x23h'
    });

    mapInstance.addLayer({
      'id': 'floor-layer',
      'type': 'fill',
      'source': 'floor-source',
      'source-layer': 'Floor-aenkni',
      'paint': {
        "fill-color": "#1f2c40",
        "fill-opacity": 1,
        "fill-outline-color": '#1f2c40'
      }
    });
  }

  const roomNumbersSourceAndLayers = mapInstance => {
    if(mapInstance.getSource("room-number-source"))
      return;
    mapInstance.addSource('room-number-source', {
        'type': 'vector',
        'url': 'mapbox://alexmahnke.aoanit2m'
    });

    mapInstance.addLayer({
      'id': 'room-number-layer',
      'type': 'circle',
      'source': 'room-number-source',
      'source-layer': 'Room_Number-5rzz4j',
      'paint': {
        'circle-radius': 10,
        'circle-color': ['case',
            ['boolean', ['feature-state', 'hover'], false],
              'white',
              'red'
            ],
        // 'circle-opacity': 0.6,
      }
    });
    roomNumbersHover(mapInstance);
  }

  const roomNumbersHover = mapInstance => {
    var quakeID = null;

    mapInstance.on('mousemove', 'room-number-layer', (e) => {
      mapInstance.getCanvas().style.cursor = 'pointer';
      if (e.features.length > 0) {
        // When the mouse moves over the room-number-layer layer, update the
        // feature state for the feature under the mouse
        if (quakeID) {
          mapInstance.removeFeatureState({
            source: 'room-number-source',
            sourceLayer: 'Room_Number-5rzz4j',
            id: quakeID
          });
        }

        quakeID = e.features[0].id;

        mapInstance.setFeatureState(
          {
            source: 'room-number-source',
            sourceLayer: 'Room_Number-5rzz4j',
            id: quakeID
          },
          {
            hover: true
          }
        );
      }
    });

    // When the mouse leaves the room-number-layer layer, update the
    // feature state of the previously hovered feature
    mapInstance.on('mouseleave', 'room-number-layer', function () {
      if (quakeID) {
        mapInstance.setFeatureState(
          {
            source: 'room-number-source',
            sourceLayer: 'Room_Number-5rzz4j',
            id: quakeID
          },
          {
            hover: false
          }
        );
      }
      quakeID = null;
      mapInstance.getCanvas().style.cursor = '';
    });


    mapInstance.on('click', 'room-number-layer', function (e) {
      var el = document.getElementById('slide-in-request-penel');
      if(el){
        if( ! el.classList.contains("show") ){
          el.classList.add('show');
        }
      }

      var features = e.features[0];
      var props = features.properties;
      var coordinates = features.geometry.coordinates;
      alert(props.Name);
      // new mapboxgl.Popup()
      // .setLngLat(coordinates)
      // .setHTML("<div className='p-3'><h3>" + props.Name + "</h3></div>")
      // .addTo(mapInstance);
    });
  }

  const exitSourceAndLayers = mapInstance => {
    if(mapInstance.getSource("exit-source"))
      return;
    mapInstance.addSource('exit-source', {
      'type': 'vector',
      'url': 'mapbox://alexmahnke.4t25kfh1'
    });

    mapInstance.addLayer({
      'id': 'exit-layer',
      'type': 'circle',
      'source': 'exit-source',
      'source-layer': 'Exit-1n433k',
      'paint': {
        'circle-radius': 10,
        'circle-color': ['case',
        ['boolean', ['feature-state', 'hover'], false],
          'white',
          'green'
        ],
      }
    });
    exitHover(mapInstance);
  }

  const exitHover = mapInstance => {
    var quakeID = null;

    mapInstance.on('mousemove', 'exit-layer', (e) => {
      mapInstance.getCanvas().style.cursor = 'pointer';
      if (e.features.length > 0) {
        // When the mouse moves over the exit-layer layer, update the
        // feature state for the feature under the mouse
        if (quakeID) {
          mapInstance.removeFeatureState({
            source: 'exit-source',
            sourceLayer: 'Exit-1n433k',
            id: quakeID
          });
        }

        quakeID = e.features[0].id;

        mapInstance.setFeatureState(
          {
            source: 'exit-source',
            sourceLayer: 'Exit-1n433k',
            id: quakeID
          },
          {
            hover: true
          }
        );
      }
    });

    // When the mouse leaves the exit-layer layer, update the
    // feature state of the previously hovered feature
    mapInstance.on('mouseleave', 'exit-layer', function () {
      if (quakeID) {
        mapInstance.setFeatureState(
          {
            source: 'exit-source',
            sourceLayer: 'Exit-1n433k',
            id: quakeID
          },
          {
            hover: false
          }
        );
      }
      quakeID = null;
      mapInstance.getCanvas().style.cursor = '';
    });


    mapInstance.on('click', 'exit-layer', function (e) {
      var features = e.features[0];
      var props = features.properties;
      var coordinates = features.geometry.coordinates;
      console.log(coordinates);
      // new mapboxgl.Popup()
      // .setLngLat(coordinates)
      // .setHTML("<div className='p-3'><h3>" + props.Name + "</h3></div>")
      // .addTo(mapInstance);
    });
  }

  const stairsSourceAndLayers = mapInstance => {
    if(mapInstance.getSource("stairs-source"))
      return;
    mapInstance.addSource('stairs-source', {
        'type': 'vector',
        'url': 'mapbox://alexmahnke.8fo0so4j'
    });

    mapInstance.addLayer({
      'id': 'stairs-layer',
      'type': 'circle',
      'source': 'stairs-source',
      'source-layer': 'Stair-a98o0i',
      'paint': {
        'circle-radius': 10,
        'circle-color': ['case',
        ['boolean', ['feature-state', 'hover'], false],
          'white',
          'blue'
        ],
      }
    });
    stairsHover(mapInstance);
  }

  const stairsHover = mapInstance => {
    var quakeID = null;

    mapInstance.on('mousemove', 'stairs-layer', (e) => {
      mapInstance.getCanvas().style.cursor = 'pointer';
      if (e.features.length > 0) {
        // When the mouse moves over the stairs-layer layer, update the
        // feature state for the feature under the mouse
        if (quakeID) {
          mapInstance.removeFeatureState({
            source: 'stairs-source',
            sourceLayer: 'Stair-a98o0i',
            id: quakeID
          });
        }

        quakeID = e.features[0].id;

        mapInstance.setFeatureState(
          {
            source: 'stairs-source',
            sourceLayer: 'Stair-a98o0i',
            id: quakeID
          },
          {
            hover: true
          }
        );
      }
    });

    // When the mouse leaves the stairs-layer layer, update the
    // feature state of the previously hovered feature
    mapInstance.on('mouseleave', 'stairs-layer', function () {
      if (quakeID) {
        mapInstance.setFeatureState(
          {
            source: 'stairs-source',
            sourceLayer: 'Stair-a98o0i',
            id: quakeID
          },
          {
            hover: false
          }
        );
      }
      quakeID = null;
      mapInstance.getCanvas().style.cursor = '';
    });


    mapInstance.on('click', 'stairs-layer', function (e) {
      var features = e.features[0];
      var props = features.properties;
      var coordinates = features.geometry.coordinates;
      // new mapboxgl.Popup()
      // .setLngLat(coordinates)
      // .setHTML("<div className='p-3'><h3>" + props.Name + "</h3></div>")
      // .addTo(mapInstance);
    });
  }

  const removeAllSourcesAndLayers = (mapInstance) => {

    if(mapInstance.getSource("hidden-area-source")){
      mapInstance.removeLayer("area-layer");
      mapInstance.removeLayer("release-area-layer-outline");
      mapInstance.removeLayer("release-layer-border-hover");
      mapInstance.removeLayer("release-layer-hover");
      mapInstance.removeSource('hidden-area-source');
    }

    if(mapInstance.getSource("wall-line-source")){
      mapInstance.removeLayer("wall-line-layer");
      mapInstance.removeSource('wall-line-source');
    }

    if(mapInstance.getSource("places")){
      mapInstance.removeLayer("places");
      mapInstance.removeSource('places');
    }
    // wall
    if(mapInstance.getSource("wall-source")){
      mapInstance.removeLayer("wall-layer");
      mapInstance.removeSource('wall-source');
    }

    // floor
    if(mapInstance.getSource("floor-source")){
      mapInstance.removeLayer("floor-layer");
      mapInstance.removeSource('floor-source');
    }

    // room number 
    if(mapInstance.getSource("room-number-source")){
      mapInstance.removeLayer("room-number-layer");
      mapInstance.removeSource('room-number-source');
    }

    // exit 
    if(mapInstance.getSource("exit-source")){
      mapInstance.removeLayer("exit-layer");
      mapInstance.removeSource('exit-source');
    }

    // stairs 
    if(mapInstance.getSource("stairs-source")){
      mapInstance.removeLayer("stairs-layer");
      mapInstance.removeSource('stairs-source');
    }
  }
  
  const addRasterImageSourceAndLayer = (mapInstance) => {
    mapInstance.addSource('myImageSource', {
      type: 'image',
      url: `../raster-image/Layout.png`,
      coordinates: [
        [-89.408918, 43.071745],
        [-89.408386, 43.071745],
        [-89.408386, 43.071200],
        [-89.408918, 43.071200],
      ],
    });
    mapInstance.addLayer({
      id: 'overlay',
      source: 'myImageSource',
      type: 'raster',
      // paint: {
      //   'raster-opacity': 0.85,
      // },
    });
  };

  useEffect(() => {
      getRequestListSheet();
      getBuildingList();
        mapboxgl.accessToken =
            'pk.eyJ1IjoiYWxleG1haG5rZSIsImEiOiJja25oc3psc2cwbWd2MnZudzA1d2dpOW5wIn0.w7LO2v86HxcaZUPdkmFk7g';
        var hoveredStateId = null;

        var map = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/alexmahnke/cko04gqw62spj17pjon947pwz',
          center: [-89.41068, 43.07561],
          zoom: 15
      });

        map.on('load', function () {       
          loadGeoJsonPlacesSourcesAndLayers(map);
          addRasterImageSourceAndLayer(map);
            map.on('zoom', function () {
              var currentZoom = map.getZoom();
              if( currentZoom >= 18){
                  hiddenAreaSourceAndLayers(map);
                  wallLinesSourceAndLayers(map);
                  // floorSourceAndLayers(map);
                  // wallSourceAndLayers(map);
                  // roomNumbersSourceAndLayers(map);
                  // exitSourceAndLayers(map);
                  // stairsSourceAndLayers(map);
              }
              if(currentZoom < 18){
                loadGeoJsonPlacesSourcesAndLayers(map);
              }
            });


        });
    }, []);
    
    return (<>
      { (prDisplay === true) && <AccessRequestModal hideRequestModal={hideModal} buildingInfo={buildingInfo} /> }

      { user.user_type === 'student' && <div className="req-info-home" id="slide-in-request-penel">
        <div className="float-right"><button type="button" onClick={ToggleSidePanel}>&times;</button></div>
        <br />
          <p>
              <span className="light">Building</span> { buildingInfo.name }
          </p>
          <p>
              <span className="light">Door(s)</span> { buildingInfo.doors }
          </p>
          <p>
              <span className="light">Type</span> { buildingInfo.type }
          </p>
          <button type="button" className="mt-3 req-info-home-btn" onClick={ ()=>  { ToggleSidePanel(); setPrDisplay(true); }}>Request Access</button>
      </div>
      }

      {(!showRequestDetailsModal) && <div className="icons">
  
        { user.user_type === "building manager" && <ul><li>
          <button type="button" className="btn btn-outline-secondary" onClick={Sidebar}>
          <i className="fas fa-user mr-2"></i>
            Requests
            <span className="badge badge-pill badge-danger">{ requestList.length }</span>
          </button>
        </li></ul>
        }
        { user.user_type === 'executive manager' && <ul><li>
          <button type="button" className="btn btn-outline-secondary" onClick={()=> setShowLockDown(true)}>
          <i className="fas fa-user-lock fa-lg"></i>
          </button>
        </li> 
      </ul>
        }
    </div> 
    }

      <div className="icons icons-right">
        <ul>
          <li>
            <button type="button" className="btn btn-outline-secondary pr-4 pl-4" onClick={() => {
                localStorage.removeItem('userInfo');
                window.location.href="/Login";
            }}>
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </li>
        </ul>
      </div>

      <div className="map-container" ref={mapContainer} id="map-container" />
      { user.user_type === "building manager" &&  <div className="request-sidebar" id="sidebar" >
        {
          requestList.map((obj, index) => <RequestItem request={obj} key={index} setRequest={setRequestItemFunc}/>)
        }
      </div> 
      }
      { ( showRequestDetailsModal === true ) && <RequestDetailsModal hideSRDM={hideSRDM} requestItemInfo={singleRequestItem} deleteRequestByRowNumber={deleteRequestByRowNumber} /> }
      {/* Modal */}
      {
        lockDownModal()
      }
      {  (lockDownInAnyBuilding  === true) && <h1 className="emergency">EMERGENCY ALERT: BUILDINGS IN LOCKDOWN</h1> }
    </>);
};

export default Requests;
