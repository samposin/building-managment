import React, { useRef, useEffect, useState } from 'react';
import { Container } from "react-bootstrap";
import Page from '../../components/page';
import SideBar from "../../components/sideBar";
import mapboxgl from 'mapbox-gl';

export default function Home() {
    const mapContainer = useRef();
    
    useEffect(() => {
          // mapboxgl.accessToken =
          //     'pk.eyJ1IjoiYWxleG1haG5rZSIsImEiOiJja25oc3psc2cwbWd2MnZudzA1d2dpOW5wIn0.w7LO2v86HxcaZUPdkmFk7g';  
          // var map = new mapboxgl.Map({
          //   container: mapContainer.current,
          //   style: 'mapbox://styles/alexmahnke/cko04gqw62spj17pjon947pwz',
          //   center: [-89.41068, 43.07561],
          //   zoom: 15
          // });
  
          // map.on('load', function () {       
          //   // loadGeoJsonPlacesSourcesAndLayers(map);
          // });






    mapboxgl.accessToken = 'pk.eyJ1IjoiYWxleG1haG5rZSIsImEiOiJja25oc3psc2cwbWd2MnZudzA1d2dpOW5wIn0.w7LO2v86HxcaZUPdkmFk7g';
    var map = (window.map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/alexmahnke/cko04gqw62spj17pjon947pwz',
        zoom: 19,
        maxZoom:21,
        minZoom:18.7, 
        center:  [-89.355726877, 43.108446190],
        pitch: 45,
        antialias: true, 
        bearing: - 89 
        
    }));

    
class PitchToggle {
  constructor({ bearing = -88, pitch = 45, minpitchzoom = null }) {
    this._bearing = bearing;
    this._pitch = pitch;
    this._minpitchzoom = minpitchzoom;
  }

  onAdd(map) {
    this._map = map;
    let _this = this;

    this._btn = document.createElement("button");
    this._btn.className = "mapboxgl-ctrl-icon mapboxgl-ctrl-pitchtoggle-3d";
    this._btn.type = "button";
    this._btn["aria-label"] = "Toggle Pitch";
    this._btn.onclick = function() {
      if (map.getPitch() === 0) {
        let options = { pitch: _this._pitch, bearing: _this._bearing };
        if (_this._minpitchzoom && map.getZoom() > _this._minpitchzoom) {
          options.zoom = _this._minpitchzoom;
        }
        map.easeTo(options);
        _this._btn.className =
          "mapboxgl-ctrl-icon mapboxgl-ctrl-pitchtoggle-2d";
      } else {
        map.easeTo({ pitch: 0, bearing: -89 });
        _this._btn.className =
          "mapboxgl-ctrl-icon mapboxgl-ctrl-pitchtoggle-3d";
      }
    };

    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";
    this._container.appendChild(this._btn);

    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}



map.addControl(new PitchToggle({ minpitchzoom: 20 }), "top-right");



    // parameters to ensure the model is georeferenced correctly on the map
    var modelOrigin = [-89.355537699, 43.108176990];
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
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
    };

    var THREE = window.THREE;

    // configuration of the custom layer for a 3D model per the CustomLayerInterface
    var customLayer = {
        id: '3d-model',
        type: 'custom',
        renderingMode: '3d',
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
                './the_bodgery/the_bodgery.gltf',
                function (gltf) {
                    this.scene.add(gltf.scene);
                }.bind(this)
            );
            this.map = map;

            // use the Mapbox GL JS map canvas for three.js
            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
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
        }
    };

    map.on('style.load', function () {
        map.addLayer(customLayer, 'waterway-label');
    });
     
  



    var nav = new mapboxgl.NavigationControl({
        showCompass:null


    });
    map.addControl(nav, 'top-left');


    map.doubleClickZoom.disable();
    map.dragRotate.disable();
    map.dragPan.disable();
    map.touchZoomRotate.disableRotation();
  
   
    

      }, []);
    return (
         <Container style={{maxWidth: "100%", paddingRight: "0",paddingLeft: "0"}}>
                <SideBar>
                    <Page> 
                        <div className="home p-1">
                            <div ref={mapContainer} className="h-100 w-100" style={{ borderRadius: 75 }}/>
                            {/* <h3>hello</h3> */}
                            {/* <div className="map-container" ref={mapContainer} id="map-container" /> */}
                        </div>
                    </Page>   
                </SideBar>
        </Container>
    )
}