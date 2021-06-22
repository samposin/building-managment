import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import buildings from "./buildings";
import buildingsData from "./buildingsData";
import RequestItem from "../../components/permRequestUtils/RequestItem";
import AccessRequestModal from "../../pages/permissionRequest/AccessRequestModal";
import RequestDetailsModal from "./RequestDetailsModal";
import Modal from "react-bootstrap/Modal";
import { useToasts } from "react-toast-notifications";
import InputRadio from '../../components/input_radio';
import axios from 'axios';

import { GoogleSpreadsheet } from "google-spreadsheet";
import config from "../../config";

const SPREADSHEET_ID = config.spread_sheet_id;
const CLIENT_EMAIL = config.client_email;
const PRIVATE_KEY = config.private_key;
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

var buildingsRows;
var buildingsRowsArray = [];
var lockDownInAnyBuilding = false;
var mapObj;
var buildingNames = [];
var user = localStorage.getItem("userInfo");
user = JSON.parse(user);

var stepNumber = 0;

if (user) {
  if (user.user_type === "student") stepNumber = 1;
  if (user.user_type === "department manager") stepNumber = 2;
  if (user.user_type === "building manager") stepNumber = 3;
  if (user.user_type === "police officer") stepNumber = 4;
}

const Requests = () => {
  const [prDisplay, setPrDisplay] = useState(false);
  const [buildingInfo, setBuildingInfo] = useState({
    name: "Wendt Common",
    doors: "Room 43",
    type: "Class Rooms",
  });

  const hideModal = () => {
    setPrDisplay(false);
  };
  const showModal = () => {
    setPrDisplay(true);
  };

  const mapContainer = useRef();
  const { addToast } = useToasts();
  const [buildingsList, setBuildingsList] = useState([]);
  const [requestList, setRequestList] = useState([]);
  const [singleRequestItem, setSingleRequestItem] = useState({});
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);

  const [showLockDown, setShowLockDown] = useState(false);

  // const [floorArray, setFloorArray] = useState([{floor:'first-floor', active: false}, {floor:'second-floor', active: false}, {floor:'third-floor', active: false}, {floor:'fourth-floor', active: false}]);
  const [floorArray, setFloorArray] = useState([
    { name: 'Wendt', floor:'first-floor', layer_name: 'Wendt_Floor_1-2se8nk', layer_id: 'alexmahnke.2v5kaa45', active: false },
    { name: 'Wendt', floor:'second-floor', layer_name: 'Wendt_Floor_2-br0f6m', layer_id: 'alexmahnke.050dg8h6', active: false },
    { name: 'Wendt', floor:'third-floor', layer_name: 'Wendt_Floor_3-4ymutc', layer_id: 'alexmahnke.3vnm4k9l', active: false },
    { name: 'Wendt', floor:'fourth-floor', layer_name: 'Wendt_Floor_4-4nzvaw', layer_id: 'alexmahnke.dbmm7lbu', active: false }
  ]);
  
  const [MRHFloor, setMRHFloor] = useState([
    { name: 'MRH', floor:'first-floor', layer_name: 'MRH-Boundary-66ms89', layer_id: 'alexmahnke.2dwsbx09', active: false },
    { name: 'MRH', floor:'second-floor', layer_name: 'MRH-Floor_1-3esnl8', layer_id: 'alexmahnke.9h2dxj4n', active: false },
    { name: 'MRH', floor:'third-floor', layer_name: 'MRH-Floor_2-2m91tf', layer_id: 'alexmahnke.a5ovliwf', active: false },
    { name: 'MRH', floor:'fourth-floor', layer_name: 'MRH-Floor_3-339ky1', layer_id: 'alexmahnke.2ccsdcxv', active: false }
  ]);

  const [engineeringHallFloorArray, setEngineeringHallFloorArray] = useState([
    { name: 'eh', floor:'eh-first-floor', layer_name:'Eng-Hall-1st_Floor-2f2oo4', layer_id:'alexmahnke.8jvpmyng', active: false },
    { name: 'eh', floor:'eh-second-floor', layer_name:'Eng-hall-2nd_Floor-2z2901', layer_id:'alexmahnke.dp86bu0m', active: false },
    { name: 'eh', floor:'eh-third-floor', layer_name:'Eng-Hall-3rd_Floor-cco71i', layer_id:'alexmahnke.2o423zbr', active: false }
  ]);
  const [pitch, setPitch] = useState(0);
  const [zoom, setZoom] = useState(12);
  const [center, setCenter] = useState([-89.41068, 43.07561]);
  const [bearing, setBearing] = useState(0);
  const [viewIn3d, setViewIn3d] = useState(false);
  const [viewHistory, setViewHistory] = useState(false);
  const [lngLat, setLngLat] = useState({ lng: -89.40864500185694, lat: 43.071436442382236 });


  const [buildingClickedOn, setBuildingClickedOn] = useState({});

  const [selectedType, setSelectedType] = useState("Interior Private");
  const [deviceType, setDeviceType] = useState("");
  const [values, setValues] = useState({ camera_address: "https://f5.aos.wisc.edu/webcam_movies/latest_northwest_today_1024x768.mp4" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value
    });
  }

  const onValueChange= (event) => {
      setSelectedType(event.target.value)
  }

  const [showCameraModal, setShowCameraModal] = useState(false);

  const toggleCameraModal = () => setShowCameraModal(!showCameraModal);

  const hideSRDM = () => {
    setShowRequestDetailsModal(false);
  };
  const setRequestItemFunc = (item) => {
    setShowRequestDetailsModal(true);
    Sidebar();
    setSingleRequestItem(item);
  };

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

      const rows = (buildingsRows = await sheet.getRows()); // can pass in { limit, offset }
      //   buildings = rows;
      buildingNames = [];
      let buildingRows1 = rows.map((obj) => {
        const { name, desc, lock_down, _rowNumber } = obj;

        if (lock_down.toString() === "TRUE") {
          lockDownInAnyBuilding = true;
          buildingNames.push(name);
        }

        return {
          name,
          desc,
          lock_down,
          _rowNumber,
        };
      });
      setBuildingsList(buildingRows1);
    } catch (e) {
      console.error("Error: ", e);
    }
  };

    // change buildings color incase of lockdown
    useEffect(() => {
      if (mapObj) applyRedColor();
    }, [buildingsList]);

  const getRequestListSheet = async () => {
    var SHEET_ID = "1723216762";
    if (user.user_type === "department manager") var SHEET_ID = "1723216762";
    if (user.user_type === "building manager") SHEET_ID = "2067777639";
    if (user.user_type === "police officer") SHEET_ID = "892859524";
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
      console.error("Error: ", e);
    }
  };

  const getPulsingDotListSheet = async () => {
    var SHEET_ID = "0";
    var doc1 = new GoogleSpreadsheet('1O_NSS9trFypqlxoPxj1C1B601i_Y23bAZ0PRZI6WaiU');
    try {
      await doc1.useServiceAccountAuth({
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY,
      });
      // loads document properties and worksheets
      await doc1.loadInfo();

      const sheet = doc1.sheetsById[SHEET_ID];
      // const result = await sheet.addRow(row);

      const rows = await sheet.getRows();
      let points = rows.map((obj)=> [obj._rawData[0],obj._rawData[1], obj._rawData[2], obj._rawData[3], obj._rawData[4], obj._rawData[5]] );
      
      drawPoints(points);

    } catch (e) {
      console.error("Error: ", e);
    }
  };

  const drawPoints = (points) => {
    var size = 100;

    for (var i = 0; i < points.length; i++) {
      if (points[i][4] == "2-Alert") {
        var devId = points[i][0];

        var pulsingDotdevId = {
          width: size,
          height: size,
          data: new Uint8Array(size * size * 4),

          // get rendering context for the map canvas when layer is added to the map
          onAdd: function () {
            var canvas = document.createElement("canvas");
            canvas.width = this.width;
            canvas.height = this.height;
            this.context = canvas.getContext("2d");
          },

          // called once before every frame where the icon will be used
          render: function () {
            var duration = 1000;
            var t = (performance.now() % duration) / duration;

            var radius = (size / 2) * 0.3;
            var outerRadius = (size / 2) * 0.7 * t + radius;
            var context = this.context;

            // draw outer circle
            context.clearRect(0, 0, this.width, this.height);
            context.beginPath();
            context.arc(
              this.width / 2,
              this.height / 2,
              outerRadius,
              0,
              Math.PI * 2
            );
            context.fillStyle = "rgba(255, 200, 200," + (1 - t) + ")";
            context.fill();

            // draw inner circle
            context.beginPath();
            context.arc(
              this.width / 2,
              this.height / 2,
              radius,
              0,
              Math.PI * 2
            );
            context.fillStyle = "rgba(255, 100, 100, 1)";
            context.strokeStyle = "white";
            context.lineWidth = 2 + 4 * (1 - t);
            context.fill();
            context.stroke();

            // update this image's data with data from the canvas
            this.data = context.getImageData(
              0,
              0,
              this.width,
              this.height
            ).data;

            // continuously repaint the map, resulting in the smooth animation of the dot
            mapObj.triggerRepaint();

            // return `true` to let the map know that the image was updated
            return true;
          },
        };
      }

      if (points[i][4] == "1-Warning") {
        var devId = points[i][0];

        var pulsingDotOrangedevId = {
          width: size,
          height: size,
          data: new Uint8Array(size * size * 4),

          // get rendering context for the map canvas when layer is added to the map
          onAdd: function () {
            var canvas = document.createElement("canvas");
            canvas.width = this.width;
            canvas.height = this.height;
            this.context = canvas.getContext("2d");
          },

          // called once before every frame where the icon will be used
          render: function () {
            var duration = 1000;
            var t = (performance.now() % duration) / duration;

            var radius = (size / 2) * 0.3;
            var outerRadius = (size / 2) * 0.7 * t + radius;
            var context = this.context;

            // draw outer circle
            context.clearRect(0, 0, this.width, this.height);
            context.beginPath();
            context.arc(
              this.width / 2,
              this.height / 2,
              outerRadius,
              0,
              Math.PI * 2
            );
            context.fillStyle = "rgba(255, 200, 200," + (1 - t) + ")";
            context.fill();

            // draw inner circle
            context.beginPath();
            context.arc(
              this.width / 2,
              this.height / 2,
              radius,
              0,
              Math.PI * 2
            );
            context.fillStyle = "orange";
            context.strokeStyle = "white";
            context.lineWidth = 2 + 4 * (1 - t);
            context.fill();
            context.stroke();

            // update this image's data with data from the canvas
            this.data = context.getImageData(
              0,
              0,
              this.width,
              this.height
            ).data;

            // continuously repaint the map, resulting in the smooth animation of the dot
            mapObj.triggerRepaint();

            // return `true` to let the map know that the image was updated
            return true;
          },
        };
      }
    }

    mapObj.on("load", function () {
      var redMarkersArray = [];
      var orangeMarkersArray = [];

      for (i = 0; i < points.length; i++) {
        if (points[i][4] == "2-Alert") {
          var devId = points[i][0];

          mapObj.addImage("pulsing-dot" + devId, pulsingDotdevId, {
            pixelRatio: 2,
          });

          mapObj.addSource("source-points" + devId, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [points[i][2], points[i][3]],
                  },
                },
              ],
            },
          });

          mapObj.addLayer({
            id: "layer-points" + devId,
            type: "symbol",
            source: "source-points" + devId,
            layout: {
              "icon-image": "pulsing-dot" + devId,
            },
          });

          redMarkersArray.push({
            layerID: "layer-points" + devId,
            deviceID: devId,
            deviceName: points[i][1],
            issue: points[i][5],
            lat: points[i][3],
            lng: points[i][2],
            status: points[i][4],
          });
        }

        if (points[i][4] == "1-Warning") {
          var devId = points[i][0];

          mapObj.addImage("orange-pulsing-dot" + devId, pulsingDotOrangedevId, {
            pixelRatio: 2,
          });

          mapObj.addSource("source-orange-points" + devId, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [points[i][2], points[i][3]],
                  },
                },
              ],
            },
          });

          mapObj.addLayer({
            id: "layer-orange-points" + devId,
            type: "symbol",
            source: "source-orange-points" + devId,
            layout: {
              "icon-image": "orange-pulsing-dot" + devId,
            },
          });

          orangeMarkersArray.push({
            layerID: "layer-orange-points" + devId,
            deviceID: devId,
            deviceName: points[i][1],
            issue: points[i][5],
            lat: points[i][3],
            lng: points[i][2],
            status: points[i][4],
          });
        }
      }

      redMarkersArray.forEach(function (item) {
        mapObj.on("click", item.layerID, function (e) {
          alert(item.layerID);
          // if(e.features[0].layer.id == item.layerID){
          //     $('#alert_dev_id').text(item.deviceID)
          //     $('#name').text(item.deviceName)
          //     $('#issue').text(item.issue)

          //     $('#alert-info').show()

          //     $('#alert_devId').val(item.deviceID)
          //     $('#alert_devName').val(item.deviceName)
          //     $('#alert_lat').val(item.lat)
          //     $('#alert_lng').val(item.lng)
          //     $('#alert_Status').val(item.status)
          //     $('#alert_issue').val(item.issue)
          // }
        });
      });

      orangeMarkersArray.forEach(function (item) {
        mapObj.on("click", item.layerID, function (e) {
          alert(item.layerID);
          // if(e.features[0].layer.id == item.layerID){
          //     $('#alert_dev_id').text(item.deviceID)
          //     $('#name').text(item.deviceName)
          //     $('#issue').text(item.issue)

          //     $('#alert-info').show()

          //     $('#alert_devId').val(item.deviceID)
          //     $('#alert_devName').val(item.deviceName)
          //     $('#alert_lat').val(item.lat)
          //     $('#alert_lng').val(item.lng)
          //     $('#alert_Status').val(item.status)
          //     $('#alert_issue').val(item.issue)
          // }
        });
      });
    });
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
      request_status: ApproveOrDeny,
    };
    var SHEET_ID = "2067777639";
    if (user.user_type === "department manager") SHEET_ID = "2067777639";
    if (user.user_type === "building manager") SHEET_ID = "892859524";
    if (user.user_type === "police officer") SHEET_ID = "630404562";

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
        appearance: "success",
        autoDismiss: true,
      });
      setShowRequestDetailsModal(false);
    } catch (e) {
      console.error("Error: ", e);
    }
  };

  const deleteRequestByRowNumber = async (rowNumber, ApproveOrDeny) => {
    let rl = requestList.map((obj) => {
      Sidebar();
      if (obj._rowNumber == rowNumber) {
        addApproveOrDenyRequestToSheet(obj, ApproveOrDeny);
        obj.delete();
      }
    });
    getRequestListSheet();
  };

  function Sidebar() {
    document.getElementById("sidebar").classList.toggle("show");
  }

  const ToggleSidePanel = () => {
    var el = document.getElementById("slide-in-request-penel");
    if (el) el.classList.toggle("show");
  };

  const toggleAllCheckBoxes = (e) => {
    const { name, checked } = e.target;
    buildingsRowsArray = [];
    let updatebuildingList = buildingsList.map((obj, index) => {
      buildingsRowsArray.push({
        value: index,
        checked: checked,
        _rowNumber: obj._rowNumber,
      });
      return { ...obj, lock_down: checked.toString().toUpperCase() };
    });
    setBuildingsList(updatebuildingList);
  };

  const handleChange = (e, _rowNumber) => {
    const { name, value, checked } = e.target;
    let found = buildingsRowsArray.findIndex(
      (i) => i.value.toString() === value.toString()
    );
    if (found === -1) {
      buildingsRowsArray.push({
        value,
        checked: checked,
        _rowNumber,
      });
    } else {
      if (buildingsRowsArray.length > 0)
        buildingsRowsArray[found].checked = checked;
    }
    let updatebuildingList = buildingsList.map((obj, index) => {
      if (index.toString() === value.toString()) {
        return { ...obj, lock_down: checked.toString().toUpperCase() };
      }
      return obj;
    });
    setBuildingsList(updatebuildingList);
  };

  // change buildings color incase of lockdown
  const applyRedColor = () => {
    if(!mapObj.getSource("places")) return;
    var lockdownBuildings = [];
    var features = mapObj.queryRenderedFeatures({ layers: ['places'] });

    features.forEach((fe) => {
      if (buildingNames.includes(fe.properties.name)) {
        lockdownBuildings.push(fe);
      }
    });
    if (typeof mapObj.getLayer('lockdownBuildings') !== 'undefined') {
      mapObj.removeLayer('lockdownBuildings');
      mapObj.removeSource('lockdownBuildings');
    }

    mapObj.addSource('lockdownBuildings', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: lockdownBuildings,
      },
    });
    mapObj.addLayer({
      id: 'lockdownBuildings',
      type: 'fill',
      source: 'lockdownBuildings',
      layout: {},
      paint: {
        'fill-outline-color': '#1F2C40',
        'fill-color': '#ff0000',
      },
    });
  };

  const updateBuildingRows = async () => {
    var __rowNumber, __checked;
    for (let index = 0; index < buildingsRowsArray.length; index++) {
      __rowNumber = buildingsRowsArray[index]._rowNumber;
      __checked = buildingsRowsArray[index].checked;
      buildingsRows.map((__obj) => {
        if (__obj._rowNumber === __rowNumber) {
          __obj.lock_down = __checked;
          __obj.save();
        }
      });
    }
    lockDownInAnyBuilding = false;
    buildingsList.map((obje) => {
      if (obje.lock_down.toString() === "TRUE") {
        lockDownInAnyBuilding = true;
      }
    });
    applyRedColor();
    setShowLockDown(false);
  };
  const lockDownModal = () => {
    if (showLockDown)
      return (
        <>
          <Modal show={showLockDown} onHide={() => setShowLockDown(false)}>
            <Modal.Header>
              <Modal.Title>What Buildings to Lockdown?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <span className="text-dark">All:</span>
              <hr className="modal-line" />
              <label className="container mb-4">
                All Buildings
                <input
                  type="checkbox"
                  name="checkAll"
                  onChange={toggleAllCheckBoxes}
                />
                <span className="checkmark"></span>
              </label>
              <span className="text-dark">Specific:</span>
              <div className="checkboxes-content">
                {buildingsList.map((obj, index) => {
                  return (
                    <label className="container" key={index + 1}>
                      {" "}
                      <span className="specific-text">{obj.name}</span>
                      <br />
                      <span className="sub-heading-text">{obj.desc}</span>
                      <input
                        type="checkbox"
                        name="buildingArr"
                        value={index}
                        checked={JSON.parse(obj.lock_down.toLowerCase())}
                        onChange={(e) => handleChange(e, obj._rowNumber)}
                      />
                      <span className="checkmark"></span>
                    </label>
                  );
                })}
              </div>
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-center">
              <button
                type="button"
                className="btn btn-outline-secondary modal-footer-btn"
                onClick={() => setShowLockDown(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary modal-footer-btn"
                onClick={updateBuildingRows}
              >
                Confirm
              </button>
            </Modal.Footer>
          </Modal>
        </>
      );
  };

  const loadGeoJsonPlacesSourcesAndLayers = (mapInstance) => {
    if (mapInstance.getSource("places")) return;
    mapInstance.addSource("places", {
      type: "vector",
      url: "mapbox://alexmahnke.0ywvbtoi",
    });
    // Add a layer showing the places.
    mapInstance.addLayer({
      "id": "places",
      "type": "fill",
      "source": "places",
      "source-layer": "all_buildings-27vwin",
      "minzoom": 16,
      "maxzoom": 18,
      "layout": {},
      "paint": {
        "fill-color": "#1F2C40", // blue color fill
        // "fill-outline-color": "#1daefc",
        "fill-opacity": 0
      },
    });

    mapInstance.addLayer({
      'id': 'building-labels',
      'type': 'symbol',
      'source': 'places',
      "source-layer": "all_buildings-27vwin",
      "minzoom": 16,
      'layout': {
      'text-field': ['get', 'name'],
      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
      'text-radial-offset': 0.5,
      'text-justify': 'auto',
      "text-size": 10
      },
      paint: {
        "text-color": "#ffffff"
      }
      });

    // // When a click event occurs on a feature in the places layer, open a popup at the
    // // location of the feature, with description HTML from its properties.
    mapInstance.on("click", "places", function (e) {
      var lngLat = e.lngLat;
      var features = e.features[0];
      var props = features.properties;
      // buildingsData.map((obj) => {
      //     if(props.name === obj.building_name){
      //         setBuildingClickedOn(obj);
      //         hideEngineeringHallFloorSourcesAndLayers(mapObj, "hide-all");
      //         hideFloorSourcesAndLayers(mapObj, "hide-all");
      //         if( mapInstance.getZoom() < 18 ){
      //           mapInstance.flyTo({
      //             center: [lngLat.lng, lngLat.lat],
      //             zoom: 18.5,
      //             bearing: 0,
      //             speed: 0.8, // make the flying slow
      //             curve: 1, // change the speed at which it zooms out
      //             easing: function (t) {
      //             return t;
      //             },
      //             essential: true
      //           });
      //         }else{
      //           mapInstance.flyTo({
      //             center: [lngLat.lng, lngLat.lat],
      //             speed: 0.8, // make the flying slow
      //             curve: 1, // change the speed at which it zooms out
      //             easing: function (t) {
      //             return t;
      //             },
      //             essential: true
      //           });
      //         }
      //     }
      // });

      // if (typeof mapInstance.getLayer("selectedBuilding") !== "undefined") {
      //   mapInstance.removeLayer("selectedBuilding");
      //   mapInstance.removeSource("selectedBuilding");
      // }

      // mapInstance.addSource("selectedBuilding", {
      //   type: "geojson",
      //   data: features.toJSON(),
      // });
      // mapInstance.addLayer({
      //   id: "selectedBuilding",
      //   type: "fill",
      //   source: "selectedBuilding",
      //   layout: {},
      //   paint: {
      //     "fill-outline-color": "#1F2C40",
      //     "fill-color": "#178fed",
      //   },
      // });

      // var popup =
      //   '<div class="leaflet-popup  leaflet-zoom-animated" ><div class="leaflet-popup-content-wrapper"><div class="leaflet-popup-content" style="width: 311px;"><div class="content-wrapper clearfix">' +
      //   '<div class="popup-row">' +
      //   '<div class="popup-col mo-img">' +
      //   '<img src="https://map.wisc.edu/rails/active_storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBckFDIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--352c73a8c42905f2c6e0148f641c94f1e84e9dc1/Muir_Woods.jpg" alt="" data-modal-link="/api/v1/map_objects/552.html" class="thumbnail">' +
      //   "</div>" +
      //   '<div class="popup-col">' +
      //   "<h3>" +
      //   e.features[0].properties.name +
      //   "</h3><p></p></div></div>" +
      //   '<p class="align-right">' +
      //   '<a href="#" data-modal-link="/api/v1/map_objects/552.html" class="more_link" tabindex="1">' +
      //   "More " +
      //   '<svg aria-hidden="true" id="uw-symbol-more" viewBox="0,0,1792,1792">' +
      //   "<title>More</title>" +
      //   '<path d="M979 960q0 13-10 23l-466 466q-10 10-23 10t-23-10l-50-50q-10-10-10-23t10-23l393-393-393-393q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l466 466q10 10 10 23zm384 0q0 13-10 23l-466 466q-10 10-23 10t-23-10l-50-50q-10-10-10-23t10-23l393-393-393-393q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l466 466q10 10 10 23z"></path>' +
      //   "</svg>" +
      //   "</a>" +
      //   "</p>" +
      //   '</div></div></div><div class="leaflet-popup-tip-container"><div class="leaflet-popup-tip"></div></div></div>';
      // new mapboxgl.Popup()
      //   .setLngLat(e.lngLat)
      //   .setHTML(popup)
      //   .addTo(mapInstance);


    });

    // // Change the cursor to a pointer when the mouse is over the places layer.
    // mapInstance.on("mouseenter", "places", function () {
    //   mapInstance.getCanvas().style.cursor = "pointer";
    // });

    // // Change it back to a pointer when it leaves.
    // mapInstance.on("mouseleave", "places", function () {
    //   mapInstance.getCanvas().style.cursor = "";
    // });
  };


  const renderEngineeringHallSourceAndLayer = (floorClicked, indexNumber) => {
    let engineeringHallFloorArrayUpdated = engineeringHallFloorArray.map((obj, index) => {
        if(index === indexNumber)
          return { ...obj, active: true}
        return { ...obj, active: false}
    });
    setEngineeringHallFloorArray(engineeringHallFloorArrayUpdated);
    hideEngineeringHallFloorSourcesAndLayers(mapObj, floorClicked);
  }    

  const hideEngineeringHallFloorSourcesAndLayers = (mapInstance, floorNotToHide) => {

    var leyerVisibility;

    engineeringHallFloorArray.forEach( (obj) => {
      leyerVisibility = 'none'
      if(obj.floor === floorNotToHide){
        leyerVisibility = 'visible'
      }
      mapInstance.setLayoutProperty(`${obj.name+'-'+obj.floor}-outline`, "visibility", leyerVisibility);
    });

  }

  const hideFloorSourcesAndLayers = (mapInstance, floorNotToHide) => {
    var leyerVisibility;

    floorArray.forEach( (obj, index) => {
      leyerVisibility = 'none'
      if(obj.floor === floorNotToHide){
        leyerVisibility = 'visible'
      }
      mapInstance.setLayoutProperty(`${obj.name+'-'+obj.floor}-outline`, "visibility", leyerVisibility);
    });
  }

  
  const hideMRHFloorSourcesAndLayers = (mapInstance, floorNotToHide) => {
    var leyerVisibility;

    MRHFloor.forEach( (obj, index) => {
      leyerVisibility = 'none'
      if(obj.floor === floorNotToHide){
        leyerVisibility = 'visible'
      }
      mapInstance.setLayoutProperty(`${obj.name+'-'+obj.floor}-outline`, "visibility", leyerVisibility);
    });
  }

  const hideAndShowPlacesSourcesAndLayers = (mapInstance, leyerVisibility) => {
    if(!mapInstance.getSource("places")) return;
      mapInstance.setLayoutProperty("places", "visibility", leyerVisibility);
      // mapInstance.setLayoutProperty("building-labels", "visibility", leyerVisibility);
  }

  const renderSourceAndLayer1 = (currentNumber) => {
    setBuildingClickedOn({ ...buildingClickedOn, active: parseInt(currentNumber) });
    hideEngineeringHallFloorSourcesAndLayers(mapObj, "hide-all");
    hideFloorSourcesAndLayers(mapObj, "hide-all");
    hideMRHFloorSourcesAndLayers(mapObj, "hide-all");
    hideAndShowPlacesSourcesAndLayers(mapObj, "visible");
    switch (buildingClickedOn.building_name) {
      case "Wendt Library":
        renderSourceAndLayer("first-floor");
        if( parseInt(currentNumber) === 1)
        renderSourceAndLayer("first-floor");
        if( parseInt(currentNumber) === 2)
        renderSourceAndLayer("second-floor");
        if( parseInt(currentNumber) === 3)
        renderSourceAndLayer("third-floor");
        if( parseInt(currentNumber) === 4)
        renderSourceAndLayer("fourth-floor");
        break;

      case "Merit Residence Hall":
        renderRMHSourceAndLayer("first-floor");
        if( parseInt(currentNumber) === 1)
        renderRMHSourceAndLayer("first-floor");
        if( parseInt(currentNumber) === 2)
        renderRMHSourceAndLayer("second-floor");
        if( parseInt(currentNumber) === 3)
        renderRMHSourceAndLayer("third-floor");
        if( parseInt(currentNumber) === 4)
        renderRMHSourceAndLayer("fourth-floor");
      break;
    
      default:
        loadUniversityGroundSourceAndLayer(mapObj);
        loadBodgery(mapObj);
        hideEngineeringHallFloorSourcesAndLayers(mapObj, "eh-first-floor");
        if( parseInt(currentNumber) === 1)
        hideEngineeringHallFloorSourcesAndLayers(mapObj, "eh-first-floor");
        if( parseInt(currentNumber) === 2)
        hideEngineeringHallFloorSourcesAndLayers(mapObj, "eh-second-floor");
        if( parseInt(currentNumber) === 3)
        hideEngineeringHallFloorSourcesAndLayers(mapObj, "eh-third-floor");
        break;
    }

  }

  const renderSourceAndLayer = (floorClicked, indexNumber) => {
    let floorArrayUpdated = floorArray.map((obj, index) => {
        if(index === indexNumber)
          return { ...obj, active: true}
        return { ...obj, active: false}
    });
    setFloorArray(floorArrayUpdated);
    hideFloorSourcesAndLayers(mapObj, floorClicked);
  }

  const renderRMHSourceAndLayer = (floorClicked, indexNumber) => {
    let MRHFloorUpdated = MRHFloor.map((obj, index) => {
        if(index === indexNumber)
          return { ...obj, active: true}
        return { ...obj, active: false}
    });
    setMRHFloor(MRHFloorUpdated);
    hideMRHFloorSourcesAndLayers(mapObj, floorClicked);
  }



  const toggleView = () => {
    setViewIn3d(!viewIn3d);
    var currentCenter = mapObj.getCenter().wrap();
    var centerOflng = currentCenter.lng;
    var centerOflat = currentCenter.lat;
    setZoom(18.5);
    setCenter([centerOflng, centerOflat]);
    // set 3d
    if (!viewIn3d) {
   
     // setCenter([-89.355726877, 43.10844619]);
      setPitch(45);
      // setBearing(-89);
      // set 2d 
    } else {
      
      // setCenter([-89.41068, 43.07561]);
      setPitch(0);
      // setBearing(0);
    }
  };

  const laod3dBuildings = (map) => {
    if(map.getLayer("add-3d-buildings")) return;
        // Insert the layer beneath any symbol layer.
        var layers = map.getStyle().layers;
        var labelLayerId;
        for (var i = 0; i < layers.length; i++) {
          if (layers[i].type === "symbol" && layers[i].layout["text-field"]) {
            labelLayerId = layers[i].id;
            break;
          }
        }
  
        // The 'building' layer in the Mapbox Streets
        // vector tileset contains building height data
        // from OpenStreetMap.
        map.addLayer(
          {
            id: "add-3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            // minzoom: 15,
            paint: {
              "fill-extrusion-color": "#aaa",
  
              // Use an 'interpolate' expression to
              // add a smooth transition effect to
              // the buildings as the user zooms in.
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 1,
            },
          },
  
          labelLayerId
        );
        map.on("click", "add-3d-buildings", async function (e) {
          // var lngLat = e.lngLat;
          var features = e.features[0];
          var props = features.properties;
          var lngLat = e.lngLat;
          // console.log(features);
          
          var tileQuery = 'https://api.mapbox.com/v4/alexmahnke.0ywvbtoi/tilequery/' + lngLat.lng + ","+ lngLat.lat + '.json?radius=5&limit=1&geometry=polygon&dedupe&access_token=pk.eyJ1IjoiYWxleG1haG5rZSIsImEiOiJja25oc3psc2cwbWd2MnZudzA1d2dpOW5wIn0.w7LO2v86HxcaZUPdkmFk7g';
          const res = await axios.get(`${tileQuery}`);
          if(res.status === 200){
              if(res.data.features[0].properties === !undefined)
                  return;
              var placeName = res.data.features[0].properties.name;
              buildingsData.map((obj) => {
                if( placeName === obj.building_name){
                    setBuildingClickedOn(obj);
                    hideEngineeringHallFloorSourcesAndLayers(mapObj, "hide-all");
                    hideFloorSourcesAndLayers(mapObj, "hide-all");
                    hideMRHFloorSourcesAndLayers(mapObj, "hide-all");
                    if( mapObj.getZoom() < 18 ){
                      mapObj.flyTo({
                        center: [lngLat.lng, lngLat.lat],
                        zoom: 18.5,
                        bearing: 0,
                        speed: 0.8, // make the flying slow
                        curve: 1, // change the speed at which it zooms out
                        easing: function (t) {
                        return t;
                        },
                        essential: true
                      });
                    }else{
                      mapObj.flyTo({
                        center: [lngLat.lng, lngLat.lat],
                        speed: 0.8, // make the flying slow
                        curve: 1, // change the speed at which it zooms out
                        easing: function (t) {
                        return t;
                        },
                        essential: true
                      });
                    }
                }
            });
          }
        });
  }


  const loadDoorAnimatedMarkerSourcesAndLayers = () => {

    const images =[
      {url: './markers/24x24.png', id: 'image_1'},
      {url: './markers/42x42.png', id: 'image_2'}
    ];
    images.map(img => {
      mapObj.loadImage(img.url, function (error, res) {
        if (error) throw error;
          mapObj.addImage(img.id, res)
      })
    });
      mapObj.addSource("exit-devices-source", {
        type: "vector",
        url: "mapbox://alexmahnke.ckp4p0nbk00k327nksb3c4ukm-4shxo",
      });

      mapObj.addLayer({
        id: 'exit-devices-layer',
        type: 'symbol',
        source: 'exit-devices-source',
        "source-layer": "Devices",
        "minzoom": 17,
        "maxzoom": 19,
        layout: {
          "icon-image": `${images[1].id}`, // reference the image
          "icon-size": 0.50,
        }
      });

      mapObj.addSource("room-devices-source", {
        type: "vector",
        url: "mapbox://alexmahnke.aoanit2m",
      });

      mapObj.addLayer({
        id: 'room-devices-layer',
        type: 'symbol',
        source: 'room-devices-source',
        "source-layer": "Room_Number-5rzz4j",
        "minzoom": 18.5,
        // "maxzoom": 19,
        layout: {
          "icon-image": `${images[0].id}`, // reference the image
          "icon-size": 0.50,
        }
      });
      mapObj.on("click", "room-devices-layer", function (e) {

        var features = e.features[0];
        var props = features.properties;
        var coordinates = features.geometry.coordinates;
        setValues({ ...values, room_number: props.Name })
        var flc_el = document.getElementById("door-status-panel");
        flc_el.classList.add("show");
        // if (flc_el) {
        //   console.log(flc_el.classList.contains("show"))
        //   if (!flc_el.classList.contains("show")) {
        //     flc_el.classList.remove("show");
        //   }
        // }
        // var el = document.getElementById("door-status-panel");
        // if (el) el.classList.toggle("show");
        console.log(props)
      });
  }

  const loadUniversityGroundSourceAndLayer = (mapInstance) => {
    if (mapInstance.getSource("ug-source")) return;
    mapInstance.addSource("ug-source", {
      type: "vector",
      url: "mapbox://alexmahnke.0foqppfl",
    });

    mapInstance.addLayer({
      id: "ug-layer-outline",
      type: "line",
      source: "ug-source",
      "source-layer": "University-Grounds-6adfp9",
      paint: {
        "line-color": "#1daefc",
        "line-width": 2,
      },
    });
  }

  const loadBodgery = mapInstance => {
    if (mapInstance.getSource("bodgery-1-source")) return;

    mapInstance.addSource("bodgery-1-source", {
      type: "vector",
      url: "mapbox://alexmahnke.4fwc2s0y",
    });

    mapInstance.addLayer({
      id: "bodgery-1-layer-outline",
      type: "line",
      source: "bodgery-1-source",
      "source-layer": "Bodgrey-parcels-2h796p",
      paint: {
        "line-color": "#0066ff",
        "line-width": 2,
      },
    });

    mapInstance.addSource("bodgery-2-source", {
      type: "vector",
      url: "mapbox://alexmahnke.3i41fj3f",
    });


    mapInstance.addLayer({
      id: "bodgery-2-layer-outline",
      type: "line",
      source: "bodgery-2-source",
      "source-layer": "Bodgrey-boundary-19uri7",
      paint: {
        "line-color": "#0066ff",
        "line-width": 2,
      },
    });

    mapInstance.addSource("bodgery-3-source", {
      type: "vector",
      url: "mapbox://alexmahnke.0on3svda",
    });


    mapInstance.addLayer({
      id: "bodgery-3-layer-outline",
      type: "line",
      source: "bodgery-3-source",
      "source-layer": "Bodgrey_points-7pp0nv",
      paint: {
        "line-color": "#0066ff",
        "line-width": 2,
      },
    });
  }

  
  const loadAllSourcesAndLayers = mapInstance => {
    floorArray.map((obj) => {
      if (mapInstance.getSource(`${obj.name+'-'+obj.floor}-source`)) return;
      mapInstance.addSource(`${obj.name+'-'+obj.floor}-source`, {
        type: "vector",
        url: `mapbox://${obj.layer_id}`,
      });
      mapInstance.addLayer({
        id: `${obj.name+'-'+obj.floor}-outline`,
        type: "line",
        source: `${obj.name+'-'+obj.floor}-source`,
        "source-layer": `${obj.layer_name}`,
        paint: {
          "line-color": "#0066ff",
          "line-width": 1,
        },
      });
    });

    MRHFloor.map((obj) => {
      if (mapInstance.getSource(`${obj.name+'-'+obj.floor}-source`)) return;
      mapInstance.addSource(`${obj.name+'-'+obj.floor}-source`, {
        type: "vector",
        url: `mapbox://${obj.layer_id}`,
      });
      mapInstance.addLayer({
        id: `${obj.name+'-'+obj.floor}-outline`,
        type: "line",
        source: `${obj.name+'-'+obj.floor}-source`,
        "source-layer": `${obj.layer_name}`,
        paint: {
          "line-color": "#0066ff",
          "line-width": 1,
        },
      });
    });

    engineeringHallFloorArray.map((obj) => {
      if (mapInstance.getSource(`${obj.name+'-'+obj.floor}-source`)) return;
      mapInstance.addSource(`${obj.name+'-'+obj.floor}-source`, {
        type: "vector",
        url: `mapbox://${obj.layer_id}`,
      });
      mapInstance.addLayer({
        id: `${obj.name+'-'+obj.floor}-outline`,
        type: "line",
        source: `${obj.name+'-'+obj.floor}-source`,
        "source-layer": `${obj.layer_name}`,
        paint: {
          "line-color": "#0066ff",
          "line-width": 1,
        },
      });
    });

  }


  useEffect(() => {
    getRequestListSheet();
    getBuildingList();
    getPulsingDotListSheet();

    mapboxgl.accessToken =
      "pk.eyJ1IjoiYWxleG1haG5rZSIsImEiOiJja25oc3psc2cwbWd2MnZudzA1d2dpOW5wIn0.w7LO2v86HxcaZUPdkmFk7g";
    var hoveredStateId = null;

    var map = mapObj = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/alexmahnke/cko04gqw62spj17pjon947pwz",
      center: center,
      zoom: zoom,
      minZoom: 12,
      pitch: pitch,
      antialias: true,
      bearing: bearing,
    });

    map.on("load", function () {
      loadGeoJsonPlacesSourcesAndLayers(map);
      loadDoorAnimatedMarkerSourcesAndLayers();
      loadUniversityGroundSourceAndLayer(map);
      // loadBodgery(map);


      
      loadAllSourcesAndLayers(map);


      // hidding all the visible layers 
      hideEngineeringHallFloorSourcesAndLayers(map, "hide-all");
      hideFloorSourcesAndLayers(map, "hide-all");
      hideMRHFloorSourcesAndLayers(map, "hide-all");
      map.on("zoom", function () {
        var currentZoom = map.getZoom();

        if (currentZoom >= 18) {
          // removePlacesSourceAndLeyers(map);


          hideAndShowPlacesSourcesAndLayers(map, "visible");
          renderSourceAndLayer("second-floor");
          var flc_el = document.getElementById("floor-list-container");
          if (flc_el) {
            if (!flc_el.classList.contains("show")) {
              flc_el.classList.add("show");
            }
          }
        }
        if (currentZoom < 18) {
          var flc_el = document.getElementById("floor-list-container");
          if (flc_el) {
            if (!flc_el.classList.contains("show")) {
              flc_el.classList.remove("show");
            }
          }
          // removeAllFloorsSourcesAndLayers(map);
          hideFloorSourcesAndLayers(map, "hide-all");
          loadGeoJsonPlacesSourcesAndLayers(map);
        }
      });
      laod3dBuildings(map);
    });
    // new code start

    // parameters to ensure the model is georeferenced correctly on the map
    var modelOrigin = [-89.355537699, 43.10817699];
    var modelAltitude = 0;
    var modelRotate = [Math.PI / 2, 1.59, 0.0];

    var modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
    );

    // transformation parameters to position, rotate and scale the 3D model onto the map
    var modelTransform = {
      translateX: modelAsMercatorCoordinate.x,
      translateY: modelAsMercatorCoordinate.y,
      translateZ: modelAsMercatorCoordinate.z,
      rotateX: modelRotate[0],
      rotateY: modelRotate[1],
      rotateZ: modelRotate[2],
      /* Since our 3D model is in real world meters, a scale transform needs to be
       * applied since the CustomLayerInterface expects units in MercatorCoordinates.
       */
      scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
    };

    var THREE = window.THREE;

    // configuration of the custom layer for a 3D model per the CustomLayerInterface
    var customLayer = {
      id: "3d-model",
      type: "custom",
      renderingMode: "3d",
      onAdd: function (map, gl) {
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // create two three.js lights to illuminate the model
        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);

        var directionalLight2 = new THREE.DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight2);

        var directionalLight3 = new THREE.DirectionalLight(0xffffff);
        directionalLight3.position.set(0, 0, 100).normalize();
        this.scene.add(directionalLight3);

        // use the three.js GLTF loader to add the 3D model to the three.js scene
        var loader = new THREE.GLTFLoader();
        loader.load(
          "./the_bodgery/the_bodgery.gltf",
          function (gltf) {
            this.scene.add(gltf.scene);
          }.bind(this)
        );
        this.map = map;

        // use the Mapbox GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        });

        this.renderer.autoClear = false;
      },
      render: function (gl, matrix) {
        var rotationX = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(1, 0, 0),
          modelTransform.rotateX
        );
        var rotationY = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 1, 0),
          modelTransform.rotateY
        );
        var rotationZ = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 0, 1),
          modelTransform.rotateZ
        );

        var m = new THREE.Matrix4().fromArray(matrix);
        var l = new THREE.Matrix4()
          .makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ
          )
          .scale(
            new THREE.Vector3(
              modelTransform.scale,
              -modelTransform.scale,
              modelTransform.scale
            )
          )
          .multiply(rotationX)
          .multiply(rotationY)
          .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
      },
    };

    map.on("style.load", function () {
      map.addLayer(customLayer, "waterway-label");
    });

    // var nav = new mapboxgl.NavigationControl({
    //     showCompass:null

    // });
    // map.addControl(nav, 'top-left');

    // map.doubleClickZoom.disable();
    // map.dragRotate.disable();
    // map.dragPan.disable();
    // map.touchZoomRotate.disableRotation();

    //  new code end here ...
  }, [center]);

  const toggleCameraView = () => {

      if(showCameraModal){
        
        mapObj.flyTo({
          center: [-89.4086392511042,  43.07144355430859],
          zoom: 14
        });
        document.querySelectorAll(".add-camera-spot").forEach(el => el.remove());
        toggleCameraModal();
      }else{
      // create a HTML element for each feature
      var camera = document.createElement('div');
      camera.className = 'add-camera-spot';

      // make a marker for each feature and add to the map
      var marker = new mapboxgl.Marker({
          element: camera,
      }).setLngLat([-89.35555374175941, 43.10847137790425])
          .addTo(mapObj);
      
      marker.getElement().addEventListener('click', () => {
          setShowCameraModal(true);
      });

      mapObj.flyTo({
          center: [-89.35555374175941, 43.10847137790425],
          zoom: 17
      });
    }
  }

  const addDevice = () => {
    var el = document.getElementById("add-device-wrapper");
    if (el) el.classList.toggle("show");

    
    const markerEl = document.querySelector('.mapboxgl-marker');
    
    if (markerEl) {
       markerEl.remove();
    }else{
      var marker = new mapboxgl.Marker({
        draggable: true
      })
      .setLngLat([-89.40864500185694, 43.071436442382236])
      .addTo(mapObj);

    marker.on('dragend', function() {
      var currentlngLat = marker.getLngLat();

      // coordinates.innerHTML =
      //     'Longitude: ' + lngLat.lng + '<br />Latitude: ' + lngLat.lat;
      var Latitude = currentlngLat.lat;
      var Longitude = currentlngLat.lng;
      console.log(Latitude, Longitude);
      setLngLat({ lat: Latitude, lng: Longitude});
    });
    }
  }

  const cameraModal = () => {
      return <>  
        <Modal show={showCameraModal} onHide={toggleCameraView} className="mt-5 modal-bg-black">
          <Modal.Header closeButton>
            {/* <Modal.Title>Modal heading</Modal.Title> */}
          </Modal.Header>
          <Modal.Body>
          <video className="w-100 h-auto mb-5" autoplay muted>
              <source src="https://f5.aos.wisc.edu/webcam_movies/latest_northwest_today_1024x768.mp4 " type="video/mp4" />
              Your browser does not support the video tag.
          </video>
          </Modal.Body>
        </Modal>
      </>
  }


  const floorList = _ => {
    if( Object.keys(buildingClickedOn).length === 0 )
    return "";

    var numberOfFloor = [...Array( parseInt(buildingClickedOn.no_of_floor) ).keys()];

    var row = numberOfFloor.map( (obj, i) => {
      return <li
      key={i + 1}
      className={`floor-list-number ${buildingClickedOn.active === i + 1  && "active"}`}
      onClick={ () => renderSourceAndLayer1(i + 1) }
    >
      <span>{i + 1}</span>
    </li>
    });
    return row;

  }

  return (
    <>
      {prDisplay === true && (
        <AccessRequestModal
          hideRequestModal={hideModal}
          buildingInfo={buildingInfo}
        />
      )}

      {user.user_type === "student" && (
        <div
          className="req-info-home slide-from-left"
          id="slide-in-request-penel"
        >
          <div className="float-right">
            <button type="button" onClick={ToggleSidePanel}>
              &times;
            </button>
          </div>
          <br />
          <p>
            <span className="light">Building</span> {buildingInfo.name}
          </p>
          <p>
            <span className="light">Door(s)</span> {buildingInfo.doors}
          </p>
          <p>
            <span className="light">Type</span> {buildingInfo.type}
          </p>
          <button
            type="button"
            className="mt-3 req-info-home-btn"
            onClick={() => {
              ToggleSidePanel();
              setPrDisplay(true);
            }}
          >
            Request Access
          </button>
        </div>
      )}

      {!showRequestDetailsModal && !prDisplay && (
        <div className="icons">
          <ul>
            {(user.user_type === "building manager" ||
              user.user_type === "department manager") && (
              <li>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={Sidebar}
                >
                  <i className="fas fa-user mr-2"></i>
                  Requests
                  <span className="badge badge-pill badge-danger">
                    {requestList.length}
                  </span>
                </button>
              </li>
            )}
            {user.user_type === "police officer" && (
              <>
                <li>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={Sidebar}
                  >
                    <i className="fas fa-user mr-2"></i>
                    Requests
                    <span className="badge badge-pill badge-danger">
                      {requestList.length}
                    </span>
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => addDevice()}
                  >
                    <i className="fas fa-pencil-alt"></i>
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => toggleCameraView()}
                  >
                    <i className="fas fa-video"></i>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowLockDown(true)}
                  >
                    <i className="fas fa-user-lock"></i>
                  </button>
                </li>
              </>
            )}
            <li className="float-right p-0">
              <button
                type="button"
                className="btn btn-outline-danger pr-4 pl-4"
                onClick={() => {
                  localStorage.removeItem("userInfo");
                  window.location.href = "/Login";
                }}
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </li>

            <li className="float-right p-0 mr-2">
              <button
                type="button"
                className="btn btn-outline-info pr-4 pl-4"
                style={{ borderRadius: 50 }}
                onClick={toggleView}
              >
                {viewIn3d ? "3d" : "2d"}
              </button>
            </li>
          </ul>
        </div>
      )}

      <div className="map-container" ref={mapContainer} id="map-container" />
      {/* add device form */}
      <div className="left-panel-slide-in" id="add-device-wrapper">
        <h4 className="text-center">Add Device</h4>
        <div>
          Device Id: <strong>A4</strong>
        </div>
        <div>
          Latitude: <strong>{ (lngLat.lat).toFixed(8) }</strong>
        </div>
        <div>
          Longitude: <strong>{ (lngLat.lng).toFixed(8) }</strong>
        </div>
        <hr />
        <div className="custom-group">
          <label>
            Device Name<span className="text-danger">*</span>
          </label>
          <input
            type="text"
            name="device_name"
            value={values.device_name || ""}
            onChange={onChange}
          />
        </div>

        <div className="pb-2 pt-3">
          <div className="d-flex justify-content-between">
            <div className="d-inline">
              Building<span className="text-danger">*</span>
            </div>
            <div className="d-inline">
              Floor<span className="text-danger">*</span>
            </div>
          </div>
          <div className="d-flex justify-content-between">
            <div className="d-inline building-text">University Hall</div>
            <div className="text-center pr-3 building-text">3</div>
          </div>
        </div>
        <div className="mt-3 pt-2">
          Device Type<span className="text-danger">*</span>
          <div className="row mt-3">
            <div className="col-sm-6">
              <button
                type="button"
                className={
                  "btn btn-outline-danger pl-2 pr-2 " +
                  (deviceType === "Lock" && "active")
                }
                onClick={() => setDeviceType("Lock")}
              >
                <i className="fas fa-user-lock"></i> Lock
              </button>
            </div>
            <div className="col-sm-6">
              <button
                type="button"
                className={
                  "btn btn-outline-primary pl-2 pr-2 " +
                  (deviceType === "Camera" && "active")
                }
                onClick={() => setDeviceType("Camera")}
              >
                <i className="fas fa-video"></i> Camera
              </button>
            </div>
          </div>
        </div>

        <hr className="mt-3 mb-2" />
        {deviceType === "Lock" && (
          <div className="mt-2">
            Lock Type<span className="text-danger">*</span>
            <div className="type-p mt-2">
              <InputRadio
                type="Building Entrance"
                selectedType={selectedType}
                change={onValueChange}
                className="in-radio radio-small pb-2"
              />
              <InputRadio
                type="Interior Public"
                selectedType={selectedType}
                change={onValueChange}
                className="in-radio radio-small pb-2"
              />
              <InputRadio
                type="Interior Private"
                selectedType={selectedType}
                change={onValueChange}
                className="in-radio radio-small pb-2"
              />
              <InputRadio
                type="Tool / Machine"
                selectedType={selectedType}
                change={onValueChange}
                className="in-radio radio-small pb-2"
              />
              <InputRadio
                type="Locker"
                selectedType={selectedType}
                change={onValueChange}
                className="in-radio radio-small pb-2"
              />
            </div>
          </div>
        )}
        {deviceType === "Camera" && (
          <>
            <div className="custom-group">
              <label>
                Camera IP / URL<span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="camera_address"
                value={values.camera_address}
                onChange={onChange}
              />
            </div>
            <div className="mt-2">
              Preview
              <video
                className="h-auto mb-5"
                style={{ width: 250, borderRadius: 5, marginTop: 5 }}
                autoPlay
                muted
              >
                <source
                  src={values.camera_address}
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </>
        )}

        <div className="row mt-3">
          <div className="col-sm-6">
            <button
              type="button"
              className="btn btn-outline-danger pr-4 pl-4"
              onClick={() => setDeviceType("Lock")}
            >
              {" "}
              Cancel
            </button>
          </div>
          <div className="col-sm-6">
            <button
              type="button"
              className="btn btn-outline-success pr-4 pl-4"
              onClick={() => setDeviceType("Lock")}
            >
              {" "}
              Add
            </button>
          </div>
        </div>
      </div>
      {/* add device */}

      {/* door status panel */}
      <div className="left-panel-slide-in" id="door-status-panel">
        <h4 className="text-center">Status</h4>
        <div className="p-3">
          <div className="mb-3">
            Device Id: <span className="text-18">A4</span>
          </div>
          <div className="mb-3">
            Name:{" "}
            <span className="text-18">Room {values.room_number || ""}</span>
          </div>
          <div className="mb-1">
            Type: <span className="text-18">Door Interior Public</span>
          </div>
        </div>

        { (!viewHistory) ? <div className="text-center">
          <button
            type="button"
            className="btn btn-outline-primary pl-2 pr-2"
            onClick={() => setViewHistory(true)}
          >
            {" "}
            View History
          </button>
        </div>
        : <>
        <hr className="mt-2 mb-2"/>
        <div className="row-status mt-3 d-flex justify-content-between">
          <div>Just Now</div>
          <div className="text-center">
            <div className="icon-open-door"></div>
          </div>
          <div>Open Door</div>
        </div>
        <div className="row-status  d-flex justify-content-between">
          <div>Date Time</div>
          <div>
            <div className="icon-unlocked"></div>
          </div>
          <div>Unlocked</div>
        </div>
        <div className="row-status  d-flex justify-content-between">
          <div>Date Time</div>
          <div>
            <div className="icon-locked"></div>
          </div>
          <div>Locked</div>
        </div>
        <div className="row-status  d-flex justify-content-between">
          <div>Date Time</div>
          <div>
            <div className="icon-closed-door"></div>
          </div>
          <div>Closed Door</div>
        </div>
        <div className="row-status  d-flex justify-content-between">
          <div>Date Time</div>
          <div>
            <div className="icon-open-door"></div>
          </div>
          <div>Open Door</div>
        </div>
        <div className="row-status  d-flex justify-content-between">
          <div>Date Time</div>
          <div>
            <div className="icon-unlocked"></div>
          </div>
          <div>Unlocked</div>
        </div>
        <div className="row-status  d-flex justify-content-between">
          <div>Date Time</div>
          <div>
            <div className="icon-added-user"></div>
          </div>
          <div>Added User</div>
        </div>
        </>
        }
      </div>

      {/* door status panel */}
      <div
        className="floor-list-container text-center"
        id="floor-list-container"
      >
        <div className="p-2">Floor</div>
        <ul>
          {/* {floorArray.map((obj, index) => {
            return (
              <li
                key={index + 1}
                className={`floor-list-number ${obj.active && "active"}`}
                onClick={() => renderSourceAndLayer(obj.floor, index)}
              >
                <span>{index + 1}</span>
              </li>
            );
          })} */}

          { floorList() }
        </ul>
      </div>

      {/* university Hall */}

      {user.user_type !== "student" && (
        <div className="request-sidebar" id="sidebar">
          {requestList.length !== 0 ? (
            <>
              {requestList.map((obj, index) => (
                <RequestItem
                  request={obj}
                  key={index}
                  setRequest={setRequestItemFunc}
                />
              ))}{" "}
            </>
          ) : (
            <h6 className="text-center text-danger">No pending requests!</h6>
          )}
        </div>
      )}
      {showRequestDetailsModal === true && (
        <RequestDetailsModal
          hideSRDM={hideSRDM}
          stepNumber={stepNumber}
          requestItemInfo={singleRequestItem}
          deleteRequestByRowNumber={deleteRequestByRowNumber}
        />
      )}
      {/* Modal */}
      {lockDownModal()}
      {cameraModal()}
      {lockDownInAnyBuilding === true && (
        <h1 className="emergency">EMERGENCY ALERT: BUILDINGS IN LOCKDOWN</h1>
      )}
    </>
  );
};

export default Requests;